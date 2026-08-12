begin;

create table public.post_views (
  post_id uuid not null references public.posts(id) on delete cascade,
  viewed_on date not null,
  viewer_key text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, viewed_on, viewer_key),
  constraint post_views_key_format check (viewer_key ~ '^[0-9a-f]{64}$')
);

create index post_views_post_created_idx on public.post_views (post_id, created_at desc);

create table public.follower_events (
  id bigint generated always as identity primary key,
  writer_id uuid not null references public.profiles(id) on delete cascade,
  delta smallint not null,
  occurred_at timestamptz not null default now(),
  constraint follower_events_delta_valid check (delta in (-1, 1))
);

create index follower_events_writer_occurred_idx on public.follower_events (writer_id, occurred_at desc);

-- Preserve the real timestamp of follows that predate analytics without retaining
-- follower identity in the analytics table.
insert into public.follower_events (writer_id, delta, occurred_at)
select followed_id, 1, created_at from public.follows;

create or replace function private.update_follow_counts()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set following_count = following_count + 1 where id = new.follower_id;
    update public.profiles set follower_count = follower_count + 1 where id = new.followed_id;
    insert into public.follower_events (writer_id, delta) values (new.followed_id, 1);
    return new;
  end if;

  update public.profiles set following_count = greatest(following_count - 1, 0) where id = old.follower_id;
  update public.profiles set follower_count = greatest(follower_count - 1, 0) where id = old.followed_id;
  insert into public.follower_events (writer_id, delta) values (old.followed_id, -1);
  return old;
end;
$$;

create or replace function public.record_post_view(target_post_id uuid, derived_viewer_key text)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare inserted_count integer;
begin
  if derived_viewer_key !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid viewer key' using errcode = '22023';
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

  insert into public.post_views (post_id, viewed_on, viewer_key)
  values (target_post_id, (now() at time zone 'utc')::date, derived_viewer_key)
  on conflict do nothing;
  get diagnostics inserted_count = row_count;
  return inserted_count = 1;
end;
$$;

create or replace function public.get_author_dashboard_analytics()
returns jsonb language sql stable security definer set search_path = ''
as $$
  with viewer as (
    select (select auth.uid()) as author_id
    where public.is_active_member()
  ),
  authored_posts as (
    select posts.id, posts.status from public.posts, viewer
    where posts.author_id = viewer.author_id
  ),
  summary as (
    select
      count(*) filter (where status = 'published')::integer as published_posts,
      (select count(*)::integer from public.post_views join authored_posts ap on ap.id = post_views.post_id where ap.status = 'published') as total_views,
      (select count(*)::integer from public.saved_posts join authored_posts ap on ap.id = saved_posts.post_id where ap.status = 'published') as total_saves
    from authored_posts
  ),
  post_metrics as (
    select coalesce(jsonb_object_agg(authored_posts.id::text, jsonb_build_object(
      'views', (select count(*) from public.post_views where post_views.post_id = authored_posts.id),
      'saves', (select count(*) from public.saved_posts where saved_posts.post_id = authored_posts.id)
    )), '{}'::jsonb) as value
    from authored_posts
    where authored_posts.status = 'published'
  ),
  days as (
    select generate_series(
      (now() at time zone 'utc')::date - 29,
      (now() at time zone 'utc')::date,
      interval '1 day'
    )::date as day
  ),
  growth as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'date', days.day,
      'change', coalesce(sum(follower_events.delta), 0)::integer
    ) order by days.day), '[]'::jsonb) as value
    from days
    cross join viewer
    left join public.follower_events
      on follower_events.writer_id = viewer.author_id
      and (follower_events.occurred_at at time zone 'utc')::date = days.day
    group by viewer.author_id
  )
  select jsonb_build_object(
    'summary', jsonb_build_object(
      'publishedPosts', summary.published_posts,
      'totalViews', summary.total_views,
      'totalSaves', summary.total_saves,
      'currentFollowers', profiles.follower_count
    ),
    'postMetrics', post_metrics.value,
    'followerGrowth', growth.value
  )
  from viewer
  join public.profiles on profiles.id = viewer.author_id
  cross join summary
  cross join post_metrics
  cross join growth;
$$;

revoke all on function public.record_post_view(uuid, text) from public, anon, authenticated;
grant execute on function public.record_post_view(uuid, text) to service_role;
revoke all on function public.get_author_dashboard_analytics() from public, anon, authenticated;
grant execute on function public.get_author_dashboard_analytics() to authenticated;

alter table public.post_views enable row level security;
alter table public.post_views force row level security;
alter table public.follower_events enable row level security;
alter table public.follower_events force row level security;
revoke all on public.post_views from public, anon, authenticated;
revoke all on public.follower_events from public, anon, authenticated;

commit;
