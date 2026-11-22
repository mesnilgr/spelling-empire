// Cocotte the hen hides somewhere new every day, in a spot linked to that day's release. Touch her:
// "Cot cot!", she spins up into the sky and leaves a golden feather (one per day). The journal 📜
// gives the day's hint, written and read aloud.
// Add ONE row per release: { day, pos: {x, y?, z}, hint: {fr, en}, pose }. Only the row of the latest
// release is used (y = height above the ground when absent; pose: 'sit' | 'perch' | 'peek').
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const COCOTTE = [
  {
    day: 2, pos: { x: 1.4, y: 4.2, z: 14.1 }, pose: 'perch',
    hint: {
      fr: 'Cocotte est montée très haut : sur le toit de ta chaumière, à côté du coffre !',
      en: 'Cocotte climbed up high: on the roof of your cottage, next to the chest!',
    },
  },
  {
    day: 3, pos: { x: -4.1, y: 0.5, z: 17.4 }, ry: 0.4, pose: 'perch',
    hint: {
      fr: 'Cocotte a froid : elle s’est cachée sur le tas de bois, à côté de la cheminée de Flammèche !',
      en: 'Cocotte is cold: she is hiding on the woodpile, next to Flammèche’s chimney!',
    },
  },
];

// The row for the current release (the highest day not after `maxDay`).
export function cocotteToday(maxDay) {
  return COCOTTE.filter((c) => c.day <= maxDay).sort((a, b) => b.day - a.day)[0] ?? null;
}

const MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });
function merged(boxes) {
  const geos = boxes.map(([w, h, d, c, x, y, z]) => {
    const g = new THREE.BoxGeometry(w, h, d).toNonIndexed();
    g.translate(x, y, z);
    const col = new THREE.Color(c), n = g.attributes.position.count, arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { arr[i * 3] = col.r; arr[i * 3 + 1] = col.g; arr[i * 3 + 2] = col.b; }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    g.deleteAttribute('uv');
    return g;
  });
  const geo = mergeGeometries(geos);
  geos.forEach((g) => g.dispose());
  return geo;
}

// A plump white hen with a big red comb: one mesh (one draw call).
export function buildCocotte() {
  const white = 0xfaf6ee, red = 0xe0352b, beak = 0xf2b33a, leg = 0xe89a2a, eye = 0x1a1a1a, wing = 0xe8e0d0;
  const mesh = new THREE.Mesh(merged([
    [0.5, 0.42, 0.62, white, 0, 0.42, 0], // body
    [0.08, 0.3, 0.42, wing, -0.28, 0.44, -0.02], [0.08, 0.3, 0.42, wing, 0.28, 0.44, -0.02], // wings
    [0.34, 0.2, 0.16, white, 0, 0.6, -0.34], // tail
    [0.3, 0.34, 0.3, white, 0, 0.78, 0.26], // head
    [0.08, 0.16, 0.22, red, 0, 1.02, 0.26], [0.08, 0.1, 0.08, red, 0, 1.0, 0.4], // big comb
    [0.14, 0.08, 0.14, beak, 0, 0.76, 0.46], [0.08, 0.12, 0.06, red, 0, 0.66, 0.42], // beak, wattle
    [0.06, 0.06, 0.03, eye, -0.1, 0.84, 0.41], [0.06, 0.06, 0.03, eye, 0.1, 0.84, 0.41],
    [0.06, 0.22, 0.06, leg, -0.1, 0.11, 0.04], [0.06, 0.22, 0.06, leg, 0.1, 0.11, 0.04],
  ]), MAT);
  mesh.castShadow = true;
  mesh.userData.dynamic = true;
  return mesh;
}

export class Cocotte {
  constructor(scene3D, row) {
    this.s = scene3D;
    this.row = row;
    this.mesh = buildCocotte();
    const { x, z } = row.pos;
    const y = row.pos.y ?? scene3D.groundAt(x, z);
    this.base = new THREE.Vector3(x, y, z);
    this.mesh.position.copy(this.base);
    this.mesh.rotation.y = row.ry ?? 0;
    scene3D.scene.add(this.mesh);
    this.obj = scene3D._addInteractable({ kind: 'cocotte', day: row.day, worldPos: this.base.clone(), iconY: 1.3, reach: 3.4, hitRadius: 0.9 });
    this.t = Math.random() * 5;
    this.flyT = -1;
  }
  hide() { this.mesh.visible = false; this.obj.active = false; this.obj.iconHolder.visible = false; }
  // "Cot cot!": she spins up into the sky and is gone.
  flyAway() { this.flyT = 0; this.obj.active = false; }
  update(dt) {
    if (!this.mesh.visible) return;
    this.t += dt;
    const m = this.mesh;
    if (this.flyT >= 0) {
      this.flyT += dt;
      m.position.y = this.base.y + this.flyT * this.flyT * 3 + this.flyT * 2;
      m.rotation.y += dt * 14;
      m.rotation.z = Math.sin(this.flyT * 30) * 0.3;
      if (this.flyT > 2.2) this.hide();
      return;
    }
    // Pecks and little head bobs; now and then a flap.
    const peck = Math.sin(this.t * 3) > 0.85;
    m.rotation.x = peck ? 0.35 : 0;
    m.position.y = this.base.y + (Math.sin(this.t * 0.9) > 0.97 ? 0.12 : 0);
  }
}
