// ============================================================
//  OPERATION: TBD
// ------------------------------------------------------------
//  Phase 1a — the soldier. Drag to orbit, scroll to zoom.
//
//  Every 3D scene needs the same four things:
//    1. a SCENE   — the world, a box that holds all the objects
//    2. a CAMERA  — the eye, where you look from
//    3. LIGHTS    — no light, no picture. Same as real life.
//    4. a RENDERER— the machine that turns 1-3 into pixels
// ============================================================

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createSoldier, animateIdle } from "./soldier.js";

// --- 1. THE SCENE -------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a2416); // dark olive sky
// Fog makes distant things fade out. It hides the edge of the
// world AND it's a performance trick — we can stop drawing
// things past the fog because nobody can see them anyway.
scene.fog = new THREE.Fog(0x1a2416, 14, 60);

// --- 2. THE CAMERA ------------------------------------------
// 50 = field of view in degrees (how wide your vision is).
// Portrait/character shots use a NARROWER fov than gameplay,
// because wide angles distort faces. Photographers know this too.
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);
// A 3/4 view (turned partly to the side) shows depth far better than
// a flat straight-on shot — you can read his chest AND his profile at
// once. It's why almost every character render you've ever seen is
// posed at roughly this angle.
camera.position.set(1.5, 1.35, 2.55);

// --- 3. THE LIGHTS ------------------------------------------
// This is a classic 3-POINT LIGHTING setup, the same one used in
// film and photography for over a century:
//
//   KEY   — the main light. Bright, off to one side. Does the work.
//   FILL  — soft light from the opposite side. Stops the shadows
//           from going pure black so you can still read detail.
//   RIM   — behind the subject, pointing back at the camera. Puts
//           a bright edge on his outline and separates him from
//           the background. This is the one beginners forget, and
//           it's the one that makes a model look expensive.
scene.add(new THREE.HemisphereLight(0x9fc4ff, 0x4a5236, 1.1)); // sky + bounce

const key = new THREE.DirectionalLight(0xfff2d5, 2.6);
key.position.set(4, 7, 5);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
// Tighten the shadow camera around the subject. A shadow map is a
// fixed number of pixels — the smaller the area it covers, the
// sharper the shadow. Spread it over the whole map and you get mush.
key.shadow.camera.near = 1;
key.shadow.camera.far = 25;
key.shadow.camera.left = -5;
key.shadow.camera.right = 5;
key.shadow.camera.top = 6;
key.shadow.camera.bottom = -2;
key.shadow.bias = -0.0009; // stops shadow "acne" — dark speckles on lit surfaces
scene.add(key);

const fill = new THREE.DirectionalLight(0xa8c8ff, 0.55);
fill.position.set(-5, 3, 2);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffe6b0, 1.5);
rim.position.set(-2, 4, -6);
scene.add(rim);

// --- 4. THE RENDERER ----------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
// Cap pixel ratio at 2 — retina screens will happily render 3x
// as many pixels and tank the framerate for no visible gain.
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// ACESFilmic is the tone mapping used in actual movies. It stops
// bright areas from blowing out to flat white and generally makes
// everything look less like a 1998 screensaver.
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

// --- ORBIT CONTROLS -----------------------------------------
// Drag to spin the camera around him, scroll to zoom.
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.0, 0); // look at his chest, not his feet
controls.enableDamping = true; // camera glides to a stop instead of snapping
controls.dampingFactor = 0.06;
controls.minDistance = 1.5;
controls.maxDistance = 12;
controls.maxPolarAngle = Math.PI * 0.49; // stop the camera going underground

// ============================================================
//  THE WORLD
// ============================================================

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x3f5233, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2; // planes are born standing up; lay it flat
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(200, 100, 0x5a7a48, 0x2e3d26);
grid.position.y = 0.01; // lift it a hair so it doesn't z-fight the ground
scene.add(grid);

// ============================================================
//  THE SOLDIER
// ============================================================
const soldier = createSoldier();
scene.add(soldier.root);

// Dev handle. Lets us poke at the model from the browser console
// (or from an automated test) to measure where parts ACTUALLY ended
// up, instead of trusting arithmetic done on paper. Costs nothing
// and it has already caught one bug.
window.__soldier = soldier;

// ============================================================
//  THE GAME LOOP
// ------------------------------------------------------------
//  Runs ~60 times per second, forever. Every game ever made is
//  this loop: update the world a tiny bit, draw it, repeat.
// ============================================================

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate); // "call me again next frame"

  // elapsedTime = seconds since the page loaded. We feed it to the
  // idle animation so the wobbles are tied to REAL time, not to
  // frame count — otherwise he'd breathe faster on a better PC.
  animateIdle(soldier.joints, clock.elapsedTime);

  controls.update(); // required every frame when damping is on
  renderer.render(scene, camera);
}
animate();

// Keep the picture correct when the window is resized.
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix(); // must call this after changing aspect
  renderer.setSize(window.innerWidth, window.innerHeight);
});
