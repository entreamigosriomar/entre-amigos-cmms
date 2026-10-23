// Ordens de serviço: fila com filtros, ficha e ações.
import { S, OS_STATUS, OPEN_STATUS, PRIO, unitName, currentUnitName, eq, personName } from '../core/state.js';
import { esc, icon, since, brDate, addDaysISO, todayISO } from '../core/util.js';
import { osPeriodo } from '../core/data.js';
import { openOS, osTitle, osWhere, statusPill, prioPill, slaVencido, ORIGEM } from '../core/os.js';
import { refresh } from '../core/nav.js';

export async function render(el, params) {
  const lista = await osPeriodo(addDaysISO(todayISO(), -60));
  const f = { sit: params.sit || 'abertas', prio: '', origem: '', cat: '', q: '' };
  const cats = [...new Set(lista.map(o => o.categoria).filter(Boolean))].sort();

  const filtrar = () => lista.filter(o =>
    (f.sit === 'abertas' ? OPEN_STATUS.includes(o.status) : f.sit === 'todas' ? true : f.sit === 'vencidas' ? slaVencido(o) : o.status === f.sit) &&
    (!f.prio || o.prioridade === f.prio) && (!f.origem || o.origem === f.origem) && (!f.cat || o.categoria === f.cat) &&
    (!f.q || `${o.numero} ${osTitle(o)} ${osWhere(o)} ${o.descricao}`.toLowerCase().includes(f.q.toLowerCase()))
  ).sort((a, b) => (OPEN_STATUS.includes(b.status) - OPEN_STATUS.includes(a.status)) || (PRIO[b.prioridade]?.[2] || 0) - (PRIO[a.prioridade]?.[2] || 0) || String(a.sla_limite).localeCompare(String(b.sla_limite)));

  const abertas = lista.filter(o => OPEN_STATUS.includes(o.status));
  const kpis = [
    ['abertas', 'Abertas', abertas.length, 'var(--navy)'],
    ['vencidas', 'Prazo vencido', abertas.filter(slaVencido).length, 'var(--bad)'],
    ['AGUARDANDO_PECA', 'Aguardando peça', abertas.filter(o => o.status === 'AGUARDANDO_PECA').length, 'var(--warn)'],
    ['CONCLUIDA', 'Concluídas (60 dias)', lista.filter(o => o.status === 'CONCLUIDA').length, 'var(--ok)']
  ];

  function rows() {
    const l = filtrar();
    if (!l.length) return '<div class="empty">Nenhuma OS com esses filtros.</div>';
    return `<div class="table-wrap"><table class="tbl"><thead><tr><th>OS</th><th>Problema</th><th>Item / local</th>${S.unitId === 'ALL' ? '<th>Unidade</th>' : ''}<th>Prioridade</th><th>Situação</th><th>Prazo</th><th>Técnico</th></tr></thead><tbody>
      ${l.map(o => `<tr data-os="${o.id}" style="cursor:pointer">
        <td class="t mono">${esc(o.numero)}</td>
        <td><span class="t">${esc(osTitle(o))}</span><span class="sub">${(ORIGEM[o.origem] || ORIGEM.INTERNA)[0]} · ${esc(personName(o.solicitante_id))} · há ${since(o.data_abertura)}</span></td>
        <td>${esc(osWhere(o))}<span class="sub">${esc(o.categoria || '')}${eq(o.equipamento_id)?.tag ? ' · ' + esc(eq(o.equipamento_id).tag) : ''}</span></td>
        ${S.unitId === 'ALL' ? `<td>${esc(unitName(o.unidade_id))}</td>` : ''}
        <td>${prioPill(o.prioridade)}</td>
        <td>${statusPill(o.status)}${o.confirmacao === 'PENDENTE' ? '<span class="sub">aguardando líder</span>' : ''}</td>
        <td>${o.sla_limite ? (slaVencido(o) ? `<span class="pill p-bad">${brDate(o.sla_limite)}</span>` : brDate(o.sla_limite)) : '—'}</td>
        <td>${esc(personName(o.tecnico_id))}</td>
      </tr>`).join('')}</tbody></table></div>`;
  }

  el.innerHTML = `
    <div class="page-head">
      <div><div class="eyebrow">${esc(currentUnitName())}</div><h1 class="page-title">Ordens de serviço</h1></div>
      <div class="head-actions"><a class="btn btn-primary" href="#/abrir">${icon('mais', 18, 2.4)}Abrir chamado</a></div>
    </div>
    <div class="summary"><div class="minis" style="grid-template-columns:repeat(4,minmax(0,1fr));flex:1 1 100%">
      ${kpis.map(([k, n, v, c]) => `<button type="button" class="mini ${f.sit === k ? 'on' : ''}" data-sit="${k}"><span class="lbl"><i class="dot" style="background:${c}"></i>${n}</span><span class="val" style="color:${c}">${v}</span></button>`).join('')}
    </div></div>
    <div class="card">
      <div style="display:flex;flex-wrap:wrap;gap:10px">
        <input class="input" data-q placeholder="Buscar por número, problema ou item" style="flex:2 1 240px">
        <select class="select" data-f="sit" style="flex:1 1 160px"><option value="abertas">Abertas</option><option value="todas">Todas</option><option value="vencidas">Prazo vencido</option>${Object.entries(OS_STATUS).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select>
        <select class="select" data-f="prio" style="flex:1 1 140px"><option value="">Todas as prioridades</option>${Object.entries(PRIO).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select>
        <select class="select" data-f="origem" style="flex:1 1 140px"><option value="">Todas as origens</option>${Object.entries(ORIGEM).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select>
        <select class="select" data-f="cat" style="flex:1 1 160px"><option value="">Todas as categorias</option>${cats.map(c => `<option>${esc(c)}</option>`).join('')}</select>
      </div>
      <div data-list>${rows()}</div>
    </div>`;
  const list = el.querySelector('[data-list]');
  const redraw = () => { list.innerHTML = rows(); bindRows(); el.querySelectorAll('[data-sit]').forEach(b => b.classList.toggle('on', b.dataset.sit === f.sit)); };
  const bindRows = () => list.querySelectorAll('[data-os]').forEach(r => r.onclick = () => openOS(r.dataset.os, refresh));
  el.querySelector('[data-f="sit"]').value = f.sit;
  el.querySelectorAll('[data-f]').forEach(s => s.onchange = () => { f[s.dataset.f] = s.value; redraw(); });
  el.querySelector('[data-q]').oninput = e => { f.q = e.target.value; redraw(); };
  el.querySelectorAll('[data-sit]').forEach(b => b.onclick = () => { f.sit = b.dataset.sit; el.querySelector('[data-f="sit"]').value = f.sit; redraw(); });
  bindRows();
  if (params.os) openOS(params.os, refresh);
}
