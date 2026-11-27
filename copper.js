// The little copper golem (J6). Session 1: at the anvil next to the forge, the recipe "fer + pierre +
// feu" (three words) builds Boulon, a little copper golem who follows the hero for 3 minutes (his
// wind-up key asks for a word every minute). He is clumsy: he trips, goes "bong" against trees,
// and presses every button he finds, even the fake ones (confetti!). Two secret buttons in the
// village: the real one opens the ground and a secret chest comes out (a word opens it).
// Session 2: Boulon has turned green (spell BRILLE to make him shine), then three secret buttons
// in three places; the last chest gives the Copper Knight outfit and Boulon stays for good.
// He greets Fer, and rides the hang-glider with the hero (bong! on landing).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildChest } from './icons.js';

export const ANVIL = { x: -8.6, z: -1.6 };
export const COPPER_LIFE = 180; // seconds of following after a wake-up
export const WIND_EVERY = 60; // a word to wind his key every minute
// The secret buttons: a cluster of three (two fakes, one real) per spot.
export const BUTTON_SPOTS = [
  { id: 'tower', part: 1, x: 12.0, z: 9.8, ry: 0.3, place: { fr: 'près de la tour du mage', en: 'near the wizard’s tower' } },
  { id: 'shop', part: 1, x: 8.0, z: -3.6, ry: -0.2, place: { fr: 'devant la boutique', en: 'in front of the shop' } },
  { id: 'tavern', part: 2, x: -13.0, z: 14.6, ry: 0.1, place: { fr: 'devant la taverne', en: 'in front of the tavern' } },
  { id: 'pond', part: 2, x: -16.0, z: -10.8, ry: 0.5, place: { fr: 'près de la mare', en: 'near the pond' } },
  { id: 'guild', part: 2, x: -2.0, z: -9.8, ry: -0.4, place: { fr: 'devant la guilde', en: 'in front of the guild' } },
];
export const spotsOfPart = (part) => BUTTON_SPOTS.filter((b) => b.part === part);
// The three buttons of a spot (the real one is always pressed last, for the suspense).
export function spotButtons(spot) {
  const c = Math.cos(spot.ry), s = Math.sin(spot.ry);
  return [[-1.2, 0.2], [1.2, 0.3], [0, -0.6]].map(([dx, dz], i) => ({ x: spot.x + dx * c + dz * s, z: spot.z - dx * s + dz * c, real: i === 2 }));
}

