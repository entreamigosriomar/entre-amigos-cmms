// Execução da preventiva: um item por vez, botões grandes, NC gera OS automática.
import { sb } from '../config/supabase.js';
import { S, CRIT, CRIT_TO_PRIO, EXEC, checklistItens, resumoAg, codigoAg, eq, eqName, areaName, setorName, rotina, situacao, SITUACAO } from '../core/state.js';
import { esc, icon, toast, errMsg, busy, safeStore, brDateFull, num } from '../core/util.js';
import { pickerHTML, bindPicker, uploadFiles } from '../core/photos.js';
import { agendamento, criarOS, marcarEquipamento } from '../core/data.js';
import { go } from '../core/nav.js';

export async function render(el, params) {
  const a = await agendamento(params.id);
  const itens = checklistItens(a);
  const e = eq(a.equipamento_id);
  const rot = rotina(a.rotina_id);
  const terceirizada = a.tipo_execucao && a.tipo_execucao !== 'INTERNA';
  const temRegistroFoto = itens.some(i => i.tipo === 'REGISTRO');
  const exigeFotoFinal = !temRegistroFoto && (terceirizada || ['SEMESTRAL', 'ANUAL', 'QUINQUENAL'].includes(rot?.frequencia) || (!a.rotina_id && a.exige_foto !== false));

  if (a.status === 'CONCLUIDA' || a.status === 'CANCELADA') {
    const sit = SITUACAO[situacao(a)];
    el.innerHTML = `<div class="mobile-page"><div class="m-hero"><div class="hi">${esc(eqName(a.equipamento_id))}</div><div class="when">${esc(resumoAg(a))}</div><span class="pill ${sit[1]}" style="align-self:flex-start">${sit[0]}</span></div><a class="btn btn-light btn-lg" href="#/${S.profile.role === 'TECNICO' ? 'meudia' : 'controle'}">Voltar</a></div>`;
    return;
  }

  const KEY = 'ea.chk.' + a.id;
  const saved = safeStore(KEY) || {};
  const st = {
    i: saved.i || 0,
    r: saved.r || {},             // índice → { resp, valor, obs }
    files: {},                    // índice → [File]
    finalFiles: [], tecExt: saved.tecExt || '', custo: saved.custo || '', empresa: a.empresa_executora || '',
    criadas: {}, enviado: null
  };
  const total = itens.length;
  const persist = () => safeStore(KEY, { i: st.i, r: st.r, tecExt: st.tecExt, custo: st.custo });

  const foraDaFaixa = (it, v) => v !== '' && v !== null && v !== undefined && !isNaN(Number(v)) &&
    ((it.minimo !== null && it.minimo !== undefined && Number(v) < Number(it.minimo)) || (it.maximo !== null && it.maximo !== undefined && Number(v) > Number(it.maximo)));
  const isNC = idx => {
    const it = itens[idx], r = st.r[idx] || {};
    if (it.tipo === 'MEDICAO') return r.resp !== 'NA' && foraDaFaixa(it, r.valor);
    return r.resp === 'NC';
  };
  const answered = idx => {
    const it = itens[idx], r = st.r[idx] || {};
    if (it.tipo === 'MEDICAO') return r.resp === 'NA' || (r.valor !== undefined && r.valor !== '' && !isNaN(Number(r.valor)));
    if (it.tipo === 'REGISTRO') return (st.files[idx] || []).length > 0 || r.resp === 'NA';
    return !!r.resp;
  };
  const itemOk = idx => {
    if (!answered(idx)) return false;
    if (isNC(idx)) return (st.r[idx]?.obs || '').trim().length >= 3 && (st.files[idx] || []).length > 0;
    if (itens[idx].foto && itens[idx].tipo !== 'REGISTRO' && st.r[idx]?.resp !== 'NA') return (st.files[idx] || []).length > 0;
    return true;
  };
  const respondidos = () => itens.filter((_, k) => answered(k)).length;
  const faixaTxt = it => {
    const u = it.unidade || '';
    if (it.minimo != null && it.maximo != null) return `${num(it.minimo, 1)} a ${num(it.maximo, 1)} ${u}`;
    if (it.maximo != null) return `até ${num(it.maximo, 1)} ${u}`;
    if (it.minimo != null) return `mínimo ${num(it.minimo, 1)} ${u}`;
    return '';
  };

  function header() {
    return `<div class="flow-head">
      <div style="display:flex;gap:12px;align-items:center">
        <a href="#/${S.profile.role === 'TECNICO' ? 'meudia' : 'controle'}" class="icon-btn" style="background:var(--navy-2);border:0;color:#fff;flex:none" aria-label="Voltar">${icon('esq')}</a>
        <div style="min-width:0"><div class="t">${esc(eqName(a.equipamento_id))}</div>
        <div class="s"><span class="code" style="color:#FF8A5C">${esc(codigoAg(a))}</span> · ${esc(e?.tag || '')} · ${esc(areaName(e?.area_id))} › ${esc(setorName(e?.setor_id))}</div></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--navy-ink)"><span>${st.i < total ? `Item ${st.i + 1} de ${total}` : 'Revisão'}</span><span>${respondidos()} respondidos</span></div>
      <div class="bar"><i style="width:${Math.round(respondidos() / Math.max(1, total) * 100)}%"></i></div>
    </div>`;
  }

  function itemView() {
    const idx = st.i, it = itens[idx], r = st.r[idx] || {}, c = CRIT[it.criticidade] || CRIT.NORMAL;
    const nc = isNC(idx);
    let body = '';
    if (it.tipo === 'MEDICAO') {
      body = `<div class="task"><label class="field" style="font-size:14px;color:var(--navy)">Valor medido
        <div class="measure"><input class="input" data-valor type="number" step="0.1" inputmode="decimal" value="${esc(r.valor ?? '')}" ${r.resp === 'NA' ? 'disabled' : ''}><b style="font-size:20px">${esc(it.unidade || '')}</b></div></label>
        ${faixaTxt(it) ? `<span class="small muted">Faixa aceitável: <b>${faixaTxt(it)}</b></span>` : `<span class="notice warn">Faixa deste equipamento ainda não cadastrada. Registre o valor; a diretoria cadastra a faixa depois.</span>`}
        ${nc ? '<span class="notice bad">Fora da faixa: vira não conformidade.</span>' : ''}
      </div>
      <button type="button" class="answer na ${r.resp === 'NA' ? 'on' : ''}" data-resp="NA">Não se aplica</button>`;
    } else if (it.tipo === 'REGISTRO') {
      body = `<div class="task">${pickerHTML('reg', { label: '', text: 'Tirar foto', allowPdf: /laudo|relat|certific|nota|documento/i.test(it.texto) })}</div>
      <button type="button" class="answer na ${r.resp === 'NA' ? 'on' : ''}" data-resp="NA">Não se aplica</button>`;
    } else if (it.bloqueio) {
      body = `<button type="button" class="answer c ${r.resp === 'C' ? 'on' : ''}" data-resp="C">${icon('ok', 22, 2.6)}Feito</button>
      <div class="notice warn">Item de segurança: só continue depois de fazer o bloqueio.</div>`;
    } else {
      body = `<button type="button" class="answer c ${r.resp === 'C' ? 'on' : ''}" data-resp="C">${icon('ok', 22, 2.6)}Conforme</button>
      <button type="button" class="answer nc ${r.resp === 'NC' ? 'on' : ''}" data-resp="NC">${icon('x', 22, 2.6)}Não conforme</button>
      <button type="button" class="answer na ${r.resp === 'NA' ? 'on' : ''}" data-resp="NA">Não se aplica</button>`;
    }
    const prio = CRIT_TO_PRIO[it.criticidade] || 'MEDIA';
    const ncBox = nc ? `<div class="nc-box">
        <b style="color:var(--bad-ink)">Ao concluir, abre uma OS de prioridade ${{ CRITICA: 'Crítica (4 horas)', ALTA: 'Alta (1 dia)', MEDIA: 'Média (3 dias)' }[prio]}.</b>
        <label class="field" style="font-size:13px">O que você encontrou?<textarea class="input" data-obs rows="2" placeholder="Descreva o problema">${esc(r.obs || '')}</textarea></label>
        ${pickerHTML('nc', { label: 'Foto da não conformidade (obrigatória)', text: 'Tirar foto' })}
      </div>` : (it.foto && it.tipo !== 'REGISTRO' && r.resp && r.resp !== 'NA' ? `<div class="task">${pickerHTML('nc', { label: 'Foto deste item (obrigatória)', text: 'Tirar foto' })}</div>` : '');
    return `
      <div style="display:flex;gap:8px;flex-wrap:wrap">${it.grupo ? `<span class="pill p-info">${esc(it.grupo)}</span>` : ''}<span class="pill ${c[1]}">Criticidade ${c[0].toLowerCase()}</span>${it.tipo === 'MEDICAO' ? '<span class="pill p-gray">Medição</span>' : ''}</div>
      <div class="item-text">${esc(it.texto)}</div>
      ${it.criterio ? `<div class="crit-box">${icon('ok', 20, 2.2)}<div><div class="small muted" style="font-weight:700;text-transform:uppercase;letter-spacing:.06em">Como deve estar</div><div>${esc(it.criterio)}</div></div></div>` : ''}
      ${body}${ncBox}`;
  }

  function reviewView() {
    const ncs = itens.map((_, k) => k).filter(isNC);
    const qC = itens.filter((it, k) => answered(k) && !isNC(k) && st.r[k]?.resp !== 'NA').length;
    const qNA = itens.filter((_, k) => st.r[k]?.resp === 'NA').length;
    const pend = itens.map((_, k) => k).filter(k => !itemOk(k));
    return `<h2 style="font-size:26px;font-weight:800;font-stretch:85%">Revisar e concluir</h2>
      <div class="m-stats">
        <div class="mini"><span class="val" style="color:var(--ok)">${qC}</span><span class="lbl">conformes</span></div>
        <div class="mini"><span class="val" style="color:var(--bad)">${ncs.length}</span><span class="lbl">não conformes</span></div>
        <div class="mini"><span class="val" style="color:var(--muted)">${qNA}</span><span class="lbl">não se aplica</span></div>
      </div>
      ${pend.length ? `<div class="notice bad">Faltam ${pend.length} item(ns): ${pend.map(k => `<a href="#" data-goto="${k}">${k + 1}</a>`).join(', ')}. Toque no número para ir até ele.</div>`
        : ncs.length ? `<div class="notice warn">${ncs.length} não conformidade(s) vão gerar OS automática para a manutenção.</div>` : '<div class="notice ok">Nenhuma não conformidade: nenhuma OS será aberta.</div>'}
      ${terceirizada ? `<div class="task"><b>Execução da terceirizada</b>
        <label class="field">Empresa<input class="input" data-empresa value="${esc(st.empresa)}"></label>
        <label class="field">Técnico da empresa<input class="input" data-tecext value="${esc(st.tecExt)}" placeholder="Nome de quem executou"></label>
        <label class="field">Custo da visita (R$)<input class="input" data-custo type="number" min="0" step="0.01" inputmode="decimal" value="${esc(st.custo)}"></label>
        <span class="small muted">A diretoria ou o gerente valida a execução depois.</span></div>` : ''}
      ${exigeFotoFinal ? `<div class="task">${pickerHTML('final', { label: 'Foto final do equipamento (obrigatória)', text: 'Tirar foto final' })}</div>` : ''}`;
  }

  function draw() {
    if (st.enviado) return drawDone();
    const review = st.i >= total;
    el.innerHTML = `<div class="mobile-page">${header()}
      <div style="display:flex;flex-direction:column;gap:12px">${review ? reviewView() : itemView()}</div>
      <div class="msg" data-msg role="alert"></div>
      <div class="flow-foot">
        <button type="button" class="btn btn-light btn-lg" data-prev ${st.i === 0 ? 'disabled' : ''}>Anterior</button>
        <button type="button" class="btn btn-primary btn-lg" data-next>${review ? 'Concluir preventiva' : st.i === total - 1 ? 'Revisar' : 'Próximo'}</button>
      </div></div>`;
    bind();
  }

  function bind() {
    const idx = st.i;
    el.querySelectorAll('[data-resp]').forEach(b => b.onclick = () => {
      st.r[idx] = { ...(st.r[idx] || {}), resp: b.dataset.resp };
      if (b.dataset.resp === 'NA') st.r[idx].valor = '';
      persist(); draw();
    });
    const v = el.querySelector('[data-valor]');
    if (v) v.oninput = () => {
      const antes = isNC(idx);
      st.r[idx] = { ...(st.r[idx] || {}), valor: v.value, resp: 'MED' }; persist();
      if (isNC(idx) !== antes) {
        // redesenha para mostrar/esconder o quadro de não conformidade e devolve o foco ao campo
        draw();
        const nv = el.querySelector('[data-valor]');
        if (nv) { nv.focus(); try { nv.setSelectionRange(nv.value.length, nv.value.length); } catch { /* number input */ } }
      }
    };
    const ob = el.querySelector('[data-obs]');
    if (ob) ob.oninput = () => { st.r[idx] = { ...(st.r[idx] || {}), obs: ob.value }; persist(); };
    st.files[idx] = st.files[idx] || [];
    if (el.querySelector('[data-picker="nc"]')) bindPicker(el, 'nc', st.files[idx]);
    if (el.querySelector('[data-picker="reg"]')) bindPicker(el, 'reg', st.files[idx], { allowPdf: true, onChange: () => { st.r[idx] = { ...(st.r[idx] || {}), resp: 'REGISTRADO' }; } });
    if (el.querySelector('[data-picker="final"]')) bindPicker(el, 'final', st.finalFiles);
    const emp = el.querySelector('[data-empresa]'); if (emp) emp.oninput = () => { st.empresa = emp.value; };
    const te = el.querySelector('[data-tecext]'); if (te) te.oninput = () => { st.tecExt = te.value; persist(); };
    const cu = el.querySelector('[data-custo]'); if (cu) cu.oninput = () => { st.custo = cu.value; persist(); };
    el.querySelectorAll('[data-goto]').forEach(x => x.onclick = ev => { ev.preventDefault(); st.i = Number(x.dataset.goto); draw(); });
    el.querySelector('[data-prev]').onclick = () => { if (st.i > 0) { st.i--; persist(); draw(); } };
    el.querySelector('[data-next]').onclick = ev => {
      const msg = el.querySelector('[data-msg]'); msg.textContent = '';
      if (st.i < total) {
        if (v && v.value !== (st.r[idx]?.valor ?? '')) { st.r[idx] = { ...(st.r[idx] || {}), valor: v.value, resp: 'MED' }; }
        if (!answered(idx)) { msg.textContent = 'Responda este item para continuar.'; return; }
        if (!itemOk(idx)) { msg.textContent = isNC(idx) ? 'Não conformidade exige descrição e foto.' : 'Este item exige foto.'; return; }
        st.i++; persist(); draw(); window.scrollTo(0, 0); return;
      }
      concluir(ev.currentTarget);
    };
  }

  async function concluir(btn) {
    const msg = el.querySelector('[data-msg]');
    const pend = itens.map((_, k) => k).filter(k => !itemOk(k));
    if (pend.length) { msg.textContent = 'Ainda há itens sem resposta completa.'; return; }
    if (exigeFotoFinal && !st.finalFiles.length) { msg.textContent = 'Adicione a foto final do equipamento.'; return; }
    if (terceirizada && !st.tecExt.trim()) { msg.textContent = 'Informe o técnico da empresa terceirizada.'; return; }
    const custo = Number(st.custo || 0);
    if (custo < 0) { msg.textContent = 'O custo não pode ser negativo.'; return; }

    await busy(btn, 'Enviando…', async () => {
      try {
        // 1. Arquivos
        const up = {};
        for (const [k, fs] of Object.entries(st.files)) if (fs.length) up[k] = await uploadFiles(fs, a.unidade_id, `preventiva-${a.id}`);
        const upFinal = st.finalFiles.length ? await uploadFiles(st.finalFiles, a.unidade_id, `preventiva-${a.id}`) : [];
        const todos = [...Object.values(up).flat(), ...upFinal];

        // 2. Respostas (refaz do zero se for uma nova tentativa)
        let r = await sb.from('preventivas_checklist_respostas').delete().eq('agendamento_id', a.id);
        if (r.error) throw r.error;
        const rows = itens.map((it, k) => {
          const x = st.r[k] || {}, nc = isNC(k);
          return {
            agendamento_id: a.id, item_id: it.item_id || null, ordem: k + 1, item: it.texto,
            resposta: x.resp === 'NA' ? 'NAO_SE_APLICA' : it.tipo === 'REGISTRO' ? 'REGISTRADO' : nc ? 'NAO_CONFORME' : 'CONFORME',
            conforme: !nc, nc, valor: it.tipo === 'MEDICAO' && x.valor !== '' && x.valor !== undefined ? Number(x.valor) : null,
            unidade_medida: it.unidade || null, criticidade: it.criticidade || null,
            observacao: x.obs?.trim() || null, foto_url: up[k]?.[0]?.path || null
          };
        });
        r = await sb.from('preventivas_checklist_respostas').insert(rows);
        if (r.error) throw r.error;
        if (todos.length) {
          r = await sb.from('preventivas_anexos').insert(todos.map(f => ({ agendamento_id: a.id, unidade_id: a.unidade_id, usuario_id: S.user.id, arquivo_nome: f.name, arquivo_url: f.path, mime_type: f.mime, tamanho_bytes: f.size })));
          if (r.error) throw r.error;
        }

        // 3. Fecha a preventiva
        const ncs = itens.map((_, k) => k).filter(isNC);
        const upd = { status: 'CONCLUIDA', com_nc: ncs.length > 0, executado_por: S.user.id, executado_em: new Date().toISOString(), fotos_urls: todos.map(f => f.path) };
        if (terceirizada) Object.assign(upd, { tecnico_externo: st.tecExt.trim(), custo_extra: custo, empresa_executora: st.empresa.trim() || a.empresa_executora });
        r = await sb.from('preventivas_agendamentos').update(upd).eq('id', a.id);
        if (r.error) throw r.error;

        // 4. OS para cada não conformidade (sem duplicar em nova tentativa)
        const numeros = [];
        for (const k of ncs) {
          if (st.criadas[k]) { numeros.push(st.criadas[k]); continue; }
          const it = itens[k], x = st.r[k] || {};
          const medida = it.tipo === 'MEDICAO' ? ` Valor medido: ${x.valor} ${it.unidade || ''} (faixa ${faixaTxt(it) || 'não cadastrada'}).` : '';
          const prio = CRIT_TO_PRIO[it.criticidade] || 'MEDIA';
          const o = await criarOS({
            unidade_id: a.unidade_id, equipamento_id: a.equipamento_id, area_id: e?.area_id || null, setor_id: e?.setor_id || null,
            solicitante_id: S.user.id, tipo: 'PREVENTIVA', origem: 'PREVENTIVA', status: 'ABERTA', prioridade: prio,
            categoria: e?.categoria || 'Preventiva', problema: ('NC: ' + it.texto).slice(0, 90),
            descricao: `Não conformidade na preventiva ${codigoAg(a)} de ${brDateFull(a.data_programada)}. Item: ${it.texto}. ${x.obs || ''}${medida}`.trim()
          }, up[k] || []);
          st.criadas[k] = o.numero; numeros.push(o.numero);
          if (it.criticidade === 'CRITICA') await marcarEquipamento(a.equipamento_id, 'PARADO');
          else if (e?.status === 'OPERACIONAL') await marcarEquipamento(a.equipamento_id, 'EM_MANUTENCAO');
        }
        safeStore(KEY, null);
        st.enviado = { numeros };
        draw();
      } catch (err) {
        msg.textContent = errMsg(err) + ' Suas respostas foram mantidas: tente de novo.';
      }
    });
  }

  function drawDone() {
    const n = st.enviado.numeros;
    el.innerHTML = `<div class="mobile-page">
      <div class="m-hero"><span class="pill p-ok" style="align-self:flex-start">${icon('ok', 14, 3)} Preventiva concluída</span>
      <div class="hi">${esc(eqName(a.equipamento_id))}</div><div class="when">${esc(resumoAg(a))}${terceirizada ? ' · ' + EXEC[a.tipo_execucao] : ''}</div></div>
      ${n.length ? `<div class="notice warn">${n.length === 1 ? 'Foi aberta a OS' : 'Foram abertas as OS'} ${n.map(x => '<b>' + esc(x) + '</b>').join(', ')} para as não conformidades.</div>` : '<div class="notice ok">Tudo conforme. Obrigado!</div>'}
      <a class="btn btn-navy btn-lg" href="#/${S.profile.role === 'TECNICO' ? 'meudia' : 'controle'}">Voltar</a>
    </div>`;
    toast('Preventiva concluída');
  }

  if (st.i > total) st.i = total;
  draw();
}
