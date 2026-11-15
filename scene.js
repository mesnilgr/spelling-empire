import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { PropKit, PALETTE, furnishTavern, seededRandom } from './interiors.js';

const TILE = 2;
const PLAYER_SPEED = 4.5;
const COMPANION_SPEED = 4.0;
const PLAYER_RADIUS = 0.35;
const WALL_HEIGHT = 2.6;
const WALL_THICKNESS = 0.26;
// Camera looks at the village from a corner, like a classic isometric RPG.
const CAM_YAW = 0.7;

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

const lerp = (a, b, t) => a + (b - a) * t;
const FLOOR_Y = 0;

const COLORS = {
  ground: 0x4a7a3a,
  path: 0x9b8b6e,
  stone: 0x888888,
  wood: 0x8b6f47,
  woodDark: 0x6b5234,
  roof: 0x8a3b2e,
  roofBlue: 0x3a5a8a,
  roofGreen: 0x3a7a4a,
  wall: 0xe8dcc8,
  wallInterior: 0xd4c8b0,
  door: 0x5a3a1a,
  window: 0x88aacc,
  tree: 0x2d6a3e,
  trunk: 0x5a3a1a,
  flower: 0xff6b9d,
  player: 0x2563eb,
  player2: 0x16a34a,
  player3: 0xf59e0b,
  npc: 0xa855f7,
  npc2: 0xec4899,
  npc3: 0x06b6d4,
  water: 0x4488cc,
  sign: 0xc4a46c,
};

