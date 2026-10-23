// Ficha da OS e ações (iniciar, atualizar situação, concluir, cancelar, reclassificar).
import { sb } from '../config/supabase.js';
import { S, OS_STATUS, OPEN_STATUS, PRIO, eqName, areaName, setorName, personName, unitName, isGestao, canExecute, eq } from './state.js';
import { esc, icon, brDateTime, since, toast, errMsg, busy, openModal, modalHead, closeModal, money } from './util.js';
import { pickerHTML, bindPicker, uploadFiles, galleryHTML } from './photos.js';
import { osById, osAnexos, osHistorico, atualizarOS, marcarEquipamento, liberarEquipamentoSeSemOS } from './data.js';

export const ORIGEM = { CHAMADO: ['Chamado', 'p-info'], PREVENTIVA: ['NC de preventiva', 'p-warn'], INTERNA: ['Interna', 'p-gray'] };
export const osTitle = o => o.problema || (o.descricao || '').slice(0, 70) || 'Ordem de serviço';
export const osWhere = o => o.equipamento_id ? eqName(o.equipamento_id) : [o.item_descricao, o.categoria].filter(Boolean).join(' · ') || 'Sem item';
export const slaVencido = o => o.sla_limite && OPEN_STATUS.includes(o.status) && new Date(o.sla_limite) < new Date();
export const statusPill = s => { const x = OS_STATUS[s] || [s, 'p-gray']; return `<span class="pill ${x[1]}">${x[0]}</span>`; };
export const prioPill = p => { const x = PRIO[p] || PRIO.MEDIA; return `<span class="pill ${x[1]}">${x[0]}</span>`; };

