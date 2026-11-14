---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: []
---

# Plan results and plan flow (app screens)

Scope: the Phase 1 app screens (plan link preview, sign-in hand-off, mark busy time, ranked options, confirm). Mode: Operate. Build path: code-led. Chosen sketch: `.impeccable/mocks/decision/model-pick.html`.

Audience and task: mixed friend groups in Chile on a phone; organizer wants a confirmed plan, participants want to answer in under a minute. Constraints: WCAG 2.2 AA, states readable by shape, Spanish (Chile) copy.

## Direction contract

THESIS: Each friend is a metro line running across the day; where every line is free at once, a station appears, and that station is the option. Refuses the category default of a days × people check table.

OWN-WORLD: White ground, ink #1D1D1B, Santiago Metro line colours (red #E1251B, yellow #FFC20E, blue #0065BD, green #00A651) assigned one per person and never behind body text where contrast fails; bold condensed signage sans for labels and times; station markers as white-filled rounded capsules with ink outline; enamel-sign flatness, no shadows or gradients.

STORY: The visitor sees who is in, who hasn't answered, and the three best stations with their reasons; understands why each one ranks; confirms one or nudges the missing friend.

FIRST VIEWPORT: Top: plan title, range and response count. Below: one line diagram of the best evening, each person a coloured line, the shared free span a labelled station. Then the ranked options as list rows with a station dot, time, "5/6 pueden" and reason chips. Primary action (Confirmar) as a full-width button at the bottom; share/invite as secondary.

FORM: Línea de Metro, position 1 of my ordered list (IMPECCABLE'S PICK), seed:36a938293246d30e.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Signature interaction: the line diagram; tapping an option redraws the day's lines and moves the station to that option's span.
Unresolved: diagram legibility with 8+ people (collapse to a count line beyond 6); busy-time entry screen pattern within this world.
