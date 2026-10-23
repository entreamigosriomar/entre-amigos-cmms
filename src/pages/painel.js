// Painel da diretoria / gerência: cumprimento, atrasadas, OS e custo; por unidade e por família.
import { sb } from '../config/supabase.js';
import { S, situacao, isDone, rotina, FAMILIA, PRIO, OPEN_STATUS, unitName, unitIds, currentUnitName, eqName, codigoAg, diasAtraso, canSwitchUnits } from '../core/state.js';
import { esc, icon, todayISO, monthStart, monthLabel, moneyShort, pct, since, brDate, shiftMonth } from '../core/util.js';
import { agendamentosMes, osPeriodo } from '../core/data.js';
import { openOS, osTitle, osWhere, slaVencido } from '../core/os.js';
import { go, refresh } from '../core/nav.js';

export async function render(el, params) {
  const hoje = todayISO();
  const mes = params.mes || monthStart(hoje);
  const ids = unitIds();
  const [ags, os, custos] = await Promise.all([
    agendamentosMes(mes, ids),
    osPeriodo(mes, ids),
    sb.from('os_custos').select('valor,tipo,unidade_id,criado_em').in('unidade_id', ids).gte('criado_em', mes)
  ]);
  const sits = ags.map(a => ({ a, s: situacao(a, hoje) }));
  const validos = sits.filter(x => x.s !== 'CANCELADA');
  const feitas = validos.filter(x => isDone(x.a));
  const cumpr = validos.length ? feitas.length / validos.length * 100 : 0;
  const atrasadas = sits.filter(x => x.s === 'ATRASADA');
  const atrasCriticas = atrasadas.filter(x => ['GAS', 'INC'].includes(rotina(x.a.rotina_id)?.familia));
  const abertas = os.filter(o => OPEN_STATUS.includes(o.status));
  const criticas = abertas.filter(o => o.prioridade === 'CRITICA');
  const vencidas = abertas.filter(slaVencido);
  const custoOS = (custos.data || []).reduce((s, c) => s + Number(c.valor || 0), 0);
  const custoPrev = ags.reduce((s, a) => s + Number(a.custo_extra || 0), 0);
  const custoMat = (custos.data || []).filter(c => c.tipo === 'material').reduce((s, c) => s + Number(c.valor || 0), 0);
  const custoTot = custoOS + custoPrev;
  const chamadosMes = os.filter(o => o.origem === 'CHAMADO' && o.data_abertura >= mes);

  // Por unidade
  const porUnidade = (canSwitchUnits() && S.unitId === 'ALL' ? S.units : S.units.filter(u => ids.includes(u.id))).map(u => {
    const v = validos.filter(x => x.a.unidade_id === u.id), f = v.filter(x => isDone(x.a));
    return { u, prev: v.length, exec: f.length, p: v.length ? f.length / v.length * 100 : null };
  });

  // Precisa de providência
  const alertas = [];
  criticas.forEach(o => alertas.push({ tag: ['Crítica', 'p-bad'], t: osTitle(o), d: `OS ${o.numero} · ${osWhere(o)} · aberta há ${since(o.data_abertura)}`, u: o.unidade_id, os: o.id, w: 0 }));
  atrasCriticas.forEach(({ a }) => alertas.push({ tag: ['Crítica', 'p-bad'], t: `${rotina(a.rotina_id)?.nome || 'Preventiva'} não realizada`, d: `${codigoAg(a)} · ${eqName(a.equipamento_id)} · ${diasAtraso(a)} dias de atraso`, u: a.unidade_id, ag: a.id, w: 1 }));
  vencidas.filter(o => o.prioridade !== 'CRITICA').forEach(o => alertas.push({ tag: ['Prazo vencido', 'p-orange'], t: osTitle(o), d: `OS ${o.numero} · ${osWhere(o)} · prazo ${brDate(o.sla_limite)}`, u: o.unidade_id, os: o.id, w: 2 }));
  atrasadas.filter(x => !atrasCriticas.includes(x)).forEach(({ a }) => alertas.push({ tag: ['Atrasada', 'p-orange'], t: `${eqName(a.equipamento_id)} · ${rotina(a.rotina_id)?.nome || 'preventiva'}`, d: `${codigoAg(a)} · ${diasAtraso(a)} dias de atraso`, u: a.unidade_id, ag: a.id, w: 3 }));
  sits.filter(x => x.s === 'VALIDAR').forEach(({ a }) => alertas.push({ tag: ['Validar', 'p-violet'], t: `${eqName(a.equipamento_id)} · visita da terceirizada`, d: `${codigoAg(a)} · ${a.empresa_executora || ''} · aguardando validação`, u: a.unidade_id, sit: 'VALIDAR', w: 4 }));
  os.filter(o => o.confirmacao === 'REABERTO' && OPEN_STATUS.includes(o.status)).forEach(o => alertas.push({ tag: ['Reaberto', 'p-bad'], t: osTitle(o), d: `OS ${o.numero} · o líder não aprovou a solução`, u: o.unidade_id, os: o.id, w: 2 }));
  alertas.sort((a, b) => a.w - b.w);

  // Por família
  const fam = {};
  validos.forEach(({ a }) => { const k = rotina(a.rotina_id)?.familia || 'OUT'; fam[k] = fam[k] || { p: 0, e: 0 }; fam[k].p++; if (isDone(a)) fam[k].e++; });

  const isMesAtual = mes === monthStart(hoje);
  el.innerHTML = `
    <div class="page-head">
      <div><div class="eyebrow">Manutenção · ${monthLabel(mes)}</div><h1 class="page-title">${S.profile.role === 'GERENTE' ? 'Painel da unidade' : 'Painel da diretoria'}</h1></div>
      <div class="head-actions">
        <div class="seg"><button type="button" data-mes="${shiftMonth(mes, -1)}" aria-label="Mês anterior">${icon('esq', 18, 2.4)}</button><span>${monthLabel(mes)}</span><button type="button" data-mes="${shiftMonth(mes, 1)}" aria-label="Próximo mês" ${isMesAtual ? 'disabled' : ''}>${icon('dir', 18, 2.4)}</button></div>
        <a class="btn btn-primary" href="#/abrir">${icon('mais', 18, 2.4)}Abrir chamado</a>
      </div>
    </div>
    <section class="kpis" aria-label="Indicadores">
      <div class="kpi hero clickable" data-go="controle">
        <span class="lbl">Cumprimento das preventivas</span>
        <div style="display:flex;align-items:baseline;gap:8px"><span class="val">${pct(cumpr)}</span><span class="sub">meta 100%</span></div>
        <div class="bar"><i style="width:${Math.min(100, cumpr)}%"></i></div>
        <span class="sub">${feitas.length} de ${validos.length} executadas · ${esc(currentUnitName())}</span>
      </div>
      <div class="kpi clickable" data-go="controle" data-sit="ATRASADA"><span class="lbl">Preventivas atrasadas</span><span class="val" style="color:${atrasadas.length ? 'var(--bad)' : 'var(--navy)'}">${atrasadas.length}</span><span class="sub">${atrasCriticas.length} em gás ou incêndio</span></div>
      <div class="kpi clickable" data-go="ordens"><span class="lbl">Ordens de serviço abertas</span><span class="val">${abertas.length}</span><span class="sub"><b style="color:var(--bad)">${criticas.length} críticas</b> · ${vencidas.length} com prazo vencido · ${chamadosMes.length} chamados no mês</span></div>
      <div class="kpi"><span class="lbl">Custo de manutenção no mês</span><span class="val md">${moneyShort(custoTot)}</span><span class="sub">${custoTot ? `Material ${pct(custoMat / custoTot * 100)} · Terceiros ${pct((custoTot - custoMat) / custoTot * 100)}` : 'Nenhum custo lançado'}</span></div>
    </section>
    <div class="grid2">
      <section class="card" aria-labelledby="t-un">
        <div class="card-head"><h2 class="card-title" id="t-un">Cumprimento por unidade</h2><span class="small muted">executadas / previstas</span></div>
        <div class="unit-bars">${porUnidade.map(x => x.prev ? `<div class="unit-bar"><span style="font-weight:600">${esc(x.u.nome)}</span><div class="bar light"><i style="width:${x.p}%;background:${x.p >= 80 ? 'var(--navy)' : 'var(--orange)'}"></i></div><span class="pct" style="color:${x.p >= 80 ? 'var(--navy)' : 'var(--orange-ink)'}">${pct(x.p)} <span class="small muted" style="font-weight:400">${x.exec}/${x.prev}</span></span></div>`
          : `<div class="unit-bar"><span style="font-weight:600">${esc(x.u.nome)}</span><span class="small muted">sem planos de preventiva ainda</span><span></span></div>`).join('')}</div>
        <div class="small muted" style="display:flex;gap:16px;border-top:1px solid #EEF1F6;padding-top:12px"><span style="display:flex;align-items:center;gap:6px"><i class="dot" style="background:var(--navy)"></i>80% ou mais</span><span style="display:flex;align-items:center;gap:6px"><i class="dot" style="background:var(--orange)"></i>abaixo de 80%</span></div>
      </section>
      <section class="card wide" aria-labelledby="t-al">
        <div class="card-head"><h2 class="card-title" id="t-al">Precisa de providência</h2><a href="#/controle" class="small" style="font-weight:600">Ver controle mensal</a></div>
        ${alertas.length ? `<div class="rows">${alertas.slice(0, 8).map((x, i) => `<button type="button" class="row" data-al="${i}" style="background:none;border-left:0;border-right:0;border-bottom:0;text-align:left;cursor:pointer;width:100%;font:inherit;color:inherit"><span class="pill ${x.tag[1]}" style="justify-content:center">${x.tag[0]}</span><div><div class="t">${esc(x.t)}</div><div class="d">${esc(x.d)}</div></div><span class="small" style="font-weight:600;color:var(--navy)">${esc(unitName(x.u))}</span></button>`).join('')}</div>${alertas.length > 8 ? `<div class="small muted">e mais ${alertas.length - 8}.</div>` : ''}`
          : '<div class="empty">Nada pendente. Tudo em dia.</div>'}
      </section>
    </div>
    <section class="card" aria-labelledby="t-fam">
      <h2 class="card-title" id="t-fam">Preventivas do mês por família</h2>
      ${Object.keys(fam).length ? `<div class="fam-grid">${Object.entries(fam).sort((a, b) => b[1].p - a[1].p).map(([k, v]) => `<div class="fam"><span class="code">${k}</span><span style="font-weight:600">${FAMILIA[k] || k}</span><b>${pct(v.e / v.p * 100)}</b><span class="small muted">${v.e} de ${v.p}</span></div>`).join('')}</div>` : '<div class="empty">Sem preventivas previstas neste mês.</div>'}
    </section>`;

  el.querySelectorAll('[data-mes]').forEach(b => b.onclick = () => go('painel', { mes: b.dataset.mes }));
  el.querySelectorAll('[data-go]').forEach(k => k.onclick = () => go(k.dataset.go, k.dataset.sit ? { sit: k.dataset.sit, mes } : (k.dataset.go === 'controle' ? { mes } : {})));
  el.querySelectorAll('[data-al]').forEach(b => b.onclick = () => {
    const x = alertas[Number(b.dataset.al)];
    if (x.os) openOS(x.os, refresh);
    else if (x.ag) go('checklist', { id: x.ag });
    else go('controle', { sit: x.sit, mes });
  });
}
