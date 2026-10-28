// Consultas e ações no Supabase usadas por várias telas.
import { sb } from '../config/supabase.js';
import { S, unitIds, eq, OPEN_STATUS } from './state.js';
import { monthStart, monthEnd, shiftMonth } from './util.js';

const must = r => { if (r.error) throw r.error; return r.data; };

export async function agendamentosMes(mesISO, ids = unitIds()) {
  return must(await sb.from('preventivas_agendamentos').select('*')
    .in('unidade_id', ids).gte('data_programada', monthStart(mesISO)).lte('data_programada', monthEnd(mesISO))
    .order('data_programada'));
}
export async function agendamentosAte(dataISO, ids = unitIds()) {
  // Pendentes até a data (atrasadas + do dia) e concluídas hoje
  return must(await sb.from('preventivas_agendamentos').select('*')
    .in('unidade_id', ids).lte('data_programada', dataISO).in('status', ['AGENDADA', 'EM_EXECUCAO', 'ATRASADA'])
    .order('data_programada'));
}
export async function agendamentosEquip(equipId) {
  return must(await sb.from('preventivas_agendamentos').select('*').eq('equipamento_id', equipId).order('data_programada', { ascending: false }).limit(60));
}
export async function agendamento(id) {
  return must(await sb.from('preventivas_agendamentos').select('*').eq('id', id).single());
}
export async function osAbertas(ids = unitIds()) {
  return must(await sb.from('ordens_servico').select('*').in('unidade_id', ids).in('status', OPEN_STATUS).order('data_abertura', { ascending: false }));
}
export async function osPeriodo(desdeISO, ids = unitIds()) {
  return must(await sb.from('ordens_servico').select('*').in('unidade_id', ids)
    .or(`status.in.(${OPEN_STATUS.join(',')}),data_abertura.gte.${desdeISO},data_conclusao.gte.${desdeISO}`)
    .order('data_abertura', { ascending: false }).limit(500));
}
// OS que importam para um mês fechado: abertas até o fim do mês e ainda abertas, concluídas depois dele,
// ou abertas/concluídas dentro dele. Limite superior evita que meses passados herdem dados de hoje.
export async function osDoMes(mesISO, ids = unitIds()) {
  const ini = monthStart(mesISO), prox = shiftMonth(mesISO, 1);
  return must(await sb.from('ordens_servico').select('*').in('unidade_id', ids)
    .lt('data_abertura', limiteRecife(prox))
    .or(`status.in.(${OPEN_STATUS.join(',')}),data_abertura.gte."${limiteRecife(ini)}",data_conclusao.gte."${limiteRecife(ini)}"`)
    .order('data_abertura', { ascending: false }).limit(1000));
}
// Meia-noite de Recife (UTC-3) em ISO, para comparar com colunas timestamptz.
export const limiteRecife = dia => `${dia}T00:00:00-03:00`;
export async function osById(id) {
  return must(await sb.from('ordens_servico').select('*').eq('id', id).single());
}
export async function osAnexos(osId) {
  return must(await sb.from('os_anexos').select('*').eq('os_id', osId).order('criado_em'));
}
export async function osHistorico(osId) {
  return must(await sb.from('os_historico').select('*').eq('os_id', osId).order('criado_em'));
}
export async function primeirasFotos(osIds) {
  if (!osIds.length) return {};
  const data = must(await sb.from('os_anexos').select('os_id,arquivo_url,origem,criado_em').in('os_id', osIds).eq('origem', 'abertura').order('criado_em'));
  const m = {}; data.forEach(a => { if (!m[a.os_id]) m[a.os_id] = a.arquivo_url; }); return m;
}

// ---------- Ações de OS ----------
export async function criarOS(payload, fotos) {
  const created = must(await sb.from('ordens_servico').insert(payload).select().single());
  for (const f of fotos) {
    must(await sb.from('os_anexos').insert({
      os_id: created.id, unidade_id: payload.unidade_id, usuario_id: S.user.id, tipo: 'foto', origem: 'abertura',
      arquivo_nome: f.name, arquivo_url: f.path, mime_type: f.mime, tamanho_bytes: f.size
    }));
  }
  return created;
}
export async function marcarEquipamento(equipId, status) {
  if (!equipId) return;
  const r = await sb.rpc('atualizar_status_equipamento', { p_equipamento_id: equipId, p_status: status });
  if (r.error) console.warn('Status do equipamento:', r.error.message);
  const e = eq(equipId); if (e) e.status = status;
}
export async function liberarEquipamentoSeSemOS(equipId, ignorarOsId) {
  if (!equipId) return;
  const r = await sb.from('ordens_servico').select('id', { count: 'exact', head: true })
    .eq('equipamento_id', equipId).in('status', OPEN_STATUS).neq('id', ignorarOsId || '00000000-0000-0000-0000-000000000000');
  if (!r.error && !r.count) await marcarEquipamento(equipId, 'OPERACIONAL');
}
export async function atualizarOS(id, payload) {
  return must(await sb.from('ordens_servico').update(payload).eq('id', id).select().single());
}
export async function abertasDoEquipamento(equipId) {
  if (!equipId) return [];
  return must(await sb.from('ordens_servico').select('id,numero,problema,descricao,status,data_abertura').eq('equipamento_id', equipId).in('status', OPEN_STATUS).order('data_abertura', { ascending: false }));
}

// ---------- Ações de preventiva ----------
export async function atualizarAgendamento(id, payload) {
  return must(await sb.from('preventivas_agendamentos').update(payload).eq('id', id).select().single());
}
