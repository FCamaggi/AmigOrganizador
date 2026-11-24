"use client";

import {
  availabilityFor,
  type BusyTemplate,
  expandBusyTemplates,
  type Interval,
  type LocalDate,
  mergeIntervals,
  type Profile,
  scheduleId,
  setDay,
  subtractIntervals,
  type WeeklyBlock,
} from "@amigo/core";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { type MessageKey, t } from "@/i18n/t";
import { formatTime } from "@/lib/format";
import { TIMEZONES } from "@/lib/plan-options";
import { describeRoutine } from "@/lib/routine-sentence";
import { buttonClasses, shellClasses } from "@/lib/ui";
import type { ProfileInput } from "@/server/group-actions";

const h = (hours: number, mins = 0) => hours * 60 + mins;
const SEGMENTS = [
  { key: "morning", start: h(8), end: h(13) },
  { key: "afternoon", start: h(13), end: h(19) },
  { key: "evening", start: h(19), end: h(24) },
] as const;
type SegmentKey = (typeof SEGMENTS)[number]["key"];
const TRACK = { start: h(8), end: h(24) };
const WEEKDAYS_MON_FIRST = [1, 2, 3, 4, 5, 6, 0] as const;
const DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5] as const;
const legend = "font-extrabold text-xs uppercase tracking-[0.06em]";

type DayGranularity = "blocks" | "hours";

interface CycleStep {
  readonly stepId: string;
  readonly intervals: readonly Interval[];
}

interface DayBlockItem {
  readonly blockId: string;
  readonly start: number;
  readonly end: number;
}

type EditableRoutine =
  | {
      readonly uiId: string;
      readonly kind: "workweek" | "classes";
      readonly label: string;
      readonly perDay: boolean;
      readonly uniformStart: number;
      readonly uniformEnd: number;
      readonly weekdays: readonly number[];
      readonly dayBlocks: Readonly<Record<number, readonly DayBlockItem[]>>;
    }
  | {
      readonly uiId: string;
      readonly kind: "shifts";
      readonly label: string;
      readonly anchor: LocalDate;
      readonly cycle: readonly CycleStep[];
    };

const segmentOf = (key: SegmentKey): Interval => {
  const s = SEGMENTS.find((x) => x.key === key) ?? SEGMENTS[0];
  return { start: s.start, end: s.end };
};

function defaultLabelFor(kind: BusyTemplate["kind"]): string {
  return t(`profileEdit.routine.defaultLabel.${kind}` as MessageKey);
}

function cleanRoutineLabel(value: string, kind: BusyTemplate["kind"]): string {
  const trimmed = value.trim().slice(0, 40);
  return trimmed.length > 0 ? trimmed : defaultLabelFor(kind);
}

/** Converts HH:MM input string to minutes (0..1439), or fallback. */
function parseTimeInput(value: string, fallback: number): number {
  const match = /^(\d{2}):(\d{2})/.exec(value);
  if (!match) return fallback;
  const hours = Number(match[1]);
  const mins = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(mins)) return fallback;
  return Math.max(0, Math.min(1439, hours * 60 + mins));
}

/** An end at or before the start means it ends the next day (end + 1440, max 2880). */
function intervalFromClocks(startClock: number, endClock: number): Interval {
  const start = Math.max(0, Math.min(1439, startClock));
  const rawEnd = endClock <= start ? endClock + 1440 : endClock;
  const end = Math.min(2880, Math.max(start + 15, rawEnd));
  return { start, end };
}

function editableFromTemplates(
  templates: readonly BusyTemplate[],
): EditableRoutine[] {
  return templates.map((template, index) => {
    const uiId = `routine_${index}`;
    const label = template.label ?? defaultLabelFor(template.kind);
    if (template.kind === "shifts") {
      const rawCycle =
        template.cycle.length > 0
          ? template.cycle
          : [[{ start: h(8), end: h(20) }]];
      return {
        uiId,
        kind: "shifts",
        label,
        anchor: template.anchor,
        cycle: rawCycle.map((intervals, stepIdx) => ({
          stepId: `${uiId}_step_${stepIdx}`,
          intervals,
        })),
      };
    }
    const dayBlocks: Record<number, DayBlockItem[]> = {};
    template.blocks.forEach((block, blockIdx) => {
      dayBlocks[block.weekday] = [
        ...(dayBlocks[block.weekday] ?? []),
        {
          blockId: `${uiId}_b_${block.weekday}_${blockIdx}`,
          start: block.start,
          end: block.end,
        },
      ];
    });
    const weekdays = WEEKDAYS_MON_FIRST.filter(
      (day) => (dayBlocks[day]?.length ?? 0) > 0,
    );
    const first = template.blocks[0] ?? {
      weekday: 1,
      start: h(9),
      end: h(18),
    };
    const allSameSingle =
      weekdays.length > 0 &&
      weekdays.every((day) => {
        const list = dayBlocks[day] ?? [];
        return (
          list.length === 1 &&
          list[0]?.start === first.start &&
          list[0]?.end === first.end
        );
      });
    return {
      uiId,
      kind: template.kind,
      label,
      perDay: !allSameSingle && template.blocks.length > 0,
      uniformStart: first.start,
      uniformEnd: first.end,
      weekdays,
      dayBlocks,
    };
  });
}

