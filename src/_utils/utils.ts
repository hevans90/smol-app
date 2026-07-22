import { search as fuzzySearch } from 'fast-fuzzy';
import iconsResponse from '../assets/bases/all-basetypes.json';
import pobItemBasesResponse from '../assets/bases/pob-item-bases.json';
import stackablesResponse from '../assets/stackables/stackables.json';
import uniqueBaseTypesResponse from '../assets/uniques/unique-base-types.json';
import uniqueItemPreviewsResponse from '../assets/uniques/unique-item-previews.json';
import uniquesResponse from '../assets/uniques/uniques.json';
import {
  type ArmorDefenceType,
  type BaseTypeCategory,
  type BaseType,
  type PobItemBase,
  type SortedBaseTypes,
  type UniqueItemPreview,
} from '../models/base-types';
import type { DDSItem } from '../models/dds-items';
import type { GGGItem, GGGItemProperty } from '../models/ggg-responses';
import { deriveUniqueNameCandidate } from './stash-matching';

const uniqueItems: DDSItem[] = Object.entries(uniquesResponse)
  .map(([key, item]) => ({
    ...item,
    id: `${item.id}_${key}`,
  }))
  .reduce<DDSItem[]>((acc, item) => {
    if (!acc.some((existing) => existing.name === item.name)) {
      acc.push(item as DDSItem);
    }
    return acc;
  }, []);

// Icons aren't part of PoB's own data (it renders from local game texture
// files, not web URLs) — cross-referenced by name from the older
// GGG-data-mining asset instead. Coverage on the bases we actually keep is
// ~99%; the handful of misses are variant bases PoB names with a
// disambiguating suffix the icon dataset doesn't use (e.g. PoB's "Two-Stone
// Ring (Cold/Lightning)" vs the icon dataset's plain "Two-Stone Ring" — same
// icon either way, so getIcon falls back to the name with that suffix
// stripped) plus one genuinely obscure base (Maelstrom Staff) that just
// renders iconless.
const iconsByBaseName: Record<string, string> = Object.fromEntries(
  (iconsResponse as { data: { Name: string; IconPath: string }[] }).data.map(
    (item) => [item.Name, item.IconPath],
  ),
);

const getIcon = (name: string): string =>
  iconsByBaseName[name] ??
  iconsByBaseName[name.replace(/\s*\([^)]*\)\s*$/, '')] ??
  '';

// PoB's own `type` field, mapped to this app's (finer-grained, in a couple
// of cases) BaseTypeCategory. Jewels and one-hand swords need a `tags`
// check too — PoB doesn't split those by `type` alone. Grafts are excluded
// entirely (legacy items, no longer obtainable) rather than mapped.
const POB_TYPE_TO_CATEGORY: Record<string, BaseTypeCategory> = {
  Amulet: 'Amulets',
  Belt: 'Belts',
  'Body Armour': 'Body Armours',
  Boots: 'Boots',
  Bow: 'Bows',
  Claw: 'Claws',
  Dagger: 'Daggers',
  'Fishing Rod': 'Fishing Rods',
  Flask: 'Flasks',
  Gloves: 'Gloves',
  Helmet: 'Helmets',
  Jewel: 'Jewels',
  'One Handed Axe': 'One Hand Axes',
  'One Handed Mace': 'One Hand Maces',
  'One Handed Sword': 'One Hand Swords',
  Quiver: 'Quivers',
  Ring: 'Rings',
  Sceptre: 'Sceptres',
  Shield: 'Shields',
  Staff: 'Staves',
  Tincture: 'Tinctures',
  'Two Handed Axe': 'Two Hand Axes',
  'Two Handed Mace': 'Two Hand Maces',
  'Two Handed Sword': 'Two Hand Swords',
  Wand: 'Wands',
};

const getCategory = (base: PobItemBase): BaseTypeCategory | undefined => {
  if (base.type === 'Jewel' && base.tags.abyss_jewel) return 'Abyss Jewels';
  if (base.type === 'One Handed Sword' && base.tags.rapier) {
    return 'Thrusting One Hand Swords';
  }
  return POB_TYPE_TO_CATEGORY[base.type];
};

