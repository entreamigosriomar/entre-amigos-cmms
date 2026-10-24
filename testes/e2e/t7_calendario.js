const { browser, page, login, shot, settle } = require('./lib');
(async () => {
  const b = await browser(); const errs = [];
  for (const mobile of [false, true]) {
    const p = await page(b, { mobile }); p.on('pageerror', e => errs.push(e.message));
    await login(p, 'walter@teste.com'); await settle(p);
    if (!mobile) { await p.selectOption('aside [data-unit]', { label: 'RioMar Recife' }); await settle(p); }
    else { await p.selectOption('.mobile-top [data-unit]', { label: 'RioMar Recife' }); await settle(p); }
    await p.goto('http://localhost:8080/#/controle?mes=2026-11-01'); await settle(p);
    const g = p.locator('[data-gerar]'); if (await g.count()) { await g.first().click(); await p.waitForTimeout(2500); await settle(p); }
    await shot(p, mobile ? '81_cal_mobile' : '80_cal_desktop');
    if (!mobile) { await p.locator('.cal-d:not(.vazio)').nth(3).click(); await settle(p); await shot(p, '82_cal_dia', false); }
  }
  console.log('ERROS:', errs.length ? errs : 'nenhum'); await b.close();
})();
