# Palavras do nome do equipamento → Tipo (preventivas) e Categoria (chamado).
# Regra: vale a ÚLTIMA palavra da lista encontrada no nome (as mais específicas ficam no fim).
# Fonte única: gera src/core/reconhecer.js e a aba "Reconhecimento" da planilha.

SEM = 'Outro equipamento'
R = [
    # ---- itens sem preventiva (só chamados) ----
    (['cadeira', 'mesa', 'sofá', 'sofa', 'banqueta', 'banco ', 'poltrona', 'aparador', 'armário', 'armario', 'estante',
      'prateleira', 'balcão', 'balcao', 'gaveteiro', 'cristaleira', 'carrinho', 'lixeira', 'cadeirão', 'cadeirao'], 'Mobiliário', 'Móveis'),
    (['porta', 'janela', 'piso', 'forro', 'parede', 'teto', 'vidro', 'telhado', 'escada', 'corrimão', 'corrimao', 'fachada',
      'toldo', 'espelho', 'rodapé', 'rodape', 'fechadura', 'calha', 'revestimento'], 'Predial e estrutura', 'Predial'),
    (['pintura'], 'Predial e estrutura', 'Pintura'),
    (['tomada', 'interruptor', 'lâmpada', 'lampada', 'iluminação', 'iluminacao', 'luminária', 'luminaria', 'refletor',
      'spot', 'fiação', 'fiacao', 'disjuntor', 'luz '], SEM, 'Elétrica'),
    (['torneira', 'pia', 'cuba', 'vaso', 'descarga', 'mictório', 'mictorio', 'ralo', 'caixa de gordura', "caixa d'água",
      'caixa dagua', "bomba d'água", 'bomba dagua', 'aquecedor', 'chuveiro', 'filtro', 'bebedouro', 'registro', 'sifão', 'sifao'], SEM, 'Hidráulica'),
    (['tela', 'kds', 'impressora', 'computador', 'notebook', 'tablet', 'roteador', 'wi-fi', 'wifi', 'tv', 'televis',
      'caixa de som', 'som ambiente', 'câmera', 'camera', 'cftv', 'pdv', 'balança', 'balanca', 'totem', 'monitor',
      'mesa de som', 'amplificador', 'amplicifador', 'rack de som', 'hack de som', 'video game', 'videogame', 'vídeo game',
      'vídeo wall', 'video wall', 'tv box', 'microfone', 'projetor', 'telefone', 'relógio de ponto', 'relogio de ponto'], 'TI e KDS', 'TI e KDS'),
    (['micro-ondas', 'microondas', 'liquidificador', 'batedeira', 'processador', 'mixer', 'espremedor', 'cafeteira',
      'máquina de café', 'maquina de cafe', 'seladora', 'fatiador', 'moedor', 'sanduicheira', 'grill', 'torradeira',
      'panela', 'amassadeira', 'cilindro de massa', 'forno', 'aquecedor de', 'robot coupe', 'robot-coupe', 'churrasqueira',
      'vácuo', 'vacuo', 'vacúo', 'embaladora', 'descascador', 'cortador', 'termômetro', 'termometro'], SEM, 'Equipamentos de cozinha'),
    (['dispenser', 'saboneteira', 'papeleira', 'secador de mão', 'secador de mao'], SEM, 'Limpeza'),
    # ---- climatização ----
    (['ar-condicionado', 'ar condicionado', 'split', 'condensadora', 'evaporadora'], 'Ar-condicionado split (hi-wall)', 'Climatização'),
    (['cassete', 'cassette', 'k7'], 'Ar-condicionado split cassete', 'Climatização'),
    (['ventilador'], 'Ventilador (parede ou coluna)', 'Climatização'),
    (['insuflamento', 'caixa de ventilação', 'caixa de ventilacao'], 'Caixa de ventilação (insuflamento)', 'Climatização'),
    # ---- refrigeração ----
    (['geladeira', 'refrigerador', 'freezer', 'frigobar', 'expositor', 'cervejeira', 'refrigerado', 'refrigerada',
      'pass through', 'pass-through', 'vitrine fria', 'ultracongelador', 'resfriador', 'chopeira', 'choppeira', 'balcão congelado', 'balcao congelado', 'pista fria'], 'Balcão refrigerado', 'Refrigeração'),
    (['aquário', 'aquario'], SEM, 'Refrigeração'),
    (['câmara', 'camara'], 'Câmara frigorífica', 'Refrigeração'),
    # ---- cocção ----
    (['banho-maria', 'banho maria'], 'Banho-maria', 'Equipamentos de cozinha'),
    (['chapa'], 'Chapa', 'Equipamentos de cozinha'),
    (['fogão', 'fogao', 'boca', 'queimador'], 'Fogão', 'Equipamentos de cozinha'),
    (['fritadeira', 'fritador'], 'Fritadeira a gás', 'Equipamentos de cozinha'),
    (['fritadeira elétrica', 'fritadeira eletrica', 'fritadeira de churros', 'fritadeira de churro', 'fritadeira de sushi'], 'Fritadeira elétrica (churros e sushi)', 'Equipamentos de cozinha'),
    (['batata palha'], 'Fritadeira de batata palha', 'Equipamentos de cozinha'),
    (['salamandra'], 'Salamandra', 'Equipamentos de cozinha'),
    (['mantenedor'], 'Mantenedor de batata', 'Equipamentos de cozinha'),
    (['rational', 'combinado'], 'Forno combinado Rational', 'Equipamentos de cozinha'),
    (['unox'], 'Forno combinado Unox', 'Equipamentos de cozinha'),
    (['copa express'], 'Forno Copa Express', 'Equipamentos de cozinha'),
    (['miniconv'], 'Forno Miniconv', 'Equipamentos de cozinha'),
    # ---- exaustão ----
    (['coifa'], 'Coifa convencional', 'Exaustão'),
    (['coifa lavadora'], 'Coifa lavadora', 'Exaustão'),
    (['duto'], 'Duto de exaustão', 'Exaustão'),
    (['exaustor'], 'Exaustor', 'Exaustão'),
    # ---- lavagem e gelo ----
    (['máquina de gelo', 'maquina de gelo', 'gelo'], 'Máquina de gelo', 'Equipamentos de cozinha'),
    (['lava copos', 'lava-copos', 'lavar copos', 'lavadora de copos'], 'Máquina de lavar copos', 'Equipamentos de cozinha'),
    (['lava louça', 'lava-louça', 'lava louca', 'lava-louca', 'lava louças', 'lava pratos', 'lavar pratos', 'lavadora de pratos', 'lava-louças'], 'Máquina de lavar pratos', 'Equipamentos de cozinha'),
    # ---- incêndio e gás ----
    (['rede de gás', 'rede de gas', 'central de gás', 'central de gas', 'glp'], 'Rede de gás', 'Segurança'),
    (['tubulação de gás', 'tubulacao de gas', 'tubulação do gás', 'tubulacao do gas'], 'Tubulação de gás', 'Segurança'),
    (['extintor'], 'Extintor', 'Segurança'),
    (['co2 dos dutos', 'co2 da coifa', 'co₂ dos dutos', 'co₂ da coifa'], 'Extintor de CO₂ dos dutos', 'Segurança'),
    (['saponificante'], 'Cilindro de saponificante', 'Segurança'),
    (['damper', 'sistema saponificante'], 'Sistema saponificante, CO₂ e dampers', 'Segurança'),
    (['detector de gás', 'detector de gas', 'detecção de gás', 'deteccao de gas', 'sensor de gás', 'sensor de gas'], 'Sistema de detecção de gás', 'Segurança'),
    (['alarme', 'detector de fumaça', 'detector de fumaca', 'fumaça', 'fumaca'], 'Alarme e detectores de fumaça', 'Segurança'),
    (['emergência', 'emergencia'], 'Luminária de emergência', 'Segurança'),
    (['hidrante'], 'Mangueira de hidrante', 'Segurança'),
    (['bomba de incêndio', 'bomba de incendio', 'bomba dos hidrantes', 'bomba do hidrante', 'bomba de hidrante'], 'Bomba dos hidrantes', 'Segurança'),
    (['brigada'], 'Brigada de incêndio', 'Segurança'),
    # ---- elétrica, TI, predial ----
    (['gerador'], 'Gerador', 'Elétrica'),
    (['quadro elétrico', 'quadro eletrico', 'quadro de distribuição', 'quadro de distribuicao', 'qdc', 'quadro de força', 'quadro de forca', 'quadro geral'], 'Quadro elétrico', 'Elétrica'),
    (['nobreak', 'no-break', 'no break', 'nobreack', 'no-breack'], 'Nobreak (servidor e KDS)', 'TI e KDS'),
    (['servidor', 'rack'], 'Servidor e rack', 'TI e KDS'),
    (['elevador', 'plataforma', 'monta-carga', 'monta carga'], 'Elevador / plataforma', 'Predial'),
    (['divisória', 'divisoria'], 'Divisória acústica', 'Predial'),
    # ---- prioridade final (valem mesmo com outra palavra no nome) ----
    (['kds', 'rack de som', 'hack de som', 'tinklaid'], 'TI e KDS', 'TI e KDS'),
    (['restoclean'], SEM, 'Equipamentos de cozinha'),
]

