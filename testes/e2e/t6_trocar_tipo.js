const { browser, page, login, shot, settle } = require('./lib');
(async () => {
  const b = await browser(); const p = await page(b); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  try {
    await login(p, 'walter@teste.com'); await settle(p);
    await p.selectOption('aside [data-unit]', { label: 'RioMar Recife' }); await settle(p);
    await p.goto('http://localhost:8080/#/equipamentos'); await settle(p);
    await p.click('text=Aquário de ostra'); await settle(p);
    await p.click('[data-editar]'); await settle(p);
    await p.selectOption('[name="tipo_equipamento"]', 'Outro equipamento'); await settle(p);
    console.log('AVISO:', await p.innerText('[data-planos-prev]'));
    await shot(p, '75_trocar_tipo', false);
    await p.click('[data-salvar]'); await p.waitForTimeout(2000);
    console.log('ERROS:', errs.length ? errs : 'nenhum');
  } finally { await b.close(); }
})();
