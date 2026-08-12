begin;

alter table public.drafts rename to posts;
alter table public.posts rename column user_id to author_id;
alter table public.posts rename column content to content_html;

alter table public.posts drop column if exists submitted_at;
alter table public.posts add column if not exists removed_from_status text;
update public.posts set status = 'draft', published_at = null where status = 'submitted';
update public.posts set status = 'draft' where status not in ('draft', 'published', 'removed');
update public.posts set type = 'article' where type not in ('article', 'poetry', 'reflection', 'story');
update public.posts set updated_at = coalesce(updated_at, created_at, now());

alter table public.posts
  add constraint posts_status_valid check (status in ('draft', 'published', 'removed')),
  add constraint posts_type_valid check (type in ('article', 'poetry', 'reflection', 'story')),
  add constraint posts_title_length check (char_length(title) <= 200) not valid,
  add constraint posts_tagline_length check (tagline is null or char_length(tagline) <= 300) not valid,
  add constraint posts_tags_count check (tags is null or cardinality(tags) <= 10) not valid;
alter table public.posts add constraint posts_removed_from_status_valid
check (removed_from_status is null or removed_from_status in ('draft', 'published'));

create index if not exists posts_author_updated_idx on public.posts (author_id, updated_at desc);
create index if not exists posts_published_idx on public.posts (published_at desc) where status = 'published';

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at before update on public.posts
for each row execute function private.set_updated_at();

create or replace function public.save_post(
  post_id uuid,
  post_title text,
  post_tagline text,
  post_content_html text,
  post_type text,
  post_tags text[],
  expected_updated_at timestamptz default null
)
returns public.posts
language plpgsql
security definer
set search_path = ''
as $$
declare saved_post public.posts;
begin
  if not public.is_active_member() then
    raise exception 'active membership required' using errcode = '42501';
  end if;
  if post_content_html ~* '<[[:space:]]*(script|style|iframe|object|embed|svg|math|form|input|button|img|a)([[:space:]]|>|/)' 
     or post_content_html ~* '[[:space:]]on[a-z]+[[:space:]]*='
     or post_content_html ~* '(javascript|data)[[:space:]]*:' then
    raise exception 'unsafe post html' using errcode = '22023';
  end if;
  if post_id is null then
    insert into public.posts (author_id, title, tagline, content_html, type, tags, status)
    values ((select auth.uid()), post_title, post_tagline, post_content_html, post_type, post_tags, 'draft')
    returning * into saved_post;
  else
    update public.posts
    set title = post_title,
        tagline = post_tagline,
        content_html = post_content_html,
        type = post_type,
        tags = post_tags
    where id = post_id
      and author_id = (select auth.uid())
      and status = 'draft'
      and (expected_updated_at is null or updated_at = expected_updated_at)
    returning * into saved_post;

    if saved_post.id is null then
      raise exception 'post conflict or unavailable' using errcode = '40001';
    end if;
  end if;
  return saved_post;
end;
$$;

create or replace function public.publish_post(post_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_active_member() then raise exception 'active membership required' using errcode = '42501'; end if;
  update public.posts
  set status = 'published', published_at = now()
  where id = post_id and author_id = (select auth.uid()) and status = 'draft';
  if not found then raise exception 'post unavailable' using errcode = '42501'; end if;
end;
$$;

create or replace function public.unpublish_post(post_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_active_member() then raise exception 'active membership required' using errcode = '42501'; end if;
  update public.posts
  set status = 'draft', published_at = null
  where id = post_id and author_id = (select auth.uid()) and status = 'published';
  if not found then raise exception 'post unavailable' using errcode = '42501'; end if;
end;
$$;

create or replace function public.delete_draft(post_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_active_member() then raise exception 'active membership required' using errcode = '42501'; end if;
  delete from public.posts
  where id = post_id and author_id = (select auth.uid()) and status = 'draft';
  if not found then raise exception 'draft unavailable' using errcode = '42501'; end if;
end;
$$;

revoke all on function public.save_post(uuid, text, text, text, text, text[], timestamptz) from public, anon, authenticated;
revoke all on function public.publish_post(uuid) from public, anon, authenticated;
revoke all on function public.unpublish_post(uuid) from public, anon, authenticated;
revoke all on function public.delete_draft(uuid) from public, anon, authenticated;
grant execute on function public.save_post(uuid, text, text, text, text, text[], timestamptz) to authenticated;
grant execute on function public.publish_post(uuid) to authenticated;
grant execute on function public.unpublish_post(uuid) to authenticated;
grant execute on function public.delete_draft(uuid) to authenticated;

-- Tables are read-only to browser clients. Mutations use narrowly scoped RPCs
-- which enforce the authenticated author, state transitions, and basic HTML safety.
revoke insert, update, delete on public.posts from anon, authenticated;
grant select on public.posts to anon, authenticated;

alter table public.posts enable row level security;
alter table public.posts force row level security;

drop policy if exists "Published drafts are publicly readable" on public.posts;
drop policy if exists "Owners can read their drafts" on public.posts;
drop policy if exists "Owners can create drafts" on public.posts;
drop policy if exists "Owners can update drafts" on public.posts;
drop policy if exists "Owners can delete drafts" on public.posts;
drop policy if exists "Admins can read all drafts" on public.posts;
drop policy if exists "Admins can update all drafts" on public.posts;

create policy "Active published posts are public" on public.posts for select to anon, authenticated
using (
  status = 'published'
  and exists (
    select 1 from public.profiles
    where profiles.id = posts.author_id
      and profiles.onboarding_completed_at is not null
      and profiles.suspended_at is null
  )
);
create policy "Authors can read their posts" on public.posts for select to authenticated
using (author_id = (select auth.uid()));
create policy "Authors can create drafts" on public.posts for insert to authenticated
with check (author_id = (select auth.uid()) and status = 'draft' and (select public.is_active_member()));
create policy "Authors can update their posts" on public.posts for update to authenticated
using (author_id = (select auth.uid()) and status in ('draft', 'published') and (select public.is_active_member()))
with check (author_id = (select auth.uid()) and status in ('draft', 'published') and (select public.is_active_member()));
create policy "Authors can delete drafts" on public.posts for delete to authenticated
using (author_id = (select auth.uid()) and status = 'draft' and (select public.is_active_member()));
create policy "Admins can read all posts" on public.posts for select to authenticated
using ((select public.is_admin()));
create policy "Admins can moderate posts" on public.posts for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

-- Existing users need temporary unique public identities. They must replace these
-- placeholders during onboarding on their next authenticated visit.
do $$
declare profile_record record;
declare candidate text;
declare attempt integer;
begin
  for profile_record in select id from public.profiles where username is null loop
    attempt := 0;
    loop
      candidate := 'writer_' || left(md5(profile_record.id::text || ':' || attempt::text), 23);
      exit when not exists (select 1 from public.profiles where username = candidate);
      attempt := attempt + 1;
    end loop;
    update public.profiles set username = candidate where id = profile_record.id;
  end loop;
end;
$$;

update public.profiles set display_name = 'Qalam Writer' where display_name is null;

commit;
