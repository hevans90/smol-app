-- extract-stats.lua
-- Loads a character into headless Path of Building from the two GGG API
-- payloads (character-window/get-items + get-passive-skills) and prints the
-- calculated stats as JSON on stdout.
--
-- Usage (must run from PoB's src/ directory, LUA_PATH must include runtime/lua):
--   lua extract-stats.lua <items.json> <passives.json> [--dump]
--   lua extract-stats.lua --stdin [--dump]
--     --stdin expects one JSON object: {"items": <get-items response>,
--                                       "passives": <get-passive-skills response>}
--   --dump prints every scalar key of PoB's calc output instead of the
--     curated stat set (use it to discover key names when PoB updates).
--
-- On failure prints {"error": "..."} and exits 1.

local json = require("dkjson")

local function fail(msg)
	io.stdout:write(json.encode({ error = msg }) .. "\n")
	os.exit(1)
end

local verbose = os.getenv("POB_VERBOSE")
local function progress(msg)
	if verbose then
		io.stderr:write("[extract-stats] " .. msg .. "\n")
	end
end

local paths, dumpAll, useStdin = {}, false, false
for _, a in ipairs(arg) do
	if a == "--dump" then
		dumpAll = true
	elseif a == "--stdin" or a == "-" then
		useStdin = true
	else
		paths[#paths + 1] = a
	end
end

local itemsJSON, passivesJSON
if useStdin then
	local combined, _, err = json.decode(io.read("*a"))
	if not combined then
		fail("could not parse stdin JSON: " .. tostring(err))
	end
	if not (combined.items and combined.passives) then
		fail('stdin JSON must have "items" and "passives" keys')
	end
	itemsJSON = json.encode(combined.items)
	passivesJSON = json.encode(combined.passives)
else
	if #paths < 2 then
		fail("usage: extract-stats.lua <items.json> <passives.json> [--dump] | --stdin [--dump]")
	end
	local function slurp(path)
		local f, err = io.open(path, "r")
		if not f then
			fail("could not open " .. path .. ": " .. tostring(err))
		end
		local data = f:read("*a")
		f:close()
		return data
	end
	itemsJSON = slurp(paths[1])
	passivesJSON = slurp(paths[2])
end

local itemsData = json.decode(itemsJSON)
if not (itemsData and itemsData.character) then
	fail("items JSON has no character info - is the profile public?")
end

-- HeadlessWrapper lags behind the render API Launch.lua expects; stub the
-- missing pieces so popup drawing during init doesn't crash.
function GetVirtualScreenSize()
	return 1920, 1080
end

-- HeadlessWrapper stubs Inflate as a no-op, NewFileSearch as nil and
-- GetScriptPath as "" — together those break the lazy-loaded Timeless Jewel
-- LUTs (Data/TimelessJewelData/*.zip are raw zlib streams, Glorious Vanity is
-- split across .zip.part*, and "" turns the data paths absolute). Characters
-- with a Timeless Jewel error out without real implementations. Jewel data
-- loads lazily during calcs, so installing these AFTER HeadlessWrapper.lua
-- (which would otherwise overwrite them) is safe; see installJewelSupport()
-- called below the dofile.
local zlibOk, zlib = pcall(require, "zlib")

local function installJewelSupport()
	function GetScriptPath()
		return "."
	end

	function Inflate(compressed)
		if not zlibOk then
			error("lua-zlib is not installed; cannot inflate Timeless Jewel data")
		end
		return (zlib.inflate()(compressed))
	end

	function NewFileSearch(spec)
		local paths = {}
		if spec:find("*", 1, true) then
			-- only pattern PoB uses: Name.zip.part* with sequential part numbers
			local prefix = spec:gsub("%*.*$", "")
			local part = 0
			while true do
				local f = io.open(prefix .. part, "rb")
				if not f then
					break
				end
				f:close()
				paths[#paths + 1] = prefix .. part
				part = part + 1
			end
		else
			local f = io.open(spec, "rb")
			if f then
				f:close()
				paths[1] = spec
			end
		end
		if #paths == 0 then
			return nil
		end
		local index = 1
		return {
			GetFileName = function()
				return paths[index]:match("[^/\\]+$")
			end,
			-- plain io can't stat files; report cached .bin extracts as newer
			-- than their .zip sources so PoB prefers them once written
			GetFileModifiedTime = function()
				return paths[index]:find("%.bin$") and 2 or 1
			end,
			NextFile = function()
				index = index + 1
				return index <= #paths
			end,
		}
	end
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

progress("booting PoB engine")
dofile("HeadlessWrapper.lua")
if not build then
	fail("PoB failed to initialise (no build object)")
end
installJewelSupport()

progress("loading character")
-- Same steps as HeadlessWrapper's loadBuildFromJSON, except lastLeague is set
-- first: ImportPassiveTreeAndJewels otherwise dereferences the GUI league
-- dropdown (a nil global when headless) as a fallback.
local ok, err = pcall(function()
	newBuild()
	build.importTab.lastLeague = itemsData.character.league or "Standard"
	local charData = build.importTab:ImportItemsAndSkills(itemsJSON)
	build.importTab:ImportPassiveTreeAndJewels(passivesJSON, charData)
end)
if not ok then
	fail("failed to load character: " .. tostring(err))
end
progress("character loaded")

local function frame()
	build.buildFlag = true
	runCallback("OnFrame")
	-- LuaJIT's GC is lazy and each recalculated frame churns tens of MB of
	-- garbage; collecting eagerly keeps peak RSS inside small containers
	collectgarbage("collect")
end

-- Only positive finite numbers are meaningful DPS values; PoB reports 0/nan
-- for groups with no damaging active skill.
local function dpsOf(output)
	local best = 0
	for _, key in ipairs({ "CombinedDPS", "FullDPS", "TotalDPS" }) do
		local v = output[key]
		if type(v) == "number" and v == v and v ~= math.huge and v > best then
			best = v
		end
	end
	return best
end

-- The JSON import leaves no main skill selected; try each socket group and
-- keep whichever yields the highest DPS, which is what poe.ninja shows too.
frame()
progress("initial frame done")
local groupCount = #build.skillsTab.socketGroupList
local bestIdx, bestDPS = nil, -1
for i = 1, groupCount do
	build.mainSocketGroup = i
	frame()
	local dps = dpsOf(build.calcsTab.mainOutput or {})
	progress(string.format("socket group %d/%d dps=%.0f", i, groupCount, dps))
	if dps > bestDPS then
		bestIdx, bestDPS = i, dps
	end
end
if bestIdx then
	build.mainSocketGroup = bestIdx
	frame()
end

local output = build.calcsTab.mainOutput or {}

local function num(v)
	if type(v) == "number" and v == v and v ~= math.huge and v ~= -math.huge then
		return v
	end
	return nil
end

local mainSkillName
local mainGroup = bestIdx and build.skillsTab.socketGroupList[bestIdx]
if mainGroup then
	mainSkillName = mainGroup.displayLabel or mainGroup.label
end

local result
if dumpAll then
	result = {}
	for k, v in pairs(output) do
		local t = type(v)
		if t == "string" or t == "boolean" then
			result[k] = v
		elseif t == "number" then
			result[k] = num(v)
		end
	end
else
	result = {
		character = {
			name = itemsData.character.name,
			class = itemsData.character.class,
			level = num(itemsData.character.level),
			league = itemsData.character.league,
		},
		mainSkill = mainSkillName,
		-- NOTE: key names below drift between PoB versions; run with --dump
		-- against a real character after bumping POB_VERSION to re-verify.
		combinedDPS = num(output.CombinedDPS),
		totalDPS = num(output.TotalDPS),
		fullDPS = num(output.FullDPS),
		totalDotDPS = num(output.TotalDotDPS),
		life = num(output.Life),
		lifeUnreserved = num(output.LifeUnreserved),
		energyShield = num(output.EnergyShield),
		mana = num(output.Mana),
		ward = num(output.Ward),
		totalEHP = num(output.TotalEHP),
		armour = num(output.Armour),
		evasion = num(output.Evasion),
		blockChance = num(output.BlockChance),
		spellBlockChance = num(output.SpellBlockChance),
		spellSuppressionChance = num(output.SpellSuppressionChance),
		fireResist = num(output.FireResist),
		coldResist = num(output.ColdResist),
		lightningResist = num(output.LightningResist),
		chaosResist = num(output.ChaosResist),
		critChance = num(output.CritChance),
		critMultiplier = num(output.CritMultiplier),
		attackSpeed = num(output.Speed),
	}
end

io.stdout:write(json.encode(result, { indent = false }) .. "\n")
