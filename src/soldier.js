// ============================================================
//  THE SOLDIER
// ------------------------------------------------------------
//  Builds a stylized military character out of basic 3D shapes.
//
//  THE BIG IDEA — READ THIS PART, INDY:
//
//  We are NOT making a pile of floating body parts. We're making
//  a TREE, where each part is attached to a parent part:
//
//      hips
//       ├── torso
//       │    ├── head
//       │    └── shoulder ──> upperArm ──> elbow ──> forearm ──> hand
//       └── hip ──> thigh ──> knee ──> shin ──> boot
//
//  Why this matters: when you rotate the SHOULDER, the arm, the
//  elbow, the forearm AND the hand all swing with it — because
//  they're children. You rotate one thing, five things move
//  correctly. That's how every animated character in every game
//  works. It's called a scene graph, and it's basically a
//  skeleton made of invisible boxes.
//
//  Rotate the hips? The whole body turns. Rotate the head? Only
//  the head. The tree decides what follows what.
// ============================================================

import * as THREE from "three";

// ------------------------------------------------------------
//  PALETTE — pulled off the reference image.
//  Change any of these and re-save to restyle him instantly.
//  (Winter ops? Swap the greens for greys and whites.)
// ------------------------------------------------------------
export const PALETTE = {
  skin: 0xe3ab7f,
  hair: 0x5b3b22,
  shirt: 0x717751, // olive drab
  shirtCuff: 0x848a60, // rolled-up sleeve, catches more light
  vest: 0x9c8b5d, // tan plate carrier
  pouch: 0x8a7a4d,
  strap: 0x4b4636,
  belt: 0x3e3a2f,
  buckle: 0x2f2c24,
  kneePad: 0x8a7c52,
  boot: 0xa89163,
  bootSole: 0x4a4234,
};

// ------------------------------------------------------------
//  DIMENSIONS — every measurement in one place, in metres.
//  He comes out about 1.85m tall. Tweak freely.
// ------------------------------------------------------------
const D = {
  bootH: 0.185,
  shin: 0.42,
  thigh: 0.46,
  torsoH: 0.5,
  neckH: 0.07,
  headR: 0.125,
  shoulderY: 0.43, // height of shoulder joint above the hips
  shoulderX: 0.235, // how far out to the side
  upperArm: 0.3,
  foreArm: 0.28,
  hipDrop: 0.02, // leg sockets sit slightly below the hip centre
};
// Where the hips sit so the soles land EXACTLY on y=0.
// The hipDrop has to be included here. Leave it out and the legs hang
// 2cm lower than the body thinks they do, and he stands buried in the
// ground — invisible in a screenshot, obvious the moment you measure.
D.hipY = D.bootH + D.shin + D.thigh + D.hipDrop;

// A note on PROPORTION, which is most of what makes a character
// read as "heroic" instead of "lumpy":
// Artists measure bodies in HEADS. A realistic adult is about 7.5
// heads tall. Cartoon characters are 4-5 (big head, stubby body).
// Action-hero style sits around 6.5-7 — and that's what we're
// aiming for. He's ~1.80m with a ~0.28m head, so about 6.4 heads.
// Legs are 59% of his height; short legs are the single most
// common thing that makes a character look squat and wrong.

// ============================================================
//  CAMO — a texture painted in code
// ------------------------------------------------------------
//  A texture is just an image wrapped around a 3D shape. We have
//  no image files, so we PAINT one: make an invisible 128x128
//  canvas, splat random blobs on it, and hand it to Three.js.
//  Procedural texturing — no download, no asset, tiny file.
// ============================================================
function makeCamoTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#7b7853"; // base tan-green
  ctx.fillRect(0, 0, size, size);

  const blobColors = ["#5f6042", "#9c9269", "#474732"];
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = blobColors[i % blobColors.length];
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 5 + Math.random() * 10;
    // A camo blob is just several overlapping circles — that's
    // what gives it the lumpy, non-round outline.
    ctx.beginPath();
    for (let a = 0; a < 5; a++) {
      ctx.arc(
        x + (Math.random() - 0.5) * r * 1.6,
        y + (Math.random() - 0.5) * r * 1.6,
        r * 0.55,
        0,
        Math.PI * 2
      );
    }
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; // tile it forever
  tex.repeat.set(1.6, 1.6);
  tex.colorSpace = THREE.SRGBColorSpace; // so the colors aren't washed out
  return tex;
}

// ============================================================
//  SHAPE HELPERS
// ============================================================