export async function openOS(id, onDone) {
  let o;
  try { o = await osById(id); } catch (e) { toast(errMsg(e), 'bad'); return; }
  const [an, hist] = await Promise.all([osAnexos(id).catch(() => []), osHistorico(id).catch(() => [])]);
  const ab = an.filter(a => a.origem !== 'conclusao').map(a => a.arquivo_url), cc = an.filter(a => a.origem === 'conclusao').map(a => a.arquivo_url);
  const e = eq(o.equipamento_id);
  const open = OPEN_STATUS.includes(o.status);
  const actions = [];
  if (open && canExecute()) {
    if (o.status === 'ABERTA') actions.push(`<button type="button" class="btn btn-navy" data-a="iniciar">${icon('play', 16)}Iniciar</button>`);
    actions.push(`<button type="button" class="btn btn-light" data-a="situacao">Atualizar situação</button>`);
    actions.push(`<button type="button" class="btn btn-primary" data-a="concluir">${icon('ok', 16, 2.6)}Concluir</button>`);
  }
  if (open && isGestao()) actions.push(`<button type="button" class="btn btn-ghost" data-a="gestao">Prioridade e técnico</button>`, `<button type="button" class="btn btn-danger" data-a="cancelar">Cancelar OS</button>`);

  const m = openModal(`${modalHead('OS ' + o.numero + ' · ' + osTitle(o), `${unitName(o.unidade_id)} · aberta ${brDateTime(o.data_abertura)} por ${esc(personName(o.solicitante_id))}`)}
    <div style="display:flex;gap:8px;flex-wrap:wrap">${statusPill(o.status)}${prioPill(o.prioridade)}<span class="pill ${(ORIGEM[o.origem] || ORIGEM.INTERNA)[1]}">${(ORIGEM[o.origem] || ORIGEM.INTERNA)[0]}</span>${slaVencido(o) ? '<span class="pill p-bad">Prazo vencido</span>' : ''}${o.reaberturas ? `<span class="pill p-bad">Reaberta ${o.reaberturas}x</span>` : ''}</div>
    <dl class="kv">
      <dt>Item</dt><dd>${esc(osWhere(o))}${e?.tag ? ` <span class="mono muted">${esc(e.tag)}</span>` : ''}</dd>
      <dt>Local</dt><dd>${esc(areaName(o.area_id || e?.area_id))} › ${esc(setorName(o.setor_id || e?.setor_id))}</dd>
      <dt>Categoria</dt><dd>${esc(o.categoria || '—')}</dd>
      <dt>Prazo</dt><dd>${o.sla_limite ? brDateTime(o.sla_limite) : '—'}</dd>
      <dt>Técnico</dt><dd>${esc(personName(o.tecnico_id))}</dd>
      <dt>Descrição</dt><dd style="font-weight:400;white-space:pre-line">${esc(o.descricao)}</dd>
      ${o.solucao ? `<dt>Solução</dt><dd style="font-weight:400;white-space:pre-line">${esc(o.solucao)}</dd>` : ''}
      ${Number(o.custo_material) + Number(o.custo_terceiro) + Number(o.custo_interno) > 0 ? `<dt>Custo</dt><dd>${money(Number(o.custo_material) + Number(o.custo_terceiro) + Number(o.custo_interno))}</dd>` : ''}
      ${o.confirmacao ? `<dt>Confirmação</dt><dd>${{ PENDENTE: 'Aguardando o líder', CONFIRMADO: 'Confirmado pelo líder', REABERTO: 'Reaberto pelo líder' }[o.confirmacao]}${o.confirmacao_obs ? ' · “' + esc(o.confirmacao_obs) + '”' : ''}</dd>` : ''}
    </dl>
    <b>Fotos da abertura</b>${await galleryHTML(ab)}
    ${cc.length ? `<b>Fotos da conclusão</b>${await galleryHTML(cc)}` : ''}
    ${hist.length ? `<details><summary style="cursor:pointer;font-weight:700">Histórico (${hist.length})</summary><div class="rows">${hist.map(h => `<div class="row" style="grid-template-columns:120px minmax(0,1fr)"><span class="small muted">${brDateTime(h.criado_em)}</span><span class="small">${esc(OS_STATUS[h.status_anterior]?.[0] || h.status_anterior || '')} → <b>${esc(OS_STATUS[h.status_novo]?.[0] || h.status_novo || '')}</b> · ${esc(personName(h.usuario_id))}${h.observacao && h.acao !== 'ALTERACAO_STATUS' ? ' · ' + esc(h.observacao) : ''}</span></div>`).join('')}</div></details>` : ''}
    ${actions.length ? `<div class="modal-foot">${actions.join('')}</div>` : ''}`);
  m.querySelectorAll('[data-a]').forEach(b => b.onclick = () => ({ iniciar: () => iniciar(b, o, onDone), situacao: () => situacaoModal(o, onDone), concluir: () => concluirModal(o, onDone), cancelar: () => cancelarModal(o, onDone), gestao: () => gestaoModal(o, onDone) })[b.dataset.a]());
}

export async function iniciar(btn, o, onDone) {
  await busy(btn, 'Iniciando…', async () => {
    try {
      await atualizarOS(o.id, { status: 'EM_EXECUCAO', tecnico_id: o.tecnico_id || S.user.id, data_inicio: o.data_inicio || new Date().toISOString() });
      if (o.equipamento_id) await marcarEquipamento(o.equipamento_id, 'EM_MANUTENCAO');
      closeModal(); toast('OS em execução'); onDone?.();
    } catch (e) { toast(errMsg(e), 'bad'); }
  });
}

