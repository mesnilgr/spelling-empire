// Fer, the iron golem: the village guardian. He walks round the square, and at night he crushes
// the zombies that come near the houses. Touch him to say hello: once a day he offers a flower,
// like the iron golems of Minecraft.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const GOLEM = { speed: 1.1, chase: 2.0, sight: 12, reach: 3.1, cooldown: 2.5, guard: 30 };

// One mesh per moving part (body, each arm, each leg), colours in the vertices: 5 draw calls.
const MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0.15 });
function part(boxes) {
  const geos = boxes.map(([w, h, d, c, x, y, z]) => {
    const g = new THREE.BoxGeometry(w, h, d).toNonIndexed();
    g.translate(x, y, z);
    const col = new THREE.Color(c), n = g.attributes.position.count, arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { arr[i * 3] = col.r; arr[i * 3 + 1] = col.g; arr[i * 3 + 2] = col.b; }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    g.deleteAttribute('uv');
    return g;
  });
  const mesh = new THREE.Mesh(mergeGeometries(geos), MAT);
  geos.forEach((g) => g.dispose());
  mesh.castShadow = true;
  mesh.userData.dynamic = true;
  return mesh;
}

export function buildIronGolem() {
  const g = new THREE.Group();
  g.userData.dynamic = true;
  const iron = 0xdcd8d0, dark = 0xaaa69e, vine = 0x4f9a3a, eye = 0xff8a2a;
  const rig = new THREE.Group();
  g.add(rig);
  rig.add(part([
    [1.1, 0.4, 0.62, dark, 0, 1.15, 0], // waist
    [1.5, 0.95, 0.85, iron, 0, 1.8, 0], // chest
    [0.06, 0.6, 0.86, vine, -0.5, 1.75, 0.01], [0.5, 0.06, 0.86, vine, 0.25, 2.1, 0.01], [0.06, 0.4, 0.3, vine, 0.6, 1.5, 0.44],
    [0.62, 0.66, 0.6, iron, 0, 2.63, 0.1], // head
    [0.14, 0.3, 0.14, dark, 0, 2.48, 0.46], // big nose
    [0.12, 0.08, 0.03, eye, -0.15, 2.72, 0.41], [0.12, 0.08, 0.03, eye, 0.15, 2.72, 0.41],
    [0.4, 0.06, 0.03, dark, 0, 2.85, 0.41], // brow
  ]));
  const legs = [], arms = [];
  for (const sx of [-0.32, 0.32]) {
    const leg = new THREE.Group();
    leg.position.set(sx, 1.0, 0);
    leg.add(part([[0.48, 1.0, 0.48, dark, 0, -0.5, 0]]));
    rig.add(leg);
    legs.push(leg);
  }
  for (const sx of [-0.92, 0.92]) {
    const arm = new THREE.Group();
    arm.position.set(sx, 2.15, 0);
    arm.add(part([[0.38, 1.7, 0.42, iron, 0, -0.85, 0], [0.42, 0.3, 0.46, dark, 0, -1.6, 0]]));
    rig.add(arm);
    arms.push(arm);
  }
  g.userData.parts = { rig, head: new THREE.Group(), arms, legs };
  return g;
}

