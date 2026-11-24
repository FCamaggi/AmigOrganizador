---
version: 1
slug: "src-app-g-code-page-tsx"
primary_target: "src/app/g/[code]/page.tsx"
related_targets: ["src/app/page.tsx","src/app/perfil/page.tsx"]
---

# Surface: group view (and the app-wide world it sets)

Scope: Operate. The group page is where the world is proven; home, profile, sign-in, new group, offline, privacy and the link preview inherit it.
Audience/job: a friend in a WhatsApp group opens the group to see when everyone can meet, picks the day, proposes it.
Constraints: unknown is never free; no colour-only meaning; 44px targets; es-CL copy through i18n; light ground (used on phones outdoors, in daylight).
Unresolved: profile activation flow (critique P0) and visitor preview (P1) are separate tasks.

## Direction contract

THESIS: Each person is a thread; where every thread rides on top, the cloth closes into a band, and that band is the day. Refuses the category's green heatmap grid and the old metro signage.

OWN-WORLD: Undyed grey-wool ground (#e9ebe8), indigo-black ink (#23263a), dyed-wool thread colours one per person (indigo, madder red, ochre, moss, plum…). Bricolage Grotesque for display, Figtree for UI. Soft 14px corners like a folded blanket edge; no shadows. Free = coloured thread on top; busy = thread dives, ground shows; unknown = loose dotted thread; chosen = knot/ring outline.

STORY: Open the group, see the next closed band and who is missing, read the woven fortnight, propose with one tap.

FIRST VIEWPORT: back + Invite row; group name large; "7 personas · 6 con horario"; ink panel "LA TELA SE CIERRA · Sáb 12 · 19:00 · Pueden 6 de 7 · falta el horario de Caro"; the cloth: one thread per member across ten days with the closed band outlined; sticky madder-red primary "Proponer el sábado 12".

FORM: assigned direction "Telar", candidate 6 of 7 (raises from wayfinding: one decision at a time; star atlas: rank as band weight; bitmap: one woven form at every scale; centre rail: every state a weave mark). seed:f3f269cf5dc4c9e7

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
