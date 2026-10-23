// A connected upper keep, measured in the same world coordinates as the walker.
// Metadata stays independent of Three.js so maps, navigation and paths agree.
const Y = 3.4;
const chamber = (name, bounds, spawn) => ({ name, bounds, spawn });
const chambers = {
  keep: chamber('领主卧室', [-12, -9, -6, -2], [-9, -2.85]),
  chapel: chamber('主堡礼拜堂', [-6, -9, 0, -2], [-3, -2.85]),
  council: chamber('议事厅', [0, -9, 6, -2], [3, -2.85]),
  library: chamber('图书室', [6, -9, 12, -2], [9, -2.85]),
  storage: chamber('衣物与珍藏库', [-12, 2, -4, 9], [-8, 2.85]),
  solar: chamber('日光起居室', [-4, 2, 4, 9], [0, 2.85]),
  guestroom: chamber('贵客卧房', [4, 2, 12, 9], [8, 2.85]),
  gallery: chamber('主堡长廊', [-12, -2, 12, 2], [0, 1.1]),
};
export const keepRoomIds = Object.keys(chambers);
const prop = (kind, x, z, w, d, extra = {}) => ({ kind, x, z, w, d, ...extra });
export const keepFurniturePlan = {
  keep: [
    prop('bed', -10.4, -7, 1.1, 2, { canopy: true }), prop('bed', -8.1, -7, 1.1, 2, { canopy: true }),
    prop('chest', -10.4, -5.52, 1.2, .48), prop('chest', -8.1, -5.52, 1.2, .48),
    prop('wardrobe', -11.5, -4.45, .55, 1.9), prop('wardrobe', -6.65, -7.7, .7, 1.15),
    prop('washstand', -10.4, -3.1, 1.8, .7), prop('table', -7.15, -3.25, 1.45, .72),
    prop('chair', -7.15, -4.1, .5, .5, { facing: Math.PI }), prop('hearth', -6.9, -8.42, 1.05, .8),
  ],
  chapel: [
    prop('altar', -3, -7.7, 2.5, .95), prop('chest', -5.25, -8.25, .85, .55), prop('chest', -.75, -8.25, .85, .55),
    ...[-5.8, -4.5].flatMap(z => [-4.45, -1.55].map(x => prop('bench', x, z, 1.5, .42, { back: true }))),
    prop('lectern', -.85, -3.2, .65, .6), prop('plant', -5.22, -3.15, .45, .45),
  ],
  council: [
    prop('table', 3, -5.8, 3.8, 1.05, { council: true }),
    ...[-6.75, -4.85].flatMap(z => [1.85, 4.15].map(x => prop('bench', x, z, 1.5, .28))),
    prop('hearth', 3, -8.42, 1.7, .8), prop('shelf', 1.15, -8.48, 1.4, .45, { documents: true }),
    prop('shelf', 4.95, -8.48, 1.4, .45, { documents: true }), prop('display', 5.2, -3.1, .8, .65),
  ],
  library: [
    prop('bookshelf', 7.5, -8.48, 2.4, .48), prop('bookshelf', 10.5, -8.48, 2.4, .48),
    prop('bookshelf', 9, -6.55, 2.7, .48), prop('scrolls', 11.4, -5.7, .7, 1.5),
    prop('table', 7.45, -4.2, 1.75, .82, { study: true }), prop('chair', 7.45, -3.28, .5, .5),
    prop('table', 10.55, -3.15, 1.75, .82, { study: true }), prop('chair', 10.55, -4.05, .5, .5, { facing: Math.PI }),
    prop('chest', 6.65, -6.9, .7, .6),
  ],
  storage: [
    ...[-10.5, -8, -5.5].map(x => prop('shelf', x, 8.48, 2, .48, { textiles: true })),
    ...[-11.2, -9.7].flatMap(x => [3.5, 6.55].map(z => prop('chest', x, z, 1.05, .58))),
    prop('table', -7, 5.7, 2.8, 1, { textiles: true }), prop('chest', -5.1, 7, 1.2, .6),
    prop('barrel', -4.7, 3.45, .65, .65), prop('barrel', -4.7, 4.3, .65, .65),
  ],
  solar: [
    prop('hearth', 0, 8.42, 1.7, .8), prop('bench', -1.8, 7.15, 1.4, .55, { back: true, cushion: true }),
    prop('bench', 1.8, 7.15, 1.4, .55, { back: true, cushion: true }),
    prop('chess', -2.2, 4.1, 1, 1), prop('chair', -3.15, 4.1, .5, .5, { facing: -Math.PI / 2 }),
    prop('chair', -1.25, 4.1, .5, .5, { facing: Math.PI / 2 }),
    prop('sewing', 2.2, 4.5, 1.4, .8), prop('chair', 2.2, 5.4, .5, .5),
    prop('bookshelf', -2.9, 6.1, 1, .38), prop('plant', -3.25, 8.2, .5, .5), prop('plant', 3.25, 8.2, .5, .5),
  ],
  guestroom: [
    ...[5.4, 8, 10.6].flatMap(x => [prop('bed', x, 7, 1.1, 2), prop('chest', x, 5.52, 1.05, .48)]),
    prop('washstand', 5.45, 3.2, 1.75, .7), prop('table', 10.7, 3.2, 1.6, .7),
    prop('chair', 10.7, 4.08, .5, .5), prop('wardrobe', 11.5, 5.1, .6, 1.5),
    prop('shelf', 8, 8.48, 1.5, .45, { textiles: true }),
  ],
  gallery: [
    prop('stairs', 11, 0, 1.2, 2.8), prop('bench', -10.5, 0, 1.9, .55, { back: true }),
    prop('display', 0, 0, 1.3, .8),
  ],
};

