-- Grant admin access to the approved fan admins.
--
-- This project has no dedicated "admins" table: admin access is gated by
-- `public.profiles.role = 'admin'`. Emails are not stored on `profiles`; they
-- live on `auth.users`, so we match on the (case-insensitive) email and flip
-- the role on the matching profile row.
--
-- Idempotent: re-running is a no-op for already-promoted users. Only affects
-- emails that have actually signed up (a profile row must already exist).
update public.profiles p
set role = 'admin'
from auth.users u
where p.id = u.id
  and lower(u.email) in (
    'jayedstuff@gmail.com',
    'ashrafhoss3n@gmail.com',
    'nurulhaquenobel4@gmail.com',
    'ercelo126144@gmail.com'
  );