// Given a base type's exact name (e.g. "Karui Chopper"), returns its
// BaseTypeCategory — shared with netlify/functions/get-item-info.ts so both
// the app and that function agree on categories from the same PoB source,
// instead of each maintaining its own lookup against a different dataset.
export const getBaseTypeCategory = (
  baseTypeName: string,
): BaseTypeCategory | undefined => {
  const base = (pobItemBasesResponse as Record<string, PobItemBase>)[
    baseTypeName
  ];
  return base && getCategory(base);
};

// A small, known set of bases PoB includes that aren't real orderable items:
// PvP/race rewards, internal placeholders, and legacy variants GGG removed
// from the drop pool. `hidden` and `tags.demigods` are PoB's own semantic
// flags for most of these; the rest (Energy Blade, Ethereal Bow/Blade, and
// PoB's internal "Random X Sword" placeholders) have no such tag, so they're
// matched by name — same approach the old exclusion list used, just for a
// much smaller residual set now that PoB's own flags cover the rest.
const EXCLUDED_NAMES = new Set([
  'Energy Blade One Handed',
  'Energy Blade Two Handed',
  'Ethereal Bow',
  'Ethereal Blade',
]);

const isExcluded = (name: string, base: PobItemBase): boolean =>
  base.hidden === true ||
  base.tags.demigods === true ||
  base.tags.talisman === true ||
  base.tags.animal_charm === true ||
  base.type === 'Graft' ||
  name.startsWith('Random ') ||
  EXCLUDED_NAMES.has(name);

const getDefenceType = (armour: PobItemBase['armour']): ArmorDefenceType | undefined => {
  const hasArmour = !!armour?.ArmourBaseMin;
  const hasEvasion = !!armour?.EvasionBaseMin;
  const hasEnergyShield = !!armour?.EnergyShieldBaseMin;

  if (hasArmour && hasEvasion) return 'StrDex';
  if (hasArmour && hasEnergyShield) return 'StrInt';
  if (hasEvasion && hasEnergyShield) return 'DexInt';
  if (hasArmour) return 'Str';
  if (hasEvasion) return 'Dex';
  if (hasEnergyShield) return 'Int';
  return undefined;
};

export const getSortedBaseItems = () => {
  const pobBases = pobItemBasesResponse as Record<string, PobItemBase>;

  const toItem = ([name, base]: [string, PobItemBase]): BaseType => ({
    Name: name,
    IconPath: getIcon(name),
    ItemClassesID: base.type,
    ItemClassesName: getCategory(base)!,
    ItemLevel: String(base.req?.level ?? 1),
    DefenceType: getDefenceType(base.armour),
  });

  const candidates = Object.entries(pobBases).filter(
    ([name, base]) => !isExcluded(name, base) && getCategory(base),
  );

  // Flasks: only the top 2 Life and top 2 Mana bases (by level) are useful
  // to order — the rest are strictly worse versions of the same flask. All
  // Utility flasks are kept (each is functionally distinct); Hybrid flasks
  // are dropped entirely (matches the previous behaviour).
  const flaskEntries = candidates.filter(([, base]) => base.type === 'Flask');
  const topBySubType = (subType: string, n?: number) =>
    flaskEntries
      .filter(([, base]) => base.subType === subType)
      .sort(([, a], [, b]) => (b.req?.level ?? 1) - (a.req?.level ?? 1))
      .slice(0, n);
  const keptFlaskNames = new Set(
    [...topBySubType('Life', 2), ...topBySubType('Mana', 2), ...topBySubType('Utility')].map(
      ([name]) => name,
    ),
  );

  const sorted: SortedBaseTypes = {} as SortedBaseTypes;
  for (const entry of candidates) {
    const [name, base] = entry;
    if (base.type === 'Flask' && !keptFlaskNames.has(name)) continue;

    const category = getCategory(base)!;
    sorted[category] ??= [];
    sorted[category].push(toItem(entry));
  }

  for (const category of Object.keys(sorted) as BaseTypeCategory[]) {
    sorted[category].sort((a, b) => parseInt(b.ItemLevel) - parseInt(a.ItemLevel));
  }

  return sorted;
};

