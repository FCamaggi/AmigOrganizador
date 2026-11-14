import { describe, expect, it } from "vitest";
import { parseLocalDate } from "../availability/local-date";
import {
  answerPlan,
  cancelPlan,
  confirmPlan,
  createPlan,
  joinPlan,
  type NewPlan,
  type Plan,
  PlanError,
  suggestOptions,
} from "./plan";

const h = (hours: number) => hours * 60;
const NOW = Date.UTC(2026, 10, 13, 12, 0);
const FRIDAY = parseLocalDate("2026-11-13");
const SATURDAY = parseLocalDate("2026-11-14");
const WHOLE_DAY = [{ start: 0, end: h(24) }];

const newPlan: NewPlan = {
  id: "p_secret",
  title: "  Asado  ",
  organizerId: "acc_ana",
  organizerName: "Ana",
  from: FRIDAY,
  to: SATURDAY,
  durationMinutes: 180,
  timezone: "America/Santiago",
  now: NOW,
};

function expectPlanError(action: () => unknown, code: PlanError["code"]) {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(PlanError);
    expect((error as PlanError).code).toBe(code);
    return;
  }
  throw new Error(`expected PlanError ${code}`);
}

function withBeto(plan: Plan = createPlan(newPlan)): Plan {
  return joinPlan(plan, {
    accountId: "acc_beto",
    displayName: "Beto",
    now: NOW,
  });
}

describe("createPlan", () => {
  it("creates an open plan with the organizer as first participant", () => {
    const plan = createPlan(newPlan);

    expect(plan).toEqual({
      id: "p_secret",
      title: "Asado",
      organizerId: "acc_ana",
      from: FRIDAY,
      to: SATURDAY,
      durationMinutes: 180,
      timezone: "America/Santiago",
      status: "open",
      createdAt: NOW,
      participants: [
        {
          accountId: "acc_ana",
          displayName: "Ana",
          joinedAt: NOW,
          answer: null,
        },
      ],
      confirmed: null,
    });
  });

  it.each([
    ["an empty title", { title: "   " }, "INVALID_TITLE"],
    ["a title over 80 characters", { title: "x".repeat(81) }, "INVALID_TITLE"],
    [
      "an end before the start",
      { from: SATURDAY, to: FRIDAY },
      "INVALID_RANGE",
    ],
    [
      "a range over 60 days",
      { to: parseLocalDate("2027-01-12") },
      "INVALID_RANGE",
    ],
    [
      "a duration under 15 minutes",
      { durationMinutes: 10 },
      "INVALID_DURATION",
    ],
    ["a duration over 12 hours", { durationMinutes: 735 }, "INVALID_DURATION"],
    [
      "a duration off the 15-minute grid",
      { durationMinutes: 50 },
      "INVALID_DURATION",
    ],
    ["an empty organizer name", { organizerName: " " }, "INVALID_NAME"],
  ] as const)("rejects %s", (_label, override, code) => {
    expectPlanError(() => createPlan({ ...newPlan, ...override }), code);
  });
});

describe("joinPlan", () => {
  it("adds a participant without an answer", () => {
    const plan = withBeto();
    expect(
      plan.participants.map((p) => [p.accountId, p.displayName, p.answer]),
    ).toEqual([
      ["acc_ana", "Ana", null],
      ["acc_beto", "Beto", null],
    ]);
  });

  it("is idempotent for someone who already joined", () => {
    const plan = withBeto();
    expect(
      joinPlan(plan, {
        accountId: "acc_beto",
        displayName: "Otro",
        now: NOW + 1,
      }),
    ).toBe(plan);
  });

  it("rejects joining a plan that is not open", () => {
    const cancelled = cancelPlan(createPlan(newPlan), { accountId: "acc_ana" });
    expectPlanError(
      () =>
        joinPlan(cancelled, {
          accountId: "acc_beto",
          displayName: "Beto",
          now: NOW,
        }),
      "PLAN_NOT_OPEN",
    );
  });
});

describe("answerPlan", () => {
  it("stores the participant's availability and when they answered", () => {
    const days = { [FRIDAY]: { coverage: WHOLE_DAY, busy: [] } };
    const plan = answerPlan(withBeto(), {
      accountId: "acc_beto",
      days,
      now: NOW + 5,
    });

    expect(plan.participants[1]?.answer).toEqual({ days, answeredAt: NOW + 5 });
  });

  it("replaces a previous answer", () => {
    const first = answerPlan(withBeto(), {
      accountId: "acc_beto",
      days: { [FRIDAY]: { coverage: WHOLE_DAY, busy: [] } },
      now: NOW,
    });
    const second = answerPlan(first, {
      accountId: "acc_beto",
      days: { [SATURDAY]: { coverage: WHOLE_DAY, busy: [] } },
      now: NOW + 1,
    });
    expect(Object.keys(second.participants[1]?.answer?.days ?? {})).toEqual([
      SATURDAY,
    ]);
  });

  it("accepts the day before the range for overnight spill", () => {
    const plan = answerPlan(withBeto(), {
      accountId: "acc_beto",
      days: { "2026-11-12": { coverage: WHOLE_DAY, busy: [] } },
      now: NOW,
    });
    expect(plan.participants[1]?.answer).not.toBeNull();
  });

  it("rejects dates outside the plan range", () => {
    expectPlanError(
      () =>
        answerPlan(withBeto(), {
          accountId: "acc_beto",
          days: { "2026-11-20": { coverage: WHOLE_DAY, busy: [] } },
          now: NOW,
        }),
      "DATE_OUT_OF_RANGE",
    );
  });

  it("rejects someone who has not joined", () => {
    expectPlanError(
      () =>
        answerPlan(createPlan(newPlan), {
          accountId: "acc_x",
          days: {},
          now: NOW,
        }),
      "NOT_A_PARTICIPANT",
    );
  });
});

