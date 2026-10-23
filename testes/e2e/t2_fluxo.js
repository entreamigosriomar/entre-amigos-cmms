const { browser, page, login, shot, settle } = require('./lib');
const FOTO = __dirname + '/foto.jpg';
(async () => {
  const b = await browser();
  const errs = [];
  // ---------- LÍDER abre chamado (celular) ----------
  let p = await page(b, { mobile: true });
  try {
    await login(p, 'lider@teste.com'); await settle(p);
    await shot(p, '20_lider_meus_chamados_vazio');
    await p.goto('http://localhost:8080/#/abrir'); await settle(p);
    await p.click('[data-area] >> text=Salão'); await settle(p);
    await p.click('[data-setor] >> text=Salão principal'); await settle(p);
    await p.click('[data-categoria] >> text=Móveis'); await settle(p);
    await shot(p, '21_lider_abrir_passo1');
    await p.click('[data-item] >> text=Cadeiras'); await settle(p);
    await p.click('[data-avancar]'); await settle(p);
    await p.setInputFiles('[data-picker="ch"] input[data-gal]', FOTO); await settle(p);
    await p.fill('[data-desc]', 'Cadeira da mesa 12 com mola do assento folgada');
    await shot(p, '22_lider_abrir_passo2');
    await p.click('[data-avancar]'); await settle(p);
    await p.click('[data-yn="op"][data-v="0"]'); await p.click('[data-yn="risco"][data-v="1"]'); await p.click('[data-yn="cliente"][data-v="1"]'); await settle(p);
    await shot(p, '23_lider_abrir_passo3');
    await p.click('[data-avancar]');
    await p.waitForSelector('text=Chamado enviado', { timeout: 15000 }); await settle(p);
    await shot(p, '24_lider_enviado');
    // segundo chamado: micro-ondas (categoria equipamentos de cozinha)
    await p.click('[data-novo]'); await settle(p);
    await p.click('[data-area] >> text=Cozinha'); await settle(p);
    await p.click('[data-setor] >> text=Sobremesa'); await settle(p);
    await p.click('[data-categoria] >> text=Equipamentos de cozinha'); await settle(p);
    await p.click('[data-item] >> text=Micro-ondas'); await settle(p);
    await p.click('[data-avancar]'); await settle(p);
    await p.setInputFiles('[data-picker="ch"] input[data-gal]', FOTO);
    await p.fill('[data-desc]', 'Micro-ondas não esquenta');
    await p.click('[data-avancar]'); await settle(p);
    await p.click('[data-yn="op"][data-v="1"]'); await p.click('[data-yn="risco"][data-v="0"]'); await p.click('[data-yn="cliente"][data-v="0"]');
    await p.click('[data-avancar]'); await p.waitForSelector('text=Chamado enviado'); await settle(p);
    await p.goto('http://localhost:8080/#/chamados'); await settle(p);
    await shot(p, '25_lider_meus_chamados');
  } catch (e) { console.log('FALHA líder:', e.message); await shot(p, 'erro_lider'); }
  errs.push(...p.errors.map(x => 'líder ' + x)); await p.context().close();

  // ---------- TÉCNICO: meu dia, checklist com NC, OS do chamado ----------
  p = await page(b, { mobile: true });
  try {
    await login(p, 'tecnico@teste.com'); await settle(p);
    await shot(p, '30_tecnico_meu_dia');
    // abre checklist da fritadeira
    const link = await p.locator('a[href^="#/checklist"]').filter({ hasText: '' }).first();
    const fri = p.locator('.task', { hasText: 'Fritadeira a gás 01' }).locator('a[href^="#/checklist"]').first();
    await fri.click(); await settle(p);
    await shot(p, '31_checklist_item1');
    // responder: itens G1..G5 conforme exceto G5 NC
    for (let k = 0; k < 20; k++) {
      const txt = await p.innerText('.item-text').catch(() => null);
      if (!txt) break;
      if (/Queimadores acendem/.test(txt)) {
        await p.click('[data-resp="NC"]'); await settle(p);
        await p.fill('[data-obs]', 'Chama amarela no queimador 2');
        await p.setInputFiles('[data-picker="nc"] input[data-gal]', FOTO); await settle(p);
        await shot(p, '32_checklist_nc');
      } else if (await p.locator('[data-resp="C"]').count()) {
        await p.click('[data-resp="C"]');
      } else if (await p.locator('[data-picker="reg"]').count()) {
        await p.setInputFiles('[data-picker="reg"] input[data-gal]', FOTO); await settle(p);
      }
      await p.click('[data-next]'); await settle(p);
    }
    await shot(p, '33_checklist_revisao');
    await p.click('[data-next]');
    await p.waitForSelector('text=Preventiva concluída', { timeout: 20000 }); await settle(p);
    await shot(p, '34_checklist_concluido');
    console.log('CHECKLIST:', (await p.innerText('.mobile-page')).replace(/\s+/g, ' ').slice(0, 220));
    // Câmara terceirizada: medição fora da faixa
    await p.goto('http://localhost:8080/#/meudia'); await settle(p);
    await p.locator('.task', { hasText: 'Câmara de congelados 01' }).locator('a[href^="#/checklist"]').first().click(); await settle(p);
    for (let k = 0; k < 25; k++) {
      const txt = await p.innerText('.item-text').catch(() => null);
      if (!txt) break;
      if (await p.locator('[data-valor]').count()) {
        const v = /Temperatura no controlador/.test(txt) ? '-10' : /Diferença/.test(txt) ? '1' : /Tensão/.test(txt) ? '221' : /Corrente/.test(txt) ? '9' : '120';
        await p.fill('[data-valor]', v); await settle(p);
        if (/Temperatura no controlador/.test(txt)) { await shot(p, '35_medicao_fora'); await p.fill('[data-obs]', 'Câmara a -10 °C, porta mal vedada'); await p.setInputFiles('[data-picker="nc"] input[data-gal]', FOTO); await settle(p); }
      } else if (await p.locator('[data-picker="reg"]').count()) {
        await p.setInputFiles('[data-picker="reg"] input[data-gal]', FOTO); await settle(p);
      } else if (await p.locator('[data-resp="C"]').count()) { await p.click('[data-resp="C"]'); }
      await p.click('[data-next]'); await settle(p);
    }
    await p.fill('[data-tecext]', 'João (Frio Norte)'); await p.fill('[data-custo]', '450');
    await shot(p, '36_terceirizada_revisao');
    await p.click('[data-next]'); await p.waitForSelector('text=Preventiva concluída', { timeout: 20000 });
    console.log('CAMARA:', (await p.innerText('.mobile-page')).replace(/\s+/g, ' ').slice(0, 220));
    // Chamado da cadeira: iniciar e concluir
    await p.goto('http://localhost:8080/#/meudia'); await settle(p);
    await shot(p, '37_meu_dia_depois');
    await p.locator('[data-os]', { hasText: 'Cadeira' }).first().click(); await settle(p);
    await shot(p, '38_os_ficha', false);
    await p.click('[data-a="iniciar"]'); await settle(p);
    await p.locator('[data-os]', { hasText: 'Cadeira' }).first().click(); await settle(p);
    await p.click('[data-a="concluir"]'); await settle(p);
    await p.setInputFiles('[data-picker="fim"] input[data-gal]', FOTO);
    await p.fill('[data-sol]', 'Troquei a mola e reapertei o assento');
    await p.fill('[data-tempo]', '25'); await p.fill('[data-cmat]', '35.5');
    await shot(p, '39_os_concluir', false);
    await p.click('[data-ok]'); await p.waitForTimeout(2500);
  } catch (e) { console.log('FALHA técnico:', e.message); await shot(p, 'erro_tecnico'); }
  errs.push(...p.errors.map(x => 'técnico ' + x)); await p.context().close();

  // ---------- LÍDER confirma ----------
  p = await page(b, { mobile: true });
  try {
    await login(p, 'lider@teste.com'); await settle(p);
    await shot(p, '40_lider_confirmar');
    await p.click('[data-ok]'); await p.waitForTimeout(1500); await settle(p);
    await shot(p, '41_lider_resolvido');
  } catch (e) { console.log('FALHA confirmação:', e.message); await shot(p, 'erro_confirma'); }
  errs.push(...p.errors.map(x => 'líder2 ' + x)); await p.context().close();

  // ---------- GERENTE: painel, valida terceirizada, OS ----------
  p = await page(b);
  try {
    await login(p, 'gerente@teste.com'); await settle(p);
    await shot(p, '50_gerente_painel');
    await p.goto('http://localhost:8080/#/controle'); await settle(p);
    await shot(p, '51_gerente_controle');
    await p.click('[data-validar]'); await settle(p);
    await shot(p, '52_validar', false);
    await p.fill('[data-vobs]', 'Laudo conferido'); await p.click('[data-val]'); await p.waitForTimeout(1500);
    await p.goto('http://localhost:8080/#/ordens'); await settle(p);
    await shot(p, '53_ordens');
  } catch (e) { console.log('FALHA gerente:', e.message); await shot(p, 'erro_gerente'); }
  errs.push(...p.errors.map(x => 'gerente ' + x));
  console.log('ERROS:', errs.length ? errs.join('\n') : 'nenhum');
  await b.close();
})();