function situacaoModal(o, onDone) {
  const ops = [['EM_EXECUCAO', 'Em execução'], ['AGUARDANDO_PECA', 'Aguardando peça'], ['AGUARDANDO_TERCEIRIZADA', 'Aguardando terceirizada'], ['AGUARDANDO_APROVACAO', 'Aguardando aprovação da diretoria']];
  const m = openModal(`${modalHead('Atualizar situação', 'OS ' + o.numero)}
    <label class="field">Nova situação<select class="select" data-s>${ops.map(([v, n]) => `<option value="${v}" ${o.status === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    <label class="field">Observação<textarea class="input" data-obs placeholder="Ex.: peça pedida ao fornecedor, previsão sexta"></textarea></label>
    <div class="msg" data-msg></div>
    <div class="modal-foot"><button type="button" class="btn btn-light" data-close>Voltar</button><button type="button" class="btn btn-primary" data-ok>Salvar</button></div>`, { size: 'sm' });
  m.querySelector('[data-ok]').onclick = e => busy(e.currentTarget, 'Salvando…', async () => {
    const status = m.querySelector('[data-s]').value, obs = m.querySelector('[data-obs]').value.trim();
    try {
      await atualizarOS(o.id, { status, tecnico_id: o.tecnico_id || S.user.id, data_inicio: o.data_inicio || new Date().toISOString() });
      if (obs) await sb.from('os_historico').insert({ os_id: o.id, unidade_id: o.unidade_id, usuario_id: S.user.id, status_anterior: status, status_novo: status, acao: 'OBSERVACAO', observacao: obs });
      if (o.equipamento_id) await marcarEquipamento(o.equipamento_id, status === 'AGUARDANDO_PECA' ? 'AGUARDANDO_PECA' : 'EM_MANUTENCAO');
      closeModal(); toast('Situação atualizada'); onDone?.();
    } catch (err) { m.querySelector('[data-msg]').textContent = errMsg(err); }
  });
}

export function concluirModal(o, onDone) {
  const fotos = [];
  const m = openModal(`${modalHead('Concluir OS ' + o.numero, esc(osTitle(o)) + ' · ' + esc(osWhere(o)))}
    ${pickerHTML('fim', { label: 'Foto do serviço feito (obrigatória)', text: 'Tirar foto' })}
    <label class="field">O que foi feito<textarea class="input" data-sol placeholder="Ex.: troquei o botão da boca 2 e testei a chama"></textarea></label>
    <div class="formgrid">
      <label class="field">Tempo gasto (minutos)<input class="input" data-tempo type="number" min="1" step="1" inputmode="numeric"></label>
      <label class="field">Peças / material usado<input class="input" data-pecas placeholder="Opcional"></label>
      <label class="field">Custo de material (R$)<input class="input" data-cmat type="number" min="0" step="0.01" value="0" inputmode="decimal"></label>
      <label class="field">Custo de terceiros (R$)<input class="input" data-cter type="number" min="0" step="0.01" value="0" inputmode="decimal"></label>
    </div>
    <div class="msg" data-msg role="alert"></div>
    <div class="modal-foot"><button type="button" class="btn btn-light" data-close>Voltar</button><button type="button" class="btn btn-primary" data-ok>Concluir OS</button></div>`);
  bindPicker(m, 'fim', fotos);
  m.querySelector('[data-ok]').onclick = e => {
    const msg = m.querySelector('[data-msg]'); msg.textContent = '';
    const sol = m.querySelector('[data-sol]').value.trim(), tempo = Number(m.querySelector('[data-tempo]').value || 0);
    const pecas = m.querySelector('[data-pecas]').value.trim();
    const cmat = Number(m.querySelector('[data-cmat]').value || 0), cter = Number(m.querySelector('[data-cter]').value || 0);
    if (!fotos.length) { msg.textContent = 'Adicione pelo menos uma foto do serviço feito.'; return; }
    if (sol.length < 5) { msg.textContent = 'Descreva o que foi feito.'; return; }
    if (!tempo || tempo < 1) { msg.textContent = 'Informe o tempo gasto em minutos.'; return; }
    if (cmat < 0 || cter < 0) { msg.textContent = 'Custos não podem ser negativos.'; return; }
    busy(e.currentTarget, 'Enviando fotos…', async () => {
      try {
        const up = await uploadFiles(fotos, o.unidade_id, `os-${o.id}`);
        for (const f of up) {
          const r = await sb.from('os_anexos').insert({ os_id: o.id, unidade_id: o.unidade_id, usuario_id: S.user.id, tipo: 'foto', origem: 'conclusao', arquivo_nome: f.name, arquivo_url: f.path, mime_type: f.mime, tamanho_bytes: f.size });
          if (r.error) throw r.error;
        }
        const solucao = [sol, `Tempo gasto: ${tempo} min`, pecas ? `Peças: ${pecas}` : ''].filter(Boolean).join(' | ');
        await atualizarOS(o.id, { status: 'CONCLUIDA', solucao, custo_material: cmat, custo_terceiro: cter, data_conclusao: new Date().toISOString(), tecnico_id: o.tecnico_id || S.user.id, data_inicio: o.data_inicio || new Date().toISOString() });
        const custos = [];
        if (cmat > 0) custos.push({ os_id: o.id, unidade_id: o.unidade_id, usuario_id: S.user.id, tipo: 'material', descricao: pecas || 'Material', valor: cmat });
        if (cter > 0) custos.push({ os_id: o.id, unidade_id: o.unidade_id, usuario_id: S.user.id, tipo: 'terceiro', descricao: 'Serviço de terceiros', valor: cter });
        if (custos.length) { const r = await sb.from('os_custos').insert(custos); if (r.error) toast('OS concluída, mas o custo não foi registrado: ' + errMsg(r.error), 'bad'); }
        await liberarEquipamentoSeSemOS(o.equipamento_id, o.id);
        closeModal(); toast(o.origem === 'CHAMADO' ? 'OS concluída. O líder vai confirmar a solução.' : 'OS concluída'); onDone?.();
      } catch (err) { msg.textContent = errMsg(err) + ' Nada foi perdido: tente de novo.'; }
    });
  };
}

function cancelarModal(o, onDone) {
  const m = openModal(`${modalHead('Cancelar OS ' + o.numero)}
    <label class="field">Motivo do cancelamento<textarea class="input" data-mot placeholder="Ex.: chamado duplicado da OS 149"></textarea></label>
    <div class="msg" data-msg></div>
    <div class="modal-foot"><button type="button" class="btn btn-light" data-close>Voltar</button><button type="button" class="btn btn-danger" data-ok>Cancelar OS</button></div>`, { size: 'sm' });
  m.querySelector('[data-ok]').onclick = e => {
    const mot = m.querySelector('[data-mot]').value.trim();
    if (mot.length < 5) { m.querySelector('[data-msg]').textContent = 'Explique o motivo (mínimo 5 letras).'; return; }
    busy(e.currentTarget, 'Cancelando…', async () => {
      try {
        await atualizarOS(o.id, { status: 'CANCELADA', solucao: [o.solucao, 'Cancelada: ' + mot].filter(Boolean).join(' | ') });
        await liberarEquipamentoSeSemOS(o.equipamento_id, o.id);
        closeModal(); toast('OS cancelada'); onDone?.();
      } catch (err) { m.querySelector('[data-msg]').textContent = errMsg(err); }
    });
  };
}

function gestaoModal(o, onDone) {
  const tecnicos = S.base.perfis.filter(p => p.ativo && p.role === 'TECNICO' && p.unidade_id === o.unidade_id);
  const m = openModal(`${modalHead('Prioridade e técnico', 'OS ' + o.numero)}
    <label class="field">Prioridade<select class="select" data-p>${Object.entries(PRIO).map(([k, v]) => `<option value="${k}" ${o.prioridade === k ? 'selected' : ''}>${v[0]} (${v[3]})</option>`).join('')}</select></label>
    <label class="field">Técnico responsável<select class="select" data-t><option value="">Sem técnico definido</option>${tecnicos.map(t => `<option value="${t.id}" ${o.tecnico_id === t.id ? 'selected' : ''}>${esc(t.nome)}</option>`).join('')}</select></label>
    <p class="small muted" style="margin:0">Ao mudar a prioridade, o prazo é recalculado a partir de agora.</p>
    <div class="msg" data-msg></div>
    <div class="modal-foot"><button type="button" class="btn btn-light" data-close>Voltar</button><button type="button" class="btn btn-primary" data-ok>Salvar</button></div>`, { size: 'sm' });
  m.querySelector('[data-ok]').onclick = e => busy(e.currentTarget, 'Salvando…', async () => {
    const p = m.querySelector('[data-p]').value, t = m.querySelector('[data-t]').value || null;
    const h = { CRITICA: 4, ALTA: 24, MEDIA: 72, BAIXA: 120 }[p];
    const payload = { tecnico_id: t };
    if (p !== o.prioridade) { payload.prioridade = p; payload.sla_limite = new Date(Date.now() + h * 3600000).toISOString(); }
    try { await atualizarOS(o.id, payload); closeModal(); toast('OS atualizada'); onDone?.(); }
    catch (err) { m.querySelector('[data-msg]').textContent = errMsg(err); }
  });
}
