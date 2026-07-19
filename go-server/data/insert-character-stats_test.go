package smoldata

import (
	"context"
	"os"
	"testing"

	"pob"
)

// Exercises the real upsert against a database that has the character_stats
// migration applied. Skipped unless DATABASE_URL is set, e.g. the local
// docker-compose postgres:
//
//	DATABASE_URL="postgres://postgres:pw@localhost:5432/postgres?sslmode=disable" go test ./...
func TestInsertCharacterStats(t *testing.T) {
	if os.Getenv("DATABASE_URL") == "" {
		t.Skip("set DATABASE_URL to run against a migrated database")
	}

	db, err := Connect()
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	ctx := context.Background()
	queries := New(db)

	const characterID = "go-test-character-stats"
	if _, err := db.ExecContext(ctx, `
		INSERT INTO "character" (rank, poe_account_name, name, class, level, experience, retired, dead, id, challenges, twitch, league)
		VALUES (9999, 'TestAccount#0000', 'TestCharacter', 'Scion', 100, 0, false, false, $1, 0, '', 'TestLeague')
		ON CONFLICT (id) DO NOTHING`, characterID); err != nil {
		t.Fatal(err)
	}
	defer db.ExecContext(ctx, `DELETE FROM "character" WHERE id = $1`, characterID)

	stats := &pob.Stats{MainSkill: "Firestorm", CombinedDPS: 41862, Life: 4359, TotalEHP: 19962}
	if err := InsertCharacterStats(ctx, queries, characterID, stats); err != nil {
		t.Fatalf("initial insert: %v", err)
	}

	// Second write must take the upsert path and win.
	stats.CombinedDPS = 50000
	stats.MainSkill = ""
	if err := InsertCharacterStats(ctx, queries, characterID, stats); err != nil {
		t.Fatalf("upsert: %v", err)
	}

	var dps float64
	var mainSkill *string
	var updatedBumped bool
	row := db.QueryRowContext(ctx, `
		SELECT combined_dps, main_skill, updated_at > created_at FROM character_stats WHERE character_id = $1`, characterID)
	if err := row.Scan(&dps, &mainSkill, &updatedBumped); err != nil {
		t.Fatalf("row not found after upsert: %v", err)
	}
	if dps != 50000 {
		t.Errorf("combined_dps = %v, want 50000", dps)
	}
	if mainSkill != nil {
		t.Errorf("main_skill = %v, want NULL for empty skill", *mainSkill)
	}
	if !updatedBumped {
		t.Error("updated_at was not bumped by the update trigger")
	}
}
