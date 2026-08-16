-- 0001 declared publish_draft/reject_draft with a `uuid` draft_id
-- parameter, but drafts.id is actually bigint. Postgres won't
-- implicitly compare bigint = uuid, so those functions would fail
-- every real call. Drop and recreate with the correct type.
--
-- Run this once in the Supabase SQL editor, after 0001.

drop function if exists publish_draft(uuid);
drop function if exists reject_draft(uuid, text);

create or replace function publish_draft(draft_id bigint)
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

create or replace function reject_draft(draft_id bigint, reason text)
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

revoke all on function publish_draft(bigint) from public;
revoke all on function reject_draft(bigint, text) from public;
grant execute on function publish_draft(bigint) to authenticated;
grant execute on function reject_draft(bigint, text) to authenticated;
