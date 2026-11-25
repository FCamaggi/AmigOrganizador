"use client";

import { useState } from "react";
import { t } from "@/i18n/t";
import { buttonClasses } from "@/lib/ui";

const secondary = `${buttonClasses.secondary} min-w-fit`;

/** Opens WhatsApp with a ready message. */
export function WhatsAppLink({
  text,
  label,
  primary = false,
  className = "",
}: {
  readonly text: string;
  readonly label: string;
  /** The screen's one primary action (madder). */
  readonly primary?: boolean;
  readonly className?: string;
}) {
  return (
    <a
      className={`${primary ? buttonClasses.primary : secondary} ${className}`}
      href={`https://wa.me/?text=${encodeURIComponent(text)}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {label}
    </a>
  );
}

/** Native share sheet when available, otherwise copies the link. */
export function ShareButton({
  url,
  text,
  quiet = false,
}: {
  readonly url: string;
  readonly text: string;
  /** A text-weight "Copiar link" beside a primary invite. */
  readonly quiet?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const absolute = new URL(url, window.location.origin).toString();
    if (navigator.share) {
      try {
        await navigator.share({ url: absolute, text });
        return;
      } catch {
        // Cancelled or blocked: fall back to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t("actions.share"), absolute);
    }
  }
  return (
    <button
      type="button"
      className={
        quiet
          ? "flex min-h-11 items-center justify-center px-3 font-bold text-indigo text-sm underline"
          : secondary
      }
      onClick={share}
      aria-live="polite"
    >
      {copied
        ? t("actions.copied")
        : t(quiet ? "actions.copyLink" : "actions.share")}
    </button>
  );
}
