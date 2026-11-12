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

/** One lit layer of a tree: these nodes, in this colour. */
export type TreeLayer = { colour: string; hashes: Set<number> };

/**
 * Paths for lit layers, listed dimmest first. A node takes the last layer it
 * is in; an edge takes the dimmer of its two ends, so a path running from a
 * popular node to a rarer one is still drawn, in the rarer colour. Thumbnail
 * and explorer both draw from this, so they always agree.
 */
export const layerPaths = (data: AtlasData, layers: TreeLayer[], nodeScale = 1) => {
  const rank = new Map<number, number>();
  layers.forEach(({ hashes }, index) => {
    for (const hash of hashes) rank.set(hash, index);
  });
  // the start node joins whichever layer its neighbour is in
  const rankOf = (hash: number) =>
    data.nodes[hash]?.kind === 'start' ? Infinity : rank.get(hash);

  const edges = layers.map(() => '');
  for (const edge of data.edges) {
    const a = rankOf(edge[0]);
    const b = rankOf(edge[1]);
    if (a === undefined || b === undefined) continue;
    const index = Math.min(a, b);
    if (index !== Infinity) edges[index] += edgeD(data, edge);
  }
  const nodes = layers.map(() => '');
  for (const [hash, index] of rank) {
    const node = data.nodes[hash];
    if (node?.x === undefined || node.y === undefined) continue;
    nodes[index] += circle(node.x, node.y, Math.round(NODE_RADIUS[node.kind] * nodeScale));
  }
  return layers.map(({ colour }, index) => ({ colour, edges: edges[index], nodes: nodes[index] }));
};

const adjacencyCache = new WeakMap<AtlasData, Map<number, number[]>>();

const adjacency = (data: AtlasData) => {
  let links = adjacencyCache.get(data);
  if (!links) {
    links = new Map();
    for (const [a, b] of data.edges) {
      if (!links.has(a)) links.set(a, []);
      if (!links.has(b)) links.set(b, []);
      links.get(a)!.push(b);
      links.get(b)!.push(a);
    }
    adjacencyCache.set(data, links);
  }
  return links;
};

/**
 * The shortest way to allocate `target` from what is already allocated (or
 * the start): the nodes to take, ending at `target`, plus the one it hangs
 * off. Empty when `target` is allocated already or unreachable.
 */
export const routeTo = (data: AtlasData, allocated: Set<number>, target: number) => {
  if (allocated.has(target) || data.nodes[target]?.kind === 'start') {
    return { from: undefined, nodes: [] as number[] };
  }
  const links = adjacency(data);
  const cameFrom = new Map<number, number | undefined>();
  const queue: number[] = [];
  for (const [hash, node] of Object.entries(data.nodes)) {
    const id = Number(hash);
    if (allocated.has(id) || node.kind === 'start') {
      cameFrom.set(id, undefined);
      queue.push(id);
    }
  }
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    if (current === target) break;
    for (const next of links.get(current) ?? []) {
      if (cameFrom.has(next)) continue;
      cameFrom.set(next, current);
      queue.push(next);
    }
  }
  if (!cameFrom.has(target)) return { from: undefined, nodes: [] as number[] };
  const nodes: number[] = [];
  let step: number | undefined = target;
  while (step !== undefined && cameFrom.get(step) !== undefined) {
    nodes.unshift(step);
    step = cameFrom.get(step);
  }
  return { from: step, nodes };
};

/** One path along a chain of adjacent nodes, curving where the tree does. */
export const chainPath = (data: AtlasData, chain: number[]) => {
  let d = '';
  for (let index = 1; index < chain.length; index++) {
    const a = chain[index - 1];
    const b = chain[index];
    const edge = data.edges.find(
      ([from, to]) => (from === a && to === b) || (from === b && to === a),
    );
    if (edge) d += edgeD(data, edge);
  }
  return d;
};

/** A ring just outside a node, for hover and selection. */
export const ringPath = (data: AtlasData, hash: number, gap = 1.45) => {
  const node = data.nodes[hash];
  if (node?.x === undefined || node.y === undefined) return '';
  return circle(node.x, node.y, Math.round(Math.max(NODE_RADIUS[node.kind], 40) * gap));
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
