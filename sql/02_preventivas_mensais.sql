-- =====================================================================
-- 02 — Preventivas mensais (planos + geração automática + controle)
-- Projeto: manutencao-entre-amigos (Supabase)  •  Versão: V18.1
--
-- O que faz (só ACRESCENTA; nada é apagado):
--   1. preventivas_planos ganha frequência, dia previsto, responsável,
--      checklist em lista, foto obrigatória/opcional e custo estimado.
--   2. preventivas_agendamentos ganha responsável, tipo de execução,
--      "concluída com NC", cancelamento com justificativa e a
--      fiscalização da terceirizada (técnico externo, validação).
--   3. Função gerar_preventivas_mes(unidade, mês): cria as preventivas
--      do mês a partir dos planos ativos. Pode rodar várias vezes:
--      nunca duplica.
--   4. Função situacao_preventiva(): Pendente / Atrasada / Concluída /
--      Concluída com NC / Cancelada, calculada pela data de hoje
--      (horário de Recife), sem depender de rotina noturna.
--
-- Compatível com a V16.1 que está no ar: só cria colunas novas com
-- valor padrão, então as telas antigas continuam funcionando.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Planos
-- ---------------------------------------------------------------------
alter table public.preventivas_planos
  add column if not exists frequencia      text     not null default 'MENSAL',
  add column if not exists dia_previsto    smallint not null default 10,
  add column if not exists dia_semana      smallint,
  add column if not exists data_inicio     date     not null default ((now() at time zone 'America/Recife')::date),
  add column if not exists responsavel_id  uuid references public.perfis(id) on delete set null,
  add column if not exists checklist_itens jsonb    not null default '[]'::jsonb,
  add column if not exists exige_foto      boolean  not null default false,
  add column if not exists custo_estimado  numeric(12,2) not null default 0;

alter table public.preventivas_planos
  drop constraint if exists preventivas_planos_frequencia_chk,
  add  constraint preventivas_planos_frequencia_chk
       check (frequencia in ('SEMANAL','QUINZENAL','MENSAL','BIMESTRAL','TRIMESTRAL','SEMESTRAL','ANUAL')),
  drop constraint if exists preventivas_planos_dia_previsto_chk,
  add  constraint preventivas_planos_dia_previsto_chk check (dia_previsto between 1 and 31),
  drop constraint if exists preventivas_planos_dia_semana_chk,
  add  constraint preventivas_planos_dia_semana_chk
       check (dia_semana is null or dia_semana between 0 and 6),
  drop constraint if exists preventivas_planos_semanal_dia_chk,
  add  constraint preventivas_planos_semanal_dia_chk
       check (frequencia not in ('SEMANAL','QUINZENAL') or dia_semana is not null),
  drop constraint if exists preventivas_planos_tipo_execucao_chk,
  add  constraint preventivas_planos_tipo_execucao_chk
       check (tipo_execucao in ('INTERNA','TERCEIRIZADA','SHOPPING')),
  drop constraint if exists preventivas_planos_custo_chk,
  add  constraint preventivas_planos_custo_chk check (custo_estimado >= 0);

create index if not exists preventivas_planos_unidade_ativo_idx
  on public.preventivas_planos (unidade_id) where ativo;

drop trigger if exists trg_preventivas_planos_updated on public.preventivas_planos;
create trigger trg_preventivas_planos_updated
  before update on public.preventivas_planos
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 2. Agendamentos (cada preventiva do mês)
-- ---------------------------------------------------------------------
alter table public.preventivas_agendamentos
  add column if not exists responsavel_id      uuid references public.perfis(id) on delete set null,
  add column if not exists tipo_execucao       text not null default 'INTERNA',
  add column if not exists exige_foto          boolean not null default true,
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
  add  constraint preventivas_ag_tipo_execucao_chk
       check (tipo_execucao in ('INTERNA','TERCEIRIZADA','SHOPPING')),
  drop constraint if exists preventivas_ag_cancelamento_chk,
  add  constraint preventivas_ag_cancelamento_chk
       check (status <> 'CANCELADA' or length(trim(coalesce(cancelado_motivo,''))) >= 5),
  drop constraint if exists preventivas_ag_reprogramacao_chk,
  add  constraint preventivas_ag_reprogramacao_chk
       check (reprogramado_de is null or length(trim(coalesce(reprogramado_motivo,''))) >= 5),
  drop constraint if exists preventivas_ag_custo_chk,
  add  constraint preventivas_ag_custo_chk check (custo_extra >= 0);

