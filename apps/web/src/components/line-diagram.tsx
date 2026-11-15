"use client";

import type { DayLine, LineSegment } from "@amigo/core";
import { useState } from "react";
import { t } from "@/i18n/t";
import { formatSpan, formatTime, initialOf } from "@/lib/format";
import { lineColor, MAX_SEPARATE_LINES } from "@/lib/lines";

export interface DiagramLine extends DayLine {
  /** Position in the plan's join order; picks the line colour. */
  readonly colorIndex: number;
}

type Span = { readonly start: number; readonly end: number };

interface LineDiagramProps {
  readonly dayLabel: string;
  /** Replaces the default "<day> · quién está libre" heading. */
  readonly heading?: string;
  readonly span: Span;
  readonly station: Span;
  readonly lines: readonly DiagramLine[];
}

const MAX_BLOCKERS = 3;

const pct = (value: number, span: Span) =>
  ((value - span.start) / (span.end - span.start)) * 100;

const place = (from: number, to: number, span: Span) => ({
  left: `${pct(from, span)}%`,
  width: `${pct(to, span) - pct(from, span)}%`,
});

/** Free over the whole station span. */
function freeThroughout(line: DayLine, station: Span) {
  return line.segments.some(
    (s) =>
      s.state === "free" && s.start <= station.start && s.end >= station.end,
  );
}

function laneLabel(line: DayLine): string {
  return line.segments
    .map((segment) =>
      t(`diagram.lane.${segment.state}`, {
        name: line.displayName,
        from: formatTime(segment.start),
        to: formatTime(segment.end),
      }),
    )
    .join(". ");
}

/** White platform with an ink outline: where a line stops at the station. */
function Platform({
  station,
  span,
  children,
}: {
  readonly station: Span;
  readonly span: Span;
  readonly children?: React.ReactNode;
}) {
  return (
    <span
      className="move-station absolute top-1/2 grid h-3.5 -translate-y-1/2 place-items-center rounded-full border-2 border-ink bg-white font-extrabold text-[0.6875rem] leading-none"
      style={place(station.start, station.end, span)}
    >
      {children}
    </span>
  );
}

function Lane({
  line,
  span,
  station,
}: {
  readonly line: DiagramLine;
  readonly span: Span;
  readonly station: Span;
}) {
  const color = lineColor(line.colorIndex);
  return (
    <li className="flex h-5 items-center">
      <span
        aria-hidden="true"
        className="w-6 flex-none font-extrabold text-[0.8125rem] leading-none"
      >
        {initialOf(line.displayName)}
      </span>
      <span className="sr-only">{laneLabel(line)}</span>
      <span aria-hidden="true" className="relative h-5 flex-1">
        <span className="absolute inset-x-0 top-1/2 h-px bg-rule" />
        {line.segments.map((segment: LineSegment) => {
          const style = place(segment.start, segment.end, span);
          if (segment.state === "free") {
            return (
              <span
                key={segment.start}
                className="move-line absolute top-[7px] h-1.5 rounded-full"
                style={{
                  ...style,
                  background: color.value,
                  boxShadow: color.outlined
                    ? "inset 0 0 0 1px var(--ink)"
                    : undefined,
                }}
              />
            );
          }
          if (segment.state === "unknown") {
            return (
              <span
                key={segment.start}
                className="move-line track-unknown absolute top-[9px] h-0.5"
                style={style}
              />
            );
          }
          return (
            <span
              key={segment.start}
              className="move-line hatch-busy absolute top-1.5 h-2 rounded-[2px]"
              style={style}
            />
          );
        })}
        {freeThroughout(line, station) ? (
          <Platform station={station} span={span} />
        ) : null}
      </span>
    </li>
  );
}

/** Free-count steps across the span, for the collapsed trunk line. */
function trunkSteps(lines: readonly DayLine[], span: Span) {
  const points = new Set([span.start, span.end]);
  for (const line of lines) {
    for (const s of line.segments) {
      points.add(s.start);
      points.add(s.end);
    }
  }
  const sorted = [...points].toSorted((a, b) => a - b);
  const steps: { start: number; end: number; free: number }[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i] as number;
    const end = sorted[i + 1] as number;
    const free = lines.filter((line) =>
      line.segments.some(
        (s) => s.state === "free" && s.start <= start && s.end >= end,
      ),
    ).length;
    const last = steps.at(-1);
    if (last && last.free === free) last.end = end;
    else steps.push({ start, end, free });
  }
  return steps;
}

