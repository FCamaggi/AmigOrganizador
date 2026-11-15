import { describe, expect, it } from "vitest";
import { parseLocalDate } from "../availability/local-date";
import type { GroupPlan } from "../group/group-plan";
import {
  MAX_SETUP_SECONDS,
  planEvent,
  profileCreatedEvent,
} from "./product-event";

const NOW = Date.UTC(2026, 10, 15, 12, 0);

describe("profileCreatedEvent", () => {
  const event = (setupSeconds?: unknown) =>
    profileCreatedEvent({ accountId: "acc_ana", at: NOW, setupSeconds });

  it("records who created a profile, when, and the setup time", () => {
    expect(event(95)).toEqual({
      kind: "profile_created",
      accountId: "acc_ana",
      at: NOW,
      setupSeconds: 95,
    });
  });

  it("rounds the setup time to whole seconds", () => {
    expect(event(94.6).setupSeconds).toBe(95);
  });

  it("keeps zero and the maximum", () => {
    expect(event(0).setupSeconds).toBe(0);
    expect(event(MAX_SETUP_SECONDS).setupSeconds).toBe(MAX_SETUP_SECONDS);
  });

  it.each([
    ["missing", undefined],
    ["null", null],
    ["negative", -1],
    ["longer than a day", MAX_SETUP_SECONDS + 1],
    ["not a number", "95"],
    ["NaN", Number.NaN],
    ["infinite", Number.POSITIVE_INFINITY],
  ])("stores an unknown setup time when it is %s", (_label, value) => {
    expect(event(value).setupSeconds).toBeNull();
  });
});

describe("planEvent", () => {
  const plan: GroupPlan = {
    id: "plan_1",
    groupId: "g_1",
    title: "Asado",
    proposedBy: "acc_ana",
    date: parseLocalDate("2026-12-19"),
    start: 20 * 60,
    end: 23 * 60,
    status: "confirmed",
    createdAt: NOW,
    confirmedAt: NOW,
  };

  it("records the group and plan ids, never the title", () => {
    const event = planEvent("plan_confirmed", plan, {
      accountId: "acc_beto",
      at: NOW,
    });
    expect(event).toEqual({
      kind: "plan_confirmed",
      accountId: "acc_beto",
      groupId: "g_1",
      planId: "plan_1",
      at: NOW,
    });
    expect(JSON.stringify(event)).not.toContain("Asado");
  });

  it("records a proposal", () => {
    expect(
      planEvent("plan_proposed", plan, { accountId: "acc_ana", at: NOW }).kind,
    ).toBe("plan_proposed");
  });
});
