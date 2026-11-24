"use client";

import { THREAD_COLORS, type ThreadColor } from "@amigo/core";
import { useActionState, useEffect, useRef, useState } from "react";
import { t } from "@/i18n/t";
import { threadColor, threadSlot } from "@/lib/lines";
import {
  saveThreadColorAction,
  type ThreadColorState,
} from "@/server/group-actions";
import { Sheet } from "./sheet";

interface LocalState extends ThreadColorState {
  readonly seq: number;
}

/**
 * The person's thread colour (S9): a swatch next to their name opens a
 * sheet with the palette. With no choice each group hands out a free colour.
 * The sheet says a group may show another colour when someone who joined
 * earlier already has it.
 */
export function ThreadPicker({
  chosen,
}: {
  readonly chosen: ThreadColor | null;
}) {
  const [open, setOpen] = useState(false);
  const lastSeq = useRef(0);
  const [state, action, pending] = useActionState<LocalState, FormData>(
    async (prev, formData) => ({
      ...(await saveThreadColorAction(prev, formData)),
      seq: prev.seq + 1,
    }),
    { error: null, saved: false, seq: 0 },
  );

  useEffect(() => {
    if (state.seq === lastSeq.current) return;
    lastSeq.current = state.seq;
    if (state.saved) setOpen(false);
  }, [state]);

  const current = chosen ? t(`thread.${chosen}`) : t("profileEdit.thread.auto");

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={t("profileEdit.thread.trigger", { color: current })}
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-knot px-2.5 font-bold text-ink text-sm hover:bg-panel"
      >
        {chosen ? (
          <span
            aria-hidden="true"
            className="yarn h-3 w-7 flex-none rounded-full"
            style={{ backgroundColor: threadColor(threadSlot(chosen)).value }}
          />
        ) : (
          <span
            aria-hidden="true"
            className="thread-loose h-0.5 w-7 flex-none"
          />
        )}
        <span>{t("profileEdit.thread.label")}</span>
      </button>

      <Sheet
        open={open}
        title={t("profileEdit.thread.title")}
        onClose={() => setOpen(false)}
        footer={
          <button
            type="submit"
            form="thread-color-form"
            disabled={pending}
            className="flex min-h-11 flex-1 items-center justify-center rounded-cloth bg-ink px-4 font-extrabold text-[0.9375rem] text-surface hover:opacity-90 disabled:opacity-60"
          >
            {t("profileEdit.thread.save")}
          </button>
        }
      >
        <form id="thread-color-form" action={action}>
          <fieldset>
            <legend className="text-mute text-sm">
              {t("profileEdit.thread.hint")}
            </legend>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {THREAD_COLORS.map((name, slot) => (
                <label
                  key={name}
                  className="flex min-h-12 cursor-pointer items-center gap-2.5 rounded-cloth border-[1.5px] border-rule-strong bg-surface px-3 font-bold text-[0.9375rem] has-checked:border-ink has-checked:ring-2 has-checked:ring-ink has-focus-visible:outline-3 has-focus-visible:outline-indigo"
                >
                  <input
                    type="radio"
                    name="threadColor"
                    value={name}
                    defaultChecked={chosen === name}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className="yarn h-3.5 w-9 flex-none rounded-full"
                    style={{ backgroundColor: threadColor(slot).value }}
                  />
                  <span className="capitalize">{t(`thread.${name}`)}</span>
                </label>
              ))}
              <label className="flex min-h-12 cursor-pointer items-center gap-2.5 rounded-cloth border-[1.5px] border-rule-strong bg-surface px-3 font-bold text-[0.9375rem] has-checked:border-ink has-checked:ring-2 has-checked:ring-ink has-focus-visible:outline-3 has-focus-visible:outline-indigo">
                <input
                  type="radio"
                  name="threadColor"
                  value=""
                  defaultChecked={chosen === null}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className="thread-loose h-0.5 w-9 flex-none"
                />
                <span>{t("profileEdit.thread.auto")}</span>
              </label>
            </div>
          </fieldset>
          {state.error ? (
            <p role="alert" className="mt-3 font-bold text-danger text-sm">
              {t("profileEdit.thread.error")}
            </p>
          ) : null}
        </form>
      </Sheet>
    </>
  );
}
