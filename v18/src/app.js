// Manutenção Entre Amigos — V18.1
// Entrada do app: sessão, layout (menu lateral / barra inferior) e rotas por hash (#/rota).
import { sb, LOGO } from './config/supabase.js';
import { S, loadProfile, loadUnits, loadBase, loadLibrary, setUnit, ensureMonthGenerated, isDiretoria, isTecnico, isLider, canSwitchUnits, ROLE_LABEL, currentUnitName } from './core/state.js';
import { esc, icon, initials, toast, closeModal, errMsg } from './core/util.js';
import { renderLogin } from './pages/login.js';
import { go } from './core/nav.js';

const PAGES = {
  painel: () => import('./pages/painel.js'),
  controle: () => import('./pages/controle.js'),
  ordens: () => import('./pages/ordens.js'),
  equipamentos: () => import('./pages/equipamentos.js'),
  biblioteca: () => import('./pages/biblioteca.js'),
  cadastros: () => import('./pages/cadastros.js'),
  importar: () => import('./pages/importar.js'),
  usuarios: () => import('./pages/usuarios.js'),
  meudia: () => import('./pages/meudia.js'),
  checklist: () => import('./pages/checklist.js'),
  chamados: () => import('./pages/chamados.js'),
  abrir: () => import('./pages/abrir.js')
};

function menu() {
  if (isLider()) return [{ items: [['chamados', 'lista', 'Meus chamados'], ['abrir', 'mais', 'Abrir chamado']] }];
  if (isTecnico()) return [{ items: [['meudia', 'casa', 'Meu dia'], ['controle', 'calendario', 'Preventivas'], ['ordens', 'chave', 'Ordens de serviço'], ['equipamentos', 'maleta', 'Equipamentos'], ['abrir', 'mais', 'Abrir chamado']] }];
  const g = [{ label: 'Gestão', items: [['painel', 'painel', 'Painel'], ['controle', 'calendario', 'Controle mensal'], ['ordens', 'chave', 'Ordens de serviço'], ['equipamentos', 'maleta', 'Equipamentos'], ['abrir', 'mais', 'Abrir chamado']] }];
  if (isDiretoria()) {
    g.push({ label: 'Diretoria', items: [['biblioteca', 'livro', 'Biblioteca de rotinas'], ['cadastros', 'local', 'Áreas e categorias'], ['importar', 'upload', 'Importar planilha'], ['usuarios', 'pessoa', 'Usuários']] });
  }
  return g;
}
const homeRoute = () => isLider() ? 'chamados' : isTecnico() ? 'meudia' : 'painel';
const allowed = r => r === 'checklist' ? !isLider() : menu().some(g => g.items.some(i => i[0] === r));

