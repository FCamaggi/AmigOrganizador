import { randomBytes } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  confirmGroupPlan,
  createGroup,
  createProfile,
  type Group,
  joinGroup,
  parseLocalDate,
  profileTimezone,
  proposeGroupPlan,
  setDay,
  setImportedCalendar,
  setTemplates,
  setTimezone,
  workweek,
} from "@amigo/core";
import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  calendarSources,
  createDb,
  decryptUrl,
  encryptUrl,
  PostgresCalendarSourceRepository,
  PostgresGroupPlanRepository,
  PostgresGroupRepository,
  PostgresProductEventRepository,
  PostgresProfileRepository,
  productEvents,
  schema,
} from "./index";

const NOW = Date.UTC(2026, 10, 15, 12);
const TEST_KEY = randomBytes(32).toString("base64");
const MIGRATIONS_FOLDER = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../drizzle",
);

const makeGroup = (
  id: string,
  ownerId: string,
  inviteCode = `inv_${id}`,
): Group =>
  createGroup({
    id,
    inviteCode,
    name: `Grupo ${id}`,
    ownerId,
    ownerName: "Ana",
    timezone: "America/Santiago",
    now: NOW,
  });

let client: PGlite;
let db: PgliteDatabase<typeof schema>;

beforeAll(async () => {
  client = new PGlite();
  db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
});

afterAll(async () => {
  await client.close();
});

beforeEach(async () => {
  await db.execute(
    sql`TRUNCATE TABLE app.groups, app.profiles, app.group_plans, app.calendar_sources, app.product_events`,
  );
});

describe("migrations and RLS", () => {
  it("enables row level security on every app table", async () => {
    const result = await db.execute<{
      tablename: string;
      rowsecurity: boolean;
    }>(
      sql`SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'app' ORDER BY tablename`,
    );
    expect(result.rows).toEqual([
      { tablename: "calendar_sources", rowsecurity: true },
      { tablename: "group_plans", rowsecurity: true },
      { tablename: "groups", rowsecurity: true },
      { tablename: "product_events", rowsecurity: true },
      { tablename: "profiles", rowsecurity: true },
    ]);
  });
});

describe("PostgresGroupRepository", () => {
  it("round-trips a group and finds it by id and invite code", async () => {
    const repo = new PostgresGroupRepository(db);
    const g = joinGroup(makeGroup("g1", "acc_ana", "secret"), {
      accountId: "acc_beto",
      displayName: "Beto",
      now: NOW + 500,
    });
    await repo.save(g);

    expect(await repo.findById("g1")).toEqual(g);
    expect(await repo.findByInviteCode("secret")).toEqual(g);
    expect(await repo.findById("missing")).toBeNull();
    expect(await repo.findByInviteCode("nope")).toBeNull();
  });

  it("replaces an existing group and updates its invite code", async () => {
    const repo = new PostgresGroupRepository(db);
    await repo.save(makeGroup("g1", "acc_ana", "first"));
    const updated = makeGroup("g1", "acc_ana", "second");
    await repo.save(updated);

    expect(await repo.findByInviteCode("first")).toBeNull();
    expect(await repo.findByInviteCode("second")).toEqual(updated);
  });

  it("lists the account's groups, most recently joined first, filtering non-members", async () => {
    const repo = new PostgresGroupRepository(db);
    await repo.save(makeGroup("old", "acc_ana"));
    await repo.save(
      joinGroup(makeGroup("joined", "acc_beto"), {
        accountId: "acc_ana",
        displayName: "Ana",
        now: NOW + 1000,
      }),
    );
    await repo.save(makeGroup("foreign", "acc_caro"));

    expect((await repo.listForAccount("acc_ana")).map((g) => g.id)).toEqual([
      "joined",
      "old",
    ]);
    expect(await repo.listForAccount("acc_nobody")).toEqual([]);
  });

  it("deletes a group", async () => {
    const repo = new PostgresGroupRepository(db);
    await repo.save(makeGroup("g1", "acc_ana"));
    await repo.delete("g1");
    expect(await repo.findById("g1")).toBeNull();
  });
});

