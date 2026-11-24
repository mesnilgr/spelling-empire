// Word powers (J5): a hard word spelled right the first time gives a 20-second power. The power
// stone (on the path south of the cottage) wakes up and gives one for a hard word. Session 1:
// speed and super jump, and five clouds above the village to jump up to (a word on each cloud, a
// star, and Cocotte on the highest one). Session 2: giant (every step makes the animals bounce)
// and glide (from the highest cloud, through five golden rings down to the village).
// The letters of the word spelled trail behind the hero; the dog gets the same power.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const POWER_STONE = { x: 3.6, z: 31.2 };
// The five clouds: x, z, height of the top (absolute). A normal jump goes up 1.4 m, a super jump 4.7 m.
export const CLOUDS = [
  { x: 1.0, z: 28.0, h: 3.0 },
  { x: -1.0, z: 24.0, h: 5.8 },
  { x: 2.0, z: 20.5, h: 8.6 },
  { x: -1.5, z: 17.0, h: 11.4 },
  { x: 1.0, z: 13.5, h: 14.2 },
];
export const CLOUD_R = 1.8;
// The five rings of the glide, from the highest cloud (above the cottage) over the fountain, to the east.
export const RINGS = [
  { x: 1.5, z: 8.5, y: 12.0 },
  { x: 2.8, z: 3.6, y: 9.8 },
  { x: 5.6, z: -1.2, y: 7.6 },
  { x: 10.4, z: -1.8, y: 5.4 },
  { x: 15.0, z: 0.6, y: 3.2 },
];
export const RING_R = 1.5;
export const POWER_TIME = 20; // seconds
export const GLIDE_TIME = 45; // long enough to climb the clouds, then glide down
export const ANIMALS_GOAL = 5;
export const POWER_KINDS = {
  speed: { emoji: '💨' }, jump: { emoji: '🦘' }, giant: { emoji: '🦖' }, glide: { emoji: '🪂' },
};

