import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const TILE = 2;
const PLAYER_SPEED = 4.5;
const COMPANION_SPEED = 4.0;
const PLAYER_RADIUS = 0.35;
const WALL_HEIGHT = 2.4;
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
    this.fadeTargets = [];
    this.fireMeshes = [];

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
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 200);
    this.camera.position.set(0, 16, 14);
    this.camera.lookAt(0, 0, -1);
  }

  _initLights() {
    const ambient = new THREE.AmbientLight(0xd7e7ef, 0.72);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffe1b2, 1.35);
    sun.position.set(15, 25, 10);
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

    const hemi = new THREE.HemisphereLight(0xb0d0ff, 0x4a6a3a, 0.3);
    this.scene.add(hemi);
  }

  // ===== WORLD BUILDING =====

  _initWorld() {
    this._buildGround();
    this._buildPaths();
    this._buildTrees();
    this._buildFlowers();
    this._buildPond();
    this._buildFountain();

    // Buildings — placed around the village, doors face +Z (toward camera)
    this._buildHouse(-10, -6, 0, 'blacksmith', 7, 5, 5, COLORS.roof, 'forge');
    this._buildHouse(8, -8, 0, 'shop', 7, 5, 5, COLORS.roofBlue, 'shop');
    this._buildHouse(-12, 8, 0, 'tavern', 9, 5, 6, COLORS.roofGreen, 'tavern');
    this._buildHouse(12, 6, 0, 'tower', 5, 8, 4, 0x5544aa, 'tower');
    this._buildHouse(0, 14, 0, 'cottage', 6, 4, 4, COLORS.roof, 'cottage');
    this._buildHouse(-2, -14, 0, 'guild', 8, 5, 5, 0x6a4a2a, 'guild');
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
      [-18, -10], [-20, 5], [-22, -2], [18, -12], [20, 8], [22, -4],
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

  _buildHouse(x, z, rotation, name, w, h, d, roofColor, type) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    group.userData.houseBounds = { x, z, w, d, rotation };

    const halfW = w / 2;
    const halfD = d / 2;

    // Floor
    const floorGeo = new THREE.BoxGeometry(w, 0.1, d);
    const floorMat = new THREE.MeshStandardMaterial({ color: COLORS.wood, roughness: 0.8 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = 0.05;
    floor.receiveShadow = true;
    group.add(floor);

    // Individual floor boards give the interiors the warm, hand-built look of a tavern.
    const boardMat = new THREE.MeshStandardMaterial({ color: 0xa77a4b, roughness: 0.9 });
    const boardCount = Math.max(4, Math.floor(d));
    for (let i = 0; i < boardCount; i++) {
      const boardGeo = new THREE.BoxGeometry(w - 0.18, 0.035, 0.035);
      const board = new THREE.Mesh(boardGeo, boardMat);
      board.position.set(0, 0.12, -halfD + 0.18 + i * ((d - 0.36) / (boardCount - 1)));
      board.receiveShadow = true;
      group.add(board);
    }

    // Walls — each wall is tracked for transparency
    const wallMat = new THREE.MeshStandardMaterial({ color: COLORS.wall, roughness: 0.85, side: THREE.DoubleSide });
    const walls = [];

    // Back wall (south, -Z — the side facing away from camera)
    const backWall = this._makeWall(w, WALL_HEIGHT, wallMat);
    backWall.position.set(0, WALL_HEIGHT / 2, -halfD);
    group.add(backWall);
    walls.push({ mesh: backWall, isBack: true });

    // Left wall
    const leftWall = this._makeWall(d, WALL_HEIGHT, wallMat);
    leftWall.position.set(-halfW, WALL_HEIGHT / 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    group.add(leftWall);
    walls.push({ mesh: leftWall, isBack: false });

    // Right wall
    const rightWall = this._makeWall(d, WALL_HEIGHT, wallMat);
    rightWall.position.set(halfW, WALL_HEIGHT / 2, 0);
    rightWall.rotation.y = Math.PI / 2;
    group.add(rightWall);
    walls.push({ mesh: rightWall, isBack: false });

    // Front wall with door gap (on +Z side, facing the camera)
    const doorWidth = 1.2;
    const segWidth = (w - doorWidth) / 2;
    const frontLeft = this._makeWall(segWidth, WALL_HEIGHT, wallMat);
    frontLeft.position.set(-(doorWidth / 2 + segWidth / 2), WALL_HEIGHT / 2, halfD);
    group.add(frontLeft);
    walls.push({ mesh: frontLeft, isBack: false });

    const frontRight = this._makeWall(segWidth, WALL_HEIGHT, wallMat);
    frontRight.position.set(doorWidth / 2 + segWidth / 2, WALL_HEIGHT / 2, halfD);
    group.add(frontRight);
    walls.push({ mesh: frontRight, isBack: false });

    // Door (top piece)
    const doorTopGeo = new THREE.BoxGeometry(doorWidth, WALL_HEIGHT - 1.6, 0.08);
    const doorMat = new THREE.MeshStandardMaterial({ color: COLORS.door, roughness: 0.7 });
    const doorTop = new THREE.Mesh(doorTopGeo, doorMat);
    doorTop.position.set(0, 1.6 + (WALL_HEIGHT - 1.6) / 2, halfD);
    group.add(doorTop);

    // Windows
    const winMat = new THREE.MeshStandardMaterial({ color: COLORS.window, emissive: 0x224466, emissiveIntensity: 0.3, transparent: true, opacity: 0.7 });
    const winPositions = [
      { x: -halfW + 0.8, z: -halfD + 0.02, ry: 0, w: 1, h: 0.7 },
      { x: halfW - 0.8, z: -halfD + 0.02, ry: 0, w: 1, h: 0.7 },
      { x: -halfW + 0.8, z: halfD - 0.02, ry: 0, w: 1, h: 0.7 },
      { x: halfW - 0.8, z: halfD - 0.02, ry: 0, w: 1, h: 0.7 },
    ];
    for (const wp of winPositions) {
      const winGeo = new THREE.BoxGeometry(wp.w, wp.h, 0.05);
      const win = new THREE.Mesh(winGeo, winMat);
      win.position.set(wp.x, 1.3, wp.z);
      group.add(win);
    }

    // Roof
    const roofGeo = new THREE.ConeGeometry(Math.max(w, d) * 0.78, h - WALL_HEIGHT, 4);
    const roofMat = new THREE.MeshStandardMaterial({
      color: roofColor,
      roughness: 0.62,
      metalness: 0.05,
      emissive: new THREE.Color(roofColor).multiplyScalar(0.08),
      flatShading: true,
      side: THREE.DoubleSide,
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = WALL_HEIGHT + (h - WALL_HEIGHT) / 2;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    roof.renderOrder = 2;
    group.add(roof);
    walls.push({ mesh: roof, isRoof: true });

    const roofCapGeo = new THREE.CylinderGeometry(0.16, 0.22, 0.16, 6);
    const roofCapMat = new THREE.MeshStandardMaterial({ color: 0xf4c978, roughness: 0.45, emissive: 0x6b421c, emissiveIntensity: 0.25 });
    const roofCap = new THREE.Mesh(roofCapGeo, roofCapMat);
    roofCap.position.y = h;
    roofCap.castShadow = true;
    group.add(roofCap);

    const eaveMat = new THREE.MeshStandardMaterial({ color: 0x4c3025, roughness: 0.82 });
    const eave = new THREE.Mesh(new THREE.BoxGeometry(w + 0.45, 0.14, d + 0.45), eaveMat);
    eave.position.y = WALL_HEIGHT - 0.05;
    eave.castShadow = true;
    group.add(eave);
    walls.push({ mesh: eave, isRoof: true });

    // For tower, add a second floor
    if (type === 'tower') {
      const upperRoofGeo = new THREE.ConeGeometry(w * 0.5, 1.5, 4);
      const upperRoof = new THREE.Mesh(upperRoofGeo, roofMat);
      upperRoof.position.y = h + 0.75;
      upperRoof.rotation.y = Math.PI / 4;
      group.add(upperRoof);
      upperRoof.renderOrder = 2;
      walls.push({ mesh: upperRoof, isRoof: true });

      const upperWalls = new THREE.BoxGeometry(w * 0.7, 1.5, d * 0.7);
      const upperWallMesh = new THREE.Mesh(upperWalls, wallMat);
      upperWallMesh.position.y = h - 0.25;
      group.add(upperWallMesh);
      walls.push({ mesh: upperWallMesh, isBack: true });

      // Add interior floor for second story
      const intFloorGeo = new THREE.BoxGeometry(w * 0.7, 0.08, d * 0.7);
      const intFloor = new THREE.Mesh(intFloorGeo, floorMat);
      intFloor.position.y = h - 1;
      group.add(intFloor);
    }

    // Warm interior light makes the building readable when the roof fades
    const interiorLight = new THREE.PointLight(0xffb45c, 1.35, Math.max(w, d) * 2.8, 2);
    interiorLight.position.set(0, 2.1, 0);
    group.add(interiorLight);

    const doorwayLight = new THREE.PointLight(0xff8a3d, 0.8, 4, 2);
    doorwayLight.position.set(0, 1.45, halfD + 0.25);
    group.add(doorwayLight);

    // Interior furniture based on type
    this._addFurniture(group, type, w, d, halfW, halfD);

    // Roof sign post outside (on the back/side, away from the door)
    this._addSign(group, name, -halfW - 0.3, -halfD - 0.3);

    // Mining spot inside
    const spotGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.15, 8);
    const spotMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff8800, emissiveIntensity: 0.5 });
    const spot = new THREE.Mesh(spotGeo, spotMat);
    spot.position.set(0, 0.18, 0);
    group.add(spot);
    this.interactables.push({
      mesh: spot,
      worldPos: new THREE.Vector3(x, 0.18, z),
      type: 'mine',
      name,
      houseType: type,
      glow: spotMat,
    });

    // Register walls for transparency — store house bounds for containment check
    for (const wall of walls) {
      this.fadeTargets.push({
        mesh: wall.mesh,
        houseGroup: group,
        houseCenter: new THREE.Vector3(x, 0, z),
        houseW: w,
        houseD: d,
        houseRotation: rotation,
        isRoof: wall.isRoof === true,
        isBack: wall.isBack,
      });
    }

    // Collision: wall segments only (not a full circle), so player can walk through the door
    const doorHalf = 0.6;
    this.collidables.push({ type: 'houseWall', x, z, rotation, halfW, halfD, doorHalf });

    this.scene.add(group);
    return group;
  }

  _makeWall(w, h, mat) {
    const geo = new THREE.BoxGeometry(w, h, 0.12);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  _addFurniture(group, type, w, d, halfW, halfD) {
    const woodMat = new THREE.MeshStandardMaterial({ color: COLORS.wood, roughness: 0.8 });
    const woodDarkMat = new THREE.MeshStandardMaterial({ color: COLORS.woodDark, roughness: 0.8 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: COLORS.stone, roughness: 0.7 });

    if (type === 'forge') {
      this._addFireplace(group, halfW, halfD, 1.4);
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
    } else if (type === 'tavern') {
      this._addFireplace(group, halfW, halfD, 1.8);
      this._addRug(group, 0, 0.12, 0x8f2e2e, 3.8, 2.5);
      this._addBarrels(group, halfW, halfD);
      // Tables
      for (let i = 0; i < 2; i++) {
        const tableGeo = new THREE.BoxGeometry(0.8, 0.05, 0.8);
        const table = new THREE.Mesh(tableGeo, woodMat);
        table.position.set(-1.5 + i * 2.5, 0.5, 0.5);
        table.castShadow = true;
        group.add(table);
        // Legs
        for (const lx of [-0.3, 0.3]) {
          for (const lz of [-0.3, 0.3]) {
            const legGeo = new THREE.BoxGeometry(0.08, 0.5, 0.08);
            const leg = new THREE.Mesh(legGeo, woodDarkMat);
            leg.position.set(-1.5 + i * 2.5 + lx, 0.25, 0.5 + lz);
            group.add(leg);
          }
        }
        // Chair
        const chairGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const chair = new THREE.Mesh(chairGeo, woodDarkMat);
        chair.position.set(-1.5 + i * 2.5, 0.15, 1.2);
        group.add(chair);
      }
      // Bar
      const barGeo = new THREE.BoxGeometry(2.8, 0.6, 0.4);
      const bar = new THREE.Mesh(barGeo, woodDarkMat);
      bar.position.set(0, 0.3, -2.1);
      bar.castShadow = true;
      group.add(bar);
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 0.35), woodMat);
      shelf.position.set(0, 1.5, -2.25);
      group.add(shelf);
      for (let i = 0; i < 5; i++) {
        const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.18, 8), new THREE.MeshStandardMaterial({ color: [0xe9c46a, 0xf4a261, 0xe76f51][i % 3] }));
        mug.position.set(-1.1 + i * 0.55, 1.65, -2.25);
        group.add(mug);
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

  _addFireplace(group, halfW, halfD, width) {
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x55443c, roughness: 0.95 });
    const sootMat = new THREE.MeshStandardMaterial({ color: 0x211c1b, roughness: 1 });
    const fireMat = new THREE.MeshStandardMaterial({ color: 0xff9d28, emissive: 0xff4b0b, emissiveIntensity: 2.2 });
    const hearth = new THREE.Mesh(new THREE.BoxGeometry(width + 0.5, 0.18, 0.8), stoneMat);
    hearth.position.set(0, 0.1, -halfD + 0.42);
    hearth.castShadow = true;
    group.add(hearth);
    const opening = new THREE.Mesh(new THREE.BoxGeometry(width, 1.15, 0.35), sootMat);
    opening.position.set(0, 0.72, -halfD + 0.28);
    group.add(opening);
    for (const x of [-width / 2 - 0.12, width / 2 + 0.12]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.45, 0.45), stoneMat);
      pillar.position.set(x, 0.78, -halfD + 0.28);
      pillar.castShadow = true;
      group.add(pillar);
    }
    const mantel = new THREE.Mesh(new THREE.BoxGeometry(width + 0.55, 0.2, 0.55), stoneMat);
    mantel.position.set(0, 1.52, -halfD + 0.28);
    mantel.castShadow = true;
    group.add(mantel);
    const fire = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.7, 7), fireMat);
    fire.position.set(0, 0.58, -halfD + 0.03);
    group.add(fire);
    const fireLight = new THREE.PointLight(0xff6b22, 2.2, 7, 2);
    fireLight.position.set(0, 0.9, -halfD + 0.1);
    group.add(fireLight);
    this.fireMeshes.push({ mesh: fire, light: fireLight, phase: Math.random() * Math.PI * 2 });
  }

  _addRug(group, x, y, color, width, depth) {
    const rugMat = new THREE.MeshStandardMaterial({ color, roughness: 1 });
    const rug = new THREE.Mesh(new THREE.BoxGeometry(width, 0.04, depth), rugMat);
    rug.position.set(x, y, 0.2);
    rug.receiveShadow = true;
    group.add(rug);
    const border = new THREE.Mesh(new THREE.BoxGeometry(width - 0.18, 0.045, depth - 0.18), new THREE.MeshStandardMaterial({ color: 0xd49a50, roughness: 1 }));
    border.position.set(x, y + 0.025, 0.2);
    group.add(border);
  }

  _addBarrels(group, halfW, halfD) {
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x70452b, roughness: 0.9 });
    const bandMat = new THREE.MeshStandardMaterial({ color: 0x33251e, roughness: 0.75 });
    for (const x of [-halfW + 0.55, halfW - 0.55]) {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.75, 10), barrelMat);
      barrel.position.set(x, 0.38, halfD - 0.75);
      barrel.castShadow = true;
      group.add(barrel);
      for (const y of [0.2, 0.55]) {
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.025, 6, 16), bandMat);
        band.rotation.x = Math.PI / 2;
        band.position.set(x, y, halfD - 0.75);
        group.add(band);
      }
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
    this.npcs = [];
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
    const px = this.player.position.x;
    const pz = this.player.position.z;
    const targetX = px;
    const targetY = 16;
    const targetZ = pz + 12;

    this.camera.position.x += (targetX - this.camera.position.x) * 0.08;
    this.camera.position.y += (targetY - this.camera.position.y) * 0.08;
    this.camera.position.z += (targetZ - this.camera.position.z) * 0.08;

    if (this.shakeIntensity > 0.001) {
      this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= this.shakeDecay;
    }

    this.camera.lookAt(px, 0.6, pz - 1.2);
  }

  // ===== WALL TRANSPARENCY =====

  _updateWallTransparency() {
    const playerPos = this.player.position;
    const activeHouses = new Set();

    for (const ft of this.fadeTargets) {
      const cosR = Math.cos(-ft.houseRotation);
      const sinR = Math.sin(-ft.houseRotation);
      const pdx = playerPos.x - ft.houseCenter.x;
      const pdz = playerPos.z - ft.houseCenter.z;
      const localX = pdx * cosR - pdz * sinR;
      const localZ = pdx * sinR + pdz * cosR;
      const halfW = ft.houseW / 2;
      const halfD = ft.houseD / 2;
      const isInside = Math.abs(localX) < halfW - 0.15 && Math.abs(localZ) < halfD - 0.15;
      const isAtDoor = Math.abs(localX) < 0.85 && localZ > halfD - 1.25 && localZ < halfD + 0.8;
      const shouldReveal = isInside || isAtDoor;

      if (shouldReveal) activeHouses.add(ft.houseGroup);

      const targetOpacity = shouldReveal ? (ft.isRoof ? 0.02 : 0.12) : 1.0;
      const mat = ft.mesh.material;
      if (targetOpacity < 1) {
        mat.transparent = true;
        mat.depthWrite = false;
        mat.needsUpdate = true;
      }
      mat.opacity += (targetOpacity - mat.opacity) * 0.2;
      if (mat.opacity > 0.99) {
        mat.transparent = false;
        mat.depthWrite = true;
        mat.opacity = 1;
        mat.needsUpdate = true;
      }
    }

    for (const ft of this.fadeTargets) {
      ft.houseGroup.userData.roofRevealed = activeHouses.has(ft.houseGroup);
    }
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
    this._updateWallTransparency();
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

    for (const fire of this.fireMeshes) {
      const pulse = 0.82 + Math.sin(elapsed * 11 + fire.phase) * 0.18;
      fire.mesh.scale.set(0.85 + pulse * 0.15, pulse, 0.85 + pulse * 0.15);
      fire.light.intensity = 1.7 + pulse * 0.8;
    }

    // Water shimmer
    if (this.scene) {
      this.scene.traverse((child) => {
        if (child.material && child.material.color && child.material.color.getHex() === COLORS.water && child.material.transparent) {
          child.material.opacity = 0.6 + Math.sin(elapsed * 2 + child.position.x) * 0.1;
        }
      });
    }

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
