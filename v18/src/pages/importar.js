// Importação da planilha de cadastro (Cadastro_Equipamentos_*.xlsx).
// Planilha simples: Área, Setor, Equipamento, Qtd, Última preventiva grande, Observação.
// O Tipo (preventivas) e a Categoria (chamado) são reconhecidos pelo nome e podem ser trocados aqui antes de importar.
// Também aceita a planilha antiga (com colunas Tipo, Categoria, temperaturas, tensão…).
import { sb } from '../config/supabase.js';
import { S, unitName, tiposBiblioteca, TIPOS_SEM_PREVENTIVA, rotinasDoTipo, loadBase, loadLibrary, FREQ } from '../core/state.js';
import { esc, icon, toast, errMsg, busy, todayISO, monthLabel } from '../core/util.js';
import { proximaPelaUltima, FREQ_LONGAS } from '../core/agenda.js';
import { reconhecer, ehCongelado, PALAVRAS } from '../core/reconhecer.js';
import { criarEquipamento } from './equipamentos.js';

const XLSX_URL = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
function loadXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  return new Promise((ok, fail) => { const s = document.createElement('script'); s.src = XLSX_URL; s.onload = () => ok(window.XLSX); s.onerror = () => fail(new Error('Não foi possível carregar o leitor de planilhas. Verifique a internet.')); document.head.appendChild(s); });
}
const norm = s => String(s ?? '').trim();
const key = s => norm(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const numOrNull = v => v === '' || v === null || v === undefined || isNaN(Number(v)) ? null : Number(v);
// Data da planilha: número de série do Excel, dd/mm/aaaa, mm/aaaa ou aaaa-mm-dd → 'aaaa-mm-dd' ('' se vazio, null se inválida)
function dataPlanilha(v) {
  if (v === '' || v === null || v === undefined) return '';
  if (typeof v === 'number') return v > 20000 && v < 80000 ? new Date(Math.round((v - 25569) * 864e5)).toISOString().slice(0, 10) : null;
  const t = String(v).trim(); let m;
  if ((m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/))) { const y = m[3].length === 2 ? '20' + m[3] : m[3]; return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; }
  if ((m = t.match(/^(\d{1,2})\/(\d{4})$/))) return `${m[2]}-${m[1].padStart(2, '0')}-01`;
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
  return null;
}
// Colunas aceitas (planilha nova e antiga). A primeira que existir vale.
const COLS = {
  area: ['área', 'area'], setor: ['setor'], nome: ['equipamento / item', 'equipamento'], qtd: ['qtd', 'quantidade'],
  ultima: ['última preventiva grande', 'ultima preventiva'], obs: ['observação', 'observações'],
  tipo: ['tipo'], categoria: ['categoria'], fabricante: ['fabricante'], modelo: ['modelo'], serie: ['nº de série'],
  tensao: ['tensão (v)'], corrente: ['corrente nominal (a)'], tmin: ['temp. mínima (°c)'], tmax: ['temp. máxima (°c)'],
  utri: ['última trimestral'], usem: ['última semestral'], uanu: ['última anual']
};

