import {
  addDays,
  answerPlan,
  type BusyTemplate,
  buildAnswerDays,
  createPlan,
  joinPlan,
  type Plan,
  shiftCycle,
  todayIn,
  workweek,
} from "@amigo/core";

const TZ = "America/Santiago";
const h = (hours: number) => hours * 60;

interface DemoPerson {
  readonly id: string;
  readonly name: string;
  /** `null` = has not answered. */
  readonly templates: readonly BusyTemplate[] | null;
}

/**
 * Synthetic plans for local development only (never in production): one
 * group of 6 and one of 10, so both diagram modes can be seen.
 */
export function demoPlans(now: number): Plan[] {
  const today = todayIn(TZ, now);
  const from = addDays(today, 1);
  const to = addDays(today, 14);
  const classes: BusyTemplate = {
    kind: "classes",
    blocks: [1, 2, 3, 4, 5].map((weekday) => ({
      weekday,
      start: h(8),
      end: weekday === 5 ? h(13) : h(18),
    })),
  };
  const shifts = shiftCycle({
    anchor: today,
    pattern: ["day", "night", "off", "off"],
  });
  const late = workweek({ start: h(10), end: h(20) });

  const small: DemoPerson[] = [
    { id: "acc_demo_ana", name: "Ana", templates: [workweek()] },
    { id: "acc_demo_beto", name: "Beto", templates: [classes] },
    { id: "acc_demo_caro", name: "Caro", templates: null },
    { id: "acc_demo_diego", name: "Diego", templates: [shifts] },
    { id: "acc_demo_eli", name: "Eli", templates: [late] },
    { id: "acc_demo_fran", name: "Fran", templates: [workweek()] },
  ];
  const large: DemoPerson[] = [
    ...small,
    { id: "acc_demo_gabi", name: "Gabi", templates: [workweek()] },
    { id: "acc_demo_hugo", name: "Hugo", templates: [classes] },
    { id: "acc_demo_isi", name: "Isi", templates: null },
    {
      id: "acc_demo_javi",
      name: "Javi",
      templates: [workweek({ start: h(8), end: h(17) })],
    },
  ];

  const build = (id: string, title: string, people: DemoPerson[]) => {
    const [organizer, ...rest] = people;
    if (!organizer) throw new Error("demo plan needs people");
    let plan = createPlan({
      id,
      title,
      organizerId: organizer.id,
      organizerName: organizer.name,
      from,
      to,
      durationMinutes: 180,
      timezone: TZ,
      now,
    });
    for (const person of rest) {
      plan = joinPlan(plan, {
        accountId: person.id,
        displayName: person.name,
        now,
      });
    }
    for (const person of people) {
      if (!person.templates) continue;
      plan = answerPlan(plan, {
        accountId: person.id,
        days: buildAnswerDays({
          mode: "busy",
          from,
          to,
          templates: person.templates,
        }),
        now,
      });
    }
    return plan;
  };

  return [
    build("demo-asado", "Asado de fin de año (demo)", small),
    build("demo-grande", "Cumpleaños de Javi (demo)", large),
  ];
}
