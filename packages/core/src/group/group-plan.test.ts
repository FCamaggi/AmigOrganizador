import { describe, expect, it } from "vitest";
import { parseLocalDate } from "../availability/local-date";
import { createGroup, type Group, joinGroup } from "./group";
import {
  cancelGroupPlan,
  confirmGroupPlan,
  type GroupPlan,
  GroupPlanError,
  groupFeed,
  type NewGroupPlan,
  proposeGroupPlan,
} from "./group-plan";

const h = (hours: number) => hours * 60;
const NOW = Date.UTC(2026, 10, 15, 12, 0);
const SAT = parseLocalDate("2026-12-19");

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

const proposal: NewGroupPlan = {
  id: "gp_1",
  accountId: "acc_beto",
  title: "  Asado  ",
  date: SAT,
  start: h(19),
  durationMinutes: 180,
  now: NOW,
};

function expectGroupPlanError(
  action: () => unknown,
  code: GroupPlanError["code"],
) {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(GroupPlanError);
    expect((error as GroupPlanError).code).toBe(code);
    return;
  }
  throw new Error(`expected GroupPlanError ${code}`);
}

const proposed = (): GroupPlan => proposeGroupPlan(group(), proposal);

describe("proposeGroupPlan", () => {
  it("creates a proposed plan for the group", () => {
    expect(proposed()).toEqual({
      id: "gp_1",
      groupId: "g_1",
      title: "Asado",
      proposedBy: "acc_beto",
      date: SAT,
      start: h(19),
      end: h(22),
      status: "proposed",
      createdAt: NOW,
      confirmedAt: null,
    });
  });

  it("lets the slot pass midnight", () => {
    expect(proposeGroupPlan(group(), { ...proposal, start: h(22) }).end).toBe(
      h(25),
    );
  });

  it.each([
    ["someone outside the group", { accountId: "acc_x" }, "NOT_A_MEMBER"],
    ["an empty title", { title: "  " }, "INVALID_TITLE"],
    ["a title over 80 characters", { title: "x".repeat(81) }, "INVALID_TITLE"],
    ["a start off the 15-minute grid", { start: h(19) + 10 }, "INVALID_TIME"],
    ["a start outside the day", { start: h(24) }, "INVALID_TIME"],
    ["a duration under 15 minutes", { durationMinutes: 0 }, "INVALID_DURATION"],
    [
      "a duration over 12 hours",
      { durationMinutes: h(12) + 15 },
      "INVALID_DURATION",
    ],
    ["a duration off the grid", { durationMinutes: 50 }, "INVALID_DURATION"],
    ["a malformed date", { date: "2026-02-30" }, "INVALID_DATE"],
  ] as const)("rejects %s", (_label, change, code) => {
    expectGroupPlanError(
      () => proposeGroupPlan(group(), { ...proposal, ...change }),
      code,
    );
  });
});

describe("confirmGroupPlan", () => {
  it("lets the proposer confirm", () => {
    const plan = confirmGroupPlan(proposed(), group(), {
      accountId: "acc_beto",
      now: NOW + 5,
    });
    expect(plan).toMatchObject({ status: "confirmed", confirmedAt: NOW + 5 });
  });

  it("lets the group owner confirm", () => {
    expect(
      confirmGroupPlan(proposed(), group(), { accountId: "acc_ana", now: NOW })
        .status,
    ).toBe("confirmed");
  });

  it("rejects any other member", () => {
    expectGroupPlanError(
      () =>
        confirmGroupPlan(proposed(), group(), {
          accountId: "acc_caro",
          now: NOW,
        }),
      "NOT_ALLOWED",
    );
  });

  it("rejects a plan that is not proposed any more", () => {
    const cancelled = cancelGroupPlan(proposed(), group(), {
      accountId: "acc_beto",
    });
    expectGroupPlanError(
      () =>
        confirmGroupPlan(cancelled, group(), {
          accountId: "acc_beto",
          now: NOW,
        }),
      "NOT_PROPOSED",
    );
  });

  it("rejects a plan from another group", () => {
    const other = { ...group(), id: "g_2" };
    expectGroupPlanError(
      () =>
        confirmGroupPlan(proposed(), other, { accountId: "acc_ana", now: NOW }),
      "WRONG_GROUP",
    );
  });
});

describe("cancelGroupPlan", () => {
  it("cancels a proposed or confirmed plan", () => {
    const confirmed = confirmGroupPlan(proposed(), group(), {
      accountId: "acc_beto",
      now: NOW,
    });
    expect(
      cancelGroupPlan(confirmed, group(), { accountId: "acc_ana" }).status,
    ).toBe("cancelled");
  });

  it("rejects a member who neither proposed it nor owns the group", () => {
    expectGroupPlanError(
      () => cancelGroupPlan(proposed(), group(), { accountId: "acc_caro" }),
      "NOT_ALLOWED",
    );
  });

  it("rejects cancelling twice", () => {
    const cancelled = cancelGroupPlan(proposed(), group(), {
      accountId: "acc_beto",
    });
    expectGroupPlanError(
      () => cancelGroupPlan(cancelled, group(), { accountId: "acc_beto" }),
      "ALREADY_CANCELLED",
    );
  });
});

describe("groupFeed", () => {
  it("lists only confirmed plans, as invites in the group's timezone", () => {
    const g = group();
    const confirmed = confirmGroupPlan(proposed(), g, {
      accountId: "acc_beto",
      now: NOW,
    });
    const stillProposed = proposeGroupPlan(g, { ...proposal, id: "gp_2" });
    const feed = groupFeed(
      g,
      [confirmed, stillProposed],
      (plan) => `https://x.test/p/${plan.id}`,
    );
    expect(feed).toEqual({
      name: "Los del colegio",
      invites: [
        {
          uid: "gp_1@amigorganizador",
          title: "Asado",
          // 19:00 in Santiago (UTC-3 in December).
          start: Date.UTC(2026, 11, 19, 22),
          end: Date.UTC(2026, 11, 20, 1),
          url: "https://x.test/p/gp_1",
          description: "Los del colegio · https://x.test/p/gp_1",
        },
      ],
    });
  });
});
