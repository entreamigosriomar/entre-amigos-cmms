import { fetchDashboard } from "../services/api.js";
import { navigate } from "../router.js";

export async function renderDashboard() {
  const d = await fetchDashboard();
  const ordensPrioritarias = (d.ordens || [])
    .filter(o => o.status !== "CONCLUIDA")
    .sort((a,b)=>peso(b.prioridade)-peso(a.prioridade))
    .slice(0,4);

  return `
    <div class="hero-row">
      <div>
        <h1>Dashboard RioMar Recife</h1>
        <p>Painel vivo da operação do RioMar Recife: chamados, preventivas obrigatórias, ativos críticos e ações rápidas para liderança e manutenção.</p>
      </div>
      <div class="hero-actions">
        <button class="btn btn-orange" id="novaOSHero">+ Abrir chamado</button>
        <button class="btn btn-light" id="novoEquipHero">+ Equipamento</button>
        <button class="btn btn-light" id="novaPrevHero">+ Preventiva</button>
      </div>
    </div>

    <div class="grid grid-4">
      ${kpi("📋","OS Abertas", d.osAbertas, "Chamados em andamento")}
      ${kpi("🚨","Críticas", d.criticas, "Ação imediata")}
      ${kpi("⚙️","Equip. Atenção", d.equipamentosParados, "Parado/manutenção/peça")}
      ${kpi("📅","Preventivas", d.preventivasHoje, "Programadas")}
    </div>

    <div class="grid grid-3 mt">
      <div class="card">
        <div class="section-title"><h2>Painel Operacional</h2><span class="pill">RioMar Recife</span></div>
        ${operacao("Salão", "green", "Operando")}
        ${operacao("Bar", d.ordens.some(o=>o.setor==="Bar"&&o.status!=="CONCLUIDA")?"yellow":"green", d.ordens.some(o=>o.setor==="Bar"&&o.status!=="CONCLUIDA")?"Chamado aberto":"Operando")}
        ${operacao("Cozinha", "green", "Operando")}
        ${operacao("Sushi", d.ordens.some(o=>o.setor==="Sushi"&&o.prioridade==="CRITICA")?"red":"green", d.ordens.some(o=>o.setor==="Sushi"&&o.prioridade==="CRITICA")?"Atenção crítica":"Operando")}
        ${operacao("Recepção", "green", "Operando")}
      </div>

      <div class="card">
        <div class="section-title"><h2>Ocorrências Prioritárias</h2><button class="btn btn-light" id="verOS">Ver todas</button></div>
        ${ordensPrioritarias.length ? ordensPrioritarias.map(os => `
          <div class="card os-card ${os.prioridade === "CRITICA" ? "critica" : ""}" style="box-shadow:none;margin-bottom:10px;padding:16px">
            <b>${os.equipamento || os.equipamento_id || "Equipamento"}</b><br>
            <small>${os.setor || ""} • ${os.data || ""}</small>
            <p style="margin:8px 0">${os.descricao || ""}</p>
            <span class="pill priority-${os.prioridade}">${os.prioridade || ""}</span>
            <span class="pill status-${os.status}">${os.status || ""}</span>
          </div>
        `).join("") : `<div class="empty-state">Nenhuma ocorrência aberta. Use <b>+ Abrir chamado</b> para testar.</div>`}
      </div>

      <div class="card quick-actions">
        <h2>Ações Rápidas</h2>
        <p style="color:#64748b;margin-top:-8px">Fluxos principais para iniciar o piloto.</p>
        <button class="btn btn-primary w-full" id="novaOS">+ Abrir chamado</button>
        <button class="btn btn-light w-full mt" id="equipamentos">Equipamentos</button>
        <button class="btn btn-light w-full mt" id="preventivas">Preventivas</button>
        <div class="dashboard-note mt"><b>Plano de piloto:</b><br>1) cadastrar equipamentos críticos<br>2) abrir OS reais<br>3) executar preventivas com checklist<br>4) acompanhar relatórios.</div>
      </div>
    </div>
  `;
}

function peso(p){return {BAIXA:1,MEDIA:2,ALTA:3,CRITICA:4}[p]||0}
function kpi(icon,title,value,sub) {
  return `<div class="card kpi-card"><div class="metric-icon" style="background:#001f3f">${icon}</div><div><div class="kpi-title">${title}</div><div class="kpi-value">${value}</div><small>${sub}</small></div></div>`;
}
function operacao(nome, cor, status) {
  return `<div style="padding:13px 0;border-bottom:1px solid #e5e7eb"><span class="status-dot ${cor}"></span><b>${nome}</b><span style="float:right">${status}</span></div>`;
}
export function bindDashboard() {
  ["novaOS","novaOSHero"].forEach(id=>document.getElementById(id)?.addEventListener("click", () => navigate("abrir-os")));
  document.getElementById("verOS")?.addEventListener("click", () => navigate("ordens"));
  document.getElementById("equipamentos")?.addEventListener("click", () => navigate("equipamentos"));
  document.getElementById("novoEquipHero")?.addEventListener("click", () => navigate("equipamentos"));
  document.getElementById("preventivas")?.addEventListener("click", () => navigate("preventivas"));
  document.getElementById("novaPrevHero")?.addEventListener("click", () => navigate("preventivas"));
}
