// Places to discover between the village and the edges of the world, in the spirit of Minecraft:
// a ruined tower, a camp, an old mine, a fire portal, a farm with a windmill, a bee meadow with
// giant mushrooms, a stone circle, a well, a tree house, a fairy ring, a witch's hut and a wreck.
// Each place hides something (a chest, ores, a portal…) and appears on the map once found.
import * as THREE from 'three';
import { blockMat, texBox } from './textures.js';

export const PLACES = [
  { id: 'tower', emoji: '🏰', x: -38, z: -31, ry: 0.3, name: { fr: 'la Tour en ruine', en: 'the Ruined Tower' } },
  { id: 'camp', emoji: '🏕️', x: -45, z: -49, ry: 0.8, name: { fr: 'le Campement', en: 'the Camp' } },
  { id: 'mine', emoji: '⛏️', x: -30, z: -42, ry: 0, name: { fr: 'la Mine abandonnée', en: 'the Old Mine' } },
  { id: 'portal', emoji: '🌀', x: 40, z: -25, ry: -0.6, name: { fr: 'le Portail de feu', en: 'the Fire Portal' } },
  { id: 'farm', emoji: '🐷', x: 30, z: 37, ry: 0, name: { fr: 'la Ferme', en: 'the Farm' } },
  { id: 'windmill', emoji: '🌬️', x: 40, z: 21, ry: -0.5, name: { fr: 'le Moulin à vent', en: 'the Windmill' } },
  { id: 'meadow', emoji: '🐝', x: -34, z: 39, ry: 0, name: { fr: 'la Prairie des abeilles', en: 'the Bee Meadow' } },
  { id: 'stones', emoji: '🗿', x: 2, z: 44, ry: 0, name: { fr: 'le Cercle de pierres', en: 'the Stone Circle' } },
  { id: 'well', emoji: '🪣', x: -10, z: 46, ry: 0.4, name: { fr: 'le Vieux puits', en: 'the Old Well' } },
  { id: 'treehouse', emoji: '🌳', x: -78, z: -18, ry: 0.6, name: { fr: 'la Cabane dans les arbres', en: 'the Tree House' } },
  { id: 'fairy', emoji: '🍄', x: -52, z: 24, ry: 0, name: { fr: 'le Cercle des fées', en: 'the Fairy Ring' } },
  { id: 'witch', emoji: '🧙', x: 56, z: 27, ry: -2.4, name: { fr: 'la Cabane de la sorcière', en: 'the Witch’s Hut' } },
  { id: 'wreck', emoji: '🏴‍☠️', x: 31, z: 55, ry: 0.5, name: { fr: 'l’Épave du pirate', en: 'the Pirate Wreck' } },
];
export const DISCOVER_RADIUS = 7;

const M = new Map();
const C = (c, o = {}) => {
  const k = `${c}|${JSON.stringify(o)}`;
  if (!M.has(k)) M.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...o }));
  return M.get(k);
};
const glow = (c, i = 1.2) => C(c, { emissive: c, emissiveIntensity: i });
const T = (name) => blockMat(name);
// Small details cast no shadow (keeps the shadow pass cheap on the iPad).
function box(g, w, h, d, m, x, y, z, o = {}) {
  return texBox(g, w, h, d, typeof m === 'string' ? T(m) : m, x, y, z, { tile: o.tile ?? 0.9, cast: w * h * d > 0.12, ...o });
}
function dyn(g) { g.userData.dynamic = true; g.traverse((o) => { o.userData.dynamic = true; }); return g; }

/* ---------- builders: (group, add) — local coords, y = 0 at the ground ---------- */
// add.collide(x, z, r) / add.rect(x0, z0, x1, z1) / add.chest(x, z, ry) / add.ore(x, z, kind) /
// add.node({...}) / add.anim(fn(dt, t)) / add.portal(x, z)

function tower(g, add) {
  const S = 'mossyCobble', S2 = 'cobble';
  const walls = [[0, -2, 4.4, 0.6, 5.2], [-2, 0, 0.6, 4.4, 3.6], [2, 0, 0.6, 4.4, 4.4]];
  for (const [x, z, w, d, h] of walls) box(g, w, h, d, S, x, h / 2, z);
  // Front wall with a doorway, broken on one side.
  box(g, 1.4, 2.6, 0.6, S2, -1.5, 1.3, 2);
  box(g, 1.4, 1.6, 0.6, S2, 1.5, 0.8, 2);
  box(g, 1.6, 0.6, 0.6, S, 0, 2.3, 2);
  // Battlements on the high wall, rubble around, ivy.
  for (const x of [-1.8, -0.6, 0.6, 1.8]) box(g, 0.6, 0.6, 0.6, S, x, 5.5, -2);
  for (const [x, z, s] of [[2.8, 2.6, 0.7], [3.4, 1.2, 0.5], [-2.9, 2.4, 0.6], [1.2, 3.2, 0.45], [-3.2, -1, 0.8]]) box(g, s, s, s, S2, x, s / 2, z, { ry: x });
  for (const [x, z, h] of [[-2.32, 0.4, 2.8], [-2.32, -1.1, 2.2], [2.32, 0.8, 3.4]]) box(g, 0.05, h, 0.9, C(0x3f8a3a), x, h / 2, z, { cast: false });
  box(g, 3.4, 0.08, 3.4, 'oakPlanks', 0, 0.04, 0, { cast: false }); // old floor
  // A torn banner.
  box(g, 0.08, 1.8, 0.08, C(0x5a3a22), -1.6, 4.6, -1.6);
  box(g, 0.7, 1.0, 0.04, C(0x2f5aa8), -1.2, 4.9, -1.6);
  box(g, 0.24, 0.24, 0.05, C(0xf2c84b), -1.2, 4.95, -1.57);
  add.rect(-2.3, -2.3, 2.3, -1.7); add.rect(-2.3, -2.3, -1.7, 2.3); add.rect(1.7, -2.3, 2.3, 2.3);
  add.rect(-2.3, 1.7, -0.8, 2.3); add.rect(0.8, 1.7, 2.3, 2.3);
  add.chest(0.6, -1.0, Math.PI);
}

