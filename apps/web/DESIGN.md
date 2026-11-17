---
name: AmigOrganizador
description: Línea de Metro. Each friend is a metro line across the day; where the free lines meet, a station marks the plan.
colors:
  ground: "#ffffff"
  ink: "#1d1d1b"
  mute: "#555552"
  rule: "#e4e4e1"
  rule-strong: "#bdbdb9"
  panel: "#f4f4f2"
  sign-sub: "#d6d6d3"
  line-red: "#e1251b"
  line-blue: "#0065bd"
  line-blue-pressed: "#00539c"
  line-yellow: "#ffc20e"
  line-green: "#00a651"
  line-purple: "#8b2f8f"
  danger: "#b3140c"
typography:
  display-hero:
    fontFamily: "Roboto Condensed, Arial Narrow, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 800
    lineHeight: 1.05
  title-page:
    fontFamily: "Roboto Condensed, Arial Narrow, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.25
  display:
    fontFamily: "Roboto Condensed, Arial Narrow, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "0.01em"
  headline:
    fontFamily: "Roboto Condensed, Arial Narrow, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 800
    lineHeight: 1.25
  numeral:
    fontFamily: "Roboto Condensed, Arial Narrow, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1
    fontFeature: "tnum"
  body:
    fontFamily: "Roboto Condensed, Arial Narrow, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.35
    fontFeature: "tnum"
  body-small:
    fontFamily: "Roboto Condensed, Arial Narrow, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.35
  label:
    fontFamily: "Roboto Condensed, Arial Narrow, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 800
    lineHeight: 1.35
    letterSpacing: "0.06em"
  caption:
    fontFamily: "Roboto Condensed, Arial Narrow, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.35
  button:
    fontFamily: "Roboto Condensed, Arial Narrow, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 800
    lineHeight: 1.35
  button-small:
    fontFamily: "Roboto Condensed, Arial Narrow, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 700
    lineHeight: 1.35
rounded:
  chip: "3px"
  sign: "6px"
  pill: "9999px"
spacing:
  hair: "3px"
  xs: "6px"
  sm: "8px"
  md: "10px"
  lg: "12px"
  gutter: "16px"
  section: "20px"
  target: "44px"
components:
  button-primary:
    backgroundColor: "{colors.line-blue}"
    textColor: "{colors.ground}"
    typography: "{typography.button}"
    rounded: "{rounded.sign}"
    padding: "0 16px"
    height: "50px"
    width: "100%"
  button-primary-active:
    backgroundColor: "{colors.line-blue-pressed}"
  button-primary-disabled:
    backgroundColor: "{colors.rule-strong}"
    textColor: "{colors.ink}"
  button-secondary:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sign}"
    typography: "{typography.button-small}"
    padding: "0 12px"
    height: "44px"
  button-secondary-active:
    backgroundColor: "{colors.panel}"
  chip:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    typography: "{typography.button-small}"
    rounded: "{rounded.sign}"
    padding: "0 12px"
    height: "44px"
  chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
  reason-chip:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.chip}"
    padding: "1px 6px"
  best-badge:
    backgroundColor: "{colors.line-red}"
    textColor: "{colors.ground}"
    typography: "{typography.caption}"
    rounded: "{rounded.chip}"
    padding: "2px 6px"
  plan-sign:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    typography: "{typography.display}"
    rounded: "{rounded.sign}"
    padding: "10px 12px"
  input-text:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sign}"
    padding: "0 12px"
    height: "48px"
  station-label:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "0 8px"
    height: "18px"
  station-platform:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "14px"
  option-row-selected:
    backgroundColor: "{colors.panel}"
  strip-station-all:
    backgroundColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    size: "20px"
  strip-station-some:
    backgroundColor: "{colors.ground}"
    rounded: "{rounded.pill}"
    size: "20px"
  strip-station-none:
    backgroundColor: "{colors.rule-strong}"
    rounded: "{rounded.pill}"
    size: "8px"
  strip-day-selected:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.sign}"
    width: "40px"
  plan-marker:
    backgroundColor: "{colors.ground}"
    rounded: "{rounded.pill}"
    width: "28px"
    height: "14px"
  action-panel:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sign}"
    padding: "12px"
