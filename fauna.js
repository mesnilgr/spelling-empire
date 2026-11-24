// Animals living their lives all over the world: they wander around their home, graze, hop,
// make their noise when the hero comes near, and run off if he comes too close.
// Each animal is a single mesh (boxes merged, colours in the vertices) so fifty of them stay cheap.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
const MAT_GLOW = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, emissive: 0x2ad8c8, emissiveIntensity: 0.9 });

// Build one animal from a list of boxes [w, h, d, color, x, y, z].
function model(boxes) {
  const geos = boxes.map(([w, h, d, c, x, y, z]) => {
    const g = new THREE.BoxGeometry(w, h, d).toNonIndexed();
    g.translate(x, y, z);
    const col = new THREE.Color(c);
    const n = g.attributes.position.count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { arr[i * 3] = col.r; arr[i * 3 + 1] = col.g; arr[i * 3 + 2] = col.b; }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    g.deleteAttribute('uv');
    return g;
  });
  const geo = mergeGeometries(geos);
  geos.forEach((g) => g.dispose());
  return geo;
}
const eyes = (y, z, x = 0.12, c = 0x111111, s = 0.07) => [[s, s, 0.02, c, -x, y, z], [s, s, 0.02, c, x, y, z]];
const legs4 = (w, h, x, z, c) => [[w, h, w, c, -x, h / 2, z], [w, h, w, c, x, h / 2, z], [w, h, w, c, -x, h / 2, -z], [w, h, w, c, x, h / 2, -z]];

