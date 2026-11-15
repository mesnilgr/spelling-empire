import * as THREE from 'three';
import { blockMat, texBox } from './textures.js';

// Small voxel models of each material, shown spinning above the spot that gives it.
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });
const box = (g, w, h, d, m, x = 0, y = 0, z = 0) => {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  b.position.set(x, y, z);
  g.add(b);
  return b;
};

// A wooden treasure chest with a lid that can open.
export function buildChest() {
  const g = new THREE.Group();
  const wood = blockMat('oakPlanks');
  texBox(g, 0.9, 0.55, 0.6, wood, 0, 0.275, 0, { tile: 0.6 });
  const lid = new THREE.Group();
  lid.position.set(0, 0.55, -0.3);
  g.add(lid);
  texBox(lid, 0.92, 0.22, 0.62, wood, 0, 0.11, 0.3, { tile: 0.6 });
  const gold = mat(0xe2b440, { metalness: 0.6, roughness: 0.35 });
  for (const x of [-0.42, 0.42]) box(g, 0.06, 0.58, 0.62, mat(0x3a2a1a), x, 0.29, 0);
  box(lid, 0.16, 0.16, 0.06, gold, 0, 0.0, 0.62);
  g.userData.lid = lid;
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export function buildMushroomPatch() {
  const g = new THREE.Group();
  const stem = mat(0xf0ead8);
  const cap = mat(0x5af0e6, { emissive: 0x2ad0c8, emissiveIntensity: 1.4 });
  for (const [x, z, s] of [[0, 0, 1], [0.35, 0.2, 0.7], [-0.3, 0.25, 0.6], [0.1, -0.35, 0.55]]) {
    box(g, 0.1 * s, 0.3 * s, 0.1 * s, stem, x, 0.15 * s, z);
    box(g, 0.36 * s, 0.14 * s, 0.36 * s, cap, x, 0.33 * s, z);
  }
  return g;
}

export function buildMaterialIcon(id) {
  const g = new THREE.Group();
  switch (id) {
    case 'iron':
      box(g, 0.5, 0.18, 0.26, mat(0xd8dde4, { metalness: 0.7, roughness: 0.3 }));
      box(g, 0.4, 0.06, 0.18, mat(0xf4f6fa, { metalness: 0.7, roughness: 0.25 }), 0, 0.11, 0);
      break;
    case 'wood':
      texBox(g, 0.42, 0.42, 0.42, blockMat('oakLog'), 0, 0, 0, { tile: 0.42, cast: false });
      break;
    case 'stone':
      texBox(g, 0.42, 0.42, 0.42, blockMat('cobble'), 0, 0, 0, { tile: 0.42, cast: false });
      break;
    case 'fire':
      for (const [r, h, c] of [[0.2, 0.5, 0xff5a14], [0.13, 0.38, 0xffb340], [0.07, 0.24, 0xffe7a0]]) {
        const f = new THREE.Mesh(new THREE.ConeGeometry(r, h, 5), mat(c, { emissive: c, emissiveIntensity: 2.4 }));
        f.position.y = h / 2 - 0.2;
        g.add(f);
      }
      break;
    case 'wheat':
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const s = box(g, 0.05, 0.5, 0.05, mat(0xe2c25a), Math.cos(a) * 0.06, 0, Math.sin(a) * 0.06);
        s.rotation.z = Math.cos(a) * 0.25;
        s.rotation.x = Math.sin(a) * 0.25;
        box(g, 0.09, 0.14, 0.09, mat(0xd8a83a), Math.cos(a) * 0.12, 0.27, Math.sin(a) * 0.12);
      }
      box(g, 0.16, 0.06, 0.16, mat(0x8a5a32), 0, -0.05, 0);
      break;
    case 'water':
      box(g, 0.34, 0.34, 0.34, mat(0x4aa8e8, { transparent: true, opacity: 0.8, emissive: 0x1a6aa8, emissiveIntensity: 0.6, roughness: 0.1 }));
      box(g, 0.2, 0.2, 0.2, mat(0x9ad8ff, { emissive: 0x4aa8e8, emissiveIntensity: 0.8 }), 0, 0.24, 0);
      box(g, 0.08, 0.1, 0.08, mat(0xcff0ff, { emissive: 0x9ad8ff, emissiveIntensity: 1 }), 0, 0.38, 0);
      break;
    case 'cloth': {
      // A spool of thread: wooden ends, red thread wound round, a loose end.
      const wood = mat(0xb08850, { roughness: 0.8 });
      for (const y of [-0.17, 0.17]) box(g, 0.3, 0.06, 0.3, wood, 0, y, 0);
      box(g, 0.22, 0.28, 0.22, mat(0xd8382e, { roughness: 0.9 }));
      for (const y of [-0.09, 0, 0.09]) box(g, 0.235, 0.02, 0.235, mat(0xa82a22));
      box(g, 0.03, 0.22, 0.03, mat(0xd8382e), 0.13, -0.22, 0.05);
      break;
    }
    case 'flower':
      box(g, 0.05, 0.4, 0.05, mat(0x3f8a3a), 0, -0.05, 0);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        box(g, 0.14, 0.14, 0.06, mat(0xff6b9d, { emissive: 0xff3a7a, emissiveIntensity: 0.3 }), Math.cos(a) * 0.12, 0.2, Math.sin(a) * 0.12 * 0.3);
      }
      box(g, 0.1, 0.1, 0.1, mat(0xffd93d, { emissive: 0xffb000, emissiveIntensity: 0.5 }), 0, 0.2, 0.02);
      box(g, 0.14, 0.05, 0.08, mat(0x4f9e3a), 0.08, 0.02, 0);
      break;
    case 'crystal': {
      const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), mat(0xb07aff, { emissive: 0x8a4aff, emissiveIntensity: 1.6, roughness: 0.15 }));
      c.scale.y = 1.5;
      g.add(c);
      break;
    }
    case 'diamond': {
      const d = new THREE.Mesh(new THREE.OctahedronGeometry(0.24), mat(0x5af0e6, { emissive: 0x1ac8c0, emissiveIntensity: 1.4, roughness: 0.1, metalness: 0.2 }));
      d.scale.y = 1.25;
      g.add(d);
      break;
    }
    case 'obsidian':
      texBox(g, 0.4, 0.4, 0.4, blockMat('obsidian', { emissive: 0x2a1048, emissiveIntensity: 0.5 }), 0, 0, 0, { tile: 0.4, cast: false });
      break;
    case 'chest':
      // A golden "?" block: what's inside is a surprise.
      box(g, 0.36, 0.36, 0.36, mat(0xf2c84b, { emissive: 0xc88a26, emissiveIntensity: 0.6, metalness: 0.3, roughness: 0.4 }));
      box(g, 0.08, 0.16, 0.38, mat(0x7a4a12), 0, 0.03, 0);
      box(g, 0.38, 0.08, 0.08, mat(0x7a4a12), 0, 0.03, 0);
      break;
    case 'mushroom':
      box(g, 0.1, 0.24, 0.1, mat(0xf0ead8), 0, -0.1, 0);
      box(g, 0.36, 0.14, 0.36, mat(0x5af0e6, { emissive: 0x2ad0c8, emissiveIntensity: 1.6 }), 0, 0.06, 0);
      box(g, 0.22, 0.08, 0.22, mat(0x9afff8, { emissive: 0x5af0e6, emissiveIntensity: 1.8 }), 0, 0.16, 0);
      break;
    case 'fish':
      box(g, 0.42, 0.18, 0.1, mat(0xf2a040, { roughness: 0.4 }));
      box(g, 0.14, 0.2, 0.06, mat(0xe07a20), -0.26, 0, 0);
      box(g, 0.05, 0.05, 0.11, mat(0x1a1a1a), 0.13, 0.03, 0);
      break;
    case 'sleep':
      // "Zzz" made of little blocks.
      for (const [x, y, s] of [[-0.14, -0.1, 0.16], [0.06, 0.08, 0.12], [0.2, 0.22, 0.09]]) {
        const m = mat(0x9ab8ff, { emissive: 0x5a7ae0, emissiveIntensity: 1 });
        box(g, s, s * 0.22, 0.05, m, x, y + s / 2, 0);
        box(g, s, s * 0.22, 0.05, m, x, y - s / 2, 0);
        box(g, s * 1.2, s * 0.2, 0.05, m, x, y, 0).rotation.z = 0.8;
      }
      break;
    case 'wake':
      box(g, 0.3, 0.3, 0.3, mat(0xffd93d, { emissive: 0xffa000, emissiveIntensity: 1.2 }));
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; box(g, 0.07, 0.07, 0.07, mat(0xffd93d, { emissive: 0xffa000, emissiveIntensity: 1.2 }), Math.cos(a) * 0.28, Math.sin(a) * 0.28, 0); }
      break;
    case 'talk':
      box(g, 0.08, 0.3, 0.08, mat(0xffd93d, { emissive: 0xffb000, emissiveIntensity: 1.2 }), 0, 0.08, 0);
      box(g, 0.08, 0.08, 0.08, mat(0xffd93d, { emissive: 0xffb000, emissiveIntensity: 1.2 }), 0, -0.16, 0);
      break;
    case 'done':
      box(g, 0.08, 0.2, 0.08, mat(0x5ad86a, { emissive: 0x2a9a3a, emissiveIntensity: 1 }), -0.08, -0.04, 0).rotation.z = 0.7;
      box(g, 0.08, 0.36, 0.08, mat(0x5ad86a, { emissive: 0x2a9a3a, emissiveIntensity: 1 }), 0.07, 0.03, 0).rotation.z = -0.6;
      break;
    default:
      box(g, 0.3, 0.3, 0.3, mat(0xffaa00, { emissive: 0xff8800, emissiveIntensity: 1 }));
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = false; } });
  g.scale.setScalar(2.1);
  return g;
}

// White pill with the material's name, drawn on a canvas and shown as a camera-facing sprite.
export function makeLabelSprite(text) {
  const font = 'bold 44px system-ui, -apple-system, "Segoe UI", sans-serif';
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  g.font = font;
  const w = Math.ceil(g.measureText(text).width) + 44;
  c.width = w;
  c.height = 72;
  g.font = font;
  g.fillStyle = 'rgba(255,255,255,0.92)';
  const r = 30;
  g.beginPath();
  g.moveTo(r, 4); g.lineTo(w - r, 4); g.arc(w - r, 36, 32, -Math.PI / 2, Math.PI / 2); g.lineTo(r, 68); g.arc(r, 36, 32, Math.PI / 2, -Math.PI / 2);
  g.fill();
  g.fillStyle = '#1f2a44';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, w / 2, 38);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  sprite.renderOrder = 10;
  const h = 0.72;
  sprite.scale.set(h * (w / 72), h, 1);
  return sprite;
}
