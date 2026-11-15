import { LANGUAGES, LEVELS, WORDS, UI, buildSentence } from './language-engine.js';
import { GameScene } from './scene.js';

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
  { id: 'house', emoji: '🏠', name: { en: 'House', fr: 'Maison' }, parts: ['wood', 'stone', 'wood'] },
  { id: 'boat', emoji: '⛵', name: { en: 'Boat', fr: 'Bateau' }, parts: ['wood', 'wood', 'cloth'] },
  { id: 'pickaxe_diamond', emoji: '💎', name: { en: 'Diamond pickaxe', fr: 'Pioche en diamant' }, parts: ['diamond', 'diamond', 'wood'], requires: ['pickaxe', 'hammer'] },
  { id: 'sword_diamond', emoji: '💎', name: { en: 'Diamond sword', fr: 'Épée en diamant' }, parts: ['diamond', 'diamond', 'iron'], requires: ['sword', 'hammer'] },
  { id: 'axe_obsidian', emoji: '🟪', name: { en: 'Obsidian axe', fr: 'Hache en obsidienne' }, parts: ['obsidian', 'obsidian', 'diamond'], requires: ['axe', 'hammer'] },
];
const itemName = (item) => item.name[lang] ?? item.name.en;
const craftable = (id) => CRAFTABLES.find((c) => c.id === id);

// Crafted objects the hero can carry and use with the action button.
const HOLDABLE_IDS = ['pickaxe', 'axe', 'scythe', 'hammer', 'sword', 'torch', 'wand', 'potion', 'bread'];
// Best owned version of a tool (diamond beats iron, obsidian beats diamond).
function bestVersion(base) {
  const owned = (game?.crafted ?? []).filter((id) => id === base || id.startsWith(`${base}_`));
  const rank = (id) => (id.endsWith('_obsidian') ? 2 : id.endsWith('_diamond') ? 1 : 0);
  return owned.sort((a, b) => rank(b) - rank(a))[0] ?? null;
}
const ownsTool = (base) => !!bestVersion(base);

const MATERIAL_EMOJI = {
  iron: '⛓️', wood: '🪵', fire: '🔥', stone: '🪨', wheat: '🌾',
  water: '💧', cloth: '🧵', flower: '🌸', crystal: '🔮', diamond: '💎', obsidian: '🟪',
};

// Each building yields its own materials. Spelling words come from the level word list,
// never from the material names.
const MATERIAL_FR = {
  iron: 'fer', wood: 'bois', fire: 'feu', stone: 'pierre', wheat: 'blé',
  water: 'eau', cloth: 'toile', flower: 'fleur', crystal: 'cristal', diamond: 'diamant', obsidian: 'obsidienne',
};
const TOOL_NAMES = { pickaxe: { en: 'a pickaxe', fr: 'une pioche' }, axe: { en: 'an axe', fr: 'une hache' }, scythe: { en: 'a scythe', fr: 'une faux' } };
const HOUSE_MATERIALS = {
  forge: ['iron', 'fire', 'stone'],
  shop: ['cloth', 'crystal', 'iron'],
  tavern: ['wheat', 'water', 'fire'],
  tower: ['crystal', 'flower', 'water'],
  cottage: ['wood', 'flower', 'wheat'],
  guild: ['stone', 'wood', 'cloth'],
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
    return { ...defaultProgress(), ...saved };
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
function recordAttempt(w, guess, ok, tries) {
  const s = wordStat(w);
  if (ok) { s.correct += 1; if (tries === 1) s.firstTry += 1; }
  else { s.wrong += 1; s.misspellings = [guess, ...s.misspellings].slice(0, 5); }
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
function levelFor(obj) {
  if (obj.kind !== 'node') return 'easy';
  if (obj.material === 'diamond' || obj.material === 'obsidian') return 'challenge';
  return 'medium';
}

function wordsForLevel(levelId) {
  return WORDS[lang].filter((w) => w.level === levelId);
}

// Words are served from a shuffled queue: tricky words first, then unmastered, then the rest,
// so a child meets every word of the level before any repeats.
let wordQueues = {};
function pickWord(levelId = 'easy') {
  const key = `${lang}:${levelId}`;
  if (!wordQueues[key]?.length) {
    const words = shuffle(wordsForLevel(levelId));
    const rank = (w) => (progress.difficult[w.word] ? 0 : progress.mastered[w.word] ? 2 : 1);
    wordQueues[key] = words.sort((a, b) => rank(a) - rank(b));
  }
  return wordQueues[key].shift();
}

// Prefer a material that the remaining recipes still need, among those this building offers.
function pickMaterial(houseType) {
  const offered = HOUSE_MATERIALS[houseType] ?? ['wood', 'stone', 'iron'];
  const need = {};
  for (const item of CRAFTABLES) {
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

function playTone(freq, duration, type = 'sine', volume = 0.15, delay = 0) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type; osc.frequency.value = freq;
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

function applyUIText() {
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n;
    if (t[key]) node.textContent = t[key];
  });
  const langBtn = $('#lang-btn');
  if (langBtn) { langBtn.textContent = LANGUAGES[lang].flag; langBtn.setAttribute('aria-label', LANGUAGES[lang].label); }
  document.title = t.title;
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
  if (name === 'game') {
    if (!scene3D) init3DScene();
    requestAnimationFrame(() => scene3D?.resize());
  }
  if (name === 'menu') renderMenu();
  if (name === 'trophy') renderTrophy();
  if (name === 'parents') renderDashboard();
  window.scrollTo(0, 0);
}

function init3DScene() {
  const container = $('#canvas-container');
  if (!container) return;
  scene3D = new GameScene(container);
  scene3D.onInteract = () => tryInteract();
  scene3D.onInteractObject = (obj) => interactWith(obj);
  refreshSpots();
}

// Each house spot shows (and gives) a material picked for the current recipes.
function refreshSpots() {
  for (const obj of scene3D?.interactables ?? []) {
    const id = obj.kind === 'house' ? pickMaterial(obj.houseType) : obj.material;
    scene3D.setSpotMaterial(obj, id, spotLabel(obj, id));
  }
}

// Text shown under each floating material: its name, plus the tool needed out in the world.
function spotLabel(obj, id) {
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
  });
  for (const id of game.crafted) if (!HOLDABLE_IDS.includes(id.split('_')[0])) scene3D?.spawnTrophy(id);
  game.equipped = null;
  if (s.equipped && game.crafted.includes(s.equipped)) equipItem(s.equipped);
  refreshSpots();
  updateGameUI();
  renderCraftMenu();
}

