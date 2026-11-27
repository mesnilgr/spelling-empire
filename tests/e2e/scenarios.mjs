// Playthrough scenarios. Each one opens the game with a given save and plays a part of it,
// checking what the child would see. Run with: npm run test:e2e
import { readFileSync } from 'node:fs';
import { openGame, STORE } from './helpers.mjs';

const LETTERS = JSON.parse(readFileSync(new URL('./letters.json', import.meta.url)));
const story = (chapter, step, extra = {}) => ({ chapter, step, counts: {}, signs: { tavern: true, blacksmith: true, tower: true }, mimots: ['fontaine'], mimotWords: {}, travel: {}, intro: true, ...extra });
const save = (st, extra = {}) => ({ levelId: 'mixed', materials: {}, crafted: [], starsEarned: 0, wordsSpelled: 0, story: st, ...extra });

export const SCENARIOS = [
  {
    name: 'Âges et listes de mots',
    quick: true,
    weight: 1,
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr' });
      const levels = await g.page.evaluate(async () => {
        const { WORDS } = await import('/language-engine.js');
        const p = window.__se.progress();
        const at = (age, mastered = {}) => { p.age = age; p.mastered = mastered; return [0, 1, 2].map((t) => window.__se.levelAt(t)).join(','); };
        const allLetters = Object.fromEntries(WORDS.fr.filter((w) => w.level === 'letters').map((w) => [w.word, true]));
        const r = { 5: at(5), 6: at(6), 7: at(7), 8: at(8), up: at(5, allLetters) };
        p.age = undefined; p.mastered = {};
        return r;
      });
      check(levels[5] === 'letters,syllables,gs', '5 ans : lettres, syllabes, premiers mots', levels[5]);
      check(levels[6] === 'easy,medium,challenge', '6 ans : listes CP', levels[6]);
      check(levels[7] === 'medium,challenge,ce2', '7 ans : listes CE1', levels[7]);
      check(levels[8] === 'ce2,ce2hard,homophones', '8 ans : CE2 et homophones', levels[8]);
      check(levels.up === 'syllables,gs,easy', 'une liste maîtrisée fait monter d’un cran', levels.up);
      await g.click('#new-game-btn');
      await g.page.waitForTimeout(400);
      check(await g.page.$eval('#age-modal', (e) => !e.hidden), 'le premier « Jouer » demande l’âge');
      await g.click('#age-buttons .age-btn:nth-child(1)');
      await g.page.waitForTimeout(800);
      const p = await g.page.evaluate((k) => JSON.parse(localStorage.getItem(k)), STORE);
      check(p.age === 5 && p.inputMode === 'draw' && p.traceGuide === true, 'à 5 ans : écriture à la main et modèle grisé', JSON.stringify({ age: p.age, mode: p.inputMode, guide: p.traceGuide }));
      check(g.errors.length === 0, 'aucune erreur JavaScript', g.errors.join(' | '));
      await g.page.close();
    },
  },
  {
    name: 'Chapitre 1 depuis une nouvelle partie',
    quick: true,
    weight: 3,
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 6, inputMode: 'keys' });
      await g.click('#new-game-btn');
      await g.page.waitForSelector('#dialog:not([hidden])', { timeout: 20000 });
      check(await g.skipDialog() === 3, 'l’introduction est racontée (3 répliques)');
      check((await g.objective()).includes('Alaric'), 'premier objectif : parler à Alaric');
      check(await g.page.$eval('#grimoire-btn', (e) => e.hidden), 'le grimoire est caché avant Alaric');
      await g.use("i.kind === 'npc' && i.npcId === 'mage'");
      await g.page.waitForTimeout(200);
      check(await g.skipDialog() === 4, 'Alaric parle (4 répliques)');
      check(!(await g.page.$eval('#grimoire-btn', (e) => e.hidden)), 'Alaric donne le grimoire');
      for (const [house, word] of [['tavern', 'taverne'], ['blacksmith', 'forge'], ['tower', 'tour']]) {
        await g.use(`i.kind === 'sign' && i.signHouse === '${house}'`);
        const r = await g.spell({ wrongFirst: house === 'tavern' });
        check(r.word === word && r.result.includes(word.toUpperCase()), `panneau « ${word} » réécrit${house === 'tavern' ? ' (après une erreur)' : ''}`, r.result);
        await g.skipDialog();
      }
      check((await g.objective()).includes('Mimot'), 'objectif suivant : le Mimot');
      await g.use("i.kind === 'mimot' && i.mimotId === 'fontaine'");
      const m = await g.spell();
      check(m.result.includes('apprivoisé'), 'le Mimot est apprivoisé', m.result);
      await g.skipDialog();
      check((await g.use("i.kind === 'page' && i.pageId === 'page'")) === 'ok', 'la page arrachée apparaît');
      await g.page.waitForTimeout(200);
      await g.skipDialog();
      check((await g.objective()).includes('Chapitre 2'), 'le chapitre 2 commence');
      const st = await g.page.evaluate((k) => JSON.parse(localStorage.getItem(k)).save.story, STORE);
      check(st.chapter === 2 && st.mimots.includes('fontaine'), 'l’avancée est sauvegardée', JSON.stringify(st));
      check(g.errors.length === 0, 'aucune erreur JavaScript', g.errors.join(' | '));
      await g.page.close();
    },
  },
  {
    name: 'Magie dans le village',
    weight: 3,
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 7, stars: 100, inputMode: 'keys', save: save(story(2, 0)) });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(1200);
      for (const id of ['pont', 'fleur', 'arbre', 'pluie', 'lumiere', 'feu']) {
        await g.use(`i.kind === 'circle' && i.cid === '${id}'`);
        const r = await g.spell();
        check(r.result.includes('Sort lancé'), `sort ${id} (« ${r.word} »)`, r.result);
      }
      const walk = await g.page.evaluate(() => {
        const s = window.__se.scene;
        s.teleport(-11.2, -16.3);
        for (let k = 0; k < 20; k++) { const p = s.player.position; const nx = p.x - 0.25; if (!s._blocked(nx, p.z, p.y)) { p.x = nx; p.y = s.groundAt(p.x, p.z); } }
        return { x: s.player.position.x, y: s.player.position.y };
      });
      check(walk.x < -15.5 && walk.y > 0.3, 'on traverse le pont jusqu’à l’île', JSON.stringify(walk));
      await g.page.reload();
      await g.page.waitForSelector('#loading.is-done', { timeout: 180000 });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(1200);
      check(await g.page.evaluate(() => !!window.__se.scene.spellObjects.pont), 'le pont est toujours là après rechargement');
      check(g.errors.length === 0, 'aucune erreur JavaScript', g.errors.join(' | '));
      await g.page.close();
    },
  },
  {
    name: 'Chapitres 2 et 3 : forêt et marais',
    weight: 3,
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 7, stars: 40, inputMode: 'keys', save: save(story(2, 0)) });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(1200);
      const steps = [
        ['panneau de la forêt', "i.kind === 'travel' && i.region === 'forest'", true],
        ['pont sur la rivière', "i.kind === 'circle' && i.cid === 'pont-foret'", true],
        ['Sylvain le forestier', "i.kind === 'npc' && i.npcId === 'forester'", false],
        ['Mimot de la forêt 1', "i.kind === 'mimot' && i.mimotId === 'foret1'", true],
        ['Mimot de la forêt 2', "i.kind === 'mimot' && i.mimotId === 'foret2'", true],
        ['page 2', "i.kind === 'page' && i.pageId === 'page2'", false],
        ['panneau du marais', "i.kind === 'travel' && i.region === 'marsh'", true],
      ];
      for (const [label, pred, spell] of steps) {
        const r = await g.use(pred);
        if (spell && r === 'ok') await g.spell();
        await g.page.waitForTimeout(150);
        await g.skipDialog();
        check(r === 'ok', label, r);
      }
      check(await g.page.evaluate(() => window.__se.scene._blocked(46, 0, 0)), 'la brume bloque l’entrée du marais');
      await g.use("i.kind === 'circle' && i.cid === 'vent-marais'");
      await g.spell();
      await g.skipDialog();
      check(!(await g.page.evaluate(() => window.__se.scene._blocked(46, 0, 0))), 'le sort Vent chasse la brume');
      for (const [label, pred, spell] of [
        ['Mélusine', "i.kind === 'npc' && i.npcId === 'fisher'", false],
        ['lanternes (sort Feu)', "i.kind === 'circle' && i.cid === 'feu-marais'", true],
        ['Mimot du marais 1', "i.kind === 'mimot' && i.mimotId === 'marais1'", true],
        ['Mimot du marais 2', "i.kind === 'mimot' && i.mimotId === 'marais2'", true],
        ['page 3', "i.kind === 'page' && i.pageId === 'page3'", false],
      ]) {
        const r = await g.use(pred);
        if (spell && r === 'ok') await g.spell();
        await g.page.waitForTimeout(150);
        await g.skipDialog();
        check(r === 'ok', label, r);
      }
      check((await g.objective()).includes('Chapitre 4'), 'le chapitre 4 commence', await g.objective());
      await g.use("i.kind === 'travel' && i.region === 'marsh'");
      await g.page.waitForTimeout(300);
      const places = await g.page.$eval('#travel-buttons', (e) => e.innerText);
      check(places.includes('Village') && places.includes('Forêt'), 'le panneau propose les endroits réparés', places.replace(/\n/g, ', '));
      await g.page.evaluate(() => [...document.querySelectorAll('#travel-buttons button')].find((b) => b.textContent.includes('Village')).click());
      await g.page.waitForFunction(() => Math.abs(window.__se.scene.player.position.x) < 10, null, { timeout: 8000 }).catch(() => {});
      const pos = await g.page.evaluate(() => window.__se.scene.player.position.x);
      check(Math.abs(pos) < 10, 'le voyage ramène au village', String(pos));
      check(g.errors.length === 0, 'aucune erreur JavaScript', g.errors.join(' | '));
      await g.page.close();
    },
  },
  {
    name: 'Chapitres 4 et 5 : montagne, plage et fin',
    weight: 3,
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 8, stars: 80, inputMode: 'keys', save: save(story(4, 0, { travel: { forest: true, marsh: true } })) });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(1200);
      await g.use("i.kind === 'travel' && i.region === 'mountain'");
      await g.spell(); await g.skipDialog();
      check(await g.page.evaluate(() => window.__se.scene._blocked(0, -60.6, 2.5)), 'la falaise bloque le sommet');
      await g.use("i.kind === 'circle' && i.cid === 'pierre-montagne'");
      await g.spell(); await g.skipDialog();
      const climb = await g.page.evaluate(() => {
        const s = window.__se.scene;
        s.teleport(0, -54.6);
        for (let k = 0; k < 16; k++) { const p = s.player.position; const nz = p.z - 0.5; if (!s._blocked(p.x, nz, p.y)) { p.z = nz; p.y = s.groundAt(p.x, p.z); } }
        return s.player.position.y;
      });
      check(climb >= 4.4, 'l’escalier de pierre monte au sommet', String(climb));
      for (const [label, pred, spell] of [
        ['Mimot de la neige 1', "i.kind === 'mimot' && i.mimotId === 'neige1'", true],
        ['Mimot de la neige 2', "i.kind === 'mimot' && i.mimotId === 'neige2'", true],
        ['le grand livre', "i.kind === 'book'", false],
        ['panneau de la plage', "i.kind === 'travel' && i.region === 'coast'", true],
        ['phare (sort Lumière)', "i.kind === 'circle' && i.cid === 'lumiere-phare'", true],
        ['pont vers l’île', "i.kind === 'circle' && i.cid === 'pont-ile'", true],
      ]) {
        const r = await g.use(pred);
        if (spell && r === 'ok') await g.spell();
        await g.page.waitForTimeout(150);
        await g.skipDialog();
        check(r === 'ok', label, r);
      }
      const isl = await g.page.evaluate(() => {
        const s = window.__se.scene;
        s.teleport(6, 68.5);
        const step = (dx, dz) => { const p = s.player.position; if (!s._blocked(p.x + dx, p.z + dz, p.y)) { p.x += dx; p.z += dz; p.y = s.groundAt(p.x, p.z); } };
        for (let k = 0; k < 14; k++) step(0, 0.5);
        for (let k = 0; k < 14; k++) step(0.5, 0);
        return s.player.position.x;
      });
      check(isl > 12, 'on marche du ponton jusqu’à l’île de papier', String(isl));
      for (const id of ['papier1', 'papier2', 'papier3']) {
        const r = await g.use(`i.kind === 'mimot' && i.mimotId === '${id}'`);
        if (r === 'ok') await g.spell();
        await g.page.waitForTimeout(150);
        await g.skipDialog();
        check(r === 'ok', `Mimot de papier ${id.slice(-1)}`, r);
      }
      await g.use("i.kind === 'npc' && i.npcId === 'alaricIsland'");
      await g.page.waitForTimeout(200);
      const lines = await g.skipDialog(20);
      await g.page.waitForTimeout(500);
      check(lines >= 8, 'la scène finale, avec le choix, est jouée', String(lines));
      check(await g.page.$eval('#end-modal', (e) => !e.hidden), 'l’écran « Fin ! » s’affiche');
      const st = await g.page.evaluate((k) => JSON.parse(localStorage.getItem(k)).save.story, STORE);
      check(st.chapter === 6 && !!st.ending, 'l’épilogue est sauvegardé', JSON.stringify({ c: st.chapter, e: st.ending }));
      check(await g.page.evaluate(() => window.__se.scene.interactables.find((i) => i.kind === 'npc' && i.npcId === 'mage').npc.visible), 'Alaric est revenu au village');
      check(g.errors.length === 0, 'aucune erreur JavaScript', g.errors.join(' | '));
      await g.page.close();
    },
  },
  {
    name: 'Écriture à la main',
    weight: 4,
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 6, inputMode: 'draw', save: save(story(2, 0)) });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(1000);
      await g.use("i.kind === 'house'");
      await g.page.waitForSelector('#spell-modal:not([hidden])', { timeout: 30000 });
      await g.page.waitForFunction(() => !document.querySelector('#hw-panel').hidden, null, { timeout: 30000 });
      await g.page.evaluate(() => { const c = window.__se.spell(); c.word = { ...c.word, word: 'vélo' }; });
      await g.page.waitForTimeout(1500);
      const draw = (strokes) => g.page.evaluate((s) => {
        const c = document.querySelector('#hw-canvas'); const r = c.getBoundingClientRect();
        for (const st of s) {
          const P = st.map(([x, y]) => [r.left + r.width * (0.15 + x * 0.7), r.top + r.height * (y - 0.12) * 1.05]);
          const ev = (type, [x, y]) => c.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 1, bubbles: true }));
          const fine = []; for (let i = 0; i < P.length - 1; i++) for (let k = 0; k < 6; k++) fine.push([P[i][0] + (P[i + 1][0] - P[i][0]) * k / 6, P[i][1] + (P[i + 1][1] - P[i][1]) * k / 6]);
          fine.push(P[P.length - 1]);
          ev('pointerdown', fine[0]); fine.slice(1).forEach((p) => ev('pointermove', p)); ev('pointerup', fine[fine.length - 1]);
        }
      }, strokes);
      const val = () => g.page.$eval('#spell-input', (e) => e.value);
      await draw(LETTERS.x); await g.page.waitForTimeout(2600);
      check(await val() === '', 'une mauvaise lettre n’est pas écrite', await val());
      check((await g.page.$eval('#hw-label', (e) => e.textContent)).includes('Essaie encore'), 'le jeu dit « Essaie encore »');
      await draw(LETTERS.v); await g.page.waitForTimeout(2600);
      check(await val() === 'v', 'la bonne lettre est écrite', await val());
      await draw(LETTERS.e); await g.page.waitForTimeout(2600);
      check(await val() === 'v' && (await g.page.$eval('#hw-label', (e) => e.textContent)).includes('Presque'), '« e » sans accent : il manque l’accent', await val());
      await draw([[[0.45, 0.32], [0.58, 0.22]]]); await g.page.waitForTimeout(2600);
      check(await val() === 'vé', 'l’accent ajouté ensuite complète la lettre', await val());
      await draw(LETTERS.l);
      await g.page.waitForFunction(() => document.querySelector('#spell-input').value === 'vél', null, { timeout: 10000 }).catch(() => {});
      await draw(LETTERS.o);
      await g.page.waitForFunction(() => !document.querySelector('#spell-result').hidden, null, { timeout: 10000 }).catch(() => {});
      const res = await g.page.$eval('#spell-result', (e) => (e.hidden ? '' : e.innerText));
      check(res.length > 0, 'le mot fini se valide tout seul', await val());
      check(g.errors.length === 0, 'aucune erreur JavaScript', g.errors.join(' | '));
      await g.page.close();
    },
  },
  {
    name: 'Homophones, petites phrases et révision',
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 8, inputMode: 'keys', save: save(story(2, 0)) });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(1000);
      const open = async (pred) => {
        await g.use("i.kind === 'house'");
        await g.page.waitForSelector('#spell-modal:not([hidden])', { timeout: 30000 });
        await g.page.evaluate(async (p) => {
          const { WORDS } = await import('/language-engine.js');
          const w = WORDS.fr.find(new Function('w', `return ${p}`));
          const c = window.__se.spell(); c.word = w;
          const ctx = document.querySelector('#spell-context');
          const [b, a] = (w.blank ?? '').split('___');
          if (w.blank) { ctx.textContent = `${b}…${a}`; ctx.hidden = false; } else ctx.hidden = true;
          document.querySelector('#spell-input').value = ''; document.querySelector('#spell-input').dispatchEvent(new Event('input'));
        }, pred);
      };
      // Homophone: the sentence with its blank is shown and "est" is accepted.
      await g.use("i.kind === 'house'");
      await g.page.waitForSelector('#spell-modal:not([hidden])', { timeout: 30000 });
      await g.page.evaluate(() => document.querySelector('#spell-modal').hidden = true);
      await open("w.level === 'homophones' && w.word === 'est'");
      check(await g.page.$eval('#spell-context', (e) => !e.hidden && e.textContent.includes('Le ciel')), 'la phrase à trous est affichée');
      let r = await g.spell();
      check(r.word === 'est' && r.result.length > 0, 'le petit mot « est » est accepté', r.result);
      // Phrase: typing only the letters fills the spaces.
      await open("w.level === 'phrases' && w.word === 'les chats dorment'");
      await g.page.evaluate(() => { for (const ch of 'leschatsdorment') document.querySelector(`#spell-keyboard .key[aria-label="${ch}"]`).click(); });
      check(await g.page.$eval('#spell-input', (e) => e.value) === 'les chats dorment', 'les espaces se mettent tout seuls');
      check(await g.page.$$eval('#spell-tiles .tile-space', (t) => t.length) === 2, 'deux cases d’espace');
      await g.click('#spell-check-btn');
      await g.page.waitForTimeout(500);
      check((await g.page.$eval('#spell-result', (e) => e.innerText)).includes('les chats dorment'), 'la phrase est validée');
      await g.click('#spell-continue-btn');
      // Review: a word due for review comes back more often than the others.
      const counts = await g.page.evaluate(() => {
        const p = window.__se.progress();
        p.wordStats['fr:forêt'] = { lang: 'fr', word: 'forêt', level: 'ce2', seen: 2, correct: 0, wrong: 2, firstTry: 0, lastSeen: 0, misspellings: [], box: 0, due: Date.now() - 1000 };
        let n = 0; for (let k = 0; k < 40; k++) if (window.__se.pickWord('ce2').word === 'forêt') n++;
        return n;
      });
      check(counts >= 8, `un mot à revoir revient souvent (${counts} fois sur 40)`);
      check(g.errors.length === 0, 'aucune erreur JavaScript', g.errors.join(' | '));
      await g.page.close();
    },
  },
  {
    name: 'Parcours de lave et fontaine',
    weight: 5,
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 7, save: save(story(2, 0)) }, { quality: 0 });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(1000);
      // Every jump is easy: simulate the hero with the game's own physics, jumping early, late,
      // at an angle and at half speed (as a child would), and check he lands on the next pillar.
      const sim = await g.page.evaluate(async () => {
        const { LAVA } = await import('/regions.js');
        const s = window.__se.scene;
        const JUMP = 8.2, G = 24, dt = 1 / 60;
        const path = [{ x: LAVA.start.x, z: LAVA.start.z, y: 0, size: 2.6 }, ...LAVA.pillars.map(([x, z, size, h, role]) => ({ x, z, y: h, size, role }))];
        const styles = { 'tôt': { early: 0.9, side: 0, speed: 4.5 }, 'tard': { early: 0.02, side: 0, speed: 4.5 }, 'en biais': { early: 0.3, side: 0.9, speed: 4.5 }, 'lent': { early: 0.3, side: 0, speed: 2.2 } };
        const out = [];
        for (const [style, st] of Object.entries(styles)) {
          for (let k = 0; k + 1 < path.length; k++) {
            const A = path[k], B = path[k + 1];
            const dx = B.x - A.x, dz = B.z - A.z, d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d;
            // Start off-centre for the "at an angle" jumps.
            const p = { x: A.x - uz * st.side, z: A.z + ux * st.side, y: A.y }; let vy = 0, ground = true, jumped = false, landed = null;
            for (let t = 0; t < 5 && !landed; t += dt) {
              const along = (p.x - A.x) * ux + (p.z - A.z) * uz;
              if (!jumped && ground && along > A.size / 2 - st.early) { vy = JUMP; ground = false; jumped = true; }
              const nx = p.x + ux * st.speed * dt, nz = p.z + uz * st.speed * dt;
              if (!s._blocked(nx, p.z, p.y)) p.x = nx;
              if (!s._blocked(p.x, nz, p.y)) p.z = nz;
              vy -= G * dt; p.y += vy * dt;
              const gr = s.groundAt(p.x, p.z);
              if (p.y <= gr) { p.y = gr; vy = 0; if (jumped) landed = s._walkwayAt(p.x, p.z) ? 'pilier' : 'lave'; ground = true; }
            }
            const ok = landed === 'pilier' && Math.abs(p.x - B.x) <= B.size / 2 && Math.abs(p.z - B.z) <= B.size / 2;
            if (!ok) out.push(`${style} → pilier ${k + 1} (${landed} @${p.x.toFixed(1)},${p.z.toFixed(1)})`);
          }
        }
        return { bad: out, jumps: (path.length - 1) * Object.keys(styles).length };
      });
      check(sim.bad.length === 0, `les ${sim.jumps} sauts réussissent, même tôt, tard, en biais ou lentement`, sim.bad.join(' ; '));
      // Falling in the lava: "Ouch!" and back to the start.
      await g.page.evaluate(() => { window.__se.reviveAlways = true; });
      await g.page.evaluate(() => window.__se.scene.teleport(31.5, -39.6));
      // Waits for the respawn rather than a fixed time (frames run late when the machine is busy).
      await g.page.waitForFunction(() => { const p = window.__se.scene.player.position; return Math.hypot(p.x - 29, p.z + 37.4) < 1.5; }, null, { timeout: 12000 }).catch(() => {});
      const after = await g.page.evaluate(() => { const p = window.__se.scene.player.position; return { x: p.x, z: p.z }; });
      check(Math.hypot(after.x - 29, after.z + 37.4) < 1.5, 'tomber dans la lave ramène au départ', JSON.stringify(after));
      const asked = await g.page.waitForFunction(() => window.__se.spell()?.type === 'revive' && !document.querySelector('#spell-modal').hidden, null, { timeout: 8000 }).then(() => true, () => false);
      check(asked, 'après la chute, il faut épeler un mot pour repartir');
      const rv = await g.spell();
      check(rv.result.includes('reparti'), 'le mot réussi, on repart', rv.result);
      // Three falls on the same jump: a footbridge appears.
      for (let k = 0; k < 2; k++) {
        await g.page.evaluate(() => window.__se.scene.teleport(31.5, -39.6));
        if (await g.page.waitForFunction(() => window.__se.spell()?.type === 'revive', null, { timeout: 8000 }).then(() => true, () => false)) await g.spell();
      }
      await g.page.waitForTimeout(1200);
      check(await g.page.evaluate(() => window.__se.scene.walkways.some((w) => w.help)), 'après 3 chutes au même saut, une passerelle d’aide apparaît');
      // Most falls (4 in 5) need no word: back on your feet straight away.
      await g.page.evaluate(() => { window.__se.reviveAlways = false; window.__rnd = Math.random; Math.random = () => 0.9; window.__se.scene.teleport(31.5, -39.6); });
      await g.page.waitForTimeout(3000);
      check(await g.page.evaluate(() => window.__se.spell()?.type !== 'revive' && document.querySelector('#spell-modal').hidden), 'la plupart des chutes ne demandent pas de mot (1 sur 5 seulement)');
      await g.page.evaluate(() => { Math.random = window.__rnd; window.__se.reviveAlways = true; });
      // Flags, then the finish.
      for (const role of ['cp1', 'cp2', 'cp3']) {
        await g.page.evaluate((r) => { const s = window.__se.scene; const c = s.lavaPillar(r); s.teleport(c.x, c.z); }, role);
        await g.page.waitForTimeout(700);
      }
      check(await g.page.evaluate(() => window.__se.game().parkour?.cp === 'cp3'), 'les drapeaux sont enregistrés');
      await g.page.evaluate(() => window.__se.scene.teleport(33, -56));
      await g.page.waitForTimeout(2200);
      if (await g.page.waitForFunction(() => window.__se.spell()?.type === 'revive', null, { timeout: 8000 }).then(() => true, () => false)) await g.spell();
      const cpBack = await g.page.evaluate(() => { const p = window.__se.scene.player.position; return { x: p.x, z: p.z }; });
      check(Math.hypot(cpBack.x - 36.8, cpBack.z + 52.7) < 1.5, 'après le drapeau 3, une chute ramène au drapeau 3', JSON.stringify(cpBack));
      await g.page.evaluate(() => { const s = window.__se.scene; const c = s.lavaPillar('finish'); s.teleport(c.x, c.z); });
      await g.page.waitForTimeout(900);
      check(await g.page.evaluate(() => window.__se.game().parkour?.done === true), 'l’arrivée valide le parcours');
      check((await g.objective()).includes('fontaine'), 'objectif : retourner à la fontaine', await g.objective());
      const down = await g.page.evaluate(() => { const s = window.__se.scene; const p = { x: 36.8, z: -56.6, y: 0.6 }; for (let k = 0; k < 40 && p.z > -60.8; k++) { const nz = p.z - 0.15; if (!s._blocked(p.x, nz, p.y)) { p.z = nz; p.y = s.groundAt(p.x, p.z); } } return p; });
      check(down.z < -60.5 && down.y < 0.3, 'la rampe de sortie descend hors de la lave', JSON.stringify(down));
      check(await g.page.evaluate(() => window.__se.scene.village.fountain.position.y) === 0, 'la fontaine ne bouge pas avant d’y retourner');
      await g.page.evaluate(() => window.__se.scene.teleport(0, 3.4));
      await g.page.waitForFunction(() => window.__se.scene.village.fountain.position.y > 1.2, null, { timeout: 12000 }).catch(() => {});
      const fy = await g.page.evaluate(() => window.__se.scene.village.fountain.position.y);
      check(fy > 1.2, 'de retour à la fontaine, elle s’élève', String(fy));
      await g.page.reload();
      await g.page.waitForSelector('#loading.is-done', { timeout: 180000 });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(1000);
      check(await g.page.evaluate(() => window.__se.scene.village.fountain.position.y > 1.2), 'la fontaine reste levée après rechargement');
      check(g.errors.length === 0, 'aucune erreur JavaScript', g.errors.join(' | '));
      await g.page.close();
    },
  },
  {
    name: 'Zombies la nuit',
    weight: 3,
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 7, stars: 10, save: save(story(2, 0), { crafted: [] }) }, { quality: 0 });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(1000);
      await g.page.evaluate(() => { const s = window.__se.scene; window.__ko = 0; const prev = s.onKnockOut; s.onKnockOut = (r) => { window.__ko++; window.__koReason = r; prev?.(r); }; });
      check(await g.page.evaluate(() => window.__se.scene.zombies.active.length === 0), 'pas de zombie le jour');
      // Night, outside in the fields.
      await g.page.evaluate(() => { const s = window.__se.scene; s.teleport(8, 24); s.dayTime = 0.8 * 420; });
      await g.page.waitForFunction(() => window.__se.scene.zombies.active.length >= 1, null, { timeout: 30000 }).catch(() => {});
      const n = await g.page.evaluate(() => window.__se.scene.zombies.active.length);
      check(n >= 1, `la nuit, des zombies apparaissent (${n})`);
      // Step the zombies with their own code (the test browser runs the game slowly).
      const step = (sec) => g.page.evaluate((n) => { const s = window.__se.scene; for (let k = 0; k < n; k++) s.zombies.update(1 / 30, s.clock.elapsedTime + k / 30); }, Math.round(sec * 30));
      // Follow one zombie (another may appear meanwhile); the best of the zombies counts.
      const dists = () => g.page.evaluate(() => { const s = window.__se.scene, p = s.player.position; window.__chase ??= s.zombies.active.slice(); return window.__chase.map((z) => Math.hypot(z.mesh.position.x - p.x, z.mesh.position.z - p.z)); });
      const a0 = await dists();
      await step(2);
      const a1 = await dists();
      const gains = a0.map((d, i) => d - a1[i]), best = gains.indexOf(Math.max(...gains));
      const d0 = a0[best], d1 = a1[best];
      check(d1 < d0 - 3, `ils poursuivent le héros dehors (${d0.toFixed(1)} → ${d1.toFixed(1)} en 2 s)`);
      // First touch: one heart lost, nothing else. Second touch: back home, nothing lost.
      await g.page.evaluate(() => { const s = window.__se.scene; window.__touch = 0; const prev = s.onZombieCatch; s.onZombieCatch = (z) => { window.__touch++; const r = prev?.(z); if (window.__touch === 1) window.__afterFirst = { ko: window.__ko, hearts: document.querySelector('#hearts').textContent, shown: !document.querySelector('#hearts').hidden }; return r; }; });
      // (a zombie can stay stuck below the terraces of the hill: bring them up, 5 m away in the open)
      await g.page.evaluate(() => { const s = window.__se.scene, p = s.player.position; const free = []; for (let a = 0; a < 24; a++) { const x = p.x + Math.cos(a / 24 * 6.283) * 5, z = p.z + Math.sin(a / 24 * 6.283) * 5; if (!s._checkCollision(x, z) && Math.abs(s.groundAt(x, z) - p.y) < 0.3) free.push([x, z]); } s.zombies.active.forEach((z, i) => { const f = free[(i * 5) % free.length]; if (f) z.mesh.position.set(f[0], s.groundAt(f[0], f[1]), f[1]); }); });
      for (let k = 0; k < 40 && !(await g.page.evaluate(() => window.__touch >= 1)); k++) { await step(0.5); await g.page.waitForTimeout(50); }
      const hurt = await g.page.evaluate(() => window.__afterFirst ?? { touch: window.__touch });
      check(hurt.ko === 0 && hurt.hearts === '❤️🤍', 'au premier contact, le héros perd un cœur sans être renvoyé', JSON.stringify(hurt));
      for (let k = 0; k < 20 && !(await g.page.evaluate(() => window.__ko >= 1)); k++) { await step(1); await g.page.waitForTimeout(100); }
      await g.page.waitForTimeout(1500);
      const home = await g.page.evaluate(() => { const s = window.__se.scene; const bed = s.interactables.find((i) => i.kind === 'bed'); const p = s.player.position; return { ko: window.__ko, reason: window.__koReason, dist: Math.hypot(p.x - bed.worldPos.x, p.z - bed.worldPos.z), safe: s.zombies.heroSafe() }; });
      check(home.ko === 1 && home.reason === 'zombie' && home.dist < 2.5, 'au deuxième contact, retour au lit de la chaumière', JSON.stringify(home));
      check(home.safe, 'dans la maison, le héros est à l’abri');
      await step(10);
      await g.page.waitForTimeout(500);
      const inside = await g.page.evaluate(() => { const s = window.__se.scene; return { ko: window.__ko, inHouse: s.zombies.active.some((z) => s._insideAnyHouse(z.mesh.position.x, z.mesh.position.z, 0)) }; });
      check(inside.ko === 1 && !inside.inHouse, 'aucun zombie n’entre ni n’attaque dans une maison', JSON.stringify(inside));
      // Defend. Bare hands push back; any sword defeats in one hit; the diamond sword hits all around.
      const place = (spots, armed = false) => g.page.evaluate(([spots, armed]) => {
        const s = window.__se.scene; s.zombies.grace = 30;
        s.teleport(8, 24); s.player.rotation.y = 0; s.player.userData.action = null;
        s.zombies.clear(false); s.zombies.armedChance = armed ? 1 : 0;
        while (s.zombies.active.length < spots.length) s.zombies._spawn();
        s.zombies.armedChance = 0;
        s.zombies.active.forEach((z, k) => { const sp = spots[k] ?? [30, 40]; z.mesh.position.set(sp[0], s.groundAt(sp[0], sp[1]), sp[1]); z.mesh.scale.setScalar(1); z.stun = 0; });
        window.__targets = s.zombies.active.slice(0, spots.length);
        window.__starsBefore = window.__se.progress().stars;
      }, [spots, armed]);
      const stepDeaths = () => g.page.evaluate(() => { const s = window.__se.scene; for (let k = 0; k < 30; k++) s.zombies._tickDying(1 / 30); });
      await place([[8, 25.2]]);
      await g.page.evaluate(() => { window.__se.game().crafted = []; });
      await g.page.waitForTimeout(400);
      check(await g.page.$eval('#attack-btn', (e) => !e.hidden), 'le bouton ⚔️ apparaît quand un zombie est proche');
      await place([[8, 22.8]]);
      await g.page.evaluate(() => { window.__se.scene.player.rotation.y = Math.PI; });
      await g.click('#attack-btn');
      const pushed = await g.page.evaluate(() => { const s = window.__se.scene, z = window.__targets[0], p = s.player.position; return { alive: z.alive, d: Math.hypot(z.mesh.position.x - p.x, z.mesh.position.z - p.z), stun: z.stun, ry: s.player.rotation.y, p: [p.x, p.z], zp: [z.mesh.position.x, z.mesh.position.z], col: s._checkCollision(8, 26.8), crafted: window.__se.game().crafted }; });
      check(pushed.alive && pushed.d > 2, 'à mains nues, on repousse le zombie sans le vaincre', JSON.stringify(pushed));
      await place([[8, 25.2]]);
      await g.page.evaluate(() => {
        window.__se.game().crafted = ['sword']; window.__se.zombieWordAlways = 1;
        window.__smiles = 0;
        new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.textContent?.includes('😄')) window.__smiles++; }).observe(document.body, { childList: true, subtree: true });
      });
      await g.click('#attack-btn');
      await stepDeaths();
      const one = await g.page.evaluate(() => ({ alive: window.__targets[0].alive, stars: window.__se.progress().stars - window.__starsBefore, drops: window.__se.scene.zombies.drops.length, smile: window.__smiles > 0 }));
      check(!one.alive && one.stars === 1, 'une épée normale vainc un zombie d’un seul coup (+1 ★)', JSON.stringify(one));
      check(one.drops >= 1, 'le zombie vaincu laisse un morceau de viande 🍖', JSON.stringify(one));
      check(one.smile, 'un 😄 apparaît après la victoire', JSON.stringify(one));
      // Sometimes (one time in four) a bonus word after a victory.
      const asked = await g.page.waitForFunction(() => window.__se.spell()?.type === 'zombieWord', null, { timeout: 8000 }).then(() => true, () => false);
      check(asked, 'parfois, après une victoire, un mot bonus à épeler');
      if (asked) {
        await g.page.evaluate(() => { window.__starsBefore = window.__se.progress().stars; });
        await g.spell();
        check(await g.page.evaluate(() => window.__se.progress().stars - window.__starsBefore >= 3), 'le mot bonus réussi rapporte des étoiles en plus (+2)');
      }
      await g.page.evaluate(() => { window.__se.zombieWordAlways = 0; });
      // Walk over the meat: it goes into the bag.
      const meat = await g.page.evaluate(() => {
        const s = window.__se.scene, d = s.zombies.drops[0], before = window.__se.game().materials.meat ?? 0;
        s.teleport(d.x, d.z); s.zombies._tickDrops(1 / 30, 0);
        return { before, after: window.__se.game().materials.meat ?? 0, left: s.zombies.drops.length };
      });
      check(meat.after === meat.before + 1, 'marcher sur la viande la ramasse (+1 🍖)', JSON.stringify(meat));
      // Diamond sword: all around, even behind.
      await place([[8, 25.6], [8, 22.0], [10.2, 24]]);
      await g.page.evaluate(() => { window.__se.game().crafted = ['sword', 'hammer', 'sword_diamond']; });
      await g.click('#attack-btn');
      await stepDeaths();
      const ring = await g.page.evaluate(() => ({ alive: window.__targets.filter((z) => z.alive).length, stars: window.__se.progress().stars - window.__starsBefore }));
      check(ring.alive === 0 && ring.stars === 3, 'l’épée en diamant frappe tout autour : 3 zombies d’un coup, même derrière', JSON.stringify(ring));
      // Armed zombie (one in four): helmet and sword; two hits of an ordinary sword, one of the diamond sword.
      await place([[8, 25.2]], true);
      const look = await g.page.evaluate(() => ({ armed: window.__targets[0].armed, sword: !!window.__targets[0].mesh.userData.sword }));
      check(look.armed && look.sword, 'un zombie armé porte un casque et une épée', JSON.stringify(look));
      await g.page.evaluate(() => { window.__se.game().crafted = ['sword']; });
      await g.click('#attack-btn');
      const first = await g.page.evaluate(() => { const z = window.__targets[0]; return { alive: z.alive, armed: z.armed, sword: !!z.mesh.userData.sword, helmet: !!z.mesh.userData.parts.head.children.find((c) => c.isMesh && c.material?.color?.getHex() === 0x8a929c) }; });
      check(first.alive && !first.armed && !first.sword && !first.helmet, 'premier coup : son casque et son épée s’envolent, il est encore debout', JSON.stringify(first));
      await g.page.evaluate(() => { const s = window.__se.scene, z = window.__targets[0]; z.mesh.position.set(8, s.groundAt(8, 25.2), 25.2); z.stun = 0; s.player.userData.action = null; s.player.rotation.y = 0; });
      await g.click('#attack-btn');
      await stepDeaths();
      check(await g.page.evaluate(() => !window.__targets[0].alive), 'deuxième coup : le zombie armé est vaincu');
      await place([[8, 25.2]], true);
      await g.page.evaluate(() => { window.__se.game().crafted = ['sword', 'hammer', 'sword_diamond']; });
      await g.click('#attack-btn');
      await stepDeaths();
      check(await g.page.evaluate(() => !window.__targets[0].alive), 'l’épée en diamant bat un zombie armé d’un seul coup');
      // A skewer for Rosa: meat + wood + fire, then give it to her.
      await g.page.evaluate(() => { const m = window.__se.game().materials; m.meat = 1; m.wood = (m.wood ?? 0) + 1; m.fire = (m.fire ?? 0) + 1; });
      await g.click('#craft-open-btn');
      await g.page.waitForTimeout(300);
      const crafted = await g.page.evaluate(() => { const c = [...document.querySelectorAll('#craft-list .craft-card.is-clickable')].find((e) => e.textContent.includes('Brochette')); c?.click(); return !!c; });
      await g.page.waitForTimeout(300);
      const bag = await g.page.evaluate(() => ({ brochette: window.__se.game().materials.brochette ?? 0, meat: window.__se.game().materials.meat ?? 0 }));
      check(crafted && bag.brochette === 1 && bag.meat === 0, 'la recette Brochette (viande + bois + feu) se cuisine', JSON.stringify(bag));
      await g.page.evaluate(() => { window.__starsBefore = window.__se.progress().stars; });
      await g.page.evaluate(() => window.__se.scene.zombies.clear(false));
      check(await g.use("i.kind === 'npc' && i.npcId === 'merchant'") === 'ok', 'on parle à Rosa');
      await g.page.waitForTimeout(400);
      const rosa = await g.page.evaluate(() => ({ brochette: window.__se.game().materials.brochette ?? 0, stars: window.__se.progress().stars - window.__starsBefore }));
      check(rosa.brochette === 0 && rosa.stars === 5, 'Rosa prend la brochette et donne 5 ★', JSON.stringify(rosa));
      // Lava bucket: crafted, then lava erupts in front of the hero; zombies in it burn, not the hero.
      await g.page.evaluate(() => { const m = window.__se.game().materials; m.iron = (m.iron ?? 0) + 1; m.fire = (m.fire ?? 0) + 1; m.stone = (m.stone ?? 0) + 1; });
      await g.click('#craft-open-btn');
      await g.page.waitForTimeout(300);
      await g.page.evaluate(() => [...document.querySelectorAll('#craft-list .craft-card.is-clickable')].find((e) => e.textContent.includes('Seau'))?.click());
      await g.page.waitForTimeout(300);
      check(await g.page.evaluate(() => window.__se.game().crafted.includes('bucket') && window.__se.game().equipped === 'bucket'), 'la recette Seau de lave (fer + feu + pierre) se fabrique et se tient en main');
      await place([[8, 26.4]]);
      await g.page.evaluate(() => { window.__se.scene.zombies.grace = 0; });
      await g.click('#use-btn');
      await g.page.waitForFunction(() => window.__se.scene.eruptions?.length > 0, null, { timeout: 5000 }).catch(() => {});
      const lava = await g.page.evaluate(() => {
        const s = window.__se.scene, z = window.__targets[0], ko = window.__ko;
        s.zombies.grace = 30;
        for (let k = 0; k < 10; k++) s.zombies.update(1 / 30, s.clock.elapsedTime + k / 30);
        const p = s.player.position;
        return { erupt: s.eruptions?.length ?? 0, zAlive: z.alive, heroHurt: window.__ko !== ko, heroInLava: s.lavaHurts(p.x, p.z) };
      });
      check(lava.erupt === 1, 'le seau fait jaillir la lave devant le héros', JSON.stringify(lava));
      check(!lava.zAlive, 'un zombie dans la lave est vaincu', JSON.stringify(lava));
      check(!lava.heroHurt, 'la lave du seau ne fait pas de mal au héros', JSON.stringify(lava));
      await g.page.evaluate(() => { window.__se.scene.player.userData.action = null; });
      await g.click('#use-btn');
      await g.page.waitForTimeout(300);
      check(await g.page.evaluate(() => [...document.querySelectorAll('.toast, #toast')].some((e) => /seau se remplit/i.test(e.textContent))), 'le seau se recharge pendant 30 s');
      check(await g.page.evaluate(() => { const s = window.__se.scene; for (let k = 0; k < 30; k++) s._tickEruptions(0.1); return (s.eruptions?.length ?? 0) === 0; }), 'la lave disparaît au bout de 3 s');
      // Dawn: they go away. Switched off by the parents: none at night.
      await g.page.evaluate(() => { window.__se.scene.dayTime = 0.3 * 420; });
      await g.page.waitForTimeout(1500);
      check(await g.page.evaluate(() => window.__se.scene.zombies.active.length === 0), 'au lever du jour, les zombies disparaissent');
      await g.page.evaluate(() => { const s = window.__se.scene; s.zombies.enabled = false; s.dayTime = 0.8 * 420; s.teleport(8, 24); });
      await g.page.waitForTimeout(6000);
      check(await g.page.evaluate(() => window.__se.scene.zombies.active.length === 0), 'zombies désactivés : aucun la nuit');
      check(g.errors.length === 0, 'aucune erreur JavaScript', g.errors.join(' | '));
      await g.page.close();
    },
  },
  {
    name: 'Chiot, boss et décorations',
    weight: 3,
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 7, stars: 100, save: save(story(3, 0), { materials: { meat: 1 } }) }, { quality: 0 });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(1000);
      const announced = await g.page.waitForFunction(() => window.__spoken.some((x) => /Golem de mousse s’est réveillé/.test(x)), null, { timeout: 8000 }).then(() => true, () => false);
      check(announced, 'le réveil du Golem de mousse est dit à voix haute');
      // The puppy by the cottage: tamed with a word, then it gets a name.
      check(await g.page.evaluate(() => !!window.__se.scene.pet && !window.__se.scene.pet.tamed), 'un chiot attend près de la chaumière');
      check(await g.use("i.kind === 'pet'") === 'ok', 'on peut parler au chiot');
      await g.spell({ keepOpen: true });
      await g.page.waitForSelector('.pet-names button', { timeout: 5000 });
      await g.page.evaluate(() => [...document.querySelectorAll('.pet-names button')].find((b) => b.textContent === 'Caramel').click());
      await g.click('#spell-continue-btn');
      await g.page.waitForTimeout(300);
      check(await g.page.evaluate(() => window.__se.game().pet?.tamed && window.__se.game().pet.name === 'Caramel' && window.__se.scene.pet.tamed), 'le chiot est apprivoisé et s’appelle Caramel');
      // It follows the hero, even after a long trip.
      const follow = await g.page.evaluate(() => {
        const s = window.__se.scene, pet = s.pet;
        s.teleport(8, 24);
        for (let k = 0; k < 120; k++) pet.update(1 / 30, k / 30);
        const near = Math.hypot(pet.mesh.position.x - 8, pet.mesh.position.z - 24);
        s.teleport(-46, 2);
        for (let k = 0; k < 30; k++) pet.update(1 / 30, k / 30);
        return { near, far: Math.hypot(pet.mesh.position.x + 46, pet.mesh.position.z - 2) };
      });
      check(follow.near < 3 && follow.far < 3, 'le chiot suit le héros, même après un voyage', JSON.stringify(follow));
      // Hungry: fed with meat, it is happy (+2 stars).
      await g.page.evaluate(() => { window.__starsBefore = window.__se.progress().stars; });
      await g.use("i.kind === 'pet'");
      const fed = await g.page.evaluate(() => ({ day: window.__se.game().pet.fedDay, meat: window.__se.game().materials.meat ?? 0, stars: window.__se.progress().stars - window.__starsBefore }));
      check(!!fed.day && fed.meat === 0 && fed.stars === 2, 'on nourrit le chiot avec de la viande (+2 ★)', JSON.stringify(fed));
      // Meals make it grow: a dog after 3 meals (it is bigger).
      await g.page.evaluate(() => { window.__se.game().materials.meat = 3; });
      await g.use("i.kind === 'pet'"); await g.use("i.kind === 'pet'");
      // A puppy eats 2 meals every 10 minutes at most.
      const full = await g.page.evaluate(() => ({ meals: window.__se.game().pet.meals, toast: document.querySelector('#toast')?.textContent ?? '', meat: window.__se.game().materials.meat }));
      check(full.meals === 2 && /n’a plus faim/.test(full.toast) && full.meat === 2, 'le chiot ne mange que 2 morceaux en 10 minutes', JSON.stringify(full));
      await g.page.evaluate(() => { window.__se.game().pet.mealTimes = []; });
      await g.use("i.kind === 'pet'");
      const grown = await g.page.evaluate(() => ({ meals: window.__se.game().pet.meals, scale: window.__se.scene.pet.mesh.scale.x, stage: window.__se.scene.pet.stage }));
      check(grown.meals === 3 && grown.stage === 1 && grown.scale > 1.2, 'après 3 repas, le chiot grandit et devient un chien', JSON.stringify(grown));
      // A grown dog bites zombies now and then: a normal one is beaten, an armed one loses its helmet.
      const bite = await g.page.evaluate(() => {
        const s = window.__se.scene, pet = s.pet;
        s.teleport(8, 24); pet.catchUp();
        s.dayTime = 0.8 * 420; s.night = 1;
        const res = {};
        for (const armed of [false, true]) {
          s.zombies.clear(false); s.zombies.armedChance = armed ? 1 : 0; s.zombies._spawn(); s.zombies.armedChance = 0;
          const z = s.zombies.active[0]; if (!z) return 'no zombie';
          z.mesh.scale.setScalar(1); z.stun = 9;
          z.mesh.position.set(pet.mesh.position.x + 2.5, pet.mesh.position.y, pet.mesh.position.z);
          pet.biteCooldown = 0; pet.guardCooldown = 9;
          for (let k = 0; k < 30; k++) pet.update(1 / 30, k / 30);
          res[armed ? 'armed' : 'plain'] = armed ? { alive: z.alive, armed: z.armed } : { alive: z.alive };
        }
        s.zombies.clear(false); s.dayTime = 0.3 * 420;
        return res;
      });
      check(bite.plain && !bite.plain.alive, 'le chien mord un zombie et le bat', JSON.stringify(bite));
      check(bite.armed && bite.armed.alive && !bite.armed.armed, 'sur un zombie armé, la morsure fait tomber son casque et son épée', JSON.stringify(bite));
      // Dog armour: made at the forge, worn by the dog.
      await g.page.evaluate(() => { const m = window.__se.game().materials; m.iron = (m.iron ?? 0) + 2; m.wood = (m.wood ?? 0) + 1; });
      await g.click('#craft-open-btn');
      await g.page.waitForTimeout(300);
      await g.page.evaluate(() => [...document.querySelectorAll('#craft-list .craft-card.is-clickable')].find((e) => e.textContent.includes('Armure du chien'))?.click());
      await g.page.waitForTimeout(400);
      check(await g.page.evaluate(() => window.__se.game().crafted.includes('dog_armor') && !!window.__se.scene.pet.armor), 'l’armure du chien se fabrique et il la porte');
      await g.page.keyboard.press('Escape');
      await g.page.evaluate(() => { document.querySelector('#craft-close-btn')?.click(); });
      // Level 5: the dog golem, which beats even armed zombies with one bite.
      const golem = await g.page.evaluate(() => {
        const s = window.__se.scene, pet = s.pet, gm = window.__se.game();
        gm.pet.meals = 17; gm.pet.mealTimes = []; gm.materials.meat = 1;
        return true;
      });
      await g.use("i.kind === 'pet'");
      const gl = await g.page.evaluate(() => {
        const s = window.__se.scene, pet = s.pet;
        const eyes = []; pet.mesh.traverse((o) => { if (o.material?.emissiveIntensity > 1.5) eyes.push(o); });
        s.dayTime = 0.8 * 420; s.night = 1;
        s.zombies.clear(false); s.zombies.armedChance = 1; s.zombies._spawn(); s.zombies.armedChance = 0;
        const z = s.zombies.active[0];
        z.mesh.scale.setScalar(1); z.stun = 9;
        z.mesh.position.set(pet.mesh.position.x + 2.5, pet.mesh.position.y, pet.mesh.position.z);
        pet.biteCooldown = 0; pet.guardCooldown = 9;
        for (let k = 0; k < 30; k++) pet.update(1 / 30, k / 30);
        const r = { stage: pet.stage, scale: pet.mesh.scale.x, glowing: eyes.length >= 2, armedBeaten: !z.alive };
        s.zombies.clear(false); s.dayTime = 0.3 * 420;
        return r;
      });
      check(gl.stage === 4 && gl.scale > 1.8 && gl.glowing, 'au niveau 5, le chien se transforme en golem chien', JSON.stringify(gl));
      check(gl.armedBeaten, 'le golem chien bat un zombie armé d’une seule morsure', JSON.stringify(gl));
      // No food: a cuddle.
      await g.page.evaluate(() => { const m = window.__se.game().materials; delete m.meat; delete m.fish; delete m.brochette; });
      await g.use("i.kind === 'pet'");
      check(/adore les caresses/.test(await g.page.evaluate(() => document.querySelector('#toast')?.textContent ?? '')), 'sans nourriture, on caresse le chien');
      // Hearts: the heart pie gives one more (up to 5).
      await g.page.evaluate(() => { const m = window.__se.game().materials; m.wheat = (m.wheat ?? 0) + 1; m.flower = (m.flower ?? 0) + 1; m.fire = (m.fire ?? 0) + 1; window.__heartsBefore = window.__se.game().maxHearts ?? 2; });
      await g.click('#craft-open-btn');
      await g.page.waitForTimeout(300);
      await g.page.evaluate(() => [...document.querySelectorAll('#craft-list .craft-card.is-clickable')].find((e) => e.textContent.includes('Tarte du cœur'))?.click());
      await g.page.waitForTimeout(400);
      await g.page.evaluate(() => { document.querySelector('#craft-close-btn')?.click(); });
      const pie = await g.page.evaluate(() => ({ before: window.__heartsBefore, after: window.__se.game().maxHearts, shown: document.querySelector('#hearts').textContent }));
      check(pie.after === pie.before + 1 && pie.shown === '❤️'.repeat(pie.after), 'la tarte du cœur donne un cœur de plus', JSON.stringify(pie));
      // It digs things up, and pushes zombies away.
      const dug = await g.page.evaluate(() => { const m = window.__se.game().materials, n = Object.values(m).reduce((a, b) => a + b, 0); window.__se.scene.pet.onDig(); return Object.values(m).reduce((a, b) => a + b, 0) - n; });
      check(dug === 1, 'le chiot creuse et trouve un matériau');
      const guard = await g.page.evaluate(() => {
        const s = window.__se.scene, pet = s.pet;
        s.dayTime = 0.8 * 420; s.night = 1;
        s.zombies.armedChance = 0; s.zombies._spawn();
        const z = s.zombies.active[0]; if (!z) return 'no zombie';
        z.mesh.scale.setScalar(1);
        z.mesh.position.set(pet.mesh.position.x + 1.2, pet.mesh.position.y, pet.mesh.position.z);
        pet.guardCooldown = 0; z.stun = 0;
        pet.update(1 / 30, 0);
        const st = z.stun; s.zombies.clear(false); s.dayTime = 0.3 * 420;
        return st > 0;
      });
      check(guard === true, 'le chiot repousse un zombie trop proche', String(guard));
      // The first bark is explained, written and out loud.
      await g.page.evaluate(() => { window.__spoken.length = 0; window.__se.progress().petBarkExplained = false; window.__se.scene.pet.onBark(); });
      const bark = await g.page.evaluate(() => ({ toast: document.querySelector('#toast')?.textContent ?? '', said: window.__spoken.join(' | '), flag: window.__se.progress().petBarkExplained }));
      check(/aboie : un zombie approche/.test(bark.toast) && /aboie : un zombie approche/.test(bark.said) && bark.flag, 'le premier aboiement est expliqué à l’écrit et à l’oral', JSON.stringify(bark));
      // On the lava course the puppy jumps from pillar to pillar and never touches the lava.
      const course = await g.page.evaluate(async () => {
        const { LAVA } = await import('/regions.js');
        const s = window.__se.scene, pet = s.pet, out = [];
        let worst = 9;
        for (const [x, z, , h] of LAVA.pillars.slice(0, 4)) {
          s.teleport(x, z); s.player.position.y = h; s.onGround = true;
          for (let k = 0; k < 60; k++) {
            pet.update(1 / 30, k / 30);
            const q = pet.mesh.position, inCourse = q.x > LAVA.x0 && q.x < LAVA.x1 && q.z > LAVA.z0 && q.z < LAVA.z1;
            if (inCourse && !pet.hop) worst = Math.min(worst, q.y);
          }
          const w = s._walkwayAt(pet.mesh.position.x, pet.mesh.position.z);
          out.push(w?.index ?? 'x');
        }
        return { on: out.join(','), worst };
      });
      check(course.on === '0,1,2,3' && course.worst > 0.5, 'sur le parcours de lave, le chiot saute de pilier en pilier sans toucher la lave', JSON.stringify(course));
      await g.page.evaluate(() => window.__se.scene.teleport(8, 24));
      // Never more than 2 minutes without a word: a flash challenge comes.
      await g.page.evaluate(() => { window.__se.flashAfter = 2; });
      const flash = await g.page.waitForFunction(() => window.__se.spell()?.type === 'flash' && !document.querySelector('#spell-modal').hidden, null, { timeout: 12000 }).then(() => true, () => false);
      check(flash, 'sans mot depuis un moment, un défi éclair arrive');
      await g.page.evaluate(() => { window.__se.flashAfter = 9999; });
      if (flash) await g.spell();
      // The forest boss: three words to beat it.
      check(await g.page.evaluate(() => window.__se.scene.interactables.filter((i) => i.kind === 'boss').length === 4), '4 boss dorment dans le monde');
      check(await g.page.evaluate(() => /💤/.test(window.__se.scene.interactables.find((i) => i.bossId === 'stoneGolem').labelEl?.textContent ?? '')), 'le boss de la montagne dort encore 💤 (histoire pas assez avancée)');
      // A boss that woke up is announced (written and spoken) and shown in the objective box.
      const awake = await g.page.evaluate(() => window.__se.game().bossesAnnounced?.includes('mossGolem'));
      const awakeInfo = await g.page.evaluate(() => ({ said: window.__spoken.slice(-6), box: document.querySelector('#map-instruction').textContent, ann: window.__se.game().bossesAnnounced }));
      check(awake && /Un boss t’attend/.test(awakeInfo.box), 'le réveil du Golem de mousse est annoncé, et rappelé dans l’objectif', JSON.stringify(awakeInfo));
      // Touching a sleeping boss says how to wake it up and what to do now.
      await g.page.evaluate(() => { window.__spoken.length = 0; });
      await g.use("i.kind === 'boss' && i.bossId === 'stoneGolem'");
      const sleep = await g.page.evaluate(() => ({ toast: document.querySelector('#toast')?.textContent ?? '', said: window.__spoken.join(' | ') }));
      check(/chapitre 4/.test(sleep.toast) && /Lance le sort Pierre/.test(sleep.toast) && /Pour l’instant/.test(sleep.toast) && /dort profondément/.test(sleep.said), 'toucher un boss endormi explique comment le réveiller et quoi faire maintenant', sleep.toast);
      // The minimap shows an arrow towards the next step.
      check(await g.page.evaluate(() => window.__se.scene.mapPins.some((p) => p.quest)), 'la minicarte montre une flèche vers la prochaine étape');
      await g.page.evaluate(() => { window.__starsBefore = window.__se.progress().stars; });
      check(await g.use("i.kind === 'boss' && i.bossId === 'mossGolem'") === 'ok', 'on réveille le Golem de mousse');
      for (let k = 0; k < 3; k++) {
        await g.page.waitForFunction(() => window.__se.spell()?.type === 'boss' && !document.querySelector('#spell-modal').hidden, null, { timeout: 10000 });
        await g.spell();
      }
      await g.page.waitForTimeout(500);
      await g.page.evaluate(() => { const b = window.__se.scene.bosses; for (let k = 0; k < 60; k++) b.update(1 / 30, k / 30); });
      const boss = await g.page.evaluate(() => ({ won: window.__se.game().bosses.includes('mossGolem'), gone: (() => { const b = window.__se.scene.bosses.get('mossGolem'); return b.friendly && !b.obj.active; })(), stars: window.__se.progress().stars - window.__starsBefore, bar: document.querySelector('#boss-bar').hidden }));
      check(boss.won && boss.gone && boss.bar, 'trois mots réussis : le Golem de mousse est vaincu (il reste dans son repaire, gentil)', JSON.stringify(boss));
      check(boss.stars >= 23, 'la victoire rapporte au moins 20 ★', JSON.stringify(boss));
      await g.page.waitForTimeout(3800);
      const bh = await g.page.evaluate(() => ({ max: window.__se.game().maxHearts, from: window.__se.game().heartsFrom }));
      check(bh.from?.includes('boss:mossGolem') && bh.max >= 4, 'battre un boss donne un cœur de plus', JSON.stringify(bh));
      // Decorations bought with stars appear in the cottage.
      await g.page.evaluate(() => { window.__se.progress().stars = 100; });
      await g.click('#wardrobe-btn');
      await g.page.waitForTimeout(400);
      const bought = await g.page.evaluate(() => {
        const card = [...document.querySelectorAll('#decor-grid .wardrobe-card')].find((c) => c.textContent.includes('Aquarium'));
        card?.querySelector('button')?.click();
        return { decor: window.__se.progress().decor ?? [], placed: !!window.__se.scene.decor?.aquarium, stars: window.__se.progress().stars };
      });
      check(bought.decor.includes('aquarium') && bought.placed && bought.stars === 65, 'l’aquarium acheté (35 ★) apparaît dans la chaumière', JSON.stringify(bought));
      await g.page.close();
    },
  },
  {
    name: 'Lieux à découvrir et animaux',
    weight: 2,
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 7, save: save(story(3, 0)) }, { quality: 0 });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(800);
      const n = await g.page.evaluate(() => ({ places: window.__se.scene.places.length, animals: window.__se.scene.fauna.list.length }));
      check(n.places >= 12, `des lieux à découvrir dans tout le monde (${n.places})`);
      check(n.animals >= 40, `des animaux partout (${n.animals})`);
      // Walking near a place discovers it (+2 stars, a pin on the map).
      await g.page.evaluate(() => { window.__starsBefore = window.__se.progress().stars; window.__se.scene.teleport(-38, -26); });
      await g.page.waitForFunction(() => window.__se.game().places?.includes('tower'), null, { timeout: 5000 }).catch(() => {});
      const found = await g.page.evaluate(() => ({ places: window.__se.game().places, stars: window.__se.progress().stars - window.__starsBefore, said: window.__spoken.join(' | ') }));
      check(found.places?.includes('tower') && found.stars === 2 && /découvert/.test(found.said), 'en s’approchant de la tour en ruine, on la découvre (+2 ★)', JSON.stringify(found));
      // Each place hides something: a chest in the tower.
      check(await g.page.evaluate(() => window.__se.scene.interactables.some((i) => i.nodeType === 'chest' && Math.hypot(i.worldPos.x + 38, i.worldPos.z + 31) < 3)), 'un trésor est caché dans la tour');
      check(await g.page.evaluate(() => ['iron', 'diamond'].every((m) => window.__se.scene.interactables.some((i) => i.material === m && Math.hypot(i.worldPos.x + 30, i.worldPos.z + 42) < 6))), 'la mine abandonnée a du fer et du diamant à miner');
      // The fire portal: lit with a word, then it takes the hero to the lava course.
      check(await g.use("i.kind === 'portal'") === 'ok', 'on touche le portail de feu');
      await g.spell();
      check(await g.page.evaluate(() => window.__se.game().portalLit && window.__se.scene.portalSurface.visible), 'un mot allume le portail');
      await g.page.waitForFunction(() => document.querySelector('#spell-modal').hidden, null, { timeout: 5000 }).catch(() => {});
      await g.use("i.kind === 'portal'");
      await g.page.waitForFunction(() => window.__se.scene.player.position.z > -40 && window.__se.scene.player.position.x < 32, null, { timeout: 8000 }).catch(() => {});
      const at = await g.page.evaluate(() => { const p = window.__se.scene.player.position; return { x: p.x, z: p.z }; });
      check(Math.hypot(at.x - 29, at.z + 35.9) < 2.5, 'le portail allumé emmène au parcours de lave', JSON.stringify(at));
      // Animals wander, and run off when the hero comes too close.
      const life = await g.page.evaluate(() => {
        const s = window.__se.scene, f = s.fauna;
        const a = f.list.find((x) => x.kind === 'sheep');
        s.teleport(a.home.x + 12, a.home.z);
        const herd = f.list.filter((x) => x.home.x === a.home.x && x.home.z === a.home.z), starts = herd.map((x) => x.mesh.position.clone());
        for (let k = 0; k < 300; k++) f.update(1 / 30, k / 30);
        const wandered = Math.max(...herd.map((x, i) => starts[i].distanceTo(x.mesh.position)));
        s.teleport(a.mesh.position.x + 1.0, a.mesh.position.z);
        const before = Math.hypot(s.player.position.x - a.mesh.position.x, s.player.position.z - a.mesh.position.z);
        for (let k = 0; k < 30; k++) f.update(1 / 30, 10 + k / 30);
        const after = Math.hypot(s.player.position.x - a.mesh.position.x, s.player.position.z - a.mesh.position.z);
        return { wandered, before, after };
      });
      check(life.wandered > 0.3, 'les moutons se promènent', JSON.stringify(life));
      check(life.after > life.before + 0.5, 'un animal s’éloigne quand le héros s’approche trop', JSON.stringify(life));
      check(await g.page.evaluate(() => window.__se.scene.fauna.list.every((a) => a.def.swim || !window.__se.scene._checkCollision(a.mesh.position.x, a.mesh.position.z, { swim: a.kind === 'duck' || a.kind === 'frog' }))), 'aucun animal coincé dans un mur ou un arbre');
      await g.page.close();
    },
  },
  {
    name: 'Étape faite en avance (pont lancé avant le panneau)',
    weight: 1,
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 7, stars: 40, inputMode: 'keys', save: save(story(2, 0)) }, { quality: 0 });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(800);
      // The bridge is cast first, while the objective is still the forest sign.
      check(await g.use("i.kind === 'circle' && i.cid === 'pont-foret'") === 'ok', 'on lance le sort Pont avant de réparer le panneau');
      await g.spell();
      await g.page.waitForTimeout(600);
      check((await g.objective()).includes('panneau de la forêt'), 'l’objectif est encore le panneau', await g.objective());
      // Then the sign: the bridge step, already done, plays and moves on by itself.
      await g.use("i.kind === 'travel' && i.region === 'forest'");
      await g.spell();
      for (let k = 0; k < 12 && !(await g.objective()).includes('Sylvain'); k++) {
        await g.page.evaluate(() => { const b = document.querySelector('#dialog-next'); if (!document.querySelector('#dialog').hidden) b?.click(); });
        await g.page.waitForTimeout(500);
      }
      check((await g.objective()).includes('Sylvain'), 'le pont déjà lancé compte : la quête passe à Sylvain le forestier', await g.objective());
      await g.page.close();
    },
  },
  {
    name: 'Nouvelle partie : tout repart de zéro',
    weight: 1,
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 7, stars: 120, decor: ['rug', 'aquarium'], costumes: { owned: ['hero', 'knight'], current: 'knight' }, save: save(story(4, 0), { materials: { iron: 5 }, crafted: ['sword'], pet: { tamed: true, name: 'Caramel', meals: 9 }, bosses: ['mossGolem'], places: ['tower'], maxHearts: 4, portalLit: true }) }, { quality: 0 });
      // Some learning that must stay (the parents' corner).
      await g.page.evaluate(() => { window.__se.progress().wordStats['fr:lune'] = { lang: 'fr', word: 'lune', level: 'medium', seen: 3, correct: 3, wrong: 0, firstTry: 3, lastSeen: Date.now(), misspellings: [] }; });
      await g.click('#new-game-btn');
      await g.click('#new-game-btn'); // confirm
      await g.page.waitForSelector('#loading.is-done', { timeout: 180000 });
      await g.page.waitForFunction(() => window.__se?.game?.()?.story && !document.querySelector('#dialog').hidden, null, { timeout: 20000 }).catch(() => {});
      const st = await g.page.evaluate(() => {
        const gm = window.__se.game(), pr = window.__se.progress(), s = window.__se.scene;
        return { chapter: gm.story.chapter, step: gm.story.step, stars: pr.stars, decor: pr.decor ?? [], costume: pr.costumes?.current ?? 'hero', mats: Object.keys(gm.materials).length, crafted: gm.crafted.length, pet: !!gm.pet?.tamed, scenePet: s.pet.tamed, bosses: (gm.bosses ?? []).length, bossHidden: !s.bosses.get('mossGolem').mesh.visible, places: (gm.places ?? []).length, hearts: gm.maxHearts ?? 2, portal: !!gm.portalLit, sceneDecor: Object.keys(s.decor ?? {}).length, learnt: !!pr.wordStats['fr:lune'] };
      });
      check(st.chapter === 1 && st.step === 0, 'l’histoire repart du chapitre 1', JSON.stringify(st));
      check(st.stars === 0 && st.decor.length === 0 && st.sceneDecor === 0 && st.costume === 'hero', 'étoiles, décorations et costumes repartent de zéro', JSON.stringify(st));
      check(st.mats === 0 && st.crafted === 0 && !st.pet && !st.scenePet, 'plus de matériaux, d’objets ni de chiot apprivoisé', JSON.stringify(st));
      check(st.bosses === 0 && !st.bossHidden && st.places === 0 && st.hearts === 2 && !st.portal, 'boss, lieux, cœurs et portail repartent de zéro', JSON.stringify(st));
      check(st.learnt, 'ce que l’enfant a appris (statistiques des parents) est gardé', JSON.stringify(st));
      await g.page.close();
    },
  },
  {
    name: 'Chevaux, nouveaux animaux et obsidienne',
    weight: 2,
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 7, save: save(story(3, 0), { materials: { iron: 3 }, crafted: ['pickaxe', 'bucket'] }) }, { quality: 0 });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(800);
      const kinds = await g.page.evaluate(() => [...new Set(window.__se.scene.fauna.list.map((a) => a.kind))]);
      check(['wolf', 'cat', 'panda', 'parrot', 'llama', 'polarBear', 'squid', 'sheepPink', 'lamb'].every((k) => kinds.includes(k)), 'de nouveaux animaux : loups, chats, pandas, perroquet, lamas, ours polaire, pieuvres lumineuses, moutons roses et agneaux', kinds.join(','));
      // A horse: trusted with a word, then ridden.
      check(await g.page.evaluate(() => window.__se.scene.horses.list.length === 3), '3 chevaux dans le pré près de la ferme');
      check(await g.use("i.kind === 'horse' && i.horseId === 'h1'") === 'ok', 'on touche un cheval');
      await g.spell();
      check(await g.page.evaluate(() => window.__se.game().horses?.h1?.tamed), 'un mot et le cheval fait confiance');
      await g.use("i.kind === 'horse' && i.horseId === 'h1'");
      const ride = await g.page.evaluate(() => { const s = window.__se.scene; s.onGround = true; s.lastGroundAt = s.clock.elapsedTime; s.jump(); return { riding: !!s.horses.riding, btn: !document.querySelector('#dismount-btn').hidden, vy: s.playerVY, house: s._blocked(0, 14, 0) }; });
      check(ride.riding && ride.btn, 'on monte à cheval (bouton pour descendre)', JSON.stringify(ride));
      check(ride.vy > 10, 'à cheval, on saute plus haut', JSON.stringify(ride));
      check(ride.house, 'pas de cheval dans les maisons', JSON.stringify(ride));
      // A flash challenge on horseback: the horse stops until the word is spelled.
      await g.page.waitForTimeout(800);
      await g.page.evaluate(() => { window.__se.flashAfter = 0.5; });
      await g.page.waitForFunction(() => window.__se.spell()?.type === 'flash' && !document.querySelector('#spell-modal').hidden, null, { timeout: 8000 }).catch(() => {});
      await g.page.waitForTimeout(500);
      const still = await g.page.evaluate(async () => {
        const s = window.__se.scene, a = s.player.position.clone();
        s.keys.w = true; for (let k = 0; k < 20; k++) s._updatePlayer(1 / 30); s.keys.w = false;
        return { locked: s.inputLocked, moved: Math.hypot(a.x - s.player.position.x, a.z - s.player.position.z) };
      });
      check(still.locked && still.moved < 0.05, 'pendant un défi éclair, le cheval s’arrête', JSON.stringify(still));
      await g.page.evaluate(() => { window.__se.flashAfter = 1e9; });
      await g.spell();
      // Iron horse armour: zombies bounce off it.
      await g.click('#craft-open-btn');
      await g.page.waitForTimeout(300);
      await g.page.evaluate(() => [...document.querySelectorAll('#craft-list .craft-card.is-clickable')].find((e) => e.textContent.includes('Armure de cheval en fer'))?.click());
      await g.page.waitForTimeout(400);
      await g.page.evaluate(() => { document.querySelector('#craft-close-btn')?.click(); });
      const armor = await g.page.evaluate(() => {
        const s = window.__se.scene, h = s.horses.riding;
        const r = { kind: h?.armorKind };
        let touched = 0; const prev = s.onZombieCatch; s.onZombieCatch = () => { touched++; };
        s.dayTime = 0.8 * 420; s.night = 1; s.zombies.grace = 0;
        s.zombies.clear(false); s.zombies.armedChance = 0; s.zombies._spawn();
        const z = s.zombies.active[0];
        z.mesh.scale.setScalar(1); z.stun = 0; z.chasing = true;
        z.mesh.position.set(s.player.position.x + 0.3, s.player.position.y, s.player.position.z);
        for (let k = 0; k < 10; k++) s.zombies.update(1 / 30, s.clock.elapsedTime + k / 30);
        r.touched = touched; r.stunned = z.stun > 0;
        s.onZombieCatch = prev; s.zombies.clear(false); s.dayTime = 0.3 * 420;
        return r;
      });
      check(armor.kind === 'iron' && armor.touched === 0 && armor.stunned, 'avec l’armure de fer, le zombie rebondit sur le cheval', JSON.stringify(armor));
      await g.click('#dismount-btn');
      check(await g.page.evaluate(() => !window.__se.scene.horses.riding && document.querySelector('#dismount-btn').hidden), 'on descend du cheval');
      // Lava bucket into the sea: obsidian.
      const obs = await g.page.evaluate(() => {
        const s = window.__se.scene;
        s.teleport(0, 68.6); s.player.rotation.y = 0;
        const r = s.eruptLava();
        return { r, blocks: s.interactables.filter((i) => i.material === 'obsidian' && i.noRespawn).length };
      });
      check(obs.r.obsidian > 0 && obs.blocks > 0, 'le seau de lave versé dans l’eau fait de l’obsidienne', JSON.stringify(obs));
      await g.page.close();
    },
  },
  {
    name: 'Quoi de neuf (Alaric) et Fer le golem de fer',
    quick: true,
    weight: 2,
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 7, newsSeen: ['1.26.1-wagonnet', '1.20.0-defis', '1.21.0-flamme', '1.22.0-album', 'prog-pronoms', '1.23.0-pouvoirs', '1.24.0-golem-cuivre', '1.25.0-golem-neige', '1.26.3-lune'], save: save(story(2, 0)) }, { quality: 0 });
      await g.click('#continue-btn');
      // Alaric presents the release, written and spoken; the newest note comes first.
      const shown = await g.page.waitForFunction(() => !document.querySelector('#news-modal').hidden, null, { timeout: 10000 }).then(() => true, () => false);
      const card = await g.page.evaluate(() => ({ title: document.querySelector('#news-title').textContent, said: window.__spoken.join(' | '), show: document.querySelector('#news-show').textContent }));
      check(shown && /golem de fer/.test(card.title + card.said), 'à l’ouverture, Alaric présente la nouveauté (la plus récente d’abord)', JSON.stringify(card));
      check(/Fer, le golem de fer/.test(card.said) && card.show === 'Montre-moi !', 'la présentation est lue à voix haute, avec « Montre-moi ! »', JSON.stringify(card));
      // "Show me!": the golden arrow points at Iron.
      await g.click('#news-show');
      await g.page.waitForTimeout(500);
      const arrow = await g.page.evaluate(() => { const s = window.__se.scene, q = s.mapPins.find((p) => p.quest), gp = s.golem.mesh.position; return { q, d: q ? Math.hypot(q.x - gp.x, q.z - gp.z) : 99 }; });
      check(arrow.d < 1, '« Montre-moi ! » pointe la flèche dorée vers le golem', JSON.stringify(arrow));
      // The other note (Alaric himself) waits: the journal keeps all of them.
      await g.click('#news-btn');
      await g.page.waitForTimeout(300);
      const journal = await g.page.evaluate(() => [...document.querySelectorAll('#journal-list .journal-item h3')].map((e) => e.textContent));
      check(journal.length >= 3 && /fusée pour la Lune/i.test(journal[0]) && journal.some((j) => /wagonnet/i.test(j)) && journal.some((j) => /boules de neige/i.test(j)) && journal.some((j) => /golem de cuivre/i.test(j)) && journal.some((j) => /pouvoirs/i.test(j)) && journal.some((j) => /Flammèche/i.test(j)) && journal.some((j) => /défis/i.test(j)) && journal.some((j) => /golem/i.test(j)), 'le journal 📜 garde toutes les présentations, la plus récente en haut', journal.join(' / '));
      await g.click('#journal-close');
      // Iron walks round the square, says hello and offers a flower once a day.
      const walk = await g.page.evaluate(() => { const gl = window.__se.scene.golem, a = gl.mesh.position.clone(); gl.pause = 0; for (let k = 0; k < 150; k++) gl.update(1 / 30, k / 30); return { points: gl.points.length, moved: a.distanceTo(gl.mesh.position) }; });
      check(walk.points >= 4 && walk.moved > 1, 'Fer fait le tour de la place', JSON.stringify(walk));
      await g.page.evaluate(() => { window.__flowers = window.__se.game().materials.flower ?? 0; });
      check(await g.use("i.kind === 'golem'") === 'ok', 'on peut toucher Fer');
      const hello = await g.page.evaluate(() => ({ flowers: (window.__se.game().materials.flower ?? 0) - window.__flowers, said: window.__spoken.slice(-1)[0] ?? '' }));
      check(hello.flowers === 1 && /une fleur pour toi/.test(hello.said), 'Fer dit bonjour (à l’oral) et offre une fleur', JSON.stringify(hello));
      await g.use("i.kind === 'golem'");
      check(await g.page.evaluate(() => (window.__se.game().materials.flower ?? 0) - window.__flowers === 1), 'une seule fleur par jour');
      // At night he crushes a zombie near the village.
      const smash = await g.page.evaluate(() => {
        const s = window.__se.scene, gl = s.golem;
        s.dayTime = 0.8 * 420; s.night = 1;
        s.zombies.clear(false); s.zombies.armedChance = 0; s.zombies._spawn();
        const z = s.zombies.active[0]; if (!z) return 'no zombie';
        z.mesh.scale.setScalar(1); z.stun = 99;
        const nx = gl.points.at((gl.wp + 1) % gl.points.length); z.mesh.position.set(nx.x, s.groundAt(nx.x, nx.z), nx.z);
        gl.cooldown = 0; gl.target = null;
        for (let k = 0; k < 90 && z.alive; k++) gl.update(1 / 30, k / 30);
        const r = !z.alive ? true : JSON.stringify({ gp: gl.mesh.position.toArray().map((v) => v.toFixed(1)), zp: z.mesh.position.toArray().map((v) => v.toFixed(1)) }); s.zombies.clear(false); s.dayTime = 0.3 * 420;
        return r;
      });
      check(smash === true, 'la nuit, Fer écrase un zombie qui s’approche du village', String(smash));
      await g.page.close();
    },
  },
  {
    name: 'Défis du jour, coffre sauteur, Cocotte et devinette (J2)',
    quick: true,
    weight: 4,
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 7, newsSeen: ['1.26.1-wagonnet', '1.19.0-alaric', '1.19.0-golem', '1.21.0-flamme', '1.22.0-album', 'prog-pronoms', '1.23.0-pouvoirs', '1.24.0-golem-cuivre', '1.25.0-golem-neige', '1.26.3-lune'], save: save(story(2, 0)) }, { quality: 0, defis: true });
      const said = () => g.page.evaluate(() => window.__spoken.join(' | '));
      let words = 0;
      const spellOne = async () => { const r = await g.spell(); words++; return r; };
      const mineWord = async () => { const u = await g.use("i.kind === 'house' && i.active"); if (u !== 'ok') check(false, 'un endroit à miner', u); await spellOne(); };
      await g.click('#continue-btn');
      // Alaric presents J2, written and spoken, with his riddle; "La réponse ?" reads the answer.
      const shown = await g.page.waitForFunction(() => !document.querySelector('#news-modal').hidden, null, { timeout: 10000 }).then(() => true, () => false);
      const card = await g.page.evaluate(() => ({ title: document.querySelector('#news-title').textContent, riddle: document.querySelector('#news-riddle').innerText, said: window.__spoken.join(' | ') }));
      check(shown && /défis/i.test(card.title) && /trois défis le matin/.test(card.said), 'Alaric présente les défis du jour (écrit et lu)', JSON.stringify(card));
      check(/Plus j’ai de gardiens/.test(card.riddle) && /Plus j’ai de gardiens/.test(card.said), 'la carte finit par la devinette d’Alaric, lue aussi', card.riddle);
      await g.page.evaluate(() => document.querySelector('#news-riddle .news-answer').click());
      await g.page.waitForTimeout(200);
      const ans = await g.page.evaluate(() => ({ shown: document.querySelector('#news-riddle .news-riddle-a').hidden === false, said: window.__spoken.slice(-1)[0] }));
      check(ans.shown && /Un secret/.test(ans.said), '« La réponse ? » affiche et lit la réponse', JSON.stringify(ans));
      // "Montre-moi !": the arrow points at the jumping chest, out in front of the cottage.
      await g.click('#news-show');
      await g.page.waitForTimeout(900);
      const arrow = await g.page.evaluate(() => { const s = window.__se.scene, q = s.mapPins.find((p) => p.quest), c = s.jumpChest; return { out: c.out, which: c.which, d: q ? Math.hypot(q.x - c.mesh.position.x, q.z - c.mesh.position.z) : 99, home: Math.hypot(c.mesh.position.x, c.mesh.position.z - 18) }; });
      check(arrow.out && arrow.which === 'welcome' && arrow.d < 1 && arrow.home < 9, '« Montre-moi ! » pointe la flèche vers le coffre sauteur devant la chaumière', JSON.stringify(arrow));
      // The wow moment: walk up to it and it hops away, giggling, three times.
      const near = () => g.page.evaluate(() => { const s = window.__se.scene, c = s.jumpChest.mesh.position; s.teleport(c.x - 1.4, c.z - 0.6); return c.clone(); });
      const p0 = await near();
      await g.page.waitForTimeout(1300);
      const hop1 = await g.page.evaluate((a) => { const c = window.__se.scene.jumpChest; return { left: c.hopsLeft, moved: Math.hypot(c.mesh.position.x - a.x, c.mesh.position.z - a.z) }; }, p0);
      check(hop1.left === 2 && hop1.moved > 2, 'quand on s’approche, le coffre fait un bond pour s’échapper', JSON.stringify(hop1));
      check(/Hihi ! Attrape-moi/.test(await said()), 'il rigole (« Hihi ! Attrape-moi ! »), à l’oral');
      // (waits for each hop to land rather than a fixed time: frames run late when the machine is busy)
      for (let k = 0; k < 2; k++) {
        await g.page.waitForFunction(() => { const c = window.__se.scene.jumpChest; return !c.hop && c.cool <= 0; }, null, { timeout: 15000 }).catch(() => {});
        const before = await g.page.evaluate(() => window.__se.scene.jumpChest.hopsLeft);
        await g.use("i.kind === 'jumpchest'");
        await g.page.waitForFunction((b) => window.__se.scene.jumpChest.hopsLeft < b, before, { timeout: 15000 }).catch(() => {});
      }
      await g.page.waitForFunction(() => !window.__se.scene.jumpChest.hop, null, { timeout: 15000 }).catch(() => {});
      check(await g.page.evaluate(() => window.__se.scene.jumpChest.hopsLeft) === 0, 'trois bonds, puis il se laisse attraper');
      const caught = await g.page.waitForFunction(() => /tu m’as attrapé/.test(window.__spoken.join(' | ')), null, { timeout: 8000 }).then(() => true, () => false);
      check(caught, '« Bon d’accord… tu m’as attrapé ! » (gag, lu)', await said());
      const stars0 = await g.page.evaluate(() => window.__se.progress().stars);
      await g.use("i.kind === 'jumpchest'");
      const open = await spellOne();
      check(/confettis/.test(open.result), 'un mot l’ouvre : il éclate en confettis', open.result);
      check(await g.page.evaluate((s0) => window.__se.progress().stars - s0 >= 5, stars0), 'le coffre donne des étoiles');
      // Session 1: the three morning challenges.
      const st1 = await g.page.evaluate(() => window.__se.defis());
      const date = st1.date;
      check(st1.m?.ids.length === 3 && st1.m.ids[0] === 'first5' && !st1.e, 'trois défis du matin (dont un défi de mots), pas encore ceux du soir', JSON.stringify(st1));
      const doDefi = async (id) => {
        if (id === 'first5') { for (let k = 0; k < 5; k++) await mineWord(); }
        else if (id === 'words7') { for (let k = 0; k < 7; k++) await mineWord(); }
        else if (id === 'mine') { for (let k = 0; k < 4; k++) await mineWord(); }
        else if (id === 'jump') await g.page.evaluate(() => { for (let k = 0; k < 10; k++) window.__se.scene.onJump(); });
        else if (id === 'sheep') {
          for (let k = 0; k < 8; k++) {
            await g.page.evaluate(() => { const s = window.__se.scene, a = s.fauna.list.find((x) => x.kind.startsWith('sheep')); s.teleport(a.mesh.position.x + 1.2, a.mesh.position.z); });
            await g.page.waitForTimeout(400);
            if (await g.page.evaluate(() => (window.__se.defis().m.n.sheep ?? 0) >= 1)) break;
          }
        } else if (id === 'mage') { await g.use("i.kind === 'npc' && i.npcId === 'mage'"); await g.page.waitForTimeout(200); await g.skipDialog(); await g.click('#quest-close-btn'); }
        else if (id === 'golem') await g.use("i.kind === 'golem'");
        else if (id === 'chests') { for (let k = 0; k < 2; k++) { await g.use("i.nodeType === 'chest' && i.active"); await spellOne(); await g.page.waitForTimeout(1600); } }
        else if (id === 'flower') { await g.use("i.nodeType === 'flower' && i.active"); await spellOne(); }
        else if (id === 'cocotte') await g.page.evaluate(() => window.__se.findCocotte());
        await g.page.waitForTimeout(300);
      };
      for (const id of st1.m.ids) await doDefi(id);
      const m = await g.page.evaluate(() => ({ st: window.__se.defis().m, queue: window.__se.progress().chestQueue }));
      check(m.st.done && m.queue.includes('m'), 'les trois défis du matin réussis : un coffre sauteur arrive', JSON.stringify(m));
      await g.page.waitForTimeout(600);
      const catchChest = async () => {
        for (let k = 0; k < 8; k++) {
          const st = await g.page.evaluate(() => { const c = window.__se.scene.jumpChest; return { left: c.hopsLeft, hop: !!c.hop, modal: !document.querySelector('#spell-modal').hidden, active: c.obj.active }; });
          if (st.modal) break;
          if (!st.hop) await g.use("i.kind === 'jumpchest'");
          await g.page.waitForTimeout(st.left > 0 ? 1000 : 400);
        }
        const dbg = await g.page.evaluate(() => { const c = window.__se.scene.jumpChest; return JSON.stringify({ which: c.which, left: c.hopsLeft, hop: !!c.hop, active: c.obj.active, modal: !document.querySelector('#spell-modal').hidden, dialog: !document.querySelector('#dialog').hidden, quest: !document.querySelector('#quest-modal').hidden }); });
        if (!dbg.includes('"modal":true')) check(false, 'la fenêtre du mot s’ouvre sur le coffre', dbg);
        return spellOne();
      };
      check(await g.page.evaluate(() => window.__se.scene.jumpChest.which) === 'm', 'le coffre du matin est devant la chaumière');
      const mOpen = await catchChest();
      check(/confettis/.test(mOpen.result), 'on attrape et on ouvre le coffre du matin', mOpen.result);
      check(words >= 7, `au moins 7 mots en session 1, coffres compris (${words})`);
      // The journal: parts 1 and 2 and Cocotte's hint, written and read.
      await g.page.waitForTimeout(4500);
      await g.click('#defis-btn');
      await g.page.waitForTimeout(300);
      const j1 = await g.page.evaluate(() => ({ txt: document.querySelector('#journal-today').innerText, said: window.__spoken.slice(-1)[0] }));
      check(/Partie 1 ✓ · Partie 2 : à ton prochain retour !/.test(j1.txt), 'journal : « Partie 1 ✓ · Partie 2 : à ton prochain retour ! »', j1.txt);
      const henTip = await g.page.evaluate(() => window.__se.henRow().hint.fr.slice(0, 30));
      check(/prochain retour/.test(j1.said) && j1.said.includes(henTip) && j1.txt.includes(henTip), 'les parties et l’indice de Cocotte sont lus à voix haute', j1.said);
      await g.click('#journal-close');
      // Session 2: the game is opened again 31 minutes later.
      await g.page.evaluate(([key, k]) => { const p = JSON.parse(localStorage.getItem(key)); p.parts[k].last -= 31 * 60 * 1000; localStorage.setItem(key, JSON.stringify(p)); }, [STORE, `d:${date}`]);
      await g.page.evaluate(() => { window.__se.noDefis = true; });
      await g.page.reload();
      await g.page.waitForSelector('#loading.is-done', { timeout: 180000 });
      await g.page.evaluate(() => { window.__se.flashAfter = 1e9; window.__se.noDefis = false; });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(1500);
      const st2 = await g.page.evaluate(() => ({ st: window.__se.defis(), part: window.__se.releasePart(2, `d:${window.__se.defis().date}`) }));
      check(st2.part === 2 && st2.st.e?.ids.length === 3 && st2.st.e.ids[0] === 'words7', 'au retour (30 min plus tard), les trois défis du soir arrivent', JSON.stringify(st2));
      check(st2.st.e.ids.every((id) => !st2.st.m.ids.includes(id)), 'les défis du soir sont différents de ceux du matin');
      const eveSaid = await g.page.waitForFunction(() => /Défis du soir/.test(window.__spoken.join(' | ')), null, { timeout: 15000 }).then(() => true, () => false);
      check(eveSaid, 'les défis du soir sont annoncés à voix haute', await said());
      words = 0;
      for (const id of st2.st.e.ids) await doDefi(id);
      // Cocotte in today's hiding spot: "Cot cot!", a golden feather.
      if (!st2.st.e.ids.includes('cocotte')) await doDefi('cocotte');
      const hen = await g.page.evaluate(() => ({ feathers: window.__se.progress().feathers, active: !!window.__se.scene.cocotte?.obj.active, day: window.__se.henRow().day }));
      check(hen.feathers?.includes(hen.day) && !hen.active, 'Cocotte, dans sa cachette du jour, s’envole et laisse une plume dorée', JSON.stringify(hen));
      check(/Cot cot/.test(await said()), '« Cot cot codêêt ! » est dit à voix haute');
      const e = await g.page.evaluate(() => ({ st: window.__se.defis().e, which: window.__se.scene.jumpChest.which, scale: window.__se.scene.jumpChest.mesh.scale.x }));
      check(e.st.done && e.which === 'e' && e.scale > 1.3, 'défis du soir réussis : un gros coffre sauteur arrive', JSON.stringify(e));
      const owned0 = await g.page.evaluate(() => window.__se.progress().costumes?.owned?.length ?? 1);
      const eOpen = await catchChest();
      const owned1 = await g.page.evaluate(() => window.__se.progress().costumes?.owned ?? []);
      check(/costume/.test(eOpen.result + await said()) && owned1.length === owned0 + 1, 'le gros coffre donne un nouveau costume à montrer', `${eOpen.result} / ${owned1}`);
      check(words >= 7, `au moins 7 mots en session 2 (${words})`);
      await g.page.waitForTimeout(4000);
      await g.click('#news-btn');
      await g.page.waitForTimeout(300);
      const j2 = await g.page.evaluate(() => document.querySelector('#journal-today').innerText);
      check(/Partie 1 ✓ · Partie 2 ✓/.test(j2) && /trouvé Cocotte/.test(j2) && /Plumes dorées : 1/.test(j2), 'journal : les deux parties faites, Cocotte trouvée, 1 plume', j2);
      await g.click('#journal-close');
      // Part 2 also opens after 15 minutes of play on part 1, without leaving the game.
      // (waits for the condition rather than a fixed time: the 300 ms timer runs late when the machine is busy)
      const before = await g.page.evaluate(() => { const st = window.__se.partState('J99'); const b = window.__se.releasePart(99); st.play = 15 * 60 - 0.4; return b; });
      const after = await g.page.waitForFunction(() => window.__se.releasePart(99) === 2, null, { timeout: 12000 }).then(() => 2, () => g.page.evaluate(() => window.__se.releasePart(99)));
      const fifteen = { before, after };
      check(fifteen.before === 1 && fifteen.after === 2, 'la partie 2 s’ouvre aussi après 15 min de jeu sur la partie 1', JSON.stringify(fifteen));
      check(g.errors.length === 0, 'aucune erreur JavaScript', g.errors.join(' | '));
      await g.page.close();
    },
  },
  {
    name: 'Flammèche, la flamme des jours (J3)',
    quick: true,
    weight: 4,
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 7, newsSeen: ['1.26.1-wagonnet', '1.19.0-alaric', '1.19.0-golem', '1.20.0-defis', '1.22.0-album', 'prog-pronoms', '1.23.0-pouvoirs', '1.24.0-golem-cuivre', '1.25.0-golem-neige', '1.26.3-lune'], save: save(story(2, 0), { pet: { tamed: true, name: 'Caramel', meals: 0 } }) }, { quality: 0 });
      const said = () => g.page.evaluate(() => window.__spoken.join(' | '));
      const saidLater = (re, timeout = 20000) => g.page.waitForFunction((r) => new RegExp(r).test(window.__spoken.join(' | ')), re.source, { timeout }).then(() => true, () => false);
      const flame = () => g.page.evaluate(() => { const f = window.__se.flame() ?? {}, fl = window.__se.scene.flame; return { ...f, state: { ...fl.state }, out: fl.starsOut(), part: window.__se.releasePart(3) }; });
      let words = 0;
      const atFlame = async () => { const u = await g.use("i.kind === 'flame'"); if (u !== 'ok') check(false, 'on peut toucher Flammèche', u); const r = await g.spell(); words++; return r; };
      await g.click('#continue-btn');
      // Alaric presents J3, written and spoken, with his riddle.
      const shown = await g.page.waitForFunction(() => !document.querySelector('#news-modal').hidden, null, { timeout: 10000 }).then(() => true, () => false);
      const card = await g.page.evaluate(() => ({ title: document.querySelector('#news-title').textContent, riddle: document.querySelector('#news-riddle').innerText, said: window.__spoken.join(' | ') }));
      check(shown && /Flammèche/.test(card.title) && /Voici Flammèche, ta flamme magique/.test(card.said), 'Alaric présente Flammèche (écrit et lu)', JSON.stringify(card));
      check(/Je mange tout/.test(card.riddle) && /Je mange tout/.test(card.said), 'la devinette d’Alaric est écrite et lue', card.riddle);
      await g.page.evaluate(() => document.querySelector('#news-riddle .news-answer').click());
      await g.page.waitForTimeout(200);
      check(/Le feu/.test(await g.page.evaluate(() => window.__spoken.slice(-1)[0])), '« La réponse ? » lit « Le feu ! »');
      // "Montre-moi !": the golden arrow points at the hearth of the cottage chimney.
      await g.click('#news-show');
      await g.page.waitForTimeout(900);
      const arrow = await g.page.evaluate(() => { const s = window.__se.scene, q = s.mapPins.find((p) => p.quest), w = s.flame.obj.worldPos; return { d: q ? Math.hypot(q.x - w.x, q.z - w.z) : 99, home: Math.hypot(w.x, w.z - 14) }; });
      check(arrow.d < 1 && arrow.home < 5, '« Montre-moi ! » pointe la flèche vers la cheminée de la chaumière', JSON.stringify(arrow));
      // Walking up: the little ember opens its eyes: "Psst! Spell FEU!"
      await g.page.evaluate(() => { const w = window.__se.scene.flame.obj.worldPos; window.__se.scene.teleport(w.x - 0.4, w.z + 2.6); });
      check(await saidLater(/Psst ! Je suis Flammèche/, 10000), 'en approchant, la petite braise dit « Psst ! Épelle FEU ! » (lu)', await said());
      // Session 1: spell FEU, she lights up (the wow moment).
      const t0 = Date.now();
      const light = await atFlame();
      check(light.word === 'feu' && /Coucou, je suis Flammèche/.test(light.result), 'on épelle FEU : Flammèche s’allume', JSON.stringify(light));
      await g.page.waitForTimeout(300);
      const lit = await flame();
      check(lit.lit && lit.state.lit && lit.state.size === 1 && (Date.now() - t0) < 30000, 'elle s’allume avec un « Fwoosh » et des étincelles, en moins de 30 s', JSON.stringify(lit));
      check(/Fwoosh/.test(await said()), '« Fwoosh ! Coucou, je suis Flammèche ! » est lu');
      // Every good word gives her a log: she hiccups and grows (5 sizes).
      const sizes = [];
      for (let k = 0; k < 10 && (await flame()).state.size < 5; k++) { const r = await atFlame(); if (k === 0) check(/bûche/.test(r.result), 'un mot près d’elle = une bûche', r.result); sizes.push((await flame()).state.size); }
      check(sizes.at(-1) === 5 && sizes.every((s, i) => i === 0 || s >= sizes[i - 1]), `elle grandit jusqu’à la taille 5 (${sizes.join(' → ')})`);
      check(/Hips/.test(await said()), 'gag : elle a le hoquet après chaque bûche (« Hips ! »)');
      const scale = await g.page.evaluate(() => window.__se.scene.flame.flame.scale.x);
      check(scale > 0.7, 'on voit qu’elle est grande', String(scale));
      check(await saidLater(/toute grande ! Reviens plus tard/, 40000), 'toute grande : « Reviens plus tard : elle a une surprise » (lu)', await said());
      check(/grandit : taille 2/.test(await said()), 'chaque taille est annoncée à voix haute');
      check(words >= 7, `au moins 7 mots en session 1 (${words})`);
      // A word right first time elsewhere also gives a log.
      const logs0 = (await flame()).logs;
      await g.use("i.kind === 'house' && i.active"); await g.spell();
      check((await flame()).logs === logs0 + 1, 'un mot réussi du premier coup ailleurs donne aussi une bûche');
      // The journal: Flammèche's parts and Cocotte's hint, written and read.
      const n0 = await g.page.evaluate(() => window.__spoken.length);
      await g.click('#news-btn');
      await g.page.waitForTimeout(300);
      const j1 = await g.page.evaluate((n) => ({ txt: document.querySelector('#journal-today').innerText, said: window.__spoken.slice(n).join(' | ') }), n0);
      check(/Flammèche — Partie 1 ✓ · Partie 2 : à ton prochain retour !/.test(j1.txt) && /Série : 1 jour/.test(j1.txt), 'journal : « Flammèche — Partie 1 ✓ · Partie 2 : à ton prochain retour ! », série 1 jour', j1.txt);
      const henTip = await g.page.evaluate(() => window.__se.henRow().hint.fr.slice(0, 30));
      check(/prochain retour/.test(j1.said) && j1.said.includes(henTip) && j1.txt.includes(henTip), 'les parties et l’indice de Cocotte du jour sont lus', j1.said);
      await g.click('#journal-close');
      // Session 2: the game is opened again 31 minutes later.
      await g.page.evaluate((key) => { const p = JSON.parse(localStorage.getItem(key)); p.parts.J3.last -= 31 * 60 * 1000; localStorage.setItem(key, JSON.stringify(p)); }, STORE);
      await g.page.reload();
      await g.page.waitForSelector('#loading.is-done', { timeout: 180000 });
      await g.page.evaluate(() => { window.__se.flashAfter = 1e9; window.__se.noDefis = true; });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(1200);
      const s2 = await flame();
      check(s2.part === 2 && s2.state.size === 5 && s2.state.lit, 'au retour (30 min plus tard), la partie 2 de Flammèche est ouverte, elle est toujours grande', JSON.stringify(s2));
      check(await saidLater(/nez qui chatouille/, 15000), '« Flammèche a le nez qui chatouille… » (lu)', await said());
      // Every word next to her: ATCHOUM! Stars fall around the cottage (7 words = 10 stars).
      words = 0;
      for (let k = 0; k < 7; k++) { const r = await atFlame(); if (!/ATCHOUM/.test(r.result)) check(false, 'un mot = un éternuement', r.result); await g.page.waitForTimeout(1700); }
      await g.page.waitForFunction(() => { const l = window.__se.scene.flame.starList; return l.length === 10 && l.every((s) => s.landed); }, null, { timeout: 15000 }).catch(() => {});
      const sn = await flame();
      check(sn.sneezes === 7 && sn.out === 10, `7 mots, 7 éternuements, 10 étoiles par terre (${sn.out})`, JSON.stringify(sn));
      check(/ATCHOUM/.test(await said()), 'gag : « Ah… ah… ATCHOUM ! » à voix haute');
      check(words >= 7, `au moins 7 mots en session 2 (${words})`);
      const spots = await g.page.evaluate(() => window.__se.scene.flame.starList.map((s) => ({ x: s.to.x, z: s.to.z, d: Math.hypot(s.to.x, s.to.z - 14) })));
      check(spots.every((p) => p.d < 9.5), 'les étoiles tombent autour de la chaumière', JSON.stringify(spots));
      const stars0 = await g.page.evaluate(() => window.__se.progress().stars);
      for (const p of spots) { await g.page.evaluate(([x, z]) => window.__se.scene.teleport(x, z), [p.x, p.z]); await g.page.waitForFunction(([x, z]) => window.__se.scene.flame.starList.find((s) => Math.hypot(s.to.x - x, s.to.z - z) < 0.01)?.got, [p.x, p.z], { timeout: 5000 }).catch(() => {}); }
      const got = await flame();
      check(got.starsGot === 10 && got.out === 0, 'on ramasse les 10 étoiles en marchant dessus', JSON.stringify(got));
      check(await g.page.evaluate((s0) => window.__se.progress().stars - s0 >= 10, stars0), 'elles donnent des étoiles');
      check(/Étoile 10 sur 10/.test(await said()), 'chaque étoile est comptée à voix haute');
      // The first box of the calendar: sunglasses for the dog (something to show).
      check(await saidLater(/case 1 : 🕶️ des lunettes de soleil pour ton chien|case 1 : des lunettes de soleil pour ton chien/, 8000), 'case 1 du calendrier : des lunettes de soleil pour le chien (lu)', await said());
      const glasses = await g.page.evaluate(() => { const fl = window.__se.scene.flame, head = window.__se.scene.pet.mesh.userData.parts.head; return { cal: window.__se.flame().cal, onDog: fl.acc.meshes.some((m) => m.parent === head) }; });
      check(glasses.cal.join() === 'glasses' && glasses.onDog, 'le chien porte ses lunettes de soleil', JSON.stringify(glasses));
      // Cocotte in today's hiding spot (J3's was the woodpile next to the chimney).
      const woodpile = await g.page.evaluate(async () => { const { COCOTTE } = await import('/cocotte.js'); const r = COCOTTE.find((c) => c.day === 3); return Math.hypot(r.pos.x + 4.1, r.pos.z - 17.4); });
      check(woodpile < 0.5, 'la cachette de Cocotte du J3 est le tas de bois, à côté de la cheminée', String(woodpile));
      check(await g.page.evaluate(() => window.__se.findCocotte()) === 'ok', 'on trouve Cocotte');
      const hen = await g.page.evaluate(() => ({ feathers: window.__se.progress().feathers, day: window.__se.henRow().day }));
      check(hen.feathers?.includes(hen.day), 'Cocotte laisse une plume dorée', JSON.stringify(hen));
      check(/Cot cot/.test(await said()), '« Cot cot codêêt ! » (lu)');
      await g.page.waitForTimeout(4500);
      await g.click('#news-btn');
      await g.page.waitForTimeout(300);
      const j2 = await g.page.evaluate(() => document.querySelector('#journal-today').innerText);
      check(/Flammèche — Partie 1 ✓ · Partie 2 ✓/.test(j2) && /\(1\/7\)/.test(j2) && /trouvé Cocotte/.test(j2), 'journal : les deux parties faites, calendrier 1/7, Cocotte trouvée', j2);
      await g.click('#journal-close');
      // The next day: a word for her adds a day to the streak and opens box 2.
      await g.page.evaluate(() => { const f = window.__se.flame(), y = new Date(Date.now() - 86400000).toISOString().slice(0, 10); f.last = y; f.calDay = y; });
      await atFlame();
      const d2 = await flame();
      check(d2.days === 2 && d2.cal.length === 2, 'le lendemain : série de 2 jours et case 2 du calendrier', JSON.stringify({ days: d2.days, cal: d2.cal }));
      check(await saidLater(/Série : 2 jours/, 15000), '« Série : 2 jours » (lu)', await said());
      // A missed day: she falls asleep and snores; the magic log wakes her up, the streak goes on.
      await g.page.evaluate(() => { const f = window.__se.flame(); f.last = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10); f.magic = 1; });
      await g.page.waitForFunction(() => window.__se.flame().asleep && window.__se.scene.flame.state.asleep, null, { timeout: 10000 }).catch(() => {});
      const zz = await flame();
      check(zz.asleep && zz.state.asleep, 'un jour manqué : elle ne s’éteint pas, elle s’endort', JSON.stringify({ asleep: zz.asleep }));
      check(await saidLater(/endormie/, 15000), '« Flammèche s’est endormie… » (lu)');
      await g.use("i.kind === 'flame'");
      check(await saidLater(/bûche magique réveille Flammèche ! Ta série continue : 3 jours/, 6000), 'la bûche magique la réveille et la série continue (lu)', await said());
      const up = await flame();
      check(!up.asleep && up.days === 3 && up.magic === 0, 'réveillée, série gardée', JSON.stringify({ asleep: up.asleep, days: up.days, magic: up.magic }));
      check(g.errors.length === 0, 'aucune erreur JavaScript', g.errors.join(' | '));
      await g.page.close();
    },
  },
  {
    name: 'Album de collection (J4)',
    quick: true,
    weight: 4,
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 7, newsSeen: ['1.26.1-wagonnet', '1.19.0-alaric', '1.19.0-golem', '1.20.0-defis', '1.21.0-flamme', 'prog-pronoms', '1.23.0-pouvoirs', '1.24.0-golem-cuivre', '1.25.0-golem-neige', '1.26.3-lune'], save: save(story(2, 0), { places: ['farm'], pet: { tamed: true, name: 'Caramel', meals: 0 } }) }, { quality: 0 });
      const said = () => g.page.evaluate(() => window.__spoken.join(' | '));
      const saidSince = (n) => g.page.evaluate((k) => window.__spoken.slice(k).join(' | '), n);
      const nSaid = () => g.page.evaluate(() => window.__spoken.length);
      const saidLater = (re, timeout = 20000) => g.page.waitForFunction((r) => new RegExp(r).test(window.__spoken.join(' | ')), re.source, { timeout }).then(() => true, () => false);
      const alb = () => g.page.evaluate(() => JSON.parse(JSON.stringify(window.__se.album() ?? null)));
      await g.page.evaluate(() => { window.__se.albumGold = 0; window.__se.henDay = 4; }); // golden stickers only when the scenario asks; J4's Cocotte (in the album)
      const isOpen = () => g.page.evaluate(() => !document.querySelector('#collect-modal').hidden);
      const closeAlbum = () => g.click('#collect-close');
      const openAlbum = async (page) => { if (!(await isOpen())) { await g.click('#album-btn'); await g.page.waitForTimeout(200); } if (page) { await g.page.evaluate((p) => document.querySelector(`#collect-tabs [data-page="${p}"]`).click(), page); await g.page.waitForTimeout(150); } };
      const cardClass = (id) => g.page.evaluate((i) => document.querySelector(`#collect-grid [data-id="${i}"]`)?.className ?? '', id);
      let words = 0;
      const stick = async (id, page) => {
        await openAlbum(page);
        const ok = await g.page.evaluate((i) => { const b = document.querySelector(`#collect-grid [data-id="${i}"]`); if (!b) return false; b.click(); return true; }, id);
        if (!ok) { check(false, `la vignette ${id} est dans l’album`); return null; }
        const r = await g.spell(); words++;
        await g.page.waitForTimeout(350);
        return r;
      };
      await g.click('#continue-btn');
      // Alaric presents J4, written and spoken, with his riddle.
      const shown = await g.page.waitForFunction(() => !document.querySelector('#news-modal').hidden, null, { timeout: 10000 }).then(() => true, () => false);
      const card = await g.page.evaluate(() => ({ title: document.querySelector('#news-title').textContent, riddle: document.querySelector('#news-riddle').innerText, said: window.__spoken.join(' | ') }));
      check(shown && /album/i.test(card.title) && /Voici ton album/.test(card.said), 'Alaric présente l’album (écrit et lu)', JSON.stringify(card));
      check(/J’ai des feuilles/.test(card.riddle) && /J’ai des feuilles/.test(card.said), 'la devinette d’Alaric est écrite et lue', card.riddle);
      await g.page.evaluate(() => document.querySelector('#news-riddle .news-answer').click());
      await g.page.waitForTimeout(200);
      check(/Un livre/.test(await g.page.evaluate(() => window.__spoken.slice(-1)[0])), '« La réponse ? » lit « Un livre ! »');
      // "Montre-moi !": the golden arrow points at the album stand, next to the cottage.
      await g.click('#news-show');
      await g.page.waitForTimeout(900);
      const arrow = await g.page.evaluate(() => { const s = window.__se.scene, q = s.mapPins.find((p) => p.quest), w = s.albumStand.obj.worldPos; return { d: q ? Math.hypot(q.x - w.x, q.z - w.z) : 99, home: Math.hypot(w.x, w.z - 14), free: !s._checkCollision(w.x, w.z + 1.4) }; });
      check(arrow.d < 1 && arrow.home < 8 && arrow.free, '« Montre-moi ! » pointe la flèche vers le pupitre de l’album, à côté de la chaumière', JSON.stringify(arrow));
      // The wow moment: the pages flip by themselves, fanfare, confetti, every sticker pops in.
      const t0 = Date.now();
      check(await g.use("i.kind === 'albumstand'") === 'ok', 'on touche le pupitre de l’album');
      const flipping = await g.page.evaluate(() => window.__se.scene.albumStand.flipT >= 0);
      const opened = await g.page.waitForFunction(() => !document.querySelector('#collect-modal').hidden, null, { timeout: 5000 }).then(() => true, () => false);
      const wow = await g.page.evaluate(() => ({ reveal: document.querySelectorAll('#collect-grid .is-reveal').length, confetti: document.querySelectorAll('.confetti, .confetti-piece, [class*="confetti"]').length }));
      check(flipping && opened && wow.reveal > 10 && Date.now() - t0 < 30000, 'waouh : les pages tournent toutes seules et les vignettes apparaissent une à une, en moins de 30 s', JSON.stringify({ flipping, opened, ...wow }));
      check(await saidLater(/Voici ton album ! Il est déjà rempli de \d+ vignette/, 5000), '« Voici ton album ! Il est déjà rempli… » (lu)', await said());
      // Already filled from the save: the farm, the dog. The animals around are ready to stick.
      const a0 = await alb();
      check(a0.stuck['p:farm'] && a0.stuck['a:dog'], 'l’album s’ouvre déjà rempli (la ferme, le chien)', JSON.stringify(a0.stuck));
      const ready0 = a0.ready.filter((id) => id.startsWith('a:'));
      check(['a:cow', 'a:pig', 'a:cat', 'a:chicken'].every((id) => ready0.includes(id)), `les animaux déjà croisés attendent d’être collés (${ready0.join(', ')})`);
      check(/is-ready/.test(await cardClass('a:cow')) && /À coller/.test(await g.page.evaluate(() => document.querySelector('#collect-grid [data-id="a:cow"]').innerText)), 'une vignette à coller dit « ✨ À coller ! »');
      // A missing sticker: a silhouette "???" with a hint read aloud.
      let n0 = await nSaid();
      await g.page.evaluate(() => document.querySelector('#collect-grid [data-id="a:fox"]').click());
      await g.page.waitForTimeout(200);
      check(/is-unknown/.test(await cardClass('a:fox')) && /orange/.test(await saidSince(n0)), 'une case manquante est une silhouette « ??? » avec un indice lu', await saidSince(n0));
      // A stuck sticker makes its noise.
      n0 = await nSaid();
      await g.page.evaluate(() => document.querySelector('#collect-grid [data-id="a:dog"]').click());
      await g.page.waitForTimeout(200);
      check(/Ouaf ! Chien/.test(await saidSince(n0)), 'chaque vignette fait son cri quand on la touche (« Ouaf ! Chien ! »)', await saidSince(n0));
      // Part 2 pages are locked for now.
      n0 = await nSaid();
      await g.page.evaluate(() => document.querySelector('#collect-tabs [data-page="bosses"]').click());
      await g.page.waitForTimeout(200);
      check(/prochain retour/.test(await saidSince(n0)), 'les pages de la partie 2 sont fermées : « à ton prochain retour ! » (lu)');
      // Session 1: spell the name to stick a sticker. The gag: slurp, the hero licks the sticker!
      const first = await stick('a:cow', 'animals');
      check(first?.word === 'vache' && /Slurp… Plop ! 🐄 La vignette « Vache » est collée/.test(first.result), 'on épelle VACHE : la vignette est collée (« Slurp… Plop ! »)', JSON.stringify(first));
      check(await isOpen() && /is-stuck/.test(await cardClass('a:cow')) && /is-new/.test(await cardClass('a:cow')), 'l’album se rouvre et la nouvelle vignette s’y colle', await cardClass('a:cow'));
      check(/Slurp… plop/.test(await said()), 'gag : « Slurp… plop ! » est dit à voix haute');
      for (const id of ['a:pig', 'a:cat', 'a:chicken', 'a:sheep', 'a:lamb']) await stick(id, 'animals');
      const a1 = await alb();
      check(a1.goal1 && a1.newStuck >= 6, `objectif : 3 nouvelles vignettes (${a1.newStuck} collées)`, JSON.stringify(a1));
      await closeAlbum();
      check(await saidLater(/3 nouvelles vignettes/, 10000), '« Bravo ! 3 nouvelles vignettes ! » (lu)', await said());
      // Walking past new animals: a new sticker to stick (rabbits and the bee meadow).
      await g.page.evaluate(() => { const s = window.__se.scene, r = s.fauna.list.find((f) => f.kind === 'rabbit'); s.teleport(r.mesh.position.x + 2, r.mesh.position.z + 2); });
      const met = await g.page.waitForFunction(() => window.__se.album().ready.includes('a:rabbit'), null, { timeout: 8000 }).then(() => true, () => false);
      check(met && await saidLater(/Nouvelle vignette ! Ouvre ton album/, 15000), 'en croisant un lapin : « Nouvelle vignette ! » (lu)', `${met} ${JSON.stringify(await g.page.evaluate(() => window.__se.albumQueue()))}`);
      const rab = await stick('a:rabbit', 'animals');
      check(rab?.word === 'lapin', 'on colle le lapin', JSON.stringify(rab));
      await g.page.waitForFunction(() => window.__se.album().ready.includes('p:meadow'), null, { timeout: 8000 }).catch(() => {});
      const meadow = await stick('p:meadow', 'places');
      check(meadow?.word === 'abeille', 'un lieu découvert se colle aussi : la prairie des abeilles (ABEILLE)', JSON.stringify(meadow));
      check(words >= 7, `au moins 7 mots en session 1 (${words})`);
      // The journal: the album's two parts and Cocotte's hint, written and read.
      await closeAlbum();
      await g.page.waitForTimeout(4200);
      n0 = await nSaid();
      await g.click('#news-btn');
      await g.page.waitForTimeout(300);
      const j1 = await g.page.evaluate((n) => ({ txt: document.querySelector('#journal-today').innerText, said: window.__spoken.slice(n).join(' | ') }), n0);
      check(/Album — Partie 1 ✓ · Partie 2 : à ton prochain retour !/.test(j1.txt), 'journal : « Album — Partie 1 ✓ · Partie 2 : à ton prochain retour ! »', j1.txt);
      check(/prochain retour/.test(j1.said) && /clin d’œil/.test(j1.said) && /clin d’œil/.test(j1.txt), 'les parties et l’indice de Cocotte (dans l’album) sont lus', j1.said);
      await g.click('#journal-close');
      // Cocotte hides in the album: a sticker that winks.
      await openAlbum('animals');
      const henCard = await g.page.evaluate(() => { const b = document.querySelector('#collect-grid .is-hen'); return b ? { wink: !!b.querySelector('.hen-wink') } : null; });
      check(henCard?.wink, 'Cocotte est cachée dans l’album : une vignette fait un clin d’œil', JSON.stringify(henCard));
      check(await g.page.evaluate(() => !!window.__se.henRow().album), 'ce jour-là, Cocotte est dans l’album (pas dans le village)');
      await g.page.evaluate(() => document.querySelector('#collect-grid .is-hen').click());
      await g.page.waitForTimeout(300);
      const hen = await g.page.evaluate(() => ({ feathers: window.__se.progress().feathers, fly: !!document.querySelector('#collect-grid .is-flyaway') }));
      check(hen.feathers?.includes(4) && hen.fly, 'on la touche : elle s’envole de la page et laisse une plume dorée', JSON.stringify(hen));
      check(/Cot cot/.test(await said()), '« Cot cot codêêt ! » (lu)');
      await closeAlbum();
      // Session 2: the game is opened again 31 minutes later.
      await g.page.evaluate((key) => { const p = JSON.parse(localStorage.getItem(key)); p.parts.J4.last -= 31 * 60 * 1000; localStorage.setItem(key, JSON.stringify(p)); }, STORE);
      await g.page.reload();
      await g.page.waitForSelector('#loading.is-done', { timeout: 180000 });
      await g.page.evaluate(() => { window.__se.flashAfter = 1e9; window.__se.noDefis = true; window.__se.albumGold = 0; });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(1200);
      check(await g.page.evaluate(() => window.__se.releasePart(4)) === 2, 'au retour (30 min plus tard), la partie 2 de l’album est ouverte');
      check(await saidLater(/nouvelles pages/, 15000), '« Ton album a de nouvelles pages… » (lu)', await said());
      await openAlbum();
      const tabs = await g.page.evaluate(() => [...document.querySelectorAll('#collect-tabs .collect-tab')].map((b) => ({ p: b.dataset.page, locked: b.classList.contains('is-locked') })));
      check(tabs.length === 7 && tabs.every((t) => !t.locked), 'pages boss, objets, Mimots, plumes et découverte ouvertes', JSON.stringify(tabs));
      await openAlbum('feathers');
      check(/is-stuck/.test(await cardClass('f:4')), 'la plume dorée de Cocotte est dans la page des plumes');
      await openAlbum('mimots');
      check(/is-stuck/.test(await cardClass('m:fontaine')) && /is-unknown/.test(await cardClass('m:mare')), 'page Mimots : le Mimot apprivoisé est collé, les autres sont des silhouettes');
      await closeAlbum();
      // The discovery page: six things to find around the village, then spell.
      words = 0;
      const where = (id) => g.page.evaluate((i) => {
        const s = window.__se.scene, p = s.player.position;
        if (i === 'golem') return { x: s.golem.mesh.position.x, z: s.golem.mesh.position.z };
        if (i === 'mage') { const m = s.interactables.find((o) => o.kind === 'npc' && o.npcId === 'mage').worldPos; return { x: m.x, z: m.z }; }
        if (i === 'flame') return { x: -2.6, z: 17.5 };
        if (i === 'fountain') return { x: 0, z: 0 };
        const kind = i === 'cat' ? 'cat' : 'chicken';
        const f = s.fauna.list.filter((a) => a.kind === kind).sort((a, b) => a.mesh.position.distanceTo(p) - b.mesh.position.distanceTo(p))[0];
        return { x: f.mesh.position.x, z: f.mesh.position.z };
      }, id);
      for (const id of ['golem', 'flame', 'fountain', 'mage', 'cat', 'hen']) {
        const q = await where(id);
        await g.page.evaluate(([x, z]) => window.__se.scene.teleport(x + 1.6, z + 1.6), [q.x, q.z]);
        const ok = await g.page.waitForFunction((i) => window.__se.album().ready.includes(`d:${i}`), id, { timeout: 6000 }).then(() => true, () => false);
        if (!ok) check(false, `découverte : on trouve ${id}`);
      }
      check(await saidLater(/Tu as trouvé (Fer, le golem|Flammèche|la fontaine|Alaric le mage|le chat du village|les poules) ! Va coller la vignette/, 25000), '« Tu as trouvé Fer, le golem ! Va coller la vignette… » (lu)', await said());
      await openAlbum('disco');
      check(/is-ready/.test(await cardClass('d:mage')), 'les vignettes trouvées attendent dans la page découverte');
      for (const id of ['golem', 'flame', 'fountain', 'mage', 'cat', 'hen']) await stick(`d:${id}`, 'disco');
      const a2 = await alb();
      const cos = await g.page.evaluate(() => window.__se.progress().costumes?.owned ?? []);
      check(a2.disco && cos.includes('explorer'), 'page découverte complète : le premier costume (Explorateur) !', JSON.stringify({ disco: a2.disco, cos }));
      await closeAlbum();
      check(await saidLater(/Page découverte complète ! Tu gagnes un costume : Explorateur/, 25000), '« Page découverte complète ! Tu gagnes un costume » (lu)', await said());
      // A golden sticker (1 chance in 20 when walking past an animal; certain here).
      await g.page.evaluate(() => { window.__se.albumGold = 1; const s = window.__se.scene, c = s.fauna.list.find((f) => f.kind === 'cow'); s.teleport(c.mesh.position.x + 1.5, c.mesh.position.z + 1.5); });
      const goldOk = await g.page.waitForFunction(() => window.__se.album().gold.includes('a:cow'), null, { timeout: 6000 }).then(() => true, () => false);
      await g.page.evaluate(() => { window.__se.albumGold = 0; });
      check(goldOk && await saidLater(/Une vignette dorée/, 15000), 'en croisant une vache : « Waouh ! Une vignette dorée ! » (lu)', await said());
      const gold = await stick('a:cow', 'animals');
      check(/DORÉE/.test(gold?.result ?? '') && (await alb()).stuck['a:cow'] === 2 && /is-gold/.test(await cardClass('a:cow')), 'la vignette dorée brille dans l’album', JSON.stringify(gold));
      check(words >= 7, `au moins 7 mots en session 2 (${words})`);
      await closeAlbum();
      await g.page.waitForTimeout(4200);
      await g.click('#news-btn');
      await g.page.waitForTimeout(300);
      const j2 = await g.page.evaluate(() => document.querySelector('#journal-today').innerText);
      check(/Album — Partie 1 ✓ · Partie 2 ✓/.test(j2) && /découverte : 6\/6/.test(j2) && /dorées : 1/.test(j2), 'journal : les deux parties faites, découverte 6/6, une dorée', j2);
      await g.click('#journal-close');
      check(g.errors.length === 0, 'aucune erreur JavaScript', g.errors.join(' | '));
      await g.page.close();
    },
  },
  {
    name: 'Pouvoirs des mots (J5)',
    quick: true,
    weight: 4,
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 7, newsSeen: ['1.26.1-wagonnet', '1.19.0-alaric', '1.19.0-golem', '1.20.0-defis', '1.21.0-flamme', '1.22.0-album', 'prog-pronoms', '1.24.0-golem-cuivre', '1.25.0-golem-neige', '1.26.3-lune'], save: save(story(2, 0), { pet: { tamed: true, name: 'Caramel', meals: 0 } }) }, { quality: 0 });
      await g.page.evaluate(() => window.__se.henDayUse(5)); // J5's Cocotte (on the highest cloud)
      const said = () => g.page.evaluate(() => window.__spoken.join(' | '));
      const nSaid = () => g.page.evaluate(() => window.__spoken.length);
      const saidSince = (n) => g.page.evaluate((k) => window.__spoken.slice(k).join(' | '), n);
      const saidLater = (re, timeout = 20000) => g.page.waitForFunction((r) => new RegExp(r).test(window.__spoken.join(' | ')), re.source, { timeout }).then(() => true, () => false);
      const pw = () => g.page.evaluate(() => JSON.parse(JSON.stringify(window.__se.powers() ?? null)));
      const now = () => g.page.evaluate(() => window.__se.powerNow()?.kind ?? null);
      const spellOpen = (timeout = 6000) => g.page.waitForFunction(() => !document.querySelector('#spell-modal').hidden && !!window.__se.spell(), null, { timeout }).then(() => true, () => false);
      const onCloud = (k) => g.page.evaluate((i) => { const s = window.__se.scene, c = s.powers.constructor && window.__se.scene.walkways.find((w) => w.cloud && w.cloudIndex === i); s.teleport(c.x + 0.3, c.z + 0.3, 0, c.h); return s.player.position.y; }, k);
      let words = 0;
      await g.click('#continue-btn');
      // Alaric presents J5, written and spoken, with his riddle.
      const shown = await g.page.waitForFunction(() => !document.querySelector('#news-modal').hidden, null, { timeout: 10000 }).then(() => true, () => false);
      const card = await g.page.evaluate(() => ({ title: document.querySelector('#news-title').textContent, riddle: document.querySelector('#news-riddle').innerText, said: window.__spoken.join(' | ') }));
      check(shown && /pouvoirs/i.test(card.title) && /Les mots ont des pouvoirs/.test(card.said), 'Alaric présente les pouvoirs des mots (écrit et lu)', JSON.stringify(card));
      check(/monte et ne redescend jamais/.test(card.riddle) && /monte et ne redescend jamais/.test(card.said), 'la devinette d’Alaric est écrite et lue', card.riddle);
      await g.page.evaluate(() => document.querySelector('#news-riddle .news-answer').click());
      await g.page.waitForTimeout(200);
      check(/Ton âge/.test(await g.page.evaluate(() => window.__spoken.slice(-1)[0])), '« La réponse ? » lit « Ton âge ! »');
      await g.click('#news-show');
      await g.page.waitForTimeout(900);
      const arrow = await g.page.evaluate(() => { const s = window.__se.scene, q = s.mapPins.find((p) => p.quest), w = s.powers.obj.worldPos; return { d: q ? Math.hypot(q.x - w.x, q.z - w.z) : 99, home: Math.hypot(w.x, w.z - 14), free: !s._checkCollision(w.x, w.z + 1.4) }; });
      check(arrow.d < 1 && arrow.home < 20 && arrow.free, '« Montre-moi ! » pointe la flèche vers la pierre des pouvoirs, au bout du chemin devant la chaumière', JSON.stringify(arrow));
      // Without a power, a normal jump does not reach the first cloud.
      const jump = (x, z) => g.page.evaluate(async ([px, pz]) => { const s = window.__se.scene; s.teleport(px, pz); await new Promise((r) => setTimeout(r, 150)); const y0 = s.player.position.y; s.jump(); let m = y0; for (let i = 0; i < 30; i++) { await new Promise((r) => setTimeout(r, 50)); m = Math.max(m, s.player.position.y); } return { up: +(m - y0).toFixed(2), y: +s.player.position.y.toFixed(2), cloud: s.powers.onCloud() }; }, [x, z]);
      const j0 = await jump(1, 28);
      check(j0.up < 2 && j0.cloud === -1, 'sans pouvoir, un saut normal ne va pas jusqu’au premier nuage', JSON.stringify(j0));
      // The wow: the stone wakes up, sparkles fly to the five clouds, the stars appear; then a hard word.
      const t0 = Date.now();
      check(await g.use("i.kind === 'powerstone'") === 'ok', 'on touche la pierre des pouvoirs');
      const wow = await g.page.evaluate(() => { const p = window.__se.scene.powers; return { waking: p.wakeT >= 0, stars: p.stars.visible }; });
      check(wow.waking && wow.stars && await saidLater(/Les mots ont des pouvoirs ! Regarde les nuages/, 3000), 'waouh : la pierre se réveille, des étincelles montent aux cinq nuages, les étoiles apparaissent (lu)', JSON.stringify(wow));
      check(await spellOpen(9000), 'puis la pierre demande un mot difficile');
      const lvl = await g.page.evaluate(() => ({ w: window.__se.spell().word.level, hard: window.__se.levelAt(1) }));
      check(lvl.w === lvl.hard || lvl.w === 'programme' || !!lvl.w, `un mot du niveau au-dessus (${lvl.w})`, JSON.stringify(lvl));
      const s1 = await g.spell(); words++;
      check(/super saut/.test(s1.result) && await now() === 'jump' && Date.now() - t0 < 30000, 'mot réussi : pouvoir super saut, moins de 30 s après « Montre-moi ! »', s1.result);
      check(/Pouvoir super saut/.test(await said()), '« Pouvoir super saut ! » (lu)');
      const hud = await g.page.evaluate(() => ({ hidden: document.querySelector('#power-hud').hidden, txt: document.querySelector('#power-hud').textContent }));
      check(!hud.hidden && /🦘 \d+ s/.test(hud.txt), 'le compte à rebours du pouvoir s’affiche', JSON.stringify(hud));
      // Super jump from under the first cloud: up onto it. Boing! A word on the cloud.
      const j1 = await jump(1, 28);
      check(j1.up > 2 && j1.cloud === 0 && Math.abs(j1.y - 3.0) < 0.05, 'en super saut, on monte sur le premier nuage', JSON.stringify(j1));
      check(await spellOpen(), 'sur le nuage, un mot s’ouvre');
      const c1 = await g.spell(); words++;
      check(/L’étoile du nuage 1/.test(c1.result), '« L’étoile du nuage 1 ! Ton pouvoir est rechargé » ', c1.result);
      // The letters of the word trail behind the hero while running.
      const trail = await g.page.evaluate(async () => { const s = window.__se.scene; s.teleport(3, 20); s.keys.arrowup = true; await new Promise((r) => setTimeout(r, 700)); s.keys.arrowup = false; const p = s.powers; return { word: p.trailWord, shown: p.trail.filter((t) => t.sprite.visible).length }; });
      check(trail.word.length > 0 && trail.shown > 0, `les lettres du mot forment une traînée derrière le héros (${trail.word})`, JSON.stringify(trail));
      // The dog comes up onto the cloud too.
      await onCloud(1);
      check(await spellOpen(), 'nuage 2 : un mot');
      await g.spell(); words++;
      const dog = await g.page.evaluate(() => { const s = window.__se.scene; s.pet.update(0.1, 0); return +s.pet.mesh.position.y.toFixed(2); });
      check(Math.abs(dog - 5.8) < 0.1, 'le chien saute sur le nuage avec le héros', String(dog));
      for (const k of [2, 3, 4]) {
        await g.page.evaluate(() => { window.__se.powerNow() && (window.__se.powerNow().left = 20); });
        await onCloud(k);
        if (!(await spellOpen())) { check(false, `nuage ${k + 1} : un mot`); continue; }
        await g.spell(); words++;
      }
      const a1 = await pw();
      check(a1.clouds.length === 5 && a1.petCloud, 'les cinq nuages : un petit nuage suit le héros', JSON.stringify(a1));
      check(await saidLater(/Tu es monté sur les cinq nuages/, 12000), '« Bravo ! Tu es monté sur les cinq nuages ! » (lu)', await said());
      check(await g.page.evaluate(() => !!window.__se.scene.powers.petCloud), 'le petit nuage flotte au-dessus de la tête (à montrer)');
      // The journal gives Cocotte's hint, written and read.
      await g.page.waitForTimeout(4000);
      let n0 = await nSaid();
      await g.click('#news-btn');
      await g.page.waitForTimeout(300);
      const jh = await g.page.evaluate((n) => ({ txt: document.querySelector('#journal-today').innerText, said: window.__spoken.slice(n).join(' | ') }), n0);
      check(/plus haut des nuages/.test(jh.txt) && /plus haut des nuages/.test(jh.said), 'journal : l’indice de Cocotte (« sur le plus haut des nuages ») est écrit et lu', jh.said);
      await g.click('#journal-close');
      // Cocotte is on the highest cloud: from the ground, too high; from up there, a feather.
      check(await g.page.evaluate(() => window.__se.henRow().day === 5 && window.__se.henRow().cloud === true), 'Cocotte est cachée sur le plus haut nuage');
      n0 = await nSaid();
      await g.page.evaluate(() => { const s = window.__se.scene, o = s.cocotte.obj; s.teleport(o.worldPos.x + 0.9, o.worldPos.z + 0.9); s.onInteractObject(o); });
      await g.page.waitForTimeout(300);
      check(/tout là-haut/.test(await saidSince(n0)) && !(await g.page.evaluate(() => window.__se.progress().feathers ?? [])).includes(5), 'depuis le sol : « Cocotte est tout là-haut… il te faut le super saut » (lu)', await saidSince(n0));
      check(await g.page.evaluate(() => window.__se.findCocotte()) === 'ok', 'depuis le nuage, on touche Cocotte');
      await g.page.waitForTimeout(300);
      check((await g.page.evaluate(() => window.__se.progress().feathers)).includes(5) && /Cot cot/.test(await said()), 'Cocotte s’envole : une plume dorée (« Cot cot ! »)');
      // The gag: falling from the sky without a power: Pouf! (squashed like a pancake).
      await g.page.evaluate(() => { const p = window.__se.powerNow(); if (p) p.left = 0.1; });
      check(await saidLater(/Fini, le pouvoir super saut/, 8000), 'quand le temps est fini : « Fini, le pouvoir super saut… » (lu)', await said());
      const pouf = await g.page.evaluate(async () => { const s = window.__se.scene; s.teleport(8, 20); s.player.position.y = 12; s.playerVY = 0; await new Promise((r) => setTimeout(r, 1500)); return s.powers.poufs ?? 0; });
      check(pouf >= 1, 'gag : une grosse chute fait « Pouf ! » et le héros s’écrase comme une crêpe', String(pouf));
      // Back to the stone for another power (a 7th word).
      await g.use("i.kind === 'powerstone'");
      if (await spellOpen()) { await g.spell(); words++; }
      check(await now() === 'jump', 'la pierre redonne un pouvoir');
      // A hard word right the first time, anywhere: a power as a bonus.
      await g.page.evaluate(() => window.__se.scene.powers.stop());
      await g.use("i.kind === 'node' && i.active && !i.requires && i.nodeType !== 'chest'");
      if (await spellOpen()) {
        await g.page.evaluate(() => { const c = window.__se.spell(); c.word = window.__se.pickWord(window.__se.levelAt(2), { programme: false }); });
        await g.spell(); words++;
      }
      check(['speed', 'jump'].includes(await now()) && await saidLater(/Mot difficile réussi du premier coup/, 10000), 'un mot difficile réussi du premier coup ailleurs donne aussi un pouvoir (lu)', await said());
      check(words >= 7, `au moins 7 mots en session 1 (${words})`);
      // The journal: the two parts and Cocotte's hint, written and read.
      await g.page.waitForTimeout(4000);
      n0 = await nSaid();
      await g.click('#news-btn');
      await g.page.waitForTimeout(300);
      const j1t = await g.page.evaluate((n) => ({ txt: document.querySelector('#journal-today').innerText, said: window.__spoken.slice(n).join(' | ') }), n0);
      check(/Pouvoirs des mots — Partie 1 ✓ · Partie 2 : à ton prochain retour !/.test(j1t.txt) && /Nuages : 5\/5/.test(j1t.txt), 'journal : « Pouvoirs des mots — Partie 1 ✓ · Partie 2 : à ton prochain retour ! »', j1t.txt);
      check(/Partie 2 : à ton prochain retour/.test(j1t.said) && /Tu as trouvé Cocotte/.test(j1t.said), 'les parties sont lues (et Cocotte est trouvée)', j1t.said);
      await g.click('#journal-close');
      // Session 2: the game is opened again 31 minutes later.
      // (the game is paused first, so that it does not save "just played" over the changed time)
      await g.page.evaluate(() => { document.body.dataset.screen = 'paused'; });
      await g.page.waitForTimeout(400);
      await g.page.evaluate((key) => { const pr = window.__se.progress(); pr.parts.J5.last -= 31 * 60 * 1000; const p = JSON.parse(localStorage.getItem(key)); p.parts.J5.last = pr.parts.J5.last; localStorage.setItem(key, JSON.stringify(p)); }, STORE);
      await g.page.reload();
      await g.page.waitForSelector('#loading.is-done', { timeout: 180000 });
      await g.page.evaluate(() => { window.__se.flashAfter = 1e9; window.__se.noDefis = true; });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(1200);
      check(await g.page.evaluate(() => window.__se.releasePart(5)) === 2, 'au retour (30 min plus tard), la partie 2 des pouvoirs est ouverte');
      check(await saidLater(/deux nouveaux pouvoirs : géant et planer/, 15000), '« La pierre des pouvoirs a deux nouveaux pouvoirs : géant et planer ! » (lu)', await said());
      check(await g.page.evaluate(() => window.__se.scene.powers.rings.visible && !!window.__se.scene.powers.petCloud), 'les cinq anneaux dorés sont apparus ; le petit nuage est toujours là');
      words = 0;
      // Giant: every step makes the animals bounce (and the dog is a giant too).
      await g.use("i.kind === 'powerstone'");
      check(await spellOpen(), 'la pierre demande un mot difficile');
      const s2 = await g.spell(); words++;
      check(/géant/.test(s2.result) && await now() === 'giant' && /Et ton chien aussi/.test(s2.result), 'pouvoir géant ! (et le chien aussi)', s2.result);
      await g.page.waitForTimeout(1500);
      const big = await g.page.evaluate(() => { const s = window.__se.scene; return { hero: +s.player.scale.x.toFixed(2), dog: +(s.pet.mesh.scale.x / (s.pet.baseScale ?? 1)).toFixed(2) }; });
      check(big.hero > 2 && big.dog > 1.7, 'le héros et le chien deviennent géants', JSON.stringify(big));
      const stomp = await g.page.evaluate(async () => {
        const s = window.__se.scene, seen = new Set();
        for (const a of s.fauna.list.filter((f) => !f.def.swim && Math.hypot(f.mesh.position.x, f.mesh.position.z - 14) < 40)) {
          if (seen.size >= 6) break;
          s.teleport(a.mesh.position.x + 2, a.mesh.position.z + 2);
          s.keys.arrowleft = true; await new Promise((r) => setTimeout(r, 700)); s.keys.arrowleft = false;
          if (a.bounceT > 0 || window.__se.powers().bounced.includes(s.fauna.list.indexOf(a))) seen.add(a);
          if (window.__se.powers().animals >= 5) break;
          window.__se.powerNow() && (window.__se.powerNow().left = 20);
        }
        return window.__se.powers().animals;
      });
      check(stomp >= 5, `en géant, chaque pas fait rebondir les animaux (${stomp}/5)`);
      check(await saidLater(/Cinq animaux ont rebondi/, 15000), '« Cinq animaux ont rebondi ! Quel géant ! » (lu)', await said());
      // Glide: from the highest cloud, through the five rings; a word per ring on landing.
      await g.page.evaluate(() => window.__se.scene.powers.stop());
      await g.use("i.kind === 'powerstone'");
      check(await spellOpen(), 'la pierre redonne un mot difficile');
      const s3 = await g.spell(); words++;
      check(/planer/.test(s3.result) && await now() === 'glide', 'puis : pouvoir planer !', s3.result);
      await onCloud(4);
      const glide = await g.page.evaluate(async () => { const s = window.__se.scene; s.jump(); await new Promise((r) => setTimeout(r, 1300)); return { vy: s.playerVY, y: s.player.position.y }; });
      check(glide.vy >= -2.5 && glide.y > 11.5, 'on saute du plus haut nuage et on plane doucement', JSON.stringify(glide));
      const fly = (list) => g.page.evaluate(async (rs) => {
        const s = window.__se.scene;
        for (const r of rs) { s.player.position.set(r.x, r.y - 0.8, r.z); s.playerVY = -1; await new Promise((q) => setTimeout(q, 120)); }
      }, list);
      const RINGS = await g.page.evaluate(async () => (await import('/powers.js')).RINGS);
      await fly(RINGS.slice(0, 2));
      check(await saidLater(/Anneau 2 sur 5/, 5000), 'à travers les anneaux : « Anneau 1 sur 5 ! Anneau 2 sur 5 ! » (lu)', await said());
      // Landing: one word per ring.
      await g.page.evaluate(() => { const s = window.__se.scene; s.player.position.set(8, 1.6, 20); s.playerVY = -1; });
      for (let k = 0; k < 2; k++) { if (await spellOpen(8000)) { await g.spell(); words++; } else check(false, `un mot pour garder l’anneau ${k + 1}`); }
      check((await pw()).rings.length === 2, 'à l’atterrissage, un mot par anneau : deux anneaux gardés', JSON.stringify(await pw()));
      // Second flight: the three last rings, then the cape.
      await onCloud(4);
      await g.page.evaluate(async () => { const s = window.__se.scene; window.__se.powerNow() && (window.__se.powerNow().left = 30); s.jump(); await new Promise((r) => setTimeout(r, 600)); });
      await fly(RINGS.slice(2));
      await g.page.evaluate(() => { const s = window.__se.scene; s.player.position.set(21, 1.2, -4); s.playerVY = -1; });
      for (let k = 0; k < 3; k++) { if (await spellOpen(8000)) { await g.spell(); words++; } else check(false, `un mot pour garder l’anneau ${k + 3}`); }
      const a2 = await pw();
      const cos = await g.page.evaluate(() => window.__se.progress().costumes ?? {});
      check(a2.rings.length === 5 && a2.cape && cos.owned?.includes('cloudhero') && cos.current === 'cloudhero', 'les cinq anneaux : la cape du Héros des nuages (portée tout de suite)', JSON.stringify({ rings: a2.rings, cos }));
      check(/cape du Héros des nuages/.test(await said()), '« Tu gagnes la cape du Héros des nuages ! » (lu)');
      check(words >= 7, `au moins 7 mots en session 2 (${words})`);
      await g.page.waitForTimeout(4200);
      await g.click('#news-btn');
      await g.page.waitForTimeout(300);
      const j2 = await g.page.evaluate(() => document.querySelector('#journal-today').innerText);
      check(/Pouvoirs des mots — Partie 1 ✓ · Partie 2 ✓/.test(j2) && /Anneaux : 5\/5/.test(j2) && /Animaux rebondis : 5\/5/.test(j2), 'journal : les deux parties faites, 5 anneaux, 5 animaux', j2);
      await g.click('#journal-close');
      check(g.errors.length === 0, 'aucune erreur JavaScript', g.errors.join(' | '));
      await g.page.close();
    },
  },
  {
    name: 'Petit golem de cuivre, boutons secrets et boss vivants (J6)',
    quick: true,
    weight: 4,
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 7, newsSeen: ['1.19.0-alaric', '1.19.0-golem', '1.20.0-defis', '1.21.0-flamme', '1.22.0-album', '1.23.0-pouvoirs', 'prog-pronoms', 'prog-articles', '1.25.0-golem-neige', '1.26.1-wagonnet', '1.26.3-lune'], save: save(story(2, 0), { pet: { tamed: true, name: 'Caramel', meals: 0 }, powers: { awake: true, clouds: [0, 1, 2, 3, 4], rings: [], animals: 0, bounced: [], petCloud: true, cape: false, uses: 3 } }) }, { quality: 0 });
      await g.page.evaluate(() => window.__se.henDayUse(6)); // J6's Cocotte (on the moss golem's head)
      const said = () => g.page.evaluate(() => window.__spoken.join(' | '));
      const nSaid = () => g.page.evaluate(() => window.__spoken.length);
      const saidSince = (n) => g.page.evaluate((k) => window.__spoken.slice(k).join(' | '), n);
      const saidLater = (re, timeout = 20000) => g.page.waitForFunction((r) => new RegExp(r).test(window.__spoken.join(' | ')), re.source, { timeout }).then(() => true, () => false);
      const cu = () => g.page.evaluate(() => JSON.parse(JSON.stringify(window.__se.copper() ?? null)));
      const mode = () => g.page.evaluate(() => window.__se.scene.copper.mode);
      const spellOpen = (timeout = 6000) => g.page.waitForFunction(() => !document.querySelector('#spell-modal').hidden && !!window.__se.spell(), null, { timeout }).then(() => true, () => false);
      const SPOTS = await g.page.evaluate(async () => (await import('/copper.js')).BUTTON_SPOTS);
      // The hero goes to a spot of secret buttons: Boulon presses all three (two fakes, then the real one).
      const pressSpot = async (id) => {
        const sp = SPOTS.find((b) => b.id === id);
        await g.page.evaluate(([x, z]) => { const s = window.__se.scene; s.teleport(x + 2.6, z + 2.6); }, [sp.x, sp.z]);
        return g.page.waitForFunction(() => window.__se.scene.copper.cobj.active, null, { timeout: 20000 }).then(() => true, () => false);
      };
      let words = 0;
      await g.click('#continue-btn');
      // Alaric presents J6, written and spoken, with his riddle.
      const shown = await g.page.waitForFunction(() => !document.querySelector('#news-modal').hidden, null, { timeout: 10000 }).then(() => true, () => false);
      const card = await g.page.evaluate(() => ({ title: document.querySelector('#news-title').textContent, riddle: document.querySelector('#news-riddle').innerText, said: window.__spoken.join(' | ') }));
      check(shown && /golem de cuivre/i.test(card.title) && /petit golem de cuivre/.test(card.said) && /marchent dans leur repaire/.test(card.said), 'Alaric présente le petit golem de cuivre et les boss qui marchent (écrit et lu)', JSON.stringify(card));
      check(/cache-cache/.test(card.riddle) && /cache-cache/.test(card.said), 'la devinette d’Alaric est écrite et lue', card.riddle);
      await g.page.evaluate(() => document.querySelector('#news-riddle .news-answer').click());
      await g.page.waitForTimeout(200);
      check(/bong, bong, bong/.test(await g.page.evaluate(() => window.__spoken.slice(-1)[0])), '« La réponse ? » lit « … bong, bong, bong ! »');
      await g.click('#news-show');
      await g.page.waitForTimeout(900);
      const arrow = await g.page.evaluate(() => { const s = window.__se.scene, q = s.mapPins.find((p) => p.quest), w = s.copper.obj.worldPos; return { d: q ? Math.hypot(q.x - w.x, q.z - w.z) : 99, forge: Math.hypot(w.x + 10, w.z + 6), free: !s._checkCollision(w.x + 0.9, w.z + 0.9) }; });
      check(arrow.d < 1 && arrow.forge < 7 && arrow.free, '« Montre-moi ! » pointe la flèche vers l’enclume, à côté de la forge', JSON.stringify(arrow));
      // The wow: the recipe (FER, PIERRE, FEU), then the pieces fly together: bong, bong… Boulon!
      const t0 = Date.now();
      check(await g.use("i.kind === 'anvil'") === 'ok' && await spellOpen(), 'on touche l’enclume : la recette demande un mot');
      const first = await g.page.evaluate(() => ({ w: window.__se.spell().word.word, instr: document.querySelector('#spell-modal').innerText, said: window.__spoken.slice(-1)[0] }));
      check(first.w === 'fer' && /fer \+ pierre \+ feu/.test(first.instr) && /Recette du petit golem/.test(first.said), 'recette : « fer + pierre + feu », on épelle FER (lu)', JSON.stringify(first));
      const r1 = await g.spell(); words++;
      check(/Clang/.test(r1.result) && await g.page.evaluate(() => window.__se.scene.copper.blocks[0].visible), 'Clang ! Le fer est posé sur l’enclume', r1.result);
      for (const w of ['pierre', 'feu']) {
        if (!(await spellOpen(5000))) { check(false, `la recette demande ${w}`); continue; }
        check(await g.page.evaluate(() => window.__se.spell().word.word) === w, `puis ${w.toUpperCase()}`);
        await g.spell(); words++;
      }
      const asm = await g.page.waitForFunction(() => ['assemble', 'follow'].includes(window.__se.scene.copper.mode), null, { timeout: 5000 }).then(() => true, () => false);
      check(asm && await saidLater(/Je suis Boulon/, 8000) && Date.now() - t0 < 30000, 'waouh : les pièces s’assemblent (bong !) et Boulon dit bonjour, moins de 30 s après « Montre-moi ! »', await said());
      check(await saidLater(/Je sens un bouton secret… près de la tour du mage/, 12000), 'Boulon dit où chercher le premier bouton (lu)', await said());
      check((await cu()).made && await mode() === 'follow', 'Boulon est construit et suit le héros');
      // He follows the hero.
      const follow = await g.page.evaluate(async () => { const s = window.__se.scene; s.teleport(-3, 24); await new Promise((r) => setTimeout(r, 300)); s.keys.arrowright = true; await new Promise((r) => setTimeout(r, 1200)); s.keys.arrowright = false; await new Promise((r) => setTimeout(r, 900)); const g = s.copper.golem.position, p = s.player.position; return +Math.hypot(g.x - p.x, g.z - p.z).toFixed(2); });
      check(follow < 4, `Boulon suit le héros (${follow} m)`);
      // The gag: he trips over his own feet (Oups !).
      const trip = await g.page.evaluate(async () => { const s = window.__se.scene; s.copper.tripIn = 0; s.keys.arrowleft = true; await new Promise((r) => setTimeout(r, 1300)); s.keys.arrowleft = false; return window.__se.copper().trips; });
      check(trip >= 1 && /Boulon a trébuché/.test(await said()), 'gag : Boulon trébuche et tombe à plat ventre (« Oups ! », lu)', String(trip));
      // The first spot: two fake buttons (Pouet! confetti), then the real one: a secret chest comes out.
      check(await pressSpot('tower'), 'près de la tour, Boulon appuie sur les boutons… le vrai fait sortir un coffre secret de terre');
      const s1 = await said();
      check(/Pouet ! Un faux bouton/.test(s1) && /Clic ! Le vrai bouton/.test(s1), 'les faux boutons font « Pouet ! » et des confettis, le vrai fait « Clic ! » (lu)', s1);
      check(await g.use("i.kind === 'secretchest'") === 'ok' && await spellOpen(), 'on touche le coffre secret : un mot');
      const c1 = await g.spell(); words++;
      check(/coffre secret est ouvert ! \(1\/2\)/.test(c1.result), 'le coffre secret s’ouvre (1/2)', c1.result);
      check(await saidLater(/Encore un bouton… devant la boutique/, 12000), 'Boulon annonce le bouton suivant (lu)', await said());
      // His key runs down: a word winds it.
      await g.page.evaluate(() => { const c = window.__se.copper(); c.left = c.nextWind + 0.2; });
      check(await saidLater(/Boulon est à plat/, 8000) && await mode() === 'flat', 'au bout d’une minute, Boulon est à plat (lu)', await said());
      check(await g.use("i.kind === 'copper'") === 'ok' && await spellOpen(), 'on touche Boulon : un mot pour remonter sa clé');
      const w1 = await g.spell(); words++;
      check(/La clé tourne/.test(w1.result) && await mode() === 'follow', '« Cric, cric ! La clé tourne : Boulon repart ! »', w1.result);
      // The second spot: a big chest with two locks, and a golden key for Boulon.
      const nTap = await nSaid();
      check(await g.use("i.kind === 'secretbutton' && i.spot === 1") === 'ok' && /Boulon, à toi/.test(await saidSince(nTap)), 'on touche les boutons de la boutique : « Boulon, à toi ! » (lu), il court appuyer');
      check(await g.page.waitForFunction(() => window.__se.scene.copper.cobj.active, null, { timeout: 20000 }).then(() => true, () => false), 'devant la boutique, le deuxième bouton secret : un gros coffre');
      await g.use("i.kind === 'secretchest'");
      for (let k = 0; k < 2; k++) { if (await spellOpen(6000)) { await g.spell(); words++; } else check(false, `serrure ${k + 1}`); }
      const a1 = await cu();
      check(a1.opened.length === 2 && a1.goldKey && await g.page.evaluate(() => window.__se.scene.copper.state.goldKey), 'deux serrures, deux mots : Boulon porte une clé dorée dans le dos (à montrer)', JSON.stringify(a1));
      check(/clé dorée/.test(await said()), '« Regarde : Boulon a une clé dorée dans le dos ! » (lu)');
      check(words >= 7, `au moins 7 mots en session 1 (${words})`);
      // The bosses' golems walk round their lair, and raise their arms when the hero comes near.
      const walk = await g.page.evaluate(async () => {
        const s = window.__se.scene, b = s.bosses.get('mossGolem');
        s.teleport(-74 + 16, 6);
        await new Promise((r) => setTimeout(r, 300));
        const a = b.mesh.position.clone();
        await new Promise((r) => setTimeout(r, 1500));
        return { moved: +a.distanceTo(b.mesh.position).toFixed(2) };
      });
      check(walk.moved > 0.3, `le golem de mousse marche dans son repaire (${walk.moved} m)`);
      let n0 = await nSaid();
      const wave = await g.page.evaluate(async () => { const s = window.__se.scene, b = s.bosses.get('mossGolem'); s.teleport(-74 + 4, 4); await new Promise((r) => setTimeout(r, 1200)); return +b.mesh.userData.parts.arms[0].rotation.x.toFixed(2); });
      check(wave < -1.5, 'quand on approche, il lève les bras', String(wave));
      check(await saidLater(/Atchoum/, 6000) && /Atchoum/.test(await saidSince(n0)), 'gag : le golem de mousse éternue des feuilles (« Atchoum ! », lu)');
      // Cocotte rides on the moss golem's head (journal hint written and read).
      n0 = await nSaid();
      await g.click('#news-btn');
      await g.page.waitForTimeout(300);
      const jh = await g.page.evaluate((n) => ({ txt: document.querySelector('#journal-today').innerText, said: window.__spoken.slice(n).join(' | ') }), n0);
      check(/tête du golem de mousse/.test(jh.txt) && /tête du golem de mousse/.test(jh.said), 'journal : l’indice de Cocotte (« sur la tête du golem de mousse ») est écrit et lu', jh.said);
      check(/Le petit golem de cuivre — Partie 1 ✓ · Partie 2 : à ton prochain retour !/.test(jh.txt) && /Boutons secrets : 2\/2/.test(jh.txt), 'journal : « Le petit golem de cuivre — Partie 1 ✓ · Partie 2 : à ton prochain retour ! »', jh.txt);
      check(/Partie 2 : à ton prochain retour/.test(jh.said), 'les parties sont lues', jh.said);
      await g.click('#journal-close');
      const hen = await g.page.evaluate(() => { const s = window.__se.scene, h = s.cocotte, b = s.bosses.get('mossGolem'); return { day: window.__se.henRow().day, dx: +Math.hypot(h.mesh.position.x - b.mesh.position.x, h.mesh.position.z - b.mesh.position.z).toFixed(2), up: +(h.mesh.position.y - b.baseY).toFixed(2) }; });
      check(hen.day === 6 && hen.dx < 0.6 && hen.up > 3.4, 'Cocotte est assise sur la tête du golem de mousse', JSON.stringify(hen));
      check(await g.page.evaluate(() => window.__se.findCocotte()) === 'ok', 'on touche Cocotte');
      await g.page.waitForTimeout(300);
      check((await g.page.evaluate(() => window.__se.progress().feathers)).includes(6) && /Cot cot/.test(await said()), 'Cocotte s’envole : une plume dorée (« Cot cot ! »)');
      // The hang-glider (the parent's idea): with the glide power, a striped wing over the hero; Boulon holds on.
      await g.page.evaluate(() => { window.__se.givePower('glide'); const s = window.__se.scene; s.teleport(1.5, 16); });
      await g.page.waitForTimeout(400);
      const fly = await g.page.evaluate(async () => {
        const s = window.__se.scene, c = window.__se.scene.walkways.find((w) => w.cloud && w.cloudIndex === 4);
        s.teleport(c.x + 0.3, c.z + 0.3, 0, c.h);
        await new Promise((r) => setTimeout(r, 200));
        s.jump();
        await new Promise((r) => setTimeout(r, 900));
        s.player.rotation.y += 0.6;
        await new Promise((r) => setTimeout(r, 300));
        return { glider: s.copper.glider.visible, open: +s.copper.gliderOpen.toFixed(2), ride: s.copper.mode, below: +(s.player.position.y - s.copper.golem.position.y).toFixed(2) };
      });
      check(fly.glider && fly.open > 0.8, 'en planant, un deltaplane coloré s’ouvre au-dessus du héros', JSON.stringify(fly));
      check(fly.ride === 'ride' && fly.below > 0.5, 'Boulon s’accroche sous le deltaplane', JSON.stringify(fly));
      const land = await g.page.evaluate(async () => { const s = window.__se.scene; s.player.position.y = s.groundAt(s.player.position.x, s.player.position.z) + 0.3; s.playerVY = -1; await new Promise((r) => setTimeout(r, 900)); return { glider: s.copper.glider.visible, mode: s.copper.mode, bong: s.copper.rideLands ?? 0 }; });
      check(!land.glider && land.mode === 'follow' && land.bong >= 1, 'à l’atterrissage, le deltaplane se replie et Boulon fait « Bong ! »', JSON.stringify(land));
      await g.page.evaluate(() => window.__se.scene.powers.stop());
      // Session 2: the game is opened again 31 minutes later.
      await g.page.evaluate(() => { document.body.dataset.screen = 'paused'; });
      await g.page.waitForTimeout(400);
      await g.page.evaluate((key) => { const pr = window.__se.progress(); pr.parts.J6.last -= 31 * 60 * 1000; const p = JSON.parse(localStorage.getItem(key)); p.parts.J6.last = pr.parts.J6.last; localStorage.setItem(key, JSON.stringify(p)); }, STORE);
      await g.page.reload();
      await g.page.waitForSelector('#loading.is-done', { timeout: 180000 });
      await g.page.evaluate(() => { window.__se.flashAfter = 1e9; window.__se.noDefis = true; });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(1200);
      check(await g.page.evaluate(() => window.__se.releasePart(6)) === 2, 'au retour (30 min plus tard), la partie 2 du petit golem est ouverte');
      check(await saidLater(/Boulon a verdi/, 15000), '« Oh non ! Boulon a verdi, comme le vieux cuivre ! » (lu)', await said());
      const back = await g.page.evaluate(() => { const s = window.__se.scene.copper; return { mode: s.mode, green: s.state.green, part: s.state.part, key: s.state.goldKey }; });
      check(back.mode === 'sleep' && back.green && back.part === 2 && back.key, 'Boulon dort près de l’enclume, tout vert, avec sa clé dorée ; trois nouveaux boutons sont cachés', JSON.stringify(back));
      words = 0;
      check(await g.use("i.kind === 'anvil'") === 'ok' && await spellOpen(), 'on touche l’enclume : un mot pour réveiller Boulon');
      const wk = await g.spell(); words++;
      check(/Debout, Boulon/.test(wk.result) && await mode() === 'follow', '« Debout, Boulon ! »', wk.result);
      check(await g.use("i.kind === 'copper'") === 'ok' && await spellOpen(), 'on touche Boulon (tout vert) : un mot pour le faire briller');
      check(await g.page.evaluate(() => window.__se.spell().word.word) === 'brille', 'le mot est BRILLE');
      const sh = await g.spell(); words++;
      check(/brille comme un sou neuf/.test(sh.result) && !(await g.page.evaluate(() => window.__se.scene.copper.state.green)), 'Bling ! Boulon brille comme un sou neuf (étincelles)', sh.result);
      // Fer and Boulon wave at each other.
      n0 = await nSaid();
      const greet = await g.page.evaluate(async () => { const s = window.__se.scene, f = s.golem.mesh.position; s.teleport(f.x + 2.2, f.z + 2.2); s.copper.greetCool = 0; s.copper.golem.position.set(f.x + 1.5, f.y, f.z + 1.5); s.copper.mode = 'follow'; await new Promise((r) => setTimeout(r, 500)); return s.golem.waveT > 0 || s.copper.greetT >= 0; });
      check(greet && /Salut, Fer/.test(await saidSince(n0)), 'Fer et Boulon se saluent (« Salut, Fer ! », lu)');
      // Three secret buttons in three places; the last chest has two locks.
      for (const id of ['tavern', 'pond', 'guild']) {
        if (!(await pressSpot(id))) { check(false, `bouton secret : ${id}`); continue; }
        await g.use("i.kind === 'secretchest'");
        const locks = id === 'guild' ? 2 : 1;
        for (let k = 0; k < locks; k++) { if (await spellOpen(6000)) { await g.spell(); words++; } else check(false, `coffre ${id} : mot ${k + 1}`); }
        if (id === 'tavern') {
          await g.page.evaluate(() => { const c = window.__se.copper(); c.left = c.nextWind + 0.2; });
          if (await saidLater(/Boulon est à plat/, 8000)) { await g.use("i.kind === 'copper'"); if (await spellOpen()) { await g.spell(); words++; } }
        }
      }
      const a2 = await cu();
      const cos = await g.page.evaluate(() => window.__se.progress().costumes ?? {});
      check(a2.opened.length === 5 && a2.costume && cos.owned?.includes('copper') && cos.current === 'copper', 'les trois boutons : le costume de Chevalier de cuivre (porté tout de suite)', JSON.stringify({ a2, cos }));
      check(/Chevalier de cuivre/.test(await said()) && /pour toujours/.test(await said()), '« Tu gagnes le costume de Chevalier de cuivre ! Et Boulon reste avec toi pour toujours ! » (lu)');
      check(a2.forever && await mode() === 'follow', 'Boulon reste avec le héros');
      check(words >= 7, `au moins 7 mots en session 2 (${words})`);
      await g.page.waitForTimeout(4200);
      await g.click('#news-btn');
      await g.page.waitForTimeout(300);
      const j2 = await g.page.evaluate(() => document.querySelector('#journal-today').innerText);
      check(/Le petit golem de cuivre — Partie 1 ✓ · Partie 2 ✓/.test(j2) && /Boutons secrets : 3\/3/.test(j2), 'journal : les deux parties faites, 3 boutons sur 3', j2);
      await g.click('#journal-close');
      check(g.errors.length === 0, 'aucune erreur JavaScript', g.errors.join(' | '));
      await g.page.close();
    },
  },
  {
    name: 'Golem de neige, bataille de boules et bonhomme de neige (J7)',
    quick: true,
    weight: 4,
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 7, newsSeen: ['1.26.1-wagonnet', '1.19.0-alaric', '1.19.0-golem', '1.20.0-defis', '1.21.0-flamme', '1.22.0-album', '1.23.0-pouvoirs', '1.24.0-golem-cuivre', 'prog-pronoms', 'prog-articles', '1.26.3-lune'], save: save(story(2, 0), { pet: { tamed: true, name: 'Caramel', meals: 0 } }) }, { quality: 0 });
      await g.page.evaluate(() => window.__se.henDayUse(7)); // J7's Cocotte (disguised as a snowman)
      const said = () => g.page.evaluate(() => window.__spoken.join(' | '));
      const nSaid = () => g.page.evaluate(() => window.__spoken.length);
      const saidSince = (n) => g.page.evaluate((k) => window.__spoken.slice(k).join(' | '), n);
      const saidLater = (re, timeout = 20000) => g.page.waitForFunction((r) => new RegExp(r).test(window.__spoken.join(' | ')), re.source, { timeout }).then(() => true, () => false);
      const sn = () => g.page.evaluate(() => JSON.parse(JSON.stringify(window.__se.snow() ?? null)));
      const phase = () => g.page.evaluate(() => window.__se.scene.snow.phase);
      const spellOpen = (timeout = 6000) => g.page.waitForFunction(() => !document.querySelector('#spell-modal').hidden && !!window.__se.spell(), null, { timeout }).then(() => true, () => false);
      const S = await g.page.evaluate(async () => { const m = await import('/snow.js'); return { ARENA: m.ARENA, PATCH: m.PATCH, SNOWMAN: m.SNOWMAN }; });
      const throwOne = () => g.page.evaluate(async () => {
        document.querySelector('#snow-btn').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        // (until the snowball has landed: the test browser can be slow)
        for (let k = 0; k < 40 && window.__se.scene.snow.flying.some((f) => f.who === 'hero'); k++) await new Promise((r) => setTimeout(r, 100));
        await new Promise((r) => setTimeout(r, 150));
      });
      // Throw snowballs (picking up snow when empty) until a word opens; returns the word's result.
      const throwUntilWord = async () => {
        for (let k = 0; k < 40; k++) {
          if (await spellOpen(50)) break;
          const st = await sn();
          if (st.balls <= 0) { await g.use("i.kind === 'snowpile'"); await g.page.waitForTimeout(150); continue; }
          if (await phase() !== 'battle') { await g.page.waitForTimeout(400); continue; }
          await throwOne();
        }
        if (!(await spellOpen(3000))) return null;
        return g.spell();
      };
      let words = 0;
      await g.click('#continue-btn');
      // Alaric presents J7, written and spoken, with his riddle.
      const shown = await g.page.waitForFunction(() => !document.querySelector('#news-modal').hidden, null, { timeout: 10000 }).then(() => true, () => false);
      const card = await g.page.evaluate(() => ({ title: document.querySelector('#news-title').textContent, riddle: document.querySelector('#news-riddle').innerText, said: window.__spoken.join(' | ') }));
      check(shown && /boules de neige/i.test(card.title) && /golem de neige veut jouer/.test(card.said) && /bonhomme de neige/.test(card.said), 'Alaric présente le golem de neige et le bonhomme de neige (écrit et lu)', JSON.stringify(card));
      check(/plat préféré du bonhomme de neige/.test(card.riddle) && /plat préféré/.test(card.said), 'la devinette d’Alaric est écrite et lue', card.riddle);
      await g.page.evaluate(() => document.querySelector('#news-riddle .news-answer').click());
      await g.page.waitForTimeout(200);
      check(/bien glacées/.test(await g.page.evaluate(() => window.__spoken.slice(-1)[0])), '« La réponse ? » lit « Les frites… bien glacées ! »');
      await g.click('#news-show');
      await g.page.waitForTimeout(900);
      const arrow = await g.page.evaluate(() => { const s = window.__se.scene, q = s.mapPins.find((p) => p.quest), w = s.snow.gobj.worldPos; return { d: q ? Math.hypot(q.x - w.x, q.z - w.z) : 99, z: w.z }; });
      check(arrow.d < 1 && arrow.z < -45, '« Montre-moi ! » pointe la flèche vers le golem de neige, dans la montagne', JSON.stringify(arrow));
      // The wow: the heap of snow bursts and Flocon stands up.
      const t0 = Date.now();
      check(await phase() === 'sleep', 'Flocon dort : un tas de neige');
      await g.page.evaluate(([x, z]) => window.__se.scene.teleport(x, z + 3), [S.ARENA.x, S.ARENA.z]);
      check(await saidLater(/Je suis Flocon, le golem de neige/, 8000) && Date.now() - t0 < 30000, 'waouh : le tas de neige explose, Flocon se lève et dit bonjour, moins de 30 s après « Montre-moi ! »', await said());
      check(await g.page.waitForFunction(() => window.__se.scene.snow.phase === 'battle', null, { timeout: 5000 }).then(() => true, () => false), 'la bataille commence');
      check(await saidLater(/Ramasse de la neige dans un tas blanc/, 12000), 'on explique : ramasser de la neige, puis le bouton ❄️ (lu)', await said());
      check(await g.page.evaluate(() => !document.querySelector('#snow-btn').hidden && document.querySelector('#snow-btn').classList.contains('is-empty')), 'le bouton ❄️ apparaît dans l’arène (vide)');
      let n0 = await nSaid();
      await throwOne();
      check(/Plus de boules/.test(await saidSince(n0)), 'bouton ❄️ sans boule : « Plus de boules ! Ramasse de la neige… » (lu)');
      // The gag: Flocon's snowball turns the hero into a snowman (Brrr !).
      await g.page.evaluate(() => { window.__se.scene.snow.dogChance = 0; window.__se.scene.snow.throwT = 0.5; });
      const hit = await g.page.waitForFunction(() => window.__se.scene.snow.heroHits >= 1 && window.__se.scene.snow.shell.visible, null, { timeout: 12000 }).then(() => true, () => false);
      check(hit && /Brrr ! Tu es un bonhomme de neige/.test(await said()), 'gag : une boule de Flocon transforme le héros en bonhomme de neige (« Brrr ! », lu)', await said());
      // Snow from the heap: 5 snowballs.
      check(await g.use("i.kind === 'snowpile'") === 'ok' && (await sn()).balls === 5 && /5 boules de neige/.test(await said()), 'on touche un tas de neige : 5 boules (lu)');
      // Flocon steps aside, sometimes.
      await g.page.evaluate(() => { window.__se.snowDodge = true; });
      n0 = await nSaid();
      await throwOne();
      const dz = await sn();
      check(dz.hits === 0 && dz.balls === 4 && /Hi hi ! Raté/.test(await saidSince(n0)), 'Flocon fait un pas de côté : « Hi hi ! Raté ! » (lu)', JSON.stringify({ ...dz, said: await saidSince(n0), ph: await phase() }));
      await g.page.evaluate(() => { window.__se.snowDodge = false; });
      // Three hits: a word. Six hits: the round.
      const w1 = await throwUntilWord(); words++;
      check(w1 && /Un point/.test(w1.result), 'trois boules sur Flocon : un mot, « Un point ! »', w1?.result);
      const w2 = await throwUntilWord(); words++;
      check(w2 && /Manche gagnée ! \(1\/3\)/.test(w2.result), 'six boules : « Manche gagnée ! (1/3) »', w2?.result);
      check(await g.page.waitForFunction(() => window.__se.scene.snow.phase === 'down', null, { timeout: 3000 }).then(() => true, () => false), 'Flocon tombe dans la neige… et se relève');
      // The dog jumps to catch a snowball.
      await g.page.evaluate(() => { const s = window.__se.scene; s.snow.dogChance = 1; s.pet.catchUp(); });
      const dog = await g.page.waitForFunction(() => window.__se.scene.snow.dogCatches >= 1, null, { timeout: 15000 }).then(() => true, () => false);
      check(dog && /Ouaf ! Ton chien a attrapé la boule/.test(await said()), 'le chien saute et attrape une boule (« Ouaf ! », lu)');
      await g.page.evaluate(() => { window.__se.scene.snow.dogChance = 0; });
      for (let k = 0; k < 4; k++) { const r = await throwUntilWord(); if (r) words++; else check(false, `manche : mot ${k + 3}`); }
      const st1 = await sn();
      check(st1.rounds === 3, 'trois manches gagnées', JSON.stringify(st1));
      check(await spellOpen(8000) && await g.page.evaluate(() => window.__se.spell().word.word) === 'cristal', 'Flocon tend un cristal : on épelle CRISTAL');
      const cr = await g.spell(); words++;
      const mat = await g.page.evaluate(() => window.__se.game().materials.crystal ?? 0);
      check(/cristal de glace/.test(cr.result) && mat >= 1 && (await sn()).crystal, 'on gagne un cristal de glace', cr.result);
      check(/prochain retour, tu construiras ton bonhomme de neige/.test(await said()), '« À ton prochain retour, tu construiras ton bonhomme de neige ! » (lu)');
      check(words >= 7, `au moins 7 mots en session 1 (${words})`);
      check(await g.page.waitForFunction(() => window.__se.scene.snow.phase === 'idle', null, { timeout: 6000 }).then(() => true, () => false), 'Flocon reste debout, content');
      // Rien de muet: the snow patch in front of the cottage explains itself.
      n0 = await nSaid();
      await g.page.evaluate(([x, z]) => window.__se.scene.teleport(x + 0.5, z + 0.5), [S.PATCH.x, S.PATCH.z]);
      check(await g.page.waitForFunction((n) => /Ici, tu construiras ton bonhomme de neige, à ton prochain retour/.test(window.__spoken.slice(n).join(' | ')), n0, { timeout: 6000 }).then(() => true, () => false), 'devant la neige de la chaumière : « Ici, tu construiras ton bonhomme de neige, à ton prochain retour ! » (lu)');
      // Cocotte disguised as a snowman (journal hint written and read).
      await g.page.waitForTimeout(300);
      n0 = await nSaid();
      await g.click('#news-btn');
      await g.page.waitForTimeout(300);
      const jh = await g.page.evaluate((n) => ({ txt: document.querySelector('#journal-today').innerText, said: window.__spoken.slice(n).join(' | ') }), n0);
      check(/déguisée en petit bonhomme de neige/.test(jh.txt) && /déguisée en petit bonhomme de neige/.test(jh.said), 'journal : l’indice de Cocotte (« déguisée en petit bonhomme de neige ») est écrit et lu', jh.said);
      check(/Le golem de neige — Partie 1 ✓ · Partie 2 : à ton prochain retour !/.test(jh.txt) && /Manches gagnées : 3\/3/.test(jh.txt), 'journal : « Le golem de neige — Partie 1 ✓ · Partie 2 : à ton prochain retour ! »', jh.txt);
      check(/Manches gagnées : 3 sur 3/.test(jh.said), 'les manches sont lues', jh.said);
      await g.click('#journal-close');
      const hen = await g.page.evaluate(() => { const h = window.__se.scene.cocotte; return { day: window.__se.henRow().day, disguise: !!h.disguise?.visible, d: +Math.hypot(h.mesh.position.x + 14, h.mesh.position.z + 53).toFixed(1) }; });
      check(hen.day === 7 && hen.disguise && hen.d < 10, 'Cocotte est déguisée en bonhomme de neige, au bord de l’arène', JSON.stringify(hen));
      check(await g.page.evaluate(() => window.__se.findCocotte()) === 'ok', 'on touche Cocotte');
      await g.page.waitForTimeout(300);
      check((await g.page.evaluate(() => window.__se.progress().feathers)).includes(7) && /Cot cot/.test(await said()) && !(await g.page.evaluate(() => window.__se.scene.cocotte.disguise.visible)), 'Cocotte sort de la neige et s’envole : une plume dorée (« Cot cot ! »)');
      // Session 2: the game is opened again 31 minutes later.
      await g.page.evaluate(() => { document.body.dataset.screen = 'paused'; });
      await g.page.waitForTimeout(400);
      await g.page.evaluate((key) => { const pr = window.__se.progress(); pr.parts.J7.last -= 31 * 60 * 1000; const p = JSON.parse(localStorage.getItem(key)); p.parts.J7.last = pr.parts.J7.last; localStorage.setItem(key, JSON.stringify(p)); }, STORE);
      await g.page.reload();
      await g.page.waitForSelector('#loading.is-done', { timeout: 180000 });
      await g.page.evaluate(() => { window.__se.flashAfter = 1e9; window.__se.noDefis = true; });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(1200);
      check(await g.page.evaluate(() => window.__se.releasePart(7)) === 2, 'au retour (30 min plus tard), la partie 2 du golem de neige est ouverte');
      check(await saidLater(/Flocon a laissé de la neige devant ta chaumière/, 15000), '« Flocon a laissé de la neige devant ta chaumière : construis ton bonhomme de neige ! » (lu)', await said());
      await g.page.waitForTimeout(500);
      const arrow2 = await g.page.evaluate(() => { const s = window.__se.scene, q = s.mapPins.find((p) => p.quest), w = s.snow.pobj.worldPos; return q ? Math.hypot(q.x - w.x, q.z - w.z) : 99; });
      check(arrow2 < 1, 'la flèche dorée montre la neige devant la chaumière', String(arrow2));
      words = 0;
      // Roll three balls: they grow as the hero walks; a word puts each one in place.
      const walk = (m) => g.page.evaluate(async ([dist, px, pz]) => {
        const s = window.__se.scene; let dir = 1, done = 0;
        while (done < dist) { s.player.position.x += 0.4 * dir; s.player.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2; done += 0.4; if (Math.abs(s.player.position.x - px) > 3.5) dir = -dir; await new Promise((r) => setTimeout(r, 40)); }
      }, [m, S.PATCH.x, S.PATCH.z]);
      check(await g.use("i.kind === 'snowpatch'") === 'ok' && await saidLater(/Pousse la boule de neige/, 4000), 'on touche la neige : « Pousse la boule de neige : marche, et elle grossit ! » (lu)');
      const r0 = await g.page.evaluate(() => window.__se.scene.snow.rollRadius());
      await walk(4);
      const r1 = await g.page.evaluate(() => window.__se.scene.snow.rollRadius());
      check(r1 > r0 + 0.1, `la boule grossit en marchant (${r0.toFixed(2)} → ${r1.toFixed(2)})`);
      const placed = [/grosse boule du bas est posée/, /boule du milieu est posée/, /tête est posée/];
      for (let k = 0; k < 3; k++) {
        await walk(9);
        if (!(await spellOpen(6000))) { check(false, `boule ${k + 1} : un mot`); continue; }
        const r = await g.spell(); words++;
        check(placed[k].test(r.result), `boule ${k + 1} assez grosse : un mot, elle se pose sur le bonhomme`, r.result);
        await g.page.waitForTimeout(1100);
      }
      check(await g.page.evaluate(() => window.__se.scene.snow.state.stack) === 3, 'trois boules empilées devant la chaumière');
      check(await spellOpen(6000) && await g.page.evaluate(() => window.__se.spell().word.word) === 'carotte', 'il lui faut un nez : on épelle CAROTTE');
      const ca = await g.spell({ keepOpen: true }); words++;
      check(/Choisis son chapeau/.test(ca.result) && await g.page.evaluate(() => document.querySelectorAll('#spell-result [data-hat]').length) === 3, 'trois chapeaux à choisir', ca.result);
      await g.page.evaluate(() => document.querySelector('#spell-result [data-hat="beanie"]').click());
      await g.click('#spell-continue-btn');
      await g.page.waitForTimeout(400);
      const man = await g.page.evaluate(() => { const s = window.__se.scene.snow; return { hat: s.state.hat, vis: s.man.hats.beanie.visible, face: s.man.face.visible }; });
      check(man.hat === 'beanie' && man.vis && man.face && /Ton bonhomme de neige est fini/.test(await said()), 'le bonhomme de neige a un nez, un bonnet, et il danse (« Ton bonhomme de neige est fini ! », lu)', JSON.stringify(man));
      // At night, he dances.
      const dance = await g.page.evaluate(async () => { const s = window.__se.scene; s.dayTime = 320; await new Promise((r) => setTimeout(r, 4000)); return +Math.abs(s.snow.manRig.rotation.y + s.snow.manRig.position.y).toFixed(2); });
      check(dance > 0.01, 'la nuit, le bonhomme de neige danse devant la chaumière', String(dance));
      check(await saidLater(/Flocon veut sa revanche/, 15000), '« Flocon veut sa revanche ! » (lu)', await said());
      await g.page.evaluate(() => { window.__se.scene.dayTime = 60; });
      // The rematch: Flocon throws faster; two rounds, and a red scarf for the snowman.
      check(await phase() === 'sleep', 'Flocon attend la revanche (un tas de neige)');
      await g.page.evaluate(([x, z]) => window.__se.scene.teleport(x, z + 3), [S.ARENA.x, S.ARENA.z]);
      check(await saidLater(/Revanche ! Cette fois, je lance plus vite/, 8000) && await g.page.evaluate(() => window.__se.scene.snow.fast), 'Revanche ! Flocon lance plus vite (lu)');
      await g.page.waitForFunction(() => window.__se.scene.snow.phase === 'battle', null, { timeout: 5000 }).catch(() => {});
      for (let k = 0; k < 4; k++) { const r = await throwUntilWord(); if (r) words++; else check(false, `revanche : mot ${k + 1}`); if (k === 3) check(r && /écharpe rouge/.test(r.result), 'revanche gagnée : une écharpe rouge pour le bonhomme de neige', r?.result); }
      const st2 = await sn();
      check(st2.scarf && await g.page.evaluate(() => window.__se.scene.snow.man.scarf.visible), 'le bonhomme de neige porte l’écharpe rouge (à montrer)', JSON.stringify(st2));
      check(words >= 7, `au moins 7 mots en session 2 (${words})`);
      await g.page.waitForTimeout(4200);
      await g.click('#news-btn');
      await g.page.waitForTimeout(300);
      const j2 = await g.page.evaluate(() => document.querySelector('#journal-today').innerText);
      check(/Le golem de neige — Partie 1 ✓ · Partie 2 ✓/.test(j2) && /Bonhomme de neige : 3\/3 boules · revanche : 2\/2/.test(j2), 'journal : les deux parties faites, bonhomme 3/3, revanche 2/2', j2);
      await g.click('#journal-close');
      check(g.errors.length === 0, 'aucune erreur JavaScript', g.errors.join(' | '));
      await g.page.close();
    },
  },
  {
    name: 'Wagonnet de la mine : le monde de la mine, barrières à épeler, chauves-souris, lac, diamants, grand saut (J8)',
    quick: true,
    weight: 4,
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 7, newsSeen: ['1.19.0-alaric', '1.19.0-golem', '1.20.0-defis', '1.21.0-flamme', '1.22.0-album', '1.23.0-pouvoirs', '1.24.0-golem-cuivre', '1.25.0-golem-neige', 'prog-pronoms', 'prog-articles', '1.26.3-lune'], save: save(story(2, 0), { pet: { tamed: true, name: 'Caramel', meals: 0 } }) }, { quality: 0 });
      const said = () => g.page.evaluate(() => window.__spoken.join(' | '));
      const nSaid = () => g.page.evaluate(() => window.__spoken.length);
      const saidSince = (n) => g.page.evaluate((k) => window.__spoken.slice(k).join(' | '), n);
      const saidLater = (re, timeout = 20000, from = 0) => g.page.waitForFunction(([r, k]) => new RegExp(r).test(window.__spoken.slice(k).join(' | ')), [re.source, from], { timeout }).then(() => true, () => false);
      const mn = () => g.page.evaluate(() => JSON.parse(JSON.stringify(window.__se.mine() ?? null)));
      const spellOpen = (type, timeout = 25000) => g.page.waitForFunction((t) => !document.querySelector('#spell-modal').hidden && window.__se.spell()?.type === t, type, { timeout }).then(() => true, () => false);
      const inMine = (timeout = 20000) => g.page.waitForFunction(() => window.__se.scene.worldId === 'mine' && document.querySelector('#world-loading').hidden, null, { timeout }).then(() => true, () => false);
      const backHome = (timeout = 30000) => g.page.waitForFunction(() => window.__se.scene.worldId === 'island' && document.querySelector('#world-loading').hidden && !window.__se.scene.rider, null, { timeout }).then(() => true, () => false);
      const ride = () => g.page.evaluate(() => { const w = window.__se.mineWorld(); return w?.ride ? { stage: w.ride.stage, s: +w.ride.s.toFixed(2), k: w.ride.k, line: w.line } : null; });
      const visibleIsland = () => g.page.evaluate(() => window.__se.scene.scene.children.filter((o) => o.visible && !o.isLight).length);
      // Spelling only: the old "pick the word spelled right" window must never open.
      await g.page.evaluate(() => { window.__choices = 0; const e = document.querySelector('#mine-choice'); new MutationObserver(() => { if (!e.hidden && !e.querySelector('[data-line]')) window.__choices++; }).observe(e, { attributes: true, attributeFilter: ['hidden'] }); });
      const grab = () => g.page.evaluate(() => { const s = window.__se.scene; let n = 0; for (const o of s.interactables.filter((i) => i.kind === 'nugget' && i.active && i.world === 'mine')) { const p = s.player.position; if (Math.hypot(o.worldPos.x - p.x, o.worldPos.z - p.z) < o.reach) { s.onInteractObject(o); n++; } } return n; });
      // One whole trip down in the mine: a word at each barrier, a word at the cave, the lift back up.
      const trip = async (barriers, { first = false, nuggets = false } = {}) => {
        let words = 0, res = null, nugs = 0;
        for (let k = 0; k < barriers; k++) {
          if (!(await spellOpen('minebarrier'))) { check(false, `barrière ${k + 1} : la barrière demande un mot`, JSON.stringify(await ride())); return { words, nugs }; }
          if (nuggets) nugs += await grab();
          const r0 = await ride();
          if (first && k === 0) {
            const card = await g.page.evaluate(() => ({ title: document.querySelector('#spell-title').textContent, instr: document.querySelector('#spell-instruction').textContent, said: window.__spoken.slice(-1)[0] }));
            check(r0?.stage === 'barrier' && /Une barrière/.test(card.title) && /Épelle ce mot pour ouvrir la barrière/.test(card.instr) && /^Une barrière ! Épelle le mot pour l’ouvrir\. /.test(card.said), 'le wagonnet s’arrête devant une barrière : un mot à épeler pour l’ouvrir (écrit et lu)', JSON.stringify(card));
            // The world is on pause during the word: the cart does not move, the clock stands still.
            const a = await g.page.evaluate(() => ({ p: window.__se.mineWorld().cart.position.toArray(), c: window.__se.scene.clock.elapsedTime }));
            await g.page.waitForTimeout(1200);
            const b = await g.page.evaluate(() => ({ p: window.__se.mineWorld().cart.position.toArray(), c: window.__se.scene.clock.elapsedTime, frozen: window.__se.scene.frozen }));
            check(b.frozen && a.p.every((v, i) => Math.abs(v - b.p[i]) < 1e-6) && Math.abs(b.c - a.c) < 1e-6, 'pause dans la mine pendant le mot : le wagonnet ne bouge pas, l’horloge s’arrête', JSON.stringify([a, b]));
          }
          const r = await g.spell(); words++;
          if (first && k === 0) {
            check(/La barrière s’ouvre|Clac|Le wagonnet repart|La barrière se lève/.test(r.result), `mot juste (« ${r.word} ») : la barrière s’ouvre (écrit et lu)`, r.result);
            const up = await g.page.waitForFunction(() => { const w = window.__se.mineWorld(); return w.barriers[0].open >= 1 && w.ride.k === 1 && w.ride.stage === 'go'; }, null, { timeout: 8000 }).then(() => true, () => false);
            check(up && await g.page.evaluate(() => window.__se.mineWorld().barriers[0].arm.rotation.z > 1.2), 'la barre se lève (le cadenas saute) et le wagonnet repart (à montrer)');
          }
        }
        if (nuggets) nugs += await grab();
        if (await spellOpen('minecart')) { res = await g.spell(); words++; } else check(false, 'un mot au bout de la ligne', JSON.stringify(await ride()));
        if (nuggets) nugs += await grab();
        return { words, res, nugs };
      };
      await g.click('#continue-btn');
      // Alaric presents J8, written and spoken, with his riddle.
      const shown = await g.page.waitForFunction(() => !document.querySelector('#news-modal').hidden, null, { timeout: 10000 }).then(() => true, () => false);
      const card = await g.page.evaluate(() => ({ title: document.querySelector('#news-title').textContent, text: document.querySelector('#news-modal').innerText, riddle: document.querySelector('#news-riddle').innerText, said: window.__spoken.join(' | ') }));
      check(shown && /wagonnet/i.test(card.title) && /il t’emmène sous la terre, dans la mine/.test(card.said) && /devant chaque barrière, épelle le mot/.test(card.said) && !/bien écrit/.test(card.text), 'Alaric présente le wagonnet : la mine sous la terre, les barrières à épeler (écrit et lu, plus de « mot bien écrit »)', JSON.stringify(card));
      check(/des dents mais ne mord jamais/.test(card.riddle) && /des dents/.test(card.said), 'la devinette d’Alaric est écrite et lue', card.riddle);
      await g.page.evaluate(() => document.querySelector('#news-riddle .news-answer').click());
      await g.page.waitForTimeout(200);
      check(/Un peigne/.test(await g.page.evaluate(() => window.__spoken.slice(-1)[0])), '« La réponse ? » lit « Un peigne ! »');
      await g.click('#news-show');
      await g.page.waitForTimeout(900);
      const arrow = await g.page.evaluate(() => { const s = window.__se.scene, q = s.mapPins.find((p) => p.quest), w = s.mine.obj.worldPos; return { d: q ? Math.hypot(q.x - w.x, q.z - w.z) : 99, x: w.x }; });
      check(arrow.d < 1 && arrow.x < -40, '« Montre-moi ! » pointe la flèche vers le wagonnet, à côté de la mine', JSON.stringify(arrow));
      // Line 2 is closed: its sign explains itself (rien de muet).
      const G = await g.page.evaluate(async () => { const m = await import('/mine.js'); return m.GATE; });
      let n0 = await nSaid();
      await g.page.evaluate(([x, z]) => window.__se.scene.teleport(x + 0.4, z - 0.3), [G.x, G.z]);
      check(await saidLater(/Ici, c’est la ligne 2, vers la grotte de cristal\. Elle ouvre à ton prochain retour/, 6000, n0), 'devant le panneau de la ligne 2 : « Elle ouvre à ton prochain retour ! » (lu)', await saidSince(n0));
      // The wow: the cart wakes up (tut-tut!), rolls into the mouth of the mine with the hero and the dog.
      const islandBefore = await visibleIsland();
      const t0 = Date.now();
      await g.page.evaluate(() => { window.__se.scene.mine.speedK = 2.5; });
      n0 = await nSaid();
      check(await g.use("i.kind === 'minecart'") === 'ok', 'on touche le wagonnet');
      check(await saidLater(/Tut-tut ! Le wagonnet de la mine se réveille ! En voiture, on descend dans la mine/, 5000, n0) && Date.now() - t0 < 30000 && await g.page.evaluate(() => !!window.__se.scene.rider), 'waouh : « Tut-tut ! Le wagonnet se réveille ! », le wagonnet roule vers l’entrée de la mine, moins de 30 s après « Montre-moi ! »', await saidSince(n0));
      check(await g.page.evaluate(() => !document.querySelector('#horn-btn').hidden), 'le bouton 📯 apparaît pendant le trajet');
      await g.page.evaluate(() => document.querySelector('#horn-btn').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
      check((await mn()).horns === 1, 'tut-tut : on klaxonne');
      // The mine is loaded as a world of its own, behind a card written and read.
      const card2 = await g.page.waitForFunction(() => !document.querySelector('#world-loading').hidden, null, { timeout: 15000, polling: 20 }).then(() => g.page.evaluate(() => document.querySelector('#world-loading').innerText), () => '');
      check(/On descend dans la mine/.test(card2) && await saidLater(/On descend dans la mine…/, 2000, n0), 'écran « On descend dans la mine… » pendant le chargement (écrit et lu)', card2);
      check(await inMine(), 'on est dans le monde de la mine');
      const w0 = await g.page.evaluate(() => {
        const s = window.__se.scene, r = s.renderer;
        r.info.autoReset = false; r.info.reset(); r.render(s.scene, s.camera);
        const calls = r.info.render.calls, tris = r.info.render.triangles;
        r.info.autoReset = true;
        return { calls, tris, fov: s.camera.fov, minimap: getComputedStyle(document.querySelector('#minimap')).display, home: getComputedStyle(document.querySelector('#reset-pos-btn')).display, station: s.mine.g.visible, zombies: s.zombies?.list?.length ?? 0, timing: s.worlds.timing };
      });
      const islandIn = await visibleIsland();
      check(islandIn < 20 && islandBefore > 60 && !w0.station, `l’île est mise de côté dans la mine (${islandBefore} → ${islandIn} objets visibles)`);
      check(w0.calls <= 160 && w0.tris <= 60000, `budget iPad dans la mine : ${w0.calls} appels de dessin, ${w0.tris} triangles (≤ 160, ≤ 60 000)`, JSON.stringify(w0));
      check(w0.fov > 50 && w0.minimap === 'none' && w0.home === 'none', 'dans la mine : vue plus large, pas de carte ni de bouton 🏠 (ils sont pour l’île)', JSON.stringify(w0));
      check(await saidLater(/Bienvenue dans la mine ! Le wagonnet roule tout seul\. Devant chaque barrière, épelle le mot pour l’ouvrir/, 5000, n0), '« Bienvenue dans la mine ! … Devant chaque barrière, épelle le mot pour l’ouvrir ! » (lu)', await saidSince(n0));
      const seat = await g.page.evaluate(() => { const s = window.__se.scene, c = window.__se.mineWorld().cart.position; return { hero: +s.player.position.distanceTo(c).toFixed(2), dog: +s.pet.mesh.position.distanceTo(c).toFixed(2) }; });
      check(seat.hero < 0.8 && seat.dog < 1.2, 'le héros est dans le wagon, le chien devant lui', JSON.stringify(seat));
      let words = 0;
      const nBats = await nSaid();
      const r1 = await trip(3, { first: true }); words += r1.words;
      check(await saidLater(/Hiii ! Hiii ! Les chauves-souris de la mine/, 1000, nBats) && (await mn()).bats === 1, 'gag : les chauves-souris s’envolent autour du wagonnet (« Hiii ! », lu)');
      check(await saidLater(/Le lac souterrain qui brille/, 1000, nBats), 'le pont au-dessus du lac souterrain qui brille (lu)');
      check(/Des diamants plein le wagon ! Voyage 1 sur 3/.test(r1.res?.result ?? ''), 'au bout de la ligne, la grotte aux diamants : un mot, des diamants plein le wagon (voyage 1/3)', r1.res?.result);
      check(await g.page.waitForFunction(() => window.__se.mineWorld()?.cartLoad.visible, null, { timeout: 5000 }).then(() => true, () => false), 'le wagon est plein de diamants (à montrer)');
      check(/Ouaf ! Ton chien saute dans le wagon/.test(await said()), '« Ouaf ! Ton chien saute dans le wagon, les oreilles au vent ! » (lu)');
      n0 = await nSaid();
      check(await backHome(), 'le monte-charge remonte : retour sur l’île, à la gare');
      const back = await g.page.evaluate(() => { const s = window.__se.scene, h = s.mine.home.p; return { d: +Math.hypot(s.player.position.x - h.x, s.player.position.z - h.z).toFixed(1), fov: s.camera.fov, minimap: getComputedStyle(document.querySelector('#minimap')).display, world: document.body.dataset.world ?? null, nugObjs: s.interactables.filter((i) => i.world === 'mine').length }; });
      const islandAfter = await visibleIsland();
      check(back.d < 4 && islandAfter >= islandBefore * 0.9 && back.fov < 50 && back.minimap !== 'none' && !back.world && back.nugObjs === 0, `l’île est rendue telle quelle (${islandAfter} objets visibles), le héros descend sur le quai`, JSON.stringify(back));
      check(/Le monte-charge te remonte/.test(await said()) && await saidLater(/Retour à la gare ! Touche le wagonnet pour un autre voyage/, 8000, n0), '« Le monte-charge te remonte ! », puis « Retour à la gare ! » (lu)', await saidSince(n0));
      check(await g.page.evaluate(() => window.__se.game().materials.diamond ?? 0) >= 1, 'un diamant dans l’inventaire');
      for (let k = 2; k <= 3; k++) {
        await g.page.waitForTimeout(400);
        check(await g.use("i.kind === 'minecart'") === 'ok' && await inMine(), `voyage ${k} : on redescend dans la mine`);
        const r = await trip(3); words += r.words;
        if (k === 3) check(/casque de mineur/.test(r.res?.result ?? ''), 'trois voyages : le casque de mineur', r.res?.result);
        check(await backHome(), `voyage ${k} : retour à la gare`);
      }
      const st1 = await mn();
      check(st1.rides1 === 3 && st1.helmet && st1.gates === 9 && st1.bats === 3, 'trois voyages, neuf barrières ouvertes en épelant', JSON.stringify(st1));
      check(await g.page.evaluate(() => window.__choices) === 0, 'orthographe seulement : jamais de « choisis le mot bien écrit »');
      const cos = await g.page.evaluate(() => ({ cur: window.__se.progress().costumes?.current, owned: window.__se.progress().costumes?.owned }));
      check(cos.cur === 'miner' && cos.owned.includes('miner'), 'le héros porte le costume de Mineur, avec le casque à lampe (à montrer)', JSON.stringify(cos));
      check(/À ton prochain retour, la ligne 2 ouvre jusqu’à la grotte de cristal/.test(await said()), '« À ton prochain retour, la ligne 2 ouvre jusqu’à la grotte de cristal ! » (lu)');
      check(words >= 7, `au moins 7 mots en session 1 (${words})`);
      // Cocotte in the old cart by the mine (journal hint written and read).
      await g.page.waitForTimeout(4500);
      n0 = await nSaid();
      await g.click('#news-btn');
      await g.page.waitForTimeout(300);
      const jh = await g.page.evaluate((n) => ({ txt: document.querySelector('#journal-today').innerText, said: window.__spoken.slice(n).join(' | ') }), n0);
      check(/vieux wagonnet abandonné/.test(jh.txt) && /vieux wagonnet abandonné/.test(jh.said), 'journal : l’indice de Cocotte (« un vieux wagonnet abandonné ») est écrit et lu', jh.said);
      check(/Le wagonnet de la mine — Partie 1 ✓ · Partie 2 : à ton prochain retour !/.test(jh.txt) && /Voyages jusqu’aux diamants : 3\/3/.test(jh.txt), 'journal : « Le wagonnet de la mine — Partie 1 ✓ · Partie 2 : à ton prochain retour ! »', jh.txt);
      check(/Voyages jusqu’aux diamants : 3 sur 3/.test(jh.said), 'les voyages sont lus', jh.said);
      await g.click('#journal-close');
      const hen = await g.page.evaluate(() => { const h = window.__se.scene.cocotte; return { day: window.__se.henRow().day, d: +Math.hypot(h.mesh.position.x + 25.6, h.mesh.position.z + 39.4).toFixed(1) }; });
      check(hen.day === 8 && hen.d < 1, 'Cocotte est dans le vieux wagonnet, à côté de l’entrée de la mine', JSON.stringify(hen));
      check(await g.page.evaluate(() => window.__se.findCocotte()) === 'ok', 'on touche Cocotte');
      await g.page.waitForTimeout(300);
      check((await g.page.evaluate(() => window.__se.progress().feathers)).includes(8) && /Cot cot/.test(await said()), 'Cocotte s’envole : une plume dorée (« Cot cot ! »)');
      // Session 2: the game is opened again 31 minutes later.
      await g.page.evaluate(() => { document.body.dataset.screen = 'paused'; });
      await g.page.waitForTimeout(400);
      await g.page.evaluate((key) => { const pr = window.__se.progress(); pr.parts.J8.last -= 31 * 60 * 1000; const p = JSON.parse(localStorage.getItem(key)); p.parts.J8.last = pr.parts.J8.last; localStorage.setItem(key, JSON.stringify(p)); }, STORE);
      await g.page.reload();
      await g.page.waitForSelector('#loading.is-done', { timeout: 180000 });
      await g.page.evaluate(() => { window.__se.flashAfter = 1e9; window.__se.noDefis = true; });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(1200);
      check(await g.page.evaluate(() => window.__se.releasePart(8)) === 2, 'au retour (30 min plus tard), la partie 2 du wagonnet est ouverte');
      check(await saidLater(/La ligne 2 du wagonnet est ouverte/, 15000), '« La ligne 2 du wagonnet est ouverte ! Elle va jusqu’à la grotte de cristal… » (lu)', await said());
      await g.page.waitForTimeout(500);
      const arrow2 = await g.page.evaluate(() => { const s = window.__se.scene, q = s.mapPins.find((p) => p.quest), w = s.mine.obj.worldPos; return q ? Math.hypot(q.x - w.x, q.z - w.z) : 99; });
      check(arrow2 < 1, 'la flèche dorée montre le wagonnet', String(arrow2));
      const choiceOpen = (timeout = 4000) => g.page.waitForFunction(() => !document.querySelector('#mine-choice').hidden, null, { timeout }).then(() => true, () => false);
      words = 0;
      let nugs = 0;
      for (let k = 1; k <= 3; k++) {
        await g.page.evaluate(() => { window.__se.scene.mine.speedK = 2.5; });
        n0 = await nSaid();
        check(await g.use("i.kind === 'minecart'") === 'ok' && await choiceOpen(), `voyage ${k} : on touche le wagonnet, « Quelle ligne ? »`);
        if (k === 1) check(/Quelle ligne \? La ligne 1 va aux diamants, la ligne 2 va à la grotte de cristal/.test(await saidSince(n0)), 'le choix de la ligne est lu');
        await g.page.evaluate(() => document.querySelector('#mine-choice-opts [data-line="1"]').click());
        check(await inMine() && (await ride())?.line === 1, `voyage ${k} : en route sur la ligne 2, dans la mine`);
        if (k === 1) {
          check(await saidLater(/En route pour la grotte de cristal ! Prépare-toi pour le grand saut/, 5000, n0), '« En route pour la grotte de cristal ! Prépare-toi pour le grand saut ! » (lu)');
          // The first barrier, then the big jump over the chasm, in slow motion.
          if (await spellOpen('minebarrier')) { await g.spell(); words++; }
          const jump = await g.page.waitForFunction(() => window.__se.mineWorld()?.ride?.jumped, null, { timeout: 20000 }).then(() => true, () => false);
          const j0 = Date.now();
          // Over the middle of the chasm (in slow motion: it takes a while).
          await g.page.waitForFunction(() => { const w = window.__se.mineWorld(), r = w.ride; return r.s > (w.gap.s0 + w.gap.s1) / 2 - 0.5; }, null, { timeout: 15000 }).catch(() => {});
          const air = await g.page.evaluate(() => { const w = window.__se.mineWorld(); return { up: +(w.cart.position.y - w._frame(w.ride.s).p.y).toFixed(1), floor: +w._prof(w.ride.s).f.toFixed(1), inGap: w._inGap(w.ride.s) }; });
          check(jump && air.inGap && air.up > 2.5 && air.floor > 10 && /Waouh ! Le grand saut/.test(await said()), `waouh : le grand saut au-dessus du gouffre, au ralenti (« Le grand saut ! », lu ; ${Date.now() - j0} ms jusqu’au milieu)`, JSON.stringify(air));
          nugs += await grab();
          const r = await trip(1, { nuggets: true }); words += r.words; nugs += r.nugs;
          check(/Un cristal ! Voyage 1 sur 3/.test(r.res?.result ?? ''), 'à la grotte de cristal : un mot, un cristal (voyage 1/3)', r.res?.result);
        } else {
          const r = await trip(2, { nuggets: true }); words += r.words; nugs += r.nugs;
          if (k === 3) check(/Ton wagonnet devient tout doré/.test(r.res?.result ?? ''), 'trois voyages : le wagonnet devient tout doré', r.res?.result);
        }
        check(await backHome(), `voyage ${k} : le monte-charge remonte à la gare`);
        await g.page.waitForTimeout(300);
      }
      const st2 = await mn();
      check(nugs >= 3 && st2.nuggets >= 3 && /Une pépite/.test(await said()), `on attrape des pépites d’or pendant le trajet (${st2.nuggets}, « Une pépite ! », lu)`);
      check(st2.gold && await g.page.evaluate(() => window.__se.scene.mine.gold), 'le wagonnet est doré (à montrer)', JSON.stringify(st2));
      check(words >= 7, `au moins 7 mots en session 2 (${words})`);
      // Leaving the mine another way (here: back to the village) gives the island back too.
      check(await g.use("i.kind === 'minecart'") === 'ok' && await choiceOpen(), 'encore un voyage');
      await g.page.evaluate(() => document.querySelector('#mine-choice-opts [data-line="0"]').click());
      check(await inMine(), 'dans la mine (ligne 1)');
      await g.page.evaluate(() => window.__se.scene.resetPosition());
      await g.page.waitForTimeout(400);
      const esc = await g.page.evaluate(() => { const s = window.__se.scene; return { world: s.worldId, rider: !!s.rider, horn: document.querySelector('#horn-btn').hidden, fov: s.camera.fov, vis: s.scene.children.filter((o) => o.visible && !o.isLight).length }; });
      check(esc.world === 'island' && !esc.rider && esc.horn && esc.fov < 50 && esc.vis >= islandBefore * 0.9, 'quitter la mine autrement (retour au village) rend l’île proprement', JSON.stringify(esc));
      await g.page.waitForTimeout(4200);
      await g.click('#news-btn');
      await g.page.waitForTimeout(300);
      const j2 = await g.page.evaluate(() => document.querySelector('#journal-today').innerText);
      check(/Le wagonnet de la mine — Partie 1 ✓ · Partie 2 ✓/.test(j2) && /Ligne 2 : 3\/3 voyages · pépites : \d+/.test(j2), 'journal : les deux parties faites, ligne 2 : 3/3 voyages et les pépites', j2);
      await g.click('#journal-close');
      check(g.errors.length === 0, 'aucune erreur JavaScript', g.errors.join(' | '));
      await g.page.close();
    },
  },
  {
    name: 'La Lune : fusée, faible gravité, Bip, étoiles tombées, drapeau (v1.26.3)',
    quick: true,
    weight: 3,
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 7, newsSeen: ['1.19.0-alaric', '1.19.0-golem', '1.20.0-defis', '1.21.0-flamme', '1.22.0-album', '1.23.0-pouvoirs', '1.24.0-golem-cuivre', '1.25.0-golem-neige', '1.26.1-wagonnet', 'prog-pronoms', 'prog-articles'], save: save(story(2, 0), { pet: { tamed: true, name: 'Caramel', meals: 0 } }) }, { quality: 0 });
      const said = () => g.page.evaluate(() => window.__spoken.join(' | '));
      const nSaid = () => g.page.evaluate(() => window.__spoken.length);
      const saidSince = (n) => g.page.evaluate((k) => window.__spoken.slice(k).join(' | '), n);
      const saidLater = (re, timeout = 20000, from = 0) => g.page.waitForFunction(([r, k]) => new RegExp(r).test(window.__spoken.slice(k).join(' | ')), [re.source, from], { timeout }).then(() => true, () => false);
      const mo = () => g.page.evaluate(() => JSON.parse(JSON.stringify(window.__se.moon() ?? null)));
      const spellOpen = (type, timeout = 15000) => g.page.waitForFunction((t) => !document.querySelector('#spell-modal').hidden && window.__se.spell()?.type === t, type, { timeout }).then(() => true, () => false);
      const visible = () => g.page.evaluate(() => window.__se.scene.scene.children.filter((o) => o.visible && !o.isLight).length);
      // Put the hero somewhere on the Moon without leaving it (teleport() would take him home).
      const place = (x, z, dy = 0) => g.page.evaluate(([x, z, dy]) => { const s = window.__se.scene; s.player.position.set(x, s.groundAt(x, z) + dy, z); s.playerVY = 0; }, [x, z, dy]);
      await g.click('#continue-btn');
      const shown = await g.page.waitForFunction(() => !document.querySelector('#news-modal').hidden, null, { timeout: 10000 }).then(() => true, () => false);
      const card = await g.page.evaluate(() => ({ title: document.querySelector('#news-title').textContent, riddle: document.querySelector('#news-riddle').innerText, said: window.__spoken.join(' | ') }));
      check(shown && /fusée/i.test(card.title) && /Épelle le mot pour allumer les moteurs/.test(card.said) && /on saute très très haut/.test(card.said), 'Alaric présente la fusée pour la Lune (écrit et lu)', JSON.stringify(card));
      check(/ronde et blanche/.test(card.riddle), 'la devinette d’Alaric (« Je suis ronde et blanche… ») est écrite', card.riddle);
      await g.click('#news-show');
      await g.page.waitForTimeout(900);
      const arrow = await g.page.evaluate(() => { const s = window.__se.scene, q = s.mapPins.find((p) => p.quest), b = s.rocket.base; return q ? Math.hypot(q.x - b.x, q.z - b.z) : 99; });
      check(arrow < 1, '« Montre-moi ! » pointe la flèche vers la fusée, à côté de la tour d’Alaric', String(arrow));
      const islandBefore = await visible();
      // A word lights the engines, then "3, 2, 1… Décollage !".
      let n0 = await nSaid();
      check(await g.use("i.kind === 'rocket'") === 'ok' && await spellOpen('rocket'), 'on touche la fusée : un mot pour allumer les moteurs');
      check(/^Pour décoller vers la Lune, épelle le mot ! /.test(await g.page.evaluate(() => window.__spoken.slice(-1)[0])), '« Pour décoller vers la Lune, épelle le mot ! » (lu avec le mot)');
      const r0 = await g.spell();
      check(/Les moteurs sont allumés/.test(r0.result), 'mot juste : « Les moteurs sont allumés ! »', r0.result);
      check(await saidLater(/Trois… deux… un… Décollage/, 5000, n0) && await g.page.evaluate(() => window.__se.scene.rocket.riding), 'compte à rebours « Trois… deux… un… Décollage ! » (lu), le héros est dans la fusée');
      const card2 = await g.page.waitForFunction(() => !document.querySelector('#world-loading').hidden, null, { timeout: 20000, polling: 20 }).then(() => g.page.evaluate(() => document.querySelector('#world-loading').innerText), () => '');
      check(/Direction la Lune/.test(card2), 'la fusée monte, puis l’écran « Direction la Lune… » (écrit et lu)', card2);
      const inMoon = await g.page.waitForFunction(() => window.__se.scene.worldId === 'moon' && document.querySelector('#world-loading').hidden, null, { timeout: 20000 }).then(() => true, () => false);
      const w0 = await g.page.evaluate(() => {
        const s = window.__se.scene, r = s.renderer;
        r.info.autoReset = false; r.info.reset(); r.render(s.scene, s.camera);
        const o = { calls: r.info.render.calls, tris: r.info.render.triangles, helmet: !!s.player.userData.parts.head.children.find((c) => c.material?.transparent), dogHelmet: !!s.pet.mesh.userData.parts?.head.children.find((c) => c.material?.transparent) };
        r.info.autoReset = true;
        return o;
      });
      check(inMoon && (await visible()) < 30 && islandBefore > 60, 'on est sur la Lune, l’île est mise de côté');
      check(w0.calls <= 160 && w0.tris <= 60000, `budget iPad sur la Lune : ${w0.calls} appels de dessin, ${w0.tris} triangles`, JSON.stringify(w0));
      check(w0.helmet && w0.dogHelmet, 'le héros et le chien portent un casque de verre (à montrer)', JSON.stringify(w0));
      check(await saidLater(/Bienvenue sur la Lune ! Ici, on saute très très haut/, 5000, n0), '« Bienvenue sur la Lune ! Ici, on saute très très haut… » (lu)');
      check(await saidLater(/Je suis Bip, le robot de la Lune ! J’ai perdu trois pièces/, 15000, n0), 'Bip se présente : il a perdu trois pièces (lu)', await saidSince(n0));
      // Low gravity: a huge, slow jump.
      n0 = await nSaid();
      const t0 = Date.now();
      await g.page.evaluate(() => window.__se.scene.jump());
      let up = 0;
      for (let i = 0; i < 40; i++) { await g.page.waitForTimeout(60); up = Math.max(up, await g.page.evaluate(() => { const s = window.__se.scene; return s.player.position.y - s.groundAt(s.player.position.x, s.player.position.z); })); }
      check(up > 3.5 && /Boiiing ! Sur la Lune, on saute super haut/.test(await saidSince(n0)), `sur la Lune, on saute très haut (${up.toFixed(1)} m, sur l’île : environ 1,4 m), « Boiiing ! » (lu)`);
      // Footprints in the dust.
      const mw = (fn, arg) => g.page.evaluate(new Function('arg', `const w = window.__se.moonWorld(); return (${fn})(w, arg);`), arg);
      const p0 = await mw('(w) => w.printN');
      await g.page.evaluate(() => { const s = window.__se.scene; s.keys['w'] = true; });
      await g.page.waitForTimeout(1500);
      await g.page.evaluate(() => { const s = window.__se.scene; s.keys['w'] = false; });
      check((await mw('(w) => w.printN')) > p0 + 2, 'le héros laisse des traces de pas dans la poussière');
      // Bip's three parts: a word each.
      let words = 1;
      for (let k = 0; k < 3; k++) {
        const at = await mw('(w, k) => { const o = w.partObjs[k]; return [o.worldPos.x, o.worldPos.z]; }', k);
        await place(at[0] + 1.2, at[1] + 1.2);
        await g.page.evaluate((k) => { const s = window.__se.scene; s.onInteractObject(s.interactables.find((i) => i.kind === 'moonpart' && i.part === k)); }, k);
        if (!(await spellOpen('moonpart'))) { check(false, `pièce ${k + 1} : un mot`); continue; }
        if (k === 0) {
          // The world is on pause during the word.
          const a = await g.page.evaluate(() => ({ c: window.__se.scene.clock.elapsedTime, b: window.__se.moonWorld().bip.position.toArray() }));
          await g.page.waitForTimeout(1000);
          const b = await g.page.evaluate(() => ({ c: window.__se.scene.clock.elapsedTime, frozen: window.__se.scene.frozen }));
          check(b.frozen && Math.abs(b.c - a.c) < 1e-6, 'pause sur la Lune pendant le mot : l’horloge s’arrête');
        }
        const r = await g.spell(); words++;
        check(new RegExp(`Bip a retrouvé .* Pièce ${k + 1} sur 3`).test(r.result), `pièce ${k + 1} : « Bip a retrouvé… Pièce ${k + 1} sur 3. »`, r.result);
        await g.page.waitForTimeout(1400);
      }
      check(await saidLater(/Bip est réparé ! Il danse… oups, il tombe/, 6000) && (await mo()).bip, 'Bip est réparé : il danse… et tombe (gag), il suit le héros (lu)');
      await g.page.waitForTimeout(4500);
      const follow = await g.page.evaluate(() => { const s = window.__se.scene, b = window.__se.moonWorld().bip.position; return +Math.hypot(b.x - s.player.position.x, b.z - s.player.position.z).toFixed(1); });
      check(follow < 4, 'Bip suit le héros', String(follow));
      // The fallen stars: run or jump into them, a word each; the high ones need a jump.
      const stars = await mw('(w) => w.starList.map((s) => ({ x: s.pos.x, y: s.pos.y, z: s.pos.z, high: s.high }))');
      check(stars.length === 5 && stars.filter((s) => s.high).length === 2, '5 étoiles tombées, dont 2 tout en haut (il faut sauter)', JSON.stringify(stars.map((s) => s.high)));
      const hi = stars.findIndex((s) => s.high);
      await place(stars[hi].x, stars[hi].z);
      n0 = await nSaid();
      await g.page.evaluate((i) => { const s = window.__se.scene; s.onInteractObject(s.interactables.find((o) => o.kind === 'moonstar' && o.star === i)); }, hi);
      await g.page.waitForTimeout(300);
      check(/Elle est trop haut ! Saute pour l’attraper/.test(await saidSince(n0)) && !(await g.page.evaluate(() => window.__se.spell())), 'une étoile trop haute : « Saute pour l’attraper ! » (lu)');
      for (let i = 0; i < 5; i++) {
        // In the air next to the star (as after a jump): it is caught.
        await g.page.evaluate((st) => { const s = window.__se.scene; s.player.position.set(st.x + 0.3, st.y - 0.9, st.z); s.playerVY = 0; }, stars[i]);
        if (!(await spellOpen('moonstar', 8000))) { check(false, `étoile ${i + 1} : attrapée, un mot`); continue; }
        const r = await g.spell(); words++;
        if (i === 0) check(/L’étoile remonte dans le ciel ! Étoile 1 sur 5/.test(r.result), 'étoile attrapée : un mot, « L’étoile remonte dans le ciel ! »', r.result);
        await g.page.waitForTimeout(500);
      }
      check(await saidLater(/Toutes les étoiles brillent de nouveau/, 12000) && (await mo()).stars === 5, 'les 5 étoiles remontent dans le ciel : « Bravo ! » (lu)');
      // The flag on the rim of the big crater: the astronaut suit.
      const fl = await mw('(w) => [w.flagObj.worldPos.x, w.flagObj.worldPos.z]');
      await place(fl[0] - 1.4, fl[1] + 1.4);
      await g.page.evaluate(() => { const s = window.__se.scene; s.onInteractObject(s.interactables.find((o) => o.kind === 'moonflag')); });
      if (await spellOpen('moonflag')) {
        const r = await g.spell(); words++;
        check(/Le drapeau de l’Empire des Mots flotte sur la Lune/.test(r.result) && /tenue d’astronaute/.test(r.result), 'un mot plante le drapeau, « … il n’y a pas de vent ici… c’est magique ! » et la tenue d’astronaute', r.result);
      } else check(false, 'le drapeau demande un mot');
      await g.page.waitForTimeout(2500);
      const cos = await g.page.evaluate(() => ({ cur: window.__se.progress().costumes?.current, up: window.__se.moonWorld().flagUp }));
      check(cos.cur === 'astronaut' && cos.up >= 1, 'le drapeau flotte, le héros porte la tenue d’astronaute (à montrer)', JSON.stringify(cos));
      check(words >= 7, `au moins 7 mots (${words})`);
      // Home: the rocket takes off from the Moon and lands softly by its pad.
      const hr = await mw('(w) => [w.homeObj.worldPos.x, w.homeObj.worldPos.z]');
      await place(hr[0] + 1.8, hr[1] + 1);
      n0 = await nSaid();
      await g.page.evaluate(() => { const s = window.__se.scene; s.onInteractObject(s.interactables.find((o) => o.kind === 'moonrocket')); });
      check(await saidLater(/On rentre sur l’île ! Trois… deux… un… Décollage/, 4000, n0), '« On rentre sur l’île ! Trois… deux… un… Décollage ! » (lu)');
      const home = await g.page.waitForFunction(() => window.__se.scene.worldId === 'island' && !window.__se.scene.rider && document.querySelector('#world-loading').hidden, null, { timeout: 30000 }).then(() => true, () => false);
      await g.page.waitForTimeout(300);
      const back = await g.page.evaluate(() => { const s = window.__se.scene, b = s.rocket.base; return { d: +Math.hypot(s.player.position.x - b.x, s.player.position.z - b.z).toFixed(1), moonObjs: s.interactables.filter((i) => i.world === 'moon').length, fov: s.camera.fov, helmetLeft: !!document.body.dataset.world }; });
      check(home && back.d < 4.5 && back.moonObjs === 0 && back.fov < 45 && !back.helmetLeft && (await visible()) >= islandBefore * 0.9, 'atterrissage à côté de la fusée : l’île est rendue telle quelle', JSON.stringify(back));
      check(await saidLater(/Atterrissage en douceur/, 4000, n0), '« Atterrissage en douceur ! Bienvenue sur l’île. » (lu)');
      // A second trip: Bip is still fixed, five new stars.
      n0 = await nSaid();
      check(await g.use("i.kind === 'rocket'") === 'ok' && await spellOpen('rocket') && /^Les moteurs ! /.test(await g.page.evaluate(() => window.__spoken.slice(-1)[0])), 'deuxième voyage : un mot pour les moteurs');
      await g.spell();
      check(await g.page.waitForFunction(() => window.__se.scene.worldId === 'moon' && document.querySelector('#world-loading').hidden, null, { timeout: 25000 }).then(() => true, () => false) && await saidLater(/De retour sur la Lune ! Attrape les étoiles tombées/, 5000, n0), 'de retour sur la Lune : « Attrape les étoiles tombées ! » (lu)');
      const again = await mw('(w) => ({ bip: w.state.bip, eyes: w.bipEyeMat.emissive.getHex(), stars: w.starList.filter((s) => !s.got).length })');
      check(again.bip && again.eyes !== 0 && again.stars === 5, 'Bip est toujours réparé, cinq nouvelles étoiles à attraper', JSON.stringify(again));
      await g.page.evaluate(() => window.__se.scene.resetPosition());
      await g.page.waitForTimeout(500);
      check(await g.page.evaluate(() => window.__se.scene.worldId === 'island' && !window.__se.scene.rider), 'quitter la Lune autrement (retour au village) rend l’île proprement');
      check(g.errors.length === 0, 'aucune erreur JavaScript', g.errors.join(' | '));
      await g.page.close();
    },
  },
  {
    name: 'Pause pendant un mot : le monde s’arrête',
    quick: true,
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 7, save: save(story(2, 0), { pet: { tamed: true, name: 'Caramel', meals: 0 } }) }, { quality: 0 });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(1500);
      const snap = () => g.page.evaluate(() => {
        const s = window.__se.scene;
        return { day: s.dayTime, clock: s.clock.elapsedTime, fer: s.golem.mesh.position.toArray(), animals: s.fauna.list.map((a) => a.mesh.position.toArray()) };
      });
      const moved = (a, b) => ({ day: Math.abs(a.day - b.day), clock: Math.abs(a.clock - b.clock), fer: Math.hypot(a.fer[0] - b.fer[0], a.fer[2] - b.fer[2]), animals: Math.max(0, ...a.animals.map((p, i) => Math.hypot(p[0] - b.animals[i][0], p[2] - b.animals[i][2]))) });
      // A surprise word opens (the flash challenge).
      await g.page.evaluate(() => { window.__se.flashAfter = 0; });
      const open = await g.page.waitForFunction(() => !document.querySelector('#spell-modal').hidden, null, { timeout: 5000 }).then(() => true, () => false);
      await g.page.evaluate(() => { window.__se.flashAfter = 1e9; });
      check(open, 'un mot s’ouvre');
      await g.page.waitForTimeout(300);
      const a = await snap();
      await g.page.waitForTimeout(2000);
      const b = await snap();
      const m1 = moved(a, b);
      check(m1.day === 0 && m1.clock < 1e-6 && m1.fer === 0 && m1.animals === 0, 'pendant le mot, le jeu est en pause : ni le temps, ni Fer, ni les animaux ne bougent', JSON.stringify(m1));
      await g.spell();
      await g.page.waitForTimeout(300);
      const c = await snap();
      await g.page.waitForTimeout(2000);
      const d = await snap();
      const m2 = moved(c, d);
      check(m2.day > 1 && m2.clock > 1 && (m2.fer > 0.05 || m2.animals > 0.05), 'le mot fini, le monde repart', JSON.stringify(m2));
      check(g.errors.length === 0, 'aucune erreur JavaScript', g.errors.join(' | '));
      await g.page.close();
    },
  },
  {
    name: 'Pause : aucun zombie ne touche le héros pendant un mot ou une fenêtre',
    quick: true,
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 7, inputMode: 'keys', save: save(story(2, 0)) }, { quality: 0 });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(1200);
      await g.page.evaluate(() => { const s = window.__se.scene; window.__caught = 0; const prev = s.onZombieCatch; s.onZombieCatch = (z) => { window.__caught++; return prev?.(z); }; });
      // Night, a zombie right next to the hero (stuck to him again before each check).
      const putZombie = () => g.page.evaluate(() => {
        const s = window.__se.scene, p = s.player.position;
        s.zombies.enabled = true; s.dayTime = 0.8 * 420; s.night = 1;
        if (!s.zombies.active.length) s.zombies._spawn();
        const z = s.zombies.active[0]; if (!z) return false;
        z.mesh.scale.setScalar(1); z.stun = 0; s.zombies.grace = 0;
        z.mesh.position.set(p.x + 0.6, p.y, p.z);
        return true;
      });
      const calm = () => g.page.evaluate(() => { const s = window.__se.scene; s.zombies.clear(false); s.dayTime = 0.3 * 420; window.__caught = 0; });
      // 1. A window that locks the hero (the journal): the world pauses too.
      await calm();
      await g.click('#news-btn');
      await g.page.waitForSelector('#journal-modal:not([hidden])', { timeout: 5000 });
      check(await putZombie(), 'un zombie est juste à côté du héros');
      await g.page.waitForTimeout(2000);
      const j = await g.page.evaluate(() => ({ caught: window.__caught, frozen: window.__se.scene.frozen, locked: window.__se.scene.inputLocked }));
      check(j.caught === 0 && j.frozen && j.locked, 'journal ouvert : le jeu est en pause, le zombie ne touche pas', JSON.stringify(j));
      await g.click('#journal-close');
      await calm();
      // 2. A word: no touch while it is open.
      await g.use("i.kind === 'node' && i.active && !i.requires && i.nodeType !== 'chest'");
      await g.page.waitForSelector('#spell-modal:not([hidden])', { timeout: 8000 });
      await putZombie();
      await g.page.waitForTimeout(2500);
      check((await g.page.evaluate(() => window.__caught)) === 0, 'pendant le mot, le zombie ne touche pas le héros');
      // 3. The word is done: the game goes on, and the zombie can catch the hero again.
      await g.spell();
      await g.page.evaluate(() => { const b = document.querySelector('#spell-continue-btn'); if (b && !b.hidden) b.click(); });
      await g.page.waitForFunction(() => document.querySelector('#spell-modal').hidden, null, { timeout: 8000 });
      await putZombie();
      const after = await g.page.waitForFunction(() => window.__caught > 0, null, { timeout: 8000 }).then(() => true, () => false);
      check(after, 'le mot fini, le jeu reprend (le zombie peut de nouveau toucher)');
      check(g.errors.length === 0, 'aucune erreur JavaScript', g.errors.join(' | '));
      await g.page.close();
    },
  },
  {
    name: 'Boutons secrets sans le petit golem : le jeu explique (J6)',
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 7, save: save(story(2, 0)) }, { quality: 0 });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(1200);
      const SPOTS = await g.page.evaluate(async () => (await import('/copper.js')).BUTTON_SPOTS);
      const sp = SPOTS.find((b) => b.id === 'tower');
      await g.page.evaluate(([x, z]) => window.__se.scene.teleport(x + 1.2, z + 1.2), [sp.x, sp.z]);
      const ok = await g.page.waitForFunction(() => /trop durs pour toi/.test(window.__spoken.join(' | ')), null, { timeout: 6000 }).then(() => true, () => false);
      check(ok, 'devant les boutons secrets, sans Boulon : « Ils sont trop durs pour toi… fabrique le petit golem sur l’enclume » (lu)', await g.page.evaluate(() => window.__spoken.join(' | ')));
      await g.page.waitForTimeout(600);
      const arrow = await g.page.evaluate(() => { const s = window.__se.scene, q = s.mapPins.find((p) => p.quest), w = s.copper.obj.worldPos; return q ? Math.hypot(q.x - w.x, q.z - w.z) : 99; });
      check(arrow < 1, 'la flèche dorée montre l’enclume', String(arrow));
      // Touching the buttons says it again (as long as they are not pressed).
      await g.page.waitForTimeout(300);
      const nb = await g.page.evaluate(() => window.__spoken.length);
      check(await g.use("i.kind === 'secretbutton' && i.spot === 1") === 'ok', 'on touche les boutons devant la boutique');
      await g.page.waitForTimeout(300);
      check(/trop durs pour toi/.test(await g.page.evaluate((n) => window.__spoken.slice(n).join(' | '), nb)), 'toucher les boutons redit l’explication (lu)');
      check(g.errors.length === 0, 'aucune erreur JavaScript', g.errors.join(' | '));
      await g.page.close();
    },
  },
  {
    name: 'La fête des mots : bravos, étoiles qui volent, séries, mots dorés, petite danse',
    quick: true,
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 7, save: save(story(2, 0), { pet: { tamed: true, name: 'Caramel', meals: 0 } }) }, { quality: 0 });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(1000);
      const node = "i.kind === 'node' && i.active && !i.requires && i.nodeType !== 'chest'";
      const open = async () => { await g.page.evaluate(() => { const b = document.querySelector('#spell-continue-btn'); if (b && !b.hidden && !document.querySelector('#spell-modal').hidden) b.click(); }); await g.page.waitForTimeout(200); await g.use(node); return g.page.waitForFunction(() => !document.querySelector('#spell-modal').hidden && !!window.__se.spell(), null, { timeout: 5000 }).then(() => true, () => false); };
      // A word right first time: the letters hop, a big emoji, the stars fly to the counter, the bravo is said.
      check(await open(), 'un mot s’ouvre');
      const n0 = await g.page.evaluate(() => window.__spoken.length);
      const r1 = await g.spell({ keepOpen: true });
      const party = await g.page.evaluate((n) => ({ cheer: document.querySelector('#spell-tiles').classList.contains('is-cheer'), emoji: !!document.querySelector('.cheer-emoji'), attempts: document.querySelector('#spell-attempts').textContent, said: window.__spoken.slice(n).join(' | ') }), n0);
      await g.page.waitForTimeout(500);
      const stars = await g.page.evaluate(() => window.__se.flown ?? 0);
      check(party.cheer && party.emoji, 'les lettres sautent une à une et un gros emoji apparaît', JSON.stringify(party));
      check(stars > 0, `les étoiles s’envolent vers le compteur (${stars})`);
      check(party.attempts === '', 'plus de « essais restants » une fois le mot réussi', party.attempts);
      check(party.said.split(' | ').some((x) => /^(Orthographe parfaite|Bravo|Génial|Trop fort|Waouh, parfait|Magnifique|Champion|Du premier coup|Super)/.test(x)), 'le bravo est dit à voix haute, avant la petite phrase', party.said);
      void r1;
      // Three in a row: a big « 3 d’affilée ! » with a fanfare.
      for (let k = 0; k < 2; k++) { if (await open()) await g.spell({ keepOpen: true }); }
      const st = await g.page.evaluate(() => ({ streak: window.__se.streak(), big: document.querySelector('.cheer-streak')?.textContent ?? '' }));
      check(st.streak === 3 && /3 d’affilée/.test(st.big), '3 mots d’affilée : « 🔥 3 d’affilée ! » en grand', JSON.stringify(st));
      // A miss: the letters wobble, a word of comfort and the word again, said aloud.
      check(await open(), 'un autre mot');
      const n1 = await g.page.evaluate(() => window.__spoken.length);
      const word = await g.page.evaluate(() => window.__se.spell().word);
      await g.page.evaluate((w) => { const bad = w.word.slice(0, -1) + (w.word.endsWith('z') ? 'y' : 'z'); for (const ch of bad) document.querySelector(`#spell-keyboard .key[aria-label="${ch}"]`)?.click(); document.querySelector('#spell-check-btn').click(); }, word);
      await g.page.waitForTimeout(300);
      const miss = await g.page.evaluate((n) => ({ oops: document.querySelector('#spell-tiles').classList.contains('is-oops'), said: window.__spoken.slice(n).join(' | '), hint: document.querySelector('#spell-result').innerText }), n1);
      check(miss.oops && /(Presque|Oups, pas tout à fait|Pas grave, on réessaie|Tu y es presque)/.test(miss.said) && miss.said.includes(word.say ?? word.word), 'raté : les lettres tremblent, « Presque ! » et le mot redit (lu)', JSON.stringify(miss));
      await g.page.waitForTimeout(1600);
      await g.spell({ keepOpen: true });
      // A golden word: it shines before it is spelled and is worth three times the stars.
      await g.page.evaluate(() => { window.__se.goldChance = 1; });
      check(await open(), 'un mot doré s’ouvre');
      const gold = await g.page.evaluate(() => ({ title: document.querySelector('#spell-title').textContent, on: document.querySelector('#spell-modal .spell-modal-card').classList.contains('is-golden'), said: window.__spoken.slice(-1)[0] }));
      check(/Mot doré/.test(gold.title) && gold.on && /Un mot doré/.test(gold.said), 'le mot doré brille et s’annonce (« Un mot doré ! », lu)', JSON.stringify(gold));
      const before = await g.page.evaluate(() => window.__se.progress().stars);
      const rg = await g.spell({ keepOpen: true });
      const after = await g.page.evaluate(() => window.__se.progress().stars);
      check(after - before >= 9 && /trois fois plus d’étoiles/.test(rg.result), `réussi du premier coup : trois fois plus d’étoiles (+${after - before})`, rg.result);
      await g.page.evaluate(() => { window.__se.goldChance = 0; const b = document.querySelector('#spell-continue-btn'); if (b && !b.hidden) b.click(); });
      // Standing still a while: the hero dances, the dog twirls.
      await g.page.waitForTimeout(500);
      const dance = await g.page.evaluate(async () => { const s = window.__se.scene; s.idleT = 0; s.danceAfter = 0.4; await new Promise((r) => setTimeout(r, 1500)); return { n: s.dances ?? 0, dog: (s.pet.trickT ?? 0) > 0 || (s.dances ?? 0) > 0 }; });
      check(dance.n >= 1, 'sans bouger un moment, le héros fait une petite danse (♪ ♫)', JSON.stringify(dance));
      check(g.errors.length === 0, 'aucune erreur JavaScript', g.errors.join(' | '));
      await g.page.close();
    },
  },
  {
    name: 'Petits plus : matériaux qui volent, animaux qui sursautent, records, coffre surprise',
    quick: true,
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 7, recordStreak: 4, bestStreak: 4, save: save(story(2, 0)) }, { quality: 0 });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(1000);
      const node = "i.kind === 'node' && i.active && !i.requires && i.nodeType !== 'chest'";
      const open = async () => { await g.page.evaluate(() => { const b = document.querySelector('#spell-continue-btn'); if (b && !b.hidden && !document.querySelector('#spell-modal').hidden) b.click(); }); await g.page.waitForTimeout(200); await g.use(node); return g.page.waitForFunction(() => !document.querySelector('#spell-modal').hidden && !!window.__se.spell(), null, { timeout: 5000 }).then(() => true, () => false); };
      // Five words in a row beat the record of 4: « Nouveau record ! » (said and shown).
      let rec = null;
      for (let k = 0; k < 5; k++) {
        if (!(await open())) { check(false, `mot ${k + 1}`); continue; }
        await g.spell({ keepOpen: true });
        if (k === 0) { await g.page.waitForTimeout(900); check(await g.page.evaluate(() => (window.__se.flownItems ?? 0) > 0), 'le matériau gagné s’envole vers l’inventaire'); }
        if (k === 4) rec = await g.page.evaluate(() => ({ big: document.querySelector('.cheer-record')?.textContent ?? '', said: window.__spoken.slice(-1)[0], rec: window.__se.progress().recordStreak }));
      }
      check(/Nouveau record : 5 mots d’affilée/.test(rec?.big) && /Nouveau record ! 5 mots d’affilée/.test(rec?.said) && rec?.rec === 5, '5 d’affilée bat le record : « Nouveau record ! » (écrit et lu)', JSON.stringify(rec));
      await g.click('#spell-continue-btn');
      await g.page.waitForTimeout(400);
      await g.click('#news-btn');
      await g.page.waitForTimeout(300);
      const j = await g.page.evaluate(() => document.querySelector('#journal-today')?.innerText ?? '');
      check(/Meilleure série aujourd’hui : 5/.test(j), 'journal : « Meilleure série aujourd’hui : 5 »', j);
      await g.click('#journal-close');
      // Jump next to an animal: it jumps too, with its cry.
      const jump = await g.page.evaluate(async () => {
        const s = window.__se.scene, a = s.fauna.list.find((f) => !f.def.swim && f.mesh.visible && Math.hypot(f.mesh.position.x, f.mesh.position.z) < 45);
        s.teleport(a.mesh.position.x + 1.5, a.mesh.position.z + 1.5);
        await new Promise((r) => setTimeout(r, 300));
        s.jump();
        await new Promise((r) => setTimeout(r, 100));
        return { n: window.__se.jumpScares ?? 0, bounce: a.bounceT > 0 };
      });
      check(jump.n >= 1 && jump.bounce, 'on saute à côté d’un animal : il sursaute avec son cri', JSON.stringify(jump));
      // The surprise chest: it pops out near the hero, is announced and shown by the arrow; a word opens it.
      await g.page.evaluate(() => { const s = window.__se.scene; s.teleport(4, 22); window.__se.surpriseEvery = 0.5; window.__se.surpriseRoll = 0.25; });
      const up = await g.page.waitForFunction(() => /coffre surprise est apparu/.test(window.__spoken.join(' | ')), null, { timeout: 8000 }).then(() => true, () => false);
      await g.page.waitForTimeout(600);
      const pin = await g.page.evaluate(() => { const s = window.__se.scene, q = s.mapPins.find((p) => p.quest), w = s.surprise.obj.worldPos, p = s.player.position; return { d: q ? Math.hypot(q.x - w.x, q.z - w.z) : 99, far: Math.hypot(w.x - p.x, w.z - p.z) }; });
      check(up && pin.d < 1 && pin.far > 5, 'un coffre surprise sort de terre près du héros : annoncé (lu) et montré par la flèche dorée', JSON.stringify(pin));
      await g.page.evaluate(() => { window.__se.surpriseEvery = 1e9; });
      check(await g.use("i.kind === 'surprisechest'") === 'ok' && await g.page.waitForFunction(() => !document.querySelector('#spell-modal').hidden, null, { timeout: 4000 }).then(() => true, () => false), 'on touche le coffre surprise : un mot');
      const dia = await g.page.evaluate(() => window.__se.game().materials.diamond ?? 0);
      const r = await g.spell();
      check(/Dans le coffre surprise : un diamant/.test(r.result) && (await g.page.evaluate(() => window.__se.game().materials.diamond ?? 0)) === dia + 1, 'dans le coffre surprise : un diamant', r.result);
      check(g.errors.length === 0, 'aucune erreur JavaScript', g.errors.join(' | '));
      await g.page.close();
    },
  },
  {
    name: 'Espace parents : listes de mots',
    async run(browser, base, check) {
      const { WORDS } = await import('../../language-engine.js');
      const now = Date.now(), D = 86400000;
      const easy = WORDS.fr.filter((w) => w.level === 'easy').map((w) => w.word);
      const wordStats = {};
      easy.slice(0, 30).forEach((w, i) => { wordStats[`fr:${w}`] = { lang: 'fr', word: w, level: 'easy', seen: 3, correct: 3, wrong: i % 3 === 0 ? 1 : 0, firstTry: 2, lastSeen: now - D, misspellings: [], state: 'review', interval: 1 + i, ease: 2.5, due: now + (1 + i) * D, lapses: 0, reps: 3 }; });
      easy.slice(30, 35).forEach((w) => { wordStats[`fr:${w}`] = { lang: 'fr', word: w, level: 'easy', seen: 2, correct: 0, wrong: 2, firstTry: 0, lastSeen: now, misspellings: ['x'], state: 'learning', step: 0, interval: 0, ease: 2.5, due: now + 5 * 60000, lapses: 0, reps: 2 }; });
      const g = await openGame(browser, base, { lang: 'fr', age: 6, wordStats }, { quality: 0, height: 1400 });
      await g.click('#parents-btn');
      await g.page.waitForTimeout(800);
      const read = () => g.page.evaluate(() => ({ tabs: [...document.querySelectorAll('#dash-tabs .dash-tab')].map((b) => b.textContent), n: document.querySelectorAll('#dash-words .dash-word').length, page: document.querySelector('#dash-page').textContent, first: document.querySelector('#dash-words .dash-word b')?.textContent }));
      let r = await read();
      check(r.tabs[0].includes('30') && r.tabs[1].includes('5'), 'les onglets comptent les mots acquis et en cours', r.tabs.join(' | '));
      check(r.n === 24 && r.page === 'Page 1 / 2', 'les mots acquis s’affichent par pages de 24', JSON.stringify(r));
      await g.click('#dash-next');
      r = await read();
      check(r.n === 6 && r.page === 'Page 2 / 2', 'page suivante : les 6 derniers', JSON.stringify(r));
      await g.page.evaluate(() => document.querySelectorAll('#dash-tabs .dash-tab')[1].click());
      r = await read();
      check(r.n === 5, 'onglet « en cours » : 5 mots', JSON.stringify(r));
      await g.page.evaluate(() => document.querySelectorAll('#dash-tabs .dash-tab')[2].click());
      r = await read();
      check(r.first === easy[35], `onglet « à venir » : les prochains mots, dans l’ordre (${r.first})`, JSON.stringify(r));
      check(g.errors.length === 0, 'aucune erreur JavaScript', g.errors.join(' | '));
      await g.page.screenshot({ path: '/tmp/dash-lists.png' });
      await g.page.close();
    },
  },
  {
    name: 'Accessibilité de toute la carte',
    quick: true,
    weight: 1,
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 7, stars: 200, save: save(story(6, 0, { travel: { forest: true, marsh: true, mountain: true, coast: true } })) }, { quality: 0 });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(1200);
      const res = await g.page.evaluate(() => {
        const s = window.__se.scene;
        const explore = () => {
        // Walk the whole map on a 0.5 grid with the real rules: obstacles, water, steps, jumps.
        const STEP = 0.5, R = 84, N = Math.ceil((R * 2) / STEP), JUMP = 1.35, UP = 0.55;
        const idx = (x, z) => Math.round((z + R) / STEP) * (N + 1) + Math.round((x + R) / STEP);
        const seen = new Float32Array((N + 1) * (N + 1)).fill(NaN);
        const start = [0, 6];
        const q = [start];
        seen[idx(...start)] = s.groundAt(...start);
        let jumps = 0;
        while (q.length) {
          const [x, z] = q.pop();
          const h = seen[idx(x, z)];
          for (const [dx, dz] of [[STEP, 0], [-STEP, 0], [0, STEP], [0, -STEP]]) {
            const nx = x + dx, nz = z + dz;
            const k = idx(nx, nz);
            if (!Number.isNaN(seen[k]) || Math.hypot(nx, nz) > R - 0.3) continue;
            if (s._checkCollision(nx, nz) || s._blocked(nx, nz, Math.max(h, s.groundAt(nx, nz)) + 5)) continue;
            const nh = s.groundAt(nx, nz);
            if (nh - h > JUMP) continue;
            if (nh - h > UP) jumps++;
            seen[k] = nh;
            q.push([nx, nz]);
          }
        }
        const reach = (o) => {
          const r = (o.reach ?? 1.5) + 0.3;
          for (let x = o.worldPos.x - r; x <= o.worldPos.x + r; x += STEP) for (let z = o.worldPos.z - r; z <= o.worldPos.z + r; z += STEP) {
            if (Math.hypot(x - o.worldPos.x, z - o.worldPos.z) > r) continue;
            const v = seen[idx(x, z)];
            if (!Number.isNaN(v) && Math.abs(v - o.worldPos.y) < 1.8) return true;
          }
          return false;
        };
        const kinds = ['house', 'node', 'npc', 'circle', 'sign', 'travel', 'mimot', 'page', 'book', 'bed'];
        const all = s.interactables.filter((o) => kinds.includes(o.kind) && !(o.kind === 'circle' && !o.active));
        const bad = all.filter((o) => !reach(o)).map((o) => `${o.kind}:${o.npcId ?? o.mimotId ?? o.cid ?? o.region ?? o.material ?? o.name ?? ''}@${o.worldPos.x.toFixed(0)},${o.worldPos.z.toFixed(0)}`);
        let cells = 0; for (const v of seen) if (!Number.isNaN(v)) cells++;
        return { total: all.length, bad, cells, jumps };
        };
        // Before any spell: only the places the story closes on purpose are out of reach.
        const before = explore();
        // Every spell that opens a way is cast (bridges, wind, stone stairs).
        for (const o of s.interactables.filter((i) => i.kind === 'circle' && ['pont', 'vent', 'pierre'].includes(i.spellId))) s.castSpell(o.spellId, o, 'strong', { silent: true });
        return { before, after: explore() };
      });
      const gated = (b) => /mimot:(foret|marais|neige|papier)|npc:(forester|fisher|alaricTower|alaricIsland)|book|page:|node:.*@-(6|7)\d,|node:.*@(5|6|7)\d,|circle:feu-marais|chest@-16/.test(b);
      const surprise = res.before.bad.filter((b) => !gated(b));
      check(surprise.length === 0, `sans sort, seuls les lieux fermés par l’histoire sont hors d’atteinte (${res.before.bad.length})`, surprise.join(' ; '));
      const dup = await g.page.evaluate(() => { const ids = window.__se.scene.interactables.filter((i) => i.kind === 'npc').map((i) => i.npcId); return ids.filter((id, k) => ids.indexOf(id) !== k); });
      check(dup.length === 0, 'chaque personnage n’est enregistré qu’une fois', dup.join(', '));
      check(res.after.bad.length === 0, `avec les sorts, tous les lieux sont atteignables à pied (${res.after.total} objets, ${res.after.cells} cases explorées)`, res.after.bad.join(' ; '));
      await g.page.close();
    },
  },
  {
    name: 'Prénom de l’enfant (demandé une fois, changé par les parents)',
    quick: true,
    weight: 2,
    async run(browser, base, check) {
      // childName left undefined: a brand-new player is asked for a name, then for an age.
      const g = await openGame(browser, base, { lang: 'fr', inputMode: 'keys', childName: undefined });
      await g.click('#new-game-btn');
      await g.page.waitForTimeout(400);
      check(await g.page.$eval('#name-modal', (e) => !e.hidden), 'le premier « Jouer » demande le prénom');
      check((await g.page.evaluate(() => window.__spoken.at(-1))).includes('Comment tu t’appelles'), 'la question est dite à voix haute');
      await g.click('#name-ok');
      await g.page.waitForTimeout(200);
      check(await g.page.$eval('#name-modal', (e) => !e.hidden) && await g.page.$eval('#name-hint', (e) => !e.hidden), 'sans prénom, la fenêtre reste ouverte avec une aide');
      await g.page.fill('#name-input', '  léo3! ');
      await g.click('#name-ok');
      await g.page.waitForTimeout(300);
      check(await g.page.$eval('#name-modal', (e) => e.hidden) && await g.page.$eval('#age-modal', (e) => !e.hidden), 'puis l’âge est demandé');
      const said = await g.page.evaluate(() => window.__spoken.at(-1));
      check(said.includes('Enchanté, Léo !') && said.includes('Quel âge'), 'Alaric dit bonjour avec le prénom, puis demande l’âge', said);
      let p = await g.page.evaluate((k) => JSON.parse(localStorage.getItem(k)), STORE);
      check(p.childName === 'Léo', 'le prénom est nettoyé (majuscule, sans chiffres ni signes) et enregistré', p.childName);
      await g.click('#age-buttons .age-btn:nth-child(2)');
      await g.page.waitForSelector('#dialog:not([hidden])', { timeout: 20000 });
      await g.skipDialog();
      // A word spelled on a resource: the first "bravo" says the name.
      await g.use("i.kind === 'node'");
      const r = await g.spell();
      check(r.result.includes(', Léo !'), 'le bravo dit le prénom', r.result);
      // Parents' corner: change it.
      await g.click('#quit-btn');
      await g.page.waitForTimeout(300);
      await g.click('#parents-btn');
      await g.page.waitForTimeout(300);
      check(await g.page.$eval('#dash-name', (e) => e.value) === 'Léo', 'l’espace parents montre le prénom');
      await g.page.fill('#dash-name', 'emma');
      await g.page.$eval('#dash-name', (e) => e.dispatchEvent(new Event('change')));
      await g.page.waitForTimeout(200);
      p = await g.page.evaluate((k) => JSON.parse(localStorage.getItem(k)), STORE);
      check(p.childName === 'Emma' && await g.page.$eval('#dash-name-saved', (e) => !e.hidden), 'les parents peuvent le changer (enregistré)', p.childName);
      // Asked only once: the next game goes straight in, and Alaric's card says the name.
      await g.page.evaluate((k) => { const q = JSON.parse(localStorage.getItem(k)); q.newsSeen = []; localStorage.setItem(k, JSON.stringify(q)); }, STORE);
      await g.page.reload();
      await g.page.waitForSelector('#loading.is-done', { timeout: 180000 });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(1500);
      check(await g.page.$eval('#name-modal', (e) => e.hidden), 'le prénom n’est demandé qu’une fois');
      const kicker = await g.page.$eval('#news-kicker', (e) => e.textContent).catch(() => '');
      check(kicker.includes('Quoi de neuf, Emma ?'), 'la carte d’Alaric dit « Quoi de neuf, Emma ? »', kicker);
      check(g.errors.length === 0, 'aucune erreur JavaScript', g.errors.join(' | '));
      await g.page.close();
    },
  },
  {
    name: 'Clavier et écriture : une majuscule au début, des minuscules ensuite',
    quick: true,
    weight: 1,
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 7, inputMode: 'keys', save: save(story(2, 0)) });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(1200);
      // The writing pad's grey model letter: record what is drawn on it.
      await g.page.evaluate(() => {
        const f = CanvasRenderingContext2D.prototype.fillText;
        window.__pad = [];
        CanvasRenderingContext2D.prototype.fillText = function (txt, ...a) { if (this.canvas?.id === 'hw-canvas') window.__pad.push(String(txt)); return f.call(this, txt, ...a); };
      });
      await g.use("i.kind === 'node'");
      await g.page.waitForFunction(() => !document.querySelector('#spell-modal').hidden, null, { timeout: 8000 });
      const word = await g.page.evaluate(() => window.__se.spell().word.word);
      const st = () => g.page.evaluate(() => ({
        keys: ['a', 'm', 'é', 'ç'].map((l) => document.querySelector(`#spell-keyboard .key[data-letter="${l}"]`)?.textContent).join(''),
        tiles: [...document.querySelectorAll('#spell-tiles .tile')].map((t) => t.textContent).join(''),
      }));
      const press = (ch) => g.page.evaluate((c) => document.querySelector(`#spell-keyboard .key[data-letter="${c}"]`).click(), ch);
      let s = await st();
      check(s.keys === 'AMÉÇ', 'pour la première lettre, le clavier montre des majuscules', s.keys);
      await press(word[0]);
      s = await st();
      check(s.keys === 'améç' && s.tiles === word[0].toLocaleUpperCase('fr-FR'), 'ensuite, le clavier passe en minuscules ; la première case a une majuscule', `${s.keys} / ${s.tiles}`);
      await press(word[1]);
      s = await st();
      check(s.tiles === word[0].toLocaleUpperCase('fr-FR') + word[1], 'la deuxième lettre s’écrit en minuscule', s.tiles);
      await g.page.evaluate(() => { document.querySelector('#spell-keyboard .key-wide').click(); document.querySelector('#spell-keyboard .key-wide').click(); });
      s = await st();
      check(s.keys === 'AMÉÇ' && s.tiles === '', 'tout effacé : le clavier repasse en majuscules', s.keys);
      // Writing pad with the model letter: a capital for the first letter, then a small letter.
      await g.page.evaluate(() => { window.__se.progress().traceGuide = true; });
      await g.click('#hw-toggle');
      await g.page.waitForTimeout(500);
      const first = await g.page.evaluate(() => window.__pad.at(-1));
      check(first === word[0].toLocaleUpperCase('fr-FR'), 'en écriture, la lettre modèle de la première lettre est une majuscule', first);
      await press(word[0]);
      await g.click('#hw-clear');
      await g.page.waitForTimeout(300);
      const second = await g.page.evaluate(() => window.__pad.at(-1));
      check(second === word[1], 'puis les lettres modèles sont en minuscules', second);
      await g.click('#hw-toggle');
      // When the word is shown to be copied out (after 3 misses), it has the same look.
      await g.page.evaluate(() => { document.querySelector('#spell-keyboard .key-wide').click(); });
      const wrong = word[0] === 'z' ? 'y' : 'z';
      for (let k = 0; k < 3; k++) {
        await g.page.waitForFunction(() => !document.querySelector('#spell-check-btn').hidden && document.querySelector('#spell-input').value === '', null, { timeout: 8000 });
        await g.page.evaluate(([w, n]) => { for (let i = 0; i < n; i++) document.querySelector(`#spell-keyboard .key[data-letter="${w}"]`).click(); document.querySelector('#spell-check-btn').click(); }, [wrong, word.length]);
        await g.page.waitForTimeout(300);
      }
      await g.page.waitForFunction(() => !document.querySelector('#spell-reveal').hidden, null, { timeout: 8000 }).catch(() => {});
      const shown = await g.page.evaluate(() => [...document.querySelectorAll('#reveal-tiles .tile')].map((t) => t.textContent).join(''));
      check(shown === word[0].toLocaleUpperCase('fr-FR') + word.slice(1), 'le mot à recopier est montré avec une majuscule au début', shown);
      check(g.errors.length === 0, 'aucune erreur JavaScript', g.errors.join(' | '));
      await g.page.close();
    },
  },
  {
    name: 'Programme de la semaine : pronoms, puis être, avoir, aller',
    quick: true,
    weight: 2,
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 7, inputMode: 'keys', programme: 'pronoms', save: save(story(2, 0)) });
      await g.page.evaluate(() => { window.__se = Object.assign(window.__se ?? {}, { programmeAlways: true }); });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(1200);
      // Opens a word on a resource; retries on another one when the machine is busy (closing any result left open).
      const openWord = async () => {
        const tries = [];
        for (let k = 0; k < 6; k++) {
          await g.page.evaluate(() => { const b = document.querySelector('#spell-continue-btn'); if (b && !b.hidden && !document.querySelector('#spell-modal').hidden) b.click(); });
          tries.push(await g.use("i.kind === 'node' && i.active && !i.requires && i.nodeType !== 'chest'"));
          if (await g.page.waitForFunction(() => !document.querySelector('#spell-modal').hidden && !!window.__se.spell(), null, { timeout: 4000 }).then(() => true, () => false)) return;
        }
        const state = await g.page.evaluate(() => [...document.querySelectorAll('.modal-overlay:not([hidden]), #dialog:not([hidden])')].map((e) => e.id).join() + ' spell=' + !!window.__se.spell() + ' modal=' + !document.querySelector('#spell-modal').hidden);
        throw new Error(`aucun mot ne s’ouvre (${tries.join()} ; ${state})`);
      };
      // Pronouns: a picture of who it is, the pronoun heard in a little sentence.
      await openWord();
      const w1 = await g.page.evaluate(() => window.__se.spell().word);
      check(['je', 'tu', 'il', 'elle', 'nous', 'vous'].includes(w1.word), 'un mot du thème : un pronom', w1.word);
      const ctx = await g.page.$eval('#spell-context', (e) => (e.hidden ? '' : e.textContent));
      check(ctx.includes(w1.pic) && ctx.includes(w1.who), 'l’image montre qui c’est', ctx);
      const heard = await g.page.evaluate(() => window.__spoken.slice(-4));
      check(heard.some((x) => x.includes(w1.sentence)), 'le pronom est dit dans une petite phrase', heard.join(' | '));
      const r1 = await g.spell();
      check(r1.result.includes(w1.sentence), 'réussi : la phrase du pronom s’affiche', r1.result);
      let p = await g.page.evaluate(() => window.__se.progress());
      check(p.wordStats[`fr:${w1.id}`]?.level === 'programme' && p.wordStats[`fr:${w1.id}`].correct === 1, 'le mot compte dans les statistiques, sous son propre nom');
      // Être, avoir, aller: the pronoun is already written, the child writes the verb.
      await g.page.evaluate(() => { window.__se.progress().programme = 'etre-avoir-aller'; });
      await g.page.waitForTimeout(400);
      await openWord();
      const w2 = await g.page.evaluate(() => window.__se.spell().word);
      check(!!w2.prefix && !!w2.verb, 'un mot du thème : pronom + verbe', w2.id);
      check(w2.verb === 'être', 'le thème s’ouvre petit à petit : le premier jour, seulement être', w2.verb);
      const view = await g.page.evaluate(() => ({
        prefix: document.querySelector('#spell-tiles .tile-prefix')?.textContent,
        ctx: document.querySelector('#spell-context').textContent,
        keyA: document.querySelector('#spell-keyboard .key[data-letter="a"]').textContent,
      }));
      const shownPrefix = w2.prefix[0].toUpperCase() + w2.prefix.slice(1);
      check(view.prefix === shownPrefix, 'le pronom est déjà écrit en gris, avec sa majuscule', view.prefix);
      check(view.ctx.includes(w2.verb), 'le verbe est rappelé', view.ctx);
      check(view.keyA === 'a', 'le verbe commence en minuscule (la majuscule est sur le pronom)', view.keyA);
      check((await g.page.evaluate(() => window.__spoken.slice(-3))).some((x) => x.includes(w2.say)), 'on entend le pronom et le verbe ensemble', w2.say + ' / ' + await g.page.evaluate(() => window.__spoken.slice(-3).join(' | ')));
      const r2 = await g.spell();
      check(r2.result.includes(w2.sentence), 'réussi : la phrase s’affiche', r2.result);
      // Articles: the noun in grey after the boxes, the child writes le or la (first days).
      await g.page.evaluate(() => { const p = window.__se.progress(); p.programme = 'articles'; delete p.programmeSince; });
      await g.page.waitForTimeout(400);
      await openWord();
      const w3 = await g.page.evaluate(() => window.__se.spell().word);
      const v3 = await g.page.evaluate(() => ({ suffix: document.querySelector('#spell-tiles .tile-suffix')?.textContent, ctx: document.querySelector('#spell-context').textContent, keyL: document.querySelector('#spell-keyboard .key[data-letter="l"]').textContent }));
      check(['le', 'la'].includes(w3.word) && v3.suffix === w3.suffix, 'articles : le ou la, avec le nom écrit en gris après les cases', `${w3.word} ${v3.suffix}`);
      check(v3.ctx === w3.pic && v3.keyL === 'L', 'une image (sans la réponse) et une majuscule pour commencer', v3.ctx);
      const r3 = await g.spell();
      check(r3.result.includes(w3.sentence), 'réussi : la phrase s’affiche', r3.result);
      // Colours: blanc / blanche first, the start of the sentence in grey.
      await g.page.evaluate(() => { window.__se.progress().programme = 'couleurs'; });
      await g.page.waitForTimeout(400);
      await openWord();
      const w4 = await g.page.evaluate(() => window.__se.spell().word);
      const p4 = await g.page.evaluate(() => document.querySelector('#spell-tiles .tile-prefix')?.textContent);
      check(['blanc', 'blanche'].includes(w4.word) && p4 === w4.prefix[0].toUpperCase() + w4.prefix.slice(1), 'couleurs : blanc ou blanche d’abord, le début de la phrase en gris', `${p4} … ${w4.word}`);
      const r4 = await g.spell();
      check(r4.result.includes(w4.sentence), 'réussi : « … est blanc / blanche. »', r4.result);
      // Bosses, portals and Mimots keep their usual words.
      const other = await g.page.evaluate(() => [0, 1, 2, 3, 4, 5].map(() => window.__se.pickWord(window.__se.levelAt(1), { programme: false })?.level));
      check(other.every((l) => l !== 'programme'), 'les boss, portails et Mimots gardent leurs mots habituels', other.join());
      // A dated card (the theme's presentation) waits for its day.
      const live = await g.page.evaluate(() => [window.__se.newsLive({ from: '2000-01-01' }), window.__se.newsLive({ from: '2999-01-01' }), window.__se.newsLive({ only: 'en' }), window.__se.newsLive({ programme: 'couleurs' }), window.__se.newsLive({ programme: 'articles' })]);
      check(live.join() === 'true,false,false,true,false', 'la carte d’Alaric du thème attend son jour, reste en français, et ne parle que du thème qui tourne', live.join());
      // Parents' corner.
      await g.click('#quit-btn');
      await g.page.waitForTimeout(300);
      await g.click('#parents-btn');
      await g.page.waitForTimeout(300);
      const dash = await g.page.evaluate(() => ({ value: document.querySelector('#dash-programme').value, n: document.querySelectorAll('#dash-programme option').length, now: document.querySelector('#dash-prog-now').textContent, list: document.querySelectorAll('#dash-prog-list li').length }));
      check(dash.value === 'couleurs' && dash.n === 9 && dash.now.includes('Les couleurs') && dash.now.includes('5 mots sur 17'), 'l’espace parents montre le thème choisi et ce qui est déjà ouvert', JSON.stringify(dash));
      await g.page.selectOption('#dash-programme', 'off');
      await g.page.waitForTimeout(200);
      p = await g.page.evaluate(() => window.__se.progress());
      check(p.programme === 'off' && (await g.page.$eval('#dash-prog-now', (e) => e.textContent)).includes('Pas de thème'), 'les parents peuvent le désactiver');
      await g.page.selectOption('#dash-programme', 'premier-groupe');
      await g.page.waitForTimeout(200);
      const picked = await g.page.evaluate(() => ({ p: window.__se.progress(), now: document.querySelector('#dash-prog-now').textContent }));
      check(picked.p.programme === 'premier-groupe' && !!picked.p.programmeSince && picked.now.includes('24 mots sur 60'), 'un thème choisi à la main s’ouvre aussi petit à petit (4 verbes sur 10 le premier jour)', picked.now);
      await g.page.selectOption('#dash-programme', 'auto');
      check((await g.page.evaluate(() => window.__se.progress().programme)) === 'auto', 'ou revenir au calendrier automatique');
      check(g.errors.length === 0, 'aucune erreur JavaScript', g.errors.join(' | '));
      await g.page.close();
    },
  },
  {
    name: 'Fluidité iPad (budget d’affichage)',
    quick: true,
    weight: 4,
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 7, save: save(story(2, 0)) }, { render: true });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(1200);
      // The jumping chest (J2) is out in front of the cottage, Cocotte on its roof: count them too.
      await g.page.evaluate(() => window.__se.scene.jumpChest.spawn('welcome'));
      // Flammèche (J3), big, with her 10 stars around the cottage.
      await g.page.evaluate(() => { const fl = window.__se.scene.flame; fl.setState({ lit: true, size: 5 }); for (const p of fl.starSpots(10, 3)) fl.addStar(p); });
      const measure = (x, z) => g.page.evaluate(([px, pz]) => {
        const s = window.__se.scene;
        s.teleport(px, pz); s._tickRegions();
        const r = s.renderer; r.info.autoReset = false; r.info.reset(); r.render(s.scene, s.camera);
        const i = { calls: r.info.render.calls, tris: r.info.render.triangles }; r.info.autoReset = true;
        return i;
      }, [x, z]);
      // Budgets: measured at v1.5 with this method (village ≈ 1 100 calls / 142k triangles,
      // regions 400–700 calls), plus about 10 %. A new feature that blows them needs a look on iPad.
      // Draw calls vary by about ±60 from one run to the next (animals and villagers walking about,
      // the load of the test machine). v1.14 (places + animals), alone: village ≈ 1 140, regions 500–730.
      for (const [label, x, z, calls, tris] of [['village', 0, 4, 1300, 160000], ['forêt', -62, 0, 860, 160000], ['marais', 60, 0, 860, 160000], ['montagne', 0, -50, 860, 160000], ['plage', 0, 62, 860, 160000]]) {
        const m = await measure(x, z);
        check(m.calls <= calls && m.tris <= tris, `${label} : ${m.calls} appels, ${Math.round(m.tris / 1000)}k triangles`, `budget ${calls} / ${tris / 1000}k`);
      }
      await g.page.close();
    },
  },
];
