import {
  type BusyTemplate,
  parseLocalDate,
  shiftCycle,
  workweek,
} from "@amigo/core";
import { describe, expect, it } from "vitest";
import { describeRoutine } from "./routine-sentence";

const h = (hours: number, mins = 0) => hours * 60 + mins;

describe("describeRoutine (S2)", () => {
  it("describes a Monday to Friday workweek with exact times", () => {
    expect(describeRoutine(workweek({ start: h(8), end: h(18) }))).toBe(
      "Vas a marcar ocupado: lunes a viernes, de 08:00 a 18:00",
    );

    expect(describeRoutine(workweek({ start: h(8, 30), end: h(17, 15) }))).toBe(
      "Vas a marcar ocupado: lunes a viernes, de 08:30 a 17:15",
    );
  });

  it("describes non-consecutive weekdays and overnight weekly hours", () => {
    const routine: BusyTemplate = {
      kind: "workweek",
      blocks: [
        { weekday: 1, start: h(22), end: h(30) },
        { weekday: 3, start: h(22), end: h(30) },
        { weekday: 5, start: h(22), end: h(30) },
      ],
    };
    expect(describeRoutine(routine)).toBe(
      "Vas a marcar ocupado: lunes, miércoles y viernes, de 22:00 a 06:00 (+1)",
    );
  });

  it("describes different hours per weekday", () => {
    const routine: BusyTemplate = {
      kind: "classes",
      blocks: [
        { weekday: 1, start: h(8, 30), end: h(13) },
        { weekday: 2, start: h(8, 30), end: h(13) },
        { weekday: 3, start: h(8, 30), end: h(13) },
        { weekday: 5, start: h(14), end: h(18, 15) },
      ],
    };
    expect(describeRoutine(routine)).toBe(
      "Vas a marcar ocupado: lunes a miércoles, de 08:30 a 13:00; viernes, de 14:00 a 18:15",
    );
  });

  it("says when no weekday is selected yet", () => {
    expect(describeRoutine({ kind: "workweek", blocks: [] })).toBe(
      "Vas a marcar ocupado: ningún día seleccionado",
    );
  });

  it("describes a 4-day shift cycle with day, night (+1) and free days", () => {
    const cycle = shiftCycle({
      anchor: parseLocalDate("2026-11-20"),
      pattern: ["day", "night", "off", "off"],
    });
    expect(describeRoutine(cycle)).toBe(
      "Ciclo de 4 días desde el 20 nov: día 1 08:00–20:00, día 2 20:00–08:00 (+1), días 3–4 libre",
    );
  });

  it("collapses consecutive identical busy or free days in a cycle", () => {
    const cycle: BusyTemplate = {
      kind: "shifts",
      anchor: parseLocalDate("2026-11-20"),
      cycle: [
        [{ start: h(7, 30), end: h(19, 30) }],
        [{ start: h(7, 30), end: h(19, 30) }],
        [{ start: h(7, 30), end: h(19, 30) }],
        [{ start: h(7, 30), end: h(19, 30) }],
        [],
        [],
        [],
      ],
    };
    expect(describeRoutine(cycle)).toBe(
      "Ciclo de 7 días desde el 20 nov: días 1–4 07:30–19:30, días 5–7 libre",
    );
  });
});
