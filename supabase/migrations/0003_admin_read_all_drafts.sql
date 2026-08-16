-- drafts only has SELECT policies for "your own drafts" and
-- "published articles" -- there's no policy letting the admin read
-- other users' submitted-but-unpublished drafts, so /admin's query
-- was being silently filtered to nothing by RLS. This adds a
-- read-only policy for the admin; Postgres OR's multiple SELECT
-- policies together, so this only adds visibility, it doesn't
-- change what anyone else can see.
--
-- Same email-sync caveat as 0001/0002: if admins change, update
-- this AND lib/admin.ts by hand.
--
-- Run this once in the Supabase SQL editor.

create policy "Admins can view all drafts"
on drafts
for select
to authenticated
using ((auth.jwt() ->> 'email') = 'owner.qalam@gmail.com');