export const PTX = {
  fr: {
    name: 'Pouvoirs des mots', stone: 'Pierre des pouvoirs',
    names: { speed: 'vitesse', jump: 'super saut', giant: 'géant', glide: 'planer' },
    wake: 'Les mots ont des pouvoirs ! Regarde les nuages… Épelle un mot difficile : tu pourras sauter jusqu’à eux !',
    stoneInstr: (p) => `Un mot difficile… Réussis-le et gagne le pouvoir : ${p} !`,
    cloudInstr: 'Tu es sur un nuage ! Épelle ce mot pour gagner l’étoile du nuage.',
    landInstr: (k) => `Bel atterrissage ! Épelle ce mot pour garder l’anneau ${k}.`,
    got: { speed: '💨 Pouvoir : vitesse ! Cours comme le vent !', jump: '🦘 Pouvoir : super saut ! Saute jusqu’aux nuages !', giant: '🦖 Pouvoir : géant ! Chaque pas fait rebondir les animaux !', glide: '🪂 Pouvoir : planer ! Saute de nuage en nuage, puis plane depuis le plus haut à travers les anneaux !' },
    gotSay: { speed: 'Pouvoir vitesse ! Cours comme le vent !', jump: 'Pouvoir super saut ! Appuie sur sauter : tu vas jusqu’aux nuages !', giant: 'Pouvoir géant ! Boum, boum ! Chaque pas fait rebondir les animaux !', glide: 'Pouvoir planer ! Monte sur le plus haut nuage, puis saute et plane à travers les anneaux dorés !' },
    hardBonus: (p) => `⚡ Mot difficile réussi du premier coup ! Pouvoir : ${p} !`,
    dogToo: 'Et ton chien aussi !',
    over: (p) => `⏳ Fini, le pouvoir ${p}. Un mot difficile à la pierre et ça recommence !`,
    cloudStar: (k) => `⭐ L’étoile du nuage ${k} ! Et ton pouvoir est rechargé !`,
    cloudStarSay: (k) => `L’étoile du nuage ${k} ! Ton pouvoir est rechargé : saute au nuage suivant !`,
    cloudsDone: '☁️ Tu es monté sur les cinq nuages ! Un petit nuage va te suivre partout !',
    cloudsDoneSay: 'Bravo ! Tu es monté sur les cinq nuages ! Regarde : un petit nuage va te suivre partout.',
    boing: 'Boing !',
    pouf: 'Pouf !',
    stomp: 'Boum !',
    animal: (n) => `🦖 Boum ! ${n} animal${n > 1 ? 'aux' : ''} sur ${ANIMALS_GOAL} a rebondi !`,
    animalsDone: '🦖 Cinq animaux ont rebondi ! Quel géant !',
    ring: (k) => `⭕ Anneau ${k} sur 5 !`,
    ringsKept: (n) => `⭕ ${n} anneau${n > 1 ? 'x' : ''} gardé${n > 1 ? 's' : ''} ! Encore ${5 - n} !`,
    ringsDone: '🦸 Les cinq anneaux ! Tu gagnes la cape du Héros des nuages !',
    ringsDoneSay: 'Les cinq anneaux ! Tu as volé comme un oiseau ! Tu gagnes la cape du Héros des nuages !',
    henHigh: 'Cocotte est tout là-haut, sur le plus haut nuage ! Il te faut le super saut.',
    partTwo: '⚡ La pierre des pouvoirs a deux nouveaux pouvoirs : géant et planer ! Va la toucher !',
    tooHigh: 'Il te faut le super saut pour monter sur les nuages : touche la pierre des pouvoirs !',
    label: '⚡ Pierre des pouvoirs',
    notYet: 'touche la pierre des pouvoirs, au bout du chemin !',
    lines: (c, r, a) => `☁️ Nuages : ${c}/5 · 🦖 Animaux rebondis : ${a}/${ANIMALS_GOAL} · ⭕ Anneaux : ${r}/5`,
    left: (p, s) => `${p} : ${s} s`,
  },
  en: {
    name: 'Word powers', stone: 'Power stone',
    names: { speed: 'speed', jump: 'super jump', giant: 'giant', glide: 'glide' },
    wake: 'Words have powers! Look at the clouds… Spell a hard word and you can jump up to them!',
    stoneInstr: (p) => `A hard word… Get it right and win the power: ${p}!`,
    cloudInstr: 'You are on a cloud! Spell this word to win the cloud’s star.',
    landInstr: (k) => `Nice landing! Spell this word to keep ring ${k}.`,
    got: { speed: '💨 Power: speed! Run like the wind!', jump: '🦘 Power: super jump! Jump up to the clouds!', giant: '🦖 Power: giant! Every step makes the animals bounce!', glide: '🪂 Power: glide! Jump from cloud to cloud, then glide from the highest one through the rings!' },
    gotSay: { speed: 'Speed power! Run like the wind!', jump: 'Super jump power! Press jump: you can reach the clouds!', giant: 'Giant power! Boom, boom! Every step makes the animals bounce!', glide: 'Glide power! Climb to the highest cloud, then jump and glide through the golden rings!' },
    hardBonus: (p) => `⚡ Hard word, first try! Power: ${p}!`,
    dogToo: 'And your dog too!',
    over: (p) => `⏳ The ${p} power is over. A hard word at the stone and off you go again!`,
    cloudStar: (k) => `⭐ Cloud ${k}’s star! And your power is recharged!`,
    cloudStarSay: (k) => `Cloud ${k}’s star! Your power is recharged: jump to the next cloud!`,
    cloudsDone: '☁️ You climbed all five clouds! A little cloud will follow you everywhere!',
    cloudsDoneSay: 'Well done! You climbed all five clouds! Look: a little cloud will follow you everywhere.',
    boing: 'Boing!',
    pouf: 'Poof!',
    stomp: 'Boom!',
    animal: (n) => `🦖 Boom! ${n} animal${n > 1 ? 's' : ''} of ${ANIMALS_GOAL} bounced!`,
    animalsDone: '🦖 Five animals bounced! What a giant!',
    ring: (k) => `⭕ Ring ${k} of 5!`,
    ringsKept: (n) => `⭕ ${n} ring${n > 1 ? 's' : ''} kept! ${5 - n} to go!`,
    ringsDone: '🦸 All five rings! You win the Cloud Hero cape!',
    ringsDoneSay: 'All five rings! You flew like a bird! You win the Cloud Hero cape!',
    henHigh: 'Cocotte is way up there, on the highest cloud! You need the super jump.',
    partTwo: '⚡ The power stone has two new powers: giant and glide! Go and touch it!',
    tooHigh: 'You need the super jump to get onto the clouds: touch the power stone!',
    label: '⚡ Power stone',
    notYet: 'touch the power stone, at the end of the path!',
    lines: (c, r, a) => `☁️ Clouds: ${c}/5 · 🦖 Animals bounced: ${a}/${ANIMALS_GOAL} · ⭕ Rings: ${r}/5`,
    left: (p, s) => `${p}: ${s} s`,
  },
};

