// Flammèche, the flame of the days (J3): a little flame with eyes that lives in a stone fireplace
// with its own chimney, in front of the cottage (on the side the camera sees). Spell FEU and she lights up; every good word gives her a log and
// she grows (5 sizes) and dances. Big enough, she sneezes sparks that fall around the cottage as
// stars to pick up. Every day played adds a day to her streak; a missed day does not put her out:
// she falls asleep and snores, and a magic log (one a week, won by spelling) wakes her up.
// The 7-day calendar gives funny rewards: sunglasses for the dog, a bow tie for Iron, a hat…
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const HEARTH = { x: -2.6, z: 17.5 };
export const WOODPILE = { x: -4.1, z: 17.4 };
export const FLAME_STEPS = [0, 2, 4, 6, 8]; // logs needed for sizes 1..5
export const SNEEZE_STARS = [1, 2, 1, 2, 1, 2, 1]; // 7 sneezes (7 words) = 10 stars

// The 7-day calendar (box 1 opens with the 10 stars of session 2, then one box per day played).
export const CALENDAR = [
  { id: 'glasses', emoji: '🕶️', text: { fr: 'des lunettes de soleil pour ton chien', en: 'sunglasses for your dog' }, alt: { fr: 'des lunettes de soleil pour Fer', en: 'sunglasses for Iron' } },
  { id: 'stars10', emoji: '⭐', stars: 10, text: { fr: '10 étoiles', en: '10 stars' } },
  { id: 'bowtie', emoji: '🎀', text: { fr: 'un nœud papillon pour Fer', en: 'a bow tie for Iron' } },
  { id: 'diamonds', emoji: '💎', diamonds: 2, text: { fr: '2 diamants', en: '2 diamonds' } },
  { id: 'rainbow', emoji: '🌈', text: { fr: 'Flammèche devient arc-en-ciel', en: 'Flammèche turns rainbow' } },
  { id: 'stars15', emoji: '⭐', stars: 15, text: { fr: '15 étoiles', en: '15 stars' } },
  { id: 'hat', emoji: '🎩', text: { fr: 'un chapeau pour ton chien', en: 'a hat for your dog' }, alt: { fr: 'un chapeau pour Fer', en: 'a hat for Iron' } },
];

