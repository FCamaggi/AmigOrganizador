"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { LineDiagram } from "@/components/line-diagram";
import { OptionRow } from "@/components/option-row";
import { ShareButton, WhatsAppLink } from "@/components/share-buttons";
import { type MessageKey, t } from "@/i18n/t";
import { formatDuration, formatTime } from "@/lib/format";
import type { StripDay } from "@/lib/group-view-model";
import type { OptionView } from "@/lib/option-view";
import { DURATIONS } from "@/lib/plan-options";
import { buttonClasses } from "@/lib/ui";
import type { ProposeState } from "@/server/group-actions";

interface GroupBoardProps {
  /** Fewer than two members: nothing to compare yet. */
  readonly alone: boolean;
  readonly options: readonly OptionView[];
  readonly strip: readonly StripDay[];
  readonly inviteUrl: string;
  readonly shareText: string;
  readonly propose: (
    state: ProposeState,
    formData: FormData,
  ) => Promise<ProposeState>;
}

const legend = "font-extrabold text-xs uppercase tracking-[0.06em]";

/** Start times offered for a proposal: every 30 min inside the free window. */
function startTimes(option: OptionView, duration: number): number[] {
  const times: number[] = [];
  const first = Math.ceil(option.windowStart / 30) * 30;
  for (
    let m = first;
    m + duration <= option.windowEnd && m < 24 * 60;
    m += 30
  ) {
    times.push(m);
  }
  return times.length > 0 ? times : [option.start];
}

