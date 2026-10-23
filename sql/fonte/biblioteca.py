# Biblioteca de rotinas preventivas — Entre Amigos
# Fonte: Manual de Manutenções Preventivas v1.0 (05/2025) + decisões do Walter (23/10/2026).
# Itens com novo=True não estão no manual (segurança). Faixas "por equipamento" seguem
# fabricante + nutrição e são cadastradas no equipamento.

def I(texto, tipo, criterio, crit, unidade=None, minimo=None, maximo=None,
      faixa_equip=False, bloqueio=False, novo=False, foto=False, grupo=None):
    assert tipo in ("VERIFICACAO", "MEDICAO", "REGISTRO")
    assert crit in ("CRITICA", "ALTA", "NORMAL")
    return dict(texto=texto, tipo=tipo, criterio=criterio, criticidade=crit,
                unidade=unidade, minimo=minimo, maximo=maximo, faixa_equipamento=faixa_equip,
                bloqueio=bloqueio, novo=novo, foto_obrigatoria=foto or tipo == "REGISTRO" and "Foto" in texto,
                grupo=grupo)

V, M, R = "VERIFICACAO", "MEDICAO", "REGISTRO"
C, A, N = "CRITICA", "ALTA", "NORMAL"

def foto_final(txt="Foto final do equipamento"):
    return I(txt, R, "Foto anexada", N, foto=True)

def laudo(txt="Relatório ou laudo da empresa"):
    return I(txt, R, "Documento anexado", N)

def bloco_gas():
    g = "Bloco Gás"
    return [
        I("Mangueira do regulador sem vazamento (teste de espuma)", V, "Bolhas não crescem nem se movem", C, grupo=g),
        I("Válvula borboleta sem vazamento", V, "Bolhas não crescem nem se movem", C, grupo=g),
        I("Conexão mangueira–equipamento sem vazamento", V, "Bolhas não crescem nem se movem", C, grupo=g),
        I("Mangueira de gás dentro da validade e sem ressecamento", V, "Validade impressa em dia; sem trincas", C, novo=True, grupo=g),
        I("Queimadores acendem com chama estável", V, "Chama azul e uniforme, sem ponta amarela", A, grupo=g),
    ]

def bloco_eletrico_quadro(equip="do equipamento"):
    return [
        I(f"Tensão no quadro de comando {equip}", M, "Dentro da faixa do equipamento", A, unidade="V", faixa_equip=True),
        I(f"Corrente no quadro de comando {equip}", M, "Até a corrente nominal da placa", A, unidade="A", faixa_equip=True),
    ]

def rot(codigo, familia, tipo_equip, nome, freq, executor, itens, obs=None, manual=None):
    assert freq in ("DIARIA", "SEMANAL", "MENSAL", "TRIMESTRAL", "QUADRIMESTRAL", "SEMESTRAL", "ANUAL", "QUINQUENAL")
    assert executor in ("INTERNA", "TERCEIRIZADA", "SHOPPING")
    return dict(codigo=codigo, familia=familia, tipo_equipamento=tipo_equip, nome=nome,
                frequencia=freq, executor=executor, itens=itens, observacao=obs, secao_manual=manual or tipo_equip)

ROTINAS = []
add = ROTINAS.append

# ---------------- CLIMATIZAÇÃO ----------------
split_itens = [
    I("Funcionamento inicial sem ruído ou falha", V, "Liga e refrigera normalmente", N),
    I("Temperatura do ar insuflado", M, "Até 12 °C", A, unidade="°C", maximo=12),
    I("Bloqueio: disjuntor desligado após o teste inicial", V, "Disjuntor identificado e desligado", C, bloqueio=True),
    I("Filtros, direcionadores e turbinas limpos", V, "Sem poeira visível", N),
    I("Serpentina limpa com álcool, sem molhar a parte elétrica", V, "Serpentina limpa; elétrica seca", N),
    I("Conexões elétricas da evaporadora reapertadas", V, "Sem folga", A),
    I("Condensadora: parte elétrica e gabinete limpos", V, "Sem poeira ou gordura", N),
    I("Hélice da condensadora sem oscilação ou ruído", V, "Gira liso", N),
    *bloco_eletrico_quadro("da condensadora"),
    I("Tubulação frigorígena isolada e sem vazamento", V, "Sem óleo nas conexões; isolamento inteiro", A),
    I("Teste final após montagem", V, "Liga, refrigera e sem ruído", A),
]
add(rot("CLI-SPL-M", "CLI", "Ar-condicionado split (hi-wall)", "Limpeza, medições e teste", "MENSAL", "INTERNA", split_itens,
        "Registro serve de evidência para o PMOC", "Ar condicionado split"))
cassete = list(split_itens)
cassete.insert(3, I("Display desconectado antes da desmontagem e reconectado no final", V, "Display funcionando no teste final", N))
add(rot("CLI-CAS-M", "CLI", "Ar-condicionado split cassete", "Limpeza, medições e teste", "MENSAL", "INTERNA", cassete,
        "Registro serve de evidência para o PMOC", "Ar condicionado split cassete"))
