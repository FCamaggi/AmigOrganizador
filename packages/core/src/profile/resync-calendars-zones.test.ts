import { describe, expect, it } from "vitest";
import type { CalendarSource } from "./calendar-source-repository";
import { DEFAULT_SCHEDULE_ID, duplicateSchedule, scheduleId } from "./person";
import {
  createProfile,
  type ImportedCalendar,
  type Profile,
  setImportedCalendar,
  setTimezone,
} from "./profile";
import type { ProfileRepository } from "./profile-repository";
import { resyncCalendars } from "./resync-calendars";

const IMPORTED_AT = Date.UTC(2026, 10, 14, 12, 0);
const NOW = Date.UTC(2026, 10, 17, 9, 0);

class MemoryProfiles implements ProfileRepository {
  readonly map = new Map<string, Profile>();

  async listForAccount(accountId: string): Promise<Profile[]> {
    return [...this.map.values()].filter((p) => p.accountId === accountId);
  }

  async listForAccounts(ids: readonly string[]): Promise<Profile[]> {
    return [...this.map.values()].filter((p) => ids.includes(p.accountId));
  }

  async save(profile: Profile): Promise<void> {
    this.map.set(`${profile.accountId}/${scheduleId(profile)}`, profile);
  }

  async delete(accountId: string, id: string): Promise<void> {
    this.map.delete(`${accountId}/${id}`);
  }
}

describe("resyncCalendars across schedules in different time zones", () => {
  it("reads floating events in each schedule's own time zone when duplicated into another zone", async () => {
    const cal: ImportedCalendar = {
      id: "cal_1",
      name: "Trabajo",
      busy: [],
      syncedAt: IMPORTED_AT,
    };
    const base = setImportedCalendar(
      createProfile({ accountId: "acc_ana", now: IMPORTED_AT }),
      { calendar: cal, now: IMPORTED_AT },
    );
    const madridCopy = setTimezone(
      duplicateSchedule(base, {
        id: "sch_madrid",
        name: "Madrid",
        now: IMPORTED_AT,
      }),
      { timezone: "Europe/Madrid", now: IMPORTED_AT },
    );

    const store = new MemoryProfiles();
    await store.save(base);
    await store.save(madridCopy);

    const sources: CalendarSource[] = [
      {
        accountId: "acc_ana",
        calendarId: "cal_1",
        url: "https://calendar.example/acc_ana/cal_1.ics",
        createdAt: IMPORTED_AT,
      },
    ];
    const zones: string[] = [];

    const report = await resyncCalendars({
      sources,
      profiles: store,
      deleteSource: async () => {},
      fetchCalendar: async (input) => {
        zones.push(input.timeZone);
        const offset = input.timeZone === "Europe/Madrid" ? 1 : 2;
        return {
          id: input.id,
          name: input.name,
          busy: [{ start: NOW, end: NOW + offset * 3_600_000 }],
          syncedAt: NOW,
        };
      },
      now: () => NOW,
    });

    expect(report).toEqual({ synced: 1, failed: 0, orphaned: 0 });
    expect(zones).toEqual(["America/Santiago", "Europe/Madrid"]);
    const santiagoSaved = store.map.get(`acc_ana/${DEFAULT_SCHEDULE_ID}`);
    const madridSaved = store.map.get("acc_ana/sch_madrid");
    expect(santiagoSaved?.importedCalendars[0]?.busy).toEqual([
      { start: NOW, end: NOW + 2 * 3_600_000 },
    ]);
    expect(madridSaved?.importedCalendars[0]?.busy).toEqual([
      { start: NOW, end: NOW + 1 * 3_600_000 },
    ]);
  });
});
