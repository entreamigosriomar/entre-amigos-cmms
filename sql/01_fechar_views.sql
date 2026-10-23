-- =====================================================================
-- 01 — Fechar as views para respeitarem o RLS
-- Projeto: manutencao-entre-amigos (Supabase)
--
-- O que faz:
--   As 5 views passam a rodar com a permissão de QUEM CONSULTA
--   (security_invoker), e não mais do dono. Assim cada usuário só vê
--   as unidades a que tem acesso, igual às tabelas.
--   Também tira o acesso do usuário anônimo (sem login).
--
-- O que NÃO faz:
--   Não altera tabelas, dados, colunas nem a lógica das views.
--   O sistema (V16.1 e V18) não usa essas views, então nada na tela muda.
--
-- Como desfazer (se precisar):
--   alter view public.<nome> set (security_invoker = false);
--   grant select on public.<nome> to anon;
-- =====================================================================

begin;

alter view public.vw_auditoria_semanal      set (security_invoker = true);
alter view public.vw_custos_por_equipamento set (security_invoker = true);
alter view public.vw_custos_por_setor       set (security_invoker = true);
alter view public.vw_dashboard_unidades     set (security_invoker = true);
alter view public.vw_produtividade_tecnico  set (security_invoker = true);

revoke all on public.vw_auditoria_semanal      from anon;
revoke all on public.vw_custos_por_equipamento from anon;
revoke all on public.vw_custos_por_setor       from anon;
revoke all on public.vw_dashboard_unidades     from anon;
revoke all on public.vw_produtividade_tecnico  from anon;

commit;

-- ---------------------------------------------------------------------
-- Conferência (rode depois; deve trazer 5 linhas com
-- security_invoker = true e anon_pode_ler = false)
-- ---------------------------------------------------------------------
select c.relname as view,
       coalesce(c.reloptions::text, '') like '%security_invoker=true%' as security_invoker,
       has_table_privilege('anon', c.oid, 'select') as anon_pode_ler
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'v'
order by 1;
