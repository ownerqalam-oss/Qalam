-- Tell writers when the team reviews their piece: an in-app
-- notification when it's published or sent back with feedback.
-- (The matching emails are sent by /api/notify-review.)
--
-- Written by a trigger on drafts, like the like/comment/follow
-- notifications in 0006, so no review can skip it.
--
-- Run this once in the Supabase SQL editor.

alter table notifications drop constraint if exists notifications_type_check;
alter table notifications
  add constraint notifications_type_check
  check (type in ('like', 'comment', 'follow', 'published', 'returned'));

create or replace function public.handle_draft_reviewed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is not distinct from old.status
     or new.status not in ('published', 'rejected') then
    return new;
  end if;

  insert into notifications (recipient_id, type, draft_id, actor_id)
  values (
    new.user_id,
    case when new.status = 'published' then 'published' else 'returned' end,
    new.id,
    -- the reviewing admin, or the writer when run outside a session
    coalesce(auth.uid(), new.user_id)
  );

  return new;
end;
$$;

drop trigger if exists on_draft_reviewed on drafts;
create trigger on_draft_reviewed
after update of status on drafts
for each row execute function public.handle_draft_reviewed();
