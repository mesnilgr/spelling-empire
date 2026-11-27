// The mine cart (J8). Session 1: next to the old mine, a mine cart waits at its little station. Ride it
// round line 1: at each of the three points (aiguillages) the cart stops and the child picks the word
// that is spelled right between two signs; the right track goes on, the wrong one is a little detour
// into the bats' cave ("Hiii!") and back to the points. At the end, the diamond cave: a word fills the
// cart with diamonds. Three trips win the miner's hard hat (costume).
// Session 2: line 2 opens, to the crystal cave, with a big jump over the river (in slow motion) and gold
// nuggets to touch on the way. Three trips turn the cart into gold. The dog rides along, ears in the
// wind; a horn button goes "tut-tut".
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Between the old mine and the river, round the camp. Line 2 crosses line 1 on a bridge, jumps over
// the river and runs north along the foot of the hills on the other bank, to the crystal cave.
export const STATION = { x: -45, z: -41.3 }; // line 1 starts here, heading west
export const STATION2 = { x: -45, z: -43.1 }; // line 2, on the siding just north of it
export const GATE = { x: -46.6, z: -44.5 }; // the sign of line 2 (explains itself until part 2)
export const OLD_CART = { x: -25.6, z: -39.4 }; // an old forgotten cart by the mine (Cocotte, J8)
export const RIDES1 = 3, RIDES2 = 3, NUGGETS = 6;
const LINE1 = [[-45, -41.3], [-50, -41.6], [-53.3, -45], [-53.6, -51], [-51, -56.3], [-45, -57.8], [-40.2, -55.5], [-38.6, -49.5], [-39, -44.5], [-41.5, -41.6]];
const LINE2 = [[-45, -43.1], [-50, -43.2], [-54.4, -43.3], [-61.4, -43.4], [-62.8, -46.5], [-63.2, -50.5], [-64.2, -53.2], [-66, -54.3]];

export const MX = {
  fr: {
    name: 'Le wagonnet de la mine', label: '🛒 Wagonnet', gate: '🔮 Ligne 2',
    wake: 'Tut-tut ! Le wagonnet de la mine se réveille ! En voiture, accroche-toi bien !',
    board: 'En voiture ! Accroche-toi bien !',
    dog: 'Ouaf ! Ton chien saute dans le wagon, les oreilles au vent !',
    forkTitle: 'Aiguillage !', forkInstr: 'Quel mot est bien écrit ?', forkInstrLetter: 'Quelle est la bonne lettre ?',
    forkSay: (w) => `Aiguillage ! Quel mot est bien écrit ? ${w}`,
    forkSayLetter: (w) => `Aiguillage ! Trouve la bonne lettre. ${w}`,
    good: ['Bonne voie !', 'Bien vu ! En avant !', 'C’est la bonne voie !', 'Bravo ! Le wagonnet repart !'],
    bats: 'Hiii ! Hiii ! Oups, la grotte des chauves-souris ! On retourne à l’aiguillage !',
    batFloat: 'Hiii !',
    again: 'Regarde bien les deux panneaux…',
    treasureTitle: 'Le trésor de diamants', treasureInstr: 'Les diamants ! Épelle ce mot pour remplir ton wagon !',
    treasure: (k, n) => `Des diamants plein le wagon ! Voyage ${k} sur ${n}.`,
    helmet: 'Trois voyages ! Tu es un vrai mineur : voici ton casque de mineur !',
    helmetSay: 'Trois voyages ! Tu es un vrai mineur : voici ton casque de mineur ! À ton prochain retour, la ligne 2 ouvre jusqu’à la grotte de cristal !',
    station: 'Retour à la gare ! Touche le wagonnet pour un autre voyage.',
    partTwo: 'La ligne 2 du wagonnet est ouverte ! Elle va jusqu’à la grotte de cristal, avec un grand saut ! Suis la flèche !',
    gateLater: 'Ici, c’est la ligne 2, vers la grotte de cristal. Elle ouvre à ton prochain retour ! D’abord, fais trois voyages jusqu’aux diamants : monte dans le wagonnet !',
    gateOpen: 'La ligne 2 est ouverte ! Monte dans le wagonnet et choisis la ligne 2.',
    pickLine: 'Quelle ligne ?', line1: '💎 Ligne 1 : les diamants', line2: '🔮 Ligne 2 : la grotte de cristal',
    pickSay: 'Quelle ligne ? La ligne 1 va aux diamants, la ligne 2 va à la grotte de cristal.',
    jump: 'Waouh ! Le grand saut !', jumpFloat: 'Waouh !',
    nuggetHint: 'Touche les pépites d’or pendant le trajet !', nugget: 'Une pépite !',
    crystalTitle: 'La grotte de cristal', crystalInstr: 'La grotte de cristal ! Épelle ce mot pour prendre un cristal !',
    crystal: (k, n, g) => `Un cristal ! Voyage ${k} sur ${n}. ${g ? `Et ${g} pépite${g > 1 ? 's' : ''} !` : ''}`,
    gold: 'Trois voyages sur la ligne 2 ! Ton wagonnet devient tout doré !',
    back: 'Pfiou ! Le wagonnet te ramène à la gare.',
    horn: 'Tut-tut !',
    notYet: 'va à la mine : le wagonnet t’attend !',
    lines1: (k, n) => `💎 Voyages jusqu’aux diamants : ${k}/${n}`,
    lines2: (k, n, g) => `🔮 Ligne 2 : ${k}/${n} voyages · pépites : ${g}`,
  },
  en: {
    name: 'The mine cart', label: '🛒 Mine cart', gate: '🔮 Line 2',
    wake: 'Toot-toot! The mine cart wakes up! All aboard, hold on tight!',
    board: 'All aboard! Hold on tight!',
    dog: 'Woof! Your dog jumps into the cart, ears in the wind!',
    forkTitle: 'Points!', forkInstr: 'Which word is spelled right?', forkInstrLetter: 'Which is the right letter?',
    forkSay: (w) => `Points! Which word is spelled right? ${w}`,
    forkSayLetter: (w) => `Points! Find the right letter. ${w}`,
    good: ['Right track!', 'Well spotted! Off we go!', 'That is the right track!', 'Great! The cart sets off again!'],
    bats: 'Eeek! Eeek! Oops, the bats’ cave! Back to the points!',
    batFloat: 'Eeek!',
    again: 'Look closely at the two signs…',
    treasureTitle: 'The diamond treasure', treasureInstr: 'Diamonds! Spell this word to fill your cart!',
    treasure: (k, n) => `A cart full of diamonds! Trip ${k} of ${n}.`,
    helmet: 'Three trips! You are a real miner: here is your miner’s hard hat!',
    helmetSay: 'Three trips! You are a real miner: here is your miner’s hard hat! Next time you come back, line 2 opens to the crystal cave!',
    station: 'Back at the station! Touch the cart for another trip.',
    partTwo: 'Line 2 of the mine cart is open! It goes to the crystal cave, with a big jump! Follow the arrow!',
    gateLater: 'This is line 2, to the crystal cave. It opens next time you come back! First, make three trips to the diamonds: get in the mine cart!',
    gateOpen: 'Line 2 is open! Get in the mine cart and choose line 2.',
    pickLine: 'Which line?', line1: '💎 Line 1: the diamonds', line2: '🔮 Line 2: the crystal cave',
    pickSay: 'Which line? Line 1 goes to the diamonds, line 2 goes to the crystal cave.',
    jump: 'Wow! The big jump!', jumpFloat: 'Wow!',
    nuggetHint: 'Touch the gold nuggets on the way!', nugget: 'A nugget!',
    crystalTitle: 'The crystal cave', crystalInstr: 'The crystal cave! Spell this word to take a crystal!',
    crystal: (k, n, g) => `A crystal! Trip ${k} of ${n}. ${g ? `And ${g} nugget${g > 1 ? 's' : ''}!` : ''}`,
    gold: 'Three trips on line 2! Your mine cart turns all gold!',
    back: 'Phew! The cart takes you back to the station.',
    horn: 'Toot-toot!',
    notYet: 'go to the mine: the cart is waiting for you!',
    lines1: (k, n) => `💎 Trips to the diamonds: ${k}/${n}`,
    lines2: (k, n, g) => `🔮 Line 2: ${k}/${n} trips · nuggets: ${g}`,
  },
};

