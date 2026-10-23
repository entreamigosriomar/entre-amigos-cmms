-- =====================================================================
-- 02 — Biblioteca de rotinas + preventivas mensais
-- Projeto: manutencao-entre-amigos (Supabase)  •  Versão: V18.1
--
-- O que faz (só ACRESCENTA; nenhum dado é apagado):
--   1. Biblioteca de rotinas e itens de checklist (modelo Leankeep),
--      única para todas as unidades. Só a diretoria edita
--      (MASTER, ADMIN, DIRETOR); todos os usuários logados leem.
--   2. Faixas aceitáveis por equipamento (fabricante + nutrição).
--   3. Planos: liga cada equipamento às rotinas dele, com dia previsto,
--      responsável e executor. Só a diretoria edita.
--   4. Preventivas do mês geradas a partir dos planos, com o checklist
--      "congelado" no momento da geração (editar a biblioteca depois
--      não altera o histórico).
--   5. Respostas do checklist com Conforme / Não conforme / Não se
--      aplica, valor medido e foto.
--   6. Situação calculada: Pendente, Atrasada, Concluída,
--      Concluída com NC, Cancelada (horário de Recife).
--
-- Compatível com a V16.1 que está no ar: só cria tabelas e colunas novas.
-- Rode antes do 04 (carga da biblioteca).
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 0. Quem é diretoria
-- ---------------------------------------------------------------------
create or replace function public.is_diretoria()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from perfis
    where id = auth.uid() and ativo = true
      and role in ('MASTER','ADMIN','DIRETOR')
  );
$$;
revoke execute on function public.is_diretoria() from anon, public;
grant  execute on function public.is_diretoria() to authenticated;

-- ---------------------------------------------------------------------
-- 1. Biblioteca
-- ---------------------------------------------------------------------
create table if not exists public.preventiva_rotinas (
  id               uuid primary key default uuid_generate_v4(),
  codigo           text not null unique,
  familia          text not null,
  tipo_equipamento text not null,
  nome             text not null,
  frequencia       text not null,
  executor         text not null default 'INTERNA',
  observacao       text,
  secao_manual     text,
  ativo            boolean not null default true,
  criado_por       uuid references public.perfis(id) on delete set null,
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now(),
  constraint preventiva_rotinas_freq_chk check (frequencia in
    ('DIARIA','SEMANAL','QUINZENAL','MENSAL','BIMESTRAL','TRIMESTRAL','QUADRIMESTRAL','SEMESTRAL','ANUAL','QUINQUENAL')),
  constraint preventiva_rotinas_exec_chk check (executor in ('INTERNA','TERCEIRIZADA','SHOPPING')),
  constraint preventiva_rotinas_familia_chk check (familia in ('CLI','REF','GAS','COC','EXA','LAV','INC','ELE','TI','PRE','OUT'))
);

create table if not exists public.preventiva_rotina_itens (
  id                uuid primary key default uuid_generate_v4(),
  rotina_id         uuid not null references public.preventiva_rotinas(id) on delete cascade,
  ordem             integer not null,
  grupo             text,
  texto             text not null,
  tipo              text not null default 'VERIFICACAO',
  criterio          text,
  criticidade       text not null default 'NORMAL',
  unidade_medida    text,
  minimo            numeric,
  maximo            numeric,
  faixa_equipamento boolean not null default false,
  bloqueio          boolean not null default false,
  novo              boolean not null default false,
  foto_obrigatoria  boolean not null default false,
  ativo             boolean not null default true,
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now(),
  constraint rotina_itens_tipo_chk check (tipo in ('VERIFICACAO','MEDICAO','REGISTRO')),
  constraint rotina_itens_crit_chk check (criticidade in ('CRITICA','ALTA','NORMAL')),
  constraint rotina_itens_faixa_chk check (minimo is null or maximo is null or minimo <= maximo),
  constraint rotina_itens_medicao_chk check (tipo <> 'MEDICAO' or unidade_medida is not null)
);
create index if not exists rotina_itens_rotina_idx on public.preventiva_rotina_itens (rotina_id, ordem);

-- Faixa aceitável por equipamento (sobrepõe a da biblioteca)
create table if not exists public.equipamento_faixas (
  id             uuid primary key default uuid_generate_v4(),
  equipamento_id uuid not null references public.equipamentos(id) on delete cascade,
  unidade_id     uuid not null references public.unidades(id) on delete cascade,
  item_id        uuid not null references public.preventiva_rotina_itens(id) on delete cascade,
  minimo         numeric,
  maximo         numeric,
  fonte          text,
  atualizado_em  timestamptz not null default now(),
  constraint equipamento_faixas_uk unique (equipamento_id, item_id),
  constraint equipamento_faixas_chk check (minimo is null or maximo is null or minimo <= maximo)
);

