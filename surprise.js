// The surprise chest (v1.24.3): now and then (every few minutes of play) a sparkling chest pops out
// of the ground somewhere near the hero. It is announced (written and read) and the golden arrow
// shows it; a word opens it, and inside there is a random little treasure.
import * as THREE from 'three';
import { buildChest } from './icons.js';

export const SURPRISE_EVERY = 300; // seconds of play between two surprise chests
export const STX = {
  fr: {
    appear: 'Un coffre surprise est apparu près de toi ! Suis la flèche dorée !',
    title: 'Le coffre surprise', instr: 'Épelle ce mot pour ouvrir le coffre surprise !',
    label: '🎁 Surprise !',
    stars: (n) => `Dans le coffre surprise : ${n} étoiles !`,
    diamond: 'Dans le coffre surprise : un diamant et 3 étoiles !',
    crystal: 'Dans le coffre surprise : deux cristaux et 3 étoiles !',
    mega: 'Waouh ! Un méga coffre : 15 étoiles !',
  },
  en: {
    appear: 'A surprise chest appeared near you! Follow the golden arrow!',
    title: 'The surprise chest', instr: 'Spell this word to open the surprise chest!',
    label: '🎁 Surprise!',
    stars: (n) => `In the surprise chest: ${n} stars!`,
    diamond: 'In the surprise chest: a diamond and 3 stars!',
    crystal: 'In the surprise chest: two crystals and 3 stars!',
    mega: 'Wow! A mega chest: 15 stars!',
  },
};
// What is inside (picked at random): stars, a diamond, crystals, or (rarely) a mega chest.
export function rollSurprise(r = Math.random()) {
  if (r < 0.1) return { kind: 'mega', stars: 15 };
  if (r < 0.3) return { kind: 'diamond', stars: 3, materials: { diamond: 1 } };
  if (r < 0.5) return { kind: 'crystal', stars: 3, materials: { crystal: 2 } };
  return { kind: 'stars', stars: 5 + Math.floor(r * 10) % 4 };
}

export class SurpriseChest {
  constructor(scene3D) {
    this.s = scene3D;
    this.mesh = buildChest();
    this.mesh.userData.dynamic = true;
    this.mesh.visible = false;
    scene3D.scene.add(this.mesh);
    this.obj = scene3D._addInteractable({ kind: 'surprisechest', worldPos: new THREE.Vector3(), iconY: 1.6, reach: 2.4, hitRadius: 1.0 });
    this.obj.active = false; this.obj.iconHolder.visible = false;
    this.t = 0; this.riseT = -1; this.openT = -1; this.sparkT = 0;
  }
  get out() { return this.mesh.visible && this.openT < 0; }
  // A free spot 7 to 14 m from the hero, on open ground at about the hero's height.
  _spot() {
    const s = this.s, p = s.player.position;
    for (let k = 0; k < 40; k++) {
      const a = Math.random() * Math.PI * 2, r = 7 + Math.random() * 7, x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
      if (Math.hypot(x, z) > 85) continue;
      if ([0, 0.8, -0.8].some((d) => s._checkCollision(x + d, z) || s._checkCollision(x, z + d)) || s._insideAnyHouse(x, z, 1.2) || s.inLava?.(x, z)) continue;
      if (Math.abs(s.groundAt(x, z) - s.groundAt(p.x, p.z)) > 1.2 || s._walkwayAt?.(x, z)) continue;
      return { x, z };
    }
    return null;
  }
  spawn() {
    const at = this._spot();
    if (!at) return null;
    const s = this.s, gy = s.groundAt(at.x, at.z), m = this.mesh;
    m.scale.setScalar(1.15);
    m.userData.lid.rotation.x = 0;
    m.position.set(at.x, gy - 1, at.z);
    m.rotation.set(0, Math.atan2(s.player.position.x - at.x, s.player.position.z - at.z), 0);
    m.visible = true;
    this.gy = gy; this.riseT = 0; this.openT = -1;
    const o = this.obj;
    o.worldPos.set(at.x, gy, at.z);
    o.iconHolder.position.copy(o.worldPos).add(new THREE.Vector3(0, o.iconY, 0));
    o.hit.position.copy(o.worldPos).add(new THREE.Vector3(0, 0.6, 0));
    o.active = true; o.iconHolder.visible = true;
    for (const c of ['#ffd34a', '#ffffff', '#ff8ab0']) s.particleBurst(new THREE.Vector3(at.x, gy + 0.8, at.z), c, 20);
    return at;
  }
  open() {
    this.openT = 0; this.obj.active = false; this.obj.iconHolder.visible = false;
    const p = this.mesh.position.clone(); p.y += 1;
    for (const [k, c] of ['#ffd34a', '#ff5a5a', '#5ad06a', '#5ab4ff', '#ffffff'].entries()) setTimeout(() => this.s.particleBurst(p, c, 22), k * 90);
  }
  update(dt) {
    const m = this.mesh;
    if (!m.visible) return;
    this.t += dt;
    if (this.riseT >= 0) {
      this.riseT += dt;
      const k = Math.min(1, this.riseT / 0.8);
      m.position.y = this.gy - 1 + k + Math.sin(k * Math.PI) * 0.6;
      m.rotation.y += dt * (1 - k) * 12;
      if (k >= 1) this.riseT = -1;
    }
    if (this.openT >= 0) {
      this.openT += dt;
      m.userData.lid.rotation.x = -2.2 * Math.min(1, this.openT / 0.25);
      if (this.openT > 1.2) m.scale.multiplyScalar(Math.max(0, 1 - dt * 6));
      if (this.openT > 1.8) { m.visible = false; this.openT = -1; }
      return;
    }
    // Waiting: it wobbles, its lid peeks, sparkles rise from it.
    m.rotation.z = Math.sin(this.t * 6) * 0.04;
    m.userData.lid.rotation.x = Math.sin(this.t * 2.5) > 0.8 ? -0.4 : 0;
    this.sparkT -= dt;
    if (this.sparkT <= 0 && this.riseT < 0) { this.sparkT = 0.5; this.s.particleBurst(m.position.clone().setY(m.position.y + 0.9), '#ffe08a', 5); }
  }
}
