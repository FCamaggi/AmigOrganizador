import {
  addDays,
  type BusyTemplate,
  confirmGroupPlan,
  createGroup,
  createProfile,
  type Group,
  type GroupPlan,
  groupOutlook,
  joinGroup,
  outlookRange,
  type Profile,
  proposeGroupPlan,
  setDay,
  setTemplates,
  shiftCycle,
  slotFromOption,
  todayIn,
  workweek,
} from "@amigo/core";

const TZ = "America/Santiago";
const h = (hours: number) => hours * 60;

interface DemoPerson {
  readonly id: string;
  readonly name: string;
  /** `null` = no profile yet (unknown, never free). */
  readonly templates: readonly BusyTemplate[] | null;
}

export interface DemoData {
  readonly groups: Group[];
  readonly profiles: Profile[];
  readonly plans: GroupPlan[];
}

/**
 * Synthetic groups for local development only (never in production): a
 * group of 6 and one of 10, mixing office workers, students, a nurse on
 * shifts and people without a profile, so the group view has real contrast.
 * Join one from the app with its invite link: `/g/demo-colegio` or
 * `/g/demo-padel`.
 */
export function demoGroups(now: number): DemoData {
  const today = todayIn(TZ, now);
  const classes: BusyTemplate = {
    kind: "classes",
    blocks: [1, 2, 3, 4, 5].map((weekday) => ({
      weekday,
      start: h(8),
      end: weekday === 5 ? h(13) : h(18),
    })),
  };
  const nurse = shiftCycle({
    anchor: today,
    pattern: ["day", "night", "off", "off"],
  });

  const colegio: DemoPerson[] = [
    { id: "acc_demo_ana", name: "Ana", templates: [workweek()] },
    { id: "acc_demo_beto", name: "Beto", templates: [classes] },
    { id: "acc_demo_caro", name: "Caro", templates: null },
    { id: "acc_demo_diego", name: "Diego", templates: [nurse] },
    {
      id: "acc_demo_eli",
      name: "Eli",
      templates: [workweek({ start: h(10), end: h(20) })],
    },
    { id: "acc_demo_fran", name: "Fran", templates: [workweek()] },
  ];
  const padel: DemoPerson[] = [
    ...colegio,
    { id: "acc_demo_gabi", name: "Gabi", templates: [workweek()] },
    { id: "acc_demo_hugo", name: "Hugo", templates: [classes] },
    { id: "acc_demo_isi", name: "Isi", templates: null },
    {
      id: "acc_demo_javi",
      name: "Javi",
      templates: [workweek({ start: h(8), end: h(17) })],
    },
  ];

  const profiles = padel.flatMap((person) => {
    if (!person.templates) return [];
    let profile = setTemplates(createProfile({ accountId: person.id, now }), {
      templates: person.templates,
      now,
    });
    if (person.id === "acc_demo_fran") {
      // A one-off busy evening, to show it on top of a template.
      profile = setDay(profile, {
        date: addDays(today, 4),
        busy: [{ start: h(19), end: h(23) }],
        exceptions: [],
        now,
      });
    }
    return [profile];
  });

  const build = (id: string, name: string, people: DemoPerson[]) => {
    const [owner, ...rest] = people;
    if (!owner) throw new Error("demo group needs people");
    let group = createGroup({
      id,
      inviteCode: id,
      name,
      ownerId: owner.id,
      ownerName: owner.name,
      timezone: TZ,
      now,
    });
    for (const person of rest) {
      group = joinGroup(group, {
        accountId: person.id,
        displayName: person.name,
        now,
      });
    }
    return group;
  };

  const colegioGroup = build("demo-colegio", "Los del colegio (demo)", colegio);
  const padelGroup = build("demo-padel", "Padel de los jueves (demo)", padel);

  // One confirmed plan on the colegio group's best day.
  const { from, to } = outlookRange(TZ, now);
  const best = groupOutlook({ group: colegioGroup, profiles, from, to })
    .windows[0];
  const plans = best
    ? [
        confirmGroupPlan(
          proposeGroupPlan(colegioGroup, {
            id: "demo-plan-asado",
            accountId: "acc_demo_ana",
            title: "Asado (demo)",
            date: best.date,
            start: slotFromOption(best, 180).start,
            durationMinutes: 180,
            now,
          }),
          colegioGroup,
          { accountId: "acc_demo_ana", now },
        ),
      ]
    : [];

  return { groups: [colegioGroup, padelGroup], profiles, plans };
}
