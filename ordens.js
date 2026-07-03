import { listOrdens, updateOSStatus } from "../services/api.js";
import { navigate } from "../router.js";

export async function renderOrdens() {
  const ordens = await listOrdens();
  const abertas = ordens.filter(o=>o.status!=="CONCLUIDA").sort((a,b)=>peso(b.prioridade)-peso(a.prioridade));
  return `
    <div class="hero-row">
      <div>
        <h1>Ocorrências / OS</h1>
        <p>Fila priorizada por criticidade. Críticas e atrasadas devem ficar sempre no topo.</p>
      </div>
      <button class="btn btn-orange" id="novaOS">+ Nova OS</button>
    </div>

    <div class="grid">
      ${abertas.map(os => `
        <div class="card os-card ${os.prioridade === "CRITICA" ? "critica" : ""}">
          <div class="os-row">
            <div class="os-photo">📷</div>
            <div>
              <b style="font-size:20px">${os.equipamento || os.equipamento_id || "Equipamento"}</b><br>
              <small>${os.setor || ""} • ${os.data || ""} • Nº ${os.numero || os.id}</small>
              <p>${os.descricao || ""}</p>
              <span class="pill priority-${os.prioridade}">${os.prioridade}</span>
              <span class="pill status-${os.status}">${os.status}</span>
            </div>
            <div style="min-width:190px">
              <button class="btn btn-primary w-full resolver" data-id="${os.id}">Resolver agora</button>
              <button class="btn btn-light w-full mt concluir" data-id="${os.id}">Concluir</button>
            </div>
          </div>
        </div>
      `).join("") || `<div class="empty-state">Nenhuma OS aberta. Clique em <b>+ Nova OS</b>.</div>`}
    </div>
  `;
}
function peso(p){return {BAIXA:1,MEDIA:2,ALTA:3,CRITICA:4}[p]||0}
export function bindOrdens() {
  document.getElementById("novaOS")?.addEventListener("click",()=>navigate("abrir-os"));
  document.querySelectorAll(".resolver").forEach(b=>b.onclick=async()=>{
    await updateOSStatus(b.dataset.id,"EM_EXECUCAO");
    alert("OS colocada em execução. Agora o técnico pode concluir quando finalizar.");
    navigate("ordens");
  });
  document.querySelectorAll(".concluir").forEach(b=>b.onclick=async()=>{if(confirm("Concluir esta OS?")){await updateOSStatus(b.dataset.id,"CONCLUIDA");navigate("ordens")}});
}
