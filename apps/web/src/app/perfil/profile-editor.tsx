"use client";

import {
  addDays,
  availabilityFor,
  type BusyTemplate,
  type Interval,
  type LocalDate,
  mergeIntervals,
  type Profile,
  setDay,
  shiftCycle,
  subtractIntervals,
  workweek,
} from "@amigo/core";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { type MessageKey, t } from "@/i18n/t";
import { formatTime } from "@/lib/format";
import { buttonClasses } from "@/lib/ui";
import type { ProfileInput } from "@/server/group-actions";

const h = (hours: number) => hours * 60;
const SEGMENTS = [
  { key: "morning", start: h(8), end: h(13) },
  { key: "afternoon", start: h(13), end: h(19) },
  { key: "evening", start: h(19), end: h(24) },
] as const;
type SegmentKey = (typeof SEGMENTS)[number]["key"];
const TRACK = { start: h(8), end: h(24) };
const CLASS_WEEKDAYS = [1, 2, 3, 4, 5, 6] as const;
const SHIFT_TODAY = ["day", "night", "off1", "off2"] as const;
const WORK_STARTS = [h(7), h(8), h(9), h(10)];
const WORK_ENDS = [h(16), h(17), h(18), h(19), h(20)];
const legend = "font-extrabold text-xs uppercase tracking-[0.06em]";

interface Routines {
  readonly workweek: { on: boolean; start: number; end: number };
  readonly shifts: { on: boolean; todayIndex: number };
  readonly classes: { on: boolean; marks: Record<number, SegmentKey[]> };
}

const segmentOf = (key: SegmentKey): Interval => {
  const s = SEGMENTS.find((x) => x.key === key) ?? SEGMENTS[0];
  return { start: s.start, end: s.end };
};

const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

/** Reads the profile's templates back into the editor's routine controls. */
function routinesFrom(
  templates: readonly BusyTemplate[],
  today: LocalDate,
): Routines {
  const routines: Routines = {
    workweek: { on: false, start: h(9), end: h(18) },
    shifts: { on: false, todayIndex: 0 },
    classes: { on: false, marks: {} },
  };
  let result = routines;
  for (const template of templates) {
    if (template.kind === "workweek") {
      const block = template.blocks[0];
      result = {
        ...result,
        workweek: {
          on: true,
          start: block?.start ?? h(9),
          end: block?.end ?? h(18),
        },
      };
    } else if (template.kind === "shifts") {
      const length = template.cycle.length || 4;
      const index =
        ((daysBetween(template.anchor, today) % length) + length) % length;
      result = { ...result, shifts: { on: true, todayIndex: index } };
    } else {
      const marks: Record<number, SegmentKey[]> = {};
      for (const block of template.blocks) {
        const seg = SEGMENTS.find(
          (s) => s.start === block.start && s.end === block.end,
        );
        if (seg)
          marks[block.weekday] = [...(marks[block.weekday] ?? []), seg.key];
      }
      result = { ...result, classes: { on: true, marks } };
    }
  }
  return result;
}

