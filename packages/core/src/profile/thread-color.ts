import type { Group } from "../group/group";
import { type Person, PersonError } from "./person";

/**
 * The dyed-wool palette, in the order threads are handed out. Madder red is
 * kept for the primary action and is never a person's colour.
 */
export const THREAD_COLORS = [
  "indigo",
  "ochre",
  "moss",
  "plum",
  "teal",
  "rose",
  "walnut",
  "ink",
] as const;

export type ThreadColor = (typeof THREAD_COLORS)[number];

export function isThreadColor(value: unknown): value is ThreadColor {
  return (
    typeof value === "string" &&
    (THREAD_COLORS as readonly string[]).includes(value)
  );
}

/** Saves the colour the person picked for their thread; `null` clears it. */
export function setThreadColor(
  person: Person,
  input: { color: ThreadColor | null; now: number },
): Person {
  if (input.color !== null && !isThreadColor(input.color)) {
    throw new PersonError("INVALID_COLOR", "not a thread colour");
  }
  const { threadColor: _previous, ...rest } = person;
  return input.color === null
    ? { ...rest, updatedAt: input.now }
    : { ...rest, threadColor: input.color, updatedAt: input.now };
}

/** A member's thread inside one group. */
export interface GroupThread {
  readonly accountId: string;
  /** Palette slot: `index % 8` is the colour, 8 and up add a second ply. */
  readonly index: number;
  readonly color: ThreadColor;
  /** What the person picked in their profile, or `null` with no choice. */
  readonly chosen: ThreadColor | null;
  /** They picked a colour, and in this group their thread shows another. */
  readonly changed: boolean;
  /** Who holds the picked colour when it changed: they joined earlier. */
  readonly takenBy: string | null;
}

/**
 * Threads for every member, in join order (S9). Members claim a colour in
 * the order they joined: the one they picked, or with no choice the slot of
 * their join position. When it is taken, whoever joined first keeps it and
 * the newcomer takes the next free colour after it. So a member who joins
 * later never changes anyone else's thread. Past eight members a second ply
 * starts, and no two members ever share a colour and ply.
 */
export function groupThreads(
  group: Group,
  people: readonly Person[],
): GroupThread[] {
  const size = THREAD_COLORS.length;
  const holder = new Map<number, string>();
  return group.members.map((member, position) => {
    const chosen =
      people.find((p) => p.accountId === member.accountId)?.threadColor ?? null;
    const wanted = chosen ? THREAD_COLORS.indexOf(chosen) : position % size;
    // Step through the other colours of this ply, then the next ply.
    let index = wanted;
    for (let step = 1; holder.has(index); step++) {
      index = Math.floor(step / size) * size + ((wanted + step) % size);
    }
    holder.set(index, member.accountId);
    const color = THREAD_COLORS[index % size] ?? THREAD_COLORS[0];
    const changed = chosen !== null && color !== chosen;
    return {
      accountId: member.accountId,
      index,
      color,
      chosen,
      changed,
      takenBy: changed ? (holder.get(wanted) ?? null) : null,
    };
  });
}