---

# Design System: AmigOrganizador

## Overview

**Creative North Star: "Línea de Metro"**

Each friend is a metro line running across the day. Where every line runs free at once, a station appears, and that station is the day the group can meet. A group is persistent; each person keeps one saved availability profile shared by all their groups, and the group view compares every profile live, so a plan is an output proposed from a good day, never the entry point. The system refuses the category default of a days-by-people check table: availability is read as a transit diagram, not as a grid of ticks.

The material is enamel transit signage: a white ground, ink signs, Santiago Metro line colours, bold condensed type for every label and time. Everything is flat. Depth comes from ink panels and hairline rules, never from shadows or gradients. The density is phone-first and compact, because people check their groups and touch up their profile in short bursts between classes or in transit; every screen is responsive and uses the room a tablet or desktop gives it. Light only, by design: signage is white enamel, and there is no dark theme.

State is carried by shape before colour. A free stretch is a solid coloured line, busy time is an ink hatched "out of service" segment, and a friend who hasn't answered is a grey dashed track that is never drawn as free. The same three shapes appear wherever availability appears: the group diagram, the profile editor and the class routine alike. A member who has not set up a profile is unknown, never free.

**Key Characteristics:**
- White enamel ground, ink signage, one Santiago Metro line colour per person.
- Free = solid line, busy = ink hatch, unknown = grey dashes; colour never carries state alone.
- The station (the confirmable slot) is marked with dashed guides, an ink time pill and white platforms.
- Roboto Condensed at heavy weights with tabular numerals for every time and count.
- Flat: no shadows, no gradients; ink fills and hairline rules give structure.
- On a phone, one column: sign, then availability (strip, diagram, ranked days), then plans and links, closed by a sticky action footer. On desktop, availability on the left and plans with the actions in a sticky aside on the right.

## Colors

A white enamel ground with ink signage, punctuated by the Santiago Metro line colours, which belong to people, not to decoration.

### Primary
- **Línea 2 Blue** (line-blue): the one action colour. Primary buttons, links and the back link, the "Ver a todos" toggle, and the focus ring. Also the second person's line. Pressed buttons darken to **Pressed Blue** (line-blue-pressed).

### Secondary
- **Línea 1 Red** (line-red): the first person's line, the default plan badge on the sign, the rank-one option ring and the "Mejor" badge.
- **Línea 4 Yellow** (line-yellow): the third person's line and the text selection colour. It fails 3:1 on white, so wherever it is drawn as a line it carries a 1px ink inset outline.
- **Línea 5 Green** (line-green): the fourth person's line.
- **Línea 6 Purple** (line-purple): the fifth person's line. Santiago Metro Line 6 is purple; it was added because groups of six need a fifth colour (owner-approved).

### Neutral
- **Signage Ink** (ink): body text, the plan sign panel, selected chips, the busy hatch, the trunk line, station labels and platform outlines. Also the sixth person's line.
- **Enamel White** (ground): page background, button text on blue, platform fill, secondary buttons.
- **Platform Grey** (mute): secondary text, axis ticks, placeholders, the dashed unknown track and the dashed border of a proposed plan marker.
- **Hairline** (rule): row dividers, diagram frame, the faint baseline under every lane.
- **Strong Hairline** (rule-strong): unselected chip and input borders, reason-chip borders, disabled primary buttons, the small dot of a strip day where no slot works, and the baseline of a class routine track.
- **Panel Grey** (panel): the selected option row, the selected strip day, pressed secondary buttons and loading skeletons.
- **Sign Subtext** (sign-sub): the meta line inside the ink plan sign.
- **Alarm Red** (danger): form error text only. Destructive actions (cancel a plan, leave a group) are never painted in it.

### Named Rules
**The Line Belongs to a Person Rule.** Line colours are assigned one per person in join order: red, blue, yellow, green, purple, ink, then the cycle repeats. A line colour is never used as decoration or as a state signal; blue doubles as the action colour and red as the rank-one marker, both always paired with a shape or a word.

**The Yellow Outline Rule.** Yellow is always drawn with a 1px ink inset outline, because it fails 3:1 against white.