export const CTX = {
  fr: {
    name: 'Le petit golem de cuivre', golem: 'Boulon', anvil: 'Enclume',
    label: '🔨 Enclume', labelGolem: '🤖 Boulon',
    recipe: ['fer', 'pierre', 'feu'],
    recipeInstr: (w, k) => `Recette du petit golem : fer + pierre + feu. Épelle ${w.toUpperCase()} ! (${k}/3)`,
    recipeSay: 'Recette du petit golem : du fer, de la pierre et du feu ! Épelle :',
    clang: (k) => ['Clang ! Le fer est sur l’enclume !', 'Clang ! La pierre aussi !', 'Fwoosh ! Le feu !'][k],
    born: 'Bong ! Bonjour ! Je suis Boulon, ton petit golem de cuivre ! Je te suis partout !',
    bornHint: (p) => `Bip bip ! Je sens un bouton secret… ${p} ! Emmène-moi là-bas !`,
    letter: (l, w) => `La lettre ${l}… comme dans ${w}.`,
    wakeInstr: 'Boulon dort près de l’enclume. Épelle ce mot pour le réveiller !',
    woke: 'Debout, Boulon ! Bong ! Il te suit de nouveau !',
    flat: 'Crrr… Boulon est à plat ! Touche-le et épelle un mot pour remonter sa clé.',
    windInstr: 'Remonte la clé de Boulon : épelle ce mot !',
    wound: 'Cric, cric, cric ! La clé tourne : Boulon repart !',
    tired: 'Boulon bâille… Il retourne dormir près de l’enclume. Touche l’enclume pour le réveiller !',
    bong: 'Bong !', oops: 'Oups !', pouet: 'Pouet !', clic: 'Clic !', hello: 'Salut, Fer !',
    tripSay: 'Oups ! Boulon a trébuché !',
    bongSay: 'Bong ! Boulon s’est cogné !',
    fake: 'Pouet ! Un faux bouton… des confettis !',
    real: 'Clic ! Le vrai bouton ! Un coffre secret sort de terre ! Touche-le et épelle un mot !',
    chestTitle: 'Le coffre secret', chestInstr: 'Épelle ce mot pour ouvrir le coffre secret !',
    lockInstr: (k) => `Un gros coffre à deux serrures ! Serrure ${k} sur 2 : épelle ce mot !`,
    lockOne: 'Une serrure ouverte ! Encore une !',
    chestOpen: (n, total) => `Le coffre secret est ouvert ! (${n}/${total})`,
    chestNext: (p) => `Bip bip ! Encore un bouton… ${p} !`,
    goldKey: 'Le gros coffre contenait une clé dorée : Boulon la porte dans le dos ! Les deux boutons sont trouvés !',
    goldKeySay: 'Bravo ! Les deux boutons secrets sont trouvés ! Regarde : Boulon a une clé dorée dans le dos !',
    waitChest: 'Bip ! Ouvre d’abord le coffre secret !',
    partTwo: 'Oh non ! Boulon a verdi, comme le vieux cuivre ! Touche-le et épelle BRILLE pour le faire briller !',
    greenInstr: 'Boulon a verdi ! Épelle ce mot pour le faire briller !',
    shine: 'Bling ! Boulon brille comme un sou neuf ! Trois boutons secrets t’attendent dans trois lieux !',
    costume: 'Le dernier coffre ! Tu gagnes le costume de Chevalier de cuivre ! Et Boulon reste avec toi pour toujours !',
    costumeSay: 'Les trois boutons secrets ! Tu gagnes le costume de Chevalier de cuivre ! Et Boulon reste avec toi pour toujours !',
    heroButton: 'Des boutons secrets ! Ils sont trop durs pour toi : seul un petit golem de cuivre peut appuyer dessus. Fabrique-le sur l’enclume, à côté de la forge : suis la flèche !',
    heroButtonSleep: 'Des boutons secrets ! Seul Boulon peut appuyer dessus : va le réveiller à l’enclume, à côté de la forge !',
    heroButtonFlat: 'Des boutons secrets ! Mais Boulon est à plat : touche-le et épelle un mot pour remonter sa clé !',
    goPress: 'Boulon, à toi ! Appuie sur les boutons !',
    noPart2: 'Boulon a trouvé tous les boutons du jour. D’autres boutons arrivent à ton prochain retour !',
    happy: 'Bip bip ! Boulon fait la danse du robot !',
    ride: 'Boulon s’accroche au deltaplane !',
    notYet: 'touche l’enclume, à côté de la forge !',
    lines: (b, total, next) => `🔴 Boutons secrets : ${b}/${total}${next ? ` · le prochain : ${next}` : ''}`,
    reward: (what) => `Dans le coffre : ${what}`,
  },
  en: {
    name: 'The little copper golem', golem: 'Bolt', anvil: 'Anvil',
    label: '🔨 Anvil', labelGolem: '🤖 Bolt',
    recipe: ['iron', 'stone', 'fire'],
    recipeInstr: (w, k) => `Little golem recipe: iron + stone + fire. Spell ${w.toUpperCase()}! (${k}/3)`,
    recipeSay: 'Little golem recipe: iron, stone and fire! Spell:',
    clang: (k) => ['Clang! The iron is on the anvil!', 'Clang! The stone too!', 'Whoosh! The fire!'][k],
    born: 'Bong! Hello! I am Bolt, your little copper golem! I follow you everywhere!',
    bornHint: (p) => `Beep beep! I can feel a secret button… ${p}! Take me there!`,
    letter: (l, w) => `The letter ${l}… as in ${w}.`,
    wakeInstr: 'Bolt is asleep by the anvil. Spell this word to wake him up!',
    woke: 'Wake up, Bolt! Bong! He follows you again!',
    flat: 'Crrr… Bolt has run down! Touch him and spell a word to wind his key.',
    windInstr: 'Wind Bolt’s key: spell this word!',
    wound: 'Click, click, click! The key turns: off goes Bolt!',
    tired: 'Bolt yawns… He goes back to sleep by the anvil. Touch the anvil to wake him up!',
    bong: 'Bong!', oops: 'Oops!', pouet: 'Toot!', clic: 'Click!', hello: 'Hi, Iron!',
    tripSay: 'Oops! Bolt tripped!',
    bongSay: 'Bong! Bolt bumped into something!',
    fake: 'Toot! A fake button… confetti!',
    real: 'Click! The real button! A secret chest comes out of the ground! Touch it and spell a word!',
    chestTitle: 'The secret chest', chestInstr: 'Spell this word to open the secret chest!',
    lockInstr: (k) => `A big chest with two locks! Lock ${k} of 2: spell this word!`,
    lockOne: 'One lock open! One more!',
    chestOpen: (n, total) => `The secret chest is open! (${n}/${total})`,
    chestNext: (p) => `Beep beep! Another button… ${p}!`,
    goldKey: 'The big chest had a golden key: Bolt wears it on his back! Both buttons found!',
    goldKeySay: 'Well done! Both secret buttons found! Look: Bolt has a golden key on his back!',
    waitChest: 'Beep! Open the secret chest first!',
    partTwo: 'Oh no! Bolt has gone green, like old copper! Touch him and spell SHINE to make him shine!',
    greenInstr: 'Bolt has gone green! Spell this word to make him shine!',
    shine: 'Bling! Bolt shines like a new penny! Three secret buttons are waiting in three places!',
    costume: 'The last chest! You win the Copper Knight outfit! And Bolt stays with you for good!',
    costumeSay: 'All three secret buttons! You win the Copper Knight outfit! And Bolt stays with you for good!',
    heroButton: 'Secret buttons! They are too hard for you: only a little copper golem can press them. Build one on the anvil next to the forge: follow the arrow!',
    heroButtonSleep: 'Secret buttons! Only Bolt can press them: go and wake him up at the anvil next to the forge!',
    heroButtonFlat: 'Secret buttons! But Bolt has run down: touch him and spell a word to wind his key!',
    goPress: 'Your turn, Bolt! Press the buttons!',
    noPart2: 'Bolt found all of today’s buttons. More buttons next time you come back!',
    happy: 'Beep beep! Bolt does the robot dance!',
    ride: 'Bolt holds on to the hang-glider!',
    notYet: 'touch the anvil, next to the forge!',
    lines: (b, total, next) => `🔴 Secret buttons: ${b}/${total}${next ? ` · next one: ${next}` : ''}`,
    reward: (what) => `In the chest: ${what}`,
  },
};
export const SHINE_WORD = { fr: 'brille', en: 'shine' };

function colorize(g, c) {
  const n = g.attributes.position.count, arr = new Float32Array(n * 3), col = new THREE.Color(c);
  for (let i = 0; i < n; i++) { arr[i * 3] = col.r; arr[i * 3 + 1] = col.g; arr[i * 3 + 2] = col.b; }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  if (g.attributes.uv) g.deleteAttribute('uv');
  if (g.index) return g.toNonIndexed();
  return g;
}
function box(w, h, d, c, x, y, z, rx = 0, rz = 0) {
  const g = new THREE.BoxGeometry(w, h, d).toNonIndexed();
  if (rx) g.rotateX(rx);
  if (rz) g.rotateZ(rz);
  g.translate(x, y, z);
  return colorize(g, c);
}
function cyl(r, h, c, x, y, z, seg = 10) { const g = new THREE.CylinderGeometry(r, r, h, seg).toNonIndexed(); g.translate(x, y, z); return colorize(g, c); }
function merge(geos) { const g = mergeGeometries(geos); geos.forEach((x) => x.dispose()); return g; }
function mesh(geos, mat, dyn = true) { const m = new THREE.Mesh(merge(geos), mat); m.castShadow = true; m.userData.dynamic = dyn; return m; }