export const FTX = {
  fr: {
    name: 'Flammèche', title: 'Flammèche',
    psst: 'Psst ! Je suis Flammèche, toute petite… Épelle FEU pour m’allumer !',
    lightInstr: 'Épelle ce mot pour allumer Flammèche !',
    logInstr: 'Épelle un mot : il donne une bûche à Flammèche !',
    sneezeInstr: 'Flammèche a le nez qui chatouille… Épelle un mot !',
    wakeInstr: 'Épelle ce mot pour réveiller Flammèche !',
    lit: 'Fwoosh ! Coucou, je suis Flammèche ! Donne-moi des bûches : chaque mot réussi me fait grandir !',
    log: 'Miam, une bûche ! … Hips !',
    hips: 'Hips !',
    grow: (n) => `🔥 Flammèche grandit : taille ${n} sur 5 !`,
    bigLater: '🔥 Flammèche est toute grande ! Reviens plus tard : elle a une surprise pour toi.',
    bigNow: '🔥 Flammèche est toute grande… et elle a le nez qui chatouille ! Épelle un mot près d’elle !',
    partTwo: '🔥 Flammèche a le nez qui chatouille… Va la voir et épelle un mot !',
    sneeze: 'Ah… ah… ATCHOUM !',
    sneezeText: (n) => `🤧 ATCHOUM ! ${n === 1 ? 'Une étoile tombe' : `${n} étoiles tombent`} autour de la chaumière !`,
    star: (k) => `⭐ Étoile ${k} sur 10 !`,
    starsLeft: (n) => `Encore ${n} étoile${n > 1 ? 's' : ''} autour de la chaumière !`,
    calOpen: (k, what) => `🎁 Calendrier de Flammèche, case ${k} : ${what} !`,
    hatSpin: 'Regarde : il fait tourner son chapeau !',
    asleep: '😴 Oh ! Flammèche s’est endormie… Va la réveiller !',
    snore: 'Zzz… Rrrron… pchhh…',
    wakeMagic: (n) => `🪄 La bûche magique réveille Flammèche ! Ta série continue : ${n} jour${n > 1 ? 's' : ''} !`,
    wakeNew: 'Flammèche se réveille ! Nouvelle série : c’est reparti !',
    magicGot: '🪄 Tu as gagné une bûche magique ! Elle réveillera Flammèche si elle s’endort.',
    streak: (n) => `Série : ${n} jour${n > 1 ? 's' : ''}`,
    newDay: (n) => `🔥 Flammèche est contente de te revoir ! Série : ${n} jour${n > 1 ? 's' : ''} !`,
    size: (n) => `Taille ${n}/5`,
    magic: (n) => `🪄 Bûches magiques : ${n}`,
    calTitle: 'Calendrier',
    unlit: 'Flammèche t’attend dans la cheminée de ta chaumière : épelle FEU !',
    label: (n) => `🔥 Flammèche${n ? ` · ${n} j` : ''}`,
    labelOff: '🔥 Flammèche ?',
  },
  en: {
    name: 'Flammèche', title: 'Flammèche',
    psst: 'Psst! I’m Flammèche, very small… Spell FIRE to light me up!',
    lightInstr: 'Spell this word to light Flammèche!',
    logInstr: 'Spell a word: it gives Flammèche a log!',
    sneezeInstr: 'Flammèche’s nose is tickling… Spell a word!',
    wakeInstr: 'Spell this word to wake Flammèche up!',
    lit: 'Whoosh! Hello, I’m Flammèche! Give me logs: every good word makes me grow!',
    log: 'Yum, a log! … Hic!',
    hips: 'Hic!',
    grow: (n) => `🔥 Flammèche grows: size ${n} of 5!`,
    bigLater: '🔥 Flammèche is all grown up! Come back later: she has a surprise for you.',
    bigNow: '🔥 Flammèche is all grown up… and her nose is tickling! Spell a word next to her!',
    partTwo: '🔥 Flammèche’s nose is tickling… Go and spell a word next to her!',
    sneeze: 'Ah… ah… ATCHOO!',
    sneezeText: (n) => `🤧 ATCHOO! ${n === 1 ? 'A star falls' : `${n} stars fall`} around the cottage!`,
    star: (k) => `⭐ Star ${k} of 10!`,
    starsLeft: (n) => `${n} more star${n > 1 ? 's' : ''} around the cottage!`,
    calOpen: (k, what) => `🎁 Flammèche’s calendar, box ${k}: ${what}!`,
    hatSpin: 'Look: he spins his hat!',
    asleep: '😴 Oh! Flammèche fell asleep… Go and wake her up!',
    snore: 'Zzz… Rrrrr… pfff…',
    wakeMagic: (n) => `🪄 The magic log wakes Flammèche up! Your streak goes on: ${n} day${n > 1 ? 's' : ''}!`,
    wakeNew: 'Flammèche wakes up! A new streak: here we go!',
    magicGot: '🪄 You won a magic log! It will wake Flammèche up if she falls asleep.',
    streak: (n) => `Streak: ${n} day${n > 1 ? 's' : ''}`,
    newDay: (n) => `🔥 Flammèche is happy to see you again! Streak: ${n} day${n > 1 ? 's' : ''}!`,
    size: (n) => `Size ${n}/5`,
    magic: (n) => `🪄 Magic logs: ${n}`,
    calTitle: 'Calendar',
    unlit: 'Flammèche is waiting in your cottage chimney: spell FIRE!',
    label: (n) => `🔥 Flammèche${n ? ` · ${n} d` : ''}`,
    labelOff: '🔥 Flammèche?',
  },
};

