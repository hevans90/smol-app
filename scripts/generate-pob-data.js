// Post-processes the combined JSON dump from go-server/pob/extract-data.lua
// (run via generate-pob-data.sh) into the app's actual data assets.
//
// Not meant to be run directly — see generate-pob-data.sh.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const UNIQUE_BASE_TYPES_PATH = fileURLToPath(
  new URL('../src/assets/uniques/unique-base-types.json', import.meta.url),
);
const POB_ITEM_BASES_PATH = fileURLToPath(
  new URL('../src/assets/bases/pob-item-bases.json', import.meta.url),
);

async function main() {
  const dumpPath = process.argv[2];
  if (!dumpPath) {
    throw new Error('Usage: node generate-pob-data.js <path to extract-data.lua JSON output>');
  }

  const raw = JSON.parse(await readFile(dumpPath, 'utf-8'));
  if (raw.error) {
    throw new Error(`extract-data.lua reported an error: ${raw.error}`);
  }

  const sortedUniqueBaseTypes = Object.fromEntries(
    Object.entries(raw.uniqueBaseTypes).sort(([a], [b]) => a.localeCompare(b)),
  );
  await writeFile(
    UNIQUE_BASE_TYPES_PATH,
    JSON.stringify(sortedUniqueBaseTypes, null, 2) + '\n',
    'utf-8',
  );
  console.log(
    `Wrote ${Object.keys(sortedUniqueBaseTypes).length} unique -> base-type entries to ${UNIQUE_BASE_TYPES_PATH}`,
  );

  // Raw PoB base-type data — src/_utils/utils.ts's getSortedBaseItems()
  // consumes this directly (see POB_TYPE_TO_CATEGORY / getCategory there for
  // the mapping from PoB's own `type`+`tags` to this app's BaseTypeCategory,
  // and isExcluded() for which bases get dropped, e.g. Grafts).
  const sortedItemBases = Object.fromEntries(
    Object.entries(raw.itemBases).sort(([a], [b]) => a.localeCompare(b)),
  );
  await writeFile(
    POB_ITEM_BASES_PATH,
    JSON.stringify(sortedItemBases, null, 2) + '\n',
    'utf-8',
  );
  console.log(
    `Wrote ${Object.keys(sortedItemBases).length} item bases to ${POB_ITEM_BASES_PATH}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