// A capsule = cylinder with domed ends. Perfect for arms and legs
// because the rounded ends look like joints instead of cut pipe.
// NOTE: Three.js measures capsule "length" as only the MIDDLE
// section, so we subtract the two rounded caps to get the total
// length we actually asked for.
function capsule(radius, totalLength) {
  return new THREE.CapsuleGeometry(
    radius,
    Math.max(0.01, totalLength - radius * 2),
    4,
    14
  );
}

function box(w, h, d) {
  return new THREE.BoxGeometry(w, h, d);
}

// Build a mesh, place it, parent it, and turn on shadows.
// Written once here so the body-building code below stays readable.
function part(geometry, material, position, parent) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

// An empty Group is an invisible JOINT. It has no shape — it just
// marks a spot you can rotate around. Elbows, knees and shoulders
// are all just empty groups.
function joint(position, parent) {
  const g = new THREE.Group();
  g.position.set(position[0], position[1], position[2]);
  parent.add(g);
  return g;
}

// ============================================================
//  createSoldier()
// ------------------------------------------------------------
//  Returns { root, joints } — root goes in the scene, joints are
//  the handles we grab to animate him.
// ============================================================
export function createSoldier() {
  const mat = {
    skin: new THREE.MeshStandardMaterial({ color: PALETTE.skin, roughness: 0.75 }),
    hair: new THREE.MeshStandardMaterial({ color: PALETTE.hair, roughness: 0.9 }),
    shirt: new THREE.MeshStandardMaterial({ color: PALETTE.shirt, roughness: 0.95 }),
    cuff: new THREE.MeshStandardMaterial({ color: PALETTE.shirtCuff, roughness: 0.95 }),
    vest: new THREE.MeshStandardMaterial({ color: PALETTE.vest, roughness: 0.85 }),
    pouch: new THREE.MeshStandardMaterial({ color: PALETTE.pouch, roughness: 0.85 }),
    strap: new THREE.MeshStandardMaterial({ color: PALETTE.strap, roughness: 0.9 }),
    belt: new THREE.MeshStandardMaterial({ color: PALETTE.belt, roughness: 0.8 }),
    buckle: new THREE.MeshStandardMaterial({
      color: PALETTE.buckle,
      roughness: 0.4,
      metalness: 0.35,
    }),
    knee: new THREE.MeshStandardMaterial({ color: PALETTE.kneePad, roughness: 0.8 }),
    eye: new THREE.MeshStandardMaterial({ color: 0x2b211a, roughness: 0.35 }),
    boot: new THREE.MeshStandardMaterial({ color: PALETTE.boot, roughness: 0.85 }),
    sole: new THREE.MeshStandardMaterial({ color: PALETTE.bootSole, roughness: 1 }),
    pants: new THREE.MeshStandardMaterial({
      map: makeCamoTexture(),
      roughness: 0.95,
    }),
  };

  const root = new THREE.Group(); // the whole soldier. Move THIS to move him.
  const hips = joint([0, D.hipY, 0], root); // everything hangs off the hips

  // ---------- TORSO ----------
  const torso = joint([0, 0, 0], hips);

  // Chest: wide at the shoulders, narrower at the waist. Three boxes
  // stacked is a cheap way to fake that taper — and the taper is
  // what gives him the V-shaped silhouette that reads as "strong".
  part(box(0.44, 0.22, 0.25), mat.shirt, [0, D.torsoH - 0.1, 0], torso); // shoulders
  part(box(0.4, 0.16, 0.24), mat.shirt, [0, D.torsoH - 0.28, 0], torso); // ribs
  part(box(0.33, 0.2, 0.22), mat.shirt, [0, D.torsoH - 0.44, 0], torso); // waist

  // Plate carrier — the tan vest. Sits proud of the chest.
  // A real plate carrier stops WELL below the collarbone. Running it
  // all the way to the chin (as the first pass did) turns him into a
  // walking billboard and hides the whole neck and shoulder line.
  part(box(0.37, 0.27, 0.1), mat.vest, [0, D.torsoH - 0.25, 0.1], torso);
  part(box(0.35, 0.26, 0.08), mat.vest, [0, D.torsoH - 0.25, -0.1], torso); // back plate

  // Three mag pouches across the front, like the reference.
  for (let i = -1; i <= 1; i++) {
    part(box(0.098, 0.12, 0.07), mat.pouch, [i * 0.105, D.torsoH - 0.33, 0.15], torso);
  }
  // Shoulder straps running over the top of the vest.
  part(box(0.052, 0.075, 0.27), mat.strap, [-0.125, D.torsoH - 0.04, 0.01], torso);
  part(box(0.052, 0.075, 0.27), mat.strap, [0.125, D.torsoH - 0.04, 0.01], torso);

  // Collar, so the shirt meets the neck instead of just stopping.
  part(box(0.19, 0.07, 0.19), mat.cuff, [0, D.torsoH - 0.01, 0], torso);

  // Belt + buckle at the hips.
  part(box(0.4, 0.07, 0.26), mat.belt, [0, 0.02, 0], torso);
  part(box(0.09, 0.06, 0.03), mat.buckle, [0, 0.02, 0.14], torso);
  // Hip pouches (left and right).
  part(box(0.09, 0.12, 0.08), mat.pouch, [-0.21, 0.0, 0.04], torso);
  part(box(0.09, 0.12, 0.08), mat.pouch, [0.21, 0.0, 0.04], torso);

  // ---------- HEAD ----------
  const neck = joint([0, D.torsoH, 0], torso);
  part(capsule(0.052, 0.14), mat.skin, [0, 0.04, 0], neck); // neck

  // Head sits a full head-radius clear of the collar. Too low and he
  // looks like he has no neck at all — which was the first attempt.
  const head = joint([0, D.neckH + D.headR * 1.2, 0], neck);
  const skull = part(new THREE.SphereGeometry(D.headR, 20, 16), mat.skin, [0, 0, 0], head);
  skull.scale.set(1, 1.14, 0.96); // squash into a head shape, not a ball
  part(box(0.115, 0.085, 0.09), mat.skin, [0, -0.085, 0.05], head); // jaw
  part(box(0.025, 0.045, 0.03), mat.skin, [-0.12, 0.0, 0], head); // ears
  part(box(0.025, 0.045, 0.03), mat.skin, [0.12, 0.0, 0], head);

  // Eyes. Two tiny dark boxes — that's genuinely all it takes.
  // Our brains are wired to find eyes, so a shape without them
  // reads as "mannequin" and the same shape with them reads as
  // "person". Cheapest upgrade in the whole model.
  part(box(0.028, 0.02, 0.02), mat.eye, [-0.048, 0.012, 0.113], head);
  part(box(0.028, 0.02, 0.02), mat.eye, [0.048, 0.012, 0.113], head);
  part(box(0.038, 0.014, 0.02), mat.hair, [-0.05, 0.045, 0.112], head); // brows
  part(box(0.038, 0.014, 0.02), mat.hair, [0.05, 0.045, 0.112], head);

  // Hair: a dome sitting on top, plus a swept-up piece at the front.
  // Kept ABOVE the forehead — pushed any further forward it turns
  // into a motorcycle visor (which is what the first attempt did).
  const hair = part(
    new THREE.SphereGeometry(D.headR * 1.05, 18, 14),
    mat.hair,
    [0, 0.032, -0.012],
    head
  );
  hair.scale.set(1, 0.88, 1);
  const quiff = part(box(0.15, 0.055, 0.06), mat.hair, [0, 0.118, 0.042], head);
  quiff.rotation.x = -0.35; // swept up and back

  // ---------- ARMS ----------
  // buildArm(side) where side = -1 (his right) or +1 (his left).
  function buildArm(side) {
    const shoulder = joint([side * D.shoulderX, D.shoulderY, 0], torso);
    part(new THREE.SphereGeometry(0.085, 14, 12), mat.shirt, [0, 0, 0], shoulder); // deltoid

    part(capsule(0.068, D.upperArm), mat.shirt, [0, -D.upperArm / 2, 0], shoulder);

    const elbow = joint([0, -D.upperArm, 0], shoulder);
    // Rolled-up sleeve cuff, then bare forearm — straight off the reference.
    part(capsule(0.072, 0.1), mat.cuff, [0, -0.035, 0], elbow);
    part(capsule(0.06, D.foreArm), mat.skin, [0, -D.foreArm / 2, 0], elbow);

    // The wrist sits exactly at the END of the forearm. The first version
    // stacked an extra -0.06 here AND offset the forearm mesh by -0.04,
    // and those two little fudges added up to a visible gap — his hands
    // floated in mid-air next to his arms. Measure from the joint, not
    // by eye, and the parts meet.
    const wrist = joint([0, -D.foreArm, 0], elbow);
    // A sphere AT the joint hides the seam where two straight parts
    // meet at an angle. Same trick as the deltoid at the shoulder.
    // Without it you get a visible break in the silhouette — which is
    // exactly what made the hands look like they were floating.
    part(new THREE.SphereGeometry(0.058, 12, 10), mat.skin, [0, 0, 0], wrist);
    // Hands slightly oversized — a stylization trick that reads as
    // "heroic" rather than "wrong". The reference does it too.
    const hand = part(box(0.082, 0.12, 0.07), mat.skin, [0, -0.05, 0], wrist);
    hand.rotation.z = side * 0.06;

    return { shoulder, elbow, wrist };
  }
  const armR = buildArm(-1);
  const armL = buildArm(1);

  // ---------- LEGS ----------
  function buildLeg(side) {
    const hip = joint([side * 0.105, -D.hipDrop, 0], hips);
    part(capsule(0.097, D.thigh), mat.pants, [0, -D.thigh / 2, 0], hip);

    const knee = joint([0, -D.thigh, 0], hip);
    part(new THREE.SphereGeometry(0.088, 12, 10), mat.pants, [0, 0, 0], knee); // joint filler
    // Knee pad: narrower than the leg and tucked close, so it reads as
    // strapped ON rather than floating beside it.
    part(box(0.125, 0.14, 0.055), mat.knee, [0, -0.025, 0.068], knee);
    part(capsule(0.086, D.shin), mat.pants, [0, -D.shin / 2, 0], knee);

    const ankle = joint([0, -D.shin, 0], knee);
    // Boot. The sole bottom lands exactly at -D.bootH, which is what
    // puts his feet on the floor instead of hovering or sinking.
    part(box(0.142, 0.15, 0.16), mat.boot, [0, -0.06, 0.005], ankle); // ankle collar
    part(box(0.15, 0.075, 0.25), mat.boot, [0, -0.14, 0.05], ankle); // foot
    part(box(0.155, 0.025, 0.26), mat.sole, [0, -0.1725, 0.052], ankle); // sole

    return { hip, knee, ankle };
  }
  const legR = buildLeg(-1);
  const legL = buildLeg(1);

  // Arms hang slightly AWAY from the body so they clear the vest.
  //
  // Watch the signs here — this is where the first version broke.
  // Rotating by θ around Z sends a point (0, -L) to (L·sinθ, -L·cosθ).
  // His right arm lives at negative x, so swinging it outward means
  // x must get MORE negative, which needs a NEGATIVE θ. Get this
  // backwards (as I first did) and both arms rotate inward and
  // vanish inside his own chest.
  armR.shoulder.rotation.z = -0.17;
  armL.shoulder.rotation.z = 0.17;
  armR.elbow.rotation.x = -0.14;
  armL.elbow.rotation.x = -0.14;

  return {
    root,
    joints: { hips, torso, neck, head, armL, armR, legL, legR },
  };
}

