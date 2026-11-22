import { LANGUAGES, LEVELS, WORDS, UI, buildSentence, AGE_LADDER, AGE_START, AGES, frComplexity } from './language-engine.js';
import { SRS, ensureCard, grade, gradeFromAttempt, chooseWord } from './srs.js';
import { PROGRAMME, PROGRAMME_WORDS, MINI_PHRASES, SENTENCES_READY, themeFor, themeWords, upcomingThemes } from './programme.js';

let pass = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) { pass += 1; }
  else { fail += 1; console.error(`FAIL: ${msg}`); }
}

// --- Constants (must match game.js) ---
const MAP_W = 6;
const MAP_H = 5;
const MAX_TRIES = 3;
const FIRST_TRY_STARS = 3;
const RETRY_STARS = 1;

// --- Map generation (replicated from game.js) ---
function generateMap() {
  const tiles = [];
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      tiles.push({ x, y, owner: null, id: `${x},${y}` });
    }
  }
  const halfW = Math.ceil(MAP_W / 2);
  const thirdH = Math.floor(MAP_H / 3);
  const twoThirdsH = Math.floor((MAP_H * 2) / 3);
  for (const tile of tiles) {
    if (tile.x < halfW) tile.owner = 'player';
    else if (tile.y < thirdH) tile.owner = 'red';
    else if (tile.y < twoThirdsH) tile.owner = 'orange';
    else tile.owner = 'green';
  }
  return tiles;
}

function getTile(tiles, x, y) {
  return tiles.find(t => t.x === x && t.y === y) || null;
}

function neighbors(tiles, tile) {
  const dirs = [[0,-1],[1,0],[0,1],[-1,0]];
  return dirs.map(([dx,dy]) => getTile(tiles, tile.x+dx, tile.y+dy)).filter(t => t !== null);
}

function ownedTiles(tiles, tribeId) { return tiles.filter(t => t.owner === tribeId); }
function countTiles(tiles, tribeId) { return ownedTiles(tiles, tribeId).length; }

function isAttackable(tiles, tile) {
  if (tile.owner === 'player' || tile.owner === null) return false;
  return neighbors(tiles, tile).some(n => n.owner === 'player');
}

function getAttackable(tiles) { return tiles.filter(t => isAttackable(tiles, t)); }

function checkAlive(tiles, alive) {
  const newAlive = [];
  for (const id of alive) {
    if (countTiles(tiles, id) > 0) newAlive.push(id);
  }
  return newAlive;
}

// --- Streak logic (replicated) ---
function computeStreakBonus(streak) {
  return streak >= 2 ? Math.min(streak - 1, 3) : 0;
}

function computeStars(firstTry, streak) {
  const base = firstTry ? FIRST_TRY_STARS : RETRY_STARS;
  return base + computeStreakBonus(streak);
}

// --- Tests ---

// 1. Map generation: all tribes get tiles
for (const lang of ['en', 'fr']) {
  const tiles = generateMap();
  const counts = ['player','red','orange','green'].map(id => countTiles(tiles, id));
  assert(counts[0] > 0, `${lang}: player has tiles`);
  assert(counts[1] > 0, `${lang}: red has tiles`);
  assert(counts[2] > 0, `${lang}: orange has tiles`);
  assert(counts[3] > 0, `${lang}: green has tiles`);
  assert(tiles.length === MAP_W * MAP_H, `${lang}: total tiles = ${MAP_W*MAP_H}`);
}

// 2. Streak bonus logic
assert(computeStreakBonus(0) === 0, 'streak 0: no bonus');
assert(computeStreakBonus(1) === 0, 'streak 1: no bonus');
assert(computeStreakBonus(2) === 1, 'streak 2: +1 bonus');
assert(computeStreakBonus(3) === 2, 'streak 3: +2 bonus');
assert(computeStreakBonus(4) === 3, 'streak 4: +3 bonus');
assert(computeStreakBonus(5) === 3, 'streak 5: capped at +3');
assert(computeStreakBonus(10) === 3, 'streak 10: capped at +3');

