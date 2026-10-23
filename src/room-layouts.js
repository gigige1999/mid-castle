import { expansionLayouts } from './interior-expansion.js';
// Shared anchors keep the scene, room labels and room assignments in agreement.
export const interiorLayouts = {
  keep:     { center: [1.82, 3.55, -3.15], roofOwner: 'keep', roofPosition: [1.82, 6.85, -3.15], zoom: 4.7 },
  chapel:   { center: [4.1, 3.55, -3.0], roofOwner: 'keep', roofPosition: [4.1, 6.3, -3.0], zoom: 5.2 },
  council:  { center: [1.8, 3.55, -1.15], roofOwner: 'keep', roofPosition: [1.8, 6.3, -1.15], zoom: 4.9 },
  storage:  { center: [4.1, 3.55, -.86], direction: [-.22,.96,-.18], roofOwner: 'keep', roofPosition: [4.1, 5.55, -.86], zoom: 5.3 },
  hall:     { center: [3.84, .72, 3.32], roofOwner: 'hall', roofPosition: [3.84, 3.2, 3.32], zoom: 4.1 },
  kitchen:  { center: [4.91, .72, 1.36], direction: [-.22,.96,.18], roofOwner: 'kitchen', roofPosition: [4.91, 2.55, 1.36], zoom: 5.4 },
  barracks: { center: [-4.7, .72, -1.75], roofOwner: 'barracks', roofPosition: [-4.7, 2.85, -1.75], zoom: 4.5 },
  stable:   { center: [-4.65, .72, 1.74], roofOwner: 'stable', roofPosition: [-4.65, 2.55, 1.74], zoom: 4.9 },
  forge:    { center: [-3.63, .72, 3.81], direction: [.2,.96,-.22], roofOwner: 'forge', roofPosition: [-3.63, 2.55, 3.81], zoom: 5.2 },
  granary:  { center: [-2.82, .72, -3.79], roofOwner: 'granary', roofPosition: [-2.82, 2.7, -3.79], zoom: 5.2 },
  scriptorium: { center: [-.8, .72, -3.5], direction: [.12,.98,.14], roofOwner: 'scriptorium', roofPosition: [-.8, 2.5, -3.5], zoom: 5.4 },
  infirmary: { center: [-2.55, .72, 1.65], direction: [.12,.98,.14], roofOwner: 'infirmary', roofPosition: [-2.55, 2.5, 1.65], zoom: 5.2 },
  weavery: { center: [-.85, .72, 3.87], direction: [-.12,.98,-.14], roofOwner: 'weavery', roofPosition: [-.85, 2.4, 3.87], zoom: 5.5 },
};

for(const [id,{walk,...layout}] of Object.entries(expansionLayouts)){
  interiorLayouts[id]={...interiorLayouts[id],...layout,roofPosition:interiorLayouts[id]?.roofPosition||layout.center,entrySpawn:walk?.spawn};
}
