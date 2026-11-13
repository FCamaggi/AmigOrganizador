# ADR 0001 — Clean-slate rebuild

- **Status:** accepted
- **Date:** 2026-11-13

## Context

v1 was not adopted. Its core flow (account first, manual monthly busy slots,
snapshot calendar import) is the problem, not a set of bugs. See
`docs/product/LESSONS_V1.md`. Its code has two overlapping availability
models, almost no tests, and runs on hosting with cold starts.

## Decision

Rebuild from scratch on branch `rebuild`. Nothing from v1 is sacred:

- No v1 code is copied. The engine's ideas are ported from a written spec
  (`docs/domain/AVAILABILITY_ENGINE.md`), test-first.
- v1 stays on `master` (and its docs in `docs/legacy/`) for reference until v2
  ships; then `rebuild` replaces `master`.
- No data migration: v1 has no meaningful user base to carry over.

## Consequences

- Phase 1 must reach feature parity only on what matters (link to plan), not
  on every v1 screen.
- The events microservice (`AmigOrganizadorEventos`) is retired; Phase 3
  rebuilds suggestions behind a port with several sources.
