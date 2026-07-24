// Scrapes external gem metadata poedb has no equivalent for, and writes:
//   - src/assets/gems/gem-icons.json — gemName -> icon URL
//   - src/assets/gems/gem-details.json — gemName -> { cost info, quality
//     bonus text, instant cast flag }
//
// Icons are merged from two sources, in priority order:
//
// 1. poegems.com's own JSON data dump (`https://poegems.com/json`) — a
//    community build-planner site whose icon URLs point straight at GGG's
//    own official CDN (web.poecdn.com), and — critically — actually carries
//    DISTINCT art per transfigured gem variant. Verified: of the 213
//    transfigured entries poegems links to a `baseGem`, 207 have an icon
//    file different from their base gem's. poedb.tw (the fallback source
//    below) does NOT have this: it reuses the base gem's icon file for
//    every transfigured variant, even on that variant's own dedicated page
//    (confirmed via that page's own <og:image> tag) — poedb genuinely has
//    no per-variant art cataloged, this isn't a scraping gap on our end.
//    See src/assets/gems/README.md for the full story.
//
// 2. poedb.tw's "Active Skill Gems"/"Support Gems" list pages — used only
//    as a fallback for names poegems.com doesn't carry at all (mostly
//    Awakened support gems, plus a handful of others poegems just omits).
//
// gem-details.json comes from poegems.com only — poedb's list pages don't
// carry level requirement/cost/quality-bonus text at all, so there's no
// fallback for names poegems.com is missing (same ones the icon scrape
// falls back to poedb for end up with no gem-details.json entry either;
// a gem with no details just renders its popover without that section,
// same degradation as a missing icon already has).
//
// Why none of this is sourced from PoB (unlike gems.json itself): PoB has
// no icon art, cost, level requirement, or quality-bonus text for gems at
// all — confirmed directly this session (PoB renders gems as plain
// coloured text in its own UI, ItemSlotControl.lua's Draw()) — so, like
// uniques.json/all-basetypes.json, this needs a separate, one-off external
// pull rather than the Docker/PoB pipeline.
//
// Every scraped name (from either source) is verified against this app's
// own PoB-derived gems.json before being kept (a scraped name that doesn't
// match — after normalizing apostrophes/diacritics and the known PoB-vs-
// poedb "Support" suffix difference — is dropped rather than risk a
// wrong/orphaned entry). Not "actively regenerated" — like the other
// scrape script (scrape-foulborn-mods.mjs), run by hand if either site's
// data changes.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const POEGEMS_JSON_URL = 'https://poegems.com/json';
const POEDB_PAGES = [
  'https://poedb.tw/us/Skill_Gems',
  'https://poedb.tw/us/Support_Gems',
];
const POECDN_GEN_IMAGE_PREFIX = 'https://web.poecdn.com/gen/image/';

const GEMS_PATH = fileURLToPath(new URL('../src/assets/gems/gems.json', import.meta.url));
const ICONS_OUTPUT_PATH = fileURLToPath(
  new URL('../src/assets/gems/gem-icons.json', import.meta.url),
);
const DETAILS_OUTPUT_PATH = fileURLToPath(
  new URL('../src/assets/gems/gem-details.json', import.meta.url),
);

// poegems' costType codes, mapped to the resource name the real in-game
// tooltip uses (confirmed against go-server/pob/testdata/items.json's real
// gem fixtures, e.g. "Cost: 9 Mana").
const COST_RESOURCE_NAMES = {
  m: 'Mana',
  mps: 'Mana per second',
  l: 'Life',
  es: 'Energy Shield',
};

// A handful of gem names carry a diacritic or apostrophe on the scraped
// site that PoB's own data doesn't, or vice versa (same "Maelström" vs
// "Maelstrom" mismatch found earlier this session for a unique's base
// type; poegems also just drops apostrophes entirely, e.g. PoB's
// "Alchemist's Mark" scrapes as "Alchemists Mark") — fold both sides
// before comparing, not just the scraped name, since the apostrophe can
// be missing from either one.
const foldDiacritics = (str) => str.normalize('NFD').replace(/[̀-ͯ]/g, '');
const normalizeKey = (str) => foldDiacritics(str).replace(/['’]/g, '').toLowerCase();

// PoB's own gem.name omits the " Support" suffix support gems otherwise
// display with in-game (confirmed: PoB has "Melee Physical Damage", both
// scraped sites show "Melee Physical Damage Support") — try both
// directions before giving up on a match.
function buildGemNameIndex(gems) {
  const index = new Map();
  for (const name of Object.keys(gems)) {
    index.set(normalizeKey(name), name);
  }
  return index;
}

function resolveGemName(scrapedName, gemNameIndex) {
  const normalized = normalizeKey(scrapedName);
  for (const candidate of [
    normalized,
    normalized.endsWith(' support')
      ? normalized.slice(0, -' support'.length)
      : `${normalized} support`,
  ]) {
    const hit = gemNameIndex.get(candidate);
    if (hit) return hit;
  }
  return null;
}

async function fetchPoegemsEntries() {
  console.log(`Fetching ${POEGEMS_JSON_URL}...`);
  const res = await fetch(POEGEMS_JSON_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; smol-app data scrape)' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${POEGEMS_JSON_URL}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

function iconsFromPoegemsEntries(entries) {
  const icons = {};
  for (const entry of entries) {
    if (!entry.name || !entry.src) continue;
    icons[entry.name] = entry.src.startsWith('http')
      ? entry.src
      : `${POECDN_GEN_IMAGE_PREFIX}${entry.src}`;
  }
  return icons;
}

// Only the gem-type-level facts (invariant across any specific instance's
// level/quality) — never a specific current level/quality, since an order
// preview has no particular instance to describe. `cost` is already
// type-level (the resource cost's full range across the gem's level
// span), so it can be shown plainly; `quality`'s text is the bonus
// *effect* description (what quality does), not a claim about the order's
// actual quality roll. NOTE: poegems' own `level` field (character level
// requirement) is deliberately NOT read here anymore — gems.json's
// levelReqMin/Max (go-server/pob/extract-data.lua) supersedes it with a
// full, PoB-computed range instead of this single reference value.
function detailsFromPoegemsEntry(entry) {
  const details = {};

  if (entry.costType && COST_RESOURCE_NAMES[entry.costType] && entry.cost) {
    details.costResource = COST_RESOURCE_NAMES[entry.costType];
    details.costRange = entry.cost;
  } else if (!entry.costType && entry.cost) {
    // Support gems carry their Cost & Reservation Multiplier here instead of
    // a resource type (e.g. "110%") — confirmed against the real fixture's
    // own "Cost & Reservation Multiplier" property.
    details.costMultiplier = entry.cost;
  }

  if (entry.quality?.su) details.qualityText = entry.quality.su;
  if (entry.instant) details.instant = true;

  return details;
}

function parseIconsFromPoedbPage(html) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const icons = {};

  for (const row of doc.querySelectorAll('tr[data-filters]')) {
    // Each row has two <a> tags — one wraps just the icon <img> (empty
    // text), the other wraps the gem name text — so pick the one with
    // real text, not just the first <a> in document order.
    const img = row.querySelector('img');
    const link = [...row.querySelectorAll('a')].find((a) => a.textContent.trim());
    if (!img?.src || !link) continue;
    const name = link.textContent.trim();
    if (!name) continue;
    icons[name] = img.src;
  }

  return icons;
}

async function fetchPoedbIcons() {
  const scraped = {};
  for (const url of POEDB_PAGES) {
    console.log(`Fetching ${url}...`);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; smol-app data scrape)' },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
    }
    const html = await res.text();
    Object.assign(scraped, parseIconsFromPoedbPage(html));
  }
  return scraped;
}