function camp(g, add) {
  // Tent: two sloping canvas sides.
  const canvas = C(0xd8c8a0), stripe = C(0xb83a2e);
  for (const s of [-1, 1]) {
    box(g, 1.7, 0.08, 3.0, canvas, s * 0.62, 0.85, -1.4, { rz: s * 0.9 });
    box(g, 0.2, 0.09, 3.0, stripe, s * 0.3, 1.2, -1.4, { rz: s * 0.9 });
  }
  box(g, 0.1, 1.7, 0.1, C(0x5a3a22), 0, 0.85, 0.05);
  box(g, 0.1, 1.7, 0.1, C(0x5a3a22), 0, 0.85, -2.85);
  add.rect(-1.3, -3, 1.3, 0.1);
  // Campfire with log seats.
  for (let i = 0; i < 4; i++) box(g, 0.9, 0.16, 0.16, 'oakLog', 0.2, 0.1, 2.4, { ry: (i * Math.PI) / 4 });
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; box(g, 0.24, 0.2, 0.24, 'cobble', 0.2 + Math.cos(a) * 0.62, 0.1, 2.4 + Math.sin(a) * 0.62); }
  const fire = dyn(new THREE.Group());
  fire.position.set(0.2, 0, 2.4);
  const flames = [box(fire, 0.34, 0.5, 0.34, glow(0xff8a2a, 2), 0, 0.42, 0), box(fire, 0.2, 0.36, 0.2, glow(0xffd36a, 2.4), 0, 0.62, 0)];
  g.add(fire);
  add.anim((dt, t) => { flames[0].scale.y = 1 + Math.sin(t * 13) * 0.18; flames[1].scale.y = 1 + Math.sin(t * 17 + 1) * 0.25; flames[1].position.x = Math.sin(t * 9) * 0.04; });
  add.collide(0.2, 2.4, 0.6);
  for (const [x, z, ry] of [[-1.3, 2.6, 0.3], [1.7, 2.3, -0.2], [0.3, 3.9, 1.5]]) { box(g, 1.2, 0.36, 0.4, 'oakLog', x, 0.2, z, { ry }); add.collide(x, z, 0.4); }
  box(g, 0.7, 0.7, 0.7, 'sprucePlanks', 1.9, 0.35, -0.4); add.collide(1.9, -0.4, 0.5);
  box(g, 0.2, 0.3, 0.2, glow(0xffc04a, 2), 1.9, 0.86, -0.4);
  add.chest(-1.8, -0.2, 0.6);
}

function mine(g, add) {
  // A rocky hill with a timbered entrance and rails coming out.
  const layers = [[8, 5.2, 1.4], [6.6, 4.4, 1.2], [5, 3.4, 1.0], [3.2, 2.2, 0.8]];
  let y = 0;
  layers.forEach(([w, d, h], i) => { box(g, w, h, d, i % 2 ? 'cobble' : 'mossyCobble', 0, y + h / 2, -2.6 - i * 0.2, { tile: 1 }); y += h; });
  for (const [x, z, s] of [[-3.6, -1, 1], [3.8, -1.4, 0.8], [-2.6, -4.6, 1.2], [3, -4.4, 1.1]]) box(g, s, s, s, 'cobble', x, s / 2, z);
  box(g, 1.8, 2.0, 0.3, C(0x0a0806), 0, 1.0, -0.12); // the dark tunnel
  for (const s of [-1, 1]) box(g, 0.3, 2.3, 0.3, 'oakLog', s * 1.05, 1.15, 0.05);
  box(g, 2.6, 0.3, 0.32, 'oakLog', 0, 2.35, 0.05);
  box(g, 0.2, 0.28, 0.2, glow(0xffc04a, 2), -1.05, 1.9, 0.3); box(g, 0.2, 0.28, 0.2, glow(0xffc04a, 2), 1.05, 1.9, 0.3);
  // Rails.
  for (let z = 0; z < 5.5; z += 0.6) box(g, 1.1, 0.06, 0.16, 'sprucePlanks', 0, 0.04, z, { cast: false });
  for (const s of [-0.38, 0.38]) box(g, 0.06, 0.06, 5.6, C(0x8a8e94, { metalness: 0.6 }), s, 0.1, 2.7, { cast: false });
  // A minecart full of ore.
  box(g, 0.95, 0.5, 1.2, C(0x6a7078, { metalness: 0.5 }), 0, 0.42, 3.3);
  box(g, 0.8, 0.12, 1.05, C(0x3a3a3a), 0, 0.68, 3.3);
  for (const [x, z, c] of [[-0.2, 3.1, 0xd8a878], [0.2, 3.5, 0x5af0e6], [0.1, 3.0, 0x8a8a8a]]) box(g, 0.24, 0.2, 0.24, C(c), x, 0.78, z);
  for (const s of [-1, 1]) for (const z of [2.9, 3.7]) box(g, 0.1, 0.24, 0.24, C(0x2a2a2a), s * 0.5, 0.14, z);
  add.rect(-4, -5.4, 4, -0.1); add.collide(0, 3.3, 0.7);
  add.ore(-2.4, 1.0, 'iron'); add.ore(2.5, 1.4, 'iron'); add.ore(-3.4, -0.2, 'diamond');
  add.chest(2.3, 3.6, -0.4);
}

function portal(g, add) {
  // Red rock ground, a frame of obsidian, a little lava pool and glowstone.
  const rack = C(0x7a2a24), rack2 = C(0x5a1e1a);
  for (let i = 0; i < 26; i++) { const a = i * 2.4, r = 1 + (i % 7) * 0.55; box(g, 1, 0.12, 1, i % 3 ? rack : rack2, Math.cos(a) * r, 0.04, Math.sin(a) * r + 0.6, { cast: false }); }
  for (const x of [-1.5, 1.5]) for (let k = 0; k < 5; k++) box(g, 1, 1, 1, 'obsidian', x, 0.5 + k, 0);
  for (const x of [-0.5, 0.5]) { box(g, 1, 1, 1, 'obsidian', x, 0.5, 0); box(g, 1, 1, 1, 'obsidian', x, 4.5, 0); }
  add.rect(-2, -0.5, -1, 0.5); add.rect(1, -0.5, 2, 0.5); add.rect(-1, -0.5, 1, 0.5);
  const surf = dyn(new THREE.Mesh(new THREE.PlaneGeometry(2, 3), new THREE.MeshBasicMaterial({ color: 0xa84aff, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false })));
  surf.position.set(0, 2.5, 0);
  surf.visible = false;
  g.add(surf);
  add.portalSurface(surf);
  add.anim((dt, t) => { if (surf.visible) { surf.material.opacity = 0.6 + Math.sin(t * 3) * 0.15; surf.material.color.setHSL(0.76 + Math.sin(t * 1.3) * 0.03, 0.9, 0.6); } });
  for (const [x, z] of [[2.6, 1.8], [-2.8, 2.4], [0.4, 3.6]]) box(g, 0.7, 0.7, 0.7, glow(0xffd77a, 0.9), x, 0.35, z);
  const lava = box(g, 1.6, 0.06, 1.2, glow(0xff6a1a, 1.2), -2.4, 0.08, -1.6, { cast: false });
  lava.userData.lava = true;
  add.collide(-2.4, -1.6, 0.9);
  add.node({ kind: 'portal', x: 0, z: 1.4 });
}

