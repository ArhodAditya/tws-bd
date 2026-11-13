-- Harden article reads: the public may SELECT published articles only.
--
-- Companion to 20261113120000_add_is_published_to_articles.sql. That migration
-- added the flag and the app filters on it, but filtering in the query only
-- hides a row from our own pages — anyone could still read a hidden article
-- straight off the anon REST API by its slug. This closes that.
--
-- Mirrors the convention in 20260627150000_create_fan_reviews.sql (public reads
-- see approved rows only) and 20260724120000_product_reviews_production_sync.sql.
--
-- Admin surfaces do NOT rely on a role-based read policy: /admin/articles, the
-- edit page and the admin-only hidden-article preview all read through the
-- service-role client, exactly as /admin/reviews does for pending fan reviews.
-- Each of those pages is gated on auth + role before it reads. Keeping admin
-- visibility out of RLS means this policy stays a single, auditable rule, and
-- avoids a profiles subquery inside the policy (profiles.role is deliberately
-- not readable by anon/authenticated — see the current_user_role() RPC).
--
-- All writes already go through the service-role client (createArticle,
-- updateArticle, setArticlePublished, deleteArticle), so no write policy is
-- touched here.
--
-- This project isn't CLI-linked, so run this by hand in the Supabase SQL editor.
-- Idempotent: safe to run multiple times.

alter table public.articles enable row level security;

-- Clear out any pre-existing read policy first. This is the step that makes the
-- hardening real: permissive policies combine with OR, so a leftover
-- `using (true)` read policy would quietly undo the rule created below.
-- Policy names here were never tracked in a migration (the table predates this
-- folder), hence the catalog sweep rather than a known name.
do $$
declare
  pol record;
  broad text[] := '{}';
begin
  for pol in
    select policyname, cmd
    from pg_policies
    where schemaname = 'public'
      and tablename = 'articles'
  loop
    if pol.cmd = 'SELECT' then
      raise notice 'articles: dropping old read policy "%"', pol.policyname;
      execute format('drop policy %I on public.articles', pol.policyname);
    elsif pol.cmd = 'ALL' then
      -- A FOR ALL policy governs writes too, so it is left alone rather than
      -- silently removing someone's insert/update rights.
      broad := broad || pol.policyname;
    end if;
  end loop;

  if array_length(broad, 1) > 0 then
    raise warning
      'articles: FOR ALL policy/policies % also grant SELECT and were left in place. Review them — if one has a permissive USING clause, hidden articles remain readable.',
      broad;
  end if;
end $$;

-- The only read rule: a row is public exactly when it is published. Anonymous
-- and signed-in callers alike get nothing for a hidden article.
drop policy if exists "Published articles are viewable by everyone" on public.articles;
create policy "Published articles are viewable by everyone"
  on public.articles for select
  using (is_published = true);

-- Verify after running:
--
--   select policyname, cmd, qual
--   from pg_policies
--   where schemaname = 'public' and tablename = 'articles';
--
-- Expect exactly one SELECT row: "Published articles are viewable by everyone",
-- qual `(is_published = true)`. Any other SELECT or ALL row that reads broadly
-- needs attention — see the warning above.
--
-- Then confirm the lockout end to end, signed out, against a hidden article:
--
--   curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/articles?slug=eq.<hidden-slug>&select=slug" \
--     -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
--
-- Expect `[]`.
