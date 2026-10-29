-- Blocks new "Change Within" competition submissions after the deadline
-- (end of 12 November 2026, Irish time). The cutoff must match
-- COMPETITION.closesAt in lib/competition.ts. Drafts already submitted
-- before the deadline can still be reviewed and published as normal.
create or replace function public.enforce_competition_deadline()
returns trigger
language plpgsql
as $$
begin
  if new.status <> 'submitted' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'submitted' then
    return new;
  end if;

  if now() >= timestamptz '2026-11-13 00:00:00+00'
     and exists (
       select 1
       from unnest(coalesce(new.tags, '{}'::text[])) as tag
       where lower(trim(tag)) = 'change within'
     )
  then
    raise exception 'The Change Within competition closed on 12 November. Remove the "Change Within" tag to publish this as a regular poem.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_competition_deadline on public.drafts;

create trigger enforce_competition_deadline
before insert or update on public.drafts
for each row
execute function public.enforce_competition_deadline();
