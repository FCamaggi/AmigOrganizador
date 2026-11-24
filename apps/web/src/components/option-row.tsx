"use client";

import { t } from "@/i18n/t";
import { formatSpan, formatTime, initialsFor } from "@/lib/format";
import { threadColor, threadPly } from "@/lib/lines";
import type { OptionPerson, OptionView, PersonState } from "@/lib/option-view";

const MAX_AVATARS = 8;
const DENSE_FROM = 7;

/**
 * Small woven band showing one short segment per member: spun yarn in their
 * colour if free for the window, solid under-thread with dive ticks if busy,
 * loose dotted if they have no schedule. Frame border weight carries rank.
 */
export function WovenBand({
  people,
  rank,
  className = "mt-0.5 w-10",
}: {
  readonly people: readonly OptionPerson[];
  readonly rank: number;
  readonly className?: string;
}) {
  const dense = people.length >= DENSE_FROM;
  const frameWeight =
    rank === 0
      ? "border-[2.5px] border-ink bg-surface"
      : rank === 1
        ? "border-[1.5px] border-ink bg-surface"
        : "border border-rule-strong bg-panel";

  return (
    <span
      aria-hidden="true"
      className={`flex flex-col rounded-knot px-1.5 py-1.5 peer-focus-visible:outline-3 peer-focus-visible:outline-indigo peer-focus-visible:outline-offset-2 ${frameWeight} ${
        dense ? "gap-[2px]" : "gap-[3px]"
      } ${className}`}
    >
      {people.map((person) => {
        const color = threadColor(person.colorIndex).value;
        const ply = threadPly(person.colorIndex);
        return (
          <span
            key={person.accountId}
            className={`flex w-full items-center ${dense ? "h-[5px]" : "h-1.5"}`}
          >
            {person.state === "free" ? (
              ply === 2 ? (
                <span className="flex h-full w-full flex-col justify-between">
                  <span
                    className={`yarn block w-full rounded-full ${
                      dense ? "h-[1.5px]" : "h-[2px]"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                  <span
                    className={`yarn block w-full rounded-full ${
                      dense ? "h-[1.5px]" : "h-[2px]"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                </span>
              ) : (
                <span
                  className={`yarn block w-full rounded-full ${
                    dense ? "h-[3px]" : "h-1.5"
                  }`}
                  style={{ backgroundColor: color }}
                />
              )
            ) : person.state === "unknown" ? (
              <span className="thread-loose block h-0.5 w-full" />
            ) : (
              <span className="flex w-full items-center">
                <span
                  className={`w-[2px] flex-none rounded-full ${
                    dense ? "h-[4px]" : "h-[5px]"
                  }`}
                  style={{ backgroundColor: color }}
                />
                <span className="thread-dive h-0.5 flex-1" />
                <span
                  className={`w-[2px] flex-none rounded-full ${
                    dense ? "h-[4px]" : "h-[5px]"
                  }`}
                  style={{ backgroundColor: color }}
                />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

function Avatar({
  person,
  initial,
}: {
  readonly person: OptionPerson;
  readonly initial: string;
}) {
  const doublePly = threadPly(person.colorIndex) === 2;
  const base =
    "relative grid h-6 min-w-6 flex-none place-items-center overflow-hidden rounded-full px-0.5 font-extrabold text-caption";
  const color = threadColor(person.colorIndex).value;

  if (person.state === "free") {
    return (
      <span
        className={`${base} text-white ${
          doublePly
            ? "border-[3px] border-double border-surface"
            : "border-[1.5px] border-transparent"
        }`}
        style={{ backgroundColor: color }}
      >
        {initial}
      </span>
    );
  }
  if (person.state === "unknown") {
    return (
      <span
        className={`${base} border-[1.5px] border-dashed border-mute bg-surface text-mute`}
      >
        {initial}
      </span>
    );
  }
  return (
    <span
      className={`${base} bg-surface text-ink ${
        doublePly ? "border-[3px] border-double" : "border-[1.5px]"
      }`}
      style={{ borderColor: color }}
    >
      {initial}
      <span
        aria-hidden="true"
        className="absolute inset-x-[-2px] top-1/2 h-[1.5px] -rotate-45 bg-ink"
      />
    </span>
  );
}

function peopleLabel(people: OptionView["people"]): string {
  const names = (state: PersonState) =>
    people
      .filter((p) => p.state === state)
      .map((p) => p.name)
      .join(", ");
  return (
    [
      ["free", "options.people.free"],
      ["busy", "options.people.busy"],
      ["unknown", "options.people.unknown"],
    ] as const
  )
    .filter(([state]) => names(state))
    .map(([state, key]) => t(key, { names: names(state) }))
    .join(". ");
}

/** One ranked option: a radio row with woven band, time, reasons and avatars. */
export function OptionRow({
  option,
  rank,
  selected,
  onSelect,
}: {
  readonly option: OptionView;
  readonly rank: number;
  readonly selected: boolean;
  readonly onSelect: () => void;
}) {
  const shown = option.people.slice(0, MAX_AVATARS);
  const extra = option.people.length - shown.length;
  const initials = initialsFor(option.people.map((person) => person.name));
  const countSize =
    rank === 0 ? "text-xl" : rank === 1 ? "text-lg" : "text-base text-ink/85";

  return (
    <li>
      <label
        className={`relative grid cursor-pointer grid-cols-[2.75rem_minmax(0,1fr)_auto] items-start gap-x-3 border-rule border-b py-3 pr-2 pl-1.5 transition-colors ${
          selected ? "bg-surface" : "hover:bg-panel/70"
        }`}
      >
        <input
          type="radio"
          name="option"
          className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
          checked={selected}
          onChange={onSelect}
        />
        <WovenBand people={option.people} rank={rank} />
        <span className="min-w-0">
          <span className="block font-extrabold text-[1.0625rem] leading-tight">
            {option.dayLabel}{" "}
            <span className="font-medium text-[0.9375rem] text-mute">
              {formatSpan(option.start, option.end)}
            </span>
          </span>
          {option.windowEnd - option.windowStart > option.end - option.start ? (
            <span className="mt-0.5 block text-[0.8125rem] text-mute">
              {t(
                option.start > option.windowStart + 15
                  ? "options.window.evening"
                  : "options.window",
                {
                  from: formatTime(option.windowStart),
                  to: formatTime(option.windowEnd),
                },
              )}
            </span>
          ) : null}
          {option.reasons.length > 0 ? (
            <span className="mt-1 flex flex-wrap gap-1">
              {option.reasons.map((reason) => (
                <span
                  key={reason}
                  className="rounded-knot border border-rule-strong bg-surface px-1.5 py-px font-bold text-caption"
                >
                  {reason}
                </span>
              ))}
            </span>
          ) : null}
          <span className="mt-1.5 flex flex-wrap items-center gap-[3px]">
            <span className="sr-only">{peopleLabel(option.people)}</span>
            <span aria-hidden="true" className="flex flex-wrap gap-[3px]">
              {shown.map((person, index) => (
                <Avatar
                  key={person.accountId}
                  person={person}
                  initial={initials[index] ?? "?"}
                />
              ))}
              {extra > 0 ? (
                <span className="grid h-6 place-items-center px-1 font-bold text-caption text-mute">
                  +{extra}
                </span>
              ) : null}
            </span>
            {option.note ? (
              <span className="ml-1.5 text-[0.8125rem] text-mute">
                {option.note}
              </span>
            ) : null}
          </span>
        </span>
        <span className="text-right">
          <span className={`block font-extrabold leading-none ${countSize}`}>
            {t("options.count", {
              free: option.freeCount,
              total: option.memberCount,
            })}
          </span>
          <span className="block font-medium text-caption text-mute">
            {t("options.can")}
          </span>
          {rank === 0 ? (
            <span className="mt-2 inline-block rounded-knot bg-ink px-1.5 py-0.5 font-extrabold text-caption text-surface">
              {t("options.best")}
            </span>
          ) : null}
        </span>
      </label>
    </li>
  );
}
