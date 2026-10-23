// Biblioteca de rotinas (diretoria): rotinas por família e editor de itens do checklist.
import { sb } from '../config/supabase.js';
import { S, FAMILIA, FREQ, EXEC, CRIT, loadLibrary, isDiretoria } from '../core/state.js';
import { esc, icon, toast, errMsg, busy, openModal, modalHead, closeModal, confirmDialog, num } from '../core/util.js';
import { refresh } from '../core/nav.js';

const TIPO_ITEM = { VERIFICACAO: 'Verificação', MEDICAO: 'Medição', REGISTRO: 'Registro (foto/documento)' };

export async function render(el, params) {
  await loadLibrary(true);
  const f = { q: '', fam: '', inativas: false };
  const contaItens = id => S.lib.itens.filter(i => i.rotina_id === id && i.ativo).length;
  const lista = () => S.lib.rotinas.filter(r => (f.inativas || r.ativo) && (!f.fam || r.familia === f.fam) &&
    (!f.q || `${r.codigo} ${r.nome} ${r.tipo_equipamento}`.toLowerCase().includes(f.q.toLowerCase())));

  function body() {
    const l = lista();
    if (!l.length) return '<div class="empty">Nenhuma rotina encontrada.</div>';
    const g = {};
    l.forEach(r => (g[r.familia] = g[r.familia] || []).push(r));
    return Object.entries(g).map(([fam, rs]) => `<div class="group-title">${esc(FAMILIA[fam] || fam)} · ${rs.length}</div><div class="rows">
      ${rs.map(r => `<button type="button" class="lib-item" data-r="${r.id}" style="background:none;border-left:0;border-right:0;border-bottom:0;text-align:left;cursor:pointer;font:inherit;color:inherit;width:100%">
        <span class="code">${esc(r.codigo)}</span>
        <div><div style="font-weight:600">${esc(r.tipo_equipamento)} · ${esc(r.nome)}</div><div class="small muted">${FREQ[r.frequencia]} · ${EXEC[r.executor]} · ${contaItens(r.id)} itens${r.observacao ? ' · ' + esc(r.observacao) : ''}</div></div>
        <span>${r.ativo ? '' : '<span class="pill p-gray">Inativa</span>'}${icon('dir', 18)}</span>
      </button>`).join('')}</div>`).join('');
  }

  el.innerHTML = `
    <div class="page-head">
      <div><div class="eyebrow">Diretoria · válida para todas as unidades</div><h1 class="page-title">Biblioteca de rotinas</h1></div>
      <div class="head-actions">${isDiretoria() ? `<button type="button" class="btn btn-primary" data-nova>${icon('mais', 18, 2.4)}Nova rotina</button>` : ''}</div>
    </div>
    <div class="notice info">${S.lib.rotinas.filter(r => r.ativo).length} rotinas ativas e ${S.lib.itens.filter(i => i.ativo).length} itens de checklist. Editar uma rotina muda as preventivas geradas daqui em diante; as já geradas mantêm o checklist da época.</div>
    <div class="card">
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <input class="input" data-q placeholder="Buscar por código, nome ou tipo de equipamento" style="flex:2 1 260px">
        <select class="select" data-fam style="flex:1 1 180px"><option value="">Todas as famílias</option>${Object.entries(FAMILIA).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
        <label class="small" style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-inat> Mostrar inativas</label>
      </div>
      <div data-list>${body()}</div>
    </div>`;
  const list = el.querySelector('[data-list]');
  const redraw = () => { list.innerHTML = body(); list.querySelectorAll('[data-r]').forEach(b => b.onclick = () => editor(b.dataset.r)); };
  el.querySelector('[data-q]').oninput = e => { f.q = e.target.value; redraw(); };
  el.querySelector('[data-fam]').onchange = e => { f.fam = e.target.value; redraw(); };
  el.querySelector('[data-inat]').onchange = e => { f.inativas = e.target.checked; redraw(); };
  el.querySelector('[data-nova]')?.addEventListener('click', () => rotinaForm(null));
  redraw();
  if (params.id) editor(params.id);
}

