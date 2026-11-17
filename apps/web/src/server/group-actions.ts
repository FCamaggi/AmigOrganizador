"use server";

import { IcsError, IcsFetchError } from "@amigo/adapter-ics";
import {
  type BusyTemplate,
  cancelGroupPlan,
  confirmGroupPlan,
  createGroup,
  createProfile,
  GroupError,
  type GroupErrorCode,
  GroupPlanError,
  type GroupPlanErrorCode,
  type Interval,
  joinGroup,
  leaveGroup,
  ProfileError,
  planEvent,
  profileCreatedEvent,
  profileTimezone,
  proposeGroupPlan,
  removeImportedCalendar,
  setDay,
  setImportedCalendar,
  setTemplates,
  setTimezone,
} from "@amigo/core";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { DEFAULT_TIMEZONE, TIMEZONES } from "@/lib/plan-options";
import { authMode } from "./auth/config";
import { fetchImportedCalendar } from "./calendar-sync";
import { newId } from "./ids";
import { track } from "./product-events";
import {
  calendarSources,
  groupPlans,
  groups,
  myDefaultSchedule,
  profiles,
} from "./repository";
import { getSession, startSession } from "./session";

const MAX_NAME = 60;
const MAX_CALENDAR_NAME = 40;

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function requireSession(next: string) {
  const session = await getSession();
  if (!session) redirect(`/entrar?next=${encodeURIComponent(next)}`);
  return session;
}

/** A member's group by invite code, or back home. */
async function loadGroup(code: string) {
  const group = await groups().findByInviteCode(code);
  if (!group) redirect("/");
  return group;
}

export interface CreateGroupState {
  readonly error: GroupErrorCode | null;
  /** What was typed, so a failed submit doesn't wipe the form. */
  readonly values?: {
    readonly groupName: string;
    readonly name: string;
    readonly timezone: string;
  };
}

export async function createGroupAction(
  _prev: CreateGroupState,
  formData: FormData,
): Promise<CreateGroupState> {
  const existing = await getSession();
  if (!existing && authMode() === "supabase")
    redirect(`/entrar?next=${encodeURIComponent("/grupos/nuevo")}`);
  const values = {
    groupName: text(formData, "groupName"),
    name: text(formData, "name"),
    timezone: text(formData, "timezone") || DEFAULT_TIMEZONE,
  };
  const ownerName = existing?.displayName ?? values.name;
  if (ownerName.length === 0 || ownerName.length > MAX_NAME) {
    return { error: "INVALID_NAME", values };
  }
  const timezone = values.timezone;
  if (!TIMEZONES.includes(timezone as (typeof TIMEZONES)[number])) {
    return { error: "INVALID_TIMEZONE", values };
  }
  const name = values.groupName;
  if (name.length === 0 || name.length > MAX_NAME)
    return { error: "INVALID_NAME", values };
  const session = existing ?? (await startSession(ownerName));
  let group: ReturnType<typeof createGroup>;
  try {
    group = createGroup({
      id: newId(),
      inviteCode: newId(),
      name,
      ownerId: session.accountId,
      ownerName: session.displayName,
      timezone,
      now: Date.now(),
    });
  } catch (error) {
    if (error instanceof GroupError) return { error: error.code, values };
    throw error;
  }
  await groups().save(group);
  redirect(`/g/${group.inviteCode}`);
}

export async function joinGroupAction(code: string): Promise<void> {
  const session = await requireSession(`/g/${code}`);
  const group = await loadGroup(code);
  await groups().save(
    joinGroup(group, {
      accountId: session.accountId,
      displayName: session.displayName,
      now: Date.now(),
    }),
  );
  const profile = await myDefaultSchedule(session.accountId);
  redirect(
    profile ? `/g/${code}` : `/perfil?next=${encodeURIComponent(`/g/${code}`)}`,
  );
}

export async function leaveGroupAction(code: string): Promise<void> {
  const session = await requireSession(`/g/${code}`);
  const group = await loadGroup(code);
  try {
    const after = leaveGroup(group, { accountId: session.accountId });
    if (after) await groups().save(after);
    else await groups().delete(group.id);
  } catch (error) {
    if (!(error instanceof GroupError)) throw error;
  }
  redirect("/");
}

export interface ProposeState {
  readonly error: GroupPlanErrorCode | "generic" | null;
}

export async function proposePlanAction(
  code: string,
  _prev: ProposeState,
  formData: FormData,
): Promise<ProposeState> {
  const session = await requireSession(`/g/${code}`);
  const group = await loadGroup(code);
  try {
    const plan = proposeGroupPlan(group, {
      id: newId(),
      accountId: session.accountId,
      title: text(formData, "title"),
      date: text(formData, "date"),
      start: Number(text(formData, "start")),
      durationMinutes: Number(text(formData, "duration")),
      now: Date.now(),
    });
    await groupPlans().save(plan);
    await track(
      planEvent("plan_proposed", plan, {
        accountId: session.accountId,
        at: plan.createdAt,
      }),
    );
  } catch (error) {
    if (error instanceof GroupPlanError) return { error: error.code };
    return { error: "generic" };
  }
  refresh();
  return { error: null };
}

