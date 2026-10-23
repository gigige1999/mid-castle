import { createLifeState } from './life-state.js';
import { taskRequirements } from './life-data.js';

const roleTasks = {
  lord: [
    { roomId:'keep', title:'整理衣冠', action:'披上外衣', description:'石室保暖有限，穿好外衣，再开始城堡中的一天。', doneText:'衣冠已整理好。厚实的织物，是石室里珍贵的温暖。' },
    { roomId:'hall', title:'迎接来客', action:'为来客安排座位', description:'在大厅的长桌旁安置来客，了解厅堂的接待用途。', doneText:'来客已经落座。长桌与长凳让大厅兼顾宴饮、接待和议事。' },
    { roomId:'council', title:'照看领地', action:'听取今日事务', description:'来到议事厅，听取有关道路、农田与收获的消息。', doneText:'今日事务已记下。维护道路、安排劳作，也是领主的日常。' }
  ],
  guard: [
    { roomId:'barracks', title:'准备轮值', action:'检查装备', description:'出发前检查衣物、灯具与日常装备，做好轮值准备。', doneText:'装备已备妥。守卫需要轮换休息，才能维持长时间的守望。' },
    { roomId:'gate', title:'巡查城门', action:'查看门闩', description:'检查木门与门闩，让旅人和货物有序通行。', doneText:'门闩完好。城门既保护居民，也连接着城堡与外面的生活。' },
    { roomId:'tower', title:'登高守望', action:'眺望远方道路', description:'沿城墙望向远处，留意道路上归来的旅人。', doneText:'远处道路平静。高处的视野让守卫能更早发现来访者。' }
  ],
  chaplain: [
    { roomId:'chapel', title:'照料礼拜堂', action:'整理祭坛', description:'将经书和烛台摆放整齐，为安静的礼仪做好准备。', doneText:'祭坛已整理好。祈祷与节期，是许多城堡居民生活的节奏。' },
    { roomId:'council', title:'留下文字', action:'记录一则约定', description:'在议事厅帮助记录约定，了解文字如何参与城堡事务。', doneText:'约定已记录。识字的教士有时也会承担文书与记录工作。' },
    { roomId:'hall', title:'关照居民', action:'与居民交谈', description:'前往大厅，聆听居民的近况，在日常中彼此照应。', doneText:'一次交谈带来一些宽慰。大厅也是交流消息、维系关系的地方。' }
  ],
  cook: [
    { roomId:'kitchen', title:'准备一锅热食', action:'整理炉边食材', description:'把谷物、豆类和陶罐备在木案旁，开始今天的烹饪。', doneText:'食材已准备好。谷物、豆类与蔬菜组成了许多人的日常饮食。' },
    { roomId:'garden', title:'采一把香草', action:'采收当季香草', description:'到菜园挑选当季香草，为热汤补上一点新鲜滋味。', doneText:'香草已采好。小菜园能补充鲜蔬，却无法代替城外的大面积农田。' },
    { roomId:'hall', title:'开饭时刻', action:'摆好餐桌', description:'将碗盏放上长桌，为城堡居民准备一顿热饭。', doneText:'餐桌已备好。可移动的桌板和长凳，让大厅能随活动改变用途。' }
  ],
  steward: [
    { roomId:'storage', title:'清点储备', action:'清点木桶与陶罐', description:'核对储藏室里的物资，留意哪些需要补充。', doneText:'储备已清点。妥善保存食物与燃料，让居民能从容度过冬季。' },
    { roomId:'granary', title:'照料收获', action:'检查谷物是否干燥', description:'查看粮仓的谷物与通风，避免潮气损坏收成。', doneText:'谷物保持干燥。防潮、通风与防鼠，都是粮仓管理的重要工作。' },
    { roomId:'council', title:'安排明日', action:'汇报物资余量', description:'把清点结果带到议事厅，为接下来的供应作准备。', doneText:'物资情况已汇报。粮食与劳作的安排，维系着城堡每日的运转。' }
  ],
  smith: [
    { roomId:'forge', title:'让旧物再用', action:'修整一枚门铰链', description:'在铁砧旁整理工具，修整日常门扇所需的铰链。', doneText:'铰链已修整好。铁匠的许多工作，是让现有器具继续使用。' },
    { roomId:'stable', title:'检查马具', action:'检查马具的金属扣', description:'来到马厩，查看马具上的金属扣是否牢固。', doneText:'金属扣牢固可靠。照料马匹也需要马夫与工匠相互配合。' },
    { roomId:'storage', title:'归还工具', action:'收好修整过的工具', description:'将修整好的工具送回储藏室，留待明日劳作。', doneText:'工具已经归位。不起眼的小铁件，支撑着运输、耕作与城堡生活。' }
  ],
  scribe: [
    { roomId:'scriptorium', title:'落下第一笔', action:'誊写一页书', description:'取一支修削好的羽毛笔，在窗边的书案上誊写文字。', doneText:'新的一页已经写好。抄写需要专注，也需要良好的光线与耐心。' },
    { roomId:'council', title:'留下今日约定', action:'誊清领地记录', description:'听管事说说今天的事务，再将约定写到羊皮纸上。', doneText:'领地记录已誊清。书写把口头承诺变成可以保存的凭据。' },
    { roomId:'chapel', title:'烛下校读', action:'与司铎核对经文', description:'拜访司铎，带上一支蜂蜡烛，在礼拜堂核对抄本。', doneText:'经文已经校读。抄本中的每一行，都凝结着许多人的劳作。' }
  ],
  healer: [
    { roomId:'infirmary', title:'备好照料用品', action:'整理草药罐', description:'将草药膏放到医舍的用品架上，为来访者备好干净布巾与水。', doneText:'用品已经备好。休息、清洁和日常照料，是这里重要的工作。' },
    { roomId:'garden', title:'辨认园中香草', action:'整理采来的叶片', description:'与伊迪丝聊聊园里的植物，采一束香草，按用途分别晾放。', doneText:'叶片已经分好。植物知识依靠观察、经验和人们之间的传授积累。' },
    { roomId:'keep', title:'送去温暖', action:'送上干净亚麻布', description:'问候领主，给卧室送去一份干净的亚麻布。', doneText:'亚麻布已送到。朴素的织物，也是城堡居民彼此照料的一部分。' }
  ],
  weaver: [
    { roomId:'weavery', title:'经纬初成', action:'织一段暖红饰边', description:'从矮架取来染色线团，沿织机上的经线慢慢穿梭。', doneText:'第一段饰边已经成形。一来一回的梭线，让纱成为结实的织物。' },
    { roomId:'storage', title:'收好新织物', action:'整理亚麻布卷', description:'和管事核对储备，把一份亚麻布卷送回干燥的储藏室。', doneText:'布卷已收好。纺线、织造、整理和储存，连接着许多双手。' },
    { roomId:'hall', title:'为长桌添色', action:'装点厅堂长桌', description:'听梅布尔讲讲织纹，带一条缎带去装点厅堂的长桌。', doneText:'长桌换上了新的织饰。细小的花纹，也能给共同的日常增添温度。' }
  ]
};

