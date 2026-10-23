import { npcPlacements } from './life-placements.js';
import { expansionLayouts, undergroundWalkLayout } from './interior-expansion.js';
// Walkable floor regions follow the furniture positions in castle.js. Coordinates
// are world x/z; the small clearance keeps bodies away from furniture and walls.
const rect=(x1,z1,x2,z2)=>({rect:[x1,z1,x2,z2]});
const disc=(x,z,r)=>({circle:[x,z,r]});
const room=(name,bounds,spawn,obstacles,y=.455,radius=.1)=>({name,bounds,spawn,obstacles,y,radius,step:.04});

export const walkLayouts={
  courtyard:{name:'内院',bounds:[-5.93,-4.14,5.96,4.84],polygon:[[-5.93,-4.14],[5.96,-4.14],[5.96,4.2],[.8,5.0],[-5.93,4.35]],spawn:[-2.6,-1.2],y:.235,radius:.14,step:.085,obstacles:[
    rect(.1,-4.7,5.3,.15),...[[.35,-4.425],[5.05,-4.425],[.35,-.075],[5.05,-.075]].map(([x,z])=>disc(x,z,.63)),
    rect(1.82,-.08,2.98,2.95),rect(1.9,2.23,5.78,4.42),rect(3.99,.52,5.83,2.2),
    rect(-5.71,-3.6,-3.69,.1),rect(-5.67,.52,-3.63,2.96),rect(-4.7,3,-2.56,4.62),rect(-3.84,-4.5,-1.8,-3.06),
    rect(-3.4,-3.08,-1.78,-2.64),rect(-1.2,.49,1.23,2.68),disc(-1.63,-.85,.57),disc(-1.03,-.53,.13),
    rect(-1.705,-4.28,.105,-2.72),rect(-3.405,.595,-1.695,2.705),rect(-1.855,3.165,.155,4.575),
    rect(-3.09,.02,-2.37,.4),rect(-2.48,.07,-1.77,.45),rect(1.42,4.02,2.12,4.4),rect(5.42,1.92,5.96,2.32),
    disc(-5.48,-3.78,.27),disc(-5.6,3.3,.26),disc(5.55,-.11,.26),
    ...Object.values(npcPlacements).map(({position:[x,,z]})=>disc(x,z,.085)),
  ]},
  keep:room('卧室',[.6,-4.2,3.04,-2.38],[1.8,-2.52],[
    rect(.84,-3.88,1.66,-2.62),rect(1.92,-3.81,2.58,-2.69),rect(.52,-2.88,.88,-2.52),
    rect(2.54,-4.22,3,-3.78),rect(2.57,-2.82,2.97,-2.48),rect(.96,-4.24,1.56,-3.91),rect(.55,-4.01,.91,-3.65),
  ],3.405,.095),
  chapel:room('礼拜堂',[3.33,-4.25,4.88,-1.85],[3.46,-2.6],[
    rect(3.76,-4.08,4.48,-3.64),...[-3.3,-2.83,-2.36].map(z=>rect(3.65,z-.12,4.59,z+.1)),
    rect(3.39,-4.07,3.73,-3.69),disc(4.72,-2.02,.17),rect(3.38,-2.16,3.72,-1.92),disc(3.55,-3.37,.075),disc(4.7,-3.37,.075),
  ],3.447,.095),
  council:room('议事厅',[.55,-2.18,3.05,-.13],[1.8,-.38],[
    rect(.91,-1.42,2.53,-.84),rect(.91,-1.69,2.53,-1.51),rect(.91,-.75,2.53,-.57),
    rect(.54,-1.29,.86,-.97),rect(2.63,-1.29,2.95,-.97),rect(.44,-2.08,1.2,-1.8),rect(2.55,-.6,2.91,-.24),
  ],3.45),
  storage:room('储藏室',[3.3,-1.67,4.91,-.09],[4.03,-.84],[
    ...[3.6,4,4.4].map(x=>disc(x,-.42,.17)),rect(3.4,-1.53,3.84,-1.09),rect(4,-1.49,4.4,-1.09),
    rect(4.06,-1.62,4.88,-1.34),rect(4.48,-1.41,4.82,-1.07),rect(3.42,-1,3.82,-.7),
    ...[-.55,-.76,-.97].map(z=>disc(4.59,z,.13)),disc(3.51,-1.64,.1),disc(3.73,-1.7,.1),
  ],3.445,.095),
  hall:room('大厅',[2.13,2.46,5.55,4.18],[3.2,2.6],[
    rect(2.64,3.07,4.92,3.57),rect(2.64,2.83,4.92,3),rect(2.64,3.64,4.92,3.81),
    rect(2.06,2.5,2.7,2.92),rect(4.6,2.4,5.44,2.68),rect(4.75,3.06,5.2,3.52),rect(2.22,3.18,2.54,3.5),
    rect(3.81,2.42,4.49,2.72),disc(5.21,3.82,.15),
  ]),
  kitchen:room('厨房',[4.23,.76,5.59,1.96],[5.08,1.83],[
    rect(4.87,.74,5.47,1.16),rect(4.29,1.38,4.91,1.75),rect(4.29,1.18,4.91,1.36),rect(4.29,1.78,4.91,1.96),
    rect(4.24,.7,4.78,.98),rect(5.13,1.25,5.53,1.53),disc(5.4,1.71,.125),disc(4.25,1.15,.11),
  ],.455,.085),
  barracks:room('守卫居所',[-5.47,-3.36,-3.93,-.14],[-4.455,-.3],[
    ...[-2.9,-1.85,-.8].map(z=>rect(-5.21,z-.56,-4.55,z+.56)),
    ...[-2.96,-1.91,-.86].map(z=>rect(-4.36,z-.14,-4.08,z+.14)),
    ...[-2.28,-1.23,-.18].map(z=>rect(-5.09,z-.1,-4.63,z+.1)),
    rect(-4.05,-2.97,-3.91,-.57),rect(-4.32,-3.34,-4.04,-3.04),
  ],.455,.085),
  stable:room('马厩',[-5.43,.76,-3.87,2.72],[-4.7,2.48],[
    ...[.75,1.45,2.15].map(z=>rect(-5.43,z-.04,-4.11,z+.04)),
    ...[1.1,1.85].map(z=>rect(-4.7,z-.39,-4.37,z+.29)),
    ...[1.04,1.74,2.44].map(z=>rect(-5.34,z-.28,-5.08,z+.28)),
    rect(-4.16,1.28,-3.82,1.6),disc(-3.97,1.05,.095),disc(-3.97,1.8,.095),disc(-4.08,2.56,.1),disc(-4.3,2.53,.1),rect(-5.4,2.41,-5.04,2.73),
  ],.455,.09),
  forge:room('铁匠铺',[-4.46,3.24,-2.8,4.38],[-3.7,4.26],[
    rect(-4.45,3.25,-3.87,3.69),rect(-3.85,3.8,-3.15,4.08),rect(-4.28,3.74,-3.9,4),
    rect(-3.63,3.17,-3.01,3.45),rect(-3.24,3.24,-2.74,3.54),rect(-3.28,3.66,-2.92,3.74),disc(-2.9,4.13,.13),
  ],.455,.09),
  granary:room('粮仓',[-3.6,-4.27,-2.04,-3.31],[-2.9,-3.9],[
    rect(-3.51,-4.36,-2.13,-4.1),rect(-3.59,-4.11,-3.27,-3.79),
    ...[-3.37,-2.92,-2.47].map(x=>disc(x,-3.55,.135)),...[-3.44,-3.68,-3.92].map(z=>disc(-2.24,z,.14)),disc(-2.04,-3.96,.1),
  ],.455,.085),
  scriptorium:room('缮写室',[-1.545,-4.12,-.055,-2.88],[-.75,-3.17],[
    rect(-1.32,-4.05,-.24,-3.77),rect(-1.51,-3.67,-1.25,-3.04),rect(-.32,-3.40,-.08,-3.08),
  ],.455,.085),
  infirmary:room('草药医舍',[-3.245,.755,-1.855,2.545],[-2.48,2.35],[
    rect(-3.23,1.035,-2.73,2.065),rect(-2.69,.76,-1.95,.98),rect(-2.10,1.635,-1.86,2.265),
  ],.455,.085),
  weavery:room('织造坊',[-1.695,3.325,-.005,4.415],[-.58,3.87],[
    rect(-1.585,3.53,-.935,4.15),rect(-.6,3.345,-.10,3.535),rect(-.35,4.07,-.05,4.37),
  ],.455,.085),
};

