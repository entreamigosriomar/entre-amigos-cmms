// Usuários e perfis de acesso.
import { sb } from '../config/supabase.js';
import { S, ROLE_LABEL, unitName, canManageUsers, loadBase } from '../core/state.js';
import { esc, toast, errMsg, busy, openModal, modalHead, closeModal } from '../core/util.js';
import { refresh } from '../core/nav.js';

const DESC = { MASTER: 'Acesso total', ADMIN: 'Acesso total', DIRETOR: 'Todas as unidades; biblioteca, planos e cadastros', GERENTE: 'Acompanha a própria unidade; valida terceirizadas', TECNICO: 'Executa preventivas e OS da unidade', OPERADOR: 'Abre e acompanha chamados da unidade' };

export async function render(el) {
  const { data, error } = await sb.from('perfis').select('*').order('nome');
  if (error) throw error;
  const lista = data || [];
  el.innerHTML = `
    <div class="page-head"><div><div class="eyebrow">Diretoria</div><h1 class="page-title">Usuários</h1></div></div>
    <div class="notice info">Para criar um usuário novo: no Supabase, em <b>Authentication › Users › Add user</b>, cadastre o e-mail e a senha. Depois ele aparece aqui para definir perfil e unidade. Cada pessoa tem seu próprio login.</div>
    <div class="card"><div class="table-wrap"><table class="tbl"><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Unidade</th><th>Situação</th>${canManageUsers() ? '<th></th>' : ''}</tr></thead><tbody>
      ${lista.map(p => `<tr><td class="t">${esc(p.nome)}</td><td>${esc(p.email || '')}</td><td><span class="pill p-info">${esc(ROLE_LABEL[p.role] || p.role)}</span><span class="sub">${esc(DESC[p.role] || '')}</span></td><td>${p.unidade_id ? esc(unitName(p.unidade_id)) : 'Todas'}</td><td>${p.ativo ? '<span class="pill p-ok">Ativo</span>' : '<span class="pill p-gray">Inativo</span>'}</td>${canManageUsers() ? `<td><button type="button" class="btn btn-light btn-sm" data-p="${p.id}">Editar</button></td>` : ''}</tr>`).join('')}
    </tbody></table></div>${canManageUsers() ? '' : '<p class="small muted" style="margin:0">Somente MASTER e ADMIN alteram perfis.</p>'}</div>`;
  el.querySelectorAll('[data-p]').forEach(b => b.onclick = () => editar(lista.find(p => p.id === b.dataset.p)));
}

function editar(p) {
  const m = openModal(`${modalHead('Editar ' + p.nome, p.email || '')}
    <label class="field">Nome<input class="input" data-nome value="${esc(p.nome)}"></label>
    <label class="field">Perfil<select class="select" data-role>${Object.entries(ROLE_LABEL).map(([k, v]) => `<option value="${k}" ${p.role === k ? 'selected' : ''}>${v} — ${DESC[k]}</option>`).join('')}</select></label>
    <label class="field">Unidade<select class="select" data-un><option value="">Todas (diretoria)</option>${S.units.map(u => `<option value="${u.id}" ${p.unidade_id === u.id ? 'selected' : ''}>${esc(u.nome)}</option>`).join('')}</select></label>
    <label class="small" style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-ativo ${p.ativo ? 'checked' : ''}> Usuário ativo</label>
    <div class="msg" data-msg></div>
    <div class="modal-foot"><button type="button" class="btn btn-light" data-close>Voltar</button><button type="button" class="btn btn-primary" data-ok>Salvar</button></div>`, { size: 'sm' });
  m.querySelector('[data-ok]').onclick = ev => busy(ev.currentTarget, 'Salvando…', async () => {
    const role = m.querySelector('[data-role]').value, unidade_id = m.querySelector('[data-un]').value || null;
    if (!['MASTER', 'ADMIN', 'DIRETOR'].includes(role) && !unidade_id) { m.querySelector('[data-msg]').textContent = 'Gerente, técnico e líder precisam de uma unidade.'; return; }
    const r = await sb.from('perfis').update({ nome: m.querySelector('[data-nome]').value.trim(), role, unidade_id, ativo: m.querySelector('[data-ativo]').checked }).eq('id', p.id);
    if (r.error) { m.querySelector('[data-msg]').textContent = errMsg(r.error); return; }
    await loadBase(); closeModal(); toast('Usuário atualizado'); refresh();
  });
}