// Boxes with colours in the vertices, merged into one geometry (one draw call per mesh).
function merged(boxes) {
  const geos = boxes.map(([w, h, d, c, x, y, z, rz = 0]) => {
    const g = new THREE.BoxGeometry(w, h, d).toNonIndexed();
    if (rz) g.rotateZ(rz);
    g.translate(x, y, z);
    const n = g.attributes.position.count, arr = new Float32Array(n * 3);
    const pos = g.attributes.position;
    for (let i = 0; i < n; i++) {
      // c: a colour, or [bottom, top] for a gradient along y.
      const col = Array.isArray(c) ? new THREE.Color(c[0]).lerp(new THREE.Color(c[1]), Math.min(1, Math.max(0, (pos.getY(i) - y + h / 2) / h))) : new THREE.Color(c);
      arr[i * 3] = col.r; arr[i * 3 + 1] = col.g; arr[i * 3 + 2] = col.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    g.deleteAttribute('uv');
    return g;
  });
  const geo = mergeGeometries(geos);
  geos.forEach((g) => g.dispose());
  return geo;
}
const LIT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });

// Accessories (one mesh each), in the dog's head frame (head 0.4 wide, face at z = 0.18).
export function buildGlasses() {
  const k = 0x141414, lens = 0x2a2f4a;
  return new THREE.Mesh(merged([
    [0.44, 0.035, 0.03, k, 0, 0.1, 0.2], // bridge bar
    [0.15, 0.11, 0.03, lens, -0.11, 0.06, 0.205], [0.15, 0.11, 0.03, lens, 0.11, 0.06, 0.205],
    [0.03, 0.03, 0.2, k, -0.215, 0.09, 0.1], [0.03, 0.03, 0.2, k, 0.215, 0.09, 0.1], // arms
    [0.04, 0.03, 0.035, 0xffffff, -0.15, 0.09, 0.22], [0.04, 0.03, 0.035, 0xffffff, 0.07, 0.09, 0.22], // shine
  ]), LIT);
}
export function buildHat() {
  return new THREE.Mesh(merged([
    [0.42, 0.04, 0.42, 0x1e1e26, 0, 0.2, 0], // brim
    [0.26, 0.28, 0.26, 0x1e1e26, 0, 0.36, 0], // crown
    [0.27, 0.06, 0.27, 0xd8382e, 0, 0.26, 0], // red band
    [0.05, 0.08, 0.02, 0xffd34a, 0.08, 0.27, 0.14], // little feather-ish badge
  ]), LIT);
}
export function buildBowtie() {
  const r = 0xd8382e;
  return new THREE.Mesh(merged([
    [0.12, 0.12, 0.08, 0xb02a22, 0, 0, 0],
    [0.24, 0.2, 0.06, r, -0.17, 0, 0, 0.25], [0.24, 0.2, 0.06, r, 0.17, 0, 0, -0.25],
    [0.06, 0.06, 0.07, 0xffffff, -0.2, 0.04, 0.01], [0.06, 0.06, 0.07, 0xffffff, 0.14, -0.04, 0.01], // dots
  ]), LIT);
}

