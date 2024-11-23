FROM akorn/luajit:2.1-alpine

RUN apk add --no-cache git

RUN git clone https://github.com/PathOfBuildingCommunity/PathOfBuilding.git /app

ENV LUA_PATH="/app/runtime/lua/?.lua;/app/runtime/lua/?/init.lua;;"

WORKDIR /app/src

CMD ["lua", "HeadlessWrapper.lua"]
