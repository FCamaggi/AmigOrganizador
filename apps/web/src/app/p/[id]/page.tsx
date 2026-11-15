import { buildGoogleCalendarUrl, inviteFor, type Plan } from "@amigo/core";
import Link from "next/link";
import { Suspense } from "react";
import { PlanSign } from "@/components/plan-sign";
import { ShareButton, WhatsAppLink } from "@/components/share-buttons";
import { TopBar } from "@/components/top-bar";
import { t } from "@/i18n/t";
import {
  formatDay,
  formatDuration,
  formatShortDate,
  formatSpan,
} from "@/lib/format";
import { optionViews } from "@/lib/plan-view-model";
import { buttonClasses } from "@/lib/ui";
import { confirmAction, joinPlanAction } from "@/server/actions";
import { requestOrigin } from "@/server/origin";
import { plans } from "@/server/repository";
import { getSession } from "@/server/session";
import { PlanBoard, type ViewerRole } from "./plan-board";

export default function PlanPage({ params }: PageProps<"/p/[id]">) {
  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 pt-1">
      <Suspense fallback={<PlanSkeleton />}>
        <PlanScreen params={params} />
      </Suspense>
    </main>
  );
}

function PlanSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="h-11" />
      <div className="h-[3.75rem] rounded-sign bg-panel" />
      <div className="mt-3 h-4 w-2/3 rounded bg-panel" />
      <div className="mt-3 h-44 rounded-sign bg-panel" />
      <div className="mt-4 h-20 rounded bg-panel" />
      <div className="mt-2 h-20 rounded bg-panel" />
    </div>
  );
}

function answersLine(plan: Plan): { summary: string; missing: string | null } {
  const total = plan.participants.length;
  const pending = plan.participants.filter((p) => p.answer === null);
  const answered = total - pending.length;
  const summary =
    pending.length === 0
      ? t("plan.answers.all")
      : t("plan.answers.some", { answered, total });
  const names = pending.map((p) => p.displayName);
  const missing =
    names.length === 0
      ? null
      : names.length === 1
        ? t("plan.answers.missing.one", { name: names[0] ?? "" })
        : names.length <= 3
          ? t("plan.answers.missing.few", { names: names.join(", ") })
          : t("plan.answers.missing.many", { count: names.length });
  return { summary, missing };
}

async function PlanScreen({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [plan, session, origin] = await Promise.all([
    plans().findById(id),
    getSession(),
    requestOrigin(),
  ]);

  if (!plan) {
    return (
      <>
        <TopBar backHref="/" backLabel={t("plan.back")} />
        <h1 className="mt-6 font-extrabold text-2xl">
          {t("plan.notFound.title")}
        </h1>
        <p className="mt-2 text-mute">{t("plan.notFound.body")}</p>
      </>
    );
  }

  const planUrl = `${origin}/p/${plan.id}`;
  const organizer = plan.participants.find(
    (p) => p.accountId === plan.organizerId,
  );
  const me = session
    ? plan.participants.find((p) => p.accountId === session.accountId)
    : undefined;
  const role: ViewerRole = !session
    ? "visitor"
    : !me
      ? "outsider"
      : plan.organizerId === session.accountId
        ? "organizer"
        : "participant";
  const total = plan.participants.length;
  const meta = t("plan.meta", {
    range: t("plan.range", {
      from: formatShortDate(plan.from),
      to: formatShortDate(plan.to),
    }),
    duration: formatDuration(plan.durationMinutes),
    people:
      total === 1
        ? t("plan.people.one")
        : t("plan.people.other", { count: total }),
  });
  const { summary, missing } = answersLine(plan);

  const header = (
    <>
      <TopBar
        backHref="/"
        backLabel={t("plan.back")}
        aside={
          organizer
            ? t("plan.organizer", { name: organizer.displayName })
            : undefined
        }
      />
      <PlanSign title={plan.title} meta={meta} />
    </>
  );

  if (plan.status === "confirmed" && plan.confirmed) {
    const slot = plan.confirmed;
    const invite = inviteFor(plan, planUrl);
    const day = formatDay(slot.date);
    const time = formatSpan(slot.start, slot.end);
    return (
      <>
        {header}
        <section className="mt-5" aria-labelledby="confirmed-title">
          <h2
            id="confirmed-title"
            className="font-extrabold text-xs uppercase tracking-[0.06em]"
          >
            {t("confirmed.title")}
          </h2>
          <div className="mt-2 flex items-center gap-3 rounded-[1.25rem] border-[3px] border-ink px-4 py-3">
            <span
              aria-hidden="true"
              className="size-5 flex-none rounded-full border-[5px] border-line-red bg-white"
            />
            <p className="font-extrabold text-2xl leading-tight">
              {t("confirmed.when", { day, time })}
            </p>
          </div>
        </section>
        <div className="mt-5 space-y-2">
          {invite ? (
            <a
              href={buildGoogleCalendarUrl(invite)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses.primary}
            >
              {t("confirmed.google")}
            </a>
          ) : null}
          <a
            href={`/p/${plan.id}/calendario.ics`}
            download
            className={`${buttonClasses.secondary} w-full`}
          >
            {t("confirmed.ics")}
          </a>
          <div className="flex gap-2">
            <WhatsAppLink
              label={t("confirmed.share")}
              text={t("confirmed.shareText", {
                title: plan.title,
                day,
                time,
                url: planUrl,
              })}
            />
            <ShareButton url={planUrl} text={plan.title} />
          </div>
        </div>
      </>
    );
  }

  if (plan.status === "cancelled") {
    return (
      <>
        {header}
        <p className="mt-4 font-bold">{t("plan.cancelled")}</p>
        <Link href="/" className={`${buttonClasses.secondary} mt-4`}>
          {t("plan.back")}
        </Link>
      </>
    );
  }

  const missingNames = plan.participants
    .filter((p) => p.answer === null)
    .map((p) => p.displayName);
  const nudgeText =
    missingNames.length === 1
      ? t("share.nudge", { name: missingNames[0] ?? "", url: planUrl })
      : t("share.text", { url: planUrl });

  return (
    <>
      {header}
      <p className="mt-2 font-medium text-mute text-sm">
        <b className="font-bold text-ink">{summary}</b> {missing}
      </p>
      <PlanBoard
        planId={plan.id}
        role={role}
        answered={me?.answer != null}
        inputMode={plan.inputMode}
        options={optionViews(plan)}
        missingNames={missingNames}
        shareText={t("share.text", { url: planUrl })}
        nudgeText={nudgeText}
        planUrl={planUrl}
        confirm={confirmAction.bind(null, plan.id)}
        join={joinPlanAction.bind(null, plan.id)}
      />
    </>
  );
}
