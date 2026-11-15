import type { Plan } from "@amigo/core";
import { t } from "@/i18n/t";
import {
  formatDay,
  formatDuration,
  formatShortDate,
  formatSpan,
} from "./format";

/** What a shared plan link says before anyone opens it (S6). */
export interface PlanPreview {
  readonly title: string;
  /** One sentence for `og:description` and the chat preview. */
  readonly description: string;
  /** Range, duration and group size. */
  readonly meta: string;
  /** "5 de 6 respondieron." while open. */
  readonly answers: string | null;
  /** The call to action, or the confirmed slot. */
  readonly badge: string;
  readonly status: "open" | "confirmed" | "cancelled";
}

export function planPreview(plan: Plan): PlanPreview {
  const total = plan.participants.length;
  const answered = plan.participants.filter((p) => p.answer !== null).length;
  const organizer =
    plan.participants.find((p) => p.accountId === plan.organizerId)
      ?.displayName ?? "";
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

  if (plan.status === "confirmed" && plan.confirmed) {
    const day = formatDay(plan.confirmed.date);
    const time = formatSpan(plan.confirmed.start, plan.confirmed.end);
    return {
      title: plan.title,
      description: t("preview.confirmed", { day, time }),
      meta,
      answers: null,
      badge: `${t("preview.confirmed.badge")} · ${day} · ${time}`,
      status: "confirmed",
    };
  }
  if (plan.status === "cancelled") {
    return {
      title: plan.title,
      description: t("preview.cancelled"),
      meta,
      answers: null,
      badge: t("preview.cancelled"),
      status: "cancelled",
    };
  }
  return {
    title: plan.title,
    description: t(`preview.invite.${plan.inputMode}`, { name: organizer }),
    meta,
    answers:
      answered === total
        ? t("plan.answers.all")
        : t("plan.answers.some", { answered, total }),
    badge: t(`preview.cta.${plan.inputMode}`),
    status: "open",
  };
}
