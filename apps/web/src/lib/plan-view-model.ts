import {
  dayLines,
  type Plan,
  slotFromOption,
  suggestOptions,
  type WindowReason,
} from "@amigo/core";
import { type MessageKey, t } from "@/i18n/t";
import { formatDay } from "./format";
import { diagramSpan } from "./lines";

export type { OptionView, PersonState } from "./option-view";

import type { OptionView, PersonState } from "./option-view";

const MAX_OPTIONS = 4;
/** Window-level reasons (block length) say nothing about a fixed-length slot. */
const SHOWN_REASONS: readonly WindowReason["code"][] = [
  "ALL_AVAILABLE",
  "EVENING",
  "LATE",
  "GOOD_WEEKDAY",
];

export function optionViews(plan: Plan): OptionView[] {
  const names = new Map(
    plan.participants.map((p) => [p.accountId, p.displayName]),
  );
  const colorIndex = new Map(plan.participants.map((p, i) => [p.accountId, i]));
  const windows = suggestOptions(plan).slice(0, MAX_OPTIONS);
  return windows.map((window, index) => {
    const slotStart = slotFromOption(window, plan.durationMinutes).start;
    const slot = { start: slotStart, end: slotStart + plan.durationMinutes };
    const span = diagramSpan(slot);
    const next = windows[index + 1];
    const tiedWithNext =
      next !== undefined &&
      next.score === window.score &&
      next.freeMemberIds.length === window.freeMemberIds.length;
    const state = (id: string): PersonState =>
      window.freeMemberIds.includes(id)
        ? "free"
        : window.unknownMemberIds.includes(id)
          ? "unknown"
          : "busy";
    const busy = plan.participants.filter((p) => state(p.accountId) === "busy");
    const unknown = plan.participants.filter(
      (p) => state(p.accountId) === "unknown",
    );
    const note =
      busy.length === 1 && busy[0]
        ? t("options.cannot", { name: busy[0].displayName })
        : unknown.length === 1 && unknown[0]
          ? t("options.unknown.one", { name: unknown[0].displayName })
          : unknown.length > 1
            ? t("options.unknown.many", { count: unknown.length })
            : null;
    return {
      key: `${window.date}-${window.start}`,
      date: window.date,
      dayLabel: formatDay(window.date),
      start: slot.start,
      end: slot.end,
      windowStart: window.start,
      windowEnd: window.end,
      freeCount: window.freeMemberIds.length,
      memberCount: plan.participants.length,
      reasons: [
        ...window.reasons
          .filter((r) => SHOWN_REASONS.includes(r.code))
          .map((r) => t(`reason.${r.code}` as MessageKey)),
        ...(tiedWithNext ? [t("reason.SOONER")] : []),
      ],
      people: plan.participants.map((p) => ({
        name: names.get(p.accountId) ?? "?",
        state: state(p.accountId),
      })),
      note,
      span,
      lines: dayLines(plan, window.date, span).map((line) => ({
        ...line,
        colorIndex: colorIndex.get(line.accountId) ?? 0,
      })),
    };
  });
}
