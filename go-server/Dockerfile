ARG GO_VERSION=1
FROM golang:${GO_VERSION}-bookworm as builder

WORKDIR /usr/src/app

COPY . .
COPY go.mod go.sum ./
RUN go mod download
RUN go build -v -o /run-app .

FROM debian:bookworm

# luajit + a pinned Path of Building clone power the character stats sweep
# (the extract-stats.lua driver script is embedded in the Go binary).
# Keep POB_VERSION in sync with headless-pob/Dockerfile; bump each league.
ARG POB_VERSION=v2.65.0
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates luajit libluajit-5.1-dev gcc libc6-dev git \
 && git clone --depth 1 --branch ${POB_VERSION} https://github.com/PathOfBuildingCommunity/PathOfBuilding.git /app/pob \
 && git clone --depth 1 https://github.com/starwing/luautf8.git /tmp/luautf8 \
 && mkdir -p /usr/local/lib/lua/5.1 \
 && gcc -O2 -fPIC -I/usr/include/luajit-2.1 -shared /tmp/luautf8/lutf8lib.c -o /usr/local/lib/lua/5.1/lua-utf8.so \
 && rm -rf /tmp/luautf8 \
 && apt-get purge -y gcc libc6-dev libluajit-5.1-dev git \
 && apt-get autoremove -y \
 && rm -rf /var/lib/apt/lists/*

ENV LUA_PATH="/app/pob/runtime/lua/?.lua;/app/pob/runtime/lua/?/init.lua;;" \
    LUA_CPATH="/usr/local/lib/lua/5.1/?.so;;" \
    POB_SRC_DIR="/app/pob/src"

COPY --from=builder /run-app /usr/local/bin/
CMD ["run-app"]