describe("PostgresProfileRepository timezone", () => {
  it("keeps the person's zone, and an old profile without one reads as Santiago", async () => {
    const repo = new PostgresProfileRepository(db);
    await repo.save(
      setTimezone(createProfile({ accountId: "acc_ana", now: NOW }), {
        timezone: "Europe/Madrid",
        now: NOW,
      }),
    );
    await repo.save(createProfile({ accountId: "acc_beto", now: NOW }));
    const ana = await repo.findByAccount("acc_ana");
    const beto = await repo.findByAccount("acc_beto");
    expect(ana?.timezone).toBe("Europe/Madrid");
    expect(beto && profileTimezone(beto)).toBe("America/Santiago");
  });
});

describe("PostgresProfileRepository", () => {
  it("round-trips a full profile, replaces on save, and skips missing accounts", async () => {
    const repo = new PostgresProfileRepository(db);
    let ana = createProfile({ accountId: "acc_ana", now: NOW });
    ana = setTemplates(ana, {
      templates: [workweek({ start: 540, end: 1080 })],
      now: NOW + 100,
    });
    ana = setDay(ana, {
      date: "2026-12-20",
      busy: [{ start: 1200, end: 1320 }],
      exceptions: [{ start: 540, end: 720 }],
      now: NOW + 200,
    });
    ana = setImportedCalendar(ana, {
      calendar: {
        id: "work",
        name: "Trabajo",
        busy: [{ start: NOW, end: NOW + 3_600_000 }],
        syncedAt: NOW + 300,
      },
      now: NOW + 300,
    });

    await repo.save(createProfile({ accountId: "acc_ana", now: NOW }));
    await repo.save(ana);
    const beto = createProfile({ accountId: "acc_beto", now: NOW });
    await repo.save(beto);

    expect(await repo.findByAccount("acc_ana")).toEqual(ana);
    expect(await repo.findByAccount("acc_x")).toBeNull();
    expect(
      (await repo.findByAccounts(["acc_beto", "acc_x", "acc_ana"])).map(
        (p) => p.accountId,
      ),
    ).toEqual(["acc_beto", "acc_ana"]);
    expect(await repo.findByAccounts([])).toEqual([]);
  });
});

describe("PostgresGroupPlanRepository", () => {
  it("round-trips plans, replaces on save, and orders a group's plans by date then start", async () => {
    const g1 = makeGroup("g1", "acc_ana");
    const g2 = makeGroup("g2", "acc_ana");
    const plan = (id: string, date: string, start: number) =>
      proposeGroupPlan(g1, {
        id,
        accountId: "acc_ana",
        title: id,
        date,
        start,
        durationMinutes: 60,
        now: NOW,
      });

    const repo = new PostgresGroupPlanRepository(db);
    await repo.save(plan("late", "2026-12-20", 1200));
    await repo.save(plan("early", "2026-12-19", 1200));
    const morning = plan("morning", "2026-12-20", 600);
    await repo.save(morning);

    const confirmedMorning = confirmGroupPlan(morning, g1, {
      accountId: "acc_ana",
      now: NOW + 500,
    });
    await repo.save(confirmedMorning);

    const other = proposeGroupPlan(g2, {
      id: "other",
      accountId: "acc_ana",
      title: "x",
      date: parseLocalDate("2026-12-01"),
      start: 600,
      durationMinutes: 60,
      now: NOW,
    });
    await repo.save(other);

    const listed = await repo.listForGroup("g1");
    expect(listed.map((p) => p.id)).toEqual(["early", "morning", "late"]);
    expect(await repo.findById("morning")).toEqual(confirmedMorning);
    expect(await repo.findById("other")).toEqual(other);
    expect(await repo.findById("missing")).toBeNull();
  });
});

describe("PostgresCalendarSourceRepository", () => {
  it("encrypts the url at rest, replaces on save, decrypts on read, and deletes", async () => {
    const repo = new PostgresCalendarSourceRepository(db, TEST_KEY);
    const plainUrl =
      "https://calendar.google.com/calendar/ical/secret/basic.ics";
    const updatedUrl =
      "https://calendar.google.com/calendar/ical/rotated/basic.ics";
    const source = {
      accountId: "acc_ana",
      calendarId: "work",
      url: plainUrl,
      createdAt: NOW,
    };

    await repo.save(source);
    await repo.save({ ...source, url: updatedUrl });
    await repo.save({ ...source, accountId: "acc_beto" });

    const rawRows = await db.select().from(calendarSources);
    expect(rawRows).toHaveLength(2);
    for (const row of rawRows) {
      expect(row.urlCiphertext).toMatch(
        /^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
      );
      expect(row.urlCiphertext).not.toContain(plainUrl);
      expect(row.urlCiphertext).not.toContain(updatedUrl);
      expect(row.urlCiphertext).not.toContain("calendar.google.com");
    }

    expect(await repo.listForAccount("acc_ana")).toEqual([
      { ...source, url: updatedUrl },
    ]);

    await repo.delete("acc_ana", "work");
    expect(await repo.listForAccount("acc_ana")).toEqual([]);
    expect(await repo.listForAccount("acc_beto")).toHaveLength(1);
  });
});

