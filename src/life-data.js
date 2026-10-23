/** Small, renewable finds that make each castle room worth visiting. */
export const collectibles = [
  { id:'linen', name:'亚麻布', roomId:'keep', kind:'linen', color:'#ddc9a1', description:'柔软的一小卷亚麻布，带着晾晒后的清香。' },
  { id:'candle', name:'蜂蜡烛', roomId:'chapel', kind:'candle', color:'#edcc78', description:'暖黄的蜂蜡烛，能给礼拜堂添上一点温暖。' },
  { id:'parchment', name:'羊皮纸', roomId:'council', kind:'parchment', color:'#efdfb1', description:'一卷整洁的羊皮纸，等待记下新的约定。' },
  { id:'key', name:'铜钥匙', roomId:'storage', kind:'key', color:'#b99351', description:'小巧的备用钥匙，管事总能替它找到用处。' },
  { id:'ribbon', name:'织花缎带', roomId:'hall', kind:'ribbon', color:'#b57572', description:'一条带着细密花纹的缎带，适合点缀节日长桌。' },
  { id:'bread', name:'乡村面包', roomId:'kitchen', kind:'bread', color:'#c79458', description:'刚烤好的圆面包，外皮酥脆，足以让人精神起来。' },
  { id:'apple', name:'红苹果', roomId:'stable', kind:'apple', color:'#b85f50', description:'马夫留下的一颗红苹果，又甜又脆。' },
  { id:'iron', name:'锻铁料', roomId:'forge', kind:'iron', color:'#889191', description:'一块可再利用的铁料，能修好许多不起眼的小零件。' },
  { id:'grain', name:'麦穗束', roomId:'granary', kind:'grain', color:'#ceaa5e', description:'金黄的麦穗扎成小束，是今年收获的好消息。' },
  { id:'herbs', name:'新鲜香草', roomId:'garden', kind:'herbs', color:'#82966b', description:'清晨采下的一把香草，能让热汤更有滋味。' },
  { id:'quill', name:'羽毛笔', roomId:'scriptorium', kind:'quill', color:'#91a5ad', description:'修削整齐的鹅羽，和一小瓶墨一起，等待留下新的文字。' },
  { id:'salve', name:'草药膏', roomId:'infirmary', kind:'salve', color:'#98a780', description:'装在陶罐里的草药膏，带着蜂蜡和晾干叶片的气味。' },
  { id:'yarn', name:'染色线团', roomId:'weavery', kind:'yarn', color:'#bf8b7e', description:'茜草染成的暖红线团，可以织出一条新的桌边饰带。' }
];

export const npcs = [
  { id:'martha', name:'玛莎', roleId:'cook', roomId:'courtyard', greeting:'早安！厨房的汤锅正咕嘟作响，还差一点菜园里的香气。', requestItemId:'herbs', giftReply:'正是我需要的香草！今晚请来尝尝我的热汤。', tip:'菜园里有新鲜香草，靠近发光的小物件就能拾取。' },
  { id:'oswin', name:'奥斯温', roleId:'guard', roomId:'courtyard', greeting:'城门一切平安。刚轮完值，肚子已经先向厨房报到了。', requestItemId:'bread', giftReply:'这块面包来得太及时了！下回经过城门，我来替你带路。', tip:'厨房的木案附近，总能找到一份刚出炉的面包。' },
  { id:'agnes', name:'阿格尼斯', roleId:'steward', roomId:'courtyard', greeting:'我正在记录今年的收获。若有一束粮仓的麦穗，就更好比对了。', requestItemId:'grain', giftReply:'这束麦穗真饱满。多亏你帮忙，我的收获记录可以补齐了。', tip:'粮仓里放着扎好的麦穗束，记得也看看那里的储粮方式。' },
  { id:'edwin', name:'埃德温', roleId:'smith', roomId:'courtyard', greeting:'我的小锤子今天闲不住。修门铰链还缺一小块铁料。', requestItemId:'iron', giftReply:'好铁料！这就能把吱呀作响的门修好。送你一枚纪念章。', tip:'铁匠铺里有能再用的锻铁料，旧材料也有新用处。' },
  { id:'beatrice', name:'比阿特丽斯', roleId:'chaplain', roomId:'courtyard', greeting:'日安。今晚礼拜堂会点起烛光，我正准备一份安静的祝福。', requestItemId:'candle', giftReply:'谢谢你带来的蜡烛。愿这点暖光也照亮你的旅途。', tip:'礼拜堂的烛台旁放着备用蜂蜡烛。' },
  { id:'rowan', name:'罗文', roleId:'lord', roomId:'courtyard', greeting:'欢迎来散步。今天想给远方的朋友写封信，却忘了带纸。', requestItemId:'parchment', giftReply:'这卷纸正合适。等信写好，我会记上一笔你的热心。', tip:'议事厅里备着羊皮纸，也记录着城堡每日的事务。' },
  { id:'anselm', name:'安瑟尔', roleId:'scribe', roomId:'courtyard', greeting:'你听过羽毛在羊皮纸上沙沙作响吗？我正要抄完一页书，笔尖却磨钝了。', requestItemId:'quill', giftReply:'多谢这支好笔！我会把今日遇见你的故事写进页边。', tip:'缮写室靠北面的书案上有修削好的羽毛笔，书架旁还能找到许多卷册。' },
  { id:'edith', name:'伊迪丝', roleId:'healer', roomId:'courtyard', greeting:'今天的风有一点凉。我给劳作的邻居准备了温水和干净的亚麻布，还差一罐草药膏。', requestItemId:'salve', giftReply:'药膏送到了，照料大家又多了一份准备。谢谢你的细心。', tip:'草药医舍的北侧药架上放着陶罐。植物、蜂蜡与亚麻布，都是这里日常使用的材料。' },
  { id:'mabel', name:'梅布尔', roleId:'weaver', roomId:'courtyard', greeting:'织机上的经线已经排好，就等一团暖红的纱线，把厅堂装点起来。', requestItemId:'yarn', giftReply:'这颜色真暖！等桌边饰带织好，我会留一段花纹纪念你的帮助。', tip:'织造坊的北侧矮架上有染色线团。细细的经纬线，会一点点变成结实的布。' }
];