export class GameScene {
  constructor(container) {
    this.container = container;
    this.clock = new THREE.Clock();
    this.animationId = null;
    this.keys = {};
    this.joystick = { x: 0, y: 0, active: false };
    this.onInteract = null;
    this.collidables = [];
    this.interactables = [];
    this.nearbyInteractable = null;
    this.particles = [];
    this.shakeIntensity = 0;
    this.shakeDecay = 0;
    this.cameraAngle = 0;
    this.houses = [];
    this.npcs = [];
    this.waterMats = [];
    this.kit = new PropKit();
    this.interiorFactor = 0;
    this.activeHouse = null;
    this.camTarget = new THREE.Vector3(0, 0.6, 4);

    this._initRenderer();
    this._initScene();
    this._initCamera();
    this._initLights();
    this._initWorld();
    this._initPlayer();
    this._initComposer();
    this._bindEvents();
    this._animate();
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x9fc7d8);
    this.scene.fog = new THREE.Fog(0x9fc7d8, 42, 78);
  }

  _initCamera() {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 200);
    this.camera.position.set(Math.sin(CAM_YAW) * 15, 21, 4 + Math.cos(CAM_YAW) * 15);
    this.camera.lookAt(0, 0.6, 4);
  }

  _initLights() {
    // Late-afternoon light: warm low sun, soft sky fill.
    const ambient = new THREE.AmbientLight(0xfff1dc, 0.55);
    this.scene.add(ambient);
    this.ambient = ambient;

    const sun = new THREE.DirectionalLight(0xffd6a0, 1.7);
    sun.position.set(-14, 24, 12);
    this.sun = sun;
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -30;
    sun.shadow.camera.right = 30;
    sun.shadow.camera.top = 30;
    sun.shadow.camera.bottom = -30;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 60;
    sun.shadow.bias = -0.0005;
    this.scene.add(sun);

    const hemi = new THREE.HemisphereLight(0xbfd8ff, 0x4a6a3a, 0.45);
    this.scene.add(hemi);
    this.hemi = hemi;
    this.lightBase = { ambient: ambient.intensity, sun: sun.intensity, hemi: hemi.intensity };
  }

  // ===== WORLD BUILDING =====

  _initWorld() {
    this._buildGround();
    this._buildPaths();
    this._buildPond();
    this._buildFountain();

    // Buildings — placed around the village, doors face +Z (toward camera)
    this._buildHouse(-10, -6, 0, 'blacksmith', 7, 5, 5, COLORS.roof, 'forge');
    this._buildHouse(8, -8, 0, 'shop', 7, 5, 5, COLORS.roofBlue, 'shop');
    // The tavern is the reference interior: big room, taller walls, fully furnished.
    this._buildHouse(-13, 7, 0, 'tavern', 15, 5.8, 11, COLORS.roofGreen, 'tavern', {
      wallH: 3.0,
      windows: { back: [], left: [], right: [-2.2, 2.2], front: [-4.6, 4.6] },
    });
    this._buildHouse(12, 6, 0, 'tower', 5, 8, 4, 0x5544aa, 'tower', { roof: 'pyramid', wallH: 4.6 });
    this._buildHouse(0, 14, 0, 'cottage', 6, 4, 4, COLORS.roof, 'cottage');
    this._buildHouse(-2, -14, 0, 'guild', 8, 5, 5, 0x6a4a2a, 'guild');

    this._buildTrees();
    this._buildFlowers();
  }

  _insideAnyHouse(x, z, margin = 0.6) {
    return this.houses.some((h) => Math.abs(x - h.center.x) < h.w / 2 + margin && Math.abs(z - h.center.z) < h.d / 2 + margin);
  }

  _buildGround() {
    const geo = new THREE.PlaneGeometry(60, 60);
    const mat = new THREE.MeshStandardMaterial({ color: COLORS.ground, roughness: 0.9 });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Decorative darker patches
    for (let i = 0; i < 20; i++) {
      const patchGeo = new THREE.CircleGeometry(0.8 + Math.random() * 1.2, 8);
      const patchMat = new THREE.MeshStandardMaterial({ color: 0x3a6a2a, roughness: 1 });
      const patch = new THREE.Mesh(patchGeo, patchMat);
      patch.rotation.x = -Math.PI / 2;
      patch.position.set((Math.random() - 0.5) * 50, 0.01, (Math.random() - 0.5) * 50);
      patch.receiveShadow = true;
      this.scene.add(patch);
    }
  }

  _buildPaths() {
    const pathMat = new THREE.MeshStandardMaterial({ color: COLORS.path, roughness: 0.95 });
    const pathPositions = [
      { x: 0, z: 0, w: 2.5, l: 30 }, // main vertical
      { x: 0, z: 0, w: 30, l: 2.5 }, // main horizontal
    ];
    for (const p of pathPositions) {
      const geo = new THREE.PlaneGeometry(p.w, p.l);
      const mesh = new THREE.Mesh(geo, pathMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(p.x, 0.02, p.z);
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    }
    // Diagonal path to tower
    const diagGeo = new THREE.PlaneGeometry(2, 14);
    const diag = new THREE.Mesh(diagGeo, pathMat);
    diag.rotation.x = -Math.PI / 2;
    diag.rotation.z = -Math.PI / 6;
    diag.position.set(6, 0.02, 3);
    diag.receiveShadow = true;
    this.scene.add(diag);
  }

  _buildTrees() {
    const treePositions = [
      [-18, -10], [-24, 3], [-22, -2], [18, -12], [20, 8], [22, -4],
      [-8, 14], [-15, 16], [10, 16], [16, 14], [-24, 12], [24, -16],
      [-4, -20], [4, -20], [-10, -22], [10, -22],
    ];
    for (const [x, z] of treePositions) {
      const trunkGeo = new THREE.CylinderGeometry(0.15, 0.2, 1.2, 8);
      const trunkMat = new THREE.MeshStandardMaterial({ color: COLORS.trunk, roughness: 0.9 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(x, 0.6, z);
      trunk.castShadow = true;
      this.scene.add(trunk);

      const leafGeo = new THREE.SphereGeometry(0.9, 12, 10);
      const leafMat = new THREE.MeshStandardMaterial({ color: COLORS.tree, roughness: 0.8 });
      const leaves = new THREE.Mesh(leafGeo, leafMat);
      leaves.position.set(x, 1.8, z);
      leaves.castShadow = true;
      this.scene.add(leaves);
    }
  }

  _buildFlowers() {
    const flowerColors = [COLORS.flower, 0xffdd44, 0xff6644, 0xddaaff, 0xffffff];
    for (let i = 0; i < 60; i++) {
      const x = (Math.random() - 0.5) * 50;
      const z = (Math.random() - 0.5) * 50;
      if (Math.abs(x) < 3 && Math.abs(z) < 14) continue;
      if (Math.abs(z) < 3 && Math.abs(x) < 14) continue;
      if (this._insideAnyHouse(x, z)) continue;
      const color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
      const geo = new THREE.SphereGeometry(0.08, 6, 5);
      const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.1 });
      const flower = new THREE.Mesh(geo, mat);
      flower.position.set(x, 0.15, z);
      this.scene.add(flower);
      const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 4);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x2d6a3e });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.set(x, 0.07, z);
      this.scene.add(stem);
    }
  }

  _buildPond() {
    const geo = new THREE.CircleGeometry(3, 24);
    const mat = new THREE.MeshStandardMaterial({
      color: COLORS.water, roughness: 0.1, metalness: 0.5,
      transparent: true, opacity: 0.8,
    });
    this.waterMats.push(mat);
    const pond = new THREE.Mesh(geo, mat);
    pond.rotation.x = -Math.PI / 2;
    pond.position.set(-16, 0.03, -16);
    this.scene.add(pond);

    // Rocks around pond
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const rockGeo = new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.2);
      const rockMat = new THREE.MeshStandardMaterial({ color: COLORS.stone, roughness: 0.9 });
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(-16 + Math.cos(angle) * 3.2, 0.2, -16 + Math.sin(angle) * 3.2);
      rock.castShadow = true;
      this.scene.add(rock);
    }
  }

  _buildFountain() {
    const group = new THREE.Group();
    group.position.set(0, 0, 0);

    const baseGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.4, 16);
    const baseMat = new THREE.MeshStandardMaterial({ color: COLORS.stone, roughness: 0.7 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.2;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const waterGeo = new THREE.CylinderGeometry(1.0, 1.0, 0.3, 16);
    const waterMat = new THREE.MeshStandardMaterial({ color: COLORS.water, transparent: true, opacity: 0.7, roughness: 0.1 });
    this.waterMats.push(waterMat);
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.y = 0.35;
    group.add(water);

    const pillarGeo = new THREE.CylinderGeometry(0.2, 0.3, 0.8, 8);
    const pillar = new THREE.Mesh(pillarGeo, baseMat);
    pillar.position.y = 0.8;
    pillar.castShadow = true;
    group.add(pillar);

    const topGeo = new THREE.SphereGeometry(0.3, 8, 6);
    const top = new THREE.Mesh(topGeo, baseMat);
    top.position.y = 1.3;
    group.add(top);

    this.scene.add(group);
    this.collidables.push({ x: 0, z: 0, r: 1.6 });
  }

  _buildHouse(x, z, rotation, name, w, h, d, roofColor, type, opts = {}) {
    const kit = this.kit;
    const wallH = opts.wallH ?? WALL_HEIGHT;
    const wallT = WALL_THICKNESS;
    const doorW = opts.doorW ?? 1.6;
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    group.userData.houseBounds = { x, z, w, d, rotation };
    const halfW = w / 2;
    const halfD = d / 2;
    const lightsBefore = kit.lights.length;

    const house = {
      group, name, type,
      center: new THREE.Vector3(x, 0, z),
      w, d, rotation, wallH, doorW,
      cut: 0,
      cutTargets: [],
      roof: null,
      lights: [],
    };

    // Stone foundation slab, then a plank floor on top of it.
    const stoneMat = kit.mat(0x8f8a84, { roughness: 0.95 });
    kit.box(group, w + 0.34, 0.1, d + 0.34, stoneMat, 0, 0.04, 0, { cast: false });
    kit.plankFloor(group, w - wallT, d - wallT, { seed: hashString(name), y: 0.1, border: true });

    // ----- Walls -----
    const wallMat = kit.mat(PALETTE.plaster, { roughness: 0.92 });
    const capMat = kit.mat(0x3b2416, { roughness: 0.7 });
    const skirtMat = kit.mat(0x4a2c1a, { roughness: 0.8 });
    const win = { front: [], back: [], left: [], right: [], ...(opts.windows || {}) };

    // A wall is a pivot at floor level holding: `body` (shrinks in cutaway mode),
    // a stone footing (always visible), and `decor` (hidden in cutaway mode).
    const makeWall = (len, cx, cz, ry, normal, { door = false, windows = [] } = {}) => {
      const seg = new THREE.Group();
      seg.position.set(cx, 0, cz);
      seg.rotation.y = ry;
      group.add(seg);
      const body = new THREE.Group();
      seg.add(body);
      const decor = new THREE.Group();
      seg.add(decor);
      const side = (len - doorW) / 2;
      const pieces = door ? [[-(doorW / 2 + side / 2), side], [doorW / 2 + side / 2, side]] : [[0, len]];
      for (const [px, pl] of pieces) {
        kit.box(body, pl, wallH, wallT, wallMat, px, wallH / 2, 0);
        kit.box(body, pl, 0.34, wallT + 0.05, skirtMat, px, 0.27, 0, { cast: false });
        kit.box(body, pl + 0.04, 0.14, wallT + 0.12, capMat, px, wallH + 0.07, 0);
        kit.box(seg, pl + 0.04, 0.3, wallT + 0.16, stoneMat, px, 0.15, 0, { cast: false });
      }
      if (door) {
        const doorH = 2.1;
        kit.box(decor, doorW, wallH - doorH, wallT, wallMat, 0, doorH + (wallH - doorH) / 2, 0);
        kit.box(decor, doorW + 0.24, 0.18, wallT + 0.1, capMat, 0, doorH + 0.09, 0);
        kit.box(decor, doorW + 0.04, 0.14, wallT + 0.12, capMat, 0, wallH + 0.07, 0);
        for (const s of [-1, 1]) kit.box(body, 0.14, doorH, wallT + 0.1, capMat, s * (doorW / 2 + 0.07), doorH / 2, 0);
      }
      for (const wx of windows) kit.window(decor, wx, 1.55, 0, 0, { t: wallT });
      house.cutTargets.push({ body, decor, normal: normal.clone(), minScale: 0.42 / wallH });
      return { seg, body, decor };
    };

    const sideWin = Math.max(1.1, (halfW - doorW / 2) / 2 + doorW / 2);
    makeWall(w, 0, -halfD, 0, new THREE.Vector3(0, 0, -1), { windows: opts.windows?.back ?? [-w / 4, w / 4] });
    makeWall(d, -halfW, 0, Math.PI / 2, new THREE.Vector3(-1, 0, 0), { windows: opts.windows?.left ?? [0] });
    makeWall(d, halfW, 0, Math.PI / 2, new THREE.Vector3(1, 0, 0), { windows: opts.windows?.right ?? [0] });
    const front = makeWall(w, 0, halfD, 0, new THREE.Vector3(0, 0, 1), { door: true, windows: opts.windows?.front ?? [-sideWin, sideWin] });
    void win;

    // Timber corner posts; each one shrinks with the walls that face the camera.
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const post = new THREE.Group();
      post.position.set(sx * halfW, 0, sz * halfD);
      group.add(post);
      const body = new THREE.Group();
      post.add(body);
      kit.box(body, wallT + 0.14, wallH + 0.14, wallT + 0.14, capMat, 0, (wallH + 0.14) / 2, 0);
      house.cutTargets.push({ body, decor: new THREE.Group(), normal: new THREE.Vector3(sx, 0, sz).normalize(), minScale: 0.5 / wallH });
    }

    // ----- Roof -----
    house.roof = this._buildRoof(group, w, d, wallH, h - wallH, roofColor, opts.roof ?? 'gable', type);

    // Invisible caster: keeps the interior in the roof's shade after the roof is hidden.
    const caster = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.6, 0.12, d + 0.6),
      new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }),
    );
    caster.position.y = wallH + 0.25;
    caster.castShadow = true;
    group.add(caster);

    // ----- Interior -----
    if (type === 'tavern') {
      furnishTavern(kit, group, { w, d, wallH, wallT }, {
        collider: (lx, lz, r) => this._addLocalCollider(group, lx, lz, r),
        character: (color, lx, lz, ry) => {
          const npc = this._createCharacter(color);
          npc.position.set(lx, 0.1, lz);
          npc.rotation.y = ry;
          group.add(npc);
          this.npcs.push(npc);
          this._addLocalCollider(group, lx, lz, 0.4);
        },
      });
      this._dressTavernExterior(group, front.decor, halfW, halfD);
    } else {
      const light = new THREE.PointLight(0xffb45c, 5, Math.max(w, d) * 1.8, 1.5);
      light.position.set(0, wallH - 0.5, 0);
      group.add(light);
      kit.lights.push({ light, base: 5, amp: 0.03, speed: 3, phase: Math.random() * 10 });
      this._addFurniture(group, type, w, d, halfW, halfD);
    }
    house.lights = kit.lights.slice(lightsBefore);

    this._addSign(group, name, -halfW - 0.4, -halfD - 0.4);

    // Mining spot in the middle of the room.
    const spotMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff8800, emissiveIntensity: 0.5 });
    const spot = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.05, 20), spotMat);
    spot.position.set(0, 0.15, 0);
    group.add(spot);
    this.interactables.push({
      mesh: spot,
      worldPos: new THREE.Vector3(x, 0.18, z),
      type: 'mine',
      name,
      houseType: type,
      glow: spotMat,
    });

    // Collision: wall segments only, with a gap for the door.
    this.collidables.push({ type: 'houseWall', x, z, rotation, halfW, halfD, doorHalf: doorW / 2 });

    this.houses.push(house);
    this.scene.add(group);
    return group;
  }

  _addLocalCollider(group, lx, lz, r) {
    const v = new THREE.Vector3(lx, 0, lz).applyAxisAngle(new THREE.Vector3(0, 1, 0), group.rotation.y).add(group.position);
    this.collidables.push({ x: v.x, z: v.z, r });
  }

  // Roof parts get their own materials so one house's roof can fade without touching the others.
  _buildRoof(group, w, d, wallH, rise, color, style, type) {
    const roof = new THREE.Group();
    group.add(roof);
    const mats = [];
    const mk = (c, extra = {}) => {
      const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.72, ...extra });
      mats.push(m);
      return m;
    };
    const tileMat = mk(color, { flatShading: true });
    const tileDark = mk(new THREE.Color(color).multiplyScalar(0.72).getHex());
    const trimMat = mk(0x3b2416);
    const gableMat = mk(PALETTE.plaster, { roughness: 0.92 });
    const add = (geo, mat, px, py, pz, rx = 0, ry = 0) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(px, py, pz);
      m.rotation.set(rx, ry, 0);
      m.castShadow = true;
      m.receiveShadow = true;
      roof.add(m);
      return m;
    };

    if (style === 'gable') {
      const o = 0.45;
      const hd = d / 2;
      const s = hd + o;
      const slope = rise / hd;
      const yLow = wallH + 0.14 - slope * o;
      const apex = wallH + 0.14 + rise;
      const len = Math.hypot(s, apex - yLow);
      const angle = Math.atan2(apex - yLow, s);
      for (const sgn of [-1, 1]) {
        const panel = new THREE.Group();
        panel.position.set(0, (apex + yLow) / 2, (sgn * s) / 2);
        panel.rotation.x = sgn * angle;
        roof.add(panel);
        const slab = new THREE.Mesh(new THREE.BoxGeometry(w + o * 2, 0.16, len), tileMat);
        slab.castShadow = true;
        slab.receiveShadow = true;
        panel.add(slab);
        // Rows of shingles.
        const rows = Math.floor(len / 0.38);
        for (let i = 0; i < rows; i++) {
          const strip = new THREE.Mesh(new THREE.BoxGeometry(w + o * 2 + 0.02, 0.05, 0.08), tileDark);
          strip.position.set(0, 0.09, -len / 2 + 0.2 + i * 0.38);
          panel.add(strip);
        }
      }
      // Ridge beam and gable ends.
      add(new THREE.BoxGeometry(w + o * 2 + 0.1, 0.18, 0.26), trimMat, 0, apex + 0.06, 0);
      const shape = new THREE.Shape();
      shape.moveTo(-hd, 0);
      shape.lineTo(hd, 0);
      shape.lineTo(0, rise);
      shape.closePath();
      const gableGeo = new THREE.ExtrudeGeometry(shape, { depth: WALL_THICKNESS, bevelEnabled: false });
      for (const sgn of [-1, 1]) {
        add(gableGeo, gableMat, sgn * (w / 2) - WALL_THICKNESS / 2, wallH + 0.14, 0, 0, Math.PI / 2);
        // Timber trim along the gable edge.
        for (const e of [-1, 1]) {
          add(new THREE.BoxGeometry(0.14, 0.14, Math.hypot(hd, rise) + 0.1), trimMat,
            sgn * (w / 2 + 0.03), wallH + 0.14 + rise / 2, (e * hd) / 2, e * Math.atan2(rise, hd), 0);
        }
      }
    } else {
      // Pyramid roof (tower).
      const cone = add(new THREE.ConeGeometry(Math.hypot(w, d) / 2 + 0.5, rise, 4), tileMat, 0, wallH + 0.14 + rise / 2, 0, 0, Math.PI / 4);
      cone.material = tileMat;
      add(new THREE.CylinderGeometry(0.16, 0.22, 0.3, 6), trimMat, 0, wallH + rise + 0.1, 0);
    }
    return { group: roof, mats };
  }

  _dressTavernExterior(group, frontDecor, halfW, halfD) {
    const kit = this.kit;
    // Hanging sign over the door (part of the façade, hidden in cutaway mode).
    kit.box(frontDecor, 0.08, 0.08, 0.9, kit.mat(0x2b2523, { metalness: 0.5 }), 1.3, 2.55, 0.5);
    kit.box(frontDecor, 0.9, 0.55, 0.06, kit.mat(0x7a4a26), 1.3, 2.15, 0.85);
    kit.box(frontDecor, 0.36, 0.3, 0.07, kit.mat(PALETTE.rugGold, { metalness: 0.3, roughness: 0.5 }), 1.3, 2.15, 0.86);
    // Bench, plants and a lamp post by the entrance.
    const wood = kit.mat(PALETTE.wood);
    const dark = kit.mat(PALETTE.woodDark);
    const bench = kit.group(group, -3.4, halfD + 1.0);
    kit.box(bench, 1.8, 0.08, 0.4, wood, 0, 0.45, 0);
    for (const s of [-1, 1]) kit.box(bench, 0.08, 0.42, 0.34, dark, s * 0.75, 0.21, 0);
    this._addLocalCollider(group, -3.4, halfD + 1.0, 0.6);
    kit.plant(group, -1.25, halfD + 0.55);
    kit.plant(group, 1.25, halfD + 0.55);
    const lamp = kit.group(group, 2.6, halfD + 1.4);
    kit.box(lamp, 0.12, 2.4, 0.12, kit.mat(0x2b2523, { metalness: 0.4 }), 0, 1.2, 0);
    kit.box(lamp, 0.5, 0.07, 0.07, kit.mat(0x2b2523, { metalness: 0.4 }), 0.22, 2.35, 0);
    kit.box(lamp, 0.2, 0.28, 0.2, kit.glow(0xffc46a, 2.2), 0.42, 2.12, 0);
    this._addLocalCollider(group, 2.6, halfD + 1.4, 0.25);
    // Stepping stones from the door.
    const rnd = seededRandom(11);
    for (let i = 0; i < 4; i++) {
      kit.box(group, 0.7 + rnd() * 0.3, 0.05, 0.5, kit.mat(0x9a948c, { roughness: 1 }), (rnd() - 0.5) * 0.4, 0.03, halfD + 0.6 + i * 0.75, { ry: rnd() * 0.4, cast: false });
    }
  }

  _addFurniture(group, type, w, d, halfW, halfD) {
    const woodMat = new THREE.MeshStandardMaterial({ color: COLORS.wood, roughness: 0.8 });
    const woodDarkMat = new THREE.MeshStandardMaterial({ color: COLORS.woodDark, roughness: 0.8 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: COLORS.stone, roughness: 0.7 });

    if (type === 'forge') {
      this.kit.fireplace(group, 0, -halfD + WALL_THICKNESS / 2, 0, { width: 1.8, chimneyTop: WALL_HEIGHT + 2.2, seed: 21 });
      // Anvil
      const anvilGeo = new THREE.BoxGeometry(0.5, 0.4, 0.3);
      const anvil = new THREE.Mesh(anvilGeo, stoneMat);
      anvil.position.set(-1.5, 0.3, 1);
      anvil.castShadow = true;
      group.add(anvil);
      // Forge
      const forgeGeo = new THREE.BoxGeometry(0.8, 0.6, 0.6);
      const forgeMat = new THREE.MeshStandardMaterial({ color: 0x442222, emissive: 0xff4400, emissiveIntensity: 0.4 });
      const forge = new THREE.Mesh(forgeGeo, forgeMat);
      forge.position.set(1.5, 0.3, 1);
      forge.castShadow = true;
      group.add(forge);
    } else if (type === 'shop') {
      // Counter
      const counterGeo = new THREE.BoxGeometry(1.5, 0.5, 0.5);
      const counter = new THREE.Mesh(counterGeo, woodMat);
      counter.position.set(0, 0.25, 1.2);
      counter.castShadow = true;
      group.add(counter);
      // Shelves
      for (let i = 0; i < 2; i++) {
        const shelfGeo = new THREE.BoxGeometry(1.8, 0.08, 0.3);
        const shelf = new THREE.Mesh(shelfGeo, woodMat);
        shelf.position.set(0, 0.8 + i * 0.5, 1.8);
        group.add(shelf);
        // Items on shelf
        for (let j = 0; j < 3; j++) {
          const itemGeo = new THREE.BoxGeometry(0.2, 0.25, 0.2);
          const itemMat = new THREE.MeshStandardMaterial({ color: [0xff4444, 0x44ff44, 0x4444ff][j] });
          const item = new THREE.Mesh(itemGeo, itemMat);
          item.position.set(-0.6 + j * 0.6, 0.92 + i * 0.5, 1.8);
          group.add(item);
        }
      }
    } else if (type === 'tower') {
      // Bookshelves
      for (let i = 0; i < 2; i++) {
        const shelfGeo = new THREE.BoxGeometry(0.3, 1.6, 1.2);
        const shelf = new THREE.Mesh(shelfGeo, woodDarkMat);
        shelf.position.set(-1.5 + i * 3, 0.8, 1.5);
        shelf.castShadow = true;
        group.add(shelf);
        // Books
        for (let j = 0; j < 5; j++) {
          const bookGeo = new THREE.BoxGeometry(0.12, 0.25, 0.9);
          const bookMat = new THREE.MeshStandardMaterial({ color: [0xcc3333, 0x33cc33, 0x3333cc, 0xcccc33, 0xcc33cc][j] });
          const book = new THREE.Mesh(bookGeo, bookMat);
          book.position.set(-1.5 + i * 3, 0.3 + j * 0.28, 1.5);
          group.add(book);
        }
      }
      // Crystal ball
      const ballGeo = new THREE.SphereGeometry(0.25, 12, 10);
      const ballMat = new THREE.MeshStandardMaterial({ color: 0xaa88ff, emissive: 0x6644aa, emissiveIntensity: 0.5, transparent: true, opacity: 0.8 });
      const ball = new THREE.Mesh(ballGeo, ballMat);
      ball.position.set(0, 0.5, 0);
      group.add(ball);
      // Stand
      const standGeo = new THREE.CylinderGeometry(0.08, 0.15, 0.3, 8);
      const stand = new THREE.Mesh(standGeo, woodDarkMat);
      stand.position.set(0, 0.15, 0);
      group.add(stand);
    } else if (type === 'cottage') {
      // Bed
      const bedGeo = new THREE.BoxGeometry(0.8, 0.3, 1.5);
      const bedMat = new THREE.MeshStandardMaterial({ color: 0xddaadd });
      const bed = new THREE.Mesh(bedGeo, bedMat);
      bed.position.set(-1.5, 0.2, 0);
      bed.castShadow = true;
      group.add(bed);
      // Pillow
      const pillowGeo = new THREE.BoxGeometry(0.6, 0.15, 0.3);
      const pillow = new THREE.Mesh(pillowGeo, new THREE.MeshStandardMaterial({ color: 0xffffff }));
      pillow.position.set(-1.5, 0.35, -0.5);
      group.add(pillow);
      // Table
      const tableGeo = new THREE.BoxGeometry(0.6, 0.05, 0.6);
      const table = new THREE.Mesh(tableGeo, woodMat);
      table.position.set(1.5, 0.5, 0.5);
      table.castShadow = true;
      group.add(table);
      for (const lx of [-0.2, 0.2]) {
        for (const lz of [-0.2, 0.2]) {
          const legGeo = new THREE.BoxGeometry(0.06, 0.5, 0.06);
          const leg = new THREE.Mesh(legGeo, woodDarkMat);
          leg.position.set(1.5 + lx, 0.25, 0.5 + lz);
          group.add(leg);
        }
      }
    } else if (type === 'guild') {
      // Long table
      const tableGeo = new THREE.BoxGeometry(2.5, 0.05, 1);
      const table = new THREE.Mesh(tableGeo, woodMat);
      table.position.set(0, 0.5, 0);
      table.castShadow = true;
      group.add(table);
      for (const lx of [-1, 0, 1]) {
        for (const lz of [-0.4, 0.4]) {
          const legGeo = new THREE.BoxGeometry(0.08, 0.5, 0.08);
          const leg = new THREE.Mesh(legGeo, woodDarkMat);
          leg.position.set(lx, 0.25, lz);
          group.add(leg);
        }
      }
      // Banner
      const bannerGeo = new THREE.PlaneGeometry(0.6, 1);
      const bannerMat = new THREE.MeshStandardMaterial({ color: 0x882244, side: THREE.DoubleSide });
      const banner = new THREE.Mesh(bannerGeo, bannerMat);
      banner.position.set(0, 1.5, 2.4);
      group.add(banner);
    }
  }

  _addSign(group, label, x, z) {
    const postGeo = new THREE.BoxGeometry(0.08, 0.6, 0.08);
    const postMat = new THREE.MeshStandardMaterial({ color: COLORS.woodDark });
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(x, 0.3, z);
    group.add(post);

    const boardGeo = new THREE.BoxGeometry(0.8, 0.3, 0.05);
    const boardMat = new THREE.MeshStandardMaterial({ color: COLORS.sign });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.set(x, 0.55, z);
    group.add(board);
  }

  // ===== PLAYER =====

  _initPlayer() {
    this.player = this._createCharacter(COLORS.player);
    this.player.position.set(0, 0, 4);
    this.scene.add(this.player);

    this.companions = [
      { mesh: this._createCharacter(COLORS.player2), offset: new THREE.Vector3(-1.2, 0, 0.8), target: new THREE.Vector3() },
      { mesh: this._createCharacter(COLORS.player3), offset: new THREE.Vector3(1.2, 0, 0.8), target: new THREE.Vector3() },
    ];
    for (const c of this.companions) {
      c.mesh.position.copy(this.player.position).add(c.offset);
      this.scene.add(c.mesh);
    }

    // NPCs
    const npcConfigs = [
      { pos: [3, 0, 2], color: COLORS.npc, name: 'mage' },
      { pos: [-4, 0, -3], color: COLORS.npc2, name: 'merchant' },
      { pos: [0, 0, 8], color: COLORS.npc3, name: 'guard' },
    ];
    for (const cfg of npcConfigs) {
      const npc = this._createCharacter(cfg.color);
      npc.position.set(...cfg.pos);
      npc.userData = { isNPC: true, name: cfg.name };
      this.scene.add(npc);
      this.npcs.push(npc);
      this.collidables.push({ x: cfg.pos[0], z: cfg.pos[2], r: 0.4 });
    }
  }

  _createCharacter(color) {
    const group = new THREE.Group();

    // Body
    const bodyGeo = new THREE.CapsuleGeometry(0.25, 0.5, 4, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    body.castShadow = true;
    group.add(body);

    // Head
    const headGeo = new THREE.SphereGeometry(0.2, 12, 10);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xf0c8a0, roughness: 0.7 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.05;
    head.castShadow = true;
    group.add(head);

    // Hat
    const hatGeo = new THREE.ConeGeometry(0.22, 0.3, 8);
    const hatMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
    const hat = new THREE.Mesh(hatGeo, hatMat);
    hat.position.y = 1.3;
    group.add(hat);

    group.userData = { walkPhase: 0, isMoving: false };
    return group;
  }

  // ===== POST-PROCESSING =====

  _initComposer() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
      0.3, 0.4, 0.6,
    );
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());
  }

  // ===== INPUT =====

  _bindEvents() {
    this._onKeyDown = (e) => { this.keys[e.key.toLowerCase()] = true; };
    this._onKeyUp = (e) => { this.keys[e.key.toLowerCase()] = false; };
    this._onResize = () => this.resize();

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('resize', this._onResize);
  }

  setJoystick(x, y) {
    this.joystick.x = x;
    this.joystick.y = y;
    this.joystick.active = x !== 0 || y !== 0;
  }

  resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
  }

  // ===== MOVEMENT & COLLISION =====

  _checkCollision(x, z) {
    for (const c of this.collidables) {
      if (c.type === 'houseWall') {
        // Transform world position into the house's local space
        const cosR = Math.cos(-c.rotation);
        const sinR = Math.sin(-c.rotation);
        const dx = x - c.x;
        const dz = z - c.z;
        const lx = dx * cosR - dz * sinR;
        const lz = dx * sinR + dz * cosR;

        const wallThickness = 0.25 + PLAYER_RADIUS;
        const inWidth = Math.abs(lx) < c.halfW + wallThickness;
        const inDepth = Math.abs(lz) < c.halfD + wallThickness;
        if (!inWidth || !inDepth) continue;

        // Check if the player is near a wall edge (within wall thickness)
        const nearFront = lz > c.halfD - wallThickness;
        const nearBack = lz < -c.halfD + wallThickness;
        const nearLeft = lx < -c.halfW + wallThickness;
        const nearRight = lx > c.halfW - wallThickness;

        // Door gap is on the +Z (front) side, centered on x=0
        if (nearFront && Math.abs(lx) < c.doorHalf) continue; // open doorway

        if ((nearFront || nearBack || nearLeft || nearRight) && inWidth && inDepth) return true;
      } else {
        const dx = x - c.x;
        const dz = z - c.z;
        if (dx * dx + dz * dz < (c.r + PLAYER_RADIUS) * (c.r + PLAYER_RADIUS)) return true;
      }
    }
    return false;
  }

  _updatePlayer(dt) {
    let mx = 0, mz = 0;
    if (this.joystick.active) {
      mx = this.joystick.x;
      mz = -this.joystick.y;
    } else {
      if (this.keys['w'] || this.keys['arrowup']) mz -= 1;
      if (this.keys['s'] || this.keys['arrowdown']) mz += 1;
      if (this.keys['a'] || this.keys['arrowleft']) mx -= 1;
      if (this.keys['d'] || this.keys['arrowright']) mx += 1;
    }

    const len = Math.hypot(mx, mz);
    if (len > 0) {
      mx /= len; mz /= len;
      // Input is screen-relative: rotate it by the camera yaw so "up" walks away from the camera.
      const cy = Math.cos(CAM_YAW);
      const sy = Math.sin(CAM_YAW);
      const wx = mx * cy + mz * sy;
      const wz = -mx * sy + mz * cy;
      mx = wx; mz = wz;
      const nx = this.player.position.x + mx * PLAYER_SPEED * dt;
      const nz = this.player.position.z + mz * PLAYER_SPEED * dt;
      if (!this._checkCollision(nx, this.player.position.z)) this.player.position.x = nx;
      if (!this._checkCollision(this.player.position.x, nz)) this.player.position.z = nz;

      // Face direction
      const targetAngle = Math.atan2(mx, mz);
      this.player.rotation.y = this._lerpAngle(this.player.rotation.y, targetAngle, 0.15);
      this.player.userData.isMoving = true;
      this.player.userData.walkPhase += dt * 8;
    } else {
      this.player.userData.isMoving = false;
    }

    // Bob animation
    const bob = this.player.userData.isMoving ? Math.sin(this.player.userData.walkPhase) * 0.05 : 0;
    this.player.position.y = bob;

    // Companions follow
    for (const c of this.companions) {
      c.target.copy(this.player.position).add(c.offset);
      const dx = c.target.x - c.mesh.position.x;
      const dz = c.target.z - c.mesh.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 1.0) {
        const speed = COMPANION_SPEED * dt;
        const nx = c.mesh.position.x + (dx / dist) * speed;
        const nz = c.mesh.position.z + (dz / dist) * speed;
        if (!this._checkCollision(nx, c.mesh.position.z)) c.mesh.position.x = nx;
        if (!this._checkCollision(c.mesh.position.x, nz)) c.mesh.position.z = nz;
        c.mesh.rotation.y = this._lerpAngle(c.mesh.rotation.y, Math.atan2(dx, dz), 0.1);
        c.mesh.userData.isMoving = true;
        c.mesh.userData.walkPhase += dt * 7;
      } else {
        c.mesh.userData.isMoving = false;
      }
      const cBob = c.mesh.userData.isMoving ? Math.sin(c.mesh.userData.walkPhase) * 0.04 : 0;
      c.mesh.position.y = cBob;
    }
  }

  _lerpAngle(a, b, t) {
    let diff = b - a;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return a + diff * t;
  }

  // ===== CAMERA =====

  _updateCamera(dt) {
    const p = this.player.position;
    const f = this.interiorFactor;
    const h = this.activeHouse;
    // Inside a house the camera moves closer and frames the room rather than the player.
    const tx = h ? lerp(p.x, h.center.x, 0.55 * f) : p.x;
    const tz = h ? lerp(p.z, h.center.z, 0.55 * f) : p.z;
    const dist = lerp(27, h ? Math.max(h.w, h.d) * 1.32 + 2 : 20, f);
    const elev = lerp(0.92, 0.98, f);
    const k = 1 - Math.pow(0.001, dt);
    this.camTarget.x += (tx - this.camTarget.x) * k;
    this.camTarget.z += (tz - this.camTarget.z) * k;
    this.camTarget.y = 0.6;
    const horiz = Math.cos(elev) * dist;
    const goal = new THREE.Vector3(
      this.camTarget.x + Math.sin(CAM_YAW) * horiz,
      Math.sin(elev) * dist,
      this.camTarget.z + Math.cos(CAM_YAW) * horiz,
    );
    this.camera.position.lerp(goal, k);

    if (this.shakeIntensity > 0.001) {
      this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= this.shakeDecay;
    }

    this.camera.lookAt(this.camTarget);
  }

  // ===== CUTAWAY =====
  // When the player is inside (or in the doorway of) a house, its roof fades out and the
  // walls facing the camera drop to knee height, so the room reads like a dollhouse.

  _updateCutaway(dt) {
    const p = this.player.position;
    const camDir = new THREE.Vector3(Math.sin(CAM_YAW), 0, Math.cos(CAM_YAW));
    const up = new THREE.Vector3(0, 1, 0);
    const n = new THREE.Vector3();
    const k = Math.min(1, dt * 5);
    let best = null;
    let maxCut = 0;

    for (const h of this.houses) {
      const cosR = Math.cos(-h.rotation);
      const sinR = Math.sin(-h.rotation);
      const dx = p.x - h.center.x;
      const dz = p.z - h.center.z;
      const lx = dx * cosR - dz * sinR;
      const lz = dx * sinR + dz * cosR;
      const inside = Math.abs(lx) < h.w / 2 - 0.1 && Math.abs(lz) < h.d / 2 - 0.1;
      const atDoor = Math.abs(lx) < h.doorW / 2 + 0.4 && lz > h.d / 2 - 1.2 && lz < h.d / 2 + 1.0;
      const target = inside || atDoor ? 1 : 0;
      h.cut += (target - h.cut) * k;
      if (Math.abs(target - h.cut) < 0.003) h.cut = target;

      const opacity = Math.max(0, 1 - h.cut * 1.6);
      h.roof.group.visible = opacity > 0.01;
      for (const m of h.roof.mats) {
        const transparent = opacity < 0.999;
        if (m.transparent !== transparent) {
          m.transparent = transparent;
          m.depthWrite = !transparent;
          m.needsUpdate = true;
        }
        m.opacity = opacity;
      }

      for (const t of h.cutTargets) {
        n.copy(t.normal).applyAxisAngle(up, h.rotation);
        const amount = n.dot(camDir) > 0.3 ? h.cut : 0;
        t.body.scale.y = 1 - amount * (1 - t.minScale);
        t.decor.visible = amount < 0.3;
      }

      // Interior lights mostly stay off-stage until you walk in, so they don't wash the village.
      const lightFactor = 0.3 + 0.7 * h.cut;
      for (const l of h.lights) l.houseFactor = lightFactor;

      if (h.cut > maxCut) { maxCut = h.cut; best = h; }
    }

    this.interiorFactor = maxCut;
    if (best) this.activeHouse = best;
    else if (maxCut === 0) this.activeHouse = null;

    // Dim the daylight while indoors so the fire and candles carry the room.
    const f = maxCut;
    this.ambient.intensity = this.lightBase.ambient * lerp(1, 0.6, f);
    this.hemi.intensity = this.lightBase.hemi * lerp(1, 0.5, f);
    this.sun.intensity = this.lightBase.sun * lerp(1, 0.55, f);
  }

  // ===== INTERACTION =====

  _updateInteractables() {
    this.nearbyInteractable = null;
    let minDist = 2.0;
    for (const obj of this.interactables) {
      const dist = this.player.position.distanceTo(obj.worldPos);
      if (dist < minDist) {
        minDist = dist;
        this.nearbyInteractable = obj;
      }
      // Pulse glow
      const pulse = 0.3 + Math.sin(this.clock.elapsedTime * 3) * 0.2;
      obj.glow.emissiveIntensity = 0.3 + pulse;
    }
  }

  getNearbyInteractable() {
    return this.nearbyInteractable;
  }

  // ===== PARTICLES =====

  particleBurst(worldPos, color, count = 25) {
    const c = new THREE.Color(color);
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.05 + Math.random() * 0.05, 6, 5);
      const mat = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 1 });
      const p = new THREE.Mesh(geo, mat);
      p.position.copy(worldPos);
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2.5;
      p.userData = {
        vx: Math.cos(angle) * speed,
        vy: 2 + Math.random() * 3,
        vz: Math.sin(angle) * speed,
        life: 1, decay: 1.2 + Math.random(),
      };
      this.scene.add(p);
      this.particles.push(p);
    }
  }

  screenShake(intensity = 0.2) {
    this.shakeIntensity = intensity;
    this.shakeDecay = 0.92;
  }

  getPlayerScreenPosition() {
    const vec = this.player.position.clone();
    vec.y = 1;
    vec.project(this.camera);
    const rect = this.container.getBoundingClientRect();
    return {
      x: ((vec.x + 1) / 2) * rect.width + rect.left,
      y: ((-vec.y + 1) / 2) * rect.height + rect.top,
    };
  }

  // ===== ANIMATE LOOP =====

  _animate() {
    this.animationId = requestAnimationFrame(() => this._animate());
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;

    this._updatePlayer(dt);
    this._updateCamera(dt);
    this._updateCutaway(dt);
    this._updateInteractables();

    // NPC idle bob
    for (const npc of this.npcs) {
      npc.position.y = Math.sin(elapsed * 1.5 + npc.position.x) * 0.03;
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      const ud = p.userData;
      p.position.x += ud.vx * dt;
      p.position.y += ud.vy * dt;
      p.position.z += ud.vz * dt;
      ud.vy -= 6 * dt;
      ud.life -= ud.decay * dt;
      p.material.opacity = Math.max(0, ud.life);
      p.scale.setScalar(Math.max(0.01, ud.life));
      if (ud.life <= 0) {
        this.scene.remove(p);
        p.geometry.dispose();
        p.material.dispose();
        this.particles.splice(i, 1);
      }
    }

    // Fire and candle flicker.
    for (const fl of this.kit.flames) {
      const n = Math.sin(elapsed * fl.speed + fl.phase) * 0.5 + Math.sin(elapsed * fl.speed * 1.7 + fl.phase * 2) * 0.5;
      const sy = 1 + n * (fl.small ? 0.12 : 0.2);
      fl.mesh.scale.set(fl.base.x * (1 - n * 0.06), fl.base.y * sy, fl.base.z * (1 - n * 0.06));
      fl.mesh.position.y = fl.y0 + (sy - 1) * fl.h * 0.5;
    }
    for (const l of this.kit.lights) {
      const n = Math.sin(elapsed * l.speed + l.phase) * 0.6 + Math.sin(elapsed * l.speed * 2.3 + l.phase) * 0.4;
      l.light.intensity = l.base * (1 + n * l.amp) * (l.houseFactor ?? 1);
    }

    // Water shimmer
    for (const m of this.waterMats) m.opacity = 0.65 + Math.sin(elapsed * 2) * 0.08;

    this.composer.render();
  }

  dispose() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('resize', this._onResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