**The Shape Before Colour Rule.** Free, busy and unknown must stay distinguishable in greyscale: solid line, ink hatch, grey dashes. Unknown is never drawn as free.

## Typography

**Display Font:** Roboto Condensed (with Arial Narrow, sans-serif)
**Body Font:** Roboto Condensed (same family; loaded at 400, 500, 700, 800)

**Character:** A single condensed signage sans used at heavy weights, like the lettering on a station sign. Tabular numerals are on globally, so times and counts line up and do not jitter when the station moves.

### Hierarchy
- **Display hero** (800, 2.5rem, 1.05, balanced): the signed-out home headline only.
- **Title page** (800, 1.75rem, tight): the page title on screens without a sign ("Tus grupos", "Tu perfil").
- **Display** (800, 1.25rem, tight): the group or plan name inside the ink sign.
- **Headline** (800, 1.0625rem, tight): the option day ("Sáb 21 nov"), followed by its time span in 500 weight, 0.9375rem, Platform Grey.
- **Numeral** (800, 1.25rem, line-height 1): the "8/10" count on each option row.
- **Body** (400, 1rem, 1.35): running text and inputs; text inputs step up to 1.125rem.
- **Body small** (400, 0.8125–0.875rem): window notes, hints, empty-state bodies, in Platform Grey.
- **Label** (800, 0.75rem, 0.06em tracking, uppercase): section headings and the diagram caption ("MEJORES OPCIONES", "SÁB 21 NOV · QUIÉN ESTÁ LIBRE"). These are the headings themselves, set like platform signage, not eyebrows above another heading.
- **Caption** (400–800, 0.6875rem): axis ticks, legend text, reason chips, the "Mejor" badge, station time pills, avatar initials.
- **Button** (800, 1.0625rem): primary button text.
- **Button small** (700, 0.9375rem): secondary buttons, chips and the day labels of the profile editor.

### Named Rules
**The Signage Weight Rule.** Labels, times and counts are set at 700–800; 400 is reserved for running text and captions that explain.

**The Tabular Time Rule.** Every time and count uses tabular numerals.

## Layout

Every screen is responsive; never cap a screen at phone width on a large display. The shells live in `shellClasses` (`src/lib/ui.ts`): full width with a 16px gutter on a phone, a 24px gutter from `sm`, 32px from `lg`. Single-task screens (sign in, create a group) use the narrow shell, a readable measure up to 36rem. Screens with a layout of their own use the wide shell (up to 42rem at `sm`, 48rem at `md`, 72rem at `lg`) and become two columns at `lg`: the group view puts availability left and plans and actions in a sticky 22rem aside; the profile puts routines and calendar import left and the 14 days right; the groups list puts you and your profile left and your groups right, two per row from `sm`. Below `lg` everything stacks in DOM order, and column wrappers use `display: contents` so the sticky footer still sticks to the viewport. On desktop the group footer becomes the top of the aside, and the profile save button keeps its sticky footer, right-aligned and 20rem wide.

Each screen stacks: a top bar (back link left, an optional short context line right), the ink sign (or a Title page heading on screens without one, such as the profile and the groups list), the content, and a sticky footer that bleeds to the column edges, separated by a hairline, holding one full-width primary action and an optional row of secondary buttons that share the width. The footer respects the safe-area inset (at least 18px bottom padding).

On the group screen the order is fixed. Availability always comes right under the sign: the 4-week day strip, then the line diagram for the selected day, then the ranked days. Plans and trailing links (the calendar feed, "Más opciones del grupo") come after the ranked days and before the sticky footer, so the footer closes the document. The profile screen follows the same shape: routines, the days, the calendar import, then the sticky save.

**The Availability First Rule.** Nothing is inserted between the sign and the strip except a one-line status ("Falta el perfil de Caro") or the action panel asking the viewer to set up their own profile.

Spacing runs on a tight 4px-based rhythm: 3px between avatars, 6px between chips, 8–12px inside components, 16px between sections, 20px before major blocks. Every tap target is at least 44px tall; text inputs are 48px and the primary button 50px.