/* ===== GAME STATE ===== */

function newGame(levelId = 'mixed', { keepSave = false } = {}) {
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
  speak(t.welcome, 0.9);
}

function updateGameUI() {
  renderEquipBar();
  $('#total-stars').textContent = progress.stars;
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
  if (!game || !$('#spell-modal').hidden || !obj.active) return;
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
  const stat = wordStat(word);
  stat.seen += 1;
  stat.lastSeen = Date.now();
  saveProgress();
  $('#spell-title').textContent = `${emoji} ${t.mineTitle}`;
  $('#spell-instruction').textContent = t.mineInstruction;
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
  speak(word.word, 0.9);
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
  container.replaceChildren(...CRAFTABLES.map((item) => {
    const already = game?.crafted.includes(item.id);
    const reqOk = (item.requires ?? []).every((r) => game?.crafted.includes(r));
    const canCraft = !already && reqOk && hasParts(item);
    const node = el('div', `craft-card ${canCraft ? 'is-available' : ''} ${already ? 'is-done' : ''} ${reqOk ? '' : 'is-locked'}`);
    const partsDisplay = item.parts.map((p) => `${MATERIAL_EMOJI[p] ?? ''} ${materialName(p)}`).join(' + ');
    node.append(el('span', 'craft-emoji', item.emoji), el('span', 'craft-name', itemName(item)), el('span', 'craft-parts', partsDisplay));
    if (item.requires) {
      node.append(el('span', 'craft-requires', `${t.requires} ${item.requires.map((r) => craftable(r)?.emoji ?? r).join(' + ')}`));
    }
    node.append(el('span', 'craft-status', already ? '✓' : canCraft ? '→' : ''));
    if (canCraft) {
      node.addEventListener('click', () => beginCraft(item));
      node.classList.add('is-clickable');
    }
    return node;
  }));
}

