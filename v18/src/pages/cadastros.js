// Áreas › Setores e Categorias da unidade (diretoria).
import { sb } from '../config/supabase.js';
import { S, unitName, loadBase } from '../core/state.js';
import { esc, icon, toast, errMsg, busy, openModal, modalHead, closeModal, confirmDialog } from '../core/util.js';
import { go, refresh } from '../core/nav.js';

export async function render(el, params) {
  const uid = params.u || (S.unitId === 'ALL' ? S.units[0]?.id : S.unitId);
  const areas = S.base.areas.filter(a => a.unidade_id === uid);
  const setores = S.base.setores.filter(s => s.unidade_id === uid);
  const cats = S.base.categorias.filter(c => c.unidade_id === uid);
  const eqs = S.base.equipamentos.filter(e => e.unidade_id === uid);
  const semArea = setores.filter(s => !s.area_id || !areas.some(a => a.id === s.area_id));

  const setorRow = s => `<div class="row" style="grid-template-columns:minmax(0,1fr) auto auto;padding:8px 0 8px 14px"><span>${esc(s.nome)}</span><span class="small muted">${eqs.filter(e => e.setor_id === s.id).length} itens</span><span><button type="button" class="btn btn-ghost btn-sm" data-setor="${s.id}">Editar</button></span></div>`;
  el.innerHTML = `
    <div class="page-head">
      <div><div class="eyebrow">Diretoria · ${esc(unitName(uid))}</div><h1 class="page-title">Áreas e categorias</h1></div>
      <div class="head-actions">${S.units.length > 1 ? `<label class="field">Unidade<select class="select" data-u>${S.units.map(u => `<option value="${u.id}" ${u.id === uid ? 'selected' : ''}>${esc(u.nome)}</option>`).join('')}</select></label>` : ''}</div>
    </div>
    <div class="grid2">
      <section class="card wide">
        <div class="card-head"><h2 class="card-title">Áreas e setores</h2><button type="button" class="btn btn-primary btn-sm" data-nova-area>${icon('mais', 16)}Nova área</button></div>
        <p class="small muted" style="margin:0">É a estrutura que o líder usa para abrir chamado: Área › Setor › Categoria › Item.</p>
        ${areas.length ? areas.map(a => `<div style="border:1px solid var(--line);border-radius:14px;padding:12px 14px">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b style="font-size:16px">${esc(a.nome)}</b><span style="display:flex;gap:6px"><button type="button" class="btn btn-light btn-sm" data-novo-setor="${a.id}">${icon('mais', 14)}Setor</button><button type="button" class="btn btn-ghost btn-sm" data-area="${a.id}">Editar</button></span></div>
          ${setores.filter(s => s.area_id === a.id).map(setorRow).join('') || '<div class="small muted" style="padding:6px 14px">Sem setores.</div>'}
        </div>`).join('') : '<div class="empty">Nenhuma área cadastrada. Comece por “Nova área” ou importe a planilha.</div>'}
        ${semArea.length ? `<div style="border:1px dashed var(--line-2);border-radius:14px;padding:12px 14px"><b>Setores sem área</b> <span class="small muted">— edite para ligar a uma área</span>${semArea.map(setorRow).join('')}</div>` : ''}
      </section>
      <section class="card">
        <div class="card-head"><h2 class="card-title">Categorias</h2><button type="button" class="btn btn-primary btn-sm" data-nova-cat>${icon('mais', 16)}Nova</button></div>
        <p class="small muted" style="margin:0">No chamado, a categoria filtra os itens que aparecem.</p>
        <div class="rows">${cats.map(c => `<div class="row" style="grid-template-columns:minmax(0,1fr) auto auto"><span>${esc(c.nome)}</span><span class="small muted">${eqs.filter(e => e.categoria === c.nome).length} itens</span><button type="button" class="btn btn-ghost btn-sm" data-cat="${c.id}">Editar</button></div>`).join('') || '<div class="empty">Sem categorias.</div>'}</div>
      </section>
    </div>`;

  el.querySelector('[data-u]')?.addEventListener('change', e => go('cadastros', { u: e.target.value }));
  el.querySelector('[data-nova-area]').onclick = () => nomeModal('Nova área', '', async nome => sb.from('areas').insert({ unidade_id: uid, nome, ativo: true }));
  el.querySelector('[data-nova-cat]').onclick = () => nomeModal('Nova categoria', '', async nome => sb.from('categorias_manutencao').insert({ unidade_id: uid, nome, ativo: true }));
  el.querySelectorAll('[data-novo-setor]').forEach(b => b.onclick = () => nomeModal('Novo setor em ' + areas.find(a => a.id === b.dataset.novoSetor).nome, '', async nome => sb.from('setores').insert({ unidade_id: uid, area_id: b.dataset.novoSetor, nome, ativo: true })));
  el.querySelectorAll('[data-area]').forEach(b => { const a = areas.find(x => x.id === b.dataset.area); b.onclick = () => nomeModal('Editar área', a.nome, async nome => sb.from('areas').update({ nome }).eq('id', a.id), async () => remover('areas', a, eqs.some(e => e.area_id === a.id) || setores.some(s => s.area_id === a.id))); });
  el.querySelectorAll('[data-cat]').forEach(b => { const c = cats.find(x => x.id === b.dataset.cat); b.onclick = () => nomeModal('Editar categoria', c.nome, async nome => {
    const r = await sb.from('categorias_manutencao').update({ nome }).eq('id', c.id);
    if (!r.error && nome !== c.nome) await sb.from('equipamentos').update({ categoria: nome }).eq('unidade_id', uid).eq('categoria', c.nome);
    return r;
  }, async () => remover('categorias_manutencao', c, eqs.some(e => e.categoria === c.nome))); });
  el.querySelectorAll('[data-setor]').forEach(b => { const s = setores.find(x => x.id === b.dataset.setor); b.onclick = () => setorModal(s, areas, eqs.some(e => e.setor_id === s.id)); });
}

