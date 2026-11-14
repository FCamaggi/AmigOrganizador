import { createPlan, type Plan, parseLocalDate } from "@amigo/core";
import { describe, expect, it } from "vitest";
import { InMemoryPlanRepository, newPlanId } from "./in-memory-plan-repository";

const NOW = Date.UTC(2026, 10, 13, 12, 0);

function plan(id: string, organizerId: string, createdAt = NOW): Plan {
  return createPlan({
    id,
    title: "Asado",
    organizerId,
    organizerName: "Ana",
    from: parseLocalDate("2026-11-14"),
    to: parseLocalDate("2026-11-20"),
    durationMinutes: 180,
    timezone: "America/Santiago",
    now: createdAt,
  });
}

describe("InMemoryPlanRepository", () => {
  it("returns null for an unknown id", async () => {
    const repo = new InMemoryPlanRepository();
    expect(await repo.findById("missing")).toBeNull();
  });

  it("finds a saved plan by id", async () => {
    const repo = new InMemoryPlanRepository();
    const saved = plan("p1", "acc_ana");
    await repo.save(saved);
    expect(await repo.findById("p1")).toEqual(saved);
  });

  it("replaces the plan with the same id", async () => {
    const repo = new InMemoryPlanRepository();
    await repo.save(plan("p1", "acc_ana"));
    const cancelled: Plan = { ...plan("p1", "acc_ana"), status: "cancelled" };
    await repo.save(cancelled);
    expect((await repo.findById("p1"))?.status).toBe("cancelled");
  });

  it("is not affected by mutating a returned or saved object", async () => {
    const repo = new InMemoryPlanRepository();
    const saved = plan("p1", "acc_ana");
    await repo.save(saved);
    (saved as { title: string }).title = "changed";
    const found = await repo.findById("p1");
    (found as { title: string }).title = "changed again";
    expect((await repo.findById("p1"))?.title).toBe("Asado");
  });

  it("lists plans the account organizes or joined, newest first", async () => {
    const repo = new InMemoryPlanRepository();
    const older = plan("p_old", "acc_ana", NOW);
    const joined: Plan = {
      ...plan("p_joined", "acc_beto", NOW + 2000),
      participants: [
        ...plan("p_joined", "acc_beto").participants,
        {
          accountId: "acc_ana",
          displayName: "Ana",
          joinedAt: NOW,
          answer: null,
        },
      ],
    };
    const newer = plan("p_new", "acc_ana", NOW + 1000);
    const foreign = plan("p_foreign", "acc_caro", NOW + 3000);
    for (const p of [older, joined, newer, foreign]) await repo.save(p);

    const ids = (await repo.listForAccount("acc_ana")).map((p) => p.id);
    expect(ids).toEqual(["p_joined", "p_new", "p_old"]);
  });

  it("can start with seed plans", async () => {
    const repo = new InMemoryPlanRepository([plan("p1", "acc_ana")]);
    expect(await repo.findById("p1")).not.toBeNull();
  });
});

describe("newPlanId", () => {
  it("is URL-safe and carries at least 128 bits", () => {
    const id = newPlanId();
    expect(id).toMatch(/^[A-Za-z0-9_-]{22,}$/);
  });

  it("does not repeat", () => {
    const ids = new Set(Array.from({ length: 1000 }, newPlanId));
    expect(ids.size).toBe(1000);
  });
});
