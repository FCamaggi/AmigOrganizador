"use server";

import { newPlanId } from "@amigo/adapter-memory";
import {
  addDays,
  answerPlan,
  type BusyTemplate,
  buildAnswerDays,
  confirmPlan,
  createPlan,
  type Interval,
  joinPlan,
  type LocalDate,
  PlanError,
  type PlanErrorCode,
  parseLocalDate,
  todayIn,
} from "@amigo/core";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import {
  DURATIONS,
  RANGES,
  type RangeKey,
  TIMEZONES,
} from "@/lib/plan-options";
import { plans } from "./repository";
import { endSession, getSession, startSession } from "./session";

const MAX_NAME = 60;

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/** Only same-site paths, so `next` can't send people elsewhere. */
function safeNext(value: string): string {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export interface SignInState {
  readonly error: boolean;
}

export async function signIn(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const name = text(formData, "name");
  if (name.length === 0 || name.length > MAX_NAME) return { error: true };
  await startSession(name);
  redirect(safeNext(text(formData, "next")));
}

export async function signOut(): Promise<void> {
  await endSession();
  redirect("/");
}

export interface CreatePlanState {
  readonly error: PlanErrorCode | null;
}

export async function createPlanAction(
  _prev: CreatePlanState,
  formData: FormData,
): Promise<CreatePlanState> {
  const existing = await getSession();
  const name = existing?.displayName ?? text(formData, "name");
  if (name.length === 0 || name.length > MAX_NAME)
    return { error: "INVALID_NAME" };

  const timezone = text(formData, "timezone");
  if (!TIMEZONES.includes(timezone as (typeof TIMEZONES)[number])) {
    return { error: "INVALID_RANGE" };
  }
  const range = RANGES.find(
    (r) => r.key === (text(formData, "range") as RangeKey),
  );
  if (!range) return { error: "INVALID_RANGE" };
  const duration = Number(text(formData, "duration"));
  if (!DURATIONS.includes(duration as (typeof DURATIONS)[number])) {
    return { error: "INVALID_DURATION" };
  }
  const mode = text(formData, "mode");

  const title = text(formData, "title");
  if (title.length === 0 || title.length > 80)
    return { error: "INVALID_TITLE" };
  const session = existing ?? (await startSession(name));
  const from = todayIn(timezone, Date.now());
  let plan: ReturnType<typeof createPlan>;
  try {
    plan = createPlan({
      id: newPlanId(),
      title,
      organizerId: session.accountId,
      organizerName: name,
      from,
      to: addDays(from, range.days - 1),
      durationMinutes: duration,
      timezone,
      inputMode: mode as "busy" | "free",
      now: Date.now(),
    });
  } catch (error) {
    if (error instanceof PlanError) return { error: error.code };
    throw error;
  }
  await plans().save(plan);
  redirect(`/p/${plan.id}`);
}

async function loadForSession(planId: string) {
  const [session, plan] = await Promise.all([
    getSession(),
    plans().findById(planId),
  ]);
  if (!plan) redirect("/");
  if (!session) redirect(`/entrar?next=${encodeURIComponent(`/p/${planId}`)}`);
  return { session, plan };
}

export async function joinPlanAction(planId: string): Promise<void> {
  const { session, plan } = await loadForSession(planId);
  await plans().save(
    joinPlan(plan, {
      accountId: session.accountId,
      displayName: session.displayName,
      now: Date.now(),
    }),
  );
  redirect(`/p/${planId}/disponibilidad`);
}

export interface AnswerInput {
  readonly templates: readonly BusyTemplate[];
  readonly busy: Readonly<Record<string, readonly Interval[]>>;
  readonly cleared: Readonly<Record<string, readonly Interval[]>>;
  readonly free: Readonly<Record<string, readonly Interval[]>>;
}

export async function answerAction(
  planId: string,
  input: AnswerInput,
): Promise<{ ok: false }> {
  const { session, plan: loaded } = await loadForSession(planId);
  let plan = loaded;
  if (!plan.participants.some((p) => p.accountId === session.accountId)) {
    plan = joinPlan(plan, {
      accountId: session.accountId,
      displayName: session.displayName,
      now: Date.now(),
    });
  }
  try {
    const days =
      plan.inputMode === "free"
        ? buildAnswerDays({
            mode: "free",
            from: plan.from,
            to: plan.to,
            free: input.free,
          })
        : buildAnswerDays({
            mode: "busy",
            from: plan.from,
            to: plan.to,
            templates: input.templates,
            busy: input.busy,
            cleared: input.cleared,
          });
    plan = answerPlan(plan, {
      accountId: session.accountId,
      days,
      now: Date.now(),
    });
  } catch (error) {
    if (error instanceof PlanError || error instanceof RangeError)
      return { ok: false };
    throw error;
  }
  await plans().save(plan);
  redirect(`/p/${planId}`);
}

export async function confirmAction(
  planId: string,
  formData: FormData,
): Promise<void> {
  const { session, plan } = await loadForSession(planId);
  let date: LocalDate;
  try {
    date = parseLocalDate(text(formData, "date"));
  } catch {
    return;
  }
  const start = Number(text(formData, "start"));
  try {
    await plans().save(
      confirmPlan(plan, {
        accountId: session.accountId,
        date,
        start,
        now: Date.now(),
      }),
    );
  } catch (error) {
    if (!(error instanceof PlanError)) throw error;
  }
  refresh();
}
