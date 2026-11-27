// The mine world (J8, v1.26.1): loaded apart from the island (worlds.js) when the cart rolls into the
// mouth of the mine. Rock tunnels lit by lanterns, wooden frames, glowing mushrooms, crystals in the
// walls. The cart rides on its own (the hero stands in it, the dog at the front) and stops at
// barriers: spelling the word opens them (spelling only, no reading choices).
// Line 1: three barriers, the bats' cave ("Hiii!"), a fast descent, a bridge over the glowing
// underground lake, the diamond cave (a word fills the cart with diamonds), the lift back up.
// Line 2: a barrier, the big jump over the chasm in slow motion (gold nuggets in the air), more nuggets
// along the walls, a second barrier, the crystal cave (a word for a crystal), the lift back up.
// Built in pieces of about 30 m (merged vertex-coloured meshes), well inside the iPad budget.
import * as THREE from 'three';
import { box, beam, merge, MAT, colorize, samplePath, posAt, dirAt, buildCart, setCartGold, placeCart, seatDog, seatHero, WOOD, WOOD_D, RAIL, NUGGETS } from './mine.js';
import { disposeTree } from './worlds.js';

// Far from the island (nothing of it can be seen or touched from down here).
export const MINE_ORIGIN = new THREE.Vector3(900, 0, 900);
const W0 = 2.1, H0 = 4.0, F0 = 0.3, CHUNK = 30;
const UP = new THREE.Vector3(0, 1, 0);

// The two lines: control points [x, y, z] in metres from the bottom of the entrance, and what is
// where (by control point).
export const LINES = [
  {
    // Line 1: the diamonds.
    pts: [[0, 0, 0], [8, -1.2, 0.5], [16, -3.2, -1], [24, -4, -3], [32, -4, -6], [38, -4.2, -12], [42, -4.4, -20], [44, -4.4, -28], [43, -4.6, -36], [38, -4.6, -42], [30, -5.6, -46], [22, -8, -48], [14, -8.6, -48], [4, -8.6, -47], [-6, -8.6, -45], [-14, -8.4, -41], [-20, -8.2, -34], [-23, -8, -26], [-24, -8, -16], [-23, -8, -8], [-21, -8, -2]],
    barriers: [3, 9, 15],
    rooms: [{ at: 7, len: 6, w: 2.3, h: 1.7, kind: 'bats' }, { from: 12, to: 14, w: 2.7, h: 1.8, floor: 5.5, kind: 'lake' }, { at: 18, len: 5, w: 2.8, h: 2.1, kind: 'gems' }],
    descent: 10, end: 18, lift: 20, gems: [0x3ad8e0, 0x7ae8f0, 0x2ab0c8, 0x9af0ff], light: 0x4ad8f0,
  },
  {
    // Line 2: the crystal cave, with the big jump.
    pts: [[0, 0, 0], [8, -1.2, -0.5], [16, -3.2, 1], [24, -4, 3], [32, -3.2, 5], [40, -1.6, 5], [54, -1.6, 5], [62, -2.4, 3], [68, -3.2, -3], [71, -3.6, -11], [70, -4, -19], [65, -4.4, -26], [58, -4.6, -30], [50, -4.6, -32], [42, -4.6, -32], [34, -4.6, -31], [28, -4.6, -29]],
    barriers: [3, 10],
    gap: [5, 6],
    rooms: [{ from: 5, to: 6, pad: 2.5, w: 2.6, h: 2.0, floor: 14, kind: 'chasm' }, { at: 14, len: 5, w: 2.8, h: 2.1, kind: 'gems' }],
    end: 14, lift: 16, gems: [0xff8ae0, 0xc08aff, 0xffc0f0, 0x9a6aff], light: 0xff7ad8,
  },
];

const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const smooth = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
// 1 inside [a, b], easing to 0 within r metres outside.
const edge = (s, a, b, r = 3) => (s >= a && s <= b ? 1 : smooth(1 - (s < a ? a - s : s - b) / r));
const ROCKS = [0x6b5e52, 0x5d5148, 0x77695b, 0x54493f, 0x83725f, 0x6e6458];
const FLOORS = [0x3e3631, 0x4a413a, 0x443b34];

export class MineWorld {
  constructor(scene3D, { line = 0, gold = false } = {}) {
    this.s = scene3D;
    this.id = 'mine';
    this.line = line;
    this.def = LINES[line];
    this.gold = gold;
    this.root = new THREE.Group();
    this.lights = [];
    this.objs = [];
    this.t = 0;
    this.ride = null;
    this.batT = -1;
    this.env = { bg: 0x0d0a08, fog: 0x0d0a08, near: 8, far: 36, ambient: 0.55, ambientColor: 0xffe2c4, hemi: 0.4, hemiSky: 0x9a8a7a, hemiGround: 0x2a2018, sun: 0, fov: 58 };
  }
  get riding() { return !!this.ride; }
  get speedK() { return this.s.mine?.speedK ?? 1; }

