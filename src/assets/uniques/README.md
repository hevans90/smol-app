- `unique-base-types.json` — unique item name -> base type (e.g. "Headhunter"
  -> "Leather Belt"). Generated from Path of Building's own `Data/Uniques`
  tables — run `pnpm run generate:pob-data` (see
  `scripts/generate-pob-data.sh` and `go-server/pob/extract-data.lua`) to
  regenerate after bumping PoB's version. Consumed by
  `getUniqueItemWikiInfo()` in `src/_utils/utils.ts`.

- `uniques.json` — full unique item list (name, item class, and
  `visual_identity.dds_file` for icon construction via `mapDdsToPoeImageUrl`)
  used for unique-item name search/autocomplete. PoB has no per-item art
  (confirmed directly from its source — see the note in `../bases/README.md`),
  so this older, separately-sourced dataset remains the only source for
  icons here too. Originally pulled from
  https://repoe-fork.github.io/uniques.json — not actively regenerated;
  update by hand if new uniques' icons/search entries are needed.
