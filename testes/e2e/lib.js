const { chromium } = require('playwright');
const fs = require('fs');
const APP = '/home/claude/entreamigosriomar/entre-amigos-cmms';
const cfgSrc = fs.readFileSync(APP + '/src/config/supabase.js', 'utf8')
  .replace(/export const SUPABASE_URL=.*?;/, 'export const SUPABASE_URL="http://localhost:8080";')
  .replace(/export const SUPABASE_KEY=.*?;/, 'export const SUPABASE_KEY="anon-test";');
async function browser() {
  return chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
}
async function page(b, { mobile = false } = {}) {
  const ctx = await b.newContext(mobile ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 1000 } });
  const p = await ctx.newPage();
  p.errors = [];
  p.on('pageerror', e => p.errors.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/realtime|websocket|fonts|ERR_FAILED|404/i.test(m.text())) p.errors.push('console: ' + m.text()); });
  await p.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js', r => r.fulfill({ path: __dirname + '/node_modules/@supabase/supabase-js/dist/umd/supabase.js', contentType: 'text/javascript' }));
  await p.route('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js', r => r.fulfill({ path: __dirname + '/node_modules/xlsx/dist/xlsx.full.min.js', contentType: 'text/javascript' }));
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, body: '', contentType: 'text/css' }));
  await p.route('**/src/config/supabase.js', r => r.fulfill({ body: cfgSrc, contentType: 'text/javascript' }));
  return p;
}
async function login(p, email) {
  await p.goto('http://localhost:8080/');
  await p.fill('input[name=email]', email);
  await p.fill('input[name=senha]', 'teste123');
  await p.click('button[type=submit]');
  await p.waitForSelector('#page', { timeout: 15000 });
  await p.waitForFunction(() => !document.querySelector('#page .empty') || !/Carregando/.test(document.querySelector('#page').innerText), null, { timeout: 15000 });
}
const shot = (p, n, full = true) => p.screenshot({ path: __dirname + '/shots/' + n + '.png', fullPage: full });
const settle = p => p.waitForTimeout(700);
module.exports = { browser, page, login, shot, settle };
