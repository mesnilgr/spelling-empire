// The mine cart (J8, redone in v1.26.1 at the parent's request). On the island: the little station
// by the old mine, the cart and the mouth of the mine. Touch the cart: it rolls into the mine, and the
// mine is a world of its own, loaded apart (worlds.js, mineworld.js): tunnels, lanterns, bats, an
// underground lake, the diamond cave. The cart rides on its own and stops at barriers that open when
// the child spells a word (spelling only: no reading choices). Session 1: line 1, three trips to the
// diamond cave win the miner's hard hat. Session 2: line 2 to the crystal cave, with a big jump in
// slow motion and gold nuggets to touch; three trips turn the cart into gold. The dog rides along,
// ears in the wind; the horn button goes "tut-tut".
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const STATION = { x: -45, z: -41.3 }; // the cart waits here, facing the mouth of the mine (west)
export const MOUTH = { x: -51.6, z: -41.5 }; // the mouth of the mine, where the cart rolls in
export const GATE = { x: -46.6, z: -44.5 }; // the sign of line 2 (explains itself until part 2)
export const OLD_CART = { x: -25.6, z: -39.4 }; // an old forgotten cart by the mine (Cocotte, J8)
export const RIDES1 = 3, RIDES2 = 3, NUGGETS = 6;

export const MX = {
  fr: {
    name: 'Le wagonnet de la mine', label: '🛒 Wagonnet', gate: '🔮 Ligne 2',
    wake: 'Tut-tut ! Le wagonnet de la mine se réveille ! En voiture, on descend dans la mine !',
    board: 'En voiture ! On descend dans la mine !',
    loading: 'On descend dans la mine…', loadingBack: 'Le monte-charge remonte à la gare…',
    inMineFirst: 'Bienvenue dans la mine ! Le wagonnet roule tout seul. Devant chaque barrière, épelle le mot pour l’ouvrir !',
    inMine: 'Accroche-toi bien, le wagonnet repart dans la mine !',
    inMine2: 'En route pour la grotte de cristal ! Prépare-toi pour le grand saut !',
    dog: 'Ouaf ! Ton chien saute dans le wagon, les oreilles au vent !',
    barrierTitle: 'Une barrière !', barrierInstr: 'Épelle ce mot pour ouvrir la barrière !',
    barrierLead: 'Une barrière ! Épelle le mot pour l’ouvrir.', barrierLeadShort: 'Une barrière !',
    open: ['La barrière s’ouvre ! En avant !', 'Clac ! C’est ouvert, on repart !', 'Bravo ! Le wagonnet repart !', 'Hop ! La barrière se lève !'],
    bats: 'Hiii ! Hiii ! Les chauves-souris de la mine !', batFloat: 'Hiii !',
    descent: 'Wiii ! Ça descend !', lake: 'Oh ! Le lac souterrain qui brille !', lift: 'Le monte-charge te remonte !',
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
    horn: 'Tut-tut !',
    notYet: 'va à la mine : le wagonnet t’attend !',
    lines1: (k, n) => `💎 Voyages jusqu’aux diamants : ${k}/${n}`,
    lines2: (k, n, g) => `🔮 Ligne 2 : ${k}/${n} voyages · pépites : ${g}`,
  },
  en: {
    name: 'The mine cart', label: '🛒 Mine cart', gate: '🔮 Line 2',
    wake: 'Toot-toot! The mine cart wakes up! All aboard, down into the mine!',
    board: 'All aboard! Down into the mine!',
    loading: 'Down into the mine…', loadingBack: 'The lift goes back up to the station…',
    inMineFirst: 'Welcome to the mine! The cart rides on its own. At each barrier, spell the word to open it!',
    inMine: 'Hold on tight, the cart sets off into the mine!',
    inMine2: 'Off to the crystal cave! Get ready for the big jump!',
    dog: 'Woof! Your dog jumps into the cart, ears in the wind!',
    barrierTitle: 'A barrier!', barrierInstr: 'Spell this word to open the barrier!',
    barrierLead: 'A barrier! Spell the word to open it.', barrierLeadShort: 'A barrier!',
    open: ['The barrier opens! Off we go!', 'Clack! It is open, off we go!', 'Great! The cart sets off again!', 'Up goes the barrier!'],
    bats: 'Eeek! Eeek! The bats of the mine!', batFloat: 'Eeek!',
    descent: 'Wheee! Down we go!', lake: 'Oh! The glowing underground lake!', lift: 'The lift takes you back up!',
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
    horn: 'Toot-toot!',
    notYet: 'go to the mine: the cart is waiting for you!',
    lines1: (k, n) => `💎 Trips to the diamonds: ${k}/${n}`,
    lines2: (k, n, g) => `🔮 Line 2: ${k}/${n} trips · nuggets: ${g}`,
  },
};

