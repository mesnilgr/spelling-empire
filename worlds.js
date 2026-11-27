// Loadable worlds (v1.26.1). A place on the island can open a world of its own, loaded apart behind a
// "Loading…" card: the mine first (J8), the fire world later (J23). Entering hides the island's meshes
// (never its lights: a hidden light makes every material recompile, a long pause on the iPad), stops
// the island's own systems (scene.worldId is no longer 'island': no zombies, no day and night, no
// regions), sets the world's light and fog and adds the world's group. Leaving gives everything back
// and frees the world's geometries and materials (iPad memory).
//
// A world is an object with: id, root (a Group), env ({ bg, fog, near, far, ambient, ambientColor,
// hemi, hemiSky, hemiGround, sun }), lights (entries for the light pool), build(), spawn(),
// update(dt, elapsed), and optionally rideStep(dt), updateCamera(dt), riding, seatDog(pet, t),
// dispose(), onLeave().
import * as THREE from 'three';

export class WorldManager {
  constructor(scene3D) { this.s = scene3D; this.current = null; this.saved = null; }
  get id() { return this.current?.id ?? 'island'; }

  enter(world) {
    if (this.current) this.leave();
    const t0 = performance.now();
    const s = this.s, sc = s.scene;
    const keep = new Set([s.player]);
    if (s.pet?.tamed && s.pet.mesh) keep.add(s.pet.mesh);
    const saved = {
      vis: [], lights: [],
      bg: sc.background,
      fog: sc.fog ? { color: sc.fog.color.getHex(), near: sc.fog.near, far: sc.fog.far } : null,
      colors: [[s.ambient.color, s.ambient.color.getHex()], [s.hemi.color, s.hemi.color.getHex()], [s.hemi.groundColor, s.hemi.groundColor.getHex()], [s.sun.color, s.sun.color.getHex()]],
      torch: { distance: s.torchLight.distance, color: s.torchLight.color.getHex() },
      shadows: s.renderer.shadowMap.autoUpdate,
      fov: s.camera.fov,
    };
    for (const o of sc.children) {
      if (o.isLight) { saved.lights.push([o, o.intensity]); continue; }
      if (keep.has(o)) continue;
      saved.vis.push([o, o.visible]);
      o.visible = false;
    }
    this.saved = saved;
    this.current = world;
    s.autoWalk = null;
    world.build();
    const t1 = performance.now();
    world.root.userData.dynamic = true;
    sc.add(world.root);
    const e = world.env;
    sc.background = new THREE.Color(e.bg);
    if (sc.fog) { sc.fog.color.setHex(e.fog); sc.fog.near = e.near; sc.fog.far = e.far; }
    s.ambient.intensity = e.ambient; s.ambient.color.setHex(e.ambientColor ?? 0xffffff);
    s.hemi.intensity = e.hemi; s.hemi.color.setHex(e.hemiSky ?? 0xffffff); s.hemi.groundColor.setHex(e.hemiGround ?? 0x444444);
    s.sun.intensity = e.sun ?? 0;
    if (e.fov) { s.camera.fov = e.fov; s.camera.updateProjectionMatrix(); }
    for (const l of s.lightPool?.lights ?? []) l.intensity = 0;
    s.torchLight.intensity = 0;
    // No shadow pass down there (the island's sun is off): the frame stays light on the iPad.
    s.renderer.shadowMap.autoUpdate = false;
    document.body.dataset.world = world.id;
    world.spawn();
    // Compile the world's materials now, behind the loading card, not during the ride.
    try { s.renderer.compile(sc, s.camera); } catch { /* (older three.js) */ }
    this.timing = { build: Math.round(t1 - t0), total: Math.round(performance.now() - t0) };
  }

  leave() {
    const w = this.current, sv = this.saved, s = this.s, sc = s.scene;
    if (!w) return;
    this.current = null; this.saved = null;
    w.dispose?.();
    if (w.root.parent) w.root.parent.remove(w.root);
    for (const [o, v] of sv.vis) o.visible = v;
    for (const [l, i] of sv.lights) l.intensity = i;
    for (const [c, hex] of sv.colors) c.setHex(hex);
    sc.background = sv.bg;
    if (sc.fog && sv.fog) { sc.fog.color.setHex(sv.fog.color); sc.fog.near = sv.fog.near; sc.fog.far = sv.fog.far; }
    s.torchLight.distance = sv.torch.distance; s.torchLight.color.setHex(sv.torch.color); s.torchLight.intensity = 0;
    s.renderer.shadowMap.autoUpdate = sv.shadows;
    if (s.camera.fov !== sv.fov) { s.camera.fov = sv.fov; s.camera.updateProjectionMatrix(); }
    s.renderer.shadowMap.needsUpdate = true;
    delete document.body.dataset.world;
    w.onLeave?.();
    // The camera jumps back to the hero (it would otherwise fly across the island).
    s.snapCamera?.();
  }
}

// Frees everything under a group (geometries and materials).
export function disposeTree(root) {
  root.traverse((o) => {
    o.geometry?.dispose();
    const m = o.material;
    if (Array.isArray(m)) m.forEach((x) => x.dispose()); else m?.dispose?.();
  });
}
