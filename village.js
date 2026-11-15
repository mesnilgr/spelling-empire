import * as THREE from 'three';
import { seededRandom } from './interiors.js';

// Voxel-style village exterior: pixel textures (nearest filtering) and box-built props,
// so the outside matches the blocky characters and the furnished interiors.

function pixelTexture(size, draw, repeat = 1) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  draw(c.getContext('2d'), size);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestMipmapLinearFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function speckle(g, size, palette, rnd) {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      g.fillStyle = palette[Math.floor(rnd() * palette.length)];
      g.fillRect(x, y, 1, 1);
    }
  }
}

const GRASS = ['#5f9e3e', '#5a9639', '#67a843', '#6fae48', '#548e35', '#62a23f', '#7bb84f'];
const DIRT = ['#a8865a', '#9c7b50', '#b39064', '#8f6f47', '#a07e54', '#b89a6c'];
const STONE = ['#8d8a86', '#7f7c78', '#9a9792', '#75726e', '#a3a09b'];
const LEAVES = ['#3f8a3a', '#357a33', '#4a9a40', '#2f6f2f', '#55a548', '#3a8236'];
const BARK = ['#6b4a2c', '#5e4026', '#76532f', '#543a22'];

export class VillageBuilder {
  constructor(scene, kit, ctx) {
    this.scene = scene;
    this.kit = kit;
    this.ctx = ctx; // { houses, collidables, waterMats, insideAnyHouse }
    this.rnd = seededRandom(2024);
    this.tex = {
      grass: pixelTexture(16, (g, s) => speckle(g, s, GRASS, seededRandom(1))),
      dirt: pixelTexture(16, (g, s) => {
        speckle(g, s, DIRT, seededRandom(2));
        const r = seededRandom(3);
        for (let i = 0; i < 6; i++) { g.fillStyle = r() > 0.5 ? '#7d7a76' : '#c9b48c'; g.fillRect(Math.floor(r() * s), Math.floor(r() * s), 2, 1); }
      }),
      stone: pixelTexture(16, (g, s) => {
        speckle(g, s, STONE, seededRandom(4));
        g.fillStyle = '#5c5a57';
        for (let y = 0; y < s; y += 4) g.fillRect(0, y, s, 1);
        for (let y = 0; y < s; y += 4) for (let x = (y / 4) % 2 ? 2 : 6; x < s; x += 8) g.fillRect(x, y, 1, 4);
      }),
      leaves: pixelTexture(8, (g, s) => {
        speckle(g, s, LEAVES, seededRandom(5));
        g.fillStyle = '#6fbf55';
        g.fillRect(1, 1, 1, 1); g.fillRect(5, 3, 1, 1); g.fillRect(2, 6, 1, 1);
      }),
      bark: pixelTexture(8, (g, s) => {
        speckle(g, s, BARK, seededRandom(6));
        g.fillStyle = '#3e2a18';
        for (let x = 1; x < s; x += 3) g.fillRect(x, 0, 1, s);
      }),
      wheat: pixelTexture(8, (g, s) => speckle(g, s, ['#e2c25a', '#d8b44a', '#ecd06e', '#c9a43e'], seededRandom(7))),
    };
    this.mats = {
      leaves: new THREE.MeshStandardMaterial({ map: this.tex.leaves, roughness: 0.9 }),
      leavesDark: new THREE.MeshStandardMaterial({ map: this.tex.leaves, color: 0xb8d8a8, roughness: 0.9 }),
      bark: new THREE.MeshStandardMaterial({ map: this.tex.bark, roughness: 0.95 }),
      stone: new THREE.MeshStandardMaterial({ map: this.tex.stone, roughness: 0.95 }),
      wood: new THREE.MeshStandardMaterial({ color: 0x8a5a32, roughness: 0.85 }),
      woodDark: new THREE.MeshStandardMaterial({ color: 0x5a3820, roughness: 0.85 }),
      wheat: new THREE.MeshStandardMaterial({ map: this.tex.wheat, roughness: 0.9 }),
      lantern: new THREE.MeshStandardMaterial({ color: 0xffc46a, emissive: 0xffb04a, emissiveIntensity: 2.2 }),
      iron: new THREE.MeshStandardMaterial({ color: 0x2b2523, metalness: 0.4, roughness: 0.5 }),
    };
    this.unitBox = new THREE.BoxGeometry(1, 1, 1);
  }

