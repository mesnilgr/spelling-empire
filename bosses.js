// One boss per region: a big friendly-scary creature that sleeps in its lair until the child comes.
// The fight is a spelling duel: each word spelled is a hit (three hits to win). Models are made of
// blocks like the rest of the world; nothing here can hurt the hero.
import * as THREE from 'three';

export const BOSSES = [
  { id: 'mossGolem', region: 'forest', x: -74, z: 0, after: 'forester', emoji: '🌿', hp: 3, name: { fr: 'le Golem de mousse', en: 'the Moss Golem' } },
  { id: 'toadKing', region: 'marsh', x: 58, z: -20, after: 'marshFire', emoji: '🐸', hp: 3, name: { fr: 'le Roi Crapaud', en: 'the Toad King' } },
  { id: 'stoneGolem', region: 'mountain', x: 22, z: -46, after: 'mountainStairs', emoji: '🪨', hp: 3, name: { fr: 'le Golem de pierre', en: 'the Stone Golem' } },
  // The kraken lives in the sea; the child fights it from the beach.
  { id: 'kraken', region: 'coast', x: -20, z: 73.8, at: { x: -20, z: 67.6 }, after: 'lighthouse', emoji: '🐙', hp: 3, name: { fr: 'le Kraken', en: 'the Kraken' } },
];

const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
function box(parent, w, h, d, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  parent.add(m);
  return m;
}
function eyes(parent, y, z, spread, color) {
  const glow = std(color, { emissive: color, emissiveIntensity: 1.4 });
  return [box(parent, 0.22, 0.16, 0.06, glow, -spread, y, z), box(parent, 0.22, 0.16, 0.06, glow, spread, y, z)];
}

function buildGolem(kind) {
  const g = new THREE.Group();
  const body = std(kind === 'moss' ? 0x6a6a52 : 0x8a8e94);
  const dark = std(kind === 'moss' ? 0x4a4a3a : 0x5e6268);
  const accent = kind === 'moss' ? std(0x4f9a3a) : std(0xff7a1e, { emissive: 0xff5a00, emissiveIntensity: 0.9 });
  const rig = new THREE.Group();
  g.add(rig);
  for (const sx of [-0.45, 0.45]) box(rig, 0.6, 1.1, 0.7, dark, sx, 0.55, 0);
  const torso = box(rig, 1.8, 1.6, 1.1, body, 0, 1.9, 0);
  box(rig, 1.2, 1.0, 0.9, body, 0, 3.15, 0.05); // head
  eyes(rig, 3.25, 0.51, 0.27, kind === 'moss' ? 0xc8ff6a : 0xffb02a);
  box(rig, 0.6, 0.12, 0.05, dark, 0, 2.9, 0.51); // mouth
  const arms = [];
  for (const sx of [-1.2, 1.2]) {
    const pivot = new THREE.Group();
    pivot.position.set(sx, 2.5, 0);
    box(pivot, 0.6, 1.8, 0.6, body, 0, -0.85, 0);
    box(pivot, 0.7, 0.5, 0.7, dark, 0, -1.8, 0);
    rig.add(pivot);
    arms.push(pivot);
  }
  if (kind === 'moss') {
    // Moss and little vines, a flower on the head.
    for (const [x, y, z, w, h] of [[-0.5, 2.5, 0.56, 0.6, 0.3], [0.4, 1.6, 0.56, 0.5, 0.4], [0.1, 3.66, 0, 1.2, 0.14], [-0.7, 2.0, 0.56, 0.15, 0.9], [0.75, 2.3, 0.56, 0.15, 0.7]]) box(rig, w, h, 0.06, accent, x, y, z);
    box(rig, 0.18, 0.18, 0.18, std(0xff8ab0), 0.35, 3.8, 0.1);
  } else {
    // Glowing cracks of lava.
    for (const [x, y, w, h] of [[-0.4, 2.2, 0.1, 0.7], [0.3, 1.5, 0.5, 0.08], [0.55, 2.5, 0.08, 0.5]]) box(rig, w, h, 0.06, accent, x, y, 0.56);
  }
  g.userData.parts = { rig, arms, torso };
  return g;
}

