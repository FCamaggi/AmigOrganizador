"use client";

import { useActionState, useState } from "react";
import { t } from "@/i18n/t";
import { buttonClasses } from "@/lib/ui";
import { type MagicLinkState, sendMagicLink } from "@/server/actions";

const field =
  "mt-1 block min-h-12 w-full rounded-cloth border-[1.5px] border-ink bg-surface px-3 text-lg";

export function MagicLinkForm({ next }: { readonly next: string }) {
  const [state, action, pending] = useActionState<MagicLinkState, FormData>(
    sendMagicLink,
    { status: "idle" },
  );
  const [email, setEmail] = useState("");

  if (state.status === "sent") {
    return (
      <section
        aria-live="polite"
        className="mt-5 rounded-cloth border border-rule-strong bg-surface p-4"
      >
        <h2 className="font-extrabold text-lg">{t("signin.sent.title")}</h2>
        <p className="mt-1 text-mute text-sm">
          {t("signin.sent.body", { email })}
        </p>
      </section>
    );
  }

  const error =
    state.status === "invalid"
      ? t("signin.invalid")
      : state.status === "failed"
        ? t("signin.failed")
        : null;
  return (
    <form action={action} className="mt-1">
      <input type="hidden" name="next" value={next} />
      <label htmlFor="name" className="font-bold text-sm">
        {t("signin.name")}
      </label>
      <input
        id="name"
        name="name"
        maxLength={60}
        autoComplete="given-name"
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
        <p id="email-error" className="mt-1 font-bold text-danger text-sm">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className={`${buttonClasses.primary} mt-3`}
      >
        {t("signin.magic")}
      </button>
    </form>
  );
}
