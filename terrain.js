import * as THREE from 'three';
import { seededRandom } from './interiors.js';

// Terraced voxel hills around the village (half-block layers). The village centre stays flat.
// Walking up one layer (0.5) is automatic; a full block or more needs a jump.

export const LAYER = 0.5;
export const STEP_UP = 0.55;
const SIZE = 104; // cells per side, 1 unit each, centred on the origin
const HALF = SIZE / 2;

function valueNoise(seed) {
  const rnd = seededRandom(seed);
  const g = new Float32Array(64 * 64).map(() => rnd());
  const at = (x, y) => g[((y & 63) * 64) + (x & 63)];
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}

function pixelTex(draw) {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  draw(c.getContext('2d'));
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestMipmapLinearFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class Terrain {
  constructor(scene, ctx) {
    this.scene = scene;
    this.ctx = ctx; // { flat(x, z) -> true where the ground must stay at 0 }
    this.h = new Float32Array(SIZE * SIZE);
    this.quarry = { x: 20, z: -20, r: 3.2, level: 1.0 };
  }

  heightAt(x, z) {
    const i = Math.floor(x + HALF);
    const j = Math.floor(z + HALF);
    if (i < 0 || j < 0 || i >= SIZE || j >= SIZE) return 0;
    return this.h[j * SIZE + i];
  }

  generate() {
    const n1 = valueNoise(7);
    const n2 = valueNoise(13);
    const q = this.quarry;
    for (let j = 0; j < SIZE; j++) {
      for (let i = 0; i < SIZE; i++) {
        const x = i - HALF + 0.5;
        const z = j - HALF + 0.5;
        const r = Math.hypot(x, z);
        let raw = 0;
        if (r > 21 && r < 40) {
          raw = (r - 21) * 0.16 + n1(x * 0.12, z * 0.12) * 2.2 + n2(x * 0.3, z * 0.3) * 0.6 - 1.0;
        }
        // A rocky hill behind the quarry, north-east.
        const dm = Math.hypot(x - (q.x + 4), z - (q.z - 4));
        raw += Math.max(0, 1 - dm / 9) * 4.2;
        // Quarry floor: a flat terrace cut into the hill.
        const dq = Math.hypot(x - q.x, z - q.z);
        if (dq < q.r) raw = q.level;
        if (this.ctx.flat(x, z)) raw = 0;
        this.h[j * SIZE + i] = Math.max(0, Math.min(6, Math.floor(raw / LAYER) * LAYER));
      }
    }
    // Never more than half a block between neighbours, so you can always walk back to the
    // village (jumping is for fun, never required). Repeat until nothing changes.
    for (let pass = 0; pass < 40; pass++) {
      let changed = false;
      for (let j = 0; j < SIZE; j++) {
        for (let i = 0; i < SIZE; i++) {
          const k = j * SIZE + i;
          let m = Infinity;
          if (i > 0) m = Math.min(m, this.h[k - 1]);
          if (i < SIZE - 1) m = Math.min(m, this.h[k + 1]);
          if (j > 0) m = Math.min(m, this.h[k - SIZE]);
          if (j < SIZE - 1) m = Math.min(m, this.h[k + SIZE]);
          if (this.h[k] > m + LAYER) { this.h[k] = m + LAYER; changed = true; }
        }
      }
      if (!changed) break;
    }
    // Soften single-cell spikes so hills read as terraces.
    const copy = this.h.slice();
    for (let j = 1; j < SIZE - 1; j++) {
      for (let i = 1; i < SIZE - 1; i++) {
        const k = j * SIZE + i;
        const nb = [copy[k - 1], copy[k + 1], copy[k - SIZE], copy[k + SIZE]];
        const maxN = Math.max(...nb);
        if (copy[k] > maxN) this.h[k] = maxN;
      }
    }
  }

  build() {
    this.generate();
    const grassTop = pixelTex((g) => {
      const r = seededRandom(31);
      const pal = ['#5f9e3e', '#5a9639', '#67a843', '#6fae48', '#548e35', '#7bb84f'];
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { g.fillStyle = pal[Math.floor(r() * pal.length)]; g.fillRect(x, y, 1, 1); }
    });
    const dirtPal = ['#8a6440', '#7d5a39', '#956e48', '#6e4f33', '#a07a52'];
    const grassSide = pixelTex((g) => {
      const r = seededRandom(32);
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { g.fillStyle = dirtPal[Math.floor(r() * dirtPal.length)]; g.fillRect(x, y, 1, 1); }
      const pal = ['#5f9e3e', '#67a843', '#548e35'];
      for (let x = 0; x < 16; x++) {
        const d = 3 + Math.floor(r() * 3);
        for (let y = 0; y < d; y++) { g.fillStyle = pal[Math.floor(r() * pal.length)]; g.fillRect(x, y, 1, 1); }
      }
    });
    const dirt = pixelTex((g) => {
      const r = seededRandom(33);
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { g.fillStyle = dirtPal[Math.floor(r() * dirtPal.length)]; g.fillRect(x, y, 1, 1); }
      g.fillStyle = '#8d8a86'; g.fillRect(3, 9, 2, 2); g.fillRect(11, 4, 2, 1);
    });
    const stone = pixelTex((g) => {
      const r = seededRandom(34);
      const pal = ['#8d8a86', '#7f7c78', '#9a9792', '#75726e'];
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { g.fillStyle = pal[Math.floor(r() * pal.length)]; g.fillRect(x, y, 1, 1); }
    });

    // Face meshing: only the faces you can see (each cell's top, plus the cliff sides where
    // the neighbour is lower), grouped into one mesh per material — a few draw calls in total.
    const mats = {
      grassTop: new THREE.MeshStandardMaterial({ map: grassTop, roughness: 0.95 }),
      grassSide: new THREE.MeshStandardMaterial({ map: grassSide, roughness: 0.95 }),
      dirt: new THREE.MeshStandardMaterial({ map: dirt, roughness: 1 }),
      stone: new THREE.MeshStandardMaterial({ map: stone, roughness: 1 }),
    };
    for (const m of Object.values(mats)) { m.map.wrapS = THREE.RepeatWrapping; m.map.wrapT = THREE.RepeatWrapping; }
    const buf = { grassTop: [], grassSide: [], dirt: [], stone: [] };
    const quad = (key, a, b, c, d, n, uw, vh) => {
      // a,b,c,d counter-clockwise seen from the normal side
      const B = buf[key];
      B.push([a, b, c, d, n, uw, vh]);
    };
    const q = this.quarry;
    const H = (i, j) => (i < 0 || j < 0 || i >= SIZE || j >= SIZE ? 0 : this.h[j * SIZE + i]);
    let faces = 0;
    for (let j = 0; j < SIZE; j++) {
      for (let i = 0; i < SIZE; i++) {
        const hgt = this.h[j * SIZE + i];
        if (hgt <= 0) continue;
        const x0 = i - HALF, z0 = j - HALF, x1 = x0 + 1, z1 = z0 + 1;
        const rocky = Math.hypot(x0 + 0.5 - (q.x + 4), z0 + 0.5 - (q.z - 4)) < 8.5 || Math.hypot(x0 + 0.5 - q.x, z0 + 0.5 - q.z) < q.r + 0.5;
        quad(rocky ? 'stone' : 'grassTop', [x0, hgt, z1], [x1, hgt, z1], [x1, hgt, z0], [x0, hgt, z0], [0, 1, 0], 1, 1);
        faces++;
        const sides = [
          [H(i, j + 1), [x0, z1], [x1, z1], [0, 0, 1]],
          [H(i + 1, j), [x1, z1], [x1, z0], [1, 0, 0]],
          [H(i, j - 1), [x1, z0], [x0, z0], [0, 0, -1]],
          [H(i - 1, j), [x0, z0], [x0, z1], [-1, 0, 0]],
        ];
        for (const [nh, [ax, az], [bx, bz], n] of sides) {
          if (nh >= hgt) continue;
          // Top band: grass-edged side; below: dirt (or stone on the quarry hill).
          const band = Math.min(LAYER, hgt - nh);
          quad(rocky ? 'stone' : 'grassSide', [ax, hgt - band, az], [bx, hgt - band, bz], [bx, hgt, bz], [ax, hgt, az], n, 1, band / LAYER);
          if (hgt - band > nh) {
            quad(rocky ? 'stone' : 'dirt', [ax, nh, az], [bx, nh, bz], [bx, hgt - band, bz], [ax, hgt - band, az], n, 1, (hgt - band - nh) / LAYER);
          }
          faces++;
        }
      }
    }
    for (const [key, quads] of Object.entries(buf)) {
      if (!quads.length) continue;
      const pos = new Float32Array(quads.length * 18);
      const nor = new Float32Array(quads.length * 18);
      const uv = new Float32Array(quads.length * 12);
      quads.forEach(([a, b, c, d, n, uw, vh], k) => {
        const verts = [a, b, c, a, c, d];
        const uvs = [[0, 0], [uw, 0], [uw, vh], [0, 0], [uw, vh], [0, vh]];
        verts.forEach((v, m) => {
          pos.set(v, k * 18 + m * 3);
          nor.set(n, k * 18 + m * 3);
          uv.set(uvs[m], k * 12 + m * 2);
        });
      });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      const mesh = new THREE.Mesh(geo, mats[key]);
      mesh.receiveShadow = true;
      mesh.userData.dynamic = true;
      this.scene.add(mesh);
    }
    this.faceCount = faces;
  }
}