// Wall segments are shared by the rendering and collision layouts. The broad
// passage remains continuous from the western sitting bay to the east stairs.
const walls = [];
function wall(id, x1, z1, x2, z2, height = .38) { walls.push({ id, x1, z1, x2, z2, height }); }
for (const [id, { bounds }] of Object.entries(chambers)) {
  if (id === 'gallery') continue;
  const [x1, z1, x2, z2] = bounds, north = z1 < 0, doorZ = north ? z2 : z1, cx = (x1 + x2) / 2;
  wall(id, x1, doorZ, cx - 1, doorZ, .34); wall(id, cx + 1, doorZ, x2, doorZ, .34);
  wall(id, x1, north ? z1 : z2, x2, north ? z1 : z2, north ? .76 : .32);
  wall(id, x1, z1, x1, z2, .4);
  if (x2 === 12) wall(id, x2, z1, x2, z2, .4);
}
wall('gallery', -12, -2, -12, 2, .4); wall('gallery', 12, -2, 12, 2, .4);
const obstacles = walls.map(({ x1, z1, x2, z2 }) => ({ rect: [Math.min(x1, x2) - .11, Math.min(z1, z2) - .11, Math.max(x1, x2) + .11, Math.max(z1, z2) + .11] }));
for (const furnishings of Object.values(keepFurniturePlan)) for (const { x, z, w, d } of furnishings) obstacles.push({ rect: [x - w / 2, z - d / 2, x + w / 2, z + d / 2] });
// Portal columns protrude beyond the low walls but never narrow the 1.7m doors.
for (const [id, { bounds }] of Object.entries(chambers)) if (id !== 'gallery') {
  const cx = (bounds[0] + bounds[2]) / 2, z = bounds[1] < 0 ? -2 : 2;
  for (const x of [cx - 1.1, cx + 1.1]) obstacles.push({ circle: [x, z, .18] });
}
for (const x of [-11.4, -6, 0, 6, 11.4]) for (const z of [-1.78, 1.78]) obstacles.push({ rect: [x - .08, z - .08, x + .08, z + .08] });
for (const x of [-6, 6]) obstacles.push({ rect: [x - .35, -1.88, x + .35, -1.68] });
export const keepWalkLayout = { name: '主堡上层', bounds: [-11.8, -8.8, 11.8, 8.8], spawn: [0, 1.1], obstacles, y: Y, radius: .12, step: .11, speed: 1.65 };
export const keepWingLayouts = Object.fromEntries(Object.entries(chambers).map(([id, { name, bounds, spawn }]) => {
  const center = [(bounds[0] + bounds[2]) / 2, Y + .3, (bounds[1] + bounds[3]) / 2];
  return [id, { center, labelPosition: id === 'gallery' ? [-.5, Y + .1, 1.25] : center, frameBounds: id === 'gallery' ? [-12, -9, 12, 9] : bounds,
    roomBounds: bounds, roofOwner: null, roofPosition: [center[0], Y + 1.5, center[2]], zoom: id === 'gallery' ? 1.05 : 2.1,
    direction: [.22, .91, .36], level: 'upper', expanded: true, ...(id === 'gallery' ? { overview: true } : {}),
    walk: { ...keepWalkLayout, name, spawn } }];
}));
export const keepItemPlacements = {
  linen: [-10.4, 4.16, -3.1], candle: [-3, 4.24, -7.48], parchment: [3, 4.19, -5.45], key: [-7, 4.16, 5.35],
};

