const { browser, page, login, shot, settle } = require('./lib');
(async () => {
  const b = await browser(); const p = await page(b); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  try {
    await login(p, 'walter@teste.com'); await settle(p);
    await p.goto('http://localhost:8080/#/importar'); await settle(p);
    await p.setInputFiles('[data-file]', process.env.PLANILHA || __dirname + '/teste_import.xlsx');
    await p.waitForSelector('[data-go]'); await settle(p);
    await p.selectOption('[data-inicio]', { index: 0 }); await settle(p);
    console.log('PILLS:', (await p.innerText('.card .pill >> nth=0')), '|', await p.innerText('[data-go]'));
    console.log(await p.locator('[data-prev] .card > div').first().innerText());
    await shot(p, '70_walter_conferencia');
    const t0 = Date.now();
    await p.click('[data-go]');
    await p.waitForFunction(() => /Concluído/.test(document.querySelector('[data-log]')?.innerText || ''), null, { timeout: 300000 });
    console.log('IMPORT (s):', ((Date.now() - t0) / 1000).toFixed(1)); console.log(await p.innerText('[data-log]'));
    await p.selectOption('aside [data-unit]', { label: 'RioMar Recife' }); await settle(p);
    await p.goto('http://localhost:8080/#/equipamentos'); await settle(p); await shot(p, '71_walter_equipamentos');
    await p.goto('http://localhost:8080/#/controle'); await settle(p);
    const g = p.locator('text=Gerar preventivas do mês'); if (await g.count()) { await g.first().click(); await settle(p); await p.waitForTimeout(1500); }
    await shot(p, '72_walter_controle');
    console.log('ERROS:', errs.length ? errs : 'nenhum');
  } finally { await b.close(); }
})();
