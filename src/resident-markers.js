import './resident-markers.css';

let markerSequence = 0;
const speechMark = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5.3 14.1 3 16v-4.1A6 6 0 0 1 2.4 9c0-3.3 3.3-5.7 7.6-5.7s7.6 2.4 7.6 5.7-3.3 5.7-7.6 5.7c-1.7 0-3.3-.2-4.7-.6Z"/><path d="M6.8 9h.1m3.1 0h.1m3.1 0h.1"/></svg>';

/** Small courtyard cues; a resident's name and action appear only after selection. */
export function createResidentMarkers({ container, npcs, onInteract, onHighlight }) {
  const layer = document.createElement('div');
  layer.className = 'resident-markers';
  container.append(layer);
  const records = new Map();
  let selected = null;
  let highlighted = null;
  let enabled = false;
  let lastFrame = null;

  function highlight(id) {
    if (highlighted === id) return;
    highlighted = id;
    onHighlight?.(id);
  }

  function close() {
    if (selected) {
      const record = records.get(selected);
      record.root.classList.remove('is-selected');
      record.trigger.setAttribute('aria-expanded', 'false');
      record.card.hidden = true;
      selected = null;
    }
    highlight(null);
  }

  function select(id) {
    const record = records.get(id);
    if (!record || !enabled || !record.available) return false;
    if (selected !== id) close();
    selected = id;
    record.root.classList.add('is-selected');
    record.trigger.setAttribute('aria-expanded', 'true');
    record.card.hidden = false;
    highlight(id);
    if (lastFrame) placeMarkers(lastFrame);
    return true;
  }

  for (const npc of npcs) {
    const root = document.createElement('div');
    root.className = 'resident-marker';
    root.dataset.resident = npc.id;
    root.hidden = true;
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'resident-marker-trigger';
    trigger.innerHTML = `<span>${speechMark}</span>`;
    trigger.setAttribute('aria-label', `查看${npc.name}`);
    trigger.setAttribute('aria-expanded', 'false');
    const card = document.createElement('div');
    card.className = 'resident-marker-card';
    card.id = `resident-card-${++markerSequence}`;
    card.hidden = true;
    trigger.setAttribute('aria-controls', card.id);
    const name = document.createElement('strong');
    name.className = 'resident-marker-name';
    name.textContent = npc.name;
    const hint = document.createElement('span');
    hint.className = 'resident-marker-hint';
    hint.textContent = '庭院里的邻居';
    const dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.className = 'resident-marker-close';
    dismiss.textContent = '×';
    dismiss.setAttribute('aria-label', `收起${npc.name}的介绍`);
    const interact = document.createElement('button');
    interact.type = 'button';
    interact.className = 'resident-marker-action';
    interact.innerHTML = '走近交谈 <span aria-hidden="true">↗</span>';
    card.append(hint, name, dismiss, interact);
    root.append(trigger, card);
    layer.append(root);
    records.set(npc.id, { root, trigger, card, available: false });

    root.addEventListener('click', event => event.stopPropagation());
    root.addEventListener('pointerdown', event => event.stopPropagation());
    trigger.addEventListener('click', () => selected === npc.id ? close() : select(npc.id));
    trigger.addEventListener('focus', () => highlight(npc.id));
    root.addEventListener('focusout', event => {
      if (!root.contains(event.relatedTarget)) highlight(selected);
    });
    dismiss.addEventListener('click', () => {
      close();
      trigger.focus({ preventScroll: true });
    });
    interact.addEventListener('click', () => {
      close();
      onInteract?.(npc.id);
    });
  }

  function placeMarkers({ project, markers, width, height, maxX }) {
    const available = new Map(markers.filter(marker => marker.type === 'npc').map(marker => [marker.id, marker]));
    const right = Math.min(width, maxX ?? width);
    const occupied = [];
    const ordered = [...records.entries()].sort(([a], [b]) => Number(b === selected) - Number(a === selected));
    for (const [id, record] of ordered) {
      const marker = available.get(id);
      record.available = enabled && Boolean(marker);
      let point;
      if (record.available) point = project(marker.position);
      const inBounds = point?.visible !== false && Number.isFinite(point?.x) && Number.isFinite(point?.y)
        && point.x >= 18 && point.x <= right - 18 && point.y >= 90 && point.y <= height - 125;
      const crowded = inBounds && id !== selected && occupied.some(other => Math.hypot(point.x - other.x, point.y - other.y) < 30);
      record.root.hidden = !record.available || !inBounds || crowded;
      if (record.root.hidden) {
        if (id === selected) close();
        continue;
      }
      occupied.push(point);
      record.root.style.left = `${point.x}px`;
      record.root.style.top = `${point.y}px`;
      if (id === selected) {
        const halfCard = 82;
        const center = Math.max(halfCard + 12, Math.min(right - halfCard - 12, point.x));
        record.card.style.setProperty('--resident-card-offset', `${center - point.x}px`);
        record.root.classList.toggle('is-card-below', point.y < 215);
      }
    }
  }

  function sync(project, markers, { visible = true, width = container.clientWidth, height = container.clientHeight, maxX, blocked = false } = {}) {
    enabled = visible && !blocked;
    layer.hidden = !enabled;
    if (!enabled) close();
    lastFrame = { project, markers, width, height, maxX };
    placeMarkers(lastFrame);
  }

  function onEscape(event) {
    if (event.key !== 'Escape' || !selected) return;
    const trigger = records.get(selected).trigger;
    const hadFocus = layer.contains(document.activeElement);
    close();
    if (hadFocus) trigger.focus({ preventScroll: true });
    event.preventDefault();
    event.stopPropagation();
  }
  document.addEventListener('keydown', onEscape, true);

  return {
    sync, select, close,
    dispose() {
      close();
      document.removeEventListener('keydown', onEscape, true);
      layer.remove();
      records.clear();
      lastFrame = null;
    },
  };
}
