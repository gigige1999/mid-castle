import './life-ui.css';
import { collectibles, achievements, itemById, npcById } from './life-data.js';
import { rooms } from './data.js';
import { roleById, roleSymbol } from './roles.js';

const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const roomName = id => rooms.find(room => room.id === id)?.name || '城堡';
const bagSymbol = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M10 11V8a6 6 0 0 1 12 0v3M7 11h18l2 16H5Z"/><path d="M12 11v3m8-3v3M12 22h8"/></svg>';

const itemMaterials = {
  linen:'手织亚麻', candle:'天然蜂蜡', parchment:'鞣制羊皮', key:'旧黄铜', ribbon:'提花丝织',
  bread:'石炉烘焙', apple:'果园采撷', iron:'炉火锻造', grain:'秋收麦穗', herbs:'清晨采摘',quill:'鹅羽与墨',salve:'蜂蜡草叶',yarn:'茜草染线'
};
let iconSequence = 0;

/** Painted specimen miniatures, also readable at the world's small marker size. */
export function itemIcon(id) {
  const prefix = `life-specimen-${++iconSequence}`;
  const paint = name => `url(#${prefix}-${name})`;
  const palette = {
    linen:['#fcf2dc','#d9c7a4','#aa9373'], candle:['#fff0b4','#e7c976','#b4944c'],
    parchment:['#fff4d0','#e6cc92','#b79762'], key:['#fff0b4','#c6a15b','#866236'],
    ribbon:['#e3aaa0','#bb7776','#834e55'], bread:['#efd097','#c48b48','#926032'],
    apple:['#efb18b','#c76454','#913f3f'], iron:['#c4d0cb','#849694','#526a6b'],
    grain:['#f7df97','#d5ae59','#a37a39'], herbs:['#c5d4a0','#8eaa74','#5b7953'],
    quill:['#f9f0d9','#c9d5cd','#8b9ca1'],salve:['#c5d0a5','#98aa82','#657f60'],yarn:['#eac0aa','#c0887d','#935d64']
  };
  const colors = palette[id] || palette.parchment;
  const defs = `<defs><linearGradient id="${prefix}-body" x1="10%" y1="0%" x2="85%" y2="100%"><stop stop-color="${colors[0]}"/><stop offset=".48" stop-color="${colors[1]}"/><stop offset="1" stop-color="${colors[2]}"/></linearGradient><linearGradient id="${prefix}-gold" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#f7e7a9"/><stop offset=".35" stop-color="#c9a765"/><stop offset=".6" stop-color="#e9ce8a"/><stop offset="1" stop-color="#93713f"/></linearGradient><radialGradient id="${prefix}-shadow"><stop stop-color="#695234" stop-opacity=".2"/><stop offset="1" stop-color="#695234" stop-opacity="0"/></radialGradient><linearGradient id="${prefix}-flame" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff4b8"/><stop offset=".5" stop-color="#f2c779"/><stop offset="1" stop-color="#d8944c"/></linearGradient></defs>`;
  const drawings = {
    quill:`<path fill="#617984" d="M12 37h15l3 14c-1 5-22 5-22 0Z"/><ellipse cx="20" cy="37" rx="8" ry="3" fill="${paint('gold')}"/><ellipse cx="20" cy="37" rx="5" ry="1.8" fill="#344a55"/><path fill="${paint('body')}" d="M25 44c-3-10 0-23 12-31L53 5c2 15-5 29-22 35Z"/><path d="m21 51 28-40M29 35l1-12m4 5 2-12m1 10 10-3m-14 9 11-2m-15 8 10-2m1-15 2-9" stroke="#9aab9f"/><path d="m27 43 21-30" stroke="#fff5d8"/><path fill="#e8d6b3" d="M13 43h13v6H13Z"/><path d="M16 46h7" stroke="#8c9a8a"/>`,
    salve:`<path fill="${paint('body')}" d="M17 24h30l4 23c0 10-38 10-38 0Z"/><ellipse cx="32" cy="25" rx="15" ry="4" fill="#b8be98"/><path fill="#e6d4ae" d="M16 17h32v7c-1 5-31 5-32 0Z"/><ellipse cx="32" cy="17" rx="16" ry="4" fill="#f0e2c4"/><path d="M19 23c6 3 20 3 26 0" stroke="#b39d78"/><path fill="#f5e9cc" d="M22 31h21v15H22Z"/><path fill="#88a274" d="M32 42c-8-4-6-9-6-9 8 0 10 4 6 9Zm0-3c-1-7 6-9 6-9 3 7-1 10-6 9Z"/><path d="m29 42 6-9" stroke="#d0d4a3"/><path d="M19 31v10" stroke="#e4e8c6" stroke-width="2"/>`,
    yarn:`<ellipse cx="30" cy="34" rx="21" ry="19" fill="${paint('body')}"/><g stroke="#ecc7b0" stroke-width="1.1"><path d="M14 24c12 1 24 9 31 19M11 29c11 1 26 11 30 18M10 35c12 0 21 8 25 16M17 19c8 0 27 10 32 17M21 16c10 1 23 8 29 14M21 17c-4 11-3 24 2 35M28 15c-4 13-3 27 3 38M35 16c-3 10-3 20 0 30"/></g><path d="M46 42c16 0 14 18 2 15-9-2-6-8 0-7" stroke="#b87973" stroke-width="2"/><path d="m7 48 42-35" stroke="#aa845b" stroke-width="2.6"/><path d="m8 47 39-32" stroke="#e8cba0" stroke-width=".8"/><circle cx="7" cy="48" r="2.5" fill="${paint('gold')}"/>`,
    linen:`<path fill="${paint('body')}" d="M20 17h28v33H19c-13 0-13-14 0-14h21V17Z"/><path fill="#f3e7cd" d="M19 12h27c7 0 9 11 2 12H19c-10 0-10-12 0-12Z"/><ellipse cx="19" cy="18" rx="6.5" ry="6" fill="#fcf5e5"/><path d="M19 15c-5 0-5 6-1 6 3 0 3-3 1-3" stroke="#bba381"/><path d="M40 25v11H19c-7 0-7 9 0 9h29" stroke="#bda482"/><path d="M24 26v8m4-8v8m4-8v8m4-8v8m-14-5h16m-16 3h16m-15 8v3m4-3v3m4-3v3m4-3v3m4-3v3" stroke="#a9916f" stroke-width=".5" opacity=".6"/><path d="M32 13v11m3-11v11" stroke="#9b7e63" opacity=".65"/><path d="M33 24v25" stroke="#c9ad84" stroke-width="2.8"/><path d="M33 25v22" stroke="#ead7af" stroke-width=".7"/>`,
    candle:`<path fill="${paint('gold')}" d="M13 49h36c0 6-36 8-36 0Z"/><ellipse cx="31" cy="49" rx="18" ry="3.5" fill="#ecd39a"/><path d="M43 46c13 2 13-13 4-10" stroke="#b18d51" stroke-width="3"/><path fill="${paint('body')}" d="M23 24h16v24c0 5-16 5-16 0Z"/><ellipse cx="31" cy="24" rx="8" ry="3.4" fill="#fff0b4"/><path d="M23 25v7c0 3 4 3 4 0v-3c0-2 3-2 3 0v7c0 3 4 3 4 0v-7" fill="#f8e6a1" stroke="#c6aa66" stroke-width=".6"/><path d="M26 39v6m10-14v13" stroke="#fff2c3" opacity=".75"/><path d="M31 25v-5" stroke="#705b3e" stroke-width="1.6"/><path fill="${paint('flame')}" stroke="#d9aa63" d="M32 5c0 6-8 9-6 14 2 5 9 4 10 0 2-5-3-8-4-14Z"/><path d="M31 13c-3 4-4 7 0 8 3-1 3-4 0-8Z" fill="#fff9d6" stroke="none"/>`,
    parchment:`<path fill="${paint('body')}" d="M18 12h31l-4 34c-.6 7-11 8-12 1H13l3-30Z"/><path fill="#f5e2b3" d="M18 10h30c8 0 8 10 2 11h-5c6-1 5-7 0-7H19c-6 0-6 7-1 7h-5c-6-3-3-11 5-11Z"/><path d="M16 40h23c-5 0-6 8 0 10H15c-8 0-7-10 1-10Z" fill="#e3c486"/><path d="M17 43h17m-1 4H18" stroke="#ba985e" stroke-width=".6"/><path d="M21 25h18m-19 4h16m-17 4h14" stroke="#b59664" stroke-width=".8"/><path d="m21 24 2-2m1 7 1-1m2 5 2-2" stroke="#c7ab78" stroke-width=".6"/><path d="m36 42-3 13 5-3 3 4 2-14" fill="#a9564e" stroke="#8f4d42"/><path d="m37 34 4-1 3 3 1 4-3 4-4 1-4-3-1-4Z" fill="#bb6e5b" stroke="#9d594b"/><circle cx="39" cy="39" r="3.7" stroke="#e1a07e"/><path d="m37 40 2-3 2 3" stroke="#e9b08e" stroke-width=".7"/>`,
    key:`<g transform="rotate(-38 32 32)"><path fill="${paint('body')}" fill-rule="evenodd" d="M32 6c-9 0-14 6-14 13 0 6 4 11 10 13v22h14v-7h-6v-4h5v-6h-6v-5c7-1 11-7 11-13C46 12 41 6 32 6Zm0 6c5 0 8 3 8 7s-3 7-8 7-8-3-8-7 3-7 8-7Z"/><path d="M27 31v-3m4 4v19h8m-7-13h6M21 18c0-6 5-10 11-10 4 0 7 2 9 4" stroke="#fff0bd" stroke-width="1.2"/><path d="M28 35h7m-7 3h7" stroke="#94703c"/><path d="m32 8 2 2-2 2-2-2Z" fill="#8d6b3d" stroke="none"/><circle cx="32" cy="9.8" r=".7" fill="#f5e1a1" stroke="none"/></g>`,
    ribbon:`<path fill="${paint('body')}" d="M27 28 14 54l10-4 4 6 8-24 8 21 4-7 9 3-16-24Z"/><path d="m25 36-7 14m21-14 8 11" stroke="#edb8a0" stroke-width=".8"/><path fill="${paint('body')}" d="M28 25C8 5 5 15 9 28c3 8 13 8 20 3m7-6C51 7 59 10 56 25c-2 10-12 12-20 6"/><path fill="#92535b" d="M12 22c4-2 10 2 17 5-8 1-12 1-17-5Zm41-2c-6-1-11 4-17 7 8 0 13-2 17-7Z"/><path d="M11 17c4-3 10 2 15 6m12 1c5-6 10-9 15-9" stroke="#edbbab"/><path fill="#c68b80" d="M27 23c3-2 7-2 10 0l-1 11c-3 2-6 1-9-1Z"/><path d="m29 24-1 7m6-7-1 9" stroke="#e4b1a0"/><path d="m21 43 1 2 2-1m-5 4 1 2 2-1m22-9-2 1 1 2m5 0-2 1 1 2" stroke="#efcfa5" stroke-width=".65"/>`,
    bread:`<path fill="#ad7139" d="M9 39c2-12 43-14 47-1l-1 7c-4 12-43 11-46-1Z"/><path fill="${paint('body')}" d="M8 37c0-14 10-23 25-23 13 0 24 9 24 23-2 11-47 11-49 0Z"/><path d="M11 37c5 7 37 8 43 0" stroke="#e5b578" stroke-width="1"/><path d="M21 20c-4 3-6 7-6 12m17-15c-4 4-7 10-7 16m17-12c-4 3-6 7-7 12m15-7-3 7" stroke="#9a6433" stroke-width="3.5"/><path d="M21 19c-3 3-5 7-5 11m16-14c-4 4-6 10-6 15m16-11c-3 3-5 7-6 11m14-6-2 6" stroke="#f5dfb1" stroke-width="2.6"/><path d="m16 36 3 1m22-2 4-1m-13 6 4 .3m-15-1 3 .3m24-4 2-1" stroke="#fae9c9" stroke-width=".8"/><g fill="#f7e3be" stroke="none" opacity=".85"><circle cx="24" cy="22" r=".7"/><circle cx="19" cy="34" r=".6"/><circle cx="36" cy="19" r=".7"/><circle cx="40" cy="37" r=".6"/><circle cx="46" cy="24" r=".65"/></g>`,
    apple:`<path fill="${paint('body')}" d="M32 21c-12-9-24 0-22 13 1 12 8 21 15 19 5-2 7-2 13 0 8 2 15-9 16-21 1-12-10-20-22-11Z"/><path d="M32 23c-1-7 0-11 3-15" stroke="#75583b" stroke-width="2.5"/><path fill="#94ad75" stroke="#6c8757" d="M34 15c4-10 13-8 17-7-1 8-9 12-17 7Z"/><path d="m35 15 12-5m-8 3 1-3m2 2 4 1" stroke="#d0d9a5" stroke-width=".7"/><path d="M20 25c-5 3-7 10-3 15" stroke="#f7c6a0" stroke-width="2.9" opacity=".7"/><path d="M29 23c2 2 5 2 8 0M25 49c5-2 10-2 14 0" stroke="#a25246" stroke-width=".7"/><path d="m44 31 .1 0m2 5 .1 0m-4 7 .1 0m-22 2 .1 0" stroke="#efb898" stroke-width="1.4"/>`,
    iron:`<path fill="${paint('body')}" d="m8 29 31-14 17 12-5 20-30 9L8 42Z"/><path fill="#bccbc4" d="m8 29 31-14 17 12-33 14Z"/><path fill="#6d8583" d="m23 41 33-14-5 20-30 9Z"/><path fill="#94a6a0" d="m8 29 15 12-2 15L8 42Z"/><path d="m10 29 13 10 30-12m-29 15-2 11" stroke="#dae0ce"/><path d="m19 30 17-7m-8 12 10-4m-9 15 10-4m-12 8 5-2m11-8 5-2m-34-4 4 3" stroke="#57716f" stroke-width=".8" opacity=".7"/><path d="m25 29 5-2m11-1 3-1m-28 9 3 2m24 12 3-1" stroke="#e3e5d0" stroke-width=".7" opacity=".7"/><path d="m33 19 3 2-4 2m14 16 3 1-2 3" stroke="#aa9475" stroke-width=".8"/>`,
    grain:`<path d="m24 56 9-43m-4 43-11-37m13 37 14-36" stroke="#a08146" stroke-width="1.3"/><g fill="${paint('body')}" stroke="#ac8544" stroke-width=".7"><path d="M33 15c-6-3-6-8-4-11 5 3 7 7 4 11Zm-1 8c-7-1-10-6-9-10 6 1 10 4 9 10Zm-2 8c-8 0-10-5-10-9 7 0 11 4 10 9Zm4-14c0-7 4-11 9-11 0 6-3 10-9 11Zm-2 9c1-7 5-10 10-9-1 6-5 9-10 9Zm-2 8c2-6 5-9 10-8-1 6-5 8-10 8ZM18 22c-7-1-9-6-8-10 6 1 9 5 8 10Zm3 9c-7 0-10-4-10-8 6-1 10 3 10 8Zm-1-6c-1-7 2-10 5-11 2 5 1 9-5 11Zm25-1c-5-4-4-9-1-12 5 4 5 9 1 12Zm-3 8c-5-4-5-8-2-11 5 4 5 8 2 11Zm4-6c2-7 6-8 11-6-2 5-6 7-11 6Zm-4 8c2-6 6-8 11-6-2 5-6 7-11 6Z"/></g><path d="m32 10 1-7m9 7 2-6m-29 12-3-7m36 9 2-6m4 11 5-3" stroke="#d0ae67" stroke-width=".65"/><path fill="#bb8270" d="m20 41 17-1-1 7-16 1Z"/><path d="m22 43 13-1m-13 4 12-1" stroke="#e5b49a" stroke-width=".7"/><path d="m28 45 4 8 1-7 7 4-7-7" fill="#b97b67" stroke="#9b6958" stroke-width=".65"/>`,
    herbs:`<path d="m27 56 7-40m-4 38-14-26m14 27 17-25" stroke="#6d8658" stroke-width="1.3"/><g fill="${paint('body')}" stroke="#728b5b" stroke-width=".7"><path d="M34 21c-10 0-15-6-13-13 9 0 15 5 13 13Zm0-2C31 9 37 3 44 5c2 8-3 14-10 14Zm-3 14c-12 0-17-6-15-14 10-1 16 6 15 14Zm2-4c-2-10 5-15 13-13 1 9-6 14-13 13ZM22 38c-10 2-17-3-17-10 10-3 17 1 17 10Zm-4-9c-8-1-12-7-9-13 7 0 13 5 9 13Zm23 8c-2-10 4-16 12-15 2 9-4 14-12 15Zm-5 8c0-9 7-13 14-10-1 8-7 12-14 10Z"/></g><path d="m24 12 10 9m5-13-5 11M19 23l12 10m10-14-8 10M9 31l13 7m-9-18 5 9m31-3-8 11m5 1-10 7" stroke="#d0dca9" stroke-width=".7"/><path d="m28 20 1-4m-4 12 1-4m13 0 4 .5m3 7 4 .5m-30 3-1-4" stroke="#c3d49d" stroke-width=".55"/><path d="m22 46 14 1-1 5-12-1Z" fill="#cdb185" stroke="#a18a65"/><path d="m23 47 12 2m-11 1 10 1m-5-1-7 5m8-5 6 5" stroke="#ead6b1" stroke-width=".9"/>`
  };
  return `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" fill="none" stroke="#947451" stroke-width=".85" stroke-linecap="round" stroke-linejoin="round">${defs}<ellipse cx="32" cy="56" rx="24" ry="5" fill="${paint('shadow')}" stroke="none"/>${drawings[id] || drawings.parchment}</svg>`;
}

