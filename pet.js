// The companion: a blocky puppy that waits by the cottage until the child tames it with a word.
// Then it follows the hero, hops for joy at every good word, barks when a zombie comes, chases
// zombies off, and now and then digs up something useful.
import * as THREE from 'three';
import { LAVA } from './regions.js';

export const PET = { x: 3.2, z: 17.6, digEvery: 150, barkRange: 10, guardRange: 2.6 };
export const PET_NAMES = { fr: ['Biscuit', 'Caramel', 'Noisette', 'Pirouette'], en: ['Biscuit', 'Toffee', 'Hazel', 'Pepper'] };

const lambert = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
function box(parent, w, h, d, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.userData.dynamic = true;
  parent.add(m);
  return m;
}

// golem: the last level, a dog made of stone and iron with glowing eyes and moss.
export function buildPuppy(golem = false) {
  const g = new THREE.Group();
  g.userData.dynamic = true;
  const fur = golem ? new THREE.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 0.35, roughness: 0.6 }) : lambert(0xd8a46a);
  const light = golem ? lambert(0x6e747c) : lambert(0xf4e2c4);
  const dark = golem ? lambert(0x4f9a3a) : lambert(0x6a4428);
  const body = new THREE.Group();
  g.add(body);
  box(body, 0.42, 0.34, 0.7, fur, 0, 0.42, 0);
  box(body, 0.36, 0.1, 0.5, light, 0, 0.27, 0.02);
  const head = new THREE.Group();
  head.position.set(0, 0.68, 0.38);
  body.add(head);
  box(head, 0.4, 0.36, 0.36, fur, 0, 0, 0);
  box(head, 0.22, 0.16, 0.18, light, 0, -0.07, 0.24); // muzzle
  box(head, 0.09, 0.07, 0.05, lambert(0x1a1a1a), 0, -0.02, 0.34); // nose
  for (const sx of [-0.11, 0.11]) {
    box(head, 0.07, 0.07, 0.03, golem ? new THREE.MeshStandardMaterial({ color: 0x7ae8ff, emissive: 0x4ad8ff, emissiveIntensity: 1.8 }) : lambert(0x1a1a1a), sx, 0.06, 0.18);
    const ear = box(head, 0.1, 0.22, 0.12, dark, sx * 1.9, 0.12, -0.02);
    ear.rotation.z = sx > 0 ? -0.35 : 0.35;
  }
  const collar = box(body, 0.44, 0.08, 0.1, lambert(0xd8382e), 0, 0.55, 0.3);
  const tail = new THREE.Group();
  tail.position.set(0, 0.55, -0.35);
  body.add(tail);
  box(tail, 0.08, 0.08, 0.28, dark, 0, 0.06, -0.12).rotation.x = -0.6;
  const legs = [];
  for (const [x, z] of [[-0.13, 0.24], [0.13, 0.24], [-0.13, -0.24], [0.13, -0.24]]) {
    const leg = new THREE.Group();
    leg.position.set(x, 0.3, z);
    box(leg, 0.11, 0.3, 0.11, fur, 0, -0.15, 0);
    body.add(leg);
    legs.push(leg);
  }
  if (golem) {
    // Iron plates, moss and glowing cracks.
    const iron = new THREE.MeshStandardMaterial({ color: 0xd8dce2, metalness: 0.6, roughness: 0.35 });
    const glow = new THREE.MeshStandardMaterial({ color: 0xffb02a, emissive: 0xff8a1a, emissiveIntensity: 1.3 });
    box(body, 0.46, 0.06, 0.4, iron, 0, 0.61, -0.05);
    box(body, 0.03, 0.18, 0.04, glow, 0.215, 0.42, 0.1);
    box(body, 0.03, 0.04, 0.2, glow, -0.215, 0.45, -0.1);
    box(head, 0.3, 0.06, 0.3, lambert(0x4f9a3a), 0.02, 0.2, -0.02);
    box(head, 0.12, 0.05, 0.04, glow, 0, -0.12, 0.33);
  }
  g.userData.parts = { body, head, tail, legs, collar };
  return g;
}

