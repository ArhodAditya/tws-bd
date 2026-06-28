-- Fan Reviews: the public "Voices of the Madridistas" wall, moved off the
-- static About page onto the Fans Zone and turned into a user-submitted review
-- system. A signed-in fan submits a short review; it is created UNAPPROVED and
-- stays hidden from the public wall until an admin approves it (is_approved).
--
-- Mirrors the RLS conventions in 20260621140000_create_reviews.sql (own-row
-- inserts) and 20260626140000_predictions_rls.sql (the admin "exists on
-- profiles with role = admin" gate). Idempotent: safe to run multiple times.

create table if not exists public.fan_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  review_text text not null,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- The public wall reads "approved reviews, newest first"; the admin moderation
-- queue reads "everything, newest first". Both are served by this index.
create index if not exists fan_reviews_approved_created_idx
  on public.fan_reviews (is_approved, created_at desc);

alter table public.fan_reviews enable row level security;

-- Public wall: anyone (incl. anon) may read ONLY approved reviews. Pending
-- reviews are invisible to everyone except admins (policy below).
drop policy if exists "Approved reviews are viewable by everyone" on public.fan_reviews;
create policy "Approved reviews are viewable by everyone"
  on public.fan_reviews for select
  using (is_approved = true);

-- A signed-in fan may submit a review, but only as themselves. New rows default
-- to is_approved = false, so a fan can never self-publish to the wall.
drop policy if exists "Users can insert their own reviews" on public.fan_reviews;
create policy "Users can insert their own reviews"
  on public.fan_reviews for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Admins can read EVERY review (incl. pending ones) for the moderation queue.
-- Permissive SELECT policies combine with OR, so this widens visibility for
-- admins without affecting the public "approved only" rule above.
drop policy if exists "Admins can read all reviews" on public.fan_reviews;
create policy "Admins can read all reviews"
  on public.fan_reviews for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Admins can approve / unapprove any review (flip is_approved).
drop policy if exists "Admins can update reviews" on public.fan_reviews;
create policy "Admins can update reviews"
  on public.fan_reviews for update
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