const COPPER = 0xd27a3c, COPPER_DK = 0xa4562a, COPPER_LT = 0xf0a060, EYE = 0x7af0ff;
// Boulon: about 1.1 m tall. Body, arms (both in one mesh), two legs, the wind-up key and the antenna
// light: 6 draw calls, colours in the vertices.
export function buildCopperGolem() {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0.35 });
  const g = new THREE.Group();
  g.userData.dynamic = true;
  const rig = new THREE.Group();
  g.add(rig);
  const body = mesh([
    box(0.62, 0.5, 0.44, COPPER, 0, 0.62, 0), // belly
    box(0.5, 0.08, 0.46, COPPER_DK, 0, 0.42, 0), // belt
    box(0.18, 0.18, 0.04, COPPER_LT, 0, 0.66, 0.23), // rivet plate
    box(0.56, 0.44, 0.48, COPPER, 0, 1.1, 0.02), // head
    box(0.16, 0.16, 0.04, EYE, -0.13, 1.14, 0.27), box(0.16, 0.16, 0.04, EYE, 0.13, 1.14, 0.27), // big eyes
    box(0.07, 0.07, 0.05, 0x1a2a3a, -0.11, 1.13, 0.29), box(0.07, 0.07, 0.05, 0x1a2a3a, 0.15, 1.13, 0.29), // pupils
    box(0.1, 0.12, 0.1, COPPER_DK, 0, 1.02, 0.3), // nose
    box(0.24, 0.04, 0.03, COPPER_DK, 0, 0.94, 0.27), // smile
    cyl(0.025, 0.2, COPPER_DK, 0, 1.42, 0, 6), // antenna stem
  ], mat);
  rig.add(body);
  const arms = new THREE.Group();
  arms.position.set(0, 0.8, 0);
  arms.add(mesh([box(0.14, 0.42, 0.16, COPPER_DK, -0.39, -0.17, 0), box(0.14, 0.42, 0.16, COPPER_DK, 0.39, -0.17, 0), box(0.17, 0.12, 0.18, COPPER_LT, -0.39, -0.4, 0), box(0.17, 0.12, 0.18, COPPER_LT, 0.39, -0.4, 0)], mat));
  rig.add(arms);
  const legs = [];
  for (const sx of [-0.15, 0.15]) {
    const leg = new THREE.Group();
    leg.position.set(sx, 0.38, 0);
    leg.add(mesh([box(0.18, 0.34, 0.2, COPPER_DK, 0, -0.18, 0), box(0.22, 0.08, 0.28, COPPER_LT, 0, -0.34, 0.04)], mat));
    rig.add(leg);
    legs.push(leg);
  }
  // The wind-up key on his back (turns while he walks; golden once won).
  const keyMat = new THREE.MeshStandardMaterial({ color: 0xb8bcc4, metalness: 0.6, roughness: 0.3 });
  const key = new THREE.Group();
  key.position.set(0, 0.68, -0.25);
  key.add(mesh([box(0.05, 0.05, 0.16, 0xffffff, 0, 0, -0.06), box(0.36, 0.1, 0.04, 0xffffff, 0, 0, -0.16), box(0.1, 0.24, 0.04, 0xffffff, -0.16, 0, -0.16), box(0.1, 0.24, 0.04, 0xffffff, 0.16, 0, -0.16)], keyMat));
  rig.add(key);
  const antMat = new THREE.MeshBasicMaterial({ color: 0x661111 });
  const antenna = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), antMat);
  antenna.position.set(0, 1.55, 0);
  antenna.userData.dynamic = true;
  rig.add(antenna);
  g.userData.parts = { rig, body, arms, legs, key, antenna, mat, keyMat, antMat };
  return g;
}

// The hang-glider (J6, the parent's idea): a striped triangular wing over the hero's head and its
// A-frame down to his hands. One mesh, both faces drawn.
export function buildHangGlider() {
  const cols = [0xff5a5a, 0xffb03a, 0xffe14a, 0x5ae07a, 0x4ab0ff, 0xb07aff];
  const pos = [], col = [];
  const nose = [0, 0.12, 1.15], segs = 12;
  const edge = (t) => { const x = -1.9 + t * 3.8; return [x, -0.12 + Math.abs(x) * 0.06, -0.75 + Math.abs(x) * 0.18]; };
  for (let i = 0; i < segs; i++) {
    const a = edge(i / segs), b = edge((i + 1) / segs), c = new THREE.Color(cols[Math.floor((i / segs) * cols.length) % cols.length]);
    pos.push(...nose, ...a, ...b);
    for (let k = 0; k < 3; k++) col.push(c.r, c.g, c.b);
  }
  const wing = new THREE.BufferGeometry();
  wing.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  wing.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  wing.computeVertexNormals();
  const frame = 0x3a3a46;
  const bar = (x0, y0, x1, y1, z) => { const len = Math.hypot(x1 - x0, y1 - y0), g = new THREE.BoxGeometry(0.04, len, 0.04).toNonIndexed(); g.rotateZ(-Math.atan2(x1 - x0, y1 - y0)); g.translate((x0 + x1) / 2, (y0 + y1) / 2, z); return colorize(g, frame); };
  const parts = [wing, box(0.05, 0.05, 1.9, frame, 0, 0.08, 0.2), bar(0, 0.05, -0.38, -1.05, 0.15), bar(0, 0.05, 0.38, -1.05, 0.15), box(0.85, 0.05, 0.05, frame, 0, -1.05, 0.15)];
  const m = new THREE.Mesh(merge(parts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: THREE.DoubleSide, transparent: true, opacity: 0.7, depthWrite: false }));
  m.userData.dynamic = true;
  m.visible = false;
  return m;
}

