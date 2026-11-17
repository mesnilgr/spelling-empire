// Decorations for the cottage, bought with stars in the wardrobe. Positions are local to the
// cottage (6 × 4 blocks, door at the front, bed at the back left, table at the front right).
// build(group, kit) draws the decoration with the interiors prop kit.

export const DECOR = [
  {
    id: 'rug', emoji: '🟥', cost: 10, name: { fr: 'Grand tapis', en: 'Big rug' }, at: [0.1, 0.15],
    build(g, k) {
      k.box(g, 2.0, 0.03, 1.3, k.mat(0xc8372d), 0, 0.135, 0, { cast: false });
      k.box(g, 1.6, 0.035, 0.9, k.mat(0xf2c84b), 0, 0.14, 0, { cast: false });
      k.box(g, 1.2, 0.04, 0.5, k.mat(0x2f6a9a), 0, 0.145, 0, { cast: false });
    },
  },
  {
    id: 'plant', emoji: '🪴', cost: 10, name: { fr: 'Plante verte', en: 'Pot plant' }, at: [2.45, -1.45], r: 0.35,
    build(g, k) {
      k.box(g, 0.4, 0.36, 0.4, k.mat(0xb8643a), 0, 0.18, 0);
      k.box(g, 0.1, 0.5, 0.1, k.mat(0x3f7a2a), 0, 0.55, 0);
      for (const [x, y, z, s] of [[0, 0.9, 0, 0.42], [0.16, 0.72, 0.1, 0.3], [-0.14, 0.75, -0.08, 0.3]]) k.box(g, s, s, s, k.mat(0x4f9a3a), x, y, z);
    },
  },
  {
    id: 'painting', emoji: '🖼️', cost: 15, name: { fr: 'Tableau', en: 'Painting' }, at: [0.5, -1.86],
    build(g, k) {
      k.box(g, 1.1, 0.8, 0.06, k.mat(0x8a5a32), 0, 1.55, 0);
      k.box(g, 0.96, 0.66, 0.07, k.mat(0x7ac8f0), 0, 1.55, 0.005);
      k.box(g, 0.96, 0.24, 0.075, k.mat(0x4f9a3a), 0, 1.33, 0.006); // hills
      k.box(g, 0.16, 0.16, 0.08, k.mat(0xffd34a, { emissive: 0xffd34a, emissiveIntensity: 0.4 }), 0.3, 1.72, 0.008); // sun
      k.box(g, 0.2, 0.26, 0.08, k.mat(0xf4e2c4), -0.22, 1.5, 0.008); // little house
      k.box(g, 0.26, 0.1, 0.085, k.mat(0xc8372d), -0.22, 1.66, 0.009);
    },
  },
  {
    id: 'lantern', emoji: '🏮', cost: 15, name: { fr: 'Lanterne', en: 'Lantern' }, at: [1.5, 0.5],
    build(g, k) {
      k.box(g, 0.2, 0.04, 0.2, k.mat(0x3a3a3a), 0, 0.55, 0);
      k.box(g, 0.16, 0.22, 0.16, k.glow(0xffc04a, 2.2), 0, 0.68, 0);
      k.box(g, 0.2, 0.04, 0.2, k.mat(0x3a3a3a), 0, 0.81, 0);
    },
  },
  {
    id: 'basket', emoji: '🧺', cost: 20, name: { fr: 'Panier du chiot', en: 'Puppy basket' }, at: [-2.35, 1.25],
    build(g, k) {
      const wicker = k.mat(0xc89a5a);
      k.box(g, 0.8, 0.08, 0.7, wicker, 0, 0.04, 0);
      for (const [x, z, w, d] of [[-0.38, 0, 0.06, 0.7], [0.38, 0, 0.06, 0.7], [0, -0.33, 0.8, 0.06], [0, 0.33, 0.8, 0.06]]) k.box(g, w, 0.22, d, wicker, x, 0.15, z);
      k.box(g, 0.68, 0.06, 0.58, k.mat(0x6a8ad8), 0, 0.11, 0); // cushion
      k.box(g, 0.14, 0.06, 0.08, k.mat(0xf4ead8), 0.15, 0.17, 0.05); // a bone
    },
  },
  {
    id: 'bookshelf', emoji: '📚', cost: 25, name: { fr: 'Bibliothèque', en: 'Bookshelf' }, at: [2.72, -0.35], ry: -Math.PI / 2, r: 0.45,
    build(g, k) {
      const wood = k.mat(0x8a5a32);
      k.box(g, 1.2, 1.6, 0.35, wood, 0, 0.8, 0);
      const colors = [0xc8372d, 0x2f6a9a, 0x4f9a3a, 0xf2c84b, 0x8a4ab0, 0xff8a3d];
      for (let row = 0; row < 3; row++) {
        k.box(g, 1.1, 0.04, 0.3, k.mat(0x5a3a22), 0, 0.3 + row * 0.48, 0.03);
        for (let i = 0; i < 7; i++) k.box(g, 0.12, 0.34 + ((i * 7 + row) % 3) * 0.04, 0.24, k.mat(colors[(i + row * 2) % 6]), -0.45 + i * 0.15, 0.5 + row * 0.48, 0.06);
      }
    },
  },
  {
    id: 'aquarium', emoji: '🐠', cost: 35, name: { fr: 'Aquarium', en: 'Fish tank' }, at: [1.25, -1.6], r: 0.45,
    build(g, k) {
      k.box(g, 1.0, 0.5, 0.5, k.mat(0x5a3a22), 0, 0.25, 0);
      k.box(g, 0.94, 0.5, 0.44, k.mat(0x6ad0ff, { transparent: true, opacity: 0.45, emissive: 0x2a8ad0, emissiveIntensity: 0.3 }), 0, 0.76, 0);
      k.box(g, 0.94, 0.06, 0.44, k.mat(0xe8d8a8), 0, 0.54, 0);
      for (const [x, y, c] of [[-0.2, 0.75, 0xff8a3d], [0.18, 0.85, 0xffd34a], [0.05, 0.66, 0xff6b9d]]) k.box(g, 0.14, 0.08, 0.04, k.mat(c, { emissive: c, emissiveIntensity: 0.3 }), x, y, 0.05);
      k.box(g, 0.05, 0.3, 0.05, k.mat(0x3f8a3a), 0.35, 0.7, -0.1);
    },
  },
  {
    id: 'statue', emoji: '🏆', cost: 50, name: { fr: 'Statue en or du héros', en: 'Golden hero statue' }, at: [-0.55, -1.5], r: 0.35,
    build(g, k) {
      const gold = k.mat(0xf2c84b, { metalness: 0.7, roughness: 0.3, emissive: 0x6a4a10, emissiveIntensity: 0.35 });
      k.box(g, 0.5, 0.25, 0.5, k.mat(0x8a8e94), 0, 0.125, 0);
      k.box(g, 0.14, 0.4, 0.14, gold, -0.08, 0.45, 0);
      k.box(g, 0.14, 0.4, 0.14, gold, 0.08, 0.45, 0);
      k.box(g, 0.34, 0.42, 0.2, gold, 0, 0.86, 0);
      k.box(g, 0.28, 0.28, 0.28, gold, 0, 1.22, 0);
      k.box(g, 0.08, 0.5, 0.08, gold, 0.24, 1.14, 0); // raised arm
      k.box(g, 0.05, 0.4, 0.05, k.mat(0xdfe6ee, { metalness: 0.8 }), 0.24, 1.55, 0); // sword
    },
  },
];
