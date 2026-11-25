"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { t } from "@/i18n/t";
import { buttonClasses } from "@/lib/ui";

const DISMISSED_KEY = "amigo.installHint.dismissed";

/** Chromium's install event; not in the DOM typings yet. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Hint =
  | { kind: "hidden" }
  | { kind: "prompt"; event: BeforeInstallPromptEvent }
  | { kind: "ios" };

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    // iPadOS reports itself as a Mac with touch.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/**
 * Suggests adding the app to the home screen. Chromium hands us an install
 * prompt; iOS has none, so it gets the Share sheet steps. Hidden once
 * installed or dismissed. Renders nothing on the server.
 */
export function InstallHint() {
  const [hint, setHint] = useState<Hint>({ kind: "hidden" });

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISSED_KEY)) return;
    if (isIos()) setHint({ kind: "ios" });
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setHint({ kind: "prompt", event: event as BeforeInstallPromptEvent });
    };
    const onInstalled = () => setHint({ kind: "hidden" });
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (hint.kind === "hidden") return null;

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setHint({ kind: "hidden" });
  };
  const install = async () => {
    if (hint.kind !== "prompt") return;
    await hint.event.prompt();
    const { outcome } = await hint.event.userChoice;
    if (outcome === "accepted") setHint({ kind: "hidden" });
  };

  return (
    <section
      aria-labelledby="install-hint-title"
      className="mt-3 rounded-cloth border border-rule bg-surface px-3.5 pt-3.5 pb-1.5"
    >
      <div className="flex items-start gap-3">
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={40}
          height={40}
          className="size-10 flex-none rounded-[0.625rem]"
        />
        <div className="min-w-0 flex-1">
          <h2 id="install-hint-title" className="font-extrabold">
            {t("pwa.install.title")}
          </h2>
          <p className="text-mute text-sm">
            {hint.kind === "ios" ? t("pwa.install.ios") : t("pwa.install.body")}
          </p>
        </div>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-2 sm:pl-[3.25rem]">
        {hint.kind === "prompt" ? (
          <button
            type="button"
            onClick={install}
            className={`${buttonClasses.primary} min-h-11 min-w-fit flex-1 text-lg`}
          >
            {t("pwa.install.action")}
          </button>
        ) : null}
        <button
          type="button"
          onClick={dismiss}
          className="flex min-h-11 items-center justify-center px-2 font-bold text-indigo text-sm underline"
        >
          {t("pwa.install.dismiss")}
        </button>
      </div>
    </section>
  );
}