function nomeModal(titulo, atual, salvar, excluir) {
  const m = openModal(`${modalHead(titulo)}<label class="field">Nome<input class="input" data-nome value="${esc(atual)}"></label><div class="msg" data-msg></div>
    <div class="modal-foot">${excluir ? '<button type="button" class="btn btn-danger" data-del>Excluir</button>' : ''}<button type="button" class="btn btn-light" data-close>Voltar</button><button type="button" class="btn btn-primary" data-ok>Salvar</button></div>`, { size: 'sm' });
  m.querySelector('[data-del]')?.addEventListener('click', () => { closeModal(); excluir(); });
  m.querySelector('[data-ok]').onclick = ev => {
    const nome = m.querySelector('[data-nome]').value.trim();
    if (nome.length < 2) { m.querySelector('[data-msg]').textContent = 'Informe o nome.'; return; }
    busy(ev.currentTarget, 'Salvando…', async () => {
      const r = await salvar(nome);
      if (r?.error) { m.querySelector('[data-msg]').textContent = errMsg(r.error); return; }
      await loadBase(); closeModal(); toast('Salvo'); refresh();
    });
  };
}

function setorModal(s, areas, usado) {
  const m = openModal(`${modalHead('Editar setor')}
    <label class="field">Nome<input class="input" data-nome value="${esc(s.nome)}"></label>
    <label class="field">Área<select class="select" data-area><option value="">Sem área</option>${areas.map(a => `<option value="${a.id}" ${s.area_id === a.id ? 'selected' : ''}>${esc(a.nome)}</option>`).join('')}</select></label>
    <div class="msg" data-msg></div>
    <div class="modal-foot"><button type="button" class="btn btn-danger" data-del>Excluir</button><button type="button" class="btn btn-light" data-close>Voltar</button><button type="button" class="btn btn-primary" data-ok>Salvar</button></div>`, { size: 'sm' });
  m.querySelector('[data-del]').onclick = () => { closeModal(); remover('setores', s, usado); };
  m.querySelector('[data-ok]').onclick = ev => busy(ev.currentTarget, 'Salvando…', async () => {
    const nome = m.querySelector('[data-nome]').value.trim(), area_id = m.querySelector('[data-area]').value || null;
    if (nome.length < 2) { m.querySelector('[data-msg]').textContent = 'Informe o nome.'; return; }
    const r = await sb.from('setores').update({ nome, area_id }).eq('id', s.id);
    if (r.error) { m.querySelector('[data-msg]').textContent = errMsg(r.error); return; }
    if (area_id) await sb.from('equipamentos').update({ area_id }).eq('setor_id', s.id);
    await loadBase(); closeModal(); toast('Setor salvo'); refresh();
  });
}

async function remover(tabela, item, usado) {
  const ok = await confirmDialog(usado ? `Inativar ${item.nome}?` : `Excluir ${item.nome}?`, usado ? 'Há itens ligados a este cadastro: ele será inativado e some das listas, mas o histórico fica.' : 'Não há nada ligado a este cadastro. Ele será excluído.', usado ? 'Inativar' : 'Excluir', true);
  if (!ok) return;
  const r = usado ? await sb.from(tabela).update({ ativo: false }).eq('id', item.id) : await sb.from(tabela).delete().eq('id', item.id);
  if (r.error) return toast(errMsg(r.error), 'bad');
  await loadBase(); toast(usado ? 'Inativado' : 'Excluído'); refresh();
}
