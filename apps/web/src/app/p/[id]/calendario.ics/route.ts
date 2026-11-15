import { buildIcs, inviteFor } from "@amigo/core";
import { plans } from "@/server/repository";

export async function GET(
  request: Request,
  ctx: RouteContext<"/p/[id]/calendario.ics">,
) {
  const { id } = await ctx.params;
  const plan = await plans().findById(id);
  const url = new URL(`/p/${id}`, request.url).toString();
  const invite = plan ? inviteFor(plan, url) : null;
  if (!invite) return new Response("Not found", { status: 404 });
  return new Response(buildIcs(invite, Date.now()), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="plan.ics"',
      "Cache-Control": "no-store",
    },
  });
}
