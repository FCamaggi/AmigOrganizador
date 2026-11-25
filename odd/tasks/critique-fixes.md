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
- L4 (2026-11-24): owner feedback verbatim: "Ok, la tipografia no funciona bien, estan como todas las letras una sobre otras, además son negras? por otro lado los botones creo que tamien deberian de tener textura, se ven fuera de lugar, deberian ser como el boton listo de gestionar horarios, pero claro con el color que tienen al crear un grupo y estar sin el contenido que deberia de tener normalmente el contenido se ve mal, no sabria explicartelo revisalo, un grupo recien creado me meti a un demo para revisar, siento que el bloque de los hilos y quien esta libre deberia ser mas grande verticalmente, apretado todo es un poco dificil de leer"
- L5 (2026-11-24): fixes. Rope font rebuilt as TrueType: the CFF build stored a zero width inside every charstring (T2CharStringPen(0)), which FreeType ignores but other rasterisers use, so glyphs stacked. Titles dyed walnut with the thread shadow. Madder buttons are now madder cloth (`public/yarn/cloth-madder.webp` from the ink weave, white text 4.98:1 worst) with hover/press washes and a flat disabled state. Solo group uses the two-column board layout with an illustrative cloth (you + two loose friend threads). Day cloth rows 24→40px (16→28 dense), free yarn 14→20px, bigger dive ticks. `pnpm check` green, e2e 19/19, desktop captures of home, new group and demo reviewed.
- L6 (2026-11-24): owner: "los botones aun se ven rojos normales". Two causes: the madder weave was half the ink tile's contrast (14% vs 29% luminance variation), and the running `next dev` was serving stale CSS because the e2e `pnpm build` writes into the same `.next`. Madder tile regenerated at the ink weave strength on a deeper base (avg #96282 2, white 4.66:1 worst); e2e now builds into `.next-e2e` (`NEXT_DIST_DIR`). Checks green, e2e 19/19 with dev server still serving.
- L8 (2026-11-24): owner: "el contorno no se ve para nada, revisalo". The unlayered rule never reached the CSS (Tailwind drops unlayered rules whose selector is one of its utilities) and the dev server lagged one edit; moved into `@layer utilities` as an eight-direction 1px outline + halo, verified computed on a fresh server, and pinned by an e2e on the production build. e2e 20/20.
- L9 (2026-11-24): owner: "haz commit, push y merge a main, nadie ocupa la app asi que no hay problema con mergear a main". master fast-forwarded to rebuild (rebuild branched from master, no merge commit needed); both pushed over HTTPS (secret scan clean). Production (branch rebuild) deployed Ready; the master push made a preview that failed because turbo strict env dropped AMIGO_LOCAL_MODE: build env now lists AMIGO_LOCAL_MODE, SITE_URL, AUTH_GOOGLE_ENABLED, NEXT_DIST_DIR; both deploys green. Prod smoke (read-only): Knot title, rope font loaded, madder weave + outline, sw knot-offline-v2. Supabase config: email rate limit 30/h for when custom SMTP is on (not pushed with supabase config push).
