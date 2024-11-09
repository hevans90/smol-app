// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.27.0
// source: insert-league.sql

package smoldata

import (
	"context"
	"database/sql"
	"encoding/json"
	"time"
)

const insertLeagueWithCategoryAndRules = `-- name: InsertLeagueWithCategoryAndRules :one
WITH new_category AS (
    INSERT INTO league_category (id, current)
    VALUES ($1, $2)
    RETURNING id
),
new_league AS (
    INSERT INTO league (
            id,
            realm,
            url,
            start_at,
            end_at,
            description,
            category_id,
            register_at,
            delve_event
        )
    VALUES (
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            (
                SELECT id
                FROM new_category
            ),
            $9,
            $10
        )
    RETURNING id
),
rule_inserts AS (
    INSERT INTO league_rules (id, name, description, league_id)
    SELECT r.id,
        r.name,
        r.description,
        (
            SELECT id
            FROM new_league
        )
    FROM jsonb_to_recordset($11::jsonb) AS r(id TEXT, name TEXT, description TEXT)
)
SELECT (
        SELECT id
        FROM new_league
    ) AS league_id
`

type InsertLeagueWithCategoryAndRulesParams struct {
	ID          string
	Current     bool
	ID_2        string
	Realm       string
	Url         sql.NullString
	StartAt     time.Time
	EndAt       time.Time
	Description sql.NullString
	RegisterAt  time.Time
	DelveEvent  bool
	Column11    json.RawMessage
}

func (q *Queries) InsertLeagueWithCategoryAndRules(ctx context.Context, arg InsertLeagueWithCategoryAndRulesParams) (string, error) {
	row := q.db.QueryRowContext(ctx, insertLeagueWithCategoryAndRules,
		arg.ID,
		arg.Current,
		arg.ID_2,
		arg.Realm,
		arg.Url,
		arg.StartAt,
		arg.EndAt,
		arg.Description,
		arg.RegisterAt,
		arg.DelveEvent,
		arg.Column11,
	)
	var league_id string
	err := row.Scan(&league_id)
	return league_id, err
}
