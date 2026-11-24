import type { Metadata } from "next";
import Image from "next/image";
import { t } from "@/i18n/t";
import { threadColor } from "@/lib/lines";
import { buttonClasses, shellClasses } from "@/lib/ui";

export const metadata: Metadata = {
  title: t("offline.title"),
  robots: { index: false },
};

/**
 * Static page the service worker serves when a navigation fails offline.
 * A plain link, not a script, so it works with no network at all.
 */
export default function Offline() {
  return (
    <main className={`${shellClasses.narrow} flex flex-col pt-4`}>
      {/* Unoptimized: a plain static file the service worker keeps for offline. */}
      <Image
        src="/brand/knot-lockup.webp"
        alt={t("app.name")}
        width={99}
        height={40}
        unoptimized
        priority
        className="h-10 w-auto self-start"
      />
      <div className="mt-10 flex w-44 flex-col gap-1.5" aria-hidden="true">
        <div className="relative flex h-2 items-center">
          <span className="h-0.5 w-full rounded-full bg-rule" />
          <span
            className="yarn absolute left-0 h-2 w-16 rounded-full"
            style={{ backgroundColor: threadColor(0).value }}
          />
          <span className="thread-loose absolute right-0 left-[4.5rem] h-0.5" />
        </div>
        <div className="relative flex h-2 items-center">
          <span className="h-0.5 w-full rounded-full bg-rule" />
          <span
            className="yarn absolute left-0 h-2 w-10 rounded-full"
            style={{ backgroundColor: threadColor(1).value }}
          />
          <span className="thread-loose absolute right-0 left-12 h-0.5" />
        </div>
      </div>
      <h1 className="mt-6 font-extrabold text-[2rem] leading-tight">
        {t("offline.title")}
      </h1>
      <p className="mt-2 text-lg text-mute">{t("offline.body")}</p>
      <div className="mt-auto pt-8 pb-[max(1.125rem,env(safe-area-inset-bottom))]">
        <a href="/" className={buttonClasses.primary}>
          {t("offline.retry")}
        </a>
      </div>
    </main>
  );
}
