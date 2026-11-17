import {
  createGroup,
  createPerson,
  createProfile,
  createSchedule,
  type Group,
  joinGroup,
  parseLocalDate,
  proposeGroupPlan,
  scheduleId,
} from "@amigo/core";
import { describe, expect, it } from "vitest";
import {
  InMemoryCalendarSourceRepository,
  InMemoryGroupPlanRepository,
  InMemoryGroupRepository,
  InMemoryPersonRepository,
  InMemoryProductEventRepository,
  InMemoryProfileRepository,
} from "./in-memory-groups";

const NOW = Date.UTC(2026, 10, 15, 12);

const group = (id: string, ownerId: string, inviteCode = `inv_${id}`): Group =>
  createGroup({
    id,
    inviteCode,
    name: `Grupo ${id}`,
    ownerId,
    ownerName: "Ana",
    timezone: "America/Santiago",
    now: NOW,
  });

describe("InMemoryGroupRepository", () => {
  it("finds a group by id and by invite code", async () => {
    const repo = new InMemoryGroupRepository();
    await repo.save(group("g1", "acc_ana", "secret"));
    expect((await repo.findById("g1"))?.name).toBe("Grupo g1");
    expect((await repo.findByInviteCode("secret"))?.id).toBe("g1");
    expect(await repo.findByInviteCode("nope")).toBeNull();
  });

  it("lists the account's groups, most recently joined first", async () => {
    const repo = new InMemoryGroupRepository();
    await repo.save(group("old", "acc_ana"));
    await repo.save(
      joinGroup(group("joined", "acc_beto"), {
        accountId: "acc_ana",
        displayName: "Ana",
        now: NOW + 1000,
      }),
    );
    await repo.save(group("foreign", "acc_caro"));
    expect((await repo.listForAccount("acc_ana")).map((g) => g.id)).toEqual([
      "joined",
      "old",
    ]);
  });

  it("finds a group by its new invite code after the code changes", async () => {
    const repo = new InMemoryGroupRepository();
    await repo.save(group("g1", "acc_ana", "first"));
    await repo.save(group("g1", "acc_ana", "second"));
    expect(await repo.findByInviteCode("first")).toBeNull();
    expect((await repo.findByInviteCode("second"))?.id).toBe("g1");
  });

  it("deletes a group", async () => {
    const repo = new InMemoryGroupRepository([group("g1", "acc_ana")]);
    await repo.delete("g1");
    expect(await repo.findById("g1")).toBeNull();
  });

  it("is not affected by mutating returned objects", async () => {
    const repo = new InMemoryGroupRepository([group("g1", "acc_ana")]);
    const found = await repo.findById("g1");
    (found as { name: string }).name = "changed";
    expect((await repo.findById("g1"))?.name).toBe("Grupo g1");
  });
});

describe("InMemoryProfileRepository", () => {
  it("stores several schedules per account, keyed by schedule id", async () => {
    const repo = new InMemoryProfileRepository();
    await repo.save(createProfile({ accountId: "acc_ana", now: NOW }));
    await repo.save(
      createSchedule({
        accountId: "acc_ana",
        id: "sch_vac",
        name: "Vacaciones",
        now: NOW + 1,
      }),
    );
    await repo.save(createProfile({ accountId: "acc_beto", now: NOW }));
    // Saving the same id again replaces it.
    await repo.save(
      createSchedule({
        accountId: "acc_ana",
        id: "sch_vac",
        name: "Verano",
        now: NOW + 1,
      }),
    );

    expect(
      (await repo.listForAccount("acc_ana")).map((p) => [
        scheduleId(p),
        p.name,
      ]),
    ).toEqual([
      ["default", undefined],
      ["sch_vac", "Verano"],
    ]);
    expect(await repo.listForAccount("acc_x")).toEqual([]);
    expect(
      (await repo.listForAccounts(["acc_beto", "acc_x", "acc_ana"]))
        .map((p) => p.accountId)
        .sort(),
    ).toEqual(["acc_ana", "acc_ana", "acc_beto"]);

    await repo.delete("acc_ana", "sch_vac");
    expect((await repo.listForAccount("acc_ana")).map(scheduleId)).toEqual([
      "default",
    ]);
  });
});

