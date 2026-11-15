import { buildIcs, groupPlanInvite } from "@amigo/core";
import { groupPlans, groups } from "@/server/repository";

export async function GET(
  request: Request,
  ctx: RouteContext<"/g/[code]/plan/[planId]/ics">,
) {
  const { code, planId } = await ctx.params;
  const group = await groups().findByInviteCode(code);
  const plan = await groupPlans().findById(planId);
  if (
    !group ||
    !plan ||
    plan.groupId !== group.id ||
    plan.status !== "confirmed"
  ) {
    return new Response("Not found", { status: 404 });
  }
  const url = new URL(`/g/${code}`, request.url).toString();
  return new Response(buildIcs(groupPlanInvite(plan, group, url), Date.now()), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="plan.ics"',
      "Cache-Control": "no-store",
    },
  });
}
