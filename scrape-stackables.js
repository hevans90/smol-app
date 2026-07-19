// One-off script: builds src/assets/stackables/stackables.json from RePoE's
// exported game data. Not part of the build — run manually and commit the
// output when new stackable items are added to the game (new leagues).
//
//   node scrape-stackables.js
//
// Source: https://repoe-fork.github.io/ (community-maintained export of PoE's
// own game data). We only want items a guild would bulk-order in quantity:
// currency, essences, fossils, oils, catalysts, scarabs, resonators, map
// fragments, incubators, and divination cards — NOT uniques (those are
// single-item and already served by the existing order flow).
import fs from 'fs';

const BASE_ITEMS_URL = 'https://repoe-fork.github.io/base_items.json';
const OUTPUT_PATH = 'src/assets/stackables/stackables.json';

// Matches the allowed item classes; DivinationCard/MapFragment/
// IncubatorStackable fall back to a class-based category, everything else
// gets a name-based category below.
const ALLOWED_CLASSES = new Set([
  'StackableCurrency',
  'DelveStackableSocketableCurrency',
  'DelveSocketableCurrency',
  'MapFragment',
  'IncubatorStackable',
  'DivinationCard',
]);

// Mirrors mapDdsToPoeImageUrl in src/_utils/utils.ts.
const mapDdsToPoeImageUrl = (ddsFilePath, width = 1, height = 1) => {
  const baseUrl = 'https://web.poecdn.com/image/';
  const pathWithoutExt = ddsFilePath.replace(/\.dds$/, '');
  return `${baseUrl}${pathWithoutExt}.png?scale=1&w=${width}&h=${height}`;
};

const categoryOf = (item) => {
  const { name, item_class: itemClass } = item;
  // name-based checks first: these item types matter more to guild members
  // than their underlying engine class (e.g. Scarabs are MapFragment class)
  if (name.includes('Scarab')) return 'Scarab';
  if (name.includes('Fossil')) return 'Fossil';
  if (name.includes('Resonator')) return 'Resonator';
  if (name.includes('Catalyst')) return 'Catalyst';
  if (name.includes('Essence') && itemClass === 'StackableCurrency')
    return 'Essence';
  if (name.endsWith('Oil') && itemClass === 'StackableCurrency') return 'Oil';
  if (itemClass === 'MapFragment') return 'Fragment';
  if (itemClass === 'IncubatorStackable') return 'Incubator';
  if (itemClass === 'DivinationCard') return 'Divination Card';
  return 'Currency';
};

async function main() {
  console.log(`Fetching ${BASE_ITEMS_URL}...`);
  const response = await fetch(BASE_ITEMS_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch base_items.json: ${response.status}`);
  }
  const baseItems = await response.json();

  const seen = new Set();
  const stackables = [];

  for (const item of Object.values(baseItems)) {
    if (item.release_state !== 'released') continue;
    if (!ALLOWED_CLASSES.has(item.item_class)) continue;
    if (seen.has(item.name)) continue;
    if (!item.visual_identity?.dds_file) continue;

    seen.add(item.name);
    stackables.push({
      name: item.name,
      category: categoryOf(item),
      icon: mapDdsToPoeImageUrl(item.visual_identity.dds_file),
    });
  }

  stackables.sort((a, b) => a.name.localeCompare(b.name));

  fs.mkdirSync('src/assets/stackables', { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(stackables, null, 2) + '\n');

  const byCategory = stackables.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`Wrote ${stackables.length} items to ${OUTPUT_PATH}`);
  console.log(byCategory);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
