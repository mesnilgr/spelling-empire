// The companion: a blocky puppy that waits by the cottage until the child tames it with a word.
// Then it follows the hero, hops for joy at every good word, barks when a zombie comes, chases
// zombies off, and now and then digs up something useful.
import * as THREE from 'three';

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

export function buildPuppy() {
  const g = new THREE.Group();
  g.userData.dynamic = true;
  const fur = lambert(0xd8a46a), light = lambert(0xf4e2c4), dark = lambert(0x6a4428);
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
    box(head, 0.07, 0.07, 0.03, lambert(0x1a1a1a), sx, 0.06, 0.18);
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
    this.still = 0;
  }
  tame() { this.tamed = true; this.joy(); }
  joy() { this.joyT = 1.2; this.s.particleBurst(this.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)), '#ff6b9d', 10); }
  trick() { this.trickT = 1.0; }
  // Put the puppy next to the hero (after a teleport, or when it is left too far behind).
  catchUp() {
    const p = this.s.player.position, a = this.s.player.rotation.y;
    for (const [dx, dz] of [[-Math.sin(a) * 1.4, -Math.cos(a) * 1.4], [1.2, 0], [-1.2, 0], [0, 1.2], [0, -1.2], [0, 0]]) {
      const x = p.x + dx, z = p.z + dz;
      if (this.s._checkCollision(x, z) || this.s.inLava?.(x, z)) continue;
      this.mesh.position.set(x, this.s.groundAt(x, z), z);
      return;
    }
  }
  update(dt, t) {
    const m = this.mesh, parts = m.userData.parts, s = this.s, p = s.player.position;
    let moving = false;
    if (this.tamed && this.digging <= 0) {
      const dx = p.x - m.position.x, dz = p.z - m.position.z, d = Math.hypot(dx, dz);
      if (d > 14 || Math.abs(p.y - m.position.y) > 2.5) this.catchUp();
      else if (d > 1.7) {
        const speed = Math.min(7, 2.5 + d * 1.2);
        const nx = m.position.x + (dx / d) * speed * dt, nz = m.position.z + (dz / d) * speed * dt;
        if (!s._checkCollision(nx, nz) && !s.inLava?.(nx, nz)) { m.position.x = nx; m.position.z = nz; }
        else if (!s._checkCollision(nx, m.position.z)) m.position.x = nx;
        else if (!s._checkCollision(m.position.x, nz)) m.position.z = nz;
        m.position.y = s.groundAt(m.position.x, m.position.z);
        m.rotation.y = Math.atan2(dx, dz);
        moving = true;
      }
      // Zombies: bark when one comes, and push it away from the hero.
      this.barkCooldown -= dt;
      this.guardCooldown -= dt;
      const zs = s.zombies?.active ?? [];
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
      if (this.digT > PET.digEvery && !moving && !s._insideAnyHouse?.(m.position.x, m.position.z, 0)) { this.digT = 0; this.digging = 1.6; }
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
