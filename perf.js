import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Performance helpers so the village stays smooth on an older iPad (A10 GPU).

// ---------------------------------------------------------------------------
// 1. Static batching: merge every static mesh under `container` into one mesh per
//    material. Objects flagged `userData.dynamic` (and everything under them) are skipped,
//    so animated parts, cutaway walls and fading roofs keep working.
// ---------------------------------------------------------------------------
export function mergeStatic(container) {
  container.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(container.matrixWorld).invert();
  const buckets = new Map();

  const visit = (obj) => {
    for (const child of [...obj.children]) {
      if (child.userData.dynamic) continue;
      if (child.isMesh && !child.isInstancedMesh && !Array.isArray(child.material) && child.children.length === 0) {
        if (!child.visible) continue;
        const key = `${child.material.uuid}|${child.castShadow ? 1 : 0}|${child.receiveShadow ? 1 : 0}`;
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(child);
      } else if (!child.isMesh && !child.isLight && !child.isCamera) {
        visit(child);
      }
    }
  };
  visit(container);

  const m = new THREE.Matrix4();
  let removed = 0;
  for (const meshes of buckets.values()) {
    if (meshes.length < 2) continue;
    const geos = meshes.map((mesh) => {
      let g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
      for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      if (!g.attributes.normal) g.computeVertexNormals();
      g.clearGroups();
      m.multiplyMatrices(inv, mesh.matrixWorld);
      g.applyMatrix4(m);
      return g;
    });
    const merged = mergeGeometries(geos, false);
    geos.forEach((g) => g.dispose());
    if (!merged) continue;
    const first = meshes[0];
    const out = new THREE.Mesh(merged, first.material);
    out.castShadow = first.castShadow;
    out.receiveShadow = first.receiveShadow;
    out.name = 'merged';
    container.add(out);
    for (const mesh of meshes) mesh.parent.remove(mesh);
    removed += meshes.length - 1;
  }
  return removed;
}

// ---------------------------------------------------------------------------
// 2. Light pool: the scene has many "virtual" lights (fires, candles, lanterns) but only a
//    few real PointLights. Each frame the nearest virtual lights are copied onto them.
//    The real light count never changes, so shaders never recompile mid-game.
// ---------------------------------------------------------------------------
export class LightPool {
  constructor(scene, size = 4) {
    this.lights = [];
    for (let i = 0; i < size; i++) {
      const l = new THREE.PointLight(0xffffff, 0, 10, 1.5);
      scene.add(l);
      this.lights.push(l);
    }
    this.tmp = new THREE.Vector3();
  }

  // entries: [{ light: Object3D placeholder with userData.spec, current }]
  update(entries, focus) {
    const scored = [];
    for (const e of entries) {
      if (!e.light.parent) continue;
      if ((e.current ?? 1) < 0.05) continue; // switched off (e.g. street lamps by day)
      e.light.getWorldPosition(this.tmp);
      const d = this.tmp.distanceToSquared(focus) / Math.max(0.2, e.houseFactor ?? 1);
      scored.push({ e, d, pos: this.tmp.clone() });
    }
    scored.sort((a, b) => a.d - b.d);
    for (let i = 0; i < this.lights.length; i++) {
      const l = this.lights[i];
      const s = scored[i];
      if (!s) { l.intensity = 0; continue; }
      const spec = s.e.light.userData.spec;
      l.position.copy(s.pos);
      l.color.setHex(spec.color);
      l.distance = spec.distance;
      l.decay = spec.decay;
      l.intensity = s.e.current ?? spec.intensity;
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Adaptive quality: start lower on tablets, then step down if frames are slow.
// ---------------------------------------------------------------------------
export function isTouchDevice() {
  return /iPad|iPhone|Android/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
}

export class QualityManager {
  constructor(scene3D) {
    this.s = scene3D;
    const dpr = window.devicePixelRatio || 1;
    this.levels = [
      { pr: Math.min(dpr, 1.75), bloom: true, shadow: 2048 },
      { pr: Math.min(dpr, 1.35), bloom: true, shadow: 1024 },
      { pr: Math.min(dpr, 1.1), bloom: false, shadow: 1024 },
      { pr: 0.9, bloom: false, shadow: 1024 },
      { pr: 0.75, bloom: false, shadow: 512 },
    ];
    const forced = new URLSearchParams(location.search).get('quality');
    this.locked = forced !== null;
    this.level = this.locked ? Math.max(0, Math.min(this.levels.length - 1, Number(forced))) : (isTouchDevice() ? 1 : 0);
    this.samples = [];
    this.warmup = 2.5;
    this.apply();
  }

  get current() { return this.levels[this.level]; }

  apply() {
    const q = this.current;
    const { renderer, composer, sun } = this.s;
    renderer.setPixelRatio(q.pr);
    composer?.setPixelRatio(q.pr);
    this.s.resize?.();
    if (sun && sun.shadow.mapSize.x !== q.shadow) {
      sun.shadow.mapSize.set(q.shadow, q.shadow);
      sun.shadow.map?.dispose();
      sun.shadow.map = null;
    }
  }

  // Called once per frame with the real frame time (seconds).
  tick(rawDt) {
    if (this.locked) return;
    if (this.warmup > 0) { this.warmup -= rawDt; return; }
    this.samples.push(rawDt);
    if (this.samples.length < 90) return;
    const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    this.samples.length = 0;
    if (avg > 1 / 40 && this.level < this.levels.length - 1) {
      this.level += 1;
      this.apply();
      this.warmup = 1.5;
    }
  }
}