describe("InMemoryPersonRepository", () => {
  it("stores one person per account and returns several, skipping missing ones", async () => {
    const repo = new InMemoryPersonRepository();
    await repo.save(
      createPerson({ accountId: "acc_ana", displayName: "Ana", now: NOW }),
    );
    await repo.save(
      createPerson({ accountId: "acc_beto", displayName: "Beto", now: NOW }),
    );
    expect((await repo.findByAccount("acc_ana"))?.displayName).toBe("Ana");
    expect(await repo.findByAccount("acc_x")).toBeNull();
    expect(
      (await repo.findByAccounts(["acc_beto", "acc_x", "acc_ana"])).map(
        (p) => p.accountId,
      ),
    ).toEqual(["acc_beto", "acc_ana"]);
  });
});

describe("InMemoryGroupPlanRepository", () => {
  it("lists a group's plans by date, then start time", async () => {
    const g = group("g1", "acc_ana");
    const plan = (id: string, date: string, start: number) =>
      proposeGroupPlan(g, {
        id,
        accountId: "acc_ana",
        title: id,
        date,
        start,
        durationMinutes: 60,
        now: NOW,
      });
    const repo = new InMemoryGroupPlanRepository();
    await repo.save(plan("late", "2026-12-20", 1200));
    await repo.save(plan("early", "2026-12-19", 1200));
    await repo.save(plan("morning", "2026-12-20", 600));
    await repo.save(
      proposeGroupPlan(group("g2", "acc_ana"), {
        id: "other",
        accountId: "acc_ana",
        title: "x",
        date: parseLocalDate("2026-12-01"),
        start: 600,
        durationMinutes: 60,
        now: NOW,
      }),
    );
    expect((await repo.listForGroup("g1")).map((p) => p.id)).toEqual([
      "early",
      "morning",
      "late",
    ]);
    expect((await repo.findById("other"))?.groupId).toBe("g2");
  });
});

describe("InMemoryCalendarSourceRepository", () => {
  it("keeps one source per account and calendar id", async () => {
    const repo = new InMemoryCalendarSourceRepository();
    const source = {
      accountId: "acc_ana",
      calendarId: "work",
      url: "https://a.test/1.ics",
      createdAt: NOW,
    };
    await repo.save(source);
    await repo.save({ ...source, url: "https://a.test/2.ics" });
    await repo.save({ ...source, accountId: "acc_beto" });
    expect(await repo.listForAccount("acc_ana")).toEqual([
      { ...source, url: "https://a.test/2.ics" },
    ]);
    await repo.delete("acc_ana", "work");
    expect(await repo.listForAccount("acc_ana")).toEqual([]);
    expect(await repo.listForAccount("acc_beto")).toHaveLength(1);
  });
});

describe("InMemoryCalendarSourceRepository.listAll", () => {
  it("lists every account's sources, oldest first", async () => {
    const repo = new InMemoryCalendarSourceRepository();
    const beto = {
      accountId: "acc_beto",
      calendarId: "u",
      url: "https://a.test/b.ics",
      createdAt: NOW + 1,
    };
    const ana = {
      accountId: "acc_ana",
      calendarId: "work",
      url: "https://a.test/a.ics",
      createdAt: NOW,
    };
    await repo.save(beto);
    await repo.save(ana);
    expect(await repo.listAll()).toEqual([ana, beto]);
    await repo.delete("acc_ana", "work");
    expect(await repo.listAll()).toEqual([beto]);
  });
});

describe("InMemoryProductEventRepository", () => {
  it("keeps recorded events in order, as copies", async () => {
    const repo = new InMemoryProductEventRepository();
    const created = {
      kind: "profile_created" as const,
      accountId: "acc_ana",
      at: NOW,
      setupSeconds: 80,
    };
    await repo.record(created);
    await repo.record({
      kind: "plan_proposed",
      accountId: "acc_ana",
      groupId: "g_1",
      planId: "p_1",
      at: NOW + 1,
    });
    const events = repo.list();
    expect(events.map((e) => e.kind)).toEqual([
      "profile_created",
      "plan_proposed",
    ]);
    expect(events[0]).toEqual(created);
    expect(events[0]).not.toBe(created);
  });
});
