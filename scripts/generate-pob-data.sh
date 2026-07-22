#!/usr/bin/env bash
# Regenerates static PoE item data from Path of Building's own runtime data —
# no network dependency beyond building the headless-pob image itself (which
# clones a PINNED PoB release, see headless-pob/Dockerfile's POB_VERSION), so
# this data can never drift from whatever PoB version the go-server actually
# uses for character stat computation.
#
# Currently regenerates:
#   - src/assets/uniques/unique-base-types.json (unique item name -> base type)
#   - src/assets/bases/pob-item-bases.json (PoB's raw base-type data — sockets,
#     tags, requirements, weapon/armour stats, influence compatibility — see
#     getSortedBaseItems in src/_utils/utils.ts for how the app consumes it)
#   - public/item-preview/influences/*-symbol.png (influence badge icons —
#     PoB bundles these itself for its own tooltip rendering; this is the
#     canonical source, not the third-party repo they were first sourced
#     from). PoB has no per-base-type equipment art at all (confirmed by
#     reading ItemSlotControl.lua's Draw() — it renders items as coloured
#     text, never an icon), so base-type icons are deliberately left as they
#     are, cross-referenced from all-basetypes.json.
#
# Usage:
#   ./scripts/generate-pob-data.sh              # rebuild image, run against it
#   ./scripts/generate-pob-data.sh --no-build   # reuse the existing image
#
# Run this after bumping POB_VERSION (go-server/Dockerfile,
# headless-pob/Dockerfile) so new-league items get picked up.

set -euo pipefail
cd "$(dirname "$0")/.."

if [[ "${1:-}" != "--no-build" ]]; then
  echo "Building headless-pob image..."
  docker build -f headless-pob/Dockerfile -t headless-pob .
fi

TMP_JSON="$(mktemp)"
CONTAINER="$(docker create headless-pob)"
trap 'rm -f "$TMP_JSON"; docker rm "$CONTAINER" > /dev/null' EXIT

echo "Running extract-data.lua against headless-pob..."
docker run --rm \
  -v "$(pwd)/go-server/pob/extract-data.lua:/app/src/extract-data.lua:ro" \
  --entrypoint luajit \
  headless-pob extract-data.lua > "$TMP_JSON"

node scripts/generate-pob-data.js "$TMP_JSON"

echo "Extracting influence icons from headless-pob..."
# Plain pobName:appName pairs, not an associative array — macOS ships bash
# 3.2 by default (no `declare -A` support), and this list is small/fixed
# enough that a loop over pairs is no less readable anyway.
INFLUENCE_ICONS="
shapericon:shaper
eldericon:elder
crusadericon:crusader
huntericon:hunter
redeemericon:redeemer
warlordicon:warlord
exarchicon:searing
eatericon:tangled
"
# exarchicon -> searing (Searing Exarch) and eatericon -> tangled (Eater of
# Worlds) use GGG's own (unrelated-looking) API field names — see
# src/models/ggg-responses.ts's INFLUENCE_ORDER comment.
count=0
for pair in $INFLUENCE_ICONS; do
  pobName="${pair%%:*}"
  appName="${pair##*:}"
  docker cp "$CONTAINER:/app/src/Assets/${pobName}.png" \
    "public/item-preview/influences/${appName}-symbol.png"
  count=$((count + 1))
done
echo "Wrote $count influence icons to public/item-preview/influences/"
