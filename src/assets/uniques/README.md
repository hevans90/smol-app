- `unique-base-types.json` — unique item name -> base type (e.g. "Headhunter"
  -> "Leather Belt"). Generated from Path of Building's own `Data/Uniques`
  tables — run `pnpm run generate:pob-data` (see
  `scripts/generate-pob-data.sh` and `go-server/pob/extract-data.lua`) to
  regenerate after bumping PoB's version. Consumed by
  `getUniqueItemWikiInfo()` in `src/_utils/utils.ts`.

- `unique-item-previews.json` — unique item name -> base type + implicit/
  explicit mod text + corrupted flag + `levelReq`/`strReq`/`dexReq`/`intReq`
  (only present when the unique's own requirement differs from its base
  type's — e.g. Oriath's End needs level 56 despite its base (Bismuth
  Flask) only needing 8; The Will of Uul-Netol needs level 42 vs. its base
  (Organic Ring)'s 32). Parsed from PoB's raw data, which expresses this
  two different ways depending on the unique — both needed handling, they
  aren't interchangeable: a plain `LevelReq: N` line, or a `Requires Level
  N[, X Str][, Y Dex][, Z Int]` line (sometimes `Requires Level: N` with a
  colon; sometimes attributes with no level at all, e.g. `Requires 8 Str, 8
  Dex`) — both of which the base-type-name/mod-text parsing above used to
  just skip as metadata entirely. Coverage: 746/1304 uniques have a level
  override, 215/194/241 have a str/dex/int override respectively. Falls
  back to the base type's own `req` (`pob-item-bases.json`) when absent.
  Same source/regeneration as `unique-base-types.json` above. Consumed by
  `buildOrderItemPreview()` in `src/_utils/utils.ts` to build the app-wide
  order-preview popover.

- `unique-foulborn-mods.json` — unique item name -> its deterministic
  original-mod -> Foulborn-replacement pairs (3.27+: a real Foulborn item
  has one or two of its normal mods swapped for a FIXED replacement — which
  mod(s) get swapped is random, but what a given mod becomes is not, e.g.
  Quill Rain's "(50-100)% increased Projectile Speed" always becomes
  "(40-60)% increased Area of Effect"). **Not sourced from PoB** — verified
  directly against a running headless-pob container that PoB's own
  `Data/ModFoulborn.lua` has no field correlating an original mod with its
  replacement (the closest signal, each mod's `group`, only reveals which
  mods share a replacement slot). Scraped from poedb.tw/us/Foulborn instead
  by `scripts/scrape-foulborn-mods.mjs`, which verifies every pair against
  this app's own `unique-item-previews.json` before keeping it (dropping
  poedb line-wrap artifacts or stale-reprint mismatches rather than risk a
  wrong "replaces X" claim) — run by hand (`node
  scripts/scrape-foulborn-mods.mjs`), not part of `generate:pob-data`, and
  not actively regenerated; rerun if poedb's page changes. Consumed by
  `buildOrderItemPreview()` in `src/_utils/utils.ts`, which annotates each
  matching mod line in place (e.g. "... Projectile Speed → Foulborn: ...
  Area of Effect") on "Foulborn X" orders.

- `uniques.json` — full unique item list (name, item class, and
  `visual_identity.dds_file` for icon construction via `mapDdsToPoeImageUrl`)
  used for unique-item name search/autocomplete. PoB has no per-item art
  (confirmed directly from its source — see the note in `../bases/README.md`),
  so this older, separately-sourced dataset remains the only source for
  icons here too. Originally pulled from
  https://repoe-fork.github.io/uniques.json — not actively regenerated;
  update by hand if new uniques' icons/search entries are needed.
