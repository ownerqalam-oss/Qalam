-- Adds rejection feedback to drafts, and narrowly-scoped admin
-- functions for the review workflow.
--
-- Why RPC functions instead of a broad admin RLS policy: the existing
-- "Users can update their own drafts" policy means an admin's plain
-- UPDATE on someone else's draft is silently filtered to 0 rows
-- (no error, nothing happens). These functions are the only way an
-- admin can change another writer's draft, and they can only ever
-- touch status / published_at / feedback -- never title or content.
--
-- Run this once in the Supabase SQL editor (Database > SQL Editor).
--
-- If you add/remove admins, update the email here AND in
-- lib/admin.ts -- they are two separate checks (app-level redirect
-- vs. database-level write permission) and must be kept in sync by
-- hand.

alter table drafts add column if not exists feedback text;

create or replace function publish_draft(draft_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if (auth.jwt() ->> 'email') is distinct from 'owner.qalam@gmail.com' then
    raise exception 'not authorized';
  end if;

  update drafts
  set status = 'published',
      published_at = now()
  where id = draft_id;
end;
$$;

create or replace function reject_draft(draft_id uuid, reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if (auth.jwt() ->> 'email') is distinct from 'owner.qalam@gmail.com' then
    raise exception 'not authorized';
  end if;

  update drafts
  set status = 'rejected',
      feedback = reason
  where id = draft_id;
end;
$$;

revoke all on function publish_draft(uuid) from public;
revoke all on function reject_draft(uuid, text) from public;
grant execute on function publish_draft(uuid) to authenticated;
grant execute on function reject_draft(uuid, text) to authenticated;
