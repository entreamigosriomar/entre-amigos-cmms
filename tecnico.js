import { listOrdens } from "../services/api.js";

export async function renderTecnico() {
  const ordens = await listOrdens();
  const pendentes = ordens.filter(o => o.status !== "CONCLUIDA");

  return `
    <h1>Meu Dia</h1>
    <p>Tela simples para o técnico usar no celular.</p>

    <div class="grid grid-3">
      <div class="card"><div class="kpi-title">Pendentes</div><div class="kpi-value">${pendentes.length}</div></div>
      <div class="card"><div class="kpi-title">Críticas</div><div class="kpi-value">${pendentes.filter(o => o.prioridade === "CRITICA").length}</div></div>
      <div class="card"><div class="kpi-title">Alta</div><div class="kpi-value">${pendentes.filter(o => o.prioridade === "ALTA").length}</div></div>
    </div>

    <h2>Prioridade</h2>
    <div class="grid">
      ${pendentes.slice(0,6).map(os => `
        <div class="card os-card ${os.prioridade === "CRITICA" ? "critica" : ""}">
          <b>${os.equipamento || os.equipamento_id || "Equipamento"}</b>
          <p>${os.descricao}</p>
          <span class="pill">${os.prioridade}</span>
          <button class="btn btn-primary w-full mt">Resolver agora</button>
        </div>
      `).join("")}
    </div>
  `;
}

export function bindTecnico() {}
