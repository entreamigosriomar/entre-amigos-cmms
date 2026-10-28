-- =====================================================================
-- 07b — Cria os planos de preventiva que faltam nos equipamentos já cadastrados
--
-- Por que: os planos só eram criados no momento do cadastro/importação do
-- equipamento. Se a biblioteca (SQL 04) entrou depois, ou o tipo foi
-- preenchido depois, o equipamento ficou sem plano — e sem plano o sistema
-- não gera preventiva nem checklist.
--
-- Segurança: SÓ INSERE. Não apaga, não altera planos, preventivas, OS ou
-- equipamentos existentes. Pode rodar de novo sem duplicar.
-- Pré-requisito: SQL 02 e SQL 04 aplicados (confira com o 07a, bloco 1).
-- =====================================================================
begin;

insert into public.preventivas_planos (
  unidade_id, equipamento_id, rotina_id, nome, frequencia,
  dia_previsto, dia_semana, data_inicio, ultima_execucao,
  tipo_execucao, empresa_padrao, ativo)
select e.unidade_id, e.id, r.id, r.codigo || ' — ' || r.nome, r.frequencia,
       10,
       case when r.frequencia in ('SEMANAL','QUINZENAL') then 1 end,
       v.inicio,
       null,
       r.executor, null, true
from public.equipamentos e
join public.preventiva_rotinas r on r.tipo_equipamento = e.tipo_equipamento and r.ativo
cross join lateral (
  -- Mesma regra da tela Importar: a partir do dia 15, os planos começam no mês seguinte
  -- (evita jogar todas as preventivas como atrasadas nos últimos dias do mês).
  select case when extract(day from (now() at time zone 'America/Recife')) >= 15
              then (date_trunc('month', (now() at time zone 'America/Recife')) + interval '1 month')::date
              else (now() at time zone 'America/Recife')::date end as inicio
) v
where e.ativo
  and not exists (select 1 from public.preventivas_planos p
                  where p.equipamento_id = e.id and p.rotina_id = r.id and p.ativo);

commit;

-- Conferência: planos ativos por unidade depois da carga
select u.nome as unidade, count(p.id) as planos_ativos
from public.unidades u
left join public.preventivas_planos p on p.unidade_id = u.id and p.ativo
where u.ativo
group by u.nome
order by u.nome;
