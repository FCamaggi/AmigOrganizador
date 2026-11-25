"use client";

import {
  type BusyTemplate,
  type Interval,
  type LocalDate,
  shiftCycle,
  type WeeklyBlock,
  workweek,
} from "@amigo/core";
import { type MessageKey, t } from "@/i18n/t";
import { formatTime } from "@/lib/format";
import { describeRoutine } from "@/lib/routine-sentence";
import { buttonClasses } from "@/lib/ui";
import { Sheet } from "./sheet";

export const h = (hours: number, mins = 0) => hours * 60 + mins;
export const WEEKDAYS_MON_FIRST = [1, 2, 3, 4, 5, 6, 0] as const;
const legend = "font-bold text-sm text-ink";

export type RoutinePresetType = "workweek" | "classes" | "shifts" | "other";

export interface CycleStep {
  readonly stepId: string;
  readonly intervals: readonly Interval[];
}

export interface DayBlockItem {
  readonly blockId: string;
  readonly start: number;
  readonly end: number;
}

export type EditableRoutine =
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

export function defaultLabelFor(kind: BusyTemplate["kind"]): string {
  return t(`profileEdit.routine.defaultLabel.${kind}` as MessageKey);
}

function cleanRoutineLabel(value: string, kind: BusyTemplate["kind"]): string {
  const trimmed = value.trim().slice(0, 40);
  return trimmed.length > 0 ? trimmed : defaultLabelFor(kind);
}

/** Converts HH:MM input string to minutes (0..1439), or fallback. */
export function parseTimeInput(value: string, fallback: number): number {
  const match = /^(\d{2}):(\d{2})/.exec(value);
  if (!match) return fallback;
  const hours = Number(match[1]);
  const mins = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(mins)) return fallback;
  return Math.max(0, Math.min(1439, hours * 60 + mins));
}

/** An end at or before the start means it ends the next day (end + 1440, max 2880). */
export function intervalFromClocks(
  startClock: number,
  endClock: number,
): Interval {
  const start = Math.max(0, Math.min(1439, startClock));
  const rawEnd = endClock <= start ? endClock + 1440 : endClock;
  const end = Math.min(2880, Math.max(start + 15, rawEnd));
  return { start, end };
}

export function editableFromTemplate(
  template: BusyTemplate,
  uiId: string,
): EditableRoutine {
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
}

export function editableFromTemplates(
  templates: readonly BusyTemplate[],
): EditableRoutine[] {
  return templates.map((template, index) =>
    editableFromTemplate(template, `routine_${index}`),
  );
}

