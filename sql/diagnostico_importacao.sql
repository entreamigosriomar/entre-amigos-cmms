-- Diagnóstico da importação (somente leitura)
select 'indice' as tipo, indexname as nome, indexdef as detalhe
from pg_indexes where schemaname = 'public' and tablename = 'equipamentos'
union all
select 'gatilho', tgname, pg_get_triggerdef(t.oid)
from pg_trigger t where tgrelid = 'public.equipamentos'::regclass and not tgisinternal
union all
select 'sequencia', 'equipamento_tag_global_seq', last_value::text
from public.equipamento_tag_global_seq
union all
select 'equipamento', coalesce(tag, '(sem tag)'), nome || ' | ' || coalesce(numero, '-') || ' | ' || coalesce(qr_code, '-')
from (select * from public.equipamentos order by criado_em desc limit 8) e
order by 1, 2;
