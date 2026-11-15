import Link from "next/link";
import { Suspense } from "react";
import { type MessageKey, t } from "@/i18n/t";
import { formatShortDate } from "@/lib/format";
import { lineColor } from "@/lib/lines";
import { buttonClasses } from "@/lib/ui";
import { signOut } from "@/server/actions";
import { plans } from "@/server/repository";
import { getSession } from "@/server/session";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pt-4">
      <p className="flex items-baseline gap-2 font-extrabold text-lg">
        {t("app.name")}
        <span className="rounded-chip border border-ink px-1 font-bold text-[0.6875rem] uppercase">
          {t("app.beta")}
        </span>
      </p>
      <Suspense
        fallback={
          <div
            aria-hidden="true"
            className="mt-6 h-64 animate-pulse rounded-sign bg-panel"
          />
        }
      >
        <HomeContent />
      </Suspense>
    </main>
  );
}

async function HomeContent() {
  const session = await getSession();
  if (!session) {
    return (
      <>
        <h1 className="mt-10 text-balance font-extrabold text-[2.5rem] leading-[1.05]">
          {t("home.signedOut.title")}
        </h1>
        <p className="mt-3 text-lg text-mute">{t("home.signedOut.body")}</p>
        <HomeLines />
        <div className="mt-auto pt-8 pb-[max(1.125rem,env(safe-area-inset-bottom))]">
          <Link href="/nuevo" className={buttonClasses.primary}>
            {t("home.create")}
          </Link>
        </div>
      </>
    );
  }

  const mine = await plans().listForAccount(session.accountId);
  return (
    <>
      <div className="mt-6 flex items-baseline justify-between">
        <h1 className="font-extrabold text-[1.75rem]">{t("home.title")}</h1>
        <form action={signOut}>
          <button
            type="submit"
            className="min-h-11 px-1 font-bold text-line-blue text-sm underline"
          >
            {t("signin.signOut")}
          </button>
        </form>
      </div>
      <p className="text-mute text-sm">
        {t("signin.as", { name: session.displayName })}
      </p>

      {mine.length === 0 ? (
        <div className="mt-6 rounded-sign border border-rule border-dashed px-3 py-4">
          <p className="font-extrabold">{t("home.empty.title")}</p>
          <p className="mt-1 text-mute text-sm">{t("home.empty.body")}</p>
        </div>
      ) : (
        <ul className="mt-4 border-rule border-t">
          {mine.map((plan, index) => {
            const answered = plan.participants.filter(
              (p) => p.answer !== null,
            ).length;
            return (
              <li key={plan.id}>
                <Link
                  href={`/p/${plan.id}`}
                  className="flex min-h-16 items-center gap-3 border-rule border-b py-3 no-underline"
                >
                  <span
                    aria-hidden="true"
                    className="size-[1.375rem] flex-none rounded-full border-[5px] bg-white"
                    style={{ borderColor: lineColor(index).value }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-extrabold text-[1.0625rem]">
                      {plan.title}
                    </span>
                    <span className="block text-mute text-sm">
                      {formatShortDate(plan.from)} – {formatShortDate(plan.to)}{" "}
                      ·{" "}
                      {t("home.row.answers", {
                        answered,
                        total: plan.participants.length,
                      })}
                    </span>
                  </span>
                  <span className="rounded-chip border border-rule-strong px-1.5 py-px font-bold text-[0.6875rem]">
                    {t(`home.status.${plan.status}` as MessageKey)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <div className="sticky bottom-0 mt-auto bg-white pt-6 pb-[max(1.125rem,env(safe-area-inset-bottom))]">
        <Link href="/nuevo" className={buttonClasses.primary}>
          {t("home.create")}
        </Link>
      </div>
    </>
  );
}

/** A static three-line diagram that explains the idea before anyone signs in. */
function HomeLines() {
  const rows = [
    { name: "A", free: [[10, 92]] },
    { name: "B", free: [[34, 100]] },
    {
      name: "C",
      free: [
        [0, 22],
        [40, 86],
      ],
    },
  ];
  return (
    <div aria-hidden="true" className="mt-8">
      <div className="relative">
        <span className="absolute inset-y-[-6px] left-[calc(1.5rem+40%)] w-[calc((100%-1.5rem)*0.46)] rounded-lg border-2 border-ink" />
        <ul className="space-y-2">
          {rows.map((row, i) => (
            <li key={row.name} className="flex h-5 items-center">
              <span className="w-6 font-extrabold text-sm">{row.name}</span>
              <span className="relative h-5 flex-1">
                <span className="absolute inset-x-0 top-1/2 h-px bg-rule" />
                {row.free.map(([a, b]) => (
                  <span
                    key={a}
                    className="absolute top-[7px] h-1.5 rounded-full"
                    style={{
                      left: `${a}%`,
                      width: `${(b ?? 0) - (a ?? 0)}%`,
                      background: lineColor(i).value,
                      boxShadow: lineColor(i).outlined
                        ? "inset 0 0 0 1px var(--ink)"
                        : undefined,
                    }}
                  />
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
