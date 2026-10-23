import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createCharacter } from './characters.js';
import { collectibles, npcs } from './life-data.js';
import { itemPlacements, npcPlacements } from './life-placements.js';
import { interiorLayouts } from './room-layouts.js';
import { sculptCollectible } from './item-models.js';

// All inhabitants and finds use the existing castle renderer and camera.
export function createLifeWorld({ scene, camera, collisionRoot = scene, onInteract } = {}) {
  const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const root = new THREE.Group();
  root.name = 'castle-life';
  root.visible = false;
  scene.add(root);
  const geometryCache = new Map(), materialCache = new Map(), ownedGeometry = new Set(), effectMaterials = new Set();
  const records = [], pickables = [], raycaster = new THREE.Raycaster();
  const projected = new THREE.Vector3();
  let enabled = false, space = null, state = {}, elapsed = 0, disposed = false, hoveredItem = null;
  const itemScale = 1.35;

  const geometry = (key, make) => {
    if (!geometryCache.has(key)) geometryCache.set(key, make());
    return geometryCache.get(key);
  };
  const material = (color, metalness = 0, roughness = .68) => {
    const key = `${color}/${metalness}/${roughness}`;
    if (!materialCache.has(key)) materialCache.set(key, new THREE.MeshStandardMaterial({ color, metalness, roughness }));
    return materialCache.get(key);
  };
  const mesh = (parent, geom, mat, position, scale) => {
    const part = new THREE.Mesh(geom, mat);
    if (position) part.position.set(...position);
    if (scale) part.scale.set(...scale);
    part.castShadow = true; part.receiveShadow = true;
    parent.add(part);
    return part;
  };
  const ball = (p, c, xyz, size) => mesh(p, geometry('sphere', () => new THREE.SphereGeometry(1, 20, 14)), c, xyz, size);
  const box = (p, c, xyz, size) => mesh(p, geometry('box', () => new THREE.BoxGeometry(1, 1, 1)), c, xyz, size);
  const cyl = (p, c, xyz, top, bottom, height, sides = 12) => mesh(p,
    geometry(`cyl/${top}/${bottom}/${height}/${sides}`, () => new THREE.CylinderGeometry(top, bottom, height, sides)), c, xyz);
  const ring = (p, c, xyz, radius, thickness, arc = Math.PI * 2) => mesh(p,
    geometry(`ring/${radius}/${thickness}/${arc}`, () => new THREE.TorusGeometry(radius, thickness, 8, 32, arc)), c, xyz);

  // Merge rigid details by material within each animated pivot. Limbs, heads and
  // blinking eyes retain their transforms, while six residents stay economical.
  function compactCharacter(character) {
    const pivots = []; character.group.traverse(node => { if (node.isGroup) pivots.push(node); });
    for (const pivot of pivots) {
      const buckets = new Map();
      for (const part of [...pivot.children]) {
        if (!part.isMesh || part.children.length || Array.isArray(part.material)) continue;
        const key = part.material.uuid;
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(part);
      }
      for (const parts of buckets.values()) {
        if (parts.length < 2) continue;
        const pieces = parts.map(part => {
          part.updateMatrix();
          const copy = part.geometry.index ? part.geometry.toNonIndexed() : part.geometry.clone();
          return copy.applyMatrix4(part.matrix);
        });
        const merged = mergeGeometries(pieces, false);
        pieces.forEach(part => part.dispose());
        if (!merged) continue;
        ownedGeometry.add(merged);
        const replacement = new THREE.Mesh(merged, parts[0].material);
        replacement.castShadow = true; replacement.receiveShadow = true;
        parts.forEach(part => pivot.remove(part));
        pivot.add(replacement);
      }
    }
  }

  const haloMaterial = new THREE.MeshBasicMaterial({ color: '#d6b364', transparent: true, opacity: .48, depthWrite: false, side: THREE.DoubleSide });
  const proxyMaterial = new THREE.MeshBasicMaterial({ visible: false });
  // A shared radial texture gives the finds a soft pool of light without extra lights.
  const glowPixels = new Uint8Array(64 * 64 * 4);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const offset = (y * 64 + x) * 4, radius = Math.hypot((x - 31.5) / 31.5, (y - 31.5) / 31.5);
    glowPixels[offset] = glowPixels[offset + 1] = glowPixels[offset + 2] = 255;
    glowPixels[offset + 3] = Math.round(255 * Math.max(0, 1 - radius) ** 2);
  }
  const glowTexture = new THREE.DataTexture(glowPixels, 64, 64);
  glowTexture.magFilter = THREE.LinearFilter; glowTexture.minFilter = THREE.LinearFilter; glowTexture.needsUpdate = true;
  const starGeometry = geometry('find-star', () => {
    const shape = new THREE.Shape();
    shape.moveTo(0, .038); shape.lineTo(.009, .009); shape.lineTo(.027, 0); shape.lineTo(.009, -.009);
    shape.lineTo(0, -.038); shape.lineTo(-.009, -.009); shape.lineTo(-.027, 0); shape.lineTo(-.009, .009); shape.closePath();
    return new THREE.ShapeGeometry(shape);
  });
  function effectMaterial(options) {
    const value = new THREE.MeshBasicMaterial({ transparent:true, depthWrite:false, toneMapped:false, ...options });
    effectMaterials.add(value); return value;
  }
  function addItemEffects(item, color) {
    item.halo.material = effectMaterial({ color:'#dbb76d', opacity:.52, side:THREE.DoubleSide });
    const glowColor = new THREE.Color(color).lerp(new THREE.Color('#fff0c3'), .65);
    const glow = mesh(item.group, geometry('find-glow', () => new THREE.PlaneGeometry(.82, .82)),
      effectMaterial({ color:glowColor, map:glowTexture, opacity:.45 }), [0, .013, 0]);
    glow.rotation.x = -Math.PI / 2; glow.castShadow = false; glow.receiveShadow = false;
    const sparkleMaterial = effectMaterial({ color:'#f3d58d', opacity:.8, side:THREE.DoubleSide });
    item.sparkles = Array.from({length:5}, () => {
      const star = mesh(item.group, starGeometry, sparkleMaterial);
      star.castShadow = false; star.receiveShadow = false; return star;
    });
    item.glow = glow; item.sparkleMaterial = sparkleMaterial;
  }
  function addRecord(type, data, anchor, character = null) {
    const group = new THREE.Group(); group.position.set(...anchor.position); root.add(group);
    const body = new THREE.Group(); body.rotation.y = anchor.rotation; group.add(body);
    const item = { type, id: data.id, label: data.name, roomId: data.roomId, group, body, character,
      phase: anchor.phase ?? records.length * .73, reactRemaining: 0, reaction: 0, focus:0 };
    group.userData.lifeRecord = item;
    const halo = mesh(group, geometry(`halo/${type}`, () => new THREE.RingGeometry(type === 'npc' ? .15 : .205, type === 'npc' ? .175 : .214, 48)), haloMaterial, [0, .018, 0]);
    halo.rotation.x = -Math.PI / 2; halo.castShadow = false; halo.receiveShadow = false;
    item.halo = halo;
    if (character) {
      character.group.scale.setScalar(.36); body.add(character.group); compactCharacter(character);
    } else {
      const details = sculptCollectible(data.id, body, {geometry,material,mesh,ball,box,cyl,ring});
      item.flame = details?.flame;
      compactCharacter({ group: body }); body.scale.setScalar(itemScale);
      addItemEffects(item, data.color);
    }
    const proxy = mesh(group, geometry(`proxy/${type}`, () => new THREE.CylinderGeometry(type === 'npc' ? .17 : .22, type === 'npc' ? .17 : .22, type === 'npc' ? .65 : .42, 12)), proxyMaterial, [0, type === 'npc' ? .30 : .20, 0]);
    proxy.castShadow = false; proxy.receiveShadow = false; proxy.userData.lifeProxy = true;
    body.traverse(node => { if (node.isMesh) pickables.push(node); });
    pickables.push(proxy);
    records.push(item);
  }
  for (const data of collectibles) if (itemPlacements[data.id]) addRecord('item', data, itemPlacements[data.id]);
  for (const data of npcs) if (npcPlacements[data.id]) addRecord('npc', data, npcPlacements[data.id], createCharacter(data.roleId));

  function inActiveSpace(item) {
    if (item.type === 'npc') return !interiorLayouts[space];
    if (interiorLayouts[space]?.level === 'upper' && interiorLayouts[item.roomId]?.level === 'upper') return true;
    if (item.roomId === 'garden') return !space || space === 'courtyard' || space === 'garden';
    return item.roomId === space;
  }
  function onCooldown(item, now = Date.now()) { return item.type === 'item' && Number(state.cooldowns?.[item.id] || 0) > now; }
  function refreshVisibility() {
    const now = Date.now();
    for (const item of records) item.group.visible = enabled && inActiveSpace(item) && (!onCooldown(item, now) || item.reactRemaining > 0);
    root.visible = enabled;
  }
  function setEnabled(value) { enabled = Boolean(value); if (!enabled) hoveredItem = null; refreshVisibility(); }
  function setSpace(id) { space = id || null; hoveredItem = null; refreshVisibility(); }
  function setHover(type, id) { hoveredItem = type === 'item' ? id : null; }
  function sync(snapshot) { state = snapshot || {}; refreshVisibility(); }
  function visible(node) {
    while (node) { if (!node.visible) return false; node = node.parent; }
    return true;
  }
  function lifeRecord(node) {
    while (node && node !== root) { if (node.userData.lifeRecord) return node.userData.lifeRecord; node = node.parent; }
    return null;
  }
  function isArchitecture(hit) {
    let object = hit.object;
    while (object) {
      if (object === root || !object.visible || (object.userData.isRoof && object.parent?.userData.openValue > .08)) return false;
      object = object.parent;
    }
    const materials = Array.isArray(hit.object.material) ? hit.object.material : [hit.object.material];
    return materials.some(mat => !mat || (mat.visible !== false && (!mat.transparent || mat.opacity > .2)));
  }
  function intersect(ndc) {
    if (!enabled || disposed) return null;
    refreshVisibility(); scene.updateMatrixWorld(true); camera.updateMatrixWorld();
    raycaster.setFromCamera(ndc, camera);
    const candidates = raycaster.intersectObjects(pickables, false).filter(hit => visible(hit.object));
    const hit = candidates.find(candidate => {
      const record = lifeRecord(candidate.object);
      return record && !onCooldown(record) && record.reactRemaining <= 0;
    });
    if (!hit) return null;
    const blocker = raycaster.intersectObject(collisionRoot, true).find(isArchitecture);
    if (blocker && blocker.distance < hit.distance - .035) return null;
    return lifeRecord(hit.object);
  }
  function pick(ndc) {
    const record = intersect(ndc); if (!record) return false;
    onInteract?.({ type: record.type, id: record.id }); return true;
  }
  function hover(ndc) {
    const record = intersect(ndc);
    setHover(record?.type, record?.id);
    return record ? { type: record.type, id: record.id, label: record.label } : null;
  }
  function react(type, id) {
    const record = records.find(item => item.type === type && item.id === id);
    if (!record) return;
    record.reactRemaining = type === 'npc' ? 2.5 : .48;
    record.reaction = record.reactRemaining;
    if (type === 'npc') {
      camera.getWorldPosition(projected);
      record.body.rotation.y = Math.atan2(projected.x - record.group.position.x, projected.z - record.group.position.z);
    }
    refreshVisibility();
  }
  function update(dt = 0, time) {
    if (disposed) return;
    dt = Math.min(Math.max(dt, 0), .1);
    elapsed = Number.isFinite(time) ? time : elapsed + dt;
    if (!enabled) return;
    refreshVisibility();
    for (const item of records) {
      item.reactRemaining = Math.max(0, item.reactRemaining - dt);
      if (item.type === 'item' && item.reactRemaining === 0 && onCooldown(item)) item.group.visible = false;
      if (!item.group.visible) continue;
      if (item.type === 'npc') {
        const passingWave = (elapsed + item.phase * 2) % 13 < 1.2;
        item.character.update(dt, reducedMotion ? 0 : elapsed + item.phase, { waving: !reducedMotion && (item.reactRemaining > 0 || passingWave) });
        item.halo.scale.setScalar(item.reactRemaining > 0 && !reducedMotion ? 1 + Math.sin(elapsed * 5) * .12 : 1);
      } else {
        const progress = item.reactRemaining > 0 ? 1 - item.reactRemaining / item.reaction : 0;
        const collecting = item.reactRemaining > 0, focused = hoveredItem === item.id;
        item.focus = THREE.MathUtils.lerp(item.focus, focused ? 1 : 0, 1 - Math.exp(-dt * 12));
        const breathe = reducedMotion ? 0 : Math.sin(elapsed * 1.8 + item.phase);
        const lift = collecting ? progress * progress * .48 : .025 + breathe * .012 + item.focus * .045;
        const scale = collecting ? (1 + Math.sin(progress * Math.PI) * .22) * (1 - progress ** 2) : 1 + item.focus * .15;
        item.body.scale.setScalar(itemScale * (reducedMotion ? 1 : Math.max(.001, scale)));
        item.body.position.y = reducedMotion ? .025 : lift;
        item.body.rotation.y = itemPlacements[item.id].rotation + (reducedMotion ? 0 : Math.sin(elapsed * .65 + item.phase) * .05 + (collecting ? progress * .8 : 0));
        item.halo.scale.setScalar(reducedMotion ? 1 : collecting ? 1 + progress * 1.1 : 1 + item.focus * .18 + breathe * .025);
        item.halo.material.opacity = collecting ? .65 * (1 - progress) : .42 + item.focus * .28;
        item.glow.material.opacity = collecting ? .75 * (1 - progress) : .36 + item.focus * .24;
        item.sparkleMaterial.opacity = collecting ? .9 * Math.sin(progress * Math.PI) : .62 + item.focus * .25;
        item.sparkles.forEach((star, i) => {
          const angle = item.phase + i * Math.PI * 2 / 5;
          const orbit = collecting ? .10 + progress * .30 : .20 + item.focus * .035;
          star.visible = !reducedMotion && (collecting || i < 2);
          star.position.set(Math.cos(angle) * orbit, collecting ? .17 + progress * .38 + Math.sin(angle) * .06 : .20 + i * .10 + Math.sin(elapsed * 1.4 + i * 2 + item.phase) * .025, Math.sin(angle) * orbit);
          star.quaternion.copy(camera.quaternion);
          const twinkle = .35 + (Math.sin(elapsed * 2.2 + item.phase + i * 2) + 1) * .3;
          star.scale.setScalar(collecting ? Math.sin(progress * Math.PI) * .95 : twinkle);
        });
        if (item.flame) item.flame.scale.set(1, reducedMotion ? 1 : 1 + Math.sin(elapsed * 8) * .06 + Math.sin(elapsed * 13) * .035, 1);
      }
    }
  }
  function getMarkers() {
    if (!enabled || disposed) return [];
    refreshVisibility();
    return records.filter(item => item.group.visible && !onCooldown(item) && (item.type !== 'item' || item.reactRemaining <= 0)).map(item => ({
      type: item.type, id: item.id, label: item.label, hint: `${item.type === 'npc' ? '交谈' : '拾取'} · ${item.label}`,
      position: [item.group.position.x, item.group.position.y + (item.type === 'npc' ? .72 : .53), item.group.position.z],
    }));
  }
  function dispose() {
    if (disposed) return; disposed = true;
    records.forEach(item => item.character?.dispose());
    geometryCache.forEach(value => value.dispose()); ownedGeometry.forEach(value => value.dispose());
    materialCache.forEach(value => value.dispose()); effectMaterials.forEach(value => value.dispose()); glowTexture.dispose(); haloMaterial.dispose(); proxyMaterial.dispose();
    root.removeFromParent(); root.clear();
  }
  return { setSpace, setEnabled, setHover, sync, pick, hover, update, getMarkers, react, dispose };
}
