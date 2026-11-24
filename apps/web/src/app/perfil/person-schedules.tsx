"use client";

import Link from "next/link";
import { useActionState } from "react";
import { type MessageKey, t } from "@/i18n/t";
import { buttonClasses } from "@/lib/ui";
import {
  createScheduleAction,
  duplicateScheduleAction,
  type PersonNameState,
  removeScheduleAction,
  renameScheduleAction,
  type ScheduleActionState,
  savePersonNameAction,
  setDefaultScheduleAction,
} from "@/server/group-actions";

const fieldLabel = "font-bold text-sm text-ink";

export interface ScheduleSummary {
  readonly id: string;
  readonly name: string;
  readonly isDefault: boolean;
  readonly groups: readonly string[];
  readonly href: string;
}

interface PersonSchedulesProps {
  readonly displayName: string;
  readonly schedules: readonly ScheduleSummary[];
  readonly activeScheduleId: string;
  readonly activeScheduleName: string;
  readonly activeIsDefault: boolean;
  readonly next: string | null;
}

export function PersonSchedules({
  displayName,
  schedules,
  activeScheduleId,
  activeScheduleName,
  activeIsDefault,
  next,
}: PersonSchedulesProps) {
  const [nameState, nameAction, namePending] = useActionState<
    PersonNameState,
    FormData
  >(savePersonNameAction, { error: null, saved: false });

  const [createState, createAction, createPending] = useActionState<
    ScheduleActionState,
    FormData
  >(createScheduleAction, { error: null });

  const [renameState, renameAction, renamePending] = useActionState<
    ScheduleActionState,
    FormData
  >(renameScheduleAction, { error: null });

  const [removeState, removeAction, removePending] = useActionState<
    ScheduleActionState,
    FormData
  >(removeScheduleAction, { error: null });

  return (
    <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-stretch lg:gap-x-10">
      <div className="min-w-0 rounded-cloth border border-rule bg-surface p-4">
        <form action={nameAction} noValidate>
          <label htmlFor="person-display-name" className={fieldLabel}>
            {t("profileEdit.name.label")}
          </label>
          <p className="mt-0.5 text-mute text-sm">
            {t("profileEdit.name.hint")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              id="person-display-name"
              name="displayName"
              defaultValue={displayName}
              required
              maxLength={60}
              aria-invalid={nameState.error !== null}
              className="min-h-12 min-w-0 flex-1 rounded-cloth border-[1.5px] border-ink bg-surface px-3 font-bold text-lg"
            />
            <button
              type="submit"
              disabled={namePending}
              className={`${buttonClasses.secondary} min-w-fit flex-none px-4`}
            >
              {t("profileEdit.name.save")}
            </button>
          </div>
          {nameState.error ? (
            <p role="alert" className="mt-1.5 font-bold text-danger text-sm">
              {t(`profileEdit.name.error.${nameState.error}` as MessageKey)}
            </p>
          ) : null}
          {nameState.saved ? (
            <p aria-live="polite" className="mt-1.5 font-bold text-sm">
              {t("profileEdit.name.saved")}
            </p>
          ) : null}
        </form>
      </div>

      <section
        aria-labelledby="schedules-heading"
        className="min-w-0 rounded-cloth border border-rule bg-surface p-4"
      >
        <h2 id="schedules-heading" className="font-extrabold text-lg">
          {t("profileEdit.schedules.title")}
        </h2>
        <p className="mt-0.5 text-mute text-sm">
          {t("profileEdit.schedules.hint")}
        </p>

        <ul className="mt-2.5 divide-y divide-rule border-rule border-y">
          {schedules.map((item) => {
            const selected = item.id === activeScheduleId;
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  aria-current={selected ? "page" : undefined}
                  className={`flex min-h-12 items-center justify-between gap-2 px-2 py-2 no-underline ${
                    selected ? "bg-panel font-extrabold" : "hover:bg-panel/60"
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate font-extrabold text-[1rem]">
                        {item.name}
                      </span>
                      {item.isDefault ? (
                        <span className="rounded-knot border border-ink bg-panel px-1.5 py-px font-bold text-caption">
                          {t("profileEdit.schedules.defaultBadge")}
                        </span>
                      ) : null}
                    </span>
                    <span className="block text-mute text-xs">
                      {item.groups.length > 0
                        ? t("profileEdit.schedules.usedBy", {
                            groups: item.groups.join(", "),
                          })
                        : t("profileEdit.schedules.unused")}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <form action={renameAction} className="mt-3" noValidate>
          <input type="hidden" name="scheduleId" value={activeScheduleId} />
          <label htmlFor="schedule-rename-input" className={fieldLabel}>
            {t("profileEdit.schedules.rename.label")}
          </label>
          <div className="mt-1 flex flex-wrap gap-2">
            <input
              id="schedule-rename-input"
              name="name"
              key={activeScheduleId}
              defaultValue={activeScheduleName}
              required
              maxLength={40}
              className="min-h-11 min-w-0 flex-1 rounded-cloth border-[1.5px] border-rule-strong bg-surface px-3 font-bold"
            />
            <button
              type="submit"
              disabled={renamePending}
              className={`${buttonClasses.secondary} min-w-fit flex-none`}
            >
              {t("profileEdit.schedules.rename.submit")}
            </button>
          </div>
          {renameState.error ? (
            <p role="alert" className="mt-1 font-bold text-danger text-sm">
              {t(
                `profileEdit.schedules.error.${renameState.error}` as MessageKey,
              )}
            </p>
          ) : null}
        </form>

        <div className="mt-2.5 flex flex-wrap gap-2">
          <form
            action={duplicateScheduleAction.bind(null, activeScheduleId, next)}
          >
            <button
              type="submit"
              className={`${buttonClasses.secondary} min-w-fit`}
            >
              {t("profileEdit.schedules.duplicate")}
            </button>
          </form>
          {!activeIsDefault ? (
            <form
              action={setDefaultScheduleAction.bind(null, activeScheduleId)}
            >
              <button
                type="submit"
                className={`${buttonClasses.secondary} min-w-fit`}
              >
                {t("profileEdit.schedules.makeDefault")}
              </button>
            </form>
          ) : null}
          <form action={removeAction}>
            <input type="hidden" name="scheduleId" value={activeScheduleId} />
            {next ? <input type="hidden" name="next" value={next} /> : null}
            <button
              type="submit"
              disabled={removePending}
              className={`${buttonClasses.secondary} min-w-fit`}
            >
              {t("profileEdit.schedules.delete")}
            </button>
          </form>
        </div>
        {removeState.error ? (
          <p role="alert" className="mt-1.5 font-bold text-danger text-sm">
            {t(
              `profileEdit.schedules.error.${removeState.error}` as MessageKey,
            )}
          </p>
        ) : null}

        <form
          action={createAction}
          className="mt-3 border-rule border-t pt-3"
          noValidate
        >
          {next ? <input type="hidden" name="next" value={next} /> : null}
          <label htmlFor="schedule-new-input" className={fieldLabel}>
            {t("profileEdit.schedules.new.label")}
          </label>
          <div className="mt-1 flex flex-wrap gap-2">
            <input
              id="schedule-new-input"
              name="name"
              required
              maxLength={40}
              placeholder={t("profileEdit.schedules.new.placeholder")}
              className="min-h-11 min-w-0 flex-1 rounded-cloth border-[1.5px] border-ink bg-surface px-3"
            />
            <button
              type="submit"
              disabled={createPending}
              className={`${buttonClasses.secondary} min-w-fit flex-none`}
            >
              {t("profileEdit.schedules.new.submit")}
            </button>
          </div>
          {createState.error ? (
            <p role="alert" className="mt-1 font-bold text-danger text-sm">
              {t(
                `profileEdit.schedules.error.${createState.error}` as MessageKey,
              )}
            </p>
          ) : null}
        </form>
      </section>
    </div>
  );
}
