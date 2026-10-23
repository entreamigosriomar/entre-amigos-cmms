-- =====================================================================
-- 05 — Chamados dos líderes + hierarquia Área › Setor › Equipamento
-- Projeto: manutencao-entre-amigos (Supabase)  •  Versão: V18.1
--
-- O que faz (só ACRESCENTA):
--   1. Setor passa a pertencer a uma Área (setores.area_id), como no
--      cadastro: Cozinha › Sobremesa › Micro-ondas.
--      Cada equipamento/item ganha uma Categoria (Móveis, Elétrica,
--      Hidráulica, Segurança, Limpeza, Pintura...). No chamado, a
--      categoria escolhida filtra os itens que aparecem.
--   2. Ordens de serviço ganham: origem (CHAMADO, PREVENTIVA, INTERNA),
--      respostas de urgência do líder, item não cadastrado, e a
--      confirmação da solução pelo líder (Resolvido / Reabrir).
--   3. Função confirmar_chamado(): só quem abriu o chamado confirma
--      ou reabre. Reabrir devolve a OS para ABERTA.
--   4. Perfil OPERADOR passa a ser exibido como "Líder" na tela.
--   5. Técnico pode mudar a situação do equipamento (função própria).
--   6. Usuário criado no Supabase Auth ganha perfil inativo automático.
--
-- Rode depois do 02 e do 04.
-- =====================================================================

begin;

-- 1. Área › Setor
alter table public.setores add column if not exists area_id uuid references public.areas(id) on delete set null;
create index if not exists setores_area_idx on public.setores (area_id);

-- 1b. Categoria do equipamento/item (filtra o que aparece no chamado)
alter table public.equipamentos add column if not exists categoria text;
create index if not exists equipamentos_categoria_idx on public.equipamentos (unidade_id, categoria);

-- Categorias padrão em todas as unidades (o diretor edita depois pela tela)
insert into public.categorias_manutencao (unidade_id, nome, ativo)
select u.id, c.nome, true
from public.unidades u
cross join (values ('Móveis'),('Elétrica'),('Hidráulica'),('Segurança'),('Limpeza'),('Pintura'),
                   ('Equipamentos de cozinha'),('Refrigeração'),('Climatização'),('Exaustão'),
                   ('TI e KDS'),('Predial')) as c(nome)
on conflict (unidade_id, nome) do nothing;

-- 2. Chamados
alter table public.ordens_servico
  add column if not exists origem            text not null default 'INTERNA',
  add column if not exists urgencia          jsonb,
  add column if not exists item_descricao    text,
  add column if not exists confirmacao       text,
  add column if not exists confirmado_em     timestamptz,
  add column if not exists confirmacao_obs   text,
  add column if not exists reaberturas       integer not null default 0;

alter table public.ordens_servico
  drop constraint if exists ordens_servico_origem_chk,
  add  constraint ordens_servico_origem_chk check (origem in ('CHAMADO','PREVENTIVA','INTERNA')),
  drop constraint if exists ordens_servico_confirmacao_chk,
  add  constraint ordens_servico_confirmacao_chk
       check (confirmacao is null or confirmacao in ('PENDENTE','CONFIRMADO','REABERTO'));

create index if not exists ordens_servico_solicitante_idx on public.ordens_servico (solicitante_id, status);
create index if not exists ordens_servico_equip_aberta_idx on public.ordens_servico (equipamento_id)
  where status not in ('CONCLUIDA','CANCELADA');

-- Ao concluir um CHAMADO, a confirmação do líder fica pendente.
create or replace function public.trg_os_confirmacao()
returns trigger
language plpgsql
as $$
begin
  if new.origem = 'CHAMADO' and new.status = 'CONCLUIDA'
     and old.status is distinct from 'CONCLUIDA' then
    new.confirmacao := 'PENDENTE';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_os_confirmacao on public.ordens_servico;
