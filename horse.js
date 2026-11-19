// Horses in the meadow by the farm: tamed with a word, then the hero rides them (faster, higher
// jumps). They can wear armour made at the forge (iron, then diamond): an armoured horse keeps
// zombies away from its rider.
import * as THREE from 'three';
import { mergeDirect } from './perf.js';

export const HORSES = [
  { id: 'h1', x: 18, z: 27, coat: 0x8a5a32, mane: 0x2a1a0e, name: { fr: 'Châtaigne', en: 'Chestnut' } },
  { id: 'h2', x: 21, z: 30, coat: 0xf2ece0, mane: 0x8a8a8a, name: { fr: 'Neige', en: 'Snowy' } },
  { id: 'h3', x: 16, z: 31, coat: 0x2a2420, mane: 0x111111, name: { fr: 'Réglisse', en: 'Liquorice' } },
];
export const HORSE_HOME = { x: 18.5, z: 29.5, r: 5 };
export const RIDE = { speed: 1.9, jump: 10.5, lift: 0.95 };

const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...o });
function box(p, w, h, d, m, x, y, z) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  b.position.set(x, y, z);
  b.castShadow = true;
  b.userData.dynamic = true;
  p.add(b);
  return b;
}

export function buildHorse(def) {
  const g = new THREE.Group();
  g.userData.dynamic = true;
  const coat = M(def.coat), mane = M(def.mane), hoof = M(0x2a2420), muzzle = M(0x3a2a20), dark = M(0x111111);
  const body = new THREE.Group();
  g.add(body);
  box(body, 0.75, 0.7, 1.6, coat, 0, 1.15, 0);
  const neck = new THREE.Group();
  neck.position.set(0, 1.35, 0.7);
  neck.rotation.x = -0.6;
  body.add(neck);
  box(neck, 0.4, 0.9, 0.45, coat, 0, 0.4, 0);
  box(neck, 0.12, 0.9, 0.3, mane, 0, 0.45, -0.24);
  const head = new THREE.Group();
  head.position.set(0, 0.85, 0.05);
  head.rotation.x = 1.0;
  neck.add(head);
  box(head, 0.36, 0.8, 0.42, coat, 0, 0.3, 0.05);
  box(head, 0.3, 0.2, 0.36, muzzle, 0, 0.68, 0.06);
  for (const sx of [-0.19, 0.19]) { box(head, 0.03, 0.08, 0.08, dark, sx, 0.15, 0.14); box(head, 0.08, 0.16, 0.06, coat, sx * 0.6, -0.12, -0.12); }
  box(body, 0.16, 0.7, 0.16, mane, 0, 1.05, -0.88).rotation.x = 0.4; // tail
  const legs = [];
  for (const [x, z] of [[-0.24, 0.6], [0.24, 0.6], [-0.24, -0.6], [0.24, -0.6]]) {
    const leg = new THREE.Group();
    leg.position.set(x, 0.85, z);
    box(leg, 0.2, 0.75, 0.2, coat, 0, -0.38, 0);
    box(leg, 0.22, 0.12, 0.22, hoof, 0, -0.79, 0);
    body.add(leg);
    legs.push(leg);
  }
  g.userData.parts = { body, neck, head, legs };
  mergeDirect(g); // a handful of draw calls per horse instead of thirty
  return g;
}

// Armour: 'iron' or 'diamond' plates on the body and the head.
function addArmor(horse, kind) {
  const parts = horse.mesh.userData.parts;
  if (horse.armor) { horse.armor.forEach((m) => m.parent.remove(m)); horse.armor = null; }
  if (!kind) return;
  const mat = kind === 'diamond' ? M(0x5af0e6, { metalness: 0.5, roughness: 0.25, emissive: 0x1a8a8a, emissiveIntensity: 0.25 }) : M(0xc8ccd2, { metalness: 0.6, roughness: 0.35 });
  horse.armor = [
    box(parts.body, 0.8, 0.5, 1.0, mat, 0, 1.38, 0.15),
    box(parts.body, 0.06, 0.5, 1.2, mat, -0.41, 1.05, 0.1),
    box(parts.body, 0.06, 0.5, 1.2, mat, 0.41, 1.05, 0.1),
    box(parts.head, 0.4, 0.5, 0.46, mat, 0, 0.2, 0.06),
  ];
}

