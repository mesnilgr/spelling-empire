// La Lune (v1.26.3, the parent's pick among the new worlds). On the island, a rocket waits on its launch
// pad next to the mage's tower. A word lights the engines, "3, 2, 1… Décollage !", and the Moon is
// loaded as a world of its own (worlds.js). Up there the hero walks on grey dust full of craters, with
// low gravity (huge slow jumps), footprints, a black sky full of stars and the island floating in it.
// Bip, the little Moon robot, has lost three parts in three craters: a word for each. Fallen stars float
// here and there, some so high that you have to jump to catch them: a word sends each one back into
// the sky. On the rim of the big crater, a word plants the flag of the Empire des Mots (and gives the
// astronaut suit). The rocket takes the hero home ("3, 2, 1…") and lands softly by its pad.
// Spelling only: nothing to read to get on. Merged vertex-coloured meshes, well inside the iPad budget.
import * as THREE from 'three';
import { box, beam, merge, MAT, colorize } from './mine.js';
import { disposeTree } from './worlds.js';

export const ROCKET = { x: 19.5, z: -0.5 }; // the launch pad, east of the mage's tower
export const MOON_ORIGIN = new THREE.Vector3(900, 0, -900); // far from the island and from the mine
export const PARTS = 3, STARS = 5;
const R_WALK = 30, R_EDGE = 44;
const UP = new THREE.Vector3(0, 1, 0);

export const LX = {
  fr: {
    name: 'La Lune', rocket: '🚀 Fusée', home: '🚀 Rentrer', bip: '🤖 Bip', flag: '🚩 Drapeau',
    launchTitle: 'Décollage !', launchInstr: 'Épelle ce mot pour allumer les moteurs !',
    launchLead: 'Pour décoller vers la Lune, épelle le mot !', launchLeadShort: 'Les moteurs !',
    engines: 'Les moteurs sont allumés !', countSay: 'Trois… deux… un… Décollage !',
    loading: 'Direction la Lune…', loadingBack: 'Retour sur l’île…',
    arriveFirst: 'Bienvenue sur la Lune ! Ici, on saute très très haut. Regarde là-haut : c’est notre planète, avec notre île !',
    arrive: 'De retour sur la Lune ! Attrape les étoiles tombées : saute pour les plus hautes !',
    jumpFirst: 'Boiiing ! Sur la Lune, on saute super haut !',
    bipHello: 'Bip… bip… Je suis Bip, le robot de la Lune ! J’ai perdu trois pièces : mon antenne, ma roue et mon panneau solaire. Elles sont au fond des cratères !',
    bipWait: (n) => `Bip… bip… Il me manque encore ${n} pièce${n > 1 ? 's' : ''} ! Elles brillent au fond des cratères.`,
    bipHappy: ['Bip bip ! Tu es mon ami !', 'Bip ! Encore un saut ?', 'Bip bip bip !'],
    partTitle: 'Une pièce de Bip !', partInstr: 'Épelle ce mot pour rendre la pièce à Bip !',
    partNames: ['son antenne', 'sa roue', 'son panneau solaire'], partEmoji: ['📡', '🛞', '☀️'],
    partGot: (name, k, n) => `Bip a retrouvé ${name} ! Pièce ${k} sur ${n}.`,
    bipFixed: 'Bip bip bip ! Bip est réparé ! Il danse… oups, il tombe ! Maintenant, il te suit partout.',
    starTitle: 'Une étoile tombée !', starInstr: 'Épelle ce mot pour renvoyer l’étoile dans le ciel !',
    starJump: 'Elle est trop haut ! Saute pour l’attraper : sur la Lune, on saute très haut !',
    starGot: (k, n) => `L’étoile remonte dans le ciel ! Étoile ${k} sur ${n}.`,
    starsAll: 'Toutes les étoiles brillent de nouveau dans le ciel ! Bravo !',
    flagTitle: 'Le drapeau de l’Empire', flagInstr: 'Épelle ce mot pour planter le drapeau !',
    flagDone: 'Le drapeau de l’Empire des Mots flotte sur la Lune ! Pourtant, il n’y a pas de vent ici… Chut, c’est magique ! Voici ta tenue d’astronaute !',
    flagAgain: 'Le drapeau de l’Empire flotte toujours sur la Lune !',
    homeSay: 'On rentre sur l’île ! Trois… deux… un… Décollage !',
    landed: 'Atterrissage en douceur ! Bienvenue sur l’île.',
    hint: 'Le bord de la Lune ! On ne va pas plus loin.',
  },
  en: {
    name: 'The Moon', rocket: '🚀 Rocket', home: '🚀 Go home', bip: '🤖 Bip', flag: '🚩 Flag',
    launchTitle: 'Lift-off!', launchInstr: 'Spell this word to start the engines!',
    launchLead: 'To fly to the Moon, spell the word!', launchLeadShort: 'The engines!',
    engines: 'The engines are on!', countSay: 'Three… two… one… Lift-off!',
    loading: 'Off to the Moon…', loadingBack: 'Back to the island…',
    arriveFirst: 'Welcome to the Moon! Here you jump really, really high. Look up there: that is our planet, with our island!',
    arrive: 'Back on the Moon! Catch the fallen stars: jump for the highest ones!',
    jumpFirst: 'Boing! On the Moon, you jump super high!',
    bipHello: 'Beep… beep… I am Bip, the Moon robot! I lost three parts: my antenna, my wheel and my solar panel. They are at the bottom of the craters!',
    bipWait: (n) => `Beep… beep… I still need ${n} part${n > 1 ? 's' : ''}! They shine at the bottom of the craters.`,
    bipHappy: ['Beep beep! You are my friend!', 'Beep! One more jump?', 'Beep beep beep!'],
    partTitle: 'A part for Bip!', partInstr: 'Spell this word to give the part back to Bip!',
    partNames: ['his antenna', 'his wheel', 'his solar panel'], partEmoji: ['📡', '🛞', '☀️'],
    partGot: (name, k, n) => `Bip found ${name}! Part ${k} of ${n}.`,
    bipFixed: 'Beep beep beep! Bip is fixed! He dances… oops, he falls over! Now he follows you everywhere.',
    starTitle: 'A fallen star!', starInstr: 'Spell this word to send the star back into the sky!',
    starJump: 'It is too high! Jump to catch it: on the Moon, you jump really high!',
    starGot: (k, n) => `The star flies back into the sky! Star ${k} of ${n}.`,
    starsAll: 'All the stars shine in the sky again! Well done!',
    flagTitle: 'The flag of the Empire', flagInstr: 'Spell this word to plant the flag!',
    flagDone: 'The flag of the Empire of Words flies on the Moon! But there is no wind up here… Shh, it is magic! Here is your astronaut suit!',
    flagAgain: 'The flag of the Empire still flies on the Moon!',
    homeSay: 'Back to the island! Three… two… one… Lift-off!',
    landed: 'A soft landing! Welcome back to the island.',
    hint: 'The edge of the Moon! We go no further.',
  },
};