// ============================================================
//  IDLE ANIMATION
// ------------------------------------------------------------
//  A character standing perfectly still looks DEAD. Real people
//  never stop moving — they breathe, shift weight, glance around.
//  Adding tiny motion is the single cheapest way to make a model
//  feel alive. Watch any game character standing still; they're
//  always subtly moving.
//
//  Everything here uses Math.sin(), which smoothly slides between
//  -1 and 1 forever. Multiply it by a small number and you get a
//  gentle wobble. Different speeds on different body parts keeps
//  it from looking robotic.
// ============================================================
export function animateIdle(joints, t) {
  const breathe = Math.sin(t * 1.4);

  joints.torso.position.y = breathe * 0.012; // chest rises and falls
  joints.torso.rotation.z = Math.sin(t * 0.5) * 0.02; // slow weight shift
  joints.hips.rotation.y = Math.sin(t * 0.35) * 0.05; // idle sway

  // Head: mostly still, with an occasional slow look around.
  joints.head.rotation.y = Math.sin(t * 0.42) * 0.22;
  joints.head.rotation.x = Math.sin(t * 0.61) * 0.05;

  // Arms drift a hair, out of sync with each other so it reads
  // as human rather than mechanical.
  // CAREFUL: this function runs every frame and OVERWRITES the resting
  // pose set in createSoldier(). So the outward-arm signs have to match
  // there exactly — fixing the pose but not this line would put the
  // arms straight back inside his chest one frame later.
  joints.armR.shoulder.rotation.x = Math.sin(t * 0.9) * 0.035;
  joints.armL.shoulder.rotation.x = Math.sin(t * 0.9 + 1.1) * 0.035;
  joints.armR.shoulder.rotation.z = -0.17 - breathe * 0.02;
  joints.armL.shoulder.rotation.z = 0.17 + breathe * 0.02;
}