function farm(g, add) {
  // A red barn (closed) with a white trim, haystacks, a pig pen, a chicken coop, pumpkins and a scarecrow.
  const red = C(0xa8382e), white = C(0xf2ece0), roof = T('roofSlate');
  box(g, 5, 3, 4, red, -1, 1.5, -1.2);
  for (const s of [-1, 1]) box(g, 3.0, 0.2, 4.4, roof, -1 + s * 1.25, 3.55, -1.2, { rz: s * -0.6 });
  box(g, 0.2, 1.0, 4.0, red, -1, 3.4, -1.2, { rz: 0 });
  box(g, 2.0, 2.2, 0.08, C(0x6a2a22), -1, 1.1, 0.82);
  box(g, 2.0, 0.12, 0.1, white, -1, 1.1, 0.86, { rz: 0.83 }); box(g, 2.0, 0.12, 0.1, white, -1, 1.1, 0.86, { rz: -0.83 });
  add.rect(-3.6, -3.3, 1.6, 0.9);
  for (const [x, z] of [[2.6, -2.4], [3.2, -1.2]]) { box(g, 1.1, 0.9, 1.1, C(0xe0c050), x, 0.45, z); add.collide(x, z, 0.6); }
  // Pig pen (world: around 38, 31 → local 8, -6).
  const fence = C(0x8a6a42);
  const pen = (cx, cz, w, d) => {
    for (let x = -w / 2; x <= w / 2 + 0.01; x += 1) { box(g, 0.14, 0.9, 0.14, fence, cx + x, 0.45, cz - d / 2); box(g, 0.14, 0.9, 0.14, fence, cx + x, 0.45, cz + d / 2); }
    for (let z = -d / 2; z <= d / 2 + 0.01; z += 1) { box(g, 0.14, 0.9, 0.14, fence, cx - w / 2, 0.45, cz + z); box(g, 0.14, 0.9, 0.14, fence, cx + w / 2, 0.45, cz + z); }
    for (const yy of [0.35, 0.75]) { box(g, w, 0.08, 0.06, fence, cx, yy, cz - d / 2); box(g, w, 0.08, 0.06, fence, cx, yy, cz + d / 2); box(g, 0.06, 0.08, d, fence, cx - w / 2, yy, cz); box(g, 0.06, 0.08, d, fence, cx + w / 2, yy, cz); }
    add.rect(cx - w / 2 - 0.1, cz - d / 2 - 0.1, cx + w / 2 + 0.1, cz - d / 2 + 0.1); add.rect(cx - w / 2 - 0.1, cz + d / 2 - 0.1, cx + w / 2 + 0.1, cz + d / 2 + 0.1);
    add.rect(cx - w / 2 - 0.1, cz - d / 2, cx - w / 2 + 0.1, cz + d / 2); add.rect(cx + w / 2 - 0.1, cz - d / 2, cx + w / 2 + 0.1, cz + d / 2);
  };
  pen(8, -6, 5, 4);
  box(g, 4.8, 0.03, 3.8, C(0x6a4a2a), 8, 0.02, -6, { cast: false }); // mud
  box(g, 1.2, 0.3, 0.5, 'sprucePlanks', 9.6, 0.15, -7.4); // trough
  // Chicken coop.
  box(g, 1.6, 1.1, 1.3, 'birchPlanks', -7.4, 0.85, 6.4); box(g, 1.9, 0.18, 1.6, roof, -7.4, 1.5, 6.4);
  for (const [x, z] of [[-8, 5.9], [-6.8, 5.9], [-8, 6.9], [-6.8, 6.9]]) box(g, 0.1, 0.3, 0.1, fence, x, 0.15, z);
  add.collide(-7.4, 6.4, 0.95);
  // Pumpkin patch and a scarecrow.
  for (let i = 0; i < 9; i++) { const x = 5 + (i % 3) * 1.2, z = 6 + Math.floor(i / 3) * 1.1; box(g, 0.55, 0.45, 0.55, C(0xe8822a), x, 0.23, z); box(g, 0.08, 0.14, 0.08, C(0x3f7a2a), x, 0.5, z); }
  box(g, 0.12, 2.0, 0.12, fence, 3.4, 1.0, 4.2); box(g, 1.4, 0.12, 0.12, fence, 3.4, 1.5, 4.2);
  box(g, 0.6, 0.7, 0.3, C(0x5a7a3a), 3.4, 1.4, 4.2); box(g, 0.4, 0.4, 0.4, C(0xe0c050), 3.4, 2.0, 4.2); box(g, 0.6, 0.1, 0.6, C(0x8a5a32), 3.4, 2.25, 4.2);
  add.collide(3.4, 4.2, 0.4);
  add.node({ kind: 'node', nodeType: 'wheat', material: 'wheat', requires: 'scythe', x: 6.2, z: 7.1, reach: 2.6 });
  add.chest(1.4, 0.6, 0.3);
}

function windmill(g, add) {
  // Stone tower, wooden cap and four turning sails.
  for (let k = 0; k < 4; k++) box(g, 3.2 - k * 0.3, 1.5, 3.2 - k * 0.3, k % 2 ? 'stoneBricks' : 'cobble', 0, 0.75 + k * 1.5, 0);
  box(g, 2.4, 1.2, 2.6, 'sprucePlanks', 0, 6.6, 0);
  box(g, 2.8, 0.2, 3.0, T('roofBrown'), 0, 7.3, 0);
  box(g, 1.0, 1.8, 0.1, C(0x3a2616), 0, 0.9, 1.62);
  add.collide(0, 0, 1.9);
  const hub = dyn(new THREE.Group());
  hub.position.set(0, 6.6, 1.5);
  for (let i = 0; i < 4; i++) {
    const arm = new THREE.Group();
    arm.rotation.z = (i * Math.PI) / 2;
    box(arm, 0.16, 3.6, 0.12, C(0x6a4428), 0, 1.9, 0);
    box(arm, 0.9, 3.0, 0.04, C(0xf2ece0), 0.5, 2.1, 0.02);
    hub.add(arm);
  }
  box(hub, 0.4, 0.4, 0.3, C(0x3a2616), 0, 0, 0);
  g.add(dyn(hub));
  add.anim((dt) => { hub.rotation.z += dt * 0.8; });
}

