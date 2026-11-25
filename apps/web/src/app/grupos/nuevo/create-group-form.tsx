"use client";

import { useActionState } from "react";
import { Shuttle } from "@/components/shuttle";
import { type MessageKey, t } from "@/i18n/t";
import { DEFAULT_TIMEZONE, TIMEZONES } from "@/lib/plan-options";
import { buttonClasses, shellClasses } from "@/lib/ui";
import {
  type CreateGroupState,
  createGroupAction,
} from "@/server/group-actions";

const fieldLabel = "font-bold text-sm text-ink";

export function CreateGroupForm({
  needsName,
}: {
  readonly needsName: boolean;
}) {
  const [state, action, pending] = useActionState<CreateGroupState, FormData>(
    createGroupAction,
    {
      error: null,
    },
  );
  return (
    <form action={action} className="mt-4 space-y-5" noValidate>
      <div>
        <label htmlFor="groupName" className={fieldLabel}>
          {t("groupNew.field.name")}
        </label>
        <input
          id="groupName"
          name="groupName"
          required
          maxLength={60}
          placeholder={t("groupNew.field.name.placeholder")}
          defaultValue={state.values?.groupName}
          aria-invalid={state.error === "INVALID_NAME"}
          className="mt-1.5 block min-h-12 w-full rounded-cloth border-[1.5px] border-ink bg-surface px-3 font-bold text-lg"
        />
      </div>
      {needsName ? (
        <div>
          <label htmlFor="name" className={fieldLabel}>
            {t("create.field.name")}
          </label>
          <input
            id="name"
            name="name"
            required
            maxLength={60}
            autoComplete="given-name"
            defaultValue={state.values?.name}
            aria-describedby="name-hint"
            className="mt-1.5 block min-h-12 w-full rounded-cloth border-[1.5px] border-ink bg-surface px-3 text-lg"
          />
          <p id="name-hint" className="mt-1 text-mute text-sm">
            {t("create.field.name.hint")}
          </p>
        </div>
      ) : null}
      <div>
        <label htmlFor="timezone" className={fieldLabel}>
          {t("create.field.timezone")}
        </label>
        <select
          id="timezone"
          name="timezone"
          defaultValue={state.values?.timezone ?? DEFAULT_TIMEZONE}
          className="mt-1.5 block min-h-12 w-full rounded-cloth border-[1.5px] border-rule-strong bg-surface px-3"
        >
          {TIMEZONES.map((zone) => (
            <option key={zone} value={zone}>
              {t(`timezone.${zone}` as MessageKey)}
            </option>
          ))}
        </select>
      </div>
      <div className={`${shellClasses.footer}`}>
        {state.error ? (
          <p role="alert" className="mb-2 font-bold text-danger text-sm">
            {t(`groupNew.error.${state.error}` as MessageKey)}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className={buttonClasses.primary}
        >
          {pending ? <Shuttle /> : null}
          {t("groupNew.submit")}
        </button>
      </div>
    </form>
  );
}
