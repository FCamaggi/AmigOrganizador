import type { DayLine, LineSegment } from "@amigo/core";
import { t } from "@/i18n/t";
import { formatSpan, formatTime, initialsFor } from "@/lib/format";
import { threadColor, threadPly } from "@/lib/lines";

export interface ClothThread extends DayLine {
  /** Position in the group's join order; picks the thread colour. */
  readonly colorIndex: number;
}

type Span = { readonly start: number; readonly end: number };

interface DayClothProps {
  readonly dayLabel: string;
  /** Replaces the default "<day> · quién está libre" heading. */
  readonly heading?: string;
  readonly span: Span;
  /** The option's window: the band the cloth closes into. */
  readonly band: Span;
  readonly threads: readonly ClothThread[];
}

/** Above this many people each thread gets thinner, so the cloth stays short. */
const DENSE_FROM = 9;

const pct = (value: number, span: Span) =>
  ((value - span.start) / (span.end - span.start)) * 100;

const place = (from: number, to: number, span: Span) => ({
  left: `${pct(from, span)}%`,
  width: `${pct(to, span) - pct(from, span)}%`,
});

/** On top over the whole band. */
function onTopThroughout(thread: DayLine, band: Span) {
  return thread.segments.some(
    (s) => s.state === "free" && s.start <= band.start && s.end >= band.end,
  );
}

function threadLabel(thread: DayLine): string {
  return thread.segments
    .map((segment) =>
      t(`diagram.lane.${segment.state}`, {
        name: thread.displayName,
        from: formatTime(segment.start),
        to: formatTime(segment.end),
      }),
    )
    .join(". ");
}

/**
 * One woven row: free time rides on top in the person's colour (double-ply for
 * second-cycle members), busy time dives under the cloth with a hatched
 * under-thread and coloured warp ticks at dive boundaries, unknown time hangs
 * loose and dotted. Shape carries the state; colour only says who.
 */
function Thread({
  thread,
  initial,
  span,
  dense,
}: {
  readonly thread: ClothThread;
  readonly initial: string;
  readonly span: Span;
  readonly dense: boolean;
}) {
  const color = threadColor(thread.colorIndex).value;
  const ply = threadPly(thread.colorIndex);
  return (
    <li className={`flex items-center ${dense ? "h-4" : "h-5"}`}>
      <span
        aria-hidden="true"
        className={`w-8 flex-none truncate pr-2 font-bold leading-none lg:w-28 ${
          dense ? "text-caption" : "text-[0.8125rem]"
        }`}
      >
        <span className="lg:hidden">{initial}</span>
        <span className="hidden lg:inline">{thread.displayName}</span>
      </span>
      <span className="sr-only">{threadLabel(thread)}</span>
      <span aria-hidden="true" className="relative h-full flex-1">
        <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-rule" />
        {thread.segments.map((segment: LineSegment) => {
          const style = place(segment.start, segment.end, span);
          if (segment.state === "free") {
            if (ply === 2) {
              return (
                <span
                  key={segment.start}
                  className={`weave-move absolute top-1/2 flex -translate-y-1/2 flex-col justify-between ${
                    dense ? "h-2" : "h-2.5"
                  }`}
                  style={style}
                >
                  <span
                    className={`yarn block w-full rounded-full ${
                      dense ? "h-[3px]" : "h-1"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                  <span
                    className={`yarn block w-full rounded-full ${
                      dense ? "h-[3px]" : "h-1"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                </span>
              );
            }
            return (
              <span
                key={segment.start}
                className={`weave-move yarn absolute top-1/2 -translate-y-1/2 rounded-full ${
                  dense ? "h-1.5" : "h-2"
                }`}
                style={{ ...style, backgroundColor: color }}
              />
            );
          }
          if (segment.state === "busy") {
            const diveIn = segment.start > span.start;
            const diveOut = segment.end < span.end;
            return (
              <span
                key={segment.start}
                className="weave-move absolute top-1/2 flex h-3 -translate-y-1/2 items-center"
                style={style}
              >
                {diveIn ? (
                  <span
                    className="h-2.5 w-[2.5px] flex-none rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ) : null}
                <span className="thread-dive h-[3px] flex-1" />
                {diveOut ? (
                  <span
                    className="h-2.5 w-[2.5px] flex-none rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ) : null}
              </span>
            );
          }
          if (segment.state === "unknown") {
            return (
              <span
                key={segment.start}
                className="weave-move thread-loose absolute top-1/2 h-0.5 -translate-y-1/2"
                style={style}
              />
            );
          }
          return null;
        })}
      </span>
    </li>
  );
}

function Axis({ span }: { readonly span: Span }) {
  const ticks: number[] = [];
  const length = span.end - span.start;
  const step = length <= 6 * 60 ? 60 : length <= 10 * 60 ? 120 : 240;
  const first = Math.ceil(span.start / step) * step;
  for (let minute = first; minute <= span.end; minute += step)
    ticks.push(minute);
  return (
    <div aria-hidden="true" className="mt-1 flex">
      <span className="w-8 flex-none lg:w-28" />
      <span className="relative h-4 flex-1 text-caption text-mute">
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
 * The day as cloth: one thread per person across the hours. Where every
 * thread rides on top the cloth closes; the outlined band is the option's
 * window, and a thread that dives inside it is the person who can't. It
 * never collapses people together: a big group is a denser cloth.
 */
export function DayCloth({
  dayLabel,
  heading,
  span,
  band,
  threads,
}: DayClothProps) {
  const dense = threads.length >= DENSE_FROM;
  const onTop = threads.filter((thread) => onTopThroughout(thread, band));
  const closed = onTop.length === threads.length;
  const initials = initialsFor(threads.map((thread) => thread.displayName));

  return (
    <figure className="rounded-cloth bg-surface px-3 pt-2.5 pb-2.5">
      <figcaption className="mb-1 font-bold text-sm">
        {heading ?? t("diagram.title", { day: dayLabel })}
      </figcaption>

      <div className="relative pt-7 pb-1">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 left-8 lg:left-28"
        >
          <span
            className={`weave-move absolute top-5 -bottom-0.5 rounded-knot border-ink ${
              closed ? "cloth-closed border-[3px]" : "border-2 border-dashed"
            }`}
            style={place(band.start, band.end, span)}
          >
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-2 font-bold text-caption text-surface leading-[1.125rem]">
              {formatSpan(band.start, band.end)}
            </span>
          </span>
        </div>
        <ul className={`relative ${dense ? "space-y-0" : "space-y-0.5"}`}>
          {threads.map((thread, index) => (
            <Thread
              key={thread.accountId}
              thread={thread}
              initial={initials[index] ?? "?"}
              span={span}
              dense={dense}
            />
          ))}
        </ul>
      </div>

      <Axis span={span} />
      <p className="mt-1.5 pl-8 font-bold text-sm lg:pl-28">
        {closed
          ? t("cloth.closed", { time: formatSpan(band.start, band.end) })
          : t("cloth.partial", {
              free: onTop.length,
              total: threads.length,
              time: formatSpan(band.start, band.end),
            })}
      </p>
      <p className="mt-0.5 text-pretty pl-8 text-caption text-mute lg:pl-28">
        {t("cloth.legend")}
      </p>
    </figure>
  );
}
