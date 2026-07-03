import { navigate } from "../router.js";

const localUsersKey = "ea_v13_users";
function users(){
  const raw=localStorage.getItem(localUsersKey);
  if(raw) return JSON.parse(raw);
  const base=[
    {nome:"Deivde Davson",email:"deivde@restauranteentreamigos.com.br",role:"MASTER",status:"Ativo"},
    {nome:"Técnico Manutenção",email:"tecnico.riomar@entreamigos.local",role:"TECNICO",status:"Modelo"},
    {nome:"Líder Operação",email:"lider.riomar@entreamigos.local",role:"OPERADOR",status:"Modelo"}
  ];
  localStorage.setItem(localUsersKey,JSON.stringify(base));
  return base;
}
function save(u){localStorage.setItem(localUsersKey,JSON.stringify(u));}

export async function renderUsuarios(){
  const list=users();
  return `
    <div class="hero-row">
      <div><h1>Usuários e Permissões</h1><p>Área do MASTER para preparar logins individuais da equipe RioMar Recife.</p></div>
      <button class="btn btn-orange" id="novoUser">+ Novo usuário</button>
    </div>
    <div class="card">
      <table class="table">
        <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th></tr></thead>
        <tbody>${list.map(u=>`<tr><td><b>${u.nome}</b></td><td>${u.email}</td><td><span class="pill">${u.role}</span></td><td>${u.status}</td></tr>`).join("")}</tbody>
      </table>
    </div>
    <div id="modalRoot"></div>
  `;
}
export function bindUsuarios(){
  document.getElementById("novoUser")?.addEventListener("click",()=>{
    document.getElementById("modalRoot").innerHTML=`
      <div class="modal-backdrop"><div class="modal">
        <div class="modal-head"><h2>Novo usuário</h2><button class="close-btn" id="fechar">X</button></div>
        <div class="notice-critical">Nesta versão piloto, o cadastro cria um registro local. Para login real, o usuário também precisa ser criado no Supabase Authentication.</div>
        <form id="userForm">
          <div class="form-grid">
            <div><label class="label">Nome</label><input class="input" name="nome" required></div>
            <div><label class="label">E-mail</label><input class="input" name="email" type="email" required></div>
            <div><label class="label">Perfil</label><select class="input" name="role"><option>OPERADOR</option><option>TECNICO</option><option>GERENTE</option><option>DIRETOR</option><option>ADMIN</option></select></div>
          </div>
          <button class="btn btn-primary w-full mt">Salvar usuário</button>
        </form>
      </div></div>`;
    document.getElementById("fechar").onclick=()=>document.getElementById("modalRoot").innerHTML="";
    document.getElementById("userForm").onsubmit=e=>{
      e.preventDefault();
      const list=users();
      list.unshift({...Object.fromEntries(new FormData(e.target).entries()),status:"Pendente Supabase"});
      save(list);
      document.getElementById("modalRoot").innerHTML="";
      navigate("usuarios");
    };
  });
}
