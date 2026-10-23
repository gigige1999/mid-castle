import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const rect = (x1, z1, x2, z2) => ({ rect: [x1, z1, x2, z2] });
const disc = (x, z, radius) => ({ circle: [x, z, radius] });
const walk = (name, bounds, spawn, obstacles, y) => ({ name, bounds, spawn, obstacles, y, radius: .12, step: .07 });
const partitionObstacles = [];
// Every chamber has two broad doors, opening onto the unobstructed cross passage.
for (const z of [-.6, .6]) for (const [a, b] of [[-5.6, -3.7], [-2.65, -.7], [.7, 2.65], [3.7, 5.6]]) partitionObstacles.push(rect(a, z - .075, b, z + .075));
for (const x of [-.7, .7]) for (const [a, b] of [[-4.3, -2.85], [-1.75, -.6], [.6, 1.75], [2.85, 4.3]]) partitionObstacles.push(rect(x - .075, a, x + .075, b));
const basementFurniture = [
  rect(-4.9, -4.1, -1.3, -3.28), rect(-5.4, -3, -4.8, -1.45), rect(-2.05, -1.84, -.95, -1.12),
  rect(1.05, -4.12, 4.8, -3.3), rect(4.8, -3.1, 5.4, -1.35), rect(1.05, -1.9, 2.4, -1.2),
  rect(-5.4, 1.1, -4.8, 3.8), rect(-4.55, 3.5, -1.3, 4.12), rect(-2.08, 1.1, -.98, 1.84),
  rect(4.18, 2.55, 5.35, 4.1), rect(1.1, 3.5, 3.4, 4.12), disc(4.65, 1.35, .47),
];
export const undergroundWalkLayout = walk('地下层', [-5.5, -4.2, 5.5, 4.2], [3.8, 3.2], [...partitionObstacles, ...basementFurniture], -3.2);
const underground = (name, center, spawn) => ({
  center, roofOwner: null, roofPosition: [center[0], -1.5, center[2]], zoom: 3.1,
  direction: [.26, .87, .43], level: 'basement', expanded: true,
  walk: { ...undergroundWalkLayout, name, spawn },
});
export const expansionLayouts = {
  keep: {
    center: [1.8, 3.7, -3.8], frameBounds: [-1.4, -6.3, 5, -1.3], roofOwner: 'keep', roofPosition: [1.8, 6.85, -3.8], zoom: 2.35,
    direction: [.26, .87, .43], level: 'upper', expanded: true,
    walk: walk('领主卧室', [-1.4, -6.3, 5, -1.3], [2.9, -2.25], [
      rect(-.8, -5.4, .3, -3.4), rect(.6, -5.4, 1.7, -3.4),
      rect(-1.25, -6.14, 1.65, -5.62), rect(2.65, -6.14, 4.6, -5.4),
      rect(4.12, -4.94, 4.92, -3.8), rect(3.85, -3.23, 4.85, -2.53),
      rect(2.82, -3.25, 3.45, -2.65), rect(-1.3, -2.53, .15, -1.63),
    ], 3.4),
  },
  hall: {
    center: [3.9, .75, 2.9], frameBounds: [.2, 0, 7.6, 5.8], roofOwner: 'hall', roofPosition: [3.9, 3.2, 2.9], zoom: 2.0,
    direction: [.26, .87, .43], level: 'ground', expanded: true,
    walk: walk('宴会大厅', [.2, 0, 7.6, 5.8], [3.9, 4.8], [
      rect(2, 2.44, 5.8, 3.16), rect(2, 1.95, 3.05, 2.21), rect(3.75, 1.95, 5.8, 2.21), rect(2, 3.39, 3.05, 3.65), rect(3.75, 3.39, 5.8, 3.65),
      rect(.4, .18, 2.7, .84), rect(5.05, .15, 7.3, .84), rect(3.15, .16, 4.65, 1.01),
      rect(6.77, 2.1, 7.43, 3.9), rect(.45, 4.6, 1.65, 5.5), rect(5.82, 4.92, 7.35, 5.55),
    ], .455),
  },
  cellar: { ...underground('地下酒窖', [-3.1, -2.9, -2.4], [-3.15, -1.35]), frameBounds: [-5.7, -4.4, -.7, -.6] },
  larder: { ...underground('储粮地窖', [3.1, -2.9, -2.4], [3.2, -1.4]), frameBounds: [.7, -4.4, 5.7, -.6] },
  armory: { ...underground('地下器械库', [-3.1, -2.9, 2.4], [-3.2, 2.25]), frameBounds: [-5.7, .6, -.7, 4.4] },
  undercroft: { ...underground('石阶前厅', [0, -2.9, 0], [3.8, 3.2]), zoom: 1.8, frameBounds: [-5.7, -4.4, 5.7, 4.4] },
};

