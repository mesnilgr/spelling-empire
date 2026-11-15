import * as THREE from 'three';

// Voxel-style tools and objects the hero can hold once crafted.
// Each model is built with its handle at the origin and pointing along +Y.

const box = (parent, w, h, d, color, x, y, z, extra = {}) => {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra }),
  );
  m.position.set(x, y, z);
  m.castShadow = true;
  parent.add(m);
  return m;
};

const WOOD = 0x8a5a32;
const WOOD_DARK = 0x5a3820;
const IRON = 0xb9c2cc;
const GOLD = 0xe2b440;

// How each item is held and used. `upright` items stay vertical in the hand.
export const HOLDABLE = {
  pickaxe: { action: 'swing', duration: 0.45, upright: false },
  sword: { action: 'swing', duration: 0.4, upright: false },
  torch: { action: 'raise', duration: 1.1, upright: true },
  wand: { action: 'raise', duration: 0.9, upright: false },
  potion: { action: 'drink', duration: 1.1, upright: true },
  bread: { action: 'drink', duration: 1.0, upright: true },
};

export function buildItem(id) {
  const g = new THREE.Group();
  const flames = [];
  let light = null;

  if (id === 'sword') {
    box(g, 0.07, 0.24, 0.07, WOOD_DARK, 0, 0.0, 0);
    box(g, 0.1, 0.07, 0.1, GOLD, 0, -0.14, 0, { metalness: 0.6, roughness: 0.3 });
    box(g, 0.34, 0.07, 0.1, GOLD, 0, 0.15, 0, { metalness: 0.6, roughness: 0.3 });
    box(g, 0.11, 0.7, 0.04, 0xd8e4f0, 0, 0.53, 0, { metalness: 0.8, roughness: 0.2, emissive: 0x3a6a9a, emissiveIntensity: 0.25 });
    box(g, 0.07, 0.08, 0.04, 0xd8e4f0, 0, 0.92, 0, { metalness: 0.8, roughness: 0.2 });
    box(g, 0.03, 0.62, 0.045, 0x8aa4bc, 0, 0.53, 0, { metalness: 0.8, roughness: 0.25 });
  } else if (id === 'pickaxe') {
    box(g, 0.07, 0.85, 0.07, WOOD, 0, 0.3, 0);
    const head = new THREE.Group();
    head.position.y = 0.68;
    g.add(head);
    box(head, 0.2, 0.12, 0.1, 0x7a7f86, 0, 0, 0, { metalness: 0.5, roughness: 0.4 });
    for (const s of [-1, 1]) {
      const arm = box(head, 0.28, 0.09, 0.08, IRON, s * 0.22, -0.03, 0, { metalness: 0.6, roughness: 0.35 });
      arm.rotation.z = s * -0.28;
      const tip = box(head, 0.1, 0.07, 0.07, 0xe8eef4, s * 0.38, -0.1, 0, { metalness: 0.7, roughness: 0.3 });
      tip.rotation.z = s * -0.6;
    }
  } else if (id === 'torch') {
    box(g, 0.07, 0.5, 0.07, WOOD, 0, 0.12, 0);
    box(g, 0.12, 0.1, 0.12, 0x2b2523, 0, 0.4, 0);
    const mats = [0xff5a14, 0xffb340, 0xffe7a0].map((c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 3.5 }));
    const sizes = [[0.12, 0.26], [0.08, 0.2], [0.045, 0.13]];
    sizes.forEach(([r, h], i) => {
      const f = new THREE.Mesh(new THREE.ConeGeometry(r, h, 5), mats[i]);
      f.position.y = 0.45 + h / 2;
      g.add(f);
      flames.push({ mesh: f, base: f.scale.clone(), y0: f.position.y, h, phase: i * 2, speed: 12 + i * 3 });
    });
    light = new THREE.PointLight(0xff9a40, 4, 7, 1.4);
    light.position.y = 0.6;
    g.add(light);
  } else if (id === 'wand') {
    box(g, 0.045, 0.55, 0.045, 0x3a2416, 0, 0.17, 0);
    box(g, 0.07, 0.06, 0.07, GOLD, 0, 0.45, 0, { metalness: 0.6, roughness: 0.3 });
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.09),
      new THREE.MeshStandardMaterial({ color: 0xff7ad9, emissive: 0xff4ac0, emissiveIntensity: 2.2, roughness: 0.2 }),
    );
    gem.position.y = 0.57;
    g.add(gem);
    flames.push({ mesh: gem, base: gem.scale.clone(), y0: gem.position.y, h: 0, phase: 0, speed: 5, spin: true });
  } else if (id === 'potion') {
    box(g, 0.2, 0.2, 0.2, 0xcfe8ff, 0, 0.12, 0, { transparent: true, opacity: 0.45, roughness: 0.1 });
    box(g, 0.16, 0.13, 0.16, 0xb04ae0, 0, 0.09, 0, { emissive: 0x8a2ad0, emissiveIntensity: 1.6 });
    box(g, 0.08, 0.1, 0.08, 0xcfe8ff, 0, 0.27, 0, { transparent: true, opacity: 0.5 });
    box(g, 0.09, 0.06, 0.09, 0x8a5a32, 0, 0.34, 0);
  } else if (id === 'bread') {
    box(g, 0.34, 0.14, 0.17, 0xd8a050, 0, 0.08, 0);
    box(g, 0.3, 0.06, 0.13, 0xe8bc70, 0, 0.17, 0);
    for (const x of [-0.09, 0, 0.09]) box(g, 0.025, 0.02, 0.11, 0x9a6024, x, 0.205, 0);
  }

  const spec = HOLDABLE[id];
  // Hand space: the arm hangs down with the hand at the origin. Point tools forward.
  if (spec?.upright) {
    g.rotation.x = 0.55;
    g.position.set(0, -0.02, 0.06);
  } else {
    g.rotation.x = Math.PI / 2;
    g.position.set(0, 0, 0.02);
  }
  g.scale.setScalar(1.3);
  g.userData = { id, flames, light };
  return g;
}

