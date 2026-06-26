-- Match Predictor: row-level security for public.predictions.
--
-- Bug being fixed: authenticated fans could not submit predictions. The
-- `predictions` table had RLS enabled but no usable policy for normal users,
-- so every INSERT/UPDATE was rejected by Postgres. The submit handler also
-- chains `... .insert(...).select("id").single()`, which additionally needs a
-- SELECT policy to return the new row — without it the call errors even when
-- the row would otherwise be written. There is no time-lock in the app, so the
-- failure was purely this RLS gap.
--
-- These permissive policies let each fan read / create / update ONLY their own
-- rows (matched on auth.uid() = user_id). Permissive policies combine with OR,
-- so this is safe to add even if another policy already exists. Idempotent:
-- safe to run multiple times.

alter table public.predictions enable row level security;

-- Read own predictions — required for the prefill query and for the row
-- returned by `insert ... select`.
drop policy if exists "Users read own predictions" on public.predictions;
create policy "Users read own predictions"
  on public.predictions
  for select
  using (auth.uid() = user_id);

-- Create a prediction, but only as oneself.
drop policy if exists "Users insert own predictions" on public.predictions;
create policy "Users insert own predictions"
  on public.predictions
  for insert
  with check (auth.uid() = user_id);

-- Edit one's own prediction (the "Update Prediction" path).
drop policy if exists "Users update own predictions" on public.predictions;
create policy "Users update own predictions"
  on public.predictions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Admins can manage every prediction (e.g. awarding points after a match).
-- Mirrors the admin convention used by public.products.
drop policy if exists "Admins manage all predictions" on public.predictions;
create policy "Admins manage all predictions"
  on public.predictions
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
