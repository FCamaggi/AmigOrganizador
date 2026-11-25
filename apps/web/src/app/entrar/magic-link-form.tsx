"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Shuttle } from "@/components/shuttle";
import { t } from "@/i18n/t";
import { buttonClasses } from "@/lib/ui";
import {
  type EmailCodeState,
  sendSignInCode,
  verifySignInCode,
} from "@/server/actions";

const field =
  "mt-1 block min-h-12 w-full rounded-cloth border-[1.5px] border-ink bg-surface px-3 text-lg";

/**
 * Email sign-in in two steps: name and email, then the 6-digit code from
 * the email. The code step keeps the email so "Mandar otro código" works.
 */
export function MagicLinkForm({ next }: { readonly next: string }) {
  const [sendState, send, sending] = useActionState<EmailCodeState, FormData>(
    sendSignInCode,
    { status: "idle", email: "" },
  );
  const [verifyState, verify, verifying] = useActionState<
    EmailCodeState,
    FormData
  >(verifySignInCode, { status: "idle", email: "" });
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const codeRef = useRef<HTMLInputElement>(null);
  const codeStep = sendState.status === "sent" && !editing;

  // Moving to the code step puts the cursor in the code field.
  useEffect(() => {
    if (codeStep) codeRef.current?.focus();
  }, [codeStep]);

  const verifyError =
    verifyState.status === "badCode"
      ? t("signin.code.bad")
      : verifyState.status === "rateLimited"
        ? t("signin.rateLimited")
        : verifyState.status === "failed"
          ? t("signin.verifyFailed")
          : null;

  if (codeStep) {
    return (
      <section aria-live="polite" className="mt-1">
        <h2 className="font-extrabold text-lg">{t("signin.code.title")}</h2>
        <p className="mt-1 text-mute">
          {t("signin.code.body", { email: sendState.email })}
        </p>
        <form action={verify} className="mt-4">
          <input type="hidden" name="email" value={sendState.email} />
          <input type="hidden" name="next" value={next} />
          <label htmlFor="code" className="font-bold text-sm">
            {t("signin.code.label")}
          </label>
          <input
            id="code"
            name="code"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]{6,7}"
            maxLength={7}
            ref={codeRef}
            aria-invalid={verifyError !== null}
            aria-describedby={verifyError ? "code-error" : "code-hint"}
            className={`${field} text-center font-extrabold text-2xl tracking-[0.4em]`}
          />
          {verifyError ? (
            <p
              id="code-error"
              role="alert"
              className="mt-1 font-bold text-danger text-sm"
            >
              {verifyError}
            </p>
          ) : (
            <p id="code-hint" className="mt-1 text-mute text-sm">
              {t("signin.code.spam")}
            </p>
          )}
          <button
            type="submit"
            disabled={verifying}
            aria-busy={verifying}
            className={`${buttonClasses.primary} mt-3`}
          >
            {verifying ? <Shuttle /> : null}
            {verifying ? t("signin.verifying") : t("signin.code.submit")}
          </button>
        </form>
        <div className="mt-2 flex flex-wrap justify-center gap-x-4">
          <form action={send}>
            <input type="hidden" name="email" value={sendState.email} />
            <input type="hidden" name="name" value={name} />
            <input type="hidden" name="next" value={next} />
            <button
              type="submit"
              disabled={sending}
              className="flex min-h-11 items-center font-bold text-indigo text-sm underline"
            >
              {t("signin.code.resend")}
            </button>
          </form>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex min-h-11 items-center font-bold text-indigo text-sm underline"
          >
            {t("signin.code.change")}
          </button>
        </div>
      </section>
    );
  }

  const error =
    sendState.status === "invalid"
      ? t("signin.invalid")
      : sendState.status === "rateLimited"
        ? t("signin.rateLimited")
        : sendState.status === "failed"
          ? t("signin.failed")
          : null;
  return (
    <form
      action={(formData) => {
        setEditing(false);
        send(formData);
      }}
      className="mt-1"
    >
      <input type="hidden" name="next" value={next} />
      <label htmlFor="name" className="font-bold text-sm">
        {t("signin.name")}
      </label>
      <input
        id="name"
        name="name"
        required
        maxLength={60}
        autoComplete="given-name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        className={field}
      />
      <label htmlFor="email" className="mt-3 block font-bold text-sm">
        {t("signin.email")}
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        placeholder={t("signin.email.placeholder")}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        aria-invalid={error !== null}
        aria-describedby={error ? "email-error" : undefined}
        className={field}
      />
      {error ? (
        <p
          id="email-error"
          role="alert"
          className="mt-1 font-bold text-danger text-sm"
        >
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={sending}
        aria-busy={sending}
        className={`${buttonClasses.primary} mt-3`}
      >
        {sending ? <Shuttle /> : null}
        {sending ? t("signin.sending") : t("signin.magic")}
      </button>
    </form>
  );
}
