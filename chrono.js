// Chronos et records (J9). Session 1: at the start of the lava course, a big stopwatch on a chequered
// arch. A word wakes it up (wow: it rings, fireworks, Fer raises the finish flag), then each run is
// "3, 2, 1…", a starting word (nobody moves while it is spelled), and the clock runs until the finish
// pillar, where Fer holds the chequered flag (and waves it so hard that he spins round and falls on his
// bottom: "Bong!"). A word wins the medal (bronze, silver or gold, from the time). A see-through ghost
// replays your best run. The records board (3 best times per course) has Cocotte on top.
// Session 2 (part 2 of J9): the new power "voler" (the jump button climbs), and a timed flight race
// through 8 golden rings round the village, from the take-off pad next to the power stone, against
// your own ghost and Alaric's (a fixed time, a bit slower each time he wins). One word per ring kept on
// landing (as in J5), a medal and a record; beating Alaric's ghost gives the champion's outfit.
// Merged vertex-coloured meshes; the lava pieces are hidden when far away.
import * as THREE from 'three';
import { box, merge, MAT, colorize } from './mine.js';
import { buildIronGolem } from './golem.js';
import { LAVA } from './regions.js';

export const GATE = { x: 29, z: -37.9 }; // the chequered arch over the start of the lava course
export const START = { x: 29, z: -37.1 }; // where the hero waits for "3, 2, 1…"
export const BOARD = { x: 24.4, z: -36.9 }; // the records board (Cocotte perches on it)
export const FER_AT = { x: 41.4, z: -56.6 }; // Fer at the finish, on the edge of the lava, flag in hand
export const PAD = { x: 8.5, z: 31 }; // the take-off pad of the flight race, next to the power stone
// The 8 rings of the flight race, round the village (absolute heights: about 6 m above the ground).
export const FLY_RINGS = [
  { x: 12, z: 23.5, y: 7.2 },
  { x: 20, z: 13.5, y: 7.5 },
  { x: 24, z: 0, y: 8 },
  { x: 18, z: -16, y: 8.5 },
  { x: 2, z: -24, y: 8 },
  { x: -16, z: -19, y: 7.5 },
  { x: -24, z: -2, y: 7 },
  { x: -16, z: 18, y: 6.8 },
];
export const FLY_RING_R = 2.0;
export const MEDALS = { lava: { gold: 20, silver: 32 }, fly: { gold: 38, silver: 58 } };
export const MEDALS1 = 3; // session 1: three medals on the lava course
export const ALARIC_TIME = 48; // Alaric's ghost (seconds), a bit slower after each defeat of the child
export const ALARIC_SLOWER = 7;
export const FLY_RACE_TIME = 100; // the flight power of the race (seconds, + 8 per ring)
export const GHOST_STEP = 0.1; // the ghost: one position every 0.1 s of the run
export const MEDAL_COLORS = { gold: 0xffcf3a, silver: 0xdfe4ec, bronze: 0xc8783a };

const fmt = (t, lang) => (lang === 'en' ? t.toFixed(1) : t.toFixed(1).replace('.', ','));
export const fmtTime = (t, lang = 'fr') => `${fmt(t, lang)} s`;

