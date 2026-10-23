-- =====================================================================
-- 03 — Fotos privadas (só quem tem acesso à unidade vê)
-- Projeto: manutencao-entre-amigos (Supabase)  •  Versão: V18.1
--
-- ATENÇÃO À ORDEM: rode este arquivo SÓ DEPOIS que a V18.1 estiver
-- publicada no GitHub Pages. A V16.1 abre as fotos por link público;
-- depois deste SQL, esses links param de funcionar. A V18.1 já abre as
-- fotos com link temporário (válido por 1 hora) e funciona com as
-- fotos antigas e novas.
--
-- O que faz:
--   1. Torna privados os buckets os-anexos e equipamentos-fotos
--      (branding, com o logo, continua público).
--   2. Fotos de OS e preventiva: cada usuário só lê e envia fotos da
--      pasta da sua unidade (a 1ª pasta do caminho é o id da unidade).
--   3. Remove a permissão de sobrescrever fotos (UPDATE).
--
-- Como desfazer:
--   update storage.buckets set public = true
--    where id in ('os-anexos','equipamentos-fotos');
-- =====================================================================

begin;

create or replace function public.storage_unidade_permitida(p_nome text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when split_part(p_nome, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.can_access_unidade(split_part(p_nome, '/', 1)::uuid)
    else false
  end;
$$;

revoke execute on function public.storage_unidade_permitida(text) from anon, public;
grant  execute on function public.storage_unidade_permitida(text) to authenticated;

update storage.buckets set public = false where id in ('os-anexos', 'equipamentos-fotos');

drop policy if exists os_anexos_read   on storage.objects;
drop policy if exists os_anexos_upload on storage.objects;
drop policy if exists os_anexos_update on storage.objects;

create policy os_anexos_read on storage.objects
  for select to authenticated
  using (bucket_id = 'os-anexos' and public.storage_unidade_permitida(name));

create policy os_anexos_upload on storage.objects
  for insert to authenticated
  with check (bucket_id = 'os-anexos' and public.storage_unidade_permitida(name));

commit;

-- ---------------------------------------------------------------------
-- Conferência: os-anexos e equipamentos-fotos devem aparecer como
-- publico = false; e as políticas de os-anexos só SELECT e INSERT.
-- ---------------------------------------------------------------------
select id, public as publico from storage.buckets order by id;
select policyname, cmd from pg_policies
where schemaname = 'storage' and policyname like 'os_anexos%' order by 1;
