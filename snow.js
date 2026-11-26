// The snow golem and the snowball fight (J7). Session 1: on the western slope of the mountain, a heap
// of snow wakes up: Flocon, the snow golem, wants a snowball fight. His snowballs never hurt ("Pouf!"
// and the hero is a snowman for 2 seconds: "Brrr!"); the hero picks up snow in the white heaps and
// throws it back with the ❄️ button. A word every 3 hits, 6 hits win a round, 3 rounds win an ice
// crystal. The dog jumps to catch the snowballs.
// Session 2: build your own snowman in front of the cottage: roll 3 balls that grow as you walk,
// spell CAROTTE for the nose, choose a hat; he stays there and dances at night. Then a revenge match
// against Flocon, who throws faster: winning it gives the snowman a red scarf.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SNOW_ARENA } from './regions.js';

export const ARENA = SNOW_ARENA;
export const GOLEM_HOME = { x: ARENA.x, z: ARENA.z - 4.5 };
export const PILES = [[-3.6, 2.6], [0, 4.0], [3.6, 2.6]].map(([dx, dz]) => ({ x: ARENA.x + dx, z: ARENA.z + dz }));
export const SNOWMAN = { x: -6.4, z: 21.2 }; // in front of the cottage, on the left (the camera sees it)
export const PATCH = { x: -8.8, z: 24.6 };
export const HITS_PER_WORD = 3, HITS_PER_ROUND = 6, ROUNDS = 3, REV_ROUNDS = 2, PILE_BALLS = 5;
export const ROLL_DIST = [8, 6, 4.5]; // metres to walk for each ball (bottom, middle, head)
export const ROLL_R = [0.62, 0.46, 0.34];
export const HATS = ['top', 'bucket', 'beanie'];
export const CARROT_WORD = { fr: 'carotte', en: 'carrot' };
export const CRYSTAL_WORD = { fr: 'cristal', en: 'crystal' };

