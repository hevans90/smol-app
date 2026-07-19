package main

import (
	"context"
	"database/sql"
	"embed"
	"encoding/json"
	"errors"
	"html/template"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/fatih/color"
	"github.com/joho/godotenv"

	"pob"
	"poe"
	"smoldata"
)

const leagueName = "SDRT Smol Djinn Rescue Team (PL78726)"

const (
	// Character stats are computed much less often than the 5-minute ladder
	// poll: the sweep makes 2 character-window requests per public character,
	// and GGG rate-limits those per IP.
	statsInterval = 30 * time.Minute
	// Offset the first sweep from the 5-minute ladder ticks.
	statsInitialDelay = 150 * time.Second
	// Pause after every character-window request (~40 requests/minute).
	characterWindowDelay = 1500 * time.Millisecond
	// One PoB run takes ~1.5s; leave lots of headroom.
	pobTimeout = 90 * time.Second
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
	leagueResponse := poe.GetLeague(tokenResponse, leagueName)

	leagueId, err := smoldata.InsertLeague(ctx, queries, leagueResponse.League)
	if err != nil {
		red.Printf("Could not save league: %v\n", err)
	} else {
		green.Printf("League %s saved successfully\n", leagueId)
	}

	leagueCharacters := smoldata.MapLadderToCharacters(leagueResponse.Ladder)
	numberInserted, err := smoldata.InsertCharacters(db, leagueCharacters, leagueName)
	if err != nil {
		red.Printf("Could not save characters: %v\n", err)
	} else {
		green.Printf("%v characters saved successfully\n", numberInserted)
	}
}

// computeCharacterStats walks the current ladder, runs every public character
// through headless PoB, and upserts the results into character_stats
// (Hasura exposes that table to the frontend). Returns how many were saved.
func computeCharacterStats(ctx context.Context, queries *smoldata.Queries, runner *pob.Runner, green, red *color.Color) int {
	tokenResponse := poe.GetToken()
	leagueResponse := poe.GetLeague(tokenResponse, leagueName)

	fetch := func(get func(string, string) (json.RawMessage, error), account, character string) (json.RawMessage, bool) {
		payload, err := get(account, character)
		time.Sleep(characterWindowDelay)
		var rateLimited *poe.RateLimitedError
		if errors.As(err, &rateLimited) {
			log.Printf("Rate limited fetching %s, backing off %v", character, rateLimited.RetryAfter)
			time.Sleep(rateLimited.RetryAfter)
			return nil, false
		}
		if err != nil {
			// Private profiles and vanished characters are expected; skip quietly.
			if !errors.Is(err, poe.ErrProfilePrivate) && !errors.Is(err, poe.ErrCharacterNotFound) {
				red.Printf("Could not fetch data for %s: %v\n", character, err)
			}
			return nil, false
		}
		return payload, true
	}

	saved := 0
	for _, entry := range leagueResponse.Ladder.Entries {
		if !entry.Public {
			continue
		}

		items, ok := fetch(poe.GetCharacterItems, entry.Account.Name, entry.Character.Name)
		if !ok {
			continue
		}
		passives, ok := fetch(poe.GetCharacterPassives, entry.Account.Name, entry.Character.Name)
		if !ok {
			continue
		}

		pobCtx, cancel := context.WithTimeout(ctx, pobTimeout)
		stats, err := runner.Compute(pobCtx, items, passives)
		cancel()
		if err != nil {
			red.Printf("PoB failed for %s: %v\n", entry.Character.Name, err)
			continue
		}

		if err := smoldata.InsertCharacterStats(ctx, queries, entry.Character.ID, stats); err != nil {
			red.Printf("Could not save stats for %s: %v\n", entry.Character.Name, err)
			continue
		}
		green.Printf("Stats for %s (%s): DPS=%.0f EHP=%.0f Life=%.0f ES=%.0f\n",
			stats.Character.Name, stats.MainSkill, stats.CombinedDPS, stats.TotalEHP, stats.Life, stats.EnergyShield)
		saved++
	}
	return saved
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

	// Periodic PoB stat computation, much less frequent than the ladder poll.
	statsRunner := pob.NewRunnerFromEnv()
	if statsRunner.Available() {
		go func() {
			time.Sleep(statsInitialDelay)
			for {
				started := time.Now()
				saved := computeCharacterStats(ctx, queries, statsRunner, green, red)
				green.Printf("Saved PoB stats for %d characters in %v\n", saved, time.Since(started).Round(time.Second))
				time.Sleep(statsInterval)
			}
		}()
	} else {
		log.Printf("PoB runner not available (set POB_COMMAND or POB_SRC_DIR); skipping character stats")
	}

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
