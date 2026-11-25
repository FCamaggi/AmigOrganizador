"use client";

import { useEffect } from "react";
import { t } from "@/i18n/t";
import { buttonClasses, shellClasses } from "@/lib/ui";

/**
 * Any unexpected failure lands here instead of a blank or frozen screen:
 * a plain message and one way forward.
 */
export default function AppError({
  error,
  retry,
}: {
  readonly error: unknown;
  readonly retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className={shellClasses.narrow}>
      <h1 className="mt-10 font-extrabold text-[1.75rem] leading-tight">
        {t("error.title")}
      </h1>
      <p role="alert" className="mt-1.5 text-mute">
        {t("error.body")}
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className={`${buttonClasses.primary} mt-6`}
      >
        {t("error.retry")}
      </button>
    </main>
  );
}
