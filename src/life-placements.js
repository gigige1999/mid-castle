import { keepItemPlacements } from './keep-wing.js';
// Objects sit just above existing furnishings; these anchors are shared with markers.
export const itemPlacements = {
  linen: { position: [1.15, 3.95, -4.28], rotation: -.18 },
  candle: { position: [3.55, 4.10, -3.37], rotation: 0 },
  parchment: { position: [1.75, 4.19, -1.12], rotation: -.25 },
  key: { position: [3.62, 3.95, -.85], rotation: .25 },
  ribbon: { position: [3.4, 1.23, 2.8], rotation: .4 },
  bread: { position: [4.56, 1.07, 1.55], rotation: -.35 },
  apple: { position: [-4.08, .88, 2.56], rotation: .15 },
  iron: { position: [-3.60, 1.02, 3.94], rotation: .5 },
  grain: { position: [-2.49, 1.27, -4.23], rotation: -.15 },
  herbs: { position: [-.89, .61, 1.3], rotation: .25 },
  quill: { position: [-.74, 1.00, -3.9], rotation: -.2 },
  salve: { position: [-2.25, 1.07, .87], rotation: .2 },
  yarn: { position: [-.35, .99, 3.44], rotation: -.25 },
};

for(const [id,position] of Object.entries(keepItemPlacements))itemPlacements[id]={...itemPlacements[id],position};

export const npcPlacements = {
  martha: { position: [1.5, .235, 3.35], rotation: -.8, phase: .4 },
  oswin: { position: [.65, .235, 4.3], rotation: -1.4, phase: 1.8 },
  agnes: { position: [-2.7, .235, -1.65], rotation: 1.15, phase: 3.1 },
  edwin: { position: [-2.28, .235, 3.75], rotation: 1.15, phase: 4.5 },
  beatrice: { position: [.65, .235, 3.08], rotation: .2, phase: 6 },
  rowan: { position: [-.6, .235, -2.4], rotation: 1.3, phase: 7.3 },
  anselm: { position: [-3.13, .235, -2.14], rotation: .6, phase: 8.2 },
  edith: { position: [-1.41, .235, .12], rotation: -.6, phase: 9.1 },
  mabel: { position: [-2.27, .235, 3.17], rotation: .9, phase: 10.4 },
};
