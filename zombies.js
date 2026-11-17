// Night-time zombies: they come out at night, chase a hero who is outside, and never enter houses.
// Only the diamond sword defeats them; other swords (and bare hands) push them back.
import * as THREE from 'three';
import { createBlockyCharacter, animateCharacter } from './characters.js';
import { mergeDirect } from './perf.js';

export const ZOMBIE = {
  max: 4,
  speed: 2.5, // the hero walks at 4.5: you can always run away
  sight: 20, // starts chasing within this distance
  reach: 0.85, // catches the hero at this distance
  spawnMin: 14,
  spawnMax: 19,
  respawn: 18, // seconds before a defeated zombie comes back (same night)
  graceAfterCatch: 6, // seconds without attacks after being caught
  hp: 2, // diamond-sword hits to defeat one
};

export class ZombieManager {
  constructor(scene) {
    this.s = scene;
    this.list = [];
    this.enabled = true;
    this.grace = 0;
    this.nextSpawn = 0;
  }

  get active() { return this.list.filter((z) => z.alive); }

  // Is the hero safe? Inside a house (or not playing).
  heroSafe() {
    const s = this.s, p = s.player.position;
    return (s.activeHouse && s.interiorFactor > 0.3) || s._insideAnyHouse(p.x, p.z, 0.2) || !(s.canBeAttacked?.() ?? true);
  }

  _spot() {
    const s = this.s, p = s.player.position;
    for (let k = 0; k < 24; k++) {
      const a = Math.random() * Math.PI * 2, r = ZOMBIE.spawnMin + Math.random() * (ZOMBIE.spawnMax - ZOMBIE.spawnMin);
      const x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
      if (Math.hypot(x, z) > 80 || s._checkCollision(x, z) || s._insideAnyHouse(x, z, 1.2) || s.inLava?.(x, z)) continue;
      if (Math.abs(s.groundAt(x, z) - s.groundAt(p.x, p.z)) > 2) continue;
      return { x, z };
    }
    return null;
  }

  _spawn() {
    const at = this._spot();
    if (!at) return;
    const mesh = createBlockyCharacter('zombie');
    mergeDirect(mesh);
    mesh.position.set(at.x, this.s.groundAt(at.x, at.z), at.z);
    mesh.userData.walkPhase = Math.random() * 6;
    this.s.scene.add(mesh);
    const z = { mesh, alive: true, hp: ZOMBIE.hp, stun: 0, chasing: false, wander: { x: at.x, z: at.z, t: 0 }, rise: 0 };
    mesh.scale.setScalar(0.01);
    this.list.push(z);
    this.s.particleBurst(mesh.position.clone().add(new THREE.Vector3(0, 0.3, 0)), '#5a6a3a', 14);
  }

  _remove(z, puff = true) {
    if (puff) this.s.particleBurst(z.mesh.position.clone().add(new THREE.Vector3(0, 0.9, 0)), '#cfd8c0', 22);
    this.s.scene.remove(z.mesh);
    z.alive = false;
    z.gone = true;
  }

  clear(puff = true) {
    for (const z of this.list) if (!z.gone) this._remove(z, puff);
    this.list = [];
  }