function buildToad() {
  const g = new THREE.Group();
  const rig = new THREE.Group();
  g.add(rig);
  const green = std(0x4f9a3a), belly = std(0xd8e08a), dark = std(0x2f6a28);
  box(g, 3.2, 0.12, 3.2, std(0x3f8a3a), 0, 0.06, 0); // lily pad
  box(rig, 2.4, 1.3, 2.0, green, 0, 0.85, 0);
  box(rig, 1.8, 0.9, 0.1, belly, 0, 0.75, 1.0);
  box(rig, 2.0, 0.12, 0.1, std(0xc8372d), 0, 1.15, 1.02); // big mouth
  for (const sx of [-0.65, 0.65]) {
    box(rig, 0.6, 0.6, 0.6, std(0xffffff), sx, 1.75, 0.55);
    box(rig, 0.3, 0.3, 0.1, std(0x111111), sx, 1.78, 0.86);
    box(rig, 0.6, 0.4, 0.9, dark, sx * 1.9, 0.35, 0.6); // front legs
    box(rig, 0.8, 0.5, 1.1, dark, sx * 2.0, 0.4, -0.5); // back legs
  }
  // A golden crown.
  const gold = std(0xf2c84b, { metalness: 0.6, roughness: 0.3, emissive: 0x6a4a10, emissiveIntensity: 0.4 });
  box(rig, 1.0, 0.25, 1.0, gold, 0, 1.65, -0.2);
  for (const [x, z] of [[-0.4, 0.2], [0, 0.2], [0.4, 0.2], [-0.4, -0.6], [0.4, -0.6]]) box(rig, 0.18, 0.3, 0.18, gold, x, 1.9, z - 0.0);
  g.userData.parts = { rig, arms: [] };
  return g;
}

function buildKraken() {
  const g = new THREE.Group();
  const rig = new THREE.Group();
  g.add(rig);
  const purple = std(0x8a4ab0), light = std(0xd89ae8);
  box(rig, 2.4, 2.4, 2.2, purple, 0, 1.3, 0);
  box(rig, 2.0, 0.8, 1.9, purple, 0, 2.8, -0.1);
  for (const sx of [-0.6, 0.6]) {
    box(rig, 0.6, 0.6, 0.1, std(0xffffff), sx, 1.7, 1.11);
    box(rig, 0.3, 0.4, 0.1, std(0x111111), sx, 1.65, 1.16);
  }
  const arms = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    const pivot = new THREE.Group();
    pivot.position.set(Math.cos(a) * 1.4, 0.3, Math.sin(a) * 1.4);
    pivot.rotation.y = -a;
    let parent = pivot;
    for (let k = 0; k < 4; k++) {
      const seg = new THREE.Group();
      seg.position.set(k === 0 ? 0 : 0.55, 0, 0);
      box(seg, 0.6, 0.45 - k * 0.07, 0.45 - k * 0.07, k % 2 ? light : purple, 0.3, 0, 0);
      parent.add(seg);
      parent = seg;
    }
    rig.add(pivot);
    arms.push(pivot);
  }
  g.userData.parts = { rig, arms, tentacles: true };
  return g;
}

export function buildBoss(def) {
  const g = def.id === 'toadKing' ? buildToad() : def.id === 'kraken' ? buildKraken() : buildGolem(def.id === 'mossGolem' ? 'moss' : 'stone');
  g.userData.dynamic = true;
  g.traverse((o) => { if (o.isMesh) o.userData.dynamic = true; });
  return g;
}

