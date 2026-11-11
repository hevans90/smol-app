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
	"sync"
	"time"

	"github.com/fatih/color"
	"github.com/joho/godotenv"
	"github.com/lib/pq"

	"pob"
	"poe"
	"smoldata"
)

// Fallback when the app_config table has no row yet; admins manage the
// active league from the frontend admin section at runtime.
const defaultLeagueName = "SDRT Smol Djinn Rescue Team (PL78726)"

// This server only computes PoB character stats. The ladder itself (the
// league and character tables) is written by the scheduled Netlify function
// netlify/functions/sync-ladder.ts every 5 minutes — deliberately the single
// writer, so league membership never depends on this process staying up.
// character_stats rows reference character rows, so a character that has
// only just appeared on the ladder cannot be saved until that sync has
// stored it; it is simply picked up by the next sweep.
const (
	// The sweep makes 2 character-window requests per public character, and
	// GGG rate-limits those per IP, so it runs far less often than the
	// ladder sync.
	statsInterval = 30 * time.Minute
	// Short pause after boot before the first sweep.
	statsInitialDelay = 150 * time.Second
	// After an admin switches league, wait for the ladder sync (every 5
	// minutes) to have stored the new league's characters before sweeping
	// them; starting immediately would fail every stats insert on the
	// missing character rows.
	leagueChangeSettleDelay = 6 * time.Minute
	// Pause after every character-window request (~40 requests/minute).
	characterWindowDelay = 1500 * time.Millisecond
	// PoB itself only needs single-digit seconds of actual CPU time per
	// character (measured via cmd.ProcessState rusage), but on Fly's shared
	// vCPU tier a run can spend the vast majority of its wall-clock time
	// descheduled/waiting for CPU rather than computing (observed as low as
	// ~7-9% utilisation) — so the timeout needs enough wall-clock headroom to
	// absorb that contention, not just the actual compute cost.
	pobTimeout = 3 * time.Minute
	// A run that times out isn't necessarily doing anything wrong — it may
	// have just lost the CPU-scheduling lottery — so retry once before
	// giving up on the character for this sweep.
	pobMaxAttempts = 2
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

// listenForConfigChanges emits the new league name whenever an admin updates
// app_config (postgres NOTIFY from the notify_app_config_changed trigger),
// letting a league change take effect immediately instead of on the next poll.
func listenForConfigChanges(red *color.Color) <-chan string {
	changes := make(chan string, 1)

	listener := pq.NewListener(os.Getenv("DATABASE_URL"), 10*time.Second, time.Minute, nil)
	if err := listener.Listen("app_config_changed"); err != nil {
		red.Printf("Could not listen for app config changes: %v\n", err)
		return changes
	}

	go func() {
		for notification := range listener.Notify {
			if notification == nil {
				continue // reconnect marker
			}
			select {
			case changes <- notification.Extra:
			default: // a resync is already pending
			}
		}
	}()

	return changes
}

// configuredLeague reads the admin-managed league from app_config, falling
// back to the compiled-in default so a fresh database still works.
func configuredLeague(ctx context.Context, queries *smoldata.Queries) string {
	league, err := queries.GetConfiguredLeague(ctx)
	if err != nil || league == "" {
		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			log.Printf("Could not read configured league, using default: %v", err)
		}
		return defaultLeagueName
	}
	return league
}

// computeCharacterStats walks the current ladder, runs every public character
// through headless PoB, and upserts the results into character_stats
// (Hasura exposes that table to the frontend). Returns how many were saved.
func computeCharacterStats(ctx context.Context, queries *smoldata.Queries, runner *pob.Runner, green, red *color.Color) int {
	leagueName := configuredLeague(ctx, queries)
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
		// The league can change mid-sweep (a full sweep of a large ladder
		// takes well over an hour) — without this check we'd keep grinding
		// through the OLD league's characters long after the admin has
		// already switched to a new one, which is exactly backwards for a
		// pre-season league with zero real characters yet.
		if ctx.Err() != nil {
			return saved
		}

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

		var stats *pob.Stats
		var err error
		for attempt := 1; attempt <= pobMaxAttempts; attempt++ {
			pobCtx, cancel := context.WithTimeout(ctx, pobTimeout)
			stats, err = runner.Compute(pobCtx, entry.Character.Name, items, passives)
			cancel()
			if err == nil {
				break
			}
			if attempt < pobMaxAttempts {
				log.Printf("PoB failed for %s (attempt %d/%d), retrying: %v\n", entry.Character.Name, attempt, pobMaxAttempts, err)
			}
		}
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

	configChanges := listenForConfigChanges(red)
	statsKick := make(chan struct{}, 1)

	// Guards the cancel func for whichever PoB sweep is currently running (if
	// any), so a league change can abort it immediately instead of letting it
	// grind through a now-stale league for up to another hour+.
	var sweepMu sync.Mutex
	cancelCurrentSweep := func() {}
	abortSweepInProgress := func() {
		sweepMu.Lock()
		defer sweepMu.Unlock()
		cancelCurrentSweep()
	}

	// React to league changes: stop sweeping the old league at once, then
	// start on the new one after the ladder sync has had time to store it.
	go func() {
		for league := range configChanges {
			green.Printf("League changed to %s, stats sweep restarts in %v\n", league, leagueChangeSettleDelay)
			abortSweepInProgress()
			time.AfterFunc(leagueChangeSettleDelay, func() {
				select {
				case statsKick <- struct{}{}:
				default: // a restart is already pending
				}
			})
		}
	}()

	// Periodic PoB stat computation, much less frequent than the ladder poll.
	statsRunner := pob.NewRunnerFromEnv()
	if statsRunner.Available() {
		go func() {
			time.Sleep(statsInitialDelay)
			for {
				sweepCtx, cancelSweep := context.WithCancel(ctx)
				sweepMu.Lock()
				cancelCurrentSweep = cancelSweep
				sweepMu.Unlock()

				started := time.Now()
				saved := computeCharacterStats(sweepCtx, queries, statsRunner, green, red)
				if sweepCtx.Err() != nil {
					green.Printf("PoB sweep aborted after %v (league changed mid-sweep; %d characters saved before abort)\n", time.Since(started).Round(time.Second), saved)
				} else {
					green.Printf("Saved PoB stats for %d characters in %v\n", saved, time.Since(started).Round(time.Second))
				}
				cancelSweep()

				select {
				case <-time.After(statsInterval):
				case <-statsKick:
					green.Printf("League changed, starting stats sweep for the new league\n")
				}
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
