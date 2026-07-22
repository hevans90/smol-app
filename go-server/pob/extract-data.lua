-- extract-data.lua
-- Dumps Path of Building's own static item data as JSON: every base type
-- (data.itemBases, already a fully-structured Lua table — sockets, tags,
-- requirements, weapon/armour stats, influence compatibility), a
-- unique-item-name -> base-type map, and a unique-item-name -> mod preview
-- map (implicit/explicit mod text, corrupted flag) — both derived from
-- data.uniques, which PoB loads as raw "[[ Name \n Base Type \n ...mods ]]"
-- text blocks per item.
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
	local k = 2
	while k <= #lines do
		local nums = variantNumbers(lines[k])
		local stripped = lines[k]:gsub("^{[^}]*}", "")
		local implicitsN = stripped:match("^Implicits:%s*(%d+)$")
		if implicitsN then
			implicitsCount = tonumber(implicitsN)
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

io.stdout:write(json.encode({
	itemBases = data.itemBases,
	uniqueBaseTypes = uniqueBaseTypes,
	uniqueItemPreviews = uniqueItemPreviews,
}) .. "\n")
