// One-off backfill for user_item_order.item_base_type — many existing
// unique orders have this blank because they were created while the old
// live poewiki.net lookup was failing (poewiki now sits behind Anubis
// bot-protection; see src/_utils/utils.ts's getUniqueItemWikiInfo comment).
// New orders resolve correctly now via the local PoB-derived
// unique-base-types.json, but existing rows were never re-resolved.
//
// DRY RUN BY DEFAULT — prints what would change, writes nothing. Pass
// --write to actually apply the updates.
//
// Usage (against whichever Hasura the env vars point at — set these to
// PRODUCTION values to heal prod data):
//   HASURA_GRAPHQL_URI=... HASURA_ADMIN_SECRET=... node scripts/backfill-item-base-types.mjs
//   HASURA_GRAPHQL_URI=... HASURA_ADMIN_SECRET=... node scripts/backfill-item-base-types.mjs --write

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const WRITE = process.argv.includes('--write');

const UNIQUE_BASE_TYPES_PATH = fileURLToPath(
  new URL('../src/assets/uniques/unique-base-types.json', import.meta.url),
);

// Mirrors src/_utils/stash-matching.ts's deriveUniqueNameCandidate — the
// unique's real name lives in the poewiki link_url's trailing path segment,
// falling back to the free-typed description.
function deriveUniqueNameCandidate(order) {
  if (order.link_url?.includes('poewiki.net/wiki/')) {
    const slug = order.link_url.split('/').pop();
    if (slug) return decodeURIComponent(slug).replace(/_/g, ' ').trim();
  }
  return (order.description ?? '').trim();
}

// Mirrors src/_utils/utils.ts's stripFoulbornPrefix.
function stripFoulbornPrefix(name) {
  return name.replace(/^Foulborn\s+/i, '');
}

async function hasuraRequest(query, variables) {
  const hasuraURL = `http${process.env.HASURA_GRAPHQL_URI?.includes('localhost') ? '' : 's'}://${process.env.HASURA_GRAPHQL_URI}`;
  const res = await fetch(hasuraURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error(`Hasura error: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

async function main() {
  if (!process.env.HASURA_GRAPHQL_URI || !process.env.HASURA_ADMIN_SECRET) {
    throw new Error('Set HASURA_GRAPHQL_URI and HASURA_ADMIN_SECRET (point these at prod to heal prod data).');
  }

  const uniqueBaseTypesByName = JSON.parse(await readFile(UNIQUE_BASE_TYPES_PATH, 'utf-8'));

  console.log(`Querying ${process.env.HASURA_GRAPHQL_URI} for unique orders with a blank item_base_type...`);
  const data = await hasuraRequest(`
    query BlankBaseTypeOrders {
      user_item_order(where: {type: {_eq: unique}, _or: [{item_base_type: {_is_null: true}}, {item_base_type: {_eq: ""}}]}) {
        id
        description
        link_url
        item_base_type
      }
    }
  `);

  const orders = data.user_item_order;
  console.log(`Found ${orders.length} unique order(s) with a blank item_base_type.\n`);

  const resolved = [];
  const unresolved = [];
  for (const order of orders) {
    const name = stripFoulbornPrefix(deriveUniqueNameCandidate(order));
    const baseType = uniqueBaseTypesByName[name];
    if (baseType) {
      resolved.push({ id: order.id, name, baseType });
    } else {
      unresolved.push({ id: order.id, name });
    }
  }

  console.log(`Resolvable: ${resolved.length}`);
  console.log(`Unresolvable (name not found in unique-base-types.json — will be left blank): ${unresolved.length}`);
  if (unresolved.length > 0) {
    const uniqueNames = [...new Set(unresolved.map((o) => o.name))];
    console.log(`  Unresolved names (${uniqueNames.length} distinct): ${uniqueNames.slice(0, 20).join(', ')}${uniqueNames.length > 20 ? ', ...' : ''}`);
  }

  console.log(`\nSample of resolved updates:`);
  for (const { id, name, baseType } of resolved.slice(0, 15)) {
    console.log(`  ${id}  "${name}" -> "${baseType}"`);
  }
  if (resolved.length > 15) console.log(`  ... and ${resolved.length - 15} more`);

  if (!WRITE) {
    console.log(`\nDry run only — no writes performed. Re-run with --write to apply ${resolved.length} update(s).`);
    return;
  }

  console.log(`\nWriting ${resolved.length} update(s)...`);
  let done = 0;
  for (const { id, baseType } of resolved) {
    await hasuraRequest(
      `mutation SetItemBaseType($id: uuid!, $itemBaseType: String!) {
        update_user_item_order_by_pk(pk_columns: {id: $id}, _set: {item_base_type: $itemBaseType}) {
          id
        }
      }`,
      { id, itemBaseType: baseType },
    );
    done++;
    if (done % 25 === 0) console.log(`  ${done}/${resolved.length}...`);
  }
  console.log(`Done. Updated ${done} order(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
