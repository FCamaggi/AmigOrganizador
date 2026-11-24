"use client";

import type { DayAvailability, Interval, LocalDate } from "@amigo/core";
import { useEffect, useRef } from "react";
import { type MessageKey, t } from "@/i18n/t";
import { formatTime } from "@/lib/format";
import {
  h,
  intervalFromClocks,
  parseTimeInput,
  ToggleChip,
} from "./routine-sheet";
import { Sheet } from "./sheet";

export const TRACK = { start: h(8), end: h(24) };
export const SEGMENTS = [
  { key: "morning", start: h(8), end: h(13) },
  { key: "afternoon", start: h(13), end: h(19) },
  { key: "evening", start: h(19), end: h(24) },
] as const;
export type SegmentKey = (typeof SEGMENTS)[number]["key"];
export type DayGranularity = "blocks" | "hours";

export const segmentOf = (key: SegmentKey): Interval => {
  const s = SEGMENTS.find((x) => x.key === key) ?? SEGMENTS[0];
  return { start: s.start, end: s.end };
};

export const overlap = (intervals: readonly Interval[], seg: Interval) =>
  intervals.reduce(
    (sum, i) =>
      sum +
      Math.max(0, Math.min(i.end, seg.end) - Math.max(i.start, seg.start)),
    0,
  );

const pct = (value: number) =>
  ((value - TRACK.start) / (TRACK.end - TRACK.start)) * 100;

interface DaysSheetProps {
  readonly open: boolean;
  readonly focusedDate: LocalDate | null;
  readonly days: readonly { date: LocalDate; label: string }[];
  readonly availability: Readonly<Record<string, DayAvailability>>;
  readonly adjustedDates: ReadonlySet<string>;
  readonly lineColor: string;
  readonly granularity: DayGranularity;
  readonly onSelectGranularity: (mode: DayGranularity) => void;
  readonly onTapSegment: (date: LocalDate, key: SegmentKey) => void;
  readonly onSetDayIntervals: (
    date: LocalDate,
    next: readonly Interval[],
  ) => void;
  readonly onClose: () => void;
}

