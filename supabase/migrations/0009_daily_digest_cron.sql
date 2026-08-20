-- Schedules the daily digest to run once a day at 21:00 UTC (10pm
-- Irish time during daylight saving - shifts to 9pm Irish time once
-- the clocks go back, since this is a fixed UTC schedule with no
-- timezone awareness). Reuses
-- the same webhook secret already stored in Vault for the submission
-- notification (submission_webhook_secret) - it's just proving these
-- requests come from our own Supabase project, no need for a second
-- one.
--
-- Before this will actually do anything: SUPABASE_SERVICE_ROLE_KEY
-- and RESEND_API_KEY both need to be set in Netlify (the digest route
-- needs the service role key to read every subscriber's email via
-- the Supabase Admin API - something the anon key can't do).

create extension if not exists pg_cron;

select cron.schedule(
  'daily-digest',
  '0 21 * * *',
  $$
  select net.http_post(
    url := 'https://qalam.ie/api/send-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'submission_webhook_secret' limit 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
