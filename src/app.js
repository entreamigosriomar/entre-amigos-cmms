import {sb, LOGO} from './config/supabase.js';
let currentUser=null,currentProfile=null,unitId=null,currentRoute="dashboard",lastRefresh=0,availableUnits=[];
let equipment=[],sectors=[],areas=[],categories=[],orders=[],preventives=[],profiles=[];
let osFiles=[],prevFiles=[],openFiles=[],openFormDraft={},realtimeChannel=null,isSubmittingOpenOS=false;
const OS_STATUSES=["ABERTA","EM_EXECUCAO","AGUARDANDO_PECA","AGUARDANDO_TERCEIRIZADA","AGUARDANDO_APROVACAO_DIRETOR","CONCLUIDA","CANCELADA"];
const OPEN_OS_STATUSES=OS_STATUSES.filter(s=>!["CONCLUIDA","CANCELADA"].includes(s));

function esc(v){return String(v??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[s]))}
function toast(m){const t=document.createElement("div");t.className="toast";t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2600)}
function closeModal(){document.getElementById("modalRoot").innerHTML=""}
window.closeModal=closeModal;window.toast=toast;
function canManageCatalog(){
  return ["MASTER","ADMIN","DIRETOR"].includes(currentProfile?.role);
}
function isTechnician(){
  return currentProfile?.role==="TECNICO";
}
function unitPrefix(name){
  const n=(name||"").toUpperCase();
  if(n.includes("RIOMAR RECIFE"))return "RMR";
  if(n.includes("RIOMAR FORTALEZA"))return "RMF";
  if(n.includes("ESPINHEIRO"))return "ESP";
  if(n.includes("BOA VIAGEM"))return "BV";
  if(n.includes("PRAIA"))return "PRAIA";
  return "EA";
}
function canDeleteCatalog(){ return canManageCatalog(); }
function canSwitchUnits(){return ["MASTER","ADMIN","DIRETOR"].includes(currentProfile?.role)}
function isOpenOS(o){return OPEN_OS_STATUSES.includes(o?.status)}
function hasBlockingForm(){return !!document.querySelector("#osForm,#finishOS,#execPrev,#eqForm,#prevForm,#catalogForm,#editEqForm,#editCatalogForm")}

function priorityClass(p){return p==="CRITICA"?"crit":p==="ALTA"?"alta":p==="MEDIA"?"media":"baixa"}
function peso(p){return {BAIXA:1,MEDIA:2,ALTA:3,CRITICA:4}[p]||0}
function equipmentName(id){return equipment.find(e=>e.id===id)?.nome||"Sem equipamento"}
function sectorName(id){return sectors.find(s=>s.id===id)?.nome||"Não informado"}
function areaName(id){return areas.find(a=>a.id===id)?.nome||"Não informada"}
function currentUnitName(){return availableUnits.find(u=>u.id===unitId)?.nome||"Unidade"}
function logo(){return `<img src="${LOGO}" class="logo" alt="Entre Amigos">`}

