-- name: InsertLeagueWithCategoryAndRules :one
WITH new_category AS (
    INSERT INTO league_category (id, current)
    VALUES ($1, $2) ON CONFLICT (id) DO
    UPDATE
    SET current = EXCLUDED.current
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
        ) ON CONFLICT (id) DO
    UPDATE
    SET realm = EXCLUDED.realm,
        url = EXCLUDED.url,
        start_at = EXCLUDED.start_at,
        end_at = EXCLUDED.end_at,
        description = EXCLUDED.description,
        category_id = EXCLUDED.category_id,
        register_at = EXCLUDED.register_at,
        delve_event = EXCLUDED.delve_event
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
    FROM jsonb_to_recordset($11::jsonb) AS r(id TEXT, name TEXT, description TEXT) ON CONFLICT (id) DO
    UPDATE
    SET name = EXCLUDED.name,
        description = EXCLUDED.description,
        league_id = EXCLUDED.league_id
)
SELECT (
        SELECT id
        FROM new_league
    ) AS league_id;