-- Notifications for likes, comments, and follows.
--
-- Aggregation-until-read: rather than one row per event, each new
-- like/comment/follow either bumps an existing unread notification
-- (actor_count++, actor_id updated to the latest actor) or creates a
-- new one if the previous one for that (recipient, type, target) was
-- already read. So five likes in a minute become one notification
-- ("X and 4 others liked your piece"), not five - and the next like
-- after you've read that one starts a fresh notification.
--
-- Notifications are only ever written by the triggers below (running
-- SECURITY DEFINER), never inserted directly by clients - there is no
-- INSERT policy for authenticated users, only SELECT/UPDATE on your
-- own rows (UPDATE is for marking read).
--
-- Run this once in the Supabase SQL editor.

create table if not exists notifications (
  id bigint generated always as identity primary key,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('like', 'comment', 'follow')),
  draft_id bigint references drafts(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  actor_count int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  read_at timestamptz
);

alter table notifications enable row level security;

create policy "Users can view their own notifications"
on notifications for select
to authenticated
using (auth.uid() = recipient_id);

create policy "Users can mark their own notifications read"
on notifications for update
to authenticated
using (auth.uid() = recipient_id)
with check (auth.uid() = recipient_id);

-- LIKES -> notifications

create or replace function handle_new_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  select user_id into owner_id from drafts where id = new.draft_id;

  if owner_id is null or owner_id = new.user_id then
    return new;
  end if;

  update notifications
  set actor_id = new.user_id,
      actor_count = actor_count + 1,
      updated_at = now()
  where recipient_id = owner_id
    and type = 'like'
    and draft_id = new.draft_id
    and read_at is null;

  if not found then
    insert into notifications (recipient_id, type, draft_id, actor_id)
    values (owner_id, 'like', new.draft_id, new.user_id);
  end if;

  return new;
end;
$$;

drop trigger if exists on_like_insert on likes;
create trigger on_like_insert
after insert on likes
for each row execute function handle_new_like();

-- COMMENTS -> notifications

create or replace function handle_new_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  select user_id into owner_id from drafts where id = new.draft_id;

  if owner_id is null or owner_id = new.user_id then
    return new;
  end if;

  update notifications
  set actor_id = new.user_id,
      actor_count = actor_count + 1,
      updated_at = now()
  where recipient_id = owner_id
    and type = 'comment'
    and draft_id = new.draft_id
    and read_at is null;

  if not found then
    insert into notifications (recipient_id, type, draft_id, actor_id)
    values (owner_id, 'comment', new.draft_id, new.user_id);
  end if;

  return new;
end;
$$;

drop trigger if exists on_comment_insert on comments;
create trigger on_comment_insert
after insert on comments
for each row execute function handle_new_comment();

-- FOLLOWS -> notifications

create or replace function handle_new_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update notifications
  set actor_id = new.follower_id,
      actor_count = actor_count + 1,
      updated_at = now()
  where recipient_id = new.following_id
    and type = 'follow'
    and draft_id is null
    and read_at is null;

  if not found then
    insert into notifications (recipient_id, type, actor_id)
    values (new.following_id, 'follow', new.follower_id);
  end if;

  return new;
end;
$$;

drop trigger if exists on_follow_insert on follows;
create trigger on_follow_insert
after insert on follows
for each row execute function handle_new_follow();
