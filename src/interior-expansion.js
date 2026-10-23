import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildKeepWing, keepWingLayouts } from './keep-wing.js';
import { buildBasementWing, basementWingLayouts } from './basement-wing.js';
export { keepWalkLayout } from './keep-wing.js';
export { undergroundWalkLayout } from './basement-wing.js';

const rect = (x1, z1, x2, z2) => ({ rect: [x1, z1, x2, z2] });
const walk = (name, bounds, spawn, obstacles, y) => ({ name, bounds, spawn, obstacles, y, radius: .12, step: .07 });
export const expansionLayouts = {
  ...keepWingLayouts,
  hall: {
    center: [3.9, .75, 2.9], frameBounds: [.2, 0, 7.6, 5.8], roofOwner: 'hall', roofPosition: [3.9, 3.2, 2.9], zoom: 2.0,
    direction: [.26, .87, .43], level: 'ground', expanded: true,
    walk: walk('宴会大厅', [.2, 0, 7.6, 5.8], [3.9, 4.8], [
      rect(2, 2.44, 5.8, 3.16), rect(2, 1.95, 3.05, 2.21), rect(3.75, 1.95, 5.8, 2.21), rect(2, 3.39, 3.05, 3.65), rect(3.75, 3.39, 5.8, 3.65),
      rect(.4, .18, 2.7, .84), rect(5.05, .15, 7.3, .84), rect(3.15, .16, 4.65, 1.01),
      rect(6.77, 2.1, 7.43, 3.9), rect(.45, 4.6, 1.65, 5.5), rect(5.82, 4.92, 7.35, 5.55),
    ], .455),
  },
  ...basementWingLayouts,
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

  const kit={THREE,M,group,floor,lowWall,box,cylinder,orb,beam,rug,candle,jug,book,chest,table,chair,bed,shelf,hearth,barrel,sack,hangingHerbs,shield,lantern};
  buildKeepWing(kit);
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

  buildBasementWing(kit);

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