export const CHX = {
  fr: {
    name: 'Chronos et records', gate: '⏱️ Le grand chrono', board: '🏆 Records', pad: '🕊️ Course en vol',
    medalName: { gold: 'or', silver: 'argent', bronze: 'bronze' },
    medalEmoji: { gold: '🥇', silver: '🥈', bronze: '🥉' },
    wakeTitle: 'Le grand chrono',
    wakeInstr: 'Le grand chrono dort. Épelle ce mot pour le réveiller !',
    wakeLead: 'Le grand chrono dort. Épelle le mot pour le réveiller !',
    wake: 'Driiing ! Mesdames et messieurs, bienvenue au grand parcours de lave chronométré ! Là-bas, Fer tient le drapeau d’arrivée. Attention, prêts…',
    count: 'Trois… deux… un…',
    startTitle: 'Le mot de départ',
    startInstr: 'Le mot de départ ! Épelle-le, et c’est parti !',
    startLead: 'Le mot de départ !',
    go: 'Partez !',
    goSay: 'Partez ! Et c’est parti ! Saute de pilier en pilier jusqu’au drapeau de Fer !',
    goFly: 'Partez ! Appuie sur sauter pour monter ! Passe dans les huit anneaux dorés !',
    ghostToo: 'Regarde : ton fantôme court avec toi !',
    alaricToo: 'Et le fantôme d’Alaric fait la course aussi !',
    tv: ['Et c’est le saut ! Incroyable !', 'Quelle vitesse ! Le public est debout !', 'Plus qu’un drapeau ! Allez, allez !'],
    fall: 'Oh ! Plouf dans la lave… Fer se cache les yeux ! Mais on repart !',
    finish: (s) => `Et c’est l’arrivée ! ${s} secondes ! Fer agite le drapeau… oh là là, il tourne… Bong ! Il est tombé sur les fesses !`,
    medalTitle: (m) => `La médaille d’${m === 'gold' ? 'or' : m === 'silver' ? 'argent' : 'bronze'}`,
    medalInstr: (m) => `Épelle ce mot pour gagner ta médaille d’${m === 'gold' ? 'or' : m === 'silver' ? 'argent' : 'bronze'} !`,
    medalLead: (m) => `Épelle le mot pour gagner ta médaille d’${m === 'gold' ? 'or' : m === 'silver' ? 'argent' : 'bronze'} !`,
    medalGot: (e, m, t) => `${e} Médaille d’${m} ! ${t}`,
    medalSay: (m, s) => `Médaille d’${m} ! ${s} secondes !`,
    record: 'Nouveau record !',
    ghostBeat: 'Tu as battu ton fantôme !',
    next: { gold: '', silver: (s) => `Pour l’or : moins de ${s} secondes !`, bronze: (s) => `Pour l’argent : moins de ${s} secondes !` },
    back: 'Retour au départ ! Touche le grand chrono pour une autre course.',
    done1: 'Trois médailles ! Tu es un champion du parcours de lave ! À ton prochain retour, une course en vol autour du village !',
    running: 'Cours ! Le chrono tourne !',
    abandon: 'Course arrêtée ! Touche le grand chrono pour recommencer.',
    boardSay: (l, f) => `Les records ! Parcours de lave : ${l}. Course en vol : ${f}.`,
    none: 'pas encore de record',
    secs: (s) => `${s} secondes`,
    // Session 2
    partTwo: 'Nouveau pouvoir : voler ! La course en vol est ouverte, sur la piste d’envol à côté de la pierre des pouvoirs. Bats le fantôme d’Alaric !',
    padLater: 'Ici, c’est la piste d’envol de la course en vol ! Elle ouvre à ton prochain retour. D’abord, gagne trois médailles sur le parcours de lave : la flèche te montre le grand chrono.',
    padSoon: 'La piste d’envol ouvre à ton prochain retour ! Tu as tes trois médailles : bravo !',
    ring: (k) => `⭕ Anneau ${k} sur 8 !`,
    ringTv: { 4: 'La moitié ! Quel pilote !', 7: 'Plus qu’un anneau ! Allez !' },
    flyFinish: (s) => `Et c’est l’arrivée en vol ! ${s} secondes ! Maintenant, atterris !`,
    landInstr: (k) => `Bel atterrissage ! Épelle ce mot pour garder l’anneau ${k}.`,
    ringKept: (n) => `⭕ ${n} anneau${n > 1 ? 'x' : ''} gardé${n > 1 ? 's' : ''} sur 8 !`,
    alaricWin: 'Tu as battu le fantôme d’Alaric ! Tu gagnes la tenue de champion !',
    alaricLose: 'Le fantôme d’Alaric est arrivé avant toi… Mais il a mangé trop de gâteau : la prochaine fois, il sera plus lent ! Hi hi !',
    alaricAgain: 'Tu as encore battu le fantôme d’Alaric ! Quel champion !',
    flyOver: (n) => `Fini, le pouvoir voler ! Tu as passé ${n} anneau${n > 1 ? 'x' : ''} sur 8. Retourne à la piste d’envol pour réessayer !`,
    flyBack: 'Retourne à la piste d’envol pour une autre course !',
    // Journal
    notYet: 'touche le grand chrono, au départ du parcours de lave !',
    lines1: (n, b) => `🔥 Parcours de lave : ${Math.min(n, MEDALS1)}/${MEDALS1} médailles · record : ${b}`,
    lines2: (k, b, a) => `🕊️ Course en vol : ${k}/8 anneaux gardés · record : ${b} · fantôme d’Alaric : ${a ? 'battu ✓' : 'pas encore battu'}`,
  },
  en: {
    name: 'Stopwatches and records', gate: '⏱️ The big stopwatch', board: '🏆 Records', pad: '🕊️ Flying race',
    medalName: { gold: 'gold', silver: 'silver', bronze: 'bronze' },
    medalEmoji: { gold: '🥇', silver: '🥈', bronze: '🥉' },
    wakeTitle: 'The big stopwatch',
    wakeInstr: 'The big stopwatch is asleep. Spell this word to wake it up!',
    wakeLead: 'The big stopwatch is asleep. Spell the word to wake it up!',
    wake: 'Ring-ring! Ladies and gentlemen, welcome to the great timed lava course! Over there, Iron holds the finish flag. Ready, steady…',
    count: 'Three… two… one…',
    startTitle: 'The starting word',
    startInstr: 'The starting word! Spell it, and off you go!',
    startLead: 'The starting word!',
    go: 'Go!',
    goSay: 'Go! And they’re off! Jump from pillar to pillar to Iron’s flag!',
    goFly: 'Go! Press jump to fly up! Go through the eight golden rings!',
    ghostToo: 'Look: your ghost is running with you!',
    alaricToo: 'And Alaric’s ghost is racing too!',
    tv: ['What a jump! Incredible!', 'What speed! The crowd is on its feet!', 'Just one flag to go! Come on!'],
    fall: 'Oh! Splash in the lava… Iron covers his eyes! But off we go again!',
    finish: (s) => `And it’s the finish! ${s} seconds! Iron waves the flag… oh dear, he’s spinning… Bong! He fell on his bottom!`,
    medalTitle: (m) => `The ${m === 'gold' ? 'gold' : m === 'silver' ? 'silver' : 'bronze'} medal`,
    medalInstr: (m) => `Spell this word to win your ${m === 'gold' ? 'gold' : m === 'silver' ? 'silver' : 'bronze'} medal!`,
    medalLead: (m) => `Spell the word to win your ${m === 'gold' ? 'gold' : m === 'silver' ? 'silver' : 'bronze'} medal!`,
    medalGot: (e, m, t) => `${e} ${m[0].toUpperCase()}${m.slice(1)} medal! ${t}`,
    medalSay: (m, s) => `${m[0].toUpperCase()}${m.slice(1)} medal! ${s} seconds!`,
    record: 'New record!',
    ghostBeat: 'You beat your ghost!',
    next: { gold: '', silver: (s) => `For gold: under ${s} seconds!`, bronze: (s) => `For silver: under ${s} seconds!` },
    back: 'Back to the start! Touch the big stopwatch for another race.',
    done1: 'Three medals! You are a lava course champion! Next time you come back, a flying race round the village!',
    running: 'Run! The clock is ticking!',
    abandon: 'Race stopped! Touch the big stopwatch to start again.',
    boardSay: (l, f) => `The records! Lava course: ${l}. Flying race: ${f}.`,
    none: 'no record yet',
    secs: (s) => `${s} seconds`,
    partTwo: 'New power: flying! The flying race is open, on the take-off pad next to the power stone. Beat Alaric’s ghost!',
    padLater: 'This is the take-off pad of the flying race! It opens next time you come back. First, win three medals on the lava course: the arrow shows you the big stopwatch.',
    padSoon: 'The take-off pad opens next time you come back! You have your three medals: well done!',
    ring: (k) => `⭕ Ring ${k} of 8!`,
    ringTv: { 4: 'Halfway! What a pilot!', 7: 'Just one ring to go! Come on!' },
    flyFinish: (s) => `And it’s the flying finish! ${s} seconds! Now, land!`,
    landInstr: (k) => `Nice landing! Spell this word to keep ring ${k}.`,
    ringKept: (n) => `⭕ ${n} ring${n > 1 ? 's' : ''} kept out of 8!`,
    alaricWin: 'You beat Alaric’s ghost! You win the champion’s outfit!',
    alaricLose: 'Alaric’s ghost got there first… But he ate too much cake: next time, he will be slower! Hee hee!',
    alaricAgain: 'You beat Alaric’s ghost again! What a champion!',
    flyOver: (n) => `The flying power is over! You went through ${n} ring${n > 1 ? 's' : ''} of 8. Go back to the take-off pad to try again!`,
    flyBack: 'Go back to the take-off pad for another race!',
    notYet: 'touch the big stopwatch, at the start of the lava course!',
    lines1: (n, b) => `🔥 Lava course: ${Math.min(n, MEDALS1)}/${MEDALS1} medals · record: ${b}`,
    lines2: (k, b, a) => `🕊️ Flying race: ${k}/8 rings kept · record: ${b} · Alaric’s ghost: ${a ? 'beaten ✓' : 'not beaten yet'}`,
  },
};

