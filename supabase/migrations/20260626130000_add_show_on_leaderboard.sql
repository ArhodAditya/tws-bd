-- Add a visibility flag controlling whether an account appears on the public
-- Fan Zone leaderboard. Admins toggle this from the user-management panel.
--
-- Defaults to true so every existing account stays visible; NOT NULL keeps the
-- public query and admin toggle simple (no null handling).
alter table public.profiles
  add column if not exists show_on_leaderboard boolean not null default true;
