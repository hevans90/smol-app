// Scrapes poedb.tw/us/Foulborn for the deterministic original-mod ->
// Foulborn-replacement-mod correlation, and writes
// src/assets/uniques/unique-foulborn-mods.json.
//
// Why this isn't sourced from PoB (unlike every other uniques.json/etc.
// asset in this app): PoB's own Data/ModFoulborn.lua has no field
// correlating a specific original mod with its specific replacement — the
// closest signal (each mod's `group` field) only reveals which mods share
// a replacement SLOT, not which of the unique's OWN mod lines that slot
// actually replaces, and some groups have multiple candidate values with
// no way to tell which is current vs. a stale variant (verified directly
// against the running headless-pob container — see go-server/pob's
// extract-data.lua history). poedb.tw's page pairs each original mod
// directly with its one deterministic replacement, which is the actual
// in-game mechanic (confirmed: e.g. Quill Rain's "(50-100)% increased
// Projectile Speed" always becomes "(40-60)% increased Area of Effect").
//
// Every scraped pair is verified against this app's own PoB-derived
// unique-item-previews.json before being kept — a pair whose original
// mod text doesn't exactly match one of that unique's real current mods
// (usually because poedb's own page wraps a long mod across a <br>, or is
// showing a stale reprint's value) is dropped rather than risk showing a
// wrong "replaces X" claim. Not "actively regenerated" — like
// uniques.json/all-basetypes.json, run by hand (`node
// scripts/scrape-foulborn-mods.mjs`) if poedb's data changes.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const FOULBORN_URL = 'https://poedb.tw/us/Foulborn';
const UNIQUE_ITEM_PREVIEWS_PATH = fileURLToPath(
  new URL('../src/assets/uniques/unique-item-previews.json', import.meta.url),
);
const OUTPUT_PATH = fileURLToPath(
  new URL('../src/assets/uniques/unique-foulborn-mods.json', import.meta.url),
);

const normalize = (text) =>
  text
    .replace(/—|–/g, '-') // em/en dash used for ranges -> plain hyphen
    .replace(/\s+/g, ' ')
    .trim();

// .explicitMod sometimes holds MULTIPLE original lines (separated by
// <br>) that together map to ONE replacement — turn each <br> into a real
// newline before flattening to text, so lines don't run together.
const textWithLineBreaks = (el) => {
  const clone = el.cloneNode(true);
  for (const br of clone.querySelectorAll('br')) {
    br.replaceWith(clone.ownerDocument.createTextNode('\n'));
  }
  return clone.textContent;
};

function parsePairsByItem(html) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const pairsByItem = {};

  for (const col of doc.querySelectorAll('.col')) {
    const itemLink = col.querySelector('.flex-grow-1 a.UniqueItems');
    const explicitModEl = col.querySelector('.explicitMod');
    const mutatedModEl = col.querySelector('.mutatedMod');
    if (!itemLink || !explicitModEl || !mutatedModEl) continue;

    const itemName = normalize(itemLink.textContent);
    const original = textWithLineBreaks(explicitModEl)
      .split('\n')
      .map(normalize)
      .filter(Boolean);

    // mutatedMod sometimes wraps a keystone-style name + a parenthetical
    // description in a nested .item_description span - keep both.
    const nameEl = mutatedModEl.querySelector(':scope > div:first-child');
    const descEl = mutatedModEl.querySelector('.item_description');
    const replacement = descEl
      ? `${normalize(nameEl.textContent)} ${normalize(descEl.textContent)}`
      : normalize(mutatedModEl.textContent);

    if (!itemName || original.length === 0 || !replacement) continue;
    (pairsByItem[itemName] ??= []).push({ original, replacement });
  }

  return pairsByItem;
}

async function main() {
  console.log(`Fetching ${FOULBORN_URL}...`);
  const res = await fetch(FOULBORN_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; smol-app data scrape)' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${FOULBORN_URL}: ${res.status} ${res.statusText}`);
  }
  const html = await res.text();

  const scraped = parsePairsByItem(html);
  console.log(`Parsed ${Object.keys(scraped).length} items from poedb.`);

  const previews = JSON.parse(await readFile(UNIQUE_ITEM_PREVIEWS_PATH, 'utf-8'));

  const verified = {};
  let droppedPairs = 0;
  for (const [name, pairs] of Object.entries(scraped)) {
    const preview = previews[name];
    if (!preview) {
      droppedPairs += pairs.length;
      continue;
    }
    const ownMods = new Set([...preview.implicitMods, ...preview.explicitMods]);
    const keptPairs = pairs.filter((pair) => pair.original.every((line) => ownMods.has(line)));
    droppedPairs += pairs.length - keptPairs.length;
    if (keptPairs.length > 0) {
      verified[name] = keptPairs
        .map((pair) => ({ original: pair.original, replacement: pair.replacement }))
        .sort((a, b) => a.original[0].localeCompare(b.original[0]));
    }
  }

  const sorted = Object.fromEntries(
    Object.entries(verified).sort(([a], [b]) => a.localeCompare(b)),
  );

  await writeFile(OUTPUT_PATH, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');
  console.log(
    `Wrote ${Object.keys(sorted).length} Foulborn-eligible uniques to ${OUTPUT_PATH} ` +
      `(dropped ${droppedPairs} unverifiable pair(s) — usually poedb line-wrap artifacts ` +
      `or stale reprint values; see this file's header comment).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
