import * as THREE from 'three';

// Shared low-poly prop kit used to dress house interiors.
// Everything is built from a handful of shared geometries and cached materials
// so a richly furnished room stays cheap to render.

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYL = new THREE.CylinderGeometry(1, 1, 1, 14);
const UNIT_CYL_LOW = new THREE.CylinderGeometry(1, 1, 1, 8);
const UNIT_CONE = new THREE.ConeGeometry(1, 1, 7);
const UNIT_SPHERE = new THREE.SphereGeometry(1, 10, 8);

// Barrel: a lathe profile so the staves bulge like a real cask.
const BARREL_GEO = (() => {
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const y = t - 0.5;
    const r = 0.84 + Math.sin(t * Math.PI) * 0.16;
    pts.push(new THREE.Vector2(r, y));
  }
  const geo = new THREE.LatheGeometry(pts, 16);
  return geo;
})();
const BARREL_LID = new THREE.CircleGeometry(0.84, 16);

export function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const PALETTE = {
  floor: 0x6e4126,
  floorGap: 0x1f120a,
  floorBorder: 0x3b2314,
  wood: 0x8b5a34,
  woodDark: 0x4a2c1a,
  woodRed: 0x5e2418,
  woodRedDark: 0x3a1610,
  stone: 0x7c7a7c,
  stoneDark: 0x4e4b4c,
  soot: 0x0c0908,
  plaster: 0xeee4d2,
  rugRed: 0x9a2423,
  rugGold: 0xd9a441,
  rugBlue: 0x24365e,
  chairRed: 0x9c2a26,
  chairBlue: 0x23458a,
  cloth: 0xf3ead6,
  brass: 0xc79a3b,
  glass: 0xbfe3f2,
  candle: 0xf6ecd2,
  flame: 0xffb340,
  flameCore: 0xffe7a0,
  flameOuter: 0xff5a14,
  banner: 0x1f3f8a,
  plant: 0x3f8a3a,
  pot: 0xb2552e,
};

export class PropKit {
  constructor() {
    this.mats = new Map();
    // Animated bits collected while building; the scene ticks them each frame.
    this.flames = [];
    this.lights = [];
  }

