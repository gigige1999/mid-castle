import * as THREE from 'three';

// Tiny hand-built residents. Every character owns its resources and shares primitives
// within its own hierarchy, so a gallery and the castle can dispose independently.
const looks = {
  lord: { coat: '#744843', trim: '#d1b777', hair: '#715045', skin: '#e7b899', legs: '#65574c' },
  guard: { coat: '#6a7e78', trim: '#b9b6a1', hair: '#6a5040', skin: '#dcb08b', legs: '#676859' },
  chaplain: { coat: '#8a7d67', trim: '#d0bc93', hair: '#a28a6a', skin: '#edc6a4', legs: '#736551' },
  cook: { coat: '#9aa08a', trim: '#ede1c9', hair: '#9e6745', skin: '#f0c6a2', legs: '#797161' },
  steward: { coat: '#748392', trim: '#bd9c69', hair: '#6b554a', skin: '#dfaf8e', legs: '#62605c' },
  smith: { coat: '#9a7459', trim: '#d6b68d', hair: '#4e4740', skin: '#cf9a75', legs: '#66635b' },
  scribe: { coat: '#8398ab', trim: '#d6c5a3', hair: '#6d5144', skin: '#e4b18c', legs: '#645f69' },
  healer: { coat: '#8a9b74', trim: '#e1d7ae', hair: '#69523b', skin: '#dba887', legs: '#79745e' },
  weaver: { coat: '#c19482', trim: '#dfc599', hair: '#7c5143', skin: '#edc2a2', legs: '#8e725d' },
};