// A word with one plausible mistake (for the signs at the points): the mistakes children make
// (sounds written another way, a double letter, a silent letter), never the right word.
const FR_RULES = [
  [/eau/, 'o'], [/au/, 'o'], [/ai/, 'è'], [/ei/, 'è'], [/er$/, 'é'], [/é$/, 'er'], [/ph/, 'f'], [/qu/, 'k'],
  [/an/, 'en'], [/en/, 'an'], [/ain/, 'in'], [/([^aeo])in/, '$1ain'], [/ss/, 's'], [/([aeiouy])s([aeiouy])/, '$1z$2'],
  [/([lnmtpr])\1/, '$1'], [/([aeiou])([tlnmp])([aeiou])/, '$1$2$2$3'], [/([^aeiouy])[tdsx]$/, '$1'], [/oi/, 'oa'],
  [/ou/, 'u'], [/gn/, 'ni'], [/ch/, 'sh'], [/c([aou])/, 'k$1'], [/g([ei])/, 'j$1'], [/ç/, 's'], [/è/, 'ai'], [/é/, 'è'],
];
const EN_RULES = [
  [/ee/, 'ea'], [/ea/, 'ee'], [/ck/, 'k'], [/ph/, 'f'], [/([^aeiou])e$/, '$1'], [/([lnmtpsr])\1/, '$1'], [/([aeiou])([tlnmp])([aeiou])/, '$1$2$2$3'],
  [/c([aou])/, 'k$1'], [/y$/, 'ie'], [/ou/, 'ow'], [/oo/, 'u'], [/igh/, 'i'], [/wh/, 'w'], [/kn/, 'n'],
];
const LOOKALIKE = { b: 'd', d: 'b', p: 'q', q: 'p', m: 'n', n: 'm', u: 'n', a: 'o', o: 'a', e: 'a', i: 'l', l: 'i', s: 'z', z: 's', f: 't', t: 'f', v: 'w', w: 'v', c: 'k', k: 'c', r: 'l', g: 'j', j: 'g', h: 'n', x: 'k', y: 'i' };
export function misspell(word, lang = 'fr', rnd = Math.random) {
  const w = String(word);
  if (w.length === 1) return LOOKALIKE[w.toLowerCase()] ?? (w === 'é' ? 'e' : 'a');
  const rules = [...(lang === 'en' ? EN_RULES : FR_RULES)].sort(() => rnd() - 0.5);
  for (const [re, to] of rules) { const out = w.replace(re, to); if (out !== w && out.replace(/ /g, '').length) return out; }
  // Short syllables and the rest: another vowel, or two letters swapped.
  const vowels = 'aeiou', idx = [...w].map((c, i) => (vowels.includes(c) ? i : -1)).filter((i) => i >= 0);
  if (idx.length) { const i = idx[Math.floor(rnd() * idx.length)], c = w[i], n = vowels[(vowels.indexOf(c) + 1 + Math.floor(rnd() * 4)) % 5]; return w.slice(0, i) + n + w.slice(i + 1); }
  const i = Math.max(0, Math.min(w.length - 2, Math.floor(w.length / 2) - 1));
  const sw = w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2);
  return sw !== w ? sw : `${w}e`;
}

