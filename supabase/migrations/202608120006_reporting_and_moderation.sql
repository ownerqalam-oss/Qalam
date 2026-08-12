begin;

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null,
  post_id uuid references public.posts(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_target_type_valid check (target_type in ('post', 'profile')),
  constraint reports_target_valid check (
    (target_type = 'post' and post_id is not null and profile_id is null)
    or (target_type = 'profile' and profile_id is not null and post_id is null)
  ),
  constraint reports_reason_valid check (reason in ('spam', 'harassment', 'hateful_abusive', 'inappropriate', 'plagiarism', 'other')),
  constraint reports_details_length check (details is null or char_length(details) <= 1000),
  constraint reports_other_has_details check (reason <> 'other' or char_length(trim(coalesce(details, ''))) >= 10),
  constraint reports_status_valid check (status in ('open', 'under_review', 'dismissed', 'actioned'))
);

create unique index reports_one_open_post_idx on public.reports (reporter_id, post_id)
where post_id is not null and status in ('open', 'under_review');
create unique index reports_one_open_profile_idx on public.reports (reporter_id, profile_id)
where profile_id is not null and status in ('open', 'under_review');
create index reports_status_created_idx on public.reports (status, created_at desc);

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  administrator_id uuid not null references auth.users(id) on delete restrict,
  report_id uuid references public.reports(id) on delete set null,
  target_type text not null,
  post_id uuid references public.posts(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  reason text not null,
  note text,
  created_at timestamptz not null default now(),
  constraint moderation_target_type_valid check (target_type in ('post', 'profile')),
  constraint moderation_target_valid check (
    (target_type = 'post' and post_id is not null and profile_id is null)
    or (target_type = 'profile' and profile_id is not null and post_id is null)
  ),
  constraint moderation_action_valid check (action in ('remove_post', 'restore_post', 'suspend_profile', 'reactivate_profile', 'dismiss_report', 'start_review')),
  constraint moderation_reason_valid check (reason in ('spam', 'harassment', 'hateful_abusive', 'inappropriate', 'plagiarism', 'other')),
  constraint moderation_note_length check (note is null or char_length(note) <= 1000)
);

create index moderation_actions_created_idx on public.moderation_actions (created_at desc);
create index moderation_actions_report_idx on public.moderation_actions (report_id) where report_id is not null;

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at before update on public.reports
for each row execute function private.set_updated_at();

create or replace function public.submit_report(
  target_kind text,
  target_id uuid,
  report_reason text,
  report_details text default null
)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare new_id uuid;
begin
  if not public.is_active_member() then raise exception 'active membership required' using errcode = '42501'; end if;
  if report_reason not in ('spam', 'harassment', 'hateful_abusive', 'inappropriate', 'plagiarism', 'other') then
    raise exception 'invalid reason' using errcode = '22023';
  end if;
  if report_reason = 'other' and char_length(trim(coalesce(report_details, ''))) < 10 then
    raise exception 'details required' using errcode = '22023';
  end if;
  if char_length(coalesce(report_details, '')) > 1000 then raise exception 'details too long' using errcode = '22023'; end if;

  if target_kind = 'post' then
    if not exists (
      select 1 from public.posts join public.profiles on profiles.id = posts.author_id
      where posts.id = target_id and posts.status = 'published'
        and profiles.onboarding_completed_at is not null and profiles.suspended_at is null
        and posts.author_id <> (select auth.uid())
    ) then raise exception 'target unavailable' using errcode = '22023'; end if;
    insert into public.reports (reporter_id, target_type, post_id, reason, details)
    values ((select auth.uid()), 'post', target_id, report_reason, nullif(trim(report_details), '')) returning id into new_id;
  elsif target_kind = 'profile' then
    if target_id = (select auth.uid()) or not exists (
      select 1 from public.profiles where id = target_id
        and onboarding_completed_at is not null and suspended_at is null
    ) then raise exception 'target unavailable' using errcode = '22023'; end if;
    insert into public.reports (reporter_id, target_type, profile_id, reason, details)
    values ((select auth.uid()), 'profile', target_id, report_reason, nullif(trim(report_details), '')) returning id into new_id;
  else
    raise exception 'invalid target' using errcode = '22023';
  end if;
  return new_id;
exception when unique_violation then
  raise exception 'an open report already exists' using errcode = '23505';
end;
$$;

create or replace function public.set_report_review_state(target_report_id uuid, next_status text, action_note text default null)
returns void language plpgsql security definer set search_path = ''
as $$
declare report_record public.reports;
begin
  if not public.is_admin() then raise exception 'not authorized' using errcode = '42501'; end if;
  if next_status not in ('under_review', 'dismissed') then raise exception 'invalid status' using errcode = '22023'; end if;
  select * into report_record from public.reports where id = target_report_id for update;
  if report_record.id is null or report_record.status not in ('open', 'under_review') then raise exception 'report unavailable' using errcode = '22023'; end if;
  update public.reports set status = next_status where id = target_report_id;
  insert into public.moderation_actions (administrator_id, report_id, target_type, post_id, profile_id, action, reason, note)
  values ((select auth.uid()), report_record.id, report_record.target_type, report_record.post_id, report_record.profile_id,
    case when next_status = 'dismissed' then 'dismiss_report' else 'start_review' end,
    report_record.reason, nullif(trim(action_note), ''));