const KINDS = {
  sheep: { speed: 1.0, flee: 2.2, sound: { fr: 'Bêê !', en: 'Baa!' }, tone: [420, 'sawtooth'],
    boxes: () => [[0.75, 0.55, 1.0, 0xf4f1ea, 0, 0.7, 0], ...legs4(0.14, 0.45, 0.24, 0.34, 0x3a3532), [0.38, 0.38, 0.38, 0x3a3532, 0, 0.92, 0.6], [0.44, 0.16, 0.3, 0xf4f1ea, 0, 1.12, 0.55], ...eyes(0.98, 0.8, 0.1, 0xffffff, 0.06)] },
  sheepBlack: { speed: 1.0, flee: 2.2, sound: { fr: 'Bêê !', en: 'Baa!' }, boxes: () => [[0.75, 0.55, 1.0, 0x2a2626, 0, 0.7, 0], ...legs4(0.14, 0.45, 0.24, 0.34, 0x3a3532), [0.38, 0.38, 0.38, 0x3a3532, 0, 0.92, 0.6], [0.44, 0.16, 0.3, 0x2a2626, 0, 1.12, 0.55], ...eyes(0.98, 0.8, 0.1, 0xffffff, 0.06)] },
  sheepBrown: { speed: 1.0, flee: 2.2, sound: { fr: 'Bêê !', en: 'Baa!' }, boxes: () => [[0.75, 0.55, 1.0, 0x8a5a32, 0, 0.7, 0], ...legs4(0.14, 0.45, 0.24, 0.34, 0x3a3532), [0.38, 0.38, 0.38, 0x3a3532, 0, 0.92, 0.6], [0.44, 0.16, 0.3, 0x8a5a32, 0, 1.12, 0.55], ...eyes(0.98, 0.8, 0.1, 0xffffff, 0.06)] },
  sheepPink: { speed: 1.0, flee: 2.2, sound: { fr: 'Bêê !', en: 'Baa!' }, boxes: () => [[0.75, 0.55, 1.0, 0xffa8cc, 0, 0.7, 0], ...legs4(0.14, 0.45, 0.24, 0.34, 0x3a3532), [0.38, 0.38, 0.38, 0x3a3532, 0, 0.92, 0.6], [0.44, 0.16, 0.3, 0xffa8cc, 0, 1.12, 0.55], ...eyes(0.98, 0.8, 0.1, 0xffffff, 0.06)] },
  lamb: { speed: 1.3, flee: 2.4, sound: { fr: 'Bêêê !', en: 'Baa!' }, hop: true,
    boxes: () => [[0.46, 0.36, 0.62, 0xfaf8f2, 0, 0.46, 0], ...legs4(0.1, 0.3, 0.15, 0.2, 0x5a5250), [0.28, 0.28, 0.28, 0x5a5250, 0, 0.64, 0.38], [0.3, 0.1, 0.2, 0xfaf8f2, 0, 0.8, 0.34], ...eyes(0.68, 0.525, 0.07, 0xffffff, 0.05)] },
  wolf: { speed: 1.6, flee: 2.6, sound: { fr: 'Aouuuh !', en: 'Awooo!' },
    boxes: () => [[0.42, 0.42, 0.95, 0xb8b8b8, 0, 0.55, 0], [0.44, 0.24, 0.5, 0xd8d8d8, 0, 0.42, 0.1], ...legs4(0.12, 0.36, 0.14, 0.32, 0xa8a8a8), [0.4, 0.36, 0.38, 0xb8b8b8, 0, 0.75, 0.6], [0.2, 0.16, 0.2, 0xd8d8d8, 0, 0.66, 0.84], [0.08, 0.06, 0.04, 0x222222, 0, 0.7, 0.95], [0.1, 0.16, 0.06, 0xb8b8b8, -0.13, 1.0, 0.56], [0.1, 0.16, 0.06, 0xb8b8b8, 0.13, 1.0, 0.56], [0.14, 0.14, 0.5, 0xb8b8b8, 0, 0.66, -0.68], ...eyes(0.8, 0.795, 0.1)] },
  cat: { speed: 1.3, flee: 1.6, sound: { fr: 'Miaou !', en: 'Meow!' }, hop: true,
    boxes: () => [[0.26, 0.24, 0.56, 0xf0a040, 0, 0.32, 0], [0.27, 0.05, 0.1, 0xc87020, 0, 0.45, 0.05], [0.27, 0.05, 0.1, 0xc87020, 0, 0.45, -0.15], ...legs4(0.07, 0.2, 0.08, 0.2, 0xf0a040), [0.26, 0.24, 0.24, 0xf0a040, 0, 0.48, 0.34], [0.07, 0.08, 0.04, 0xf0a040, -0.08, 0.64, 0.3], [0.07, 0.08, 0.04, 0xf0a040, 0.08, 0.64, 0.3], [0.06, 0.06, 0.4, 0xf0a040, 0, 0.5, -0.42], ...eyes(0.5, 0.465, 0.07, 0x3a8a3a, 0.05)] },
  panda: { speed: 0.6, flee: 1.6, sound: { fr: 'Grrmf !', en: 'Hmmf!' },
    boxes: () => [[0.85, 0.75, 1.2, 0xf4f1ea, 0, 0.75, 0], [0.87, 0.4, 0.5, 0x1a1a1a, 0, 0.8, 0.25], ...legs4(0.28, 0.4, 0.28, 0.4, 0x1a1a1a), [0.6, 0.55, 0.5, 0xf4f1ea, 0, 1.05, 0.75], [0.16, 0.16, 0.06, 0x1a1a1a, -0.3, 1.4, 0.7], [0.16, 0.16, 0.06, 0x1a1a1a, 0.3, 1.4, 0.7], [0.14, 0.12, 0.02, 0x1a1a1a, -0.14, 1.08, 1.0], [0.14, 0.12, 0.02, 0x1a1a1a, 0.14, 1.08, 1.0], [0.1, 0.06, 0.04, 0x1a1a1a, 0, 0.95, 1.01]] },
  parrot: { speed: 1.2, flee: 1.6, sound: { fr: 'Coco !', en: 'Polly!' }, hop: true,
    boxes: () => [[0.22, 0.34, 0.24, 0xd8302a, 0, 0.36, 0], [0.24, 0.14, 0.22, 0x2a7ad8, 0, 0.3, -0.02], [0.2, 0.2, 0.2, 0xd8302a, 0, 0.6, 0.06], [0.08, 0.1, 0.1, 0xf2c84b, 0, 0.56, 0.2], [0.14, 0.3, 0.06, 0x2a7ad8, 0, 0.26, -0.15], [0.05, 0.14, 0.05, 0x3a3a3a, -0.05, 0.1, 0], [0.05, 0.14, 0.05, 0x3a3a3a, 0.05, 0.1, 0], ...eyes(0.64, 0.165, 0.06, 0x111111, 0.04)] },
  llama: { speed: 1.0, flee: 2.2, sound: { fr: 'Mmmeh !', en: 'Mmmeh!' },
    boxes: () => [[0.62, 0.62, 1.1, 0xf0e6cc, 0, 1.0, 0], [0.64, 0.2, 0.7, 0xd8382e, 0, 1.25, 0.05], [0.66, 0.08, 0.72, 0x2a8ad8, 0, 1.18, 0.05], ...legs4(0.18, 0.7, 0.2, 0.36, 0xe0d6bc), [0.3, 0.9, 0.3, 0xf0e6cc, 0, 1.65, 0.5], [0.34, 0.3, 0.46, 0xf0e6cc, 0, 2.1, 0.62], [0.08, 0.2, 0.06, 0xf0e6cc, -0.1, 2.34, 0.5], [0.08, 0.2, 0.06, 0xf0e6cc, 0.1, 2.34, 0.5], ...eyes(2.15, 0.855, 0.12)] },
  polarBear: { speed: 0.8, flee: 2.6, sound: { fr: 'Grrr !', en: 'Grrr!' },
    boxes: () => [[0.95, 0.8, 1.5, 0xf6f8fa, 0, 0.95, 0], ...legs4(0.3, 0.55, 0.3, 0.5, 0xeef2f6), [0.6, 0.55, 0.6, 0xf6f8fa, 0, 1.15, 0.95], [0.3, 0.24, 0.24, 0xeef2f6, 0, 1.05, 1.32], [0.12, 0.08, 0.04, 0x1a1a1a, 0, 1.12, 1.45], [0.14, 0.12, 0.06, 0xf6f8fa, -0.22, 1.47, 0.85], [0.14, 0.12, 0.06, 0xf6f8fa, 0.22, 1.47, 0.85], ...eyes(1.25, 1.255, 0.14)] },
  squid: { speed: 0, flee: 0, sound: { fr: '', en: '' }, swim: 'float', glow: true,
    boxes: () => [[0.7, 0.9, 0.7, 0x2ab8b0, 0, 0.3, 0], ...[[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25], [0, 0.32], [0, -0.32]].map(([x, z]) => [0.12, 0.7, 0.12, 0x1a9890, x, -0.45, z]), [0.12, 0.12, 0.04, 0xffffff, -0.18, 0.4, 0.36], [0.12, 0.12, 0.04, 0xffffff, 0.18, 0.4, 0.36]] },
  pig: { speed: 1.1, flee: 2.0, sound: { fr: 'Groin groin !', en: 'Oink!' }, tone: [260, 'square'],
    boxes: () => [[0.62, 0.5, 0.95, 0xf2a3a8, 0, 0.55, 0], ...legs4(0.16, 0.32, 0.2, 0.3, 0xe08a92), [0.5, 0.45, 0.4, 0xf2a3a8, 0, 0.65, 0.6], [0.24, 0.16, 0.06, 0xd8707a, 0, 0.58, 0.82], ...eyes(0.75, 0.81, 0.13)] },
  cow: { speed: 0.9, flee: 2.4, sound: { fr: 'Meuh !', en: 'Moo!' }, tone: [150, 'sawtooth'],
    boxes: () => [[0.85, 0.75, 1.4, 0xf4f1ea, 0, 1.0, 0], [0.86, 0.4, 0.5, 0x2a2420, 0, 1.15, -0.2], [0.5, 0.3, 0.3, 0x2a2420, 0.2, 0.9, 0.4], ...legs4(0.2, 0.62, 0.28, 0.5, 0x2a2420), [0.55, 0.5, 0.5, 0xf4f1ea, 0, 1.25, 0.85], [0.42, 0.22, 0.12, 0xf2b8a8, 0, 1.1, 1.12], [0.08, 0.16, 0.08, 0xe8e0d0, -0.25, 1.58, 0.8], [0.08, 0.16, 0.08, 0xe8e0d0, 0.25, 1.58, 0.8], ...eyes(1.35, 1.11, 0.15)] },
  chicken: { speed: 1.4, flee: 1.8, sound: { fr: 'Cot cot !', en: 'Cluck!' }, tone: [880, 'square'], hop: true,
    boxes: () => [[0.32, 0.32, 0.42, 0xffffff, 0, 0.4, 0], [0.04, 0.22, 0.04, 0xf2b23a, -0.08, 0.11, 0], [0.04, 0.22, 0.04, 0xf2b23a, 0.08, 0.11, 0], [0.22, 0.3, 0.2, 0xffffff, 0, 0.66, 0.18], [0.12, 0.07, 0.1, 0xf2b23a, 0, 0.66, 0.32], [0.06, 0.1, 0.08, 0xd8382e, 0, 0.84, 0.18], [0.06, 0.08, 0.04, 0xd8382e, 0, 0.58, 0.29], ...eyes(0.72, 0.285, 0.07, 0x111111, 0.05)] },
  rabbit: { speed: 2.2, flee: 3.0, sound: { fr: 'Hop !', en: 'Hop!' }, tone: [1200, 'triangle'], hop: true,
    boxes: () => [[0.3, 0.28, 0.42, 0xb89a7a, 0, 0.24, 0], [0.24, 0.24, 0.24, 0xb89a7a, 0, 0.42, 0.22], [0.06, 0.22, 0.06, 0xb89a7a, -0.06, 0.64, 0.2], [0.06, 0.22, 0.06, 0xb89a7a, 0.06, 0.64, 0.2], [0.12, 0.12, 0.08, 0xffffff, 0, 0.3, -0.24], ...eyes(0.46, 0.345, 0.07, 0x111111, 0.05)] },
  fox: { speed: 1.8, flee: 3.2, sound: { fr: 'Yip !', en: 'Yip!' }, tone: [700, 'sawtooth'],
    boxes: () => [[0.36, 0.34, 0.8, 0xe0702a, 0, 0.45, 0], ...legs4(0.1, 0.28, 0.12, 0.28, 0x2a2420), [0.36, 0.32, 0.34, 0xe0702a, 0, 0.62, 0.5], [0.2, 0.14, 0.18, 0xf4f1ea, 0, 0.55, 0.72], [0.08, 0.14, 0.06, 0xe0702a, -0.12, 0.84, 0.48], [0.08, 0.14, 0.06, 0xe0702a, 0.12, 0.84, 0.48], [0.16, 0.16, 0.5, 0xe0702a, 0, 0.55, -0.6], [0.16, 0.16, 0.14, 0xffffff, 0, 0.55, -0.88], ...eyes(0.68, 0.675, 0.09)] },
  goat: { speed: 1.2, flee: 2.4, sound: { fr: 'Bêêê !', en: 'Maa!' }, tone: [520, 'sawtooth'],
    boxes: () => [[0.55, 0.5, 0.9, 0xe8e4dc, 0, 0.75, 0], ...legs4(0.13, 0.5, 0.18, 0.3, 0xc8c0b0), [0.34, 0.4, 0.38, 0xe8e4dc, 0, 1.05, 0.55], [0.06, 0.24, 0.06, 0x8a8070, -0.1, 1.35, 0.5], [0.06, 0.24, 0.06, 0x8a8070, 0.1, 1.35, 0.5], [0.08, 0.16, 0.06, 0xd8d0c0, 0, 0.8, 0.72], ...eyes(1.1, 0.745, 0.1)] },
  frog: { speed: 1.6, flee: 1.8, sound: { fr: 'Croâ !', en: 'Ribbit!' }, tone: [200, 'square'], hop: true,
    boxes: () => [[0.36, 0.2, 0.36, 0x4fa83a, 0, 0.12, 0], [0.12, 0.12, 0.12, 0x4fa83a, -0.11, 0.26, 0.1], [0.12, 0.12, 0.12, 0x4fa83a, 0.11, 0.26, 0.1], [0.06, 0.06, 0.02, 0x111111, -0.11, 0.27, 0.165], [0.06, 0.06, 0.02, 0x111111, 0.11, 0.27, 0.165], [0.4, 0.06, 0.2, 0x3a8a2a, 0, 0.03, -0.12]] },
  crab: { speed: 1.3, flee: 1.8, sound: { fr: 'Clac clac !', en: 'Snap snap!' }, tone: [1000, 'square'], sideways: true,
    boxes: () => [[0.42, 0.16, 0.3, 0xe0482e, 0, 0.16, 0], [0.12, 0.12, 0.12, 0xe0482e, -0.3, 0.2, 0.18], [0.12, 0.12, 0.12, 0xe0482e, 0.3, 0.2, 0.18], ...[-0.18, 0, 0.18].flatMap((x) => [[0.04, 0.12, 0.04, 0xc0382a, x - 0.08, 0.06, -0.16], [0.04, 0.12, 0.04, 0xc0382a, x + 0.08, 0.06, 0.16]]), [0.04, 0.1, 0.04, 0x111111, -0.07, 0.3, 0.1], [0.04, 0.1, 0.04, 0x111111, 0.07, 0.3, 0.1]] },
  turtle: { speed: 0.5, flee: 1.6, sound: { fr: '…', en: '…' }, tone: [160, 'triangle'],
    boxes: () => [[0.6, 0.22, 0.7, 0x5a8a3a, 0, 0.22, 0], [0.5, 0.1, 0.6, 0x8ab05a, 0, 0.36, 0], [0.2, 0.16, 0.22, 0x9ac07a, 0, 0.18, 0.44], ...legs4(0.14, 0.1, 0.26, 0.26, 0x9ac07a), ...eyes(0.22, 0.555, 0.06, 0x111111, 0.04)] },
  duck: { speed: 1.0, flee: 2.0, sound: { fr: 'Coin coin !', en: 'Quack!' }, tone: [600, 'square'],
    boxes: () => [[0.34, 0.24, 0.48, 0xffffff, 0, 0.2, 0], [0.2, 0.22, 0.2, 0x2f8a4a, 0, 0.42, 0.2], [0.12, 0.06, 0.14, 0xf2b23a, 0, 0.4, 0.36], ...eyes(0.46, 0.305, 0.07, 0x111111, 0.04)] },
  dolphin: { speed: 0, flee: 0, sound: { fr: '', en: '' }, swim: true,
    boxes: () => [[0.5, 0.5, 1.6, 0x6a8aa8, 0, 0, 0], [0.4, 0.2, 0.6, 0xc8d8e0, 0, -0.2, 0.1], [0.3, 0.3, 0.4, 0x6a8aa8, 0, 0, 1.0], [0.1, 0.4, 0.3, 0x6a8aa8, 0, 0.4, -0.1], [0.8, 0.08, 0.3, 0x6a8aa8, 0, 0, -0.95], ...eyes(0.08, 0.95, 0.2)] },
};

