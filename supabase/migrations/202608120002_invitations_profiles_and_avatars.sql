begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  bio text,
  avatar_path text,
  onboarding_completed_at timestamptz,
  suspended_at timestamptz,
  suspended_by uuid references auth.users(id) on delete set null,
  follower_count integer not null default 0,
  following_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (
    username is null or (
      username = lower(username)
      and char_length(username) between 3 and 30
      and username ~ '^[a-z0-9_]+$'
    )
  ),
  constraint profiles_display_name_length check (display_name is null or char_length(display_name) between 1 and 60),
  constraint profiles_bio_length check (bio is null or char_length(bio) <= 300),
  constraint profiles_counts_nonnegative check (follower_count >= 0 and following_count >= 0),
  constraint completed_profiles_have_required_fields check (
    onboarding_completed_at is null or (username is not null and display_name is not null)
  )
);

create index if not exists profiles_active_username_idx
on public.profiles (username)
where onboarding_completed_at is not null and suspended_at is null;

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references auth.users(id) on delete restrict,
  email text not null,
  status text not null default 'pending',
  invited_user_id uuid references auth.users(id) on delete set null,
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  accepted_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint invitations_email_normalized check (email = lower(trim(email))),
  constraint invitations_status_valid check (status in ('pending', 'sent', 'accepted', 'failed', 'revoked'))
);

create index if not exists invitations_email_idx on public.invitations (email);
create index if not exists invitations_status_created_idx on public.invitations (status, created_at desc);

create or replace function private.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();

drop trigger if exists invitations_set_updated_at on public.invitations;
create trigger invitations_set_updated_at before update on public.invitations
for each row execute function private.set_updated_at();

create or replace function private.create_profile_for_auth_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists create_profile_after_auth_user on auth.users;
create trigger create_profile_after_auth_user
after insert on auth.users for each row execute function private.create_profile_for_auth_user();

insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

create or replace function public.is_active_member()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and onboarding_completed_at is not null
      and suspended_at is null
  );
$$;

create or replace function public.set_profile_suspension(target_user_id uuid, should_suspend boolean)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if target_user_id = (select auth.uid()) and should_suspend then
    raise exception 'administrators cannot suspend themselves' using errcode = '22023';
  end if;

  update public.profiles
  set suspended_at = case when should_suspend then now() else null end,
      suspended_by = case when should_suspend then (select auth.uid()) else null end
  where id = target_user_id;
end;
$$;

revoke all on function public.is_active_member() from public;
grant execute on function public.is_active_member() to authenticated;
revoke all on function public.set_profile_suspension(uuid, boolean) from public;
grant execute on function public.set_profile_suspension(uuid, boolean) to authenticated;

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.invitations enable row level security;
alter table public.invitations force row level security;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant update (username, display_name, bio, avatar_path, onboarding_completed_at) on public.profiles to authenticated;

create policy "Active profiles are public" on public.profiles for select to anon, authenticated
using (onboarding_completed_at is not null and suspended_at is null);
create policy "Members can read their own profile" on public.profiles for select to authenticated
using (id = (select auth.uid()));
create policy "Admins can read every profile" on public.profiles for select to authenticated
using ((select public.is_admin()));
create policy "Members can update their own profile" on public.profiles for update to authenticated
using (id = (select auth.uid()) and suspended_at is null)
with check (
  id = (select auth.uid())
  and suspended_at is null
  and (avatar_path is null or (storage.foldername(avatar_path))[1] = (select auth.uid())::text)
);

revoke all on public.invitations from anon, authenticated;
grant select, insert, update on public.invitations to authenticated;
create policy "Admins can read invitations" on public.invitations for select to authenticated using ((select public.is_admin()));
create policy "Admins can create invitations" on public.invitations for insert to authenticated with check ((select public.is_admin()) and inviter_id = (select auth.uid()));
create policy "Admins can update invitations" on public.invitations for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Published drafts are publicly readable" on public.drafts;
drop policy if exists "Owners can create drafts" on public.drafts;
drop policy if exists "Owners can update drafts" on public.drafts;
drop policy if exists "Owners can delete drafts" on public.drafts;
create policy "Published drafts are publicly readable" on public.drafts for select to anon, authenticated
using (
  status = 'published'
  and exists (
    select 1 from public.profiles
    where profiles.id = drafts.user_id
      and profiles.onboarding_completed_at is not null
      and profiles.suspended_at is null
  )
);
create policy "Owners can create drafts" on public.drafts for insert to authenticated
with check ((select auth.uid()) = user_id and status = 'draft' and (select public.is_active_member()));
create policy "Owners can update drafts" on public.drafts for update to authenticated
using ((select auth.uid()) = user_id and status = 'draft' and (select public.is_active_member()))
with check ((select auth.uid()) = user_id and status in ('draft', 'submitted') and (select public.is_active_member()));
create policy "Owners can delete drafts" on public.drafts for delete to authenticated
using ((select auth.uid()) = user_id and status = 'draft' and (select public.is_active_member()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Members can inspect their avatars" on storage.objects;
drop policy if exists "Members can upload their avatars" on storage.objects;
drop policy if exists "Members can update their avatars" on storage.objects;
drop policy if exists "Members can delete their avatars" on storage.objects;
create policy "Members can inspect their avatars" on storage.objects for select to authenticated
using (bucket_id = 'avatars' and owner_id = (select auth.uid())::text);
create policy "Members can upload their avatars" on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Members can update their avatars" on storage.objects for update to authenticated
using (bucket_id = 'avatars' and owner_id = (select auth.uid())::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Members can delete their avatars" on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and owner_id = (select auth.uid())::text);

commit;