export function DaysSheet({
  open,
  focusedDate,
  days,
  availability,
  adjustedDates,
  lineColor,
  granularity,
  onSelectGranularity,
  onTapSegment,
  onSetDayIntervals,
  onClose,
}: DaysSheetProps) {
  const focusedRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (open && focusedDate) {
      focusedRef.current?.scrollIntoView({ block: "nearest" });
    }
  }, [open, focusedDate]);

  return (
    <Sheet
      open={open}
      title={t("profileEdit.days.title")}
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="flex min-h-11 flex-1 items-center justify-center rounded-cloth bg-ink px-4 font-extrabold text-[0.9375rem] text-surface hover:opacity-90"
        >
          {t("profileEdit.sheet.done")}
        </button>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-mute text-sm">{t("profileEdit.days.hint")}</p>
        <div className="flex gap-1.5">
          <ToggleChip
            selected={granularity === "blocks"}
            onClick={() => onSelectGranularity("blocks")}
          >
            {t("profileEdit.days.mode.blocks")}
          </ToggleChip>
          <ToggleChip
            selected={granularity === "hours"}
            onClick={() => onSelectGranularity("hours")}
          >
            {t("profileEdit.days.mode.hours")}
          </ToggleChip>
        </div>
      </div>

      <div className="mt-3">
        <div aria-hidden="true" className="flex pb-1 text-caption text-mute">
          <span className="w-[4.25rem] flex-none" />
          <span className="relative h-4 flex-1">
            {SEGMENTS.map((seg) => (
              <span
                key={seg.key}
                className="absolute top-0 text-center font-bold"
                style={{
                  left: `${pct(seg.start)}%`,
                  width: `${pct(seg.end) - pct(seg.start)}%`,
                }}
              >
                {t(`answer.segment.${seg.key}` as MessageKey)}
              </span>
            ))}
          </span>
        </div>

        <ul className="divide-y divide-rule border-rule border-t">
          {days.map((day) => {
            const busy = availability[day.date]?.busy ?? [];
            const isFocused = focusedDate === day.date;
            const isAdjusted = adjustedDates.has(day.date);
            return (
              <li
                key={day.date}
                ref={isFocused ? focusedRef : undefined}
                className={`py-1.5 ${isFocused ? "bg-panel/60" : ""}`}
              >
                <div className="flex items-center">
                  <span className="w-[4.25rem] flex-none pr-1">
                    <span className="block font-extrabold text-[0.9375rem] leading-tight">
                      {day.label}
                    </span>
                    {isAdjusted ? (
                      <span className="block font-bold text-[0.6875rem] text-mute">
                        {t("profileEdit.oneOff.adjusted")}
                      </span>
                    ) : null}
                  </span>

                  <span className="relative h-11 min-w-0 flex-1">
                    <span
                      aria-hidden="true"
                      className="yarn absolute inset-x-0 top-1/2 -mt-1.5 h-3 rounded-full"
                      style={{ backgroundColor: lineColor }}
                    />
                    {busy
                      .filter((i) => i.end > TRACK.start && i.start < TRACK.end)
                      .map((i) => {
                        const left = pct(Math.max(i.start, TRACK.start));
                        const right = pct(Math.min(i.end, TRACK.end));
                        return (
                          <span
                            key={i.start}
                            aria-hidden="true"
                            className="absolute top-1/2 flex h-3.5 -translate-y-1/2 items-center bg-surface"
                            style={{
                              left: `${left}%`,
                              width: `${right - left}%`,
                            }}
                          >
                            {i.start > TRACK.start ? (
                              <span
                                className="h-2.5 w-[2.5px] flex-none rounded-full"
                                style={{ backgroundColor: lineColor }}
                              />
                            ) : null}
                            <span className="thread-dive h-[3px] flex-1" />
                            {i.end < TRACK.end ? (
                              <span
                                className="h-2.5 w-[2.5px] flex-none rounded-full"
                                style={{ backgroundColor: lineColor }}
                              />
                            ) : null}
                          </span>
                        );
                      })}
                    {granularity === "blocks"
                      ? SEGMENTS.map((seg, index) => {
                          const covered = overlap(busy, seg);
                          const state =
                            covered === 0
                              ? "free"
                              : covered >= seg.end - seg.start
                                ? "busy"
                                : "partial";
                          return (
                            <button
                              key={seg.key}
                              type="button"
                              onClick={() => onTapSegment(day.date, seg.key)}
                              aria-pressed={state !== "free"}
                              aria-label={t("answer.segment.label", {
                                day: day.label,
                                segment: t(
                                  `answer.segment.${seg.key}` as MessageKey,
                                ),
                                from: formatTime(seg.start),
                                to: formatTime(seg.end),
                                state: t(
                                  `answer.segment.state.${state}` as MessageKey,
                                ),
                              })}
                              className={`absolute inset-y-0 active:bg-ink/[0.06] ${
                                index > 0
                                  ? "border-rule border-l border-dashed"
                                  : ""
                              }`}
                              style={{
                                left: `${pct(seg.start)}%`,
                                width: `${pct(seg.end) - pct(seg.start)}%`,
                              }}
                            />
                          );
                        })
                      : null}
                  </span>
                </div>

                {granularity === "hours" ? (
                  <div className="mt-1 pl-[4.25rem]">
                    <div className="space-y-1.5">
                      {busy.map((interval, idx) => (
                        <div
                          key={interval.start}
                          className="flex flex-wrap items-center gap-1.5"
                        >
                          <input
                            type="time"
                            step="900"
                            aria-label={t("profileEdit.days.hours.start", {
                              day: day.label,
                              index: idx + 1,
                            })}
                            value={formatTime(interval.start)}
                            onChange={(e) => {
                              const startClock = parseTimeInput(
                                e.target.value,
                                interval.start,
                              );
                              const nextInterval = intervalFromClocks(
                                startClock,
                                interval.end % 1440,
                              );
                              onSetDayIntervals(
                                day.date,
                                busy.map((item, i) =>
                                  i === idx ? nextInterval : item,
                                ),
                              );
                            }}
                            className="min-h-11 rounded-cloth border-[1.5px] border-rule-strong bg-surface px-2 font-bold text-sm"
                          />
                          <span aria-hidden="true">–</span>
                          <input
                            type="time"
                            step="900"
                            aria-label={t("profileEdit.days.hours.end", {
                              day: day.label,
                              index: idx + 1,
                            })}
                            value={formatTime(interval.end)}
                            onChange={(e) => {
                              const endClock = parseTimeInput(
                                e.target.value,
                                interval.end % 1440,
                              );
                              const nextInterval = intervalFromClocks(
                                interval.start,
                                endClock,
                              );
                              onSetDayIntervals(
                                day.date,
                                busy.map((item, i) =>
                                  i === idx ? nextInterval : item,
                                ),
                              );
                            }}
                            className="min-h-11 rounded-cloth border-[1.5px] border-rule-strong bg-surface px-2 font-bold text-sm"
                          />
                          <button
                            type="button"
                            aria-label={`${t("profileEdit.days.hours.remove")} ${day.label} ${idx + 1}`}
                            onClick={() =>
                              onSetDayIntervals(
                                day.date,
                                busy.filter((_, i) => i !== idx),
                              )
                            }
                            className="min-h-11 rounded-cloth border border-rule-strong px-2 font-bold text-xs hover:bg-panel"
                          >
                            {t("profileEdit.days.hours.remove")}
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const lastEnd = busy.at(-1)?.end ?? h(9);
                        const start = Math.min(h(22), Math.max(h(8), lastEnd));
                        const end = Math.min(h(24), start + 60);
                        onSetDayIntervals(day.date, [...busy, { start, end }]);
                      }}
                      className="mt-1 min-h-11 font-bold text-indigo text-xs underline"
                    >
                      {t("profileEdit.days.hours.add")}
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </Sheet>
  );
}
