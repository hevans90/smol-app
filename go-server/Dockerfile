ARG GO_VERSION=1
FROM golang:${GO_VERSION}-bookworm as builder

WORKDIR /usr/src/app

COPY . .
COPY go.mod go.sum ./
RUN go mod download
RUN go build -v -o /run-app .

FROM debian:bookworm

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /run-app /usr/local/bin/
CMD ["run-app"]
