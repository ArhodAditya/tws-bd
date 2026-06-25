-- Shop: the `products` table (jerseys, turf trainers, footballs), row-level
-- security, and a small starter catalogue so the storefront isn't empty on
-- first load.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric not null default 0,
  category text not null default 'jersey'
    check (category in ('jersey', 'turf', 'football')),
  images text[] not null default '{}',
  sizes text[] not null default '{}',
  in_stock boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

-- Public storefront: anyone (incl. anon) may read products.
drop policy if exists "Products are viewable by everyone" on public.products;
create policy "Products are viewable by everyone"
  on public.products for select
  using (true);

-- Only admins may create / update / delete products.
drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products"
  on public.products for all
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

-- Starter catalogue. Inserted only when the table is empty, so this migration
-- is safe to re-run and won't duplicate or clobber admin-added products.
insert into public.products (name, description, price, category, images, sizes, in_stock)
select
  v.name, v.description, v.price, v.category, v.images, v.sizes, v.in_stock
from (
  values
    (
      'Real Madrid 2025/26 Home Jersey'::text,
      'The legendary all-white home kit for the 2025/26 campaign — embroidered crest, gold trim, and tournament-grade fabric worthy of European royalty.'::text,
      4500::numeric,
      'jersey'::text,
      array['https://placehold.co/800x800/050814/d4af37.png?text=Home+Jersey']::text[],
      array['S', 'M', 'L', 'XL', 'XXL']::text[],
      true
    ),
    (
      'Real Madrid 2025/26 Away Jersey',
      'Make a statement on the road in the 2025/26 away kit — bold, modern, and unmistakably Madrid. Lightweight, breathable, built for the faithful.',
      4500,
      'jersey',
      array['https://placehold.co/800x800/0a0f24/efdd9e.png?text=Away+Jersey'],
      array['S', 'M', 'L', 'XL', 'XXL'],
      true
    ),
    (
      'Blanco Pro Turf Trainers',
      'Dominate the small-sided game in these premium turf trainers — responsive grip, a locked-in fit, and a sleek midnight-and-gold finish.',
      6200,
      'turf',
      array['https://placehold.co/800x800/111733/d4af37.png?text=Turf+Trainers'],
      array['7', '8', '9', '10', '11'],
      true
    ),
    (
      'Los Blancos Pro Match Football',
      'Official-grade match football with true flight and a premium touch — the only ball worthy of your Bernabéu dreams.',
      3200,
      'football',
      array['https://placehold.co/800x800/050814/e3c66e.png?text=Match+Ball'],
      array[]::text[],
      true
    )
) as v(name, description, price, category, images, sizes, in_stock)
where not exists (select 1 from public.products);