function meadow(g, add, rnd) {
  // Flowers everywhere, beehives on posts, giant mushrooms.
  const colors = [0xff6b9d, 0xffd93d, 0xffffff, 0xb07aff, 0xff8a3d, 0x6ab0ff];
  for (let i = 0; i < 70; i++) {
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 6.5, x = Math.cos(a) * r, z = Math.sin(a) * r;
    box(g, 0.04, 0.3, 0.04, C(0x3f8a3a), x, 0.15, z, { cast: false });
    box(g, 0.17, 0.17, 0.17, C(colors[i % 6], { emissive: colors[i % 6], emissiveIntensity: 0.15 }), x, 0.37, z, { cast: false });
  }
  const bees = [];
  for (const [x, z] of [[-2.5, -3.5], [0.5, -4.2], [3.2, -3.2]]) {
    box(g, 0.12, 1.0, 0.12, C(0x6a4428), x, 0.5, z);
    box(g, 0.7, 0.6, 0.6, C(0xf2c84b), x, 1.3, z); box(g, 0.72, 0.1, 0.62, C(0x8a5a22), x, 1.2, z); box(g, 0.72, 0.1, 0.62, C(0x8a5a22), x, 1.42, z);
    box(g, 0.18, 0.12, 0.04, C(0x2a1a0a), x, 1.25, z + 0.31);
    add.collide(x, z, 0.4);
    for (let k = 0; k < 3; k++) {
      const b = dyn(new THREE.Group());
      box(b, 0.1, 0.08, 0.12, C(0xf2c84b), 0, 0, 0); box(b, 0.11, 0.03, 0.04, C(0x111111), 0, 0, 0.0);
      g.add(b);
      bees.push({ b, x, z, k, s: 0.6 + rnd() * 0.6 });
    }
  }
  add.anim((dt, t) => { for (const e of bees) { const a = t * 2.4 * e.s + e.k * 2.1; e.b.position.set(e.x + Math.cos(a) * 0.8, 1.4 + Math.sin(a * 1.7) * 0.3, e.z + Math.sin(a) * 0.8); e.b.rotation.y = -a; } });
  giantMushroom(g, add, 5.5, 6, 1.1, 0xc8372d);
  giantMushroom(g, add, -6, 5, 0.9, 0x8a5a32);
  add.node({ kind: 'node', nodeType: 'flower', material: 'flower', x: 1.5, z: 1.5, reach: 2.2 });
  add.chest(4.3, 4.6, 0.8);
}
function giantMushroom(g, add, x, z, s, cap) {
  box(g, 0.8 * s, 3.2 * s, 0.8 * s, C(0xf4ead8), x, 1.6 * s, z);
  box(g, 3.6 * s, 0.9 * s, 3.6 * s, C(cap), x, 3.5 * s, z);
  box(g, 2.6 * s, 0.5 * s, 2.6 * s, C(cap), x, 4.1 * s, z);
  if (cap === 0xc8372d) for (const [dx, dz] of [[-1, 0.6], [0.8, -0.9], [0.2, 1.3], [1.3, 0.5], [-0.7, -1.2]]) box(g, 0.45 * s, 0.1, 0.45 * s, C(0xffffff), x + dx * s, 3.97 * s, z + dz * s, { cast: false });
  add.collide(x, z, 0.6 * s);
}

function stones(g, add) {
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, x = Math.cos(a) * 3.4, z = Math.sin(a) * 3.4, h = 2.0 + (i % 3) * 0.5;
    box(g, 0.8, h, 0.6, i % 2 ? 'stoneBricks' : 'mossyStoneBricks', x, h / 2, z, { ry: -a });
    if (i % 2 === 0) box(g, 1.7, 0.4, 0.6, 'stoneBricks', Math.cos(a + 0.39) * 3.4, h + 0.2, Math.sin(a + 0.39) * 3.4, { ry: -a - Math.PI / 2 - 0.39 });
    add.collide(x, z, 0.5);
  }
  box(g, 1.4, 0.7, 1.0, 'stoneBricks', 0, 0.35, 0);
  const rune = box(g, 0.6, 0.04, 0.6, glow(0x7ae8ff, 1.4), 0, 0.72, 0, { cast: false });
  add.anim((dt, t) => { rune.material.emissiveIntensity = 1 + Math.sin(t * 2) * 0.5; });
  add.collide(0, 0, 0.8);
  add.chest(0, 1.6, Math.PI);
}

function well(g, add) {
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; box(g, 0.7, 0.9, 0.4, 'cobble', Math.cos(a) * 0.9, 0.45, Math.sin(a) * 0.9, { ry: -a + Math.PI / 2 }); }
  box(g, 1.4, 0.05, 1.4, C(0x2f6fa8, { emissive: 0x0a2a4a, emissiveIntensity: 0.4 }), 0, 0.5, 0, { cast: false });
  for (const s of [-1, 1]) box(g, 0.16, 1.9, 0.16, 'oakLog', s * 1.05, 1.4, 0);
  box(g, 2.4, 0.12, 0.12, 'oakLog', 0, 2.2, 0);
  for (const s of [-1, 1]) box(g, 2.6, 0.12, 1.3, T('roofBrown'), 0, 2.6, s * 0.45, { rx: s * 0.6 });
  box(g, 0.03, 0.9, 0.03, C(0xc8b080), 0, 1.75, 0);
  box(g, 0.3, 0.3, 0.3, C(0x8a6a42), 0, 1.2, 0);
  add.collide(0, 0, 1.25);
  add.node({ kind: 'node', nodeType: 'water', material: 'water', x: 0, z: 1.6, reach: 1.6 });
}