// The flame: tapering blocks, yellow at the bottom and orange-red at the top (the material colour
// tints it: rainbow, or blue while she sleeps). Eyes and smile are a second small mesh.
function buildFlameMesh(mat) {
  const Y = 0xffc838, O = 0xff7a10, R = 0xd8300c;
  return new THREE.Mesh(merged([
    [0.8, 0.45, 0.8, [0xffe070, Y], 0, 0.22, 0],
    [0.64, 0.4, 0.64, [Y, O], 0, 0.62, 0],
    [0.46, 0.36, 0.46, [O, 0xff7a24], 0, 0.98, 0],
    [0.28, 0.3, 0.28, [0xff7a24, R], 0, 1.3, 0],
    [0.14, 0.2, 0.14, R, 0.04, 1.52, 0.02],
    [0.22, 0.34, 0.22, [Y, R], 0.42, 0.6, 0.05], [0.2, 0.3, 0.2, [Y, R], -0.42, 0.72, -0.05], // side tongues
    [0.18, 0.26, 0.18, [O, R], 0.2, 1.18, -0.12],
  ]), mat);
}
function buildFace() {
  const W = 0xffffff, K = 0x1a1a1a;
  return new THREE.Mesh(merged([
    [0.2, 0.22, 0.03, W, -0.16, 0, 0], [0.2, 0.22, 0.03, W, 0.16, 0, 0],
    [0.1, 0.12, 0.04, K, -0.13, -0.02, 0.01], [0.1, 0.12, 0.04, K, 0.13, -0.02, 0.01],
    [0.04, 0.04, 0.05, W, -0.11, 0.02, 0.02], [0.04, 0.04, 0.05, W, 0.15, 0.02, 0.02], // eye shine
    [0.2, 0.05, 0.03, 0x7a1a0a, 0, -0.24, 0], [0.05, 0.05, 0.03, 0x7a1a0a, -0.12, -0.2, 0], [0.05, 0.05, 0.03, 0x7a1a0a, 0.12, -0.2, 0], // smile
  ]), new THREE.MeshBasicMaterial({ vertexColors: true }));
}

// The stone fireplace with its little chimney (open towards +z, the camera), and the woodpile
// next to it (static, one mesh).
function buildHearthAndWood(gx, gz, wx, wz, gy, wy) {
  const st = 0x8a8a8e, dk = 0x6a6a70, lt = 0xa4a4a8, wood = 0x8a5a32, bark = 0x5a3a20, end = 0xd8b07a;
  const boxes = [
    [1.5, 0.22, 1.2, dk, gx, gy + 0.11, gz], // slab
    [1.5, 1.3, 0.3, st, gx, gy + 0.65, gz - 0.5], // back wall
    [0.26, 0.42, 0.95, lt, gx - 0.62, gy + 0.3, gz - 0.05], [0.26, 0.42, 0.95, lt, gx + 0.62, gy + 0.3, gz - 0.05], // low sides
    [1.0, 0.2, 0.22, lt, gx, gy + 0.2, gz + 0.5], // front lip
    [0.8, 1.4, 0.55, st, gx, gy + 1.8, gz - 0.42], [0.92, 0.16, 0.66, dk, gx, gy + 2.56, gz - 0.42], // chimney stack + cap
    [0.12, 0.12, 0.04, lt, gx - 0.2, gy + 1.5, gz - 0.13], [0.16, 0.1, 0.04, dk, gx + 0.18, gy + 2.0, gz - 0.13], // stones
    [0.7, 0.06, 0.6, 0x3a2a1e, gx, gy + 0.25, gz], // ash
    [0.12, 0.1, 0.6, bark, gx - 0.12, gy + 0.3, gz, 0], [0.12, 0.1, 0.6, bark, gx + 0.12, gy + 0.3, gz, 0], // sticks
  ];
  // Woodpile: three logs, two on top.
  for (const [dy, n] of [[0.14, 3], [0.38, 2]]) {
    for (let i = 0; i < n; i++) {
      const x = wx - (n - 1) * 0.14 + i * 0.28, y = wy + dy;
      boxes.push([0.24, 0.24, 0.9, bark, x, y, wz], [0.18, 0.18, 0.92, end, x, y, wz], [0.24, 0.05, 0.9, wood, x, y + 0.1, wz]);
    }
  }
  const mesh = new THREE.Mesh(merged(boxes), LIT);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}

// A gold star, used ten times (one instanced mesh).
function starGeometry() {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.16 : 0.36;
    if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r); else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false });
  g.translate(0, 0, -0.05);
  return g;
}

