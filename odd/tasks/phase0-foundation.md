# Phase 0 — Foundation

Objective: clean repo and scaffold for the v2 rebuild. Branch: `rebuild`.
Delivery: ask-on-risk. Test runner: Vitest (once the scaffold exists).

## Specs

- S1: "redefinir todo, hacer todo de nuevo y de buena forma usando el flujo de trabajo que tenemos armado en este ambiente agentico, no deberiamos de tratar nada como sagrado"
- S2: "partamos con ordenar para partir a hacer esto, haz todo el setup para luego seguir trabajando"
- S3: "recibo absolutamente propuestas y como podemos escalar mas allá, el cielo es el limite"
- S4: Event suggestions may later include "lugares para comer por trendings o alguna forma de estudio o promocion" (Phase 3 in the roadmap).

## Tasks

- [x] T1 (S1, S2) inline: replace local copy with `FCamaggi/AmigOrganizador`; branch `rebuild`; remove v1 code; move v1 docs to `docs/legacy/`. Uncommitted.
- [x] T2 (S1, S3, S4) inline: vision, lessons, roadmap, engine spec, ADR 0001, ADR 0002 (proposed), CLAUDE.md, README. Uncommitted.
- [ ] T3 (S2) inline: decide stack (ADR 0002) with the owner.
- [ ] T4 (S2): monorepo scaffold, Biome, Vitest, CI, Vercel preview.
- [ ] T5 (S1): `packages/core` engine, test-first, from `docs/domain/AVAILABILITY_ENGINE.md`.

## Log

- L1 (2026-11-13): "En este proyecto tengo una app de organizacion para amigos, la idea es que todos pudieran colocar sus horarios y asi se calcula de diferentes formas los dias ideales, ademas agregué una forma de sacar eventos para esos dias (podriamos ver como añadir que se recomienden lugares para comer por trendings o alguna forma de estudio o promocion), pero en general la app no esta cumpliendo, me cuesta que las personas lo adopten, prefieren normalmente tener su propio horario, es dificil de ocupar, tiene pocos life quality, etc. Sinceramente lo que haria yo es redefinir todo, hacer todo de nuevo y de buena forma usando el flujo de trabajo que tenemos armado en este ambien agentico, no deberiamos de tratar nada como sagrado, es algo nuevo aprendiendo de nuestros errores de esta app actual, partamos con ordenar para partir a hacer esto, haz todo el setup para luego seguir trabajando, recibo absolutamente propuestas y como podemos escalar mas allá, el cielo es el limite"
- L2 (2026-11-13): local folder held a Mi2ente copy; owner: "ahi si git@github.com:FCamaggi/AmigOrganizador.git, borra esto, es una copia, no importa nada por borrarla". Replaced it.
- L3 (2026-11-13): post-mortem of v1 + events repo done by a read-only explorer; condensed into `docs/product/LESSONS_V1.md`. Next: T3.
- L4 (2026-11-13): Engram mirror `odd/phase0-foundation/tasks` pending: project is ambiguous (`amigorganizador` vs `mi2ente`, the folder used to hold a Mi2ente copy).
