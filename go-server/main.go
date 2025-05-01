package main

import (
	"context"
	"database/sql"
	"embed"
	"encoding/json"
	"html/template"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/fatih/color"
	"github.com/joho/godotenv"

	"poe"
	"smoldata"
)

//go:embed templates/*
var resources embed.FS

func jsonMarshal(v interface{}) string {
	bytes, err := json.MarshalIndent(v, "", "    ")
	if err != nil {
		return "{}"
	}
	return string(bytes)
}

func saveCharacters(ctx context.Context, db *sql.DB, queries *smoldata.Queries, green, red *color.Color) {
	tokenResponse := poe.GetToken()
	leagueResponse := poe.GetLeague(tokenResponse, "Very Smol Sentinels Found (PL55054)")

	leagueId, err := smoldata.InsertLeague(ctx, queries, leagueResponse.League)
	if err != nil {
		red.Printf("Could not save league: %v\n", err)
	} else {
		green.Printf("League %s saved successfully\n", leagueId)
	}

	leagueCharacters := smoldata.MapLadderToCharacters(leagueResponse.Ladder)
	numberInserted, err := smoldata.InsertCharacters(db, leagueCharacters)
	if err != nil {
		red.Printf("Could not save characters: %v\n", err)
	} else {
		green.Printf("%v characters saved successfully\n", numberInserted)
	}
}

func main() {
	green := color.New(color.FgGreen)
	red := color.New(color.FgRed)

	funcMap := template.FuncMap{"json": jsonMarshal}
	t := template.Must(template.New("").Funcs(funcMap).ParseFS(resources, "templates/*"))

	godotenv.Load("../.env")
	port := os.Getenv("GO_PORT")
	if port == "" {
		port = "8080"
	}

	db, err := smoldata.Connect()
	if err != nil {
		log.Fatalf("Could not connect to database: %v", err)
	}
	defer db.Close()

	queries := smoldata.New(db)
	ctx := context.Background()

	// Run initial character save immediately
	saveCharacters(ctx, db, queries, green, red)

	// Start periodic saving and countdown logging
	go func() {
		saveInterval := 5 * time.Minute
		countdownInterval := 30 * time.Second
		timeUntilNextSave := saveInterval

		log.Printf("Next character save in %v...", timeUntilNextSave) // ✅ Initial log

		countdownTicker := time.NewTicker(countdownInterval)
		saveTicker := time.NewTicker(saveInterval)
		defer countdownTicker.Stop()
		defer saveTicker.Stop()

		for {
			select {
			case <-countdownTicker.C:
				timeUntilNextSave -= countdownInterval
				if timeUntilNextSave > 0 {
					log.Printf("Next character save in %v...", timeUntilNextSave)
				}
			case <-saveTicker.C:
				saveCharacters(ctx, db, queries, green, red)
				timeUntilNextSave = saveInterval
				log.Printf("Next character save in %v...", timeUntilNextSave) // ✅ Reset log after saving
			}
		}
	}()

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		data := map[string]interface{}{
			"Region": os.Getenv("FLY_REGION"),
		}
		t.ExecuteTemplate(w, "index.html.tmpl", data)
	})

	if err := http.ListenAndServe(":"+port, nil); err != nil {
		panic(err)
	}
}