const cylG = (rt, rb, h, c, y = 0, seg = 8) => { const g = new THREE.CylinderGeometry(rt, rb, h, seg).toNonIndexed(); g.translate(0, y, 0); return colorize(g, c); };
// The rocket: white body with red bands, a red nose, three fins, a round window; the flame below.
export function buildRocket() {
  const g = new THREE.Group();
  const RED = 0xd8302a;
  const body = new THREE.Mesh(merge([
    cylG(0.72, 0.72, 2.6, 0xf2f2f4, 1.9), cylG(0.75, 0.75, 0.26, RED, 1.05), cylG(0.75, 0.75, 0.2, RED, 3.0),
    cylG(0.62, 0.74, 0.5, 0xd8d8de, 0.36), cylG(0.02, 0.72, 1.35, RED, 3.87), cylG(0.36, 0.5, 0.3, 0x4a4e56, -0.02),
    ...[0, 2.094, 4.189].map((a) => box(0.12, 1.15, 0.8, RED, Math.sin(a) * 0.95, 0.6, Math.cos(a) * 0.95, 0, a, 0)),
    box(0.5, 0.5, 0.12, 0x5a5e66, 0, 2.45, 0.68), box(0.36, 0.36, 0.12, 0x7ad8ff, 0, 2.45, 0.72),
  ]), MAT({ roughness: 0.45, metalness: 0.2 }));
  body.castShadow = true;
  g.add(body);
  const flame = new THREE.Mesh(merge([cylG(0.45, 0.05, 1.6, 0xffb03a, -0.9), cylG(0.25, 0.02, 1.0, 0xfff2a0, -0.6)]), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9 }));
  flame.visible = false;
  g.add(flame);
  g.userData.flame = flame;
  g.userData.dynamic = true;
  return g;
}