alter table public.equipamentos add column if not exists tipo_equipamento text;

-- ---------------------------------------------------------------------
-- 2. Planos (equipamento × rotina)
-- ---------------------------------------------------------------------
alter table public.preventivas_planos
  add column if not exists rotina_id       uuid references public.preventiva_rotinas(id) on delete restrict,
  add column if not exists frequencia      text     not null default 'MENSAL',
  add column if not exists dia_previsto    smallint not null default 10,
  add column if not exists dia_semana      smallint,
  add column if not exists data_inicio     date     not null default ((now() at time zone 'America/Recife')::date),
  add column if not exists responsavel_id  uuid references public.perfis(id) on delete set null,
  add column if not exists custo_estimado  numeric(12,2) not null default 0,
  add column if not exists ultima_execucao date;  -- última vez feita (informada no cadastro ou da última preventiva concluída)

alter table public.preventivas_planos
  drop constraint if exists preventivas_planos_frequencia_chk,
  add  constraint preventivas_planos_frequencia_chk check (frequencia in
    ('DIARIA','SEMANAL','QUINZENAL','MENSAL','BIMESTRAL','TRIMESTRAL','QUADRIMESTRAL','SEMESTRAL','ANUAL','QUINQUENAL')),
  drop constraint if exists preventivas_planos_dia_previsto_chk,
  add  constraint preventivas_planos_dia_previsto_chk check (dia_previsto between 1 and 31),
  drop constraint if exists preventivas_planos_dia_semana_chk,
  add  constraint preventivas_planos_dia_semana_chk check (dia_semana is null or dia_semana between 0 and 6),
  drop constraint if exists preventivas_planos_semanal_dia_chk,
  add  constraint preventivas_planos_semanal_dia_chk
       check (frequencia not in ('SEMANAL','QUINZENAL') or dia_semana is not null),
  drop constraint if exists preventivas_planos_tipo_execucao_chk,
  add  constraint preventivas_planos_tipo_execucao_chk check (tipo_execucao in ('INTERNA','TERCEIRIZADA','SHOPPING')),
  drop constraint if exists preventivas_planos_custo_chk,
  add  constraint preventivas_planos_custo_chk check (custo_estimado >= 0);

create unique index if not exists preventivas_planos_equip_rotina_uk
  on public.preventivas_planos (equipamento_id, rotina_id) where rotina_id is not null and ativo;
create index if not exists preventivas_planos_unidade_ativo_idx
  on public.preventivas_planos (unidade_id) where ativo;

-- ---------------------------------------------------------------------
-- 3. Agendamentos (cada preventiva do mês)
-- ---------------------------------------------------------------------
alter table public.preventivas_agendamentos
  add column if not exists rotina_id           uuid references public.preventiva_rotinas(id) on delete set null,
  add column if not exists responsavel_id      uuid references public.perfis(id) on delete set null,
  add column if not exists tipo_execucao       text not null default 'INTERNA',
  add column if not exists com_nc              boolean not null default false,
  add column if not exists cancelado_motivo    text,
  add column if not exists cancelado_por       uuid references public.perfis(id),
  add column if not exists cancelado_em        timestamptz,
  add column if not exists tecnico_externo     text,
  add column if not exists validado_por        uuid references public.perfis(id),
  add column if not exists validado_em         timestamptz,
  add column if not exists validacao_obs       text,
  add column if not exists reprogramado_de     date,
  add column if not exists reprogramado_motivo text;

alter table public.preventivas_agendamentos
  drop constraint if exists preventivas_ag_tipo_execucao_chk,
  add  constraint preventivas_ag_tipo_execucao_chk check (tipo_execucao in ('INTERNA','TERCEIRIZADA','SHOPPING')),
  drop constraint if exists preventivas_ag_cancelamento_chk,
  add  constraint preventivas_ag_cancelamento_chk
       check (status <> 'CANCELADA' or length(trim(coalesce(cancelado_motivo,''))) >= 5) not valid,
  drop constraint if exists preventivas_ag_reprogramacao_chk,
  add  constraint preventivas_ag_reprogramacao_chk
       check (reprogramado_de is null or length(trim(coalesce(reprogramado_motivo,''))) >= 5),
  drop constraint if exists preventivas_ag_custo_chk,
  add  constraint preventivas_ag_custo_chk check (custo_extra >= 0) not valid;

