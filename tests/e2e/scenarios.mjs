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
      check(levels[8] === 'challenge,ce2,ce2hard', '8 ans : listes CE2', levels[8]);
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