export const mapDdsToPoeImageUrl = (
  ddsFilePath: string,
  width = 1,
  height = 1,
) => {
  const baseUrl = 'https://web.poecdn.com/image/';
  const pathWithoutExt = ddsFilePath.replace(/\.dds$/, '');
  return `${baseUrl}${pathWithoutExt}.png?scale=1&w=${width}&h=${height}`;
};

// Derives an inventory icon from a poewiki page link, e.g.
// https://www.poewiki.net/wiki/Ming%27s_Heart -> Special:FilePath/Ming's_Heart_inventory_icon.png
export const getWikiImgSrcFromUrl = (url: string) => {
  const itemName = url.split('/').pop();
  return `https://www.poewiki.net/wiki/Special:FilePath/${itemName}_inventory_icon.png`;
};

// Same idea, but starting from a bare item name rather than a full wiki URL
// (used for the bulk order "custom item" escape hatch, where there's no
// wiki link yet — just a best-effort guess at the icon).
export const guessWikiIconUrlFromName = (name: string) =>
  `https://www.poewiki.net/wiki/Special:FilePath/${name.replace(/ /g, '_')}_inventory_icon.png`;

export type UniqueSearchResult = {
  name: string;
  id: string;
  class: string;
  icon: string;
};

export const searchUniquesByNameOrBase = (
  query: string,
  maxResults = 6,
): UniqueSearchResult[] =>
  fuzzySearch(query, uniqueItems, {
    keySelector: (item) => [item.name, item.item_class],
    threshold: 0.7,
  })
    .filter((item) => !item.is_alternate_art)
    .slice(0, maxResults)
    .map((item) => ({
      name: item.name,
      id: item.id,
      class: item.item_class,
      icon: mapDdsToPoeImageUrl(item.visual_identity.dds_file),
    }));

export type StackableSearchResult = {
  name: string;
  category: string;
  icon: string;
};

const stackableItems = stackablesResponse as StackableSearchResult[];

// Currency/essences/fragments/etc only — NOT uniques, which are single-item
// and served by the existing (searchUniquesByNameOrBase) order flow. Backs
// the bulk order item picker.
//
// Item names here are multi-word ("Screaming Essence of Contempt"), and the
// natural way to type-ahead them is one abbreviation per word ("scr cont").
// fast-fuzzy's whole-string edit distance scores that query far from the
// full name and misses it, so word matches are found first (every query
// token must be a substring of some word in the name — order-independent,
// so "cont scr" also matches), then padded with fast-fuzzy's typo-tolerant
// full-string search for single-word/misspelled queries.
export const searchStackablesByName = (
  query: string,
  maxResults = 8,
): StackableSearchResult[] => {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const rank = (item: StackableSearchResult) => {
    const lowerName = item.name.toLowerCase();
    if (lowerName.startsWith(query.toLowerCase())) return 0;
    const firstWord = lowerName.split(/\s+/)[0];
    if (tokens[0] && firstWord.startsWith(tokens[0])) return 1;
    return 2;
  };

  const wordMatches = stackableItems
    .filter((item) => {
      const words = item.name.toLowerCase().split(/\s+/);
      return tokens.every((token) => words.some((word) => word.includes(token)));
    })
    .sort((a, b) => rank(a) - rank(b));

  if (wordMatches.length >= maxResults) {
    return wordMatches.slice(0, maxResults);
  }

  const fuzzyMatches = fuzzySearch(query, stackableItems, {
    keySelector: (item) => item.name,
    threshold: 0.7,
  });

  const seen = new Set(wordMatches.map((item) => item.name));
  for (const item of fuzzyMatches) {
    if (wordMatches.length >= maxResults) break;
    if (seen.has(item.name)) continue;
    seen.add(item.name);
    wordMatches.push(item);
  }

  return wordMatches.slice(0, maxResults);
};

