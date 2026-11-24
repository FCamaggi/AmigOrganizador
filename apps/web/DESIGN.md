---
name: Knot
description: Telar. Each friend is a thread across the day; where every thread rides on top, the cloth closes into a band, and that band is the plan.
colors:
  ground: "#e9ebe8"
  surface: "#fbfbfa"
  panel: "rgba(35, 38, 58, 0.06)"
  ink: "#23263a"
  ink-sub: "#c9ccd8"
  mute: "#4a4d60"
  rule: "#d3d6d0"
  rule-strong: "#6f7284"
  madder: "#b8322a"
  madder-pressed: "#9c2a23"
  madder-active: "#85231d"
  indigo: "#2f4fa2"
  danger: "#a3221a"
  thread-indigo: "#2f4fa2"
  thread-ochre: "#9a6a0a"
  thread-moss: "#3e7d5a"
  thread-plum: "#7a4b9c"
  thread-teal: "#1f7a80"
  thread-rose: "#a8406e"
  thread-walnut: "#6b4a2b"
  thread-ink: "#23263a"
typography:
  display-hero:
    fontFamily: "Bricolage Grotesque, Figtree, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.015em"
  display-decision:
    fontFamily: "Bricolage Grotesque, Figtree, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  headline-group:
    fontFamily: "Bricolage Grotesque, Figtree, sans-serif"
    fontSize: "2rem"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  title-page:
    fontFamily: "Bricolage Grotesque, Figtree, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title-section:
    fontFamily: "Bricolage Grotesque, Figtree, sans-serif"
    fontSize: "1rem"
    fontWeight: 800
    lineHeight: 1.35
    letterSpacing: "-0.015em"
  title-row:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 800
    lineHeight: 1.25
  body:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.35
    fontFeature: "tnum"
  body-small:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.35
  label:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.35
  caption:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.35
  button:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 800
    lineHeight: 1.35
  button-small:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 700
    lineHeight: 1.35
rounded:
  knot: "6px"
  cloth: "14px"
  thread: "9999px"
spacing:
  hair: "3px"
  xs: "6px"
  sm: "8px"
  md: "12px"
  gutter: "16px"
  gutter-sm: "24px"
  gutter-lg: "32px"
  target: "44px"
components:
  button-primary:
    backgroundColor: "{colors.madder}"
    textColor: "#ffffff"
    typography: "{typography.button}"
    rounded: "{rounded.cloth}"
    padding: "0 16px"
    height: "50px"
    width: "100%"
  button-primary-hover:
    backgroundColor: "{colors.madder-pressed}"
  button-primary-active:
    backgroundColor: "{colors.madder-active}"
  button-primary-disabled:
    backgroundColor: "{colors.rule}"
    textColor: "{colors.mute}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.button-small}"
    rounded: "{rounded.cloth}"
    padding: "0 12px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.panel}"
  button-secondary-active:
    backgroundColor: "{colors.rule}"
  toggle-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.cloth}"
    height: "44px"
  decision-panel:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    typography: "{typography.display-decision}"
    rounded: "{rounded.cloth}"
    padding: "16px"
  cloth-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.cloth}"
    padding: "10px 12px"
  input-text:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.cloth}"
    padding: "0 12px"
    height: "48px"
  member-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.knot}"
    padding: "4px 10px"
  member-chip-no-schedule:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.mute}"
  reason-tag:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.knot}"
    padding: "1px 6px"
  best-tag:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    typography: "{typography.caption}"
    rounded: "{rounded.knot}"
    padding: "2px 6px"
  avatar:
    textColor: "#ffffff"
    typography: "{typography.caption}"
    rounded: "{rounded.thread}"
    size: "24px"
---

# Design System: Knot

## Overview

**Creative North Star: "Telar"**

The app is a loom. Each person in a group is one dyed-wool thread running across the hours of a day. Where a person is free their thread rides on top of the cloth in their colour, spun so its twist shows; where they are busy the thread dives under the cloth and only a thin grey under-thread runs between two coloured ticks; where nobody knows their schedule the thread hangs loose and dotted. Where every thread rides on top at once, the cloth closes into a band, and that band is the day the group meets. The whole interface exists to make that band visible and to propose it in one tap.

