// Regenerates src/assets/uniques/unique-base-types.json — the local
// unique-item-name -> base-type map used by getUniqueItemWikiInfo (utils.ts)
// and the get-item-info Netlify function, so unique orders can resolve a
// base type without depending on poewiki.net (which now sits behind Anubis
// bot-protection that blocks this app's requests outright).
//
// Source of truth: Path of Building's own Data/Uniques Lua files — the same
// upstream this app already trusts for headless PoB character stats. Each
// unique item is stored as a `[[ Name \n Base Type \n ...mods ]]` block;
// this script fetches those files straight from GitHub and extracts the
// first two lines of every block.
//
// Run this after bumping POB_VERSION (see go-server/Dockerfile,
// headless-pob/Dockerfile) so new-league uniques get picked up:
//
//   node scripts/generate-unique-base-types.js
//
// Pass a PoB git ref (branch, tag, or commit) to pin the source precisely,
// e.g. to match POB_VERSION exactly instead of always pulling the tip of
// `dev`:
//
//   node scripts/generate-unique-base-types.js v3.27.0

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const REF = process.argv[2] ?? 'dev';
const REPO_RAW_BASE = `https://raw.githubusercontent.com/PathOfBuildingCommunity/PathOfBuilding/${REF}/src/Data/Uniques`;

const OUTPUT_PATH = fileURLToPath(
  new URL('../src/assets/uniques/unique-base-types.json', import.meta.url),
);
const ALL_UNIQUES_PATH = fileURLToPath(
  new URL('../src/assets/uniques/uniques.json', import.meta.url),
);

// Every per-item-class file in Data/Uniques, plus the two Special/ files
// that store real item blocks (as opposed to WatchersEye.lua/
// BoundByDestiny.lua, which are pure mod-lookup tables with no `[[ ]]` item
// blocks at all — harmless to skip since the parser below only extracts
// what it actually finds).
const CLASS_FILES = [
  'amulet', 'axe', 'belt', 'body', 'boots', 'bow', 'claw', 'dagger',
  'fishing', 'flask', 'gloves', 'graft', 'helmet', 'jewel', 'mace',
  'quiver', 'ring', 'shield', 'staff', 'sword', 'tincture', 'wand',
];
const FILE_PATHS = [
  ...CLASS_FILES.map((name) => `${name}.lua`),
  'Special/New.lua', // uniques awaiting final balance, still real items
  'Special/race.lua', // race-league-only items; same block format
  'Special/Generated.lua', // procedurally-varied uniques (Watcher's Eye,
  // Sublime Vision, etc.) — still opens with a normal
  // [[ Name \n Base Type \n ... ]] seed block per item
];

// Lua block comments use the same [[ ... ]] bracket syntax as string
// literals, written as --[[ ... ]] — exclude those so a comment doesn't get
// misparsed as a fake "item" with its first two words as name/base.
const BLOCK_RE = /(?<!--)\[\[([\s\S]*?)\]\]/g;

// Some generated blocks (Generated.lua) prefix the base-type line itself
// with a {variant:N} / {tags:...} marker, e.g. "{variant:1}Sorcerer Gloves"
// — a per-variant annotation glued onto the front of the line, not part of
// the base type name.
const VARIANT_TAG_RE = /^\{[^}]*\}/;

// A well-formed block's first line is a plain item/gem name, never a
// "Key: Value" metadata line or a bare variant tag. Catches fragment blocks
// (seen in Generated.lua, where a single logical item is built from several
// concatenated [[ ]] literals) whose "name" line is actually a stray
// metadata/mod-text line from a fragment boundary.
const METADATA_NAME_RE =
  /^(Implicits|Limited to|Item Class|Selected Variant|Requires|Variant|Sockets|Radius|LevelReq|Quality|Unique ID|Item Level|Talisman Tier|Has Alt Variant|League|Source):/;

// Exact-match-only flag lines for the base-type position — never a prefix
// check for these, since real base-type names can legitimately start with
// the same words (e.g. "Mirrored Spiked Shield").
const METADATA_BASE_EXACT = new Set(['Corrupted', 'Mirrored', 'Unmodifiable']);
const METADATA_BASE_PREFIXES = [
  'League:', 'Source:', 'Implicits:', 'Variant:', 'Selected Variant',
  'Requires', 'Sockets:', 'Radius:', 'LevelReq:', 'Quality:', 'Unique ID:',
  'Item Level:', 'Has no Sockets', 'Talisman Tier:', 'Limited to:',
  'Has Alt Variant',
];

async function fetchLua(path) {
  const url = `${REPO_RAW_BASE}/${path}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

function parseBlocks(fileLabel, content, mapping, skipped) {
  for (const match of content.matchAll(BLOCK_RE)) {
    const lines = match[1]
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) continue;

    const name = lines[0];
    let base = lines[1];

    if (METADATA_NAME_RE.test(name) || name.startsWith('{')) {
      skipped.push({ file: fileLabel, name, base });
      continue;
    }

    base = base.replace(VARIANT_TAG_RE, '');
    if (
      METADATA_BASE_EXACT.has(base) ||
      METADATA_BASE_PREFIXES.some((prefix) => base.startsWith(prefix))
    ) {
      skipped.push({ file: fileLabel, name, base });
      continue;
    }

    // Last block wins (current/latest variant) — PoB lists the currently-
    // live version last within reprint groups sharing a name.
    mapping[name] = base;
  }
}

async function main() {
  console.log(`Fetching Path of Building Uniques data @ ${REF}...`);

  const mapping = {};
  const skipped = [];

  for (const path of FILE_PATHS) {
    const content = await fetchLua(path);
    parseBlocks(path, content, mapping, skipped);
  }

  const sorted = Object.fromEntries(
    Object.entries(mapping).sort(([a], [b]) => a.localeCompare(b)),
  );

  await writeFile(OUTPUT_PATH, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');

  console.log(`Parsed ${Object.keys(sorted).length} unique -> base-type entries.`);
  if (skipped.length > 0) {
    console.log(`Skipped ${skipped.length} blocks with no recognizable base-type line:`);
    for (const s of skipped) {
      console.log(`  [${s.file}] ${JSON.stringify(s.name)} -> ${JSON.stringify(s.base)}`);
    }
  }
  console.log(`Wrote ${OUTPUT_PATH}`);

  // Coverage check against the app's own known-uniques list, so a run after
  // a league bump immediately shows what (if anything) is still missing —
  // expected to always show a handful of unique MAPS (no base-type concept)
  // and any items PoB itself doesn't model as a plain item block.
  try {
    const { default: allUniques } = await import(ALL_UNIQUES_PATH, {
      with: { type: 'json' },
    });
    const names = [...new Set(Object.values(allUniques).map((u) => u.name))];
    const missing = names.filter((n) => !(n in sorted));
    console.log(
      `\nCoverage: ${names.length - missing.length}/${names.length} known uniques mapped.`,
    );
    if (missing.length > 0) {
      console.log(`Missing (${missing.length}):`, missing.join(', '));
    }
  } catch (e) {
    console.warn('Could not run coverage check against uniques.json:', e.message);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