// ===== The rocket on the island =====
export class MoonRocket {
  constructor(scene3D) {
    const s = this.s = scene3D;
    this.base = new THREE.Vector3(ROCKET.x, s.groundAt(ROCKET.x, ROCKET.z), ROCKET.z);
    this.g = new THREE.Group();
    this.g.userData.dynamic = true;
    s.scene.add(this.g);
    const b = this.base, geos = [cylG(1.9, 2.0, 0.3, 0x8a8e96, b.y + 0.15)];
    geos[0].translate(b.x, 0, b.z);
    // Yellow and black stripes round the pad, a little gantry with a ladder.
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; geos.push(box(0.5, 0.04, 0.22, i % 2 ? 0xf2c84b : 0x2a2a2e, b.x + Math.sin(a) * 1.7, b.y + 0.31, b.z + Math.cos(a) * 1.7, 0, a + Math.PI / 2, 0)); }
    const gx = b.x + 1.45, gz = b.z - 0.6;
    for (const [dx, dz] of [[0, 0], [0.6, 0], [0, 0.6], [0.6, 0.6]]) geos.push(box(0.1, 4.2, 0.1, 0xc8372d, gx + dx, b.y + 2.4, gz + dz));
    for (let y = 0.9; y < 4.4; y += 0.7) geos.push(box(0.7, 0.07, 0.07, 0x8a2a20, gx + 0.3, b.y + y, gz), box(0.07, 0.07, 0.7, 0x8a2a20, gx + 0.6, b.y + y, gz + 0.3));
    geos.push(box(0.9, 0.08, 0.12, 0x8a2a20, gx - 0.25, b.y + 3.2, gz + 0.3)); // the arm to the rocket
    const pad = new THREE.Mesh(merge(geos), MAT({ roughness: 0.8 }));
    pad.castShadow = true; pad.receiveShadow = true; pad.userData.dynamic = true;
    this.g.add(pad);
    this.rocket = buildRocket();
    this.rocket.position.set(b.x, b.y + 0.3, b.z);
    this.rocket.rotation.y = -Math.PI / 2; // (the window faces the village)
    this.g.add(this.rocket);
    this.obj = s._addInteractable({ kind: 'rocket', worldPos: b.clone(), iconY: 5.6, reach: 3.0, hitRadius: 1.6 });
    s.collidables.push({ x: b.x, z: b.z, r: 2.0 });
    this.fly = null; this.riding = false; this.t = 0;
  }
  // "3, 2, 1… Décollage !" with the hero inside, then `onUp` loads the Moon.
  launch(onUp) {
    this.fly = { stage: 'count', t: 0, onUp, puff: 0 };
    this.riding = true;
    this.obj.active = false; this.obj.iconHolder.visible = false; if (this.obj.labelEl) this.obj.labelEl.style.display = 'none';
  }
  // While the hero is on the Moon, the rocket waits out of sight.
  park() { this.fly = null; this.riding = false; }
  // Back from the Moon: the rocket comes down from the sky onto its pad, flame on.
  landBack() {
    this.fly = { stage: 'land', t: 0, puff: 0 };
    this.riding = true;
    this.obj.active = false; this.obj.iconHolder.visible = false;
  }
  finish() {
    this.fly = null; this.riding = false;
    this.rocket.position.set(this.base.x, this.base.y + 0.3, this.base.z);
    this.rocket.rotation.z = 0;
    this.rocket.userData.flame.visible = false;
    this.obj.active = true; this.obj.iconHolder.visible = true;
    this.s.teleport(this.base.x - 2.7, this.base.z + 1.2, Math.PI / 2);
    if (this.s.pet?.tamed) this.s.pet.catchUp();
    this.onLanded?.();
  }
  stop() { if (this.riding) { const cb = this.onLanded; this.onLanded = null; this.finish(); this.onLanded = cb; } }
  rideStep(dt) {
    const f = this.fly, s = this.s, b = this.base;
    if (!f) return;
    s.autoWalk = null;
    f.t += dt;
    let y = 0;
    const fl = this.rocket.userData.flame;
    if (f.stage === 'count') {
      this.rocket.rotation.z = f.t > 1.4 ? Math.sin(f.t * 40) * 0.01 * Math.min(1, f.t - 1.4) : 0;
      fl.visible = f.t > 2.4;
      if (f.t > 3.2) { f.stage = 'up'; f.t = 0; }
    } else if (f.stage === 'up') {
      y = 0.5 * 7 * f.t * f.t;
      fl.visible = true;
      if (y > 24 && !f.called) { f.called = true; const cb = f.onUp; f.onUp = null; cb?.(); }
    } else if (f.stage === 'land') {
      const k = Math.min(1, f.t / 2.8);
      y = 26 * Math.pow(1 - k, 2);
      fl.visible = k < 0.97;
      if (k >= 1) { this.finish(); return; }
    }
    if (fl.visible) { const n = 1 + Math.sin(f.t * 30) * 0.15; fl.scale.set(n, n * (f.stage === 'count' ? 0.5 : 1.2), n); }
    // Smoke round the pad near the ground.
    f.puff -= dt;
    if (fl.visible && y < 6 && f.puff <= 0) { f.puff = 0.08; s.particleBurst(new THREE.Vector3(b.x, b.y + 0.5, b.z), Math.random() < 0.5 ? '#d8d8d8' : '#ffb03a', 10); }
    this.rocket.position.set(b.x, b.y + 0.3 + y, b.z);
    const pl = s.player;
    pl.position.set(b.x, b.y + 0.6 + y, b.z);
    pl.userData.isMoving = false;
    s.playerVY = 0; s.onGround = true; s.lastGroundAt = s.clock.elapsedTime;
  }
  // The dog rides inside too.
  seatDog(pet) {
    pet.mesh.position.set(this.rocket.position.x, this.rocket.position.y + 0.4, this.rocket.position.z);
    pet.obj.worldPos.copy(pet.mesh.position);
  }
  update(dt) {
    this.t += dt;
    const p = this.s.player.position;
    this.g.visible = this.riding || Math.hypot(p.x - this.base.x, p.z - this.base.z) < 60;
  }
}

// ===== The Moon world =====
// Craters: [x, z, radius, depth] (local metres). The big crater (with the flag on its rim) and the three
// craters where Bip's parts lie come first.
const CRATERS = [[12, -12, 7, 2.4], [-13, -7, 4.6, 1.6], [-6, 15, 4.2, 1.5], [17, 10, 4.4, 1.5], [-21, 6, 2.6, 0.8], [3, -24, 3.2, 1.0], [25, -2, 2.3, 0.7], [-3, -15, 2.1, 0.6], [-20, -17, 3.0, 0.9], [8, 22, 2.7, 0.8], [-15, 23, 2.4, 0.7], [24, 18, 2.2, 0.6]];
const PART_AT = [[-13, -7], [-6, 15], [17, 10]];
const ROCKET_AT = [-3, 7], SPAWN = [0.4, 4.6], BIP_AT = [3.2, 2.6];
const FLAG_AT = [13.5, -21.2];
// Spots for the fallen stars: [x, z, height above the ground]. Five are picked each visit, two high up.
const STAR_SPOTS = [[-6, -2, 1.2], [7, -4, 3.6], [-17, 13, 1.2], [21, -12, 4.0], [0, 18, 3.8], [-24, -6, 1.3], [10, 12, 1.2], [-9, -21, 3.9], [20, 4, 1.3], [-14, 2, 4.2], [4, -16, 1.2], [14, 24, 3.7]];
const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

function heightAt(x, z) {
  let h = 0.18 * Math.sin(x * 0.31) * Math.cos(z * 0.27) + 0.09 * Math.sin(x * 0.83 + z * 0.61);
  for (const [cx, cz, r, d] of CRATERS) {
    const t = Math.hypot(x - cx, z - cz) / r;
    if (t < 1) h -= d * (1 - t * t);
    h += d * 0.42 * Math.exp(-(((t - 1) / 0.3) ** 2));
  }
  const e = Math.hypot(x, z);
  if (e > R_WALK + 3) h -= ((e - R_WALK - 3) ** 2) * 0.06; // the ground curves away at the edge
  return h;
}