function beginCraft(item) {
  initAudio();
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
  game.crafted.push(item.id);
  const base = item.id.split('_')[0];
  if (HOLDABLE_IDS.includes(base)) { game.equipped = null; equipItem(bestVersion(base)); }
  else scene3D?.spawnTrophy(item.id);
  saveGame();
  progress.victories += 1;
  const earned = 10;
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
  if (game.crafted.length >= CRAFTABLES.length) {
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
  recordAttempt(spellContext.word, guess, guess === target, spellContext.tries);
  if (guess === target) handleSpellSuccess();
  else handleSpellFailure(target);
  saveProgress();
}

function handleSpellSuccess() {
  const { word, tries, type } = spellContext;
  const copied = !!spellContext.copyMode;
  const firstTry = tries === 1 && !copied;
  const wordStr = word.word;

  if (copied) {
    streak = 0;
  } else if (firstTry) {
    streak += 1;
    if (streak > (progress.bestStreak || 0)) progress.bestStreak = streak;
  } else { streak = 0; }

  const streakBonus = streak >= 2 ? Math.min(streak - 1, 3) : 0;
  const baseEarned = firstTry ? FIRST_TRY_STARS : RETRY_STARS;
  // Copying the shown word gives the material but no stars.
  const earned = copied ? 0 : baseEarned + streakBonus;
  progress.stars += earned;
  game.starsEarned += earned;
  if (!copied) game.wordsSpelled += 1;
  if (firstTry) { progress.mastered[wordStr] = true; delete progress.difficult[wordStr]; }
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
    const material = spellContext.material;
    const obj = spellContext.mineObj;
    // Diamond and obsidian tools gather twice as much.
    const tool = obj?.requires ? bestVersion(obj.requires) : null;
    const amount = tool && tool.includes('_') ? 2 : 1;
    game.materials[material] = (game.materials[material] ?? 0) + amount;
    if (obj?.kind === 'node') scene3D?.depleteNode(obj);
    else if (obj) { const next = pickMaterial(obj.houseType); scene3D?.setSpotMaterial(obj, next, spotLabel(obj, next)); }
    saveGame();
    const sentence = buildSentence(wordStr, lang);
    spellResultEl.replaceChildren(
      el('p', 'spell-success', copied ? t.copiedWell : firstTry ? t.perfectSpelling : t.youGotIt),
      el('p', 'spell-sentence', sentence),
      el('p', 'spell-stars', copied ? t.copyNoStars : `+${earned} ${earned === 1 ? t.star : t.stars}`),
      el('p', 'spell-material', `${MATERIAL_EMOJI[material] ?? ''} ${t.gotMaterial}: ${materialName(material)}${amount > 1 ? ` ×${amount}` : ''}`),
    );
    if (streak >= 2) spellResultEl.appendChild(el('p', 'spell-streak-badge', `${streak}x ${t.streakLabel}! +${streakBonus} ${t.bonusStars}`));
    spellResultEl.hidden = false;
    speak(sentence, 0.9);
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
  $('#spell-modal').hidden = true;
  spellResultEl.hidden = true;
  spellRevealEl.hidden = true;
  isLocked = false;

  if (!ctx) return;

  if (ctx.type === 'mine') {
    spellContext = null;
    updateGameUI();
    renderCraftMenu();
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
      cont.textContent = `${t.continueGame} · ${s.crafted.length}/${CRAFTABLES.length} ${t.objectsCrafted}`;
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
  const max = spellContext?.word?.word.length ?? MAX_GUESS_LENGTH;
  if (isLocked || spellInput.value.length >= max) return;
  spellInput.value += letter; sfxType(); renderSpellTiles();
}
function deleteLetter() {
  if (isLocked) return; spellInput.value = spellInput.value.slice(0, -1); sfxType(); renderSpellTiles();
}

function buildSpellKeyboard() {
  const rows = LANGUAGES[lang].keyRows.map((letters) => {
    const row = el('div', 'key-row');
    for (const letter of letters) {
      const key = el('button', 'key', letter.toUpperCase());
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
    newGame();
  });
  $('#reset-pos-btn')?.addEventListener('click', () => scene3D?.resetPosition());
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
  $('#spell-listen-btn').addEventListener('click', () => { if (spellContext) speak(spellContext.word.word, 0.9); });
  $('#spell-slow-btn').addEventListener('click', () => { if (spellContext) speak(spellContext.word.word, 0.6); });
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
      if (isLocked) onSpellContinue(); else checkSpelling();
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
  if (obj) {
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
  showScreen('menu');
  updateInteractHint();
}

init();


/* ===== PARENTS' DASHBOARD ===== */

let dashResetArmed = false;

function dashMessage(text) {
  const msg = $('#dash-msg');
  msg.textContent = text;
  msg.hidden = !text;
}

function renderDashboard() {
  const stats = Object.values(progress.wordStats ?? {});
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
  for (const w of WORDS[lang]) {
    if (level !== 'all' && w.level !== level) continue;
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
    td.colSpan = 8;
    tr.append(td);
    table.replaceChildren(tr);
    return;
  }
  const head = el('tr');
  for (const k of ['colWord', 'colLevel', 'colSeen', 'colRight', 'colWrong', 'colRate', 'colMistakes', 'colLast']) head.append(el('th', '', t[k]));
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
    );
    tbody.append(tr);
  }
  table.replaceChildren(thead, tbody);
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
    levelSel.replaceChildren(...[['all', t.filterAll], ...['easy', 'medium', 'challenge'].map((l) => [l, t.levelNames?.[l] ?? l])].map(([v, label]) => {
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

function useEquipped() {
  if (!game?.equipped || !scene3D) return;
  if (!$('#spell-modal').hidden) return;
  initAudio();
  if (scene3D.useItem(game.equipped)) {
    sfxMine();
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
  if (event.key === 'f' || event.key === 'F' || event.key === 'e' || event.key === 'E') useEquipped();
});
$('#use-btn')?.addEventListener('click', useEquipped);
$('#jump-btn')?.addEventListener('pointerdown', (e) => { e.preventDefault(); scene3D?.jump(); });
$('#continue-btn')?.addEventListener('click', continueGame);
