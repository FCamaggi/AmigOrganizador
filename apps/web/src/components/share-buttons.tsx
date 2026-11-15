"use client";

import { useState } from "react";
import { t } from "@/i18n/t";
import { buttonClasses } from "@/lib/ui";

const secondary = buttonClasses.secondary;

/** Opens WhatsApp with a ready message. */
export function WhatsAppLink({
  text,
  label,
}: {
  readonly text: string;
  readonly label: string;
}) {
  return (
    <a
      className={secondary}
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
}: {
  readonly url: string;
  readonly text: string;
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
      className={secondary}
      onClick={share}
      aria-live="polite"
    >
      {copied ? t("actions.copied") : t("actions.share")}
    </button>
  );
}