end;
$$;

create or replace function public.moderate_post(
  target_post_id uuid,
  should_remove boolean,
  action_reason text,
  action_note text default null,
  source_report_id uuid default null
)
returns void language plpgsql security definer set search_path = ''
as $$
declare current_status text;
begin
  if not public.is_admin() then raise exception 'not authorized' using errcode = '42501'; end if;
  if action_reason not in ('spam', 'harassment', 'hateful_abusive', 'inappropriate', 'plagiarism', 'other') then raise exception 'invalid reason' using errcode = '22023'; end if;
  select status into current_status from public.posts where id = target_post_id for update;
  if should_remove and current_status in ('draft', 'published') then
    update public.posts set status = 'removed', removed_from_status = current_status where id = target_post_id;
  elsif not should_remove and current_status = 'removed' then
    update public.posts set status = coalesce(removed_from_status, 'draft'), removed_from_status = null where id = target_post_id;
  else raise exception 'post unavailable' using errcode = '22023'; end if;
  if source_report_id is not null then
    update public.reports set status = 'actioned' where id = source_report_id and post_id = target_post_id and status in ('open', 'under_review');
    if not found then raise exception 'report unavailable' using errcode = '22023'; end if;
  end if;
  insert into public.moderation_actions (administrator_id, report_id, target_type, post_id, action, reason, note)
  values ((select auth.uid()), source_report_id, 'post', target_post_id,
    case when should_remove then 'remove_post' else 'restore_post' end, action_reason, nullif(trim(action_note), ''));
end;
$$;

create or replace function public.moderate_profile(
  target_profile_id uuid,
  should_suspend boolean,
  action_reason text,
  action_note text default null,
  source_report_id uuid default null
)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'not authorized' using errcode = '42501'; end if;
  if target_profile_id = (select auth.uid()) and should_suspend then raise exception 'cannot suspend yourself' using errcode = '22023'; end if;
  if action_reason not in ('spam', 'harassment', 'hateful_abusive', 'inappropriate', 'plagiarism', 'other') then raise exception 'invalid reason' using errcode = '22023'; end if;
  update public.profiles set suspended_at = case when should_suspend then now() else null end,
    suspended_by = case when should_suspend then (select auth.uid()) else null end
  where id = target_profile_id and (suspended_at is null) = should_suspend;
  if not found then raise exception 'profile unavailable' using errcode = '22023'; end if;
  if source_report_id is not null then
    update public.reports set status = 'actioned' where id = source_report_id and profile_id = target_profile_id and status in ('open', 'under_review');
    if not found then raise exception 'report unavailable' using errcode = '22023'; end if;
  end if;
  insert into public.moderation_actions (administrator_id, report_id, target_type, profile_id, action, reason, note)
  values ((select auth.uid()), source_report_id, 'profile', target_profile_id,
    case when should_suspend then 'suspend_profile' else 'reactivate_profile' end, action_reason, nullif(trim(action_note), ''));
end;
$$;

revoke execute on function public.set_profile_suspension(uuid, boolean) from authenticated;
revoke all on function public.submit_report(text, uuid, text, text) from public, anon, authenticated;
revoke all on function public.set_report_review_state(uuid, text, text) from public, anon, authenticated;
revoke all on function public.moderate_post(uuid, boolean, text, text, uuid) from public, anon, authenticated;
revoke all on function public.moderate_profile(uuid, boolean, text, text, uuid) from public, anon, authenticated;
grant execute on function public.submit_report(text, uuid, text, text) to authenticated;
grant execute on function public.set_report_review_state(uuid, text, text) to authenticated;
grant execute on function public.moderate_post(uuid, boolean, text, text, uuid) to authenticated;
grant execute on function public.moderate_profile(uuid, boolean, text, text, uuid) to authenticated;

alter table public.reports enable row level security;
alter table public.reports force row level security;
alter table public.moderation_actions enable row level security;
alter table public.moderation_actions force row level security;
revoke all on public.reports from public, anon, authenticated;
revoke all on public.moderation_actions from public, anon, authenticated;
grant select on public.reports to authenticated;
grant select on public.moderation_actions to authenticated;
create policy "Admins can read reports" on public.reports for select to authenticated using ((select public.is_admin()));
create policy "Admins can read moderation actions" on public.moderation_actions for select to authenticated using ((select public.is_admin()));

commit;
