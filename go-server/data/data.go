package smoldata

import (
	"database/sql"
	"errors"
	"fmt"
	"os"

	"github.com/fatih/color"

	_ "github.com/lib/pq"
)

var db *sql.DB

// This function will make a connection to the database only once.
func Connect() {
	var err error
	green := color.New(color.FgGreen)

	dbUrl := os.Getenv("DATABASE_URL")
	if dbUrl == "" {
		msg := "no database url set in env"
		err = errors.New(msg)
		panic(err)
	}

	db, err = sql.Open("postgres", dbUrl)

	fmt.Print("Database: ")
	if err != nil {
		green.Print("connection failure\n")
		panic(err)
	}

	if err = db.Ping(); err != nil {
		green.Print("ping failure\n")
		panic(err)
	}

	green.Print("success\n\n")
}
