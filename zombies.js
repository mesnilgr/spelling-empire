// Night-time zombies: they come out at night, chase a hero who is outside, and never enter houses.
// Any sword defeats one in a single hit (the diamond sword reaches further and hits all around);
// bare hands only push them back. A defeated zombie drops a piece of meat to pick up.
// One zombie in four is armed (iron helmet and an old sword): it takes two sword hits (the first
// knocks its sword away), or a single hit of the diamond sword.
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
  graceAfterCatch: 3, // seconds without being touched again
  meatLife: 150, // seconds a dropped piece of meat stays on the ground
  pickup: 1.0, // walk this close to a piece of meat to pick it up
  armedChance: 0.25, // one zombie in four is armed
};

export class ZombieManager {
  constructor(scene) {
    this.s = scene;
    this.list = [];
    this.enabled = true;
    this.grace = 0;
    this.nextSpawn = 0;
    this.drops = []; // meat on the ground (stays after dawn)
    this.dying = []; // zombies playing their defeat animation
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
    const armed = Math.random() < (this.armedChance ?? ZOMBIE.armedChance);
    const mesh = createBlockyCharacter(armed ? 'zombieArmed' : 'zombie');
    mergeDirect(mesh);
    if (armed) this._giveSword(mesh);
    mesh.position.set(at.x, this.s.groundAt(at.x, at.z), at.z);
    mesh.userData.walkPhase = Math.random() * 6;
    this.s.scene.add(mesh);
    const z = { mesh, alive: true, armed, hp: armed ? 2 : 1, stun: 0, chasing: false, wander: { x: at.x, z: at.z, t: 0 }, rise: 0 };
    mesh.scale.setScalar(0.01);
    this.list.push(z);
    this.s.particleBurst(mesh.position.clone().add(new THREE.Vector3(0, 0.3, 0)), '#5a6a3a', 14);
  }

