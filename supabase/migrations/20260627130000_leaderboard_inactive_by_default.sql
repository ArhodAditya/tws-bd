-- Enforce "inactive by default" for the public Fan Zone leaderboard.
--
-- Bug: new accounts were auto-appearing on the leaderboard. Root cause — the
-- column was originally created with `default true`
-- (see 20260626130000_add_show_on_leaderboard.sql), so every freshly-inserted
-- profile that doesn't specify the flag inherits `true`. Flip the default so new
-- profiles are hidden until an admin explicitly opts them in from the
-- "Leaderboard Visibility" panel (which performs an UPDATE, not an INSERT, and
-- is therefore unaffected by this change).
alter table public.profiles
  alter column show_on_leaderboard set default false;

-- NOTE — existing rows are intentionally left untouched. At the data level a
-- value of `true` from the old default is indistinguishable from `true` set by
-- an admin, so mass-resetting would wrongly hide accounts an admin curated. Only
-- the default for future inserts changes here.

-- Auth trigger — inspected & cleared (2026-06-27):
-- The live profile-creation trigger, public.handle_new_user(), inserts only
-- (id, full_name, avatar_url, role) and does NOT reference show_on_leaderboard.
-- New profiles therefore inherit the column default set above, so flipping that
-- default to false is the complete fix — no function rewrite is required.
--
-- That trigger is dashboard-created and lives only in the live database, not in
-- this repo. To re-verify its full definition:
--
--     select pg_get_functiondef('public.handle_new_user()'::regprocedure);
