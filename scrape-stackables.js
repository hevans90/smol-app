// One-off script: builds src/assets/stackables/stackables.json from RePoE's
// exported game data. Not part of the build — run manually and commit the
// output when new stackable items are added to the game (new leagues).
//
//   node scrape-stackables.js [league]
//
// Source: https://repoe-fork.github.io/ (community-maintained export of PoE's
// own game data). We only want items a guild would bulk-order in quantity:
// currency, essences, fossils, oils, catalysts, scarabs, resonators, map
// fragments, incubators, and divination cards — NOT uniques (those are
// single-item and already served by the existing order flow).
//
// RePoE's release_state only means "this item shipped at some point" — it
// does NOT mean "still obtainable". The generic StackableCurrency class has
// been GGG's dumping ground for every league's unique currency since 2013,
// so left unfiltered it's full of long-vaulted relics (Ancient Orb, Perandus
// Coin, ...) that no longer exist in the live game. The other categories
// (div cards, scarabs, essences, fragments, ...) don't have this problem —
// they're each tied to a specific still-current mechanic. So we cross-check
// ONLY the Currency category against poe.ninja's live economy data for the
// current league, and additionally strip `[DNT - UNUSED]` engine test items
// (which can show up in any category).
import fs from 'fs';

const BASE_ITEMS_URL = 'https://repoe-fork.github.io/base_items.json';
const NINJA_INDEX_URL = 'https://poe.ninja/poe1/api/data/index-state';
const ninjaCurrencyOverviewUrl = (league) =>
  `https://poe.ninja/poe1/api/economy/exchange/current/overview?league=${encodeURIComponent(league)}&type=Currency`;
const OUTPUT_PATH = 'src/assets/stackables/stackables.json';

// The 4 lowest essence tiers (levels 1-4) are worthless enough that no
// guild would ever bulk-order them — not a "vaulted/removed" case, just
// noise we deliberately exclude from the picker.
const USELESS_ESSENCE_TIERS = ['Muttering', 'Wailing', 'Weeping', 'Whispering'];

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
  // DivinationCard first: some card names/rewards happen to collide with
  // the name-based checks below (e.g. "The Catalyst" rewards a Vaal Orb).
  if (itemClass === 'DivinationCard') return 'Divination Card';
  // name-based checks: these item types matter more to guild members than
  // their underlying engine class (e.g. Scarabs are MapFragment class)
  if (name.includes('Scarab')) return 'Scarab';
  if (name.includes('Fossil')) return 'Fossil';
  if (name.includes('Resonator')) return 'Resonator';
  if (name.includes('Catalyst') && itemClass === 'StackableCurrency')
    return 'Catalyst';
  if (name.includes('Essence') && itemClass === 'StackableCurrency')
    return 'Essence';
  if (name.endsWith('Oil') && itemClass === 'StackableCurrency') return 'Oil';
  if (itemClass === 'MapFragment') return 'Fragment';
  if (itemClass === 'IncubatorStackable') return 'Incubator';
  return 'Currency';
};

const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.json();
};

async function main() {
  const league =
    process.argv[2] ??
    (await (async () => {
      console.log(`Fetching ${NINJA_INDEX_URL} to find the current league...`);
      const index = await fetchJson(NINJA_INDEX_URL);
      return index.economyLeagues[0].name;
    })());
  console.log(`Using league: ${league}`);

  console.log(`Fetching ${BASE_ITEMS_URL}...`);
  const baseItems = await fetchJson(BASE_ITEMS_URL);

  console.log('Fetching poe.ninja currency overview...');
  const ninjaCurrency = await fetchJson(ninjaCurrencyOverviewUrl(league));
  const currentCurrencyNames = new Set(
    ninjaCurrency.items.map((item) => item.name),
  );

  // Dedupe by name first (first occurrence wins) so the vaulted-currency
  // count below reflects unique items, not RePoE's many duplicate raw
  // entries per name (different drop levels/variants).
  const byName = new Map();
  for (const item of Object.values(baseItems)) {
    if (item.release_state !== 'released') continue;
    if (!ALLOWED_CLASSES.has(item.item_class)) continue;
    if (byName.has(item.name)) continue;
    if (!item.visual_identity?.dds_file) continue;
    if (item.name.startsWith('[DNT')) continue;
    byName.set(item.name, item);
  }

  const stackables = [];
  let droppedVaultedCurrency = 0;
  let droppedUselessEssences = 0;

  for (const item of byName.values()) {
    const category = categoryOf(item);
    // Currency is GGG's dumping ground for every league's unique currency
    // since 2013 — the only category that needs cross-checking against
    // what's actually still obtainable (see file header comment).
    if (category === 'Currency' && !currentCurrencyNames.has(item.name)) {
      droppedVaultedCurrency++;
      continue;
    }
    if (
      category === 'Essence' &&
      USELESS_ESSENCE_TIERS.some((tier) => item.name.startsWith(`${tier} `))
    ) {
      droppedUselessEssences++;
      continue;
    }

    stackables.push({
      name: item.name,
      category,
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
  console.log(
    `Dropped ${droppedVaultedCurrency} Currency items not currently tradeable on poe.ninja (${league})`,
  );
  console.log(`Dropped ${droppedUselessEssences} low-tier essences`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
