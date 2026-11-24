// Daily challenges (J2): three morning challenges (part 1) and three evening challenges (part 2),
// picked each day among the ones the child can do with what they own. When the three are done, a
// jumping chest appears in front of the cottage: it hops away three times before letting itself be
// caught, then a word opens it and it bursts into confetti.
import * as THREE from 'three';
import { buildChest } from './icons.js';

// Each challenge: id, goal (how many times the event), the event that counts, the text, and when it
// can be drawn (`can(ctx)`, ctx = { pet, food, horse, cocotte, powers }). `word: true` = the word challenge
// that every set contains (at least 7 words per session together with the chest and flash words).
export const DEFIS = {
  morning: [
    { id: 'first5', word: true, goal: 5, ev: 'firstTry', emoji: '✨', text: { fr: 'Épelle 5 mots du premier coup', en: 'Spell 5 words right first time' } },
    { id: 'sheep', goal: 1, ev: 'sheep', emoji: '🐑', text: { fr: 'Fais un câlin à un mouton', en: 'Give a sheep a hug' } },
    { id: 'jump', goal: 10, ev: 'jump', emoji: '🦘', text: { fr: 'Saute 10 fois comme un kangourou', en: 'Jump 10 times like a kangaroo' } },
    { id: 'mine', goal: 4, ev: 'mine', emoji: '⛏️', text: { fr: 'Ramasse 4 matériaux', en: 'Collect 4 materials' } },
    { id: 'mage', goal: 1, ev: 'mage', emoji: '🧙', text: { fr: 'Va faire coucou à Alaric', en: 'Go and wave hello to Alaric' } },
    { id: 'feed', goal: 1, ev: 'feed', emoji: '🍖', text: { fr: 'Nourris ton chien', en: 'Feed your dog' }, can: (c) => c.pet && c.food },
    { id: 'pat', goal: 1, ev: 'pat', emoji: '🐶', text: { fr: 'Fais un câlin à ton chien', en: 'Give your dog a cuddle' }, can: (c) => c.pet },
    { id: 'power', goal: 1, ev: 'power', emoji: '⚡', text: { fr: 'Gagne un pouvoir avec un mot difficile', en: 'Win a power with a hard word' }, can: (c) => c.powers },
  ],
  evening: [
    { id: 'words7', word: true, goal: 7, ev: 'word', emoji: '📝', text: { fr: 'Épelle 7 mots', en: 'Spell 7 words' } },
    { id: 'golem', goal: 1, ev: 'golem', emoji: '🤖', text: { fr: 'Dis bonjour à Fer', en: 'Say hello to Iron' } },
    { id: 'chests', goal: 2, ev: 'chest', emoji: '🎁', text: { fr: 'Trouve 2 coffres', en: 'Find 2 chests' } },
    { id: 'flower', goal: 1, ev: 'flower', emoji: '🌺', text: { fr: 'Cueille une fleur', en: 'Pick a flower' } },
    { id: 'cocotte', goal: 1, ev: 'cocotte', emoji: '🐔', text: { fr: 'Trouve Cocotte la poule', en: 'Find Cocotte the hen' }, can: (c) => c.cocotte },
    { id: 'horseWord', goal: 1, ev: 'horseWord', emoji: '🐴', text: { fr: 'Épelle un mot sur ton cheval', en: 'Spell a word on your horse' }, can: (c) => c.horse },
    { id: 'patE', goal: 1, ev: 'pat', emoji: '🐶', text: { fr: 'Fais un câlin à ton chien', en: 'Give your dog a cuddle' }, can: (c) => c.pet },
  ],
};