export function createCharacter(roleId = 'lord') {
  const role = looks[roleId] ? roleId : 'lord';
  const palette = looks[role];
  const group = new THREE.Group();
  group.name = `resident-${role}`;
  const upper = new THREE.Group();
  group.add(upper);
  const geometries = new Map();
  const materials = new Map();
  const uniqueGeometries = new Set();
  const geo = (key, make) => {
    if (!geometries.has(key)) geometries.set(key, make());
    return geometries.get(key);
  };
  const mat = (color, metalness = 0, roughness = .76) => {
    const key = `${color}/${metalness}/${roughness}`;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({color, metalness, roughness}));
    return materials.get(key);
  };
  const skin = mat(palette.skin, 0, .66);
  const cloth = mat(palette.coat);
  const trim = mat(palette.trim, role === 'lord' ? .48 : 0);
  const hair = mat(palette.hair);
  const boot = mat('#65513f');
  const dark = mat('#443c34');
  const cream = mat('#ede2ca');
  const leather = mat('#86654c');
  const brass = mat('#c8a66a', .55, .4);
  const iron = mat('#adb4af', .52, .43);
  const wood = mat('#ae8053');
  const mesh = (parent, geometry, material, position, scale) => {
    const part = new THREE.Mesh(geometry, material);
    if (position) part.position.set(...position);
    if (scale) part.scale.set(...scale);
    part.castShadow = true;
    part.receiveShadow = true;
    parent.add(part);
    return part;
  };
  const sphere = (parent, material, position, scale) => mesh(parent,
    geo('sphere', () => new THREE.SphereGeometry(1, 16, 12)), material, position, scale);
  const box = (parent, material, position, scale) => mesh(parent,
    geo('box', () => new THREE.BoxGeometry(1, 1, 1)), material, position, scale);
  const cylinder = (parent, material, position, top, bottom, height, sides = 16) => mesh(parent,
    geo(`cylinder-${top}-${bottom}-${height}-${sides}`, () => new THREE.CylinderGeometry(top, bottom, height, sides)), material, position);
  const ring = (parent, material, position, radius, thickness) => mesh(parent,
    geo(`ring-${radius}-${thickness}`, () => new THREE.TorusGeometry(radius, thickness, 6, 20)), material, position);
  const shaped = (parent, material, points, depth, position, bevel = .015) => {
    const path = new THREE.Shape();
    path.moveTo(...points[0]);
    for (const point of points.slice(1)) path.lineTo(...point);
    path.closePath();
    const geometry = new THREE.ExtrudeGeometry(path, {depth, bevelEnabled: true,
      bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2, steps: 1});
    uniqueGeometries.add(geometry);
    return mesh(parent, geometry, material, position);
  };
  const limb = (x, isArm = false) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, isArm ? .88 : .43, 0);
    (isArm ? upper : group).add(pivot);
    if (isArm) {
      sphere(pivot, cloth, [0, -.09, 0], [.105, .155, .11]);
      sphere(pivot, role === 'smith' ? skin : cloth, [0, -.22, .008], [.075, .105, .078]);
      cylinder(pivot, trim, [0, -.257, .012], .078, .078, .035);
      sphere(pivot, skin, [0, -.303, .018], [.079, .082, .074]);
      sphere(pivot, skin, [x < 0 ? .052 : -.052, -.287, .055], [.029, .044, .033]);
    } else {
      sphere(pivot, mat(palette.legs), [0, -.12, 0], [.085, .17, .088]);
      sphere(pivot, boot, [0, -.335, .043], [.098, .084, .148]);
      cylinder(pivot, boot, [0, -.27, .012], .082, .08, .13);
      box(pivot, brass, [0, -.266, .09], [.06, .035, .017]);
    }
    return pivot;
  };
  const leftLeg = limb(-.115), rightLeg = limb(.115);
  const leftArm = limb(-.267, true), rightArm = limb(.267, true);
  const robe = ['chaplain','healer','weaver'].includes(role);
  cylinder(upper, cloth, [0, robe ? .575 : .68, 0], .20, robe ? .276 : .243, robe ? .71 : .51);
  sphere(upper, cloth, [0, .82, 0], [.232, .152, .167]);
  cylinder(upper, trim, [0, robe ? .24 : .432, 0], robe ? .278 : .245, robe ? .28 : .247, .033);
  cylinder(upper, leather, [0, .61, 0], .226, .23, .055);
  box(upper, brass, [0, .61, .225], [.078, .064, .025]);
  box(upper, dark, [0, .61, .241], [.039, .032, .006]);
  cylinder(upper, skin, [0, .99, 0], .083, .095, .13);
  // A folded, contrasting neckline reads even at castle scale.
  const collarL = sphere(upper, cream, [-.057, .931, .118], [.074, .025, .064]);
  collarL.rotation.z = -.4;
  const collarR = sphere(upper, cream, [.057, .931, .118], [.074, .025, .064]);
  collarR.rotation.z = .4;
  for (let i = 0; i < 3; i++) sphere(upper, trim, [0, .85 - i * .07, .183], [.018, .018, .012]);

  const head = new THREE.Group();
  head.position.y = 1.19;
  upper.add(head);
  sphere(head, skin, [0, 0, 0], [.281, .279, .244]);
  sphere(head, skin, [-.274, -.019, .01], [.057, .079, .052]);
  sphere(head, skin, [.274, -.019, .01], [.057, .079, .052]);
  const earPink = mat('#c48e79');
  sphere(head, earPink, [-.292, -.018, .035], [.019, .04, .013]);
  sphere(head, earPink, [.292, -.018, .035], [.019, .04, .013]);
  sphere(head, hair, [0, .072, -.058], [.288, .234, .215]);
  // Individually sculpted locks leave the entire face exposed.
  for (let i = 0; i < 6; i++) {
    const angle = -.98 + i * .39;
    const lock = sphere(head, hair,
      [Math.sin(angle) * .23, .167 + Math.cos(angle) * .034, .10 + Math.cos(angle) * .074],
      [.071, .075 + (i % 2) * .019, .059]);
    lock.rotation.z = -angle * .5;
  }
  sphere(head, hair, [-.247, .057, .045], [.042, .11, .072]);
  sphere(head, hair, [.247, .057, .045], [.042, .11, .072]);
  const eyes = [];
  for (const side of [-1, 1]) {
    const eye = sphere(head, dark, [side * .103, .006, .228], [.025, .034, .018]);
    eyes.push(eye);
    sphere(eye, mat('#fff8e6'), [-.2, .29, .83], [.24, .22, .22]);
    const brow = sphere(head, hair, [side * .104, .074, .218], [.047, .012, .014]);
    brow.rotation.z = side * -.13;
    sphere(head, mat('#d89982'), [side * .159, -.062, .197], [.049, .025, .009]);
  }
  sphere(head, skin, [0, -.04, .249], [.039, .04, .038]);
  const smileCurve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-.039, -.105, .225),
    new THREE.Vector3(0, -.132, .239), new THREE.Vector3(.039, -.105, .225));
  const smileGeometry = new THREE.TubeGeometry(smileCurve, 12, .006, 5, false);
  uniqueGeometries.add(smileGeometry);
  mesh(head, smileGeometry, mat('#975f4d'));

  const handProp = (arm, z = .08) => {
    const prop = new THREE.Group();
    prop.position.set(0, -.30, z);
    arm.add(prop);
    return prop;
  };
  const book = (parent, color, size = 1) => {
    const binding = new THREE.Group();
    binding.scale.setScalar(size);
    parent.add(binding);
    box(binding, cream, [0, 0, 0], [.19, .24, .055]);
    for (const z of [-.037, .037]) box(binding, mat(color), [0, 0, z], [.214, .257, .017]);
    box(binding, mat(color), [-.10, 0, 0], [.024, .257, .076]);
    for (const y of [-.086, .086]) box(binding, brass, [0, y, .049], [.15, .012, .008]);
    box(binding, brass, [.093, 0, .048], [.035, .045, .012]);
    return binding;
  };
  const apron = (color, bottom = .39) => {
    const panel = shaped(upper, mat(color), [[-.108,.91],[.108,.91],[.18,bottom],[-.18,bottom]],
      .017, [0, 0, .187], .008);
    const strap = box(upper, cream, [0, .923, .18], [.17, .025, .024]);
    strap.rotation.x = -.15;
    box(upper, leather, [0, .59, .222], [.30, .025, .02]);
    shaped(upper, mat(color), [[-.074,.64],[.074,.64],[.068,.55],[-.068,.55]], .018, [0,0,.218], .004);
    return panel;
  };

  if (role === 'lord') {
    // Burgundy cape, ivory mantle, and a six-pointed antique-gold circlet.
    shaped(upper, mat('#815a54'), [[-.15,.94],[.15,.94],[.33,.40],[-.33,.40]], .045, [0,0,-.22], .027);
    sphere(upper, cream, [-.18,.90,-.035], [.13,.065,.18]);
    sphere(upper, cream, [.18,.90,-.035], [.13,.065,.18]);
    for (const x of [-.105,.105]) sphere(upper, brass, [x,.916,.16], [.033,.033,.019]);
    cylinder(head, brass, [0,.225,0], .246,.249,.073);
    for (let i=0;i<6;i++) {
      const angle=i*Math.PI/3;
      const tooth=cylinder(head,brass,[Math.sin(angle)*.231,.29,Math.cos(angle)*.231],.012,.044,.10,4);
      tooth.rotation.y=angle;
      sphere(head,brass,[Math.sin(angle)*.231,.344,Math.cos(angle)*.231],[.021,.023,.021]);
    }
    sphere(head,mat('#8d6255',.24),[0,.227,.253],[.032,.036,.015]);
    const seal=handProp(rightArm,.07);
    cylinder(seal,brass,[0,.02,0],.026,.026,.19);
    sphere(seal,mat('#eee0b4'),[0,.13,0],[.052,.048,.052]);
  } else if (role === 'guard') {
    // Domed nasal helmet, soft quilted surcoat, and a painted kite shield.
    const helmetGeo=geo('helmet',()=>new THREE.SphereGeometry(.304,20,12,0,Math.PI*2,0,Math.PI/2));
    mesh(head,helmetGeo,iron,[0,.055,-.012],[1,.9,1]);
    cylinder(head,iron,[0,.065,-.012],.307,.307,.04);
    box(head,iron,[0,.009,.287],[.042,.17,.025]);
    for (const x of [-.287,.287]) sphere(head,iron,[x,-.037,-.002],[.027,.12,.115]);
    for (let y=.71;y<.9;y+=.07) box(upper,trim,[0,y,.181],[.31,.015,.018]);
    const shield=handProp(rightArm,.13);
    shield.rotation.z=-.14;
    shaped(shield,leather,[[-.18,.19],[.18,.19],[.17,-.07],[0,-.26],[-.17,-.07]],.032,[0,0,0],.02);
    shaped(shield,mat('#738b80'),[[-.15,.16],[.15,.16],[.14,-.06],[0,-.22],[-.14,-.06]],.02,[0,0,.035],.008);
    box(shield,cream,[0,-.01,.068],[.036,.32,.008]);
    box(shield,cream,[0,.047,.069],[.25,.035,.008]);
    sphere(shield,brass,[0,.047,.079],[.036,.036,.022]);
    for (const [x,y] of [[-.13,.13],[.13,.13],[-.12,-.06],[.12,-.06],[0,-.17]]) sphere(shield,brass,[x,y,.063],[.012,.012,.009]);
    const scabbard=box(upper,leather,[-.24,.46,-.08],[.055,.36,.065]);
    scabbard.rotation.z=-.17;
    cylinder(upper,wood,[-.213,.69,-.08],.025,.025,.12);
    box(upper,iron,[-.22,.625,-.08],[.14,.025,.075]);
  } else if (role === 'chaplain') {
    // Tonsure and a warm linen stole distinguish the chaplain from other robes.
    sphere(head,skin,[0,.29,-.035],[.14,.027,.125]);
    for (const x of [-.09,.09]) {
      box(upper,cream,[x,.68,.206],[.064,.48,.019]);
      box(upper,brass,[x,.49,.222],[.036,.012,.007]);
      box(upper,brass,[x,.49,.223],[.011,.044,.008]);
    }
    const pendant=ring(upper,brass,[0,.855,.184],.064,.005);
    pendant.scale.y=.9;
    box(upper,brass,[0,.758,.211],[.024,.089,.012]);
    box(upper,brass,[0,.775,.212],[.071,.021,.013]);
    const volume=book(handProp(rightArm,.105),'#845d49');
    volume.rotation.z=-.13;
    box(volume,brass,[0,0,.051],[.015,.11,.009]);
    box(volume,brass,[0,.019,.052],[.079,.015,.009]);
  } else if (role === 'cook') {
    apron('#e8dbc2');
    cylinder(head,cream,[0,.24,0],.246,.254,.12);
    for (let i=0;i<5;i++) {
      const angle=i*Math.PI*2/5;
      sphere(head,cream,[Math.sin(angle)*.14,.325,Math.cos(angle)*.13],[.135,.127,.128]);
    }
    sphere(head,cream,[0,.36,0],[.14,.13,.13]);
    const spoon=handProp(rightArm,.10);
    spoon.rotation.z=-.25;
    cylinder(spoon,wood,[0,.15,0],.018,.021,.41);
    sphere(spoon,wood,[0,.38,0],[.065,.09,.025]);
    sphere(spoon,mat('#bf9464'),[0,.383,.023],[.045,.063,.008]);
    for(const side of [-1,1]) {
      const moustache=sphere(head,hair,[side*.041,-.079,.236],[.045,.018,.022]);
      moustache.rotation.z=side*.2;
    }
  } else if (role === 'steward') {
    sphere(head,mat('#70818b'),[.03,.226,-.025],[.284,.105,.258]);
    const band=cylinder(head,leather,[0,.175,-.015],.26,.27,.055);
    band.scale.z=.93;
    sphere(head,brass,[.145,.19,.215],[.028,.027,.016]);
    const feather=shaped(head,cream,[[0,0],[.02,.17],[.061,.235],[.074,.10],[.042,-.02]],.012,[-.17,.21,.02],.005);
    feather.rotation.z=.22;
    // Two fine brass spectacles are real geometry, including their bridge.
    for(const side of [-1,1]) ring(head,brass,[side*.103,.004,.254],.047,.006);
    box(head,brass,[0,.01,.26],[.11,.008,.008]);
    const ledger=book(handProp(rightArm,.105),'#647880');
    ledger.rotation.z=-.16;
    for(let i=0;i<3;i++)box(ledger,cream,[-.014,.04-i*.029,.052],[.091-i*.014,.006,.007]);
    const keyring=ring(upper,brass,[-.21,.56,.19],.037,.008);
    for(let i=0;i<3;i++) {
      const x=-.235+i*.025, y=.466+(i%2)*.022;
      cylinder(upper,brass,[x,y,.19],.007,.007,.105,8);
      box(upper,brass,[x+.012,y-.042,.19],[.029,.016,.017]);
    }
    keyring.rotation.z=.2;
  } else if (role === 'smith') {
    apron('#9a7352',.35);
    // Rolled sleeves, a square beard, leather work cap, and a small iron hammer.
    sphere(head,mat('#7b624b'),[0,.22,-.034],[.271,.095,.232]);
    cylinder(head,leather,[0,.178,-.025],.254,.27,.047);
    sphere(head,hair,[0,-.151,.137],[.172,.10,.102]);
    for(const side of [-1,1]) {
      const beard=sphere(head,hair,[side*.055,-.083,.224],[.058,.025,.029]);
      beard.rotation.z=side*.13;
    }
    for(const x of [-.12,.12])sphere(upper,brass,[x,.82,.21],[.012,.012,.009]);
    const hammer=handProp(rightArm,.09);
    hammer.rotation.z=-.20;
    cylinder(hammer,wood,[0,.13,0],.023,.027,.34);
    const hammerHead=box(hammer,iron,[0,.30,0],[.225,.10,.09]);
    hammerHead.rotation.z=.03;
    for(const x of [-.105,.105])box(hammer,dark,[x,.30,0],[.017,.106,.097]);
    const pouch=sphere(upper,leather,[-.236,.49,.08],[.067,.09,.068]);
    pouch.rotation.z=-.12;
    box(upper,brass,[-.238,.51,.144],[.033,.026,.011]);
  } else if (role === 'scribe') {
    // A soft indigo cap and folded shoulder cape frame the scribe's quiet silhouette.
    const blue = mat('#657e96');
    sphere(head,blue,[-.045,.24,-.025],[.30,.12,.26]);
    const band = cylinder(head,trim,[0,.183,-.012],.257,.267,.042);
    band.scale.z = .94;
    sphere(head,blue,[-.215,.25,-.025],[.094,.07,.10]);
    shaped(upper,blue,[[-.21,.95],[.21,.95],[.30,.70],[.11,.73],[0,.64],[-.11,.73],[-.30,.70]],.028,[0,0,-.16],.014);
    for (const side of [-1,1]) {
      const fold = sphere(upper,blue,[side*.185,.891,.055],[.136,.055,.184]);
      fold.rotation.z=side*.26;
    }
    sphere(upper,brass,[0,.895,.205],[.029,.029,.014]);
    const volume=book(handProp(rightArm,.105),'#96775b',1.13);
    volume.rotation.z=-.14;
    box(volume,mat('#b35d50'),[.036,-.11,.045],[.027,.12,.008]);
    for(let i=0;i<3;i++)box(volume,brass,[-.022,.045-i*.028,.052],[.084-i*.014,.005,.007]);
    const quill=handProp(leftArm,.10);
    quill.rotation.z=.30;
    cylinder(quill,wood,[0,.14,0],.006,.009,.36,8);
    const plume=shaped(quill,cream,[[0,.09],[-.063,.18],[-.075,.31],[-.024,.43],[.034,.36],[.045,.23]],.010,[0,0,0],.006);
    plume.rotation.y=-.18;
    for(let i=0;i<4;i++){
      const vein=box(quill,trim,[-.019,.17+i*.046,.013],[.067,.005,.004]);
      vein.rotation.z=.50;
    }
    cylinder(upper,mat('#455f68'),[-.236,.48,.08],.039,.047,.085);
    cylinder(upper,brass,[-.236,.53,.08],.035,.04,.018);
  } else if (role === 'healer') {
    // Linen head covering, pale apron and a little herb basket give a distinct garden silhouette.
    apron('#ded5b4',.25);
    sphere(head,mat('#ddd2ac'),[0,.222,-.041],[.282,.112,.24]);
    const headBand=cylinder(head,trim,[0,.175,-.015],.268,.269,.038);
    headBand.scale.z=.94;
    shaped(head,trim,[[-.18,.23],[.18,.23],[.24,-.21],[-.24,-.21]],.024,[0,0,-.20],.01);
    for(const side of [-1,1])for(let i=0;i<3;i++)sphere(head,hair,[side*(.235-.008*i),-.08-i*.065,.06],[.044,.052,.045]);
    const herbPin=sphere(upper,mat('#607a4d'),[-.093,.78,.213],[.025,.054,.008]);
    herbPin.rotation.z=-.45;
    const basket=handProp(rightArm,.13);
    basket.position.y=-.29;
    const wicker=mat('#b68e58');
    cylinder(basket,wicker,[.025,-.075,.02],.128,.095,.18);
    const rim=ring(basket,trim,[.025,.018,.02],.127,.012);rim.rotation.x=Math.PI/2;
    const handle=ring(basket,wicker,[.025,.10,.02],.118,.013);handle.scale.y=1.05;
    cylinder(basket,mat('#6c6c42'),[.025,.012,.02],.113,.113,.006);
    for(let i=0;i<5;i++){
      const angle=i*Math.PI*2/5;
      const stem=new THREE.Group();stem.position.set(.025+Math.cos(angle)*.062,.03,.02+Math.sin(angle)*.055);stem.rotation.z=Math.cos(angle)*.28;basket.add(stem);
      cylinder(stem,mat('#637c4c'),[0,.075,0],.005,.006,.15,6);
      for(const side of [-1,1]){
        const leaf=sphere(stem,mat(i%2?'#91a264':'#718a54'),[side*.027,.069+side*.018,0],[.032,.053,.012]);leaf.rotation.z=side*-.65;
      }
      if(i%2===0)sphere(stem,mat('#b2a0be'),[0,.159,0],[.018,.027,.018]);
    }
    const flask=handProp(leftArm,.08);
    sphere(flask,mat('#9da883',.05,.38),[0,.015,.015],[.059,.072,.055]);
    cylinder(flask,mat('#a8b492'),[0,.083,.015],.026,.03,.045);
    cylinder(flask,wood,[0,.111,.015],.024,.026,.018);
  } else if (role === 'weaver') {
    // Madder-dyed kerchief and a striped skirt, carrying a real shuttle and wound yarn.
    const ochre=mat('#b78357'), rose=mat('#ae7869');
    sphere(head,ochre,[0,.225,-.03],[.285,.115,.242]);
    const band=cylinder(head,trim,[0,.172,-.012],.27,.27,.036);band.scale.z=.94;
    shaped(head,ochre,[[-.20,.22],[.20,.22],[.17,-.26],[.03,-.12],[-.16,-.24]],.018,[0,0,-.215],.009);
    for(const side of [-1,1]){
      sphere(head,ochre,[side*.065,-.24,-.12],[.074,.042,.049]);
      const tie=shaped(head,ochre,[[0,0],[.08,-.12],[-.025,-.16],[-.035,-.025]],.012,[side*.06,-.24,-.10],.004);tie.rotation.z=side*.45;
    }
    apron('#e4cfad',.26);
    for(const x of [-.12,-.06,0,.06,.12])box(upper,rose,[x,.37,.219],[.014,.18,.009]);
    for(const y of [.29,.33,.41])box(upper,ochre,[0,y,.225],[.27,.009,.008]);
    for(const side of [-1,1]){
      const scarf=box(upper,ochre,[side*.079,.814,.207],[.05,.22,.020]);scarf.rotation.z=side*.17;
    }
    const yarn=handProp(rightArm,.11);
    sphere(yarn,rose,[0,.025,.015],[.106,.103,.092]);
    for(let i=0;i<5;i++){
      const strand=ring(yarn,mat('#d9ab95'),[0,.025,.015],.097+i%2*.005,.006);
      strand.rotation.y=-.7+i*.33;strand.rotation.z=.45+i*.19;strand.scale.y=.98;
    }
    const thread=box(yarn,trim,[.04,-.12,.021],[.009,.15,.009]);thread.rotation.z=.2;
    const shuttle=handProp(leftArm,.10);shuttle.rotation.z=-.45;
    shaped(shuttle,wood,[[0,.20],[.057,.11],[.057,-.11],[0,-.20],[-.057,-.11],[-.057,.11]],.043,[0,0,-.02],.008);
    box(shuttle,mat('#76563b'),[0,0,.03],[.054,.205,.009]);
    for(let i=0;i<6;i++)box(shuttle,cream,[0,-.073+i*.029,.041],[.055,.020,.016]);
    sphere(upper,rose,[.22,.55,.11],[.045,.05,.039]);
  }

  // Keep public group scale at one; hats never change the caller's castle scale.
  const bodyRoot = new THREE.Group();
  for (const child of [...group.children]) bodyRoot.add(child);
  group.add(bodyRoot);
  const bounds = new THREE.Box3().setFromObject(bodyRoot);
  const height = bounds.max.y - bounds.min.y;
  const modelScale = 1.55 / height;
  bodyRoot.scale.setScalar(modelScale);
  bodyRoot.position.y = -bounds.min.y * modelScale;
  group.userData.roleId = role;
  let walkBlend = 0;
  let waveBlend = 0;
  let disposed = false;
  const seed = Object.keys(looks).indexOf(role) * .7;

  return {
    group,
    update(dt = 0, time = 0, {walking = false, waving = false} = {}) {
      if (disposed) return;
      const smoothing = 1 - Math.exp(-Math.min(Math.max(dt, 0), .1) * 12);
      walkBlend += ((walking ? 1 : 0) - walkBlend) * smoothing;
      waveBlend += ((waving && !walking ? 1 : 0) - waveBlend) * smoothing;
      const stride = Math.sin(time * 8.6);
      leftLeg.rotation.x = stride * .48 * walkBlend;
      rightLeg.rotation.x = -stride * .48 * walkBlend;
      leftArm.rotation.x = -stride * .37 * walkBlend;
      rightArm.rotation.x = stride * .22 * walkBlend;
      leftArm.rotation.z = -.08 + (1.95 + Math.sin(time * 7.2) * .20) * waveBlend;
      rightArm.rotation.z = .09;
      upper.position.y = Math.sin(time * 2.2 + seed) * .006 + Math.abs(stride) * .018 * walkBlend;
      head.rotation.z = Math.sin(time * 1.7 + seed) * .022 * (1 - walkBlend) - .075 * waveBlend;
      head.rotation.y = Math.sin(time * .8 + seed) * .035 * (1 - walkBlend);
      const blinkPhase = (time + seed) % 4.7;
      const blink = blinkPhase > 4.51 ? Math.max(.09, Math.abs(blinkPhase - 4.605) / .095) : 1;
      for (const eye of eyes) eye.scale.y = .034 * blink;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      group.removeFromParent();
      for (const geometry of geometries.values()) geometry.dispose();
      for (const geometry of uniqueGeometries) geometry.dispose();
      for (const material of materials.values()) material.dispose();
      group.clear();
    },
  };
}
