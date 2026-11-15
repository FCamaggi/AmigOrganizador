import { describe, expect, it } from "vitest";
import type { CalendarSource } from "./calendar-source-repository";
import {
  createProfile,
  type ImportedCalendar,
  type Profile,
  removeImportedCalendar,
  setImportedCalendar,
} from "./profile";
import type { ProfileRepository } from "./profile-repository";
import { resyncCalendars } from "./resync-calendars";

const HOUR = 60 * 60 * 1000;
// Core has no runtime globals (no structuredClone, no timers).
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const ticks = async (n: number) => {
  for (let i = 0; i < n; i++) await Promise.resolve();
};
const IMPORTED_AT = Date.UTC(2026, 10, 14, 12, 0);
const NOW = Date.UTC(2026, 10, 15, 9, 0);
const OLD_BUSY = [
  { start: Date.UTC(2026, 10, 20, 12), end: Date.UTC(2026, 10, 20, 14) },
];
const NEW_BUSY = [
  { start: Date.UTC(2026, 10, 21, 12), end: Date.UTC(2026, 10, 21, 18) },
];

class FakeProfiles implements ProfileRepository {
  readonly map = new Map<string, Profile>();
  saves = 0;

  async findByAccount(accountId: string): Promise<Profile | null> {
    const profile = this.map.get(accountId);
    return profile ? clone(profile) : null;
  }

  async findByAccounts(ids: readonly string[]): Promise<Profile[]> {
    return ids.flatMap((id) =>
      this.map.has(id) ? [clone(this.map.get(id) as Profile)] : [],
    );
  }

  async save(profile: Profile): Promise<void> {
    this.saves++;
    this.map.set(profile.accountId, clone(profile));
  }
}

const calendar = (
  id: string,
  name: string,
  busy = OLD_BUSY,
): ImportedCalendar => ({
  id,
  name,
  busy,
  syncedAt: IMPORTED_AT,
});

const source = (accountId: string, calendarId: string): CalendarSource => ({
  accountId,
  calendarId,
  url: `https://calendar.example/${accountId}/${calendarId}.ics`,
  createdAt: IMPORTED_AT,
});

function profileWith(
  accountId: string,
  ...calendars: ImportedCalendar[]
): Profile {
  let profile = createProfile({ accountId, now: IMPORTED_AT });
  for (const c of calendars) {
    profile = setImportedCalendar(profile, { calendar: c, now: IMPORTED_AT });
  }
  return profile;
}

function setup(...profiles: Profile[]) {
  const store = new FakeProfiles();
  for (const p of profiles) store.map.set(p.accountId, p);
  const deleted: string[] = [];
  return {
    store,
    deleted,
    deleteSource: async (accountId: string, calendarId: string) => {
      deleted.push(`${accountId}/${calendarId}`);
    },
  };
}

const fresh = async (input: { id: string; name: string }) => ({
  id: input.id,
  name: input.name,
  busy: NEW_BUSY,
  syncedAt: NOW,
});

