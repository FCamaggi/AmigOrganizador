import { describe, expect, it } from "vitest";
import type { Group } from "../group/group";
import { createPerson, type Person, PersonError } from "./person";
import {
  groupThreads,
  setThreadColor,
  THREAD_COLORS,
  type ThreadColor,
} from "./thread-color";

const NOW = Date.UTC(2026, 10, 24, 12, 0);
const LATER = NOW + 60_000;

function group(ids: readonly string[]): Group {
  return {
    id: "grp_1",
    inviteCode: "code",
    name: "Asado",
    timezone: "America/Santiago",
    createdAt: NOW,
    members: ids.map((accountId, index) => ({
      accountId,
      displayName: accountId,
      role: index === 0 ? "owner" : "member",
      joinedAt: NOW + index,
    })),
  };
}

function person(accountId: string, color?: ThreadColor): Person {
  const base = createPerson({ accountId, displayName: accountId, now: NOW });
  return color ? setThreadColor(base, { color, now: NOW }) : base;
}

describe("setThreadColor", () => {
  it("saves the chosen colour on the person", () => {
    const saved = setThreadColor(person("ana"), { color: "moss", now: LATER });
    expect(saved.threadColor).toBe("moss");
    expect(saved.updatedAt).toBe(LATER);
  });

  it("clears the choice with null", () => {
    const cleared = setThreadColor(person("ana", "moss"), {
      color: null,
      now: LATER,
    });
    expect(cleared.threadColor).toBeUndefined();
  });

  it("rejects a colour outside the palette", () => {
    expect(() =>
      setThreadColor(person("ana"), {
        color: "madder" as ThreadColor,
        now: LATER,
      }),
    ).toThrow(PersonError);
  });
});

describe("groupThreads", () => {
  it("without choices, gives colours in join order as before", () => {
    const threads = groupThreads(group(["a", "b", "c"]), []);
    expect(threads.map((t) => t.index)).toEqual([0, 1, 2]);
    expect(threads.map((t) => t.color)).toEqual(["indigo", "ochre", "moss"]);
  });

  it("gives each member the colour they chose", () => {
    const threads = groupThreads(group(["a", "b"]), [
      person("a", "rose"),
      person("b", "teal"),
    ]);
    expect(threads.map((t) => t.color)).toEqual(["rose", "teal"]);
    expect(threads.every((t) => !t.changed)).toBe(true);
  });

  it("on a clash, whoever joined first keeps it and the other takes the next free colour", () => {
    const threads = groupThreads(group(["a", "b"]), [
      person("a", "plum"),
      person("b", "plum"),
    ]);
    expect(threads[0]).toMatchObject({ color: "plum", changed: false });
    expect(threads[1]).toMatchObject({
      color: "teal",
      chosen: "plum",
      changed: true,
      takenBy: "a",
    });
  });

  it("a newcomer never changes the colour of someone already in the group", () => {
    const before = groupThreads(group(["a", "b"]), [person("b", "moss")]);
    const after = groupThreads(group(["a", "b", "c"]), [
      person("b", "moss"),
      person("c", "indigo"),
    ]);
    expect(after.slice(0, 2)).toEqual(before);
    expect(after[2]).toMatchObject({ color: "ochre", changed: true });
  });

  it("a member without a choice also keeps a colour claimed before a later choice", () => {
    const threads = groupThreads(group(["a", "b"]), [person("b", "indigo")]);
    expect(threads[0]).toMatchObject({ color: "indigo", chosen: null });
    expect(threads[1]).toMatchObject({ color: "ochre", takenBy: "a" });
  });

  it("past eight members, a second ply of the palette starts", () => {
    const ids = Array.from({ length: 10 }, (_, i) => `m${i}`);
    const threads = groupThreads(group(ids), []);
    expect(threads.map((t) => t.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(threads[8]?.color).toBe(THREAD_COLORS[0]);
  });

  it("no two members share a colour and ply", () => {
    const ids = Array.from({ length: 12 }, (_, i) => `m${i}`);
    const threads = groupThreads(
      group(ids),
      ids.map((id) => person(id, "walnut")),
    );
    expect(new Set(threads.map((t) => t.index)).size).toBe(12);
    expect(threads[0]?.color).toBe("walnut");
  });
});
