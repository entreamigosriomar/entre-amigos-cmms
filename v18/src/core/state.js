// Estado da sessão, permissões e regras de negócio compartilhadas.
import { sb } from '../config/supabase.js';
import { todayISO, monthStart, shiftMonth, daysBetween } from './util.js';

export const S = {
  user: null, profile: null,
  units: [],            // unidades ativas visíveis
  unitId: null,         // unidade atual ou 'ALL'
  base: { areas: [], setores: [], categorias: [], equipamentos: [], perfis: [] },
  lib: { rotinas: [], itens: [], loaded: false },
  route: '', params: {}
};

// ---------- Perfis ----------
export const ROLE_LABEL = { MASTER: 'Master', ADMIN: 'Administrador', DIRETOR: 'Diretor', GERENTE: 'Gerente', TECNICO: 'Técnico', OPERADOR: 'Líder' };
export const role = () => S.profile?.role;
export const isDiretoria = () => ['MASTER', 'ADMIN', 'DIRETOR'].includes(role());
export const isGestao = () => ['MASTER', 'ADMIN', 'DIRETOR', 'GERENTE'].includes(role());
export const isTecnico = () => role() === 'TECNICO';
export const isLider = () => role() === 'OPERADOR';
export const canExecute = () => isGestao() || isTecnico();
export const canSwitchUnits = () => isDiretoria();
export const canManageUsers = () => ['MASTER', 'ADMIN'].includes(role());

// ---------- Domínio ----------
export const OS_STATUS = {
  ABERTA: ['Aberta', 'p-info'], EM_EXECUCAO: ['Em execução', 'p-orange'], AGUARDANDO_PECA: ['Aguardando peça', 'p-warn'],
  AGUARDANDO_TERCEIRIZADA: ['Aguardando terceirizada', 'p-violet'], AGUARDANDO_APROVACAO: ['Aguardando aprovação', 'p-violet'],
  CONCLUIDA: ['Concluída', 'p-ok'], CANCELADA: ['Cancelada', 'p-gray']
};
export const OPEN_STATUS = ['ABERTA', 'EM_EXECUCAO', 'AGUARDANDO_PECA', 'AGUARDANDO_TERCEIRIZADA', 'AGUARDANDO_APROVACAO'];
export const PRIO = {
  CRITICA: ['Crítica', 'p-bad', 4, '4 horas'], ALTA: ['Alta', 'p-orange', 3, '1 dia'],
  MEDIA: ['Média', 'p-info', 2, '3 dias'], BAIXA: ['Baixa', 'p-ok', 1, '5 dias']
};
export const CRIT = { CRITICA: ['Crítica', 'p-bad'], ALTA: ['Alta', 'p-orange'], NORMAL: ['Normal', 'p-gray'] };
export const CRIT_TO_PRIO = { CRITICA: 'CRITICA', ALTA: 'ALTA', NORMAL: 'MEDIA' };
export const SITUACAO = {
  PENDENTE: ['Pendente', 'p-info', '#2F5FB3'], ATRASADA: ['Atrasada', 'p-bad', '#B42318'],
  CONCLUIDA: ['Concluída', 'p-ok', '#1F7A45'], CONCLUIDA_NC: ['Concluída com NC', 'p-warn', '#B7791F'],
  VALIDAR: ['Aguardando validação', 'p-violet', '#7C3AED'], CANCELADA: ['Cancelada', 'p-gray', '#8A97AD']
};
export const FREQ = {
  DIARIA: 'Diária', SEMANAL: 'Semanal', QUINZENAL: 'Quinzenal', MENSAL: 'Mensal', BIMESTRAL: 'Bimestral',
  TRIMESTRAL: 'Trimestral', QUADRIMESTRAL: 'Quadrimestral', SEMESTRAL: 'Semestral', ANUAL: 'Anual', QUINQUENAL: 'A cada 5 anos'
};
export const EXEC = { INTERNA: 'Equipe da loja', TERCEIRIZADA: 'Terceirizada', SHOPPING: 'Shopping' };
export const FAMILIA = {
  CLI: 'Climatização', REF: 'Refrigeração', GAS: 'Cocção a gás', COC: 'Cocção elétrica e fornos', EXA: 'Exaustão',
  LAV: 'Lavagem e gelo', INC: 'Incêndio e gás', ELE: 'Elétrica e energia', TI: 'Tecnologia', PRE: 'Predial', OUT: 'Outros'
};
export const TIPOS_SEM_PREVENTIVA = ['Mobiliário', 'TI e KDS', 'Predial e estrutura', 'Outro equipamento'];
export const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// Situação de uma preventiva — mesma regra da função situacao_preventiva() do banco.
export function situacao(a, hoje = todayISO()) {
  if (a.status === 'CANCELADA') return 'CANCELADA';
  if (a.status === 'CONCLUIDA') {
    if (a.tipo_execucao && a.tipo_execucao !== 'INTERNA' && !a.validado_em) return 'VALIDAR';
    return a.com_nc ? 'CONCLUIDA_NC' : 'CONCLUIDA';
  }
  return a.data_programada < hoje ? 'ATRASADA' : 'PENDENTE';
}
export const isDone = a => a.status === 'CONCLUIDA';
export const diasAtraso = a => Math.max(0, daysBetween(a.data_programada, todayISO()));

