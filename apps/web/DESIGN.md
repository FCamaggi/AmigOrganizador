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
    padding: "0 12px"
    height: "44px"
  button-secondary-active:
    backgroundColor: "{colors.panel}"
  chip:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
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
---

# Design System: AmigOrganizador

## Overview

**Creative North Star: "Línea de Metro"**

Each friend is a metro line running across the day. Where every line runs free at once, a station appears, and that station is the option you confirm. The system refuses the category default of a days-by-people check table: availability is read as a transit diagram, not as a grid of ticks.

The material is enamel transit signage: a white ground, ink signs, Santiago Metro line colours, bold condensed type for every label and time. Everything is flat. Depth comes from ink panels and hairline rules, never from shadows or gradients. The density is phone-first and compact, one narrow column, because people answer in short bursts between classes or in transit. Light only, by design: signage is white enamel, and there is no dark theme.

State is carried by shape before colour. A free stretch is a solid coloured line, busy time is an ink hatched "out of service" segment, and a friend who hasn't answered is a grey dashed track that is never drawn as free. The same three shapes appear wherever availability appears, in the plan diagram and in the busy editor alike.

**Key Characteristics:**
- White enamel ground, ink signage, one Santiago Metro line colour per person.
- Free = solid line, busy = ink hatch, unknown = grey dashes; colour never carries state alone.
- The station (the confirmable slot) is marked with dashed guides, an ink time pill and white platforms.
- Roboto Condensed at heavy weights with tabular numerals for every time and count.
- Flat: no shadows, no gradients; ink fills and hairline rules give structure.
- One narrow phone column with a sticky action footer.

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
- **Platform Grey** (mute): secondary text, axis ticks, placeholders and the dashed unknown track.
- **Hairline** (rule): row dividers, diagram frame, the faint baseline under every lane.
- **Strong Hairline** (rule-strong): unselected chip and input borders, reason-chip borders, disabled primary buttons.
- **Panel Grey** (panel): the selected option row and pressed secondary buttons.
- **Sign Subtext** (sign-sub): the meta line inside the ink plan sign.
- **Alarm Red** (danger): form error text only.

### Named Rules
**The Line Belongs to a Person Rule.** Line colours are assigned one per person in join order: red, blue, yellow, green, purple, ink, then the cycle repeats. A line colour is never used as decoration or as a state signal; blue doubles as the action colour and red as the rank-one marker, both always paired with a shape or a word.

**The Yellow Outline Rule.** Yellow is always drawn with a 1px ink inset outline, because it fails 3:1 against white.

**The Shape Before Colour Rule.** Free, busy and unknown must stay distinguishable in greyscale: solid line, ink hatch, grey dashes. Unknown is never drawn as free.

## Typography

**Display Font:** Roboto Condensed (with Arial Narrow, sans-serif)
**Body Font:** Roboto Condensed (same family; loaded at 400, 500, 700, 800)

**Character:** A single condensed signage sans used at heavy weights, like the lettering on a station sign. Tabular numerals are on globally, so times and counts line up and do not jitter when the station moves.

### Hierarchy
- **Display** (800, 1.25rem, tight): the plan title inside the ink sign.
- **Headline** (800, 1.0625rem, tight): the option day ("Sáb 21 nov"), followed by its time span in 500 weight, 0.9375rem, Platform Grey.
- **Numeral** (800, 1.25rem, line-height 1): the "8/10" count on each option row.
- **Body** (400, 1rem, 1.35): running text and inputs; text inputs step up to 1.125rem.
- **Body small** (400, 0.8125–0.875rem): window notes, hints, empty-state bodies, in Platform Grey.
- **Label** (800, 0.75rem, 0.06em tracking, uppercase): section headings and the diagram caption ("MEJORES OPCIONES", "SÁB 21 NOV · QUIÉN ESTÁ LIBRE"). These are the headings themselves, set like platform signage, not eyebrows above another heading.
- **Caption** (400–800, 0.6875rem): axis ticks, legend text, reason chips, the "Mejor" badge, station time pills, avatar initials.
- **Button** (800, 1.0625rem): primary button text; secondary buttons and chips use 700 at 0.9375rem.

