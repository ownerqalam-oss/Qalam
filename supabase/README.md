# Supabase database workflow

For provisioning a brand-new hosted project from start to finish, use [`docs/supabase-handover.md`](../docs/supabase-handover.md).

Migrations are the source of truth. Apply them locally first, verify RLS, then apply to staging before production. The checked-in `lib/supabase/database.types.ts` reflects this migration; regenerate it after every schema change with `npm run db:types`.

Before applying `202608120003_posts_and_publishing.sql` outside local development, back up the database. It preserves post UUIDs and published timestamps while renaming `drafts` to `posts`; legacy `submitted` records intentionally become editable drafts.

Apply `202608120004_social_feeds.sql` after the publishing migration. It adds private follows and saved posts, membership-checked mutation functions, and transactional profile follow counters.

Apply `202608120005_privacy_analytics.sql` after the social migration. Configure a unique `ANALYTICS_HMAC_SECRET` of at least 32 random bytes in every deployed environment; rotating it resets view deduplication for that UTC day but does not remove existing aggregate counts.

Apply `202608120006_reporting_and_moderation.sql` after analytics. It replaces unaudited moderation mutations with administrator-checked RPCs, private member reports, and immutable moderation action records.

## Bootstrap the first administrator

Find and verify the intended administrator UUID in Supabase Auth, then run once through the SQL editor or a controlled migration:

```sql
insert into private.admin_users (user_id)
values ('00000000-0000-0000-0000-000000000000');
```

Replace the placeholder. Never derive admin access from user metadata. The private table is browser-inaccessible; only `public.is_admin()` exposes a boolean authorization check.

## Invite configuration

Disable public sign-up in Supabase Auth. Configure the invitation template URL as `{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite`, set `NEXT_PUBLIC_SITE_URL` to the deployed origin, and add each origin to the allowed redirect URLs. `SUPABASE_SECRET_KEY` is server-only and reserved for invitation/admin operations.
