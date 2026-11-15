"use client";

import Link from "next/link";
import { useState } from "react";
import { LineDiagram } from "@/components/line-diagram";
import { OptionRow } from "@/components/option-row";
import { ShareButton, WhatsAppLink } from "@/components/share-buttons";
import { t } from "@/i18n/t";
import { formatTime } from "@/lib/format";
import type { OptionView } from "@/lib/plan-view-model";
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
            <input type="hidden" name="start" value={selected.start} />
            <button type="submit" className={buttonClasses.primary}>
              {t("actions.confirm", {
                day: `${selected.dayLabel}, ${formatTime(selected.start)}`,
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