  // An old rusty sword in the right hand (it points forward, like the arms).
  _giveSword(mesh) {
    const arm = mesh.userData.parts?.rightArm;
    if (!arm) return;
    const g = new THREE.Group();
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.66, 0.16), new THREE.MeshStandardMaterial({ color: 0xd0d4da, metalness: 0.4, roughness: 0.5, emissive: 0x6a7080, emissiveIntensity: 0.5 }));
    blade.position.y = -0.36;
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.32), new THREE.MeshStandardMaterial({ color: 0x5a3a22 }));
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, 0.07), new THREE.MeshStandardMaterial({ color: 0x3a2616 }));
    grip.position.y = 0.1;
    g.add(blade, guard, grip);
    g.position.set(0, -0.62, 0.06);
    arm.add(g);
    mesh.userData.sword = g;
  }
  // First hit on an armed zombie: its helmet and its sword fly away and it staggers back.
  _disarm(z, ux, uz) {
    const s = this.s, sw = z.mesh.userData.sword;
    const head = z.mesh.userData.parts?.head;
    const helmet = head?.children.find((c) => c.isMesh && c.material?.color?.getHex() === 0x8a929c);
    if (helmet) {
      const at = new THREE.Vector3();
      helmet.getWorldPosition(at);
      head.remove(helmet);
      helmet.position.copy(at);
      s.scene.add(helmet);
      this.flying ??= [];
      this.flying.push({ mesh: helmet, vx: -uz * 2 + ux, vz: ux * 2 + uz, vy: 6, t: 0 });
    }
    z.armed = false;
    z.hp = 1;
    if (sw) {
      const at = new THREE.Vector3();
      sw.getWorldPosition(at);
      sw.parent.remove(sw);
      sw.position.copy(at);
      sw.rotation.set(0, Math.random() * 6, Math.PI / 2);
      s.scene.add(sw);
      this.flying ??= [];
      this.flying.push({ mesh: sw, vx: ux * 3 + (Math.random() - 0.5) * 2, vz: uz * 3 + (Math.random() - 0.5) * 2, vy: 5, t: 0 });
      z.mesh.userData.sword = null;
    }
    s.particleBurst(z.mesh.position.clone().add(new THREE.Vector3(0, 1.3, 0)), '#ffd36a', 16);
    for (const push of [1.8, 1.0, 0.5]) {
      const nx = z.mesh.position.x + ux * push, nz = z.mesh.position.z + uz * push;
      if (s._checkCollision(nx, nz) || s._insideAnyHouse(nx, nz, 0.4) || s.inLava?.(nx, nz)) continue;
      z.mesh.position.set(nx, s.groundAt(nx, nz), nz);
      break;
    }
    z.stun = 1.0;
  }
  _tickFlying(dt) {
    if (!this.flying?.length) return;
    const s = this.s;
    for (const f of this.flying) {
      f.t += dt;
      const m = f.mesh, gy = s.groundAt(m.position.x, m.position.z) + 0.05;
      if (m.position.y > gy || f.vy > 0) {
        f.vy -= 18 * dt;
        m.position.x += f.vx * dt; m.position.z += f.vz * dt; m.position.y = Math.max(gy, m.position.y + f.vy * dt);
        m.rotation.x += dt * 12;
      }
      if (f.t > 1.4) { s.particleBurst(m.position.clone(), '#cfd8c0', 8); s.scene.remove(m); f.done = true; }
    }
    this.flying = this.flying.filter((f) => !f.done);
  }

  _remove(z, puff = true) {
    if (puff) this.s.particleBurst(z.mesh.position.clone().add(new THREE.Vector3(0, 0.9, 0)), '#cfd8c0', 22);
    this.s.scene.remove(z.mesh);
    z.alive = false;
    z.gone = true;
  }

  clear(puff = true) {
    for (const z of this.list) if (!z.gone && z.alive) this._remove(z, puff);
    this.list = this.list.filter((z) => !z.alive && !z.gone);
  }

  // Swing. power: 'diamond' | 'sword' | 'hand'.
  // A sword defeats in one hit the zombies in front of the hero; the diamond sword reaches further
  // and hits every zombie around. Bare hands push them back.
  hit(power) {
    const s = this.s, p = s.player.position, a = s.player.rotation.y;
    const fx = Math.sin(a), fz = Math.cos(a);
    const range = power === 'diamond' ? 3.2 : power === 'sword' ? 2.3 : 1.8;
    let touched = 0, defeated = 0, disarmed = 0;
    for (const z of this.active) {
      const dx = z.mesh.position.x - p.x, dz = z.mesh.position.z - p.z, d = Math.hypot(dx, dz);
      if (d > range) continue;
      if (power !== 'diamond' && (dx * fx + dz * fz) / (d || 1) < 0.2) continue;
      touched++;
      const ux = dx / (d || 1), uz = dz / (d || 1);
      s.particleBurst(z.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)), power === 'diamond' ? '#7ae8ff' : '#ffffff', 14);
      if (power === 'hand') {
        for (const push of [1.6, 1.0, 0.5]) {
          const nx = z.mesh.position.x + ux * push, nz = z.mesh.position.z + uz * push;
          if (s._checkCollision(nx, nz) || s._insideAnyHouse(nx, nz, 0.4) || s.inLava?.(nx, nz)) continue;
          z.mesh.position.set(nx, s.groundAt(nx, nz), nz);
          break;
        }
        z.stun = 0.8;
        continue;
      }
      if (z.armed && power !== 'diamond') { this._disarm(z, ux, uz); disarmed++; continue; }
      this.defeat(z, ux, uz);
      defeated++;
    }
    if (defeated) this.nextSpawn = Math.max(this.nextSpawn, s.clock.elapsedTime + ZOMBIE.respawn * 0.5);
    return { touched, defeated, disarmed };
  }

  // Defeat: the zombie flies back, spins and shrinks into a puff, and leaves a piece of meat.
  defeat(z, ux = 0, uz = 1, cause = 'sword') {
    if (!z.alive) return;
    z.alive = false;
    z.dyingT = 0;
    z.fly = { x: ux * 3.5, z: uz * 3.5 };
    z.cause = cause;
    this.dying.push(z);
    this.s.screenShake?.(0.1);
  }

  _dropMeat(x, z) {
    const s = this.s;
    const g = new THREE.Group();
    const meat = new THREE.MeshStandardMaterial({ color: 0xc8503a, emissive: 0xff7a3a, emissiveIntensity: 0.35, roughness: 0.7 });
    const bone = new THREE.MeshStandardMaterial({ color: 0xf4ead8, emissive: 0xffffff, emissiveIntensity: 0.2 });
    const m1 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.26, 0.26), meat);
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.07, 0.07), bone);
    b1.position.x = 0.28;
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.13, 0.13), bone);
    b2.position.x = 0.42;
    g.add(m1, b1, b2);
    // A soft golden halo so it is easy to spot, even at night.
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.55, 20), new THREE.MeshBasicMaterial({ color: 0xffd36a, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }));
    halo.rotation.x = -Math.PI / 2;
    const y = s.groundAt(x, z);
    halo.position.set(x, y + 0.05, z);
    g.position.set(x, y + 0.5, z);
    s.scene.add(g, halo);
    this.drops.push({ mesh: g, halo, x, z, y, t: 0 });
  }

  _tickDrops(dt, t) {
    const s = this.s, p = s.player.position;
    for (const d of this.drops) {
      d.t += dt;
      d.mesh.rotation.y += dt * 2.2;
      d.mesh.position.y = d.y + 0.5 + Math.sin(t * 3 + d.x) * 0.1;
      d.halo.material.opacity = 0.4 + Math.sin(t * 4) * 0.2;
      if (Math.hypot(p.x - d.x, p.z - d.z) < ZOMBIE.pickup && Math.abs(p.y - d.y) < 1.2) {
        d.gone = true;
        s.particleBurst(d.mesh.position.clone(), '#ffd36a', 18);
        s.onMeatPickup?.();
      } else if (d.t > ZOMBIE.meatLife) d.gone = true;
      if (d.gone) { s.scene.remove(d.mesh, d.halo); }
    }
    this.drops = this.drops.filter((d) => !d.gone);
  }

  _tickDying(dt) {
    const s = this.s;
    for (const z of this.dying) {
      z.dyingT += dt;
      const m = z.mesh, k = z.dyingT;
      if (k < 0.12) { m.scale.setScalar(1 + k * 2.5); } // a quick "hit" swell
      const nx = m.position.x + z.fly.x * dt, nz = m.position.z + z.fly.z * dt;
      if (!s._checkCollision(nx, nz)) m.position.set(nx, m.position.y, nz);
      z.fly.x *= 0.9; z.fly.z *= 0.9;
      m.position.y += (k < 0.25 ? 3 : -3) * dt;
      m.rotation.y += dt * 18;
      if (k >= 0.12) m.scale.setScalar(Math.max(0.01, 1.3 - (k - 0.12) * 2.6));
      if (k > 0.55) {
        const at = m.position.clone();
        s.particleBurst(at.clone().add(new THREE.Vector3(0, 0.6, 0)), '#cfd8c0', 26);
        s.particleBurst(at.clone().add(new THREE.Vector3(0, 0.6, 0)), z.cause === 'lava' ? '#ff7a1e' : '#ffffff', 12);
        s.scene.remove(m);
        z.gone = true;
        this._dropMeat(at.x, at.z);
      }
    }
    this.dying = this.dying.filter((z) => !z.gone);
  }

  update(dt, t) {
    const s = this.s;
    this._tickDying(dt);
    this._tickDrops(dt, t);
    this._tickFlying(dt);
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
      if (!z.alive) continue;
      const m = z.mesh;
      // Caught in a lava eruption (the bucket) or a lava pool: defeated.
      if (s.lavaHurts?.(m.position.x, m.position.z)) { this.defeat(z, 0, 0, 'lava'); s.onZombieBurnt?.(); continue; }
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
        // It bounces back after touching the hero (the hero has two hearts).
        const ux = -dx / (d || 1), uz = -dz / (d || 1);
        for (const push of [2.5, 1.5, 0.8]) {
          const nx = m.position.x + ux * push, nz = m.position.z + uz * push;
          if (s._checkCollision(nx, nz) || s._insideAnyHouse(nx, nz, 0.4) || s.inLava?.(nx, nz)) continue;
          m.position.set(nx, s.groundAt(nx, nz), nz);
          break;
        }
        z.stun = 1.5;
        s.onZombieCatch?.(z);
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
