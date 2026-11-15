import { buildIcsFeed, groupFeed } from "@amigo/core";
import { groupPlans, groups } from "@/server/repository";

/** The group's subscribable calendar: its confirmed plans (S4). */
export async function GET(
  request: Request,
  ctx: RouteContext<"/g/[code]/calendario.ics">,
) {
  const { code } = await ctx.params;
  const group = await groups().findByInviteCode(code);
  if (!group) return new Response("Not found", { status: 404 });
  const url = new URL(`/g/${code}`, request.url).toString();
  const feed = groupFeed(
    group,
    await groupPlans().listForGroup(group.id),
    () => url,
  );
  return new Response(buildIcsFeed(feed, Date.now()), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
