import { collectibles, npcs, achievements, taskRequirements, COLLECTIBLE_RESPAWN_MS, LIFE_STORAGE_KEY } from './life-data.js';

const itemMap = new Map(collectibles.map(item => [item.id, item]));
const npcMap = new Map(npcs.map(npc => [npc.id, npc]));
const taskIds = new Set(Object.keys(taskRequirements));
const MAX_ITEMS = 999;
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const knownIds = (values, known) => Array.isArray(values) ? [...new Set(values.filter(id => typeof id === 'string' && known.has(id)))] : [];

/** Pure gameplay state; storage is optional and unavailable storage never stops play. */
export function createLifeState(options = {}) {
  let storage;
  try { storage = Object.hasOwn(options, 'storage') ? options.storage : globalThis.localStorage; } catch { storage = null; }
  const clock = typeof options.now === 'function' ? options.now : () => Date.now();
  const time = () => {
    const value = clock();
    return Number.isFinite(value) ? Math.max(0, value) : Date.now();
  };
  let raw = {};
  try {
    const saved = storage?.getItem(LIFE_STORAGE_KEY);
    if (typeof saved === 'string' && saved.length < 100_000) raw = record(JSON.parse(saved));
  } catch { /* A damaged save is a fresh start, not a broken application. */ }

  const inventory = {};
  const savedInventory = record(raw.inventory);
  const cooldowns = {};
  const savedCooldowns = record(raw.cooldowns);
  const loadedAt = time();
  for (const item of collectibles) {
    const quantity = savedInventory[item.id];
    if (Number.isFinite(quantity) && quantity >= 1) inventory[item.id] = Math.min(MAX_ITEMS, Math.floor(quantity));
    const availableAt = savedCooldowns[item.id];
    if (Number.isFinite(availableAt) && availableAt > loadedAt) cooldowns[item.id] = Math.min(availableAt, loadedAt + COLLECTIBLE_RESPAWN_MS);
  }
  const discovered = [...new Set([...knownIds(raw.discovered, itemMap), ...Object.keys(inventory).filter(id => inventory[id] > 0)])];
  const gifted = knownIds(raw.gifted, npcMap);
  const met = [...new Set([...knownIds(raw.met, npcMap), ...gifted])];
  const completedTasks = knownIds(raw.completedTasks, taskIds);
  // Achievements and stamp counts are derived from durable, validated progress.
  const progress = { inventory, cooldowns, discovered, met, gifted, completedTasks, achievements:[], stamps:gifted.length + completedTasks.length };
  progress.achievements = achievements.filter(entry => progress[entry.metric].length >= entry.target).map(entry => entry.id);

  const snapshot = () => ({
    version:1,
    inventory:{ ...inventory },
    cooldowns:{ ...cooldowns },
    discovered:[...discovered],
    met:[...met],
    gifted:[...gifted],
    completedTasks:[...completedTasks],
    achievements:[...progress.achievements],
    stamps:progress.stamps
  });
  const save = () => {
    try { storage?.setItem(LIFE_STORAGE_KEY, JSON.stringify(snapshot())); } catch { /* Continue in memory if persistence is blocked or full. */ }
  };
  const unlock = () => {
    const newlyEarned = achievements.filter(entry => !progress.achievements.includes(entry.id) && progress[entry.metric].length >= entry.target);
    progress.achievements.push(...newlyEarned.map(entry => entry.id));
    return newlyEarned.map(entry => ({ ...entry }));
  };
  const success = (message, extra = {}) => {
    const newAchievements = unlock();
    save();
    return { ok:true, message, ...extra, newAchievements };
  };
  const fail = (message, extra = {}) => ({ ok:false, message, ...extra, newAchievements:[] });
  const consume = id => {
    inventory[id] -= 1;
    if (inventory[id] === 0) delete inventory[id];
  };

  return {
    collect(itemId) {
      const item = itemMap.get(itemId);
      if (!item) return fail('这里没有可以拾取的物品。', { remainingMs:0 });
      const now = time();
      const remainingMs = Math.max(0, (cooldowns[itemId] || 0) - now);
      if (remainingMs > 0) return fail(`刚刚拾取过${item.name}，${Math.ceil(remainingMs / 1000)} 秒后会补充。`, { item:{ ...item }, count:inventory[itemId] || 0, remainingMs });
      if ((inventory[itemId] || 0) >= MAX_ITEMS) return fail(`${item.name}已经备得很充足了，先使用一些吧。`, { item:{ ...item }, count:inventory[itemId], remainingMs:0 });
      inventory[itemId] = (inventory[itemId] || 0) + 1;
      cooldowns[itemId] = now + COLLECTIBLE_RESPAWN_MS;
      if (!discovered.includes(itemId)) discovered.push(itemId);
      return success(`拾取了${item.name}，已放入背包。`, { item:{ ...item }, count:inventory[itemId], remainingMs:0 });
    },

    talk(npcId) {
      const npc = npcMap.get(npcId);
      if (!npc) return fail('这位居民暂时不在这里。');
      const firstTime = !met.includes(npcId);
      if (firstTime) met.push(npcId);
      return success(gifted.includes(npcId) ? npc.giftReply : npc.greeting, { npc:{ ...npc }, firstTime });
    },

    gift(npcId) {
      const npc = npcMap.get(npcId);
      if (!npc) return fail('这位居民暂时不在这里。');
      if (gifted.includes(npcId)) return fail(`${npc.name}已经收到你的心意了，来聊聊天吧。`, { npc:{ ...npc }, already:true });
      if (!met.includes(npcId)) return fail(`先和${npc.name}打个招呼，听听有什么需要。`, { npc:{ ...npc }, missingNpcId:npcId });
      const item = itemMap.get(npc.requestItemId);
      if (!(inventory[item.id] > 0)) return fail(`${npc.name}需要${item.name}，先去收集一份吧。`, { npc:{ ...npc }, missingItemId:item.id });
      consume(item.id);
      gifted.push(npcId);
      progress.stamps += 1;
      return success(`${npc.giftReply} 友谊 +1，铜色纪念章 +1。`, { npc:{ ...npc }, item:{ ...item }, count:inventory[item.id] || 0 });
    },

    completeTask(taskId) {
      if (!taskIds.has(taskId)) return fail('没有找到这件日常小事。', { taskId });
      if (completedTasks.includes(taskId)) return fail('这件小事已经完成，纪念章也已经收好了。', { taskId, already:true });
      const requirement = taskRequirements[taskId];
      const item = itemMap.get(requirement.itemId);
      if (!(inventory[item.id] > 0)) return fail(`还需要一份${item.name}，收集后再来完成吧。`, { taskId, missingItemId:item.id });
      if (requirement.npcId && !met.includes(requirement.npcId)) {
        return fail(`先到庭院和${npcMap.get(requirement.npcId).name}聊聊，再来完成这件小事。`, { taskId, missingNpcId:requirement.npcId });
      }
      consume(item.id);
      completedTasks.push(taskId);
      progress.stamps += 1;
      return success(`使用了${item.name}，日常小事完成，铜色纪念章 +1。`, { taskId, item:{ ...item }, count:inventory[item.id] || 0 });
    },

    get state() { return snapshot(); }
  };
}
