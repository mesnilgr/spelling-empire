import * as THREE from 'three';
import { SIGNS, MIMOTS, PAGES, REGION_NPCS } from './story.js';
import { WORLD_RADIUS, REGIONS, BRIDGES, MIST_X, BOARDWALK, TRAVEL, buildForest, buildMarsh, buildMountain, buildCoast, STAIRS, SUMMIT, PIER, ISLAND, BOOK, LAVA, LAVA_FLAGS, buildLavaCourse, MARSH_POOLS } from './regions.js';
import { mergeStatic as mergeGroup, mergeDirect as mergeGroupParts } from './perf.js';
import { ZombieManager } from './zombies.js';
import { BossManager } from './bosses.js';
import { CopperWorkshop } from './copper.js';
import { PetManager } from './pet.js';
import { DECOR } from './decor.js';
import { PLACES, buildPlace, buildExtras, buildTrails, buildGroves, buildRegionFillers } from './landmarks.js';
import { FaunaManager } from './fauna.js';
import { HorseManager, RIDE } from './horse.js';
import { IronGolem } from './golem.js';
import { JumpChest } from './daily.js';
import { Cocotte, cocotteToday } from './cocotte.js';
import { Flammeche } from './flame.js';
import { AlbumStand } from './album.js';
import { NEWS } from './news.js';
import { buildSign, setSignText, buildMimot, buildPage } from './story3d.js';
import { CIRCLES, BRIDGE, BRAZIERS, buildCircle, buildBridge, buildMagicTree, buildFlowerBed, buildBrazier, buildLightOrb } from './magic.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { PropKit, PALETTE, furnishTavern, seededRandom } from './interiors.js';
import { createBlockyCharacter, animateCharacter, playAction } from './characters.js';
import { buildItem, HOLDABLE, buildBoat, buildCabin } from './items.js';
import { VillageBuilder, skyTexture } from './village.js';
import { BLOCKS, blockMat, texBox } from './textures.js';
import { mergeStatic, LightPool, QualityManager } from './perf.js';
import { Terrain, STEP_UP } from './terrain.js';
import { buildMaterialIcon, buildChest, buildMushroomPatch } from './icons.js';
import { WordPowers } from './powers.js';

