/**
 * Santiago Metro line colours, one per person in join order. Yellow gets an
 * ink outline wherever it is drawn, because it fails 3:1 on white.
 */
export const LINE_COLORS = [
  { name: "red", value: "var(--line-red)", outlined: false },
  { name: "blue", value: "var(--line-blue)", outlined: false },
  { name: "yellow", value: "var(--line-yellow)", outlined: true },
  { name: "green", value: "var(--line-green)", outlined: false },
  { name: "purple", value: "var(--line-purple)", outlined: false },
  { name: "ink", value: "var(--ink)", outlined: false },
] as const;

/** Above this many people the diagram collapses free lines into a trunk. */
export const MAX_SEPARATE_LINES = 6;

export function lineColor(index: number) {
  return LINE_COLORS[index % LINE_COLORS.length] ?? LINE_COLORS[0];
}
