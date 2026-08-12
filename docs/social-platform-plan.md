# Qalam Social Writing Platform Plan

## Summary

Evolve Qalam into an invite-only, writing-first social platform where members publish long-form posts, follow writers, save posts, and review performance through a dashboard.

Delivery will be incremental. Each phase must pass its acceptance checks before the next begins.

## Implementation Phases

### Phase 0 — Landing Page and Baseline Cleanup

- Signed-out navigation shows only `Journal`, `About`, and `Sign in`.
- Signed-in navigation shows `Journal`, `Following`, `Dashboard`, `Write`, and an account menu containing Profile, Saved Posts, Settings, and Log out.
- Remove unsupported Search, Explore, Writers, Contact, `/write`, and signed-out Dashboard links.
- Route writing calls to action to `/login` when signed out and `/new` when authenticated.
- Replace the missing hero image with a neutral responsive placeholder; custom illustration remains a separate design task.
- Remove unsupported footer links and make genre links apply valid Journal filters.
- Correct mojibake, spelling errors, console logging, mobile layout problems, and invalid internal `<a>` navigation.
- Remove the stray `app/§` file after confirming it is unused.
- Replace network-dependent Google font loading with deterministic local or system typography until brand fonts are self-hosted.
- Resolve the existing lint failures and establish a passing lint, type-check, and build baseline.

Acceptance: every visible link resolves, no missing assets appear, navigation reflects authentication state, and the landing page works at mobile and desktop widths.

### Phase 1 — Secure Application Foundation

- Replace the browser-only Supabase client with `@supabase/ssr` browser and server clients using cookie-based sessions.
- Add Next.js 16 `proxy.ts` for session refresh only; enforce authorization again in protected layouts, Server Actions, Route Handlers, and the database.
- Protect `/dashboard`, `/following`, `/saved`, `/new`, `/editor`, `/settings`, and `/admin`.
- Eliminate public registration. Support login, logout, expired-session handling, invite confirmation, password setup, and onboarding.
- Keep the Supabase secret key server-only and use it solely for invitation and admin operations.
- Introduce version-controlled Supabase migrations, generated database types, validation schemas, and Row Level Security on every exposed table.
- Store admin authorization in protected database data, not user-editable metadata. Bootstrap the first admin using an explicitly documented user UUID.
- Preserve the existing removal of sensitive login-response logging.

References: [Supabase SSR clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs) and [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).

### Phase 2 — Invitations, Onboarding, and Profiles

- Add an admin-only invitation screen using `inviteUserByEmail`; record inviter, email, status, and timestamps for auditing.
- Invite links terminate at an auth confirmation route and then `/onboarding`.
- Require onboarding before accessing member features.
- Add public profiles at `/writers/[username]`.
- Profile fields:
  - Unique lowercase username: 3–30 characters, using letters, numbers, and underscores.
  - Display name: 1–60 characters.
  - Optional bio: maximum 300 characters.
  - Optional JPEG, PNG, or WebP avatar: maximum 5 MB.
- Store avatars in a Supabase Storage bucket with owner-only writes and public reads.
- Public profiles show display name, username, bio, avatar, follower and following totals, and published posts. Follower lists are outside the MVP.
- Administrators can suspend and reactivate accounts; suspended profiles and posts disappear publicly while their data remains preserved.

### Phase 3 — Post and Publishing Model

- Migrate `drafts` into a `posts` model containing:
  - `id`, `author_id`, `title`, `tagline`, `content_html`, `type`, and `tags`.
  - `status`, `created_at`, `updated_at`, and `published_at`.
- Supported types remain Article, Poetry, Reflection, and Short Story.
- Use `draft`, `published`, and `removed` statuses.
  - Authors may create, edit, publish immediately, unpublish back to draft, and delete their drafts.
  - Only administrators may apply or reverse `removed`.
- Preserve existing draft and published records. Convert legacy `submitted` posts back to drafts so their authors can explicitly publish them.
- Backfill profiles for existing Auth users with temporary unique usernames and require profile completion at next login.
- Keep existing `/journal/[id]` URLs to avoid breaking published links.
- Validate and sanitize rich-text HTML on the server before storage and rendering.
- Repair autosave with explicit saving, saved, and failed states; prevent stale saves and unauthorized editing.
- Public reads expose only published posts belonging to active profiles.

