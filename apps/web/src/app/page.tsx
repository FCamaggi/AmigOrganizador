import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { InstallHint } from "@/components/install-hint";
import { t } from "@/i18n/t";
import { threadColor } from "@/lib/lines";
import { buttonClasses, shellClasses } from "@/lib/ui";
import { signOut } from "@/server/actions";
import {
  groups,
  memberSchedules,
  myDefaultSchedule,
} from "@/server/repository";
import { getSession } from "@/server/session";

export default function Home() {
  return (
    <main className={`${shellClasses.wide} flex flex-col pt-4`}>
      <p className="flex items-center gap-2">
        <Image
          src="/brand/knot-lockup.webp"
          alt={t("app.name")}
          width={99}
          height={40}
          priority
          className="h-10 w-auto"
        />
        <span className="rounded-knot border border-ink px-1 font-bold text-caption uppercase">
          {t("app.beta")}
        </span>
      </p>
      <Suspense
        fallback={
          <div
            aria-hidden="true"
            className="mt-6 h-64 animate-pulse rounded-cloth bg-panel"
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
      <div className="contents lg:mt-20 lg:grid lg:grid-cols-2 lg:items-center lg:gap-x-16">
        <h1 className="mt-10 text-balance font-extrabold text-[2.5rem] leading-[1.05] sm:text-5xl lg:col-start-1 lg:row-start-1 lg:mt-0 lg:text-6xl">
          {t("groups.signedOut.title")}
        </h1>
        <p className="mt-3 text-lg text-mute sm:max-w-lg lg:col-start-1 lg:row-start-2">
          {t("groups.signedOut.body")}
        </p>
        <div className="lg:col-start-2 lg:row-span-3 lg:row-start-1">
          <HomeCloth />
        </div>
        <div className="mt-auto pt-8 pb-[max(1.125rem,env(safe-area-inset-bottom))] sm:max-w-sm lg:col-start-1 lg:row-start-3 lg:mt-0">
          <Link href="/grupos/nuevo" className={buttonClasses.primary}>
            {t("groups.create")}
          </Link>
          <Link
            href="/privacidad"
            className="mt-3 flex min-h-11 items-center justify-center font-bold text-mute text-sm underline"
          >
            {t("privacy.link")}
          </Link>
        </div>
      </div>
    );
  }

  const [mine, profile] = await Promise.all([
    groups().listForAccount(session.accountId),
    myDefaultSchedule(session.accountId),
  ]);
  const withProfile = await Promise.all(
    mine.map(async (group) => (await memberSchedules(group)).length),
  );
  // Desktop: who you are, your profile and the create action on the left;
  // your groups on the right. Below `lg` it stacks with a sticky footer.
  return (
    <div className="contents lg:grid lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-start lg:gap-x-12">
      <div className="lg:col-start-1 lg:row-start-1">
        <div className="mt-6 flex items-baseline justify-between gap-2">
          <h1 className="font-extrabold text-[1.75rem]">{t("groups.title")}</h1>
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 font-bold text-indigo text-sm underline"
            >
              {t("signin.signOut")}
            </button>
          </form>
        </div>
        <p className="text-mute text-sm">
          {t("signin.as", { name: session.displayName })}
        </p>

        <Link
          href="/perfil"
          className={`mt-4 flex items-center gap-3 rounded-cloth bg-surface px-3.5 py-3 no-underline ${
            profile ? "border border-rule" : "border-2 border-ink"
          }`}
        >
          <span
            aria-hidden="true"
            className="yarn h-2 w-10 flex-none rounded-full"
            style={{ background: threadColor(0).value }}
          />
          <span className="min-w-0 flex-1">
            <span className="block font-extrabold">
              {profile ? t("profile.cta.ready") : t("profile.cta.title")}
            </span>
            <span className="block text-mute text-sm">
              {profile ? t("profile.cta.edit") : t("profile.cta.body")}
            </span>
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="size-4 flex-none text-indigo"
          >
            <path
              d="M6 3l5 5-5 5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        {/* Setting up the profile comes first; installing can wait. */}
        {profile ? <InstallHint /> : null}
      </div>

      <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-6">
        {mine.length === 0 ? (
          <div className="mt-6 rounded-cloth border border-rule border-dashed bg-surface px-4 py-4 lg:mt-0">
            <p className="font-extrabold">{t("groups.empty.title")}</p>
            <p className="mt-1 text-mute text-sm">{t("groups.empty.body")}</p>
          </div>
        ) : (
          <ul className="mt-4 border-rule border-t sm:grid sm:grid-cols-2 sm:gap-x-6 lg:mt-0">
            {mine.map((group, index) => (
              <li key={group.id}>
                <Link
                  href={`/g/${group.inviteCode}`}
                  className="flex min-h-16 items-center gap-3 border-rule border-b py-3 no-underline hover:bg-panel/60"
                >
                  <WovenGroupGlyph offset={index} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-extrabold text-[1.0625rem]">
                      {group.name}
                    </span>
                    <span className="block text-mute text-sm">
                      {t("groups.row.members", {
                        count: group.members.length,
                        withProfile: withProfile[index] ?? 0,
                      })}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="sticky-footer sticky bottom-0 mt-auto bg-ground pt-6 pb-[max(1.125rem,env(safe-area-inset-bottom))] lg:static lg:col-start-1 lg:row-start-2 lg:mt-0">
        <Link href="/grupos/nuevo" className={buttonClasses.primary}>
          {t("groups.create")}
        </Link>
      </div>
    </div>
  );
}

/** Miniature woven swatch for each group row, echoing the cloth at icon scale. */
function WovenGroupGlyph({ offset }: { readonly offset: number }) {
  return (
    <span
      aria-hidden="true"
      className="relative flex size-7 flex-none flex-col justify-center gap-[3px] rounded-knot border-[1.5px] border-ink bg-surface px-1"
    >
      <span
        className="yarn block h-[3px] w-full rounded-full"
        style={{ background: threadColor(offset).value }}
      />
      <span
        className="yarn block h-[3px] w-full rounded-full"
        style={{ background: threadColor(offset + 1).value }}
      />
      <span
        className="yarn block h-[3px] w-full rounded-full"
        style={{ background: threadColor(offset + 2).value }}
      />
    </span>
  );
}

/** A static three-thread woven cloth that explains the idea before anyone signs in. */
function HomeCloth() {
  const rows = [
    { name: "A", free: [[8, 86]] },
    { name: "B", free: [[36, 98]] },
    {
      name: "C",
      free: [
        [0, 24],
        [44, 88],
      ],
    },
  ];
  return (
    <div
      aria-hidden="true"
      className="mt-8 rounded-cloth border border-rule bg-surface p-4 sm:p-5 lg:mt-0"
    >
      <div className="relative py-1">
        <span className="absolute -inset-y-1 left-[calc(1.5rem+(100%-1.5rem)*0.44)] w-[calc((100%-1.5rem)*0.42)] rounded-knot border-[3px] border-ink" />
        <ul className="relative space-y-2.5">
          {rows.map((row, i) => (
            <li key={row.name} className="flex h-5 items-center">
              <span className="w-6 font-extrabold text-sm">{row.name}</span>
              <span className="relative h-5 flex-1">
                <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-rule" />
                {row.free.map(([a, b]) => (
                  <span
                    key={a}
                    className="yarn absolute top-1/2 h-2 -translate-y-1/2 rounded-full"
                    style={{
                      left: `${a}%`,
                      width: `${(b ?? 0) - (a ?? 0)}%`,
                      background: threadColor(i).value,
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
