// The two outer regions: the pine forest (west) and the marsh (east).
// Built once into their own groups; trees, reeds and mist are instanced (a few draw calls each)
// and the scene hides a region when the hero is far from it.
import * as THREE from 'three';
import { blockMat, texBox } from './textures.js';
import { seededRandom } from './interiors.js';
import { mergeStatic } from './perf.js';

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
// Clearings kept free of trees for the forest places (landmarks.js): tree house, fairy ring.
export const CLEARINGS = [[-78, -18, 6.5], [-52, 24, 6]];

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
    if (CLEARINGS.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r)) return false;
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

/* ===== Mountain (north) and coast (south) ===== */
REGIONS.mountain = { x: 0, z: -64, show: 40 };
REGIONS.coast = { x: 0, z: 64, show: 40 };
BRIDGES.coast = { x0: 6.6, x1: 10.2, z: 75 };
TRAVEL.mountain = { x: -3.6, z: -45.5, back: { x: -1.4, z: -46.5 }, word: { 5: 'm', 6: 'mont', 7: 'montagne' } };
TRAVEL.coast = { x: 3.6, z: 48.5, back: { x: 1.4, z: 49.5 }, word: { 5: 'p', 6: 'mer', 7: 'plage' } };
export const SUMMIT = { x: 0, z: -68, level: 4.5, r: 8.5 };
// The snowball arena of the snow golem (J7), on the western slope: kept clear of rocks and pines.
export const SNOW_ARENA = { x: -14, z: -53, r: 9 };
// Stone stairs up the cliff (built by the Stone spell), along z.
export const STAIRS = { x: 0, z0: -55.2, z1: -60.2, hw: 0.8 };
export const TOWER = { x: 0, z: -70.5 };
export const BOOK = { x: 0, z: -69.2 };
export const SEA_Z = 70.3;
export const PIER = { x: 6, z0: 67.5, z1: 75.6, hw: 0.7 };
export const ISLAND = { x: 13.2, z: 75, r: 3.0 };
export const LIGHTHOUSE = { x: -10, z: 66.5 };

export function buildMountain(ctx) {
  const g = new THREE.Group();
  const rnd = seededRandom(23);
  const h = ctx.heightAt;
  // Boulders on the slopes and snowy pines.
  const rocks = [], spots = [];
  for (let i = 0; i < 160; i++) {
    const x = (rnd() - 0.5) * 70, z = -44 - rnd() * 38;
    if (Math.hypot(x, z) > WORLD_RADIUS - 1 || Math.abs(x) < 3.5 || Math.hypot(x - SUMMIT.x, z - SUMMIT.z) < SUMMIT.r + 1.5) continue;
    if (x > LAVA.x0 - 3 && x < LAVA.x1 + 3 && z > LAVA.z0 - 4 && z < LAVA.z1 + 4) continue; // the lava course
    if (Math.hypot(x - SNOW_ARENA.x, z - SNOW_ARENA.z) < SNOW_ARENA.r + 1.5) continue; // the snowball arena
    if (rnd() < 0.55) { const s = 0.5 + rnd() * 0.9; rocks.push([x, h(x, z) + s * 0.35, z, s, s * 0.7, s * 0.9, rnd() * 3]); ctx.collidables.push({ x, z, r: s * 0.45 }); }
    else if (spots.length < 40 && !spots.some(([sx, , sz]) => Math.hypot(sx - x, sz - z) < 3)) spots.push([x, h(x, z), z, 0.7 + rnd() * 0.4]);
  }
  instanced(g, mat(0x8d8a86), rocks);
  pines(g, spots);
  for (const [x, , z, s] of spots) ctx.collidables.push({ x, z, r: 0.35 * s + 0.1 });
  // Alaric's tower on the summit: four stone pillars and a purple roof over the lectern.
  const y0 = SUMMIT.level;
  for (const [px, pz] of [[-2.2, -2.2], [2.2, -2.2], [-2.2, 2.2], [2.2, 2.2]]) {
    texBox(g, 0.7, 3.4, 0.7, blockMat('stoneBricks'), TOWER.x + px, y0 + 1.7, TOWER.z + pz, { tile: 0.5 });
    ctx.collidables.push({ x: TOWER.x + px, z: TOWER.z + pz, r: 0.45 });
  }
  for (let k = 0; k < 5; k++) texBox(g, 5.6 - k * 1.1, 0.45, 5.6 - k * 1.1, blockMat('roofPurple'), TOWER.x, y0 + 3.6 + k * 0.45, TOWER.z, { tile: 0.5 });
  texBox(g, 5.2, 0.2, 5.2, blockMat('stoneBricks'), TOWER.x, y0 + 0.1, TOWER.z, { tile: 0.5 });
  // The lectern and the big book (glowing).
  texBox(g, 0.5, 1.0, 0.5, blockMat('darkOakPlanks'), BOOK.x, y0 + 0.5, BOOK.z, { tile: 0.5 });
  const book = new THREE.Group();
  book.position.set(BOOK.x, y0 + 1.08, BOOK.z);
  book.rotation.x = -0.35;
  const cover = new THREE.Mesh(BOX, mat(0x6a2a8a)); cover.scale.set(1.0, 0.1, 0.72); book.add(cover);
  const pages = new THREE.Mesh(BOX, mat(0xfff6dc, { emissive: 0xffe8a0, emissiveIntensity: 0.9 })); pages.scale.set(0.92, 0.08, 0.64); pages.position.y = 0.07; book.add(pages);
  book.userData.dynamic = true;
  g.add(book);
  // Stone stairs (hidden until the Stone spell).
  const stairs = new THREE.Group();
  const n = 10;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const z = STAIRS.z0 + (STAIRS.z1 - STAIRS.z0) * t;
    const top = ctx.stairsY(z);
    texBox(stairs, STAIRS.hw * 2 + 0.2, Math.max(0.2, top - 1.5), (STAIRS.z0 - STAIRS.z1) / n + 0.02, blockMat('cobble'), STAIRS.x, (top + 1.5) / 2, z, { tile: 0.5 });
  }
  mergeStatic(stairs);
  stairs.visible = false;
  stairs.userData.dynamic = true;
  g.add(stairs);
  // Fallen rocks where the stairs will be: the Stone spell clears them.
  const rockfall = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const t = (i % 3) / 2, row = Math.floor(i / 3);
    const s = 0.7 + ((i * 37) % 10) / 25;
    const b = new THREE.Mesh(BOX, mat(i % 2 ? 0x8d8a86 : 0x77736e));
    b.scale.set(s, s * 0.8, s);
    b.position.set(STAIRS.x + (t - 0.5) * 1.6, ctx.stairsY(STAIRS.z0 - 0.6) - 0.6 + row * 0.55, STAIRS.z0 - 0.4 - row * 0.5);
    b.rotation.y = i * 0.7;
    b.castShadow = true;
    rockfall.add(b);
  }
  mergeStatic(rockfall);
  rockfall.userData.dynamic = true;
  g.add(rockfall);
  return { group: g, stairs, book, rockfall };
}

function letterTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#fbf6ea'; x.fillRect(0, 0, 256, 256);
  x.fillStyle = 'rgba(60, 50, 90, 0.55)';
  x.font = '700 22px Georgia, serif';
  const words = ['lune', 'pont', 'ami', 'chat', 'école', 'bateau', 'maman', 'soleil', 'fleur', 'livre', 'rêve', 'mot'];
  for (let row = 0; row < 11; row++) x.fillText(Array.from({ length: 3 }, (_, k) => words[(row * 3 + k * 5) % words.length]).join('  '), 8, 22 + row * 23);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildCoast(ctx) {
  const g = new THREE.Group();
  const rnd = seededRandom(77);
  // The sea.
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(200, 40), ctx.seaMat);
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(0, 0.04, SEA_Z + 20);
  g.add(sea);
  ctx.collidables.push({ rect: true, water: true, x0: -100, x1: 100, z0: SEA_Z, z1: 120 });
  // Beach rocks and tufts of dune grass.
  const rocks = [], tufts = [];
  for (let i = 0; i < 120; i++) {
    const x = (rnd() - 0.5) * 80, z = 52 + rnd() * 18;
    if (Math.hypot(x, z) > WORLD_RADIUS - 1 || Math.abs(x) < 3 || Math.hypot(x - LIGHTHOUSE.x, z - LIGHTHOUSE.z) < 3 || Math.abs(x - PIER.x) < 1.5) continue;
    if (rnd() < 0.3) { const s = 0.4 + rnd() * 0.8; rocks.push([x, s * 0.3, z, s, s * 0.6, s * 0.8, rnd() * 3]); ctx.collidables.push({ x, z, r: s * 0.45 }); }
    else tufts.push([x, 0.2, z, 0.08, 0.4 + rnd() * 0.3, 0.5, rnd() * 3]);
  }
  instanced(g, mat(0x9a9590), rocks);
  instanced(g, mat(0x9ab05a), tufts, { cast: false });
  // The pier (walkable along z).
  const planks = [], posts = [];
  for (let z = PIER.z0; z < PIER.z1; z += 0.5) {
    planks.push([PIER.x, 0.22, z + 0.25, PIER.hw * 2, 0.08, 0.46]);
    if (Math.round(z * 2) % 4 === 0) for (const s of [-1, 1]) posts.push([PIER.x + s * (PIER.hw + 0.06), 0.1, z + 0.25, 0.16, 0.6, 0.16]);
  }
  instanced(g, mat(0x9a7a54), planks, { cast: false });
  instanced(g, mat(0x5a3a22), posts, { cast: false });
  // The lighthouse: red and white rings, a lamp room on top (lit by the Light spell).
  const lh = new THREE.Group();
  lh.position.set(LIGHTHOUSE.x, 0, LIGHTHOUSE.z);
  for (let k = 0; k < 8; k++) {
    const r = 1.5 - k * 0.08;
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(r - 0.04, r, 0.8, 10), mat(k % 2 ? 0xffffff : 0xd8372d));
    ring.position.y = 0.4 + k * 0.8; ring.castShadow = true; lh.add(ring);
  }
  const room = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.9, 10), mat(0x2a2a30)); room.position.y = 6.9; lh.add(room);
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.75, 10), mat(0xfff4c0, { emissive: 0xffe08a, emissiveIntensity: 3 }));
  lamp.position.y = 6.9; lamp.visible = false; lh.add(lamp);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.9, 10), mat(0xd8372d)); roof.position.y = 7.8; lh.add(roof);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(1.4, 9, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }));
  beam.rotation.z = Math.PI / 2; beam.position.set(4.5, 0, 0);
  const beamPivot = new THREE.Group(); beamPivot.position.y = 6.9; beamPivot.add(beam); beamPivot.visible = false; lh.add(beamPivot);
  lh.userData.dynamic = true;
  g.add(lh);
  ctx.collidables.push({ x: LIGHTHOUSE.x, z: LIGHTHOUSE.z, r: 1.6 });
  // A rowing boat on the sand.
  const boat = new THREE.Group();
  boat.position.set(-4, 0, 63); boat.rotation.y = 0.6;
  const hull = new THREE.Mesh(BOX, mat(0x8a5a32)); hull.scale.set(1.0, 0.4, 2.4); hull.position.y = 0.2; boat.add(hull);
  const inside = new THREE.Mesh(BOX, mat(0x6a4422)); inside.scale.set(0.8, 0.1, 2.1); inside.position.y = 0.36; boat.add(inside);
  g.add(boat);
  ctx.collidables.push({ x: -4, z: 63, r: 1.1 });
  // The paper island: a page of the big book floating on the sea.
  const isl = new THREE.Group();
  isl.position.set(ISLAND.x, 0, ISLAND.z);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(ISLAND.r, ISLAND.r + 0.3, 0.5, 14), mat(0xece4d0));
  base.position.y = 0.05; isl.add(base);
  const top = new THREE.Mesh(new THREE.CircleGeometry(ISLAND.r - 0.05, 14), new THREE.MeshStandardMaterial({ map: letterTexture(), roughness: 0.9 }));
  top.rotation.x = -Math.PI / 2; top.position.y = 0.31; isl.add(top);
  // Floating letter blocks around it.
  const letters = 'MOTSLIVRE';
  [...letters].forEach((ch, i) => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'); x.fillStyle = '#fffaf0'; x.fillRect(0, 0, 64, 64); x.fillStyle = '#4a3a8a'; x.font = '900 46px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, 32, 36);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
    const b = new THREE.Mesh(BOX, new THREE.MeshStandardMaterial({ map: tx, emissive: 0x6a5aaa, emissiveIntensity: 0.15 }));
    const a = (i / letters.length) * Math.PI * 2;
    b.scale.setScalar(0.45); b.position.set(Math.cos(a) * (ISLAND.r + 1.2), 1.2 + (i % 3) * 0.3, Math.sin(a) * (ISLAND.r + 1.2));
    b.userData.float = { a, i };
    isl.add(b);
  });
  isl.userData.dynamic = true;
  g.add(isl);
  return { group: g, lamp, beamPivot, island: isl };
}