### Phase 4 — Journal, Following, and Saves

- Keep the Journal public, reverse-chronological, cursor-paginated, and filterable by writing type and tags.
- Add `/following`, showing published posts from followed active writers in reverse chronological order.
- Add follow and unfollow controls to writer profiles; prevent self-following and duplicate relationships.
- Add private save and unsave controls to post cards and article pages.
- Add `/saved`, showing only the authenticated member's saved posts.
- Link every post to its writer profile.
- Include loading, error, empty, pagination, and optimistic-action rollback states.
- Keep search, likes, comments, notifications, direct messages, and recommendation algorithms outside the MVP.

### Phase 5 — Dashboard and Privacy-Conscious Analytics

- Dashboard summary:
  - Total published posts.
  - Total views.
  - Total saves.
  - Current followers.
  - Daily follower growth for the trailing 30 days.
- Each published post shows all-time views and saves; drafts show editing status only.
- Count a view after the published article has remained visible for three seconds.
- Deduplicate to one view per reader, per post, per UTC day:
  - Signed-in readers use their user identity.
  - Signed-out readers receive a random first-party `HttpOnly`, `Secure`, `SameSite=Lax` visitor cookie.
  - Store only an HMAC-derived viewer key; never store an IP address, user agent, email, or raw visitor identifier.
- Accept view events only through `POST /api/posts/[id]/view`; validate that the post is public and enforce idempotency in the database.
- Never expose raw viewer or saver identities to writers.

### Phase 6 — Reporting and Administration

- Signed-in members can report a post or profile for spam, harassment, hateful or abusive material, inappropriate content, plagiarism, or other.
- Allow one open report per reporter and target; `other` requires explanatory text.
- Admin report states are `open`, `under_review`, `dismissed`, and `actioned`.
- Admin actions include removing or restoring a post and suspending or reactivating a member.
- Record each moderation action with administrator, target, reason, optional note, and timestamp.
- Recheck admin authorization inside every mutation; never rely only on hidden navigation or route guards.

## Database and Interface Additions

- Add `profiles`, `posts`, `follows`, `saved_posts`, `post_views`, `reports`, `invitations`, and `moderation_actions` tables.
- Add composite uniqueness constraints for follows, saves, daily views, and open reports.
- Add indexes for author feeds, publication ordering, follow lookups, saves, report status, and analytics aggregation.
- Limit public access to active profiles and published posts.
- Allow members to control only their profile, posts, follows, saves, and reports.
- Keep raw views, invitation records, and moderation data inaccessible through the public client.
- Generate TypeScript database types from the migrated schema and use shared validation schemas for all mutations.

## Testing and Release Plan

- Add unit tests for validation, state transitions, view deduplication, and authorization helpers.
- Add local-Supabase integration tests proving every RLS policy for anonymous users, members, owners, suspended users, and administrators.
- Add end-to-end tests covering:
  - Login and expired sessions.
  - Invitation acceptance and onboarding.
  - Draft creation, autosave, publishing, and unpublishing.
  - Public Journal and writer profiles.
  - Follow and unfollow behavior and the Following feed.
  - Save and unsave behavior and Saved Posts.
  - Daily view deduplication and dashboard totals.
  - Reporting, takedown, and suspension.
  - Direct attempts to access another writer's drafts or administrator operations.
- Require CI to run lint, TypeScript checking, unit tests, production build, and integration tests.
- Apply migrations to staging first, back up existing Supabase data, verify backfills and RLS, and then deploy application code.
- Release phases independently so the landing cleanup ships before database restructuring.

## Assumptions

- Qalam remains focused on Muslim long-form writing.
- Accounts remain invitation-only; public visitors can read but cannot follow, save, publish, or report.
- Invited members can publish immediately after completing their profile.
- Likes, comments, notifications, messaging, search, and short status posts are deferred.
- Existing content and user accounts must be preserved.
- The future hero illustration is not part of the initial cleanup; the temporary placeholder must not depend on a missing asset.
