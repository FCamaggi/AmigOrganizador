import {
  type AvailabilityWindow,
  buildGoogleCalendarUrl,
  type Group,
  type GroupOutlook,
  type GroupPlan,
  groupDayLines,
  groupPlanInvite,
  type Profile,
  slotFromOption,
  type WindowReason,
} from "@amigo/core";
import { type MessageKey, t } from "@/i18n/t";
import { formatDay, formatSpan } from "./format";
import { diagramSpan } from "./lines";
import type { OptionPerson, OptionView, PersonState } from "./option-view";

/** The slot length suggested for a proposal (the form lets people change it). */
export const SUGGESTED_MINUTES = 180;
const MAX_OPTIONS = 5;
const SHOWN_REASONS: readonly WindowReason["code"][] = [
  "ALL_AVAILABLE",
  "EVENING",
  "LATE",
  "GOOD_WEEKDAY",
];

export interface StripDay {
  readonly date: string;
  readonly weekday: string;
  readonly dayOfMonth: number;
  readonly free: number;
  readonly total: number;
  /** Everyone who has a profile can come. */
  readonly allKnownFree: boolean;
  readonly hasOption: boolean;
  readonly label: string;
  /** Per-member state in join order for the day's best window (or day fallback). */
  readonly people: readonly OptionPerson[];
  /** Index into the options list when this day has one of the shown options. */
  readonly optionKey: string | null;
}

export interface PlanView {
  readonly id: string;
  readonly title: string;
  readonly when: string;
  readonly status: GroupPlan["status"];
  readonly proposedBy: string;
  readonly canDecide: boolean;
  readonly googleUrl: string | null;
  readonly icsPath: string | null;
}

/**
 * Thread slot per member position, from `groupThreads` (S9). Without one a
 * member keeps the slot of their join position.
 */
export type ThreadSlots = readonly number[];

const slotOf = (threads: ThreadSlots, position: number) =>
  threads[position] ?? position;

function optionFromWindow(
  window: AvailabilityWindow,
  group: Group,
  profiles: readonly Profile[],
  sooner: boolean,
  threads: ThreadSlots,
): OptionView {
  const start = slotFromOption(window, SUGGESTED_MINUTES).start;
  const slot = { start, end: start + SUGGESTED_MINUTES };
  const span = diagramSpan(slot);
  const state = (id: string): PersonState =>
    window.freeMemberIds.includes(id)
      ? "free"
      : window.unknownMemberIds.includes(id)
        ? "unknown"
        : "busy";
  const busy = group.members.filter((m) => state(m.accountId) === "busy");
  const note =
    busy.length === 1 && busy[0]
      ? t("options.cannot", { name: busy[0].displayName })
      : null;
  return {
    key: `${window.date}-${window.start}`,
    date: window.date,
    dayLabel: formatDay(window.date),
    start: slot.start,
    end: slot.end,
    windowStart: window.start,
    windowEnd: window.end,
    freeCount: window.freeMemberIds.length,
    memberCount: group.members.length,
    reasons: [
      ...window.reasons
        .filter((r) => SHOWN_REASONS.includes(r.code))
        .map((r) => t(`reason.${r.code}` as MessageKey)),
      ...(sooner ? [t("reason.SOONER")] : []),
    ],
    people: group.members.map((m, index) => ({
      accountId: m.accountId,
      name: m.displayName,
      state: state(m.accountId),
      colorIndex: slotOf(threads, index),
    })),
    note,
    span,
    lines: groupDayLines({ group, profiles, date: window.date, span }).map(
      (line, index) => ({ ...line, colorIndex: slotOf(threads, index) }),
    ),
  };
}

/** The ranked days shown in the group view, with diagram lines per day. */
export function groupOptions(
  group: Group,
  profiles: readonly Profile[],
  outlook: GroupOutlook,
  /** Dates that already hold a confirmed plan are not suggested again. */
  plannedDates: ReadonlySet<string> = new Set(),
  threads: ThreadSlots = [],
): OptionView[] {
  // One option per date: a group asks "which day", not "which window".
  const open = outlook.windows.filter((w) => !plannedDates.has(w.date));
  const perDay = open.filter(
    (w, i) => open.findIndex((x) => x.date === w.date) === i,
  );
  const shown = perDay.slice(0, MAX_OPTIONS);
  return shown.map((window, index) => {
    const next = shown[index + 1];
    const sooner =
      next !== undefined &&
      next.score === window.score &&
      next.freeMemberIds.length === window.freeMemberIds.length;
    return optionFromWindow(window, group, profiles, sooner, threads);
  });
}

const weekdayKey = (date: string) =>
  `weekday.short.${new Date(`${date}T12:00:00Z`).getUTCDay()}` as MessageKey;

/** Every day of the outlook as a woven swatch: how many can meet and each thread. */
export function groupStrip(
  group: Group,
  outlook: GroupOutlook,
  options: readonly OptionView[],
  threads: ThreadSlots = [],
): StripDay[] {
  const total = group.members.length;
  const hasProfile = new Set(
    outlook.members.filter((m) => m.hasProfile).map((m) => m.accountId),
  );
  const known = hasProfile.size;
  return outlook.days.map(({ date, best }) => {
    const free = best?.freeMemberIds.length ?? 0;
    const day = formatDay(date);
    const people: OptionPerson[] = group.members.map((member, index) => {
      const state: PersonState = best
        ? best.freeMemberIds.includes(member.accountId)
          ? "free"
          : best.unknownMemberIds.includes(member.accountId)
            ? "unknown"
            : "busy"
        : hasProfile.has(member.accountId)
          ? "busy"
          : "unknown";
      return {
        accountId: member.accountId,
        name: member.displayName,
        state,
        colorIndex: slotOf(threads, index),
      };
    });
    return {
      date,
      weekday: t(weekdayKey(date)),
      dayOfMonth: Number(date.slice(8, 10)),
      free,
      total,
      allKnownFree: best !== null && free >= known,
      hasOption: best !== null,
      label: best
        ? t("group.strip.day", { day, free, total })
        : t("group.strip.none", { day }),
      people,
      optionKey: options.find((o) => o.date === date)?.key ?? null,
    };
  });
}

/** Upcoming plans of the group, newest decisions visible. */
export function groupPlanViews(
  group: Group,
  plans: readonly GroupPlan[],
  viewerId: string,
  origin: string,
): PlanView[] {
  const owner = group.members.find((m) => m.role === "owner")?.accountId;
  const name = (id: string) =>
    group.members.find((m) => m.accountId === id)?.displayName ?? "?";
  return plans
    .filter((plan) => plan.status !== "cancelled")
    .map((plan) => {
      const url = `${origin}/g/${group.inviteCode}`;
      const confirmed = plan.status === "confirmed";
      return {
        id: plan.id,
        title: plan.title,
        when: `${formatDay(plan.date)} · ${formatSpan(plan.start, plan.end)}`,
        status: plan.status,
        proposedBy: name(plan.proposedBy),
        canDecide: plan.proposedBy === viewerId || owner === viewerId,
        googleUrl: confirmed
          ? buildGoogleCalendarUrl(groupPlanInvite(plan, group, url))
          : null,
        icsPath: confirmed
          ? `/g/${group.inviteCode}/plan/${plan.id}/ics`
          : null,
      };
    });
}