add(rot("CLI-CXV-M", "CLI", "Caixa de ventilação (insuflamento)", "Limpeza dos filtros", "MENSAL", "INTERNA", [
    I("Filtros íntegros, sem rasgos ou deformação", V, "Filtro inteiro; trocar se rasgado", A),
    I("Filtros limpos com ar comprimido de baixa pressão", V, "Sem poeira acumulada", N),
    I("Filtros reinstalados e tampa de inspeção fechada", V, "Encaixados sem fresta", N),
    I("Teste de funcionamento do insuflamento", V, "Ventila normalmente", A),
], "Fazer antes do prazo se o filtro estiver saturado", "Caixas de ventilação"))
add(rot("CLI-VEN-M", "CLI", "Ventilador (parede ou coluna)", "Limpeza e lubrificação", "MENSAL", "INTERNA", [
    I("Bloqueio: disjuntor desligado", V, "Desligado", C, bloqueio=True),
    I("Carcaça e partes removidas limpas", V, "Sem poeira ou gordura", N),
    I("Motor limpo com pincel", V, "Sem poeira", N),
    I("Eixo central desengripado e lubrificado", V, "Gira livre, sem excesso de óleo", N),
    I("Carcaça montada e firme", V, "Sem folga ou vibração", A),
    I("DR do quadro elétrico funcionando (botão de teste)", V, "Desarma no teste", A),
    I("Programação do temporizador conferida", V, "Horários corretos", N),
], None, "Ventiladores"))

# ---------------- REFRIGERAÇÃO ----------------
add(rot("REF-BAL-M", "REF", "Balcão refrigerado", "Lavagem do condensador e aferição", "MENSAL", "INTERNA", [
    I("Temperatura do controlador", M, "Dentro da faixa do equipamento (nutrição)", A, unidade="°C", faixa_equip=True),
    I("Diferença entre controlador e termômetro da nutrição", M, "Até 2 °C", A, unidade="°C", maximo=2, novo=True),
    I("Produtos retirados e guardados em local refrigerado", V, "Nenhum produto fora de refrigeração", A),
    I("Bloqueio: equipamento desligado da tomada", V, "Desligado", C, bloqueio=True),
    I("Condensador e compressor lavados e secos", V, "Sem sujeira aderida", N),
    I("Pressão do gás no compressor (válvula Schrader)", M, "Dentro da faixa do fluido (fabricante)", A, unidade="psi", faixa_equip=True),
    I("Sonda de temperatura respondendo (teste de desconexão)", V, "Controlador indica erro ao desconectar", A),
    I("Tampa de proteção do compressor recolocada", V, "Fixada", N),
    I("Balcão limpo com detergente neutro", V, "Sem sujeira", N),
    I("Temperatura ideal atingida antes de repor os alimentos", V, "Dentro da faixa antes da reposição", A),
], "Exige manifold ou manômetro para a pressão", "Balcões refrigerados"))
add(rot("REF-CAM-T", "REF", "Câmara frigorífica", "Inspeção e medições do sistema", "TRIMESTRAL", "TERCEIRIZADA", [
    I("Temperatura no controlador", M, "Dentro da faixa da câmara (nutrição)", A, unidade="°C", faixa_equip=True),
    I("Diferença entre controlador e termômetro de sonda", M, "Até 2 °C", A, unidade="°C", maximo=2, novo=True),
    I("Gaxetas magnéticas e borracha varredora íntegras", V, "Sem rasgos; porta veda em todo o contorno", A),
    I("Mola gás fecha a porta sozinha", V, "Fecha totalmente sem ajuda", N),
    I("Serpentina da evaporadora sem gelo (degelo funcionando)", V, "Sem bloco de gelo", A),
    I("Ventilador da evaporadora sem ruído ou trepidação; grelhas limpas", V, "Gira liso, sem barulho", N),
    I("Lâmpadas internas funcionando", V, "Todas acesas", N),
    I("Tubulação frigorígena isolada e sem obstrução", V, "Sem trecho exposto", N),
    I("Pressão da linha de líquido (alta)", M, "Faixa do fluido refrigerante (fabricante)", A, unidade="psi", faixa_equip=True),
    I("Pressão da linha de sucção", M, "Faixa do fluido refrigerante (fabricante)", A, unidade="psi", faixa_equip=True),
    *bloco_eletrico_quadro("da condensadora"),
    I("Ventilador da condensadora sem ruído; hélices em bom estado", V, "Sem trinca ou folga", N),
    I("Tela e gabinete da condensadora limpos", V, "Sem sujeira aderida", N),
    foto_final("Foto final da condensadora"),
    laudo(),
], None, "Câmaras frigoríficas"))

# ---------------- GÁS ----------------
def gas(codigo, tipo, especificos, manual):
    add(rot(codigo, "GAS", tipo, "Teste de gás, queimadores e limpeza", "MENSAL", "INTERNA",
            bloco_gas() + [I("Bloqueio: gás fechado antes da lavagem", V, "Registro fechado", C, bloqueio=True)] + especificos
            + [I("Teste final de funcionamento", V, "Acende e aquece normalmente", A), foto_final()], None, manual))

