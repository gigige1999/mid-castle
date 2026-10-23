import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { interiorLayouts } from './room-layouts.js';
import { createCastleWalker } from './walking.js';
import { createLifeWorld } from './life-world.js';
import { createInteriorExpansion } from './interior-expansion.js';

const C = { stone:0xd3c6ae, light:0xe1d6bf, edge:0xb3a48c, roof:0x69736c, roofLight:0x828b7e, timber:0x806346, wood:0xb99a70, dark:0x403b31, green:0x829064, grass:0xa6ae83, soil:0x8a795c, path:0xd3c09a, water:0x91aca2, flag:0x98594a };
let seed=812; const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const mat=(color,more={})=>new THREE.MeshStandardMaterial({color,roughness:1,...more});
function texture(kind){
 const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');
 ctx.fillStyle={stone:'#eee9dc',grass:'#d3d7bb',wood:'#e5d4b6',roof:'#d8ded5',cloth:'#e6d8be'}[kind]||'#eee9dc';ctx.fillRect(0,0,256,256);
 if(kind==='stone')for(let row=0;row<8;row++)for(let col=-1;col<5;col++){
  const x=col*64+(row%2)*32,y=row*32,v=Math.floor(211+random()*24);
  ctx.fillStyle=`rgb(${v+12},${v+7},${v-8})`;ctx.fillRect(x+1,y+1,62,30);
  ctx.fillStyle='rgba(248,238,211,.24)';ctx.fillRect(x+2,y+2,60,1);
  ctx.fillStyle='rgba(87,76,56,.14)';ctx.fillRect(x+2,y+29,61,2);
  for(let j=0;j<4;j++){ctx.fillStyle=`rgba(83,71,50,${random()*.08})`;ctx.fillRect(x+random()*58,y+random()*28,2+random()*12,1+random()*3);}
 }
 if(kind==='wood')for(let i=0;i<90;i++){
  ctx.strokeStyle=`rgba(84,58,33,${.035+random()*.13})`;ctx.lineWidth=.4+random();ctx.beginPath();const x=random()*256;ctx.moveTo(x,0);ctx.bezierCurveTo(x+8,60,x-6,170,x+3,256);ctx.stroke();
 }
 if(kind==='roof')for(let row=0;row<16;row++)for(let col=-1;col<9;col++){
  const v=204+Math.floor(random()*30);ctx.fillStyle=`rgb(${v},${v+3},${v-2})`;ctx.fillRect(col*32+(row%2)*16+1,row*16+1,31,14);
 }
 if(kind==='cloth')for(let i=0;i<256;i+=3){ctx.fillStyle='rgba(55,35,21,.07)';ctx.fillRect(i,0,1,256);ctx.fillRect(0,i,256,1);}
 for(let i=0;i<4800;i++){ctx.fillStyle=`rgba(${random()>.5?'255,249,224':'49,41,30'},${random()*.1})`;ctx.fillRect(random()*256,random()*256,1+random()*2,1+random()*2);}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.repeat.set(kind==='grass'?8:kind==='stone'?2:1,kind==='grass'?8:kind==='stone'?2:1);t.anisotropy=4;return t;
}
export function createCastle(container, callbacks={}){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#f4efe3');
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;container.appendChild(renderer.domElement);
 const camera=new THREE.OrthographicCamera(-14,14,11,-11,.1,150);camera.position.set(21,22,28);camera.lookAt(0,0,0);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.065;controls.enablePan=false;controls.minZoom=.7;controls.maxZoom=5.6;controls.minPolarAngle=.14;controls.maxPolarAngle=Math.PI*.43;controls.target.set(0,.5,0);controls.rotateSpeed=.65;controls.zoomSpeed=.65;controls.autoRotateSpeed=.28;
 scene.add(new THREE.HemisphereLight(0xfff1d9,0x96937b,2.05));const sun=new THREE.DirectionalLight(0xfff0d4,2.8);sun.position.set(-12,23,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-17;sun.shadow.camera.right=17;sun.shadow.camera.top=17;sun.shadow.camera.bottom=-17;sun.shadow.camera.near=1;sun.shadow.camera.far=65;sun.shadow.normalBias=.025;sun.shadow.bias=-.0002;sun.shadow.radius=4;scene.add(sun);const fill=new THREE.DirectionalLight(0xe1e7dd,.85);fill.position.set(15,8,-12);scene.add(fill);
 const world=new THREE.Group();scene.add(world);const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:0x7d8067,opacity:.13}));ground.rotation.x=-Math.PI/2;ground.position.y=-1.63;ground.receiveShadow=true;scene.add(ground);
 const stoneTex=texture('stone'),woodTex=texture('wood'),roofTex=texture('roof'),clothTex=texture('cloth');const M={stone:mat(C.stone,{map:stoneTex,bumpMap:stoneTex,bumpScale:.055}),light:mat(C.light),edge:mat(C.edge),roof:mat(C.roof,{map:roofTex}),roofLight:mat(C.roofLight),timber:mat(C.timber,{map:woodTex}),wood:mat(C.wood,{map:woodTex}),dark:mat(C.dark),grass:mat(C.grass,{map:texture('grass')}),soil:mat(C.soil),path:mat(C.path),water:mat(C.water,{roughness:.52,metalness:.06}),green:mat(C.green),leaf1:mat(0x647e51),leaf2:mat(0x869666),leaf3:mat(0x9ca477),leaf4:mat(0x526d4c),flag:mat(C.flag,{side:THREE.DoubleSide}),cloth:mat(0xc2ad83,{map:clothTex}),rug:mat(0xa56552,{map:clothTex}),linen:mat(0xe8dab9,{map:clothTex}),blue:mat(0x82969a,{map:clothTex}),brass:mat(0xb3965d,{metalness:.65,roughness:.6}),flame:mat(0xffc26b,{emissive:0xff8a2a,emissiveIntensity:1.5,toneMapped:false}),pottery:mat(0xbe9871),parchment:mat(0xe8d9b6),iron:mat(0x686b60,{metalness:.35,roughness:.75}),veg:mat(0x728452),rock:mat(0xafb19c)};
 const areas={};const roofParts=[];const cutawayParts=[];const flags=[];const defaultGroup=new THREE.Group();world.add(defaultGroup);let active=defaultGroup;
 function mesh(geo,material,x=0,y=0,z=0,parent=active){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 const box=(w,h,d,x,y,z,m=M.stone,p=active)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z,p);
 const cyl=(r1,r2,h,x,y,z,m=M.stone,n=16,p=active)=>mesh(new THREE.CylinderGeometry(r1,r2,h,n),m,x,y,z,p);
 const cone=(r,h,x,y,z,m=M.roof,n=16,p=active)=>mesh(new THREE.ConeGeometry(r,h,n),m,x,y,z,p);
 const sphere=(r,x,y,z,m=M.leaf1,p=active)=>mesh(new THREE.IcosahedronGeometry(r,1),m,x,y,z,p);
 function area(id,fn){const old=active;const g=new THREE.Group();g.userData.room=id;areas[id]=g;world.add(g);active=g;fn();active=old;return g;}
 function roomOwner(group=active){while(group){if(group.userData.room)return group.userData.room;group=group.parent;}return null;}
 function registerRoof(group){group.userData.room=roomOwner();group.userData.openValue=0;roofParts.push(group);}
 function cutaway(floor,fn){const previous=active,g=new THREE.Group();g.userData.room=roomOwner();g.userData.openValue=0;world.add(g);active=g;fn();for(const child of g.children)child.position.y-=floor;g.position.y=floor;cutawayParts.push(g);active=previous;}

 function lineBetween(a,b,r=.022,m=M.timber,p=active){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av);const ob=cyl(r,r,d.length(),0,0,0,m,6,p);ob.position.copy(av.add(bv).multiplyScalar(.5));ob.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return ob;}
 function footprint(points,y,h,m,bevel=.15){const s=new THREE.Shape();points.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:bevel>0,bevelSegments:1,steps:1,bevelSize:bevel,bevelThickness:bevel});g.rotateX(-Math.PI/2);return mesh(g,m,0,y,0);}
 const outer=[[-8.7,-5.7],[-7.4,-7.2],[-2.5,-7.6],[4.1,-7.5],[7.6,-6.2],[8.9,-3.9],[8.9,4.8],[7.7,6.4],[3.2,7.0],[-1.8,7.3],[-7.7,6.2],[-8.9,3.4]];
 footprint(outer,-1.33,.43,mat(0xaaa992),.18);footprint(outer.map(([x,z])=>[x*.99,z*.99]),-.86,.26,M.grass,.15);
 area('moat',()=>{const points=outer.map(([x,z])=>[x*.935,z*.935]);footprint(points,-.52,.04,M.water,.07);});
 const island=[[-7.2,-4.6],[-6.2,-5.6],[-1.3,-5.8],[5.8,-5.5],[7.25,-4.1],[7.3,4.2],[6.3,5.7],[1,6.3],[-5.3,5.6],[-7.25,4.2]];
 footprint(island,-.47,.57,M.rock,.16);footprint(island.map(([x,z])=>[x*.993,z*.993]),.02,.09,M.grass,.08);
 const court=[[-5.9,-4.1],[5.9,-4.1],[6,4.2],[.8,5.3],[-5.9,4.5]];footprint(court,.12,.03,mat(0xbbb792),.04);
 // Tiny shore stones, scattered tufts and curved ripples make the landscape feel like a physical diorama.
 for(let i=0;i<125;i++){const idx=Math.floor(random()*island.length),a=island[idx],b=island[(idx+1)%island.length],t=random();let x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;const r=.08+random()*.18;const ob=sphere(r,x,-.02,z,M.rock);ob.scale.set(1.4,.7,1);}
 for(let i=0;i<70;i++){const x=(random()-.5)*15.4,z=(random()-.5)*12.4;if(Math.abs(x)<6.5&&Math.abs(z)<4.8)continue;const d=Math.abs(x)<7.35&&Math.abs(z)<5.8;if(d)continue;const ob=box(.15+random()*.35,.009,.018,x,-.431,z,mat(0xb6c9b9));ob.rotation.y=random()*.5;}
 // Walkways.
 box(1.12,.025,8.7,-.8,.205,.1,M.path);box(7.7,.025,.75,-1,.21,-.1,M.path);box(6.8,.025,.62,-.5,.21,3.65,M.path);
 function archPanel(w,h,material,x,y,z,parent=active){
  const radius=w/2,shoulder=h-radius,s=new THREE.Shape();s.moveTo(-radius,0);s.lineTo(radius,0);s.lineTo(radius,shoulder);s.absarc(0,shoulder,radius,0,Math.PI,false);s.lineTo(-radius,0);
  return mesh(new THREE.ExtrudeGeometry(s,{depth:.028,bevelEnabled:false,curveSegments:10}),material,x,y,z,parent);
 }
 function windowAt(x,y,z,side='front',w=.18,h=.56){
  const g=new THREE.Group();active.add(g);g.position.set(x,y-h/2,z);if(side==='side')g.rotation.y=Math.PI/2;
  archPanel(w,h,M.dark,0,0,0,g);box(w+.13,.055,.11,0,-.015,.018,M.light,g);
  for(const sign of [-1,1])box(.045,h-w*.45,.06,sign*(w*.5+.027),(h-w*.45)/2,.015,M.light,g);
  for(let n=0;n<7;n++){const a=n*Math.PI/6,o=box(.052,.06,.065,Math.cos(a)*(w*.5+.03),h-w*.5+Math.sin(a)*(w*.5+.03),.015,M.light,g);o.rotation.z=a-Math.PI/2;}
  box(.021,h*.77,.025,0,h*.39,.045,M.timber,g);
 }
 function wall(x1,z1,x2,z2,height=2.35){const length=Math.hypot(x2-x1,z2-z1),mx=(x1+x2)/2,mz=(z1+z2)/2,angle=-Math.atan2(z2-z1,x2-x1);const g=new THREE.Group();active.add(g);const old=active;active=g;box(length,height,.46,0,height/2+.18,0,M.stone);box(length,.13,.62,0,height+.19,0,M.light);box(length,.14,.64,0,.35,0,M.edge);box(length,.1,.5,0,1.38,0,M.edge);for(let x=-length/2+.15;x<length/2;x+=.58)box(.31,.43,.54,x,height+.44,0,M.light);for(let x=-length/2+.55;x<length/2;x+=1.2){box(.08,.45,.012,x,1.6,.239,M.dark);box(.16,height-.3,.13,x,.9+.2,0.3,M.edge);}g.position.set(mx,0,mz);g.rotation.y=angle;active=old;}
 function tower(x,z,r=.73,h=3.7,hasRoof=false){cyl(r+.12,r+.24,.4,x,.31,z,M.edge);cyl(r,r+.08,h,x,h/2+.42,z,M.stone,24);cyl(r+.09,r+.09,.16,x,h+.42,z,M.light,24);cyl(r+.1,r+.1,.13,x,h+.11,z,M.edge,24);cyl(r*.83,r*.83,.045,x,h+.48,z,M.soil,24);for(let n=0;n<11;n++){let a=n/11*Math.PI*2;const b=box(.27,.39,.26,x+Math.sin(a)*r*.88,h+.67,z+Math.cos(a)*r*.88,M.light);b.rotation.y=a;}for(let n=0;n<4;n++){let a=n/4*Math.PI*2+.3;const b=box(.115,.58,.022,x+Math.sin(a)*(r+.015),h-.4,z+Math.cos(a)*(r+.015),M.dark);b.rotation.y=a;const b2=box(.11,.4,.022,x+Math.sin(a)*(r+.04),h-1.7,z+Math.cos(a)*(r+.04),M.dark);b2.rotation.y=a;}for(let n=1;n<4;n++)cyl(r+.018,r+.018,.045,x,.43+n*(h/4),z,M.edge,24);if(hasRoof){const roof=new THREE.Group();world.add(roof);cone(r+.16,1.55,x,h+1.23,z,M.roof,24,roof);cyl(.035,.05,.4,x,h+2.15,z,M.iron,6,roof);registerRoof(roof);}return h;}
 area('tower',()=>{wall(-6.25,-4.55,6.15,-4.55);wall(-6.25,-4.55,-6.4,4.45);wall(6.15,-4.55,6.4,4.8);wall(-6.4,4.45,-1.35,5.2);wall(1.35,5.2,6.4,4.8);tower(-6.25,-4.55,.8,4.1);tower(6.15,-4.55,.8,4.45,true);tower(-6.4,4.45,.8,3.6);tower(6.4,4.8,.87,4.0);});
 area('gate',()=>{tower(-1.2,5.25,.57,3.2);tower(1.2,5.25,.57,3.2);box(1.7,1.05,.75,0,2.8,5.25,M.stone);box(1.7,.12,.9,0,3.4,5.25,M.light);for(let i=0;i<5;i++)box(.24,.35,.8,-.65+i*.325,3.62,5.25,M.light);box(1.3,1.95,.2,0,1.12,5.1,M.dark);for(let i=0;i<7;i++)box(.11,1.87,.08,-.57+i*.19,1.12,5.25,M.wood);box(1.25,.08,.1,0,.55,5.31,M.iron);box(1.25,.08,.1,0,1.45,5.31,M.iron);for(let i=0;i<15;i++)box(1.38,.11,.15,0,.2,5.55+i*.17,M.wood);for(const x of [-.66,.66]){box(.085,.13,2.8,x,.06,6.8,M.timber);lineBetween([x,2.58,5.35],[x,.27,7.5],.017,M.iron);for(let z=6;z<7.9;z+=.8)box(.07,.6,.07,x,.45,z,M.timber);box(.08,.07,2.2,x,.73,6.85,M.wood);}});
 function roof(x,z,w,d,base,height,along='x'){const g=new THREE.Group();world.add(g);const geo=new THREE.BufferGeometry();const v=[-w/2,base,-d/2,w/2,base,-d/2,w/2,base,d/2,-w/2,base,d/2,-w/2,base+height,0,w/2,base+height,0];geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,w/3,0,w/3,d/3,0,d/3,0,d/6,w/3,d/6],2));geo.setIndex([0,4,5,0,5,1,3,2,5,3,5,4,0,3,4,1,5,2]);geo.computeVertexNormals();const body=mesh(geo,M.roof,x,0,z,g);box(w+.12,.085,.11,x,base+height+.04,z,M.roofLight,g);const steps=Math.ceil(height/.17);for(let j=1;j<steps;j++){let t=j/steps;for(let sign of [-1,1])box(w+.015,.025,.035,x,base+height*t,z+sign*d/2*(1-t),M.roofLight,g);}if(along==='z'){g.position.set(x,0,z);for(const ch of g.children)ch.position.sub(new THREE.Vector3(x,0,z));g.rotation.y=Math.PI/2;}registerRoof(g);return body;}
 function dormer(parent,x,y,z,w=.54){
  box(w,.34,.47,x,y+.17,z,M.stone,parent);archPanel(w*.42,.27,M.dark,x,y+.045,z+.241,parent);box(w*.55,.045,.07,x,y+.03,z+.255,M.light,parent);
  const g=new THREE.BufferGeometry(),ww=w*.65,dd=.3,base=y+.33,peak=y+.65;g.setAttribute('position',new THREE.Float32BufferAttribute([-ww,base,-dd,ww,base,-dd,ww,base,dd,-ww,base,dd,0,peak,-dd,0,peak,dd],3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1,.5,0,.5,1],2));g.setIndex([0,3,5,0,5,4,1,4,5,1,5,2,3,2,5,0,4,1]);g.computeVertexNormals();mesh(g,M.roofLight,x,0,z,parent);
  lineBetween([x-ww,base,z+dd],[x,peak,z+dd],.025,M.timber,parent);lineBetween([x,peak,z+dd],[x+ww,base,z+dd],.025,M.timber,parent);box(.055,.05,.68,x,peak+.01,z,M.roofLight,parent);
 }
 function house(x,z,w,d,h,{roofHeight=1,roofAlong='x'}={}){box(w,h,d,x,h/2+.25,z,M.stone);box(w+.08,.13,d+.08,x,.28,z,M.edge);box(w+.08,.12,d+.08,x,h+.25,z,M.timber);for(let xx=x-w/2+.16;xx<x+w/2;xx+=.65){box(.06,h,.05,xx,h/2+.25,z+d/2+.026,M.timber);if(xx>x-w/2+.3)windowAt(xx,h*.62+.25,z+d/2+.05,'front',.22,.4);}box(w,.055,.05,x,.8,z+d/2+.04,M.timber);box(.38,.86,.04,x,.67,z+d/2+.07,M.dark);box(.3,.8,.035,x,.64,z+d/2+.095,M.wood);roof(x,z,w+.3,d+.3,h+.31,roofHeight,roofAlong);}
 // Open interiors are under removable roofs, with floor plans and furniture modeled in 3D.
 function openHouse(x,z,w,d,h,fn,roofHeight=1){box(w,.17,d,x,.3,z,M.edge);box(w-.16,.055,d-.16,x,.41,z,M.wood);
 cutaway(.35,()=>{box(w,h,.16,x,h/2+.35,z-d/2,M.stone);box(w,h,.16,x,h/2+.35,z+d/2,M.stone);box(.16,h,d,x-w/2,h/2+.35,z,M.stone);box(.16,h,d,x+w/2,h/2+.35,z,M.stone);
 for(const side of [-1,1]){box(w+.13,.12,.22,x,h+.35,z+side*d/2,M.timber);box(.22,.12,d,x+side*w/2,h+.35,z,M.timber);}
 // Alternating corner quoins, small arched lights and an iron-strapped door
 // belong to the removable wall shell, leaving a clear interior when opened.
 for(const sx of [-1,1])for(const sz of [-1,1])for(let i=0;i<Math.floor(h/.17);i++)box(i%2?.2:.27,.135,i%2?.27:.2,x+sx*(w/2-.035),.45+i*.17,z+sz*(d/2-.035),i%3?M.light:M.edge);
 for(let xx=x-w/2+.38;xx<x+w/2-.2;xx+=.74)if(Math.abs(xx-x)>.3)windowAt(xx,h*.63+.35,z+d/2+.09,'front',.18,.35);
 windowAt(x+w/2+.09,h*.63+.35,z-.15,'side',.18,.37);
 const dh=Math.min(.82,h*.75),front=z+d/2+.087;
 archPanel(.41,dh,M.dark,x,.36,front);archPanel(.34,dh-.045,M.wood,x,.36,front+.029);
 for(const dx of [-.1,0,.1])box(.012,dh-.18,.013,x+dx,.38+(dh-.18)/2,front+.065,M.timber);
 for(const yy of [.52,.84]){box(.32,.035,.025,x,yy,front+.079,M.iron);for(const dx of [-.12,.12])sphere(.017,x+dx,yy,front+.101,M.brass);}
 const pull=mesh(new THREE.TorusGeometry(.033,.008,4,12),M.iron,x+.08,.71,front+.105);pull.rotation.x=.12;
 for(const sx of [-1,1]){box(.09,dh-.13,.11,x+sx*.25,.36+(dh-.13)/2,front,M.light);for(let i=0;i<4;i++)box(.08,.045,.13,x+sx*.25,.43+i*.16,front+.012,M.edge);}
 for(let i=0;i<9;i++){const a=i*Math.PI/8,o=box(.1,.1,.11,x+Math.cos(a)*.255,.36+dh-.205+Math.sin(a)*.255,front,M.light);o.rotation.z=a-Math.PI/2;}
 for(const sx of [-1,1])for(const zz of [z-d*.32,z+d*.32])lineBetween([x+sx*(w*.5+.045),h+.23,zz],[x+sx*(w*.5+.09),h+.43,zz+ .13],.025,M.timber);
 });
 const roofBody=roof(x,z,w+.28,d+.3,h+.43,roofHeight),roofGroup=roofBody.parent;
 // Pegged gable trusses and projecting eaves give each building a readable craft.
 for(const sx of [-1,1]){const xx=x+sx*(w*.5+.151);lineBetween([xx,h+.43,z-d*.5-.15],[xx,h+.43+roofHeight,z],.035,M.timber,roofGroup);lineBetween([xx,h+.43+roofHeight,z],[xx,h+.43,z+d*.5+.15],.035,M.timber,roofGroup);lineBetween([xx,h+.45,z-d*.5],[xx,h+.45,z+d*.5],.032,M.timber,roofGroup);lineBetween([xx,h+.45,z],[xx,h+.4+roofHeight,z],.026,M.timber,roofGroup);}
 for(const sign of [-1,1]){box(w+.38,.075,.085,x,h+.42,z+sign*(d*.5+.15),M.timber,roofGroup);for(let xx=x-w/2+.12;xx<x+w/2;xx+=.35)box(.065,.085,.16,xx,h+.38,z+sign*(d*.5+.1),M.wood,roofGroup);}
 for(let xx=x-w*.5;xx<x+w*.5;xx+=.19)box(.16,.055,.15,xx,h+.46+roofHeight,z,M.roofLight,roofGroup);
 if(w>3)for(const dx of [-w*.24,w*.24])dormer(roofGroup,x+dx,h+.43+roofHeight*.45,z+d*.28,.46);
 plankFloor(x,.441,z,w-.22,d-.22);fn();return roofGroup;}
 function table(x,y,z,w=1.4,d=.55){box(w,.09,d,x,y,z,M.wood);for(const dx of [-w*.36,w*.36])for(const dz of [-d*.3,d*.3])box(.07,.4,.07,x+dx,y-.23,z+dz,M.timber);for(const dz of [-d*.85,d*.85]){box(w,.065,.16,x,y-.16,z+dz,M.wood);for(const dx of [-w*.35,w*.35])box(.065,.27,.065,x+dx,y-.32,z+dz,M.timber);}}
 function bed(x,y,z,royal=false){
  const w=royal?.78:.63,d=royal?1.22:1.08;
  box(w,.2,d,x,y,z,M.timber);box(w-.07,.13,d-.1,x,y+.16,z,M.linen);
  box(w-.06,.045,d*.57,x,y+.25,z+d*.14,royal?M.rug:M.blue);box(w-.15,.11,.23,x,y+.26,z-d*.32,M.linen);
  box(w+.03,.5,.07,x,y+.12,z-d/2,M.wood);box(w+.03,.3,.06,x,y+.04,z+d/2,M.timber);
  for(const dx of [-1,1])for(const dz of [-1,1]){box(.055,royal?1.18:.28,.055,x+dx*w*.48,y+(royal?.45:-.13),z+dz*d*.49,M.timber);if(royal)sphere(.05,x+dx*w*.48,y+1.06,z+dz*d*.49,M.brass);}
  if(royal){for(const side of [-1,1])box(.045,.13,d,x+side*w*.48,y+.96,z,M.rug);box(w,.13,.045,x,y+.96,z-d*.49,M.rug);}
 }
 function barrel(x,y,z,s=1){cyl(.18*s,.18*s,.42*s,x,y+.21*s,z,M.wood,12);for(let yy of [.06,.31])cyl(.186*s,.186*s,.035*s,x,y+yy*s,z,M.iron,12);cyl(.16*s,.16*s,.018*s,x,y+.425*s,z,M.timber,12);}
 function crate(x,y,z,s=.35){box(s,s,s,x,y+s/2,z,M.wood);for(const yy of [y+.045,y+s-.045])box(s+.015,.04,s+.015,x,yy,z,M.timber);}
 function rug(x,y,z,w,d,color=M.rug){box(w,.012,d,x,y,z,color);for(const xx of [-1,1])box(.035,.004,d-.08,x+xx*(w/2-.06),y+.009,z,M.cloth);for(const zz of [-1,1]){box(w-.08,.004,.035,x,y+.009,z+zz*(d/2-.06),M.cloth);for(let dx=-w/2+.06;dx<w/2;dx+=.1)box(.027,.009,.08,x+dx,y,z+zz*(d/2+.025),M.linen);}}
 function candle(x,y,z){cyl(.075,.1,.035,x,y,z,M.brass,10);cyl(.021,.029,.12,x,y+.075,z,M.linen,8);const f=sphere(.025,x,y+.16,z,M.flame);f.scale.y=1.7;}
 function pot(x,y,z,s=.12,m=M.pottery){cyl(s*.7,s*.88,s*1.5,x,y+s*.75,z,m,10);cyl(s*.56,s*.6,.022,x,y+s*1.5,z,M.dark,10);}
 function shelf(x,y,z,w=.8,h=.72){for(const dx of [-1,1])box(.045,h,.22,x+dx*w*.47,y+h/2,z,M.timber);for(const yy of [.06,h*.52,h])box(w,.035,.25,x,y+yy,z,M.wood);for(let i=0;i<3;i++){pot(x-w*.29+i*w*.29,y+.08,z,.065+i*.012);pot(x-w*.29+i*w*.29,y+h*.54,z,.07,M.edge);}}
 function hearth(x,y,z,w=.55){box(w,.06,.4,x,y,z,M.edge);for(const side of [-1,1])box(.1,.43,.38,x+side*(w/2-.05),y+.2,z,M.stone);box(w,.1,.41,x,y+.45,z,M.stone);box(w-.15,.3,.06,x,y+.2,z-.15,M.dark);for(const dz of [-.07,.06]){const log=cyl(.045,.045,w*.7,x,y+.08,z+dz,M.timber,7);log.rotation.z=Math.PI/2;}for(let i=0;i<3;i++){const f=cone(.042,.13+random()*.05,x+(i-1)*.1,y+.18,z,M.flame,6);f.rotation.z=(i-1)*.2;}}
 function platter(x,y,z,r=.07){cyl(r,r,.014,x,y,z,M.brass,12);sphere(r*.48,x,y+.03,z,M.path);}
 function book(x,y,z,w=.2,d=.25,open=false){
  box(w+.025,.045,d+.02,x,y,z,M.rug);box(w,.026,d-.025,x,y+.029,z,M.parchment);
  if(open){box(.012,.012,d-.03,x,y+.05,z,M.timber);for(const dx of [-1,1])for(let i=0;i<4;i++)box(w*.32,.004,.008,x+dx*w*.24,y+.047,z-d*.29+i*d*.16,M.edge);}
  else box(w+.025,.015,d+.02,x,y+.048,z,M.blue);
 }
 function chest(x,y,z,w=.46,d=.3){
  box(w,.27,d,x,y+.135,z,M.wood);box(w+.025,.07,d+.02,x,y+.305,z,M.timber);
  for(const dx of [-w*.32,w*.32]){box(.035,.27,d+.012,x+dx,y+.14,z,M.iron);box(.035,.012,d+.03,x+dx,y+.347,z,M.iron);}
  box(.055,.07,.018,x,y+.245,z+d/2+.015,M.brass);
 }
 function chair(x,y,z,angle=0){
  const g=new THREE.Group();active.add(g);box(.28,.055,.29,0,.31,0,M.wood,g);box(.29,.34,.045,0,.5,-.125,M.timber,g);box(.22,.025,.22,0,.35,0,M.rug,g);
  for(const xx of [-.1,.1])for(const zz of [-.1,.1])box(.035,.3,.035,xx,.15,zz,M.timber,g);g.position.set(x,y,z);g.rotation.y=angle;
 }
 function sack(x,y,z,s=.13){const body=sphere(s,x,y+s*.85,z,M.cloth);body.scale.set(.88,1.2,.8);cyl(s*.22,s*.35,s*.25,x,y+s*1.98,z,M.timber,7);}
 function jug(x,y,z,s=.065){pot(x,y,z,s,M.pottery);cyl(s*.35,s*.45,s*.3,x,y+s*1.65,z,M.pottery,8);const h=mesh(new THREE.TorusGeometry(s*.44,s*.11,4,8),M.pottery,x+s*.72,y+s*.94,z);h.rotation.y=Math.PI/2;}
 function scroll(x,y,z,length=.19,angle=0){const o=cyl(.028,.028,length,x,y,z,M.parchment,8);o.rotation.z=Math.PI/2;o.rotation.y=angle;box(.027,.016,.055,x,y+.028,z,M.rug);}
 function plankFloor(x,y,z,w,d){for(let xx=x-w/2+.12;xx<x+w/2;xx+=.22)box(.008,.005,d,xx,y,z,M.timber);for(let zz=z-d/2+.35;zz<z+d/2;zz+=.8)for(let xx=x-w/2+.11;xx<x+w/2;xx+=.44)box(.21,.005,.008,xx,y,zz,M.timber);}
 const kx=2.7,kz=-2.25,kw=4.7,kd=4.35,fy=3.2;
 // Keep plinth and tall masonry shell.
 const keepGroup=area('keep',()=>{box(kw+.25,2.95,kd+.25,kx,1.7,kz,M.stone);box(kw+.42,.17,kd+.42,kx,3.2,kz,M.light);box(kw-.18,.07,kd-.18,kx,fy+.11,kz,M.wood);for(let xx=kx-kw/2+.55;xx<kx+kw/2;xx+=1.1){windowAt(xx,2.2,kz+kd/2+.14,'front',.16,.55);windowAt(xx,2.2,kz-kd/2-.14,'front',.16,.55);}for(let zz=kz-kd/2+.6;zz<kz+kd/2;zz+=1.05)windowAt(kx+kw/2+.135,2.15,zz,'side',.17,.6);
 cutaway(fy+.07,()=>{for(const zz of [kz-kd/2,kz+kd/2])box(kw,.99,.22,kx,fy+.57,zz,M.stone);for(const xx of [kx-kw/2,kx+kw/2])box(.22,.99,kd,xx,fy+.57,kz,M.stone);for(const zz of [kz-kd/2,kz+kd/2]){box(kw+.1,.15,.34,kx,fy+1.1,zz,M.light);for(let xx=kx-kw/2+.2;xx<kx+kw/2;xx+=.5)box(.26,.3,.28,xx,fy+1.3,zz,M.light);}for(const xx of [kx-kw/2,kx+kw/2]){box(.34,.15,kd,xx,fy+1.1,kz,M.light);for(let zz=kz-kd/2+.2;zz<kz+kd/2;zz+=.5)box(.28,.3,.26,xx,fy+1.3,zz,M.light);}});
 for(const xx of [kx-kw/2,kx+kw/2])for(const zz of [kz-kd/2,kz+kd/2])tower(xx,zz,.48,4.55,true);
 // Internal plaster walls and sleeping chamber.
 box(2.6,.06,1.9,1.82,fy+.16,-3.27,mat(0xcec1a1));box(.13,.67,4.1,3.17,fy+.47,-2.25,M.light);box(2.6,.67,.12,1.8,fy+.47,-2.3,M.light);bed(1.25,fy+.32,-3.25,true);bed(2.25,fy+.32,-3.25);crate(.7,fy+.18,-2.7,.34);box(.43,.52,.4,2.77,fy+.4,-4.0,M.timber);
 plankFloor(kx,fy+.152,kz,kw-.22,kd-.22);rug(1.87,fy+.205,-2.55,1.7,.38);box(.36,.42,.34,2.77,fy+.4,-2.65,M.wood);candle(2.77,fy+.63,-2.65);pot(.77,fy+.36,-2.7,.075,M.brass);box(.62,.025,.2,2.13,fy+.21,-4.1,M.wood);
 // Personal possessions sit against the walls, leaving the bedside passage open.
 chest(1.26,fy+.2,-4.08,.55,.3);book(1.24,fy+.57,-4.08,.2,.21);jug(2.7,fy+.64,-2.7,.05);
 box(.34,.24,.3,.73,fy+.33,-3.82,M.wood);book(.73,fy+.48,-3.82,.22,.22,true);candle(.73,fy+.49,-3.99);
 for(const xx of [1.08,1.26]){const shoe=box(.09,.055,.17,xx,fy+.24,-2.49,M.timber);shoe.rotation.y=-.2;}
 box(.25,.012,.19,2.77,fy+.68,-4.0,M.linen);pot(2.77,fy+.7,-4.0,.085,M.brass);
 const keepRoof=roof(kx,kz,kw+.06,kd+.02,4.63,2.45);keepRoof.material=M.roof;box(.48,1.7,.43,1.3,5.45,-3.5,M.stone,keepRoof.parent);box(.64,.16,.58,1.3,6.31,-3.5,M.light,keepRoof.parent);
 for(const xx of [1.47,3.93])dormer(keepRoof.parent,xx,5.62,-.96,.57);
 for(const sign of [-1,1]){lineBetween([kx+sign*(kw/2+.05),4.65,kz-kd/2],[kx+sign*(kw/2+.05),7.12,kz],.045,M.timber,keepRoof.parent);lineBetween([kx+sign*(kw/2+.05),7.12,kz],[kx+sign*(kw/2+.05),4.65,kz+kd/2],.045,M.timber,keepRoof.parent);}
 for(let xx=kx-kw/2+.05;xx<kx+kw/2;xx+=.22)box(.18,.065,.18,xx,7.13,kz,M.roofLight,keepRoof.parent);
 for(const yy of [4.91,5.17,5.43,5.69,5.95])box(.5,.045,.45,1.3,yy,-3.5,M.edge,keepRoof.parent);box(.34,.045,.31,1.3,6.4,-3.5,M.dark,keepRoof.parent);
 // Romanesque blind arcading and corbelled masonry articulate the keep plinth.
 for(const sz of [-1,1]){const zz=kz+sz*(kd*.5+.139);box(kw-.5,.1,.075,kx,.77,zz,M.light);box(kw-.5,.075,.07,kx,1.29,zz,M.edge);for(let xx=kx-kw*.5+.55;xx<kx+kw*.5-.3;xx+=.52){box(.12,.16,.15,xx,3.03,zz,M.light);box(.08,.14,.11,xx,2.9,zz,M.edge);}}
 for(const sx of [-1,1])for(const zz of [kz-1.37,kz+.08,kz+1.43]){const xx=kx+sx*(kw*.5+.128);box(.12,2.45,.21,xx,1.51,zz,M.edge);box(.17,.18,.28,xx,.48,zz,M.light);box(.15,.11,.24,xx,2.78,zz,M.light);}
 for(const sx of [-1,1])for(let i=0;i<12;i++)box(i%2?.28:.2,.165,i%2?.2:.28,kx+sx*(kw*.5-.08),.47+i*.21,kz+kd*.5-.08,i%3?M.light:M.edge);
 // The timber entrance gallery follows the existing stair footprint.
 box(1.18,.1,.42,2.4,3.15,.08,M.timber);for(const xx of [1.9,2.9]){box(.06,.47,.06,xx,3.39,.24,M.wood);lineBetween([xx,2.56,-.04],[xx,3.11,.25],.04,M.timber);}box(1.1,.055,.055,2.4,3.62,.24,M.wood);
 // External entrance stair.
 for(let i=0;i<13;i++){const h=.22*(13-i);box(.85,h,.23,2.4,h/2+.2,.0+i*.22,M.stone);}lineBetween([1.89,3.37,.0],[1.89,.63,2.7],.035,M.timber);lineBetween([2.91,3.37,.0],[2.91,.63,2.7],.035,M.timber);for(let i=0;i<6;i++){let z=i*.46;box(.05,.52,.05,1.89,3.07-i*.46,z,M.timber);box(.05,.52,.05,2.91,3.07-i*.46,z,M.timber);}
 });
 area('chapel',()=>{
  box(1.65,.05,2.45,4.1,fy+.2,-3.0,mat(0xd2c4a7));box(1.75,.67,.12,4.1,fy+.48,-1.76,M.light);
  rug(4.12,fy+.234,-2.98,.5,1.6,M.blue);box(.6,.5,.37,4.12,fy+.49,-3.86,M.light);box(.68,.07,.42,4.12,fy+.77,-3.86,M.linen);
  box(.065,.54,.065,4.12,fy+1.09,-3.95,M.timber);box(.3,.06,.065,4.12,fy+1.18,-3.95,M.timber);
  for(const xx of [3.87,4.37])candle(xx,fy+.82,-3.83);
  for(let z=-3.3;z< -2;z+=.47){box(.92,.1,.18,4.12,fy+.44,z,M.wood);box(.92,.28,.05,4.12,fy+.57,z-.08,M.timber);for(const dx of [-.33,.33])box(.06,.24,.09,4.12+dx,fy+.32,z,M.timber);}
  box(.28,.06,.36,3.56,fy+.63,-3.88,M.wood);const book=box(.22,.035,.3,3.56,fy+.68,-3.88,M.linen);book.rotation.z=-.12;cyl(.045,.08,.34,3.56,fy+.43,-3.88,M.timber,8);
  box(.012,.009,.26,3.56,fy+.705,-3.88,M.timber);for(let i=0;i<3;i++)box(.065,.006,.008,3.61,fy+.707,-3.96+i*.055,M.edge);
  cyl(.07,.13,.39,4.72,fy+.43,-2.02,M.light,10);cyl(.17,.09,.13,4.72,fy+.69,-2.02,M.light,12);cyl(.12,.12,.015,4.72,fy+.76,-2.02,M.water,12);
  for(const xx of [3.55,4.7]){cyl(.032,.08,.47,xx,fy+.47,-3.37,M.brass,8);candle(xx,fy+.72,-3.37);}
  chest(3.55,fy+.25,-2.04,.33,.22);
 });
 area('council',()=>{
  box(2.5,.065,2.05,1.8,fy+.2,-1.15,mat(0xc9b991));rug(1.72,fy+.239,-1.13,2.05,1.45);table(1.72,fy+.75,-1.13,1.62,.55);
  box(.52,.012,.29,1.72,fy+.808,-1.13,M.linen);for(let i=0;i<4;i++){platter(1.22+i*.33,fy+.81,-1.13);cyl(.023,.026,.09,1.22+i*.33,fy+.84,-.98,M.brass,8);}
  candle(1.03,fy+.82,-1.16);candle(2.41,fy+.82,-1.16);shelf(.82,fy+.25,-1.94,.72,.66);crate(2.73,fy+.24,-.42,.34);
  // A parchment map and rolled records make the council table legible from above.
  box(.58,.012,.26,1.75,fy+.87,-1.13,M.parchment);lineBetween([1.51,fy+.88,-1.21],[1.93,fy+.88,-1.07],.006,M.blue);
  for(const [xx,zz] of [[1.6,-1.16],[1.83,-1.09],[1.95,-1.2]])box(.022,.025,.022,xx,fy+.9,zz,M.rug);
  scroll(2.25,fy+.86,-1.13,.21,.2);scroll(1.45,fy+.86,-.98,.16,-.25);
  chair(.7,fy+.25,-1.13,-Math.PI/2);chair(2.79,fy+.25,-1.13,Math.PI/2);book(.82,fy+.95,-1.94,.2,.18);jug(2.28,fy+.82,-1.3,.045);
 });
 area('storage',()=>{
  box(1.7,.06,1.6,4.1,fy+.2,-.86,mat(0xc3b18e));for(let i=0;i<3;i++)barrel(3.6+i*.4,fy+.24,-.42,.9);
  crate(3.62,fy+.24,-1.31,.42);crate(3.62,fy+.66,-1.31,.28);crate(4.2,fy+.24,-1.29,.38);crate(4.65,fy+.24,-1.24,.31);
  shelf(4.47,fy+.25,-1.48,.8,.64);for(let i=0;i<3;i++){const sack=sphere(.13,4.59,fy+.35,-.55-i*.21,M.cloth);sack.scale.set(1,1.3,.85);}
  chest(3.62,fy+.25,-.85,.38,.28);box(.3,.055,.2,4.18,fy+.66,-1.29,M.blue);box(.26,.05,.18,4.18,fy+.71,-1.29,M.linen);
  for(const xx of [4.24,4.48,4.71]){jug(xx,fy+.93,-1.48,.065);box(.04,.045,.005,xx,fy+1.0,-1.425,M.parchment);}
  sack(3.51,fy+.25,-1.64,.1);sack(3.73,fy+.25,-1.7,.1);scroll(3.62,fy+1.0,-1.31,.15);
 });
 area('hall',()=>{
  openHouse(3.84,3.32,3.65,1.95,1.43,()=>{
   rug(3.78,.452,3.32,2.65,1.32);table(3.78,1.0,3.32,2.25,.48);box(1.8,.012,.22,3.78,1.052,3.32,M.linen);
   for(let i=0;i<5;i++){platter(2.95+i*.39,1.063,3.32);pot(2.95+i*.39,1.06,3.14,.035,M.brass);}
   candle(3.15,1.07,3.32);candle(4.4,1.07,3.32);barrel(5.21,.45,3.82,.8);hearth(2.38,.47,2.71,.62);shelf(5.02,.45,2.54,.8,.68);
   box(.4,.12,.4,4.98,.73,3.29,M.timber);box(.4,.55,.07,5.14,.98,3.29,M.wood);box(.32,.03,.32,4.98,.81,3.29,M.rug);
   box(1.88,.008,.13,3.78,1.063,3.32,M.rug);for(let i=0;i<4;i++)for(const side of [-1,1]){const xx=3.04+i*.43,zz=3.32+side*.17;cyl(.074,.074,.012,xx,1.073,zz,M.light,12);cyl(.025,.022,.073,xx+.12,1.104,zz,M.brass,8);box(.012,.008,.095,xx-.1,1.077,zz,M.iron);}
   jug(3.66,1.07,3.32,.065);platter(4.05,1.075,3.32,.11);chair(2.38,.45,3.34,-Math.PI/2);
   box(.65,.06,.27,4.15,.79,2.57,M.wood);for(const xx of [3.9,4.4])box(.055,.32,.18,xx,.62,2.57,M.timber);jug(4.02,.83,2.56,.08);platter(4.27,.835,2.56,.08);
   for(const xx of [3.1,4.45])box(.27,.025,.14,xx,.88,3.73,M.blue);
  },1.14);
 });
 area('kitchen',()=>{
  const roofGroup=openHouse(4.91,1.36,1.6,1.44,1.05,()=>{
   hearth(5.17,.46,.95,.58);cyl(.16,.13,.16,5.17,.84,.98,M.iron,12);lineBetween([4.99,.96,.98],[5.35,.96,.98],.013,M.iron);
   table(4.6,.82,1.57,.6,.35);box(.22,.022,.2,4.55,.88,1.58,M.light);sphere(.065,4.65,.93,1.58,M.path);pot(4.42,.88,1.6,.07,M.brass);
   barrel(5.4,.44,1.71,.68);shelf(4.51,.45,.84,.52,.61);for(let i=0;i<3;i++)sphere(.045,5.3+i*.08,.49,1.42,M.veg);
   box(.2,.018,.15,4.69,.885,1.54,M.wood);const loaf=sphere(.065,4.69,.93,1.54,M.path);loaf.scale.set(1.3,.6,.75);box(.014,.012,.1,4.63,.903,1.65,M.iron);box(.025,.018,.05,4.63,.903,1.72,M.timber);
   lineBetween([4.99,.95,.98],[5.17,1.16,.98],.012,M.iron);lineBetween([5.35,.95,.98],[5.17,1.16,.98],.012,M.iron);
   box(.39,.035,.25,5.33,.69,1.39,M.wood);for(let i=0;i<3;i++){const carrot=cone(.024,.16,5.22+i*.085,.73,1.38,M.pottery,6);carrot.rotation.z=Math.PI/2;}jug(4.49,1.09,.84,.055);
   sack(4.25,.45,1.15,.11);box(.16,.025,.2,5.4,.74,1.71,M.wood);lineBetween([5.4,.75,1.71],[5.54,.95,1.71],.012,M.timber);
  },.87);box(.34,1.1,.35,5.31,2.08,.87,M.stone,roofGroup);box(.44,.1,.45,5.31,2.63,.87,M.light,roofGroup);
 });
 area('barracks',()=>{
  openHouse(-4.7,-1.75,1.78,3.45,1.16,()=>{
   for(let i=0;i<3;i++){bed(-4.88,.55,-2.9+i*1.05);crate(-4.22,.45,-2.96+i*1.05,.26);}
   box(.12,.04,2.35,-3.99,.67,-1.77,M.timber);for(let i=0;i<5;i++){box(.024,.66,.024,-4.01,.89,-2.8+i*.45,M.iron);box(.11,.028,.035,-4.01,.67,-2.8+i*.45,M.brass);}
   for(let i=0;i<2;i++){const shield=cyl(.14,.14,.035,-4.02,.7,-1.15+i*.4,M.rug,10);shield.rotation.z=Math.PI/2;}
   for(let i=0;i<3;i++){chest(-4.86,.45,-2.28+i*1.05,.43,.18);box(.2,.045,.15,-4.86,.82,-2.28+i*1.05,M.linen);}
   box(.26,.32,.28,-4.18,.61,-3.19,M.wood);candle(-4.18,.79,-3.19);jug(-4.18,.79,-3.04,.045);
   for(let i=0;i<2;i++){const helmet=sphere(.08,-4.2,.8,-1.73+i*.43,M.iron);helmet.scale.set(1,.72,1);cyl(.086,.086,.018,-4.2,.75,-1.73+i*.43,M.iron,10);}
  },1.1);
 });
 area('stable',()=>{
  openHouse(-4.65,1.74,1.8,2.2,1.0,()=>{
   for(let z=.75;z<2.8;z+=.7){box(1.3,.46,.065,-4.77,.69,z,M.wood);box(.19,.27,.54,-5.21,.57,z+.29,M.path);for(let i=0;i<6;i++){const hay=box(.025,.016,.33,-5.25+i*.027,.72,z+.28,M.cloth);hay.rotation.y=(random()-.5)*.6;}}
   for(let z of [1.1,1.85]){box(.25,.31,.54,-4.54,.82,z,M.timber);for(let x of [-4.64,-4.43])for(let zz of [z-.18,z+.18])box(.048,.36,.052,x,.52,zz,M.timber);box(.16,.32,.2,-4.53,1.07,z-.26,M.timber);box(.28,.04,.24,-4.54,1,z,M.rug);}
   barrel(-4.08,.45,2.56,.55);pot(-4.3,.45,2.53,.1,M.iron);
   box(.25,.055,.37,-3.99,.78,1.44,M.timber);box(.065,.33,.07,-3.99,.59,1.44,M.timber);const saddle=box(.3,.08,.27,-3.99,.85,1.44,M.rug);saddle.rotation.z=.12;
   for(const z of [1.05,1.8]){cyl(.095,.075,.16,-3.97,.53,z,M.wood,10);cyl(.075,.075,.008,-3.97,.616,z,M.water,10);}
   box(.33,.21,.3,-5.22,.56,2.57,M.path);for(let i=0;i<7;i++){const hay=box(.012,.014,.28,-5.35+i*.04,.68,2.57,M.cloth);hay.rotation.y=.14;}
   lineBetween([-3.95,.5,2.14],[-3.95,1.08,2.3],.013,M.timber);for(let i=0;i<4;i++)lineBetween([-4.03+i*.05,.49,2.1],[-4.03+i*.05,.55,2.22],.009,M.iron);
  },.9);
 });
 area('forge',()=>{
  const roofGroup=openHouse(-3.63,3.81,1.9,1.38,1.05,()=>{
   hearth(-4.16,.46,3.47,.55);box(.32,.24,.2,-3.6,.65,3.94,M.iron);box(.47,.1,.26,-3.6,.8,3.94,M.iron);const horn=cone(.09,.27,-3.3,.8,3.94,M.iron,6);horn.rotation.z=-Math.PI/2;
   barrel(-2.9,.43,4.13,.7);shelf(-3.32,.45,3.31,.6,.6);lineBetween([-3.82,.87,3.93],[-3.54,.87,3.93],.02,M.timber);box(.08,.05,.13,-3.54,.88,3.93,M.iron);
   for(let i=0;i<3;i++){box(.32,.045,.06,-3.1,.49+i*.05,3.7,M.iron);}
   box(.48,.055,.27,-2.99,.85,3.39,M.wood);for(const xx of [-3.16,-2.82])box(.055,.39,.2,xx,.63,3.39,M.timber);lineBetween([-3.14,.89,3.39],[-2.92,.89,3.39],.018,M.timber);box(.065,.07,.13,-2.92,.91,3.39,M.iron);
   const bellows=box(.3,.085,.2,-4.09,.62,3.87,M.timber);bellows.rotation.y=-.3;box(.24,.055,.16,-4.09,.68,3.87,M.rug);lineBetween([-4.09,.65,3.87],[-4.16,.65,3.59],.022,M.iron);
   for(let i=0;i<3;i++){const ring=mesh(new THREE.TorusGeometry(.06,.012,4,8,Math.PI*1.65),M.iron,-3.08+i*.09,.91,3.4);ring.rotation.x=Math.PI/2;}
   cyl(.1,.1,.012,-2.9,.725,4.13,M.water,12);for(const xx of [-3.49,-3.26])lineBetween([xx,.76,3.33],[xx,1.13,3.33],.012,M.iron);
  },.83);box(.38,1.15,.35,-4.1,2.08,3.49,M.stone,roofGroup);box(.5,.09,.48,-4.1,2.7,3.49,M.light,roofGroup);
 });
 area('granary',()=>{
  openHouse(-2.82,-3.79,1.8,1.2,1.1,()=>{
   shelf(-2.82,.45,-4.23,1.36,.69);for(let i=0;i<3;i++)barrel(-3.37+i*.45,.45,-3.55,.73);
   for(let i=0;i<3;i++){const sack=sphere(.14,-2.24,.58,-3.44-i*.24,M.cloth);sack.scale.set(.85,1.1,.85);cyl(.025,.04,.07,-2.24,.74,-3.44-i*.24,M.timber,7);}
   crate(-3.43,.46,-3.95,.3);crate(-3.43,.76,-3.95,.24);
   sack(-2.04,.45,-3.96,.1);sack(-2.23,.76,-3.88,.1);sack(-2.22,.73,-3.57,.11);
   cyl(.095,.08,.13,-3.33,.85,-3.55,M.wood,10);cyl(.078,.078,.009,-3.33,.919,-3.55,M.path,10);box(.13,.025,.04,-3.46,.91,-3.55,M.timber);
   box(.3,.018,.18,-2.88,1.17,-4.23,M.parchment);scroll(-2.7,1.19,-4.23,.17);cyl(.055,.07,.11,-3.1,1.2,-4.23,M.brass,8);
   for(let i=0;i<3;i++){const bundle=box(.035,.025,.21,-2.55+i*.055,.49,-3.24,M.path);bundle.rotation.y=.2;}
  },.9);for(let i=0;i<3;i++)barrel(-3.18+i*.46,.23,-2.88,.85);crate(-2.01,.23,-3.03,.33);
 });
 area('garden',()=>{box(2.27,.055,2.0,.02,.26,1.57,M.soil);for(let x=-.89;x<1.1;x+=.34){box(.17,.045,1.7,x,.31,1.57,mat(0x786f50));for(let z=.83;z<2.36;z+=.22){const sprout=sphere(.082+random()*.03,x,.4,z,M.veg);sprout.scale.y=.7;}}for(let x of [-1.17,1.2]){for(let z=.52;z<2.7;z+=.35)box(.045,.46,.045,x,.48,z,M.wood);box(.04,.07,2.22,x,.58,1.57,M.timber);box(.04,.06,2.22,x,.39,1.57,M.timber);}for(let z of [.51,2.65]){box(2.4,.07,.04,.02,.58,z,M.timber);box(2.4,.06,.04,.02,.39,z,M.timber);for(let x=-1.15;x<1.3;x+=.35)box(.045,.46,.045,x,.48,z,M.wood);}});
 area('courtyard',()=>{cyl(.45,.48,.46,-1.63,.48,-.85,M.stone,16);cyl(.47,.47,.09,-1.63,.74,-.85,M.light,16);cyl(.33,.33,.02,-1.63,.793,-.85,M.dark,16);for(let x of [-2.03,-1.22])box(.07,1.27,.07,x,.91,-.85,M.timber);lineBetween([-2.08,1.4,-.85],[-1.16,1.4,-.85],.04,M.timber);lineBetween([-1.63,1.41,-.85],[-1.63,.86,-.85],.009,M.iron);barrel(-1.03,.23,-.53,.46);for(let i=0;i<21;i++){let a=random()*Math.PI*2,r=.53+random()*.28;const b=box(.14,.025,.12,-1.63+Math.cos(a)*r,.226,-.85+Math.sin(a)*r,M.light);b.rotation.y=a;}});
 function tree(x,z,s=1,type=0){const y=.03; cyl(.05*s,.1*s,1.5*s,x,y+.72*s,z,M.timber,6);if(type===0){for(let i=0;i<3;i++)cone((.47-i*.095)*s,1.12*s,x,y+(1.0+i*.37)*s,z,[M.leaf1,M.leaf4,M.leaf2][i],7);}else{const ob=sphere(.62*s,x,y+1.55*s,z,[M.leaf1,M.leaf2,M.leaf3][type%3]);ob.scale.set(.8,1.2,.8);sphere(.36*s,x-.23*s,y+1.28*s,z+.22*s,M.leaf2);}}
 for(const [x,z,s,t] of [[-7.8,-5.1,.9,0],[-7.6,-5.8,.7,1],[-6.4,-6.6,.85,1],[-4.9,-6.65,.7,0],[-4.2,-6.8,.6,0],[-.8,-6.8,.75,1],[1,-6.7,.6,0],[5.4,-6.6,.8,1],[7.45,-5.65,.8,0],[8.16,-3.9,.73,1],[8.07,-2.8,.55,0],[8.08,3.7,.67,1],[7.7,5.3,.6,0],[-7.7,4.6,.7,1],[-8.08,2.9,.7,0],[-8.12,.9,.7,1],[-8.08,.1,.55,1],[-6.43,5.98,.54,0],[-4.95,6.08,.5,1],[-2.82,6.32,.53,0],[-5.48,-3.78,.63,0],[-5.6,3.3,.56,0],[5.55,-.11,.52,0],[1.18,-4.85,.42,1]])tree(x,z,s,t);
 // Shrubs and pale stones at the island's edge.
 for(let i=0;i<75;i++){const x=(random()-.5)*15.8,z=(random()-.5)*12.9;if(Math.abs(x)<6.45&&Math.abs(z)<5)continue;if(Math.abs(x)<7.5&&Math.abs(z)<6.1)continue;const ob=sphere(.09+random()*.11,x,-.13,z,i%3===0?M.rock:M.leaf2);ob.scale.y=.65;}
 // Three domestic workshops occupy the quieter pockets around the inner court.
 area('scriptorium',()=>{
  openHouse(-.8,-3.5,1.65,1.4,1.12,()=>{
   // A shallow writing desk leaves the southern half of the room open.
   box(1.08,.07,.28,-.78,.94,-3.91,M.wood);for(const xx of [-1.25,-.31])for(const zz of [-4.0,-3.82])box(.04,.45,.04,xx,.69,zz,M.timber);
   const writing=box(.42,.035,.23,-.86,.998,-3.9,M.timber);writing.rotation.x=-.1;book(-.87,1.028,-3.89,.3,.21,true);
   pot(-1.21,.985,-3.91,.035,M.iron);lineBetween([-1.21,1.02,-3.91],[-1.16,1.19,-3.94],.006,M.linen);
   const feather=sphere(.043,-1.165,1.16,-3.94,M.linen);feather.scale.set(.3,1.8,.15);feather.rotation.z=-.35;
   candle(-.38,.99,-3.95);scroll(-.56,1.00,-3.88,.15,.2);
   // Wall library: bindings, parchment edges and brass shelf labels.
   for(const zz of [-3.65,-3.06])box(.24,.84,.035,-1.38,.87,zz,M.timber);
   for(const yy of [.49,.84,1.19])box(.26,.035,.63,-1.38,yy,-3.355,M.wood);
   for(let level=0;level<2;level++)for(let j=0;j<6;j++){const zz=-3.59+j*.093,hh=.19+(j%3)*.03;box(.17,hh,.057,-1.37,.51+level*.35+hh/2,zz,[M.rug,M.blue,M.timber][j%3]);box(.025,.014,.052,-1.272,.57+level*.35,zz,M.brass);}
   chest(-.2,.455,-3.24,.24,.32);for(let i=0;i<3;i++)scroll(-.2,.82+i*.038,-3.25,.19,(i%2)*.25);
   rug(-.79,.455,-3.27,.55,.38,M.blue);box(.08,.006,.22,-.79,.467,-3.27,M.linen);
  },.9);
 });
 area('infirmary',()=>{
  const roofGroup=openHouse(-2.55,1.65,1.55,1.95,1.08,()=>{
   // Low linen cot with a sage coverlet and a folded bedside towel.
   box(.5,.18,1.03,-2.98,.57,1.55,M.timber);box(.47,.11,.98,-2.98,.715,1.55,M.linen);box(.45,.035,.59,-2.98,.784,1.72,M.blue);box(.39,.09,.23,-2.98,.803,1.17,M.linen);
   for(const zz of [1.045,2.055]){box(.52,.4,.04,-2.98,.67,zz,M.wood);for(const xx of [-3.2,-2.76])box(.045,.55,.045,xx,.7,zz,M.timber);}
   box(.28,.025,.18,-2.98,.825,1.9,M.linen);for(let i=0;i<4;i++)box(.025,.005,.15,-3.07+i*.057,.842,1.9,M.blue);
   // Apothecary jars use paper labels, lids and recognizable botanical stems.
   for(const xx of [-2.67,-1.97])box(.035,.78,.22,xx,.845,.87,M.timber);
   for(const yy of [.49,.76,1.04])box(.74,.035,.22,-2.32,yy,.87,M.wood);
   for(let level=0;level<2;level++)for(let i=0;i<4;i++){const xx=-2.59+i*.18,yy=.52+level*.27;pot(xx,yy,.87,.055,i%2?M.pottery:M.green);cyl(.043,.045,.025,xx,yy+.092,.87,M.timber,10);box(.05,.045,.009,xx,yy+.055,.925,M.parchment);}
   jug(-2.52,1.064,.86,.065);pot(-2.05,1.064,.87,.063,M.green);
   // Grinding table, a shallow stone mortar and suspended bundles of herbs.
   box(.24,.06,.63,-1.98,.88,1.95,M.wood);for(const zz of [1.68,2.22])box(.18,.4,.045,-1.98,.65,zz,M.timber);
   cyl(.082,.055,.1,-1.98,.96,1.83,M.light,12);cyl(.061,.061,.008,-1.98,1.014,1.83,M.green,12);lineBetween([-1.99,1.01,1.83],[-1.94,1.12,1.87],.016,M.edge);jug(-1.98,.92,2.12,.055);
   lineBetween([-2.1,1.27,1.68],[-2.1,1.27,2.21],.013,M.timber);
   for(let i=0;i<4;i++){const zz=1.72+i*.14;lineBetween([-2.1,1.27,zz],[-2.1,1.08,zz],.005,M.cloth);for(const dx of [-.025,.025]){const leaf=sphere(.036,-2.1+dx,1.09,zz,M.veg);leaf.scale.set(.5,1.7,.7);}}
   rug(-2.48,.455,1.75,.32,.66,M.linen);
  },.95);
  box(.21,.62,.24,-3.01,1.96,1.22,M.stone,roofGroup);box(.29,.075,.31,-3.01,2.29,1.22,M.light,roofGroup);
 });
 area('weavery',()=>{
  openHouse(-.85,3.72,1.85,1.25,1.03,()=>{
   // Upright wooden loom, separate warp strings, woven cloth, shuttle and pedals.
   for(const xx of [-1.56,-.96]){box(.055,.94,.065,xx,.925,3.52,M.timber);box(.085,.065,.62,xx,.49,3.69,M.wood);lineBetween([xx,.53,3.96],[xx,1.17,3.52],.025,M.timber);}
   for(const yy of [.66,1.34])box(.65,.065,.075,-1.26,yy,3.52,M.wood);
   for(let i=0;i<15;i++)lineBetween([-1.52+i*.037,1.3,3.52],[-1.52+i*.037,.69,3.61],.004,M.linen);
   box(.51,.32,.018,-1.26,.88,3.579,M.blue);for(let i=0;i<8;i++)box(.51,.009,.008,-1.26,.74+i*.038,3.594,i%3?M.blue:M.linen);
   for(const yy of [.76,.98])box(.52,.017,.012,-1.26,yy,3.595,M.rug);
   const roll=cyl(.047,.047,.6,-1.26,.68,3.63,M.linen,12);roll.rotation.z=Math.PI/2;
   for(const xx of [-1.4,-1.13]){const treadle=box(.075,.035,.26,xx,.53,3.81,M.wood);treadle.rotation.x=.15;}
   const shuttle=box(.19,.035,.045,-1.27,1.02,3.62,M.timber);shuttle.rotation.z=.14;box(.065,.045,.04,-1.27,1.027,3.62,M.linen);
   // Yarn shelves are fixed to the north wall; the walking aisle is to the east.
   for(const xx of [-.58,-.12])box(.035,.58,.19,xx,.745,3.29,M.timber);
   for(const yy of [.49,.73,.96])box(.5,.035,.19,-.35,yy,3.29,M.wood);
   for(let level=0;level<2;level++)for(let i=0;i<4;i++){const xx=-.53+i*.12,yy=.52+level*.24;cyl(.029,.029,.12,xx,yy+.05,3.29,M.linen,10);cyl(.04,.04,.015,xx,yy-.01,3.29,M.wood,10);cyl(.04,.04,.015,xx,yy+.11,3.29,M.wood,10);cyl(.032,.032,.075,xx,yy+.045,3.29,[M.rug,M.blue,M.green,M.linen][i],10);}
   cyl(.14,.11,.17,-.2,.55,4.07,M.wood,16);for(const yy of [.49,.61])cyl(.142,.142,.025,-.2,yy,4.07,M.iron,16);cyl(.117,.117,.012,-.2,.642,4.07,M.blue,16);
   const dyed=box(.1,.18,.013,-.12,.7,4.09,M.blue);dyed.rotation.z=-.15;lineBetween([-.28,.66,4.06],[-.16,.91,4.1],.012,M.timber);
   rug(-.61,.455,3.76,.27,.44,M.rug);
  },.85);
 });
 // Shift the entire weaving workshop south together with its removable shell
 // and roof, preserving the courtyard's east–west walking passage by the garden.
 areas.weavery.position.z+=.15;
 for(const group of [...roofParts,...cutawayParts])if(group.userData.room==='weavery')group.position.z+=.15;
 // Small pieces of courtyard life.
 for(const [x,z] of [[-2.9,.2],[-2.3,.25],[1.6,4.2],[5.6,2.1]]){crate(x,.22,z,.25+random()*.1);if(random()>.5)barrel(x+.32,.22,z,.63);}
 // The raised portcullis, arch stones and bridge ironwork read clearly at arrival.
 {const previous=active;active=areas.gate;
  for(let i=0;i<11;i++){const a=i*Math.PI/10,o=box(.17,.18,.14,Math.cos(a)*.74,1.94+Math.sin(a)*.74,5.67,M.light);o.rotation.z=a-Math.PI/2;}
  for(const sign of [-1,1])for(let i=0;i<8;i++)box(.18,.15,.14,sign*.74,.47+i*.19,5.67,i%3?M.light:M.edge);
  for(let i=0;i<7;i++){const xx=-.51+i*.17;box(.035,.75,.045,xx,2.34,5.57,M.iron);const tooth=cone(.047,.17,xx,1.89,5.57,M.iron,4);tooth.rotation.z=Math.PI;}
  for(const yy of [2.13,2.47,2.69])box(1.12,.045,.06,0,yy,5.575,M.iron);
  for(const xx of [-.5,.5])for(const yy of [.55,1.45]){box(.085,.14,.055,xx,yy,5.395,M.iron);sphere(.025,xx,yy,5.43,M.brass);}
  for(const xx of [-.25,.25]){const ring=mesh(new THREE.TorusGeometry(.065,.014,5,14),M.iron,xx,1.12,5.39);ring.rotation.x=.1;box(.045,.065,.035,xx,1.18,5.39,M.iron);}
  for(const sign of [-1,1]){box(.09,.38,.1,sign*.91,1.37,5.75,M.timber);cyl(.075,.045,.11,sign*.91,1.59,5.75,M.iron,8);const flame=cone(.052,.17,sign*.91,1.72,5.75,M.flame,7);flame.rotation.z=sign*.13;for(let i=0;i<4;i++)box(.055,.035,.17,sign*.55,.265,6.1+i*.45,M.iron);}
  active=previous;
 }
 // Animated residents are added by life-world after the static castle is merged.
 // Flag poles and cloth with a restrained heraldic band.
 function flag(x,y,z){cyl(.025,.03,1.9,x,y+.95,z,M.timber,6);const g=new THREE.PlaneGeometry(.7,.4,12,3);g.translate(.36,0,0);const m=new THREE.Mesh(g,M.flag);m.position.set(x,y+1.52,z);m.rotation.y=.35;world.add(m);flags.push(m);box(.6,.075,.016,x+.33,y+1.52,z+.02,M.cloth);cone(.05,.12,x,y+1.98,z,M.iron,6);}
 flag(5.03,6.76,-4.4);flag(-6.25,4.84,-4.55);flag(1.2,3.9,5.25);
 // A small cellar hatch makes the lower storey discoverable from the courtyard.
 area('undercroft',()=>{
  box(.72,.075,.64,0,.25,0,M.light);box(.54,.035,.48,0,.301,0,M.timber);
  for(let x=-.2;x<.25;x+=.1)box(.065,.012,.44,x,.326,0,M.wood);
  for(const z of [-.15,.15])box(.5,.015,.035,0,.339,z,M.iron);
  const handle=mesh(new THREE.TorusGeometry(.05,.011,5,12),M.iron,.15,.358,.03);handle.rotation.x=Math.PI/2;
 });
 // Merge static parts per material, preserving each clickable area's identity.
 function optimize(group){const buckets=new Map();group.updateMatrixWorld(true);group.traverse(o=>{if(!o.isMesh)return;const geo=o.geometry.clone();const relative=new THREE.Matrix4().copy(group.matrixWorld).invert().multiply(o.matrixWorld);geo.applyMatrix4(relative);const key=o.material.uuid;if(!buckets.has(key))buckets.set(key,{material:o.material,geos:[]});buckets.get(key).geos.push(geo);});const old=[...group.children];for(const o of old)group.remove(o);for(const {material,geos} of buckets.values()){const merged=mergeGeometries(geos.map(g=>{if(g.index)return g.toNonIndexed();return g;}),false);if(!merged)continue;const m=new THREE.Mesh(merged,material);m.castShadow=true;m.receiveShadow=true;m.userData.room=group.userData.room;group.add(m);for(const g of geos)g.dispose();}}
 optimize(defaultGroup);
 for(const g of [...Object.values(areas),...cutawayParts])optimize(g);
 for(const g of roofParts){
  optimize(g);g.userData.baseY=g.position.y;
  for(const m of g.children){m.material=m.material.clone();m.material.transparent=true;m.userData.isRoof=true;}
 }
 // Detailed cutaways share the same scene and camera. The outer model dissolves
 // away so neither terrain nor neighbouring roofs can cover the lower floor.
 const exterior=new THREE.Group();exterior.name='castle-exterior';
 for(const child of [...world.children])exterior.add(child);world.add(exterior);
 const expansion=createInteriorExpansion({THREE,materials:M});world.add(expansion.root);expansion.root.visible=true;
 const basementIds=Object.keys(expansion.rooms).filter(id=>interiorLayouts[id]?.level==='basement');
 const keepIds=Object.keys(expansion.rooms).filter(id=>interiorLayouts[id]?.level==='upper');
 const stages={exterior:[exterior],keep:keepIds.map(id=>expansion.rooms[id]),hall:[expansion.rooms.hall],basement:basementIds.map(id=>expansion.rooms[id])};
 let activeStage='exterior';
 const stageWeights={exterior:1,keep:0,hall:0,basement:0};
 // Every stage owns its materials: fading masonry must not dim another floor.
 for(const [id,groups] of Object.entries(stages)){
  const clones=new Map();
  for(const group of groups){group.visible=id==='exterior';group.traverse(node=>{
   if(!node.isMesh)return;
   const clone=material=>{if(!clones.has(material)){const copy=material.clone();copy.userData.layerOpacity=copy.opacity;copy.userData.layerTransparent=copy.transparent;copy.userData.layerDepthWrite=copy.depthWrite;clones.set(material,copy);}return clones.get(material);};
   node.material=Array.isArray(node.material)?node.material.map(clone):clone(node.material);
  });}
 }
 function stageFor(id){return basementIds.includes(id)?'basement':keepIds.includes(id)?'keep':id==='hall'?'hall':'exterior';}
 function setStage(id){activeStage=stageFor(id);controls.enablePan=activeStage==='keep'||activeStage==='basement';controls.minZoom=controls.enablePan?.4:.7;}
 function walkingSpace(id){return basementIds.includes(id)?'underground':keepIds.includes(id)?'keepfloor':interiorLayouts[id]?id:null;}
 function updateStages(blend){
  for(const [id,groups] of Object.entries(stages)){
   const before=stageWeights[id];
   let value=stageWeights[id]=THREE.MathUtils.lerp(before,activeStage===id?1:0,blend);
   if(value<.003)value=stageWeights[id]=0;else if(value>.997)value=stageWeights[id]=1;
   if(value===1&&before===1)continue;
   const visited=new Set();
   for(const group of groups){group.visible=value>0;if(!value)continue;group.traverse(node=>{
    if(!node.isMesh)return;
    for(const material of Array.isArray(node.material)?node.material:[node.material]){
     if(visited.has(material))continue;visited.add(material);
     const base=node.userData.isRoof?1-THREE.MathUtils.smoothstep(node.parent.userData.openValue,.1,.9):material.userData.layerOpacity??1;
     material.opacity=base*value;material.transparent=material.userData.layerTransparent||material.opacity<.999;
     material.depthWrite=material.userData.layerDepthWrite!==false&&material.opacity>.45;
    }
   });}
  }
  ground.position.y=THREE.MathUtils.lerp(ground.position.y,activeStage==='basement'?-3.48:-1.63,blend);
 }
 const selectableGroups=[...Object.values(areas),...cutawayParts,...roofParts,...Object.values(expansion.rooms)];
 const hitObjects=selectableGroups.flatMap(g=>g.children);
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
 const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const coreRooms=Object.fromEntries(Object.entries(interiorLayouts).map(([id,room])=>[id,{...room,center:new THREE.Vector3(...room.center)}]));
 const roofOwners=Object.fromEntries(Object.entries(interiorLayouts).map(([id,room])=>[id,room.roofOwner]));
 let hoverId=null,selectedId=null,focusedId=null,exploring=false,transition=null,transitionSerial=0,openRoofOwner=null,raf,lastTime=0;
 let walkingEnabled=true,trackingCharacter=false,orbiting=false,orbitPausedUntil=0,portraitFit=1;
 const walker=createCastleWalker({scene,camera,domElement:renderer.domElement,collisionRoot:world,onStatus:state=>callbacks.onWalkState?.(state)});
 walker.setVisible(false);
 const life=createLifeWorld({scene,camera,collisionRoot:world,onInteract:entity=>interactLife(entity.type,entity.id)});
 function syncWalking(){walker.setEnabled(exploring&&walkingEnabled&&!transition);life.setEnabled(exploring&&!transition);}
 function interactLife(type,id){
  if(!exploring||transition)return false;
  const entity=life.getMarkers().find(item=>item.type===type&&item.id===id);
  if(!entity)return false;
  if(!walkingEnabled){walkingEnabled=true;syncWalking();}
  callbacks.onLifeApproach?.({type,id});
  const started=walker.approach(entity.position,()=>{
   if(!exploring||transition||!life.getMarkers().some(item=>item.type===type&&item.id===id))return;
   callbacks.onLifeInteract?.({type,id});
  });
  if(!started)callbacks.onLifeBlocked?.('暂时无法靠近，试试从另一侧过去');
  return started;
 }
 let coverPose,overviewPose;
 function pose(){return{pos:camera.position.clone(),target:controls.target.clone(),zoom:camera.zoom};}
 function clonePose(value){return{pos:value.pos.clone(),target:value.target.clone(),zoom:value.zoom};}
 function resize(){
  const w=container.clientWidth,h=Math.max(container.clientHeight,1);renderer.setSize(w,h,false);
  // A tall full-screen canvas must retain enough horizontal room for the whole island.
  const aspect=Math.max(w/h,.1),half=Math.max(11.65,12.8/aspect);
  portraitFit=half/11.65;controls.maxZoom=5.6*portraitFit;
  camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();
  if(focusedId)moveTo(corePose(focusedId),450);
 }
 const observer=new ResizeObserver(resize);observer.observe(container);resize();controls.update();
 coverPose=pose();overviewPose=clonePose(coverPose);
 function moveTo(next,duration=950){
  // Flush residual orbit damping so a prior drag cannot fight a scripted camera move.
  controls.autoRotate=false;setHover(null);
  controls.enableDamping=false;controls.update();controls.enableDamping=true;
  transition={serial:++transitionSerial,settledId:focusedId,start:performance.now(),duration:reduceMotion?1:duration,from:pose(),to:clonePose(next)};
  syncWalking();
 }
 function corePose(id){
  const room=coreRooms[id];let zoom=room.zoom*Math.min(1.35,portraitFit);
  const direction=new THREE.Vector3(...(room.direction||[.26,.87,.43])).normalize();
  if(room.frameBounds){
   const [x1,z1,x2,z2]=room.frameBounds,right=new THREE.Vector3(direction.z,0,-direction.x).normalize(),up=new THREE.Vector3().crossVectors(direction,right).normalize();
   const corners=[];for(const x of [x1,x2])for(const z of [z1,z2])for(const y of [room.center.y-.35,room.center.y+1.5])corners.push(new THREE.Vector3(x,y,z));
   const extent=axis=>Math.max(...corners.map(p=>p.dot(axis)))-Math.min(...corners.map(p=>p.dot(axis)));
   const desktop=window.innerWidth>760;
   zoom=Math.min(zoom,(camera.right-camera.left)*(desktop?(room.overview?.85:.60):.90)/extent(right),(camera.top-camera.bottom)*(desktop?.72:room.overview?.57:.40)/extent(up));
  }
  const target=room.center.clone();
  if(window.innerWidth>760){
   // Place the room near 45% of the page width, leaving the right-hand description clear.
   const rect=container.getBoundingClientRect(),parent=container.parentElement.getBoundingClientRect();
   const centerFraction=room.overview?.5:room.frameBounds?(parent.width-Math.min(350,parent.width*.3))/parent.width*.5:.45;
   const desiredX=(parent.left+parent.width*centerFraction-rect.left)/Math.max(rect.width,1);
   const right=new THREE.Vector3(direction.z,0,-direction.x).normalize();
   target.addScaledVector(right,(.5-desiredX)*(camera.right-camera.left)/zoom);
  }else{
   // The bottom sheet occupies 44svh: keep the opened room in the remaining upper field.
   const right=new THREE.Vector3(direction.z,0,-direction.x).normalize();
   const up=new THREE.Vector3().crossVectors(direction,right).normalize();
   target.addScaledVector(up,((room.overview?.47:.33)-.5)*(camera.top-camera.bottom)/zoom);
  }
  return{target,pos:target.clone().addScaledVector(direction,40),zoom};
 }
 function enter(){
  if(exploring)return;
  coverPose=pose();exploring=true;selectedId=null;focusedId=null;openRoofOwner=null;
  setStage(null);trackingCharacter=false;walker.setSpace(null);life.setSpace(null);walker.setVisible(true);
  overviewPose=clonePose(coverPose);overviewPose.zoom=THREE.MathUtils.clamp(coverPose.zoom*1.18,controls.minZoom,2);
  moveTo(overviewPose,850);
 }
 function overview(){
  const wasFocused=Boolean(focusedId)||trackingCharacter;
  focusedId=null;openRoofOwner=null;highlight(null);
  setStage(null);
  trackingCharacter=false;walker.setSpace(null);life.setSpace(null);syncWalking();
  if(wasFocused)moveTo(overviewPose,1000);
 }
 function leave(){
  trackingCharacter=false;walker.setVisible(false);
  exploring=false;focusedId=null;openRoofOwner=null;highlight(null);moveTo(coverPose,950);
  setStage(null);
 }
 function select(id){
  if(!id){overview();return;}
  if(!areas[id]&&!expansion.rooms[id])return;
  if(!exploring)enter();
  setStage(id);trackingCharacter=false;walker.setSpace(walkingSpace(id),coreRooms[id]?.entrySpawn);life.setSpace(id);walker.setVisible(true);
  highlight(id);openRoofOwner=roofOwners[id]||null;
  if(coreRooms[id]){
   if(!focusedId)overviewPose=clonePose(transition?.to||pose());
   focusedId=id;moveTo(corePose(id),1100);
  }else if(focusedId){
   focusedId=null;moveTo(overviewPose,1000);
  }
 }
 function arrive(id){
  if(!coreRooms[id]){select(id);return;}
  // The first arrival is one continuous move; no intermediate overview animation.
  if(!exploring){
   coverPose=pose();overviewPose=clonePose(coverPose);
   overviewPose.zoom=THREE.MathUtils.clamp(coverPose.zoom*1.18,controls.minZoom,2);
  }else if(!focusedId)overviewPose=clonePose(transition?.to||pose());
  exploring=true;focusedId=id;openRoofOwner=roofOwners[id]||null;highlight(id);
  setStage(id);trackingCharacter=false;walker.setSpace(walkingSpace(id),coreRooms[id]?.entrySpawn,true);life.setSpace(id);walker.setVisible(true);walker.greet();
  moveTo(corePose(id),1400);
 }
 function findCharacter(){
  if(!exploring)return;
  const position=walker.getPosition();if(!position)return;
  if(focusedId&&activeStage!=='basement'&&activeStage!=='keep'){moveTo(corePose(focusedId),600);walker.greet();return;}
  trackingCharacter=true;
  const target=position.clone().add(new THREE.Vector3(0,.35,0));
  const direction=new THREE.Vector3(.26,.87,.43).normalize();
  moveTo({target,pos:target.clone().addScaledVector(direction,40),zoom:2.5*Math.min(1.35,portraitFit)},650);
  walker.greet();
 }
 function zoom(amount){
  const next=clonePose(transition?.to||pose());
  next.zoom=THREE.MathUtils.clamp(next.zoom*amount,controls.minZoom,controls.maxZoom);
  moveTo(next,300);
 }
 function reset(){
  trackingCharacter=false;
  if(focusedId){moveTo(corePose(focusedId));return;}
  const next=clonePose(exploring?overviewPose:coverPose);moveTo(next);
 }
 function project(position){const v=new THREE.Vector3(...position).project(camera);const r=container.getBoundingClientRect(),p=container.parentElement.getBoundingClientRect();return{x:(v.x*.5+.5)*r.width+r.left-p.left,y:(-v.y*.5+.5)*r.height+r.top-p.top,visible:v.z<1&&v.z>-1};}
 function highlight(id){
  selectedId=id;
  refreshHighlights();
 }
 function setHover(id){
  if(hoverId===id)return;
  hoverId=id;refreshHighlights();
 }
 function refreshHighlights(){
  for(const g of selectableGroups)for(const m of g.children){
   if(!m.userData.originalMaterial)m.userData.originalMaterial=m.material;
   if(exploring&&g.userData.room===hoverId){
    if(!m.userData.hoverMaterial){m.userData.hoverMaterial=m.userData.originalMaterial.clone();m.userData.hoverMaterial.emissive.setHex(0xb88c4b);m.userData.hoverMaterial.emissiveIntensity=.16;}
    m.material=m.userData.hoverMaterial;
   }else if(g.userData.room===selectedId){
    if(!m.userData.highlightMaterial){m.userData.highlightMaterial=m.userData.originalMaterial.clone();m.userData.highlightMaterial.emissive.setHex(0x8c6234);m.userData.highlightMaterial.emissiveIntensity=.08;}
    m.material=m.userData.highlightMaterial;
   }else m.material=m.userData.originalMaterial;
  }
 }
 function pick(e){
  const r=renderer.domElement.getBoundingClientRect();
  pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
  raycaster.setFromCamera(pointer,camera);
  const available=hitObjects.filter(m=>{
   let parent=m;while(parent){if(!parent.visible)return false;parent=parent.parent;}
   return !m.userData.isRoof||m.parent.userData.openValue<.08;
  });
  return raycaster.intersectObjects(available,false)[0]?.object.userData.room||null;
 }
 const pointers=new Set();let tap=null;
 renderer.domElement.addEventListener('pointerdown',e=>{
  pointers.add(e.pointerId);
  tap=pointers.size===1&&e.button===0?{id:e.pointerId,x:e.clientX,y:e.clientY}:null;
 });
 renderer.domElement.addEventListener('pointermove',e=>{
  if(tap&&Math.hypot(e.clientX-tap.x,e.clientY-tap.y)>6)tap=null;
  if(pointers.size||e.pointerType==='touch'||transition)return;
  const id=pick(e),entity=exploring?life.hover(pointer):null;
  if(entity){setHover(null);renderer.domElement.style.cursor='pointer';callbacks.onHover?.(null);callbacks.onLifeHover?.(entity,e);return;}
  callbacks.onLifeHover?.(null);
  setHover(exploring?id:null);renderer.domElement.style.cursor=id?'pointer':'grab';
  callbacks.onHover?.(exploring?id:null,e);
 });
 renderer.domElement.addEventListener('pointerup',e=>{
  const clicked=tap&&tap.id===e.pointerId&&Math.hypot(e.clientX-tap.x,e.clientY-tap.y)<=6;
  pointers.delete(e.pointerId);tap=null;
  if(!clicked||pointers.size||transition)return;
  const id=pick(e);
  if(exploring&&activeStage==='exterior'&&id==='undercroft'){callbacks.onSelect?.(id);return;}
  if(exploring&&life.pick(pointer)){callbacks.onHover?.(null);callbacks.onLifeHover?.(null);return;}
  if(exploring&&walkingEnabled&&walker.handleClick(pointer)){callbacks.onHover?.(null);return;}
  if(id){if(exploring)callbacks.onSelect?.(id);else callbacks.onEnter?.();}
 });
 renderer.domElement.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);tap=null;});
 renderer.domElement.addEventListener('lostpointercapture',e=>{pointers.delete(e.pointerId);});
 renderer.domElement.addEventListener('pointerleave',()=>{setHover(null);life.setHover(null);renderer.domElement.style.cursor='grab';callbacks.onHover?.(null);callbacks.onLifeHover?.(null);});
 controls.addEventListener('start',()=>{
  trackingCharacter=false;orbiting=true;orbitPausedUntil=performance.now()+6000;controls.autoRotate=false;setHover(null);life.setHover(null);
  const interrupted=transition;transition=null;++transitionSerial;callbacks.onHover?.(null);callbacks.onLifeHover?.(null);
  // Taking control of the camera also completes the pending introduction reveal.
  syncWalking();
  if(interrupted)callbacks.onTransitionEnd?.(focusedId);
 });
 controls.addEventListener('end',()=>{orbiting=false;orbitPausedUntil=performance.now()+6000;});
 let contextLost=false;
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;callbacks.onError?.();});
 renderer.domElement.addEventListener('webglcontextrestored',()=>{contextLost=false;callbacks.onRestored?.();});
 function frame(time){
  raf=requestAnimationFrame(frame);if(document.hidden||contextLost){lastTime=time;return;}
  const elapsed=Math.min((time-(lastTime||time))/1000,.05);lastTime=time;
  if(transition){
   const current=transition,p=Math.min((time-current.start)/current.duration,1),ease=p*p*p*(p*(p*6-15)+10);
   camera.position.lerpVectors(current.from.pos,current.to.pos,ease);
   controls.target.lerpVectors(current.from.target,current.to.target,ease);
   camera.zoom=THREE.MathUtils.lerp(current.from.zoom,current.to.zoom,ease);camera.updateProjectionMatrix();
   if(p===1&&current.serial===transitionSerial){transition=null;syncWalking();callbacks.onTransitionEnd?.(current.settledId);}
  }
  const blend=reduceMotion?1:1-Math.exp(-elapsed*6.5);
  for(const g of roofParts){
   const desired=g.userData.room===openRoofOwner?1:0;
   g.userData.openValue=THREE.MathUtils.lerp(g.userData.openValue,desired,blend);
   if(Math.abs(g.userData.openValue-desired)<.001)g.userData.openValue=desired;
   const value=g.userData.openValue,opacity=1-THREE.MathUtils.smoothstep(value,.1,.9);
   g.visible=value<.985;g.position.y=g.userData.baseY+value*1.2;g.scale.setScalar(1-value*.035);
   for(const m of g.children){m.material.opacity=opacity;m.material.depthWrite=opacity>.45;m.castShadow=opacity>.6;}
  }
  for(const g of cutawayParts){
   const desired=g.userData.room===openRoofOwner?1:0;
   g.userData.openValue=THREE.MathUtils.lerp(g.userData.openValue,desired,blend);g.scale.y=1-g.userData.openValue*.72;
  }
  updateStages(blend);
  if(!reduceMotion)for(const f of flags){const p=f.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i);p.setZ(i,Math.sin(x*6+time*.0025)*.055*(x/.7));}p.needsUpdate=true;}
  walker.update(elapsed,time/1000);life.update(elapsed,time/1000);
  if(trackingCharacter&&!transition){
   const position=walker.getPosition();
   if(position){const delta=position.add(new THREE.Vector3(0,.35,0)).sub(controls.target).multiplyScalar(1-Math.exp(-elapsed*5));controls.target.add(delta);camera.position.add(delta);}
  }
  controls.autoRotate=!exploring&&!reduceMotion&&!transition&&!orbiting&&time>=orbitPausedUntil&&!document.querySelector('#role-dialog[open]');
  controls.update(elapsed);
  if(!document.querySelector('#role-dialog[open]')||transition)renderer.render(scene,camera);
  callbacks.onFrame?.(project,life.getMarkers());
 }
 raf=requestAnimationFrame(frame);
 return{enter,leave,overview,arrive,zoomIn:()=>zoom(1.17),zoomOut:()=>zoom(1/1.17),reset,select,project,renderer,scene,camera,
  setCharacterRole(id){walker.setRole(id);walker.setVisible(exploring);syncWalking();},
  setWalking(enabled){walkingEnabled=Boolean(enabled);syncWalking();},
  moveCharacter:(direction,pressed)=>walker.setDirection(direction,pressed),findCharacter,greetCharacter:()=>walker.greet(),
  setLifeState:snapshot=>life.sync(snapshot),isTransitioning:()=>Boolean(transition),interactLife,reactLife:(type,id)=>life.react(type,id),highlightLife:(type,id)=>life.setHover(type,id),getLifeMarkers:()=>life.getMarkers(),
  dispose(){cancelAnimationFrame(raf);observer.disconnect();walker.dispose();life.dispose();expansion.dispose?.();controls.dispose();renderer.dispose();},
  getStats:()=>({calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,selectedId,focusedId,activeStage})};
}
