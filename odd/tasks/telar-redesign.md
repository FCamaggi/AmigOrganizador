# Telar redesign

Replace the "Línea de Metro" visual world with "Telar" across the web app.
Branch `rebuild`. Delivery: work-unit commits (owner pre-authorized commits on
`rebuild`; push asks). Tests: Vitest (`pnpm check`), Playwright e2e (`pnpm --filter @amigo/web e2e`).
Direction contract: `apps/web/.impeccable/surfaces/src-app-g-code-page-tsx.md`.

## Specs

- S1. Full redesign of the visual world; the metro is not taken as given. Owner: "El rediseño completo, me gustaria que se centrara en un concepto de algo que se junte al mismo tiempo o busque calzar, el metro no esta tan mal, pero solo quiero no tomarlo como cierto dado lo que hablamos ... CRITICO: no quiero que te sesgues con este prompt y mis ejemplos, se creativo".
- S2. Chosen direction: "Telar" (impeccable roll, seed:f3f269cf5dc4c9e7): each person is a thread; free = thread on top in its colour, busy = thread dives (ground shows), unknown = loose dotted thread; where every thread is on top the cloth closes into a band = the day. Grey-wool ground, indigo-black ink, one dyed-wool colour per person, Bricolage Grotesque + Figtree.
- S3. Raises carried into the build: one decision at a time (the group opens on the next closed band); rank read as band weight; one woven form at every scale (icon, strip, group card, own profile track); every state is a weave mark, never colour alone.
- S4. Product rules unchanged: unknown never free, no colour-only meaning, 44px targets, es-CL copy via i18n, responsive (never a phone column on desktop).
- S5. Fix the critique/audit findings on the surfaces being rebuilt: sticky footer hides keyboard focus (WCAG 2.4.11); selected day replaces the focus ring; strip days under 44px; member "no profile" state visual only; 11px text; `/perfil` overflow at 200% text; plan action row does not wrap; "Salir" 36px wide.
- S6. Finish per impeccable: detector run, finish review, DESIGN.md + design.json rewritten by the documenter, critique re-run to compare with 22/40.

## Tasks

- [x] T1 (S2, S4) inline: world foundation: tokens in `globals.css` (thread colours in `@theme static`, read from inline styles), Figtree + Bricolage Grotesque via next/font, thread palette (`lib/lines.ts`, all >= 3.9:1 on the ground, madder kept for the primary action), shared button/shell classes (sticky footers reserve scroll padding: S5 focus), 12px caption token replaces 11px text, woven app icon, link preview in the new world (static TTFs vendored).
- [x] T2 (S2, S3) inline: `components/day-cloth.tsx` replaces the line diagram: free = yarn on top, busy = only the base shows, unknown = loose dotted; the band is solid when everyone fits, dashed otherwise; no trunk collapse (big groups get a denser cloth). The own-profile track moves to T4.
- [ ] T3 (S3, S5) route TBD: group view composition: next-band panel, cloth, ranked bands by weight, member chips with thread colour and sr-only state, footer focus, strip, focus ring.
- [ ] T4 (S2, S5) route TBD: home, profile editor, sign-in, new group, offline, privacy in the new world.
- [ ] T5 (S6) inline: detector, finish review, documenter (DESIGN.md), critique re-run.

## Log

- L1 (2026-11-24): owner request verbatim: "El rediseño completo, me gustaria que se centrara en un concepto de algo que se junte al mismo tiempo o busque calzar, el metro no esta tan mal, pero solo quiero no tomarlo como cierto dado lo que hablamos, pueden ser animales, personas, eventos, constelaciones, etc. lo que sea CRITICO: no quiero que te sesgues con este prompt y mis ejemplos, se creativo".
- L2 (2026-11-24): context: the metro direction was chosen in phase1-one-link-one-plan T4a for the old plan-first product and inherited after ADR 0004 without review. Critique 22/40 and audit 15/20 that day. Seven grounded candidates (overprint, score/choir, weather forecast, tide table, radio dial, loom, market signs); the roll assigned #6 Telar; the owner picked it on the decision page ("assigned"). Sketch: `apps/web/.impeccable/mocks/decision/assigned.html`.
- L3 (2026-11-24): T1 + T2 done. Gotcha: Tailwind v4 drops theme variables no utility uses, so colours read from inline styles live in `@theme static`. Checks: `pnpm check` green; screenshot of the day cloth at 390 reviewed.