  mat(color, opts = {}) {
    const key = `${color}|${JSON.stringify(opts)}`;
    if (!this.mats.has(key)) {
      this.mats.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...opts }));
    }
    return this.mats.get(key);
  }

  glow(color, intensity = 2.5) {
    return this.mat(color, { emissive: color, emissiveIntensity: intensity, roughness: 0.4 });
  }

  _mesh(geo, mat, parent, sx, sy, sz, x, y, z, o = {}) {
    const m = new THREE.Mesh(geo, mat);
    m.scale.set(sx, sy, sz);
    m.position.set(x, y, z);
    if (o.rx) m.rotation.x = o.rx;
    if (o.ry) m.rotation.y = o.ry;
    if (o.rz) m.rotation.z = o.rz;
    m.castShadow = o.cast !== false;
    m.receiveShadow = o.receive !== false;
    parent.add(m);
    return m;
  }

  box(parent, w, h, d, mat, x, y, z, o) { return this._mesh(UNIT_BOX, mat, parent, w, h, d, x, y, z, o); }
  cyl(parent, r, h, mat, x, y, z, o = {}) {
    return this._mesh(o.low ? UNIT_CYL_LOW : UNIT_CYL, mat, parent, r, h, o.rz2 ?? r, x, y, z, o);
  }
  cone(parent, r, h, mat, x, y, z, o) { return this._mesh(UNIT_CONE, mat, parent, r, h, r, x, y, z, o); }
  sphere(parent, r, mat, x, y, z, o) { return this._mesh(UNIT_SPHERE, mat, parent, r, r, r, x, y, z, o); }

  group(parent, x, z, ry = 0, y = 0) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = ry;
    parent.add(g);
    return g;
  }

  // ---------- Floors ----------

  plankFloor(parent, w, d, { seed = 7, base = PALETTE.floor, plankW = 0.36, y = 0.08, border = true } = {}) {
    const rnd = seededRandom(seed);
    const inset = border ? 0.22 : 0;
    const fw = w - inset * 2;
    const fd = d - inset * 2;
    const rows = Math.max(2, Math.round(fd / plankW));
    const rowW = fd / rows;
    const planks = [];
    for (let r = 0; r < rows; r++) {
      let x = -fw / 2 - rnd() * 1.6;
      const z = -fd / 2 + rowW * (r + 0.5);
      while (x < fw / 2) {
        const len = 1.3 + rnd() * 1.7;
        const x0 = Math.max(x, -fw / 2);
        const x1 = Math.min(x + len, fw / 2);
        if (x1 - x0 > 0.12) planks.push({ cx: (x0 + x1) / 2, z, len: x1 - x0 - 0.03 });
        x += len;
      }
    }

    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78 });
    const inst = new THREE.InstancedMesh(UNIT_BOX, mat, planks.length);
    const m4 = new THREE.Matrix4();
    const c = new THREE.Color();
    const baseHsl = {};
    new THREE.Color(base).getHSL(baseHsl);
    planks.forEach((p, i) => {
      m4.compose(
        new THREE.Vector3(p.cx, y, p.z),
        new THREE.Quaternion(),
        new THREE.Vector3(p.len, 0.06, rowW - 0.03),
      );
      inst.setMatrixAt(i, m4);
      c.setHSL(
        baseHsl.h + (rnd() - 0.5) * 0.025,
        baseHsl.s * (0.85 + rnd() * 0.25),
        baseHsl.l * (0.78 + rnd() * 0.42),
      );
      inst.setColorAt(i, c);
    });
    inst.receiveShadow = true;
    parent.add(inst);

    // Dark sub-floor shows through the seams between planks.
    this.box(parent, w, 0.06, d, this.mat(PALETTE.floorGap), 0, y - 0.035, 0, { cast: false });
    if (border) {
      const bm = this.mat(PALETTE.floorBorder, { roughness: 0.7 });
      this.box(parent, w, 0.08, inset, bm, 0, y + 0.005, -d / 2 + inset / 2, { cast: false });
      this.box(parent, w, 0.08, inset, bm, 0, y + 0.005, d / 2 - inset / 2, { cast: false });
      this.box(parent, inset, 0.08, d, bm, -w / 2 + inset / 2, y + 0.005, 0, { cast: false });
      this.box(parent, inset, 0.08, d, bm, w / 2 - inset / 2, y + 0.005, 0, { cast: false });
    }
    return inst;
  }

  // ---------- Stonework ----------

  // Builds a wall of individual stone blocks inside the box [x0,x1] x [y0,y1] at depth z.
  stoneBlocks(parent, x0, x1, y0, y1, z, depth, rnd, { rowH = 0.3, tint = PALETTE.stone } = {}) {
    const blocks = [];
    const rows = Math.max(1, Math.round((y1 - y0) / rowH));
    const rh = (y1 - y0) / rows;
    for (let r = 0; r < rows; r++) {
      let x = x0 - (r % 2 ? 0.18 : 0) - rnd() * 0.1;
      while (x < x1) {
        const bw = 0.32 + rnd() * 0.3;
        const a = Math.max(x, x0);
        const b = Math.min(x + bw, x1);
        if (b - a > 0.06) {
          blocks.push({
            x: (a + b) / 2, y: y0 + rh * (r + 0.5), w: b - a - 0.035, h: rh - 0.035,
            d: depth * (0.94 + rnd() * 0.12), z: z + (rnd() - 0.5) * 0.04,
          });
        }
        x += bw;
      }
    }
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 });
    const inst = new THREE.InstancedMesh(UNIT_BOX, mat, blocks.length);
    const m4 = new THREE.Matrix4();
    const c = new THREE.Color();
    const hsl = {};
    new THREE.Color(tint).getHSL(hsl);
    blocks.forEach((bk, i) => {
      m4.compose(new THREE.Vector3(bk.x, bk.y, bk.z), new THREE.Quaternion(), new THREE.Vector3(bk.w, bk.h, bk.d));
      inst.setMatrixAt(i, m4);
      c.setHSL(hsl.h + (rnd() - 0.5) * 0.04, hsl.s * (0.6 + rnd() * 0.8), hsl.l * (0.72 + rnd() * 0.5));
      inst.setColorAt(i, c);
    });
    inst.castShadow = true;
    inst.receiveShadow = true;
    parent.add(inst);
    // Mortar behind the blocks.
    this.box(parent, x1 - x0, y1 - y0, depth * 0.9, this.mat(0x3a3634, { roughness: 1 }), (x0 + x1) / 2, (y0 + y1) / 2, z - 0.02, { cast: false });
    return inst;
  }

  // Stone fireplace built against a wall. Local frame: wall at z=0, room towards +z.
  fireplace(parent, x, z, ry, { width = 2.5, wallH = 3, chimneyTop = 5.4, seed = 3 } = {}) {
    const g = this.group(parent, x, z, ry);
    const rnd = seededRandom(seed);
    const open = width * 0.5;
    const openH = 1.05;
    const mantelY = 1.45;
    const depth = 0.75;
    const zc = depth / 2;

    // Jambs either side of the opening.
    this.stoneBlocks(g, -width / 2, -open / 2, 0.12, mantelY, zc, depth, rnd);
    this.stoneBlocks(g, open / 2, width / 2, 0.12, mantelY, zc, depth, rnd);
    // Stones above the opening up to the mantel.
    this.stoneBlocks(g, -open / 2, open / 2, openH + 0.12, mantelY, zc, depth, rnd, { rowH: 0.2 });
    // Chimney breast rising above the roofline, like the reference.
    const bw = width * 0.78;
    this.stoneBlocks(g, -bw / 2, bw / 2, mantelY + 0.18, chimneyTop, 0.3, 0.6, rnd, { rowH: 0.34, tint: 0x8a8a8e });
    // Chimney cap.
    this.box(g, bw + 0.18, 0.16, 0.78, this.mat(PALETTE.stoneDark), 0, chimneyTop + 0.08, 0.3);

    // Firebox — a deep black opening.
    this.box(g, open, openH, depth * 0.9, this.mat(PALETTE.soot, { roughness: 1 }), 0, 0.12 + openH / 2, zc - 0.06, { cast: false });
    // Hearth slab.
    this.stoneBlocks(g, -width / 2 - 0.25, width / 2 + 0.25, 0, 0.12, depth + 0.35, 0.8, rnd, { rowH: 0.12, tint: 0x6d6a69 });
    // Dark wood mantel shelf.
    const mantel = this.box(g, width + 0.35, 0.16, depth + 0.2, this.mat(PALETTE.woodDark), 0, mantelY + 0.08, zc + 0.05);
    void mantel;
    // Mantel decor: candles and a pot.
    this.candle(g, -width / 2 + 0.2, mantelY + 0.16, zc + 0.2);
    this.candle(g, width / 2 - 0.2, mantelY + 0.16, zc + 0.2);
    this.cyl(g, 0.14, 0.2, this.mat(0x2c2a2a, { metalness: 0.4, roughness: 0.5 }), 0.3, mantelY + 0.26, zc + 0.1);

    // Logs.
    const logMat = this.mat(0x4a2d18, { roughness: 0.95 });
    this.cyl(g, 0.08, open * 0.8, logMat, 0, 0.22, zc + 0.05, { rz: Math.PI / 2, low: true });
    this.cyl(g, 0.075, open * 0.7, logMat, -0.08, 0.3, zc - 0.05, { rz: Math.PI / 2, ry: 0.4, low: true });
    this.cyl(g, 0.07, open * 0.6, logMat, 0.1, 0.36, zc + 0.08, { rz: Math.PI / 2, ry: -0.5, low: true });

    // Layered flames.
    const outer = this.glow(PALETTE.flameOuter, 3.2);
    const mid = this.glow(PALETTE.flame, 3.6);
    const core = this.glow(PALETTE.flameCore, 4);
    const flameSpec = [
      [0, 0.22, 0.62, outer], [-0.22, 0.15, 0.42, outer], [0.24, 0.14, 0.45, outer],
      [0.05, 0.15, 0.45, mid], [-0.12, 0.11, 0.32, mid], [0.15, 0.1, 0.3, mid],
      [0, 0.08, 0.26, core],
    ];
    for (const [fx, r, h, m] of flameSpec) {
      const f = this.cone(g, r, h, m, fx, 0.3 + h / 2, zc + 0.06 + (m === core ? 0.08 : 0), { cast: false, receive: false });
      this.flames.push({ mesh: f, base: f.scale.clone(), y0: f.position.y, h, phase: rnd() * 10, speed: 9 + rnd() * 6 });
    }
    // Embers glowing on the hearth floor.
    const ember = this.glow(0xff3a0a, 3);
    for (let i = 0; i < 6; i++) {
      this.sphere(g, 0.035, ember, (rnd() - 0.5) * open * 0.8, 0.15, zc + (rnd() - 0.3) * 0.3, { cast: false });
    }

    const light = new THREE.PointLight(0xff8a3a, 12, 12, 1.4);
    light.position.set(0, 0.85, depth + 0.6);
    g.add(light);
    this.lights.push({ light, base: 12, amp: 0.18, speed: 13, phase: rnd() * 10 });
    return g;
  }

  // ---------- Furniture ----------

  candle(parent, x, y, z, { h = 0.14, holder = true } = {}) {
    if (holder) this.cyl(parent, 0.07, 0.025, this.mat(PALETTE.brass, { metalness: 0.6, roughness: 0.4 }), x, y + 0.012, z, { cast: false });
    this.cyl(parent, 0.035, h, this.mat(PALETTE.candle), x, y + 0.025 + h / 2, z, { cast: false, low: true });
    const f = this.cone(parent, 0.03, 0.09, this.glow(PALETTE.flameCore, 5), x, y + 0.025 + h + 0.05, z, { cast: false, receive: false });
    this.flames.push({ mesh: f, base: f.scale.clone(), y0: f.position.y, h: 0.09, phase: Math.random() * 10, speed: 14, small: true });
    return f;
  }

  rug(parent, x, z, w, d, { ry = 0, field = PALETTE.rugRed, band = PALETTE.rugGold, accent = PALETTE.rugBlue } = {}) {
    const g = this.group(parent, x, z, ry, 0.11);
    this.box(g, w, 0.05, d, this.mat(field, { roughness: 1 }), 0, 0.025, 0, { cast: false });
    // Gold border band (four strips) and inner accent band.
    const bm = this.mat(band, { roughness: 1 });
    const am = this.mat(accent, { roughness: 1 });
    const b = 0.12;
    for (const [bw, bd, bx, bz] of [
      [w - 0.2, b, 0, -d / 2 + 0.16], [w - 0.2, b, 0, d / 2 - 0.16],
      [b, d - 0.2, -w / 2 + 0.16, 0], [b, d - 0.2, w / 2 - 0.16, 0],
    ]) this.box(g, bw, 0.055, bd, bm, bx, 0.03, bz, { cast: false });
    for (const [bw, bd, bx, bz] of [
      [w - 0.7, 0.06, 0, -d / 2 + 0.38], [w - 0.7, 0.06, 0, d / 2 - 0.38],
      [0.06, d - 0.7, -w / 2 + 0.38, 0], [0.06, d - 0.7, w / 2 - 0.38, 0],
    ]) this.box(g, bw, 0.055, bd, am, bx, 0.03, bz, { cast: false });
    // Central medallion.
    const s = Math.min(w, d) * 0.32;
    this.box(g, s, 0.055, s, bm, 0, 0.03, 0, { ry: Math.PI / 4, cast: false });
    this.box(g, s * 0.6, 0.06, s * 0.6, am, 0, 0.032, 0, { ry: Math.PI / 4, cast: false });
    // Tassels on the short ends.
    const tm = this.mat(0xe8d5a8, { roughness: 1 });
    for (const side of [-1, 1]) {
      for (let i = 0; i < 9; i++) {
        this.box(g, 0.04, 0.02, 0.1, tm, -w / 2 + 0.2 + i * ((w - 0.4) / 8), 0.01, side * (d / 2 + 0.05), { cast: false });
      }
    }
    return g;
  }

  armchair(parent, x, z, ry, color) {
    const g = this.group(parent, x, z, ry);
    const fab = this.mat(color, { roughness: 0.95 });
    const fabLight = this.mat(new THREE.Color(color).offsetHSL(0, 0, 0.07).getHex(), { roughness: 0.95 });
    const leg = this.mat(PALETTE.woodDark);
    for (const lx of [-0.32, 0.32]) for (const lz of [-0.3, 0.3]) this.box(g, 0.08, 0.16, 0.08, leg, lx, 0.08, lz);
    this.box(g, 0.86, 0.28, 0.8, fab, 0, 0.3, 0);
    this.box(g, 0.62, 0.12, 0.6, fabLight, 0, 0.5, 0.06);
    this.box(g, 0.86, 0.9, 0.2, fab, 0, 0.75, -0.32);
    this.box(g, 0.66, 0.5, 0.08, fabLight, 0, 0.8, -0.2);
    for (const s of [-1, 1]) this.box(g, 0.14, 0.32, 0.78, fab, s * 0.39, 0.58, 0.01);
    return g;
  }

  stool(parent, x, z) {
    const g = this.group(parent, x, z);
    const wood = this.mat(PALETTE.wood);
    this.cyl(g, 0.2, 0.06, wood, 0, 0.5, 0);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      this.box(g, 0.04, 0.5, 0.04, this.mat(PALETTE.woodDark), Math.cos(a) * 0.12, 0.25, Math.sin(a) * 0.12, { rx: Math.sin(a) * 0.12, rz: -Math.cos(a) * 0.12 });
    }
    return g;
  }

  roundTable(parent, x, z, { r = 0.6, stools = 3, candle = true, seed = 1 } = {}) {
    const rnd = seededRandom(seed);
    const g = this.group(parent, x, z);
    const wood = this.mat(PALETTE.wood);
    const dark = this.mat(PALETTE.woodDark);
    this.cyl(g, r, 0.07, wood, 0, 0.78, 0);
    this.cyl(g, r * 1.02, 0.03, dark, 0, 0.735, 0, { cast: false });
    this.cyl(g, 0.07, 0.7, dark, 0, 0.39, 0, { low: true });
    this.cyl(g, 0.3, 0.05, dark, 0, 0.04, 0, { low: true });
    if (candle) this.candle(g, 0.05, 0.815, 0.05);
    this.plate(g, -r * 0.45, 0.815, r * 0.2);
    this.mug(g, r * 0.35, 0.815, -r * 0.3, 0xd9a441);
    for (let i = 0; i < stools; i++) {
      const a = (i / stools) * Math.PI * 2 + rnd() * 0.5;
      this.stool(g, Math.cos(a) * (r + 0.35), Math.sin(a) * (r + 0.35));
    }
    return g;
  }

  longTable(parent, x, z, { length = 2.8, ry = 0, cloth = true } = {}) {
    const g = this.group(parent, x, z, ry);
    const wood = this.mat(PALETTE.wood);
    const dark = this.mat(PALETTE.woodDark);
    this.box(g, length, 0.08, 1.0, wood, 0, 0.78, 0);
    for (const lx of [-length / 2 + 0.18, length / 2 - 0.18]) {
      for (const lz of [-0.38, 0.38]) this.box(g, 0.1, 0.74, 0.1, dark, lx, 0.37, lz);
    }
    this.box(g, length - 0.36, 0.06, 0.06, dark, 0, 0.25, 0, { cast: false });
    if (cloth) this.box(g, length * 0.55, 0.012, 1.04, this.mat(PALETTE.cloth, { roughness: 1 }), 0, 0.826, 0, { cast: false });
    this.candle(g, -0.25, 0.832, 0);
    this.candle(g, 0.25, 0.832, 0.05);
    this.plate(g, -length / 2 + 0.4, 0.82, 0.25);
    this.plate(g, length / 2 - 0.45, 0.82, -0.25);
    this.mug(g, length / 2 - 0.7, 0.82, 0.28, 0xe9c46a);
    this.mug(g, -length / 2 + 0.75, 0.82, -0.3, 0xe76f51);
    // Benches either side.
    for (const s of [-1, 1]) {
      this.box(g, length - 0.2, 0.08, 0.34, wood, 0, 0.46, s * 0.78);
      for (const lx of [-length / 2 + 0.3, length / 2 - 0.3]) this.box(g, 0.08, 0.42, 0.28, dark, lx, 0.21, s * 0.78);
    }
    return g;
  }

  plate(parent, x, y, z) {
    this.cyl(parent, 0.13, 0.02, this.mat(0xf4efe4, { roughness: 0.5 }), x, y + 0.01, z, { cast: false });
    this.sphere(parent, 0.05, this.mat(0xd98a3a), x, y + 0.04, z, { cast: false });
  }

  mug(parent, x, y, z, color = 0xe9c46a) {
    this.cyl(parent, 0.065, 0.14, this.mat(color, { roughness: 0.6 }), x, y + 0.07, z, { low: true });
    this.box(parent, 0.03, 0.08, 0.05, this.mat(color, { roughness: 0.6 }), x + 0.08, y + 0.07, z, { cast: false });
  }

  bottle(parent, x, y, z, color) {
    const m = this.mat(color, { roughness: 0.25, metalness: 0.1, emissive: color, emissiveIntensity: 0.15 });
    this.cyl(parent, 0.055, 0.2, m, x, y + 0.1, z, { low: true, cast: false });
    this.cyl(parent, 0.022, 0.1, m, x, y + 0.25, z, { low: true, cast: false });
  }

  barrel(parent, x, y, z, { r = 0.36, h = 0.82, lying = false, ry = 0 } = {}) {
    const g = this.group(parent, x, z, ry, y);
    const inner = new THREE.Group();
    if (lying) { inner.rotation.z = Math.PI / 2; inner.position.y = r; } else { inner.position.y = h / 2; }
    g.add(inner);
    const body = new THREE.Mesh(BARREL_GEO, this.mat(0x7a4a2a, { roughness: 0.9 }));
    body.scale.set(r, h, r);
    body.castShadow = true;
    body.receiveShadow = true;
    inner.add(body);
    const hoop = this.mat(0x2a221e, { metalness: 0.5, roughness: 0.5 });
    for (const [hy, hr] of [[-0.38, 0.9], [-0.18, 0.98], [0.18, 0.98], [0.38, 0.9]]) {
      this.cyl(inner, r * hr + 0.012, 0.04, hoop, 0, hy * h, 0, { cast: false });
    }
    for (const s of [-1, 1]) {
      const lid = new THREE.Mesh(BARREL_LID, this.mat(0x5c371e, { roughness: 0.9 }));
      lid.scale.set(r, r, 1);
      lid.rotation.x = s * -Math.PI / 2;
      lid.position.y = s * (h / 2 - 0.005);
      inner.add(lid);
    }
    return g;
  }

  crate(parent, x, z, s = 0.6, ry = 0, y = 0) {
    const g = this.group(parent, x, z, ry, y);
    this.box(g, s, s, s, this.mat(0x9a7046), 0, s / 2, 0);
    const slat = this.mat(PALETTE.woodDark);
    for (const sz of [-1, 1]) {
      this.box(g, s + 0.02, 0.08, 0.03, slat, 0, s * 0.2, sz * (s / 2 + 0.005), { cast: false });
      this.box(g, s + 0.02, 0.08, 0.03, slat, 0, s * 0.8, sz * (s / 2 + 0.005), { cast: false });
    }
    return g;
  }

  plant(parent, x, z, y = 0) {
    const g = this.group(parent, x, z, 0, y);
    this.cyl(g, 0.16, 0.26, this.mat(PALETTE.pot), 0, 0.13, 0, { low: true });
    this.sphere(g, 0.2, this.mat(PALETTE.plant, { roughness: 0.9 }), 0, 0.36, 0);
    this.sphere(g, 0.13, this.mat(0x4e9e46, { roughness: 0.9 }), 0.1, 0.46, 0.05);
    this.sphere(g, 0.04, this.mat(0xe64a6a), -0.08, 0.5, 0.08, { cast: false });
    return g;
  }

  // Bar counter running along local X. Front faces +z.
  bar(parent, x, z, length, ry = 0) {
    const g = this.group(parent, x, z, ry);
    const body = this.mat(PALETTE.woodRed, { roughness: 0.7 });
    const trim = this.mat(PALETTE.woodRedDark, { roughness: 0.6 });
    const top = this.mat(0x2e140c, { roughness: 0.45 });
    this.box(g, length, 1.0, 0.6, body, 0, 0.5, 0);
    this.box(g, length + 0.2, 0.08, 0.8, top, 0, 1.04, 0.06);
    this.box(g, length + 0.04, 0.12, 0.64, trim, 0, 0.06, 0, { cast: false });
    // Raised panels on the front.
    const panels = Math.max(2, Math.round(length / 0.8));
    const pw = length / panels;
    for (let i = 0; i < panels; i++) {
      this.box(g, pw - 0.18, 0.62, 0.03, trim, -length / 2 + pw * (i + 0.5), 0.55, 0.31, { cast: false });
    }
    // Brass foot rail.
    this.cyl(g, 0.025, length - 0.2, this.mat(PALETTE.brass, { metalness: 0.7, roughness: 0.3 }), 0, 0.22, 0.42, { rz: Math.PI / 2, cast: false });
    // Things on the counter.
    this.candle(g, -length / 2 + 0.5, 1.08, 0.1);
    this.candle(g, length / 2 - 0.6, 1.08, 0.12);
    this.mug(g, -0.4, 1.08, 0.15, 0xe9c46a);
    this.mug(g, 0.1, 1.08, 0.2, 0xf4a261);
    this.mug(g, 0.9, 1.08, 0.1, 0xe76f51);
    this.bottle(g, 0.5, 1.08, -0.1, 0x2e7d32);
    return g;
  }

  // Wall shelf with bottles. Local: wall at z=0, shelf sticks out towards +z.
  bottleShelf(parent, x, z, ry, length, { rows = 2, y0 = 1.45, seed = 5 } = {}) {
    const rnd = seededRandom(seed);
    const g = this.group(parent, x, z, ry);
    const wood = this.mat(PALETTE.woodDark);
    const colors = [0x1f6b3a, 0x2a4f9a, 0x8a2c2c, 0x6b3a8a, 0xb0802a, 0x2c7a7a];
    for (let r = 0; r < rows; r++) {
      const y = y0 + r * 0.55;
      this.box(g, length, 0.06, 0.3, wood, 0, y, 0.15);
      for (const s of [-1, 1]) this.box(g, 0.05, 0.16, 0.05, wood, s * (length / 2 - 0.15), y - 0.1, 0.06, { cast: false });
      const n = Math.floor(length / 0.17);
      for (let i = 0; i < n; i++) {
        if (rnd() < 0.15) continue;
        this.bottle(g, -length / 2 + 0.12 + i * ((length - 0.24) / (n - 1)), y + 0.03, 0.15, colors[Math.floor(rnd() * colors.length)]);
      }
    }
    return g;
  }

  // Candle-ring chandelier hanging from the (hidden) ceiling.
  chandelier(parent, x, z, { y = 2.55, r = 0.85, top = 3.4, candles = 6 } = {}) {
    const g = this.group(parent, x, z, 0, y);
    const iron = this.mat(0x2b2523, { metalness: 0.6, roughness: 0.45 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.035, 6, 28), this.mat(PALETTE.brass, { metalness: 0.6, roughness: 0.35 }));
    ring.rotation.x = Math.PI / 2;
    ring.castShadow = true;
    g.add(ring);
    for (let i = 0; i < 3; i++) this.box(g, r * 2, 0.03, 0.03, iron, 0, 0, 0, { ry: (i / 3) * Math.PI, cast: false });
    this.cyl(g, 0.012, top - y, iron, 0, (top - y) / 2, 0, { cast: false, low: true });
    for (let i = 0; i < candles; i++) {
      const a = (i / candles) * Math.PI * 2;
      this.candle(g, Math.cos(a) * r, 0.02, Math.sin(a) * r, { h: 0.12 });
    }
    const light = new THREE.PointLight(0xffb060, 11, 13, 1.3);
    light.position.set(0, -0.2, 0);
    g.add(light);
    this.lights.push({ light, base: 11, amp: 0.08, speed: 7, phase: Math.random() * 10 });
    return g;
  }

  // Window set into a wall. Local: wall plane at z=0, thickness t.
  window(parent, x, y, z, ry, { w = 0.9, h = 1.1, t = 0.3 } = {}) {
    const g = this.group(parent, x, z, ry, y);
    const frame = this.mat(0x3a2416, { roughness: 0.7 });
    const glass = this.mat(PALETTE.glass, { emissive: 0x9fd2ee, emissiveIntensity: 0.55, roughness: 0.15 });
    this.box(g, w, h, t + 0.02, glass, 0, 0, 0, { cast: false });
    for (const s of [-1, 1]) {
      this.box(g, 0.1, h + 0.12, t + 0.08, frame, s * (w / 2 + 0.04), 0, 0, { cast: false });
      this.box(g, w + 0.18, 0.1, t + 0.08, frame, 0, s * (h / 2 + 0.04), 0, { cast: false });
    }
    this.box(g, 0.05, h, t + 0.06, frame, 0, 0, 0, { cast: false });
    this.box(g, w, 0.05, t + 0.06, frame, 0, 0, 0, { cast: false });
    // Sill on both faces.
    this.box(g, w + 0.3, 0.06, t + 0.24, frame, 0, -h / 2 - 0.1, 0, { cast: false });
    return g;
  }

  banner(parent, x, y, z, ry, { color = PALETTE.banner, emblem = PALETTE.rugGold } = {}) {
    const g = this.group(parent, x, z, ry, y);
    this.cyl(g, 0.03, 1.0, this.mat(PALETTE.woodDark), 0, 0.05, 0.06, { rz: Math.PI / 2, cast: false });
    this.box(g, 0.8, 1.1, 0.03, this.mat(color, { roughness: 1 }), 0, -0.55, 0.06, { cast: false });
    this.cone(g, 0.4, 0.3, this.mat(color, { roughness: 1 }), 0, -1.2, 0.06, { rz: Math.PI, cast: false });
    this.box(g, 0.32, 0.32, 0.035, this.mat(emblem, { roughness: 0.6, metalness: 0.3 }), 0, -0.6, 0.07, { rz: Math.PI / 4, cast: false });
    return g;
  }

  plateRack(parent, x, y, z, ry) {
    const g = this.group(parent, x, z, ry, y);
    this.box(g, 1.3, 0.05, 0.22, this.mat(PALETTE.woodDark), 0, 0, 0.11);
    const m = this.mat(0xe8e0cc, { roughness: 0.5 });
    const b = this.mat(0x3a6ea5, { roughness: 0.5 });
    for (let i = 0; i < 4; i++) {
      this.cyl(g, 0.16, 0.025, i % 2 ? b : m, -0.45 + i * 0.3, 0.17, 0.08, { rx: Math.PI / 2 - 0.25, cast: false });
    }
    return g;
  }
}