async function bootstrap(){
  const {data:{session}}=await sb.auth.getSession();
  if(!session){renderLogin();return}
  currentUser=session.user;
  await loadProfile();
  await loadBase();
  currentRoute=isTechnician()?"tecnico":"dashboard";
  renderApp();
  startSync();
}
async function loadProfile(){
  const {data,error}=await sb.from("perfis").select("*").eq("id",currentUser.id).single();
  if(error)throw new Error("Perfil não encontrado: "+error.message);
  currentProfile=data;
}
async function loadBase(preferredUnitId=unitId){
  const {data:units,error:uerr}=await sb.from("unidades").select("id,nome,ativo").eq("ativo",true).order("nome");
  if(uerr)throw new Error("Não foi possível carregar as unidades.");
  availableUnits=units||[];
  const profileUnit=availableUnits.find(u=>u.id===currentProfile.unidade_id);
  const preferred=availableUnits.find(u=>u.id===preferredUnitId);
  const rio=availableUnits.find(u=>u.nome==="RioMar Recife");
  unitId=(canSwitchUnits()?(preferred||profileUnit||rio||availableUnits[0]):profileUnit)?.id;
  if(!unitId)throw new Error("Nenhuma unidade ativa foi encontrada para este usuário.");
  const [eqRes,secRes,areaRes,catRes,osRes,prevRes,profRes]=await Promise.all([
    sb.from("equipamentos").select("*").eq("unidade_id",unitId).eq("ativo",true).order("nome"),
    sb.from("setores").select("*").eq("unidade_id",unitId).eq("ativo",true).order("nome"),
    sb.from("areas").select("*").eq("unidade_id",unitId).eq("ativo",true).order("nome"),
    sb.from("categorias_manutencao").select("*").eq("unidade_id",unitId).eq("ativo",true).order("nome"),
    sb.from("ordens_servico").select("*").eq("unidade_id",unitId).order("data_abertura",{ascending:false}),
    sb.from("preventivas_agendamentos").select("*").eq("unidade_id",unitId).order("data_programada",{ascending:true}),
    sb.from("perfis").select("id,nome,email,role,ativo,unidade_id").or(`unidade_id.eq.${unitId},role.in.(MASTER,ADMIN,DIRETOR)`).order("nome")
  ]);
  [eqRes,secRes,areaRes,catRes,osRes,prevRes,profRes].forEach(r=>{if(r.error)console.warn(r.error)});
  equipment=eqRes.data||[];sectors=secRes.data||[];areas=areaRes.data||[];categories=catRes.data||[];orders=osRes.data||[];preventives=prevRes.data||[];profiles=profRes.data||[];
  lastRefresh=Date.now();
}
function startSync(){
  try{
    if(realtimeChannel)sb.removeChannel(realtimeChannel);
    realtimeChannel=sb.channel(`ea-sync-${unitId}`)
      .on("postgres_changes",{event:"*",schema:"public",table:"ordens_servico",filter:`unidade_id=eq.${unitId}`},safeRealtimeRefresh)
      .on("postgres_changes",{event:"*",schema:"public",table:"equipamentos",filter:`unidade_id=eq.${unitId}`},safeRealtimeRefresh)
      .on("postgres_changes",{event:"*",schema:"public",table:"preventivas_agendamentos",filter:`unidade_id=eq.${unitId}`},safeRealtimeRefresh)
      .subscribe();
  }catch(e){console.warn("Realtime indisponível.",e)}
}
async function safeRealtimeRefresh(){
  try{
    await loadBase(unitId);
    if(!hasBlockingForm())renderPage(currentRoute); else toast("Dados atualizados em segundo plano; finalize o formulário para recarregar a tela.");
  }catch(e){console.warn(e)}
}
function renderLogin(){
  document.getElementById("app").innerHTML=`<div class="login"><div class="login-box">${logo()}<span class="badge">Sistema sincronizado • Supabase</span><h1>Login</h1><p>Use o mesmo usuário nos dois celulares.</p><form id="loginForm"><label class="label">E-mail</label><input class="input" name="email" type="email" required><label class="label">Senha</label><input class="input" name="senha" type="password" required><button class="btn primary w-full mt">Entrar</button></form><p class="muted" style="font-size:13px">Os dados serão compartilhados entre iPhone, Android e computador.</p></div></div>`;
  document.getElementById("loginForm").onsubmit=async e=>{
    e.preventDefault();const b=e.target.querySelector("button");b.disabled=true;b.textContent="Entrando...";
    const {error}=await sb.auth.signInWithPassword({email:e.target.email.value.trim(),password:e.target.senha.value});
    if(error){toast(error.message);b.disabled=false;b.textContent="Entrar";return}
    location.reload();
  };
}
function menu(){
  if(isTechnician()){
    return [["🛠","Serviços do dia","tecnico"],["📋","Chamados","ordens"],["📅","Preventivas","prev"]];
  }
  const items=[["⌂","Dashboard","dashboard"],["🏭","Equipamentos","equip"],["📅","Preventivas","prev"],["📋","Ordens de Serviço","ordens"],["🛡","Auditoria","auditoria"],["💲","Custos","custos"],["👥","Administração","users"],["📊","Relatórios","rel"],["⚙","Configurações","config"]];
  if(canManageCatalog()) items.splice(5,0,["⚙️","Cadastros","cadastros"]);
  return items;
}
function unitSelector(){
  if(!canSwitchUnits())return `<span class="sync">${esc(currentUnitName())}</span>`;
  return `<select id="unitSelector" class="input" style="width:auto;margin:0;max-width:220px">${availableUnits.map(u=>`<option value="${u.id}" ${u.id===unitId?"selected":""}>${esc(u.nome)}</option>`).join("")}</select>`;
}
function renderApp(){
  const m=menu();
  document.getElementById("app").innerHTML=`<div class="shell"><aside class="side"><div class="side-logo"><img src="${LOGO}"></div><small>V17 • Produção</small><p>${esc(currentProfile.nome)}<br><b>${esc(currentProfile.role)}</b></p>${m.map(x=>`<button data-r="${x[2]}">${x[0]} ${x[1]}</button>`).join("")}</aside><main><div class="top"><div><b>Plataforma de Manutenção Entre Amigos</b><br><small>Unidade atual: ${esc(currentUnitName())}</small></div><div>${unitSelector()} <span class="sync">● Sincronizado</span> <button id="logout" class="btn light">Sair</button></div></div><section class="content" id="content"></section></main><div class="bottom">${m.slice(0,4).map(x=>`<button data-r="${x[2]}"><div>${x[0]}</div>${x[1]}</button>`).join("")}</div></div>`;
  document.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>navigate(b.dataset.r));
  document.getElementById("logout").onclick=async()=>{await sb.auth.signOut();location.reload()};
  document.getElementById("unitSelector")?.addEventListener("change",async e=>{
    await loadBase(e.target.value);startSync();renderApp();toast("Unidade alterada para "+currentUnitName());
  });
  renderPage(currentRoute);
}
function navigate(r){currentRoute=r;renderPage(r);window.scrollTo(0,0)}
function renderPage(r){
  const c=document.getElementById("content");if(!c)return;
  document.querySelectorAll("[data-r]").forEach(b=>b.classList.toggle("active",b.dataset.r===r));
  c.innerHTML=r==="tecnico"?technicianPage():r==="dashboard"?dashboard():r==="abrir"?abrir():r==="ordens"?ordensPage():r==="equip"?equipPage():r==="prev"?prevPage():r==="cadastros"?cadastrosPage():r==="auditoria"?auditPage():r==="custos"?costPage():r==="config"?configPage():r==="users"?usersPage():reportsPage();
  document.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>navigate(b.dataset.r));
  bindPage(r);
}
function kpi(t,v,s,r){return `<div class="card" ${r?`data-r="${r}" style="cursor:pointer"`:""}><div class="muted">${t}</div><div class="kpi">${v}</div><small>${s}</small></div>`}
function isTodayDate(value){
  if(!value)return false;
  const d=new Date(value.length===10?value+"T12:00:00":value),now=new Date();
  return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth()&&d.getDate()===now.getDate();
}
function technicianPage(){
  const active=orders.filter(o=>o.status!=="CONCLUIDA"&&o.status!=="CANCELADA");
  const assigned=active.filter(o=>!o.tecnico_id||o.tecnico_id===currentUser.id);
  const todayPrev=preventives.filter(p=>isTodayDate(p.data_programada)&&p.status!=="CONCLUIDA");
  const urgent=assigned.filter(o=>["CRITICA","ALTA"].includes(o.prioridade));
  setTimeout(()=>hydrateTechnicianCards(assigned),0);
  return `<div class="hero"><div><h1>Serviços do Dia</h1><p>Chamados e preventivas planejados para execução.</p></div><span class="today-tag">${new Date().toLocaleDateString("pt-BR")}</span></div>
  <div class="tech-summary">${kpi("Chamados",assigned.length,"Pendentes")}${kpi("Urgentes",urgent.length,"Alta/Crítica")}${kpi("Preventivas",todayPrev.length,"Programadas hoje")}</div>
  <div class="tech-section-title"><h2>Chamados do dia</h2><span class="pill">${assigned.length}</span></div>
  <div id="techOrders" class="grid"><div class="empty">Carregando chamados...</div></div>
  <div class="tech-section-title"><h2>Preventivas de hoje</h2><span class="pill">${todayPrev.length}</span></div>
  <div class="grid">${todayPrev.length?todayPrev.map(techPreventiveCard).join(""):'<div class="empty">Nenhuma preventiva programada para hoje.</div>'}</div>`;
}
async function hydrateTechnicianCards(list){
  const photos=await getOpeningPhotos(list.map(o=>o.id));
  const box=document.getElementById("techOrders");if(!box)return;
  box.innerHTML=list.length?list.sort((a,b)=>peso(b.prioridade)-peso(a.prioridade)).map(o=>techOrderCard(o,photos[o.id])).join(""):'<div class="empty">Nenhum chamado pendente.</div>';
  bindTechnicianButtons();
}
function techOrderCard(o,photo){
  return `<div class="tech-card ${o.prioridade==="CRITICA"?"critical":o.prioridade==="ALTA"?"high":""}">
    ${photo?`<img class="tech-photo" src="${photo}" alt="Foto do chamado">`:'<div class="tech-photo-placeholder">📷</div>'}
    <div><div class="service-type">Chamado corretivo</div><h2>${esc(equipmentName(o.equipamento_id))}</h2><small>${esc(sectorName(o.setor_id))} • OS ${o.numero}</small><p>${esc(o.descricao)}</p><span class="pill ${priorityClass(o.prioridade)}">${o.prioridade}</span> <span class="pill">${o.status}</span></div>
    <div class="tech-actions"><button class="btn primary techStatus" data-id="${o.id}">Atualizar situação</button><button class="btn light detailOS" data-id="${o.id}">Ver detalhes</button></div>
  </div>`;
}
function techPreventiveCard(p){
  let resumo="Preventiva programada";try{resumo=JSON.parse(p.observacoes||"{}").resumo||resumo}catch{}
  return `<div class="tech-card"><div class="tech-photo-placeholder">🧰</div><div><div class="service-type">Manutenção preventiva</div><h2>${esc(equipmentName(p.equipamento_id))}</h2><p>${esc(resumo)}</p><span class="pill">${p.status}</span> <span class="pill">${parseChecklist(p).length} itens</span></div><div class="tech-actions"><button class="btn primary execPrev" data-id="${p.id}">Executar checklist</button></div></div>`;
}
function bindTechnicianButtons(){
  document.querySelectorAll(".techStatus").forEach(b=>b.onclick=()=>technicianStatusModal(b.dataset.id));
  document.querySelectorAll(".detailOS").forEach(b=>b.onclick=()=>detailOS(b.dataset.id));
  document.querySelectorAll(".execPrev").forEach(b=>b.onclick=()=>executePreventive(b.dataset.id));
}
function technicianStatusModal(id){
  const o=orders.find(x=>x.id===id);
  modal(`<h2>Atualizar situação da OS ${o.numero}</h2><p><b>${esc(equipmentName(o.equipamento_id))}</b></p><form id="techStatusForm">
  <label class="label">Nova situação</label><select class="input" id="newTechStatus" required>
    <option value="EM_EXECUCAO">Em execução</option><option value="AGUARDANDO_PECA">Aguardando peça</option>
    <option value="AGUARDANDO_TERCEIRIZADA">Aguardando terceirizada</option>
    <option value="AGUARDANDO_APROVACAO_DIRETOR">Aguardando aprovação do diretor</option>
    <option value="CONCLUIDA">Concluir serviço</option></select>
  <label class="label">Observação</label><textarea class="input" id="techStatusObs" placeholder="Descreva a situação ou necessidade"></textarea>
  <button class="btn primary w-full mt">Continuar</button></form>`);
  document.getElementById("techStatusForm").onsubmit=async e=>{
    e.preventDefault();const status=document.getElementById("newTechStatus").value,obs=document.getElementById("techStatusObs").value.trim();
    if(status==="CONCLUIDA"){closeModal();finishOSModal(id);return}
    const solution=[o.solucao,obs?`Atualização: ${obs}`:""].filter(Boolean).join("\n");
    const payload={status,solucao:solution,tecnico_id:currentUser.id};if(status==="EM_EXECUCAO"&&!o.data_inicio)payload.data_inicio=new Date().toISOString();
    const {error}=await sb.from("ordens_servico").update(payload).eq("id",id);if(error)return alert(error.message);
    if(o.equipamento_id)await sb.from("equipamentos").update({status:status==="AGUARDANDO_PECA"?"AGUARDANDO_PECA":"EM_MANUTENCAO"}).eq("id",o.equipamento_id);
    await loadBase();closeModal();toast("Situação atualizada");renderPage("tecnico");
  };
}
function dashboard(){
  const now=new Date(),monthStart=new Date(now.getFullYear(),now.getMonth(),1),monthEnd=new Date(now.getFullYear(),now.getMonth()+1,0);
  const open=orders.filter(isOpenOS),doneMonth=orders.filter(o=>o.status==="CONCLUIDA"&&new Date(o.data_conclusao||o.atualizado_em||0)>=monthStart);
  const overdue=open.filter(o=>{const due=o.prazo_sla||o.data_limite;return due&&new Date(due)<now});
  const next7=preventives.filter(p=>{const d=new Date(p.data_programada+"T12:00:00");return d>=new Date(now.getFullYear(),now.getMonth(),now.getDate())&&d<=new Date(Date.now()+7*86400000)&&p.status!=="CONCLUIDA"});
  const costs=orders.filter(o=>{const d=new Date(o.data_conclusao||o.data_abertura||0);return d>=monthStart&&d<new Date(now.getFullYear(),now.getMonth()+1,1)}).reduce((s,o)=>s+Number(o.custo_material||0)+Number(o.custo_terceiro||0)+Number(o.custo_interno||0),0);
  const statusData=[
    ["Abertas",orders.filter(o=>o.status==="ABERTA").length,"#1d6fe8"],
    ["Em andamento",orders.filter(o=>o.status==="EM_EXECUCAO").length,"#ff7a00"],
    ["Concluídas",orders.filter(o=>o.status==="CONCLUIDA").length,"#22a33d"],
    ["Atrasadas",overdue.length,"#e33119"]
  ];
  return `<div class="admin-welcome"><div><h1>Bem-vindo, ${esc(currentProfile.nome||"Administrador")}!</h1><p>Visão geral da manutenção — ${esc(currentUnitName())}</p></div><div><button class="btn light" data-r="rel">📊 Relatórios</button> <button class="btn orange" data-r="abrir">+ Nova OS</button></div></div>
  <div class="admin-kpis">
    ${adminKpi("📋","Ordens Abertas",open.length,"Em andamento","ordens","")}
    ${adminKpi("🗓","Preventivas Agendadas",next7.length,"Próximos 7 dias","prev","orange")}
    ${adminKpi("✓","Ordens Concluídas",doneMonth.length,"Este mês","ordens","green")}
    ${adminKpi("⚠","Atrasadas",overdue.length,"Requer atenção","ordens","red")}
    ${adminKpi("💲","Custo do Mês","R$ "+costs.toFixed(2).replace(".",","),"Registrado","rel","purple")}
  </div>
  <div class="panel-grid">
    <div class="panel-stack">
      <div class="card"><h2>Ordens de Serviço por Status</h2>${donutChart(statusData)}<button class="btn light w-full mt" data-r="ordens">Ver todas as ordens</button></div>
      <div class="card"><h2>Equipamentos por Status</h2>${equipmentStatusPanel()}<button class="btn light w-full mt" data-r="equip">Ver todos os equipamentos</button></div>
    </div>
    <div class="panel-stack">
      <div class="card"><div class="calendar-head"><h2>Preventivas — Calendário</h2><button class="btn light" data-r="prev">Ver agenda</button></div>${preventiveCalendar(now.getFullYear(),now.getMonth())}</div>
      <div class="card"><div class="calendar-head"><h2>Próximas Preventivas</h2><button class="btn light" data-r="prev">Ver todas</button></div>${nextPreventivesList()}</div>
    </div>
  </div>
  <div class="grid g2 mt">
    <div class="card"><h2>Top 5 Equipamentos por Custo</h2>${topEquipmentCosts()}</div>
    <div class="card"><h2>Custos por Tipo</h2>${costTypePanel()}</div>
  </div>`;
}
function adminKpi(icon,title,value,sub,route,color){
  return `<div class="admin-kpi" data-r="${route}"><div class="admin-icon ${color}">${icon}</div><div><b>${title}</b><div class="admin-kpi-value">${value}</div><small>${sub}</small></div></div>`;
}
function donutChart(data){
  const total=data.reduce((s,x)=>s+x[1],0)||1;let start=0,parts=[];
  data.forEach(x=>{const deg=(x[1]/total)*360;parts.push(`${x[2]} ${start}deg ${start+deg}deg`);start+=deg});
  return `<div class="donut-wrap"><div class="donut" style="background:conic-gradient(${parts.join(",")})"><div class="donut-center"><span>Total</span><b>${data.reduce((s,x)=>s+x[1],0)}</b></div></div><div class="legend">${data.map(x=>`<div class="legend-row"><span><i class="legend-dot" style="background:${x[2]}"></i>${x[0]}</span><b>${x[1]}</b></div>`).join("")}</div></div>`;
}
function equipmentStatusPanel(){
  const groups=[
    ["Operacionais",equipment.filter(e=>e.status==="OPERACIONAL").length,"#22a33d"],
    ["Em manutenção",equipment.filter(e=>e.status==="EM_MANUTENCAO").length,"#ff7a00"],
    ["Parados",equipment.filter(e=>e.status==="PARADO").length,"#e33119"],
    ["Aguardando peças",equipment.filter(e=>e.status==="AGUARDANDO_PECA").length,"#1d6fe8"]
  ],total=equipment.length||1;
  return `<div class="equipment-status-list">${groups.map(x=>`<div class="equipment-status-row"><span><i class="legend-dot" style="background:${x[2]}"></i>${x[0]}</span><b>${x[1]} (${Math.round((x[1]/total)*100)}%)</b></div>`).join("")}</div>`;
}
function preventiveCalendar(year,month){
  const first=new Date(year,month,1),last=new Date(year,month+1,0),startDay=first.getDay(),cells=[];
  const prevLast=new Date(year,month,0).getDate();
  for(let i=startDay-1;i>=0;i--)cells.push({date:new Date(year,month-1,prevLast-i),muted:true});
  for(let d=1;d<=last.getDate();d++)cells.push({date:new Date(year,month,d),muted:false});
  while(cells.length%7!==0)cells.push({date:new Date(year,month+1,cells.length-(startDay+last.getDate())+1),muted:true});
  const weekdays=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  return `<div class="calendar-head"><button class="btn light">Hoje</button><b>${first.toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}</b><span></span></div><div class="calendar-grid">${weekdays.map(w=>`<div class="calendar-cell" style="min-height:auto;font-weight:900;text-align:center">${w}</div>`).join("")}${cells.map(c=>{const key=c.date.toISOString().slice(0,10),events=preventives.filter(p=>p.data_programada===key).slice(0,2);return `<div class="calendar-cell ${c.muted?"muted-day":""}"><b>${c.date.getDate()}</b>${events.map((p,i)=>`<span class="cal-event ${i%3===1?"green":i%3===2?"purple":"orange"}" data-r="prev">${esc(equipmentName(p.equipamento_id))}</span>`).join("")}</div>`}).join("")}</div>`;
}
function nextPreventivesList(){
  const list=[...preventives].filter(p=>p.status!=="CONCLUIDA").sort((a,b)=>String(a.data_programada).localeCompare(String(b.data_programada))).slice(0,5);
  return list.length?`<div class="next-list">${list.map(p=>`<div class="next-row"><b>${esc(equipmentName(p.equipamento_id))}</b><span>${esc(sectorName(equipment.find(e=>e.id===p.equipamento_id)?.setor_id))}</span><span>${new Date(p.data_programada+"T12:00:00").toLocaleDateString("pt-BR")}</span><span class="pill">${p.status}</span></div>`).join("")}</div>`:'<div class="empty">Nenhuma preventiva futura.</div>';
}
function topEquipmentCosts(){
  const map={};orders.forEach(o=>{if(!o.equipamento_id)return;map[o.equipamento_id]=(map[o.equipamento_id]||0)+Number(o.custo_material||0)+Number(o.custo_terceiro||0)+Number(o.custo_interno||0)});
  const list=Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5),max=list[0]?.[1]||1;
  return list.length?`<div class="cost-bars">${list.map(([id,v])=>`<div class="cost-bar-row"><span>${esc(equipmentName(id))}</span><div class="cost-bar-track"><div class="cost-bar-fill" style="width:${Math.max(4,(v/max)*100)}%"></div></div><b>R$ ${v.toFixed(2).replace(".",",")}</b></div>`).join("")}</div>`:'<div class="empty">Ainda não há custos registrados.</div>';
}
function costTypePanel(){
  const mat=orders.reduce((s,o)=>s+Number(o.custo_material||0),0),internal=orders.reduce((s,o)=>s+Number(o.custo_interno||0),0),third=orders.reduce((s,o)=>s+Number(o.custo_terceiro||0),0);
  return donutChart([["Material",mat,"#1d6fe8"],["Mão de obra interna",internal,"#ff7a00"],["Serviços terceiros",third,"#22a33d"]]);
}
function statusLine(n,c,s){return `<p><span class="dot ${c}"></span><b>${n}</b><span style="float:right">${s}</span></p>`}
function orderMini(o){return `<div class="card os ${o.prioridade==="CRITICA"?"critica":""}" style="box-shadow:none;margin-bottom:10px;padding:14px"><b>${esc(equipmentName(o.equipamento_id))}</b><p>${esc(o.descricao)}</p><span class="pill ${priorityClass(o.prioridade)}">${o.prioridade}</span> <span class="pill">${o.status}</span></div>`}
function abrir(){
  return `<div class="hero"><div><h1>Abrir chamado</h1><p>A OS será criada em ${esc(currentUnitName())} e ficará disponível em todos os aparelhos.</p></div></div><div class="card"><form id="osForm"><div id="openFormMsg" class="photo-help" role="status"></div><div class="formgrid"><div><label class="label">Unidade</label><input class="input" value="${esc(currentUnitName())}" disabled></div><div><label class="label">Área</label><select class="input" name="area_id"><option value="">Selecione</option>${areas.map(a=>`<option value="${a.id}">${esc(a.nome)}</option>`).join("")}</select></div><div><label class="label">Setor</label><select class="input" name="setor_id"><option value="">Selecione</option>${sectors.map(s=>`<option value="${s.id}">${esc(s.nome)}</option>`).join("")}</select></div><div><label class="label">Categoria</label><select class="input" name="categoria" required>${categories.length?categories.map(c=>`<option value="${esc(c.nome)}">${esc(c.nome)}</option>`).join(""): '<option>Equipamento</option><option>Elétrica</option><option>Hidráulica</option>'}</select></div><div><label class="label">Equipamento</label><select class="input" name="equipamento_id"><option value="">Não se aplica</option>${equipment.map(e=>`<option value="${e.id}" data-area="${e.area_id||""}" data-setor="${e.setor_id||""}">${esc(e.nome)}</option>`).join("")}</select></div><div><label class="label">Prioridade</label><select class="input" name="prioridade"><option value="BAIXA">Baixa - 5 dias</option><option value="MEDIA" selected>Média - 3 dias</option><option value="ALTA">Alta - 1 dia</option><option value="CRITICA">Crítica - 4 horas</option></select></div><div><label class="label">Problema</label><input class="input" name="problema" placeholder="Ex: vazamento, não liga, ruído" required></div></div><label class="label">Descrição</label><textarea class="input" name="descricao" required></textarea>${filePicker("open")}<button type="submit" class="btn primary w-full mt">Enviar chamado</button></form></div>`;
}
async function getOpeningPhotos(orderIds){
  if(!orderIds.length)return {};
  const {data,error}=await sb.from("os_anexos").select("os_id,arquivo_url").in("os_id",orderIds).eq("origem","abertura").order("criado_em",{ascending:true});
  if(error){console.warn(error);return {}}
  const map={};(data||[]).forEach(a=>{if(!map[a.os_id])map[a.os_id]=a.arquivo_url});return map;
}
function ordersFiltered(){
  const q=(document.getElementById("qOS")?.value||"").toLowerCase(),s=document.getElementById("sOS")?.value||"",p=document.getElementById("pOS")?.value||"";
  return orders.filter(o=>(!q||(equipmentName(o.equipamento_id)+" "+o.descricao).toLowerCase().includes(q))&&(!s||o.status===s)&&(!p||o.prioridade===p)).sort((a,b)=>peso(b.prioridade)-peso(a.prioridade));
}
function ordensPage(){
  return `<div class="hero"><div><h1>Ocorrências / OS</h1><p>Fila sincronizada entre todos os usuários.</p></div><button class="btn orange" data-r="abrir">+ Nova OS</button></div><div class="filters"><input id="qOS" class="input" placeholder="Buscar"><select id="sOS" class="input"><option value="">Todos os status</option>${OS_STATUSES.map(s=>`<option>${s}</option>`).join("")}</select><select id="pOS" class="input"><option value="">Todas as prioridades</option><option>CRITICA</option><option>ALTA</option><option>MEDIA</option><option>BAIXA</option></select></div><div id="osList" class="grid">${renderOrders(orders)}</div>`;
}
function renderOrders(list){
  const l=[...list].sort((a,b)=>peso(b.prioridade)-peso(a.prioridade));
  return l.length?l.map(o=>`<div class="card os ${o.prioridade==="CRITICA"?"critica":""}"><div class="grid g3"><div><h2>${esc(equipmentName(o.equipamento_id))}</h2><small>${esc(sectorName(o.setor_id))} • ${new Date(o.data_abertura).toLocaleString("pt-BR")} • Nº ${o.numero}</small><p>${esc(o.descricao)}</p><span class="pill ${priorityClass(o.prioridade)}">${o.prioridade}</span> <span class="pill">${o.status}</span></div><div class="photo-box">📷 Evidências salvas no Supabase</div><div><button class="btn light w-full detailOS" data-id="${o.id}">Ver detalhes</button>${isOpenOS(o)?`<button class="btn primary w-full mt startOS" data-id="${o.id}">Resolver agora</button><button class="btn light w-full mt finishOS" data-id="${o.id}">Concluir</button>`:""}</div></div></div>`).join(""):'<div class="empty">Nenhuma OS encontrada.</div>';
}
function equipPage(){
  return `<div class="hero"><div><h1>Equipamentos</h1><p>Ativos sincronizados de ${esc(currentUnitName())}.</p></div>${canManageCatalog()?'<button class="btn orange" id="newEq">+ Novo equipamento</button>':""}</div>
  <div class="grid g3">${equipment.length?equipment.map(e=>`<div class="card">
    <h2>${esc(e.nome)}</h2>
    <p><b>Setor:</b> ${esc(sectorName(e.setor_id))}</p>
    <p><b>Área:</b> ${esc(areaName(e.area_id))}</p>
    <p><b>Status atual:</b> <span class="pill">${e.status}</span></p>
    <div class="photo-box"><span class="tag-big">${esc(e.tag||"SEM TAG")}</span></div>
    <button class="btn light w-full mt eq360" data-id="${e.id}">Abrir ficha 360°</button>
    ${canManageCatalog()?`<div class="catalog-actions mt"><button class="btn light btn-small editEq" data-id="${e.id}">Editar</button><button class="btn danger-outline btn-small deleteEq" data-id="${e.id}">Excluir/Inativar</button></div>`:""}
  </div>`).join(""):'<div class="empty">Nenhum equipamento cadastrado.</div>'}</div>`;
}
async function equipment360(id){
  const e=equipment.find(x=>x.id===id);
  if(!e)return modal(`<div class="empty">Equipamento não encontrado ou removido.</div>`);
  const eqOrders=orders.filter(o=>o.equipamento_id===id);
  const cost=eqOrders.reduce((s,o)=>s+Number(o.custo_material||0)+Number(o.custo_terceiro||0)+Number(o.custo_interno||0),0);
  modal(`<h2>Ficha 360° — ${esc(e.nome)}</h2>
    <div class="grid g2">
      <div class="card" style="box-shadow:none">
        <p><b>TAG:</b> <span class="tag-big">${esc(e.tag||"")}</span></p>
        <p><b>Setor:</b> ${esc(sectorName(e.setor_id))}</p>
        <p><b>Área:</b> ${esc(areaName(e.area_id))}</p>
        <p><b>Status atual:</b> <span class="pill">${e.status}</span></p>
      </div>
      <div class="card" style="box-shadow:none">
        <p><b>Total de OS:</b> ${eqOrders.length}</p>
        <p><b>OS abertas:</b> ${eqOrders.filter(isOpenOS).length}</p>
        <p><b>Custo acumulado:</b> R$ ${cost.toFixed(2).replace(".",",")}</p>
      </div>
    </div>
    ${canManageCatalog()?`<label class="label">Atualizar status do equipamento</label>
    <select class="input" id="eqStatus">
      <option ${e.status==="OPERACIONAL"?"selected":""}>OPERACIONAL</option>
      <option ${e.status==="EM_MANUTENCAO"?"selected":""}>EM_MANUTENCAO</option>
      <option ${e.status==="PARADO"?"selected":""}>PARADO</option>
      <option ${e.status==="AGUARDANDO_PECA"?"selected":""}>AGUARDANDO_PECA</option>
    </select>
    <button class="btn primary w-full mt" id="saveEqStatus">Salvar status</button>`:""}
    <h3>Histórico de manutenção</h3>
    ${eqOrders.length?eqOrders.map(o=>`<div class="history-item"><b>OS ${o.numero} • ${o.status}</b><br>${esc(o.descricao)}<br><small>${o.data_abertura?new Date(o.data_abertura).toLocaleString("pt-BR"):""}</small></div>`).join(""):'<div class="empty">Sem histórico.</div>'}`);
  if(canManageCatalog())document.getElementById("saveEqStatus").onclick=async()=>{
    const status=document.getElementById("eqStatus").value;
    const {error}=await sb.from("equipamentos").update({status}).eq("id",id);
    if(error)return alert(error.message);
    await loadBase();closeModal();toast("Status atualizado");renderPage("equip");
  };
}
async function editEquipmentModal(id){
  if(!canManageCatalog())return;
  const e=equipment.find(x=>x.id===id);
  if(!e)return modal(`<div class="empty">Equipamento não encontrado ou removido.</div>`);
  modal(`<h2>Editar equipamento</h2><form id="editEqForm">
    <div class="formgrid">
      <div><label class="label">Nome</label><input class="input" name="nome" value="${esc(e.nome)}" required></div>
      <div><label class="label">Setor</label><select class="input" name="setor_id" required>${sectors.map(s=>`<option value="${s.id}" ${s.id===e.setor_id?"selected":""}>${esc(s.nome)}</option>`).join("")}</select></div>
      <div><label class="label">Área</label><select class="input" name="area_id" required>${areas.map(a=>`<option value="${a.id}" ${a.id===e.area_id?"selected":""}>${esc(a.nome)}</option>`).join("")}</select></div>
      <div><label class="label">Fabricante</label><input class="input" name="fabricante_texto" value="${esc(e.fabricante_texto||"")}"></div>
    </div>
    <button type="submit" class="btn primary w-full mt">Salvar alterações</button>
  </form>`);
  document.getElementById("editEqForm").onsubmit=async ev=>{
    ev.preventDefault();const f=Object.fromEntries(new FormData(ev.target));
    const {error}=await sb.from("equipamentos").update({nome:f.nome,setor_id:f.setor_id,area_id:f.area_id,fabricante_texto:f.fabricante_texto}).eq("id",id);
    if(error)return alert(error.message);
    await loadBase();closeModal();toast("Equipamento atualizado");renderPage("equip");
  };
}
async function removeEquipment(id){
  if(!canDeleteCatalog())return;
  const linked=orders.some(o=>o.equipamento_id===id)||preventives.some(p=>p.equipamento_id===id);
  const msg=linked?"Este equipamento possui histórico e será INATIVADO. Continuar?":"Excluir este equipamento definitivamente?";
  if(!confirm(msg))return;
  let result;
  if(linked)result=await sb.from("equipamentos").update({ativo:false}).eq("id",id);
  else result=await sb.from("equipamentos").delete().eq("id",id);
  if(result.error)return alert(result.error.message);
  await loadBase();toast(linked?"Equipamento inativado":"Equipamento excluído");renderPage("equip");
}
function parseChecklist(p){
  if(Array.isArray(p.checklist_itens))return p.checklist_itens;
  try{const j=JSON.parse(p.observacoes||"{}");return j.itens||[]}catch{return String(p.observacoes||"").split("\n").filter(Boolean)}
}
function prevPage(){
  return `<div class="hero"><div><h1>Preventivas</h1><p>Checklist e fotos armazenados online.</p></div><button class="btn orange" id="newPrev">+ Nova preventiva</button></div><div class="grid g3">${preventives.length?preventives.map(p=>`<div class="card"><h2>${esc(equipmentName(p.equipamento_id))}</h2><p><b>Data:</b> ${new Date(p.data_programada+"T12:00:00").toLocaleDateString("pt-BR")}</p><p><b>Status:</b> <span class="pill">${p.status}</span></p><p><b>Itens obrigatórios:</b> ${parseChecklist(p).length}</p>${p.status!=="CONCLUIDA"?`<button class="btn primary w-full execPrev" data-id="${p.id}">Executar checklist</button>`:"<span class='badge'>Concluída</span>"}</div>`).join(""):'<div class="empty">Nenhuma preventiva cadastrada.</div>'}</div>`;
}
function cadastrosPage(){
  if(!canManageCatalog())return '<div class="empty">Acesso permitido apenas para MASTER, ADMIN ou DIRETOR.</div>';
  return `<div class="hero"><div><h1>Cadastros Operacionais</h1><p>Setores, áreas e categorias da unidade ${esc(currentUnitName())}.</p></div></div>
  <div class="grid g3">
    <div class="card"><h2>Setores</h2><button class="btn orange w-full" id="newSector">+ Criar setor</button><div class="mt">${sectors.map(s=>catalogRow("setor",s)).join("")||"<p>Nenhum setor.</p>"}</div></div>
    <div class="card"><h2>Áreas</h2><button class="btn orange w-full" id="newArea">+ Criar área</button><div class="mt">${areas.map(a=>catalogRow("area",a)).join("")||"<p>Nenhuma área.</p>"}</div></div>
    <div class="card"><h2>Categorias</h2><button class="btn orange w-full" id="newCategory">+ Criar categoria</button><div class="mt">${categories.map(c=>catalogRow("categoria",c)).join("")||"<p>Nenhuma categoria.</p>"}</div></div>
  </div>`;
}
function catalogRow(type,item){
  return `<div class="catalog-row"><span>${esc(item.nome)}</span><div class="catalog-actions">
    <button class="btn light btn-small editCatalog" data-type="${type}" data-id="${item.id}">Editar</button>
    <button class="btn danger-outline btn-small deleteCatalog" data-type="${type}" data-id="${item.id}">Excluir/Inativar</button>
  </div></div>`;
}
function simpleCatalogModal(type){
  const cfg={
    setor:{title:"Novo setor",table:"setores"},
    area:{title:"Nova área",table:"areas"},
    categoria:{title:"Nova categoria",table:"categorias_manutencao"}
  }[type];
  modal(`<h2>${cfg.title}</h2><form id="catalogForm"><label class="label">Nome</label><input class="input" name="nome" required><button type="submit" class="btn primary w-full mt">Salvar</button></form>`);
  document.getElementById("catalogForm").onsubmit=async e=>{
    e.preventDefault();if(!canManageCatalog())return alert("Sem permissão.");
    const nome=new FormData(e.target).get("nome").trim();
    const {error}=await sb.from(cfg.table).insert({unidade_id:unitId,nome,ativo:true});
    if(error)return alert(error.message);await loadBase();closeModal();toast(`${cfg.title} cadastrado`);renderPage("cadastros");
  };
}