export class MoonWorld {
  constructor(scene3D, { state, helmet = true } = {}) {
    this.s = scene3D;
    this.id = 'moon';
    this.state = state;
    this.wantHelmet = helmet;
    this.root = new THREE.Group();
    this.lights = [];
    this.objs = [];
    this.t = 0;
    this.gravity = 6.2; // (the island: 24) — huge, slow jumps
    this.jumpK = 0.92;
    this.env = { bg: 0x04050b, fog: 0x04050b, near: 90, far: 260, ambient: 0.22, ambientColor: 0xc8d4ff, hemi: 0.22, hemiSky: 0xdfe6ff, hemiGround: 0x1a1a22, sun: 1.25, sunColor: 0xffffff, fov: 50 };
    // A lower camera than on the island, looking a little up: the black sky and the island show.
    this.camElev = 0.42; this.camDist = 13; this.camLookUp = 3.2;
  }
  _w(x, z) { return new THREE.Vector3(x + MOON_ORIGIN.x, heightAt(x, z) + MOON_ORIGIN.y, z + MOON_ORIGIN.z); }
  groundAt(x, z) { return heightAt(x - MOON_ORIGIN.x, z - MOON_ORIGIN.z) + MOON_ORIGIN.y; }
  blocked(x, z, y) {
    const lx = x - MOON_ORIGIN.x, lz = z - MOON_ORIGIN.z;
    if (Math.hypot(lx, lz) > R_WALK) { this.onEdge?.(); return true; }
    const high = y !== undefined && y - this.groundAt(x, z) > 1.4;
    if (!high) for (const c of this.colliders) if (Math.hypot(lx - c.x, lz - c.z) < c.r) return true;
    return y !== undefined && this.groundAt(x, z) - y > 0.9;
  }

