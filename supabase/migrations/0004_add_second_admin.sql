-- Adds a second admin and, since we're touching this again,
-- consolidates the admin email list (previously duplicated across
-- publish_draft, reject_draft, and the "Admins can view all drafts"
-- policy) into one helper function so it only needs updating in one
-- place in SQL going forward.
--
-- Still has to be kept in sync by hand with ADMIN_EMAILS in
-- lib/admin.ts -- that's a separate, app-level check.
--
-- Run this once in the Supabase SQL editor, after 0001-0003.

create or replace function is_admin_email(check_email text)
returns boolean
language sql
stable
as $$
  select check_email in (
    'owner.qalam@gmail.com',
    'lamakhussain898@gmail.com'
  );
$$;

create or replace function publish_draft(draft_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin_email(auth.jwt() ->> 'email') then
    raise exception 'not authorized';
  end if;

  update drafts
  set status = 'published',
      published_at = now()
  where id = draft_id;
end;
$$;

create or replace function reject_draft(draft_id bigint, reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin_email(auth.jwt() ->> 'email') then
    raise exception 'not authorized';
  end if;

  update drafts
  set status = 'rejected',
      feedback = reason
  where id = draft_id;
end;
$$;

alter policy "Admins can view all drafts" on drafts
using (is_admin_email(auth.jwt() ->> 'email'));
