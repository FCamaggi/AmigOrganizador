import {
  addDays,
  createProfile,
  dateRange,
  profileTimezone,
  todayIn,
  utcToLocal,
} from "@amigo/core";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { TopBar } from "@/components/top-bar";
import { t } from "@/i18n/t";
import { formatDay, formatTime } from "@/lib/format";
import { lineColor } from "@/lib/lines";
import { buttonClasses, shellClasses } from "@/lib/ui";
import { safeNext } from "@/server/auth/config";
import {
  removeCalendarAction,
  resyncCalendarAction,
  saveProfileAction,
} from "@/server/group-actions";
import { myDefaultSchedule } from "@/server/repository";
import { getSession } from "@/server/session";
import { ImportForm } from "./import-form";
import { ProfileEditor } from "./profile-editor";

const EDITOR_DAYS = 14;

function syncedLabel(syncedAt: number, timeZone: string): string {
  const local = utcToLocal(syncedAt, timeZone);
  return `${formatDay(local.date)} ${formatTime(local.minutes)}`;
}

export default function ProfilePage({ searchParams }: PageProps<"/perfil">) {
  return (
    <main className={shellClasses.wide}>
      <Suspense
        fallback={
          <div
            aria-hidden="true"
            className="mt-12 h-96 animate-pulse rounded-sign bg-panel"
          />
        }
      >
        <ProfileScreen searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function ProfileScreen({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = (await searchParams).next;
  const next =
    typeof raw === "string" && safeNext(raw) !== "/" ? safeNext(raw) : null;
  await connection();
  const session = await getSession();
  if (!session)
    redirect(
      `/entrar?next=${encodeURIComponent(next ? `/perfil?next=${next}` : "/perfil")}`,
    );
  const now = Date.now();
  const profile =
    (await myDefaultSchedule(session.accountId)) ??
    createProfile({ accountId: session.accountId, now });
  const timeZone = profileTimezone(profile);
  const today = todayIn(timeZone, now);
  const days = dateRange(today, addDays(today, EDITOR_DAYS - 1)).map(
    (date) => ({
      date,
      label: formatDay(date).replace(/ \S+$/, ""),
    }),
  );

  return (
    <>
      <TopBar backHref={next ?? "/"} backLabel={t("profileEdit.back")} />
      <h1 className="mt-2 font-extrabold text-[1.75rem] leading-tight">
        {t("profileEdit.title")}
      </h1>
      <p className="mt-1 text-mute text-sm">{t("profileEdit.intro")}</p>

      <ProfileEditor
        profile={profile}
        today={today}
        timeZone={timeZone}
        days={days}
        lineColor={lineColor(0).value}
        next={next}
        save={saveProfileAction}
      >
        <section aria-labelledby="import-title" className="mt-6">
          <h2
            id="import-title"
            className="font-extrabold text-xs uppercase tracking-[0.06em]"
          >
            {t("profileEdit.import.title")}
          </h2>
          <p className="mt-0.5 text-mute text-sm">
            {t("profileEdit.import.hint")}
          </p>
          {profile.importedCalendars.length > 0 ? (
            <ul className="mt-3 border-rule border-t">
              {profile.importedCalendars.map((calendar) => (
                <li
                  key={calendar.id}
                  className="flex items-center gap-2 border-rule border-b py-2"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-extrabold">
                      {calendar.name}
                    </span>
                    <span className="block text-mute text-xs">
                      {t("profileEdit.import.synced", {
                        count: calendar.busy.length,
                        time: syncedLabel(calendar.syncedAt, timeZone),
                      })}
                    </span>
                  </span>
                  <form action={resyncCalendarAction.bind(null, calendar.id)}>
                    <button
                      type="submit"
                      className={`${buttonClasses.secondary} px-2 text-sm`}
                    >
                      {t("profileEdit.import.resync")}
                    </button>
                  </form>
                  <form action={removeCalendarAction.bind(null, calendar.id)}>
                    <button
                      type="submit"
                      className={`${buttonClasses.secondary} px-2 text-sm`}
                    >
                      {t("profileEdit.import.remove")}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : null}
          <ImportForm />
        </section>
      </ProfileEditor>
    </>
  );
}