// Bring a boss to life: idle breathing, sleeping, waking up, being hit, and defeat.
export class BossManager {
  constructor(scene3D) {
    this.s = scene3D;
    this.list = BOSSES.map((def) => {
      const mesh = buildBoss(def);
      const y = def.id === 'kraken' ? -0.6 : scene3D.groundAt(def.x, def.z);
      mesh.position.set(def.x, y, def.z);
      const look = def.at ?? { x: 0, z: 0 };
      mesh.rotation.y = Math.atan2(look.x - def.x, look.z - def.z);
      scene3D.scene.add(mesh);
      if (def.id !== 'kraken') scene3D.collidables.push({ x: def.x, z: def.z, r: 1.6 });
      const at = def.at ?? { x: def.x + Math.sin(mesh.rotation.y) * 2.6, z: def.z + Math.cos(mesh.rotation.y) * 2.6 };
      const obj = scene3D._addInteractable({ kind: 'boss', bossId: def.id, worldPos: new THREE.Vector3(at.x, scene3D.groundAt(at.x, at.z), at.z), iconY: def.id === 'kraken' ? 2.2 : 4.4, reach: 2.4, hitRadius: 1.4 });
      return { def, mesh, obj, baseY: y, awake: false, hitT: 0, defeatT: -1, roarT: 0 };
    });
  }
  get(id) { return this.list.find((b) => b.def.id === id); }
  setDefeated(id) { const b = this.get(id); if (b) { b.mesh.visible = false; b.gone = true; b.obj.active = false; b.obj.iconHolder.visible = false; this.s.collidables = this.s.collidables.filter((c) => !(c.x === b.def.x && c.z === b.def.z && c.r === 1.6)); } }
  wake(id) { const b = this.get(id); if (b) { b.awake = true; b.roarT = 0.8; this.s.screenShake?.(0.25); } }
  sleep(id) { const b = this.get(id); if (b) b.awake = false; }
  // Asleep but disturbed: it shifts and grumbles.
  stir(id) { const b = this.get(id); if (b) { b.roarT = 0.5; b.hitT = 0.3; this.onGrumble?.(b); } }
  hit(id) {
    const b = this.get(id);
    if (!b) return;
    b.hitT = 0.5;
    this.s.screenShake?.(0.2);
    const p = b.mesh.position;
    for (const c of ['#ffffff', '#ffd36a']) this.s.particleBurst({ x: p.x, y: p.y + 2, z: p.z }, c, 20);
  }
  attack(id) { const b = this.get(id); if (b) { b.roarT = 0.7; this.s.screenShake?.(0.15); } }
  defeat(id) {
    const b = this.get(id);
    if (!b) return;
    b.defeatT = 0;
  }
  update(dt, t) {
    for (const b of this.list) {
      if (b.gone) continue;
      const { rig, arms, tentacles } = b.mesh.userData.parts;
      const near = Math.hypot(this.s.player.position.x - b.def.x, this.s.player.position.z - b.def.z) < 30;
      if (!near && b.defeatT < 0) continue;
      if (b.defeatT >= 0) {
        b.defeatT += dt;
        b.mesh.rotation.y += dt * 10;
        b.mesh.scale.setScalar(Math.max(0.01, 1 - b.defeatT / 1.2));
        b.mesh.position.y = b.baseY + (b.def.id === 'kraken' ? -b.defeatT * 2 : b.defeatT * 1.5);
        if (b.defeatT > 1.2) {
          const p = b.mesh.position;
          for (const c of ['#ffd36a', '#ffffff', '#ff8ab0', '#7ae8ff']) this.s.particleBurst({ x: p.x, y: b.baseY + 1.5, z: p.z }, c, 30);
          this.setDefeated(b.def.id);
        }
        continue;
      }
      // The hero comes close to a sleeping boss: it stirs and grumbles now and then.
      const dHero = Math.hypot(this.s.player.position.x - b.def.x, this.s.player.position.z - b.def.z);
      b.grumbleT = (b.grumbleT ?? 0) - dt;
      if (!b.awake && dHero < 9 && b.grumbleT <= 0) { b.grumbleT = 6; this.stir(b.def.id); }
      // Asleep: slow breathing, slumped. Awake: bigger breathing, arms swinging.
      const k = b.awake ? 1 : 0.35;
      rig.scale.y = 1 + Math.sin(t * (b.awake ? 3 : 1.2)) * 0.03 * (b.awake ? 1.5 : 1);
      rig.rotation.x = b.awake ? 0 : 0.12;
      arms.forEach((a, i) => {
        if (tentacles) {
          // Each tentacle curls and waves on the water, segment after segment.
          a.rotation.z = 0.25 + Math.sin(t * 1.6 + i) * 0.2 * k;
          let seg = a.children[0];
          for (let n = 0; seg; n++, seg = seg.children.find((c) => c.isGroup)) seg.rotation.y = Math.sin(t * 2 + i * 1.3 + n * 0.8) * 0.45 * (0.5 + k);
        }
        else a.rotation.x = Math.sin(t * 2 + i * Math.PI) * 0.25 * k;
      });
      if (b.def.id === 'kraken') b.mesh.position.y = b.baseY + Math.sin(t * 1.3) * 0.15 + (b.awake ? 0.5 : 0);
      if (b.roarT > 0) {
        b.roarT -= dt;
        rig.scale.setScalar(1 + Math.sin(b.roarT * 20) * 0.04 + 0.06);
        arms.forEach((a) => { if (!tentacles) a.rotation.x = -1.2; });
      } else if (!b.awake || b.hitT <= 0) rig.scale.x = rig.scale.z = 1;
      if (b.hitT > 0) {
        b.hitT -= dt;
        rig.position.x = Math.sin(b.hitT * 60) * 0.15;
        rig.rotation.z = Math.sin(b.hitT * 30) * 0.08;
      } else { rig.position.x = 0; rig.rotation.z = 0; }
    }
  }
}
