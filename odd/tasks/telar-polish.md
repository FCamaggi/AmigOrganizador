# Telar polish: adopted lab ideas and first-test fixes

Objective: ship the lab ideas the owner kept and fix the issues from their first test.
Branch: rebuild (pushed to rebuild and master). Runner: `pnpm check`, Playwright screenshots.

## Specs

- S1 Lab verdicts (owner, 2026-11-25): "1. si 2. si pero con mejoras 3. me gusta pero no tiene la textura 4. no sabria donde aplicarlo bien, sientoq ue es exceso 5. no lo veo necesario 6. si 7. no, la variante no". Adopt 1 (warp skeleton), 2 improved (shuttle), 3 with yarn texture (tension), 6 (active row). Drop 4, 5, 7 and the lab page.
- S2 "el landing es raro, te manda a crear un grupo y al darle te manda al login".
- S3 "en el login ... te deja mandarlo sin poner el nombre".
- S4 "probe con el codigo y me dejo mandarlo pero falló sin mostrar ningun error, al hacerlo de nuevo funcionó".
- S5 "el tiempo para que cargue es significativo ... como podriamos atacar esto?"
- S6 "en celular la app se ve muy ajustada al tamaño de la pantalla, los botones casi se salen de esta".
- S7 "ahora haz esto y todo lo otro que habia pendiente, luego hazle commit y push".

## Tasks

- [x] T1 S7 docs alignment commit: inline, 35fff3c.
- [x] T2 S5 run functions next to the database (gru1) + S1 warp skeleton as loading fallbacks: inline, done.
- [x] T3 S1 shuttle on pending buttons: inline, done.
- [x] T4 S1 textured tension thread on plan marks: inline, done.
- [x] T5 S1 active row in the day cloth: inline, done.
- [x] T6 S2 S3 S4 sign-in flow, required name, visible failures: inline, done.
- [x] T7 S6 phone layout audit and fixes: inline, done.
- [x] T8 S1 remove the lab page; S7 commit and push: inline.

## Log

- L1 (2026-11-25) Original request: see S2-S6 (first test notes) and S1, S7.
- L2 Production TTFB on cached pages ~0.45-0.9s; vercel.json sets no region while Supabase is sa-east-1, so dynamic requests likely cross to iad1.
- L3 Phone audit: no element overflows at 360px; at 320px the rope label "Invitar por WhatsApp" wrapped inside a fixed 50px button. Primary buttons now scale the rope (clamp 1.0625-1.375rem) and may grow.
- L4 S4 root cause not reproduced (no logs reachable). Sign-in actions now catch and log failures (code and status only), show rate limits, and an app error boundary replaces silent failures.
- L5 Checks: `pnpm check` green (362 tests); e2e 20/20 (thread-color passed on rerun after a Playwright-internal error).