// ===== Shared builders (the station here, the mine world in mineworld.js) =====
export function colorize(g, c) {
  const n = g.attributes.position.count, arr = new Float32Array(n * 3), col = new THREE.Color(c);
  for (let i = 0; i < n; i++) { arr[i * 3] = col.r; arr[i * 3 + 1] = col.g; arr[i * 3 + 2] = col.b; }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  if (g.attributes.uv) g.deleteAttribute('uv');
  return g;
}
export function box(w, h, d, c, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const g = new THREE.BoxGeometry(w, h, d).toNonIndexed();
  if (rz) g.rotateZ(rz);
  if (rx) g.rotateX(rx);
  if (ry) g.rotateY(ry);
  g.translate(x, y, z);
  return colorize(g, c);
}
// A box from a to b (a beam, a rail, a post): width w, height h.
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0), _v = new THREE.Vector3(), _o = new THREE.Vector3(), _x = new THREE.Vector3(1, 0, 0);
export function beam(a, b, w, h, c) {
  const len = a.distanceTo(b);
  const g = new THREE.BoxGeometry(w, h, len + 0.02).toNonIndexed();
  _v.subVectors(b, a).normalize();
  _m.lookAt(_o, _v, Math.abs(_v.y) > 0.99 ? _x : _up);
  _q.setFromRotationMatrix(_m);
  g.applyQuaternion(_q);
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  return colorize(g, c);
}
export function merge(geos) { const g = mergeGeometries(geos); geos.forEach((x) => x.dispose()); return g; }
export const MAT = (o = {}) => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, ...o });
// A path: points every ~0.5 m with their distance along it (pos and direction at any distance).
export function samplePath(pts) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  return { pts, cum, len: cum[cum.length - 1] };
}
export function posAt(path, s, out = new THREE.Vector3()) {
  const { pts, cum } = path;
  s = Math.max(0, Math.min(path.len, s));
  let lo = 0, hi = cum.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cum[mid] <= s) lo = mid; else hi = mid; }
  const k = (s - cum[lo]) / Math.max(1e-6, cum[hi] - cum[lo]);
  return out.lerpVectors(pts[lo], pts[hi], k);
}
const _pa = new THREE.Vector3(), _pb = new THREE.Vector3();
export function dirAt(path, s, out = new THREE.Vector3()) {
  posAt(path, s - 0.4, _pa); posAt(path, s + 0.4, _pb);
  return out.subVectors(_pb, _pa).normalize();
}
export const WOOD = 0x7a5232, WOOD_D = 0x553820, RAIL = 0x9aa0a8, ROCK = 0x7d7975, ROCK_D = 0x5c5854, DARK = 0x0d0b0a;
// The cart: grey iron box with a wooden rim, four wheels, a lantern and a horn. One mesh.
export function buildCart(mat) {
  const g = new THREE.Group();
  g.userData.dynamic = true;
  const body = new THREE.Mesh(merge([
    box(1.1, 0.62, 1.4, 0x6a7078, 0, 0.55, 0), box(1.16, 0.1, 1.46, 0x8a5a32, 0, 0.88, 0), box(0.94, 0.08, 1.24, 0x2a2a2e, 0, 0.83, 0),
    box(0.06, 0.4, 1.3, 0x5a5e66, -0.56, 0.55, 0), box(0.06, 0.4, 1.3, 0x5a5e66, 0.56, 0.55, 0),
    ...[[-0.52, -0.45], [0.52, -0.45], [-0.52, 0.45], [0.52, 0.45]].map(([x, z]) => box(0.12, 0.34, 0.34, 0x26262a, x, 0.2, z)),
    box(0.16, 0.2, 0.16, 0x3a3a3a, 0.4, 1.02, 0.66), box(0.12, 0.12, 0.12, 0xffd25a, 0.4, 1.02, 0.75), // lantern
    box(0.08, 0.08, 0.28, 0xd8a83a, -0.42, 1.0, 0.62, 0.3), box(0.16, 0.16, 0.08, 0xffc63a, -0.42, 1.06, 0.78), // horn
  ]), mat);
  body.castShadow = true;
  g.add(body);
  g.userData.body = body;
  return g;
}
export function setCartGold(mat, on) {
  mat.color.set(on ? 0xffd34a : 0xffffff);
  mat.emissive.set(on ? 0x7a5200 : 0x000000);
  mat.metalness = on ? 0.75 : 0.25;
}
export function placeCart(cart, p, d, tilt = 0) {
  cart.position.copy(p);
  cart.rotation.set(0, 0, 0);
  cart.rotation.order = 'YXZ';
  cart.rotation.y = Math.atan2(d.x, d.z);
  cart.rotation.x = -Math.asin(Math.max(-1, Math.min(1, d.y)));
  cart.rotation.z = tilt;
}
// The dog sits at the front of the cart, ears in the wind.
export function seatDog(cart, pet, t) {
  const m = pet.mesh, c = cart, d = new THREE.Vector3(Math.sin(c.rotation.y), 0, Math.cos(c.rotation.y));
  m.position.set(c.position.x + d.x * 0.42, c.position.y + 0.55, c.position.z + d.z * 0.42);
  m.rotation.y = c.rotation.y;
  const P = m.userData.parts;
  if (P) { P.head.rotation.z = Math.sin(t * 16) * 0.12; P.head.rotation.x = -0.15; P.tail.rotation.y = Math.sin(t * 18) * 0.7; P.body.rotation.x = 0; P.body.position.y = 0; }
  pet.obj.worldPos.copy(m.position);
  pet.obj.iconHolder.position.copy(m.position).add(new THREE.Vector3(0, pet.obj.iconY, 0));
  pet.obj.hit.position.copy(pet.obj.iconHolder.position).add(new THREE.Vector3(0, -0.35, 0));
}
// The hero stands in the cart (his legs hidden inside).
export function seatHero(s, p, d) {
  const pl = s.player;
  pl.position.set(p.x - d.x * 0.2, p.y + 0.32, p.z - d.z * 0.2);
  pl.rotation.y = Math.atan2(d.x, d.z);
  pl.userData.isMoving = false;
  s.playerVY = 0; s.onGround = true; s.lastGroundAt = s.clock.elapsedTime;
}