export async function render(el) {
  await loadLibrary();
  let uid = S.unitId === 'ALL' ? (S.units.find(u => /riomar recife/i.test(u.nome))?.id || S.units[0]?.id) : S.unitId;
  let linhas = [], catsPlanilha = [], tabela = PALAVRAS;
  const pad = { congMin: -22, congMax: -18, resfMin: 0, resfMax: 5, tensao: 220 };
  const TIPOS = [...tiposBiblioteca(), ...TIPOS_SEM_PREVENTIVA];

  el.innerHTML = `
    <div class="page-head"><div><div class="eyebrow">Diretoria</div><h1 class="page-title">Importar planilha</h1></div></div>
    <div class="card">
      <p style="margin:0">Envie a planilha <b>Cadastro_Equipamentos</b> preenchida. O sistema reconhece o tipo e a categoria pelo nome de cada item; na conferência você troca o que precisar antes de importar. Itens que já existem na unidade (mesmo nome) são ignorados.</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end">
        <label class="field">Unidade de destino<select class="select" data-u>${S.units.map(u => `<option value="${u.id}" ${u.id === uid ? 'selected' : ''}>${esc(u.nome)}</option>`).join('')}</select></label>
        <label class="btn btn-navy">${icon('upload', 18)}Escolher planilha<input type="file" accept=".xlsx,.xls" data-file style="display:none"></label>
      </div>
      <div class="msg" data-msg></div>
    </div>
    <div data-prev></div>`;
  const prev = el.querySelector('[data-prev]'), msg = el.querySelector('[data-msg]');
  el.querySelector('[data-u]').onchange = e => { uid = e.target.value; if (linhas.length) validar(); };

  el.querySelector('[data-file]').onchange = async e => {
    const file = e.target.files[0]; e.target.value = '';
    if (!file) return;
    msg.textContent = '';
    try {
      const X = await loadXLSX();
      const wb = X.read(await file.arrayBuffer(), { type: 'array' });
      const ws = wb.Sheets['Equipamentos'];
      if (!ws) throw new Error('A planilha não tem a aba “Equipamentos”. Use o modelo enviado.');
      const rows = X.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });
      const hi = rows.findIndex(r => r.some(c => key(c).startsWith('equipamento')) && r.some(c => key(c) === 'setor'));
      if (hi < 0) throw new Error('Não encontrei o cabeçalho (Área, Setor, Equipamento…).');
      const H = rows[hi].map(key);
      const idx = Object.fromEntries(Object.entries(COLS).map(([k, nomes]) => [k, nomes.map(n => H.indexOf(key(n))).find(i => i >= 0) ?? -1]));
      const get = (r, k) => idx[k] < 0 ? '' : r[idx[k]];
      // Tabela de reconhecimento da própria planilha (se o diretor incluiu palavras novas)
      const wr = wb.Sheets['Reconhecimento'];
      if (wr) {
        const t = X.utils.sheet_to_json(wr, { header: 1, defval: '' }).slice(4).map(r => [norm(r[0]), norm(r[1]), norm(r[2])]).filter(r => r[0] && r[1]);
        if (t.length) tabela = t;
      }
      const wc = wb.Sheets['Categorias'];
      catsPlanilha = wc ? X.utils.sheet_to_json(wc, { header: 1, defval: '' }).slice(4).map(r => norm(r[0])).filter(Boolean) : [];
      linhas = [];
      rows.slice(hi + 1).forEach((r, k) => {
        const nome = norm(get(r, 'nome')), obs = norm(get(r, 'obs'));
        if (!nome || /^exemplo/i.test(obs)) return;
        const qtd = Math.max(1, Math.min(100, parseInt(get(r, 'qtd'), 10) || 1));
        const base = {
          n: hi + k + 2, area: norm(get(r, 'area')), setor: norm(get(r, 'setor')), obs,
          tipoPlanilha: norm(get(r, 'tipo')), catPlanilha: norm(get(r, 'categoria')),
          fabricante: norm(get(r, 'fabricante')), modelo: norm(get(r, 'modelo')), serie: norm(get(r, 'serie')),
          tensao: numOrNull(get(r, 'tensao')), corrente: numOrNull(get(r, 'corrente')), tmin: numOrNull(get(r, 'tmin')), tmax: numOrNull(get(r, 'tmax')),
          ultima: dataPlanilha(get(r, 'ultima')),
          ultimasCol: { TRIMESTRAL: dataPlanilha(get(r, 'utri')), SEMESTRAL: dataPlanilha(get(r, 'usem')), ANUAL: dataPlanilha(get(r, 'uanu')) }
        };
        for (let q = 1; q <= qtd; q++) {
          const l = { ...base, nome: qtd > 1 ? `${nome} ${String(q).padStart(2, '0')}` : nome };
          const rec = reconhecer(nome, tabela);
          const tp = TIPOS.find(t => key(t) === key(l.tipoPlanilha));
          l.tipo = tp || rec?.tipo || '';
          l.categoria = l.catPlanilha || rec?.categoria || '';
          l.auto = !tp && !!rec; l.semRec = !tp && !rec;
          linhas.push(l);
        }
      });
      if (!linhas.length) throw new Error('Nenhuma linha preenchida encontrada (as linhas de exemplo são ignoradas).');
      validar();
    } catch (err) { msg.textContent = errMsg(err); prev.innerHTML = ''; }
  };

  const temFaixa = (tipo, un) => rotinasDoTipo(tipo).some(r => S.lib.itens.some(i => i.rotina_id === r.id && i.ativo && i.faixa_equipamento && i.unidade_medida === un));
  function faixaTemp(l) {
    if (l.tmin !== null || l.tmax !== null) return { min: l.tmin, max: l.tmax, origem: 'planilha' };
    if (!temFaixa(l.tipo, '°C')) return null;
    return ehCongelado(l.nome) ? { min: pad.congMin, max: pad.congMax, origem: 'congelados' } : { min: pad.resfMin, max: pad.resfMax, origem: 'resfriados' };
  }
  const fmtNum = v => v === null || v === undefined ? '…' : String(v).replace('.', ',');

  function validar() {
    const existentes = new Set(S.base.equipamentos.filter(e => e.unidade_id === uid).map(e => key(e.nome)));
    const vistos = {}, hoje = todayISO();
    linhas.forEach(l => { vistos[key(l.nome)] = (vistos[key(l.nome)] || 0) + 1; });
    linhas.forEach(l => {
      l.erros = [];
      if (!l.area) l.erros.push('Área'); if (!l.setor) l.erros.push('Setor');
      if (!l.tipo) l.erros.push('Tipo'); if (!l.categoria) l.erros.push('Categoria');
      if (l.tmin !== null && l.tmax !== null && l.tmin > l.tmax) l.erros.push('Temp. mín > máx');
      if (l.ultima === null) l.erros.push('Data inválida');
      else if (l.ultima && l.ultima > hoje) l.erros.push('Data no futuro');
      if (vistos[key(l.nome)] > 1) l.erros.push('Nome repetido');
      l.existe = existentes.has(key(l.nome));
      // Última vez feita: coluna única vale para todas as rotinas longas; colunas antigas por frequência
      const freqs = [...new Set(rotinasDoTipo(l.tipo).map(r => r.frequencia))].filter(f => FREQ_LONGAS.includes(f));
      l.ultimas = {}; l.proximas = [];
      freqs.forEach(f => {
        const d = l.ultimasCol[f] || l.ultima;
        if (d && d <= hoje) { l.ultimas[f] = d; const px = proximaPelaUltima(d, f); l.proximas.push(`${FREQ[f]}: ${px.slice(0, 7) <= hoje.slice(0, 7) ? 'vencida, entra já' : monthLabel(px)}`); }
        else l.proximas.push(`${FREQ[f]}: entra já`);
      });
      l.faixa = faixaTemp(l);
    });
    const ok = linhas.filter(l => !l.erros.length && !l.existe), ruins = linhas.filter(l => l.erros.some(x => x !== 'Tipo' && x !== 'Categoria')), exist = linhas.filter(l => l.existe && !l.erros.length);
    const conferir = linhas.filter(l => l.semRec).length;
    const planos = ok.reduce((s, l) => s + rotinasDoTipo(l.tipo).length, 0);
    const refrig = ok.filter(l => l.faixa && l.faixa.origem !== 'planilha').length;
    const cats = [...new Set([...S.base.categorias.filter(c => c.unidade_id === uid).map(c => c.nome), ...catsPlanilha, ...linhas.map(l => l.categoria).filter(Boolean)])].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const optTipo = l => `<option value="">Escolha…</option>${[['Com preventiva', tiposBiblioteca()], ['Só chamados (sem preventiva)', TIPOS_SEM_PREVENTIVA]].map(([g, ts]) => `<optgroup label="${g}">${ts.map(t => `<option ${t === l.tipo ? 'selected' : ''}>${esc(t)}</option>`).join('')}</optgroup>`).join('')}`;
    const optCat = l => `<option value="">Escolha…</option>${cats.map(c => `<option ${c === l.categoria ? 'selected' : ''}>${esc(c)}</option>`).join('')}`;
    const ordem = l => (l.erros.length ? 0 : l.semRec ? 1 : l.existe ? 3 : 2);
    const lista = [...linhas].sort((a, b) => ordem(a) - ordem(b) || a.n - b.n);
    prev.innerHTML = `<div class="card">
      <div class="card-head"><h2 class="card-title">Conferência · ${esc(unitName(uid))}</h2>
        <button type="button" class="btn btn-primary" data-go ${ok.length ? '' : 'disabled'}>${icon('upload', 18)}Importar ${ok.length} item(ns)</button></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><span class="pill p-ok">${ok.length} prontos</span><span class="pill p-info">${planos} planos de preventiva</span>${conferir ? `<span class="pill p-warn">${conferir} não reconhecido(s): escolha o tipo</span>` : ''}${exist.length ? `<span class="pill p-gray">${exist.length} já existem (ignorados)</span>` : ''}${ruins.length ? `<span class="pill p-bad">${ruins.length} com pendência</span>` : ''}</div>
      ${refrig || ok.some(l => temFaixa(l.tipo, 'V')) ? `<div class="card" style="background:var(--bg,#F5F7FB);box-shadow:none;padding:14px;gap:10px">
        <b>Faixas padrão (ajuste depois na ficha de cada equipamento)</b>
        <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end">
          <label class="field" style="max-width:150px">Congelados mín. °C<input class="input" type="number" step="0.5" data-pad="congMin" value="${pad.congMin}"></label>
          <label class="field" style="max-width:150px">Congelados máx. °C<input class="input" type="number" step="0.5" data-pad="congMax" value="${pad.congMax}"></label>
          <label class="field" style="max-width:150px">Resfriados mín. °C<input class="input" type="number" step="0.5" data-pad="resfMin" value="${pad.resfMin}"></label>
          <label class="field" style="max-width:150px">Resfriados máx. °C<input class="input" type="number" step="0.5" data-pad="resfMax" value="${pad.resfMax}"></label>
          <label class="field" style="max-width:150px">Tensão da loja (V)<select class="select" data-pad="tensao">${[127, 220, 380].map(v => `<option ${v === pad.tensao ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        </div>
        <span class="small muted">Nome com “congel” ou “freezer” usa a faixa de congelados; os outros refrigerados, a de resfriados. Confirme os valores com a nutrição.</span>
      </div>` : ''}
      <div class="table-wrap"><table class="tbl"><thead><tr><th>Linha</th><th>Equipamento</th><th>Área › Setor</th><th>Tipo</th><th>Categoria</th><th>Preventivas e faixa</th><th>Situação</th></tr></thead><tbody>
        ${lista.map(l => { const i = linhas.indexOf(l), rs = rotinasDoTipo(l.tipo); return `<tr${l.semRec ? ' style="background:#FFF8E6"' : ''}><td class="muted">${l.n}</td><td class="t">${esc(l.nome)}</td><td>${esc(l.area || '—')} › ${esc(l.setor || '—')}</td>
          <td style="min-width:220px"><select class="select" data-tipo="${i}" aria-label="Tipo de ${esc(l.nome)}">${optTipo(l)}</select>${l.auto ? '<span class="sub">reconhecido pelo nome</span>' : ''}</td>
          <td style="min-width:170px"><select class="select" data-cat="${i}" aria-label="Categoria de ${esc(l.nome)}">${optCat(l)}</select></td>
          <td class="small">${rs.length ? `${[...new Set(rs.map(r => FREQ[r.frequencia]))].join(', ')}` : 'Só chamados'}${l.proximas.length ? `<span class="sub">${esc(l.proximas.join(' · '))}</span>` : ''}${l.faixa ? `<span class="sub">Temperatura ${fmtNum(l.faixa.min)} a ${fmtNum(l.faixa.max)} °C</span>` : ''}</td>
          <td>${l.erros.length ? (l.erros.every(x => x === 'Tipo' || x === 'Categoria') ? `<span class="pill p-warn">Escolha ${l.erros.length > 1 ? 'tipo e categoria' : l.erros[0].toLowerCase()}</span>` : `<span class="pill p-bad">Falta: ${esc(l.erros.join(', '))}</span>`) : l.existe ? '<span class="pill p-gray">Já existe</span>' : '<span class="pill p-ok">OK</span>'}</td></tr>`; }).join('')}
      </tbody></table></div>
      <div data-log class="small"></div>
    </div>`;
    prev.querySelectorAll('[data-tipo]').forEach(s => s.onchange = () => {
      const l = linhas[s.dataset.tipo]; l.tipo = s.value; l.auto = false; l.semRec = false;
      if (!l.categoria) { const r = reconhecer(l.tipo, tabela); if (r) l.categoria = r.categoria; }
      validar();
    });
    prev.querySelectorAll('[data-cat]').forEach(s => s.onchange = () => { linhas[s.dataset.cat].categoria = s.value; validar(); });
    prev.querySelectorAll('[data-pad]').forEach(inp => inp.onchange = () => { const v = Number(inp.value); if (!isNaN(v)) pad[inp.dataset.pad] = v; validar(); });
    prev.querySelector('[data-go]').onclick = ev => importar(ev.currentTarget, ok);
  }

  async function importar(btn, ok) {
    const log = prev.querySelector('[data-log]');
    const say = t => { log.innerHTML += `<div>${esc(t)}</div>`; };
    prev.querySelectorAll('select,input').forEach(x => { x.disabled = true; });
    await busy(btn, 'Importando…', async () => {
      try {
        // Categorias
        const catsUn = () => S.base.categorias.filter(c => c.unidade_id === uid);
        const precisa = [...new Set(ok.map(l => l.categoria))].filter(c => !catsUn().some(x => key(x.nome) === key(c)));
        if (precisa.length) { const r = await sb.from('categorias_manutencao').insert(precisa.map(nome => ({ unidade_id: uid, nome, ativo: true }))); if (r.error) throw r.error; say(`${precisa.length} categoria(s) criada(s).`); }
        // Áreas
        await loadBase();
        const areasUn = () => S.base.areas.filter(a => a.unidade_id === uid);
        const novasAreas = [...new Set(ok.map(l => l.area))].filter(a => !areasUn().some(x => key(x.nome) === key(a)));
        if (novasAreas.length) { const r = await sb.from('areas').insert(novasAreas.map(nome => ({ unidade_id: uid, nome, ativo: true }))); if (r.error) throw r.error; say(`${novasAreas.length} área(s) criada(s).`); await loadBase(); }
        // Setores (nome é único por unidade)
        const setUn = () => S.base.setores.filter(s => s.unidade_id === uid);
        const pares = [...new Map(ok.map(l => [key(l.setor), l])).values()];
        let ns = 0;
        for (const l of pares) {
          const area = areasUn().find(a => key(a.nome) === key(l.area));
          const s = setUn().find(x => key(x.nome) === key(l.setor));
          if (!s) { const r = await sb.from('setores').insert({ unidade_id: uid, area_id: area.id, nome: l.setor, ativo: true }); if (r.error) throw r.error; ns++; }
          else if (!s.area_id) await sb.from('setores').update({ area_id: area.id }).eq('id', s.id);
        }
        if (ns) say(`${ns} setor(es) criado(s).`);
        await loadBase();
        // Equipamentos
        let feitos = 0, falhas = 0, planos = 0;
        for (const l of ok) {
          try {
            const area = areasUn().find(a => key(a.nome) === key(l.area)), setor = setUn().find(s => key(s.nome) === key(l.setor));
            const cat = S.base.categorias.find(c => c.unidade_id === uid && key(c.nome) === key(l.categoria));
            const novo = await criarEquipamento(uid, { nome: l.nome, area_id: area.id, setor_id: setor.id, tipo_equipamento: l.tipo, categoria: cat?.nome || l.categoria, fabricante_texto: l.fabricante || null, numero: l.serie || null, observacoes: [l.modelo ? 'Modelo: ' + l.modelo : '', l.obs].filter(Boolean).join(' | ') || null }, { ultimas: l.ultimas });
            planos += novo.planos;
            await gravarFaixas(novo, l);
            feitos++;
          } catch (err) { falhas++; say(`Linha ${l.n} (${l.nome}): ${errMsg(err)}`); }
        }
        await loadBase();
        say(`Concluído: ${feitos} item(ns) cadastrado(s), ${planos} plano(s) de preventiva${falhas ? `, ${falhas} com erro` : ''}.`);
        toast(`${feitos} itens importados`);
        btn.remove();
      } catch (err) { say('Erro: ' + errMsg(err)); }
    });
  }

  async function gravarFaixas(novo, l) {
    const itens = rotinasDoTipo(l.tipo).flatMap(r => S.lib.itens.filter(i => i.rotina_id === r.id && i.faixa_equipamento && i.ativo));
    const rows = [];
    for (const i of itens) {
      let min = null, max = null, fonte = 'Planilha de cadastro';
      if (i.unidade_medida === '°C' && l.faixa) { min = l.faixa.min; max = l.faixa.max; if (l.faixa.origem !== 'planilha') fonte = `Padrão ${l.faixa.origem} (importação)`; }
      else if (i.unidade_medida === 'V') { const v = l.tensao || pad.tensao; min = Math.round(v * 0.9); max = Math.round(v * 1.1); if (!l.tensao) fonte = 'Tensão da loja (importação)'; }
      else if (i.unidade_medida === 'A' && l.corrente) { max = l.corrente; }
      if (min !== null || max !== null) rows.push({ equipamento_id: novo.id, unidade_id: novo.unidade_id, item_id: i.id, minimo: min, maximo: max, fonte });
    }
    if (rows.length) { const r = await sb.from('equipamento_faixas').insert(rows); if (r.error) throw r.error; }
  }
}
