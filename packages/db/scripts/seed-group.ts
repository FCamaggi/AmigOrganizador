/**
 * Adds synthetic friends to an existing group so its owner can see how the
 * group view behaves with other people. Seeded accounts use the `acc_seed_`
 * prefix, cannot sign in, and can be removed again with `--remove`.
 *
 *   DATABASE_URL=... npx tsx@4.19.2 packages/db/scripts/seed-group.ts <inviteCode>
 *   DATABASE_URL=... npx tsx@4.19.2 packages/db/scripts/seed-group.ts <inviteCode> --remove
 */
import {
  addDays,
  type BusyTemplate,
  createProfile,
  joinGroup,
  leaveGroup,
  setDay,
  setTemplates,
  setTimezone,
  shiftCycle,
  todayIn,
  workweek,
} from "@amigo/core";
import { eq, like } from "drizzle-orm";
import { createDb } from "../src/client";
import {
  PostgresGroupRepository,
  PostgresProfileRepository,
} from "../src/repositories";
import { profiles } from "../src/schema";

const SEED_PREFIX = "acc_seed_";
const h = (hours: number) => hours * 60;

interface SeedPerson {
  readonly id: string;
  readonly name: string;
  /** `null` = no profile yet, so the group reads them as unknown. */
  readonly templates: readonly BusyTemplate[] | null;
  readonly timezone?: string;
  /** Days from today with a one-off busy evening. */
  readonly busyEvenings?: readonly number[];
}

function people(today: string): SeedPerson[] {
  const classes: BusyTemplate = {
    kind: "classes",
    blocks: [1, 2, 3, 4, 5].map((weekday) => ({
      weekday,
      start: h(8),
      end: weekday === 5 ? h(13) : h(18),
    })),
  };
  return [
    { id: `${SEED_PREFIX}ana`, name: "Ana (seed)", templates: [workweek()] },
    { id: `${SEED_PREFIX}beto`, name: "Beto (seed)", templates: [classes] },
    { id: `${SEED_PREFIX}caro`, name: "Caro (seed)", templates: null },
    {
      id: `${SEED_PREFIX}diego`,
      name: "Diego (seed)",
      templates: [
        shiftCycle({ anchor: today, pattern: ["day", "night", "off", "off"] }),
      ],
    },
    {
      id: `${SEED_PREFIX}eli`,
      name: "Eli (seed)",
      templates: [workweek({ start: h(10), end: h(20) })],
      busyEvenings: [2, 5],
    },
    {
      id: `${SEED_PREFIX}fran`,
      name: "Fran (seed)",
      templates: [workweek({ start: h(8), end: h(17) })],
      timezone: "America/Argentina/Buenos_Aires",
    },
  ];
}

async function main(): Promise<void> {
  const [inviteCode, flag] = process.argv.slice(2);
  const url = process.env.DATABASE_URL;
  if (!inviteCode || !url) {
    throw new Error(
      "usage: DATABASE_URL=... seed-group.ts <inviteCode> [--remove]",
    );
  }
  const db = createDb(url);
  const groupsRepo = new PostgresGroupRepository(db);
  const profilesRepo = new PostgresProfileRepository(db);
  const group = await groupsRepo.findByInviteCode(inviteCode);
  if (!group) throw new Error("group not found");
  const now = Date.now();

  if (flag === "--remove") {
    let next = group;
    for (const member of group.members) {
      if (member.accountId.startsWith(SEED_PREFIX)) {
        // The real owner stays, so the group never empties here.
        next = leaveGroup(next, { accountId: member.accountId }) ?? next;
      }
    }
    await groupsRepo.save(next);
    const stillUsed =
      (await groupsRepo.listForAccount(`${SEED_PREFIX}ana`)).length > 0;
    if (!stillUsed) {
      await db
        .delete(profiles)
        .where(like(profiles.accountId, `${SEED_PREFIX}%`));
    }
    console.log(
      `removed ${group.members.length - next.members.length} seed members`,
    );
    process.exit(0);
  }

  const today = todayIn(group.timezone, now);
  let next = group;
  for (const person of people(today)) {
    next = joinGroup(next, {
      accountId: person.id,
      displayName: person.name,
      now,
    });
    if (!person.templates) {
      await db.delete(profiles).where(eq(profiles.accountId, person.id));
      continue;
    }
    let profile = setTemplates(createProfile({ accountId: person.id, now }), {
      templates: person.templates,
      now,
    });
    if (person.timezone) {
      profile = setTimezone(profile, { timezone: person.timezone, now });
    }
    for (const offset of person.busyEvenings ?? []) {
      profile = setDay(profile, {
        date: addDays(today, offset),
        busy: [{ start: h(19), end: h(23) }],
        exceptions: [],
        now,
      });
    }
    await profilesRepo.save(profile);
  }
  await groupsRepo.save(next);
  console.log(`group now has ${next.members.length} members`);
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "seed failed");
  process.exit(1);
});