const geoCache = {};
const geoFor = (kind) => (geoCache[kind] ??= model(KINDS[kind].boxes()));

// Where each little group lives: [kind, x, z, how many, radius].
export const HERDS = [
  // The farm and the village.
  ['pig', 38, 31, 3, 2.0], ['cow', 26, 32, 3, 4.5], ['chicken', 23, 44, 4, 2.6], ['sheep', 34, 46, 2, 3.5], ['sheepPink', 34, 46, 1, 3.5], ['lamb', 34, 46, 2, 3],
  ['cat', 4, 6, 1, 6], ['cat', -9, -7, 1, 5], ['sheepBrown', 12, 38, 1, 3], ['lamb', 12, 38, 1, 3],
  ['chicken', -3, 20, 2, 2.5], ['sheep', -38, -38, 2, 4.5], ['sheepBlack', -38, -38, 1, 4.5], ['lamb', -38, -38, 1, 4], ['cow', 6, 40, 2, 4],
  // Meadow and forest.
  ['rabbit', -34, 38, 3, 5], ['rabbit', -66, 18, 2, 5], ['fox', -74, -26, 1, 6], ['fox', -54, 30, 1, 5], ['rabbit', -50, -24, 2, 4], ['wolf', -70, 14, 2, 6], ['panda', -26, 47, 2, 3],
  // Marsh.
  ['frog', 54, 6, 2, 3], ['frog', 66, 4, 2, 3], ['frog', 57, -8, 1, 2.5], ['duck', 61, 0, 2, 2.2], ['duck', 69, -6, 2, 2.2],
  // Mountain foothills.
  ['goat', 14, -40, 2, 3], ['goat', -24, -52, 2, 3.5], ['llama', -10, -47, 2, 3], ['polarBear', 8, -70, 1, 4],
  // Coast.
  ['crab', -12, 60, 2, 4], ['crab', 18, 62, 2, 4], ['turtle', 4, 64, 2, 3], ['crab', 32, 62, 1, 3], ['parrot', 28, 52, 1, 2],
  // Sea.
  ['dolphin', 10, 80, 1, 6], ['dolphin', -28, 82, 1, 6], ['squid', -6, 84, 2, 5],
];

