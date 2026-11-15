// The two outer regions: the pine forest (west) and the marsh (east).
// Built once into their own groups; trees, reeds and mist are instanced (a few draw calls each)
// and the scene hides a region when the hero is far from it.
import * as THREE from 'three';
import { blockMat, texBox } from './textures.js';
import { seededRandom } from './interiors.js';

export const WORLD_RADIUS = 84;
export const REGIONS = {
  forest: { x: -64, z: 0, show: 52 },
  marsh: { x: 64, z: 0, show: 52 },
};
// River across the forest path, and the forest bridge built by the Pont spell.
export const RIVER = { x0: -60.2, x1: -55.8 };
export const BRIDGES = {
  village: { x0: -20.2, x1: -11.8, z: -16.3, island: { x: -16, z: -16, r: 1.25 } },
  forest: { x0: -61, x1: -55, z: 0 },
};
// The marsh boardwalk (walkable over the pools) and the mist wall at its entrance.
export const BOARDWALK = { x0: 47, x1: 76, z: 0, hw: 0.75 };
export const MIST_X = 45.5;
export const MARSH_POOLS = [[52, 7, 3.4], [55, -6, 3.0], [61, 0, 3.6], [67, 7.5, 3.2], [69, -6.5, 3.4], [74.5, 1.5, 2.6], [58, 13, 2.6], [63, -13, 2.8]];
export const MARSH_LANTERNS = [[50, 1.1], [56, -1.1], [62, 1.1], [68, -1.1], [74, 1.1]];
export const CABIN = { x: -70, z: -6 };

const M = new Map();
const mat = (c, o = {}) => {
  const k = `${c}|${o.emissive ?? ''}|${o.emissiveIntensity ?? ''}|${o.opacity ?? ''}`;
  if (!M.has(k)) M.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...o, transparent: o.opacity !== undefined, depthWrite: o.opacity === undefined }));
  return M.get(k);
};
const BOX = new THREE.BoxGeometry(1, 1, 1);

function instanced(parent, material, list, { cast = true } = {}) {
  // list: [x, y, z, sx, sy, sz, ry]
  const mesh = new THREE.InstancedMesh(BOX, material, list.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  list.forEach(([x, y, z, sx, sy, sz, ry = 0], i) => {
    e.set(0, ry, 0); q.setFromEuler(e);
    m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sx, sy, sz));
    mesh.setMatrixAt(i, m);
  });
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

// Pine trees: trunk + three stacked leaf layers (one InstancedMesh per part).
function pines(parent, spots) {
  const trunks = [], l1 = [], l2 = [], l3 = [], snow = [];
  for (const [x, y, z, s] of spots) {
    trunks.push([x, y + 1.1 * s, z, 0.4 * s, 2.2 * s, 0.4 * s]);
    l1.push([x, y + 2.0 * s, z, 2.1 * s, 0.8 * s, 2.1 * s, s * 3]);
    l2.push([x, y + 2.8 * s, z, 1.5 * s, 0.8 * s, 1.5 * s, s * 5]);
    l3.push([x, y + 3.55 * s, z, 0.9 * s, 0.8 * s, 0.9 * s, s * 7]);
    snow.push([x, y + 4.05 * s, z, 0.35 * s, 0.35 * s, 0.35 * s]);
  }
  instanced(parent, mat(0x5a3a22), trunks);
  instanced(parent, mat(0x2f6a3a), l1);
  instanced(parent, mat(0x37784a), l2);
  instanced(parent, mat(0x418a52), l3);
  instanced(parent, mat(0x4a9a5a), snow, { cast: false });
}

