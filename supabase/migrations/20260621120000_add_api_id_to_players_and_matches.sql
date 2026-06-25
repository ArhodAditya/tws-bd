-- Add an external identifier (the API-Football integer id) to `players` and
-- `matches` so the football sync cron (app/api/cron/sync-football) can upsert
-- idempotently on a stable key instead of generating duplicate UUID rows on
-- every run.

alter table public.players
  add column if not exists api_id bigint;

alter table public.matches
  add column if not exists api_id bigint;

-- A unique index is required for `upsert(..., { onConflict: 'api_id' })`.
-- Existing rows keep api_id = NULL; Postgres treats NULLs as distinct, so any
-- legacy rows won't collide. Newly synced rows always carry a non-null api_id.
create unique index if not exists players_api_id_key on public.players (api_id);
create unique index if not exists matches_api_id_key on public.matches (api_id);
