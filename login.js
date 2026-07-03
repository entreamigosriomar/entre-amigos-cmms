import { login, setLocalMaster } from "../services/auth.js";
import { navigate } from "../router.js";

export function renderLogin() {
  return `
    <div class="login-page">
      <div class="login-card">
        <div class="brand">
          <img src="./src/assets/logo.png" class="login-logo" alt="Entre Amigos">
          <div>
            <b>Entre Amigos</b><br>
            <small>Plataforma de Manutenção V14</small>
          </div>
        </div>
        <span class="badge">Produção • Supabase</span>
        <h1>Login</h1>
        <p>Entre com seu usuário individual.</p>
        <form id="loginForm">
          <label class="label">E-mail</label>
          <input class="input" name="email" type="email" value="deivde@restauranteentreamigos.com.br" required>
          <label class="label">Senha</label>
          <input class="input" name="senha" type="password" required>
          <button class="btn btn-primary w-full mt">Entrar</button>
        </form>
        <button id="localMode" class="btn btn-light w-full mt">Entrar em modo local de teste</button>
        <div class="alert mt">Se aparecer erro, confira o arquivo <b>src/supabase/config.js</b>.</div>
      </div>
    </div>
  `;
}

export function bindLogin() {
  document.getElementById("loginForm").onsubmit = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button");
    btn.disabled = true;
    btn.textContent = "Entrando...";
    try {
      await login(e.target.email.value.trim(), e.target.senha.value);
      navigate("dashboard");
    } catch (err) {
      alert("Erro no login: " + (err.message || err));
      btn.disabled = false;
      btn.textContent = "Entrar";
    }
  };

  document.getElementById("localMode").onclick = () => {
    setLocalMaster();
    navigate("dashboard");
  };
}