limpeza_desincrustante = [
    I("Superfície desincrustada (produto alcalino + fibraço)", V, "Sem crosta ou gordura aderida", N),
    I("Enxágue completo e secagem natural", V, "Sem resíduo de produto químico", N),
]
gas("GAS-BAN-M", "Banho-maria", limpeza_desincrustante, "Banho maria")
gas("GAS-CHA-M", "Chapa", limpeza_desincrustante, "Chapa")
gas("GAS-FOG-M", "Fogão", [
    I("Grelhas e queimadores retirados, desincrustados e enxaguados", V, "Sem crosta", N),
    I("Bicos do fogão desobstruídos", V, "Furos livres", A),
    *limpeza_desincrustante,
    I("Grelhas e queimadores recolocados na posição", V, "Encaixe correto", A),
], "Fogões")
gas("GAS-FRI-M", "Fritadeira a gás", [
    I("Termostato e válvula solenoide protegidos durante a lavagem", V, "Cobertos com saco plástico", A),
    I("Resíduos endurecidos removidos (espátula de madeira ou plástico)", V, "Sem crosta visível", N),
    I("Enxágue completo e equipamento seco", V, "Sem resíduo de produto químico", N),
], "Fritadeiras Vulcan")
gas("GAS-FBP-M", "Fritadeira de batata palha", [
    I("Placa de proteção removida e limpa por dentro", V, "Sem resíduo aderido", N),
    I("Bicos queimadores limpos", V, "Furos livres", A),
    *limpeza_desincrustante,
    I("Placa de proteção e botões recolocados", V, "Fixados", N),
], "Fritadeira batata palha")
gas("GAS-SAL-M", "Salamandra", limpeza_desincrustante, "Salamandra")

