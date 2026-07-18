# PoB needs a modern LuaJIT (2.1 rolling); the old akorn/luajit:2.1-alpine
# image ships 2.1.0-beta3 from 2017, which segfaults in PoB's calc code.
FROM alpine:3.21

RUN apk add --no-cache luajit git

# Pin to a PoB release matching the current game version; bump each league
# and re-verify stat key names with extract-stats.lua --dump.
ARG POB_VERSION=v2.65.0
RUN git clone --depth 1 --branch ${POB_VERSION} https://github.com/PathOfBuildingCommunity/PathOfBuilding.git /app

# PoB requires the lua-utf8 native module
RUN apk add --no-cache --virtual .build build-base luajit-dev \
 && git clone --depth 1 https://github.com/starwing/luautf8.git /tmp/luautf8 \
 && mkdir -p /usr/lib/lua/5.1 \
 && gcc -O2 -fPIC -I/usr/include/luajit-2.1 -shared /tmp/luautf8/lutf8lib.c -o /usr/lib/lua/5.1/lua-utf8.so \
 && rm -rf /tmp/luautf8 \
 && apk del .build

ENV LUA_PATH="/app/runtime/lua/?.lua;/app/runtime/lua/?/init.lua;;"

# Canonical script lives in the go-server pob module (it's embedded in the Go
# binary for production); build this image from the repo root:
#   docker build -f headless-pob/Dockerfile -t headless-pob .
COPY go-server/pob/extract-stats.lua /app/src/extract-stats.lua

WORKDIR /app/src

ENTRYPOINT ["luajit", "extract-stats.lua"]
CMD ["--stdin"]
