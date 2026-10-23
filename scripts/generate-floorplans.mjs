import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { rooms } from '../src/data.js';
import { keepWingLayouts, keepRoomIds, keepFurniturePlan } from '../src/keep-wing.js';
import { basementWingLayouts, basementRoomIds, basementFurnishings } from '../src/basement-wing.js';

// Architectural reading diagrams, aligned with castle.js (north is -z).
// Geometry is schematic: these drawings deliberately contain no measured scale.
const out = fileURLToPath(new URL('../public/plans/', import.meta.url));
await mkdir(out, { recursive: true });
const P = { paper:'#f8f2e8', ink:'#655546', wood:'#d6b98f', stone:'#dcd5c4', sage:'#bec5aa', red:'#c49680', blue:'#b9cdd0' };
const esc = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
let pieces = [], marks = [], origin = {}, extent = {};
const add = text => pieces.push(text);
const rect = (x,y,w,h,cls='wood',rx=0) => add(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" class="${cls}"/>`);
const circle = (x,y,r,cls='wood') => add(`<circle cx="${x}" cy="${y}" r="${r}" class="${cls}"/>`);
const ellipse = (x,y,rx,ry,cls='wood') => add(`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" class="${cls}"/>`);
const path = (d,cls='line') => add(`<path d="${d}" class="${cls}"/>`);
const line = (x,y,x2,y2,cls='line') => path(`M${x} ${y}L${x2} ${y2}`,cls);
const mark = (n,x,y) => marks.push({n,x,y});
function setup(x,y,w,h,interior=true) {
  extent={x,y,w,h}; const margin=interior?.34:.06; origin={s:Math.min(510/(w+margin),294/(h+margin)),x:400,y:299,cx:x+w/2,cy:y+h/2};
  if(interior){
    rect(x-.07,y-.07,w+.14,h+.14,'masonry'); rect(x,y,w,h,'floor');
    // A quiet seam gives the cut stone wall its depth without heavy shadows.
    rect(x-.115,y-.115,w+.23,h+.23,'outline');
    windowAt(x+w*.25,y,w*.2);windowAt(x+w*.67,y,w*.18);
    door(x+w*.32,y+h,Math.min(w*.22,.42));
  }
}
function basementSetup(x,y,w,h,openings){
  setup(x,y,w,h,false);
  rect(x-.08,y-.08,w+.16,h+.16,'masonry');rect(x,y,w,h,'stone');rect(x-.13,y-.13,w+.26,h+.26,'outline');
  for(let z=y+.48;z<y+h;z+=.48)line(x,z,x+w,z,'fine');
  for(let row=0;row<h/.48;row++)for(let xx=x+.48+(row%2)*.48;xx<x+w;xx+=.96)line(xx,y+row*.48,xx,Math.min(y+h,y+(row+1)*.48),'fine');
  for(const [edge,at] of openings){
    if(edge==='east'||edge==='west'){
      const xx=edge==='east'?x+w:x;rect(xx-.15,at-.48,.3,.96,'stone');line(xx-.3,at,xx+.3,at,'swing');
    }else{
      const yy=edge==='north'?y:y+h;rect(at-.48,yy-.15,.96,.3,'stone');line(at,yy-.3,at,yy+.3,'swing');
    }
  }
}
function windowAt(x,y,w){rect(x,y-.072,w,.145,'paper');line(x,y-.035,x+w,y-.035);line(x,y+.035,x+w,y+.035);line(x+w/2,y-.06,x+w/2,y+.06);}
function door(x,y,w){rect(x,y-.025,w,.14,'paper');line(x,y,x,y-w);path(`M${x} ${y-w}A${w} ${w} 0 0 1 ${x+w} ${y}`,'swing');}
function bed(x,y,w=.63,d=1.08,royal=false){
  rect(x-w/2-.025,y-d/2-.025,w+.05,d+.05,'timber',.025);rect(x-w/2+.035,y-d/2+.045,w-.07,d-.09,'linen',.025);
  rect(x-w/2+.06,y-d/2+.075,w-.12,d*.19,'paper',.035);rect(x-w/2+.035,y-d*.06,w-.07,d*.49,royal?'rug':'blue',.015);
  line(x-w/2+.07,y+d*.02,x+w/2-.07,y+d*.02);line(x-w/2+.07,y+d*.36,x+w/2-.07,y+d*.36);
  if(royal)for(const dx of [-w/2,w/2])for(const dy of [-d/2,d/2])circle(x+dx,y+dy,.027,'brass');
}
function chest(x,y,w=.36,h=.24){rect(x-w/2,y-h/2,w,h,'wood',.02);line(x-w*.29,y-h/2,x-w*.29,y+h/2);line(x+w*.29,y-h/2,x+w*.29,y+h/2);rect(x-.025,y-.03,.05,.06,'brass');}
function jar(x,y,r=.07){circle(x,y,r,'pot');circle(x,y,r*.58,'paper');circle(x,y,r*.3,'fine');}
function barrel(x,y,r=.16){circle(x,y,r,'wood');circle(x,y,r*.81,'fine');for(const d of [-.4,0,.4])line(x-r*.69,y+d*r,x+r*.69,y+d*r);}
function shelf(x,y,w=.7,h=.2){rect(x-w/2,y-h/2,w,h,'wood');line(x-w/2+.025,y-h/2+.035,x+w/2-.025,y-h/2+.035);for(let i=0;i<4;i++)jar(x-w*.34+w*.225*i,y+.012,Math.min(h*.28,w*.075));}
function candle(x,y){circle(x,y,.035,'brass');circle(x,y,.011,'paper');}
function table(x,y,w,d,feast=false,benches=true){
  rect(x-w/2,y-d/2,w,d,'wood',.025);line(x-w/2+.045,y-d/2+.045,x+w/2-.045,y-d/2+.045);line(x-w/2+.045,y+d/2-.045,x+w/2-.045,y+d/2-.045);
  if(benches)for(const dy of [-d*.86,d*.86])rect(x-w/2+.045,y+dy-.065,w-.09,.13,'wood',.02);
  if(feast){rect(x-w*.37,y-d*.22,w*.74,d*.44,'linen');for(let i=0;i<5;i++){const xx=x-w*.36+i*w*.18;circle(xx,y,.055,'paper');jar(xx,y-d*.32,.023);}candle(x-w*.3,y);candle(x+w*.3,y);}
  else {rect(x-w*.17,y-d*.27,w*.34,d*.54,'paper');path(`M${x-w*.14} ${y}q${w*.08} ${-d*.2} ${w*.12} 0t${w*.12} 0`,'fine');candle(x-w*.4,y);candle(x+w*.4,y);}
}
function chair(x,y,w=.28){rect(x-w/2,y-w/2,w,w,'wood',.015);rect(x-w/2+.025,y-w/2+.025,w-.05,w-.05,'rug');rect(x-w/2,y-w/2-.04,w,.045,'timber');}
function rug(x,y,w,h,cls='rug'){rect(x-w/2,y-h/2,w,h,cls);rect(x-w/2+.045,y-h/2+.045,w-.09,h-.09,'fine');for(let xx=x-w/2+.04;xx<x+w/2;xx+=.07){line(xx,y-h/2-.045,xx,y-h/2,'fine');line(xx,y+h/2,xx,y+h/2+.045,'fine');}}
function hearth(x,y,w=.55,h=.34){rect(x-w/2,y-h/2,w,h,'masonry');rect(x-w*.33,y-h*.22,w*.66,h*.52,'coal');for(let i=0;i<3;i++){line(x-w*.23,y-h*.09+i*h*.16,x+w*.23,y-h*.09+i*h*.16,'ember');}rect(x-w*.56,y+h*.36,w*1.12,h*.3,'stone');}
function sack(x,y,r=.12){ellipse(x,y,r,r*.8,'linen');path(`M${x-r*.5} ${y-r*.42}q${r*.5} ${r*.35} ${r} 0`,'fine');circle(x,y-r*.53,r*.14,'timber');}
function stool(x,y,r=.1){circle(x,y,r,'wood');circle(x,y,r*.77,'fine');}
function horse(x,y){ellipse(x,y,.13,.25,'wood');ellipse(x,y-.23,.075,.13,'timber');rect(x-.13,y-.05,.26,.2,'rug',.02);path(`M${x} ${y+.23}q.12 .15 .04 .23`);}

const basementFurniturePlan=Object.fromEntries(Object.entries(basementFurnishings).map(([id,list])=>[id,list.map(p=>({...p,kind:p.type,w:p.w??p.r*2,d:p.d??p.r*2}))]));

// These larger diagrams read the same furniture footprints as the 3D model.
// Whole-floor sheets keep every doorway and room name visible at a glance.
function wingFurniture(p){
  const {kind,x,z,w,d}=p, r=p.r??Math.min(w,d)/2;
  if(kind==='bed'){bed(x,z,w,d,Boolean(p.canopy));return;}
  if(kind==='chest'||kind==='wardrobe'){chest(x,z,w,d);return;}
  if(kind==='hearth'){hearth(x,z,w,d);return;}
  if(kind==='chair'){chair(x,z,w);return;}
  if(kind==='barrel'){barrel(x,z,r);return;}
  if(kind==='plant'){circle(x,z,r,'pot');for(let i=0;i<5;i++){const a=i*Math.PI*.4;ellipse(x+Math.cos(a)*r*.4,z+Math.sin(a)*r*.4,r*.4,r*.2,'sage');}return;}
  if(kind==='pool'||kind==='coolingTrough'){
    rect(x-w/2,z-d/2,w,d,kind==='pool'?'stone':'wood',.06);rect(x-w/2+.14,z-d/2+.14,w-.28,d-.28,kind==='pool'?'water':'pot',.025);return;
  }
  if(kind==='vat'||kind==='well'){
    circle(x,z,r,kind==='well'?'stone':'wood');circle(x,z,r*.78,kind==='well'?'water':'pot');
    if(kind==='vat')line(x-r*.7,z-r*.5,x+r*.7,z+r*.5);else rect(x-r,z-.05,r*2,.1,'wood');return;
  }
  if(kind==='stairs'){
    rect(x-w/2,z-d/2,w,d,'stone');for(let dz=-d/2;dz<d/2;dz+=d/9)line(x-w/2,z+dz,x+w/2,z+dz);
    path(`M${x} ${z-d*.35}V${z+d*.35}m-.15 -.25l.15 .25.15 -.25`,'line');return;
  }
  if(kind==='wineRack'){
    rect(x-w/2,z-d/2,w,d,'wood');for(let xx=x-w/2+.4;xx<x+w/2-.1;xx+=.85){rect(xx-.24,z-d*.38,.48,d*.76,'wood',.12);line(xx-.24,z-.15,xx+.24,z-.15);line(xx-.24,z+.15,xx+.24,z+.15);}return;
  }
  if(kind==='sacks'||kind==='maltShelf'){
    rect(x-w/2,z-d/2,w,d,'wood');for(let zz=z-d*.3;zz<=z+d*.3+.01;zz+=Math.max(.3,d*.3))for(const dx of [-w*.22,w*.22])sack(x+dx,zz,Math.min(.18,w*.22));return;
  }
  if(kind==='bookshelf'||kind==='scrolls'||p.documents){
    rect(x-w/2,z-d/2,w,d,'wood');const horizontal=w>=d, count=Math.max(3,Math.floor(Math.max(w,d)/.19));
    for(let i=0;i<count;i++){
      const xx=horizontal?x-w*.44+(i+.5)*w*.88/count:x,zz=horizontal?z:z-d*.44+(i+.5)*d*.88/count;
      if(kind==='scrolls'||p.documents){circle(xx,zz,Math.min(w,d)*.28,'linen');circle(xx,zz,Math.min(w,d)*.1,'fine');}
      else rect(xx-(horizontal?w*.32/count:w*.36),zz-(horizontal?d*.36:d*.32/count),horizontal?w*.64/count:w*.72,horizontal?d*.72:d*.64/count,['rug','blue','sage'][i%3]);
    }return;
  }
  if(p.textiles){
    rect(x-w/2,z-d/2,w,d,'wood');for(let xx=x-w*.35,i=0;xx<x+w*.45;xx+=Math.max(.4,w*.23),i++)rect(xx-w*.08,z-d*.32,w*.16,d*.64,['rug','blue','linen','sage'][i%4],.02);return;
  }
  if(['shelf','bottleShelf','provisionShelf','sealedShelf','weaponBench','dryingRack'].includes(kind)){
    rect(x-w/2,z-d/2,w,d,'wood');const horizontal=w>=d,count=Math.max(3,Math.floor(Math.max(w,d)/.48));
    for(let i=0;i<count;i++){
      const xx=horizontal?x-w*.38+i*w*.76/(count-1):x,zz=horizontal?z:z-d*.35+i*d*.7/(count-1);
      if(kind==='sealedShelf')chest(xx,zz,Math.min(w*.66,.36),Math.min(d*.6,.36));
      else if(kind==='provisionShelf')sack(xx,zz,.17);
      else if(kind==='weaponBench'){ellipse(xx,zz,.16,.2,'coal');line(xx,zz-.2,xx,zz+.2);}
      else if(kind==='dryingRack'){ellipse(xx,zz,.14,.22,'sage');line(xx-.1,zz-.15,xx+.1,zz+.15);}
      else jar(xx,zz,Math.min(.13,w*.25,d*.28));
    }return;
  }
  if(kind==='weaponRack'||kind==='shieldStand'){
    rect(x-w/2,z-d/2,w,d,'wood');
    if(kind==='weaponRack')for(let zz=z-d*.4;zz<z+d*.5;zz+=.38){line(x-w*.35,zz,x+w*.35,zz);path(`M${x+w*.35} ${zz}l-.15 -.07v.14z`,'coal');}
    else for(let xx=x-w*.32;xx<x+w*.4;xx+=.43){ellipse(xx,z,.17,.23,'blue');circle(xx,z,.05,'coal');}return;
  }
  if(kind==='memorial'){
    rect(x-w/2,z-d/2,w,d,'stone',.04);rect(x-w*.39,z-d*.43,w*.78,d*.86,'fine');line(x,z-d*.24,x,z+d*.24);line(x-w*.2,z-d*.06,x+w*.2,z-d*.06);return;
  }
  if(kind==='altar'){
    rect(x-w/2,z-d/2,w,d,'stone');rect(x-w*.4,z-d*.36,w*.8,d*.72,'linen');candle(x-w*.32,z);candle(x+w*.32,z);line(x,z-d*.3,x,z+d*.3);line(x-.13,z-.06,x+.13,z-.06);return;
  }
  if(kind==='bench'){rect(x-w/2,z-d/2,w,d,'wood',.04);line(x-w*.4,z-d*.3,x+w*.4,z-d*.3);return;}
  if(kind==='pump'){
    rect(x-w/2,z-d/2,w,d,'stone');circle(x,z,.14,'coal');line(x,z,x+w*.4,z-d*.3);jar(x-w*.2,z+d*.2,.13);return;
  }
  if(kind==='washstand'||kind==='waterBench'){
    rect(x-w/2,z-d/2,w,d,'wood');circle(x-w*.16,z,Math.min(.25,d*.35),'brass');circle(x-w*.16,z,Math.min(.19,d*.27),'blue');jar(x+w*.3,z,.1);return;
  }
  table(x,z,w,d,false,false);
  if(kind==='chess'){
    const side=Math.min(w,d)*.6;for(let row=0;row<6;row++)for(let col=0;col<6;col++)rect(x-side/2+col*side/6,z-side/2+row*side/6,side/6,side/6,(row+col)%2?'timber':'linen');
  }else if(kind==='sewing'){rect(x-w*.3,z-d*.25,w*.55,d*.6,'blue');for(const dx of [-.1,.1])circle(x+w*.3,z+dx,.075,'rug');}
  else if(kind==='countingTable'){line(x-w*.22,z,x+w*.22,z);circle(x-w*.22,z,.14,'brass');circle(x+w*.22,z,.14,'brass');}
  else if(kind==='repairTable'){line(x-w*.35,z,x+w*.35,z);rect(x-w*.1,z-d*.2,w*.1,d*.4,'coal');}
  else if(kind==='sortingTable'||kind==='mashTable')for(const dx of [-.2,0,.2])circle(x+dx,z,.08,'sage');
}
function wingShell(bounds,basement,stone=false){
  const [x1,z1,x2,z2]=bounds,w=x2-x1,d=z2-z1,mid=(x1+x2)/2,inner=z2<0?z2:z1,fill=basement||stone?'stone':'floor',doorWidth=basement?1.8:2;
  rect(x1-.08,z1-.08,w+.16,d+.16,'masonry');rect(x1+.03,z1+.03,w-.06,d-.06,fill);
  rect(mid-doorWidth/2,inner-.16,doorWidth,.32,fill);line(mid,inner-.32,mid,inner+.32,'swing');
  if(basement){
    const doorZ=z2<0?-4.5:4.5;
    for(const xx of [x1,x2])if(Math.abs(xx)<10.99){rect(xx-.16,doorZ-.8,.32,1.6,fill);line(xx-.3,doorZ,xx+.3,doorZ,'swing');}
  }else windowAt(mid-.65,z2<0?z1:z2,1.3);
}
const wingLegends={
  keep:[['bed','帷幔木床与睡眠区'],['washstand','盥洗台与水盆'],['table','阅读与会坐木案']],
  chapel:[['altar','祭坛与烛台'],['bench','长椅与中央祈祷通道'],['lectern','经书讲台']],
  council:[['table','议事长桌与文书'],['hearth','壁炉与接待空间'],['shelf','地图与卷册']],
  storage:[['shelf','沿墙家政物资架'],['chest','带锁木箱'],['table','织物整理木案']],
  library:[['bookshelf','抄本与文书书架'],['table','阅览与校订木案'],['scrolls','封存卷册']],
  solar:[['hearth','壁炉与休憩空间'],['chess','棋桌与家庭游戏'],['sewing','针线与织物工作台']],
  guestroom:[['bed','旅客木床与铺盖'],['chest','行囊与物资木箱'],['washstand','共用盥洗台']],
  cellar:[['wineRack','双层酒桶架'],['barrel','直立储酒桶'],['tasting','量酒与清点台']],
  brewery:[['vat','大木酿造槽'],['coolingTrough','冷却与处理木槽'],['mashTable','麦芽搅拌木案']],
  larder:[['provisionShelf','垫高粮食与陶罐货架'],['sacks','备用粮袋'],['sortingTable','分装清点木案']],
  cistern:[['pool','石砌蓄水池'],['pump','引水装置与吊桶'],['waterBench','水罐与清洁器具']],
  armory:[['weaponRack','枪矛与工具架'],['shieldStand','盾牌整备架'],['repairTable','器械维修木案']],
  treasury:[['chest','铁箍封存木箱'],['countingTable','天平与清点木案'],['sealedShelf','契据与封存架']],
  crypt:[['altar','追思祭坛与烛光'],['memorial','石制纪念匣'],['memorial','中央祈祷通道']],
};
function wingDrawing(id,basement=false){
  const layouts=basement?basementWingLayouts:keepWingLayouts,ids=basement?basementRoomIds:keepRoomIds,plans=basement?basementFurniturePlan:keepFurniturePlan;
  const whole=id===(basement?'undercroft':'gallery'),plan=layouts[id],bounds=whole?plan.frameBounds:plan.roomBounds,[x1,z1,x2,z2]=bounds;
  setup(x1,z1,x2-x1,z2-z1,false);rect(x1-.1,z1-.1,x2-x1+.2,z2-z1+.2,'masonry');rect(x1,z1,x2-x1,z2-z1,basement?'stone':'floor');
  if(whole&&!basement)rect(-12,-2,24,4,'stone');
  const drawn=whole?ids:[id];
  for(const rid of drawn){
    if(rid!=='gallery')wingShell(layouts[rid].roomBounds,basement,rid==='chapel');
    for(const p of plans[rid]||[])wingFurniture(p);
  }
  if(whole){
    for(const rid of ids){
      if(rid==='gallery')continue;
      const [a,b,c,d]=layouts[rid].roomBounds,xx=(a+c)/2,zz=d<0?d-.58:b+.58;
      const name=rooms.find(r=>r.id===rid)?.name||rid;
      add(`<text x="${xx}" y="${zz}" text-anchor="middle" dominant-baseline="middle" style="font-size:.43px;fill:${P.ink};stroke:${P.paper};stroke-width:.12;paint-order:stroke;letter-spacing:.025px">${esc(name)}</text>`);
    }
    add(`<text x="0" y=".18" text-anchor="middle" style="font-size:.43px;fill:${P.ink};stroke:none;letter-spacing:.06px">${basement?'中央石廊 · 八室连通':'主堡长廊 · 南北两翼'}</text>`);
    if(basement){mark(1,-8.25,-6);mark(2,8.25,-5);mark(3,2.75,5);mark(4,9.65,6.35);return ['北翼：酒窖、酿造与粮食','蓄水厅与维护步道','南翼：器械、封存与纪念','石阶入口与连通门洞'];}
    mark(1,-9,-5.5);mark(2,9,-5.5);mark(3,0,6.3);mark(4,10.7,0);return ['北翼：卧室、礼拜与议事','图书室与阅览木案','南翼：储藏、起居与客房','长廊、拱券与上下石阶'];
  }
  const spec=wingLegends[id],list=plans[id]||[],seen=new Set();
  spec.forEach(([kind],i)=>{
    if(id==='crypt'&&i===2){mark(3,(x1+x2)/2,(z1+z2)/2);return;}
    const p=list.find(p=>p.kind===kind&&!seen.has(p))||list.find(p=>!seen.has(p));
    if(p){seen.add(p);mark(i+1,p.x,p.z);}
  });
  mark(4,(x1+x2)/2,z2<0?z2-.18:z1+.18);
  return [...spec.map(([,label])=>label),basement?'连接中央石廊与邻室':'通往主堡长廊'];
}

const drawings = {
  keep:()=>wingDrawing('keep'),
  chapel:()=>wingDrawing('chapel'),
  council:()=>wingDrawing('council'),
  storage:()=>wingDrawing('storage'),
  library:()=>wingDrawing('library'),
  solar:()=>wingDrawing('solar'),
  guestroom:()=>wingDrawing('guestroom'),
  gallery:()=>wingDrawing('gallery'),
  hall(){
    setup(.2,0,7.4,5.8);rug(3.9,2.8,5.1,2.7);table(3.9,2.8,3.8,.72,true,false);
    for(const z of [2.08,3.52])for(const [x1,x2] of [[2,3.05],[3.75,5.8]])rect(x1,z-.13,x2-x1,.26,'wood',.02);
    hearth(3.9,.6,1.4,.72);shelf(1.55,.48,2.2,.52);shelf(6.18,.47,2.15,.52);
    rect(6.8,2.15,.6,1.7,'wood',.02);for(const z of [2.4,2.95,3.45]){circle(7.1,z,.16,'brass');circle(7.1,z,.095,'linen');}
    chest(6.58,5.24,1.44,.5);rect(6.08,5.07,.25,.34,'blue');rect(6.58,5.07,.25,.34,'blue');barrel(.85,5.06,.295);barrel(1.35,5.14,.205);
    for(const x of [1.1,2.6,5.2,6.7])rect(x-.23,.03,.46,.11,x<3?'rug':'blue');
    mark(1,3.9,2.8);mark(2,3.9,.6);mark(3,7.1,3);mark(4,1.55,.48);return ['宴会长桌与宽敞通道','石砌壁炉','侍餐台与盛食盘','餐具架与饮食储备'];
  },
  kitchen(){
    setup(4.11,.64,1.6,1.44);hearth(5.17,.95,.58);circle(5.17,.97,.14,'coal');circle(5.17,.97,.105,'pot');line(5.02,.97,5.32,.97);
    rect(4.28,1.4,.63,.34,'wood',.015);rect(4.37,1.45,.22,.21,'stone');ellipse(4.72,1.55,.08,.055,'linen');jar(4.33,1.59,.046);
    shelf(4.51,.84,.52,.2);barrel(5.4,1.71,.12);for(let i=0;i<3;i++)circle(5.27+i*.09,1.42,.04,'sage');
    mark(1,5.17,.98);mark(2,4.6,1.57);mark(3,4.51,.84);mark(4,5.4,1.71);return ['炉灶与汤锅','木案与备餐器具','食品陶罐架','取水木桶'];
  },
  barracks(){
    setup(-5.59,-3.475,1.78,3.45);for(let i=0;i<3;i++){bed(-4.88,-2.9+i*1.05);chest(-4.22,-2.96+i*1.05,.26,.24);}
    rect(-4.08,-2.95,.14,2.35,'wood');for(let i=0;i<5;i++){line(-4.15,-2.8+i*.45,-3.94,-2.8+i*.45);path(`M-3.94 ${-2.8+i*.45}l-.035 -.04v.08z`,'coal');}
    for(let i=0;i<2;i++){ellipse(-4.08,-1.16+i*.4,.13,.16,'rug');line(-4.08,-1.32+i*.4,-4.08,-1+i*.4);}
    mark(1,-4.89,-2.9);mark(2,-4.22,-1.91);mark(3,-4.06,-2.4);mark(4,-4.08,-.76);return ['轮值木床','个人装备箱','枪矛架','木盾与整备处'];
  },
  stable(){
    setup(-5.55,.64,1.8,2.2);for(let z=.75;z<2.7;z+=.7){rect(-5.42,z,1.3,.05,'wood');rect(-5.38,z+.08,.28,.47,'hay');for(let j=0;j<4;j++)line(-5.34+j*.055,z+.12,-5.32+j*.055,z+.48,'fine');}
    horse(-4.62,1.12);horse(-4.62,1.83);barrel(-4.08,2.56,.1);jar(-4.3,2.53,.09);rect(-4.03,1.05,.13,1.05,'wood');for(let z of [1.23,1.74]){rect(-4.12,z,.18,.19,'rug',.035);}
    mark(1,-5.23,1.05);mark(2,-4.62,1.81);mark(3,-4.04,1.46);mark(4,-4.08,2.56);return ['分栏与草料槽','马匹照料区','鞍具架','饮水与清理桶'];
  },
  forge(){
    setup(-4.58,3.12,1.9,1.38);hearth(-4.16,3.47,.55);shelf(-3.32,3.31,.6,.18);
    rect(-3.79,3.83,.39,.26,'timber');path('M-3.84 3.83h.46l.25 .11-.25 .11h-.46z','coal');line(-3.82,3.94,-3.55,3.94);rect(-3.58,3.87,.08,.14,'stone');
    barrel(-2.9,4.13,.12);rect(-3.11,3.56,.23,.33,'wood');for(let i=0;i<3;i++)rect(-3.09,3.58+i*.09,.19,.035,'stone');
    mark(1,-4.16,3.47);mark(2,-3.6,3.94);mark(3,-3.32,3.31);mark(4,-2.9,4.13);return ['锻炉与燃料','铁砧与锤具','工具架','淬火水桶'];
  },
  granary(){
    setup(-3.72,-4.39,1.8,1.2);shelf(-2.82,-4.23,1.36,.18);for(let i=0;i<3;i++){barrel(-3.37+i*.45,-3.55,.125);sack(-2.24,-3.44-i*.24,.115);}
    chest(-3.43,-3.95,.3,.28);jar(-2.81,-3.88,.08);rect(-3.06,-3.94,.13,.16,'wood');
    mark(1,-2.82,-4.23);mark(2,-2.92,-3.55);mark(3,-2.24,-3.67);mark(4,-3.43,-3.95);return ['通风货架','谷物木桶','麻袋储粮','叠箱与量斗'];
  },
  scriptorium(){
    setup(-1.625,-4.2,1.65,1.4);
    rect(-1.32,-4.05,1.08,.28,'wood',.015);
    rect(-1.21,-4.015,.35,.21,'linen',.01);line(-1.035,-4.01,-1.035,-3.81);
    for(let z=-3.97;z< -3.83;z+=.038){line(-1.18,z,-1.07,z,'fine');line(-1,z,-.89,z,'fine');}
    rect(-.78,-4.01,.21,.17,'paper',.01);for(let z=-3.97;z< -3.86;z+=.03)line(-.75,z,-.6,z,'fine');
    jar(-.44,-3.86,.038);candle(-.31,-3.97);path('M-.5 -3.88l.075 -.12q.07 -.045 .05 .035l-.125 .085','linen');
    rect(-1.51,-3.67,.26,.63,'wood');for(let z=-3.63;z< -3.09;z+=.075){rect(-1.48,z,.2,.055,z< -3.4?'rug':'blue',.005);line(-1.45,z+.012,-1.45,z+.043,'fine');}
    chest(-.2,-3.24,.24,.32);for(let z of [-3.34,-3.24,-3.14]){rect(-.27,z-.025,.14,.05,'linen',.02);circle(-.27,z,.025,'paper');}
    rug(-.83,-3.24,.42,.32,'blue');
    mark(1,-1.04,-3.91);mark(2,-1.38,-3.37);mark(3,-.2,-3.24);mark(4,-.4,-3.91);
    return ['缮写木案与经书','经书与文书架','卷册与封存匣','羽毛笔、墨水与蜡烛'];
  },
  infirmary(){
    setup(-3.325,.675,1.55,1.95);bed(-2.98,1.55,.5,1.03);
    shelf(-2.32,.87,.74,.22);for(let x=-2.57;x< -2.02;x+=.16){path(`M${x} .8l-.035 -.055M${x} .8l.025 -.065M${x} .8v-.075`,'fine');}
    rect(-2.1,1.635,.24,.63,'wood',.01);circle(-1.98,1.83,.073,'stone');circle(-1.98,1.83,.047,'sage');line(-1.99,1.84,-1.89,1.73);jar(-1.98,2.105,.066);
    rect(-2.05,2.19,.14,.05,'linen',.015);line(-2.02,2.195,-2.02,2.235,'fine');
    for(let x=-2.62;x< -2.1;x+=.15){line(x,.69,x,.76,'fine');ellipse(x-.018,.738,.026,.045,'sage');ellipse(x+.018,.742,.024,.04,'sage');}
    rug(-2.64,2.34,.67,.22,'blue');
    mark(1,-2.98,1.54);mark(2,-2.32,.87);mark(3,-1.98,1.83);mark(4,-1.98,2.16);
    return ['亚麻卧榻与休养处','药柜、干草与陶罐','研药台与石研钵','清水与洁净布条'];
  },
  weavery(){
    setup(-1.775,3.245,1.85,1.25);
    rect(-1.585,3.53,.65,.62,'timber',.015);rect(-1.54,3.58,.56,.52,'linen');
    for(let x=-1.52;x< -.98;x+=.034)line(x,3.58,x,4.1,'fine');
    for(let z=3.83;z<4.1;z+=.03)line(-1.54,z,-.98,z,z<3.93?'fine':'line');
    rect(-1.61,3.54,.70,.055,'wood',.015);rect(-1.61,4.08,.70,.055,'wood',.015);rect(-1.47,3.755,.4,.045,'rug',.015);
    rect(-.6,3.345,.5,.19,'wood');for(let i=0;i<3;i++){const x=-.51+i*.155;circle(x,3.435,.065,['rug','blue','sage'][i]);path(`M${x-.045} 3.4q.085 .02 .09 .065M${x-.05} 3.42q.08 .01 .085 .065`,'fine');}
    circle(-.225,4.245,.105,'wood');circle(-.225,4.245,.08,'blue');path('M-.28 4.27l.095 -.09','fine');
    rect(-.32,4.08,.25,.07,'linen',.025);circle(-.305,4.115,.035,'paper');circle(-.305,4.115,.015,'fine');
    mark(1,-1.26,3.85);mark(2,-.35,3.44);mark(3,-.225,4.27);mark(4,-.2,4.08);
    return ['木织机与经纬线','染色线团与纱线架','木染盆与染液','布卷与修补用料'];
  },
  cellar:()=>wingDrawing('cellar',true),
  larder:()=>wingDrawing('larder',true),
  armory:()=>wingDrawing('armory',true),
  undercroft:()=>wingDrawing('undercroft',true),
  brewery:()=>wingDrawing('brewery',true),
  cistern:()=>wingDrawing('cistern',true),
  crypt:()=>wingDrawing('crypt',true),
  treasury:()=>wingDrawing('treasury',true),
  garden(){
    setup(-1.3,.38,2.64,2.4,false);rect(-1.17,.51,2.37,2.14,'earth');
    for(let x=-1.17;x<1.21;x+=.22){rect(x,.46,.045,.11,'wood');rect(x,2.6,.045,.11,'wood');}for(let y=.51;y<2.66;y+=.22){rect(-1.22,y,.11,.045,'wood');rect(1.15,y,.11,.045,'wood');}
    for(let x=-.89;x<1.1;x+=.34){rect(x-.09,.72,.18,1.7,'soil');for(let z=.83;z<2.36;z+=.22){ellipse(x-.03,z,.05,.025,'sage');ellipse(x+.03,z-.02,.04,.055,'sage');line(x,z-.05,x,z+.05);}}
    rect(-.24,2.59,.48,.13,'paper');path('M-.24 2.64l.36 .27','line');jar(.94,2.5,.07);mark(1,-.89,1.03);mark(2,.13,1.47);mark(3,.81,2.1);mark(4,-.04,2.69);return ['葱蒜与香草','蔬菜畦垄','豆类与季节作物','围栏入口'];
  },
  courtyard(){
    setup(-3.8,-3,5.3,4.1,false);path('M-3.6 -2.7L.9 -2.7L1.3 -.5L.9 .9L-2.9 .9L-3.6 -.6Z','earth');
    path('M-3.5 -1.4Q-1.8 -.8 .9 -.1M-1.5 -2.7Q-1.6 -.9 -.5 .9','yardpath');
    circle(-1.63,-.85,.55,'stone');circle(-1.63,-.85,.44,'paper');circle(-1.63,-.85,.33,'blue');rect(-2.08,-.91,.9,.11,'wood');circle(-1.63,-.85,.055,'coal');barrel(-1.03,-.53,.13);
    for(let i=0;i<18;i++){const a=i/18*Math.PI*2;circle(-1.63+Math.cos(a)*.75,-.85+Math.sin(a)*.75,.04,'stone');}
    rect(-3.45,-2.52,.77,.48,'wood');circle(-3.3,-1.97,.12,'coal');circle(-2.83,-1.97,.12,'coal');chest(-.02,-2.23,.6,.4);barrel(.52,-2.2,.22);
    path('M-3.6 -2.7L.9 -2.7M-3.6 -2.7V-.6L-2.9 .9M.9 -.6V.9H-.1','boundary');
    mark(1,-1.63,-.85);mark(2,-2.97,-2.26);mark(3,.12,-2.18);mark(4,-.5,.5);return ['井台与汲水横梁','装卸手推车','暂存货物','通行与劳作空地'];
  },
  gate(){
    setup(-2.6,-1.75,5.2,4.7,false);rect(-2.65,-.53,5.3,1.25,'water');rect(-2.55,-1.5,5.1,.85,'masonry');
    for(let x of [-1.1,1.1]){circle(x,-.8,.8,'masonry');circle(x,-.8,.58,'floor');for(let i=0;i<10;i++){const a=i/10*Math.PI*2;line(x+Math.cos(a)*.61,-.8+Math.sin(a)*.61,x+Math.cos(a)*.8,-.8+Math.sin(a)*.8);}}
    rect(-.43,-1.55,.86,1.5,'earth');rect(-.43,-.26,.86,2.45,'wood');for(let z=-.15;z<2.15;z+=.2)line(-.43,z,.43,z);for(let x of [-.38,.38])line(x,-1.12,x,1.85,'chain');
    rect(-.46,-1.25,.92,.14,'timber');for(let x=-.38;x<.4;x+=.12)line(x,-1.32,x,-1.08);path('M-.43 -.52L-.43 -.98M.43 -.52L.43 -.98','boundary');
    mark(1,0,1.06);mark(2,0,-1.22);mark(3,-1.1,-.8);mark(4,1.9,.3);return ['桥面与木梁','厚木门与门闩','双塔守卫空间','壕沟与桥岸'];
  },
  tower(){
    setup(-2.9,-2.5,5.8,4.9,false);path('M-.9 -1.95H2.8V-1.15H-.9Z','masonry');path('M-1.7 -1.05V2.2H-.9V-1.05Z','masonry');
    rect(-.9,-1.8,3.7,.45,'floor');rect(-1.55,-1.05,.45,3.25,'floor');circle(-1.28,-1.5,1.02,'masonry');circle(-1.28,-1.5,.73,'floor');
    for(let i=0;i<12;i++){const a=i/12*Math.PI*2;line(-1.28+Math.cos(a)*.78,-1.5+Math.sin(a)*.78,-1.28+Math.cos(a)*1.02,-1.5+Math.sin(a)*1.02);}
    for(let x=0;x<2.7;x+=.42)rect(x,-2.03,.23,.16,'stone');for(let y=-.3;y<2.2;y+=.42)rect(-1.78,y,.16,.23,'stone');
    for(let i=0;i<11;i++){const a=i/11*Math.PI*1.7;line(-1.28+Math.cos(a)*.18,-1.5+Math.sin(a)*.18,-1.28+Math.cos(a)*.65,-1.5+Math.sin(a)*.65);}circle(-1.28,-1.5,.16,'stone');
    path('M.1 -.8Q1.2 -.6 2.2 .4','swing');mark(1,-1.28,-1.5);mark(2,1.2,-1.55);mark(3,-1.73,1.1);mark(4,-.18,-1.87);return ['塔内旋梯','墙头步道','垛口与守望面','墙塔连接处'];
  },
  moat(){
    setup(-4,-3,8,6,false);
    path('M-3.85 -1.4Q-3.1 -3.1 -.8 -2.75L2.6 -2.45Q3.8 -1.1 3.6 1.4Q2.6 2.85 .1 2.65L-2.8 2.1Q-4.15 .7 -3.85 -1.4Z','water');
    path('M-3.12 -1.18Q-2.5 -2.3 -.7 -2.12L2.13 -1.91Q3 -.7 2.81 1.01Q2.1 2.1 .12 1.92L-2.23 1.48Q-3.24 .36 -3.12 -1.18Z','earth');
    path('M-2.54 -1.08L-.73 -1.67L1.84 -1.48L2.24 .7L.1 1.4L-1.9 1.07Z','masonry');
    path('M-2.3 -1L-.7 -1.43L1.65 -1.26L1.97 .55L.1 1.13L-1.7 .85Z','sage');
    for(const [x,y] of [[-2.54,-1.08],[1.84,-1.48],[2.24,.7],[-1.9,1.07]]){circle(x,y,.23,'masonry');circle(x,y,.12,'floor');}
    rect(-.23,1.17,.46,1.64,'wood');for(let y=1.25;y<2.8;y+=.16)line(-.23,y,.23,y);rect(.65,-1.04,.85,.84,'stone');rect(-1.59,-.57,.5,.9,'wood');
    path('M-3.5 -.9Q-3.7 .2 -3.13 1.2M3.2 -.65Q3.5 .6 2.8 1.55M.9 -2.49Q1.7 -2.49 2.4 -2.15','ripple');
    mark(1,3.21,.24);mark(2,-2.56,.25);mark(3,.01,2.15);mark(4,.65,1.23);return ['水壕与缓行水面','城岸与土坡','唯一桥梁通道','城墙防线'];
  }
};

const metadata = {};
for(const room of rooms){
  pieces=[];marks=[];
  const legend=drawings[room.id]();
  const {s,x,y,cx,cy}=origin;
  const furniture=pieces.join('\n');
  const badges=marks.map(m=>`<g transform="translate(${x+(m.x-cx)*s} ${y+(m.y-cy)*s})"><circle r="10" fill="${P.ink}" stroke="${P.paper}" stroke-width="2"/><text class="badge" y="3.4">${m.n}</text></g>`).join('');
  const legends=legend.map((label,i)=>{const col=i%2,row=Math.floor(i/2);return `<g transform="translate(${90+col*335} ${510+row*29})"><circle r="9" fill="${P.ink}"/><text class="badge" y="3.4">${i+1}</text><text class="legend" x="19" y="4">${label}</text></g>`;}).join('');
  const caption=room.id==='gallery'?'主堡全层 · 八区与长廊连通，概念布局非实测图':room.id==='undercroft'?'地下全层 · 八室经石廊与侧门互通，非实测图':room.level==='basement'?'地下层陈设示意 · 连通石廊与邻室，非实测图':room.interior?'室内陈设示意 · 依场景布局绘制，非实测图':'区域布局示意 · 依场景关系绘制，非实测图';
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" role="img" aria-labelledby="title desc">
<title id="title">${esc(room.name)}平面图</title><desc id="desc">${esc(room.name)}俯视布局：${legend.join('、')}。${caption}。</desc>
<defs>
<pattern id="planks" width=".22" height=".7" patternUnits="userSpaceOnUse"><rect width=".22" height=".7" fill="#ede0c8"/><path d="M0 0V.7M0 .35H.22" fill="none" stroke="#ad9776" stroke-opacity=".23" stroke-width=".006"/></pattern>
<pattern id="hatch" width=".07" height=".07" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width=".07" height=".07" fill="#ded6c5"/><path d="M0 0V.07" stroke="#9e8a70" stroke-opacity=".45" stroke-width=".01"/></pattern>
<pattern id="waterlines" width=".4" height=".28" patternUnits="userSpaceOnUse"><rect width=".4" height=".28" fill="#c8dadd"/><path d="M0 .2Q.1 .15 .2 .2T.4 .2" fill="none" stroke="#7f9ba2" stroke-width=".009" opacity=".5"/></pattern>
</defs>
<style>
svg{background:${P.paper};color:${P.ink};font-family:"Songti SC","Noto Serif CJK SC",STSong,serif} .drawing *{stroke:${P.ink};stroke-width:1.1;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round} .floor{fill:url(#planks)}.masonry{fill:url(#hatch)}.wood{fill:${P.wood}}.timber{fill:#b79972}.stone{fill:${P.stone}}.paper{fill:${P.paper}}.linen{fill:#eee4ce}.rug{fill:${P.red}}.blue{fill:${P.blue}}.sage{fill:${P.sage}}.earth{fill:#e9dfca}.soil{fill:#c8b892}.pot{fill:#cbb29c}.brass{fill:#cdb179}.coal{fill:#8d8578}.hay{fill:#ddd1a4}.water{fill:url(#waterlines)}.line,.fine,.outline,.swing,.ripple{fill:none}.fine{stroke-width:.7;opacity:.66}.outline{stroke-width:.8;opacity:.62}.swing{stroke-width:.8;stroke-dasharray:3 3;opacity:.65}.ripple{stroke:#78949a;stroke-width:1.4}.ember{stroke:#d5af86;fill:none}.boundary{stroke-width:5;fill:none;stroke:#9e8b71}.yardpath{fill:none;stroke:#f3ebd9;stroke-width:24;stroke-linecap:butt}.chain{stroke-width:1.5;stroke-dasharray:2 2}.badge{text-anchor:middle;fill:${P.paper};font:10px Georgia,serif}.legend{fill:${P.ink};font-size:14px;letter-spacing:1px}
</style>
<rect x="20" y="20" width="760" height="560" rx="2" fill="none" stroke="#b6a48a" stroke-width=".65"/>
<path d="M20 48V20h28M752 20h28v28M20 552v28h28M752 580h28v-28" fill="none" stroke="#8e795e" stroke-width="1.2"/>
<text x="55" y="55" font-size="10" letter-spacing="3" fill="#8d7b62">CASTELLUM · SPATIAL ATLAS</text>
<text x="55" y="95" font-size="28" letter-spacing="4">${esc(room.name)}</text>
<text x="56" y="116" font-family="Georgia,serif" font-size="10" letter-spacing="1.8" fill="#8d7b62">${esc(room.english)}</text>
<text x="674" y="57" font-family="Georgia,serif" font-size="11" letter-spacing="2" fill="#8d7b62">PL. ${room.number}</text>
<g transform="translate(728 97)" stroke="${P.ink}" stroke-width=".9"><path d="M0 -10V14M-6 -3L0 -17L6 -3L0 -7Z" fill="#b5a58a"/><text x="0" y="-23" text-anchor="middle" stroke="none" fill="${P.ink}" font-family="Georgia,serif" font-size="10">N</text></g>
<path d="M55 132H745M55 476H745" stroke="#b9aa93" stroke-width=".7"/>
<g class="drawing" transform="translate(${x} ${y}) scale(${s}) translate(${-cx} ${-cy})">${furniture}</g>${badges}
${legends}
<text x="400" y="568" text-anchor="middle" font-size="10" letter-spacing="1.1" fill="#91806a">${caption}</text>
</svg>`;
  await writeFile(`${out}${room.id}.svg`,svg);
  metadata[room.id]={src:`plans/${room.id}.svg`,alt:`${room.name}平面图：${legend.join('、')}`,caption,legend};
}
await writeFile(new URL('../src/floorplans.js',import.meta.url),`// Generated by scripts/generate-floorplans.mjs.\nconst plans = ${JSON.stringify(metadata,null,2)};\nconst base = import.meta.env?.BASE_URL ?? '/';\nexport const floorPlans = Object.fromEntries(Object.entries(plans).map(([id, plan]) => [id, { ...plan, src: base + plan.src }]));\n`);
console.log(`Generated ${Object.keys(metadata).length} room and grounds plans.`);
