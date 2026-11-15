"use client";

import Link from "next/link";
import { useState } from "react";
import { LineDiagram } from "@/components/line-diagram";
import { ShareButton, WhatsAppLink } from "@/components/share-buttons";
import { t } from "@/i18n/t";
import { formatSpan, formatTime, initialOf } from "@/lib/format";
import type { OptionView, PersonState } from "@/lib/plan-view-model";
import { buttonClasses } from "@/lib/ui";

export type ViewerRole = "visitor" | "outsider" | "participant" | "organizer";

interface PlanBoardProps {
  readonly planId: string;
  readonly role: ViewerRole;
  readonly answered: boolean;
  readonly inputMode: "busy" | "free";
  readonly options: readonly OptionView[];
  readonly missingNames: readonly string[];
  readonly shareText: string;
  readonly nudgeText: string;
  readonly planUrl: string;
  readonly confirm: (formData: FormData) => Promise<void>;
  readonly join: () => Promise<void>;
}

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
    "relative grid size-6 flex-none place-items-center overflow-hidden rounded-full border-[1.5px] font-extrabold text-[0.6875rem]";
  if (state === "free") {
    return (
      <span className={`${base} border-ink bg-ink text-white`}>
        {initialOf(name)}
      </span>
    );
  }
  if (state === "unknown") {
    return (
      <span className={`${base} border-dashed border-mute bg-white text-mute`}>
        {initialOf(name)}
      </span>
    );
  }
  return (
    <span className={`${base} border-ink bg-white text-ink`}>
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

function OptionRow({
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
          className="mt-0.5 ml-0.5 size-[1.375rem] rounded-full border-[5px] bg-white peer-focus-visible:outline-3 peer-focus-visible:outline-line-blue peer-focus-visible:outline-offset-2"
          style={{ borderColor: RANK_COLORS[rank] }}
        />
        <span className="min-w-0">
          <span className="block font-extrabold text-[1.0625rem] leading-tight">
            {option.dayLabel}{" "}
            <span className="font-medium text-[0.9375rem] text-mute">
              {formatSpan(option.start, option.end)}
            </span>
          </span>
          {option.reasons.length > 0 ? (
            <span className="mt-1 flex flex-wrap gap-1">
              {option.reasons.map((reason) => (
                <span
                  key={reason}
                  className="rounded-chip border border-rule-strong px-1.5 py-px font-bold text-[0.6875rem]"
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
                <span className="grid h-6 place-items-center px-1 font-bold text-[0.6875rem] text-mute">
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
          <span className="block font-medium text-[0.6875rem] text-mute">
            {t("options.can")}
          </span>
          {rank === 0 ? (
            <span className="mt-2 inline-block rounded-chip bg-line-red px-1.5 py-0.5 font-extrabold text-[0.6875rem] text-white">
              {t("options.best")}
            </span>
          ) : null}
        </span>
      </label>
    </li>
  );
}

export function PlanBoard({
  planId,
  role,
  answered,
  inputMode,
  options,
  missingNames,
  shareText,
  nudgeText,
  planUrl,
  confirm,
  join,
}: PlanBoardProps) {
  const [selectedKey, setSelectedKey] = useState(options[0]?.key ?? null);
  const selected =
    options.find((o) => o.key === selectedKey) ?? options[0] ?? null;
  const planPath = `/p/${planId}`;
  const answerPath = `${planPath}/disponibilidad`;
  const answerLabel =
    inputMode === "free" ? t("actions.answer.free") : t("actions.answer");

  return (
    <>
      {selected ? (
        <div className="mt-3">
          <LineDiagram
            dayLabel={selected.dayLabel}
            span={selected.span}
            station={{ start: selected.start, end: selected.end }}
            lines={selected.lines}
          />
        </div>
      ) : null}

      <section aria-labelledby="options-title" className="mt-4">
        <h2
          id="options-title"
          className="font-extrabold text-xs uppercase tracking-[0.06em]"
        >
          {t("options.title")}
        </h2>
        {options.length > 0 ? (
          <ul className="mt-1 border-rule border-t">
            {options.map((option, index) => (
              <OptionRow
                key={option.key}
                option={option}
                rank={index}
                selected={option.key === selected?.key}
                onSelect={() => setSelectedKey(option.key)}
              />
            ))}
          </ul>
        ) : (
          <div className="mt-2 rounded-sign border border-rule border-dashed px-3 py-4">
            <p className="font-extrabold">
              {answered ? t("options.none.title") : t("options.empty.title")}
            </p>
            <p className="mt-1 text-mute text-sm">
              {answered ? t("options.none.body") : t("options.empty.body")}
            </p>
          </div>
        )}
      </section>

      <footer className="sticky bottom-0 -mx-4 mt-4 border-rule border-t bg-white px-4 pt-2.5 pb-[max(1.125rem,env(safe-area-inset-bottom))]">
        {role === "organizer" && selected ? (
          <form action={confirm}>
            <input type="hidden" name="date" value={selected.date} />
            <input type="hidden" name="start" value={selected.confirmStart} />
            <button type="submit" className={buttonClasses.primary}>
              {t("actions.confirm", {
                day: `${selected.dayLabel}, ${formatTime(selected.confirmStart)}`,
              })}
            </button>
          </form>
        ) : null}
        {role === "organizer" && !selected ? (
          <Link href={answerPath} className={buttonClasses.primary}>
            {answered ? t("actions.editAnswer") : answerLabel}
          </Link>
        ) : null}
        {role === "participant" ? (
          <Link href={answerPath} className={buttonClasses.primary}>
            {answered ? t("actions.editAnswer") : answerLabel}
          </Link>
        ) : null}
        {role === "outsider" ? (
          <form action={join}>
            <button type="submit" className={buttonClasses.primary}>
              {t("actions.join")}
            </button>
          </form>
        ) : null}
        {role === "visitor" ? (
          <Link
            href={`/entrar?next=${encodeURIComponent(answerPath)}`}
            className={buttonClasses.primary}
          >
            {t("actions.signInToAnswer")}
          </Link>
        ) : null}

        {role === "organizer" || role === "participant" ? (
          <div className="mt-2 flex gap-2">
            {missingNames.length > 0 ? (
              <WhatsAppLink
                text={nudgeText}
                label={
                  missingNames.length === 1
                    ? t("actions.nudge", { name: missingNames[0] ?? "" })
                    : t("actions.nudge.many")
                }
              />
            ) : null}
            {role === "organizer" && selected && answered === false ? (
              <Link href={answerPath} className={buttonClasses.secondary}>
                {answerLabel}
              </Link>
            ) : null}
            <ShareButton url={planUrl} text={shareText} />
          </div>
        ) : null}
      </footer>
    </>
  );
}