function treehouse(g, add) {
  // A huge oak: thick trunk, a platform with a little hut, a ladder, and a big canopy.
  box(g, 1.6, 9, 1.6, 'oakLog', 0, 4.5, 0, { tile: 1 });
  for (const [x, z, ry] of [[1.1, 0.3, 0.2], [-1.0, -0.4, 1.1], [0.2, 1.1, 2.0]]) box(g, 1.2, 0.5, 0.5, 'oakLog', x, 0.25, z, { ry });
  box(g, 5, 0.25, 5, 'oakPlanks', 0, 4.2, 0);
  for (const [x, z, w, d] of [[0, -2.45, 5, 0.12], [-2.45, 0, 0.12, 5], [2.45, 0, 0.12, 5]]) box(g, w, 0.7, d, 'sprucePlanks', x, 4.65, z);
  box(g, 2.6, 2.0, 2.2, 'birchPlanks', -0.6, 5.3, -0.9);
  box(g, 3.0, 0.2, 2.6, T('roofGreen'), -0.6, 6.4, -0.9);
  box(g, 0.6, 0.6, 0.06, C(0x8ad0f0), -0.6, 5.5, 0.22);
  for (const [x, y, z, s] of [[0, 9.2, 0, 6.5], [2, 8.2, 1.5, 3.5], [-2.2, 8.4, -1.2, 3.8], [1.4, 10.4, -1, 3.2], [-1.2, 7.8, 2.2, 3]]) box(g, s, s * 0.55, s, C(0x3f8a3a), x, y, z, { tile: 1 });
  // Ladder up the front of the trunk.
  for (const s of [-0.35, 0.35]) box(g, 0.08, 4.2, 0.08, C(0x6a4428), s, 2.1, 0.9);
  for (let y = 0.4; y < 4.2; y += 0.45) box(g, 0.7, 0.07, 0.07, C(0x8a6a42), 0, y, 0.9);
  // Lanterns hanging from the platform.
  for (const x of [-2.3, 2.3]) { box(g, 0.03, 0.5, 0.03, C(0x2a2a2a), x, 3.85, 2.3); box(g, 0.2, 0.28, 0.2, glow(0xffc04a, 2), x, 3.5, 2.3); }
  add.collide(0, 0, 1.2);
  add.chest(1.6, 1.8, -0.5);
}

function fairy(g, add) {
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    giantMushroom(g, add, Math.cos(a) * 3.6, Math.sin(a) * 3.6, 0.45 + (i % 3) * 0.12, i % 2 ? 0xc8372d : 0xb07aff);
  }
  const dots = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    box(g, 0.18, 0.12, 0.18, glow(0x8ae8ff, 1.2), Math.cos(a) * 2.2, 0.1, Math.sin(a) * 2.2, { cast: false });
  }
  for (let i = 0; i < 10; i++) { const d = dyn(box(g, 0.08, 0.08, 0.08, glow(0xfff2a8, 2.5), 0, 1, 0, { cast: false })); dots.push({ d, k: i }); }
  add.anim((dt, t) => { for (const e of dots) { const a = t * 0.8 + e.k * 0.63; e.d.position.set(Math.cos(a) * (1.2 + (e.k % 3) * 0.4), 0.8 + Math.sin(t * 2 + e.k) * 0.4, Math.sin(a) * (1.2 + (e.k % 3) * 0.4)); } });
  add.chest(0, 0, 0);
}

function witch(g, add) {
  // A hut on stilts, a purple roof, a bubbling cauldron, bottles and a black cat.
  for (const [x, z] of [[-1.6, -1.3], [1.6, -1.3], [-1.6, 1.3], [1.6, 1.3]]) box(g, 0.3, 1.6, 0.3, 'spruceLog', x, 0.8, z);
  box(g, 3.8, 0.2, 3.2, 'sprucePlanks', 0, 1.7, 0);
  box(g, 3.2, 2.2, 2.6, 'darkOakPlanks', 0, 2.9, -0.1);
  for (const s of [-1, 1]) box(g, 2.4, 0.2, 3.2, T('roofPurple'), s * 0.9, 4.4, -0.1, { rz: s * -0.75 });
  box(g, 0.9, 1.5, 0.06, C(0x2a1a2a), 0, 2.55, 1.21);
  box(g, 0.5, 0.5, 0.06, glow(0x9aff6a, 0.8), 1.0, 3.2, 1.21);
  for (let k = 0; k < 5; k++) box(g, 0.8, 0.1, 0.3, 'sprucePlanks', 0, 0.2 + k * 0.32, 1.9 + k * -0.12 + 0.6);
  add.rect(-2, -1.8, 2, 1.7);
  // Cauldron.
  box(g, 1.1, 0.8, 1.1, C(0x2a2a2a, { metalness: 0.4 }), 2.6, 0.45, 2.8);
  const brew = box(g, 0.9, 0.06, 0.9, glow(0x7aff4a, 1.4), 2.6, 0.86, 2.8, { cast: false });
  box(g, 0.2, 0.2, 0.2, glow(0xff8a2a, 2), 2.6, 0.1, 2.8);
  add.collide(2.6, 2.8, 0.7);
  const bubbles = [];
  for (let i = 0; i < 4; i++) { const b = dyn(box(g, 0.12, 0.12, 0.12, glow(0xb8ff8a, 1.6), 2.6, 1, 2.8, { cast: false })); bubbles.push(b); }
  add.anim((dt, t) => {
    brew.material.emissiveIntensity = 1.2 + Math.sin(t * 4) * 0.4;
    bubbles.forEach((b, i) => { const k = (t * 0.8 + i * 0.25) % 1; b.position.set(2.6 + Math.sin(i * 2) * 0.25, 0.9 + k * 1.2, 2.8 + Math.cos(i * 2) * 0.25); b.scale.setScalar(1 - k); });
  });
  for (const [x, c] of [[-1.1, 0xff4aa8], [-0.8, 0x4aa8ff], [-0.5, 0xffd34a]]) box(g, 0.14, 0.24, 0.14, glow(c, 0.8), x, 1.92, 1.4);
  // The black cat.
  box(g, 0.3, 0.26, 0.5, C(0x1a1a1a), -1.2, 1.95, 0.9); box(g, 0.26, 0.24, 0.22, C(0x1a1a1a), -1.2, 2.12, 1.22);
  box(g, 0.06, 0.06, 0.02, glow(0xffe04a, 1.5), -1.27, 2.15, 1.34); box(g, 0.06, 0.06, 0.02, glow(0xffe04a, 1.5), -1.13, 2.15, 1.34);
  box(g, 0.06, 0.4, 0.06, C(0x1a1a1a), -1.2, 2.15, 0.62);
  add.chest(-2.6, 2.4, 0.9);
}