function hash(str) {
  let h = 2166136261;
  for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
// The day's three challenges for a part ('morning' | 'evening'): the word one + two others.
export function drawDefis(part, date, ctx) {
  const pool = DEFIS[part];
  const word = pool.find((d) => d.word);
  const others = pool.filter((d) => !d.word && (!d.can || d.can(ctx)));
  let seed = hash(`${date}:${part}`);
  const pick = [];
  while (pick.length < 2 && others.length) {
    seed = Math.imul(seed ^ (seed >>> 15), 2246822507) >>> 0;
    pick.push(others.splice(seed % others.length, 1)[0]);
  }
  return [word, ...pick].map((d) => d.id);
}
export const defiById = (id) => DEFIS.morning.find((d) => d.id === id) ?? DEFIS.evening.find((d) => d.id === id);

// Texts of the challenges, the chest and the part system (fr / en).
export const DTX = {
  fr: {
    morningTitle: 'Défis du matin', eveningTitle: 'Défis du soir',
    announce: (title, list) => `${title} : ${list.join('. ')}.`,
    done: (txt, k) => `✅ Défi réussi : ${txt} ! (${k}/3)`,
    doneSay: (txt) => `Défi réussi : ${txt} !`,
    allDone: '🎁 Les trois défis sont faits ! Un coffre sauteur t’attend devant ta chaumière !',
    allDoneEvening: '🎁 Bravo ! Un gros coffre sauteur t’attend devant ta chaumière !',
    welcome: '🎁 Un coffre sauteur t’attend devant ta chaumière !',
    hop: ['Hihi ! Attrape-moi !', 'Boing ! Pas par là !', 'Oups… hic ! J’ai le hoquet !'],
    caught: 'Bon d’accord… tu m’as attrapé ! Épelle un mot pour m’ouvrir !',
    chestTitle: 'Le coffre sauteur', chestInstruction: 'Épelle ce mot pour ouvrir le coffre !',
    chestOpen: 'Le coffre éclate en confettis !',
    costume: (n) => `Un nouveau costume : ${n} ! Essaie-le dans l’armoire 👕.`,
    part: (p1, p2) => `Partie 1 ${p1} · Partie 2 ${p2}`,
    partDone: '✓', partPlay: 'en cours', partLater: 'à ton prochain retour !', partOpen: 'c’est parti !',
    partSay: (s) => s.replace(/·/g, '.').replace('✓', 'réussie'),
    partTwoOpen: '🌙 Les défis du soir sont arrivés !',
    cocotteTitle: 'Où est Cocotte ?', cocotteFound: 'Tu as trouvé Cocotte aujourd’hui ! 🪶',
    cocotteSay: '🐔 Cot cot codêêt ! Cocotte s’envole… et te laisse une plume dorée ! 🪶',
    feathers: (n) => `Plumes dorées : ${n} 🪶`,
    hugSheep: '🐑 Bêê ! Le mouton adore les câlins !',
    riddle: 'La devinette d’Alaric', answer: 'La réponse ?',
    todayTitle: '🎯 Aujourd’hui',
  },
  en: {
    morningTitle: 'Morning challenges', eveningTitle: 'Evening challenges',
    announce: (title, list) => `${title}: ${list.join('. ')}.`,
    done: (txt, k) => `✅ Challenge done: ${txt}! (${k}/3)`,
    doneSay: (txt) => `Challenge done: ${txt}!`,
    allDone: '🎁 All three challenges done! A jumping chest is waiting in front of your cottage!',
    allDoneEvening: '🎁 Well done! A big jumping chest is waiting in front of your cottage!',
    welcome: '🎁 A jumping chest is waiting in front of your cottage!',
    hop: ['Hee hee! Catch me!', 'Boing! Not that way!', 'Oops… hic! I have hiccups!'],
    caught: 'All right… you caught me! Spell a word to open me!',
    chestTitle: 'The jumping chest', chestInstruction: 'Spell this word to open the chest!',
    chestOpen: 'The chest bursts into confetti!',
    costume: (n) => `A new outfit: ${n}! Try it on in the wardrobe 👕.`,
    part: (p1, p2) => `Part 1 ${p1} · Part 2 ${p2}`,
    partDone: '✓', partPlay: 'in progress', partLater: 'next time you come back!', partOpen: 'here we go!',
    partSay: (s) => s.replace(/·/g, '.').replace('✓', 'done'),
    partTwoOpen: '🌙 The evening challenges are here!',
    cocotteTitle: 'Where is Cocotte?', cocotteFound: 'You found Cocotte today! 🪶',
    cocotteSay: '🐔 Cluck cluck! Cocotte flies away… and leaves you a golden feather! 🪶',
    feathers: (n) => `Golden feathers: ${n} 🪶`,
    hugSheep: '🐑 Baa! The sheep loves hugs!',
    riddle: 'Alaric’s riddle', answer: 'The answer?',
    todayTitle: '🎯 Today',
  },
};

// The jumping chest: the wooden chest of the world, which hops away (spinning, lid clapping like
// a laughing mouth) three times before it lets itself be caught.
export const HOME_CHEST = { x: 2.6, z: 18.4 };
export class JumpChest {
  constructor(scene3D) {
    this.s = scene3D;
    this.mesh = buildChest();
    this.mesh.userData.dynamic = true;
    this.mesh.visible = false;
    scene3D.scene.add(this.mesh);
    this.obj = scene3D._addInteractable({ kind: 'jumpchest', worldPos: new THREE.Vector3(HOME_CHEST.x, scene3D.groundAt(HOME_CHEST.x, HOME_CHEST.z), HOME_CHEST.z), iconY: 1.5, reach: 2.2, hitRadius: 1.1 });
    this.obj.active = false;
    this.obj.iconHolder.visible = false;
    this.which = null; this.hopsLeft = 0; this.hop = null; this.t = 0; this.openT = -1; this.cool = 0;
  }
  get out() { return !!this.which; }
  spawn(which, big = false) {
    const s = this.s;
    this.which = which; this.hopsLeft = 3; this.hop = null; this.openT = -1; this.cool = 0;
    const p = this._free(HOME_CHEST.x, HOME_CHEST.z) ?? HOME_CHEST;
    this.mesh.scale.setScalar(big ? 1.5 : 1.05);
    this.mesh.position.set(p.x, s.groundAt(p.x, p.z), p.z);
    this.mesh.rotation.set(0, Math.PI * 0.1, 0);
    this.mesh.userData.lid.rotation.x = 0;
    this.mesh.visible = true;
    this.obj.active = true;
    this.obj.iconHolder.visible = true;
    this._sync();
    s.particleBurst(this.mesh.position.clone().setY(this.mesh.position.y + 0.8), '#ffe08a', 24);
  }
  // A free spot near (x, z), not in a wall or a house, not too far from the cottage door.
  _free(x, z) {
    const s = this.s;
    const ok = (a, b) => ![0, 0.7, -0.7].some((d) => s._checkCollision(a + d, b) || s._checkCollision(a, b + d)) && !s._insideAnyHouse?.(a, b, 0.9) && Math.hypot(a - 0, b - 18) < 9;
    if (ok(x, z)) return { x, z };
    for (let r = 1; r < 6; r += 0.8) for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (ok(px, pz)) return { x: px, z: pz }; }
    return null;
  }
  // Hop away from the hero. Returns the hop number (1..3), or 0 when it cannot hop any more.
  hopAway() {
    if (!this.out || this.hop || this.hopsLeft <= 0 || this.openT >= 0) return 0;
    const s = this.s, m = this.mesh, p = s.player.position;
    let ux = m.position.x - p.x, uz = m.position.z - p.z;
    const d = Math.hypot(ux, uz) || 1; ux /= d; uz /= d;
    let to = null;
    for (const turn of [0, 0.6, -0.6, 1.2, -1.2, 2, -2, Math.PI]) {
      const c = Math.cos(turn), sn = Math.sin(turn), vx = ux * c - uz * sn, vz = ux * sn + uz * c;
      const tx = m.position.x + vx * 4.2, tz = m.position.z + vz * 4.2;
      const f = this._free(tx, tz);
      if (f && Math.hypot(f.x - p.x, f.z - p.z) > 2.8) { to = f; break; }
    }
    to ??= this._free(HOME_CHEST.x + (Math.random() - 0.5) * 6, HOME_CHEST.z + 2) ?? HOME_CHEST;
    this.hop = { from: m.position.clone(), to: new THREE.Vector3(to.x, s.groundAt(to.x, to.z), to.z), t: 0, dur: 0.75 };
    this.hopsLeft -= 1;
    return 3 - this.hopsLeft;
  }
  // Caught and opened with a word: the lid flies open, confetti, then it is gone.
  open() {
    this.openT = 0;
    this.obj.active = false;
    this.obj.iconHolder.visible = false;
    const p = this.mesh.position.clone(); p.y += 1;
    for (const [k, c] of ['#ff5a5a', '#ffd34a', '#5ad06a', '#5ab4ff', '#d86aff', '#ffffff'].entries()) setTimeout(() => this.s.particleBurst(p, c, 22), k * 90);
  }
  _sync() {
    const o = this.obj, m = this.mesh;
    o.worldPos.copy(m.position);
    o.iconHolder.position.copy(m.position).add(new THREE.Vector3(0, o.iconY, 0));
    o.hit.position.copy(m.position).add(new THREE.Vector3(0, 0.6, 0));
  }
  update(dt) {
    if (!this.out) return;
    const m = this.mesh, lid = m.userData.lid;
    this.t += dt;
    if (this.openT >= 0) {
      this.openT += dt;
      lid.rotation.x = -2.2 * Math.min(1, this.openT / 0.25);
      if (this.openT > 1.2) m.scale.multiplyScalar(Math.max(0, 1 - dt * 6));
      if (this.openT > 1.8) { m.visible = false; this.which = null; }
      return;
    }
    if (this.hop) {
      const h = this.hop;
      h.t += dt;
      const k = Math.min(1, h.t / h.dur);
      m.position.lerpVectors(h.from, h.to, k);
      m.position.y += Math.sin(k * Math.PI) * 1.8;
      m.rotation.y += dt * 9;
      lid.rotation.x = -Math.abs(Math.sin(h.t * 22)) * 0.9; // clap clap: it laughs
      if (k >= 1) { this.hop = null; lid.rotation.x = 0; m.rotation.z = 0; this.onLand?.(this.hopsLeft); }
    } else if (this.hopsLeft > 0) {
      // Waiting: it giggles (little wobble, lid peeking).
      m.rotation.z = Math.sin(this.t * 9) * 0.05;
      lid.rotation.x = Math.sin(this.t * 3) > 0.7 ? -0.35 : 0;
      // The hero comes near: off it goes (never while a word is being spelled).
      this.cool -= dt;
      const p = this.s.player.position;
      if (this.cool <= 0 && !this.s.inputLocked && Math.hypot(p.x - m.position.x, p.z - m.position.z) < 2.6) {
        const n = this.hopAway();
        if (n) { this.cool = 1.2; this.onHop?.(n); }
      }
    } else {
      // Caught: it sits still, a bit dizzy, and blinks its lid.
      m.rotation.z = Math.sin(this.t * 2) * 0.08;
      lid.rotation.x = Math.sin(this.t * 1.5) > 0.9 ? -0.25 : 0;
    }
    this._sync();
  }
}
