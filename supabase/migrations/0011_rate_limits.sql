-- Basic abuse protection: nothing currently stops a signed-in user (or
-- a script running as one) from flooding comments or repeatedly
-- resubmitting drafts. Account-creation floods are already throttled
-- by Supabase Auth's own built-in rate limits, so this only covers
-- what's left within app-level control.
--
-- Both raise a plain exception, which the app already surfaces via
-- showToast(error.message, "error") on the existing insert/update
-- calls - no app code changes needed for the message to show up.

create or replace function enforce_comment_rate_limit()
returns trigger
language plpgsql
as $$
declare
  recent_count int;
begin
  select count(*) into recent_count
  from comments
  where user_id = new.user_id
    and created_at > now() - interval '60 seconds';

  if recent_count >= 5 then
    raise exception 'You are commenting too quickly. Please wait a moment and try again.';
  end if;

  return new;
end;
$$;

drop trigger if exists comments_rate_limit on comments;

create trigger comments_rate_limit
before insert on comments
for each row
execute function enforce_comment_rate_limit();

create or replace function enforce_submission_rate_limit()
returns trigger
language plpgsql
as $$
declare
  recent_count int;
begin
  if new.status = 'submitted' and (old.status is distinct from 'submitted') then
    select count(*) into recent_count
    from drafts
    where user_id = new.user_id
      and status = 'submitted'
      and submitted_at > now() - interval '10 minutes';

    if recent_count >= 5 then
      raise exception 'You are submitting too quickly. Please wait a while before submitting more.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists drafts_submission_rate_limit on drafts;

create trigger drafts_submission_rate_limit
before update on drafts
for each row
execute function enforce_submission_rate_limit();