describe("resyncCalendars", () => {
  it("stores the fresh busy time and keeps the name the person gave", async () => {
    const { store, deleteSource } = setup(
      profileWith("acc_ana", calendar("cal_1", "Trabajo")),
    );
    const calls: unknown[] = [];

    const report = await resyncCalendars({
      sources: [source("acc_ana", "cal_1")],
      profiles: store,
      deleteSource,
      fetchCalendar: async (input) => {
        calls.push(input);
        return { ...(await fresh(input)), name: "ignored" };
      },
      now: () => NOW,
    });

    expect(report).toEqual({ synced: 1, failed: 0, orphaned: 0 });
    expect(calls).toEqual([
      {
        id: "cal_1",
        name: "Trabajo",
        url: "https://calendar.example/acc_ana/cal_1.ics",
      },
    ]);
    const saved = await store.findByAccount("acc_ana");
    expect(saved?.importedCalendars).toEqual([
      { id: "cal_1", name: "Trabajo", busy: NEW_BUSY, syncedAt: NOW },
    ]);
    expect(saved?.updatedAt).toBe(NOW);
  });

  it("keeps the previous busy time when a calendar can't be read, and goes on", async () => {
    const { store, deleteSource } = setup(
      profileWith("acc_ana", calendar("cal_1", "Trabajo")),
      profileWith("acc_beto", calendar("cal_2", "U")),
    );

    const report = await resyncCalendars({
      sources: [source("acc_ana", "cal_1"), source("acc_beto", "cal_2")],
      profiles: store,
      deleteSource,
      fetchCalendar: async (input) => {
        if (input.id === "cal_1") throw new Error("timeout");
        return fresh(input);
      },
      now: () => NOW,
    });

    expect(report).toEqual({ synced: 1, failed: 1, orphaned: 0 });
    expect(
      (await store.findByAccount("acc_ana"))?.importedCalendars[0]?.busy,
    ).toEqual(OLD_BUSY);
    expect(
      (await store.findByAccount("acc_beto"))?.importedCalendars[0]?.busy,
    ).toEqual(NEW_BUSY);
  });

  it("counts a calendar with invalid busy time as failed and leaves the profile alone", async () => {
    const { store, deleteSource } = setup(
      profileWith("acc_ana", calendar("cal_1", "Trabajo")),
    );

    const report = await resyncCalendars({
      sources: [source("acc_ana", "cal_1")],
      profiles: store,
      deleteSource,
      fetchCalendar: async (input) => ({
        ...(await fresh(input)),
        busy: [{ start: NOW + HOUR, end: NOW }],
      }),
      now: () => NOW,
    });

    expect(report).toEqual({ synced: 0, failed: 1, orphaned: 0 });
    expect(store.saves).toBe(0);
  });

  it("drops a source whose calendar is no longer in the profile, without reading it", async () => {
    const { store, deleted, deleteSource } = setup(profileWith("acc_ana"));
    let fetched = 0;

    const report = await resyncCalendars({
      sources: [source("acc_ana", "cal_gone"), source("acc_nobody", "cal_x")],
      profiles: store,
      deleteSource,
      fetchCalendar: async (input) => {
        fetched++;
        return fresh(input);
      },
      now: () => NOW,
    });

    expect(report).toEqual({ synced: 0, failed: 0, orphaned: 2 });
    expect(fetched).toBe(0);
    expect(deleted).toEqual(["acc_ana/cal_gone", "acc_nobody/cal_x"]);
    expect(store.saves).toBe(0);
  });

  it("doesn't bring back a calendar removed while it was being read", async () => {
    const { store, deleteSource } = setup(
      profileWith("acc_ana", calendar("cal_1", "Trabajo")),
    );

    const report = await resyncCalendars({
      sources: [source("acc_ana", "cal_1")],
      profiles: store,
      deleteSource,
      fetchCalendar: async (input) => {
        const current = store.map.get("acc_ana") as Profile;
        store.map.set(
          "acc_ana",
          removeImportedCalendar(current, { id: "cal_1", now: NOW }),
        );
        return fresh(input);
      },
      now: () => NOW,
    });

    expect(report).toEqual({ synced: 0, failed: 0, orphaned: 1 });
    expect((await store.findByAccount("acc_ana"))?.importedCalendars).toEqual(
      [],
    );
  });

  it("keeps edits the person saved while the calendar was being read", async () => {
    const { store, deleteSource } = setup(
      profileWith("acc_ana", calendar("cal_1", "Trabajo")),
    );

    await resyncCalendars({
      sources: [source("acc_ana", "cal_1")],
      profiles: store,
      deleteSource,
      fetchCalendar: async (input) => {
        const current = store.map.get("acc_ana") as Profile;
        store.map.set("acc_ana", {
          ...current,
          busyDays: { "2026-11-22": [{ start: 600, end: 720 }] },
        });
        return fresh(input);
      },
      now: () => NOW,
    });

    const saved = await store.findByAccount("acc_ana");
    expect(saved?.busyDays).toEqual({
      "2026-11-22": [{ start: 600, end: 720 }],
    });
    expect(saved?.importedCalendars[0]?.busy).toEqual(NEW_BUSY);
  });

  it("keeps both calendars of one person when their reads finish out of order", async () => {
    const { store, deleteSource } = setup(
      profileWith(
        "acc_ana",
        calendar("cal_1", "Trabajo"),
        calendar("cal_2", "U"),
      ),
    );
    const delays: Record<string, number> = { cal_1: 20, cal_2: 0 };

    const report = await resyncCalendars({
      sources: [source("acc_ana", "cal_1"), source("acc_ana", "cal_2")],
      profiles: store,
      deleteSource,
      fetchCalendar: async (input) => {
        await ticks(delays[input.id] ?? 0);
        return fresh(input);
      },
      now: () => NOW,
      concurrency: 4,
    });

    expect(report).toEqual({ synced: 2, failed: 0, orphaned: 0 });
    const saved = await store.findByAccount("acc_ana");
    expect(saved?.importedCalendars.map((c) => [c.id, c.busy])).toEqual([
      ["cal_1", NEW_BUSY],
      ["cal_2", NEW_BUSY],
    ]);
  });

  it("reads different people's calendars at the same time, up to the limit", async () => {
    const accounts = ["a", "b", "c", "d", "e"];
    const { store, deleteSource } = setup(
      ...accounts.map((a) => profileWith(a, calendar(`cal_${a}`, "Trabajo"))),
    );
    let running = 0;
    let peak = 0;

    const report = await resyncCalendars({
      sources: accounts.map((a) => source(a, `cal_${a}`)),
      profiles: store,
      deleteSource,
      fetchCalendar: async (input) => {
        running++;
        peak = Math.max(peak, running);
        await ticks(5);
        running--;
        return fresh(input);
      },
      now: () => NOW,
      concurrency: 2,
    });

    expect(report).toEqual({ synced: 5, failed: 0, orphaned: 0 });
    expect(peak).toBe(2);
  });

  it("counts a store failure as failed and goes on with the next person", async () => {
    const { store, deleteSource } = setup(
      profileWith("acc_ana", calendar("cal_1", "Trabajo")),
      profileWith("acc_beto", calendar("cal_2", "U")),
    );
    const flaky: ProfileRepository = {
      findByAccount: async (id) => {
        if (id === "acc_ana") throw new Error("connection reset");
        return store.findByAccount(id);
      },
      findByAccounts: (ids) => store.findByAccounts(ids),
      save: (p) => store.save(p),
    };

    const report = await resyncCalendars({
      sources: [source("acc_ana", "cal_1"), source("acc_beto", "cal_2")],
      profiles: flaky,
      deleteSource,
      fetchCalendar: fresh,
      now: () => NOW,
      concurrency: 1,
    });

    expect(report).toEqual({ synced: 1, failed: 1, orphaned: 0 });
  });

  it("does nothing without sources", async () => {
    const { store, deleteSource } = setup();
    expect(
      await resyncCalendars({
        sources: [],
        profiles: store,
        deleteSource,
        fetchCalendar: fresh,
        now: () => NOW,
      }),
    ).toEqual({ synced: 0, failed: 0, orphaned: 0 });
  });
});
