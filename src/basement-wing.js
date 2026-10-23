// A full underground storey: eight chambers, a broad axial gallery and doors
// between adjacent rooms. Layout data is shared by the camera, atlas and walker.
const y = -3.2;
const rect = (x1, z1, x2, z2) => ({ rect: [x1, z1, x2, z2] });
const disc = (x, z, radius) => ({ circle: [x, z, radius] });
export const basementRoomIds = ['cellar', 'brewery', 'larder', 'cistern', 'armory', 'treasury', 'crypt', 'undercroft'];
const names = ['地下酒窖', '麦芽酿造间', '储粮地窖', '蓄水厅', '地下器械库', '封存库', '地下纪念堂', '石阶前厅'];
const chamberBounds = Object.fromEntries(basementRoomIds.map((id, i) => [id, [-11 + (i % 4) * 5.5, i < 4 ? -8 : 1.1, -5.5 + (i % 4) * 5.5, i < 4 ? -1.1 : 8]]));

// Footprints use full furniture dimensions; small tabletop details share them.
export const basementFurnishings = {
  cellar: [
    { type: 'wineRack', x: -8.25, z: -7.25, w: 4.3, d: .8 },
    { type: 'wineRack', x: -8.35, z: -4.9, w: 2.1, d: .8 },
    ...[-6.05, -5.2, -2.6].map(z => ({ type: 'barrel', x: -10.3, z, r: .3 })),
    { type: 'tasting', x: -6.5, z: -2.75, w: 1.2, d: .8 },
    { type: 'bottleShelf', x: -6.2, z: -6.05, w: .6, d: 1.1 },
  ],
  brewery: [
    { type: 'vat', x: -4.13, z: -6.7, r: .73 }, { type: 'vat', x: -1.85, z: -6.7, r: .73 },
    { type: 'maltShelf', x: -4.65, z: -2.8, w: .6, d: 1.25 },
    { type: 'mashTable', x: -1.1, z: -2.75, w: 1.35, d: .85 },
    { type: 'coolingTrough', x: -2.8, z: -4.65, w: 1.7, d: .65 },
    { type: 'barrel', x: -.7, z: -5.6, r: .3 },
    { type: 'barrel', x: -.7, z: -6.45, r: .3 },
  ],
  larder: [
    { type: 'provisionShelf', x: 2.75, z: -7.35, w: 4.35, d: .7 },
    { type: 'sacks', x: .75, z: -5.4, w: .8, d: 1.25 },
    { type: 'sacks', x: 4.65, z: -2.7, w: .8, d: 1.2 },
    { type: 'sortingTable', x: 2.8, z: -4.7, w: 1.75, d: .8 },
    { type: 'dryingRack', x: .8, z: -2.8, w: .65, d: 1.35 },
    { type: 'chest', x: 4.55, z: -5.9, w: 1.15, d: .6 },
  ],
  cistern: [
    { type: 'pool', x: 8.25, z: -5, w: 2.9, d: 3.2 },
    { type: 'pump', x: 10.15, z: -7.1, w: .7, d: .7 },
    { type: 'waterBench', x: 6.35, z: -2.8, w: .6, d: 1.25 },
    { type: 'barrel', x: 10.2, z: -2.7, r: .3 },
  ],
  armory: [
    { type: 'weaponRack', x: -10.3, z: 4.7, w: .6, d: 3.3 },
    { type: 'weaponBench', x: -8.1, z: 7.25, w: 3.5, d: .7 },
    { type: 'repairTable', x: -6.55, z: 2.85, w: 1.25, d: .85 },
    { type: 'shieldStand', x: -8.25, z: 4.65, w: 1.3, d: .6 },
    { type: 'chest', x: -10.15, z: 2.1, w: 1.05, d: .6 },
  ],
  treasury: [
    ...[-4.5, -3.1, -1.7].map(x => ({ type: 'chest', x, z: 7.2, w: 1.05, d: .65 })),
    { type: 'sealedShelf', x: -4.7, z: 2.9, w: .65, d: 1.6 },
    { type: 'countingTable', x: -2.75, z: 4.9, w: 1.65, d: .85 },
    { type: 'chest', x: -.75, z: 2.8, w: .8, d: .65 },
    { type: 'sealDesk', x: -.75, z: 5.9, w: .75, d: .8 },
  ],
  crypt: [
    ...[1.05, 4.45].flatMap(x => [3.1, 5.8].map(z => ({ type: 'memorial', x, z, w: .9, d: 1.65 }))),
    { type: 'altar', x: 2.75, z: 7.25, w: 1.7, d: .7 },
  ],
  undercroft: [
    { type: 'stairs', x: 9.65, z: 6.35, w: 1.65, d: 2.3 },
    { type: 'dispatch', x: 7.1, z: 7.3, w: 1.8, d: .65 },
    { type: 'bench', x: 6.25, z: 2.8, w: .55, d: 1.4 },
    { type: 'well', x: 9.85, z: 2.65, r: .46 },
  ],
};
const planKinds = { wineRack: 'rack', bottleShelf: 'shelf', maltShelf: 'shelf', sealedShelf: 'shelf', provisionShelf: 'shelf', tasting: 'table', mashTable: 'table', sortingTable: 'table', repairTable: 'table', countingTable: 'table', sealDesk: 'table', dispatch: 'table', vat: 'barrel', coolingTrough: 'table', sacks: 'sack', dryingRack: 'rack', waterBench: 'bench', weaponRack: 'spear', weaponBench: 'shelf', shieldStand: 'rack', memorial: 'altar', well: 'pool', pump: 'barrel' };
export const basementFurniturePlan = Object.fromEntries(Object.entries(basementFurnishings).map(([id, pieces]) => [id, pieces.map(({ type, x, z, w, d, r }) => ({ kind: planKinds[type] || type, x, z, w: w ?? r * 2, d: d ?? r * 2 }))]));

