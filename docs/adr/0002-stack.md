# ADR 0002 — Stack

- **Status:** accepted (owner: "vamos con ese stack", 2026-11-13)
- **Date:** 2026-11-13

## Forces

- Everyone joins by link and signs in with one tap (Google or magic link; see ADR 0003).
- Live collaboration on one plan (several friends filling availability at once).
- Calendar OAuth (Google, Microsoft) and ICS feeds, read in the background.
- Installable PWA with push notifications; link previews for WhatsApp.
- No cold starts. Free or near-free until there is traction.
- One language end to end so the pure engine runs on server and client.
- Hexagonal boundaries: the domain never imports a framework.

## Proposal

| Layer | Choice | Why |
|-------|--------|-----|
| Language | TypeScript (strict) everywhere | Engine shared by client and server |
| Repo | pnpm workspaces + Turborepo | `apps/*` and `packages/*` with cached tasks |
| Web app | Next.js (App Router) as a PWA | SSR for link previews, server actions, Vercel previews per push |
| Domain | `packages/core`: pure TS, zero dependencies | The engine and plan rules; test-first |
| Database | Postgres on Supabase | Auth (magic link, Google OAuth), realtime, row-level security, cron |
| Data access | Drizzle ORM behind repository ports | Typed SQL, migrations in the repo |
| UI | Tailwind CSS + Radix-based components | Accessible primitives, fast iteration |
| Tests | Vitest (unit), Playwright (e2e) | Same runner for core and app |
| Quality | Biome (lint + format), GitHub Actions | One fast tool, CI on every push |
| Hosting | Vercel (web) + Supabase (data) | No sleeping servers on free tiers |

### Layout

```
apps/web            Next.js app (UI, routes, adapters wiring)
packages/core       Domain: availability engine, plans, ports (interfaces)
packages/db         Drizzle schema, migrations, repository adapters
packages/calendar   Google / Microsoft / ICS adapters (Phase 2)
packages/ui         Shared design-system components
```

## Alternatives considered

- **SvelteKit + Supabase:** lighter and fast, smaller ecosystem for the
  auth/calendar pieces; fine if the owner prefers Svelte.
- **Expo (React Native) first:** best native feel and push, but slower to
  ship and worse for link-first visitors who should never install anything.
- **Keep Express + Mongo (v1 stack):** familiar, but brings back cold starts
  and lacks auth, realtime and relational integrity out of the box.
