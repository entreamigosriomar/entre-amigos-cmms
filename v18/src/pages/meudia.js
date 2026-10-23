// Técnico: Meu dia — atrasadas primeiro, depois as de hoje e os chamados abertos, ordenados por prazo.
import { S, PRIO, OPEN_STATUS, eqName, resumoAg, codigoAg, checklistItens, diasAtraso, currentUnitName, personName } from '../core/state.js';
import { esc, icon, todayISO, weekdayLong, greeting, since, addDaysISO, brDate } from '../core/util.js';
import { agendamentosAte, osAbertas } from '../core/data.js';
import { openOS, osTitle, osWhere, slaVencido, statusPill } from '../core/os.js';
import { refresh } from '../core/nav.js';

export async function render(el) {
  const hoje = todayISO();
  const [prevs, os] = await Promise.all([agendamentosAte(addDaysISO(hoje, 2)), osAbertas()]);
  const minhas = os.filter(o => !o.tecnico_id || o.tecnico_id === S.user.id || S.profile.role !== 'TECNICO');
  const atrasadas = prevs.filter(a => a.data_programada < hoje);
  const doDia = prevs.filter(a => a.data_programada === hoje);
  const proximas = prevs.filter(a => a.data_programada > hoje);
  const ordem = o => [slaVencido(o) ? 0 : 1, -(PRIO[o.prioridade]?.[2] || 0), String(o.sla_limite || o.data_abertura)];
  const sortOS = (x, y) => { const a = ordem(x), b = ordem(y); return a[0] - b[0] || a[1] - b[1] || a[2].localeCompare(b[2]); };
  const emAndamento = minhas.filter(o => o.status !== 'ABERTA').sort(sortOS);
  const fila = minhas.filter(o => o.status === 'ABERTA').sort(sortOS);

  const prevCard = (a, destaque) => `<div class="task">
      <div class="task-top"><span class="code">${esc(codigoAg(a))}</span>${a.data_programada < hoje ? `<span class="pill p-bad">${diasAtraso(a)} ${diasAtraso(a) === 1 ? 'dia' : 'dias'} de atraso</span>` : a.data_programada === hoje ? '<span class="pill p-info">Hoje</span>' : `<span class="pill p-gray">${brDate(a.data_programada)}</span>`}</div>
      <div class="task-row"><div><div class="nm">${esc(eqName(a.equipamento_id))}</div><div class="d">${esc(resumoAg(a).replace(/^[A-Z0-9-]+ — /, ''))} · ${checklistItens(a).length} itens${a.tipo_execucao && a.tipo_execucao !== 'INTERNA' ? ' · terceirizada' : ''}</div></div>
      ${destaque ? '' : `<a class="icon-btn" href="#/checklist?id=${a.id}" aria-label="Abrir checklist" style="background:var(--navy);color:#fff;border:0">${icon('dir')}</a>`}</div>
      ${destaque ? `<a class="btn btn-primary btn-lg" href="#/checklist?id=${a.id}">${icon('play', 18)}Iniciar checklist</a>` : ''}
    </div>`;
  const osCard = o => { const p = PRIO[o.prioridade] || PRIO.MEDIA; return `<button type="button" class="task" data-os="${o.id}" style="text-align:left;cursor:pointer">
      <div class="task-top"><span class="mono muted">OS ${esc(o.numero)}${o.origem === 'CHAMADO' ? ' · chamado' : o.origem === 'PREVENTIVA' ? ' · NC de preventiva' : ''}</span><span class="pill ${p[1]}">${p[0]}</span></div>
      <div class="nm">${esc(osTitle(o))}</div>
      <div class="d">${esc(osWhere(o))} · aberto há ${since(o.data_abertura)}${o.origem === 'CHAMADO' ? ' por ' + esc(personName(o.solicitante_id)) : ''}${slaVencido(o) ? ' · <b style="color:var(--bad)">prazo vencido</b>' : ''}</div>
      ${o.status !== 'ABERTA' ? `<div>${statusPill(o.status)}</div>` : ''}
    </button>`; };

  el.innerHTML = `<div class="mobile-page">
    <div class="m-hero">
      <div><div class="when">${esc(weekdayLong(hoje))} · ${esc(currentUnitName())}</div><div class="hi">${greeting()}, ${esc(S.profile.nome.split(' ')[0])}</div></div>
      <div class="m-stats">
        <div class="m-stat ${atrasadas.length ? 'alert' : ''}"><b>${atrasadas.length}</b><span>atrasadas</span></div>
        <div class="m-stat"><b>${doDia.length}</b><span>para hoje</span></div>
        <div class="m-stat ${minhas.some(slaVencido) ? 'alert' : ''}"><b>${minhas.length}</b><span>OS abertas</span></div>
      </div>
    </div>
    ${atrasadas.length ? `<div class="sec-title bad">Preventivas atrasadas</div>${atrasadas.map((a, i) => prevCard(a, i === 0)).join('')}` : ''}
    <div class="sec-title">Preventivas de hoje</div>
    ${doDia.length ? doDia.map((a, i) => prevCard(a, !atrasadas.length && i === 0)).join('') : '<div class="empty">Nenhuma preventiva para hoje.</div>'}
    ${emAndamento.length ? `<div class="sec-title">Em andamento</div>${emAndamento.map(osCard).join('')}` : ''}
    <div class="sec-title">Chamados e OS na fila</div>
    ${fila.length ? fila.map(osCard).join('') : '<div class="empty">Nenhuma OS na fila.</div>'}
    ${proximas.length ? `<div class="sec-title">Próximos dias</div>${proximas.map(a => prevCard(a, false)).join('')}` : ''}
    <div style="height:70px"></div>
  </div>
  <a class="fab" href="#/abrir">${icon('mais', 22, 2.6)}Abrir chamado</a>`;
  el.querySelectorAll('[data-os]').forEach(b => b.onclick = () => openOS(b.dataset.os, refresh));
}