export function buildKeepWing(kit) {
  const { M, group, floor, lowWall, box, cylinder, orb, beam, rug, candle, jug, book, chest, table, chair, bed, shelf, hearth, barrel, shield, lantern } = kit;
  const palette = [M.rug, M.blue, M.green, M.cloth, M.timber];
  function bench(p) {
    const { x, z, w, d } = p;
    box(w, .1, d, x, Y + .4, z, M.wood);
    for (const xx of [x - w * .4, x + w * .4]) box(.09, .35, d * .8, xx, Y + .175, z, M.timber);
    if (p.back) { box(w, .36, .065, x, Y + .64, z + d / 2 - .03, M.timber); for (const dx of [-w * .35, w * .35]) box(.06, .72, .06, x + dx, Y + .36, z + d / 2 - .03, M.wood); }
    if (p.cushion) for (let xx = x - w / 2 + .27; xx < x + w / 2 - .1; xx += .45) box(.36, .075, d * .8, xx, Y + .49, z, M.blue);
  }
  function cabinet(p) {
    const { x, z, w, d } = p;
    box(w, 1.28, d, x, Y + .64, z, M.wood); box(w + .06, .09, d + .06, x, Y + 1.31, z, M.timber);
    for (const xx of [x - w * .28, x + w * .28]) { box(w * .38, 1.08, .025, xx, Y + .64, z + d / 2 + .01, M.timber); orb(.024, xx, Y + .63, z + d / 2 + .04, M.brass); }
    for (const yy of [.12, 1.17]) box(w + .01, .04, d + .03, x, Y + yy, z, M.brass);
  }
  function filledShelf(p, books = false) {
    const { x, z, w, d } = p, h = books ? 1.38 : 1.06;
    shelf(x, Y, z, w, h, d);
    for (const yy of [.085, h / 2 + .03]) {
      if (books) for (let dx = -w / 2 + .16, i = 0; dx < w / 2 - .1; dx += .15, i++) {
        const height = .27 + (i % 4) * .035, material = palette[i % palette.length];
        const mesh = box(.11, height, d * .75, x + dx, Y + yy + height / 2, z, material); if (i % 7 === 5) mesh.rotation.z = .08;
        for (const sy of [-1, 1]) box(.116, .018, .015, x + dx, Y + yy + height / 2 + sy * height * .28, z + d * .38, M.brass);
      } else if (p.textiles) for (let dx = -w / 2 + .27, i = 0; dx < w / 2 - .1; dx += .52, i++) for (let k = 0; k < 3; k++) box(.4, .055, d * .8, x + dx, Y + yy + .035 + k * .06, z, palette[(i + k) % palette.length]);
      else for (let dx = -w / 2 + .25; dx < w / 2 - .1; dx += .42) { book(x + dx, Y + yy, z, M.blue); const roll = cylinder(.045, .26, x + dx, Y + yy + .13, z, M.parchment); roll.rotation.x = Math.PI / 2; }
    }
  }
  function furnishing(p) {
    const { kind, x, z, w, d } = p;
    if (kind === 'bed') bed(x, Y, z, p.canopy);
    else if (kind === 'wardrobe' || kind === 'scrolls') cabinet(p);
    else if (kind === 'chest') { chest(x, Y, z, w, d); if (z > 0) { box(w * .4, .035, d * .8, x + w * .16, Y + .52, z, M.linen); box(.025, .041, d * .82, x + w * .16, Y + .54, z, M.rug); } }
    else if (kind === 'chair') chair(x, Y, z, p.facing || 0);
    else if (kind === 'bench') bench(p);
    else if (kind === 'shelf' || kind === 'bookshelf') filledShelf(p, kind === 'bookshelf');
    else if (kind === 'hearth') hearth(x, Y, z, w);
    else if (kind === 'barrel') barrel(x, Y, z, w / .5);
    else if (kind === 'plant') {
      cylinder(.2, .32, x, Y + .16, z, M.pottery, .25); cylinder(.23, .025, x, Y + .33, z, M.dark);
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, tip = [x + Math.cos(a) * .18, Y + .62 + i % 2 * .13, z + Math.sin(a) * .18]; beam([x, Y + .32, z], tip, .012, M.green); const leaf = orb(.1, ...tip, i % 2 ? M.leaf2 : M.green); leaf.scale.set(.6, 1.5, .7); }
    } else if (kind === 'stairs') {
      for (let i = 0; i < 9; i++) { const h = .1 * (i + 1); box(w, h, d / 9 + .02, x, Y + h / 2, z - d / 2 + d / 9 * (i + .5), M.stone); box(w + .04, .025, d / 9, x, Y + h + .013, z - d / 2 + d / 9 * (i + .5), M.light); }
      for (const xx of [x - w / 2, x + w / 2]) { beam([xx, Y + .45, z - d / 2], [xx, Y + 1.23, z + d / 2], .035); for (let i = 0; i < 4; i++) box(.06, .48, .06, xx, Y + .29 + i * .24, z - d / 2 + i * d / 3, M.timber); }
    } else if (kind === 'altar') {
      box(w, .12, d, x, Y + .08, z, M.light); box(w * .8, .61, d * .8, x, Y + .39, z, M.stone); box(w + .04, .1, d + .03, x, Y + .74, z, M.light);
      box(w * .86, .015, d * .83, x, Y + .802, z, M.linen); book(x, Y + .81, z - .16, M.rug);
      for (const xx of [x - .9, x + .9]) candle(xx, Y + .81, z, true);
      box(.08, .68, .08, x, Y + 1.48, z - .33, M.brass); box(.42, .08, .08, x, Y + 1.62, z - .33, M.brass);
    } else if (kind === 'lectern') {
      box(w, .07, d, x, Y + .035, z, M.timber); box(.14, .78, .14, x, Y + .43, z, M.wood); const top = box(w, .08, d, x, Y + .86, z, M.wood); top.rotation.x = -.18; book(x, Y + .92, z, M.rug);
    } else {
      const h = kind === 'display' ? .72 : .69; table(x, Y, z, w, d, h);
      if (kind === 'washstand') {
        cylinder(.25, .06, x - .35, Y + .78, z, M.brass, .28); cylinder(.23, .015, x - .35, Y + .82, z, M.water); jug(x + .5, Y + .75, z, .13);
        box(.32, .025, d * .67, x + .1, Y + .755, z, M.linen);
      } else if (kind === 'chess') {
        for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) box(.085, .012, .085, x - .3 + i * .085, Y + .751, z - .3 + j * .085, (i + j) % 2 ? M.timber : M.linen);
        for (const side of [-1, 1]) for (let i = 0; i < 5; i++) { const xx = x - .25 + i * .12, zz = z + side * .24; cylinder(.023, .065, xx, Y + .79, zz, side < 0 ? M.timber : M.linen, .017, 6); orb(.022, xx, Y + .835, zz, side < 0 ? M.timber : M.linen); }
      } else if (kind === 'sewing') {
        box(w * .66, .025, d * .65, x - .08, Y + .755, z, M.linen); box(.04, .03, d * .65, x - .18, Y + .77, z, M.rug);
        for (const dx of [.35, .5]) cylinder(.06, .13, x + dx, Y + .81, z - .2, dx > .4 ? M.blue : M.rug); cylinder(.08, .09, x - .5, Y + .79, z + .15, M.wood); candle(x + .47, Y + .75, z + .2);
      } else if (p.textiles) {
        for (let i = 0; i < 4; i++) { box(.48, .05, .55, x + (i - 1.5) * .58, Y + .77, z + .02, palette[i]); box(.48, .04, .48, x + (i - 1.5) * .58, Y + .82, z + .02, palette[(i + 1) % palette.length]); }
      } else if (p.council || kind === 'display') {
        box(w * .62, .015, d * .64, x, Y + h + .06, z, M.parchment);
        for (let i = 0; i < 4; i++) { const xx = x + (i - 1.5) * w * .11, zz = z + (i % 2 ? -.13 : .12); box(.07, .025, .18, xx, Y + h + .085, zz, M.blue); cylinder(.045, .07, xx + .09, Y + h + .11, zz, M.brass); }
        if (p.council) for (const xx of [x - 1.5, x + 1.5]) { candle(xx, Y + .75, z, true); jug(xx + .12, Y + .75, z + .27, .08); }
      } else { book(x - w * .22, Y + .75, z, M.blue); candle(x + w * .3, Y + .75, z - d * .18); jug(x + w * .25, Y + .75, z + d * .25, .09); if (p.study) { box(.3, .012, .32, x + .15, Y + .752, z, M.parchment); beam([x + .1, Y + .77, z - .12], [x + .36, Y + .79, z + .08], .008, M.timber); } }
    }
  }
  function portal(cx, z, color) {
    for (const x of [cx - 1.1, cx + 1.1]) { cylinder(.14, 1.25, x, Y + .625, z, M.stone, .14, 8); box(.34, .1, .34, x, Y + 1.3, z, M.light); }
    // An open Romanesque arch frames each room without adding a ceiling.
    for (let i = 0; i < 11; i++) { const a = Math.PI * i / 10, mesh = box(.26, .18, .2, cx + Math.cos(a) * 1.1, Y + 1.32 + Math.sin(a) * .72, z, M.light); mesh.rotation.z = a - Math.PI / 2; }
    for (const x of [cx - 1.75, cx + 1.75]) { box(.055, 1.4, .055, x, Y + .7, z, M.timber); box(.4, .65, .035, x, Y + .98, z, color); box(.055, .5, .015, x, Y + .98, z + .025, M.linen); }
  }
  for (const [id, { bounds }] of Object.entries(chambers)) group(id, () => {
    floor(bounds, Y, id !== 'chapel' && id !== 'gallery');
    for (const p of walls.filter(item => item.id === id)) lowWall(p.x1, p.z1, p.x2, p.z2, Y, p.height);
    const cx = (bounds[0] + bounds[2]) / 2, cz = (bounds[1] + bounds[3]) / 2;
    if (id !== 'gallery') {
      portal(cx, bounds[1] < 0 ? -2 : 2, id === 'chapel' || id === 'library' ? M.blue : M.rug);
      rug(cx, Y, cz + (cz < 0 ? .5 : -.4), Math.min(3.5, bounds[2] - bounds[0] - 1.2), 3.2, id === 'solar' || id === 'chapel' ? M.blue : M.rug);
      const edgeZ = cz < 0 ? -8.85 : 8.85;
      for (const x of [bounds[0] + 1.2, bounds[2] - 1.2]) {
        for (const dx of [-.31, .31]) box(.11, 1.1, .17, x + dx, Y + .8, edgeZ, M.light);
        box(.54, .72, .035, x, Y + .85, edgeZ, M.blue); box(.055, .76, .08, x, Y + .85, edgeZ + .025, M.light); box(.67, .11, .23, x, Y + .42, edgeZ, M.light);
        for (let i = 0; i < 7; i++) { const a = Math.PI * i / 6, b = box(.16, .12, .18, x + Math.cos(a) * .31, Y + 1.34 + Math.sin(a) * .27, edgeZ, M.light); b.rotation.z = a - Math.PI / 2; }
      }
      lantern(cx, Y + 1.05, edgeZ);
    } else {
      rug(-.5, Y, 0, 18.3, 1.35, M.blue);
      for (const x of [-11.4, -6, 0, 6, 11.4]) for (const z of [-1.78, 1.78]) { box(.14, .75, .14, x, Y + .375, z, M.stone); lantern(x, Y + .89, z); }
      for (const x of [-6, 6]) { shield(x, Y + .66, -1.86, x < 0 ? M.rug : M.blue); box(.7, .08, .2, x, Y + .14, -1.78, M.light); }
    }
    for (const p of keepFurniturePlan[id]) furnishing(p);
  });
}
