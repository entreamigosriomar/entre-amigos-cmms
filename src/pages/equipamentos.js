// Equipamentos: lista por Área › Setor, ficha (dados, planos, faixas, histórico), cadastro.
import { sb } from '../config/supabase.js';
import { S, isDiretoria, isGestao, eq, areaName, setorName, unitName, currentUnitName, workUnitId, rotinasDoTipo, tiposBiblioteca, TIPOS_SEM_PREVENTIVA, FREQ, EXEC, DIAS_SEMANA, rotina, situacao, SITUACAO, OS_STATUS, personName, loadBase } from '../core/state.js';
import { esc, icon, toast, errMsg, busy, openModal, modalHead, closeModal, todayISO, brDate, brDateFull, num, confirmDialog, money } from '../core/util.js';
import { agendamentosEquip } from '../core/data.js';
import { openOS, statusPill } from '../core/os.js';
import { refresh } from '../core/nav.js';
import { inicioPelaUltima, proximaPelaUltima, proximaDoPlano, FREQ_LONGAS } from '../core/agenda.js';

const EQ_STATUS = { OPERACIONAL: ['Operacional', 'p-ok'], EM_MANUTENCAO: ['Em manutenção', 'p-orange'], PARADO: ['Parado', 'p-bad'], AGUARDANDO_PECA: ['Aguardando peça', 'p-warn'], INATIVO: ['Inativo', 'p-gray'] };

export async function render(el, params) {
  const f = { q: '', cat: '', st: '' };
  const lista = () => S.base.equipamentos.filter(e =>
    (!f.q || `${e.nome} ${e.tag || ''} ${e.tipo_equipamento || ''} ${e.fabricante_texto || ''}`.toLowerCase().includes(f.q.toLowerCase())) &&
    (!f.cat || e.categoria === f.cat) && (!f.st || e.status === f.st));
  const cats = [...new Set(S.base.equipamentos.map(e => e.categoria).filter(Boolean))].sort();

  function grupos() {
    const l = lista();
    if (!l.length) return `<div class="empty">${S.base.equipamentos.length ? 'Nada encontrado.' : 'Nenhum equipamento cadastrado. Use “Novo equipamento” ou importe a planilha.'}</div>`;
    const g = {};
    l.forEach(e => { const k = `${S.unitId === 'ALL' ? unitName(e.unidade_id) + ' · ' : ''}${areaName(e.area_id)} › ${setorName(e.setor_id)}`; (g[k] = g[k] || []).push(e); });
    return Object.entries(g).sort((a, b) => a[0].localeCompare(b[0], 'pt-BR')).map(([k, es]) => `<div class="group-title">${esc(k)} · ${es.length}</div>
      <div class="eq-grid">${es.map(e => { const s = EQ_STATUS[e.status] || EQ_STATUS.OPERACIONAL; return `<button type="button" class="eq" data-eq="${e.id}">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><span class="mono muted">${esc(e.tag || 'sem TAG')}</span><span class="pill ${s[1]}">${s[0]}</span></div>
        <span class="nm">${esc(e.nome)}</span>
        <span class="small muted">${esc(e.tipo_equipamento || 'Tipo não definido')}${e.categoria && e.categoria !== e.tipo_equipamento ? ' · ' + esc(e.categoria) : ''}</span>
      </button>`; }).join('')}</div>`).join('');
  }

  el.innerHTML = `
    <div class="page-head">
      <div><div class="eyebrow">${esc(currentUnitName())}</div><h1 class="page-title">Equipamentos</h1></div>
      <div class="head-actions">${isDiretoria() ? `<a class="btn btn-light" href="#/importar">${icon('upload', 18)}Importar planilha</a><button type="button" class="btn btn-primary" data-novo>${icon('mais', 18, 2.4)}Novo equipamento</button>` : ''}</div>
    </div>
    <div class="card">
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <input class="input" data-q placeholder="Buscar por nome, TAG, tipo ou fabricante" style="flex:2 1 260px">
        <select class="select" data-cat style="flex:1 1 180px"><option value="">Todas as categorias</option>${cats.map(c => `<option>${esc(c)}</option>`).join('')}</select>
        <select class="select" data-st style="flex:1 1 160px"><option value="">Todas as situações</option>${Object.entries(EQ_STATUS).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select>
      </div>
      <div class="small muted">${S.base.equipamentos.length} itens cadastrados</div>
      <div data-list style="display:flex;flex-direction:column;gap:10px">${grupos()}</div>
    </div>`;
  const list = el.querySelector('[data-list]');
  const redraw = () => { list.innerHTML = grupos(); bindList(); };
  const bindList = () => list.querySelectorAll('[data-eq]').forEach(b => b.onclick = () => ficha(b.dataset.eq));
  el.querySelector('[data-q]').oninput = e => { f.q = e.target.value; redraw(); };
  el.querySelector('[data-cat]').onchange = e => { f.cat = e.target.value; redraw(); };
  el.querySelector('[data-st]').onchange = e => { f.st = e.target.value; redraw(); };
  el.querySelector('[data-novo]')?.addEventListener('click', () => form());
  bindList();
  if (params.id) ficha(params.id);
}

