begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
revoke all on private.admin_users from public, anon, authenticated;

create table if not exists public.drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  tagline text,
  content text not null default '',
  type text not null default 'article',
  tags text[],
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  published_at timestamptz
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from private.admin_users where user_id = (select auth.uid())); $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table if exists public.drafts enable row level security;
alter table if exists public.drafts force row level security;

drop policy if exists "Published drafts are publicly readable" on public.drafts;
drop policy if exists "Owners can read their drafts" on public.drafts;
drop policy if exists "Owners can create drafts" on public.drafts;
drop policy if exists "Owners can update drafts" on public.drafts;
drop policy if exists "Owners can delete drafts" on public.drafts;
drop policy if exists "Admins can read all drafts" on public.drafts;
drop policy if exists "Admins can update all drafts" on public.drafts;

create policy "Published drafts are publicly readable" on public.drafts for select to anon, authenticated using (status = 'published');
create policy "Owners can read their drafts" on public.drafts for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owners can create drafts" on public.drafts for insert to authenticated with check ((select auth.uid()) = user_id and status = 'draft');
create policy "Owners can update drafts" on public.drafts for update to authenticated using ((select auth.uid()) = user_id and status = 'draft') with check ((select auth.uid()) = user_id and status in ('draft', 'submitted'));
create policy "Owners can delete drafts" on public.drafts for delete to authenticated using ((select auth.uid()) = user_id and status = 'draft');
create policy "Admins can read all drafts" on public.drafts for select to authenticated using ((select public.is_admin()));
create policy "Admins can update all drafts" on public.drafts for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

commit;