export function createLifeUI({ onGift = () => {}, onNavigate = () => {}, onTalk = () => {} } = {}) {
  let state = { inventory:{}, discovered:[], met:[], gifted:[], achievements:[], stamps:0, completedTasks:[] };
  let visible = false;
  let tab = 'items';
  let currentNpc = null;
  let showTip = false;
  let npcAchievementNames = [];
  let pulseTimer;
  const experience = document.querySelector('#experience');
  const button = document.createElement('button');
  button.id = 'open-bag';
  button.className = 'life-bag-button';
  button.hidden = true;
  button.setAttribute('aria-haspopup', 'dialog');
  button.setAttribute('aria-controls', 'life-bag-dialog');
  button.innerHTML = `${bagSymbol}<span>行囊</span><small>0 / ${collectibles.length}</small><kbd>B</kbd>`;
  experience.append(button);

  const bag = document.createElement('dialog');
  bag.id = 'life-bag-dialog';
  bag.className = 'life-dialog life-bag-dialog';
  bag.setAttribute('aria-labelledby', 'life-bag-title');
  bag.innerHTML = `<button class="life-close" aria-label="关闭行囊">×</button><header class="life-dialog-head"><span class="life-overline">LITTLE THINGS, LOVELY DAYS</span><div class="life-title-row"><h2 id="life-bag-title">旅途中的小收获</h2><span class="life-stamps" aria-label="纪念铜章"><span aria-hidden="true">✺</span><b>0</b><small>铜章</small></span></div><p class="life-bag-intro">把城堡里的日常，装进口袋。</p></header><div class="life-tabs" role="tablist" aria-label="行囊内容"><button id="life-items-tab" role="tab" aria-selected="true" aria-controls="life-items-panel" data-life-tab="items">我的行囊 <span>0 / ${collectibles.length}</span></button><button id="life-achievements-tab" role="tab" aria-selected="false" aria-controls="life-achievements-panel" tabindex="-1" data-life-tab="achievements">纪念成就 <span>0 / ${achievements.length}</span></button></div><section id="life-items-panel" role="tabpanel" aria-labelledby="life-items-tab"><div class="life-item-grid"></div><p class="life-footnote">走近城堡里的发光物品，拾取你的发现。赠送后，图鉴依然保留。</p></section><section id="life-achievements-panel" role="tabpanel" aria-labelledby="life-achievements-tab" hidden><div class="life-achievement-grid"></div><p class="life-footnote">拾取物品、认识居民、完成小事，一点一滴都值得纪念。</p></section>`;
  document.body.append(bag);

  const npcDialog = document.createElement('dialog');
  npcDialog.id = 'life-npc-dialog';
  npcDialog.className = 'life-dialog life-npc-dialog';
  npcDialog.setAttribute('aria-labelledby', 'life-npc-title');
  document.body.append(npcDialog);

  function close() {
    if (bag.open) bag.close();
    if (npcDialog.open) npcDialog.close();
  }
  function bindDismiss(dialog) {
    dialog.addEventListener('click', event => {
      if (event.target.closest('.life-close')) dialog.close();
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  }
  bindDismiss(bag);
  bindDismiss(npcDialog);
  npcDialog.addEventListener('close', () => { npcAchievementNames = []; });

  function setTab(next, focus = false) {
    tab = next;
    for (const element of bag.querySelectorAll('[data-life-tab]')) {
      const active = element.dataset.lifeTab === tab;
      element.setAttribute('aria-selected', String(active));
      element.tabIndex = active ? 0 : -1;
      if (active && focus) element.focus();
    }
    bag.querySelector('#life-items-panel').hidden = tab !== 'items';
    bag.querySelector('#life-achievements-panel').hidden = tab !== 'achievements';
  }
  bag.addEventListener('click', event => {
    const tabButton = event.target.closest('[data-life-tab]');
    if (tabButton) setTab(tabButton.dataset.lifeTab);
    const navigateButton = event.target.closest('[data-life-room]');
    if (navigateButton) { close(); onNavigate(navigateButton.dataset.lifeRoom); }
  });
  bag.querySelector('.life-tabs').addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    setTab(event.key === 'Home' ? 'items' : event.key === 'End' ? 'achievements' : tab === 'items' ? 'achievements' : 'items', true);
  });
  npcDialog.addEventListener('click', event => {
    const gift = event.target.closest('[data-life-gift]');
    const talk = event.target.closest('[data-life-talk]');
    const navigate = event.target.closest('[data-life-room]');
    if (gift && !gift.disabled && currentNpc) onGift(currentNpc.id);
    if (talk && currentNpc) { showTip = !showTip; onTalk(currentNpc.id); renderNpc(); }
    if (navigate) { close(); onNavigate(navigate.dataset.lifeRoom); }
  });

  function renderBag() {
    bag.querySelector('.life-stamps b').textContent = state.stamps;
    bag.querySelector('[data-life-tab="items"] span').textContent = `${state.discovered.length} / ${collectibles.length}`;
    bag.querySelector('[data-life-tab="achievements"] span').textContent = `${state.achievements.length} / ${achievements.length}`;
    bag.querySelector('.life-item-grid').innerHTML = collectibles.map((item, index) => {
      const found = state.discovered.includes(item.id);
      const quantity = state.inventory[item.id] || 0;
      return `<article class="life-item ${found ? 'is-found' : 'is-unfound'}" style="--item-color:${item.color}" title="${escapeHTML(item.description)}"><div class="life-specimen-label"><span>Nº ${String(index + 1).padStart(2, '0')}</span><span class="life-specimen-check" aria-label="${found ? '已收藏' : '未发现'}">${found ? '✧' : '·'}</span></div><div class="life-item-art">${itemIcon(item.kind)}${found ? `<span class="life-quantity" aria-label="拥有 ${quantity} 件">×${quantity}</span>` : '<span class="life-undiscovered">待发现</span>'}</div><h3>${escapeHTML(item.name)}</h3><span class="life-item-material">${itemMaterials[item.id] || ''}</span><p>${escapeHTML(roomName(item.roomId))}</p><button data-life-room="${item.roomId}" aria-label="前往${escapeHTML(roomName(item.roomId))}寻找${escapeHTML(item.name)}">${quantity > 0 ? '再去看看' : '前往寻找'} <span aria-hidden="true">↗</span></button></article>`;
    }).join('');
    bag.querySelector('.life-achievement-grid').innerHTML = achievements.map(achievement => {
      const unlocked = state.achievements.includes(achievement.id);
      const progress = Math.min(achievement.target, state[achievement.metric]?.length || 0);
      return `<article class="life-achievement ${unlocked ? 'is-unlocked' : ''}"><div class="life-medallion" aria-hidden="true"><span>${achievement.symbol}</span></div><div class="life-achievement-copy"><span class="life-achievement-status">${unlocked ? '已获得 · 收藏于此' : '等待一段小冒险'}</span><h3>${escapeHTML(achievement.name)}</h3><p>${escapeHTML(achievement.description)}</p><div class="life-achievement-progress"><progress max="${achievement.target}" value="${progress}" aria-label="${escapeHTML(achievement.name)}进度">${progress} / ${achievement.target}</progress><small>${progress} / ${achievement.target}</small></div></div></article>`;
    }).join('');
  }

  function renderNpc() {
    if (!currentNpc) return;
    const active = npcDialog.contains(document.activeElement) ? document.activeElement : null;
    const restoreFocus = active?.matches('[data-life-gift]') ? '[data-life-gift], [data-life-talk]' : active?.matches('[data-life-talk]') ? '[data-life-talk]' : active?.matches('[data-life-room]') ? '[data-life-room]' : active?.matches('.life-close') ? '.life-close' : null;
    const npc = currentNpc;
    const role = roleById(npc.roleId);
    const item = itemById(npc.requestItemId);
    const helped = state.gifted.includes(npc.id);
    const met = state.met.includes(npc.id);
    const available = (state.inventory[item.id] || 0) > 0;
    const dialogue = showTip ? npc.tip : helped ? npc.giftReply : npc.greeting;
    npcDialog.innerHTML = `<button class="life-close" aria-label="结束交谈">×</button><span class="life-overline">A FACE TO REMEMBER</span><div class="life-npc-heading"><div class="life-npc-portrait" data-role="${npc.roleId}">${roleSymbol(role?.icon || 'keys')}<span aria-hidden="true">${helped ? '♥' : '✦'}</span></div><div><span class="life-npc-role">${escapeHTML(role?.name || '居民')} · 庭院里的邻居</span><h2 id="life-npc-title">${escapeHTML(npc.name)}</h2><span class="life-friendship ${helped ? 'is-helped' : ''}">${helped ? '♥ 已收到你的心意' : '♡ 从一句问候开始'}</span></div></div><blockquote class="life-dialogue" aria-live="polite">${escapeHTML(dialogue)}</blockquote>${helped ? `<div class="life-thanks"><span aria-hidden="true">✺</span><p>一份小小的帮助，换来一张熟悉的笑脸。<small>赠礼已完成 · 纪念铜章已放入行囊</small></p></div>` : `<div class="life-request"><div class="life-request-art">${itemIcon(item.kind)}</div><div><span>想要一份</span><h3>${escapeHTML(item.name)} <small>× 1</small></h3><p>你的行囊中有 ${state.inventory[item.id] || 0} 份</p></div><span class="life-request-check" aria-label="${available ? '物品已备好' : '还需要寻找'}">${available ? '✓' : '·'}</span></div>`}<div class="life-npc-actions">${!helped ? `<button class="life-gift-button" data-life-gift="${npc.id}" ${!met || !available ? 'disabled' : ''}>${!met ? '先聊聊近况' : available ? `送出${escapeHTML(item.name)} <span aria-hidden="true">♡</span>` : '还差一份小心意'}</button>` : '<span class="life-gift-complete">心意已送达 ✓</span>'}<button class="life-talk-button" data-life-talk="${npc.id}">${showTip ? '听听近况' : '聊聊城堡'} <span aria-hidden="true">⋯</span></button></div>${!helped && !available ? `<button class="life-find-gift" data-life-room="${item.roomId}">去${escapeHTML(roomName(item.roomId))}寻找${escapeHTML(item.name)} <span aria-hidden="true">↗</span></button>` : ''}`;
    if (npcAchievementNames.length) {
      const celebration = document.createElement('p');
      celebration.className = 'life-npc-achievement';
      celebration.setAttribute('role', 'status');
      celebration.textContent = `✧ 成就解锁：${npcAchievementNames.join('、')}`;
      npcDialog.append(celebration);
    }
    if (restoreFocus) npcDialog.querySelector(restoreFocus)?.focus({ preventScroll:true });
  }

  function placeButton() {
    const adventure = experience.querySelector('.resident-adventure');
    const bottom = adventure && !adventure.hidden ? adventure.offsetTop + adventure.offsetHeight + 9 : 18;
    button.style.top = `${bottom}px`;
  }
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(placeButton);
    const adventure = experience.querySelector('.resident-adventure');
    if (adventure) observer.observe(adventure);
    observer.observe(experience);
  }
  button.addEventListener('click', openBag);

  function openBag() {
    if (!visible) return;
    if (npcDialog.open) npcDialog.close();
    renderBag();
    setTab(tab);
    if (!bag.open) bag.showModal();
  }

  return {
    sync(next) {
      const gained = next.discovered.length > state.discovered.length || next.achievements.length > state.achievements.length || next.stamps > state.stamps;
      if (npcDialog.open) {
        const earned = achievements.filter(achievement => next.achievements.includes(achievement.id) && !state.achievements.includes(achievement.id));
        if (earned.length) npcAchievementNames = [...new Set([...npcAchievementNames, ...earned.map(achievement => achievement.name)])];
      }
      if (currentNpc && !state.gifted.includes(currentNpc.id) && next.gifted.includes(currentNpc.id)) showTip = false;
      state = next;
      button.querySelector('small').textContent = `${state.discovered.length} / ${collectibles.length}`;
      button.setAttribute('aria-label', `打开行囊，已发现 ${state.discovered.length} 种物品，共 ${collectibles.length} 种；${state.stamps} 枚铜章。快捷键 B`);
      if (gained && visible) {
        clearTimeout(pulseTimer);
        button.classList.remove('has-new-find');
        requestAnimationFrame(() => button.classList.add('has-new-find'));
        pulseTimer = setTimeout(() => button.classList.remove('has-new-find'), 1300);
      }
      if (bag.open) renderBag();
      if (npcDialog.open) renderNpc();
      placeButton();
    },
    setVisible(value) { visible = Boolean(value); button.hidden = !visible; if (!visible) close(); else placeButton(); },
    openBag,
    showNpc(id, next) {
      const npc = npcById(id);
      if (!npc || !visible) return;
      if (!npcDialog.open || currentNpc?.id !== id) npcAchievementNames = [];
      if (next) state = next;
      currentNpc = npc;
      showTip = false;
      if (bag.open) bag.close();
      renderNpc();
      if (!npcDialog.open) npcDialog.showModal();
    },
    close
  };
}
