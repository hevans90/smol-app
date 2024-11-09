package smoldata

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"poe"
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

	fmt.Print(rules, rulesJSON)

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
