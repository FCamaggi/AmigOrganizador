"use client";

import {
  addDays,
  type BusyTemplate,
  buildAnswerDays,
  type Interval,
  type LocalDate,
  shiftCycle,
  workweek,
} from "@amigo/core";
import { useMemo, useState, useTransition } from "react";
import { type MessageKey, t } from "@/i18n/t";
import { formatTime } from "@/lib/format";
import { buttonClasses } from "@/lib/ui";
import type { AnswerInput } from "@/server/actions";

const h = (hours: number) => hours * 60;

/** The day as people think of it; the engine's useful hours sit inside. */
const SEGMENTS = [
  { key: "morning", start: h(8), end: h(13) },
  { key: "afternoon", start: h(13), end: h(19) },
  { key: "evening", start: h(19), end: h(24) },
] as const;
type SegmentKey = (typeof SEGMENTS)[number]["key"];
const TRACK = { start: h(8), end: h(24) };

type Profile = "none" | "workweek" | "shifts" | "classes";
const PROFILES: readonly Profile[] = ["none", "workweek", "shifts", "classes"];
const CLASS_WEEKDAYS = [1, 2, 3, 4, 5, 6] as const;
const SHIFT_TODAY = ["day", "night", "off1", "off2"] as const;
const WORK_STARTS = [h(7), h(8), h(9), h(10)];
const WORK_ENDS = [h(16), h(17), h(18), h(19), h(20)];

export interface EditorDay {
  readonly date: LocalDate;
  readonly label: string;
}

interface BusyEditorProps {
  readonly mode: "busy" | "free";
  readonly from: LocalDate;
  readonly to: LocalDate;
  readonly today: LocalDate;
  readonly days: readonly EditorDay[];
  /** Exact busy time from a previous answer, kept unless cleared. */
  readonly initialBusy: Readonly<Record<string, readonly Interval[]>>;
  /** Free time from a previous answer (free mode), as segment keys. */
  readonly initialFree: Readonly<Record<string, readonly SegmentKey[]>>;
  readonly lineColor: string;
  readonly save: (input: AnswerInput) => Promise<{ ok: false }>;
}

type Marks = Record<string, SegmentKey[]>;

const segmentInterval = (key: SegmentKey): Interval => {
  const s = SEGMENTS.find((x) => x.key === key) ?? SEGMENTS[0];
  return { start: s.start, end: s.end };
};

const toIntervals = (marks: Marks) =>
  Object.fromEntries(
    Object.entries(marks).map(([d, keys]) => [d, keys.map(segmentInterval)]),
  );

function toggle(
  marks: Marks,
  date: string,
  key: SegmentKey,
  on: boolean,
): Marks {
  const current = new Set(marks[date] ?? []);
  if (on) current.add(key);
  else current.delete(key);
  return { ...marks, [date]: [...current] };
}

function overlap(intervals: readonly Interval[], seg: Interval): number {
  return intervals.reduce(
    (sum, i) =>
      sum +
      Math.max(0, Math.min(i.end, seg.end) - Math.max(i.start, seg.start)),
    0,
  );
}

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

