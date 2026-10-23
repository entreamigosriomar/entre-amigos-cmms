// Navegação por hash, sem dependência do app.js (evita import circular).
export function go(route, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const target = '#/' + route + (qs ? '?' + qs : '');
  if (location.hash === target) window.__eaRefresh?.();
  else location.hash = target;
}
export const refresh = () => window.__eaRefresh?.();