export const SX = {
  fr: {
    name: 'Le golem de neige', golem: 'Flocon', label: '⛄ Flocon', pile: '❄️ Neige', patch: '⛄ Bonhomme de neige', mine: '⛄ Mon bonhomme',
    wake: 'Ho ho ho ! Je suis Flocon, le golem de neige ! Bataille de boules de neige !',
    howTo: 'Ramasse de la neige dans un tas blanc, puis appuie sur le bouton ❄️ pour lancer !',
    pick: (n) => `${n} boules de neige ! Appuie sur le bouton ❄️ pour lancer !`,
    empty: 'Plus de boules ! Ramasse de la neige dans un tas blanc.',
    pouf: 'Pouf !', brrr: 'Brrr ! Tu es un bonhomme de neige !', touched: 'Touché !', dodgeFloat: 'Raté !',
    dodge: 'Hi hi ! Raté ! Flocon a fait un pas de côté !',
    dog: 'Ouaf ! Ton chien a attrapé la boule !',
    wordTitle: 'La bataille de boules', wordInstr: 'Trois boules sur Flocon ! Épelle ce mot pour gagner le point !',
    point: 'Un point ! Encore trois boules et la manche est à toi !',
    round: (k, n) => `Manche gagnée ! (${k}/${n}) Flocon tombe dans la neige… et se relève !`,
    roundSay: (k, n) => `Manche gagnée ! ${k} sur ${n} ! Flocon tombe dans la neige… et se relève !`,
    crystalInstr: 'Flocon te tend un cristal de glace ! Épelle CRISTAL pour le prendre !',
    crystal: 'Tu as gagné la bataille ! Voici un cristal de glace, tout brillant !',
    crystalSay: 'Tu as gagné la bataille ! Voici un cristal de glace, tout brillant ! À ton prochain retour, tu construiras ton bonhomme de neige !',
    partTwo: 'Flocon a laissé de la neige devant ta chaumière : construis ton bonhomme de neige ! Suis la flèche !',
    patchLater: 'Ici, tu construiras ton bonhomme de neige, à ton prochain retour ! D’abord, gagne la bataille contre Flocon, dans la montagne : suis la flèche !',
    patchFight: 'Ici, tu construiras ton bonhomme de neige ! Mais d’abord, gagne la bataille contre Flocon, dans la montagne : suis la flèche !',
    rollStart: 'Pousse la boule de neige : marche, et elle grossit !',
    rollTitle: 'Le bonhomme de neige', rollBig: 'La boule est assez grosse ! Épelle ce mot pour la poser !',
    placed: (k) => ['La grosse boule du bas est posée ! Roule la boule du milieu : marche !', 'La boule du milieu est posée ! Plus que la tête : marche !', 'La tête est posée ! Il lui faut un nez…'][k],
    carrotInstr: 'Il lui faut un nez ! Épelle CAROTTE !',
    carrot: 'Une carotte pour le nez ! Choisis son chapeau :',
    hats: { top: '🎩 Chapeau haut', bucket: '🪣 Seau', beanie: '🧶 Bonnet' },
    hatPicked: 'Ton bonhomme de neige est fini ! La nuit, il danse devant ta chaumière !',
    revenge: 'Flocon veut sa revanche ! Va le voir dans la montagne : il lance plus vite maintenant !',
    revStart: 'Revanche ! Cette fois, je lance plus vite ! Ho ho !',
    revWon: 'Tu as gagné la revanche ! Flocon offre une écharpe rouge à ton bonhomme de neige !',
    idle: 'Ho ho ! Belle bataille ! Reviens à ton prochain retour : tu construiras ton bonhomme de neige, et je veux ma revanche !',
    idleBuild: 'Ho ho ! Construis d’abord ton bonhomme de neige, devant ta chaumière. Après, revanche !',
    idleDone: 'Ho ho ! Tu es le champion des boules de neige !',
    battleTouch: 'Lance-moi des boules de neige ! Ramasse de la neige dans un tas blanc.',
    snowmanDance: 'Ton bonhomme de neige fait une petite danse !',
    snowmanNight: 'Regarde : la nuit, ton bonhomme de neige danse !',
    letter: (l, w) => `La lettre ${l}… comme dans ${w}.`,
    notYet: 'va dans la montagne : Flocon t’attend !',
    lines1: (k, n) => `❄️ Manches gagnées : ${k}/${n}`,
    lines2: (b, rev, n) => `⛄ Bonhomme de neige : ${b}/3 boules · revanche : ${rev}/${n}`,
  },
  en: {
    name: 'The snow golem', golem: 'Flake', label: '⛄ Flake', pile: '❄️ Snow', patch: '⛄ Snowman', mine: '⛄ My snowman',
    wake: 'Ho ho ho! I am Flake, the snow golem! Snowball fight!',
    howTo: 'Pick up snow from a white heap, then press the ❄️ button to throw!',
    pick: (n) => `${n} snowballs! Press the ❄️ button to throw!`,
    empty: 'No more snowballs! Pick up snow from a white heap.',
    pouf: 'Poof!', brrr: 'Brrr! You are a snowman!', touched: 'Hit!', dodgeFloat: 'Missed!',
    dodge: 'Hee hee! Missed! Flake stepped aside!',
    dog: 'Woof! Your dog caught the snowball!',
    wordTitle: 'The snowball fight', wordInstr: 'Three snowballs on Flake! Spell this word to win the point!',
    point: 'One point! Three more snowballs and the round is yours!',
    round: (k, n) => `Round won! (${k}/${n}) Flake falls in the snow… and gets up again!`,
    roundSay: (k, n) => `Round won! ${k} of ${n}! Flake falls in the snow… and gets up again!`,
    crystalInstr: 'Flake hands you an ice crystal! Spell CRYSTAL to take it!',
    crystal: 'You won the fight! Here is an ice crystal, all shiny!',
    crystalSay: 'You won the fight! Here is an ice crystal, all shiny! Next time you come back, you will build your snowman!',
    partTwo: 'Flake left some snow in front of your cottage: build your snowman! Follow the arrow!',
    patchLater: 'Here you will build your snowman, next time you come back! First, win the fight against Flake, on the mountain: follow the arrow!',
    patchFight: 'Here you will build your snowman! But first, win the fight against Flake, on the mountain: follow the arrow!',
    rollStart: 'Push the snowball: walk, and it grows!',
    rollTitle: 'The snowman', rollBig: 'The ball is big enough! Spell this word to put it in place!',
    placed: (k) => ['The big bottom ball is in place! Roll the middle ball: walk!', 'The middle ball is in place! Only the head now: walk!', 'The head is in place! He needs a nose…'][k],
    carrotInstr: 'He needs a nose! Spell CARROT!',
    carrot: 'A carrot for his nose! Choose his hat:',
    hats: { top: '🎩 Top hat', bucket: '🪣 Bucket', beanie: '🧶 Beanie' },
    hatPicked: 'Your snowman is finished! At night, he dances in front of your cottage!',
    revenge: 'Flake wants a rematch! Go and see him on the mountain: he throws faster now!',
    revStart: 'Rematch! This time I throw faster! Ho ho!',
    revWon: 'You won the rematch! Flake gives your snowman a red scarf!',
    idle: 'Ho ho! Great fight! Come back next time: you will build your snowman, and I want a rematch!',
    idleBuild: 'Ho ho! First build your snowman, in front of your cottage. Then, rematch!',
    idleDone: 'Ho ho! You are the snowball champion!',
    battleTouch: 'Throw snowballs at me! Pick up snow from a white heap.',
    snowmanDance: 'Your snowman does a little dance!',
    snowmanNight: 'Look: at night, your snowman dances!',
    letter: (l, w) => `The letter ${l}… as in ${w}.`,
    notYet: 'go to the mountain: Flake is waiting for you!',
    lines1: (k, n) => `❄️ Rounds won: ${k}/${n}`,
    lines2: (b, rev, n) => `⛄ Snowman: ${b}/3 balls · rematch: ${rev}/${n}`,
  },
};