function Strip({
  days,
  selectedKey,
  onSelect,
}: {
  readonly days: readonly StripDay[];
  readonly selectedKey: string | null;
  readonly onSelect: (key: string) => void;
}) {
  return (
    <section aria-labelledby="strip-title" className="mt-4">
      <h2 id="strip-title" className={legend}>
        {t("group.strip.title")}
      </h2>
      <div className="-mx-4 mt-1 overflow-x-auto px-4 pb-1">
        <ol className="relative flex w-max gap-0.5">
          <span
            aria-hidden="true"
            className="absolute top-[1.9rem] right-4 left-4 h-1 rounded-full bg-ink"
          />
          {days.map((day) => {
            const selected =
              day.optionKey !== null && day.optionKey === selectedKey;
            const marker = !day.hasOption
              ? "size-2 rounded-full bg-rule-strong"
              : day.allKnownFree
                ? "size-5 rounded-full border-[3px] border-ink bg-ink"
                : "size-5 rounded-full border-[3px] border-ink bg-white";
            const content = (
              <>
                <span className="text-[0.6875rem] text-mute">
                  {day.weekday.slice(0, 2)}
                </span>
                <span className="relative grid h-6 place-items-center">
                  <span aria-hidden="true" className={marker} />
                </span>
                <span className="font-extrabold text-xs">{day.dayOfMonth}</span>
                <span className="text-[0.6875rem] text-mute leading-none">
                  {day.hasOption ? `${day.free}/${day.total}` : "–"}
                </span>
              </>
            );
            return (
              <li key={day.date} className="relative">
                {day.optionKey ? (
                  <button
                    type="button"
                    onClick={() => day.optionKey && onSelect(day.optionKey)}
                    aria-pressed={selected}
                    aria-label={day.label}
                    className={`flex min-h-11 w-10 flex-col items-center gap-0.5 rounded-sign py-1 ${
                      selected ? "bg-panel outline-2 outline-ink" : ""
                    }`}
                  >
                    {content}
                  </button>
                ) : (
                  <span
                    role="img"
                    aria-label={day.label}
                    className="flex min-h-11 w-10 flex-col items-center gap-0.5 py-1"
                  >
                    {content}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function ProposeForm({
  option,
  propose,
  onClose,
}: {
  readonly option: OptionView;
  readonly propose: GroupBoardProps["propose"];
  readonly onClose: () => void;
}) {
  const [duration, setDuration] = useState(180);
  const [state, action, pending] = useActionState<ProposeState, FormData>(
    async (prev, formData) => {
      const next = await propose(prev, formData);
      if (!next.error) onClose();
      return next;
    },
    { error: null },
  );
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    formRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    formRef.current
      ?.querySelector<HTMLInputElement>("input[name=title]")
      ?.focus({ preventScroll: true });
  }, []);
  const times = startTimes(option, duration);
  const defaultStart = times.includes(option.start) ? option.start : times[0];

  return (
    <form
      ref={formRef}
      action={action}
      className="mt-3 scroll-mt-4 space-y-3 rounded-sign border-2 border-ink px-3 py-3"
      aria-labelledby="propose-title"
    >
      <h2 id="propose-title" className="font-extrabold text-lg">
        {t("propose.title")} · {option.dayLabel}
      </h2>
      <input type="hidden" name="date" value={option.date} />
      <input type="hidden" name="duration" value={duration} />
      <div>
        <label htmlFor="propose-title-input" className={legend}>
          {t("propose.field.title")}
        </label>
        <input
          id="propose-title-input"
          name="title"
          required
          maxLength={80}
          placeholder={t("propose.field.title.placeholder")}
          className="mt-1 block min-h-12 w-full rounded-sign border-[1.5px] border-ink bg-white px-3 font-bold text-lg"
        />
      </div>
      <fieldset>
        <legend className={legend}>{t("propose.field.duration")}</legend>
        <div className="mt-1 grid grid-cols-4 gap-1.5">
          {DURATIONS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              aria-pressed={duration === minutes}
              onClick={() => setDuration(minutes)}
              className={`min-h-11 rounded-sign border-[1.5px] font-bold ${
                duration === minutes
                  ? "border-ink bg-ink text-white"
                  : "border-rule-strong bg-white"
              }`}
            >
              {formatDuration(minutes)}
            </button>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="propose-start" className={legend}>
          {t("propose.field.start")}
        </label>
        <select
          id="propose-start"
          name="start"
          key={`${option.key}-${duration}`}
          defaultValue={defaultStart}
          className="mt-1 block min-h-12 w-full rounded-sign border-[1.5px] border-rule-strong bg-white px-3"
        >
          {times.map((m) => (
            <option key={m} value={m}>
              {formatTime(m)}–{formatTime(m + duration)}
            </option>
          ))}
        </select>
      </div>
      {state.error ? (
        <p role="alert" className="font-bold text-danger text-sm">
          {t(
            (state.error === "INVALID_TITLE" ||
            state.error === "INVALID_TIME" ||
            state.error === "INVALID_DURATION"
              ? `propose.error.${state.error}`
              : "propose.error.generic") as MessageKey,
          )}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className={buttonClasses.secondary}
        >
          {t("propose.cancel")}
        </button>
        <button
          type="submit"
          disabled={pending}
          className={`${buttonClasses.primary} flex-1`}
        >
          {t("propose.submit")}
        </button>
      </div>
    </form>
  );
}

export function GroupBoard({
  alone,
  options,
  strip,
  inviteUrl,
  shareText,
  propose,
}: GroupBoardProps) {
  const [selectedKey, setSelectedKey] = useState(options[0]?.key ?? null);
  const [proposing, setProposing] = useState(false);
  const selected =
    options.find((o) => o.key === selectedKey) ?? options[0] ?? null;
  const select = (key: string) => {
    setSelectedKey(key);
    setProposing(false);
  };

  if (alone) {
    return (
      <section
        aria-labelledby="alone-title"
        className="mt-5 rounded-sign border-2 border-ink px-3 py-4"
      >
        <h2 id="alone-title" className="font-extrabold text-lg">
          {t("group.alone.title")}
        </h2>
        <p className="mt-1 text-mute text-sm">{t("group.alone.body")}</p>
        <div className="mt-3 flex gap-2">
          <WhatsAppLink label={t("group.share")} text={shareText} />
          <ShareButton url={inviteUrl} text={shareText} />
        </div>
      </section>
    );
  }

  return (
    <>
      <Strip
        days={strip}
        selectedKey={selected?.key ?? null}
        onSelect={select}
      />

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

      {selected && proposing ? (
        <ProposeForm
          option={selected}
          propose={propose}
          onClose={() => setProposing(false)}
        />
      ) : null}

      <section aria-labelledby="days-title" className="mt-4">
        <h2 id="days-title" className={legend}>
          {t("group.days.title")}
        </h2>
        {options.length > 0 ? (
          <ul className="mt-1 border-rule border-t">
            {options.map((option, index) => (
              <OptionRow
                key={option.key}
                option={option}
                rank={index}
                selected={option.key === selected?.key}
                onSelect={() => select(option.key)}
              />
            ))}
          </ul>
        ) : (
          <div className="mt-2 rounded-sign border border-rule border-dashed px-3 py-4">
            <p className="font-extrabold">{t("group.empty.title")}</p>
            <p className="mt-1 text-mute text-sm">{t("group.empty.body")}</p>
          </div>
        )}
      </section>

      <footer
        hidden={proposing}
        className="sticky bottom-0 -mx-4 mt-4 border-rule border-t bg-white px-4 pt-2.5 pb-[max(1.125rem,env(safe-area-inset-bottom))]"
      >
        {selected && !proposing ? (
          <button
            type="button"
            onClick={() => setProposing(true)}
            className={buttonClasses.primary}
          >
            {t("group.propose", { day: selected.dayLabel })}
          </button>
        ) : null}
        <div className={`flex gap-2 ${selected && !proposing ? "mt-2" : ""}`}>
          <WhatsAppLink label={t("group.share")} text={shareText} />
          <ShareButton url={inviteUrl} text={shareText} />
        </div>
      </footer>
    </>
  );
}