The diagram and the busy editor share one time track: the useful day 08:00–24:00, widened only when the slot falls outside it. Lanes reserve a 1.5rem initial column on the left; the busy editor, the profile editor and the class routine reserve 4.25rem for day labels. The day strip scrolls horizontally inside the column, bleeding to the column edges, with 40px day cells. Axis ticks step every hour for spans of 8 hours or less, every two hours otherwise, and ticks within 7% of either edge are dropped.

## Elevation & Depth

Flat by design. There are no box shadows and no gradients anywhere. Structure comes from three devices: ink-filled panels (the plan sign, selected chips, station pills), hairline rules (row dividers, the diagram frame, the sticky footer edge) and the Panel Grey fill for the selected option row. The only inset "shadow" in the code is the 1px ink outline on yellow lines, which is an outline, not depth; the hatch and dashed tracks are drawn with repeating linear gradients as patterns, not as shading.

### Named Rules
**The Enamel Rule.** Nothing floats. If an element needs separation, give it an ink fill or a hairline, never a shadow.

## Shapes

Two corner radii and the full capsule. Signs, buttons, chips, inputs and the diagram frame use a slight enamel-sign corner (rounded.sign). Small inline tags, the reason chips and the "Mejor" badge, use a tighter corner (rounded.chip). Everything that belongs to the line world is a capsule: free line segments, station time pills, platforms, the trunk, avatars and the plan badge. Busy hatch segments keep a barely softened 2–3px corner so they read as blocks laid over the line.

Borders are 1.5px for interactive controls (chips, secondary buttons, inputs, avatars), 2px for platforms, plan markers and action panels, 1px for hairlines and reason chips. The option marker is a 22px ring with a 5px border in its rank colour; the plan marker is a 28×14px capsule with a 2px border, the same platform shape the diagram draws at the station. Strip stations are 20px capsules with a 3px ink border, or an 8px dot. Empty states sit in a sign-radius box with a 1px dashed Hairline border.

## Components

### Buttons
Confident and singular: one primary per screen, full width at the bottom on a phone; on desktop it leads the aside or sits right-aligned in the footer.
- **Shape:** enamel corner (rounded.sign).
- **Primary:** Línea 2 Blue fill, white 800-weight text, 50px tall, full width. The label names what happens ("Proponer Sáb 12 dic", "Guardar perfil", "Unirme al grupo").
- **Pressed / Disabled:** pressed darkens to Pressed Blue; disabled turns Strong Hairline with ink text.
- **Secondary:** white with a 1.5px ink border, 700-weight ink text, at least 44px, sharing the row equally ("Invitar al grupo", "Compartir link"; "Google Calendar", "Archivo .ics"); pressed fills Panel Grey.
- **Destructive:** cancelling a plan or leaving a group is a plain secondary button behind a "Más opciones" disclosure, never a red button.
- **Focus:** a 3px Línea 2 Blue outline offset 2px, on every focusable element.

### Chips
- **Style:** white, 1.5px Strong Hairline border, 700 weight at 0.9375rem, at least 44px tall.
- **State:** selected chips invert to an ink fill with white text and an ink border. Used for routines, shift day, plan range and duration. Routine chips are combinable (Trabajo L-V, Turnos and Clases can be on together); "Nada fijo" is selected exactly when none is, and tapping it clears the rest.
- **Reason chips:** small non-interactive tags on option rows, 1px Strong Hairline border, tight corner, caption type ("Buen día", "Más pronto").

### Inputs / Fields
- **Style:** white, 1.5px border (ink for the primary fields, Strong Hairline for selects), enamel corner, 48px tall, 1.125rem text.
- **Choice cards:** radio options render as bordered rows that switch to an ink border when checked.
- **Error:** a single Alarm Red line above the sticky action, announced as an alert.

### Navigation
- **Top bar:** a blue back link with a drawn chevron on the left (44px tap area), a short ink context line on the right ("Organiza Ana"), 700 weight at 0.875rem.
- **Disclosure:** a native details row, at least 44px, ink 700 text with a drawn 16px chevron (2.2 stroke, round caps) that rotates 90° when open ("Más opciones", "Más opciones del grupo"). Its content is secondary buttons.
- **Links in running text:** Línea 2 Blue, 700, underlined, 44px tall ("Suscribirme al calendario del grupo").