# ---------------- COCÇÃO ELÉTRICA E FORNOS ----------------
add(rot("COC-FCR-M", "COC", "Forno combinado Rational", "Inspeção, limpeza automática e parâmetros", "MENSAL", "INTERNA", [
    I("Borracha de vedação da porta íntegra", V, "Sem fissuras ou rasgos", A),
    I("Calha da porta esvaziada", V, "Sem água acumulada", N),
    I("Sensor de núcleo íntegro (sonda e cabo)", V, "Sem dano", A),
    I("Lâmpadas internas funcionando", V, "Acesas", N),
    I("Vedações da caldeira e do tubo do flap íntegras", V, "Sem fissuras ou rasgos", A),
    I("Dreno da caldeira sem calcário", V, "Sem incrustação", A),
    I("Placa de proteção do motor seca", V, "Sem líquido ou umidade", A),
    I("Cooler do painel girando", V, "Gira normalmente", A),
    I("Quadro de comando e filtro da placa limpos", V, "Sem poeira ou gordura", N),
    I("Limpeza automática executada até o fim", V, "Ciclo concluído sem erro", N),
    I("Parâmetros do painel sem alerta (vapor, CO₂, chama, RPM, ventilação, válvulas Y1–Y4, flap, bombas)", V, "Todos normais", A),
], None, "Forno combinado Rational"))
add(rot("COC-FCU-M", "COC", "Forno combinado Unox", "Enxágue, vedação, sensor e gás", "MENSAL", "INTERNA", [
    I("Enxágue Rotor Klean (modo Rinse) concluído", V, "Ciclo concluído sem aviso", N),
    I("Borracha de vedação íntegra", V, "Sem fissuras ou rasgos", A),
    I("Câmara interna limpa", V, "Sem resíduo", N),
    I("Sensor de núcleo íntegro e limpo", V, "Cabo e haste sem dano", A),
    I("Peneira do dreno limpa", V, "Sem resíduo", N),
    I("Suportes e trilhos das bandejas alinhados", V, "Sem amassado; fixação firme", N),
    I("Vidro da porta limpo por dentro e por fora", V, "Sem gordura", N),
    I("Calha de condensados instalada", V, "No lugar", N),
    I("Maçaneta e dobradiça sem folga", V, "Abre e fecha sem entrave", N),
    I("Conexões e mangueira de gás sem vazamento", V, "Bolhas não crescem nem se movem", C),
    I("Mangueira de água e filtro de entrada sem vazamento", V, "Secos", A),
    I("Coifa sem respingar água sobre o forno", V, "Sem respingo", A),
    I("Forno e mesa de apoio sem avarias externas", V, "Sem dano", N),
], "Em garantia: confirmar periodicidade com a autorizada", "Forno combinado Unox"))
forno_limpeza = [
    I("Iniciado com o forno desligado e abaixo de 60 °C", V, "Forno frio", A, bloqueio=True),
    I("Bandeja e câmara interna limpas (sem objetos abrasivos)", V, "Sem resíduo", N),
    I("Borracha de vedação limpa e íntegra", V, "Sem fissuras ou rasgos", A),
    I("Parte externa limpa, seca e protegida com óleo para inox", V, "Sem manchas", N),
]
add(rot("COC-FCE-M", "COC", "Forno Copa Express", "Limpeza e inspeção elétrica", "MENSAL", "INTERNA", forno_limpeza + [
    I("Filtro de ar lavado e reinstalado", V, "Limpo e encaixado", N),
    I("Painel, temperatura, alarme e botões funcionando", V, "Todos respondem", A),
    I("Bloqueio: cabo de força desconectado para a inspeção elétrica", V, "Desconectado", C, bloqueio=True),
    I("Chave de fim de curso da porta com continuidade", V, "Continuidade confirmada", A),
    I("Sem pontos quentes em cabos e conexões (transformadores, capacitores, magnetrons, placa)", V, "Sem mancha marrom ou derretimento", C),
    I("Conexões reapertadas, incluindo o inversor de frequência", V, "Sem folga", A),
    I("Resistências da turbina e do lastro em bom estado", V, "Sem dano", A),
    I("Ventilador do micro-ondas sem ruído", V, "Gira liso", N),
    I("Laterais montadas e teclas testadas", V, "Painel funcionando", A),
], "Parte elétrica: técnico qualificado", "Forno Copa Express"))
add(rot("COC-FMC-M", "COC", "Forno Miniconv", "Limpeza e inspeção elétrica", "MENSAL", "INTERNA", forno_limpeza + [
    I("Painel, temperatura, alarme e botões funcionando", V, "Todos respondem", A),
    I("Bloqueio: cabo de força desconectado para a inspeção elétrica", V, "Desconectado", C, bloqueio=True),
    I("Tensão de alimentação", M, "Variação até 10% da nominal", A, unidade="V", faixa_equip=True),
    I("Conectores da resistência reapertados (borne e relé)", V, "Sem folga", A),
    I("Temperatura nos pontos quentes (pistola)", M, "Até 50 °C", C, unidade="°C", maximo=50),
    I("Corrente da resistência", M, "Dentro da faixa do equipamento", A, unidade="A", faixa_equip=True),
    I("Turbina de circulação sem vibração", V, "Sem vibração anormal", A),
    I("Equipamento fechado e testado", V, "Funcionando", A),
], "Parte elétrica: técnico qualificado. Nunca jogar água na parte externa.", "Forno Miniconv"))
add(rot("COC-FCS-M", "COC", "Fritadeira elétrica (churros e sushi)", "Limpeza e teste de termostatos", "MENSAL", "INTERNA", [
    I("Bloqueio: equipamento desconectado da rede elétrica", V, "Desconectado", C, bloqueio=True),
    I("Superfície limpa com desincrustante", V, "Sem gordura aderida", N),
    I("Cabo de alimentação da resistência firme (reaperto)", V, "Sem folga", A),
    I("Botão liga/desliga funcionando", V, "Liga e desliga", A),
    I("LED indicador funcionando", V, "Acende", N),
    I("Termostato de controle e de segurança atuando", V, "LED do regulador responde corretamente", C),
], None, "Fritadeira churros e sushi"))
add(rot("COC-MBT-M", "COC", "Mantenedor de batata", "Limpeza e teste", "MENSAL", "INTERNA", [
    I("Bloqueio: área desenergizada e equipamento fora da tomada", V, "Desligado", C, bloqueio=True),
    I("Parte elétrica protegida durante a lavagem", V, "Coberta", A),
    I("Superfície e cesto lavados (desincrustante 15 min + alta pressão)", V, "Sem gordura", N),
    I("Proteções retiradas e equipamento seco, começando pela parte elétrica", V, "Seco", A),
    I("Teste de funcionamento", V, "Aquece normalmente", A),
], None, "Mantenedor de batata"))

# ---------------- EXAUSTÃO ----------------
add(rot("EXA-CCV-S", "EXA", "Coifa convencional", "Lavagem de filtros e coifa", "SEMANAL", "INTERNA", [
    I("Bloqueio: equipamentos abaixo da coifa desligados e frios", V, "Todos desligados", C, bloqueio=True),
    I("Filtros lavados e reinstalados na posição correta", V, "Sem gordura visível; encaixados sem fresta", A),
    I("Drenos laterais esgotados e tampões recolocados", V, "Dreno livre, tampão no lugar", N),
    I("Coifa limpa por dentro e por fora, e seca", V, "Sem gordura escorrendo", N),
    I("Teste: exaustão funcionando com filtros instalados", V, "Puxa o ar normalmente", A),
], None, "Coifas convencionais"))
semestral_coifa = [
    I("Foto antes da limpeza", R, "Foto anexada", N, foto=True),
    I("Equipamentos abaixo da coifa protegidos com lona", V, "Totalmente cobertos", N),
    I("Desengorduramento interno completo", V, "Sem gordura acumulada nas paredes", A),
    I("Filtros, cartuchos e tampões repostos; exaustão testada", V, "Puxa o ar normalmente", A),
    I("Foto depois da limpeza", R, "Foto anexada", N, foto=True),
    I("Certificado de limpeza da empresa", R, "Documento anexado", N),
]
add(rot("EXA-CCV-SE", "EXA", "Coifa convencional", "Desengorduramento completo", "SEMESTRAL", "TERCEIRIZADA", semestral_coifa,
        "Prazo máximo de 6 meses; agendar junto com os dutos", "Coifas convencionais"))
