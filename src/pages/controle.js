// Controle mensal de preventivas: previsto × executado, linha do mês, tabela com ações.
import { sb } from '../config/supabase.js';
import { S, SITUACAO, EXEC, situacao, isDone, eq, eqName, codigoAg, resumoAg, personName, unitName, currentUnitName, isGestao, isDiretoria, canExecute, unitIds, checklistItens, CRIT } from '../core/state.js';
import { distribuirPlanos } from '../core/distribuir.js';
import { esc, icon, todayISO, monthStart, monthEnd, shiftMonth, monthLabel, brDate, brDateFull, brDateTime, toast, errMsg, busy, openModal, modalHead, closeModal, money, num, pct, confirmDialog } from '../core/util.js';
import { agendamentosMes, atualizarAgendamento } from '../core/data.js';
import { galleryHTML } from '../core/photos.js';
import { go, refresh } from '../core/nav.js';

export async function render(el, params) {
  const mes = params.mes || monthStart(todayISO());
  const hoje = todayISO();
  const desde = shiftMonth(mes, -5);
  const [ags, hist] = await Promise.all([
    agendamentosMes(mes),
    sb.from('preventivas_agendamentos').select('data_programada,status,tipo_execucao,executado_em').in('unidade_id', unitIds())
      .gte('data_programada', desde).lte('data_programada', monthEnd(mes)).then(r => r.data || [])
  ]);
  const f = { sit: params.sit || '', exec: '', q: '', dia: '' };
  const sits = ags.map(a => ({ a, s: situacao(a, hoje) }));
  const validos = sits.filter(x => x.s !== 'CANCELADA');
  const feitas = validos.filter(x => isDone(x.a));
  const cnt = k => sits.filter(x => x.s === k).length;
  const cumpr = validos.length ? feitas.length / validos.length * 100 : 0;
  const diasRest = mes === monthStart(hoje) ? Math.max(0, Number(monthEnd(mes).slice(8)) - Number(hoje.slice(8))) : null;
  const custo = ags.reduce((s, a) => s + Number(a.custo_extra || 0), 0);

  // próxima data por plano (para a coluna Próxima)
  const proxPorPlano = {};
  [...ags].sort((x, y) => x.data_programada.localeCompare(y.data_programada)).forEach(a => {
    if (a.plano_id && a.status !== 'CONCLUIDA' && a.status !== 'CANCELADA' && a.data_programada >= hoje && !proxPorPlano[a.plano_id]) proxPorPlano[a.plano_id] = a.data_programada;
  });

  const lista = () => sits.filter(({ a, s }) =>
    (!f.sit || s === f.sit || (f.sit === 'TERC' && a.tipo_execucao !== 'INTERNA')) &&
    (!f.exec || a.tipo_execucao === f.exec) && (!f.dia || a.data_programada === f.dia) &&
    (!f.q || `${eqName(a.equipamento_id)} ${codigoAg(a)} ${resumoAg(a)} ${eq(a.equipamento_id)?.tag || ''}`.toLowerCase().includes(f.q.toLowerCase()))
  ).sort((x, y) => {
    const ord = { ATRASADA: 0, VALIDAR: 1, PENDENTE: 2, CONCLUIDA_NC: 3, CONCLUIDA: 4, CANCELADA: 5 };
    return ord[x.s] - ord[y.s] || x.a.data_programada.localeCompare(y.a.data_programada);
  });

  const acao = ({ a, s }) => {
    if (s === 'ATRASADA' || s === 'PENDENTE') {
      const b = canExecute() ? `<a class="btn ${s === 'ATRASADA' ? 'btn-primary' : 'btn-light'} btn-sm" href="#/checklist?id=${a.id}">Executar</a>` : '';
      return b + (isGestao() ? ` <button type="button" class="btn btn-ghost btn-sm" data-more="${a.id}" aria-label="Mais ações">•••</button>` : '');
    }
    if (s === 'VALIDAR') return isGestao() ? `<button type="button" class="btn btn-primary btn-sm" data-validar="${a.id}">Validar</button>` : `<button type="button" class="btn btn-light btn-sm" data-ver="${a.id}">Ver</button>`;
    return `<button type="button" class="btn btn-light btn-sm" data-ver="${a.id}">Ver</button>`;
  };

  function tabela() {
    const l = lista();
    if (!l.length) return `<div class="empty">${ags.length ? 'Nenhuma preventiva com esses filtros.' : 'Nenhuma preventiva prevista neste mês. Cadastre planos nos equipamentos ou importe a planilha.'}</div>`;
    return `<div class="table-wrap"><table class="tbl"><thead><tr><th>Data</th><th>Equipamento</th><th>Rotina</th>${S.unitId === 'ALL' ? '<th>Unidade</th>' : ''}<th>Executor</th><th>Responsável</th><th>Situação</th><th>Próxima</th><th><span class="sr">Ação</span></th></tr></thead><tbody>
      ${l.map(x => { const a = x.a, sit = SITUACAO[x.s]; return `<tr>
        <td class="t">${brDate(a.data_programada)}${a.reprogramado_de ? `<span class="sub">era ${brDate(a.reprogramado_de)}</span>` : ''}</td>
        <td><span class="t">${esc(eqName(a.equipamento_id))}</span><span class="sub mono">${esc(eq(a.equipamento_id)?.tag || '')}</span></td>
        <td>${esc(resumoAg(a).replace(/^[A-Z0-9-]+ — /, ''))}<span class="sub code">${esc(codigoAg(a))}</span></td>
        ${S.unitId === 'ALL' ? `<td>${esc(unitName(a.unidade_id))}</td>` : ''}
        <td>${esc(a.tipo_execucao === 'INTERNA' ? 'Equipe' : (a.empresa_executora || EXEC[a.tipo_execucao]))}</td>
        <td>${esc(personName(a.responsavel_id || a.executado_por))}</td>
        <td><span class="pill ${sit[1]}">${sit[0]}</span></td>
        <td class="muted">${a.plano_id && proxPorPlano[a.plano_id] && proxPorPlano[a.plano_id] !== a.data_programada ? brDate(proxPorPlano[a.plano_id]) : '—'}</td>
        <td style="text-align:right;white-space:nowrap">${acao(x)}</td></tr>`; }).join('')}
    </tbody></table></div>`;
  }

  // Calendário do mês (segunda a domingo)
  const lastDay = Number(monthEnd(mes).slice(8));
  const isMesAtual = mes === monthStart(hoje);
  const porData = {};
  sits.forEach(x => { (porData[x.a.data_programada] ||= []).push(x); });
  const offset = (new Date(mes + 'T12:00:00').getDay() + 6) % 7;
  const ORD = ['ATRASADA', 'VALIDAR', 'PENDENTE', 'CONCLUIDA_NC', 'CONCLUIDA', 'CANCELADA'];
  const celula = d => {
    const iso = mes.slice(0, 8) + String(d).padStart(2, '0'), l = (porData[iso] || []).filter(x => x.s !== 'CANCELADA');
    const eqp = l.filter(x => x.a.tipo_execucao === 'INTERNA').length, ter = l.length - eqp;
    const atr = l.filter(x => x.s === 'ATRASADA').length, ok = l.filter(x => ['CONCLUIDA', 'CONCLUIDA_NC', 'VALIDAR'].includes(x.s)).length;
    const dom = (offset + d - 1) % 7 === 6;
    const barra = l.length ? `<span class="cal-bar">${ORD.filter(k => k !== 'CANCELADA').map(k => { const n = l.filter(x => x.s === k).length; return n ? `<i style="flex:${n};background:${SITUACAO[k][2]}"></i>` : ''; }).join('')}</span>` : '';
    return `<button type="button" class="cal-d${iso === hoje ? ' hoje' : ''}${dom ? ' dom' : ''}${f.dia === iso ? ' on' : ''}${l.length ? '' : ' vazio'}" data-dia="${iso}" ${l.length ? '' : 'tabindex="-1"'} aria-label="${d}: ${l.length} preventiva(s)">
      <span class="cal-n">${d}</span>
      ${l.length ? `<span class="cal-c">${eqp ? `<span class="cal-e" title="Equipe da loja">${icon('chave', 12)}${eqp}</span>` : ''}${ter ? `<span class="cal-t" title="Terceirizada">${icon('maleta', 12)}${ter}</span>` : ''}</span>
        <span class="cal-s">${atr ? `<b style="color:var(--bad)">${atr} atrasada${atr > 1 ? 's' : ''}</b>` : ok === l.length ? '<b style="color:var(--ok)">feito</b>' : `${ok}/${l.length}`}</span>${barra}` : ''}
    </button>`;
  };
  const calendario = `<div class="cal" role="grid">${['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => `<span class="cal-h">${d}</span>`).join('')}${'<span></span>'.repeat(offset)}${Array.from({ length: lastDay }, (_, i) => celula(i + 1)).join('')}</div>`;

  // Equipe × terceirizada (mês)
  const grupoExec = a => a.tipo_execucao === 'INTERNA' ? 'EQ' : 'TE';
  const exec = ['EQ', 'TE'].map(g => {
    const l = sits.filter(x => grupoExec(x.a) === g && x.s !== 'CANCELADA');
    const feitas = l.filter(x => isDone(x.a)), noPrazo = feitas.filter(x => String(x.a.executado_em || '').slice(0, 10) <= x.a.data_programada);
    return { g, nome: g === 'EQ' ? 'Equipe da loja' : 'Terceirizadas', total: l.length, feitas: feitas.length, noPrazo: noPrazo.length,
      atr: l.filter(x => x.s === 'ATRASADA').length, val: l.filter(x => x.s === 'VALIDAR').length, nc: l.filter(x => x.s === 'CONCLUIDA_NC').length };
  });
  const execCard = `<div class="exec-grid">${exec.map(x => { const p = x.total ? x.feitas / x.total * 100 : 0; return `<div class="exec">
      <div class="exec-top"><span class="exec-ic ${x.g}">${icon(x.g === 'EQ' ? 'chave' : 'maleta', 18)}</span><b>${x.nome}</b><span class="exec-pct">${x.total ? pct(p) : '—'}</span></div>
      <div class="bar"><i style="width:${p}%;background:${x.g === 'EQ' ? 'var(--orange)' : 'var(--navy)'}"></i></div>
      <div class="exec-n"><span><b>${x.feitas}</b> de ${x.total} feitas</span><span><b>${x.feitas ? pct(x.noPrazo / x.feitas * 100) : '—'}</b> no prazo</span><span style="color:${x.atr ? 'var(--bad)' : 'inherit'}"><b>${x.atr}</b> atrasadas</span>${x.g === 'TE' ? `<span><b>${x.val}</b> a validar</span>` : `<span><b>${x.nc}</b> com NC</span>`}</div>
    </div>`; }).join('')}</div>`;

  // Últimos 6 meses
  const meses = Array.from({ length: 6 }, (_, i) => shiftMonth(desde, i));
  const serie = meses.map(m => { const l = hist.filter(a => a.data_programada.slice(0, 7) === m.slice(0, 7) && a.status !== 'CANCELADA');
    const v = g => { const x = l.filter(a => grupoExec(a) === g), ok = x.filter(a => a.status === 'CONCLUIDA').length; return x.length ? { p: ok / x.length * 100, n: x.length } : null; };
    return { m, EQ: v('EQ'), TE: v('TE') }; });
  const temHist = serie.some(x => x.EQ || x.TE);
  const barraMes = (v, cls) => v ? `<div class="tr-b ${cls}" style="height:${Math.max(3, v.p)}%"><span>${Math.round(v.p)}%</span></div>` : `<div class="tr-b vazio"><span>—</span></div>`;
  const tendencia = temHist ? `<div class="trend">${serie.map(x => `<div class="tr-m${x.m === mes ? ' atual' : ''}"><div class="tr-bars">${barraMes(x.EQ, 'EQ')}${barraMes(x.TE, 'TE')}</div><span class="tr-l">${monthLabel(x.m).slice(0, 3)}/${x.m.slice(2, 4)}</span></div>`).join('')}</div>
    <div class="small muted" style="display:flex;gap:14px;flex-wrap:wrap"><span><i class="dot" style="background:var(--orange)"></i> Equipe da loja</span><span><i class="dot" style="background:var(--navy)"></i> Terceirizadas</span><span>% concluído no mês</span></div>`
    : '<div class="empty">O histórico aparece aqui a partir do primeiro mês com preventivas.</div>';

  const minis = [['', 'Previstas', validos.length, 'var(--navy)'], ['CONCLUIDA', 'Concluídas', cnt('CONCLUIDA') + cnt('VALIDAR'), 'var(--ok)'], ['CONCLUIDA_NC', 'Com NC', cnt('CONCLUIDA_NC'), 'var(--warn)'], ['ATRASADA', 'Atrasadas', cnt('ATRASADA'), 'var(--bad)'], ['PENDENTE', 'Pendentes', cnt('PENDENTE'), 'var(--info)']];

  el.innerHTML = `
    <div class="page-head">
      <div><div class="eyebrow">Preventivas · ${esc(currentUnitName())}</div><h1 class="page-title">Controle mensal</h1></div>
      <div class="head-actions">
        <div class="seg"><button type="button" data-mes="${shiftMonth(mes, -1)}" aria-label="Mês anterior">${icon('esq', 18, 2.4)}</button><span>${monthLabel(mes)}</span><button type="button" data-mes="${shiftMonth(mes, 1)}" aria-label="Próximo mês">${icon('dir', 18, 2.4)}</button></div>
        ${isDiretoria() ? `<button type="button" class="btn btn-light" data-distribuir>${icon('painel', 18)}Distribuir no mês</button>` : ''}
        ${isGestao() ? `<button type="button" class="btn btn-light" data-gerar>${icon('calendario', 18)}Gerar preventivas do mês</button>` : ''}
        <button type="button" class="btn btn-light" onclick="window.print()">${icon('imprimir', 18)}Imprimir / PDF</button>
      </div>
    </div>
    <section class="summary" aria-label="Resumo do mês">
      <div class="kpi hero">
        <div class="ring" style="background:conic-gradient(var(--orange) 0 ${cumpr}%, var(--navy-3) ${cumpr}% 100%)"><div>${pct(cumpr)}</div></div>
        <div style="display:flex;flex-direction:column;gap:6px"><span class="lbl">Cumprimento do mês</span><span style="font-size:20px;font-weight:700">${feitas.length} de ${validos.length}</span><span class="sub">Meta 100%${diasRest !== null ? ` · faltam ${diasRest} dias` : ''}${custo ? ` · terceiros ${money(custo)}` : ''}</span></div>
      </div>
      <div class="minis">${minis.map(([k, n, v, c]) => `<button type="button" class="mini ${f.sit === k && k ? 'on' : ''}" data-sit="${k}"><span class="lbl"><i class="dot" style="background:${c}"></i>${n}</span><span class="val" style="color:${c}">${v}</span></button>`).join('')}</div>
    </section>
    <section class="card">
      <div class="card-head"><h2 class="card-title" style="font-size:16px">Calendário de ${monthLabel(mes).split(' ')[0].toLowerCase()}</h2>
        <div class="small muted" style="display:flex;gap:12px;flex-wrap:wrap;align-items:center"><span class="cal-e">${icon('chave', 12)}equipe</span><span class="cal-t">${icon('maleta', 12)}terceirizada</span>${['CONCLUIDA', 'VALIDAR', 'ATRASADA', 'PENDENTE'].map(k => `<span style="display:flex;align-items:center;gap:5px"><i class="dot" style="background:${SITUACAO[k][2]}"></i>${SITUACAO[k][0]}</span>`).join('')}</div></div>
      ${calendario}
      <span class="small muted">Toque em um dia para ver as preventivas dele na lista.</span>
    </section>
    <section class="two-col">
      <div class="card"><h2 class="card-title" style="font-size:16px">Equipe × terceirizadas · ${monthLabel(mes).split(' ')[0].toLowerCase()}</h2>${execCard}</div>
      <div class="card"><h2 class="card-title" style="font-size:16px">Cumprimento nos últimos 6 meses</h2>${tendencia}</div>
    </section>
    <section class="card">
      <div class="card-head"><h2 class="card-title" data-titulo>Preventivas de ${monthLabel(mes).split(' ')[0].toLowerCase()}</h2>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <input class="input" data-q placeholder="Buscar equipamento, TAG ou rotina" style="min-width:220px;width:auto">
          <select class="select" data-exec style="width:auto"><option value="">Todos os executores</option>${Object.entries(EXEC).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
          <select class="select" data-fsit style="width:auto"><option value="">Todas as situações</option>${Object.entries(SITUACAO).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select>
        </div></div>
      <div data-tab>${tabela()}</div>
    </section>`;

  const tab = el.querySelector('[data-tab]');
  const redraw = () => {
    tab.innerHTML = tabela(); bindTab();
    el.querySelectorAll('[data-dia]').forEach(b => b.classList.toggle('on', b.dataset.dia === f.dia));
    el.querySelector('[data-titulo]').innerHTML = f.dia ? `Preventivas de ${brDateFull(f.dia)} <button type="button" class="btn btn-ghost btn-sm" data-limpar-dia>Ver o mês todo</button>` : `Preventivas de ${monthLabel(mes).split(' ')[0].toLowerCase()}`;
    el.querySelector('[data-limpar-dia]')?.addEventListener('click', () => { f.dia = ''; redraw(); }); el.querySelectorAll('[data-sit]').forEach(b => b.classList.toggle('on', !!f.sit && b.dataset.sit === f.sit)); el.querySelector('[data-fsit]').value = f.sit; };
  el.querySelectorAll('[data-mes]').forEach(b => b.onclick = () => go('controle', { mes: b.dataset.mes }));
  el.querySelectorAll('[data-dia]').forEach(b => b.onclick = () => { if (b.classList.contains('vazio')) return; f.dia = f.dia === b.dataset.dia ? '' : b.dataset.dia; redraw(); tab.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  el.querySelector('[data-distribuir]')?.addEventListener('click', async e => {
    const btn = e.currentTarget;
    if (S.unitId === 'ALL') return toast('Escolha uma unidade no menu para distribuir as preventivas.', 'bad');
    if (!(await confirmDialog('Distribuir as preventivas no mês?', 'As preventivas mensais, trimestrais, semestrais e anuais desta unidade são espalhadas entre os dias 3 e 26: a equipe faz um setor por dia e cada terceirizada vem uma vez só. As preventivas já geradas e ainda não feitas mudam para o novo dia. As semanais continuam no dia da semana.', 'Distribuir'))) return;
    busy(btn, 'Distribuindo…', async () => {
      try { const r = await distribuirPlanos(S.unitId, t => { btn.textContent = t; }); toast(`${r.planos} planos distribuídos em ${r.grupos} grupos · ${r.movidas} preventiva(s) mudaram de dia`); refresh(); }
      catch (err) { toast(errMsg(err), 'bad'); }
    });
  });
  el.querySelectorAll('[data-sit]').forEach(b => b.onclick = () => { f.sit = f.sit === b.dataset.sit ? '' : b.dataset.sit; redraw(); });
  el.querySelector('[data-fsit]').onchange = e => { f.sit = e.target.value; redraw(); };
  el.querySelector('[data-exec]').onchange = e => { f.exec = e.target.value; redraw(); };
  el.querySelector('[data-q]').oninput = e => { f.q = e.target.value; redraw(); };
  el.querySelector('[data-gerar]')?.addEventListener('click', e => busy(e.currentTarget, 'Gerando…', async () => {
    let n = 0;
    for (const uid of unitIds()) { const { data, error } = await sb.rpc('gerar_preventivas_mes', { p_unidade_id: uid, p_mes: mes }); if (error) { toast(errMsg(error), 'bad'); return; } n += Number(data || 0); }
    toast(n ? `${n} preventiva(s) criada(s) a partir dos planos` : 'Nada novo: todas as preventivas do mês já existem');
    refresh();
  }));

  function bindTab() {
    tab.querySelectorAll('[data-ver]').forEach(b => b.onclick = () => verModal(ags.find(a => a.id === b.dataset.ver)));
    tab.querySelectorAll('[data-validar]').forEach(b => b.onclick = () => verModal(ags.find(a => a.id === b.dataset.validar), true));
    tab.querySelectorAll('[data-more]').forEach(b => b.onclick = () => maisModal(ags.find(a => a.id === b.dataset.more)));
  }
  bindTab();
  if (params.sit) redraw();
}

async function verModal(a, validar = false) {
  const [{ data: resp }, { data: an }] = await Promise.all([
    sb.from('preventivas_checklist_respostas').select('*').eq('agendamento_id', a.id).order('ordem'),
    sb.from('preventivas_anexos').select('arquivo_url').eq('agendamento_id', a.id)
  ]);
  const itens = checklistItens(a);
  const linhas = (resp || []).length ? resp : itens.map((it, k) => ({ ordem: k + 1, item: it.texto, resposta: null }));
  const rLabel = r => ({ CONFORME: ['Conforme', 'p-ok'], NAO_CONFORME: ['Não conforme', 'p-bad'], NAO_SE_APLICA: ['Não se aplica', 'p-gray'], REGISTRADO: ['Registrado', 'p-info'] }[r] || (r === null ? ['—', 'p-gray'] : [r ? 'Conforme' : 'Não conforme', r ? 'p-ok' : 'p-bad']));
  const sit = SITUACAO[situacao(a)];
  const m = openModal(`${modalHead(eqName(a.equipamento_id) + ' · ' + codigoAg(a), `${esc(resumoAg(a).replace(/^[A-Z0-9-]+ — /, ''))} · previsto ${brDateFull(a.data_programada)}`)}
    <div style="display:flex;gap:8px;flex-wrap:wrap"><span class="pill ${sit[1]}">${sit[0]}</span><span class="pill p-gray">${EXEC[a.tipo_execucao] || 'Equipe da loja'}</span></div>
    <dl class="kv">
      <dt>Executado por</dt><dd>${esc(personName(a.executado_por))}${a.tecnico_externo ? ' · ' + esc(a.tecnico_externo) + (a.empresa_executora ? ' (' + esc(a.empresa_executora) + ')' : '') : ''}</dd>
      <dt>Quando</dt><dd>${brDateTime(a.executado_em)}</dd>
      ${Number(a.custo_extra) ? `<dt>Custo</dt><dd>${money(a.custo_extra)}</dd>` : ''}
      ${a.validado_em ? `<dt>Validado</dt><dd>${esc(personName(a.validado_por))} em ${brDateTime(a.validado_em)}${a.validacao_obs ? ' · ' + esc(a.validacao_obs) : ''}</dd>` : ''}
      ${a.cancelado_motivo ? `<dt>Cancelada</dt><dd>${esc(a.cancelado_motivo)}</dd>` : ''}
    </dl>
    <div class="rows">${linhas.map(r => { const l = rLabel(r.resposta ?? (r.conforme === undefined ? null : r.conforme)); return `<div class="row" style="grid-template-columns:28px minmax(0,1fr) auto"><span class="muted small">${r.ordem || ''}</span><div><div>${esc(r.item)}</div>${r.valor !== null && r.valor !== undefined ? `<div class="small muted">Medido: ${num(r.valor, 1)} ${esc(r.unidade_medida || '')}</div>` : ''}${r.observacao ? `<div class="small" style="color:var(--bad-ink)">${esc(r.observacao)}</div>` : ''}</div><span class="pill ${l[1]}">${l[0]}</span></div>`; }).join('')}</div>
    <b>Fotos e documentos</b>${await galleryHTML((an || []).map(x => x.arquivo_url))}
    ${validar ? `<label class="field">Observação da validação (opcional)<input class="input" data-vobs placeholder="Ex.: laudo conferido, serviço aprovado"></label>
      <div class="modal-foot"><button type="button" class="btn btn-light" data-close>Voltar</button><button type="button" class="btn btn-primary" data-val>Validar execução</button></div>` : ''}`);
  m.querySelector('[data-val]')?.addEventListener('click', e => busy(e.currentTarget, 'Validando…', async () => {
    try { await atualizarAgendamento(a.id, { validado_por: S.user.id, validacao_obs: m.querySelector('[data-vobs]').value.trim() || null }); closeModal(); toast('Execução validada'); refresh(); }
    catch (err) { toast(errMsg(err), 'bad'); }
  }));
}

function maisModal(a) {
  const m = openModal(`${modalHead('Reprogramar ou cancelar', eqName(a.equipamento_id) + ' · ' + codigoAg(a) + ' · ' + brDateFull(a.data_programada))}
    <div class="tabs"><button type="button" class="on" data-t="rep">Reprogramar</button><button type="button" data-t="can">Cancelar</button></div>
    <div data-p="rep" style="display:flex;flex-direction:column;gap:12px">
      <label class="field">Nova data<input class="input" type="date" data-data value="${a.data_programada}"></label>
      <label class="field">Motivo<input class="input" data-mrep placeholder="Ex.: equipamento em uso no evento"></label>
    </div>
    <div data-p="can" class="hidden" style="display:flex;flex-direction:column;gap:12px">
      <label class="field">Justificativa do cancelamento<textarea class="input" data-mcan placeholder="Ex.: equipamento desativado"></textarea></label>
      <p class="small muted" style="margin:0">Cancelada não conta no cumprimento do mês e fica registrada com a justificativa.</p>
    </div>
    <div class="msg" data-msg></div>
    <div class="modal-foot"><button type="button" class="btn btn-light" data-close>Voltar</button><button type="button" class="btn btn-primary" data-ok>Salvar</button></div>`, { size: 'sm' });
  let modo = 'rep';
  m.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { modo = b.dataset.t; m.querySelectorAll('[data-t]').forEach(x => x.classList.toggle('on', x === b)); m.querySelectorAll('[data-p]').forEach(p => p.classList.toggle('hidden', p.dataset.p !== modo)); const ok = m.querySelector('[data-ok]'); ok.textContent = modo === 'rep' ? 'Salvar' : 'Cancelar preventiva'; ok.className = 'btn ' + (modo === 'rep' ? 'btn-primary' : 'btn-danger'); });
  m.querySelector('[data-ok]').onclick = e => {
    const msg = m.querySelector('[data-msg]'); msg.textContent = '';
    let payload;
    if (modo === 'rep') {
      const d = m.querySelector('[data-data]').value, mot = m.querySelector('[data-mrep]').value.trim();
      if (!d || d === a.data_programada) { msg.textContent = 'Escolha uma nova data.'; return; }
      if (mot.length < 5) { msg.textContent = 'Informe o motivo (mínimo 5 letras).'; return; }
      payload = { data_programada: d, reprogramado_de: a.reprogramado_de || a.data_programada, reprogramado_motivo: mot };
    } else {
      const mot = m.querySelector('[data-mcan]').value.trim();
      if (mot.length < 5) { msg.textContent = 'Informe a justificativa (mínimo 5 letras).'; return; }
      payload = { status: 'CANCELADA', cancelado_motivo: mot, cancelado_por: S.user.id, cancelado_em: new Date().toISOString() };
    }
    busy(e.currentTarget, 'Salvando…', async () => {
      try { await atualizarAgendamento(a.id, payload); closeModal(); toast(modo === 'rep' ? 'Preventiva reprogramada' : 'Preventiva cancelada'); refresh(); }
      catch (err) { msg.textContent = /duplicate|unique/i.test(err.message || '') ? 'Já existe esta mesma preventiva nessa data.' : errMsg(err); }
    });
  };
}
