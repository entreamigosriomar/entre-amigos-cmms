\set QUIET 1
\pset footer off
insert into auth.users values ('00000000-0000-0000-0000-0000000000ee');
insert into perfis(id,nome,email,role,unidade_id) values ('00000000-0000-0000-0000-0000000000ee','Walter','w@x','DIRETOR',null);
set role authenticated;
-- gerente não edita biblioteca nem planos
select set_config('request.jwt.uid','00000000-0000-0000-0000-00000000000b',false);
do $$ begin update preventiva_rotinas set nome='x' where codigo='GAS-FRI-M'; if found then raise notice 'FALHA gerente editou'; else raise notice 'OK gerente não edita biblioteca (0 linhas)'; end if; end $$;
do $$ begin insert into preventivas_planos(unidade_id,equipamento_id,nome) values ('11111111-1111-1111-1111-111111111111','e0000000-0000-0000-0000-000000000001','x'); raise notice 'FALHA gerente criou plano'; exception when others then raise notice 'OK gerente não cria plano'; end $$;
select 'gerente lê biblioteca' t, count(*) from preventiva_rotinas;
-- diretor: cria item novo, faixa e planos
select set_config('request.jwt.uid','00000000-0000-0000-0000-0000000000ee',false);
update preventiva_rotinas set nome='Teste de gás, queimadores e limpeza profunda' where codigo='GAS-FRI-M';
insert into equipamento_faixas(equipamento_id,unidade_id,item_id,minimo,maximo,fonte)
select 'e0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111',i.id,-22,-18,'Nutrição'
from preventiva_rotina_itens i join preventiva_rotinas r on r.id=i.rotina_id where r.codigo='REF-CAM-T' and i.ordem=1;
insert into preventivas_planos(unidade_id,equipamento_id,nome,rotina_id,frequencia,dia_previsto,dia_semana,tipo_execucao,data_inicio)
select '11111111-1111-1111-1111-111111111111','e0000000-0000-0000-0000-000000000001',r.codigo||' — '||r.nome,r.id,r.frequencia,10,null,r.executor,'2026-10-01' from preventiva_rotinas r where codigo='GAS-FRI-M';
insert into preventivas_planos(unidade_id,equipamento_id,nome,rotina_id,frequencia,dia_previsto,dia_semana,tipo_execucao,data_inicio)
select '11111111-1111-1111-1111-111111111111','e0000000-0000-0000-0000-000000000002',r.codigo||' — '||r.nome,r.id,r.frequencia,15,null,r.executor,'2026-10-01' from preventiva_rotinas r where codigo='REF-CAM-T';
insert into preventivas_planos(unidade_id,equipamento_id,nome,rotina_id,frequencia,dia_previsto,dia_semana,tipo_execucao,data_inicio)
select '11111111-1111-1111-1111-111111111111','e0000000-0000-0000-0000-000000000001',r.codigo||' — '||r.nome,r.id,r.frequencia,1,1,r.executor,'2026-10-01' from preventiva_rotinas r where codigo='EXA-CCV-S';
do $$ begin insert into preventivas_planos(unidade_id,equipamento_id,nome,rotina_id,frequencia) select '11111111-1111-1111-1111-111111111111','e0000000-0000-0000-0000-000000000001','dup',r.id,'MENSAL' from preventiva_rotinas r where codigo='GAS-FRI-M'; raise notice 'FALHA plano duplicado'; exception when unique_violation then raise notice 'OK plano duplicado bloqueado'; end $$;
select 'gerar out' t, gerar_preventivas_mes('11111111-1111-1111-1111-111111111111','2026-10-01');
select 'gerar nov' t, gerar_preventivas_mes('11111111-1111-1111-1111-111111111111','2026-11-01');
select 'gerar dez' t, gerar_preventivas_mes('11111111-1111-1111-1111-111111111111','2026-12-01');
select 'gerar jan' t, gerar_preventivas_mes('11111111-1111-1111-1111-111111111111','2027-01-01');
select to_char(data_programada,'YYYY-MM-DD') d, observacoes, tipo_execucao, jsonb_array_length(checklist_itens) itens, situacao_preventiva(status,data_programada,com_nc) from preventivas_agendamentos where plano_id is not null order by 1,2 limit 30;
select 'câmara item1 faixa' t, checklist_itens->0->>'minimo' min, checklist_itens->0->>'maximo' max, checklist_itens->8->>'faixa_pendente' pressao_pendente from preventivas_agendamentos where observacoes like '%REF-CAM-T%' limit 1;
-- edição da biblioteca não muda histórico
update preventiva_rotina_itens set texto='ALTERADO' where rotina_id=(select id from preventiva_rotinas where codigo='GAS-FRI-M') and ordem=1;
select 'snapshot preservado' t, checklist_itens->0->>'texto' from preventivas_agendamentos where observacoes like '%GAS-FRI-M%' limit 1;
-- técnico responde
select set_config('request.jwt.uid','00000000-0000-0000-0000-00000000000c',false);
insert into preventivas_checklist_respostas(agendamento_id,item_id,ordem,item,resposta,valor,nc,observacao,criticidade)
select a.id,(a.checklist_itens->0->>'item_id')::uuid,1,'Temp','NAO_CONFORME',-10,true,'Câmara a -10',
 'ALTA' from preventivas_agendamentos a where observacoes like '%REF-CAM-T%' limit 1;
do $$ begin insert into preventivas_checklist_respostas(agendamento_id,item_id,item,resposta,nc) select a.id, gen_random_uuid(),'x','NAO_CONFORME',true from preventivas_agendamentos a limit 1; raise notice 'FALHA NC sem observação'; exception when check_violation then raise notice 'OK NC exige observação'; end $$;
select 'tecnico vê biblioteca' t, count(*) from preventiva_rotina_itens;
do $$ begin delete from preventiva_rotinas where codigo='PRE-DIV-M'; if found then raise notice 'FALHA tecnico apagou'; else raise notice 'OK tecnico não apaga'; end if; end $$;
-- diretor apaga rotina em uso -> bloqueado (restrict), desativa ok
select set_config('request.jwt.uid','00000000-0000-0000-0000-0000000000ee',false);
do $$ begin delete from preventiva_rotinas where codigo='GAS-FRI-M'; raise notice 'FALHA apagou rotina em uso'; exception when foreign_key_violation then raise notice 'OK rotina em uso não apaga (desativar)'; end $$;
update preventiva_rotinas set ativo=false where codigo='EXA-CCV-S';
select 'gerar fev sem EXA-CCV-S' t, gerar_preventivas_mes('11111111-1111-1111-1111-111111111111','2027-02-01');
reset role;
