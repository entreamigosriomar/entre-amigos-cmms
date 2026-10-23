#!/bin/bash
set -e
P="psql -h /tmp -p 5433 -U postgres -v ON_ERROR_STOP=1 -q"
SQL=/home/claude/entreamigosriomar/entre-amigos-cmms/sql
$P -c "select pg_terminate_backend(pid) from pg_stat_activity where datname='e2e' and pid<>pg_backend_pid()" >/dev/null; $P -c "drop database if exists e2e" -c "create database e2e"
sed 's/current_setting(.request.jwt.uid., true)/(current_setting($q$request.jwt.claims$q$, true)::json->>$q$sub$q$)/' $(dirname $0)/replica.sql > replica_e2e.sql
grep -c "request.jwt.claims" replica_e2e.sql
$P -d e2e -f replica_e2e.sql
$P -d e2e <<'SQL'
do $$ begin create role authenticator login password 'auth' noinherit; exception when others then null; end $$;
grant anon, authenticated to authenticator;
grant usage on schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
SQL
$P -d e2e -f seed_e2e.sql
$P -d e2e -f $SQL/01_fechar_views.sql >/dev/null
$P -d e2e -f $SQL/02_preventivas_mensais.sql >/dev/null 2>&1
$P -d e2e -f $SQL/04_carga_biblioteca.sql >/dev/null
$P -d e2e -f $SQL/05_chamados_e_locais.sql >/dev/null 2>&1
$P -d e2e -f $SQL/03_fotos_privadas.sql >/dev/null 2>&1
$P -d e2e -c "grant select,insert,update,delete on all tables in schema public to authenticated; grant usage,select on all sequences in schema public to authenticated; grant execute on all functions in schema public to authenticated;"
echo DB_OK
