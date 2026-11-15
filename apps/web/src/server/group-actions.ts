"use server";

import { IcsError, IcsFetchError, importIcsCalendar } from "@amigo/adapter-ics";
import { newInviteCode, newPlanId } from "@amigo/adapter-memory";
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
  proposeGroupPlan,
  removeImportedCalendar,
  setDay,
  setImportedCalendar,
  setTemplates,
} from "@amigo/core";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { DEFAULT_TIMEZONE, TIMEZONES } from "@/lib/plan-options";
import { calendarSources, groupPlans, groups, profiles } from "./repository";
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
}

export async function createGroupAction(
  _prev: CreateGroupState,
  formData: FormData,
): Promise<CreateGroupState> {
  const existing = await getSession();
  const ownerName = existing?.displayName ?? text(formData, "name");
  if (ownerName.length === 0 || ownerName.length > MAX_NAME) {
    return { error: "INVALID_NAME" };
  }
  const timezone = text(formData, "timezone") || DEFAULT_TIMEZONE;
  if (!TIMEZONES.includes(timezone as (typeof TIMEZONES)[number])) {
    return { error: "INVALID_TIMEZONE" };
  }
  const name = text(formData, "groupName");
  if (name.length === 0 || name.length > MAX_NAME)
    return { error: "INVALID_NAME" };
  const session = existing ?? (await startSession(ownerName));
  let group: ReturnType<typeof createGroup>;
  try {
    group = createGroup({
      id: newPlanId(),
      inviteCode: newInviteCode(),
      name,
      ownerId: session.accountId,
      ownerName: session.displayName,
      timezone,
      now: Date.now(),
    });
  } catch (error) {
    if (error instanceof GroupError) return { error: error.code };
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
  const profile = await profiles().findByAccount(session.accountId);
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
      id: newPlanId(),
      accountId: session.accountId,
      title: text(formData, "title"),
      date: text(formData, "date"),
      start: Number(text(formData, "start")),
      durationMinutes: Number(text(formData, "duration")),
      now: Date.now(),
    });
    await groupPlans().save(plan);
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
    await groupPlans().save(
      action === "confirm"
        ? confirmGroupPlan(plan, group, {
            accountId: session.accountId,
            now: Date.now(),
          })
        : cancelGroupPlan(plan, group, { accountId: session.accountId }),
    );
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

async function myProfile(accountId: string) {
  return (
    (await profiles().findByAccount(accountId)) ??
    createProfile({ accountId, now: Date.now() })
  );
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
}

export async function saveProfileAction(
  input: ProfileInput,
): Promise<{ ok: boolean }> {
  const session = await requireSession("/perfil");
  const now = Date.now();
  try {
    let profile = setTemplates(await myProfile(session.accountId), {
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
    const calendar = await importIcsCalendar({
      id: calendarId,
      name,
      url,
      // Floating times and all-day events: the person's zone (Chile for now).
      timeZone: DEFAULT_TIMEZONE,
      now: Date.now(),
    });
    const profile = setImportedCalendar(await myProfile(accountId), {
      calendar,
      now: Date.now(),
    });
    await profiles().save(profile);
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
  const calendarId = newPlanId();
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
  const profile = await profiles().findByAccount(session.accountId);
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
  const profile = await profiles().findByAccount(session.accountId);
  if (profile) {
    await profiles().save(
      removeImportedCalendar(profile, { id: calendarId, now: Date.now() }),
    );
  }
  await calendarSources().delete(session.accountId, calendarId);
  refresh();
}
