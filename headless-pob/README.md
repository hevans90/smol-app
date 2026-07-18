# headless-pob

Headless [Path of Building](https://github.com/PathOfBuildingCommunity/PathOfBuilding)
that computes character stats (DPS, EHP, life, ES, resists, ...) from the two
public GGG character-window API payloads and prints them as one JSON object on
stdout. This feeds the periodic stat-leaderboard job in `go-server`.

## Build

```sh
docker build -t headless-pob .
```

The PoB clone is pinned via `POB_VERSION` in the Dockerfile. PoB must match the
current game version or calcs error out — bump the tag each league, rebuild,
and re-verify the stat key names (see below).

## Run

Inputs are the raw responses of `character-window/get-items` and
`character-window/get-passive-skills` (public profiles only — private ones
return 403).

```sh
# file mode
docker run --rm -v "$PWD":/data headless-pob /data/items.json /data/passives.json

# stdin mode (default CMD): one object {"items": ..., "passives": ...}
docker run -i --rm headless-pob < combined.json
```

Output (~1.5 s per character):

```json
{"character":{"name":"...","class":"Scion","level":100,"league":"Standard"},
 "mainSkill":"Firestorm","combinedDPS":41861.7,"totalEHP":19961.9,"life":4359, ...}
```

The main skill is chosen by trying every socket group and keeping the highest
DPS, like poe.ninja. Errors print `{"error":"..."}` and exit 1. PoB's own log
output goes to stderr; stdout is always exactly one JSON document.
`POB_VERBOSE=1` adds per-stage progress to stderr.

## After bumping POB_VERSION

PoB's calc output keys drift between versions. Dump everything and check that
the curated keys in `extract-stats.lua` still exist:

```sh
docker run --rm -v "$PWD":/data headless-pob /data/items.json /data/passives.json --dump
```
