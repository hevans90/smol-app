-- extract-data.lua
-- Dumps Path of Building's own static item data as JSON: every base type
-- (data.itemBases, already a fully-structured Lua table — sockets, tags,
-- requirements, weapon/armour stats, influence compatibility), a
-- unique-item-name -> base-type map, and a unique-item-name -> mod preview
-- map (implicit/explicit mod text, corrupted flag) — both derived from
-- data.uniques, which PoB loads as raw "[[ Name \n Base Type \n ...mods ]]"
-- text blocks per item — and every gem (data.gemsByGameId, incl. Vaal and
-- transfigured variants).
--
-- This reads PoB's OWN already-loaded runtime tables — the exact same data
-- headless PoB uses to compute character stats — rather than fetching
-- files over the network, so it can never drift from whatever PoB version
-- this environment is actually running (see POB_VERSION in
-- go-server/Dockerfile / headless-pob/Dockerfile).
--
-- Usage (must run from PoB's src/ directory, LUA_PATH must include
-- runtime/lua, same as extract-stats.lua):
--   luajit extract-data.lua > pob-data.json
--
-- On failure prints {"error": "..."} to stdout and exits 1.

local json = require("dkjson")

local function fail(msg)
	io.stdout:write(json.encode({ error = msg }) .. "\n")
	os.exit(1)
end

-- Same stub HeadlessWrapper.lua needs at boot (see extract-stats.lua) — we
-- don't touch character calc at all here, so none of the Timeless Jewel /
-- NewFileSearch machinery extract-stats.lua installs is needed.
function GetVirtualScreenSize()
	return 1920, 1080
end

