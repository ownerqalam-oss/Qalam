# Qalam

An invite-only, writing-first social platform built with Next.js and Supabase.

## Local development

Copy `.env.example` to `.env.local`, configure the Supabase values, and apply the versioned migrations described in `supabase/README.md`.

For a complete clean-project setup, Auth configuration, first-admin bootstrap, and production smoke test, see [Supabase Handover](docs/supabase-handover.md).

```powershell
npm install
npm run dev
```

The app uses cookie-based Supabase sessions. `proxy.ts` refreshes tokens only; protected layouts, Server Actions, Route Handlers, and Row Level Security authorize access at their own boundaries.

## Checks

```powershell
npm run lint
npm run typecheck
npm run build
```