  build() {
    this._ground();
    this._sky();
    this._rocks();
    // The rocket that brought us, Bip, his parts, the fallen stars, the flag, the footprints.
    this.rocket = buildRocket();
    const rp = this._w(...ROCKET_AT);
    this.rocket.position.copy(rp).setY(rp.y + 0.05);
    this.rocket.rotation.y = 0.4;
    this.root.add(this.rocket);
    this.colliders.push({ x: ROCKET_AT[0], z: ROCKET_AT[1], r: 1.0 });
    this.homeObj = this._obj({ kind: 'moonrocket', at: ROCKET_AT, iconY: 5.6, reach: 2.8, hitRadius: 1.6 });
    this._bip();
    this._parts();
    this._stars();
    this._flag();
    this.prints = new THREE.InstancedMesh(new THREE.BoxGeometry(0.17, 0.03, 0.26), new THREE.MeshStandardMaterial({ color: 0x55565c, roughness: 1 }), 160);
    this.prints.frustumCulled = false;
    this.printN = 0; this.lastPrint = null; this.printSide = 1;
    this._d = new THREE.Object3D();
    this._d.position.set(0, -500, 0); this._d.scale.setScalar(0.0001); this._d.updateMatrix();
    for (let i = 0; i < 160; i++) this.prints.setMatrixAt(i, this._d.matrix);
    this.root.add(this.prints);
  }
  _obj(spec) {
    const p = this._w(...spec.at);
    const o = this.s._addInteractable({ world: 'moon', worldPos: p, iconY: 1.6, ...spec });
    this.objs.push(o);
    return o;
  }
  _static(m) { m.castShadow = false; m.receiveShadow = false; m.matrixAutoUpdate = false; m.updateMatrix(); this.root.add(m); return m; }
  // Grey dust: a grid with flat shading, darker in the craters, lighter on the rims.
  _ground() {
    const N = 76, S = R_EDGE * 2, step = S / N, pos = [], col = [], c = new THREE.Color();
    const vx = (i) => -R_EDGE + i * step;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const x0 = vx(i), x1 = vx(i + 1), z0 = vx(j), z1 = vx(j + 1);
      if (Math.hypot((x0 + x1) / 2, (z0 + z1) / 2) > R_EDGE) continue;
      const v = (x, z) => [x + MOON_ORIGIN.x, heightAt(x, z) + MOON_ORIGIN.y, z + MOON_ORIGIN.z];
      for (const [tri, k] of [[[[x0, z0], [x0, z1], [x1, z1]], 0], [[[x0, z0], [x1, z1], [x1, z0]], 1]]) {
        const mx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, mz = (tri[0][1] + tri[1][1] + tri[2][1]) / 3, h = heightAt(mx, mz);
        const u = hash(i * 2 + k, j);
        const g = 0.36 + h * 0.06 + (u - 0.5) * 0.07;
        c.setRGB(g * 0.96, g * 0.96, g);
        for (const [x, z] of tri) { pos.push(...v(x, z)); col.push(c.r, c.g, c.b); }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.computeVertexNormals(); geo.computeBoundingSphere();
    this._static(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true })));
  }
  // Stars all round, and the island floating in the black sky (blue sea, green land, white clouds).
  _sky() {
    const n = 1400, sp = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = hash(i, 1), v = hash(i, 2), th = u * Math.PI * 2, ph = Math.acos(1 - v * 1.15);
      sp[i * 3] = MOON_ORIGIN.x + Math.sin(ph) * Math.cos(th) * 150; sp[i * 3 + 1] = MOON_ORIGIN.y + Math.cos(ph) * 150 - 20; sp[i * 3 + 2] = MOON_ORIGIN.z + Math.sin(ph) * Math.sin(th) * 150;
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    this.starField = this._static(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, fog: false })));
    const eg = new THREE.IcosahedronGeometry(13, 3).toNonIndexed(), ep = eg.attributes.position, ec = new Float32Array(ep.count * 3), c = new THREE.Color(), q = new THREE.Vector3();
    for (let f = 0; f < ep.count; f += 3) {
      q.set(0, 0, 0); for (let k = 0; k < 3; k++) q.x += ep.getX(f + k), q.y += ep.getY(f + k), q.z += ep.getZ(f + k);
      q.normalize();
      const land = Math.sin(q.x * 4.1 + 1) * Math.cos(q.z * 3.3) + Math.sin(q.y * 5.2) * 0.6, cloud = Math.sin(q.x * 9 + q.y * 7) * Math.cos(q.z * 8);
      c.setHex(cloud > 0.75 ? 0xf4f8ff : land > 0.55 ? (q.y > 0.75 ? 0xf0f4ff : 0x5ab04a) : land > 0.4 ? 0xd8c890 : 0x2a6ad8);
      for (let k = 0; k < 3; k++) { ec[(f + k) * 3] = c.r; ec[(f + k) * 3 + 1] = c.g; ec[(f + k) * 3 + 2] = c.b; }
    }
    eg.setAttribute('color', new THREE.BufferAttribute(ec, 3));
    eg.computeVertexNormals();
    this.earth = new THREE.Mesh(eg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, flatShading: true, emissive: 0x1a3a6a, emissiveIntensity: 0.35, fog: false }));
    // In front of the camera (whose direction never turns), a little above the horizon.
    this.earth.position.set(MOON_ORIGIN.x - Math.sin(0.7) * 84, MOON_ORIGIN.y + 3, MOON_ORIGIN.z - Math.cos(0.7) * 84);
    this.root.add(this.earth);
  }
  // Boulders here and there (some block the way), and a ring of big rocks at the edge.
  _rocks() {
    const geos = [];
    this.colliders = [];
    const rock = (x, z, r, seed) => {
      const g = new THREE.DodecahedronGeometry(r, 0).toNonIndexed();
      g.scale(1, 0.6 + hash(seed, 3) * 0.3, 1 + hash(seed, 4) * 0.3); g.rotateY(hash(seed, 5) * 6);
      const p = this._w(x, z);
      g.translate(p.x, p.y + r * 0.25, p.z);
      geos.push(colorize(g, hash(seed, 6) < 0.5 ? 0x7a7a80 : 0x9a9aa0));
      if (r > 0.6) this.colliders.push({ x, z, r: r * 0.95 });
    };
    for (let i = 0; i < 26; i++) {
      const a = hash(i, 11) * Math.PI * 2, d = 6 + hash(i, 12) * 22, x = Math.cos(a) * d, z = Math.sin(a) * d;
      if (Math.hypot(x - SPAWN[0], z - SPAWN[1]) < 5 || PART_AT.some(([px, pz]) => Math.hypot(x - px, z - pz) < 3) || STAR_SPOTS.some(([sx, sz]) => Math.hypot(x - sx, z - sz) < 2) || Math.hypot(x - FLAG_AT[0], z - FLAG_AT[1]) < 3) continue;
      rock(x, z, 0.3 + hash(i, 13) * 0.9, i);
    }
    for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2 + hash(i, 21) * 0.1, d = R_WALK + 1.6 + hash(i, 22) * 1.5; rock(Math.cos(a) * d, Math.sin(a) * d, 1.2 + hash(i, 23) * 1.3, 100 + i); }
    this._static(new THREE.Mesh(merge(geos), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true })));
  }
  // Bip, the little Moon robot: a grey body, a head with two eyes, and the three parts he lost.
  _bip() {
    const g = new THREE.Group();
    const grey = MAT({ roughness: 0.5, metalness: 0.3 });
    g.add(new THREE.Mesh(merge([box(0.62, 0.5, 0.5, 0xc8ccd4, 0, 0.45, 0), box(0.46, 0.36, 0.42, 0xdfe2e8, 0, 0.9, 0), box(0.5, 0.06, 0.06, 0x5a5e66, 0, 0.62, 0.26), box(0.12, 0.12, 0.38, 0x4a4e56, 0.34, 0.2, 0)]), grey));
    this.bipEyeMat = new THREE.MeshStandardMaterial({ color: 0x2a2e36, emissive: 0x000000, roughness: 0.4 });
    g.add(new THREE.Mesh(merge([box(0.1, 0.1, 0.04, 0xffffff, -0.11, 0.93, 0.22), box(0.1, 0.1, 0.04, 0xffffff, 0.11, 0.93, 0.22)]), this.bipEyeMat));
    const piece = (geos, mat = grey) => { const m = new THREE.Mesh(merge(geos), mat); g.add(m); return m; };
    this.bipParts = [
      piece([box(0.04, 0.42, 0.04, 0x8a8e96, 0, 1.28, 0), box(0.12, 0.12, 0.12, 0xd8302a, 0, 1.52, 0)]), // antenna
      piece([(() => { const w = new THREE.CylinderGeometry(0.2, 0.2, 0.12, 10).toNonIndexed(); w.rotateZ(Math.PI / 2); w.translate(-0.36, 0.2, 0); return colorize(w, 0x2a2a2e); })()]), // wheel
      piece([box(0.7, 0.04, 0.42, 0x2a5ad8, 0, 0.78, -0.42, 0.5), box(0.06, 0.2, 0.06, 0x8a8e96, 0, 0.7, -0.26)]), // solar panel
    ];
    g.scale.setScalar(1.35);
    this.bip = g;
    this.bipPos = this._w(...BIP_AT);
    g.position.copy(this.bipPos);
    g.rotation.y = -0.6;
    this.root.add(g);
    this.bipObj = this._obj({ kind: 'bip', at: BIP_AT, iconY: 1.9, reach: 2.4, hitRadius: 1.0 });
    this.bipDance = 0; this.bipFall = 0; this.bipHop = 0;
    this._bipLook();
  }
  _bipLook() {
    const st = this.state;
    this.bipParts.forEach((m, k) => { m.visible = !!st.parts[k]; });
    const on = !!st.bip;
    this.bipEyeMat.emissive.setHex(on ? 0x5af0ff : 0x000000);
    this.bipEyeMat.color.setHex(on ? 0x9af8ff : 0x2a2e36);
  }
  // The three parts, glowing at the bottom of their craters (a ring of light round each).
  _parts() {
    const glow = [];
    this.partMeshes = PART_AT.map(([x, z], k) => {
      const p = this._w(x, z);
      const geos = k === 0 ? [box(0.06, 0.6, 0.06, 0x8a8e96, 0, 0.3, 0), box(0.18, 0.18, 0.18, 0xd8302a, 0, 0.66, 0)]
        : k === 1 ? [(() => { const w = new THREE.CylinderGeometry(0.32, 0.32, 0.16, 10).toNonIndexed(); w.rotateZ(Math.PI / 2); return colorize(w, 0x2a2a2e); })()]
          : [box(0.9, 0.06, 0.6, 0x2a5ad8, 0, 0, 0, 0.3)];
      const m = new THREE.Mesh(merge(geos), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.3, emissive: 0x3a5aa0, emissiveIntensity: 0.5 }));
      m.position.copy(p).setY(p.y + 0.5);
      m.userData.y0 = m.position.y;
      this.root.add(m);
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; glow.push(box(0.22, 0.05, 0.22, 0x9af8ff, p.x + Math.cos(a) * 0.9, p.y + 0.05, p.z + Math.sin(a) * 0.9)); }
      return m;
    });
    this.partGlow = this._static(new THREE.Mesh(merge(glow), new THREE.MeshBasicMaterial({ vertexColors: true })));
    this.partObjs = PART_AT.map((at, k) => this._obj({ kind: 'moonpart', part: k, at, iconY: 1.4, reach: 2.2, hitRadius: 1.1 }));
    this._partLook();
  }
  _partLook() {
    PART_AT.forEach((_, k) => { const got = !!this.state.parts[k]; this.partMeshes[k].visible = !got; this.partObjs[k].active = !got; this.partObjs[k].iconHolder.visible = false; });
    this.partGlow.visible = this.state.parts.some((x) => !x);
  }
  // Five fallen stars this visit (two up high: jump!).
  _stars() {
    const seed = (this.state.visits ?? 0) * 7 + 3;
    const order = STAR_SPOTS.map((sp, i) => ({ sp, i, r: hash(seed, i) })).sort((a, b) => a.r - b.r);
    const high = order.filter((o) => o.sp[2] > 2).slice(0, 2), low = order.filter((o) => o.sp[2] <= 2).slice(0, STARS - 2);
    this.starList = [...low, ...high].map((o) => { const [x, z, h] = o.sp, p = this._w(x, z); return { at: [x, z], pos: p.clone().setY(p.y + h), high: h > 2, got: false, flying: -1 }; });
    const pts = [];
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; pts.push(new THREE.Vector2(Math.sin(a) * 0.42, Math.cos(a) * 0.42), new THREE.Vector2(Math.sin(a + Math.PI / 5) * 0.18, Math.cos(a + Math.PI / 5) * 0.18)); }
    const sg = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: 0.14, bevelEnabled: false });
    sg.translate(0, 0, -0.07);
    this.starMesh = new THREE.InstancedMesh(sg, new THREE.MeshStandardMaterial({ color: 0xffd34a, emissive: 0xffb000, emissiveIntensity: 0.9, roughness: 0.3, metalness: 0.2 }), STARS);
    this.starMesh.frustumCulled = false;
    this.root.add(this.starMesh);
    this.starObjs = this.starList.map((st, i) => {
      const o = this._obj({ kind: 'moonstar', star: i, at: st.at, iconY: 0.2, reach: 1.8, hitRadius: 0.9 });
      o.worldPos.copy(st.pos).setY(st.pos.y - 0.2);
      o.hit.position.copy(st.pos);
      return o;
    });
    this._layoutStars();
  }
  _layoutStars() {
    const d = this._d2 ??= new THREE.Object3D();
    this.starList.forEach((st, i) => {
      if (st.got && st.flying < 0) { d.position.set(0, -500, 0); d.scale.setScalar(0.0001); }
      else {
        d.position.copy(st.pos);
        if (st.flying >= 0) { d.position.y += st.flying * st.flying * 18; d.scale.setScalar(Math.max(0.05, 1 - st.flying * 0.6)); } else { d.position.y += Math.sin(this.t * 2 + i) * 0.15; d.scale.setScalar(1); }
        d.rotation.set(0, this.t * 1.5 + i, 0);
      }
      d.updateMatrix();
      this.starMesh.setMatrixAt(i, d.matrix);
    });
    this.starMesh.instanceMatrix.needsUpdate = true;
  }
  // The flag on the rim of the big crater: a stone with a pole lying by it, then planted and waving.
  _flag() {
    const p = this._w(...FLAG_AT);
    this.flagBase = p;
    this._static(new THREE.Mesh(merge([box(0.7, 0.3, 0.7, 0x6a6a70, p.x, p.y + 0.12, p.z)]), MAT({ roughness: 1 })));
    this.pole = new THREE.Mesh(merge([box(0.07, 2.6, 0.07, 0xdfe2e8, 0, 1.3, 0), box(0.14, 0.14, 0.14, 0xf2c84b, 0, 2.65, 0)]), MAT({ roughness: 0.4, metalness: 0.5 }));
    this.pole.position.copy(p).setY(p.y + 0.25);
    this.root.add(this.pole);
    // The cloth: blue, a golden star in the middle (a grid, so it can wave).
    const W = 1.6, H = 1.05, nx = 8, ny = 5, geo = new THREE.PlaneGeometry(W, H, nx, ny);
    geo.translate(W / 2, 0, 0);
    const pc = geo.attributes.position, colr = new Float32Array(pc.count * 3), cc = new THREE.Color();
    for (let i = 0; i < pc.count; i++) { const x = pc.getX(i) - W / 2, y = pc.getY(i); cc.setHex(Math.abs(x) + Math.abs(y) * 1.2 < 0.28 ? 0xffd34a : 0x2a5ad8); colr.set([cc.r, cc.g, cc.b], i * 3); }
    geo.setAttribute('color', new THREE.BufferAttribute(colr, 3));
    this.cloth = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.8 }));
    this.cloth.userData.x0 = Float32Array.from({ length: pc.count }, (_, i) => pc.getX(i));
    this.cloth.position.set(0.04, 2.2, 0);
    this.pole.add(this.cloth);
    this.flagObj = this._obj({ kind: 'moonflag', at: FLAG_AT, iconY: 1.9, reach: 2.4, hitRadius: 1.1 });
    this.flagUp = this.state.flag ? 1 : -1;
    this._flagLook();
  }
  _flagLook() {
    const up = this.flagUp >= 0;
    this.pole.rotation.set(0, -0.8, up ? 0 : Math.PI / 2 - 0.12);
    this.pole.position.y = this.flagBase.y + (up ? 0.25 : 0.32);
    this.cloth.visible = up;
    this.cloth.position.y = 1.0 + 1.2 * Math.max(0, this.flagUp);
  }
  plantFlag() { this.flagUp = 0; this._flagLook(); }

  // ===== The hero arrives =====
  spawn() {
    const s = this.s, p = this._w(...SPAWN);
    s.autoWalk = null; s.playerVY = 0;
    s.player.position.copy(p);
    s.player.rotation.y = Math.PI * 0.85;
    if (s.pet?.tamed) s.pet.mesh.position.copy(this._w(SPAWN[0] - 1, SPAWN[1] + 0.8));
    s.interiorFactor = 0; s.activeHouse = null;
    s.camTarget.set(p.x, p.y + 0.6, p.z);
    s._updateCamera?.(5);
    // Glass bubble helmets for the hero and the dog (unless he already wears the astronaut suit).
    this.helmets = [];
    const glass = new THREE.MeshStandardMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.1, depthWrite: false });
    const put = (head, size, y) => { if (!head) return; const m = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), glass); m.position.y = y; head.add(m); this.helmets.push(m); };
    if (this.wantHelmet) put(s.player.userData.parts?.head, 0.7, 0.27);
    if (s.pet?.tamed) put(s.pet.mesh.userData.parts?.head, 0.52, 0.05);
    this.helmetMat = glass;
  }
  // The rocket takes off from the Moon with the hero inside: `onUp` goes home.
  liftOff(onUp) { this.lift = { t: 0, onUp, puff: 0 }; }
  get riding() { return !!this.lift; }
  rideStep(dt) {
    const L = this.lift, s = this.s;
    if (!L) return;
    s.autoWalk = null;
    L.t += dt;
    const fl = this.rocket.userData.flame;
    let y = 0;
    if (L.t > 3.2) { const t = L.t - 3.2; y = 0.5 * 6 * t * t; }
    fl.visible = L.t > 2.4;
    if (fl.visible) { const n = 1 + Math.sin(L.t * 30) * 0.15; fl.scale.set(n, n * (L.t > 3.2 ? 1.2 : 0.5), n); }
    this.rocket.rotation.z = L.t > 1.4 && L.t < 3.2 ? Math.sin(L.t * 40) * 0.01 : 0;
    const rp = this._w(...ROCKET_AT);
    this.rocket.position.set(rp.x, rp.y + 0.05 + y, rp.z);
    L.puff -= dt;
    if (fl.visible && y < 5 && L.puff <= 0) { L.puff = 0.1; s.particleBurst(rp.clone().setY(rp.y + 0.4), '#c8c8d0', 10); }
    s.player.position.set(rp.x, rp.y + 0.35 + y, rp.z);
    s.player.userData.isMoving = false;
    s.playerVY = 0; s.onGround = true; s.lastGroundAt = s.clock.elapsedTime;
    if (y > 22 && !L.called) { L.called = true; L.onUp?.(); }
  }
  seatDog(pet) { pet.mesh.position.copy(this.rocket.position).setY(this.rocket.position.y + 0.4); }

  // A part found (after its word): it flies to Bip.
  givePart(k) {
    const m = this.partMeshes[k];
    this.partFly = { k, t: 0, from: m.position.clone() };
    this.partObjs[k].active = false;
  }
  fixBip() { this.bipDance = 2.4; this.bipFall = 0; }
  sendStar(i) {
    const st = this.starList[i];
    st.got = true; st.flying = 0;
    this.starObjs[i].active = false;
    for (const c of ['#ffd34a', '#ffffff']) this.s.particleBurst(st.pos, c, 20);
  }
  // Every frame on the Moon.
  update(dt, elapsed) {
    this.t += dt;
    const s = this.s, p = s.player.position;
    if (this.earth) this.earth.rotation.y += dt * 0.05;
    // Jumps: "Boiiing!" (the first one is said).
    if (!s.onGround && this.wasGround && s.playerVY > 2) this.onJump?.();
    this.wasGround = s.onGround;
    // Footprints in the dust.
    if (s.onGround && !this.lift && dt > 0) {
      const lp = this.lastPrint;
      if (!lp || Math.hypot(p.x - lp.x, p.z - lp.z) > 0.6) {
        const ry = s.player.rotation.y, side = this.printSide = -this.printSide, d = this._d;
        d.position.set(p.x + Math.cos(ry) * 0.12 * side, this.groundAt(p.x, p.z) + 0.02, p.z - Math.sin(ry) * 0.12 * side);
        d.rotation.set(0, ry, 0); d.scale.setScalar(1); d.updateMatrix();
        this.prints.setMatrixAt(this.printN++ % 160, d.matrix);
        this.prints.instanceMatrix.needsUpdate = true;
        this.lastPrint = p.clone();
      }
    }
    // Parts bob and spin; one found flies to Bip.
    for (const m of this.partMeshes) if (m.visible) { m.rotation.y += dt * 1.2; m.position.y = m.userData.y0 + Math.sin(this.t * 2 + m.id) * 0.12; }
    if (this.partFly) {
      const f = this.partFly, m = this.partMeshes[f.k];
      f.t += dt;
      const k = Math.min(1, f.t / 1.1), to = this.bip.position.clone().setY(this.bip.position.y + 1);
      m.position.lerpVectors(f.from, to, k);
      m.position.y = f.from.y + (to.y - f.from.y) * k + Math.sin(k * Math.PI) * 3;
      if (k >= 1) { m.visible = false; this.partFly = null; this._bipLook(); this._partLook(); s.particleBurst(to, '#9af8ff', 18); }
    }
    // Bip: broken (tilted, a spark now and then), dancing when fixed, then following the hero, hopping.
    const b = this.bip;
    if (!this.state.bip) {
      b.rotation.z = 0.32;
      if (Math.random() < dt * 0.6) s.particleBurst(b.position.clone().setY(b.position.y + 1.2), '#9af8ff', 4);
    } else if (this.bipDance > 0) {
      this.bipDance -= dt;
      b.rotation.y += dt * 9; b.position.y = this.groundAt(b.position.x, b.position.z) + Math.abs(Math.sin(this.bipDance * 7)) * 0.5;
      b.rotation.z = 0;
      if (this.bipDance <= 0) { this.bipFall = 1.6; this.onBipFall?.(); }
    } else if (this.bipFall > 0) {
      this.bipFall -= dt;
      b.rotation.z = this.bipFall > 0.8 ? Math.min(1.4, (1.6 - this.bipFall) * 3) : Math.max(0, this.bipFall * 1.7);
    } else if (dt > 0) {
      b.rotation.z = 0;
      const tx = p.x + Math.sin(s.player.rotation.y + 2.2) * 1.8, tz = p.z + Math.cos(s.player.rotation.y + 2.2) * 1.8;
      const dx = tx - b.position.x, dz = tz - b.position.z, dist = Math.hypot(dx, dz);
      if (dist > 14) b.position.set(tx, this.groundAt(tx, tz), tz);
      else if (dist > 0.4) {
        const v = Math.min(dist * 2.2, 6) * dt;
        b.position.x += (dx / dist) * v; b.position.z += (dz / dist) * v;
        b.rotation.y = Math.atan2(dx, dz);
        this.bipHop += dt * 6;
      }
      b.position.y = this.groundAt(b.position.x, b.position.z) + Math.abs(Math.sin(this.bipHop)) * 0.35;
    }
    this.bipObj.worldPos.copy(b.position);
    this.bipObj.hit.position.copy(b.position).setY(b.position.y + 0.8);
    // Fallen stars: caught by running or jumping into them; one sent home flies up into the sky.
    for (let i = 0; i < this.starList.length; i++) {
      const st = this.starList[i];
      if (st.flying >= 0) { st.flying += dt; if (st.flying > 1.6) st.flying = -1; continue; }
      if (st.got || st.pending || dt === 0) continue;
      if (Math.hypot(p.x - st.pos.x, p.y + 0.9 - st.pos.y, p.z - st.pos.z) < 1.15) { st.pending = true; this.onStar?.(i); }
    }
    this._layoutStars();
    // The flag goes up its pole and waves (there is no wind on the Moon… magic!).
    if (this.flagUp >= 0 && this.flagUp < 1) { this.flagUp = Math.min(1, this.flagUp + dt * 0.6); this._flagLook(); }
    if (this.cloth.visible) {
      const pc = this.cloth.geometry.attributes.position, x0 = this.cloth.userData.x0;
      for (let i = 0; i < pc.count; i++) pc.setZ(i, Math.sin(x0[i] * 5 - elapsed * 4) * 0.08 * x0[i]);
      pc.needsUpdate = true;
    }
  }

  dispose() {
    for (const o of this.objs) this.s.removeInteractable?.(o);
    this.objs = [];
    for (const m of this.helmets ?? []) m.parent?.remove(m);
    this.helmets = [];
    this.helmetMat?.dispose();
    this.lift = null;
    disposeTree(this.root);
  }
}
