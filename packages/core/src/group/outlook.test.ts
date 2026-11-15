import { describe, expect, it } from "vitest";
import { workweek } from "../availability/busy-templates";
import { parseLocalDate } from "../availability/local-date";
import {
  createProfile,
  type Profile,
  setDay,
  setTemplates,
} from "../profile/profile";
import { createGroup, type Group, joinGroup } from "./group";
import { groupDayLines, groupOutlook, outlookRange } from "./outlook";

const h = (hours: number) => hours * 60;
const NOW = Date.UTC(2026, 10, 15, 12, 0);
// 2026-11-20 is a Friday.
const FRI = parseLocalDate("2026-11-20");
const SAT = parseLocalDate("2026-11-21");
const SUN = parseLocalDate("2026-11-22");

function group(): Group {
  let g = createGroup({
    id: "g_1",
    inviteCode: "invite",
    name: "Los del colegio",
    ownerId: "acc_ana",
    ownerName: "Ana",
    timezone: "America/Santiago",
    now: NOW,
  });
  g = joinGroup(g, { accountId: "acc_beto", displayName: "Beto", now: NOW });
  return joinGroup(g, { accountId: "acc_caro", displayName: "Caro", now: NOW });
}

const officeWorker = (accountId: string): Profile =>
  setTemplates(createProfile({ accountId, now: NOW }), {
    templates: [workweek()],
    now: NOW,
  });

describe("outlookRange", () => {
  it("starts today in the group's timezone and looks 4 weeks ahead by default", () => {
    // 02:00 UTC on the 16th is still the 15th in Santiago.
    expect(outlookRange("America/Santiago", Date.UTC(2026, 10, 16, 2))).toEqual(
      {
        from: "2026-11-15",
        to: "2026-12-12",
      },
    );
  });

  it("accepts another number of days", () => {
    expect(outlookRange("UTC", NOW, 7)).toEqual({
      from: "2026-11-15",
      to: "2026-11-21",
    });
  });
});

describe("groupOutlook", () => {
  const profiles = [officeWorker("acc_ana"), officeWorker("acc_beto")];

  it("lists members and whether they have a profile", () => {
    const outlook = groupOutlook({
      group: group(),
      profiles,
      from: FRI,
      to: SAT,
    });
    expect(outlook.members).toEqual([
      { accountId: "acc_ana", displayName: "Ana", hasProfile: true },
      { accountId: "acc_beto", displayName: "Beto", hasProfile: true },
      { accountId: "acc_caro", displayName: "Caro", hasProfile: false },
    ]);
  });

  it("ranks the windows where members are free; a member without a profile is unknown", () => {
    const [best] = groupOutlook({
      group: group(),
      profiles,
      from: FRI,
      to: SAT,
    }).windows;
    // Friday evening outranks the whole Saturday: evenings score higher.
    expect(best).toMatchObject({
      date: FRI,
      start: h(18),
      end: h(22),
      freeMemberIds: ["acc_ana", "acc_beto"],
      unknownMemberIds: ["acc_caro"],
    });
    expect(best?.reasons).toContainEqual({
      code: "MISSING_DATA",
      memberIds: ["acc_caro"],
    });
  });

  it("gives each date its best window, or null when none works", () => {
    const busySunday = setDay(officeWorker("acc_beto"), {
      date: SUN,
      busy: [{ start: 0, end: h(24) }],
      exceptions: [],
      now: NOW,
    });
    const outlook = groupOutlook({
      group: group(),
      profiles: [officeWorker("acc_ana"), busySunday],
      from: FRI,
      to: SUN,
    });
    expect(outlook.days.map((d) => [d.date, d.best?.start ?? null])).toEqual([
      [FRI, h(18)],
      [SAT, h(8)],
      [SUN, null],
    ]);
  });

  it("uses the minimum length it is given", () => {
    const outlook = groupOutlook({
      group: group(),
      profiles,
      from: FRI,
      to: FRI,
      minimumMinutes: h(5),
    });
    expect(outlook.windows).toEqual([]);
  });

  it("ignores profiles of people outside the group", () => {
    const outlook = groupOutlook({
      group: group(),
      profiles: [...profiles, officeWorker("acc_stranger")],
      from: FRI,
      to: FRI,
    });
    expect(outlook.windows[0]?.freeMemberIds).toEqual(["acc_ana", "acc_beto"]);
  });
});

describe("groupDayLines", () => {
  it("draws each member's day; no profile is one unknown segment", () => {
    const lines = groupDayLines({
      group: group(),
      profiles: [officeWorker("acc_ana")],
      date: FRI,
      span: { start: h(8), end: h(24) },
    });
    expect(lines.map((l) => [l.accountId, l.answered, l.segments])).toEqual([
      [
        "acc_ana",
        true,
        [
          { start: h(8), end: h(9), state: "free" },
          { start: h(9), end: h(18), state: "busy" },
          { start: h(18), end: h(24), state: "free" },
        ],
      ],
      ["acc_beto", false, [{ start: h(8), end: h(24), state: "unknown" }]],
      ["acc_caro", false, [{ start: h(8), end: h(24), state: "unknown" }]],
    ]);
  });
});
