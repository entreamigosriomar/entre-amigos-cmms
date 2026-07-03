import { listEquipamentos, createEquipamento } from "../services/api.js";
import { navigate } from "../router.js";

export async function renderEquipamentos() {
  const equipamentos = await listEquipamentos();
  return `
    <div class="hero-row">
      <div>
        <h1>Equipamentos</h1>
        <p>Cadastro inicial dos ativos do RioMar Recife com status, criticidade e QR Code.</p>
      </div>
      <button class="btn btn-orange" id="novoEquip">+ Novo equipamento</button>
    </div>

    <div class="grid grid-3">
      ${equipamentos.map(e => `
        <div class="card">
          <div class="section-title"><h2>${e.nome}</h2><span class="pill">${e.status}</span></div>
          <p><b>Setor:</b> ${e.setor || e.setor_id || "-"}</p>
          <p><b>Área:</b> ${e.area || e.area_id || "-"}</p>
          <p><b>Criticidade:</b> ${e.criticidade || "-"}</p>
          <div class="qr-tag">QR<br>${e.tag || e.id}</div>
          <button class="btn btn-light w-full mt">Ver ficha 360º</button>
        </div>
      `).join("")}
    </div>

    <div id="modalRoot"></div>
  `;
}
export function bindEquipamentos() {
  document.getElementById("novoEquip")?.addEventListener("click",openModal);
}
function openModal(){
  document.getElementById("modalRoot").innerHTML = `
    <div class="modal-backdrop">
      <div class="modal">
        <div class="modal-head"><h2>Novo equipamento</h2><button class="close-btn" id="fechar">X</button></div>
        <form id="equipForm">
          <div class="form-grid">
            <div><label class="label">Nome</label><input class="input" name="nome" required placeholder="Ex: Câmara Fria 01"></div>
            <div><label class="label">Setor</label><input class="input" name="setor" required placeholder="Ex: Cozinha"></div>
            <div><label class="label">Área</label><input class="input" name="area" placeholder="Ex: Cozinha Quente"></div>
            <div><label class="label">Fabricante</label><input class="input" name="fabricante"></div>
            <div><label class="label">Status</label><select class="input" name="status"><option>OPERACIONAL</option><option>EM_MANUTENCAO</option><option>PARADO</option><option>AGUARDANDO_PECA</option></select></div>
            <div><label class="label">Criticidade</label><select class="input" name="criticidade"><option>BAIXA</option><option>MEDIA</option><option>ALTA</option><option>CRITICA</option></select></div>
          </div>
          <button class="btn btn-primary w-full mt">Salvar equipamento</button>
        </form>
      </div>
    </div>`;
  document.getElementById("fechar").onclick=()=>document.getElementById("modalRoot").innerHTML="";
  document.getElementById("equipForm").onsubmit=async e=>{
    e.preventDefault();
    await createEquipamento(Object.fromEntries(new FormData(e.target).entries()));
    document.getElementById("modalRoot").innerHTML="";
    navigate("equipamentos");
  };
}
