import { LANGUAGES, LEVELS, WORDS, UI, buildSentence, AGE_LADDER, AGE_START, AGES } from './language-engine.js';
import { GameScene } from './scene.js';
import { NPC_INFO, QUESTS, rollLoot, WORD_EMOJI } from './content.js';
import { COSTUMES, playAction } from './characters.js';
import { loadModel, recognize, inkBox } from './handwriting.js';
import { SPELLS, spellById, spellWord } from './magic.js';
import { SRS, ensureCard, grade as srsGrade, gradeFromAttempt, chooseWord } from './srs.js';
import { CHAPTERS, SCENES, SPEAKERS, SIGNS, signWord, MIMOTS } from './story.js';
import { TRAVEL, LAVA, LAVA_FLAGS } from './regions.js';
import { setSignText } from './story3d.js';
import { BOSSES } from './bosses.js';
import { PET_NAMES } from './pet.js';
import { DECOR } from './decor.js';
import { PLACES, DISCOVER_RADIUS } from './landmarks.js';
import { ANIMAL_KINDS } from './fauna.js';
import { HORSES } from './horse.js';

const STORAGE_KEY = 'spelling-empires-v2';
const MAX_TRIES = 3;
const FIRST_TRY_STARS = 3;
const RETRY_STARS = 1;
const MAX_GUESS_LENGTH = 20;

const ENEMY_TAUNTS = {
  en: ['Your tiles will be mine!', 'Here I come!', 'Watch out!', 'I want that tile!', 'Get ready!', 'Here I go!'],
  fr: ['Tes cases seront à moi !', 'Me voilà !', 'Fais attention !', 'Je veux cette case !', 'Prépare-toi !', 'J\'arrive !'],
};

// Recipes. `parts` are material ids; `requires` are objects you must already own (they are kept).
// Tiered tools (`pickaxe_diamond`, ...) replace the lower tier in the hand.
const CRAFTABLES = [
  { id: 'pickaxe', emoji: '⛏️', name: { en: 'Pickaxe', fr: 'Pioche' }, parts: ['iron', 'wood', 'stone'] },
  { id: 'axe', emoji: '🪓', name: { en: 'Axe', fr: 'Hache' }, parts: ['iron', 'wood', 'wood'] },
  { id: 'scythe', emoji: '🌙', name: { en: 'Scythe', fr: 'Faux' }, parts: ['iron', 'iron', 'wood'] },
  { id: 'hammer', emoji: '🔨', name: { en: 'Hammer', fr: 'Marteau' }, parts: ['iron', 'stone', 'wood'] },
  { id: 'sword', emoji: '⚔️', name: { en: 'Sword', fr: 'Épée' }, parts: ['iron', 'wood', 'fire'] },
  { id: 'torch', emoji: '🔦', name: { en: 'Torch', fr: 'Torche' }, parts: ['wood', 'fire', 'iron'] },
  { id: 'bread', emoji: '🍞', name: { en: 'Bread', fr: 'Pain' }, parts: ['wheat', 'fire', 'water'] },
  { id: 'potion', emoji: '🧪', name: { en: 'Potion', fr: 'Potion' }, parts: ['water', 'flower', 'crystal'] },
  { id: 'wand', emoji: '🪄', name: { en: 'Magic wand', fr: 'Baguette magique' }, parts: ['wood', 'crystal', 'flower'] },
  { id: 'rod', emoji: '🎣', name: { en: 'Fishing rod', fr: 'Canne à pêche' }, parts: ['wood', 'wood', 'cloth'] },
  { id: 'lantern', emoji: '🏮', name: { en: 'Magic lantern', fr: 'Lanterne magique' }, parts: ['mushroom', 'mushroom', 'iron'] },
  { id: 'house', emoji: '🏠', name: { en: 'House', fr: 'Maison' }, parts: ['wood', 'stone', 'wood'] },
  { id: 'boat', emoji: '⛵', name: { en: 'Boat', fr: 'Bateau' }, parts: ['wood', 'wood', 'cloth'] },
  { id: 'pickaxe_diamond', emoji: '💎', name: { en: 'Diamond pickaxe', fr: 'Pioche en diamant' }, parts: ['diamond', 'diamond', 'wood'], requires: ['pickaxe', 'hammer'] },
  { id: 'sword_diamond', emoji: '💎', name: { en: 'Diamond sword', fr: 'Épée en diamant' }, parts: ['diamond', 'diamond', 'iron'], requires: ['sword', 'hammer'] },
  // Repeatable recipes (`repeat`): the result goes into the bag, as many times as you like.
  { id: 'brochette', emoji: '🍢', name: { en: 'Skewer', fr: 'Brochette' }, parts: ['meat', 'wood', 'fire'], repeat: true },
  { id: 'bucket', emoji: '🪣', name: { en: 'Lava bucket', fr: 'Seau de lave' }, parts: ['iron', 'fire', 'stone'] },
  // For the puppy (shown once it is tamed); it does not count towards finishing the game.
  // Horse armour (made once a horse is tamed): iron, then diamond. Zombies bounce off it.
  { id: 'horse_armor_iron', emoji: '🐴', name: { en: 'Iron horse armour', fr: 'Armure de cheval en fer' }, parts: ['iron', 'iron', 'iron'], needsHorse: true, extra: true },
  { id: 'horse_armor_diamond', emoji: '🐎', name: { en: 'Diamond horse armour', fr: 'Armure de cheval en diamant' }, parts: ['diamond', 'diamond', 'iron'], requires: ['horse_armor_iron'], needsHorse: true, extra: true },
  { id: 'heart_pie', emoji: '🥧', name: { en: 'Heart pie', fr: 'Tarte du cœur' }, parts: ['wheat', 'flower', 'fire'], extra: true },
  { id: 'dog_armor', emoji: '🛡️', name: { en: 'Dog armour', fr: 'Armure du chien' }, parts: ['iron', 'iron', 'wood'], needsPet: true, extra: true },
  { id: 'axe_obsidian', emoji: '🟪', name: { en: 'Obsidian axe', fr: 'Hache en obsidienne' }, parts: ['obsidian', 'obsidian', 'diamond'], requires: ['axe', 'hammer'] },
];
const itemName = (item) => item.name[lang] ?? item.name.en;
const craftable = (id) => CRAFTABLES.find((c) => c.id === id);
// Recipes that count towards finishing the game (repeatable ones do not).
const FINITE_CRAFTS = CRAFTABLES.filter((c) => !c.repeat && !c.extra);

// Crafted objects the hero can carry and use with the action button.
const HOLDABLE_IDS = ['pickaxe', 'axe', 'scythe', 'hammer', 'sword', 'torch', 'lantern', 'rod', 'wand', 'potion', 'bread', 'bucket'];
// Best owned version of a tool (diamond beats iron, obsidian beats diamond).
function bestVersion(base) {
  const owned = (game?.crafted ?? []).filter((id) => id === base || id.startsWith(`${base}_`));
  const rank = (id) => (id.endsWith('_obsidian') ? 2 : id.endsWith('_diamond') ? 1 : 0);
  return owned.sort((a, b) => rank(b) - rank(a))[0] ?? null;
}
const ownsTool = (base) => !!bestVersion(base);

const MATERIAL_EMOJI = {
  iron: '⛓️', wood: '🪵', fire: '🔥', stone: '🪨', wheat: '🌾',
  water: '💧', cloth: '🧵', flower: '🌸', crystal: '🔮', diamond: '💎', obsidian: '🟪', mushroom: '🍄', fish: '🐟', meat: '🍖', brochette: '🍢',
};

// Each building yields its own materials. Spelling words come from the level word list,
// never from the material names.
const MATERIAL_FR = {
  iron: 'fer', wood: 'bois', fire: 'feu', stone: 'pierre', wheat: 'blé',
  water: 'eau', cloth: 'toile', flower: 'fleur', crystal: 'cristal', diamond: 'diamant', obsidian: 'obsidienne',
  mushroom: 'champignon', fish: 'poisson', chest: 'trésor', meat: 'viande', brochette: 'brochette',
};
const TOOL_NAMES = { pickaxe: { en: 'a pickaxe', fr: 'une pioche' }, axe: { en: 'an axe', fr: 'une hache' }, scythe: { en: 'a scythe', fr: 'une faux' }, rod: { en: 'a fishing rod', fr: 'une canne à pêche' } };
// Every house offers wood among its materials so the first tools are easy to make.
const HOUSE_MATERIALS = {
  forge: ['iron', 'fire', 'stone', 'wood'],
  shop: ['cloth', 'crystal', 'iron', 'wood'],
  tavern: ['wheat', 'water', 'fire', 'wood'],
  tower: ['crystal', 'flower', 'water', 'wood'],
  cottage: ['wood', 'flower', 'wheat', 'stone'],
  guild: ['stone', 'wood', 'cloth', 'iron'],
};
const materialName = (id) => (lang === 'fr' ? MATERIAL_FR[id] : id);

let lang = 'en';
let t = UI.en;

const $ = (selector) => document.querySelector(selector);
const screens = {
  menu: $('#screen-menu'),
  game: $('#screen-game'),
  results: $('#screen-results'),
  trophy: $('#screen-trophy'),
  help: $('#screen-help'),
  parents: $('#screen-parents'),
  album: $('#screen-album'),
  wardrobe: $('#screen-wardrobe'),
};
const spellInput = $('#spell-input');
const spellTilesEl = $('#spell-tiles');
const spellRevealEl = $('#spell-reveal');
const revealTiles = $('#reveal-tiles');
const spellResultEl = $('#spell-result');
const spellKeyboard = $('#spell-keyboard');
const spellCheckBtn = $('#spell-check-btn');
const spellContinueBtn = $('#spell-continue-btn');
const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;

let progress = loadProgress();
let game = null;
let isLocked = false;
let voice = null;
let spellContext = null;
let audioCtx = null;
let streak = 0;
let scene3D = null;

function defaultProgress() {
  return { stars: 0, victories: 0, mastered: {}, difficult: {}, keyboard: true, lang: 'en', inventory: {}, crafted: [], wordStats: {}, daily: {} };
}

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const p = { ...defaultProgress(), ...saved };
    // v1.15: at 6 the grey model now comes now and then (it used to be always on).
    if (p.age === 6 && p.traceGuide === true && !p.guideAutoV15) { p.traceGuide = 'auto'; p.guideAutoV15 = true; }
    return p;
  } catch {
    return defaultProgress();
  }
}

/* ===== WORD STATISTICS (parents' dashboard) =====
   progress.wordStats["fr:vélo"] = { lang, word, level, seen, correct, wrong, firstTry, lastSeen, misspellings[] }
   progress.daily["2026-11-15"] = { attempts, correct } */
function wordStat(w) {
  progress.wordStats ??= {};
  const key = `${lang}:${w.word}`;
  progress.wordStats[key] ??= { lang, word: w.word, level: w.level, seen: 0, correct: 0, wrong: 0, firstTry: 0, lastSeen: 0, misspellings: [] };
  return progress.wordStats[key];
}
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
// Spaced repetition à la Anki (see srs.js): every attempt grades the word's card.
function recordAttempt(w, guess, ok, tries) {
  const s = wordStat(w);
  const wasNew = ensureCard(s).state === 'new';
  if (ok) { s.correct += 1; if (tries === 1) s.firstTry += 1; }
  else { s.wrong += 1; s.misspellings = [guess, ...s.misspellings].slice(0, 5); }
  // Practising a known word before it is due does not move its schedule forward (only a miss counts).
  const early = s.state === 'review' && s.due > Date.now();
  if (!(early && ok)) {
    srsGrade(s, gradeFromAttempt({
      ok, firstTry: tries === 1, copied: !!spellContext?.copyMode,
      ms: Date.now() - (spellContext?.startedAt ?? Date.now()), length: w.word.replace(/ /g, '').length, drawing: progress.inputMode === 'draw',
    }));
  }
  if (wasNew) { progress.daily ??= {}; const d = (progress.daily[todayKey()] ??= { attempts: 0, correct: 0 }); d.newCards = (d.newCards ?? 0) + 1; }
  s.lastSeen = Date.now();
  progress.daily ??= {};
  const day = (progress.daily[todayKey()] ??= { attempts: 0, correct: 0 });
  day.attempts += 1;
  if (ok) day.correct += 1;
}

function saveProgress() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...progress, lang })); } catch { /* blocked */ }
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Difficulty is part of the world: houses ask level 1, things out in the world level 2,
// and rare diamond / obsidian ores level 3.
function tierFor(obj) {
  if (obj.kind !== 'node' || obj.decor || obj.nodeType === 'fish') return 0;
  if (obj.material === 'diamond' || obj.material === 'obsidian') return 2;
  return 1;
}
function levelFor(obj) { return levelAt(tierFor(obj)); }

/* ===== AGE: which word lists a child gets ===== */
// The age picks a starting rung on the ladder; every rung the child has mastered (90 % of its
// words spelled right first time) is skipped, so the words grow with them (at most two rungs).
function ladderStart() {
  const ladder = AGE_LADDER[lang] ?? AGE_LADDER.fr;
  let start = AGE_START[lang]?.[progress.age ?? 6] ?? 0;
  for (let k = 0; k < 2 && start < ladder.length - 1; k++) {
    const words = wordsForLevel(ladder[start]);
    const done = words.filter((w) => progress.mastered[w.word]).length;
    if (words.length && done / words.length >= 0.9) start += 1; else break;
  }
  return start;
}
function levelAt(tier) {
  const ladder = AGE_LADDER[lang] ?? AGE_LADDER.fr;
  return ladder[Math.min(ladderStart() + tier, ladder.length - 1)];
}
// Levels that belong to this child (album, parents' table): from the age's rung to two above the current one.
function childLevels() {
  const ladder = AGE_LADDER[lang] ?? AGE_LADDER.fr;
  const a = AGE_START[lang]?.[progress.age ?? 6] ?? 0;
  return ladder.slice(a, Math.min(ladder.length, ladderStart() + 3));
}
// Helps that suit each age (the parents can still change them).
// At 6 the grey model letter comes now and then ('auto'): often for a new word, rarely for a word
// already known, so it helps to memorise without doing the work for the child.
function applyAgeDefaults(age) {
  progress.traceGuide = age <= 5 ? true : age === 6 ? 'auto' : false;
  if (age === 5) progress.inputMode = 'draw';
}
function setAge(age, { defaults = true } = {}) {
  const changed = progress.age !== age;
  progress.age = age;
  if (changed && defaults) applyAgeDefaults(age);
  wordQueues = {};
  saveProgress();
  if (changed) refreshSpots?.();
}
function ageButtons(container, onPick) {
  container.replaceChildren(...AGES.map((a) => {
    const b = el('button', `age-btn${progress.age === a ? ' is-on' : ''}`);
    b.type = 'button';
    b.append(document.createTextNode(String(a)), el('small', '', t.ageYears));
    b.addEventListener('click', () => onPick(a));
    return b;
  }));
}
function askAge(then) {
  ageButtons($('#age-buttons'), (a) => { setAge(a); $('#age-modal').hidden = true; then?.(); });
  $('#age-modal').hidden = false;
  speak(t.ageQuestion, 0.9);
}

function wordsForLevel(levelId) {
  return WORDS[lang].filter((w) => w.level === levelId);
}

// Words are served from a shuffled queue: tricky words first, then unmastered, then the rest,
// so a child meets every word of the level before any repeats.
let wordQueues = {};
// Anki-style choice: words due for (re)learning or review first, then new words up to the
// daily limit, then practice of known words. Now and then a word due from an easier list.
let lastPicked = '';
function pickWord(levelId = 'easy') {
  const stats = progress.wordStats ?? {};
  const key = (w) => `${lang}:${w.word}`;
  const opts = { newToday: progress.daily?.[todayKey()]?.newCards ?? 0, newPerDay: progress.newPerDay ?? SRS.newPerDay, avoid: lastPicked };
  const ladder = AGE_LADDER[lang] ?? AGE_LADDER.fr;
  const i = ladder.indexOf(levelId), a = AGE_START[lang]?.[progress.age ?? 6] ?? 0;
  let pick = null;
  if (i > a && Math.random() < 0.3) {
    const lower = ladder.slice(a, i).flatMap(wordsForLevel);
    const c = chooseWord(lower, stats, key, { ...opts, newPerDay: 0 });
    if (c && (c.why === 'learning' || c.why === 'review')) pick = c.w;
  }
  if (!pick) pick = chooseWord(wordsForLevel(levelId), stats, key, opts)?.w ?? nextQueued(levelId);
  lastPicked = pick?.word ?? '';
  return pick;
}
function nextQueued(levelId) {
  const key = `${lang}:${levelId}`;
  if (!wordQueues[key]?.length) {
    const words = shuffle(wordsForLevel(levelId));
    const rank = (w) => (progress.difficult[w.word] ? 0 : progress.mastered[w.word] ? 2 : 1);
    wordQueues[key] = words.sort((a, b) => rank(a) - rank(b));
  }
  return wordQueues[key].shift();
}

// Prefer a material that the remaining recipes still need, among those this building offers.
function pickMaterial(houseType, exclude = []) {
  const all = HOUSE_MATERIALS[houseType] ?? ['wood', 'stone', 'iron'];
  const offered = all.filter((m) => !exclude.includes(m)).length ? all.filter((m) => !exclude.includes(m)) : all;
  const need = {};
  for (const item of FINITE_CRAFTS) {
    if (game?.crafted.includes(item.id)) continue;
    for (const part of item.parts) need[part] = (need[part] ?? 0) + 1;
  }
  for (const [mat, count] of Object.entries(game?.materials ?? {})) need[mat] = (need[mat] ?? 0) - count;
  const useful = offered.filter((m) => (need[m] ?? 0) > 0);
  const pool = useful.length ? useful : offered;
  return pool[Math.floor(Math.random() * pool.length)];
}

function getBadges() {
  const b = t;
  const base = [
    { name: b.firstVictory, text: b.winFirst, earned: (p) => p.victories >= 1 },
    { name: b.starCollector, text: b.collect20, earned: (p) => p.stars >= 20 },
    { name: b.starGalaxy, text: b.collect100, earned: (p) => p.stars >= 100 },
    { name: b.wordsmith, text: b.master20, earned: (p) => Object.keys(p.mastered).length >= 20 },
    { name: b.conqueror, text: b.win3, earned: (p) => p.victories >= 3 },
    { name: b.streakMaster, text: b.streakText, earned: (p) => p.bestStreak >= 5 },
  ];
  const levelBadges = LEVELS[lang].map((level) => ({
    name: b.champion(level.name),
    text: b.master10(level.name),
    earned: (p) => Object.keys(p.mastered).filter((w) => {
      const entry = WORDS[lang].find((e) => e.word === w);
      return entry && entry.level === level.id;
    }).length >= 10,
  }));
  return [...base, ...levelBadges];
}

/* ===== SOUND EFFECTS ===== */

function initAudio() {
  if (audioCtx) return;
  try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch { audioCtx = null; }
}

function playTone(freq, duration, type = 'sine', volume = 0.15, delay = 0, glideTo = 0) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type; osc.frequency.value = freq;
  if (glideTo) { osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay); osc.frequency.exponentialRampToValueAtTime(glideTo, audioCtx.currentTime + delay + duration); }
  gain.gain.setValueAtTime(0, audioCtx.currentTime + delay);
  gain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + delay + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(audioCtx.currentTime + delay);
  osc.stop(audioCtx.currentTime + delay + duration);
}

function sfxMine() { playTone(440, 0.1, 'triangle', 0.12); playTone(660, 0.15, 'triangle', 0.12, 0.05); }
function sfxCraft() { playTone(523, 0.1, 'triangle', 0.12); playTone(659, 0.1, 'triangle', 0.12, 0.05); playTone(784, 0.2, 'triangle', 0.12, 0.1); }
function sfxError() { playTone(200, 0.15, 'sawtooth', 0.08); playTone(150, 0.2, 'sawtooth', 0.08, 0.05); }
function sfxStreak(n) { const b = 523 + n * 50; playTone(b, 0.08, 'triangle', 0.1); playTone(b * 1.25, 0.08, 'triangle', 0.1, 0.04); playTone(b * 1.5, 0.12, 'triangle', 0.1, 0.08); }
function sfxVictory() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((n, i) => playTone(n, 0.2, 'triangle', 0.15, i * 0.12)); }
function sfxType() { playTone(800, 0.03, 'square', 0.04); }

