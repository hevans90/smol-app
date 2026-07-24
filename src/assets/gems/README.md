- `gems.json` — every gem (regular, Vaal, and transfigured "X of Y" variants)
  keyed by name: `gameId`/`variantId` (variant linkage), `tagString`/`tags`,
  `naturalMaxLevel`, `vaal` flag, `transfigured` flag + `baseGemName` (the
  gem it transfigures), `description` (+ `secondaryDescription` for Vaal
  gems), `explicitMods`, and `levelReqMin`/`levelReqMax`/`reqStrMin`-
  `reqIntMax`. Generated from Path of Building's own `data.gemsByGameId` —
  run `pnpm run generate:pob-data` (see `scripts/generate-pob-data.sh` and
  `go-server/pob/extract-data.lua`) to regenerate after bumping PoB's
  version.

  `description`/`secondaryDescription` are `grantedEffect.description` /
  `secondaryGrantedEffect.description` off each raw gem record — plain,
  ready-to-show English (confirmed by direct inspection to match the real
  game's own secDescrText, e.g. Faster Casting Support's `description` here
  is exactly "Supports non-instant spell skills."). `secondaryDescription`
  is set only on Vaal gems, for the non-Vaal effect they also grant while
  socketed but not yet used (e.g. Vaal Discipline's `secondaryDescription`
  is plain Discipline's aura text).

  `explicitMods` (the real "Supported Skills deal (20-34)% more Burning
  Damage" style stat lines) and `levelReqMin`/`levelReqMax`/`reqStrMin`-
  `reqIntMax` (the real character-level/attribute requirement to socket the
  gem, which — like the stat lines — scales as the gem itself levels from 1
  to its natural max) are **computed**, not a flat data read: PoB's calc
  engine (`calcLib.buildSkillInstanceStats`) plus its stat-translation
  engine (`data.describeStats`) — the same two calls `Classes/
  GemSelectControl.lua`'s own `AddGemTooltip` uses for its live gem-picker
  tooltip — turn out to need only a trivial `{level, quality}` table, not a
  full build/character/socket-group context (verified by reading
  `buildSkillInstanceStats`'s own definition — the extra machinery in
  `GemSelectControl.lua` is UI wiring, not a real requirement of the calc
  itself). `extract-data.lua`'s `computeExplicitMods` calls it at the gem's
  own min/max level (quality fixed at 0 — the quality bonus's own text
  comes from `gem-details.json` instead; `data.describeStats` was found to
  silently return no lines whenever a value range's `min` is exactly 0,
  which the quality-alone delta always is at 1% quality for half-point-
  per-quality stats, verified by direct experimentation), merges the two
  into `{min, max}` ranges, and translates them. `computeRequirementRange`
  does the same for the requirement, via `calcLib.getGemStatRequirement`
  (also mirrored in `GemSelectControl.lua`) fed `reqStr`/`reqDex`/`reqInt`
  as its "multi" input — **note those three raw fields are NOT the
  displayed requirement themselves**, just that formula's input; the real
  numbers are `reqStrMin`/`reqStrMax` etc. Both were spot-checked against
  known real-game values and matched exactly (Burning Damage Support:
  "(20-34)% more Burning Damage" at level 1-20; "(31-70), (33-70) Str,
  (23-48) Int"). `explicitMods` coverage: 838/858 (the rest are utility
  gems with no scaling stat worth describing). Consumed by
  `searchGemsByName()`/`buildOrderItemPreview()` in `src/_utils/utils.ts`.

- `gem-icons.json` — gem name -> icon URL. **Not sourced from PoB** (no gem
  art exists there at all — PoB renders gems as plain coloured text in its
  own UI, confirmed by reading `ItemSlotControl.lua`'s `Draw()`), scraped by
  `scripts/scrape-gem-metadata.mjs` from two sources merged in priority order:
  1. **poegems.com's own `/json` data dump** — a community build-planner
     site whose icon URLs point straight at GGG's official CDN
     (`web.poecdn.com`). Preferred everywhere it has a match because it
     actually carries **distinct art per transfigured gem variant**
     (verified: 207/213 transfigured entries it links to a base gem have an
     icon file different from that base gem's — e.g. "Ice Nova", "Ice Nova
     of Deep Freeze", and "Ice Nova of Frostbolts" are three genuinely
     different images).
  2. **poedb.tw's "Active Skill Gems"/"Support Gems" list pages** (the
     original/only source before this was discovered) — used only as a
     fallback for names poegems.com doesn't carry at all. poedb was found
     to have **no distinct art for transfigured gems at all**: it reuses
     the base gem's icon file for every transfigured variant, even on that
     variant's own dedicated page (confirmed via that page's own
     `<og:image>` tag) — a real gap in poedb's own catalog, not a scraping
     artifact on our end.

  Every scraped name (from either source) is verified against `gems.json`
  before being kept (folding diacritic and apostrophe differences on either
  side — e.g. poegems drops apostrophes entirely, "Alchemist's Mark" scrapes
  as "Alchemists Mark" — and the known PoB-vs-scraped-site naming
  difference where PoB omits the " Support" suffix support gems display
  in-game). On-disk coverage isn't 100% (~94% at last run, logged when the
  script runs — mostly Vaal transfigured gem variants and a few newer-league
  gems neither source's list pages carry, or that are genuinely absent from
  this pinned PoB version's own data).

  `searchGemsByName()`'s `gemList` (`src/_utils/utils.ts`) applies one
  runtime fallback on top of this file: a Vaal **transfigured** gem missing
  its own entry (e.g. "Vaal Absolution of Inspiring" — none of these ~48
  have a distinct icon in either scrape source) falls back to its base Vaal
  gem's icon via `baseGemName` (e.g. "Vaal Absolution") — the gem's art
  doesn't change on transfiguration, only its stats, same reasoning poedb
  itself already relies on for ordinary (non-Vaal) transfigured gems. A gem
  with no icon even after that fallback just renders without one, same
  degradation as an unmatched base type already has. Not actively
  regenerated — run by hand (`node scripts/scrape-gem-metadata.mjs`) if
  either site's data changes.

- `gem-details.json` — gem name -> `{ costResource?, costRange?,
  costMultiplier?, qualityText?, instant? }`. **poegems.com only** — poedb's
  list pages have no equivalent data, so there's no fallback for names
  poegems.com is missing (same ~92 names the icon scrape falls back to
  poedb for get no `gem-details.json` entry either). Every field here is
  **gem-type-level and instance-invariant** — the resource cost's full
  range across the gem's level span (or a support gem's Cost & Reservation
  Multiplier), and the quality bonus's *effect description* (what quality
  does, not a claim about any specific order's actual quality roll) — never
  a specific instance's current level/quality/cast time, since an order
  preview has no particular instance to describe. (This file used to also
  carry a single-value `levelReq` — retired once `gems.json`'s PoB-computed
  `levelReqMin`/`levelReqMax` superseded it with the real full range
  instead of one reference point.) Consumed by `buildOrderItemPreview()`'s
  gem branch in `src/_utils/utils.ts` to round out the popover with the
  Cost property and quality-bonus line the character sheet's item tooltip
  shows for real gems. Coverage: 766/858 at last run. Not actively
  regenerated — run by hand (`node scripts/scrape-gem-metadata.mjs`) if
  poegems.com's data changes.