### Plan Sign (signature)
The enamel line sign at the top of every group and plan screen: an ink panel with a 32px capsule badge in a line colour carrying the name's initial, the group name in Display, and the meta line in Sign Subtext ("6 personas · 5 con perfil" for a group, "15 nov al 28 nov · 3 h · 10 personas" for a one-off plan).

### Day Strip (signature)
The next four weeks as one metro line, under an uppercase Label heading ("PRÓXIMAS 4 SEMANAS"). A 4px ink capsule line runs behind one station per day; under each station sit the two-letter weekday (caption, Platform Grey), the day number (800, 0.75rem) and the n/total count (caption, Platform Grey, "–" when no slot works).
- **All can come:** a filled ink 20px station (3px ink border, ink fill) when everyone who has a profile is free for the day's best slot.
- **Some can come:** a hollow 20px ring (3px ink border, white fill).
- **None:** a small 8px Strong Hairline dot, not tappable.
- **Selected:** the day cell (40px wide, at least 44px tall, enamel corner) takes a Panel Grey fill and a 2px ink outline; selecting a day selects its option in the diagram and the ranked list. The strip scrolls sideways at phone width.

### Plan Rows
The group's proposed and confirmed plans, under "PLANES", as hairline-divided rows.
- **Marker:** a station platform capsule (28×14px, white, 2px ink border); a proposed plan draws it with a dashed Platform Grey border. It is deliberately not the red rank ring: a plan is a station on the line, not a ranking.
- **Text:** the title in 800 at 1.0625rem followed by the day and time in 500 Platform Grey, then a Platform Grey status line ("Confirmado", "Propuesto por Ana").
- **Actions:** indented under the text, one row of equal secondary buttons: "Confirmar" (proposed, for whoever can decide), "Google Calendar" and "Archivo .ics". Cancelling sits behind the "Más opciones" disclosure.

### Action Panel
A white panel with a 2px ink border and the enamel corner, used when the screen needs one thing from the viewer before anything else: the one-person group's invite panel (title, Platform Grey body, WhatsApp and share buttons) shown instead of the strip and options, the "set up your profile" prompt on a group, the propose form, and the profile prompt on the groups list until a profile exists (then it drops to a 1px Hairline border). One per screen at most.

### Line Diagram (signature)
- **Lanes:** each person is one lane with their initial on the left and a hairline baseline. Free segments are 6px solid capsules in the person's line colour; busy segments are 8px ink hatch blocks; unknown is a 2px grey dashed track.
- **Station:** the confirmable slot, not the whole free window. Dashed vertical guides in ink at 40%, an ink time pill above, and a white ink-outlined capsule platform (14px, 2px border) on every line that is free through the whole slot.
- **Trunk (beyond 6 people):** free people collapse into one ink line whose thickness follows the free count (3px to 10px), with a white 20px capsule on the trunk at the station reading "8/10". Only blockers (busy or unknown in the slot) keep their own lines, at most 3, then "+N más"; "Ver a todos" expands to every lane (owner decision 2026-11-13).
- **Caption and legend:** an uppercase Label caption, then "Estación común · 19:00–22:00" in 800 weight and a one-line legend in caption Platform Grey.
- **Motion:** selecting another option slides the station and lines to their new positions (220ms, ease-out-expo curve), only when reduced motion is not requested.

### Option Row
A ranked list row: a 22px rank ring (red, blue, then ink), the day and span, an optional window note ("Libres de 08:00 a 22:00 · elegimos la tarde-noche"), reason chips, up to 8 avatars then "+N" with an optional Platform Grey note beside them ("Caro sin responder"), the count numeral with "pueden" below, and the red "Mejor" badge on rank one. The selected row takes the Panel Grey fill.

### Avatars
24px capsules with 1.5px borders and the person's initial, one shape per state: free is an ink fill with white initial; unknown is a dashed grey border with a grey initial; busy is an ink outline struck through diagonally.