for(const [id,layout] of Object.entries(expansionLayouts))walkLayouts[id]={...layout.walk,speed:.95};
walkLayouts.underground={...undergroundWalkLayout,speed:1.15};

function insidePolygon(x,z,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const [ax,az]=points[i],[bx,bz]=points[j];if((az>z)!==(bz>z)&&x<(bx-ax)*(z-az)/(bz-az)+ax)inside=!inside;}return inside;}

export function isWalkable(layout,x,z){
  const [x1,z1,x2,z2]=layout.bounds,r=layout.radius;
  if(x<x1+r||x>x2-r||z<z1+r||z>z2-r)return false;
  if(layout.polygon&&![[x-r,z],[x+r,z],[x,z-r],[x,z+r]].every(([px,pz])=>insidePolygon(px,pz,layout.polygon)))return false;
  for(const obstacle of layout.obstacles){
    if(obstacle.rect){const [a,b,c,d]=obstacle.rect,dx=x-Math.max(a,Math.min(c,x)),dz=z-Math.max(b,Math.min(d,z));if(dx*dx+dz*dz<r*r)return false;}
    else {const [cx,cz,cr]=obstacle.circle;if((x-cx)**2+(z-cz)**2<(r+cr)**2)return false;}
  }
  return true;
}

export function canWalkSegment(layout,a,b){
  const count=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.025));
  for(let i=0;i<=count;i++)if(!isWalkable(layout,a[0]+(b[0]-a[0])*i/count,a[1]+(b[1]-a[1])*i/count))return false;
  return true;
}

