#!/usr/bin/env node
// Builds src/assets/atlas/atlas-<version>.json from GGG's official atlas tree
// export (https://github.com/grindinggear/atlastree-export): a slim lookup of
// every atlas passive with the farming mechanic it belongs to, plus where it
// sits on the tree. The Farm page uses it to turn a member's allocated node
// hashes into a strategy and to draw their tree.
//
//   node scripts/generate-atlas-data.mjs            # latest tag
//   node scripts/generate-atlas-data.mjs 3.30.0     # a specific tag/branch
//   node scripts/generate-atlas-data.mjs ./data.json 3.30.0-preview   # a local file
//
// NOTHING here is keyed on node ids, which change every league. A node's
// mechanic is derived, in order, from:
//   1. its icon file name          (AtlasTrees/DeliriumNode1.png -> delirium)
//   2. keywords in its name/stats  (keystones mostly have one-off icons)
//   3. the majority mechanic of the other nodes in its group
// Anything decided by step 3, or not decided at all, is printed at the end.
// After a new league's export lands, run this, read that list, and add a rule
// to ICON_RULES / KEYWORD_RULES (or OVERRIDES as a last resort) for anything
// that landed in the wrong place.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Mechanics that are not something you "farm": shown separately so they don't
// drown out the signal.
export const GENERIC_MECHANICS = new Set(['maps', 'bosses', 'general']);

// Keys deliberately match the league_type enum / public/league-icons names
// where one exists, so manual tags and deduced mechanics line up.
export const MECHANIC_LABELS = {
  abyss: 'Abyss',
  altar_eater: 'Eater altars',
  altar_exarch: 'Exarch altars',
  bestiary: 'Bestiary',
  betrayal: 'Betrayal',
  beyond: 'Beyond',
  blight: 'Blight',
  breach: 'Breach',
  delirium: 'Delirium',
  delve: 'Delve',
  essence: 'Essence',
  expedition: 'Expedition',
  harbinger: 'Harbinger',
  harvest: 'Harvest',
  heist: 'Heist',
  incursion: 'Incursion',
  labyrinth: 'Labyrinth',
  legion: 'Legion',
  ritual: 'Ritual',
  sanctum: 'Sanctum',
  settlers_of_kalguur: 'Kalguur',
  ultimatum: 'Ultimatum',
  mercenaries: 'Mercenaries',
  rogue_exiles: 'Rogue Exiles',
  strongboxes: 'Strongboxes',
  shrines: 'Shrines',
  torment: 'Torment',
  scarabs: 'Scarabs',
  threads: 'Threads',
  maven: 'Maven',
  conquerors: 'Conquerors',
  shaper_elder: 'Shaper / Elder',
  synthesis: 'Synthesis',
  vaal_side_areas: 'Vaal side areas',
  memories: 'Atlas Memories',
  maps: 'Map sustain',
  bosses: 'Map bosses',
  general: 'General',
};

// Matched against the icon's base file name, lower-cased, in order.
export const ICON_RULES = [
  [/breach/, 'breach'],
  [/delirium/, 'delirium'],
  [/abyss/, 'abyss'],
  [/legion|rupturemeter/, 'legion'],
  [/ultimatum/, 'ultimatum'],
  [/blight|cassia/, 'blight'],
  [/ritual/, 'ritual'],
  [/expedition|extremearchaeology/, 'expedition'],
  [/bestiary|einhar/, 'bestiary'],
  [/beyond/, 'beyond'],
  [/harvest|croprotation/, 'harvest'],
  [/delve|niko/, 'delve'],
  [/jun|betrayal/, 'betrayal'],
  [/alva|incursion/, 'incursion'],
  [/heist/, 'heist'],
  [/essence/, 'essence'],
  [/kalguur/, 'settlers_of_kalguur'],
  [/merc/, 'mercenaries'],
  [/anarchy/, 'rogue_exiles'],
  [/strongbox/, 'strongboxes'],
  [/shrine/, 'shrines'],
  [/torment/, 'torment'],
  [/scarab/, 'scarabs'],
  [/thread/, 'threads'],
  [/harbinger/, 'harbinger'],
  [/sanctum/, 'sanctum'],
  [/labyrinth/, 'labyrinth'],
  [/cleansingfire|exarch/, 'altar_exarch'],
  [/thetangle|eaterofworlds/, 'altar_eater'],
  [/maven/, 'maven'],
  [/conqueror|sirus/, 'conquerors'],
  [/eldershaper|shaper|elder/, 'shaper_elder'],
  [/synthesis|eagon/, 'synthesis'],
  [/vaal/, 'vaal_side_areas'],
  [/atlasmemories|memor/, 'memories'],
  [/bossmapdrops/, 'bosses'],
  [/mapnode|mapnotable|itemquantity|modifiertier|atlasmapmod|scryingorb|^map/, 'maps'],
];