// These rooms unfold as generous, fully furnished cutaways in the existing scene.
// World coordinates are shared with the walker, pickups and camera anchors.
export function createInteriorExpansion({ THREE, materials: M }) {
  const root = new THREE.Group(); root.name = 'expanded-interiors'; root.visible = false;
  const rooms = {};
  let active;
  const add = (geometry, material, x, y, z) => {
    const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true; mesh.userData.room = active.userData.room; active.add(mesh); return mesh;
  };
  const box = (w, h, d, x, y, z, material = M.stone) => add(new THREE.BoxGeometry(w, h, d), material, x, y, z);
  const cylinder = (r, h, x, y, z, material = M.wood, top = r, segments = 12) => add(new THREE.CylinderGeometry(top, r, h, segments), material, x, y, z);
  const orb = (r, x, y, z, material) => add(new THREE.IcosahedronGeometry(r, 1), material, x, y, z);
  function beam(a, b, r = .035, material = M.timber) {
    const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b), delta = bv.clone().sub(av);
    const mesh = cylinder(r, delta.length(), 0, 0, 0, material, r, 6);
    mesh.position.copy(av.add(bv).multiplyScalar(.5)); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()); return mesh;
  }
  function group(id, build) { active = new THREE.Group(); active.userData.room = id; active.name = `interior-${id}`; rooms[id] = active; root.add(active); build(); }
  function floor(bounds, y, wood = true) {
    const [x1, z1, x2, z2] = bounds, w = x2 - x1, d = z2 - z1, x = (x1 + x2) / 2, z = (z1 + z2) / 2;
    box(w + .4, .25, d + .4, x, y - .15, z, M.edge); box(w, .05, d, x, y - .025, z, wood ? M.wood : M.light);
    if (wood) {
      for (let xx = x1 + .25; xx < x2; xx += .32) box(.008, .006, d, xx, y + .004, z, M.timber);
      for (let zz = z1 + .6; zz < z2; zz += 1.08) for (let xx = x1 + .1; xx < x2 - .1; xx += .64) box(.3, .006, .008, xx, y + .004, zz, M.timber);
    } else {
      for (let xx = x1 + .4; xx < x2; xx += .8) box(.012, .006, d, xx, y + .003, z, M.edge);
      for (let zz = z1 + .4; zz < z2; zz += .8) box(w, .006, .012, x, y + .003, zz, M.edge);
    }
  }
  function lowWall(x1, z1, x2, z2, y, height = .45) {
    const alongX = z1 === z2, length = Math.hypot(x2 - x1, z2 - z1), x = (x1 + x2) / 2, z = (z1 + z2) / 2;
    box(alongX ? length : .15, height, alongX ? .15 : length, x, y + height / 2, z, M.stone);
    box(alongX ? length : .21, .06, alongX ? .21 : length, x, y + height + .03, z, M.light);
    for (let at = .3; at < length; at += .45) box(alongX ? .012 : .158, height * .85, alongX ? .158 : .012, alongX ? x1 + at : x, y + height * .43, alongX ? z : z1 + at, M.edge);
  }
  function shell(bounds, y) {
    const [x1, z1, x2, z2] = bounds;
    lowWall(x1 - .1, z1 - .1, x2 + .1, z1 - .1, y, .85);
    lowWall(x1 - .1, z1 - .1, x1 - .1, z2 + .1, y, .38);
    lowWall(x2 + .1, z1 - .1, x2 + .1, z2 + .1, y, .38);
    lowWall(x1 - .1, z2 + .1, (x1 + x2) / 2 - .7, z2 + .1, y, .26);
    lowWall((x1 + x2) / 2 + .7, z2 + .1, x2 + .1, z2 + .1, y, .26);
    for (const x of [x1, x2]) { box(.22, 1.45, .22, x, y + .725, z1, M.stone); box(.32, .12, .32, x, y + 1.46, z1, M.light); }
  }
  function rug(x, y, z, w, d, color = M.rug) {
    box(w, .015, d, x, y + .012, z, color);
    for (const sign of [-1, 1]) { box(w - .1, .006, .035, x, y + .023, z + sign * (d / 2 - .09), M.cloth); box(.035, .006, d - .1, x + sign * (w / 2 - .09), y + .023, z, M.cloth); }
    for (let dx = -w / 2 + .08; dx < w / 2; dx += .12) for (const sign of [-1, 1]) box(.025, .008, .09, x + dx, y + .012, z + sign * (d / 2), M.linen);
  }
  function candle(x, y, z, tall = false) { cylinder(.075, .04, x, y + .02, z, M.brass); if (tall) cylinder(.025, .3, x, y + .18, z, M.brass); const offset = tall ? .3 : 0; cylinder(.03, .16, x, y + .12 + offset, z, M.linen); const flame = orb(.028, x, y + .23 + offset, z, M.flame); flame.scale.y = 1.7; }
  function jug(x, y, z, size = .12) { cylinder(size, size * 1.4, x, y + size * .7, z, M.pottery, size * .76); cylinder(size * .45, size * .35, x, y + size * 1.56, z, M.pottery, size * .5); const h = add(new THREE.TorusGeometry(size * .5, size * .11, 4, 10), M.pottery, x + size * .8, y + size, z); h.rotation.y = Math.PI / 2; }
  function book(x, y, z, material = M.rug) { box(.25, .055, .34, x, y + .028, z, material); box(.23, .035, .31, x, y + .06, z, M.parchment); box(.25, .012, .34, x, y + .083, z, material); }
  function chest(x, y, z, w = .9, d = .44) {
    box(w, .42, d, x, y + .21, z, M.wood); box(w + .03, .08, d + .03, x, y + .46, z, M.timber);
    for (const sign of [-1, 1]) { box(.045, .43, d + .01, x + sign * w * .3, y + .22, z, M.iron); box(.045, .015, d + .05, x + sign * w * .3, y + .51, z, M.iron); }
    box(.08, .09, .026, x, y + .35, z + d / 2 + .02, M.brass);
  }
  function table(x, y, z, w, d, height = .69) {
    box(w, .1, d, x, y + height, z, M.wood); for (const dx of [-w * .4, w * .4]) for (const dz of [-d * .33, d * .33]) box(.08, height - .04, .08, x + dx, y + height / 2 - .03, z + dz, M.timber);
    box(w * .83, .06, .06, x, y + .22, z, M.timber);
  }
  function chair(x, y, z, angle = 0) {
    const previous = active, chairGroup = new THREE.Group(); previous.add(chairGroup); active = chairGroup;
    box(.48, .07, .48, 0, .37, 0, M.wood); box(.49, .55, .07, 0, .66, -.21, M.timber); box(.38, .045, .37, 0, .425, 0, M.blue);
    for (const dx of [-.17, .17]) for (const dz of [-.17, .17]) box(.055, .35, .055, dx, .175, dz, M.timber);
    chairGroup.position.set(x, y, z); chairGroup.rotation.y = angle; active = previous;
  }
  function bed(x, y, z, canopy = false) {
    box(1.06, .26, 1.95, x, y + .18, z, M.timber); box(1, .15, 1.84, x, y + .38, z, M.linen);
    box(1.01, .035, 1.15, x, y + .473, z + .26, canopy ? M.rug : M.blue); box(.78, .13, .35, x, y + .49, z - .61, M.linen);
    box(1.1, .83, .08, x, y + .45, z - .96, M.wood); box(1.1, .5, .08, x, y + .28, z + .96, M.timber);
    for (const dx of [-.5, .5]) for (const dz of [-.94, .94]) { box(.06, canopy ? 1.58 : .58, .06, x + dx, y + (canopy ? .79 : .29), z + dz, M.timber); orb(.048, x + dx, y + (canopy ? 1.6 : .6), z + dz, M.brass); }
    if (canopy) { for (const dx of [-.5, .5]) box(.06, .1, 1.94, x + dx, y + 1.52, z, M.timber); box(1.06, .18, .035, x, y + 1.46, z - .96, M.rug); for (const dx of [-.45, .45]) box(.12, 1.3, .035, x + dx, y + .87, z - .93, M.rug); }
  }
  function shelf(x, y, z, w, h = 1.1, d = .38) {
    for (const dx of [-w / 2 + .035, w / 2 - .035]) box(.07, h, d, x + dx, y + h / 2, z, M.timber);
    for (const yy of [.06, h / 2, h]) box(w, .045, d, x, y + yy, z, M.wood);
  }
  function hearth(x, y, z, w = 1.3) {
    box(w, .08, .72, x, y + .04, z, M.edge); box(w - .2, .7, .08, x, y + .4, z - .31, M.dark);
    for (const dx of [-w / 2 + .1, w / 2 - .1]) box(.2, .9, .7, x + dx, y + .45, z, M.stone);
    box(w + .12, .15, .76, x, y + .98, z, M.light); box(w * .8, .32, .38, x, y + 1.2, z - .14, M.stone);
    for (const dz of [-.09, .12]) { const log = cylinder(.075, w * .65, x, y + .16, z + dz, M.timber, .06, 8); log.rotation.z = Math.PI / 2; }
    for (const dx of [-.2, 0, .2]) { const flame = orb(.085, x + dx, y + .32, z, M.flame); flame.scale.y = 2.1; }
  }
  function barrel(x, y, z, size = 1, horizontal = false) {
    const old = active, g = new THREE.Group(); old.add(g); active = g;
    cylinder(.25 * size, .62 * size, 0, .31 * size, 0, M.wood, .25 * size, 14);
    for (const yy of [.07, .31, .55]) cylinder(.257 * size, .035 * size, 0, yy * size, 0, M.iron, .257 * size, 14);
    cylinder(.22 * size, .018, 0, .63 * size, 0, M.timber, .22 * size, 14);
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; box(.012, .55 * size, .012, Math.sin(a) * .253 * size, .31 * size, Math.cos(a) * .253 * size, M.timber); }
    if (horizontal) { g.rotation.x = Math.PI / 2; g.position.set(x, y + .27 * size, z - .31 * size); } else g.position.set(x, y, z);
    active = old;
  }
  function sack(x, y, z, size = .21) { const body = orb(size, x, y + size, z, M.cloth); body.scale.set(.9, 1.25, .85); cylinder(size * .23, size * .23, x, y + size * 2.15, z, M.timber, size * .35, 7); }
  function hangingHerbs(x, y, z) { beam([x, y + .2, z], [x, y - .02, z], .012); for (let i = 0; i < 5; i++) { const herb = orb(.065, x + (i % 2 ? -.04 : .04), y - i * .065, z, i % 2 ? M.leaf2 : M.green); herb.scale.set(.6, 1.5, .7); } }
  function shield(x, y, z, material = M.rug) { const body = cylinder(.22, .07, x, y, z, material, .22, 8); body.rotation.x = Math.PI / 2; const boss = orb(.07, x, y, z + .055, M.iron); boss.scale.z = .45; }
  function lantern(x, y, z) { box(.16, .22, .13, x, y, z, M.dark); box(.11, .15, .145, x, y, z, M.flame); for (const dx of [-.07, .07]) box(.018, .24, .16, x + dx, y, z, M.brass); box(.19, .035, .18, x, y + .13, z, M.brass); }

  group('keep', () => {
    const y = 3.4; floor(expansionLayouts.keep.walk.bounds, y); shell(expansionLayouts.keep.walk.bounds, y);
    rug(1.05, y, -2.5, 3.2, 1.05); rug(3.6, y, -4.05, 1.65, 1.8, M.blue);
    bed(-.25, y, -4.4, true); bed(1.15, y, -4.4);
    chest(-.7, y, -5.87, 1.05, .45); chest(.9, y, -5.87, 1.35, .45); book(-.7, y + .51, -5.87); jug(.6, y + .52, -5.87, .1);
    shelf(3.65, y, -5.86, 1.75, 1.05, .44);
    for (let i = 0; i < 6; i++) { const b = box(.12, .3 + (i % 3) * .05, .27, 3.05 + i * .2, y + .76, -5.84, i % 2 ? M.blue : M.rug); b.rotation.z = i === 5 ? -.12 : 0; }
    for (const x of [3.2, 3.7, 4.2]) jug(x, y + .085, -5.85, .105);
    hearth(4.52, y, -4.4, .76); table(4.35, y, -2.88, .95, .62, .58); book(4.3, y + .63, -2.88); candle(4.62, y + .64, -2.85); chair(3.13, y, -2.95, -Math.PI / 2);
    table(-.55, y, -2.08, 1.35, .78, .61); cylinder(.23, .07, -.65, y + .7, -2.08, M.brass, .26); cylinder(.21, .015, -.65, y + .745, -2.08, M.water); jug(-.13, y + .67, -2.08, .11); box(.27, .012, .31, -.96, y + .67, -2.05, M.linen);
    for (const x of [-.8, 2.15, 4.5]) lantern(x, y + .94, -6.16);
  });
  group('hall', () => {
    const y = .455; floor(expansionLayouts.hall.walk.bounds, y); shell(expansionLayouts.hall.walk.bounds, y);
    rug(3.9, y, 2.8, 5.1, 2.7); table(3.9, y, 2.8, 3.8, .72);
    for (const z of [2.08, 3.52]) for (const [a, b] of [[2, 3.05], [3.75, 5.8]]) { box(b - a, .09, .26, (a + b) / 2, y + .39, z, M.wood); for (const x of [a + .15, b - .15]) box(.09, .35, .22, x, y + .175, z, M.timber); }
    box(3.2, .01, .25, 3.9, y + .748, 2.8, M.linen);
    for (const x of [2.4, 3.05, 4.5, 5.25]) for (const sign of [-1, 1]) { cylinder(.115, .015, x, y + .755, 2.8 + sign * .23, M.brass); orb(.05, x, y + .8, 2.8 + sign * .23, M.path); cylinder(.035, .11, x + .18, y + .8, 2.8 + sign * .22, M.pottery); }
    for (const x of [2.8, 4.9]) candle(x, y + .75, 2.8, true); jug(3.9, y + .75, 2.8, .12);
    hearth(3.9, y, .6, 1.4); shelf(1.55, y, .48, 2.2, 1.05, .52); shelf(6.18, y, .47, 2.15, 1.05, .52);
    for (const x of [.75, 1.25, 1.75, 2.25, 5.5, 6, 6.5, 7]) { jug(x, y + .09, .45, .12); cylinder(.14, .035, x, y + .59, .45, M.brass); cylinder(.11, .035, x, y + .63, .45, M.brass); }
    table(7.1, y, 3, .6, 1.7, .64); for (const z of [2.4, 2.95, 3.45]) { cylinder(.16, .035, 7.1, y + .7, z, M.brass); orb(.095, 7.1, y + .78, z, M.path); }
    chest(6.58, y, 5.24, 1.44, .5); for (const x of [6.2, 6.7]) book(x, y + .51, 5.24, M.blue);
    barrel(.85, y, 5.06, 1.18); barrel(1.35, y, 5.14, .82);
    for (const x of [1.1, 2.6, 5.2, 6.7]) { box(.08, 1.48, .08, x, y + .74, .05, M.timber); box(.46, .6, .035, x, y + 1.04, .105, x < 3 ? M.rug : M.blue); box(.05, .5, .013, x, y + 1.05, .128, M.linen); }
  });

  // The underground floor is a single connected level; all four room groups are
  // visible together, with floor seams continuing straight through every door.
  const basementBounds = { cellar: [-5.7, -4.4, 0, 0], larder: [0, -4.4, 5.7, 0], armory: [-5.7, 0, 0, 4.4], undercroft: [0, 0, 5.7, 4.4] };
  for (const id of ['cellar', 'larder', 'armory', 'undercroft']) group(id, () => {
    const y = -3.2, north = id === 'cellar' || id === 'larder', west = id === 'cellar' || id === 'armory';
    floor(basementBounds[id], y, false);
    const x1 = west ? -5.6 : .7, x2 = west ? -.7 : 5.6, z1 = north ? -4.3 : .6, z2 = north ? -.6 : 4.3;
    lowWall(x1, north ? z1 : z2, x2, north ? z1 : z2, y, north ? .8 : .32);
    lowWall(west ? x1 : x2, z1, west ? x1 : x2, z2, y, .42);
    const innerZ = north ? z2 : z1, innerX = west ? x2 : x1;
    for (const [a, b] of west ? [[-5.6, -3.7], [-2.65, -.7]] : [[.7, 2.65], [3.7, 5.6]]) lowWall(a, innerZ, b, innerZ, y, .34);
    for (const [a, b] of north ? [[-4.3, -2.85], [-1.75, -.6]] : [[.6, 1.75], [2.85, 4.3]]) lowWall(innerX, a, innerX, b, y, .34);
    // Short vault springers suggest a Romanesque roof while keeping sight lines open.
    for (const x of [west ? -5.52 : 5.52, innerX]) {
      const z = north ? -4.25 : 4.25;
      box(.25, 1.15, .25, x, y + .575, z, M.stone); box(.36, .1, .36, x, y + 1.2, z, M.light);
      const sign = west ? 1 : -1;
      for (let i = 0; i < 4; i++) { const block = box(.2, .22, .27, x + sign * (.13 + i * .145), y + 1.32 + i * .095, z, M.light); block.rotation.z = -sign * (.15 + i * .16); }
    }
    lantern(west ? -4.8 : 4.8, y + 1.04, north ? -4.22 : 4.22);
    if (id === 'cellar') {
      shelf(-3.1, y, -3.69, 3.6, 1.3, .76);
      for (const x of [-4.45, -3.57, -2.69, -1.81]) for (const yy of [.07, .72]) barrel(x, y + yy, -3.68, .94, true);
      for (const z of [-2.65, -1.88]) barrel(-5.08, y, z, 1.05);
      table(-1.5, y, -1.48, 1.1, .72, .58); jug(-1.7, y + .64, -1.5, .12); jug(-1.3, y + .64, -1.45, .085); candle(-1.13, y + .64, -1.58);
      box(1.4, .016, .65, -3.2, y + .012, -1.65, M.cloth);
    } else if (id === 'larder') {
      shelf(2.95, y, -3.72, 3.7, 1.3, .72);
      for (let i = 0; i < 7; i++) { sack(1.4 + i * .48, y + .08, -3.72, .2); jug(1.4 + i * .48, y + .7, -3.7, .11); }
      for (const z of [-2.7, -2.1, -1.55]) { sack(5.08, y, z, .25); sack(5.03, y + .34, z, .18); }
      table(1.725, y, -1.55, 1.35, .7, .65); box(.72, .04, .35, 1.7, y + .72, -1.55, M.timber);
      for (const x of [1.45, 1.65, 1.85]) orb(.075, x, y + .8, -1.55, M.veg); jug(2.15, y + .72, -1.6, .09);
      for (const x of [1.3, 2.1, 2.9, 3.7, 4.5]) hangingHerbs(x, y + 1.31, -4.02);
    } else if (id === 'armory') {
      for (const z of [1.45, 2.15, 2.85, 3.55]) { box(.5, .07, .42, -5.1, y + .08, z, M.timber); beam([-5.12, y + .12, z], [-5.12, y + 1.3, z], .025, M.wood); const tip = add(new THREE.ConeGeometry(.065, .21, 4), M.iron, -5.12, y + 1.39, z); tip.rotation.y = .8; shield(-4.96, y + .55, z + .17, z < 2.5 ? M.rug : M.blue); }
      shelf(-2.92, y, 3.8, 3.2, 1.03, .5);
      for (const x of [-4.15, -3.5, -2.85, -2.2, -1.55]) { chest(x, y + .07, 3.8, .5, .38); const helmet = orb(.15, x, y + 1.17, 3.8, M.iron); helmet.scale.y = .85; box(.025, .16, .04, x, y + 1.1, 3.97, M.brass); }
      table(-1.53, y, 1.47, 1.1, .74, .62); beam([-1.88, y + .7, 1.4], [-1.21, y + .7, 1.4], .026, M.iron); box(.055, .08, .24, -1.76, y + .72, 1.4, M.brass); box(.2, .015, .3, -1.25, y + .69, 1.57, M.linen);
    } else {
      // Stone steps lead back toward the upper castle; players use the floor switch.
      for (let i = 0; i < 7; i++) { const height = .12 * (i + 1); box(1.1, height, .22, 4.76, y + height / 2, 2.68 + i * .2, M.stone); box(1.13, .035, .23, 4.76, y + height + .018, 2.68 + i * .2, M.light); }
      for (const x of [4.24, 5.28]) beam([x, y + .42, 2.65], [x, y + 1.25, 4], .035);
      table(2.25, y, 3.8, 2.2, .55, .67); book(1.55, y + .73, 3.8); candle(2.2, y + .73, 3.8, true); jug(3, y + .73, 3.8, .12);
      cylinder(.45, .42, 4.65, y + .21, 1.35, M.stone, .45, 18); cylinder(.36, .02, 4.65, y + .43, 1.35, M.dark, .36, 18); cylinder(.31, .012, 4.65, y + .442, 1.35, M.water, .31, 18);
      const rim = add(new THREE.TorusGeometry(.402, .055, 5, 18), M.light, 4.65, y + .445, 1.35); rim.rotation.x = Math.PI / 2;
      rug(2.45, y, 1.6, 1.8, 1.1, M.blue);
    }
  });

  // Bake nested furniture transforms and merge by shared material, per room.
  // Room ownership is retained for pointer selection and collision ray tests.
  for (const [id, room] of Object.entries(rooms)) {
    room.updateMatrixWorld(true); const batches = new Map(), originals = new Set();
    room.traverse(mesh => {
      if (!mesh.isMesh) return;
      const geometry = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld); if (geometry.index) { const flat = geometry.toNonIndexed(); geometry.dispose(); batches.has(mesh.material) ? batches.get(mesh.material).push(flat) : batches.set(mesh.material, [flat]); } else { batches.has(mesh.material) ? batches.get(mesh.material).push(geometry) : batches.set(mesh.material, [geometry]); }
      originals.add(mesh.geometry);
    });
    room.clear();
    for (const [material, geometries] of batches) {
      const geometry = mergeGeometries(geometries, false); geometries.forEach(item => item.dispose());
      const mesh = new THREE.Mesh(geometry, material); mesh.castShadow = mesh.receiveShadow = true; mesh.userData.room = id; room.add(mesh);
    }
    originals.forEach(geometry => geometry.dispose());
  }
  return { root, rooms, dispose() { root.traverse(mesh => { if (mesh.isMesh) mesh.geometry.dispose(); }); root.removeFromParent(); } };
}