function colorize(g, c) {
  const n = g.attributes.position.count, arr = new Float32Array(n * 3), col = new THREE.Color(c);
  for (let i = 0; i < n; i++) { arr[i * 3] = col.r; arr[i * 3 + 1] = col.g; arr[i * 3 + 2] = col.b; }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  if (g.attributes.uv) g.deleteAttribute('uv');
  return g;
}
function box(w, h, d, c, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const g = new THREE.BoxGeometry(w, h, d).toNonIndexed();
  if (rz) g.rotateZ(rz);
  if (rx) g.rotateX(rx);
  if (ry) g.rotateY(ry);
  g.translate(x, y, z);
  return colorize(g, c);
}
// A box from a to b (a beam, a rail): width w, height h.
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0), _v = new THREE.Vector3();
function beam(a, b, w, h, c) {
  const len = a.distanceTo(b);
  const g = new THREE.BoxGeometry(w, h, len + 0.02).toNonIndexed();
  _v.subVectors(b, a).normalize();
  _m.lookAt(new THREE.Vector3(), _v, Math.abs(_v.y) > 0.99 ? new THREE.Vector3(1, 0, 0) : _up);
  _q.setFromRotationMatrix(_m);
  g.applyQuaternion(_q);
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  return colorize(g, c);
}
function merge(geos) { const g = mergeGeometries(geos); geos.forEach((x) => x.dispose()); return g; }
const MAT = (o = {}) => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, ...o });
function mesh(geos, mat = MAT()) { const m = new THREE.Mesh(merge(geos), mat); m.castShadow = true; m.userData.dynamic = true; return m; }

// A path: points every ~0.5 m with their distance along it (pos and direction at any distance).
function samplePath(pts) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  return { pts, cum, len: cum[cum.length - 1] };
}
function posAt(path, s, out = new THREE.Vector3()) {
  const { pts, cum } = path;
  s = Math.max(0, Math.min(path.len, s));
  let lo = 0, hi = cum.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cum[mid] <= s) lo = mid; else hi = mid; }
  const k = (s - cum[lo]) / Math.max(1e-6, cum[hi] - cum[lo]);
  return out.lerpVectors(pts[lo], pts[hi], k);
}
function dirAt(path, s, out = new THREE.Vector3()) {
  const a = posAt(path, s - 0.4), b = posAt(path, s + 0.4);
  return out.subVectors(b, a).normalize();
}

const WOOD = 0x7a5232, WOOD_D = 0x553820, RAIL = 0x9aa0a8, ROCK = 0x7d7975, ROCK_D = 0x5c5854, DARK = 0x0d0b0a;