/* ===== Lava parkour (north-east) ===== */
// The lava pool and the pillars to jump on: [x, z, size, top height, role].
// Gaps grow from 0.8 to 1.8 blocks; the hero's jump carries about 2.8 blocks.
export const LAVA = {
  x0: 26, x1: 40, z0: -59, z1: -39,
  start: { x: 29, z: -37.4 },
  exit: { x: 36.8, z: -60.4 },
  // Easy on purpose (children found the first version too hard): wide pillars (3 blocks), short
  // gaps (≤ 1 block), all at the same height, and a flag every two pillars.
  pillars: [
    [29, -40.9, 3.0, 0.6],
    [29, -44.9, 3.0, 0.6, 'cp1'],
    [32.9, -44.9, 3.0, 0.6],
    [36.8, -44.9, 3.0, 0.6, 'cp2'],
    [36.8, -48.8, 3.0, 0.6],
    [36.8, -52.7, 3.0, 0.6, 'cp3'],
    [36.8, -56.6, 3.0, 0.6, 'finish'],
  ],
};
export const LAVA_FLAGS = ['cp1', 'cp2', 'cp3'];

function lavaTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  const rnd = seededRandom(5);
  for (let i = 0; i < 64; i++) for (let j = 0; j < 64; j++) {
    const v = rnd();
    x.fillStyle = v > 0.82 ? '#ffe066' : v > 0.5 ? '#ff8a1e' : v > 0.2 ? '#f0561a' : '#c8320f';
    x.fillRect(i, j, 1, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 6);
  return t;
}

