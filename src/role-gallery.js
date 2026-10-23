import * as THREE from 'three';
import { createCharacter } from './characters.js';
import './role-gallery.css';

// Every portrait shares one transparent canvas; off-screen cards skip rendering.
export function createRoleGallery(container, roles) {
 const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
 const portraits = [];
 let renderer = null, active = false, failed = false, contextLost = false, selected = null;
 let frame = 0, previousTime = 0, width = 0, height = 0, pixelRatio = 0;

 function initialize() {
  if (renderer || failed) return;
  try {
   renderer = new THREE.WebGLRenderer({ alpha:true, antialias:true, powerPreference:'low-power' });
   renderer.setClearColor(0x000000, 0);
   renderer.outputColorSpace = THREE.SRGBColorSpace;
   renderer.toneMapping = THREE.ACESFilmicToneMapping;
   renderer.toneMappingExposure = 1.3;
   renderer.autoClear = false;
   renderer.domElement.className = 'role-gallery-canvas';
   renderer.domElement.setAttribute('aria-hidden', 'true');
   container.append(renderer.domElement);
   roles.forEach(role => {
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xfff7e5, 0xa78b6b, 2.7));
    const key = new THREE.DirectionalLight(0xfff6de, 3.1);
    key.position.set(-2.5, 4, 4);scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 1.2);
    rim.position.set(3, 2.8, -2);scene.add(rim);
    const character = createCharacter(role.id);
    scene.add(character.group);
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(.45, .48, .045, 48), new THREE.MeshStandardMaterial({color:0xdcc6a1,roughness:1}));
    plinth.position.y = -.028;scene.add(plinth);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(.34, 40),new THREE.MeshBasicMaterial({color:0x59452e,transparent:true,opacity:.12,depthWrite:false}));
    shadow.rotation.x = -Math.PI / 2;shadow.position.y = -.003;scene.add(shadow);
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 20);
    camera.position.set(1.5, 1.8, 4.5);camera.lookAt(0, .8, 0);
    portraits.push({id:role.id,element:container.querySelector(`[data-character="${role.id}"]`),scene,camera,character,plinth,shadow});
   });
   renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();contextLost = true;cancelAnimationFrame(frame);frame = 0;
    container.classList.remove('has-character-models');
   });
   renderer.domElement.addEventListener('webglcontextrestored', () => { contextLost = false;previousTime = 0;if(active) requestDraw(); });
  } catch {
   failed = true;
   renderer?.dispose();renderer?.domElement.remove();renderer = null;
   container.classList.remove('has-character-models');
  }
 }

 function draw(time) {
  frame = 0;
  if (!active || !renderer || contextLost || document.hidden) return;
  if (!reduceMotion.matches && previousTime && time - previousTime < 1000 / 30) {
   frame = requestAnimationFrame(draw);return;
  }
  const bounds = container.getBoundingClientRect();
  if (bounds.width < 1 || bounds.height < 1) return;
  const nextWidth = Math.ceil(bounds.width), nextHeight = Math.ceil(bounds.height);
  const bufferLimit = Math.min(renderer.capabilities.maxTextureSize, 4096);
  const nextRatio = Math.min(window.devicePixelRatio || 1, 1.7, bufferLimit / nextWidth, bufferLimit / nextHeight);
  if (width !== nextWidth || height !== nextHeight || pixelRatio !== nextRatio) {
   width = nextWidth;height = nextHeight;pixelRatio = nextRatio;
   renderer.setPixelRatio(pixelRatio);renderer.setSize(width, height, false);
  }
  const dialogBounds = container.closest('dialog')?.getBoundingClientRect();
  const visibleTop = Math.max(0, dialogBounds?.top ?? 0);
  const visibleBottom = Math.min(window.innerHeight, dialogBounds?.bottom ?? window.innerHeight);
  const dt = previousTime ? Math.min((time - previousTime) / 1000, .05) : 0;
  previousTime = time;
  renderer.setScissorTest(false);renderer.clear();renderer.setScissorTest(true);
  for (const portrait of portraits) {
   const rect = portrait.element.getBoundingClientRect();
   if (rect.width < 1 || rect.height < 1 || rect.bottom < visibleTop || rect.top > visibleBottom) continue;
   const left = rect.left - bounds.left, bottom = bounds.bottom - rect.bottom;
   const halfHeight = 1.02, aspect = rect.width / rect.height;
   portrait.camera.left = -halfHeight * aspect;portrait.camera.right = halfHeight * aspect;
   portrait.camera.top = halfHeight;portrait.camera.bottom = -halfHeight;
   portrait.camera.updateProjectionMatrix();
   const isSelected = selected === portrait.id;
   portrait.character.group.rotation.y = reduceMotion.matches ? -.12 : -.12 + Math.sin(time / 1800) * (isSelected ? .15 : .035);
   portrait.character.update(reduceMotion.matches ? 0 : dt, reduceMotion.matches ? 0 : time / 1000, {walking:false,waving:isSelected&&!reduceMotion.matches});
   renderer.setViewport(left, bottom, rect.width, rect.height);
   renderer.setScissor(left, bottom, rect.width, rect.height);
   renderer.render(portrait.scene, portrait.camera);
  }
  container.classList.add('has-character-models');
  if (!reduceMotion.matches) frame = requestAnimationFrame(draw);
 }
 function requestDraw() {
  if (active && renderer && !contextLost && !frame && !document.hidden) frame = requestAnimationFrame(draw);
 }
 const resizeObserver = new ResizeObserver(requestDraw);
 resizeObserver.observe(container);
 const dialog = container.closest('dialog');
 dialog?.addEventListener('scroll', requestDraw, {passive:true});
 const onVisibility = () => {
  if(document.hidden){cancelAnimationFrame(frame);frame=0;previousTime=0;}else requestDraw();
 };
 document.addEventListener('visibilitychange', onVisibility);
 reduceMotion.addEventListener('change', requestDraw);
 return {
  start(id) { selected = id || null;active = true;initialize();requestDraw(); },
  select(id) { selected = id || null;requestDraw(); },
  stop() { active = false;cancelAnimationFrame(frame);frame = 0;previousTime = 0; },
  dispose() {
   this.stop();resizeObserver.disconnect();document.removeEventListener('visibilitychange', onVisibility);
   dialog?.removeEventListener('scroll', requestDraw);
   reduceMotion.removeEventListener('change', requestDraw);
   portraits.forEach(({character,plinth,shadow}) => {
    character.dispose();plinth.geometry.dispose();plinth.material.dispose();shadow.geometry.dispose();shadow.material.dispose();
   });
   renderer?.dispose();renderer?.domElement.remove();container.classList.remove('has-character-models');
  }
 };
}