const LIT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
// Clouds: soft and bright, a little light of their own so they stay white in the shade.
const CLOUD = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, emissive: 0x7a8494 });
function colorize(g, c) {
  const n = g.attributes.position.count, arr = new Float32Array(n * 3), pos = g.attributes.position;
  let ymin = Infinity, ymax = -Infinity;
  for (let i = 0; i < n; i++) { ymin = Math.min(ymin, pos.getY(i)); ymax = Math.max(ymax, pos.getY(i)); }
  for (let i = 0; i < n; i++) {
    const col = Array.isArray(c) ? new THREE.Color(c[0]).lerp(new THREE.Color(c[1]), (pos.getY(i) - ymin) / Math.max(0.001, ymax - ymin)) : new THREE.Color(c);
    arr[i * 3] = col.r; arr[i * 3 + 1] = col.g; arr[i * 3 + 2] = col.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  if (g.attributes.uv) g.deleteAttribute('uv');
  return g;
}
function mergeAll(geos) { const g = mergeGeometries(geos); geos.forEach((x) => x.dispose()); return g; }
function box(w, h, d, c, x, y, z, ry = 0) { const g = new THREE.BoxGeometry(w, h, d).toNonIndexed(); if (ry) g.rotateY(ry); g.translate(x, y, z); return colorize(g, c); }
function puff(r, c, x, y, z, sy = 0.62) { const g = new THREE.IcosahedronGeometry(r, 1).toNonIndexed(); g.scale(1, sy, 1); g.translate(x, y, z); return colorize(g, c); }

// One cloud: flat-topped puffs (top at y = 0), white on top, a little blue underneath.
function cloudPuffs(cx, cy, cz, s = 1) {
  const c = [0xc8d8f0, 0xffffff];
  return [
    puff(1.5 * s, c, cx, cy - 0.45 * s, cz),
    puff(1.0 * s, c, cx + 1.1 * s, cy - 0.5 * s, cz + 0.3 * s),
    puff(1.05 * s, c, cx - 1.05 * s, cy - 0.5 * s, cz - 0.2 * s),
    puff(0.9 * s, c, cx + 0.3 * s, cy - 0.5 * s, cz + 1.0 * s),
    puff(0.85 * s, c, cx - 0.2 * s, cy - 0.5 * s, cz - 1.05 * s),
    puff(0.7 * s, c, cx + 0.5 * s, cy - 0.1 * s, cz - 0.3 * s, 0.5),
  ];
}
export function buildPetCloud() {
  const m = new THREE.Mesh(mergeAll(cloudPuffs(0, 0, 0, 0.22)), CLOUD);
  m.userData.dynamic = true;
  return m;
}
// The power stone: a standing stone on a round base, with runes that glow when it is awake.
function buildStone(gy) {
  const st = 0x8c8a94, dk = 0x6c6a74, lt = 0xa8a6b0;
  // The round base is part of the same mesh (one draw call; no shadow, to spare the iPad).
  const stone = new THREE.Mesh(mergeAll([
    box(1.8, 0.24, 1.8, dk, 0, -0.32, 0), box(1.4, 0.2, 1.4, lt, 0, -0.1, 0, 0.4),
    box(0.9, 1.7, 0.6, [dk, st], 0, 0.85, 0), box(0.7, 0.3, 0.5, lt, 0, 1.85, 0), box(0.4, 0.2, 0.4, st, 0, 2.08, 0),
  ]), LIT);
  stone.userData.dynamic = true;
  stone.position.y = gy + 0.44;
  // Runes on the front (towards the camera, +z): a lightning bolt and two dots.
  const runeMat = new THREE.MeshBasicMaterial({ vertexColors: true, color: 0x8a8aa0 });
  const runes = new THREE.Mesh(mergeAll([
    box(0.1, 0.36, 0.04, 0xffffff, 0.06, 1.25, 0.31, 0), box(0.24, 0.08, 0.04, 0xffffff, 0, 1.05, 0.31), box(0.1, 0.36, 0.04, 0xffffff, -0.06, 0.85, 0.31),
    box(0.1, 0.1, 0.04, 0xffffff, -0.26, 1.5, 0.31), box(0.1, 0.1, 0.04, 0xffffff, 0.26, 0.55, 0.31),
  ]), runeMat);
  runes.userData.dynamic = true;
  stone.add(runes);
  return { stone, runeMat };
}
// A five-pointed star (the stars on the clouds, one instanced mesh).
function starGeometry() {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.17 : 0.4;
    if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r); else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false });
  g.translate(0, 0, -0.05);
  return g;
}