  box(parent, w, h, d, mat, x, y, z, o = {}) {
    const m = new THREE.Mesh(this.unitBox, mat);
    m.scale.set(w, h, d);
    m.position.set(x, y, z);
    if (o.ry) m.rotation.y = o.ry;
    m.castShadow = o.cast !== false;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  // Footprints of houses plus a margin, used to keep props off buildings and paths.
  blocked(x, z, margin = 0.8) {
    if (this.ctx.insideAnyHouse(x, z, margin)) return true;
    for (const p of this.paths ?? []) {
      if (Math.abs(x - p.x) < p.w / 2 + margin * 0.6 && Math.abs(z - p.z) < p.d / 2 + margin * 0.6) return true;
    }
    if (Math.hypot(x - 22, z + 22) < 11) return true; // quarry and its rocky hill
    return Math.hypot(x, z) < 3.2; // fountain plaza
  }

  build() {
    this.buildGround();
    this.buildPaths();
    this.buildFountain();
    this.buildPond();
    this.buildField();
    this.buildTrees();
    this.buildLamps();
    this.buildRocksAndBushes();
    this.buildGrassAndFlowers();
  }

  buildGround() {
    const size = 200;
    const seg = 100;
    const geo = new THREE.PlaneGeometry(size, size, seg, seg);
    geo.rotateX(-Math.PI / 2);
    // Large, soft colour patches on top of the pixel grass so the lawn doesn't look tiled.
    const colors = [];
    const pos = geo.attributes.position;
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const n = Math.sin(x * 0.21) * Math.cos(z * 0.17) + Math.sin(x * 0.07 + z * 0.11) * 0.8 + Math.sin(z * 0.43 + 1.3) * 0.25;
      const k = 0.92 + n * 0.06;
      const far = Math.min(1, Math.max(0, (Math.hypot(x, z) - 30) / 25));
      c.setRGB(k * (1 - far * 0.18), k * (1 - far * 0.08), k * (1 - far * 0.2));
      // Deeper green in the forest (west), olive in the marsh (east).
      const fo = Math.min(1, Math.max(0, (-x - 40) / 8)), ma = Math.min(1, Math.max(0, (x - 40) / 8));
      if (fo) c.setRGB(c.r * (1 - fo * 0.35), c.g * (1 - fo * 0.12), c.b * (1 - fo * 0.3));
      if (ma) c.setRGB(c.r * (1 + ma * 0.08), c.g * (1 - ma * 0.08), c.b * (1 - ma * 0.45));
      // Sand on the coast (south).
      const sa = Math.min(1, Math.max(0, (z - 54) / 5));
      if (sa) c.lerp(new THREE.Color(1.45, 1.3, 0.85), sa * 0.85);
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    this.tex.grass.repeat.set(size / 1.6, size / 1.6);
    const mat = new THREE.MeshStandardMaterial({ map: this.tex.grass, vertexColors: true, roughness: 0.95 });
    const ground = new THREE.Mesh(geo, mat);
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  // Axis-aligned dirt paths (x, z centre; w along x; d along z), joined at the fountain.
  buildPaths() {
    const doorPaths = [];
    for (const h of this.ctx.houses) {
      const doorX = h.center.x;
      const doorZ = h.center.z + h.d / 2;
      doorPaths.push({ doorX, doorZ, h });
    }
    const P = (x0, x1, z0, z1) => ({ x: (x0 + x1) / 2, z: (z0 + z1) / 2, w: Math.abs(x1 - x0), d: Math.abs(z1 - z0) });
    this.paths = [
      P(-16, 16, -1.3, 1.3), // main east-west road
      P(-1.3, 1.3, -11.6, 11.6), // main north-south road
      P(-10.8, -9.2, -3.5, 0), // forge
      P(7.2, 8.8, -5.5, 0), // shop
      P(-3.2, 0, -11.6, -10.2), // guild
      P(11.2, 12.8, 8, 10.4), P(0, 12.8, 9.0, 10.4), // tower
      P(-13.8, -12.2, 12.5, 15.0), P(-13.8, -3.7, 13.6, 15.0), P(-5.3, -3.7, 1.3, 15.0), // tavern
      P(-1.2, 1.2, 16, 17.6), // cottage doorstep
    ];
    void doorPaths;
    const mat = new THREE.MeshStandardMaterial({ map: this.tex.dirt, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1 });
    this.paths.forEach((p, i) => {
      const geo = new THREE.PlaneGeometry(p.w, p.d);
      geo.rotateX(-Math.PI / 2);
      // Scale UVs so the pixel texture keeps the same size on every path.
      const uv = geo.attributes.uv;
      for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * p.w / 1.6, uv.getY(k) * p.d / 1.6);
      const m = new THREE.Mesh(geo, mat);
      m.position.set(p.x, 0.012 + i * 0.0005, p.z);
      m.receiveShadow = true;
      this.scene.add(m);
    });
    // Edge stones along the two main roads.
    const r = this.rnd;
    for (let x = -15.5; x <= 15.5; x += 1.1) {
      for (const s of [-1, 1]) {
        if (Math.abs(x) < 2.2) continue;
        if (r() < 0.35) continue;
        this.box(this.scene, 0.35 + r() * 0.25, 0.12, 0.3, this.mats.stone, x + r() * 0.3, 0.06, s * 1.45, { ry: r() * 0.5, cast: false });
      }
    }
    for (let z = -11; z <= 11; z += 1.1) {
      for (const s of [-1, 1]) {
        if (Math.abs(z) < 2.2) continue;
        if (r() < 0.35) continue;
        this.box(this.scene, 0.3, 0.12, 0.35 + r() * 0.25, this.mats.stone, s * 1.45, 0.06, z + r() * 0.3, { ry: r() * 0.5, cast: false });
      }
    }
  }

  buildFountain() {
    const g = new THREE.Group();
    this.scene.add(g);
    // Cobbled plaza.
    const plaza = new THREE.Mesh(new THREE.CircleGeometry(3.2, 8), new THREE.MeshStandardMaterial({ map: this.tex.stone, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 }));
    plaza.rotation.x = -Math.PI / 2;
    plaza.rotation.z = Math.PI / 8;
    plaza.position.y = 0.02;
    plaza.receiveShadow = true;
    g.add(plaza);
    // Octagonal basin from stone blocks.
    const R = 1.55;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const b = this.box(g, 1.25, 0.55, 0.32, this.mats.stone, Math.cos(a) * R, 0.275, Math.sin(a) * R);
      b.rotation.y = -a + Math.PI / 2;
      const cap = this.box(g, 1.32, 0.1, 0.42, this.mats.stone, Math.cos(a) * R, 0.6, Math.sin(a) * R);
      cap.rotation.y = -a + Math.PI / 2;
    }
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x4aa3d8, transparent: true, opacity: 0.78, roughness: 0.1, metalness: 0.2, emissive: 0x1a5a8a, emissiveIntensity: 0.25 });
    this.ctx.waterMats.push(waterMat);
    const water = new THREE.Mesh(new THREE.CircleGeometry(1.45, 8), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.rotation.z = Math.PI / 8;
    water.position.y = 0.42;
    g.add(water);
    // Central column with a bowl and a spout.
    this.box(g, 0.5, 1.1, 0.5, this.mats.stone, 0, 0.55, 0);
    this.box(g, 1.0, 0.18, 1.0, this.mats.stone, 0, 1.15, 0);
    this.box(g, 0.3, 0.45, 0.3, this.mats.stone, 0, 1.45, 0);
    const jetMat = new THREE.MeshStandardMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.55, emissive: 0x7ac0ff, emissiveIntensity: 0.4 });
    this.fountainJets = [];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const jet = this.box(g, 0.08, 0.5, 0.08, jetMat, Math.cos(a) * 0.45, 1.05, Math.sin(a) * 0.45, { cast: false });
      jet.rotation.z = Math.cos(a) * 0.5;
      jet.rotation.x = -Math.sin(a) * 0.5;
      jet.userData.dynamic = true;
      this.fountainJets.push(jet);
    }
    this.ctx.collidables.push({ x: 0, z: 0, r: 1.9 });
  }

  buildPond() {
    const cx = -16;
    const cz = -16;
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x3f8fc8, transparent: true, opacity: 0.82, roughness: 0.08, metalness: 0.3, emissive: 0x123a5a, emissiveIntensity: 0.3 });
    this.ctx.waterMats.push(waterMat);
    const water = new THREE.Mesh(new THREE.CircleGeometry(3.2, 12), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(cx, 0.04, cz);
    this.scene.add(water);
    const r = this.rnd;
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const s = 0.4 + r() * 0.35;
      this.box(this.scene, s, 0.2 + r() * 0.25, s, this.mats.stone, cx + Math.cos(a) * 3.3, 0.1, cz + Math.sin(a) * 3.3, { ry: r() * 1.5 });
    }
    const pad = new THREE.MeshStandardMaterial({ color: 0x4f9e3a, roughness: 0.8 });
    const bloom = new THREE.MeshStandardMaterial({ color: 0xff9ad0, emissive: 0xff7ac0, emissiveIntensity: 0.3 });
    for (const [px, pz, f] of [[1.2, 0.8, true], [-1.4, 1.1, false], [0.4, -1.6, true], [-0.6, -0.4, false], [1.9, -0.9, false]]) {
      this.box(this.scene, 0.55, 0.03, 0.55, pad, cx + px, 0.06, cz + pz, { ry: px, cast: false });
      if (f) this.box(this.scene, 0.14, 0.12, 0.14, bloom, cx + px, 0.13, cz + pz, { cast: false });
    }
    // Reeds.
    for (let i = 0; i < 10; i++) {
      const a = r() * Math.PI * 2;
      const x = cx + Math.cos(a) * 3.0;
      const z = cz + Math.sin(a) * 3.0;
      for (let k = 0; k < 3; k++) this.box(this.scene, 0.05, 0.6 + r() * 0.4, 0.05, this.mats.leavesDark, x + (r() - 0.5) * 0.3, 0.35, z + (r() - 0.5) * 0.3, { cast: false });
    }
    this.ctx.collidables.push({ x: cx, z: cz, r: 3.2, water: true });
  }

  // Fenced wheat field next to the cottage.
  buildField() {
    const x0 = 5.5, x1 = 10.5, z0 = 12.4, z1 = 15.8;
    const soil = new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 1 });
    this.box(this.scene, x1 - x0, 0.08, z1 - z0, soil, (x0 + x1) / 2, 0.04, (z0 + z1) / 2, { cast: false });
    for (let x = x0 + 0.35; x < x1 - 0.2; x += 0.55) {
      for (let z = z0 + 0.35; z < z1 - 0.2; z += 0.55) {
        const h = 0.45 + this.rnd() * 0.2;
        this.box(this.scene, 0.3, h, 0.3, this.mats.wheat, x, 0.08 + h / 2, z, { cast: false });
      }
    }
    // Fence posts and rails.
    const fence = (ax, az, bx, bz) => {
      const len = Math.hypot(bx - ax, bz - az);
      const n = Math.max(1, Math.round(len / 1.0));
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        this.box(this.scene, 0.14, 0.8, 0.14, this.mats.wood, ax + (bx - ax) * t, 0.4, az + (bz - az) * t);
      }
      for (const y of [0.35, 0.65]) {
        const rail = this.box(this.scene, len, 0.08, 0.06, this.mats.woodDark, (ax + bx) / 2, y, (az + bz) / 2);
        rail.rotation.y = -Math.atan2(bz - az, bx - ax);
      }
    };
    fence(x0, z0, x1, z0);
    fence(x1, z0, x1, z1);
    fence(x0, z1, x1, z1);
    fence(x0, z0, x0, z1 - 1.2);
    this.ctx.collidables.push({ x: (x0 + x1) / 2, z: (z0 + z1) / 2, r: 1.9 });
    this.ctx.collidables.push({ x: x0 + 0.9, z: (z0 + z1) / 2, r: 1.5 });
    this.ctx.collidables.push({ x: x1 - 0.9, z: (z0 + z1) / 2, r: 1.5 });
    // Scarecrow.
    const sc = new THREE.Group();
    sc.position.set(8, 0, 14.1);
    this.scene.add(sc);
    this.box(sc, 0.1, 1.6, 0.1, this.mats.woodDark, 0, 0.8, 0);
    this.box(sc, 1.0, 0.1, 0.1, this.mats.woodDark, 0, 1.25, 0);
    this.box(sc, 0.45, 0.55, 0.25, new THREE.MeshStandardMaterial({ color: 0x3a6ea5 }), 0, 1.15, 0);
    this.box(sc, 0.36, 0.36, 0.36, this.mats.wheat, 0, 1.62, 0);
    this.box(sc, 0.5, 0.06, 0.5, new THREE.MeshStandardMaterial({ color: 0x8a5a32 }), 0, 1.83, 0);
    this.box(sc, 0.3, 0.2, 0.3, new THREE.MeshStandardMaterial({ color: 0x8a5a32 }), 0, 1.95, 0);
  }

  voxelTree(x, z, scale, variant) {
    const g = new THREE.Group();
    g.position.set(x, this.ctx.heightAt(x, z), z);
    g.scale.setScalar(scale);
    g.rotation.y = this.rnd() * Math.PI;
    this.scene.add(g);
    const r = this.rnd;
    if (variant === 'pine') {
      this.box(g, 0.4, 1.4, 0.4, this.mats.bark, 0, 0.7, 0);
      const layers = [[2.0, 1.2], [1.6, 2.0], [1.15, 2.7], [0.7, 3.3], [0.35, 3.75]];
      for (const [s, y] of layers) this.box(g, s, 0.6, s, this.mats.leavesDark, 0, y, 0);
    } else {
      const h = 1.4 + r() * 0.5;
      this.box(g, 0.45, h, 0.45, this.mats.bark, 0, h / 2, 0);
      this.box(g, 0.2, 0.2, 0.7, this.mats.bark, 0.2, h * 0.7, 0.3, { cast: false });
      // Canopy: a big cube surrounded by smaller ones.
      this.box(g, 2.0, 1.4, 2.0, this.mats.leaves, 0, h + 0.6, 0);
      this.box(g, 1.3, 0.7, 1.3, this.mats.leaves, 0, h + 1.6, 0);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + r();
        const s = 0.7 + r() * 0.4;
        this.box(g, s, s * 0.8, s, i % 2 ? this.mats.leavesDark : this.mats.leaves, Math.cos(a) * 1.05, h + 0.3 + r() * 0.6, Math.sin(a) * 1.05);
      }
      if (r() < 0.35) {
        const apple = new THREE.MeshStandardMaterial({ color: 0xd8382e, roughness: 0.5 });
        for (let i = 0; i < 4; i++) this.box(g, 0.14, 0.14, 0.14, apple, (r() - 0.5) * 2.05, h + 0.2 + r() * 1.0, (r() - 0.5) * 2.05, { cast: false });
      }
    }
    this.ctx.collidables.push({ x, z, r: 0.4 * scale });
    return g;
  }

  buildTrees() {
    const fixed = [
      [-18, -10], [-24, 3], [-22, -2], [18, -12], [20, 8], [22, -4],
      [-8, 17.5], [-17, 16.5], [13, 18], [17, 14], [-24, 12], [24, -16],
      [-6, -20], [4, -20], [-10, -22], [10, -22], [15, -3], [-20, -21], [20, 19],
    ];
    this.treeSpots = [];
    for (const [x, z] of fixed) {
      if (this.blocked(x, z, 1.2)) continue;
      const scale = 0.85 + this.rnd() * 0.35;
      this.voxelTree(x, z, scale, this.rnd() < 0.3 ? 'pine' : 'oak');
      this.treeSpots.push({ x, z, y: this.ctx.heightAt(x, z), scale });
    }
    // Trees closest to the village square first (used as wood nodes).
    this.treeSpots.sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z));
    // A forest ring frames the village.
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * Math.PI * 2 + this.rnd() * 0.08;
      const rad = 27 + this.rnd() * 6;
      const x = Math.cos(a) * rad;
      const z = Math.sin(a) * rad;
      if (Math.hypot(x - 22, z + 22) < 11) continue; // keep the quarry clear
      this.voxelTree(x, z, 0.9 + this.rnd() * 0.5, this.rnd() < 0.45 ? 'pine' : 'oak');
    }
  }

  buildLamps() {
    const spots = [[2.2, 5], [-2.2, -5], [2.2, -9], [-2.2, 9], [6, 2.2], [-6, -2.2], [12, -2.2], [-12, -2.2], [-14.6, 15.6]];
    for (const [x, z] of spots) {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      this.scene.add(g);
      this.box(g, 0.3, 0.2, 0.3, this.mats.stone, 0, 0.1, 0);
      this.box(g, 0.12, 2.3, 0.12, this.mats.iron, 0, 1.25, 0);
      this.box(g, 0.34, 0.08, 0.34, this.mats.iron, 0, 2.42, 0);
      this.box(g, 0.24, 0.3, 0.24, this.mats.lantern, 0, 2.25, 0, { cast: false });
      // Lamp light that only shines at night (handled by the day/night cycle).
      this.kit.pointLight(this.scene, 0xffc46a, 4, 8, 1.6, x, 2.2, z, { amp: 0.04, speed: 4 }).userData.night = true;
      this.box(g, 0.3, 0.06, 0.3, this.mats.iron, 0, 2.08, 0);
      this.ctx.collidables.push({ x, z, r: 0.22 });
    }
  }

  buildRocksAndBushes() {
    const r = this.rnd;
    const bush = new THREE.MeshStandardMaterial({ map: this.tex.leaves, color: 0xd8f0c0, roughness: 0.9 });
    for (let i = 0; i < 40; i++) {
      const x = (r() - 0.5) * 50;
      const z = (r() - 0.5) * 50;
      if (this.blocked(x, z, 1.0)) continue;
      const y0 = this.ctx.heightAt(x, z);
      // Rocks and bushes near the village can be mined (pickaxe / axe): keep them in their own group.
      const minable = Math.hypot(x, z) < 26;
      const parent = minable ? new THREE.Group() : this.scene;
      if (minable) { parent.userData.dynamic = true; this.scene.add(parent); }
      const isRock = r() < 0.5;
      if (isRock) {
        const s = 0.4 + r() * 0.5;
        this.box(parent, s, s * 0.6, s * 0.9, this.mats.stone, x, y0 + s * 0.3, z, { ry: r() * Math.PI });
      } else {
        const s = 0.6 + r() * 0.5;
        this.box(parent, s, s * 0.75, s, bush, x, y0 + s * 0.37, z, { ry: r() * Math.PI });
        this.box(parent, s * 0.6, s * 0.5, s * 0.6, bush, x + s * 0.4, y0 + s * 0.25, z + s * 0.2, { ry: r() * Math.PI });
      }
      if (minable) (this.decorSpots ??= []).push({ kind: isRock ? 'rock' : 'bush', x, z, y: y0, group: parent });
    }
  }

  // Thousands of tiny blades and flowers, drawn as two instanced meshes.
  buildGrassAndFlowers() {
    const r = this.rnd;
    const blades = [];
    const flowers = [];
    for (let i = 0; i < 2600; i++) {
      const x = (r() - 0.5) * 56;
      const z = (r() - 0.5) * 56;
      if (this.blocked(x, z, 0.5)) continue;
      const y0 = this.ctx.heightAt(x, z);
      if (this.ctx.heightAt(x + 0.1, z + 0.1) !== y0) continue; // not on a terrace edge
      blades.push([x, z, 0.12 + r() * 0.22, y0]);
      if (r() < 0.07) flowers.push([x + 0.1, z + 0.1, Math.floor(r() * 5), y0]);
    }
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const grassMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
    const grass = new THREE.InstancedMesh(this.unitBox, grassMat, blades.length);
    const c = new THREE.Color();
    blades.forEach(([x, z, h, y0], i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * Math.PI);
      m4.compose(new THREE.Vector3(x, y0 + h / 2, z), q, new THREE.Vector3(0.05, h, 0.05));
      grass.setMatrixAt(i, m4);
      c.set(GRASS[Math.floor(r() * GRASS.length)]).multiplyScalar(0.95 + r() * 0.2);
      grass.setColorAt(i, c);
    });
    this.scene.add(grass);

    const petals = [0xff6b9d, 0xffd93d, 0xffffff, 0xb07aff, 0xff8a3d];
    const flowerMesh = new THREE.InstancedMesh(this.unitBox, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, emissive: 0x222222 }), flowers.length);
    flowers.forEach(([x, z, k, y0], i) => {
      m4.compose(new THREE.Vector3(x, y0 + 0.26, z), q.identity(), new THREE.Vector3(0.12, 0.12, 0.12));
      flowerMesh.setMatrixAt(i, m4);
      flowerMesh.setColorAt(i, c.set(petals[k]));
    });
    this.scene.add(flowerMesh);
    const stems = new THREE.InstancedMesh(this.unitBox, this.mats.leavesDark, flowers.length);
    flowers.forEach(([x, z, , y0], i) => {
      m4.compose(new THREE.Vector3(x, y0 + 0.11, z), q.identity(), new THREE.Vector3(0.035, 0.22, 0.035));
      stems.setMatrixAt(i, m4);
    });
    this.scene.add(stems);
  }

  update(elapsed) {
    for (const [i, jet] of (this.fountainJets ?? []).entries()) {
      jet.scale.y = 0.5 + Math.sin(elapsed * 6 + i) * 0.08;
    }
  }
}

export function skyTexture() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#7fb6e6');
  grad.addColorStop(0.6, '#bcdcef');
  grad.addColorStop(1, '#fbe6c4');
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
