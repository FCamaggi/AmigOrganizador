# AmigOrganizador v2 — project conventions

Read `docs/product/VISION.md` and `docs/product/LESSONS_V1.md` before
proposing features. Every feature must serve the north star: plans confirmed
per week.

## Product rules (non-negotiable)

- No account is required to take part in a plan.
- `unknown` availability is never treated as `free`.
- We read calendars (free/busy only) and write invites back; we never store
  event titles or descriptions from a user's calendar.

## Architecture

- Hexagonal: `packages/core` is pure TypeScript. It never imports React,
  Next.js, Drizzle, Supabase or any I/O. Adapters implement its ports.
- Business rules live in `core`, not in components, routes or SQL.
- Times are stored in UTC and computed in the group's IANA timezone.

## Language

- Code, identifiers, comments, commit messages and docs: English.
- UI copy: Spanish (Chile), through i18n keys from the start; no hard-coded
  user-facing strings in components.

## Workflow

- Branch `rebuild` is the v2 trunk until it replaces `master`.
- Large work is tracked in `odd/tasks/<feature>.md` (Specs, Tasks, Log).
- Test-first for `core`: write the failing test, then the code.
- Conventional Commits. Ask the owner before any commit, push or PR.
- v1 reference: `git show master:<path>`; v1 docs in `docs/legacy/`.