function rotinaForm(r) {
  const tipos = [...new Set(S.lib.rotinas.map(x => x.tipo_equipamento))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const m = openModal(`${modalHead(r ? 'Editar rotina ' + r.codigo : 'Nova rotina', 'Vale para todas as unidades')}
    <div class="formgrid">
      <label class="field">Código<input class="input mono" name="codigo" value="${esc(r?.codigo || '')}" placeholder="Ex.: GAS-CHB-M" ${r ? 'disabled' : ''}></label>
      <label class="field">Família<select class="select" name="familia">${Object.entries(FAMILIA).map(([k, v]) => `<option value="${k}" ${r?.familia === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label class="field full">Tipo de equipamento<input class="input" name="tipo" list="tiposList" value="${esc(r?.tipo_equipamento || '')}" placeholder="Ex.: Char Broiler"><datalist id="tiposList">${tipos.map(t => `<option value="${esc(t)}">`).join('')}</datalist></label>
      <label class="field full">Nome da rotina<input class="input" name="nome" value="${esc(r?.nome || '')}" placeholder="Ex.: Teste de gás, queimadores e limpeza"></label>
      <label class="field">Frequência<select class="select" name="freq">${Object.entries(FREQ).map(([k, v]) => `<option value="${k}" ${(r?.frequencia || 'MENSAL') === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label class="field">Executor padrão<select class="select" name="exec">${Object.entries(EXEC).map(([k, v]) => `<option value="${k}" ${(r?.executor || 'INTERNA') === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label class="field full">Observação<input class="input" name="obs" value="${esc(r?.observacao || '')}"></label>
      ${r ? `<label class="small full" style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="ativo" ${r.ativo ? 'checked' : ''}> Rotina ativa (desmarque para parar de gerar preventivas)</label>` : ''}
    </div>
    <div class="msg" data-msg></div>
    <div class="modal-foot"><button type="button" class="btn btn-light" data-close>Voltar</button><button type="button" class="btn btn-primary" data-ok>Salvar</button></div>`, { size: 'sm' });
  const F = n => m.querySelector(`[name="${n}"]`);
  m.querySelector('[data-ok]').onclick = ev => {
    const msg = m.querySelector('[data-msg]');
    const v = { familia: F('familia').value, tipo_equipamento: F('tipo').value.trim(), nome: F('nome').value.trim(), frequencia: F('freq').value, executor: F('exec').value, observacao: F('obs').value.trim() || null };
    if (r) v.ativo = F('ativo').checked; else v.codigo = F('codigo').value.trim().toUpperCase();
    if (!r && !/^[A-Z]{2,3}-[A-Z0-9]{2,4}-[A-Z0-9]{1,2}$/.test(v.codigo)) { msg.textContent = 'Código no formato FAMÍLIA-EQUIP-PERIODICIDADE, ex.: GAS-CHB-M.'; return; }
    if (!v.tipo_equipamento || !v.nome) { msg.textContent = 'Preencha tipo de equipamento e nome.'; return; }
    busy(ev.currentTarget, 'Salvando…', async () => {
      const res = r ? await sb.from('preventiva_rotinas').update(v).eq('id', r.id).select().single() : await sb.from('preventiva_rotinas').insert({ ...v, criado_por: S.user.id }).select().single();
      if (res.error) { msg.textContent = errMsg(res.error); return; }
      await loadLibrary(true); closeModal(); toast(r ? 'Rotina atualizada' : 'Rotina criada: agora inclua os itens');
      if (!r) editor(res.data.id); else refresh();
    });
  };
}

async function editor(id) {
  const r = S.lib.rotinas.find(x => x.id === id);
  if (!r) return;
  const { count } = await sb.from('preventivas_planos').select('id', { count: 'exact', head: true }).eq('rotina_id', id).eq('ativo', true);
  const itens = () => S.lib.itens.filter(i => i.rotina_id === id).sort((a, b) => a.ordem - b.ordem);
  const faixa = i => i.tipo !== 'MEDICAO' ? '' : i.faixa_equipamento ? 'faixa por equipamento' : [i.minimo != null ? 'mín ' + num(i.minimo, 1) : '', i.maximo != null ? 'máx ' + num(i.maximo, 1) : ''].filter(Boolean).join(' · ') + ' ' + (i.unidade_medida || '');
  const m = openModal(`${modalHead(r.codigo + ' · ' + r.tipo_equipamento, `${esc(r.nome)} · ${FREQ[r.frequencia]} · ${EXEC[r.executor]} · usada em ${count || 0} plano(s)`)}
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn btn-light btn-sm" data-editar>${icon('editar', 16)}Dados da rotina</button><button type="button" class="btn btn-primary btn-sm" data-add>${icon('mais', 16)}Novo item</button></div>
    <div data-itens></div>`);
  const box = m.querySelector('[data-itens]');
  const draw = () => {
    const l = itens();
    box.innerHTML = l.length ? l.map((i, k) => { const c = CRIT[i.criticidade]; return `<div class="item-row" style="${i.ativo ? '' : 'opacity:.5'}">
      <span class="muted small">${k + 1}</span>
      <div><div style="font-weight:600">${esc(i.texto)}${i.novo ? ' <span class="pill p-gray">novo</span>' : ''}${i.bloqueio ? ' <span class="pill p-warn">bloqueio</span>' : ''}${i.ativo ? '' : ' <span class="pill p-gray">inativo</span>'}</div><div class="small muted">${i.grupo ? esc(i.grupo) + ' · ' : ''}${TIPO_ITEM[i.tipo]}${faixa(i) ? ' · ' + esc(faixa(i)) : ''}${i.criterio ? ' · ' + esc(i.criterio) : ''}</div></div>
      <span class="pill ${c[1]} hide-sm">${c[0]}</span>
      <span class="hide-sm small muted">${i.foto_obrigatoria ? 'foto obrigatória' : ''}</span>
      <span style="display:flex;gap:4px"><button type="button" class="icon-btn" data-up="${i.id}" aria-label="Subir" ${k === 0 ? 'disabled' : ''}>${icon('cima', 16)}</button><button type="button" class="icon-btn" data-down="${i.id}" aria-label="Descer" ${k === l.length - 1 ? 'disabled' : ''}>${icon('baixo', 16)}</button><button type="button" class="icon-btn" data-ed="${i.id}" aria-label="Editar">${icon('editar', 16)}</button></span>
    </div>`; }).join('') : '<div class="empty">Sem itens. Clique em “Novo item”.</div>';
    box.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => itemForm(r, S.lib.itens.find(i => i.id === b.dataset.ed), () => editor(id)));
    box.querySelectorAll('[data-up],[data-down]').forEach(b => b.onclick = async () => {
      const l2 = itens(), idx = l2.findIndex(i => i.id === (b.dataset.up || b.dataset.down)), j = b.dataset.up ? idx - 1 : idx + 1;
      if (j < 0 || j >= l2.length) return;
      const a = l2[idx], c = l2[j];
      const r1 = await sb.from('preventiva_rotina_itens').update({ ordem: c.ordem }).eq('id', a.id);
      const r2 = await sb.from('preventiva_rotina_itens').update({ ordem: a.ordem }).eq('id', c.id);
      if (r1.error || r2.error) return toast(errMsg(r1.error || r2.error), 'bad');
      [a.ordem, c.ordem] = [c.ordem, a.ordem]; draw();
    });
  };
  m.querySelector('[data-editar]').onclick = () => rotinaForm(r);
  m.querySelector('[data-add]').onclick = () => itemForm(r, null, () => editor(id));
  draw();
}

function itemForm(r, it, back) {
  const m = openModal(`${modalHead(it ? 'Editar item' : 'Novo item', r.codigo)}
    <div class="formgrid">
      <label class="field full">O que verificar<input class="input" name="texto" value="${esc(it?.texto || '')}" placeholder="Ex.: Mangueira de gás sem vazamento"></label>
      <label class="field full">Como deve estar (critério de aceitação)<input class="input" name="criterio" value="${esc(it?.criterio || '')}" placeholder="Ex.: Bolhas não crescem nem se movem"></label>
      <label class="field">Tipo de resposta<select class="select" name="tipo">${Object.entries(TIPO_ITEM).map(([k, v]) => `<option value="${k}" ${(it?.tipo || 'VERIFICACAO') === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label class="field">Criticidade (se não conforme)<select class="select" name="crit">${Object.entries(CRIT).map(([k, v]) => `<option value="${k}" ${(it?.criticidade || 'NORMAL') === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select></label>
      <label class="field">Grupo (opcional)<input class="input" name="grupo" value="${esc(it?.grupo || '')}" placeholder="Ex.: Bloco Gás"></label>
      <div data-med class="formgrid full" style="grid-template-columns:repeat(3,minmax(0,1fr))">
        <label class="field">Unidade<input class="input" name="un" value="${esc(it?.unidade_medida || '')}" placeholder="°C, V, A, psi"></label>
        <label class="field">Mínimo<input class="input" type="number" step="0.1" name="min" value="${it?.minimo ?? ''}"></label>
        <label class="field">Máximo<input class="input" type="number" step="0.1" name="max" value="${it?.maximo ?? ''}"></label>
        <label class="small full" style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="fxeq" ${it?.faixa_equipamento ? 'checked' : ''}> A faixa muda por equipamento (cadastrada na ficha do equipamento)</label>
      </div>
      <label class="small" style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="foto" ${it?.foto_obrigatoria ? 'checked' : ''}> Foto obrigatória</label>
      <label class="small" style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="bloq" ${it?.bloqueio ? 'checked' : ''}> Item de bloqueio de segurança</label>
      <label class="small" style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="novo" ${it?.novo ? 'checked' : ''}> Item fora do manual (novo)</label>
      ${it ? `<label class="small" style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="ativo" ${it.ativo ? 'checked' : ''}> Item ativo</label>` : ''}
    </div>
    <div class="msg" data-msg></div>
    <div class="modal-foot">${it ? '<button type="button" class="btn btn-danger" data-del>Excluir item</button>' : ''}<button type="button" class="btn btn-light" data-voltar>Voltar</button><button type="button" class="btn btn-primary" data-ok>Salvar</button></div>`, { size: 'sm' });
  const F = n => m.querySelector(`[name="${n}"]`);
  const sync = () => m.querySelector('[data-med]').classList.toggle('hidden', F('tipo').value !== 'MEDICAO');
  F('tipo').onchange = sync; sync();
  m.querySelector('[data-voltar]').onclick = back;
  m.querySelector('[data-del]')?.addEventListener('click', async () => {
    if (!(await confirmDialog('Excluir este item?', 'Preventivas já geradas não mudam. Se preferir manter o registro, desmarque “Item ativo”.', 'Excluir', true))) return back();
    const res = await sb.from('preventiva_rotina_itens').delete().eq('id', it.id);
    if (res.error) toast(errMsg(res.error), 'bad'); else { await loadLibrary(true); toast('Item excluído'); }
    back();
  });
  m.querySelector('[data-ok]').onclick = ev => {
    const msg = m.querySelector('[data-msg]');
    const tipo = F('tipo').value;
    const v = { texto: F('texto').value.trim(), criterio: F('criterio').value.trim() || null, tipo, criticidade: F('crit').value, grupo: F('grupo').value.trim() || null,
      unidade_medida: tipo === 'MEDICAO' ? (F('un').value.trim() || null) : null,
      minimo: tipo === 'MEDICAO' && F('min').value !== '' ? Number(F('min').value) : null, maximo: tipo === 'MEDICAO' && F('max').value !== '' ? Number(F('max').value) : null,
      faixa_equipamento: tipo === 'MEDICAO' && F('fxeq').checked, foto_obrigatoria: F('foto').checked || tipo === 'REGISTRO', bloqueio: F('bloq').checked, novo: F('novo').checked };
    if (it) v.ativo = F('ativo').checked;
    if (v.texto.length < 3) { msg.textContent = 'Escreva o que deve ser verificado.'; return; }
    if (tipo === 'MEDICAO' && !v.unidade_medida) { msg.textContent = 'Medição precisa da unidade (°C, V, A…).'; return; }
    if (v.minimo !== null && v.maximo !== null && v.minimo > v.maximo) { msg.textContent = 'Mínimo maior que o máximo.'; return; }
    busy(ev.currentTarget, 'Salvando…', async () => {
      let res;
      if (it) res = await sb.from('preventiva_rotina_itens').update(v).eq('id', it.id);
      else {
        const ordem = Math.max(0, ...S.lib.itens.filter(i => i.rotina_id === r.id).map(i => i.ordem)) + 1;
        res = await sb.from('preventiva_rotina_itens').insert({ ...v, rotina_id: r.id, ordem });
      }
      if (res.error) { msg.textContent = errMsg(res.error); return; }
      await loadLibrary(true); toast('Item salvo'); back();
    });
  };
}