### Named Rules
**The Signage Weight Rule.** Labels, times and counts are set at 700–800; 400 is reserved for running text and captions that explain.

**The Tabular Time Rule.** Every time and count uses tabular numerals.

## Layout

One centred column, at most 28rem (448px) wide, with a 16px side gutter on every screen. Desktop shows the same phone column centred on white; there are no breakpoints that change the layout.

Each screen stacks: a top bar (back link left, a short context line right), the ink plan sign, the content, and a sticky footer that bleeds to the column edges, separated by a hairline, holding one full-width primary action and an optional row of secondary buttons that share the width. The footer respects the safe-area inset (at least 18px bottom padding).

Spacing runs on a tight 4px-based rhythm: 3px between avatars, 6px between chips, 8–12px inside components, 16px between sections, 20px before major blocks. Every tap target is at least 44px tall; text inputs are 48px and the primary button 50px.

The diagram and the busy editor share one time track: the useful day 08:00–24:00, widened only when the slot falls outside it. Lanes reserve a 1.5rem initial column on the left; the busy editor reserves 4.25rem for day labels. Axis ticks step every hour for spans of 8 hours or less, every two hours otherwise, and ticks within 7% of either edge are dropped.

## Elevation & Depth

Flat by design. There are no box shadows and no gradients anywhere. Structure comes from three devices: ink-filled panels (the plan sign, selected chips, station pills), hairline rules (row dividers, the diagram frame, the sticky footer edge) and the Panel Grey fill for the selected option row. The only inset "shadow" in the code is the 1px ink outline on yellow lines, which is an outline, not depth; the hatch and dashed tracks are drawn with repeating linear gradients as patterns, not as shading.

### Named Rules
**The Enamel Rule.** Nothing floats. If an element needs separation, give it an ink fill or a hairline, never a shadow.

## Shapes

Two corner radii and the full capsule. Signs, buttons, chips, inputs and the diagram frame use a slight enamel-sign corner (rounded.sign). Small inline tags, the reason chips and the "Mejor" badge, use a tighter corner (rounded.chip). Everything that belongs to the line world is a capsule: free line segments, station time pills, platforms, the trunk, avatars and the plan badge. Busy hatch segments keep a barely softened 2–3px corner so they read as blocks laid over the line.

Borders are 1.5px for interactive controls (chips, secondary buttons, inputs, avatars), 2px for platforms, 1px for hairlines and reason chips. The option marker is a 22px ring with a 5px border in its rank colour.

## Components

### Buttons
Confident and singular: one primary per screen, always full width at the bottom.
- **Shape:** enamel corner (rounded.sign).
- **Primary:** Línea 2 Blue fill, white 800-weight text, 50px tall, full width. The label names what happens ("Confirmar Sáb 21 nov, 19:00").
- **Pressed / Disabled:** pressed darkens to Pressed Blue; disabled turns Strong Hairline with ink text.
- **Secondary:** white with a 1.5px ink border, 700-weight ink text, at least 44px, sharing the row equally ("Avisar a los que faltan", "Compartir link"); pressed fills Panel Grey.
- **Focus:** a 3px Línea 2 Blue outline offset 2px, on every focusable element.

### Chips
- **Style:** white, 1.5px Strong Hairline border, 700 weight at 0.9375rem, at least 44px tall.
- **State:** selected chips invert to an ink fill with white text and an ink border. Used for routine profiles, shift day, class segments, plan range and duration.
- **Reason chips:** small non-interactive tags on option rows, 1px Strong Hairline border, tight corner, caption type ("Buen día", "Más pronto").

### Inputs / Fields
- **Style:** white, 1.5px border (ink for the primary fields, Strong Hairline for selects), enamel corner, 48px tall, 1.125rem text.
- **Choice cards:** radio options render as bordered rows that switch to an ink border when checked.
- **Error:** a single Alarm Red line above the sticky action, announced as an alert.

