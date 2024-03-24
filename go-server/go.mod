module smol-go-server

go 1.22.1

replace smoldata => ./data

replace poe => ./poe

require (
	poe v0.0.0-00010101000000-000000000000
	smoldata v0.0.0-00010101000000-000000000000
)

require (
	github.com/joho/godotenv v1.5.1
	github.com/lib/pq v1.10.9 // indirect
)
