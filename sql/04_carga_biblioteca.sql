-- =====================================================================
-- 04 — Carga inicial da biblioteca de rotinas (51 rotinas, 364 itens)
-- Fonte: Manual de Manutenções Preventivas v1.0 (05/2025), aprovado
-- pelo diretor em 23/10/2026. Rode depois do 02.
--
-- Pode rodar de novo sem duplicar: rotinas já existentes (mesmo código)
-- são mantidas como estão, inclusive com as edições feitas pela tela.
-- =====================================================================
begin;

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('CLI-SPL-M', 'CLI', 'Ar-condicionado split (hi-wall)', 'Limpeza, medições e teste', 'MENSAL', 'INTERNA', 'Registro serve de evidência para o PMOC', 'Ar condicionado split')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Funcionamento inicial sem ruído ou falha', 'VERIFICACAO', 'Liga e refrigera normalmente', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (2, null, 'Temperatura do ar insuflado', 'MEDICAO', 'Até 12 °C', 'ALTA', '°C', null::numeric, 12::numeric, false, false, false, false),
  (3, null, 'Bloqueio: disjuntor desligado após o teste inicial', 'VERIFICACAO', 'Disjuntor identificado e desligado', 'CRITICA', null, null::numeric, null::numeric, false, true, false, false),
  (4, null, 'Filtros, direcionadores e turbinas limpos', 'VERIFICACAO', 'Sem poeira visível', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (5, null, 'Serpentina limpa com álcool, sem molhar a parte elétrica', 'VERIFICACAO', 'Serpentina limpa; elétrica seca', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (6, null, 'Conexões elétricas da evaporadora reapertadas', 'VERIFICACAO', 'Sem folga', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (7, null, 'Condensadora: parte elétrica e gabinete limpos', 'VERIFICACAO', 'Sem poeira ou gordura', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (8, null, 'Hélice da condensadora sem oscilação ou ruído', 'VERIFICACAO', 'Gira liso', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (9, null, 'Tensão no quadro de comando da condensadora', 'MEDICAO', 'Dentro da faixa do equipamento', 'ALTA', 'V', null::numeric, null::numeric, true, false, false, false),
  (10, null, 'Corrente no quadro de comando da condensadora', 'MEDICAO', 'Até a corrente nominal da placa', 'ALTA', 'A', null::numeric, null::numeric, true, false, false, false),
  (11, null, 'Tubulação frigorígena isolada e sem vazamento', 'VERIFICACAO', 'Sem óleo nas conexões; isolamento inteiro', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (12, null, 'Teste final após montagem', 'VERIFICACAO', 'Liga, refrigera e sem ruído', 'ALTA', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('CLI-CAS-M', 'CLI', 'Ar-condicionado split cassete', 'Limpeza, medições e teste', 'MENSAL', 'INTERNA', 'Registro serve de evidência para o PMOC', 'Ar condicionado split cassete')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Funcionamento inicial sem ruído ou falha', 'VERIFICACAO', 'Liga e refrigera normalmente', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (2, null, 'Temperatura do ar insuflado', 'MEDICAO', 'Até 12 °C', 'ALTA', '°C', null::numeric, 12::numeric, false, false, false, false),
  (3, null, 'Bloqueio: disjuntor desligado após o teste inicial', 'VERIFICACAO', 'Disjuntor identificado e desligado', 'CRITICA', null, null::numeric, null::numeric, false, true, false, false),
  (4, null, 'Display desconectado antes da desmontagem e reconectado no final', 'VERIFICACAO', 'Display funcionando no teste final', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (5, null, 'Filtros, direcionadores e turbinas limpos', 'VERIFICACAO', 'Sem poeira visível', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (6, null, 'Serpentina limpa com álcool, sem molhar a parte elétrica', 'VERIFICACAO', 'Serpentina limpa; elétrica seca', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (7, null, 'Conexões elétricas da evaporadora reapertadas', 'VERIFICACAO', 'Sem folga', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (8, null, 'Condensadora: parte elétrica e gabinete limpos', 'VERIFICACAO', 'Sem poeira ou gordura', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (9, null, 'Hélice da condensadora sem oscilação ou ruído', 'VERIFICACAO', 'Gira liso', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (10, null, 'Tensão no quadro de comando da condensadora', 'MEDICAO', 'Dentro da faixa do equipamento', 'ALTA', 'V', null::numeric, null::numeric, true, false, false, false),
  (11, null, 'Corrente no quadro de comando da condensadora', 'MEDICAO', 'Até a corrente nominal da placa', 'ALTA', 'A', null::numeric, null::numeric, true, false, false, false),
  (12, null, 'Tubulação frigorígena isolada e sem vazamento', 'VERIFICACAO', 'Sem óleo nas conexões; isolamento inteiro', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (13, null, 'Teste final após montagem', 'VERIFICACAO', 'Liga, refrigera e sem ruído', 'ALTA', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('CLI-CXV-M', 'CLI', 'Caixa de ventilação (insuflamento)', 'Limpeza dos filtros', 'MENSAL', 'INTERNA', 'Fazer antes do prazo se o filtro estiver saturado', 'Caixas de ventilação')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Filtros íntegros, sem rasgos ou deformação', 'VERIFICACAO', 'Filtro inteiro; trocar se rasgado', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (2, null, 'Filtros limpos com ar comprimido de baixa pressão', 'VERIFICACAO', 'Sem poeira acumulada', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Filtros reinstalados e tampa de inspeção fechada', 'VERIFICACAO', 'Encaixados sem fresta', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (4, null, 'Teste de funcionamento do insuflamento', 'VERIFICACAO', 'Ventila normalmente', 'ALTA', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('CLI-VEN-M', 'CLI', 'Ventilador (parede ou coluna)', 'Limpeza e lubrificação', 'MENSAL', 'INTERNA', null, 'Ventiladores')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Bloqueio: disjuntor desligado', 'VERIFICACAO', 'Desligado', 'CRITICA', null, null::numeric, null::numeric, false, true, false, false),
  (2, null, 'Carcaça e partes removidas limpas', 'VERIFICACAO', 'Sem poeira ou gordura', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Motor limpo com pincel', 'VERIFICACAO', 'Sem poeira', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (4, null, 'Eixo central desengripado e lubrificado', 'VERIFICACAO', 'Gira livre, sem excesso de óleo', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (5, null, 'Carcaça montada e firme', 'VERIFICACAO', 'Sem folga ou vibração', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (6, null, 'DR do quadro elétrico funcionando (botão de teste)', 'VERIFICACAO', 'Desarma no teste', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (7, null, 'Programação do temporizador conferida', 'VERIFICACAO', 'Horários corretos', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('REF-BAL-M', 'REF', 'Balcão refrigerado', 'Lavagem do condensador e aferição', 'MENSAL', 'INTERNA', 'Exige manifold ou manômetro para a pressão', 'Balcões refrigerados')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Temperatura do controlador', 'MEDICAO', 'Dentro da faixa do equipamento (nutrição)', 'ALTA', '°C', null::numeric, null::numeric, true, false, false, false),
  (2, null, 'Diferença entre controlador e termômetro da nutrição', 'MEDICAO', 'Até 2 °C', 'ALTA', '°C', null::numeric, 2::numeric, false, false, true, false),
  (3, null, 'Produtos retirados e guardados em local refrigerado', 'VERIFICACAO', 'Nenhum produto fora de refrigeração', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (4, null, 'Bloqueio: equipamento desligado da tomada', 'VERIFICACAO', 'Desligado', 'CRITICA', null, null::numeric, null::numeric, false, true, false, false),
  (5, null, 'Condensador e compressor lavados e secos', 'VERIFICACAO', 'Sem sujeira aderida', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (6, null, 'Pressão do gás no compressor (válvula Schrader)', 'MEDICAO', 'Dentro da faixa do fluido (fabricante)', 'ALTA', 'psi', null::numeric, null::numeric, true, false, false, false),
  (7, null, 'Sonda de temperatura respondendo (teste de desconexão)', 'VERIFICACAO', 'Controlador indica erro ao desconectar', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (8, null, 'Tampa de proteção do compressor recolocada', 'VERIFICACAO', 'Fixada', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (9, null, 'Balcão limpo com detergente neutro', 'VERIFICACAO', 'Sem sujeira', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (10, null, 'Temperatura ideal atingida antes de repor os alimentos', 'VERIFICACAO', 'Dentro da faixa antes da reposição', 'ALTA', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('REF-CAM-T', 'REF', 'Câmara frigorífica', 'Inspeção e medições do sistema', 'TRIMESTRAL', 'TERCEIRIZADA', null, 'Câmaras frigoríficas')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Temperatura no controlador', 'MEDICAO', 'Dentro da faixa da câmara (nutrição)', 'ALTA', '°C', null::numeric, null::numeric, true, false, false, false),
  (2, null, 'Diferença entre controlador e termômetro de sonda', 'MEDICAO', 'Até 2 °C', 'ALTA', '°C', null::numeric, 2::numeric, false, false, true, false),
  (3, null, 'Gaxetas magnéticas e borracha varredora íntegras', 'VERIFICACAO', 'Sem rasgos; porta veda em todo o contorno', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (4, null, 'Mola gás fecha a porta sozinha', 'VERIFICACAO', 'Fecha totalmente sem ajuda', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (5, null, 'Serpentina da evaporadora sem gelo (degelo funcionando)', 'VERIFICACAO', 'Sem bloco de gelo', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (6, null, 'Ventilador da evaporadora sem ruído ou trepidação; grelhas limpas', 'VERIFICACAO', 'Gira liso, sem barulho', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (7, null, 'Lâmpadas internas funcionando', 'VERIFICACAO', 'Todas acesas', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (8, null, 'Tubulação frigorígena isolada e sem obstrução', 'VERIFICACAO', 'Sem trecho exposto', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (9, null, 'Pressão da linha de líquido (alta)', 'MEDICAO', 'Faixa do fluido refrigerante (fabricante)', 'ALTA', 'psi', null::numeric, null::numeric, true, false, false, false),
  (10, null, 'Pressão da linha de sucção', 'MEDICAO', 'Faixa do fluido refrigerante (fabricante)', 'ALTA', 'psi', null::numeric, null::numeric, true, false, false, false),
  (11, null, 'Tensão no quadro de comando da condensadora', 'MEDICAO', 'Dentro da faixa do equipamento', 'ALTA', 'V', null::numeric, null::numeric, true, false, false, false),
  (12, null, 'Corrente no quadro de comando da condensadora', 'MEDICAO', 'Até a corrente nominal da placa', 'ALTA', 'A', null::numeric, null::numeric, true, false, false, false),
  (13, null, 'Ventilador da condensadora sem ruído; hélices em bom estado', 'VERIFICACAO', 'Sem trinca ou folga', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (14, null, 'Tela e gabinete da condensadora limpos', 'VERIFICACAO', 'Sem sujeira aderida', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (15, null, 'Foto final da condensadora', 'REGISTRO', 'Foto anexada', 'NORMAL', null, null::numeric, null::numeric, false, false, false, true),
  (16, null, 'Relatório ou laudo da empresa', 'REGISTRO', 'Documento anexado', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('GAS-BAN-M', 'GAS', 'Banho-maria', 'Teste de gás, queimadores e limpeza', 'MENSAL', 'INTERNA', null, 'Banho maria')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, 'Bloco Gás', 'Mangueira do regulador sem vazamento (teste de espuma)', 'VERIFICACAO', 'Bolhas não crescem nem se movem', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (2, 'Bloco Gás', 'Válvula borboleta sem vazamento', 'VERIFICACAO', 'Bolhas não crescem nem se movem', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (3, 'Bloco Gás', 'Conexão mangueira–equipamento sem vazamento', 'VERIFICACAO', 'Bolhas não crescem nem se movem', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (4, 'Bloco Gás', 'Mangueira de gás dentro da validade e sem ressecamento', 'VERIFICACAO', 'Validade impressa em dia; sem trincas', 'CRITICA', null, null::numeric, null::numeric, false, false, true, false),
  (5, 'Bloco Gás', 'Queimadores acendem com chama estável', 'VERIFICACAO', 'Chama azul e uniforme, sem ponta amarela', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (6, null, 'Bloqueio: gás fechado antes da lavagem', 'VERIFICACAO', 'Registro fechado', 'CRITICA', null, null::numeric, null::numeric, false, true, false, false),
  (7, null, 'Superfície desincrustada (produto alcalino + fibraço)', 'VERIFICACAO', 'Sem crosta ou gordura aderida', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (8, null, 'Enxágue completo e secagem natural', 'VERIFICACAO', 'Sem resíduo de produto químico', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (9, null, 'Teste final de funcionamento', 'VERIFICACAO', 'Acende e aquece normalmente', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (10, null, 'Foto final do equipamento', 'REGISTRO', 'Foto anexada', 'NORMAL', null, null::numeric, null::numeric, false, false, false, true)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('GAS-CHA-M', 'GAS', 'Chapa', 'Teste de gás, queimadores e limpeza', 'MENSAL', 'INTERNA', null, 'Chapa')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, 'Bloco Gás', 'Mangueira do regulador sem vazamento (teste de espuma)', 'VERIFICACAO', 'Bolhas não crescem nem se movem', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (2, 'Bloco Gás', 'Válvula borboleta sem vazamento', 'VERIFICACAO', 'Bolhas não crescem nem se movem', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (3, 'Bloco Gás', 'Conexão mangueira–equipamento sem vazamento', 'VERIFICACAO', 'Bolhas não crescem nem se movem', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (4, 'Bloco Gás', 'Mangueira de gás dentro da validade e sem ressecamento', 'VERIFICACAO', 'Validade impressa em dia; sem trincas', 'CRITICA', null, null::numeric, null::numeric, false, false, true, false),
  (5, 'Bloco Gás', 'Queimadores acendem com chama estável', 'VERIFICACAO', 'Chama azul e uniforme, sem ponta amarela', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (6, null, 'Bloqueio: gás fechado antes da lavagem', 'VERIFICACAO', 'Registro fechado', 'CRITICA', null, null::numeric, null::numeric, false, true, false, false),
  (7, null, 'Superfície desincrustada (produto alcalino + fibraço)', 'VERIFICACAO', 'Sem crosta ou gordura aderida', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (8, null, 'Enxágue completo e secagem natural', 'VERIFICACAO', 'Sem resíduo de produto químico', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (9, null, 'Teste final de funcionamento', 'VERIFICACAO', 'Acende e aquece normalmente', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (10, null, 'Foto final do equipamento', 'REGISTRO', 'Foto anexada', 'NORMAL', null, null::numeric, null::numeric, false, false, false, true)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('GAS-FOG-M', 'GAS', 'Fogão', 'Teste de gás, queimadores e limpeza', 'MENSAL', 'INTERNA', null, 'Fogões')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, 'Bloco Gás', 'Mangueira do regulador sem vazamento (teste de espuma)', 'VERIFICACAO', 'Bolhas não crescem nem se movem', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (2, 'Bloco Gás', 'Válvula borboleta sem vazamento', 'VERIFICACAO', 'Bolhas não crescem nem se movem', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (3, 'Bloco Gás', 'Conexão mangueira–equipamento sem vazamento', 'VERIFICACAO', 'Bolhas não crescem nem se movem', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (4, 'Bloco Gás', 'Mangueira de gás dentro da validade e sem ressecamento', 'VERIFICACAO', 'Validade impressa em dia; sem trincas', 'CRITICA', null, null::numeric, null::numeric, false, false, true, false),
  (5, 'Bloco Gás', 'Queimadores acendem com chama estável', 'VERIFICACAO', 'Chama azul e uniforme, sem ponta amarela', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (6, null, 'Bloqueio: gás fechado antes da lavagem', 'VERIFICACAO', 'Registro fechado', 'CRITICA', null, null::numeric, null::numeric, false, true, false, false),
  (7, null, 'Grelhas e queimadores retirados, desincrustados e enxaguados', 'VERIFICACAO', 'Sem crosta', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (8, null, 'Bicos do fogão desobstruídos', 'VERIFICACAO', 'Furos livres', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (9, null, 'Superfície desincrustada (produto alcalino + fibraço)', 'VERIFICACAO', 'Sem crosta ou gordura aderida', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (10, null, 'Enxágue completo e secagem natural', 'VERIFICACAO', 'Sem resíduo de produto químico', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (11, null, 'Grelhas e queimadores recolocados na posição', 'VERIFICACAO', 'Encaixe correto', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (12, null, 'Teste final de funcionamento', 'VERIFICACAO', 'Acende e aquece normalmente', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (13, null, 'Foto final do equipamento', 'REGISTRO', 'Foto anexada', 'NORMAL', null, null::numeric, null::numeric, false, false, false, true)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('GAS-FRI-M', 'GAS', 'Fritadeira a gás', 'Teste de gás, queimadores e limpeza', 'MENSAL', 'INTERNA', null, 'Fritadeiras Vulcan')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, 'Bloco Gás', 'Mangueira do regulador sem vazamento (teste de espuma)', 'VERIFICACAO', 'Bolhas não crescem nem se movem', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (2, 'Bloco Gás', 'Válvula borboleta sem vazamento', 'VERIFICACAO', 'Bolhas não crescem nem se movem', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (3, 'Bloco Gás', 'Conexão mangueira–equipamento sem vazamento', 'VERIFICACAO', 'Bolhas não crescem nem se movem', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (4, 'Bloco Gás', 'Mangueira de gás dentro da validade e sem ressecamento', 'VERIFICACAO', 'Validade impressa em dia; sem trincas', 'CRITICA', null, null::numeric, null::numeric, false, false, true, false),
  (5, 'Bloco Gás', 'Queimadores acendem com chama estável', 'VERIFICACAO', 'Chama azul e uniforme, sem ponta amarela', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (6, null, 'Bloqueio: gás fechado antes da lavagem', 'VERIFICACAO', 'Registro fechado', 'CRITICA', null, null::numeric, null::numeric, false, true, false, false),
  (7, null, 'Termostato e válvula solenoide protegidos durante a lavagem', 'VERIFICACAO', 'Cobertos com saco plástico', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (8, null, 'Resíduos endurecidos removidos (espátula de madeira ou plástico)', 'VERIFICACAO', 'Sem crosta visível', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (9, null, 'Enxágue completo e equipamento seco', 'VERIFICACAO', 'Sem resíduo de produto químico', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (10, null, 'Teste final de funcionamento', 'VERIFICACAO', 'Acende e aquece normalmente', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (11, null, 'Foto final do equipamento', 'REGISTRO', 'Foto anexada', 'NORMAL', null, null::numeric, null::numeric, false, false, false, true)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('GAS-FBP-M', 'GAS', 'Fritadeira de batata palha', 'Teste de gás, queimadores e limpeza', 'MENSAL', 'INTERNA', null, 'Fritadeira batata palha')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, 'Bloco Gás', 'Mangueira do regulador sem vazamento (teste de espuma)', 'VERIFICACAO', 'Bolhas não crescem nem se movem', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (2, 'Bloco Gás', 'Válvula borboleta sem vazamento', 'VERIFICACAO', 'Bolhas não crescem nem se movem', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (3, 'Bloco Gás', 'Conexão mangueira–equipamento sem vazamento', 'VERIFICACAO', 'Bolhas não crescem nem se movem', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (4, 'Bloco Gás', 'Mangueira de gás dentro da validade e sem ressecamento', 'VERIFICACAO', 'Validade impressa em dia; sem trincas', 'CRITICA', null, null::numeric, null::numeric, false, false, true, false),
  (5, 'Bloco Gás', 'Queimadores acendem com chama estável', 'VERIFICACAO', 'Chama azul e uniforme, sem ponta amarela', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (6, null, 'Bloqueio: gás fechado antes da lavagem', 'VERIFICACAO', 'Registro fechado', 'CRITICA', null, null::numeric, null::numeric, false, true, false, false),
  (7, null, 'Placa de proteção removida e limpa por dentro', 'VERIFICACAO', 'Sem resíduo aderido', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (8, null, 'Bicos queimadores limpos', 'VERIFICACAO', 'Furos livres', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (9, null, 'Superfície desincrustada (produto alcalino + fibraço)', 'VERIFICACAO', 'Sem crosta ou gordura aderida', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (10, null, 'Enxágue completo e secagem natural', 'VERIFICACAO', 'Sem resíduo de produto químico', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (11, null, 'Placa de proteção e botões recolocados', 'VERIFICACAO', 'Fixados', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (12, null, 'Teste final de funcionamento', 'VERIFICACAO', 'Acende e aquece normalmente', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (13, null, 'Foto final do equipamento', 'REGISTRO', 'Foto anexada', 'NORMAL', null, null::numeric, null::numeric, false, false, false, true)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('GAS-SAL-M', 'GAS', 'Salamandra', 'Teste de gás, queimadores e limpeza', 'MENSAL', 'INTERNA', null, 'Salamandra')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, 'Bloco Gás', 'Mangueira do regulador sem vazamento (teste de espuma)', 'VERIFICACAO', 'Bolhas não crescem nem se movem', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (2, 'Bloco Gás', 'Válvula borboleta sem vazamento', 'VERIFICACAO', 'Bolhas não crescem nem se movem', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (3, 'Bloco Gás', 'Conexão mangueira–equipamento sem vazamento', 'VERIFICACAO', 'Bolhas não crescem nem se movem', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (4, 'Bloco Gás', 'Mangueira de gás dentro da validade e sem ressecamento', 'VERIFICACAO', 'Validade impressa em dia; sem trincas', 'CRITICA', null, null::numeric, null::numeric, false, false, true, false),
  (5, 'Bloco Gás', 'Queimadores acendem com chama estável', 'VERIFICACAO', 'Chama azul e uniforme, sem ponta amarela', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (6, null, 'Bloqueio: gás fechado antes da lavagem', 'VERIFICACAO', 'Registro fechado', 'CRITICA', null, null::numeric, null::numeric, false, true, false, false),
  (7, null, 'Superfície desincrustada (produto alcalino + fibraço)', 'VERIFICACAO', 'Sem crosta ou gordura aderida', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (8, null, 'Enxágue completo e secagem natural', 'VERIFICACAO', 'Sem resíduo de produto químico', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (9, null, 'Teste final de funcionamento', 'VERIFICACAO', 'Acende e aquece normalmente', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (10, null, 'Foto final do equipamento', 'REGISTRO', 'Foto anexada', 'NORMAL', null, null::numeric, null::numeric, false, false, false, true)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('COC-FCR-M', 'COC', 'Forno combinado Rational', 'Inspeção, limpeza automática e parâmetros', 'MENSAL', 'INTERNA', null, 'Forno combinado Rational')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Borracha de vedação da porta íntegra', 'VERIFICACAO', 'Sem fissuras ou rasgos', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (2, null, 'Calha da porta esvaziada', 'VERIFICACAO', 'Sem água acumulada', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Sensor de núcleo íntegro (sonda e cabo)', 'VERIFICACAO', 'Sem dano', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (4, null, 'Lâmpadas internas funcionando', 'VERIFICACAO', 'Acesas', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (5, null, 'Vedações da caldeira e do tubo do flap íntegras', 'VERIFICACAO', 'Sem fissuras ou rasgos', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (6, null, 'Dreno da caldeira sem calcário', 'VERIFICACAO', 'Sem incrustação', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (7, null, 'Placa de proteção do motor seca', 'VERIFICACAO', 'Sem líquido ou umidade', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (8, null, 'Cooler do painel girando', 'VERIFICACAO', 'Gira normalmente', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (9, null, 'Quadro de comando e filtro da placa limpos', 'VERIFICACAO', 'Sem poeira ou gordura', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (10, null, 'Limpeza automática executada até o fim', 'VERIFICACAO', 'Ciclo concluído sem erro', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (11, null, 'Parâmetros do painel sem alerta (vapor, CO₂, chama, RPM, ventilação, válvulas Y1–Y4, flap, bombas)', 'VERIFICACAO', 'Todos normais', 'ALTA', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('COC-FCU-M', 'COC', 'Forno combinado Unox', 'Enxágue, vedação, sensor e gás', 'MENSAL', 'INTERNA', 'Em garantia: confirmar periodicidade com a autorizada', 'Forno combinado Unox')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Enxágue Rotor Klean (modo Rinse) concluído', 'VERIFICACAO', 'Ciclo concluído sem aviso', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (2, null, 'Borracha de vedação íntegra', 'VERIFICACAO', 'Sem fissuras ou rasgos', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Câmara interna limpa', 'VERIFICACAO', 'Sem resíduo', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (4, null, 'Sensor de núcleo íntegro e limpo', 'VERIFICACAO', 'Cabo e haste sem dano', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (5, null, 'Peneira do dreno limpa', 'VERIFICACAO', 'Sem resíduo', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (6, null, 'Suportes e trilhos das bandejas alinhados', 'VERIFICACAO', 'Sem amassado; fixação firme', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (7, null, 'Vidro da porta limpo por dentro e por fora', 'VERIFICACAO', 'Sem gordura', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (8, null, 'Calha de condensados instalada', 'VERIFICACAO', 'No lugar', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (9, null, 'Maçaneta e dobradiça sem folga', 'VERIFICACAO', 'Abre e fecha sem entrave', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (10, null, 'Conexões e mangueira de gás sem vazamento', 'VERIFICACAO', 'Bolhas não crescem nem se movem', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (11, null, 'Mangueira de água e filtro de entrada sem vazamento', 'VERIFICACAO', 'Secos', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (12, null, 'Coifa sem respingar água sobre o forno', 'VERIFICACAO', 'Sem respingo', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (13, null, 'Forno e mesa de apoio sem avarias externas', 'VERIFICACAO', 'Sem dano', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('COC-FCE-M', 'COC', 'Forno Copa Express', 'Limpeza e inspeção elétrica', 'MENSAL', 'INTERNA', 'Parte elétrica: técnico qualificado', 'Forno Copa Express')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Iniciado com o forno desligado e abaixo de 60 °C', 'VERIFICACAO', 'Forno frio', 'ALTA', null, null::numeric, null::numeric, false, true, false, false),
  (2, null, 'Bandeja e câmara interna limpas (sem objetos abrasivos)', 'VERIFICACAO', 'Sem resíduo', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Borracha de vedação limpa e íntegra', 'VERIFICACAO', 'Sem fissuras ou rasgos', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (4, null, 'Parte externa limpa, seca e protegida com óleo para inox', 'VERIFICACAO', 'Sem manchas', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (5, null, 'Filtro de ar lavado e reinstalado', 'VERIFICACAO', 'Limpo e encaixado', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (6, null, 'Painel, temperatura, alarme e botões funcionando', 'VERIFICACAO', 'Todos respondem', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (7, null, 'Bloqueio: cabo de força desconectado para a inspeção elétrica', 'VERIFICACAO', 'Desconectado', 'CRITICA', null, null::numeric, null::numeric, false, true, false, false),
  (8, null, 'Chave de fim de curso da porta com continuidade', 'VERIFICACAO', 'Continuidade confirmada', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (9, null, 'Sem pontos quentes em cabos e conexões (transformadores, capacitores, magnetrons, placa)', 'VERIFICACAO', 'Sem mancha marrom ou derretimento', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (10, null, 'Conexões reapertadas, incluindo o inversor de frequência', 'VERIFICACAO', 'Sem folga', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (11, null, 'Resistências da turbina e do lastro em bom estado', 'VERIFICACAO', 'Sem dano', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (12, null, 'Ventilador do micro-ondas sem ruído', 'VERIFICACAO', 'Gira liso', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (13, null, 'Laterais montadas e teclas testadas', 'VERIFICACAO', 'Painel funcionando', 'ALTA', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('COC-FMC-M', 'COC', 'Forno Miniconv', 'Limpeza e inspeção elétrica', 'MENSAL', 'INTERNA', 'Parte elétrica: técnico qualificado. Nunca jogar água na parte externa.', 'Forno Miniconv')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Iniciado com o forno desligado e abaixo de 60 °C', 'VERIFICACAO', 'Forno frio', 'ALTA', null, null::numeric, null::numeric, false, true, false, false),
  (2, null, 'Bandeja e câmara interna limpas (sem objetos abrasivos)', 'VERIFICACAO', 'Sem resíduo', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Borracha de vedação limpa e íntegra', 'VERIFICACAO', 'Sem fissuras ou rasgos', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (4, null, 'Parte externa limpa, seca e protegida com óleo para inox', 'VERIFICACAO', 'Sem manchas', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (5, null, 'Painel, temperatura, alarme e botões funcionando', 'VERIFICACAO', 'Todos respondem', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (6, null, 'Bloqueio: cabo de força desconectado para a inspeção elétrica', 'VERIFICACAO', 'Desconectado', 'CRITICA', null, null::numeric, null::numeric, false, true, false, false),
  (7, null, 'Tensão de alimentação', 'MEDICAO', 'Variação até 10% da nominal', 'ALTA', 'V', null::numeric, null::numeric, true, false, false, false),
  (8, null, 'Conectores da resistência reapertados (borne e relé)', 'VERIFICACAO', 'Sem folga', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (9, null, 'Temperatura nos pontos quentes (pistola)', 'MEDICAO', 'Até 50 °C', 'CRITICA', '°C', null::numeric, 50::numeric, false, false, false, false),
  (10, null, 'Corrente da resistência', 'MEDICAO', 'Dentro da faixa do equipamento', 'ALTA', 'A', null::numeric, null::numeric, true, false, false, false),
  (11, null, 'Turbina de circulação sem vibração', 'VERIFICACAO', 'Sem vibração anormal', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (12, null, 'Equipamento fechado e testado', 'VERIFICACAO', 'Funcionando', 'ALTA', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('COC-FCS-M', 'COC', 'Fritadeira elétrica (churros e sushi)', 'Limpeza e teste de termostatos', 'MENSAL', 'INTERNA', null, 'Fritadeira churros e sushi')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Bloqueio: equipamento desconectado da rede elétrica', 'VERIFICACAO', 'Desconectado', 'CRITICA', null, null::numeric, null::numeric, false, true, false, false),
  (2, null, 'Superfície limpa com desincrustante', 'VERIFICACAO', 'Sem gordura aderida', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Cabo de alimentação da resistência firme (reaperto)', 'VERIFICACAO', 'Sem folga', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (4, null, 'Botão liga/desliga funcionando', 'VERIFICACAO', 'Liga e desliga', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (5, null, 'LED indicador funcionando', 'VERIFICACAO', 'Acende', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (6, null, 'Termostato de controle e de segurança atuando', 'VERIFICACAO', 'LED do regulador responde corretamente', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('COC-MBT-M', 'COC', 'Mantenedor de batata', 'Limpeza e teste', 'MENSAL', 'INTERNA', null, 'Mantenedor de batata')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Bloqueio: área desenergizada e equipamento fora da tomada', 'VERIFICACAO', 'Desligado', 'CRITICA', null, null::numeric, null::numeric, false, true, false, false),
  (2, null, 'Parte elétrica protegida durante a lavagem', 'VERIFICACAO', 'Coberta', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Superfície e cesto lavados (desincrustante 15 min + alta pressão)', 'VERIFICACAO', 'Sem gordura', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (4, null, 'Proteções retiradas e equipamento seco, começando pela parte elétrica', 'VERIFICACAO', 'Seco', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (5, null, 'Teste de funcionamento', 'VERIFICACAO', 'Aquece normalmente', 'ALTA', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('EXA-CCV-S', 'EXA', 'Coifa convencional', 'Lavagem de filtros e coifa', 'SEMANAL', 'INTERNA', null, 'Coifas convencionais')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Bloqueio: equipamentos abaixo da coifa desligados e frios', 'VERIFICACAO', 'Todos desligados', 'CRITICA', null, null::numeric, null::numeric, false, true, false, false),
  (2, null, 'Filtros lavados e reinstalados na posição correta', 'VERIFICACAO', 'Sem gordura visível; encaixados sem fresta', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Drenos laterais esgotados e tampões recolocados', 'VERIFICACAO', 'Dreno livre, tampão no lugar', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (4, null, 'Coifa limpa por dentro e por fora, e seca', 'VERIFICACAO', 'Sem gordura escorrendo', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (5, null, 'Teste: exaustão funcionando com filtros instalados', 'VERIFICACAO', 'Puxa o ar normalmente', 'ALTA', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('EXA-CCV-SE', 'EXA', 'Coifa convencional', 'Desengorduramento completo', 'SEMESTRAL', 'TERCEIRIZADA', 'Prazo máximo de 6 meses; agendar junto com os dutos', 'Coifas convencionais')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Foto antes da limpeza', 'REGISTRO', 'Foto anexada', 'NORMAL', null, null::numeric, null::numeric, false, false, false, true),
  (2, null, 'Equipamentos abaixo da coifa protegidos com lona', 'VERIFICACAO', 'Totalmente cobertos', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Desengorduramento interno completo', 'VERIFICACAO', 'Sem gordura acumulada nas paredes', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (4, null, 'Filtros, cartuchos e tampões repostos; exaustão testada', 'VERIFICACAO', 'Puxa o ar normalmente', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (5, null, 'Foto depois da limpeza', 'REGISTRO', 'Foto anexada', 'NORMAL', null, null::numeric, null::numeric, false, false, false, true),
  (6, null, 'Certificado de limpeza da empresa', 'REGISTRO', 'Documento anexado', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('EXA-CLV-S', 'EXA', 'Coifa lavadora', 'Bicos, calha, boia e filtros', 'SEMANAL', 'INTERNA', null, 'Coifas lavadoras')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Nível de detergente adequado', 'VERIFICACAO', 'Acima do mínimo', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (2, null, 'Bicos spray limpos e desobstruídos', 'VERIFICACAO', 'Todos borrifando', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Calha limpa (dreno aberto, água e disjuntor desligados durante a limpeza)', 'VERIFICACAO', 'Sem gordura', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (4, null, 'Sensor de nível (boia) limpo e atuando', 'VERIFICACAO', 'Boia livre', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (5, null, 'Filtros hidrodinâmicos limpos', 'VERIFICACAO', 'Sem gordura', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (6, null, 'Cartuchos limpos por dentro e por fora', 'VERIFICACAO', 'Sem gordura', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (7, null, 'Válvula de retenção limpa', 'VERIFICACAO', 'Sem resíduo', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (8, null, 'Base da caixa de drenagem limpa', 'VERIFICACAO', 'Sem resíduo', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('EXA-CLV-M', 'EXA', 'Coifa lavadora', 'Limpeza completa com demister', 'MENSAL', 'TERCEIRIZADA', null, 'Coifas lavadoras')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Nível de detergente adequado', 'VERIFICACAO', 'Acima do mínimo', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (2, null, 'Bicos spray limpos e desobstruídos', 'VERIFICACAO', 'Todos borrifando', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Calha limpa (dreno aberto, água e disjuntor desligados durante a limpeza)', 'VERIFICACAO', 'Sem gordura', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (4, null, 'Sensor de nível (boia) limpo e atuando', 'VERIFICACAO', 'Boia livre', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (5, null, 'Filtros hidrodinâmicos limpos', 'VERIFICACAO', 'Sem gordura', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (6, null, 'Cartuchos limpos por dentro e por fora', 'VERIFICACAO', 'Sem gordura', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (7, null, 'Válvula de retenção limpa', 'VERIFICACAO', 'Sem resíduo', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (8, null, 'Base da caixa de drenagem limpa', 'VERIFICACAO', 'Sem resíduo', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (9, null, 'Filtros inerciais demister limpos', 'VERIFICACAO', 'Sem gordura', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (10, null, 'Tela perfurada limpa', 'VERIFICACAO', 'Furos livres', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (11, null, 'Partes internas da coifa limpas', 'VERIFICACAO', 'Sem gordura', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (12, null, 'Foto final do equipamento', 'REGISTRO', 'Foto anexada', 'NORMAL', null, null::numeric, null::numeric, false, false, false, true),
  (13, null, 'Relatório ou laudo da empresa', 'REGISTRO', 'Documento anexado', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('EXA-CLV-SE', 'EXA', 'Coifa lavadora', 'Desengorduramento completo', 'SEMESTRAL', 'TERCEIRIZADA', 'Prazo máximo de 6 meses; agendar junto com os dutos', 'Coifas lavadoras')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Foto antes da limpeza', 'REGISTRO', 'Foto anexada', 'NORMAL', null, null::numeric, null::numeric, false, false, false, true),
  (2, null, 'Equipamentos abaixo da coifa protegidos com lona', 'VERIFICACAO', 'Totalmente cobertos', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Desengorduramento interno completo', 'VERIFICACAO', 'Sem gordura acumulada nas paredes', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (4, null, 'Filtros, cartuchos e tampões repostos; exaustão testada', 'VERIFICACAO', 'Puxa o ar normalmente', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (5, null, 'Foto depois da limpeza', 'REGISTRO', 'Foto anexada', 'NORMAL', null, null::numeric, null::numeric, false, false, false, true),
  (6, null, 'Certificado de limpeza da empresa', 'REGISTRO', 'Documento anexado', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('EXA-DUT-SE', 'EXA', 'Duto de exaustão', 'Desengorduramento dos dutos', 'SEMESTRAL', 'TERCEIRIZADA', 'Prazo máximo de 6 meses', 'Dutos de exaustão')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Foto antes da limpeza (pelas portinholas)', 'REGISTRO', 'Foto anexada', 'NORMAL', null, null::numeric, null::numeric, false, false, false, true),
  (2, null, 'Equipamentos protegidos e gordura contida até a caixa de esgoto', 'VERIFICACAO', 'Lona instalada', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Bloqueio: exaustão e insuflamento desligados no quadro', 'VERIFICACAO', 'Desligados', 'CRITICA', null, null::numeric, null::numeric, false, true, false, false),
  (4, null, 'Todos os trechos desengordurados', 'VERIFICACAO', 'Sem gordura acumulada', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (5, null, 'Portinholas recolocadas e vedadas', 'VERIFICACAO', 'Todas fechadas', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (6, null, 'Sistema religado após secagem', 'VERIFICACAO', 'Exaustão funcionando', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (7, null, 'Foto depois da limpeza', 'REGISTRO', 'Foto anexada', 'NORMAL', null, null::numeric, null::numeric, false, false, false, true),
  (8, null, 'Certificado de limpeza da empresa', 'REGISTRO', 'Documento anexado', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('EXA-EXT-M', 'EXA', 'Exaustor', 'Rolamento, correias e amperagem', 'MENSAL', 'INTERNA', null, 'Exaustor')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Bloqueio: disjuntor desligado e exaustor parado', 'VERIFICACAO', 'Parado', 'CRITICA', null, null::numeric, null::numeric, false, true, false, false),
  (2, null, 'Rolamento sem ruído e eixos lubrificados', 'VERIFICACAO', 'Gira liso', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Correias sem rasgos ou fissuras', 'VERIFICACAO', 'Íntegras', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (4, null, 'Corrente do motor', 'MEDICAO', 'Até a corrente nominal da placa', 'ALTA', 'A', null::numeric, null::numeric, true, false, false, false),
  (5, null, 'Proteções recolocadas e teste de funcionamento', 'VERIFICACAO', 'Funcionando', 'ALTA', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('LAV-GEL-S', 'LAV', 'Máquina de gelo', 'Higienização interna e externa', 'SEMANAL', 'INTERNA', null, 'Máquina de gelo')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Bloqueio: cabo de força desconectado', 'VERIFICACAO', 'Desconectado', 'CRITICA', null, null::numeric, null::numeric, false, true, false, false),
  (2, null, 'Gelo existente descartado', 'VERIFICACAO', 'Recipiente vazio', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Partes móveis e parte externa limpas (detergente neutro, esponja nova)', 'VERIFICACAO', 'Sem resíduo', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (4, null, 'Filtro de ar limpo', 'VERIFICACAO', 'Sem poeira', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (5, null, 'Parte interna higienizada com cloro (sem álcool e sem abrasivos)', 'VERIFICACAO', 'Pontos críticos higienizados', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (6, null, 'Enxágue completo, sem cheiro de cloro', 'VERIFICACAO', 'Sem resíduo de cloro', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (7, null, 'Filtro de água avaliado (trocado se necessário)', 'VERIFICACAO', 'Filtro dentro da vida útil', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (8, null, 'Peças recolocadas e máquina religada', 'VERIFICACAO', 'Funcionando', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (9, null, 'Gelo da primeira hora descartado, se necessário', 'VERIFICACAO', 'Avaliado', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('LAV-GEL-M', 'LAV', 'Máquina de gelo', 'Limpeza da condensadora e placas', 'MENSAL', 'TERCEIRIZADA', null, 'Máquina de gelo')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Bloqueio: equipamento desligado no quadro e fora da tomada', 'VERIFICACAO', 'Desligado', 'CRITICA', null, null::numeric, null::numeric, false, true, false, false),
  (2, null, 'Componentes elétricos e motor do ventilador protegidos', 'VERIFICACAO', 'Cobertos', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Condensadora pulverizada com desincrustante', 'VERIFICACAO', 'Sem incrustação', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (4, null, 'Cortina e bandeja de água limpas', 'VERIFICACAO', 'Sem limo', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (5, null, 'Placas de gelo e bordas limpas', 'VERIFICACAO', 'Sem incrustação', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (6, null, 'Sensores de formação de placa e de nível limpos', 'VERIFICACAO', 'Limpos e instalados', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (7, null, 'Peças e condensadora recolocadas; máquina em funcionamento', 'VERIFICACAO', 'Produzindo gelo', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (8, null, 'Foto final do equipamento', 'REGISTRO', 'Foto anexada', 'NORMAL', null, null::numeric, null::numeric, false, false, false, true),
  (9, null, 'Relatório ou laudo da empresa', 'REGISTRO', 'Documento anexado', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('LAV-COP-M', 'LAV', 'Máquina de lavar copos', 'Limpeza, filtros e contatores', 'MENSAL', 'INTERNA', null, 'Máquina de lavar copos')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Bloqueio: área desenergizada no quadro', 'VERIFICACAO', 'Desligado', 'CRITICA', null, null::numeric, null::numeric, false, true, false, false),
  (2, null, 'Cesta giratória, peneira, tubo de dreno e filtro da bomba limpos', 'VERIFICACAO', 'Sem resíduo', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Bocais de água limpos e desobstruídos', 'VERIFICACAO', 'Furos livres', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (4, null, 'Sem vazamento próximo ao quadro de comando', 'VERIFICACAO', 'Seco', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (5, null, 'Contatores reapertados', 'VERIFICACAO', 'Sem folga', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (6, null, 'Teste de funcionamento', 'VERIFICACAO', 'Lava e enxágua normalmente', 'ALTA', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('LAV-PRA-M', 'LAV', 'Máquina de lavar pratos', 'Limpeza, esteiras e fim de curso', 'MENSAL', 'INTERNA', null, 'Máquina de lavar pratos')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Bloqueio: área desenergizada no quadro', 'VERIFICACAO', 'Desligado', 'CRITICA', null, null::numeric, null::numeric, false, true, false, false),
  (2, null, 'Contatores reapertados', 'VERIFICACAO', 'Sem folga', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Motor e contatores protegidos durante a limpeza', 'VERIFICACAO', 'Cobertos', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (4, null, 'Peneiras, filtro de resíduos e tubo de dreno limpos', 'VERIFICACAO', 'Sem resíduo', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (5, null, 'Bocais desobstruídos e tampões recolocados', 'VERIFICACAO', 'Furos livres', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (6, null, 'Compartimento interno limpo', 'VERIFICACAO', 'Sem resíduo', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (7, null, 'Correntes das esteiras reguladas', 'VERIFICACAO', 'Sem folga', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (8, null, 'Tensão de alimentação', 'MEDICAO', 'Igual à tensão do equipamento', 'ALTA', 'V', null::numeric, null::numeric, true, false, false, false),
  (9, null, 'Chave de fim de curso atuando', 'VERIFICACAO', 'Hastes reguladas e atuando', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (10, null, 'Proteções retiradas e teste de funcionamento', 'VERIFICACAO', 'Funcionando', 'ALTA', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('INC-VGS-S', 'INC', 'Rede de gás', 'Teste de vazamento com detector', 'SEMANAL', 'INTERNA', null, 'Teste de vazamentos de gás na rede das lojas')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Detector regulado (sensibilidade ajustada até bips espaçados)', 'VERIFICACAO', 'Regulado', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (2, null, 'Todas as mangueiras e registros testados', 'VERIFICACAO', 'Sem alarme do detector', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Toda a tubulação e ramificações testadas', 'VERIFICACAO', 'Sem alarme do detector', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (4, null, 'Vazamento encontrado corrigido e reteste feito', 'VERIFICACAO', 'Reteste sem alarme (Não se aplica se não houve)', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('INC-EXT-S', 'INC', 'Extintor', 'Inspeção visual, lacre, pressão e validade', 'SEMANAL', 'INTERNA', null, 'Extintores em geral')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Extintor em bom estado de conservação', 'VERIFICACAO', 'Sem amassado ou corrosão', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (2, null, 'Lacre intacto', 'VERIFICACAO', 'Não violado', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Manômetro na faixa verde', 'VERIFICACAO', 'Ponteiro no verde', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (4, null, 'Carga dentro da validade', 'VERIFICACAO', 'Validade em dia', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (5, null, 'Acesso e sinalização desobstruídos', 'VERIFICACAO', 'Nada na frente', 'ALTA', null, null::numeric, null::numeric, false, false, true, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('INC-SAP-S', 'INC', 'Cilindro de saponificante', 'Inspeção visual, pressão e validade', 'SEMANAL', 'INTERNA', 'Inclui cilindros das salas de salada e sobremesa', 'Cilindros do saponificante')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Cilindro em bom estado de conservação', 'VERIFICACAO', 'Sem amassado ou corrosão', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (2, null, 'Manômetro na faixa verde', 'VERIFICACAO', 'Ponteiro no verde', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Carga dentro da validade', 'VERIFICACAO', 'Validade em dia', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('INC-SAP-M', 'INC', 'Sistema saponificante, CO₂ e dampers', 'Teste de acionamento do sistema', 'MENSAL', 'INTERNA', null, 'Teste do sistema saponificante, CO² e dampers')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'By-pass da solenoide desativado e central operando', 'VERIFICACAO', 'Central sem falha', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (2, null, 'Solenoides de todos os cilindros desconectadas antes do teste', 'VERIFICACAO', 'Desconectadas (teste com chave de fenda)', 'CRITICA', null, null::numeric, null::numeric, false, true, false, false),
  (3, null, 'Acionador manual ativado com bocas de fogão acesas', 'VERIFICACAO', 'Sistema entrou em combate', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (4, null, 'Dampers fecharam', 'VERIFICACAO', 'Entradas dos dutos fechadas', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (5, null, 'Alarmes sonoros e visuais ativados', 'VERIFICACAO', 'Ativados', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (6, null, 'Gás cortado (bocas apagaram)', 'VERIFICACAO', 'Gás cortado', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (7, null, 'Sistema rearmado, dampers reabertos e solenoides reinstaladas', 'VERIFICACAO', 'Sistema em operação normal', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('INC-DGS-M', 'INC', 'Sistema de detecção de gás', 'Teste de alarme e corte de gás', 'MENSAL', 'INTERNA', 'GN: detector no alto. GLP: detector próximo ao chão.', 'Teste do sistema de detecção de gás')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Central de gás e by-pass operando normalmente', 'VERIFICACAO', 'Sem falha', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (2, null, 'Detector disparou com gás de isqueiro', 'VERIFICACAO', 'Alarme sonoro e visual ativado', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Gás cortado (bocas apagaram)', 'VERIFICACAO', 'Gás cortado', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (4, null, 'Gás dos equipamentos fechado antes de rearmar', 'VERIFICACAO', 'Todos fechados', 'CRITICA', null, null::numeric, null::numeric, false, true, false, false),
  (5, null, 'Sistema reativado na central', 'VERIFICACAO', 'Em operação normal', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('INC-ALA-M', 'INC', 'Alarme e detectores de fumaça', 'Teste com spray (NBR 17240)', 'MENSAL', 'INTERNA', 'Usar somente spray de teste próprio para detector', 'Teste de combate a incêndio')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Central de alarme sem falha e sem silenciamento', 'VERIFICACAO', 'Operando', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (2, null, 'Detectores testados com spray específico', 'VERIFICACAO', 'Todos dispararam', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Central indicou FOGO e alarmes sonoros e visuais ativaram', 'VERIFICACAO', 'Ativados', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (4, null, 'Sistemas associados acionaram (portas automáticas e outros)', 'VERIFICACAO', 'Acionaram (Não se aplica se não houver)', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (5, null, 'Central reiniciada e em operação normal', 'VERIFICACAO', 'Normal', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('INC-LUM-M', 'INC', 'Luminária de emergência', 'Teste de acendimento automático', 'MENSAL', 'INTERNA', 'Se não acender: substituir imediatamente', 'Luminárias de emergência')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Acende automaticamente ao retirar da tomada', 'VERIFICACAO', 'Acendeu', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (2, null, 'Plug recolocado na tomada', 'VERIFICACAO', 'Recolocado', 'ALTA', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('INC-BOM-T', 'INC', 'Bomba dos hidrantes', 'Teste de pressurização', 'TRIMESTRAL', 'INTERNA', 'Lojas de shopping: semestral, conforme o shopping', 'Teste da bomba de água dos hidrantes')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Todas as bombas testadas com a mangueira liberando água', 'VERIFICACAO', 'Pressão adequada no hidrante', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('INC-BRI-Q', 'INC', 'Brigada de incêndio', 'Treinamento de 20% da equipe', 'QUADRIMESTRAL', 'TERCEIRIZADA', 'Meta: 60% da equipe treinada em 12 meses', 'Treinamento de brigada de incêndio')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Treinamento realizado com 20% dos funcionários efetivos', 'VERIFICACAO', 'Lista de presença com 20% ou mais', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (2, null, 'Grupo diferente dos quadrimestres anteriores', 'VERIFICACAO', 'Sem repetição', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Certificado e lista de presença', 'REGISTRO', 'Documento anexado', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('INC-EXT-A', 'INC', 'Extintor', 'Recarga', 'ANUAL', 'TERCEIRIZADA', null, 'Extintores em geral')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Extintores recarregados conforme a validade', 'VERIFICACAO', 'Todos com nova validade', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (2, null, 'Nota ou certificado da recarga', 'REGISTRO', 'Documento anexado', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('INC-CO2-A', 'INC', 'Extintor de CO₂ dos dutos', 'Inspeção técnica de pressurização', 'ANUAL', 'TERCEIRIZADA', null, 'Extintores de CO2 dos dutos')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Pressurização dos cilindros de CO₂ inspecionada', 'VERIFICACAO', 'Aprovada', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (2, null, 'Relatório ou laudo da empresa', 'REGISTRO', 'Documento anexado', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('INC-EST-A', 'INC', 'Tubulação de gás', 'Teste de estanqueidade (NBR 15358)', 'ANUAL', 'TERCEIRIZADA', null, 'Teste de estanqueidade da tubulação de gás')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Teste primário sem queda de pressão', 'VERIFICACAO', 'Pressão estável', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (2, null, 'Limpeza da tubulação com gás inerte', 'VERIFICACAO', 'Saída livre de óxidos', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Teste secundário sem queda de pressão', 'VERIFICACAO', 'Pressão estável', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (4, null, 'Laudo de estanqueidade', 'REGISTRO', 'Documento anexado', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('INC-HID-A', 'INC', 'Mangueira de hidrante', 'Teste hidrostático', 'ANUAL', 'TERCEIRIZADA', null, 'Teste hidrostático das mangueiras de hidrantes')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Todas as mangueiras em uso inspecionadas e testadas', 'VERIFICACAO', 'Aprovadas', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (2, null, 'Laudo do teste hidrostático', 'REGISTRO', 'Documento anexado', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('INC-SAP-5A', 'INC', 'Cilindro de saponificante', 'Recarga', 'QUINQUENAL', 'TERCEIRIZADA', null, 'Cilindros do saponificante')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Cilindros recarregados', 'VERIFICACAO', 'Nova validade registrada', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (2, null, 'Certificado da recarga', 'REGISTRO', 'Documento anexado', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('ELE-GER-S', 'ELE', 'Gerador', 'Teste sem carga', 'SEMANAL', 'INTERNA', null, 'Gerador')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Controle colocado em modo manual', 'VERIFICACAO', 'Modo manual', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (2, null, 'Nível e viscosidade do óleo do motor', 'VERIFICACAO', 'Dentro do indicado', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Nível de combustível', 'MEDICAO', 'Mínimo 50% do tanque', 'CRITICA', '%', 50::numeric, null::numeric, false, false, false, false),
  (4, null, 'Carga da bateria', 'VERIFICACAO', 'Indicação normal no quadro', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (5, null, 'Partida manual do motor', 'VERIFICACAO', 'Partiu normalmente', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (6, null, 'Controle devolvido ao modo automático', 'VERIFICACAO', 'Modo automático', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('ELE-GER-M', 'ELE', 'Gerador', 'Teste com carga (queda simulada)', 'MENSAL', 'INTERNA', 'Fazer junto com o teste dos nobreaks (TI-NOB-M)', 'Gerador')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Gerador assumiu a loja na queda simulada do QGBT', 'VERIFICACAO', 'Assumiu', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (2, null, 'Tempo para assumir a energia', 'MEDICAO', 'Dentro do tempo do fabricante', 'ALTA', 's', null::numeric, null::numeric, true, false, false, false),
  (3, null, 'Nível de combustível', 'MEDICAO', 'Mínimo 50% do tanque', 'CRITICA', '%', 50::numeric, null::numeric, false, false, false, false),
  (4, null, 'Gerador em modo automático ao final', 'VERIFICACAO', 'Modo automático', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('ELE-GER-A', 'ELE', 'Gerador', 'Revisão completa e trocas', 'ANUAL', 'TERCEIRIZADA', 'Empresa autorizada', 'Gerador')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Filtros de combustível (retorno e motor), óleo e ar trocados', 'VERIFICACAO', 'Todos trocados', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (2, null, 'Sem vazamento nas tampas de válvula', 'VERIFICACAO', 'Seco', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Intercooler, radiador e braçadeiras reapertados; borracha íntegra', 'VERIFICACAO', 'Sem folga ou fissura', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (4, null, 'Nível do líquido de arrefecimento', 'VERIFICACAO', 'Dentro do especificado', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (5, null, 'Terminais da bateria sem oxidação e firmes', 'VERIFICACAO', 'Limpos e firmes', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (6, null, 'Barramento sem bornes folgados; pré-aquecimento e contatora funcionando', 'VERIFICACAO', 'Normal', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (7, null, 'Parâmetros com o motor ligado (rotação, óleo, água, tensões, frequência, turbo)', 'VERIFICACAO', 'Todos dentro do padrão', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (8, null, 'Controle devolvido ao modo automático', 'VERIFICACAO', 'Modo automático', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (9, null, 'Relatório ou laudo da empresa', 'REGISTRO', 'Documento anexado', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('ELE-QDE-SE', 'ELE', 'Quadro elétrico', 'Limpeza, reaperto e identificação', 'SEMESTRAL', 'INTERNA', 'Técnico qualificado (NR-10)', 'Quadros elétricos')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Bloqueio: disjuntor geral desligado e ausência de tensão confirmada', 'VERIFICACAO', 'Sem tensão medida', 'CRITICA', null, null::numeric, null::numeric, false, true, false, false),
  (2, null, 'Quadro limpo (ar comprimido e aspirador)', 'VERIFICACAO', 'Sem poeira nos contatos', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Conexões dos disjuntores no barramento reapertadas', 'VERIFICACAO', 'Sem folga', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (4, null, 'Identificação do quadro confere com os equipamentos', 'VERIFICACAO', 'Etiquetas corretas', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (5, null, 'Quadro fechado e reenergizado', 'VERIFICACAO', 'Funcionando', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (6, null, 'Foto do quadro após a manutenção', 'REGISTRO', 'Foto anexada', 'NORMAL', null, null::numeric, null::numeric, false, false, false, true)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('TI-NOB-M', 'TI', 'Nobreak (servidor e KDS)', 'Teste de autonomia', 'MENSAL', 'INTERNA', 'Junto com o teste com carga do gerador', 'Teste dos nobreaks do servidor e do KDS')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Chamado aberto com TI no mínimo 1 dia antes', 'VERIFICACAO', 'Chamado registrado', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (2, null, 'Teste feito entre segunda e quarta, no primeiro horário', 'VERIFICACAO', 'Dentro da janela', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Nobreak do servidor sustentou a carga', 'VERIFICACAO', 'Sem desligamento', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (4, null, 'Nobreak do KDS sustentou a carga', 'VERIFICACAO', 'Sem desligamento', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('TI-SRV-A', 'TI', 'Servidor e rack', 'Limpeza interna', 'ANUAL', 'TERCEIRIZADA', null, 'Limpeza do servidor da loja')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Servidor limpo por dentro e por fora', 'VERIFICACAO', 'Sem poeira', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (2, null, 'Rack e equipamentos do rack limpos', 'VERIFICACAO', 'Sem poeira', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Coolers e placas limpos', 'VERIFICACAO', 'Sem poeira', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (4, null, 'Relatório ou laudo da empresa', 'REGISTRO', 'Documento anexado', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('PRE-ELV-M', 'PRE', 'Elevador / plataforma', 'Inspeção e limpeza', 'MENSAL', 'TERCEIRIZADA', null, 'Elevadores/Plataformas')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Quadro de comando limpo e contatores reapertados', 'VERIFICACAO', 'Sem folga', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (2, null, 'Central hidráulica, guias, cabos e pistão limpos; cabos reapertados', 'VERIFICACAO', 'Limpos e firmes', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (3, null, 'Contato elétrico do freio de segurança íntegro e lubrificado', 'VERIFICACAO', 'Íntegro', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (4, null, 'Corrediças da porta e contatos de fim de curso íntegros', 'VERIFICACAO', 'Atuando', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (5, null, 'Chave de emergência da porta e chave de segurança atuando', 'VERIFICACAO', 'Atuando', 'CRITICA', null, null::numeric, null::numeric, false, false, false, false),
  (6, null, 'Poço limpo', 'VERIFICACAO', 'Sem resíduo', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (7, null, 'Cabine: iluminação, barreira infravermelha e indicador de andar', 'VERIFICACAO', 'Todos funcionando', 'ALTA', null, null::numeric, null::numeric, false, false, false, false),
  (8, null, 'Relatório da empresa conservadora', 'REGISTRO', 'Documento anexado', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ('PRE-DIV-M', 'PRE', 'Divisória acústica', 'Limpeza e trilhos', 'MENSAL', 'INTERNA', null, 'Divisórias acústicas')
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values
  (1, null, 'Painéis limpos com tecido levemente úmido', 'VERIFICACAO', 'Sem manchas', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false),
  (2, null, 'Trilhos avaliados e lubrificados se necessário', 'VERIFICACAO', 'Corre sem travar', 'NORMAL', null, null::numeric, null::numeric, false, false, false, false)
) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);

commit;

-- Conferência: 51 rotinas e o total de itens
select count(*) as rotinas, (select count(*) from public.preventiva_rotina_itens) as itens
from public.preventiva_rotinas;
