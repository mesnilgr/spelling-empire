// Runs the playthrough scenarios against a Vite dev server started here.
// Usage: npm run test:e2e              (all scenarios)
//        npm run test:e2e -- forêt     (only scenarios whose name contains "forêt")
//        npm run test:e2e -- --quick   (the quick check before a release: scenarios marked `quick`;
//                                       add a name to also run the scenarios touched by the change)
// Scenarios run side by side, one browser per job (E2E_JOBS, default: number of CPUs, at most 4).
// Set CHROME_PATH to use an installed Chrome instead of Playwright's Chromium.
import os from 'node:os';
import { createServer } from 'vite';
import { launch, checker } from './helpers.mjs';
import { SCENARIOS } from './scenarios.mjs';

const args = process.argv.slice(2);
const quick = args.includes('--quick');
const filter = args.find((a) => !a.startsWith('--'))?.toLowerCase();
// --quick plus a name: the quick ones and the named ones (e.g. `--quick zombies` after a zombie change).
const list = SCENARIOS.filter((sc) => (!quick && !filter) || (quick && sc.quick) || (filter && sc.name.toLowerCase().includes(filter)));
const jobs = Math.max(1, Math.min(list.length, Number(process.env.E2E_JOBS) || Math.min(4, os.cpus().length)));

const server = await createServer({ server: { port: 0, host: '127.0.0.1' }, logLevel: 'error' });
await server.listen();
const base = server.resolvedUrls.local[0].replace(/\/$/, '');
const failures = [];
let total = 0;
const t0 = Date.now();
console.log(`${list.length} scénario(s), ${jobs} en parallèle${quick ? ' (vérification rapide)' : ''}`);

// Each job has its own browser and takes the next scenario; output is printed per scenario.
// The heaviest scenarios start first so that the jobs end at about the same time.
const queue = [...list].sort((a, b) => (b.weight ?? 1) - (a.weight ?? 1));
async function worker() {
  const browser = await launch();
  for (let sc = queue.shift(); sc; sc = queue.shift()) {
    const c = checker(sc.name, { quiet: true });
    const start = Date.now();
    try {
      await sc.run(browser, base, c.check);
    } catch (e) {
      c.check(false, 'le scénario s’est arrêté', e.message.split('\n')[0]);
    }
    total += c.count;
    failures.push(...c.failures);
    console.log(`\n▶ ${sc.name}  (${Math.round((Date.now() - start) / 1000)} s)\n${c.lines.join('\n')}`);
  }
  await browser.close();
}
await Promise.all(Array.from({ length: jobs }, worker));
await server.close();
console.log(`\n${total - failures.length}/${total} vérifications réussies en ${Math.round((Date.now() - t0) / 1000)} s`);
if (failures.length) {
  console.log('\nÉchecs :');
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
