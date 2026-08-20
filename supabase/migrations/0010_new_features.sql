-- View counts, featured/editor's pick, threaded comment replies, and
-- curated collections.
--
-- Run this once in the Supabase SQL editor, after 0001-0009.

-- VIEW COUNTS
--
-- A plain client-side UPDATE can't do this: the existing "Users can
-- update their own drafts" policy means anyone reading someone else's
-- article (the interesting case) gets silently filtered to 0 rows.
-- SECURITY DEFINER RPC, same pattern as publish_draft/reject_draft.

alter table drafts add column if not exists view_count bigint not null default 0;

create or replace function increment_view_count(p_draft_id bigint)
returns void
language sql
security definer
set search_path = public
as $$
  update drafts
  set view_count = view_count + 1
  where id = p_draft_id and status = 'published';
$$;

revoke all on function increment_view_count(bigint) from public;
grant execute on function increment_view_count(bigint) to anon, authenticated;

-- FEATURED / EDITOR'S PICK

alter table drafts add column if not exists is_featured boolean not null default false;

create or replace function set_featured(p_draft_id bigint, p_featured boolean)
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
  set is_featured = p_featured
  where id = p_draft_id;
end;
$$;

revoke all on function set_featured(bigint, boolean) from public;
grant execute on function set_featured(bigint, boolean) to authenticated;

-- THREADED COMMENT REPLIES
--
-- One level deep by convention (a reply's parent is always a
-- top-level comment) - enforced in the app, not the schema, to keep
-- this simple.

alter table comments add column if not exists parent_id bigint references comments(id) on delete cascade;

-- CURATED COLLECTIONS

create table if not exists collections (
  id bigint generated always as identity primary key,
  title text not null,
  description text,
  cover_image_url text,
  created_at timestamptz not null default now()
);

alter table collections enable row level security;

create policy "Anyone can view collections"
on collections for select
to anon, authenticated
using (true);

create table if not exists collection_drafts (
  collection_id bigint not null references collections(id) on delete cascade,
  draft_id bigint not null references drafts(id) on delete cascade,
  position int not null default 0,
  primary key (collection_id, draft_id)
);

alter table collection_drafts enable row level security;

create policy "Anyone can view collection pieces"
on collection_drafts for select
to anon, authenticated
using (true);

-- Admin-only management, same is_admin_email + SECURITY DEFINER
-- pattern as everything else - no direct insert/update/delete
-- policies on either table, so this is the only write path.

create or replace function create_collection(p_title text, p_description text, p_cover_image_url text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id bigint;
begin
  if not is_admin_email(auth.jwt() ->> 'email') then
    raise exception 'not authorized';
  end if;

  insert into collections (title, description, cover_image_url)
  values (p_title, p_description, p_cover_image_url)
  returning id into new_id;

  return new_id;
end;
$$;

create or replace function delete_collection(p_collection_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin_email(auth.jwt() ->> 'email') then
    raise exception 'not authorized';
  end if;

  delete from collections where id = p_collection_id;
end;
$$;

create or replace function add_to_collection(p_collection_id bigint, p_draft_id bigint, p_position int default 0)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin_email(auth.jwt() ->> 'email') then
    raise exception 'not authorized';
  end if;

  insert into collection_drafts (collection_id, draft_id, position)
  values (p_collection_id, p_draft_id, p_position)
  on conflict (collection_id, draft_id) do update set position = excluded.position;
end;
$$;

create or replace function remove_from_collection(p_collection_id bigint, p_draft_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin_email(auth.jwt() ->> 'email') then
    raise exception 'not authorized';
  end if;

  delete from collection_drafts
  where collection_id = p_collection_id and draft_id = p_draft_id;
end;
$$;

revoke all on function create_collection(text, text, text) from public;
revoke all on function delete_collection(bigint) from public;
revoke all on function add_to_collection(bigint, bigint, int) from public;
revoke all on function remove_from_collection(bigint, bigint) from public;
grant execute on function create_collection(text, text, text) to authenticated;
grant execute on function delete_collection(bigint) to authenticated;
grant execute on function add_to_collection(bigint, bigint, int) to authenticated;
grant execute on function remove_from_collection(bigint, bigint) to authenticated;
