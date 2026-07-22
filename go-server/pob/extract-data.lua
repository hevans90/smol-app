-- extract-data.lua
-- Dumps Path of Building's own static item data as JSON: every base type
-- (data.itemBases, already a fully-structured Lua table — sockets, tags,
-- requirements, weapon/armour stats, influence compatibility) and a
-- unique-item-name -> base-type map (derived from data.uniques, which PoB
-- loads as raw "[[ Name \n Base Type \n ...mods ]]" text blocks per item).
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
-- Unique name -> base type, parsed from data.uniques' raw text blocks.
-- ---------------------------------------------------------------------

-- Lines that can never legitimately be a base-type line (line 2) — a block
-- whose second line starts with one of these doesn't have the normal
-- "name\nbase type\n..." shape and must be skipped rather than mis-mapped.
-- Exact-match only for these two: real base-type names legitimately start
-- with these words (e.g. "Mirrored Spiked Shield"), so a prefix check would
-- misfire on them.
local METADATA_BASE_EXACT = { Corrupted = true, Mirrored = true, Unmodifiable = true }
local METADATA_BASE_PREFIXES = {
	"League:", "Source:", "Implicits:", "Variant:", "Selected Variant",
	"Requires", "Sockets:", "Radius:", "LevelReq:", "Quality:", "Unique ID:",
	"Item Level:", "Has no Sockets", "Talisman Tier:", "Limited to:",
	"Has Alt Variant",
}

-- A well-formed block's first line is a plain item name, never a
-- "Key: Value" metadata line or a bare {variant:N} tag — catches fragment
-- blocks (Generated.lua builds some uniques from several concatenated
-- string literals) whose "name" line is actually a stray metadata/mod-text
-- line from a fragment boundary.
local METADATA_NAME_PREFIXES = {
	"Implicits:", "Limited to:", "Item Class:", "Selected Variant",
	"Requires", "Variant:", "Sockets:", "Radius:", "LevelReq:", "Quality:",
	"Unique ID:", "Item Level:", "Talisman Tier:", "Has Alt Variant",
	"League:", "Source:", "Rarity:",
}

local function startsWithAny(str, prefixes)
	for _, prefix in ipairs(prefixes) do
		if str:sub(1, #prefix) == prefix then
			return true
		end
	end
	return false
end

local uniqueBaseTypes = {}
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
		if #lines >= 2 then
			local name, base = lines[1], lines[2]
			if name:sub(1, 1) == "{" or startsWithAny(name, METADATA_NAME_PREFIXES) then
				skippedCount = skippedCount + 1
			else
				-- Strip a leading {variant:N} / {tags:...} annotation some
				-- Generated.lua blocks glue onto the base-type line itself.
				base = base:gsub("^{[^}]*}", "")
				if METADATA_BASE_EXACT[base] or startsWithAny(base, METADATA_BASE_PREFIXES) then
					skippedCount = skippedCount + 1
				else
					-- Last block wins (current/latest variant), matching how
					-- PoB itself lists the currently-live version last within
					-- reprint groups sharing a name.
					uniqueBaseTypes[name] = base
				end
			end
		end
	end
end

io.stderr:write(string.format(
	"[extract-data] %d unique base types parsed, %d blocks skipped\n",
	(function() local n = 0 for _ in pairs(uniqueBaseTypes) do n = n + 1 end return n end)(),
	skippedCount
))

io.stdout:write(json.encode({
	itemBases = data.itemBases,
	uniqueBaseTypes = uniqueBaseTypes,
}) .. "\n")