// ===== The station on the island =====
export class MineCart {
  constructor(scene3D) {
    const s = this.s = scene3D;
    this.g = new THREE.Group();
    this.g.userData.dynamic = true;
    s.scene.add(this.g);
    const ground = (x, z) => s.groundAt(x, z);
    // A short track from the station into the mouth of the mine, just above the ground.
    const a = new THREE.Vector3(STATION.x + 1.2, 0, STATION.z), b = new THREE.Vector3(MOUTH.x - 1.2, 0, MOUTH.z);
    const n = 24, pts = [];
    for (let i = 0; i <= n; i++) {
      const p = a.clone().lerp(b, i / n);
      let h = -Infinity;
      for (const [dx, dz] of [[0, 0], [0.7, 0], [-0.7, 0], [0, 0.7], [0, -0.7]]) h = Math.max(h, ground(p.x + dx, p.z + dz));
      p.y = h + 0.3; pts.push(p);
    }
    for (let it = 0; it < 3; it++) for (let i = 1; i < n; i++) pts[i].y = Math.max(pts[i].y - 0.15, (pts[i - 1].y + pts[i].y * 2 + pts[i + 1].y) / 4);
    this.path = samplePath(pts);
    this.g.add(this._buildStation(ground));
    this.cartMat = MAT({ roughness: 0.55, metalness: 0.25 });
    this.cart = buildCart(this.cartMat);
    this.g.add(this.cart);
    this.homeS = 1.2;
    this.home = { p: posAt(this.path, this.homeS).clone(), d: dirAt(this.path, this.homeS).clone() };
    placeCart(this.cart, this.home.p, this.home.d);
    this.obj = s._addInteractable({ kind: 'minecart', worldPos: this.home.p.clone(), iconY: 2.2, reach: 3.2, hitRadius: 1.2 });
    this.gateObj = s._addInteractable({ kind: 'minegate', worldPos: new THREE.Vector3(GATE.x, ground(GATE.x, GATE.z), GATE.z), iconY: 2.0, reach: 2.6, hitRadius: 1.0 });
    s.collidables.push({ x: OLD_CART.x, z: OLD_CART.z, r: 0.7 });
    this.roll = null; this.riding = false; this.speedK = 1; this.t = 0; this.gold = false; this.gateOpen = false;
  }
  _buildStation(ground) {
    const geos = [], P = this.path;
    // Sleepers and two rails.
    for (let s = 0; s < P.len; s += 0.85) {
      const p = posAt(P, s), d = dirAt(P, s), side = new THREE.Vector3(-d.z, 0, d.x);
      geos.push(beam(p.clone().addScaledVector(side, -0.62).setY(p.y - 0.05), p.clone().addScaledVector(side, 0.62).setY(p.y - 0.05), 0.22, 0.08, (Math.round(s / 0.85) % 3) ? WOOD : WOOD_D));
    }
    for (const off of [-0.42, 0.42]) {
      let prev = null;
      for (let s = 0; s <= P.len + 0.01; s += 1.4) {
        const p = posAt(P, s), d = dirAt(P, s);
        const q = p.clone().addScaledVector(new THREE.Vector3(-d.z, 0, d.x), off); q.y += 0.02;
        if (prev) geos.push(beam(prev, q, 0.07, 0.08, RAIL));
        prev = q;
      }
    }
    // The mouth of the mine: a rock mound with a dark opening and timbers, facing the station (east).
    const c = new THREE.Vector3(MOUTH.x - 1.1, 0, MOUTH.z), yaw = Math.atan2(1, 0), g0 = ground(c.x, c.z) - 0.2;
    const put = (w, h, d, col, lx, ly, lz) => { const x = c.x + lx * Math.cos(yaw) + lz * Math.sin(yaw), z = c.z - lx * Math.sin(yaw) + lz * Math.cos(yaw); geos.push(box(w, h, d, col, x, g0 + ly, z, 0, yaw)); };
    put(5.2, 3.6, 3.6, ROCK, 0, 1.8, -1.2);
    put(3.8, 1.6, 2.8, ROCK_D, 0.4, 4.1, -1.3);
    put(1.8, 2.4, 2.4, ROCK_D, -2.7, 1.2, -0.6);
    put(1.6, 1.9, 2.0, ROCK, 2.7, 0.95, -0.7);
    put(1.0, 1.0, 1.0, ROCK_D, 3.3, 0.5, 0.6);
    put(2.0, 2.3, 0.14, DARK, 0, 1.25, 0.62); // the dark mouth
    put(2.5, 0.3, 0.34, WOOD_D, 0, 2.5, 0.66); // timbers round the mouth
    put(0.26, 2.5, 0.34, WOOD_D, -1.15, 1.25, 0.66);
    put(0.26, 2.5, 0.34, WOOD_D, 1.15, 1.25, 0.66);
    put(1.3, 0.42, 0.08, 0xe8d8b0, 0, 2.95, 0.78); // the sign board over the mouth (a pickaxe drawn on it)
    put(0.6, 0.08, 0.04, 0x6a4a2a, 0, 2.95, 0.84);
    put(0.1, 0.28, 0.04, 0x8a8e96, -0.28, 2.98, 0.84);
    // Two lanterns on the timbers.
    put(0.2, 0.26, 0.2, 0x3a3a3a, -1.15, 2.1, 0.92); put(0.14, 0.16, 0.14, 0xffd25a, -1.15, 2.05, 0.94);
    put(0.2, 0.26, 0.2, 0x3a3a3a, 1.15, 2.1, 0.92); put(0.14, 0.16, 0.14, 0xffd25a, 1.15, 2.05, 0.94);
    // The station: a wooden platform beside the track, a roof, a board; the sign of line 2.
    const sd = this.home ? this.home.d : dirAt(P, 1.2), syaw = Math.atan2(sd.x, sd.z), sx = new THREE.Vector3(-sd.z, 0, sd.x), sy = ground(STATION.x, STATION.z);
    const px = STATION.x + sx.x * -1.2 + sd.x * 1.5, pz = STATION.z + sx.z * -1.2 + sd.z * 1.5;
    geos.push(box(1.2, 0.3, 5, WOOD, px, sy + 0.15, pz, 0, syaw));
    for (const k of [-2, 2]) geos.push(box(0.16, 2.4, 0.16, WOOD_D, px + sd.x * k, sy + 1.2, pz + sd.z * k));
    geos.push(box(1.8, 0.14, 5.4, 0xa8402a, px, sy + 2.45, pz, 0, syaw));
    geos.push(box(0.9, 0.6, 0.08, 0xe8d8b0, px + sd.x * 0.2, sy + 1.95, pz + sd.z * 0.2, 0, syaw + Math.PI / 2));
    const gyy = ground(GATE.x, GATE.z);
    geos.push(box(0.14, 1.1, 0.14, WOOD_D, GATE.x, gyy + 0.55, GATE.z - 0.75), box(0.14, 1.1, 0.14, WOOD_D, GATE.x, gyy + 0.55, GATE.z + 0.75));
    geos.push(box(0.1, 0.16, 1.7, 0xd8302a, GATE.x, gyy + 0.95, GATE.z), box(0.12, 0.55, 0.7, 0x6a3aa8, GATE.x - 0.05, gyy + 1.45, GATE.z));
    // An old forgotten cart by the mine, tipped on its side (Cocotte hides in it on J8).
    const og = ground(OLD_CART.x, OLD_CART.z);
    geos.push(box(1.0, 0.55, 1.25, 0x5a5e66, OLD_CART.x, og + 0.42, OLD_CART.z, 0, 0.5, 0.35), box(0.84, 0.08, 1.05, 0x3a3226, OLD_CART.x + 0.08, og + 0.2, OLD_CART.z, 0, 0.5, 0.35));
    geos.push(box(0.12, 0.26, 0.26, 0x2a2a2a, OLD_CART.x + 0.55, og + 0.13, OLD_CART.z + 0.2), box(0.12, 0.26, 0.26, 0x2a2a2a, OLD_CART.x + 0.3, og + 0.13, OLD_CART.z - 0.6));
    const m = new THREE.Mesh(merge(geos), MAT({ roughness: 0.9 }));
    m.castShadow = true; m.receiveShadow = true; m.userData.dynamic = true;
    return m;
  }
  setGold(on) { this.gold = on; setCartGold(this.cartMat, on); }
  setGate(open) { this.gateOpen = open; }
  // Aboard: the cart rolls into the mouth of the mine with the hero, then `done` loads the mine.
  rollIn(done) {
    this.roll = { s: this.homeS, v: 0, done };
    this.riding = true;
    this.obj.active = false; this.obj.iconHolder.visible = false; if (this.obj.labelEl) this.obj.labelEl.style.display = 'none';
    const p = this.cart.position.clone(); p.y += 1;
    for (const c of ['#ffd34a', '#ffffff', '#5af0e6']) this.s.particleBurst(p, c, 22);
  }
  // In the mine (the world carries the hero): the cart waits out of sight.
  park() { this.roll = null; this.riding = false; }
  // Back from the mine: the cart at the station, the hero steps out onto the platform.
  finish() {
    this.roll = null; this.riding = false;
    placeCart(this.cart, this.home.p, this.home.d);
    this.obj.active = true; this.obj.iconHolder.visible = true;
    const st = this.home, side = new THREE.Vector3(-st.d.z, 0, st.d.x);
    const x = st.p.x - side.x * 1.3 + st.d.x * 1.2, z = st.p.z - side.z * 1.3 + st.d.z * 1.2;
    this.s.teleport(x, z, Math.atan2(-st.d.x, -st.d.z));
    if (this.s.pet?.tamed) this.s.pet.catchUp();
  }
  stop() { if (this.riding) this.finish(); }
  rideStep(dt) {
    const r = this.roll, s = this.s;
    if (!r) return;
    s.autoWalk = null;
    if (r.s < this.path.len - 0.2) {
      r.v = Math.min(r.v + 3 * dt, 3.4);
      r.s = Math.min(this.path.len - 0.2, r.s + r.v * dt);
    } else if (r.done) { const d = r.done; r.done = null; d(); }
    const p = posAt(this.path, r.s), d = dirAt(this.path, r.s);
    placeCart(this.cart, p, d, r.v > 2 ? Math.sin(this.t * 22) * 0.015 : 0);
    seatHero(s, p, d);
  }
  seatDog(pet, t) { seatDog(this.cart, pet, t); }
  near(d = 9) { const p = this.s.player.position; return Math.hypot(p.x - STATION.x, p.z - STATION.z) < d; }
  update(dt) {
    this.t += dt;
    const p = this.s.player.position;
    this.g.visible = this.riding || Math.hypot(p.x - (-47), p.z - (-42)) < 45;
    // The cart waits at the station, rocking a little.
    if (this.g.visible && !this.riding) this.cart.rotation.z = Math.sin(this.t * 1.6) * 0.01;
  }
}
