import { describe, expect, it } from "vitest";
import {
  createGroup,
  type Group,
  GroupError,
  joinGroup,
  leaveGroup,
  type NewGroup,
  updateGroup,
} from "./group";

const NOW = Date.UTC(2026, 10, 15, 12, 0);

const newGroup: NewGroup = {
  id: "g_1",
  inviteCode: "invite_secret",
  name: "  Los del colegio  ",
  ownerId: "acc_ana",
  ownerName: " Ana ",
  timezone: "America/Santiago",
  now: NOW,
};

function expectGroupError(action: () => unknown, code: GroupError["code"]) {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(GroupError);
    expect((error as GroupError).code).toBe(code);
    return;
  }
  throw new Error(`expected GroupError ${code}`);
}

const withBeto = (group: Group, now = NOW + 1000) =>
  joinGroup(group, { accountId: "acc_beto", displayName: "Beto", now });

describe("createGroup", () => {
  it("creates a group with the creator as its owner and first member", () => {
    expect(createGroup(newGroup)).toEqual({
      id: "g_1",
      inviteCode: "invite_secret",
      name: "Los del colegio",
      timezone: "America/Santiago",
      createdAt: NOW,
      members: [
        {
          accountId: "acc_ana",
          displayName: "Ana",
          role: "owner",
          joinedAt: NOW,
        },
      ],
    });
  });

  it.each([
    ["an empty name", { name: "   " }, "INVALID_NAME"],
    ["a name over 60 characters", { name: "x".repeat(61) }, "INVALID_NAME"],
    ["an empty owner name", { ownerName: "" }, "INVALID_NAME"],
    ["an unknown timezone", { timezone: "Mars/Olympus" }, "INVALID_TIMEZONE"],
  ] as const)("rejects %s", (_label, change, code) => {
    expectGroupError(() => createGroup({ ...newGroup, ...change }), code);
  });
});

describe("joinGroup", () => {
  it("adds a member at the end", () => {
    const group = withBeto(createGroup(newGroup));
    expect(group.members.map((m) => [m.accountId, m.role])).toEqual([
      ["acc_ana", "owner"],
      ["acc_beto", "member"],
    ]);
    expect(group.members[1]?.joinedAt).toBe(NOW + 1000);
  });

  it("is a no-op for someone already in the group", () => {
    const group = withBeto(createGroup(newGroup));
    expect(withBeto(group, NOW + 5000)).toBe(group);
  });

  it("rejects an invalid display name", () => {
    expectGroupError(
      () =>
        joinGroup(createGroup(newGroup), {
          accountId: "acc_x",
          displayName: " ",
          now: NOW,
        }),
      "INVALID_NAME",
    );
  });

  it("does not change the original group", () => {
    const group = createGroup(newGroup);
    withBeto(group);
    expect(group.members).toHaveLength(1);
  });
});

describe("leaveGroup", () => {
  it("removes a member", () => {
    const group = withBeto(createGroup(newGroup));
    expect(
      leaveGroup(group, { accountId: "acc_beto" })?.members.map(
        (m) => m.accountId,
      ),
    ).toEqual(["acc_ana"]);
  });

  it("hands ownership to the longest-standing member when the owner leaves", () => {
    let group = withBeto(createGroup(newGroup));
    group = joinGroup(group, {
      accountId: "acc_caro",
      displayName: "Caro",
      now: NOW + 2000,
    });
    const after = leaveGroup(group, { accountId: "acc_ana" });
    expect(after?.members.map((m) => [m.accountId, m.role])).toEqual([
      ["acc_beto", "owner"],
      ["acc_caro", "member"],
    ]);
  });

  it("returns null when the last member leaves, so the group can be deleted", () => {
    expect(
      leaveGroup(createGroup(newGroup), { accountId: "acc_ana" }),
    ).toBeNull();
  });

  it("rejects someone who is not a member", () => {
    expectGroupError(
      () => leaveGroup(createGroup(newGroup), { accountId: "acc_x" }),
      "NOT_A_MEMBER",
    );
  });
});

describe("updateGroup", () => {
  it("lets the owner rename the group and change its timezone", () => {
    const group = updateGroup(createGroup(newGroup), {
      accountId: "acc_ana",
      name: " Padel jueves ",
      timezone: "America/Punta_Arenas",
    });
    expect(group).toMatchObject({
      name: "Padel jueves",
      timezone: "America/Punta_Arenas",
    });
  });

  it("keeps fields that are not given", () => {
    const group = updateGroup(createGroup(newGroup), {
      accountId: "acc_ana",
      name: "Otro",
    });
    expect(group.timezone).toBe("America/Santiago");
  });

  it("rejects a member who is not the owner", () => {
    expectGroupError(
      () =>
        updateGroup(withBeto(createGroup(newGroup)), {
          accountId: "acc_beto",
          name: "X",
        }),
      "NOT_OWNER",
    );
  });

  it("rejects someone outside the group", () => {
    expectGroupError(
      () =>
        updateGroup(createGroup(newGroup), { accountId: "acc_x", name: "X" }),
      "NOT_A_MEMBER",
    );
  });

  it.each([
    ["an invalid name", { name: "" }, "INVALID_NAME"],
    ["an unknown timezone", { timezone: "Nowhere/City" }, "INVALID_TIMEZONE"],
  ] as const)("rejects %s", (_label, change, code) => {
    expectGroupError(
      () =>
        updateGroup(createGroup(newGroup), { accountId: "acc_ana", ...change }),
      code,
    );
  });
});