create unique index if not exists preventivas_ag_plano_data_uk
  on public.preventivas_agendamentos (plano_id, data_programada) where plano_id is not null;
create index if not exists preventivas_ag_unidade_data_idx
  on public.preventivas_agendamentos (unidade_id, data_programada);

-- ---------------------------------------------------------------------
-- 4. Respostas do checklist
-- ---------------------------------------------------------------------
alter table public.preventivas_checklist_respostas
  add column if not exists item_id        uuid,
  add column if not exists ordem          integer,
  add column if not exists resposta       text,
  add column if not exists valor          numeric,
  add column if not exists unidade_medida text,
  add column if not exists criticidade    text,
  add column if not exists foto_url       text,
  add column if not exists nc             boolean not null default false;

alter table public.preventivas_checklist_respostas
  drop constraint if exists checklist_resposta_chk,
  add  constraint checklist_resposta_chk
       check (resposta is null or resposta in ('CONFORME','NAO_CONFORME','NAO_SE_APLICA','REGISTRADO')),
  drop constraint if exists checklist_nc_obs_chk,
  add  constraint checklist_nc_obs_chk
       check (not nc or length(trim(coalesce(observacao,''))) >= 3);

create unique index if not exists checklist_respostas_item_uk
  on public.preventivas_checklist_respostas (agendamento_id, item_id) where item_id is not null;

-- ---------------------------------------------------------------------
-- 5. RLS
-- ---------------------------------------------------------------------
alter table public.preventiva_rotinas      enable row level security;
alter table public.preventiva_rotina_itens enable row level security;
alter table public.equipamento_faixas      enable row level security;

drop policy if exists rotinas_select   on public.preventiva_rotinas;
drop policy if exists rotinas_manage   on public.preventiva_rotinas;
create policy rotinas_select on public.preventiva_rotinas for select to authenticated using (true);
create policy rotinas_manage on public.preventiva_rotinas for all to authenticated
  using (public.is_diretoria()) with check (public.is_diretoria());

drop policy if exists rotina_itens_select on public.preventiva_rotina_itens;
drop policy if exists rotina_itens_manage on public.preventiva_rotina_itens;
create policy rotina_itens_select on public.preventiva_rotina_itens for select to authenticated using (true);
create policy rotina_itens_manage on public.preventiva_rotina_itens for all to authenticated
  using (public.is_diretoria()) with check (public.is_diretoria());

drop policy if exists equipamento_faixas_select on public.equipamento_faixas;
drop policy if exists equipamento_faixas_manage on public.equipamento_faixas;
create policy equipamento_faixas_select on public.equipamento_faixas for select to authenticated
  using (public.can_access_unidade(unidade_id));
create policy equipamento_faixas_manage on public.equipamento_faixas for all to authenticated
  using (public.is_diretoria() and public.can_access_unidade(unidade_id))
  with check (public.is_diretoria() and public.can_access_unidade(unidade_id));

-- Planos: agora só a diretoria edita (gerente acompanha).
drop policy if exists preventivas_planos_manage_gestao on public.preventivas_planos;
drop policy if exists preventivas_planos_manage_diretoria on public.preventivas_planos;
create policy preventivas_planos_manage_diretoria on public.preventivas_planos for all to authenticated
  using (public.is_diretoria() and public.can_access_unidade(unidade_id))
  with check (public.is_diretoria() and public.can_access_unidade(unidade_id));

grant select, insert, update, delete on public.preventiva_rotinas, public.preventiva_rotina_itens,
  public.equipamento_faixas to authenticated;
revoke all on public.preventiva_rotinas, public.preventiva_rotina_itens, public.equipamento_faixas from anon;

-- ---------------------------------------------------------------------
-- 6. Gatilhos
-- ---------------------------------------------------------------------
drop trigger if exists trg_rotinas_updated on public.preventiva_rotinas;
create trigger trg_rotinas_updated before update on public.preventiva_rotinas
  for each row execute function public.set_updated_at();
drop trigger if exists trg_rotina_itens_updated on public.preventiva_rotina_itens;
create trigger trg_rotina_itens_updated before update on public.preventiva_rotina_itens
  for each row execute function public.set_updated_at();