create trigger trg_os_confirmacao before update on public.ordens_servico
  for each row execute function public.trg_os_confirmacao();

-- 3. Confirmação pelo líder
create or replace function public.confirmar_chamado(p_os_id uuid, p_resolvido boolean, p_obs text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_os ordens_servico%rowtype;
begin
  select * into v_os from ordens_servico where id = p_os_id;
  if not found then
    raise exception 'Chamado não encontrado.';
  end if;
  if v_os.solicitante_id is distinct from auth.uid() and not public.is_gestao() then
    raise exception 'Só quem abriu o chamado (ou a gestão) pode confirmar.';
  end if;
  if v_os.status <> 'CONCLUIDA' then
    raise exception 'O chamado ainda não foi concluído pela manutenção.';
  end if;

  if p_resolvido then
    update ordens_servico
       set confirmacao = 'CONFIRMADO', confirmado_em = now(), confirmacao_obs = p_obs
     where id = p_os_id;
    return 'CONFIRMADO';
  end if;

  if length(trim(coalesce(p_obs, ''))) < 3 then
    raise exception 'Diga o que continua com problema para reabrir.';
  end if;
  update ordens_servico
     set status = 'ABERTA', confirmacao = 'REABERTO', confirmado_em = now(),
         confirmacao_obs = p_obs, reaberturas = reaberturas + 1, data_conclusao = null
   where id = p_os_id;
  -- o gatilho trg_os_status_log registra a mudança CONCLUIDA → ABERTA no histórico
  return 'REABERTO';
end;
$$;
revoke execute on function public.confirmar_chamado(uuid, boolean, text) from anon, public;
grant  execute on function public.confirmar_chamado(uuid, boolean, text) to authenticated;

-- 4. Técnico pode mudar só a SITUAÇÃO do equipamento (o cadastro continua com a gestão).
create or replace function public.atualizar_status_equipamento(p_equipamento_id uuid, p_status equipamento_status)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_unidade uuid;
begin
  select unidade_id into v_unidade from equipamentos where id = p_equipamento_id;
  if v_unidade is null then
    raise exception 'Equipamento não encontrado.';
  end if;
  if not public.can_access_unidade(v_unidade)
     or coalesce(public.get_my_role()::text, '') not in ('MASTER','ADMIN','DIRETOR','GERENTE','TECNICO') then
    raise exception 'Sem permissão para alterar a situação do equipamento.';
  end if;
  if p_status = 'INATIVO' and not public.is_gestao() then
    raise exception 'Só a gestão inativa equipamentos.';
  end if;
  update equipamentos set status = p_status where id = p_equipamento_id;
end;
$$;
revoke execute on function public.atualizar_status_equipamento(uuid, equipamento_status) from anon, public;
grant  execute on function public.atualizar_status_equipamento(uuid, equipamento_status) to authenticated;

-- 5. Usuário novo criado no Supabase Auth ganha um perfil INATIVO automaticamente.
--    A diretoria (MASTER/ADMIN) define perfil, unidade e ativa pela tela Usuários.
create or replace function public.criar_perfil_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, nome, email, role, unidade_id, ativo)
  values (new.id,
          coalesce(nullif(new.raw_user_meta_data->>'nome', ''), split_part(new.email, '@', 1)),
          new.email, 'OPERADOR', null, false)
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists ea_criar_perfil_novo_usuario on auth.users;
create trigger ea_criar_perfil_novo_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil_novo_usuario();

commit;

-- Conferência: deve listar setores.area_id, 4 colunas novas em ordens_servico e a função
select table_name || '.' || column_name as item
from information_schema.columns
where table_schema = 'public'
  and ((table_name = 'setores' and column_name = 'area_id')
    or (table_name = 'ordens_servico' and column_name in ('origem','urgencia','item_descricao','confirmacao')))
union all
select 'função ' || proname from pg_proc
where pronamespace = 'public'::regnamespace and proname = 'confirmar_chamado'
order by 1;