function auditPage(){
  const audited=orders.filter(o=>o.auditoria_status||o.auditado_em);
  return `<div class="hero"><div><h1>Auditoria</h1><p>Controle das verificações realizadas pela diretoria.</p></div><button class="btn orange" onclick="toast('A criação completa de auditorias será tratada em etapa futura.')">+ Nova auditoria</button></div><div class="grid g4">${kpi("Meta semanal",5,"Por diretor")}${kpi("Auditadas",audited.length,"Registradas")}${kpi("Pendentes",Math.max(0,5-audited.length),"Nesta semana")}${kpi("OS abertas",orders.filter(isOpenOS).length,"Para análise")}</div><div class="card mt"><h2>Ordens disponíveis para auditoria</h2>${orders.slice(0,10).map(o=>`<div class="next-row"><b>OS ${o.numero}</b><span>${esc(equipmentName(o.equipamento_id))}</span><span>${o.status}</span><button class="btn light detailOS" data-id="${o.id}">Analisar</button></div>`).join("")}</div>`;
}
function costPage(){
  const total=orders.reduce((s,o)=>s+Number(o.custo_material||0)+Number(o.custo_interno||0)+Number(o.custo_terceiro||0),0);
  return `<div class="hero"><div><h1>Custos</h1><p>Visão financeira da manutenção — ${esc(currentUnitName())}</p></div></div><div class="grid g4">${kpi("Custo total","R$ "+total.toFixed(2).replace(".",","),"Acumulado")}${kpi("Material","R$ "+orders.reduce((s,o)=>s+Number(o.custo_material||0),0).toFixed(2).replace(".",","),"Peças e insumos")}${kpi("Terceiros","R$ "+orders.reduce((s,o)=>s+Number(o.custo_terceiro||0),0).toFixed(2).replace(".",","),"Serviços externos")}${kpi("Interno","R$ "+orders.reduce((s,o)=>s+Number(o.custo_interno||0),0).toFixed(2).replace(".",","),"Mão de obra")}</div><div class="card mt"><h2>Equipamentos com maior custo</h2>${topEquipmentCosts()}</div>`;
}
function configPage(){
  return `<div class="hero"><div><h1>Configurações</h1><p>Parâmetros operacionais da unidade.</p></div></div><div class="grid g3"><div class="card"><h2>Cadastros</h2><p>Setores, áreas e categorias.</p><button class="btn primary w-full" data-r="cadastros">Abrir cadastros</button></div><div class="card"><h2>Unidades</h2><p>${availableUnits.length} unidade(s) ativa(s).</p><button class="btn light w-full" onclick="document.getElementById('unitSelector')?.focus()">Selecionar unidade</button></div><div class="card"><h2>Sincronização</h2><p>Última atualização: ${new Date(lastRefresh).toLocaleTimeString("pt-BR")}</p><button class="btn light w-full" onclick="location.reload()">Atualizar sistema</button></div></div>`;
}