### Profile Editor
The person's profile: their name and one or more named schedules (ADR 0004 amendment); each group reads one. On desktop the top band is two equal-height hairline cards, "Tu nombre" (field + "Guardar nombre") and "Tus horarios" (schedule rows with a small uppercase PRINCIPAL tag and "Lo usan: …" groups, then rename, duplicate, delete, and a "Nuevo horario" field); below `lg` they stack. Under it, the editor of the selected schedule: routine cards in the left column, the next two weeks in the right column, a sticky footer with a polite status line and "Guardar perfil". The timezone select and the ICS import (hairline rows with a small secondary "Actualizar", then the form) sit under the routines.

### Routine Card
One hairline-bordered card per routine, so work, classes and shifts never blur together. Top: the routine's name field (the person's label, "Trabajo") and a secondary "Quitar rutina". Under the name, one plain sentence states the type: "Semanal: se repite los mismos días de la semana" or "Ciclo: se repite cada N días, sin importar el día".
- Weekly: weekday chips (selected = ink fill), real time inputs in 15-minute steps, and a "Distinto horario por día" link for per-weekday hours. An end before the start means the next day.
- Cycle: pattern presets as small chips (they only pre-fill), the cycle's start date, then one hairline row per step ("Día N", an Ocupado/Libre toggle, start and end times, "(+1 día)" when it passes midnight, "Quitar día"), and a full-width "Agregar día al ciclo".
- Every card ends with the sentence panel: a `panel` box saying exactly what will be marked ("Vas a marcar ocupado: lunes a viernes, de 09:00 a 18:00"), updated live, before anything is saved.
Two secondary buttons under the cards add a weekly routine or a shift cycle.

### Class Routine
Legacy grammar from the first editor (three tap segments over a week of hairline tracks). Old class templates now open as a weekly Routine Card labelled "Clases".

### Busy Editor
Used by the one-off plan answer flow. Each day is the person's own line in their colour across the same 08:00–24:00 track. A "Por bloques / Por hora" toggle (remembered per browser) switches between the three tap segments and exact start–end ranges in 15-minute steps; both store the same intervals. Routine chips (Nada fijo, Trabajo L-V, Turnos, Clases) prefill busy time from templates. The track is split into three tap segments, mañana 8–13, tarde 13–19, noche 19–24, each at least 44px tall and separated by dashed hairlines (owner decision). Busy time lays the same ink hatch over the line as the diagram; in free-time mode the track starts as the grey dashed unknown and taps lay solid line segments. The sticky footer states how many free segments remain before saving.

## Do's and Don'ts

### Do:
- **Do** assign line colours by join order (red, blue, yellow, green, purple, ink) and keep a person's colour stable across screens.
- **Do** outline yellow with a 1px ink inset wherever it is drawn as a line.
- **Do** draw free as a solid line, busy as the ink hatch and unknown as the grey dashed track, in every view that shows availability.
- **Do** mark the station as the confirmable slot with dashed guides, the ink time pill and a platform on every line free through it.
- **Do** span the diagram over the useful day 08:00–24:00, the same track as the busy editor.
- **Do** collapse beyond 6 people into the ink trunk with the "8/10" capsule, keeping at most 3 blocker lanes and a "Ver a todos" toggle.
- **Do** keep every tap target at least 44px tall and one primary action: full width in a sticky footer on a phone.
- **Do** put availability (strip, diagram, ranked days) right under the sign, and plans and links after it, before the footer.
- **Do** draw a plan as a platform capsule (solid ink border confirmed, dashed grey proposed).
- **Do** put destructive actions behind a "Más opciones" disclosure as secondary buttons.
- **Do** write copy in Spanish (Chile), informal tú, through i18n keys.

### Don't:
- **Don't** use shadows or gradients for depth; the world is flat enamel.
- **Don't** let colour carry state alone, and never draw an unanswered person as free.
- **Don't** use line colours as decoration or behind body text where contrast fails.
- **Don't** fall back to a days-by-people check table for availability.
- **Don't** add a dark theme; light only is a decision, not a gap.
- **Don't** paint destructive actions in Alarm Red or reuse the red rank ring as a plan marker.
- **Don't** put plans or links between the sign and the availability.

## Known Gaps

Not built yet, so not part of the system: the 30-minute "Ajustar" sheet for fine-tuning a segment; real authentication (the app runs in a local mode); each person's own timezone (Chile is assumed for profiles). No dark theme, by decision.