// Full tavern interior, laid out after the reference scene:
// fireplace on the left wall, bar along the back wall, dining towards the front.
// Local coordinates: room spans x in [-w/2, w/2], z in [-d/2, d/2]; door in the middle of +z.
export function furnishTavern(kit, room, { w, d, wallH, wallT }, api) {
  const hw = w / 2;
  const hd = d / 2;
  const inL = -hw + wallT / 2; // inner face of left wall
  const inB = -hd + wallT / 2; // inner face of back wall

  // Fireplace + cosy corner.
  kit.fireplace(room, inL, -1.0, Math.PI / 2, { width: 2.6, wallH, chimneyTop: wallH + 2.6 });
  api.collider(inL + 0.5, -1.0, 1.25);
  kit.rug(room, inL + 2.7, -1.0, 2.6, 3.6);
  kit.armchair(room, inL + 2.6, -2.35, -0.95, PALETTE.chairRed);
  kit.armchair(room, inL + 2.6, 0.35, -2.2, PALETTE.chairBlue);
  api.collider(inL + 2.6, -2.35, 0.5);
  api.collider(inL + 2.6, 0.35, 0.5);
  const side = kit.roundTable(room, inL + 3.1, -1.0, { r: 0.32, stools: 0 });
  void side;
  api.collider(inL + 3.1, -1.0, 0.35);

  // Bar along the back wall, bottle shelves and barrels behind it.
  const barX = 2.0;
  const barZ = inB + 1.45;
  kit.bar(room, barX, barZ, 5.0);
  for (let x = barX - 2.3; x <= barX + 2.31; x += 0.66) api.collider(x, barZ, 0.42);
  kit.bottleShelf(room, barX, inB, 0, 3.6, { rows: 2, y0: 1.5 });
  for (const sx of [0.4, 1.5, 2.6, 3.7]) kit.stool(room, sx, barZ + 0.85);
  // Barrel rack at the end of the bar.
  const rackX = hw - 1.25;
  kit.box(room, 1.9, 0.2, 0.9, kit.mat(PALETTE.woodDark), rackX, 0.1, inB + 0.55);
  for (let i = 0; i < 3; i++) kit.barrel(room, rackX - 0.6 + i * 0.6, 0.2, inB + 0.55, { r: 0.28, h: 0.7, lying: true, ry: Math.PI / 2 });
  kit.barrel(room, rackX - 0.3, 0.76, inB + 0.55, { r: 0.26, h: 0.66, lying: true, ry: Math.PI / 2 });
  api.collider(rackX, inB + 0.6, 0.9);
  api.character(0xc0392b, barX + 0.4, inB + 0.6, 0); // barkeep behind the counter
  const barLight = new THREE.PointLight(0xffa64d, 6, 7, 1.5);
  barLight.position.set(barX, 2.1, barZ + 0.4);
  room.add(barLight);
  kit.lights.push({ light: barLight, base: 6, amp: 0.05, speed: 5, phase: 1 });

  // Long table with cloth, right-front.
  kit.longTable(room, 3.4, 1.9, { length: 3.0 });
  for (const x of [2.3, 3.4, 4.5]) api.collider(x, 1.9, 0.85);
  // Round tables.
  kit.roundTable(room, -3.6, 3.1, { r: 0.6, stools: 3, seed: 4 });
  api.collider(-3.6, 3.1, 0.75);
  kit.roundTable(room, hw - 1.5, -1.3, { r: 0.55, stools: 3, seed: 9 });
  api.collider(hw - 1.5, -1.3, 0.7);
  api.character(0x7b4fa0, -2.55, 3.55, -2.4); // patron at the round table

  // Chandelier over the middle of the room.
  kit.chandelier(room, 1.4, 0.2, { y: wallH - 0.5, top: wallH + 0.4 });

  // Barrels, crates and plants in the corners.
  kit.barrel(room, hw - 0.55, 0, hd - 0.6);
  kit.barrel(room, hw - 1.25, 0, hd - 0.5, { r: 0.32, h: 0.74 });
  kit.crate(room, hw - 0.6, hd - 1.35, 0.55, 0.3);
  api.collider(hw - 0.9, hd - 0.8, 0.85);
  kit.barrel(room, -hw + 0.55, 0, hd - 0.6);
  kit.plant(room, -hw + 1.3, hd - 0.45);
  api.collider(-hw + 0.8, hd - 0.6, 0.6);
  kit.plant(room, -hw + 0.5, inB + 0.5);
  kit.crate(room, -hw + 0.6, -hd + 1.3, 0.5, -0.2);

  // Wall decoration on the two walls that stay up.
  kit.banner(room, -3.0, wallH - 0.25, inB, 0);
  kit.plateRack(room, inL, 1.9, 2.9, Math.PI / 2);
  kit.window(room, -hw, 1.55, -3.9, Math.PI / 2, { t: wallT });
  kit.window(room, -hw, 1.55, 1.7, Math.PI / 2, { t: wallT });
  kit.window(room, -5.4, 1.55, -hd, 0, { t: wallT });
  kit.window(room, -0.9, 1.55, -hd, 0, { t: wallT });
}
