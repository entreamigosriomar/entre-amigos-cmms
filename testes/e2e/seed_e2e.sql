insert into auth.users values ('00000000-0000-0000-0000-0000000000ee'),('00000000-0000-0000-0000-00000000000b'),('00000000-0000-0000-0000-00000000000c'),('00000000-0000-0000-0000-0000000000d1');
insert into unidades(id,nome,cidade) values
 ('11111111-1111-1111-1111-111111111111','RioMar Recife','Recife'),
 ('22222222-2222-2222-2222-222222222222','Boa Viagem','Recife'),
 ('33333333-3333-3333-3333-333333333333','Espinheiro','Recife'),
 ('44444444-4444-4444-4444-444444444444','Praia','Recife'),
 ('55555555-5555-5555-5555-555555555555','RioMar Fortaleza','Fortaleza');
insert into perfis(id,nome,email,role,unidade_id) values
 ('00000000-0000-0000-0000-0000000000ee','Walter','walter@teste.com','DIRETOR',null),
 ('00000000-0000-0000-0000-00000000000b','Marina','gerente@teste.com','GERENTE','11111111-1111-1111-1111-111111111111'),
 ('00000000-0000-0000-0000-00000000000c','Carlos','tecnico@teste.com','TECNICO','11111111-1111-1111-1111-111111111111'),
 ('00000000-0000-0000-0000-0000000000d1','Juliana','lider@teste.com','OPERADOR','11111111-1111-1111-1111-111111111111');
insert into configuracoes_sistema(empresa_nome,cor_primaria,cor_secundaria,meta_auditoria_semanal,exigir_foto_concluir_os,limite_aprovacao) values ('Entre Amigos','#1C335D','#E94D10',5,true,1000);