export function BusyEditor({
  mode,
  from,
  to,
  today,
  days,
  initialBusy,
  initialFree,
  lineColor,
  save,
}: BusyEditorProps) {
  const [profile, setProfile] = useState<Profile>("none");
  const [workStart, setWorkStart] = useState(h(9));
  const [workEnd, setWorkEnd] = useState(h(18));
  const [shiftToday, setShiftToday] = useState(0);
  const [classes, setClasses] = useState<Marks>({});
  const [marked, setMarked] = useState<Marks>({});
  const [cleared, setCleared] = useState<Marks>({});
  const [free, setFree] = useState<Marks>(() => ({ ...initialFree }) as Marks);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  const templates = useMemo<BusyTemplate[]>(() => {
    if (profile === "workweek")
      return [workweek({ start: workStart, end: workEnd })];
    if (profile === "shifts") {
      return [
        shiftCycle({
          anchor: addDays(today, -shiftToday),
          pattern: ["day", "night", "off", "off"],
        }),
      ];
    }
    if (profile === "classes") {
      const blocks = Object.entries(classes).flatMap(([weekday, keys]) =>
        keys.map((key) => ({
          weekday: Number(weekday),
          ...segmentInterval(key),
        })),
      );
      return blocks.length > 0 ? [{ kind: "classes", blocks }] : [];
    }
    return [];
  }, [profile, workStart, workEnd, shiftToday, today, classes]);

  const busyInput = useMemo(() => {
    const extra = toIntervals(marked);
    const merged: Record<string, Interval[]> = {};
    for (const date of new Set([
      ...Object.keys(initialBusy),
      ...Object.keys(extra),
    ])) {
      merged[date] = [...(initialBusy[date] ?? []), ...(extra[date] ?? [])];
    }
    return merged;
  }, [initialBusy, marked]);

  const answer = useMemo(
    () =>
      mode === "free"
        ? buildAnswerDays({ mode: "free", from, to, free: toIntervals(free) })
        : buildAnswerDays({
            mode: "busy",
            from,
            to,
            templates,
            busy: busyInput,
            cleared: toIntervals(cleared),
          }),
    [mode, from, to, free, templates, busyInput, cleared],
  );

  const busyOn = (date: string) => answer[date]?.busy ?? [];
  const freeSegments = days.reduce(
    (count, day) =>
      count +
      SEGMENTS.filter((seg) => overlap(busyOn(day.date), seg) === 0).length,
    0,
  );

  function tap(date: string, key: SegmentKey) {
    setError(false);
    if (mode === "free") {
      setFree((m) => toggle(m, date, key, !(m[date] ?? []).includes(key)));
      return;
    }
    const hasBusy = overlap(busyOn(date), segmentInterval(key)) > 0;
    setMarked((m) => toggle(m, date, key, !hasBusy));
    setCleared((m) => toggle(m, date, key, hasBusy));
  }

  function submit() {
    startTransition(async () => {
      const result = await save({
        templates,
        busy: busyInput,
        cleared: toIntervals(cleared),
        free: toIntervals(free),
      });
      if (result && !result.ok) setError(true);
    });
  }

  return (
    <>
      {mode === "busy" ? (
        <section aria-labelledby="profile-title" className="mt-4">
          <h2
            id="profile-title"
            className="font-extrabold text-xs uppercase tracking-[0.06em]"
          >
            {t("answer.profile")}
          </h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PROFILES.map((p) => (
              <Chip
                key={p}
                selected={profile === p}
                onClick={() => setProfile(p)}
              >
                {t(`answer.profile.${p}` as MessageKey)}
              </Chip>
            ))}
          </div>

          {profile === "workweek" ? (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="font-bold">{t("answer.workweek.hours")}</span>
              <select
                aria-label={t("answer.workweek.hours")}
                value={workStart}
                onChange={(e) => setWorkStart(Number(e.target.value))}
                className="min-h-11 rounded-sign border-[1.5px] border-rule-strong bg-white px-2"
              >
                {WORK_STARTS.map((m) => (
                  <option key={m} value={m}>
                    {formatTime(m)}
                  </option>
                ))}
              </select>
              <span aria-hidden="true">–</span>
              <select
                aria-label={t("answer.workweek.hours")}
                value={workEnd}
                onChange={(e) => setWorkEnd(Number(e.target.value))}
                className="min-h-11 rounded-sign border-[1.5px] border-rule-strong bg-white px-2"
              >
                {WORK_ENDS.map((m) => (
                  <option key={m} value={m}>
                    {formatTime(m)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {profile === "shifts" ? (
            <div className="mt-3">
              <p className="text-mute text-sm">{t("answer.shifts.pattern")}</p>
              <p className="mt-2 font-bold text-sm">
                {t("answer.shifts.today")}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {SHIFT_TODAY.map((key, index) => (
                  <Chip
                    key={key}
                    selected={shiftToday === index}
                    onClick={() => setShiftToday(index)}
                  >
                    {t(`answer.shifts.${key}` as MessageKey)}
                  </Chip>
                ))}
              </div>
            </div>
          ) : null}

          {profile === "classes" ? (
            <div className="mt-3">
              <p className="text-mute text-sm">{t("answer.classes.hint")}</p>
              <div className="mt-2 grid grid-cols-[2.5rem_repeat(3,1fr)] gap-1">
                {CLASS_WEEKDAYS.map((weekday) => (
                  <div key={weekday} className="contents">
                    <span className="self-center font-bold text-sm">
                      {t(`weekday.short.${weekday}` as MessageKey)}
                    </span>
                    {SEGMENTS.map((seg) => {
                      const on = (classes[weekday] ?? []).includes(seg.key);
                      return (
                        <Chip
                          key={seg.key}
                          selected={on}
                          onClick={() =>
                            setClasses((m) =>
                              toggle(m, String(weekday), seg.key, !on),
                            )
                          }
                        >
                          {t(`answer.segment.${seg.key}` as MessageKey)}
                        </Chip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section
        aria-label={t(mode === "free" ? "answer.title.free" : "answer.title")}
        className="mt-5"
      >
        <div
          aria-hidden="true"
          className="flex pb-1 text-[0.6875rem] text-mute"
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
            const busy = busyOn(day.date);
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
                    className={`absolute inset-x-0 top-1/2 -mt-[3px] h-1.5 rounded-full ${
                      mode === "free" ? "track-unknown h-0.5 -mt-px" : ""
                    }`}
                    style={
                      mode === "free" ? undefined : { background: lineColor }
                    }
                  />
                  {mode === "busy"
                    ? busy
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
                        })
                    : (free[day.date] ?? []).map((key) => {
                        const seg = segmentInterval(key);
                        return (
                          <span
                            key={key}
                            aria-hidden="true"
                            className="absolute top-1/2 -mt-[3px] h-1.5 rounded-full"
                            style={{
                              left: `${pct(seg.start)}%`,
                              width: `${pct(seg.end) - pct(seg.start)}%`,
                              background: lineColor,
                            }}
                          />
                        );
                      })}
                  {SEGMENTS.map((seg, index) => {
                    const covered = overlap(busy, seg);
                    const length = seg.end - seg.start;
                    const state =
                      covered === 0
                        ? "free"
                        : covered >= length
                          ? "busy"
                          : "partial";
                    return (
                      <button
                        key={seg.key}
                        type="button"
                        onClick={() => tap(day.date, seg.key)}
                        aria-pressed={
                          mode === "free" ? state === "free" : state !== "free"
                        }
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

      <footer className="sticky bottom-0 -mx-4 mt-4 border-rule border-t bg-white px-4 pt-2.5 pb-[max(1.125rem,env(safe-area-inset-bottom))]">
        <p className="mb-2 text-center font-bold text-sm" aria-live="polite">
          {error
            ? t("answer.error")
            : freeSegments > 0
              ? t("answer.summary.free", { count: freeSegments })
              : t("answer.summary.none")}
        </p>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className={buttonClasses.primary}
        >
          {t("answer.submit")}
        </button>
      </footer>
    </>
  );
}