function colorize(g, c) {
  const n = g.attributes.position.count, arr = new Float32Array(n * 3), col = new THREE.Color(c);
  for (let i = 0; i < n; i++) { arr[i * 3] = col.r; arr[i * 3 + 1] = col.g; arr[i * 3 + 2] = col.b; }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  if (g.attributes.uv) g.deleteAttribute('uv');
  return g;
}
function box(w, h, d, c, x, y, z, rx = 0, rz = 0, ry = 0) {
  const g = new THREE.BoxGeometry(w, h, d).toNonIndexed();
  if (rx) g.rotateX(rx);
  if (rz) g.rotateZ(rz);
  if (ry) g.rotateY(ry);
  g.translate(x, y, z);
  return colorize(g, c);
}
function cyl(r0, r1, h, c, x, y, z, seg = 10) { const g = new THREE.CylinderGeometry(r0, r1, h, seg).toNonIndexed(); g.translate(x, y, z); return colorize(g, c); }
function merge(geos) { const g = mergeGeometries(geos); geos.forEach((x) => x.dispose()); return g; }
const MAT = () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
function mesh(geos, mat = MAT()) { const m = new THREE.Mesh(merge(geos), mat); m.castShadow = true; m.userData.dynamic = true; return m; }

const SNOW = 0xf6f9ff, SNOW_SH = 0xdfe8f4, COAL = 0x22252b, CARROT = 0xff8a2a, STICK = 0x6a4428;
// Flocon: three big blocks of snow, coal eyes and smile, a carrot nose, a blue bucket on his head;
// his stick arms in a second mesh (they throw). About 3 m tall. 2 draw calls.
export function buildSnowGolem() {
  const g = new THREE.Group();
  g.userData.dynamic = true;
  const rig = new THREE.Group();
  g.add(rig);
  const body = mesh([
    box(1.3, 1.0, 1.3, SNOW, 0, 0.5, 0), box(1.1, 0.12, 1.1, SNOW_SH, 0, 1.02, 0),
    box(1.0, 0.9, 1.0, SNOW, 0, 1.45, 0),
    box(0.14, 0.14, 0.06, COAL, 0, 1.6, 0.52), box(0.14, 0.14, 0.06, COAL, 0, 1.3, 0.52), box(0.14, 0.14, 0.06, COAL, 0, 0.7, 0.67), // buttons
    box(0.8, 0.75, 0.8, SNOW, 0, 2.28, 0), // head
    box(0.16, 0.16, 0.06, COAL, -0.18, 2.4, 0.41), box(0.16, 0.16, 0.06, COAL, 0.18, 2.4, 0.41), // eyes
    box(0.12, 0.12, 0.5, CARROT, 0, 2.25, 0.62), box(0.08, 0.08, 0.2, 0xff9a40, 0, 2.25, 0.92), // carrot nose
    box(0.08, 0.06, 0.06, COAL, -0.2, 2.06, 0.41), box(0.08, 0.06, 0.06, COAL, -0.08, 2.02, 0.41), box(0.08, 0.06, 0.06, COAL, 0.08, 2.02, 0.41), box(0.08, 0.06, 0.06, COAL, 0.2, 2.06, 0.41), // smile
    cyl(0.36, 0.44, 0.5, 0x4a8ad8, 0.05, 2.9, 0, 10), cyl(0.46, 0.46, 0.06, 0x3a6ab0, 0.05, 2.66, 0, 10), // blue bucket
  ]);
  rig.add(body);
  const arms = new THREE.Group();
  arms.position.set(0, 1.55, 0);
  arms.add(mesh([
    box(0.9, 0.1, 0.1, STICK, -0.9, 0.18, 0, 0, 0.35), box(0.3, 0.07, 0.07, STICK, -1.4, 0.48, 0.05, 0, 1.2), box(0.25, 0.07, 0.07, STICK, -1.42, 0.3, -0.05, 0, -0.3),
    box(0.9, 0.1, 0.1, STICK, 0.9, 0.18, 0, 0, -0.35), box(0.3, 0.07, 0.07, STICK, 1.4, 0.48, 0.05, 0, -1.2), box(0.25, 0.07, 0.07, STICK, 1.42, 0.3, -0.05, 0, 0.3),
  ]));
  rig.add(arms);
  g.userData.parts = { rig, body, arms };
  g.scale.setScalar(1.15);
  return g;
}

// The hero turned into a snowman for 2 seconds ("Brrr!"). 1 draw call.
function buildShell() {
  const m = mesh([
    box(1.0, 0.85, 1.0, SNOW, 0, 0.42, 0), box(0.82, 0.7, 0.82, SNOW, 0, 1.18, 0), box(0.66, 0.6, 0.66, SNOW, 0, 1.82, 0),
    box(0.1, 0.1, 0.05, COAL, -0.14, 1.9, 0.34), box(0.1, 0.1, 0.05, COAL, 0.14, 1.9, 0.34), box(0.1, 0.1, 0.36, CARROT, 0, 1.8, 0.48),
    box(0.1, 0.1, 0.05, COAL, 0, 1.25, 0.42), box(0.1, 0.1, 0.05, COAL, 0, 1.0, 0.42),
  ]);
  m.visible = false;
  return m;
}