// The medal for a time on a course.
export function medalFor(course, t) {
  const m = MEDALS[course];
  return t <= m.gold ? 'gold' : t <= m.silver ? 'silver' : 'bronze';
}
// The 3 best times: [{ t, m }], fastest first.
export function addTop(top, t, m) {
  return [...(top ?? []), { t: Math.round(t * 10) / 10, m }].sort((a, b) => a.t - b.t).slice(0, 3);
}

const cyl = (rt, rb, h, c, x, y, z, seg = 10, rx = 0) => { const g = new THREE.CylinderGeometry(rt, rb, h, seg).toNonIndexed(); if (rx) g.rotateX(rx); g.translate(x, y, z); return colorize(g, c); };

// A see-through runner: the child's ghost (pale blue) or Alaric's (purple, pointed hat, white beard).
function buildGhost(alaric) {
  const body = alaric ? 0x8a5ad8 : 0x9ad8ff, skin = alaric ? 0xe8d8ff : 0xd8f2ff;
  const geos = [
    box(0.5, 0.62, 0.3, body, 0, 0.98, 0), box(0.42, 0.42, 0.42, skin, 0, 1.52, 0),
    box(0.18, 0.62, 0.2, body, -0.13, 0.36, 0), box(0.18, 0.62, 0.2, body, 0.13, 0.36, 0),
    box(0.14, 0.56, 0.16, body, -0.34, 1.0, 0, 0, 0, 0.15), box(0.14, 0.56, 0.16, body, 0.34, 1.0, 0, 0, 0, -0.15),
    box(0.08, 0.08, 0.03, 0x24304a, -0.1, 1.56, 0.22), box(0.08, 0.08, 0.03, 0x24304a, 0.1, 1.56, 0.22),
  ];
  if (alaric) {
    geos.push(box(0.62, 0.7, 0.4, body, 0, 0.62, 0), cyl(0.02, 0.34, 0.62, 0x5a2ab8, 0, 2.02, 0, 8), box(0.62, 0.05, 0.62, 0x5a2ab8, 0, 1.73, 0));
    geos.push(box(0.3, 0.32, 0.1, 0xffffff, 0, 1.3, 0.23)); // the beard
  }
  const m = new THREE.Mesh(merge(geos), MAT({ transparent: true, opacity: 0.5, depthWrite: false, emissive: alaric ? 0x2a1050 : 0x103850, roughness: 0.4 }));
  m.userData.dynamic = true;
  m.visible = false;
  m.renderOrder = 2;
  return m;
}

