ARG GO_VERSION=1
FROM golang:${GO_VERSION}-bookworm as builder

WORKDIR /usr/src/app

COPY . .
COPY go.mod go.sum ./
RUN go mod download
RUN go build -v -o /run-app .

FROM debian:bookworm

# LuaJIT (built from source: bookworm packages 2.1.0-beta3, which segfaults
# in PoB's calc and Timeless Jewel code) + a pinned Path of Building clone
# power the character stats sweep (the extract-stats.lua driver script is
# embedded in the Go binary).
# Keep POB_VERSION in sync with headless-pob/Dockerfile; bump each league.
ARG POB_VERSION=v2.65.0
COPY pob/_tools/inflate-lut.c /tmp/inflate-lut.c
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates zlib1g gcc libc6-dev make git zlib1g-dev \
 && git clone --depth 1 --branch v2.1 https://github.com/LuaJIT/LuaJIT.git /tmp/luajit \
 && make -C /tmp/luajit -j"$(nproc)" \
 && make -C /tmp/luajit install PREFIX=/usr/local \
 && ldconfig \
 && git clone --depth 1 --branch ${POB_VERSION} https://github.com/PathOfBuildingCommunity/PathOfBuilding.git /app/pob \
 && git clone --depth 1 https://github.com/starwing/luautf8.git /tmp/luautf8 \
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