// The heaps of snow to pick up snowballs from (3 heaps, 1 draw call).
function buildPiles(groundAt) {
  const geos = [];
  for (const [k, p] of PILES.entries()) {
    const dx = p.x, dz = p.z, y = groundAt(dx, dz);
    geos.push(box(1.4, 0.35, 1.2, SNOW, dx, y + 0.17, dz, 0, 0, k * 0.5), box(0.9, 0.3, 0.8, SNOW, dx + 0.1, y + 0.48, dz - 0.05, 0, 0, k * 0.5 + 0.3), box(0.45, 0.22, 0.4, SNOW_SH, dx - 0.1, y + 0.72, dz + 0.05, 0, 0, k));
    for (let i = 0; i < 4; i++) geos.push(new THREE.IcosahedronGeometry(0.15, 0).translate(dx + Math.cos(i * 1.7 + k) * 0.85, y + 0.15, dz + Math.sin(i * 1.7 + k) * 0.75));
  }
  for (const g of geos) if (!g.attributes.color) colorize(g, SNOW);
  return mesh(geos);
}

// The snowy ground of the arena (a big flat patch of snow blocks) and the snow patch by the cottage.
function snowPatch(cx, cz, r, seed, groundAt) {
  const geos = [];
  for (let x = -r; x <= r; x += 1) for (let z = -r; z <= r; z += 1) {
    const d = Math.hypot(x, z) + (((x * 7 + z * 13 + seed) % 5) / 5) * 0.8;
    if (d > r) continue;
    const gx = cx + x, gz = cz + z, gy = groundAt(gx, gz);
    geos.push(box(1.02, 0.06, 1.02, (x + z) % 2 ? SNOW : 0xeef3fb, gx, gy + 0.03, gz));
  }
  const m = new THREE.Mesh(merge(geos), MAT());
  m.receiveShadow = true; m.userData.dynamic = true;
  return m;
}

// The player's snowman, in front of the cottage: 3 balls, the face (eyes, buttons, carrot, arms),
// three hats, a red scarf.
function buildSnowmanParts() {
  const ballGeo = new THREE.IcosahedronGeometry(1, 2);
  const ballMat = new THREE.MeshStandardMaterial({ color: SNOW, roughness: 0.9, flatShading: true });
  const balls = [0, 1, 2].map(() => { const b = new THREE.Mesh(ballGeo, ballMat); b.castShadow = true; b.userData.dynamic = true; b.visible = false; return b; });
  const roll = new THREE.Mesh(ballGeo, ballMat); roll.castShadow = true; roll.userData.dynamic = true; roll.visible = false;
  const face = mesh([
    box(0.08, 0.08, 0.05, COAL, -0.12, 0.08, 0.3), box(0.08, 0.08, 0.05, COAL, 0.12, 0.08, 0.3), // eyes
    box(0.08, 0.08, 0.38, CARROT, 0, -0.02, 0.48), // carrot
    box(0.06, 0.05, 0.05, COAL, -0.1, -0.13, 0.3), box(0.06, 0.05, 0.05, COAL, 0, -0.16, 0.31), box(0.06, 0.05, 0.05, COAL, 0.1, -0.13, 0.3),
  ]);
  const body = mesh([
    box(0.09, 0.09, 0.05, COAL, 0, 0.12, 0.45), box(0.09, 0.09, 0.05, COAL, 0, -0.1, 0.46),
    box(0.8, 0.07, 0.07, STICK, -0.75, 0.15, 0, 0, 0.4), box(0.25, 0.05, 0.05, STICK, -1.12, 0.38, 0, 0, 1.2),
    box(0.8, 0.07, 0.07, STICK, 0.75, 0.15, 0, 0, -0.4), box(0.25, 0.05, 0.05, STICK, 1.12, 0.38, 0, 0, -1.2),
  ]);
  const hats = {
    top: mesh([cyl(0.22, 0.22, 0.36, 0x1a1a22, 0, 0.2, 0, 12), cyl(0.36, 0.36, 0.04, 0x1a1a22, 0, 0.02, 0, 12), cyl(0.225, 0.225, 0.07, 0xd0303a, 0, 0.08, 0, 12)]),
    bucket: mesh([cyl(0.2, 0.28, 0.34, 0x8a96a4, 0, 0.17, 0, 10), cyl(0.29, 0.29, 0.04, 0x6a7684, 0, 0.02, 0, 10)]),
    beanie: mesh([cyl(0.24, 0.31, 0.26, 0xd84a6a, 0, 0.13, 0, 10), cyl(0.32, 0.32, 0.08, 0xf2f2f2, 0, 0.03, 0, 10), colorize(new THREE.IcosahedronGeometry(0.1, 1).translate(0, 0.32, 0), 0xffffff)]),
  };
  const scarf = mesh([cyl(0.36, 0.4, 0.12, 0xd8302a, 0, 0, 0, 12), box(0.14, 0.4, 0.05, 0xd8302a, 0.16, -0.2, 0.36, 0.2, 0.1), box(0.14, 0.06, 0.06, 0xffffff, 0.16, -0.38, 0.38)]);
  for (const m of [face, body, scarf, ...Object.values(hats)]) m.visible = false;
  return { balls, roll, face, body, hats, scarf };
}

