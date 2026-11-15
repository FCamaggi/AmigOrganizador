import { groupOutlook, outlookRange } from "@amigo/core";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { PlanSign } from "@/components/plan-sign";
import { TopBar } from "@/components/top-bar";
import { t } from "@/i18n/t";
import {
  groupOptions,
  groupPlanViews,
  groupStrip,
} from "@/lib/group-view-model";
import { buttonClasses } from "@/lib/ui";
import {
  cancelPlanAction,
  confirmPlanAction,
  joinGroupAction,
  leaveGroupAction,
  proposePlanAction,
} from "@/server/group-actions";
import { requestOrigin } from "@/server/origin";
import { groupPlans, groups, profiles } from "@/server/repository";
import { getSession } from "@/server/session";
import { GroupBoard } from "./group-board";

/** The invite code is the group's secret (ADR 0003): never indexed. */
export async function generateMetadata({
  params,
}: PageProps<"/g/[code]">): Promise<Metadata> {
  const { code } = await params;
  const group = await groups().findByInviteCode(code);
  const robots = { index: false, follow: false };
  if (!group) return { title: t("group.notFound.title"), robots };
  return {
    title: `${group.name} · ${t("app.name")}`,
    description: t("group.invite.body"),
    robots,
    openGraph: {
      title: group.name,
      description: t("group.invite.body"),
      locale: "es_CL",
    },
  };
}

export default function GroupPage({ params }: PageProps<"/g/[code]">) {
  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 pt-1">
      <Suspense fallback={<GroupSkeleton />}>
        <GroupScreen params={params} />
      </Suspense>
    </main>
  );
}

function GroupSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="h-11" />
      <div className="h-[3.75rem] rounded-sign bg-panel" />
      <div className="mt-4 h-20 rounded bg-panel" />
      <div className="mt-3 h-52 rounded-sign bg-panel" />
    </div>
  );
}

function missingLine(names: readonly string[]): string {
  if (names.length === 0) return t("group.missing.none");
  if (names.length === 1)
    return t("group.missing.one", { name: names[0] ?? "" });
  if (names.length <= 3)
    return t("group.missing.few", { names: names.join(", ") });
  return t("group.missing.many", { count: names.length });
}