lavadora_base = [
    I("Nível de detergente adequado", V, "Acima do mínimo", A),
    I("Bicos spray limpos e desobstruídos", V, "Todos borrifando", A),
    I("Calha limpa (dreno aberto, água e disjuntor desligados durante a limpeza)", V, "Sem gordura", N),
    I("Sensor de nível (boia) limpo e atuando", V, "Boia livre", A),
    I("Filtros hidrodinâmicos limpos", V, "Sem gordura", A),
    I("Cartuchos limpos por dentro e por fora", V, "Sem gordura", N),
    I("Válvula de retenção limpa", V, "Sem resíduo", N),
    I("Base da caixa de drenagem limpa", V, "Sem resíduo", N),
]
add(rot("EXA-CLV-S", "EXA", "Coifa lavadora", "Bicos, calha, boia e filtros", "SEMANAL", "INTERNA", lavadora_base, None, "Coifas lavadoras"))
add(rot("EXA-CLV-M", "EXA", "Coifa lavadora", "Limpeza completa com demister", "MENSAL", "TERCEIRIZADA", lavadora_base + [
    I("Filtros inerciais demister limpos", V, "Sem gordura", A),
    I("Tela perfurada limpa", V, "Furos livres", N),
    I("Partes internas da coifa limpas", V, "Sem gordura", N),
    foto_final(), laudo(),
], None, "Coifas lavadoras"))
add(rot("EXA-CLV-SE", "EXA", "Coifa lavadora", "Desengorduramento completo", "SEMESTRAL", "TERCEIRIZADA", semestral_coifa,
        "Prazo máximo de 6 meses; agendar junto com os dutos", "Coifas lavadoras"))
add(rot("EXA-DUT-SE", "EXA", "Duto de exaustão", "Desengorduramento dos dutos", "SEMESTRAL", "TERCEIRIZADA", [
    I("Foto antes da limpeza (pelas portinholas)", R, "Foto anexada", N, foto=True),
    I("Equipamentos protegidos e gordura contida até a caixa de esgoto", V, "Lona instalada", N),
    I("Bloqueio: exaustão e insuflamento desligados no quadro", V, "Desligados", C, bloqueio=True),
    I("Todos os trechos desengordurados", V, "Sem gordura acumulada", C),
    I("Portinholas recolocadas e vedadas", V, "Todas fechadas", A),
    I("Sistema religado após secagem", V, "Exaustão funcionando", A),
    I("Foto depois da limpeza", R, "Foto anexada", N, foto=True),
    I("Certificado de limpeza da empresa", R, "Documento anexado", N),
], "Prazo máximo de 6 meses", "Dutos de exaustão"))
add(rot("EXA-EXT-M", "EXA", "Exaustor", "Rolamento, correias e amperagem", "MENSAL", "INTERNA", [
    I("Bloqueio: disjuntor desligado e exaustor parado", V, "Parado", C, bloqueio=True),
    I("Rolamento sem ruído e eixos lubrificados", V, "Gira liso", A),
    I("Correias sem rasgos ou fissuras", V, "Íntegras", A),
    I("Corrente do motor", M, "Até a corrente nominal da placa", A, unidade="A", faixa_equip=True),
    I("Proteções recolocadas e teste de funcionamento", V, "Funcionando", A),
], None, "Exaustor"))