export class IronGolem {
  constructor(scene3D, center = { x: 0, z: 0 }) {
    this.s = scene3D;
    // Patrol points round the square, only where there is room to walk.
    this.points = [];
    for (const r of [8.5, 10.5, 12.5]) {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2, x = center.x + Math.cos(a) * r, z = center.z + Math.sin(a) * r;
        if (![0, 0.6, -0.6].some((d) => scene3D._checkCollision(x + d, z) || scene3D._checkCollision(x, z + d)) && !scene3D._insideAnyHouse?.(x, z, 0.8)) this.points.push({ x, z });
      }
      if (this.points.length >= 6) break;
    }
    if (!this.points.length) this.points.push({ x: center.x + 9, z: center.z });
    this.center = center;
    this.mesh = buildIronGolem();
    const p0 = this.points[0];
    this.mesh.position.set(p0.x, scene3D.groundAt(p0.x, p0.z), p0.z);
    scene3D.scene.add(this.mesh);
    this.obj = scene3D._addInteractable({ kind: 'golem', worldPos: this.mesh.position.clone(), iconY: 3.4, reach: 3.1, hitRadius: 1.2 });
    this.wp = 0; this.t = 0; this.pause = 0; this.cooldown = 0; this.smashT = 0; this.waveT = 0; this.target = null;
  }
  wave() { this.waveT = 1.6; }
  update(dt, t) {
    const s = this.s, m = this.mesh, parts = m.userData.parts;
    this.t += dt;
    this.cooldown -= dt;
    let moving = false;
    // At night: a zombie close to the village? Go and crush it.
    const zs = s.zombies?.active ?? [];
    if (!this.target?.alive) this.target = null;
    if (!this.target) this.target = zs.find((z) => z.alive && Math.hypot(z.mesh.position.x - m.position.x, z.mesh.position.z - m.position.z) < GOLEM.sight && Math.hypot(z.mesh.position.x - this.center.x, z.mesh.position.z - this.center.z) < GOLEM.guard) ?? null;
    let goal = null, speed = GOLEM.speed;
    if (this.target) {
      const z = this.target, d = Math.hypot(z.mesh.position.x - m.position.x, z.mesh.position.z - m.position.z);
      // In reach (his arms are long), or stuck behind something just in front of it: smash.
      if (d < GOLEM.reach || ((this.stuckT ?? 0) > 0.8 && d < 4.5)) {
        this.stuckT = 0;
        if (this.cooldown <= 0) {
          this.cooldown = GOLEM.cooldown; this.smashT = 0.5;
          const ux = (z.mesh.position.x - m.position.x) / (d || 1), uz = (z.mesh.position.z - m.position.z) / (d || 1);
          s.zombies.defeat(z, ux, uz, 'golem');
          s.particleBurst(z.mesh.position.clone().add(new THREE.Vector3(0, 0.3, 0)), '#cfd8c0', 18);
          s.screenShake?.(0.12);
          this.onSmash?.();
          this.target = null;
        }
        m.rotation.y = Math.atan2(z.mesh.position.x - m.position.x, z.mesh.position.z - m.position.z);
      } else { goal = z.mesh.position; speed = GOLEM.chase; }
    } else if (this.waveT <= 0) {
      if (this.pause > 0) this.pause -= dt;
      else goal = this.points[this.wp];
    }
    if (goal && this.smashT <= 0) {
      const dx = goal.x - m.position.x, dz = goal.z - m.position.z, d = Math.hypot(dx, dz);
      if (d < 0.4 && !this.target) { this.wp = (this.wp + 1) % this.points.length; this.pause = 1 + Math.random() * 3; }
      else {
        const nx = m.position.x + (dx / d) * speed * dt, nz = m.position.z + (dz / d) * speed * dt;
        const free = (x, z) => !s._checkCollision(x, z) && !s._insideAnyHouse?.(x, z, 0.6);
        if (free(nx, nz)) { m.position.x = nx; m.position.z = nz; moving = true; }
        else {
          // Blocked: step round the obstacle (left or right), or try the next patrol point.
          const px = -(dz / d) * speed * dt, pz = (dx / d) * speed * dt;
          if (free(m.position.x + px, m.position.z + pz)) { m.position.x += px; m.position.z += pz; moving = true; }
          else if (free(m.position.x - px, m.position.z - pz)) { m.position.x -= px; m.position.z -= pz; moving = true; }
          else if (!this.target) this.wp = (this.wp + 1) % this.points.length;
        }
        let diff = Math.atan2(dx, dz) - m.rotation.y;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        m.rotation.y += diff * Math.min(1, dt * 3);
      }
    }
    this.stuckT = this.target && !moving && this.smashT <= 0 ? (this.stuckT ?? 0) + dt : 0;
    m.position.y = s.groundAt(m.position.x, m.position.z);
    // Animation: a heavy walk, arms swinging; arms up to crush; one arm waving hello.
    const k = moving ? Math.sin(this.t * (speed > 1.5 ? 7 : 4.5)) : 0;
    parts.legs[0].rotation.x = k * 0.5; parts.legs[1].rotation.x = -k * 0.5;
    parts.arms[0].rotation.x = -k * 0.4; parts.arms[1].rotation.x = k * 0.4;
    parts.rig.rotation.z = moving ? Math.sin(this.t * 4.5) * 0.03 : 0;
    if (this.smashT > 0) { this.smashT -= dt; const a = this.smashT > 0.25 ? -2.6 : -0.3; parts.arms[0].rotation.x = a; parts.arms[1].rotation.x = a; }
    if (this.waveT > 0) {
      this.waveT -= dt;
      parts.arms[1].rotation.x = -2.6; parts.arms[1].rotation.z = Math.sin(this.waveT * 12) * 0.3;
      const p = s.player.position;
      m.rotation.y = Math.atan2(p.x - m.position.x, p.z - m.position.z);
    } else parts.arms[1].rotation.z = 0;
    parts.head.rotation.y = !moving && !this.target ? Math.sin(this.t * 0.6) * 0.5 : 0;
    this.obj.worldPos.copy(m.position);
    this.obj.iconHolder.position.copy(m.position).add(new THREE.Vector3(0, this.obj.iconY, 0));
    this.obj.hit.position.copy(this.obj.iconHolder.position).add(new THREE.Vector3(0, -1.6, 0));
  }
}
