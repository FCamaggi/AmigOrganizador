"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { DayCloth } from "@/components/day-cloth";
import { OptionRow, WovenBand } from "@/components/option-row";
import { ShareButton, WhatsAppLink } from "@/components/share-buttons";
import { type MessageKey, t } from "@/i18n/t";
import { formatDuration, formatTime } from "@/lib/format";
import type { StripDay } from "@/lib/group-view-model";
import { threadColor } from "@/lib/lines";
import type { OptionView } from "@/lib/option-view";
import { DURATIONS } from "@/lib/plan-options";
import { buttonClasses, shellClasses } from "@/lib/ui";
import type { ProposeState } from "@/server/group-actions";

interface GroupBoardProps {
  /** Fewer than two members: nothing to compare yet. */
  readonly alone: boolean;
  readonly options: readonly OptionView[];
  readonly strip: readonly StripDay[];
  /** Members who do not have a schedule yet. */
  readonly missing: readonly string[];
  readonly inviteUrl: string;
  readonly shareText: string;
  /** Optional prompt when the signed-in viewer still has no schedule. */
  readonly noProfileNotice?: React.ReactNode;
  /** Rendered after the ranked days and before the sticky footer. */
  readonly children?: React.ReactNode;
  readonly propose: (
    state: ProposeState,
    formData: FormData,
  ) => Promise<ProposeState>;
}

const fieldLabel = "font-bold text-sm text-ink";

function missingLine(names: readonly string[]): string {
  if (names.length === 0) return t("group.missing.none");
  if (names.length === 1)
    return t("group.missing.one", { name: names[0] ?? "" });
  if (names.length <= 3)
    return t("group.missing.few", { names: names.join(", ") });
  return t("group.missing.many", { count: names.length });
}

