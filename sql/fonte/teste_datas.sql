\set QUIET 1
-- datas por frequência
select 'MENSAL d31 fev' t, array_agg(d) from datas_plano_no_mes('MENSAL',31::smallint,null,'2026-01-01','2026-02-01') d
union all select 'TRIMESTRAL ini jan, abr', array_agg(d) from datas_plano_no_mes('TRIMESTRAL',5::smallint,null,'2026-01-15','2026-04-01') d
union all select 'TRIMESTRAL ini jan, mai', array_agg(d) from datas_plano_no_mes('TRIMESTRAL',5::smallint,null,'2026-01-15','2026-05-01') d
union all select 'MENSAL inicio dia 20, dia 10 mesmo mes', array_agg(d) from datas_plano_no_mes('MENSAL',10::smallint,null,'2026-11-20','2026-11-01') d
union all select 'SEMANAL seg nov', array_agg(d) from datas_plano_no_mes('SEMANAL',10::smallint,1::smallint,'2026-10-01','2026-11-01') d
union all select 'QUINZENAL seg nov (ancora 05/10)', array_agg(d) from datas_plano_no_mes('QUINZENAL',10::smallint,1::smallint,'2026-10-01','2026-11-01') d
union all select 'antes do inicio', array_agg(d) from datas_plano_no_mes('MENSAL',10::smallint,null,'2027-01-01','2026-11-01') d;

-- gerente RMR cria planos e gera
set role authenticated; select set_config('request.jwt.uid','00000000-0000-0000-0000-00000000000b',false);
insert into preventivas_planos(unidade_id,equipamento_id,nome,frequencia,dia_previsto,checklist_itens,tipo_execucao,empresa_padrao,responsavel_id,data_inicio,dia_semana)
values ('11111111-1111-1111-1111-111111111111','e0000000-0000-0000-0000-000000000001','Fritadeira mensal','MENSAL',10,'["Item A","Item B"]','INTERNA',null,'00000000-0000-0000-0000-00000000000c','2026-10-01',null),
       ('11111111-1111-1111-1111-111111111111','e0000000-0000-0000-0000-000000000002','Câmara semanal','SEMANAL',1,'["Temp"]','TERCEIRIZADA','Frio Ltda',null,'2026-10-01',3);
select 'gerar nov (1ª vez)' t, gerar_preventivas_mes('11111111-1111-1111-1111-111111111111','2026-11-01');
select 'gerar nov (2ª vez, não duplica)' t, gerar_preventivas_mes('11111111-1111-1111-1111-111111111111','2026-11-01');
select data_programada, tipo_execucao, empresa_executora, checklist_itens, observacoes, situacao_preventiva(status,data_programada,com_nc) from preventivas_agendamentos where plano_id is not null order by 1;
-- gerente RMR tentando gerar BV
do $$ begin perform gerar_preventivas_mes('22222222-2222-2222-2222-222222222222','2026-11-01'); raise notice 'FALHA: gerou em outra unidade'; exception when others then raise notice 'OK bloqueado outra unidade: %', sqlerrm; end $$;
-- cancelamento sem motivo
do $$ begin update preventivas_agendamentos set status='CANCELADA' where data_programada='2026-11-04'; raise notice 'FALHA: cancelou sem motivo'; exception when others then raise notice 'OK cancelamento exige motivo: %', sqlerrm; end $$;
update preventivas_agendamentos set status='CANCELADA', cancelado_motivo='Equipamento em reforma', cancelado_por=auth.uid(), cancelado_em=now() where data_programada='2026-11-04';
-- tecnico tenta validar
select set_config('request.jwt.uid','00000000-0000-0000-0000-00000000000c',false);
update preventivas_agendamentos set status='CONCLUIDA', com_nc=true, tecnico_externo='João (Frio Ltda)' where data_programada='2026-11-11';
do $$ begin update preventivas_agendamentos set validado_por=auth.uid() where data_programada='2026-11-11'; raise notice 'FALHA: técnico validou'; exception when others then raise notice 'OK técnico não valida: %', sqlerrm; end $$;
select set_config('request.jwt.uid','00000000-0000-0000-0000-00000000000b',false);
update preventivas_agendamentos set validado_por=auth.uid(), validacao_obs='ok' where data_programada='2026-11-11';
select data_programada, status, situacao_preventiva(status,data_programada,com_nc), validado_por is not null validado, validado_em is not null from preventivas_agendamentos where plano_id is not null order by 1;
-- gerente BV não vê RMR
select set_config('request.jwt.uid','00000000-0000-0000-0000-00000000000d',false);
select 'BV vê agend. RMR' t, count(*) from preventivas_agendamentos;
select 'BV vê views (dashboard)' t, count(*) from vw_dashboard_unidades where unidade_id='11111111-1111-1111-1111-111111111111' and os_pendentes>-1;
reset role;
set role anon; select set_config('request.jwt.uid','',false);
do $$ begin perform * from vw_dashboard_unidades; raise notice 'FALHA anon leu view'; exception when others then raise notice 'OK anon sem view: %', sqlerrm; end $$;
reset role;
select 'situacao atrasada (data passada)' t, situacao_preventiva('AGENDADA','2026-07-20',false);