// The anvil next to the forge: a dark iron anvil on a stump, and the three ingredients of the recipe.
function buildAnvil() {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.3 });
  const iron = 0x4a4e58, dk = 0x2e3038, wood = 0x7a5232;
  const m = mesh([
    cyl(0.42, 0.55, wood, 0, 0.275, 0, 10), cyl(0.44, 0.05, 0x5a3a20, 0, 0.56, 0, 10),
    box(0.36, 0.22, 0.32, dk, 0, 0.69, 0), box(0.9, 0.2, 0.4, iron, 0.05, 0.89, 0), box(0.3, 0.12, 0.26, iron, -0.52, 0.93, 0),
    box(0.08, 0.36, 0.08, 0x8a5a32, 0.55, 0.62, 0.3, 0, 0.4), box(0.24, 0.12, 0.12, 0x6a6e78, 0.62, 0.82, 0.3), // a little hammer leaning on it
  ], mat, false);
  const blocks = [0xb9c2cc, 0x8a8a92, 0xff8a2a].map((c, i) => {
    const b = new THREE.Mesh(merge([box(0.22, 0.22, 0.22, c, 0, 0, 0)]), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, emissive: i === 2 ? 0xff5a00 : 0x000000, emissiveIntensity: i === 2 ? 0.9 : 0 }));
    b.position.set(-0.25 + i * 0.25, 1.11, 0);
    b.visible = false;
    b.userData.dynamic = true;
    m.add(b);
    return b;
  });
  return { m, blocks };
}

