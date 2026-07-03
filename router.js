import { user, isTecnico } from "./services/auth.js";
import { renderLayout, bindLayoutEvents } from "./components/layout.js";
import { renderLogin, bindLogin } from "./pages/login.js";
import { renderDashboard, bindDashboard } from "./pages/dashboard.js";
import { renderAbrirOS, bindAbrirOS } from "./pages/abrirOS.js";
import { renderOrdens, bindOrdens } from "./pages/ordens.js";
import { renderEquipamentos, bindEquipamentos } from "./pages/equipamentos.js";
import { renderPreventivas, bindPreventivas } from "./pages/preventivas.js";
import { renderTecnico, bindTecnico } from "./pages/tecnico.js";
import { renderUsuarios, bindUsuarios } from "./pages/usuarios.js";
import { renderRelatorios, bindRelatorios } from "./pages/relatorios.js";

const app = document.getElementById("app");

const routes = {
  "login": [renderLogin, bindLogin, false],
  "dashboard": [renderDashboard, bindDashboard, true],
  "abrir-os": [renderAbrirOS, bindAbrirOS, true],
  "ordens": [renderOrdens, bindOrdens, true],
  "equipamentos": [renderEquipamentos, bindEquipamentos, true],
  "preventivas": [renderPreventivas, bindPreventivas, true],
  "tecnico": [renderTecnico, bindTecnico, true],
  "usuarios": [renderUsuarios, bindUsuarios, true],
  "relatorios": [renderRelatorios, bindRelatorios, true]
};

export async function navigate(route = "dashboard") {
  if (!user() && route !== "login") route = "login";
  if (user() && route === "dashboard" && isTecnico()) route = "tecnico";

  const [render, bind, protectedRoute] = routes[route] || routes.dashboard;
  try {
    const html = await render();

    if (protectedRoute) {
      app.innerHTML = renderLayout(html);
      bindLayoutEvents();
    } else {
      app.innerHTML = html;
    }

    bind();
  } catch (err) {
    console.error(err);
    app.innerHTML = `
      <div class="error-screen">
        <div class="error-card">
          <h1>Erro ao carregar a tela</h1>
          <p>${err?.message || err}</p>
          <button class="btn btn-primary" data-route="dashboard">Voltar ao Dashboard</button>
        </div>
      </div>`;
    document.querySelector("[data-route='dashboard']")?.addEventListener("click",()=>navigate("dashboard"));
  }
}

export function startRouter() {
  navigate(user() ? "dashboard" : "login");
}