export function buildLavaCourse(ctx) {
  const g = new THREE.Group();
  const tex = lavaTexture();
  const lavaMat = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xff5a14, emissiveMap: tex, emissiveIntensity: 1.1, roughness: 0.6 });
  const lava = new THREE.Mesh(new THREE.PlaneGeometry(LAVA.x1 - LAVA.x0, LAVA.z1 - LAVA.z0), lavaMat);
  lava.rotation.x = -Math.PI / 2;
  lava.position.set((LAVA.x0 + LAVA.x1) / 2, 0.06, (LAVA.z0 + LAVA.z1) / 2);
  lava.userData.dynamic = true;
  g.add(lava);
  // Basalt rim around the pool (open at the start and at the exit).
  const rim = [];
  for (let x = LAVA.x0 - 0.5; x <= LAVA.x1 + 0.5; x += 1) {
    if (Math.abs(x - LAVA.start.x) > 2.2) rim.push([x, 0.2, LAVA.z1 + 0.5, 1, 0.4, 1]);
    if (Math.abs(x - LAVA.exit.x) > 1.8) rim.push([x, 0.2, LAVA.z0 - 0.5, 1, 0.4, 1]);
  }
  for (let z = LAVA.z0 + 0.5; z < LAVA.z1; z += 1) { rim.push([LAVA.x0 - 0.5, 0.2, z, 1, 0.4, 1]); rim.push([LAVA.x1 + 0.5, 0.2, z, 1, 0.4, 1]); }
  instanced(g, mat(0x2e2a30), rim, { cast: false });
  // Pillars: basalt columns with a stone top.
  const cols = [], tops = [], marks = [];
  for (const [x, z, s, h, role] of LAVA.pillars) {
    cols.push([x, (h - 0.06) / 2, z, s * 0.92, h - 0.06, s * 0.92]);
    tops.push([x, h - 0.04, z, s, 0.1, s]);
    if (role) marks.push([x, h + 0.025, z, s * 0.6, 0.02, s * 0.6]);
  }
  instanced(g, mat(0x3a3438), cols);
  instanced(g, mat(0x8a8590), tops, { cast: false });
  instanced(g, mat(0xf2c84b, { emissive: 0xf2c84b, emissiveIntensity: 0.3 }), marks, { cast: false });
  // Checkpoint flags (grey until reached) and the finish flag.
  const flags = {};
  for (const [x, z, s, h, role] of LAVA.pillars) {
    if (!role) continue;
    const f = new THREE.Group();
    f.position.set(x + s / 2 - 0.25, h, z - s / 2 + 0.25);
    const pole = new THREE.Mesh(BOX, mat(0xdddddd)); pole.scale.set(0.07, 1.6, 0.07); pole.position.y = 0.8; f.add(pole);
    const cloth = new THREE.Mesh(BOX, new THREE.MeshStandardMaterial({ color: role === 'finish' ? 0xffd34a : 0x9a9aa6 }));
    cloth.scale.set(0.6, 0.38, 0.04); cloth.position.set(0.32, 1.38, 0); f.add(cloth);
    f.userData.cloth = cloth;
    f.userData.dynamic = true;
    g.add(f);
    flags[role] = f;
  }
  // Start: a stone pad and stairs-free entrance; exit ramp appears once the course is won.
  texBox(g, 4.2, 0.12, 2.8, blockMat('stoneBricks'), LAVA.start.x, 0.06, LAVA.start.z, { tile: 0.5 });
  const exitRamp = new THREE.Group();
  const fin = LAVA.pillars.find((pp) => pp[4] === 'finish');
  const zEdge = fin[1] - fin[2] / 2;
  for (let k = 0; k < 4; k++) texBox(exitRamp, 1.6, fin[3] - k * 0.15, 0.62, blockMat('stoneBricks'), LAVA.exit.x, (fin[3] - k * 0.15) / 2, zEdge - 0.31 - k * 0.62, { tile: 0.5 });
  exitRamp.visible = false;
  exitRamp.userData.dynamic = true;
  g.add(exitRamp);
  return { group: g, lavaTex: tex, flags, exitRamp };
}