# ---------------- LAVAGEM E GELO ----------------
add(rot("LAV-GEL-S", "LAV", "Máquina de gelo", "Higienização interna e externa", "SEMANAL", "INTERNA", [
    I("Bloqueio: cabo de força desconectado", V, "Desconectado", C, bloqueio=True),
    I("Gelo existente descartado", V, "Recipiente vazio", N),
    I("Partes móveis e parte externa limpas (detergente neutro, esponja nova)", V, "Sem resíduo", N),
    I("Filtro de ar limpo", V, "Sem poeira", N),
    I("Parte interna higienizada com cloro (sem álcool e sem abrasivos)", V, "Pontos críticos higienizados", A),
    I("Enxágue completo, sem cheiro de cloro", V, "Sem resíduo de cloro", A),
    I("Filtro de água avaliado (trocado se necessário)", V, "Filtro dentro da vida útil", A),
    I("Peças recolocadas e máquina religada", V, "Funcionando", N),
    I("Gelo da primeira hora descartado, se necessário", V, "Avaliado", N),
], None, "Máquina de gelo"))
add(rot("LAV-GEL-M", "LAV", "Máquina de gelo", "Limpeza da condensadora e placas", "MENSAL", "TERCEIRIZADA", [
    I("Bloqueio: equipamento desligado no quadro e fora da tomada", V, "Desligado", C, bloqueio=True),
    I("Componentes elétricos e motor do ventilador protegidos", V, "Cobertos", A),
    I("Condensadora pulverizada com desincrustante", V, "Sem incrustação", N),
    I("Cortina e bandeja de água limpas", V, "Sem limo", A),
    I("Placas de gelo e bordas limpas", V, "Sem incrustação", A),
    I("Sensores de formação de placa e de nível limpos", V, "Limpos e instalados", A),
    I("Peças e condensadora recolocadas; máquina em funcionamento", V, "Produzindo gelo", A),
    foto_final(), laudo(),
], None, "Máquina de gelo"))
add(rot("LAV-COP-M", "LAV", "Máquina de lavar copos", "Limpeza, filtros e contatores", "MENSAL", "INTERNA", [
    I("Bloqueio: área desenergizada no quadro", V, "Desligado", C, bloqueio=True),
    I("Cesta giratória, peneira, tubo de dreno e filtro da bomba limpos", V, "Sem resíduo", N),
    I("Bocais de água limpos e desobstruídos", V, "Furos livres", A),
    I("Sem vazamento próximo ao quadro de comando", V, "Seco", C),
    I("Contatores reapertados", V, "Sem folga", A),
    I("Teste de funcionamento", V, "Lava e enxágua normalmente", A),
], None, "Máquina de lavar copos"))
add(rot("LAV-PRA-M", "LAV", "Máquina de lavar pratos", "Limpeza, esteiras e fim de curso", "MENSAL", "INTERNA", [
    I("Bloqueio: área desenergizada no quadro", V, "Desligado", C, bloqueio=True),
    I("Contatores reapertados", V, "Sem folga", A),
    I("Motor e contatores protegidos durante a limpeza", V, "Cobertos", A),
    I("Peneiras, filtro de resíduos e tubo de dreno limpos", V, "Sem resíduo", N),
    I("Bocais desobstruídos e tampões recolocados", V, "Furos livres", A),
    I("Compartimento interno limpo", V, "Sem resíduo", N),
    I("Correntes das esteiras reguladas", V, "Sem folga", A),
    I("Tensão de alimentação", M, "Igual à tensão do equipamento", A, unidade="V", faixa_equip=True),
    I("Chave de fim de curso atuando", V, "Hastes reguladas e atuando", A),
    I("Proteções retiradas e teste de funcionamento", V, "Funcionando", A),
], None, "Máquina de lavar pratos"))

