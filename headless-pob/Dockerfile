# PoB needs a modern LuaJIT (2.1 rolling); the old akorn/luajit:2.1-alpine
# image ships 2.1.0-beta3 from 2017, which segfaults in PoB's calc code.
FROM alpine:3.21

RUN apk add --no-cache luajit git zlib

# Pin to a PoB release matching the current game version; bump each league
# and re-verify stat key names with extract-stats.lua --dump.
ARG POB_VERSION=v2.65.0
RUN git clone --depth 1 --branch ${POB_VERSION} https://github.com/PathOfBuildingCommunity/PathOfBuilding.git /app

# PoB requires the lua-utf8 native module; lua-zlib provides a runtime
# Inflate. The Timeless Jewel lookup tables are pre-extracted to .bin here
# because inflating them at runtime segfaults old LuaJIT builds.
COPY go-server/pob/_tools/inflate-lut.c /tmp/inflate-lut.c
RUN apk add --no-cache --virtual .build build-base luajit-dev zlib-dev \
 && git clone --depth 1 https://github.com/starwing/luautf8.git /tmp/luautf8 \
 && git clone --depth 1 --branch v1.2 https://github.com/brimworks/lua-zlib.git /tmp/luazlib \
 && mkdir -p /usr/lib/lua/5.1 \
 && gcc -O2 -fPIC -I/usr/include/luajit-2.1 -shared /tmp/luautf8/lutf8lib.c -o /usr/lib/lua/5.1/lua-utf8.so \
 && gcc -O2 -fPIC -I/usr/include/luajit-2.1 -shared /tmp/luazlib/lua_zlib.c -lz -o /usr/lib/lua/5.1/zlib.so \
 && gcc -O2 -o /tmp/inflate-lut /tmp/inflate-lut.c -lz \
 && cd /app/src/Data/TimelessJewelData \
 && for z in *.zip; do /tmp/inflate-lut < "$z" > "${z%.zip}.bin"; done \
 && cat GloriousVanity.zip.part* | /tmp/inflate-lut > GloriousVanity.bin \
 && rm -f *.zip *.zip.part* /tmp/inflate-lut /tmp/inflate-lut.c \
 && rm -rf /tmp/luautf8 /tmp/luazlib \
 && apk del .build

ENV LUA_PATH="/app/runtime/lua/?.lua;/app/runtime/lua/?/init.lua;;"

# Canonical script lives in the go-server pob module (it's embedded in the Go
# binary for production); build this image from the repo root:
#   docker build -f headless-pob/Dockerfile -t headless-pob .
COPY go-server/pob/extract-stats.lua /app/src/extract-stats.lua

WORKDIR /app/src

ENTRYPOINT ["luajit", "extract-stats.lua"]
CMD ["--stdin"]
