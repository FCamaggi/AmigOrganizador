import {
  type AvailabilityWindow,
  type Group,
  type GroupOutlook,
  parseLocalDate,
} from "@amigo/core";
import { describe, expect, it } from "vitest";
import { formatHours, groupOptions, groupStrip } from "./group-view-model";

const group: Group = {
  id: "grp",
  inviteCode: "code",
  name: "Asado",
  timezone: "America/Santiago",
  createdAt: 0,
  members: ["a", "b"].map((accountId, index) => ({
    accountId,
    displayName: accountId.toUpperCase(),
    role: index === 0 ? "owner" : "member",
    joinedAt: index,
  })),
};

function window(
  date: string,
  start: number,
  end: number,
  reasons: AvailabilityWindow["reasons"],
): AvailabilityWindow {
  return {
    date: parseLocalDate(date),
    start,
    end,
    freeMemberIds: ["a", "b"],
    unknownMemberIds: [],
    busyMemberIds: [],
    score: 80,
    reasons,
  };
}

const friday = window("2026-11-27", 18 * 60, 22 * 60, [
  { code: "ALL_AVAILABLE" },
  { code: "EVENING" },
]);
const saturday = window("2026-11-28", 12 * 60, 14 * 60 + 30, [
  { code: "ALL_AVAILABLE" },
  { code: "GOOD_WEEKDAY" },
]);
const outlook: GroupOutlook = {
  members: [
    { accountId: "a", hasProfile: true },
    { accountId: "b", hasProfile: true },
  ] as unknown as GroupOutlook["members"],
  windows: [friday, saturday],
  days: [
    { date: friday.date, best: friday },
    { date: saturday.date, best: saturday },
  ],
};

describe("formatHours", () => {
  it("says hours in half-hour steps with a Chilean decimal comma", () => {
    expect(formatHours(4)).toBe("4 h");
    expect(formatHours(2.5)).toBe("2,5 h");
    expect(formatHours(2.4)).toBe("2,5 h");
  });
});

describe("groupOptions", () => {
  it("drops tags every option shares and keeps the ones that differ", () => {
    const options = groupOptions(group, [], outlook);
    // "Pueden todos" is on both rows, so it goes; "Más pronto" breaks the tie.
    expect(options.map((o) => o.reasons)).toEqual([
      ["Tarde-noche", "Más pronto"],
      ["Buen día"],
    ]);
  });

  it("keeps the free window as the option's time", () => {
    const [first] = groupOptions(group, [], outlook);
    expect(first?.windowStart).toBe(18 * 60);
    expect(first?.windowEnd).toBe(22 * 60);
  });
});

describe("groupStrip", () => {
  it("shows how long everyone is free when everyone can", () => {
    const strip = groupStrip(group, outlook, groupOptions(group, [], outlook));
    expect(strip.map((d) => d.hours)).toEqual([4, 2.5]);
    expect(strip[0]?.label).toContain("pueden todos, 4 h libres");
  });
});
