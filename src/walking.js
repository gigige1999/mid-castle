import * as THREE from 'three';
import { createCharacter } from './characters.js';
import { walkLayouts, isWalkable, canWalkSegment, findWalkPath } from './walk-layouts.js';

const keyDirections={KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};
const up=new THREE.Vector3(0,1,0);

export function createCastleWalker({scene,camera,domElement,collisionRoot=scene,onStatus}={}){
  const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
  const root=new THREE.Group();root.name='resident-walker';root.visible=false;scene.add(root);
  const resident=new THREE.Group();root.add(resident);
  const markerMaterial=new THREE.MeshBasicMaterial({color:0x9e7447,transparent:true,opacity:.65,depthWrite:false,side:THREE.DoubleSide});
  const marker=new THREE.Mesh(new THREE.RingGeometry(.075,.105,40),markerMaterial);marker.rotation.x=-Math.PI/2;marker.visible=false;root.add(marker);
  const halo=new THREE.Mesh(new THREE.RingGeometry(.13,.147,36),new THREE.MeshBasicMaterial({color:0xa77d4c,transparent:true,opacity:.42,depthWrite:false,side:THREE.DoubleSide}));halo.rotation.x=-Math.PI/2;halo.position.y=.014;halo.visible=false;resident.add(halo);
  const pathMaterial=new THREE.LineDashedMaterial({color:0x9e7447,transparent:true,opacity:.48,dashSize:.075,gapSize:.065,depthWrite:false});
  const routeLine=new THREE.Line(new THREE.BufferGeometry(),pathMaterial);routeLine.visible=false;root.add(routeLine);
  const raycaster=new THREE.Raycaster(),plane=new THREE.Plane(up,0),intersection=new THREE.Vector3(),forward=new THREE.Vector3(),right=new THREE.Vector3(),direction=new THREE.Vector3();
  const keys=new Set(),touchDirections=new Set();
  let character=null,roleId=null,space=undefined,layout=walkLayouts.courtyard,enabled=false,visible=false,path=[],moving=false,waveRemaining=0,elapsed=0,markerLife=0,lastStatus='',arrivalAction=null;

  function publish(message){
    const status={moving,space:space??null,roleId,enabled,visible,message:message||(moving?`正在${layout.name}中漫步`:enabled?'点击空地 · WASD / 方向键移动':'漫游已暂停')};
    const signature=JSON.stringify(status);if(signature===lastStatus)return;lastStatus=signature;onStatus?.(status);
  }
  function clearMotion(){keys.clear();touchDirections.clear();path=[];arrivalAction=null;moving=false;routeLine.visible=false;marker.visible=false;markerLife=0;}
  function setRole(id){
    if(roleId===id&&character){greet();return;}
    character?.dispose();character=null;roleId=id||null;clearMotion();
    if(roleId){character=createCharacter(roleId);character.group.scale.setScalar(.42);resident.add(character.group);if(space===undefined)setSpace(null);greet();}
    halo.visible=Boolean(character);publish();
  }
  function setSpace(id,entrySpawn,force=false){
    const next=id&&id!=='courtyard'&&walkLayouts[id]?id:null;
    if(space===next&&!force)return;
    space=next;layout=walkLayouts[next||'courtyard'];clearMotion();const spawn=entrySpawn&&isWalkable(layout,...entrySpawn)?entrySpawn:layout.spawn;resident.position.set(spawn[0],layout.y,spawn[1]);resident.rotation.y=.35;
    publish(`${layout.name} · 点击空地行走`);
  }
  function setEnabled(value){
    const next=Boolean(value);if(next===enabled)return;enabled=next;if(!enabled)clearMotion();publish();
  }
  function setVisible(value){visible=Boolean(value);root.visible=visible;if(!visible)clearMotion();publish();}
  function greet(){waveRemaining=2;publish(`你好，欢迎来到${layout.name}`);}
  function hasBlockingUI(){const element=document.activeElement;return Boolean(document.querySelector('dialog[open]')||element?.matches?.('input,textarea,select,[contenteditable="true"]'));}
  function setDirection(name,pressed){if(!['up','down','left','right'].includes(name))return;if(!pressed){touchDirections.delete(name);return;}if(enabled&&visible&&character&&!hasBlockingUI()){touchDirections.add(name);path=[];arrivalAction=null;routeLine.visible=false;marker.visible=false;}}
  function keyDown(event){
    const name=keyDirections[event.code];if(!name||event.altKey||event.metaKey||event.ctrlKey||!enabled||!visible||!character||hasBlockingUI())return;
    event.preventDefault();keys.add(event.code);path=[];arrivalAction=null;routeLine.visible=false;marker.visible=false;
  }
  function keyUp(event){keys.delete(event.code);}
  function blur(){clearMotion();publish();}
  window.addEventListener('keydown',keyDown);window.addEventListener('keyup',keyUp);window.addEventListener('blur',blur);
  function drawRoute(){
    routeLine.geometry.dispose();routeLine.geometry=new THREE.BufferGeometry().setFromPoints([[resident.position.x,resident.position.z],...path].map(([x,z])=>new THREE.Vector3(x,layout.y+.018,z)));
    routeLine.computeLineDistances();routeLine.visible=path.length>0;
  }
  function approach(position,onArrival){
    if(!enabled||!visible||!character||hasBlockingUI())return false;
    const target=Array.isArray(position)?[position[0],position[2]]:[position.x,position.z];
    const start=[resident.position.x,resident.position.z];
    clearMotion();
    if(Math.hypot(target[0]-start[0],target[1]-start[1])<=.85){greet();onArrival?.();return true;}
    const candidates=[];
    for(const radius of [.45,.65,.82])for(let i=0;i<20;i++){
      const angle=i*Math.PI/10,point=[target[0]+Math.cos(angle)*radius,target[1]+Math.sin(angle)*radius];
      if(isWalkable(layout,...point))candidates.push(point);
    }
    candidates.sort((a,b)=>Math.hypot(a[0]-start[0],a[1]-start[1])-Math.hypot(b[0]-start[0],b[1]-start[1]));
    for(const end of candidates){
      const next=findWalkPath(layout,start,end);if(!next.length)continue;
      path=next;arrivalAction=onArrival;marker.position.set(end[0],layout.y+.025,end[1]);marker.visible=true;markerLife=1;drawRoute();publish('走近看看，到了就能互动');return true;
    }
    publish('这里暂时无法靠近，试试从另一侧过去');return false;
  }
  function handleClick(ndc){
    if(!enabled||!visible||!character||hasBlockingUI())return false;
    camera.updateMatrixWorld();raycaster.setFromCamera(ndc,camera);plane.constant=-layout.y;
    if(!raycaster.ray.intersectPlane(plane,intersection)||!isWalkable(layout,intersection.x,intersection.z))return false;
    const floorDistance=raycaster.ray.origin.distanceTo(intersection);
    // The floor underneath a wall/table must not steal that object's room click.
    collisionRoot.updateMatrixWorld(true);
    const hit=raycaster.intersectObject(collisionRoot,true).find(hit=>{
      let item=hit.object;while(item){if(item===root||!item.visible||(item.userData.isRoof&&item.parent?.userData.openValue>.08))return false;item=item.parent;}
      const material=hit.object.material;return !material||Array.isArray(material)||!material.transparent||material.opacity>.2;
    });
    if(hit&&hit.distance<floorDistance-.055)return false;
    const end=[intersection.x,intersection.z],next=findWalkPath(layout,[resident.position.x,resident.position.z],end);
    if(!next.length){clearMotion();publish('这条路被陈设挡住了，试试附近的空地');return true;}
    keys.clear();touchDirections.clear();arrivalAction=null;path=next;marker.position.set(end[0],layout.y+.025,end[1]);marker.visible=true;markerLife=1;drawRoute();publish('出发，去那里看看');return true;
  }
  function turnToward(x,z,dt){const target=Math.atan2(x,z),difference=THREE.MathUtils.euclideanModulo(target-resident.rotation.y+Math.PI,Math.PI*2)-Math.PI;resident.rotation.y+=difference*(1-Math.exp(-dt*13));}
  function tryStep(dx,dz){
    const start=[resident.position.x,resident.position.z],end=[start[0]+dx,start[1]+dz];
    if(canWalkSegment(layout,start,end)){resident.position.x=end[0];resident.position.z=end[1];return true;}
    if(Math.abs(dx)>.0001&&canWalkSegment(layout,start,[end[0],start[1]])){resident.position.x=end[0];return true;}
    if(Math.abs(dz)>.0001&&canWalkSegment(layout,start,[start[0],end[1]])){resident.position.z=end[1];return true;}
    return false;
  }
  function update(dt,time){
    dt=Math.min(Math.max(dt||0,0),.05);elapsed=Number.isFinite(time)?time:elapsed+dt;
    const wasMoving=moving;moving=false;
    if(enabled&&visible&&character){
      if(hasBlockingUI()){if(keys.size||touchDirections.size||path.length)clearMotion();}
      else {
        const held=new Set([...keys].map(key=>keyDirections[key]).concat([...touchDirections]));
        let x=Number(held.has('right'))-Number(held.has('left')),z=Number(held.has('up'))-Number(held.has('down'));
        const speed=layout.speed??(space? .63:1.3);
        if(x||z){
          camera.getWorldDirection(forward);forward.y=0;if(forward.lengthSq()<.001)forward.set(0,0,-1);forward.normalize();right.crossVectors(forward,up).normalize();direction.copy(forward).multiplyScalar(z).addScaledVector(right,x).normalize();
          moving=tryStep(direction.x*speed*dt,direction.z*speed*dt);if(moving)turnToward(direction.x,direction.z,dt);
        }else if(path.length){
          const target=path[0],dx=target[0]-resident.position.x,dz=target[1]-resident.position.z,distance=Math.hypot(dx,dz),step=Math.min(distance,speed*dt);
          if(distance<.012){resident.position.x=target[0];resident.position.z=target[1];path.shift();if(!path.length){routeLine.visible=false;const action=arrivalAction;arrivalAction=null;if(action){greet();action();}}}
          else {moving=tryStep(dx/distance*step,dz/distance*step);if(moving)turnToward(dx,dz,dt);else {path=[];arrivalAction=null;routeLine.visible=false;publish('前方有陈设，请换个方向');}}
        }
      }
    }
    if(marker.visible){if(!path.length)markerLife=Math.max(0,markerLife-dt*1.5);markerMaterial.opacity=.6*markerLife;marker.scale.setScalar(reduceMotion?1:1+Math.sin(elapsed*4)*.1);if(markerLife<=0)marker.visible=false;}
    character?.update(dt,reduceMotion?0:elapsed,{walking:moving&&!reduceMotion,waving:waveRemaining>0&&!reduceMotion});waveRemaining=Math.max(0,waveRemaining-dt);
    if(moving!==wasMoving)publish();
  }
  function dispose(){window.removeEventListener('keydown',keyDown);window.removeEventListener('keyup',keyUp);window.removeEventListener('blur',blur);character?.dispose();marker.geometry.dispose();markerMaterial.dispose();halo.geometry.dispose();halo.material.dispose();routeLine.geometry.dispose();pathMaterial.dispose();root.removeFromParent();}
  return {setRole,setSpace,setEnabled,setVisible,handleClick,update,setDirection,approach,getPosition:()=>resident.position.clone(),greet,dispose};
}
