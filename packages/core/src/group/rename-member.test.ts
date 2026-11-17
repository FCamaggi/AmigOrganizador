import { describe, expect, it } from "vitest";
import {
  createGroup,
  GroupError,
  joinGroup,
  type NewGroup,
  renameMember,
} from "./group";

const NOW = Date.UTC(2026, 10, 17, 12, 0);

const newGroup: NewGroup = {
  id: "g_1",
  inviteCode: "invite_secret",
  name: "Los del colegio",
  ownerId: "acc_ana",
  ownerName: "Ana",
  timezone: "America/Santiago",
  now: NOW,
};

describe("renameMember", () => {
  it("updates the member's trimmed display name and keeps order, role and joinedAt", () => {
    const group = joinGroup(createGroup(newGroup), {
      accountId: "acc_beto",
      displayName: "Beto",
      now: NOW + 1000,
    });

    const updated = renameMember(group, {
      accountId: "acc_beto",
      displayName: "  Alberto  ",
    });

    expect(updated.members).toEqual([
      {
        accountId: "acc_ana",
        displayName: "Ana",
        role: "owner",
        joinedAt: NOW,
      },
      {
        accountId: "acc_beto",
        displayName: "Alberto",
        role: "member",
        joinedAt: NOW + 1000,
      },
    ]);
    expect(group.members[1]?.displayName).toBe("Beto");
  });

  it("rejects someone who is not a member", () => {
    const group = createGroup(newGroup);
    expect(() =>
      renameMember(group, { accountId: "acc_outsider", displayName: "X" }),
    ).toThrow(GroupError);
    expect(() =>
      renameMember(group, { accountId: "acc_outsider", displayName: "X" }),
    ).toThrow(expect.objectContaining({ code: "NOT_A_MEMBER" }));
  });

  it.each([
    ["an empty name", "   "],
    ["a name over 60 characters", "x".repeat(61)],
  ])("rejects %s", (_label, displayName) => {
    const group = createGroup(newGroup);
    expect(() =>
      renameMember(group, { accountId: "acc_ana", displayName }),
    ).toThrow(expect.objectContaining({ code: "INVALID_NAME" }));
  });
});