/** Visits, gathered supplies and conversations all participate in a castle day. */
export function createQuestBook({life=createLifeState()}={}) {
  let roleId = null;
  let tasks = [];
  let currentRoomId = null;

  const copyTask = task => task ? { ...task, completed:life.state.completedTasks.includes(task.id),requirement:{...taskRequirements[task.id]} } : null;
  const isFinished = () => tasks.length > 0 && tasks.every(task => life.state.completedTasks.includes(task.id));
  const snapshot = () => ({
    roleId,
    tasks: tasks.map(copyTask),
    completed: tasks.filter(task => life.state.completedTasks.includes(task.id)).length,
    total: tasks.length,
    nextTask: copyTask(tasks.find(task => !life.state.completedTasks.includes(task.id))),
    currentRoomId,
    currentTask: copyTask(tasks.find(task => task.roomId === currentRoomId)),
    finished: isFinished()
  });

  return {
    start(id) {
      if (!Object.hasOwn(roleTasks, id)) throw new RangeError(`Unknown castle role: ${id}`);
      if (roleId !== id) {
        roleId = id;
        tasks = roleTasks[id].map(task => ({ ...task, id:`${id}-${task.roomId}` }));
        currentRoomId = null;
      }
      return snapshot();
    },
    visit(roomId) {
      currentRoomId = typeof roomId === 'string' ? roomId : null;
      return snapshot();
    },
    complete(roomId) {
      const task = tasks.find(item => item.roomId === roomId);
      if (!task) return { ok:false, task:null, message:'这里没有你今日的小事，可以自在探索。', finished:isFinished() };
      if (currentRoomId !== roomId) return { ok:false, task:copyTask(task), message:'先到这个空间，再动手完成这件小事。', finished:isFinished() };
      const result=life.completeTask(task.id);
      return {...result,task:copyTask(task),message:result.ok?`${task.doneText} 获得一枚纪念章。`:result.message,finished:isFinished()};
    },
    get state() { return snapshot(); }
  };
}