-- PoB logs to stdout via print/ConPrintf; send that to stderr so stdout
-- carries nothing but our JSON result.
print = function(...)
	local parts = {}
	for i = 1, select("#", ...) do
		parts[#parts + 1] = tostring(select(i, ...))
	end
	io.stderr:write(table.concat(parts, "\t") .. "\n")
end

local ok, err = pcall(dofile, "HeadlessWrapper.lua")
if not ok then
	fail("PoB failed to initialise: " .. tostring(err))
end
if not data or not data.itemBases then
	fail("PoB initialised but data.itemBases is missing")
end
if not data.gemsByGameId then
	fail("PoB initialised but data.gemsByGameId is missing")
end

-- ---------------------------------------------------------------------
-- Parsing a single unique's raw text block into
-- { name, base, implicitMods, explicitMods, corrupted }.
--
-- Block shape (verified against real PoB data):
--   Name
--   Base Type            (usually one line, but see below)
--   ...metadata lines...  (League:, Source:, Upgrade:, Variant:, Requires,
--                          Sockets:, Implicits: N, Quality:, etc.)
--   ...mod lines...       (optionally {variant:N} or {variant:N,M,...}
--                          tagged, meaning "only applies to reprint N/M/...";
--                          untagged lines apply to every reprint)
--   Corrupted             (optional, standalone)
--
-- Rare complication: some items' BASE TYPE ITSELF changed between reprints
-- (e.g. Apep's Slumber: "{variant:1}Ancient Spirit Shield" then
-- "{variant:2}Vaal Spirit Shield" as two separate lines right after the
-- name) — the base type isn't always the single unambiguous lines[2].
-- ---------------------------------------------------------------------

-- data.itemBases keys are plain ASCII, but a few unique items' base-type
-- text carries a diacritic PoB never normalized out of the *unique*-item
-- string data (e.g. "Maelström Staff" on Duskdawn/Taryn's Shiver, vs. the
-- itemBases key "Maelstrom Staff") — fold known accented letters to their
-- ASCII equivalent so the itemBases membership check below still finds
-- these. This is used purely to identify/verify base-type candidate lines;
-- the folded (itemBases-matching) spelling is what gets stored as `base`,
-- since that's what downstream base-type lookups (pob-item-bases.json) key
-- on.
local DIACRITIC_FOLD = {
	["ö"] = "o", ["Ö"] = "O",
	["é"] = "e", ["É"] = "E",
	["è"] = "e", ["È"] = "E",
	["á"] = "a", ["Á"] = "A",
	["à"] = "a", ["À"] = "A",
	["ü"] = "u", ["Ü"] = "U",
	["ñ"] = "n", ["Ñ"] = "N",
	["ç"] = "c", ["Ç"] = "C",
}

local function foldDiacritics(str)
	for from, to in pairs(DIACRITIC_FOLD) do
		str = str:gsub(from, to)
	end
	return str
end

-- A line's {variant:...} tag can list MULTIPLE comma-separated variants it
-- applies to (e.g. Kaom's Primacy has "{variant:2,3}...") — not just a
-- single number, so this parses the whole list, not just the first digit
-- run. Returns nil if the line has no such tag.
local function variantNumbers(line)
	local tag = line:match("^{variant:([%d,]+)}")
	if not tag then
		return nil
	end
	local nums = {}
	for numStr in tag:gmatch("%d+") do
		nums[#nums + 1] = tonumber(numStr)
	end
	return nums
end

-- Lines that can never legitimately be the name (line 1) — catches
-- fragment blocks (Generated.lua builds some uniques from several
-- concatenated string literals) whose "name" line is actually a stray
-- metadata/mod-text line from a fragment boundary.
local METADATA_NAME_PREFIXES = {
	"Implicits:", "Limited to:", "Item Class:", "Selected Variant",
	"Requires", "Variant:", "Sockets:", "Radius:", "LevelReq:", "Quality:",
	"Unique ID:", "Item Level:", "Talisman Tier:", "Has Alt Variant",
	"League:", "Source:", "Rarity:",
}

-- Recognizes a metadata line anywhere after the base type (League:,
-- Source:, Upgrade:, Variant:, Requires, Sockets:, Quality:, etc, plus
-- "Implicits: N" and "Has N Sockets" which carry a payload). Corrupted is
-- deliberately NOT included — it must survive to the mod-line pass even
-- when it's the very first line after metadata (an item with zero real
-- mods that's still corrupted), and Mirrored/Unmodifiable are excluded too
-- since real base-type names can start with those words (e.g. "Mirrored
-- Spiked Shield") and this same prefix set is also used to validate a
-- candidate base-type line.
local METADATA_LINE_PREFIXES = {
	"League:", "Source:", "Upgrade:", "Variant:", "Selected Variant",
	"Selected Alt Variant", "Requires", "Sockets:", "Radius:", "LevelReq:",
	"Quality:", "Unique ID:", "Item Level:", "Talisman Tier:", "Limited to:",
	"Has Alt Variant",
}
-- Standalone influence-flag lines that can appear right after the base
-- type, before Source:/Variant:/etc — a closed set (verified: no
-- "Crusader Item"/"Redeemer Item"/"Hunter Item"/"Warlord Item" equivalents
-- exist in PoB's data, only these four). Exact-match only — "Elder Item"/
-- "Shaper Item" also appear as substrings of real conditional mod text
-- (e.g. "Cannot be Stunned by Attacks if your opposite Ring is an Elder
-- Item"), which must NOT be treated as metadata.
local METADATA_LINE_EXACT = {
	["Elder Item"] = true,
	["Shaper Item"] = true,
	["Searing Exarch Item"] = true,
	["Eater of Worlds Item"] = true,
}

local function startsWithAny(str, prefixes)
	for _, prefix in ipairs(prefixes) do
		if str:sub(1, #prefix) == prefix then
			return true
		end
	end
	return false
end

local function isMetadataLine(line)
	if METADATA_LINE_EXACT[line] then
		return true
	end
	if startsWithAny(line, METADATA_LINE_PREFIXES) then
		return true
	end
	if line == "Has no Sockets" then
		return true
	end
	if line:match("^Has %d+ Sockets?$") then
		return true
	end
	if line:match("^Implicits:%s*%d+$") then
		return true
	end
	return false
end

-- Parses one block's trimmed, non-empty `lines` array. Returns nil if the
-- block doesn't have the expected name/base-type shape (e.g. a Generated.lua
-- fragment). Otherwise returns { name, base, implicitMods, explicitMods,
-- corrupted }.
local function parseUniqueBlock(lines)
	if #lines < 2 then
		return nil
	end
	local name = lines[1]
	if name:sub(1, 1) == "{" or startsWithAny(name, METADATA_NAME_PREFIXES) then
		return nil
	end

	-- The block's overall "current" variant = highest variant number
	-- referenced ANYWHERE after the name (0 when untagged, meaning "keep
	-- everything") — computed once over the whole block rather than just
	-- the mod-line section, since a variant-tagged base-type line (see
	-- above) must count too.
	local maxVariant = 0
	for j = 2, #lines do
		for _, n in ipairs(variantNumbers(lines[j]) or {}) do
			if n > maxVariant then
				maxVariant = n
			end
		end
	end

	-- Resolve the base type AND consume all metadata lines in a single pass.
	-- The base type isn't reliably identifiable by position — some items
	-- redeclare it (Apep's Slumber: "{variant:1}Ancient Spirit Shield" /
	-- "{variant:2}Vaal Spirit Shield" right after the name; Moonsorrow: an
	-- untagged "default" base — "Imbued Wand" — followed by MORE tagged
	-- redeclarations that override it for specific variants) and standalone
	-- flag lines like "Shaper Item" can appear either before or after the
	-- base type line (Starforge: base then "Shaper Item"; Echoes of
	-- Creation: "Shaper Item" then base "Royal Burgonet"). So instead of
	-- assuming a position, use PoB's own `data.itemBases` table (already
	-- loaded — the definitive set of real base-type names) as the signal:
	-- walk forward, skip anything recognized as metadata, treat anything
	-- that's a real base-type name as a candidate, and stop at the first
	-- line that's neither — that's where mod text begins.
	local base
	-- Some items only tag base-type candidates up to some variant < the
	-- block's maxVariant (Dying Breath: base candidates tagged variant 1
	-- and 2, but a mod line is tagged variant 3) — meaning the highest
	-- tagged base persists unchanged into later variants. Track the
	-- highest-numbered candidate at or below maxVariant as a fallback for
	-- when no candidate is an exact match.
	local baseFallback
	local baseFallbackVariant = -1
	local implicitsCount = 0
	-- A unique's own level/attribute requirement CAN differ from its base
	-- type's — confirmed for Oriath's End (base Bismuth Flask needs level
	-- 8, but Oriath's End itself needs 56) and The Will of Uul-Netol (base
	-- Organic Ring needs level 32, the unique needs 42). PoB's raw data
	-- expresses this two different ways depending on the unique — both
	-- need parsing, they're not interchangeable-but-equivalent formats:
	--   "LevelReq: 56"                                    (level only)
	--   "Requires Level 42"                                (level only)
	--   "Requires Level: 20"                               (colon variant)
	--   "Requires Level 66, 212 Dex"                       (level + attr)
	--   "Requires Level 69, 46 Str, 46 Dex, 46 Int"         (level + all three)
	--   "Requires 8 Str, 8 Dex"                             (attrs, no level)
	--   "Requires Level 31, 25 Dex 25 Int"                  (missing comma — a
	--                                                        genuine data quirk)
	-- Verified by scanning every "Requires"/"LevelReq" line across the
	-- entire dataset (744 total) — these 16 shapes (modulo which numbers)
	-- are exhaustive, no other "Requires ..." line content exists.
	local reqLevel, reqStr, reqDex, reqInt
	local function parseRequiresOverrides(line)
		local levelStr = line:match("^Requires Level:?%s*(%d+)")
		if levelStr then
			reqLevel = tonumber(levelStr)
		end
		-- Attribute values always appear as "<number> <Attr>" — matched
		-- independently of the level capture above and of any comma, so the
		-- missing-comma quirk doesn't need special-casing.
		for num, attr in line:gmatch("(%d+)%s+(%a+)") do
			if attr == "Str" then
				reqStr = tonumber(num)
			elseif attr == "Dex" then
				reqDex = tonumber(num)
			elseif attr == "Int" then
				reqInt = tonumber(num)
			end
		end
	end
	local k = 2
	while k <= #lines do
		local nums = variantNumbers(lines[k])
		local stripped = lines[k]:gsub("^{[^}]*}", "")
		local implicitsN = stripped:match("^Implicits:%s*(%d+)$")
		local levelReqN = stripped:match("^LevelReq:%s*(%d+)$")
		if implicitsN then
			implicitsCount = tonumber(implicitsN)
			k = k + 1
		elseif levelReqN then
			reqLevel = tonumber(levelReqN)
			k = k + 1
		elseif stripped:match("^Requires") then
			parseRequiresOverrides(stripped)
			k = k + 1
		elseif isMetadataLine(stripped) then
			k = k + 1
		elseif data.itemBases[stripped] or data.itemBases[foldDiacritics(stripped)] then
			if data.itemBases[foldDiacritics(stripped)] then
				stripped = foldDiacritics(stripped)
			end
			if not nums then
				base = stripped
			else
				local matched = false
				for _, n in ipairs(nums) do
					if n == maxVariant then
						base = stripped
						matched = true
					end
				end
				if not matched then
					for _, n in ipairs(nums) do
						if n <= maxVariant and n > baseFallbackVariant then
							baseFallbackVariant = n
							baseFallback = stripped
						end
					end
				end
			end
			k = k + 1
		else
			break
		end
	end
	if not base then
		base = baseFallback
	end

	if not base then
		return nil
	end

	local filtered, corrupted = {}, false
	for j = k, #lines do
		local line = lines[j]
		if line == "Corrupted" then
			corrupted = true
		else
			local nums = variantNumbers(line)
			local keep = true
			if nums then
				keep = false
				for _, n in ipairs(nums) do
					if n == maxVariant then
						keep = true
					end
				end
			end
			if keep then
				-- Strip ALL leading {...} annotations (variant tags AND
				-- PoB's own {tags:...} mod-category markers, e.g. Headhunter's
				-- "{tags:attribute}+(40-55) to Strength") — neither is part
				-- of the mod's actual in-game wording. Loop in case more than
				-- one tag is stacked on the same line; bail if a leading "{"
				-- isn't part of a balanced pair (shouldn't happen in
				-- well-formed PoB data, but don't spin forever if it does).
				while line:match("^{") do
					local stripped, count = line:gsub("^%b{}", "")
					if count == 0 then
						break
					end
					line = stripped
				end
				filtered[#filtered + 1] = line
			end
		end
	end

	local implicitMods, explicitMods = {}, {}
	for idx, line in ipairs(filtered) do
		if idx <= implicitsCount then
			implicitMods[#implicitMods + 1] = line
		else
			explicitMods[#explicitMods + 1] = line
		end
	end

	return {
		name = name,
		base = base,
		implicitMods = implicitMods,
		explicitMods = explicitMods,
		corrupted = corrupted,
		levelReq = reqLevel,
		strReq = reqStr,
		dexReq = reqDex,
		intReq = reqInt,
	}
end

local uniqueBaseTypes = {}
local uniqueItemPreviews = {}
local skippedCount = 0

for category, blocks in pairs(data.uniques) do
	for _, block in ipairs(blocks) do
		local lines = {}
		for line in block:gmatch("[^\r\n]+") do
			line = line:match("^%s*(.-)%s*$")
			if line ~= "" then
				lines[#lines + 1] = line
			end
		end

		local parsed = parseUniqueBlock(lines)
		if not parsed then
			skippedCount = skippedCount + 1
		else
			-- Last block wins (current/latest variant), matching how PoB
			-- itself lists the currently-live version last within reprint
			-- groups sharing a name.
			uniqueBaseTypes[parsed.name] = parsed.base
			uniqueItemPreviews[parsed.name] = {
				baseType = parsed.base,
				implicitMods = parsed.implicitMods,
				explicitMods = parsed.explicitMods,
				corrupted = parsed.corrupted,
				levelReq = parsed.levelReq,
				strReq = parsed.strReq,
				dexReq = parsed.dexReq,
				intReq = parsed.intReq,
			}
		end
	end
end

io.stderr:write(string.format(
	"[extract-data] %d unique base types parsed, %d blocks skipped\n",
	(function() local n = 0 for _ in pairs(uniqueBaseTypes) do n = n + 1 end return n end)(),
	skippedCount
))

-- Foulborn (3.27+) data is NOT sourced from here — PoB's own
-- Data/ModFoulborn.lua has no field correlating a specific original mod
-- with its specific replacement (verified: `group` matching only recovers
-- which mods share a REPLACEMENT SLOT, not which original line each
-- replaces — e.g. it can't distinguish "Alpha's Howl's own Reservation
-- Efficiency mod becomes 32%" from an unrelated stale variant value also
-- sharing that slot). That correlation is deterministic in-game but isn't
-- present anywhere in PoB's data; see scripts/scrape-foulborn-mods.mjs,
-- which scrapes it from poedb.tw/us/Foulborn instead (verified against
-- this file's own unique-item-previews.json output).

-- Gems (regular, Vaal, and transfigured "X of Y" variants). data.gemsByGameId
-- groups every variant of a gem under its shared gameId (confirmed by direct
-- inspection: every one of the ~601 groups has exactly one "clean", non-Alt
-- base variant — no group lacks one — so baseName resolution below never
-- falls through to nil for a genuinely transfigured entry). Vaal gems are
-- NOT part of this grouping — a Vaal gem has its own distinct gameId
-- entirely (e.g. "Reap" and "Vaal Reap" are two separate single-entry
-- groups), so `vaalGem` is read directly off each entry, no group-based
-- linking needed for it. No icon or cost text exists in PoB for gems in
-- readable form (see gem-icons.json/gem-details.json) — but each gem's
-- `grantedEffect.description` (plain "what this does" text, confirmed to
-- match the real game's secDescrText) and its actual per-level EXPLICIT
-- STAT lines (the "Supported Skills deal X% more Y Damage" style text) ARE
-- both derivable straight from PoB's own engine:
--
-- `grantedEffect.description` (+ `secondaryGrantedEffect.description` for
-- Vaal gems only — the non-Vaal effect a Vaal gem also grants while
-- socketed but not yet used) is a direct field read, no computation.
--
-- The numeric stat lines need PoB's calc engine (`calcLib.
-- buildSkillInstanceStats`) plus its stat-translation engine (`data.
-- describeStats`, the same two calls `Classes/GemSelectControl.lua`'s own
-- `AddGemTooltip` uses for its live gem-picker tooltip) — but critically,
-- `buildSkillInstanceStats` turns out to need only a trivial `{level=N,
-- quality=Q}` table, NOT a full build/character/socket-group context (that
-- extra machinery in GemSelectControl.lua is for UI wiring, not a real
-- requirement of the calc itself — confirmed by reading buildSkillInstanceStats's
-- own definition in Modules/CalcTools.lua). computeExplicitMods below calls
-- it at the gem's own min and max level (quality fixed at 0 — the quality
-- bonus's own text already comes from gem-details.json, sourced externally
-- since PoB's calc-engine route to it hit a real limitation: `data.
-- describeStats` silently returns no lines whenever a value range's `min`
-- is exactly 0, which the quality-alone delta always is at 1% quality for
-- half-point-per-quality stats — verified by direct experimentation, not
-- guessed), merges the two into `{min=lo, max=hi}` ranges, and translates
-- them via `data.describeStats` — verified against 858 gems: 838 produce
-- ≥1 line with zero errors, only 2 empty (utility gems with no scaling
-- stat worth describing). Spot-checked several results against known
-- real-game values (e.g. Burning Damage Support's "(20-34)% more Burning
-- Damage" at level 1-20) — exact match.
--
-- The character-level/attribute requirement to SOCKET a gem ALSO scales as
-- the gem itself levels (e.g. Burning Damage Support needs character level
-- 31 at gem-level 1 but 70 at gem-level 20) — computed the same way, via
-- Classes/GemSelectControl.lua's own `calcLib.getGemStatRequirement`
-- formula (mirrored below), fed gems.json's flat reqStr/reqDex/reqInt as
-- its "multi" input. Verified exact match against real-game values too
-- (Burning Damage Support: "(31-70), (33-70) Str, (23-48) Int").
--
-- Shared by computeExplicitMods and computeRequirementRange below: the
-- lowest level key PoB tracks, and the highest key at or below the gem's
-- own natural max (falling back to the true highest tracked level if
-- naturalMaxLevel somehow isn't itself a key — PoB's level tables can
-- extend past naturalMaxLevel to support external +level modifiers, so the
-- true max is never used directly, only as a fallback).
local function findLevelRange(grantedEffect, naturalMaxLevel)
	if not grantedEffect or not grantedEffect.levels then
		return nil, nil
	end
	local minLevel, maxLevel
	for lvl, _ in pairs(grantedEffect.levels) do
		if not minLevel or lvl < minLevel then
			minLevel = lvl
		end
		if lvl <= naturalMaxLevel and (not maxLevel or lvl > maxLevel) then
			maxLevel = lvl
		end
	end
	if not maxLevel then
		for lvl, _ in pairs(grantedEffect.levels) do
			if not maxLevel or lvl > maxLevel then
				maxLevel = lvl
			end
		end
	end
	return minLevel, maxLevel
end

local function computeExplicitMods(grantedEffect, naturalMaxLevel)
	if not grantedEffect or not grantedEffect.stats or #grantedEffect.stats == 0 then
		return nil
	end
	local minLevel, maxLevel = findLevelRange(grantedEffect, naturalMaxLevel)
	if not minLevel or not maxLevel then
		return nil
	end

	local okLo, statsLo = pcall(calcLib.buildSkillInstanceStats, { level = minLevel, quality = 0 }, grantedEffect)
	local okHi, statsHi = pcall(calcLib.buildSkillInstanceStats, { level = maxLevel, quality = 0 }, grantedEffect)
	if not (okLo and okHi) then
		return nil
	end

	local keys = {}
	for k in pairs(statsLo) do
		keys[k] = true
	end
	for k in pairs(statsHi) do
		keys[k] = true
	end
	local rangedStats = {}
	for k in pairs(keys) do
		local lo, hi = statsLo[k] or 0, statsHi[k] or 0
		rangedStats[k] = { min = math.min(lo, hi), max = math.max(lo, hi) }
	end

	local okDesc, lines = pcall(data.describeStats, rangedStats, grantedEffect.statDescriptionScope)
	if not okDesc or type(lines) ~= "table" or #lines == 0 then
		return nil
	end
	return lines
end

-- The character-level and Str/Dex/Int requirement to SOCKET this gem both
-- scale as the gem itself levels from 1 to its natural max (e.g. Burning
-- Damage Support needs character level 31 at gem-level 1, but 70 at
-- gem-level 20) — gems.json's own flat reqStr/reqDex/reqInt are NOT this
-- final requirement value, they're the "multi" input PoB's own in-game
-- formula (calcLib.getGemStatRequirement, mirrored below in
-- Classes/GemSelectControl.lua's AddCommonGemInfo) scales by character
-- level to produce it — verified: Burning Damage Support's gemData.reqStr
-- is 60, but the ACTUAL displayed Str requirement is 33 at gem-level 1 and
-- 70 at gem-level 20, exactly matching real-game "(31-70), (33-70) Str,
-- (23-48) Int" — a genuine discrepancy this fixes, not a new feature: the
-- flat reqStr/reqDex/reqInt fields were never actually the right numbers
-- to display on their own.
local function getGemStatRequirement(level, isSupport, multi)
	if multi == 0 then
		return 0
	end
	local statType = isSupport and 0.5 or 0.7
	local req = round((20 + (level - 3) * 3) * (multi / 100) ^ 0.9 * statType)
	return req < 14 and 0 or req
end

local function computeRequirementRange(gem, grantedEffect, naturalMaxLevel)
	if not grantedEffect then
		return nil
	end
	local minLevel, maxLevel = findLevelRange(grantedEffect, naturalMaxLevel)
	if not minLevel or not maxLevel then
		return nil
	end
	local levelReqLo = grantedEffect.levels[minLevel] and grantedEffect.levels[minLevel].levelRequirement or 1
	local levelReqHi = grantedEffect.levels[maxLevel] and grantedEffect.levels[maxLevel].levelRequirement or 1
	local ok, result = pcall(function()
		return {
			levelReqMin = math.min(levelReqLo, levelReqHi),
			levelReqMax = math.max(levelReqLo, levelReqHi),
			reqStrMin = math.min(getGemStatRequirement(levelReqLo, grantedEffect.support, gem.reqStr), getGemStatRequirement(levelReqHi, grantedEffect.support, gem.reqStr)),
			reqStrMax = math.max(getGemStatRequirement(levelReqLo, grantedEffect.support, gem.reqStr), getGemStatRequirement(levelReqHi, grantedEffect.support, gem.reqStr)),
			reqDexMin = math.min(getGemStatRequirement(levelReqLo, grantedEffect.support, gem.reqDex), getGemStatRequirement(levelReqHi, grantedEffect.support, gem.reqDex)),
			reqDexMax = math.max(getGemStatRequirement(levelReqLo, grantedEffect.support, gem.reqDex), getGemStatRequirement(levelReqHi, grantedEffect.support, gem.reqDex)),
			reqIntMin = math.min(getGemStatRequirement(levelReqLo, grantedEffect.support, gem.reqInt), getGemStatRequirement(levelReqHi, grantedEffect.support, gem.reqInt)),
			reqIntMax = math.max(getGemStatRequirement(levelReqLo, grantedEffect.support, gem.reqInt), getGemStatRequirement(levelReqHi, grantedEffect.support, gem.reqInt)),
		}
	end)
	if not ok then
		return nil
	end
	return result
end

local gems = {}
for gameId, group in pairs(data.gemsByGameId) do
	local baseName
	for variantId, gem in pairs(group) do
		if not (variantId:match("AltX$") or variantId:match("AltY$")) then
			baseName = gem.name
		end
	end
	for variantId, gem in pairs(group) do
		local isTransfigured = variantId:match("AltX$") ~= nil or variantId:match("AltY$") ~= nil
		local reqRange = computeRequirementRange(gem, gem.grantedEffect, gem.naturalMaxLevel or 20)
		gems[gem.name] = {
			name = gem.name,
			gameId = gem.gameId,
			variantId = gem.variantId,
			tagString = gem.tagString,
			tags = gem.tags,
			reqStr = gem.reqStr,
			reqDex = gem.reqDex,
			reqInt = gem.reqInt,
			naturalMaxLevel = gem.naturalMaxLevel,
			vaal = gem.vaalGem == true,
			transfigured = isTransfigured,
			baseGemName = (isTransfigured and baseName ~= gem.name) and baseName or nil,
			description = gem.grantedEffect and gem.grantedEffect.description or nil,
			secondaryDescription = gem.secondaryGrantedEffect and gem.secondaryGrantedEffect.description or nil,
			explicitMods = computeExplicitMods(gem.grantedEffect, gem.naturalMaxLevel or 20),
			levelReqMin = reqRange and reqRange.levelReqMin or nil,
			levelReqMax = reqRange and reqRange.levelReqMax or nil,
			reqStrMin = reqRange and reqRange.reqStrMin or nil,
			reqStrMax = reqRange and reqRange.reqStrMax or nil,
			reqDexMin = reqRange and reqRange.reqDexMin or nil,
			reqDexMax = reqRange and reqRange.reqDexMax or nil,
			reqIntMin = reqRange and reqRange.reqIntMin or nil,
			reqIntMax = reqRange and reqRange.reqIntMax or nil,
		}
	end
end

io.stderr:write(string.format(
	"[extract-data] %d gems collected\n",
	(function() local n = 0 for _ in pairs(gems) do n = n + 1 end return n end)()
))

io.stdout:write(json.encode({
	itemBases = data.itemBases,
	uniqueBaseTypes = uniqueBaseTypes,
	uniqueItemPreviews = uniqueItemPreviews,
	gems = gems,
}) .. "\n")
