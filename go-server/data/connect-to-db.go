package smoldata

import (
	"database/sql"
	"errors"
	"fmt"
	"os"

	"github.com/fatih/color"

	_ "github.com/lib/pq"
)

// Connect establishes a new connection to the database and returns a *sql.DB instance.
func Connect() (*sql.DB, error) {
	green := color.New(color.FgGreen)

	dbUrl := os.Getenv("DATABASE_URL")
	if dbUrl == "" {
		return nil, errors.New("no database URL set in environment")
	}

	db, err := sql.Open("postgres", dbUrl)
	if err != nil {
		green.Print("connection failure\n")
		return nil, fmt.Errorf("failed to connect to the database: %w", err)
	}

	// Ping to ensure the connection is valid
	if err := db.Ping(); err != nil {
		green.Print("ping failure\n")
		return nil, fmt.Errorf("database ping failed: %w", err)
	}

	green.Print("Database connected successfully\n\n")
	return db, nil
}
