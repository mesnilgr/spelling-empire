// Word magic: a spell is a word written on a magic circle. Spelled right first time the effect is
// full; after a miss it is "wobbly" but still useful; copied out, it is small. Nobody gets stuck.
import * as THREE from 'three';
import { blockMat, texBox } from './textures.js';
import { BRIDGES } from './regions.js';

// The word asked depends on the age: the first letter at 5, then the whole word.
// unlock: stars needed (until the story unlocks them chapter by chapter).
export const SPELLS = [
  { id: 'pont', emoji: '🌉', name: { fr: 'Pont', en: 'Bridge' }, word: { 5: 'p', 6: 'pont', 7: 'pont' }, wordEn: 'bridge', unlock: 0, effect: { fr: 'Un pont de blocs au-dessus de l’eau.', en: 'A block bridge over the water.' } },
  { id: 'fleur', emoji: '🌸', name: { fr: 'Fleur', en: 'Flower' }, word: { 5: 'f', 6: 'fleur', 7: 'fleur' }, wordEn: 'flower', unlock: 0, effect: { fr: 'Un massif de fleurs pousse.', en: 'A flower bed grows.' } },
  { id: 'arbre', emoji: '🌳', name: { fr: 'Arbre', en: 'Tree' }, word: { 5: 'a', 6: 'arbre', 7: 'arbre' }, wordEn: 'tree', unlock: 0, effect: { fr: 'Un arbre magique : son bois se ramasse sans hache.', en: 'A magic tree: its wood needs no axe.' } },
  { id: 'pluie', emoji: '🌧️', name: { fr: 'Pluie', en: 'Rain' }, word: { 5: 'p', 6: 'pluie', 7: 'pluie' }, wordEn: 'rain', unlock: 15, effect: { fr: 'La pluie fait repousser le blé tout de suite.', en: 'Rain makes the wheat grow back at once.' } },
  { id: 'lumiere', emoji: '✨', name: { fr: 'Lumière', en: 'Light' }, word: { 5: 'l', 6: 'lune', 7: 'lumière' }, wordEn: 'light', unlock: 30, story: 'coastSign', effect: { fr: 'Une boule de lumière te suit et éclaire la nuit.', en: 'A ball of light follows you at night.' } },
  { id: 'feu', emoji: '🔥', name: { fr: 'Feu', en: 'Fire' }, word: { 5: 'f', 6: 'feu', 7: 'feu' }, wordEn: 'fire', unlock: 50, story: 'fisher', effect: { fr: 'Les braseros s’allument et donnent du feu.', en: 'The braziers light up and give fire.' } },
  { id: 'vent', emoji: '🌬️', name: { fr: 'Vent', en: 'Wind' }, word: { 5: 'v', 6: 'vent', 7: 'vent' }, wordEn: 'wind', unlock: null, story: 'marshSign', soon: { fr: 'Au marais', en: 'In the marsh' }, effect: { fr: 'Le vent chasse la brume.', en: 'The wind blows the mist away.' } },
  { id: 'pierre', emoji: '🪨', name: { fr: 'Pierre', en: 'Stone' }, word: { 5: 'p', 6: 'pierre', 7: 'pierre' }, wordEn: 'stone', unlock: null, story: 'mountainSign', soon: { fr: 'À la montagne', en: 'In the mountains' }, effect: { fr: 'Un escalier de pierre apparaît.', en: 'A stone staircase appears.' } },
];
export const spellById = (id) => SPELLS.find((s) => s.id === id);

const LETTER_NAMES = { p: 'pé', f: 'èfe', a: 'a', l: 'èle', v: 'vé' };
// The word object handed to the spelling window.
export function spellWord(spell, age, lang = 'fr') {
  if (lang !== 'fr') return { word: spell.wordEn, level: 'spell', spellId: spell.id };
  const key = age <= 5 ? 5 : age === 6 ? 6 : 7;
  const word = spell.word[key];
  const full = spell.word[7];
  if (word.length === 1) return { word, level: 'spell', spellId: spell.id, say: `La lettre ${LETTER_NAMES[word] ?? word}… comme dans ${full}.` };
  return { word, level: 'spell', spellId: spell.id, say: word === full ? `${word}.` : `${word}… comme dans ${full}.` };
}