// The big stopwatch on the chequered arch (one mesh; the hand is a second one).
function buildGate() {
  const geos = [];
  for (const sx of [-2.2, 2.2]) for (let k = 0; k < 7; k++) geos.push(box(0.3, 0.5, 0.3, k % 2 ? 0x1e1e22 : 0xf4f4f4, sx, 0.25 + k * 0.5, 0));
  for (let k = 0; k < 16; k++) geos.push(box(0.3, 0.3, 0.32, (k % 2) ? 0x1e1e22 : 0xf4f4f4, -2.25 + k * 0.3, 3.62, 0), box(0.3, 0.3, 0.32, (k % 2) ? 0xf4f4f4 : 0x1e1e22, -2.25 + k * 0.3, 3.32, 0));
  // The stopwatch: red rim, white face, a crown and a button on top.
  geos.push(cyl(0.95, 0.95, 0.22, 0xd8302a, 0, 4.75, 0, 20, Math.PI / 2), cyl(0.8, 0.8, 0.24, 0xffffff, 0, 4.75, 0.01, 20, Math.PI / 2));
  geos.push(box(0.26, 0.24, 0.26, 0xd8302a, 0, 5.82, 0), box(0.5, 0.12, 0.3, 0xa8a8b0, 0, 5.98, 0));
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; geos.push(box(i % 3 ? 0.05 : 0.09, i % 3 ? 0.12 : 0.2, 0.04, 0x222222, Math.sin(a) * 0.66, 4.75 + Math.cos(a) * 0.66, 0.15, 0, 0, -a)); }
  const g = new THREE.Group();
  const m = new THREE.Mesh(merge(geos), MAT({ roughness: 0.6 }));
  m.castShadow = true;
  g.add(m);
  const handGeo = box(0.07, 0.6, 0.04, 0xd8302a, 0, 0.28, 0);
  const hand = new THREE.Mesh(handGeo, MAT({ roughness: 0.5 }));
  hand.position.set(0, 4.75, 0.17);
  g.add(hand);
  g.userData = { dynamic: true, hand };
  return g;
}

// The records board: posts, a wooden board and a canvas face, a golden cup on top.
function buildBoard() {
  const g = new THREE.Group();
  g.userData.dynamic = true;
  const wood = new THREE.Mesh(merge([
    box(0.16, 2.2, 0.16, 0x6a4428, -1.0, 1.1, 0), box(0.16, 2.2, 0.16, 0x6a4428, 1.0, 1.1, 0),
    box(2.3, 1.7, 0.12, 0x8a5a32, 0, 1.75, 0), box(2.42, 0.12, 0.2, 0x5a3a20, 0, 2.66, 0),
    cyl(0.12, 0.2, 0.08, 0xd8a020, 0, 2.76, 0, 10), cyl(0.05, 0.05, 0.16, 0xd8a020, 0, 2.86, 0, 8), cyl(0.24, 0.1, 0.3, 0xffcf3a, 0, 3.08, 0, 12),
  ]), MAT({ roughness: 0.8 }));
  wood.castShadow = true;
  g.add(wood);
  const c = document.createElement('canvas');
  c.width = 256; c.height = 192;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.575), new THREE.MeshBasicMaterial({ map: tex }));
  face.position.set(0, 1.75, 0.07);
  g.add(face);
  g.userData.canvas = c; g.userData.tex = tex;
  return g;
}

