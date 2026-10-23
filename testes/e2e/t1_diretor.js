const { browser, page, login, shot, settle } = require('./lib');
(async () => {
  const b = await browser(); const p = await page(b);
  try {
    await login(p, 'walter@teste.com'); await settle(p);
    await shot(p, '01_painel_vazio');
    // Importar planilha em RioMar Recife
    await p.goto('http://localhost:8080/#/importar'); await settle(p);
    await p.setInputFiles('[data-file]', __dirname + '/teste_import.xlsx');
    await p.waitForSelector('[data-go]'); await settle(p);
    await shot(p, '02_importar_conferencia');
    await p.click('[data-go]');
    await p.waitForFunction(() => /Concluído/.test(document.querySelector('[data-log]')?.innerText || ''), null, { timeout: 30000 });
    console.log('IMPORT LOG:', await p.innerText('[data-log]'));
    await shot(p, '03_importar_ok');
    // Selecionar unidade RioMar Recife e ver equipamentos
    await p.selectOption('aside [data-unit]', { label: 'RioMar Recife' }); await settle(p);
    await p.goto('http://localhost:8080/#/equipamentos'); await settle(p);
    await shot(p, '04_equipamentos');
    await p.click('text=Câmara de congelados 01'); await settle(p);
    await shot(p, '05_ficha_camara', false);
    await p.click('[data-tab="faixas"]'); await settle(p); await shot(p, '06_ficha_faixas', false);
    await p.click('[data-tab="planos"]'); await settle(p); await shot(p, '06b_ficha_planos', false);
    await p.keyboard.press('Escape'); await p.goto('http://localhost:8080/#/controle'); await settle(p);
    // gerar preventivas
    await p.click('[data-gerar]'); await p.waitForTimeout(1500); await settle(p);
    await shot(p, '07_controle');
    await p.goto('http://localhost:8080/#/biblioteca'); await settle(p);
    await shot(p, '08_biblioteca');
    await p.click('text=GAS-FRI-M'); await settle(p); await shot(p, '09_biblioteca_editor', false);
    await p.goto('http://localhost:8080/#/cadastros'); await settle(p); await shot(p, '10_cadastros');
    await p.goto('http://localhost:8080/#/painel'); await settle(p); await shot(p, '11_painel');
  } catch (e) { console.log('FALHA:', e.message); await shot(p, 'erro_t1'); }
  console.log('ERROS DA PÁGINA:', p.errors.length ? p.errors.join('\n') : 'nenhum');
  await b.close();
})();
