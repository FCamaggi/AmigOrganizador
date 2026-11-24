"use client";

import {
  availabilityFor,
  expandBusyTemplates,
  type Interval,
  type LocalDate,
  mergeIntervals,
  type Profile,
  scheduleId,
  setDay,
  subtractIntervals,
} from "@amigo/core";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { WeekCloth } from "@/components/week-cloth";
import { type MessageKey, t } from "@/i18n/t";
import { TIMEZONES } from "@/lib/plan-options";
import { summarizeRoutine } from "@/lib/routine-sentence";
import { buttonClasses, shellClasses } from "@/lib/ui";
import type { ProfileInput } from "@/server/group-actions";
import {
  type DayGranularity,
  DaysSheet,
  overlap,
  type SegmentKey,
  segmentOf,
  TRACK,
} from "./days-sheet";
import {
  buildPresetRoutine,
  type EditableRoutine,
  editableFromTemplates,
  type RoutinePresetType,
  RoutineSheet,
  templateFromEditable,
} from "./routine-sheet";
import { Sheet } from "./sheet";

type ActiveSheet =
  | null
  | { readonly kind: "editRoutine"; readonly index: number }
  | {
      readonly kind: "newRoutine";
      readonly preset: RoutinePresetType;
      readonly draft: EditableRoutine;
    }
  | { readonly kind: "days"; readonly focusedDate: LocalDate | null }
  | { readonly kind: "import" };

const EMPTY_ROUTINE_CHIPS: readonly ("workweek" | "classes" | "shifts")[] = [
  "workweek",
  "classes",
  "shifts",
];

function ChevronRight() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="size-4 flex-none text-mute"
    >
      <path
        d="M6 3l5 5-5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface ProfileEditorProps {
  readonly profile: Profile;
  readonly hasSavedProfile: boolean;
  readonly today: LocalDate;
  readonly timeZone: string;
  readonly days: readonly { date: LocalDate; label: string }[];
  readonly lineColor: string;
  readonly next: string | null;
  readonly save: (input: ProfileInput) => Promise<{ ok: boolean }>;
  /** Rendered inside the calendar import sheet. */
  readonly children?: React.ReactNode;
}

