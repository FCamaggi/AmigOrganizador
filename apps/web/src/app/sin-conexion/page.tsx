import type { Metadata } from "next";
import { t } from "@/i18n/t";
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
      <p className="font-extrabold text-lg">{t("app.name")}</p>
      <div className="mt-10 flex items-center gap-2" aria-hidden="true">
        <span className="h-1.5 w-16 rounded-full bg-line-red" />
        <span className="size-4 rounded-full border-[4px] border-ink bg-surface" />
        <span className="h-1.5 w-16 rounded-full border border-rule-strong border-dashed" />
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
