import type { AtlasData, AtlasEdge, AtlasNodeKind } from './atlas';

// SVG path building for the atlas tree. Whole layers (every edge, every
// allocated node...) are emitted as one path string each, so a tree costs a
// handful of DOM nodes however many passives it has - which is what lets the
// Farm page show a thumbnail per member.

// Colours of the tree marks, on the page's near-black surface. The allocated
// and highlight pair was checked with the dataviz palette validator for
// colour-blind separation; identity never rests on colour alone (labels,
// tooltips and the side list carry it too).
export const TREE_COLOURS = {
  edge: '#232c3a',
  node: '#3d4756',
  allocated: '#ae8c26',
  highlight: '#2f9bdc',
  // guild heat: one hue, brighter = more members
  heat: ['#5c4a14', '#86691d', '#ae8c26', '#e3c453'],
} as const;

export const NODE_RADIUS: Record<AtlasNodeKind, number> = {
  small: 34,
  notable: 58,
  keystone: 86,
  gateway: 58,
  mastery: 0,
  start: 86,
};

const PADDING = 320;

export const treeViewBox = ({ bounds: [minX, minY, maxX, maxY] }: AtlasData) => ({
  x: minX - PADDING,
  y: minY - PADDING,
  w: maxX - minX + PADDING * 2,
  h: maxY - minY + PADDING * 2,
});

const circle = (x: number, y: number, r: number) =>
  `M${x - r} ${y}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;

const edgeD = (data: AtlasData, [from, to, radius, sweep]: AtlasEdge) => {
  const a = data.nodes[from];
  const b = data.nodes[to];
  if (a?.x === undefined || b?.x === undefined) return '';
  return radius
    ? `M${a.x} ${a.y}A${radius} ${radius} 0 0 ${sweep} ${b.x} ${b.y}`
    : `M${a.x} ${a.y}L${b.x} ${b.y}`;
};

// the start node is never in anyone's hashes but every tree hangs off it
const on = (data: AtlasData, hash: number, include: (hash: number) => boolean) =>
  include(hash) || data.nodes[hash]?.kind === 'start';

/** One path through every edge whose two ends both pass `include`. */
export const edgesPath = (
  data: AtlasData,
  include?: (hash: number) => boolean,
): string =>
  data.edges
    .filter(([from, to]) => !include || (on(data, from, include) && on(data, to, include)))
    .map((edge) => edgeD(data, edge))
    .join('');

/**
 * One path of circles for every drawn node that passes `include`. `scale`
 * enlarges them (thumbnails need bigger dots than the full-size tree).
 */
export const nodesPath = (
  data: AtlasData,
  include?: (hash: number) => boolean,
  scale = 1,
): string => {
  let d = '';
  for (const [hash, node] of Object.entries(data.nodes)) {
    if (node.x === undefined || node.y === undefined) continue;
    if (include && !include(Number(hash))) continue;
    d += circle(node.x, node.y, Math.round(NODE_RADIUS[node.kind] * scale));
  }
  return d;
};

// The full, unallocated tree is identical for everyone on a version: built
// once and shared by every thumbnail.
const baseCache = new WeakMap<AtlasData, Map<number, { edges: string; nodes: string }>>();

export const baseTree = (data: AtlasData, scale = 1) => {
  let byScale = baseCache.get(data);
  if (!byScale) baseCache.set(data, (byScale = new Map()));
  let base = byScale.get(scale);
  if (!base) {
    base = { edges: edgesPath(data), nodes: nodesPath(data, undefined, scale) };
    byScale.set(scale, base);
  }
  return base;
};
