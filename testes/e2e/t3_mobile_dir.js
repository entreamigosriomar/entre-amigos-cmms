const { browser, page, login, shot, settle } = require('./lib');
(async () => {
  const b = await browser(); const p = await page(b, { mobile: true });
  try {
    await login(p, 'walter@teste.com'); await settle(p);
    await shot(p, '60_dir_mobile_painel');
    await p.goto('http://localhost:8080/#/controle'); await settle(p); await shot(p, '61_dir_mobile_controle');
    await p.goto('http://localhost:8080/#/abrir'); await settle(p); await shot(p, '62_dir_mobile_abrir');
    await p.goto('http://localhost:8080/#/usuarios'); await settle(p); await shot(p, '63_dir_mobile_usuarios');
  } catch (e) { console.log('FALHA:', e.message); }
  console.log('ERROS:', p.errors.join('\n') || 'nenhum'); await b.close();
})();