  // ===== Building =====
  build() {
    const D = this.def;
    const curve = new THREE.CatmullRomCurve3(D.pts.map(([x, y, z]) => new THREE.Vector3(x, y, z).add(MINE_ORIGIN)), false, 'centripetal');
    const n = Math.ceil(curve.getLength() / 0.5);
    this.path = samplePath(curve.getSpacedPoints(n));
    const L = this.path;
    const sOf = (i) => { const c = new THREE.Vector3(...D.pts[i]).add(MINE_ORIGIN); let best = 0, bd = 1e9; L.pts.forEach((p, k) => { const d = p.distanceToSquared(c); if (d < bd) { bd = d; best = L.cum[k]; } }); return best; };
    this.sOf = sOf;
    this.rooms = D.rooms.map((r) => (r.at !== undefined ? { ...r, a: sOf(r.at) - r.len, b: sOf(r.at) + r.len } : { ...r, a: sOf(r.from) - (r.pad ?? 0), b: sOf(r.to) + (r.pad ?? 0) }));
    this.gap = D.gap ? { s0: sOf(D.gap[0]) + 0.3, s1: sOf(D.gap[1]) - 0.3 } : null;
    this.barrierS = D.barriers.map(sOf);
    this.endS = sOf(D.end);
    this.liftS = Math.min(L.len - 1.6, sOf(D.lift));
    this.descentS = D.descent !== undefined ? sOf(D.descent) : null;
    this.lake = this.rooms.find((r) => r.kind === 'lake') ?? null;
    this.batsRoom = this.rooms.find((r) => r.kind === 'bats') ?? null;
    this.startS = 5;
    this.stops = [...this.barrierS.map((s, k) => ({ s: s - 2.6, type: 'barrier', k })), { s: this.endS, type: 'end' }, { s: this.liftS, type: 'lift' }].sort((a, b) => a.s - b.s);

    this.detail = new Map(); // chunk → geometries (wood, rails, rock bits)
    this.glow = []; // lanterns and mushrooms (unlit, they shine)
    this.gemGeos = [];
    this._walls();
    this._track();
    this._frames();
    this._rooms();
    this._mushroomsAndCrystals();
    for (const [, geos] of this.detail) {
      const m = new THREE.Mesh(merge(geos), MAT({ roughness: 0.85 }));
      this._static(m);
    }
    if (this.glow.length) this._static(new THREE.Mesh(merge(this.glow), new THREE.MeshBasicMaterial({ vertexColors: true })));
    if (this.gemGeos.length) {
      this.gemMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.25, metalness: 0.1, emissive: this.def.light, emissiveIntensity: 0.28, flatShading: true });
      this._static(new THREE.Mesh(merge(this.gemGeos), this.gemMat));
    }
    this._barriers();
    this._lift();
    // The cart, its load of diamonds or crystals (shown after the word at the cave), bats, nuggets.
    this.cartMat = MAT({ roughness: 0.55, metalness: 0.25 });
    setCartGold(this.cartMat, this.gold);
    this.cart = buildCart(this.cartMat);
    this.root.add(this.cart);
    const load = [];
    for (let i = 0; i < 9; i++) {
      const g = new THREE.OctahedronGeometry(0.16 + (i % 3) * 0.04, 0).toNonIndexed();
      g.scale(1, 1.5, 1); g.rotateZ((i % 4) * 0.4 - 0.6);
      g.translate(((i % 3) - 1) * 0.3, 0.92 + (i % 2) * 0.08, (Math.floor(i / 3) - 1) * 0.36);
      load.push(colorize(g, this.def.gems[i % this.def.gems.length]));
    }
    this.cartLoad = new THREE.Mesh(merge(load), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.2, emissive: this.def.light, emissiveIntensity: 0.6, flatShading: true }));
    this.cartLoad.visible = false;
    this.cart.add(this.cartLoad);
    this.bats = new THREE.InstancedMesh(batGeo(), MAT({ roughness: 0.9 }), 10);
    this.bats.frustumCulled = false; this.bats.visible = false;
    this.root.add(this.bats);
    this._d = new THREE.Object3D();
    if (this.line === 1) this._nuggets();
  }
  _static(m) {
    m.castShadow = false; m.receiveShadow = false;
    m.matrixAutoUpdate = false; m.updateMatrix();
    this.root.add(m);
    return m;
  }
  _add(s, g) { const k = Math.floor(s / CHUNK); if (!this.detail.has(k)) this.detail.set(k, []); this.detail.get(k).push(g); }
  // The shape of the tunnel at s: width and height factors, depth of the floor below the rails.
  _prof(s) {
    let w = 1, h = 1, f = F0;
    for (const r of this.rooms) {
      const e = edge(s, r.a, r.b, 3.5);
      if (!e) continue;
      w = Math.max(w, 1 + (r.w - 1) * e); h = Math.max(h, 1 + (r.h - 1) * e);
      if (r.floor) f = Math.max(f, F0 + (r.floor - F0) * e);
    }
    // The lift shaft at the end: tall.
    const e = edge(s, this.liftS - 1.2, this.path.len, 2.5);
    if (e) { h = Math.max(h, 1 + 2.3 * e); w = Math.max(w, 1 + 0.2 * e); }
    return { w, h, f };
  }
  _frame(s) {
    const p = posAt(this.path, s), d = dirAt(this.path, s);
    const fwd = new THREE.Vector3(d.x, 0, d.z).normalize();
    const side = new THREE.Vector3(-fwd.z, 0, fwd.x);
    return { p, d, fwd, side };
  }
  _walls() {
    const L = this.path, step = 0.9, rings = [];
    const prof = (W, H, F) => [[-W * 0.82, -F], [-W, -F * 0.45 + 0.15], [-W * 1.02, 0.7], [-W, H * 0.42], [-W * 0.84, H * 0.74], [-W * 0.5, H * 0.94], [0, H], [W * 0.5, H * 0.94], [W * 0.84, H * 0.74], [W, H * 0.42], [W * 1.02, 0.7], [W, -F * 0.45 + 0.15], [W * 0.82, -F]];
    const nR = Math.ceil(L.len / step);
    for (let i = 0; i <= nR; i++) {
      const s = Math.min(L.len, i * step), { p, fwd, side } = this._frame(s), { w, h, f } = this._prof(s);
      const W = W0 * w, H = H0 * h, inner = i > 0 && i < nR;
      const pts = prof(W, H, f).map(([a, b], j) => {
        const cx = a, cy = b - H * 0.35, len = Math.hypot(cx, cy) || 1;
        const jit = (hash(i, j) - 0.5) * 0.5 * Math.min(1.5, w) * (j === 0 || j === 12 ? 0.3 : 1);
        const along = inner ? (hash(i * 3 + 1, j * 5 + 2) - 0.5) * 0.35 : 0;
        return p.clone().addScaledVector(side, a + (cx / len) * jit).addScaledVector(UP, b + (cy / len) * jit * 0.8).addScaledVector(fwd, along);
      });
      rings.push({ s, pts, c: p.clone() });
    }
    // Two triangles per quad, a colour per quad (flat shading: faceted rock).
    const chunks = new Map(), M = 13;
    const push = (k, a, b, c, col) => {
      if (!chunks.has(k)) chunks.set(k, { pos: [], col: [] });
      const ch = chunks.get(k);
      for (const v of [a, b, c]) { ch.pos.push(v.x, v.y, v.z); ch.col.push(col.r, col.g, col.b); }
    };
    const col = new THREE.Color();
    for (let i = 0; i < rings.length - 1; i++) {
      const r0 = rings[i].pts, r1 = rings[i + 1].pts, k = Math.floor(rings[i].s / CHUNK);
      for (let j = 0; j < M; j++) {
        const j1 = (j + 1) % M, floor = j === M - 1 || j === 0 || j === M - 2;
        const hsh = hash(i * 13 + j, 77);
        col.setHex(floor ? FLOORS[Math.floor(hsh * FLOORS.length)] : hsh < 0.012 ? 0x9a7a3a : hsh < 0.05 ? 0x2e2925 : hsh < 0.08 ? 0x8a7c6c : ROCKS[Math.floor(hash(j, i * 7) * ROCKS.length)]);
        push(k, r0[j], r0[j1], r1[j1], col);
        push(k, r0[j], r1[j1], r1[j], col);
      }
    }
    // The two ends are closed (a fan of rock).
    for (const [ring, k] of [[rings[0], 0], [rings[rings.length - 1], Math.floor(rings[rings.length - 1].s / CHUNK)]]) {
      const c = ring.pts.reduce((a, v) => a.add(v), new THREE.Vector3()).multiplyScalar(1 / M);
      for (let j = 0; j < M; j++) push(k, c, ring.pts[j], ring.pts[(j + 1) % M], col.setHex(ROCKS[j % ROCKS.length]));
    }
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true, side: THREE.DoubleSide });
    this.wallMat = mat;
    for (const [, ch] of chunks) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(ch.pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(ch.col, 3));
      g.computeVertexNormals();
      g.computeBoundingSphere();
      this._static(new THREE.Mesh(g, mat));
    }
  }
  _inGap(s, m = 0) { return this.gap && s > this.gap.s0 - m && s < this.gap.s1 + m; }
  // Sleepers, two rails; trestles down to the floor where it drops (the lake, the chasm).
  _track() {
    const L = this.path;
    for (let s = 0.4; s < L.len - 0.3; s += 0.85) {
      if (this._inGap(s)) continue;
      const { p, side } = this._frame(s);
      this._add(s, beam(p.clone().addScaledVector(side, -0.62).setY(p.y - 0.05), p.clone().addScaledVector(side, 0.62).setY(p.y - 0.05), 0.22, 0.08, (Math.round(s / 0.85) % 3) ? WOOD : WOOD_D));
    }
    for (const off of [-0.42, 0.42]) {
      let prev = null;
      for (let s = 0.4; s <= L.len - 0.3; s += 1.4) {
        const inGap = this._inGap(s);
        const { p, side } = this._frame(s);
        const q = p.clone().addScaledVector(side, off); q.y += 0.02;
        if (prev && !inGap) this._add(s, beam(prev, q, 0.07, 0.08, RAIL));
        prev = inGap ? null : q;
      }
    }
    for (let s = 1; s < L.len; s += 2.6) {
      if (this._inGap(s, 0.6)) continue;
      const f = this._prof(s).f;
      if (f < 0.9) continue;
      const { p, side } = this._frame(s);
      const bottom = p.y - f + 0.2;
      for (const off of [-0.5, 0.5]) { const top = p.clone().addScaledVector(side, off); top.y -= 0.09; this._add(s, beam(top, top.clone().setY(bottom), 0.16, 0.16, WOOD_D)); }
      this._add(s, beam(p.clone().addScaledVector(side, -0.55).setY(p.y - 0.35), p.clone().addScaledVector(side, 0.55).setY(p.y - 0.35), 0.1, 0.12, WOOD));
      if (f > 3) this._add(s, beam(p.clone().addScaledVector(side, -0.55).setY(p.y - 0.35), p.clone().addScaledVector(side, 0.55).setY(Math.max(bottom, p.y - 3)), 0.08, 0.1, WOOD)); // a cross brace
    }
    // Stone piers under both ends of the big jump.
    if (this.gap) for (const sg of [this.gap.s0 - 0.5, this.gap.s1 + 0.5]) {
      const { p } = this._frame(sg), f = this._prof(sg).f, hgt = f - 0.2;
      this._add(sg, box(1.7, hgt, 1.7, 0x5c5854, p.x, p.y - 0.25 - hgt / 2, p.z), box(2.0, 0.3, 2.0, 0x7d7975, p.x, p.y - 0.25, p.z));
    }
  }
  // Wooden frames every few metres in the narrow tunnel; a lantern on every other one (a light for
  // the pool of four real lights).
  _frames() {
    const L = this.path;
    let k = 0;
    for (let s = 3.5; s < L.len - 3; s += 4.2) {
      const { w, h, f } = this._prof(s);
      if (w > 1.15 || f > 0.6 || this._inGap(s, 2) || this.barrierS.some((b) => Math.abs(b - s) < 2) || Math.abs(this.liftS - s) < 3) continue;
      const { p, side } = this._frame(s), W = W0 * w - 0.36, top = p.y + H0 * h * 0.7, base = p.y - f;
      const a = p.clone().addScaledVector(side, -W), b = p.clone().addScaledVector(side, W);
      this._add(s, beam(a.clone().setY(base), a.clone().setY(top), 0.22, 0.22, WOOD_D));
      this._add(s, beam(b.clone().setY(base), b.clone().setY(top), 0.22, 0.22, WOOD_D));
      this._add(s, beam(a.clone().setY(top + 0.1), b.clone().setY(top + 0.1), 0.24, 0.24, WOOD));
      if (k++ % 2 === 0) {
        const sd = (k % 4 < 2 ? 1 : -1) * (W - 0.32), q = p.clone().addScaledVector(side, sd).setY(top - 0.32);
        this._add(s, box(0.24, 0.07, 0.24, 0x2a2a2a, q.x, q.y + 0.16, q.z), beam(q.clone().setY(q.y + 0.16), q.clone().setY(top), 0.03, 0.03, 0x2a2a2a));
        this.glow.push(box(0.16, 0.22, 0.16, 0xffc860, q.x, q.y, q.z));
        this._light(q, 0xffb060, 3.2, 9);
      }
    }
  }
  _light(p, color, intensity, distance, decay = 1.4) {
    const o = new THREE.Object3D();
    o.position.copy(p);
    o.userData.spec = { color, intensity, distance, decay };
    this.root.add(o);
    const e = { light: o, current: intensity, base: intensity, phase: this.lights.length * 1.7 };
    this.lights.push(e);
    return e;
  }
  // Gem clusters (diamonds or crystals) round a point.
  _cluster(c, n, r, h, seed, cols = this.def.gems, big = 1) {
    for (let i = 0; i < n; i++) {
      const a = seed + i * 2.399, rr = r * (0.25 + ((i * 37) % 10) / 12);
      const g = new THREE.OctahedronGeometry((0.2 + ((i * 13) % 5) * 0.05) * big, 0).toNonIndexed();
      g.scale(1, h, 1); g.rotateZ(Math.sin(a) * 0.4); g.rotateX(Math.cos(a * 1.3) * 0.3);
      g.translate(c.x + Math.cos(a) * rr, c.y + 0.15 + ((i * 7) % 4) * 0.08 * big, c.z + Math.sin(a) * rr);
      this.gemGeos.push(colorize(g, cols[i % cols.length]));
    }
  }
  _rooms() {
    const L = this.path;
    for (const r of this.rooms) {
      // Stalactites from the ceiling, stalagmites on the floor (away from the track).
      for (let s = r.a, i = 0; s < r.b; s += 1.3, i++) {
        const { p, side } = this._frame(s), { w, h, f } = this._prof(s), W = W0 * w, H = H0 * h;
        for (const sgn of [-1, 1]) {
          const u = hash(i, sgn > 0 ? 3 : 5);
          if (u < 0.55) {
            const off = sgn * (0.9 + u * (W * 0.75 - 0.9)), len = 0.7 + hash(i, 11) * 1.4, rad = 0.18 + hash(i, 13) * 0.25;
            const g = new THREE.ConeGeometry(rad, len, 5).toNonIndexed(); g.rotateX(Math.PI);
            const q = p.clone().addScaledVector(side, off);
            g.translate(q.x, p.y + H * 0.93 - len / 2 - Math.abs(off) / W * H * 0.25, q.z);
            this._add(s, colorize(g, u < 0.2 ? 0x8a7a6a : 0x6e6050));
          }
          if (u > 0.5 && f < 1) {
            const off = sgn * (1.5 + (u - 0.5) * (W * 1.4 - 1.5)), len = 0.4 + hash(i, 17) * 0.9;
            const g = new THREE.ConeGeometry(0.2 + hash(i, 19) * 0.2, len, 5).toNonIndexed();
            const q = p.clone().addScaledVector(side, off);
            g.translate(q.x, p.y - f + len / 2, q.z);
            this._add(s, colorize(g, 0x7a6a5a));
          }
        }
      }
      if (r.kind === 'gems') {
        // The diamond (or crystal) cave: clusters on both sides, a big pile by the cart, a light.
        const c = (r.a + r.b) / 2;
        for (let k = 0; k < 12; k++) {
          const s = r.a + 1 + (k / 11) * (r.b - r.a - 2), { p, side } = this._frame(s), W = W0 * this._prof(s).w;
          const sgn = k % 2 ? 1 : -1, off = sgn * (1.8 + hash(k, 23) * (W - 2.4));
          this._cluster(p.clone().addScaledVector(side, off).setY(p.y - F0), 5 + (k % 3), 0.7, 1.4 + hash(k, 29), k * 1.3, undefined, 1 + (k % 3) * 0.25);
          // Crystals growing from the walls, higher up.
          const hw = p.clone().addScaledVector(side, sgn * (W - 0.5)).setY(p.y + 1.4 + hash(k, 31) * 2.2);
          this._cluster(hw, 3, 0.4, 1.3, k * 2.1);
        }
        const { p, side } = this._frame(c);
        this._cluster(p.clone().addScaledVector(side, -1.5).setY(p.y - F0), 14, 0.9, 2.2, 3, undefined, 1.4);
        this._light(p.clone().setY(p.y + 2.6), this.def.light, 5, 16, 1.2);
        this._light(posAt(L, r.a).clone().setY(posAt(L, r.a).y + 2.2), this.def.light, 3, 12, 1.3);
      }
      if (r.kind === 'lake') {
        // The glowing underground lake under the bridge.
        let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9, y = 1e9;
        for (let s = r.a - 2; s <= r.b + 2; s += 1) { const p = posAt(L, s); minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z); y = Math.min(y, p.y); }
        const pad = W0 * r.w + 1;
        const g = new THREE.PlaneGeometry(maxX - minX + pad * 2, maxZ - minZ + pad * 2, 1, 1); g.rotateX(-Math.PI / 2);
        this.waterMat = new THREE.MeshStandardMaterial({ color: 0x2a8ab0, emissive: 0x0a5a7a, emissiveIntensity: 0.9, transparent: true, opacity: 0.85, roughness: 0.15, metalness: 0.1 });
        const water = new THREE.Mesh(g, this.waterMat);
        water.position.set((minX + maxX) / 2, y - 3.2, (minZ + maxZ) / 2);
        this._static(water);
        this.waterY = y - 3.2;
        // Little glowing fish under the water, and blue lights.
        for (let k = 0; k < 14; k++) {
          const s = r.a + (k / 13) * (r.b - r.a), { p, side } = this._frame(s), off = (hash(k, 41) - 0.5) * 2 * (W0 * r.w - 1);
          const q = p.clone().addScaledVector(side, off).setY(y - 3.45);
          this.glow.push(box(0.28, 0.08, 0.12, k % 3 ? 0x7af0ff : 0xffe07a, q.x, q.y, q.z, 0, hash(k, 43) * 6));
        }
        for (const s of [r.a + 2, (r.a + r.b) / 2, r.b - 2]) { const p = posAt(L, s); this._light(p.clone().setY(y - 2.4), 0x4ad0ff, 3.5, 14, 1.2); }
      }
      if (r.kind === 'chasm') {
        // Deep down, glowing crystals light the chasm.
        for (let k = 0; k < 9; k++) {
          const s = r.a + 1 + (k / 8) * (r.b - r.a - 2), { p, side } = this._frame(s), off = (hash(k, 47) - 0.5) * 2 * (W0 * r.w - 1.5);
          this._cluster(p.clone().addScaledVector(side, off).setY(p.y - this._prof(s).f), 6, 1.0, 2.6, k * 1.9, undefined, 1.5);
        }
        const mid = (this.gap.s0 + this.gap.s1) / 2, p = posAt(L, mid);
        this._light(p.clone().setY(p.y - 9), this.def.light, 6, 20, 1.0);
        this._light(p.clone().setY(p.y + 2), 0xffd0a0, 2.5, 14, 1.3);
      }
      if (r.kind === 'bats') {
        const c = (r.a + r.b) / 2, p = posAt(L, c);
        this._light(p.clone().setY(p.y + 3.2), 0x9a8aff, 2.2, 12, 1.3);
      }
    }
  }
  // Glowing mushrooms by the walls and small crystals in them, all along the tunnel.
  _mushroomsAndCrystals() {
    const L = this.path, MUSH = [0x5af0c8, 0x8affe0, 0x4ad0ff, 0xb08aff];
    for (let s = 5, i = 0; s < L.len - 4; s += 3.1, i++) {
      if (this._inGap(s, 3)) continue;
      const { w, f } = this._prof(s);
      const { p, side } = this._frame(s), W = W0 * w;
      const u = hash(i, 51);
      if (u < 0.45 && f < 0.6) {
        const sgn = hash(i, 53) < 0.5 ? -1 : 1;
        for (let m = 0; m < 2 + (i % 3); m++) {
          const q = p.clone().addScaledVector(side, sgn * (W - 0.55 - hash(i, m) * 0.3)).addScaledVector(new THREE.Vector3(side.z, 0, -side.x), (m - 1) * 0.3);
          const hh = 0.12 + hash(m, i) * 0.16;
          this._add(s, box(0.06, hh, 0.06, 0xd8f0e0, q.x, p.y - f + hh / 2, q.z));
          this.glow.push(box(0.2 + m * 0.03, 0.07, 0.2 + m * 0.03, MUSH[(i + m) % MUSH.length], q.x, p.y - f + hh + 0.03, q.z));
        }
      } else if (u > 0.75) {
        const sgn = hash(i, 57) < 0.5 ? -1 : 1;
        this._cluster(p.clone().addScaledVector(side, sgn * (W - 0.35)).setY(p.y + 0.8 + hash(i, 59) * 1.6), 3, 0.25, 1.2, i);
      }
    }
  }
  // A barrier: two posts and a red and white bar with a golden padlock; the word lifts the bar.
  _barriers() {
    this.barriers = this.barrierS.map((sb) => {
      const { p, side, fwd } = this._frame(sb), base = p.y - F0;
      for (const sgn of [-1, 1]) {
        const q = p.clone().addScaledVector(side, sgn * 1.2);
        this._add(sb, box(0.22, 1.5, 0.22, 0x5a5e66, q.x, base + 0.75, q.z), box(0.3, 0.12, 0.3, 0x3a3e46, q.x, base + 1.52, q.z));
        this.glow.push(box(0.14, 0.14, 0.14, sgn < 0 ? 0xff4a3a : 0xffd34a, q.x, base + 1.65, q.z));
      }
      const pivot = new THREE.Group();
      pivot.position.copy(p).addScaledVector(side, -1.2).setY(base + 1.15);
      // (side, up, back): a right-handed frame, so the bar lies across the track and lifts upwards.
      pivot.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, UP, fwd.clone().negate()));
      const arm = new THREE.Group();
      pivot.add(arm);
      const bars = [];
      for (let k = 0; k < 7; k++) bars.push(box(0.34, 0.18, 0.1, k % 2 ? 0xf2f2f2 : 0xd8302a, 0.2 + k * 0.34, 0, 0));
      const bar = new THREE.Mesh(merge(bars), MAT({ roughness: 0.6 }));
      arm.add(bar);
      const lockMat = new THREE.MeshStandardMaterial({ color: 0xffc63a, emissive: 0x8a5a00, emissiveIntensity: 0.6, metalness: 0.7, roughness: 0.3 });
      const lock = new THREE.Mesh(merge([box(0.34, 0.3, 0.14, 0xffffff, 0, 0, 0), box(0.06, 0.2, 0.06, 0xffffff, -0.1, 0.22, 0), box(0.06, 0.2, 0.06, 0xffffff, 0.1, 0.22, 0), box(0.26, 0.06, 0.06, 0xffffff, 0, 0.32, 0), box(0.07, 0.1, 0.02, 0x3a2a10, 0, -0.03, 0.08)]), lockMat);
      lock.position.set(1.2, -0.32, 0.06); // (facing the cart)
      arm.add(lock);
      this.root.add(pivot);
      return { s: sb, pivot, arm, lock, open: 0, opening: false };
    });
  }
  // The lift at the end: a wooden deck the cart stops on, ropes going up the shaft, a pulley.
  _lift() {
    const { p, side, fwd } = this._frame(this.liftS), base = p.y - 0.14;
    this.liftDeck = new THREE.Group();
    const deck = new THREE.Mesh(merge([box(2.5, 0.16, 2.6, WOOD, 0, 0, 0), box(2.6, 0.2, 0.16, WOOD_D, 0, 0.08, 1.25), box(2.6, 0.2, 0.16, WOOD_D, 0, 0.08, -1.25)]), MAT({ roughness: 0.85 }));
    this.liftDeck.add(deck);
    this.liftDeck.position.set(p.x, base, p.z);
    this.liftDeck.rotation.y = Math.atan2(fwd.x, fwd.z);
    this.root.add(this.liftDeck);
    const H = H0 * this._prof(this.liftS).h;
    for (const [a, b] of [[-1.15, -1.2], [1.15, -1.2], [-1.15, 1.2], [1.15, 1.2]]) {
      const q = p.clone().addScaledVector(side, a).addScaledVector(fwd, b);
      this._add(this.liftS, beam(q.clone().setY(base + 0.1), q.clone().setY(p.y + H - 0.6), 0.04, 0.04, 0xb8a070));
    }
    const top = p.clone().setY(p.y + H - 0.5);
    this._add(this.liftS, beam(top.clone().addScaledVector(side, -2), top.clone().addScaledVector(side, 2), 0.3, 0.3, WOOD_D));
    this._add(this.liftS, box(0.5, 0.5, 0.2, 0x5a5e66, top.x, top.y - 0.35, top.z));
    this._light(p.clone().setY(p.y + 2.4), 0xffb060, 3.5, 10);
    this._light(top.clone().setY(top.y - 1), 0xfff0c0, 2.5, 10);
  }
  // Gold nuggets on line 2: one before the jump, two in the air over the chasm, three after.
  _nuggets() {
    const g = this.gap, after = this.barrierS[1];
    const list = [
      { s: g.s0 - 4.5, side: 1.3, up: 1.3 },
      { s: g.s0 + (g.s1 - g.s0) * 0.35, side: 0, up: 1.4, air: true },
      { s: g.s0 + (g.s1 - g.s0) * 0.7, side: 0, up: 1.4, air: true },
      { s: g.s1 + 6, side: -1.3, up: 1.3 },
      { s: g.s1 + (after - g.s1) * 0.55, side: 1.3, up: 1.3 },
      { s: after - 5, side: -1.3, up: 1.3 },
    ].slice(0, NUGGETS);
    this.nugs = list;
    this.nugGot = new Set();
    this.nugMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.26, 0), new THREE.MeshStandardMaterial({ color: 0xffc63a, emissive: 0xb07a00, emissiveIntensity: 0.8, metalness: 0.7, roughness: 0.3, flatShading: true }), list.length);
    this.nugMesh.frustumCulled = false;
    this.root.add(this.nugMesh);
    this.nugObjs = list.map((n, i) => {
      const p = this.nuggetPos(i);
      const o = this.s._addInteractable({ kind: 'nugget', world: 'mine', nugget: i, worldPos: p.clone().setY(p.y - 0.35), iconY: 0.7, reach: 9, hitRadius: 1.3 });
      o.iconHolder.visible = false;
      this.objs.push(o);
      return o;
    });
    this._layoutNuggets();
  }
  nuggetPos(i) {
    const n = this.nugs[i], { p, side } = this._frame(n.s);
    const q = p.clone().addScaledVector(side, n.side);
    q.y += n.up;
    if (n.air) { const k = (n.s - this.gap.s0) / (this.gap.s1 - this.gap.s0); q.y += Math.sin(k * Math.PI) * 3.2; }
    return q;
  }
  takeNugget(i) {
    if (!this.ride || !this.nugs || this.nugGot.has(i)) return false;
    this.nugGot.add(i);
    this.nugObjs[i].active = false;
    const p = this.nuggetPos(i);
    for (const c of ['#ffd34a', '#fff3a0']) this.s.particleBurst(p, c, 16);
    this._layoutNuggets();
    return true;
  }
  _layoutNuggets() {
    if (!this.nugMesh) return;
    const d = this._d;
    this.nugs.forEach((n, i) => {
      if (!this.nugGot.has(i)) { d.position.copy(this.nuggetPos(i)); d.position.y += Math.sin(this.t * 3 + i) * 0.12; d.rotation.set(this.t * 1.3 + i, this.t * 2 + i, 0); d.scale.setScalar(1); } else { d.position.set(0, -500, 0); d.scale.setScalar(0.0001); }
      d.updateMatrix();
      this.nugMesh.setMatrixAt(i, d.matrix);
    });
    this.nugMesh.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < this.nugObjs.length; i++) {
      const o = this.nugObjs[i], p = this.nuggetPos(i);
      o.worldPos.set(p.x, p.y - 0.35, p.z);
      o.hit.position.set(p.x, p.y, p.z);
    }
  }

  // ===== The ride =====
  spawn() {
    this.ride = { s: this.startS, v: 0, stage: 'go', k: 0, t: 0, jumped: false, landed: false, said: {}, dripAt: 2 + Math.random() * 3 };
    this._pose();
    this.snapCamera();
  }
  // After the word at a barrier: the bar goes up, the cart sets off.
  openBarrier() {
    const r = this.ride, st = this.stops[r?.k];
    if (!r || r.stage !== 'barrier' || st?.type !== 'barrier') return;
    const b = this.barriers[st.k];
    b.opening = true;
    r.stage = 'opening'; r.ot = 0;
    const p = b.lock.getWorldPosition(new THREE.Vector3());
    for (const c of ['#ffd34a', '#ffffff', '#ff8a3a']) this.s.particleBurst(p, c, 18);
    b.lock.visible = false;
  }
  // After the word at the cave: the cart is full, it goes on to the lift.
  leaveEnd() {
    const r = this.ride;
    if (!r || r.stage !== 'end') return;
    this.cartLoad.visible = true;
    r.stage = 'go'; r.k++; r.v = 1;
  }
  _cartPose() {
    const r = this.ride, L = this.path;
    if (this._inGap(r.s)) {
      const k = (r.s - this.gap.s0) / (this.gap.s1 - this.gap.s0), a = posAt(L, this.gap.s0), b = posAt(L, this.gap.s1);
      const p = a.clone().lerp(b, k); p.y += Math.sin(k * Math.PI) * 3.2;
      const d = new THREE.Vector3().subVectors(b, a).normalize(); d.y = Math.cos(k * Math.PI) * 0.5; d.normalize();
      return { p, d };
    }
    const p = posAt(L, r.s).clone(), d = dirAt(L, r.s).clone();
    if (r.stage === 'lift' || r.stage === 'up') p.y += this.liftUp ?? 0;
    return { p, d };
  }
  _pose(shake = 0) {
    const { p, d } = this._cartPose();
    placeCart(this.cart, p, d, shake);
    seatHero(this.s, p, d);
    this.cartPose = { p, d };
  }
  rideStep(dt) {
    const r = this.ride, s = this.s;
    if (!r) return;
    s.autoWalk = null;
    const K = this.speedK, ACC = 4.2 * K;
    r.t += dt;
    if (r.stage === 'go') {
      const st = this.stops[r.k], left = st ? st.s - r.s : 99, d = dirAt(this.path, r.s);
      const inGap = this._inGap(r.s);
      if (this.gap && inGap && !r.jumped) { r.jumped = true; this.onJump?.(); }
      if (this.gap && r.jumped && !r.landed && r.s >= this.gap.s1) { r.landed = true; s.screenShake?.(0.25); this.onLand?.(); }
      const vmax = (5.0 + Math.max(0, -d.y) * 7) * K;
      r.v = Math.min(r.v + ACC * dt, vmax, Math.sqrt(Math.max(0.3, 2 * ACC * 0.9 * left)) + 0.4);
      r.s += r.v * dt * (inGap ? 0.32 : 1); // slow motion over the chasm
      this._events(r);
      if (st && r.s >= st.s - 0.02) {
        r.s = st.s; r.v = 0;
        if (st.type === 'barrier') { r.stage = 'barrier'; this.onBarrier?.(st.k); }
        else if (st.type === 'end') { r.stage = 'end'; this.onEnd?.(this.line); }
        else if (st.type === 'lift') { r.stage = 'lift'; r.lt = 0; this.liftUp = 0; this.onLift?.(); }
      }
    } else if (r.stage === 'opening') {
      r.ot += dt;
      if (r.ot > 0.6) { r.stage = 'go'; r.k++; r.v = 1.2; }
    } else if (r.stage === 'lift') {
      r.lt += dt;
      this.liftUp = 7 * smooth(r.lt / 3.4);
      this.liftDeck.position.y = posAt(this.path, this.liftS).y - 0.14 + this.liftUp;
      if (r.lt > 1.6 && !r.exited) { r.exited = true; this.onExit?.(); }
    }
    // Drops of water now and then (sound only).
    if (dt > 0) { r.dripAt -= dt; if (r.dripAt <= 0) { r.dripAt = 3.5 + Math.random() * 4; this.onDrip?.(); } }
    const shake = r.stage === 'go' && r.v > 3 && !this._inGap(r.s) ? Math.sin(r.t * 22) * 0.015 : 0;
    this._pose(shake);
  }
  // What happens on the way (once per ride): the bats, the descent, the lake.
  _events(r) {
    const once = (key, cond, fn) => { if (!r.said[key] && cond) { r.said[key] = true; fn(); } };
    if (this.batsRoom) once('bats', r.s > (this.batsRoom.a + this.batsRoom.b) / 2 - 5, () => { this.batT = 0; this.batAt = posAt(this.path, (this.batsRoom.a + this.batsRoom.b) / 2).clone(); this.batAt.y += 2.6; this.onBats?.(); });
    if (this.descentS !== null) once('descent', r.s > this.descentS, () => this.onDescent?.());
    if (this.lake) once('lake', r.s > this.lake.a - 2, () => this.onLake?.());
  }
  seatDog(pet, t) { seatDog(this.cart, pet, t); }

  // ===== The camera: behind the cart, inside the tunnel =====
  _camGoal(out, look) {
    const r = this.ride, L = this.path, { p, d } = this.cartPose;
    if (r.stage === 'lift') {
      const q = posAt(L, this.liftS - 4), fwd = dirAt(L, this.liftS);
      out.copy(q).addScaledVector(UP, 1.5); look.copy(p).addScaledVector(UP, 0.9).addScaledVector(fwd, 0.5);
      return;
    }
    if (this.gap && r.s > this.gap.s0 - 2.5 && r.s < this.gap.s1 + 0.5) {
      // The big jump, seen from the side (the wow shot).
      const mid = (this.gap.s0 + this.gap.s1) / 2, { p: m, side } = this._frame(mid);
      out.copy(m).addScaledVector(side, W0 * 2.6 - 0.7).addScaledVector(UP, 1.6);
      look.copy(p).addScaledVector(UP, 0.6);
      return;
    }
    const st = this.stops[r.k], fwd = new THREE.Vector3(d.x, 0, d.z).normalize(), side = new THREE.Vector3(-fwd.z, 0, fwd.x);
    // At a barrier: a little to the side and higher, to see the bar and its padlock over the hero.
    if (st?.type === 'barrier' && (r.stage === 'barrier' || r.stage === 'opening' || (r.stage === 'go' && st.s - r.s < 5))) {
      const b = this._frame(this.barrierS[st.k]);
      out.copy(p).addScaledVector(fwd, -3.0).addScaledVector(side, 1.0).addScaledVector(UP, 2.6);
      look.copy(b.p).addScaledVector(b.side, 0.2).addScaledVector(UP, 0.9);
      return;
    }
    // At the cave: higher and to the side, to see the treasure.
    if (r.stage === 'end') {
      out.copy(p).addScaledVector(fwd, -4.2).addScaledVector(side, 1.6).addScaledVector(UP, 3.4);
      look.copy(p).addScaledVector(fwd, 1.2).addScaledVector(side, -1.2).addScaledVector(UP, 0.6);
      return;
    }
    const { h } = this._prof(r.s);
    out.copy(posAt(L, Math.max(0.4, r.s - 4.8))).addScaledVector(UP, 2.35 + (h - 1) * 1.4);
    look.copy(p).addScaledVector(fwd, 3.2).addScaledVector(UP, 0.9);
  }
  snapCamera() {
    const cam = this.s.camera;
    this._look ??= new THREE.Vector3();
    const goal = new THREE.Vector3();
    this._camGoal(goal, this._look);
    cam.position.copy(goal);
    cam.lookAt(this._look);
    this.s.camTarget.copy(this.cart.position);
  }
  updateCamera(dt) {
    if (!this.ride || !this.cartPose) return;
    const cam = this.s.camera, s = this.s;
    const goal = (this._goal ??= new THREE.Vector3()), look = (this._lk ??= new THREE.Vector3());
    this._camGoal(goal, look);
    const fast = this.gap && this.ride.s > this.gap.s0 - 2.5 && this.ride.s < this.gap.s1 + 2;
    const k = 1 - Math.pow(fast ? 0.02 : 0.004, dt);
    cam.position.lerp(goal, k);
    this._look.lerp(look, Math.min(1, k * 1.6));
    if (s.shakeIntensity > 0.001) {
      cam.position.x += (Math.random() - 0.5) * s.shakeIntensity;
      cam.position.y += (Math.random() - 0.5) * s.shakeIntensity;
      s.shakeIntensity *= s.shakeDecay;
    }
    cam.lookAt(this._look);
    s.camTarget.copy(this.cart.position);
  }

  // ===== Every frame =====
  update(dt, elapsed) {
    this.t += dt;
    const s = this.s;
    // The cart's lamp lights the tunnel ahead.
    if (this.cartPose) {
      const { p, d } = this.cartPose;
      s.torchLight.position.set(p.x + d.x * 2.6, p.y + 1.7, p.z + d.z * 2.6); // (ahead of the dog, not on him)
      s.torchLight.color.setHex(0xfff0d0); s.torchLight.distance = 13; s.torchLight.intensity = 5;
    }
    for (const e of this.lights) e.current = e.base * (1 + Math.sin(elapsed * 7 + e.phase) * 0.06 + Math.sin(elapsed * 13 + e.phase * 2) * 0.04);
    if (this.gemMat) this.gemMat.emissiveIntensity = 0.28 + Math.sin(elapsed * 2) * 0.08;
    if (this.waterMat) this.waterMat.emissiveIntensity = 0.85 + Math.sin(elapsed * 1.5) * 0.15;
    for (const b of this.barriers) {
      if (!b.opening || b.open >= 1) continue;
      b.open = Math.min(1, b.open + dt / 0.5);
      const e = b.open, over = Math.sin(e * Math.PI) * 0.15;
      b.arm.rotation.z = 1.35 * smooth(e) + over;
    }
    if (this.batT >= 0) { this.batT += dt; if (this.batT > 3.6) this.batT = -1; this._layoutBats(); } else if (this.bats.visible) this._layoutBats();
    if (this.nugMesh && dt > 0) this._layoutNuggets();
  }
  _layoutBats() {
    const d = this._d, t = this.t, on = this.batT >= 0;
    this.bats.visible = on;
    const c = this.cart.position;
    for (let i = 0; i < 10; i++) {
      if (on) {
        const k = Math.min(1, this.batT / 0.5), a = i * 0.628 + t * (2.4 + (i % 3) * 0.5), r = (0.7 + (i % 4) * 0.4) * k + 0.25;
        const f = Math.min(1, this.batT / 0.9);
        const cx = this.batAt.x + (c.x - this.batAt.x) * f, cz = this.batAt.z + (c.z - this.batAt.z) * f, cy = this.batAt.y + (c.y + 1.8 - this.batAt.y) * f;
        d.position.set(cx + Math.cos(a) * r, cy + Math.sin(t * 6 + i) * 0.3 + (i % 3) * 0.25, cz + Math.sin(a) * r);
        d.rotation.set(0, -a, 0);
        d.scale.set(1 + Math.sin(t * 30 + i) * 0.5, 1, 1);
      } else { d.position.set(0, -500, 0); d.scale.setScalar(0.0001); }
      d.updateMatrix();
      this.bats.setMatrixAt(i, d.matrix);
    }
    this.bats.instanceMatrix.needsUpdate = true;
  }

  dispose() {
    for (const o of this.objs) this.s.removeInteractable?.(o);
    this.objs = [];
    this.ride = null;
    disposeTree(this.root);
  }
}

function batGeo() {
  const B = 0x2a2030, W = 0x3a2a48, E = 0xffe04a; // (friendly yellow eyes)
  return merge([box(0.18, 0.16, 0.22, B), box(0.42, 0.03, 0.2, W, -0.28, 0.02, 0, 0, 0, 0.25), box(0.42, 0.03, 0.2, W, 0.28, 0.02, 0, 0, 0, -0.25), box(0.04, 0.04, 0.02, E, -0.05, 0.03, 0.12), box(0.04, 0.04, 0.02, E, 0.05, 0.03, 0.12), box(0.05, 0.07, 0.04, B, -0.06, 0.11, 0.04), box(0.05, 0.07, 0.04, B, 0.06, 0.11, 0.04)]);
}
