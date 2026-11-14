-- UCL campaigns: a photo gallery per campaign.
--
-- Until now a campaign had a single `image_url`. This adds `images`, an ordered
-- list of photo URLs (Cloudinary uploads from /admin/ucl-history). The first
-- entry is the cover: it leads the gallery on the Fans Zone panel.
--
-- `image_url` is kept, as a mirror of that cover (`images[1]` — Postgres arrays
-- are 1-indexed). The admin save action writes both in the same statement, so
-- anything still reading `image_url` keeps working.
--
-- Idempotent: safe to run more than once.

alter table public.ucl_campaigns
  add column if not exists images text[] not null default '{}';

-- A campaign that already has a photo starts its gallery with it. The
-- `cardinality(images) = 0` guard means a re-run never overwrites a gallery
-- that has since been built in the CMS.
update public.ucl_campaigns
set images = array[image_url]
where image_url is not null
  and image_url <> ''
  and cardinality(images) = 0;
