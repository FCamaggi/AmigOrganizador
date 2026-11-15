"use client";

import { useActionState } from "react";
import { t } from "@/i18n/t";
import { buttonClasses } from "@/lib/ui";
import { type SignInState, signIn } from "@/server/actions";

export function SignInForm({ next }: { readonly next: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(
    signIn,
    { error: false },
  );
  return (
    <form action={action} className="mt-3">
      <input type="hidden" name="next" value={next} />
      <label htmlFor="name" className="font-bold text-sm">
        {t("signin.local.name")}
      </label>
      <input
        id="name"
        name="name"
        required
        maxLength={60}
        autoComplete="given-name"
        aria-invalid={state.error}
        aria-describedby={state.error ? "name-error" : undefined}
        className="mt-1 block min-h-12 w-full rounded-sign border-[1.5px] border-ink bg-white px-3 text-lg"
      />
      {state.error ? (
        <p id="name-error" className="mt-1 font-bold text-danger text-sm">
          {t("signin.local.error")}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className={`${buttonClasses.primary} mt-3`}
      >
        {t("signin.local.submit")}
      </button>
    </form>
  );
}
