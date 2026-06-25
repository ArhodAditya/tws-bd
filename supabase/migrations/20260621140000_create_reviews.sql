-- Fan Reviews: the `product_reviews` table lets signed-in fans rate and review
-- shop products. Public can read every review; an authenticated fan may only
-- post (and manage) reviews under their own user id.

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- Lookups are almost always "reviews for this product", newest first.
create index if not exists product_reviews_product_id_idx
  on public.product_reviews (product_id, created_at desc);

alter table public.product_reviews enable row level security;

-- Public storefront: anyone (incl. anon) may read reviews.
drop policy if exists "Reviews are viewable by everyone" on public.product_reviews;
create policy "Reviews are viewable by everyone"
  on public.product_reviews for select
  using (true);

-- Only an authenticated user may post a review, and only as themselves
-- (user_id must match their own auth id).
drop policy if exists "Users can insert their own reviews" on public.product_reviews;
create policy "Users can insert their own reviews"
  on public.product_reviews for insert
  to authenticated
  with check (auth.uid() = user_id);

-- A user may edit / delete only their own reviews.
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