# ---------------- INCÊNDIO E GÁS ----------------
add(rot("INC-VGS-S", "INC", "Rede de gás", "Teste de vazamento com detector", "SEMANAL", "INTERNA", [
    I("Detector regulado (sensibilidade ajustada até bips espaçados)", V, "Regulado", A),
    I("Todas as mangueiras e registros testados", V, "Sem alarme do detector", C),
    I("Toda a tubulação e ramificações testadas", V, "Sem alarme do detector", C),
    I("Vazamento encontrado corrigido e reteste feito", V, "Reteste sem alarme (Não se aplica se não houve)", C),
], None, "Teste de vazamentos de gás na rede das lojas"))
add(rot("INC-EXT-S", "INC", "Extintor", "Inspeção visual, lacre, pressão e validade", "SEMANAL", "INTERNA", [
    I("Extintor em bom estado de conservação", V, "Sem amassado ou corrosão", A),
    I("Lacre intacto", V, "Não violado", C),
    I("Manômetro na faixa verde", V, "Ponteiro no verde", C),
    I("Carga dentro da validade", V, "Validade em dia", C),
    I("Acesso e sinalização desobstruídos", V, "Nada na frente", A, novo=True),
], None, "Extintores em geral"))
add(rot("INC-SAP-S", "INC", "Cilindro de saponificante", "Inspeção visual, pressão e validade", "SEMANAL", "INTERNA", [
    I("Cilindro em bom estado de conservação", V, "Sem amassado ou corrosão", A),
    I("Manômetro na faixa verde", V, "Ponteiro no verde", C),
    I("Carga dentro da validade", V, "Validade em dia", C),
], "Inclui cilindros das salas de salada e sobremesa", "Cilindros do saponificante"))
add(rot("INC-SAP-M", "INC", "Sistema saponificante, CO₂ e dampers", "Teste de acionamento do sistema", "MENSAL", "INTERNA", [
    I("By-pass da solenoide desativado e central operando", V, "Central sem falha", C),
    I("Solenoides de todos os cilindros desconectadas antes do teste", V, "Desconectadas (teste com chave de fenda)", C, bloqueio=True),
    I("Acionador manual ativado com bocas de fogão acesas", V, "Sistema entrou em combate", C),
    I("Dampers fecharam", V, "Entradas dos dutos fechadas", C),
    I("Alarmes sonoros e visuais ativados", V, "Ativados", C),
    I("Gás cortado (bocas apagaram)", V, "Gás cortado", C),
    I("Sistema rearmado, dampers reabertos e solenoides reinstaladas", V, "Sistema em operação normal", C),
], None, "Teste do sistema saponificante, CO² e dampers"))
add(rot("INC-DGS-M", "INC", "Sistema de detecção de gás", "Teste de alarme e corte de gás", "MENSAL", "INTERNA", [
    I("Central de gás e by-pass operando normalmente", V, "Sem falha", C),
    I("Detector disparou com gás de isqueiro", V, "Alarme sonoro e visual ativado", C),
    I("Gás cortado (bocas apagaram)", V, "Gás cortado", C),
    I("Gás dos equipamentos fechado antes de rearmar", V, "Todos fechados", C, bloqueio=True),
    I("Sistema reativado na central", V, "Em operação normal", C),
], "GN: detector no alto. GLP: detector próximo ao chão.", "Teste do sistema de detecção de gás"))
add(rot("INC-ALA-M", "INC", "Alarme e detectores de fumaça", "Teste com spray (NBR 17240)", "MENSAL", "INTERNA", [
    I("Central de alarme sem falha e sem silenciamento", V, "Operando", C),
    I("Detectores testados com spray específico", V, "Todos dispararam", C),
    I("Central indicou FOGO e alarmes sonoros e visuais ativaram", V, "Ativados", C),
    I("Sistemas associados acionaram (portas automáticas e outros)", V, "Acionaram (Não se aplica se não houver)", A),
    I("Central reiniciada e em operação normal", V, "Normal", C),
], "Usar somente spray de teste próprio para detector", "Teste de combate a incêndio"))
add(rot("INC-LUM-M", "INC", "Luminária de emergência", "Teste de acendimento automático", "MENSAL", "INTERNA", [
    I("Acende automaticamente ao retirar da tomada", V, "Acendeu", C),
    I("Plug recolocado na tomada", V, "Recolocado", A),
], "Se não acender: substituir imediatamente", "Luminárias de emergência"))
add(rot("INC-BOM-T", "INC", "Bomba dos hidrantes", "Teste de pressurização", "TRIMESTRAL", "INTERNA", [
    I("Todas as bombas testadas com a mangueira liberando água", V, "Pressão adequada no hidrante", C),
], "Lojas de shopping: semestral, conforme o shopping", "Teste da bomba de água dos hidrantes"))
add(rot("INC-BRI-Q", "INC", "Brigada de incêndio", "Treinamento de 20% da equipe", "QUADRIMESTRAL", "TERCEIRIZADA", [
    I("Treinamento realizado com 20% dos funcionários efetivos", V, "Lista de presença com 20% ou mais", A),
    I("Grupo diferente dos quadrimestres anteriores", V, "Sem repetição", N),
    I("Certificado e lista de presença", R, "Documento anexado", N),
], "Meta: 60% da equipe treinada em 12 meses", "Treinamento de brigada de incêndio"))
add(rot("INC-EXT-A", "INC", "Extintor", "Recarga", "ANUAL", "TERCEIRIZADA", [
    I("Extintores recarregados conforme a validade", V, "Todos com nova validade", C),
    I("Nota ou certificado da recarga", R, "Documento anexado", N),
], None, "Extintores em geral"))
add(rot("INC-CO2-A", "INC", "Extintor de CO₂ dos dutos", "Inspeção técnica de pressurização", "ANUAL", "TERCEIRIZADA", [
    I("Pressurização dos cilindros de CO₂ inspecionada", V, "Aprovada", C),
    laudo(),
], None, "Extintores de CO2 dos dutos"))
add(rot("INC-EST-A", "INC", "Tubulação de gás", "Teste de estanqueidade (NBR 15358)", "ANUAL", "TERCEIRIZADA", [
    I("Teste primário sem queda de pressão", V, "Pressão estável", C),
    I("Limpeza da tubulação com gás inerte", V, "Saída livre de óxidos", A),
    I("Teste secundário sem queda de pressão", V, "Pressão estável", C),
    I("Laudo de estanqueidade", R, "Documento anexado", N),
], None, "Teste de estanqueidade da tubulação de gás"))
add(rot("INC-HID-A", "INC", "Mangueira de hidrante", "Teste hidrostático", "ANUAL", "TERCEIRIZADA", [
    I("Todas as mangueiras em uso inspecionadas e testadas", V, "Aprovadas", C),
    I("Laudo do teste hidrostático", R, "Documento anexado", N),
], None, "Teste hidrostático das mangueiras de hidrantes"))
add(rot("INC-SAP-5A", "INC", "Cilindro de saponificante", "Recarga", "QUINQUENAL", "TERCEIRIZADA", [
    I("Cilindros recarregados", V, "Nova validade registrada", C),
    I("Certificado da recarga", R, "Documento anexado", N),
], None, "Cilindros do saponificante"))