def linhas():
    out = []
    for palavras, tipo, cat in R:
        for p in palavras:
            out.append((p, tipo, cat))
    return out

# Nome que indica congelados (faixa de temperatura padrão de congelados)
CONGELADOS = ['congel', 'freezer', 'ultracongelador']
NAO_CONGELADOS = ['descongel']

if __name__ == '__main__':
    import json, sys
    dest = sys.argv[1] if len(sys.argv) > 1 else 'src/core/reconhecer.js'
    js = f"""// Gerado por ferramentas/reconhecimento.py — não editar à mão.
// Reconhece Tipo (preventivas) e Categoria (chamado) pelo nome do equipamento.
// Vale a ÚLTIMA palavra da lista encontrada no nome (as mais específicas ficam no fim).
export const PALAVRAS = {json.dumps(linhas(), ensure_ascii=False)};
export const CONGELADOS = {json.dumps(CONGELADOS, ensure_ascii=False)};
export const NAO_CONGELADOS = {json.dumps(NAO_CONGELADOS, ensure_ascii=False)};
const fold = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/₂/g, '2').replace(/[^a-z0-9]+/g, ' ').trim();

/** {{ tipo, categoria, palavra }} ou null. O que vem depois de " – " (ex.: setor) é ignorado. A palavra precisa estar no INÍCIO de uma palavra do nome
 *  ("duto" reconhece "Duto 02", mas não "produto"). `tabela` permite usar a aba Reconhecimento da planilha. */
export function reconhecer(nome, tabela = PALAVRAS) {{
  const n = ' ' + fold(String(nome ?? '').split(' – ')[0]) + ' ';
  let achou = null;
  for (const [p, tipo, categoria] of tabela) {{
    const f = fold(p);
    if (f && n.includes(' ' + f)) achou = {{ tipo, categoria, palavra: p }};
  }}
  return achou;
}}
/** Congelado pelo nome do equipamento ou, se o nome não disser, pelo nome do setor ("Câmara congelado"). */
export const ehCongelado = (nome, setor = '') => {{
  const t = n => {{ const f = fold(n); return NAO_CONGELADOS.some(p => f.includes(p)) ? false : CONGELADOS.some(p => f.includes(p)) ? true : null; }};
  return t(nome) ?? t(setor) ?? false;
}};
"""
    open(dest, 'w').write(js)
    print('ok', len(linhas()), 'palavras')
