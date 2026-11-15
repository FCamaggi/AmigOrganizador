"use client";

import { useActionState } from "react";
import { type MessageKey, t } from "@/i18n/t";
import { formatDuration } from "@/lib/format";
import {
  DEFAULT_TIMEZONE,
  DURATIONS,
  RANGES,
  TIMEZONES,
} from "@/lib/plan-options";
import { buttonClasses, shellClasses } from "@/lib/ui";
import { type CreatePlanState, createPlanAction } from "@/server/actions";

const legend = "font-extrabold text-xs uppercase tracking-[0.06em]";
const chip =
  "flex min-h-11 cursor-pointer items-center justify-center rounded-sign border-[1.5px] border-rule-strong bg-white px-3 font-bold text-[0.9375rem] has-checked:border-ink has-checked:bg-ink has-checked:text-white has-focus-visible:outline-3 has-focus-visible:outline-line-blue has-focus-visible:outline-offset-2";

export function CreatePlanForm({ needsName }: { readonly needsName: boolean }) {
  const [state, action, pending] = useActionState<CreatePlanState, FormData>(
    createPlanAction,
    {
      error: null,
    },
  );
  const error = state.error
    ? t(`create.error.${state.error}` as MessageKey)
    : null;

  return (
    <form action={action} className="mt-4 space-y-5" noValidate>
      <div>
        <label htmlFor="title" className={legend}>
          {t("create.field.title")}
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={80}
          placeholder={t("create.field.title.placeholder")}
          aria-invalid={state.error === "INVALID_TITLE"}
          className="mt-1.5 block min-h-12 w-full rounded-sign border-[1.5px] border-ink bg-white px-3 font-bold text-lg"
        />
      </div>

      {needsName ? (
        <div>
          <label htmlFor="name" className={legend}>
            {t("create.field.name")}
          </label>
          <input
            id="name"
            name="name"
            required
            maxLength={60}
            autoComplete="given-name"
            aria-describedby="name-hint"
            aria-invalid={state.error === "INVALID_NAME"}
            className="mt-1.5 block min-h-12 w-full rounded-sign border-[1.5px] border-ink bg-white px-3 text-lg"
          />
          <p id="name-hint" className="mt-1 text-mute text-sm">
            {t("create.field.name.hint")}
          </p>
        </div>
      ) : null}

      <fieldset>
        <legend className={legend}>{t("create.field.range")}</legend>
        <div className="mt-1.5 grid grid-cols-3 gap-1.5">
          {RANGES.map((range) => (
            <label
              key={range.key}
              className={`${chip} text-center leading-tight`}
            >
              <input
                type="radio"
                name="range"
                value={range.key}
                defaultChecked={range.key === "twoWeeks"}
                className="sr-only"
              />
              {t(range.label)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={legend}>{t("create.field.duration")}</legend>
        <div className="mt-1.5 grid grid-cols-4 gap-1.5">
          {DURATIONS.map((minutes) => (
            <label key={minutes} className={chip}>
              <input
                type="radio"
                name="duration"
                value={minutes}
                defaultChecked={minutes === 180}
                className="sr-only"
              />
              {formatDuration(minutes)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={legend}>{t("create.field.mode")}</legend>
        <div className="mt-1.5 space-y-1.5">
          {(["busy", "free"] as const).map((mode) => (
            <label
              key={mode}
              className="flex min-h-11 cursor-pointer items-start gap-2.5 rounded-sign border-[1.5px] border-rule-strong px-3 py-2.5 has-checked:border-ink has-focus-visible:outline-3 has-focus-visible:outline-line-blue"
            >
              <input
                type="radio"
                name="mode"
                value={mode}
                defaultChecked={mode === "busy"}
                className="mt-1 size-4 accent-ink"
              />
              <span>
                <span className="block font-bold">
                  {t(`create.mode.${mode}`)}
                </span>
                <span className="block text-mute text-sm">
                  {t(`create.mode.${mode}.hint`)}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="timezone" className={legend}>
          {t("create.field.timezone")}
        </label>
        <select
          id="timezone"
          name="timezone"
          defaultValue={DEFAULT_TIMEZONE}
          className="mt-1.5 block min-h-12 w-full rounded-sign border-[1.5px] border-rule-strong bg-white px-3"
        >
          {TIMEZONES.map((zone) => (
            <option key={zone} value={zone}>
              {t(`timezone.${zone}` as MessageKey)}
            </option>
          ))}
        </select>
      </div>

      <div className={`${shellClasses.footer}`}>
        {error ? (
          <p role="alert" className="mb-2 font-bold text-danger text-sm">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className={buttonClasses.primary}
        >
          {t("create.submit")}
        </button>
      </div>
    </form>
  );
}
