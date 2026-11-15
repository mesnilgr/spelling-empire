import * as THREE from 'three';

// Blocky, voxel-style characters: cube head with a pixel-art face, box body,
// limbs that pivot at the shoulders and hips. Original designs, not copies of any game's skins.

const PX = 8; // pixels per face edge for the head textures

function canvasTexture(draw, w = PX, h = PX) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const hex = (n) => `#${new THREE.Color(n).getHexString()}`;
const shade = (n, k) => hex(new THREE.Color(n).multiplyScalar(k));

function px(g, x, y, color, w = 1, h = 1) {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
}

// Noise so flat colours look like hand-painted pixels.
function speckle(g, w, h, base, amount = 0.08, seed = 1) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const c = new THREE.Color(base);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const k = 1 + (rnd() - 0.5) * amount * 2;
      g.fillStyle = hex(c.clone().multiplyScalar(k));
      g.fillRect(x, y, 1, 1);
    }
  }
}

function faceTexture(spec) {
  return canvasTexture((g) => {
    speckle(g, PX, PX, spec.skin, 0.05, 3);
    // Hair fringe
    const hair = hex(spec.hair);
    if (spec.hairStyle === 'bald') {
      px(g, 0, 0, shade(spec.skin, 0.92), 8, 1);
    } else if (spec.hairStyle === 'long' || spec.hairStyle === 'fringe') {
      px(g, 0, 0, hair, 8, 2);
      px(g, 0, 2, hair, 1, spec.hairStyle === 'long' ? 5 : 2);
      px(g, 7, 2, hair, 1, spec.hairStyle === 'long' ? 5 : 2);
      if (spec.hairStyle === 'fringe') px(g, 1, 2, hair, 3, 1);
    } else {
      px(g, 0, 0, hair, 8, 2);
      px(g, 0, 2, hair, 1, 1);
      px(g, 7, 2, hair, 1, 1);
    }
    // Eyes: white + iris
    const eyeY = 4;
    px(g, 1, eyeY, '#ffffff', 2, 1);
    px(g, 5, eyeY, '#ffffff', 2, 1);
    px(g, spec.lookLeft ? 1 : 2, eyeY, hex(spec.eyes ?? 0x3b6fd4));
    px(g, spec.lookLeft ? 5 : 6, eyeY, hex(spec.eyes ?? 0x3b6fd4));
    // Brows
    px(g, 1, eyeY - 1, shade(spec.hairStyle === 'bald' ? 0x3b2a1a : spec.hair, 0.7), 2, 1);
    px(g, 5, eyeY - 1, shade(spec.hairStyle === 'bald' ? 0x3b2a1a : spec.hair, 0.7), 2, 1);
    // Nose and mouth
    px(g, 3, 5, shade(spec.skin, 0.82), 2, 1);
    if (spec.beard) {
      const b = hex(spec.beard);
      px(g, 1, 6, b, 6, 2);
      px(g, 0, 5, b, 1, 3);
      px(g, 7, 5, b, 1, 3);
      px(g, 3, 6, '#5a2a22', 2, 1);
    } else if (spec.mustache) {
      px(g, 2, 6, hex(spec.mustache), 4, 1);
    } else {
      px(g, 3, 6, '#9a4a3a', 2, 1);
      if (spec.blush) { px(g, 1, 5, '#e89a8a'); px(g, 6, 5, '#e89a8a'); }
    }
  });
}

function hairSideTexture(spec, side) {
  return canvasTexture((g) => {
    speckle(g, PX, PX, spec.skin, 0.05, 5);
    if (spec.hairStyle === 'bald') { px(g, 0, 0, shade(spec.skin, 0.92), 8, 1); return; }
    const hair = spec.hair;
    const rows = spec.hairStyle === 'long' ? 8 : 3;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < PX; x++) {
        const keep = y < 2 || (side === 'back') || (spec.hairStyle === 'long' ? x > 2 : x > 4);
        if (keep) px(g, x, y, shade(hair, 0.9 + ((x * 7 + y * 3) % 5) * 0.04));
      }
    }
    if (side === 'back') {
      for (let y = 0; y < (spec.hairStyle === 'long' ? 8 : 6); y++) for (let x = 0; x < PX; x++) px(g, x, y, shade(hair, 0.88 + ((x * 5 + y) % 4) * 0.05));
    }
    if (spec.beard && side !== 'back') px(g, side === 'left' ? 4 : 0, 5, hex(spec.beard), 4, 3);
  });
}