### Navigation
- **Top bar:** a blue back link with a drawn chevron on the left (44px tap area), a short ink context line on the right ("Organiza Ana"), 700 weight at 0.875rem.

### Plan Sign (signature)
The enamel line sign at the top of every plan screen: an ink panel with a 32px capsule badge in a line colour carrying the plan's initial, the title in Display, and the meta line ("15 nov al 28 nov · 3 h · 10 personas") in Sign Subtext.

### Line Diagram (signature)
- **Lanes:** each person is one lane with their initial on the left and a hairline baseline. Free segments are 6px solid capsules in the person's line colour; busy segments are 8px ink hatch blocks; unknown is a 2px grey dashed track.
- **Station:** the confirmable slot, not the whole free window. Dashed vertical guides in ink at 40%, an ink time pill above, and a white ink-outlined capsule platform (14px, 2px border) on every line that is free through the whole slot.
- **Trunk (beyond 6 people):** free people collapse into one ink line whose thickness follows the free count (3px to 10px), with a white 20px capsule on the trunk at the station reading "8/10". Only blockers (busy or unknown in the slot) keep their own lines, at most 3, then "+N más"; "Ver a todos" expands to every lane (owner decision 2026-11-13).
- **Caption and legend:** an uppercase Label caption, then "Estación común · 19:00–22:00" in 800 weight and a one-line legend in caption Platform Grey.
- **Motion:** selecting another option slides the station and lines to their new positions (220ms, ease-out-expo curve), only when reduced motion is not requested.

### Option Row
A ranked list row: a 22px rank ring (red, blue, then ink), the day and span, an optional window note ("Libres de 08:00 a 22:00 · elegimos la tarde-noche"), reason chips, up to 8 avatars then "+N", the count numeral with "pueden" below, and the red "Mejor" badge on rank one. The selected row takes the Panel Grey fill.

### Avatars
24px capsules with 1.5px borders and the person's initial, one shape per state: free is an ink fill with white initial; unknown is a dashed grey border with a grey initial; busy is an ink outline struck through diagonally.

### Busy Editor
Each day is the person's own line in their colour across the same 08:00–24:00 track. Routine chips (Nada fijo, Trabajo L-V, Turnos, Clases) prefill busy time from templates. The track is split into three tap segments, mañana 8–13, tarde 13–19, noche 19–24, each at least 44px tall and separated by dashed hairlines (owner decision). Busy time lays the same ink hatch over the line as the diagram; in free-time mode the track starts as the grey dashed unknown and taps lay solid line segments. The sticky footer states how many free segments remain before saving.

## Do's and Don'ts

### Do:
- **Do** assign line colours by join order (red, blue, yellow, green, purple, ink) and keep a person's colour stable across screens.
- **Do** outline yellow with a 1px ink inset wherever it is drawn as a line.
- **Do** draw free as a solid line, busy as the ink hatch and unknown as the grey dashed track, in every view that shows availability.
- **Do** mark the station as the confirmable slot with dashed guides, the ink time pill and a platform on every line free through it.
- **Do** span the diagram over the useful day 08:00–24:00, the same track as the busy editor.
- **Do** collapse beyond 6 people into the ink trunk with the "8/10" capsule, keeping at most 3 blocker lanes and a "Ver a todos" toggle.
- **Do** keep every tap target at least 44px tall and one full-width primary action in a sticky footer.
- **Do** write copy in Spanish (Chile), informal tú, through i18n keys.

### Don't:
- **Don't** use shadows or gradients for depth; the world is flat enamel.
- **Don't** let colour carry state alone, and never draw an unanswered person as free.
- **Don't** use line colours as decoration or behind body text where contrast fails.
- **Don't** fall back to a days-by-people check table for availability.
- **Don't** add a dark theme; light only is a decision, not a gap.