async function main() {
  const gems = JSON.parse(await readFile(GEMS_PATH, 'utf-8'));
  const gemNameIndex = buildGemNameIndex(gems);

  const [poegemsEntries, poedbIconsRaw] = await Promise.all([
    fetchPoegemsEntries(),
    fetchPoedbIcons(),
  ]);
  const poegemsIconsRaw = iconsFromPoegemsEntries(poegemsEntries);
  console.log(`Scraped ${poegemsEntries.length} gem entries from poegems.com.`);
  console.log(`Scraped ${Object.keys(poedbIconsRaw).length} name -> icon pairs from poedb.tw.`);

  const verifiedIcons = {};
  const verifiedDetails = {};
  const unmatched = [];
  let fromPoegems = 0;
  let fromPoedbFallback = 0;

  // poegems.com is preferred everywhere it has a match — it's the only
  // source with real per-variant icon art for transfigured gems, and the
  // only source of level/cost/quality-bonus text at all.
  for (const entry of poegemsEntries) {
    if (!entry.name) continue;
    const gemName = resolveGemName(entry.name, gemNameIndex);
    if (!gemName) {
      if (entry.src) unmatched.push(entry.name);
      continue;
    }
    if (poegemsIconsRaw[entry.name]) {
      verifiedIcons[gemName] = poegemsIconsRaw[entry.name];
      fromPoegems++;
    }
    const details = detailsFromPoegemsEntry(entry);
    if (Object.keys(details).length > 0) verifiedDetails[gemName] = details;
  }

  // poedb fills in icons for names poegems.com didn't carry at all (it has
  // no equivalent data source for gem-details.json).
  for (const [scrapedName, icon] of Object.entries(poedbIconsRaw)) {
    const gemName = resolveGemName(scrapedName, gemNameIndex);
    if (!gemName) {
      unmatched.push(scrapedName);
      continue;
    }
    if (!verifiedIcons[gemName]) {
      verifiedIcons[gemName] = icon;
      fromPoedbFallback++;
    }
  }

  const sortEntries = (obj) =>
    Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));

  await writeFile(
    ICONS_OUTPUT_PATH,
    JSON.stringify(sortEntries(verifiedIcons), null, 2) + '\n',
    'utf-8',
  );
  await writeFile(
    DETAILS_OUTPUT_PATH,
    JSON.stringify(sortEntries(verifiedDetails), null, 2) + '\n',
    'utf-8',
  );

  const totalGems = Object.keys(gems).length;
  console.log(
    `Wrote ${Object.keys(verifiedIcons).length}/${totalGems} gem icons to ${ICONS_OUTPUT_PATH} ` +
      `(${fromPoegems} from poegems.com, ${fromPoedbFallback} from poedb.tw fallback).`,
  );
  console.log(
    `Wrote ${Object.keys(verifiedDetails).length}/${totalGems} gem detail entries to ${DETAILS_OUTPUT_PATH}.`,
  );
  if (unmatched.length > 0) {
    const distinctUnmatched = [...new Set(unmatched)];
    console.log(
      `${distinctUnmatched.length} scraped name(s) had no match in gems.json (dropped): ` +
        `${distinctUnmatched.slice(0, 20).join(', ')}${distinctUnmatched.length > 20 ? ', ...' : ''}`,
    );
  }
  const missingIcons = Object.keys(gems).filter((name) => !verifiedIcons[name]);
  if (missingIcons.length > 0) {
    console.log(
      `${missingIcons.length} gem(s) in gems.json got no icon: ` +
        `${missingIcons.slice(0, 20).join(', ')}${missingIcons.length > 20 ? ', ...' : ''}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
