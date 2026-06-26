-- Predictor "kill switch": a single-row global settings table that lets an admin
-- turn the public Match Predictor on/off (e.g. during the off-season) and set
-- the message fans see while it's offline.
--
-- Single-row by design: the primary key is pinned to 1 by a CHECK constraint, so
-- there is exactly one settings record to read and update. Readers fetch
-- `... .eq('id', 1)`; the admin Server Action upserts that same id.

create table if not exists public.predictor_settings (
  id integer primary key default 1 check (id = 1),
  is_active boolean not null default false,
  offline_message text not null default 'Predictor coming soon.',
  updated_at timestamptz not null default now()
);

-- Seed the single row. ON CONFLICT DO NOTHING keeps this idempotent: re-running
-- the migration never clobbers a message/toggle an admin has already saved.
insert into public.predictor_settings (id, is_active, offline_message)
values (1, false, 'Predictor coming soon.')
on conflict (id) do nothing;

-- RLS. The row is public, non-sensitive display config the Fan Zone reads
-- anonymously, so SELECT is open to everyone. Writes are restricted to admins
-- (mirrors the admin convention used by public.predictions / public.products).
-- The admin Server Action writes via the service-role client, which bypasses
-- RLS, but these policies keep the table safe against direct anon/auth access.
alter table public.predictor_settings enable row level security;

drop policy if exists "Anyone can read predictor settings" on public.predictor_settings;
create policy "Anyone can read predictor settings"
  on public.predictor_settings
  for select
  using (true);

drop policy if exists "Admins manage predictor settings" on public.predictor_settings;
create policy "Admins manage predictor settings"
  on public.predictor_settings
  for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
