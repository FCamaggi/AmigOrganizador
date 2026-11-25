# Critique fixes (2026-11-24 critique, 26/40)

Fix the priority issues of the dual-agent critique, invite entry first.
Branch `rebuild`. Delivery: work-unit commits (pre-authorized; push asks).
Tests: `pnpm check`, `pnpm --filter @amigo/web e2e`.

## Specs

- S1. [P1] "La invitación no muestra valor y unirse pide dos toques rojos": the invite view previews the group's best day; the post-sign-in step reads as a distinct confirmation that says what is shared; joining lands on the group, not /perfil. The confirmation tap stays (privacy: no auto-join from a cross-site redirect).
- S2. [P1] "El grupo recién creado no tiene acción principal": one madder "Invitar por WhatsApp" and a quiet "Copiar link"; invite before the profile notice.
- S3. [P2] "La tira de días se satura": the strip must tell days apart when every day has the same head count.
- S4. [P2] "La hora del plan aparece de tres formas": one canonical window plus one reason sentence.
- S5. [P2] "Las filas del ranking repiten etiquetas y avatares": keep only differentiating tags.

## Tasks

- [x] T1 (S1, S2) inline: invite preview, distinct confirmation, land on group; solo group primary invite.
- [x] T2 (S3, S4, S5) inline: group page clarity.

## Log

- L1 (2026-11-24): owner request verbatim: "dale con todo" (after choosing "Entrada por invitación" as the first area of the critique).
- L2 (2026-11-24): T1 done. Invite view shows "Mejor día hasta ahora: … · pueden N de M" (or "Cuando armen sus perfiles…"), counts only; signed-in visitors see "¿Te unes a {name}?" with what is shared; join lands on the group. Kept the confirmation tap on purpose: auto-joining after the sign-in redirect would let a third-party link add someone to a group and share their availability without consent. Solo group: madder "Invitar por WhatsApp" + quiet "Copiar link", before the profile notice. Tests were written before the code but not run RED separately. `pnpm check` green, e2e 19/19 (2 new in invite.spec; footer-focus follows the new landing).
- L3 (2026-11-24): T2 done. One canonical time: the free window (decision panel, option rows, cloth band, invite preview); the suggested start lives only in the propose form, and the "Libres de … a …" line is gone. Strip: when everyone can, the caption shows the window length ("4 h", "2,5 h"; label "pueden todos, 4 h libres") instead of N/N. Tags every option shares are dropped ("Más pronto" stays: it breaks ties). RED observed: 3 of 4 new unit tests fail on the old view model. `pnpm check` green, e2e 19/19, capture of a two-member group reviewed.
