module smol-go-server

go 1.22.1

replace smoldata => ./data

replace poe => ./poe

require (
	poe v0.0.0-00010101000000-000000000000
	smoldata v0.0.0-00010101000000-000000000000
)

require (
	github.com/fatih/color v1.18.0 // indirect
	github.com/google/uuid v1.6.0 // indirect
	github.com/mattn/go-colorable v0.1.13 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/sqlc-dev/pqtype v0.3.0 // indirect
	golang.org/x/sys v0.26.0 // indirect
)

require (
	github.com/joho/godotenv v1.5.1
	github.com/lib/pq v1.10.9 // indirect
)
