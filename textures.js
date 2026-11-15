import * as THREE from 'three';
import { seededRandom } from './interiors.js';

// 16×16 pixel "block" textures, drawn once on canvases and shown with nearest filtering,
// plus boxes whose UVs are scaled to world size so a texture tile keeps the same size everywhere.

const S = 16;
const cache = new Map();

function makeTexture(key, draw) {
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d');
  draw(g, seededRandom(hash(key)));
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestMipmapLinearFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

const col = (hex, k = 1) => `#${new THREE.Color(hex).multiplyScalar(k).getHexString()}`;
const px = (g, x, y, c, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
function noise(g, base, amt, rnd, x0 = 0, y0 = 0, w = S, h = S) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) px(g, x, y, col(base, 1 + (rnd() - 0.5) * amt));
}

// Horizontal boards, 4 px high, with seams and staggered end joints.
function planks(base) {
  return (g, rnd) => {
    noise(g, base, 0.16, rnd);
    for (let row = 0; row < 4; row++) {
      const y = row * 4;
      px(g, 0, y + 3, col(base, 0.62), S, 1);
      const joint = (row * 7 + 3) % S;
      px(g, joint, y, col(base, 0.62), 1, 3);
      // Grain streaks.
      for (let i = 0; i < 3; i++) px(g, Math.floor(rnd() * 14), y + 1 + Math.floor(rnd() * 2), col(base, 0.85), 2, 1);
    }
  };
}

// Vertical bark stripes for logs.
function logSide(base) {
  return (g, rnd) => {
    noise(g, base, 0.18, rnd);
    for (let x = 0; x < S; x += 3 + Math.floor(rnd() * 2)) {
      for (let y = 0; y < S; y++) if (rnd() > 0.25) px(g, x, y, col(base, 0.7));
    }
  };
}

function cobble(base) {
  return (g, rnd) => {
    noise(g, base, 0.1, rnd);
    px(g, 0, 0, col(base, 0.55), S, S);
    // Irregular stones packed together.
    const stones = [[0, 0, 6, 5], [6, 0, 5, 4], [11, 0, 5, 6], [0, 5, 4, 5], [4, 4, 7, 5], [11, 6, 5, 4], [0, 10, 6, 6], [6, 9, 5, 7], [11, 10, 5, 6]];
    for (const [x, y, w, h] of stones) {
      const k = 0.85 + rnd() * 0.35;
      noise(g, base, 0.18, rnd, x, y, w - 1, h - 1);
      px(g, x, y, col(base, k * 1.15), w - 1, 1);
      px(g, x + w - 2, y, col(base, 0.75), 1, h - 1);
    }
  };
}

function stoneBricks(base, mossy = false) {
  return (g, rnd) => {
    noise(g, base, 0.12, rnd);
    const mortar = col(base, 0.6);
    for (let row = 0; row < 4; row++) {
      const y = row * 4;
      px(g, 0, y + 3, mortar, S, 1);
      const off = row % 2 ? 4 : 0;
      for (let x = off; x < S + 8; x += 8) px(g, x % S, y, mortar, 1, 3);
      px(g, 0, y, col(base, 1.12), S, 1);
    }
    if (mossy) for (let i = 0; i < 26; i++) px(g, Math.floor(rnd() * S), Math.floor(rnd() * S), rnd() > 0.5 ? '#5e8a3a' : '#4a7a30');
  };
}

function bricks(base) {
  return (g, rnd) => {
    px(g, 0, 0, '#cfc6b6', S, S);
    for (let row = 0; row < 4; row++) {
      const y = row * 4;
      const off = row % 2 ? 4 : 0;
      for (let x = -8 + off; x < S; x += 8) {
        noise(g, base, 0.2, rnd, Math.max(0, x), y, Math.min(7, S - Math.max(0, x), x + 7), 3);
      }
    }
  };
}

function plaster(base) {
  return (g, rnd) => {
    noise(g, base, 0.05, rnd);
    for (let i = 0; i < 6; i++) px(g, Math.floor(rnd() * S), Math.floor(rnd() * S), col(base, 0.93), 2, 1);
  };
}

