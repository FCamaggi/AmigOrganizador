import { resyncCalendars } from "@amigo/core";
import { fetchImportedCalendar } from "@/server/calendar-sync";
import { cronAuthorized } from "@/server/cron";
import { calendarSources, profiles } from "@/server/repository";

/**
 * Re-reads every imported ICS calendar (S4), called daily by Vercel Cron
 * (`vercel.json`) with `Authorization: Bearer $CRON_SECRET`. Answers with
 * counts only: never links or accounts.
 */
export async function GET(request: Request) {
  if (
    !cronAuthorized(
      request.headers.get("authorization"),
      process.env.CRON_SECRET,
    )
  ) {
    return new Response("Unauthorized", { status: 401 });
  }
  const sources = calendarSources();
  const report = await resyncCalendars({
    sources: await sources.listAll(),
    profiles: profiles(),
    deleteSource: (accountId, calendarId) =>
      sources.delete(accountId, calendarId),
    fetchCalendar: fetchImportedCalendar,
    now: Date.now,
  });
  console.info("calendar resync", report);
  return Response.json(report, { headers: { "Cache-Control": "no-store" } });
}
