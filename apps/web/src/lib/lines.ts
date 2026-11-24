import {
  THREAD_COLORS as CORE_THREAD_COLORS,
  type ThreadColor,
} from "@amigo/core";

/**
 * Dyed-wool thread colours, the palette of `@amigo/core` in hand-out order.
 * Each holds at least 3.9:1 against the grey-wool ground, so no thread needs
 * an outline. Madder red is kept for the primary action and never given to a
 * person.
 */
export const THREAD_COLORS = CORE_THREAD_COLORS.map((name) => ({
  name,
  value: `var(--color-thread-${name})`,
}));

/** The palette slot of a colour a person picked. */
export function threadSlot(name: ThreadColor): number {
  return CORE_THREAD_COLORS.indexOf(name);
}

export function threadColor(index: number) {
  const name =
    CORE_THREAD_COLORS[index % CORE_THREAD_COLORS.length] ?? "indigo";
  return { name, value: `var(--color-thread-${name})` };
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
