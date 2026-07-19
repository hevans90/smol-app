-- name: GetConfiguredLeague :one
SELECT league_name
FROM app_config
WHERE id = 1;