function templateFromEditable(routine: EditableRoutine): BusyTemplate {
  const label = cleanRoutineLabel(routine.label, routine.kind);
  if (routine.kind === "shifts") {
    return {
      kind: "shifts",
      label,
      anchor: routine.anchor,
      cycle:
        routine.cycle.length > 0
          ? routine.cycle.map((step) => step.intervals)
          : [[{ start: h(8), end: h(20) }]],
    };
  }
  const blocks: WeeklyBlock[] = [];
  if (routine.perDay) {
    for (const weekday of WEEKDAYS_MON_FIRST) {
      if (!routine.weekdays.includes(weekday)) continue;
      const intervals = routine.dayBlocks[weekday] ?? [
        {
          blockId: "default",
          start: routine.uniformStart,
          end: routine.uniformEnd,
        },
      ];
      for (const interval of intervals) {
        blocks.push({ weekday, start: interval.start, end: interval.end });
      }
    }
  } else {
    for (const weekday of WEEKDAYS_MON_FIRST) {
      if (!routine.weekdays.includes(weekday)) continue;
      blocks.push({
        weekday,
        start: routine.uniformStart,
        end: routine.uniformEnd,
      });
    }
  }
  return {
    kind: routine.kind,
    label,
    blocks,
  };
}

function cyclePreset(
  preset: "4x4" | "7x7" | "5x2" | "4x3",
  prefix: string,
): CycleStep[] {
  const day12 = [{ start: h(8), end: h(20) }];
  const night12 = [{ start: h(20), end: h(32) }];
  const office9 = [{ start: h(9), end: h(18) }];
  let raw: (readonly Interval[])[];
  if (preset === "4x4") raw = [day12, night12, [], []];
  else if (preset === "7x7") {
    raw = [
      ...Array.from({ length: 7 }, () => day12),
      ...Array.from({ length: 7 }, () => []),
    ];
  } else if (preset === "5x2") {
    raw = [
      ...Array.from({ length: 5 }, () => office9),
      ...Array.from({ length: 2 }, () => []),
    ];
  } else {
    raw = [
      ...Array.from({ length: 4 }, () => day12),
      ...Array.from({ length: 3 }, () => []),
    ];
  }
  return raw.map((intervals, idx) => ({
    stepId: `${prefix}_${preset}_${idx}`,
    intervals,
  }));
}

const overlap = (intervals: readonly Interval[], seg: Interval) =>
  intervals.reduce(
    (sum, i) =>
      sum +
      Math.max(0, Math.min(i.end, seg.end) - Math.max(i.start, seg.start)),
    0,
  );

const pct = (value: number) =>
  ((value - TRACK.start) / (TRACK.end - TRACK.start)) * 100;

