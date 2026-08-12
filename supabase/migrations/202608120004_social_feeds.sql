begin;

create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followed_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  constraint follows_cannot_follow_self check (follower_id <> followed_id)
);

create index follows_followed_created_idx on public.follows (followed_id, created_at desc);
create index follows_follower_created_idx on public.follows (follower_id, created_at desc);

create table public.saved_posts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create index saved_posts_user_created_idx on public.saved_posts (user_id, created_at desc, post_id);

create or replace function private.update_follow_counts()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set following_count = following_count + 1 where id = new.follower_id;
    update public.profiles set follower_count = follower_count + 1 where id = new.followed_id;
    return new;
  end if;

  update public.profiles set following_count = greatest(following_count - 1, 0) where id = old.follower_id;
  update public.profiles set follower_count = greatest(follower_count - 1, 0) where id = old.followed_id;
  return old;
end;
$$;

create trigger follows_update_counts
after insert or delete on public.follows
for each row execute function private.update_follow_counts();

create or replace function public.follow_writer(writer_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_active_member() then
    raise exception 'active membership required' using errcode = '42501';
  end if;
  if writer_id = (select auth.uid()) then
    raise exception 'cannot follow yourself' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = writer_id and onboarding_completed_at is not null and suspended_at is null
  ) then
    raise exception 'writer unavailable' using errcode = '22023';
  end if;

  insert into public.follows (follower_id, followed_id)
  values ((select auth.uid()), writer_id)
  on conflict do nothing;
end;
$$;

create or replace function public.unfollow_writer(writer_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_active_member() then
    raise exception 'active membership required' using errcode = '42501';
  end if;
  delete from public.follows
  where follower_id = (select auth.uid()) and followed_id = writer_id;
end;
$$;

create or replace function public.save_post_for_later(target_post_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_active_member() then
    raise exception 'active membership required' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.posts
    join public.profiles on profiles.id = posts.author_id
    where posts.id = target_post_id
      and posts.status = 'published'
      and profiles.onboarding_completed_at is not null
      and profiles.suspended_at is null
  ) then
    raise exception 'post unavailable' using errcode = '22023';
  end if;

  insert into public.saved_posts (user_id, post_id)
  values ((select auth.uid()), target_post_id)
  on conflict do nothing;
end;
$$;

create or replace function public.unsave_post_for_later(target_post_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_active_member() then
    raise exception 'active membership required' using errcode = '42501';
  end if;
  delete from public.saved_posts
  where user_id = (select auth.uid()) and post_id = target_post_id;
end;
$$;

revoke all on function public.follow_writer(uuid) from public, anon, authenticated;
revoke all on function public.unfollow_writer(uuid) from public, anon, authenticated;
revoke all on function public.save_post_for_later(uuid) from public, anon, authenticated;
revoke all on function public.unsave_post_for_later(uuid) from public, anon, authenticated;
grant execute on function public.follow_writer(uuid) to authenticated;
grant execute on function public.unfollow_writer(uuid) to authenticated;
grant execute on function public.save_post_for_later(uuid) to authenticated;
grant execute on function public.unsave_post_for_later(uuid) to authenticated;

alter table public.follows enable row level security;
alter table public.follows force row level security;
alter table public.saved_posts enable row level security;
alter table public.saved_posts force row level security;

revoke all on public.follows from anon, authenticated;
grant select on public.follows to authenticated;
create policy "Members can read their follows" on public.follows for select to authenticated
using (follower_id = (select auth.uid()));

revoke all on public.saved_posts from anon, authenticated;
grant select on public.saved_posts to authenticated;
create policy "Members can read their saved posts" on public.saved_posts for select to authenticated
using (user_id = (select auth.uid()));

commit;