function catalogSource(type){
  return type==="setor"?sectors:type==="area"?areas:categories;
}
function catalogTable(type){
  return type==="setor"?"setores":type==="area"?"areas":"categorias_manutencao";
}
function editCatalogModal(type,id){
  if(!canManageCatalog())return;
  const item=catalogSource(type).find(x=>x.id===id);
  modal(`<h2>Editar ${type}</h2><form id="editCatalogForm"><label class="label">Nome</label><input class="input" name="nome" value="${esc(item.nome)}" required><button type="submit" class="btn primary w-full mt">Salvar</button></form>`);
  document.getElementById("editCatalogForm").onsubmit=async e=>{
    e.preventDefault();const nome=new FormData(e.target).get("nome").trim();
    const {error}=await sb.from(catalogTable(type)).update({nome}).eq("id",id);
    if(error)return alert(error.message);
    await loadBase();closeModal();toast("Cadastro atualizado");renderPage("cadastros");
  };
}
async function removeCatalog(type,id){
  if(!canDeleteCatalog())return;
  let linked=false;
  if(type==="setor")linked=equipment.some(e=>e.setor_id===id)||orders.some(o=>o.setor_id===id);
  if(type==="area")linked=equipment.some(e=>e.area_id===id)||orders.some(o=>o.area_id===id);
  if(type==="categoria")linked=orders.some(o=>o.categoria===catalogSource(type).find(x=>x.id===id)?.nome);
  const msg=linked?"Este registro possui histórico e será INATIVADO. Continuar?":"Excluir este registro definitivamente?";
  if(!confirm(msg))return;
  let result;
  if(linked)result=await sb.from(catalogTable(type)).update({ativo:false}).eq("id",id);
  else result=await sb.from(catalogTable(type)).delete().eq("id",id);
  if(result.error)return alert(result.error.message);
  await loadBase();toast(linked?"Registro inativado":"Registro excluído");renderPage("cadastros");
}

