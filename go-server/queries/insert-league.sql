-- name: InsertLeagueWithCategoryAndRules :one
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
    ) AS league_id;