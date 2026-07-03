import { getSessionProfile } from "./services/auth.js";
import { startRouter } from "./router.js";

function showError(err){
  const app = document.getElementById("app");
  if(!app) return;
  app.innerHTML = `
    <div class="error-screen">
      <div class="error-card">
        <h1>Erro ao abrir o sistema</h1>
        <p><b>Mensagem:</b> ${err?.message || err || "Erro desconhecido"}</p>
        <p>Confira se você abriu a pasta correta e se o arquivo <code>src/supabase/config.js</code> está preenchido.</p>
        <button class="btn btn-primary" onclick="location.reload()">Atualizar</button>
      </div>
    </div>`;
}

window.addEventListener("error", e => showError(e.error || e.message));
window.addEventListener("unhandledrejection", e => showError(e.reason || e));

async function boot() {
  try {
    await getSessionProfile();
    await startRouter();
  } catch (err) {
    console.warn(err);
    try { await startRouter(); }
    catch (e) { showError(e); }
  }
}

boot();
