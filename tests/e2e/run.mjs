// Runs the playthrough scenarios against a Vite dev server started here.
// Usage: npm run test:e2e            (all scenarios)
//        npm run test:e2e -- forêt   (only scenarios whose name contains "forêt")
// Set CHROME_PATH to use an installed Chrome instead of Playwright's Chromium.
import { createServer } from 'vite';
import { launch, checker } from './helpers.mjs';
import { SCENARIOS } from './scenarios.mjs';

const filter = process.argv[2]?.toLowerCase();
const server = await createServer({ server: { port: 0, host: '127.0.0.1' }, logLevel: 'error' });
await server.listen();
const base = server.resolvedUrls.local[0].replace(/\/$/, '');
const browser = await launch();
const failures = [];
let total = 0;
const t0 = Date.now();
for (const sc of SCENARIOS) {
  if (filter && !sc.name.toLowerCase().includes(filter)) continue;
  console.log(`\n▶ ${sc.name}`);
  const c = checker(sc.name);
  const start = Date.now();
  try {
    await sc.run(browser, base, c.check);
  } catch (e) {
    c.check(false, 'le scénario s’est arrêté', e.message.split('\n')[0]);
  }
  total += c.count;
  failures.push(...c.failures);
  console.log(`  (${Math.round((Date.now() - start) / 1000)} s)`);
}
await browser.close();
await server.close();
console.log(`\n${total - failures.length}/${total} vérifications réussies en ${Math.round((Date.now() - t0) / 1000)} s`);
if (failures.length) {
  console.log('\nÉchecs :');
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