  // Swing: hits zombies in front of the hero. power: 'diamond' | 'sword' | 'hand'.
  hit(power) {
    const s = this.s, p = s.player.position, a = s.player.rotation.y;
    const fx = Math.sin(a), fz = Math.cos(a);
    let touched = 0, defeated = 0;
    for (const z of this.active) {
      const dx = z.mesh.position.x - p.x, dz = z.mesh.position.z - p.z, d = Math.hypot(dx, dz);
      if (d > 2.0 || (dx * fx + dz * fz) / (d || 1) < 0.3) continue;
      touched++;
      // Knock back.
      const push = power === 'diamond' ? 1.2 : power === 'sword' ? 2.6 : 1.4;
      const nx = z.mesh.position.x + (dx / (d || 1)) * push, nz = z.mesh.position.z + (dz / (d || 1)) * push;
      if (!s._checkCollision(nx, nz) && !s._insideAnyHouse(nx, nz, 0.4)) z.mesh.position.set(nx, s.groundAt(nx, nz), nz);
      z.stun = power === 'hand' ? 0.8 : 1.4;
      s.particleBurst(z.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)), power === 'diamond' ? '#7ae8ff' : '#ffffff', 10);
      if (power === 'diamond') {
        z.hp -= 1;
        if (z.hp <= 0) { this._remove(z); defeated++; this.nextSpawn = Math.max(this.nextSpawn, s.clock.elapsedTime + ZOMBIE.respawn); }
      }
    }
    return { touched, defeated };
  }

  update(dt, t) {
    const s = this.s;
    const night = (s.night ?? 0) > 0.5;
    if (!this.enabled || !night) {
      if (this.list.length) this.clear(true); // dawn: they crumble away
      return;
    }
    this.list = this.list.filter((z) => !z.gone);
    if (this.grace > 0) this.grace -= dt;
    const p = s.player.position;
    const safe = this.heroSafe();
    // Keep a few zombies around the hero (not while safe inside).
    if (!safe && this.list.length < ZOMBIE.max && t > this.nextSpawn) { this._spawn(); this.nextSpawn = t + 3 + Math.random() * 3; }
    for (const z of this.list) {
      const m = z.mesh;
      if (m.scale.x < 1) m.scale.setScalar(Math.min(1, m.scale.x + dt * 1.5));
      const dx = p.x - m.position.x, dz = p.z - m.position.z, d = Math.hypot(dx, dz);
      z.chasing = !safe && d < ZOMBIE.sight;
      let tx, tz;
      if (z.stun > 0) { z.stun -= dt; m.userData.isMoving = false; }
      else {
        if (z.chasing) { tx = p.x; tz = p.z; }
        else {
          z.wander.t -= dt;
          if (z.wander.t <= 0) { const a = Math.random() * Math.PI * 2; z.wander = { x: m.position.x + Math.cos(a) * 3, z: m.position.z + Math.sin(a) * 3, t: 3 + Math.random() * 3 }; }
          tx = z.wander.x; tz = z.wander.z;
        }
        const ddx = tx - m.position.x, ddz = tz - m.position.z, dd = Math.hypot(ddx, ddz);
        m.userData.isMoving = dd > 0.3;
        if (dd > 0.3) {
          const sp = (z.chasing ? ZOMBIE.speed : ZOMBIE.speed * 0.4) * dt;
          const base = Math.atan2(ddx, ddz);
          // Try straight on, then turn a little either way to get round obstacles.
          for (const off of [0, 0.6, -0.6, 1.2, -1.2]) {
            const ang = base + off;
            const nx = m.position.x + Math.sin(ang) * sp, nz = m.position.z + Math.cos(ang) * sp;
            if (s._checkCollision(nx, nz) || s._insideAnyHouse(nx, nz, 0.5) || s.inLava?.(nx, nz)) continue;
            const ny = s.groundAt(nx, nz);
            if (ny - m.position.y > 0.55) continue;
            m.position.set(nx, ny, nz);
            m.rotation.y = s._lerpAngle(m.rotation.y, ang, 0.2);
            break;
          }
        }
      }
      m.userData.walkPhase = (m.userData.walkPhase ?? 0) + dt * (m.userData.isMoving ? 5 : 0);
      animateCharacter(m, dt, t);
      // Zombie pose: arms stretched forward.
      const parts = m.userData.parts;
      if (parts) { parts.leftArm.rotation.x = -1.4 + Math.sin(t * 3 + m.position.x) * 0.08; parts.rightArm.rotation.x = -1.4 + Math.cos(t * 3 + m.position.z) * 0.08; }
      // Caught!
      if (z.chasing && d < ZOMBIE.reach && this.grace <= 0 && z.stun <= 0) {
        this.grace = ZOMBIE.graceAfterCatch;
        s.onZombieCatch?.();
      }
    }
  }

  nearest() {
    const p = this.s.player.position;
    let best = Infinity;
    for (const z of this.active) best = Math.min(best, Math.hypot(z.mesh.position.x - p.x, z.mesh.position.z - p.z));
    return best;
  }
}
