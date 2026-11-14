# Phase 0 — Foundation

Objective: clean repo and scaffold for the v2 rebuild. Branch: `rebuild`.
Delivery: ask-on-risk. Test runner: Vitest (once the scaffold exists).

## Specs

- S1: "redefinir todo, hacer todo de nuevo y de buena forma usando el flujo de trabajo que tenemos armado en este ambiente agentico, no deberiamos de tratar nada como sagrado"
- S2: "partamos con ordenar para partir a hacer esto, haz todo el setup para luego seguir trabajando"
- S3: "recibo absolutamente propuestas y como podemos escalar mas allá, el cielo es el limite"
- S4: Event suggestions may later include "lugares para comer por trendings o alguna forma de estudio o promocion" (Phase 3 in the roadmap).

## Tasks

- [x] T1 (S1, S2) inline: replace local copy with `FCamaggi/AmigOrganizador`; branch `rebuild`; remove v1 code; move v1 docs to `docs/legacy/`. Commit `92a758f`.
- [x] T2 (S1, S3, S4) inline: vision, lessons, roadmap, engine spec, ADR 0001, ADR 0002, CLAUDE.md, README. Commit `b5d50dc`.
- [x] T3 (S2) inline: stack decided, ADR 0002 accepted.
- [x] T4 (S2) inline: pnpm + Turborepo monorepo, `apps/web` (Next.js 16, Tailwind 4), `packages/core`, Biome, Vitest, GitHub Actions CI. `pnpm check` and `pnpm build` green locally. Commit `87e13d9`. Vercel and Supabase projects pending (need the owner's accounts).
- [x] T5 (S1) inline: `packages/core` engine `findWindows`, test-first (RED: modules missing; GREEN: 30 tests). Spec updated with the respondents rule and the timezone-free local-date model.

## Log

- L1 (2026-11-13): "En este proyecto tengo una app de organizacion para amigos, la idea es que todos pudieran colocar sus horarios y asi se calcula de diferentes formas los dias ideales, ademas agregué una forma de sacar eventos para esos dias (podriamos ver como añadir que se recomienden lugares para comer por trendings o alguna forma de estudio o promocion), pero en general la app no esta cumpliendo, me cuesta que las personas lo adopten, prefieren normalmente tener su propio horario, es dificil de ocupar, tiene pocos life quality, etc. Sinceramente lo que haria yo es redefinir todo, hacer todo de nuevo y de buena forma usando el flujo de trabajo que tenemos armado en este ambien agentico, no deberiamos de tratar nada como sagrado, es algo nuevo aprendiendo de nuestros errores de esta app actual, partamos con ordenar para partir a hacer esto, haz todo el setup para luego seguir trabajando, recibo absolutamente propuestas y como podemos escalar mas allá, el cielo es el limite"
- L2 (2026-11-13): local folder held a Mi2ente copy; owner: "ahi si git@github.com:FCamaggi/AmigOrganizador.git, borra esto, es una copia, no importa nada por borrarla". Replaced it.
- L3 (2026-11-13): post-mortem of v1 + events repo done by a read-only explorer; condensed into `docs/product/LESSONS_V1.md`. Next: T3.
- L4 (2026-11-13): Engram mirror `odd/phase0-foundation/tasks` pending: project is ambiguous (`amigorganizador` vs `mi2ente`, the folder used to hold a Mi2ente copy).
- L5 (2026-11-13): native review of the first workspace candidate failed with `lens_context_budget_exceeded` (38,288 lines, almost all v1 deletions). Owner: "si, haz los dos commits y vamos con ese stack". Split into `92a758f` (deletions, too large to review; recoverable from `master`) and `b5d50dc` (docs, assessed medium, `under_budget`).
- L6 (2026-11-13): pnpm via corepack failed locally (missing cached `pnpm.cjs`); `npx pnpm@10.34.9` works. TypeScript pinned to 5.x (7.0 is latest) for Next.js compatibility.
- L7 (2026-11-13): owner: "tienes autorizacion de cualquier commit, con que continues el trabajo, estas ahora automatico e independiente". Commits no longer need confirmation; push/PR still do.
- L8 (2026-11-13): engine decisions: threshold counts free members against respondents (members with any coverage in range); the engine is timezone-free (local date + minutes), adapters convert from UTC. Phase 0 closed; next feature: Phase 1 (`odd/tasks/phase1-one-link-one-plan.md`).