export class CopperWorkshop {
  constructor(scene3D) {
    this.s = scene3D;
    const gy = scene3D.groundAt(ANVIL.x, ANVIL.z);
    const { m, blocks } = buildAnvil();
    m.position.set(ANVIL.x, gy, ANVIL.z);
    m.rotation.y = 0.3;
    scene3D.scene.add(m);
    this.anvil = m; this.blocks = blocks;
    scene3D.collidables.push({ x: ANVIL.x, z: ANVIL.z, r: 0.55 });
    this.obj = scene3D._addInteractable({ kind: 'anvil', worldPos: new THREE.Vector3(ANVIL.x, gy, ANVIL.z), iconY: 2.0, reach: 2.4, hitRadius: 1.0 });
    // Boulon (hidden until built).
    this.golem = buildCopperGolem();
    this.golem.visible = false;
    scene3D.scene.add(this.golem);
    this.gobj = scene3D._addInteractable({ kind: 'copper', worldPos: new THREE.Vector3(), iconY: 2.0, reach: 2.6, hitRadius: 0.9 });
    this.gobj.active = false; this.gobj.iconHolder.visible = false;
    // The secret buttons: bases and red caps, one instanced mesh each.
    this.buttons = BUTTON_SPOTS.flatMap((spot, si) => spotButtons(spot).map((b, k) => ({ ...b, si, k, y: scene3D.groundAt(b.x, b.z), down: 0 })));
    const n = this.buttons.length;
    this.bases = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.3, 0.34, 0.08, 12), new THREE.MeshStandardMaterial({ color: 0x8a8a92, roughness: 0.8 }), n);
    this.caps = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.22, 0.14, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, emissive: 0x401010, emissiveIntensity: 0.15 }), n);
    for (const im of [this.bases, this.caps]) { im.userData.dynamic = true; im.frustumCulled = false; scene3D.scene.add(im); }
    // Each spot can be touched: the game says what the buttons are (until they are pressed).
    this.spotObjs = BUTTON_SPOTS.map((sp, si) => scene3D._addInteractable({ kind: 'secretbutton', spot: si, worldPos: new THREE.Vector3(sp.x, scene3D.groundAt(sp.x, sp.z), sp.z), iconY: 0.9, reach: 2.8, hitRadius: 1.5 }));
    // The secret chest (one at a time).
    this.chest = buildChest();
    this.chest.userData.dynamic = true;
    this.chest.visible = false;
    scene3D.scene.add(this.chest);
    this.cobj = scene3D._addInteractable({ kind: 'secretchest', worldPos: new THREE.Vector3(), iconY: 1.6, reach: 2.4, hitRadius: 1.0 });
    this.cobj.active = false; this.cobj.iconHolder.visible = false;
    // The hang-glider of the glide power.
    this.glider = buildHangGlider();
    scene3D.scene.add(this.glider);
    this.gliderOpen = 0; this.gliderRoll = 0; this.lastYaw = 0;
    this.state = { part: 1, pressed: [], chestAt: -1, chestBig: false, green: false, goldKey: false };
    this.mode = 'hidden'; // hidden | assemble | follow | flat | sleep | press | ride
    this.t = 0; this.walk = 0; this.tripT = -1; this.bongT = -1; this.greetT = -1; this.danceT = -1; this.shineT = -1; this.squash = 0;
    this.tripIn = 40; this.bongCool = 0; this.greetCool = 0; this.stuckT = 0; this.beepT = 0; this.riseT = -1; this.openT = -1;
    this._dummy = new THREE.Object3D();
    this.layout();
  }
  // What the game knows: part, buttons pressed (spot indexes), chest out, green, golden key.
  setState(st) { Object.assign(this.state, st); this.layout(); }
  spotVisible(si) { return BUTTON_SPOTS[si].part <= this.state.part; }
  layout() {
    const d = this._dummy, red = new THREE.Color(0xe03a2a), green = new THREE.Color(0x4ad06a);
    this.buttons.forEach((b, i) => {
      const vis = this.spotVisible(b.si), done = this.state.pressed.includes(b.si) && b.real;
      d.position.set(b.x, b.y + 0.04, b.z); d.rotation.set(0, 0, 0); d.scale.setScalar(vis ? 1 : 0.0001); d.updateMatrix();
      this.bases.setMatrixAt(i, d.matrix);
      const down = done ? 1 : b.down;
      d.position.set(b.x, b.y + 0.13 - down * 0.08, b.z); d.scale.set(vis ? 1 : 0.0001, vis ? 1 - down * 0.5 : 0.0001, vis ? 1 : 0.0001); d.updateMatrix();
      this.caps.setMatrixAt(i, d.matrix);
      this.caps.setColorAt(i, done ? green : red);
    });
    this.bases.instanceMatrix.needsUpdate = true; this.caps.instanceMatrix.needsUpdate = true;
    for (const o of this.spotObjs ?? []) { o.active = this.spotVisible(o.spot) && !this.state.pressed.includes(o.spot); o.iconHolder.visible = false; }
    if (this.caps.instanceColor) this.caps.instanceColor.needsUpdate = true;
    const P = this.golem.userData.parts;
    P.mat.color.set(this.state.green ? 0x7ad0a8 : 0xffffff);
    P.keyMat.color.set(this.state.goldKey ? 0xf2c84b : 0xb8bcc4);
    P.keyMat.emissive?.set(this.state.goldKey ? 0x6a4a10 : 0x000000);
  }
  // The recipe on the anvil: k ingredients placed (0..3).
  setRecipe(k) { this.blocks.forEach((b, i) => { b.visible = i < k; }); if (k > 0) this._sparks(this.anvil.position.clone().setY(this.anvil.position.y + 1.2), k === 3 ? '#ff8a2a' : '#ffe08a'); }
  _sparks(p, c, n = 18) { this.s.particleBurst(p, c, n); }
  get out() { return this.mode !== 'hidden'; }
  _place(x, z) { const g = this.golem; g.position.set(x, this.s.groundAt(x, z), z); }
  // Wow: the pieces fly up from the anvil and click together, bong after bong, then he opens his eyes.
  assemble() {
    const a = this.anvil.position;
    this._place(a.x + 1.1, a.z + 1.0);
    this.golem.rotation.y = 0.4;
    this.golem.visible = true;
    this.mode = 'assemble'; this.asmT = 0;
    const P = this.golem.userData.parts;
    this.asmParts = [P.legs[0], P.legs[1], P.body, P.arms, P.key, P.antenna].map((o, i) => ({ o, home: o.position.clone(), from: new THREE.Vector3(Math.cos(i * 2.1) * 2.2, 3 + i * 0.4, Math.sin(i * 2.1) * 2.2), i, done: false }));
    for (const q of this.asmParts) q.o.position.copy(q.from);
    this.blocks.forEach((b) => { b.visible = false; });
    for (const c of ['#ffd34a', '#ff8a2a', '#ffffff']) this._sparks(a.clone().setY(a.y + 1.4), c, 26);
    this.s.screenShake?.(0.12);
  }
  // Back to the anvil, asleep (until a word wakes him up).
  sleep() {
    const a = this.anvil.position;
    if (this.golem.visible && this.mode !== 'sleep') this._sparks(this.golem.position.clone().setY(this.golem.position.y + 0.6), '#ffffff', 12);
    this.golem.visible = true;
    this._place(a.x + 1.0, a.z + 0.9);
    this.golem.rotation.y = 0.5;
    this.mode = 'sleep';
  }
  wakeUp() { this.mode = 'follow'; this.danceT = 1.2; this._sparks(this.golem.position.clone().setY(this.golem.position.y + 1), '#ffe08a'); }
  setFlat(on) { if (on && (this.mode === 'follow' || this.mode === 'press')) this.mode = 'flat'; else if (!on && this.mode === 'flat') { this.mode = 'follow'; this.danceT = 0.8; } }
  // Next to the hero (after a teleport, a trip through a signpost…).
  catchUp() {
    if (this.mode === 'press') { this.mode = 'follow'; this.pressQ = []; this.pressT = 0; }
    if (!['follow', 'flat'].includes(this.mode)) return;
    const p = this.s.player.position, ry = this.s.player.rotation.y;
    this._place(p.x - Math.sin(ry) * 1.4 + 0.5, p.z - Math.cos(ry) * 1.4);
    this._sparks(this.golem.position.clone().setY(this.golem.position.y + 0.6), '#ffffff', 10);
  }
  shine() { this.shineT = 2.2; const p = this.golem.position.clone(); p.y += 0.8; for (const c of ['#ffd34a', '#ffffff', '#ffb070', '#7af0ff']) this._sparks(p, c, 22); }
  dance() { this.danceT = 1.6; }
  // The secret chest comes out of the ground at the real button of a spot.
  riseChest(si, big) {
    const b = this.buttons.find((x) => x.si === si && x.real);
    const c = this.chest;
    c.scale.setScalar(big ? 1.45 : 1.05);
    c.userData.lid.rotation.x = 0;
    c.position.set(b.x, b.y - 1.2, b.z + 0.9);
    c.rotation.set(0, Math.atan2(this.s.player.position.x - b.x, this.s.player.position.z - b.z - 0.9), 0);
    c.visible = true;
    this.riseT = 0; this.openT = -1; this.chestY = b.y;
    this.cobj.worldPos.set(b.x, b.y, b.z + 0.9);
    this.cobj.iconHolder.position.copy(this.cobj.worldPos).add(new THREE.Vector3(0, this.cobj.iconY, 0));
    this.cobj.hit.position.copy(this.cobj.worldPos).add(new THREE.Vector3(0, 0.6, 0));
    this.s.screenShake?.(0.2);
  }
  // A chest already out (after reloading the game): straight up, no rumble.
  showChest(si, big) { this.riseChest(si, big); this.riseT = 9; this.chest.position.y = this.chestY; this.cobj.active = true; this.cobj.iconHolder.visible = true; }
  openChest() {
    this.openT = 0; this.cobj.active = false; this.cobj.iconHolder.visible = false;
    const p = this.chest.position.clone(); p.y += 1;
    for (const [k, c] of ['#ff5a5a', '#ffd34a', '#5ad06a', '#5ab4ff', '#ffffff'].entries()) setTimeout(() => this.s.particleBurst(p, c, 22), k * 90);
  }
  // The hero asks Boulon to press the buttons of a spot (he runs there).
  pressSpot(si) {
    if (!['follow', 'press'].includes(this.mode) || this.state.pressed.includes(si)) return false;
    if (this.state.chestAt >= 0) { this.onWaitChest?.(); return 'wait'; }
    if (Math.hypot(BUTTON_SPOTS[si].x - this.golem.position.x, BUTTON_SPOTS[si].z - this.golem.position.z) > 16) this.catchUp();
    this.mode = 'press'; this.pressT = 0; this.pressStuck = 0;
    this.pressQ = this.buttons.filter((b) => b.si === si).sort((a, b) => a.real - b.real);
    return true;
  }
  // The nearest spot still to press (visible, not pressed), and how far it is from the golem.
  nearestSpot() {
    let best = -1, bd = Infinity;
    const g = this.golem.position;
    BUTTON_SPOTS.forEach((sp, si) => {
      if (!this.spotVisible(si) || this.state.pressed.includes(si)) return;
      const d = Math.hypot(sp.x - g.x, sp.z - g.z);
      if (d < bd) { bd = d; best = si; }
    });
    return { si: best, d: bd };
  }
  _free(x, z) { return !this.s._checkCollision(x, z) && !this.s._insideAnyHouse?.(x, z, 0.4); }
  _walkTo(goal, speed, dt) {
    const g = this.golem.position, dx = goal.x - g.x, dz = goal.z - g.z, d = Math.hypot(dx, dz);
    if (d < 0.05) return { d, moved: false, blocked: false };
    const step = Math.min(d, speed * dt), nx = g.x + (dx / d) * step, nz = g.z + (dz / d) * step;
    let moved = false, blocked = false;
    if (this._free(nx, nz)) { g.x = nx; g.z = nz; moved = true; }
    else {
      blocked = true;
      const px = -(dz / d) * step, pz = (dx / d) * step;
      if (this._free(g.x + px, g.z + pz)) { g.x += px; g.z += pz; moved = true; }
      else if (this._free(g.x - px, g.z - pz)) { g.x -= px; g.z -= pz; moved = true; }
    }
    let diff = Math.atan2(dx, dz) - this.golem.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    this.golem.rotation.y += diff * Math.min(1, dt * 6);
    return { d, moved, blocked };
  }
  _sync() {
    const o = this.gobj, g = this.golem;
    o.worldPos.copy(g.position);
    o.iconHolder.position.copy(g.position).add(new THREE.Vector3(0, o.iconY, 0));
    o.hit.position.copy(g.position).add(new THREE.Vector3(0, 0.6, 0));
    const on = g.visible && this.mode !== 'assemble';
    o.active = on; o.iconHolder.visible = on;
  }
  update(dt) {
    this.t += dt;
    const s = this.s, t = this.t;
    this._updateGlider(dt);
    this._updateButtons(dt);
    this._updateChest(dt);
    const g = this.golem, P = g.userData.parts;
    if (!g.visible) { this._sync(); return; }
    const p = s.player.position;
    let moving = false, speed = 0;
    P.rig.rotation.set(0, 0, 0); P.rig.position.set(0, 0, 0);
    P.arms.rotation.set(0, 0, 0);
    if (this.mode === 'assemble') {
      this.asmT += dt;
      for (const q of this.asmParts) {
        const k = Math.min(1, Math.max(0, (this.asmT - q.i * 0.3) / 0.45));
        const e = 1 - (1 - k) * (1 - k);
        q.o.position.lerpVectors(q.from, q.home, e);
        q.o.rotation.y = (1 - e) * 8;
        if (k >= 1 && !q.done) { q.done = true; q.o.rotation.y = 0; this.onPiece?.(q.i); this._sparks(g.position.clone().setY(g.position.y + q.home.y + 0.2), '#ffd34a', 10); }
      }
      if (this.asmT > 2.4) { this.mode = 'follow'; this.danceT = 1.4; this.squash = 1; this.onBorn?.(); }
    } else if (this.mode === 'sleep') {
      // Sitting by the anvil, head down; zzz now and then.
      P.rig.position.y = -0.18; P.rig.rotation.x = 0.25;
      P.legs[0].rotation.x = P.legs[1].rotation.x = -1.4;
      P.rig.scale.y = 1 + Math.sin(t * 1.5) * 0.03;
    } else if (this.mode === 'ride') {
      // Holding on under the hang-glider, legs swinging.
      g.position.set(p.x, p.y - 0.95, p.z);
      g.rotation.y = s.player.rotation.y;
      P.arms.rotation.x = Math.PI;
      P.legs[0].rotation.x = Math.sin(t * 6) * 0.6; P.legs[1].rotation.x = -Math.sin(t * 6) * 0.6;
      if (s.onGround || s.power !== 'glide') { this.mode = 'follow'; this.catchUp(); this.squash = 1; this.rideLands = (this.rideLands ?? 0) + 1; this.onRideLand?.(); }
    } else if (this.mode === 'flat') {
      // Run down: slumped, arms hanging, the key stopped.
      P.rig.rotation.x = 0.35; P.arms.rotation.x = 0.2;
      P.rig.position.y = -0.04;
    } else {
      // Following (or pressing buttons). Riding: the hero takes off with the glide power.
      if (this.mode === 'follow' && s.power === 'glide' && !s.onGround && p.y - s.terrain.heightAt(p.x, p.z) > 1.4) { this.mode = 'ride'; this.onRide?.(); }
      this.bongCool -= dt; this.greetCool -= dt;
      const busy = this.tripT >= 0 || this.bongT >= 0 || this.greetT >= 0 || s.inputLocked; // nobody moves while a word is spelled
      if (this.mode === 'follow' && !busy && !s.inputLocked) {
        // Near a cluster of buttons: off he goes to press them all.
        const { si, d } = this.nearestSpot();
        const hd = si >= 0 ? Math.hypot(BUTTON_SPOTS[si].x - p.x, BUTTON_SPOTS[si].z - p.z) : 99;
        if (si >= 0 && (hd < 6 || d < 4)) {
          if (this.state.chestAt >= 0) { if (!this.waitSaid) { this.waitSaid = true; this.onWaitChest?.(); } }
          else { this.mode = 'press'; this.pressQ = this.buttons.filter((b) => b.si === si).sort((a, b) => a.real - b.real); this.pressT = 0; }
        } else this.waitSaid = false;
      }
      if (this.mode === 'press' && !busy) {
        const b = this.pressQ[0];
        if (!b) this.mode = 'follow';
        else {
          const r = this.pressT > 0 ? { d: 0, moved: false } : this._walkTo(b, 3.2, dt);
          moving = r.moved; speed = 3.2;
          // Stuck behind a fence or a tree: one big hop over it, right onto the button.
          this.pressStuck = r.d >= 0.35 && (!r.moved || r.blocked) ? (this.pressStuck ?? 0) + dt : 0;
          if (this.pressStuck > 1.2) { this.pressStuck = 0; this._sparks(g.position.clone().setY(g.position.y + 0.5), '#ffffff', 8); this._place(b.x, b.z); this.squash = 0.7; }
          if (Math.hypot(p.x - g.position.x, p.z - g.position.z) > 14) { this.mode = 'follow'; this.pressQ = []; this.catchUp(); }
          else if (r.d < 0.35) {
            // Hop onto the button.
            this.pressT += dt;
            P.rig.position.y = Math.sin(Math.min(1, this.pressT / 0.4) * Math.PI) * 0.45;
            moving = false;
            if (this.pressT >= 0.4 && !b.pressedNow) {
              b.pressedNow = true; b.down = 1; this.squash = 0.8; this.layout();
              const at = new THREE.Vector3(b.x, b.y + 0.4, b.z);
              if (b.real) { for (const c of ['#4ad06a', '#ffffff']) this._sparks(at, c, 16); }
              else for (const c of ['#ff5a5a', '#ffd34a', '#5ad06a', '#5ab4ff', '#d86aff']) this._sparks(at, c, 14);
              this.onPress?.(b.si, b.real);
            }
            if (this.pressT >= 1.0) { b.pressedNow = false; this.pressQ.shift(); this.pressT = 0; if (b.real) { this.mode = 'follow'; this.danceT = 1.0; } }
          }
        }
      } else if (this.mode === 'follow' && !busy) {
        const ry = s.player.rotation.y, goal = { x: p.x - Math.sin(ry) * 1.5 + Math.cos(ry) * 0.7, z: p.z - Math.cos(ry) * 1.5 - Math.sin(ry) * 0.7 };
        const dh = Math.hypot(goal.x - g.position.x, goal.z - g.position.z);
        if (dh > 16 || Math.abs(p.y - g.position.y) > 6) { this.catchUp(); this.stuckT = 0; }
        else if (dh > 0.6) {
          speed = dh > 4 ? 5.2 : 3.6;
          const r = this._walkTo(goal, speed, dt);
          moving = r.moved;
          // Bong! Straight into a tree or a wall (he never looks where he goes).
          if (r.blocked && this.bongCool <= 0 && dh > 2) { this.bongT = 0.9; this.bongCool = 9; this.squash = 0.6; this.onBong?.(); }
          this.stuckT = r.moved ? 0 : this.stuckT + dt;
          if (this.stuckT > 2.5) { this.catchUp(); this.stuckT = 0; }
          // Now and then he trips over his own feet.
          this.tripIn -= dt;
          if (this.tripIn <= 0 && dh > 1.2 && r.moved) { this.tripIn = 35 + Math.random() * 25; this.tripT = 0; this.onTrip?.(); }
        } else {
          g.rotation.y += Math.atan2(Math.sin(Math.atan2(p.x - g.position.x, p.z - g.position.z) - g.rotation.y), Math.cos(Math.atan2(p.x - g.position.x, p.z - g.position.z) - g.rotation.y)) * Math.min(1, dt * 3);
        }
        // Fer is close: they wave at each other.
        const fer = s.golem?.mesh;
        if (fer && this.greetCool <= 0 && Math.hypot(fer.position.x - g.position.x, fer.position.z - g.position.z) < 3.6) {
          this.greetCool = 45; this.greetT = 1.8; s.golem.wave?.(); this.onGreet?.();
        }
      }
      if (this.tripT >= 0) {
        // Falls flat on his face… and gets up again.
        this.tripT += dt;
        const k = this.tripT < 0.3 ? this.tripT / 0.3 : this.tripT < 1.1 ? 1 : Math.max(0, 1 - (this.tripT - 1.1) / 0.4);
        P.rig.rotation.x = k * 1.35; P.rig.position.y = k * 0.12; P.arms.rotation.x = -k * 2.6;
        if (this.tripT > 0.3 && !this.tripBonked) { this.tripBonked = true; this._sparks(g.position.clone().setY(g.position.y + 0.2), '#c8b890', 10); }
        if (this.tripT > 1.5) { this.tripT = -1; this.tripBonked = false; }
      }
      if (this.bongT >= 0) {
        this.bongT -= dt;
        P.rig.rotation.x = -Math.sin(this.bongT * 18) * 0.25 * this.bongT; P.rig.rotation.z = Math.sin(this.bongT * 25) * 0.15;
        if (this.bongT < 0) this.bongT = -1;
      }
      if (this.greetT >= 0) {
        this.greetT -= dt;
        const fer = s.golem?.mesh;
        if (fer) g.rotation.y = Math.atan2(fer.position.x - g.position.x, fer.position.z - g.position.z);
        P.arms.rotation.x = -2.8 + Math.sin(this.greetT * 14) * 0.3;
        P.rig.position.y = Math.abs(Math.sin(this.greetT * 7)) * 0.25;
        if (this.greetT < 0) this.greetT = -1;
      }
    }
    // Walk cycle, dance, shine, squash.
    this.walk += dt * (moving ? speed * 2.6 : 0);
    if (moving) {
      const k = Math.sin(this.walk);
      P.legs[0].rotation.x = k * 0.7; P.legs[1].rotation.x = -k * 0.7;
      P.rig.rotation.z = Math.sin(this.walk) * 0.08;
      P.rig.position.y += Math.abs(Math.cos(this.walk)) * 0.06;
    } else if (this.mode !== 'sleep' && this.mode !== 'ride') { P.legs[0].rotation.x = P.legs[1].rotation.x = 0; }
    if (this.danceT >= 0 && ['follow', 'press'].includes(this.mode)) {
      this.danceT -= dt;
      P.arms.rotation.x = -2.6 + Math.sin(t * 16) * 0.4;
      P.rig.rotation.y = Math.sin(t * 12) * 0.5;
      P.rig.position.y = Math.abs(Math.sin(t * 10)) * 0.2;
      if (this.danceT < 0) { this.danceT = -1; P.rig.rotation.y = 0; }
    }
    if (this.mode !== 'flat' && this.mode !== 'sleep') P.key.rotation.z += dt * (moving ? 7 : 2.5);
    if (this.shineT >= 0) {
      this.shineT -= dt;
      P.mat.emissive.setRGB(0.5 * Math.max(0, this.shineT / 2.2), 0.3 * Math.max(0, this.shineT / 2.2), 0.1 * Math.max(0, this.shineT / 2.2));
      if (Math.random() < dt * 8) this._sparks(g.position.clone().add(new THREE.Vector3((Math.random() - 0.5), 0.5 + Math.random() * 0.8, (Math.random() - 0.5))), '#fff4c0', 4);
      if (this.shineT < 0) { this.shineT = -1; P.mat.emissive.setRGB(0, 0, 0); }
    }
    this.squash = Math.max(0, this.squash - dt * 3);
    g.scale.set(1 + this.squash * 0.25, 1 - this.squash * 0.3, 1 + this.squash * 0.25);
    if (this.mode !== 'ride') g.position.y = s.groundAt(g.position.x, g.position.z);
    // The antenna blinks faster near a secret button (and beeps).
    const { si, d } = this.nearestSpot();
    const sleepy = this.mode === 'sleep' || this.mode === 'flat' || this.mode === 'assemble';
    if (!sleepy && si >= 0 && d < 20 && this.state.chestAt < 0) {
      const period = Math.max(0.18, Math.min(1.2, d / 9));
      this.beepT -= dt;
      if (this.beepT <= 0) { this.beepT = period; this.blinkOn = true; if (d < 12) this.onBeep?.(d); }
      if (this.beepT < period * 0.6) this.blinkOn = false;
      P.antMat.color.set(this.blinkOn ? 0xff3a2a : 0x661111);
    } else P.antMat.color.set(sleepy ? 0x331111 : 0xff8a6a);
    this._sync();
  }
  _updateButtons(dt) {
    // The hero alone at a spot of buttons (no Boulon to press them): say what they are.
    this.heroCool = (this.heroCool ?? 0) - dt;
    const helper = this.golem.visible && ['follow', 'press', 'ride'].includes(this.mode);
    if (!helper && this.heroCool <= 0 && !this.s.inputLocked) {
      const p = this.s.player.position;
      const si = BUTTON_SPOTS.findIndex((sp, i) => this.spotVisible(i) && !this.state.pressed.includes(i) && Math.hypot(sp.x - p.x, sp.z - p.z) < 2.6);
      // (only once the hero has stood there a moment, not when just passing through)
      this.heroDwell = si >= 0 && si === this.heroSpot ? (this.heroDwell ?? 0) + dt : 0;
      this.heroSpot = si;
      if (si >= 0 && this.heroDwell > 0.8) {
        this.heroCool = 25; this.heroDwell = 0;
        for (const b of this.buttons) if (b.si === si) b.down = 0.25; // they barely move: too hard for the hero
        this.layout();
        this.onHeroButton?.(si);
      }
    }
    let dirty = false;
    for (const b of this.buttons) if (b.down > 0 && !b.pressedNow && !(b.real && this.state.pressed.includes(b.si))) { b.down = Math.max(0, b.down - dt * 2); dirty = true; }
    if (dirty) this.layout();
  }
  _updateChest(dt) {
    const c = this.chest;
    if (!c.visible) return;
    if (this.riseT >= 0 && this.riseT < 1.6) {
      this.riseT += dt;
      const k = Math.min(1, this.riseT / 1.4);
      c.position.y = this.chestY - 1.2 * (1 - k) + Math.sin(k * Math.PI) * 0.5;
      c.rotation.z = Math.sin(this.riseT * 30) * 0.06 * (1 - k);
      if (Math.random() < dt * 20 && k < 1) this.s.particleBurst(new THREE.Vector3(c.position.x, this.chestY + 0.1, c.position.z), '#8a6a4a', 3);
      if (this.riseT >= 1.4) { this.riseT = 9; c.position.y = this.chestY; c.rotation.z = 0; this.cobj.active = true; this.cobj.iconHolder.visible = true; this.onChestUp?.(); }
    }
    if (this.openT >= 0) {
      this.openT += dt;
      c.userData.lid.rotation.x = -2.2 * Math.min(1, this.openT / 0.25);
      if (this.openT > 1.4) c.scale.multiplyScalar(Math.max(0, 1 - dt * 6));
      if (this.openT > 2.0) { c.visible = false; this.openT = -1; }
    }
  }
  // The hang-glider opens over the hero while gliding, banks into the turns, folds on landing.
  _updateGlider(dt) {
    const s = this.s, p = s.player.position, gl = this.glider;
    const want = s.power === 'glide' && !s.onGround && p.y - s.terrain.heightAt(p.x, p.z) > 0.6 ? 1 : 0;
    this.gliderOpen += (want - this.gliderOpen) * Math.min(1, dt * (want ? 6 : 9));
    gl.visible = this.gliderOpen > 0.03;
    // The hero holds the bar with both hands up while the wing is open.
    s.player.userData.hangGlide = this.gliderOpen > 0.5;
    if (!gl.visible) { this.lastYaw = s.player.rotation.y; return; }
    const ry = s.player.rotation.y;
    let dy = ry - this.lastYaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    this.lastYaw = ry;
    const rollWant = Math.max(-0.5, Math.min(0.5, -(dy / Math.max(dt, 0.001)) * 0.18));
    this.gliderRoll += (rollWant - this.gliderRoll) * Math.min(1, dt * 4);
    // A real wing (v1.26.2, "too small"): about 4.5 m across (2.4 times the old one), over the hero; the bar of the
    // A-frame is where his raised hands are (about 2 m up).
    const sc = s.player.scale.y;
    gl.position.set(p.x, p.y + 2.85 * sc, p.z);
    gl.rotation.set(-0.12, ry, this.gliderRoll, 'YXZ');
    const k = 1.2 * sc, ky = 0.8 * sc;
    gl.scale.set(this.gliderOpen * k, (0.4 + this.gliderOpen * 0.6) * ky, k);
  }
}
