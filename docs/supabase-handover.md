# Qalam Supabase Handover

This guide provisions a brand-new hosted Supabase project for Qalam. The repository migrations are the source of truth; do not create the application tables or Storage bucket manually.

## What the Supabase project provides

Qalam uses Supabase for:

- email/password authentication and administrator-issued invitations;
- public writer profiles and published posts;
- private follows, saved posts, reports, and analytics data;
- the public `avatars` Storage bucket with owner-only writes;
- Row Level Security and database functions for authorization;
- immutable moderation records.

The application also uses a server-only Supabase key for invitations, view recording, and selected administrative reads. Never expose that key in a browser or commit it.

## Prerequisites

- Node.js and npm compatible with the checked-in lockfile.
- A Supabase account with permission to create and configure projects.
- The Supabase CLI, either installed locally or invoked with `npx supabase`.
- The repository checked out locally.
- The final application origins, for example:
  - local: `http://localhost:3000`
  - production: `https://qalam.example.com`

Docker is only required if you also run the full Supabase stack locally. Linking and pushing migrations to a hosted project does not require `supabase start`.

## 1. Create a clean Supabase project

Create a project in the [Supabase Dashboard](https://supabase.com/dashboard). Choose the production region deliberately because moving regions later requires a migration. Save these values securely:

- project reference, visible in the dashboard URL;
- database password;
- project URL;
- publishable key;
- secret key.

The keys are available from the project's **Connect** dialog or **Settings → API Keys**. A legacy `anon` key can replace the publishable key, and a legacy `service_role` key can replace the secret key, but the newer scoped keys are preferred. Supabase documents the security boundary in [Understanding API keys](https://supabase.com/docs/guides/getting-started/api-keys).

Start with an otherwise untouched project. Do not use the Table Editor to pre-create `profiles`, `posts`, or any other Qalam tables.

## 2. Apply every migration in order

From the repository root:

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push --dry-run
npx supabase db push
npx supabase migration list
```

Review the dry run before applying it. Enter the database password when prompted. The CLI applies these files in filename order:

1. `202608120001_secure_application_foundation.sql`
2. `202608120002_invitations_profiles_and_avatars.sql`
3. `202608120003_posts_and_publishing.sql`
4. `202608120004_social_feeds.sql`
5. `202608120005_privacy_analytics.sql`
6. `202608120006_reporting_and_moderation.sql`

The migrations create the `private` schema, tables, indexes, triggers, RPC functions, RLS policies, and `avatars` bucket. A successful `migration list` should show all six versions applied remotely.

For future changes, add a migration to `supabase/migrations` and use `db push`. Supabase recommends avoiding remote Table Editor or SQL Editor schema changes once a migration workflow is established because they bypass migration history. See [Database migrations](https://supabase.com/docs/guides/deployment/database-migrations).

## 3. Configure application environment variables

Copy the example file for local development:

```powershell
Copy-Item .env.example .env.local
```

Set:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY=YOUR_SECRET_KEY
ANALYTICS_HMAC_SECRET=YOUR_RANDOM_SECRET_OF_AT_LEAST_32_BYTES
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Despite its historical name, `NEXT_PUBLIC_SUPABASE_ANON_KEY` accepts the project's publishable key. It is intentionally available to browser code; RLS remains the authorization boundary.

`SUPABASE_SECRET_KEY` bypasses RLS and must only exist in server runtime settings. Never prefix it with `NEXT_PUBLIC_`, place it in frontend code, commit it, or expose it in logs. The same restriction applies to `ANALYTICS_HMAC_SECRET`.

Generate an analytics secret in PowerShell:

```powershell
$analyticsBytes = New-Object byte[] 48
[Security.Cryptography.RandomNumberGenerator]::Fill($analyticsBytes)
[Convert]::ToBase64String($analyticsBytes)
```

Use different secret values in development, staging, and production. Rotating the analytics secret does not delete prior views, but it can allow a reader to count again on the rotation day because daily deduplication keys change.

In the deployment platform, configure the same five variables and change `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS production origin, without a trailing slash. Redeploy after changing any `NEXT_PUBLIC_` variable because those values are included in the client build.

## 4. Configure invite-only Auth

In **Authentication → Providers**, keep Email enabled and disable public email sign-ups. Qalam has no registration screen and expects administrators to invite all normal members.

In **Authentication → URL Configuration**:

- set **Site URL** to the production origin;
- add `http://localhost:3000/**` for local development;
- add the production origin and any intentionally supported staging or preview origins to **Redirect URLs**.

Only allow origins you control. The URL passed by `inviteUserByEmail` must match this list. Supabase explains the matching behavior in [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

In **Authentication → Email Templates → Invite user**, make the invitation link target Qalam's confirmation route:

```html
<a href="{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite">
  Accept your Qalam invitation
</a>
```

The application verifies the token at `/auth/confirm`, sends the invitee to `/set-password`, and then to `/onboarding`. The use of `RedirectTo` and `TokenHash` follows Supabase's [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates) guidance.

Configure custom SMTP before inviting production users. Verify the sender domain, delivery, expiration behavior, and spam placement using a non-administrator test address.

## 5. Bootstrap the first administrator

An administrator must exist before Qalam can send invitations. Create only this bootstrap account manually:

1. Open **Authentication → Users** in Supabase.
2. Add the intended administrator's email and a strong temporary password.
3. Confirm the user as appropriate for the dashboard flow.
4. Copy the user's UUID—not their email.
5. Open the SQL Editor and run:

```sql
insert into private.admin_users (user_id)
values ('REPLACE_WITH_VERIFIED_AUTH_USER_UUID')
on conflict (user_id) do nothing;
```

This is a data bootstrap, not a schema migration. Administrator status must never be stored in editable user metadata.

Log in at `/login`. Complete `/onboarding` if prompted. The account should then see **Admin** in the navigation and be able to open `/admin`.

To verify the bootstrap in SQL:

```sql
select au.id, au.email, p.username, p.onboarding_completed_at
from private.admin_users admin
join auth.users au on au.id = admin.user_id
left join public.profiles p on p.id = au.id;
```

## 6. Invite the first test writer

While signed in as the administrator:

1. Open `/admin/invitations`.
2. Invite an email address that is not already in Auth.
3. Confirm the audit row reports `sent`.
4. Open the email link in a separate browser profile.
5. Set a password and complete onboarding.
6. Confirm the invitation becomes `accepted`.

If sending fails, check `SUPABASE_SECRET_KEY`, the redirect allow list, the invite template, SMTP delivery, and the error stored on the invitation row.

## 7. Production smoke test

Run this test with an administrator, a normal writer, and a signed-out browser:

- Signed out:
  - `/journal` loads without “Journal unavailable”.
  - Published articles and public writer profiles are readable.
  - Protected routes redirect to login.
- Writer:
  - login survives a refresh;
  - onboarding, avatar upload, draft save, publish, unpublish, and draft deletion work;
  - following and saved posts are private to the signed-in user;
  - reports can be submitted against another writer or post but not against oneself.
- Analytics:
  - leave a published article visible for at least three seconds;
  - confirm its dashboard view count increases once;
  - revisit on the same UTC day and confirm it does not increase again;
  - test anonymous deduplication on the HTTPS deployment because the visitor cookie is intentionally `Secure`.
- Administrator:
  - `/admin/reports` shows submitted reports;
  - review, dismissal, removal/restoration, and suspension/reactivation work;
  - `/admin/moderation` records the administrator, target, reason, note, and timestamp.

Finally run the application checks:

```powershell
npm install
npm run lint
npm run typecheck
npm run build
npm run dev
```

## 8. Security verification

Before launch, confirm:

- public sign-up is disabled;
- `SUPABASE_SECRET_KEY`, the database password, and `ANALYTICS_HMAC_SECRET` are absent from Git and browser bundles;
- all six migrations appear in remote migration history;
- RLS is enabled on every exposed table;
- `private.admin_users`, raw `post_views`, `follower_events`, reports, and moderation data are not readable by ordinary users;
- the avatar bucket is public for reads but only owners can write their own folder;
- production uses HTTPS;
- database backups and a staging migration rehearsal exist before future schema releases.

## Troubleshooting

### Journal says unavailable

This usually means migrations were not applied to the project referenced by the environment variables. Check:

```powershell
npx supabase migration list
```

Also confirm the URL and publishable key came from the same Supabase project. A missing `posts` or `profiles` REST resource indicates an incorrect project or incomplete migrations.

### Dashboard says analytics are unavailable

Apply migrations 005 and 006, then set both `SUPABASE_SECRET_KEY` and `ANALYTICS_HMAC_SECRET`. The HMAC secret must be at least 32 bytes.

### Invitation link is invalid

Verify the exact Invite User template, ensure the application's origin is allowed under Auth Redirect URLs, and check that `NEXT_PUBLIC_SITE_URL` has the correct scheme and no trailing slash. Generate a fresh invitation after changing the template.

### `db push` reports migration-history mismatch

Do not repeatedly paste the migrations into the SQL Editor. Compare local and remote state with:

```powershell
npx supabase migration list
```

If someone previously changed the remote schema manually, follow Supabase's migration repair or `db pull` workflow only after verifying the actual schema. Never mark a migration applied merely to silence an error.

### Admin link does not appear

Confirm the logged-in Auth user's exact UUID exists in `private.admin_users`, then sign out and back in. Administrator authorization is database-backed and is not inferred from email or metadata.

## Ongoing ownership

- Treat `supabase/migrations` as the only schema source of truth.
- Test new migrations locally and in staging before production.
- Back up production before destructive or data-transforming migrations.
- Regenerate `lib/supabase/database.types.ts` after schema changes with `npm run db:types` against a fully migrated local database.
- Coordinate migration deployment so only one release process runs `db push` at a time.
- Rotate server secrets immediately if they are exposed, and redeploy all affected environments.
