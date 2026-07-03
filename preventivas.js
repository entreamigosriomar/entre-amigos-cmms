import { listEquipamentos, listPreventivas, createPreventiva, getPreventiva, concluirPreventiva, createOS } from "../services/api.js";
import { navigate } from "../router.js";

export async function renderPreventivas() {
  const prev = await listPreventivas();
  return `
    <div class="hero-row">
      <div>
        <h1>Preventivas</h1>
        <p>Rotinas programadas com checklist obrigatório e registro de conformidade.</p>
      </div>
      <button class="btn btn-orange" id="novaPrev">+ Nova preventiva</button>
    </div>

    <div class="grid grid-3">
      ${prev.map(p => `
        <div class="card">
          <div class="section-title"><h2>${p.equipamento || p.equipamento_id || "Equipamento"}</h2><span class="pill">${p.status}</span></div>
          <p><b>Data:</b> ${p.data || p.data_programada || ""}</p>
          <p><b>Setor:</b> ${p.setor || ""}</p>
          <div class="timeline-item">${p.checklist || p.observacoes || "Checklist a definir"}</div>
          <p><b>Itens obrigatórios:</b> ${(p.itens || []).length || 0}</p>
          <button class="btn btn-primary w-full mt executarPrev" data-id="${p.id}">Executar checklist</button>
        </div>
      `).join("") || `<div class="empty-state">Nenhuma preventiva cadastrada.</div>`}
    </div>
    <div id="modalRoot"></div>
  `;
}

export function bindPreventivas() {
  document.getElementById("novaPrev")?.addEventListener("click",openModal);
  document.querySelectorAll(".executarPrev").forEach(btn=>{
    btn.onclick=()=>openChecklist(btn.dataset.id);
  });
}

async function openModal(){
  const equipamentos = await listEquipamentos();
  const fritadeiraModelo = `VERIFICAR VAZAMENTO DE GÁS NAS CONEXÕES DA MANGUEIRA DO EQUIPAMENTO
VERIFICAR VAZAMENTO NA MANGUEIRA DE GÁS
VERIFICAR VAZAMENTO NA VÁLVULA TIPO BORBOLETA
REALIZAR A LIMPEZA E VERIFICAR A QUALIDADE DOS QUEIMADORES
LIMPEZA DA SUPERFÍCIE E DENTRO DA CHAMINÉ
TESTAR O FUNCIONAMENTO DO EQUIPAMENTO`;

  document.getElementById("modalRoot").innerHTML = `
    <div class="modal-backdrop">
      <div class="modal">
        <div class="modal-head"><h2>Nova preventiva</h2><button class="close-btn" id="fechar">X</button></div>
        <form id="prevForm">
          <label class="label">Equipamento</label>
          <select class="input" name="equipamento_id" required>${equipamentos.map(e=>`<option value="${e.id}">${e.nome}</option>`).join("")}</select>
          <label class="label">Data programada</label>
          <input class="input" type="date" name="data" required>
          <label class="label">Resumo da rotina</label>
          <input class="input" name="checklist" placeholder="Ex: Preventiva mensal da fritadeira">
          <label class="label">Itens obrigatórios do checklist</label>
          <textarea class="input" name="itens" id="itensPreventiva" placeholder="Digite um item por linha"></textarea>
          <button type="button" class="btn btn-light w-full mt" id="modeloFritadeira">Usar modelo de fritadeira</button>
          <button class="btn btn-primary w-full mt">Salvar preventiva</button>
        </form>
      </div>
    </div>`;
  document.getElementById("fechar").onclick=()=>document.getElementById("modalRoot").innerHTML="";
  document.getElementById("modeloFritadeira").onclick=()=>document.getElementById("itensPreventiva").value=fritadeiraModelo;
  document.getElementById("prevForm").onsubmit=async e=>{
    e.preventDefault();
    await createPreventiva(Object.fromEntries(new FormData(e.target).entries()));
    document.getElementById("modalRoot").innerHTML="";
    navigate("preventivas");
  };
}

async function openChecklist(id){
  const p = await getPreventiva(id);
  if(!p){ alert("Preventiva não encontrada."); return; }
  const itens = (p.itens && p.itens.length) ? p.itens : String(p.checklist || "").split("\\n").filter(Boolean);
  document.getElementById("modalRoot").innerHTML = `
    <div class="modal-backdrop">
      <div class="modal">
        <div class="modal-head"><h2>Executar checklist</h2><button class="close-btn" id="fechar">X</button></div>
        <p><b>${p.equipamento}</b> • ${p.setor || ""}</p>
        <form id="execChecklist">
          ${itens.map((item,i)=>`
            <div class="check-item" data-index="${i}">
              <div class="check-item-title">${i+1}. ${item}</div>
              <div class="check-actions">
                <button type="button" class="check-choice ok" data-value="CONFORME">Conforme</button>
                <button type="button" class="check-choice no" data-value="NAO_CONFORME">Não conforme</button>
              </div>
              <textarea class="input hidden obs" placeholder="Observação obrigatória quando não conforme"></textarea>
            </div>
          `).join("")}
          <label class="label">Foto da preventiva</label>
          <input class="input" type="file" accept="image/*,video/*" capture="environment">
          <div class="action-panel">
            <button class="btn btn-primary w-full">Concluir preventiva</button>
          </div>
        </form>
      </div>
    </div>`;
  document.getElementById("fechar").onclick=()=>document.getElementById("modalRoot").innerHTML="";
  document.querySelectorAll(".check-choice").forEach(btn=>{
    btn.onclick=()=>{
      const wrap=btn.closest(".check-item");
      wrap.querySelectorAll(".check-choice").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      const obs=wrap.querySelector(".obs");
      if(btn.dataset.value==="NAO_CONFORME") obs.classList.remove("hidden");
      else obs.classList.add("hidden");
    };
  });
  document.getElementById("execChecklist").onsubmit=async e=>{
    e.preventDefault();
    const respostas=[];
    let incompleto=false;
    let gerarOS=[];
    document.querySelectorAll(".check-item").forEach((wrap,i)=>{
      const item=itens[i];
      const active=wrap.querySelector(".check-choice.active");
      const obs=wrap.querySelector(".obs").value.trim();
      if(!active) incompleto=true;
      if(active?.dataset.value==="NAO_CONFORME" && !obs) incompleto=true;
      respostas.push({item,status:active?.dataset.value||"",observacao:obs});
      if(active?.dataset.value==="NAO_CONFORME") gerarOS.push({item,obs});
    });
    if(incompleto){alert("Todos os itens devem ser marcados. Quando for Não Conforme, informe a observação.");return;}
    await concluirPreventiva(id,respostas);
    for(const g of gerarOS){
      await createOS({categoria:"Preventiva",prioridade:"ALTA",descricao:`Não conformidade na preventiva de ${p.equipamento}: ${g.item}. Observação: ${g.obs}`,problema:"Não conformidade preventiva"});
    }
    alert("Preventiva concluída com sucesso." + (gerarOS.length ? " Foi gerada OS para item não conforme." : ""));
    document.getElementById("modalRoot").innerHTML="";
    navigate("preventivas");
  };
}