const wallSegments = [];
const columns = [];
for (const [i, id] of basementRoomIds.entries()) {
  const [x1, z1, x2, z2] = chamberBounds[id], north = i < 4, inner = north ? z2 : z1, mid = (x1 + x2) / 2;
  wallSegments.push({ id, a: [x1, inner], b: [mid - .9, inner], h: .38 }, { id, a: [mid + .9, inner], b: [x2, inner], h: .38 });
  wallSegments.push({ id, a: [x1, north ? z1 : z2], b: [x2, north ? z1 : z2], h: north ? .7 : .36 });
  if (i % 4 === 0) wallSegments.push({ id, a: [x1, z1], b: [x1, z2], h: .4 });
  if (i % 4 === 3) wallSegments.push({ id, a: [x2, z1], b: [x2, z2], h: .4 });
  else {
    const doorZ = north ? -4.5 : 4.5;
    wallSegments.push({ id, a: [x2, z1], b: [x2, doorZ - .8], h: .34 }, { id, a: [x2, doorZ + .8], b: [x2, z2], h: .34 });
  }
  for (const x of [mid - 1.04, mid + 1.04]) columns.push({ id, x, z: inner, r: .13, door: true });
  for (const x of [x1 + .16, x2 - .16]) columns.push({ id, x, z: north ? z1 + .16 : z2 - .16, r: .14 });
}
const obstacles = [
  ...wallSegments.map(({ a, b }) => rect(Math.min(a[0], b[0]) - .075, Math.min(a[1], b[1]) - .075, Math.max(a[0], b[0]) + .075, Math.max(a[1], b[1]) + .075)),
  ...columns.map(({ x, z, r }) => disc(x, z, r)),
  ...Object.values(basementFurnishings).flat().map(({ x, z, w, d, r }) => r ? disc(x, z, r) : rect(x - w / 2, z - d / 2, x + w / 2, z + d / 2)),
];
export const undergroundWalkLayout = { name: '地下回廊', bounds: [-10.9, -7.9, 10.9, 7.9], spawn: [8.25, 2.2], obstacles, y, radius: .12, step: .105, speed: 1.5 };
export const basementWingLayouts = Object.fromEntries(basementRoomIds.map((id, i) => {
  const bounds = chamberBounds[id], x = (bounds[0] + bounds[2]) / 2, z = (bounds[1] + bounds[3]) / 2;
  return [id, {
    center: id === 'undercroft' ? [0, y + .3, 0] : [x, y + .3, z],
    labelPosition: [x, y + .75, z], roomBounds: bounds,
    frameBounds: id === 'undercroft' ? [-11.3, -8.3, 11.3, 8.3] : bounds,
    roofOwner: null, roofPosition: [x, y + 1.5, z],
    zoom: id === 'undercroft' ? 1.1 : 2.45, direction: [.2, .91, .37], level: 'basement', expanded: true,
    overview: id === 'undercroft', walk: { ...undergroundWalkLayout, name: names[i], spawn: [x, i < 4 ? -2.15 : 2.15] },
  }];
}));

