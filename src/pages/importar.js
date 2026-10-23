// Importação da planilha de cadastro (Cadastro_Equipamentos_*.xlsx): áreas, setores, categorias, equipamentos, planos e faixas.
import { sb } from '../config/supabase.js';
import { S, unitName, tiposBiblioteca, TIPOS_SEM_PREVENTIVA, rotinasDoTipo, loadBase, loadLibrary, FREQ } from '../core/state.js';
import { esc, icon, toast, errMsg, busy, todayISO, monthLabel } from '../core/util.js';
import { proximaPelaUltima } from '../core/agenda.js';
import { criarEquipamento } from './equipamentos.js';

const XLSX_URL = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
function loadXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  return new Promise((ok, fail) => { const s = document.createElement('script'); s.src = XLSX_URL; s.onload = () => ok(window.XLSX); s.onerror = () => fail(new Error('Não foi possível carregar o leitor de planilhas. Verifique a internet.')); document.head.appendChild(s); });
}
const norm = s => String(s ?? '').trim();
// Data da planilha: número de série do Excel, dd/mm/aaaa ou aaaa-mm-dd → 'aaaa-mm-dd' ('' se vazio, null se inválida)
function dataPlanilha(v) {
  if (v === '' || v === null || v === undefined) return '';
  if (typeof v === 'number') return v > 20000 && v < 80000 ? new Date(Math.round((v - 25569) * 864e5)).toISOString().slice(0, 10) : null;
  const t = String(v).trim(); let m;
  if ((m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/))) { const y = m[3].length === 2 ? '20' + m[3] : m[3]; return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; }
  if ((m = t.match(/^(\d{1,2})\/(\d{4})$/))) return `${m[2]}-${m[1].padStart(2, '0')}-01`;
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
  return null;
}
const ULTIMAS = [['TRIMESTRAL', 'Última trimestral'], ['SEMESTRAL', 'Última semestral'], ['ANUAL', 'Última anual']];
const key = s => norm(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export async function render(el) {
  await loadLibrary();
  let uid = S.unitId === 'ALL' ? (S.units.find(u => /riomar recife/i.test(u.nome))?.id || S.units[0]?.id) : S.unitId;
  let linhas = [], cats = [];

  el.innerHTML = `
    <div class="page-head"><div><div class="eyebrow">Diretoria</div><h1 class="page-title">Importar planilha</h1></div></div>
    <div class="card">
      <p style="margin:0">Envie a planilha <b>Cadastro_Equipamentos</b> preenchida. O sistema cria as áreas, setores e categorias que faltarem, cadastra os equipamentos com TAG, cria os planos de preventiva pelo Tipo e grava as faixas informadas. Itens que já existem na unidade (mesmo nome) são ignorados.</p>
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
      const hi = rows.findIndex(r => r.some(c => key(c) === 'equipamento') && r.some(c => key(c) === 'tipo'));
      if (hi < 0) throw new Error('Não encontrei o cabeçalho (Área, Setor, Equipamento, Tipo…).');
      const H = rows[hi].map(key);
      const col = n => H.indexOf(key(n));
      const get = (r, n) => { const i = col(n); return i < 0 ? '' : r[i]; };
      linhas = rows.slice(hi + 1).map((r, k) => ({
        n: hi + k + 2, unidade: norm(get(r, 'Unidade')), area: norm(get(r, 'Área')), setor: norm(get(r, 'Setor')), nome: norm(get(r, 'Equipamento')),
        tipo: norm(get(r, 'Tipo')), categoria: norm(get(r, 'Categoria')), fabricante: norm(get(r, 'Fabricante')), modelo: norm(get(r, 'Modelo')),
        serie: norm(get(r, 'Nº de série')), tensao: get(r, 'Tensão (V)'), corrente: get(r, 'Corrente nominal (A)'),
        tmin: get(r, 'Temp. mínima (°C)'), tmax: get(r, 'Temp. máxima (°C)'), obs: norm(get(r, 'Observações')),
        ultimasRaw: Object.fromEntries(ULTIMAS.map(([f, h]) => [f, dataPlanilha(get(r, h))]))
      })).filter(l => l.nome && !/^exemplo/i.test(l.obs));
      const wc = wb.Sheets['Categorias'];
      cats = wc ? X.utils.sheet_to_json(wc, { header: 1, defval: '' }).slice(4).map(r => norm(r[0])).filter(Boolean) : [];
      if (!linhas.length) throw new Error('Nenhuma linha preenchida encontrada (as linhas de exemplo são ignoradas).');
      const nomeUn = linhas.find(l => l.unidade)?.unidade;
      const u = nomeUn && S.units.find(x => key(x.nome) === key(nomeUn));
      if (u) { uid = u.id; el.querySelector('[data-u]').value = uid; }
      validar();
    } catch (err) { msg.textContent = errMsg(err); prev.innerHTML = ''; }
  };

  function validar() {
    const tipos = new Set([...tiposBiblioteca(), ...TIPOS_SEM_PREVENTIVA].map(key));
    const existentes = new Set(S.base.equipamentos.filter(e => e.unidade_id === uid).map(e => key(e.nome)));
    const vistos = {};
    linhas.forEach(l => {
      l.erros = [];
      if (!l.area) l.erros.push('Área'); if (!l.setor) l.erros.push('Setor'); if (!l.tipo) l.erros.push('Tipo'); if (!l.categoria) l.erros.push('Categoria');
      if (l.tipo && !tipos.has(key(l.tipo))) l.erros.push('Tipo desconhecido');
      if (l.tmin !== '' && l.tmax !== '' && Number(l.tmin) > Number(l.tmax)) l.erros.push('Temp. mín > máx');
      const hoje = todayISO(), freqs = new Set(rotinasDoTipo(tiposBiblioteca().find(t => key(t) === key(l.tipo))).map(r => r.frequencia));
      l.ultimas = {}; l.proximas = [];
      ULTIMAS.forEach(([f, h]) => {
        const d = l.ultimasRaw[f];
        if (d === null) l.erros.push(h + ' inválida');
        else if (d && d > hoje) l.erros.push(h + ' no futuro');
        else if (d && freqs.has(f)) { l.ultimas[f] = d; const px = proximaPelaUltima(d, f); l.proximas.push(`${FREQ[f]}: ${px.slice(0, 7) <= hoje.slice(0, 7) ? 'vencida, entra já' : monthLabel(px)}`); }
        else if (freqs.has(f)) l.proximas.push(`${FREQ[f]}: sem data, entra já`);
      });
      vistos[key(l.nome)] = (vistos[key(l.nome)] || 0) + 1;
      l.existe = existentes.has(key(l.nome));
    });
    linhas.forEach(l => { if (vistos[key(l.nome)] > 1) l.erros.push('Nome repetido'); });
    const ok = linhas.filter(l => !l.erros.length && !l.existe), ruins = linhas.filter(l => l.erros.length), exist = linhas.filter(l => l.existe && !l.erros.length);
    const planos = ok.reduce((s, l) => s + rotinasDoTipo(tiposBiblioteca().find(t => key(t) === key(l.tipo))).length, 0);
    prev.innerHTML = `<div class="card">
      <div class="card-head"><h2 class="card-title">Conferência · ${esc(unitName(uid))}</h2>
        <button type="button" class="btn btn-primary" data-go ${ok.length ? '' : 'disabled'}>${icon('upload', 18)}Importar ${ok.length} item(ns)</button></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><span class="pill p-ok">${ok.length} prontos</span><span class="pill p-info">${planos} planos de preventiva</span>${exist.length ? `<span class="pill p-gray">${exist.length} já existem (ignorados)</span>` : ''}${ruins.length ? `<span class="pill p-bad">${ruins.length} com pendência</span>` : ''}</div>
      <div class="table-wrap"><table class="tbl"><thead><tr><th>Linha</th><th>Equipamento</th><th>Área › Setor</th><th>Tipo</th><th>Categoria</th><th>Próximas (longas)</th><th>Situação</th></tr></thead><tbody>
        ${linhas.map(l => `<tr><td class="muted">${l.n}</td><td class="t">${esc(l.nome)}</td><td>${esc(l.area)} › ${esc(l.setor)}</td><td>${esc(l.tipo)}</td><td>${esc(l.categoria)}</td><td class="small">${esc(l.proximas.join(' · ') || '—')}</td>
          <td>${l.erros.length ? `<span class="pill p-bad">Falta: ${esc(l.erros.join(', '))}</span>` : l.existe ? '<span class="pill p-gray">Já existe</span>' : '<span class="pill p-ok">OK</span>'}</td></tr>`).join('')}
      </tbody></table></div>
      <div data-log class="small"></div>
    </div>`;
    prev.querySelector('[data-go]').onclick = ev => importar(ev.currentTarget, ok);
  }

  async function importar(btn, ok) {
    const log = prev.querySelector('[data-log]');
    const say = t => { log.innerHTML += `<div>${esc(t)}</div>`; };
    await busy(btn, 'Importando…', async () => {
      try {
        // Categorias
        const catsUn = () => S.base.categorias.filter(c => c.unidade_id === uid);
        const precisa = [...new Set([...cats, ...ok.map(l => l.categoria)])].filter(c => !catsUn().some(x => key(x.nome) === key(c)));
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
            const tipo = [...tiposBiblioteca(), ...TIPOS_SEM_PREVENTIVA].find(t => key(t) === key(l.tipo));
            const cat = S.base.categorias.find(c => c.unidade_id === uid && key(c.nome) === key(l.categoria));
            const novo = await criarEquipamento(uid, { nome: l.nome, area_id: area.id, setor_id: setor.id, tipo_equipamento: tipo, categoria: cat?.nome || l.categoria, fabricante_texto: l.fabricante || null, numero: l.serie || null, observacoes: [l.modelo ? 'Modelo: ' + l.modelo : '', l.obs].filter(Boolean).join(' | ') || null }, { ultimas: l.ultimas });
            planos += novo.planos;
            await gravarFaixas(novo, tipo, l);
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

  async function gravarFaixas(novo, tipo, l) {
    const itens = rotinasDoTipo(tipo).flatMap(r => S.lib.itens.filter(i => i.rotina_id === r.id && i.faixa_equipamento && i.ativo));
    const n = v => v === '' || v === null || isNaN(Number(v)) ? null : Number(v);
    const rows = [];
    for (const i of itens) {
      let min = null, max = null;
      if (i.unidade_medida === '°C') { min = n(l.tmin); max = n(l.tmax); }
      else if (i.unidade_medida === 'V' && n(l.tensao)) { min = Math.round(n(l.tensao) * 0.9); max = Math.round(n(l.tensao) * 1.1); }
      else if (i.unidade_medida === 'A' && n(l.corrente)) { max = n(l.corrente); }
      if (min !== null || max !== null) rows.push({ equipamento_id: novo.id, unidade_id: novo.unidade_id, item_id: i.id, minimo: min, maximo: max, fonte: 'Planilha de cadastro' });
    }
    if (rows.length) { const r = await sb.from('equipamento_faixas').insert(rows); if (r.error) throw r.error; }
  }
}
