import { logout, user, isGestao, isTecnico } from "../services/auth.js";
import { navigate } from "../router.js";

export function renderLayout(content) {
  const u = user();
  const menu = menuItems();

  return `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="logo-box">
          <img src="./src/assets/logo.png" onerror="this.style.display='none';this.nextElementSibling.style.display='block'" class="logo-img">
          <div class="fallback-logo" style="display:none">ENTRE AMIGOS<br><small>Manutenção V14</small></div>
          <small>Manutenção V14</small>
        </div>
        <div style="font-size:12px;color:#cbd5e1;margin-bottom:12px">${u?.nome || ""}<br><b>${u?.role || ""}</b></div>
        <nav class="nav">
          ${menu.map(i => `<button data-route="${i.route}">${i.icon} ${i.label}</button>`).join("")}
        </nav>
      </aside>
      <main class="main">
        <header class="topbar">
          <div>
            <b>Plataforma de Manutenção Entre Amigos</b><br>
            <small>Unidade piloto: RioMar Recife</small>
          </div>
          <button class="btn btn-light" id="logoutBtn">Sair</button>
        </header>
        <section class="content">${content}</section>
      </main>
      <div class="mobile-bottom">
        ${menu.slice(0,4).map(i => `<button data-route="${i.route}"><div>${i.icon}</div>${i.short || i.label}</button>`).join("")}
      </div>
    </div>
  `;
}

function menuItems() {
  if (isTecnico()) {
    return [
      { icon: "⚒", label: "Meu Dia", short: "Meu dia", route: "tecnico" },
      { icon: "📋", label: "Ordens", short: "OS", route: "ordens" },
      { icon: "📅", label: "Preventivas", short: "Prev.", route: "preventivas" },
      { icon: "👥", label: "Usuários", short: "Users", route: "usuarios" },
      { icon: "📊", label: "Relatórios", short: "Relat.", route: "relatorios" }
    ];
  }

  if (isGestao()) {
    return [
      { icon: "⌂", label: "Dashboard", short: "Início", route: "dashboard" },
      { icon: "➕", label: "Abrir Chamado", short: "Chamado", route: "abrir-os" },
      { icon: "📋", label: "Ocorrências", short: "OS", route: "ordens" },
      { icon: "🏭", label: "Equipamentos", short: "Ativos", route: "equipamentos" },
      { icon: "📅", label: "Preventivas", short: "Prev.", route: "preventivas" },
      { icon: "👥", label: "Usuários", short: "Users", route: "usuarios" },
      { icon: "📊", label: "Relatórios", short: "Relat.", route: "relatorios" }
    ];
  }

  return [
    { icon: "➕", label: "Abrir Chamado", short: "Chamado", route: "abrir-os" },
    { icon: "📋", label: "Meus Chamados", short: "Minhas OS", route: "ordens" }
  ];
}

export function bindLayoutEvents() {
  document.querySelectorAll("[data-route]").forEach(btn => {
    btn.onclick = () => navigate(btn.dataset.route);
  });

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.onclick = async () => {
    await logout();
    navigate("login");
  };
}
