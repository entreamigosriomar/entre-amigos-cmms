const { browser, page, login, shot, settle } = require('./lib');
(async () => {
  const b = await browser(); const p = await page(b); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  try {
    await login(p, 'walter@teste.com'); await settle(p);
    await p.selectOption('aside [data-unit]', { label: 'RioMar Recife' }); await settle(p);
    await p.goto('http://localhost:8080/#/equipamentos'); await settle(p);
    await p.click('text=Coifa convencional 01'); await settle(p);
    await p.click('[data-tab="planos"]'); await settle(p); await shot(p, '40_coifa_planos', false);
    const btns = await p.$$('[data-plano]'); await btns[btns.length - 1].click(); await settle(p);
    await shot(p, '41_plano_form', false);
    await p.fill('[name="ultima"]', '2026-05-20'); await p.dispatchEvent('[name="ultima"]', 'change'); await settle(p);
    console.log('inicio=', await p.inputValue('[name="inicio"]'), '|', await p.innerText('[data-prox]'));
    await shot(p, '42_plano_form_ultima', false);
    await p.click('[data-ok]'); await settle(p);
    console.log('ERROS:', errs.length ? errs : 'nenhum');
  } finally { await b.close(); }
})();
