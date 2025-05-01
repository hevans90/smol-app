package smoldata

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"poe"
	"strings"
)

func InsertLeague(ctx context.Context, q *Queries, league poe.League) (string, error) {
	var rules []map[string]interface{}
	for _, rule := range league.Rules {
		rules = append(rules, map[string]interface{}{
			"id":          rule.ID,
			"name":        rule.Name,
			"description": rule.Description,
		})
	}

	// If the rules slice is empty, make sure rulesJSON is an empty array
	var rulesJSON []byte
	if len(rules) > 0 {
		var err error
		rulesJSON, err = json.Marshal(rules)
		if err != nil {
			return "", err
		}
	} else {
		// Explicitly handle empty rules as an empty JSON array
		rulesJSON = []byte("[]")
	}

	// Map between structs
	params := InsertLeagueWithCategoryAndRulesParams{
		ID:          league.Category.ID,
		Current:     league.Category.Current,
		ID_2:        league.ID,
		Realm:       league.Realm,
		Url:         sql.NullString{String: league.URL, Valid: league.URL != ""},
		StartAt:     league.StartAt,
		EndAt:       league.EndAt,
		Description: sql.NullString{String: league.Description, Valid: league.Description != ""},
		RegisterAt:  league.RegisterAt,
		DelveEvent:  league.DelveEvent,
		Column11:    rulesJSON,
	}

	// Call the sqlc function
	leagueID, err := q.InsertLeagueWithCategoryAndRules(ctx, params)
	if err != nil {
		return "", err
	}

	return leagueID, nil
}

func MapLadderToCharacters(ladder poe.Ladder) []Character {
	var characters []Character

	for _, entry := range ladder.Entries {
		// Flatten the entry and map it to a Character struct
		character := Character{
			Rank:           int32(entry.Rank),
			PoeAccountName: entry.Account.Name,
			Name:           entry.Character.Name,
			Class:          entry.Character.Class,
			Level:          int32(entry.Character.Level),
			Experience:     int64(entry.Character.Experience),
			Retired:        entry.Retired,
			Dead:           entry.Dead,
			ID:             entry.Character.ID,
			Challenges:     int32(entry.Account.Challenges.Completed),
			Twitch:         sql.NullString{String: entry.Account.Twitch.Name, Valid: true},
		}
		// Append the flattened Character struct to the list
		characters = append(characters, character)
	}

	return characters
}

func InsertCharacters(db *sql.DB, characters []Character) (int32, error) {

	if len(characters) == 0 {
		return 0, nil // ✅ Gracefully handle empty character list
	}

	query := `
		INSERT INTO public."character" (
			rank, poe_account_name, name, class, level, experience, retired, dead, id, challenges, twitch
		) VALUES
	`

	var valueStrings []string

	for _, character := range characters {
		valueStrings = append(valueStrings, fmt.Sprintf(
			"(%d, '%s', '%s', '%s', %d, %d, %t, %t, '%s', %d, '%s')",
			character.Rank,
			character.PoeAccountName,
			character.Name,
			character.Class,
			character.Level,
			character.Experience,
			character.Retired,
			character.Dead,
			character.ID,
			character.Challenges,
			character.Twitch.String,
		))
	}

	// Join all the values into a single string, separating them by commas
	query += strings.Join(valueStrings, ",")

	// Add the "ON CONFLICT" part to handle the upsert
	query += `
		ON CONFLICT (id)
		DO UPDATE SET 
			rank = EXCLUDED.rank,
			poe_account_name = EXCLUDED.poe_account_name,
			name = EXCLUDED.name,
			class = EXCLUDED.class,
			level = EXCLUDED.level,
			experience = EXCLUDED.experience,
			retired = EXCLUDED.retired,
			dead = EXCLUDED.dead,
			challenges = EXCLUDED.challenges,
			twitch = EXCLUDED.twitch
		RETURNING id;
	`

	// Execute the query and get the result
	rows, err := db.Query(query)
	if err != nil {
		return 0, fmt.Errorf("error upserting characters: %v", err)
	}
	defer rows.Close()

	// Count the number of rows returned (which is the number of upserted characters)
	var insertedCount int32
	for rows.Next() {
		insertedCount++
	}

	// Check for any errors during iteration
	if err := rows.Err(); err != nil {
		return 0, fmt.Errorf("error iterating over result rows: %v", err)
	}

	// Return the number of inserted or updated characters
	return insertedCount, nil
}
