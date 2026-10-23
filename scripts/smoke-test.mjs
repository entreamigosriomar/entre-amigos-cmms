// Verificações estáticas da V18.1 (rodar com: npm test).
// O teste funcional completo (navegador + banco) fica em testes/e2e — ver testes/README.md.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const checks = [];
const ok = (name, pass) => checks.push({ name, pass: !!pass });

const pages = ['login', 'painel', 'controle', 'ordens', 'equipamentos', 'biblioteca', 'cadastros', 'importar', 'usuarios', 'meudia', 'checklist', 'chamados', 'abrir'];
const core = ['util', 'state', 'data', 'photos', 'os', 'nav'];
const files = ['index.html', 'src/styles.css', 'src/app.js', 'src/config/supabase.js', ...core.map(c => `src/core/${c}.js`), ...pages.map(p => `src/pages/${p}.js`)];
for (const f of files) ok(`arquivo existe: ${f}`, fs.existsSync(path.join(root, f)));

const all = files.filter(f => f.endsWith('.js')).map(read).join('\n');
const index = read('index.html');
for (const f of files.filter(f => f.endsWith('.js'))) {
  try { execSync(`node --experimental-default-type=module --check ${f}`, { stdio: 'pipe' }); ok(`sintaxe ok: ${f}`, true); }
  catch (e) { ok(`sintaxe ok: ${f} — ${String(e.stderr).split('\n')[0]}`, false); }
}
for (const p of pages.filter(p => p !== 'login')) ok(`página ${p} exporta render()`, /export async function render\(/.test(read(`src/pages/${p}.js`)));
ok('supabase-js com versão fixa', /supabase-js@2\.\d+\.\d+/.test(index));
ok('leitor de planilha com versão fixa', /xlsx@0\.18\.5/.test(read('src/pages/importar.js')));
ok('fotos não usam link público', !all.includes('getPublicUrl'));
ok('fotos abrem por link temporário', all.includes('createSignedUrls'));
ok('sem chave privilegiada no frontend', !(all + index).includes('service' + '_role'));
ok('status de aprovação igual ao do banco', !all.includes('AGUARDANDO_APROVACAO_DIRETOR') && all.includes("'AGUARDANDO_APROVACAO'"));
ok('atraso de OS usa sla_limite', all.includes('sla_limite') && !all.includes('prazo_sla'));
ok('chamado tem origem CHAMADO e urgência', read('src/pages/abrir.js').includes("origem: 'CHAMADO'") && read('src/pages/abrir.js').includes('urgencia'));
ok('chamado filtra item por setor e categoria', read('src/pages/abrir.js').includes('e.setor_id === st.setor') && read('src/pages/abrir.js').includes('st.categoria'));
ok('líder confirma pela função confirmar_chamado', read('src/pages/chamados.js').includes("rpc('confirmar_chamado'"));
ok('NC do checklist exige descrição e foto', read('src/pages/checklist.js').includes('Não conformidade exige descrição e foto'));
ok('medição fora da faixa vira NC', read('src/pages/checklist.js').includes('foraDaFaixa'));
ok('técnico muda situação do equipamento por função', read('src/core/data.js').includes("rpc('atualizar_status_equipamento'"));
ok('geração automática do mês', read('src/core/state.js').includes("rpc('gerar_preventivas_mes'"));
ok('localStorage só com try/catch', !/localStorage\.(get|set|remove)Item/.test(all.replace(/try \{[^}]*localStorage[^}]*\}/g, '')));
for (const s of ['01_fechar_views', '02_preventivas_mensais', '03_fotos_privadas', '04_carga_biblioteca', '05_chamados_e_locais']) ok(`SQL ${s} presente`, fs.existsSync(path.join(root, `sql/${s}.sql`)));

const failed = checks.filter(c => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}`);
if (failed.length) { console.error(`\n${failed.length} verificação(ões) falharam.`); process.exit(1); }
console.log(`\n${checks.length} verificações passaram.`);
