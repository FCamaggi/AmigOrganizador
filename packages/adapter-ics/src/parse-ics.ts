import { parseLocalDate, type UtcSpan, zonedTimeToUtc } from "@amigo/core";
import ICAL from "ical.js";

/** Stops a malformed or unbounded rule from looping forever. */
const MAX_OCCURRENCES = 5000;

/** The text could not be read as a calendar. */
export class IcsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IcsError";
  }
}

export interface ParseWindow {
  /** UTC milliseconds; only busy time inside [from, to) is returned. */
  readonly from: number;
  readonly to: number;
  /** The person's IANA timezone, for floating times and all-day events. */
  readonly timeZone: string;
}

type IcalTime = InstanceType<typeof ICAL.Time>;
type IcalEvent = InstanceType<typeof ICAL.Event>;
type IcalComponent = InstanceType<typeof ICAL.Component>;

function isTimeZone(name: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: name });
    return true;
  } catch {
    return false;
  }
}

const pad = (n: number) => String(n).padStart(2, "0");

function localDateOf(time: IcalTime) {
  return parseLocalDate(`${time.year}-${pad(time.month)}-${pad(time.day)}`);
}

/**
 * UTC instant of an iCalendar time. Zoned times (UTC or a VTIMEZONE in the
 * file) are exact; an unresolved TZID that is an IANA name is used as is;
 * floating times and all-day dates are read in the person's timezone.
 */
function toUtcMs(
  time: IcalTime,
  tzid: string | null,
  fallback: string,
): number {
  if (time.isDate) return zonedTimeToUtc(localDateOf(time), 0, fallback);
  const zone = time.zone;
  if (zone && zone !== ICAL.Timezone.localTimezone) {
    return time.toUnixTime() * 1000;
  }
  const timeZone = tzid && isTimeZone(tzid) ? tzid : fallback;
  return zonedTimeToUtc(
    localDateOf(time),
    time.hour * 60 + time.minute + time.second / 60,
    timeZone,
  );
}

/** Free (TRANSP:TRANSPARENT) and cancelled events never count as busy. */
function blocksTime(component: IcalComponent): boolean {
  const status = String(component.getFirstPropertyValue("status") ?? "");
  const transp = String(component.getFirstPropertyValue("transp") ?? "");
  return (
    status.toUpperCase() !== "CANCELLED" &&
    transp.toUpperCase() !== "TRANSPARENT"
  );
}

function startTzid(component: IcalComponent): string | null {
  const value = component.getFirstProperty("dtstart")?.getParameter("tzid");
  return typeof value === "string" ? value : null;
}

function mergeSpans(spans: UtcSpan[]): UtcSpan[] {
  const sorted = spans.toSorted((a, b) => a.start - b.start);
  const merged: UtcSpan[] = [];
  for (const span of sorted) {
    const last = merged.at(-1);
    if (last && span.start <= last.end) {
      merged[merged.length - 1] = {
        start: last.start,
        end: Math.max(last.end, span.end),
      };
    } else {
      merged.push(span);
    }
  }
  return merged;
}

function readCalendar(ics: string): IcalComponent {
  let root: IcalComponent;
  try {
    root = new ICAL.Component(ICAL.parse(ics));
  } catch {
    throw new IcsError("the text is not a calendar (iCalendar)");
  }
  if (root.name !== "vcalendar") {
    throw new IcsError("the text is not a calendar (iCalendar)");
  }
  return root;
}

/**
 * Busy spans from an iCalendar text, expanded and clipped to the window.
 * Only start and end instants leave this function: titles, descriptions and
 * locations are never read into the result (product rule: free/busy only).
 */
export function parseIcsBusy(ics: string, window: ParseWindow): UtcSpan[] {
  const root = readCalendar(ics);
  for (const vtimezone of root.getAllSubcomponents("vtimezone")) {
    ICAL.TimezoneService.register(vtimezone);
  }

  const vevents = root.getAllSubcomponents("vevent");
  const exceptions = new Map<string, IcalComponent[]>();
  const masters: IcalComponent[] = [];
  for (const vevent of vevents) {
    const uid = String(vevent.getFirstPropertyValue("uid") ?? "");
    if (vevent.hasProperty("recurrence-id") && uid) {
      exceptions.set(uid, [...(exceptions.get(uid) ?? []), vevent]);
    } else {
      masters.push(vevent);
    }
  }

  const spans: UtcSpan[] = [];
  const add = (start: number, end: number) => {
    const clipped = {
      start: Math.max(start, window.from),
      end: Math.min(end, window.to),
    };
    if (clipped.end > clipped.start) spans.push(clipped);
  };

  const masterUids = new Set<string>();
  for (const component of masters) {
    const uid = String(component.getFirstPropertyValue("uid") ?? "");
    masterUids.add(uid);
    const event: IcalEvent = new ICAL.Event(component);
    for (const exception of exceptions.get(uid) ?? [])
      event.relateException(exception);
    const tzid = startTzid(component);
    const utc = (time: IcalTime) => toUtcMs(time, tzid, window.timeZone);

    if (!event.isRecurring()) {
      if (blocksTime(component)) add(utc(event.startDate), utc(event.endDate));
      continue;
    }
    if (!blocksTime(component)) continue;
    const iterator = event.iterator();
    for (let count = 0; count < MAX_OCCURRENCES; count++) {
      const next = iterator.next();
      if (!next) break;
      const details = event.getOccurrenceDetails(next);
      const start = utc(details.startDate);
      if (start >= window.to) break;
      if (!blocksTime(details.item.component)) continue;
      add(start, utc(details.endDate));
    }
  }

  // A moved occurrence whose series is not in the file still blocks time.
  for (const [uid, orphans] of exceptions) {
    if (masterUids.has(uid)) continue;
    for (const component of orphans) {
      if (!blocksTime(component)) continue;
      const event = new ICAL.Event(component);
      const tzid = startTzid(component);
      add(
        toUtcMs(event.startDate, tzid, window.timeZone),
        toUtcMs(event.endDate, tzid, window.timeZone),
      );
    }
  }

  return mergeSpans(spans);
}