function Chip({
  selected,
  onClick,
  children,
}: {
  readonly selected: boolean;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-11 rounded-cloth border-[1.5px] px-3 font-bold text-[0.9375rem] ${
        selected
          ? "border-ink bg-ink text-white"
          : "border-rule-strong bg-surface text-ink"
      }`}
    >
      {children}
    </button>
  );
}

interface ProfileEditorProps {
  readonly profile: Profile;
  readonly today: LocalDate;
  readonly timeZone: string;
  readonly days: readonly { date: LocalDate; label: string }[];
  readonly lineColor: string;
  readonly next: string | null;
  readonly save: (input: ProfileInput) => Promise<{ ok: boolean }>;
  /** Rendered after the days and before the sticky save button. */
  readonly children?: React.ReactNode;
}

export function ProfileEditor({
  profile,
  today,
  timeZone,
  days,
  lineColor,
  next,
  save,
  children,
}: ProfileEditorProps) {
  const router = useRouter();
  const [routines, setRoutines] = useState<EditableRoutine[]>(() =>
    editableFromTemplates(profile.templates),
  );
  const [dayState, setDayState] = useState(profile);
  const [zone, setZone] = useState(timeZone);
  const [changed, setChanged] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [granularity, setGranularity] = useState<DayGranularity>("blocks");
  const [pending, startTransition] = useTransition();
  const nextIdCounter = useRef(profile.templates.length + 1);
  // When the first edit happened (performance.now), to measure setup time.
  const firstEdit = useRef<number | null>(null);
  const markEdited = () => {
    firstEdit.current ??= performance.now();
  };

  const storageKey = `amigo:day-granularity:${profile.accountId}`;
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved === "blocks" || saved === "hours") {
        setGranularity(saved);
      }
    } catch {
      // Ignore storage failures in restricted contexts.
    }
  }, [storageKey]);

  function selectGranularity(mode: DayGranularity) {
    setGranularity(mode);
    try {
      window.localStorage.setItem(storageKey, mode);
    } catch {
      // Ignore storage failures.
    }
  }

  const templates = useMemo(
    () =>
      routines
        .map(templateFromEditable)
        .filter((tmpl) =>
          tmpl.kind === "shifts"
            ? tmpl.cycle.length > 0
            : tmpl.blocks.length > 0,
        ),
    [routines],
  );
  const from = days[0]?.date ?? today;
  const to = days.at(-1)?.date ?? today;
  const templateBusyByDate = useMemo(
    () => expandBusyTemplates(templates, from, to),
    [templates, from, to],
  );
  const availability = useMemo(
    // Read in the person's own zone: wall times stay as written.
    () =>
      availabilityFor(
        { ...dayState, templates, timezone: zone },
        from,
        to,
        zone,
      ),
    [dayState, templates, from, to, zone],
  );

  function updateRoutines(nextList: EditableRoutine[]) {
    markEdited();
    setRoutines(nextList);
    setStatus("idle");
  }

  function addWeeklyRoutine() {
    const id = `routine_${nextIdCounter.current++}`;
    const start = h(9);
    const end = h(18);
    const dayBlocks: Record<number, DayBlockItem[]> = {};
    for (const day of DEFAULT_WEEKDAYS) {
      dayBlocks[day] = [{ blockId: `${id}_b_${day}_0`, start, end }];
    }
    updateRoutines([
      ...routines,
      {
        uiId: id,
        kind: "workweek",
        label: defaultLabelFor("workweek"),
        perDay: false,
        uniformStart: start,
        uniformEnd: end,
        weekdays: [...DEFAULT_WEEKDAYS],
        dayBlocks,
      },
    ]);
  }

  function addCycleRoutine() {
    const id = `routine_${nextIdCounter.current++}`;
    updateRoutines([
      ...routines,
      {
        uiId: id,
        kind: "shifts",
        label: defaultLabelFor("shifts"),
        anchor: today,
        cycle: cyclePreset("4x4", id),
      },
    ]);
  }

  function replaceRoutine(index: number, updated: EditableRoutine) {
    updateRoutines(routines.map((r, i) => (i === index ? updated : r)));
  }

  function removeRoutine(index: number) {
    updateRoutines(routines.filter((_, i) => i !== index));
  }

  function tap(date: LocalDate, key: SegmentKey) {
    markEdited();
    const seg = segmentOf(key);
    const busyNow = overlap(availability[date]?.busy ?? [], seg) > 0;
    const oneOff = dayState.busyDays[date] ?? [];
    const exceptions = dayState.exceptions[date] ?? [];
    setDayState(
      setDay(dayState, {
        date,
        busy: busyNow
          ? subtractIntervals(oneOff, [seg])
          : mergeIntervals([...oneOff, seg]),
        exceptions: busyNow
          ? mergeIntervals([...exceptions, seg])
          : subtractIntervals(exceptions, [seg]),
        now: Date.now(),
      }),
    );
    setChanged((c) => new Set([...c, date]));
    setStatus("idle");
  }

  function setDayIntervals(
    date: LocalDate,
    nextIntervals: readonly Interval[],
  ) {
    markEdited();
    const templateIntervals = templateBusyByDate[date] ?? [];
    const merged = mergeIntervals(nextIntervals);
    setDayState(
      setDay(dayState, {
        date,
        busy: merged,
        exceptions: subtractIntervals(templateIntervals, merged),
        now: Date.now(),
      }),
    );
    setChanged((c) => new Set([...c, date]));
    setStatus("idle");
  }

  function submit() {
    const started = firstEdit.current;
    startTransition(async () => {
      const result = await save({
        scheduleId: scheduleId(profile),
        setupSeconds:
          started === null ? undefined : (performance.now() - started) / 1000,
        timezone: zone,
        templates,
        days: Object.fromEntries(
          [...changed].map((date) => [
            date,
            {
              busy: dayState.busyDays[date] ?? [],
              exceptions: dayState.exceptions[date] ?? [],
            },
          ]),
        ),
      });
      if (!result.ok) {
        setStatus("error");
        return;
      }
      setChanged(new Set());
      setStatus("saved");
      if (next) router.push(next);
    });
  }

  // Desktop: routines and calendar import on the left, the 14 days on the
  // right. Below `lg` everything stacks in DOM order.
  return (
    <>
      <div className="contents lg:grid lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-10">
        <section
          aria-labelledby="routines-title"
          className="mt-5 lg:col-start-1 lg:row-start-1"
        >
          <h2 id="routines-title" className={legend}>
            {t("profileEdit.routines")}
          </h2>

          {routines.length === 0 ? (
            <p className="mt-2 rounded-cloth border border-rule border-dashed px-3 py-3 text-mute text-sm">
              {t("profileEdit.routine.empty")}
            </p>
          ) : (
            <div className="mt-2.5 space-y-4">
              {routines.map((routine, index) => {
                const previewTemplate = templateFromEditable(routine);
                return (
                  <article
                    key={routine.uiId}
                    className="rounded-cloth border-[1.5px] border-ink bg-surface p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <label
                          htmlFor={`${routine.uiId}-label`}
                          className={legend}
                        >
                          {t("profileEdit.routine.label")}
                        </label>
                        <input
                          id={`${routine.uiId}-label`}
                          type="text"
                          value={routine.label}
                          maxLength={40}
                          onChange={(e) =>
                            replaceRoutine(index, {
                              ...routine,
                              label: e.target.value,
                            })
                          }
                          className="mt-1 block min-h-11 w-full rounded-cloth border-[1.5px] border-rule-strong bg-surface px-2.5 font-extrabold"
                        />
                        <p className="mt-1 font-bold text-mute text-xs">
                          {routine.kind === "shifts"
                            ? t("profileEdit.routine.type.cycle")
                            : t("profileEdit.routine.type.weekly")}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRoutine(index)}
                        className={`${buttonClasses.secondary} flex-none px-2.5 text-sm`}
                      >
                        {t("profileEdit.routine.remove")}
                      </button>
                    </div>

                    {routine.kind === "shifts" ? (
                      <div className="mt-3 space-y-3">
                        <div>
                          <span className={legend}>
                            {t("profileEdit.routine.cycle.presets")}
                          </span>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {(["4x4", "7x7", "5x2", "4x3"] as const).map(
                              (preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() =>
                                    replaceRoutine(index, {
                                      ...routine,
                                      cycle: cyclePreset(
                                        preset,
                                        `${routine.uiId}_${nextIdCounter.current++}`,
                                      ),
                                    })
                                  }
                                  className="min-h-11 rounded-cloth border-[1.5px] border-rule-strong bg-surface px-2.5 font-bold text-xs hover:bg-panel"
                                >
                                  {t(
                                    `profileEdit.routine.cycle.preset.${preset}` as MessageKey,
                                  )}
                                </button>
                              ),
                            )}
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor={`${routine.uiId}-anchor`}
                            className={legend}
                          >
                            {t("profileEdit.routine.cycle.anchor")}
                          </label>
                          <input
                            id={`${routine.uiId}-anchor`}
                            type="date"
                            value={routine.anchor}
                            onChange={(e) => {
                              if (e.target.value) {
                                replaceRoutine(index, {
                                  ...routine,
                                  anchor: e.target.value as LocalDate,
                                });
                              }
                            }}
                            className="mt-1 block min-h-11 rounded-cloth border-[1.5px] border-rule-strong bg-surface px-2.5 font-bold"
                          />
                        </div>

                        <ul className="divide-y divide-rule border-rule border-y">
                          {routine.cycle.map((step, stepIndex) => {
                            const first = step.intervals[0];
                            const isBusy = first !== undefined;
                            const dayLabel = t(
                              "profileEdit.routine.cycle.day",
                              {
                                index: stepIndex + 1,
                              },
                            );
                            return (
                              <li
                                key={step.stepId}
                                className="flex flex-wrap items-center gap-2 py-2"
                              >
                                <span className="w-16 flex-none font-extrabold text-sm">
                                  {dayLabel}
                                </span>
                                <Chip
                                  selected={isBusy}
                                  onClick={() => {
                                    const nextCycle = routine.cycle.map(
                                      (entry, idx) =>
                                        idx === stepIndex
                                          ? {
                                              ...entry,
                                              intervals: isBusy
                                                ? []
                                                : [{ start: h(8), end: h(20) }],
                                            }
                                          : entry,
                                    );
                                    replaceRoutine(index, {
                                      ...routine,
                                      cycle: nextCycle,
                                    });
                                  }}
                                >
                                  {isBusy
                                    ? t("profileEdit.routine.cycle.busy")
                                    : t("profileEdit.routine.cycle.free")}
                                </Chip>

                                {isBusy ? (
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <input
                                      type="time"
                                      step="900"
                                      aria-label={`${dayLabel} ${t("profileEdit.routine.start")}`}
                                      value={formatTime(first.start)}
                                      onChange={(e) => {
                                        const startClock = parseTimeInput(
                                          e.target.value,
                                          first.start,
                                        );
                                        const endClock = first.end % 1440;
                                        const nextInterval = intervalFromClocks(
                                          startClock,
                                          endClock,
                                        );
                                        replaceRoutine(index, {
                                          ...routine,
                                          cycle: routine.cycle.map(
                                            (entry, idx) =>
                                              idx === stepIndex
                                                ? {
                                                    ...entry,
                                                    intervals: [nextInterval],
                                                  }
                                                : entry,
                                          ),
                                        });
                                      }}
                                      className="min-h-11 rounded-cloth border-[1.5px] border-rule-strong bg-surface px-2 font-bold text-sm"
                                    />
                                    <span aria-hidden="true">–</span>
                                    <input
                                      type="time"
                                      step="900"
                                      aria-label={`${dayLabel} ${t("profileEdit.routine.end")}`}
                                      value={formatTime(first.end)}
                                      onChange={(e) => {
                                        const endClock = parseTimeInput(
                                          e.target.value,
                                          first.end % 1440,
                                        );
                                        const nextInterval = intervalFromClocks(
                                          first.start,
                                          endClock,
                                        );
                                        replaceRoutine(index, {
                                          ...routine,
                                          cycle: routine.cycle.map(
                                            (entry, idx) =>
                                              idx === stepIndex
                                                ? {
                                                    ...entry,
                                                    intervals: [nextInterval],
                                                  }
                                                : entry,
                                          ),
                                        });
                                      }}
                                      className="min-h-11 rounded-cloth border-[1.5px] border-rule-strong bg-surface px-2 font-bold text-sm"
                                    />
                                    {first.end > 1440 ? (
                                      <span className="font-bold text-mute text-xs">
                                        {t("profileEdit.routine.nextDay")}
                                      </span>
                                    ) : null}
                                  </div>
                                ) : null}

                                {routine.cycle.length > 1 ? (
                                  <button
                                    type="button"
                                    aria-label={`${t("profileEdit.routine.cycle.removeStep")} ${stepIndex + 1}`}
                                    onClick={() =>
                                      replaceRoutine(index, {
                                        ...routine,
                                        cycle: routine.cycle.filter(
                                          (_, idx) => idx !== stepIndex,
                                        ),
                                      })
                                    }
                                    className="ml-auto min-h-11 rounded-cloth border border-rule-strong px-2 font-bold text-xs hover:bg-panel"
                                  >
                                    {t("profileEdit.routine.cycle.removeStep")}
                                  </button>
                                ) : null}
                              </li>
                            );
                          })}
                        </ul>

                        <button
                          type="button"
                          onClick={() =>
                            replaceRoutine(index, {
                              ...routine,
                              cycle: [
                                ...routine.cycle,
                                {
                                  stepId: `${routine.uiId}_step_${nextIdCounter.current++}`,
                                  intervals: [],
                                },
                              ],
                            })
                          }
                          className={`${buttonClasses.secondary} w-full text-sm`}
                        >
                          {t("profileEdit.routine.cycle.addStep")}
                        </button>
                      </div>
                    ) : (
                      <div className="mt-3 space-y-3">
                        <fieldset>
                          <legend className={legend}>
                            {t("profileEdit.routine.weekdays")}
                          </legend>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {WEEKDAYS_MON_FIRST.map((weekday) => {
                              const on = routine.weekdays.includes(weekday);
                              return (
                                <Chip
                                  key={weekday}
                                  selected={on}
                                  onClick={() => {
                                    const nextWeekdays = on
                                      ? routine.weekdays.filter(
                                          (d) => d !== weekday,
                                        )
                                      : [...routine.weekdays, weekday];
                                    const nextDayBlocks = {
                                      ...routine.dayBlocks,
                                    };
                                    if (
                                      !on &&
                                      (!nextDayBlocks[weekday] ||
                                        nextDayBlocks[weekday].length === 0)
                                    ) {
                                      nextDayBlocks[weekday] = [
                                        {
                                          blockId: `${routine.uiId}_b_${weekday}_${nextIdCounter.current++}`,
                                          start: routine.uniformStart,
                                          end: routine.uniformEnd,
                                        },
                                      ];
                                    }
                                    replaceRoutine(index, {
                                      ...routine,
                                      weekdays: nextWeekdays,
                                      dayBlocks: nextDayBlocks,
                                    });
                                  }}
                                >
                                  {t(`weekday.short.${weekday}` as MessageKey)}
                                </Chip>
                              );
                            })}
                          </div>
                        </fieldset>

                        {!routine.perDay ? (
                          <div className="flex flex-wrap items-end gap-3">
                            <div>
                              <label
                                htmlFor={`${routine.uiId}-start`}
                                className={legend}
                              >
                                {t("profileEdit.routine.start")}
                              </label>
                              <input
                                id={`${routine.uiId}-start`}
                                type="time"
                                step="900"
                                value={formatTime(routine.uniformStart)}
                                onChange={(e) => {
                                  const startClock = parseTimeInput(
                                    e.target.value,
                                    routine.uniformStart,
                                  );
                                  const next = intervalFromClocks(
                                    startClock,
                                    routine.uniformEnd % 1440,
                                  );
                                  replaceRoutine(index, {
                                    ...routine,
                                    uniformStart: next.start,
                                    uniformEnd: next.end,
                                  });
                                }}
                                className="mt-1 block min-h-11 rounded-cloth border-[1.5px] border-rule-strong bg-surface px-2.5 font-bold"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor={`${routine.uiId}-end`}
                                className={legend}
                              >
                                {t("profileEdit.routine.end")}
                              </label>
                              <div className="mt-1 flex items-center gap-1.5">
                                <input
                                  id={`${routine.uiId}-end`}
                                  type="time"
                                  step="900"
                                  value={formatTime(routine.uniformEnd)}
                                  onChange={(e) => {
                                    const endClock = parseTimeInput(
                                      e.target.value,
                                      routine.uniformEnd % 1440,
                                    );
                                    const next = intervalFromClocks(
                                      routine.uniformStart,
                                      endClock,
                                    );
                                    replaceRoutine(index, {
                                      ...routine,
                                      uniformStart: next.start,
                                      uniformEnd: next.end,
                                    });
                                  }}
                                  className="min-h-11 rounded-cloth border-[1.5px] border-rule-strong bg-surface px-2.5 font-bold"
                                />
                                {routine.uniformEnd > 1440 ? (
                                  <span className="font-bold text-mute text-xs">
                                    {t("profileEdit.routine.nextDay")}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <ul className="divide-y divide-rule border-rule border-y">
                            {WEEKDAYS_MON_FIRST.filter((weekday) =>
                              routine.weekdays.includes(weekday),
                            ).map((weekday) => {
                              const blocks = routine.dayBlocks[weekday] ?? [
                                {
                                  blockId: `${routine.uiId}_b_${weekday}_0`,
                                  start: routine.uniformStart,
                                  end: routine.uniformEnd,
                                },
                              ];
                              const dayLabel = t(
                                `weekday.short.${weekday}` as MessageKey,
                              );
                              return (
                                <li key={weekday} className="py-2">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-extrabold text-sm">
                                      {dayLabel}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        replaceRoutine(index, {
                                          ...routine,
                                          dayBlocks: {
                                            ...routine.dayBlocks,
                                            [weekday]: [
                                              ...blocks,
                                              {
                                                blockId: `${routine.uiId}_b_${weekday}_${nextIdCounter.current++}`,
                                                start: h(14),
                                                end: h(18),
                                              },
                                            ],
                                          },
                                        })
                                      }
                                      className="min-h-11 rounded-cloth border border-rule-strong px-2 font-bold text-xs hover:bg-panel"
                                    >
                                      {t("profileEdit.routine.addBlock")}
                                    </button>
                                  </div>
                                  <div className="mt-1.5 space-y-1.5">
                                    {blocks.map((block, bIdx) => (
                                      <div
                                        key={block.blockId}
                                        className="flex flex-wrap items-center gap-1.5"
                                      >
                                        <input
                                          type="time"
                                          step="900"
                                          aria-label={`${dayLabel} ${t("profileEdit.routine.start")} ${bIdx + 1}`}
                                          value={formatTime(block.start)}
                                          onChange={(e) => {
                                            const startClock = parseTimeInput(
                                              e.target.value,
                                              block.start,
                                            );
                                            const next = intervalFromClocks(
                                              startClock,
                                              block.end % 1440,
                                            );
                                            replaceRoutine(index, {
                                              ...routine,
                                              dayBlocks: {
                                                ...routine.dayBlocks,
                                                [weekday]: blocks.map(
                                                  (item, i) =>
                                                    i === bIdx
                                                      ? {
                                                          ...item,
                                                          ...next,
                                                        }
                                                      : item,
                                                ),
                                              },
                                            });
                                          }}
                                          className="min-h-11 rounded-cloth border-[1.5px] border-rule-strong bg-surface px-2 font-bold text-sm"
                                        />
                                        <span aria-hidden="true">–</span>
                                        <input
                                          type="time"
                                          step="900"
                                          aria-label={`${dayLabel} ${t("profileEdit.routine.end")} ${bIdx + 1}`}
                                          value={formatTime(block.end)}
                                          onChange={(e) => {
                                            const endClock = parseTimeInput(
                                              e.target.value,
                                              block.end % 1440,
                                            );
                                            const next = intervalFromClocks(
                                              block.start,
                                              endClock,
                                            );
                                            replaceRoutine(index, {
                                              ...routine,
                                              dayBlocks: {
                                                ...routine.dayBlocks,
                                                [weekday]: blocks.map(
                                                  (item, i) =>
                                                    i === bIdx
                                                      ? {
                                                          ...item,
                                                          ...next,
                                                        }
                                                      : item,
                                                ),
                                              },
                                            });
                                          }}
                                          className="min-h-11 rounded-cloth border-[1.5px] border-rule-strong bg-surface px-2 font-bold text-sm"
                                        />
                                        {block.end > 1440 ? (
                                          <span className="font-bold text-mute text-xs">
                                            {t("profileEdit.routine.nextDay")}
                                          </span>
                                        ) : null}
                                        {blocks.length > 1 ? (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              replaceRoutine(index, {
                                                ...routine,
                                                dayBlocks: {
                                                  ...routine.dayBlocks,
                                                  [weekday]: blocks.filter(
                                                    (_, i) => i !== bIdx,
                                                  ),
                                                },
                                              })
                                            }
                                            className="min-h-11 rounded-cloth border border-rule-strong px-2 font-bold text-xs hover:bg-panel"
                                          >
                                            {t(
                                              "profileEdit.routine.removeBlock",
                                            )}
                                          </button>
                                        ) : null}
                                      </div>
                                    ))}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (!routine.perDay) {
                              const synced: Record<
                                number,
                                readonly DayBlockItem[]
                              > = {};
                              for (const weekday of routine.weekdays) {
                                synced[weekday] = routine.dayBlocks[
                                  weekday
                                ] ?? [
                                  {
                                    blockId: `${routine.uiId}_b_${weekday}_${nextIdCounter.current++}`,
                                    start: routine.uniformStart,
                                    end: routine.uniformEnd,
                                  },
                                ];
                              }
                              replaceRoutine(index, {
                                ...routine,
                                perDay: true,
                                dayBlocks: synced,
                              });
                            } else {
                              replaceRoutine(index, {
                                ...routine,
                                perDay: false,
                              });
                            }
                          }}
                          className="min-h-11 font-bold text-indigo text-sm underline"
                        >
                          {routine.perDay
                            ? t("profileEdit.routine.sameHoursToggle")
                            : t("profileEdit.routine.perDayToggle")}
                        </button>
                      </div>
                    )}

                    <p className="mt-3 rounded-cloth bg-panel px-2.5 py-2 font-bold text-sm">
                      {describeRoutine(previewTemplate)}
                    </p>
                  </article>
                );
              })}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addWeeklyRoutine}
              className={buttonClasses.secondary}
            >
              {t("profileEdit.routine.addWeekly")}
            </button>
            <button
              type="button"
              onClick={addCycleRoutine}
              className={buttonClasses.secondary}
            >
              {t("profileEdit.routine.addCycle")}
            </button>
          </div>

          <div className="mt-5">
            <label htmlFor="profile-timezone" className={legend}>
              {t("profileEdit.timezone")}
            </label>
            <select
              id="profile-timezone"
              value={zone}
              aria-describedby="profile-timezone-hint"
              onChange={(e) => {
                markEdited();
                setZone(e.target.value);
                setStatus("idle");
              }}
              className="mt-1.5 block min-h-12 w-full rounded-cloth border-[1.5px] border-rule-strong bg-surface px-3"
            >
              {(TIMEZONES as readonly string[]).includes(zone) ? null : (
                <option value={zone}>{zone}</option>
              )}
              {TIMEZONES.map((option) => (
                <option key={option} value={option}>
                  {t(`timezone.${option}` as MessageKey)}
                </option>
              ))}
            </select>
            <p id="profile-timezone-hint" className="mt-1 text-mute text-sm">
              {t("profileEdit.timezone.hint")}
            </p>
          </div>
        </section>

        <section
          aria-labelledby="days-title"
          className="mt-5 lg:col-start-2 lg:row-span-2 lg:row-start-1"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 id="days-title" className={legend}>
                {t("profileEdit.days.title")}
              </h2>
              <p className="mt-0.5 text-mute text-sm">
                {t("profileEdit.days.hint")}
              </p>
            </div>
            <div className="flex gap-1.5">
              <Chip
                selected={granularity === "blocks"}
                onClick={() => selectGranularity("blocks")}
              >
                {t("profileEdit.days.mode.blocks")}
              </Chip>
              <Chip
                selected={granularity === "hours"}
                onClick={() => selectGranularity("hours")}
              >
                {t("profileEdit.days.mode.hours")}
              </Chip>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="mt-2 flex pb-1 text-caption text-mute"
          >
            <span className="w-[4.25rem] flex-none" />
            <span className="relative h-4 flex-1">
              {SEGMENTS.map((seg) => (
                <span
                  key={seg.key}
                  className="absolute top-0 text-center font-bold uppercase tracking-[0.06em]"
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
          <ul className="border-rule border-t">
            {days.map((day) => {
              const busy = availability[day.date]?.busy ?? [];
              return (
                <li key={day.date} className="border-rule border-b py-1.5">
                  <div className="flex items-center">
                    <span className="w-[4.25rem] flex-none font-extrabold text-[0.9375rem]">
                      {day.label}
                    </span>
                    <span className="relative h-11 flex-1">
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 top-1/2 -mt-[3px] h-1.5 rounded-full"
                        style={{ background: lineColor }}
                      />
                      {busy
                        .filter(
                          (i) => i.end > TRACK.start && i.start < TRACK.end,
                        )
                        .map((i) => {
                          const left = pct(Math.max(i.start, TRACK.start));
                          const right = pct(Math.min(i.end, TRACK.end));
                          return (
                            <span
                              key={i.start}
                              aria-hidden="true"
                              className="hatch-busy absolute top-1/2 -mt-2 h-4 rounded-[3px]"
                              style={{
                                left: `${left}%`,
                                width: `${right - left}%`,
                              }}
                            />
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
                                onClick={() => tap(day.date, seg.key)}
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
                                setDayIntervals(
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
                                setDayIntervals(
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
                                setDayIntervals(
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
                          const start = Math.min(
                            h(22),
                            Math.max(h(8), lastEnd),
                          );
                          const end = Math.min(h(24), start + 60);
                          setDayIntervals(day.date, [...busy, { start, end }]);
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
        </section>

        <div className="lg:col-start-1 lg:row-start-2">{children}</div>
      </div>

      <div
        className={`${shellClasses.footer} z-10 mt-4 lg:-mx-8 lg:flex lg:items-center lg:justify-end lg:gap-4 lg:px-8`}
      >
        <p
          className="mb-2 text-center font-bold text-sm lg:mb-0"
          aria-live="polite"
        >
          {status === "saved"
            ? t("profileEdit.saved")
            : status === "error"
              ? t("profileEdit.error")
              : "\u00a0"}
        </p>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className={`${buttonClasses.primary} lg:w-80`}
        >
          {t("profileEdit.save")}
        </button>
      </div>
    </>
  );
}
