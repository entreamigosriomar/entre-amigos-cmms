// Líder: meus chamados (Abertos / A confirmar / Resolvidos) e confirmação da solução.
import { sb } from '../config/supabase.js';
import { S, PRIO, OPEN_STATUS, eqName, personName } from '../core/state.js';
import { esc, icon, since, brDateTime, toast, errMsg, busy, openModal, modalHead, closeModal } from '../core/util.js';
import { galleryHTML } from '../core/photos.js';
import { go } from '../core/nav.js';

export async function render(el, params) {
  const { data, error } = await sb.from('ordens_servico').select('*').eq('solicitante_id', S.user.id)
    .order('data_abertura', { ascending: false }).limit(150);
  if (error) throw error;
  const lista = data || [];
  const aConfirmar = lista.filter(o => o.status === 'CONCLUIDA' && o.confirmacao === 'PENDENTE');
  const abertos = lista.filter(o => OPEN_STATUS.includes(o.status));
  const resolvidos = lista.filter(o => (o.status === 'CONCLUIDA' && o.confirmacao !== 'PENDENTE') || o.status === 'CANCELADA');
  let aba = params.aba || (aConfirmar.length ? 'confirmar' : 'abertos');

  const etapa = o => o.status === 'CONCLUIDA' ? 2 : ['EM_EXECUCAO', 'AGUARDANDO_PECA', 'AGUARDANDO_TERCEIRIZADA', 'AGUARDANDO_APROVACAO'].includes(o.status) ? 1 : 0;
  const situacaoTxt = o => ({ ABERTA: 'na fila da manutenção', EM_EXECUCAO: 'em atendimento', AGUARDANDO_PECA: 'aguardando peça', AGUARDANDO_TERCEIRIZADA: 'aguardando empresa terceirizada', AGUARDANDO_APROVACAO: 'aguardando aprovação', CONCLUIDA: 'concluído', CANCELADA: 'cancelado' }[o.status] || o.status);
  const titulo = o => o.problema || o.descricao?.slice(0, 60) || 'Chamado';
  const onde = o => o.equipamento_id ? eqName(o.equipamento_id) : (o.item_descricao || o.categoria || '');

  function card(o) {
    const p = PRIO[o.prioridade] || PRIO.MEDIA;
    return `<button type="button" class="task" data-os="${o.id}" style="text-align:left;cursor:pointer">
      <div class="task-top"><span class="nm" style="font-size:16px">${esc(titulo(o))}</span><span class="pill ${p[1]}">${p[0]}</span></div>
      <span class="d">OS ${esc(o.numero)} · ${esc(onde(o))} · ${situacaoTxt(o)}${o.status === 'CONCLUIDA' ? '' : ' · aberto há ' + since(o.data_abertura)}${o.reaberturas ? ` · reaberto ${o.reaberturas}x` : ''}</span>
      <div class="steps3">${['Aberto', 'Em execução', 'Concluído'].map((n, i) => `<div class="${i <= etapa(o) ? 'on' : ''}"><i></i>${n}</div>`).join('')}</div>
    </button>`;
  }
  function confirmCard(o) {
    return `<div class="task" style="border:2px solid var(--orange)">
      <div class="task-top"><span class="small" style="font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--orange-ink)">Confirme a solução</span><span class="mono muted">OS ${esc(o.numero)}</span></div>
      <span class="nm">${esc(titulo(o))}</span>
      <span class="d">${esc(personName(o.tecnico_id))} concluiu ${brDateTime(o.data_conclusao)}${o.solucao ? ` · “${esc(o.solucao.split(' | ')[0].slice(0, 120))}”` : ''}</span>
      <div data-fotos="${o.id}"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <button type="button" class="btn btn-danger btn-lg" data-reabrir="${o.id}">Reabrir</button>
        <button type="button" class="btn btn-ok btn-lg" data-ok="${o.id}">Resolvido</button>
      </div>
    </div>`;
  }

  function draw() {
    const list = aba === 'confirmar' ? aConfirmar : aba === 'resolvidos' ? resolvidos : abertos;
    el.innerHTML = `<div class="mobile-page">
      <div class="m-hero">
        <div><div class="when">${esc(S.profile.nome)} · ${esc(S.units.find(u => u.id === S.profile.unidade_id)?.nome || '')}</div><div class="hi">Meus chamados</div></div>
        <div class="m-stats">
          <div class="m-stat"><b>${abertos.length}</b><span>abertos</span></div>
          <div class="m-stat ${aConfirmar.length ? 'alert' : ''}"><b>${aConfirmar.length}</b><span>a confirmar</span></div>
          <div class="m-stat"><b>${resolvidos.length}</b><span>resolvidos</span></div>
        </div>
      </div>
      <div class="tabs" role="tablist">${[['abertos', 'Abertos'], ['confirmar', 'A confirmar'], ['resolvidos', 'Resolvidos']].map(([k, n]) => `<button type="button" role="tab" class="${aba === k ? 'on' : ''}" data-aba="${k}">${n}</button>`).join('')}</div>
      ${list.length ? (aba === 'confirmar' ? list.map(confirmCard).join('') : list.map(card).join('')) : `<div class="empty">${aba === 'confirmar' ? 'Nada para confirmar.' : aba === 'resolvidos' ? 'Nenhum chamado resolvido ainda.' : 'Nenhum chamado aberto.'}</div>`}
      <div style="height:70px"></div>
    </div>
    <a class="fab" href="#/abrir">${icon('mais', 22, 2.6)}Abrir chamado</a>`;
    el.querySelectorAll('[data-aba]').forEach(b => b.onclick = () => { aba = b.dataset.aba; draw(); });
    el.querySelectorAll('[data-os]').forEach(b => b.onclick = () => detalhe(lista.find(o => o.id === b.dataset.os)));
    el.querySelectorAll('[data-ok]').forEach(b => b.onclick = () => confirmar(b, b.dataset.ok, true));
    el.querySelectorAll('[data-reabrir]').forEach(b => b.onclick = () => reabrirModal(b.dataset.reabrir));
    if (aba === 'confirmar') loadFotos();
  }

  async function loadFotos() {
    for (const o of aConfirmar) {
      const box = el.querySelector(`[data-fotos="${o.id}"]`); if (!box) continue;
      const { data: an } = await sb.from('os_anexos').select('arquivo_url,origem').eq('os_id', o.id).eq('origem', 'conclusao');
      box.innerHTML = (an || []).length ? await galleryHTML(an.map(a => a.arquivo_url)) : '';
    }
  }

  async function confirmar(btn, id, resolvido, obs = null) {
    await busy(btn, resolvido ? 'Confirmando…' : 'Reabrindo…', async () => {
      const { error } = await sb.rpc('confirmar_chamado', { p_os_id: id, p_resolvido: resolvido, p_obs: obs });
      if (error) { toast(errMsg(error), 'bad'); return; }
      closeModal();
      toast(resolvido ? 'Obrigado! Chamado encerrado.' : 'Chamado reaberto e devolvido à manutenção.');
      go('chamados', { aba: resolvido ? 'resolvidos' : 'abertos' });
    });
  }
  function reabrirModal(id) {
    const m = openModal(`${modalHead('Reabrir chamado', 'Conte o que continua com problema.')}
      <textarea class="input" data-obs rows="3" placeholder="Ex.: o botão foi trocado mas continua sem regular a chama"></textarea>
      <div class="modal-foot"><button type="button" class="btn btn-light" data-close>Voltar</button><button type="button" class="btn btn-danger" data-go>Reabrir chamado</button></div>`, { size: 'sm' });
    m.querySelector('[data-go]').onclick = e => {
      const obs = m.querySelector('[data-obs]').value.trim();
      if (obs.length < 3) { toast('Escreva o que continua com problema.', 'bad'); return; }
      confirmar(e.currentTarget, id, false, obs);
    };
  }
  async function detalhe(o) {
    const { data: an } = await sb.from('os_anexos').select('arquivo_url,origem').eq('os_id', o.id).order('criado_em');
    const ab = (an || []).filter(a => a.origem !== 'conclusao').map(a => a.arquivo_url), cc = (an || []).filter(a => a.origem === 'conclusao').map(a => a.arquivo_url);
    openModal(`${modalHead('OS ' + o.numero + ' · ' + titulo(o), esc(onde(o)) + ' · aberto em ' + brDateTime(o.data_abertura))}
      <div class="kv"><dt>Situação</dt><dd>${situacaoTxt(o)}</dd><dt>Prioridade</dt><dd>${(PRIO[o.prioridade] || PRIO.MEDIA)[0]}</dd><dt>Técnico</dt><dd>${esc(personName(o.tecnico_id))}</dd><dt>Descrição</dt><dd style="font-weight:400">${esc(o.descricao)}</dd>${o.solucao ? `<dt>Solução</dt><dd style="font-weight:400">${esc(o.solucao)}</dd>` : ''}</div>
      <b>Fotos da abertura</b>${await galleryHTML(ab)}${cc.length ? `<b>Fotos da conclusão</b>${await galleryHTML(cc)}` : ''}`, { size: 'sm' });
  }

  draw();
}