export function templateFromEditable(routine: EditableRoutine): BusyTemplate {
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

/** Builds a prefilled routine from `@amigo/core` presets for the chosen type. */
export function buildPresetRoutine(
  preset: RoutinePresetType,
  uiId: string,
  today: LocalDate,
): EditableRoutine {
  if (preset === "shifts") {
    return editableFromTemplate(
      shiftCycle({
        anchor: today,
        pattern: ["day", "night", "off", "off"],
        label: defaultLabelFor("shifts"),
      }),
      uiId,
    );
  }
  if (preset === "classes") {
    const base = workweek({
      start: h(8, 30),
      end: h(13),
      label: defaultLabelFor("classes"),
    });
    if (base.kind !== "shifts") {
      return editableFromTemplate({ ...base, kind: "classes" }, uiId);
    }
  }
  if (preset === "other") {
    return editableFromTemplate(
      workweek({
        weekdays: [4],
        start: h(19),
        end: h(21),
        label: t("profileEdit.routine.defaultLabel.other"),
      }),
      uiId,
    );
  }
  return editableFromTemplate(
    workweek({ label: defaultLabelFor("workweek") }),
    uiId,
  );
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

export function ToggleChip({
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
          : "border-rule-strong bg-surface text-ink hover:bg-panel"
      }`}
    >
      {children}
    </button>
  );
}

const PRESETS: readonly RoutinePresetType[] = [
  "workweek",
  "classes",
  "shifts",
  "other",
];

interface RoutineSheetProps {
  readonly open: boolean;
  readonly mode: "new" | "edit";
  readonly routine: EditableRoutine | null;
  readonly presetChoice: RoutinePresetType;
  readonly onSelectPreset: (preset: RoutinePresetType) => void;
  readonly onChange: (updated: EditableRoutine) => void;
  readonly onDone: () => void;
  readonly onRemove?: () => void;
  readonly onCancel: () => void;
  readonly nextId: () => number;
}

export function RoutineSheet({
  open,
  mode,
  routine,
  presetChoice,
  onSelectPreset,
  onChange,
  onDone,
  onRemove,
  onCancel,
  nextId,
}: RoutineSheetProps) {
  const title =
    mode === "new"
      ? t("profileEdit.routine.sheetTitle.new")
      : t("profileEdit.routine.sheetTitle.edit");

  const previewTemplate = routine ? templateFromEditable(routine) : null;

  return (
    <Sheet
      open={open && routine !== null}
      title={title}
      onClose={mode === "new" ? onCancel : onDone}
      footer={
        <>
          {onRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className={`${buttonClasses.secondary} min-w-fit flex-none`}
            >
              {t("profileEdit.routine.remove")}
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className={`${buttonClasses.secondary} min-w-fit flex-none`}
            >
              {t("profileEdit.sheet.cancel")}
            </button>
          )}
          <button
            type="button"
            onClick={onDone}
            className={buttonClasses.confirm}
          >
            {t("profileEdit.sheet.done")}
          </button>
        </>
      }
    >
      {routine ? (
        <div className="space-y-4">
          {mode === "new" ? (
            <fieldset>
              <legend className={legend}>
                {t("profileEdit.routine.typeChoose")}
              </legend>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {PRESETS.map((preset) => (
                  <ToggleChip
                    key={preset}
                    selected={presetChoice === preset}
                    onClick={() => onSelectPreset(preset)}
                  >
                    {t(`profileEdit.routine.chip.${preset}` as MessageKey)}
                  </ToggleChip>
                ))}
              </div>
            </fieldset>
          ) : null}

          <div>
            <label htmlFor={`${routine.uiId}-label`} className={legend}>
              {t("profileEdit.routine.label")}
            </label>
            <input
              id={`${routine.uiId}-label`}
              type="text"
              value={routine.label}
              maxLength={40}
              placeholder={t("profileEdit.routine.labelPlaceholder")}
              onChange={(e) =>
                onChange({
                  ...routine,
                  label: e.target.value,
                })
              }
              className="mt-1 block min-h-11 w-full rounded-cloth border-[1.5px] border-rule-strong bg-surface px-3 font-extrabold"
            />
            <p className="mt-1 font-bold text-mute text-xs">
              {routine.kind === "shifts"
                ? t("profileEdit.routine.type.cycle")
                : t("profileEdit.routine.type.weekly")}
            </p>
          </div>

          {routine.kind === "shifts" ? (
            <div className="space-y-3">
              <div>
                <span className={legend}>
                  {t("profileEdit.routine.cycle.presets")}
                </span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {(["4x4", "7x7", "5x2", "4x3"] as const).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        onChange({
                          ...routine,
                          cycle: cyclePreset(
                            preset,
                            `${routine.uiId}_${nextId()}`,
                          ),
                        })
                      }
                      className="min-h-11 rounded-cloth border-[1.5px] border-rule-strong bg-surface px-2.5 font-bold text-xs hover:bg-panel"
                    >
                      {t(
                        `profileEdit.routine.cycle.preset.${preset}` as MessageKey,
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor={`${routine.uiId}-anchor`} className={legend}>
                  {t("profileEdit.routine.cycle.anchor")}
                </label>
                <input
                  id={`${routine.uiId}-anchor`}
                  type="date"
                  value={routine.anchor}
                  onChange={(e) => {
                    if (e.target.value) {
                      onChange({
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
                  const dayLabel = t("profileEdit.routine.cycle.day", {
                    index: stepIndex + 1,
                  });
                  return (
                    <li
                      key={step.stepId}
                      className="flex flex-wrap items-center gap-2 py-2"
                    >
                      <span className="w-16 flex-none font-extrabold text-sm">
                        {dayLabel}
                      </span>
                      <ToggleChip
                        selected={isBusy}
                        onClick={() => {
                          const nextCycle = routine.cycle.map((entry, idx) =>
                            idx === stepIndex
                              ? {
                                  ...entry,
                                  intervals: isBusy
                                    ? []
                                    : [{ start: h(8), end: h(20) }],
                                }
                              : entry,
                          );
                          onChange({
                            ...routine,
                            cycle: nextCycle,
                          });
                        }}
                      >
                        {isBusy
                          ? t("profileEdit.routine.cycle.busy")
                          : t("profileEdit.routine.cycle.free")}
                      </ToggleChip>

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
                              onChange({
                                ...routine,
                                cycle: routine.cycle.map((entry, idx) =>
                                  idx === stepIndex
                                    ? { ...entry, intervals: [nextInterval] }
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
                              onChange({
                                ...routine,
                                cycle: routine.cycle.map((entry, idx) =>
                                  idx === stepIndex
                                    ? { ...entry, intervals: [nextInterval] }
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
                            onChange({
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
                  onChange({
                    ...routine,
                    cycle: [
                      ...routine.cycle,
                      {
                        stepId: `${routine.uiId}_step_${nextId()}`,
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
            <div className="space-y-3">
              <fieldset>
                <legend className={legend}>
                  {t("profileEdit.routine.weekdays")}
                </legend>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {WEEKDAYS_MON_FIRST.map((weekday) => {
                    const on = routine.weekdays.includes(weekday);
                    return (
                      <ToggleChip
                        key={weekday}
                        selected={on}
                        onClick={() => {
                          const nextWeekdays = on
                            ? routine.weekdays.filter((d) => d !== weekday)
                            : [...routine.weekdays, weekday];
                          const nextDayBlocks = { ...routine.dayBlocks };
                          if (
                            !on &&
                            (!nextDayBlocks[weekday] ||
                              nextDayBlocks[weekday].length === 0)
                          ) {
                            nextDayBlocks[weekday] = [
                              {
                                blockId: `${routine.uiId}_b_${weekday}_${nextId()}`,
                                start: routine.uniformStart,
                                end: routine.uniformEnd,
                              },
                            ];
                          }
                          onChange({
                            ...routine,
                            weekdays: nextWeekdays,
                            dayBlocks: nextDayBlocks,
                          });
                        }}
                      >
                        {t(`weekday.short.${weekday}` as MessageKey)}
                      </ToggleChip>
                    );
                  })}
                </div>
              </fieldset>

              {!routine.perDay ? (
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label htmlFor={`${routine.uiId}-start`} className={legend}>
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
                        onChange({
                          ...routine,
                          uniformStart: next.start,
                          uniformEnd: next.end,
                        });
                      }}
                      className="mt-1 block min-h-11 rounded-cloth border-[1.5px] border-rule-strong bg-surface px-2.5 font-bold"
                    />
                  </div>
                  <div>
                    <label htmlFor={`${routine.uiId}-end`} className={legend}>
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
                          onChange({
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
                              onChange({
                                ...routine,
                                dayBlocks: {
                                  ...routine.dayBlocks,
                                  [weekday]: [
                                    ...blocks,
                                    {
                                      blockId: `${routine.uiId}_b_${weekday}_${nextId()}`,
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
                                  onChange({
                                    ...routine,
                                    dayBlocks: {
                                      ...routine.dayBlocks,
                                      [weekday]: blocks.map((item, i) =>
                                        i === bIdx
                                          ? { ...item, ...next }
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
                                  onChange({
                                    ...routine,
                                    dayBlocks: {
                                      ...routine.dayBlocks,
                                      [weekday]: blocks.map((item, i) =>
                                        i === bIdx
                                          ? { ...item, ...next }
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
                                    onChange({
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
                                  {t("profileEdit.routine.removeBlock")}
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
                    const synced: Record<number, readonly DayBlockItem[]> = {};
                    for (const weekday of routine.weekdays) {
                      synced[weekday] = routine.dayBlocks[weekday] ?? [
                        {
                          blockId: `${routine.uiId}_b_${weekday}_${nextId()}`,
                          start: routine.uniformStart,
                          end: routine.uniformEnd,
                        },
                      ];
                    }
                    onChange({
                      ...routine,
                      perDay: true,
                      dayBlocks: synced,
                    });
                  } else {
                    onChange({
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

          {previewTemplate ? (
            <p className="rounded-cloth bg-panel px-3 py-2.5 font-bold text-sm">
              {describeRoutine(previewTemplate)}
            </p>
          ) : null}
        </div>
      ) : null}
    </Sheet>
  );
}
