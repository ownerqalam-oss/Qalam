-- Adds cover images, likes, bookmarks, follows, and comments.
--
-- likes/bookmarks/follows/comments reference auth.users(id) directly
-- rather than profiles(id) - profiles rows are created lazily (on
-- first dashboard visit or via the admin functions), so referencing
-- auth.users avoids a foreign-key failure for a brand-new account
-- that interacts with content before that happens.
--
-- Run this once in the Supabase SQL editor.

alter table drafts add column if not exists cover_image_url text;

-- LIKES

create table if not exists likes (
  id bigint generated always as identity primary key,
  draft_id bigint not null references drafts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (draft_id, user_id)
);

alter table likes enable row level security;

create policy "Anyone can view likes"
on likes for select
to anon, authenticated
using (true);

create policy "Users can like as themselves"
on likes for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can remove their own like"
on likes for delete
to authenticated
using (auth.uid() = user_id);

-- BOOKMARKS

create table if not exists bookmarks (
  id bigint generated always as identity primary key,
  draft_id bigint not null references drafts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (draft_id, user_id)
);

alter table bookmarks enable row level security;

create policy "Users can view their own bookmarks"
on bookmarks for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can bookmark as themselves"
on bookmarks for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can remove their own bookmark"
on bookmarks for delete
to authenticated
using (auth.uid() = user_id);

-- FOLLOWS

create table if not exists follows (
  id bigint generated always as identity primary key,
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);

alter table follows enable row level security;

create policy "Anyone can view follows"
on follows for select
to anon, authenticated
using (true);

create policy "Users can follow as themselves"
on follows for insert
to authenticated
with check (auth.uid() = follower_id);

create policy "Users can unfollow as themselves"
on follows for delete
to authenticated
using (auth.uid() = follower_id);

-- COMMENTS

create table if not exists comments (
  id bigint generated always as identity primary key,
  draft_id bigint not null references drafts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table comments enable row level security;

create policy "Anyone can view comments on published articles"
on comments for select
to anon, authenticated
using (
  exists (
    select 1 from drafts
    where drafts.id = comments.draft_id
    and drafts.status = 'published'
  )
);

create policy "Authenticated users can comment on published articles"
on comments for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from drafts
    where drafts.id = comments.draft_id
    and drafts.status = 'published'
  )
);

create policy "Users can delete their own comments, admins can delete any"
on comments for delete
to authenticated
using (auth.uid() = user_id or is_admin_email(auth.jwt() ->> 'email'));
