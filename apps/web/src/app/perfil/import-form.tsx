"use client";

import { useActionState } from "react";
import { Shuttle } from "@/components/shuttle";
import { type MessageKey, t } from "@/i18n/t";
import { buttonClasses } from "@/lib/ui";
import { type ImportState, importCalendarAction } from "@/server/group-actions";

const fieldLabel = "font-bold text-sm text-ink";

/** Adds a calendar by its ICS link (S4). The link is never shown back. */
export function ImportForm({
  scheduleId = "default",
}: {
  readonly scheduleId?: string;
}) {
  const [state, action, pending] = useActionState<ImportState, FormData>(
    importCalendarAction,
    {
      error: null,
    },
  );
  return (
    <form action={action} className="mt-3 space-y-2.5">
      <input type="hidden" name="scheduleId" value={scheduleId} />
      <div>
        <label htmlFor="import-name" className={fieldLabel}>
          {t("profileEdit.import.name")}
        </label>
        <input
          id="import-name"
          name="name"
          required
          maxLength={40}
          placeholder={t("profileEdit.import.name.placeholder")}
          className="mt-1 block min-h-12 w-full rounded-cloth border-[1.5px] border-ink bg-surface px-3"
        />
      </div>
      <div>
        <label htmlFor="import-url" className={fieldLabel}>
          {t("profileEdit.import.url")}
        </label>
        <input
          id="import-url"
          name="url"
          type="url"
          required
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://calendar.google.com/…/basic.ics"
          aria-invalid={state.error !== null}
          aria-describedby={state.error ? "import-error" : undefined}
          className="mt-1 block min-h-12 w-full rounded-cloth border-[1.5px] border-ink bg-surface px-3"
        />
      </div>
      {state.error ? (
        <p
          id="import-error"
          role="alert"
          className="font-bold text-danger text-sm"
        >
          {t(`profileEdit.import.error.${state.error}` as MessageKey)}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className={buttonClasses.secondary}
      >
        {pending ? <Shuttle /> : null}
        {t("profileEdit.import.submit")}
      </button>
    </form>
  );
}