-- Uma preventiva por plano por dia: é o que impede a geração de duplicar.
create unique index if not exists preventivas_ag_plano_data_uk
  on public.preventivas_agendamentos (plano_id, data_programada)
  where plano_id is not null;

create index if not exists preventivas_ag_unidade_data_idx
  on public.preventivas_agendamentos (unidade_id, data_programada);

drop trigger if exists trg_preventivas_ag_updated on public.preventivas_agendamentos;
create trigger trg_preventivas_ag_updated
  before update on public.preventivas_agendamentos
  for each row execute function public.set_updated_at();

-- Validação da terceirizada só por gestão (MASTER, ADMIN, DIRETOR, GERENTE).
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
create trigger trg_preventiva_validacao
  before update on public.preventivas_agendamentos
  for each row execute function public.trg_preventiva_validacao();

-- ---------------------------------------------------------------------
-- 3. Situação calculada (não grava; calcula na hora)
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
-- 4. Datas previstas de um plano dentro de um mês
-- ---------------------------------------------------------------------
create or replace function public.datas_plano_no_mes(
  p_frequencia text, p_dia_previsto smallint, p_dia_semana smallint,
  p_data_inicio date, p_mes date)
returns setof date
language plpgsql
immutable
as $$
declare
  v_ini   date := date_trunc('month', p_mes)::date;
  v_fim   date := (date_trunc('month', p_mes) + interval '1 month - 1 day')::date;
  v_passo int;
  v_meses int;
  v_dia   date;
  v_ancora date;
begin
  if v_fim < p_data_inicio then
    return;
  end if;

  if p_frequencia in ('SEMANAL','QUINZENAL') then
    -- primeira ocorrência do dia da semana a partir do início do plano
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
               when 'SEMESTRAL' then 6 when 'ANUAL' then 12 end;
  v_meses := (extract(year from v_ini)::int * 12 + extract(month from v_ini)::int)
           - (extract(year from p_data_inicio)::int * 12 + extract(month from p_data_inicio)::int);
  if v_meses < 0 or v_meses % v_passo <> 0 then
    return;
  end if;

  -- dia 31 em mês de 30 dias (ou fevereiro) cai no último dia do mês
  v_dia := v_ini + (least(p_dia_previsto::int, extract(day from v_fim)::int) - 1);
  if v_dia >= p_data_inicio then
    return next v_dia;
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 5. Gerar as preventivas do mês a partir dos planos ativos
--    Respeita as permissões de quem chama (RLS). Não duplica.
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
    plano_id, unidade_id, equipamento_id, data_programada, status,
    empresa_executora, responsavel_id, tipo_execucao, exige_foto,
    checklist_itens, observacoes)
  select p.id, p.unidade_id, p.equipamento_id, d.dia, 'AGENDADA',
         p.empresa_padrao, p.responsavel_id, p.tipo_execucao, p.exige_foto,
         p.checklist_itens, json_build_object('resumo', p.nome)::text
  from public.preventivas_planos p
  join public.equipamentos e on e.id = p.equipamento_id and e.ativo
  cross join lateral public.datas_plano_no_mes(
    p.frequencia, p.dia_previsto, p.dia_semana, p.data_inicio, p_mes) as d(dia)
  where p.unidade_id = p_unidade_id
    and p.ativo
  on conflict (plano_id, data_programada) where plano_id is not null do nothing;

  get diagnostics v_qtd = row_count;
  return v_qtd;
end;
$$;

grant execute on function public.gerar_preventivas_mes(uuid, date) to authenticated;
grant execute on function public.situacao_preventiva(preventiva_status, date, boolean) to authenticated;
grant execute on function public.datas_plano_no_mes(text, smallint, smallint, date, date) to authenticated;
revoke execute on function public.gerar_preventivas_mes(uuid, date) from anon, public;

commit;

-- ---------------------------------------------------------------------
-- Conferência (rode depois; deve listar as colunas e funções novas)
-- ---------------------------------------------------------------------
select 'coluna' as tipo, table_name || '.' || column_name as nome
from information_schema.columns
where table_schema = 'public'
  and ((table_name = 'preventivas_planos'
        and column_name in ('frequencia','dia_previsto','dia_semana','data_inicio','responsavel_id','checklist_itens','exige_foto','custo_estimado'))
    or (table_name = 'preventivas_agendamentos'
        and column_name in ('responsavel_id','tipo_execucao','exige_foto','com_nc','cancelado_motivo','tecnico_externo','validado_por','reprogramado_de')))
union all
select 'funcao', proname from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('gerar_preventivas_mes','situacao_preventiva','datas_plano_no_mes','trg_preventiva_validacao')
order by 1, 2;
