"use server";

import { IcsError, IcsFetchError } from "@amigo/adapter-ics";
import {
  type BusyTemplate,
  cancelGroupPlan,
  chooseScheduleForGroup,
  confirmGroupPlan,
  createGroup,
  createPerson,
  createSchedule,
  DEFAULT_SCHEDULE_ID,
  DEFAULT_SCHEDULE_NAME,
  duplicateSchedule,
  GroupError,
  type GroupErrorCode,
  GroupPlanError,
  type GroupPlanErrorCode,
  type Interval,
  joinGroup,
  leaveGroup,
  type Person,
  PersonError,
  type PersonErrorCode,
  type Profile,
  ProfileError,
  planEvent,
  profileCreatedEvent,
  profileTimezone,
  proposeGroupPlan,
  removeImportedCalendar,
  removeSchedule,
  renameMember,
  renamePerson,
  renameSchedule,
  resyncCalendars,
  scheduleId,
  scheduleName,
  setDay,
  setDefaultSchedule,
  setImportedCalendar,
  setTemplates,
  setTimezone,
} from "@amigo/core";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { t } from "@/i18n/t";
import { DEFAULT_TIMEZONE, TIMEZONES } from "@/lib/plan-options";
import { authMode, safeNext } from "./auth/config";
import { fetchImportedCalendar } from "./calendar-sync";
import { newId } from "./ids";
import { track } from "./product-events";
import {
  calendarSources,
  groupPlans,
  groups,
  myDefaultSchedule,
  people,
  profiles,
} from "./repository";
import { getSession, type Session, startSession } from "./session";

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
  const storedPerson = await people().findByAccount(session.accountId);
  let group: ReturnType<typeof createGroup>;
  try {
    group = createGroup({
      id: newId(),
      inviteCode: newId(),
      name,
      ownerId: session.accountId,
      ownerName: storedPerson?.displayName ?? session.displayName,
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
  const [group, storedPerson] = await Promise.all([
    loadGroup(code),
    people().findByAccount(session.accountId),
  ]);
  await groups().save(
    joinGroup(group, {
      accountId: session.accountId,
      displayName: storedPerson?.displayName ?? session.displayName,
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

/** Ensures the person and at least the default schedule exist in memory/store. */
async function ensurePersonState(
  session: Session,
  now: number,
): Promise<{
  person: Person;
  schedules: Profile[];
  hadStoredSchedules: boolean;
}> {
  const [storedPerson, storedSchedules] = await Promise.all([
    people().findByAccount(session.accountId),
    profiles().listForAccount(session.accountId),
  ]);
  const person =
    storedPerson ??
    createPerson({
      accountId: session.accountId,
      displayName: session.displayName || DEFAULT_SCHEDULE_NAME,
      now,
    });
  if (storedSchedules.length > 0) {
    return { person, schedules: storedSchedules, hadStoredSchedules: true };
  }
  const fallback = createSchedule({
    accountId: session.accountId,
    id: DEFAULT_SCHEDULE_ID,
    name: DEFAULT_SCHEDULE_NAME,
    now,
  });
  return { person, schedules: [fallback], hadStoredSchedules: false };
}

function profileUrl(scheduleIdValue?: string, rawNext?: string | null): string {
  const params = new URLSearchParams();
  if (scheduleIdValue && scheduleIdValue !== DEFAULT_SCHEDULE_ID) {
    params.set("horario", scheduleIdValue);
  }
  const cleanNext =
    rawNext && safeNext(rawNext) !== "/" ? safeNext(rawNext) : null;
  if (cleanNext) {
    params.set("next", cleanNext);
  }
  const query = params.toString();
  return query ? `/perfil?${query}` : "/perfil";
}

export interface PersonNameState {
  readonly error: PersonErrorCode | null;
  readonly saved: boolean;
}

export async function savePersonNameAction(
  _prev: PersonNameState,
  formData: FormData,
): Promise<PersonNameState> {
  const session = await requireSession("/perfil");
  const now = Date.now();
  const displayName = text(formData, "displayName");
  const stored = await people().findByAccount(session.accountId);
  let person: Person;
  try {
    const base =
      stored ??
      createPerson({
        accountId: session.accountId,
        displayName: session.displayName || displayName,
        now,
      });
    person = renamePerson(base, { displayName, now });
  } catch (error) {
    if (error instanceof PersonError) {
      return { error: error.code, saved: false };
    }
    throw error;
  }
  await people().save(person);
  if (authMode() === "local") {
    await startSession(person.displayName);
  }
  const memberGroups = await groups().listForAccount(session.accountId);
  for (const group of memberGroups) {
    await groups().save(
      renameMember(group, {
        accountId: session.accountId,
        displayName: person.displayName,
      }),
    );
  }
  refresh();
  return { error: null, saved: true };
}

export interface ScheduleActionState {
  readonly error: PersonErrorCode | null;
}

export async function createScheduleAction(
  _prev: ScheduleActionState,
  formData: FormData,
): Promise<ScheduleActionState> {
  const session = await requireSession("/perfil");
  const now = Date.now();
  const name = text(formData, "name");
  const next = text(formData, "next") || null;
  const { person, schedules, hadStoredSchedules } = await ensurePersonState(
    session,
    now,
  );
  let created: Profile;
  try {
    created = createSchedule({
      accountId: session.accountId,
      id: newId(),
      name,
      now,
    });
  } catch (error) {
    if (error instanceof PersonError) return { error: error.code };
    throw error;
  }
  if (!hadStoredSchedules && schedules[0]) {
    await profiles().save(schedules[0]);
  }
  await profiles().save(created);
  await people().save(person);
  redirect(profileUrl(scheduleId(created), next));
}

export async function renameScheduleAction(
  _prev: ScheduleActionState,
  formData: FormData,
): Promise<ScheduleActionState> {
  const session = await requireSession("/perfil");
  const now = Date.now();
  const targetId = text(formData, "scheduleId") || DEFAULT_SCHEDULE_ID;
  const name = text(formData, "name");
  const { person, schedules } = await ensurePersonState(session, now);
  const target =
    schedules.find((s) => scheduleId(s) === targetId) ?? schedules[0];
  if (!target) return { error: "UNKNOWN_SCHEDULE" };
  let renamed: Profile;
  try {
    renamed = renameSchedule(target, { name, now });
  } catch (error) {
    if (error instanceof PersonError) return { error: error.code };
    throw error;
  }
  await profiles().save(renamed);
  await people().save(person);
  refresh();
  return { error: null };
}

export async function duplicateScheduleAction(
  sourceScheduleId: string,
  next: string | null,
): Promise<void> {
  const session = await requireSession("/perfil");
  const now = Date.now();
  const { person, schedules, hadStoredSchedules } = await ensurePersonState(
    session,
    now,
  );
  const source =
    schedules.find((s) => scheduleId(s) === sourceScheduleId) ?? schedules[0];
  if (!source) return;
  const copyName = t("profileEdit.schedules.duplicate.copyName", {
    name: scheduleName(source),
  }).slice(0, MAX_CALENDAR_NAME);
  const copy = duplicateSchedule(source, {
    id: newId(),
    name: copyName,
    now: now + 1,
  });
  if (!hadStoredSchedules) {
    await profiles().save(source);
  }
  await profiles().save(copy);
  await people().save(person);
  redirect(profileUrl(scheduleId(copy), next));
}

export async function setDefaultScheduleAction(
  targetScheduleId: string,
): Promise<void> {
  const session = await requireSession("/perfil");
  const now = Date.now();
  const { person, schedules, hadStoredSchedules } = await ensurePersonState(
    session,
    now,
  );
  if (!hadStoredSchedules && schedules[0]) {
    await profiles().save(schedules[0]);
  }
  try {
    const updated = setDefaultSchedule(person, {
      scheduleId: targetScheduleId,
      schedules,
      now,
    });
    await people().save(updated);
  } catch (error) {
    if (!(error instanceof PersonError)) throw error;
  }
  refresh();
}

export async function removeScheduleAction(
  _prev: ScheduleActionState,
  formData: FormData,
): Promise<ScheduleActionState> {
  const session = await requireSession("/perfil");
  const now = Date.now();
  const targetId = text(formData, "scheduleId") || DEFAULT_SCHEDULE_ID;
  const next = text(formData, "next") || null;
  const { person, schedules } = await ensurePersonState(session, now);
  const target = schedules.find((s) => scheduleId(s) === targetId);
  let removed: { person: Person; schedules: Profile[] };
  try {
    removed = removeSchedule(person, schedules, {
      scheduleId: targetId,
      now,
    });
  } catch (error) {
    if (error instanceof PersonError) return { error: error.code };
    throw error;
  }
  await people().save(removed.person);
  await profiles().delete(session.accountId, targetId);
  if (target) {
    for (const cal of target.importedCalendars) {
      const stillCarried = removed.schedules.some((s) =>
        s.importedCalendars.some((c) => c.id === cal.id),
      );
      if (!stillCarried) {
        await calendarSources().delete(session.accountId, cal.id);
      }
    }
  }
  redirect(profileUrl(removed.person.defaultScheduleId, next));
}

export async function chooseGroupScheduleAction(
  code: string,
  formData: FormData,
): Promise<void> {
  const session = await requireSession(`/g/${code}`);
  const group = await loadGroup(code);
  if (!group.members.some((m) => m.accountId === session.accountId)) {
    redirect(`/g/${code}`);
  }
  const targetId = text(formData, "scheduleId") || DEFAULT_SCHEDULE_ID;
  const now = Date.now();
  const { person, schedules } = await ensurePersonState(session, now);
  try {
    const updated = chooseScheduleForGroup(person, {
      groupId: group.id,
      scheduleId: targetId,
      schedules,
      now,
    });
    await people().save(updated);
  } catch (error) {
    if (!(error instanceof PersonError)) throw error;
  }
  refresh();
}

/** The stored schedule by id, or a new empty one (`created` says if account had none). */
async function mySchedule(
  accountId: string,
  targetScheduleId = DEFAULT_SCHEDULE_ID,
) {
  const storedSchedules = await profiles().listForAccount(accountId);
  const now = Date.now();
  const found =
    storedSchedules.find((s) => scheduleId(s) === targetScheduleId) ?? null;
  if (!found && storedSchedules.length > 0) {
    // Never create a schedule from an id the browser sent: it may be stale
    // (a removed schedule) or forged. Only a first save creates the default.
    throw new PersonError("UNKNOWN_SCHEDULE", "no schedule with that id");
  }
  return {
    profile:
      found ??
      createSchedule({
        accountId,
        id: DEFAULT_SCHEDULE_ID,
        name: DEFAULT_SCHEDULE_NAME,
        now,
      }),
    created: storedSchedules.length === 0,
  };
}

export interface ProfileInput {
  readonly scheduleId?: string;
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
  const targetId = input.scheduleId ?? DEFAULT_SCHEDULE_ID;
  let mine: Awaited<ReturnType<typeof mySchedule>>;
  try {
    mine = await mySchedule(session.accountId, targetId);
  } catch (error) {
    if (error instanceof PersonError) return { ok: false };
    throw error;
  }
  const { profile: stored, created } = mine;
  const storedPerson = await people().findByAccount(session.accountId);
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
    if (!storedPerson) {
      await people().save(
        createPerson({
          accountId: session.accountId,
          displayName: session.displayName || DEFAULT_SCHEDULE_NAME,
          now,
        }),
      );
    }
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
  targetScheduleId: string,
  calendarId: string,
  name: string,
  url: string,
): Promise<string | null> {
  try {
    const { profile: base, created } = await mySchedule(
      accountId,
      targetScheduleId,
    );
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
    if (error instanceof PersonError) return "UNKNOWN_SCHEDULE";
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
  const targetScheduleId = text(formData, "scheduleId") || DEFAULT_SCHEDULE_ID;
  const calendarId = newId();
  const error = await syncCalendar(
    session.accountId,
    targetScheduleId,
    calendarId,
    name,
    url,
  );
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
  if (source) {
    await resyncCalendars({
      sources: [source],
      profiles: profiles(),
      deleteSource: (accountId, id) => calendarSources().delete(accountId, id),
      fetchCalendar: fetchImportedCalendar,
      now: Date.now,
    });
  }
  refresh();
}

export async function removeCalendarAction(
  calendarId: string,
  targetScheduleId = DEFAULT_SCHEDULE_ID,
): Promise<void> {
  const session = await requireSession("/perfil");
  const schedules = await profiles().listForAccount(session.accountId);
  const target = schedules.find((s) => scheduleId(s) === targetScheduleId);
  if (target) {
    await profiles().save(
      removeImportedCalendar(target, { id: calendarId, now: Date.now() }),
    );
  }
  const stillCarried = schedules.some(
    (s) =>
      scheduleId(s) !== targetScheduleId &&
      s.importedCalendars.some((c) => c.id === calendarId),
  );
  if (!stillCarried) {
    await calendarSources().delete(session.accountId, calendarId);
  }
  refresh();
}
