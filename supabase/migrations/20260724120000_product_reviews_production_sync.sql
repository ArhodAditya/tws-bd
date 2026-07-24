-- product_reviews — production-truth sync.
--
-- The earlier 20260621140000_create_reviews.sql created this table + its
-- own-row policies, but production drifted (the table went missing and was
-- re-provisioned by hand). This migration captures the CURRENT live schema in
-- full so the repo matches production: table, index, PostgREST grants, RLS
-- (own-row policies + an admin-moderation policy built on the SECURITY DEFINER
-- public.is_admin() helper, NOT an inline profiles.role check), and the
-- one-review-per-product unique constraint. Fully idempotent.

-- 1. Table -------------------------------------------------------------------
create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- 2. Index — lookups are almost always "reviews for this product, newest first".
create index if not exists product_reviews_product_id_idx
  on public.product_reviews (product_id, created_at desc);

-- 3. One review per (product, user). Guarded so re-runs don't error.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'product_reviews_product_id_user_id_key'
  ) then
    alter table public.product_reviews
      add constraint product_reviews_product_id_user_id_key
      unique (product_id, user_id);
  end if;
end $$;

-- 4. Grants — RLS filters rows, but PostgREST still needs table-level access.
grant select on public.product_reviews to anon, authenticated;
grant insert, update, delete on public.product_reviews to authenticated;

-- 5. RLS ---------------------------------------------------------------------
alter table public.product_reviews enable row level security;

-- Public storefront: anyone (incl. anon) may read reviews.
drop policy if exists "Reviews are viewable by everyone" on public.product_reviews;
create policy "Reviews are viewable by everyone"
  on public.product_reviews for select
  using (true);

-- A signed-in fan may post a review, but only as themselves.
drop policy if exists "Users can insert their own reviews" on public.product_reviews;
create policy "Users can insert their own reviews"
  on public.product_reviews for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ...and may edit / delete only their own.
drop policy if exists "Users can update their own reviews" on public.product_reviews;
create policy "Users can update their own reviews"
  on public.product_reviews for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own reviews" on public.product_reviews;
create policy "Users can delete their own reviews"
  on public.product_reviews for delete
  to authenticated
  using (auth.uid() = user_id);

-- Admin moderation — SECURITY DEFINER is_admin() so it survives SELECT (role)
-- being revoked from authenticated.
drop policy if exists "Admins manage product reviews" on public.product_reviews;
create policy "Admins manage product reviews"
  on public.product_reviews for all
  using (public.is_admin())
  with check (public.is_admin());