# ---------------- ELÉTRICA E ENERGIA ----------------
add(rot("ELE-GER-S", "ELE", "Gerador", "Teste sem carga", "SEMANAL", "INTERNA", [
    I("Controle colocado em modo manual", V, "Modo manual", A),
    I("Nível e viscosidade do óleo do motor", V, "Dentro do indicado", A),
    I("Nível de combustível", M, "Mínimo 50% do tanque", C, unidade="%", minimo=50),
    I("Carga da bateria", V, "Indicação normal no quadro", A),
    I("Partida manual do motor", V, "Partiu normalmente", C),
    I("Controle devolvido ao modo automático", V, "Modo automático", C),
], None, "Gerador"))
add(rot("ELE-GER-M", "ELE", "Gerador", "Teste com carga (queda simulada)", "MENSAL", "INTERNA", [
    I("Gerador assumiu a loja na queda simulada do QGBT", V, "Assumiu", C),
    I("Tempo para assumir a energia", M, "Dentro do tempo do fabricante", A, unidade="s", faixa_equip=True),
    I("Nível de combustível", M, "Mínimo 50% do tanque", C, unidade="%", minimo=50),
    I("Gerador em modo automático ao final", V, "Modo automático", C),
], "Fazer junto com o teste dos nobreaks (TI-NOB-M)", "Gerador"))
add(rot("ELE-GER-A", "ELE", "Gerador", "Revisão completa e trocas", "ANUAL", "TERCEIRIZADA", [
    I("Filtros de combustível (retorno e motor), óleo e ar trocados", V, "Todos trocados", A),
    I("Sem vazamento nas tampas de válvula", V, "Seco", A),
    I("Intercooler, radiador e braçadeiras reapertados; borracha íntegra", V, "Sem folga ou fissura", A),
    I("Nível do líquido de arrefecimento", V, "Dentro do especificado", A),
    I("Terminais da bateria sem oxidação e firmes", V, "Limpos e firmes", A),
    I("Barramento sem bornes folgados; pré-aquecimento e contatora funcionando", V, "Normal", A),
    I("Parâmetros com o motor ligado (rotação, óleo, água, tensões, frequência, turbo)", V, "Todos dentro do padrão", C),
    I("Controle devolvido ao modo automático", V, "Modo automático", C),
    laudo(),
], "Empresa autorizada", "Gerador"))
add(rot("ELE-QDE-SE", "ELE", "Quadro elétrico", "Limpeza, reaperto e identificação", "SEMESTRAL", "INTERNA", [
    I("Bloqueio: disjuntor geral desligado e ausência de tensão confirmada", V, "Sem tensão medida", C, bloqueio=True),
    I("Quadro limpo (ar comprimido e aspirador)", V, "Sem poeira nos contatos", N),
    I("Conexões dos disjuntores no barramento reapertadas", V, "Sem folga", C),
    I("Identificação do quadro confere com os equipamentos", V, "Etiquetas corretas", A),
    I("Quadro fechado e reenergizado", V, "Funcionando", A),
    foto_final("Foto do quadro após a manutenção"),
], "Técnico qualificado (NR-10)", "Quadros elétricos"))

# ---------------- TI ----------------
add(rot("TI-NOB-M", "TI", "Nobreak (servidor e KDS)", "Teste de autonomia", "MENSAL", "INTERNA", [
    I("Chamado aberto com TI no mínimo 1 dia antes", V, "Chamado registrado", A),
    I("Teste feito entre segunda e quarta, no primeiro horário", V, "Dentro da janela", A),
    I("Nobreak do servidor sustentou a carga", V, "Sem desligamento", C),
    I("Nobreak do KDS sustentou a carga", V, "Sem desligamento", C),
], "Junto com o teste com carga do gerador", "Teste dos nobreaks do servidor e do KDS"))
add(rot("TI-SRV-A", "TI", "Servidor e rack", "Limpeza interna", "ANUAL", "TERCEIRIZADA", [
    I("Servidor limpo por dentro e por fora", V, "Sem poeira", N),
    I("Rack e equipamentos do rack limpos", V, "Sem poeira", N),
    I("Coolers e placas limpos", V, "Sem poeira", A),
    laudo(),
], None, "Limpeza do servidor da loja"))

# ---------------- PREDIAL ----------------
add(rot("PRE-ELV-M", "PRE", "Elevador / plataforma", "Inspeção e limpeza", "MENSAL", "TERCEIRIZADA", [
    I("Quadro de comando limpo e contatores reapertados", V, "Sem folga", A),
    I("Central hidráulica, guias, cabos e pistão limpos; cabos reapertados", V, "Limpos e firmes", A),
    I("Contato elétrico do freio de segurança íntegro e lubrificado", V, "Íntegro", C),
    I("Corrediças da porta e contatos de fim de curso íntegros", V, "Atuando", C),
    I("Chave de emergência da porta e chave de segurança atuando", V, "Atuando", C),
    I("Poço limpo", V, "Sem resíduo", N),
    I("Cabine: iluminação, barreira infravermelha e indicador de andar", V, "Todos funcionando", A),
    laudo("Relatório da empresa conservadora"),
], None, "Elevadores/Plataformas"))
add(rot("PRE-DIV-M", "PRE", "Divisória acústica", "Limpeza e trilhos", "MENSAL", "INTERNA", [
    I("Painéis limpos com tecido levemente úmido", V, "Sem manchas", N),
    I("Trilhos avaliados e lubrificados se necessário", V, "Corre sem travar", N),
], None, "Divisórias acústicas"))

if __name__ == "__main__":
    import json, collections
    codes = [r["codigo"] for r in ROTINAS]
    assert len(codes) == len(set(codes)), "código repetido"
    print(len(ROTINAS), "rotinas;", sum(len(r["itens"]) for r in ROTINAS), "itens")
    print(collections.Counter(r["frequencia"] for r in ROTINAS))
    print(collections.Counter(r["executor"] for r in ROTINAS))
    json.dump(ROTINAS, open("biblioteca.json", "w"), ensure_ascii=False, indent=1)