// Matched against "<name>\n<stats>", in order. Only reached when no icon
// rule fired, so these mainly catch keystones.
export const KEYWORD_RULES = [
  [/\bbreach/i, 'breach'],
  [/deliri|simulacrum/i, 'delirium'],
  [/\babyss/i, 'abyss'],
  [/\blegion|timeless (?:conflict|splinter|emblem)/i, 'legion'],
  [/ultimatum|trialmaster/i, 'ultimatum'],
  [/\bblight|cassia/i, 'blight'],
  [/\britual/i, 'ritual'],
  [/expedition|runic monster|logbook/i, 'expedition'],
  [/einhar|\bbeasts?\b|bestiary/i, 'bestiary'],
  [/\bbeyond\b/i, 'beyond'],
  [/harvest|sacred grove|lifeforce/i, 'harvest'],
  [/\bniko\b|\bdelve|sulphite|azurite/i, 'delve'],
  [/\bjun\b|betrayal|immortal syndicate/i, 'betrayal'],
  [/\balva\b|incursion|atzoatl/i, 'incursion'],
  [/\bheist|smuggler|blueprint|rogue's marker/i, 'heist'],
  [/\bessence/i, 'essence'],
  [/kalguur|ore deposit|kingsmarch|verisium/i, 'settlers_of_kalguur'],
  [/mercenar/i, 'mercenaries'],
  [/rogue exile/i, 'rogue_exiles'],
  [/strongbox/i, 'strongboxes'],
  [/\bshrine/i, 'shrines'],
  [/tormented|possessed/i, 'torment'],
  [/\bscarab/i, 'scarabs'],
  [/\bthreads?\b/i, 'threads'],
  [/harbinger/i, 'harbinger'],
  [/sanctum/i, 'sanctum'],
  [/labyrinth/i, 'labyrinth'],
  [/searing exarch/i, 'altar_exarch'],
  [/eater of worlds/i, 'altar_eater'],
  [/eldritch altar/i, 'altar_exarch'],
  [/\bmaven/i, 'maven'],
  [/conqueror|sirus/i, 'conquerors'],
  [/\bshaper|\belder\b/i, 'shaper_elder'],
  [/synthesis|synthesised/i, 'synthesis'],
  [/vaal side area|corrupted area/i, 'vaal_side_areas'],
  [/atlas memor/i, 'memories'],
  [/map boss|unique boss/i, 'bosses'],
  [/\bmaps?\b/i, 'maps'],
];

// Last resort, keyed by node NAME (never by id). Keep this short: prefer a rule.
export const OVERRIDES = {};

const iconKey = (icon = '') =>
  path.basename(icon).replace(/\.png$/i, '').toLowerCase();

const firstMatch = (rules, text) => rules.find(([re]) => re.test(text))?.[1];

const kindOf = (node) =>
  node.isKeystone ? 'keystone'
  : node.isNotable ? 'notable'
  : node.isMastery ? 'mastery'
  : node.isWormhole ? 'gateway'
  : 'small';

/**
 * Classifies every node of an atlastree-export data.json.
 * Returns { nodes: { [hash]: { name, kind, mechanic, stats } }, report }.
 */
export const classifyAtlas = (data) => {
  const entries = Object.values(data.nodes).filter(
    (node) => node.skill !== undefined && node.name,
  );

  const decided = new Map(); // skill -> { mechanic, via }
  for (const node of entries) {
    const text = `${node.name}\n${(node.stats ?? []).join('\n')}`;
    const override = OVERRIDES[node.name];
    const byIcon = firstMatch(ICON_RULES, iconKey(node.icon));
    const byKeyword = firstMatch(KEYWORD_RULES, text);
    if (override) decided.set(node.skill, { mechanic: override, via: 'override' });
    else if (byIcon) decided.set(node.skill, { mechanic: byIcon, via: 'icon' });
    else if (byKeyword) decided.set(node.skill, { mechanic: byKeyword, via: 'keyword' });
  }

  // step 3: whatever its group mostly is
  const groupOf = new Map(entries.map((node) => [node.skill, node.group]));
  const groupVotes = new Map();
  for (const [skill, { mechanic }] of decided) {
    const group = groupOf.get(skill);
    if (group === undefined) continue;
    const votes = groupVotes.get(group) ?? new Map();
    votes.set(mechanic, (votes.get(mechanic) ?? 0) + 1);
    groupVotes.set(group, votes);
  }
  for (const node of entries) {
    if (decided.has(node.skill)) continue;
    const votes = [...(groupVotes.get(node.group) ?? new Map())].sort(
      (a, b) => b[1] - a[1],
    );
    decided.set(
      node.skill,
      votes.length
        ? { mechanic: votes[0][0], via: 'group' }
        : { mechanic: 'general', via: 'none' },
    );
  }

  const nodes = {};
  const report = { byVia: {}, byMechanic: {}, review: [] };
  for (const node of entries) {
    const { mechanic, via } = decided.get(node.skill);
    const kind = kindOf(node);
    nodes[node.skill] = { name: node.name, kind, mechanic, stats: node.stats ?? [] };
    report.byVia[via] = (report.byVia[via] ?? 0) + 1;
    report.byMechanic[mechanic] = (report.byMechanic[mechanic] ?? 0) + 1;
    if (via === 'group' || via === 'none') {
      report.review.push({ name: node.name, kind, mechanic, via, icon: iconKey(node.icon) });
    }
  }
  return { nodes, report };
};

// Angles (degrees, clockwise from 12 o'clock) of each slot on an orbit. The
// 16- and 40-slot orbits are not evenly spaced; these tables are the same
// ones the passive tree uses.
const ORBIT_ANGLES_16 = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
const ORBIT_ANGLES_40 = [
  0, 10, 20, 30, 40, 45, 50, 60, 70, 80, 90, 100, 110, 120, 130, 135, 140, 150, 160, 170,
  180, 190, 200, 210, 220, 225, 230, 240, 250, 260, 270, 280, 290, 300, 310, 315, 320, 330, 340, 350,
];
const orbitAngle = (slots, index) =>
  ((slots === 16 ? ORBIT_ANGLES_16[index]
    : slots === 40 ? ORBIT_ANGLES_40[index]
    : (360 / slots) * index) * Math.PI) / 180;

/**
 * Where every node sits and how they connect, for drawing the tree.
 *   positions: { hash: [x, y] }
 *   edges: [[fromHash, toHash, arcRadius, sweep]] - arcRadius 0 is a straight
 *          line; otherwise the two nodes share an orbit and the connection
 *          follows it (sweep is the SVG arc sweep-flag).
 * Masteries (cluster artwork, not allocatable) and the links between paired
 * gateways are left out.
 */
export const layoutAtlas = (data) => {
  const { skillsPerOrbit, orbitRadii } = data.constants;
  const placed = new Map();
  for (const node of Object.values(data.nodes)) {
    const group = data.groups?.[node.group];
    if (!group || node.isMastery || node.orbit === undefined) continue;
    const radius = orbitRadii[node.orbit];
    const angle = orbitAngle(skillsPerOrbit[node.orbit], node.orbitIndex ?? 0);
    placed.set(String(node.skill), {
      node,
      angle,
      x: Math.round(group.x + radius * Math.sin(angle)),
      y: Math.round(group.y - radius * Math.cos(angle)),
    });
  }

  const edges = [];
  for (const [id, from] of placed) {
    for (const outId of from.node.out ?? []) {
      const to = placed.get(String(outId));
      if (!to || (from.node.isWormhole && to.node.isWormhole)) continue;
      const sameOrbit =
        from.node.group === to.node.group && from.node.orbit === to.node.orbit;
      if (!sameOrbit || !orbitRadii[from.node.orbit]) {
        edges.push([Number(id), Number(outId), 0, 0]);
        continue;
      }
      // follow the orbit the short way round
      const turn = (to.angle - from.angle + 2 * Math.PI) % (2 * Math.PI);
      edges.push([Number(id), Number(outId), orbitRadii[from.node.orbit], turn < Math.PI ? 1 : 0]);
    }
  }

  const xs = [...placed.values()].map(({ x }) => x);
  const ys = [...placed.values()].map(({ y }) => y);
  return {
    positions: Object.fromEntries([...placed].map(([id, { x, y }]) => [id, [x, y]])),
    edges,
    bounds: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
  };
};

const fetchJson = async (url) => {
  const response = await fetch(url, { headers: { 'User-Agent': 'smol-app-atlas-data' } });
  if (!response.ok) throw new Error(`${response.status} from ${url}`);
  return response.json();
};

const main = async () => {
  const [source, versionArg] = process.argv.slice(2);
  let data;
  let version = versionArg;

  if (source && /\.json$/.test(source)) {
    data = JSON.parse(await readFile(source, 'utf8'));
    if (!version) throw new Error('pass a version label after a local file path');
  } else {
    const ref =
      source ??
      (await fetchJson('https://api.github.com/repos/grindinggear/atlastree-export/tags'))[0].name;
    version ??= ref;
    data = await fetchJson(
      `https://raw.githubusercontent.com/grindinggear/atlastree-export/${ref}/data.json`,
    );
  }

  const { nodes, report } = classifyAtlas(data);
  const { positions, edges, bounds } = layoutAtlas(data);
  for (const [id, [x, y]] of Object.entries(positions)) {
    if (nodes[id]) Object.assign(nodes[id], { x, y });
    // the unnamed node every tree grows from: not a passive, but drawn
    else nodes[id] = { name: 'Atlas start', kind: 'start', mechanic: 'general', stats: [], x, y };
  }
  const used = new Set(Object.values(nodes).map((node) => node.mechanic));
  const output = {
    version,
    totalPoints: data.points?.totalPoints ?? null,
    mechanics: MECHANIC_LABELS,
    generic: [...GENERIC_MECHANICS].filter((key) => used.has(key)),
    nodes,
    bounds,
    edges,
  };

  const outFile = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    `../src/assets/atlas/atlas-${version}.json`,
  );
  await writeFile(outFile, JSON.stringify(output));

  console.log(`atlas ${version}: ${Object.keys(nodes).length} nodes, ${output.totalPoints} points -> ${path.relative(process.cwd(), outFile)}`);
  console.log('decided by:', report.byVia);
  console.log('per mechanic:', Object.entries(report.byMechanic).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', '));
  const unknownKeys = [...used].filter((key) => !MECHANIC_LABELS[key]);
  if (unknownKeys.length) console.log('MECHANICS WITH NO LABEL:', unknownKeys);
  if (report.review.length) {
    console.log(`\nREVIEW (${report.review.length} nodes not matched by an icon or keyword rule):`);
    for (const row of report.review) {
      console.log(`  [${row.kind}] ${row.name} -> ${row.mechanic} (${row.via}, icon: ${row.icon})`);
    }
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
