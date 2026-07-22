- `pob-item-bases.json` — primary source for base-type data (categories,
  sockets, requirements, weapon/armour stats, influence compatibility).
  Generated from Path of Building's own `Data/Bases` tables — run
  `pnpm run generate:pob-data` (see `scripts/generate-pob-data.sh` and
  `go-server/pob/extract-data.lua`) to regenerate after bumping PoB's
  version. Consumed by `getSortedBaseItems()` in `src/_utils/utils.ts`.

- `all-basetypes.json` — kept only as an icon lookup (`Name` -> `IconPath`).
  PoB has no per-base-type equipment art at all (confirmed directly from
  its source: `ItemSlotControl.lua`'s `Draw()` renders equipped items as
  coloured text, never an icon), so this older, separately-sourced dataset
  remains the only source for icons. Originally pulled from
  https://poedb.tw/us/api/BaseItemTypes — not actively regenerated; update
  by hand if base-type icons ever need refreshing.