const grids=new WeakMap();
function gridFor(layout){
  if(grids.has(layout))return grids.get(layout);
  const [bx,bz,x2,z2]=layout.bounds,step=layout.step,x1=layout.spawn[0]-Math.ceil((layout.spawn[0]-bx)/step)*step,z1=layout.spawn[1]-Math.ceil((layout.spawn[1]-bz)/step)*step,w=Math.floor((x2-x1)/step)+1,h=Math.floor((z2-z1)/step)+1;
  const points=Array.from({length:w*h},(_,id)=>[x1+id%w*step,z1+Math.floor(id/w)*step]);
  const open=points.map(([x,z])=>isWalkable(layout,x,z));
  const grid={w,h,points,open,step,x1,z1};grids.set(layout,grid);return grid;
}
function nearestNode(layout,grid,point){
  const {w,h,step,x1,z1}=grid,x=Math.round((point[0]-x1)/step),z=Math.round((point[1]-z1)/step);
  let nearest=-1,distance=Infinity;
  for(let dz=-3;dz<=3;dz++)for(let dx=-3;dx<=3;dx++){
    const xx=x+dx,zz=z+dz;if(xx<0||xx>=w||zz<0||zz>=h)continue;
    const id=zz*w+xx,p=grid.points[id],d=(p[0]-point[0])**2+(p[1]-point[1])**2;
    if(grid.open[id]&&d<distance&&canWalkSegment(layout,point,p)){nearest=id;distance=d;}
  }
  return nearest;
}

// A* routes are simplified only where the whole segment clears the furniture.
export function findWalkPath(layout,start,end){
  if(!isWalkable(layout,...start)||!isWalkable(layout,...end))return [];
  if(canWalkSegment(layout,start,end))return [end];
  const grid=gridFor(layout),first=nearestNode(layout,grid,start),last=nearestNode(layout,grid,end);
  if(first<0||last<0)return [];
  const scores=new Float64Array(grid.points.length).fill(Infinity),parents=new Int32Array(grid.points.length).fill(-1),closed=new Uint8Array(grid.points.length),heap=[];
  const estimate=id=>Math.hypot(grid.points[id][0]-end[0],grid.points[id][1]-end[1]);
  const push=(id,f)=>{let i=heap.length;heap.push({id,f});while(i>0){const p=(i-1)>>1;if(heap[p].f<=f)break;heap[i]=heap[p];i=p;}heap[i]={id,f};};
  const pop=()=>{const top=heap[0],tail=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1].f<heap[c].f)c++;if(heap[c].f>=tail.f)break;heap[i]=heap[c];i=c;}heap[i]=tail;}return top.id;};
  scores[first]=0;push(first,estimate(first));
  while(heap.length){
    const current=pop();if(closed[current])continue;if(current===last){
      const route=[end];for(let id=last;id!==first;id=parents[id])route.push(grid.points[id]);route.push(start);route.reverse();
      const simplified=[];for(let i=0;i<route.length-1;){let next=route.length-1;while(next>i+1&&!canWalkSegment(layout,route[i],route[next]))next--;simplified.push(route[next]);i=next;}return simplified;
    }
    closed[current]=1;const cx=current%grid.w,cz=Math.floor(current/grid.w);
    for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
      if(!dx&&!dz)continue;const x=cx+dx,z=cz+dz;if(x<0||x>=grid.w||z<0||z>=grid.h)continue;
      const next=z*grid.w+x;if(!grid.open[next]||closed[next]||!canWalkSegment(layout,grid.points[current],grid.points[next]))continue;
      const cost=scores[current]+grid.step*Math.hypot(dx,dz);if(cost>=scores[next])continue;scores[next]=cost;parents[next]=current;push(next,cost+estimate(next));
    }
  }
  return [];
}
