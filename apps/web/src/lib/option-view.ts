import type { ClothThread } from "@/components/day-cloth";

export type PersonState = "free" | "busy" | "unknown";

export interface OptionPerson {
  readonly accountId: string;
  readonly name: string;
  readonly state: PersonState;
  readonly colorIndex: number;
}

export interface OptionView {
  readonly key: string;
  readonly date: string;
  readonly dayLabel: string;
  /** The slot that gets confirmed: the closed band. */
  readonly start: number;
  readonly end: number;
  /** The whole shared free window around the slot, shown as context. */
  readonly windowStart: number;
  readonly windowEnd: number;
  readonly freeCount: number;
  readonly memberCount: number;
  readonly reasons: readonly string[];
  readonly people: readonly OptionPerson[];
  readonly note: string | null;
  readonly span: { start: number; end: number };
  readonly lines: readonly ClothThread[];
}