// Trophies that appear in the world for objects that cannot be held.
export function buildBoat() {
  const g = new THREE.Group();
  box(g, 1.6, 0.3, 0.7, 0x8a5a32, 0, 0.15, 0);
  box(g, 1.7, 0.1, 0.8, 0x5a3820, 0, 0.32, 0);
  box(g, 0.5, 0.3, 0.5, 0x8a5a32, 0.9, 0.2, 0);
  box(g, 0.08, 1.4, 0.08, 0x5a3820, 0, 1.0, 0);
  const sail = box(g, 0.04, 0.9, 0.8, 0xf3ead6, 0.04, 1.15, 0);
  sail.rotation.y = 0.15;
  box(g, 0.05, 0.25, 0.4, 0xc8372d, 0.04, 1.85, 0);
  return g;
}

export function buildCabin() {
  const g = new THREE.Group();
  box(g, 1.8, 1.2, 1.6, 0xd8b88a, 0, 0.6, 0);
  box(g, 0.5, 0.8, 0.05, 0x5a3820, 0, 0.4, 0.82);
  box(g, 0.35, 0.35, 0.05, 0x9fd2ee, -0.55, 0.75, 0.82, { emissive: 0x9fd2ee, emissiveIntensity: 0.5 });
  const roofL = box(g, 2.1, 0.12, 1.15, 0xc8372d, 0, 1.45, -0.42);
  roofL.rotation.x = -0.65;
  const roofR = box(g, 2.1, 0.12, 1.15, 0xc8372d, 0, 1.45, 0.42);
  roofR.rotation.x = 0.65;
  box(g, 0.25, 0.6, 0.25, 0x7c7a7c, 0.6, 1.8, -0.2);
  return g;
}