function wreck(g, add) {
  // A tilted pirate ship stuck in the sand: hull, broken mast, torn sail, cannons and barrels.
  const hull = new THREE.Group();
  hull.rotation.z = 0.22;
  hull.rotation.y = 0.1;
  g.add(hull);
  box(hull, 3.2, 1.8, 8, 'darkOakPlanks', 0, 0.9, 0);
  box(hull, 2.4, 1.0, 1.6, 'darkOakPlanks', 0, 0.9, 4.6);
  box(hull, 1.4, 0.8, 1.0, 'darkOakPlanks', 0, 1.0, 5.6);
  box(hull, 3.4, 0.2, 8.2, C(0xc8a24a), 0, 1.85, 0); // gold trim
  box(hull, 2.8, 1.2, 2.2, 'sprucePlanks', 0, 2.4, -2.8);
  box(hull, 0.3, 4.6, 0.3, 'spruceLog', 0, 4.0, 0.8);
  box(hull, 2.4, 1.8, 0.05, C(0xe8e0c8), 0.2, 4.6, 0.95, { rz: 0.15 });
  box(hull, 0.9, 0.6, 0.06, C(0x1a1a1a), 0.1, 6.0, 0.8);
  box(hull, 0.24, 0.24, 0.07, C(0xffffff), 0.1, 6.0, 0.84);
  for (const z of [-1.5, 0.5, 2.5]) box(hull, 0.3, 0.3, 0.7, C(0x2a2a2a), 1.7, 1.1, z, { ry: Math.PI / 2 });
  add.rect(-2, -4.2, 2.2, 6.2);
  for (const [x, z] of [[-2.8, 2.2], [-3.2, 3.2], [3.0, -3.6]]) { box(g, 0.6, 0.8, 0.6, 'oakPlanks', x, 0.4, z); box(g, 0.64, 0.08, 0.64, C(0x3a3a3a), x, 0.55, z); add.collide(x, z, 0.4); }
  add.chest(-2.8, -1.2, 1.2);
}

const BUILDERS = { tower, camp, mine, portal, farm, windmill, meadow, stones, well, treehouse, fairy, witch, wreck };