export function ProfileEditor({
  profile,
  hasSavedProfile,
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
  const [acknowledgedEmpty, setAcknowledgedEmpty] = useState(false);
  const [dayState, setDayState] = useState(profile);
  const [zone, setZone] = useState(timeZone);
  const [changed, setChanged] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [granularity, setGranularity] = useState<DayGranularity>("blocks");
  const [weekIndex, setWeekIndex] = useState(0);
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
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

  const adjustedDates = useMemo(() => {
    const set = new Set<string>();
    for (const [date, list] of Object.entries(dayState.busyDays)) {
      if (list.length > 0) set.add(date);
    }
    for (const [date, list] of Object.entries(dayState.exceptions)) {
      if (list.length > 0) set.add(date);
    }
    return set;
  }, [dayState.busyDays, dayState.exceptions]);

  const puntualesCount = adjustedDates.size;
  const isUnknown =
    !hasSavedProfile &&
    !acknowledgedEmpty &&
    templates.length === 0 &&
    changed.size === 0 &&
    puntualesCount === 0 &&
    profile.importedCalendars.length === 0;

  const weekCount = Math.max(1, Math.ceil(days.length / 7));
  const clampedWeek = Math.min(weekIndex, weekCount - 1);
  const weekDays = days.slice(clampedWeek * 7, clampedWeek * 7 + 7);

  function updateRoutines(nextList: EditableRoutine[]) {
    markEdited();
    setRoutines(nextList);
    setAcknowledgedEmpty(false);
    setStatus("idle");
  }

  function addPresetFromEmpty(preset: "workweek" | "classes" | "shifts") {
    const id = `routine_${nextIdCounter.current++}`;
    const created = buildPresetRoutine(preset, id, today);
    const nextIndex = routines.length;
    updateRoutines([...routines, created]);
    setActiveSheet({ kind: "editRoutine", index: nextIndex });
  }

  function openNewRoutineSheet() {
    const id = `routine_${nextIdCounter.current++}`;
    const draft = buildPresetRoutine("workweek", id, today);
    setActiveSheet({ kind: "newRoutine", preset: "workweek", draft });
  }

  function replaceRoutine(index: number, updated: EditableRoutine) {
    updateRoutines(routines.map((r, i) => (i === index ? updated : r)));
  }

  function removeRoutine(index: number) {
    updateRoutines(routines.filter((_, i) => i !== index));
    setActiveSheet(null);
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

  const editingRoutine =
    activeSheet?.kind === "editRoutine"
      ? (routines[activeSheet.index] ?? null)
      : activeSheet?.kind === "newRoutine"
        ? activeSheet.draft
        : null;

  const emptyQuestion = (
    <div className="mt-2.5 rounded-cloth border border-rule bg-surface p-4">
      <p className="font-extrabold text-base text-ink">
        {t("profileEdit.routine.question")}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {EMPTY_ROUTINE_CHIPS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => addPresetFromEmpty(preset)}
            className="min-h-12 rounded-cloth border-[1.5px] border-rule-strong bg-surface px-4 font-bold text-[0.9375rem] text-ink hover:bg-panel"
          >
            {t(`profileEdit.routine.chip.${preset}` as MessageKey)}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={acknowledgedEmpty}
          onClick={() => {
            markEdited();
            setAcknowledgedEmpty(true);
            setStatus("idle");
          }}
          className={`min-h-12 rounded-cloth border-[1.5px] px-4 font-bold text-[0.9375rem] ${
            acknowledgedEmpty
              ? "border-ink bg-ink text-surface"
              : "border-rule-strong bg-surface text-ink hover:bg-panel"
          }`}
        >
          {t("profileEdit.routine.chip.none")}
        </button>
      </div>
      {acknowledgedEmpty ? (
        <p className="mt-3 rounded-cloth bg-panel px-3 py-2.5 text-ink text-sm">
          {t("profileEdit.routine.noneNote")}
        </p>
      ) : null}
    </div>
  );

  // Phone: woven week first, then routines and secondary rows; an empty
  // profile puts its routines column (with "¿Qué ocupa tu semana?") above the
  // week, because an all-dotted week says nothing yet. The save footer sits
  // outside both columns so it stays pinned on any screen. Desktop (lg+): woven week on the left,
  // routines and rows on the right.
  return (
    <>
      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
        <div className="min-w-0 lg:sticky lg:top-6">
          <WeekCloth
            days={weekDays}
            weekIndex={clampedWeek}
            weekCount={weekCount}
            onWeekChange={setWeekIndex}
            availability={availability}
            unknown={isUnknown}
            lineColor={lineColor}
            span={TRACK}
            adjustedDates={adjustedDates}
            onSelectDay={(date) =>
              setActiveSheet({ kind: "days", focusedDate: date })
            }
          />
        </div>

        <div
          className={`min-w-0 space-y-5 ${
            routines.length === 0 ? "max-lg:order-first" : ""
          }`}
        >
          <section aria-labelledby="routines-title">
            <h2 id="routines-title" className="font-extrabold text-lg">
              {t("profileEdit.routines")}
            </h2>

            {routines.length === 0 ? (
              emptyQuestion
            ) : (
              <>
                <ul className="mt-2.5 divide-y divide-rule rounded-cloth border border-rule bg-surface">
                  {routines.map((routine, index) => {
                    const summary = summarizeRoutine(
                      templateFromEditable(routine),
                    );
                    return (
                      <li key={routine.uiId}>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveSheet({ kind: "editRoutine", index })
                          }
                          className="flex min-h-12 w-full items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-panel"
                        >
                          <span
                            aria-hidden="true"
                            className="yarn h-2 w-4 flex-none rounded-full"
                            style={{ backgroundColor: lineColor }}
                          />
                          <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <span className="font-extrabold text-[0.9375rem] text-ink">
                              {routine.label.trim() ||
                                t(
                                  `profileEdit.routine.defaultLabel.${routine.kind}` as MessageKey,
                                )}
                            </span>
                            <span className="truncate text-mute text-sm">
                              {summary}
                            </span>
                          </span>
                          <ChevronRight />
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <button
                  type="button"
                  onClick={openNewRoutineSheet}
                  className={`${buttonClasses.secondary} mt-2.5 w-full`}
                >
                  + {t("profileEdit.routine.add")}
                </button>
              </>
            )}
          </section>

          <div className="divide-y divide-rule rounded-cloth border border-rule bg-surface">
            <button
              type="button"
              onClick={() =>
                setActiveSheet({ kind: "days", focusedDate: null })
              }
              className="flex min-h-12 w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left hover:bg-panel"
            >
              <span className="font-bold text-[0.9375rem] text-ink">
                {puntualesCount > 0
                  ? t("profileEdit.oneOff.rowCount", { count: puntualesCount })
                  : t("profileEdit.oneOff.row")}
              </span>
              <ChevronRight />
            </button>

            <button
              type="button"
              onClick={() => setActiveSheet({ kind: "import" })}
              className="flex min-h-12 w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left hover:bg-panel"
            >
              <span className="font-bold text-[0.9375rem] text-ink">
                {profile.importedCalendars.length > 0
                  ? t("profileEdit.import.rowCount", {
                      count: profile.importedCalendars.length,
                    })
                  : t("profileEdit.import.row")}
              </span>
              <ChevronRight />
            </button>

            <div className="px-3.5 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="profile-timezone"
                  className="font-bold text-[0.9375rem] text-ink"
                >
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
                  className="min-h-11 max-w-full rounded-cloth border-[1.5px] border-rule-strong bg-surface px-3 font-bold text-sm"
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
              </div>
              <p id="profile-timezone-hint" className="mt-1 text-mute text-xs">
                {t("profileEdit.timezone.hint")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className={`${shellClasses.footer} z-10 mt-6 lg:-mx-8 lg:px-8`}>
        <p
          className="mb-2 text-center font-bold text-sm lg:text-left"
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
          className={buttonClasses.primary}
        >
          {t("profileEdit.save")}
        </button>
      </footer>

      <RoutineSheet
        open={
          activeSheet?.kind === "editRoutine" ||
          activeSheet?.kind === "newRoutine"
        }
        mode={activeSheet?.kind === "newRoutine" ? "new" : "edit"}
        routine={editingRoutine}
        presetChoice={
          activeSheet?.kind === "newRoutine" ? activeSheet.preset : "workweek"
        }
        onSelectPreset={(preset) => {
          if (activeSheet?.kind !== "newRoutine") return;
          setActiveSheet({
            kind: "newRoutine",
            preset,
            draft: buildPresetRoutine(preset, activeSheet.draft.uiId, today),
          });
        }}
        onChange={(updated) => {
          if (activeSheet?.kind === "editRoutine") {
            replaceRoutine(activeSheet.index, updated);
          } else if (activeSheet?.kind === "newRoutine") {
            setActiveSheet({ ...activeSheet, draft: updated });
          }
        }}
        onDone={() => {
          if (activeSheet?.kind === "newRoutine") {
            updateRoutines([...routines, activeSheet.draft]);
          }
          setActiveSheet(null);
        }}
        onRemove={
          activeSheet?.kind === "editRoutine"
            ? () => removeRoutine(activeSheet.index)
            : undefined
        }
        onCancel={() => setActiveSheet(null)}
        nextId={() => nextIdCounter.current++}
      />

      <DaysSheet
        open={activeSheet?.kind === "days"}
        focusedDate={
          activeSheet?.kind === "days" ? activeSheet.focusedDate : null
        }
        days={days}
        availability={availability}
        adjustedDates={adjustedDates}
        lineColor={lineColor}
        granularity={granularity}
        onSelectGranularity={selectGranularity}
        onTapSegment={tap}
        onSetDayIntervals={setDayIntervals}
        onClose={() => setActiveSheet(null)}
      />

      <Sheet
        open={activeSheet?.kind === "import"}
        title={t("profileEdit.import.title")}
        onClose={() => setActiveSheet(null)}
        footer={
          <button
            type="button"
            onClick={() => setActiveSheet(null)}
            className="flex min-h-11 flex-1 items-center justify-center rounded-cloth bg-ink px-4 font-extrabold text-[0.9375rem] text-surface hover:opacity-90"
          >
            {t("profileEdit.sheet.done")}
          </button>
        }
      >
        {children}
      </Sheet>
    </>
  );
}
