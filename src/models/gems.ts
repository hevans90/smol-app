// Shape of src/assets/gems/gems.json (see go-server/pob/extract-data.lua) —
// PoB's runtime data.gemsByGameId, one record per gem (regular, Vaal, and
// transfigured "X of Y" variants). No icon or cost text exists in PoB for
// gems in readable form — see src/assets/gems/gem-icons.json and
// src/assets/gems/gem-details.json (scripts/scrape-gem-metadata.mjs) for
// those, sourced separately and verified against this asset.
//
// `description`/`secondaryDescription`/`explicitMods`/`levelReqMin`-
// `reqIntMax` ARE all straight from PoB though: `description` is a direct
// field read (grantedEffect.description, confirmed to match the real
// game's secDescrText). The rest are computed — PoB's calc engine
// (`calcLib.buildSkillInstanceStats`) plus its stat-translation engine
// (`data.describeStats`) turn out to need only a trivial `{level, quality}`
// table, not a full build/character context — see extract-data.lua's
// `computeExplicitMods`/`computeRequirementRange` for the full story
// (including why the quality bonus's own text still comes from
// gem-details.json rather than this same engine — a real limitation of
// `describeStats` hit and verified during implementation, not a shortcut).
// Note `reqStr`/`reqDex`/`reqInt` below are NOT the displayed requirement —
// they're the raw formula input; `reqStrMin`/`reqStrMax` etc. are the real
// numbers (verified exact match against real-game values, e.g. Burning
// Damage Support: "(31-70), (33-70) Str, (23-48) Int").
export type PobGem = {
  name: string;
  gameId: string;
  variantId: string;
  tagString: string;
  tags: Record<string, boolean>;
  reqStr: number;
  reqDex: number;
  reqInt: number;
  naturalMaxLevel: number;
  vaal: boolean;
  transfigured: boolean;
  // Set only on transfigured gems — the gem this one transfigures.
  baseGemName?: string;
  // Plain-English "what this gem does" reminder text, e.g. "Supports
  // non-instant spell skills." — not every gem has one.
  description?: string;
  // Vaal gems only: the description of the non-Vaal effect they also grant
  // while socketed but not yet triggered (e.g. Vaal Discipline still grants
  // plain Discipline's aura until you use its Vaal skill).
  secondaryDescription?: string;
  // Real per-level stat lines (e.g. "Supported Skills deal (20-34)% more
  // Burning Damage"), ranged across the gem's own level 1-to-max span at
  // 0% quality — computed, not scraped. ~98% of gems that have any scaling
  // stats at all produce at least one line; a gem with none just has no
  // entry (utility gems with nothing level-scaling worth describing).
  explicitMods?: string[];
  // The character level and Str/Dex/Int requirement to socket this gem, at
  // the gem's own level 1 and natural max respectively (both scale as the
  // gem itself levels). A requirement of 0 at both ends (no Dex requirement
  // at all, say) just means that attribute isn't relevant to this gem.
  levelReqMin?: number;
  levelReqMax?: number;
  reqStrMin?: number;
  reqStrMax?: number;
  reqDexMin?: number;
  reqDexMax?: number;
  reqIntMin?: number;
  reqIntMax?: number;
};
