ARG GO_VERSION=1
FROM golang:${GO_VERSION}-bookworm as builder

WORKDIR /usr/src/app

COPY . .
COPY go.mod go.sum ./
RUN go mod download
RUN go build -v -o /run-app .

FROM debian:bookworm

# LuaJIT (built from source at a pinned commit: bookworm packages
# 2.1.0-beta3, which segfaults in PoB's calc and Timeless Jewel code) + a pinned Path of Building clone
# power the character stats sweep (the extract-stats.lua driver script is
# embedded in the Go binary).
# Keep POB_VERSION in sync with headless-pob/Dockerfile; bump each league.
ARG POB_VERSION=v2.66.2
# LuaJIT has no releases, only the rolling v2.1 branch, so it MUST be pinned
# to a commit: building from the branch tip broke every PoB run in production
# on 2026-11-11, after a lexer change (c41d727d, 2026-10-20) stopped LuaJIT
# skipping a leading "#" line, which PoB's HeadlessWrapper.lua and Launch.lua
# both start with ("#@"). This is the tip as of the last known-good build
# (2026-07-28). Before bumping it, run a character through the built image.
ARG LUAJIT_COMMIT=faaf663340347a78b22ed94c63c24fe090bd9784
# luautf8 is pinned for the same reason (reproducible builds), to the commit
# that was current when the pin was added.
ARG LUAUTF8_COMMIT=a47b1433473a2509d77ad28f59a976716d187927
COPY pob/_tools/inflate-lut.c /tmp/inflate-lut.c
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates zlib1g gcc libc6-dev make git zlib1g-dev \
 && git init -q /tmp/luajit \
 && git -C /tmp/luajit fetch -q --depth 1 https://github.com/LuaJIT/LuaJIT.git ${LUAJIT_COMMIT} \
 && git -C /tmp/luajit checkout -q FETCH_HEAD \
 && make -C /tmp/luajit -j"$(nproc)" \
 && make -C /tmp/luajit install PREFIX=/usr/local \
 && ldconfig \
 && git clone --depth 1 --branch ${POB_VERSION} https://github.com/PathOfBuildingCommunity/PathOfBuilding.git /app/pob \
 && git init -q /tmp/luautf8 \
 && git -C /tmp/luautf8 fetch -q --depth 1 https://github.com/starwing/luautf8.git ${LUAUTF8_COMMIT} \
 && git -C /tmp/luautf8 checkout -q FETCH_HEAD \
 && git clone --depth 1 --branch v1.2 https://github.com/brimworks/lua-zlib.git /tmp/luazlib \
 && mkdir -p /usr/local/lib/lua/5.1 \
 && gcc -O2 -fPIC -I/usr/local/include/luajit-2.1 -shared /tmp/luautf8/lutf8lib.c -o /usr/local/lib/lua/5.1/lua-utf8.so \
 && gcc -O2 -fPIC -I/usr/local/include/luajit-2.1 -shared /tmp/luazlib/lua_zlib.c -lz -o /usr/local/lib/lua/5.1/zlib.so \
 # pre-extract the Timeless Jewel LUTs so the first character with each
 # jewel doesn't pay the inflate cost
 && gcc -O2 -o /tmp/inflate-lut /tmp/inflate-lut.c -lz \
 && cd /app/pob/src/Data/TimelessJewelData \
 && for z in *.zip; do /tmp/inflate-lut < "$z" > "${z%.zip}.bin"; done \
 && cat GloriousVanity.zip.part* | /tmp/inflate-lut > GloriousVanity.bin \
 && rm -f *.zip *.zip.part* /tmp/inflate-lut /tmp/inflate-lut.c \
 && rm -rf /tmp/luautf8 /tmp/luazlib /tmp/luajit \
 && apt-get purge -y gcc libc6-dev make git zlib1g-dev \
 && apt-get autoremove -y \
 && rm -rf /var/lib/apt/lists/*

ENV LUA_PATH="/app/pob/runtime/lua/?.lua;/app/pob/runtime/lua/?/init.lua;;" \
    LUA_CPATH="/usr/local/lib/lua/5.1/?.so;;" \
    POB_SRC_DIR="/app/pob/src"

COPY --from=builder /run-app /usr/local/bin/
CMD ["run-app"]
