import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { rooms } from '../src/data.js';

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

const drawings = {
  keep(){
    setup(-1.4,-6.3,6.4,5);rug(1.05,-2.5,3.2,1.05);rug(3.6,-4.05,1.65,1.8,'blue');
    bed(-.25,-4.4,1.06,1.95,true);bed(1.15,-4.4,1.06,1.95);
    chest(-.7,-5.87,1.05,.45);chest(.9,-5.87,1.35,.45);shelf(3.65,-5.86,1.75,.44);
    hearth(4.52,-4.4,.76,.72);rect(3.875,-3.19,.95,.62,'wood',.025);rect(4.15,-3.05,.3,.34,'paper');line(4.3,-3.04,4.3,-2.72);candle(4.62,-2.85);chair(3.13,-2.95,.48);
    rect(-1.225,-2.47,1.35,.78,'wood',.02);circle(-.65,-2.08,.26,'brass');circle(-.65,-2.08,.21,'blue');jar(-.13,-2.08,.11);rect(-1.095,-2.205,.27,.31,'linen');
    mark(1,.45,-4.4);mark(2,.9,-5.87);mark(3,4.35,-2.88);mark(4,-.65,-2.08);
    return ['帷幔主床与家人卧榻','木箱与沿墙书架','壁炉旁的阅读角','盥洗台与清水盆'];
  },
  chapel(){
    setup(3.275,-4.225,1.65,2.45);rug(4.12,-2.98,.5,1.6,'blue');rect(3.78,-4.07,.68,.42,'stone');rect(3.84,-4.04,.56,.3,'linen');
    path('M4.12 -4.16v.22M4.045 -4.09h.15');candle(3.88,-3.9);candle(4.36,-3.9);
    for(let z=-3.3;z< -2;z+=.47){rect(3.66,z-.09,.92,.18,'wood',.015);line(3.69,z-.05,4.55,z-.05);}
    rect(3.42,-4.04,.28,.3,'wood');rect(3.45,-4.01,.22,.24,'paper');line(3.56,-4,3.56,-3.79);circle(4.69,-2.1,.115,'stone');circle(4.69,-2.1,.07,'blue');
    mark(1,4.12,-3.87);mark(2,3.56,-3.89);mark(3,4.12,-2.83);mark(4,4.69,-2.1);return ['祭坛与双烛','经书讲台','祈祷长椅','圣水盆'];
  },
  council(){
    setup(.55,-2.175,2.5,2.05);rug(1.72,-1.13,2.05,1.45);table(1.72,-1.13,1.62,.55);shelf(.98,-1.94,.72,.2);chest(2.73,-.42,.34,.29);
    chair(.72,-1.13,.26);chair(2.72,-1.13,.26);rect(2.03,-1.28,.25,.05,'linen');circle(2.04,-1.255,.028,'paper');
    mark(1,1.72,-1.13);mark(2,.98,-1.94);mark(3,2.72,-1.13);mark(4,2.73,-.42);return ['长桌与领地图','书架与账册','主位与席座','封存木箱'];
  },
  storage(){
    setup(3.25,-1.66,1.7,1.6);shelf(4.47,-1.48,.8,.2);chest(3.62,-1.31,.42,.4);chest(4.15,-1.28,.34,.3);
    for(let i=0;i<3;i++){barrel(3.6+i*.4,-.42,.15);sack(4.59,-.55-i*.21,.1);}
    jar(3.49,-.87,.1);jar(3.72,-.87,.08);mark(1,4.48,-1.46);mark(2,3.61,-1.31);mark(3,3.98,-.42);mark(4,4.61,-.65);return ['陶罐货架','叠放物资箱','酒桶与腌藏桶','食物麻袋'];
  },
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
  cellar(){
    basementSetup(-5.6,-4.3,4.9,3.7,[['east',-2.3],['south',-3.175]]);
    rect(-4.9,-4.07,3.6,.76,'wood');
    for(const x of [-4.45,-3.57,-2.69,-1.81]){rect(x-.235,-4,.47,.62,'wood',.12);for(const z of [-3.94,-3.69,-3.44])line(x-.235,z,x+.235,z);circle(x,-3.69,.035,'brass');}
    barrel(-5.08,-2.65,.2625);barrel(-5.08,-1.88,.2625);rect(-2.05,-1.84,1.1,.72,'wood',.02);jar(-1.7,-1.5,.12);jar(-1.3,-1.45,.085);candle(-1.13,-1.58);rect(-3.9,-1.975,1.4,.65,'linen');
    mark(1,-3.57,-3.69);mark(2,-5.08,-2.65);mark(3,-1.5,-1.48);mark(4,-3.2,-1.1);
    return ['双层酒桶架','直立储酒桶','量酒器与清点台','通往中央石廊'];
  },
  larder(){
    basementSetup(.7,-4.3,4.9,3.7,[['west',-2.3],['south',3.175]]);
    rect(1.1,-4.08,3.7,.72,'wood');for(let i=0;i<7;i++){sack(1.4+i*.48,-3.72,.2);jar(1.4+i*.48,-3.98,.08);}
    for(const z of [-2.7,-2.1,-1.55])sack(5.08,z,.25);
    rect(1.05,-1.9,1.35,.7,'wood',.02);rect(1.34,-1.725,.72,.35,'timber');for(const x of [1.45,1.65,1.85])circle(x,-1.55,.075,'sage');jar(2.15,-1.6,.09);
    for(const x of [1.3,2.1,2.9,3.7,4.5]){line(x,-4.27,x,-4.12);ellipse(x,-4.13,.07,.11,'sage');}
    mark(1,2.85,-3.72);mark(2,5.08,-2.1);mark(3,1.725,-1.55);mark(4,3.175,-1.1);
    return ['垫高货架、粮袋与陶罐','备用粮袋','分装与清点木案','通往中央石廊'];
  },
  armory(){
    basementSetup(-5.6,.6,4.9,3.7,[['east',2.3],['north',-3.175]]);
    for(const z of [1.45,2.15,2.85,3.55]){rect(-5.35,z-.21,.5,.42,'wood');line(-5.3,z,-4.85,z);path(`M-4.85 ${z}l-.12 -.07v.14z`,'coal');ellipse(-5.02,z+.17,.16,.21,z<2.5?'rug':'blue');circle(-5.02,z+.17,.045,'coal');}
    rect(-4.52,3.55,3.2,.5,'wood');for(const x of [-4.15,-3.5,-2.85,-2.2,-1.55]){chest(x,3.8,.5,.38);circle(x,3.81,.115,'coal');line(x,3.7,x,3.92);}
    rect(-2.08,1.1,1.1,.74,'wood',.02);line(-1.88,1.4,-1.21,1.4);rect(-1.79,1.28,.055,.24,'brass');rect(-1.35,1.42,.2,.3,'linen');
    mark(1,-5.02,2.15);mark(2,-2.85,3.8);mark(3,-1.53,1.47);mark(4,-3.175,1.05);
    return ['枪矛架与木盾','装备箱与头盔架','器械整备台','通往中央石廊'];
  },
  undercroft(){
    basementSetup(.7,.6,4.9,3.7,[['west',2.3],['north',3.175]]);
    rect(4.195,2.565,1.13,1.43,'stone');for(let i=0;i<7;i++)line(4.195,2.57+i*.2,5.325,2.57+i*.2);line(4.24,2.65,4.24,4);line(5.28,2.65,5.28,4);path('M4.76 2.68V3.78m-.12 -.2.12 .2.12 -.2','line');
    rect(1.15,3.525,2.2,.55,'wood',.02);rect(1.425,3.63,.25,.34,'blue');candle(2.2,3.8);jar(3,3.8,.12);circle(4.65,1.35,.45,'stone');circle(4.65,1.35,.31,'blue');rug(2.45,1.6,1.8,1.1,'blue');
    mark(1,4.76,3.3);mark(2,2.25,3.8);mark(3,4.65,1.35);mark(4,1.2,2.3);
    return ['通往地上的石阶','登记木案与照明','石砌蓄水盆','连接三间地窖的石廊'];
  },
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
  const caption=room.level==='basement'?'地下层陈设示意 · 开口通往中央石廊，非实测图':room.interior?'室内陈设示意 · 依场景布局绘制，非实测图':'区域布局示意 · 依场景关系绘制，非实测图';
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
