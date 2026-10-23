export const castleRoles = [
  { id:'lord', name:'领主', english:'THE LORD', motto:'在炉火与议事之间，照看一方领地。', assignedRoom:'keep', roomIds:['keep','hall','council'], assignment:'主堡里的私人卧室已为你备好。白天接待来客、处理领地事务，夜晚回到织毯与木床之间。', duty:'从卧室出发，前往大厅与议事厅。', icon:'crown' },
  { id:'guard', name:'守卫', english:'THE GUARD', motto:'守住城门，也守住石墙内的日常。', assignedRoom:'barracks', roomIds:['barracks','gate','tower'], assignment:'你分到守卫居所的一张床位与装备储物箱。这里靠近城墙，便于轮值时迅速前往岗位。', duty:'检查装备，再去城门与角塔值守。', icon:'shield' },
  { id:'chaplain', name:'司铎', english:'THE CHAPLAIN', motto:'在钟声与烛光里，安放一日的信仰。', assignedRoom:'chapel', roomIds:['chapel','council','hall'], assignment:'礼拜堂是你的职责空间。祭坛与经书已经就位，你将在这里主持礼仪、聆听与记录。', duty:'照料祭坛，阅读经书，参与城堡事务。', icon:'cross' },
  { id:'cook', name:'厨师', english:'THE COOK', motto:'把收获与炉火，变成一桌热食。', assignedRoom:'kitchen', roomIds:['kitchen','hall','garden'], assignment:'厨房的炉灶、木案与陶罐交由你打理。从菜园取来香草，再为大厅准备每日的餐食。', duty:'整理食材，照看炉灶，为大厅备餐。', icon:'pot' },
  { id:'steward', name:'管事', english:'THE STEWARD', motto:'让每一袋谷物、每一只木桶各得其所。', assignedRoom:'storage', roomIds:['storage','granary','council'], assignment:'储藏室是你管理物资的起点。清点粮食与酒桶、安排补给，也要留意粮仓的防潮与通风。', duty:'清点储物，巡查粮仓，向议事厅汇报。', icon:'keys' },
  { id:'smith', name:'铁匠', english:'THE BLACKSMITH', motto:'以锤声回应岁月，让旧物继续服役。', assignedRoom:'forge', roomIds:['forge','stable','storage'], assignment:'铁匠铺的锻炉与铁砧交由你使用。在火光里修补工具、铰链和马具，让城堡每天照常运转。', duty:'点起炉火，修理器具，照看马厩所需。', icon:'hammer' },
  { id:'scribe', name:'缮写员', english:'THE SCRIBE', motto:'蘸一滴墨，把城堡的故事留在纸上。', assignedRoom:'scriptorium', roomIds:['scriptorium','council','chapel'], assignment:'缮写室窗下的斜面书案为你留好。调配墨水、修整羽毛笔，把领地文书与珍贵经卷一页页抄录下来。', duty:'准备纸墨，记录议事，再到礼拜堂校阅经卷。', icon:'quill' },
  { id:'healer', name:'草药师', english:'THE HERBALIST', motto:'循着草木的气味，照料每一位邻人。', assignedRoom:'infirmary', roomIds:['infirmary','garden','keep'], assignment:'疗养室的药草柜与诊疗木床交给你照管。清晨在菜园采叶，晒制草药、洗净亚麻布，为城堡居民准备一份安心。', duty:'整理药罐，去菜园采集，再探望主堡居民。', icon:'herb' },
  { id:'weaver', name:'织工', english:'THE WEAVER', motto:'让一根根彩线，织成石墙里的温暖。', assignedRoom:'weavery', roomIds:['weavery','storage','hall'], assignment:'织造间的木织机与纺轮已经备齐。你将整理羊毛、绕好经线，修补衣物，也为大厅织出新的挂毯。', duty:'给织机穿线，领取布料，为大厅整理织物。', icon:'shuttle' }
];
export const roleById = id => castleRoles.find(role=>role.id===id) || null;
export function roleSymbol(icon){
 const paths={
  crown:'<path d="m8 16 8 7 8-13 8 13 8-7-4 20H12Z"/><path d="M12 30h24M16 40h16"/><circle cx="8" cy="14" r="2"/><circle cx="24" cy="8" r="2"/><circle cx="40" cy="14" r="2"/>',
  shield:'<path d="m24 6 15 6v13c0 9-15 17-15 17S9 34 9 25V12Z"/><path d="M24 14v20M16 23h16"/>',
  cross:'<path d="M21 7h6v11h10v6H27v18h-6V24H11v-6h10Z"/><path d="M7 38h8m18 0h8"/>',
  pot:'<path d="M12 20h24v12a10 10 0 0 1-10 10h-4a10 10 0 0 1-10-10ZM9 20h30M17 16h14M20 7c-4 5 4 5 0 8m8-8c-4 5 4 5 0 8M12 25H6v7h6m24-7h6v7h-6"/>',
  keys:'<circle cx="17" cy="14" r="7"/><path d="M17 21v20h6v-5h-6m0-7h6M31 9a7 7 0 1 1 0 14m0 0v15h6v-5h-6"/>',
  hammer:'<path d="m10 9 10 2 8 8-8 8-8-8ZM24 23l16 16-5 5-16-16M7 8l8-5M8 37h10m-13 5h16"/>',
  quill:'<path d="M12 36 35 9m-16 20C9 12 25 7 39 5c-1 16-8 29-20 24ZM24 22l11-1M29 16l8-1M13 29l6 5M8 36h13v7H8ZM6 43h18"/>',
  herb:'<path d="M25 41V18m0 15C9 34 8 22 8 22s16-3 17 11Zm0-10C22 8 37 6 37 6s3 14-12 17Zm0 14c1-14 15-12 15-12s-1 13-15 12ZM16 43h17M18 16C8 18 9 8 9 8s10-1 9 8Z"/>',
  shuttle:'<path d="M4 24 15 11h18l11 13-11 13H15ZM15 11l5 13-5 13m18-26-5 13 5 13M20 24h8M21 17h6m-7 4h8m-8 6h8m-7 4h6M10 40c5-4 10 5 16 0s10 1 14-2"/>'
 };
 return `<svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">${paths[icon]||paths.keys}</svg>`;
}