export function buildBasementWing(kit) {
  const { M, group, floor, lowWall, box, cylinder, orb, beam, rug, candle, jug, book, chest, table, shelf, barrel, sack, hangingHerbs, shield, lantern } = kit;
  const cap = (x, z, height = 1.45) => {
    box(.23, height, .23, x, y + height / 2, z, M.stone);
    box(.34, .13, .34, x, y + height + .05, z, M.light);
    box(.31, .1, .31, x, y + .05, z, M.edge);
  };
  const arch = (x, z) => {
    for (let i = 0; i < 11; i++) {
      const angle = Math.PI * i / 10;
      const block = box(.29, .22, .23, x + Math.cos(angle) * 1.04, y + 1.43 + Math.sin(angle) * .65, z, M.light);
      block.rotation.z = angle - Math.PI / 2;
    }
    box(.25, .26, .26, x, y + 2.08, z, M.stone);
  };
  const plates = (x, z, height, count = 4) => {
    for (let i = 0; i < count; i++) cylinder(.12, .025, x, y + height + i * .027, z, M.brass);
  };
  const bench = (x, z, w, d) => {
    box(w, .09, d, x, y + .39, z, M.wood);
    for (const dx of [-w * .35, w * .35]) for (const dz of [-d * .35, d * .35]) box(.08, .35, .08, x + dx, y + .175, z + dz, M.timber);
  };
  const bucket = (x, z, at = y) => {
    cylinder(.16, .3, x, at + .15, z, M.wood, .19);
    cylinder(.18, .025, x, at + .27, z, M.iron, .195);
    cylinder(.15, .012, x, at + .305, z, M.dark);
    beam([x - .17, at + .28, z], [x, at + .52, z], .016, M.iron);
    beam([x, at + .52, z], [x + .17, at + .28, z], .016, M.iron);
  };
  function furnishing(p) {
    const { type, x, z, w, d, r } = p;
    if (type === 'barrel') barrel(x, y, z, 1.12);
    else if (type === 'chest') { chest(x, y, z, w, d); box(.12, .012, .12, x + .15, y + .515, z, M.rug); }
    else if (type === 'wineRack') {
      shelf(x, y, z, w, 1.35, d);
      for (let xx = x - w / 2 + .45; xx < x + w / 2 - .15; xx += .85) for (const yy of [.08, .75]) barrel(xx, y + yy, z, 1, true);
      for (const dx of [-w * .42, w * .42]) beam([x + dx, y + .13, z + .39], [x - dx, y + 1.28, z + .39], .025);
    } else if (type === 'bottleShelf' || type === 'maltShelf' || type === 'sealedShelf') {
      shelf(x, y, z, w, 1.25, d);
      for (const dz of [-d * .3, 0, d * .3]) for (const yy of [.08, .7]) {
        if (type === 'maltShelf') sack(x, y + yy, z + dz, .2);
        else if (type === 'sealedShelf') { box(w * .76, .24, .33, x, y + yy + .12, z + dz, M.wood); box(w * .8, .03, .035, x, y + yy + .26, z + dz, M.iron); }
        else jug(x, y + yy, z + dz, .105);
      }
    } else if (type === 'tasting' || type === 'mashTable' || type === 'sortingTable' || type === 'repairTable' || type === 'countingTable' || type === 'sealDesk' || type === 'dispatch') {
      table(x, y, z, w, d, .69);
      if (type === 'repairTable') {
        box(.37, .13, .24, x + .25, y + .82, z, M.iron);
        beam([x - .45, y + .78, z - .15], [x + .36, y + .78, z - .15], .025, M.iron);
        box(.08, .07, .28, x - .32, y + .8, z - .15, M.brass);
        box(.22, .012, .27, x - .29, y + .755, z + .17, M.linen);
      } else if (type === 'mashTable') {
        cylinder(.26, .11, x - .25, y + .81, z, M.wood); cylinder(.22, .012, x - .25, y + .875, z, M.path);
        for (const dx of [-.1, 0, .1]) orb(.025, x - .25 + dx, y + .905, z + .05, M.path);
        jug(x + .38, y + .75, z + .08, .13); beam([x - .45, y + .82, z - .18], [x + .45, y + .88, z - .18], .022);
      } else if (type === 'sortingTable') {
        box(w * .6, .035, d * .7, x, y + .76, z, M.timber);
        for (let i = 0; i < 8; i++) orb(.065, x - .38 + i % 4 * .2, y + .82, z - .12 + Math.floor(i / 4) * .22, i % 2 ? M.veg : M.path);
        jug(x + .63, y + .75, z, .09);
      } else if (type === 'countingTable') {
        cylinder(.045, .49, x, y + 1, z, M.brass); beam([x - .42, y + 1.26, z], [x + .42, y + 1.26, z], .025, M.brass);
        for (const dx of [-.36, .36]) { beam([x + dx, y + 1.26, z], [x + dx, y + .93, z], .01, M.iron); cylinder(.16, .03, x + dx, y + .92, z, M.brass); }
        for (let i = 0; i < 4; i++) cylinder(.055, .018, x - .55, y + .77 + i * .019, z + .18, M.brass);
        book(x + .48, y + .75, z + .14, M.blue);
      } else if (type === 'sealDesk') {
        box(.35, .015, .4, x, y + .755, z, M.parchment); cylinder(.04, .025, x + .1, y + .78, z + .1, M.rug); cylinder(.045, .17, x - .18, y + .835, z - .15, M.timber);
      } else {
        jug(x - w * .3, y + .75, z, .12); candle(x + w * .3, y + .75, z, type === 'dispatch');
        if (type === 'dispatch') { book(x, y + .75, z, M.blue); box(.22, .012, .29, x + .35, y + .755, z, M.parchment); }
        else { jug(x + .08, y + .75, z + .08, .08); plates(x, z - .18, .76, 3); }
      }
    } else if (type === 'vat') {
      cylinder(r, 1.05, x, y + .525, z, M.wood, r * .93, 18);
      for (const yy of [.13, .48, .89]) cylinder(r + .012, .055, x, y + yy, z, M.iron, r * .98, 18);
      cylinder(r * .86, .025, x, y + 1.055, z, M.pottery, r * .86, 18);
      for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; beam([x + Math.sin(a) * r, y + .08, z + Math.cos(a) * r], [x + Math.sin(a) * r * .93, y + 1.04, z + Math.cos(a) * r * .93], .009, M.timber); }
      beam([x - .28, y + 1.06, z - .16], [x + .28, y + 1.55, z + .16], .025); box(.18, .3, .045, x + .24, y + 1.42, z + .14, M.wood);
      cylinder(.055, .2, x, y + .24, z + r + .07, M.brass).rotation.x = Math.PI / 2;
    } else if (type === 'coolingTrough') {
      box(w, .5, d, x, y + .25, z, M.wood); box(w - .14, .015, d - .14, x, y + .51, z, M.pottery);
      for (const dx of [-w / 2 + .1, w / 2 - .1]) box(.045, .52, d + .025, x + dx, y + .26, z, M.iron);
    } else if (type === 'provisionShelf') {
      shelf(x, y, z, w, 1.3, d);
      for (let xx = x - w / 2 + .35; xx < x + w / 2 - .1; xx += .55) { sack(xx, y + .08, z, .2); jug(xx, y + .7, z, .11); hangingHerbs(xx, y + 1.75, z - .17); }
      beam([x - w / 2, y + 1.8, z - .17], [x + w / 2, y + 1.8, z - .17], .025);
    } else if (type === 'sacks') {
      box(w, .08, d, x, y + .04, z, M.timber);
      for (const dz of [-.35, .1, .35]) for (const dx of [-.16, .16]) sack(x + dx, y + .08, z + dz, .2);
      for (const dz of [-.2, .2]) sack(x, y + .43, z + dz, .2);
    } else if (type === 'dryingRack') {
      for (const dz of [-d / 2 + .1, d / 2 - .1]) box(.07, 1.35, .07, x, y + .675, z + dz, M.timber);
      beam([x, y + 1.35, z - d / 2], [x, y + 1.35, z + d / 2], .04);
      for (const dz of [-.45, -.15, .15, .45]) hangingHerbs(x, y + 1.2, z + dz);
      box(w, .08, d, x, y + .04, z, M.wood);
    } else if (type === 'pool') {
      box(w, .17, d, x, y + .07, z, M.edge); box(w - .32, .025, d - .32, x, y + .17, z, M.water);
      for (const dx of [-w / 2 + .1, w / 2 - .1]) box(.2, .4, d, x + dx, y + .2, z, M.light);
      for (const dz of [-d / 2 + .1, d / 2 - .1]) box(w, .4, .2, x, y + .2, z + dz, M.light);
      for (const dz of [-.9, -.3, .4, .9]) { const ripple = box(.7 + (dz + 1) * .17, .006, .018, x + dz * .3, y + .188, z + dz, M.linen); ripple.rotation.y = .18; }
      for (const dz of [-.7, .7]) box(.08, .27, .22, x + w / 2 + .03, y + .25, z + dz, M.brass);
    } else if (type === 'pump') {
      box(.65, .12, .65, x, y + .06, z, M.stone); cylinder(.14, .9, x, y + .57, z, M.iron);
      beam([x, y + .8, z], [x - .26, y + .8, z], .055, M.brass); beam([x - .26, y + .8, z], [x - .26, y + .65, z], .045, M.brass);
      beam([x, y + 1.05, z], [x + .29, y + 1.3, z], .025); bucket(x - .2, z - .18);
    } else if (type === 'waterBench') {
      bench(x, z, w, d); for (const dz of [-.37, .05, .4]) { if (dz === .05) bucket(x, z + dz, y + .44); else jug(x, y + .44, z + dz, .14); }
    } else if (type === 'weaponRack') {
      box(w, .08, d, x, y + .04, z, M.timber);
      for (const dz of [-d * .4, d * .4]) box(.08, 1.24, .08, x - .1, y + .62, z + dz, M.timber);
      beam([x - .1, y + .92, z - d / 2], [x - .1, y + .92, z + d / 2], .045);
      for (let dz = -d / 2 + .22; dz < d / 2; dz += .36) { beam([x + .11, y + .09, z + dz], [x - .07, y + 1.45, z + dz], .024); const tip = orb(.075, x - .08, y + 1.5, z + dz, M.iron); tip.scale.set(.55, 1.9, .5); }
    } else if (type === 'weaponBench') {
      shelf(x, y, z, w, .95, d);
      for (let dx = -w / 2 + .35; dx < w / 2; dx += .7) { chest(x + dx, y + .07, z, .5, .45); const helmet = orb(.18, x + dx, y + 1.11, z, M.iron); helmet.scale.y = .85; box(.025, .18, .04, x + dx, y + 1.08, z + .18, M.brass); }
    } else if (type === 'shieldStand') {
      bench(x, z, w, d); for (const dx of [-.43, 0, .43]) shield(x + dx, y + .69, z + .13, dx < 0 ? M.rug : M.blue);
    } else if (type === 'memorial') {
      box(w, .12, d, x, y + .06, z, M.edge); box(w - .1, .42, d - .1, x, y + .33, z, M.stone); box(w + .04, .12, d + .04, x, y + .6, z, M.light);
      box(.11, .018, .55, x, y + .67, z, M.edge); box(.4, .018, .1, x, y + .67, z - .12, M.edge);
      candle(x, y + .67, z + d * .34);
    } else if (type === 'altar') {
      box(w, .14, d, x, y + .07, z, M.edge); box(w - .3, .56, d - .12, x, y + .42, z, M.stone); box(w + .08, .12, d + .06, x, y + .76, z, M.light);
      box(.7, .014, d + .07, x, y + .83, z, M.linen); book(x, y + .84, z, M.rug); for (const dx of [-.6, .6]) candle(x + dx, y + .83, z, true);
      box(.1, .8, .08, x, y + 1.4, z - .25, M.brass); box(.5, .08, .08, x, y + 1.55, z - .25, M.brass);
    } else if (type === 'stairs') {
      for (let i = 0; i < 10; i++) { const height = (i + 1) * .12; box(w, height, d / 10 + .015, x, y + height / 2, z - d / 2 + (i + .5) * d / 10, M.stone); box(w + .02, .035, d / 10 + .025, x, y + height + .018, z - d / 2 + (i + .5) * d / 10, M.light); }
      for (const dx of [-w / 2 + .06, w / 2 - .06]) beam([x + dx, y + .45, z - d / 2], [x + dx, y + 1.58, z + d / 2], .035);
    } else if (type === 'bench') bench(x, z, w, d);
    else if (type === 'well') {
      cylinder(r, .42, x, y + .21, z, M.stone, r, 18); cylinder(r - .09, .018, x, y + .43, z, M.water, r - .09, 18);
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; const stone = box(.2, .09, .13, x + Math.sin(a) * (r - .035), y + .45, z + Math.cos(a) * (r - .035), M.light); stone.rotation.y = a; }
    }
  }

  for (const [i, id] of basementRoomIds.entries()) group(id, () => {
    const bounds = chamberBounds[id], north = i < 4, innerZ = north ? -1.1 : 1.1, midX = (bounds[0] + bounds[2]) / 2;
    floor(bounds, y, false);
    if (id === 'undercroft') {
      floor([-11, -1.1, 11, 1.1], y, false);
      for (const z of [-.72, .72]) box(21.4, .008, .06, 0, y + .012, z, M.path);
      for (const x of [-8.25, -2.75, 2.75, 8.25]) {
        box(.8, .012, .8, x, y + .015, 0, M.edge);
        const inset = box(.51, .014, .51, x, y + .025, 0, M.light); inset.rotation.y = Math.PI / 4;
      }
      lowWall(-11, -1.1, -11, 1.1, y, .4); lowWall(11, -1.1, 11, 1.1, y, .4);
    }
    for (const wall of wallSegments.filter(wall => wall.id === id)) lowWall(...wall.a, ...wall.b, y, wall.h);
    for (const column of columns.filter(column => column.id === id)) cap(column.x, column.z, column.door ? 1.43 : 1.25);
    arch(midX, innerZ);
    for (const dx of [-2.05, 2.05]) lantern(midX + dx, y + 1.05, north ? -7.82 : 7.82);
    lantern(midX - 1.1, y + 1.23, innerZ + (north ? .13 : -.13));
    if (id === 'crypt') {
      rug(midX, y, 4.7, 1.3, 3.6, M.blue);
      for (const z of [2.25, 6.8]) { box(.14, .015, .65, midX, y + .025, z, M.path); box(.65, .015, .14, midX, y + .026, z, M.path); }
    } else if (id === 'undercroft') rug(8.15, y, 4.05, 2.4, 1.45, M.rug);
    else if (id === 'treasury') rug(-2.75, y, 2.6, 1.8, .85, M.blue);
    for (const p of basementFurnishings[id]) furnishing(p);
    // Vault springers leave the roof open while giving the chambers a thick,
    // supported stone structure instead of a collection of empty floor plates.
    for (const x of [bounds[0] + .16, bounds[2] - .16]) for (let n = 0; n < 3; n++) {
      const sign = x < midX ? 1 : -1, z = north ? -7.84 : 7.84;
      const stone = box(.23, .2, .26, x + sign * (.14 + n * .17), y + 1.4 + n * .12, z, M.light); stone.rotation.z = -sign * (.15 + n * .16);
    }
  });
}