// Where the circles are in the village, and what each one needs nearby.
export const CIRCLES = [
  { spell: 'pont', x: -11.3, z: -16.6, bridge: 'village' },
  { spell: 'fleur', x: 18, z: 6 },
  { spell: 'arbre', x: 14, z: -6 },
  { spell: 'pluie', x: 8, z: 17.3 },
  { spell: 'lumiere', x: 15.2, z: -14.6 },
  { spell: 'feu', x: 0, z: -5.2 },
  // Out in the regions (the story leads there).
  { cid: 'pont-foret', spell: 'pont', x: -53.6, z: 2.0, bridge: 'forest' },
  { cid: 'vent-marais', spell: 'vent', x: 42.6, z: 1.8 },
  { cid: 'feu-marais', spell: 'feu', x: 49.2, z: 2.6 },
  { cid: 'pierre-montagne', spell: 'pierre', x: 2.8, z: -53.2 },
  { cid: 'lumiere-phare', spell: 'lumiere', x: -6.8, z: 63.6 },
  { cid: 'pont-ile', spell: 'pont', x: 4.2, z: 68.2, bridge: 'coast' },
];
// The pond bridge, in world coordinates (west → east across the pond centre).
export const BRIDGE = BRIDGES.village;
export const BRAZIERS = [[-2.4, -5.4], [2.4, -5.4]];

const M = new Map();
const mat = (c, o = {}) => {
  const k = `${c}|${o.emissive ?? ''}|${o.emissiveIntensity ?? ''}|${o.opacity ?? ''}`;
  if (!M.has(k)) M.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, ...o, transparent: o.opacity !== undefined }));
  return M.get(k);
};
const cube = (parent, w, h, d, m, x, y, z) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true; mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
};

// A ring of glowing rune blocks on the ground, with a slow shimmer.
export function buildCircle() {
  const g = new THREE.Group();
  const rune = mat(0x8a5cff, { emissive: 0x7a4cff, emissiveIntensity: 1.1 });
  const pale = mat(0xd8c8ff, { emissive: 0xb8a0ff, emissiveIntensity: 0.8 });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const b = cube(g, 0.26, 0.06, 0.26, i % 3 === 0 ? pale : rune, Math.cos(a) * 0.95, 0.03, Math.sin(a) * 0.95);
    b.rotation.y = -a;
    b.castShadow = false;
  }
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.85, 16), mat(0x6a3cff, { emissive: 0x6a3cff, emissiveIntensity: 0.6, opacity: 0.28 }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.02;
  g.add(disc);
  g.userData.spin = g;
  return g;
}

// Bridge across the pond with a small island in the middle. power: 'strong' | 'wobbly' | 'weak'.
export function buildBridge(power = 'strong', B = BRIDGE) {
  const g = new THREE.Group();
  const len = B.x1 - B.x0;
  const n = Math.round(len / 0.42);
  for (let i = 0; i < n; i++) {
    const x = B.x0 + (i + 0.5) * (len / n);
    const t = (x - (B.x0 + len / 2)) / (len / 2);
    // Strong: a gentle arch. Wobbly: planks tilt this way and that. Weak: a plain flat walkway.
    const y = 0.16 + (power === 'weak' ? 0 : 0.28 * (1 - t * t));
    if (power === 'wobbly' && i % 5 === 3) continue; // a few missing planks (still walkable)
    const p = texBox(g, len / n - 0.03, 0.08, power === 'weak' ? 0.9 : 1.2, blockMat('sprucePlanks'), x, y, B.z, { tile: 0.6 });
    if (power === 'wobbly') { p.rotation.z = (i % 2 ? 1 : -1) * 0.07; p.rotation.x = Math.sin(i) * 0.05; }
    if (power !== 'weak' && i % 3 === 0) {
      for (const side of [-1, 1]) {
        texBox(g, 0.1, 0.5, 0.1, blockMat('oakLog'), x, y + 0.25, B.z + side * 0.58, { tile: 0.5 });
      }
    }
  }
  if (power !== 'weak') {
    for (const side of [-1, 1]) {
      const rail = texBox(g, len, 0.08, 0.08, blockMat('oakLog'), B.x0 + len / 2, 0.62, B.z + side * 0.58, { tile: 0.5 });
      if (power === 'wobbly') rail.rotation.z = side * 0.03;
    }
  }
  // The island: grass blocks and a little lantern.
  const I = B.island;
  if (!I) return g;
  for (let x = -1; x <= 1; x++) for (let z = -1; z <= 1; z++) {
    if (Math.abs(x) + Math.abs(z) > 1 && power === 'weak') continue;
    cube(g, 0.84, 0.3, 0.84, mat(0x5aa83a), I.x + x * 0.84, 0.12, I.z + z * 0.84);
  }
  return g;
}