// The take-off pad: a round wooden platform with a chequered line and a windsock.
function buildPad(y) {
  const geos = [cyl(1.7, 1.8, 0.24, 0x8a5a32, 0, y + 0.12, 0, 16)];
  for (let k = 0; k < 8; k++) geos.push(box(0.4, 0.03, 0.4, k % 2 ? 0x1e1e22 : 0xf4f4f4, -1.4 + k * 0.4, y + 0.255, 0));
  geos.push(box(0.1, 3.2, 0.1, 0x6a6e76, 1.9, y + 1.6, -0.6));
  for (let k = 0; k < 4; k++) geos.push(cyl(0.22 - k * 0.035, 0.25 - k * 0.035, 0.32, k % 2 ? 0xffffff : 0xf07a2a, 1.9, y + 3.0, -0.6 + 0.2 + k * 0.32, 8, Math.PI / 2));
  const m = new THREE.Mesh(merge(geos), MAT({ roughness: 0.8 }));
  m.castShadow = true; m.receiveShadow = true; m.userData.dynamic = true;
  return m;
}

// Little white wings on the hero's back while flying.
function buildWings() {
  const g = new THREE.Group();
  g.userData.dynamic = true;
  const mk = (side) => {
    const geos = [];
    for (let k = 0; k < 4; k++) geos.push(box(0.9 - k * 0.16, 0.16, 0.05, k % 2 ? 0xf4f8ff : 0xffffff, side * (0.45 - k * 0.08), -k * 0.15, 0));
    const m = new THREE.Mesh(merge(geos), MAT({ roughness: 0.5, emissive: 0x303848 }));
    m.userData.dynamic = true;
    return m;
  };
  const l = new THREE.Group(), r = new THREE.Group();
  l.add(mk(-1)); r.add(mk(1));
  g.add(l, r);
  g.userData.l = l; g.userData.r = r;
  g.visible = false;
  return g;
}