// Sand castles on the beach and lily pads on the marsh pools: little extras without a chest.
export function buildExtras(scene3D, pools) {
  const g = new THREE.Group();
  for (const [x, z, s] of [[-6, 56, 1], [2, 57.5, 0.8], [-14, 58, 0.7]]) {
    const y = scene3D.groundAt(x, z);
    box(g, 1.6 * s, 0.6 * s, 1.6 * s, C(0xe8d098), x, y + 0.3 * s, z);
    for (const [dx, dz] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) box(g, 0.45 * s, 1.0 * s, 0.45 * s, C(0xe0c488), x + dx * s, y + 0.5 * s, z + dz * s);
    box(g, 0.6 * s, 1.3 * s, 0.6 * s, C(0xe8d098), x, y + 0.9 * s, z);
    box(g, 0.02, 0.5, 0.02, C(0x6a4428), x, y + 1.8 * s, z); box(g, 0.3, 0.2, 0.02, C(0xd8382e), x + 0.15, y + 1.95 * s, z);
    scene3D.collidables.push({ x, z, r: 1.0 * s });
  }
  // A bamboo grove for the pandas (south-west, by the bee meadow).
  let bs = 9;
  const brnd = () => ((bs = (bs * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 26; i++) {
    const a = brnd() * Math.PI * 2, r = 2.6 + brnd() * 2.6, x = -26 + Math.cos(a) * r, z = 47 + Math.sin(a) * r;
    if (scene3D._checkCollision(x, z)) continue;
    const y = scene3D.groundAt(x, z), h = 2.2 + brnd() * 2.2;
    box(g, 0.14, h, 0.14, C(0x7ab83a), x, y + h / 2, z, { cast: false });
    for (let k = 1; k < h; k += 0.7) box(g, 0.17, 0.05, 0.17, C(0x5a8a2a), x, y + k, z, { cast: false });
    box(g, 0.5, 0.06, 0.18, C(0x8ad04a), x + 0.2, y + h - 0.2, z, { cast: false, ry: a });
    scene3D.collidables.push({ x, z, r: 0.15 });
  }
  for (const [px, pz, pr] of pools) {
    for (let i = 0; i < 4; i++) {
      const a = i * 1.9 + px, r = pr * (0.35 + (i % 2) * 0.3);
      const pad = box(g, 0.7, 0.03, 0.7, C(0x3f8a3a), px + Math.cos(a) * r, 0.09, pz + Math.sin(a) * r, { cast: false, ry: a });
      if (i === 1) box(g, 0.16, 0.12, 0.16, C(0xff8ab0), pad.position.x, 0.16, pad.position.z, { cast: false });
    }
  }
  return g;
}

export function buildPlace(def, scene3D) {
  const g = new THREE.Group();
  const y = scene3D.groundAt(def.x, def.z);
  g.position.set(def.x, y, def.z);
  g.rotation.y = def.ry;
  const cos = Math.cos(def.ry), sin = Math.sin(def.ry);
  const W = (lx, lz) => ({ x: def.x + lx * cos + lz * sin, z: def.z - lx * sin + lz * cos });
  let seed = def.x * 31 + def.z * 17 + 99;
  const rnd = () => ((seed = (Math.abs(seed) * 16807 + 11) % 2147483647) / 2147483647);
  const out = { group: g, anims: [], nodes: [], portal: null };
  const add = {
    collide: (lx, lz, r) => { const p = W(lx, lz); scene3D.collidables.push({ x: p.x, z: p.z, r }); },
    rect: (x0, z0, x1, z1) => {
      // A rotated rectangle: covered by a row of circles along its long side.
      const len = Math.max(x1 - x0, z1 - z0), r = Math.min(x1 - x0, z1 - z0) / 2 + 0.05;
      const n = Math.max(1, Math.ceil(len / (r * 1.4)));
      for (let i = 0; i <= n; i++) {
        const k = i / n, lx = x1 - x0 >= z1 - z0 ? x0 + (x1 - x0) * k : (x0 + x1) / 2, lz = x1 - x0 >= z1 - z0 ? (z0 + z1) / 2 : z0 + (z1 - z0) * k;
        add.collide(lx, lz, r);
      }
    },
    chest: (lx, lz, ry) => out.nodes.push({ chest: true, ...W(lx, lz), ry: def.ry + ry }),
    ore: (lx, lz, kind) => out.nodes.push({ ore: kind, ...W(lx, lz) }),
    node: (n) => out.nodes.push({ ...n, ...W(n.x, n.z) }),
    anim: (fn) => out.anims.push(fn),
    portalSurface: (m) => { out.portal = m; },
  };
  BUILDERS[def.id](g, add, rnd);
  return out;
}

// Dirt trails from the edge of the village to the places, with a lantern now and then.
export function buildTrails(scene3D) {
  const g = new THREE.Group();
  const dirt = [C(0x9a7a52), C(0x8a6a44), C(0xa88a5e)];
  const post = C(0x3a2a1a), lamp = glow(0xffc04a, 1.8);
  let seed = 5;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (const id of ['tower', 'mine', 'camp', 'portal', 'farm', 'windmill', 'meadow', 'stones', 'well']) {
    const pl = PLACES.find((p) => p.id === id);
    const d = Math.hypot(pl.x, pl.z), ux = pl.x / d, uz = pl.z / d;
    let lampSide = 1;
    for (let r = 29; r < d - 5; r += 0.9) {
      const wob = Math.sin(r * 0.25 + pl.x) * 1.2;
      const x = ux * r - uz * wob, z = uz * r + ux * wob;
      if (scene3D._checkCollision(x, z) || scene3D._insideAnyHouse?.(x, z, 0.5)) continue;
      const y = scene3D.groundAt(x, z);
      box(g, 1.3 + rnd() * 0.3, 0.04, 1.0, dirt[Math.floor(rnd() * 3)], x, y + 0.025, z, { ry: Math.atan2(ux, uz) + (rnd() - 0.5) * 0.3, cast: false });
      if (Math.round(r / 0.9) % 10 === 0) {
        const lx = x - uz * 1.3 * lampSide, lz = z + ux * 1.3 * lampSide;
        lampSide = -lampSide;
        if (scene3D._checkCollision(lx, lz)) continue;
        const ly = scene3D.groundAt(lx, lz);
        box(g, 0.12, 1.5, 0.12, post, lx, ly + 0.75, lz);
        box(g, 0.26, 0.3, 0.26, lamp, lx, ly + 1.6, lz, { cast: false });
        box(g, 0.32, 0.06, 0.32, post, lx, ly + 1.78, lz);
        scene3D.collidables.push({ x: lx, z: lz, r: 0.2 });
      }
    }
  }
  return g;
}

// Little woods, bushes and flower patches in the open land between the village and the regions,
// so that walking there is never walking through nothing. Instanced: a handful of draw calls.
export function buildGroves(scene3D) {
  const g = new THREE.Group();
  let seed = 23;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const trailIds = ['tower', 'mine', 'camp', 'portal', 'farm', 'windmill', 'meadow', 'stones', 'well'];
  const nearTrail = (x, z) => trailIds.some((id) => {
    const pl = PLACES.find((p) => p.id === id), d = Math.hypot(pl.x, pl.z), ux = pl.x / d, uz = pl.z / d;
    const along = x * ux + z * uz, across = Math.abs(-x * uz + z * ux);
    return along > 26 && along < d && across < 3.2;
  });
  const free = (x, z, r) => {
    const R = Math.hypot(x, z);
    if (R < 31 || R > 74) return false;
    if (x < -44 || x > 43 || z < -46 || z > 50) return false; // the regions have their own scenery
    if (PLACES.some((p) => Math.hypot(p.x - x, p.z - z) < 9)) return false;
    if (nearTrail(x, z)) return false;
    if (scene3D.inLava?.(x, z) || (x > 22 && x < 44 && z < -35)) return false;
    for (let a = 0; a < 6; a++) if (scene3D._checkCollision(x + Math.cos(a) * r, z + Math.sin(a) * r)) return false;
    return !scene3D._insideAnyHouse?.(x, z, 1);
  };
  const trunks = [], leaves1 = [], leaves2 = [], bushes = [], flowers = [], stems = [];
  const groves = [];
  for (let i = 0; i < 400 && groves.length < 14; i++) {
    const x = (rnd() - 0.5) * 150, z = (rnd() - 0.5) * 150;
    if (free(x, z, 3) && !groves.some(([gx, gz]) => Math.hypot(gx - x, gz - z) < 14)) groves.push([x, z]);
  }
  for (const [gx, gz] of groves) {
    const n = 3 + Math.floor(rnd() * 4);
    for (let k = 0; k < n; k++) {
      const x = gx + (rnd() - 0.5) * 8, z = gz + (rnd() - 0.5) * 8, s = 0.8 + rnd() * 0.5;
      if (!free(x, z, 1.2)) continue;
      const y = scene3D.groundAt(x, z);
      trunks.push([x, y + 1.2 * s, z, 0.45 * s, 2.4 * s, 0.45 * s]);
      leaves1.push([x, y + 2.8 * s, z, 2.6 * s, 1.4 * s, 2.6 * s, rnd() * 3]);
      leaves2.push([x, y + 3.7 * s, z, 1.6 * s, 0.9 * s, 1.6 * s, rnd() * 3]);
      scene3D.collidables.push({ x, z, r: 0.4 * s });
    }
    for (let k = 0; k < 5; k++) {
      const x = gx + (rnd() - 0.5) * 11, z = gz + (rnd() - 0.5) * 11;
      if (!free(x, z, 0.6)) continue;
      const s = 0.6 + rnd() * 0.5, y = scene3D.groundAt(x, z);
      bushes.push([x, y + 0.35 * s, z, 1.1 * s, 0.7 * s, 1.0 * s, rnd() * 3]);
      scene3D.collidables.push({ x, z, r: 0.45 * s });
    }
  }
  // Flower patches dotted around.
  for (let i = 0; i < 260; i++) {
    const x = (rnd() - 0.5) * 150, z = (rnd() - 0.5) * 150;
    if (!free(x, z, 0.3)) continue;
    const y = scene3D.groundAt(x, z);
    stems.push([x, y + 0.13, z, 0.04, 0.26, 0.04]);
    flowers.push([x, y + 0.31, z, 0.15, 0.15, 0.15, rnd() * 3, i % 5]);
  }
  const BOXG = new THREE.BoxGeometry(1, 1, 1);
  const inst = (list, m, cast = true) => {
    if (!list.length) return;
    const mesh = new THREE.InstancedMesh(BOXG, m, list.length);
    const mt = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    const colors = [0xff6b9d, 0xffd93d, 0xffffff, 0xb07aff, 0xff8a3d];
    list.forEach(([x, y, z, sx, sy, sz, ry = 0, ci], i) => {
      e.set(0, ry, 0); q.setFromEuler(e);
      mt.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sx, sy, sz));
      mesh.setMatrixAt(i, mt);
      if (ci !== undefined) mesh.setColorAt(i, new THREE.Color(colors[ci]));
    });
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    g.add(mesh);
  };
  inst(trunks, C(0x6a4a2a));
  inst(leaves1, C(0x4f9a3a));
  inst(leaves2, C(0x5aa845));
  inst(bushes, C(0x3f8a3a));
  inst(stems, C(0x3f8a3a), false);
  inst(flowers, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }), false);
  return g;
}

