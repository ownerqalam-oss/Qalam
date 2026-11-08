-- How to reach a competition entrant if they win: an email or a phone
-- number, given when they submit a "Change Within" entry.
--
-- Kept in its own table, not on drafts, because published drafts are
-- publicly readable and this must stay private: only the entrant and
-- the admins can see it.
--
-- Run this once in the Supabase SQL editor.

create table if not exists public.competition_contacts (
  draft_id bigint primary key references public.drafts(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  contact text not null check (char_length(trim(contact)) between 5 and 200),
  updated_at timestamptz not null default now()
);

alter table public.competition_contacts enable row level security;

drop policy if exists "Entrants manage their own contact" on public.competition_contacts;
create policy "Entrants manage their own contact"
on public.competition_contacts
for all
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (select 1 from public.drafts d where d.id = draft_id and d.user_id = auth.uid())
);

drop policy if exists "Admins read contacts" on public.competition_contacts;
create policy "Admins read contacts"
on public.competition_contacts
for select
to authenticated
using (is_admin_email(auth.jwt() ->> 'email'));
