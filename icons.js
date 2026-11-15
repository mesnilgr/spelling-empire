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