// A tree grown by magic (pale bark, glowing leaves). Size by power.
export function buildMagicTree(power = 'strong') {
  const g = new THREE.Group();
  const s = power === 'strong' ? 1 : power === 'wobbly' ? 0.8 : 0.6;
  const h = 2.2 * s;
  texBox(g, 0.42 * s, h, 0.42 * s, blockMat('birchLog'), 0, h / 2, 0, { tile: 0.5 });
  const leaf = mat(0x7ad86a, { emissive: 0x3aa84a, emissiveIntensity: 0.35 });
  const leaf2 = mat(0xc8a0ff, { emissive: 0x9a6aff, emissiveIntensity: 0.5 });
  for (const [x, y, z, w] of [[0, h + 0.3, 0, 1.6], [0, h + 0.95, 0, 1.0], [0.55, h - 0.1, 0.2, 0.7], [-0.5, h, -0.3, 0.7]]) {
    cube(g, w * s, 0.7 * s, w * s, leaf, x * s, y, z * s);
  }
  for (let i = 0; i < 5; i++) cube(g, 0.16, 0.16, 0.16, leaf2, Math.cos(i * 1.3) * 0.7 * s, h + 0.2 + (i % 2) * 0.5 * s, Math.sin(i * 1.3) * 0.7 * s);
  return g;
}

export function buildFlowerBed(power = 'strong') {
  const g = new THREE.Group();
  const n = power === 'strong' ? 30 : power === 'wobbly' ? 18 : 9;
  const colors = [0xff6b9d, 0xffd93d, 0xffffff, 0xb07aff, 0xff8a3d, 0x6ad0ff];
  const stem = mat(0x3f8a3a);
  for (let i = 0; i < n; i++) {
    const a = i * 2.4, r = Math.sqrt((i + 0.5) / n) * 1.3;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const sh = power === 'wobbly' && i % 3 === 0 ? 0.18 : 0.3;
    cube(g, 0.04, sh, 0.04, stem, x, sh / 2, z).castShadow = false;
    const c = colors[i % colors.length];
    cube(g, 0.17, 0.17, 0.17, mat(c, { emissive: c, emissiveIntensity: 0.2 }), x, sh + 0.06, z).castShadow = false;
  }
  return g;
}

export function buildBrazier() {
  const g = new THREE.Group();
  texBox(g, 0.5, 0.5, 0.5, blockMat('cobble'), 0, 0.25, 0, { tile: 0.5 });
  cube(g, 0.62, 0.12, 0.62, mat(0x3a3a40, { metalness: 0.6, roughness: 0.4 }), 0, 0.56, 0);
  const flame = new THREE.Group();
  for (const [r, h, c] of [[0.24, 0.55, 0xff5a14], [0.15, 0.42, 0xffb340], [0.08, 0.26, 0xffe7a0]]) {
    const f = new THREE.Mesh(new THREE.ConeGeometry(r, h, 5), mat(c, { emissive: c, emissiveIntensity: 2.2 }));
    f.position.y = 0.62 + h / 2;
    flame.add(f);
  }
  flame.visible = false;
  g.add(flame);
  g.userData.flame = flame;
  return g;
}

// A glowing ball that floats next to the hero.
export function buildLightOrb() {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), mat(0xfff4c0, { emissive: 0xffe08a, emissiveIntensity: 3 }));
  g.add(core);
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), mat(0xffffff, { emissive: 0xfff0b0, emissiveIntensity: 2 }));
    s.position.set(Math.cos(i * 2.1) * 0.3, 0, Math.sin(i * 2.1) * 0.3);
    g.add(s);
  }
  const light = new THREE.PointLight(0xffe2a0, 0, 9, 1.6);
  g.add(light);
  g.userData.light = light;
  return g;
}