function solidTexture(color, seed, detail, w = PX, h = PX) {
  return canvasTexture((g, cw, ch) => {
    speckle(g, cw, ch, color, 0.07, seed);
    if (detail) detail(g, cw, ch);
  }, w, h);
}

const geoCache = new Map();
function boxGeo(w, h, d) {
  const key = `${w}|${h}|${d}`;
  if (!geoCache.has(key)) geoCache.set(key, new THREE.BoxGeometry(w, h, d));
  return geoCache.get(key);
}

function part(parent, w, h, d, mat, x, y, z) {
  const m = new THREE.Mesh(boxGeo(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

const lambert = (opts) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...opts });

export const CHARACTER_SPECS = {
  hero: { skin: 0xf2c49b, hair: 0x5a3720, hairStyle: 'fringe', eyes: 0x2f6fd0, shirt: 0x2f6fd8, trim: 0xf2c84b, pants: 0x5b4632, shoes: 0x3a2a1c, cape: 0xc8372d, blush: true },
  dwarf: { skin: 0xe8b28a, hair: 0xc4622d, hairStyle: 'short', eyes: 0x3a6a2a, beard: 0xd8722f, shirt: 0x3f8a45, trim: 0x8a5a2a, pants: 0x6a4a2a, shoes: 0x2e2018, belt: 0x3a2414, helmet: 0x9aa0a6 },
  elf: { skin: 0xf7d8bd, hair: 0xf2dc8a, hairStyle: 'long', eyes: 0x6a3fa8, shirt: 0x7a4fc0, trim: 0xe8d27a, pants: 0x3e2f6a, shoes: 0x2a2140, ears: true, blush: true },
  mage: { skin: 0xf0c8a6, hair: 0xe8e8ee, hairStyle: 'short', beard: 0xf0f0f4, eyes: 0x4a7ad0, shirt: 0x4a3aa0, trim: 0xf2c84b, pants: 0x4a3aa0, shoes: 0x2a2140, robe: true, wizardHat: 0x3a2c8a },
  merchant: { skin: 0xd99f74, hair: 0x2a1c14, hairStyle: 'short', mustache: 0x2a1c14, eyes: 0x5a3a20, shirt: 0xd8a03a, trim: 0x8a3b2e, pants: 0x4a3a2a, shoes: 0x2e2018, apron: 0xf0e6d0 },
  guard: { skin: 0xf0c49c, hair: 0x6a4a2a, hairStyle: 'short', eyes: 0x3a5a8a, shirt: 0xb8322c, trim: 0xd8d8de, pants: 0x3a3a46, shoes: 0x22222a, helmet: 0xb8bcc4, belt: 0x2a2224 },
  barkeep: { skin: 0xe6b08a, hair: 0x8a4a2a, hairStyle: 'bald', mustache: 0x8a4a2a, eyes: 0x4a3020, shirt: 0xf0ead8, trim: 0x7a2a22, pants: 0x3a2a22, shoes: 0x22180f, apron: 0x7a2a22 },
  forester: { skin: 0xe2a882, hair: 0x6a3a1a, hairStyle: 'short', beard: 0x7a4a22, eyes: 0x3a5a2a, shirt: 0x3a6a3a, trim: 0xb8322c, pants: 0x5a4a2a, shoes: 0x2e2018, belt: 0x3a2414 },
  fisher: { skin: 0xc98a62, hair: 0x2a2a3a, hairStyle: 'long', eyes: 0x3a6a8a, shirt: 0x2f6a8a, trim: 0xf2c84b, pants: 0x3a4a5a, shoes: 0x22222a, blush: true },
  patron: { skin: 0xc98a62, hair: 0x1e1a18, hairStyle: 'short', eyes: 0x4a3020, shirt: 0x2f8a8a, trim: 0xd8c27a, pants: 0x4a3a5a, shoes: 0x22180f, lookLeft: true },
};

// Build a character. Returns a Group with userData.parts used for animation and holding items.
export function createBlockyCharacter(specOrName) {
  const spec = typeof specOrName === 'string' ? CHARACTER_SPECS[specOrName] : specOrName;
  const root = new THREE.Group();
  const rig = new THREE.Group();
  rig.scale.setScalar(0.92);
  root.add(rig);

  const skinMat = lambert({ map: solidTexture(spec.skin, 11) });
  const shirtMat = lambert({
    map: solidTexture(spec.shirt, 13, (g, w, h) => {
      // collar + trim line down the front + hem
      px(g, 2, 0, hex(spec.trim), 4, 1);
      px(g, 0, h - 1, shade(spec.shirt, 0.75), w, 1);
      if (!spec.robe) px(g, 3, 1, shade(spec.shirt, 0.82), 2, h - 2);
    }, 8, 12),
  });
  const shirtPlain = lambert({ map: solidTexture(spec.shirt, 17) });
  const pantsMat = lambert({ map: solidTexture(spec.pants, 19) });
  const shoeMat = lambert({ map: solidTexture(spec.shoes, 23) });

  // ----- Legs (pivot at hip) -----
  const legH = 0.62;
  const legs = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.13, legH + 0.02, 0);
    rig.add(pivot);
    part(pivot, 0.25, legH - 0.12, 0.26, spec.robe ? shirtPlain : pantsMat, 0, -(legH - 0.12) / 2, 0);
    part(pivot, 0.27, 0.13, 0.3, shoeMat, 0, -legH + 0.065, 0.02);
    legs.push(pivot);
  }

  // ----- Body -----
  const bodyY = legH + 0.02;
  const torso = part(rig, 0.52, 0.66, 0.28, shirtMat, 0, bodyY + 0.33, 0);
  void torso;
  if (spec.robe) part(rig, 0.56, 0.5, 0.32, shirtPlain, 0, bodyY - 0.05, 0);
  if (spec.belt || !spec.robe) part(rig, 0.54, 0.08, 0.3, lambert({ color: spec.belt ?? 0x3a2414 }), 0, bodyY + 0.05, 0);
  if (!spec.robe) part(rig, 0.1, 0.07, 0.04, lambert({ color: 0xd8b04a, metalness: 0.5, roughness: 0.4 }), 0, bodyY + 0.05, 0.155);
  if (spec.apron) part(rig, 0.44, 0.72, 0.03, lambert({ color: spec.apron }), 0, bodyY + 0.14, 0.155);
  if (spec.cape) {
    const cape = part(rig, 0.5, 0.86, 0.04, lambert({ map: solidTexture(spec.cape, 29) }), 0, bodyY + 0.22, -0.17);
    cape.rotation.x = 0.06;
  }

  // ----- Arms (pivot at shoulder) -----
  const arms = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.37, bodyY + 0.6, 0);
    rig.add(pivot);
    part(pivot, 0.22, 0.4, 0.24, shirtPlain, 0, -0.18, 0);
    part(pivot, 0.2, 0.24, 0.22, skinMat, 0, -0.5, 0);
    // Hand anchor: items are parented here, held pointing forward.
    const hand = new THREE.Group();
    hand.position.set(0, -0.58, 0.04);
    pivot.add(hand);
    pivot.userData.hand = hand;
    arms.push(pivot);
  }

  // ----- Head -----
  const headPivot = new THREE.Group();
  headPivot.position.set(0, bodyY + 0.66, 0);
  rig.add(headPivot);
  const topMat = lambert({ map: spec.hairStyle === 'bald' ? solidTexture(spec.skin, 31) : solidTexture(spec.hair, 31) });
  const headMats = [
    lambert({ map: hairSideTexture(spec, 'right') }), // +x
    lambert({ map: hairSideTexture(spec, 'left') }), // -x
    topMat, // +y
    skinMat, // -y
    lambert({ map: faceTexture(spec) }), // +z (face)
    lambert({ map: hairSideTexture(spec, 'back') }), // -z
  ];
  const head = new THREE.Mesh(boxGeo(0.5, 0.5, 0.5), headMats);
  head.position.y = 0.25;
  head.castShadow = true;
  headPivot.add(head);

  if (spec.ears) {
    for (const s of [-1, 1]) {
      const ear = part(headPivot, 0.08, 0.2, 0.08, skinMat, s * 0.28, 0.32, -0.02);
      ear.rotation.z = -s * 0.5;
    }
  }
  if (spec.helmet) {
    const hm = lambert({ color: spec.helmet, metalness: 0.6, roughness: 0.35 });
    part(headPivot, 0.56, 0.18, 0.56, hm, 0, 0.53, 0);
    part(headPivot, 0.58, 0.06, 0.58, hm, 0, 0.44, 0);
    if (spec.belt) part(headPivot, 0.06, 0.14, 0.06, lambert({ color: 0xc8372d }), 0, 0.68, 0);
  }
  if (spec.wizardHat) {
    const hm = lambert({ map: solidTexture(spec.wizardHat, 37) });
    part(headPivot, 0.72, 0.06, 0.72, hm, 0, 0.53, 0);
    part(headPivot, 0.44, 0.22, 0.44, hm, 0, 0.67, 0);
    part(headPivot, 0.3, 0.2, 0.3, hm, 0.03, 0.86, -0.02);
    part(headPivot, 0.16, 0.16, 0.16, hm, 0.07, 1.02, -0.05);
    part(headPivot, 0.46, 0.06, 0.46, lambert({ color: 0xf2c84b }), 0, 0.6, 0);
  }

  if (spec.hat) {
    const hm = lambert({ color: spec.hat.color ?? 0x8a5a32 });
    const kind = spec.hat.type;
    if (kind === 'cap') {
      part(headPivot, 0.56, 0.16, 0.56, hm, 0, 0.56, 0);
      part(headPivot, 0.6, 0.05, 0.3, hm, 0, 0.5, 0.36);
    } else if (kind === 'crown') {
      const gold = lambert({ color: 0xf2c84b, metalness: 0.6, roughness: 0.3, emissive: 0x6a4a10, emissiveIntensity: 0.3 });
      part(headPivot, 0.54, 0.1, 0.54, gold, 0, 0.55, 0);
      for (const [x, z] of [[-0.22, 0.22], [0.22, 0.22], [-0.22, -0.22], [0.22, -0.22], [0, 0.24], [0, -0.24], [0.24, 0], [-0.24, 0]]) part(headPivot, 0.09, 0.14, 0.09, gold, x, 0.66, z);
      part(headPivot, 0.08, 0.08, 0.04, lambert({ color: 0xd8382e, emissive: 0x8a1a10, emissiveIntensity: 0.5 }), 0, 0.56, 0.28);
    } else if (kind === 'chef') {
      const w = lambert({ color: 0xffffff });
      part(headPivot, 0.54, 0.1, 0.54, w, 0, 0.55, 0);
      part(headPivot, 0.62, 0.32, 0.62, w, 0, 0.76, 0);
    } else if (kind === 'bandana') {
      part(headPivot, 0.54, 0.14, 0.54, hm, 0, 0.47, 0);
      part(headPivot, 0.14, 0.18, 0.08, hm, 0.12, 0.38, -0.3);
    } else if (kind === 'flowers') {
      const colors = [0xff6b9d, 0xffd93d, 0xffffff, 0xb07aff, 0xff8a3d];
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        part(headPivot, 0.12, 0.12, 0.12, lambert({ color: colors[i % 5] }), Math.cos(a) * 0.28, 0.52, Math.sin(a) * 0.28);
      }
    } else if (kind === 'hood') {
      part(headPivot, 0.58, 0.2, 0.58, hm, 0, 0.55, -0.02);
      part(headPivot, 0.58, 0.5, 0.1, hm, 0, 0.3, -0.29);
      part(headPivot, 0.06, 0.5, 0.56, hm, 0.29, 0.3, -0.02);
      part(headPivot, 0.06, 0.5, 0.56, hm, -0.29, 0.3, -0.02);
      part(headPivot, 0.5, 0.1, 0.04, hm, 0, 0.12, 0.27);
    }
  }

  root.userData = {
    dynamic: true,
    walkPhase: 0,
    isMoving: false,
    action: null,
    parts: { rig, head: headPivot, leftArm: arms[0], rightArm: arms[1], leftLeg: legs[0], rightLeg: legs[1] },
  };
  return root;
}