export function buildForest(ctx) {
  const g = new THREE.Group();
  const rnd = seededRandom(91);
  const h = ctx.heightAt;
  const spots = [];
  const free = (x, z) => {
    if (Math.hypot(x, z) > WORLD_RADIUS - 1) return false;
    if (Math.abs(z) < 3.2 && x > -76) return false; // the path
    if (x > RIVER.x0 - 1.2 && x < RIVER.x1 + 1.2) return false; // the river
    if (Math.hypot(x - CABIN.x, z - CABIN.z) < 6) return false;
    if (Math.hypot(x + 68, z - 4) < 5.5) return false; // the clearing
    return true;
  };
  for (let i = 0; i < 420 && spots.length < 150; i++) {
    const x = -44 - rnd() * 42, z = (rnd() - 0.5) * 84;
    if (!free(x, z)) continue;
    if (spots.some(([sx, , sz]) => Math.hypot(sx - x, sz - z) < 2.6)) continue;
    spots.push([x, h(x, z), z, 0.8 + rnd() * 0.55]);
  }
  pines(g, spots);
  for (const [x, , z, s] of spots) ctx.collidables.push({ x, z, r: 0.35 * s + 0.1 });

  // River: a strip of water from north to south, with stones on the banks.
  const water = new THREE.Mesh(new THREE.PlaneGeometry(RIVER.x1 - RIVER.x0, 160), ctx.waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set((RIVER.x0 + RIVER.x1) / 2, 0.05, 0);
  g.add(water);
  ctx.collidables.push({ rect: true, water: true, x0: RIVER.x0, x1: RIVER.x1, z0: -90, z1: 90 });
  const stones = [];
  for (let z = -60; z < 60; z += 1.3) {
    for (const bank of [RIVER.x0 - 0.3, RIVER.x1 + 0.3]) {
      if (Math.abs(z) < 2 || rnd() < 0.35) continue;
      const s = 0.35 + rnd() * 0.4;
      stones.push([bank + (rnd() - 0.5) * 0.4, 0.1, z, s, 0.2 + rnd() * 0.25, s, rnd() * 2]);
    }
  }
  instanced(g, mat(0x8d8a86), stones, { cast: false });

  // Mushrooms (red caps) and ferns on the forest floor.
  const caps = [], stems = [], ferns = [];
  for (let i = 0; i < 90; i++) {
    const x = -46 - rnd() * 38, z = (rnd() - 0.5) * 76;
    if (!free(x, z)) continue;
    if (rnd() < 0.4) {
      stems.push([x, 0.12, z, 0.1, 0.24, 0.1]);
      caps.push([x, 0.28, z, 0.3, 0.12, 0.3]);
    } else ferns.push([x, 0.2, z, 0.7, 0.4, 0.12, rnd() * 3]);
  }
  instanced(g, mat(0xf0e6d0), stems, { cast: false });
  instanced(g, mat(0xd8372d), caps, { cast: false });
  instanced(g, mat(0x3a8a3a), ferns, { cast: false });

  // The forester's log cabin in the heart of the forest.
  const cab = new THREE.Group();
  cab.position.set(CABIN.x, h(CABIN.x, CABIN.z), CABIN.z);
  for (let k = 0; k < 5; k++) {
    const y = 0.25 + k * 0.5;
    texBox(cab, 4.4, 0.48, 0.48, blockMat('spruceLog'), 0, y, 1.6, { tile: 0.5 });
    texBox(cab, 4.4, 0.48, 0.48, blockMat('spruceLog'), 0, y, -1.6, { tile: 0.5 });
    if (k < 4 || true) {
      texBox(cab, 0.48, 0.48, 3.2, blockMat('spruceLog'), 2.0, y, 0, { tile: 0.5 });
      texBox(cab, 0.48, 0.48, 3.2, blockMat('spruceLog'), -2.0, y, 0, { tile: 0.5 });
    }
  }
  texBox(cab, 1.0, 1.7, 0.1, blockMat('darkOakPlanks'), 0.6, 0.85, 1.86, { tile: 0.5 });
  for (let k = 0; k < 4; k++) {
    const w = 5.2 - k * 1.2;
    texBox(cab, w, 0.4, 4.2, blockMat('roofBrown'), 0, 2.7 + k * 0.4, 0, { tile: 0.5 });
  }
  texBox(cab, 0.6, 1.6, 0.6, blockMat('cobble'), -1.4, 3.6, -0.8, { tile: 0.5 });
  const win = mat(0xffd98a, { emissive: 0xffb347, emissiveIntensity: 0.9 });
  const wn = new THREE.Mesh(BOX, win); wn.scale.set(0.7, 0.6, 0.06); wn.position.set(-1.0, 1.4, 1.88); cab.add(wn);
  g.add(cab);
  ctx.collidables.push({ x: CABIN.x, z: CABIN.z, r: 2.6 });
  // A woodpile and a stump with an axe by the cabin.
  for (let k = 0; k < 6; k++) texBox(g, 0.3, 0.3, 1.0, blockMat('oakLog'), CABIN.x + 3.0 + (k % 3) * 0.32, 0.15 + Math.floor(k / 3) * 0.3, CABIN.z + 1.2, { tile: 0.3 });
  ctx.collidables.push({ x: CABIN.x + 3.3, z: CABIN.z + 1.2, r: 0.6 });
  return g;
}

export function buildMarsh(ctx) {
  const g = new THREE.Group();
  const rnd = seededRandom(57);
  // Pools of dark water.
  for (const [x, z, r] of MARSH_POOLS) {
    const p = new THREE.Mesh(new THREE.CircleGeometry(r, 14), ctx.marshWaterMat);
    p.rotation.x = -Math.PI / 2;
    p.position.set(x, 0.05, z);
    g.add(p);
    ctx.collidables.push({ x, z, r: r - 0.2, water: true });
  }
  // Reeds and lily pads around the pools.
  const reeds = [], tops = [], pads = [];
  for (const [x, z, r] of MARSH_POOLS) {
    for (let k = 0; k < 16; k++) {
      const a = rnd() * Math.PI * 2, rr = r + (rnd() - 0.3) * 0.8;
      const rx = x + Math.cos(a) * rr, rz = z + Math.sin(a) * rr;
      if (Math.abs(rz) < BOARDWALK.hw + 0.3 && rx > BOARDWALK.x0 - 1 && rx < BOARDWALK.x1 + 1) continue;
      const hh = 0.7 + rnd() * 0.7;
      reeds.push([rx, hh / 2, rz, 0.06, hh, 0.06, rnd()]);
      if (rnd() < 0.5) tops.push([rx, hh + 0.08, rz, 0.1, 0.22, 0.1]);
    }
    for (let k = 0; k < 6; k++) {
      const a = rnd() * Math.PI * 2, rr = rnd() * (r - 0.6);
      pads.push([x + Math.cos(a) * rr, 0.07, z + Math.sin(a) * rr, 0.55, 0.03, 0.55, rnd() * 3]);
    }
  }
  instanced(g, mat(0x6a8a3a), reeds, { cast: false });
  instanced(g, mat(0x7a4a2a), tops, { cast: false });
  instanced(g, mat(0x4f9e3a), pads, { cast: false });

  // Boardwalk on posts across the marsh.
  const planks = [], posts = [];
  for (let x = BOARDWALK.x0; x < BOARDWALK.x1; x += 0.5) {
    planks.push([x + 0.25, 0.18, BOARDWALK.z, 0.46, 0.08, BOARDWALK.hw * 2, rnd() * 0.04 - 0.02]);
    if (Math.round(x * 2) % 6 === 0) for (const s of [-1, 1]) posts.push([x + 0.25, 0.05, BOARDWALK.z + s * (BOARDWALK.hw + 0.05), 0.14, 0.5, 0.14]);
  }
  instanced(g, mat(0x8a6a44), planks, { cast: false });
  instanced(g, mat(0x5a3a22), posts, { cast: false });

  // Dead trees.
  const bark = mat(0x4a3a2e);
  for (const [x, z] of [[50, 12], [58, -12], [66, 13], [72, -11], [77, 8], [53, -14], [70, 16]]) {
    const t = new THREE.Group();
    t.position.set(x, 0, z);
    const tr = new THREE.Mesh(BOX, bark); tr.scale.set(0.4, 3, 0.4); tr.position.y = 1.5; t.add(tr);
    for (const [bx, by, bz, ry] of [[0.5, 2.2, 0, 0.6], [-0.4, 2.6, 0.2, -0.7], [0.1, 2.9, -0.4, 0.3]]) {
      const b = new THREE.Mesh(BOX, bark); b.scale.set(1.0, 0.16, 0.16); b.position.set(bx, by, bz); b.rotation.set(0, ry, bx > 0 ? 0.4 : -0.4); t.add(b);
    }
    t.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    g.add(t);
    ctx.collidables.push({ x, z, r: 0.35 });
  }

  // Lanterns along the boardwalk (lit by the Fire spell).
  const lanterns = MARSH_LANTERNS.map(([x, z]) => {
    const l = new THREE.Group();
    l.position.set(x, 0, z);
    const post = new THREE.Mesh(BOX, mat(0x3a2a1c)); post.scale.set(0.12, 1.5, 0.12); post.position.y = 0.95; l.add(post);
    const cap = new THREE.Mesh(BOX, mat(0x2a2a30)); cap.scale.set(0.38, 0.07, 0.38); cap.position.y = 2.06; l.add(cap);
    const base = new THREE.Mesh(BOX, mat(0x2a2a30)); base.scale.set(0.32, 0.06, 0.32); base.position.y = 1.66; l.add(base);
    const unlit = new THREE.Mesh(BOX, mat(0x6a6050, { opacity: 0.7 })); unlit.scale.set(0.24, 0.32, 0.24); unlit.position.y = 1.86; l.add(unlit);
    const glow = new THREE.Mesh(BOX, mat(0xfff0c0, { emissive: 0xffb347, emissiveIntensity: 2.6 }));
    glow.scale.set(0.26, 0.34, 0.26); glow.position.y = 1.86; glow.visible = false; l.add(glow);
    l.userData.unlit = unlit;
    l.userData.glow = glow;
    l.userData.dynamic = true;
    g.add(l);
    return l;
  });

  // The mist wall at the entrance (cleared by the Wind spell).
  const puffs = [];
  for (let z = -60; z <= 60; z += 1.2) {
    for (let k = 0; k < 3; k++) {
      const s = 1.4 + rnd() * 1.6;
      puffs.push([MIST_X + (rnd() - 0.5) * 3, 0.5 + rnd() * 2.2, z + (rnd() - 0.5) * 1.2, s, s * 0.75, s, rnd() * 3]);
    }
  }
  const puffGeo = new THREE.IcosahedronGeometry(0.6, 1);
  const mist = new THREE.InstancedMesh(puffGeo, new THREE.MeshStandardMaterial({ color: 0xf2f6f8, transparent: true, opacity: 0.6, roughness: 1, depthWrite: false, emissive: 0x9aa8b0, emissiveIntensity: 0.25 }), puffs.length);
  {
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    puffs.forEach(([x, y, z, sx, sy, sz, ry], i) => { e.set(ry, ry * 2, 0); q.setFromEuler(e); m4.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sx, sy, sz)); mist.setMatrixAt(i, m4); });
  }
  g.add(mist);
  mist.userData.dynamic = true;
  return { group: g, lanterns, mist };
}

// Signpost to travel between regions (and the village hub).
export const TRAVEL = {
  village: { x: 4.6, z: 5.2, back: { x: 3.4, z: 6.5 } },
  forest: { x: -45.5, z: 3.6, back: { x: -46.5, z: 1.2 }, word: { 5: 'f', 6: 'bois', 7: 'forêt' } },
  marsh: { x: 41.5, z: -3.6, back: { x: 40.5, z: -1.2 }, word: { 5: 'm', 6: 'mare', 7: 'marais' } },
};
