"use client";

import {
  clipIntervals,
  type DayAvailability,
  type Interval,
  type LineSegment,
  type LocalDate,
  subtractIntervals,
} from "@amigo/core";
import {
  type ClothSpan,
  ThreadSegments,
  TimeAxis,
} from "@/components/day-cloth";
import { t } from "@/i18n/t";
import { formatShortDate, formatSpan } from "@/lib/format";

export interface WeekDay {
  readonly date: LocalDate;
  readonly label: string;
}

interface WeekClothProps {
  readonly days: readonly WeekDay[];
  readonly weekIndex: number;
  readonly weekCount: number;
  readonly onWeekChange: (nextIndex: number) => void;
  readonly availability: Readonly<Record<string, DayAvailability>>;
  readonly unknown: boolean;
  readonly lineColor: string;
  readonly span: ClothSpan;
  readonly adjustedDates?: ReadonlySet<string>;
  readonly onSelectDay: (date: LocalDate) => void;
}

function daySegments(
  busy: readonly Interval[],
  span: ClothSpan,
  unknown: boolean,
): LineSegment[] {
  if (unknown) {
    return [{ start: span.start, end: span.end, state: "unknown" }];
  }
  const clippedBusy = clipIntervals(busy, span);
  const free = subtractIntervals([span], clippedBusy);
  return [
    ...free.map((i) => ({ ...i, state: "free" as const })),
    ...clippedBusy.map((i) => ({ ...i, state: "busy" as const })),
  ].toSorted((a, b) => a.start - b.start);
}

function dayScreenReaderSummary(
  busy: readonly Interval[],
  unknown: boolean,
): string {
  if (unknown) return t("profileEdit.week.unknownDay");
  if (busy.length === 0) return t("profileEdit.week.allFree");
  return busy.map((i) => formatSpan(i.start, i.end)).join(", ");
}

/**
 * Woven 7-day preview of the person's week: free time rides on top as spun
 * yarn, busy time dives under as a solid under-thread, and an unsaved empty
 * profile reads as loose dotted yarn until confirmed.
 */
export function WeekCloth({
  days,
  weekIndex,
  weekCount,
  onWeekChange,
  availability,
  unknown,
  lineColor,
  span,
  adjustedDates,
  onSelectDay,
}: WeekClothProps) {
  const first = days[0]?.date;
  const last = days.at(-1)?.date;
  const rangeLabel =
    first && last
      ? t("profileEdit.week.range", {
          from: formatShortDate(first),
          to: formatShortDate(last),
        })
      : "";

  return (
    <section aria-labelledby="week-title" className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="week-title" className="font-extrabold text-lg">
          {t("profileEdit.week.title")}
        </h2>
        {weekCount > 1 ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={weekIndex <= 0}
              onClick={() => onWeekChange(weekIndex - 1)}
              aria-label={t("profileEdit.week.prev")}
              className="grid size-11 place-items-center rounded-cloth border border-rule-strong bg-surface text-ink hover:bg-panel disabled:border-rule disabled:text-mute"
            >
              <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4">
                <path
                  d="M10 3 5 8l5 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <span className="min-w-28 text-center font-bold text-ink text-sm">
              {rangeLabel}
            </span>
            <button
              type="button"
              disabled={weekIndex >= weekCount - 1}
              onClick={() => onWeekChange(weekIndex + 1)}
              aria-label={t("profileEdit.week.next")}
              className="grid size-11 place-items-center rounded-cloth border border-rule-strong bg-surface text-ink hover:bg-panel disabled:border-rule disabled:text-mute"
            >
              <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4">
                <path
                  d="M6 3l5 5-5 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-2 rounded-cloth bg-surface px-3 pt-2.5 pb-3">
        <ul className="divide-y divide-rule">
          {days.map((day) => {
            const busy = availability[day.date]?.busy ?? [];
            const segments = daySegments(busy, span, unknown);
            const summary = dayScreenReaderSummary(busy, unknown);
            const adjusted = adjustedDates?.has(day.date) ?? false;
            return (
              <li key={day.date}>
                <button
                  type="button"
                  onClick={() => onSelectDay(day.date)}
                  aria-label={t("profileEdit.week.dayAction", {
                    day: day.label,
                    summary,
                  })}
                  className="flex min-h-11 w-full items-center gap-2 rounded-knot px-1 text-left hover:bg-panel/70"
                >
                  <span className="flex w-16 flex-none items-center gap-1 pr-1 font-extrabold text-[0.875rem] text-ink leading-none">
                    <span>{day.label}</span>
                    {adjusted ? (
                      <span
                        aria-hidden="true"
                        className="size-1.5 flex-none rounded-full bg-ink"
                      />
                    ) : null}
                  </span>
                  <span className="flex h-6 min-w-0 flex-1 items-center">
                    <ThreadSegments
                      segments={segments}
                      span={span}
                      color={lineColor}
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <TimeAxis span={span} labelSpacerClass="w-[4.5rem] flex-none" />
        <p className="mt-2 text-pretty text-caption text-mute">
          {t("cloth.legend")}
        </p>
        <p className="mt-0.5 text-caption text-mute">
          {t("profileEdit.week.tapHint")}
        </p>
      </div>
    </section>
  );
}
