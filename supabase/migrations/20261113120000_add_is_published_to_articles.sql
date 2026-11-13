-- News soft-delete: an admin-controlled publish flag on articles.
--
-- `is_published` lets an admin pull a story off the public surfaces (news index,
-- homepage teaser, article page, sitemap) without destroying it. The hard Delete
-- button stays for permanent removal.
--
-- Defaults to true so every existing article stays live, and NOT NULL keeps the
-- public filters and the admin toggle simple (no three-state null handling).
--
-- This project isn't CLI-linked, so run this by hand in the Supabase SQL editor.
-- Idempotent: safe to run multiple times.

alter table public.articles
  add column if not exists is_published boolean not null default true;

-- Every public read filters on this flag and orders by created_at, so index the
-- pair those queries actually use.
create index if not exists articles_is_published_created_at_idx
  on public.articles (is_published, created_at desc);

-- RLS IS DELIBERATELY UNCHANGED. The admin list at /admin/articles reads
-- articles with the cookie-bound (anon-key) client, so a SELECT policy that hid
-- unpublished rows would also hide them from the admin trying to manage them.
-- Hidden articles are excluded in the page queries instead.
--
-- Consequence worth knowing: a hidden row stays readable through the anon REST
-- API by anyone who knows its slug. This flag is an editorial unpublish, not a
-- security boundary. Closing that gap means moving the admin reads onto the
-- service-role client first, then adding a published-only SELECT policy.