export class HorseManager {
  constructor(scene3D) {
    this.s = scene3D;
    this.list = HORSES.map((def) => {
      const mesh = buildHorse(def);
      let x = def.x, z = def.z;
      for (let k = 0; k < 20 && (scene3D._checkCollision(x, z) || scene3D._insideAnyHouse?.(x, z, 0.5)); k++) { x = def.x + (Math.random() - 0.5) * 6; z = def.z + (Math.random() - 0.5) * 6; }
      mesh.position.set(x, scene3D.groundAt(x, z), z);
      mesh.rotation.y = Math.random() * Math.PI * 2;
      scene3D.scene.add(mesh);
      const obj = scene3D._addInteractable({ kind: 'horse', horseId: def.id, worldPos: mesh.position.clone(), iconY: 2.4, reach: 2.0, hitRadius: 1.0 });
      return { def, mesh, obj, tamed: false, target: null, wait: Math.random() * 4, t: Math.random() * 9, armor: null };
    });
    this.riding = null;
  }
  get(id) { return this.list.find((h) => h.def.id === id); }
  setArmor(id, kind) { const h = this.get(id); if (h) { addArmor(h, kind); h.armorKind = kind; } }
  // Get on: the horse moves with the hero, who sits up on its back.
  mount(id) {
    const h = this.get(id);
    if (!h || this.riding) return false;
    this.riding = h;
    const p = this.s.player;
    p.position.set(h.mesh.position.x, h.mesh.position.y, h.mesh.position.z);
    p.rotation.y = h.mesh.rotation.y;
    for (const c of p.children) c.position.y += RIDE.lift;
    p.userData.riding = true;
    h.obj.active = false;
    h.obj.iconHolder.visible = false;
    return true;
  }
  dismount() {
    const h = this.riding;
    if (!h) return false;
    this.riding = null;
    const p = this.s.player;
    for (const c of p.children) c.position.y -= RIDE.lift;
    p.userData.riding = false;
    // Step off to the side.
    const a = p.rotation.y + Math.PI / 2;
    for (const d of [1.3, -1.3]) {
      const x = p.position.x + Math.sin(a) * d, z = p.position.z + Math.cos(a) * d;
      if (!this.s._checkCollision(x, z) && !this.s.inLava?.(x, z)) { p.position.set(x, this.s.groundAt(x, z), z); break; }
    }
    h.obj.active = true;
    h.obj.iconHolder.visible = true;
    h.target = null; h.wait = 3;
    return true;
  }
  update(dt, t) {
    const s = this.s, p = s.player.position;
    for (const h of this.list) {
      const m = h.mesh, parts = m.userData.parts;
      m.visible = this.riding === h || Math.hypot(p.x - m.position.x, p.z - m.position.z) < 38;
      if (!m.visible) continue;
      h.t += dt;
      let moving = false;
      if (this.riding === h) {
        m.position.set(p.x, p.y, p.z);
        m.rotation.y = s.player.rotation.y;
        moving = !!s.player.userData.isMoving;
      } else {
        // Grazing and wandering in the meadow (a tamed horse waits where it was left).
        const home = h.tamed && h.leftAt ? { ...h.leftAt, r: 2.5 } : HORSE_HOME;
        if (!h.target) {
          h.wait -= dt;
          if (h.wait <= 0) { const a = Math.random() * Math.PI * 2, d = Math.random() * home.r; h.target = { x: home.x + Math.cos(a) * d, z: home.z + Math.sin(a) * d }; }
        } else {
          const dx = h.target.x - m.position.x, dz = h.target.z - m.position.z, d = Math.hypot(dx, dz);
          if (d < 0.3) { h.target = null; h.wait = 3 + Math.random() * 6; }
          else {
            const nx = m.position.x + (dx / d) * 1.1 * dt, nz = m.position.z + (dz / d) * 1.1 * dt;
            if (!s._checkCollision(nx, nz) && !s._insideAnyHouse?.(nx, nz, 0.5) && !s.inLava?.(nx, nz)) { m.position.x = nx; m.position.z = nz; moving = true; }
            else { h.target = null; h.wait = 1; }
            m.rotation.y += Math.atan2(Math.sin(Math.atan2(dx, dz) - m.rotation.y), Math.cos(Math.atan2(dx, dz) - m.rotation.y)) * Math.min(1, dt * 4);
          }
        }
        m.position.y = s.groundAt(m.position.x, m.position.z);
      }
      // Legs, head down to graze when still.
      const sp = this.riding === h ? 16 : 9;
      parts.legs.forEach((l, i) => { l.rotation.x = moving ? Math.sin(h.t * sp + (i % 3 === 0 ? 0 : Math.PI)) * 0.6 : 0; });
      parts.neck.rotation.x = moving || this.riding === h ? -0.6 : -0.6 + (Math.sin(h.t * 0.5) > 0.3 ? 0.9 : 0);
      h.obj.worldPos.copy(m.position);
      h.obj.iconHolder.position.copy(m.position).add(new THREE.Vector3(0, h.obj.iconY, 0));
      h.obj.hit.position.copy(h.obj.iconHolder.position).add(new THREE.Vector3(0, -1.0, 0));
    }
  }
}
