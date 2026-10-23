import { sb, LOGO } from '../config/supabase.js';
import { esc } from '../core/util.js';

export function renderLogin() {
  document.getElementById('app').innerHTML = `
  <div class="login">
    <form class="login-box" id="loginForm" novalidate>
      <img src="${LOGO}" alt="Entre Amigos">
      <h1>Manutenção</h1>
      <p class="muted small" style="text-align:center;margin:0">Entre com seu usuário pessoal. Não compartilhe a senha.</p>
      <label class="field">E-mail<input class="input" name="email" type="email" autocomplete="username" required></label>
      <label class="field">Senha<input class="input" name="senha" type="password" autocomplete="current-password" required></label>
      <div class="msg" id="loginMsg" role="alert"></div>
      <button type="submit" class="btn btn-primary btn-lg">Entrar</button>
    </form>
  </div>`;
  const f = document.getElementById('loginForm');
  f.onsubmit = async e => {
    e.preventDefault();
    const btn = f.querySelector('button[type=submit]'), msg = document.getElementById('loginMsg');
    const email = f.email.value.trim(), password = f.senha.value;
    if (!email || !password) { msg.textContent = 'Informe e-mail e senha.'; return; }
    btn.disabled = true; btn.textContent = 'Entrando…'; msg.textContent = '';
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      msg.textContent = /invalid/i.test(error.message) ? 'E-mail ou senha incorretos.' : error.message;
      btn.disabled = false; btn.textContent = 'Entrar'; return;
    }
    location.hash = '';
    location.reload();
  };
}