export class MineCart {
  constructor(scene3D) {
    const s = this.s = scene3D;
    this.g = new THREE.Group();
    this.g.userData.dynamic = true;
    s.scene.add(this.g);
    const ground = (x, z) => s.groundAt(x, z);
    // The two lines: smooth curves, a little above the ground on wooden trestles, with hills.
    this.lines = [this._line(LINE1, true, 1), this._line(LINE2, false, 2)];
    const L1 = this.lines[0], L2 = this.lines[1];
    // Line 1: three points, the diamond cave, then back to the station.
    L1.forks = [0.36, 0.5, 0.64].map((f) => this._fork(L1, f * L1.len, LINE1));
    L1.end = 0.8 * L1.len;
    L1.stops = [...L1.forks.map((f, k) => ({ s: f.s, fork: k })), { s: L1.end, end: true }, { s: L1.len - 0.1, station: true }];
    // Line 2: a point, two more points after the big jump over the river, the crystal cave at the end.
    // The big jump: from the east bank to the west bank of the river; then two points.
    L2.gap = { s0: this._sAtX(L2, -54.9), s1: this._sAtX(L2, -61.2) };
    L2.forks = [L2.gap.s1 + 4.2, L2.gap.s1 + 8.6].map((s) => this._fork(L2, s, LINE2));
    L2.end = L2.len - 0.1;
    L2.stops = [...L2.forks.map((f, k) => ({ s: f.s, fork: k })), { s: L2.end, end: true }];
    // Gold nuggets: one before the jump, two in the air over the river, three along the hills.
    const g0 = L2.gap.s0, g1 = L2.gap.s1;
    L2.nuggets = [g0 - 4, g0 + (g1 - g0) * 0.35, g0 + (g1 - g0) * 0.7, g1 + 2.2, g1 + 6.6, L2.len - 2.2].map((s, i) => ({ s, side: [1, -1, 1, 1, 1, 1][i] }));
    this._shapeHeights(L1); this._shapeHeights(L2);
    for (const f of L1.forks) this._spurHeights(f, L1);
    for (const f of L2.forks) this._spurHeights(f, L2);
    this.g.add(this._buildTrack(L1), this._buildTrack(L2));
    // Rocks: the caves at the end of each detour, the diamond and crystal caves, the river piers, the
    // station platform, the old cart. One mesh; the glowing gems in another.
    this.g.add(this._buildRocks(ground));
    this.g.add(this._buildGems(ground));
    // The cart (vertex colours; the material turns gold in part 2) and its horn.
    this.cartMat = MAT({ roughness: 0.55, metalness: 0.25 });
    this.cart = this._buildCart();
    this.g.add(this.cart);
    this.home = this._stationPose(0);
    this._placeCart(this.home);
    this.obj = s._addInteractable({ kind: 'minecart', worldPos: this.home.p.clone(), iconY: 2.2, reach: 3.2, hitRadius: 1.2 });
    this.gateObj = s._addInteractable({ kind: 'minegate', worldPos: new THREE.Vector3(GATE.x, ground(GATE.x, GATE.z), GATE.z), iconY: 2.0, reach: 2.6, hitRadius: 1.0 });
    s.collidables.push({ x: OLD_CART.x, z: OLD_CART.z, r: 0.7 });
    // Bats (one instanced mesh) and gold nuggets (another).
    this.bats = new THREE.InstancedMesh(this._batGeo(), MAT({ roughness: 0.9 }), 8);
    this.bats.frustumCulled = false; this.bats.userData.dynamic = true;
    this.g.add(this.bats);
    this.batT = -1; this.batAt = new THREE.Vector3();
    this.nugMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.26, 0), new THREE.MeshStandardMaterial({ color: 0xffc63a, emissive: 0xb07a00, emissiveIntensity: 0.7, metalness: 0.7, roughness: 0.3, flatShading: true }), NUGGETS);
    this.nugMesh.frustumCulled = false; this.nugMesh.userData.dynamic = true;
    this.g.add(this.nugMesh);
    this.nugObjs = L2.nuggets.map((n, i) => {
      const p = this._nugPos(n);
      const o = s._addInteractable({ kind: 'nugget', nugget: i, worldPos: p.clone().setY(p.y - 0.35), iconY: 0.7, reach: 9, hitRadius: 1.3 });
      o.active = false; o.iconHolder.visible = false;
      return o;
    });
    this.nugGot = new Set();
    this.ride = null; this.riding = false; this.speedK = 1; this.t = 0; this.gold = false; this.gateOpen = false;
    this._d = new THREE.Object3D();
    this._layoutBats(); this._layoutNuggets();
  }

  // A smooth line through the control points, sampled every ~0.5 m (y filled in later).
  _line(ctrl, closed, id) {
    const curve = new THREE.CatmullRomCurve3(ctrl.map(([x, z]) => new THREE.Vector3(x, 0, z)), closed, 'centripetal');
    const len = curve.getLength(), n = Math.ceil(len / 0.5);
    const pts = curve.getSpacedPoints(n);
    return { id, closed, ...samplePath(pts) };
  }
  _sAtX(L, x) { let best = 0, bd = 1e9; L.pts.forEach((p, i) => { const d = Math.abs(p.x - x) + (p.z < -48 ? 99 : 0); if (d < bd) { bd = d; best = L.cum[i]; } }); return best; }
  // A point: the detour goes off to one side, curving away, into a little cave of bats.
  _fork(line, s, ctrl0) {
    const p = posAt(line, s), d = dirAt(line, s), n = new THREE.Vector3(-d.z, 0, d.x);
    // Away from the middle of the line (the detour never cuts across the loop).
    const cx = ctrl0.reduce((a, q) => a + q[0], 0) / ctrl0.length, cz = ctrl0.reduce((a, q) => a + q[1], 0) / ctrl0.length;
    const side = n.x * (p.x - cx) + n.z * (p.z - cz) >= 0 ? 1 : -1;
    n.multiplyScalar(side);
    const ctrl = [p.clone(), p.clone().addScaledVector(d, 1.6).addScaledVector(n, 0.5), p.clone().addScaledVector(d, 2.6).addScaledVector(n, 1.9), p.clone().addScaledVector(d, 3.0).addScaledVector(n, 3.4)];
    const curve = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal');
    const spur = samplePath(curve.getSpacedPoints(Math.ceil(curve.getLength() / 0.5)));
    const end = spur.pts[spur.pts.length - 1], dirEnd = new THREE.Vector3().subVectors(end, spur.pts[spur.pts.length - 3]).normalize();
    return { s, side, spur, cave: end.clone().addScaledVector(dirEnd, 1.3), caveDir: dirEnd };
  }
  // Heights: just above the ground at the station and the caves, gentle hills elsewhere, a ramp
  // before the river jump; flat at the points.
  _shapeHeights(line) {
    const s3 = this.s, n = line.pts.length;
    const base = line.pts.map((p) => { let h = -Infinity; for (const [dx, dz] of [[0, 0], [1.2, 0], [-1.2, 0], [0, 1.2], [0, -1.2]]) h = Math.max(h, s3.groundAt(p.x + dx, p.z + dz)); return h; });
    const raw = line.pts.map((p, i) => {
      const s = line.cum[i];
      let lift = 0.9 + 1.1 * (0.5 - 0.5 * Math.cos((s / 13) * Math.PI * 2));
      const nearStop = Math.min(...line.stops.filter((st) => st.fork !== undefined || st.end).map((st) => Math.abs(st.s - s)));
      if (nearStop < 2) lift = Math.min(lift, 1.0 + nearStop * 0.15);
      const fromStation = Math.min(s, line.closed ? line.len - s : 99);
      if (fromStation < 6) lift = Math.min(lift, 0.32 + fromStation * 0.12);
      if (line.gap) {
        const { s0, s1 } = line.gap;
        if (s > s0 - 8 && s <= s0) lift = Math.max(lift, 1.4 + (1 - (s0 - s) / 8) * 3.0);
        if (s > s0 && s < s1) lift = 4.4 - Math.sin(((s - s0) / (s1 - s0)) * Math.PI) * 0.5;
        if (s >= s1 && s < s1 + 4) lift = Math.max(lift, 3.4 - (s - s1) / 4 * 2.2);
      }
      if (!line.closed && s > line.len - 5) lift = Math.min(lift, 0.4 + (line.len - s) * 0.12);
      return base[i] + lift;
    });
    // Smooth (a cart does not like steps).
    let ys = raw;
    for (let it = 0; it < 4; it++) ys = ys.map((y, i) => { const a = ys[Math.max(0, i - 2)], b = ys[Math.min(n - 1, i + 2)]; return Math.max(raw[i] - 0.4, (a + ys[i] * 2 + b) / 4); });
    line.pts.forEach((p, i) => { p.y = ys[i]; });
    line.base = base;
  }
  _spurHeights(f, line) {
    const pts = f.spur.pts, y0 = posAt(line, f.s).y, n = pts.length;
    pts.forEach((p, i) => { const k = i / (n - 1), g = this.s.groundAt(p.x, p.z); p.y = Math.max(g + 0.3, y0 + (g + 0.3 - y0) * k); });
    const b = pts[0]; // start where the line is
    b.y = y0;
  }
  // Sleepers, two rails and trestles down to the ground; a lever at each point. One mesh per line.
  _buildTrack(line) {
    const geos = [], s3 = this.s;
    const lay = (path, from = 0, to = path.len, trestles = true) => {
      const side = new THREE.Vector3();
      for (let s = from; s < to; s += 0.85) {
        if (line.gap && path === line && s > line.gap.s0 && s < line.gap.s1) continue;
        const p = posAt(path, s), d = dirAt(path, s);
        geos.push(beam(p.clone().addScaledVector(new THREE.Vector3(-d.z, 0, d.x), -0.62).setY(p.y - 0.05), p.clone().addScaledVector(new THREE.Vector3(-d.z, 0, d.x), 0.62).setY(p.y - 0.05), 0.22, 0.08, (Math.round(s / 0.85) % 3) ? WOOD : WOOD_D));
      }
      for (const off of [-0.42, 0.42]) {
        let prev = null;
        for (let s = from; s <= to + 0.01; s += 1.4) {
          const inGap = line.gap && path === line && s > line.gap.s0 && s < line.gap.s1;
          const p = posAt(path, s), d = dirAt(path, s);
          side.set(-d.z, 0, d.x);
          const q = p.clone().addScaledVector(side, off); q.y += 0.02;
          if (prev && !inGap) geos.push(beam(prev, q, 0.07, 0.08, RAIL));
          prev = inGap ? null : q;
        }
      }
      if (!trestles) return;
      for (let s = from + 1; s < to; s += 2.6) {
        if (line.gap && path === line && s > line.gap.s0 - 0.5 && s < line.gap.s1 + 0.5) continue;
        const p = posAt(path, s), d = dirAt(path, s);
        side.set(-d.z, 0, d.x);
        const g0 = s3.groundAt(p.x, p.z);
        if (p.y - g0 < 0.45) continue;
        for (const off of [-0.5, 0.5]) {
          const top = p.clone().addScaledVector(side, off); top.y -= 0.09;
          geos.push(beam(top, top.clone().setY(g0), 0.14, 0.14, WOOD_D));
        }
        geos.push(beam(p.clone().addScaledVector(side, -0.55).setY(p.y - 0.3), p.clone().addScaledVector(side, 0.55).setY(p.y - 0.3), 0.1, 0.12, WOOD));
      }
    };
    lay(line);
    for (const f of line.forks) {
      lay(f.spur, 0, f.spur.len, true);
      // The lever by the points.
      const p = posAt(line, f.s - 1.2), d = dirAt(line, f.s), sd = new THREE.Vector3(-d.z, 0, d.x).multiplyScalar(-f.side);
      const b = p.clone().addScaledVector(sd, 1.0);
      const g0 = s3.groundAt(b.x, b.z);
      geos.push(beam(b.clone().setY(g0), b.clone().setY(p.y + 0.2), 0.16, 0.16, WOOD_D));
      geos.push(box(0.3, 0.2, 0.3, 0x5a5e66, b.x, p.y + 0.25, b.z), beam(b.clone().setY(p.y + 0.3), b.clone().setY(p.y + 1.0).addScaledVector(d, 0.3), 0.07, 0.07, 0x4a4e56), box(0.16, 0.16, 0.16, 0xd8302a, b.x + d.x * 0.32, p.y + 1.04, b.z + d.z * 0.32));
    }
    const m = new THREE.Mesh(merge(geos), MAT({ roughness: 0.8 }));
    m.castShadow = false; m.receiveShadow = true; m.userData.dynamic = true; // (no shadow pass: iPad budget)
    return m;
  }
  _stationPose(line) { const L = this.lines[line]; return { p: posAt(L, 0.05).clone(), d: dirAt(L, 0.6).clone() }; }

  // A rock mound with a dark mouth facing `dir` (where the track comes in).
  _cave(geos, c, dir, size, ground, mouthColor = DARK) {
    const yaw = Math.atan2(dir.x, dir.z), g = ground(c.x, c.z);
    const put = (w, h, d, col, lx, ly, lz) => { const x = c.x + lx * Math.cos(yaw) + lz * Math.sin(yaw), z = c.z - lx * Math.sin(yaw) + lz * Math.cos(yaw); geos.push(box(w, h, d, col, x, g + ly, z, 0, yaw)); };
    const S = size;
    put(3.6 * S, 2.6 * S, 2.6 * S, ROCK, 0, 1.3 * S, 0.9 * S);
    put(2.6 * S, 1.2 * S, 2.0 * S, ROCK_D, 0.3 * S, 3.0 * S, 1.0 * S);
    put(1.3 * S, 1.6 * S, 1.6 * S, ROCK_D, -1.9 * S, 0.8 * S, 0.4 * S);
    put(1.2 * S, 1.3 * S, 1.4 * S, ROCK, 1.9 * S, 0.65 * S, 0.5 * S);
    put(1.5 * S, 1.7 * S, 0.12, mouthColor, 0, 0.85 * S, -0.42 * S);
    put(1.8 * S, 0.25, 0.3, WOOD_D, 0, 1.75 * S, -0.45 * S); // timbers round the mouth
    put(0.22, 1.75 * S, 0.3, WOOD_D, -0.85 * S, 0.88 * S, -0.45 * S);
    put(0.22, 1.75 * S, 0.3, WOOD_D, 0.85 * S, 0.88 * S, -0.45 * S);
  }
  _buildRocks(ground) {
    const geos = [];
    for (const L of this.lines) for (const f of L.forks) this._cave(geos, f.cave, f.caveDir, 0.65, ground);
    // The diamond cave (line 1) and the crystal cave (line 2): bigger, by the track.
    const L1 = this.lines[0], L2 = this.lines[1];
    this.diamondAt = this._sideOf(L1, L1.end, -1, 3.2);
    this._cave(geos, this.diamondAt, this._toTrack(L1, L1.end, this.diamondAt), 1.15, ground, 0x1a2a3a);
    this.crystalAt = posAt(L2, L2.len).clone().addScaledVector(dirAt(L2, L2.len - 0.5), 2.4);
    this._cave(geos, this.crystalAt, dirAt(L2, L2.len - 0.5), 1.3, ground, 0x2a1a3a);
    // The big jump over the river: a stone pier under the end of each ramp.
    for (const sg of [L2.gap.s0 - 0.6, L2.gap.s1 + 0.6]) {
      const q = posAt(L2, sg), gq = ground(q.x, q.z);
      geos.push(box(1.6, q.y - gq - 0.1, 1.6, ROCK_D, q.x, gq + (q.y - gq - 0.1) / 2, q.z), box(1.9, 0.3, 1.9, ROCK, q.x, q.y - 0.25, q.z));
    }
    // The station: a wooden platform between the two lines, a roof, a lantern; the barrier of line 2.
    const st = this._stationPose(0), sy = ground(STATION.x, STATION.z);
    const sd = st.d, syaw = Math.atan2(sd.x, sd.z), sx = new THREE.Vector3(-sd.z, 0, sd.x);
    const px = STATION.x + sx.x * -1.2 + sd.x * 1.5, pz = STATION.z + sx.z * -1.2 + sd.z * 1.5;
    geos.push(box(1.2, 0.3, 5, WOOD, px, sy + 0.15, pz, 0, syaw));
    for (const k of [-2, 2]) { geos.push(box(0.16, 2.4, 0.16, WOOD_D, px + sd.x * k, sy + 1.2, pz + sd.z * k)); }
    geos.push(box(1.8, 0.14, 5.4, 0xa8402a, px, sy + 2.45, pz, 0, syaw));
    geos.push(box(0.9, 0.6, 0.08, 0xe8d8b0, px + sd.x * 0.2, sy + 1.95, pz + sd.z * 0.2, 0, syaw + Math.PI / 2));
    const gyy = ground(GATE.x, GATE.z);
    geos.push(box(0.14, 1.1, 0.14, WOOD_D, GATE.x, gyy + 0.55, GATE.z - 0.75), box(0.14, 1.1, 0.14, WOOD_D, GATE.x, gyy + 0.55, GATE.z + 0.75));
    geos.push(box(0.1, 0.16, 1.7, 0xd8302a, GATE.x, gyy + 0.95, GATE.z), box(0.12, 0.55, 0.7, 0x6a3aa8, GATE.x - 0.05, gyy + 1.45, GATE.z));
    // An old forgotten cart by the mine, tipped on its side (Cocotte hides in it on J8).
    const og = ground(OLD_CART.x, OLD_CART.z);
    geos.push(box(1.0, 0.55, 1.25, 0x5a5e66, OLD_CART.x, og + 0.42, OLD_CART.z, 0, 0.5, 0.35), box(0.84, 0.08, 1.05, 0x3a3226, OLD_CART.x + 0.08, og + 0.2, OLD_CART.z, 0, 0.5, 0.35));
    geos.push(box(0.12, 0.26, 0.26, 0x2a2a2a, OLD_CART.x + 0.55, og + 0.13, OLD_CART.z + 0.2), box(0.12, 0.26, 0.26, 0x2a2a2a, OLD_CART.x + 0.3, og + 0.13, OLD_CART.z - 0.6));
    const m = new THREE.Mesh(merge(geos), MAT({ roughness: 0.95 }));
    m.castShadow = true; m.receiveShadow = true; m.userData.dynamic = true;
    return m;
  }
  _sideOf(L, s, side, dist) { const p = posAt(L, s), d = dirAt(L, s); return p.clone().addScaledVector(new THREE.Vector3(-d.z, 0, d.x), side * dist); }
  _toTrack(L, s, c) { const p = posAt(L, s); return new THREE.Vector3(c.x - p.x, 0, c.z - p.z).normalize(); }
  // Diamonds (cyan) at the diamond cave, crystals (pink and purple) at the crystal cave.
  _buildGems(ground) {
    const geos = [];
    const cluster = (c, n, cols, r, h, seed) => {
      const g0 = ground(c.x, c.z);
      for (let i = 0; i < n; i++) {
        const a = seed + i * 2.399, rr = r * (0.3 + ((i * 37) % 10) / 14);
        const g = new THREE.OctahedronGeometry(0.22 + ((i * 13) % 5) * 0.05, 0).toNonIndexed();
        g.scale(1, h, 1); g.rotateZ(Math.sin(a) * 0.4);
        g.translate(c.x + Math.cos(a) * rr, g0 + 0.3 + ((i * 7) % 4) * 0.1, c.z + Math.sin(a) * rr);
        geos.push(colorize(g, cols[i % cols.length]));
      }
    };
    const L1 = this.lines[0];
    const dMouth = this.diamondAt.clone().lerp(posAt(L1, L1.end), 0.45);
    cluster(dMouth, 9, [0x5af0e6, 0x9af8ff, 0x3ad0d8], 1.1, 1.6, 1);
    cluster(this.crystalAt.clone().lerp(posAt(this.lines[1], this.lines[1].len), 0.5), 11, [0xff8ae0, 0xc08aff, 0xffc0f0], 1.4, 2.2, 3);
    const m = new THREE.Mesh(merge(geos), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.25, metalness: 0.1, emissive: 0x6a5aa0, emissiveIntensity: 0.55, flatShading: true }));
    m.userData.dynamic = true;
    return m;
  }
  // The cart: grey iron box with a wooden rim, four wheels, a lantern and a horn. One mesh.
  _buildCart() {
    const g = new THREE.Group();
    g.userData.dynamic = true;
    const body = new THREE.Mesh(merge([
      box(1.1, 0.62, 1.4, 0x6a7078, 0, 0.55, 0), box(1.16, 0.1, 1.46, 0x8a5a32, 0, 0.88, 0), box(0.94, 0.08, 1.24, 0x2a2a2e, 0, 0.83, 0),
      box(0.06, 0.4, 1.3, 0x5a5e66, -0.56, 0.55, 0), box(0.06, 0.4, 1.3, 0x5a5e66, 0.56, 0.55, 0),
      ...[[-0.52, -0.45], [0.52, -0.45], [-0.52, 0.45], [0.52, 0.45]].map(([x, z]) => box(0.12, 0.34, 0.34, 0x26262a, x, 0.2, z)),
      box(0.16, 0.2, 0.16, 0x3a3a3a, 0.4, 1.02, 0.66), box(0.12, 0.12, 0.12, 0xffd25a, 0.4, 1.02, 0.75), // lantern
      box(0.08, 0.08, 0.28, 0xd8a83a, -0.42, 1.0, 0.62, 0.3), box(0.16, 0.16, 0.08, 0xffc63a, -0.42, 1.06, 0.78), // horn
    ]), this.cartMat);
    body.castShadow = true;
    g.add(body);
    g.userData.body = body;
    return g;
  }
  _batGeo() {
    const B = 0x2a2030, W = 0x3a2a48, E = 0xff4a4a;
    return merge([box(0.18, 0.16, 0.22, B), box(0.42, 0.03, 0.2, W, -0.28, 0.02, 0, 0, 0, 0.25), box(0.42, 0.03, 0.2, W, 0.28, 0.02, 0, 0, 0, -0.25), box(0.04, 0.04, 0.02, E, -0.05, 0.03, 0.12), box(0.04, 0.04, 0.02, E, 0.05, 0.03, 0.12), box(0.05, 0.07, 0.04, B, -0.06, 0.11, 0.04), box(0.05, 0.07, 0.04, B, 0.06, 0.11, 0.04)]);
  }
  _nugPos(n) { const L = this.lines[1], p = posAt(L, n.s), d = dirAt(L, n.s); return p.clone().addScaledVector(new THREE.Vector3(-d.z, 0, d.x), n.side * 1.5).setY(p.y + 1.3); }
  _placeCart(pose, tilt = 0) {
    this.cart.position.copy(pose.p);
    const d = pose.d;
    this.cart.rotation.set(0, 0, 0);
    this.cart.rotation.order = 'YXZ';
    this.cart.rotation.y = Math.atan2(d.x, d.z);
    this.cart.rotation.x = -Math.asin(Math.max(-1, Math.min(1, d.y)));
    this.cart.rotation.z = tilt;
  }
  setGold(on) {
    this.gold = on;
    this.cartMat.color.set(on ? 0xffd34a : 0xffffff);
    this.cartMat.emissive.set(on ? 0x7a5200 : 0x000000);
    this.cartMat.metalness = on ? 0.75 : 0.25;
  }
  setGate(open) {
    this.gateOpen = open;
  }

  // ===== The ride =====
  start(line) {
    const L = this.lines[line];
    this.ride = { line, L, path: L, s: 0.05, v: 0, stage: 'go', stop: 0, spur: null, t: 0, jumped: false };
    this.riding = true;
    this.obj.active = false; this.obj.iconHolder.visible = false; if (this.obj.labelEl) this.obj.labelEl.style.display = 'none';
    this.nugGot = new Set();
    for (const o of this.nugObjs) { o.active = line === 1; }
    this._layoutNuggets();
    const p = this.cart.position.clone(); p.y += 1;
    for (const c of ['#ffd34a', '#ffffff', '#5af0e6']) this.s.particleBurst(p, c, 22);
  }
  // At the points: the right word goes on, the wrong one goes into the bats' cave and back.
  choose(ok) {
    const r = this.ride;
    if (!r || r.stage !== 'fork') return;
    if (ok) { r.stage = 'go'; r.stop++; r.v = 1.5; const p = this.cart.position.clone(); p.y += 1.2; this.s.particleBurst(p, '#ffd34a', 18); return; }
    r.stage = 'spurOut'; r.spur = r.L.forks[r.stop]; r.ss = 0; r.v = 0;
  }
  // After the word at the end: line 1 rolls back to the station, line 2 is taken back (magic).
  leaveEnd() {
    const r = this.ride;
    if (!r || r.stage !== 'end') return;
    if (r.line === 0) { r.stage = 'go'; r.stop++; r.v = 1.5; } else { r.stage = 'done'; this.finish(); }
  }
  finish() {
    const r = this.ride;
    this.ride = null; this.riding = false;
    this._placeCart(this.home);
    this.obj.active = true; this.obj.iconHolder.visible = true;
    for (const o of this.nugObjs) o.active = false;
    this._layoutNuggets();
    // The hero steps out onto the platform.
    const st = this.home, side = new THREE.Vector3(-st.d.z, 0, st.d.x);
    const x = st.p.x - side.x * 1.3 + st.d.x * 1.2, z = st.p.z - side.z * 1.3 + st.d.z * 1.2;
    this.s.teleport(x, z, Math.atan2(st.d.x, st.d.z));
    this.s.pet?.tamed && this.s.pet.catchUp();
    this.onFinish?.(r);
  }
  stop() { if (this.riding) this.finish(); }
  takeNugget(i) {
    if (!this.ride || this.ride.line !== 1 || this.nugGot.has(i)) return false;
    this.nugGot.add(i);
    this.nugObjs[i].active = false;
    const p = this._nugPos(this.lines[1].nuggets[i]);
    for (const c of ['#ffd34a', '#fff3a0']) this.s.particleBurst(p, c, 16);
    this._layoutNuggets();
    return true;
  }
  _cartPose(r) {
    if (r.spur) return { p: posAt(r.spur.spur, r.ss).clone(), d: dirAt(r.spur.spur, r.ss).clone() };
    const L = r.L;
    if (L.gap && r.s > L.gap.s0 && r.s < L.gap.s1) {
      const k = (r.s - L.gap.s0) / (L.gap.s1 - L.gap.s0), a = posAt(L, L.gap.s0), b = posAt(L, L.gap.s1);
      const p = a.clone().lerp(b, k); p.y += Math.sin(k * Math.PI) * 3.2;
      const d = new THREE.Vector3().subVectors(b, a).normalize(); d.y = Math.cos(k * Math.PI) * 0.5; d.normalize();
      return { p, d };
    }
    return { p: posAt(L, r.s).clone(), d: dirAt(L, r.s).clone() };
  }
  // Called instead of the hero's own movement while riding.
  rideStep(dt) {
    const r = this.ride, s = this.s;
    if (!r) return;
    s.autoWalk = null;
    const VMAX = 6.5 * this.speedK, ACC = 5 * this.speedK;
    r.t += dt;
    if (r.stage === 'go') {
      const st = r.L.stops[r.stop];
      const left = st ? st.s - r.s : 99;
      const inGap = r.L.gap && r.s > r.L.gap.s0 && r.s < r.L.gap.s1;
      if (inGap && !r.jumped) { r.jumped = true; this.onJump?.(); }
      if (!inGap && r.jumped && !r.landed && r.L.gap && r.s >= r.L.gap.s1) { r.landed = true; s.screenShake?.(0.25); this.onLand?.(); }
      const slow = inGap ? 0.32 : 1; // slow motion over the river
      r.v = Math.min(r.v + ACC * dt, VMAX, Math.sqrt(Math.max(0.3, 2 * ACC * 0.9 * left)) + 0.4);
      r.s += r.v * dt * slow;
      if (st && r.s >= st.s - 0.02) {
        r.s = st.s; r.v = 0;
        if (st.fork !== undefined) { r.stage = 'fork'; this.onFork?.(st.fork); }
        else if (st.end) { r.stage = 'end'; this.onEnd?.(r.line); }
        else if (st.station) { r.stage = 'done'; this.finish(); return; }
      }
    } else if (r.stage === 'spurOut') {
      r.v = Math.min(4 * this.speedK, r.v + ACC * dt);
      r.ss += r.v * dt;
      if (r.ss >= r.spur.spur.len - 0.6) { r.ss = r.spur.spur.len - 0.6; r.stage = 'bats'; r.bt = 0; this.batT = 0; this.batAt.copy(r.spur.cave).setY(posAt(r.spur.spur, r.ss).y + 0.6); this.onBats?.(); }
    } else if (r.stage === 'bats') {
      r.bt += dt;
      if (r.bt > 2.4) { r.stage = 'spurBack'; r.v = 0; }
    } else if (r.stage === 'spurBack') {
      r.v = Math.min(4 * this.speedK, r.v + ACC * dt);
      r.ss -= r.v * dt;
      if (r.ss <= 0) { r.ss = 0; r.spur = null; r.stage = 'fork'; this.onBack?.(r.stop); }
    }
    const pose = this._cartPose(r);
    const shake = r.stage === 'bats' ? Math.sin(r.t * 40) * 0.06 : (r.stage === 'go' && r.v > 3 ? Math.sin(r.t * 22) * 0.015 : 0);
    this._placeCart(pose, shake);
    // The hero stands in the cart (his legs hidden inside).
    const pl = s.player;
    pl.position.set(pose.p.x - pose.d.x * 0.2, pose.p.y + 0.32, pose.p.z - pose.d.z * 0.2);
    pl.rotation.y = Math.atan2(pose.d.x, pose.d.z);
    pl.userData.isMoving = false;
    s.playerVY = 0; s.onGround = true; s.lastGroundAt = s.clock.elapsedTime;
  }
  // The dog sits at the front of the cart, ears in the wind.
  seatDog(pet, t) {
    const m = pet.mesh, c = this.cart, d = new THREE.Vector3(Math.sin(c.rotation.y), 0, Math.cos(c.rotation.y));
    m.position.set(c.position.x + d.x * 0.42, c.position.y + 0.55, c.position.z + d.z * 0.42);
    m.rotation.y = c.rotation.y;
    const P = m.userData.parts;
    if (P) { P.head.rotation.z = Math.sin(t * 16) * 0.12; P.head.rotation.x = -0.15; P.tail.rotation.y = Math.sin(t * 18) * 0.7; P.body.rotation.x = 0; P.body.position.y = 0; }
    pet.obj.worldPos.copy(m.position);
    pet.obj.iconHolder.position.copy(m.position).add(new THREE.Vector3(0, pet.obj.iconY, 0));
    pet.obj.hit.position.copy(pet.obj.iconHolder.position).add(new THREE.Vector3(0, -0.35, 0));
  }
  _layoutBats() {
    const d = this._d, t = this.t, on = this.batT >= 0;
    this.bats.visible = on;
    for (let i = 0; i < 8; i++) {
      if (on) {
        const k = Math.min(1, this.batT / 0.5), a = i * 0.785 + t * (2.2 + (i % 3) * 0.4), r = (0.6 + (i % 4) * 0.35) * k + 0.2;
        const c = this.cart.position;
        const cx = this.batAt.x + (c.x - this.batAt.x) * Math.min(1, this.batT / 0.8), cz = this.batAt.z + (c.z - this.batAt.z) * Math.min(1, this.batT / 0.8);
        d.position.set(cx + Math.cos(a) * r, this.batAt.y + 0.8 + Math.sin(t * 6 + i) * 0.35 + (i % 3) * 0.3, cz + Math.sin(a) * r);
        d.rotation.set(0, -a, 0);
        d.scale.set(1 + Math.sin(t * 30 + i) * 0.5, 1, 1);
      } else { d.position.set(0, -60, 0); d.scale.setScalar(0.0001); }
      d.updateMatrix();
      this.bats.setMatrixAt(i, d.matrix);
    }
    this.bats.instanceMatrix.needsUpdate = true;
  }
  _layoutNuggets() {
    const d = this._d, show = this.ride?.line === 1;
    this.nugMesh.visible = show;
    this.lines[1].nuggets.forEach((n, i) => {
      if (show && !this.nugGot.has(i)) { d.position.copy(this._nugPos(n)); d.position.y += Math.sin(this.t * 3 + i) * 0.12; d.rotation.set(this.t * 1.3 + i, this.t * 2 + i, 0); d.scale.setScalar(1); } else { d.position.set(0, -60, 0); d.scale.setScalar(0.0001); }
      d.updateMatrix();
      this.nugMesh.setMatrixAt(i, d.matrix);
    });
    this.nugMesh.instanceMatrix.needsUpdate = true;
  }
  near(d = 9) { const p = this.s.player.position; return Math.hypot(p.x - STATION.x, p.z - STATION.z) < d; }
  update(dt) {
    this.t += dt;
    const p = this.s.player.position;
    this.g.visible = this.riding || Math.hypot(p.x - (-51), p.z - (-42)) < 38;
    if (!this.g.visible) return;
    if (this.batT >= 0) { this.batT += dt; if (this.batT > 3.2) this.batT = -1; this._layoutBats(); }
    else if (this.bats.visible) this._layoutBats();
    if (this.ride?.line === 1) this._layoutNuggets();
    if (!this.riding) {
      // The cart waits at the station, rocking a little; the lantern twinkles.
      this.cart.rotation.z = Math.sin(this.t * 1.6) * 0.01;
    }
  }
}
