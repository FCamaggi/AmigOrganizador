import { dateRange, type Interval, type Plan, todayIn } from "@amigo/core";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { PlanSign } from "@/components/plan-sign";
import { TopBar } from "@/components/top-bar";
import { t } from "@/i18n/t";
import { formatDay, formatDuration, formatShortDate } from "@/lib/format";

import { lineColor } from "@/lib/lines";
import { shellClasses } from "@/lib/ui";
import { answerAction } from "@/server/actions";
import { plans } from "@/server/repository";
import { getSession } from "@/server/session";
import { BusyEditor } from "./busy-editor";

export default function AnswerPage({
  params,
}: PageProps<"/p/[id]/disponibilidad">) {
  return (
    <main className={shellClasses.narrow}>
      <Suspense
        fallback={
          <div
            aria-hidden="true"
            className="mt-12 h-96 animate-pulse rounded-sign bg-panel"
          />
        }
      >
        <AnswerScreen params={params} />
      </Suspense>
    </main>
  );
}

const SEGMENT_SPANS = [
  { key: "morning", start: 480, end: 780 },
  { key: "afternoon", start: 780, end: 1140 },
  { key: "evening", start: 1140, end: 1440 },
] as const;

/** Free-mode answers come back as the segments that were left free. */
function freeSegments(plan: Plan, accountId: string) {
  const answer = plan.participants.find(
    (p) => p.accountId === accountId,
  )?.answer;
  if (!answer || plan.inputMode !== "free") return {};
  return Object.fromEntries(
    Object.entries(answer.days).map(([date, day]) => [
      date,
      SEGMENT_SPANS.filter(
        (seg) =>
          !day.busy.some(
            (b: Interval) => b.start < seg.end && b.end > seg.start,
          ),
      ).map((seg) => seg.key),
    ]),
  );
}

async function AnswerScreen({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connection();
  const [plan, session] = await Promise.all([
    plans().findById(id),
    getSession(),
  ]);
  if (!plan) redirect("/");
  if (!session)
    redirect(`/entrar?next=${encodeURIComponent(`/p/${id}/disponibilidad`)}`);
  if (plan.status !== "open") redirect(`/p/${id}`);

  const index = plan.participants.findIndex(
    (p) => p.accountId === session.accountId,
  );
  const me = plan.participants[index];
  const initialBusy =
    plan.inputMode === "busy" && me?.answer
      ? Object.fromEntries(
          Object.entries(me.answer.days)
            .filter(([date]) => date >= plan.from)
            .map(([date, day]) => [date, day.busy]),
        )
      : {};
  const free = plan.inputMode === "free";

  return (
    <>
      <TopBar backHref={`/p/${id}`} backLabel={t("answer.back")} />
      <PlanSign
        title={plan.title}
        meta={`${formatShortDate(plan.from)} – ${formatShortDate(plan.to)} · ${formatDuration(plan.durationMinutes)}`}
      />
      <h2 className="mt-4 font-extrabold text-2xl leading-tight">
        {free ? t("answer.title.free") : t("answer.title")}
      </h2>
      <p className="mt-1 text-mute text-sm">
        {free ? t("answer.intro.free") : t("answer.intro")}
      </p>
      <BusyEditor
        mode={plan.inputMode}
        from={plan.from}
        to={plan.to}
        today={todayIn(plan.timezone, Date.now())}
        days={dateRange(plan.from, plan.to).map((date) => ({
          date,
          label: formatDay(date).replace(/ \S+$/, ""),
        }))}
        initialBusy={initialBusy}
        initialFree={freeSegments(plan, session.accountId)}
        lineColor={
          lineColor(index < 0 ? plan.participants.length : index).value
        }
        save={answerAction.bind(null, plan.id)}
      />
    </>
  );
}
