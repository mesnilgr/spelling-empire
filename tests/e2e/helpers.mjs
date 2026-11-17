// Shared helpers for the playthrough tests: start a page on the game, answer dialogues,
// spell words through the on-screen keyboard, and record checks.
import { chromium } from 'playwright';

export const STORE = 'spelling-empires-v2';

export async function launch() {
  const args = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--mute-audio'];
  const executablePath = process.env.CHROME_PATH || undefined;
  return chromium.launch({ executablePath, args });
}

// A fresh page on the game, with speech replaced by a recorder and the given saved progress.
// render: false skips drawing most frames (much faster in the test browser); keep it for checks on
// what is drawn (display budget, screenshots).
export async function openGame(browser, base, progress, { quality = 1, width = 1180, height = 820, render = false } = {}) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    window.__spoken = [];
    if (window.speechSynthesis) window.speechSynthesis.speak = (u) => window.__spoken.push(u.text);
  });
  await page.goto(`${base}/?test&quality=${quality}${render ? '' : '&norender'}`);
  await page.evaluate(([key, p]) => { localStorage.clear(); localStorage.setItem(key, JSON.stringify(p)); }, [STORE, progress]);
  await page.reload();
  await page.waitForSelector('#loading.is-done', { timeout: 180000 });
  await page.waitForFunction(() => window.__se?.scene, null, { timeout: 60000 });
  return { page, errors, ...api(page) };
}

function api(page) {
  const click = (sel) => page.evaluate((s) => document.querySelector(s)?.click(), sel);
  const dialogOpen = () => page.$eval('#dialog', (e) => !e.hidden);
  return {
    click,
    dialogOpen,
    // Tap through the open dialogue (choosing the first answer of a choice). Returns lines seen.
    async skipDialog(max = 16) {
      let n = 0;
      while (n < max && await dialogOpen()) {
        n++;
        if (await page.$eval('#dialog-choices', (e) => !e.hidden)) await page.evaluate(() => document.querySelector('#dialog-choices button').click());
        else await click('#dialog-next');
        await page.waitForTimeout(60);
      }
      return n;
    },
    objective: () => page.$eval('#map-instruction', (e) => e.innerText.replace(/\s+/g, ' ').trim()),
    // Teleport next to the first interactable matching `pred` (a JS expression on `i`) and use it.
    async use(pred) {
      return page.evaluate((p) => {
        const s = window.__se.scene;
        const o = s.interactables.find(new Function('i', `return ${p}`));
        if (!o) return 'missing';
        if (!o.active) return 'inactive';
        s.teleport(o.worldPos.x + 0.9, o.worldPos.z + 0.9);
        s.onInteractObject(o);
        return 'ok';
      }, pred);
    },
    // Spell the word asked in the open spelling window with the on-screen keyboard.
    async spell({ wrongFirst = false } = {}) {
      await page.waitForSelector('#spell-modal:not([hidden])', { timeout: 30000 });
      const word = await page.evaluate(() => window.__se.spell().word.word);
      const type = (w) => page.evaluate((x) => {
        for (const ch of x) document.querySelector(`#spell-keyboard .key[aria-label="${ch}"]`)?.click();
        document.querySelector('#spell-check-btn').click();
      }, w);
      if (wrongFirst) {
        await type(word.length > 1 ? word.slice(0, -1) + (word.endsWith('a') ? 'o' : 'a') : (word === 'a' ? 'o' : 'a'));
        await page.waitForTimeout(1700);
        await page.evaluate(() => { const i = document.querySelector('#spell-input'); i.value = ''; i.dispatchEvent(new Event('input')); });
      }
      await type(word);
      await page.waitForTimeout(500);
      const result = await page.$eval('#spell-result', (e) => e.innerText.replace(/\s+/g, ' ').trim());
      await click('#spell-continue-btn');
      await page.waitForTimeout(250);
      return { word, result };
    },
  };
}

// Checks: print each one, remember failures.
export function checker(name, { quiet = false } = {}) {
  const failures = [];
  const lines = [];
  let count = 0;
  const check = (ok, label, detail = '') => {
    count++;
    const line = `  ${ok ? '✓' : '✗'} ${label}${!ok && detail ? ` — ${detail}` : ''}`;
    if (quiet) lines.push(line); else console.log(line);
    if (!ok) failures.push(`${name}: ${label}${detail ? ` — ${detail}` : ''}`);
    return ok;
  };
  return { check, failures, lines, get count() { return count; } };
}