drop trigger if exists trg_preventivas_planos_updated on public.preventivas_planos;
create trigger trg_preventivas_planos_updated before update on public.preventivas_planos
  for each row execute function public.set_updated_at();
drop trigger if exists trg_preventivas_ag_updated on public.preventivas_agendamentos;
create trigger trg_preventivas_ag_updated before update on public.preventivas_agendamentos
  for each row execute function public.set_updated_at();

-- Validação da terceirizada: só gestão (MASTER, ADMIN, DIRETOR, GERENTE).
create or replace function public.trg_preventiva_validacao()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.validado_por is distinct from old.validado_por and new.validado_por is not null then
    if not public.is_gestao() then
      raise exception 'Somente a gestão pode validar a execução da terceirizada.';
    end if;
    new.validado_por := auth.uid();
    new.validado_em  := now();
  end if;
  return new;
end;
$$;
drop trigger if exists trg_preventiva_validacao on public.preventivas_agendamentos;
create trigger trg_preventiva_validacao before update on public.preventivas_agendamentos
  for each row execute function public.trg_preventiva_validacao();

-- Ao concluir uma preventiva, o plano guarda a data como "última vez feita".
create or replace function public.trg_plano_ultima_execucao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.plano_id is not null and new.status = 'CONCLUIDA'
     and old.status is distinct from 'CONCLUIDA' then
    update preventivas_planos
       set ultima_execucao = greatest(coalesce(ultima_execucao, '1900-01-01'::date),
                                      coalesce((new.executado_em at time zone 'America/Recife')::date, new.data_programada))
     where id = new.plano_id;
  end if;
  return new;
end;
$$;
revoke execute on function public.trg_plano_ultima_execucao() from anon, public;
drop trigger if exists trg_plano_ultima_execucao on public.preventivas_agendamentos;
create trigger trg_plano_ultima_execucao after update on public.preventivas_agendamentos
  for each row execute function public.trg_plano_ultima_execucao();

-- ---------------------------------------------------------------------
-- 7. Situação calculada
-- ---------------------------------------------------------------------
create or replace function public.situacao_preventiva(
  p_status preventiva_status, p_data date, p_com_nc boolean)
returns text
language sql
stable
as $$
  select case
    when p_status = 'CANCELADA' then 'CANCELADA'
    when p_status = 'CONCLUIDA' and p_com_nc then 'CONCLUIDA_NC'
    when p_status = 'CONCLUIDA' then 'CONCLUIDA'
    when p_data < (now() at time zone 'America/Recife')::date then 'ATRASADA'
    else 'PENDENTE'
  end;
$$;

-- ---------------------------------------------------------------------
-- 8. Datas previstas de um plano dentro de um mês
-- ---------------------------------------------------------------------
create or replace function public.datas_plano_no_mes(
  p_frequencia text, p_dia_previsto smallint, p_dia_semana smallint,
  p_data_inicio date, p_mes date)
returns setof date
language plpgsql
immutable
as $$
declare
  v_ini    date := date_trunc('month', p_mes)::date;
  v_fim    date := (date_trunc('month', p_mes) + interval '1 month - 1 day')::date;
  v_passo  int;
  v_meses  int;
  v_dia    date;
  v_ancora date;
begin
  if v_fim < p_data_inicio then
    return;
  end if;

  if p_frequencia = 'DIARIA' then
    v_dia := greatest(v_ini, p_data_inicio);
    while v_dia <= v_fim loop
      return next v_dia;
      v_dia := v_dia + 1;
    end loop;
    return;
  end if;

  if p_frequencia in ('SEMANAL','QUINZENAL') then
    v_ancora := p_data_inicio + ((p_dia_semana - extract(dow from p_data_inicio)::int + 7) % 7);
    v_dia := v_ini + ((p_dia_semana - extract(dow from v_ini)::int + 7) % 7);
    while v_dia <= v_fim loop
      if v_dia >= v_ancora
         and (p_frequencia = 'SEMANAL' or ((v_dia - v_ancora) / 7) % 2 = 0) then
        return next v_dia;
      end if;
      v_dia := v_dia + 7;
    end loop;
    return;
  end if;

  v_passo := case p_frequencia
               when 'MENSAL' then 1 when 'BIMESTRAL' then 2 when 'TRIMESTRAL' then 3
               when 'QUADRIMESTRAL' then 4 when 'SEMESTRAL' then 6 when 'ANUAL' then 12
               when 'QUINQUENAL' then 60 end;
  v_meses := (extract(year from v_ini)::int * 12 + extract(month from v_ini)::int)
           - (extract(year from p_data_inicio)::int * 12 + extract(month from p_data_inicio)::int);
  if v_meses < 0 or v_meses % v_passo <> 0 then
    return;
  end if;

  v_dia := v_ini + (least(p_dia_previsto::int, extract(day from v_fim)::int) - 1);
  if v_dia < p_data_inicio then
    -- no mês de início, se o dia previsto já passou, agenda para o próprio início
    v_dia := p_data_inicio;
  end if;
  return next v_dia;