// Limb animation. Call every frame with the time step.
export function animateCharacter(ch, dt, elapsed) {
  const u = ch.userData;
  const p = u.parts;
  if (!p) return;
  const swing = u.isMoving ? Math.sin(u.walkPhase) * 0.75 : 0;
  const ease = Math.min(1, dt * 12);
  const lerpTo = (obj, target) => { obj.rotation.x += (target - obj.rotation.x) * ease; };

  lerpTo(p.leftLeg, swing);
  lerpTo(p.rightLeg, -swing);
  lerpTo(p.leftArm, -swing * 0.8);

  // Right arm: walking swing, holding pose, or an action (swing / drink / raise).
  const holding = !!u.held;
  let rightTarget = holding ? -0.85 + swing * 0.2 : swing * 0.8;
  let rightZ = 0;
  if (u.action) {
    u.action.t += dt;
    const k = Math.min(1, u.action.t / u.action.duration);
    if (u.action.kind === 'swing') {
      // Raise then strike down.
      rightTarget = k < 0.35 ? lerp(-0.6, -2.6, k / 0.35) : lerp(-2.6, -0.2, (k - 0.35) / 0.65);
    } else if (u.action.kind === 'raise') {
      rightTarget = -2.7 + Math.sin(k * Math.PI * 4) * 0.15;
      rightZ = -0.2;
    } else if (u.action.kind === 'drink') {
      rightTarget = -1.9;
      rightZ = 0.5;
      p.head.rotation.x = -0.35 * Math.sin(k * Math.PI);
    }
    p.rightArm.rotation.x = rightTarget;
    p.rightArm.rotation.z = rightZ;
    if (k >= 1) {
      u.action = null;
      p.head.rotation.x = 0;
      p.rightArm.rotation.z = 0;
    }
  } else {
    lerpTo(p.rightArm, rightTarget);
    p.rightArm.rotation.z += (0 - p.rightArm.rotation.z) * ease;
  }

  // Body bob while walking, breathing while idle.
  p.rig.position.y = u.isMoving ? Math.abs(Math.sin(u.walkPhase)) * 0.05 : Math.sin(elapsed * 2 + ch.id) * 0.008;
  if (!u.isMoving && !u.action) p.head.rotation.y = Math.sin(elapsed * 0.6 + ch.id) * 0.25;
  else p.head.rotation.y *= 0.9;
}

