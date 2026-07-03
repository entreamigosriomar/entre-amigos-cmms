import { fetchDashboard } from "../services/api.js";

export async function renderRelatorios(){
  const d=await fetchDashboard();
  const concluidas=(d.ordens||[]).filter(o=>o.status==="CONCLUIDA").length;
  const abertas=(d.ordens||[]).filter(o=>o.status!=="CONCLUIDA").length;
  const total=(d.ordens||[]).length || 1;
  const perc=Math.round((concluidas/total)*100);
  return `
    <div class="hero-row">
      <div><h1>Relatórios</h1><p>Central executiva para acompanhar o piloto da manutenção no RioMar Recife.</p></div>
      <button class="btn btn-orange" onclick="window.print()">Gerar PDF</button>
    </div>
    <div class="grid grid-3">
      <div class="card"><h2>Ocorrências</h2><p><b>${abertas}</b> abertas</p><p><b>${concluidas}</b> concluídas</p><div class="progress-bar"><div class="progress-fill" style="width:${perc}%"></div></div><p>${perc}% concluídas</p></div>
      <div class="card"><h2>Preventivas</h2><p><b>${(d.preventivas||[]).length}</b> cadastradas</p><p>Rotinas obrigatórias por equipamento.</p></div>
      <div class="card"><h2>Equipamentos</h2><p><b>${(d.equipamentos||[]).length}</b> ativos cadastrados</p><p><b>${d.equipamentosParados}</b> em atenção.</p></div>
    </div>
    <div class="card mt">
      <h2>Resumo operacional</h2>
      <table class="table"><thead><tr><th>Indicador</th><th>Resultado</th></tr></thead>
      <tbody>
        <tr><td>OS abertas</td><td>${abertas}</td></tr>
        <tr><td>OS críticas</td><td>${d.criticas}</td></tr>
        <tr><td>Equipamentos em atenção</td><td>${d.equipamentosParados}</td></tr>
        <tr><td>Preventivas programadas</td><td>${d.preventivasHoje}</td></tr>
      </tbody></table>
    </div>
  `;
}
export function bindRelatorios(){}
