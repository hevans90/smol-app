module smoldata

go 1.22.1

replace poe => ../poe

require (
	github.com/fatih/color v1.18.0
	github.com/google/uuid v1.6.0
	github.com/lib/pq v1.10.9
	github.com/sqlc-dev/pqtype v0.3.0
	poe v0.0.0-00010101000000-000000000000
)

require (
	github.com/mattn/go-colorable v0.1.13 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	golang.org/x/sys v0.25.0 // indirect
)