function templatesFrom(routines: Routines, today: LocalDate): BusyTemplate[] {
  const templates: BusyTemplate[] = [];
  if (routines.workweek.on) {
    templates.push(
      workweek({ start: routines.workweek.start, end: routines.workweek.end }),
    );
  }
  if (routines.shifts.on) {
    templates.push(
      shiftCycle({
        anchor: addDays(today, -routines.shifts.todayIndex),
        pattern: ["day", "night", "off", "off"],
      }),
    );
  }
  if (routines.classes.on) {
    const blocks = Object.entries(routines.classes.marks).flatMap(
      ([weekday, keys]) =>
        keys.map((key) => ({ weekday: Number(weekday), ...segmentOf(key) })),
    );
    if (blocks.length > 0) templates.push({ kind: "classes", blocks });
  }
  return templates;
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
      className={`min-h-11 rounded-sign border-[1.5px] px-3 font-bold text-[0.9375rem] ${
        selected
          ? "border-ink bg-ink text-white"
          : "border-rule-strong bg-white text-ink"
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
  const [routines, setRoutines] = useState(() =>
    routinesFrom(profile.templates, today),
  );
  const [dayState, setDayState] = useState(profile);
  const [changed, setChanged] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [pending, startTransition] = useTransition();

  const templates = useMemo(
    () => templatesFrom(routines, today),
    [routines, today],
  );
  const from = days[0]?.date ?? today;
  const to = days.at(-1)?.date ?? today;
  const availability = useMemo(
    () => availabilityFor({ ...dayState, templates }, from, to, timeZone),
    [dayState, templates, from, to, timeZone],
  );
  const noRoutine =
    !routines.workweek.on && !routines.shifts.on && !routines.classes.on;

  function update(next: Routines) {
    setRoutines(next);
    setStatus("idle");
  }

  function tap(date: LocalDate, key: SegmentKey) {
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

  function submit() {
    startTransition(async () => {
      const result = await save({
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

  return (
    <>
      <section aria-labelledby="routines-title" className="mt-4">
        <h2 id="routines-title" className={legend}>
          {t("profileEdit.routines")}
        </h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Chip
            selected={noRoutine}
            onClick={() =>
              update({
                workweek: { ...routines.workweek, on: false },
                shifts: { ...routines.shifts, on: false },
                classes: { ...routines.classes, on: false },
              })
            }
          >
            {t("answer.profile.none")}
          </Chip>
          <Chip
            selected={routines.workweek.on}
            onClick={() =>
              update({
                ...routines,
                workweek: { ...routines.workweek, on: !routines.workweek.on },
              })
            }
          >
            {t("answer.profile.workweek")}
          </Chip>
          <Chip
            selected={routines.shifts.on}
            onClick={() =>
              update({
                ...routines,
                shifts: { ...routines.shifts, on: !routines.shifts.on },
              })
            }
          >
            {t("answer.profile.shifts")}
          </Chip>
          <Chip
            selected={routines.classes.on}
            onClick={() =>
              update({
                ...routines,
                classes: { ...routines.classes, on: !routines.classes.on },
              })
            }
          >
            {t("answer.profile.classes")}
          </Chip>
        </div>

        {routines.workweek.on ? (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="font-bold">{t("answer.workweek.hours")}</span>
            {(["start", "end"] as const).map((field) => (
              <select
                key={field}
                aria-label={`${t("answer.workweek.hours")} ${field === "start" ? "1" : "2"}`}
                value={routines.workweek[field]}
                onChange={(e) =>
                  update({
                    ...routines,
                    workweek: {
                      ...routines.workweek,
                      [field]: Number(e.target.value),
                    },
                  })
                }
                className="min-h-11 rounded-sign border-[1.5px] border-rule-strong bg-white px-2"
              >
                {(field === "start" ? WORK_STARTS : WORK_ENDS).map((m) => (
                  <option key={m} value={m}>
                    {formatTime(m)}
                  </option>
                ))}
              </select>
            ))}
          </div>
        ) : null}

        {routines.shifts.on ? (
          <div className="mt-3">
            <p className="text-mute text-sm">{t("answer.shifts.pattern")}</p>
            <p className="mt-2 font-bold text-sm">{t("answer.shifts.today")}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {SHIFT_TODAY.map((key, index) => (
                <Chip
                  key={key}
                  selected={routines.shifts.todayIndex === index}
                  onClick={() =>
                    update({
                      ...routines,
                      shifts: { on: true, todayIndex: index },
                    })
                  }
                >
                  {t(`answer.shifts.${key}` as MessageKey)}
                </Chip>
              ))}
            </div>
          </div>
        ) : null}

        {routines.classes.on ? (
          <div className="mt-3">
            <p className="text-mute text-sm">{t("answer.classes.hint")}</p>
            <ul className="mt-2 border-rule border-t">
              {CLASS_WEEKDAYS.map((weekday) => {
                const marks = routines.classes.marks[weekday] ?? [];
                const label = t(`weekday.short.${weekday}` as MessageKey);
                return (
                  <li
                    key={weekday}
                    className="flex items-center border-rule border-b py-1"
                  >
                    <span className="w-[4.25rem] flex-none font-extrabold text-sm">
                      {label}
                    </span>
                    <span className="relative h-11 flex-1">
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 top-1/2 h-px bg-rule-strong"
                      />
                      {SEGMENTS.map((seg, index) => {
                        const on = marks.includes(seg.key);
                        const style = {
                          left: `${pct(seg.start)}%`,
                          width: `${pct(seg.end) - pct(seg.start)}%`,
                        };
                        return (
                          <span key={seg.key}>
                            {on ? (
                              <span
                                aria-hidden="true"
                                className="hatch-busy absolute top-1/2 -mt-2 h-4 rounded-[3px]"
                                style={style}
                              />
                            ) : null}
                            <button
                              type="button"
                              aria-pressed={on}
                              aria-label={`${label}, ${t(`answer.segment.${seg.key}` as MessageKey)}`}
                              onClick={() =>
                                update({
                                  ...routines,
                                  classes: {
                                    on: true,
                                    marks: {
                                      ...routines.classes.marks,
                                      [weekday]: on
                                        ? marks.filter((k) => k !== seg.key)
                                        : [...marks, seg.key],
                                    },
                                  },
                                })
                              }
                              className={`absolute inset-y-0 active:bg-ink/[0.06] ${
                                index > 0
                                  ? "border-rule border-l border-dashed"
                                  : ""
                              }`}
                              style={style}
                            />
                          </span>
                        );
                      })}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </section>

      <section aria-labelledby="days-title" className="mt-5">
        <h2 id="days-title" className={legend}>
          {t("profileEdit.days.title")}
        </h2>
        <p className="mt-0.5 text-mute text-sm">{t("profileEdit.days.hint")}</p>
        <div
          aria-hidden="true"
          className="mt-2 flex pb-1 text-[0.6875rem] text-mute"
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
              <li
                key={day.date}
                className="flex items-center border-rule border-b py-1"
              >
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
                    .filter((i) => i.end > TRACK.start && i.start < TRACK.end)
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
                  {SEGMENTS.map((seg, index) => {
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
                          segment: t(`answer.segment.${seg.key}` as MessageKey),
                          from: formatTime(seg.start),
                          to: formatTime(seg.end),
                          state: t(
                            `answer.segment.state.${state}` as MessageKey,
                          ),
                        })}
                        className={`absolute inset-y-0 active:bg-ink/[0.06] ${
                          index > 0 ? "border-rule border-l border-dashed" : ""
                        }`}
                        style={{
                          left: `${pct(seg.start)}%`,
                          width: `${pct(seg.end) - pct(seg.start)}%`,
                        }}
                      />
                    );
                  })}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {children}

      <div className="sticky bottom-0 z-10 -mx-4 mt-4 border-rule border-t bg-white px-4 pt-2.5 pb-[max(1.125rem,env(safe-area-inset-bottom))]">
        <p className="mb-2 text-center font-bold text-sm" aria-live="polite">
          {status === "saved"
            ? t("profileEdit.saved")
            : status === "error"
              ? t("profileEdit.error")
              : " "}
        </p>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className={buttonClasses.primary}
        >
          {t("profileEdit.save")}
        </button>
      </div>
    </>
  );
}
