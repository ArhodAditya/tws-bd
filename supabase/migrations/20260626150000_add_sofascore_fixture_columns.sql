-- Sofascore fixture sync: store the external fixture id plus both teams so the
-- admin "Sync Latest Fixtures from Sofascore" action can upsert idempotently,
-- and so the Match Predictor can render real home/away sides with crest URLs
-- built dynamically from the team ids.
--
-- Additive and idempotent: existing club-vs-opponent columns (opponent,
-- opponent_logo_url, …) are left in place so manual rows and the demo fixture
-- keep working. `match_date` already exists; the add-if-not-exists is a no-op.

alter table public.matches
  add column if not exists api_fixture_id integer,
  add column if not exists home_team_id integer,
  add column if not exists home_team_name text,
  add column if not exists away_team_id integer,
  add column if not exists away_team_name text,
  add column if not exists match_date timestamptz;

-- A unique index is required for upsert(..., { onConflict: 'api_fixture_id' }).
-- Existing rows keep api_fixture_id = NULL; Postgres treats NULLs as distinct,
-- so legacy/manual rows never collide. Synced rows always carry a non-null id.
create unique index if not exists matches_api_fixture_id_key
  on public.matches (api_fixture_id);