async function decide(
  code: string,
  planId: string,
  action: "confirm" | "cancel",
): Promise<void> {
  const session = await requireSession(`/g/${code}`);
  const group = await loadGroup(code);
  const plan = await groupPlans().findById(planId);
  if (!plan) return;
  try {
    if (action === "confirm") {
      const now = Date.now();
      const confirmed = confirmGroupPlan(plan, group, {
        accountId: session.accountId,
        now,
      });
      await groupPlans().save(confirmed);
      await track(
        planEvent("plan_confirmed", confirmed, {
          accountId: session.accountId,
          at: now,
        }),
      );
    } else {
      await groupPlans().save(
        cancelGroupPlan(plan, group, { accountId: session.accountId }),
      );
    }
  } catch (error) {
    if (!(error instanceof GroupPlanError)) throw error;
  }
  refresh();
}

export async function confirmPlanAction(
  code: string,
  planId: string,
): Promise<void> {
  await decide(code, planId, "confirm");
}

export async function cancelPlanAction(
  code: string,
  planId: string,
): Promise<void> {
  await decide(code, planId, "cancel");
}

/** The stored profile, or a new empty one (`created` says which). */
async function myProfile(accountId: string) {
  const stored = await myDefaultSchedule(accountId);
  return {
    profile: stored ?? createProfile({ accountId, now: Date.now() }),
    created: stored === null,
  };
}

export interface ProfileInput {
  readonly templates: readonly BusyTemplate[];
  /** Only the dates the person changed. */
  readonly days: Readonly<
    Record<
      string,
      { busy: readonly Interval[]; exceptions: readonly Interval[] }
    >
  >;
  /** Seconds from the first edit in the editor to this save (exit test). */
  readonly setupSeconds?: number;
  /** The zone the person writes their times in; one of `TIMEZONES`. */
  readonly timezone?: string;
}

export async function saveProfileAction(
  input: ProfileInput,
): Promise<{ ok: boolean }> {
  const session = await requireSession("/perfil");
  const now = Date.now();
  const { profile: stored, created } = await myProfile(session.accountId);
  const zone = input.timezone;
  if (
    zone !== undefined &&
    !TIMEZONES.includes(zone as (typeof TIMEZONES)[number])
  )
    return { ok: false };
  const base = zone ? setTimezone(stored, { timezone: zone, now }) : stored;
  try {
    let profile = setTemplates(base, {
      templates: input.templates,
      now,
    });
    for (const [date, day] of Object.entries(input.days)) {
      profile = setDay(profile, {
        date,
        busy: day.busy,
        exceptions: day.exceptions,
        now,
      });
    }
    await profiles().save(profile);
  } catch (error) {
    if (error instanceof ProfileError) return { ok: false };
    throw error;
  }
  if (created) {
    await track(
      profileCreatedEvent({
        accountId: session.accountId,
        at: now,
        setupSeconds: input.setupSeconds,
      }),
    );
  }
  refresh();
  return { ok: true };
}

export interface ImportState {
  readonly error: string | null;
}

async function syncCalendar(
  accountId: string,
  calendarId: string,
  name: string,
  url: string,
): Promise<string | null> {
  try {
    const { profile: base, created } = await myProfile(accountId);
    const calendar = await fetchImportedCalendar({
      id: calendarId,
      name,
      url,
      timeZone: profileTimezone(base),
    });
    const now = Date.now();
    await profiles().save(setImportedCalendar(base, { calendar, now }));
    if (created) await track(profileCreatedEvent({ accountId, at: now }));
    return null;
  } catch (error) {
    if (error instanceof IcsFetchError) return error.code;
    if (error instanceof IcsError) return "NOT_CALENDAR";
    if (error instanceof ProfileError) return "NOT_CALENDAR";
    throw error;
  }
}

export async function importCalendarAction(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const session = await requireSession("/perfil");
  const name = text(formData, "name");
  if (name.length === 0 || name.length > MAX_CALENDAR_NAME) {
    return { error: "INVALID_NAME" };
  }
  const url = text(formData, "url");
  const calendarId = newId();
  const error = await syncCalendar(session.accountId, calendarId, name, url);
  if (error) return { error };
  await calendarSources().save({
    accountId: session.accountId,
    calendarId,
    url,
    createdAt: Date.now(),
  });
  refresh();
  return { error: null };
}

export async function resyncCalendarAction(calendarId: string): Promise<void> {
  const session = await requireSession("/perfil");
  const source = (
    await calendarSources().listForAccount(session.accountId)
  ).find((s) => s.calendarId === calendarId);
  const profile = await myDefaultSchedule(session.accountId);
  const calendar = profile?.importedCalendars.find((c) => c.id === calendarId);
  if (source && calendar) {
    await syncCalendar(
      session.accountId,
      calendarId,
      calendar.name,
      source.url,
    );
  }
  refresh();
}

export async function removeCalendarAction(calendarId: string): Promise<void> {
  const session = await requireSession("/perfil");
  const profile = await myDefaultSchedule(session.accountId);
  if (profile) {
    await profiles().save(
      removeImportedCalendar(profile, { id: calendarId, now: Date.now() }),
    );
  }
  await calendarSources().delete(session.accountId, calendarId);
  refresh();
}