// Unique item name -> base type, extracted from Path of Building's own
// Data/Uniques Lua source (the same upstream data this app already trusts
// for headless PoB character stats) via a one-off scratch script. This used
// to be a live poewiki.net cargoquery lookup, but poewiki now sits behind
// Anubis bot-protection that blocks this app's requests outright — every
// lookup silently failed and defaulted callers to an empty base type
// (see OrderForm.tsx's bulk-order flow), which is what broke the Google
// Sheets base-type export. A local, no-network lookup can't go stale that
// way; it just needs re-generating occasionally as new uniques ship.
const uniqueBaseTypesByName: Record<string, string> = uniqueBaseTypesResponse;

export const getUniqueItemWikiInfo = (itemName: string) => {
  const baseItem = uniqueBaseTypesByName[itemName];
  if (!baseItem) return null;

  const wikiBase = 'https://www.poewiki.net/wiki/';
  const pageName = itemName.replace(/ /g, '_');

  return {
    wikiLink: wikiBase + encodeURIComponent(pageName),
    baseItem,
  };
};

const uniqueItemPreviewsByName = uniqueItemPreviewsResponse as Record<
  string,
  UniqueItemPreview
>;
const pobItemBases = pobItemBasesResponse as Record<string, PobItemBase>;

// A base type has no specific roll (quality, affixes) to derive a single
// display number from, unlike a real dropped item — show its base min-max
// range as-is rather than picking/faking one end of it.
const rangeProperty = (min?: number, max?: number): string | undefined => {
  if (min == null && max == null) return undefined;
  if (min == null) return String(max);
  if (max == null) return String(min);
  return min === max ? String(min) : `${min}-${max}`;
};

// Stats a unique's own mod text can affect, and the property they map to.
// "Evasion" and "Evasion Rating" both appear in real mod wording for the
// same stat (e.g. Rigwald's Hunt: "increased Armour and Evasion").
type StatKey =
  | 'armour'
  | 'evasion'
  | 'energyShield'
  | 'ward'
  | 'physical'
  | 'attackSpeed'
  | 'critChance';

const STAT_NAME_TO_KEY: Record<string, StatKey> = {
  Armour: 'armour',
  Evasion: 'evasion',
  'Evasion Rating': 'evasion',
  'Energy Shield': 'energyShield',
  Ward: 'ward',
  'Physical Damage': 'physical',
  'Attack Speed': 'attackSpeed',
  'Critical Strike Chance': 'critChance',
};
// Longest name first, so e.g. "Evasion Rating" is tried before the shorter
// "Evasion" at the same position in the alternation.
const STAT_NAME_GROUP = Object.keys(STAT_NAME_TO_KEY)
  .sort((a, b) => b.length - a.length)
  .join('|');
const STAT_LIST_GROUP = `(?:maximum\\s+)?(?:${STAT_NAME_GROUP})(?:(?:,\\s+|\\s+and\\s+)(?:maximum\\s+)?(?:${STAT_NAME_GROUP}))*`;

// Anchored to the WHOLE mod line (start to end) deliberately — a real mod's
// trailing qualifier ("if you haven't Cast Dash recently", "while Phasing",
// "per Intensity", "taken", "with Ranged Weapons") means the line no longer
// matches to its end, so it's excluded rather than misapplied. This also
// naturally rules out "increased Physical Damage taken" (a defensive stat,
// not the weapon's own damage) and minion/ally stats ("Minions have ...")
// without needing an explicit blocklist for either.
const PERCENT_MOD_RE = new RegExp(
  `^\\(?(\\d+)(?:-(\\d+))?\\)?%\\s+(increased|reduced)\\s+(?:Global\\s+)?(${STAT_LIST_GROUP})$`,
  'i',
);
const FLAT_MOD_RE = new RegExp(
  `^\\+\\(?(\\d+)(?:-(\\d+))?\\)?\\s+to\\s+(${STAT_LIST_GROUP})$`,
  'i',
);

