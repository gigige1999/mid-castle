import * as THREE from 'three';

// Small, tactile objects made from reusable geometry. All surfaces carry UVs so
// their static details can share a draw call after the scene merges materials.
export function sculptCollectible(id, parent, { geometry, material, mesh, ball, box, cyl, ring }) {
  const brass = material('#d6ac61', .62, .34);
  const brassLight = material('#ebcd88', .42, .4);
  const brassDark = material('#9a7140', .5, .52);
  const flax = material('#efe1be', 0, .9);
  const seam = material('#cfb98e', 0, .91);
  const cord = material('#aa7c4e', 0, .91);

  function tube(host, mat, key, points, radius = .002, steps = 20) {
    return mesh(host, geometry(`find/${key}`, () => new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point))), steps, radius, 5, false,
    )), mat);
  }
  function bevel(host, mat, key, position, size, radius = .006) {
    const [w, h, d] = size;
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2 + radius, -h / 2 + radius);
    shape.lineTo(w / 2 - radius, -h / 2 + radius);
    shape.lineTo(w / 2 - radius, h / 2 - radius);
    shape.lineTo(-w / 2 + radius, h / 2 - radius);
    shape.closePath();
    const geom = geometry(`find/bevel/${key}`, () => {
      const result = new THREE.ExtrudeGeometry(shape, { depth: d - radius * 2, bevelEnabled: true,
        bevelSegments: 2, steps: 1, bevelSize: radius, bevelThickness: radius });
      result.translate(0, 0, -d / 2 + radius);
      return result;
    });
    return mesh(host, geom, mat, position);
  }
  function leaf(host, mat, key, position, width, length, rotation = [0, 0, 0]) {
    const result = mesh(host, geometry(`find/leaf/${key}`, () => {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.bezierCurveTo(-width * .68, length * .26, -width * .47, length * .73, 0, length);
      shape.bezierCurveTo(width * .47, length * .73, width * .68, length * .26, 0, 0);
      return new THREE.ExtrudeGeometry(shape, { depth: .0015, bevelEnabled: false, curveSegments: 6 });
    }), mat, position);
    result.rotation.set(...rotation);
    return result;
  }
  function ribbon(host, mat, key, points, width, normal = [0, 1, 0], tapered = false) {
    return mesh(host, geometry(`find/ribbon/${key}`, () => {
      const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
      const positions = [], uvs = [], indices = [], steps = 28, thickness = .0025;
      const reference = new THREE.Vector3(...normal);
      for (let i = 0; i <= steps; i++) {
        const t = i / steps, point = curve.getPoint(t), tangent = curve.getTangent(t);
        const side = new THREE.Vector3().crossVectors(reference, tangent).normalize();
        const up = new THREE.Vector3().crossVectors(tangent, side).normalize();
        const half = width * (tapered ? 1 - .2 * t : 1) * .5;
        for (const [across, height] of [[-half, thickness], [half, thickness], [half, -thickness], [-half, -thickness]]) {
          const corner = point.clone().addScaledVector(side, across).addScaledVector(up, height);
          positions.push(corner.x, corner.y, corner.z); uvs.push(across < 0 ? 0 : 1, t);
        }
        if (i < steps) for (let edge = 0; edge < 4; edge++) {
          const a = i * 4 + edge, b = i * 4 + (edge + 1) % 4;
          indices.push(a, a + 4, b, b, a + 4, b + 4);
        }
      }
      indices.push(0, 1, 2, 0, 2, 3);
      const end = steps * 4; indices.push(end, end + 2, end + 1, end, end + 3, end + 2);
      const result = new THREE.BufferGeometry();
      result.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      result.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      result.setIndex(indices); result.computeVertexNormals(); return result;
    }), mat);
  }

  if (id === 'linen') {
    bevel(parent, flax, 'linen-lower', [0, .028, 0], [.245, .053, .174], .008);
    bevel(parent, material('#f6ead0', 0, .94), 'linen-upper', [-.004, .072, -.003], [.226, .041, .159], .007);
    for (const [y, width] of [[.019, .228], [.039, .228], [.068, .212]]) {
      tube(parent, seam, `linen-fold-${y}`, [[-width / 2, y, .084], [0, y - .002, .086], [width / 2, y, .084]], .0018, 12);
    }
    const roll = cyl(parent, flax, [0, .117, -.036], .033, .033, .205, 20); roll.rotation.z = Math.PI / 2;
    for (const side of [-1, 1]) {
      const spiral = [];
      for (let i = 0; i <= 40; i++) {
        const angle = i / 40 * Math.PI * 4.3, radius = .004 + .025 * i / 40;
        spiral.push([side * .103, .117 + Math.sin(angle) * radius, -.036 + Math.cos(angle) * radius]);
      }
      tube(parent, seam, `linen-spiral-${side}`, spiral, .0019, 42);
    }
    for (let i = 0; i < 6; i++) tube(parent, material('#e1cfa7', 0, 1), `linen-weave-${i}`,
      [[-.085 + i * .034, .094, .025], [-.084 + i * .034, .094, .067]], .00065, 2);
    for (const x of [-.035, .035]) tube(parent, cord, `linen-binding-${x}`,
      [[x, .012, .08], [x, .094, .079], [x, .15, -.03], [x, .117, -.071], [x, .015, -.082]], .0034, 26);
    ball(parent, cord, [0, .102, .041], [.009, .006, .008]);
    for (const side of [-1, 1]) tube(parent, cord, `linen-bow-${side}`,
      [[0, .102, .041], [side * .025, .108, .019], [side * .031, .101, .046], [0, .102, .041], [side * .026, .099, .071]], .0023);
  } else if (id === 'candle') {
    cyl(parent, brassDark, [0, .009, 0], .071, .062, .018, 28);
    cyl(parent, brass, [0, .021, 0], .085, .067, .015, 28);
    const rim = ring(parent, brassLight, [0, .031, 0], .078, .005); rim.rotation.x = Math.PI / 2;
    const handle = ring(parent, brass, [.09, .042, 0], .028, .006); handle.rotation.y = Math.PI / 2;
    const wax = material('#f4dca0', 0, .75), waxLight = material('#fff0c4', 0, .72);
    cyl(parent, wax, [0, .114, 0], .035, .042, .17, 24);
    cyl(parent, material('#bc914e', 0, .77), [0, .201, 0], .023, .024, .003, 20);
    const melt = ring(parent, waxLight, [0, .201, 0], .028, .008); melt.rotation.x = Math.PI / 2;
    for (const [angle, length] of [[.5, .046], [2, .07], [3.7, .03], [5, .052]]) {
      const x = Math.cos(angle) * .035, z = Math.sin(angle) * .035;
      tube(parent, waxLight, `wax-${angle}`, [[x * .85, .202, z * .85], [x, .19, z], [x * 1.05, .2 - length, z * 1.05]], .0065, 12);
      ball(parent, waxLight, [x * 1.05, .2 - length, z * 1.05], [.007, .009, .007]);
    }
    ball(parent, wax, [.034, .034, .022], [.026, .006, .019]);
    tube(parent, material('#55402d'), 'wick', [[0, .201, 0], [.003, .217, 0], [.001, .224, 0]], .0028, 8);
    const flame = new THREE.Group(); flame.position.set(.001, .218, 0); parent.add(flame);
    const flameShape = geometry('find/flame', () => new THREE.LatheGeometry([
      new THREE.Vector2(0, 0), new THREE.Vector2(.009, .006), new THREE.Vector2(.013, .017),
      new THREE.Vector2(.01, .029), new THREE.Vector2(.004, .041), new THREE.Vector2(0, .052),
    ], 14));
    const glow = material('#f1ad48', 0, .4); glow.emissive.set('#d88828'); glow.emissiveIntensity = .65;
    const core = material('#fff1b3', 0, .45); core.emissive.set('#ffdf8c'); core.emissiveIntensity = .65;
    mesh(flame, flameShape, glow);
    // Keep this pivot independent of the wax, so only the flame gently flickers.
    ball(flame, core, [0, .015, .008], [.007, .016, .007]);
    return { flame };
  } else if (id === 'parchment') {
    const paper = material('#f3dfb3', 0, .94), edge = material('#c49b62', 0, .88);
    ribbon(parent, paper, 'paper-sheet', [[-.125, .054, 0], [-.09, .027, 0], [0, .019, 0], [.09, .026, 0], [.125, .055, 0]], .164);
    for (const side of [-1, 1]) {
      const roll = cyl(parent, paper, [side * .122, .048, 0], .022, .022, .171, 18); roll.rotation.x = Math.PI / 2;
      for (const end of [-1, 1]) {
        const curl = ring(parent, edge, [side * .122, .048, end * .086], .013, .0021); curl.scale.setScalar(.9);
      }
    }
    const ink = material('#8d714e', 0, .92);
    for (let i = 0; i < 5; i++) {
      const z = -.052 + i * .022, end = i === 4 ? .016 : .071 - (i % 3) * .011;
      tube(parent, ink, `ink-${i}`, [[-.075, .027, z], [-.04, .025, z + .001], [0, .024, z], [end, .027, z + .001]], .0016, 10);
    }
    const seal = material('#a34e42', 0, .61), stamp = material('#c0795d', 0, .67);
    ribbon(parent, material('#ad6654', 0, .8), 'seal-ribbon', [[.068, .026, .028], [.064, .024, .068], [.078, .018, .103]], .013);
    cyl(parent, seal, [.061, .034, .04], .022, .025, .01, 11);
    const border = ring(parent, stamp, [.061, .04, .04], .015, .0015); border.rotation.x = Math.PI / 2;
    box(parent, stamp, [.061, .041, .04], [.003, .002, .016]);
    box(parent, stamp, [.061, .041, .037], [.011, .002, .003]);
  } else if (id === 'key') {
    const bow = ring(parent, brass, [-.081, .018, 0], .045, .009); bow.rotation.x = Math.PI / 2;
    const inner = ring(parent, brassLight, [-.081, .021, 0], .034, .002); inner.rotation.x = Math.PI / 2;
    for (const side of [-1, 1]) {
      const scroll = ring(parent, brass, [-.08, .02, side * .037], .019, .005, Math.PI * 1.5);
      scroll.rotation.x = Math.PI / 2; scroll.rotation.z = side > 0 ? .3 : Math.PI + .3;
    }
    const shaft = cyl(parent, brass, [.025, .018, 0], .01, .012, .165, 14); shaft.rotation.z = Math.PI / 2;
    for (const x of [-.03, -.018, .085]) {
      const collar = cyl(parent, brassLight, [x, .018, 0], .016, .016, .008, 14); collar.rotation.z = Math.PI / 2;
    }
    bevel(parent, brass, 'key-bit', [.093, .018, .024], [.043, .02, .046], .003);
    for (const x of [.078, .107]) bevel(parent, brassLight, `key-tooth-${x}`, [x, .018, .049], [.014, .019, .025], .002);
    tube(parent, brassDark, 'key-etch', [[.078, .029, .018], [.078, .029, .032], [.105, .029, .032]], .0013, 8);
    ball(parent, brassLight, [-.081, .021, -.045], [.008, .008, .008]);
  } else if (id === 'ribbon') {
    const silk = material('#bd6970', 0, .55), lighter = material('#d88d8a', 0, .58);
    for (const side of [-1, 1]) {
      ribbon(parent, side < 0 ? silk : lighter, `bow-loop-${side}`,
        [[0, .046, 0], [side * .055, .094, -.016], [side * .105, .078, -.021], [side * .09, .033, .001], [0, .043, .005]], .034, [0, 0, 1]);
      ribbon(parent, silk, `bow-tail-${side}`,
        [[side * .012, .044, .008], [side * .033, .033, .044], [side * .051, .015, .092], [side * .086, .019, .121]], .039, [0, 1, 0], true);
      tube(parent, material('#e2ae94', .05, .68), `ribbon-trim-${side}`,
        [[side * .025, .042, .025], [side * .048, .032, .052], [side * .066, .018, .093], [side * .091, .021, .112]], .0015, 14);
    }
    bevel(parent, material('#a95361', 0, .6), 'bow-knot', [0, .047, .007], [.035, .031, .042], .008);
    for (const x of [-.008, .008]) tube(parent, lighter, `bow-fold-${x}`, [[x, .059, -.008], [x * .6, .065, .007], [x, .059, .022]], .0016, 8);
  } else if (id === 'bread') {
    const crust = material('#bd7e3e', 0, .88), golden = material('#d7a05a', 0, .93), crumb = material('#f1d29a', 0, 1);
    ball(parent, crust, [0, .053, 0], [.143, .057, .083]);
    ball(parent, golden, [0, .071, 0], [.138, .059, .077]);
    for (let i = 0; i < 4; i++) {
      const x = -.084 + i * .055;
      tube(parent, material('#966032', 0, .94), `bread-cut-${i}`, [[x - .012, .106, -.047], [x, .13 - Math.abs(x) * .1, -.005], [x + .017, .111, .039]], .007, 14);
      tube(parent, crumb, `bread-crumb-${i}`, [[x - .007, .109, -.043], [x + .005, .133 - Math.abs(x) * .1, -.004], [x + .022, .114, .035]], .0038, 14);
    }
    for (let i = 0; i < 14; i++) {
      const x = Math.sin(i * 7.1) * .108, z = Math.cos(i * 4.7) * .047;
      const y = .071 + .059 * Math.sqrt(Math.max(.05, 1 - (x / .138) ** 2 - (z / .077) ** 2));
      ball(parent, crumb, [x, y + .001, z], [.0018 + (i % 3) * .0008, .001, .0017]);
    }
  } else if (id === 'apple') {
    const appleShape = geometry('find/apple', () => {
      const result = new THREE.SphereGeometry(1, 24, 16), positions = result.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
        const angle = Math.atan2(z, x), lobes = 1 + .028 * Math.cos(angle * 5) * Math.abs(y);
        positions.setXYZ(i, x * lobes, y > .55 ? y - .16 * ((y - .55) / .45) ** 2 : y < -.7 ? y + .06 * ((-y - .7) / .3) ** 2 : y, z * lobes);
      }
      result.computeVertexNormals(); return result;
    });
    mesh(parent, appleShape, material('#bd5a48', 0, .4), [0, .087, 0], [.085, .088, .083]);
    // A gently mottled sunlit cheek, following the apple's spherical surface.
    const cheek = geometry('find/apple-cheek', () => {
      const points = [], uv = [], indices = [], rings = 8, sides = 24;
      for (let r = 0; r <= rings; r++) for (let a = 0; a <= sides; a++) {
        const theta = a / sides * Math.PI * 2, distance = r / rings;
        const x = .42 + Math.cos(theta) * .36 * distance, y = .12 + Math.sin(theta) * .52 * distance;
        const z = Math.sqrt(Math.max(.001, 1 - x * x - y * y));
        const lobes = 1 + .028 * Math.cos(Math.atan2(z, x) * 5) * Math.abs(y);
        const dippedY = y > .55 ? y - .16 * ((y - .55) / .45) ** 2 : y;
        points.push(x * lobes * 1.008, dippedY * 1.008, z * lobes * 1.008); uv.push(a / sides, r / rings);
        if (r < rings && a < sides) { const n = r * (sides + 1) + a; indices.push(n, n + sides + 1, n + 1, n + 1, n + sides + 1, n + sides + 2); }
      }
      const result = new THREE.BufferGeometry(); result.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
      result.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); result.setIndex(indices); result.computeVertexNormals(); return result;
    });
    mesh(parent, cheek, material('#cd6b50', 0, .4), [0, .087, 0], [.085, .088, .083]);
    tube(parent, material('#765339', 0, .95), 'apple-stem', [[0, .157, 0], [-.003, .177, 0], [.007, .198, -.003]], .005, 9);
    const leafPivot = new THREE.Group(); leafPivot.position.set(.001, .181, 0); leafPivot.rotation.set(-.8, -.25, -.95); parent.add(leafPivot);
    leaf(leafPivot, material('#7e9659', 0, .86), 'apple', [0, 0, 0], .037, .065);
    tube(leafPivot, material('#b4bb76'), 'apple-vein', [[0, 0, .003], [0, .03, .003], [0, .06, .003]], .0011, 4);
    for (const side of [-1, 1]) for (const y of [.023, .038]) tube(leafPivot, material('#a6ae6d'), `apple-vein-${side}-${y}`, [[0, y, .003], [side * .012, y + .008, .003]], .0006, 2);
  } else if (id === 'iron') {
    const iron = material('#819290', .72, .46), face = material('#b0b9ac', .62, .42), etch = material('#4e6464', .6, .68);
    for (const [i, x, y, z, angle] of [[0, 0, .027, .018, -.12], [1, -.013, .078, -.019, .15]]) {
      const ingot = new THREE.Group(); ingot.position.set(x, y, z); ingot.rotation.y = angle; parent.add(ingot);
      bevel(ingot, iron, `iron-${i}`, [0, 0, 0], [.225, .05, .09], .009);
      bevel(ingot, face, `iron-top-${i}`, [0, .023, 0], [.184, .004, .062], .001);
      for (let n = 0; n < 3; n++) tube(ingot, etch, `iron-scratch-${i}-${n}`, [[-.073 + n * .047, .026, -.009], [-.062 + n * .047, .026, .012]], .0009, 2);
      tube(ingot, etch, `iron-stamp-${i}`, [[.058, .026, -.015], [.058, .026, .014], [.075, .026, .014], [.075, .026, -.015]], .0015, 4);
    }
  } else if (id === 'grain') {
    const straw = material('#c3a169', 0, .94), kernel = material('#e3c17d', 0, .84);
    for (let i = 0; i < 7; i++) {
      const stalk = new THREE.Group(); stalk.position.set((i % 2) * .006, 0, (i % 3 - 1) * .014); stalk.rotation.z = (i - 3) * .11; parent.add(stalk);
      const height = .2 + (i % 3) * .018;
      tube(stalk, straw, `grain-stem-${i}`, [[0, .008, 0], [.003, .12, 0], [0, height + .054, 0]], .0025, 9);
      for (let n = 0; n < 4; n++) for (const side of [-1, 1]) {
        const y = height - .03 + n * .018;
        const seed = ball(stalk, (n + i) % 3 === 0 ? brassLight : kernel, [side * .01, y, 0], [.009, .015, .008]); seed.rotation.z = side * -.5;
        tube(stalk, straw, `grain-awn-${i}-${n}-${side}`, [[side * .012, y + .008, 0], [side * .022, y + .033, 0]], .0008, 2);
      }
    }
    for (const y of [.066, .073]) { const tie = ring(parent, cord, [0, y, 0], .027, .003); tie.rotation.x = Math.PI / 2; tie.scale.y = .8; }
    tube(parent, cord, 'grain-knot', [[0, .075, .025], [.022, .079, .035], [.025, .064, .039], [0, .075, .025], [-.018, .055, .037]], .0027, 14);
  } else if (id === 'quill') {
    const ink = material('#50636b', .1, .4), feather = material('#f3e6cb', 0, .88);
    cyl(parent, ink, [-.07,.035,0], .035,.046,.07,16);
    cyl(parent, brass, [-.07,.073,0], .031,.033,.012,16);
    cyl(parent, material('#303c3e'), [-.07,.08,0], .023,.023,.004,16);
    const plume = new THREE.Group(); plume.position.set(.015,.025,.035); plume.rotation.set(-.55,0,-.35);parent.add(plume);
    leaf(plume,feather,'quill-blade',[0,.065,0],.065,.20);
    tube(plume,seam,'quill-spine',[[0,0,.004],[.002,.15,.004],[0,.26,.004]],.0024,12);
    for(let i=0;i<7;i++)for(const side of [-1,1])tube(plume,material('#d8c5a4'),'quill-barb-'+i+'-'+side,
      [[0,.09+i*.021,.003],[side*.023*Math.sin((i+1)/9*Math.PI),.102+i*.021,.003]],.0009,2);
  } else if (id === 'salve') {
    const clay=material('#9fab85',0,.72),label=material('#f3e5c4',0,.9);
    cyl(parent,clay,[0,.055,0],.065,.075,.11,20);
    const rim=ring(parent,brassDark,[0,.106,0],.062,.004);rim.rotation.x=Math.PI/2;
    cyl(parent,label,[0,.117,0],.073,.073,.016,20);
    cyl(parent,material('#bd9c70'),[0,.13,0],.05,.052,.012,16);
    bevel(parent,label,'salve-label',[0,.056,.071],[.071,.05,.004],.001);
    leaf(parent,material('#68845d'),'salve-seal',[-.005,.038,.075],.016,.033,[0,0,-.25]);
    const spoon = new THREE.Group();spoon.rotation.y=-.6;parent.add(spoon);
    tube(spoon,cord,'salve-spoon',[[.095,.008,-.07],[.095,.01,.09]],.004,6);
    ball(spoon,cord,[.095,.012,.115],[.017,.006,.028]);
  } else if (id === 'yarn') {
    const wool=material('#bd817a',0,.98),thread=material('#dbac97',0,1);
    ball(parent,wool,[0,.076,0],[.091,.075,.076]);
    for(let i=0;i<11;i++){
      const loop=ring(parent,thread,[0,.076,0],.077,.0028);loop.rotation.set(Math.PI/2,i*.24,i*.35);loop.scale.set(1.13,.92,1);
    }
    tube(parent,wool,'yarn-loose',[[.07,.025,.045],[.115,.008,.08],[.108,.008,.125],[.055,.008,.13],[.04,.008,.10]],.003,18);
    tube(parent,cord,'yarn-needle',[[-.115,.04,-.04],[.10,.17,-.04]],.0034,4);
    ball(parent,brassLight,[-.115,.04,-.04],[.007,.007,.007]);
  } else if (id === 'herbs') {
    const stemMat = material('#77946a', 0, .92), sage = material('#93ac83', 0, .95), sageDark = material('#6d916e', 0, .92);
    const lilac = material('#af91b3', 0, .83), bloomLight = material('#cfb2c9', 0, .82);
    for (let i = 0; i < 6; i++) {
      const stem = new THREE.Group(); stem.position.z = (i % 3 - 1) * .017; stem.rotation.z = (i - 2.5) * .145; parent.add(stem);
      const height = .22 + (i % 2) * .025;
      tube(stem, stemMat, `herb-stem-${i}`, [[0, .006, 0], [.002, .12, 0], [0, height, 0]], .0027, 8);
      for (const y of [.095, .14]) for (const side of [-1, 1]) {
        const leafPivot = new THREE.Group(); leafPivot.position.set(0, y, 0); leafPivot.rotation.set(-.3, side * .35, side * -.9); stem.add(leafPivot);
        leaf(leafPivot, (i + side) % 2 ? sage : sageDark, 'sage', [0, 0, 0], .025, .055);
        tube(leafPivot, stemMat, 'sage-vein', [[0, .003, .003], [0, .05, .003]], .0009, 3);
      }
      for (let n = 0; n < 4; n++) {
        const y = height - .028 + n * .011, scale = 1 - n * .13;
        for (const side of [-1, 1]) ball(stem, n % 2 ? bloomLight : lilac, [side * .007 * scale, y, (n % 2 ? 1 : -1) * .004], [.008 * scale, .008, .007 * scale]);
      }
    }
    for (const y of [.047, .054]) { const tie = ring(parent, seam, [0, y, 0], .025, .003); tie.rotation.x = Math.PI / 2; }
    tube(parent, seam, 'herb-tie', [[0, .053, .026], [.017, .049, .038], [.025, .026, .039]], .0026, 7);
  }
  return {};
}
