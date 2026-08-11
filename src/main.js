// ============================================================
//  OPERATION: TBD  —  engine smoke test
// ------------------------------------------------------------
//  This file exists to prove ONE thing: that we can push code
//  and see it live on a real URL. There is no game here yet.
//  Once Indy gives the design brief, this gets replaced.
//
//  Every 3D scene ever made needs these four things:
//    1. a SCENE   — the world, a box that holds all the objects
//    2. a CAMERA  — the eye, where you look from
//    3. LIGHTS    — no light, no picture. Same as real life.
//    4. a RENDERER— the machine that turns 1-3 into pixels
// ============================================================

import * as THREE from "three";

// --- 1. THE SCENE -------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a2416); // dark olive sky
// Fog makes distant things fade out. It hides the edge of the
// world AND it's a performance trick — we can stop drawing
// things past the fog because nobody can see them anyway.
scene.fog = new THREE.Fog(0x1a2416, 20, 90);

// --- 2. THE CAMERA ------------------------------------------
// 60 = field of view in degrees (how wide your vision is).
// Bigger number = more peripheral vision but more fish-eye.
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight, // aspect ratio
  0.1, // near clip: closer than this = invisible
  200 // far clip: further than this = invisible
);
camera.position.set(0, 4, 12);
camera.lookAt(0, 1, 0);

// --- 3. THE LIGHTS ------------------------------------------
// Ambient = flat light from everywhere. Fills in the shadows so
// they aren't pure black. On its own it looks flat and boring.
scene.add(new THREE.AmbientLight(0x6688aa, 0.6));

// Directional = the sun. Parallel rays from one direction.
// This is what actually creates shadows and makes things look 3D.
const sun = new THREE.DirectionalLight(0xfff4d6, 2.0);
sun.position.set(10, 20, 8);
sun.castShadow = true;
scene.add(sun);

// --- 4. THE RENDERER ----------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
// Cap pixel ratio at 2 — retina screens will happily render 3x
// as many pixels and tank the framerate for no visible gain.
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// ============================================================
//  THE WORLD (placeholder)
// ============================================================

// Ground. A flat plane, rotated to lie down flat.
// Planes are born standing up like a wall, so we rotate it
// -90 degrees around X to lay it on its back.
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x3f5233, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2; // Math.PI = 180 degrees, in radians
ground.receiveShadow = true;
scene.add(ground);

// A grid on top so you can actually perceive movement and scale.
const grid = new THREE.GridHelper(200, 100, 0x5a7a48, 0x2e3d26);
grid.position.y = 0.01; // lift it a hair so it doesn't z-fight the ground
scene.add(grid);

// A crate. Our stand-in for "a thing that exists in the world."
const crate = new THREE.Mesh(
  new THREE.BoxGeometry(2, 2, 2),
  new THREE.MeshStandardMaterial({ color: 0x6b7f4a, roughness: 0.8 })
);
crate.position.y = 1; // box is 2 tall, origin is its center, so y=1 sits it on the floor
crate.castShadow = true;
scene.add(crate);

// ============================================================
//  THE GAME LOOP
// ------------------------------------------------------------
//  This runs ~60 times per second, forever. Every game ever
//  made is this loop: update the world a tiny bit, draw it,
//  repeat. That's it. That's the whole trick.
// ============================================================

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate); // "call me again next frame"

  // delta = seconds since the last frame (usually ~0.016).
  // ALWAYS multiply movement by delta. If you don't, your game
  // literally runs faster on a better computer. Real bug, ships
  // in real games, very annoying.
  const delta = clock.getDelta();

  crate.rotation.y += delta * 0.6; // 0.6 radians per SECOND, not per frame
  crate.position.y = 1 + Math.sin(clock.elapsedTime * 1.5) * 0.15; // gentle hover

  renderer.render(scene, camera);
}
animate();

// Keep the picture correct when the window is resized.
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix(); // must call this after changing aspect
  renderer.setSize(window.innerWidth, window.innerHeight);
});
