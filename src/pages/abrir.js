// Abrir chamado em 3 etapas: Onde (Área › Setor › Categoria › Item), O quê (foto + descrição), Urgência.
import { S, PRIO, unitName, isLider } from '../core/state.js';
import { esc, icon, toast, errMsg, busy, since } from '../core/util.js';
import { pickerHTML, bindPicker, uploadFiles } from '../core/photos.js';
import { criarOS, abertasDoEquipamento } from '../core/data.js';
import { go } from '../core/nav.js';

const SEM_ITEM = '__sem_item__';

export async function render(el) {
  const st = {
    passo: 1,
    unidade: S.unitId === 'ALL' ? null : S.unitId,
    area: null, setor: null, categoria: null, item: null, itemTexto: '',
    descricao: '', fotos: [], r: { op: null, risco: null, cliente: null },
    duplicadas: [], enviado: null
  };

  const areas = () => S.base.areas.filter(a => a.unidade_id === st.unidade);
  const setores = () => S.base.setores.filter(s => s.unidade_id === st.unidade && (s.area_id === st.area || (!s.area_id && st.area === '__sem_area__')));
  const categorias = () => S.base.categorias.filter(c => c.unidade_id === st.unidade);
  const itens = () => S.base.equipamentos.filter(e => e.unidade_id === st.unidade && e.setor_id === st.setor && (e.categoria || '') === (st.categoria || ''));
  const temSetorSemArea = () => S.base.setores.some(s => s.unidade_id === st.unidade && !s.area_id);

  const prioridade = () => st.r.risco ? 'CRITICA' : st.r.op ? 'ALTA' : st.r.cliente ? 'MEDIA' : 'BAIXA';
  const nomeItem = () => st.item === SEM_ITEM ? (st.itemTexto ? st.itemTexto : 'Sem item específico') : (S.base.equipamentos.find(e => e.id === st.item)?.nome || '');
  const nomeArea = () => st.area === '__sem_area__' ? 'Sem área' : (S.base.areas.find(a => a.id === st.area)?.nome || '');
  const nomeSetor = () => S.base.setores.find(s => s.id === st.setor)?.nome || '';

  function chips(list, sel, attr) {
    if (!list.length) return '<div class="muted small">Nada cadastrado aqui ainda.</div>';
    return `<div class="chips">${list.map(x => `<button type="button" class="chip ${x.id === sel ? 'on' : ''}" data-${attr}="${x.id}">${esc(x.nome)}</button>`).join('')}</div>`;
  }

  function stepsHead() {
    return `<div class="flow-head">
      <div style="display:flex;gap:12px;align-items:center">
        <div><div class="t">Abrir chamado</div><div class="s">${st.unidade ? esc(unitName(st.unidade)) + ' · ' : ''}vai direto para a manutenção</div></div>
      </div>
      <div class="flow-steps">${['Onde', 'O quê', 'Urgência'].map((n, i) => `<div class="${i < st.passo ? 'on' : ''}"><i></i>${n}</div>`).join('')}</div>
    </div>`;
  }

  function passo1() {
    const unidadesHTML = S.unitId === 'ALL' ? `<span class="group-title">Unidade</span>${chips(S.units, st.unidade, 'unidade')}` : '';
    if (!st.unidade) return unidadesHTML;
    const areaList = areas().concat(temSetorSemArea() ? [{ id: '__sem_area__', nome: 'Outros setores' }] : []);
    let h = unidadesHTML + `<span class="group-title">Área</span>${chips(areaList, st.area, 'area')}`;
    if (st.area) h += `<span class="group-title">Setor</span>${chips(setores(), st.setor, 'setor')}`;
    if (st.setor) h += `<span class="group-title">Categoria</span>${chips(categorias(), categorias().find(c => c.nome === st.categoria)?.id, 'categoria')}`;
    if (st.setor && st.categoria) {
      const list = itens();
      h += `<span class="group-title">Item</span><div style="display:flex;flex-direction:column;gap:8px">
        ${list.map(e => `<button type="button" class="pick-row ${st.item === e.id ? 'on' : ''}" data-item="${e.id}"><span>${esc(e.nome)}</span><span class="mono muted">${esc(e.tag || '')}</span></button>`).join('')}
        <button type="button" class="pick-row ${st.item === SEM_ITEM ? 'on' : ''}" data-item="${SEM_ITEM}"><span>Sem item específico</span><span class="muted small">parede, piso, porta…</span></button>
      </div>`;
      if (st.item === SEM_ITEM) h += `<label class="field" style="font-size:14px;color:var(--navy)">Qual item ou local? (opcional)<input class="input" data-itemtexto value="${esc(st.itemTexto)}" placeholder="Ex.: parede do corredor de serviço"></label>`;
      if (!list.length) h += `<div class="notice info">Nenhum item de ${esc(st.categoria)} cadastrado neste setor. Use “Sem item específico”.</div>`;
    }
    if (st.duplicadas.length) {
      const d = st.duplicadas[0];
      h += `<div class="notice warn" style="display:flex;flex-direction:column;gap:6px"><b>Já existe chamado aberto para este item</b><span>OS ${esc(d.numero)} · “${esc((d.descricao || d.problema || '').slice(0, 80))}” · aberta há ${since(d.data_abertura)}</span><a href="#/${isLider() ? 'chamados' : 'ordens'}">Acompanhar em vez de abrir outro</a></div>`;
    }
    return h;
  }

  function passo2() {
    return `<div class="notice info">${esc(nomeArea())} › ${esc(nomeSetor())} › ${esc(st.categoria)} › <b>${esc(nomeItem())}</b></div>
      ${pickerHTML('ch', { label: 'Foto do problema (obrigatória)', big: true, text: 'Tirar foto do problema' })}
      <label class="field" style="font-size:14px;color:var(--navy)">O que está acontecendo?
        <textarea class="input" data-desc rows="3" placeholder="Ex.: botão da boca 3 está quebrado e não regula a chama">${esc(st.descricao)}</textarea>
      </label>`;
  }

  function passo3() {
    const q = [['op', 'Parou a operação ou um equipamento?'], ['risco', 'Tem risco para pessoas (gás, choque, queda)?'], ['cliente', 'O cliente vê ou é afetado?']];
    const p = PRIO[prioridade()];
    const respondidas = Object.values(st.r).every(v => v !== null);
    return q.map(([k, t]) => `<div class="task"><span class="nm" style="font-size:16px">${t}</span>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <button type="button" class="chip ${st.r[k] === true ? 'on' : ''}" data-yn="${k}" data-v="1" style="border-radius:12px;min-height:48px">Sim</button>
          <button type="button" class="chip ${st.r[k] === false ? 'on' : ''}" data-yn="${k}" data-v="0" style="border-radius:12px;min-height:48px">Não</button>
        </div></div>`).join('') +
      (respondidas ? `<div class="notice ${prioridade() === 'CRITICA' ? 'bad' : prioridade() === 'ALTA' ? 'warn' : 'info'}"><div class="small">Prioridade calculada</div><div style="font-size:22px;font-weight:800;font-stretch:85%">${p[0]}</div><div class="small">Atendimento em até ${p[3]}</div></div>` : '');
  }

  function sucesso() {
    const o = st.enviado, p = PRIO[o.prioridade];
    return `<div class="mobile-page">
      <div class="m-hero" style="align-items:flex-start">
        <span class="pill p-ok">${icon('ok', 14, 3)} Chamado enviado</span>
        <div class="hi">OS ${esc(o.numero)}</div>
        <div class="when">${esc(nomeItem())} · prioridade ${p[0]} · atendimento em até ${p[3]}</div>
      </div>
      <p class="muted">A manutenção já está vendo o seu chamado. Quando ela concluir, você confirma se ficou resolvido.</p>
      <a class="btn btn-navy btn-lg" href="#/${isLider() ? 'chamados' : 'ordens'}">${isLider() ? 'Ver meus chamados' : 'Ver ordens de serviço'}</a>
      <button type="button" class="btn btn-light btn-lg" data-novo>Abrir outro chamado</button>
    </div>`;
  }

  function podeAvancar() {
    if (st.passo === 1) return st.unidade && st.area && st.setor && st.categoria && st.item;
    if (st.passo === 2) return st.fotos.length > 0 && st.descricao.trim().length >= 5;
    return Object.values(st.r).every(v => v !== null);
  }

  function draw() {
    if (st.enviado) { el.innerHTML = sucesso(); el.querySelector('[data-novo]').onclick = () => render(el); return; }
    el.innerHTML = `<div class="mobile-page">
      ${stepsHead()}
      <div style="display:flex;flex-direction:column;gap:10px" data-body>${st.passo === 1 ? passo1() : st.passo === 2 ? passo2() : passo3()}</div>
      <div class="msg" data-msg role="alert"></div>
      <div class="flow-foot">
        <button type="button" class="btn btn-light btn-lg" data-voltar>${st.passo === 1 ? 'Cancelar' : 'Voltar'}</button>
        <button type="button" class="btn btn-primary btn-lg" data-avancar ${podeAvancar() ? '' : 'disabled'}>${st.passo === 3 ? 'Enviar para a manutenção' : 'Continuar'}</button>
      </div>
    </div>`;
    bind();
  }

  async function checarDuplicado() {
    st.duplicadas = st.item && st.item !== SEM_ITEM ? await abertasDoEquipamento(st.item).catch(() => []) : [];
    draw();
  }

  function bind() {
    const q = s => el.querySelectorAll(s);
    q('[data-unidade]').forEach(b => b.onclick = () => { st.unidade = b.dataset.unidade; st.area = st.setor = st.categoria = st.item = null; draw(); });
    q('[data-area]').forEach(b => b.onclick = () => { st.area = b.dataset.area; st.setor = setores().length === 1 ? setores()[0].id : null; st.item = null; st.duplicadas = []; draw(); });
    q('[data-setor]').forEach(b => b.onclick = () => { st.setor = b.dataset.setor; st.item = null; st.duplicadas = []; draw(); });
    q('[data-categoria]').forEach(b => b.onclick = () => { st.categoria = categorias().find(c => c.id === b.dataset.categoria)?.nome; st.item = null; st.duplicadas = []; draw(); });
    q('[data-item]').forEach(b => b.onclick = () => { st.item = b.dataset.item; draw(); checarDuplicado(); });
    const it = el.querySelector('[data-itemtexto]'); if (it) it.oninput = e => { st.itemTexto = e.target.value; };
    const ds = el.querySelector('[data-desc]');
    const sync = () => { const a = el.querySelector('[data-avancar]'); if (a) a.disabled = !podeAvancar(); };
    if (ds) ds.oninput = e => { st.descricao = e.target.value; sync(); };
    if (st.passo === 2) bindPicker(el, 'ch', st.fotos, { onChange: sync });
    q('[data-yn]').forEach(b => b.onclick = () => { st.r[b.dataset.yn] = b.dataset.v === '1'; draw(); });
    el.querySelector('[data-voltar]').onclick = () => { if (st.passo === 1) history.back(); else { st.passo--; draw(); } };
    el.querySelector('[data-avancar]').onclick = e => {
      if (!podeAvancar()) return;
      if (st.passo < 3) { st.passo++; draw(); return; }
      enviar(e.currentTarget);
    };
  }

  async function enviar(btn) {
    const msg = el.querySelector('[data-msg]');
    await busy(btn, 'Enviando…', async () => {
      try {
        const fotos = await uploadFiles(st.fotos, st.unidade, `chamado-${Date.now()}`);
        const e = st.item !== SEM_ITEM ? S.base.equipamentos.find(x => x.id === st.item) : null;
        const desc = st.descricao.trim();
        const o = await criarOS({
          unidade_id: st.unidade, equipamento_id: e?.id || null,
          area_id: st.area === '__sem_area__' ? null : st.area, setor_id: st.setor,
          solicitante_id: S.user.id, tipo: 'SOLICITACAO', origem: 'CHAMADO', status: 'ABERTA',
          prioridade: prioridade(), categoria: st.categoria,
          problema: desc.split('\n')[0].slice(0, 90), descricao: desc,
          item_descricao: st.item === SEM_ITEM ? (st.itemTexto || null) : null,
          urgencia: { parou_operacao: st.r.op, risco_pessoas: st.r.risco, cliente_afetado: st.r.cliente }
        }, fotos);
        st.enviado = o;
        toast('Chamado enviado para a manutenção');
        draw();
      } catch (err) {
        if (msg) msg.textContent = errMsg(err) + ' Seus dados foram mantidos: tente de novo.';
      }
    });
  }

  if (S.unitId === 'ALL' && S.units.length === 1) st.unidade = S.units[0].id;
  draw();
}
