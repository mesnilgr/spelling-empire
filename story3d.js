// 3D pieces of the story: house signs, Mimots (escaped words that came alive) and the torn page.
import * as THREE from 'three';
import { blockMat, texBox } from './textures.js';
import { mergeStatic } from './perf.js';

const M = new Map();
const mat = (c, o = {}) => {
  const k = `${c}|${o.emissive ?? ''}|${o.emissiveIntensity ?? ''}`;
  if (!M.has(k)) M.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, ...o }));
  return M.get(k);
};
const cube = (p, w, h, d, m, x, y, z) => {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  b.position.set(x, y, z);
  b.castShadow = true;
  p.add(b);
  return b;
};

// A wooden sign on a post. The board's face is a canvas: blank (faded marks) until its word is back.
export function buildSign() {
  const g = new THREE.Group();
  texBox(g, 0.14, 1.5, 0.14, blockMat('oakLog'), 0, 0.75, 0, { tile: 0.5 });
  texBox(g, 1.5, 0.62, 0.1, blockMat('oakPlanks'), 0, 1.55, 0.02, { tile: 0.5 });
  const c = document.createElement('canvas');
  c.width = 256; c.height = 104;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.54), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.9 }));
  face.position.set(0, 1.55, 0.075);
  g.add(face);
  g.userData.sign = { canvas: c, tex };
  setSignText(g, null);
  return g;
}

export function setSignText(sign, text) {
  const { canvas: c, tex } = sign.userData.sign;
  const g = c.getContext('2d');
  g.clearRect(0, 0, c.width, c.height);
  if (!text) {
    // Faded, unreadable marks: the word flew away.
    g.fillStyle = 'rgba(60, 35, 15, 0.25)';
    for (let i = 0; i < 5; i++) g.fillRect(40 + i * 36, 44 + (i % 2) * 8, 22, 10);
  } else {
    g.fillStyle = '#3a2410';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    let size = 60;
    do { g.font = `900 ${size}px "Chalkboard SE", "Comic Sans MS", system-ui, sans-serif`; size -= 4; } while (g.measureText(text.toUpperCase()).width > 230 && size > 20);
    g.fillText(text.toUpperCase(), c.width / 2, c.height / 2 + 4);
  }
  tex.needsUpdate = true;
}

// A Mimot: a round-ish block creature with big eyes and a letter on its tummy.
export function buildMimot(color, letter = '?') {
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);
  cube(body, 0.62, 0.56, 0.56, mat(color, { emissive: color, emissiveIntensity: 0.12 }), 0, 0.42, 0);
  cube(body, 0.5, 0.12, 0.46, mat(color), 0, 0.76, 0);
  // Eyes and cheeks.
  for (const s of [-1, 1]) {
    cube(body, 0.14, 0.16, 0.04, mat(0xffffff), s * 0.14, 0.52, 0.29);
    cube(body, 0.07, 0.09, 0.04, mat(0x1f2a44), s * 0.13, 0.5, 0.31);
    cube(body, 0.08, 0.05, 0.03, mat(0xff8a9a), s * 0.23, 0.4, 0.29);
  }
  // Little feet and a sprout on the head.
  for (const s of [-1, 1]) cube(body, 0.16, 0.12, 0.2, mat(0x3a2a20), s * 0.17, 0.06, 0.04);
  cube(body, 0.05, 0.2, 0.05, mat(0x3f8a3a), 0, 0.92, 0);
  cube(body, 0.16, 0.06, 0.1, mat(0x5ab04a), 0.07, 1.02, 0);
  // Letter tile on the tummy.
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  x.fillStyle = '#fffaf0'; x.fillRect(4, 4, 56, 56);
  x.fillStyle = '#1f2a44'; x.font = '900 44px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(letter.toUpperCase(), 32, 35);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const tile = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), new THREE.MeshBasicMaterial({ map: tex }));
  tile.position.set(0, 0.3, 0.285);
  body.add(tile);
  mergeStatic(body);
  body.scale.setScalar(1.35);
  g.userData.body = body;
  return g;
}

// The torn page: a glowing sheet floating above the ground.
export function buildPage() {
  const g = new THREE.Group();
  const sheet = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.02, 0.56), mat(0xfff6dc, { emissive: 0xffe8a0, emissiveIntensity: 0.6 }));
  sheet.position.y = 0.9;
  sheet.rotation.set(0.5, 0.3, 0.15);
  g.add(sheet);
  for (let i = 0; i < 4; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.022, 0.025), mat(0x4a3a8a));
    line.position.set(-0.02, 0.012, -0.18 + i * 0.1);
    sheet.add(line);
  }
  g.userData.sheet = sheet;
  return g;
}
