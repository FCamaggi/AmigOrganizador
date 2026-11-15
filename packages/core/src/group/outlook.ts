import { type DayLine, lineSegments } from "../availability/day-lines";
import {
  type AvailabilityWindow,
  DEFAULT_SETTINGS,
  findWindows,
  type MemberAvailability,
} from "../availability/find-windows";
import type { Interval } from "../availability/interval";
import { addDays, dateRange, type LocalDate } from "../availability/local-date";
import { availabilityFor, type Profile } from "../profile/profile";
import { todayIn } from "../time/zoned";
import type { Group } from "./group";

/** How far ahead the group view looks by default (agent assumption, ADR 0004). */
export const DEFAULT_OUTLOOK_DAYS = 28;

/** From today in the group's timezone, `days` dates ahead (inclusive). */
export function outlookRange(
  timeZone: string,
  now: number,
  days: number = DEFAULT_OUTLOOK_DAYS,
): { from: LocalDate; to: LocalDate } {
  const from = todayIn(timeZone, now);
  return { from, to: addDays(from, days - 1) };
}

export interface OutlookMember {
  readonly accountId: string;
  readonly displayName: string;
  /** `false` means unknown, never free. */
  readonly hasProfile: boolean;
}

export interface GroupOutlook {
  readonly members: readonly OutlookMember[];
  /** Ranked by the engine (see AVAILABILITY_ENGINE.md). */
  readonly windows: readonly AvailabilityWindow[];
  /** Every date in the range with its best window, or `null` if none works. */
  readonly days: readonly {
    date: LocalDate;
    best: AvailabilityWindow | null;
  }[];
}

function memberAvailability(
  group: Group,
  profiles: readonly Profile[],
  from: LocalDate,
  to: LocalDate,
): MemberAvailability[] {
  const byAccount = new Map(profiles.map((p) => [p.accountId, p]));
  return group.members.map((member) => {
    const profile = byAccount.get(member.accountId);
    return {
      memberId: member.accountId,
      days: profile ? availabilityFor(profile, from, to, group.timezone) : {},
    };
  });
}

/**
 * Which days the group can meet (S3): compares every member's profile over
 * the range, in the group's timezone. Members without a profile are unknown.
 */
export function groupOutlook(input: {
  group: Group;
  profiles: readonly Profile[];
  from: LocalDate;
  to: LocalDate;
  /** Shortest useful meeting; defaults to the engine's 2 hours. */
  minimumMinutes?: number;
}): GroupOutlook {
  const { group, profiles, from, to } = input;
  const withProfile = new Set(profiles.map((p) => p.accountId));
  const windows = findWindows({
    from,
    to,
    members: memberAvailability(group, profiles, from, to),
    settings: {
      ...DEFAULT_SETTINGS,
      minimumBlockMinutes:
        input.minimumMinutes ?? DEFAULT_SETTINGS.minimumBlockMinutes,
    },
  });
  return {
    members: group.members.map((member) => ({
      accountId: member.accountId,
      displayName: member.displayName,
      hasProfile: withProfile.has(member.accountId),
    })),
    windows,
    days: dateRange(from, to).map((date) => ({
      date,
      best: windows.find((w) => w.date === date) ?? null,
    })),
  };
}

/** Each member's day as a line for the diagram, in join order. */
export function groupDayLines(input: {
  group: Group;
  profiles: readonly Profile[];
  date: LocalDate;
  span: Interval;
}): DayLine[] {
  const { group, profiles, date, span } = input;
  const members = memberAvailability(group, profiles, date, date);
  const withProfile = new Set(profiles.map((p) => p.accountId));
  return group.members.map((member, index) => {
    const answered = withProfile.has(member.accountId);
    const availability = members[index];
    return {
      accountId: member.accountId,
      displayName: member.displayName,
      answered,
      segments:
        answered && availability
          ? lineSegments(availability, date, span)
          : [{ ...span, state: "unknown" as const }],
    };
  });
}