async function GroupScreen({
  params,
}: {
  readonly params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  await connection();
  const [group, session, origin] = await Promise.all([
    groups().findByInviteCode(code),
    getSession(),
    requestOrigin(),
  ]);

  if (!group) {
    return (
      <>
        <TopBar backHref="/" backLabel={t("group.back")} />
        <h1 className="mt-6 font-extrabold text-2xl">
          {t("group.notFound.title")}
        </h1>
        <p className="mt-2 text-mute">{t("group.notFound.body")}</p>
      </>
    );
  }

  const memberProfiles = await profiles().findByAccounts(
    group.members.map((m) => m.accountId),
  );
  const withProfile = new Set(memberProfiles.map((p) => p.accountId));
  const isMember = session
    ? group.members.some((m) => m.accountId === session.accountId)
    : false;
  const inviteUrl = `${origin}/g/${group.inviteCode}`;
  const meta = t("group.meta", {
    members:
      group.members.length === 1
        ? t("plan.people.one")
        : t("plan.people.other", { count: group.members.length }),
    withProfile: withProfile.size,
  });
  const header = (
    <>
      <TopBar backHref="/" backLabel={t("group.back")} />
      <PlanSign title={group.name} meta={meta} />
    </>
  );

  if (!isMember) {
    return (
      <>
        {header}
        <h2 className="mt-5 font-extrabold text-2xl leading-tight">
          {t("group.invite.title", { name: group.name })}
        </h2>
        <p className="mt-1.5 text-mute">{t("group.invite.body")}</p>
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label={meta}>
          {group.members.map((m) => (
            <li
              key={m.accountId}
              className={`rounded-chip border px-2 py-0.5 font-bold text-sm ${
                withProfile.has(m.accountId)
                  ? "border-ink"
                  : "border-rule-strong border-dashed text-mute"
              }`}
            >
              {m.displayName}
            </li>
          ))}
        </ul>
        <div className="sticky bottom-0 -mx-4 mt-6 bg-white px-4 pt-2.5 pb-[max(1.125rem,env(safe-area-inset-bottom))]">
          {session ? (
            <form action={joinGroupAction.bind(null, group.inviteCode)}>
              <button type="submit" className={buttonClasses.primary}>
                {t("group.invite.join")}
              </button>
            </form>
          ) : (
            <Link
              href={`/entrar?next=${encodeURIComponent(`/g/${group.inviteCode}`)}`}
              className={buttonClasses.primary}
            >
              {t("group.invite.signIn")}
            </Link>
          )}
        </div>
      </>
    );
  }

  const viewerId = session?.accountId ?? "";
  const { from, to } = outlookRange(group.timezone, Date.now());
  const outlook = groupOutlook({ group, profiles: memberProfiles, from, to });
  const allPlans = await groupPlans().listForGroup(group.id);
  const plannedDates = new Set(
    allPlans.filter((p) => p.status === "confirmed").map((p) => p.date),
  );
  const options = groupOptions(group, memberProfiles, outlook, plannedDates);
  const strip = groupStrip(group, outlook, options);
  const plans = groupPlanViews(group, allPlans, viewerId, origin);
  const missing = group.members
    .filter((m) => !withProfile.has(m.accountId))
    .map((m) => m.displayName);
  const feedUrl = `webcal://${inviteUrl.replace(/^https?:\/\//, "")}/calendario.ics`;
  const legend = "font-extrabold text-xs uppercase tracking-[0.06em]";

  const plansSection =
    plans.length > 0 ? (
      <section aria-labelledby="plans-title" className="mt-5">
        <h2 id="plans-title" className={legend}>
          {t("plans.title")}
        </h2>
        <ul className="mt-1 border-rule border-t">
          {plans.map((plan) => (
            <li key={plan.id} className="border-rule border-b py-3">
              <div className="flex items-start gap-2.5">
                <span
                  aria-hidden="true"
                  className={`mt-0.5 size-[1.375rem] flex-none rounded-full border-[5px] bg-white ${
                    plan.status === "confirmed"
                      ? "border-line-red"
                      : "border-rule-strong border-dashed"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-[1.0625rem] leading-tight">
                    {plan.title}{" "}
                    <span className="font-medium text-mute">{plan.when}</span>
                  </p>
                  <p className="text-mute text-sm">
                    {plan.status === "confirmed"
                      ? t("plans.confirmed")
                      : t("plans.proposed", { name: plan.proposedBy })}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex gap-2 pl-8">
                {plan.status === "proposed" && plan.canDecide ? (
                  <form
                    action={confirmPlanAction.bind(
                      null,
                      group.inviteCode,
                      plan.id,
                    )}
                    className="flex flex-1"
                  >
                    <button type="submit" className={buttonClasses.secondary}>
                      {t("plans.confirm")}
                    </button>
                  </form>
                ) : null}
                {plan.googleUrl ? (
                  <a
                    href={plan.googleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClasses.secondary}
                  >
                    {t("plans.google")}
                  </a>
                ) : null}
                {plan.icsPath ? (
                  <a
                    href={plan.icsPath}
                    download
                    className={buttonClasses.secondary}
                  >
                    {t("plans.ics")}
                  </a>
                ) : null}
              </div>
              {plan.canDecide ? (
                <details className="mt-1 pl-8 text-sm">
                  <summary className="flex min-h-11 cursor-pointer items-center font-bold text-mute">
                    {t("plans.more")}
                  </summary>
                  <form
                    action={cancelPlanAction.bind(
                      null,
                      group.inviteCode,
                      plan.id,
                    )}
                  >
                    <button type="submit" className={buttonClasses.secondary}>
                      {t("plans.cancel")}
                    </button>
                  </form>
                </details>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    ) : null;

  return (
    <>
      {header}
      {!withProfile.has(viewerId) ? (
        <section
          className="mt-3 rounded-sign border-2 border-ink px-3 py-3"
          aria-labelledby="no-profile"
        >
          <h2 id="no-profile" className="font-extrabold">
            {t("group.noProfile.title")}
          </h2>
          <p className="mt-0.5 text-mute text-sm">
            {t("group.noProfile.body")}
          </p>
          <Link
            href={`/perfil?next=${encodeURIComponent(`/g/${group.inviteCode}`)}`}
            className={`${buttonClasses.secondary} mt-2.5 w-full`}
          >
            {t("group.noProfile.cta")}
          </Link>
        </section>
      ) : null}
      {group.members.length > 1 ? (
        <p className="mt-2 font-medium text-mute text-sm">
          {missingLine(missing)}
        </p>
      ) : null}

      <GroupBoard
        alone={group.members.length < 2}
        options={options}
        strip={strip}
        inviteUrl={inviteUrl}
        shareText={t("group.shareText", { name: group.name, url: inviteUrl })}
        propose={proposePlanAction.bind(null, group.inviteCode)}
      >
        {plansSection}
        <section className="mt-6 space-y-1 text-sm">
          <a
            href={feedUrl}
            className="flex min-h-11 items-center font-bold text-line-blue underline"
          >
            {t("group.feed")}
          </a>
          <p className="text-mute">{t("group.feed.hint")}</p>
          <details className="mt-2">
            <summary className="flex min-h-11 cursor-pointer items-center font-bold text-mute">
              {t("group.more")}
            </summary>
            <form action={leaveGroupAction.bind(null, group.inviteCode)}>
              <button type="submit" className={buttonClasses.secondary}>
                {t("group.leave")}
              </button>
            </form>
          </details>
        </section>
      </GroupBoard>
    </>
  );
}
