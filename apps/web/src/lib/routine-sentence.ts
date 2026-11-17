import { type BusyTemplate, type Interval, mergeIntervals } from "@amigo/core";
import { type MessageKey, t } from "@/i18n/t";
import { formatShortDate, formatTime } from "./format";

const MINUTES_PER_DAY = 24 * 60;
const WEEKDAYS_MON_FIRST = [1, 2, 3, 4, 5, 6, 0] as const;

function endTimeLabel(end: number): string {
  const clock = formatTime(end);
  return end > MINUTES_PER_DAY
    ? t("routine.summary.nextDay", { time: clock })
    : clock;
}

function formatWeeklyIntervals(intervals: readonly Interval[]): string {
  const parts = mergeIntervals(intervals).map((interval) =>
    t("routine.summary.span", {
      from: formatTime(interval.start),
      to: endTimeLabel(interval.end),
    }),
  );
  return joinSpanishList(parts);
}

function formatCycleIntervals(intervals: readonly Interval[]): string {
  const merged = mergeIntervals(intervals);
  if (merged.length === 0) return t("routine.summary.cycle.free");
  return merged
    .map(
      (interval) =>
        `${formatTime(interval.start)}–${endTimeLabel(interval.end)}`,
    )
    .join(" + ");
}

function joinSpanishList(items: readonly string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0] ?? "";
  const head = items.slice(0, -1).join(", ");
  const last = items.at(-1) ?? "";
  return t("routine.summary.and", { left: head, right: last });
}

function formatWeekdayIndices(indices: readonly number[]): string {
  const name = (idx: number) =>
    t(`weekday.long.${WEEKDAYS_MON_FIRST[idx] ?? 1}` as MessageKey);
  if (indices.length >= 3) {
    const consecutive = indices.every(
      (idx, i) => i === 0 || idx === (indices[i - 1] ?? 0) + 1,
    );
    if (consecutive) {
      const first = indices[0] ?? 0;
      const last = indices.at(-1) ?? 0;
      return t("routine.summary.dayRange", {
        from: name(first),
        to: name(last),
      });
    }
  }
  return joinSpanishList(indices.map(name));
}

/**
 * Plain-Spanish preview of what a routine marks as busy before saving (S2).
 */
export function describeRoutine(template: BusyTemplate): string {
  if (template.kind === "shifts") {
    const count = template.cycle.length;
    const unit =
      count === 1
        ? t("routine.summary.cycle.dayUnit.one")
        : t("routine.summary.cycle.dayUnit.other");
    const runs: { from: number; to: number; hours: string }[] = [];
    template.cycle.forEach((dayIntervals, i) => {
      const dayNumber = i + 1;
      const hours = formatCycleIntervals(dayIntervals);
      const previous = runs.at(-1);
      if (previous && previous.hours === hours) {
        previous.to = dayNumber;
      } else {
        runs.push({ from: dayNumber, to: dayNumber, hours });
      }
    });
    const steps = runs
      .map((run) =>
        run.from === run.to
          ? t("routine.summary.cycle.step.one", {
              day: run.from,
              hours: run.hours,
            })
          : t("routine.summary.cycle.step.range", {
              from: run.from,
              to: run.to,
              hours: run.hours,
            }),
      )
      .join(", ");
    return t("routine.summary.cycle", {
      count,
      unit,
      date: formatShortDate(template.anchor),
      steps,
    });
  }

  const byWeekday = new Map<number, Interval[]>();
  for (const block of template.blocks) {
    const existing = byWeekday.get(block.weekday) ?? [];
    existing.push({ start: block.start, end: block.end });
    byWeekday.set(block.weekday, existing);
  }
  const activeIndices = WEEKDAYS_MON_FIRST.flatMap((weekday, index) => {
    const intervals = byWeekday.get(weekday);
    return intervals && intervals.length > 0
      ? [{ index, hours: formatWeeklyIntervals(intervals) }]
      : [];
  });
  if (activeIndices.length === 0) {
    return t("routine.summary.empty");
  }

  const groups: { indices: number[]; hours: string }[] = [];
  for (const entry of activeIndices) {
    const match = groups.find((g) => g.hours === entry.hours);
    if (match) match.indices.push(entry.index);
    else groups.push({ indices: [entry.index], hours: entry.hours });
  }

  const detail = groups
    .map((group) =>
      t("routine.summary.group", {
        days: formatWeekdayIndices(group.indices),
        hours: group.hours,
      }),
    )
    .join("; ");
  return t("routine.summary.weekly", { detail });
}
