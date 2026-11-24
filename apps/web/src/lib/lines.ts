/**
 * Dyed-wool thread colours, one per person in join order. Each holds at least
 * 3.9:1 against the grey-wool ground, so no thread needs an outline. Madder
 * red is kept for the primary action and never given to a person.
 */
export const THREAD_COLORS = [
  { name: "indigo", value: "var(--color-thread-indigo)" },
  { name: "ochre", value: "var(--color-thread-ochre)" },
  { name: "moss", value: "var(--color-thread-moss)" },
  { name: "plum", value: "var(--color-thread-plum)" },
  { name: "teal", value: "var(--color-thread-teal)" },
  { name: "rose", value: "var(--color-thread-rose)" },
  { name: "walnut", value: "var(--color-thread-walnut)" },
  { name: "ink", value: "var(--color-thread-ink)" },
] as const;

export function threadColor(index: number) {
  return THREAD_COLORS[index % THREAD_COLORS.length] ?? THREAD_COLORS[0];
}

/**
 * When a group outgrows the 8-colour wool palette, second-cycle threads carry
 * a double-ply mark so no member relies on colour alone.
 */
export function threadPly(index: number): 1 | 2 {
  return index >= THREAD_COLORS.length ? 2 : 1;
}

/**
 * The diagram shows the whole useful day, the same 08:00–24:00 track as the
 * busy editor, widened only if the slot falls outside it.
 */
export function diagramSpan(slot: { start: number; end: number }) {
  return {
    start: Math.min(8 * 60, Math.floor(slot.start / 60) * 60),
    end: Math.min(24 * 60, Math.max(24 * 60, Math.ceil(slot.end / 60) * 60)),
  };
}
