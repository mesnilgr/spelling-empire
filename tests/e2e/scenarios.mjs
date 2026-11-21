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
      await g.page.waitForTimeout(2200);
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
      const boss = await g.page.evaluate(() => ({ won: window.__se.game().bosses.includes('mossGolem'), gone: !window.__se.scene.bosses.get('mossGolem').mesh.visible, stars: window.__se.progress().stars - window.__starsBefore, bar: document.querySelector('#boss-bar').hidden }));
      check(boss.won && boss.gone && boss.bar, 'trois mots réussis : le Golem de mousse est vaincu', JSON.stringify(boss));
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
      // The Nether portal: lit with a word, then it takes the hero to the lava course.
      check(await g.use("i.kind === 'portal'") === 'ok', 'on touche le portail du Nether');
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
      const g = await openGame(browser, base, { lang: 'fr', age: 7, newsSeen: ['1.20.0-defis'], save: save(story(2, 0)) }, { quality: 0 });
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
      check(journal.length >= 3 && /défis/i.test(journal[0]) && journal.some((j) => /golem/i.test(j)), 'le journal 📜 garde toutes les présentations, la plus récente en haut', journal.join(' / '));
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
      const g = await openGame(browser, base, { lang: 'fr', age: 7, newsSeen: ['1.19.0-alaric', '1.19.0-golem'], save: save(story(2, 0)) }, { quality: 0, defis: true });
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
      for (let k = 0; k < 2; k++) { await g.use("i.kind === 'jumpchest'"); await g.page.waitForTimeout(1000); }
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
        else if (id === 'cocotte') await g.use("i.kind === 'cocotte'");
        await g.page.waitForTimeout(300);
      };
      for (const id of st1.m.ids) await doDefi(id);
      const m = await g.page.evaluate(() => ({ st: window.__se.defis().m, queue: window.__se.progress().chestQueue }));
      check(m.st.done && m.queue.includes('m'), 'les trois défis du matin réussis : un coffre sauteur arrive', JSON.stringify(m));
      check(words >= 7, `au moins 7 mots en session 1 (${words})`);
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
      // The journal: parts 1 and 2 and Cocotte's hint, written and read.
      await g.page.waitForTimeout(4500);
      await g.click('#defis-btn');
      await g.page.waitForTimeout(300);
      const j1 = await g.page.evaluate(() => ({ txt: document.querySelector('#journal-today').innerText, said: window.__spoken.slice(-1)[0] }));
      check(/Partie 1 ✓ · Partie 2 : à ton prochain retour !/.test(j1.txt), 'journal : « Partie 1 ✓ · Partie 2 : à ton prochain retour ! »', j1.txt);
      check(/prochain retour/.test(j1.said) && /toit de ta chaumière/.test(j1.said) && /toit de ta chaumière/.test(j1.txt), 'les parties et l’indice de Cocotte sont lus à voix haute', j1.said);
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
      // Cocotte on the cottage roof: "Cot cot!", a golden feather.
      if (!st2.st.e.ids.includes('cocotte')) await doDefi('cocotte');
      const hen = await g.page.evaluate(() => ({ feathers: window.__se.progress().feathers, active: window.__se.scene.cocotte.obj.active, y: window.__se.scene.cocotte.base.y }));
      check(hen.feathers?.includes(2) && !hen.active && hen.y > 3, 'Cocotte, sur le toit de la chaumière, s’envole et laisse une plume dorée', JSON.stringify(hen));
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
      const fifteen = await g.page.evaluate(async () => { const st = window.__se.partState('J99'); const before = window.__se.releasePart(99); st.play = 15 * 60 - 0.4; await new Promise((r) => setTimeout(r, 1500)); return { before, after: window.__se.releasePart(99) }; });
      check(fifteen.before === 1 && fifteen.after === 2, 'la partie 2 s’ouvre aussi après 15 min de jeu sur la partie 1', JSON.stringify(fifteen));
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
    name: 'Fluidité iPad (budget d’affichage)',
    quick: true,
    weight: 4,
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 7, save: save(story(2, 0)) }, { render: true });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(1200);
      // The jumping chest (J2) is out in front of the cottage, Cocotte on its roof: count them too.
      await g.page.evaluate(() => window.__se.scene.jumpChest.spawn('welcome'));
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