function decisionLine(option: OptionView, missing: readonly string[]): string {
  const base = { free: option.freeCount, total: option.memberCount };
  if (option.freeCount === option.memberCount) {
    return t("group.decision.all", base);
  }
  if (missing.length === 1 && missing[0]) {
    return t("group.decision.missingOne", { ...base, name: missing[0] });
  }
  if (missing.length > 1 && missing.length <= 3) {
    return t("group.decision.missingFew", {
      ...base,
      names: missing.join(", "),
    });
  }
  if (missing.length > 3) {
    return t("group.decision.missingMany", { ...base, count: missing.length });
  }
  if (option.note) {
    return t("group.decision.withNote", { ...base, note: option.note });
  }
  return t("group.decision.some", base);
}

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
  const selectedRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const el = selectedRef.current;
    if (!el) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: reduced ? "auto" : "smooth",
    });
  }, []);

  return (
    <section aria-labelledby="strip-title" className="mt-5">
      <h2 id="strip-title" className="font-extrabold text-base">
        {t("group.strip.title")}
      </h2>
      <div className="-mx-4 mt-1.5 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        <ol className="flex w-max gap-1">
          {days.map((day) => {
            const selected =
              day.optionKey !== null && day.optionKey === selectedKey;
            const rank = day.hasOption ? (day.allKnownFree ? 0 : 1) : 2;
            const content = (
              <>
                <span className="text-caption text-mute">
                  {day.weekday.slice(0, 2)}
                </span>
                <WovenBand people={day.people} rank={rank} className="w-9" />
                <span className="font-extrabold text-xs">{day.dayOfMonth}</span>
                <span className="text-caption text-mute leading-none">
                  {day.hasOption ? `${day.free}/${day.total}` : "–"}
                </span>
              </>
            );
            return (
              <li key={day.date} className="relative">
                {day.optionKey ? (
                  <button
                    ref={selected ? selectedRef : undefined}
                    type="button"
                    onClick={() => day.optionKey && onSelect(day.optionKey)}
                    aria-pressed={selected}
                    aria-label={day.label}
                    className={`flex min-h-11 w-11 flex-col items-center gap-0.5 rounded-cloth border-[1.5px] py-1 ${
                      selected
                        ? "border-ink bg-surface"
                        : "border-transparent hover:bg-panel/80"
                    }`}
                  >
                    {content}
                  </button>
                ) : (
                  <span
                    role="img"
                    aria-label={day.label}
                    className="flex min-h-11 w-11 flex-col items-center gap-0.5 rounded-cloth border-[1.5px] border-transparent py-1"
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
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    formRef.current?.scrollIntoView({
      block: "start",
      behavior: reduced ? "auto" : "smooth",
    });
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
      className="mt-4 scroll-mt-4 space-y-3 rounded-cloth border-[1.5px] border-ink bg-surface p-4"
      aria-labelledby="propose-title"
    >
      <h2 id="propose-title" className="font-extrabold text-xl">
        {t("propose.title")} · {option.dayLabel}
      </h2>
      <input type="hidden" name="date" value={option.date} />
      <input type="hidden" name="duration" value={duration} />
      <div>
        <label htmlFor="propose-title-input" className={fieldLabel}>
          {t("propose.field.title")}
        </label>
        <input
          id="propose-title-input"
          name="title"
          required
          maxLength={80}
          placeholder={t("propose.field.title.placeholder")}
          className="mt-1 block min-h-12 w-full rounded-cloth border-[1.5px] border-ink bg-surface px-3 font-bold text-lg"
        />
      </div>
      <fieldset>
        <legend className={fieldLabel}>{t("propose.field.duration")}</legend>
        <div className="mt-1 grid grid-cols-4 gap-1.5">
          {DURATIONS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              aria-pressed={duration === minutes}
              onClick={() => setDuration(minutes)}
              className={`min-h-11 rounded-cloth border-[1.5px] font-bold ${
                duration === minutes
                  ? "border-ink bg-ink text-surface"
                  : "border-rule-strong bg-surface"
              }`}
            >
              {formatDuration(minutes)}
            </button>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="propose-start" className={fieldLabel}>
          {t("propose.field.start")}
        </label>
        <select
          id="propose-start"
          name="start"
          key={`${option.key}-${duration}`}
          defaultValue={defaultStart}
          className="mt-1 block min-h-12 w-full rounded-cloth border-[1.5px] border-rule-strong bg-surface px-3"
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
      <div className="flex flex-wrap gap-2">
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
          className={`${buttonClasses.primary} min-w-40 flex-1`}
        >
          {t("propose.submit")}
        </button>
      </div>
    </form>
  );
}

export function GroupBoard({
  children,
  alone,
  options,
  strip,
  missing,
  inviteUrl,
  shareText,
  noProfileNotice,
  propose,
}: GroupBoardProps) {
  const [selectedKey, setSelectedKey] = useState(options[0]?.key ?? null);
  const [proposing, setProposing] = useState(false);
  const footerRef = useRef<HTMLElement>(null);
  const selected =
    options.find((o) => o.key === selectedKey) ?? options[0] ?? null;
  const select = (key: string) => {
    setSelectedKey(key);
    setProposing(false);
  };

  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;
    const root = document.documentElement;
    const update = () => {
      const isSticky = !el.hidden && getComputedStyle(el).position === "sticky";
      root.style.setProperty(
        "--footer-h",
        isSticky ? `${Math.ceil(el.getBoundingClientRect().height)}px` : "0px",
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      root.style.removeProperty("--footer-h");
    };
  }, []);

  if (alone) {
    return (
      <>
        {noProfileNotice}
        <section
          aria-labelledby="alone-title"
          className="mt-5 rounded-cloth border border-rule bg-surface p-4 sm:p-5"
        >
          <div
            className="mb-3 flex max-w-52 flex-col gap-1.5"
            aria-hidden="true"
          >
            <div className="relative flex h-2 items-center">
              <span className="h-0.5 w-full rounded-full bg-rule" />
              <span
                className="yarn absolute left-0 h-2 w-24 rounded-full"
                style={{ backgroundColor: threadColor(0).value }}
              />
            </div>
            <div className="relative flex h-2 items-center">
              <span className="thread-loose h-0.5 w-full" />
            </div>
          </div>
          <h2 id="alone-title" className="font-extrabold text-xl">
            {t("group.alone.title")}
          </h2>
          <p className="mt-1 text-mute text-sm">{t("group.alone.body")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <WhatsAppLink label={t("group.share")} text={shareText} />
            <ShareButton url={inviteUrl} text={shareText} />
          </div>
        </section>
        {children}
      </>
    );
  }

  const topOptions = options.slice(0, 3);
  const moreOptions = options.slice(3);

  // Phone and tablet: one column in DOM order, the footer sticky to the
  // viewport (the wrappers use `contents` so they never clip it). Desktop:
  // availability on the left, plans and actions in a sticky aside.
  return (
    <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-x-10">
      <div className="contents lg:block lg:min-w-0">
        {selected ? (
          <section
            aria-labelledby="decision-heading"
            className="mt-4 rounded-cloth bg-ink px-4 py-4 text-surface"
          >
            <h2
              id="decision-heading"
              className="font-extrabold text-[1.625rem] leading-[1.08] tracking-[-0.02em] sm:text-[1.875rem]"
            >
              {selected.dayLabel} · {formatTime(selected.start)}
            </h2>
            <p className="mt-1 text-[0.9375rem] text-ink-sub">
              {decisionLine(selected, missing)}
            </p>
          </section>
        ) : null}

        {noProfileNotice}

        <Strip
          days={strip}
          selectedKey={selected?.key ?? null}
          onSelect={select}
        />

        {selected ? (
          <div className="mt-3">
            <DayCloth
              dayLabel={selected.dayLabel}
              span={selected.span}
              band={{ start: selected.start, end: selected.end }}
              threads={selected.lines}
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

        <section aria-labelledby="days-title" className="mt-6">
          <h2 id="days-title" className="font-extrabold text-base">
            {t("group.days.title")}
          </h2>
          {missing.length > 0 ? (
            <p className="mt-0.5 text-mute text-sm">{missingLine(missing)}</p>
          ) : null}
          {options.length > 0 ? (
            <>
              <ul className="mt-2 border-rule border-t">
                {topOptions.map((option, index) => (
                  <OptionRow
                    key={option.key}
                    option={option}
                    rank={index}
                    selected={option.key === selected?.key}
                    onSelect={() => select(option.key)}
                  />
                ))}
              </ul>
              {moreOptions.length > 0 ? (
                <details className="group mt-1">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 font-bold text-indigo text-sm [&::-webkit-details-marker]:hidden">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 16 16"
                      className="size-4 transition-transform group-open:rotate-90"
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
                    {t("group.days.more")}
                  </summary>
                  <ul className="border-rule border-t">
                    {moreOptions.map((option, index) => (
                      <OptionRow
                        key={option.key}
                        option={option}
                        rank={index + 3}
                        selected={option.key === selected?.key}
                        onSelect={() => select(option.key)}
                      />
                    ))}
                  </ul>
                </details>
              ) : null}
            </>
          ) : (
            <div className="mt-2 rounded-cloth border border-rule border-dashed bg-surface px-4 py-4">
              <p className="font-extrabold">{t("group.empty.title")}</p>
              <p className="mt-1 text-mute text-sm">{t("group.empty.body")}</p>
            </div>
          )}
        </section>
      </div>

      <aside className="contents lg:sticky lg:top-6 lg:flex lg:flex-col">
        {children}

        <footer
          ref={footerRef}
          hidden={proposing}
          className={`${shellClasses.footer} mt-5 lg:static lg:order-first lg:mx-0 lg:mt-4 lg:border-0 lg:px-0 lg:pt-0 lg:pb-0`}
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
          <div
            className={`flex flex-wrap gap-2 ${
              selected && !proposing ? "mt-2" : ""
            }`}
          >
            <WhatsAppLink label={t("group.share")} text={shareText} />
            <ShareButton url={inviteUrl} text={shareText} />
          </div>
        </footer>
      </aside>
    </div>
  );
}
