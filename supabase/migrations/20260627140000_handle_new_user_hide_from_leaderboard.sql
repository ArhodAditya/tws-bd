-- Belt-and-suspenders for "inactive by default", and bring the signup trigger
-- function into version control.
--
-- 20260627130000 flipped public.profiles.show_on_leaderboard's DEFAULT to false,
-- which already fixes new signups (the trigger below doesn't set the column, so
-- it inherits the default). This migration ALSO makes the trigger write the flag
-- explicitly — so leaderboard visibility stays opt-in even if the column default
-- is ever changed again — and captures the previously dashboard-only function in
-- source control.
--
-- Reproduced verbatim from the live definition
--   select pg_get_functiondef('public.handle_new_user()'::regprocedure);
-- — same signature, SECURITY DEFINER, and admin-email role logic — with ONE
-- change: the INSERT now lists `show_on_leaderboard` and sets it to false.
--
-- `create or replace function` keeps the same function, so the existing
-- `on_auth_user_created` trigger on auth.users stays bound — no trigger DDL here.
--
-- NOTE: the live function has no `SET search_path`. Supabase's linter flags
-- SECURITY DEFINER functions without a pinned search_path. The body fully
-- schema-qualifies (public.profiles), so adding `set search_path = ''` would be
-- safe and clears that warning — left off here to match the live definition
-- exactly. Add it if you want the lint clean.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $function$
begin
  insert into public.profiles (id, full_name, avatar_url, role, show_on_leaderboard)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    case when new.email = 'senguptaaditya47@gmail.com' then 'admin' else 'user' end,
    false
  );
  return new;
end;
$function$;