describe("suggestOptions", () => {
  it("ranks windows at least as long as the plan, counting non-answers as unknown", () => {
    let plan = withBeto();
    plan = joinPlan(plan, {
      accountId: "acc_caro",
      displayName: "Caro",
      now: NOW,
    });
    plan = answerPlan(plan, {
      accountId: "acc_ana",
      days: {
        [FRIDAY]: { coverage: WHOLE_DAY, busy: [{ start: h(8), end: h(19) }] },
      },
      now: NOW,
    });
    plan = answerPlan(plan, {
      accountId: "acc_beto",
      days: {
        [FRIDAY]: { coverage: WHOLE_DAY, busy: [{ start: h(8), end: h(18) }] },
      },
      now: NOW,
    });

    const options = suggestOptions(plan);

    expect(options).toHaveLength(1);
    expect(options[0]).toMatchObject({
      date: FRIDAY,
      start: h(19),
      end: h(22),
      freeMemberIds: ["acc_ana", "acc_beto"],
      unknownMemberIds: ["acc_caro"],
    });
  });

  it("drops windows shorter than the plan duration", () => {
    const plan = answerPlan(createPlan({ ...newPlan, durationMinutes: 240 }), {
      accountId: "acc_ana",
      days: {
        [FRIDAY]: { coverage: WHOLE_DAY, busy: [{ start: h(8), end: h(19) }] },
      },
      now: NOW,
    });
    expect(suggestOptions(plan).filter((o) => o.date === FRIDAY)).toEqual([]);
  });
});

describe("confirmPlan", () => {
  it("lets the organizer confirm a date and start inside the range", () => {
    const plan = confirmPlan(withBeto(), {
      accountId: "acc_ana",
      date: SATURDAY,
      start: h(20),
      now: NOW + 10,
    });

    expect(plan.status).toBe("confirmed");
    expect(plan.confirmed).toEqual({
      date: SATURDAY,
      start: h(20),
      end: h(23),
      confirmedAt: NOW + 10,
    });
  });

  it("allows a confirmed slot that runs past midnight", () => {
    const plan = confirmPlan(createPlan(newPlan), {
      accountId: "acc_ana",
      date: SATURDAY,
      start: h(23),
      now: NOW,
    });
    expect(plan.confirmed?.end).toBe(h(26));
  });

  it.each([
    [{ accountId: "acc_beto" }, "NOT_ORGANIZER"],
    [{ date: parseLocalDate("2026-11-15") }, "DATE_OUT_OF_RANGE"],
    [{ start: -15 }, "INVALID_TIME"],
    [{ start: h(24) }, "INVALID_TIME"],
    [{ start: h(20) + 7 }, "INVALID_TIME"],
  ] as const)("rejects %j", (override, code) => {
    expectPlanError(
      () =>
        confirmPlan(withBeto(), {
          accountId: "acc_ana",
          date: FRIDAY,
          start: h(20),
          now: NOW,
          ...override,
        }),
      code,
    );
  });

  it("rejects confirming twice and answering after confirmation", () => {
    const plan = confirmPlan(withBeto(), {
      accountId: "acc_ana",
      date: FRIDAY,
      start: h(20),
      now: NOW,
    });
    expectPlanError(
      () =>
        confirmPlan(plan, {
          accountId: "acc_ana",
          date: FRIDAY,
          start: h(19),
          now: NOW,
        }),
      "PLAN_NOT_OPEN",
    );
    expectPlanError(
      () => answerPlan(plan, { accountId: "acc_beto", days: {}, now: NOW }),
      "PLAN_NOT_OPEN",
    );
  });
});

describe("cancelPlan", () => {
  it("lets only the organizer cancel an open plan", () => {
    expectPlanError(
      () => cancelPlan(withBeto(), { accountId: "acc_beto" }),
      "NOT_ORGANIZER",
    );
    expect(cancelPlan(withBeto(), { accountId: "acc_ana" }).status).toBe(
      "cancelled",
    );
  });
});

describe("immutability", () => {
  it("never mutates the plan it receives", () => {
    const plan = withBeto();
    const snapshot = JSON.stringify(plan);
    answerPlan(plan, { accountId: "acc_beto", days: {}, now: NOW });
    confirmPlan(plan, {
      accountId: "acc_ana",
      date: FRIDAY,
      start: h(20),
      now: NOW,
    });
    expect(JSON.stringify(plan)).toBe(snapshot);
  });
});

describe("answerPlan interval validation", () => {
  it("rejects intervals outside 0–2880 or inverted", () => {
    expectPlanError(
      () =>
        answerPlan(withBeto(), {
          accountId: "acc_beto",
          days: {
            [FRIDAY]: { coverage: [{ start: h(10), end: h(9) }], busy: [] },
          },
          now: NOW,
        }),
      "INVALID_TIME",
    );
  });
});