type StatTotal = { incMin: number; incMax: number; addMin: number; addMax: number };

const lookupStatKey = (rawName: string): StatKey | undefined =>
  STAT_NAME_TO_KEY[rawName.trim().replace(/^maximum\s+/i, '')];

// Sums every unconditional "X% increased/reduced <stat>" and "+X to <stat>"
// mod line into per-stat totals (PoE's own additive-percentage stacking
// rule), so a unique's own mods can modify its displayed base stats instead
// of always showing the plain, unaffected base-type numbers.
const parseModTotals = (mods: string[]): Partial<Record<StatKey, StatTotal>> => {
  const totals: Partial<Record<StatKey, StatTotal>> = {};
  const ensure = (key: StatKey): StatTotal =>
    (totals[key] ??= { incMin: 0, incMax: 0, addMin: 0, addMax: 0 });

  for (const rawMod of mods) {
    const mod = rawMod.trim();

    const percentMatch = mod.match(PERCENT_MOD_RE);
    if (percentMatch) {
      const [, lowStr, highStr, direction, statList] = percentMatch;
      const sign = direction.toLowerCase() === 'reduced' ? -1 : 1;
      const low = Number(lowStr) * sign;
      const high = (highStr ? Number(highStr) : Number(lowStr)) * sign;
      for (const name of statList.split(/,\s+|\s+and\s+/)) {
        const key = lookupStatKey(name);
        if (!key) continue;
        const total = ensure(key);
        total.incMin += low;
        total.incMax += high;
      }
      continue;
    }

    const flatMatch = mod.match(FLAT_MOD_RE);
    if (flatMatch) {
      const [, lowStr, highStr, statList] = flatMatch;
      const low = Number(lowStr);
      const high = highStr ? Number(highStr) : low;
      for (const name of statList.split(/,\s+|\s+and\s+/)) {
        const key = lookupStatKey(name);
        if (!key) continue;
        const total = ensure(key);
        total.addMin += low;
        total.addMax += high;
      }
    }
  }

  return totals;
};

const applyStatTotal = (
  base: number,
  total: StatTotal | undefined,
  isMax: boolean,
): number => {
  if (!total) return base;
  const add = isMax ? total.addMax : total.addMin;
  const inc = isMax ? total.incMax : total.incMin;
  return (base + add) * (1 + inc / 100);
};

const formatStatValue = (min: number, max: number, decimals = 0): string => {
  const roundedMin = Number(min.toFixed(decimals));
  const roundedMax = Number(max.toFixed(decimals));
  return roundedMin === roundedMax ? String(roundedMin) : `${roundedMin}-${roundedMax}`;
};