// Overlapping roof tiles: rows of tiles, each with a dark lower edge.
function shingles(base) {
  return (g, rnd) => {
    noise(g, base, 0.14, rnd);
    for (let row = 0; row < 4; row++) {
      const y = row * 4;
      px(g, 0, y + 3, col(base, 0.6), S, 1);
      px(g, 0, y, col(base, 1.15), S, 1);
      const off = row % 2 ? 2 : 0;
      for (let x = off; x < S; x += 4) px(g, x, y, col(base, 0.7), 1, 3);
    }
  };
}

function thatch(base) {
  return (g, rnd) => {
    noise(g, base, 0.2, rnd);
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(rnd() * S);
      const y = Math.floor(rnd() * S);
      px(g, x, y, col(base, rnd() > 0.5 ? 0.72 : 1.2), 1, 3);
    }
    for (let row = 0; row < 4; row++) px(g, 0, row * 4 + 3, col(base, 0.7), S, 1);
  };
}

export const BLOCKS = {
  oakPlanks: () => makeTexture('oakPlanks', planks(0xb08850)),
  sprucePlanks: () => makeTexture('sprucePlanks', planks(0x7a5432)),
  birchPlanks: () => makeTexture('birchPlanks', planks(0xd8c88e)),
  darkOakPlanks: () => makeTexture('darkOakPlanks', planks(0x4e3420)),
  oakLog: () => makeTexture('oakLog', logSide(0x6b4e2e)),
  spruceLog: () => makeTexture('spruceLog', logSide(0x3e2a18)),
  birchLog: () => makeTexture('birchLog', (g, rnd) => {
    noise(g, 0xe8e4d8, 0.06, rnd);
    for (let i = 0; i < 10; i++) px(g, Math.floor(rnd() * S), Math.floor(rnd() * S), '#2a2622', 2 + Math.floor(rnd() * 2), 1);
  }),
  cobble: () => makeTexture('cobble', cobble(0x8a8a8a)),
  mossyCobble: () => makeTexture('mossyCobble', (g, rnd) => {
    cobble(0x8a8a8a)(g, rnd);
    for (let i = 0; i < 30; i++) px(g, Math.floor(rnd() * S), Math.floor(rnd() * S), rnd() > 0.5 ? '#5e8a3a' : '#4a7a30');
  }),
  stoneBricks: () => makeTexture('stoneBricks', stoneBricks(0x9a9a9a)),
  mossyStoneBricks: () => makeTexture('mossyStoneBricks', stoneBricks(0x9a9a9a, true)),
  bricks: () => makeTexture('bricks', bricks(0xa8483a)),
  plaster: () => makeTexture('plaster', plaster(0xf1e8d6)),
  roofRed: () => makeTexture('roofRed', shingles(0xa8402e)),
  roofBlue: () => makeTexture('roofBlue', shingles(0x3e5f98)),
  roofGreen: () => makeTexture('roofGreen', shingles(0x3f7a44)),
  roofSlate: () => makeTexture('roofSlate', shingles(0x4a4e58)),
  roofPurple: () => makeTexture('roofPurple', shingles(0x6a4aa8)),
  roofBrown: () => makeTexture('roofBrown', shingles(0x6a4428)),
  thatch: () => makeTexture('thatch', thatch(0xc9a24a)),
};

const matCache = new Map();
export function blockMat(name, extra = {}) {
  const key = `${name}|${JSON.stringify(extra)}`;
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ map: BLOCKS[name](), roughness: 0.9, ...extra }));
  return matCache.get(key);
}

// Box with UVs scaled so one texture tile covers `tile` world units on every face.
const geoCache = new Map();
export function texturedBoxGeometry(w, h, d, tile = 1) {
  const key = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}|${tile}`;
  if (geoCache.has(key)) return geoCache.get(key);
  const geo = new THREE.BoxGeometry(w, h, d);
  const uv = geo.attributes.uv;
  // Face order: +x, -x, +y, -y, +z, -z (4 vertices each).
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    const [fu, fv] = dims[f];
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      uv.setXY(i, uv.getX(i) * fu / tile, uv.getY(i) * fv / tile);
    }
  }
  geoCache.set(key, geo);
  return geo;
}

export function texBox(parent, w, h, d, mat, x, y, z, o = {}) {
  const m = new THREE.Mesh(texturedBoxGeometry(w, h, d, o.tile ?? 0.8), mat);
  m.position.set(x, y, z);
  if (o.ry) m.rotation.y = o.ry;
  if (o.rx) m.rotation.x = o.rx;
  if (o.rz) m.rotation.z = o.rz;
  m.castShadow = o.cast !== false;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
