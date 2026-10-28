-- =====================================================================
-- 07a — Diagnóstico das preventivas (SOMENTE LEITURA — não altera nada)
-- Rode no SQL Editor do Supabase e me mande o resultado (print ou cópia).
-- =====================================================================

-- 1) Estrutura e biblioteca: o SQL 02 e o SQL 04 foram aplicados?
select '1. biblioteca' as bloco,
       (select count(*) from public.preventiva_rotinas)                     as rotinas_total,
       (select count(*) from public.preventiva_rotinas where ativo)         as rotinas_ativas,
       (select count(*) from public.preventiva_rotina_itens where ativo)    as itens_checklist_ativos;
-- Esperado: 51 rotinas e 364 itens. Se der erro "relation does not exist": falta o SQL 02.
-- Se der 0 rotinas: falta o SQL 04 (carga da biblioteca do manual).

-- 2) Por unidade: equipamentos, tipo preenchido, planos e preventivas do mês
select '2. por unidade' as bloco, u.nome as unidade,
       count(distinct e.id)                                                   as equipamentos_ativos,
       count(distinct e.id) filter (where e.tipo_equipamento is not null)    as com_tipo,
       count(distinct p.id) filter (where p.ativo)                           as planos_ativos,
       (select count(*) from public.preventivas_agendamentos a
         where a.unidade_id = u.id
           and a.data_programada >= date_trunc('month', (now() at time zone 'America/Recife'))::date
           and a.data_programada <  (date_trunc('month', (now() at time zone 'America/Recife')) + interval '1 month')::date)
                                                                              as preventivas_mes_atual
from public.unidades u
left join public.equipamentos e on e.unidade_id = u.id and e.ativo
left join public.preventivas_planos p on p.equipamento_id = e.id
where u.ativo
group by u.id, u.nome
order by u.nome;

-- 3) Equipamentos que DEVERIAM ter plano e não têm (prévia do que o 07b vai criar)
select '3. planos faltando' as bloco, u.nome as unidade, e.tipo_equipamento,
       count(distinct e.id) as equipamentos, count(*) as planos_a_criar,
       string_agg(distinct r.codigo, ', ') as rotinas
from public.equipamentos e
join public.unidades u on u.id = e.unidade_id
join public.preventiva_rotinas r on r.tipo_equipamento = e.tipo_equipamento and r.ativo
where e.ativo
  and not exists (select 1 from public.preventivas_planos p
                  where p.equipamento_id = e.id and p.rotina_id = r.id and p.ativo)
group by u.nome, e.tipo_equipamento
order by u.nome, e.tipo_equipamento;

-- 4) Tipos usados nos equipamentos que NÃO existem na biblioteca
--    (nome diferente = o equipamento nunca recebe preventiva)
select '4. tipo sem rotina' as bloco, coalesce(e.tipo_equipamento, '(vazio)') as tipo_equipamento,
       count(*) as equipamentos
from public.equipamentos e
where e.ativo
  and not exists (select 1 from public.preventiva_rotinas r
                  where r.tipo_equipamento = e.tipo_equipamento and r.ativo)
group by 2
order by 3 desc;
-- Normal aparecer: Mobiliário, TI e KDS, Predial e estrutura, Outro equipamento (só chamados).