end;
$$;

-- ---------------------------------------------------------------------
-- 9. Checklist "congelado" de um plano (itens ativos + faixa do equipamento)
-- ---------------------------------------------------------------------
create or replace function public.checklist_do_plano(p_rotina_id uuid, p_equipamento_id uuid)
returns jsonb
language sql
stable
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'item_id', i.id, 'ordem', i.ordem, 'grupo', i.grupo, 'texto', i.texto,
           'tipo', i.tipo, 'criterio', i.criterio, 'criticidade', i.criticidade,
           'unidade', i.unidade_medida,
           'minimo', coalesce(f.minimo, i.minimo), 'maximo', coalesce(f.maximo, i.maximo),
           'faixa_pendente', i.faixa_equipamento and f.id is null and i.minimo is null and i.maximo is null,
           'bloqueio', i.bloqueio, 'foto', i.foto_obrigatoria)
         order by i.ordem), '[]'::jsonb)
  from preventiva_rotina_itens i
  left join equipamento_faixas f on f.item_id = i.id and f.equipamento_id = p_equipamento_id
  where i.rotina_id = p_rotina_id and i.ativo;
$$;

-- ---------------------------------------------------------------------
-- 10. Gerar as preventivas do mês (respeita RLS; nunca duplica)
-- ---------------------------------------------------------------------
create or replace function public.gerar_preventivas_mes(p_unidade_id uuid, p_mes date)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_qtd integer;
begin
  if not public.can_access_unidade(p_unidade_id) then
    raise exception 'Sem acesso a esta unidade.';
  end if;

  insert into public.preventivas_agendamentos (
    plano_id, rotina_id, unidade_id, equipamento_id, data_programada, status,
    empresa_executora, responsavel_id, tipo_execucao, checklist_itens, observacoes)
  select p.id, p.rotina_id, p.unidade_id, p.equipamento_id, d.dia, 'AGENDADA',
         p.empresa_padrao, p.responsavel_id, p.tipo_execucao,
         public.checklist_do_plano(p.rotina_id, p.equipamento_id),
         json_build_object('resumo', coalesce(r.codigo || ' — ' || r.nome, p.nome))::text
  from public.preventivas_planos p
  join public.equipamentos e on e.id = p.equipamento_id and e.ativo
  left join public.preventiva_rotinas r on r.id = p.rotina_id
  cross join lateral public.datas_plano_no_mes(
    p.frequencia, p.dia_previsto, p.dia_semana, p.data_inicio, p_mes) as d(dia)
  where p.unidade_id = p_unidade_id
    and p.ativo
    and (r.id is null or r.ativo)
  on conflict (plano_id, data_programada) where plano_id is not null do nothing;

  get diagnostics v_qtd = row_count;
  return v_qtd;
end;
$$;

grant execute on function public.gerar_preventivas_mes(uuid, date) to authenticated;
grant execute on function public.situacao_preventiva(preventiva_status, date, boolean) to authenticated;
grant execute on function public.datas_plano_no_mes(text, smallint, smallint, date, date) to authenticated;
grant execute on function public.checklist_do_plano(uuid, uuid) to authenticated;
revoke execute on function public.gerar_preventivas_mes(uuid, date) from anon, public;
revoke execute on function public.checklist_do_plano(uuid, uuid) from anon, public;

commit;

-- ---------------------------------------------------------------------
-- Conferência: deve listar 3 tabelas novas e 6 funções
-- ---------------------------------------------------------------------
select 'tabela' as tipo, table_name as nome from information_schema.tables
where table_schema = 'public'
  and table_name in ('preventiva_rotinas','preventiva_rotina_itens','equipamento_faixas')
union all
select 'funcao', proname from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('is_diretoria','gerar_preventivas_mes','situacao_preventiva',
                  'datas_plano_no_mes','checklist_do_plano','trg_preventiva_validacao')
order by 1, 2;
