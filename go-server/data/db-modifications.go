package smoldata

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"pob"
	"poe"
)

func InsertLeague(ctx context.Context, q *Queries, league poe.League) (string, error) {
	// a zero-value league means the GGG API call failed upstream; inserting
	// it would create a garbage empty-id row (this happened once in prod)
	if league.ID == "" {
		return "", fmt.Errorf("refusing to insert league with empty id")
	}

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

// InsertCharacterStats upserts one character's PoB-computed stats keyed by
// the ladder character id (one row per character, newest sweep wins).
func InsertCharacterStats(ctx context.Context, q *Queries, characterID string, stats *pob.Stats) error {
	params := UpsertCharacterStatsParams{
		CharacterID:            characterID,
		MainSkill:              sql.NullString{String: stats.MainSkill, Valid: stats.MainSkill != ""},
		CombinedDps:            stats.CombinedDPS,
		TotalDps:               stats.TotalDPS,
		FullDps:                stats.FullDPS,
		TotalDotDps:            stats.TotalDotDPS,
		Life:                   stats.Life,
		LifeUnreserved:         stats.LifeUnreserved,
		EnergyShield:           stats.EnergyShield,
		Mana:                   stats.Mana,
		Ward:                   stats.Ward,
		TotalEhp:               stats.TotalEHP,
		Armour:                 stats.Armour,
		Evasion:                stats.Evasion,
		BlockChance:            stats.BlockChance,
		SpellBlockChance:       stats.SpellBlockChance,
		SpellSuppressionChance: stats.SpellSuppressionChance,
		FireResist:             stats.FireResist,
		ColdResist:             stats.ColdResist,
		LightningResist:        stats.LightningResist,
		ChaosResist:            stats.ChaosResist,
		CritChance:             stats.CritChance,
		CritMultiplier:         stats.CritMultiplier,
		AttackSpeed:            stats.AttackSpeed,
	}

	return q.UpsertCharacterStats(ctx, params)
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

func InsertCharacters(db *sql.DB, characters []Character, leagueName string) (int32, error) {

	if len(characters) == 0 {
		return 0, nil // ✅ Gracefully handle empty character list
	}

	query := `
		INSERT INTO public."character" (
			rank, poe_account_name, name, class, level, experience, retired, dead, id, challenges, twitch, league
		) VALUES ` // Changed 'league_name' to 'league' here

	var valueStrings []string

	for _, character := range characters {
		valueStrings = append(valueStrings, fmt.Sprintf(
			"(%d, '%s', '%s', '%s', %d, %d, %t, %t, '%s', %d, '%s', '%s')",
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
			leagueName, // This value goes into the 'league' column
		))
	}

	query += strings.Join(valueStrings, ",")

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
			twitch = EXCLUDED.twitch,
			league = EXCLUDED.league -- Changed 'league_name' to 'league' here
		RETURNING id;`

	rows, err := db.Query(query)
	if err != nil {
		return 0, fmt.Errorf("error upserting characters: %v", err)
	}
	defer rows.Close()

	var insertedCount int32
	for rows.Next() {
		insertedCount++
	}

	if err := rows.Err(); err != nil {
		return 0, fmt.Errorf("error iterating over result rows: %v", err)
	}

	return insertedCount, nil
}