export class Flammeche {
  constructor(scene3D) {
    this.s = scene3D;
    const gy = scene3D.groundAt(HEARTH.x, HEARTH.z), wy = scene3D.groundAt(WOODPILE.x, WOODPILE.z);
    this.hearth = buildHearthAndWood(HEARTH.x, HEARTH.z, WOODPILE.x, WOODPILE.z, gy, wy);
    scene3D.scene.add(this.hearth);
    scene3D.collidables.push({ x: HEARTH.x - 0.35, z: HEARTH.z - 0.2, r: 0.5 }, { x: HEARTH.x + 0.35, z: HEARTH.z - 0.2, r: 0.5 }, { x: WOODPILE.x, z: WOODPILE.z, r: 0.45 });
    this.mat = new THREE.MeshBasicMaterial({ vertexColors: true, color: 0xffffff });
    this.group = new THREE.Group();
    this.group.userData.dynamic = true;
    this.group.position.set(HEARTH.x, gy + 0.26, HEARTH.z + 0.02); // she looks out (+z), towards the camera
    this.flame = buildFlameMesh(this.mat);
    this.flame.userData.dynamic = true;
    this.face = buildFace();
    this.face.userData.dynamic = true;
    this.face.position.set(0, 0.62, 0.34);
    this.flame.add(this.face);
    this.group.add(this.flame);
    scene3D.scene.add(this.group);
    this.obj = scene3D._addInteractable({ kind: 'flame', worldPos: new THREE.Vector3(HEARTH.x, gy, HEARTH.z), iconY: 3.3, reach: 3.2, hitRadius: 1.1 });
    // Ten stars: invisible until she sneezes them.
    this.stars = new THREE.InstancedMesh(starGeometry(), new THREE.MeshStandardMaterial({ color: 0xffd34a, emissive: 0xffb020, emissiveIntensity: 0.9, metalness: 0.3, roughness: 0.4 }), 10);
    this.stars.userData.dynamic = true;
    this.stars.frustumCulled = false;
    this.stars.visible = false;
    scene3D.scene.add(this.stars);
    this.starList = []; // { from, to, t, landed, got }
    this.state = { lit: false, size: 0, asleep: false, rainbow: false };
    this.scale = 0.2; this.t = 0; this.litT = -1; this.hicT = -1; this.sneezeT = -1; this.pendingSneeze = 0;
    this.blink = 0; this.acc = { key: '', meshes: [] }; this.hatSpinT = 0;
    this._dummy = new THREE.Object3D();
  }
  setState(st) { Object.assign(this.state, st); }
  get top() { return this.group.position.clone().setY(this.group.position.y + 1.6 * this.targetScale()); }
  targetScale() { const st = this.state; return !st.lit ? 0.2 : st.asleep ? 0.32 : [0.24, 0.5, 0.7, 0.9, 1.1, 1.35][st.size] ?? 1.35; }
  // Wow: she lights up with a whoosh, sparks all around.
  light() {
    this.litT = 0;
    const p = this.group.position.clone(); p.y += 0.8;
    for (const [k, c] of ['#ffd34a', '#ff7a1e', '#fff4c0', '#ff3a1a', '#ffd34a'].entries()) setTimeout(() => this.s.particleBurst(p, c, 26), k * 110);
    this.s.screenShake?.(0.12);
  }
  // A log: she gulps, hiccups (a hop and a puff of smoke).
  hiccup() {
    this.hicT = 0;
    setTimeout(() => this.s.particleBurst(this.top, '#9a9a9a', 8), 350);
  }
  // Ah… ah… ATCHOUM! n stars fly out and land around the cottage.
  sneeze(n, spots) { this.sneezeT = 0; this.pendingSneeze += n; this.pendingSpots = [...(this.pendingSpots ?? []), ...spots]; }
  _launch() {
    const from = this.top;
    for (const c of ['#ffd34a', '#ff7a1e', '#fff4c0']) this.s.particleBurst(from, c, 24);
    this.s.screenShake?.(0.08);
    for (const to of this.pendingSpots ?? []) this.addStar(to, from);
    this.pendingSneeze = 0; this.pendingSpots = null;
  }
  // A star (flying from `from`, or already on the ground).
  addStar(to, from = null) {
    if (this.starList.length >= 10) return;
    const gy = this.s.groundAt(to.x, to.z);
    const dest = new THREE.Vector3(to.x, gy + 0.55, to.z);
    this.starList.push({ from: from ? from.clone() : dest.clone(), to: dest, t: from ? 0 : 1, landed: !from, got: false, i: this.starList.length });
    this.stars.visible = true;
  }
  clearStars() { this.starList = []; this.stars.visible = false; }
  starsOut() { return this.starList.filter((s) => !s.got).length; }
  // Free spots around the cottage (not in a wall, a house, the field or the pond).
  starSpots(n, seed = 1) {
    const s = this.s, out = [];
    let r = seed * 9301 + 49297;
    const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
    for (let tries = 0; out.length < n && tries < 400; tries++) {
      const a = rnd() * Math.PI * 2, d = 4.2 + rnd() * 3.2, x = Math.cos(a) * d * 1.2, z = 14 + Math.sin(a) * d;
      const ok = ![0, 0.6, -0.6].some((e) => s._checkCollision(x + e, z) || s._checkCollision(x, z + e)) && !s._insideAnyHouse?.(x, z, 0.6) && !(x > 5 && x < 11 && z > 12 && z < 16.4);
      if (ok && out.every((p) => Math.hypot(p.x - x, p.z - z) > 1.5) && this.starList.every((p) => Math.hypot(p.to.x - x, p.to.z - z) > 1.5)) out.push({ x, z });
    }
    while (out.length < n) out.push({ x: -1 + out.length * 0.8, z: 18.5 });
    return out;
  }
  // Accessories for the dog (glasses, hat) and Iron (bow tie, and the dog's ones when there is no dog).
  dress({ dog = [], golem = [] }) {
    const pet = this.s.pet, gl = this.s.golem;
    const key = `${dog.join()}|${golem.join()}|${pet?.mesh?.uuid}|${gl?.mesh?.uuid}`;
    if (key === this.acc.key) return;
    for (const m of this.acc.meshes) m.parent?.remove(m);
    this.acc = { key, meshes: [] };
    this.dogHat = null;
    const make = (id) => (id === 'glasses' ? buildGlasses() : id === 'hat' ? buildHat() : buildBowtie());
    const head = pet?.mesh?.userData.parts?.head;
    if (head) for (const id of dog) { const m = make(id); m.userData.dynamic = true; head.add(m); this.acc.meshes.push(m); if (id === 'hat') this.dogHat = m; }
    const rig = gl?.mesh?.userData.parts?.rig;
    if (rig) {
      for (const id of golem) {
        const m = make(id); m.userData.dynamic = true;
        if (id === 'bowtie') { m.position.set(0, 2.2, 0.45); m.scale.setScalar(1.3); }
        else { m.position.set(0, 2.63, 0.1); m.scale.setScalar(1.6); }
        rig.add(m); this.acc.meshes.push(m);
        if (id === 'hat') this.dogHat ??= m;
      }
    }
  }
  // Called every frame: dance, hiccups, sneezes, flying stars, star pick-up.
  update(dt) {
    this.t += dt;
    const st = this.state, g = this.flame, t = this.t;
    let target = this.targetScale();
    if (this.litT >= 0) { this.litT += dt; const k = Math.min(1, this.litT / 0.7); target *= k < 1 ? 1.6 * Math.sin(k * Math.PI * 0.5) + 0.1 : 1; if (this.litT > 1.2) this.litT = -1; }
    this.scale += (target - this.scale) * Math.min(1, dt * 5);
    let sx = 1, sy = 1, hop = 0, rz = 0;
    if (st.lit && !st.asleep) {
      // Dancing: sways, wiggles; bigger flames hop.
      rz = Math.sin(t * 5.5) * 0.14;
      sy = 1 + Math.sin(t * 9) * 0.07; sx = 1 - Math.sin(t * 9) * 0.04;
      if (st.size >= 3) hop = Math.max(0, Math.sin(t * 5.5 * 2)) * 0.06 * st.size;
    } else if (st.asleep) {
      sy = 1 + Math.sin(t * 1.6) * 0.1; // slow breathing
    } else {
      sy = 1 + Math.sin(t * 3) * 0.05;
    }
    if (this.hicT >= 0) { this.hicT += dt; if (this.hicT > 0.4 && this.hicT < 0.62) { hop += 0.35; sy *= 1.15; } if (this.hicT > 0.9) this.hicT = -1; }
    if (this.sneezeT >= 0) {
      this.sneezeT += dt;
      const k = this.sneezeT;
      if (k < 0.9) { sy *= 1 + k * 0.45; sx *= 1 - k * 0.2; rz = -k * 0.25; } // ah… ah…
      else if (k < 1.15) { sy *= 0.6; sx *= 1.35; rz = 0.3; if (this.pendingSneeze) this._launch(); } // ATCHOUM
      else if (k > 1.5) this.sneezeT = -1;
    }
    g.scale.set(this.scale * sx, this.scale * sy, this.scale * sx);
    g.position.y = hop;
    g.rotation.z = rz;
    // Colour: rainbow, sleepy blue, dark ember when unlit.
    if (!st.lit) this.mat.color.setRGB(0.75, 0.3, 0.2);
    else if (st.asleep) this.mat.color.setRGB(0.45, 0.55, 1);
    else if (st.rainbow) this.mat.color.setHSL((t * 0.25) % 1, 0.9, 0.7);
    else this.mat.color.setRGB(0.92, 0.92, 0.92);
    // Eyes: blink now and then, closed while sleeping.
    this.blink -= dt;
    if (this.blink < -0.12) this.blink = 2 + Math.random() * 3;
    this.face.scale.y = st.asleep ? 0.12 : this.blink < 0 ? 0.15 : 1;
    // The dog's hat: now and then he spins it.
    if (this.dogHat) { this.hatSpinT += dt; const c = this.hatSpinT % 7; this.dogHat.rotation.y = c < 1 ? c * Math.PI * 4 : 0; this.dogHat.position.y = c < 1 ? Math.sin(c * Math.PI) * 0.15 : 0; }
    // Stars: fly in an arc, then bob and spin on the ground; walk into one to pick it up.
    if (this.starList.length) {
      const p = this.s.player.position, d = this._dummy;
      for (const s of this.starList) {
        if (s.got) { d.position.set(0, -50, 0); d.scale.setScalar(0.001); }
        else {
          if (!s.landed) {
            s.t = Math.min(1, s.t + dt / 1.1);
            d.position.lerpVectors(s.from, s.to, s.t);
            d.position.y += Math.sin(s.t * Math.PI) * 3.2;
            if (s.t >= 1) { s.landed = true; this.s.particleBurst(s.to, '#ffe08a', 10); }
          } else {
            d.position.copy(s.to);
            d.position.y += Math.sin(t * 3 + s.i) * 0.12;
            if (!this.s.inputLocked && Math.hypot(p.x - s.to.x, p.z - s.to.z) < 1.2) { s.got = true; this.s.particleBurst(s.to, '#ffd34a', 16); this.onStar?.(s); }
          }
          d.rotation.set(0, t * 2.5 + s.i, 0);
          d.scale.setScalar(1);
        }
        d.updateMatrix();
        this.stars.setMatrixAt(s.i, d.matrix);
      }
      this.stars.count = this.starList.length;
      this.stars.instanceMatrix.needsUpdate = true;
      if (this.starList.every((s) => s.got)) this.stars.visible = false;
    }
  }
}