// Builds the same Armour/Evasion/Energy Shield/Physical Damage/Critical
// Strike Chance/etc. property lines a real GGG API item has, straight from
// PoB's raw base-type stats — used for both base-type orders and unique
// orders (a unique still has its base's underlying armour/weapon stats).
// `mods` (a unique's own implicit+explicit mod text) lets matching stats
// come out modified and coloured blue, same as a real item tooltip; base
// orders have no mods of their own, so they always show the plain white
// base-type numbers.
const buildBaseTypeProperties = (
  base: PobItemBase,
  mods: string[] = [],
): GGGItemProperty[] => {
  const properties: GGGItemProperty[] = [];
  const totals = parseModTotals(mods);

  const pushRange = (
    key: StatKey,
    name: string,
    type: number,
    min?: number,
    max?: number,
  ) => {
    if (min == null || max == null) return;
    const total = totals[key];
    const modifiedMin = applyStatTotal(min, total, false);
    const modifiedMax = applyStatTotal(max, total, true);
    properties.push({
      name,
      values: [[formatStatValue(modifiedMin, modifiedMax), total ? 1 : 0]],
      displayMode: 0,
      type,
    });
  };

  if (base.armour) {
    const { armour } = base;
    pushRange('armour', 'Armour', 16, armour.ArmourBaseMin, armour.ArmourBaseMax);
    pushRange(
      'evasion',
      'Evasion Rating',
      17,
      armour.EvasionBaseMin,
      armour.EvasionBaseMax,
    );
    pushRange(
      'energyShield',
      'Energy Shield',
      18,
      armour.EnergyShieldBaseMin,
      armour.EnergyShieldBaseMax,
    );
    pushRange('ward', 'Ward', 19, armour.WardBaseMin, armour.WardBaseMax);
    if (armour.BlockChance) {
      properties.push({
        name: 'Chance to Block',
        values: [[`${armour.BlockChance}%`, 0]],
        displayMode: 0,
        type: 15,
      });
    }
  }

  if (base.weapon) {
    const { weapon } = base;
    pushRange('physical', 'Physical Damage', 9, weapon.PhysicalMin, weapon.PhysicalMax);

    if (weapon.CritChanceBase != null) {
      const total = totals.critChance;
      const modified = applyStatTotal(weapon.CritChanceBase, total, false);
      properties.push({
        name: 'Critical Strike Chance',
        values: [[`${modified.toFixed(2)}%`, total ? 1 : 0]],
        displayMode: 0,
        type: 12,
      });
    }
    if (weapon.AttackRateBase != null) {
      const total = totals.attackSpeed;
      const modifiedMin = applyStatTotal(weapon.AttackRateBase, total, false);
      const modifiedMax = applyStatTotal(weapon.AttackRateBase, total, true);
      properties.push({
        name: 'Attacks per Second',
        values: [[formatStatValue(modifiedMin, modifiedMax, 2), total ? 1 : 0]],
        displayMode: 0,
        type: 13,
      });
    }
    if (weapon.Range != null) {
      properties.push({
        name: 'Weapon Range: {0} metre',
        values: [[String(weapon.Range), 0]],
        displayMode: 3,
        type: 14,
      });
    }
  }

  return properties;
};

// Orders have no real per-instance item (no mods/sockets/rarity — just
// description/link_url/item_base_type/item_category/type), so there's
// nothing to show a live GGGItem-shaped tooltip for. This builds a
// canonical, static stand-in instead — "what does this unique/base type
// generally look like" — from the local PoB-derived datasets, good enough
// to feed the same ItemDetail renderer the character sheet uses. Returns
// null when there's nothing worth previewing (Other/Transfiguredgem orders,
// or a unique/base name that doesn't resolve).
export const buildOrderItemPreview = (order: {
  type: string;
  description?: string | null;
  link_url?: string | null;
  item_base_type?: string | null;
}): GGGItem | null => {
  if (order.type === 'unique') {
    const name = deriveUniqueNameCandidate({
      link_url: order.link_url,
      description: order.description ?? '',
    });
    const preview = uniqueItemPreviewsByName[name];
    if (!preview) return null;

    const base = pobItemBases[preview.baseType];
    const mods = [...preview.implicitMods, ...preview.explicitMods];

    return {
      rarity: 'unique',
      name,
      baseType: preview.baseType,
      typeLine: preview.baseType,
      properties: base ? buildBaseTypeProperties(base, mods) : undefined,
      implicitMods: preview.implicitMods,
      explicitMods: preview.explicitMods,
      corrupted: preview.corrupted,
    } as GGGItem;
  }

  if (order.type === 'base' && order.item_base_type) {
    const base = pobItemBases[order.item_base_type];
    if (!base) return null;

    return {
      rarity: 'normal',
      name: order.item_base_type,
      baseType: order.item_base_type,
      typeLine: order.item_base_type,
      properties: buildBaseTypeProperties(base),
      // ItemDetail renders each implicitMods entry as its own line (unlike
      // explicitMods, it doesn't split embedded "\n" itself) — pob-item-bases.json's
      // `implicit` is a single "\n"-joined string for multi-line implicits, so split
      // it here to match.
      implicitMods: base.implicit ? base.implicit.split('\n') : undefined,
    } as GGGItem;
  }

  return null;
};
