"use client";

import { useEffect, useId, useRef } from "react";
import { t } from "@/i18n/t";

interface SheetProps {
  readonly open: boolean;
  readonly title: string;
  readonly onClose: () => void;
  readonly children: React.ReactNode;
  readonly footer?: React.ReactNode;
}

/**
 * Native modal sheet backed by `<dialog>.showModal()`: bottom sheet on
 * phones, centred panel from `sm` up, Esc and backdrop close, focus restored
 * to the triggering control on dismiss.
 */
export function Sheet({ open, title, onClose, children, footer }: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.contains(document.activeElement)) {
        openerRef.current =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
      }
      if (!dialog.open) {
        dialog.showModal();
      }
      return;
    }

    if (dialog.open) {
      dialog.close();
    }
    const opener = openerRef.current;
    openerRef.current = null;
    if (opener?.isConnected) {
      opener.focus();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
        }
      }}
      className="fixed inset-0 m-0 hidden h-dvh max-h-none w-screen max-w-none flex-col justify-end bg-transparent p-0 backdrop:bg-ink/45 open:flex sm:items-center sm:justify-center sm:p-6"
    >
      <div className="flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-cloth border-ink border-t-[1.5px] bg-surface text-ink sm:max-h-[85dvh] sm:max-w-lg sm:rounded-cloth sm:border-[1.5px]">
        <header className="flex flex-none items-center justify-between gap-3 border-rule border-b px-4 py-2.5 sm:px-5">
          <h2 id={titleId} className="font-extrabold text-lg leading-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("profileEdit.sheet.close")}
            className="-mr-1.5 grid size-11 flex-none place-items-center rounded-cloth text-ink hover:bg-panel"
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4">
              <path
                d="M3.5 3.5 12.5 12.5M12.5 3.5 3.5 12.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          {children}
        </div>

        {footer ? (
          <footer className="flex flex-none flex-wrap items-center gap-2 border-rule border-t bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
            {footer}
          </footer>
        ) : null}
      </div>
    </dialog>
  );
}
