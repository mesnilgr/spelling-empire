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
import { ANIMAL_KINDS, HERDS } from './fauna.js';
import { HORSES } from './horse.js';
import { NEWS } from './news.js';
import { DTX, drawDefis, defiById } from './daily.js';
import { cocotteToday, COCOTTE } from './cocotte.js';
import { ATX, ALBUM_ANIMALS, KIND_TO_CARD, PLACE_WORDS, PLACE_HINTS, BOSS_HINTS, DISCOVERY, ALBUM_GOAL1, GOLD_CHANCE, PAGES1, PAGES2 } from './album.js';
import { FTX, CALENDAR, FLAME_STEPS, SNEEZE_STARS, HEARTH } from './flame.js';
import { PTX, CLOUDS, RINGS, POWER_TIME, GLIDE_TIME, ANIMALS_GOAL, POWER_KINDS } from './powers.js';
import { CTX, BUTTON_SPOTS, spotsOfPart, COPPER_LIFE, WIND_EVERY, SHINE_WORD } from './copper.js';
import { PROGRAMME, PROGRAMME_SHARE, SENTENCES_READY, themesFor, themeWords, themeDay, upcomingThemes } from './programme.js';

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
  const key = `${lang}:${w.id ?? w.word}`;
  progress.wordStats[key] ??= { lang, word: w.id ?? w.word, level: w.level, seen: 0, correct: 0, wrong: 0, firstTry: 0, lastSeen: 0, misspellings: [] };
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
function askAge(then, hello = '') {
  ageButtons($('#age-buttons'), (a) => { setAge(a); $('#age-modal').hidden = true; then?.(); });
  $('#age-modal').hidden = false;
  speak(hello ? `${hello} ${t.ageQuestion}` : t.ageQuestion, 0.9);
}

