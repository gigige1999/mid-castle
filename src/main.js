import './style.css';
import './adventure.css';
import { createCastle } from './castle.js';
import { rooms, categories } from './data.js';
import { createResidency } from './residency.js';
import { createSpaceNavigation } from './navigation.js';
import { floorPlans } from './floorplans.js';
import { createQuestBook } from './quests.js';
import { createLifeState } from './life-state.js';
import { collectibles, npcs, itemById, npcById } from './life-data.js';
import { createLifeUI, itemIcon } from './life-ui.js';
import { createResidentMarkers } from './resident-markers.js';
import './room-preview.css';
import './game-shell.css';

const $ = s => document.querySelector(s);
const experience = $('#experience');
const panel = $('#detail-panel');
const directory = $('#space-directory');
const tooltip = $('#hover-tooltip');
const images = new Map();
let model = null, exploring = false, showLabels = false, selected = null, category = 'all', uploadRoom = null, toastTimer;
const started = performance.now();
let arrivingRoom=null;
let previewRoom=null,previewHadDetails=false;
let walking=true;
const life=createLifeState();
const questBook=createQuestBook({life});
let pendingGuide=null;
let noticeTimer;
const lifeUI=createLifeUI({onGift:giveGift,onTalk:talkAgain,onNavigate:guideToRoomItem});
const lifeLayer=document.createElement('div');lifeLayer.id='life-markers';lifeLayer.className='life-markers';experience.append(lifeLayer);
const residentMarkers=createResidentMarkers({container:lifeLayer,npcs,onInteract:id=>startLifeInteraction('npc',id),onHighlight:id=>model?.highlightLife(id?'npc':null,id)});
const lifeMarkers=collectibles.map(item=>({...item,type:'item'})).map(entity=>{
 const el=document.createElement('button');el.className='life-marker';el.dataset.type=entity.type;el.hidden=true;
 el.innerHTML=`<span aria-hidden="true">${entity.type==='item'?itemIcon(entity.id):'⋯'}</span><b>${entity.name}</b><small>${entity.type==='item'?'拾取':'交谈'}</small>`;
 el.setAttribute('aria-label',`${entity.type==='item'?'走近拾取':'走近交谈'}${entity.name}`);
 for(const event of ['pointerenter','focus'])el.addEventListener(event,()=>model?.highlightLife(entity.type,entity.id));
 for(const event of ['pointerleave','blur'])el.addEventListener(event,()=>model?.highlightLife(null));
 el.addEventListener('click',()=>startLifeInteraction(entity.type,entity.id));lifeLayer.append(el);return {...entity,el};
});
const previewCard=document.createElement('section');previewCard.id='room-preview';previewCard.className='room-preview';previewCard.hidden=true;previewCard.setAttribute('aria-labelledby','preview-title');
previewCard.innerHTML='<div class="preview-heading"><span>建筑剖面</span><button class="preview-close" aria-label="关闭剖面预览">×</button></div><h2 id="preview-title"></h2><p class="preview-description"></p><div class="preview-actions"><button class="preview-cancel">返回原处</button><button class="preview-enter">确认进入 →</button></div>';
experience.append(previewCard);
previewCard.querySelector('.preview-close').addEventListener('click',cancelRoomPreview);
previewCard.querySelector('.preview-cancel').addEventListener('click',cancelRoomPreview);
previewCard.querySelector('.preview-enter').addEventListener('click',()=>{if(previewRoom&&!model?.isTransitioning())selectRoom(previewRoom.id);});
const residency = createResidency({onAssigned:role=>{
 questBook.start(role.id);walking=true;model?.setCharacterRole(role.id);model?.setWalking(true);arriveAtRoom(role.assignedRoom);
},onReturn:selectRoom});
const spaceNavigation=createSpaceNavigation({rooms,onSelect:selectRoom,onOverview:closePanel,getAssigned:()=>residency.current?.assignedRoom});
$('#all-spaces-button span').textContent=rooms.length;
function updateAdventure(){
 const role=residency.current,visible=exploring&&Boolean(role)&&Boolean(model);
 $('#resident-adventure').hidden=!visible;
 $('#adventure-actions').hidden=!visible;
 $('#walk-pad').hidden=!visible||!walking||Boolean(arrivingRoom)||Boolean(previewRoom);
 lifeUI.setVisible(visible);
 if(!role)return;
 questBook.visit(selected||'courtyard');
 const state=questBook.state;
 $('#adventure-role').textContent=`${role.name}的手记`;
 $('#adventure-progress').textContent=`${state.completed} / ${state.total}`;
 $('#adventure-greeting').textContent=state.finished?'今日小事已完成，余下的时间自由漫游。':(state.currentTask&&!state.currentTask.completed?state.currentTask.description:state.nextTask.description);
 $('#adventure-trail').replaceChildren(...state.tasks.map(task=>{
  const room=rooms.find(r=>r.id===task.roomId),button=document.createElement('button');
  button.className=task.completed?'visited':'';button.innerHTML=`<span aria-hidden="true">${task.completed?'✓':'○'}</span>${task.title}<small>${room.name}</small>`;
  button.setAttribute('aria-label',`${task.title}，${room.name}，${task.completed?'已完成':'待完成'}，点击前往`);
  button.addEventListener('click',()=>goToTask(task.roomId));return button;
 }));
 const action=state.currentTask&&!state.currentTask.completed?state.currentTask:null;
 const task=action||state.nextTask,snapshot=life.state,requirement=task?.requirement;
 const missingItem=requirement&&!(snapshot.inventory[requirement.itemId]>0)?itemById(requirement.itemId):null;
 const missingNpc=requirement?.npcId&&!snapshot.met.includes(requirement.npcId)?npcById(requirement.npcId):null;
 const requirements=[];
 if(requirement){
  const item=itemById(requirement.itemId),button=document.createElement('button'),ready=(snapshot.inventory[item.id]||0)>0;
  button.className=`quest-requirement${ready?' is-ready':''}`;button.innerHTML=`<span>${ready?'✓':'○'}</span><b>${item.name}</b><small>${snapshot.inventory[item.id]||0} / 1</small>`;
  button.addEventListener('click',()=>guideLife('item',item.id));requirements.push(button);
  if(requirement.npcId){const npc=npcById(requirement.npcId),button=document.createElement('button'),ready=snapshot.met.includes(npc.id);button.className=`quest-requirement${ready?' is-ready':''}`;button.innerHTML=`<span>${ready?'✓':'○'}</span><b>${npc.name}</b><small>${ready?'已交谈':'去交谈'}</small>`;button.addEventListener('click',()=>guideLife('npc',npc.id));requirements.push(button);}
 }
 $('#quest-requirements').replaceChildren(...requirements);
 $('#quest-interact').textContent=state.finished?'看看我的收获 · B':missingItem?`寻找${missingItem.name} · E`:missingNpc?`拜访${missingNpc.name} · E`:action?`${action.action} · E`:`下一站 · ${rooms.find(r=>r.id===state.nextTask.roomId).name} ↗`;
 $('#quest-interact').classList.toggle('is-complete',state.finished);
 $('#quest-interact').disabled=Boolean(arrivingRoom);
 $('#toggle-walking').textContent=walking?'暂停漫游':'继续漫游';
 $('#toggle-walking').setAttribute('aria-pressed',String(walking));
 $('#walking-status').textContent=arrivingRoom?'正在领取房间钥匙…':walking?'点击一处空地，迈出第一步。':'漫游已暂停，仍可旋转和探索模型。';
 for(const button of document.querySelectorAll('#adventure-trail button,#adventure-actions button:not(#quest-interact)'))button.disabled=Boolean(arrivingRoom);
}
function gameNotice(message){
 $('#game-notice').textContent=message;$('#game-notice').classList.add('visible');
 clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('#game-notice').classList.remove('visible'),3600);
}
function syncLife(){const state=life.state;model?.setLifeState(state);lifeUI.sync(state);updateAdventure();}
function rewardNotice(result,message=result.message){
 const medals=result.newAchievements?.map(achievement=>achievement.name)||[];
 gameNotice(`${message}${medals.length?` ✧ 成就解锁：${medals.join('、')}`:''}`);
 if(medals.length){clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('#game-notice').classList.remove('visible'),6000);}
}
function startLifeInteraction(type,id){
 if(!model||!exploring||arrivingRoom||previewRoom||document.querySelector('dialog[open]'))return false;
 residentMarkers.close();
 if(!walking){walking=true;model.setWalking(true);updateAdventure();}
 pendingGuide=null;hideDetails();spaceNavigation.close();
 const started=model.interactLife(type,id);
 if(!started)gameNotice('等镜头停稳后，点发光物品或居民旁的标记再试试。');
 return started;
}
function guideLife(type,id){
 const entity=type==='item'?itemById(id):npcById(id);if(!entity||!exploring||arrivingRoom)return;
 lifeUI.close();
 if(!walking){walking=true;model?.setWalking(true);}
 const roomId=type==='item'?entity.roomId:null;
 if(roomId){if(selected!==roomId)goToTask(roomId);else hideDetails();}else{closePanel();spaceNavigation.close();}
 const remaining=type==='item'?(life.state.cooldowns[id]||0)-Date.now():0;
 if(remaining>0){gameNotice(`${entity.name}正在补充，约 ${Math.ceil(remaining/1000)} 秒后再拾取。`);return;}
 if(model?.isTransitioning()){pendingGuide={type,id};gameNotice(`去找${entity.name}，走近就能${type==='item'?'拾取':'交谈'}。`);}else startLifeInteraction(type,id);
}
function guideToRoomItem(roomId){const item=collectibles.find(item=>item.roomId===roomId);if(item)guideLife('item',item.id);else goToTask(roomId);}
function animateCollectedItem(id){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const marker=model?.getLifeMarkers().find(entry=>entry.type==='item'&&entry.id===id),bag=$('#open-bag');
 if(!marker||!bag||bag.hidden)return;
 const point=model.project(marker.position),bounds=experience.getBoundingClientRect(),target=bag.getBoundingClientRect();
 if(!point.visible)return;
 const x=bounds.left+point.x-25,y=bounds.top+point.y-25;
 const dx=target.left+target.width/2-25-x,dy=target.top+target.height/2-25-y;
 const token=document.createElement('span');token.className='life-pickup-flight';token.setAttribute('aria-hidden','true');
 token.innerHTML=itemIcon(id);token.style.left=`${x}px`;token.style.top=`${y}px`;document.body.append(token);
 if(!token.animate){token.remove();return;}
 const motion=token.animate([
  {transform:'translate(0,0) scale(.65)',opacity:0,offset:0},
  {transform:'translate(0,-18px) scale(1.1)',opacity:1,offset:.2},
  {transform:`translate(${dx*.35}px,${Math.min(-65,dy*.7)}px) scale(.92)`,opacity:1,offset:.5},
  {transform:`translate(${dx}px,${dy}px) scale(.3)`,opacity:0,offset:1}
 ],{duration:780,easing:'cubic-bezier(.25,.6,.25,1)',fill:'forwards'});
 motion.finished.then(()=>token.remove(),()=>token.remove());
}
function handleLifeInteract(entity){
 if(!exploring||arrivingRoom||document.querySelector('dialog[open]'))return;
 const result=entity.type==='item'?life.collect(entity.id):life.talk(entity.id);
 if(result.ok){if(entity.type==='item')animateCollectedItem(entity.id);model?.reactLife(entity.type,entity.id);}
 if(entity.type==='npc'&&result.ok)lifeUI.showNpc(entity.id);
 syncLife();
 if(entity.type==='npc'&&result.ok){if(result.newAchievements.length)rewardNotice(result,'又认识了一位城堡居民。');}
 else rewardNotice(result);
}
function giveGift(id){const result=life.gift(id);if(result.ok)model?.reactLife('npc',id);syncLife();rewardNotice(result,result.ok?`${npcById(id).name}收到了你的心意 · 友谊 +1 · 纪念铜章 +1`:result.message);}
function talkAgain(id){const result=life.talk(id);model?.reactLife('npc',id);syncLife();if(result.newAchievements.length)rewardNotice(result,'多一位朋友，多一段故事。');}
function settledInRoom(id){finishArrival(id);if(pendingGuide){const target=pendingGuide;pendingGuide=null;startLifeInteraction(target.type,target.id);}}
function hideDetails(){panel.classList.remove('open');updateViewState();}
function goToTask(id){selectRoom(id);hideDetails();spaceNavigation.close();}
function interact(){
 if(!exploring||arrivingRoom||previewRoom||!model||document.querySelector('dialog[open]'))return;
 const state=questBook.state;
 if(state.finished){lifeUI.openBag();return;}
 const task=state.currentTask&&!state.currentTask.completed?state.currentTask:state.nextTask;
 const requirement=task.requirement,snapshot=life.state;
 if(!(snapshot.inventory[requirement.itemId]>0)){guideLife('item',requirement.itemId);return;}
 if(requirement.npcId&&!snapshot.met.includes(requirement.npcId)){guideLife('npc',requirement.npcId);return;}
 if(!state.currentTask||state.currentTask.completed){goToTask(task.roomId);return;}
 const result=questBook.complete(selected||'courtyard');
 if(!result.ok){rewardNotice(result);return;}
 model.greetCharacter();syncLife();rewardNotice(result,result.finished?'三件小事全部完成！纪念铜章 +1，去庭院认识新朋友吧。':`${task.title}完成 · 纪念铜章 +1`);
 $('#quest-interact').classList.remove('quest-celebration');requestAnimationFrame(()=>$('#quest-interact').classList.add('quest-celebration'));
}
$('#quest-interact').addEventListener('click',interact);
$('#adventure-toggle').addEventListener('click',()=>{const expanded=$('#adventure-body').hidden;$('#adventure-body').hidden=!expanded;$('#adventure-toggle').setAttribute('aria-expanded',String(expanded));});
document.addEventListener('keydown',event=>{if(event.repeat||event.ctrlKey||event.altKey||event.metaKey||event.target.matches('input,textarea,select,[contenteditable="true"]')||document.querySelector('dialog[open]'))return;if(event.code==='KeyE'){event.preventDefault();interact();}else if(event.code==='KeyB'&&exploring){event.preventDefault();lifeUI.openBag();}});
function updateWalkingStatus(state){
 if(exploring&&walking&&!arrivingRoom)$('#walking-status').textContent=state.message||'走累了，就在这里歇一歇。';
}
$('#toggle-walking').addEventListener('click',()=>{walking=!walking;model?.setWalking(walking);updateAdventure();});
$('#walk-courtyard').addEventListener('click',()=>{closePanel();walking=true;model?.setWalking(true);model?.findCharacter();updateAdventure();});
$('#find-character').addEventListener('click',()=>model?.findCharacter());
document.querySelectorAll('[data-walk]').forEach(button=>{
 const release=()=>{button.classList.remove('is-held');model?.moveCharacter(button.dataset.walk,false);};
 button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);button.classList.add('is-held');model?.moveCharacter(button.dataset.walk,true);});
 for(const type of ['pointerup','pointercancel','lostpointercapture','blur'])button.addEventListener(type,release);
 button.addEventListener('keydown',event=>{if(event.key===' '||event.key==='Enter'){event.preventDefault();button.classList.add('is-held');model?.moveCharacter(button.dataset.walk,true);}});
 button.addEventListener('keyup',event=>{if(event.key===' '||event.key==='Enter')release();});
});
function showPlan(room,photo=false){
 const plan=floorPlans[room.id];
 $('#plan-title').textContent=`${room.name} · ${photo?'区域图片':'空间平面'}`;
 $('#plan-image').src=photo?images.get(room.id):plan.src;
 $('#plan-image').alt=photo?`${room.name}区域图片`:plan.alt;
 $('#plan-caption').textContent=photo?'你的区域图片':plan.caption;
 $('#plan-dialog').showModal();
}
$('#close-plan').addEventListener('click',()=>$('#plan-dialog').close());
$('#plan-dialog').addEventListener('click',event=>{if(event.target!==$('#plan-dialog'))return;const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.target.close();});
const labelElements = rooms.map(room => {
 const el = document.createElement('button');el.className = 'room-label' + (room.core ? ' core-label' : '');el.innerHTML = `<span class="label-dot"></span>${room.name}${room.core ? '<small>展开 ↗</small>' : ''}`;el.setAttribute('aria-label',`${room.interior ? '放大展开' : '了解'}${room.name}`);el.style.display='none';el.addEventListener('click',()=>previewRoomFromScene(room.id));$('#labels').appendChild(el);return {room,el};
});
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3200);}
function updateViewState(){
 const room=rooms.find(r=>r.id===selected);
 document.body.classList.toggle('is-playing',exploring);
 experience.classList.toggle('is-exploring',exploring);
 experience.classList.toggle('has-detail',Boolean(room)&&panel.classList.contains('open'));
 experience.classList.toggle('is-room-focused',Boolean(room?.interior));
 experience.classList.toggle('is-previewing',Boolean(previewRoom));
 $('#room-navigation').hidden=!exploring;
 $('#back-button').hidden=!room&&!previewRoom;
 $('#back-button').textContent=previewRoom?'← 取消预览':'← 城堡总览';
 $('#back-button').setAttribute('aria-label',previewRoom?'取消剖面预览':'收起房间，返回城堡总览');
 $('#room-info').hidden=!room||Boolean(previewRoom);
 $('#room-info').setAttribute('aria-expanded',String(panel.classList.contains('open')));
 $('#nav-cover').classList.toggle('active',!exploring);
 $('#nav-explore').classList.toggle('active',exploring);
 $('#enter-label').textContent=residency.current?'继续我的城堡生活':'开始我的城堡生活';
 $('#enter-button').setAttribute('aria-pressed',String(exploring));
 $('#view-mode-text').textContent=previewRoom?`${previewRoom.name} · 剖面预览`:room?.interior?`${room.name} · 展开查看`:exploring?'3D 城堡探索':'3D 全景模型';
 $('#interaction-hint').textContent=previewRoom?'拖动查看剖面 · 确认后进入房间':['upper','basement'].includes(room?.level)?'房间相通可漫游 · 右键 / 双指平移 · 整层总览查看地图':exploring?'点物品拾取 · 点居民查看 · B 行囊':'';
 $('#toggle-labels').setAttribute('aria-pressed',String(showLabels));
 $('#current-space').textContent=previewRoom?`${previewRoom.name} / 剖面预览`:room?`${categories[room.category]} / ${room.name}`:'城堡总览';
 spaceNavigation.sync({exploring,selected});
 updateAdventure();
 labelElements.forEach(({el,room:r})=>{el.classList.toggle('selected',r.id===selected);el.setAttribute('aria-pressed',String(r.id===selected));});
}
function enterCastle(){
 if(!residency.requireRole())return false;
 if(exploring)return true;
 exploring=true;showLabels=false;category='all';directory.hidden=Boolean(model);
 model?.enter();updateViewState();renderDirectory();return true;
}
function leaveCastle(){
 clearPreviewUI();residentMarkers.close();
 pendingGuide=null;lifeUI.close();
 arrivingRoom=null;experience.classList.remove('is-arriving');
 exploring=false;showLabels=false;selected=null;category='all';
 $('#adventure-body').hidden=true;$('#adventure-toggle').setAttribute('aria-expanded','false');$('#game-notice').classList.remove('visible');
 panel.classList.remove('open');directory.hidden=true;tooltip.style.display='none';
 model?.leave();updateViewState();
 labelElements.forEach(({el})=>{el.style.display='none';el.classList.remove('dimmed');});
}
function clearPreviewUI(){
 previewRoom=null;previewHadDetails=false;previewCard.hidden=true;experience.classList.remove('is-previewing');
}
function previewRoomFromScene(id){
 const room=rooms.find(r=>r.id===id);if(!room||arrivingRoom)return;
 if(!room.interior||!model){selectRoom(id);return;}
 if(!enterCastle())return;
 const hadDetails=previewRoom?previewHadDetails:panel.classList.contains('open');
 if(!model.preview(id))return;
 pendingGuide=null;residentMarkers.close();spaceNavigation.close();tooltip.style.display='none';
 previewHadDetails=hadDetails;previewRoom=room;panel.classList.remove('open');
 $('#adventure-body').hidden=true;$('#adventure-toggle').setAttribute('aria-expanded','false');
 previewCard.querySelector('h2').textContent=room.name;
 previewCard.querySelector('.preview-description').textContent=room.level==='basement'?'先看看地下层的布局。确认后沿石阶下行。':room.level==='upper'?'屋顶已展开，可以先看主堡内部。确认后进入房间漫游。':'屋顶已展开，可以先看室内陈设。确认后进入房间漫游。';
 previewCard.querySelector('.preview-enter').disabled=true;previewCard.hidden=false;updateViewState();
}
function cancelRoomPreview(){
 if(!previewRoom)return false;
 const restore=previewHadDetails;clearPreviewUI();model?.cancelPreview();
 panel.classList.toggle('open',restore&&Boolean(selected));tooltip.style.display='none';updateViewState();return true;
}
function selectRoom(id){
 const room=rooms.find(r=>r.id===id);if(!room)return;
 clearPreviewUI();residentMarkers.close();pendingGuide=null;
 if(!enterCastle())return;arrivingRoom=null;experience.classList.remove('is-arriving');selected=id;model?.select(id);tooltip.style.display='none';
 renderPanel(room);panel.classList.toggle('open',!['gallery','undercroft'].includes(id));updateViewState();renderDirectory();
}
function arriveAtRoom(id){
 const room=rooms.find(r=>r.id===id);if(!room)return;
 clearPreviewUI();residentMarkers.close();
 pendingGuide=null;
 exploring=true;showLabels=false;category='all';directory.hidden=Boolean(model);selected=id;arrivingRoom=id;
 tooltip.style.display='none';panel.classList.remove('open');experience.classList.add('is-arriving');
 renderPanel(room);updateViewState();renderDirectory();
 if(model)model.arrive(id);else finishArrival(id);
}
function finishArrival(id){
 if(!arrivingRoom||arrivingRoom!==id||selected!==id)return;
 arrivingRoom=null;experience.classList.remove('is-arriving');
 if(!model)panel.classList.add('open');
 model?.greetCharacter();updateViewState();gameNotice('钥匙收好。点点发光的物品，把第一份发现装进行囊。');
}
function closePanel(){
 cancelRoomPreview();residentMarkers.close();pendingGuide=null;
 if(!selected)return;
 arrivingRoom=null;experience.classList.remove('is-arriving');
 selected=null;panel.classList.remove('open');model?.overview();
 updateViewState();renderDirectory();
}
function renderPanel(room){
 const image=images.get(room.id);const plan=floorPlans[room.id];const index=rooms.findIndex(r=>r.id===room.id);
 const resident=residency.current;
 const assignment=resident?.assignedRoom===room.id?`<div class="room-assignment-tag">你的分配房间 · ${resident.name}</div>`:resident?.roomIds.includes(room.id)?`<div class="room-assignment-tag">${resident.name}的日常活动空间</div>`:'';
 panel.innerHTML=`<button class="detail-return">← 收起房间，返回城堡总览</button><div class="detail-top"><span>SPACE ${room.number} / THE CASTLE</span><button class="close-detail" aria-label="关闭介绍">×</button></div><h2>${room.name}</h2>${assignment}<p class="detail-english">${room.english}</p><span class="detail-category">${categories[room.category]}</span>${room.interior?`<p class="room-focus-note">${['upper','basement'].includes(room.level)?'本层八处空间通过长廊相连。收起介绍后可点击空地漫游，左右滑动楼层导航选择房间。':['keep','hall'].includes(room.id)?'已展开宽敞的室内剖面，家具之间留出可行走的过道。':'房间已展开，可拖动或缩放查看内部陈设。'}</p>`:''}<div class="visual-tabs" role="group" aria-label="空间图片类型"><button class="show-floorplan" aria-pressed="true">空间平面</button><button class="show-photo" aria-pressed="false" ${image?'':'disabled'}>区域图片</button></div><button class="detail-visual is-plan" title="放大${room.name}平面图" aria-label="放大${room.name}平面图"><img alt="${plan.alt}" src="${plan.src}"/></button><div class="image-tools"><button class="enlarge-plan">查看大图 ↗</button><button class="upload-image">${image?'更换图片':'上传图片'}</button>${image?'<button class="remove-image">移除图片</button>':''}</div><p class="plan-footnote">家具与功能布局示意 · 非实测图</p><p class="detail-description">${room.description}</p><div class="detail-facts"><div><span>空间职能</span><strong>${room.role}</strong></div><div><span>空间中的人</span><strong>${room.people}</strong></div></div><p class="detail-tip">${room.note}</p><div class="detail-pager"><button class="prev-room" aria-label="上一个空间">← 上一个空间</button><span>${String(index+1).padStart(2,'0')} / ${String(rooms.length).padStart(2,'0')}</span><button class="next-room" aria-label="下一个空间">下一个空间 →</button></div>`;
 panel.scrollTop=0;panel.querySelector('.detail-return').addEventListener('click',closePanel);panel.querySelector('.close-detail').addEventListener('click',hideDetails);let photoVisible=false;
 panel.querySelector('.detail-visual').addEventListener('click',()=>showPlan(room,photoVisible));
 panel.querySelector('.enlarge-plan').addEventListener('click',()=>showPlan(room,photoVisible));
 panel.querySelector('.upload-image').addEventListener('click',()=>{uploadRoom=room.id;$('#image-upload').click();});
 function switchVisual(photo){
  if(photo&&!image)return;photoVisible=photo;
  const visual=panel.querySelector('.detail-visual');visual.classList.toggle('is-plan',!photo);
  visual.querySelector('img').src=photo?image:plan.src;visual.querySelector('img').alt=photo?`${room.name}区域图片`:plan.alt;
  visual.title=visual.ariaLabel=`放大${room.name}${photo?'图片':'平面图'}`;
  panel.querySelector('.show-floorplan').setAttribute('aria-pressed',String(!photo));panel.querySelector('.show-photo').setAttribute('aria-pressed',String(photo));
 }
 panel.querySelector('.show-floorplan').addEventListener('click',()=>switchVisual(false));panel.querySelector('.show-photo').addEventListener('click',()=>switchVisual(true));panel.querySelector('.prev-room').addEventListener('click',()=>selectRoom(rooms[(index+rooms.length-1)%rooms.length].id));panel.querySelector('.next-room').addEventListener('click',()=>selectRoom(rooms[(index+1)%rooms.length].id));panel.querySelector('.remove-image')?.addEventListener('click',async()=>{try{await deleteImage(room.id);const url=images.get(room.id);if(url)URL.revokeObjectURL(url);images.delete(room.id);if(selected===room.id)renderPanel(room);toast('已移除图片，可以随时重新上传');}catch{toast('无法移除图片，请重试');}});
}
function renderDirectory(){const items=$('#directory-items');items.innerHTML='';rooms.filter(r=>category==='all'||r.category===category).forEach(room=>{const b=document.createElement('button');b.className='directory-item'+(selected===room.id?' selected':'');b.innerHTML=`<span>${room.number}</span><div>${room.name}<small>${room.english}</small></div>`;b.setAttribute('aria-pressed',String(selected===room.id));b.addEventListener('click',()=>{selectRoom(room.id);experience.scrollIntoView({behavior:'smooth',block:'start'});});items.appendChild(b);});document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active',b.dataset.filter===category));labelElements.forEach(({room,el})=>el.classList.toggle('dimmed',category!=='all'&&room.category!==category));}
function setCategory(value,selectFirst=false){if(!enterCastle())return;category=value;renderDirectory();if(selectFirst){selectRoom(rooms.find(r=>r.category===value).id);experience.scrollIntoView({behavior:'smooth',block:'start'});}}
function updateLabels(project,markers=[]){
 updateLifeMarkers(project,markers);
 const mobile=innerWidth<=760;
 const currentRoom=rooms.find(r=>r.id===selected);
 if(previewRoom){labelElements.forEach(({el})=>el.style.display='none');return;}
 const focused=currentRoom?.interior;
 const connectedFloor=['upper','basement'].includes(currentRoom?.level)?currentRoom.level:null;
 const floorOverview=['gallery','undercroft'].includes(selected);
 const bounds=experience.getBoundingClientRect();
 const sceneBounds=$('#scene-container').getBoundingClientRect();
 const minLeft=mobile?12:experience.clientWidth*.12;
 const maxRight=experience.clientWidth*(selected&&!mobile?.72:.94);
 const minTop=mobile?130:120;
 const maxBottom=panel.classList.contains('open')&&mobile?experience.clientHeight*.53:experience.clientHeight-160;
 const positions=[];
 labelElements.forEach(({room,el})=>{
  const entrance=room.id==='undercroft'&&!focused;
  const innerOnly=['library','solar','guestroom','gallery'].includes(room.id);
  if(!exploring||(focused&&!connectedFloor)||(connectedFloor&&room.level!==connectedFloor)||(!connectedFloor&&room.level==='basement'&&!entrance)||(!connectedFloor&&innerOnly)||(!connectedFloor&&!entrance&&!showLabels&&!room.core&&residency.current?.assignedRoom!==room.id&&selected!==room.id)||(connectedFloor&&!floorOverview&&!showLabels&&room.id!==selected)){el.style.display='none';return;}
  const name=entrance?'地下入口 ↓':room.name;
  if(el.dataset.label!==name){el.dataset.label=name;el.innerHTML=`<span class="label-dot"></span>${name}${room.core?'<small>展开 ↗</small>':''}`;el.setAttribute('aria-label',entrance?'沿石阶进入地下层':`展开${room.name}`);}
  const position=entrance?[0,.6,0]:connectedFloor?room.position:room.interior&&selected!==room.id?room.roofPosition:room.position;
  const p=project(position);
  if(!p.visible||p.x<Math.max(sceneBounds.left-bounds.left,0)||p.x>maxRight+40||p.y<minTop-35||p.y>maxBottom+35){el.style.display='none';return;}
  const width=room.core?105:room.name.length*(mobile?8:9)+34;
  const x=Math.max(minLeft+width/2,Math.min(maxRight-width/2,p.x));
  let y=Math.max(minTop,Math.min(maxBottom,p.y));
  for(let iteration=0;iteration<8;iteration++){
   const conflict=positions.find(other=>Math.abs(other.x-x)<(other.w+width)/2+4&&Math.abs(other.y-y)<30);
   if(!conflict)break;y=conflict.y+31;
  }
  if(y>maxBottom){el.style.display='none';return;}
  el.style.display='flex';el.style.left=`${Math.round(x)}px`;el.style.top=`${Math.round(y)}px`;positions.push({x,y,w:width});
 });
}
function updateLifeMarkers(project,markers){
 const available=new Map(markers.map(marker=>[`${marker.type}/${marker.id}`,marker]));
 const blocked=!exploring||arrivingRoom||previewRoom||document.querySelector('dialog[open]')||model?.isTransitioning();
 const placed=[],mobile=innerWidth<=760,width=experience.clientWidth,height=experience.clientHeight;
 const maxX=width-((panel.classList.contains('open')&&!mobile)?370:15);
 residentMarkers.sync(project,markers,{visible:exploring&&!rooms.find(r=>r.id===selected)?.interior,maxX,width,height,blocked:Boolean(blocked)||(mobile&&panel.classList.contains('open'))});
 for(const entity of lifeMarkers){
  const marker=available.get(`${entity.type}/${entity.id}`),el=entity.el;
  if(blocked||!marker||(mobile&&panel.classList.contains('open'))){el.hidden=true;continue;}
  const p=project(marker.position);
  if(!p.visible||p.x<55||p.x>maxX-55||p.y<100||p.y>height-140){el.hidden=true;continue;}
  let y=p.y;
  // Keep the six small courtyard prompts legible as the castle turns.
  for(let i=0;i<5;i++){const collision=placed.find(other=>Math.abs(other.x-p.x)<115&&Math.abs(other.y-y)<38);if(!collision)break;y=collision.y-39;}
  if(y<110){el.hidden=true;continue;}
  el.hidden=false;el.style.left=`${Math.round(p.x)}px`;el.style.top=`${Math.round(y)}px`;placed.push({x:p.x,y});
 }
}

$('#enter-button').addEventListener('click',()=>exploring?leaveCastle():enterCastle());
$('#nav-explore').addEventListener('click',()=>{residentMarkers.close();if(enterCastle())spaceNavigation.open();});
$('#all-spaces-button').addEventListener('click',()=>residentMarkers.close());
$('#back-button').addEventListener('click',()=>{if(!cancelRoomPreview())closePanel();});
$('#room-info').addEventListener('click',()=>{panel.classList.toggle('open');updateViewState();});
$('#home-button').addEventListener('click',leaveCastle);
$('#nav-cover').addEventListener('click',leaveCastle);
$('#zoom-in').addEventListener('click',()=>model?.zoomIn());
$('#zoom-out').addEventListener('click',()=>model?.zoomOut());
$('#reset-view').addEventListener('click',()=>model?.reset());
$('#toggle-labels').setAttribute('aria-label','显示全部空间标记');
$('#toggle-labels').title='显示或隐藏全部空间标记';
$('#toggle-labels').addEventListener('click',()=>{if(!enterCastle())return;showLabels=!showLabels;updateViewState();});
$('#nav-about').addEventListener('click',()=>$('#about-dialog').showModal());$('#about-dialog .dialog-close').addEventListener('click',()=>$('#about-dialog').close());$('#about-dialog').addEventListener('click',e=>{if(e.target===$('#about-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!e.defaultPrevented&&!document.querySelector('dialog[open]')){if(cancelRoomPreview()){e.preventDefault();return;}residentMarkers.close();spaceNavigation.close();if(panel.classList.contains('open'))hideDetails();else closePanel();}});document.querySelectorAll('[data-category]').forEach(b=>b.addEventListener('click',()=>setCategory(b.dataset.category,true)));document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>setCategory(b.dataset.filter)));

let dbPromise;
function db(){if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{const request=indexedDB.open('castellum-images',1);request.onupgradeneeded=()=>request.result.createObjectStore('images');request.onsuccess=()=>resolve(request.result);request.onerror=()=>{dbPromise=null;reject(request.error);};});return dbPromise;}
async function saveImage(id,file){const database=await db();return new Promise((resolve,reject)=>{const t=database.transaction('images','readwrite');t.objectStore('images').put(file,id);t.oncomplete=resolve;t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error);});}
async function deleteImage(id){const database=await db();return new Promise((resolve,reject)=>{const t=database.transaction('images','readwrite');t.objectStore('images').delete(id);t.oncomplete=resolve;t.onerror=()=>reject(t.error);});}
async function loadImages(){try{const database=await db();const request=database.transaction('images','readonly').objectStore('images').openCursor();request.onsuccess=()=>{const cursor=request.result;if(cursor){images.set(cursor.key,URL.createObjectURL(cursor.value));cursor.continue();}else if(selected)renderPanel(rooms.find(r=>r.id===selected));};}catch{/* Reading remains available if browser storage is disabled. */}}
$('#image-upload').addEventListener('change',async e=>{const file=e.target.files?.[0],id=uploadRoom;e.target.value='';if(!file||!id)return;if(!['image/png','image/jpeg','image/webp','image/avif'].includes(file.type)){toast('请选择 JPG、PNG、WebP 或 AVIF 图片');return;}if(file.size>10*1024*1024){toast('图片较大，请选择 10 MB 以内的图片');return;}try{const bitmap=await createImageBitmap(file);bitmap.close();await saveImage(id,file);const old=images.get(id);if(old)URL.revokeObjectURL(old);images.set(id,URL.createObjectURL(file));if(selected===id)renderPanel(rooms.find(r=>r.id===id));toast('图片已保存，刷新后也会保留');}catch{toast('图片无法读取或浏览器存储不可用，请换一张图片重试');}});
loadImages();
function handleGraphicsError(){ document.body.classList.add('graphics-unavailable');if(arrivingRoom)finishArrival(arrivingRoom);$('#graphics-fallback').hidden=false;directory.hidden=false;renderDirectory();toast('3D 显示暂不可用，空间目录仍可正常阅读'); }
function showHover(text,event){
 if(!text||!event){tooltip.style.display='none';return;}
 const bounds=experience.getBoundingClientRect();tooltip.textContent=text;
 tooltip.style.left=`${Math.min(event.clientX-bounds.left+14,experience.clientWidth-125)}px`;
 tooltip.style.top=`${event.clientY-bounds.top-35}px`;tooltip.style.display='block';
}
try{
 model=createCastle($('#scene-container'),{
  onEnter:enterCastle,onSelect:previewRoomFromScene,onTransitionEnd:settledInRoom,onWalkState:updateWalkingStatus,
  onHover:(id,event)=>showHover(rooms.find(room=>room.id===id)?.name,event),
  onLifeHover:(entity,event)=>showHover(entity?.type==='item'?`拾取 · ${entity.label}`:null,event),
  onLifeSelect:entity=>residentMarkers.select(entity.id),onGroundClick:()=>residentMarkers.close(),
  onPreviewSettled:id=>{if(previewRoom?.id===id)previewCard.querySelector('.preview-enter').disabled=false;},
  onLifeInteract:handleLifeInteract,onLifeBlocked:gameNotice,
  onLifeApproach:()=>{if(!walking){walking=true;updateAdventure();}},
  onFrame:updateLabels,onError:handleGraphicsError,
  onRestored:()=>{document.body.classList.remove('graphics-unavailable');$('#graphics-fallback').hidden=true;directory.hidden=true;}
 });
}catch(error){console.error('Castle renderer:',error);handleGraphicsError();}
syncLife();
updateViewState();
setTimeout(()=>{$('#loading').classList.add('loaded');},Math.max(100,1600-(performance.now()-started)));