describe("PostgresCalendarSourceRepository.listAll", () => {
  it("lists every account's sources decrypted, oldest first", async () => {
    const repo = new PostgresCalendarSourceRepository(db, TEST_KEY);
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
  });
});

describe("PostgresProductEventRepository", () => {
  it("stores each event as a row with its own columns", async () => {
    const repo = new PostgresProductEventRepository(db);
    await repo.record({
      kind: "profile_created",
      accountId: "acc_ana",
      at: NOW,
      setupSeconds: 95,
    });
    await repo.record({
      kind: "plan_confirmed",
      accountId: "acc_beto",
      groupId: "g_1",
      planId: "p_1",
      at: NOW + 1000,
    });

    const rows = await db
      .select()
      .from(productEvents)
      .orderBy(productEvents.at);
    expect(
      rows.map(({ id: _id, ...row }) => ({ ...row, at: row.at.getTime() })),
    ).toEqual([
      {
        kind: "profile_created",
        accountId: "acc_ana",
        groupId: null,
        planId: null,
        setupSeconds: 95,
        at: NOW,
      },
      {
        kind: "plan_confirmed",
        accountId: "acc_beto",
        groupId: "g_1",
        planId: "p_1",
        setupSeconds: null,
        at: NOW + 1000,
      },
    ]);
  });
});

describe("crypto", () => {
  it("encrypts with a random IV and decrypts back", () => {
    const url = "https://example.com/private.ics";
    const c1 = encryptUrl(url, TEST_KEY);
    const c2 = encryptUrl(url, TEST_KEY);
    expect(c1).not.toBe(c2);
    expect(decryptUrl(c1, TEST_KEY)).toBe(url);
    expect(decryptUrl(c2, TEST_KEY)).toBe(url);
  });

  it("rejects keys that are not 32 bytes in base64", () => {
    const shortKey = randomBytes(16).toString("base64");
    const longKey = randomBytes(48).toString("base64");
    expect(() => encryptUrl("https://a.test/1.ics", shortKey)).toThrow(
      /32 bytes/,
    );
    expect(() => encryptUrl("https://a.test/1.ics", longKey)).toThrow(
      /32 bytes/,
    );
    expect(() => decryptUrl("v1.a.b.c", shortKey)).toThrow(/32 bytes/);
  });

  it("throws when ciphertext, tag, iv, or version is tampered with or wrong key is used", () => {
    const ct = encryptUrl("https://a.test/secret.ics", TEST_KEY);
    const [version, iv, tag, body] = ct.split(".") as [
      string,
      string,
      string,
      string,
    ];
    const flipChar = (s: string) =>
      `${s.slice(0, -1)}${s.endsWith("A") ? "B" : "A"}`;

    expect(() => decryptUrl(`v2.${iv}.${tag}.${body}`, TEST_KEY)).toThrow();
    expect(() =>
      decryptUrl(`${version}.${flipChar(iv)}.${tag}.${body}`, TEST_KEY),
    ).toThrow();
    expect(() =>
      decryptUrl(`${version}.${iv}.${flipChar(tag)}.${body}`, TEST_KEY),
    ).toThrow();
    expect(() =>
      decryptUrl(`${version}.${iv}.${tag}.${flipChar(body)}`, TEST_KEY),
    ).toThrow();
    expect(() => decryptUrl(ct, randomBytes(32).toString("base64"))).toThrow();
    expect(() => decryptUrl("malformed", TEST_KEY)).toThrow();
  });
});

describe("createDb", () => {
  it("reuses one drizzle client per database url and works with repositories", () => {
    const db1 = createDb("postgres://user:pass@127.0.0.1:5432/db_one");
    const db2 = createDb("postgres://user:pass@127.0.0.1:5432/db_one");
    const db3 = createDb("postgres://user:pass@127.0.0.1:5432/db_two");
    expect(db1).toBe(db2);
    expect(db1).not.toBe(db3);
    expect(new PostgresGroupRepository(db1)).toBeInstanceOf(
      PostgresGroupRepository,
    );
  });
});
