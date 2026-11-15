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
      const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.5, 10), mat(0xf3ead6, { roughness: 0.9 }));
      roll.rotation.z = Math.PI / 2;
      g.add(roll);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 10), mat(0xc8372d));
      band.rotation.z = Math.PI / 2;
      g.add(band);
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