The material is real: every free thread is drawn with a twisted-wool texture (raster strips generated in `scripts/yarn/` from the brand's yarn generator), and every surface is a woven tile, never a flat fill. The ground is undyed grey wool, the ink is indigo-black, and the only saturated colour that is not a person is madder red, reserved for the one action that ends the screen. Surfaces are folded cloth with soft 14px blanket-edge corners and no box-shadows; the single lift in the system is the soft shadow a thread casts on the weave beneath it. Density is phone-first and generous at the target level (44px minimum) but tight in the woven diagrams, which grow denser, never taller, as groups grow. The app is light only on purpose: it is read on phones outdoors, in daylight.

The world refuses the scheduling category's green heatmap grid and the replaced "Línea de Metro" signage. The weave is one form at every scale: the full day cloth, the small woven band beside each option, the day strip, the member chips, the plan marks, the app icon and the link preview all draw the same thread language.

**Key Characteristics:**
- One thread per person, in the colour they picked (or a free one by join order); colour says *who*, shape says *state*.
- Real yarn on woven cloth: textured threads, woven grounds, cards and panels; states are translucent ink washes over the weave.
- Free = spun thread on top; busy = solid grey under-thread with coloured dive ticks; unknown = loose dotted thread. Unknown never reads as free.
- The closed band (an ink-outlined window with a faint warp-and-weft fill) is the decision.
- Madder red is the single primary action per screen and is never a person's colour.
- Woven surfaces, 14px and 6px corners, no box-shadows, light ground only.
- Bricolage Grotesque for names and big numbers; Figtree for everything you operate.

## Colors

An undyed, slightly green-grey wool ground with indigo-black ink, eight dyed-wool thread colours for people, and one madder red for action.

### Primary
- **Madder Red** (madder): the primary action only: the sticky "Proponer…" button, "Crear grupo", the install hint. Darkens to **Pressed Madder** (madder-pressed) on hover and **Deep Madder** (madder-active) while pressed. White text on it holds 5.9:1.

### Secondary
- **Loom Indigo** (indigo): links, back navigation, "Ver más días" disclosure text, and the focus ring. It shares its value with the first thread colour; as a link it is always underlined or paired with a chevron, never colour alone.

### Tertiary: the thread palette
Eight dyed-wool colours, defined once in `@amigo/core` (`THREAD_COLORS`) and drawn through `threadColor(slot)`, each at least 3.9:1 against the grey-wool ground so no thread needs an outline. A person picks theirs in the profile; inside a group `groupThreads` hands out slots in join order: each member claims the colour they picked (or, with no choice, the slot of their join position), and when it is taken, whoever joined first keeps it and the newcomer takes the next free colour. The member whose colour changed sees one line saying so in the group.
- **Indigo** (thread-indigo), **Ochre** (thread-ochre), **Moss** (thread-moss), **Plum** (thread-plum), **Teal** (thread-teal), **Rose** (thread-rose), **Walnut** (thread-walnut), **Ink** (thread-ink).
- They appear only as thread material: yarn segments, dive ticks, avatar fills and borders, member-chip swatches, the profile's colour picker. They are never used for text, panels or buttons.
- Each colour has a matching yarn strip; `.yarn` picks it from the inline colour, so components pass only `threadColor(slot).value` as `backgroundColor`.
- Thread colours are emitted as static theme variables because components read them from inline styles.

### Neutral
- **Grey Wool** (ground): the page, `html` and sticky footers, drawn as the coarse grey weave tile (96px); the hex is the flat colour underneath while the tile loads and the theme colour.
- **Bleached Cloth** (surface): cards, the day cloth, the selected option row, inputs, secondary buttons, drawn as the fine light weave tile.
- **Fold Wash** (panel): a translucent ink wash (6%) over the fine weave: skeletons, the no-schedule member chip, low-rank woven band frames, and the hover state of rows and controls.
- **Indigo-Black Ink** (ink): all primary text, the decision panel (drawn as the dark wool tile), outlines of the closed band and selected states, the "Mejor" tag.
- **Pale Indigo** (ink-sub): secondary text on the ink decision panel only (9.3:1 on flat ink, 4.8:1 on the lightest fibres of the dark wool).
- **Slate Mute** (mute): secondary text, axis labels, placeholders, dotted loose threads (6.9:1 on flat ground, 6.06:1 on the darkest fibres of the grey weave).
- **Hairline** (rule): list dividers, the bare warp line behind each thread, disabled primary fill.
- **Strong Rule** (rule-strong): the busy under-thread, input and chip borders, low-rank band frames. Non-text only (4.0:1 on ground).
- **Danger** (danger): inline error text only.

### Named Rules
**The Colour Says Who Rule.** A thread colour identifies a person and nothing else. Free, busy and unknown are carried by shape (spun on top, dived under, loose dotted), so the cloth reads the same in greyscale.

**The Madder Is Not A Person Rule.** Madder red is reserved for the primary action and is never given to a thread. If a screen has two madder elements, one of them is wrong.

**The Measured On The Weave Rule.** Text contrast is measured against the textured tiles at text scale (the 2nd and 98th percentile fibres), not the flat hex. Ink stays above 10.8:1 and mute above 6:1 on every light weave; white on the dark wool stays above 7.6:1.

**The First To Join Keeps It Rule.** A member who joins later never changes anyone else's thread. Clashes resolve in join order, and only the person whose colour moved is told, in one line.

**The Double-Ply Rule.** When a group outgrows the eight colours, second-cycle members (`threadPly(index) === 2`) draw every thread, swatch and avatar border double-ply, so no member relies on colour alone.

## Typography

**Display Font:** Bricolage Grotesque (falls back to Figtree, then sans-serif)
**Body Font:** Figtree (falls back to system-ui, sans-serif)

**Character:** Figtree carries the interface with a friendly, round, legible voice; Bricolage Grotesque sets names and big numbers, where the woven world speaks loudest. All `h1` and `h2` are Bricolage with tightened tracking (-0.015em); body text uses tabular numerals so times and counts align.

### Hierarchy
- **Display Hero** (800, 2.5rem growing to 3rem at `sm` and 3.75rem at `lg`, line-height 1.05): the signed-out home headline only.
- **Display Decision** (800, 1.625rem / 1.875rem from `sm`, line-height 1.08, -0.02em): the day and time inside the ink decision panel ("Sáb 5 dic · 19:00").
- **Headline Group** (800, 2rem / 2.25rem from `sm`, line-height 1.05, -0.02em): the group or plan name at the top of the group view.
- **Title Page** (800, 1.75rem, line-height 1.25): single-task and list screen titles (Grupos, Perfil, Entrar, new group, privacy).
- **Title Section** (800, 1rem): section headings ("Próximas 4 semanas", "Mejores días"). Larger card headings use 1.25rem.
- **Title Row** (800, 1.0625rem, tight): option days, plan names, group names in lists; the time beside it drops to 500 weight in mute.
- **Body** (400, 1rem, line-height 1.35, tabular numerals): default text.
- **Body Small** (400, 0.875rem): supporting lines in mute; 0.8125rem for notes beside avatars and option windows.
- **Label** (700, 0.875rem): field labels, chip names, cloth captions.
- **Caption** (400–800, 0.75rem): axis ticks, legend, avatar initials, tags, counts under the strip.
- **Counts** scale with rank in option rows: 1.25rem for the best option, 1.125rem for the second, 1rem at 85% ink for the rest.

### Named Rules
**The Names Are Display Rule.** Bricolage is for group names, the decided day and the hero; anything you tap or read in a list is Figtree.

## Layout

Every screen is fluid. On a phone the shell is full width with a 16px gutter; from `sm` the gutter is 24px and the column caps at 42rem (`max-w-2xl`), 48rem at `md`, and 72rem at `lg` with a 32px gutter. Single-task screens (sign in, create) use a narrow shell capped at 36rem. A screen is never held at phone width on a large display.

The group view becomes two columns at `lg`: the cloth, strip and ranked options on the left (`minmax(0,1fr)`) and a sticky 22rem aside on the right holding the primary action, invite and share, the profile notice and member chips, with a 40px column gap. The signed-in home uses a 20rem list column beside the content; the signed-out home splits the hero and the woven illustration into two equal columns.

On phones the primary action sits in a **sticky footer** on the grey-wool ground with a hairline top border, bleeding to the shell gutter and padded for the safe area. Whenever a sticky footer exists, the page reserves `scroll-padding-bottom` of the footer height plus 12px so a focused control is never hidden beneath it. At `lg` the footer becomes static at the top of the aside.

The day strip scrolls horizontally and bleeds to the screen edge on phones; each day is a 44px-wide target. Vertical rhythm is in steps of 12–24px between sections (`mt-3` to `mt-6`); list rows use 12px vertical padding and hairline dividers rather than cards.

## Elevation & Depth

There is no box-shadow anywhere. Depth is tonal and textile: the coarse grey-wool ground, a fine bleached-cloth weave laid on it, the dark wool of the decision panel, and translucent ink washes for hover, pressed and inactive material. Emphasis comes from border weight and the ink panel, not from lift.

The one lift is the thread itself: spun yarn carries cylindrical shading (a light top, a dark bottom) and a soft drop shadow (`filter: drop-shadow(0 1px 1px rgb(20 22 34 / 0.28))`) so it reads as rope lying on the cloth at 10–14px. Yarn that carries a label (a free avatar's initial) drops the shadow and takes a uniform 30% dark wash instead, so white text holds 5.9:1 or more on its lightest fibres.

The only "depth" is the woven metaphor itself: a free thread sits on top of the warp line, a busy thread dives beneath it (shown as a thin solid under-thread between coloured ticks), and the closed band is a faint warp-and-weft fill behind the threads.

### Named Rules
**The Flat Cloth Rule.** Surfaces never cast shadows; only threads do. To raise importance, thicken the ink border (1px rule, 1.5px ink, 2.5–3px ink) or invert to the ink panel.

**The Opaque Weave Rule.** The tiles are opaque, so a state is a translucent wash layered over the weave (`--cloth-wash`), never a flat colour that would either vanish under the tile or cover it with a flat patch. For the same reason, an inline style on a `.yarn` element sets `backgroundColor`, never the `background` shorthand, which resets the texture to none.

## Shapes

Two corners only. **Cloth** (14px) is the folded-blanket edge used on every card, panel, button, input, day-strip target and the day cloth itself. **Knot** (6px) is the small tied corner used on chips, tags, woven bands, the closed-band outline and the focus ring. Threads, avatars and the band's time label are fully round.

Borders carry meaning by weight and dash: a solid ink outline is chosen or closed; a dashed outline is partial or not yet confirmed (the open band, a proposed plan mark); a dotted outline is missing information (the no-schedule chip, the unknown avatar). Busy avatars carry a diagonal ink strike through the initial.

## Components

### Buttons
Tactile and plain: one primary and one secondary shape everywhere (`buttonClasses`).
- **Shape:** folded-cloth corners (14px).
- **Primary:** madder red, white 800-weight 1.0625rem text, 50px tall, full width. Hover darkens to pressed madder, active to deep madder; disabled is hairline grey with mute text. One per screen.
- **Secondary:** bleached cloth weave with a 1.5px ink border, 700-weight 0.9375rem ink text, at least 44px tall, flexing to share a row (Invitar / Compartir). Hover lays a 5% ink wash over the weave, pressed a 10% wash.
- **Toggle (duration picker):** 44px cloth-cornered cells with a 1.5px strong-rule border; the pressed one inverts to ink with surface text.
- **Text links:** indigo, bold, underlined with a 3px offset, inside a 44px tall hit area.

### Chips
- **Member chip:** knot corners, 1px strong-rule border, bold 0.875rem name, led by a 16×8px spun-yarn swatch in the member's thread colour (two stacked plies for second-cycle members). A member with no schedule gets a dotted border on panel with mute text plus a screen-reader note. The swatch colour is the member's slot in this group, not their raw pick.
- **Reason tag:** knot corners, 1px strong-rule border on surface, bold caption ("Tarde-noche", "Buen día").
- **Best tag:** ink fill with surface text, knot corners, shown only on the top-ranked option.

### Cards / Containers
- **Corner Style:** cloth (14px).
- **Background:** surface on the ground; the day cloth sits on surface with no border.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** none for the cloth; 1px rule for informational cards; 1.5–2px ink for the propose form and the no-profile notice; 1px dashed rule for empty states.
- **Internal Padding:** 16px (20px from `sm`); the day cloth uses 10px by 12px.

### Inputs / Fields
- **Style:** surface fill, cloth corners, at least 48px tall, 1.5px border (ink for the primary title field, strong rule otherwise), bold label above in ink.
- **Focus:** the global 3px indigo outline with a 2px offset and knot corners.
- **Error:** bold danger text in a `role="alert"` paragraph below the fields.

### Navigation
- **Top bar:** a single row, bold 0.875rem: an indigo back link with a chevron on the left (44px tall, bleeding 8px into the gutter), an optional ink aside on the right. No app chrome, no tab bar.
- **Disclosures:** `details` rows with an indigo or ink bold label and a chevron that rotates 90° when open.

### Day Cloth (signature)
The day as cloth: one row per member across the useful day (08:00–24:00, widened only if the option falls outside it). Each row has a bare hairline warp; free segments are spun yarn 8px tall in the member's colour (two 4px plies for second-cycle members), busy segments a 3px solid strong-rule under-thread with 2.5px coloured ticks where the thread dives and resurfaces, unknown segments a 2px dotted mute line. The option's window is outlined in ink with a round ink time label above: a 2px dashed outline while partial, a 3px solid outline with the warp-and-weft fill when everyone fits. From nine members rows thin from 20px to 16px; people are never collapsed together. Initials label rows on phones, full names (7rem column) from `lg`. A bold summary ("Calzan 10 de 12 · 19:00–22:00") and a caption legend sit below. Segment edges ease over 220ms (`cubic-bezier(0.16, 1, 0.3, 1)`) when motion is allowed.

### Woven Band (signature)
The day cloth in miniature beside each ranked option and in each day-strip cell: one 6px row per member (5px from seven members), drawn with the same free/busy/unknown thread forms. The frame's border weight carries rank: 2.5px ink on surface for the best option, 1.5px ink for the second, 1px strong rule on panel for the rest. It takes the focus ring of its row's hidden radio.

### Option Row
A radio row: woven band, day in title-row weight with the time in mute, reason tags, avatars, and a right-aligned "10/12 pueden" count scaled by rank. Rows are separated by hairlines; the selected row lifts to surface, others wash to panel on hover.

### Avatars
24px round initials in caption weight 800. Free: filled with the member's labelled yarn (texture plus a 30% dark wash), white text. Busy: surface fill, thread-coloured 1.5px border, ink text and a diagonal ink strike. Unknown: dashed mute border, mute text. Second-cycle members use a 3px double border. Up to eight show, then "+N".

### Decision Panel
The ink slab at the top of the group view: dark wool weave, surface display-decision text for the day and time, ink-sub line for who can and who is missing. It is the only inverted surface.

### Thread Picker
Beside the name on the profile, a 44px "Tu hilo" control led by the person's yarn swatch (or a loose dotted thread when the choice is automatic) opens a sheet: eight yarn swatches with their Spanish names in a two-column grid (three from `sm`), plus "Automático". Each choice is a 48px cloth-cornered radio card; the checked one takes an ink border and a 2px ink ring, so selection never relies on the swatch colour. The sheet's one line explains that a group may show another colour when someone who joined earlier already has it.

### Offline Page
The page the service worker serves when a navigation fails: the Knot lockup, two short threads (one spun, one loose) above "Sin conexión", and a plain "Reintentar" link styled as the primary button. The worker keeps this page's CSS, fonts, logo and cloth tiles and serves them only when the network fails, so offline still looks like Knot.

### Link Preview
The 1200×630 image WhatsApp shows for an invite: the lockup on the woven grey ground, the group name and head count on a dark wool slab with a madder initial, four yarn threads weaving into a closed band, and "Unirme al grupo" in madder. Counts only, never member names.

## Do's and Don'ts

### Do:
- **Do** give every person exactly one thread colour per group: their pick when it is free, otherwise the next free colour by join order; switch second-cycle members to double-ply.
- **Do** draw threads and surfaces with the yarn and cloth textures; pass thread colours inline as `backgroundColor`.
- **Do** express hover, pressed and panel states as translucent ink washes over the weave.
- **Do** carry free, busy and unknown by shape: spun yarn on top, solid under-thread with dive ticks, loose dotted thread.
- **Do** use madder red (#b8322a) for the one primary action per screen, in the sticky footer on phones.
- **Do** use cloth corners (14px) for surfaces and controls and knot corners (6px) for chips, tags and woven bands.
- **Do** raise emphasis with ink border weight or the ink panel, never with shadow.
- **Do** keep every target at least 44px and reserve scroll padding under sticky footers.
- **Do** let big groups make the cloth denser, never collapse members into an aggregate.

### Don't:
- **Don't** give madder red to a person's thread, or use thread colours for text, buttons or panels.
- **Don't** draw unknown time as anything that could read as free; never solid, never coloured.
- **Don't** draw the busy under-thread dotted or dashed; at 2–3px it would read as the "no schedule" thread.
- **Don't** add box-shadows, elevation or a dark theme; the ground is daylight grey wool, and only threads cast a shadow.
- **Don't** put white text on plain yarn; use the labelled yarn wash.
- **Don't** let a newcomer's pick change the colour of someone already in the group.
- **Don't** build availability as a green heatmap grid or as transit-line signage.
- **Don't** cap a screen at phone width on desktop.
