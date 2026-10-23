import { castleRoles, roleById, roleSymbol } from './roles.js';
import { rooms } from './data.js';
import { createRoleGallery } from './role-gallery.js';

const STORAGE_KEY='castellum-resident-v1';
const greetings={lord:'壁炉已暖，来商议今天的城堡事务。',guard:'装备齐了，城墙上正好起风。',chaplain:'晨钟将响，一起推开礼拜堂的门。',cook:'面包将出炉，来厨房搭把手吧。',steward:'钥匙在手，去看看今日的储备。',smith:'炉火正旺，今天也有好手艺。',scribe:'窗边光线正好，翻开今天的第一页。',healer:'篮子里有薄荷，也有给邻人的问候。',weaver:'织机已经穿线，一起添上新的颜色。'};
export function createResidency({onAssigned,onReturn}){
 const dialog=document.querySelector('#role-dialog');
 const options=document.querySelector('#role-options');
 const assignment=document.querySelector('#role-assignment');
 const confirm=document.querySelector('#confirm-role');
 let resident=null,chosen=null,entering=false;
 try{chosen=roleById(localStorage.getItem(STORAGE_KEY));}catch{/* Selection also works without persistent storage. */}
 dialog.classList.add('role-register');
 document.querySelector('#role-title').textContent='今天，想在城堡里成为谁？';
 dialog.querySelector('.role-intro p').textContent=`${castleRoles.length} 位小小居民，各有一段城堡日常。选一个身份，领上钥匙，亲自走进石墙里的生活。`;
 options.innerHTML='<legend class="sr-only">选择你在城堡中的角色</legend>'+castleRoles.map(role=>`<label class="role-option"><input type="radio" name="castle-role" value="${role.id}" ${chosen?.id===role.id?'checked':''}/><span class="role-character-stage" data-character="${role.id}" aria-hidden="true"><span class="role-symbol">${roleSymbol(role.icon)}</span></span><span class="role-option-copy"><strong>${role.name}</strong><small>${role.english}</small><span>${role.motto}</span></span><span class="role-check" aria-hidden="true">✓</span></label>`).join('');
 const gallery=createRoleGallery(options,castleRoles);
 function renderAssignment(){
  confirm.disabled=!chosen;
  confirm.innerHTML=chosen?`以${chosen.name}的身份出发 <span>LET’S BEGIN →</span>`:'选好身份，领取钥匙 <span>YOUR STORY AWAITS</span>';
  if(!chosen){assignment.innerHTML='<span class="assignment-eyebrow">YOUR PLACE IN THE CASTLE</span><div class="assignment-empty">'+roleSymbol('keys')+'</div><h3>一把钥匙，<br/>一段新生活。</h3><p>选择你的身份，城堡会为你安排所属房间与日常活动空间。</p><p class="assignment-note">角色影响出发房间，你仍可自由探索整座城堡。</p>';return;}
  const room=rooms.find(r=>r.id===chosen.assignedRoom);
  assignment.innerHTML=`<span class="assignment-eyebrow">为${chosen.name}准备的钥匙</span><h3>${chosen.name}的一天，<br/>从这里开始。</h3><div class="assignment-greeting">${greetings[chosen.id]}</div><div class="assigned-room"><span>分配房间 · ${room.number}</span><strong>${room.name}</strong><small>${room.english}</small></div><p>${chosen.assignment}</p><ul class="assignment-spaces">${chosen.roomIds.map(id=>`<li>${rooms.find(r=>r.id===id).name}</li>`).join('')}</ul><p class="assignment-note">${chosen.duty}</p>`;
 }
 function show(){
  if(dialog.open||entering)return;
  if(resident)chosen=resident;
  options.querySelectorAll('input').forEach(input=>input.checked=input.value===chosen?.id);
  renderAssignment();dialog.showModal();gallery.start(chosen?.id);
 }
 options.addEventListener('change',event=>{if(event.target.name!=='castle-role'||entering)return;chosen=roleById(event.target.value);gallery.select(chosen?.id);renderAssignment();});
 confirm.addEventListener('click',async()=>{
  if(!chosen||entering)return;
  entering=true;options.disabled=true;confirm.disabled=true;
  const closeButton=document.querySelector('.role-dialog-close');closeButton.disabled=true;
  dialog.setAttribute('aria-busy','true');
  resident=chosen;
  try{localStorage.setItem(STORAGE_KEY,resident.id);}catch{}
  const room=rooms.find(r=>r.id===resident.assignedRoom);
  document.querySelector('#role-name').textContent=resident.name;
  document.querySelector('#role-badge').setAttribute('aria-label',`当前身份：${resident.name}，点击更换角色`);
  document.querySelector('#my-room').hidden=false;
  const note=document.querySelector('#resident-note');note.hidden=false;
  note.innerHTML=`<span>你的城堡身份</span><strong>${resident.name} · ${room.name}</strong><small>${resident.duty}</small>`;
  const buttonContents=confirm.innerHTML;
  confirm.textContent=`带上钥匙，前往${room.name}…`;
  dialog.classList.add('is-departing');
  try{
   onAssigned(resident);
   const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
   if(!reduced)await new Promise(resolve=>setTimeout(resolve,320));
   dialog.close();
  }finally{
   dialog.classList.remove('is-departing');dialog.removeAttribute('aria-busy');
   options.disabled=false;closeButton.disabled=false;entering=false;
   confirm.innerHTML=buttonContents;confirm.disabled=!chosen;
  }
 });
 dialog.addEventListener('close',()=>gallery.stop());
 dialog.addEventListener('cancel',event=>{if(entering)event.preventDefault();});
 document.querySelector('.role-dialog-close').addEventListener('click',()=>{if(!entering)dialog.close();});
 document.querySelector('#role-badge').addEventListener('click',show);
 document.querySelector('#my-room').addEventListener('click',()=>resident?onReturn(resident.assignedRoom):show());
 renderAssignment();
 return{show,requireRole(){if(resident)return true;show();return false;},get current(){return resident;}};
}