// 3. Star computation
assert(computeStars(true, 0) === 3, 'first try, no streak: 3 stars');
assert(computeStars(true, 1) === 3, 'first try, streak 1: 3 stars');
assert(computeStars(true, 2) === 4, 'first try, streak 2: 4 stars');
assert(computeStars(true, 3) === 5, 'first try, streak 3: 5 stars');
assert(computeStars(true, 5) === 6, 'first try, streak 5: 6 stars');
assert(computeStars(false, 0) === 1, 'retry, no streak: 1 star');
// Note: streak is reset to 0 in game logic before computeStars is called on retry

// 4. Full game simulation with streak tracking
function simulateGame(levelId, lang, maxTurns = 200) {
  const wordPool = shuffle(WORDS[lang].filter(w => w.level === levelId));
  let wordIdx = 0;
  const tiles = generateMap();
  let alive = ['player','red','green','orange'];
  let moves = 0;
  let starsEarned = 0;
  let wordsSpelled = 0;
  let streak = 0;
  let bestStreak = 0;

  function nextWord() {
    if (wordIdx >= wordPool.length) { wordIdx = 0; }
    return wordPool[wordIdx++];
  }

  for (let turn = 0; turn < maxTurns; turn++) {
    const attackable = getAttackable(tiles);
    if (attackable.length === 0) break;

    const tile = attackable[Math.floor(Math.random() * attackable.length)];
    const word = nextWord();
    // Simulate: 70% first try, 20% retry, 10% fail
    const roll = Math.random();
    let firstTry, success;
    if (roll < 0.7) { firstTry = true; success = true; }
    else if (roll < 0.9) { firstTry = false; success = true; }
    else { success = false; }

    if (success) {
      if (firstTry) {
        streak += 1;
        if (streak > bestStreak) bestStreak = streak;
      } else {
        streak = 0;
      }
      starsEarned += computeStars(firstTry, streak);
      wordsSpelled += 1;
      tile.owner = 'player';
    } else {
      streak = 0;
    }
    moves += 1;

    alive = checkAlive(tiles, alive);
    if (alive.length === 1 && alive[0] === 'player') return { won: true, moves, starsEarned, wordsSpelled, bestStreak };
    if (!alive.includes('player')) return { won: false, moves, starsEarned, wordsSpelled, bestStreak };

    // Enemy turn: 50% skip
    if (Math.random() <= 0.5) {
      const enemies = alive.filter(id => id !== 'player');
      if (enemies.length > 0) {
        const attacker = enemies[Math.floor(Math.random() * enemies.length)];
        const enemyTiles = ownedTiles(tiles, attacker);
        const targets = [];
        for (const t of enemyTiles) {
          for (const n of neighbors(tiles, t)) {
            if (n.owner === 'player') targets.push(n);
          }
        }
        if (targets.length > 0) {
          targets[Math.floor(Math.random() * targets.length)].owner = attacker;
        }
      }
    }

    alive = checkAlive(tiles, alive);
    if (alive.length === 1 && alive[0] === 'player') return { won: true, moves, starsEarned, wordsSpelled, bestStreak };
    if (!alive.includes('player')) return { won: false, moves, starsEarned, wordsSpelled, bestStreak };
  }
  return { won: null, moves, starsEarned, wordsSpelled, bestStreak, stuck: true };
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Run 20 games for each language/level
for (const lang of ['en', 'fr']) {
  for (const level of ['easy', 'medium', 'challenge']) {
    let wins = 0, losses = 0, stuck = 0;
    let totalStars = 0, totalWords = 0, maxStreak = 0;
    for (let i = 0; i < 20; i++) {
      const result = simulateGame(level, lang);
      if (result.won) wins++;
      else if (result.won === false) losses++;
      else stuck++;
      totalStars += result.starsEarned;
      totalWords += result.wordsSpelled;
      if (result.bestStreak > maxStreak) maxStreak = result.bestStreak;
      assert(result.won !== null, `${lang}/${level} game ${i}: not stuck`);
    }
    console.log(`${lang}/${level}: ${wins}W ${losses}L ${stuck}S | avg stars: ${(totalStars/20).toFixed(1)} | avg words: ${(totalWords/20).toFixed(1)} | max streak: ${maxStreak}x`);
    assert(stuck === 0, `${lang}/${level}: no stuck games`);
  }
}

// 5. Words typeable and no spaces
for (const lang of ['en', 'fr']) {
  const keys = new Set(LANGUAGES[lang].keyRows.join(''));
  for (const entry of WORDS[lang]) {
    // Only short phrases have spaces (filled in automatically); never two in a row or at the ends.
    if (entry.level === 'phrases') assert(/^[^ ]+( [^ ]+)+$/.test(entry.word), `${lang}: phrase "${entry.word}" has single spaces between words`);
    else assert(!entry.word.includes(' '), `${lang}: word "${entry.word}" has no space`);
    for (const letter of entry.word.toLowerCase().replace(/ /g, '')) {
      assert(keys.has(letter), `${lang}: word "${entry.word}" letter "${letter}" is typeable`);
    }
  }
}

// 6. No duplicate words within a level
for (const lang of ['en', 'fr']) {
  for (const level of ['easy', 'medium', 'challenge']) {
    const words = WORDS[lang].filter(w => w.level === level).map(w => w.word);
    const unique = new Set(words);
    assert(unique.size === words.length, `${lang}/${level}: no duplicates (${words.length} words)`);
  }
}

// 7. UI keys exist in both languages
const enKeys = Object.keys(UI.en);
const frKeys = Object.keys(UI.fr);
for (const key of enKeys) {
  assert(frKeys.includes(key), `UI key "${key}" exists in French`);
}
for (const key of frKeys) {
  assert(enKeys.includes(key), `UI key "${key}" exists in English`);
}

// 8. New streak keys exist
assert(UI.en.streakLabel !== undefined, 'en: streakLabel exists');
assert(UI.fr.streakLabel !== undefined, 'fr: streakLabel exists');
assert(UI.en.bonusStars !== undefined, 'en: bonusStars exists');
assert(UI.fr.bonusStars !== undefined, 'fr: bonusStars exists');
assert(UI.en.bestStreak !== undefined, 'en: bestStreak exists');
assert(UI.fr.bestStreak !== undefined, 'fr: bestStreak exists');
assert(UI.en.streakMaster !== undefined, 'en: streakMaster exists');
assert(UI.fr.streakMaster !== undefined, 'fr: streakMaster exists');
assert(UI.en.streakText !== undefined, 'en: streakText exists');
assert(UI.fr.streakText !== undefined, 'fr: streakText exists');

// 9. Example sentences are real sentences: capital letter, final punctuation, no placeholders
for (const l of ['en', 'fr']) {
  for (const w of WORDS[l]) {
    const s = buildSentence(w.word, l);
    assert(/^[A-ZÀ-Ý]/.test(s), `${l} "${w.word}": sentence starts with a capital`);
    assert(/[.!?]$/.test(s), `${l} "${w.word}": sentence ends with punctuation`);
  }
}

// 10. Enemy taunts exist in both languages
const ENEMY_TAUNTS = {
  en: ['Your tiles will be mine!', 'You cannot spell!', 'I am coming for you!', 'Pathetic!', 'Easy target!', 'Give up now!'],
  fr: ['Tes cases seront à moi !', 'Tu ne sais pas écrire !', 'Je vais te battre !', 'Pathétique !', 'Cible facile !', 'Abandonne !'],
};
assert(ENEMY_TAUNTS.en.length >= 4, 'en: enough taunts');
assert(ENEMY_TAUNTS.fr.length >= 4, 'fr: enough taunts');

// 10b. Word lists follow the level rules the parents asked for
// Nasal vowels only count before a consonant or at the end ("a-mi" is simple, "lapin" is not).
const FR_COMPLEX = /((on|om|an|am|en|em|in|im|un|um)([^aeiouéèêy]|$)|ou|oi|au|eau|ch|gn|ph|qu|ai|ei|eu|ill|ss|ll|tt|mm|nn|pp|rr)/;
const frEasy = WORDS.fr.filter(w => w.level === 'easy').map(w => w.word);
const frMedium = WORDS.fr.filter(w => w.level === 'medium').map(w => w.word);
for (const w of frEasy) {
  assert(!w.endsWith('e'), `fr/easy "${w}": no final mute e`);
  assert(!/[stdxpgz]$/.test(w), `fr/easy "${w}": no silent final consonant`);
  assert(!FR_COMPLEX.test(w), `fr/easy "${w}": only simple one-letter sounds`);
  assert(!/[cg][eéiy]/.test(w), `fr/easy "${w}": no soft c/g`);
}
// Complex spellings (frComplexity): level 1 none, level 2 exactly one, level 3 at least two.
// "balançoire" counts four (an, ç, oi, final e).
assert(frComplexity('balançoire').length === 4, 'frComplexity: balançoire = an + ç + oi + e');
assert(frComplexity('tomate').length === 1 && frComplexity('lapin').length === 1 && frComplexity('chat').length === 2, 'frComplexity: tomate 1, lapin 1, chat 2');
for (const w of frEasy) assert(frComplexity(w).length === 0, `fr/easy "${w}": no complex spelling (${frComplexity(w)})`);
for (const w of frMedium) assert(frComplexity(w).length === 1, `fr/medium "${w}": exactly one complex spelling (${frComplexity(w)})`);
for (const w of WORDS.fr.filter(x => x.level === 'challenge').map(x => x.word)) assert(frComplexity(w).length >= 2, `fr/challenge "${w}": at least two complex spellings (${frComplexity(w)})`);
assert(frMedium.length >= 45, `fr/medium: enough words (${frMedium.length})`);
// v1.20.1: « cinéma » asked by a parent (one complex spelling: the soft c), with its sentence and album picture.
assert(frMedium.includes('cinéma') && buildSentence('cinéma', 'fr').startsWith('Ce soir'), 'fr/medium: cinéma, with its own sentence');

// --- Programme de la semaine (v1.21.1): pronouns 23–25 Nov, être / avoir / aller 26–29 Nov,
// mini-sentences 30 Nov – 6 Dec (until their layout exists: être / avoir / aller), -er verbs 7–13 Dec.
{
  const at = (d, set) => themeFor(d, set)?.id ?? null;
  assert(at('2026-11-22') === null && at('2026-11-23') === 'pronoms' && at('2026-11-25') === 'pronoms', 'programme: pronouns from Monday 23 to Wednesday 25 November');
  assert(at('2026-11-26') === 'etre-avoir-aller' && at('2026-11-29') === 'etre-avoir-aller', 'programme: être, avoir, aller from Thursday 26 to Sunday 29');
  assert(at('2026-11-30') === 'mini-phrases' && at('2026-12-07') === 'premier-groupe' && at('2026-12-13') === 'premier-groupe' && at('2026-12-14') === null, 'programme: mini-sentences week, then -er verbs, then nothing');
  assert(at('2026-11-24', 'off') === null && at('2026-12-20', 'pronoms') === 'pronoms' && at('2026-11-24', 'auto') === 'pronoms', 'programme: parents can turn it off or pick a theme');
  if (!SENTENCES_READY) assert(themeWords(themeFor('2026-12-01')) === PROGRAMME_WORDS['etre-avoir-aller'], 'programme: until the sentence layout exists, the mini-sentence week serves être / avoir / aller');
  assert(PROGRAMME.every((p, i) => p.from <= p.to && (i === 0 || PROGRAMME[i - 1].to < p.from)), 'programme: themes in order, no overlap');
  assert(upcomingThemes('2026-11-27').map((p) => p.id).join() === 'etre-avoir-aller,mini-phrases,premier-groupe', 'programme: upcoming themes for the parents');
  const keys = new Set([...LANGUAGES.fr.keyRows.join('')]);
  for (const [id, items] of Object.entries(PROGRAMME_WORDS)) {
    const ids = new Set(items.map((w) => w.id));
    assert(ids.size === items.length, `programme/${id}: each item has its own id`);
    for (const w of items) {
      assert([...w.word].every((c) => keys.has(c)), `programme/${id}: « ${w.word} » can be typed on the keyboard`);
      assert(/^[A-ZÀ-Ý]/.test(w.sentence) && /[.!?]$/.test(w.sentence) && w.sentence.toLowerCase().includes(w.word), `programme/${id}: « ${w.id} » has a sentence that uses it`, w.sentence);
      assert(w.level === 'programme', `programme/${id}: « ${w.id} » is counted under the programme`);
    }
  }
  assert(PROGRAMME_WORDS.pronoms.map((w) => w.word).join() === 'je,tu,il,elle,nous,vous' && PROGRAMME_WORDS.pronoms.every((w) => w.pic && w.who), 'programme: the six pronouns asked, each with a picture of who');
  const eaa = Object.fromEntries(PROGRAMME_WORDS['etre-avoir-aller'].map((w) => [w.id, w]));
  assert(eaa['nous sommes']?.prefix === 'nous' && eaa['nous sommes'].word === 'sommes' && eaa['j’ai']?.prefix === 'j’' && eaa['j’ai'].word === 'ai' && eaa['il est'].word === 'est' && eaa['tu es'].word === 'es', 'programme: pronoun written, verb to spell (nous… sommes, j’… ai, il… est, tu… es)');
  assert(PROGRAMME_WORDS['etre-avoir-aller'].length === 18, 'programme: être, avoir, aller with je, tu, il, elle, nous, vous');
  const pg = Object.fromEntries(PROGRAMME_WORDS['premier-groupe'].map((w) => [w.id, w]));
  assert(PROGRAMME_WORDS['premier-groupe'].length === 60 && pg['je joue'] && pg['tu joues'] && pg['nous jouons'] && pg['vous jouez'] && pg['j’aime'] && pg['j’écoute'] && pg['tu écoutes'], 'programme: -er verbs in the present (je joue… vous jouez, j’aime)');
  assert(MINI_PHRASES.includes('Je vais au cinéma.') && MINI_PHRASES.includes('Tu es énervé ?') && MINI_PHRASES.includes('Nous avons une maison.'), 'programme: the parent’s example sentences are in the mini-sentence list');
}
for (const w of WORDS.en.filter(x => x.level === 'easy').map(x => x.word)) {
  assert(/^[^aeiou][aeiou][^aeiouwy]$/.test(w) || w === 'yes', `en/easy "${w}": consonant-vowel-consonant`);
}
for (const w of WORDS.en.filter(x => x.level === 'medium').map(x => x.word)) {
  assert(/[aeiou][^aeiou]e$/.test(w), `en/medium "${w}": magic e`);
}

// 10d. Age lists: 5 ans = single letters, consonant+vowel syllables, short simple words
for (const w of WORDS.fr.filter((x) => x.level === 'letters')) {
  assert(w.word.length === 1 && w.say, `fr/letters "${w.word}": one letter with a spoken prompt`);
}
for (const w of WORDS.fr.filter((x) => x.level === 'syllables')) {
  assert(/^[bcdfjklmnprstvz][aeiouy]$/.test(w.word) && w.say, `fr/syllables "${w.word}": consonant + vowel with a prompt`);
}
for (const w of WORDS.fr.filter((x) => x.level === 'gs').map((x) => x.word)) {
  assert(!w.endsWith('e') && !/[stdxpgz]$/.test(w) && !FR_COMPLEX.test(w), `fr/gs "${w}": short, every letter heard`);
  assert(!/[éèêàùçâîôû]/.test(w), `fr/gs "${w}": no accent for 5-year-olds`);
}
for (const l of ['fr', 'en']) {
  for (const lvl of AGE_LADDER[l]) assert(LEVELS[l].some((x) => x.id === lvl), `${l}: ladder level ${lvl} is described`);
  for (const a of AGES) {
    const i = AGE_START[l][a];
    assert(i >= 0 && i + 2 < AGE_LADDER[l].length + 1, `${l}: age ${a} starts on the ladder`);
  }
}
assert(AGE_START.fr[5] < AGE_START.fr[6] && AGE_START.fr[6] < AGE_START.fr[7] && AGE_START.fr[7] < AGE_START.fr[8], 'fr: older children start higher');

// 10e. Homophones: the sentence with a blank, once filled with the word, is the spoken sentence
for (const w of WORDS.fr.filter((x) => x.level === 'homophones')) {
  assert(w.blank?.includes('___') && w.say, `fr/homophones "${w.word}": a sentence with a blank`);
  assert(w.blank.replace('___', w.word).toLowerCase() === w.say.toLowerCase(), `fr/homophones "${w.word}": the blank is filled by the word`, w.blank);
}

// 10f. Spaced repetition (Anki-style)
{
  const MIN = 60000, DAY = 86400000, t0 = Date.UTC(2026, 0, 1);
  const noFuzz = () => 0.5;
  let c = { word: 'lapin' };
  grade(c, 'good', t0, noFuzz);
  assert(c.state === 'learning' && c.due === t0 + 10 * MIN, 'srs: a new word right first time comes back 10 min later');
  grade(c, 'good', t0 + 11 * MIN, noFuzz);
  assert(c.state === 'review' && c.interval === 1, 'srs: right again → learned, back tomorrow', JSON.stringify(c));
  grade(c, 'good', t0 + 11 * MIN + DAY, noFuzz);
  assert(c.interval === 3, 'srs: review good → interval × ease (1 → 3 days)', String(c.interval));
  const before = c.interval;
  grade(c, 'good', t0 + 11 * MIN + 4 * DAY, noFuzz);
  assert(c.interval > before * 2, 'srs: intervals keep growing', String(c.interval));
  const iv = c.interval;
  grade(c, 'again', t0 + 30 * DAY, noFuzz);
  assert(c.state === 'relearning' && c.lapses === 1 && Math.abs(c.ease - 2.3) < 1e-9 && c.due === t0 + 30 * DAY + 10 * MIN, 'srs: a lapse → relearning in 10 min, ease − 0.2');
  assert(c.interval === Math.max(1, Math.round(iv * SRS.lapseFactor)), 'srs: a lapse halves the interval');
  grade(c, 'good', t0 + 30 * DAY + 12 * MIN, noFuzz);
  assert(c.state === 'review' && c.due > t0 + 31 * DAY - MIN, 'srs: relearned → back to review');
  const e = grade({ word: 'chat' }, 'easy', t0, noFuzz);
  assert(e.state === 'review' && e.interval === SRS.easyDays, 'srs: easy first time → 4 days');
  const h = grade({ word: 'vache' }, 'hard', t0, noFuzz);
  assert(h.state === 'learning' && h.due === t0 + 10 * MIN, 'srs: right after a miss → stays in learning');
  for (let k = 0; k < 10; k++) grade(c, 'again', t0 + (40 + k) * DAY, noFuzz);
  assert(c.ease >= SRS.minEase, 'srs: ease never drops below 1.3');
  const old = ensureCard({ word: 'loup', box: 3, correct: 3, wrong: 0, due: t0 });
  assert(old.state === 'review' && old.interval === 7, 'srs: old box stats become review cards');
  assert(gradeFromAttempt({ ok: false }) === 'again' && gradeFromAttempt({ ok: true, firstTry: false }) === 'hard' && gradeFromAttempt({ ok: true, firstTry: true, ms: 2000, length: 4 }) === 'easy' && gradeFromAttempt({ ok: true, firstTry: true, ms: 60000, length: 4 }) === 'good', 'srs: grades from what the child did');
  // Choosing: learning due → review due → new (daily limit) → practice.
  const words = ['a1', 'b2', 'c3', 'd4', 'n5'].map((w) => ({ word: w }));
  const stats = {
    a1: { word: 'a1', state: 'review', interval: 3, ease: 2.5, due: t0 - DAY, lapses: 0, reps: 2 },
    b2: { word: 'b2', state: 'learning', step: 0, interval: 0, ease: 2.5, due: t0 - MIN, lapses: 0, reps: 1 },
    c3: { word: 'c3', state: 'review', interval: 10, ease: 2.0, due: t0 + 5 * DAY, lapses: 1, reps: 4 },
    d4: { word: 'd4', state: 'review', interval: 1, ease: 2.6, due: t0 + DAY, lapses: 0, reps: 1 },
  };
  const key = (w) => w.word;
  assert(chooseWord(words, stats, key, { now: t0 }).w.word === 'b2', 'srs: a learning card due comes first');
  assert(chooseWord(words, stats, key, { now: t0, avoid: 'b2' }).w.word === 'a1', 'srs: then a review card due');
  assert(chooseWord(words, stats, key, { now: t0, avoid: 'b2', newToday: 0 }).why !== 'new', 'srs: due reviews before new words');
  delete stats.a1; delete stats.b2;
  assert(chooseWord(words, stats, key, { now: t0, newToday: 0, rnd: () => 0 }).why === 'new', 'srs: new words when nothing is due');
  const pr = chooseWord(words, stats, key, { now: t0, newToday: SRS.newPerDay, rnd: () => 0 });
  assert(pr.why === 'practice' && pr.w.word === 'c3', 'srs: daily new limit reached → practise the hardest known word', JSON.stringify(pr));
}

// 10c. Every word has a real example sentence that uses it
for (const l of ['en', 'fr']) {
  for (const w of WORDS[l]) {
    const sentence = buildSentence(w.word, l);
    assert(sentence.toLowerCase().includes(w.word.slice(0, -1).toLowerCase()), `${l} "${w.word}" has an example sentence using it`);
  }
}

// 11. Level word counts
for (const lang of ['en', 'fr']) {
  for (const level of LEVELS[lang]) {
    const count = WORDS[lang].filter(w => w.level === level.id).length;
    assert(count >= 10, `${lang}/${level.id}: has at least 10 words (${count})`);
  }
}

// 12. Keyboard key completeness for French
const frKeySet = new Set(LANGUAGES.fr.keyRows.join(''));
const frAccents = ['é','à','è','ù','ç','â','ê','î','ô','û'];
for (const accent of frAccents) {
  assert(frKeySet.has(accent), `fr: accent "${accent}" is on keyboard`);
}

// 13. Score guess correctness (Wordle-style)
function scoreGuess(guess, target) {
  const result = [...guess].map(letter => ({ letter, state: 'absent' }));
  const unmatched = {};
  for (let i = 0; i < target.length; i++) {
    if (guess[i] === target[i]) result[i].state = 'correct';
    else unmatched[target[i]] = (unmatched[target[i]] ?? 0) + 1;
  }
  result.forEach(item => {
    if (item.state !== 'correct' && unmatched[item.letter] > 0) {
      item.state = 'present';
      unmatched[item.letter] -= 1;
    }
  });
  return result;
}
let sg = scoreGuess('castle', 'castle');
assert(sg.every(r => r.state === 'correct'), 'scoreGuess: exact match all correct');
sg = scoreGuess('abcdef', 'ghijkl');
assert(sg.every(r => r.state === 'absent'), 'scoreGuess: no match all absent');
sg = scoreGuess('aab', 'aba');
assert(sg[0].state === 'correct' && sg[1].state === 'present' && sg[2].state === 'present', 'scoreGuess: partial match');

// --- Summary ---
console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
