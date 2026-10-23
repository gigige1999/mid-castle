import './navigation.css';

const spaceGroups = [
  { name: '起居与会客', ids: ['keep', 'hall', 'council'] },
  { name: '典籍与照料', ids: ['chapel', 'scriptorium', 'infirmary'] },
  { name: '厨房与储备', ids: ['kitchen', 'storage', 'granary'] },
  { name: '工艺与劳作', ids: ['forge', 'weavery', 'stable', 'garden'] },
  { name: '院落与防御', ids: ['courtyard', 'barracks', 'gate', 'tower', 'moat'] },
];

export function createSpaceNavigation({ rooms, onSelect, onOverview, getAssigned }) {
  const compact = window.matchMedia('(max-width: 760px)');
  const trigger = document.querySelector('#all-spaces-button');
  const sidebar = document.createElement('aside');
  sidebar.id = 'space-navigation';
  sidebar.className = 'space-navigation';
  sidebar.setAttribute('aria-label', '城堡空间目录');
  const dialog = document.createElement('dialog');
  dialog.id = 'space-navigation-dialog';
  dialog.className = 'space-navigation-dialog';
  dialog.setAttribute('aria-labelledby', 'space-navigation-dialog-title');
  document.querySelector('#experience').appendChild(sidebar);
  document.body.appendChild(dialog);

  let exploring = false;
  let expanded = false;
  let selected = null;
  let assignment = null;
  const entries = [];
  const overviewButtons = [];
  const roomsById = new Map(rooms.map(room => [room.id, room]));

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function build(container, titleId) {
    const head = element('div', 'space-nav-head');
    const heading = element('div');
    heading.append(element('span', 'space-nav-kicker', 'THE CASTLE AT A GLANCE'));
    const title = element('h2', '', '空间目录');
    title.id = titleId;
    title.append(element('small', '', `${rooms.length} 处`));
    heading.append(title);
    const dismiss = element('button', 'space-nav-dismiss', '×');
    dismiss.type = 'button';
    dismiss.setAttribute('aria-label', '收起空间目录');
    dismiss.addEventListener('click', close);
    head.append(heading, dismiss);

    const overview = element('button', 'space-nav-overview');
    overview.type = 'button';
    overview.append(element('span', '', '←'), document.createTextNode('城堡总览'), element('small', '', '全景'));
    overview.addEventListener('click', () => {
      close();
      onOverview();
    });
    overviewButtons.push(overview);

    const list = element('nav', 'space-nav-list');
    list.setAttribute('aria-label', '按用途浏览全部空间');
    spaceGroups.forEach((group, index) => {
      const members = group.ids.map(id => roomsById.get(id)).filter(Boolean);
      if (!members.length) return;
      const section = element('section', 'space-nav-group');
      const groupTitle = element('h3', '', group.name);
      groupTitle.id = `${titleId}-group-${index}`;
      groupTitle.append(element('span', '', String(members.length).padStart(2, '0')));
      section.setAttribute('aria-labelledby', groupTitle.id);
      section.append(groupTitle);
      members.forEach(room => {
        const button = element('button', 'space-nav-item');
        button.type = 'button';
        button.tabIndex = 0;
        button.dataset.space = room.id;
        button.setAttribute('aria-label', `${room.name}，${room.interior ? '展开室内' : '查看区域'}`);
        const mine = element('small', 'space-nav-mine', '我的');
        mine.hidden = true;
        button.append(
          element('span', 'space-nav-number', room.number),
          element('span', 'space-nav-name', room.name),
          mine,
          element('span', 'space-nav-action', room.interior ? '展开' : '查看'),
        );
        button.addEventListener('click', () => {
          close();
          onSelect(room.id);
        });
        entries.push({ room, button, mine });
        section.append(button);
      });
      list.append(section);
    });
    const interiorCount = rooms.filter(room => room.interior).length;
    const foot = element('p', 'space-nav-foot', `${interiorCount} 间室内 · ${rooms.length - interiorCount} 处城堡区域`);
    container.append(head, overview, list, foot);
  }

  function updateVisibility() {
    const visible = exploring && expanded && !compact.matches;
    sidebar.classList.toggle('is-open', visible);
    sidebar.inert = !visible;
    sidebar.setAttribute('aria-hidden', String(!visible));
    if (trigger) {
      trigger.hidden = !exploring;
      trigger.setAttribute('aria-controls', compact.matches ? dialog.id : sidebar.id);
      trigger.setAttribute('aria-expanded', String(compact.matches ? dialog.open : visible));
      trigger.setAttribute('aria-label', (compact.matches ? dialog.open : visible) ? '收起全部空间目录' : '打开全部空间目录');
      trigger.title = '全部空间目录';
    }
  }

  function open() {
    if (!exploring) return;
    if (compact.matches) {
      if (!dialog.open) dialog.showModal();
    } else expanded = true;
    updateVisibility();
  }

  function close() {
    if (dialog.open) dialog.close();
    if (!compact.matches) expanded = false;
    updateVisibility();
  }

  function sync(state) {
    const nowExploring = Boolean(state.exploring);
    if (nowExploring && !exploring) expanded = false;
    exploring = nowExploring;
    if (!exploring && dialog.open) dialog.close();
    const current = typeof state.selected === 'object' ? state.selected?.id : state.selected;
    const assigned = getAssigned?.();
    const assignedId = typeof assigned === 'object' ? assigned?.assignedRoom : assigned;
    if (selected !== current || assignment !== assignedId) {
      selected = current;
      assignment = assignedId;
      entries.forEach(({ room, button, mine }) => {
        const active = room.id === selected;
        button.classList.toggle('selected', active);
        if (active) button.setAttribute('aria-current', 'location');
        else button.removeAttribute('aria-current');
        mine.hidden = room.id !== assignment;
        button.setAttribute('aria-label', `${room.name}${room.id === assignment ? '，我的分配房间' : ''}，${room.interior ? '展开室内' : '查看区域'}`);
      });
    }
    overviewButtons.forEach(button => {
      if (!selected) button.setAttribute('aria-current', 'location');
      else button.removeAttribute('aria-current');
    });
    updateVisibility();
  }

  build(sidebar, 'space-navigation-title');
  build(dialog, 'space-navigation-dialog-title');
  trigger?.addEventListener('click', () => {
    if (compact.matches ? dialog.open : expanded) close();
    else open();
  });
  dialog.addEventListener('close', updateVisibility);
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
  });
  compact.addEventListener('change', () => {
    if (dialog.open) dialog.close();
    updateVisibility();
  });
  sync({ exploring: false, selected: null });
  return { sync, open, close };
}