// Checklist da preventiva: formato novo (objetos) ou antigo (lista de textos)
export function checklistItens(a) {
  let arr = a.checklist_itens;
  if (!Array.isArray(arr)) {
    try { arr = JSON.parse(a.observacoes || '{}').itens || []; } catch { arr = []; }
  }
  return arr.map((it, i) => typeof it === 'string'
    ? { item_id: null, ordem: i + 1, texto: it, tipo: 'VERIFICACAO', criterio: '', criticidade: 'ALTA', foto: false, bloqueio: false }
    : it);
}
export function resumoAg(a) {
  try { return JSON.parse(a.observacoes || '{}').resumo || 'Preventiva'; } catch { return a.observacoes || 'Preventiva'; }
}
export function codigoAg(a) {
  return rotina(a.rotina_id)?.codigo || (resumoAg(a).match(/^[A-Z]{2,3}-[A-Z0-9]{2,4}-[A-Z0-9]{1,2}/) || [''])[0];
}

// ---------- Lookups ----------
export const unitName = id => S.units.find(u => u.id === id)?.nome || '—';
export const currentUnitName = () => S.unitId === 'ALL' ? 'Todas as unidades' : unitName(S.unitId);
export const eq = id => S.base.equipamentos.find(e => e.id === id);
export const eqName = id => eq(id)?.nome || '—';
export const areaName = id => S.base.areas.find(a => a.id === id)?.nome || '—';
export const setorName = id => S.base.setores.find(s => s.id === id)?.nome || '—';
export const personName = id => S.base.perfis.find(p => p.id === id)?.nome || '—';
export const rotina = id => S.lib.rotinas.find(r => r.id === id);
export const rotinasDoTipo = tipo => S.lib.rotinas.filter(r => r.ativo && r.tipo_equipamento === tipo);
export const tiposBiblioteca = () => [...new Set(S.lib.rotinas.filter(r => r.ativo).map(r => r.tipo_equipamento))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
export const unitIds = () => S.unitId === 'ALL' ? S.units.map(u => u.id) : [S.unitId];
export const workUnitId = () => S.unitId === 'ALL' ? (S.profile.unidade_id || S.units[0]?.id) : S.unitId;

// ---------- Carga ----------
export async function loadProfile() {
  const { data, error } = await sb.from('perfis').select('*').eq('id', S.user.id).single();
  if (error || !data) throw new Error('Seu usuário não tem perfil cadastrado. Fale com a diretoria.');
  if (!data.ativo) throw new Error('Seu usuário está inativo. Fale com a diretoria.');
  S.profile = data;
}

export async function loadUnits() {
  const { data, error } = await sb.from('unidades').select('id,nome,ativo').eq('ativo', true).order('nome');
  if (error) throw error;
  S.units = canSwitchUnits() ? (data || []) : (data || []).filter(u => u.id === S.profile.unidade_id);
  if (!S.units.length) throw new Error('Nenhuma unidade disponível para o seu usuário.');
  let saved = null;
  try { saved = localStorage.getItem('ea.unit'); } catch { /* sem storage */ }
  if (canSwitchUnits()) S.unitId = (saved === 'ALL' || S.units.some(u => u.id === saved)) ? saved : 'ALL';
  else S.unitId = S.profile.unidade_id;
}

export async function setUnit(id) {
  S.unitId = id;
  try { localStorage.setItem('ea.unit', id); } catch { /* sem storage */ }
  await loadBase();
}

export async function loadBase() {
  const ids = unitIds();
  const [ar, se, ca, eqs, pf] = await Promise.all([
    sb.from('areas').select('*').in('unidade_id', ids).eq('ativo', true).order('nome'),
    sb.from('setores').select('*').in('unidade_id', ids).eq('ativo', true).order('nome'),
    sb.from('categorias_manutencao').select('*').in('unidade_id', ids).eq('ativo', true).order('nome'),
    sb.from('equipamentos').select('*').in('unidade_id', ids).eq('ativo', true).order('nome'),
    sb.from('perfis').select('id,nome,email,role,unidade_id,ativo').order('nome')
  ]);
  for (const r of [ar, se, ca, eqs, pf]) if (r.error) console.warn(r.error);
  S.base = { areas: ar.data || [], setores: se.data || [], categorias: ca.data || [], equipamentos: eqs.data || [], perfis: pf.data || [] };
}

export async function loadLibrary(force = false) {
  if (S.lib.loaded && !force) return;
  const [r, i] = await Promise.all([
    sb.from('preventiva_rotinas').select('*').order('codigo'),
    sb.from('preventiva_rotina_itens').select('*').order('ordem')
  ]);
  if (r.error) { console.warn(r.error); S.lib = { rotinas: [], itens: [], loaded: true }; return; }
  S.lib = { rotinas: r.data || [], itens: i.data || [], loaded: true };
}

// Geração automática: garante as preventivas do mês (e do próximo, na última semana).
export async function ensureMonthGenerated() {
  if (!canExecute()) return 0;
  let total = 0;
  const hoje = todayISO();
  const meses = [monthStart(hoje)];
  if (Number(hoje.slice(8, 10)) >= 24) meses.push(shiftMonth(hoje, 1));
  for (const uid of unitIds()) {
    for (const m of meses) {
      const { data, error } = await sb.rpc('gerar_preventivas_mes', { p_unidade_id: uid, p_mes: m });
      if (error) { console.warn('Geração automática:', error.message); return total; }
      total += Number(data || 0);
    }
  }
  return total;
}