function parseHash() {
  const h = location.hash.replace(/^#\/?/, '');
  const [path, qs] = h.split('?');
  return { route: path || homeRoute(), params: Object.fromEntries(new URLSearchParams(qs || '')) };
}
window.addEventListener('hashchange', () => renderRoute());

function unitSelect() {
  return `<select class="select" data-unit aria-label="Unidade"><option value="ALL" ${S.unitId === 'ALL' ? 'selected' : ''}>Todas as unidades</option>${S.units.map(u => `<option value="${u.id}" ${u.id === S.unitId ? 'selected' : ''}>${esc(u.nome)}</option>`).join('')}</select>`;
}
const shortLabel = t => t.replace('Ordens de serviço', 'OS').replace('Controle mensal', 'Preventivas').replace('Biblioteca de rotinas', 'Biblioteca').replace('Áreas e categorias', 'Cadastros').replace('Importar planilha', 'Importar');

function renderShell() {
  const groups = menu();
  const flat = groups.flatMap(g => g.items);
  const bottom = flat.length > 5 ? flat.slice(0, 5) : flat;
  document.getElementById('app').innerHTML = `
  <div class="shell">
    <aside class="side" aria-label="Menu principal">
      <div class="side-logo"><img src="${LOGO}" alt="Entre Amigos"></div>
      ${canSwitchUnits() ? `<label class="field" style="color:var(--navy-mute);padding:0 4px">Unidade${unitSelect()}</label>` : `<div class="small" style="padding:0 12px;color:var(--navy-ink)">${esc(currentUnitName())}</div>`}
      ${groups.map(g => `<nav class="nav-group">${g.label ? `<span class="nav-label">${g.label}</span>` : ''}${g.items.map(i => `<a class="nav-item" href="#/${i[0]}" data-nav="${i[0]}">${icon(i[1])}${i[2]}</a>`).join('')}</nav>`).join('')}
      <div class="side-user"><div class="avatar">${esc(initials(S.profile.nome))}</div><div><b>${esc(S.profile.nome)}</b><span>${esc(ROLE_LABEL[S.profile.role] || S.profile.role)}</span></div><button type="button" data-logout aria-label="Sair">${icon('sair', 18)}</button></div>
    </aside>
    <div style="flex:1;min-width:0;display:flex;flex-direction:column">
      <header class="mobile-top">
        <img src="${LOGO}" alt="Entre Amigos">
        <div class="u"><b>${esc(S.profile.nome)}</b>${esc(canSwitchUnits() ? (ROLE_LABEL[S.profile.role] || '') : currentUnitName())}</div>
        ${canSwitchUnits() ? unitSelect() : ''}
        <button type="button" class="icon-btn" data-logout aria-label="Sair" style="background:var(--navy-2);border:0;color:#fff">${icon('sair', 18)}</button>
      </header>
      <main class="main" id="page"></main>
    </div>
    <nav class="bottom-nav" aria-label="Navegação">${bottom.map(i => `<button type="button" data-go="${i[0]}" data-nav="${i[0]}">${icon(i[1], 22)}${shortLabel(i[2])}</button>`).join('')}</nav>
  </div>`;
  document.querySelectorAll('[data-logout]').forEach(b => b.onclick = async () => { await sb.auth.signOut(); location.hash = ''; location.reload(); });
  document.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
  document.querySelectorAll('[data-unit]').forEach(sel => sel.onchange = async e => {
    try { await setUnit(e.target.value); renderShell(); await renderRoute(); toast('Unidade: ' + currentUnitName()); }
    catch (err) { toast(errMsg(err), 'bad'); }
  });
}

let renderSeq = 0;
export async function renderRoute() {
  if (!S.profile) return;
  const { route, params } = parseHash();
  const r = allowed(route) && PAGES[route] ? route : homeRoute();
  S.route = r; S.params = params;
  document.body.classList.toggle('flow', ['abrir', 'checklist'].includes(r));
  document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === r));
  const el = document.getElementById('page');
  if (!el) return;
  closeModal();
  const seq = ++renderSeq;
  el.innerHTML = '<div class="empty">Carregando…</div>';
  try {
    const mod = await PAGES[r]();
    if (seq !== renderSeq) return;
    await mod.render(el, params);
  } catch (e) {
    console.error(e);
    if (seq === renderSeq) el.innerHTML = `<div class="card"><h2 class="card-title">Não foi possível abrir esta tela</h2><p class="muted">${esc(errMsg(e))}</p><div><button class="btn btn-light" onclick="location.reload()">Tentar de novo</button></div></div>`;
  }
}
window.__eaRefresh = renderRoute;

async function bootstrap() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { renderLogin(); return; }
  S.user = session.user;
  await loadProfile();
  await loadUnits();
  await Promise.all([loadBase(), loadLibrary()]);
  renderShell();
  const first = renderRoute();
  ensureMonthGenerated()
    .then(async n => { await first; if (n > 0 && ['controle', 'meudia', 'painel'].includes(S.route)) renderRoute(); })
    .catch(e => console.warn(e));
  await first;
}

bootstrap().catch(e => {
  console.error(e);
  document.getElementById('app').innerHTML = `<div class="login"><div class="login-box"><img src="${LOGO}" alt="Entre Amigos"><h1>Não foi possível abrir</h1><p class="muted" style="text-align:center">${esc(errMsg(e))}</p><button class="btn btn-primary" onclick="location.reload()">Tentar de novo</button><button class="btn btn-ghost" id="sairErro">Sair</button></div></div>`;
  document.getElementById('sairErro').onclick = async () => { await sb.auth.signOut(); location.reload(); };
});
