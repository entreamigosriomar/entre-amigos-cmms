// Calendário dos planos de preventiva (espelha public.datas_plano_no_mes do banco).
import { todayISO, monthStart, shiftMonth } from './util.js';

export const PASSO_MESES = { MENSAL: 1, BIMESTRAL: 2, TRIMESTRAL: 3, QUADRIMESTRAL: 4, SEMESTRAL: 6, ANUAL: 12, QUINQUENAL: 60 };
// Frequências em que a "última vez feita" define quando começa o ciclo.
export const FREQ_LONGAS = ['TRIMESTRAL', 'QUADRIMESTRAL', 'SEMESTRAL', 'ANUAL', 'QUINQUENAL'];

const iso = d => d.toISOString().slice(0, 10);
const D = s => new Date(s + 'T00:00:00Z');
const mesesEntre = (a, b) => (Number(b.slice(0, 4)) * 12 + Number(b.slice(5, 7))) - (Number(a.slice(0, 4)) * 12 + Number(a.slice(5, 7)));
const fimMes = m => iso(new Date(Date.UTC(Number(m.slice(0, 4)), Number(m.slice(5, 7)), 0)));

/** Próxima data estimada a partir da última vez feita (última + período). */
export function proximaPelaUltima(ultima, freq) {
  const passo = PASSO_MESES[freq];
  if (!ultima || !passo) return null;
  return shiftMonth(monthStart(ultima), passo).slice(0, 8) + ultima.slice(8, 10).replace(/^(29|30|31)$/, '28');
}

/** Data de início do plano: mês da próxima estimada; se já venceu, o mês atual (entra já). */
export function inicioPelaUltima(ultima, freq, hoje = todayISO()) {
  const prox = proximaPelaUltima(ultima, freq);
  if (!prox || !FREQ_LONGAS.includes(freq)) return hoje;
  return prox.slice(0, 7) <= hoje.slice(0, 7) ? hoje : monthStart(prox);
}

/** Datas previstas de um plano dentro de um mês (mesma regra do banco). */
export function datasNoMes(p, mesISO) {
  const ini = monthStart(mesISO), fim = fimMes(ini), inicio = p.data_inicio;
  if (fim < inicio) return [];
  const out = [];
  if (p.frequencia === 'DIARIA') {
    for (let d = D(ini > inicio ? ini : inicio); iso(d) <= fim; d.setUTCDate(d.getUTCDate() + 1)) out.push(iso(d));
    return out;
  }
  if (['SEMANAL', 'QUINZENAL'].includes(p.frequencia)) {
    const ds = p.dia_semana ?? 1, a = D(inicio), ancora = new Date(a); ancora.setUTCDate(a.getUTCDate() + ((ds - a.getUTCDay() + 7) % 7));
    const d = D(ini); d.setUTCDate(d.getUTCDate() + ((ds - d.getUTCDay() + 7) % 7));
    for (; iso(d) <= fim; d.setUTCDate(d.getUTCDate() + 7)) {
      if (d >= ancora && (p.frequencia === 'SEMANAL' || Math.round((d - ancora) / 864e5 / 7) % 2 === 0)) out.push(iso(d));
    }
    return out;
  }
  const passo = PASSO_MESES[p.frequencia] || 1, n = mesesEntre(inicio, ini);
  if (n < 0 || n % passo) return [];
  let dia = ini.slice(0, 8) + String(Math.min(p.dia_previsto || 10, Number(fim.slice(8)))).padStart(2, '0');
  if (dia < inicio) dia = inicio;
  return [dia];
}

/**
 * Próxima preventiva do plano: a pendente mais antiga já gerada (pode estar atrasada);
 * senão, a primeira data do calendário depois da última gerada / de hoje.
 */
export function proximaDoPlano(p, ags = [], hoje = todayISO()) {
  const doPlano = ags.filter(a => a.plano_id === p.id);
  const pend = doPlano.filter(a => !['CONCLUIDA', 'CANCELADA'].includes(a.status)).sort((a, b) => a.data_programada.localeCompare(b.data_programada))[0];
  if (pend) return pend.data_programada;
  const ultimaGerada = doPlano.map(a => a.data_programada).sort().pop();
  const depois = ultimaGerada && ultimaGerada >= hoje ? ultimaGerada : null;
  let mes = monthStart(hoje);
  for (let i = 0; i < 64; i++, mes = shiftMonth(mes, 1)) {
    const d = datasNoMes(p, mes).find(x => (depois ? x > depois : x >= hoje));
    if (d) return d;
  }
  return null;
}