export class WordPowers {
  constructor(scene3D) {
    this.s = scene3D;
    const gy = scene3D.groundAt(POWER_STONE.x, POWER_STONE.z);
    const { stone, runeMat } = buildStone(0);
    this.stone = stone; this.runeMat = runeMat;
    stone.position.set(POWER_STONE.x, gy + 0.44, POWER_STONE.z);
    scene3D.scene.add(stone);
    scene3D.collidables.push({ x: POWER_STONE.x, z: POWER_STONE.z, r: 0.6 });
    this.obj = scene3D._addInteractable({ kind: 'powerstone', worldPos: new THREE.Vector3(POWER_STONE.x, gy, POWER_STONE.z), iconY: 3.0, reach: 2.6, hitRadius: 1.1 });
    // The five clouds: one mesh, and their tops are walkways (only from above: see groundAt).
    this.clouds = new THREE.Mesh(mergeAll(CLOUDS.flatMap((c) => cloudPuffs(c.x, c.h, c.z))), CLOUD);
    this.clouds.userData.dynamic = true;
    scene3D.scene.add(this.clouds);
    for (const [i, c] of CLOUDS.entries()) scene3D.walkways.push({ circle: true, cloud: true, index: undefined, cloudIndex: i, x: c.x, z: c.z, r: CLOUD_R, h: c.h, y: () => c.h });
    // A star on each cloud (shown once the stone is awake, gone once won).
    this.stars = new THREE.InstancedMesh(starGeometry(), new THREE.MeshStandardMaterial({ color: 0xffd34a, emissive: 0xffb020, emissiveIntensity: 0.9, metalness: 0.3, roughness: 0.4 }), CLOUDS.length);
    this.stars.userData.dynamic = true;
    this.stars.frustumCulled = false;
    this.stars.visible = false;
    scene3D.scene.add(this.stars);
    // The rings of the glide (session 2): golden, green once passed.
    this.rings = new THREE.InstancedMesh(new THREE.TorusGeometry(RING_R, 0.13, 8, 28), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x6a5010, emissiveIntensity: 0.6, roughness: 0.4, metalness: 0.4 }), RINGS.length);
    this.rings.userData.dynamic = true;
    this.rings.frustumCulled = false;
    this.rings.visible = false;
    scene3D.scene.add(this.rings);
    this.state = { awake: false, cloudsGot: [], ringsOn: false, ringsGot: [], petCloud: false };
    this.power = null; // { kind, left, word }
    this.t = 0; this.wakeT = -1; this.squash = 0; this.stompT = 0; this.trailT = 0;
    this.trail = []; this.trailWord = '';
    this.ringsThisFlight = new Set();
    this._dummy = new THREE.Object3D();
    this._layout();
  }
  setState(st) { Object.assign(this.state, st); this._layout(); }
  _layout() {
    const d = this._dummy, st = this.state;
    CLOUDS.forEach((c, i) => {
      const got = st.cloudsGot.includes(i);
      d.position.set(c.x, c.h + 0.75, c.z); d.rotation.set(0, 0, 0); d.scale.setScalar(got ? 0.0001 : 1); d.updateMatrix();
      this.stars.setMatrixAt(i, d.matrix);
    });
    this.stars.instanceMatrix.needsUpdate = true;
    this.stars.visible = st.awake && st.cloudsGot.length < CLOUDS.length;
    const gold = new THREE.Color(0xffd34a), green = new THREE.Color(0x5ae07a);
    RINGS.forEach((r, i) => {
      // Facing the way of the flight (from the previous ring, or the highest cloud).
      const prev = i ? RINGS[i - 1] : { x: CLOUDS[4].x, z: CLOUDS[4].z };
      d.position.set(r.x, r.y, r.z); d.rotation.set(0, Math.atan2(r.x - prev.x, r.z - prev.z), 0); d.scale.setScalar(1); d.updateMatrix();
      this.rings.setMatrixAt(i, d.matrix);
      this.rings.setColorAt(i, st.ringsGot.includes(i) ? green : gold);
    });
    this.rings.instanceMatrix.needsUpdate = true;
    if (this.rings.instanceColor) this.rings.instanceColor.needsUpdate = true;
    this.rings.visible = st.ringsOn;
    if (st.petCloud && !this.petCloud) { this.petCloud = buildPetCloud(); this.s.scene.add(this.petCloud); }
    if (!st.petCloud && this.petCloud) { this.s.scene.remove(this.petCloud); this.petCloud = null; }
  }
  // Wow: the stone wakes up (rises, runes glow), sparkles fly up to each cloud one after the other.
  wake() {
    this.wakeT = 0;
    const p = this.obj.worldPos.clone(); p.y += 2;
    for (const [k, c] of ['#ffd34a', '#7ae8ff', '#ff7ab0', '#ffffff'].entries()) setTimeout(() => this.s.particleBurst(p, c, 24), k * 120);
    CLOUDS.forEach((c, i) => setTimeout(() => {
      for (const col of ['#ffd34a', '#ffffff', '#7ae8ff']) this.s.particleBurst(new THREE.Vector3(c.x, c.h + 0.8, c.z), col, 18);
      this.onCloudPop?.(i);
    }, 700 + i * 380));
    this.s.screenShake?.(0.14);
  }
  // A power for `left` seconds; the letters of `word` trail behind the hero.
  give(kind, word, left = POWER_TIME) {
    this.power = { kind, left, word };
    this.s.power = kind;
    this._makeTrail(word);
    const p = this.s.player.position.clone(); p.y += 1;
    for (const c of ['#ffd34a', '#7ae8ff', '#ff7ab0']) this.s.particleBurst(p, c, 22);
  }
  refill(left = POWER_TIME) { if (this.power) this.power.left = Math.max(this.power.left, left); }
  stop() { this.power = null; this.s.power = null; this._makeTrail(''); }
  // Letter sprites (one small canvas texture per letter of the word), recycled along the trail.
  _makeTrail(word) {
    for (const t of this.trail) { this.s.scene.remove(t.sprite); t.sprite.material.map.dispose(); t.sprite.material.dispose(); }
    this.trail = [];
    this.trailWord = (word ?? '').toUpperCase().replace(/[^\p{L}]/gu, '').slice(0, 10);
    const hues = ['#ff5a5a', '#ffb03a', '#ffe14a', '#5ae07a', '#4ab0ff', '#b07aff'];
    [...this.trailWord].forEach((ch, i) => {
      const cv = document.createElement('canvas'); cv.width = cv.height = 64;
      const ctx = cv.getContext('2d');
      ctx.font = 'bold 50px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 8; ctx.strokeStyle = '#ffffff'; ctx.strokeText(ch, 32, 35);
      ctx.fillStyle = hues[i % hues.length]; ctx.fillText(ch, 32, 35);
      const tex = new THREE.CanvasTexture(cv);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
      sprite.scale.setScalar(0.55); sprite.visible = false; sprite.userData.dynamic = true;
      this.s.scene.add(sprite);
      this.trail.push({ sprite, life: 0 });
    });
    this.trailNext = 0;
  }
  onCloud() { const w = this.s._walkwayAt(this.s.player.position.x, this.s.player.position.z, this.s.player.position.y); return w?.cloud && this.s.onGround ? w.cloudIndex : -1; }
  update(dt) {
    this.t += dt;
    const s = this.s, p = s.player.position, t = this.t;
    // The stone: rises and glows while waking, then hums (runes pulse) once awake.
    if (this.wakeT >= 0) { this.wakeT += dt; if (this.wakeT > 2.5) this.wakeT = -1; }
    const lift = this.wakeT >= 0 ? Math.sin(Math.min(1, this.wakeT / 2.5) * Math.PI) * 0.6 : 0;
    this.stone.position.y = this.obj.worldPos.y + 0.44 + lift + (this.state.awake ? Math.sin(t * 2) * 0.04 : 0);
    this.stone.rotation.y = this.wakeT >= 0 ? this.wakeT * 5 : 0;
    if (this.state.awake || this.wakeT >= 0) this.runeMat.color.setHSL((t * 0.3) % 1, 0.9, 0.62 + Math.sin(t * 4) * 0.1);
    else this.runeMat.color.setRGB(0.5, 0.5, 0.6);
    // Stars spin and bob on their clouds.
    if (this.stars.visible) {
      const d = this._dummy;
      CLOUDS.forEach((c, i) => {
        if (this.state.cloudsGot.includes(i)) return;
        d.position.set(c.x, c.h + 0.75 + Math.sin(t * 2.5 + i) * 0.12, c.z); d.rotation.set(0, t * 2 + i, 0); d.scale.setScalar(1); d.updateMatrix();
        this.stars.setMatrixAt(i, d.matrix);
      });
      this.stars.instanceMatrix.needsUpdate = true;
    }
    // The little cloud that follows the hero (above the head).
    if (this.petCloud) {
      const sc = s.player.scale.y;
      this.petCloud.position.set(p.x + Math.sin(t * 1.3) * 0.15, p.y + 2.7 * sc + Math.sin(t * 2) * 0.1, p.z);
      this.petCloud.rotation.y = t * 0.4;
    }
    // Giant: the hero (and the dog) grow; back to normal size afterwards.
    const kind = this.power?.kind;
    const target = kind === 'giant' ? 2.4 : 1;
    const sc = s.player.scale.x + (target - s.player.scale.x) * Math.min(1, dt * 4);
    s.player.scale.set(sc * (1 + this.squash * 0.3), sc * (1 - this.squash * 0.35), sc * (1 + this.squash * 0.3));
    this.squash = Math.max(0, this.squash - dt * 3);
    const pet = s.pet?.tamed ? s.pet.mesh : null;
    if (pet) { const b = s.pet.baseScale ?? 1, want = b * (kind === 'giant' ? 2 : 1); pet.scale.setScalar(pet.scale.x + (want - pet.scale.x) * Math.min(1, dt * 4)); }
    // Giant steps: boom! The animals around bounce.
    if (kind === 'giant' && s.player.userData.isMoving && s.onGround && !s.inputLocked) {
      this.stompT -= dt;
      if (this.stompT <= 0) {
        this.stompT = 0.5;
        s.screenShake?.(0.06);
        s.particleBurst(p.clone().setY(p.y + 0.1), '#c8b890', 8);
        const hit = [];
        for (const a of s.fauna?.list ?? []) {
          if (a.def.swim || !a.mesh.visible) continue;
          if (Math.hypot(a.mesh.position.x - p.x, a.mesh.position.z - p.z) < 6.5 && !(a.bounceT > 0)) { a.bounceT = 0.7; hit.push(a); }
        }
        this.onStomp?.(hit);
      }
    }
    // Rings: fly through them (a gentle pull towards the centre when close).
    if (this.state.ringsOn && !s.onGround && !s.inputLocked) {
      RINGS.forEach((r, i) => {
        const dh = Math.hypot(r.x - p.x, r.z - p.z), dy = r.y - (p.y + 0.8);
        if (kind === 'glide' && dh < 5 && Math.abs(dy) < 4) {
          const k = Math.min(1, dt * 2.2);
          p.x += (r.x - p.x) * k * 0.6; p.z += (r.z - p.z) * k * 0.6; if (dy < 0) p.y += dy * k; // never lifts the hero
        }
        if (dh < RING_R + 0.6 && Math.abs(dy) < 2.2 && !this.ringsThisFlight.has(i)) {
          this.ringsThisFlight.add(i);
          for (const c of ['#ffd34a', '#ffffff']) s.particleBurst(new THREE.Vector3(r.x, r.y, r.z), c, 20);
          this.onRing?.(i);
        }
      });
    }
    // The letters of the word trail behind the hero while running with a power.
    if (this.trail.length) {
      this.trailT -= dt;
      if (this.power && s.player.userData.isMoving && this.trailT <= 0) {
        this.trailT = 0.12;
        const tr = this.trail[this.trailNext++ % this.trail.length];
        tr.life = 1;
        tr.sprite.position.set(p.x, p.y + 0.9 * s.player.scale.y, p.z);
        tr.sprite.visible = true;
      }
      for (const tr of this.trail) {
        if (tr.life <= 0) continue;
        tr.life -= dt * 1.1;
        tr.sprite.position.y += dt * 0.5;
        tr.sprite.material.opacity = Math.max(0, tr.life);
        tr.sprite.scale.setScalar(0.35 + tr.life * 0.3);
        if (tr.life <= 0) tr.sprite.visible = false;
      }
    }
  }
}