// ---------- Cadastro / edição ----------
function form(e = null, uidSel = null) {
  const uid = e?.unidade_id || uidSel || workUnitId();
  const escolherUnidade = !e && S.unitId === 'ALL';
  const areas = S.base.areas.filter(a => a.unidade_id === uid);
  const cats = S.base.categorias.filter(c => c.unidade_id === uid);
  const tipos = [...tiposBiblioteca(), ...TIPOS_SEM_PREVENTIVA];
  const m = openModal(`${modalHead(e ? 'Editar ' + e.nome : 'Novo equipamento', unitName(uid) + (e?.tag ? ' · ' + e.tag : ' · a TAG é criada automaticamente'))}
    <div class="formgrid">
      ${escolherUnidade ? `<label class="field full">Unidade<select class="select" name="unidade">${S.units.map(u => `<option value="${u.id}" ${u.id === uid ? 'selected' : ''}>${esc(u.nome)}</option>`).join('')}</select></label>` : ''}
      <label class="field full">Nome<input class="input" name="nome" value="${esc(e?.nome || '')}" placeholder="Ex.: Micro-ondas, Fritadeira a gás 01"></label>
      <label class="field">Área<select class="select" name="area_id"><option value="">Selecione</option>${areas.map(a => `<option value="${a.id}" ${e?.area_id === a.id ? 'selected' : ''}>${esc(a.nome)}</option>`).join('')}</select></label>
      <label class="field">Setor<select class="select" name="setor_id"></select></label>
      <label class="field">Tipo<select class="select" name="tipo_equipamento"><option value="">Selecione</option>${tipos.map(t => `<option ${e?.tipo_equipamento === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
      <label class="field">Categoria<select class="select" name="categoria"><option value="">Selecione</option>${cats.map(c => `<option ${e?.categoria === c.nome ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</select></label>
      <label class="field">Fabricante<input class="input" name="fabricante_texto" value="${esc(e?.fabricante_texto || '')}"></label>
      <label class="field">Modelo<input class="input" name="modelo" value="${esc((e?.observacoes || '').match(/Modelo: ([^|]+)/)?.[1]?.trim() || '')}"></label>
      <label class="field">Nº de série (opcional)<input class="input" name="numero" value="${esc(e?.numero || '')}"></label>
      <label class="field">Criticidade<select class="select" name="criticidade">${[['BAIXA', 'Baixa'], ['MEDIA', 'Média'], ['ALTA', 'Alta'], ['CRITICA', 'Crítica']].map(([k, v]) => `<option value="${k}" ${(e?.criticidade || 'MEDIA') === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
    </div>
    <div data-planos-prev class="notice info small"></div>
    <div class="msg" data-msg></div>
    <div class="modal-foot">${e ? `<button type="button" class="btn btn-danger" data-inativar>Inativar</button>` : ''}<button type="button" class="btn btn-light" data-close>Voltar</button><button type="button" class="btn btn-primary" data-salvar>Salvar</button></div>`);
  const F = n => m.querySelector(`[name="${n}"]`);
  const fillSetores = () => {
    const ss = S.base.setores.filter(s => s.unidade_id === uid && (s.area_id === F('area_id').value || (!s.area_id && !F('area_id').value)));
    F('setor_id').innerHTML = `<option value="">Selecione</option>${ss.map(s => `<option value="${s.id}" ${e?.setor_id === s.id ? 'selected' : ''}>${esc(s.nome)}</option>`).join('')}`;
  };
  const prevPlanos = () => {
    const rs = rotinasDoTipo(F('tipo_equipamento').value);
    const box = m.querySelector('[data-planos-prev]');
    box.innerHTML = e ? (F('tipo_equipamento').value !== (e.tipo_equipamento || '') ? (rs.length ? `Tipo alterado: ao salvar, os planos do tipo anterior são desativados e serão criados ${rs.length} plano(s): ${rs.map(r => `<b>${esc(r.codigo)}</b> (${FREQ[r.frequencia].toLowerCase()})`).join(', ')}.` : 'Tipo alterado: ao salvar, os planos de preventiva deste equipamento são desativados (o item passa a servir só para chamados).') : 'Os planos de preventiva deste equipamento ficam na aba Planos da ficha.') : rs.length ? `Ao salvar, serão criados ${rs.length} plano(s): ${rs.map(r => `<b>${esc(r.codigo)}</b> (${FREQ[r.frequencia].toLowerCase()})`).join(', ')}.` : 'Este tipo não tem preventiva: o item serve para abrir chamados.';
  };
  F('area_id').onchange = fillSetores; F('tipo_equipamento').onchange = prevPlanos;
  if (escolherUnidade) F('unidade').onchange = () => form(null, F('unidade').value);
  fillSetores(); prevPlanos();
  m.querySelector('[data-inativar]')?.addEventListener('click', async ev => {
    if (!(await confirmDialog('Inativar ' + e.nome + '?', 'O equipamento sai das listas e os planos param de gerar preventivas. O histórico é mantido.', 'Inativar', true))) return;
    const r1 = await sb.from('equipamentos').update({ ativo: false, status: 'INATIVO' }).eq('id', e.id);
    if (r1.error) return toast(errMsg(r1.error), 'bad');
    const { data: pls } = await sb.from('preventivas_planos').select('id').eq('equipamento_id', e.id);
    await sb.from('preventivas_planos').update({ ativo: false }).eq('equipamento_id', e.id);
    if (pls?.length) await cancelarPendentes(pls.map(x => x.id), 'Equipamento inativado');
    await loadBase(); toast('Equipamento inativado'); refresh();
  });
  m.querySelector('[data-salvar]').onclick = ev => {
    const msg = m.querySelector('[data-msg]'); msg.textContent = '';
    const v = { nome: F('nome').value.trim(), area_id: F('area_id').value, setor_id: F('setor_id').value, tipo_equipamento: F('tipo_equipamento').value, categoria: F('categoria').value, fabricante_texto: F('fabricante_texto').value.trim() || null, numero: F('numero').value.trim() || null, criticidade: F('criticidade').value };
    const modelo = F('modelo').value.trim();
    if (!v.nome || !v.area_id || !v.setor_id || !v.tipo_equipamento || !v.categoria) { msg.textContent = 'Preencha nome, área, setor, tipo e categoria.'; return; }
    if (S.base.equipamentos.some(x => x.unidade_id === uid && x.nome.toLowerCase() === v.nome.toLowerCase() && x.id !== e?.id)) { msg.textContent = 'Já existe um item com esse nome nesta unidade. Diferencie (01, 02…).'; return; }
    v.observacoes = modelo ? `Modelo: ${modelo}` : (e?.observacoes || null);
    busy(ev.currentTarget, 'Salvando…', async () => {
      try {
        if (e) {
          const r = await sb.from('equipamentos').update(v).eq('id', e.id); if (r.error) throw r.error;
          const troca = v.tipo_equipamento !== (e.tipo_equipamento || '') ? await trocarPlanosDoTipo(e, v.tipo_equipamento) : null;
          toast('Equipamento atualizado' + (troca ? ` · ${troca.criados} plano(s) criado(s), ${troca.desativados} desativado(s)` : ''));
        } else {
          const novo = await criarEquipamento(uid, v);
          toast(`${novo.tag} cadastrado` + (novo.planos ? ` com ${novo.planos} plano(s)` : ''));
        }
        await loadBase(); closeModal(); refresh();
      } catch (err) { msg.textContent = errMsg(err); }
    });
  };
}

// Cria equipamento com TAG e planos do tipo (usado também pela importação).
export async function criarEquipamento(uid, v, opts = {}) {
  const { data: tag, error: te } = await sb.rpc('gerar_tag_equipamento', { p_unidade_id: uid });
  if (te) throw te;
  const { data: novo, error } = await sb.from('equipamentos').insert({ unidade_id: uid, status: 'OPERACIONAL', criticidade: 'MEDIA', ...v, tag, criado_por: S.user.id }).select().single();
  if (error) throw error;
  let planos = 0;
  const rs = rotinasDoTipo(v.tipo_equipamento);
  if (rs.length) {
    const hoje = opts.data_inicio && opts.data_inicio > todayISO() ? opts.data_inicio : todayISO();
    const rows = rs.map(r => ({
      unidade_id: uid, equipamento_id: novo.id, rotina_id: r.id, nome: `${r.codigo} — ${r.nome}`, frequencia: r.frequencia,
      dia_previsto: opts.dia_previsto || 10, dia_semana: ['SEMANAL', 'QUINZENAL'].includes(r.frequencia) ? (opts.dia_semana ?? 1) : null,
      data_inicio: opts.ultimas?.[r.frequencia] ? inicioPelaUltima(opts.ultimas[r.frequencia], r.frequencia, hoje) : (opts.data_inicio || hoje),
      ultima_execucao: opts.ultimas?.[r.frequencia] || null, tipo_execucao: r.executor, empresa_padrao: null, ativo: true
    }));
    const p = await sb.from('preventivas_planos').insert(rows);
    if (p.error) throw new Error('Equipamento criado, mas os planos falharam: ' + errMsg(p.error));
    planos = rows.length;
  }
  return { ...novo, planos };
}

// Preventivas ainda não feitas de planos desativados saem do controle mensal (canceladas com motivo).
async function cancelarPendentes(planoIds, motivo) {
  const r = await sb.from('preventivas_agendamentos').update({ status: 'CANCELADA', cancelado_motivo: motivo, cancelado_por: S.user.id, cancelado_em: new Date().toISOString() })
    .in('plano_id', planoIds).in('status', ['AGENDADA', 'ATRASADA']);
  if (r.error) console.warn('Cancelar preventivas pendentes:', r.error.message);
}

// Tipo do equipamento mudou: desativa os planos de rotinas de outro tipo e cria os do tipo novo.
async function trocarPlanosDoTipo(e, tipo) {
  const { data: planos, error } = await sb.from('preventivas_planos').select('id,rotina_id,ativo').eq('equipamento_id', e.id);
  if (error) throw error;
  const novas = rotinasDoTipo(tipo), ids = new Set(novas.map(r => r.id));
  const sair = (planos || []).filter(p => p.ativo && p.rotina_id && !ids.has(p.rotina_id)).map(p => p.id);
  if (sair.length) {
    const r = await sb.from('preventivas_planos').update({ ativo: false }).in('id', sair); if (r.error) throw r.error;
    await cancelarPendentes(sair, `Tipo do equipamento alterado para ${tipo}`);
  }
  const ativos = new Set((planos || []).filter(p => p.ativo).map(p => p.rotina_id));
  const hoje = todayISO();
  const rows = novas.filter(r => !ativos.has(r.id)).map(r => ({
    unidade_id: e.unidade_id, equipamento_id: e.id, rotina_id: r.id, nome: `${r.codigo} — ${r.nome}`, frequencia: r.frequencia,
    dia_previsto: 10, dia_semana: ['SEMANAL', 'QUINZENAL'].includes(r.frequencia) ? 1 : null, data_inicio: hoje, tipo_execucao: r.executor, empresa_padrao: null, ativo: true
  }));
  if (rows.length) { const r = await sb.from('preventivas_planos').insert(rows); if (r.error) throw r.error; }
  return { criados: rows.length, desativados: sair.length };
}

// ---------- Ficha 360° ----------
async function ficha(id) {
  const e = eq(id);
  if (!e) return toast('Equipamento não encontrado.', 'bad');
  const [planosR, osR, ags, faixasR] = await Promise.all([
    sb.from('preventivas_planos').select('*').eq('equipamento_id', id).order('criado_em'),
    sb.from('ordens_servico').select('*').eq('equipamento_id', id).order('data_abertura', { ascending: false }).limit(50),
    agendamentosEquip(id).catch(() => []),
    sb.from('equipamento_faixas').select('*').eq('equipamento_id', id)
  ]);
  const planos = planosR.data || [], os = osR.data || [], faixas = faixasR.data || [];
  const hoje = todayISO();
  const ultima = ags.filter(a => a.status === 'CONCLUIDA').sort((a, b) => String(b.executado_em).localeCompare(String(a.executado_em)))[0];
  const proxima = ags.filter(a => !['CONCLUIDA', 'CANCELADA'].includes(a.status)).sort((a, b) => a.data_programada.localeCompare(b.data_programada))[0];
  const custo = os.reduce((s, o) => s + Number(o.custo_material || 0) + Number(o.custo_terceiro || 0) + Number(o.custo_interno || 0), 0) + ags.reduce((s, a) => s + Number(a.custo_extra || 0), 0);
  const st = EQ_STATUS[e.status] || EQ_STATUS.OPERACIONAL;
  let tab = 'dados';

  const itensFaixa = () => planos.filter(p => p.ativo && p.rotina_id).flatMap(p => S.lib.itens.filter(i => i.rotina_id === p.rotina_id && i.faixa_equipamento && i.ativo).map(i => ({ ...i, codigo: rotina(p.rotina_id)?.codigo })));

  const views = {
    dados: () => `<div class="kpis" style="grid-template-columns:repeat(4,minmax(0,1fr))">
        <div class="kpi"><span class="lbl">Situação</span><span class="pill ${st[1]}" style="align-self:flex-start">${st[0]}</span></div>
        <div class="kpi"><span class="lbl">Última preventiva</span><b>${ultima ? brDateFull(ultima.executado_em) : '—'}</b></div>
        <div class="kpi"><span class="lbl">Próxima preventiva</span><b>${proxima ? brDateFull(proxima.data_programada) : '—'}</b></div>
        <div class="kpi"><span class="lbl">Custo acumulado</span><b>${money(custo)}</b></div>
      </div>
      <dl class="kv">
        <dt>TAG</dt><dd class="mono">${esc(e.tag || '—')}</dd><dt>Unidade</dt><dd>${esc(unitName(e.unidade_id))}</dd>
        <dt>Local</dt><dd>${esc(areaName(e.area_id))} › ${esc(setorName(e.setor_id))}</dd>
        <dt>Tipo</dt><dd>${esc(e.tipo_equipamento || '—')}</dd><dt>Categoria</dt><dd>${esc(e.categoria || '—')}</dd>
        <dt>Fabricante</dt><dd>${esc(e.fabricante_texto || '—')}</dd><dt>Nº de série</dt><dd>${esc(e.numero || '—')}</dd>
        ${e.observacoes ? `<dt>Observações</dt><dd style="font-weight:400">${esc(e.observacoes)}</dd>` : ''}
      </dl>
      ${isGestao() ? `<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end"><label class="field">Mudar situação<select class="select" data-st>${Object.entries(EQ_STATUS).filter(([k]) => k !== 'INATIVO').map(([k, v]) => `<option value="${k}" ${e.status === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select></label><button type="button" class="btn btn-light" data-salvar-st>Salvar situação</button>${isDiretoria() ? `<button type="button" class="btn btn-light" data-editar>${icon('editar', 16)}Editar cadastro</button>` : ''}</div>` : ''}`,
    planos: () => `${planos.filter(p => p.ativo).length ? `<div class="rows">${planos.filter(p => p.ativo).map(p => { const r = rotina(p.rotina_id); return `<div class="row" style="grid-template-columns:110px minmax(0,1fr) auto"><span class="code">${esc(r?.codigo || '—')}</span><div><div class="t">${esc(r?.nome || p.nome)}</div><div class="d">${FREQ[p.frequencia] || p.frequencia} · ${['SEMANAL', 'QUINZENAL'].includes(p.frequencia) ? DIAS_SEMANA[p.dia_semana ?? 1] : 'dia ' + p.dia_previsto} · ${EXEC[p.tipo_execucao]}${p.empresa_padrao ? ' (' + esc(p.empresa_padrao) + ')' : ''}${p.responsavel_id ? ' · resp. ' + esc(personName(p.responsavel_id)) : ''}</div><div class="d">Última: <b>${p.ultima_execucao ? brDateFull(p.ultima_execucao) : 'não informada'}</b> · Próxima: <b>${(x => x ? brDateFull(x) : '—')(proximaDoPlano(p, ags, hoje))}</b></div></div>${isDiretoria() ? `<button type="button" class="btn btn-light btn-sm" data-plano="${p.id}">Editar</button>` : ''}</div>`; }).join('')}</div>` : '<div class="empty">Nenhum plano de preventiva.</div>'}
      ${isDiretoria() ? `<div><button type="button" class="btn btn-light" data-addplano>${icon('mais', 16)}Adicionar rotina</button></div>` : ''}`,
    faixas: () => { const its = itensFaixa(); return its.length ? `<p class="small muted" style="margin:0">Faixas do fabricante, alinhadas com a nutrição. Valem para as próximas preventivas geradas.</p>
      <div class="rows">${its.map(i => { const fx = faixas.find(x => x.item_id === i.id); return `<div class="row" style="grid-template-columns:minmax(0,1fr) 110px 110px"><div><div class="t">${esc(i.texto)}</div><div class="d"><span class="code">${esc(i.codigo)}</span> · ${esc(i.unidade_medida || '')}</div></div>
        <label class="field">Mínimo<input class="input" type="number" step="0.1" data-fmin="${i.id}" value="${fx?.minimo ?? ''}" ${isDiretoria() ? '' : 'disabled'}></label>
        <label class="field">Máximo<input class="input" type="number" step="0.1" data-fmax="${i.id}" value="${fx?.maximo ?? ''}" ${isDiretoria() ? '' : 'disabled'}></label></div>`; }).join('')}</div>
      ${isDiretoria() ? '<div><button type="button" class="btn btn-primary" data-salvar-fx>Salvar faixas</button></div>' : ''}` : '<div class="empty">As rotinas deste equipamento não têm medições com faixa própria.</div>'; },
    historico: () => {
      const h = [...os.map(o => ({ d: o.data_abertura, t: `OS ${o.numero} · ${o.problema || 'OS'}`, s: statusPill(o.status), os: o.id })),
        ...ags.filter(a => a.data_programada <= hoje || a.status === 'CONCLUIDA').map(a => { const sx = SITUACAO[situacao(a)]; return { d: a.executado_em || a.data_programada, t: `Preventiva ${rotina(a.rotina_id)?.codigo || ''} · ${brDate(a.data_programada)}`, s: `<span class="pill ${sx[1]}">${sx[0]}</span>` }; })]
        .sort((a, b) => String(b.d).localeCompare(String(a.d)));
      return h.length ? `<div class="rows">${h.map(x => `<div class="row" style="grid-template-columns:90px minmax(0,1fr) auto">${`<span class="small muted">${brDate(x.d)}</span>`}<span>${x.os ? `<a href="#" data-hos="${x.os}">${esc(x.t)}</a>` : esc(x.t)}</span>${x.s}</div>`).join('')}</div>` : '<div class="empty">Sem histórico ainda.</div>';
    }
  };

  const m = openModal(`${modalHead(e.nome, `${esc(e.tag || '')} · ${esc(areaName(e.area_id))} › ${esc(setorName(e.setor_id))}`)}
    <div class="tabs">${[['dados', 'Visão geral'], ['planos', `Planos (${planos.filter(p => p.ativo).length})`], ['faixas', 'Faixas'], ['historico', `Histórico (${os.length})`]].map(([k, n]) => `<button type="button" data-tab="${k}" class="${k === tab ? 'on' : ''}">${n}</button>`).join('')}</div>
    <div data-body style="display:flex;flex-direction:column;gap:14px"></div>`);
  const body = m.querySelector('[data-body]');
  const show = () => { body.innerHTML = views[tab](); bindBody(); m.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === tab)); };
  m.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; show(); });

  function bindBody() {
    body.querySelector('[data-salvar-st]')?.addEventListener('click', ev => busy(ev.currentTarget, 'Salvando…', async () => {
      const v = body.querySelector('[data-st]').value; const r = await sb.from('equipamentos').update({ status: v }).eq('id', e.id);
      if (r.error) return toast(errMsg(r.error), 'bad'); e.status = v; toast('Situação atualizada'); closeModal(); refresh();
    }));
    body.querySelector('[data-editar]')?.addEventListener('click', () => form(e));
    body.querySelectorAll('[data-plano]').forEach(b => b.onclick = () => planoForm(e, planos.find(p => p.id === b.dataset.plano)));
    body.querySelector('[data-addplano]')?.addEventListener('click', () => planoForm(e, null, planos));
    body.querySelectorAll('[data-hos]').forEach(a => a.onclick = ev => { ev.preventDefault(); openOS(a.dataset.hos, refresh); });
    body.querySelector('[data-salvar-fx]')?.addEventListener('click', ev => busy(ev.currentTarget, 'Salvando…', async () => {
      const rows = itensFaixa().map(i => ({ equipamento_id: e.id, unidade_id: e.unidade_id, item_id: i.id, minimo: body.querySelector(`[data-fmin="${i.id}"]`).value, maximo: body.querySelector(`[data-fmax="${i.id}"]`).value, fonte: 'Fabricante / nutrição' }))
        .map(r => ({ ...r, minimo: r.minimo === '' ? null : Number(r.minimo), maximo: r.maximo === '' ? null : Number(r.maximo) }));
      if (rows.some(r => r.minimo !== null && r.maximo !== null && r.minimo > r.maximo)) return toast('Mínimo maior que máximo em alguma faixa.', 'bad');
      const del = await sb.from('equipamento_faixas').delete().eq('equipamento_id', e.id);
      if (del.error) return toast(errMsg(del.error), 'bad');
      const ins = rows.filter(r => r.minimo !== null || r.maximo !== null);
      if (ins.length) { const r = await sb.from('equipamento_faixas').insert(ins); if (r.error) return toast(errMsg(r.error), 'bad'); }
      toast('Faixas salvas'); closeModal();
    }));
  }
  show();
}

function planoForm(e, p, existentes = []) {
  const usados = existentes.filter(x => x.ativo).map(x => x.rotina_id);
  const rotinas = S.lib.rotinas.filter(r => r.ativo && (p ? r.id === p.rotina_id : !usados.includes(r.id)))
    .sort((a, b) => (b.tipo_equipamento === e.tipo_equipamento) - (a.tipo_equipamento === e.tipo_equipamento) || a.codigo.localeCompare(b.codigo));
  const tecnicos = S.base.perfis.filter(x => x.ativo && ['TECNICO', 'GERENTE'].includes(x.role) && x.unidade_id === e.unidade_id);
  const r0 = p ? rotina(p.rotina_id) : rotinas[0];
  const m = openModal(`${modalHead(p ? 'Editar plano' : 'Adicionar rotina', e.nome)}
    <div class="formgrid">
      <label class="field full">Rotina<select class="select" name="rotina" ${p ? 'disabled' : ''}>${rotinas.map(r => `<option value="${r.id}" ${r.id === r0?.id ? 'selected' : ''}>${esc(r.codigo)} — ${esc(r.tipo_equipamento)} · ${esc(r.nome)}</option>`).join('')}</select></label>
      <label class="field">Frequência<select class="select" name="frequencia">${Object.entries(FREQ).map(([k, v]) => `<option value="${k}" ${(p?.frequencia || r0?.frequencia) === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label class="field" data-dm>Dia previsto no mês<input class="input" type="number" min="1" max="31" name="dia" value="${p?.dia_previsto || 10}"></label>
      <label class="field" data-ds>Dia da semana<select class="select" name="semana">${DIAS_SEMANA.map((d, i) => `<option value="${i}" ${(p?.dia_semana ?? 1) === i ? 'selected' : ''}>${d}</option>`).join('')}</select></label>
      <label class="field">Última vez feita<input class="input" type="date" name="ultima" max="${todayISO()}" value="${p?.ultima_execucao || ''}"></label>
      <label class="field">Começa em<input class="input" type="date" name="inicio" value="${p?.data_inicio || todayISO()}"></label>
      <p class="small muted full" data-prox style="margin:0"></p>
      <label class="field">Executor<select class="select" name="exec">${Object.entries(EXEC).map(([k, v]) => `<option value="${k}" ${(p?.tipo_execucao || r0?.executor) === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label class="field">Empresa (terceirizada)<input class="input" name="empresa" value="${esc(p?.empresa_padrao || '')}"></label>
      <label class="field">Responsável<select class="select" name="resp"><option value="">Equipe da unidade</option>${tecnicos.map(t => `<option value="${t.id}" ${p?.responsavel_id === t.id ? 'selected' : ''}>${esc(t.nome)}</option>`).join('')}</select></label>
    </div>
    <p class="small muted" style="margin:0">Mudanças valem para as preventivas geradas daqui em diante.</p>
    <div class="msg" data-msg></div>
    <div class="modal-foot">${p ? '<button type="button" class="btn btn-danger" data-desativar>Desativar plano</button>' : ''}<button type="button" class="btn btn-light" data-close>Voltar</button><button type="button" class="btn btn-primary" data-ok>Salvar</button></div>`, { size: 'sm' });
  const F = n => m.querySelector(`[name="${n}"]`);
  const sync = () => { const sem = ['SEMANAL', 'QUINZENAL'].includes(F('frequencia').value), d = F('frequencia').value === 'DIARIA'; m.querySelector('[data-ds]').classList.toggle('hidden', !sem); m.querySelector('[data-dm]').classList.toggle('hidden', sem || d); };
  const prox = () => {
    const u = F('ultima').value, f = F('frequencia').value, el = m.querySelector('[data-prox]');
    const px = proximaPelaUltima(u, f);
    el.textContent = u && px ? `Próxima estimada: ${brDateFull(px)}${px.slice(0, 7) <= todayISO().slice(0, 7) ? ' — já venceu, entra no mês atual' : ''}.` : FREQ_LONGAS.includes(f) ? 'Informe a última vez feita para o sistema calcular a próxima.' : '';
  };
  F('ultima').onchange = () => { if (F('ultima').value && FREQ_LONGAS.includes(F('frequencia').value)) F('inicio').value = inicioPelaUltima(F('ultima').value, F('frequencia').value); prox(); };
  F('frequencia').onchange = () => { sync(); F('ultima').onchange(); };
  prox();
  F('rotina').onchange = () => { const r = rotina(F('rotina').value); if (r) { F('frequencia').value = r.frequencia; F('exec').value = r.executor; F('frequencia').onchange(); } };
  sync();
  m.querySelector('[data-desativar]')?.addEventListener('click', ev => busy(ev.currentTarget, '…', async () => {
    const r = await sb.from('preventivas_planos').update({ ativo: false }).eq('id', p.id);
    if (r.error) return toast(errMsg(r.error), 'bad'); toast('Plano desativado'); closeModal(); refresh();
  }));
  m.querySelector('[data-ok]').onclick = ev => {
    const msg = m.querySelector('[data-msg]'); msg.textContent = '';
    const rid = p?.rotina_id || F('rotina').value, r = rotina(rid);
    if (!r) { msg.textContent = 'Escolha a rotina.'; return; }
    const freq = F('frequencia').value, dia = Number(F('dia').value);
    if (!['SEMANAL', 'QUINZENAL', 'DIARIA'].includes(freq) && (dia < 1 || dia > 31)) { msg.textContent = 'Dia previsto entre 1 e 31.'; return; }
    if (F('ultima').value && F('ultima').value > todayISO()) { msg.textContent = 'A última vez feita não pode ser no futuro.'; return; }
    const v = { rotina_id: rid, nome: `${r.codigo} — ${r.nome}`, frequencia: freq, dia_previsto: dia || 10, dia_semana: ['SEMANAL', 'QUINZENAL'].includes(freq) ? Number(F('semana').value) : null, data_inicio: F('inicio').value || todayISO(), ultima_execucao: F('ultima').value || null, tipo_execucao: F('exec').value, empresa_padrao: F('empresa').value.trim() || null, responsavel_id: F('resp').value || null };
    busy(ev.currentTarget, 'Salvando…', async () => {
      const res = p ? await sb.from('preventivas_planos').update(v).eq('id', p.id) : await sb.from('preventivas_planos').insert({ ...v, unidade_id: e.unidade_id, equipamento_id: e.id, ativo: true });
      if (res.error) { msg.textContent = errMsg(res.error); return; }
      toast(p ? 'Plano atualizado' : 'Rotina adicionada'); closeModal(); refresh();
    });
  };
}