export class PetManager {
  constructor(scene3D) {
    this.s = scene3D;
    this.mesh = buildPuppy();
    this.mesh.position.set(PET.x, scene3D.groundAt(PET.x, PET.z), PET.z);
    this.mesh.rotation.y = Math.PI * 0.8;
    scene3D.scene.add(this.mesh);
    this.obj = scene3D._addInteractable({ kind: 'pet', worldPos: this.mesh.position.clone(), iconY: 1.2, reach: 1.6, hitRadius: 0.8 });
    this.tamed = false;
    this.joyT = 0;
    this.trickT = 0;
    this.barkCooldown = 0;
    this.guardCooldown = 0;
    this.digT = 0;
    this.digging = 0;
    this.stage = 0;
    this.biteCooldown = 10;
    this.lunge = null;
    this.still = 0;
  }
  tame() { this.tamed = true; this.joy(); }
  // Growing up: puppy (0), dog (1), big dog (2), giant dog (3), dog golem (4).
  // Bigger dogs dig and bite more often; the golem is a new body of stone and iron.
  setStage(stage) {
    if (this.stage === stage) return;
    const wasGolem = this.stage === 4;
    this.stage = stage;
    if ((stage === 4) !== wasGolem) {
      const old = this.mesh, armor = !!this.armor;
      if (armor) this.setArmor(false);
      this.mesh = buildPuppy(stage === 4);
      this.mesh.position.copy(old.position);
      this.mesh.rotation.y = old.rotation.y;
      this.s.scene.remove(old);
      this.s.scene.add(this.mesh);
      if (armor) this.setArmor(true);
      if (stage === 4 && this.tamed) {
        for (const c of ['#7ae8ff', '#ffffff', '#ffb02a']) this.s.particleBurst(this.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)), c, 30);
        this.s.screenShake?.(0.3);
      }
    }
    this.baseScale = [1, 1.25, 1.5, 1.8, 1.9][stage] ?? 1;
    this.mesh.scale.setScalar(this.baseScale);
    this.obj.iconY = 1.2 * this.mesh.scale.x;
  }
  setArmor(on) {
    if (!!this.armor === !!on) return;
    const parts = this.mesh.userData.parts;
    if (on) {
      const g = new THREE.Group();
      const iron = new THREE.MeshStandardMaterial({ color: 0xc8ccd2, metalness: 0.6, roughness: 0.35 });
      const gold = new THREE.MeshStandardMaterial({ color: 0xf2c84b, metalness: 0.6, roughness: 0.3 });
      box(g, 0.48, 0.12, 0.6, iron, 0, 0.62, 0);
      box(g, 0.06, 0.22, 0.58, iron, -0.24, 0.5, 0); box(g, 0.06, 0.22, 0.58, iron, 0.24, 0.5, 0);
      box(g, 0.5, 0.05, 0.08, gold, 0, 0.69, 0.1);
      box(parts.head, 0.42, 0.1, 0.38, iron, 0, 0.22, 0); // little helmet
      this.helmet = parts.head.children[parts.head.children.length - 1];
      parts.body.add(g);
      this.armor = g;
    } else {
      this.armor.parent.remove(this.armor); this.armor = null;
      this.helmet?.parent?.remove(this.helmet); this.helmet = null;
    }
  }
  joy() { this.joyT = 1.2; this.s.particleBurst(this.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)), '#ff6b9d', 10); }
  trick() { this.trickT = 1.0; }
  // A big jump to catch a snowball (J7).
  leap() { this.leapT = 0.7; }
  // A cuddle: hearts float up and it rolls over happily.
  pat() {
    this.trickT = 1.0; this.joyT = 1.0;
    for (let k = 0; k < 3; k++) setTimeout(() => this.s.particleBurst(this.mesh.position.clone().add(new THREE.Vector3(0, 1 + k * 0.2, 0)), '#ff6b9d', 8), k * 200);
  }
  // Put the puppy next to the hero (after a teleport, or when it is left too far behind).
  catchUp() {
    const p = this.s.player.position, a = this.s.player.rotation.y;
    this.hop = null;
    const w = this.s._walkwayAt?.(p.x, p.z, p.y);
    // On a cloud (J5): the dog jumps up too.
    if (w?.cloud) { const a2 = Math.atan2(p.x - w.x, p.z - w.z); const r = Math.min(w.r - 0.5, Math.hypot(p.x - w.x, p.z - w.z) + 0.6); this.mesh.position.set(w.x + Math.sin(a2 + 0.6) * r, w.h, w.z + Math.cos(a2 + 0.6) * r); return; }
    if (w?.box) { this.mesh.position.set(Math.min(w.x1 - 0.35, Math.max(w.x0 + 0.35, p.x - 0.6)), w.y(), Math.min(w.z1 - 0.35, Math.max(w.z0 + 0.35, p.z + 0.6))); return; }
    for (const [dx, dz] of [[-Math.sin(a) * 1.4, -Math.cos(a) * 1.4], [1.2, 0], [-1.2, 0], [0, 1.2], [0, -1.2], [0, 0]]) {
      const x = p.x + dx, z = p.z + dz;
      if (this.s._checkCollision(x, z) || this.s.inLava?.(x, z)) continue;
      this.mesh.position.set(x, this.s.groundAt(x, z), z);
      return;
    }
  }
  // On the lava course the puppy jumps from pillar to pillar behind the hero, and never touches
  // the lava. Returns true while it is in charge of the puppy's movement.
  _course(dt) {
    const m = this.mesh, s = this.s, p = s.player.position;
    const inside = (x, z) => x > LAVA.x0 - 0.3 && x < LAVA.x1 + 0.3 && z > LAVA.z0 - 0.3 && z < LAVA.z1 + 0.3;
    if (!this.hop && !inside(p.x, p.z) && !inside(m.position.x, m.position.z)) return false;
    if (this.hop) {
      const h = this.hop;
      h.k = Math.min(1, h.k + dt / h.time);
      m.position.x = h.from.x + (h.to.x - h.from.x) * h.k;
      m.position.z = h.from.z + (h.to.z - h.from.z) * h.k;
      m.position.y = h.from.y + (h.to.y - h.from.y) * h.k + Math.sin(h.k * Math.PI) * h.lift;
      m.rotation.y = Math.atan2(h.to.x - h.from.x, h.to.z - h.from.z);
      if (h.k >= 1) { this.hop = null; m.position.y = h.to.y; }
      return true;
    }
    // Where the hero stands (only when he is on something solid).
    if (!s.onGround) return true;
    const heroSupport = s._walkwayAt(p.x, p.z) ?? (inside(p.x, p.z) ? null : 'ground');
    if (!heroSupport) return true;
    const a = s.player.rotation.y;
    let tx = p.x - Math.sin(a) * 0.9, tz = p.z - Math.cos(a) * 0.9;
    if (heroSupport !== 'ground') { tx = Math.min(heroSupport.x1 - 0.35, Math.max(heroSupport.x0 + 0.35, tx)); tz = Math.min(heroSupport.z1 - 0.35, Math.max(heroSupport.z0 + 0.35, tz)); }
    else if (inside(tx, tz)) { tx = p.x; tz = p.z; }
    const mine = s._walkwayAt(m.position.x, m.position.z) ?? (inside(m.position.x, m.position.z) ? null : 'ground');
    const d = Math.hypot(tx - m.position.x, tz - m.position.z);
    if (mine === heroSupport && mine !== null) {
      // Same pillar (or both on the ground): trot over.
      if (d > 0.4) {
        const k = Math.min(1, (3.5 * dt) / d);
        m.position.x += (tx - m.position.x) * k; m.position.z += (tz - m.position.z) * k;
        m.position.y = s.groundAt(m.position.x, m.position.z);
        m.rotation.y = Math.atan2(tx - m.position.x, tz - m.position.z);
        this.trotting = true;
      }
      return true;
    }
    // Another pillar: jump to it (far away or lost: appear next to the hero).
    const ty = s.groundAt(tx, tz);
    if (d > 7 || mine === null) { m.position.set(tx, ty, tz); return true; }
    this.hop = { from: m.position.clone(), to: new THREE.Vector3(tx, ty, tz), k: 0, time: 0.35 + d * 0.06, lift: 0.9 + d * 0.12 };
    return true;
  }
  update(dt, t) {
    const m = this.mesh, parts = m.userData.parts, s = this.s, p = s.player.position;
    // In the mine cart (J8, on the island or down in the mine): the dog sits at the front, ears in the wind.
    const rider = s.rider;
    if (this.tamed && rider) { rider.seatDog(this, t); return; }
    let moving = false;
    this.trotting = false;
    const onCourse = this.tamed && this._course(dt);
    if (onCourse) moving = !!this.hop || this.trotting;
    if (this.lunge) {
      const L = this.lunge, z = L.z;
      L.t += dt;
      const k = Math.min(1, L.t / 0.35);
      const tx = z.mesh.position.x, tz = z.mesh.position.z;
      m.position.x = L.from.x + (tx - L.from.x) * k * 0.85; m.position.z = L.from.z + (tz - L.from.z) * k * 0.85;
      m.position.y = s.groundAt(m.position.x, m.position.z) + Math.sin(k * Math.PI) * 0.7;
      m.rotation.y = Math.atan2(tx - L.from.x, tz - L.from.z);
      if (k >= 1) {
        this.lunge = null;
        if (z.alive) {
          const d = Math.hypot(tx - L.from.x, tz - L.from.z) || 1, ux = (tx - L.from.x) / d, uz = (tz - L.from.z) / d;
          if (z.armed && this.stage < 4) { s.zombies._disarm(z, ux, uz); this.onBite?.(true); }
          else { s.zombies.defeat(z, ux, uz); this.onBite?.(false); }
          this.joyT = 0.6;
        }
      }
      moving = true;
    }
    if (this.tamed && this.digging <= 0 && !onCourse && !this.lunge) {
      const dx = p.x - m.position.x, dz = p.z - m.position.z, d = Math.hypot(dx, dz);
      if (d > 14 || Math.abs(p.y - m.position.y) > 2.5) this.catchUp();
      else if (d > 1.7) {
        const speed = Math.min(7, 2.5 + d * 1.2);
        const nx = m.position.x + (dx / d) * speed * dt, nz = m.position.z + (dz / d) * speed * dt;
        if (!s._checkCollision(nx, nz) && !s.inLava?.(nx, nz)) { m.position.x = nx; m.position.z = nz; }
        else if (!s._checkCollision(nx, m.position.z)) m.position.x = nx;
        else if (!s._checkCollision(m.position.x, nz)) m.position.z = nz;
        m.position.y = s.groundAt(m.position.x, m.position.z, m.position.y);
        m.rotation.y = Math.atan2(dx, dz);
        moving = true;
      }
      // Zombies: bark when one comes, and push it away from the hero.
      this.barkCooldown -= dt;
      this.guardCooldown -= dt;
      const zs = s.zombies?.active ?? [];
      // A grown dog sometimes jumps on a zombie and bites it.
      this.biteCooldown -= dt;
      if (this.stage >= 1 && this.biteCooldown <= 0 && !this.lunge) {
        const z = zs.find((zz) => zz.alive && Math.hypot(zz.mesh.position.x - m.position.x, zz.mesh.position.z - m.position.z) < 3.5 && Math.hypot(zz.mesh.position.x - p.x, zz.mesh.position.z - p.z) < 10);
        if (z) { this.lunge = { z, t: 0, from: m.position.clone() }; this.biteCooldown = [99, 25, 18, 12, 7][this.stage] * (this.armor ? 0.6 : 1); }
      }
      for (const z of zs) {
        const zd = Math.hypot(z.mesh.position.x - m.position.x, z.mesh.position.z - m.position.z);
        if (zd < PET.barkRange && this.barkCooldown <= 0) { this.barkCooldown = 8; this.onBark?.(); this.joyT = Math.max(this.joyT, 0.4); }
        if (zd < PET.guardRange && this.guardCooldown <= 0 && z.stun <= 0) {
          this.guardCooldown = 4;
          const ux = (z.mesh.position.x - m.position.x) / (zd || 1), uz = (z.mesh.position.z - m.position.z) / (zd || 1);
          for (const push of [1.5, 0.8]) {
            const nx = z.mesh.position.x + ux * push, nz = z.mesh.position.z + uz * push;
            if (s._checkCollision(nx, nz) || s._insideAnyHouse?.(nx, nz, 0.4) || s.inLava?.(nx, nz)) continue;
            z.mesh.position.set(nx, s.groundAt(nx, nz), nz);
            break;
          }
          z.stun = 1.2;
          m.rotation.y = Math.atan2(ux, uz);
          this.trickT = 0.4;
          this.onGuard?.();
        }
      }
      // Now and then, outside, it digs something up.
      this.digT += dt;
      if (this.digT > PET.digEvery * [1, 0.8, 0.65, 0.5, 0.4][this.stage] && !moving && !s._insideAnyHouse?.(m.position.x, m.position.z, 0)) { this.digT = 0; this.digging = 1.6; }
    }
    if (this.digging > 0) {
      this.digging -= dt;
      if (Math.random() < dt * 12) s.particleBurst(m.position.clone().add(new THREE.Vector3(0, 0.2, 0.3)), '#8a6a42', 3);
      parts.body.rotation.x = 0.35;
      if (this.digging <= 0) { parts.body.rotation.x = 0; this.onDig?.(); }
    }
    // Animation.
    this.still = moving ? 0 : this.still + dt;
    const wag = this.tamed ? (this.joyT > 0 ? 18 : 8) : 3;
    parts.tail.rotation.y = Math.sin(t * wag) * 0.6;
    const k = moving ? Math.sin(t * 14) * 0.6 : 0;
    parts.legs.forEach((l, i) => { l.rotation.x = i % 3 === 0 ? k : -k; });
    let y = 0;
    if (this.joyT > 0) { this.joyT -= dt; y = Math.abs(Math.sin(this.joyT * 9)) * 0.35; }
    if (this.leapT > 0) { this.leapT -= dt; y = Math.max(y, Math.sin((0.7 - Math.max(0, this.leapT)) / 0.7 * Math.PI) * 1.2); }
    if (this.trickT > 0) { this.trickT -= dt; parts.body.rotation.y = (1 - this.trickT) * Math.PI * 2; } else parts.body.rotation.y = 0;
    // Sitting when it has been still for a while.
    const sit = !moving && this.digging <= 0 && this.still > 1.5 && this.joyT <= 0;
    parts.body.rotation.x = this.digging > 0 ? 0.35 : sit ? -0.35 : 0;
    parts.body.position.y = y + (sit ? -0.08 : 0);
    if (sit) { parts.legs[2].rotation.x = 1.2; parts.legs[3].rotation.x = 1.2; }
    parts.head.rotation.y = sit ? Math.sin(t * 0.7) * 0.3 : 0;
    // The tap target follows the puppy.
    this.obj.worldPos.copy(m.position);
    this.obj.iconHolder.position.copy(m.position).add(new THREE.Vector3(0, this.obj.iconY, 0));
    this.obj.hit.position.copy(this.obj.iconHolder.position).add(new THREE.Vector3(0, -0.35, 0));
  }
}
