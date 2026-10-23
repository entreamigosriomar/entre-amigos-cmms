// Utilidades de tela: escape, formatos pt-BR, datas no fuso de Recife, ícones, toast e modal.

export const TZ = 'America/Recife';

export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[s]));
}

export const money = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const moneyShort = v => 'R$ ' + Math.round(Number(v || 0)).toLocaleString('pt-BR');
export const num = (v, d = 0) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
export const pct = v => Math.round(v) + '%';

// Datas: "hoje" e comparações sempre no horário de Recife, como no banco.
export function todayISO() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: TZ });
}
export function isoDate(d) {
  return d.toLocaleDateString('sv-SE', { timeZone: TZ });
}
export function addDaysISO(iso, n) {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
export function monthStart(iso) { return iso.slice(0, 7) + '-01'; }
export function monthEnd(iso) {
  const [y, m] = iso.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return `${iso.slice(0, 7)}-${String(last).padStart(2, '0')}`;
}
export function shiftMonth(iso, n) {
  const [y, m] = iso.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}
export function monthLabel(iso) {
  const [y, m] = iso.split('-').map(Number);
  const s = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1).replace(' de ', ' ');
}
export function brDate(iso) {
  if (!iso) return '—';
  const s = String(iso);
  if (s.length === 10) return s.slice(8, 10) + '/' + s.slice(5, 7);
  return new Date(s).toLocaleDateString('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit' });
}
export function brDateFull(iso) {
  if (!iso) return '—';
  const s = String(iso);
  if (s.length === 10) return s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4);
  return new Date(s).toLocaleDateString('pt-BR', { timeZone: TZ });
}
export function brDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}
export function daysBetween(aISO, bISO) {
  return Math.round((new Date(bISO + 'T12:00:00') - new Date(aISO + 'T12:00:00')) / 86400000);
}
export function since(ts) {
  if (!ts) return '';
  const min = Math.max(0, Math.floor((Date.now() - new Date(ts).getTime()) / 60000));
  const h = Math.floor(min / 60), d = Math.floor(h / 24);
  if (d > 0) return d === 1 ? '1 dia' : `${d} dias`;
  if (h > 0) return `${h} h`;
  return `${min} min`;
}
export function weekdayLong(iso = todayISO()) {
  const s = new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
export function greeting() {
  const h = Number(new Date().toLocaleString('en-US', { timeZone: TZ, hour: '2-digit', hour12: false }));
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}
export function initials(name) {
  return String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');
}

// ---------- Ícones (traço, sem emoji) ----------
const P = {
  painel: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  calendario: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 15l2 2 4-4"/>',
  chave: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
  maleta: '<rect x="2" y="7" width="20" height="13" rx="2"/><path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M2 13h20"/>',
  livro: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M8 7h8M8 11h6"/>',
  check: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  grafico: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
  pessoa: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  casa: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  sair: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  esq: '<path d="M15 6l-6 6 6 6"/>',
  dir: '<path d="M9 6l6 6-6 6"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  ok: '<path d="M5 12l5 5L20 7"/>',
  camera: '<path d="M3 7h4l2-3h6l2 3h4v13H3z"/><circle cx="12" cy="13" r="4"/>',
  galeria: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 8"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  upload: '<path d="M12 21V9M7 14l5-5 5 5M5 3h14"/>',
  lista: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  local: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  sino: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>',
  editar: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  lixo: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
  cima: '<path d="M6 15l6-6 6 6"/>',
  baixo: '<path d="M6 9l6 6 6-6"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  engrenagem: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  alerta: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  imprimir: '<path d="M6 9V2h12v7"/><rect x="6" y="14" width="12" height="8"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>'
};
export function icon(name, size = 20, sw = 2) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;
}

// ---------- Toast ----------
export function toast(msg, kind = '') {
  const root = document.getElementById('toastRoot');
  if (!root) return;
  const el = document.createElement('div');
  el.className = 'toast' + (kind ? ' ' + kind : '');
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(() => el.remove(), kind === 'bad' ? 5000 : 2800);
}

// ---------- Modal ----------
export function openModal(html, { size = '' } = {}) {
  const root = document.getElementById('modalRoot');
  root.innerHTML = `<div class="modal-bg" data-close-bg><div class="modal ${size}" role="dialog" aria-modal="true">${html}</div></div>`;
  root.querySelector('[data-close-bg]').addEventListener('mousedown', e => { if (e.target.hasAttribute('data-close-bg')) closeModal(); });
  root.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeModal));
  const first = root.querySelector('input,select,textarea,button:not([data-close])');
  first?.focus();
  return root.querySelector('.modal');
}
export function closeModal() {
  const root = document.getElementById('modalRoot');
  if (root) root.innerHTML = '';
}
export function modalHead(title, sub = '') {
  return `<div class="modal-head"><div><h2>${esc(title)}</h2>${sub ? `<div class="muted small">${sub}</div>` : ''}</div><button type="button" class="icon-btn" data-close aria-label="Fechar">${icon('x')}</button></div>`;
}
export function confirmDialog(title, text, okLabel = 'Confirmar', danger = false) {
  return new Promise(resolve => {
    const m = openModal(`${modalHead(title)}<p>${esc(text)}</p><div class="modal-foot"><button type="button" class="btn btn-light" data-no>Voltar</button><button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-yes>${esc(okLabel)}</button></div>`, { size: 'sm' });
    m.querySelector('[data-no]').onclick = () => { closeModal(); resolve(false); };
    m.querySelector('[data-yes]').onclick = () => { closeModal(); resolve(true); };
    m.querySelector('[data-close]').onclick = () => { closeModal(); resolve(false); };
  });
}

// Botão com proteção contra duplo envio
export async function busy(btn, label, fn) {
  if (btn?.dataset.busy) return;
  const old = btn?.innerHTML;
  if (btn) { btn.dataset.busy = '1'; btn.disabled = true; if (label) btn.textContent = label; }
  try { return await fn(); }
  finally { if (btn && btn.isConnected) { delete btn.dataset.busy; btn.disabled = false; btn.innerHTML = old; } }
}

export function errMsg(e) {
  const m = e?.message || String(e);
  if (/row-level security|permission denied/i.test(m)) return 'Sem permissão para esta ação.';
  if (/duplicate key|unique/i.test(m)) return 'Já existe um registro igual.';
  if (/Failed to fetch|NetworkError/i.test(m)) return 'Sem conexão. Verifique a internet e tente de novo.';
  return m;
}

export function safeStore(key, value) {
  try {
    if (value === undefined) return JSON.parse(localStorage.getItem(key) || 'null');
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch { return null; }
}