export class FaunaManager {
  constructor(scene3D) {
    this.s = scene3D;
    this.list = [];
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (const [kind, x, z, n, r] of HERDS) {
      for (let i = 0; i < n; i++) {
        const mesh = new THREE.Mesh(geoFor(kind), KINDS[kind].glow ? MAT_GLOW : MAT);
        mesh.castShadow = ['cow', 'sheep', 'sheepBlack', 'sheepBrown', 'sheepPink', 'pig', 'goat', 'llama', 'panda', 'polarBear', 'wolf'].includes(kind);
        mesh.userData.dynamic = true;
        // A free spot near home (not in a tree, a wall or the water).
        const swim = kind === 'duck' || kind === 'frog';
        let px = x, pz = z;
        for (let k = 0; k < 30; k++) {
          const a = rnd() * Math.PI * 2, d = rnd() * r * 0.8;
          const tx = x + Math.cos(a) * d, tz = z + Math.sin(a) * d;
          if (KINDS[kind].swim || (!scene3D._checkCollision(tx, tz, { swim }) && !scene3D._insideAnyHouse?.(tx, tz, 0.3))) { px = tx; pz = tz; break; }
        }
        mesh.position.set(px, KINDS[kind].swim ? -1 : scene3D.groundAt(px, pz), pz);
        mesh.rotation.y = rnd() * Math.PI * 2;
        scene3D.scene.add(mesh);
        this.list.push({ kind, def: KINDS[kind], mesh, home: { x, z, r }, target: null, wait: rnd() * 4, t: rnd() * 10, flee: 0, soundT: 0, jumpT: rnd() * 8 });
      }
    }
  }
  _ok(x, z, a) {
    const s = this.s;
    if (Math.hypot(x - a.home.x, z - a.home.z) > a.home.r + (a.flee > 0 ? 3 : 0)) return false;
    const swim = a.kind === 'duck' || a.kind === 'frog';
    if (s._checkCollision(x, z, { swim }) || s._insideAnyHouse?.(x, z, 0.3) || s.inLava?.(x, z)) return false;
    return true;
  }
  update(dt, t) {
    const s = this.s, p = s.player.position;
    for (const a of this.list) {
      const m = a.mesh;
      const dHero = Math.hypot(p.x - m.position.x, p.z - m.position.z);
      m.visible = dHero < (a.def.swim ? 60 : 38);
      if (!m.visible) continue;
      a.t += dt;
      if (a.def.swim === 'float') {
        // Glowing squid: drifting slowly just under the surface, pulsing.
        m.position.x = a.home.x + Math.sin(a.t * 0.2 + a.home.r) * a.home.r * 0.6;
        m.position.z = a.home.z + Math.cos(a.t * 0.17) * a.home.r * 0.6;
        m.position.y = -0.35 + Math.sin(a.t * 1.4) * 0.12;
        m.scale.y = 1 + Math.sin(a.t * 2.8) * 0.1;
        m.rotation.y += dt * 0.3;
        continue;
      }
      if (a.def.swim) {
        // Dolphins: leap out of the water in an arc, then swim under for a while.
        a.jumpT -= dt;
        if (a.jumpT < 0) {
          const k = -a.jumpT / 1.4;
          if (k > 1) { a.jumpT = 4 + Math.random() * 6; m.position.y = -1; m.rotation.y = Math.random() * Math.PI * 2; }
          else {
            m.position.x += Math.sin(m.rotation.y) * 4 * dt; m.position.z += Math.cos(m.rotation.y) * 4 * dt;
            m.position.y = -0.4 + Math.sin(k * Math.PI) * 1.6;
            m.rotation.x = -Math.cos(k * Math.PI) * 0.9;
            if (Math.hypot(m.position.x - a.home.x, m.position.z - a.home.z) > a.home.r) m.rotation.y += Math.PI;
            if (k > 0.92 && !a.splashed) { a.splashed = true; s.particleBurst({ x: m.position.x, y: 0.2, z: m.position.z }, '#cfefff', 10); }
            if (k < 0.1) a.splashed = false;
          }
        }
        continue;
      }
      // Noise when the hero comes near (not too often).
      a.soundT -= dt;
      if (dHero < 3.2 && a.soundT <= 0 && a.def.sound?.fr) { a.soundT = 6 + Math.random() * 6; this.onSound?.(a); }
      // Too close: run away.
      if (dHero < a.def.flee && a.flee <= 0) {
        a.flee = 1.2;
        const ux = (m.position.x - p.x) / (dHero || 1), uz = (m.position.z - p.z) / (dHero || 1);
        a.target = { x: m.position.x + ux * 3, z: m.position.z + uz * 3 };
      }
      a.flee -= dt;
      if (!a.target) {
        a.wait -= dt;
        if (a.wait <= 0) {
          const ang = Math.random() * Math.PI * 2, d = Math.random() * a.home.r;
          a.target = { x: a.home.x + Math.cos(ang) * d, z: a.home.z + Math.sin(ang) * d };
        }
      }
      let moving = false;
      if (a.target) {
        const dx = a.target.x - m.position.x, dz = a.target.z - m.position.z, d = Math.hypot(dx, dz);
        if (d < 0.2) { a.target = null; a.wait = 2 + Math.random() * 5; }
        else {
          const sp = a.def.speed * (a.flee > 0 ? 2.6 : 1) * dt;
          const nx = m.position.x + (dx / d) * sp, nz = m.position.z + (dz / d) * sp;
          if (this._ok(nx, nz, a)) { m.position.x = nx; m.position.z = nz; moving = true; }
          else { a.target = null; a.wait = 0.5 + Math.random(); }
          const face = Math.atan2(dx, dz) + (a.def.sideways ? Math.PI / 2 : 0);
          let diff = face - m.rotation.y;
          diff = Math.atan2(Math.sin(diff), Math.cos(diff));
          m.rotation.y += diff * Math.min(1, dt * 6);
        }
      }
      const g = a.kind === 'duck' || a.kind === 'frog' ? Math.max(0.02, s.groundAt(m.position.x, m.position.z)) : s.groundAt(m.position.x, m.position.z);
      // Hoppers hop; others waddle; grazing animals dip their heads now and then.
      if (moving && a.def.hop) m.position.y = g + Math.abs(Math.sin(a.t * 10)) * 0.18;
      else m.position.y = g + (moving ? Math.abs(Math.sin(a.t * 8)) * 0.04 : 0);
      // A giant's step (J5): boing, the animal bounces up.
      if (a.bounceT > 0) { a.bounceT -= dt; const k = 1 - Math.max(0, a.bounceT) / 0.7; m.position.y += Math.sin(k * Math.PI) * 1.4; m.rotation.x = Math.sin(k * Math.PI * 2) * 0.4; continue; }
      m.rotation.z = moving && !a.def.hop ? Math.sin(a.t * 8) * 0.06 : 0;
      m.rotation.x = !moving && (a.kind.startsWith('sheep') || a.kind === 'cow' || a.kind === 'goat' || a.kind === 'llama' || a.kind === 'lamb') && Math.sin(a.t * 0.7) > 0.6 ? 0.18 : 0;
    }
  }
}
export const ANIMAL_KINDS = KINDS;