// The child's first name: asked once (first game, or the next game of an existing player),
// changed in the parents' corner. undefined = never asked, '' = skipped. Stays on this device.
function cleanName(raw) {
  const n = String(raw ?? '').replace(/[^\p{L}\p{M}' -]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 16).trim();
  return n ? n[0].toLocaleUpperCase() + n.slice(1) : '';
}
function childName() { return progress.childName || ''; }
function setChildName(raw) { progress.childName = cleanName(raw); saveProgress(); }
function askName(then) {
  const modal = $('#name-modal'), input = $('#name-input'), hint = $('#name-hint');
  input.value = childName();
  input.placeholder = t.namePlaceholder;
  hint.hidden = true;
  modal.hidden = false;
  speak(t.nameQuestion, 0.9);
  setTimeout(() => input.focus(), 60);
  const done = (n) => {
    $('#name-form').onsubmit = null; $('#name-skip').onclick = null;
    setChildName(n);
    input.blur();
    modal.hidden = true;
    then?.(childName());
  };
  $('#name-form').onsubmit = (e) => {
    e.preventDefault();
    const n = cleanName(input.value);
    if (!n) { hint.textContent = t.nameEmpty; hint.hidden = false; speak(t.nameEmpty, 0.9); input.focus(); return; }
    done(n);
  };
  $('#name-skip').onclick = () => done('');
}
// Before playing: the first name (once), then the age (once).
function beforePlay(go) {
  const afterName = (n) => {
    const hello = n ? t.nameHello(n) : '';
    if (!progress.age) { askAge(go, hello); return; }
    go();
    if (hello) { toast(`👋 ${hello}`, 3000); speak(hello, 0.95); }
  };
  if (progress.childName === undefined) askName(afterName);
  else if (!progress.age) askAge(go);
  else go();
}
// Parents' corner: the programme of the week (follow the calendar, pick a theme, or turn it off).
function renderProgrammeCard() {
  const sel = $('#dash-programme');
  if (!sel) return;
  const opt = (value, text) => { const o = el('option', '', text); o.value = value; return o; };
  sel.replaceChildren(opt('auto', t.progAuto), ...PROGRAMME.map((p) => opt(p.id, `${p.emoji} ${p.name}`)), opt('off', t.progOff));
  sel.value = progress.programme ?? 'auto';
  sel.onchange = () => {
    progress.programme = sel.value;
    // A theme picked by hand opens progressively from today.
    if (sel.value !== 'auto' && sel.value !== 'off') progress.programmeSince = todayKey(); else delete progress.programmeSince;
    saveProgress(); renderProgrammeCard();
  };
  const ths = programmeThemes();
  $('#dash-prog-now').textContent = lang !== 'fr' ? t.progFrOnly : ths.length
    ? t.progNow(ths.map((th) => `${th.emoji} ${th.name} (${th.blurb}) : ${t.progOpen(programmeItems(th).length, themeWords(th).length)}`).join(' · '))
    : t.progNone;
  const day = (d) => d.split('-').reverse().slice(0, 2).join('/');
  $('#dash-prog-list').replaceChildren(...upcomingThemes(todayKey()).map((p) => el('li', '', `${day(p.from)} → ${day(p.to)} : ${p.emoji} ${p.name} (${p.blurb})${p.needs === 'sentences' && !SENTENCES_READY ? ` — ${t.progSoon}` : ''}`)));
}
// "Bravo" messages: a different one each time, with the child's name now and then (one in three).
const PRAISE = {
  fr: { first: ['Orthographe parfaite !', 'Bravo !', 'Génial !', 'Trop fort !', 'Waouh, parfait !', 'Magnifique !', 'Champion !', 'Du premier coup !', 'Super !'], again: ['Tu y es arrivé !', 'Bien joué !', 'Tu as réussi !', 'Tu n’as rien lâché, bravo !'] },
  en: { first: ['Perfect spelling!', 'Well done!', 'Brilliant!', 'Amazing!', 'Wow, perfect!', 'Fantastic!', 'Champion!', 'First try!', 'Super!'], again: ['You got it!', 'Well played!', 'You did it!', 'You never gave up, well done!'] },
};
let praiseCount = 0, lastPraise = -1;
function praise(firstTry) {
  const list = (PRAISE[lang] ?? PRAISE.fr)[firstTry ? 'first' : 'again'];
  let k = Math.floor(Math.random() * list.length);
  if (k === lastPraise) k = (k + 1) % list.length;
  lastPraise = k;
  const base = list[k];
  const n = childName();
  return n && praiseCount++ % 3 === 0 ? t.nameIn(base, n) : base;
}

/* ===== THE WORD PARTY: every success is a little celebration ===== */
// The letters hop one after the other on a rising tune, a big emoji pops up, the stars fly to the
// counter, a run of words right first time gets a fanfare (3, 5, 10, then every 5), and now and then
// a golden word (worth three times the stars) shines before it is spelled.
const OOPS = { fr: ['Presque !', 'Oups, pas tout à fait !', 'Pas grave, on réessaie !', 'Tu y es presque !'], en: ['Almost!', 'Oops, not quite!', 'Never mind, try again!', 'Nearly there!'] };
const CHEER_EMOJI = ['🎉', '🤩', '🌟', '🥳', '💪', '✨', '🚀', '🦄', '👏', '😎'];
const STREAK_CHEER = { fr: (n) => `🔥 ${n} d’affilée !`, en: (n) => `🔥 ${n} in a row!` };
const GOLD_TXT = {
  fr: { title: '✨ Mot doré !', instr: 'Un mot doré ! Réussi du premier coup, il vaut trois fois plus d’étoiles !', won: '✨ Mot doré : trois fois plus d’étoiles !', say: 'Un mot doré !' },
  en: { title: '✨ Golden word!', instr: 'A golden word! Right first time, it is worth three times the stars!', won: '✨ Golden word: three times the stars!', say: 'A golden word!' },
};
const goldTxt = () => GOLD_TXT[lang] ?? GOLD_TXT.fr;
const TUNE = [523, 587, 659, 784, 880, 1047, 1175, 1319, 1568, 1760];
const isTestRun = /[?&]test\b/.test(location.search);
function goldChance() { return window.__se?.goldChance ?? (isTestRun ? 0 : 0.1); }
function flyStars(k) {
  const card = $('#spell-modal .spell-modal-card'), target = $('#hud-stars');
  if (!card || !target) return;
  const a = card.getBoundingClientRect(), b = target.getBoundingClientRect();
  if (!b.width) return;
  if (window.__se) window.__se.flown = (window.__se.flown ?? 0) + k;
  for (let i = 0; i < k; i++) {
    const st = el('span', 'fly-star', '★');
    st.style.left = `${a.left + a.width / 2 - 13 + (i - k / 2) * 14}px`;
    st.style.top = `${a.top + a.height * 0.45}px`;
    document.body.append(st);
    setTimeout(() => {
      st.style.transform = `translate(${b.left + b.width / 2 - (a.left + a.width / 2 + (i - k / 2) * 14)}px, ${b.top + b.height / 2 - (a.top + a.height * 0.45)}px) scale(0.6)`;
      st.style.opacity = '0.2';
    }, 30 + i * 70);
    setTimeout(() => { st.remove(); if (i === k - 1) { const pill = target.parentElement ?? target; pill.classList.remove('is-bump'); void pill.offsetWidth; pill.classList.add('is-bump'); playTone(1568, 0.08, 'triangle', 0.06); } }, 820 + i * 70);
  }
}
function cheerSuccess({ firstTry, copied, earned, golden }) {
  const tiles = $('#spell-tiles'), card = $('#spell-modal .spell-modal-card');
  $('#spell-attempts').textContent = '';
  if (copied) return;
  tiles.classList.remove('is-cheer'); void tiles.offsetWidth; tiles.classList.add('is-cheer');
  const n = Math.min(10, tiles.querySelectorAll('.tile').length);
  for (let i = 0; i < n; i++) playTone(TUNE[i], 0.09, 'triangle', 0.05, 0.15 + i * 0.08);
  if (firstTry && card) {
    const e = el('div', 'cheer-emoji', golden ? '🏆' : CHEER_EMOJI[Math.floor(Math.random() * CHEER_EMOJI.length)]);
    card.append(e);
    setTimeout(() => e.remove(), 1700);
  }
  if (earned > 0) setTimeout(() => flyStars(Math.min(earned, 9)), 350);
  if (firstTry && (streak === 3 || streak === 5 || streak === 10 || (streak > 10 && streak % 5 === 0)) && card) {
    const b = el('div', 'cheer-streak', (STREAK_CHEER[lang] ?? STREAK_CHEER.fr)(streak));
    card.append(b);
    setTimeout(() => b.remove(), 2300);
    setTimeout(() => { launchConfetti(); sfxVictory(); }, 450);
  } else if (golden && firstTry) {
    setTimeout(() => { launchConfetti(); [1319, 1568, 2093, 2637].forEach((f, i) => playTone(f, 0.18, 'sine', 0.07, i * 0.09)); }, 400);
  }
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
// Programme de la semaine (programme.js): the theme running today, from the calendar or the
// parents' choice. About one word in two comes from it (not for bosses, portals or Mimots).
// Several strands can run on the same day (the verbs, the articles, the colours).
function programmeThemes() { return lang === 'fr' ? themesFor(todayKey(), progress.programme ?? 'auto') : []; }
// The theme opens progressively: its day counts from its start on the calendar, or from the day the
// parents picked it by hand.
function programmeDay(theme) {
  const today = todayKey(), manual = (progress.programme ?? 'auto') !== 'auto';
  return themeDay(theme, today, manual ? (progress.programmeSince ?? today) : undefined);
}
function programmeItems(theme) { return themeWords(theme, { day: programmeDay(theme) }); }
function programmeWord(stats, opts) {
  const themes = programmeThemes();
  if (!themes.length) return null;
  if (!window.__se?.programmeAlways && Math.random() >= PROGRAMME_SHARE) return null;
  const items = themes.flatMap((th) => programmeItems(th));
  if (!items.length) return null;
  return chooseWord(items, stats, (w) => `${lang}:${w.id}`, { ...opts, newPerDay: 99 })?.w ?? items[Math.floor(Math.random() * items.length)];
}
function pickWord(levelId = 'easy', { programme = true } = {}) {
  const stats = progress.wordStats ?? {};
  const key = (w) => `${lang}:${w.word}`;
  const opts = { newToday: progress.daily?.[todayKey()]?.newCards ?? 0, newPerDay: progress.newPerDay ?? SRS.newPerDay, avoid: lastPicked };
  const pw = programme ? programmeWord(stats, opts) : null;
  if (pw) { lastPicked = pw.word; return pw; }
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
  if (scene3D.golem) {
    scene3D.setSpotMaterial(scene3D.golem.obj, 'talk', `🤖 ${t.golemName}`);
    scene3D.golem.onSmash = () => {
      playNoise({ type: 'lowpass', freq: 220, q: 1, volume: 0.18, duration: 0.35 });
      animalVoice({ type: 'square', f0: 90, f1: 60, dur: 0.3, filter: 'lowpass', freq: 300, vol: 0.1 });
      if (!progress.golemSmashExplained) { progress.golemSmashExplained = true; saveProgress(); const msg = t.golemSmash; toast(msg, 4000); speak(msg.replace(/^\S+ /, ''), 0.95); }
    };
  }
  setupJumpChest();
  setupFlame();
  setupAlbum();
  if (henFound()) scene3D.cocotte?.hide();
  else if (scene3D.cocotte) scene3D.setSpotMaterial(scene3D.cocotte.obj, 'talk', `🐔 Cocotte`);
  scene3D.onDismount = () => { const h = scene3D.horses.list.find((x) => x.tamed && !x.leftAt); $('#dismount-btn').hidden = true; };
  scene3D.onHorseBlock = () => { sfxHit(); if (!horseBlockSaid) { horseBlockSaid = true; toast(t.horseBlock, 3500); } };
  scene3D.onObsidian = (n) => { if (n) { sfxCraft(); toast(t.obsidianMade, 4000); speak(t.obsidianMade.replace(/^\S+ /, ''), 0.95); } };
  scene3D.onMeatPickup = onMeatPickup;
  scene3D.onZombieBurnt = onZombieBurnt;
  scene3D.canBeAttacked = () => !!game && document.body.dataset.screen === 'game' && $('#spell-modal').hidden && $('#dialog').hidden && $('#travel-modal').hidden && $('#quest-modal')?.hidden !== false && !knocking;
  scene3D.zombies.enabled = progress.zombies !== false;
  scene3D.onLavaPillar = (role) => { if (game) onLavaPillar(role); };
  scene3D.onDance = () => { [523, 659, 784, 659, 523, 784].forEach((f, i) => playTone(f, 0.12, 'triangle', 0.05, i * 0.16)); const sp = scene3D.getPlayerScreenPosition(); if (sp) showFloatingText(sp.x, sp.y - 50, '♪ ♫ ♪', '#ffe08a'); };
  // ?test exposes the game to the automated playthrough tests (tests/e2e).
  if (/[?&]test\b/.test(location.search)) {
    window.__se = Object.assign(window.__se ?? {}, { releasePart, partState, defiEvent, defis: () => progress.defis, scene: scene3D, game: () => game, spell: () => spellContext, progress: () => progress, flame: () => game?.flame, album: () => game?.album, powers: () => game?.powers, streak: () => streak, copper: () => game?.copper, henDayUse: (d) => { window.__se.henDay = d; scene3D.placeCocotte(cocotteToday(d)); if (scene3D.cocotte) scene3D.setSpotMaterial(scene3D.cocotte.obj, 'talk', '🐔 Cocotte'); }, powerNow: () => scene3D?.powers?.power ?? null, givePower: (k) => givePower(k, { word: 'abc' }), openCollect, findCocotte, henRow: () => henRow(), levelAt: (tier) => levelAt(tier), pickWord: (lvl, o) => pickWord(lvl, o), newsLive: (n) => newsLive(n), albumQueue: () => ({ msgs: albumMsgs.map((m) => m.say), meetAt: albumMeetSaidAt, msgAt: albumMsgAt, defiAt: defiMsgAt, now: performance.now() }) });
  }
  scene3D.onInteract = () => tryInteract();
  scene3D.onInteractObject = (obj) => interactWith(obj);
  scene3D.minimapCanvas = $('#minimap');
  scene3D.onStep = (surface) => sfxStep(surface);
  scene3D.onJump = () => { sfxJump(); defiEvent('jump'); };
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
    else if (['sign', 'mimot', 'page', 'travel', 'book', 'boss', 'pet', 'portal', 'horse', 'golem', 'jumpchest', 'cocotte', 'flame', 'albumstand', 'powerstone', 'anvil', 'copper', 'secretchest'].includes(obj.kind)) continue;
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
    golemFlowerDay: game.golemFlowerDay ?? null,
    flame: game.flame ?? null,
    powers: game.powers ?? null,
    copper: game.copper ?? null,
    album: game.album ?? null,
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
    golemFlowerDay: s.golemFlowerDay ?? null,
    flame: s.flame ? JSON.parse(JSON.stringify(s.flame)) : null,
    powers: s.powers ? JSON.parse(JSON.stringify(s.powers)) : null,
    copper: s.copper ? JSON.parse(JSON.stringify(s.copper)) : null,
    album: s.album ? JSON.parse(JSON.stringify(s.album)) : null,
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
  if (obj.kind === 'npc' && obj.npcId === 'mage') defiEvent('mage');
  if (obj.kind === 'jumpchest') { jumpChestInteract(); return; }
  if (obj.kind === 'cocotte') { cocotteInteract(); return; }
  if (obj.kind === 'flame') { flameInteract(); return; }
  if (obj.kind === 'albumstand') { albumStandInteract(); return; }
  if (obj.kind === 'powerstone') { powerStoneInteract(); return; }
  if (obj.kind === 'anvil') { anvilInteract(); return; }
  if (obj.kind === 'copper') { copperTouch(); return; }
  if (obj.kind === 'secretchest') { secretChestInteract(); return; }
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
  if (obj.kind === 'golem') { golemInteract(); return; }
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
  // Now and then a golden word (only for the words that give materials).
  if (spellContext.type === 'mine' && spellContext.golden === undefined) spellContext.golden = Math.random() < goldChance();
  const golden = !!spellContext.golden && !spellContext.copyMode;
  $('#spell-modal .spell-modal-card')?.classList.toggle('is-golden', golden);
  $('#spell-tiles')?.classList.remove('is-cheer', 'is-oops');
  if (golden) { title = goldTxt().title; instruction = goldTxt().instr; setTimeout(() => [1568, 2093, 2637].forEach((f, i) => playTone(f, 0.14, 'sine', 0.06, i * 0.08)), 50); }
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
  } else if (word.pic) {
    // Pronouns: a picture of who it is.
    ctxEl.replaceChildren(el('span', 'prog-pic', word.pic), ...(word.who ? [el('span', 'prog-who', word.who)] : []));
    ctxEl.hidden = false;
  } else if (word.verb) {
    ctxEl.replaceChildren(el('span', 'prog-verb', t.progVerb(word.verb)));
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
  speak(golden ? `${goldTxt().say} ${word.say ?? word.word}` : word.say ?? word.word, 0.9);
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
  const nt = newsTargetPos();
  if (nt) return nt;
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
setInterval(() => { updateMapPins(); checkFountain(); updateAttackButton(); renderHearts(); checkPlaces(); tickFlash(); tickParts(0.3); tickDefis(); tickFlame(); tickAlbum(); tickPowers(0.3); tickCopper(0.3); if (scene3D) scene3D.inputLocked = !$('#spell-modal').hidden || !$('#dialog').hidden || !$('#news-modal').hidden || !$('#collect-modal').hidden; tickNews(); }, 300);

/* ===== FLASH CHALLENGE: never more than 2 minutes of play without a word ===== */
const FLASH_AFTER = 120; // seconds of play
let playSinceWord = 0, flashLast = performance.now();
function tickFlash() {
  const now = performance.now(), dt = Math.min(1, (now - flashLast) / 1000);
  flashLast = now;
  if (!game || !scene3D || scene3D.mode !== 'play' || document.hidden) return;
  if (document.body.dataset.screen !== 'game' || !$('#news-modal').hidden || !$('#spell-modal').hidden || !$('#dialog').hidden || !$('#travel-modal').hidden || $('#quest-modal')?.hidden === false || knocking || bossFight || !$('#sleep-fade').hidden) return;
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
// The fire portal: lit with a word, then it takes the hero to the lava course.
function usePortal() {
  if (!game.portalLit) {
    spellContext = { type: 'portal', word: pickWord(levelAt(1), { programme: false }), tries: 0 };
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

/* ===== WHAT'S NEW (Alaric) AND THE JOURNAL ===== */
// Each release is presented by Alaric the first time the game is opened after it: written, read
// aloud, with "Show me!" (the golden arrow points at it) or "Later" (it waits in the journal 📜).
const newsSeen = () => progress.newsSeen ?? [];
let newsQueue = null, newsTarget = null, newsShown = null;
function tickNews() {
  if (!game || !scene3D || scene3D.mode !== 'play' || document.body.dataset.screen !== 'game') return;
  if (newsQueue === null) {
    // A brand-new player has nothing "new": everything counts as seen, Alaric starts with the next release.
    if (!progress.newsSeen && !Object.keys(progress.wordStats ?? {}).length && !progress.save?.story) { progress.newsSeen = NEWS.filter(newsLive).map((n) => n.id); saveProgress(); }
    const seen = newsSeen();
    newsQueue = seen.includes('*') ? [] : NEWS.filter((n) => !seen.includes(n.id) && newsLive(n)).reverse().slice(0, 3);
  }
  if (!newsQueue.length || !$('#news-modal').hidden || !$('#collect-modal').hidden || !$('#spell-modal').hidden || !$('#dialog').hidden || !$('#travel-modal').hidden || knocking || bossFight) return;
  if (newsShown && performance.now() - newsShown < 1500) return;
  showNews(newsQueue.shift(), true);
}
// A card with a "from" date (the programme of the week) waits for that day; French-only cards stay in French.
// A programme card shows only while the programme follows the calendar (or for the theme picked by hand).
function newsLive(n) {
  if (n.from && n.from > todayKey()) return false;
  if (n.only && n.only !== lang) return false;
  if (n.programme) { const set = progress.programme ?? 'auto'; if (set === 'off' || (set !== 'auto' && set !== n.programme)) return false; }
  return true;
}
function newsTitle(n) { return n.title[lang] ?? n.title.fr; }
function newsText(n) { return n.text[lang] ?? n.text.fr; }
// Alaric's riddle at the end of the card: the question is read with the card, "The answer?" reads the answer.
function newsRiddle(n) { return n.riddle ? { q: n.riddle.q[lang] ?? n.riddle.q.fr, a: n.riddle.a[lang] ?? n.riddle.a.fr } : null; }
function newsSpeech(n) { const r = newsRiddle(n); return `${childName() ? `${t.newsKickerName(childName())} ` : ''}${newsTitle(n)}. ${newsText(n)}${r ? ` ${dtx().riddle} : ${r.q}` : ''}`; }
function riddleBox(n) {
  const r = newsRiddle(n);
  if (!r) return null;
  const box = el('div', 'news-riddle');
  const ans = el('p', 'news-riddle-a', `💡 ${r.a}`);
  ans.hidden = true;
  const btn = el('button', 'btn btn-accent btn-small news-answer', dtx().answer);
  btn.type = 'button';
  btn.addEventListener('click', () => { ans.hidden = false; speak(r.a, 0.95); });
  box.append(el('p', 'news-riddle-q', `❓ ${dtx().riddle} : ${r.q}`), btn, ans);
  return box;
}
function showNews(n, fresh) {
  $('#news-kicker').textContent = `${n.emoji} ${childName() ? t.newsKickerName(childName()) : t.newsKicker}`;
  $('#news-title').textContent = newsTitle(n);
  $('#news-text').textContent = newsText(n);
  { const rb = riddleBox(n); $('#news-riddle').replaceChildren(...(rb ? [rb] : [])); $('#news-riddle').hidden = !rb; }
  $('#news-show').textContent = t.newsShow;
  $('#news-show').hidden = !n.show;
  $('#news-later').textContent = t.newsLater;
  $('#news-modal').hidden = false;
  $('#news-modal').dataset.id = n.id;
  speak(newsSpeech(n), 0.95);
  if (fresh) { progress.newsSeen = [...new Set([...newsSeen(), n.id])]; saveProgress(); }
}
function closeNews() { $('#news-modal').hidden = true; stopSpeaking(); newsShown = performance.now(); }
function newsTargetPos() {
  if (!newsTarget || performance.now() > newsTarget.until) { newsTarget = null; return null; }
  const it = scene3D?.interactables ?? [];
  const s = newsTarget.show;
  const pos = s === 'mage' ? it.find((i) => i.kind === 'npc' && i.npcId === 'mage')?.worldPos : typeof s === 'string' ? it.find((i) => i.kind === s)?.worldPos : s;
  const p = scene3D?.player.position;
  if (!pos || (p && Math.hypot(p.x - pos.x, p.z - pos.z) < 3.5)) { newsTarget = null; return null; }
  return pos;
}
function showMeNews(id) {
  const n = NEWS.find((x) => x.id === id);
  if (!n) return;
  newsTarget = { show: n.show, until: performance.now() + 4 * 60 * 1000 };
  newsQueue = [];
  toast(t.newsFollow, 3500);
  updateMapPins();
}
function renderJournal() {
  $('#journal-title').textContent = `📜 ${t.journalTitle}`;
  $('#journal-close').textContent = t.journalClose;
  $('#journal-list').replaceChildren(...NEWS.filter(newsLive).reverse().map((n) => {
    const item = el('div', 'journal-item');
    item.append(el('span', 'journal-date', `${t.newsDay(n.day)} · ${n.date.split('-').reverse().join('/')}`), el('h3', '', `${n.emoji} ${newsTitle(n)}`), el('p', '', newsText(n)));
    const rb = riddleBox(n);
    if (rb) item.append(rb);
    const actions = el('div', 'journal-actions');
    const listen = el('button', 'btn btn-ghost btn-small', '🔊');
    listen.type = 'button';
    listen.addEventListener('click', () => speak(newsSpeech(n), 0.95));
    const show = el('button', 'btn btn-accent btn-small', t.newsShow);
    show.type = 'button';
    show.addEventListener('click', () => { $('#journal-modal').hidden = true; stopSpeaking(); showMeNews(n.id); });
    actions.append(listen, show);
    item.append(actions);
    return item;
  }));
}

/* ===== FER, THE IRON GOLEM ===== */
function golemInteract() {
  const g = scene3D?.golem;
  if (!g) return;
  g.wave();
  defiEvent('golem');
  animalVoice({ type: 'square', f0: 140, f1: 110, dur: 0.35, filter: 'lowpass', freq: 500, vol: 0.1 });
  const today = new Date().toISOString().slice(0, 10);
  if (game.golemFlowerDay !== today) {
    game.golemFlowerDay = today;
    game.materials.flower = (game.materials.flower ?? 0) + 1;
    sfxCraft(); smile();
    const msg = t.golemFlower;
    toast(msg, 4500); speak(msg.replace(/^\S+ /, ''), 0.95);
    updateGameUI(); renderCraftMenu(); saveGame();
  } else {
    const msg = t.golemHello;
    toast(msg, 3500); speak(msg.replace(/^\S+ /, ''), 0.95);
  }
}

/* ===== RELEASE PARTS (two 15-minute sessions per release) ===== */
// Each release has a part 1 and a part 2. Part 2 opens the next time the game is played again at
// least 30 minutes after the last play, or after 15 minutes of play on part 1 — never later.
// releasePart(day) is reused by every release (key: one per release, or one per day for J2's
// daily challenges).
const PART_RETURN = 30 * 60 * 1000, PART_PLAY = 15 * 60;
function partState(key) { progress.parts ??= {}; return (progress.parts[key] ??= { play: 0, last: Date.now(), two: false }); }
function releasePart(day, key = `J${day}`) { return partState(key).two ? 2 : 1; }
let partsOpened = false, partsSaveT = 0;
function tickParts(dt) {
  if (!game || !scene3D || scene3D.mode !== 'play' || document.body.dataset.screen !== 'game' || document.hidden) return;
  progress.parts ??= {};
  const now = Date.now();
  // Daily keys of other days are of no use any more.
  for (const k of Object.keys(progress.parts)) if (k.startsWith('d:') && k !== `d:${today()}`) delete progress.parts[k];
  const opened = [];
  if (!partsOpened) {
    partsOpened = true;
    for (const [k, st] of Object.entries(progress.parts)) if (!st.two && now - st.last >= PART_RETURN) { st.two = true; opened.push(k); }
  }
  for (const [k, st] of Object.entries(progress.parts)) {
    st.last = now;
    if (!st.two) { st.play += dt; if (st.play >= (window.__se?.partPlay ?? PART_PLAY)) { st.two = true; opened.push(k); } }
  }
  partsSaveT += dt;
  if (opened.length || partsSaveT > 10) { partsSaveT = 0; saveProgress(); }
  for (const k of opened) onPartTwo(k);
}
function onPartTwo(key) {
  if (key === `d:${today()}`) ensureDefis();
  if (key === 'J3') onFlamePartTwo();
  if (key === 'J4') onAlbumPartTwo();
  if (key === 'J5') onPowersPartTwo();
  if (key === 'J6') onCopperPartTwo();
}

/* ===== DAILY CHALLENGES, THE JUMPING CHEST AND COCOTTE (J2) ===== */
const dtx = () => DTX[lang] ?? DTX.fr;
const defiText = (d) => d.text[lang] ?? d.text.fr;
const latestDay = () => Math.max(...NEWS.filter((n) => !n.from).map((n) => n.day));
const henRow = () => cocotteToday(window.__se?.henDay ?? latestDay()); // henDay: tests of an older release's hiding spot
const henFound = () => { const r = henRow(); return !r || (progress.feathers ?? []).includes(r.day); };
let defiMsgs = [], defiMsgAt = 0, defisAnnounced = {};
// Challenges start once the story has begun (after the introduction).
function defisOn() { return !!game?.story?.intro && !!scene3D && !window.__se?.noDefis; }
function defisCtx() {
  return {
    pet: !!game?.pet?.tamed,
    food: ['meat', 'fish', 'brochette'].some((f) => (game?.materials[f] ?? 0) > 0),
    horse: Object.values(game?.horses ?? {}).some((h) => h.tamed),
    cocotte: (!!scene3D?.cocotte || !!henRow()?.album) && !henFound(),
    powers: !!game?.powers?.awake,
  };
}
function ensureDefis() {
  if (!defisOn()) return null;
  const d = today();
  if (progress.defis?.date !== d) progress.defis = { date: d, m: null, e: null };
  const st = progress.defis;
  partState(`d:${d}`);
  if (!st.m) { st.m = { ids: drawDefis('morning', d, defisCtx()), n: {}, done: false }; saveProgress(); }
  if (!st.e && releasePart(2, `d:${d}`) === 2) { st.e = { ids: drawDefis('evening', d, defisCtx()), n: {}, done: false }; defisAnnounced.e = false; saveProgress(); }
  return st;
}
function queueDefiMsg(text, say = text.replace(/^\S+ /, ''), sfx = null) { defiMsgs.push({ text, say, sfx }); }
function announceDefis(part) {
  const st = progress.defis, set = st?.[part];
  if (!set) return;
  const x = dtx(), title = part === 'm' ? x.morningTitle : x.eveningTitle;
  const list = set.ids.map((id) => defiById(id)).map((d) => `${d.emoji} ${defiText(d)}`);
  const head = part === 'e' && !defisAnnounced.eSaid ? `${x.partTwoOpen} ` : '';
  defisAnnounced.eSaid ||= part === 'e';
  queueDefiMsg(`🎯 ${head}${x.announce(title, list)}`, `${head.replace(/^\S+ /, '')}${x.announce(title, set.ids.map((id) => defiText(defiById(id))))}`, 'pop');
}
function defiEvent(ev, k = 1) {
  const st = ensureDefis();
  if (!st) return;
  for (const part of ['m', 'e']) {
    const set = st[part];
    if (!set || set.done) continue;
    for (const id of set.ids) {
      const d = defiById(id);
      if (d.ev !== ev) continue;
      const before = set.n[id] ?? 0;
      if (before >= d.goal) continue;
      set.n[id] = Math.min(d.goal, before + k);
      if (set.n[id] < d.goal) continue;
      const doneN = set.ids.filter((i) => (set.n[i] ?? 0) >= defiById(i).goal).length;
      queueDefiMsg(dtx().done(`${d.emoji} ${defiText(d)}`, doneN), dtx().doneSay(defiText(d)), 'craft');
      if (doneN === 3) {
        set.done = true;
        progress.chestQueue = [...(progress.chestQueue ?? []), part];
        queueDefiMsg(part === 'e' ? dtx().allDoneEvening : dtx().allDone, undefined, 'victory');
      }
    }
  }
  saveProgress();
  updateDefisHud();
}
function tickDefis() {
  if (!game || !scene3D || scene3D.mode !== 'play' || document.body.dataset.screen !== 'game') return;
  const st = ensureDefis();
  if (!st) return;
  const busy = !$('#spell-modal').hidden || !$('#dialog').hidden || !$('#news-modal').hidden || !$('#journal-modal').hidden || !$('#collect-modal').hidden || !$('#travel-modal').hidden || $('#quest-modal')?.hidden === false || knocking || bossFight || (newsQueue?.length ?? 1) > 0;
  // The welcome chest (once), then the chests won with the challenges, one at a time.
  if (!progress.welcomeChest) { progress.welcomeChest = true; progress.chestQueue = ['welcome', ...(progress.chestQueue ?? [])]; saveProgress(); }
  const jc = scene3D.jumpChest;
  if (jc && !jc.out && progress.chestQueue?.length) {
    const which = progress.chestQueue[0];
    jc.spawn(which, which === 'e');
    if (!newsTarget) newsTarget = { show: 'jumpchest', until: performance.now() + 4 * 60 * 1000 };
    if (which === 'welcome' && !busy) queueDefiMsg(dtx().welcome);
  }
  // On return, the morning list is only repeated if it is not finished and the evening has not come.
  if (!defisAnnounced.m) { defisAnnounced.m = true; if (!st.m.done && !st.e) announceDefis('m'); }
  if (st.e && !defisAnnounced.e) { defisAnnounced.e = true; announceDefis('e'); }
  // Hug a sheep: walk right up to one (it stops and says "Baa!").
  if (['m', 'e'].some((p) => st[p] && !st[p].done && st[p].ids.some((id) => defiById(id).ev === 'sheep' && (st[p].n[id] ?? 0) < 1))) {
    const p = scene3D.player.position;
    const sheep = scene3D.fauna?.list.find((a) => (a.kind.startsWith('sheep') || a.kind === 'lamb') && Math.hypot(a.mesh.position.x - p.x, a.mesh.position.z - p.z) < 2.6);
    if (sheep) {
      sheep.target = null; sheep.wait = 3; sheep.flee = 3;
      ANIMAL_CRIES[sheep.kind]?.();
      for (let i = 0; i < 3; i++) setTimeout(() => scene3D.particleBurst(sheep.mesh.position.clone().setY(sheep.mesh.position.y + 1.2), '#ff7ab0', 10), i * 200);
      queueDefiMsg(dtx().hugSheep);
      defiEvent('sheep');
    }
  }
  // Messages, one at a time, never over a word or a dialogue.
  if (defiMsgs.length && !busy && performance.now() - defiMsgAt > 3800) {
    defiMsgAt = performance.now();
    const m = defiMsgs.shift();
    toast(m.text, 4200);
    speak(m.say, 0.95);
    if (m.sfx === 'victory') { sfxVictory(); launchConfetti(); } else if (m.sfx === 'craft') sfxCraft(); else if (m.sfx === 'pop') sfxPop();
  }
  updateDefisHud();
}
function updateDefisHud() {
  const btn = $('#defis-btn');
  if (!btn) return;
  const st = progress.defis;
  const set = st?.e && !st.e.done ? st.e : st?.m;
  btn.hidden = !set || !defisOn();
  if (!set) return;
  const k = set.ids.filter((i) => (set.n[i] ?? 0) >= defiById(i).goal).length;
  const label = `🎯 ${k}/3`;
  if (btn.textContent !== label) btn.textContent = label;
  btn.classList.toggle('is-done', !!set.done);
}
// The jumping chest: hops, giggles, then a word opens it.
function setupJumpChest() {
  const jc = scene3D?.jumpChest;
  if (!jc) return;
  scene3D.setSpotMaterial(jc.obj, 'chest', lang === 'en' ? '🎁 Jumping chest' : '🎁 Coffre sauteur');
  jc.obj.iconHolder.visible = jc.out;
  jc.onHop = (n) => {
    playTone(220, 0.28, 'sine', 0.12, 0, 660); playTone(330, 0.2, 'triangle', 0.06, 0.05, 880);
    const line = dtx().hop[(n - 1) % 3];
    const pos = scene3D.worldToScreen(jc.mesh.position.clone().setY(jc.mesh.position.y + 1.4));
    if (pos) showFloatingText(pos.x, pos.y, line, '#ffe08a');
    speak(line, 1.1);
  };
  jc.onLand = (left) => {
    playNoise({ type: 'lowpass', freq: 400, q: 1, volume: 0.12, duration: 0.15 });
    scene3D.particleBurst(jc.mesh.position.clone().setY(jc.mesh.position.y + 0.2), '#d8c8a0', 10);
    if (left === 0) { toast(`🎁 ${dtx().caught}`, 4000); setTimeout(() => speak(dtx().caught, 0.95), 700); }
  };
}
function jumpChestInteract() {
  const jc = scene3D.jumpChest;
  if (!jc?.out) return;
  if (jc.hopsLeft > 0) { const n = jc.hopAway(); if (n) jc.onHop?.(n); return; }
  spellContext = { type: 'jumpchest', word: pickWord(levelAt(0)), tries: 0 };
  openSpellModal(`🎁 ${dtx().chestTitle}`, dtx().chestInstruction, '🎁');
}
function openJumpChest() {
  const jc = scene3D.jumpChest;
  const which = progress.chestQueue?.[0] ?? jc.which;
  progress.chestQueue = (progress.chestQueue ?? []).slice(1);
  jc.open();
  setTimeout(() => { launchConfetti(); sfxVictory(); }, 150);
  const got = [];
  const stars = which === 'e' ? 10 : which === 'm' ? 8 : 5;
  progress.stars += stars; game.starsEarned += stars;
  got.push(`${stars} ★`);
  const loot = (n) => { for (let i = 0; i < n; i++) for (const [m, k] of Object.entries(rollLoot().materials ?? {})) { game.materials[m] = (game.materials[m] ?? 0) + k; got.push(`${MATERIAL_EMOJI[m] ?? ''} ${materialName(m)} ×${k}`); } };
  let say = dtx().chestOpen;
  if (which === 'e') {
    // The big evening chest: a new outfit (something to show), or diamonds.
    const c = COSTUMES.filter((x) => x.id !== 'hero' && !costumeState().owned.includes(x.id)).sort((a, b) => a.price - b.price)[0];
    if (c) { unlockCostume(c.id); got.push(`${c.emoji} ${c.name[lang]}`); say += ' ' + dtx().costume(c.name[lang]); }
    else { game.materials.diamond = (game.materials.diamond ?? 0) + 2; got.push(`${MATERIAL_EMOJI.diamond ?? '💎'} ${materialName('diamond')} ×2`); }
  } else loot(which === 'm' ? 2 : 1);
  saveGame(); saveProgress();
  return { got, say };
}
function cocotteInteract() {
  const hen = scene3D.cocotte;
  if (!hen || !hen.obj.active) return;
  // On the highest cloud (J5): she can only be reached from up there.
  if (hen.row.cloud && scene3D.player.position.y < hen.base.y - 1.5) { const m = ptx().henHigh; toast(`🐔 ${m}`, 4000); speak(m, 0.95); return; }
  hen.flyAway();
  const p = hen.mesh.position.clone(); p.y += 0.6;
  for (let i = 0; i < 4; i++) setTimeout(() => scene3D.particleBurst(p, i % 2 ? '#ffd34a' : '#fff4c0', 18), i * 160);
  henReward(hen.row.day);
}
// "Cot cot!": a golden feather (one per day) and 3 stars, wherever she was hiding.
function henReward(day) {
  ANIMAL_CRIES.chicken();
  setTimeout(() => ANIMAL_CRIES.chicken(), 450);
  progress.feathers = [...new Set([...(progress.feathers ?? []), day])];
  progress.stars += 3; if (game) game.starsEarned += 3;
  const msg = dtx().cocotteSay;
  toast(msg, 4500); speak(msg.replace(/^\S+ /, ''), 0.95);
  sfxCraft();
  defiEvent('cocotte');
  updateGameUI(); saveProgress(); saveGame();
}
// The journal's "today" block: the two parts, the challenges and Cocotte's hint, written and read.
function partsLine() {
  const st = progress.defis, x = dtx();
  if (!st?.m) return '';
  const two = releasePart(2, `d:${st.date}`) === 2;
  const p1 = st.m.done ? x.partDone : `: ${x.partPlay}`;
  const p2 = !two ? `: ${x.partLater}` : st.e?.done ? x.partDone : `: ${x.partOpen}`;
  return x.part(p1, p2);
}
function henHint() {
  const r = henRow();
  if (!r) return '';
  return henFound() ? dtx().cocotteFound : r.hint[lang] ?? r.hint.fr;
}
function todaySpeech() { return [dtx().partSay(partsLine()), flameSpeech(), albumSpeech(), powersSpeech(), copperSpeech(), `${dtx().cocotteTitle} ${henHint()}`].filter((s) => s.trim()).join(' '); }
function renderToday() {
  const box = $('#journal-today');
  if (!box) return;
  const st = defisOn() ? ensureDefis() : null, x = dtx();
  const kids = [el('h3', '', x.todayTitle)];
  if (st) {
    kids.push(el('p', 'journal-parts', partsLine()));
    for (const part of ['m', 'e']) {
      const set = st[part];
      if (!set) continue;
      kids.push(el('h4', '', part === 'm' ? `☀️ ${x.morningTitle}` : `🌙 ${x.eveningTitle}`));
      const ul = el('ul', 'defis-list');
      for (const id of set.ids) {
        const d = defiById(id), n = set.n[id] ?? 0, ok = n >= d.goal;
        ul.append(el('li', ok ? 'is-done' : '', `${ok ? '✅' : '⬜'} ${d.emoji} ${defiText(d)}${d.goal > 1 ? ` (${n}/${d.goal})` : ''}`));
      }
      kids.push(ul);
    }
  }
  for (const line of flameLines()) kids.push(el('p', 'journal-flame', line));
  for (const line of albumLines()) kids.push(el('p', 'journal-album', line));
  for (const line of powersLines()) kids.push(el('p', 'journal-powers', line));
  for (const line of copperLines()) kids.push(el('p', 'journal-copper', line));
  if (henRow()) kids.push(el('p', 'journal-hen', `🐔 ${x.cocotteTitle} ${henHint()}`), el('p', 'journal-feathers', x.feathers((progress.feathers ?? []).length)));
  const listen = el('button', 'btn btn-ghost btn-small', '🔊');
  listen.type = 'button';
  listen.addEventListener('click', () => speak(todaySpeech(), 0.95));
  kids.push(listen);
  box.replaceChildren(...kids);
  box.hidden = false;
}

/* ===== FLAMMÈCHE, THE FLAME OF THE DAYS (J3) ===== */
// Session 1: spell FEU to light her, every good word gives her a log (5 sizes). Session 2 (part 2 of
// J3): big enough, every word spelled next to her makes her sneeze stars around the cottage (7 words
// = 10 stars); the 10 stars open the first box of her 7-day calendar. Each day played adds a day to
// her streak; a missed day puts her to sleep (she snores), a magic log (one a week) wakes her up.
const ftx = () => FTX[lang] ?? FTX.fr;
function flameState() { return game ? (game.flame ??= { lit: false, logs: 0, days: 0, last: null, asleep: false, magic: 0, week: null, weekFirst: 0, weekGot: false, cal: [], calDay: null, sneezes: 0, starsGot: 0 }) : null; }
const flameSize = (f = game?.flame) => (!f?.lit ? 0 : FLAME_STEPS.filter((n) => f.logs >= n).length);
const dayGap = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
const shiftDay = (d, k) => new Date(Date.parse(d) + k * 86400000).toISOString().slice(0, 10);
function weekKey() { const d = new Date(`${today()}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); }
const sneezeStars = (k) => SNEEZE_STARS.slice(0, k).reduce((a, b) => a + b, 0);
let flameMsgs = [], flamePsst = false, flameP2Said = false, flameLoaded = null, flameSnoreAt = 0;
function queueFlameMsg(text, say = text.replace(/^\S+ /, ''), sfx = null) { flameMsgs.push({ text, say, sfx }); }
function flameWord() {
  if ((progress.age ?? 6) <= 5) return { word: lang === 'en' ? 'f' : 'f', level: 'story', say: lang === 'en' ? 'The letter F… as in fire.' : 'La lettre F… comme dans feu.' };
  return { word: lang === 'en' ? 'fire' : 'feu', level: 'story', say: lang === 'en' ? 'fire.' : 'feu.' };
}
function sfxWhoosh() { playNoise({ type: 'bandpass', freq: 500, q: 0.5, volume: 0.2, duration: 0.6 }); playTone(180, 0.5, 'sawtooth', 0.05, 0, 520); }
function sfxHic() { playTone(520, 0.08, 'square', 0.07, 0, 900); }
function sfxSneeze() { playTone(300, 0.5, 'triangle', 0.07, 0, 600); playNoise({ type: 'highpass', freq: 1800, q: 0.7, volume: 0.22, duration: 0.25, delay: 0.95 }); }
function sfxSnore() { playNoise({ type: 'lowpass', freq: 260, q: 2, volume: 0.12, duration: 0.7 }); playTone(80, 0.6, 'sawtooth', 0.04); playNoise({ type: 'highpass', freq: 2500, q: 0.5, volume: 0.04, duration: 0.4, delay: 0.9 }); }
function sfxStar() { playTone(988, 0.08, 'triangle', 0.1); playTone(1319, 0.14, 'triangle', 0.1, 0.06); }
function flameLabel() {
  const fl = scene3D?.flame, f = game?.flame;
  if (!fl) return;
  const want = f?.lit ? ftx().label(f.days) : ftx().labelOff;
  if (fl.obj.labelText !== want) { fl.obj.labelText = want; scene3D.setSpotMaterial(fl.obj, 'talk', want); }
}
function applyFlameLook() {
  const fl = scene3D?.flame, f = game?.flame;
  if (!fl) return;
  fl.setState({ lit: !!f?.lit, size: flameSize(f), asleep: !!f?.asleep, rainbow: !!f?.cal?.includes('rainbow') });
  const cal = f?.cal ?? [], dog = !!game?.pet?.tamed;
  const dogAcc = [], golemAcc = [];
  if (cal.includes('glasses')) (dog ? dogAcc : golemAcc).push('glasses');
  if (cal.includes('bowtie')) golemAcc.push('bowtie');
  if (cal.includes('hat')) (dog ? dogAcc : golemAcc).push('hat');
  fl.dress({ dog: dogAcc, golem: golemAcc });
  flameLabel();
}
// Stars still on the ground (after a reload) come back where she sneezed them.
function restoreFlameStars() {
  const fl = scene3D?.flame, f = game?.flame;
  if (!fl || flameLoaded === game) return;
  flameLoaded = game;
  fl.clearStars();
  if (!f) return;
  const out = sneezeStars(f.sneezes) - f.starsGot;
  if (out > 0) for (const p of fl.starSpots(out, f.sneezes + 7)) fl.addStar(p);
}
function setupFlame() {
  const fl = scene3D?.flame;
  if (!fl) return;
  flameLabel();
  fl.onStar = onFlameStar;
}
function flameInteract() {
  const f = flameState(), x = ftx(), fl = scene3D.flame;
  if (!f) return;
  if (!f.lit) {
    spellContext = { type: 'flame', mode: 'light', word: flameWord(), tries: 0 };
    openSpellModal(`🔥 ${x.title}`, x.lightInstr, '🔥');
    return;
  }
  if (f.asleep) {
    // The gag first: she snores. Then the magic log wakes her up, or a word does.
    sfxSnore();
    const pos = scene3D.worldToScreen(fl.top);
    if (pos) showFloatingText(pos.x, pos.y, 'Zzz…', '#a8b8ff');
    if (f.magic > 0) {
      f.magic -= 1;
      setTimeout(() => wakeFlame(true), 1400);
    } else {
      speak(x.snore, 0.9);
      setTimeout(() => {
        if (!$('#spell-modal').hidden || !game) return;
        spellContext = { type: 'flame', mode: 'wake', word: flameWord(), tries: 0 };
        openSpellModal(`🔥 ${x.title}`, x.wakeInstr, '😴');
      }, 1400);
    }
    saveGame();
    return;
  }
  const sneeze = releasePart(3) === 2 && flameSize(f) >= 5 && f.sneezes < SNEEZE_STARS.length;
  spellContext = { type: 'flame', mode: sneeze ? 'sneeze' : 'log', word: pickWord(levelAt(0)), tries: 0 };
  openSpellModal(`🔥 ${x.title}`, sneeze ? x.sneezeInstr : x.logInstr, sneeze ? '🤧' : '🪵');
}
function wakeFlame(magic) {
  const f = flameState(), x = ftx(), fl = scene3D?.flame;
  if (!f) return;
  f.asleep = false;
  if (magic) f.last = shiftDay(today(), -1); // the streak goes on
  else { f.days = 0; f.last = null; }
  countFlameDay(f);
  fl?.light(); sfxWhoosh();
  const msg = magic ? x.wakeMagic(f.days) : x.wakeNew;
  toast(magic ? msg : `🔥 ${msg}`, 4500); speak(msg.replace(/^\S+ /, ''), 0.95);
  applyFlameLook(); saveGame();
}
// The first log of a new day adds a day to the streak (and opens the next calendar box).
function countFlameDay(f) {
  const d = today();
  if (f.last === d) return;
  const fresh = f.last !== null;
  f.days = f.last && dayGap(f.last, d) === 1 ? f.days + 1 : 1;
  f.last = d;
  if (fresh) queueFlameMsg(ftx().newDay(f.days), undefined, 'pop');
  if (f.cal.length >= 1 && f.cal.length < CALENDAR.length && f.calDay !== d) openCalendarBox();
}
// A log: she gulps, hiccups and grows.
function flameLog(n = 1) {
  const f = flameState();
  if (!f?.lit || f.asleep) return;
  countFlameDay(f);
  const before = flameSize(f);
  f.logs += n;
  const after = flameSize(f);
  applyFlameLook();
  if (after > before) {
    if (after >= 5) queueFlameMsg(releasePart(3) === 2 && f.sneezes < SNEEZE_STARS.length ? ftx().bigNow : ftx().bigLater, undefined, 'victory');
    else queueFlameMsg(ftx().grow(after), undefined, 'craft');
  }
  saveGame();
}
// Every word right first time (anywhere) gives a log; ten in a week give a magic log.
function flameFirstTry() {
  const f = game?.flame;
  if (!f?.lit) return;
  const wk = weekKey();
  if (f.week !== wk) { f.week = wk; f.weekFirst = 0; f.weekGot = false; }
  f.weekFirst += 1;
  if (!f.weekGot && f.weekFirst >= 10) { f.weekGot = true; f.magic = Math.min(2, f.magic + 1); queueFlameMsg(ftx().magicGot, undefined, 'craft'); }
}
function flameSpelled(mode) {
  const f = flameState(), x = ftx(), fl = scene3D?.flame;
  if (mode === 'light') {
    f.lit = true; f.logs = 0;
    countFlameDay(f);
    saveGame();
    return { text: `🔥 ${x.lit}`, say: x.lit, after: () => { fl?.light(); sfxWhoosh(); setTimeout(() => sfxVictory(), 300); applyFlameLook(); } };
  }
  if (mode === 'wake') return { text: `🔥 ${x.wakeNew}`, say: x.wakeNew, after: () => wakeFlame(false) };
  if (mode === 'sneeze') {
    const n = SNEEZE_STARS[f.sneezes] ?? 1;
    f.sneezes += 1;
    flameLog(1);
    saveGame();
    return {
      text: x.sneezeText(n), say: x.sneeze,
      after: () => {
        if (!fl) return;
        fl.sneeze(n, fl.starSpots(n, f.sneezes));
        sfxSneeze();
        setTimeout(() => { speak(x.sneeze, 1.05); const p = scene3D.worldToScreen(fl.top); if (p) showFloatingText(p.x, p.y, 'ATCHOUM !', '#ffe08a'); }, 100);
      },
    };
  }
  flameLog(1);
  return { text: `🪵 ${x.log}`, say: x.log, after: () => { fl?.hiccup(); setTimeout(sfxHic, 420); const p = fl && scene3D.worldToScreen(fl.top); if (p) setTimeout(() => showFloatingText(p.x, p.y, x.hips, '#ffe08a'), 400); } };
}
function onFlameStar() {
  const f = flameState(), x = ftx();
  if (!f) return;
  f.starsGot = Math.min(10, f.starsGot + 1);
  progress.stars += 1; game.starsEarned += 1;
  sfxStar();
  const p = scene3D.getPlayerScreenPosition();
  if (p) showFloatingText(p.x, p.y - 30, '+1 ★', '#ffc233');
  const msg = x.star(f.starsGot);
  toast(msg, 2200); speak(msg.replace(/^\S+ /, ''), 1);
  if (f.starsGot >= 10 && !f.cal.length) setTimeout(openCalendarBox, 1200);
  updateGameUI(); saveGame(); saveProgress();
}
function openCalendarBox() {
  const f = flameState(), x = ftx();
  if (!f || f.cal.length >= CALENDAR.length) return;
  const box = CALENDAR[f.cal.length];
  f.cal.push(box.id); f.calDay = today();
  if (box.stars) { progress.stars += box.stars; game.starsEarned += box.stars; }
  if (box.diamonds) game.materials.diamond = (game.materials.diamond ?? 0) + box.diamonds;
  const what = (!game.pet?.tamed && box.alt ? box.alt : box.text)[lang] ?? box.text.fr;
  let msg = x.calOpen(f.cal.length, `${box.emoji} ${what}`);
  if (box.id === 'hat' && game.pet?.tamed) msg += ` ${x.hatSpin}`;
  toast(msg, 5000); speak(msg.replace(/^\S+ /, ''), 0.95);
  sfxVictory(); launchConfetti();
  const pet = game.pet?.tamed ? scene3D?.pet : null;
  if (pet) { pet.joy(); pet.trick?.(); }
  applyFlameLook(); updateGameUI(); renderCraftMenu(); saveGame(); saveProgress();
}
function onFlamePartTwo() {
  const f = game?.flame;
  if (!f?.lit || flameSize(f) < 5 || f.sneezes >= SNEEZE_STARS.length || flameP2Said) return;
  flameP2Said = true;
  queueFlameMsg(ftx().partTwo, undefined, 'pop');
}
function tickFlame() {
  if (!game || !scene3D?.flame || scene3D.mode !== 'play' || document.body.dataset.screen !== 'game') return;
  const f = game.flame, fl = scene3D.flame;
  restoreFlameStars();
  if (game.story?.intro) partState('J3');
  // A missed day: she falls asleep (she is never put out).
  if (f?.lit && !f.asleep && f.last && dayGap(f.last, today()) >= 2) { f.asleep = true; queueFlameMsg(ftx().asleep); saveGame(); }
  applyFlameLook();
  if (releasePart(3) === 2) onFlamePartTwo();
  const p = scene3D.player.position, d = Math.hypot(p.x - HEARTH.x, p.z - HEARTH.z);
  const busy = !$('#spell-modal').hidden || !$('#dialog').hidden || !$('#news-modal').hidden || !$('#journal-modal').hidden || !$('#collect-modal').hidden || !$('#travel-modal').hidden || $('#quest-modal')?.hidden === false || knocking || bossFight;
  // The unlit ember wakes up when the hero comes near: "Psst! Spell FEU!"
  if (!f?.lit && !flamePsst && d < 3.6 && !busy) { flamePsst = true; queueFlameMsg(`🔥 ${ftx().psst}`, ftx().psst, 'pop'); }
  // Asleep: she snores when the hero is near.
  if (f?.asleep && d < 6 && !busy && performance.now() - flameSnoreAt > 4000) {
    flameSnoreAt = performance.now(); sfxSnore();
    const s = scene3D.worldToScreen(fl.top); if (s) showFloatingText(s.x, s.y, 'Zzz…', '#a8b8ff');
  }
  if (flameMsgs.length && !busy && performance.now() - defiMsgAt > 3800) {
    defiMsgAt = performance.now();
    const m = flameMsgs.shift();
    toast(m.text, 4500);
    speak(m.say, 0.95);
    if (m.sfx === 'victory') { sfxVictory(); launchConfetti(); } else if (m.sfx === 'craft') sfxCraft(); else if (m.sfx === 'pop') sfxPop();
  }
}
// The journal: Flammèche's two parts, size, streak, magic logs and calendar, written and read.
function flameLines() {
  const f = game?.flame, x = ftx(), dx = dtx();
  if (!game || !scene3D?.flame) return [];
  if (!f?.lit) return [`🔥 ${x.unlit}`];
  const two = releasePart(3) === 2;
  const p1 = flameSize(f) >= 5 ? dx.partDone : `: ${dx.partPlay}`;
  const p2 = !two ? `: ${dx.partLater}` : f.cal.length ? dx.partDone : `: ${dx.partOpen}`;
  const cal = CALENDAR.map((b, i) => (i < f.cal.length ? b.emoji : '🎁')).join(' ');
  return [`🔥 ${x.name} — ${dx.part(p1, p2)}`, `${x.size(flameSize(f))} · ${x.streak(f.days)}${f.asleep ? ' · 😴' : ''} · ${x.magic(f.magic)}`, `📅 ${x.calTitle} : ${cal} (${f.cal.length}/7)`];
}
function flameSpeech() {
  const f = game?.flame, x = ftx(), dx = dtx(), l = flameLines();
  if (!l.length) return '';
  if (!f?.lit) return x.unlit;
  return `${dx.partSay(l[0].replace(/^\S+ /, '').replace('—', '.'))} ${x.size(flameSize(f)).replace('/', ' sur ')}. ${x.streak(f.days)}.`;
}

/* ===== THE COLLECTION ALBUM (J4) ===== */
// The album opens already filled with what the child has met (from the save). A new sticker is
// stuck by spelling its name; missing ones are "???" silhouettes with a hint read aloud. Session 1:
// animals and places (goal: 3 new stickers). Session 2 (part 2 of J4): bosses, objects, Mimots,
// Cocotte's feathers and the 6-card discovery page around the village (first outfit). Every sticker
// makes its noise when touched; golden stickers (1 in 20 when walking past an animal) shine.
const atx = () => ATX[lang] ?? ATX.fr;
const CARD_CRY = { bear: 'polarBear' };
const objectCards = () => CRAFTABLES.filter((c) => !c.repeat);
const capFirst = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
// albumMeetSaidAt starts at -Infinity: performance.now() counts from page load, so 0 would silence the first 20 s.
let albumMsgs = [], albumPage = 'animals', albumP2Said = false, albumMsgAt = 0, albumMeetSaidAt = -Infinity;
function albumAddReady(a, id) { if (!a.stuck[id] && !a.ready.includes(id)) a.ready.push(id); }
function createAlbum() {
  const a = { stuck: {}, ready: [], gold: [], newStuck: 0, goal1: false, disco: false, opened: false };
  for (const id of game.places ?? []) a.stuck[`p:${id}`] = 1;
  for (const id of game.bosses ?? []) a.stuck[`b:${id}`] = 1;
  for (const id of game.crafted ?? []) if (objectCards().some((c) => c.id === id)) a.stuck[`o:${id}`] = 1;
  for (const id of game.story?.mimots ?? []) a.stuck[`m:${id}`] = 1;
  if (game.pet?.tamed) a.stuck['a:dog'] = 1;
  if (Object.values(game.horses ?? {}).some((h) => h.tamed)) a.stuck['a:horse'] = 1;
  // The animals living around the village and the places already found: met, ready to stick.
  const spots = [{ x: 0, z: 8, r: 22 }, ...PLACES.filter((p) => game.places?.includes(p.id)).map((p) => ({ x: p.x, z: p.z, r: 16 }))];
  for (const [kind, x, z] of HERDS) { const id = KIND_TO_CARD[kind]; if (id && spots.some((s) => Math.hypot(s.x - x, s.z - z) < s.r)) albumAddReady(a, `a:${id}`); }
  return a;
}
function albumState() { return game ? (game.album ??= createAlbum()) : null; }
function albumWord(w) {
  const word = w[lang] ?? w.fr;
  if ((progress.age ?? 6) <= 5) return { word: word[0], level: 'story', say: atx().letter(word[0].toUpperCase(), word) };
  return { word, level: 'story', say: `${word}.` };
}
// Every card of a page: { id, emoji, label, say, hint, word (to spell, or null if it sticks by itself), cry }.
function albumCards(page) {
  const x = atx();
  if (page === 'animals') return ALBUM_ANIMALS.map((c) => ({ id: `a:${c.id}`, emoji: c.emoji, label: capFirst(c.word[lang] ?? c.word.fr), say: `${c.sound[lang] ?? c.sound.fr} ${capFirst(c.word[lang] ?? c.word.fr)} !`.replace('… ', ''), hint: c.hint[lang] ?? c.hint.fr, word: c.word, cry: () => albumCry(c.id) }));
  if (page === 'places') return PLACES.map((p) => ({ id: `p:${p.id}`, emoji: p.emoji, label: capFirst(PLACE_WORDS[p.id][lang] ?? PLACE_WORDS[p.id].fr), say: capFirst(p.name[lang] ?? p.name.fr), hint: PLACE_HINTS[p.id][lang] ?? PLACE_HINTS[p.id].fr, word: PLACE_WORDS[p.id], cry: () => sfxPop() }));
  if (page === 'bosses') return BOSSES.map((b) => ({ id: `b:${b.id}`, emoji: b.emoji, label: capFirst(b.name[lang] ?? b.name.fr), say: capFirst(b.name[lang] ?? b.name.fr), hint: BOSS_HINTS[b.id][lang] ?? BOSS_HINTS[b.id].fr, word: null, cry: () => sfxRoar() }));
  if (page === 'objects') return objectCards().map((c) => ({ id: `o:${c.id}`, emoji: c.emoji, label: itemName(c), say: itemName(c), hint: c.parts.map((m) => MATERIAL_EMOJI[m] ?? '').join(' + '), word: null, cry: () => sfxCraft() }));
  if (page === 'mimots') return MIMOTS.map((m, i) => ({ id: `m:${m.id}`, emoji: '🐣', label: `Mimot ${i + 1}`, say: `Mimot ${i + 1} !`, hint: lang === 'en' ? 'A Mimot is hiding somewhere…' : 'Un Mimot se cache quelque part…', word: null, cry: () => { playTone(880, 0.08, 'triangle', 0.1); playTone(1175, 0.12, 'triangle', 0.1, 0.08); } }));
  if (page === 'feathers') return COCOTTE.filter((r) => r.day <= latestDay()).map((r) => ({ id: `f:${r.day}`, emoji: '🪶', label: x.feather(r.day), say: x.feather(r.day), hint: r.hint[lang] ?? r.hint.fr, word: null, cry: () => ANIMAL_CRIES.chicken() }));
  if (page === 'disco') return DISCOVERY.map((d) => ({ id: `d:${d.id}`, emoji: d.emoji, label: capFirst(d.word[lang] ?? d.word.fr), say: capFirst(d.name[lang] ?? d.name.fr), hint: d.hint[lang] ?? d.hint.fr, word: d.word, cry: () => sfxPop() }));
  return [];
}
const albumCard = (id) => albumCards(albumPageOf(id)).find((c) => c.id === id);
function albumPageOf(id) { return { a: 'animals', p: 'places', b: 'bosses', o: 'objects', m: 'mimots', f: 'feathers', d: 'disco' }[id[0]]; }
function cardState(a, id) {
  if (id.startsWith('f:')) return (progress.feathers ?? []).includes(Number(id.slice(2))) ? 'stuck' : 'unknown';
  if (a.gold.includes(id)) return 'goldReady';
  if (a.stuck[id] === 2) return 'gold';
  if (a.stuck[id]) return 'stuck';
  if (a.ready.includes(id)) return 'ready';
  return 'unknown';
}
function albumCry(id) {
  if (id === 'dog') return sfxBark();
  const cry = ANIMAL_CRIES[CARD_CRY[id] ?? id];
  if (cry) return cry();
  if (id === 'dolphin') return [0, 0.12, 0.24].forEach((d) => playTone(1600, 0.08, 'sine', 0.07, d, 2200));
  if (id === 'squid') return playTone(300, 0.25, 'sine', 0.1, 0, 120);
  playTone(1200, 0.1, 'triangle', 0.08);
}
function sfxLick() { playNoise({ type: 'bandpass', freq: 900, q: 1.5, volume: 0.12, duration: 0.35 }); playTone(300, 0.3, 'sine', 0.05, 0, 700); playTone(660, 0.07, 'triangle', 0.12, 0.45); playTone(990, 0.12, 'triangle', 0.12, 0.5); }
function sfxPage() { for (let i = 0; i < 5; i++) playNoise({ type: 'highpass', freq: 2400, q: 0.6, volume: 0.06, duration: 0.12, delay: i * 0.45 }); }
const albumPartTwo = () => releasePart(4) === 2;
const albumPages = () => [...PAGES1, ...PAGES2];
const albumCount = (a) => Object.keys(a.stuck).length + (progress.feathers ?? []).length;
// Big news (goal reached, outfit won) jumps the queue; a "go and stick it" message is dropped once the sticker is stuck.
function queueAlbumMsg(text, say = text.replace(/^\S+ /, ''), sfx = null, card = null) { const m = { text, say, sfx, card }; if (sfx === 'victory') albumMsgs.unshift(m); else albumMsgs.push(m); }
// Something new met: its sticker is ready to stick (announced, but not too often).
function albumMeet(id, quiet = false) {
  const a = albumState();
  if (!a || a.stuck[id] || a.ready.includes(id)) return;
  a.ready.push(id);
  saveGame();
  if (quiet) return;
  const c = albumCard(id);
  if (id.startsWith('d:')) { const d = DISCOVERY.find((k) => `d:${k.id}` === id); queueAlbumMsg(atx().discoNear(c.emoji), atx().discoNearSay(d.name[lang] ?? d.name.fr), 'pop', id); return; }
  if (performance.now() - albumMeetSaidAt < 20000) return;
  albumMeetSaidAt = performance.now();
  queueAlbumMsg(atx().newCard(c.emoji), atx().newCardSay, 'pop', id);
}
function albumGold(id) {
  const a = albumState();
  if (!a || a.stuck[id] === 2 || a.gold.includes(id)) return;
  a.gold.push(id);
  saveGame();
  queueAlbumMsg(atx().goldFound(albumCard(id).emoji), atx().goldFoundSay, 'craft');
}
function discoPos(d) {
  if (typeof d.at === 'object') return d.at;
  if (d.at === 'golem') return scene3D.golem?.mesh.position;
  if (d.at === 'mage') return scene3D.interactables.find((i) => i.kind === 'npc' && i.npcId === 'mage')?.worldPos;
  const p = scene3D.player.position;
  return (scene3D.fauna?.list ?? []).filter((f) => f.kind === d.at).sort((u, v) => u.mesh.position.distanceTo(p) - v.mesh.position.distanceTo(p))[0]?.mesh.position;
}
function setupAlbum() {
  const st = scene3D?.albumStand;
  if (st) scene3D.setSpotMaterial(st.obj, 'talk', atx().standLabel);
}
function albumStandInteract() {
  const st = scene3D?.albumStand;
  st?.flip(5); sfxPage();
  setTimeout(() => { if (game && $('#spell-modal').hidden) openCollect(); }, 700);
}
function openCollect(page = null, fresh = null) {
  const a = albumState();
  if (!a) return;
  const first = !a.opened;
  if (page) albumPage = page;
  else if (first) albumPage = 'animals';
  if (!albumPartTwo() && PAGES2.includes(albumPage)) albumPage = 'animals';
  renderCollect({ reveal: first, fresh });
  $('#collect-modal').hidden = false;
  if (first) {
    // The wow moment: pages flip, fanfare, confetti, and every sticker pops in with a little sound.
    a.opened = true;
    scene3D?.albumStand?.flip(4);
    sfxVictory(); launchConfetti();
    const n = albumCount(a), k = a.ready.length;
    const cards = document.querySelectorAll('#collect-grid .collect-item');
    cards.forEach((c, i) => { if (i < 14) setTimeout(() => playTone(600 + i * 40, 0.06, 'triangle', 0.06), 250 + i * 70); });
    speak(atx().welcome(n, k), 0.95);
    saveGame();
  } else if (!fresh) {
    const cs = albumCards(albumPage), have = cs.filter((c) => ['stuck', 'gold'].includes(cardState(a, c.id))).length;
    speak(atx().pageSay(atx().pageNames[albumPage], have, cs.length), 0.95);
  }
}
function closeCollect() { $('#collect-modal').hidden = true; stopSpeaking(); }
function renderCollect({ reveal = false, fresh = null } = {}) {
  const a = albumState(), x = atx(), two = albumPartTwo();
  $('#collect-title').textContent = `📖 ${x.title}`;
  $('#collect-lede').textContent = x.lede(albumCount(a), Object.values(a.stuck).filter((v) => v === 2).length);
  $('#collect-words').textContent = x.words;
  $('#collect-close').textContent = x.close;
  const tabs = albumPages().map((pg) => {
    const locked = PAGES2.includes(pg) && !two;
    const cs = albumCards(pg), have = cs.filter((c) => ['stuck', 'gold'].includes(cardState(a, c.id))).length;
    const waiting = cs.some((c) => ['ready', 'goldReady'].includes(cardState(a, c.id)));
    const b = el('button', `collect-tab${pg === albumPage ? ' is-on' : ''}${locked ? ' is-locked' : ''}${waiting ? ' has-new' : ''}`, `${locked ? '🔒 ' : ''}${x.tabs[pg]}${locked ? '' : ` ${have}/${cs.length}`}`);
    b.type = 'button'; b.dataset.page = pg;
    b.addEventListener('click', () => {
      if (locked) { toast(x.locked, 3000); speak(x.lockedSay, 0.95); return; }
      albumPage = pg; renderCollect();
      const cs2 = albumCards(pg), h2 = cs2.filter((c) => ['stuck', 'gold'].includes(cardState(a, c.id))).length;
      speak(x.pageSay(x.pageNames[pg], h2, cs2.length), 0.95);
    });
    return b;
  });
  $('#collect-tabs').replaceChildren(...tabs);
  const items = albumCards(albumPage).map((c, i) => {
    const s = cardState(a, c.id);
    const shown = s === 'stuck' || s === 'gold' || (s === 'goldReady' && a.stuck[c.id]);
    const b = el('button', `collect-item is-${s}${shown ? ' is-shown' : ''}${reveal ? ' is-reveal' : ''}${fresh === c.id ? ' is-new' : ''}`);
    b.type = 'button'; b.dataset.id = c.id;
    b.style.setProperty('--i', i);
    const tag = s === 'ready' ? x.toStick : s === 'goldReady' ? x.goldToStick : shown ? c.label : x.unknown;
    b.append(el('span', 'collect-emoji', c.emoji), el('span', 'collect-label', tag));
    b.addEventListener('click', () => albumCardClick(c, b));
    return b;
  });
  // Cocotte hides on today's page: a sticker that winks.
  const hen = henRow();
  if (hen?.album === albumPage && !henFound()) {
    const b = el('button', `collect-item is-hen${reveal ? ' is-reveal' : ''}`);
    b.type = 'button'; b.dataset.id = 'hen';
    b.style.setProperty('--i', items.length);
    b.append(el('span', 'collect-emoji', '🐔'), el('span', 'hen-wink', x.henWink), el('span', 'collect-label', x.henCard));
    b.addEventListener('click', () => albumHenFound(b));
    items.splice(Math.min(items.length, 9), 0, b);
  }
  $('#collect-grid').replaceChildren(...items);
}
function albumCardClick(c, btn) {
  const a = albumState(), s = cardState(a, c.id), x = atx();
  btn.classList.remove('is-bounce'); void btn.offsetWidth; btn.classList.add('is-bounce');
  if (s === 'ready' || s === 'goldReady') {
    const gold = s === 'goldReady';
    closeCollect();
    spellContext = { type: 'album', cardId: c.id, gold, word: albumWord(c.word ?? { fr: c.label.toLowerCase(), en: c.label.toLowerCase() }), tries: 0 };
    openSpellModal(`${c.emoji} ${gold ? x.goldTitle : x.stickTitle}`, gold ? x.goldInstr : x.stickInstr(c.emoji), c.emoji);
    return;
  }
  if (s === 'stuck' || s === 'gold') { c.cry(); speak(c.say, 1); return; }
  toast(`❓ ${c.hint}`, 3500); speak(c.hint, 0.95);
}
// Spelled: slurp (the hero licks the sticker!), pop, stuck. Back to the album, the new sticker pops in.
function albumStick(id) {
  const a = albumState(), x = atx(), c = albumCard(id);
  const gold = a.gold.includes(id);
  const isNew = !a.stuck[id];
  a.stuck[id] = gold ? 2 : 1;
  a.ready = a.ready.filter((k) => k !== id);
  a.gold = a.gold.filter((k) => k !== id);
  if (isNew) a.newStuck += 1;
  let extra = null;
  if (!a.goal1 && a.newStuck >= ALBUM_GOAL1) {
    a.goal1 = true;
    progress.stars += 10; game.starsEarned += 10;
    extra = () => queueAlbumMsg(x.goal1, undefined, 'victory');
  }
  if (!a.disco && DISCOVERY.every((d) => a.stuck[`d:${d.id}`])) {
    a.disco = true;
    const cos = COSTUMES.find((k) => k.id === 'explorer' && !costumeState().owned.includes(k.id)) ?? COSTUMES.filter((k) => k.id !== 'hero' && !costumeState().owned.includes(k.id)).sort((u, v) => u.price - v.price)[0];
    if (cos) { unlockCostume(cos.id); a.costume = cos.id; extra = () => queueAlbumMsg(`🎉 ${x.discoDone(`${cos.emoji} ${cos.name[lang]}`)}`.replace('🎉 🎉', '🎉'), x.discoDoneSay(cos.name[lang]), 'victory'); }
    else { game.materials.diamond = (game.materials.diamond ?? 0) + 3; extra = () => queueAlbumMsg(x.discoDiamonds, undefined, 'victory'); }
  }
  saveGame(); saveProgress();
  const w = c.label;
  return {
    text: gold ? x.goldStuck(c.emoji, w) : x.stuck(c.emoji, w), say: gold ? x.goldStuckSay(w) : x.stuckSay(w),
    after: () => {
      sfxLick();
      openCollect(albumPageOf(id), id);
      setTimeout(() => c.cry(), 600);
      if (gold) launchConfetti();
      extra?.();
    },
  };
}
function albumHenFound(btn) {
  const r = henRow();
  if (!r || henFound()) return;
  btn.classList.add('is-flyaway');
  henReward(r.day);
  setTimeout(() => { if (!$('#collect-modal').hidden) renderCollect(); }, 1600);
}
// For the tests: find today's Cocotte, wherever she hides.
function findCocotte() {
  const r = henRow();
  if (!r || henFound()) return 'none';
  if (r.album) {
    openCollect(r.album);
    const b = document.querySelector('#collect-grid .is-hen');
    if (!b) return 'missing';
    b.click();
    closeCollect();
    return 'ok';
  }
  const o = scene3D.cocotte?.obj;
  if (!o) return 'missing';
  if (!o.active) return 'inactive';
  scene3D.teleport(o.worldPos.x + 0.9, o.worldPos.z + 0.9, 0, r.cloud ? o.worldPos.y : undefined);
  scene3D.onInteractObject(o);
  return 'ok';
}
function onAlbumPartTwo() {
  const a = game?.album;
  if (!a || a.disco || albumP2Said) return;
  albumP2Said = true;
  queueAlbumMsg(atx().partTwo, undefined, 'pop');
}
const collectOpen = () => !$('#collect-modal').hidden;
function tickAlbum() {
  if (!game || !scene3D?.albumStand || scene3D.mode !== 'play' || document.body.dataset.screen !== 'game') return;
  if (game.story?.intro) partState('J4');
  const a = albumState();
  // Bosses beaten, objects crafted and Mimots tamed stick by themselves (they were won with words).
  for (const id of game.bosses ?? []) a.stuck[`b:${id}`] ??= 1;
  for (const id of game.crafted ?? []) if (objectCards().some((c) => c.id === id)) a.stuck[`o:${id}`] ??= 1;
  for (const id of game.story?.mimots ?? []) a.stuck[`m:${id}`] ??= 1;
  for (const id of game.places ?? []) albumMeet(`p:${id}`);
  if (game.pet?.tamed) albumMeet('a:dog');
  if (Object.values(game.horses ?? {}).some((h) => h.tamed)) albumMeet('a:horse');
  // Animals met on the way (and, now and then, a golden sticker).
  const p = scene3D.player.position, now = performance.now();
  for (const an of scene3D.fauna?.list ?? []) {
    if (!an.mesh.visible) continue;
    const id = KIND_TO_CARD[an.kind];
    if (!id) continue;
    const d = Math.hypot(an.mesh.position.x - p.x, an.mesh.position.z - p.z);
    if (d < 7) albumMeet(`a:${id}`);
    if (d < 4.5 && (an.goldT ?? 0) < now) { an.goldT = now + 60000; if (Math.random() < (window.__se?.albumGold ?? GOLD_CHANCE)) albumGold(`a:${id}`); }
  }
  if (albumPartTwo()) {
    onAlbumPartTwo();
    for (const d of DISCOVERY) { const q = discoPos(d); if (q && Math.hypot(q.x - p.x, q.z - p.z) < 4.5) albumMeet(`d:${d.id}`); }
  }
  const busy = !$('#spell-modal').hidden || !$('#dialog').hidden || !$('#news-modal').hidden || !$('#journal-modal').hidden || !$('#travel-modal').hidden || collectOpen() || knocking || bossFight;
  while (albumMsgs[0]?.card && a.stuck[albumMsgs[0].card]) albumMsgs.shift();
  if (albumMsgs.length && !busy && now - Math.max(defiMsgAt, albumMsgAt) > 3800) {
    albumMsgAt = now; defiMsgAt = now;
    const m = albumMsgs.shift();
    toast(m.text, 4500);
    speak(m.say, 0.95);
    if (m.sfx === 'victory') { sfxVictory(); launchConfetti(); } else if (m.sfx === 'craft') sfxCraft(); else if (m.sfx === 'pop') sfxPop();
  }
}
// The journal: the album's two parts and counts, written and read.
function albumLines() {
  const a = game?.album, x = atx(), dx = dtx();
  if (!game || !scene3D?.albumStand) return [];
  if (!a?.opened) return [`📖 ${x.noAlbumYet}`];
  const two = albumPartTwo();
  const p1 = a.goal1 ? dx.partDone : `: ${dx.partPlay}`;
  const p2 = !two ? `: ${dx.partLater}` : a.disco ? dx.partDone : `: ${dx.partOpen}`;
  const disco = two ? DISCOVERY.filter((d) => a.stuck[`d:${d.id}`]).length : null;
  const lines = [`📖 ${x.name} — ${dx.part(p1, p2)}`, x.journalCount(albumCount(a), Object.values(a.stuck).filter((v) => v === 2).length, disco)];
  if (!a.goal1) lines.push(x.journalGoal(a.newStuck));
  return lines;
}
function albumSpeech() {
  const l = albumLines(), dx = dtx();
  if (!l.length) return '';
  if (!game.album?.opened) return l[0].replace(/^\S+ /, '');
  return `${dx.partSay(l[0].replace(/^\S+ /, '').replace('—', '.'))} ${l.slice(1).join('. ').replace(/·/g, '.').replace('/', ' sur ')}.`;
}

/* ===== WORD POWERS (J5) ===== */
// The power stone wakes up (wow: sparkles fly up to the five clouds) and gives a power for a hard
// word: super jump in session 1 (and speed as a bonus), giant then glide in session 2. A hard word
// spelled right the first time anywhere also gives a power. Session 1: land on each of the five
// clouds and spell its word (a star, the power recharged); all five = a little cloud that follows
// the hero. Session 2 (part 2 of J5): as a giant, make 5 animals bounce; then glide from the highest
// cloud through the five rings (a word on landing keeps them): the Cloud Hero cape.
const ptx = () => PTX[lang] ?? PTX.fr;
function powersState() { return game ? (game.powers ??= { awake: false, clouds: [], rings: [], animals: 0, bounced: [], petCloud: false, cape: false, uses: 0 }) : null; }
const powersPartTwo = () => releasePart(5) === 2;
const powersDone1 = (w = game?.powers) => (w?.clouds?.length ?? 0) >= CLOUDS.length;
const powersDone2 = (w = game?.powers) => !!w?.cape && (w?.animals ?? 0) >= ANIMALS_GOAL;
let powerMsgs = [], powersP2Said = false, powerLastCloud = -1, powerLastSec = -1, powerRingsPending = [], powerAnimalSaidAt = 0;
function queuePowerMsg(text, say = text.replace(/^\S+ /, ''), sfx = null) { powerMsgs.push({ text, say, sfx }); }
function sfxPowerUp() { playTone(330, 0.12, 'triangle', 0.1, 0, 660); playTone(495, 0.12, 'triangle', 0.1, 0.1, 990); playTone(660, 0.25, 'triangle', 0.1, 0.2, 1320); }
function sfxBoing() { playTone(180, 0.35, 'sine', 0.14, 0, 520); playTone(260, 0.2, 'triangle', 0.05, 0.05, 700); }
function sfxPouf() { playNoise({ type: 'lowpass', freq: 500, q: 0.8, volume: 0.2, duration: 0.3 }); playTone(120, 0.25, 'sine', 0.1, 0, 60); }
function sfxStomp() { playNoise({ type: 'lowpass', freq: 160, q: 1.5, volume: 0.25, duration: 0.25 }); playTone(60, 0.3, 'sine', 0.16, 0, 40); }
function sfxRing() { playTone(880, 0.1, 'triangle', 0.12); playTone(1175, 0.1, 'triangle', 0.12, 0.08); playTone(1568, 0.18, 'triangle', 0.12, 0.16); }
function powerName(kind) { return ptx().names[kind] ?? kind; }
// A hard word: above the child's age level, or a word that was tricky before.
function isHardWord(w, wasDifficult) {
  if (!w) return false;
  const ladder = AGE_LADDER[lang] ?? AGE_LADDER.fr, a = AGE_START[lang]?.[progress.age ?? 6] ?? 0;
  return ladder.indexOf(w.level) > a || !!wasDifficult;
}
function floatAbove(text, color = '#ffe08a', dy = 2.2) {
  const p = scene3D?.player.position;
  if (!p) return;
  const s = scene3D.worldToScreen(p.clone().setY(p.y + dy * scene3D.player.scale.y));
  if (s) showFloatingText(s.x, s.y, text, color);
}
function applyPowersLook() {
  const pw = scene3D?.powers, w = game?.powers;
  if (!pw) return;
  pw.setState({ awake: !!w?.awake, cloudsGot: w?.clouds ?? [], ringsOn: powersPartTwo() && !!w?.awake, ringsGot: w?.rings ?? [], petCloud: !!w?.petCloud });
  const want = ptx().label;
  if (pw.obj.labelText !== want) { pw.obj.labelText = want; scene3D.setSpotMaterial(pw.obj, 'talk', want); }
}
// The power the stone gives now.
function stonePower() {
  const w = powersState();
  if (!powersPartTwo()) return 'jump';
  if (w.animals < ANIMALS_GOAL) return 'giant';
  if (w.rings.length < RINGS.length) return 'glide';
  return ['jump', 'giant', 'glide', 'speed'][w.uses % 4];
}
function setupPowers() {
  const pw = scene3D?.powers;
  if (!pw || pw.wired) return;
  pw.wired = true;
  pw.onCloudPop = (i) => { playTone(520 + i * 130, 0.12, 'triangle', 0.12); playTone(780 + i * 190, 0.16, 'triangle', 0.08, 0.06); };
  pw.onStomp = (hit) => {
    sfxStomp();
    floatAbove(ptx().stomp, '#ffd6a0', 2.6);
    if (!hit.length) return;
    const w = powersState(), list = scene3D.fauna.list;
    for (const a of hit.slice(0, 2)) ANIMAL_CRIES[a.kind]?.();
    let fresh = 0;
    for (const a of hit) { const id = list.indexOf(a); if (!w.bounced.includes(id)) { w.bounced.push(id); fresh++; } }
    if (!fresh || w.animals >= ANIMALS_GOAL) return;
    w.animals = Math.min(ANIMALS_GOAL, w.bounced.length);
    if (w.animals >= ANIMALS_GOAL) { queuePowerMsg(ptx().animalsDone, undefined, 'victory'); progress.stars += 5; game.starsEarned += 5; updateGameUI(); }
    else if (performance.now() - powerAnimalSaidAt > 2500) { powerAnimalSaidAt = performance.now(); toast(ptx().animal(w.animals), 2500); speak(ptx().animal(w.animals).replace(/^\S+ /, ''), 1); }
    saveGame();
  };
  pw.onRing = (i) => {
    sfxRing();
    if (!powerRingsPending.includes(i) && !game.powers?.rings.includes(i)) powerRingsPending.push(i);
    const n = new Set([...(game.powers?.rings ?? []), ...powerRingsPending]).size;
    floatAbove(ptx().ring(n).replace(/^\S+ /, '⭕ '), '#ffe08a');
    speak(ptx().ring(n).replace(/^\S+ /, ''), 1.05);
  };
  scene3D.onBigLanding = () => { pw.squash = 1; pw.poufs = (pw.poufs ?? 0) + 1; sfxPouf(); floatAbove(ptx().pouf, '#ffffff', 1.8); scene3D.particleBurst(scene3D.player.position.clone().setY(scene3D.player.position.y + 0.2), '#e8e8e8', 14); };
}
function givePower(kind, word, { bonus = false } = {}) {
  const pw = scene3D?.powers;
  if (!pw) return '';
  const w = powersState();
  w.uses++;
  pw.give(kind, word?.word ?? '', kind === 'glide' ? GLIDE_TIME : POWER_TIME);
  powerLastSec = -1;
  sfxPowerUp();
  defiEvent('power');
  const x = ptx(), dog = game.pet?.tamed;
  const text = bonus ? x.hardBonus(powerName(kind)) : x.got[kind];
  const say = `${bonus ? x.hardBonus(powerName(kind)).replace(/^\S+ /, '') + ' ' : ''}${x.gotSay[kind]}${dog && kind === 'giant' ? ` ${x.dogToo}` : ''}`;
  updatePowerHud();
  saveGame();
  return { text: `${text}${dog && kind === 'giant' ? ` ${x.dogToo}` : ''}`, say };
}
function powerStoneInteract() {
  const w = powersState(), x = ptx(), pw = scene3D.powers;
  setupPowers();
  if (!w.awake) {
    // Wow: the stone wakes up, sparkles fly to the five clouds, the stars appear.
    w.awake = true;
    pw.wake();
    applyPowersLook();
    setTimeout(() => { sfxVictory(); launchConfetti(); }, 2600);
    toast(`⚡ ${x.wake}`, 6000);
    speak(x.wake, 0.95);
    saveGame();
    setTimeout(() => { if ($('#spell-modal').hidden && !spellContext) openStoneWord(); }, 5500);
    return;
  }
  openStoneWord();
}
function openStoneWord() {
  const kind = stonePower();
  const lvl = (progress.age ?? 6) <= 5 ? levelAt(0) : levelAt(1);
  spellContext = { type: 'powers', mode: 'stone', power: kind, word: pickWord(lvl, { programme: false }), tries: 0 };
  openSpellModal(`⚡ ${ptx().stone}`, ptx().stoneInstr(powerName(kind)), POWER_KINDS[kind].emoji);
}
function openPowerWord(mode, extra = {}) {
  const x = ptx();
  spellContext = { type: 'powers', mode, word: pickWord(levelAt(0)), tries: 0, ...extra };
  openSpellModal(mode === 'cloud' ? `☁️ ${x.name}` : `⭕ ${x.name}`, mode === 'cloud' ? x.cloudInstr : x.landInstr(extra.rings[0] + 1), mode === 'cloud' ? '☁️' : '⭕');
}
// After a word of the powers: the result shown in the spelling window.
function powersSpelled(ctx, copied) {
  const w = powersState(), x = ptx(), pw = scene3D.powers;
  if (ctx.mode === 'stone') return givePower(ctx.power, ctx.word);
  if (ctx.mode === 'cloud') {
    const k = ctx.cloud;
    if (!w.clouds.includes(k)) w.clouds.push(k);
    progress.stars += 2; game.starsEarned += 2;
    pw.refill();
    const c = CLOUDS[k];
    for (const col of ['#ffd34a', '#ffffff']) scene3D.particleBurst({ x: c.x, y: c.h + 0.8, z: c.z }, col, 22);
    sfxStar();
    applyPowersLook();
    let after = null;
    if (powersDone1(w) && !w.petCloud) {
      w.petCloud = true;
      progress.stars += 10; game.starsEarned += 10;
      after = () => { applyPowersLook(); queuePowerMsg(x.cloudsDone, x.cloudsDoneSay, 'victory'); if (powersPartTwo()) onPowersPartTwo(true); };
    }
    saveGame(); updateGameUI();
    return { text: x.cloudStar(k + 1), say: x.cloudStarSay(k + 1), after };
  }
  // A landing after the rings: one word per ring passed keeps it.
  const got = [...new Set([...w.rings, ...(ctx.rings ?? [])])];
  w.rings = got;
  progress.stars += 2; game.starsEarned += 2;
  applyPowersLook();
  const queue = (ctx.queue ?? []).filter((i) => !got.includes(i));
  let after = queue.length ? () => openPowerWord('land', { rings: [queue[0]], queue: queue.slice(1) }) : null, text = x.ringsKept(got.length), say = text.replace(/^\S+ /, '');
  if (got.length >= RINGS.length && !w.cape) {
    w.cape = true;
    unlockCostume('cloudhero');
    costumeState().current = 'cloudhero'; applyCostume(); saveProgress();
    text = x.ringsDone; say = x.ringsDoneSay;
    after = () => { sfxVictory(); launchConfetti(); };
  }
  saveGame(); updateGameUI();
  return { text, say, after };
}
// A hard word right the first time (anywhere): a power as a bonus.
function powersHardWord(word, wasDifficult, type) {
  const w = game?.powers;
  if (!w?.awake || !scene3D?.powers || type === 'powers' || bossFight || scene3D.powers.power) return;
  if (!isHardWord(word, wasDifficult)) return;
  const kinds = powersPartTwo() ? ['speed', 'jump', 'giant', 'glide'] : ['speed', 'jump'];
  const kind = kinds[(w.uses + 1) % kinds.length];
  const r = givePower(kind, word, { bonus: true });
  if (r) setTimeout(() => queuePowerMsg(r.text, r.say, 'pop'), 400);
}
function onPowersPartTwo(force = false) {
  const w = game?.powers;
  if (!w?.awake || powersP2Said || (powersDone2(w) && !force)) return;
  powersP2Said = true;
  applyPowersLook();
  queuePowerMsg(ptx().partTwo, undefined, 'pop');
}
function updatePowerHud() {
  const hud = $('#power-hud'), pw = scene3D?.powers?.power;
  if (!hud) return;
  hud.hidden = !pw || document.body.dataset.screen !== 'game';
  if (!pw) return;
  const label = `${POWER_KINDS[pw.kind].emoji} ${Math.max(0, Math.ceil(pw.left))} s`;
  if (hud.textContent !== label) hud.textContent = label;
  hud.classList.toggle('is-low', pw.left < 5);
}
function tickPowers(dt) {
  if (!game || !scene3D?.powers || scene3D.mode !== 'play' || document.body.dataset.screen !== 'game') return;
  if (game.story?.intro) partState('J5');
  setupPowers();
  const pw = scene3D.powers, w = powersState(), x = ptx();
  applyPowersLook();
  if (powersPartTwo()) onPowersPartTwo();
  const busy = !$('#spell-modal').hidden || !$('#dialog').hidden || !$('#news-modal').hidden || !$('#journal-modal').hidden || !$('#collect-modal').hidden || !$('#travel-modal').hidden || $('#quest-modal')?.hidden === false || knocking || bossFight;
  // The power's clock (paused while a word is spelled); the glide waits for the landing.
  const cur = pw.power;
  if (cur && !busy) {
    cur.left -= dt;
    const sec = Math.ceil(cur.left);
    if (sec <= 3 && sec > 0 && sec !== powerLastSec) { powerLastSec = sec; playTone(660, 0.06, 'square', 0.05); }
    if (cur.left <= 0 && (cur.kind !== 'glide' || scene3D.onGround)) { pw.stop(); queuePowerMsg(x.over(powerName(cur.kind))); }
  }
  updatePowerHud();
  // Landing on a cloud: boing! A new cloud asks for its word.
  const k = pw.onCloud();
  if (k >= 0 && k !== powerLastCloud) { sfxBoing(); pw.squash = 0.8; floatAbove(x.boing, '#ffffff', 1.9); }
  powerLastCloud = k;
  if (k >= 0 && w.awake && !w.clouds.includes(k) && !busy && !spellContext) openPowerWord('cloud', { cloud: k });
  // Back on the ground after flying through rings: a word keeps them.
  if (scene3D.onGround && k < 0 && !busy && !spellContext && powerRingsPending.length) {
    const rings = powerRingsPending; powerRingsPending = [];
    pw.ringsThisFlight.clear();
    openPowerWord('land', { rings: [rings[0]], queue: rings.slice(1) });
  } else if (scene3D.onGround) pw.ringsThisFlight.clear();
  if (powerMsgs.length && !busy && performance.now() - defiMsgAt > 3800) {
    defiMsgAt = performance.now();
    const m = powerMsgs.shift();
    toast(m.text, 4500);
    speak(m.say, 0.95);
    if (m.sfx === 'victory') { sfxVictory(); launchConfetti(); } else if (m.sfx === 'craft') sfxCraft(); else if (m.sfx === 'pop') sfxPop();
  }
}
// The journal: the two parts of the powers and the counts, written and read.
function powersLines() {
  const w = game?.powers, x = ptx(), dx = dtx();
  if (!game || !scene3D?.powers || !w?.awake) return scene3D?.powers && game ? [`⚡ ${x.name} : ${x.notYet}`] : [];
  const two = powersPartTwo();
  const p1 = powersDone1(w) ? dx.partDone : `: ${dx.partPlay}`;
  const p2 = !two ? `: ${dx.partLater}` : powersDone2(w) ? dx.partDone : `: ${dx.partOpen}`;
  return [`⚡ ${x.name} — ${dx.part(p1, p2)}`, x.lines(w.clouds.length, w.rings.length, w.animals)];
}
function powersSpeech() {
  const l = powersLines(), dx = dtx();
  if (!l.length) return '';
  if (l.length === 1) return l[0].replace(/^\S+ /, '');
  return `${dx.partSay(l[0].replace(/^\S+ /, '').replace('—', '.'))} ${l[1].replace(/·/g, '.').replace(/(\d)\/(\d)/g, '$1 sur $2')}.`;
}

/* ===== THE LITTLE COPPER GOLEM AND THE SECRET BUTTONS (J6) ===== */
// Session 1: the recipe at the anvil (FER, PIERRE, FEU) builds Boulon, who follows the hero for
// 3 minutes (a word winds his key every minute); two secret buttons in the village, each opening a
// secret chest with a word (the second one, bigger, has two locks and a golden key for Boulon).
// Session 2 (part 2 of J6): Boulon has gone green (spell BRILLE), then three buttons in three places;
// the last chest gives the Copper Knight outfit and Boulon stays for good.
const ctx6 = () => CTX[lang] ?? CTX.fr;
function copperState() { return game ? (game.copper ??= { made: false, step: 0, left: 0, nextWind: 0, windT: 0, flat: false, asleep: false, pressed: [], opened: [], chestAt: -1, locks: 0, green: false, shiny: false, goldKey: false, forever: false, costume: false, bongs: 0, trips: 0, fakes: 0 }) : null; }
const copperPartTwo = () => releasePart(6) === 2;
const copperDone1 = (c = game?.copper) => spotsOfPart(1).every((sp) => c?.opened?.includes(sp.id));
const copperDone2 = (c = game?.copper) => !!c?.costume;
// Part 2's buttons appear once part 2 is open and part 1 is done.
const copperPart = (c = game?.copper) => (copperPartTwo() && copperDone1(c) ? 2 : 1);
let copperMsgs = [], copperGame = null, copperP2Said = false, copperBeepAt = 0, copperGagAt = -1e9, copperTripAt = -1e9;
function queueCopperMsg(text, say = text.replace(/^\S+ /, ''), sfx = null) { copperMsgs.push({ text, say, sfx }); }
function sfxClang() { playTone(1250, 0.25, 'square', 0.06); playTone(1880, 0.35, 'triangle', 0.07, 0.01); playNoise({ type: 'highpass', freq: 3000, q: 0.6, volume: 0.08, duration: 0.12 }); }
function sfxBong() { playTone(196, 0.5, 'sine', 0.16, 0, 150); playTone(392, 0.3, 'triangle', 0.06, 0.01, 300); }
function sfxPouet() { playTone(330, 0.12, 'sawtooth', 0.07, 0, 250); playTone(250, 0.22, 'sawtooth', 0.07, 0.12, 180); }
function sfxClic() { playTone(1800, 0.04, 'square', 0.08); playTone(900, 0.06, 'square', 0.06, 0.05); playNoise({ type: 'lowpass', freq: 140, q: 1, volume: 0.2, duration: 0.6, delay: 0.15 }); }
function sfxBip(d) { playTone(d < 4 ? 1400 : 1000, 0.05, 'square', 0.03); }
function copperWord(w) {
  const word = w[lang] ?? w.fr;
  if ((progress.age ?? 6) <= 5) return { word: word[0], level: 'story', say: ctx6().letter(word[0].toUpperCase(), word) };
  return { word, level: 'story', say: `${word}.` };
}
function copperFloat(pos, text, color = '#ffe08a', dy = 1.6) {
  const sp = scene3D?.worldToScreen(pos.clone().setY(pos.y + dy));
  if (sp) showFloatingText(sp.x, sp.y, text, color);
}
const nextSpot = (c = game?.copper) => spotsOfPart(copperPart(c)).find((sp) => !c?.opened?.includes(sp.id)) ?? null;
const placeOf = (sp) => sp.place[lang] ?? sp.place.fr;
function applyCopperLook() {
  const cw = scene3D?.copper, c = game?.copper;
  if (!cw) return;
  const st = { part: copperPart(c), pressed: (c?.pressed ?? []).map((id) => BUTTON_SPOTS.findIndex((b) => b.id === id)), chestAt: c?.chestAt ?? -1, green: !!c?.green && !c?.shiny, goldKey: !!c?.goldKey };
  const o = cw.state;
  if (o.part !== st.part || o.chestAt !== st.chestAt || o.green !== st.green || o.goldKey !== st.goldKey || o.pressed.join() !== st.pressed.join()) cw.setState(st);
  const want = ctx6().label;
  if (cw.obj.labelText !== want) { cw.obj.labelText = want; scene3D.setSpotMaterial(cw.obj, 'talk', want); }
  const wg = ctx6().labelGolem;
  if (cw.gobj.labelText !== wg) { cw.gobj.labelText = wg; scene3D.setSpotMaterial(cw.gobj, 'talk', wg); cw.gobj.iconHolder.children.filter((c) => c.isObject3D && !c.userData.label).forEach((c) => { c.visible = false; }); }
}
function setupCopper() {
  const cw = scene3D?.copper;
  if (!cw || cw.wired) return;
  cw.wired = true;
  const x = () => ctx6();
  cw.onPiece = (i) => { sfxBong(); copperFloat(cw.golem.position, x().bong, '#ffd6a0', 0.6 + i * 0.25); };
  cw.onBorn = () => {
    sfxVictory(); launchConfetti(); animalVoice({ type: 'square', f0: 520, f1: 880, dur: 0.3, filter: 'lowpass', freq: 1800, vol: 0.08 });
    const sp = nextSpot();
    toast(`🤖 ${x().born}`, 6000);
    speak(x().born, 0.95);
    if (sp) queueCopperMsg(`📡 ${x().bornHint(placeOf(sp))}`);
  };
  cw.onTrip = () => { const c = copperState(); c.trips++; sfxPouf(); copperFloat(cw.golem.position, x().oops, '#ffffff', 1.2); if (performance.now() - copperTripAt > 15000) { copperTripAt = performance.now(); speak(x().tripSay, 1.05); } };
  cw.onBong = () => { const c = copperState(); c.bongs++; sfxBong(); copperFloat(cw.golem.position, x().bong, '#ffd6a0', 1.5); if (performance.now() - copperGagAt > 20000) { copperGagAt = performance.now(); speak(x().bongSay, 1.05); } };
  cw.onGreet = () => { sfxBong(); setTimeout(() => animalVoice({ type: 'square', f0: 140, f1: 110, dur: 0.35, filter: 'lowpass', freq: 500, vol: 0.1 }), 300); copperFloat(cw.golem.position, `👋 ${x().hello}`, '#ffffff', 1.7); speak(x().hello, 1.1); };
  cw.onBeep = (d) => { if (performance.now() - copperBeepAt > 350 && $('#spell-modal').hidden) { copperBeepAt = performance.now(); sfxBip(d); } };
  cw.onWaitChest = () => { toast(`🤖 ${x().waitChest}`, 3000); speak(x().waitChest, 1); };
  cw.onRide = () => { toast(`🪂 ${x().ride}`, 2500); };
  cw.onRideLand = () => { sfxBong(); copperFloat(cw.golem.position, x().bong, '#ffd6a0', 1.4); };
  cw.onPress = (si, real) => {
    const c = copperState(), sp = BUTTON_SPOTS[si];
    if (!real) { c.fakes++; sfxPouet(); launchConfetti(); copperFloat(cw.golem.position, x().pouet, '#ff8ab0', 1.2); if (c.fakes <= 2 || Math.random() < 0.3) speak(x().fake, 1.05); return; }
    sfxClic();
    if (!c.pressed.includes(sp.id)) c.pressed.push(sp.id);
    const big = spotsOfPart(sp.part).filter((b) => !c.opened.includes(b.id)).length === 1;
    c.chestAt = si; c.locks = big ? 2 : 1;
    applyCopperLook();
    cw.riseChest(si, big);
    toast(`🔴 ${x().real}`, 5000); speak(x().real, 0.95);
    saveGame();
  };
  cw.onChestUp = () => { sfxPop(); };
  cw.onHeroButton = () => {
    if (!$('#spell-modal').hidden || spellContext || !$('#dialog').hidden || !$('#news-modal').hidden) return;
    const c = copperState(), msg = c.made ? x().heroButtonSleep : x().heroButton;
    playTone(220, 0.12, 'square', 0.05); playTone(180, 0.15, 'square', 0.05, 0.12);
    toast(`🔴 ${msg}`, 6000); speak(msg, 0.95);
    newsTarget = { show: 'anvil', until: performance.now() + 4 * 60 * 1000 };
    updateMapPins();
  };
  if (scene3D.bosses) {
    scene3D.bosses.onWave = (b) => { animalVoice({ type: 'square', f0: 110, f1: 150, dur: 0.4, filter: 'lowpass', freq: 400, vol: 0.09 }); };
    scene3D.bosses.onSneeze = (b) => { sfxSneeze(); const p = b.mesh.position; copperFloat(p, lang === 'en' ? 'Atchoo!' : 'Atchoum !', '#a8e070', 4.2); speak(lang === 'en' ? 'Atchoo! The Moss Golem sneezes leaves!' : 'Atchoum ! Le golem de mousse éternue des feuilles !', 1.05); };
  }
}
// The golem's life on the screen: built, asleep by the anvil, following, run down.
function copperSync() {
  const cw = scene3D?.copper, c = game?.copper;
  if (!cw) return;
  if (copperGame !== game) {
    copperGame = game; copperP2Said = false; copperMsgs = [];
    cw.mode = 'hidden'; cw.golem.visible = false; cw.chest.visible = false; cw.cobj.active = false; cw.cobj.iconHolder.visible = false;
    cw.setRecipe(0);
    if (c?.made) {
      if (c.forever) { c.flat = false; c.asleep = false; cw.mode = 'follow'; cw.golem.visible = true; cw.catchUp(); }
      else { c.asleep = true; c.flat = false; cw.sleep(); }
    } else cw.setRecipe(c?.step ?? 0);
    applyCopperLook();
    if (c?.chestAt >= 0) cw.showChest(c.chestAt, c.locks > 1 || spotsOfPart(BUTTON_SPOTS[c.chestAt].part).filter((b) => !c.opened.includes(b.id)).length === 1);
  }
}
function anvilInteract() {
  const c = copperState(), x = ctx6(), cw = scene3D.copper;
  setupCopper(); copperSync();
  if (!c.made) { openRecipeWord(); return; }
  if (c.asleep) {
    spellContext = { type: 'copper', mode: 'wake', word: pickWord(levelAt(0)), tries: 0 };
    openSpellModal(`🤖 ${x.name}`, x.wakeInstr, '🤖');
    return;
  }
  const sp = nextSpot();
  const msg = sp ? x.bornHint(placeOf(sp)) : copperPartTwo() || copperDone2(c) ? x.happy : x.noPart2;
  cw.dance(); toast(`🤖 ${msg}`, 4000); speak(msg, 0.95);
}
function openRecipeWord() {
  const c = copperState(), x = ctx6();
  const w = x.recipe[c.step], word = copperWord({ fr: CTX.fr.recipe[c.step], en: CTX.en.recipe[c.step] });
  if (c.step === 0) word.say = `${x.recipeSay} ${word.say}`;
  spellContext = { type: 'copper', mode: 'recipe', step: c.step, word, tries: 0 };
  openSpellModal(`🔨 ${x.name}`, x.recipeInstr(w, c.step + 1), ['⚙️', '🪨', '🔥'][c.step]);
}
function copperTouch() {
  const c = copperState(), x = ctx6(), cw = scene3D.copper;
  if (cw.mode === 'sleep') { anvilInteract(); return; }
  if (c.flat) {
    spellContext = { type: 'copper', mode: 'wind', word: pickWord(levelAt(0)), tries: 0 };
    openSpellModal(`🔑 ${x.golem}`, x.windInstr, '🔑');
    return;
  }
  if (c.green && !c.shiny) {
    spellContext = { type: 'copper', mode: 'shine', word: copperWord(SHINE_WORD), tries: 0 };
    openSpellModal(`✨ ${x.golem}`, x.greenInstr, '✨');
    return;
  }
  // The gag: the robot dance.
  cw.dance(); sfxPop(); animalVoice({ type: 'square', f0: 600, f1: 900, dur: 0.25, filter: 'lowpass', freq: 2000, vol: 0.07 });
  const sp = nextSpot();
  const msg = sp ? `${x.happy} ${x.chestNext(placeOf(sp))}` : x.happy;
  toast(`🤖 ${msg}`, 3500); speak(msg, 1);
}
function secretChestInteract() {
  const c = copperState(), x = ctx6();
  if (c.chestAt < 0) return;
  spellContext = { type: 'copper', mode: 'chest', word: pickWord(levelAt(0)), tries: 0 };
  openSpellModal(`🎁 ${x.chestTitle}`, c.locks > 1 ? x.lockInstr(1) : c.bigOpen ? x.lockInstr(2) : x.chestInstr, '🗝️');
}
function copperLife(start = true) {
  const c = copperState();
  c.left = COPPER_LIFE; c.nextWind = COPPER_LIFE - WIND_EVERY; c.windT = 0; c.flat = false; c.asleep = false;
  if (start) scene3D.copper.wakeUp();
}
// After a word of the copper golem: the result shown in the spelling window.
function copperSpelled(ctx) {
  const c = copperState(), x = ctx6(), cw = scene3D.copper;
  if (ctx.mode === 'recipe') {
    c.step = Math.max(c.step, ctx.step + 1);
    cw.setRecipe(c.step);
    sfxClang();
    saveGame();
    if (c.step < 3) return { text: x.clang(ctx.step), say: x.clang(ctx.step), after: () => setTimeout(() => { if (!spellContext && $('#spell-modal').hidden) openRecipeWord(); }, 500) };
    c.made = true;
    copperLife(false);
    progress.stars += 5; game.starsEarned += 5;
    saveGame(); updateGameUI();
    return { text: x.clang(2), say: x.clang(2), after: () => { sfxWhoosh(); cw.assemble(); } };
  }
  if (ctx.mode === 'wake') { copperLife(); saveGame(); return { text: `🤖 ${x.woke}`, say: x.woke, after: () => sfxBong() }; }
  if (ctx.mode === 'wind') {
    c.flat = false;
    if (c.forever) c.windT = 0; else c.nextWind = Math.max(-1, c.left - WIND_EVERY);
    cw.setFlat(false); saveGame();
    return { text: `🔑 ${x.wound}`, say: x.wound, after: () => { playTone(900, 0.04, 'square', 0.05); playTone(900, 0.04, 'square', 0.05, 0.15); playTone(900, 0.04, 'square', 0.05, 0.3); } };
  }
  if (ctx.mode === 'shine') {
    c.shiny = true; c.green = false;
    applyCopperLook(); saveGame();
    return { text: `✨ ${x.shine}`, say: x.shine, after: () => { cw.shine(); sfxStar(); setTimeout(sfxStar, 200); launchConfetti(); const sp = nextSpot(); if (sp) queueCopperMsg(`📡 ${x.chestNext(placeOf(sp))}`); } };
  }
  // The secret chest: one word (or two for the big one).
  if (c.locks > 1) { c.locks--; c.bigOpen = true; saveGame(); sfxClang(); return { text: `🗝️ ${x.lockOne}`, say: x.lockOne, after: () => setTimeout(() => { if (!spellContext && $('#spell-modal').hidden) secretChestInteract(); }, 500) }; }
  const sp = BUTTON_SPOTS[c.chestAt], wasBig = !!c.bigOpen;
  if (!c.opened.includes(sp.id)) c.opened.push(sp.id);
  c.chestAt = -1; c.locks = 0; c.bigOpen = false;
  cw.openChest();
  defiEvent('chest');
  const opened = spotsOfPart(sp.part).filter((b) => c.opened.includes(b.id)).length, total = spotsOfPart(sp.part).length;
  let text, say, after;
  if (wasBig && sp.part === 1 && !c.goldKey) {
    c.goldKey = true;
    progress.stars += 10; game.starsEarned += 10;
    text = `🗝️ ${x.goldKey}`; say = x.goldKeySay;
    after = () => { sfxVictory(); launchConfetti(); cw.dance(); applyCopperLook(); if (copperPartTwo()) setTimeout(() => onCopperPartTwo(true), 800); };
  } else if (wasBig && sp.part === 2 && !c.costume) {
    c.costume = true; c.forever = true; c.flat = false;
    unlockCostume('copper');
    costumeState().current = 'copper'; applyCostume(); saveProgress();
    progress.stars += 10; game.starsEarned += 10;
    text = `🛡️ ${x.costume}`; say = x.costumeSay;
    after = () => { sfxVictory(); launchConfetti(); cw.dance(); cw.shine(); };
  } else {
    game.materials.diamond = (game.materials.diamond ?? 0) + 1;
    progress.stars += 5; game.starsEarned += 5;
    const got = `+5 ★ · 💎 ${materialName('diamond')}`;
    text = `🎁 ${x.chestOpen(opened, total)} ${x.reward(got)}`; say = `${x.chestOpen(opened, total)} ${x.reward(materialName('diamond'))} !`.replace(/\(\d\/\d\) /, '');
    const nx = nextSpot();
    after = () => { sfxCraft(); if (nx) queueCopperMsg(`📡 ${x.chestNext(placeOf(nx))}`); };
  }
  applyCopperLook(); saveGame(); updateGameUI(); renderCraftMenu();
  return { text, say, after };
}
function onCopperPartTwo(force = false) {
  const c = game?.copper;
  if (!c?.made || copperP2Said || !copperDone1(c) || (copperDone2(c) && !force)) return;
  copperP2Said = true;
  if (!c.shiny) c.green = true;
  applyCopperLook(); saveGame();
  queueCopperMsg(`🟢 ${ctx6().partTwo}`, undefined, 'pop');
}
function tickCopper(dt) {
  if (!game || !scene3D?.copper || scene3D.mode !== 'play' || document.body.dataset.screen !== 'game') return;
  if (game.story?.intro) partState('J6');
  setupCopper(); copperSync();
  const cw = scene3D.copper, c = copperState(), x = ctx6();
  applyCopperLook();
  if (copperPartTwo()) onCopperPartTwo();
  const busy = !$('#spell-modal').hidden || !$('#dialog').hidden || !$('#news-modal').hidden || !$('#journal-modal').hidden || !$('#collect-modal').hidden || !$('#travel-modal').hidden || $('#quest-modal')?.hidden === false || knocking || bossFight;
  // His clock: a word winds his key every minute; after 3 minutes he goes back to sleep.
  if (c.made && !busy && cw.mode === 'follow' && !c.flat) {
    if (c.forever) {
      c.windT += dt;
      if (c.windT >= WIND_EVERY * 1.5) { c.flat = true; cw.setFlat(true); queueCopperMsg(`🔑 ${x.flat}`); saveGame(); }
    } else {
      c.left -= dt;
      if (c.left <= 0) { c.asleep = true; cw.sleep(); queueCopperMsg(`💤 ${x.tired}`); saveGame(); }
      else if (c.left <= c.nextWind) { c.flat = true; cw.setFlat(true); queueCopperMsg(`🔑 ${x.flat}`); saveGame(); }
    }
  }
  if (copperMsgs.length && !busy && performance.now() - defiMsgAt > 3800) {
    defiMsgAt = performance.now();
    const m = copperMsgs.shift();
    toast(m.text, 4500);
    speak(m.say, 0.95);
    if (m.sfx === 'victory') { sfxVictory(); launchConfetti(); } else if (m.sfx === 'pop') sfxPop();
  }
}
// The journal: the two parts, the buttons found and where the next one is, written and read.
function copperLines() {
  const c = game?.copper, x = ctx6(), dx = dtx();
  if (!game || !scene3D?.copper) return [];
  if (!c?.made) return [`🤖 ${x.name} : ${x.notYet}`];
  const two = copperPartTwo();
  const p1 = copperDone1(c) ? dx.partDone : `: ${dx.partPlay}`;
  const p2 = !two ? `: ${dx.partLater}` : copperDone2(c) ? dx.partDone : `: ${dx.partOpen}`;
  const part = copperPart(c), spots = spotsOfPart(part), sp = nextSpot(c);
  return [`🤖 ${x.name} — ${dx.part(p1, p2)}`, x.lines(spots.filter((b) => c.opened.includes(b.id)).length, spots.length, sp ? placeOf(sp) : '')];
}
function copperSpeech() {
  const l = copperLines(), dx = dtx();
  if (!l.length) return '';
  if (l.length === 1) return l[0].replace(/^\S+ /, '');
  return `${dx.partSay(l[0].replace(/^\S+ /, '').replace('—', '.'))} ${l[1].replace(/^\S+ /, '').replace(/·/g, '.').replace(/(\d)\/(\d)/g, '$1 sur $2')}.`;
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
  spellContext = { type: 'boss', bossId: b.id, word: pickWord(levelAt(1), { programme: false }), tries: 0 };
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
    defiEvent('feed');
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
  defiEvent('pat');
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
      st.mimotWords[m.id] = pickWord(levelAt(1), { programme: false })?.word;
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
  const word = WORDS[lang].find((x) => x.word === w) ?? pickWord(levelAt(1), { programme: false });
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
      el('span', 'spell-word', open ? showWord(w.word) : '• • •'),
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

// Letters as the child sees them on the keyboard, in the boxes and on the writing pad:
// a capital for the first letter of the word, small letters after (é → É keeps its accent).
function showLetter(ch, i) {
  // With a pronoun written before the verb ("Nous" + sommes), the capital is on the pronoun.
  return i === 0 && !spellContext?.word?.prefix ? ch.toLocaleUpperCase(lang === 'fr' ? 'fr-FR' : 'en-GB') : ch.toLocaleLowerCase();
}
function showPrefix(p) { return p[0].toLocaleUpperCase('fr-FR') + p.slice(1); }
const showWord = (w) => [...w].map(showLetter).join('');
// The keyboard shows capitals for the first letter only, then small letters.
function refreshKeyCase() {
  const first = spellInput.value.length === 0 && !spellContext?.word?.prefix;
  spellKeyboard.classList.toggle('is-caps', first);
  for (const k of spellKeyboard.querySelectorAll('.key[data-letter]')) k.textContent = first ? showLetter(k.dataset.letter, 0) : k.dataset.letter;
}

function renderSpellTiles() {
  const target = spellContext?.word?.word ?? '';
  const length = Math.max(target.length, spellInput.value.length);
  const tiles = Array.from({ length }, (_, i) => {
    if (target[i] === ' ') return el('div', 'tile tile-space', '');
    const tile = el('div', 'tile', showLetter(spellInput.value[i] ?? '', i));
    if (i === spellInput.value.length && !isLocked) tile.classList.add('is-next');
    return tile;
  });
  const prefix = spellContext?.word?.prefix, suffix = spellContext?.word?.suffix;
  if (prefix) tiles.unshift(el('div', `tile-prefix${prefix.endsWith('’') ? ' is-elided' : ''}`, showPrefix(prefix)));
  if (suffix) tiles.push(el('div', `tile-suffix${suffix.startsWith('’') ? ' is-elided' : ''}`, suffix));
  spellTilesEl.replaceChildren(...tiles);
  refreshKeyCase();
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
  const prefix = spellContext?.word?.prefix, suffix = spellContext?.word?.suffix;
  const tiles = scoredTilesOnly(guess, target);
  if (prefix) tiles.unshift(el('div', `tile-prefix${prefix.endsWith('’') ? ' is-elided' : ''}`, showPrefix(prefix)));
  if (suffix) tiles.push(el('div', `tile-suffix${suffix.startsWith('’') ? ' is-elided' : ''}`, suffix));
  return tiles;
}
function scoredTilesOnly(guess, target) {
  return scoreGuess(guess, target).map(({ letter, state }, i) => el('div', `tile tile-${state}`, showLetter(letter, i)));
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
  const cardKey = word.id ?? word.word;
  const wasDifficult = !!progress.difficult[cardKey];

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
  const golden = !!spellContext.golden && firstTry;
  const earned = (copied ? 0 : baseEarned + streakBonus) * (golden ? 3 : 1);
  progress.stars += earned;
  game.starsEarned += earned;
  if (!copied) game.wordsSpelled += 1;
  if (firstTry) {
    if (!progress.mastered[cardKey]) setTimeout(() => toast(`🃏 ${t.newCard} : ${word.pic ?? WORD_EMOJI[lang]?.[wordStr] ?? ''} ${cardKey}`), 600);
    progress.mastered[cardKey] = true;
    delete progress.difficult[cardKey];
  }
  else if (!copied) { progress.difficult[cardKey] = (progress.difficult[cardKey] ?? 0) + 1; }

  sfxMine();
  if (streak >= 2) sfxStreak(streak);
  cheerSuccess({ firstTry, copied, earned, golden });
  if (!copied) {
    defiEvent('word');
    if (firstTry) defiEvent('firstTry');
    if (firstTry) flameFirstTry();
    if (firstTry && type !== 'flame') flameLog(1);
    if (scene3D?.horses?.riding) defiEvent('horseWord');
    if (firstTry) powersHardWord(word, wasDifficult, type);
  }
  if (type === 'mine') {
    defiEvent('mine');
    if (spellContext.material === 'chest') defiEvent('chest');
    if (spellContext.material === 'flower') defiEvent('flower');
  }

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
    const bravo = copied ? t.copiedWell : praise(firstTry);
    spellResultEl.replaceChildren(
      el('p', 'spell-success', bravo),
      ...(golden ? [el('p', 'spell-golden', goldTxt().won)] : []),
      el('p', 'spell-sentence', sentence),
      el('p', 'spell-stars', copied ? t.copyNoStars : `+${earned} ${earned === 1 ? t.star : t.stars}`),
      el('p', 'spell-material', lootText ? `🎁 ${t.treasureFound} ${lootText}` : `${MATERIAL_EMOJI[material] ?? ''} ${t.gotMaterial}${lang === 'fr' ? ' :' : ':'} ${materialName(material)}${amount > 1 ? ` ×${amount}` : ''}`),
    );
    if (streak >= 2) spellResultEl.appendChild(el('p', 'spell-streak-badge', lang === 'fr' ? `🔥 ${streak} d’affilée ! +${streakBonus} ★ bonus` : `🔥 ${streak} in a row! +${streakBonus} ★ bonus`));
    spellResultEl.hidden = false;
    // The praise is said too (a 5-year-old cannot read it yet), then the word's little sentence.
    speak(copied ? sentence : `${bravo} ${sentence}`, 0.9);
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
  } else if (type === 'flame') {
    const r = flameSpelled(spellContext.mode);
    spellResultEl.replaceChildren(el('p', 'spell-success', r.text), el('p', 'spell-stars', copied ? t.copyNoStars : `+${earned} ${earned === 1 ? t.star : t.stars}`));
    spellResultEl.hidden = false;
    speak(r.say, 0.95);
    spellContext.after = r.after;
  } else if (type === 'copper') {
    const r = copperSpelled(spellContext);
    spellResultEl.replaceChildren(el('p', 'spell-success', r.text), el('p', 'spell-stars', copied ? t.copyNoStars : `+${earned} ${earned === 1 ? t.star : t.stars}`));
    spellResultEl.hidden = false;
    speak(r.say, 0.95);
    spellContext.after = r.after;
  } else if (type === 'powers') {
    const r = powersSpelled(spellContext, copied);
    spellResultEl.replaceChildren(el('p', 'spell-success', r.text), el('p', 'spell-stars', copied ? t.copyNoStars : `+${earned} ${earned === 1 ? t.star : t.stars}`));
    spellResultEl.hidden = false;
    speak(r.say, 0.95);
    spellContext.after = r.after;
  } else if (type === 'album') {
    const r = albumStick(spellContext.cardId);
    spellResultEl.replaceChildren(el('p', 'spell-success', r.text), el('p', 'spell-stars', copied ? t.copyNoStars : `+${earned} ${earned === 1 ? t.star : t.stars}`));
    spellResultEl.hidden = false;
    speak(r.say, 0.95);
    spellContext.after = r.after;
  } else if (type === 'jumpchest') {
    const { got, say } = openJumpChest();
    spellResultEl.replaceChildren(
      el('p', 'spell-success', `🎉 ${dtx().chestOpen}`),
      el('p', 'spell-material', `🎁 ${got.join(' · ')}`),
      el('p', 'spell-stars', copied ? t.copyNoStars : `+${earned} ${earned === 1 ? t.star : t.stars}`),
    );
    spellResultEl.hidden = false;
    speak(say, 0.95);
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
      el('p', 'spell-sentence', word.sentence ?? buildSentence(wordStr, lang)),
      el('p', 'spell-stars', copied ? t.copyNoStars : `+${earned} ${earned === 1 ? t.star : t.stars}`),
    );
    spellResultEl.hidden = false;
    speak(word.sentence ?? buildSentence(wordStr, lang), 0.9);
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
      el('p', 'spell-success', praise(firstTry)),
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
  const wordStr = spellContext.word.id ?? spellContext.word.word;
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
    // A different little word of comfort each time, said aloud with the word again; the letters wobble.
    const oops = (OOPS[lang] ?? OOPS.fr)[Math.floor(Math.random() * 4)];
    spellResultEl.replaceChildren(el('p', 'spell-hint', `${oops} ${lang === 'fr' ? 'Écoute encore et réessaie.' : 'Listen again and try once more.'}`));
    spellResultEl.hidden = false;
    spellTilesEl.classList.remove('is-oops'); void spellTilesEl.offsetWidth; spellTilesEl.classList.add('is-oops');
    speak(`${oops} ${ctx.word.say ?? ctx.word.word}`, 0.85);
    setTimeout(() => {
      if (spellContext !== ctx) return;
      setSpellLocked(false);
      spellInput.value = '';
      spellTilesEl.classList.remove('is-oops');
      renderSpellTiles();
    }, 1400);
  } else {
    spellContext.copyMode = true;
    spellRevealEl.hidden = false;
    revealTiles.replaceChildren(...(spellContext.word.prefix ? [el('div', 'tile-prefix', showPrefix(spellContext.word.prefix))] : []), ...[...target].map((l, i) => el('div', 'tile tile-correct', showLetter(l, i))), ...(spellContext.word.suffix ? [el('div', 'tile-suffix', spellContext.word.suffix)] : []));
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
      const key = el('button', `key${/[aeiouyàâäéèêëîïôöùûü]/.test(letter) ? ' key-vowel' : ''}`, letter);
      key.type = 'button'; key.setAttribute('aria-label', letter); key.dataset.letter = letter;
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
  refreshKeyCase();
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
    beforePlay(() => newGame());
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
    const icon = obj.kind === 'npc' ? '💬' : obj.kind === 'bed' ? '🛏️' : obj.kind === 'circle' ? '🔮' : obj.kind === 'sign' || obj.kind === 'travel' ? '🪧' : obj.kind === 'mimot' ? '🐣' : obj.kind === 'book' ? '📖' : obj.kind === 'boss' ? '⚔️' : obj.kind === 'pet' ? '🐶' : obj.kind === 'portal' ? '🌀' : obj.kind === 'horse' ? '🐴' : obj.kind === 'golem' ? '👋' : obj.kind === 'jumpchest' ? '🎁' : obj.kind === 'cocotte' ? '🐔' : obj.kind === 'flame' ? '🔥' : obj.kind === 'albumstand' ? '📖' : obj.kind === 'powerstone' ? '⚡' : obj.kind === 'anvil' ? '🔨' : obj.kind === 'copper' ? '🤖' : obj.kind === 'secretchest' ? '🎁' : '⛏️';
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
  renderProgrammeCard();
  const nm = $('#dash-name');
  if (nm) {
    nm.value = childName();
    nm.placeholder = t.namePlaceholder;
    $('#dash-name-saved').hidden = true;
    nm.onchange = () => {
      setChildName(nm.value);
      nm.value = childName();
      const ok = $('#dash-name-saved'); ok.textContent = t.nameSaved; ok.hidden = false;
    };
  }
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
$('#continue-btn')?.addEventListener('click', () => { initAudio(); beforePlay(() => continueGame()); });


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
$('#album-btn')?.addEventListener('click', () => { if (document.body.dataset.screen === 'game' && game && scene3D?.albumStand) openCollect(); else openPage('album'); });
$('#collect-close')?.addEventListener('click', closeCollect);
$('#collect-say')?.addEventListener('click', () => { const a = albumState(); if (!a) return; const cs = albumCards(albumPage), h = cs.filter((c) => ['stuck', 'gold'].includes(cardState(a, c.id))).length; speak(atx().pageSay(atx().pageNames[albumPage], h, cs.length), 0.95); });
$('#collect-words')?.addEventListener('click', () => { closeCollect(); openPage('album'); });
$('#wardrobe-btn')?.addEventListener('click', () => openPage('wardrobe'));
function openJournal() { renderJournal(); renderToday(); $('#journal-modal').hidden = false; const say = todaySpeech(); if (say) speak(say, 0.95); }
$('#news-btn')?.addEventListener('click', openJournal);
$('#defis-btn')?.addEventListener('click', openJournal);
$('#journal-close')?.addEventListener('click', () => { $('#journal-modal').hidden = true; stopSpeaking(); });
$('#news-later')?.addEventListener('click', () => closeNews());
$('#news-show')?.addEventListener('click', () => { const id = $('#news-modal').dataset.id; closeNews(); showMeNews(id); });
$('#news-repeat')?.addEventListener('click', () => { const n = NEWS.find((x) => x.id === $('#news-modal').dataset.id); if (n) speak(newsSpeech(n), 0.95); });
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
    g.fillText(showLetter(expected, spellInput.value.length), w / 2, h * 0.78);
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
    hwFeedback(t.hwTryAgain(showLetter(res.letter, spellInput.value.length)), 'wrong');
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
