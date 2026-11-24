"use client";

import type { ThreadColor } from "@amigo/core";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
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
import { Sheet } from "./sheet";
import { ThreadPicker } from "./thread-picker";

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
  readonly threadColor: ThreadColor | null;
  readonly schedules: readonly ScheduleSummary[];
  readonly activeScheduleId: string;
  readonly activeScheduleName: string;
  readonly activeIsDefault: boolean;
  readonly next: string | null;
}

interface LocalNameState extends PersonNameState {
  readonly seq: number;
}

export function PersonSchedules({
  displayName,
  threadColor,
  schedules,
  activeScheduleId,
  activeScheduleName,
  activeIsDefault,
  next,
}: PersonSchedulesProps) {
  const [editingName, setEditingName] = useState(false);
  const [justSavedName, setJustSavedName] = useState(false);
  const [schedulesOpen, setSchedulesOpen] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const lastSeqHandled = useRef(0);

  const [nameState, nameAction, namePending] = useActionState<
    LocalNameState,
    FormData
  >(
    async (prev, formData) => {
      const result = await savePersonNameAction(prev, formData);
      return { ...result, seq: prev.seq + 1 };
    },
    { error: null, saved: false, seq: 0 },
  );

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

  useEffect(() => {
    if (nameState.seq === lastSeqHandled.current) return;
    lastSeqHandled.current = nameState.seq;
    if (nameState.saved) {
      setEditingName(false);
      setJustSavedName(true);
    }
  }, [nameState]);

  useEffect(() => {
    if (editingName) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [editingName]);

  // Close the schedules sheet after a redirect switches the active schedule.
  useEffect(() => {
    void activeScheduleId;
    setSchedulesOpen(false);
  }, [activeScheduleId]);

  return (
    <>
      <header className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
          <h1 className="font-extrabold text-[1.75rem] leading-[1.25]">
            {t("profileEdit.title")}
          </h1>

          {editingName ? (
            <form
              action={nameAction}
              noValidate
              className="flex flex-wrap items-center gap-2"
            >
              <label htmlFor="person-display-name" className="sr-only">
                {t("profileEdit.name.label")}
              </label>
              <input
                ref={nameInputRef}
                id="person-display-name"
                name="displayName"
                defaultValue={displayName}
                required
                maxLength={60}
                aria-invalid={nameState.error !== null}
                className="min-h-11 w-44 max-w-full rounded-cloth border-[1.5px] border-ink bg-surface px-3 font-bold"
              />
              <button
                type="submit"
                disabled={namePending}
                className={`${buttonClasses.secondary} flex-none px-3 text-sm`}
              >
                {t("profileEdit.name.save")}
              </button>
              <button
                type="button"
                onClick={() => setEditingName(false)}
                className="min-h-11 rounded-knot px-2.5 font-bold text-mute text-sm hover:bg-panel"
              >
                {t("profileEdit.name.cancel")}
              </button>
              {nameState.error ? (
                <p
                  role="alert"
                  className="w-full font-bold text-danger text-sm"
                >
                  {t(`profileEdit.name.error.${nameState.error}` as MessageKey)}
                </p>
              ) : null}
            </form>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setJustSavedName(false);
                  setEditingName(true);
                }}
                aria-label={t("profileEdit.name.edit", { name: displayName })}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-knot px-2.5 font-bold text-base text-ink hover:bg-panel"
              >
                <span className="max-w-48 truncate">{displayName}</span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  className="size-4 flex-none text-mute"
                >
                  <path
                    d="M11.5 2.5a1.4 1.4 0 0 1 2 2L5.2 12.8l-2.7.7.7-2.7 8.3-8.3Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {justSavedName ? (
                <p aria-live="polite" className="font-bold text-mute text-sm">
                  {t("profileEdit.name.saved")}
                </p>
              ) : null}
            </div>
          )}
          <ThreadPicker chosen={threadColor} />
        </div>

        <button
          type="button"
          aria-haspopup="dialog"
          aria-label={t("profileEdit.schedules.trigger", {
            name: activeScheduleName,
          })}
          onClick={() => setSchedulesOpen(true)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-cloth border-[1.5px] border-ink bg-surface px-3 font-bold text-[0.9375rem] text-ink hover:bg-panel"
        >
          <span className="max-w-44 truncate">{activeScheduleName}</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="size-4 flex-none"
          >
            <path
              d="M4 6l4 4 4-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </header>

      <Sheet
        open={schedulesOpen}
        title={t("profileEdit.schedules.title")}
        onClose={() => setSchedulesOpen(false)}
        footer={
          <button
            type="button"
            onClick={() => setSchedulesOpen(false)}
            className="flex min-h-11 flex-1 items-center justify-center rounded-cloth bg-ink px-4 font-extrabold text-[0.9375rem] text-surface hover:opacity-90"
          >
            {t("profileEdit.sheet.done")}
          </button>
        }
      >
        <p className="text-mute text-sm">{t("profileEdit.schedules.hint")}</p>

        <ul className="mt-3 divide-y divide-rule border-rule border-y">
          {schedules.map((item) => {
            const selected = item.id === activeScheduleId;
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  aria-current={selected ? "page" : undefined}
                  onClick={() => setSchedulesOpen(false)}
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

        <form action={renameAction} className="mt-4" noValidate>
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

        <div className="mt-3 flex flex-wrap gap-2">
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
          className="mt-4 border-rule border-t pt-4"
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
      </Sheet>
    </>
  );
}
