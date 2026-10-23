set check_function_bodies = off;

create extension if not exists "uuid-ossp";
do $$ begin create role anon nologin; exception when others then null; end $$;
do $$ begin create role authenticated nologin; exception when others then null; end $$;
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.uid', true),'')::uuid $$;
create table if not exists auth.users(id uuid primary key, email text, raw_user_meta_data jsonb);
create schema if not exists storage;
create table storage.buckets(id text primary key, name text, public boolean default false);
create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
create or replace function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;
alter table storage.objects enable row level security;
grant usage on schema public, auth, storage to anon, authenticated;
create sequence if not exists public.equipamento_tag_global_seq;

create type public.app_role as enum ('MASTER', 'ADMIN', 'DIRETOR', 'GERENTE', 'OPERADOR', 'TECNICO');
create type public.os_status as enum ('ABERTA', 'EM_EXECUCAO', 'AGUARDANDO_PECA', 'AGUARDANDO_TERCEIRIZADA', 'AGUARDANDO_APROVACAO', 'CONCLUIDA', 'CANCELADA');
create type public.os_prioridade as enum ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');
create type public.os_tipo as enum ('CORRETIVA', 'PREVENTIVA', 'AUDITORIA', 'SOLICITACAO');
create type public.equipamento_status as enum ('OPERACIONAL', 'EM_MANUTENCAO', 'PARADO', 'AGUARDANDO_PECA', 'INATIVO');
create type public.preventiva_status as enum ('AGENDADA', 'EM_EXECUCAO', 'CONCLUIDA', 'ATRASADA', 'CANCELADA');
create table public.areas (id uuid default uuid_generate_v4() not null, unidade_id uuid not null, setor_id uuid, nome text not null, ativo boolean default true not null, criado_em timestamp with time zone default now() not null, atualizado_em timestamp with time zone default now() not null);
create table public.auditorias (id uuid default uuid_generate_v4() not null, unidade_id uuid not null, diretor_id uuid not null, equipamento_id uuid, os_id uuid, categoria text not null, problema text, prioridade os_prioridade default 'MEDIA'::os_prioridade not null, checklist jsonb default '[]'::jsonb not null, observacao text not null, foto_url text, criado_em timestamp with time zone default now() not null);
create table public.categorias_manutencao (id uuid default gen_random_uuid() not null, unidade_id uuid not null, nome text not null, ativo boolean default true not null, criado_em timestamp with time zone default now() not null);
create table public.configuracoes_sistema (id uuid default uuid_generate_v4() not null, empresa_nome text default 'Entre Amigos'::text not null, logo_url text, cor_primaria text default '#001F3F'::text not null, cor_secundaria text default '#FF7A00'::text not null, meta_auditoria_semanal integer default 5 not null, exigir_foto_concluir_os boolean default false not null, limite_aprovacao numeric default 500 not null, criado_em timestamp with time zone default now() not null, atualizado_em timestamp with time zone default now() not null);
create table public.equipamentos (id uuid default uuid_generate_v4() not null, unidade_id uuid not null, setor_id uuid, area_id uuid, fabricante_id uuid, nome text not null, fabricante_texto text, numero text, tag text, qr_code text, foto_url text, status equipamento_status default 'OPERACIONAL'::equipamento_status not null, criticidade os_prioridade default 'MEDIA'::os_prioridade not null, checklist_padrao text, observacoes text, ativo boolean default true not null, criado_por uuid, criado_em timestamp with time zone default now() not null, atualizado_em timestamp with time zone default now() not null);
create table public.equipamentos_transferencias (id uuid default gen_random_uuid() not null, equipamento_id uuid not null, unidade_origem_id uuid, unidade_destino_id uuid not null, tag_anterior text, tag_nova text not null, motivo text, usuario_id uuid, criado_em timestamp with time zone default now() not null);
create table public.fabricantes (id uuid default uuid_generate_v4() not null, nome text not null, contato text, telefone text, email text, ativo boolean default true not null, criado_em timestamp with time zone default now() not null);
create table public.fornecedores (id uuid default uuid_generate_v4() not null, unidade_id uuid, nome text not null, tipo text, contato text, telefone text, email text, observacoes text, ativo boolean default true not null, criado_em timestamp with time zone default now() not null, atualizado_em timestamp with time zone default now() not null);
create table public.logs_sistema (id uuid default uuid_generate_v4() not null, unidade_id uuid, usuario_id uuid, role app_role, acao text not null, entidade text, entidade_id uuid, detalhes jsonb default '{}'::jsonb not null, ip text, user_agent text, criado_em timestamp with time zone default now() not null);
create table public.notificacoes (id uuid default uuid_generate_v4() not null, unidade_id uuid, usuario_id uuid, titulo text not null, mensagem text, lida boolean default false not null, link text, criado_em timestamp with time zone default now() not null);
create table public.ordens_servico (id uuid default uuid_generate_v4() not null, numero bigint generated by default as identity, unidade_id uuid not null, equipamento_id uuid, setor_id uuid, area_id uuid, solicitante_id uuid, tecnico_id uuid, tipo os_tipo default 'CORRETIVA'::os_tipo not null, status os_status default 'ABERTA'::os_status not null, prioridade os_prioridade default 'MEDIA'::os_prioridade not null, categoria text, problema text, descricao text not null, solucao text, responsavel_texto text, resolucao_rapida boolean default false not null, necessita_peca boolean default false not null, necessita_terceiro boolean default false not null, necessita_aprovacao boolean default false not null, custo_material numeric default 0 not null, custo_terceiro numeric default 0 not null, custo_interno numeric default 0 not null, data_abertura timestamp with time zone default now() not null, data_inicio timestamp with time zone, data_conclusao timestamp with time zone, sla_limite timestamp with time zone, criado_em timestamp with time zone default now() not null, atualizado_em timestamp with time zone default now() not null);
create table public.os_anexos (id uuid default uuid_generate_v4() not null, os_id uuid not null, unidade_id uuid not null, usuario_id uuid, tipo text default 'foto'::text not null, origem text default 'abertura'::text, arquivo_nome text, arquivo_url text not null, mime_type text, tamanho_bytes bigint, criado_em timestamp with time zone default now() not null);
create table public.os_custos (id uuid default uuid_generate_v4() not null, os_id uuid not null, unidade_id uuid not null, usuario_id uuid, tipo text not null, descricao text, fornecedor_id uuid, valor numeric default 0 not null, aprovado_por uuid, aprovado_em timestamp with time zone, criado_em timestamp with time zone default now() not null);
create table public.os_historico (id uuid default uuid_generate_v4() not null, os_id uuid not null, unidade_id uuid not null, usuario_id uuid, status_anterior os_status, status_novo os_status, acao text not null, observacao text, criado_em timestamp with time zone default now() not null);
create table public.perfis (id uuid not null, nome text not null, email text, role app_role default 'OPERADOR'::app_role not null, unidade_id uuid, cargo text, setor_usuario text, whatsapp text, ativo boolean default true not null, ultimo_login timestamp with time zone, criado_em timestamp with time zone default now() not null, atualizado_em timestamp with time zone default now() not null);
create table public.preventivas_agendamentos (id uuid default uuid_generate_v4() not null, plano_id uuid, unidade_id uuid not null, equipamento_id uuid not null, data_programada date not null, hora time without time zone default '09:00:00'::time without time zone, status preventiva_status default 'AGENDADA'::preventiva_status not null, empresa_executora text, custo_extra numeric default 0 not null, os_id uuid, executado_por uuid, executado_em timestamp with time zone, observacoes text, criado_em timestamp with time zone default now() not null, atualizado_em timestamp with time zone default now() not null, checklist_itens jsonb default '[]'::jsonb not null, fotos_urls jsonb default '[]'::jsonb not null);
create table public.preventivas_anexos (id uuid default uuid_generate_v4() not null, agendamento_id uuid not null, unidade_id uuid not null, usuario_id uuid, arquivo_nome text, arquivo_url text not null, mime_type text, tamanho_bytes bigint, criado_em timestamp with time zone default now() not null);
create table public.preventivas_checklist_respostas (id uuid default uuid_generate_v4() not null, agendamento_id uuid not null, item text not null, conforme boolean, observacao text, criado_em timestamp with time zone default now() not null);
create table public.preventivas_planos (id uuid default uuid_generate_v4() not null, unidade_id uuid not null, equipamento_id uuid not null, nome text not null, checklist text, recorrencia_dias integer default 30 not null, empresa_padrao text, tipo_execucao text default 'INTERNA'::text, ativo boolean default true not null, criado_em timestamp with time zone default now() not null, atualizado_em timestamp with time zone default now() not null);
create table public.setores (id uuid default uuid_generate_v4() not null, unidade_id uuid not null, nome text not null, ativo boolean default true not null, criado_em timestamp with time zone default now() not null, atualizado_em timestamp with time zone default now() not null);
create table public.unidades (id uuid default uuid_generate_v4() not null, nome text not null, cidade text, estado text, endereco text, ativo boolean default true not null, criado_em timestamp with time zone default now() not null, atualizado_em timestamp with time zone default now() not null);
alter table areas add constraint areas_pkey PRIMARY KEY (id);
alter table areas add constraint areas_unidade_id_nome_key UNIQUE (unidade_id, nome);
alter table auditorias add constraint auditorias_pkey PRIMARY KEY (id);
alter table categorias_manutencao add constraint categorias_manutencao_pkey PRIMARY KEY (id);
alter table categorias_manutencao add constraint categorias_manutencao_unidade_id_nome_key UNIQUE (unidade_id, nome);
alter table configuracoes_sistema add constraint configuracoes_sistema_pkey PRIMARY KEY (id);
alter table equipamentos add constraint equipamentos_pkey PRIMARY KEY (id);
alter table equipamentos_transferencias add constraint equipamentos_transferencias_pkey PRIMARY KEY (id);
alter table fabricantes add constraint fabricantes_nome_key UNIQUE (nome);
alter table fabricantes add constraint fabricantes_pkey PRIMARY KEY (id);
alter table fornecedores add constraint fornecedores_pkey PRIMARY KEY (id);
alter table logs_sistema add constraint logs_sistema_pkey PRIMARY KEY (id);
alter table notificacoes add constraint notificacoes_pkey PRIMARY KEY (id);
alter table ordens_servico add constraint ordens_servico_pkey PRIMARY KEY (id);
alter table os_anexos add constraint os_anexos_pkey PRIMARY KEY (id);
alter table os_custos add constraint os_custos_pkey PRIMARY KEY (id);
alter table os_historico add constraint os_historico_pkey PRIMARY KEY (id);
alter table perfis add constraint perfis_email_key UNIQUE (email);
alter table perfis add constraint perfis_pkey PRIMARY KEY (id);
alter table preventivas_agendamentos add constraint preventivas_agendamentos_pkey PRIMARY KEY (id);
alter table preventivas_anexos add constraint preventivas_anexos_pkey PRIMARY KEY (id);
alter table preventivas_checklist_respostas add constraint preventivas_checklist_respostas_pkey PRIMARY KEY (id);
alter table preventivas_planos add constraint preventivas_planos_pkey PRIMARY KEY (id);
alter table setores add constraint setores_pkey PRIMARY KEY (id);
alter table setores add constraint setores_unidade_id_nome_key UNIQUE (unidade_id, nome);
alter table unidades add constraint unidades_nome_key UNIQUE (nome);
alter table unidades add constraint unidades_pkey PRIMARY KEY (id);
alter table areas add constraint areas_setor_id_fkey FOREIGN KEY (setor_id) REFERENCES setores(id) ON DELETE SET NULL;
alter table areas add constraint areas_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES unidades(id) ON DELETE CASCADE;
alter table auditorias add constraint auditorias_diretor_id_fkey FOREIGN KEY (diretor_id) REFERENCES perfis(id);
alter table auditorias add constraint auditorias_equipamento_id_fkey FOREIGN KEY (equipamento_id) REFERENCES equipamentos(id) ON DELETE SET NULL;
alter table auditorias add constraint auditorias_os_id_fkey FOREIGN KEY (os_id) REFERENCES ordens_servico(id) ON DELETE SET NULL;
alter table auditorias add constraint auditorias_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES unidades(id) ON DELETE CASCADE;
alter table categorias_manutencao add constraint categorias_manutencao_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES unidades(id) ON DELETE CASCADE;
alter table equipamentos add constraint equipamentos_area_id_fkey FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL;
alter table equipamentos add constraint equipamentos_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES perfis(id);
alter table equipamentos add constraint equipamentos_fabricante_id_fkey FOREIGN KEY (fabricante_id) REFERENCES fabricantes(id) ON DELETE SET NULL;
alter table equipamentos add constraint equipamentos_setor_id_fkey FOREIGN KEY (setor_id) REFERENCES setores(id) ON DELETE SET NULL;
alter table equipamentos add constraint equipamentos_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES unidades(id) ON DELETE CASCADE;
alter table equipamentos_transferencias add constraint equipamentos_transferencias_equipamento_id_fkey FOREIGN KEY (equipamento_id) REFERENCES equipamentos(id) ON DELETE CASCADE;
alter table equipamentos_transferencias add constraint equipamentos_transferencias_unidade_destino_id_fkey FOREIGN KEY (unidade_destino_id) REFERENCES unidades(id);
alter table equipamentos_transferencias add constraint equipamentos_transferencias_unidade_origem_id_fkey FOREIGN KEY (unidade_origem_id) REFERENCES unidades(id);
alter table equipamentos_transferencias add constraint equipamentos_transferencias_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES perfis(id);
alter table fornecedores add constraint fornecedores_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES unidades(id) ON DELETE CASCADE;
alter table logs_sistema add constraint logs_sistema_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES unidades(id);
alter table logs_sistema add constraint logs_sistema_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES perfis(id);
alter table notificacoes add constraint notificacoes_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES unidades(id);
alter table notificacoes add constraint notificacoes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES perfis(id);
alter table ordens_servico add constraint ordens_servico_area_id_fkey FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL;
alter table ordens_servico add constraint ordens_servico_equipamento_id_fkey FOREIGN KEY (equipamento_id) REFERENCES equipamentos(id) ON DELETE SET NULL;
alter table ordens_servico add constraint ordens_servico_setor_id_fkey FOREIGN KEY (setor_id) REFERENCES setores(id) ON DELETE SET NULL;
alter table ordens_servico add constraint ordens_servico_solicitante_id_fkey FOREIGN KEY (solicitante_id) REFERENCES perfis(id);
alter table ordens_servico add constraint ordens_servico_tecnico_id_fkey FOREIGN KEY (tecnico_id) REFERENCES perfis(id);
alter table ordens_servico add constraint ordens_servico_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES unidades(id) ON DELETE CASCADE;
alter table os_anexos add constraint os_anexos_os_id_fkey FOREIGN KEY (os_id) REFERENCES ordens_servico(id) ON DELETE CASCADE;
alter table os_anexos add constraint os_anexos_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES unidades(id) ON DELETE CASCADE;
alter table os_anexos add constraint os_anexos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES perfis(id);
alter table os_custos add constraint os_custos_aprovado_por_fkey FOREIGN KEY (aprovado_por) REFERENCES perfis(id);
alter table os_custos add constraint os_custos_fornecedor_id_fkey FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id);
alter table os_custos add constraint os_custos_os_id_fkey FOREIGN KEY (os_id) REFERENCES ordens_servico(id) ON DELETE CASCADE;
alter table os_custos add constraint os_custos_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES unidades(id) ON DELETE CASCADE;
alter table os_custos add constraint os_custos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES perfis(id);
alter table os_historico add constraint os_historico_os_id_fkey FOREIGN KEY (os_id) REFERENCES ordens_servico(id) ON DELETE CASCADE;
alter table os_historico add constraint os_historico_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES unidades(id) ON DELETE CASCADE;
alter table os_historico add constraint os_historico_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES perfis(id);
alter table perfis add constraint perfis_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table perfis add constraint perfis_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES unidades(id);
alter table preventivas_agendamentos add constraint preventivas_agendamentos_equipamento_id_fkey FOREIGN KEY (equipamento_id) REFERENCES equipamentos(id) ON DELETE CASCADE;
alter table preventivas_agendamentos add constraint preventivas_agendamentos_executado_por_fkey FOREIGN KEY (executado_por) REFERENCES perfis(id);
alter table preventivas_agendamentos add constraint preventivas_agendamentos_os_id_fkey FOREIGN KEY (os_id) REFERENCES ordens_servico(id) ON DELETE SET NULL;
alter table preventivas_agendamentos add constraint preventivas_agendamentos_plano_id_fkey FOREIGN KEY (plano_id) REFERENCES preventivas_planos(id) ON DELETE CASCADE;
alter table preventivas_agendamentos add constraint preventivas_agendamentos_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES unidades(id) ON DELETE CASCADE;
alter table preventivas_anexos add constraint preventivas_anexos_agendamento_id_fkey FOREIGN KEY (agendamento_id) REFERENCES preventivas_agendamentos(id) ON DELETE CASCADE;
alter table preventivas_anexos add constraint preventivas_anexos_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES unidades(id) ON DELETE CASCADE;
alter table preventivas_anexos add constraint preventivas_anexos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES perfis(id);
alter table preventivas_checklist_respostas add constraint preventivas_checklist_respostas_agendamento_id_fkey FOREIGN KEY (agendamento_id) REFERENCES preventivas_agendamentos(id) ON DELETE CASCADE;
alter table preventivas_planos add constraint preventivas_planos_equipamento_id_fkey FOREIGN KEY (equipamento_id) REFERENCES equipamentos(id) ON DELETE CASCADE;
alter table preventivas_planos add constraint preventivas_planos_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES unidades(id) ON DELETE CASCADE;
alter table setores add constraint setores_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES unidades(id) ON DELETE CASCADE;
CREATE OR REPLACE FUNCTION public.calcular_sla(prioridade os_prioridade)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
AS $function$
begin
  if prioridade = 'CRITICA' then
    return now() + interval '4 hours';
  elsif prioridade = 'ALTA' then
    return now() + interval '1 day';
  elsif prioridade = 'MEDIA' then
    return now() + interval '3 days';
  else
    return now() + interval '5 days';
  end if;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.can_access_unidade(target_unidade uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select is_master_admin()
  or exists (
    select 1 from perfis
    where id = auth.uid()
    and ativo = true
    and (
      role in ('MASTER','ADMIN','DIRETOR')
      or unidade_id = target_unidade
    )
  );
$function$
;
CREATE OR REPLACE FUNCTION public.gerar_tag_equipamento(p_unidade_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_num bigint;
  v_nome text;
  v_prefixo text;
begin
  if get_my_role() not in ('MASTER','ADMIN','DIRETOR') then
    raise exception 'Sem permissão para gerar TAG.';
  end if;

  select nome into v_nome from unidades where id=p_unidade_id;
  if v_nome is null then
    raise exception 'Unidade não encontrada.';
  end if;

  v_num := nextval('equipamento_tag_global_seq');
  v_prefixo := unidade_tag_prefixo(v_nome);

  return 'EA-' || v_prefixo || '-' || lpad(v_num::text,3,'0');
end;
$function$
;
CREATE OR REPLACE FUNCTION public.get_my_role()
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select role from perfis where id = auth.uid() and ativo = true;
$function$
;
CREATE OR REPLACE FUNCTION public.get_my_unidade()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select unidade_id from perfis where id = auth.uid() and ativo = true;
$function$
;
CREATE OR REPLACE FUNCTION public.is_gestao()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select exists (
    select 1 from perfis
    where id = auth.uid()
    and ativo = true
    and role in ('MASTER','ADMIN','DIRETOR','GERENTE')
  );
$function$
;
CREATE OR REPLACE FUNCTION public.is_master_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select exists (
    select 1 from perfis
    where id = auth.uid()
    and ativo = true
    and role in ('MASTER','ADMIN')
  );
$function$
;
CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.atualizado_em = now();
  return new;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.transferir_equipamento(p_equipamento_id uuid, p_unidade_destino_id uuid, p_motivo text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_eq equipamentos%rowtype;
  v_destino_nome text;
  v_num text;
  v_tag_nova text;
begin
  if get_my_role() not in ('MASTER','ADMIN','DIRETOR') then
    raise exception 'Sem permissão para transferir equipamento.';
  end if;

  select * into v_eq from equipamentos where id=p_equipamento_id;
  if not found then raise exception 'Equipamento não encontrado.'; end if;

  select nome into v_destino_nome from unidades where id=p_unidade_destino_id;
  if v_destino_nome is null then raise exception 'Unidade de destino não encontrada.'; end if;

  v_num := coalesce((regexp_match(v_eq.tag,'([0-9]+)$'))[1], nextval('equipamento_tag_global_seq')::text);
  v_tag_nova := 'EA-' || unidade_tag_prefixo(v_destino_nome) || '-' || lpad(v_num,3,'0');

  update equipamentos
  set unidade_id=p_unidade_destino_id, tag=v_tag_nova
  where id=p_equipamento_id;

  insert into equipamentos_transferencias(
    equipamento_id,unidade_origem_id,unidade_destino_id,
    tag_anterior,tag_nova,motivo,usuario_id
  ) values (
    p_equipamento_id,v_eq.unidade_id,p_unidade_destino_id,
    v_eq.tag,v_tag_nova,p_motivo,auth.uid()
  );

  return v_tag_nova;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.trg_os_before_insert()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.sla_limite is null then
    new.sla_limite = calcular_sla(new.prioridade);
  end if;

  if new.setor_id is null and new.equipamento_id is not null then
    select setor_id into new.setor_id from equipamentos where id = new.equipamento_id;
  end if;

  if new.area_id is null and new.equipamento_id is not null then
    select area_id into new.area_id from equipamentos where id = new.equipamento_id;
  end if;

  return new;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.trg_os_status_log()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if tg_op = 'UPDATE' and old.status is distinct from new.status then
    insert into os_historico (
      os_id,
      unidade_id,
      usuario_id,
      status_anterior,
      status_novo,
      acao,
      observacao
    )
    values (
      new.id,
      new.unidade_id,
      auth.uid(),
      old.status,
      new.status,
      'ALTERACAO_STATUS',
      'Status alterado automaticamente pelo sistema'
    );

    if new.status = 'CONCLUIDA' and new.data_conclusao is null then
      new.data_conclusao = now();
    end if;
  end if;

  return new;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.unidade_tag_prefixo(p_nome text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select case
    when upper(p_nome) like '%RIOMAR RECIFE%' then 'RMR'
    when upper(p_nome) like '%RIOMAR FORTALEZA%' then 'RMF'
    when upper(p_nome) like '%ESPINHEIRO%' then 'ESP'
    when upper(p_nome) like '%BOA VIAGEM%' then 'BV'
    when upper(p_nome) like '%PRAIA%' then 'PRAIA'
    else 'EA'
  end;
$function$
;
create view public.vw_auditoria_semanal as  SELECT unidade_id,
    diretor_id,
    (date_trunc('week'::text, criado_em))::date AS semana,
    count(*) AS total_auditorias
   FROM auditorias
  GROUP BY unidade_id, diretor_id, ((date_trunc('week'::text, criado_em))::date);
create view public.vw_custos_por_equipamento as  SELECT e.id AS equipamento_id,
    e.unidade_id,
    e.nome AS equipamento,
    count(os.id) AS total_os,
    COALESCE(sum(((os.custo_material + os.custo_terceiro) + os.custo_interno)), (0)::numeric) AS custo_total
   FROM (equipamentos e
     LEFT JOIN ordens_servico os ON ((os.equipamento_id = e.id)))
  GROUP BY e.id, e.unidade_id, e.nome;
create view public.vw_custos_por_setor as  SELECT s.id AS setor_id,
    s.unidade_id,
    s.nome AS setor,
    count(os.id) AS total_os,
    COALESCE(sum(((os.custo_material + os.custo_terceiro) + os.custo_interno)), (0)::numeric) AS custo_total
   FROM (setores s
     LEFT JOIN ordens_servico os ON ((os.setor_id = s.id)))
  GROUP BY s.id, s.unidade_id, s.nome;
create view public.vw_dashboard_unidades as  SELECT u.id AS unidade_id,
    u.nome AS unidade,
    count(os.id) FILTER (WHERE (os.status <> 'CONCLUIDA'::os_status)) AS os_pendentes,
    count(os.id) FILTER (WHERE (os.status = 'CONCLUIDA'::os_status)) AS os_concluidas,
    count(os.id) FILTER (WHERE ((os.prioridade = 'CRITICA'::os_prioridade) AND (os.status <> 'CONCLUIDA'::os_status))) AS os_criticas,
    COALESCE(sum(((os.custo_material + os.custo_terceiro) + os.custo_interno)), (0)::numeric) AS custo_total
   FROM (unidades u
     LEFT JOIN ordens_servico os ON ((os.unidade_id = u.id)))
  GROUP BY u.id, u.nome;
create view public.vw_produtividade_tecnico as  SELECT p.id AS tecnico_id,
    p.nome AS tecnico,
    os.unidade_id,
    count(os.id) AS total_os,
    count(os.id) FILTER (WHERE (os.status = 'CONCLUIDA'::os_status)) AS concluidas,
    avg((EXTRACT(epoch FROM (os.data_conclusao - os.data_abertura)) / (3600)::numeric)) FILTER (WHERE (os.data_conclusao IS NOT NULL)) AS media_horas_conclusao
   FROM (perfis p
     LEFT JOIN ordens_servico os ON ((os.tecnico_id = p.id)))
  WHERE (p.role = 'TECNICO'::app_role)
  GROUP BY p.id, p.nome, os.unidade_id;
CREATE TRIGGER trg_areas_updated BEFORE UPDATE ON public.areas FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_equipamentos_updated BEFORE UPDATE ON public.equipamentos FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_os_before_insert BEFORE INSERT ON public.ordens_servico FOR EACH ROW EXECUTE FUNCTION trg_os_before_insert();
CREATE TRIGGER trg_os_status_log BEFORE UPDATE ON public.ordens_servico FOR EACH ROW EXECUTE FUNCTION trg_os_status_log();
CREATE TRIGGER trg_os_updated BEFORE UPDATE ON public.ordens_servico FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_perfis_updated BEFORE UPDATE ON public.perfis FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_setores_updated BEFORE UPDATE ON public.setores FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_unidades_updated BEFORE UPDATE ON public.unidades FOR EACH ROW EXECUTE FUNCTION set_updated_at();
alter table public.areas enable row level security;
alter table public.auditorias enable row level security;
alter table public.categorias_manutencao enable row level security;
alter table public.configuracoes_sistema enable row level security;
alter table public.equipamentos enable row level security;
alter table public.equipamentos_transferencias enable row level security;
alter table public.fabricantes enable row level security;
alter table public.fornecedores enable row level security;
alter table public.logs_sistema enable row level security;
alter table public.notificacoes enable row level security;
alter table public.ordens_servico enable row level security;
alter table public.os_anexos enable row level security;
alter table public.os_custos enable row level security;
alter table public.os_historico enable row level security;
alter table public.perfis enable row level security;
alter table public.preventivas_agendamentos enable row level security;
alter table public.preventivas_anexos enable row level security;
alter table public.preventivas_checklist_respostas enable row level security;
alter table public.preventivas_planos enable row level security;
alter table public.setores enable row level security;
alter table public.unidades enable row level security;
create policy "areas_manage_gestao" on public.areas as permissive for ALL to authenticated using (((get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role, 'DIRETOR'::app_role, 'GERENTE'::app_role])) AND can_access_unidade(unidade_id))) with check (((get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role, 'DIRETOR'::app_role, 'GERENTE'::app_role])) AND can_access_unidade(unidade_id)));
create policy "areas_select_scope" on public.areas as permissive for SELECT to authenticated using (can_access_unidade(unidade_id));
create policy "auditorias_insert_diretor" on public.auditorias as permissive for INSERT to authenticated with check ((can_access_unidade(unidade_id) AND (get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role, 'DIRETOR'::app_role]))));
create policy "auditorias_select_scope" on public.auditorias as permissive for SELECT to authenticated using (can_access_unidade(unidade_id));
create policy "categorias_manage_scope" on public.categorias_manutencao as permissive for ALL to authenticated using ((can_access_unidade(unidade_id) AND (get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role, 'DIRETOR'::app_role])))) with check ((can_access_unidade(unidade_id) AND (get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role, 'DIRETOR'::app_role]))));
create policy "categorias_select_scope" on public.categorias_manutencao as permissive for SELECT to authenticated using (can_access_unidade(unidade_id));
create policy "config_select_all" on public.configuracoes_sistema as permissive for SELECT to authenticated using (true);
create policy "config_update_master_admin" on public.configuracoes_sistema as permissive for UPDATE to authenticated using ((get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role]))) with check ((get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role])));
create policy "equipamentos_manage_gestao" on public.equipamentos as permissive for ALL to authenticated using (((get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role, 'DIRETOR'::app_role, 'GERENTE'::app_role])) AND can_access_unidade(unidade_id))) with check (((get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role, 'DIRETOR'::app_role, 'GERENTE'::app_role])) AND can_access_unidade(unidade_id)));
create policy "equipamentos_select_scope" on public.equipamentos as permissive for SELECT to authenticated using (can_access_unidade(unidade_id));
create policy "equipamentos_transferencias_manage" on public.equipamentos_transferencias as permissive for ALL to authenticated using ((get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role, 'DIRETOR'::app_role]))) with check ((get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role, 'DIRETOR'::app_role])));
create policy "equipamentos_transferencias_select" on public.equipamentos_transferencias as permissive for SELECT to authenticated using ((can_access_unidade(unidade_origem_id) OR can_access_unidade(unidade_destino_id) OR (get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role, 'DIRETOR'::app_role]))));
create policy "fabricantes_manage_gestao" on public.fabricantes as permissive for ALL to authenticated using ((get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role, 'DIRETOR'::app_role, 'GERENTE'::app_role]))) with check ((get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role, 'DIRETOR'::app_role, 'GERENTE'::app_role])));
create policy "fabricantes_select_all" on public.fabricantes as permissive for SELECT to authenticated using (true);
create policy "fornecedores_manage_gestao" on public.fornecedores as permissive for ALL to authenticated using (((get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role, 'DIRETOR'::app_role, 'GERENTE'::app_role])) AND ((unidade_id IS NULL) OR can_access_unidade(unidade_id)))) with check (((get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role, 'DIRETOR'::app_role, 'GERENTE'::app_role])) AND ((unidade_id IS NULL) OR can_access_unidade(unidade_id))));
create policy "fornecedores_select_scope" on public.fornecedores as permissive for SELECT to authenticated using (((unidade_id IS NULL) OR can_access_unidade(unidade_id)));
create policy "logs_insert_authenticated" on public.logs_sistema as permissive for INSERT to authenticated with check ((usuario_id = auth.uid()));
create policy "logs_select_gestao" on public.logs_sistema as permissive for SELECT to authenticated using (((get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role, 'DIRETOR'::app_role, 'GERENTE'::app_role])) AND (is_master_admin() OR (unidade_id = get_my_unidade()))));
create policy "notificacoes_select_own" on public.notificacoes as permissive for SELECT to authenticated using ((usuario_id = auth.uid()));
create policy "notificacoes_update_own" on public.notificacoes as permissive for UPDATE to authenticated using ((usuario_id = auth.uid())) with check ((usuario_id = auth.uid()));
create policy "os_insert_authenticated" on public.ordens_servico as permissive for INSERT to authenticated with check (can_access_unidade(unidade_id));
create policy "os_select_scope" on public.ordens_servico as permissive for SELECT to authenticated using ((can_access_unidade(unidade_id) OR (solicitante_id = auth.uid()) OR (tecnico_id = auth.uid())));
create policy "os_update_tecnico_gestao" on public.ordens_servico as permissive for UPDATE to authenticated using ((can_access_unidade(unidade_id) AND (get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role, 'DIRETOR'::app_role, 'GERENTE'::app_role, 'TECNICO'::app_role])))) with check ((can_access_unidade(unidade_id) AND (get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role, 'DIRETOR'::app_role, 'GERENTE'::app_role, 'TECNICO'::app_role]))));
create policy "os_anexos_scope" on public.os_anexos as permissive for ALL to authenticated using (can_access_unidade(unidade_id)) with check (can_access_unidade(unidade_id));
create policy "os_custos_insert_tecnico_gestao" on public.os_custos as permissive for INSERT to authenticated with check ((can_access_unidade(unidade_id) AND (get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role, 'DIRETOR'::app_role, 'GERENTE'::app_role, 'TECNICO'::app_role]))));
create policy "os_custos_select_gestao" on public.os_custos as permissive for SELECT to authenticated using ((can_access_unidade(unidade_id) AND (get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role, 'DIRETOR'::app_role, 'GERENTE'::app_role]))));
create policy "os_historico_insert_authenticated" on public.os_historico as permissive for INSERT to authenticated with check (can_access_unidade(unidade_id));
create policy "os_historico_select_scope" on public.os_historico as permissive for SELECT to authenticated using (can_access_unidade(unidade_id));
create policy "perfis_manage_master_admin" on public.perfis as permissive for ALL to authenticated using ((get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role]))) with check ((get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role])));
create policy "perfis_select_scope" on public.perfis as permissive for SELECT to authenticated using (((id = auth.uid()) OR (get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role, 'DIRETOR'::app_role])) OR (unidade_id = get_my_unidade())));
create policy "preventivas_agendamentos_manage_tecnico_gestao" on public.preventivas_agendamentos as permissive for ALL to authenticated using ((can_access_unidade(unidade_id) AND (get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role, 'DIRETOR'::app_role, 'GERENTE'::app_role, 'TECNICO'::app_role])))) with check ((can_access_unidade(unidade_id) AND (get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role, 'DIRETOR'::app_role, 'GERENTE'::app_role, 'TECNICO'::app_role]))));
create policy "preventivas_agendamentos_select_scope" on public.preventivas_agendamentos as permissive for SELECT to authenticated using (can_access_unidade(unidade_id));
create policy "preventivas_anexos_insert_scope" on public.preventivas_anexos as permissive for INSERT to authenticated with check ((can_access_unidade(unidade_id) AND (get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role, 'DIRETOR'::app_role, 'GERENTE'::app_role, 'TECNICO'::app_role]))));
create policy "preventivas_anexos_select_scope" on public.preventivas_anexos as permissive for SELECT to authenticated using (can_access_unidade(unidade_id));
create policy "checklist_manage_tecnico_gestao" on public.preventivas_checklist_respostas as permissive for ALL to authenticated using ((EXISTS ( SELECT 1
   FROM preventivas_agendamentos p
  WHERE ((p.id = preventivas_checklist_respostas.agendamento_id) AND can_access_unidade(p.unidade_id) AND (get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role, 'DIRETOR'::app_role, 'GERENTE'::app_role, 'TECNICO'::app_role])))))) with check ((EXISTS ( SELECT 1
   FROM preventivas_agendamentos p
  WHERE ((p.id = preventivas_checklist_respostas.agendamento_id) AND can_access_unidade(p.unidade_id) AND (get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role, 'DIRETOR'::app_role, 'GERENTE'::app_role, 'TECNICO'::app_role]))))));