function usersPage(){
  return `<div class="hero"><div><h1>Usuários</h1><p>Perfis cadastrados no sistema.</p></div></div><div class="card"><table class="table"><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th></tr>${profiles.map(p=>`<tr><td><b>${esc(p.nome)}</b></td><td>${esc(p.email||"")}</td><td><span class="pill">${p.role}</span></td><td>${p.ativo?"Ativo":"Inativo"}</td></tr>`).join("")}</table></div>`;
}
function reportsPage(){
  const open=orders.filter(isOpenOS).length,done=orders.filter(o=>o.status==="CONCLUIDA").length,cost=orders.reduce((s,o)=>s+Number(o.custo_material||0)+Number(o.custo_terceiro||0)+Number(o.custo_interno||0),0);
  return `<div class="hero"><div><h1>Relatórios</h1><p>Resumo de ${esc(currentUnitName())}.</p></div><button class="btn orange" onclick="window.print()">Gerar PDF</button></div><div class="grid g4">${kpi("OS abertas",open,"Pendentes")}${kpi("OS concluídas",done,"Finalizadas")}${kpi("Preventivas",preventives.length,"Programadas")}${kpi("Custo","R$ "+cost.toFixed(2).replace(".",","),"Registrado")}</div>`;
}
function bindPage(r){
  document.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>navigate(b.dataset.r));
  if(r==="tecnico"){document.querySelectorAll(".execPrev").forEach(b=>b.onclick=()=>executePreventive(b.dataset.id))}
  if(r==="dashboard")document.getElementById("refresh")?.addEventListener("click",async()=>{await loadBase();renderPage("dashboard");toast("Dados atualizados")});
  if(r==="abrir")bindOpenOS();
  if(r==="ordens")bindOrders();
  if(r==="equip"){
    document.getElementById("newEq")?.addEventListener("click",newEquipmentModal);
    document.querySelectorAll(".eq360").forEach(b=>b.onclick=()=>equipment360(b.dataset.id));
    document.querySelectorAll(".editEq").forEach(b=>b.onclick=()=>editEquipmentModal(b.dataset.id));
    document.querySelectorAll(".deleteEq").forEach(b=>b.onclick=()=>removeEquipment(b.dataset.id));
  }
  if(r==="prev"){document.getElementById("newPrev")?.addEventListener("click",newPreventiveModal);document.querySelectorAll(".execPrev").forEach(b=>b.onclick=()=>executePreventive(b.dataset.id))}
  if(r==="cadastros"){
    document.getElementById("newSector")?.addEventListener("click",()=>simpleCatalogModal("setor"));
    document.getElementById("newArea")?.addEventListener("click",()=>simpleCatalogModal("area"));
    document.getElementById("newCategory")?.addEventListener("click",()=>simpleCatalogModal("categoria"));
    document.querySelectorAll(".editCatalog").forEach(b=>b.onclick=()=>editCatalogModal(b.dataset.type,b.dataset.id));
    document.querySelectorAll(".deleteCatalog").forEach(b=>b.onclick=()=>removeCatalog(b.dataset.type,b.dataset.id));
  }
  if(r==="auditoria")document.querySelectorAll(".detailOS").forEach(b=>b.onclick=()=>detailOS(b.dataset.id));
}
function saveOpenFormDraft(){
  const form=document.getElementById("osForm");if(!form)return;
  openFormDraft={
    categoria:form.elements.categoria?.value||"",
    area_id:form.elements.area_id?.value||"",
    setor_id:form.elements.setor_id?.value||"",
    equipamento_id:form.elements.equipamento_id?.value||"",
    prioridade:form.elements.prioridade?.value||"MEDIA",
    problema:form.elements.problema?.value||"",
    descricao:form.elements.descricao?.value||""
  };
}
function restoreOpenFormDraft(){
  const form=document.getElementById("osForm");if(!form)return;
  Object.entries(openFormDraft).forEach(([k,v])=>{if(form.elements[k]&&v!==undefined)form.elements[k].value=v});
}
function bindOpenOS(){
  openFiles=[];
  restoreOpenFormDraft();
  const form=document.getElementById("osForm");
  ["categoria","area_id","setor_id","equipamento_id","prioridade","problema","descricao"].forEach(name=>{
    form.elements[name]?.addEventListener("input",saveOpenFormDraft);
    form.elements[name]?.addEventListener("change",saveOpenFormDraft);
  });
  form.elements.equipamento_id?.addEventListener("change",()=>{const opt=form.elements.equipamento_id.selectedOptions[0];if(opt){form.elements.area_id.value=opt.dataset.area||form.elements.area_id.value;form.elements.setor_id.value=opt.dataset.setor||form.elements.setor_id.value;saveOpenFormDraft();}});
  bindFilePicker("open",openFiles,saveOpenFormDraft,"openFormMsg");

  form.onsubmit=async e=>{
    e.preventDefault();if(isSubmittingOpenOS)return;saveOpenFormDraft();
    const f={...openFormDraft},eq=equipment.find(x=>x.id===f.equipamento_id);
    const msg=document.getElementById("openFormMsg");if(msg)msg.textContent="";
    if(!openFiles.length){if(msg)msg.textContent="Adicione pelo menos uma foto do problema.";return}
    if(!f.problema?.trim()||!f.descricao?.trim()){if(msg)msg.textContent="Preencha o problema e a descrição.";return}
    const btn=e.submitter||e.target.querySelector("button[type=submit]")||e.target.querySelector("button");
    try{
      isSubmittingOpenOS=true;
      if(btn){btn.disabled=true;btn.textContent="Enviando...";}
      const {data:created,error}=await sb.from("ordens_servico").insert({
        unidade_id:unitId,equipamento_id:f.equipamento_id||null,setor_id:f.setor_id||eq?.setor_id||null,area_id:f.area_id||eq?.area_id||null,
        solicitante_id:currentUser.id,tipo:"CORRETIVA",status:"ABERTA",prioridade:f.prioridade,
        categoria:f.categoria,problema:f.problema,descricao:f.descricao
      }).select().single();
      if(error)throw error;
      const files=await uploadFiles(openFiles,`os-${created.id}-abertura`);
      for(const x of files){
        const {error:attachError}=await sb.from("os_anexos").insert({
          os_id:created.id,unidade_id:unitId,usuario_id:currentUser.id,tipo:"foto",origem:"abertura",
          arquivo_nome:x.name,arquivo_url:x.url,mime_type:x.mime,tamanho_bytes:x.size
        });
        if(attachError)throw attachError;
      }
      if(f.equipamento_id){const {error:eqStatusError}=await sb.from("equipamentos").update({status:"EM_MANUTENCAO"}).eq("id",f.equipamento_id);if(eqStatusError)throw eqStatusError;}
      openFormDraft={};clearFilePicker("open",openFiles);form.reset();
      await loadBase();toast("Chamado aberto com foto e sincronizado");navigate(isTechnician()?"tecnico":"ordens");
    }catch(err){
      if(msg)msg.textContent=err.message||String(err);if(btn){btn.disabled=false;btn.textContent="Tentar novamente";}restoreOpenFormDraft();
    }finally{isSubmittingOpenOS=false;}
  };
}
function bindOrders(){
  ["qOS","sOS","pOS"].forEach(id=>document.getElementById(id)?.addEventListener(id==="qOS"?"input":"change",()=>{document.getElementById("osList").innerHTML=renderOrders(ordersFiltered());bindOrderButtons()}));
  bindOrderButtons();
}
function bindOrderButtons(){
  document.querySelectorAll(".startOS").forEach(b=>b.onclick=async()=>{const {error}=await sb.from("ordens_servico").update({status:"EM_EXECUCAO",tecnico_id:currentUser.id,data_inicio:new Date().toISOString()}).eq("id",b.dataset.id);if(error)return alert(error.message);await loadBase();toast("OS em execução");renderPage("ordens")});
  document.querySelectorAll(".finishOS").forEach(b=>b.onclick=()=>finishOSModal(b.dataset.id));
  document.querySelectorAll(".detailOS").forEach(b=>b.onclick=()=>detailOS(b.dataset.id));
}
async function detailOS(id){
  const o=orders.find(x=>x.id===id);
  if(!o)return modal(`<div class="empty">OS não encontrada ou removida.</div>`);
  const {data:anexos,error}=await sb.from("os_anexos").select("*").eq("os_id",id).order("criado_em",{ascending:false});
  if(error)return modal(`<div class="empty">Erro ao carregar anexos: ${esc(error.message)}</div>`);
  modal(`<h2>OS Nº ${esc(o.numero)}</h2><p><b>Equipamento:</b> ${esc(equipmentName(o.equipamento_id))}</p><p><b>Status:</b> ${o.status}</p><p><b>Descrição:</b> ${esc(o.descricao)}</p><p><b>Solução:</b> ${esc(o.solucao||"Ainda não concluída")}</p><p><b>Fotos:</b> ${(anexos||[]).length}</p>${(anexos||[]).map(a=>`<a href="${a.arquivo_url}" target="_blank">Abrir ${esc(a.arquivo_nome||"foto")}</a><br>`).join("")}`);
}
function modal(content){document.getElementById("modalRoot").innerHTML=`<div class="modal-bg"><div class="modal"><div class="modal-head"><span></span><button class="btn light" onclick="closeModal()">X</button></div>${content}</div></div>`}
const PHOTO_LIMIT=8,PHOTO_MAX_BYTES=10*1024*1024,previewUrls={};
function filePicker(prefix){
  return `<label class="label">Fotos obrigatórias</label>
    <div class="photo-actions">
      <label class="btn primary photo-btn">📷 Tirar foto<input id="${prefix}Camera" type="file" accept="image/*" capture="environment"></label>
      <label class="btn light photo-btn">🖼 Escolher da galeria<input id="${prefix}Gallery" type="file" accept="image/*" multiple></label>
    </div>
    <div class="photo-help">Até 8 imagens, no máximo 10 MB cada. Os campos preenchidos serão preservados ao abrir câmera ou galeria.</div>
    <div id="${prefix}Count" class="muted mt">Nenhuma foto selecionada</div>
    <div id="${prefix}Preview" class="preview"></div>`;
}
function bindFilePicker(prefix,target,onBeforePick,msgId){
  const setMsg=m=>{const el=msgId?document.getElementById(msgId):null;if(el)el.textContent=m;else if(m)toast(m)};
  const renderPreview=()=>{
    (previewUrls[prefix]||[]).forEach(URL.revokeObjectURL);previewUrls[prefix]=[];
    const count=document.getElementById(prefix+"Count");
    if(count)count.textContent=target.length?target.length+" foto(s) selecionada(s)":"Nenhuma foto selecionada";
    const p=document.getElementById(prefix+"Preview");
    if(!p)return;
    p.textContent="";
    target.forEach((f,i)=>{
      const url=URL.createObjectURL(f);previewUrls[prefix].push(url);
      const wrap=document.createElement("div");wrap.className="preview-item";
      const img=document.createElement("img");img.src=url;img.alt=f.name||"Foto selecionada";
      const remove=document.createElement("button");remove.type="button";remove.className="preview-remove";remove.textContent="×";
      remove.onclick=()=>{target.splice(i,1);renderPreview()};
      wrap.appendChild(img);wrap.appendChild(remove);p.appendChild(wrap);
    });
  };
  const add=files=>{
    setMsg("");
    for(const f of Array.from(files||[])){
      if(target.length>=PHOTO_LIMIT){setMsg(`Limite de ${PHOTO_LIMIT} fotos atingido.`);break}
      if(!f.type?.startsWith("image/")){setMsg("Arquivo ignorado: selecione apenas imagens.");continue}
      if(f.size>PHOTO_MAX_BYTES){setMsg(`Imagem ${f.name} excede 10 MB.`);continue}
      target.push(f);
    }
    renderPreview();
  };
  const cam=document.getElementById(prefix+"Camera"),gal=document.getElementById(prefix+"Gallery");
  if(cam){cam.onclick=()=>onBeforePick?.();cam.onchange=e=>{add(e.target.files);e.target.value=""}}
  if(gal){gal.onclick=()=>onBeforePick?.();gal.onchange=e=>{add(e.target.files);e.target.value=""}}
  renderPreview();
}
function clearFilePicker(prefix,target){(previewUrls[prefix]||[]).forEach(URL.revokeObjectURL);previewUrls[prefix]=[];target.length=0;}
async function uploadFiles(files,folder){
  const urls=[];
  for(const f of files){
    if(!f.type?.startsWith("image/"))throw new Error("Arquivo inválido: selecione apenas imagens.");
    if(f.size>PHOTO_MAX_BYTES)throw new Error(`Imagem ${f.name} excede 10 MB.`);
    const ext=(f.name.split(".").pop()||"jpg").toLowerCase(),path=`${unitId}/${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const {error}=await sb.storage.from("os-anexos").upload(path,f,{contentType:f.type,upsert:false});
    if(error)throw error;
    const {data}=sb.storage.from("os-anexos").getPublicUrl(path);urls.push({url:data.publicUrl,name:f.name,mime:f.type,size:f.size});
  }
  return urls;
}
function finishOSModal(id){
  const o=orders.find(x=>x.id===id);if(!o)return modal(`<div class="empty">OS não encontrada ou removida.</div>`);osFiles=[];
  modal(`<h2>Concluir OS</h2><p><b>${esc(equipmentName(o.equipamento_id))}</b></p><form id="finishOS"><div id="finishMsg" class="photo-help" role="status"></div>${filePicker("os")}<label class="label">Serviço executado</label><textarea id="osSolution" class="input" required></textarea><div class="formgrid"><div><label class="label">Peças/material</label><input id="osParts" class="input"></div><div><label class="label">Custo material (R$)</label><input id="osCost" class="input" type="number" min="0" step="0.01" value="0"></div></div><button type="submit" class="btn primary w-full mt">Concluir e sincronizar</button></form>`);
  bindFilePicker("os",osFiles,null,"finishMsg");
  document.getElementById("finishOS").onsubmit=async e=>{
    e.preventDefault();const msg=document.getElementById("finishMsg");if(msg)msg.textContent="";if(!osFiles.length){if(msg)msg.textContent="Adicione pelo menos uma foto usando Câmera ou Galeria.";return}
    try{
      const btn=e.target.querySelector("button");btn.disabled=true;btn.textContent="Enviando fotos...";
      const files=await uploadFiles(osFiles,`os-${id}`);
      for(const x of files){const {error:attachError}=await sb.from("os_anexos").insert({os_id:id,unidade_id:unitId,usuario_id:currentUser.id,tipo:"foto",origem:"conclusao",arquivo_nome:x.name,arquivo_url:x.url,mime_type:x.mime,tamanho_bytes:x.size});if(attachError)throw attachError;}
      const cost=Number(document.getElementById("osCost").value||0),solution=document.getElementById("osSolution").value,parts=document.getElementById("osParts").value;
      const {error}=await sb.from("ordens_servico").update({status:"CONCLUIDA",solucao:solution+(parts?` | Peças: ${parts}`:""),custo_material:cost,data_conclusao:new Date().toISOString(),tecnico_id:currentUser.id}).eq("id",id);
      if(error)throw error;
      if(cost>0){const {error:costError}=await sb.from("os_custos").insert({os_id:id,unidade_id:unitId,usuario_id:currentUser.id,tipo:"material",descricao:parts||"Material utilizado",valor:cost});if(costError)throw costError;}
      if(o.equipamento_id){
        const {count}=await sb.from("ordens_servico").select("id",{count:"exact",head:true}).eq("equipamento_id",o.equipamento_id).not("status","in","(CONCLUIDA,CANCELADA)").neq("id",id);
        if(!count)await sb.from("equipamentos").update({status:"OPERACIONAL"}).eq("id",o.equipamento_id);
      }
      clearFilePicker("os",osFiles);await loadBase();closeModal();toast("OS concluída e condição do equipamento atualizada");renderPage("ordens");
    }catch(err){if(msg)msg.textContent=err.message||String(err);else toast(err.message||String(err));const btn=e.target.querySelector("button");if(btn){btn.disabled=false;btn.textContent="Tentar novamente";}}
  };
}
function newEquipmentModal(){
  if(!canManageCatalog())return alert("Somente MASTER, ADMIN ou DIRETOR podem cadastrar equipamentos.");
  modal(`<h2>Novo equipamento</h2><form id="eqForm"><div class="formgrid">
    <div><label class="label">Nome</label><input class="input" name="nome" required></div>
    <div><label class="label">Setor</label><select class="input" name="setor_id" required><option value="">Selecione</option>${sectors.map(s=>`<option value="${s.id}">${esc(s.nome)}</option>`).join("")}</select></div>
    <div><label class="label">Área</label><select class="input" name="area_id" required><option value="">Selecione</option>${areas.map(a=>`<option value="${a.id}">${esc(a.nome)}</option>`).join("")}</select></div>
    <div><label class="label">Fabricante</label><input class="input" name="fabricante_texto"></div>
  </div>
  <p class="muted">A TAG será criada automaticamente no padrão da unidade, com numeração global e única.</p>
  <button type="submit" class="btn primary w-full mt">Salvar no Supabase</button></form>`);
  document.getElementById("eqForm").onsubmit=async e=>{
    e.preventDefault();const f=Object.fromEntries(new FormData(e.target));
    const {data:tagData,error:tagError}=await sb.rpc("gerar_tag_equipamento",{p_unidade_id:unitId});
    if(tagError)return alert("Erro ao gerar TAG: "+tagError.message);
    const tag=tagData;
    const {error}=await sb.from("equipamentos").insert({
      unidade_id:unitId,nome:f.nome,setor_id:f.setor_id,area_id:f.area_id,
      fabricante_texto:f.fabricante_texto,status:"OPERACIONAL",criticidade:"MEDIA",
      tag,criado_por:currentUser.id
    });
    if(error)return alert(error.message);
    await loadBase();closeModal();toast("Equipamento "+tag+" cadastrado");renderPage("equip");
  };
}
function newPreventiveModal(){
  const fryer=["VERIFICAR VAZAMENTO DE GÁS NAS CONEXÕES DA MANGUEIRA DO EQUIPAMENTO","VERIFICAR VAZAMENTO NA MANGUEIRA DE GÁS","VERIFICAR VAZAMENTO NA VÁLVULA TIPO BORBOLETA","REALIZAR A LIMPEZA E VERIFICAR A QUALIDADE DOS QUEIMADORES","LIMPEZA DA SUPERFÍCIE E DENTRO DA CHAMINÉ","TESTAR O FUNCIONAMENTO DO EQUIPAMENTO"];
  modal(`<h2>Nova preventiva</h2><form id="prevForm"><label class="label">Equipamento</label><select class="input" name="equipamento_id" required>${equipment.map(e=>`<option value="${e.id}">${esc(e.nome)}</option>`).join("")}</select><label class="label">Data programada</label><input class="input" name="data" type="date" required><label class="label">Resumo</label><input class="input" name="resumo" placeholder="Ex: Preventiva mensal"><label class="label">Itens obrigatórios (um por linha)</label><textarea class="input" id="prevItems" name="itens" required></textarea><button type="button" id="fryerModel" class="btn light w-full mt">Usar modelo de fritadeira</button><button type="submit" class="btn primary w-full mt">Salvar no Supabase</button></form>`);
  document.getElementById("fryerModel").onclick=()=>document.getElementById("prevItems").value=fryer.join("\n");
  document.getElementById("prevForm").onsubmit=async e=>{
    e.preventDefault();const f=Object.fromEntries(new FormData(e.target)),items=f.itens.split("\n").map(x=>x.trim()).filter(Boolean);
    const {error}=await sb.from("preventivas_agendamentos").insert({unidade_id:unitId,equipamento_id:f.equipamento_id,data_programada:f.data,status:"AGENDADA",observacoes:JSON.stringify({resumo:f.resumo,itens:items}),checklist_itens:items});
    if(error)return alert(error.message);await loadBase();closeModal();toast("Preventiva sincronizada");renderPage("prev");
  };
}
function executePreventive(id){
  const p=preventives.find(x=>x.id===id);
  if(!p)return modal(`<div class="empty">Preventiva não encontrada ou removida.</div>`);
  const items=parseChecklist(p);prevFiles=[];
  modal(`<h2>Executar preventiva</h2><p><b>${esc(equipmentName(p.equipamento_id))}</b></p><form id="execPrev"><div id="prevMsg" class="photo-help" role="status"></div>${items.map((it,i)=>`<div class="check" data-item="${esc(it)}"><b>${i+1}. ${esc(it)}</b><p><button type="button" class="choice okc" data-v="CONFORME">Conforme</button> <button type="button" class="choice noc" data-v="NAO_CONFORME">Não conforme</button></p><textarea class="input hidden obs" placeholder="Observação obrigatória"></textarea></div>`).join("")}${filePicker("prev")}<button type="submit" class="btn primary w-full mt">Concluir preventiva</button></form>`);
  bindFilePicker("prev",prevFiles,null,"prevMsg");
  document.querySelectorAll(".choice").forEach(c=>c.onclick=()=>{const w=c.closest(".check");w.querySelectorAll(".choice").forEach(x=>x.classList.remove("active"));c.classList.add("active");w.querySelector(".obs").classList.toggle("hidden",c.dataset.v!=="NAO_CONFORME")});
  document.getElementById("execPrev").onsubmit=async e=>{
    e.preventDefault();const responses=[];let invalid=false;const non=[];
    document.querySelectorAll(".check").forEach(w=>{const a=w.querySelector(".choice.active"),obs=w.querySelector(".obs").value.trim(),item=w.dataset.item;if(!a||(a.dataset.v==="NAO_CONFORME"&&!obs))invalid=true;responses.push({item,status:a?.dataset.v||"",observacao:obs});if(a?.dataset.v==="NAO_CONFORME")non.push({item,obs})});
    const msg=document.getElementById("prevMsg");if(msg)msg.textContent="";if(invalid){if(msg)msg.textContent="Marque todos os itens. Não conforme exige observação.";return}if(!prevFiles.length){if(msg)msg.textContent="Adicione pelo menos uma foto usando Câmera ou Galeria.";return}
    try{
      const btn=e.submitter||e.target.querySelector("button[type=submit]")||e.target.querySelector("button");btn.disabled=true;btn.textContent="Enviando fotos...";
      const files=await uploadFiles(prevFiles,`preventiva-${id}`);
      for(const x of files){const {error:attachError}=await sb.from("preventivas_anexos").insert({agendamento_id:id,unidade_id:unitId,usuario_id:currentUser.id,arquivo_nome:x.name,arquivo_url:x.url,mime_type:x.mime,tamanho_bytes:x.size});if(attachError)throw attachError;}
      for(const r of responses){const {error:respError}=await sb.from("preventivas_checklist_respostas").insert({agendamento_id:id,item:r.item,conforme:r.status==="CONFORME",observacao:r.observacao});if(respError)throw respError;}
      const {error}=await sb.from("preventivas_agendamentos").update({status:"CONCLUIDA",executado_por:currentUser.id,executado_em:new Date().toISOString(),fotos_urls:files.map(x=>x.url)}).eq("id",id);
      if(error)throw error;
      for(const n of non){const {error:ncError}=await sb.from("ordens_servico").insert({unidade_id:unitId,equipamento_id:p.equipamento_id,solicitante_id:currentUser.id,tipo:"PREVENTIVA",status:"ABERTA",prioridade:"ALTA",categoria:"Preventiva",problema:"Não conformidade",descricao:`Não conformidade: ${n.item}. Observação: ${n.obs}`});if(ncError)throw ncError;}
      clearFilePicker("prev",prevFiles);await loadBase();closeModal();toast("Preventiva concluída e sincronizada");renderPage("prev");
    }catch(err){if(msg)msg.textContent=err.message||String(err);else toast(err.message||String(err));const btn=e.target.querySelector("button");if(btn){btn.disabled=false;btn.textContent="Tentar novamente";}}
  };
}
bootstrap().catch(e=>{console.error(e);document.getElementById("app").innerHTML=`<div class="login"><div class="login-box">${logo()}<h1>Erro ao abrir</h1><p>${esc(e.message)}</p><button class="btn primary" onclick="location.reload()">Atualizar</button></div></div>`});
