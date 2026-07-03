import { listEquipamentos, createOS } from "../services/api.js";
import { navigate } from "../router.js";

export async function renderAbrirOS() {
  const equipamentos = await listEquipamentos();

  return `
    <div class="hero-row">
      <div>
        <h1>Abrir Chamado</h1>
        <p>Fluxo rápido para líderes registrarem problemas com foto e prioridade.</p>
      </div>
      <button class="btn btn-light" id="voltarDash">Voltar</button>
    </div>

    <div class="card">
      <form id="osForm">
        <div class="form-grid">
          <div>
            <label class="label">Categoria</label>
            <select class="input" name="categoria">
              <option>Equipamento</option><option>Limpeza</option><option>Estrutural</option><option>Elétrica</option><option>Hidráulica</option><option>Segurança</option>
            </select>
          </div>
          <div>
            <label class="label">Equipamento</label>
            <select class="input" name="equipamento_id">
              <option value="">Não se aplica</option>
              ${equipamentos.map(e => `<option value="${e.id}">${e.nome} • ${e.setor || ""}</option>`).join("")}
            </select>
          </div>
          <div>
            <label class="label">Prioridade</label>
            <select class="input" name="prioridade">
              <option value="BAIXA">Baixa - 5 dias</option>
              <option value="MEDIA" selected>Média - 3 dias</option>
              <option value="ALTA">Alta - 1 dia</option>
              <option value="CRITICA">Crítica - 4 horas</option>
            </select>
          </div>
          <div>
            <label class="label">Problema</label>
            <input class="input" name="problema" placeholder="Ex: vazamento, não liga, limpeza..." />
          </div>
        </div>

        <label class="label">Descrição do problema</label>
        <textarea class="input" name="descricao" required placeholder="Descreva o problema de forma objetiva"></textarea>

        <label class="label">Foto ou vídeo</label>
        <input class="input" type="file" name="foto" accept="image/*,video/*" capture="environment">

        <button class="btn btn-primary w-full mt">Enviar chamado</button>
      </form>
    </div>
  `;
}

export function bindAbrirOS() {
  document.getElementById("voltarDash")?.addEventListener("click",()=>navigate("dashboard"));
  document.getElementById("osForm").onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    const btn = e.target.querySelector("button[type='submit'],button:last-child");
    btn.disabled = true;
    btn.textContent = "Enviando...";
    try {
      await createOS(data);
      alert("Chamado aberto com sucesso.");
      navigate("ordens");
    } catch (err) {
      alert("Erro ao abrir chamado: " + (err.message || err));
      btn.disabled = false;
      btn.textContent = "Enviar chamado";
    }
  };
}