function Trunk({
  lines,
  span,
  station,
}: {
  readonly lines: readonly DayLine[];
  readonly span: Span;
  readonly station: Span;
}) {
  const steps = trunkSteps(lines, span);
  const total = lines.length;
  const atStation = lines.filter((line) =>
    freeThroughout(line, station),
  ).length;
  return (
    <li className="flex h-6 items-center">
      <span aria-hidden="true" className="w-6 flex-none">
        <svg aria-hidden="true" viewBox="0 0 16 10" className="h-2.5 w-4">
          <path
            d="M1 2h14M1 5h14M1 8h14"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="sr-only">
        {steps
          .map((s) =>
            t("diagram.lane.free", {
              name: t("diagram.trunkOf", { free: s.free, total }),
              from: formatTime(s.start),
              to: formatTime(s.end),
            }),
          )
          .join(". ")}
      </span>
      <span aria-hidden="true" className="relative h-6 flex-1">
        <span className="absolute inset-x-0 top-1/2 h-px bg-rule" />
        {steps.map((step) => {
          if (step.free === 0) return null;
          const thickness = 3 + Math.round((step.free / total) * 7);
          return (
            <span
              key={step.start}
              className="move-line absolute top-1/2 -translate-y-1/2 rounded-full bg-ink"
              style={{
                ...place(step.start, step.end, span),
                height: thickness,
              }}
            />
          );
        })}
        <span
          className="move-station absolute top-1/2 grid h-5 -translate-y-1/2 place-items-center rounded-full border-2 border-ink bg-white font-extrabold text-xs leading-none"
          style={place(station.start, station.end, span)}
        >
          {t("options.count", { free: atStation, total })}
        </span>
      </span>
    </li>
  );
}

function Axis({ span }: { readonly span: Span }) {
  const ticks: number[] = [];
  const step = span.end - span.start <= 8 * 60 ? 60 : 120;
  const first = Math.ceil(span.start / step) * step;
  for (let minute = first; minute <= span.end; minute += step)
    ticks.push(minute);
  return (
    <div aria-hidden="true" className="mt-1 flex">
      <span className="w-6 flex-none" />
      <span className="relative h-4 flex-1 text-[0.6875rem] text-mute">
        {ticks.map((tick) => {
          const left = pct(tick, span);
          if (left < 7 || left > 93) return null;
          return (
            <span
              key={tick}
              className="absolute top-0 -translate-x-1/2"
              style={{ left: `${left}%` }}
            >
              {formatTime(tick)}
            </span>
          );
        })}
      </span>
    </div>
  );
}

/**
 * Each friend is a metro line across the day; where their lines run free
 * together, the station marks the option and every free line stops at a
 * white platform there. Beyond six people, free people merge into one trunk
 * line and only the people who block keep their own.
 */
export function LineDiagram({
  dayLabel,
  heading,
  span,
  station,
  lines,
}: LineDiagramProps) {
  const [expanded, setExpanded] = useState(false);
  const collapsed = lines.length > MAX_SEPARATE_LINES && !expanded;
  const blockers = lines.filter((line) => !freeThroughout(line, station));
  const shownBlockers = blockers.slice(0, MAX_BLOCKERS);
  const hidden = blockers.length - shownBlockers.length;
  const guide = place(station.start, station.end, span);

  return (
    <figure className="rounded-sign border border-rule px-3 pt-2.5 pb-2">
      <figcaption className="mb-1 flex items-baseline justify-between gap-2">
        <span className="font-extrabold text-xs uppercase tracking-[0.06em]">
          {heading ?? t("diagram.title", { day: dayLabel })}
        </span>
        {lines.length > MAX_SEPARATE_LINES ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="-my-3 min-h-11 px-1 font-bold text-line-blue text-xs underline"
          >
            {expanded ? t("diagram.hideAll") : t("diagram.showAll")}
          </button>
        ) : null}
      </figcaption>

      <div className="relative pt-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 left-6"
        >
          <span
            className="move-station absolute top-0 bottom-[-2px] border-ink/40 border-x border-dashed"
            style={guide}
          >
            <span className="absolute top-0 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-2 font-extrabold text-[0.6875rem] text-white leading-[1.125rem]">
              {formatSpan(station.start, station.end)}
            </span>
          </span>
        </div>
        <ul className="relative space-y-1">
          {collapsed ? (
            <>
              <Trunk lines={lines} span={span} station={station} />
              {shownBlockers.map((line) => (
                <Lane
                  key={line.accountId}
                  line={line}
                  span={span}
                  station={station}
                />
              ))}
              {hidden > 0 ? (
                <li className="flex h-5 items-center">
                  <span className="w-6 flex-none" />
                  <span className="font-bold text-mute text-xs">
                    {t("diagram.more", { count: hidden })}
                  </span>
                </li>
              ) : null}
            </>
          ) : (
            lines.map((line) => (
              <Lane
                key={line.accountId}
                line={line}
                span={span}
                station={station}
              />
            ))
          )}
        </ul>
      </div>

      <Axis span={span} />
      <p className="mt-1.5 pl-6 font-extrabold text-xs">
        {t("diagram.station", { time: formatSpan(station.start, station.end) })}
      </p>
      <p className="mt-0.5 text-pretty pl-6 text-[0.6875rem] text-mute">
        {collapsed ? t("diagram.legend.trunk") : t("diagram.legend")}
      </p>
    </figure>
  );
}