export const achievements = [
  { id:'first-find', name:'口袋里的惊喜', description:'收集你的第一件城堡物品。', target:1, metric:'discovered', symbol:'✦' },
  { id:'curious-collector', name:'好奇收藏家', description:'发现 5 种不同的物品。', target:5, metric:'discovered', symbol:'❖' },
  { id:'castle-treasures', name:'城堡百宝袋', description:'发现 10 种不同的城堡物品。', target:10, metric:'discovered', symbol:'♜' },
  { id:'craft-stories', name:'手艺里的故事', description:'集齐全部 13 种物品，记下新工坊的日常。', target:13, metric:'discovered', symbol:'✿' },
  { id:'familiar-faces', name:'熟悉的面孔', description:'与 3 位不同的居民交谈。', target:3, metric:'met', symbol:'☀' },
  { id:'kind-neighbour', name:'热心好邻居', description:'为 3 位居民送去所需的物品。', target:3, metric:'gifted', symbol:'♡' },
  { id:'a-day-well-spent', name:'充实的一天', description:'完成 3 件角色日常小事。', target:3, metric:'completedTasks', symbol:'⚑' }
];

export const itemById = id => collectibles.find(item => item.id === id) || null;
export const npcById = id => npcs.find(npc => npc.id === id) || null;

/** Every daily task uses one find; some also require hearing a resident's story. */
export const taskRequirements = {
  'lord-keep': { itemId:'linen' },
  'lord-hall': { itemId:'bread', npcId:'martha' },
  'lord-council': { itemId:'parchment', npcId:'agnes' },
  'guard-barracks': { itemId:'iron' },
  'guard-gate': { itemId:'key', npcId:'oswin' },
  'guard-tower': { itemId:'bread', npcId:'rowan' },
  'chaplain-chapel': { itemId:'candle' },
  'chaplain-council': { itemId:'parchment', npcId:'agnes' },
  'chaplain-hall': { itemId:'bread', npcId:'martha' },
  'cook-kitchen': { itemId:'grain' },
  'cook-garden': { itemId:'herbs' },
  'cook-hall': { itemId:'bread', npcId:'martha' },
  'steward-storage': { itemId:'key' },
  'steward-granary': { itemId:'grain' },
  'steward-council': { itemId:'parchment', npcId:'agnes' },
  'smith-forge': { itemId:'iron' },
  'smith-stable': { itemId:'apple', npcId:'oswin' },
  'smith-storage': { itemId:'key', npcId:'agnes' },
  'scribe-scriptorium': { itemId:'quill' },
  'scribe-council': { itemId:'parchment', npcId:'agnes' },
  'scribe-chapel': { itemId:'candle', npcId:'beatrice' },
  'healer-infirmary': { itemId:'salve' },
  'healer-garden': { itemId:'herbs', npcId:'edith' },
  'healer-keep': { itemId:'linen', npcId:'rowan' },
  'weaver-weavery': { itemId:'yarn' },
  'weaver-storage': { itemId:'linen', npcId:'agnes' },
  'weaver-hall': { itemId:'ribbon', npcId:'mabel' }
};

export const COLLECTIBLE_RESPAWN_MS = 15_000;
export const LIFE_STORAGE_KEY = 'castellum-life-v1';
