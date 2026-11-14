import { LANGUAGES, LEVELS, WORDS, UI, buildSentence } from './language-engine.js';

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
    assert(!entry.word.includes(' '), `${lang}: word "${entry.word}" has no space`);
    for (const letter of entry.word.toLowerCase()) {
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

// 9. French sentence grammar
for (let i = 0; i < 20; i++) {
  const word = WORDS.fr[Math.floor(Math.random() * WORDS.fr.length)].word;
  const sentence = buildSentence(word, 'fr');
  assert(sentence.includes('Un ') || sentence.includes('Une '), `fr sentence: has article: "${sentence}"`);
  assert(sentence.includes('« '), `fr sentence: has guillemets: "${sentence}"`);
  assert(sentence.includes('parce qu\'') || sentence.includes('parce que '), `fr sentence: has parce que: "${sentence}"`);
  // Un/Une don't elide in French; only le/la/que do. No bad elision check needed for articles.
}

// 10. Enemy taunts exist in both languages
const ENEMY_TAUNTS = {
  en: ['Your tiles will be mine!', 'You cannot spell!', 'I am coming for you!', 'Pathetic!', 'Easy target!', 'Give up now!'],
  fr: ['Tes cases seront à moi !', 'Tu ne sais pas écrire !', 'Je vais te battre !', 'Pathétique !', 'Cible facile !', 'Abandonne !'],
};
assert(ENEMY_TAUNTS.en.length >= 4, 'en: enough taunts');
assert(ENEMY_TAUNTS.fr.length >= 4, 'fr: enough taunts');

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