create policy "checklist_select_scope" on public.preventivas_checklist_respostas as permissive for SELECT to authenticated using ((EXISTS ( SELECT 1
   FROM preventivas_agendamentos p
  WHERE ((p.id = preventivas_checklist_respostas.agendamento_id) AND can_access_unidade(p.unidade_id)))));
create policy "preventivas_planos_manage_gestao" on public.preventivas_planos as permissive for ALL to authenticated using ((can_access_unidade(unidade_id) AND (get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role, 'DIRETOR'::app_role, 'GERENTE'::app_role])))) with check ((can_access_unidade(unidade_id) AND (get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role, 'DIRETOR'::app_role, 'GERENTE'::app_role]))));
create policy "preventivas_planos_select_scope" on public.preventivas_planos as permissive for SELECT to authenticated using (can_access_unidade(unidade_id));
create policy "setores_manage_gestao" on public.setores as permissive for ALL to authenticated using (((get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role, 'DIRETOR'::app_role, 'GERENTE'::app_role])) AND can_access_unidade(unidade_id))) with check (((get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role, 'DIRETOR'::app_role, 'GERENTE'::app_role])) AND can_access_unidade(unidade_id)));
create policy "setores_select_scope" on public.setores as permissive for SELECT to authenticated using (can_access_unidade(unidade_id));
create policy "unidades_manage_master" on public.unidades as permissive for ALL to authenticated using ((get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role]))) with check ((get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role])));
create policy "unidades_select" on public.unidades as permissive for SELECT to authenticated using (true);
create policy "branding_admin" on storage.objects as permissive for ALL to authenticated using (((bucket_id = 'branding'::text) AND (get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role])))) with check (((bucket_id = 'branding'::text) AND (get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role]))));
create policy "branding_read" on storage.objects as permissive for SELECT to public using ((bucket_id = 'branding'::text));
create policy "equipamentos_fotos_read" on storage.objects as permissive for SELECT to authenticated using ((bucket_id = 'equipamentos-fotos'::text));
create policy "equipamentos_fotos_upload" on storage.objects as permissive for INSERT to authenticated with check (((bucket_id = 'equipamentos-fotos'::text) AND (get_my_role() = ANY (ARRAY['MASTER'::app_role, 'ADMIN'::app_role, 'DIRETOR'::app_role, 'GERENTE'::app_role]))));
create policy "os_anexos_read" on storage.objects as permissive for SELECT to authenticated using ((bucket_id = 'os-anexos'::text));
create policy "os_anexos_update" on storage.objects as permissive for UPDATE to authenticated using ((bucket_id = 'os-anexos'::text)) with check ((bucket_id = 'os-anexos'::text));
create policy "os_anexos_upload" on storage.objects as permissive for INSERT to authenticated with check ((bucket_id = 'os-anexos'::text));
insert into storage.buckets(id,name,public) values ('os-anexos','os-anexos',true);
insert into storage.buckets(id,name,public) values ('equipamentos-fotos','equipamentos-fotos',true);
insert into storage.buckets(id,name,public) values ('branding','branding',true);
grant select,insert,update,delete on all tables in schema public to anon, authenticated; grant usage,select on all sequences in schema public to anon, authenticated; grant select,insert,update,delete on storage.objects, storage.buckets to anon, authenticated;