export class SnowWorld {
  constructor(scene3D) {
    const s = this.s = scene3D;
    this.arena = new THREE.Group();
    this.arena.userData.dynamic = true;
    s.scene.add(this.arena);
    this.arena.add(snowPatch(ARENA.x, ARENA.z, 7, 3, (x, z) => s.groundAt(x, z)));
    // Flocon (a heap of snow until he wakes up).
    this.golem = buildSnowGolem();
    this.home = new THREE.Vector3(GOLEM_HOME.x, s.groundAt(GOLEM_HOME.x, GOLEM_HOME.z), GOLEM_HOME.z);
    this.golem.position.copy(this.home);
    this.arena.add(this.golem);
    s.collidables.push({ x: GOLEM_HOME.x, z: GOLEM_HOME.z, r: 0.9 });
    this.gobj = s._addInteractable({ kind: 'snowgolem', worldPos: this.home.clone(), iconY: 3.8, reach: 3.6, hitRadius: 1.3 });
    // The heaps of snow (on the ground of each spot).
    this.arena.add(buildPiles((x, z) => s.groundAt(x, z)));
    this.pileObjs = PILES.map((p, i) => s._addInteractable({ kind: 'snowpile', pile: i, worldPos: new THREE.Vector3(p.x, s.groundAt(p.x, p.z), p.z), iconY: 1.5, reach: 2.4, hitRadius: 1.0 }));
    // Snowballs in the air (both sides): one instanced mesh.
    this.ballMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.17, 1), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, emissive: 0x334455, emissiveIntensity: 0.2 }), 10);
    this.ballMesh.userData.dynamic = true; this.ballMesh.frustumCulled = false;
    s.scene.add(this.ballMesh);
    this.flying = [];
    this.shell = buildShell();
    s.scene.add(this.shell);
    this.shellT = 0;
    // In the village: the snow patch and the snowman.
    this.patch = snowPatch(PATCH.x, PATCH.z, 2.3, 1, (x, z) => s.groundAt(x, z));
    s.scene.add(this.patch);
    this.pobj = s._addInteractable({ kind: 'snowpatch', worldPos: new THREE.Vector3(PATCH.x, s.groundAt(PATCH.x, PATCH.z), PATCH.z), iconY: 1.2, reach: 2.8, hitRadius: 1.4 });
    this.man = buildSnowmanParts();
    this.manRoot = new THREE.Group();
    this.manRoot.userData.dynamic = true;
    this.manRoot.position.set(SNOWMAN.x, s.groundAt(SNOWMAN.x, SNOWMAN.z), SNOWMAN.z);
    this.manRoot.rotation.y = 0.25;
    this.manRig = new THREE.Group();
    this.manRoot.add(this.manRig);
    for (const b of this.man.balls) this.manRig.add(b);
    this.manRig.add(this.man.face, this.man.body, this.man.scarf, ...Object.values(this.man.hats));
    s.scene.add(this.manRoot, this.man.roll);
    this.mobj = s._addInteractable({ kind: 'snowman', worldPos: this.manRoot.position.clone(), iconY: 2.6, reach: 2.6, hitRadius: 1.0 });
    this.mobj.active = false; this.mobj.iconHolder.visible = false;
    // State (from the game).
    this.state = { stack: 0, nose: false, hat: null, scarf: false };
    this.phase = 'sleep'; // sleep | wake | battle | down | idle
    this.fast = false; this.paused = false;
    this.t = 0; this.throwT = 2.5; this.armT = -1; this.dodgeT = -1; this.dodgeDir = 1; this.downT = -1; this.wakeT = -1; this.hitT = -1; this.waveT = -1;
    this.roll = null; // { k, dist, last }
    this.danceT = -1; this.dogCatches = 0; this.heroHits = 0; this.golemThrows = 0;
    this._d = new THREE.Object3D();
    this.layoutMan();
    this._ballsLayout();
  }
  // Flocon's look for each phase. A heap when asleep.
  setPhase(ph) { this.phase = ph; if (ph === 'battle') this.throwT = Math.max(this.throwT, 1.8); }
  inArena(p = this.s.player.position) { return Math.hypot(p.x - ARENA.x, p.z - ARENA.z) < ARENA.r + 1.5; }
  near(d = 9) { const p = this.s.player.position; return Math.hypot(p.x - this.home.x, p.z - this.home.z) < d; }
  // Wow: the heap of snow bursts and Flocon stands up.
  wake() {
    this.phase = 'wake'; this.wakeT = 0;
    const p = this.home.clone(); p.y += 1.5;
    for (const c of ['#ffffff', '#cfe8ff', '#9ad0ff', '#ffffff']) this.s.particleBurst(p, c, 30);
    this.s.screenShake?.(0.25);
  }
  fall() { this.phase = 'down'; this.downT = 0; const p = this.golem.position.clone(); p.y += 1; for (const c of ['#ffffff', '#cfe8ff']) this.s.particleBurst(p, c, 26); }
  wave() { this.waveT = 1.6; }
  // The hero throws a snowball at Flocon (he may step aside).
  throwBall(dodge) {
    const p = this.s.player.position;
    const from = new THREE.Vector3(p.x, p.y + 1.4, p.z);
    const to = this.golem.position.clone().add(new THREE.Vector3(0, 1.8, 0));
    if (dodge) { this.dodgeT = 0.9; this.dodgeDir = Math.random() < 0.5 ? -1 : 1; to.add(new THREE.Vector3(0, 0.4, -2.2)); }
    this.flying.push({ from, to, t: 0, dur: 0.55, h: 1.2, who: 'hero', dodge });
    this.s.player.rotation.y = Math.atan2(to.x - p.x, to.z - p.z);
  }
  _golemThrow() {
    const p = this.s.player.position, g = this.golem.position;
    const from = new THREE.Vector3(g.x + 0.9, g.y + 2.6, g.z + 0.3);
    const to = new THREE.Vector3(p.x, p.y + 1.0, p.z);
    const f = { from, to, t: 0, dur: this.fast ? 0.85 : 1.15, h: 2.0, who: 'golem' };
    this.golemThrows++;
    // The dog jumps to catch it (now and then).
    const pet = this.s.pet;
    if (pet?.tamed && this.golemThrows > 1 && Math.random() < (this.dogChance ?? 0.3) && pet.mesh.position.distanceTo(p) < 6) { f.dog = true; f.to = pet.mesh.position.clone().add(new THREE.Vector3(0, 1.3, 0)); }
    this.flying.push(f);
    this.onThrow?.(f);
  }
  _ballsLayout() {
    const d = this._d;
    for (let i = 0; i < 10; i++) {
      const f = this.flying[i];
      if (f) {
        const k = Math.min(1, f.t / f.dur);
        d.position.lerpVectors(f.from, f.to, k); d.position.y += Math.sin(k * Math.PI) * f.h;
        d.scale.setScalar(1);
      } else { d.position.set(0, -50, 0); d.scale.setScalar(0.0001); }
      d.updateMatrix();
      this.ballMesh.setMatrixAt(i, d.matrix);
    }
    this.ballMesh.instanceMatrix.needsUpdate = true;
  }
  // The hero becomes a snowman for 2 seconds.
  freeze() { this.shellT = 2; this.heroHits++; const p = this.s.player.position.clone(); p.y += 1; for (const c of ['#ffffff', '#cfe8ff']) this.s.particleBurst(p, c, 24); }
  // The player's snowman: balls stacked so far, nose, hat, scarf.
  setMan(st) { Object.assign(this.state, st); this.layoutMan(); }
  layoutMan() {
    const st = this.state, M = this.man;
    let y = 0;
    const tops = [];
    M.balls.forEach((b, i) => {
      const r = ROLL_R[i];
      y += i === 0 ? r * 0.85 : ROLL_R[i - 1] * 0.8 + r * 0.8;
      b.position.set(0, y, 0); b.scale.setScalar(r);
      b.visible = i < st.stack;
      tops.push(y);
    });
    M.body.position.set(0, tops[1], 0); M.body.visible = st.stack >= 2 && st.nose;
    M.face.position.set(0, tops[2], 0); M.face.visible = st.stack >= 3 && st.nose;
    for (const [k, h] of Object.entries(M.hats)) { h.position.set(0, tops[2] + ROLL_R[2] * 0.8, 0); h.rotation.z = k === 'top' ? -0.12 : 0.1; h.visible = st.hat === k; }
    M.scarf.position.set(0, tops[2] - ROLL_R[2] * 0.75, 0); M.scarf.visible = !!st.scarf;
    const done = st.stack >= 3;
    this.mobj.active = st.stack > 0; this.mobj.iconHolder.visible = st.stack > 0;
    this.mobj.iconY = done ? 2.6 : 1.4;
    this.manH = tops[Math.max(0, st.stack - 1)] ?? 0;
  }
  // Rolling ball k (0, 1, 2): it sits in front of the hero and grows as he walks.
  startRoll(k) {
    const p = this.s.player.position;
    this.roll = { k, dist: 0, last: new THREE.Vector3(p.x, 0, p.z), big: false, spin: 0 };
    this.man.roll.visible = true;
    this._placeRoll(0);
    this.s.particleBurst(new THREE.Vector3(p.x, p.y + 0.4, p.z), '#ffffff', 16);
  }
  rollRadius() { const r = this.roll; if (!r) return 0; return 0.16 + (ROLL_R[r.k] - 0.16) * Math.min(1, r.dist / ROLL_DIST[r.k]); }
  _placeRoll(dt) {
    const r = this.roll, s = this.s, p = s.player.position, ry = s.player.rotation.y, rad = this.rollRadius();
    const x = p.x + Math.sin(ry) * (0.7 + rad), z = p.z + Math.cos(ry) * (0.7 + rad);
    const b = this.man.roll;
    b.position.set(x, s.groundAt(x, z) + rad * 0.92, z);
    b.scale.setScalar(rad);
    b.rotation.set(r.spin, ry, 0, 'YXZ');
  }
  // The rolled ball flies onto the snowman.
  placeRoll() {
    const r = this.roll;
    if (!r) return;
    this.man.roll.visible = false; this.roll = null;
    this.flyBall = { from: this.man.roll.position.clone(), k: r.k, t: 0 };
  }
  stopRoll() { this.roll = null; this.man.roll.visible = false; }
  dance(t = 2) { this.danceT = t; const p = this.manRoot.position.clone(); p.y += 1.5; for (const c of ['#ffffff', '#ffd34a', '#9ad0ff']) this.s.particleBurst(p, c, 14); }
  update(dt) {
    this.t += dt;
    const s = this.s, p = s.player.position, t = this.t;
    this.arena.visible = Math.hypot(p.x - ARENA.x, p.z - ARENA.z) < 60;
    const g = this.golem, P = g.userData.parts;
    P.rig.position.set(0, 0, 0); P.rig.rotation.set(0, 0, 0); P.arms.rotation.set(0, 0, 0); P.rig.scale.set(1, 1, 1);
    let face = true;
    if (this.phase === 'sleep') {
      // A heap of snow that breathes (and a carrot sticking out).
      P.rig.scale.set(1.15, 0.32 + Math.sin(t * 1.4) * 0.015, 1.15); P.rig.position.y = -0.05;
      face = false;
      if (this.arena.visible && this.near(8.5) && !s.inputLocked) this.onNear?.();
    } else if (this.phase === 'wake') {
      this.wakeT += dt;
      const k = Math.min(1, this.wakeT / 0.9), e = 1 - (1 - k) * (1 - k);
      P.rig.scale.set(1.15 - 0.15 * e, 0.32 + 0.68 * e + Math.sin(k * Math.PI) * 0.25, 1.15 - 0.15 * e);
      P.arms.rotation.z = Math.sin(this.wakeT * 14) * 0.3 * (1 - k);
      if (this.wakeT > 1.6) { this.phase = 'battle'; this.throwT = 0.6; this.onAwake?.(); }
      else if (k >= 1) { P.arms.rotation.x = -2.6 + Math.sin(this.wakeT * 18) * 0.3; }
    } else if (this.phase === 'down') {
      this.downT += dt;
      const k = this.downT < 0.5 ? this.downT / 0.5 : this.downT < 2.2 ? 1 : Math.max(0, 1 - (this.downT - 2.2) / 0.6);
      P.rig.rotation.x = -k * 1.45; P.rig.position.y = -k * 0.3; P.arms.rotation.z = k * 0.6;
      if (this.downT > 0.5 && !this.downPuff) { this.downPuff = true; this.s.particleBurst(g.position.clone().add(new THREE.Vector3(0, 0.3, -1.5)), '#ffffff', 30); this.onFlop?.(); }
      if (this.downT > 2.9) { this.downPuff = false; this.phase = this.afterDown ?? 'battle'; this.afterDown = null; this.throwT = 2.2; this.onUp?.(this.phase); }
    } else if (this.phase === 'battle' || this.phase === 'idle') {
      P.rig.position.y = Math.abs(Math.sin(t * 2.2)) * 0.06;
      P.rig.rotation.z = Math.sin(t * 1.1) * 0.04;
      const active = this.phase === 'battle' && this.inArena() && !this.paused && !s.inputLocked;
      if (active) {
        this.throwT -= dt;
        if (this.throwT <= 0.45 && this.armT < 0) this.armT = 0;
        if (this.throwT <= 0) { this.throwT = (this.fast ? 2.1 : 3.2) + Math.random() * 0.8; this._golemThrow(); }
      }
      if (this.armT >= 0) { this.armT += dt; P.arms.rotation.x = this.armT < 0.45 ? -this.armT / 0.45 * 2.4 : -2.4 + (this.armT - 0.45) / 0.25 * 3.2; if (this.armT > 0.75) this.armT = -1; }
      if (this.waveT >= 0) { this.waveT -= dt; P.arms.rotation.x = -2.6; P.arms.rotation.z = Math.sin(this.waveT * 12) * 0.4; }
    }
    // Stepping aside (a dodge): a quick hop to one side and back.
    let ox = 0;
    if (this.dodgeT >= 0) { this.dodgeT -= dt; ox = Math.sin(Math.max(0, this.dodgeT) / 0.9 * Math.PI) * 1.3 * this.dodgeDir; P.rig.rotation.z = -this.dodgeDir * 0.3 * Math.sin(Math.max(0, this.dodgeT) / 0.9 * Math.PI); if (this.dodgeT < 0) this.dodgeT = -1; }
    if (this.hitT >= 0) { this.hitT -= dt; P.rig.rotation.x = -Math.sin(this.hitT * 20) * 0.12 * this.hitT * 3; if (this.hitT < 0) this.hitT = -1; }
    g.position.set(this.home.x + ox, this.home.y, this.home.z);
    if (face) { const want = Math.atan2(p.x - g.position.x, p.z - g.position.z); let d = want - g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); g.rotation.y += d * Math.min(1, dt * 3); }
    // The snowballs in the air.
    for (const f of [...this.flying]) {
      f.t += dt;
      if (f.dog && !f.leapt && f.t > f.dur - 0.45) { f.leapt = true; s.pet?.leap?.(); }
      if (f.t < f.dur) continue;
      this.flying.splice(this.flying.indexOf(f), 1);
      const at = f.to.clone();
      s.particleBurst(at, '#ffffff', 14);
      if (f.who === 'hero') {
        if (f.dodge) this.onGolemMiss?.(); else { this.hitT = 0.4; this.onGolemHit?.(); }
      } else if (f.dog) { this.dogCatches++; s.pet?.joy?.(); this.onDogCatch?.(); }
      else if (Math.hypot(p.x - f.to.x, p.z - f.to.z) < 1.1 && !this.paused) { this.freeze(); this.onHeroHit?.(); }
      else this.onHeroMiss?.();
    }
    this._ballsLayout();
    // The hero as a snowman.
    if (this.shellT > 0) {
      this.shellT -= dt;
      const sc = s.player.scale.y, pop = Math.min(1, (2 - this.shellT) / 0.15) * Math.min(1, this.shellT / 0.15);
      this.shell.visible = true;
      this.shell.position.set(p.x, p.y, p.z);
      this.shell.rotation.y = s.player.rotation.y;
      this.shell.scale.set(sc * pop, sc * pop * (1 + Math.sin(this.shellT * 20) * 0.03), sc * pop);
      if (this.shellT <= 0) { this.shell.visible = false; s.particleBurst(p.clone().setY(p.y + 1), '#ffffff', 20); }
    }
    // The pile and the golem labels follow nothing; the golem's tap target stays at home.
    // Rolling a ball: it grows as the hero walks (not while a word is spelled).
    if (this.roll) {
      const r = this.roll, now = new THREE.Vector3(p.x, 0, p.z), step = now.distanceTo(r.last);
      r.last.copy(now);
      if (step < 2 && !s.inputLocked && s.onGround !== false) { r.dist += step; r.spin += step / Math.max(0.2, this.rollRadius()); }
      this._placeRoll(dt);
      if (step > 0.01 && Math.random() < dt * 10) s.particleBurst(this.man.roll.position.clone().setY(this.man.roll.position.y - this.rollRadius() * 0.8), '#ffffff', 2);
      if (!r.big && r.dist >= ROLL_DIST[r.k]) { r.big = true; this.onRollBig?.(r.k); }
    }
    if (this.flyBall) {
      const f = this.flyBall;
      f.t += dt;
      const k = Math.min(1, f.t / 0.8), b = this.man.balls[f.k], to = this.manRoot.position.clone().add(b.position);
      b.visible = true;
      b.position.copy(new THREE.Vector3().lerpVectors(f.from, to, k).sub(this.manRoot.position)).add(new THREE.Vector3(0, Math.sin(k * Math.PI) * 2, 0));
      b.scale.setScalar(ROLL_R[f.k]);
      if (k >= 1) { this.flyBall = null; this.layoutMan(); s.particleBurst(to, '#ffffff', 18); this.onStacked?.(f.k); }
    }
    // The snowman: a little dance when touched, and every night.
    const night = (s.night ?? 0) > 0.5 && this.state.stack >= 3 && this.state.hat;
    if (night && !this.wasNight) this.onNightDance?.();
    this.wasNight = night;
    const R = this.manRig;
    if (this.danceT >= 0 || night) {
      if (this.danceT >= 0) this.danceT -= dt;
      R.rotation.y = Math.sin(t * 5) * 0.5; R.rotation.z = Math.sin(t * 7) * 0.12; R.position.y = Math.abs(Math.sin(t * 6)) * 0.25;
      if (this.danceT < 0 && this.danceT > -1) this.danceT = -1;
    } else { R.rotation.set(0, 0, 0); R.position.y = 0; }
  }
}
