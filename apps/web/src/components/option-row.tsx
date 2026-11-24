"use client";

import { t } from "@/i18n/t";
import { formatSpan, formatTime, initialOf } from "@/lib/format";
import type { OptionView, PersonState } from "@/lib/option-view";

const RANK_COLORS = [
  "var(--line-red)",
  "var(--line-blue)",
  "var(--ink)",
  "var(--ink)",
];
const MAX_AVATARS = 8;

function Avatar({
  name,
  state,
}: {
  readonly name: string;
  readonly state: PersonState;
}) {
  const base =
    "relative grid size-6 flex-none place-items-center overflow-hidden rounded-full border-[1.5px] font-extrabold text-caption";
  if (state === "free") {
    return (
      <span className={`${base} border-ink bg-ink text-white`}>
        {initialOf(name)}
      </span>
    );
  }
  if (state === "unknown") {
    return (
      <span
        className={`${base} border-dashed border-mute bg-surface text-mute`}
      >
        {initialOf(name)}
      </span>
    );
  }
  return (
    <span className={`${base} border-ink bg-surface text-ink`}>
      {initialOf(name)}
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

/** One ranked option: a radio row with time, reasons, who can come and the count. */
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
  return (
    <li>
      <label
        className={`relative grid cursor-pointer grid-cols-[1.75rem_1fr_auto] gap-x-2.5 border-rule border-b py-3 pr-1 ${
          selected ? "bg-panel" : ""
        }`}
      >
        <input
          type="radio"
          name="option"
          className="peer sr-only"
          checked={selected}
          onChange={onSelect}
        />
        <span
          aria-hidden="true"
          className="mt-0.5 ml-0.5 size-[1.375rem] rounded-full border-[5px] bg-surface peer-focus-visible:outline-3 peer-focus-visible:outline-indigo peer-focus-visible:outline-offset-2"
          style={{ borderColor: RANK_COLORS[rank] }}
        />
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
                  className="rounded-knot border border-rule-strong px-1.5 py-px font-bold text-caption"
                >
                  {reason}
                </span>
              ))}
            </span>
          ) : null}
          <span className="mt-1.5 flex flex-wrap items-center gap-[3px]">
            <span className="sr-only">{peopleLabel(option.people)}</span>
            <span aria-hidden="true" className="flex flex-wrap gap-[3px]">
              {shown.map((person) => (
                <Avatar
                  key={person.name + person.state}
                  name={person.name}
                  state={person.state}
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
          <span className="block font-extrabold text-xl leading-none">
            {t("options.count", {
              free: option.freeCount,
              total: option.memberCount,
            })}
          </span>
          <span className="block font-medium text-caption text-mute">
            {t("options.can")}
          </span>
          {rank === 0 ? (
            <span className="mt-2 inline-block rounded-knot bg-line-red px-1.5 py-0.5 font-extrabold text-caption text-white">
              {t("options.best")}
            </span>
          ) : null}
        </span>
      </label>
    </li>
  );
}