export class ChronoCourse {
  constructor(scene3D) {
    const s = this.s = scene3D;
    // The lava pieces (gate, board, Fer at the finish): one group, hidden when far away.
    this.lava = new THREE.Group();
    this.lava.userData.dynamic = true;
    s.scene.add(this.lava);
    const gy = s.groundAt(GATE.x, GATE.z);
    this.gate = buildGate();
    this.gate.position.set(GATE.x, gy, GATE.z);
    this.lava.add(this.gate);
    for (const sx of [-2.2, 2.2]) s.collidables.push({ x: GATE.x + sx, z: GATE.z, r: 0.3 });
    this.gobj = s._addInteractable({ kind: 'chrono', worldPos: new THREE.Vector3(START.x, gy, START.z), iconY: 2.6, reach: 2.8, hitRadius: 1.2 });
    const by = s.groundAt(BOARD.x, BOARD.z);
    this.board = buildBoard();
    this.board.position.set(BOARD.x, by, BOARD.z);
    this.board.rotation.y = 0.35;
    this.lava.add(this.board);
    for (const sx of [-1.0, 1.0]) s.collidables.push({ x: BOARD.x + sx * Math.cos(0.35), z: BOARD.z - sx * Math.sin(0.35), r: 0.25 });
    this.bobj = s._addInteractable({ kind: 'records', worldPos: new THREE.Vector3(BOARD.x, by, BOARD.z + 0.4), iconY: 3.6, reach: 2.8, hitRadius: 1.2 });
    // Fer at the finish, with the chequered flag in his right hand.
    this.fer = buildIronGolem();
    this.fer.position.set(FER_AT.x, s.groundAt(FER_AT.x, FER_AT.z), FER_AT.z);
    this.fer.rotation.y = -Math.PI / 2;
    const flag = [box(0.06, 1.6, 0.06, 0x5a3a20, 0, -2.3, 0)];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) flag.push(box(0.03, 0.22, 0.22, (i + j) % 2 ? 0x1e1e22 : 0xf4f4f4, 0, -2.95 + j * 0.22, 0.14 + i * 0.22));
    this.flag = new THREE.Mesh(merge(flag), MAT({ roughness: 0.7 }));
    this.flag.userData.dynamic = true;
    this.fer.userData.parts.arms[1].add(this.flag);
    this.lava.add(this.fer);
    s.collidables.push({ x: FER_AT.x, z: FER_AT.z, r: 0.9 });
    this.ferMode = 'idle'; this.ferT = 0;
    // The ghosts (yours and Alaric's).
    this.ghost = buildGhost(false);
    this.alaric = buildGhost(true);
    s.scene.add(this.ghost, this.alaric);
    // The flight race: the take-off pad and the 8 rings.
    const py = s.groundAt(PAD.x, PAD.z);
    this.padY = py + 0.26;
    this.pad = buildPad(py);
    this.pad.position.set(PAD.x, 0, PAD.z);
    s.scene.add(this.pad);
    s.walkways.push({ circle: true, x: PAD.x, z: PAD.z, r: 1.75, y: () => this.padY });
    this.pobj = s._addInteractable({ kind: 'flypad', worldPos: new THREE.Vector3(PAD.x, this.padY, PAD.z), iconY: 2.4, reach: 2.6, hitRadius: 1.3 });
    this.rings = new THREE.InstancedMesh(new THREE.TorusGeometry(FLY_RING_R, 0.16, 8, 28), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x6a5010, emissiveIntensity: 0.6, roughness: 0.4, metalness: 0.4 }), FLY_RINGS.length);
    this.rings.userData.dynamic = true;
    this.rings.frustumCulled = false;
    this.rings.visible = false;
    s.scene.add(this.rings);
    this.ringsOn = false; this.kept = [];
    this.wings = buildWings();
    s.scene.add(this.wings);
    this.medal = new THREE.Mesh(merge([cyl(0.13, 0.13, 0.04, 0xffffff, 0, 0, 0, 14, Math.PI / 2), box(0.05, 0.22, 0.02, 0xd8302a, -0.08, 0.16, -0.02, 0, 0, 0.5), box(0.05, 0.22, 0.02, 0x2a5ad8, 0.08, 0.16, -0.02, 0, 0, -0.5)]), new THREE.MeshStandardMaterial({ vertexColors: true, color: 0xffcf3a, metalness: 0.5, roughness: 0.35, emissive: 0x302000 }));
    this.medal.userData.dynamic = true;
    this.medal.visible = false;
    s.scene.add(this.medal);
    this.medalKind = null;
    this.race = null; // { course, t, rec, next, ghost, alaric, done }
    this.t = 0; this.wakeT = -1; this.flap = 0; this.lastTenth = -1;
    this._path = new THREE.CatmullRomCurve3([new THREE.Vector3(PAD.x, this.padY + 1, PAD.z), ...FLY_RINGS.map((r) => new THREE.Vector3(r.x, r.y, r.z))]);
    this._d = new THREE.Object3D();
    this._layoutRings();
    this.drawBoard({ lava: [], fly: [] });
  }
  _layoutRings() {
    const d = this._d, gold = new THREE.Color(0xffd34a), green = new THREE.Color(0x5ae07a), pale = new THREE.Color(0xfff2c0), hot = new THREE.Color(0xff9a2a);
    FLY_RINGS.forEach((r, i) => {
      const prev = i ? FLY_RINGS[i - 1] : PAD;
      d.position.set(r.x, r.y, r.z); d.rotation.set(0, Math.atan2(r.x - prev.x, r.z - prev.z), 0); d.scale.setScalar(1); d.updateMatrix();
      this.rings.setMatrixAt(i, d.matrix);
      const race = this.race?.course === 'fly' ? this.race : null;
      const col = race ? (i < race.next ? green : i === race.next ? hot : gold) : this.kept.includes(i) ? green : pale;
      this.rings.setColorAt(i, col);
    });
    this.rings.instanceMatrix.needsUpdate = true;
    if (this.rings.instanceColor) this.rings.instanceColor.needsUpdate = true;
    this.rings.visible = this.ringsOn;
  }
  setRings(on, kept = []) {
    if (on === this.ringsOn && kept.length === this.kept.length) return;
    this.ringsOn = on; this.kept = [...kept];
    this._layoutRings();
  }
  setMedal(kind) {
    this.medalKind = kind;
    this.medal.visible = !!kind;
    if (kind) this.medal.material.color.setHex(MEDAL_COLORS[kind]);
  }
  // Wow: the stopwatch rings (it shakes and its hand spins), fireworks over the arch, Fer raises his flag.
  wake() {
    this.wakeT = 0;
    const p = this.gate.position.clone(); p.y += 4.8;
    for (const [k, c] of ['#ffd34a', '#ff5a5a', '#7ae8ff', '#ffffff', '#5ae07a', '#ff7ab0'].entries()) setTimeout(() => this.s.particleBurst(p.clone().add(new THREE.Vector3((k % 3 - 1) * 1.6, (k % 2) * 0.8, 0)), c, 30), k * 220);
    this.cheer(2.5);
  }
  cheer(sec = 2) { this.ferMode = 'cheer'; this.ferT = sec; }
  // The gag at the finish: Fer waves the flag so hard that he spins round and falls on his bottom.
  spinFall() { this.ferMode = 'spin'; this.ferT = 0; }
  coverEyes() { this.ferMode = 'cover'; this.ferT = 1.8; }
  // A run starts: the clock, the recording, the ghosts.
  startRace(course, { ghost = null, alaricTime = 0 } = {}) {
    this.race = { course, t: 0, rec: [], recT: 0, next: 0, ghost, alaricTime, cp: null, done: false };
    this.ghost.visible = !!ghost?.length;
    this.alaric.visible = course === 'fly' && alaricTime > 0;
    this.lastTenth = -1;
    if (course === 'fly') this._layoutRings();
  }
  // The run is over (finished or given up): the time and the recording.
  stopRace() {
    const r = this.race;
    this.race = null;
    this.ghost.visible = false; this.alaric.visible = false;
    this._layoutRings();
    return r;
  }
  _ghostAt(rec, t) {
    const i = Math.min(rec.length - 1, Math.floor(t / GHOST_STEP)), j = Math.min(rec.length - 1, i + 1), k = Math.min(1, (t - i * GHOST_STEP) / GHOST_STEP);
    const a = rec[i], b = rec[j];
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, a[3]];
  }
  drawBoard(top) {
    const c = this.board.userData.canvas, g = c.getContext('2d');
    g.fillStyle = '#4a2e18'; g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = '#d8a020'; g.lineWidth = 6; g.strokeRect(4, 4, c.width - 8, c.height - 8);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#ffcf3a'; g.font = '900 30px system-ui, sans-serif';
    g.fillText('RECORDS', 128, 26);
    const col = { gold: '#ffcf3a', silver: '#dfe4ec', bronze: '#d8884a' };
    [['LAVE', top.lava ?? [], 20], ['VOL', top.fly ?? [], 140]].forEach(([title, list, x]) => {
      g.textAlign = 'left';
      g.fillStyle = '#ffffff'; g.font = '800 22px system-ui, sans-serif';
      g.fillText(title, x + 4, 62);
      for (let i = 0; i < 3; i++) {
        const e = list[i], y = 96 + i * 32;
        g.fillStyle = e ? col[e.m] : 'rgba(255,255,255,0.25)';
        g.beginPath(); g.arc(x + 12, y, 9, 0, Math.PI * 2); g.fill();
        g.fillStyle = e ? '#ffffff' : 'rgba(255,255,255,0.35)'; g.font = '700 21px system-ui, sans-serif';
        g.fillText(e ? fmtTime(e.t) : '—', x + 28, y + 1);
      }
    });
    this.board.userData.tex.needsUpdate = true;
  }
  update(dt) {
    this.t += dt;
    const s = this.s, p = s.player.position, t = this.t;
    const near = Math.hypot(p.x - (LAVA.x0 + LAVA.x1) / 2, p.z - (LAVA.z0 + LAVA.z1) / 2) < 75;
    this.lava.visible = near || !!this.race;
    this.pad.visible = Math.hypot(p.x - PAD.x, p.z - PAD.z) < 80;
    // The stopwatch: shakes while ringing (wake), its hand spins during a run.
    const hand = this.gate.userData.hand;
    if (this.wakeT >= 0) {
      this.wakeT += dt;
      this.gate.children[0].rotation.z = Math.sin(this.wakeT * 50) * 0.03 * Math.max(0, 1 - this.wakeT / 2);
      hand.rotation.z -= dt * 14;
      if (this.wakeT > 2.2) { this.wakeT = -1; this.gate.children[0].rotation.z = 0; }
    } else if (this.race) hand.rotation.z = -(this.race.t / 60) * Math.PI * 2 * 4; // one turn every 15 s
    // A run: the clock (dt is 0 while a word is spelled), the recording, the ghosts.
    const r = this.race;
    if (r && !r.done) {
      r.t += dt;
      r.recT -= dt;
      if (r.recT <= 0 && r.rec.length < 1500) { r.recT += GHOST_STEP; r.rec.push([+p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2), +s.player.rotation.y.toFixed(2)]); }
      const tenth = Math.floor(r.t * 10);
      if (tenth !== this.lastTenth) { this.lastTenth = tenth; this.onTime?.(r.t); }
      if (r.ghost?.length) {
        const [x, y, z, ry] = this._ghostAt(r.ghost, r.t);
        this.ghost.position.set(x, y + Math.sin(t * 6) * 0.04, z); this.ghost.rotation.y = ry;
        this.ghost.visible = r.t < r.ghost.length * GHOST_STEP + 1.5;
      }
      if (this.alaric.visible) {
        const u = Math.min(1, r.t / r.alaricTime);
        const q = this._path.getPointAt(u), q2 = this._path.getPointAt(Math.min(1, u + 0.01));
        this.alaric.position.set(q.x, q.y - 0.6 + Math.sin(t * 3) * 0.15, q.z);
        if (u < 1) this.alaric.rotation.y = Math.atan2(q2.x - q.x, q2.z - q.z);
        if (u >= 1 && !r.alaricIn) { r.alaricIn = true; this.onAlaricIn?.(); }
      }
      // The rings of the flight race, in order (a gentle pull towards the next one when close).
      if (r.course === 'fly' && r.next < FLY_RINGS.length && !s.inputLocked) {
        const ring = FLY_RINGS[r.next];
        const dh = Math.hypot(ring.x - p.x, ring.z - p.z), dy = ring.y - (p.y + 0.8);
        if (s.power === 'fly' && dh < 7 && Math.abs(dy) < 6) {
          const k = Math.min(1, dt * 1.6);
          p.x += (ring.x - p.x) * k * 0.5; p.z += (ring.z - p.z) * k * 0.5; p.y += dy * k * 0.8;
        }
        if (dh < FLY_RING_R + 0.7 && Math.abs(dy) < 2.4) {
          for (const c of ['#ffd34a', '#ffffff', '#5ae07a']) s.particleBurst(new THREE.Vector3(ring.x, ring.y, ring.z), c, 22);
          const i = r.next;
          r.next++;
          this._layoutRings();
          this.onRing?.(i);
        }
      }
    }
    // Fer: the flag sways; cheers; the spinning fall (gag); hides his eyes after a fall in the lava.
    const parts = this.fer.userData.parts;
    this.ferT -= dt;
    let armR = -2.9 + Math.sin(t * 2) * 0.12, armL = 0, rigY = 0, tip = 0, lift = 0;
    if (this.ferMode === 'cheer') {
      armR = -3.0 + Math.sin(t * 12) * 0.5; armL = -2.6 + Math.sin(t * 12 + 1) * 0.4; lift = Math.abs(Math.sin(t * 8)) * 0.25;
      if (this.ferT <= 0) this.ferMode = 'idle';
    } else if (this.ferMode === 'spin') {
      const k = -this.ferT; // time since the start (ferT counts down from 0)
      armR = -3.0 + Math.sin(k * 16) * 0.6;
      if (k < 1.2) rigY = k * k * 9;
      else if (k < 1.5) { rigY = 1.2 * 1.2 * 9; tip = (k - 1.2) / 0.3; }
      else if (k < 3.3) { rigY = 1.2 * 1.2 * 9; tip = 1; armL = -1.2; if (!this.bonged) { this.bonged = true; s.particleBurst(this.fer.position.clone().add(new THREE.Vector3(0, 0.3, 0)), '#d8d0c0', 20); s.screenShake?.(0.08); this.onBong?.(); } }
      else if (k < 4) { rigY = 1.2 * 1.2 * 9; tip = 1 - (k - 3.3) / 0.7; }
      else { this.ferMode = 'idle'; this.bonged = false; }
    } else if (this.ferMode === 'cover') {
      armR = -2.2; armL = -2.2;
      if (this.ferT <= 0) this.ferMode = 'idle';
    }
    parts.arms[1].rotation.x = armR; parts.arms[0].rotation.x = armL;
    parts.rig.rotation.y = rigY;
    parts.rig.rotation.x = -tip * 1.15;
    parts.rig.position.y = lift - tip * 0.75;
    parts.legs[0].rotation.x = parts.legs[1].rotation.x = -tip * 1.4;
    // The wings while flying (they flap on each jump), the best medal on the hero's chest.
    const sc = s.player.scale.y, ry = s.player.rotation.y;
    const flying = s.power === 'fly';
    this.wings.visible = flying;
    if (flying) {
      this.flap = Math.max(0, this.flap - dt * 3);
      const a = 0.35 + Math.sin(t * (s.onGround ? 3 : 9)) * 0.25 + this.flap * 0.9;
      this.wings.position.set(p.x - Math.sin(ry) * 0.22 * sc, p.y + 1.25 * sc, p.z - Math.cos(ry) * 0.22 * sc);
      this.wings.rotation.set(0, ry, 0);
      this.wings.scale.setScalar(sc);
      this.wings.userData.l.rotation.set(0, a, 0.2); this.wings.userData.r.rotation.set(0, -a, -0.2);
    }
    if (this.medal.visible) {
      this.medal.position.set(p.x + Math.sin(ry) * 0.2 * sc, p.y + 1.02 * sc, p.z + Math.cos(ry) * 0.2 * sc);
      this.medal.rotation.set(0, ry, 0);
      this.medal.scale.setScalar(sc);
      this.medal.visible = !s.worlds?.current;
    } else if (this.medalKind && !s.worlds?.current) this.medal.visible = true;
  }
}