// Each building has its own blocks, roof and trim so the village has variety.
const HOUSE_STYLES = {
  tavern: { wall: 'plaster', beams: 'darkOakPlanks', trim: 'darkOakPlanks', corner: 'spruceLog', base: 'cobble', roof: 'roofGreen', ridge: 'darkOakPlanks', shutter: 0x2f5a34, mat: 0x7a2a22 },
  forge: { wall: 'cobble', trim: 'oakLog', corner: 'oakLog', base: 'mossyCobble', roof: 'roofSlate', ridge: 'cobble', gable: 'oakPlanks', shutter: 0x5a3a24, mat: 0x4a4a4a },
  shop: { wall: 'oakPlanks', trim: 'spruceLog', corner: 'spruceLog', base: 'cobble', roof: 'roofBlue', ridge: 'sprucePlanks', shutter: 0x2a4f8a, mat: 0x2a4f8a },
  tower: { wall: 'mossyStoneBricks', trim: 'stoneBricks', corner: 'stoneBricks', base: 'mossyCobble', roof: 'roofPurple', roofStyle: 'pyramid', shutter: 0x4a2f8a, mat: 0x5a3aa8 },
  cottage: { wall: 'sprucePlanks', trim: 'oakLog', corner: 'oakLog', base: 'cobble', roof: 'thatch', ridge: 'thatch', gable: 'birchPlanks', shutter: 0xc8372d, mat: 0xd8a03a },
  guild: { wall: 'bricks', beams: null, trim: 'darkOakPlanks', corner: 'stoneBricks', base: 'stoneBricks', roof: 'roofBrown', ridge: 'darkOakPlanks', gable: 'darkOakPlanks', shutter: 0x6a2a22, mat: 0xa8302a },
};

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
    // 'title' (camera slowly circles the village behind the title screen), 'play', or 'paused'.
    this.mode = 'title';
    this.labelLayer = document.getElementById('label-layer');

    this._initRenderer();
    this._initScene();
    this._initCamera();
    this._initLights();
    this._initWorld();
    this._initPlayer();
    this._initComposer();
    this.lightPool = new LightPool(this.scene, 4);
    this.torchLight = new THREE.PointLight(0xff9a40, 0, 7, 1.4);
    this.scene.add(this.torchLight);
    if (!new URLSearchParams(location.search).has('nomerge')) this._optimizeStatic();
    this.noRender = new URLSearchParams(location.search).has('norender');
    this.quality = new QualityManager(this);
    // ?fps in the address shows a small frame counter (to check smoothness on the iPad).
    if (new URLSearchParams(location.search).has('fps')) {
      this.fpsEl = document.createElement('div');
      this.fpsEl.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99;padding:4px 8px;border-radius:8px;background:rgba(0,0,0,.65);color:#7CFC8A;font:700 13px/1.2 ui-monospace,monospace;pointer-events:none';
      document.body.appendChild(this.fpsEl);
      this._fps = { n: 0, t: performance.now() };
    }
    this._bindEvents();
    this._animate();
  }

  _initRenderer() {
    // No MSAA: post-processing renders off-screen anyway; quality is handled by QualityManager.
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = skyTexture();
    this.scene.fog = new THREE.Fog(0xcfe0e4, 48, 95);
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
    // Buildings — placed around the village, doors face +Z (toward camera)
    this._buildHouse(-10, -6, 0, 'blacksmith', 7, 5, 5, COLORS.roof, 'forge');
    this._buildHouse(8, -8, 0, 'shop', 7, 5, 5, COLORS.roofBlue, 'shop');
    // The tavern is the reference interior: big room, taller walls, fully furnished.
    this._buildHouse(-13, 7, 0, 'tavern', 15, 5.8, 11, COLORS.roofGreen, 'tavern', {
      wallH: 3.0,
      windows: { back: [], left: [], right: [-2.2, 2.2], front: [-4.6, 4.6] },
      spots: [[0, 0], [-1.6, 3.4], [4.4, -2.5]],
    });
    this._buildHouse(12, 6, 0, 'tower', 5, 8, 4, 0x5544aa, 'tower', { roof: 'pyramid', wallH: 4.6 });
    // The cottage is the bedroom: no materials to collect there, only the bed.
    this._buildHouse(0, 14, 0, 'cottage', 6, 4, 4, COLORS.roof, 'cottage', { spots: [] });
    this._buildHouse(-2, -14, 0, 'guild', 8, 5, 5, 0x6a4a2a, 'guild', { windows: { front: [-1.95, 1.95] } });

    // Terraced hills around the village (flat where buildings, pond and paths are).
    this.terrain = new Terrain(this.scene, {
      flat: (x, z) => this._insideAnyHouse(x, z, 2.5) || Math.hypot(x + 16, z + 16) < 5.5,
    });
    this.terrain.build();

    // Exterior: ground, paths, fountain, pond, field, trees, lamps, grass.
    this.village = new VillageBuilder(this.scene, this.kit, {
      heightAt: (x, z) => this.terrain.heightAt(x, z),
      houses: this.houses,
      collidables: this.collidables,
      waterMats: this.waterMats,
      insideAnyHouse: (x, z, m) => this._insideAnyHouse(x, z, m),
    });
    this.village.build();
    this._buildRegions();
    this._buildResourceNodes();
    this._buildMagic();
    this._buildStory();
    this.zombies = new ZombieManager(this);
    this.bosses = new BossManager(this);
    this.pet = new PetManager(this);
    this.fauna = new FaunaManager(this);
    this.horses = new HorseManager(this);
    this.golem = new IronGolem(this, { x: 0, z: 0 });
    // The daily jumping chest (in front of the cottage) and Cocotte the hen (today's hiding spot).
    this.jumpChest = new JumpChest(this);
    // Flammèche (J3): the hearth at the foot of the cottage chimney, and the woodpile next to it.
    this.flame = new Flammeche(this);
    // The collection album (J4): a lectern with the big open book, next to the cottage.
    this.albumStand = new AlbumStand(this);
    // Word powers (J5): the power stone on the path south of the cottage, and the five clouds above.
    (this.walkways ??= []);
    this.powers = new WordPowers(this);
    // The little copper golem (J6): the anvil next to the forge, Boulon, the secret buttons, the hang-glider.
    this.copper = new CopperWorkshop(this);
    const hen = cocotteToday(Math.max(...NEWS.filter((n) => !n.from).map((n) => n.day)));
    if (hen && !hen.album) this.cocotte = new Cocotte(this, hen);
  }

  // Cocotte at another hiding spot (the tests of an older release's spot).
  placeCocotte(row) {
    const old = this.cocotte;
    if (old) {
      this.scene.remove(old.mesh, old.obj.iconHolder, old.obj.hit);
      old.obj.active = false; old.obj.labelEl?.remove();
      this.interactables = this.interactables.filter((i) => i !== old.obj);
    }
    this.cocotte = row && !row.album ? new Cocotte(this, row) : null;
  }

  _insideAnyHouse(x, z, margin = 0.6) {
    return this.houses.some((h) => Math.abs(x - h.center.x) < h.w / 2 + margin && Math.abs(z - h.center.z) < h.d / 2 + margin);
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
      w, d, rotation, wallH, doorW, rise: h - wallH,
      cut: 0,
      cutTargets: [],
      roof: null,
      lights: [],
    };

    const style = HOUSE_STYLES[type] ?? HOUSE_STYLES.cottage;
    house.style = style;

    // Foundation slab (style's base block), then a plank floor on top of it.
    const baseMat = blockMat(style.base);
    texBox(group, w + 0.34, 0.1, d + 0.34, baseMat, 0, 0.04, 0, { cast: false });
    kit.plankFloor(group, w - wallT, d - wallT, { seed: hashString(name), y: 0.1, border: true });

    // ----- Walls -----
    const wallMat = blockMat(style.wall);
    const trimMat = blockMat(style.trim);
    const beamMat = style.beams ? blockMat(style.beams) : null;
    const skirtMat = kit.mat(0x4a2c1a, { roughness: 0.8 });

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
      // Which local z side faces outdoors.
      const out = Math.sign(new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry).dot(normal)) || 1;
      const side = (len - doorW) / 2;
      const pieces = door ? [[-(doorW / 2 + side / 2), side], [doorW / 2 + side / 2, side]] : [[0, len]];
      for (const [px, pl] of pieces) {
        texBox(body, pl, wallH, wallT, wallMat, px, wallH / 2, 0);
        if (style.wall === 'plaster') kit.box(body, pl, 0.34, wallT + 0.05, skirtMat, px, 0.27, 0, { cast: false });
        texBox(body, pl + 0.04, 0.2, wallT + 0.14, trimMat, px, wallH + 0.1, 0);
        texBox(seg, pl + 0.04, 0.42, wallT + 0.18, baseMat, px, 0.21, 0, { cast: false });
      }
      // Half-timbering: dark beams on the outside face, skipping doors and windows.
      if (beamMat) {
        const openings = [...windows.map((wx) => [wx, 0.62]), ...(door ? [[0, doorW / 2 + 0.2]] : [])];
        const free = (x) => openings.every(([ox, r]) => Math.abs(x - ox) > r);
        const zf = out * (wallT / 2 + 0.03);
        for (let x = -len / 2 + 0.9; x < len / 2 - 0.6; x += 1.25) {
          if (free(x)) texBox(body, 0.16, wallH - 0.4, 0.07, beamMat, x, wallH / 2 + 0.15, zf, { cast: false });
        }
        for (const [px, pl] of pieces) texBox(body, pl, 0.14, 0.07, beamMat, px, 0.92, zf, { cast: false });
        // Diagonal braces between windows give the classic timber-frame look.
        for (const [px, pl] of pieces) {
          if (pl < 1.6) continue;
          for (const s of [-1, 1]) {
            const bx = px + s * (pl / 2 - 0.55);
            if (!free(bx)) continue;
            texBox(body, 0.12, 1.25, 0.06, beamMat, bx, 1.65, zf, { rz: s * 0.55, cast: false });
          }
        }
      }
      if (door) {
        const doorH = 2.15;
        texBox(decor, doorW, wallH - doorH, wallT, wallMat, 0, doorH + (wallH - doorH) / 2, 0);
        texBox(decor, doorW + 0.5, 0.24, wallT + 0.16, trimMat, 0, doorH + 0.12, 0);
        texBox(decor, doorW + 0.04, 0.2, wallT + 0.14, trimMat, 0, wallH + 0.1, 0);
        for (const s of [-1, 1]) texBox(body, 0.22, doorH, wallT + 0.16, trimMat, s * (doorW / 2 + 0.11), doorH / 2, 0);
      }
      for (const wx of windows) kit.window(decor, wx, 1.55, 0, 0, { t: wallT });
      house.cutTargets.push({ body, decor, normal: normal.clone(), minScale: 0.42 / wallH });
      return { seg, body, decor, out };
    };

    const sideWin = Math.max(1.1, (halfW - doorW / 2) / 2 + doorW / 2);
    const frontWindows = opts.windows?.front ?? [-sideWin, sideWin];
    makeWall(w, 0, -halfD, 0, new THREE.Vector3(0, 0, -1), { windows: opts.windows?.back ?? [-w / 4, w / 4] });
    makeWall(d, -halfW, 0, Math.PI / 2, new THREE.Vector3(-1, 0, 0), { windows: opts.windows?.left ?? [0] });
    makeWall(d, halfW, 0, Math.PI / 2, new THREE.Vector3(1, 0, 0), { windows: opts.windows?.right ?? [0] });
    const front = makeWall(w, 0, halfD, 0, new THREE.Vector3(0, 0, 1), { door: true, windows: frontWindows });

    // Log corner posts; each one shrinks with the walls that face the camera.
    const postMat = blockMat(style.corner ?? style.trim);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const post = new THREE.Group();
      post.position.set(sx * halfW, 0, sz * halfD);
      group.add(post);
      const body = new THREE.Group();
      post.add(body);
      texBox(body, wallT + 0.2, wallH + 0.2, wallT + 0.2, postMat, 0, (wallH + 0.2) / 2, 0);
      house.cutTargets.push({ body, decor: new THREE.Group(), normal: new THREE.Vector3(sx, 0, sz).normalize(), minScale: 0.5 / wallH });
    }

    // ----- Roof -----
    house.roof = this._buildRoof(group, w, d, wallH, h - wallH, style, type);
    this._decorateExterior(house, front, frontWindows, style);

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
        character: (specName, lx, lz, ry) => {
          const npc = this._createCharacter(specName);
          npc.position.set(lx, 0.1, lz);
          npc.rotation.y = ry;
          npc.userData.name = specName;
          group.add(npc);
          this.npcs.push(npc);
          this._addLocalCollider(group, lx, lz, 0.4);
        },
      });
      this._dressTavernExterior(group, front.decor, halfW, halfD);
    } else {
      kit.pointLight(group, 0xffb45c, 5, Math.max(w, d) * 1.8, 1.5, 0, wallH - 0.5, 0, { amp: 0.03, speed: 3 });
      this._addFurniture(group, type, w, d, halfW, halfD);
    }
    house.lights = kit.lights.slice(lightsBefore);

    this._addSign(group, name, -halfW - 0.4, -halfD - 0.4);

    // Mining spot in the middle of the room: a glowing rune on the floor with the
    // material it gives spinning above it (tap it to mine).
    // Several spots per house, each showing a different material.
    const spots = opts.spots ?? [[0, 0], [-halfW * 0.5, -halfD * 0.35], [halfW * 0.5, halfD * 0.3]];
    for (const [sx, sz] of spots) {
      const spotMat = new THREE.MeshStandardMaterial({ color: 0xffd36a, emissive: 0xffaa33, emissiveIntensity: 0.8, transparent: true, opacity: 0.85 });
      const spot = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.05, 6, 24), spotMat);
      spot.rotation.x = -Math.PI / 2;
      spot.position.set(sx, 0.16, sz);
      group.add(spot);
      const wp = new THREE.Vector3(sx, 0.18, sz).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation).add(new THREE.Vector3(x, 0, z));
      this._addInteractable({
        kind: 'house', name, houseType: type, mesh: spot, glow: spotMat,
        worldPos: wp, iconY: 1.25, reach: 1.4,
      });
    }

    // Collision: wall segments only, with a gap for the door.
    this.collidables.push({ type: 'houseWall', x, z, rotation, halfW, halfD, doorHalf: doorW / 2 });

    this.houses.push(house);
    this.scene.add(group);
    return group;
  }

  // Something the player can mine: an invisible tap target, a spinning icon and (for nodes) a block.
  _addInteractable(spec) {
    const obj = { active: true, reach: 1.8, iconY: 1.3, ...spec };
    obj.iconHolder = new THREE.Group();
    obj.iconHolder.position.copy(obj.worldPos).add(new THREE.Vector3(0, obj.iconY, 0));
    obj.iconHolder.userData.dynamic = true;
    this.scene.add(obj.iconHolder);
    obj.hit = new THREE.Mesh(new THREE.SphereGeometry(obj.hitRadius ?? 0.95, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
    obj.hit.position.copy(obj.iconHolder.position);
    obj.hit.position.y -= 0.35;
    obj.hit.userData = { dynamic: true, interactable: obj };
    this.scene.add(obj.hit);
    if (obj.material) this.setSpotMaterial(obj, obj.material);
    this.interactables.push(obj);
    return obj;
  }

  setSpotMaterial(obj, materialId, label) {
    obj.material = materialId;
    obj.iconHolder.clear();
    obj.iconHolder.add(buildMaterialIcon(materialId));
    if (label) {
      // Real HTML text positioned over the canvas: always sharp, any screen density.
      if (!obj.labelEl) {
        obj.labelEl = document.createElement('div');
        obj.labelEl.className = 'spot-label';
        this.labelLayer?.appendChild(obj.labelEl);
      }
      obj.labelEl.textContent = label;
    }
  }

  // After a successful harvest a world node disappears for a while, then grows back.
  depleteNode(obj, seconds = 40) {
    if (obj.kind !== 'node' || obj.noDeplete) return;
    seconds = obj.respawn ?? seconds;
    obj.active = false;
    obj.respawnAt = obj.noRespawn ? Infinity : this.clock.elapsedTime + seconds;
    obj.iconHolder.visible = false;
    if (obj.noRespawn) {
      // A block made by the player (obsidian in the water): gone for good once mined.
      const { x, z } = obj.worldPos;
      this.collidables = this.collidables.filter((c) => !(c.r === 0.5 && Math.abs(c.x - x) < 1e-6 && Math.abs(c.z - z) < 1e-6));
      this.walkways = this.walkways.filter((w) => !(w.obsidian && Math.abs((w.x0 + w.x1) / 2 - x) < 1e-6 && Math.abs((w.z0 + w.z1) / 2 - z) < 1e-6));
    }
    if (obj.block) {
      this.particleBurst(obj.block.getWorldPosition(new THREE.Vector3()), obj.burst ?? '#9a9792', 26);
      obj.block.visible = false;
    }
  }

  // Ores in the quarry and the hills, the wheat field, trees, a flower meadow and the pond.
  _buildResourceNodes() {
    const h = (x, z) => this.terrain.heightAt(x, z);
    const ore = (x, z, kind) => this._addOre(x, z, kind);
    const q = this.terrain.quarry;
    const kinds = ['iron', 'diamond', 'iron', 'obsidian', 'iron', 'diamond', 'obsidian'];
    kinds.forEach((k, i) => {
      const a = (i / kinds.length) * Math.PI * 2 + 0.3;
      ore(q.x + Math.cos(a) * 2.7, q.z + Math.sin(a) * 2.7, k);
    });
    ore(-23.5, -7.5, 'iron');
    ore(23.5, 1.5, 'iron');

    // Wheat field (needs the scythe).
    this._addInteractable({
      kind: 'node', nodeType: 'wheat', material: 'wheat', requires: 'scythe',
      worldPos: new THREE.Vector3(8, 0, 14.1), iconY: 1.5, reach: 3.3, hitRadius: 1.3,
    });
    // A few trees near the village (need the axe).
    for (const t of (this.village.treeSpots ?? []).slice(0, 5)) {
      this._addInteractable({
        kind: 'node', nodeType: 'tree', material: 'wood', requires: 'axe',
        worldPos: new THREE.Vector3(t.x, t.y, t.z), iconY: 3.6 * t.scale, reach: 1.6, hitRadius: 1.2,
      });
    }
    // Flower meadow.
    const mx = -9.5, mz = -18.5;
    const colors = [0xff6b9d, 0xffd93d, 0xffffff, 0xb07aff, 0xff8a3d];
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * 1.6;
      const fx = mx + Math.cos(a) * r, fz = mz + Math.sin(a) * r;
      this.kit.box(this.scene, 0.04, 0.3, 0.04, this.kit.mat(0x3f8a3a), fx, 0.15, fz, { cast: false });
      this.kit.box(this.scene, 0.16, 0.16, 0.16, this.kit.mat(colors[i % 5], { emissive: colors[i % 5], emissiveIntensity: 0.15 }), fx, 0.36, fz, { cast: false });
    }
    this._addInteractable({ kind: 'node', nodeType: 'flower', material: 'flower', worldPos: new THREE.Vector3(mx, 0, mz), iconY: 1.4, reach: 1.9, hitRadius: 1.2 });
    // The cottage bed: sleep to jump to night (or back to morning).
    if (this.bedSpot) {
      const wp = new THREE.Vector3(this.bedSpot.lx, 0, this.bedSpot.lz).add(this.bedSpot.group.position);
      this._addInteractable({ kind: 'bed', worldPos: wp, iconY: 1.5, reach: 1.6, hitRadius: 0.9 });
    }
    // Rocks (pickaxe → stone) and bushes (axe → wood) near the village: quick, easy words.
    for (const d of this.village.decorSpots ?? []) {
      this._addInteractable({
        kind: 'node', nodeType: d.kind, decor: true, block: d.group,
        material: d.kind === 'rock' ? 'stone' : 'wood', requires: d.kind === 'rock' ? 'pickaxe' : 'axe',
        burst: d.kind === 'rock' ? '#9a9792' : '#4a9a40',
        worldPos: new THREE.Vector3(d.x, d.y, d.z), iconY: 1.35, reach: 1.5, hitRadius: 0.8, respawn: 60,
      });
    }
    // Treasure chests hidden around the world: something random inside.
    for (const [cx, cz, ry] of [[-25, 13, 0.6], [27, 8, -1.2], [-6, 23, 0.2], [13.5, -21, 2.4], [-22, -24, 0.9], [11, 24, -0.4]]) this._addChest(cx, cz, ry);
    // Glowing mushrooms: they only come out at night.
    for (const [mx2, mz2] of [[-28, 4], [-24, -13], [12, 27], [27, 14], [-11, 28], [29, -6]]) {
      const y = h(mx2, mz2);
      const patch = buildMushroomPatch();
      patch.position.set(mx2, y, mz2);
      patch.userData.dynamic = true;
      this.scene.add(patch);
      this._addInteractable({
        kind: 'node', nodeType: 'mushroom', material: 'mushroom', nightOnly: true, block: patch,
        burst: '#5af0e6', worldPos: new THREE.Vector3(mx2, y, mz2), iconY: 1.3, reach: 1.6, respawn: 50,
      });
    }
    // Fishing pier on the pond (needs a fishing rod).
    const pier = new THREE.Group();
    pier.position.set(-16, 0.1, -13.1);
    this.scene.add(pier);
    for (let i = 0; i < 6; i++) texBox(pier, 1.4, 0.08, 0.36, blockMat('sprucePlanks'), 0, 0, -i * 0.4, { tile: 0.7 });
    for (const [px2, pz2] of [[-0.6, -0.2], [0.6, -0.2], [-0.6, -2.0], [0.6, -2.0]]) texBox(pier, 0.14, 0.5, 0.14, blockMat('oakLog'), px2, -0.2, pz2);
    this._addInteractable({
      kind: 'node', nodeType: 'fish', material: 'fish', requires: 'rod', noDeplete: true,
      worldPos: new THREE.Vector3(-16, 0, -12.5), iconY: 1.4, reach: 1.6,
    });

    // Pond: draw water at its edge.
    this._addInteractable({ kind: 'node', nodeType: 'water', material: 'water', worldPos: new THREE.Vector3(-13.4, 0, -13.9), iconY: 1.1, reach: 1.4 });
  }

  /* ===== REGIONS: the pine forest (west) and the marsh (east) ===== */
  _buildRegions() {
    const ctx = {
      heightAt: (x, z) => this.terrain.heightAt(x, z),
      collidables: this.collidables,
      waterMat: this.waterMats[0] ?? new THREE.MeshStandardMaterial({ color: 0x3f8fc8, transparent: true, opacity: 0.82 }),
      marshWaterMat: new THREE.MeshStandardMaterial({ color: 0x3a5a4a, transparent: true, opacity: 0.88, roughness: 0.1, metalness: 0.3, emissive: 0x0a2a1a, emissiveIntensity: 0.3 }),
    };
    this.waterMats.push(ctx.marshWaterMat);
    const forest = buildForest(ctx);
    const marsh = buildMarsh(ctx);
    this.marsh = marsh;
    this.marshMist = true;
    const hStairs = this.terrain.heightAt(STAIRS.x, STAIRS.z0 + 0.4);
    this.stairsY = (z) => hStairs + (SUMMIT.level - hStairs) * Math.min(1, Math.max(0, (STAIRS.z0 - z) / (STAIRS.z0 - STAIRS.z1)));
    ctx.stairsY = this.stairsY;
    ctx.seaMat = new THREE.MeshStandardMaterial({ color: 0x2f7fc0, transparent: true, opacity: 0.85, roughness: 0.1, metalness: 0.3, emissive: 0x0a2a4a, emissiveIntensity: 0.3 });
    this.waterMats.push(ctx.seaMat);
    this.mountain = buildMountain(ctx);
    this.coast = buildCoast(ctx);
    // Pier and paper island are walkable (the island is reached by the coast bridge).
    (this.walkways ??= []).push({ axis: 'z', x: PIER.x, z0: PIER.z0, z1: PIER.z1, hw: PIER.hw, y: () => 0.26 });
    this.walkways.push({ circle: true, x: ISLAND.x, z: ISLAND.z, r: ISLAND.r - 0.1, y: () => 0.32 });
    this.lavaCourse = buildLavaCourse(ctx);
    LAVA.pillars.forEach(([x, z, sz, h, role], i) => this.walkways.push({ box: true, x0: x - sz / 2, x1: x + sz / 2, z0: z - sz / 2, z1: z + sz / 2, y: () => h, role, index: i, center: { x, z, y: h } }));
    // Jump helpers for the course: a shadow under the hero and a frame around the next pillar.
    this.jumpShadow = new THREE.Mesh(new THREE.CircleGeometry(0.42, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4, depthWrite: false }));
    this.jumpShadow.rotation.x = -Math.PI / 2;
    this.jumpShadow.visible = false;
    this.scene.add(this.jumpShadow);
    this.nextMark = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.45, 4, 1), new THREE.MeshBasicMaterial({ color: 0xffd34a, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
    this.nextMark.rotation.set(-Math.PI / 2, 0, Math.PI / 4);
    this.nextMark.visible = false;
    this.scene.add(this.nextMark);
    this.lavaIndex = -1;
    REGIONS.lava = { x: (LAVA.x0 + LAVA.x1) / 2, z: (LAVA.z0 + LAVA.z1) / 2, show: 34 };
    this.regionGroups = [];
    for (const [name, group] of [['forest', forest], ['marsh', marsh.group], ['mountain', this.mountain.group], ['coast', this.coast.group], ['lava', this.lavaCourse.group]]) {
      mergeGroup(group);
      group.userData.dynamic = true;
      this.scene.add(group);
      this.regionGroups.push({ name, group, def: REGIONS[name] });
    }
    this._buildPlaces();
    // The marsh boardwalk: walkable over the pools.
    (this.walkways ??= []).push({ x0: BOARDWALK.x0, x1: BOARDWALK.x1, z: BOARDWALK.z, hw: BOARDWALK.hw, y: () => 0.22 });
    // Villagers out in the regions.
    for (const n of REGION_NPCS) {
      const npc = this._createCharacter(n.spec);
      npc.position.set(n.x, this.terrain.heightAt(n.x, n.z) + (n.y ?? 0), n.z);
      npc.rotation.y = n.ry ?? 0;
      Object.assign(npc.userData, { isNPC: true, name: n.id });
      this.scene.add(npc);
      this.npcs.push(npc);
      this.collidables.push({ x: n.x, z: n.z, r: 0.4 });
      this._addInteractable({ kind: 'npc', npcId: n.id, npc, worldPos: npc.position.clone(), iconY: 2.45, reach: 2.2, hitRadius: 0.9 });
    }
    // A sign at the foot of the cliff: the way up opens with the Stone spell.
    this.cliffSign = buildSign();
    this.cliffSign.position.set(-2.2, this.terrain.heightAt(-2.2, -53.6), -53.6);
    this.cliffSign.userData.dynamic = true;
    setSignText(this.cliffSign, 'Pierre ?');
    this.scene.add(this.cliffSign);
    this.collidables.push({ x: -2.2, z: -53.6, r: 0.18 });
    this.lavaSign = buildSign();
    this.lavaSign.position.set(LAVA.start.x + 2.6, 0, LAVA.start.z + 0.6);
    this.lavaSign.userData.dynamic = true;
    setSignText(this.lavaSign, 'Lave !');
    this.scene.add(this.lavaSign);
    this.collidables.push({ x: LAVA.start.x + 2.6, z: LAVA.start.z + 0.6, r: 0.18 });
    this.lavaGlow = new THREE.Object3D();
    this.lavaGlow.position.set((LAVA.x0 + LAVA.x1) / 2, 1.5, (LAVA.z0 + LAVA.z1) / 2);
    this.scene.add(this.lavaGlow);
    this.kit.pointLight(this.lavaGlow, 0xff6a1e, 2.5, 18, 1.4, 0, 0, 0, { amp: 0.15, speed: 3 });
    this.bookObj = this._addInteractable({ kind: 'book', worldPos: new THREE.Vector3(BOOK.x, SUMMIT.level, BOOK.z), iconY: 2.0, reach: 1.8, hitRadius: 0.9 });
  }
  setNpcVisible(id, on) {
    const o = this.interactables.find((i) => i.kind === 'npc' && i.npcId === id);
    if (!o) return;
    o.npc.visible = on;
    o.active = on;
    o.respawnAt = undefined;
    o.iconHolder.visible = on;
    if (!on && o.labelEl) o.labelEl.style.display = 'none';
  }
  // Lava course: flags, exit ramp, and the fountain that rises when it is won.
  setLavaFlag(role, on = true) {
    const f = this.lavaCourse?.flags[role];
    if (f && role !== 'finish') f.userData.cloth.material.color.set(on ? 0xffd34a : 0x9a9aa6);
  }
  openLavaExit() {
    if (this.lavaExitOpen) return;
    this.lavaExitOpen = true;
    this.lavaCourse.exitRamp.visible = true;
    const fin = LAVA.pillars.find((pp) => pp[4] === 'finish');
    const zTop = fin[1] - fin[2] / 2, zBottom = LAVA.z0 - 1.6;
    this.walkways.push({ axis: 'z', x: LAVA.exit.x, z0: zTop + 0.05, z1: zBottom, hw: 0.8, y: (x, z) => Math.max(0, fin[3] * (z - zBottom) / (zTop - zBottom)) });
  }
  inLava(x, z) { return x > LAVA.x0 - 0.3 && x < LAVA.x1 + 0.3 && z > LAVA.z0 - 0.3 && z < LAVA.z1 + 0.3; }
  // An ore block to mine with the pickaxe.
  _addOre(x, z, kind) {
    const y = this.terrain.heightAt(x, z);
    const tex = { iron: 'ironOre', diamond: 'diamondOre', obsidian: 'obsidian' }[kind];
    const block = texBox(this.scene, 0.95, 0.95, 0.95, blockMat(tex), x, y + 0.475, z, { tile: 0.95 });
    block.userData.dynamic = true;
    this.collidables.push({ x, z, r: 0.5 });
    return this._addInteractable({
      kind: 'node', nodeType: 'ore', material: kind, requires: 'pickaxe', block,
      burst: { iron: '#d8a878', diamond: '#5af0e6', obsidian: '#5a3a8a' }[kind],
      worldPos: new THREE.Vector3(x, y, z), iconY: 1.55, reach: 1.5,
    });
  }
  // A treasure chest: something random inside, back after a while.
  _addChest(cx, cz, ry = 0) {
    const y = this.terrain.heightAt(cx, cz);
    const chest = buildChest();
    chest.position.set(cx, y, cz);
    chest.rotation.y = ry;
    chest.userData.dynamic = true;
    this.scene.add(chest);
    this.collidables.push({ x: cx, z: cz, r: 0.6 });
    return this._addInteractable({
      kind: 'node', nodeType: 'chest', material: 'chest', block: chest, chest,
      burst: '#f2c84b', worldPos: new THREE.Vector3(cx, y, cz), iconY: 1.6, reach: 1.7, respawn: 240,
    });
  }
  // Places to discover (landmarks.js), the beach castles and lily pads, and the animals.
  _buildPlaces() {
    this.places = [];
    this.placeAnims = [];
    for (const def of PLACES) {
      const out = buildPlace(def, this);
      mergeGroup(out.group);
      out.group.userData.dynamic = true;
      this.scene.add(out.group);
      this.regionGroups.push({ name: def.id, group: out.group, def: { x: def.x, z: def.z, show: 34 } });
      for (const n of out.nodes) {
        if (n.chest) this._addChest(n.x, n.z, n.ry);
        else if (n.ore) this._addOre(n.x, n.z, n.ore);
        else if (n.kind === 'portal') this.portalObj = this._addInteractable({ kind: 'portal', placeId: def.id, worldPos: new THREE.Vector3(n.x, this.groundAt(n.x, n.z), n.z), iconY: 2.4, reach: 2.0, hitRadius: 1.3 });
        else this._addInteractable({ kind: 'node', nodeType: n.nodeType, material: n.material, requires: n.requires, worldPos: new THREE.Vector3(n.x, this.groundAt(n.x, n.z), n.z), iconY: 1.5, reach: n.reach ?? 1.8, hitRadius: 1.2 });
      }
      if (out.portal) this.portalSurface = out.portal;
      for (const fn of out.anims) this.placeAnims.push({ x: def.x, z: def.z, fn });
      this.places.push(def);
    }
    for (const extras of [buildExtras(this, MARSH_POOLS), buildTrails(this), buildGroves(this), buildRegionFillers(this)]) {
      mergeGroup(extras);
      extras.userData.dynamic = true;
      this.scene.add(extras);
    }
    // Fireflies over the marsh, the meadow and the forest at night.
    this.fireflies = [[60, 2, 14], [-34, 39, 8], [-64, 6, 14], [-52, 24, 6]].map(([x, z, r]) => {
      const n = 36, pos = new Float32Array(n * 3), seeds = [];
      for (let i = 0; i < n; i++) seeds.push([x + (Math.random() - 0.5) * r * 2, z + (Math.random() - 0.5) * r * 2, Math.random() * 6]);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xfff27a, size: 0.22, transparent: true, opacity: 0.9, depthWrite: false }));
      pts.userData.dynamic = true;
      pts.frustumCulled = false;
      pts.visible = false;
      this.scene.add(pts);
      return { pts, seeds, x, z };
    });
  }
  _tickFireflies(t) {
    const night = (this.night ?? 0) > 0.4, p = this.player.position;
    for (const f of this.fireflies ?? []) {
      f.pts.visible = night && Math.hypot(p.x - f.x, p.z - f.z) < 50;
      if (!f.pts.visible) continue;
      const a = f.pts.geometry.attributes.position;
      f.seeds.forEach(([x, z, k], i) => a.setXYZ(i, x + Math.sin(t * 0.7 + k) * 1.2, this.groundAt(x, z) + 0.8 + Math.sin(t * 1.3 + k * 2) * 0.5, z + Math.cos(t * 0.6 + k) * 1.2));
      a.needsUpdate = true;
    }
  }
  lightPortal(on = true) { if (this.portalSurface) this.portalSurface.visible = on; }
  _tickPlaces(dt, t) {
    const p = this.player.position;
    for (const a of this.placeAnims ?? []) if (Math.abs(p.x - a.x) < 45 && Math.abs(p.z - a.z) < 45) a.fn(dt, t);
  }

  // Decorations bought with stars, inside the cottage.
  placeDecor(id) {
    const def = DECOR.find((d) => d.id === id);
    const house = this.houses.find((h) => h.type === 'cottage');
    if (!def || !house) return false;
    this.decor ??= {};
    if (this.decor[id]) return true;
    const g = new THREE.Group();
    g.position.set(def.at[0], def.id === 'rug' ? 0 : 0.12, def.at[1]); // on the plank floor
    g.rotation.y = def.ry ?? 0;
    def.build(g, this.kit, THREE);
    g.traverse((o) => { o.userData.dynamic = true; });
    house.group.add(g);
    if (def.r) this._addLocalCollider(house.group, def.at[0], def.at[1], def.r);
    this.decor[id] = g;
    return true;
  }

  // The lava bucket: a pool of lava bubbles up in front of the hero for a few seconds. It burns
  // zombies, never the hero.
  eruptLava(seconds = 3) {
    const p = this.player.position, a = this.player.rotation.y;
    const x = p.x + Math.sin(a) * 2.4, z = p.z + Math.cos(a) * 2.4;
    if (this.waterAt(x, z)) {
      // Into the water: steam, and obsidian.
      for (const c of ['#ffffff', '#cfd8e0', '#ff7a1e']) this.particleBurst({ x, y: 0.6, z }, c, 22);
      this.screenShake(0.12);
      const made = this._obsidianFromWater(x, z);
      this.onObsidian?.(made.length);
      return { x, z, obsidian: made.length };
    }
    const y = this.groundAt(x, z);
    const tex = this.lavaCourse?.lavaTex;
    const disc = new THREE.Mesh(new THREE.CircleGeometry(2.2, 28), new THREE.MeshStandardMaterial({ color: 0xff7a1e, emissive: 0xff4a00, emissiveIntensity: 1.1, map: tex ?? null, transparent: true, opacity: 0.95, depthWrite: false }));
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(x, y + 0.06, z);
    disc.scale.setScalar(0.1);
    this.scene.add(disc);
    this.eruptions ??= [];
    this.eruptions.push({ disc, x, z, y, r: 2.2, t: 0, life: seconds });
    this.screenShake(0.15);
    for (const c of ['#ff7a1e', '#ffd36a', '#ff3a1a']) this.particleBurst({ x, y: y + 0.5, z }, c, 18);
    return { x, z };
  }
  _tickEruptions(dt) {
    if (!this.eruptions?.length) return;
    for (const e of this.eruptions) {
      e.t += dt;
      const grow = Math.min(1, e.t / 0.3), shrink = Math.min(1, (e.life - e.t) / 0.4);
      e.disc.scale.setScalar(Math.max(0.01, Math.min(grow, shrink)));
      if (Math.random() < dt * 10) this.particleBurst({ x: e.x + (Math.random() - 0.5) * 3, y: e.y + 0.3, z: e.z + (Math.random() - 0.5) * 3 }, Math.random() < 0.5 ? '#ff7a1e' : '#ffd36a', 4);
      if (e.t >= e.life) { this.scene.remove(e.disc); e.done = true; }
    }
    this.eruptions = this.eruptions.filter((e) => !e.done);
  }
  // Is there water here (river, marsh pools, sea)?
  waterAt(x, z) {
    return this.collidables.some((c) => c.water && (c.rect ? x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1 : Math.hypot(x - c.x, z - c.z) < c.r + 0.2));
  }
  // Lava poured into water turns into obsidian blocks, to mine with the pickaxe.
  _obsidianFromWater(x, z) {
    const made = [];
    for (const [dx, dz] of [[0, 0], [0.95, 0], [-0.95, 0], [0, 0.95], [0, -0.95]]) {
      const bx = x + dx, bz = z + dz;
      if (!this.waterAt(bx, bz) || this.interactables.some((i) => i.material === 'obsidian' && i.active && Math.hypot(i.worldPos.x - bx, i.worldPos.z - bz) < 0.8)) continue;
      const block = texBox(this.scene, 0.95, 0.95, 0.95, blockMat('obsidian'), bx, 0.2, bz, { tile: 0.95 });
      block.userData.dynamic = true;
      this.collidables.push({ x: bx, z: bz, r: 0.5 });
      this.walkways.push({ box: true, x0: bx - 0.48, x1: bx + 0.48, z0: bz - 0.48, z1: bz + 0.48, y: () => 0.68, obsidian: true });
      made.push(this._addInteractable({ kind: 'node', nodeType: 'ore', material: 'obsidian', requires: 'pickaxe', block, burst: '#5a3a8a', worldPos: new THREE.Vector3(bx, 0.2, bz), iconY: 1.4, reach: 1.8, noRespawn: true }));
      this.particleBurst({ x: bx, y: 0.8, z: bz }, '#cfd8e0', 14);
    }
    return made;
  }
  // Is this spot burning? (an eruption from the bucket)
  lavaHurts(x, z) {
    return !!this.eruptions?.some((e) => e.t < e.life - 0.2 && Math.hypot(x - e.x, z - e.z) < e.r);
  }

  // After a few falls on the same jump: a stone footbridge to the next pillar.
  addLavaHelp(index) {
    const A = LAVA.pillars[index], B = LAVA.pillars[index + 1];
    if (!B) return false;
    this.lavaHelps ??= new Set();
    if (this.lavaHelps.has(index)) return false;
    this.lavaHelps.add(index);
    const from = A ?? [LAVA.start.x, LAVA.start.z, 2.8, 0];
    const h = B[3];
    const x0 = Math.min(from[0], B[0]) - 0.6, x1 = Math.max(from[0], B[0]) + 0.6;
    const z0 = Math.min(from[1], B[1]) - 0.6, z1 = Math.max(from[1], B[1]) + 0.6;
    const g = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.14, z1 - z0), new THREE.MeshStandardMaterial({ color: 0xa8a29a, roughness: 0.9 }));
    g.position.set((x0 + x1) / 2, h - 0.07, (z0 + z1) / 2);
    g.receiveShadow = true;
    this.scene.add(g);
    this.walkways.push({ box: true, x0, x1, z0, z1, y: () => h, help: true });
    this.particleBurst(g.position.clone().add(new THREE.Vector3(0, 0.4, 0)), '#ffd36a', 26);
    return true;
  }
  lavaPillar(role) { const pp = LAVA.pillars.find((q) => q[4] === role); return pp ? { x: pp[0], z: pp[1], y: pp[3] } : null; }
  raiseFountain(instant = false) {
    const f = this.village.fountain, base = this.village.fountainBase, jet = this.village.fountainBigJet;
    if (!f || this.fountainRaised) return;
    this.fountainRaised = true;
    base.visible = true;
    jet.visible = true;
    const H = 1.26;
    if (instant) { f.position.y = H; return; }
    base.scale.y = 0.01;
    const start = this.clock.elapsedTime;
    (this.tweens ??= []).push((t) => {
      const k = Math.min(1, (t - start) / 2.6), e = 1 - (1 - k) ** 3;
      f.position.y = H * e; base.scale.y = Math.max(0.01, e);
      if (k >= 1) return false;
      return true;
    });
    this.screenShake(0.15);
    for (let i = 0; i < 5; i++) setTimeout(() => this.particleBurst(new THREE.Vector3((Math.random() - 0.5) * 3, 3 + Math.random() * 2, (Math.random() - 0.5) * 3), ['#7ac0ff', '#ffd36a', '#ffffff'][i % 3], 30), i * 400);
  }
  _tickLava(dt) {
    if (!this.lavaCourse) return;
    const p = this.player.position;
    this.lavaCourse.lavaTex.offset.y = (this.lavaCourse.lavaTex.offset.y + dt * 0.04) % 1;
    for (const f of Object.values(this.lavaCourse.flags)) f.userData.cloth.rotation.y = Math.sin(this.clock.elapsedTime * 3 + f.position.x) * 0.3;
    const near = p.x > LAVA.x0 - 4 && p.x < LAVA.x1 + 4 && p.z > LAVA.z0 - 4 && p.z < LAVA.z1 + 4;
    // Shadow under the hero while in the air, and the next pillar framed in gold.
    this.jumpShadow.visible = near && !this.onGround;
    if (this.jumpShadow.visible) this.jumpShadow.position.set(p.x, this.groundAt(p.x, p.z) + 0.04, p.z);
    const next = LAVA.pillars[this.lavaIndex + 1];
    this.nextMark.visible = near && !!next;
    if (next) { this.nextMark.position.set(next[0], next[3] + 0.06, next[1]); this.nextMark.scale.setScalar(next[2] / 2.6 * (1 + Math.sin(this.clock.elapsedTime * 4) * 0.04)); }
    if (p.x < LAVA.x0 || p.x > LAVA.x1 || p.z < LAVA.z0 || p.z > LAVA.z1) {
      if (p.z > LAVA.z1) this.lavaIndex = -1; // back at the start
      return;
    }
    let w = this._walkwayAt(p.x, p.z);
    // Landing just short of a pillar: pull the hero onto it (falling, at pillar height).
    if (!w && !this.onGround && (this.playerVY ?? 0) < 0) {
      for (const ww of this.walkways) {
        if (!ww.box || ww.index === undefined) continue;
        const h = ww.y();
        if (p.y > h + 0.15 || p.y < h - 0.35) continue;
        const cx = Math.min(ww.x1 - 0.3, Math.max(ww.x0 + 0.3, p.x)), cz = Math.min(ww.z1 - 0.3, Math.max(ww.z0 + 0.3, p.z));
        if (Math.hypot(cx - p.x, cz - p.z) > 0.75) continue;
        p.x = cx; p.z = cz; p.y = h; this.playerVY = 0; this.onGround = true; w = ww;
        break;
      }
    }
    if (this.onGround && w?.index !== undefined && w.index !== this.lavaIndex) {
      this.lavaIndex = Math.max(this.lavaIndex, w.index);
      if (w.role && w.role !== this.lavaLastRole) { this.lavaLastRole = w.role; this.onLavaPillar?.(w.role); }
    }
    // Touching the lava (on the ground, not on a pillar): ouch.
    if (!w && p.y < 0.35 && !this.lavaBurnt) {
      this.lavaBurnt = true;
      this.lavaFailAt = this.lavaIndex; // the jump from this pillar to the next one failed
      this.particleBurst(p.clone().add(new THREE.Vector3(0, 0.3, 0)), '#ff7a1e', 24);
      this.onLava?.();
    }
  }

  _tickRegions() {
    const p = this.player.position;
    const t = this.clock.elapsedTime;
    this._tickLava(1 / 60);
    if (this.lighthouseOn) this.coast.beamPivot.rotation.y = t * 0.8;
    if (this.coast) for (const b of this.coast.island.children) if (b.userData.float) { const f = b.userData.float; b.position.y = 1.2 + Math.sin(t * 1.5 + f.i) * 0.25; b.rotation.y = t * 0.6 + f.a; }
    if (this.mountain) this.mountain.book.position.y = SUMMIT.level + 1.08 + Math.sin(t * 2) * 0.04;
    for (const r of this.regionGroups ?? []) r.group.visible = Math.hypot(p.x - r.def.x, p.z - r.def.z) < r.def.show + 10;
    for (const a of this.fauna?.list ?? []) a.mesh.visible = Math.hypot(p.x - a.mesh.position.x, p.z - a.mesh.position.z) < (a.def.swim ? 60 : 38);
    // The sun (and its shadows) follow the hero around the bigger world.
    if (this.sun) {
      this.sun.position.set(p.x - 14, 24, p.z + 12);
      this.sun.target.position.set(p.x, 0, p.z);
      if (!this.sun.target.parent) this.scene.add(this.sun.target);
    }
  }
  teleport(x, z, ry = 0, up = undefined) {
    if (this.horses?.riding) { this.horses.dismount(); this.onDismount?.(); }
    this.autoWalk = null;
    this.playerVY = 0;
    this.player.position.set(x, this.groundAt(x, z, up), z);
    this.player.rotation.y = ry;
    for (const c of this.companions) c.mesh.position.set(x + c.offset.x, this.groundAt(x, z), z + c.offset.z);
    this.copper?.catchUp();
    this.particleBurst(new THREE.Vector3(x, 1, z), '#b08aff', 24);
  }

  /* ===== STORY: signs, Mimots, the torn page ===== */
  _buildStory() {
    const h = (x, z) => this.terrain.heightAt(x, z);
    for (const sg of SIGNS) {
      const house = this.houses.find((hh) => hh.name === sg.house);
      if (!house) continue;
      const x = house.center.x + Math.min(1.9, house.w / 2 - 0.6), z = house.center.z + house.d / 2 + 0.75;
      const sign = buildSign();
      sign.position.set(x, h(x, z), z);
      sign.userData.dynamic = true;
      this.scene.add(sign);
      this.collidables.push({ x, z, r: 0.18 });
      this._addInteractable({ kind: 'sign', signHouse: sg.house, block: sign, sign, worldPos: new THREE.Vector3(x, h(x, z), z + 0.4), iconY: 2.4, reach: 1.7, hitRadius: 0.9 });
    }
    this.mimots = MIMOTS.map((m) => {
      const group = buildMimot(m.color);
      group.position.set(m.x, this.groundAt(m.x, m.z), m.z);
      group.userData.dynamic = true;
      this.scene.add(group);
      const obj = this._addInteractable({ kind: 'mimot', mimotId: m.id, block: group, worldPos: group.position.clone(), iconY: 1.6, reach: 1.6, hitRadius: 0.8 });
      return { def: m, group, obj, target: new THREE.Vector3(m.x, 0, m.z), wait: Math.random() * 2, hop: Math.random() * 6 };
    });
    this.pageObjs = {};
    for (const P of PAGES) {
      const pg = buildPage();
      const y = h(P.x, P.z) + (P.y ?? 0);
      pg.position.set(P.x, y, P.z);
      pg.userData.dynamic = true;
      pg.visible = false;
      this.scene.add(pg);
      const o = this._addInteractable({ kind: 'page', pageId: P.id, scene: P.scene, block: pg, worldPos: pg.position.clone(), iconY: 1.7, reach: 1.6, hitRadius: 0.8 });
      o.active = false;
      o.iconHolder.visible = false;
      this.pageObjs[P.id] = o;
    }
    this.pageObj = this.pageObjs.page;
    // Travel signposts: the village hub, and one at the entrance of each region.
    for (const [region, T] of Object.entries(TRAVEL)) {
      const sign = buildSign();
      const y = h(T.x, T.z);
      sign.position.set(T.x, y, T.z);
      sign.rotation.y = region === 'forest' ? 0.5 : region === 'marsh' ? -0.5 : 0;
      sign.userData.dynamic = true;
      this.scene.add(sign);
      this.collidables.push({ x: T.x, z: T.z, r: 0.18 });
      this._addInteractable({ kind: 'travel', region, block: sign, sign, worldPos: new THREE.Vector3(T.x, y, T.z), iconY: 2.4, reach: 1.8, hitRadius: 0.9 });
    }
  }
  setSignWord(houseName, text) {
    const o = this.interactables.find((i) => i.kind === 'sign' && i.signHouse === houseName);
    if (o) setSignText(o.sign, text);
    return o;
  }
  // Show or hide a story thing (inactive things never respawn on their own).
  setStoryActive(obj, on) {
    if (!obj) return;
    obj.active = on;
    obj.respawnAt = undefined;
    if (obj.block) obj.block.visible = on;
    obj.iconHolder.visible = on;
    if (!on && obj.labelEl) obj.labelEl.style.display = 'none';
  }
  setMimotLetter(id, letter) {
    const m = this.mimots?.find((mm) => mm.def.id === id);
    if (!m) return;
    const pos = m.group.position.clone();
    const rot = m.group.rotation.y;
    this.scene.remove(m.group);
    m.group = buildMimot(m.def.color, letter);
    m.group.position.copy(pos); m.group.rotation.y = rot;
    m.group.userData.dynamic = true;
    m.group.visible = m.obj.active;
    this.scene.add(m.group);
    m.obj.block = m.group;
  }
  // The Mimot jumps for joy and vanishes in sparkles.
  tameMimot(id) {
    const m = this.mimots?.find((mm) => mm.def.id === id);
    if (!m) return;
    this.particleBurst(m.group.position.clone().add(new THREE.Vector3(0, 0.6, 0)), '#ffe08a', 30);
    this.setStoryActive(m.obj, false);
  }
  _tickStory(dt, elapsed) {
    for (const m of this.mimots ?? []) {
      if (!m.obj.active) continue;
      const g = m.group;
      // Wander around home: pick a spot, hop there, wait a little.
      if (m.wait > 0) m.wait -= dt;
      else {
        const dx = m.target.x - g.position.x, dz = m.target.z - g.position.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.1) {
          m.wait = 1 + Math.random() * 2.5;
          const a = Math.random() * Math.PI * 2, r = Math.random() * (m.def.roam ?? 2.2);
          const tx = m.def.x + Math.cos(a) * r, tz = m.def.z + Math.sin(a) * r;
          if (!this._checkCollision(tx, tz) && !this._insideAnyHouse?.(tx, tz, 0.6)) m.target.set(tx, 0, tz);
        } else {
          const sp = Math.min(d, dt * 1.1);
          g.position.x += (dx / d) * sp; g.position.z += (dz / d) * sp;
          g.rotation.y = this._lerpAngle(g.rotation.y, Math.atan2(dx, dz), 0.2);
          m.hop += dt * 9;
        }
      }
      // Turn towards the hero when close.
      const pdx = this.player.position.x - g.position.x, pdz = this.player.position.z - g.position.z;
      if (Math.hypot(pdx, pdz) < 3) g.rotation.y = this._lerpAngle(g.rotation.y, Math.atan2(pdx, pdz), 0.1);
      const ground = this.groundAt(g.position.x, g.position.z);
      g.position.y = ground + Math.abs(Math.sin(m.hop)) * 0.18;
      g.userData.body.scale.y = 1.35 * (1 + Math.sin(elapsed * 3 + m.def.x) * 0.04);
      m.obj.worldPos.set(g.position.x, ground, g.position.z);
      m.obj.iconHolder.position.x = g.position.x; m.obj.iconHolder.position.z = g.position.z;
      m.obj.hit.position.set(g.position.x, ground + m.obj.iconY - 0.35, g.position.z);
    }
    for (const o of Object.values(this.pageObjs ?? {})) {
      if (!o.active) continue;
      const sh = o.block.userData.sheet;
      sh.position.y = 0.9 + Math.sin(elapsed * 2) * 0.1;
      sh.rotation.y = elapsed * 0.8;
    }
  }

  /* ===== WORD MAGIC ===== */
  _buildMagic() {
    const h = (x, z) => this.terrain.heightAt(x, z);
    this.spellObjects = {};
    for (const c of CIRCLES) {
      const y = h(c.x, c.z);
      const ring = buildCircle();
      ring.position.set(c.x, y, c.z);
      ring.userData.dynamic = true;
      this.scene.add(ring);
      (this.spinners ??= []).push(ring);
      this._addInteractable({
        kind: 'circle', spellId: c.spell, cid: c.cid ?? c.spell, bridge: c.bridge, material: 'spell', block: ring,
        worldPos: new THREE.Vector3(c.x, y, c.z), iconY: 1.5, reach: 1.7, hitRadius: 1.0,
      });
    }
    this.braziers = BRAZIERS.map(([x, z]) => {
      const b = buildBrazier();
      b.position.set(x, h(x, z), z);
      b.userData.dynamic = true;
      this.scene.add(b);
      this.collidables.push({ x, z, r: 0.45 });
      return b;
    });
  }

  // Cast a spell at a circle. power: 'strong' | 'wobbly' | 'weak'. Returns what appeared.
  castSpell(id, circle, power = 'strong', { silent = false } = {}) {
    const grow = (obj) => { obj.scale.setScalar(0.01); (this.growing ??= []).push(obj); };
    const at = circle?.worldPos ?? new THREE.Vector3();
    if (!silent && circle) this.particleBurst(at.clone().add(new THREE.Vector3(0, 0.6, 0)), '#b08aff', 34);
    const key = circle?.cid ?? id;
    if (id === 'pont') {
      if (this.spellObjects[key]) return null;
      const B = BRIDGES[circle?.bridge ?? 'village'];
      const br = buildBridge(power, B);
      br.userData.dynamic = true;
      this.scene.add(br);
      this.spellObjects[key] = br;
      const len = B.x1 - B.x0, mid = B.x0 + len / 2;
      const arch = power === 'weak' ? 0 : 0.28;
      (this.walkways ??= []).push({ x0: B.x0 - 0.2, x1: B.x1 + 0.2, z: B.z, hw: power === 'weak' ? 0.45 : 0.55, y: (x) => { const t = (x - mid) / (len / 2); return 0.2 + arch * Math.max(0, 1 - t * t); } });
      if (B.island) {
        this.walkways.push({ circle: true, x: B.island.x, z: B.island.z, r: B.island.r, y: () => 0.27 });
        // A treasure chest waits on the island.
        if (!this.islandChest) {
          const I = B.island;
          const chest = buildChest();
          chest.position.set(I.x, 0.27, I.z + 0.75);
          chest.rotation.y = Math.PI;
          chest.userData.dynamic = true;
          this.scene.add(chest);
          this.collidables.push({ x: I.x, z: I.z + 0.75, r: 0.45 });
          this.islandChest = this._addInteractable({
            kind: 'node', nodeType: 'chest', material: 'chest', block: chest, chest,
            burst: '#f2c84b', worldPos: new THREE.Vector3(I.x, 0.27, I.z + 0.75), iconY: 1.6, reach: 1.5, respawn: 300,
          });
        }
      }
      if (circle) { circle.active = false; circle.block.visible = false; circle.iconHolder.visible = false; if (circle.labelEl) circle.labelEl.style.display = 'none'; }
      if (!silent) { grow(br); this.screenShake(0.08); }
      return br;
    }
    if (id === 'vent') {
      // The wind blows the marsh mist away.
      if (!this.marshMist) return null;
      this.marshMist = false;
      const mist = this.marsh?.mist;
      if (mist && !silent) {
        const start = this.clock.elapsedTime;
        (this.tweens ??= []).push((t) => { const k = Math.min(1, (t - start) / 2.2); mist.material.opacity = 0.78 * (1 - k); mist.position.x = k * 14; if (k >= 1) { mist.visible = false; return false; } return true; });
        for (let i = 0; i < 40; i++) this.particleBurst(new THREE.Vector3(MIST_X - 2, 1 + Math.random() * 2, (Math.random() - 0.5) * 10), '#ffffff', 1);
      } else if (mist) mist.visible = false;
      if (circle) { circle.active = false; circle.block.visible = false; circle.iconHolder.visible = false; if (circle.labelEl) circle.labelEl.style.display = 'none'; }
      return true;
    }
    if (id === 'pierre') {
      if (this.spellObjects[key]) return null;
      this.spellObjects[key] = true;
      const st = this.mountain?.stairs;
      if (st) { st.visible = true; if (!silent) grow(st); }
      if (this.mountain?.rockfall) this.mountain.rockfall.visible = false;
      if (this.cliffSign) this.cliffSign.visible = false;
      (this.walkways ??= []).push({ axis: 'z', x: STAIRS.x, z0: STAIRS.z0 + 0.6, z1: STAIRS.z1 - 0.6, hw: STAIRS.hw, y: (x, z) => this.stairsY(z) });
      if (circle) { circle.active = false; circle.block.visible = false; circle.iconHolder.visible = false; if (circle.labelEl) circle.labelEl.style.display = 'none'; }
      if (!silent) this.screenShake(0.12);
      return true;
    }
    if (id === 'lumiere' && key === 'lumiere-phare') {
      this.coast.lamp.visible = true;
      this.coast.beamPivot.visible = true;
      this.lighthouseOn = true;
      if (circle) { circle.active = false; circle.block.visible = false; circle.iconHolder.visible = false; if (circle.labelEl) circle.labelEl.style.display = 'none'; }
      return true;
    }
    if (id === 'feu' && key === 'feu-marais') {
      for (const l of this.marsh?.lanterns ?? []) { l.userData.glow.visible = true; l.userData.unlit.visible = false; }
      if (!this.marshLights) {
        this.marshLights = true;
        for (const l of this.marsh?.lanterns ?? []) this.kit.pointLight(l, 0xffb347, 2.2, 7, 1.6, 0, 1.9, 0, { amp: 0.08, speed: 6 });
      }
      if (circle) { circle.active = false; circle.block.visible = false; circle.iconHolder.visible = false; if (circle.labelEl) circle.labelEl.style.display = 'none'; }
      return true;
    }
    if (id === 'fleur' || id === 'arbre') {
      // Grows next to the circle and can be gathered (no tool needed for magic plants).
      const off = new THREE.Vector3(1.9, 0, 0.6);
      const p = at.clone().add(off);
      p.y = this.terrain.heightAt(p.x, p.z);
      const old = this.spellObjects[key];
      if (old?.node?.active) return null;
      if (old) { this.scene.remove(old.group); this.interactables = this.interactables.filter((o) => o !== old.node); old.node.iconHolder.removeFromParent(); old.node.hit.removeFromParent(); old.node.labelEl?.remove(); }
      const group = id === 'fleur' ? buildFlowerBed(power) : buildMagicTree(power);
      group.position.copy(p);
      group.userData.dynamic = true;
      this.scene.add(group);
      if (id === 'arbre') this.collidables.push({ x: p.x, z: p.z, r: 0.35 });
      const node = this._addInteractable({
        kind: 'node', nodeType: id === 'fleur' ? 'flower' : 'tree', material: id === 'fleur' ? 'flower' : 'wood', magic: true,
        block: group, burst: id === 'fleur' ? '#ff7ab0' : '#7ad86a', respawn: 1e9,
        worldPos: p, iconY: id === 'fleur' ? 1.3 : 3.4, reach: 1.7, hitRadius: 1.1,
      });
      this.spellObjects[key] = { group, node };
      if (!silent) grow(group);
      return group;
    }
    if (id === 'pluie') {
      // Rain over the field: the wheat grows back at once.
      for (let i = 0; i < 70; i++) {
        this.particleGeo ??= new THREE.BoxGeometry(0.12, 0.12, 0.12);
        const m = new THREE.MeshBasicMaterial({ color: 0x8ac8ff, transparent: true, opacity: 1 });
        const d = new THREE.Mesh(this.particleGeo, m);
        d.scale.set(0.4, 1.6, 0.4);
        d.position.set(5.5 + Math.random() * 5, 4 + Math.random() * 3, 12.4 + Math.random() * 3.4);
        d.userData = { vx: 0, vy: -4 - Math.random() * 2, vz: 0, life: 1, decay: 0.55 + Math.random() * 0.3 };
        this.scene.add(d);
        this.particles.push(d);
      }
      for (const o of this.interactables) if (o.nodeType === 'wheat' && !o.active) o.respawnAt = this.clock.elapsedTime;
      return true;
    }
    if (id === 'lumiere') {
      if (!this.lightOrb) {
        this.lightOrb = buildLightOrb();
        this.lightOrb.userData.dynamic = true;
        this.scene.add(this.lightOrb);
      }
      this.lightOrb.userData.until = this.clock.elapsedTime + (power === 'strong' ? 240 : power === 'wobbly' ? 150 : 80);
      this.lightOrb.visible = true;
      return this.lightOrb;
    }
    if (id === 'feu') {
      for (const b of this.braziers) b.userData.flame.visible = true;
      if (!this.fireNodes) {
        this.fireNodes = this.braziers.map((b) => this._addInteractable({
          kind: 'node', nodeType: 'fire', material: 'fire', magic: true, respawn: 90,
          worldPos: b.position.clone(), iconY: 1.9, reach: 1.5, hitRadius: 0.8,
        }));
      } else for (const n of this.fireNodes) { n.active = true; n.iconHolder.visible = true; n.respawnAt = undefined; }
      return true;
    }
    return null;
  }

  _tickMagic(dt, elapsed) {
    for (const r of this.spinners ?? []) r.rotation.y += dt * 0.4;
    const orb = this.lightOrb;
    if (orb?.visible) {
      const p = this.player.position;
      const a = elapsed * 1.3;
      orb.position.lerp(new THREE.Vector3(p.x + Math.cos(a) * 0.9, p.y + 2.1 + Math.sin(elapsed * 2.2) * 0.15, p.z + Math.sin(a) * 0.9), Math.min(1, dt * 4));
      orb.rotation.y += dt * 2;
      orb.userData.light.intensity = 1.2 + 4 * (this.night ?? 0);
      if (elapsed > orb.userData.until) { orb.visible = false; orb.userData.light.intensity = 0; }
    }
    for (const b of this.braziers ?? []) {
      const f = b.userData.flame;
      if (f.visible) f.scale.y = 1 + Math.sin(elapsed * 9 + b.position.x) * 0.15;
    }
  }

  _addLocalCollider(group, lx, lz, r) {
    const v = new THREE.Vector3(lx, 0, lz).applyAxisAngle(new THREE.Vector3(0, 1, 0), group.rotation.y).add(group.position);
    this.collidables.push({ x: v.x, z: v.z, r });
  }

  // Minecraft-style stepped roofs. Each house gets its own material instances so one roof
  // can fade out (cutaway) without touching the others.
  _buildRoof(group, w, d, wallH, rise, style, type) {
    const roof = new THREE.Group();
    group.add(roof);
    const mats = [];
    const mk = (texName, extra = {}) => {
      const m = new THREE.MeshStandardMaterial({ map: BLOCKS[texName](), roughness: 0.85, ...extra });
      mats.push(m);
      return m;
    };
    const tile = mk(style.roof);
    const ridgeMat = mk(style.ridge ?? style.trim);
    const gableMat = mk(style.gable ?? style.wall);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xffd98a, emissive: 0xffb04a, emissiveIntensity: 0.9 });
    mats.push(glassMat);
    const top = wallH + 0.2;

    if (style.roofStyle === 'pyramid') {
      // Stone battlements, then a stepped pyramid with a glowing orb.
      const merlonMat = mk(style.wall);
      const hw = w / 2 + 0.1;
      const hd = d / 2 + 0.1;
      for (let x = -hw; x <= hw + 0.01; x += 0.7) {
        for (const z of [-hd, hd]) texBox(roof, 0.42, 0.45, 0.42, merlonMat, x, top + 0.22, z);
      }
      for (let z = -hd + 0.7; z < hd - 0.3; z += 0.7) {
        for (const x of [-hw, hw]) texBox(roof, 0.42, 0.45, 0.42, merlonMat, x, top + 0.22, z);
      }
      const layers = Math.max(4, Math.round(rise / 0.42));
      const base = Math.max(w, d) - 0.6;
      for (let i = 0; i < layers; i++) {
        const s = base * (1 - i / layers) + 0.25;
        texBox(roof, s, 0.44, s, tile, 0, top + 0.5 + i * 0.42, 0);
      }
      const orb = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.32),
        new THREE.MeshStandardMaterial({ color: 0xc8a8ff, emissive: 0x9a6aff, emissiveIntensity: 2.4, roughness: 0.2 }),
      );
      mats.push(orb.material);
      orb.position.y = top + 0.5 + layers * 0.42 + 0.5;
      roof.add(orb);
      this.kit.flames.push({ mesh: orb, base: orb.scale.clone(), y0: orb.position.y, h: 0, phase: 0, speed: 2, small: true });
      return { group: roof, mats };
    }

    // Stepped gable roof, ridge along x.
    const o = 0.45;
    const hd = d / 2;
    const s = hd + o;
    const slope = rise / hd;
    const run = 0.42;
    const n = Math.ceil(s / run);
    const stepH = slope * run;
    const yLow = top - slope * o;
    const shell = Math.max(0.22, stepH + 0.12);
    for (const sgn of [-1, 1]) {
      for (let i = 0; i < n; i++) {
        const outer = s - i * run;
        const inner = Math.max(0, s - (i + 1) * run);
        const yTop = yLow + (i + 1) * stepH;
        texBox(roof, w + o * 2, shell, outer - inner + 0.002, tile, 0, yTop - shell / 2, sgn * (outer + inner) / 2, { tile: 0.8 });
        // Gable end walls under the steps.
        const zOut = Math.min(outer, hd);
        const zIn = Math.min(inner, hd);
        const gh = yTop - shell - top;
        if (zOut > zIn && gh > 0.02) {
          for (const sx of [-1, 1]) {
            texBox(roof, WALL_THICKNESS, gh, zOut - zIn + 0.002, gableMat, sx * (w / 2), top + gh / 2, sgn * (zOut + zIn) / 2, { cast: false });
          }
        }
      }
    }
    const apex = yLow + n * stepH;
    texBox(roof, w + o * 2 + 0.1, 0.24, 0.5, ridgeMat, 0, apex + 0.04, 0);
    // A little lit window in each gable.
    if (rise > 1.3) {
      for (const sx of [-1, 1]) {
        texBox(roof, WALL_THICKNESS + 0.06, 0.5, 0.5, glassMat, sx * (w / 2), top + rise * 0.38, 0, { cast: false });
        texBox(roof, WALL_THICKNESS + 0.1, 0.08, 0.7, ridgeMat, sx * (w / 2), top + rise * 0.38 - 0.3, 0, { cast: false });
      }
    }
    return { group: roof, mats };
  }

  // Shutters, flower boxes, lanterns and a few props that give each building its character.
  _decorateExterior(house, front, frontWindows, style) {
    const kit = this.kit;
    const { group, type, w, d, wallH, doorW } = house;
    const halfW = w / 2;
    const halfD = d / 2;
    const z0 = WALL_THICKNESS / 2 + 0.06; // just outside the front wall (front decor space)
    const shutterMat = kit.mat(style.shutter ?? 0x3a6a3a, { roughness: 0.8 });
    const boxMat = blockMat(style.trim === 'stoneBricks' ? 'sprucePlanks' : 'darkOakPlanks');
    const flowerColors = [0xff5a7a, 0xffd93d, 0xffffff, 0xb07aff, 0xff8a3d];

    for (const wx of frontWindows) {
      for (const s of [-1, 1]) {
        kit.box(front.decor, 0.32, 1.15, 0.06, shutterMat, wx + s * 0.66, 1.55, z0, { cast: false });
        kit.box(front.decor, 0.26, 0.05, 0.07, kit.mat(0x2a2220), wx + s * 0.66, 1.85, z0 + 0.01, { cast: false });
        kit.box(front.decor, 0.26, 0.05, 0.07, kit.mat(0x2a2220), wx + s * 0.66, 1.25, z0 + 0.01, { cast: false });
      }
      // Flower box under the window.
      texBox(front.decor, 1.05, 0.26, 0.32, boxMat, wx, 0.82, z0 + 0.14, { cast: false });
      kit.box(front.decor, 0.95, 0.04, 0.24, kit.mat(0x4a3020), wx, 0.96, z0 + 0.14, { cast: false });
      for (let i = 0; i < 4; i++) {
        kit.box(front.decor, 0.08, 0.14, 0.08, kit.mat(0x3f8a3a), wx - 0.36 + i * 0.24, 1.03, z0 + 0.14, { cast: false });
        kit.box(front.decor, 0.13, 0.13, 0.13, kit.mat(flowerColors[(i + Math.round(wx * 3)) % 5], { emissive: flowerColors[(i + 1) % 5], emissiveIntensity: 0.12 }), wx - 0.36 + i * 0.24, 1.15, z0 + 0.14, { cast: false });
      }
    }
    // Wall lanterns either side of the door.
    for (const s of [-1, 1]) {
      const lx = s * (doorW / 2 + 0.5);
      kit.box(front.decor, 0.06, 0.06, 0.3, kit.mat(0x2b2523), lx, 2.15, z0 + 0.12, { cast: false });
      kit.box(front.decor, 0.2, 0.26, 0.2, kit.glow(0xffc46a, 2), lx, 1.98, z0 + 0.28, { cast: false });
      kit.box(front.decor, 0.24, 0.05, 0.24, kit.mat(0x2b2523), lx, 2.13, z0 + 0.28, { cast: false });
    }
    // Doormat.
    kit.box(group, doorW * 0.8, 0.03, 0.6, kit.mat(style.mat ?? 0x8a3b2e, { roughness: 1 }), 0, 0.03, halfD + 0.55, { cast: false });

    const ground = (x, z) => new THREE.Vector3(x, 0, z);
    void ground;
    if (type === 'shop') {
      // Striped awning over the shop front and a market stall.
      const stripes = Math.round((w - 0.6) / 0.5);
      for (let i = 0; i < stripes; i++) {
        const x = -(w - 0.6) / 2 + (i + 0.5) * ((w - 0.6) / stripes);
        const strip = kit.box(front.decor, (w - 0.6) / stripes, 0.06, 1.3, kit.mat(i % 2 ? 0xf3ead6 : 0xc8372d, { roughness: 0.9 }), x, wallH - 0.35, z0 + 0.6);
        strip.rotation.x = 0.42;
        kit.box(front.decor, (w - 0.6) / stripes, 0.22, 0.04, kit.mat(i % 2 ? 0xf3ead6 : 0xc8372d), x, wallH - 0.72, z0 + 1.22, { cast: false });
      }
      kit.crate(group, halfW - 0.7, halfD + 1.1, 0.55, 0.2);
      kit.crate(group, halfW - 0.75, halfD + 1.15, 0.4, -0.3, 0.55);
      for (let i = 0; i < 5; i++) kit.sphere(group, 0.09, kit.mat(i % 2 ? 0xd8382e : 0x7ac142), halfW - 0.85 + i * 0.07, 0.62, halfD + 1.05 + (i % 2) * 0.1);
      kit.barrel(group, -halfW + 0.6, 0, halfD + 0.9, { r: 0.3, h: 0.7 });
      this._addLocalCollider(group, halfW - 0.7, halfD + 1.1, 0.5);
      this._addLocalCollider(group, -halfW + 0.6, halfD + 0.9, 0.4);
    } else if (type === 'forge') {
      // Anvil, log pile and a water trough outside the smithy.
      const ax = halfW - 0.9;
      const az = halfD + 1.3;
      const iron = kit.mat(0x3a3a40, { metalness: 0.6, roughness: 0.4 });
      texBox(group, 0.5, 0.35, 0.5, blockMat('oakLog'), ax, 0.18, az);
      kit.box(group, 0.3, 0.2, 0.25, iron, ax, 0.45, az);
      kit.box(group, 0.7, 0.16, 0.32, iron, ax, 0.62, az);
      kit.box(group, 0.2, 0.1, 0.2, iron, ax + 0.42, 0.62, az, { ry: 0.0 });
      this._addLocalCollider(group, ax, az, 0.45);
      const logs = blockMat('oakLog');
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3 - i; j++) texBox(group, 0.3, 0.3, 1.1, logs, -halfW + 0.55 + j * 0.32 + i * 0.16, 0.15 + i * 0.28, halfD + 1.0);
      this._addLocalCollider(group, -halfW + 0.85, halfD + 1.0, 0.6);
      texBox(group, 1.2, 0.45, 0.55, blockMat('sprucePlanks'), -halfW - 0.75, 0.22, 0.5);
      const water = new THREE.MeshStandardMaterial({ color: 0x4aa3d8, emissive: 0x1a5a8a, emissiveIntensity: 0.3, roughness: 0.1 });
      kit.box(group, 1.0, 0.04, 0.4, water, -halfW - 0.75, 0.43, 0.5, { cast: false });
      this._addLocalCollider(group, -halfW - 0.75, 0.5, 0.5);
    } else if (type === 'tower') {
      kit.banner(front.decor, -1.4, wallH - 0.3, z0, 0, { color: 0x5a3aa8, emblem: 0xf2c84b });
      kit.banner(front.decor, 1.4, wallH - 0.3, z0, 0, { color: 0x5a3aa8, emblem: 0xf2c84b });
      // Glowing runes on the doorstep.
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        kit.box(group, 0.16, 0.03, 0.16, kit.glow(0x9a6aff, 1.6), Math.cos(a) * 0.7, 0.04, halfD + 1.1 + Math.sin(a) * 0.4, { ry: a, cast: false });
      }
    } else if (type === 'cottage') {
      // Cobblestone chimney up the side wall and a flower bed.
      const cx = -halfW - 0.4;
      const ch = house.wallH + house.rise + 1.0;
      texBox(group, 0.7, ch, 0.8, blockMat('cobble'), cx, ch / 2, -0.4);
      texBox(group, 0.82, 0.18, 0.92, blockMat('stoneBricks'), cx, ch + 0.09, -0.4);
      this._addLocalCollider(group, cx, -0.4, 0.45);
      this.chimneys ??= [];
      this.chimneys.push(new THREE.Vector3(group.position.x + cx, ch + 0.3, group.position.z - 0.4));
      for (let i = 0; i < 9; i++) {
        const x = -halfW + 0.4 + i * ((w - 0.8) / 8);
        if (Math.abs(x) < doorW / 2 + 0.3) continue;
        kit.box(group, 0.1, 0.22, 0.1, kit.mat(0x3f8a3a), x, 0.11, halfD + 0.45, { cast: false });
        kit.box(group, 0.16, 0.16, 0.16, kit.mat(flowerColors[i % 5]), x, 0.28, halfD + 0.45, { cast: false });
      }
    } else if (type === 'guild') {
      kit.banner(front.decor, -halfW + 0.62, wallH - 0.2, z0, 0, { color: 0xa8302a, emblem: 0xf2c84b });
      kit.banner(front.decor, halfW - 0.62, wallH - 0.2, z0, 0, { color: 0xa8302a, emblem: 0xf2c84b });
      const steps = blockMat('stoneBricks');
      texBox(group, doorW + 1.0, 0.16, 0.5, steps, 0, 0.08, halfD + 0.4, { cast: false });
      texBox(group, doorW + 0.6, 0.1, 0.35, steps, 0, 0.21, halfD + 0.3, { cast: false });
    } else if (type === 'tavern') {
      kit.barrel(group, halfW - 0.6, 0, halfD + 0.7, { r: 0.3, h: 0.72 });
      kit.barrel(group, halfW - 1.25, 0, halfD + 0.65, { r: 0.28, h: 0.66 });
      this._addLocalCollider(group, halfW - 0.9, halfD + 0.7, 0.55);
    }
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
    const lamp = kit.group(group, 2.4, halfD + 0.5);
    kit.box(lamp, 0.12, 2.4, 0.12, kit.mat(0x2b2523, { metalness: 0.4 }), 0, 1.2, 0);
    kit.box(lamp, 0.5, 0.07, 0.07, kit.mat(0x2b2523, { metalness: 0.4 }), 0.22, 2.35, 0);
    kit.box(lamp, 0.2, 0.28, 0.2, kit.glow(0xffc46a, 2.2), 0.42, 2.12, 0);
    this._addLocalCollider(group, 2.4, halfD + 0.5, 0.25);
  }

  _addFurniture(group, type, w, d, halfW, halfD) {
    const woodMat = new THREE.MeshStandardMaterial({ color: COLORS.wood, roughness: 0.8 });
    const woodDarkMat = new THREE.MeshStandardMaterial({ color: COLORS.woodDark, roughness: 0.8 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: COLORS.stone, roughness: 0.7 });

    if (type === 'forge') {
      this.kit.fireplace(group, 0, -halfD + WALL_THICKNESS / 2, 0, { width: 1.8, chimneyTop: WALL_HEIGHT + 3.4, seed: 21 });
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
      // A proper bed against the back wall: sleep in it to jump to night or morning.
      const bed = this.kit.group(group, -1.85, -1.05);
      texBox(bed, 1.7, 0.32, 0.95, blockMat('oakPlanks'), 0, 0.28, 0, { tile: 0.6 });
      texBox(bed, 0.14, 0.85, 1.0, blockMat('darkOakPlanks'), -0.85, 0.43, 0, { tile: 0.6 });
      texBox(bed, 0.14, 0.55, 1.0, blockMat('darkOakPlanks'), 0.85, 0.28, 0, { tile: 0.6 });
      this.kit.box(bed, 1.15, 0.14, 0.92, this.kit.mat(0xc8372d, { roughness: 0.95 }), 0.22, 0.5, 0);
      this.kit.box(bed, 1.17, 0.04, 0.94, this.kit.mat(0xf2c84b), 0.22, 0.45, 0, { cast: false });
      this.kit.box(bed, 0.42, 0.14, 0.7, this.kit.mat(0xffffff, { roughness: 0.9 }), -0.55, 0.52, 0);
      this._addLocalCollider(group, -1.85, -1.05, 0.75);
      this._addLocalCollider(group, -1.2, -1.05, 0.5);
      this.bedSpot = { group, lx: -1.0, lz: -0.3 };
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
    this.player = this._createCharacter('hero');
    this.player.position.set(0, 0, 4);
    this.scene.add(this.player);

    this.companions = [
      { mesh: this._createCharacter('dwarf'), offset: new THREE.Vector3(-1.2, 0, 0.8), target: new THREE.Vector3() },
      { mesh: this._createCharacter('elf'), offset: new THREE.Vector3(1.2, 0, 0.8), target: new THREE.Vector3() },
    ];
    for (const c of this.companions) {
      c.mesh.position.copy(this.player.position).add(c.offset);
      this.scene.add(c.mesh);
    }

    // NPCs
    const npcConfigs = [
      { pos: [3, 0, 2], name: 'mage' },
      { pos: [-4, 0, -3], name: 'merchant' },
      { pos: [0, 0, 8], name: 'guard' },
    ];
    for (const cfg of npcConfigs) {
      const npc = this._createCharacter(cfg.name);
      npc.position.set(...cfg.pos);
      npc.rotation.y = Math.atan2(-cfg.pos[0], -cfg.pos[2]) + 0.6;
      Object.assign(npc.userData, { isNPC: true, name: cfg.name });
      this.scene.add(npc);
      this.npcs.push(npc);
      this.collidables.push({ x: cfg.pos[0], z: cfg.pos[2], r: 0.4 });
    }
    // Every villager can be talked to (quests).
    for (const npc of this.npcs) {
      if (!npc.userData.name || this.interactables.some((i) => i.npc === npc)) continue; // already registered (region villagers)
      const wp = npc.getWorldPosition(new THREE.Vector3());
      this._addInteractable({ kind: 'npc', npcId: npc.userData.name, npc, worldPos: wp, iconY: 2.45, reach: 2.2, hitRadius: 0.9 });
    }
  }

  _createCharacter(specName) {
    const ch = createBlockyCharacter(specName);
    // Villagers never change clothes: merge their blocks per body part (far fewer draw calls).
    if (specName !== 'hero') mergeGroupParts(ch);
    this.characters ??= [];
    this.characters.push(ch);
    return ch;
  }

  // ===== HELD ITEMS =====

  setHeldItem(id) {
    const hand = this.player.userData.parts.rightArm.userData.hand;
    if (this.heldItem) {
      hand.remove(this.heldItem);
      this.heldFlames = [];
    }
    this.heldItem = id ? buildItem(id) : null;
    this.player.userData.held = id || null;
    if (this.heldItem) {
      hand.add(this.heldItem);
      this.heldFlames = this.heldItem.userData.flames;
    }
  }

  // Plays the item's animation and effect. Returns true if the item was used.
  useItem(fullId) {
    const id = fullId.split('_')[0];
    const spec = HOLDABLE[id];
    if (!spec || this.player.userData.action) return false;
    playAction(this.player, spec.action, spec.duration);
    const front = () => {
      const p = this.player.position.clone();
      const a = this.player.rotation.y;
      p.x += Math.sin(a) * 0.9;
      p.z += Math.cos(a) * 0.9;
      p.y = 0.8;
      return p;
    };
    const at = (ms, fn) => setTimeout(fn, ms);
    if (id === 'axe' || id === 'scythe' || id === 'hammer' || id === 'rod') {
      at(200, () => { this.particleBurst(front(), id === 'scythe' ? '#e2c25a' : '#c8a070', 16); this.screenShake(0.06); });
    } else if (id === 'sword') {
      at(180, () => { this.particleBurst(front(), '#e8f2ff', 22); this.screenShake(0.08); });
    } else if (id === 'pickaxe') {
      at(200, () => {
        this.particleBurst(front(), '#c8c0b0', 18);
        this.particleBurst(front(), '#ffd36a', 8);
        this.screenShake(0.12);
      });
    } else if (id === 'torch' || id === 'lantern') {
      const light = this.heldItem?.userData.light;
      if (light) { light.userData.boost = 2.5; at(1100, () => { light.userData.boost = 1; }); }
      at(300, () => { const p = this.player.position.clone(); p.y = 2; this.particleBurst(p, '#ffb340', 26); });
    } else if (id === 'wand') {
      at(250, () => {
        const p = this.player.position.clone(); p.y = 1.8;
        for (const c of ['#ff7ad9', '#7ad9ff', '#ffe27a', '#9aff7a']) this.particleBurst(p, c, 10);
        this._spawnFlowersAround(this.player.position, 6);
      });
    } else if (id === 'potion') {
      this.speedBoostUntil = this.clock.elapsedTime + 8;
      at(500, () => { const p = this.player.position.clone(); p.y = 1.4; this.particleBurst(p, '#c06aff', 24); });
    } else if (id === 'bucket') {
      at(350, () => this.eruptLava());
    } else if (id === 'bread') {
      at(500, () => { const p = this.player.position.clone(); p.y = 1.6; this.particleBurst(p, '#ff5a7a', 16); });
    }
    return true;
  }

  _spawnFlowersAround(pos, n) {
    const colors = [0xff6b9d, 0xffd93d, 0xb07aff, 0xffffff, 0xff8a3d];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.8 + Math.random() * 1.2;
      const x = pos.x + Math.cos(a) * r;
      const z = pos.z + Math.sin(a) * r;
      const f = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.04), this.kit.mat(0x3f8a3a));
      stem.position.y = 0.14;
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), this.kit.mat(colors[i % colors.length], { emissive: colors[i % colors.length], emissiveIntensity: 0.25 }));
      head.position.y = 0.32;
      f.add(stem, head);
      f.position.set(x, 0.02, z);
      f.scale.setScalar(0.01);
      this.scene.add(f);
      this.growing ??= [];
      this.growing.push(f);
    }
  }

  openChest(obj) {
    const lid = obj.chest?.userData.lid;
    if (!lid) return;
    const t0 = this.clock.elapsedTime;
    this.tweens ??= [];
    this.tweens.push((t) => { const k = Math.min(1, (t - t0) / 0.5); lid.rotation.x = -1.9 * k; return k < 1; });
    const p = obj.worldPos.clone(); p.y += 0.9;
    this.particleBurst(p, '#f2c84b', 30);
    this.particleBurst(p, '#ffffff', 12);
  }

  // Fishing: a bobber lands on the pond, then dips when a fish bites.
  castLine() {
    this.endFishing();
    const b = new THREE.Group();
    const red = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.16), new THREE.MeshStandardMaterial({ color: 0xd8382e }));
    const white = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.16), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    white.position.y = 0.1;
    b.add(red, white);
    b.position.set(-16 + (Math.random() - 0.5) * 1.6, 0.08, -15.4 - Math.random() * 0.8);
    this.scene.add(b);
    this.bobber = { mesh: b, dip: 0 };
    this.particleBurst(b.position.clone(), '#bfe6ff', 10);
    this.player.rotation.y = Math.PI;
    playAction(this.player, 'swing', 0.4);
  }
  bobberBite() { if (this.bobber) { this.bobber.dip = 1; this.particleBurst(this.bobber.mesh.position.clone(), '#bfe6ff', 14); } }
  endFishing() { if (this.bobber) { this.scene.remove(this.bobber.mesh); this.bobber = null; } }

  // Swap the hero's outfit, keeping position, facing and the held object.
  setHeroCostume(spec) {
    const old = this.player;
    const hero = createBlockyCharacter(spec);
    hero.position.copy(old.position);
    hero.rotation.copy(old.rotation);
    this.scene.remove(old);
    this.scene.add(hero);
    this.characters = this.characters.filter((c) => c !== old);
    this.characters.push(hero);
    this.player = hero;
    const held = old.userData.held;
    this.heldItem = null;
    if (held) this.setHeldItem(held);
  }

  // Day and night: one full day lasts a few minutes.
  _updateDayNight(dt) {
    const CYCLE = 420;
    this.dayTime = ((this.dayTime ?? 60) + dt) % CYCLE;
    const t = this.dayTime / CYCLE;
    const ss = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
    let n = t < 0.55 ? 0 : t < 0.65 ? ss(0.55, 0.65, t) : t < 0.9 ? 1 : 1 - ss(0.9, 1, t);
    if (this.mode === 'title') n = 0.35; // a warm dusk behind the title screen
    this.night = n;
    const isNight = n > 0.5;
    if (isNight !== this._wasNight) { this._wasNight = isNight; this.onDayPhase?.(isNight ? 'night' : 'day'); }
    this.sun.color.setHex(0xffd6a0).lerp(this._moonColor ??= new THREE.Color(0x8aa8ff), n);
    this.scene.fog.color.setHex(0xcfe0e4).lerp(this._nightFog ??= new THREE.Color(0x1c2440), n);
    if (this.kit.windowGlass) {
      this.kit.windowGlass.emissive.setHex(0x9fd2ee).lerp(this._warm ??= new THREE.Color(0xffb860), n);
      this.kit.windowGlass.emissiveIntensity = 0.55 + n * 0.9;
    }
    // Repaint the sky gradient now and then.
    this._skyT = (this._skyT ?? 1) + dt;
    if (this._skyT > 0.5 && this.scene.background?.isTexture) {
      this._skyT = 0;
      const c = this.scene.background.image;
      const g = c.getContext('2d');
      const mix = (a, b) => `#${new THREE.Color(a).lerp(new THREE.Color(b), n).getHexString()}`;
      const grad = g.createLinearGradient(0, 0, 0, c.height);
      grad.addColorStop(0, mix(0x7fb6e6, 0x0e1430));
      grad.addColorStop(0.6, mix(0xbcdcef, 0x24305a));
      grad.addColorStop(1, mix(0xfbe6c4, 0x4a3a5a));
      g.fillStyle = grad;
      g.fillRect(0, 0, c.width, c.height);
      this.scene.background.needsUpdate = true;
    }
  }

  // Sleeping in the bed: jump to the evening, or to the next morning.
  sleep() {
    const toNight = (this.night ?? 0) < 0.5;
    this.dayTime = (toNight ? 0.67 : 0.01) * 420;
    this._skyT = 1;
    return toNight ? 'night' : 'day';
  }

  // Objects that can't be held appear in the world instead.
  spawnTrophy(id) {
    if (id === 'boat' && !this.boat) {
      this.boat = buildBoat();
      this.boat.position.set(-16, 0.05, -16);
      this.scene.add(this.boat);
    } else if (id === 'house' && !this.cabin) {
      this.cabin = buildCabin();
      this.cabin.position.set(6.5, 0, -2.8);
      this.cabin.rotation.y = -0.4;
      this.scene.add(this.cabin);
      this.collidables.push({ x: 6.5, z: -2.8, r: 1.2 });
    }
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
    this._onPointer = (e) => this._onPointerDown(e);
    this.renderer.domElement.addEventListener('pointerdown', this._onPointer);
  }

  setJoystick(x, y) {
    this.joystick.x = x;
    this.joystick.y = y;
    this.joystick.active = x !== 0 || y !== 0;
  }

  // Merge static meshes by material to cut draw calls (big win on older iPads).
  _optimizeStatic() {
    for (const f of this.kit.flames) f.mesh.userData.dynamic = true;
    for (const i of this.interactables) if (i.mesh) i.mesh.userData.dynamic = true;
    let removed = 0;
    for (const h of this.houses) {
      for (const t of h.cutTargets) {
        t.body.userData.dynamic = true;
        t.decor.userData.dynamic = true;
        removed += mergeStatic(t.body) + mergeStatic(t.decor);
      }
      h.roof.group.userData.dynamic = true;
      removed += mergeStatic(h.roof.group);
    }
    removed += mergeStatic(this.scene);
    this.mergedMeshes = removed;
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

  _checkCollision(x, z, o) {
    const onWalk = this.walkways?.length && this._walkwayAt(x, z);
    for (const c of this.collidables) {
      if (c.water && (onWalk || o?.swim)) continue;
      if (c.rect) { if (x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1) return true; continue; }
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
    // While a word is being spelled (or someone is talking) nobody moves, not even on horseback.
    if (this.inputLocked) { this.autoWalk = null; }
    else if (this.joystick.active) {
      mx = this.joystick.x;
      mz = -this.joystick.y;
    } else if (!this.inputLocked) {
      if (this.keys['w'] || this.keys['arrowup']) mz -= 1;
      if (this.keys['s'] || this.keys['arrowdown']) mz += 1;
      if (this.keys['a'] || this.keys['arrowleft']) mx -= 1;
      if (this.keys['d'] || this.keys['arrowright']) mx += 1;
    }

    let len = Math.hypot(mx, mz);
    if (len > 0) {
      this.autoWalk = null; // manual control cancels walking to a tapped object
      mx /= len; mz /= len;
      // Input is screen-relative: rotate it by the camera yaw so "up" walks away from the camera.
      const cy = Math.cos(CAM_YAW);
      const sy = Math.sin(CAM_YAW);
      const wx = mx * cy + mz * sy;
      const wz = -mx * sy + mz * cy;
      mx = wx; mz = wz;
    } else if (this.autoWalk && !this.inputLocked) {
      // Walk on our own towards a tapped object, then interact with it.
      const aw = this.autoWalk;
      const dx = aw.target.worldPos.x - this.player.position.x;
      const dz = aw.target.worldPos.z - this.player.position.z;
      const dist = Math.hypot(dx, dz);
      aw.time += dt;
      if (dist < aw.reach) {
        this.autoWalk = null;
        this.player.rotation.y = Math.atan2(dx, dz);
        this.onInteractObject?.(aw.target);
      } else if (aw.time > 7) {
        this.autoWalk = null;
      } else {
        mx = dx / dist; mz = dz / dist; len = 1;
      }
    }
    if (len > 0) {
      const pw = this.power, speed = PLAYER_SPEED * (this.speedBoostUntil > this.clock.elapsedTime ? 1.6 : 1) * (this.horses?.riding ? RIDE.speed : 1) * (pw === 'speed' ? 1.8 : pw === 'giant' ? 1.5 : pw === 'glide' && !this.onGround ? 1.5 : 1);
      const p = this.player.position;
      const nx = p.x + mx * speed * dt;
      const nz = p.z + mz * speed * dt;
      const before = p.clone();
      // Already inside an obstacle (landed there from the sky): free to walk out.
      const stuck = this._checkCollision(p.x, p.z);
      if (!this._blocked(nx, p.z, p.y, stuck)) p.x = nx;
      if (!this._blocked(p.x, nz, p.y, stuck)) p.z = nz;
      // Near a magic bridge, gently pull the hero onto its axis (easy to cross with the joystick).
      for (const w of this.walkways ?? []) {
        if (w.circle || w.box || w.axis === 'z' || p.x < w.x0 - 1.4 || p.x > w.x1 + 1.4 || Math.abs(p.z - w.z) > 1.4) continue;
        const nzw = p.z + (w.z - p.z) * Math.min(1, dt * 7);
        if (!this._blocked(p.x, nzw, p.y)) p.z = nzw;
      }
      // Stuck while auto-walking (wall in the way): give up.
      if (this.autoWalk && before.distanceToSquared(p) < 1e-6) this.autoWalk.stuck = (this.autoWalk.stuck ?? 0) + dt;
      if (this.autoWalk?.stuck > 0.6) this.autoWalk = null;

      // Face direction
      const targetAngle = Math.atan2(mx, mz);
      this.player.rotation.y = this._lerpAngle(this.player.rotation.y, targetAngle, 0.15);
      this.player.userData.isMoving = true;
      const stepBefore = Math.floor(this.player.userData.walkPhase / Math.PI);
      this.player.userData.walkPhase += dt * 8;
      if (Math.floor(this.player.userData.walkPhase / Math.PI) !== stepBefore && this.onGround) {
        const inside = this.activeHouse && this.interiorFactor > 0.5;
        const onPath = (this.village.paths ?? []).some((q) => Math.abs(this.player.position.x - q.x) < q.w / 2 && Math.abs(this.player.position.z - q.z) < q.d / 2);
        this.onStep?.(inside ? 'wood' : this.player.position.y > 0.2 ? 'stone' : onPath ? 'dirt' : 'grass');
      }
    } else {
      this.player.userData.isMoving = false;
    }


    // Gravity, jumping and stepping up terraces.
    {
      const p = this.player.position;
      this.playerVY = (this.playerVY ?? 0) - 24 * dt;
      if (this.power === 'glide' && this.playerVY < -2.4) this.playerVY = -2.4; // gliding (J5)
      p.y += this.playerVY * dt;
      // The clouds (J5) carry the hero only from above (groundAt with the hero's height).
      const ground = this.groundAt(p.x, p.z, p.y);
      if (p.y <= ground) {
        if (this.playerVY < -13) this.onBigLanding?.(this.playerVY);
        p.y = ground;
        this.playerVY = 0;
        this.onGround = true;
      } else {
        this.onGround = p.y - ground < 0.02;
      }
      if (this.onGround) this.lastGroundAt = this.clock.elapsedTime;
    }

    // Companions follow
    for (const c of this.companions) {
      c.target.copy(this.player.position).add(c.offset);
      const dx = c.target.x - c.mesh.position.x;
      const dz = c.target.z - c.mesh.position.z;
      let dist = Math.hypot(dx, dz);
      // A companion stuck behind a wall catches up by appearing next to the hero.
      if (dist > 5) {
        const p = this.player.position;
        const back = new THREE.Vector3(Math.sin(this.player.rotation.y), 0, Math.cos(this.player.rotation.y)).multiplyScalar(-0.9);
        const side = c.offset.x > 0 ? 0.6 : -0.6;
        const tx = p.x + back.x + side * Math.cos(this.player.rotation.y);
        const tz = p.z + back.z - side * Math.sin(this.player.rotation.y);
        if (!this._checkCollision(tx, tz)) { c.mesh.position.set(tx, p.y, tz); }
        else { c.mesh.position.set(p.x + back.x * 0.5, p.y, p.z + back.z * 0.5); }
        this.particleBurst(new THREE.Vector3(c.mesh.position.x, 0.8, c.mesh.position.z), '#ffffff', 8);
        dist = 0;
      }
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
      const gy = this.terrain.heightAt(c.mesh.position.x, c.mesh.position.z);
      c.mesh.position.y += (gy - c.mesh.position.y) * Math.min(1, dt * 12);
    }
  }

  // Player-only blocking: obstacles plus terrain steps too high to walk up.
  _blocked(x, z, y, stuck = false) {
    if (Math.hypot(x, z) > WORLD_RADIUS) return true; // edge of the world
    if (this.marshMist && x > MIST_X - 1.2 && x < MIST_X + 6) return true; // the mist (Wind spell)
    // High up in the sky (clouds, gliding), trees and walls are far below.
    const high = y !== undefined && y - this.terrain.heightAt(x, z) > 4;
    if (!stuck && !high && this._checkCollision(x, z)) return true;
    if (this.horses?.riding && this._insideAnyHouse(x, z, 0.4)) return true; // no horses indoors
    return this.groundAt(x, z) - y > STEP_UP;
  }

  // Bridges built by magic: walkable strips over the water, with their own height.
  _walkwayAt(x, z, y) {
    for (const w of this.walkways ?? []) {
      if (w.cloud && (y === undefined || y < w.h - 0.7)) continue;
      if (w.box ? x > w.x0 && x < w.x1 && z > w.z0 && z < w.z1 : w.circle ? Math.hypot(x - w.x, z - w.z) < w.r : w.axis === 'z' ? Math.abs(x - w.x) < w.hw && z > Math.min(w.z0, w.z1) && z < Math.max(w.z0, w.z1) : x > w.x0 && x < w.x1 && Math.abs(z - w.z) < w.hw) return w;
    }
    return null;
  }
  groundAt(x, z, y) {
    const w = this._walkwayAt(x, z, y);
    const t = this.terrain.heightAt(x, z);
    return w ? Math.max(t, w.y(x, z)) : t;
  }

  // Back to the fountain, with the companions.
  resetPosition() {
    this.autoWalk = null;
    this.playerVY = 0;
    this.player.position.set(0, 0, 4.2);
    this.player.rotation.y = 0;
    for (const c of this.companions) c.mesh.position.set(c.offset.x, 0, 4.2 + c.offset.z);
    this.particleBurst(new THREE.Vector3(0, 1, 4.2), '#ffffff', 20);
  }

  jump() {
    // A little forgiveness: a jump still works just after walking off an edge.
    if (!this.onGround && this.clock.elapsedTime - (this.lastGroundAt ?? -9) > 0.18) return false;
    this.playerVY = this.horses?.riding ? RIDE.jump : this.power === 'jump' || this.power === 'glide' ? 15 : this.power === 'giant' ? 10.5 : 8.2;
    this.onGround = false;
    this.onJump?.();
    return true;
  }

  // Tap/click on an object in the 3D view: walk to it, then interact.
  _onPointerDown(event) {
    if (!this.onInteractObject) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster ??= new THREE.Raycaster();
    this.raycaster.setFromCamera(ndc, this.camera);
    const targets = this.interactables.filter((i) => i.hit && this.isAvailable(i)).map((i) => i.hit);
    const hits = this.raycaster.intersectObjects(targets, false);
    if (!hits.length) return;
    const obj = hits[0].object.userData.interactable;
    const d = Math.hypot(obj.worldPos.x - this.player.position.x, obj.worldPos.z - this.player.position.z);
    const reach = obj.reach ?? 1.8;
    if (d < reach + 0.3) {
      this.player.rotation.y = Math.atan2(obj.worldPos.x - this.player.position.x, obj.worldPos.z - this.player.position.z);
      this.onInteractObject(obj);
    } else {
      this.autoWalk = { target: obj, reach, time: 0 };
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
    // Portrait screens see less width: step back a little.
    const portrait = this.camera.aspect < 1 ? 1.3 : 1;
    const dist = lerp(19, h ? Math.max(h.w, h.d) * 1.15 + 1.5 : 16, f) * portrait;
    const elev = lerp(0.92, 0.98, f);
    const k = 1 - Math.pow(0.001, dt);
    this.camTarget.x += (tx - this.camTarget.x) * k;
    this.camTarget.z += (tz - this.camTarget.z) * k;
    this.camTarget.y += (this.player.position.y + 0.6 - this.camTarget.y) * k;
    const horiz = Math.cos(elev) * dist;
    const gx = this.camTarget.x + Math.sin(CAM_YAW) * horiz, gz = this.camTarget.z + Math.cos(CAM_YAW) * horiz;
    // Height above the hero, and always well above the ground under the camera and on the way to
    // the hero (near the edge of the world the hills used to swallow the camera).
    let gy = Math.max(0, this.camTarget.y - 0.6) + Math.sin(elev) * dist;
    if (!h) for (const k2 of [1, 0.7, 0.45]) gy = Math.max(gy, this.groundAt(lerp(this.camTarget.x, gx, k2), lerp(this.camTarget.z, gz, k2)) + 3 + 6 * k2);
    const goal = new THREE.Vector3(gx, gy, gz);
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
    const nightK = this.night ?? 0;
    this.ambient.intensity = this.lightBase.ambient * lerp(1, 0.6, f) * (1 - 0.5 * nightK);
    this.hemi.intensity = this.lightBase.hemi * lerp(1, 0.5, f) * (1 - 0.6 * nightK);
    this.sun.intensity = this.lightBase.sun * lerp(1, 0.55, f) * (1 - 0.78 * nightK);
  }

  // ===== INTERACTION =====

  isAvailable(obj) {
    return obj.active && (!obj.nightOnly || this.night > 0.5);
  }

  _updateInteractables() {
    this.nearbyInteractable = null;
    const t = this.clock.elapsedTime;
    let minDist = Infinity;
    const p = this.player.position;
    for (const obj of this.interactables) {
      if (obj.nightOnly) {
        const show = obj.active && this.night > 0.5;
        obj.block.visible = show;
        obj.iconHolder.visible = show;
        if (!show) { if (obj.labelEl) obj.labelEl.style.display = 'none'; if (obj.active) continue; }
      }
      if (!obj.active) {
        if (obj.labelEl) obj.labelEl.style.display = 'none';
        if (t > obj.respawnAt) {
          obj.active = true;
          obj.iconHolder.visible = true;
          if (obj.block) { obj.block.visible = true; obj.block.scale.setScalar(0.01); }
          if (obj.chest) obj.chest.userData.lid.rotation.x = 0;
        }
        continue;
      }
      if (obj.block && obj.block.scale.x < 1) obj.block.scale.setScalar(Math.min(1, obj.block.scale.x + 0.04));
      // Spin and bob the icon; the hit target follows it.
      const holder = obj.iconHolder;
      holder.rotation.y = t * 1.6 + obj.worldPos.x;
      holder.position.y = obj.worldPos.y + obj.iconY + Math.sin(t * 2.2 + obj.worldPos.z) * 0.12;
      if (obj.labelEl) this._placeLabel(obj, holder.position);
      const dist = Math.hypot(obj.worldPos.x - p.x, obj.worldPos.z - p.z);
      const near = dist < obj.reach;
      // Scenery rocks and bushes only show their icon and name when you're close.
      const shown = obj.decor ? dist < 5 : dist < 24;
      holder.visible = obj.decor ? shown : true;
      if (obj.labelEl && !shown) { obj.labelEl.style.display = 'none'; if (near && dist < minDist) { minDist = dist; this.nearbyInteractable = obj; } continue; }
      holder.scale.setScalar(holder.scale.x + ((near ? 1.3 : 1) - holder.scale.x) * 0.15);
      if (near && dist < minDist) { minDist = dist; this.nearbyInteractable = obj; }
      if (obj.labelEl) obj.labelEl.classList.toggle('is-near', near);
      if (obj.glow) obj.glow.emissiveIntensity = 0.6 + Math.sin(t * 3) * 0.3;
    }
  }

  _placeLabel(obj, pos) {
    const v = (this._tmpV ??= new THREE.Vector3()).set(pos.x, pos.y - 0.95, pos.z).project(this.camera);
    const el = obj.labelEl;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (v.z > 1 || v.x < -1.1 || v.x > 1.1 || v.y < -1.1 || v.y > 1.1) { el.style.display = 'none'; return; }
    // Far-away labels shrink and fade a little so the screen stays readable.
    const d = Math.hypot(obj.worldPos.x - this.player.position.x, obj.worldPos.z - this.player.position.z);
    const s = Math.max(0.7, Math.min(1.1, 1.2 - d / 40)) * (obj.labelEl.classList.contains('is-near') ? 1.15 : 1);
    el.style.display = '';
    el.style.opacity = d > 26 ? '0.75' : '1';
    el.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px) translate(-50%, -50%) scale(${s.toFixed(2)})`;
  }

  // Minimap: north turned to match the camera, centred on the hero.
  drawMinimap(canvas) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const R = 34; // world units from centre to edge
    if (!this._mapBg) this._mapBg = this._buildMinimapBackground();
    const bg = this._mapBg;
    const p = this.player.position;
    ctx.save();
    ctx.clearRect(0, 0, W, W);
    ctx.beginPath(); ctx.arc(W / 2, W / 2, W / 2, 0, Math.PI * 2); ctx.clip();
    ctx.translate(W / 2, W / 2);
    ctx.rotate(CAM_YAW); // camera forward points up on the map
    const k = (W / 2) / R;
    ctx.scale(k, k);
    ctx.translate(-p.x, -p.z);
    ctx.drawImage(bg.canvas, -bg.half, -bg.half, bg.half * 2, bg.half * 2);
    // Things to mine (active ones only).
    const colors = { spell: '#b08aff', iron: '#e8c49a', diamond: '#5af0e6', obsidian: '#9a6aff', wood: '#a0703a', wheat: '#f2d060', flower: '#ff7ab0', water: '#6ac0ff', crystal: '#c08aff', fire: '#ff8a3a', stone: '#c8c4be', cloth: '#ffffff' };
    for (const o of this.interactables) {
      if (!o.active) continue;
      ctx.fillStyle = colors[o.material] ?? '#ffd36a';
      ctx.beginPath(); ctx.arc(o.worldPos.x, o.worldPos.z, o.kind === 'house' ? 0.9 : 1.1, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 0.3; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.stroke();
    }
    for (const c of this.companions) {
      ctx.fillStyle = '#ffe9b0';
      ctx.beginPath(); ctx.arc(c.mesh.position.x, c.mesh.position.z, 0.7, 0, Math.PI * 2); ctx.fill();
    }
    // Named pins (the bed…): drawn upright, kept on the rim when out of range so they can be found.
    const pins = (this.mapPins ?? []).map((pin) => {
      const dx = pin.x - p.x, dz = pin.z - p.z;
      const c = Math.cos(CAM_YAW), s = Math.sin(CAM_YAW);
      let sx = (dx * c - dz * s) * k, sy = (dx * s + dz * c) * k;
      const lim = W / 2 - 14, d = Math.hypot(sx, sy);
      const out = d > lim;
      if (out) { sx *= lim / d; sy *= lim / d; }
      return { ...pin, sx: W / 2 + sx, sy: W / 2 + sy, out, ang: Math.atan2(sy, sx) };
    });
    // Hero arrow.
    ctx.translate(p.x, p.z);
    ctx.rotate(-this.player.rotation.y);
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#1f2a44'; ctx.lineWidth = 0.4;
    ctx.beginPath(); ctx.moveTo(0, 2.2); ctx.lineTo(1.4, -1.4); ctx.lineTo(0, -0.6); ctx.lineTo(-1.4, -1.4); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
    // The next step of the quest: a big golden arrow from the hero towards it (pulsing).
    const quest = pins.find((pin) => pin.quest);
    if (quest) {
      const pulse = 1 + Math.sin(performance.now() / 220) * 0.12;
      const L = Math.min(W * 0.36, Math.hypot(quest.sx - W / 2, quest.sy - W / 2) - W * 0.06);
      if (L > W * 0.08) {
        ctx.save();
        ctx.translate(W / 2, W / 2);
        ctx.rotate(quest.ang);
        ctx.fillStyle = '#ffd34a'; ctx.strokeStyle = '#7a4a00'; ctx.lineWidth = 2;
        const hw = W * 0.065 * pulse;
        ctx.beginPath();
        ctx.moveTo(W * 0.07, -hw * 0.4); ctx.lineTo(L - hw * 1.6, -hw * 0.4); ctx.lineTo(L - hw * 1.6, -hw); ctx.lineTo(L, 0);
        ctx.lineTo(L - hw * 1.6, hw); ctx.lineTo(L - hw * 1.6, hw * 0.4); ctx.lineTo(W * 0.07, hw * 0.4); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      if (!quest.out) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 211, 74, 0.9)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(quest.sx, quest.sy, W * 0.09 * pulse, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
    }
    for (const pin of pins) {
      const fs = Math.round(W * 0.075);
      ctx.save();
      ctx.font = `700 ${fs}px system-ui, sans-serif`;
      const tw = ctx.measureText(pin.text).width + fs * 0.8;
      const x = Math.min(Math.max(pin.sx, tw / 2 + 2), W - tw / 2 - 2), y = pin.sy;
      ctx.fillStyle = 'rgba(31, 42, 68, 0.85)';
      ctx.beginPath(); ctx.roundRect(x - tw / 2, y - fs * 0.75, tw, fs * 1.5, fs * 0.75); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(pin.text, x, y + 1);
      ctx.restore();
    }
  }

  _buildMinimapBackground() {
    const half = 90;
    const px = 3; // pixels per world unit
    const c = document.createElement('canvas');
    c.width = c.height = half * 2 * px;
    const g = c.getContext('2d');
    g.scale(px, px);
    g.translate(half, half);
    // Terrain shading by height.
    for (let x = -half; x < half; x++) {
      for (let z = -half; z < half; z++) {
        const h = this.terrain.heightAt(x + 0.5, z + 0.5);
        const l = 34 + Math.min(18, h * 4);
        const hue = x < -42 ? 125 : x > 42 ? 70 : 100;
        g.fillStyle = Math.hypot(x - 22, z + 22) < 9 && h > 0.4 ? `hsl(30, 6%, ${l + 10}%)` : `hsl(${hue}, 38%, ${x < -42 ? l - 8 : l}%)`;
        g.fillRect(x, z, 1, 1);
      }
    }
    for (const pth of this.village.paths ?? []) {
      g.fillStyle = '#b8945e';
      g.fillRect(pth.x - pth.w / 2, pth.z - pth.d / 2, pth.w, pth.d);
    }
    g.fillStyle = '#4a9ad8';
    g.beginPath(); g.arc(-16, -16, 3.2, 0, Math.PI * 2); g.fill();
    // Regions: the river, the marsh pools and boardwalk, the forester's cabin.
    g.fillRect(-60.2, -half, 4.4, half * 2);
    g.fillStyle = '#3a6a5a';
    for (const c of this.collidables) if (c.water && !c.rect && c.x > 40) { g.beginPath(); g.arc(c.x, c.z, c.r, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#a07a4a';
    g.fillRect(BOARDWALK.x0, BOARDWALK.z - BOARDWALK.hw, BOARDWALK.x1 - BOARDWALK.x0, BOARDWALK.hw * 2);
    g.fillRect(-70 - 2.2, -6 - 1.8, 4.4, 3.6);
    g.beginPath(); g.arc(0, 0, 1.6, 0, Math.PI * 2); g.fill();
    const roofs = { tavern: '#3f7a44', forge: '#4a4e58', shop: '#3e5f98', tower: '#6a4aa8', cottage: '#c9a24a', guild: '#6a4428' };
    for (const h of this.houses) {
      g.fillStyle = roofs[h.type] ?? '#a8402e';
      g.fillRect(h.center.x - h.w / 2, h.center.z - h.d / 2, h.w, h.d);
      g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 0.3;
      g.strokeRect(h.center.x - h.w / 2, h.center.z - h.d / 2, h.w, h.d);
    }
    return { canvas: c, half };
  }

  getNearbyInteractable() {
    return this.nearbyInteractable;
  }

  // ===== PARTICLES =====

  particleBurst(worldPos, color, count = 25) {
    const c = new THREE.Color(color);
    for (let i = 0; i < count; i++) {
      // Little voxel cubes (shared geometry, one cheap material each for the fade-out).
      this.particleGeo ??= new THREE.BoxGeometry(0.12, 0.12, 0.12);
      const mat = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 1 });
      const p = new THREE.Mesh(this.particleGeo, mat);
      p.rotation.set(Math.random() * 3, Math.random() * 3, 0);
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

  worldToScreen(v) {
    const vec = v.clone().project(this.camera);
    const rect = this.container.getBoundingClientRect();
    return { x: ((vec.x + 1) / 2) * rect.width + rect.left, y: ((-vec.y + 1) / 2) * rect.height + rect.top };
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
    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05);
    if (this.mode === 'paused') return; // a page covers the world: don't spend battery
    if (this.fpsEl) {
      this._fps.n++;
      const now = performance.now();
      if (now - this._fps.t > 1000) {
        const info = this.renderer.info.render;
        this.fpsEl.textContent = `${Math.round((this._fps.n * 1000) / (now - this._fps.t))} fps · q${this.quality.level} · ${info.calls} calls`;
        this._fps = { n: 0, t: now };
      }
    }
    this.quality?.tick(rawDt);
    const elapsed = this.clock.elapsedTime;

    this._updateDayNight(dt);
    this._tickMagic(dt, elapsed);
    this._tickStory(dt, elapsed);
    this._tickRegions();
    this._tickEruptions(dt); this._tickPlaces(dt, elapsed); this._tickFireflies(elapsed); if (this.mode === 'play') { this.fauna?.update(dt, elapsed); this.horses?.update(dt, elapsed); this.golem?.update(dt, elapsed); this.jumpChest?.update(dt); this.cocotte?.update(dt); this.flame?.update(dt); this.albumStand?.update(dt); this.powers?.update(dt); this.copper?.update(dt); } this.bosses?.update(dt, elapsed); if (this.mode === 'play') this.pet?.update(dt, elapsed); if (this.mode === 'play') this.zombies?.update(dt, elapsed);
    if (this.tweens?.length) this.tweens = this.tweens.filter((f) => f(elapsed));
    if (this.bobber) {
      const bb = this.bobber;
      bb.dip = Math.max(0, bb.dip - dt * 1.5);
      bb.mesh.position.y = 0.08 + Math.sin(elapsed * 3) * 0.02 - bb.dip * 0.12;
    }
    if (this.mode === 'play') {
      this._updatePlayer(dt);
      this._updateCamera(dt);
    } else {
      // Title screen: slow orbit around the village at dusk.
      const a = elapsed * 0.05;
      this.camera.position.set(Math.sin(a) * 27, 16, Math.cos(a) * 27);
      this.camera.lookAt(0, 1.5, 0);
    }
    if (this.mode === 'play' && this.minimapCanvas && (this._mapT = (this._mapT ?? 0) + dt) > 0.12) {
      this._mapT = 0;
      this.drawMinimap(this.minimapCanvas);
    }
    this._updateCutaway(dt);
    this._updateInteractables();

    // NPC idle bob
    this.village?.update(elapsed);
    // Character limbs (walk cycle, idle, item actions).
    for (const ch of this.characters ?? []) animateCharacter(ch, dt, elapsed);
    for (const fl of this.heldFlames ?? []) {
      if (fl.spin) { fl.mesh.rotation.y += dt * 3; continue; }
      const n = Math.sin(elapsed * fl.speed + fl.phase);
      fl.mesh.scale.y = fl.base.y * (1 + n * 0.2);
    }
    const torchAnchor = this.heldItem?.userData.light;
    if (torchAnchor) {
      torchAnchor.getWorldPosition(this.torchLight.position);
      const magic = torchAnchor.userData.color;
      this.torchLight.color.setHex(magic ?? 0xff9a40);
      this.torchLight.intensity = (magic ? 5 : 4) * (torchAnchor.userData.boost ?? 1) * (1 + Math.sin(elapsed * (magic ? 3 : 13)) * 0.12);
    } else this.torchLight.intensity = 0;
    if (this.growing?.length) {
      for (const f of this.growing) f.scale.setScalar(Math.min(1, f.scale.x + dt * 2.5));
      this.growing = this.growing.filter((f) => f.scale.x < 1);
    }
    if (this.boat) {
      this.boat.position.y = 0.05 + Math.sin(elapsed * 1.6) * 0.05;
      this.boat.rotation.z = Math.sin(elapsed * 1.2) * 0.05;
      this.boat.rotation.y = elapsed * 0.15;
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
      l.current = l.base * (1 + n * l.amp) * (l.houseFactor ?? 1) * (l.light.userData.night ? (this.night ?? 0) : 1);
    }
    this.lightPool.update(this.kit.lights, this.camTarget);

    // Water shimmer
    for (const m of this.waterMats) m.opacity = 0.65 + Math.sin(elapsed * 2) * 0.08;

    // Tests that only check the game's logic skip drawing (?norender): one frame a second is drawn.
    if (this.noRender && (this._skipN = (this._skipN ?? 0) + 1) % 60) { this.scene.updateMatrixWorld(); this.camera.updateMatrixWorld(); return; }
    if (this.quality?.current.bloom) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
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