function lerp(a, b, t) { return a + (b - a) * t; }

export function playAction(ch, kind, duration = 0.5) {
  ch.userData.action = { kind, t: 0, duration };
}

// Outfits the hero can wear (bought with stars or earned through quests).
const HERO = CHARACTER_SPECS.hero;
export const COSTUMES = [
  { id: 'hero', price: 0, emoji: '🧒', name: { fr: 'Aventurier', en: 'Adventurer' }, spec: HERO },
  { id: 'explorer', price: 15, emoji: '🧭', name: { fr: 'Explorateur', en: 'Explorer' }, spec: { ...HERO, shirt: 0x6a8a3a, trim: 0xd8b04a, pants: 0x8a6a3a, cape: null, hat: { type: 'cap', color: 0x7a5a2a } } },
  { id: 'cook', price: 20, emoji: '👨‍🍳', name: { fr: 'Cuisinier', en: 'Cook' }, spec: { ...HERO, shirt: 0xf4f0e6, trim: 0xd8382e, pants: 0x3a3a46, apron: 0xffffff, cape: null, hat: { type: 'chef' } } },
  { id: 'pirate', price: 30, emoji: '🏴‍☠️', name: { fr: 'Pirate', en: 'Pirate' }, spec: { ...HERO, shirt: 0xf0ead8, trim: 0x2a2a2a, pants: 0x2a2a3a, belt: 0x8a3b2e, cape: null, mustache: 0x3a2214, hat: { type: 'bandana', color: 0xc8372d } } },
  { id: 'flower', price: 25, emoji: '🌸', name: { fr: 'Jardinier', en: 'Gardener' }, spec: { ...HERO, shirt: 0xf2a0c8, trim: 0xffffff, pants: 0x5a8a3a, cape: null, hat: { type: 'flowers' } } },
  { id: 'ninja', price: 40, emoji: '🥷', name: { fr: 'Ninja', en: 'Ninja' }, spec: { ...HERO, shirt: 0x26262e, trim: 0xc8372d, pants: 0x1e1e24, shoes: 0x111114, cape: null, hat: { type: 'hood', color: 0x1e1e24 } } },
  { id: 'knight', price: 50, emoji: '🛡️', name: { fr: 'Chevalier', en: 'Knight' }, spec: { ...HERO, shirt: 0xb8bcc4, trim: 0xc8372d, pants: 0x6a6e76, cape: 0x2a4f9a, helmet: 0xc8ccd4 } },
  { id: 'wizard', price: 60, emoji: '🧙', name: { fr: 'Sorcier', en: 'Wizard' }, spec: { ...HERO, shirt: 0x5a3aa8, trim: 0xf2c84b, pants: 0x5a3aa8, robe: true, cape: null, wizardHat: 0x4a2c98 } },
  { id: 'king', price: 80, emoji: '👑', name: { fr: 'Roi', en: 'Royal' }, spec: { ...HERO, shirt: 0xa8302a, trim: 0xf2c84b, pants: 0x3a2a5a, cape: 0x6a2a9a, hat: { type: 'crown' } } },
];