// Short filtered noise bursts: footsteps and blocks breaking (no background music).
let noiseBuffer = null;
function playNoise({ duration = 0.08, volume = 0.1, freq = 800, q = 1, type = 'bandpass', delay = 0 } = {}) {
  if (!audioCtx) return;
  if (!noiseBuffer) {
    noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.5, audioCtx.sampleRate);
    const d = noiseBuffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = audioCtx.createBufferSource();
  src.buffer = noiseBuffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = type; filter.frequency.value = freq; filter.Q.value = q;
  const gain = audioCtx.createGain();
  const t0 = audioCtx.currentTime + delay;
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  src.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
  src.start(t0, Math.random() * 0.3, duration + 0.02);
}
// A small voice synth for the animals: an oscillator gliding from f0 to f1 (with vibrato) through a
// filter, with a quick attack and a soft release. Several calls make one cry.
function animalVoice({ type = 'sawtooth', f0 = 300, f1 = f0, mid = 0, dur = 0.4, vib = 0, vibRate = 7, filter = 'bandpass', freq = 1200, q = 1.2, vol = 0.1, delay = 0 } = {}) {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t0);
  if (mid) { osc.frequency.linearRampToValueAtTime(mid, t0 + dur * 0.4); osc.frequency.linearRampToValueAtTime(f1, t0 + dur); }
  else osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
  if (vib) {
    const lfo = audioCtx.createOscillator(), lg = audioCtx.createGain();
    lfo.frequency.value = vibRate; lg.gain.value = vib;
    lfo.connect(lg); lg.connect(osc.frequency);
    lfo.start(t0); lfo.stop(t0 + dur + 0.05);
  }
  const f = audioCtx.createBiquadFilter();
  f.type = filter; f.frequency.value = freq; f.Q.value = q;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.03, dur * 0.2));
  g.gain.setValueAtTime(vol, t0 + dur * 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(f); f.connect(g); g.connect(audioCtx.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
}
const ANIMAL_CRIES = {
  sheep: () => animalVoice({ f0: 310, f1: 290, dur: 0.65, vib: 22, vibRate: 9, freq: 1300, q: 2, vol: 0.09 }),
  lamb: () => animalVoice({ f0: 470, f1: 440, dur: 0.5, vib: 30, vibRate: 10, freq: 1600, q: 2, vol: 0.08 }),
  goat: () => animalVoice({ f0: 380, f1: 340, dur: 0.6, vib: 35, vibRate: 11, freq: 1400, q: 2, vol: 0.09 }),
  llama: () => animalVoice({ type: 'triangle', f0: 420, f1: 300, dur: 0.5, vib: 12, freq: 1100, vol: 0.09 }),
  cow: () => animalVoice({ f0: 150, mid: 165, f1: 115, dur: 1.0, filter: 'lowpass', freq: 650, q: 1, vol: 0.13 }),
  pig: () => { for (let i = 0; i < 3; i++) { animalVoice({ type: 'square', f0: 190, f1: 140, dur: 0.09, filter: 'lowpass', freq: 600, vol: 0.08, delay: i * 0.13 }); playNoise({ freq: 450, q: 2, volume: 0.05, duration: 0.08, delay: i * 0.13 }); } },
  chicken: () => { for (let i = 0; i < 3; i++) animalVoice({ type: 'triangle', f0: 760, f1: 560, dur: 0.06, freq: 1500, vol: 0.08, delay: i * 0.1 }); animalVoice({ type: 'triangle', f0: 600, mid: 950, f1: 700, dur: 0.28, freq: 1600, vol: 0.08, delay: 0.32 }); },
  duck: () => { for (let i = 0; i < 2; i++) animalVoice({ f0: 470, f1: 380, dur: 0.14, freq: 900, q: 4, vol: 0.09, delay: i * 0.2 }); },
  frog: () => { for (let i = 0; i < 2; i++) animalVoice({ type: 'square', f0: 170, f1: 140, dur: 0.16, vib: 60, vibRate: 35, filter: 'lowpass', freq: 500, vol: 0.08, delay: i * 0.22 }); },
  cat: () => animalVoice({ type: 'triangle', f0: 560, mid: 900, f1: 480, dur: 0.6, freq: 1500, q: 2, vol: 0.08 }),
  wolf: () => animalVoice({ type: 'sine', f0: 380, mid: 720, f1: 520, dur: 1.3, vib: 8, vibRate: 5, filter: 'lowpass', freq: 1500, vol: 0.09 }),
  fox: () => { for (let i = 0; i < 2; i++) animalVoice({ f0: 950, f1: 620, dur: 0.1, freq: 1300, vol: 0.07, delay: i * 0.16 }); },
  horse: () => animalVoice({ f0: 820, mid: 950, f1: 380, dur: 0.9, vib: 70, vibRate: 18, freq: 1400, q: 1.5, vol: 0.09 }),
  panda: () => { playNoise({ type: 'lowpass', freq: 260, q: 1, volume: 0.12, duration: 0.5 }); animalVoice({ f0: 110, f1: 90, dur: 0.45, filter: 'lowpass', freq: 300, vol: 0.08 }); },
  polarBear: () => { playNoise({ type: 'lowpass', freq: 200, q: 1, volume: 0.14, duration: 0.6 }); animalVoice({ f0: 90, f1: 70, dur: 0.55, filter: 'lowpass', freq: 260, vol: 0.1 }); },
  parrot: () => { animalVoice({ type: 'triangle', f0: 1400, f1: 1200, dur: 0.12, freq: 2200, vol: 0.07 }); animalVoice({ type: 'triangle', f0: 1100, f1: 1300, dur: 0.14, freq: 2200, vol: 0.07, delay: 0.16 }); },
  crab: () => { for (let i = 0; i < 3; i++) playNoise({ freq: 3000, q: 4, volume: 0.07, duration: 0.025, delay: i * 0.08 }); },
};
ANIMAL_CRIES.sheepBlack = ANIMAL_CRIES.sheepBrown = ANIMAL_CRIES.sheepPink = ANIMAL_CRIES.sheep;
const STEP_SOUNDS = {
  grass: { freq: 1400, q: 0.7, volume: 0.05, duration: 0.07 },
  dirt: { freq: 700, q: 0.9, volume: 0.07, duration: 0.07 },
  stone: { freq: 2200, q: 2.5, volume: 0.06, duration: 0.05 },
  wood: { freq: 380, q: 3, volume: 0.1, duration: 0.09 },
};
function sfxStep(surface) { playNoise(STEP_SOUNDS[surface] ?? STEP_SOUNDS.grass); }
function sfxBreak() {
  playNoise({ freq: 500, q: 0.8, volume: 0.22, duration: 0.18 });
  playNoise({ freq: 1600, q: 1.5, volume: 0.12, duration: 0.12, delay: 0.03 });
  playTone(110, 0.15, 'triangle', 0.15);
}
function sfxJump() { playNoise({ freq: 900, q: 0.8, volume: 0.05, duration: 0.06 }); }

/* ===== VISUAL EFFECTS ===== */

function showFloatingText(x, y, text, color) {
  const float = el('div', 'floating-text', text);
  float.style.left = `${x}px`; float.style.top = `${y}px`; float.style.color = color;
  document.body.appendChild(float);
  setTimeout(() => float.remove(), 1200);
}

function launchConfetti() {
  const colors = ['#1d6fd8', '#d9472b', '#178a48', '#f59e0b', '#ffc233', '#e5484d', '#9b59b6'];
  for (let i = 0; i < 80; i++) {
    const c = el('div', 'confetti');
    c.style.left = `${Math.random() * 100}vw`;
    c.style.background = colors[Math.floor(Math.random() * colors.length)];
    c.style.animationDelay = `${Math.random() * 0.5}s`;
    c.style.animationDuration = `${1.5 + Math.random() * 1.5}s`;
    c.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`);
    c.style.setProperty('--drift', `${Math.random() * 200 - 100}px`);
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 3500);
  }
}

/* ===== VOICE ===== */

function chooseVoice() {
  if (!synth) return;
  const voices = synth.getVoices();
  const targetLang = lang === 'fr' ? 'fr' : 'en';
  const langVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(targetLang));
  if (lang === 'fr') {
    voice = langVoices.find((v) => /amélie|audrey|thomas|google français|virginie|marie/i.test(v.name)) ?? langVoices[0] ?? null;
  } else {
    voice = langVoices.find((v) => /daniel|kate|serena|google uk/i.test(v.name)) ?? langVoices[0] ?? null;
  }
}

function speak(text, rate = 0.9) {
  if (!synth) return;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === 'fr' ? 'fr-FR' : 'en-GB';
  u.rate = rate; if (voice) u.voice = voice;
  synth.speak(u);
}

function stopSpeaking() { if (synth) synth.cancel(); }

/* ===== LANGUAGE ===== */

function setLanguage(newLang) {
  lang = newLang; t = UI[lang] ?? UI.en;
  document.documentElement.lang = lang === 'fr' ? 'fr' : 'en-GB';
  chooseVoice(); applyUIText(); saveProgress();
  refreshSpots();
  if (document.body.dataset.screen === 'parents') renderDashboard();
}

// The game's name drawn as falling grass blocks (the last word in gold).
function renderTitleTiles() {
  const h = $('.title-name');
  if (!h) return;
  let i = 0;
  const words = t.title.split(' ');
  h.setAttribute('aria-label', t.title);
  h.replaceChildren(...words.map((w, wi) => {
    const word = el('span', 'title-word');
    for (const ch of w) {
      const tile = el('span', `title-tile${wi === words.length - 1 ? ' is-gold' : ''}`, ch.toUpperCase());
      tile.style.setProperty('--i', i++);
      tile.setAttribute('aria-hidden', 'true');
      word.append(tile);
    }
    return word;
  }));
}

function applyUIText() {
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n;
    if (t[key]) node.textContent = t[key];
  });
  const langBtn = $('#lang-btn');
  if (langBtn) { langBtn.textContent = LANGUAGES[lang].flag; langBtn.setAttribute('aria-label', LANGUAGES[lang].label); }
  document.title = t.title;
  renderTitleTiles();
  const brandName = $('.brand-name');
  if (brandName) brandName.textContent = t.title;
  const brandIcon = $('.brand-icon');
  if (brandIcon) brandIcon.textContent = lang === 'fr' ? 'EM' : 'SE';
  if (game) updateGameUI();
  renderHelp(); buildSpellKeyboard(); renderCraftMenu();
  const activeScreen = Object.entries(screens).find(([, s]) => s.classList.contains('is-active'));
  if (activeScreen) {
    if (activeScreen[0] === 'menu') renderMenu();
    if (activeScreen[0] === 'trophy') renderTrophy();
  }
}

function toggleLanguage() { setLanguage(lang === 'en' ? 'fr' : 'en'); }

/* ===== SCREENS ===== */

function showScreen(name) {
  for (const [key, node] of Object.entries(screens)) node.classList.toggle('is-active', key === name);
  document.body.dataset.screen = name;
  stopSpeaking();
  if (scene3D) scene3D.mode = name === 'game' ? 'play' : name === 'menu' ? 'title' : 'paused';
  if (name === 'game') {
    if (!scene3D) init3DScene();
    requestAnimationFrame(() => scene3D?.resize());
    // The hint fades after a few seconds so the world stays clear.
    const hint = $('#map-instruction');
    hint?.classList.remove('is-faded');
    clearTimeout(showScreen.hintTimer);
    showScreen.hintTimer = setTimeout(() => hint?.classList.add('is-faded'), 7000);
  }
  if (name === 'menu') renderMenu();
  if (name === 'trophy') renderTrophy();
  if (name === 'parents') renderDashboard();
  if (name === 'album') renderAlbum();
  if (name === 'wardrobe') renderWardrobe();
  window.scrollTo(0, 0);
}

function init3DScene() {
  const container = $('#canvas-container');
  if (!container) return;
  scene3D = new GameScene(container);
  scene3D.onLava = () => knockOut('lava');
  scene3D.onZombieCatch = zombieTouch;
  setupPet();
  if (scene3D.bosses) scene3D.bosses.onGrumble = () => { playNoise({ freq: 120, q: 0.7, volume: 0.12, duration: 0.5 }); playTone(70, 0.45, 'sawtooth', 0.05); };
  setupFauna();
  scene3D.onDismount = () => { const h = scene3D.horses.list.find((x) => x.tamed && !x.leftAt); $('#dismount-btn').hidden = true; };
  scene3D.onHorseBlock = () => { sfxHit(); if (!horseBlockSaid) { horseBlockSaid = true; toast(t.horseBlock, 3500); } };
  scene3D.onObsidian = (n) => { if (n) { sfxCraft(); toast(t.obsidianMade, 4000); speak(t.obsidianMade.replace(/^\S+ /, ''), 0.95); } };
  scene3D.onMeatPickup = onMeatPickup;
  scene3D.onZombieBurnt = onZombieBurnt;
  scene3D.canBeAttacked = () => !!game && document.body.dataset.screen === 'game' && $('#spell-modal').hidden && $('#dialog').hidden && $('#travel-modal').hidden && $('#quest-modal')?.hidden !== false && !knocking;
  scene3D.zombies.enabled = progress.zombies !== false;
  scene3D.onLavaPillar = (role) => { if (game) onLavaPillar(role); };
  // ?test exposes the game to the automated playthrough tests (tests/e2e).
  if (/[?&]test\b/.test(location.search)) {
    window.__se = Object.assign(window.__se ?? {}, { scene: scene3D, game: () => game, spell: () => spellContext, progress: () => progress, levelAt: (tier) => levelAt(tier), pickWord: (lvl) => pickWord(lvl) });
  }
  scene3D.onInteract = () => tryInteract();
  scene3D.onInteractObject = (obj) => interactWith(obj);
  scene3D.minimapCanvas = $('#minimap');
  scene3D.onStep = (surface) => sfxStep(surface);
  scene3D.onJump = () => sfxJump();
  scene3D.onDayPhase = (phase) => {
    $('#hud-time').textContent = phase === 'night' ? '🌙' : '☀️';
    refreshBed();
    if (document.body.dataset.screen === 'game') toast(phase === 'night' ? (scene3D.zombies?.enabled ? t.zombieNight : t.nightFalls) : t.dayBreaks);
  };
  applyCostume();
  refreshSpots();
}

// Each house spot shows (and gives) a material picked for the current recipes.
function refreshSpots() {
  const taken = {};
  for (const obj of scene3D?.interactables ?? []) {
    let id = obj.material;
    if (obj.kind === 'npc') id = questFor(obj.npcId) ? 'talk' : 'done';
    else if (obj.kind === 'bed') { refreshBed(obj); continue; }
    else if (obj.kind === 'circle') { refreshCircle(obj); continue; }
    else if (['sign', 'mimot', 'page', 'travel', 'book', 'boss', 'pet', 'portal', 'horse'].includes(obj.kind)) continue;
    else if (obj.kind === 'house') {
      // Spots in the same house show different materials.
      taken[obj.name] ??= [];
      id = pickMaterial(obj.houseType, taken[obj.name]);
      taken[obj.name].push(id);
    }
    scene3D.setSpotMaterial(obj, id, spotLabel(obj, id));
  }
  if (game?.story) applyStoryState();
}

// Text shown under each floating material: its name, plus the tool needed out in the world.
function spotLabel(obj, id) {
  if (obj.kind === 'npc') return NPC_INFO[obj.npcId]?.name[lang] ?? obj.npcId;
  const tool = obj.requires ? ` ${craftable(obj.requires)?.emoji ?? ''}` : '';
  return `${materialName(id)}${tool}`;
}

/* ===== SAVED GAME (kept between sessions) ===== */

function saveGame() {
  if (!game) return;
  progress.save = {
    levelId: game.levelId,
    materials: game.materials,
    crafted: game.crafted,
    equipped: game.equipped ?? null,
    starsEarned: game.starsEarned,
    wordsSpelled: game.wordsSpelled,
    quests: game.quests ?? {},
    chests: game.chests ?? 0,
    fish: game.fish ?? 0,
    spells: game.spells ?? {},
    story: game.story,
    parkour: game.parkour ?? null,
    fountainRaised: !!game.fountainRaised,
    pet: game.pet ?? null,
    bosses: game.bosses ?? [],
    bossesAnnounced: game.bossesAnnounced ?? [],
    places: game.places ?? [],
    portalLit: !!game.portalLit,
    maxHearts: game.maxHearts ?? 2,
    horses: game.horses ?? {},
    heartsFrom: game.heartsFrom ?? [],
    savedAt: Date.now(),
  };
  saveProgress();
}

function continueGame() {
  const s = progress.save;
  if (!s) return;
  newGame(s.levelId, { keepSave: true });
  Object.assign(game, {
    materials: { ...s.materials },
    crafted: [...s.crafted],
    starsEarned: s.starsEarned ?? 0,
    wordsSpelled: s.wordsSpelled ?? 0,
    quests: { ...(s.quests ?? {}) },
    chests: s.chests ?? 0,
    fish: s.fish ?? 0,
    spells: { ...(s.spells ?? {}) },
    story: { ...newStory(), ...(s.story ?? {}) },
    parkour: s.parkour ?? null,
    fountainRaised: !!s.fountainRaised,
    pet: s.pet ?? null,
    bosses: [...(s.bosses ?? [])],
    bossesAnnounced: [...(s.bossesAnnounced ?? [])],
    places: [...(s.places ?? [])],
    portalLit: !!s.portalLit,
    maxHearts: s.maxHearts ?? 2,
    horses: JSON.parse(JSON.stringify(s.horses ?? {})),
    heartsFrom: [...(s.heartsFrom ?? [])],
  });
  // Lasting spells come back: the bridge, the lit braziers.
  for (const [key, power] of Object.entries(game.spells)) {
    const circle = scene3D?.interactables.find((o) => o.kind === 'circle' && o.cid === key);
    if (!circle || !['pont', 'feu', 'vent'].includes(circle.spellId)) continue;
    scene3D?.castSpell(circle.spellId, circle, power, { silent: true });
  }
  for (const id of game.crafted) if (!HOLDABLE_IDS.includes(id.split('_')[0])) scene3D?.spawnTrophy(id);
  game.equipped = null;
  if (s.equipped && game.crafted.includes(s.equipped)) equipItem(s.equipped);
  refreshSpots();
  updateGameUI();
  renderCraftMenu();
  applyStoryState();
  restoreLava();
  if (!game.story.intro) { game.story.intro = true; setTimeout(() => playScene('intro'), 600); }
}

/* ===== GAME STATE ===== */

function newGame(levelId = 'mixed', { keepSave = false, afterReload = false } = {}) {
  // A new game starts again from zero: stars, outfits, cottage decorations, the puppy, the bosses,
  // the places… (the word learning — what the child knows — is kept for the parents' corner; it is
  // erased there with "Erase the statistics"). And a fresh world, so the page reloads.
  if (!keepSave && !afterReload) {
    delete progress.save;
    progress.stars = 0;
    progress.victories = 0;
    progress.bestStreak = 0;
    delete progress.costumes;
    delete progress.decor;
    delete progress.petBarkExplained;
    delete progress.petBiteExplained;
    saveProgress();
    if (scene3D) {
      try { sessionStorage.setItem('se-new-game', '1'); } catch { /* ignore */ }
      location.reload();
      return;
    }
  }
  if (!keepSave) delete progress.save;
  game = {
    levelId,
    materials: {},
    crafted: [],
    starsEarned: 0,
    wordsSpelled: 0,
    moves: 0,
    log: [],
    questIndex: 0,
    story: newStory(),
  };
  wordQueues = {};
  streak = 0;
  scene3D?.setHeldItem(null);
  updateStreakDisplay();
  showScreen('game');
  if (!scene3D) init3DScene();
  else refreshSpots();
  updateGameUI();
  renderCraftMenu();
  saveGame();
  if (!keepSave) {
    game.story.intro = true;
    setTimeout(() => { applyStoryState(); playScene('intro'); }, 700);
  }
}

function updateGameUI() {
  renderEquipBar();
  $('#total-stars').textContent = progress.stars;
  if ($('#hud-stars')) $('#hud-stars').textContent = progress.stars;
  const matContainer = $('#materials-display');
  if (matContainer) {
    matContainer.replaceChildren(...Object.entries(game.materials).map(([mat, count]) => {
      const chip = el('span', 'material-chip', `${MATERIAL_EMOJI[mat] ?? ''} ${materialName(mat)} ×${count}`);
      chip.title = mat;
      return chip;
    }));
    if (Object.keys(game.materials).length === 0) {
      matContainer.appendChild(el('span', 'material-empty', t.noMaterials));
    }
  }
}

function tryInteract() {
  if (!scene3D || !game) return;
  const obj = scene3D.getNearbyInteractable();
  if (!obj) return;
  interactWith(obj);
}

// World nodes need the right tool; houses don't.
function interactWith(obj) {
  if (!game || !$('#spell-modal').hidden || !obj.active || !$('#dialog').hidden || !$('#travel-modal').hidden) return;
  if (!$('#quest-modal').hidden || fishing) return;
  if (obj.kind === 'npc' && obj.npcId === 'mage' && storyAt('talkMage')) { playScene('mage1', () => { advanceStory('talkMage'); toast('🔮 ' + t.grimoireTitle + ' !'); }); return; }
  if (obj.kind === 'npc' && (obj.npcId === 'forester' || obj.npcId === 'fisher')) {
    const id = obj.npcId;
    if (storyAt(id)) playScene(id, () => advanceStory(id)); else playScene(`${id}Idle`);
    return;
  }
  if (obj.kind === 'book' || (obj.kind === 'npc' && obj.npcId === 'alaricTower')) {
    if (storyAt('readBook')) playScene('readBook', () => advanceStory('readBook')); else toast(t.bookLocked);
    return;
  }
  if (obj.kind === 'npc' && obj.npcId === 'alaricIsland') {
    if (storyAt('finale')) playScene('finale', () => { advanceStory('finale'); showEnding(); });
    return;
  }
  if (obj.kind === 'npc' && obj.npcId === 'merchant' && (game.materials.brochette ?? 0) > 0) { giveBrochette(); return; }
  if (obj.kind === 'npc') { openQuest(obj); return; }
  if (obj.kind === 'bed') { goToSleep(); return; }
  if (obj.kind === 'circle') {
    if (!storyPast('talkMage')) { toast(t.talkToMageFirst); return; }
    beginSpellCast(obj); return;
  }
  if (obj.kind === 'sign') { beginSign(obj); return; }
  if (obj.kind === 'mimot') { beginMimot(obj); return; }
  if (obj.kind === 'boss') { beginBoss(obj); return; }
  if (obj.kind === 'pet') { petInteract(); return; }
  if (obj.kind === 'portal') { usePortal(); return; }
  if (obj.kind === 'horse') { horseInteract(obj); return; }
  if (obj.kind === 'page') { scene3D.setStoryActive(obj, false); playScene(obj.scene, () => advanceStory(obj.pageId)); return; }
  if (obj.kind === 'travel') { useTravelSign(obj); return; }
  if (obj.nodeType === 'fish' && ownsTool('rod')) {
    if (game.equipped !== bestVersion('rod')) equipItem(bestVersion('rod'));
    startFishing(obj);
    return;
  }
  if (obj.requires) {
    const tool = bestVersion(obj.requires);
    if (!tool) {
      const pos = scene3D?.getPlayerScreenPosition();
      const msg = `${t.needTool} ${TOOL_NAMES[obj.requires]?.[lang] ?? obj.requires} !`;
      if (pos) showFloatingText(pos.x, pos.y - 40, msg, '#ffffff');
      speak(msg, 0.95);
      return;
    }
    if (game.equipped !== tool) equipItem(tool);
    scene3D.useItem(tool);
    setTimeout(() => beginMine(obj), 420);
    return;
  }
  beginMine(obj);
}

/* ===== MINING ===== */

function beginMine(mineObj) {
  initAudio();
  const word = pickWord(levelFor(mineObj));
  const material = mineObj.material ?? pickMaterial(mineObj.houseType);
  const emoji = MATERIAL_EMOJI[material] ?? '⛏️';
  spellContext = { type: 'mine', mineObj, word, tries: 0, material };
  const instruction = { letters: t.mineInstructionLetter, syllables: t.mineInstructionSyllable, homophones: t.mineInstructionHomophone, phrases: t.mineInstructionPhrase }[word.level] ?? t.mineInstruction;
  openSpellModal(`${emoji} ${t.mineTitle}`, instruction, emoji);
}

// The spelling window, for whatever spellContext holds (mining, a spell…).
function openSpellModal(title, instruction, emoji) {
  const word = spellContext.word;
  spellContext.startedAt = Date.now();
  playSinceWord = 0;
  const stat = wordStat(word);
  stat.seen += 1;
  stat.lastSeen = Date.now();
  saveProgress();
  $('#spell-title').textContent = title;
  hw.wordGuide = progress.traceGuide === 'auto' && Math.random() < (stat.correct === 0 ? 0.75 : stat.correct < 3 ? 0.4 : 0.15);
  setTimeout(() => { hw.strokes = []; hw.current = null; hw.misses = 0; hw.forceGuide = false; hwFeedback(); $('#hw-alts')?.replaceChildren(); setInputMode(progress.inputMode ?? 'keys'); }, 0);
  $('#spell-instruction').textContent = instruction;
  // Homophones: show the sentence with a blank where the little word goes.
  const ctxEl = $('#spell-context');
  if (word.blank) {
    const [before, after] = word.blank.split('___');
    ctxEl.replaceChildren(document.createTextNode(before), el('span', 'blank', '\u00a0'), document.createTextNode(after));
    ctxEl.hidden = false;
  } else ctxEl.hidden = true;
  $('#spell-emoji').textContent = emoji;
  $('#spell-emoji').hidden = false;
  spellInput.value = '';
  spellRevealEl.hidden = true;
  spellResultEl.hidden = true;
  spellCheckBtn.hidden = false;
  spellContinueBtn.hidden = true;
  renderSpellTiles();
  updateSpellAttempts();
  $('#spell-modal').hidden = false;
  setSpellLocked(false);
  speak(word.say ?? word.word, 0.9);
}

/* ===== STORY ===== */
function newStory() { return { chapter: 1, step: 0, counts: {}, signs: {}, mimots: [], mimotWords: {}, travel: {}, intro: false }; }
function chapterDef() { return CHAPTERS.find((c) => c.id === game.story.chapter) ?? CHAPTERS[CHAPTERS.length - 1]; }
function currentObjective() { return chapterDef().objectives[game.story.step] ?? null; }
// Has the story gone past this objective (in this chapter or an earlier one)?
function storyPast(objId) {
  for (const ch of CHAPTERS) {
    const i = ch.objectives.findIndex((o) => o.id === objId);
    if (i < 0) continue;
    return game.story.chapter > ch.id || (game.story.chapter === ch.id && game.story.step > i);
  }
  return false;
}
function storyAt(objId) { return currentObjective()?.id === objId; }

function advanceStory(objId) {
  const obj = currentObjective();
  if (!obj || obj.id !== objId) return;
  if (obj.count) {
    game.story.counts[objId] = (game.story.counts[objId] ?? 0) + 1;
    if (game.story.counts[objId] < obj.count) { applyStoryState(); saveGame(); return; }
  }
  game.story.step += 1;
  const ch = chapterDef();
  if (game.story.step >= ch.objectives.length && CHAPTERS.some((c) => c.id === ch.id + 1)) {
    game.story.chapter += 1;
    game.story.step = 0;
    toast(`🏆 ${t.chapterDone}`);
    progress.stars += 20; game.starsEarned += 20;
  }
  applyStoryState();
  saveGame();
}

// Dialogue: lines read aloud, one tap to go on.
let dialogQueue = null;
function playScene(id, then) {
  const lines = SCENES[id];
  if (!lines) { then?.(); return; }
  dialogQueue = { lines: [...lines], then };
  showDialogLine();
}
function showDialogLine() {
  const q = dialogQueue;
  if (!q) return;
  const line = q.lines.shift();
  if (!line) {
    $('#dialog').hidden = true;
    dialogQueue = null;
    stopSpeaking();
    q.then?.();
    return;
  }
  const [who, text, choices] = line;
  const sp = SPEAKERS[who] ?? SPEAKERS.narrator;
  const box = $('#dialog-choices');
  if (who === 'choice' && choices) {
    box.replaceChildren(...choices.map((c) => {
      const b = el('button', 'btn btn-primary', c.label[lang] ?? c.label.fr);
      b.type = 'button';
      b.addEventListener('click', () => {
        box.hidden = true;
        $('#dialog-next').hidden = false;
        game.story.ending = c.scene;
        q.lines = [...(SCENES[c.scene] ?? []), ...q.lines];
        showDialogLine();
      });
      return b;
    }));
    box.hidden = false;
    $('#dialog-next').hidden = true;
  } else { box.hidden = true; $('#dialog-next').hidden = false; }
  $('#dialog-portrait').textContent = sp.emoji;
  $('#dialog-name').textContent = sp.name[lang] ?? sp.name.fr;
  $('#dialog-text').textContent = text;
  $('#dialog').hidden = false;
  speak(text, 0.92);
}

function objectivePos() {
  const o = currentObjective();
  const it = scene3D?.interactables ?? [];
  if (!o) return null;
  if (o.id === 'talkMage') return it.find((i) => i.kind === 'npc' && i.npcId === 'mage')?.worldPos;
  if (o.id === 'signs') {
    const p = scene3D.player.position;
    return it.filter((i) => i.kind === 'sign' && !game.story.signs[i.signHouse]).sort((a, b) => a.worldPos.distanceTo(p) - b.worldPos.distanceTo(p))[0]?.worldPos;
  }
  if (o.id === 'mimot') return it.find((i) => i.kind === 'mimot' && i.mimotId === 'fontaine')?.worldPos;
  if (scene3D.pageObjs?.[o.id]) return scene3D.pageObjs[o.id].worldPos;
  const circleAt = (cid) => it.find((i) => i.kind === 'circle' && i.cid === cid)?.worldPos;
  const travelAt = (r) => it.find((i) => i.kind === 'travel' && i.region === r)?.worldPos;
  const npcAt = (id) => it.find((i) => i.kind === 'npc' && i.npcId === id)?.worldPos;
  const p = scene3D.player.position;
  const mimotIn = (r) => it.filter((i) => i.kind === 'mimot' && i.active && MIMOTS.find((m) => m.id === i.mimotId)?.region === r).sort((a, b) => a.worldPos.distanceTo(p) - b.worldPos.distanceTo(p))[0]?.worldPos;
  return ({
    forestSign: () => travelAt('forest'), forestBridge: () => circleAt('pont-foret'), forester: () => npcAt('forester'), forestMimots: () => mimotIn('forest'),
    marshSign: () => travelAt('marsh'), marshFog: () => circleAt('vent-marais'), fisher: () => npcAt('fisher'), marshFire: () => circleAt('feu-marais'), marshMimots: () => mimotIn('marsh'),
    mountainSign: () => travelAt('mountain'), mountainStairs: () => circleAt('pierre-montagne'), mountainMimots: () => mimotIn('mountain'), readBook: () => scene3D.bookObj?.worldPos,
    coastSign: () => travelAt('coast'), lighthouse: () => circleAt('lumiere-phare'), islandBridge: () => circleAt('pont-ile'), bookMimots: () => mimotIn('book'), finale: () => npcAt('alaricIsland'),
  })[o.id]?.() ?? null;
}
function updateObjectiveUI() {
  const box = $('#map-instruction');
  if (!box || !game?.story) return;
  const o = currentObjective();
  const ch = chapterDef();
  const n = o?.count ? ` (${game.story.counts[o.id] ?? 0}/${o.count})` : '';
  box.classList.add('is-objective');
  if (game.parkour?.done && !game.fountainRaised) {
    box.replaceChildren(el('span', 'obj-chapter', t.lavaQuest), document.createTextNode(t.backToFountain));
    return;
  }
  box.replaceChildren(el('span', 'obj-chapter', ch.title[lang] ?? ch.title.fr), document.createTextNode(o ? `${o.text[lang] ?? o.text.fr}${n}` : ''));
  const boss = BOSSES.find((b) => bossOpen(b));
  if (boss) box.append(el('span', 'obj-boss', t.bossWaiting(boss.emoji, boss.name[lang])));
}
function updateMapPins() {
  if (!scene3D || !game?.story) return;
  const pins = [];
  const bed = scene3D.interactables.find((i) => i.kind === 'bed');
  if (bed) pins.push({ x: bed.worldPos.x, z: bed.worldPos.z, text: t.bedPin });
  pins.push({ x: LAVA.start.x, z: LAVA.start.z, text: '🔥' });
  for (const b of BOSSES) if (bossOpen(b)) pins.push({ x: b.x, z: b.z, text: b.emoji });
  for (const pl of PLACES) if (game?.places?.includes(pl.id)) pins.push({ x: pl.x, z: pl.z, text: pl.emoji });
  const p = game.parkour?.done && !game.fountainRaised ? { x: 0, z: 0 } : objectivePos();
  if (p) pins.push({ x: p.x, z: p.z, text: '⭐', quest: true });
  scene3D.mapPins = pins;
}
setInterval(() => { updateMapPins(); checkFountain(); updateAttackButton(); renderHearts(); checkPlaces(); tickFlash(); if (scene3D) scene3D.inputLocked = !$('#spell-modal').hidden || !$('#dialog').hidden; }, 300);

/* ===== FLASH CHALLENGE: never more than 2 minutes of play without a word ===== */
const FLASH_AFTER = 120; // seconds of play
let playSinceWord = 0, flashLast = performance.now();
function tickFlash() {
  const now = performance.now(), dt = Math.min(1, (now - flashLast) / 1000);
  flashLast = now;
  if (!game || !scene3D || scene3D.mode !== 'play' || document.hidden) return;
  if (document.body.dataset.screen !== 'game' || !$('#spell-modal').hidden || !$('#dialog').hidden || !$('#travel-modal').hidden || $('#quest-modal')?.hidden === false || knocking || bossFight || !$('#sleep-fade').hidden) return;
  playSinceWord += dt;
  if (playSinceWord < (window.__se?.flashAfter ?? FLASH_AFTER)) return;
  playSinceWord = 0;
  const word = pickWord(levelAt(0));
  spellContext = { type: 'flash', word, tries: 0 };
  sfxPop();
  openSpellModal(`⚡ ${t.flashTitle}`, word.level === 'letters' ? t.reviveInstructionLetter : t.flashInstruction, '⚡');
  speak(t.flashSay, 0.95);
}

/* ===== PLACES TO DISCOVER, THE PORTAL, ANIMALS ===== */
function checkPlaces() {
  if (!game || !scene3D || scene3D.mode !== 'play') return;
  const p = scene3D.player.position;
  game.places ??= [];
  for (const pl of PLACES) {
    if (game.places.includes(pl.id) || Math.hypot(p.x - pl.x, p.z - pl.z) > DISCOVER_RADIUS) continue;
    game.places.push(pl.id);
    progress.stars += 2; game.starsEarned += 2;
    sfxCraft(); smile();
    toast(t.placeFound(pl.emoji, pl.name[lang], game.places.length, PLACES.length), 3800);
    speak(t.placeFoundSay(pl.name[lang]), 0.95);
    updateGameUI(); saveGame();
    if (game.places.length === PLACES.length) setTimeout(() => { progress.stars += 15; game.starsEarned += 15; launchConfetti(); sfxVictory(); toast(t.allPlaces, 5000); updateGameUI(); saveGame(); setTimeout(() => gainHeart('places'), 5200); }, 4200);
  }
}
// The Nether portal: lit with a word, then it takes the hero to the lava course.
function usePortal() {
  if (!game.portalLit) {
    spellContext = { type: 'portal', word: pickWord(levelAt(1)), tries: 0 };
    openSpellModal(`🌀 ${t.portalTitle}`, t.portalInstruction, '🌀');
    return;
  }
  sfxCraft();
  toast(t.portalGo, 2600);
  const fade = $('#sleep-fade');
  fade.hidden = false; fade.classList.remove('is-out');
  setTimeout(() => {
    scene3D.teleport(LAVA.start.x, LAVA.start.z + 1.5);
    scene3D.pet?.catchUp();
    fade.classList.add('is-out');
    setTimeout(() => { fade.hidden = true; }, 700);
  }, 700);
}
function setupFauna() {
  const f = scene3D?.fauna;
  if (!f) return;
  f.onSound = (a) => {
    const txt = a.def.sound?.[lang] ?? a.def.sound?.fr;
    if (!txt || txt === '…') return;
    const cry = ANIMAL_CRIES[a.kind];
    if (cry) cry(); else { const [freq, wave] = a.def.tone ?? [500, 'square']; playTone(freq, 0.12, wave, 0.05); }
    const pos = scene3D.worldToScreen(a.mesh.position.clone().setY(a.mesh.position.y + 1.1));
    if (pos) showFloatingText(pos.x, pos.y, txt, '#ffffff');
  };
}

/* ===== HORSES ===== */
const horseArmorKind = () => (game?.crafted?.includes('horse_armor_diamond') ? 'diamond' : game?.crafted?.includes('horse_armor_iron') ? 'iron' : null);
function applyHorses() {
  const hm = scene3D?.horses;
  if (!hm) return;
  for (const h of hm.list) {
    const st = game?.horses?.[h.def.id];
    h.tamed = !!st?.tamed;
    hm.setArmor(h.def.id, h.tamed ? horseArmorKind() : null);
    const want = h.tamed ? `🐴 ${h.def.name[lang]}` : '🐴 ?';
    if (h.obj.labelText !== want) { h.obj.labelText = want; scene3D.setSpotMaterial(h.obj, 'talk', want); }
  }
  $('#dismount-btn').hidden = !hm.riding;
}
function horseInteract(obj) {
  const def = HORSES.find((d) => d.id === obj.horseId);
  game.horses ??= {};
  if (!game.horses[def.id]?.tamed) {
    spellContext = { type: 'horse', horseId: def.id, word: pickWord(levelAt(0)), tries: 0 };
    openSpellModal(`🐴 ${t.horseTitle}`, t.horseInstruction, '🐴');
    return;
  }
  if (scene3D.horses.mount(def.id)) {
    ANIMAL_CRIES.horse();
    $('#dismount-btn').hidden = false;
    if (!progress.rideExplained) { progress.rideExplained = true; saveProgress(); const msg = t.horseRide(def.name[lang]); toast(msg, 5000); speak(msg.replace(/^\S+ /, ''), 0.95); }
  }
}
function dismountHorse() {
  const h = scene3D?.horses?.riding;
  if (!h) return;
  scene3D.horses.dismount();
  h.leftAt = { x: h.mesh.position.x, z: h.mesh.position.z };
  $('#dismount-btn').hidden = true;
}

/* ===== BOSSES, THE PUPPY, THE COTTAGE DECORATIONS ===== */
const bossDone = (b) => !!game?.bosses?.includes(b.id);
const bossOpen = (b) => !bossDone(b) && !!game?.story && (storyPast(b.after) || game.story.chapter >= 6);
function applyExtras() {
  for (const b of BOSSES) {
    const o = scene3D.interactables.find((i) => i.kind === 'boss' && i.bossId === b.id);
    if (bossDone(b)) { scene3D.bosses.setDefeated(b.id); continue; }
    // Always touchable: asleep, it explains how to wake it up.
    scene3D.setStoryActive(o, true);
    game.bossesAnnounced ??= [];
    if (bossOpen(b) && !game.bossesAnnounced.includes(b.id)) {
      game.bossesAnnounced.push(b.id);
      setTimeout(() => { const msg = t.bossAwake(b.emoji, b.name[lang]); toast(msg, 6000); speak(msg.replace(/[^\p{L}\p{N}\s.,:!?'’«»()-]/gu, ''), 0.95); sfxRoar(); }, 2500);
      saveGame();
    }
    const want = bossOpen(b) ? 'open' : 'asleep';
    if (o && o.labelSet !== want) { o.labelSet = want; scene3D.setSpotMaterial(o, 'talk', `${want === 'open' ? '⚔️' : '💤'} ${b.name[lang].replace(/^(le|la|the) /i, '')}`); }
  }
  const pet = scene3D.pet, po = pet?.obj;
  if (pet && game.pet?.tamed && !pet.tamed) { pet.tamed = true; pet.catchUp(); }
  applyPetLook();
  if (po && !po.labelSet) { po.labelSet = true; scene3D.setSpotMaterial(po, 'talk', game.pet?.tamed ? `🐶 ${game.pet.name}` : '🐶 ?'); }
  if (po && game.pet?.tamed && po.labelText !== game.pet.name) { po.labelText = game.pet.name; scene3D.setSpotMaterial(po, 'talk', `${['🐶', '🐕', '🐕‍🦺', '🐺', '🗿'][petStage()]} ${game.pet.name}${petHungry() ? ' 🍖' : ''}`); }
  // The puppy shows only its name (no spinning icon hiding it).
  if (po) po.iconHolder.children.filter((c) => !c.isCSS2DObject && c.isObject3D && !c.userData.label).forEach((c) => { c.visible = false; });
  for (const id of progress.decor ?? []) scene3D.placeDecor(id);
  applyHorses();
  scene3D.lightPortal(!!game.portalLit);
  const pobj = scene3D.portalObj;
  if (pobj && pobj.portalLabel !== !!game.portalLit) { pobj.portalLabel = !!game.portalLit; scene3D.setSpotMaterial(pobj, 'talk', game.portalLit ? `🌀 ${t.portalLabelOn}` : `🌀 ${t.portalLabelOff}`); }
}

function beginBoss(obj) {
  const b = BOSSES.find((x) => x.id === obj.bossId);
  if (!b || bossDone(b)) return;
  if (!bossOpen(b)) {
    // Asleep: say what wakes it up, and what to do now.
    const need = CHAPTERS.flatMap((c) => c.objectives.map((o) => ({ o, ch: c.id }))).find((x) => x.o.id === b.after);
    const now = currentObjective();
    const msg = t.bossSleeps(b.emoji, b.name[lang], need ? need.o.text[lang] ?? need.o.text.fr : '', need?.ch ?? 6, now ? now.text[lang] ?? now.text.fr : '');
    scene3D.bosses.stir(b.id);
    toast(msg, 7000);
    speak(msg.replace(/[^\p{L}\p{N}\s.,:!?'’«»()-]/gu, ''), 0.95);
    return;
  }
  bossFight = { id: b.id, hp: b.hp, max: b.hp };
  scene3D.bosses.wake(b.id);
  sfxRoar();
  renderBossBar();
  toast(t.bossIntro(b.name[lang]), 3000);
  speak(t.bossIntroSay(b.name[lang]), 0.95);
  setTimeout(nextBossWord, 1400);
}
let bossFight = null;
function nextBossWord() {
  if (!bossFight) return;
  const b = BOSSES.find((x) => x.id === bossFight.id);
  spellContext = { type: 'boss', bossId: b.id, word: pickWord(levelAt(1)), tries: 0 };
  openSpellModal(`${b.emoji} ${t.bossTitle(b.name[lang])}`, t.bossInstruction(bossFight.hp), b.emoji);
}
function renderBossBar() {
  const bar = $('#boss-bar');
  if (!bar) return;
  bar.hidden = !bossFight;
  if (!bossFight) return;
  const b = BOSSES.find((x) => x.id === bossFight.id);
  bar.replaceChildren(el('span', 'boss-name', `${b.emoji} ${b.name[lang]}`), el('span', 'boss-hp', '💚'.repeat(bossFight.hp) + '🖤'.repeat(bossFight.max - bossFight.hp)));
}
function sfxRoar() { playNoise({ freq: 160, q: 0.6, volume: 0.22, duration: 0.7 }); playTone(90, 0.6, 'sawtooth', 0.08); }
function winBoss() {
  const b = BOSSES.find((x) => x.id === bossFight?.id);
  if (!b) return;
  bossFight = null;
  renderBossBar();
  scene3D.bosses.defeat(b.id);
  game.bosses ??= [];
  game.bosses.push(b.id);
  progress.stars += 20; game.starsEarned += 20;
  setTimeout(() => gainHeart(`boss:${b.id}`), 3500);
  setTimeout(() => { sfxVictory(); launchConfetti(); smile(); }, 900);
  toast(t.bossWon(b.name[lang]), 4500);
  speak(t.bossWonSay, 0.95);
  updateGameUI(); updateObjectiveUI(); saveGame();
}

// The puppy.
const today = () => new Date().toISOString().slice(0, 10);
const petHungry = () => !!game?.pet?.tamed && game.pet.fedDay !== today();
// Meals make the puppy grow through 5 levels: puppy, dog, big dog, giant dog and, at the end,
// a dog golem. A dog can only eat so much: a few meals (more when it is bigger) every 10 minutes.
// The first meal of the day (when it is hungry) also gives 2 stars.
const PET_STAGES = [0, 3, 7, 12, 18];
const PET_MEALS_MAX = [2, 3, 3, 4, 5], PET_MEAL_WINDOW = 10 * 60 * 1000;
const petStage = (meals = game?.pet?.meals ?? 0) => PET_STAGES.reduce((st, need, i) => (meals >= need ? i : st), 0);
function applyPetLook() {
  const pet = scene3D?.pet;
  if (!pet || !game?.pet?.tamed) return;
  pet.setStage(petStage());
  pet.setArmor(!!game.crafted?.includes('dog_armor'));
}
function petInteract() {
  if (!game.pet?.tamed) {
    spellContext = { type: 'pet', word: pickWord(levelAt(0)), tries: 0 };
    openSpellModal(`🐶 ${t.petTitle}`, t.petInstruction, '🐶');
    return;
  }
  const pet = scene3D.pet;
  const food = ['meat', 'fish', 'brochette'].find((f) => (game.materials[f] ?? 0) > 0);
  const now = Date.now();
  game.pet.mealTimes = (game.pet.mealTimes ?? []).filter((at) => now - at < PET_MEAL_WINDOW);
  if (food && game.pet.mealTimes.length >= PET_MEALS_MAX[petStage()]) {
    const wait = Math.ceil((PET_MEAL_WINDOW - (now - game.pet.mealTimes[0])) / 60000);
    pet.trick();
    toast(t.petFull(game.pet.name, wait), 3600);
    speak(t.petFull(game.pet.name, wait).replace(/^\S+ /, ''), 0.95);
    return;
  }
  if (food) {
    game.pet.mealTimes.push(now);
    const hungry = petHungry();
    const before = petStage();
    game.materials[food] -= 1;
    if (!game.materials[food]) delete game.materials[food];
    game.pet.meals = (game.pet.meals ?? 0) + 1;
    game.pet.fedDay = today();
    pet.joy();
    sfxCraft(); smile();
    if (hungry) { progress.stars += 2; game.starsEarned += 2; }
    const stage = petStage();
    if (stage > before) {
      applyPetLook();
      launchConfetti(); sfxVictory();
      toast(t.petGrew(game.pet.name, stage), 4500);
      speak(t.petGrew(game.pet.name, stage).replace(/^\S+ /, ''), 0.95);
    } else {
      const next = PET_STAGES[stage + 1];
      toast(hungry ? t.petFed(game.pet.name) : t.petFedMore(game.pet.name, next ? next - game.pet.meals : 0), 3600);
    }
    scene3D.pet.obj.labelText = null;
    updateGameUI(); renderCraftMenu(); applyExtras(); saveGame();
    return;
  }
  // No food: a cuddle (hearts, a happy little whine, the dog rolls over).
  pet.pat();
  animalVoice({ type: 'sine', f0: 700, mid: 1100, f1: 800, dur: 0.35, filter: 'lowpass', freq: 2000, vol: 0.06 });
  smile();
  toast(petHungry() ? t.petHungry(game.pet.name) : t.petPat(game.pet.name), 3000);
}
// A dog bark: a breathy noise burst and a voice that drops quickly ("wouf"), twice. The bigger
// the dog, the deeper the bark; the golem's bark has a stony rumble.
function sfxBark() {
  const st = game?.pet?.tamed ? petStage() : 0;
  const base = [620, 520, 440, 360, 300][st] * (0.95 + Math.random() * 0.1);
  for (const at of [0, 0.26]) {
    playNoise({ freq: 1100, q: 0.8, volume: 0.09, duration: 0.05, delay: at });
    animalVoice({ type: 'sawtooth', f0: base, f1: base * 0.55, dur: 0.16, filter: 'bandpass', freq: 900, q: 0.9, vol: 0.16, delay: at });
    animalVoice({ type: 'square', f0: base / 2, f1: base * 0.28, dur: 0.14, filter: 'lowpass', freq: 700, vol: 0.06, delay: at });
    if (st === 4) playNoise({ type: 'lowpass', freq: 180, q: 1, volume: 0.1, duration: 0.25, delay: at });
  }
}
function petNamePicker(after) {
  const box = el('div', 'pet-names');
  for (const n of PET_NAMES[lang] ?? PET_NAMES.fr) {
    const b = el('button', 'btn btn-accent btn-small', n);
    b.type = 'button';
    b.addEventListener('click', () => {
      game.pet = { tamed: true, name: n, fedDay: null };
      scene3D.pet.tame();
      scene3D.pet.obj.labelText = null;
      box.replaceChildren(el('p', 'spell-success', t.petNamed(n)));
      speak(t.petNamed(n), 0.95);
      spellContext && (spellContext.finished = true);
      applyExtras(); saveGame();
      after?.();
    });
    box.append(b);
  }
  return box;
}
function setupPet() {
  const pet = scene3D?.pet;
  if (!pet) return;
  pet.onBark = () => {
    if (!game?.pet?.tamed) return;
    sfxBark();
    // The first time: say what it means, written and out loud.
    if (!progress.petBarkExplained) {
      progress.petBarkExplained = true;
      saveProgress();
      toast(t.petBarkExplain(game.pet.name), 5000);
      speak(t.petBarkExplain(game.pet.name).replace(/^🐶 /, ''), 0.95);
    }
    const pos = scene3D.worldToScreen?.(pet.mesh.position.clone().setY(pet.mesh.position.y + 1.2));
    if (pos) showFloatingText(pos.x, pos.y, t.petBark, '#ffffff');
  };
  let guardSaid = false;
  pet.onGuard = () => { sfxBark(); if (!guardSaid) { guardSaid = true; toast(t.petGuard(game.pet.name), 3200); } };
  pet.onBite = (armed) => {
    if (!game?.pet?.tamed) return;
    sfxBark(); sfxHit();
    if (!armed) { progress.stars += 1; game.starsEarned += 1; updateGameUI(); saveGame(); }
    if (!progress.petBiteExplained) { progress.petBiteExplained = true; saveProgress(); toast(t.petBite(game.pet.name), 4000); speak(t.petBite(game.pet.name).replace(/^\S+ /, ''), 0.95); }
  };
  pet.onDig = () => {
    if (!game?.pet?.tamed) return;
    const found = ['wood', 'stone', 'iron', 'flower', 'wheat', 'water'][Math.floor(Math.random() * 6)];
    game.materials[found] = (game.materials[found] ?? 0) + 1;
    sfxCraft();
    toast(t.petDug(game.pet.name, `${MATERIAL_EMOJI[found] ?? ''} ${materialName(found)}`), 3600);
    updateGameUI(); renderCraftMenu(); saveGame();
  };
}

// Show / hide the story things to match where the child is in the story.
// A step already done ahead of time (the bridge cast before the forest sign was fixed, a sign
// repaired early…): when the story reaches it, it plays and moves on by itself instead of waiting.
const SPELL_HOOKS = { forestBridge: 'pont-foret', marshFog: 'vent-marais', marshFire: 'feu-marais', mountainStairs: 'pierre-montagne', lighthouse: 'lumiere-phare', islandBridge: 'pont-ile' };
let catchingUp = false;
function catchUpStory() {
  const o = currentObjective();
  if (!o || catchingUp) return;
  const cid = SPELL_HOOKS[o.id];
  const region = o.id.endsWith('Sign') ? o.id.slice(0, -4) : null;
  const done = (cid && game.spells?.[cid]) || (region && TRAVEL[region] && game.story.travel?.[region]);
  if (!done) return;
  catchingUp = true;
  setTimeout(() => {
    catchingUp = false;
    if (currentObjective()?.id !== o.id || !$('#spell-modal').hidden || !$('#dialog').hidden) { setTimeout(catchUpStory, 1500); return; }
    playScene(o.id, () => { advanceStory(o.id); saveGame(); });
  }, 900);
}
function applyStoryState() {
  if (!scene3D || !game?.story) return;
  const st = game.story;
  applyExtras();
  catchUpStory();
  $('#grimoire-btn').hidden = !storyPast('talkMage');
  for (const sg of SIGNS) {
    const o = scene3D.setSignWord(sg.house, st.signs[sg.house] ? sg.word[6] : null);
    if (!o) continue;
    const open = !st.signs[sg.house];
    scene3D.setStoryActive(o, open);
    o.block.visible = true;
    if (open) scene3D.setSpotMaterial(o, 'talk', '🪧 ?');
  }
  for (const m of MIMOTS) {
    const o = scene3D.interactables.find((i) => i.kind === 'mimot' && i.mimotId === m.id);
    if (!o) continue;
    const tamed = st.mimots.includes(m.id);
    const show = !tamed && (m.story ? storyAt(m.story) : m.after ? storyPast(m.after) : storyPast('talkMage'));
    if (show && !st.mimotWords[m.id]) {
      st.mimotWords[m.id] = pickWord(levelAt(1))?.word;
    }
    if (show && o._letter !== st.mimotWords[m.id]?.[0]) { o._letter = st.mimotWords[m.id]?.[0] ?? '?'; o.active = true; scene3D.setMimotLetter(m.id, o._letter); }
    scene3D.setStoryActive(o, show);
    if (show) scene3D.setSpotMaterial(o, 'talk', '🐣 Mimot');
  }
  for (const page of Object.values(scene3D.pageObjs ?? {})) {
    scene3D.setStoryActive(page, storyAt(page.pageId));
    if (storyAt(page.pageId)) scene3D.setSpotMaterial(page, 'talk', '📄 ?');
  }
  for (const o of scene3D.interactables.filter((i) => i.kind === 'travel')) {
    const fixed = o.region === 'village' || st.travel?.[o.region];
    setTravelSignText(o, fixed);
    scene3D.setSpotMaterial(o, fixed ? 'talk' : 'talk', fixed ? '🧭 ' + (t.placeNames[o.region] ?? o.region) : '🪧 ?');
  }
  // Alaric: gone from the village once he is found out, at his tower, then on the paper island.
  scene3D.setNpcVisible('mage', !storyPast('page3') || storyPast('finale'));
  scene3D.setNpcVisible('alaricTower', storyAt('readBook'));
  scene3D.setNpcVisible('alaricIsland', storyPast('islandBridge') && !storyPast('finale'));
  if (scene3D.bookObj) { scene3D.setStoryActive(scene3D.bookObj, storyAt('readBook')); if (storyAt('readBook')) scene3D.setSpotMaterial(scene3D.bookObj, 'talk', '📖 ?'); }
  for (const id of ['alaricTower', 'alaricIsland']) { const o = scene3D.interactables.find((i) => i.kind === 'npc' && i.npcId === id); if (o?.active) scene3D.setSpotMaterial(o, 'talk', NPC_INFO[id]?.name[lang] ?? 'Alaric'); }
  refreshCircles();
  updateObjectiveUI();
  updateMapPins();
}

function showEnding() {
  const st = game.story;
  playScene('ending', () => {
    $('#end-title').textContent = t.theEnd;
    $('#end-stats').textContent = t.endStats(Object.keys(progress.wordStats ?? {}).length, st.mimots.length, progress.stars);
    $('#end-modal').hidden = false;
    for (let i = 0; i < 6; i++) setTimeout(() => { const p = scene3D.player.position; scene3D.particleBurst({ x: p.x + (Math.random() - 0.5) * 6, y: p.y + 3 + Math.random() * 2, z: p.z + (Math.random() - 0.5) * 6 }, ['#ffd36a', '#b08aff', '#6ad0ff', '#ff7ab0'][i % 4], 30); }, i * 350);
    sfxVictory();
  });
}

function beginSign(obj) {
  if (!storyPast('talkMage')) { toast(t.talkToMageFirst); return; }
  const sg = SIGNS.find((x) => x.house === obj.signHouse);
  const word = signWord(sg, progress.age ?? 6);
  spellContext = { type: 'sign', sign: sg, obj, word, tries: 0 };
  openSpellModal(`🪧 ${t.signTitle}`, t.signInstruction, '🪧');
}
function beginMimot(obj) {
  const w = game.story.mimotWords[obj.mimotId];
  const word = WORDS[lang].find((x) => x.word === w) ?? pickWord(levelAt(1));
  spellContext = { type: 'mimot', mimotId: obj.mimotId, obj, word, tries: 0 };
  openSpellModal(`🐣 ${t.mimotTitle}`, t.mimotInstruction, '🐣');
}

/* ===== TRAVEL SIGNPOSTS ===== */
function setTravelSignText(o, fixed) {
  const T = TRAVEL[o.region];
  setSignText(o.sign, o.region === 'village' ? 'Voyage' : fixed ? T.word[7] : null);
}
function travelWord(region) {
  const T = TRAVEL[region], age = progress.age ?? 6;
  const w = age <= 5 ? T.word[5] : age === 6 ? T.word[6] : T.word[7];
  const names = { f: 'èfe', m: 'ème', p: 'pé' };
  return w.length === 1 ? { word: w, level: 'story', say: `La lettre ${names[w] ?? w}… comme dans ${T.word[7]}.` } : { word: w, level: 'story', say: `${w}.` };
}
function useTravelSign(o) {
  const fixed = o.region === 'village' || game.story.travel?.[o.region];
  if (!fixed) {
    if (!storyPast('talkMage')) { toast(t.talkToMageFirst); return; }
    spellContext = { type: 'travel', region: o.region, obj: o, word: travelWord(o.region), tries: 0 };
    openSpellModal(`🪧 ${t.travelSignTitle}`, t.travelSignInstruction, '🪧');
    return;
  }
  const places = Object.keys(TRAVEL).filter((r) => r === 'village' || game.story.travel?.[r]);
  $('#travel-buttons').replaceChildren(...places.map((r) => {
    const b = el('button', `btn ${r === o.region ? 'btn-ghost' : 'btn-primary'}`, t.placeNames[r] ?? r);
    b.type = 'button';
    b.addEventListener('click', () => {
      if (r === o.region) { toast(t.notThere); return; }
      $('#travel-modal').hidden = true;
      const fade = $('#sleep-fade');
      fade.hidden = false; fade.classList.remove('is-out');
      setTimeout(() => {
        const back = TRAVEL[r].back;
        scene3D.teleport(back.x, back.z);
        setTimeout(() => { fade.classList.add('is-out'); setTimeout(() => { fade.hidden = true; }, 700); }, 300);
      }, 650);
    });
    return b;
  }));
  $('#travel-modal').hidden = false;
}

/* ===== KNOCK-OUT (lava, zombies): "Ouch!", fade, back to the last flag or the cottage bed ===== */
let knocking = false;
const lavaFallsAt = {};
function knockOut(reason) {
  if (knocking || !scene3D) return;
  knocking = true;
  sfxError();
  toast(t.ouch[reason] ?? t.ouch.lava);
  speak(t.ouchSay, 1);
  const fade = $('#sleep-fade');
  fade.hidden = false; fade.classList.remove('is-out');
  setTimeout(() => {
    let to = null;
    if (reason === 'lava') {
      game.parkour ??= { cp: null, done: false, falls: 0 };
      game.parkour.falls = (game.parkour.falls ?? 0) + 1;
      // Three falls on the same jump: a footbridge appears.
      const at = scene3D.lavaFailAt ?? -1;
      lavaFallsAt[at] = (lavaFallsAt[at] ?? 0) + 1;
      if (lavaFallsAt[at] >= 3 && scene3D.addLavaHelp(at)) setTimeout(() => toast(t.lavaHelp, 4000), 1600);
      const cp = game.parkour?.cp && scene3D.lavaPillar(game.parkour.cp);
      to = cp ?? { x: LAVA.start.x, z: LAVA.start.z };
      scene3D.lavaIndex = cp ? LAVA.pillars.findIndex((pp) => pp[4] === game.parkour.cp) : -1;
    } else {
      const bed = scene3D.interactables.find((i) => i.kind === 'bed');
      to = bed ? { x: bed.worldPos.x + 1.0, z: bed.worldPos.z + 0.6 } : { x: 0, z: 6 };
    }
    scene3D.teleport(to.x, to.z);
    scene3D.lavaBurnt = false;
    scene3D.onKnockOut?.(reason);
    setTimeout(() => {
      fade.classList.add('is-out');
      setTimeout(() => { fade.hidden = true; knocking = false; if (reason === 'lava' && Math.random() < reviveChance()) beginRevive(); }, 700);
    }, 350);
  }, 650);
}

// After a fall in the lava: spell a word (from the child's easiest list) to set off again.
// A spelling word after a fall in the lava, one time in five (always in tests that ask for it).
function reviveChance() { return window.__se?.reviveAlways ? 1 : 0.2; }
// After a zombie victory, one time in four: a bonus word to spell (+2 ★ more).
const ZOMBIE_WORD_CHANCE = 0.25;
function beginZombieWord() {
  if (!game || !$('#spell-modal').hidden) return;
  const word = pickWord(levelAt(0));
  spellContext = { type: 'zombieWord', word, tries: 0 };
  openSpellModal(`🧟 ${t.zombieWordTitle}`, word.level === 'letters' ? t.reviveInstructionLetter : t.zombieWordInstruction, '🧟');
}
function beginRevive() {
  if (!game || !$('#spell-modal').hidden) return;
  const word = pickWord(levelAt(0));
  spellContext = { type: 'revive', word, tries: 0 };
  const instruction = { letters: t.reviveInstructionLetter }[word.level] ?? t.reviveInstruction;
  openSpellModal(`🔥 ${t.reviveTitle}`, instruction, '🔥');
}

/* ===== LAVA COURSE (side quest) ===== */
function restoreLava() {
  if (!scene3D) return;
  const pk = game.parkour;
  const reached = pk?.done ? LAVA_FLAGS.length : LAVA_FLAGS.indexOf(pk?.cp) + 1;
  LAVA_FLAGS.forEach((role, i) => scene3D.setLavaFlag(role, i < reached));
  if (pk?.done) scene3D.openLavaExit();
  if (game.fountainRaised) scene3D.raiseFountain(true);
}
function onLavaPillar(role) {
  game.parkour ??= { cp: null, done: false, falls: 0 };
  const pk = game.parkour;
  const i = LAVA_FLAGS.indexOf(role), cur = LAVA_FLAGS.indexOf(pk.cp);
  if (i >= 0 && i > cur) {
    pk.cp = role;
    LAVA_FLAGS.forEach((r, k) => scene3D.setLavaFlag(r, k <= i));
    toast(t.flagReached); sfxCraft(); saveGame();
  }
  if (role === 'finish' && !pk.done && LAVA_FLAGS.indexOf(pk.cp) === LAVA_FLAGS.length - 1) {
    pk.done = true;
    pk.doneAt = Date.now();
    scene3D.openLavaExit();
    const p = scene3D.player.position;
    for (let k = 0; k < 4; k++) setTimeout(() => scene3D.particleBurst({ x: p.x, y: p.y + 2, z: p.z }, ['#ffd36a', '#ff7a1e', '#ffffff'][k % 3], 28), k * 300);
    sfxVictory();
    toast(t.lavaDone(pk.falls ?? 0));
    speak(t.lavaDoneSay, 0.95);
    progress.stars += 10; game.starsEarned += 10;
    updateGameUI();
    updateObjectiveUI();
    saveGame();
  }
}
// Back at the fountain after winning the course: it rises.
function checkFountain() {
  if (!scene3D || !game?.parkour?.done || game.fountainRaised) return;
  const p = scene3D.player.position;
  if (Math.hypot(p.x, p.z) > 4.5) return;
  game.fountainRaised = true;
  scene3D.raiseFountain();
  sfxVictory();
  toast(t.fountainUp);
  speak(t.fountainUp, 0.95);
  updateObjectiveUI();
  saveGame();
}

/* ===== WORD MAGIC ===== */
function refreshCircle(obj) {
  const sp = spellById(obj.spellId);
  const ch = !spellUnlocked(sp) && sp.story && CHAPTERS.find((c) => c.objectives.some((o) => o.id === sp.story));
  scene3D.setSpotMaterial(obj, 'spell', spellUnlocked(sp) ? `${sp.emoji} ${spellName(sp)}` : `🔒 ${spellName(sp)}${ch ? ` · ${t.chapterShort(ch.id)}` : ''}`);
}
function refreshCircles() { for (const o of scene3D?.interactables ?? []) if (o.kind === 'circle') refreshCircle(o); }
function spellUnlocked(sp) { return !!sp && ((sp.unlock !== null && (progress.stars ?? 0) >= sp.unlock) || (!!sp.story && !!game?.story && storyPast(sp.story))); }
function spellName(sp) { return sp.name[lang] ?? sp.name.fr; }
function beginSpellCast(circle) {
  initAudio();
  const sp = spellById(circle.spellId);
  if (!spellUnlocked(sp)) {
    const ch = sp.story && CHAPTERS.find((c) => c.objectives.some((o) => o.id === sp.story));
    toast(ch ? t.spellLockedChapter(spellName(sp), ch.id) : sp.unlock === null ? (sp.soon?.[lang] ?? t.spellSoon) : t.spellLocked(spellName(sp), sp.unlock));
    return;
  }
  if (scene3D.spellObjects?.[circle.cid ?? sp.id]?.node?.active) { toast(t.spellAlready); return; }
  const word = spellWord(sp, progress.age ?? 6, lang);
  spellContext = { type: 'spell', spell: sp, circle, word, tries: 0 };
  openSpellModal(`${sp.emoji} ${t.spellTitle} : ${spellName(sp)}`, t.spellInstruction, sp.emoji);
}
function renderGrimoire() {
  const age = progress.age ?? 6;
  $('#grimoire-grid').replaceChildren(...SPELLS.map((sp) => {
    const open = spellUnlocked(sp);
    const cast = !!game?.spells?.[sp.id];
    const card = el('button', `spell-card${open ? '' : ' is-locked'}${cast ? ' is-cast' : ''}`);
    card.type = 'button';
    const w = spellWord(sp, age, lang);
    card.append(
      el('span', 'spell-emoji-big', sp.emoji),
      el('span', 'spell-name', spellName(sp)),
      el('span', 'spell-word', open ? w.word : '• • •'),
      el('span', 'spell-effect', sp.effect[lang] ?? sp.effect.fr),
      el('span', 'spell-state', sp.unlock === null ? (sp.soon?.[lang] ?? t.spellSoon) : !open ? `🔒 ${sp.unlock} ★` : cast ? `✓ ${t.spellUsed}` : t.spellReady),
    );
    if (open) card.addEventListener('click', () => speak(w.say ?? w.word, 0.85));
    return card;
  }));
}

/* ===== CRAFTING ===== */

function hasParts(item) {
  const need = {};
  for (const p of item.parts) need[p] = (need[p] ?? 0) + 1;
  return Object.entries(need).every(([p, n]) => (game?.materials[p] ?? 0) >= n);
}

function renderCraftMenu() {
  const container = $('#craft-list');
  if (!container) return;
  const ready = FINITE_CRAFTS.filter((item) => !game?.crafted.includes(item.id) && (item.requires ?? []).every((r) => game?.crafted.includes(r)) && hasParts(item)).length;
  const badge = $('#craft-badge');
  if (badge) { badge.hidden = ready === 0; badge.textContent = ready; }
  $('#craft-open-btn')?.classList.toggle('has-ready', ready > 0);
  container.replaceChildren(...CRAFTABLES.filter((item) => (!item.needsPet || game?.pet?.tamed) && (!item.needsHorse || Object.values(game?.horses ?? {}).some((h) => h.tamed))).map((item) => {
    const already = !item.repeat && game?.crafted.includes(item.id);
    const reqOk = (item.requires ?? []).every((r) => game?.crafted.includes(r));
    const canCraft = !already && reqOk && hasParts(item);
    const node = el('div', `craft-card ${canCraft ? 'is-available' : ''} ${already ? 'is-done' : ''} ${reqOk ? '' : 'is-locked'}`);
    const partsDisplay = item.parts.map((p) => `${MATERIAL_EMOJI[p] ?? ''} ${materialName(p)}`).join(' + ');
    node.append(el('span', 'craft-emoji', item.emoji), el('span', 'craft-name', itemName(item)), el('span', 'craft-parts', partsDisplay));
    if (item.requires) {
      node.append(el('span', 'craft-requires', `${t.requires} ${item.requires.map((r) => craftable(r)?.emoji ?? r).join(' + ')}`));
    }
    const have = item.repeat ? game?.materials[item.id] ?? 0 : 0;
    node.append(el('span', 'craft-status', already ? '✓' : canCraft ? '→' : have ? `×${have}` : ''));
    if (canCraft) {
      node.addEventListener('click', () => beginCraft(item));
      node.classList.add('is-clickable');
    }
    return node;
  }));
}

function beginCraft(item) {
  initAudio();
  $('#craft-drawer').hidden = true;
  // Materials were earned by spelling list words; crafting itself just builds the object.
  spellContext = { type: 'craft', item };
  finishCrafting();
}

function item_emoji(item) { return item.emoji; }

function finishCrafting() {
  const item = spellContext.item;
  const info = { name: itemName(item), parts: item.parts };
  // Consume materials
  for (const part of info.parts) {
    game.materials[part] = Math.max(0, (game.materials[part] ?? 1) - 1);
    if (game.materials[part] === 0) delete game.materials[part];
  }
  const base = item.id.split('_')[0];
  if (item.repeat) game.materials[item.id] = (game.materials[item.id] ?? 0) + 1;
  else {
    game.crafted.push(item.id);
    if (HOLDABLE_IDS.includes(base)) { game.equipped = null; equipItem(bestVersion(base)); }
    else if (item.id.startsWith('horse_armor')) { applyHorses(); setTimeout(() => toast(t.horseArmor(item.id.endsWith('diamond')), 4000), 1200); }
    else if (item.id === 'heart_pie') { if (!gainHeart('pie')) setTimeout(() => toast(t.pieYum, 3000), 1200); }
    else if (item.id === 'dog_armor') { scene3D?.pet?.setArmor(true); setTimeout(() => toast(t.petArmor(game.pet?.name ?? ''), 4000), 1200); }
    else scene3D?.spawnTrophy(item.id);
  }
  saveGame();
  progress.victories += 1;
  const earned = item.repeat ? 2 : 10;
  progress.stars += earned;
  game.starsEarned += earned;
  sfxCraft();
  sfxVictory();
  launchConfetti();

  const pos = scene3D?.getPlayerScreenPosition();
  if (pos) showFloatingText(pos.x, pos.y - 40, `${item.emoji} +${earned} ★`, '#ffc233');

  spellContext = null;
  $('#spell-modal').hidden = true;
  saveProgress();
  updateGameUI();
  renderCraftMenu();

  speak(`${t.craftedText} ${info.name}!`, 0.9);

  // Check if all items crafted
  if (FINITE_CRAFTS.every((c) => game.crafted.includes(c.id))) {
    setTimeout(() => finishGame(true), 1500);
  }
}

/* ===== SPELLING ===== */

function setSpellLocked(locked) {
  isLocked = locked;
  spellInput.readOnly = locked || progress.keyboard;
  spellCheckBtn.hidden = locked;
  spellContinueBtn.hidden = !locked;
}

function renderSpellTiles() {
  const target = spellContext?.word?.word ?? '';
  const length = Math.max(target.length, spellInput.value.length);
  const tiles = Array.from({ length }, (_, i) => {
    if (target[i] === ' ') return el('div', 'tile tile-space', '');
    const tile = el('div', 'tile', (spellInput.value[i] ?? '').toUpperCase());
    if (i === spellInput.value.length && !isLocked) tile.classList.add('is-next');
    return tile;
  });
  spellTilesEl.replaceChildren(...tiles);
  // "Check" only works once every letter is filled in (no quick empty guesses).
  spellCheckBtn.disabled = isLocked || spellInput.value.length !== target.length;
}

function scoreGuess(guess, target) {
  const result = [...guess].map((letter) => ({ letter, state: 'absent' }));
  const unmatched = {};
  for (let i = 0; i < target.length; i += 1) {
    if (guess[i] === target[i]) result[i].state = 'correct';
    else unmatched[target[i]] = (unmatched[target[i]] ?? 0) + 1;
  }
  result.forEach((item) => {
    if (item.state !== 'correct' && unmatched[item.letter] > 0) {
      item.state = 'present'; unmatched[item.letter] -= 1;
    }
  });
  return result;
}

function scoredTiles(guess, target) {
  return scoreGuess(guess, target).map(({ letter, state }) => el('div', `tile tile-${state}`, letter.toUpperCase()));
}

function updateSpellAttempts() {
  const remaining = MAX_TRIES - (spellContext?.tries ?? 0);
  $('#spell-attempts').textContent = `${remaining} ${remaining === 1 ? t.tryLeft : t.triesLeft}`;
}

function checkSpelling() {
  if (!spellContext || isLocked) return;
  const guess = spellInput.value.trim().toLowerCase();
  const target = spellContext.word.word;
  if (guess.length !== target.length) return;
  // After three misses the word is shown and must be copied out to close the window.
  if (spellContext.copyMode) {
    if (guess === target) {
      setSpellLocked(true);
      spellTilesEl.replaceChildren(...scoredTiles(guess, target));
      handleSpellSuccess();
    } else {
      sfxError();
      setSpellLocked(true);
      spellTilesEl.replaceChildren(...scoredTiles(guess, target));
      setTimeout(() => { setSpellLocked(false); spellInput.value = ''; renderSpellTiles(); }, 1200);
    }
    return;
  }
  spellContext.tries += 1;
  setSpellLocked(true);
  spellTilesEl.replaceChildren(...scoredTiles(guess, target));
  updateSpellAttempts();
  recordAttempt(spellContext.word, guess, guess === target, spellContext.tries + (spellContext.hwMissed ? 1 : 0));
  if (guess === target) handleSpellSuccess();
  else handleSpellFailure(target);
  saveProgress();
}

function handleSpellSuccess() {
  const { word, tries, type } = spellContext;
  spellContext.finished = true;
  const copied = !!spellContext.copyMode;
  const firstTry = tries === 1 && !copied && !spellContext.hwMissed;
  const wordStr = word.word;

  if (copied) {
    streak = 0;
  } else if (firstTry) {
    if (game?.pet?.tamed) scene3D?.pet?.joy();
    streak += 1;
    if (streak >= 10) gainHeart('streak10');
    if (streak > (progress.bestStreak || 0)) progress.bestStreak = streak;
  } else { streak = 0; }

  const streakBonus = streak >= 2 ? Math.min(streak - 1, 3) : 0;
  const baseEarned = firstTry ? FIRST_TRY_STARS : RETRY_STARS;
  // Copying the shown word gives the material but no stars.
  const earned = copied ? 0 : baseEarned + streakBonus;
  progress.stars += earned;
  game.starsEarned += earned;
  if (!copied) game.wordsSpelled += 1;
  if (firstTry) {
    if (!progress.mastered[wordStr]) setTimeout(() => toast(`🃏 ${t.newCard} : ${WORD_EMOJI[lang]?.[wordStr] ?? ''} ${wordStr}`), 600);
    progress.mastered[wordStr] = true;
    delete progress.difficult[wordStr];
  }
  else if (!copied) { progress.difficult[wordStr] = (progress.difficult[wordStr] ?? 0) + 1; }

  sfxMine();
  if (streak >= 2) sfxStreak(streak);

  const pos = scene3D?.getPlayerScreenPosition();
  if (pos) {
    if (earned > 0) showFloatingText(pos.x, pos.y - 30, `+${earned} ★${streakBonus > 0 ? ` STREAK ${streak}x!` : ''}`, '#ffc233');
  }

  // 3D particle burst at mine object or player
  if (scene3D && spellContext.mineObj) {
    scene3D.particleBurst(spellContext.mineObj.worldPos, '#ffaa00', 20);
  } else if (scene3D) {
    const p = scene3D.player.position.clone(); p.y = 1;
    scene3D.particleBurst(p, '#ffaa00', 20);
  }

  if (type === 'mine') {
    let material = spellContext.material;
    const obj = spellContext.mineObj;
    let lootText = '';
    if (material === 'chest') {
      // Treasure: something random inside.
      const loot = rollLoot();
      game.chests = (game.chests ?? 0) + 1;
      scene3D?.openChest(obj);
      for (const [m, n] of Object.entries(loot.materials ?? {})) game.materials[m] = (game.materials[m] ?? 0) + n;
      if (loot.stars) { progress.stars += loot.stars; game.starsEarned += loot.stars; }
      lootText = [...Object.entries(loot.materials ?? {}).map(([m, n]) => `${MATERIAL_EMOJI[m]} ${materialName(m)} ×${n}`), loot.stars ? `${loot.stars} ★` : ''].filter(Boolean).join(' · ');
      material = Object.keys(loot.materials ?? {})[0] ?? null;
    }
    if (obj?.nodeType === 'fish') game.fish = (game.fish ?? 0) + 1;
    // Diamond and obsidian tools gather twice as much.
    const tool = obj?.requires ? bestVersion(obj.requires) : null;
    const amount = tool && tool.includes('_') ? 2 : 1;
    if (!lootText) game.materials[material] = (game.materials[material] ?? 0) + amount;
    if (obj?.kind === 'node') {
      if (obj.nodeType === 'chest') setTimeout(() => scene3D?.depleteNode(obj), 1400);
      else scene3D?.depleteNode(obj);
    }
    else if (obj) {
      const others = (scene3D?.interactables ?? []).filter((o) => o !== obj && o.name === obj.name).map((o) => o.material);
      const next = pickMaterial(obj.houseType, others);
      scene3D?.setSpotMaterial(obj, next, spotLabel(obj, next));
    }
    sfxBreak();
    saveGame();
    const sentence = spellContext.word.sentence ?? buildSentence(wordStr, lang);
    spellResultEl.replaceChildren(
      el('p', 'spell-success', copied ? t.copiedWell : firstTry ? t.perfectSpelling : t.youGotIt),
      el('p', 'spell-sentence', sentence),
      el('p', 'spell-stars', copied ? t.copyNoStars : `+${earned} ${earned === 1 ? t.star : t.stars}`),
      el('p', 'spell-material', lootText ? `🎁 ${t.treasureFound} ${lootText}` : `${MATERIAL_EMOJI[material] ?? ''} ${t.gotMaterial}: ${materialName(material)}${amount > 1 ? ` ×${amount}` : ''}`),
    );
    if (streak >= 2) spellResultEl.appendChild(el('p', 'spell-streak-badge', `${streak}x ${t.streakLabel}! +${streakBonus} ${t.bonusStars}`));
    spellResultEl.hidden = false;
    speak(sentence, 0.9);
  } else if (type === 'sign') {
    const sg = spellContext.sign;
    game.story.signs[sg.house] = true;
    { const w = spellContext.obj.worldPos; scene3D?.particleBurst({ x: w.x, y: w.y + 1.6, z: w.z }, '#ffe08a', 26); }
    sfxCraft();
    const name = sg.word[6];
    spellResultEl.replaceChildren(
      el('p', 'spell-success', `🪧 ${t.signBack(name.toUpperCase())}`),
      el('p', 'spell-stars', copied ? t.copyNoStars : `+${earned} ${earned === 1 ? t.star : t.stars}`),
    );
    spellResultEl.hidden = false;
    speak(t.signBack(name), 0.9);
    const ctxDone = () => { advanceStory('signs'); if (storyAt('mimot')) playScene('signsDone'); };
    spellContext.after = ctxDone;
  } else if (type === 'boss') {
    const b = BOSSES.find((x) => x.id === spellContext.bossId);
    bossFight.hp -= 1;
    scene3D?.bosses.hit(b.id);
    sfxHit();
    renderBossBar();
    const won = bossFight.hp <= 0;
    spellResultEl.replaceChildren(
      el('p', 'spell-success', won ? `🏆 ${t.bossWon(b.name[lang])}` : `💥 ${t.bossHit(bossFight.hp)}`),
      el('p', 'spell-stars', copied ? t.copyNoStars : `+${earned + (won ? 20 : 0)} ${t.stars}`),
    );
    spellResultEl.hidden = false;
    speak(won ? t.bossWonSay : t.bossHitSay, 0.95);
    spellContext.after = won ? winBoss : () => { scene3D?.bosses.attack(b.id); sfxRoar(); setTimeout(nextBossWord, 1100); };
  } else if (type === 'horse') {
    const def = HORSES.find((d) => d.id === spellContext.horseId);
    game.horses ??= {};
    game.horses[def.id] = { tamed: true };
    ANIMAL_CRIES.horse(); sfxVictory();
    spellResultEl.replaceChildren(el('p', 'spell-success', `🐴 ${t.horseTamed(def.name[lang])}`), el('p', 'spell-stars', copied ? t.copyNoStars : `+${earned} ${t.stars}`));
    spellResultEl.hidden = false;
    speak(t.horseTamed(def.name[lang]), 0.95);
    applyHorses(); renderCraftMenu(); saveGame();
  } else if (type === 'portal') {
    game.portalLit = true;
    scene3D?.lightPortal(true);
    sfxVictory(); launchConfetti();
    spellResultEl.replaceChildren(el('p', 'spell-success', `🌀 ${t.portalLit}`), el('p', 'spell-stars', copied ? t.copyNoStars : `+${earned} ${t.stars}`));
    spellResultEl.hidden = false;
    speak(t.portalLit, 0.95);
    applyExtras(); saveGame();
  } else if (type === 'pet') {
    sfxVictory();
    spellResultEl.replaceChildren(
      el('p', 'spell-success', `🐶 ${t.petTamed}`),
      el('p', 'spell-sentence', t.petChooseName),
      petNamePicker(),
      el('p', 'spell-stars', copied ? t.copyNoStars : `+${earned} ${t.stars}`),
    );
    spellResultEl.hidden = false;
    speak(t.petTamed + ' ' + t.petChooseName, 0.95);
    // A name must be chosen before going on (a default one if the child just taps Continue).
    spellContext.after = () => { if (!game.pet?.tamed) { game.pet = { tamed: true, name: (PET_NAMES[lang] ?? PET_NAMES.fr)[0], fedDay: null }; scene3D.pet.tame(); scene3D.pet.obj.labelText = null; applyExtras(); saveGame(); } };
  } else if (type === 'flash') {
    sfxCraft();
    if (!copied) { progress.stars += 2; game.starsEarned += 2; }
    spellResultEl.replaceChildren(
      el('p', 'spell-success', `⚡ ${t.flashDone}`),
      el('p', 'spell-sentence', spellContext.word.sentence ?? buildSentence(wordStr, lang)),
      el('p', 'spell-stars', copied ? t.copyNoStars : `+${earned + 2} ${t.stars}`),
    );
    spellResultEl.hidden = false;
    if (game?.pet?.tamed) scene3D?.pet?.joy();
    speak(t.flashDone, 0.95);
  } else if (type === 'zombieWord') {
    sfxCraft();
    if (!copied) { progress.stars += 2; game.starsEarned += 2; }
    spellResultEl.replaceChildren(
      el('p', 'spell-success', `🧟 ${t.zombieWordDone}`),
      el('p', 'spell-sentence', spellContext.word.sentence ?? buildSentence(wordStr, lang)),
      el('p', 'spell-stars', copied ? t.copyNoStars : `+${earned + 2} ${t.stars}`),
    );
    spellResultEl.hidden = false;
    speak(t.zombieWordDone, 0.95);
  } else if (type === 'revive') {
    sfxCraft();
    spellResultEl.replaceChildren(
      el('p', 'spell-success', `🔥 ${t.reviveDone}`),
      el('p', 'spell-sentence', spellContext.word.sentence ?? buildSentence(wordStr, lang)),
      el('p', 'spell-stars', copied ? t.copyNoStars : `+${earned} ${earned === 1 ? t.star : t.stars}`),
    );
    spellResultEl.hidden = false;
    speak(t.reviveDone, 0.95);
  } else if (type === 'travel') {
    const region = spellContext.region;
    game.story.travel ??= {};
    game.story.travel[region] = true;
    setTravelSignText(spellContext.obj, true);
    { const w = spellContext.obj.worldPos; scene3D?.particleBurst({ x: w.x, y: w.y + 1.6, z: w.z }, '#ffe08a', 26); }
    sfxCraft();
    const name = TRAVEL[region].word[7];
    spellResultEl.replaceChildren(
      el('p', 'spell-success', `🪧 ${t.travelFixed(name.toUpperCase())}`),
      el('p', 'spell-stars', copied ? t.copyNoStars : `+${earned} ${earned === 1 ? t.star : t.stars}`),
    );
    spellResultEl.hidden = false;
    speak(t.travelFixed(name), 0.9);
    const hook = `${region}Sign`;
    spellContext.after = () => { applyStoryState(); if (storyAt(hook)) playScene(hook, () => advanceStory(hook)); saveGame(); };
  } else if (type === 'mimot') {
    const id = spellContext.mimotId;
    game.story.mimots.push(id);
    scene3D?.tameMimot(id);
    sfxVictory();
    spellResultEl.replaceChildren(
      el('p', 'spell-success', `🐣 ${t.mimotTamed}`),
      el('p', 'spell-sentence', buildSentence(wordStr, lang)),
      el('p', 'spell-stars', copied ? t.copyNoStars : `+${earned} ${earned === 1 ? t.star : t.stars}`),
    );
    spellResultEl.hidden = false;
    speak(buildSentence(wordStr, lang), 0.9);
    spellContext.after = () => {
      const def = MIMOTS.find((m) => m.id === id);
      const o = currentObjective();
      if (id === 'fontaine' && storyAt('mimot')) playScene('mimot1', () => advanceStory('mimot'));
      else if (def?.region && o?.countFrom === def.region) {
        const n = game.story.mimots.filter((mid) => MIMOTS.find((m) => m.id === mid)?.region === def.region).length;
        game.story.counts[o.id] = n;
        if (n >= o.count) { game.story.counts[o.id] = n - 1; playScene(o.id, () => advanceStory(o.id)); } else applyStoryState();
      } else applyStoryState();
      saveGame();
    };
  } else if (type === 'spell') {
    const sp = spellContext.spell;
    const power = copied ? 'weak' : firstTry ? 'strong' : 'wobbly';
    scene3D?.castSpell(sp.id, spellContext.circle, power);
    game.spells ??= {};
    const key = spellContext.circle?.cid ?? sp.id;
    game.spells[key] = power;
    const hook = Object.keys(SPELL_HOOKS).find((h) => SPELL_HOOKS[h] === key);
    if (hook) spellContext.after = () => { if (storyAt(hook)) playScene(hook, () => advanceStory(hook)); };
    let extra = '';
    if (sp.id === 'pluie') { game.materials.wheat = (game.materials.wheat ?? 0) + 1; extra = `${MATERIAL_EMOJI.wheat} ${t.gotMaterial}: ${materialName('wheat')}`; }
    sfxCraft();
    saveGame();
    const line = power === 'strong' ? t.powerStrong : power === 'wobbly' ? t.powerWobbly : t.powerWeak;
    spellResultEl.replaceChildren(
      el('p', 'spell-success', `${sp.emoji} ${t.spellCast(spellName(sp))}`),
      el('p', 'spell-sentence', sp.effect[lang] ?? sp.effect.fr),
      el('p', 'spell-stars', `${line}${copied ? '' : `  +${earned} ${earned === 1 ? t.star : t.stars}`}`),
      ...(extra ? [el('p', 'spell-material', extra)] : []),
    );
    spellResultEl.hidden = false;
    speak(`${t.spellCast(spellName(sp))} ${line}`, 0.9);
  } else if (type === 'craft') {
    spellContext.partResults.push({ part: spellContext.currentPart, success: true });
    spellResultEl.replaceChildren(
      el('p', 'spell-success', firstTry ? t.perfectSpelling : t.youGotIt),
      el('p', 'spell-stars', `+${earned} ${earned === 1 ? t.star : t.stars}`),
    );
    spellResultEl.hidden = false;
  }

  updateStreakDisplay();
  updateGameUI();
  renderCraftMenu();
  refreshCircles();
}

function handleSpellFailure(target) {
  const wordStr = spellContext.word.word;
  progress.difficult[wordStr] = (progress.difficult[wordStr] ?? 0) + 1;
  streak = 0;
  updateStreakDisplay();
  sfxError();

  // Keep the coloured tiles on screen for a moment so the child sees which letters were right,
  // and so "Check" cannot be hammered.
  spellCheckBtn.hidden = false;
  spellContinueBtn.hidden = true;
  spellCheckBtn.disabled = true;
  const ctx = spellContext;
  if (spellContext.tries < MAX_TRIES) {
    spellRevealEl.hidden = true;
    spellResultEl.replaceChildren(el('p', 'spell-hint', t.notQuite));
    spellResultEl.hidden = false;
    setTimeout(() => {
      if (spellContext !== ctx) return;
      setSpellLocked(false);
      spellInput.value = '';
      renderSpellTiles();
    }, 1400);
  } else {
    spellContext.copyMode = true;
    spellRevealEl.hidden = false;
    revealTiles.replaceChildren(...[...target].map((l) => el('div', 'tile tile-correct', l.toUpperCase())));
    spellResultEl.replaceChildren(
      el('p', 'spell-fail', t.wordWas(target)),
      el('p', 'spell-fail-detail', t.copyIt),
    );
    spellResultEl.hidden = false;
    speak(target, 0.8);
    setTimeout(() => {
      if (spellContext !== ctx) return;
      setSpellLocked(false);
      spellInput.value = '';
      renderSpellTiles();
    }, 1400);
    if (spellContext.type === 'craft') {
      spellContext.partResults.push({ part: spellContext.currentPart, success: false });
    }
  }
  saveProgress();
}

function onSpellContinue() {
  const ctx = spellContext;
  if (ctx && !ctx.finished) return;
  $('#spell-modal').hidden = true;
  spellResultEl.hidden = true;
  spellRevealEl.hidden = true;
  isLocked = false;

  if (!ctx) return;

  if (ctx.type !== 'craft') {
    spellContext = null;
    updateGameUI();
    renderCraftMenu();
    ctx.after?.();
  } else if (ctx.type === 'craft') {
    // Check if last part failed max times
    const lastResult = ctx.partResults[ctx.partResults.length - 1];
    if (lastResult && !lastResult.success && ctx.tries >= MAX_TRIES) {
      // Part failed — abort crafting
      spellContext = null;
      updateGameUI();
      renderCraftMenu();
    } else {
      spellContext = null;
    }
  }
}

function updateStreakDisplay() {
  const el2 = $('#streak-display');
  if (!el2) return;
  if (streak >= 2) {
    el2.textContent = `${streak}x ${t.streakLabel}!`;
    el2.classList.remove('is-hidden');
    void el2.offsetWidth;
    el2.classList.add('is-pop');
    setTimeout(() => el2.classList.remove('is-pop'), 300);
    if (streak >= 3) el2.classList.add('is-fire'); else el2.classList.remove('is-fire');
  } else {
    el2.classList.add('is-hidden');
    el2.classList.remove('is-fire');
  }
}

/* ===== WIN/LOSE ===== */

function finishGame(won) {
  const finished = game;
  delete progress.save;
  game = null;
  if (won) { progress.victories += 1; sfxVictory(); launchConfetti(); }
  saveProgress();
  $('#results-title').textContent = won ? t.victory : t.defeated;
  $('#results-title').classList.toggle('is-win', won);
  $('#results-title').classList.toggle('is-lose', !won);
  $('#results-subtitle').textContent = won ? t.allCrafted : t.tilesCaptured;
  $('#res-stars').textContent = finished.starsEarned;
  $('#res-words').textContent = finished.wordsSpelled;
  $('#res-moves').textContent = finished.crafted.length;
  const streakEl = $('#res-streak');
  if (streakEl) streakEl.textContent = `${t.bestStreak}: ${progress.bestStreak || 0}x`;
  showScreen('results');
}

/* ===== MENU & TROPHY ===== */

function renderMenu() {
  $('#total-stars').textContent = progress.stars;
  if ($('#hud-stars')) $('#hud-stars').textContent = progress.stars;
  const newBtn = $('#new-game-btn');
  if (newBtn) {
    newBtn.textContent = progress.save ? t.newGame : t.play;
    newBtn.classList.toggle('btn-primary', !progress.save);
    newBtn.classList.toggle('btn-ghost', !!progress.save);
  }
  const cont = $('#continue-btn');
  if (cont) {
    const s = progress.save;
    cont.hidden = !s;
    if (s) {
      cont.textContent = `${t.continueGame} · ${s.crafted.length}/${FINITE_CRAFTS.length} ${t.objectsCrafted}`;
    }
  }
  const cards = LEVELS[lang].map((level) => {
    const card = el('button', 'difficulty-card');
    card.type = 'button'; card.dataset.level = level.id;
    const words = wordsForLevel(level.id);
    const done = words.filter((w) => progress.mastered[w.word]).length;
    card.append(
      el('span', 'diff-tag', level.name),
      el('span', 'diff-blurb', level.blurb),
      el('span', 'diff-count', `${done} ${t.of} ${words.length} ${t.mastered}`),
      progressBar((done / words.length) * 100),
    );
    card.addEventListener('click', () => newGame(level.id));
    return card;
  });
  $('#difficulty-cards').replaceChildren(...cards);
}

function progressBar(percent) {
  const bar = el('div', 'progress');
  const fill = el('div', 'progress-fill');
  fill.style.width = `${Math.round(percent)}%`;
  bar.append(fill);
  return bar;
}

function renderHelp() {
  const container = $('#help-content');
  if (!container) return;
  container.replaceChildren(
    ...t.helpSteps.map((text, i) => {
      const step = el('div', 'help-step');
      step.append(el('span', 'help-step-num', String(i + 1)), el('p', null, text));
      return step;
    }),
  );
}

function renderTrophy() {
  $('#total-stars').textContent = progress.stars;
  if ($('#hud-stars')) $('#hud-stars').textContent = progress.stars;
  $('#trophy-stars').textContent = progress.stars;
  $('#trophy-victories').textContent = progress.victories;
  $('#trophy-mastered').textContent = Object.keys(progress.mastered).length;
  const badges = getBadges();
  $('#badges').replaceChildren(...badges.map((badge) => {
    const earned = badge.earned(progress);
    const node = el('div', `badge ${earned ? 'badge-earned' : 'badge-locked'}`);
    node.append(el('span', 'badge-name', earned ? badge.name : t.locked), el('span', 'badge-text', badge.text));
    return node;
  }));
  const tricky = WORDS[lang].filter((w) => progress.difficult[w.word]);
  const chips = tricky.length ? tricky.map((w) => el('span', 'chip', w.word)) : [el('p', 'empty-text', t.noTricky)];
  $('#trophy-difficult').replaceChildren(...chips);
}

function resetProgress() {
  if (!window.confirm(t.resetConfirm)) return;
  progress = defaultProgress(); saveProgress(); renderTrophy();
}

/* ===== KEYBOARD ===== */

function typeLetter(letter) {
  const target = spellContext?.word?.word ?? '';
  const max = target.length || MAX_GUESS_LENGTH;
  if (isLocked || spellInput.value.length >= max) return;
  spellInput.value += letter;
  // Short phrases: the space between two words fills in by itself.
  while (target[spellInput.value.length] === ' ') spellInput.value += ' ';
  sfxType(); renderSpellTiles();
}
function deleteLetter() {
  if (isLocked) return;
  let v = spellInput.value.replace(/ +$/, '');
  v = v.slice(0, -1).replace(/ +$/, '');
  spellInput.value = v; sfxType(); renderSpellTiles();
}

function buildSpellKeyboard() {
  const rows = LANGUAGES[lang].keyRows.map((letters) => {
    const row = el('div', 'key-row');
    for (const letter of letters) {
      const key = el('button', `key${/[aeiouyàâäéèêëîïôöùûü]/.test(letter) ? ' key-vowel' : ''}`, letter.toUpperCase());
      key.type = 'button'; key.setAttribute('aria-label', letter);
      key.addEventListener('click', () => typeLetter(letter));
      row.append(key);
    }
    return row;
  });
  const bottom = el('div', 'key-row');
  const del = el('button', 'key key-wide', t.delete);
  del.type = 'button'; del.addEventListener('click', deleteLetter);
  bottom.append(del);
  spellKeyboard.replaceChildren(...rows, bottom);
}

/* ===== JOYSTICK ===== */

function initJoystick() {
  const stick = $('#joystick');
  const knob = $('#joystick-knob');
  if (!stick || !knob) return;
  let active = false;
  let rect = null;

  const start = (e) => {
    active = true; rect = stick.getBoundingClientRect();
    e.preventDefault();
  };
  const move = (e) => {
    if (!active || !rect) return;
    const touch = e.touches ? e.touches[0] : e;
    const dx = touch.clientX - rect.left - rect.width / 2;
    const dy = touch.clientY - rect.top - rect.height / 2;
    const max = rect.width / 2;
    const len = Math.hypot(dx, dy);
    const clampedLen = Math.min(len, max);
    const angle = Math.atan2(dy, dx);
    const nx = Math.cos(angle) * clampedLen;
    const ny = Math.sin(angle) * clampedLen;
    knob.style.transform = `translate(${nx}px, ${ny}px)`;
    scene3D?.setJoystick(nx / max, -(ny / max));
  };
  const end = () => {
    active = false; knob.style.transform = 'translate(0, 0)';
    scene3D?.setJoystick(0, 0);
  };

  stick.addEventListener('touchstart', start, { passive: false });
  stick.addEventListener('touchmove', move, { passive: false });
  stick.addEventListener('touchend', end);
  stick.addEventListener('mousedown', start);
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
}

/* ===== INTERACT BUTTON ===== */

function initInteractButton() {
  const btn = $('#interact-btn');
  if (!btn) return;
  btn.addEventListener('click', () => tryInteract());
}

/* ===== EVENTS ===== */

function bindEvents() {
  $('#brand-btn').addEventListener('click', () => showScreen('menu'));
  // One "Play" button: no level to pick, difficulty grows as you explore.
  let newGameArmed = false;
  $('#new-game-btn').addEventListener('click', () => {
    initAudio();
    const btn = $('#new-game-btn');
    if (progress.save && !newGameArmed) {
      newGameArmed = true;
      btn.textContent = t.newGameConfirm;
      setTimeout(() => { newGameArmed = false; renderMenu(); }, 3500);
      return;
    }
    newGameArmed = false;
    if (!progress.age) askAge(() => newGame()); else newGame();
  });
  $('#reset-pos-btn')?.addEventListener('click', () => scene3D?.resetPosition());
  $('#dismount-btn')?.addEventListener('click', () => dismountHorse());
  $('#dialog-next')?.addEventListener('click', () => showDialogLine());
  $('#travel-close')?.addEventListener('click', () => { $('#travel-modal').hidden = true; });
  $('#end-close')?.addEventListener('click', () => { $('#end-modal').hidden = true; });
  $('#dialog-repeat')?.addEventListener('click', () => speak($('#dialog-text').textContent, 0.85));
  $('#grimoire-btn')?.addEventListener('click', () => { renderGrimoire(); $('#grimoire-modal').hidden = false; });
  $('#grimoire-close')?.addEventListener('click', () => { $('#grimoire-modal').hidden = true; });
  $('#grimoire-modal')?.addEventListener('click', (e) => { if (e.target.id === 'grimoire-modal') $('#grimoire-modal').hidden = true; });
  $('#craft-open-btn')?.addEventListener('click', () => { renderCraftMenu(); $('#craft-drawer').hidden = false; });
  $('#craft-close-btn')?.addEventListener('click', () => { $('#craft-drawer').hidden = true; });
  $('#craft-drawer')?.addEventListener('click', (e) => { if (e.target.id === 'craft-drawer') $('#craft-drawer').hidden = true; });
  $('#trophy-btn').addEventListener('click', () => showScreen('trophy'));
  $('#trophy-back-btn').addEventListener('click', () => showScreen('menu'));
  $('#help-btn').addEventListener('click', () => showScreen('help'));
  $('#parents-btn').addEventListener('click', () => showScreen('parents'));
  $('#parents-back-btn').addEventListener('click', () => showScreen('menu'));
  initDashboard();
  $('#help-back-btn').addEventListener('click', () => showScreen('menu'));
  $('#lang-btn').addEventListener('click', toggleLanguage);
  $('#quit-btn').addEventListener('click', () => showScreen('menu'));
  $('#again-btn').addEventListener('click', () => showScreen('menu'));
  $('#res-menu-btn').addEventListener('click', () => showScreen('menu'));
  $('#reset-btn').addEventListener('click', resetProgress);
  $('#spell-check-btn').addEventListener('click', checkSpelling);
  $('#spell-continue-btn').addEventListener('click', onSpellContinue);
  $('#spell-listen-btn').addEventListener('click', () => { if (spellContext) speak(spellContext.word.say ?? spellContext.word.word, 0.9); });
  $('#spell-slow-btn').addEventListener('click', () => { if (spellContext) speak(spellContext.word.say ?? spellContext.word.word, 0.6); });
  spellInput.addEventListener('input', renderSpellTiles);

  document.addEventListener('keydown', (event) => {
    if (!spellContext || $('#spell-modal').hidden) {
      if (game && $('#spell-modal').hidden && document.body.dataset.screen === 'game') {
        if (event.key === 'Enter') { event.preventDefault(); tryInteract(); }
        else if (event.key === ' ') { event.preventDefault(); scene3D?.jump(); }
      }
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      // Enter closes the window only once the word was spelled (or copied) correctly.
      if (spellContext?.finished) onSpellContinue(); else if (!isLocked) checkSpelling();
      return;
    }
    if (!progress.keyboard || isLocked) return;
    const key = event.key.toLowerCase();
    if (/^[a-zàâäéèêëîïôöùûüç]$/i.test(key)) typeLetter(key);
    else if (event.key === 'Backspace') { event.preventDefault(); deleteLetter(); }
  });

  window.addEventListener('resize', () => scene3D?.resize());
  if (synth) { chooseVoice(); synth.addEventListener('voiceschanged', chooseVoice); }
  else $('#speech-note').hidden = false;

  initJoystick();
  initInteractButton();
}

// Interaction hint loop
function updateInteractHint() {
  const btn = $('#interact-btn');
  const hint = $('#interact-hint');
  if (!btn || !hint || !scene3D || !game) return;
  const obj = scene3D.getNearbyInteractable();
  btn.hidden = !obj;
  if (obj) {
    const icon = obj.kind === 'npc' ? '💬' : obj.kind === 'bed' ? '🛏️' : obj.kind === 'circle' ? '🔮' : obj.kind === 'sign' || obj.kind === 'travel' ? '🪧' : obj.kind === 'mimot' ? '🐣' : obj.kind === 'book' ? '📖' : obj.kind === 'boss' ? '⚔️' : obj.kind === 'pet' ? '🐶' : obj.kind === 'portal' ? '🌀' : obj.kind === 'horse' ? '🐴' : '⛏️';
    const ic = btn.querySelector('.interact-icon');
    if (ic && ic.textContent !== icon) ic.textContent = icon;
    btn.classList.add('is-active');
    hint.classList.add('is-visible');
    hint.textContent = `${t.mineHint} ${obj.name}!`;
  } else {
    btn.classList.remove('is-active');
    hint.classList.remove('is-visible');
  }
  requestAnimationFrame(updateInteractHint);
}

function init() {
  // On touch screens the built-in on-screen keyboard is used; stop the iPad keyboard from popping up.
  if (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) {
    spellInput.readOnly = true;
    spellInput.setAttribute('inputmode', 'none');
  }
  // Lift the touch controls out of the animated screen so position:fixed pins them to the viewport.
  const touch = document.querySelector(".touch-controls");
  if (touch) document.body.appendChild(touch);
  if (progress.lang) lang = progress.lang;
  t = UI[lang] ?? UI.en;
  document.documentElement.lang = lang === 'fr' ? 'fr' : 'en-GB';
  buildSpellKeyboard();
  bindEvents();
  chooseVoice();
  applyUIText();
  updateInteractHint();
  // Show the loading screen first, then build the village (the heavy part) once it has painted.
  $('#loading-text').textContent = t.loadingVillage;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    init3DScene();
    showScreen('menu');
    setTimeout(() => $('#loading').classList.add('is-done'), 250);
    let fresh = false;
    try { fresh = sessionStorage.getItem('se-new-game') === '1'; sessionStorage.removeItem('se-new-game'); } catch { /* ignore */ }
    if (fresh) setTimeout(() => newGame('mixed', { afterReload: true }), 300);
  }));
}

init();


/* ===== PARENTS' DASHBOARD ===== */

let dashResetArmed = false;

function dashMessage(text) {
  const msg = $('#dash-msg');
  msg.textContent = text;
  msg.hidden = !text;
}

// Mastery per sound family: how often words with that pattern were spelled right.
const FAMILIES = [
  ['ch', /ch/, 'chat, vache'], ['ou', /ou/, 'loup, mouton'], ['on / om', /o[nm]/, 'cochon, bonbon'],
  ['an / en', /[ae][nm]/, 'maman, enfant'], ['in / ain / ein', /[aei]?i[nm]/, 'lapin, pain'], ['au / eau', /au/, 'auto, bateau'],
  ['oi', /oi/, 'roi, étoile'], ['gn', /gn/, 'montagne'], ['e muet final', /e$/, 'tomate, école'],
  ['lettres muettes', /[stdxp]$/, 'loup, escargot'], ['consonnes doubles', /(ss|ll|tt|mm|nn|pp|rr|ff)/, 'poisson, ballon'],
  ['accents', /[éèêàùâîôûç]/, 'vélo, forêt, garçon'],
];
function renderFamilies(stats) {
  const box = $('#dash-families');
  if (!box) return;
  const ch = game?.story ? chapterDef() : progress.save?.story ? CHAPTERS.find((c) => c.id === progress.save.story.chapter) : null;
  const now = Date.now();
  const cards = stats.filter((st) => st.lang === lang).map((st) => ensureCard(st));
  const due = cards.filter((st) => st.state !== 'new' && st.due <= now + 3600000 * 6).length;
  const learned = cards.filter((st) => st.state === 'review').length;
  const newToday = progress.daily?.[todayKey()]?.newCards ?? 0;
  $('#dash-chapter').textContent = `${ch ? t.chapterNow(ch.title[lang] ?? ch.title.fr) + ' · ' : ''}${t.dueToday(due)} ${t.srsSummary(learned, newToday, progress.newPerDay ?? SRS.newPerDay)}`;
  const fr = stats.filter((s) => s.lang === 'fr' && s.word.length > 2 && s.correct + s.wrong > 0);
  box.replaceChildren(...FAMILIES.map(([name, re, ex]) => {
    const ws = fr.filter((s) => re.test(s.word));
    const tries = ws.reduce((n, s) => n + s.correct + s.wrong, 0);
    const ok = ws.reduce((n, s) => n + s.firstTry, 0);
    const pct = tries ? Math.round((ok / tries) * 100) : null;
    const row = el('div', 'fam-row');
    const label = el('div', '', name); label.append(el('span', 'fam-ex', ex));
    const bar = el('div', 'fam-bar'); const fill = el('span'); fill.style.width = `${pct ?? 0}%`; bar.append(fill);
    row.append(label, bar, el('div', 'fam-val', pct === null ? t.familyNone : `${pct} % · ${t.familyWords(ws.length)}`));
    return row;
  }));
}

// Three word lists for the parents (learned, learning, coming next), 24 words a page.
const LIST_PAGE = 24;
let dashList = 'learned', dashPage = 0;
function wordLists() {
  const levels = (AGE_LADDER[lang] ?? AGE_LADDER.fr).slice(AGE_START[lang]?.[progress.age ?? 6] ?? 0);
  const seen = new Set();
  const learned = [], learning = [], next = [];
  for (const lvl of levels) {
    for (const w of wordsForLevel(lvl)) {
      if (seen.has(w.word)) continue;
      seen.add(w.word);
      const st = progress.wordStats?.[`${lang}:${w.word}`];
      const card = st ? ensureCard(st) : null;
      if (!card || card.state === 'new') next.push({ w });
      else if (card.state === 'review') learned.push({ w, st: card });
      else learning.push({ w, st: card });
    }
  }
  learned.sort((a, b) => (b.st.interval ?? 0) - (a.st.interval ?? 0));
  learning.sort((a, b) => (a.st.due ?? 0) - (b.st.due ?? 0));
  return { learned, learning, next };
}
function renderWordLists() {
  const box = $('#dash-words');
  if (!box) return;
  const lists = wordLists();
  for (const tab of document.querySelectorAll('#dash-tabs .dash-tab')) {
    const k = tab.dataset.list;
    tab.textContent = { learned: t.listLearned, learning: t.listLearning, next: t.listNext }[k](lists[k].length);
    tab.classList.toggle('is-on', k === dashList);
    tab.onclick = () => { dashList = k; dashPage = 0; renderWordLists(); };
  }
  $('#dash-list-note').textContent = { learned: t.listLearnedNote, learning: t.listLearningNote, next: t.listNextNote }[dashList];
  const items = lists[dashList];
  const pages = Math.max(1, Math.ceil(items.length / LIST_PAGE));
  dashPage = Math.min(dashPage, pages - 1);
  const levelName = (id) => LEVELS[lang].find((l) => l.id === id)?.name ?? id;
  const slice = items.slice(dashPage * LIST_PAGE, (dashPage + 1) * LIST_PAGE);
  box.replaceChildren(...(slice.length ? slice.map(({ w, st }) => {
    const card = el('div', `dash-word${dashList === 'learned' ? ' is-learned' : dashList === 'learning' ? ' is-learning' : ''}`);
    card.append(el('b', '', w.word));
    const info = dashList === 'next' ? levelName(w.level) : `${nextReviewLabel(st, true)} · ${t.wordMisses(st.wrong ?? 0)}`;
    card.append(el('small', '', info));
    return card;
  }) : [el('p', 'note', t.listEmpty)]));
  $('#dash-page').textContent = t.pageOf(dashPage + 1, pages);
  $('#dash-prev').disabled = dashPage === 0;
  $('#dash-next').disabled = dashPage >= pages - 1;
  $('#dash-prev').onclick = () => { dashPage = Math.max(0, dashPage - 1); renderWordLists(); };
  $('#dash-next').onclick = () => { dashPage = Math.min(pages - 1, dashPage + 1); renderWordLists(); };
}

function renderDashboard() {
  ageButtons($('#dash-age'), (a) => { setAge(a); renderDashboard(); });
  const zb = $('#dash-zombies');
  if (zb) {
    zb.checked = progress.zombies !== false;
    zb.onchange = () => { progress.zombies = zb.checked; if (scene3D?.zombies) { scene3D.zombies.enabled = zb.checked; if (!zb.checked) scene3D.zombies.clear(); } saveProgress(); };
  }
  const npd = $('#dash-newperday');
  if (npd) {
    npd.value = String(progress.newPerDay ?? SRS.newPerDay);
    npd.onchange = () => { progress.newPerDay = Number(npd.value); saveProgress(); renderDashboard(); };
  }
  const startLevel = LEVELS[lang].find((l) => l.id === levelAt(0));
  $('#dash-age-note').textContent = progress.age ? t.ageNote(progress.age, startLevel?.name ?? '') : '';
  const stats = Object.values(progress.wordStats ?? {});
  renderFamilies(stats);
  renderWordLists();
  const seen = stats.filter((s) => s.seen > 0 || s.correct + s.wrong > 0);
  const attempts = stats.reduce((n, s) => n + s.correct + s.wrong, 0);
  const correct = stats.reduce((n, s) => n + s.correct, 0);
  const firstTry = stats.reduce((n, s) => n + s.firstTry, 0);
  const pct = (a, b) => (b ? `${Math.round((a / b) * 100)} %` : '—');
  const tile = (value, label) => {
    const d = el('div', 'stat');
    d.append(el('span', 'stat-value', String(value)), el('span', 'stat-label', label));
    return d;
  };
  $('#dash-summary').replaceChildren(
    tile(seen.length, t.statWordsSeen),
    tile(attempts, t.statAttempts),
    tile(pct(correct, attempts), t.statSuccess),
    tile(firstTry, t.statFirstTry),
  );

  // Activity bars for the last 14 days.
  const days = [];
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    days.push({ d, ...(progress.daily?.[key] ?? { attempts: 0, correct: 0 }) });
  }
  const max = Math.max(1, ...days.map((d) => d.attempts));
  $('#dash-activity').replaceChildren(...days.map((day) => {
    const col = el('div', 'dash-day');
    const bar = el('div', 'dash-bar');
    bar.style.height = `${(day.attempts / max) * 100}%`;
    const ok = el('div', 'dash-bar-ok');
    ok.style.height = day.attempts ? `${(day.correct / day.attempts) * 100}%` : '0';
    bar.append(ok);
    bar.title = `${day.correct}/${day.attempts}`;
    const num = el('span', 'dash-day-num', day.attempts ? String(day.attempts) : '');
    const label = el('span', 'dash-day-label', day.d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { weekday: 'narrow', day: 'numeric' }));
    col.append(num, bar, label);
    return col;
  }));

  renderDashboardTable();
}

function renderDashboardTable() {
  const level = $('#dash-level').value || 'all';
  const sort = $('#dash-sort').value || 'hardest';
  const showUnseen = $('#dash-unseen').checked;
  const rows = [];
  const listed = new Set();
  for (const w of WORDS[lang]) {
    if (level !== 'all' && w.level !== level) continue;
    if (listed.has(w.word)) continue;
    listed.add(w.word);
    const s = progress.wordStats?.[`${lang}:${w.word}`];
    const met = s && (s.seen > 0 || s.correct + s.wrong > 0);
    if (!met && !showUnseen) continue;
    rows.push({ w, s: s ?? { seen: 0, correct: 0, wrong: 0, misspellings: [], lastSeen: 0 }, met });
  }
  const rate = (r) => (r.s.correct + r.s.wrong ? r.s.correct / (r.s.correct + r.s.wrong) : 2);
  if (sort === 'hardest') rows.sort((a, b) => rate(a) - rate(b) || b.s.wrong - a.s.wrong);
  else if (sort === 'recent') rows.sort((a, b) => (b.s.lastSeen || 0) - (a.s.lastSeen || 0));
  else rows.sort((a, b) => a.w.word.localeCompare(b.w.word, lang));

  const table = $('#dash-table');
  if (!rows.length) {
    const tr = el('tr');
    const td = el('td', 'dash-empty', t.noData);
    td.colSpan = 9;
    tr.append(td);
    table.replaceChildren(tr);
    return;
  }
  const head = el('tr');
  for (const k of ['colWord', 'colLevel', 'colSeen', 'colRight', 'colWrong', 'colRate', 'colMistakes', 'colLast', 'colNext']) head.append(el('th', '', t[k]));
  const thead = el('thead'); thead.append(head);
  const tbody = el('tbody');
  const fmtDate = (ms) => (ms ? new Date(ms).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short' }) : '—');
  for (const { w, s, met } of rows) {
    const tr = el('tr', met ? '' : 'dash-unseen-row');
    const attempts = s.correct + s.wrong;
    const r = attempts ? Math.round((s.correct / attempts) * 100) : null;
    const rateCell = el('td', `dash-rate ${r === null ? '' : r >= 80 ? 'good' : r >= 50 ? 'mid' : 'bad'}`, r === null ? '—' : `${r} %`);
    tr.append(
      el('td', 'dash-word', w.word),
      el('td', '', t.levelNames?.[w.level] ?? w.level),
      el('td', 'num', met ? String(s.seen) : t.notSeenYet),
      el('td', 'num ok', String(s.correct)),
      el('td', 'num ko', String(s.wrong)),
      rateCell,
      el('td', 'dash-mistakes', s.misspellings.join(', ')),
      el('td', '', fmtDate(s.lastSeen)),
      el('td', 'dash-next', nextReviewLabel(s, met)),
    );
    tbody.append(tr);
  }
  table.replaceChildren(thead, tbody);
}

// When the word comes back: "now", "in 10 min", "tomorrow", "in 6 days"…
function nextReviewLabel(s, met) {
  if (!met || !s.state || s.state === 'new') return '—';
  const d = s.due - Date.now();
  if (d <= 0) return t.nextNow;
  if (d < 3600000) return t.nextMinutes(Math.max(1, Math.round(d / 60000)));
  const days = Math.round(d / 86400000);
  return days <= 1 ? t.nextTomorrow : t.nextDays(days);
}

function backupJson() {
  return JSON.stringify({ app: 'spelling-empires', version: 1, exportedAt: new Date().toISOString(), progress }, null, 2);
}

function initDashboard() {
  const levelSel = $('#dash-level');
  const sortSel = $('#dash-sort');
  const fillSelects = () => {
    const lv = levelSel.value || 'all';
    const so = sortSel.value || 'hardest';
    levelSel.replaceChildren(...[['all', t.filterAll], ...LEVELS[lang].map((l) => [l.id, l.name])].map(([v, label]) => {
      const o = el('option', '', label); o.value = v; return o;
    }));
    sortSel.replaceChildren(...[['hardest', t.sortHardest], ['recent', t.sortRecent], ['alpha', t.sortAlpha]].map(([v, label]) => {
      const o = el('option', '', label); o.value = v; return o;
    }));
    levelSel.value = lv; sortSel.value = so;
  };
  fillSelects();
  $('#parents-btn').addEventListener('click', fillSelects);
  levelSel.addEventListener('change', renderDashboardTable);
  sortSel.addEventListener('change', renderDashboardTable);
  $('#dash-unseen').addEventListener('change', renderDashboardTable);

  $('#dash-export').addEventListener('click', () => {
    const blob = new Blob([backupJson()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `spelling-empires-${todayKey()}.json`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  });
  $('#dash-copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(backupJson()); dashMessage(t.copied); } catch { dashMessage(''); }
  });
  $('#dash-import').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (data?.app !== 'spelling-empires' || !data.progress) throw new Error('bad');
      progress = { ...defaultProgress(), ...data.progress };
      saveProgress();
      renderDashboard();
      dashMessage(t.imported);
    } catch { dashMessage(t.importError); }
    event.target.value = '';
  });
  $('#dash-reset').addEventListener('click', () => {
    const btn = $('#dash-reset');
    if (!dashResetArmed) {
      dashResetArmed = true;
      btn.textContent = t.resetConfirm;
      btn.classList.add('is-armed');
      setTimeout(() => { dashResetArmed = false; btn.textContent = t.resetStats; btn.classList.remove('is-armed'); }, 4000);
      return;
    }
    progress.wordStats = {};
    progress.daily = {};
    progress.mastered = {};
    progress.difficult = {};
    saveProgress();
    dashResetArmed = false;
    btn.textContent = t.resetStats;
    btn.classList.remove('is-armed');
    renderDashboard();
  });
}


/* ===== EQUIPMENT: carry crafted objects and use them ===== */

function equipItem(id) {
  if (!game) return;
  game.equipped = game.equipped === id ? null : id;
  scene3D?.setHeldItem(game.equipped);
  renderEquipBar();
  saveGame();
}

/* ===== ZOMBIES: the attack button swings the best sword the child owns ===== */
function swordPower() {
  const owned = (game?.crafted ?? []);
  if (owned.includes('sword_diamond')) return { power: 'diamond', id: 'sword_diamond' };
  const sw = owned.find((id) => id.startsWith('sword'));
  return sw ? { power: 'sword', id: sw } : { power: 'hand', id: null };
}
let swordHintShown = false;
let horseBlockSaid = false;
// A happy face pops up above the hero.
function smile() {
  const pos = scene3D?.getPlayerScreenPosition();
  if (pos) showFloatingText(pos.x, pos.y - 70, '😄', '#ffd34a');
}
function sfxHit() { playNoise({ freq: 300, q: 0.7, volume: 0.12, duration: 0.12 }); playTone(180, 0.12, 'square', 0.06); }
function sfxPop() { playTone(660, 0.07, 'triangle', 0.12); playTone(990, 0.12, 'triangle', 0.12, 0.06); }
function zombieAttack(power = swordPower().power) {
  if (!scene3D?.zombies) return;
  const res = scene3D.zombies.hit(power);
  if (res.touched) sfxHit();
  if (res.disarmed) { playTone(1200, 0.08, 'square', 0.08); playTone(800, 0.14, 'square', 0.06, 0.05); toast(t.zombieDisarmed, 3200); }
  if (res.defeated) {
    progress.stars += res.defeated; game.starsEarned += res.defeated;
    toast(t.zombieDefeated); smile(); updateGameUI(); saveGame();
    setTimeout(sfxPop, 450);
    if (Math.random() < (window.__se?.zombieWordAlways ?? ZOMBIE_WORD_CHANCE)) setTimeout(beginZombieWord, 1300);
  } else if (res.touched && power === 'hand' && !swordHintShown) { swordHintShown = true; toast(t.zombieNeedSword, 4200); }
}
// Hearts: 2 at the start, up to 5 won by playing well (a boss, 10 words in a row, every place
// found, the heart pie). Losing them all sends the hero back to bed; they come back with time.
const HEART_REGEN = 20000, HEARTS_MAX = 5;
const maxHearts = () => Math.min(HEARTS_MAX, game?.maxHearts ?? 2);
let hearts = 2, hurtAt = 0;
function zombieTouch() {
  hearts = Math.min(hearts, maxHearts()) - 1;
  hurtAt = performance.now();
  if (hearts <= 0) { hearts = maxHearts(); renderHearts(); knockOut('zombie'); return 'ko'; }
  sfxHit(); sfxError();
  toast(t.zombieHurt(hearts));
  speak(t.ouchSay, 1);
  const f = $('#hurt-flash');
  if (f) { f.hidden = false; f.classList.remove('is-on'); void f.offsetWidth; f.classList.add('is-on'); setTimeout(() => { f.hidden = true; }, 600); }
  renderHearts();
  return 'hurt';
}
let heartShownUntil = 0;
function gainHeart(reason) {
  if (!game) return false;
  game.heartsFrom ??= [];
  if (game.heartsFrom.includes(reason) || maxHearts() >= HEARTS_MAX) return false;
  game.heartsFrom.push(reason);
  game.maxHearts = maxHearts() + 1;
  hearts = game.maxHearts;
  heartShownUntil = performance.now() + 6000;
  renderHearts();
  setTimeout(() => {
    sfxVictory(); launchConfetti();
    toast(t.heartGained(game.maxHearts), 4500);
    speak(t.heartGained(game.maxHearts).replace(/^\S+ /, ''), 0.95);
  }, 1200);
  saveGame();
  return true;
}
function renderHearts() {
  const h = $('#hearts');
  if (!h || !scene3D?.zombies) return;
  const max = maxHearts();
  if (hearts > max || (hearts < max && performance.now() - hurtAt > HEART_REGEN)) hearts = max;
  h.hidden = !(hearts < max || performance.now() < heartShownUntil || (scene3D.zombies.active.length && scene3D.zombies.nearest() < 14));
  h.textContent = '❤️'.repeat(hearts) + '🤍'.repeat(max - hearts);
}
function onMeatPickup() {
  game.materials.meat = (game.materials.meat ?? 0) + 1;
  sfxCraft(); smile();
  toast(game.pet?.tamed ? t.meatPickedPet(game.materials.meat, game.pet.name) : t.meatPicked(game.materials.meat));
  updateGameUI(); renderCraftMenu(); saveGame();
}
function onZombieBurnt() {
  progress.stars += 1; game.starsEarned += 1;
  toast(t.zombieBurnt); smile(); updateGameUI(); saveGame();
}
function giveBrochette() {
  game.materials.brochette -= 1;
  if (!game.materials.brochette) delete game.materials.brochette;
  progress.stars += 5; game.starsEarned += 5;
  sfxVictory(); smile(); launchConfetti();
  toast(t.rosaThanks); speak(t.rosaThanksSay, 0.95);
  updateGameUI(); renderCraftMenu(); saveGame();
}
// The lava bucket refills in 30 seconds.
const BUCKET_RECHARGE = 30;
let bucketReadyAt = 0;
function attackButton() {
  if (!game || !scene3D) return;
  initAudio();
  const sw = swordPower();
  if (sw.id && game.equipped !== sw.id) equipItem(sw.id);
  if (sw.id) scene3D.useItem(sw.id); else playActionSwing();
  zombieAttack(sw.power);
}
function playActionSwing() { if (!scene3D.player.userData.action) playAction(scene3D.player, 'swing', 0.35); }
function updateAttackButton() {
  const b = $('#attack-btn');
  if (!b || !scene3D?.zombies) return;
  b.hidden = !(scene3D.zombies.active.length && scene3D.zombies.nearest() < 9);
}

function useEquipped() {
  if (!game?.equipped || !scene3D) return;
  if (!$('#spell-modal').hidden) return;
  initAudio();
  if (game.equipped === 'bucket') {
    const wait = Math.ceil((bucketReadyAt - performance.now()) / 1000);
    if (wait > 0) { toast(t.bucketWait(wait)); return; }
  }
  if (scene3D.useItem(game.equipped)) {
    sfxMine();
    if (game.equipped === 'bucket') {
      bucketReadyAt = performance.now() + BUCKET_RECHARGE * 1000;
      setTimeout(() => { if (game) toast(t.bucketReady); }, BUCKET_RECHARGE * 1000);
    }
    if (game.equipped.startsWith('sword')) zombieAttack(game.equipped === 'sword_diamond' ? 'diamond' : 'sword');
    // Swinging the pickaxe at a glowing spot starts mining there.
    if (game.equipped.startsWith('pickaxe')) setTimeout(() => { if (scene3D.getNearbyInteractable()) tryInteract(); }, 450);
  }
}

function renderEquipBar() {
  const bar = $('#equip-bar');
  const useBtn = $('#use-btn');
  if (!bar || !game) return;
  const owned = HOLDABLE_IDS.map(bestVersion).filter(Boolean);
  bar.hidden = owned.length === 0;
  bar.replaceChildren(...owned.map((id) => {
    const item = craftable(id);
    const b = el('button', `equip-slot${game.equipped === id ? ' is-equipped' : ''}`);
    b.type = 'button';
    b.append(el('span', 'equip-emoji', craftable(id.split('_')[0])?.emoji ?? item.emoji), el('span', 'equip-name', itemName(item)));
    b.addEventListener('click', () => equipItem(id));
    return b;
  }));
  if (useBtn) {
    const item = game.equipped ? craftable(game.equipped) : null;
    useBtn.hidden = !item;
    if (item) {
      useBtn.querySelector('.use-icon').textContent = craftable(game.equipped.split('_')[0])?.emoji ?? item.emoji;
      useBtn.setAttribute('aria-label', `${t.useItem ?? 'Use'} ${itemName(item)}`);
    }
  }
}

document.addEventListener('keydown', (event) => {
  if (!game || document.body.dataset.screen !== 'game' || !$('#spell-modal').hidden) return;
  if ((event.key === 'f' || event.key === 'F') && !$('#attack-btn').hidden) { attackButton(); return; }
  if (event.key === 'f' || event.key === 'F' || event.key === 'e' || event.key === 'E') useEquipped();
});
$('#use-btn')?.addEventListener('click', useEquipped);
$('#attack-btn')?.addEventListener('click', (e) => { e.preventDefault(); attackButton(); });
$('#jump-btn')?.addEventListener('pointerdown', (e) => { e.preventDefault(); scene3D?.jump(); });
$('#continue-btn')?.addEventListener('click', () => { initAudio(); continueGame(); });


/* ===== MESSAGES ===== */
function toast(text, ms = 3200) {
  const el2 = $('#toast');
  if (!el2) return;
  el2.textContent = text;
  el2.hidden = false;
  el2.classList.remove('is-in'); void el2.offsetWidth; el2.classList.add('is-in');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { el2.hidden = true; }, ms);
}

/* ===== VILLAGER QUESTS ===== */
function questFor(npcId) {
  const list = QUESTS[npcId];
  if (!list) return null;
  const i = game?.quests?.[npcId] ?? 0;
  return list[i] ?? null;
}

function questReady(q) {
  if (q.need.materials) return Object.entries(q.need.materials).every(([m, n]) => (game.materials[m] ?? 0) >= n);
  if (q.need.crafted) return game.crafted.includes(q.need.crafted);
  if (q.need.stat?.chests) return (game.chests ?? 0) >= q.need.stat.chests;
  return false;
}

let questNpc = null;
function openQuest(obj) {
  questNpc = obj.npcId;
  const info = NPC_INFO[obj.npcId];
  const q = questFor(obj.npcId);
  $('#quest-portrait').textContent = info?.emoji ?? '🙂';
  $('#quest-name').textContent = info?.name[lang] ?? obj.npcId;
  const need = $('#quest-need');
  const reward = $('#quest-reward');
  if (!q) {
    $('#quest-text').textContent = t.allQuestsDone;
    need.replaceChildren(); reward.replaceChildren();
    $('#quest-give-btn').hidden = true;
  } else {
    $('#quest-text').textContent = q.text[lang];
    const chips = [];
    if (q.need.materials) {
      chips.push(el('span', 'quest-label', t.youNeed));
      for (const [m, n] of Object.entries(q.need.materials)) {
        const have = game.materials[m] ?? 0;
        chips.push(el('span', `quest-chip ${have >= n ? 'ok' : ''}`, `${MATERIAL_EMOJI[m]} ${materialName(m)} ${Math.min(have, n)}/${n}`));
      }
    } else if (q.need.crafted) {
      const it = craftable(q.need.crafted);
      chips.push(el('span', 'quest-label', t.craftedNeed), el('span', `quest-chip ${game.crafted.includes(q.need.crafted) ? 'ok' : ''}`, `${it.emoji} ${itemName(it)}`));
    } else if (q.need.stat?.chests) {
      chips.push(el('span', 'quest-label', t.doneNeed), el('span', `quest-chip ${(game.chests ?? 0) >= q.need.stat.chests ? 'ok' : ''}`, `🎁 ${t.chestsNeed(q.need.stat.chests)}`));
    }
    need.replaceChildren(...chips);
    const r = [el('span', 'quest-label', t.rewardLabel)];
    if (q.reward.stars) r.push(el('span', 'quest-chip gold', `${q.reward.stars} ★`));
    for (const [m, n] of Object.entries(q.reward.materials ?? {})) r.push(el('span', 'quest-chip gold', `${MATERIAL_EMOJI[m]} ${materialName(m)} ×${n}`));
    if (q.reward.costume) { const c = COSTUMES.find((x) => x.id === q.reward.costume); r.push(el('span', 'quest-chip gold', `${c.emoji} ${c.name[lang]}`)); }
    reward.replaceChildren(...r);
    $('#quest-give-btn').hidden = !questReady(q);
  }
  $('#quest-modal').hidden = false;
  speak($('#quest-text').textContent, 0.95);
}

function completeQuest() {
  const q = questFor(questNpc);
  if (!q || !questReady(q)) return;
  for (const [m, n] of Object.entries(q.need.materials ?? {})) {
    game.materials[m] -= n;
    if (game.materials[m] <= 0) delete game.materials[m];
  }
  if (q.reward.stars) { progress.stars += q.reward.stars; game.starsEarned += q.reward.stars; }
  for (const [m, n] of Object.entries(q.reward.materials ?? {})) game.materials[m] = (game.materials[m] ?? 0) + n;
  if (q.reward.costume) unlockCostume(q.reward.costume);
  game.quests ??= {};
  game.quests[questNpc] = (game.quests[questNpc] ?? 0) + 1;
  sfxVictory();
  launchConfetti();
  $('#quest-text').textContent = q.thanks[lang];
  speak(q.thanks[lang], 0.95);
  $('#quest-need').replaceChildren();
  $('#quest-give-btn').hidden = true;
  saveGame();
  updateGameUI();
  renderCraftMenu();
  refreshSpots();
}

/* ===== FISHING ===== */
let fishing = null;
function startFishing(obj) {
  initAudio();
  scene3D.castLine();
  sfxJump();
  const prompt = $('#fish-prompt');
  $('#fish-text').textContent = t.fishWait;
  $('#fish-pull-btn').hidden = true;
  prompt.hidden = false;
  const biteIn = 1500 + Math.random() * 2500;
  fishing = { obj, state: 'waiting' };
  fishing.timer = setTimeout(() => {
    if (!fishing) return;
    fishing.state = 'bite';
    scene3D.bobberBite();
    sfxBreak();
    $('#fish-text').textContent = t.fishBite;
    $('#fish-pull-btn').hidden = false;
    // Too slow: the fish swims away.
    fishing.timer = setTimeout(() => {
      if (!fishing || fishing.state !== 'bite') return;
      $('#fish-text').textContent = t.fishMissed;
      $('#fish-pull-btn').hidden = true;
      scene3D.endFishing();
      fishing = null;
      setTimeout(() => { if (!fishing) prompt.hidden = true; }, 1500);
    }, 2600);
  }, biteIn);
}
function pullFish() {
  if (!fishing || fishing.state !== 'bite') return;
  clearTimeout(fishing.timer);
  const obj = fishing.obj;
  fishing = null;
  $('#fish-prompt').hidden = true;
  scene3D.endFishing();
  beginMine(obj);
}

/* ===== COSTUMES ===== */
function costumeState() {
  progress.costumes ??= { owned: ['hero'], current: 'hero' };
  return progress.costumes;
}
function applyCostume() {
  const c = COSTUMES.find((x) => x.id === costumeState().current) ?? COSTUMES[0];
  if (c.id !== 'hero' || scene3D?.player?.userData.costume) scene3D?.setHeroCostume(c.spec);
  if (scene3D?.player) scene3D.player.userData.costume = c.id;
}
function unlockCostume(id) {
  const s = costumeState();
  if (!s.owned.includes(id)) s.owned.push(id);
  const c = COSTUMES.find((x) => x.id === id);
  setTimeout(() => toast(`${c.emoji} ${t.costumeUnlocked} : ${c.name[lang]} !`), 900);
  saveProgress();
}
function renderWardrobe() {
  const s = costumeState();
  $('#wardrobe-lede').textContent = t.wardrobeLede(progress.stars);
  const questCostumes = new Set(Object.values(QUESTS).flat().map((q) => q.reward.costume).filter(Boolean));
  $('#wardrobe-grid').replaceChildren(...COSTUMES.map((c) => {
    const owned = s.owned.includes(c.id);
    const card = el('div', `wardrobe-card ${s.current === c.id ? 'is-current' : ''} ${owned ? '' : 'is-locked'}`);
    card.append(el('span', 'wardrobe-emoji', c.emoji), el('span', 'wardrobe-name', c.name[lang]));
    const btn = el('button', 'btn btn-small');
    btn.type = 'button';
    if (s.current === c.id) { btn.textContent = t.wearing; btn.disabled = true; btn.classList.add('btn-ghost'); }
    else if (owned) { btn.textContent = t.wear; btn.classList.add('btn-primary'); btn.addEventListener('click', () => { s.current = c.id; saveProgress(); applyCostume(); renderWardrobe(); }); }
    else {
      btn.textContent = `${t.buy} · ${c.price} ★`;
      btn.classList.add('btn-accent');
      btn.disabled = progress.stars < c.price;
      btn.addEventListener('click', () => {
        if (progress.stars < c.price) return;
        progress.stars -= c.price;
        s.owned.push(c.id); s.current = c.id;
        saveProgress(); applyCostume(); sfxCraft(); renderWardrobe();
        $('#total-stars').textContent = progress.stars;
      });
    }
    card.append(btn);
    if (!owned && questCostumes.has(c.id)) card.append(el('span', 'wardrobe-note', `🎖️ ${t.questReward}`));
    return card;
  }));
  renderDecor();
}

// Decorations for the cottage (kept with the stars, like outfits).
function renderDecor() {
  progress.decor ??= [];
  $('#decor-title').textContent = `🏠 ${t.decorTitle}`;
  $('#decor-lede').textContent = t.decorLede;
  $('#decor-grid').replaceChildren(...DECOR.map((d) => {
    const owned = progress.decor.includes(d.id);
    const card = el('div', `wardrobe-card ${owned ? 'is-current' : 'is-locked'}`);
    card.append(el('span', 'wardrobe-emoji', d.emoji), el('span', 'wardrobe-name', d.name[lang]));
    const btn = el('button', 'btn btn-small');
    btn.type = 'button';
    if (owned) { btn.textContent = `✓ ${t.decorPlaced}`; btn.disabled = true; btn.classList.add('btn-ghost'); }
    else {
      btn.textContent = `${t.buy} · ${d.cost} ★`;
      btn.classList.add('btn-accent');
      btn.disabled = progress.stars < d.cost;
      btn.addEventListener('click', () => {
        if (progress.stars < d.cost || progress.decor.includes(d.id)) return;
        progress.stars -= d.cost;
        progress.decor.push(d.id);
        saveProgress(); sfxCraft();
        scene3D?.placeDecor(d.id);
        toast(t.decorBought(d.name[lang]), 3000);
        renderWardrobe();
        $('#total-stars').textContent = progress.stars;
      });
    }
    card.append(btn);
    return card;
  }));
}

/* ===== WORD ALBUM ===== */
function renderAlbum() {
  const levels = childLevels();
  const words = WORDS[lang].filter((w) => levels.includes(w.level));
  const unique = [...new Set(words.map((w) => w.word))];
  const got = unique.filter((w) => progress.mastered[w]).length;
  $('#album-lede').textContent = t.albumLede(got, unique.length);
  const tamed = progress.save?.story?.mimots?.length ?? game?.story?.mimots?.length ?? 0;
  $('#album-lede').append(el('div', 'album-mimots', t.mimotsTamed(tamed, MIMOTS.length)));
  const sections = levels.map((lvl) => {
    const list = words.filter((w) => w.level === lvl);
    const sec = el('section', 'card section');
    const n = list.filter((w) => progress.mastered[w.word]).length;
    const name = LEVELS[lang].find((l) => l.id === lvl)?.name ?? t.levelNames?.[lvl] ?? lvl;
    sec.append(el('h2', '', `${name} · ${n}/${list.length}`));
    const grid = el('div', 'album-grid');
    for (const w of list) {
      const has = progress.mastered[w.word];
      const card = el('div', `album-card ${has ? 'is-got' : ''}`);
      card.append(el('span', 'album-emoji', has ? (WORD_EMOJI[lang]?.[w.word] ?? '⭐') : '?'), el('span', 'album-word', has ? w.word : '• '.repeat(w.word.length).trim()));
      if (has) card.addEventListener('click', () => speak(`${w.word}. ${buildSentence(w.word, lang)}`, 0.9));
      grid.append(card);
    }
    sec.append(grid);
    return sec;
  });
  $('#album-content').replaceChildren(...sections);
}

// Navigation for the new pages; they return to wherever you came from.
let returnScreen = 'menu';
function openPage(name) { returnScreen = document.body.dataset.screen === 'game' ? 'game' : 'menu'; showScreen(name); }
$('#album-btn')?.addEventListener('click', () => openPage('album'));
$('#wardrobe-btn')?.addEventListener('click', () => openPage('wardrobe'));
$('#menu-album-btn')?.addEventListener('click', () => openPage('album'));
$('#menu-wardrobe-btn')?.addEventListener('click', () => openPage('wardrobe'));
$('#album-back-btn')?.addEventListener('click', () => showScreen(returnScreen));
$('#wardrobe-back-btn')?.addEventListener('click', () => showScreen(returnScreen));
$('#quest-give-btn')?.addEventListener('click', completeQuest);
$('#quest-close-btn')?.addEventListener('click', () => { $('#quest-modal').hidden = true; });
$('#fish-pull-btn')?.addEventListener('click', pullFish);


/* ===== HANDWRITING MODE ===== */
// Draw one letter at a time; the on-device neural network turns it into a typed letter.
const hw = { strokes: [], current: null, timer: null, ready: false, misses: 0, forceGuide: false };
const hwCanvas = $('#hw-canvas');

function setInputMode(mode) {
  progress.inputMode = mode;
  saveProgress();
  const drawing = mode === 'draw';
  $('#hw-panel').hidden = !drawing;
  $('#spell-keyboard').hidden = drawing;
  $('#hw-toggle').textContent = drawing ? '⌨️' : '✏️';
  $('#hw-guide').classList.toggle('is-off', progress.traceGuide === false);
  if (drawing) {
    sizeHwCanvas();
    if (!hw.ready) {
      $('#hw-hint').textContent = t.loadingModel;
      loadModel().then(() => { hw.ready = true; $('#hw-hint').textContent = t.drawHint; });
    }
  }
}

function sizeHwCanvas() {
  requestAnimationFrame(() => {
    const r = hwCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    hwCanvas.width = Math.round(r.width * dpr);
    hwCanvas.height = Math.round(r.height * dpr);
    redrawHw();
  });
}

function redrawHw() {
  const g = hwCanvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, hwCanvas.width, hwCanvas.height);
  // Grey model letter to trace over (for younger children). It shows the next letter of the word.
  const expected = spellContext?.word?.word[spellInput.value.length];
  if (expected && (progress.traceGuide === true || (progress.traceGuide === 'auto' && hw.wordGuide) || hw.forceGuide) && !isLocked) {
    const w = hwCanvas.width / dpr, h = hwCanvas.height / dpr;
    g.save();
    g.fillStyle = 'rgba(31, 42, 68, 0.2)';
    g.font = `600 ${Math.round(h * 0.6)}px "Chalkboard SE", "Comic Sans MS", "Segoe Print", system-ui, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    g.fillText(expected, w / 2, h * 0.78);
    g.restore();
  }
  g.strokeStyle = '#1f2a44'; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round';
  for (const s of [...hw.strokes, ...(hw.current ? [hw.current] : [])]) {
    g.beginPath();
    g.moveTo(s[0][0], s[0][1]);
    for (const [x, y] of s.slice(1)) g.lineTo(x, y);
    if (s.length === 1) g.lineTo(s[0][0] + 0.5, s[0][1]);
    g.stroke();
  }
  $('#hw-hint').hidden = hw.strokes.length > 0 || !!hw.current || ((progress.traceGuide === true || hw.wordGuide) && !!spellContext);
}

function hwPoint(e) {
  const r = hwCanvas.getBoundingClientRect();
  return [e.clientX - r.left, e.clientY - r.top];
}

hwCanvas?.addEventListener('pointerdown', (e) => {
  if (isLocked || !hw.ready) return;
  e.preventDefault();
  hwCanvas.setPointerCapture(e.pointerId);
  clearTimeout(hw.timer);
  hw.current = [hwPoint(e)];
  redrawHw();
});
hwCanvas?.addEventListener('pointermove', (e) => {
  if (!hw.current) return;
  e.preventDefault();
  const p = hwPoint(e);
  const last = hw.current[hw.current.length - 1];
  if (Math.hypot(p[0] - last[0], p[1] - last[1]) > 1.5) { hw.current.push(p); redrawHw(); }
});
const endStroke = () => {
  if (!hw.current) return;
  hw.strokes.push(hw.current);
  hw.current = null;
  redrawHw();
  // Recognise once the child pauses (time to add a dot or an accent first).
  // A lone upright stick may become an i: leave more time for the dot.
  clearTimeout(hw.timer);
  const only = hw.strokes.length === 1 ? inkBox(hw.strokes) : null;
  const stick = only && only.h > only.w * 3;
  hw.timer = setTimeout(recognizeDrawing, stick ? 1500 : 850);
};
hwCanvas?.addEventListener('pointerup', endStroke);
hwCanvas?.addEventListener('pointercancel', endStroke);

// The letter is only written once it is the right one: a wrong letter is not typed, the child
// tries again on the same letter. Letters that just miss a dot or an accent stay on the pad.
function hwFeedback(text, kind = '') {
  const label = $('#hw-label');
  label.textContent = text ?? t.didYouMean;
  label.classList.toggle('is-wrong', kind === 'wrong');
  label.classList.toggle('is-close', kind === 'close');
}
function acceptHwLetter(letter) {
  hw.strokes = [];
  hw.misses = 0;
  hw.forceGuide = false;
  typeLetter(letter);
  speakLetter(letter);
  spellTilesEl.children[spellInput.value.length - 1]?.classList.add('tile-good');
  hwFeedback();
  // Every drawn letter is already checked: a finished word validates itself.
  if (spellContext?.word && spellInput.value.length === spellContext.word.word.length) setTimeout(() => checkSpelling(), 1300);
}
// The drawing lacks only a mark the expected letter needs (e for é, a stick for i).
function needsMark(got, expected) {
  const base = expected.normalize('NFD')[0];
  if (got === base && base !== expected) return true;
  return (base === 'i' || base === 'j') && (got === 'l' || got === 'i');
}

async function recognizeDrawing() {
  if (!hw.strokes.length || isLocked) return;
  const strokes = hw.strokes;
  const expected = spellContext?.word?.word[spellInput.value.length];
  const res = await recognize(strokes, lang, expected);
  if (!expected) { hw.strokes = []; typeLetter(res.letter); redrawHw(); return; }
  // After a few tries, a near miss of the network is enough (it may be reading a fine letter badly).
  const lenient = hw.misses >= 3 && [res.letter, ...res.alternatives.slice(0, 2)].includes(expected);
  if (res.letter === expected || lenient) {
    acceptHwLetter(expected);
  } else if (needsMark(res.letter, expected) && strokes.length <= 2) {
    // Keep the ink: the dot or accent drawn next is added to it.
    hwFeedback(t.hwAddMark, 'close');
  } else {
    hw.strokes = [];
    hw.misses = (hw.misses ?? 0) + 1;
    if (hw.misses >= 3) hw.forceGuide = true; // show the grey model even if it was turned off
    if (spellContext && !spellContext.hwMissed) {
      // Counted once per word in the parents' stats (as a misspelling, not a failed word).
      spellContext.hwMissed = true;
      const st = wordStat(spellContext.word);
      st.misspellings = [`${spellInput.value}${res.letter}…`, ...st.misspellings].slice(0, 5);
      saveProgress();
    }
    sfxError();
    hwFeedback(t.hwTryAgain(res.letter.toUpperCase()), 'wrong');
    const tile = spellTilesEl.children[spellInput.value.length];
    if (tile) { tile.classList.remove('tile-shake'); void tile.offsetWidth; tile.classList.add('tile-shake'); }
  }
  redrawHw();
}

$('#hw-toggle')?.addEventListener('click', () => setInputMode(progress.inputMode === 'draw' ? 'keys' : 'draw'));
$('#hw-clear')?.addEventListener('click', () => { hwFeedback(); hw.strokes = []; hw.current = null; clearTimeout(hw.timer); redrawHw(); });
$('#hw-back')?.addEventListener('click', () => { hwFeedback(); deleteLetter(); $('#hw-alts').replaceChildren(); redrawHw(); });
$('#hw-keyboard')?.addEventListener('click', () => setInputMode('keys'));
$('#hw-guide')?.addEventListener('click', () => {
  progress.traceGuide = progress.traceGuide === false ? ((progress.age ?? 6) === 6 ? 'auto' : true) : false;
  saveProgress();
  $('#hw-guide').classList.toggle('is-off', progress.traceGuide === false);
  redrawHw();
});


/* ===== SLEEPING IN THE COTTAGE BED ===== */
function refreshBed(obj = scene3D?.interactables.find((i) => i.kind === 'bed')) {
  if (!obj) return;
  const night = (scene3D.night ?? 0) > 0.5;
  scene3D.setSpotMaterial(obj, night ? 'wake' : 'sleep', night ? t.wakeLabel : t.sleepLabel);
}
function goToSleep() {
  const fade = $('#sleep-fade');
  fade.hidden = false;
  fade.classList.remove('is-out');
  setTimeout(() => {
    const phase = scene3D.sleep();
    refreshBed();
    setTimeout(() => {
      fade.classList.add('is-out');
      toast(phase === 'night' ? t.goodNight : t.goodMorning);
      setTimeout(() => { fade.hidden = true; }, 700);
    }, 700);
  }, 700);
}

/* ===== LETTER NAMES AND SOUNDS (said when a drawn letter is right) ===== */
const LETTER_SPEECH = {
  fr: {
    a: ['a', 'a'], b: ['bé', 'beu'], c: ['cé', 'keu'], d: ['dé', 'deu'], e: ['e', 'eu'], f: ['èfe', 'feu'], g: ['gé', 'gueu'],
    h: ['ache', 'le h ne fait pas de bruit'], i: ['i', 'i'], j: ['ji', 'jeu'], k: ['ka', 'keu'], l: ['èle', 'leu'], m: ['ème', 'meu'],
    n: ['ène', 'neu'], o: ['o', 'o'], p: ['pé', 'peu'], q: ['ku', 'keu'], r: ['èr', 'reu'], s: ['èsse', 'seu'], t: ['té', 'teu'],
    u: ['u', 'u'], v: ['vé', 'veu'], w: ['double vé', 'oua'], x: ['iks', 'ks'], y: ['i grec', 'i'], z: ['zèd', 'zeu'],
    é: ['e accent aigu', 'é'], è: ['e accent grave', 'è'], ê: ['e accent circonflexe', 'è'], ë: ['e tréma', 'è'],
    à: ['a accent grave', 'a'], â: ['a accent circonflexe', 'a'], ù: ['u accent grave', 'u'], û: ['u accent circonflexe', 'u'],
    î: ['i accent circonflexe', 'i'], ï: ['i tréma', 'i'], ô: ['o accent circonflexe', 'o'], ç: ['cé cédille', 'seu'],
  },
  en: {
    a: ['A', 'a, as in apple'], b: ['B', 'buh'], c: ['C', 'kuh'], d: ['D', 'duh'], e: ['E', 'eh'], f: ['F', 'fff'], g: ['G', 'guh'],
    h: ['H', 'huh'], i: ['I', 'ih'], j: ['J', 'juh'], k: ['K', 'kuh'], l: ['L', 'lll'], m: ['M', 'mmm'], n: ['N', 'nnn'],
    o: ['O', 'o, as in octopus'], p: ['P', 'puh'], q: ['Q', 'kwuh'], r: ['R', 'rrr'], s: ['S', 'sss'], t: ['T', 'tuh'],
    u: ['U', 'uh'], v: ['V', 'vvv'], w: ['W', 'wuh'], x: ['X', 'ks'], y: ['Y', 'yuh'], z: ['Z', 'zzz'],
  },
};
function speakLetter(ch) {
  const s = LETTER_SPEECH[lang]?.[ch];
  if (!s) return;
  speak(s[0] === s[1] ? s[0] : `${s[0]}… ${s[1]}`, 0.85);
}
