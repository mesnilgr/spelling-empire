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
      await g.page.waitForTimeout(1800);
      const pos = await g.page.evaluate(() => window.__se.scene.player.position.x);
      check(Math.abs(pos) < 10, 'le voyage ramène au village', String(pos));
      check(g.errors.length === 0, 'aucune erreur JavaScript', g.errors.join(' | '));
      await g.page.close();
    },
  },
  {
    name: 'Chapitres 4 et 5 : montagne, plage et fin',
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
      await draw(LETTERS.l); await g.page.waitForTimeout(3200);
      await draw(LETTERS.o); await g.page.waitForTimeout(3600);
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
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 7, save: save(story(2, 0)) }, { quality: 0 });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(1000);
      // Every jump is possible: simulate the hero with the game's own physics and collisions.
      const sim = await g.page.evaluate(async () => {
        const { LAVA } = await import('/regions.js');
        const s = window.__se.scene;
        const SPEED = 4.5, JUMP = 8.2, G = 24, dt = 1 / 60;
        const path = [{ x: LAVA.start.x, z: LAVA.start.z, y: 0, size: 2.6 }, ...LAVA.pillars.map(([x, z, size, h, role]) => ({ x, z, y: h, size, role }))];
        const out = [];
        for (let k = 0; k + 1 < path.length; k++) {
          const A = path[k], B = path[k + 1];
          const p = { x: A.x, z: A.z, y: A.y }; let vy = 0, ground = true, jumped = false, landed = null;
          const dx = B.x - A.x, dz = B.z - A.z, d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d;
          for (let t = 0; t < 4 && !landed; t += dt) {
            // Jump when about to leave A (its edge along the way to B).
            const along = (p.x - A.x) * ux + (p.z - A.z) * uz;
            if (!jumped && ground && along > A.size / 2 - 0.2) { vy = JUMP; ground = false; jumped = true; }
            const nx = p.x + ux * SPEED * dt, nz = p.z + uz * SPEED * dt;
            if (!s._blocked(nx, p.z, p.y)) p.x = nx;
            if (!s._blocked(p.x, nz, p.y)) p.z = nz;
            vy -= G * dt; p.y += vy * dt;
            const gr = s.groundAt(p.x, p.z);
            if (p.y <= gr) { p.y = gr; vy = 0; if (jumped) landed = s._walkwayAt(p.x, p.z) ? 'pilier' : 'lave'; ground = true; }
          }
          const ok = landed === 'pilier' && Math.abs(p.x - B.x) <= B.size / 2 && Math.abs(p.z - B.z) <= B.size / 2;
          out.push({ k: k + 1, ok, landed, at: `${p.x.toFixed(1)},${p.z.toFixed(1)}` });
        }
        return out;
      });
      const badJumps = sim.filter((j) => !j.ok);
      check(badJumps.length === 0, `les ${sim.length} sauts sont tous faisables`, JSON.stringify(badJumps));
      // Falling in the lava: "Ouch!" and back to the start.
      await g.page.evaluate(() => window.__se.scene.teleport(33, -42.5));
      await g.page.waitForTimeout(2200);
      const after = await g.page.evaluate(() => { const p = window.__se.scene.player.position; return { x: p.x, z: p.z }; });
      check(Math.hypot(after.x - 29, after.z + 37.4) < 1.5, 'tomber dans la lave ramène au départ', JSON.stringify(after));
      const asked = await g.page.waitForFunction(() => window.__se.spell()?.type === 'revive' && !document.querySelector('#spell-modal').hidden, null, { timeout: 8000 }).then(() => true, () => false);
      check(asked, 'après la chute, il faut épeler un mot pour repartir');
      const rv = await g.spell();
      check(rv.result.includes('reparti'), 'le mot réussi, on repart', rv.result);
      // Flags, then the finish.
      for (const role of ['cp1', 'cp2']) {
        await g.page.evaluate((r) => { const s = window.__se.scene; const c = s.lavaPillar(r); s.teleport(c.x, c.z); }, role);
        await g.page.waitForTimeout(700);
      }
      check(await g.page.evaluate(() => window.__se.game().parkour?.cp === 'cp2'), 'les drapeaux sont enregistrés');
      await g.page.evaluate(() => window.__se.scene.teleport(33, -46));
      await g.page.waitForTimeout(2200);
      if (await g.page.waitForFunction(() => window.__se.spell()?.type === 'revive', null, { timeout: 8000 }).then(() => true, () => false)) await g.spell();
      const cpBack = await g.page.evaluate(() => { const p = window.__se.scene.player.position; return { x: p.x, z: p.z }; });
      check(Math.hypot(cpBack.x - 39.2, cpBack.z + 50.8) < 1.5, 'après le drapeau 2, une chute ramène au drapeau 2', JSON.stringify(cpBack));
      await g.page.evaluate(() => { const s = window.__se.scene; const c = s.lavaPillar('finish'); s.teleport(c.x, c.z); });
      await g.page.waitForTimeout(900);
      check(await g.page.evaluate(() => window.__se.game().parkour?.done === true), 'l’arrivée valide le parcours');
      check((await g.objective()).includes('fontaine'), 'objectif : retourner à la fontaine', await g.objective());
      const down = await g.page.evaluate(() => { const s = window.__se.scene; const p = { x: 35.9, z: -61.4, y: 0.6 }; for (let k = 0; k < 40 && p.z > -65.8; k++) { const nz = p.z - 0.15; if (!s._blocked(p.x, nz, p.y)) { p.z = nz; p.y = s.groundAt(p.x, p.z); } } return p; });
      check(down.z < -65.5 && down.y < 0.3, 'la rampe de sortie descend hors de la lave', JSON.stringify(down));
      check(await g.page.evaluate(() => window.__se.scene.village.fountain.position.y) === 0, 'la fontaine ne bouge pas avant d’y retourner');
      await g.page.evaluate(() => window.__se.scene.teleport(0, 3.4));
      await g.page.waitForTimeout(3600);
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
      const d0 = await g.page.evaluate(() => window.__se.scene.zombies.nearest());
      await step(2);
      const d1 = await g.page.evaluate(() => window.__se.scene.zombies.nearest());
      check(d1 < d0 - 3, `ils poursuivent le héros dehors (${d0.toFixed(1)} → ${d1.toFixed(1)} en 2 s)`);
      // Caught: back home, nothing lost.
      for (let k = 0; k < 10 && !(await g.page.evaluate(() => window.__ko >= 1)); k++) { await step(1); await g.page.waitForTimeout(100); }
      await g.page.waitForTimeout(1500);
      const home = await g.page.evaluate(() => { const s = window.__se.scene; const bed = s.interactables.find((i) => i.kind === 'bed'); const p = s.player.position; return { ko: window.__ko, reason: window.__koReason, dist: Math.hypot(p.x - bed.worldPos.x, p.z - bed.worldPos.z), safe: s.zombies.heroSafe() }; });
      check(home.ko === 1 && home.reason === 'zombie' && home.dist < 2.5, 'un zombie qui attrape le héros le renvoie au lit de la chaumière', JSON.stringify(home));
      check(home.safe, 'dans la maison, le héros est à l’abri');
      await step(10);
      await g.page.waitForTimeout(500);
      const inside = await g.page.evaluate(() => { const s = window.__se.scene; return { ko: window.__ko, inHouse: s.zombies.active.some((z) => s._insideAnyHouse(z.mesh.position.x, z.mesh.position.z, 0)) }; });
      check(inside.ko === 1 && !inside.inHouse, 'aucun zombie n’entre ni n’attaque dans une maison', JSON.stringify(inside));
      // Defend: an ordinary sword pushes back, the diamond sword defeats.
      const setup = () => g.page.evaluate(() => {
        const s = window.__se.scene; s.zombies.grace = 30;
        s.teleport(8, 24);
        if (!s.zombies.active.length) s.zombies._spawn();
        const z = s.zombies.active[0];
        z.mesh.position.set(8, s.groundAt(8, 25.2), 25.2); z.stun = 0;
        s.player.rotation.y = 0;
        return s.zombies.active.length;
      });
      await setup();
      await g.page.evaluate(() => { window.__se.game().crafted = ['sword']; });
      await g.page.waitForTimeout(400);
      check(await g.page.$eval('#attack-btn', (e) => !e.hidden), 'le bouton ⚔️ apparaît quand un zombie est proche');
      await g.page.evaluate(() => { const s = window.__se.scene; const z = s.zombies.active[0]; window.__pz = z; z.mesh.position.set(8, s.groundAt(8, 25.2), 25.2); z.stun = 0; s.player.rotation.y = 0; s.player.userData.action = null; });
      await g.click('#attack-btn');
      const pushed = await g.page.evaluate(() => { const z = window.__pz, p = window.__se.scene.player.position; return { alive: z.alive, hp: z.hp, d: Math.hypot(z.mesh.position.x - p.x, z.mesh.position.z - p.z) }; });
      check(pushed.alive && pushed.hp === 2 && pushed.d > 2, 'une épée normale repousse le zombie sans le vaincre', JSON.stringify(pushed));
      await setup();
      await g.page.evaluate(() => { window.__se.game().crafted = ['sword', 'sword_diamond']; });
      await g.page.evaluate(() => { window.__target = window.__se.scene.zombies.active[0]; window.__starsBefore = window.__se.progress().stars; });
      for (let k = 0; k < 2; k++) {
        await g.page.evaluate(() => { const s = window.__se.scene; const z = window.__target; if (!z.alive) return; z.mesh.position.set(8, s.groundAt(8, 25.1), 25.1); z.stun = 0; s.player.rotation.y = 0; s.player.userData.action = null; });
        await g.click('#attack-btn');
        await g.page.waitForTimeout(400);
      }
      const won = await g.page.evaluate(() => ({ alive: window.__target.alive, stars: window.__se.progress().stars - window.__starsBefore }));
      check(!won.alive && won.stars === 1, 'l’épée en diamant vainc le zombie en deux coups (+1 ★)', JSON.stringify(won));
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
    async run(browser, base, check) {
      const g = await openGame(browser, base, { lang: 'fr', age: 7, save: save(story(2, 0)) });
      await g.click('#continue-btn');
      await g.page.waitForTimeout(1200);
      const measure = (x, z) => g.page.evaluate(([px, pz]) => {
        const s = window.__se.scene;
        s.teleport(px, pz); s._tickRegions();
        const r = s.renderer; r.info.autoReset = false; r.info.reset(); r.render(s.scene, s.camera);
        const i = { calls: r.info.render.calls, tris: r.info.render.triangles }; r.info.autoReset = true;
        return i;
      }, [x, z]);
      // Budgets: measured at v1.5 with this method (village ≈ 1 100 calls / 142k triangles,
      // regions 400–700 calls), plus about 10 %. A new feature that blows them needs a look on iPad.
      for (const [label, x, z, calls, tris] of [['village', 0, 4, 1200, 160000], ['forêt', -62, 0, 800, 160000], ['marais', 60, 0, 800, 160000], ['montagne', 0, -50, 800, 160000], ['plage', 0, 62, 800, 160000]]) {
        const m = await measure(x, z);
        check(m.calls <= calls && m.tris <= tris, `${label} : ${m.calls} appels, ${Math.round(m.tris / 1000)}k triangles`, `budget ${calls} / ${tris / 1000}k`);
      }
      await g.page.close();
    },
  },
];