// Region fillers: willows, mossy logs and mushrooms in the marsh, palm trees and shells on the
// beach, ice crystals on the mountain. Instanced like the groves.
export function buildRegionFillers(scene3D) {
  const g = new THREE.Group();
  let seed = 41;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const okAt = (x, z, r) => {
    if (Math.hypot(x, z) > 77) return false;
    if (PLACES.some((p) => Math.hypot(p.x - x, p.z - z) < 7)) return false;
    if (scene3D.interactables.some((i) => i.worldPos && Math.hypot(i.worldPos.x - x, i.worldPos.z - z) < 2.2)) return false;
    for (let a = 0; a < 6; a++) if (scene3D._checkCollision(x + Math.cos(a) * r, z + Math.sin(a) * r)) return false;
    return !scene3D._walkwayAt?.(x, z);
  };
  const L = { trunk: [], willow: [], drape: [], log: [], moss: [], cap: [], stem: [], palmT: [], palmL: [], shell: [], ice: [], ice2: [] };
  // Marsh (east, behind the mist).
  for (let i = 0, n = 0; i < 300 && n < 16; i++) {
    const x = 47 + rnd() * 32, z = (rnd() - 0.5) * 70;
    if (Math.abs(z) < 3 || !okAt(x, z, 1.4)) continue;
    n++;
    const y = scene3D.groundAt(x, z), s = 0.9 + rnd() * 0.4;
    L.trunk.push([x, y + 1.3 * s, z, 0.4 * s, 2.6 * s, 0.4 * s]);
    L.willow.push([x, y + 3.0 * s, z, 2.8 * s, 1.0 * s, 2.8 * s, rnd() * 3]);
    for (const [dx, dz] of [[-1.2, 0], [1.2, 0], [0, -1.2], [0, 1.2]]) L.drape.push([x + dx * s, y + 2.1 * s, z + dz * s, 0.5 * s, 1.4 * s, 0.5 * s]);
    scene3D.collidables.push({ x, z, r: 0.4 * s });
  }
  for (let i = 0, n = 0; i < 200 && n < 10; i++) {
    const x = 47 + rnd() * 32, z = (rnd() - 0.5) * 70;
    if (Math.abs(z) < 3 || !okAt(x, z, 1.2)) continue;
    n++;
    const y = scene3D.groundAt(x, z), ry = rnd() * 3;
    L.log.push([x, y + 0.25, z, 2.2, 0.5, 0.5, ry]);
    L.moss.push([x, y + 0.52, z, 1.6, 0.06, 0.4, ry]);
    for (let k = 0; k < 3; k++) { const mx = x + (rnd() - 0.5) * 2, mz = z + (rnd() - 0.5) * 2; L.stem.push([mx, y + 0.12, mz, 0.08, 0.24, 0.08]); L.cap.push([mx, y + 0.28, mz, 0.3, 0.12, 0.3]); }
    scene3D.collidables.push({ x, z, r: 0.6 });
  }
  // Beach (south).
  for (let i = 0, n = 0; i < 300 && n < 12; i++) {
    const x = (rnd() - 0.5) * 70, z = 52 + rnd() * 16;
    if (!okAt(x, z, 1.2)) continue;
    n++;
    const y = scene3D.groundAt(x, z), s = 0.9 + rnd() * 0.3, lean = (rnd() - 0.5) * 0.6;
    for (let k = 0; k < 6; k++) L.palmT.push([x + lean * k * 0.25, y + 0.35 + k * 0.62 * s, z, 0.34 * s, 0.64 * s, 0.34 * s, k * 0.2]);
    const tx = x + lean * 1.5, ty = y + 0.35 + 6 * 0.62 * s;
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; L.palmL.push([tx + Math.cos(a) * 0.9, ty - 0.15, z + Math.sin(a) * 0.9, 1.9, 0.12, 0.5, -a]); }
    scene3D.collidables.push({ x, z, r: 0.35 });
  }
  for (let i = 0; i < 40; i++) {
    const x = (rnd() - 0.5) * 70, z = 56 + rnd() * 13;
    if (!okAt(x, z, 0.2)) continue;
    L.shell.push([x, scene3D.groundAt(x, z) + 0.04, z, 0.18, 0.08, 0.14, rnd() * 3, i % 5]);
  }
  // Mountain (north): ice crystals among the rocks.
  for (let i = 0, n = 0; i < 300 && n < 14; i++) {
    const x = (rnd() - 0.5) * 56, z = -50 - rnd() * 26;
    // Not on the stone stairs, the summit or the cliff sign.
    if (!okAt(x, z, 0.8) || scene3D.inLava?.(x, z) || (x > 22 && z > -62) || (Math.abs(x) < 5 && z > -62 && z < -50) || Math.hypot(x, z + 68) < 10) continue;
    n++;
    const y = scene3D.groundAt(x, z);
    for (let k = 0; k < 3; k++) {
      const h = 0.8 + rnd() * 1.4;
      (k % 2 ? L.ice2 : L.ice).push([x + (rnd() - 0.5) * 0.9, y + h / 2, z + (rnd() - 0.5) * 0.9, 0.3 + rnd() * 0.2, h, 0.3 + rnd() * 0.2, rnd() * 3]);
    }
    scene3D.collidables.push({ x, z, r: 0.6 });
  }
  const BOXG = new THREE.BoxGeometry(1, 1, 1);
  const shellColors = [0xffe0d0, 0xf8c8b0, 0xffffff, 0xf0d8a8, 0xffb8c8];
  const inst = (list, m, cast = true) => {
    if (!list.length) return;
    const mesh = new THREE.InstancedMesh(BOXG, m, list.length);
    const mt = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    list.forEach(([x, y, z, sx, sy, sz, ry = 0, ci], i) => {
      e.set(0, ry, 0); q.setFromEuler(e);
      mt.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sx, sy, sz));
      mesh.setMatrixAt(i, mt);
      if (ci !== undefined) mesh.setColorAt(i, new THREE.Color(shellColors[ci]));
    });
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    g.add(mesh);
  };
  inst(L.trunk, C(0x5a4a32)); inst(L.willow, C(0x6a9a4a)); inst(L.drape, C(0x7aaa52), false);
  inst(L.log, C(0x5a4028)); inst(L.moss, C(0x4f9a3a), false); inst(L.stem, C(0xf4ead8), false); inst(L.cap, C(0xc8572d), false);
  inst(L.palmT, C(0x9a7a4a)); inst(L.palmL, C(0x4fa83a));
  inst(L.shell, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }), false);
  inst(L.ice, C(0xa8e8ff, { emissive: 0x4ab8e8, emissiveIntensity: 0.35, roughness: 0.2 })); inst(L.ice2, C(0xd8f6ff, { emissive: 0x6ac8f0, emissiveIntensity: 0.3, roughness: 0.2 }));
  return g;
}
