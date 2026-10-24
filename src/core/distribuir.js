// Distribui as preventivas mensais (e mais longas) ao longo do mês, para a equipe não ter
// dezenas de preventivas no mesmo dia.
//  • Equipe da loja: um setor por dia (o técnico resolve o setor inteiro de uma vez).
//  • Terceirizada: mesma família no mesmo dia (uma visita da empresa resolve tudo).
//  • Usa os dias 3 a 26 (sem domingos, contando as semanais), no dia mais livre e espaçado.
// Também move as preventivas já geradas e ainda não feitas (de hoje em diante) para o novo dia.
import { sb } from '../config/supabase.js';
import { S, eq, rotina } from './state.js';
import { todayISO, monthEnd, monthStart, shiftMonth } from './util.js';

const DIAS = Array.from({ length: 24 }, (_, i) => i + 3); // 3..26
const SEMANAIS = ['DIARIA', 'SEMANAL', 'QUINZENAL'];

export async function distribuirPlanos(unidadeId, aviso = () => {}) {
  const { data: planos, error } = await sb.from('preventivas_planos')
    .select('id,equipamento_id,rotina_id,frequencia,dia_previsto,dia_semana,data_inicio,tipo_execucao,empresa_padrao')
    .eq('unidade_id', unidadeId).eq('ativo', true);
  if (error) throw error;
  const alvo = (planos || []).filter(p => !SEMANAIS.includes(p.frequencia));
  if (!alvo.length) return { planos: 0, movidas: 0 };

  // Grupos
  const grupos = {};
  for (const p of alvo) {
    const r = rotina(p.rotina_id), e = eq(p.equipamento_id);
    const k = p.tipo_execucao === 'INTERNA' ? `I:${e?.setor_id || 'sem-setor'}` : `T:${r?.familia || ''}:${(p.empresa_padrao || '').toLowerCase()}`;
    (grupos[k] ||= []).push(p);
  }
  // Mês de referência para os dias da semana: o próximo, se já passou da metade do mês
  const hoje0 = todayISO();
  const ref = Number(hoje0.slice(8)) >= 15 ? shiftMonth(hoje0, 1) : monthStart(hoje0);
  const dow = d => new Date(ref.slice(0, 8) + String(d).padStart(2, '0') + 'T12:00:00').getDay();
  const dias = DIAS.filter(d => dow(d) !== 0); // sem domingos
  // Semanais da equipe já ocupam o dia da semana delas
  const semanaisEq = (planos || []).filter(p => SEMANAIS.includes(p.frequencia) && p.tipo_execucao === 'INTERNA');
  const carga = { I: {}, T: {} };
  dias.forEach(d => { carga.I[d] = semanaisEq.filter(p => (p.dia_semana ?? 1) === dow(d)).length; carga.T[d] = 0; });
  // Ordem: grandes e pequenos alternados, para os dias pesados não ficarem juntos
  const lista = Object.entries(grupos).sort((a, b) => b[1].length - a[1].length);
  const alternada = []; while (lista.length) { alternada.push(lista.shift()); if (lista.length) alternada.push(lista.pop()); }
  const novoDia = {};
  for (const [k, ps] of alternada) {
    const tipo = k[0], outro = tipo === 'I' ? 'T' : 'I';
    const custo = d => carga[tipo][d] * 10 + carga[outro][d];
    const min = Math.min(...dias.map(custo));
    const cands = dias.filter(d => custo(d) === min);
    // entre os dias mais livres, o mais longe dos dias já ocupados por esse executor
    const ocup = dias.filter(d => carga[tipo][d] > 0);
    const dist = d => ocup.length ? Math.min(...ocup.map(o => Math.abs(o - d))) : -d;
    const dia = cands.reduce((best, d) => (dist(d) > dist(best) ? d : best), cands[0]);
    carga[tipo][dia] += ps.length;
    ps.forEach(p => { novoDia[p.id] = dia; });
  }

  // Grava nos planos (um update por dia)
  const porDia = {};
  alvo.filter(p => p.dia_previsto !== novoDia[p.id]).forEach(p => { (porDia[novoDia[p.id]] ||= []).push(p.id); });
  for (const [dia, ids] of Object.entries(porDia)) {
    const r = await sb.from('preventivas_planos').update({ dia_previsto: Number(dia) }).in('id', ids);
    if (r.error) throw r.error;
  }

  // Move as preventivas geradas e ainda não feitas
  const hoje = hoje0;
  const { data: ags, error: e2 } = await sb.from('preventivas_agendamentos').select('id,plano_id,data_programada')
    .in('plano_id', alvo.map(p => p.id)).eq('status', 'AGENDADA').gte('data_programada', hoje);
  if (e2) throw e2;
  const pl = Object.fromEntries(alvo.map(p => [p.id, p]));
  let movidas = 0, n = 0;
  for (const a of ags || []) {
    const p = pl[a.plano_id], ult = Number(monthEnd(a.data_programada).slice(8));
    let d = a.data_programada.slice(0, 8) + String(Math.min(novoDia[p.id], ult)).padStart(2, '0');
    if (d < p.data_inicio) d = p.data_inicio;
    if (d < hoje) d = hoje;
    if (d === a.data_programada) continue;
    const r = await sb.from('preventivas_agendamentos').update({ data_programada: d }).eq('id', a.id);
    if (!r.error) movidas++;
    if (++n % 10 === 0) aviso(`Ajustando datas… ${n}/${ags.length}`);
  }
  return { planos: alvo.length, grupos: Object.keys(grupos).length, movidas };
}
