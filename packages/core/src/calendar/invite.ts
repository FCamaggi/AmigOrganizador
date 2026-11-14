/** A confirmed plan as a calendar event. Times are epoch milliseconds (UTC). */
export interface CalendarInvite {
  /** Stable across updates so calendars replace the event instead of duplicating it. */
  readonly uid: string;
  readonly title: string;
  readonly start: number;
  readonly end: number;
  readonly description?: string | undefined;
  readonly location?: string | undefined;
  readonly url?: string | undefined;
}

const MAX_LINE_OCTETS = 75;

/** `20261219T230000Z` */
function formatUtc(ms: number): string {
  return new Date(ms)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/** RFC 5545 §3.3.11 TEXT escaping. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, String.raw`\;`)
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function utf8Length(char: string): number {
  const code = char.codePointAt(0) ?? 0;
  if (code < 0x80) return 1;
  if (code < 0x800) return 2;
  if (code < 0x10000) return 3;
  return 4;
}

/** RFC 5545 §3.1 folding: at most 75 octets per line, never inside a character. */
function foldLine(line: string): string[] {
  const lines: string[] = [];
  let current = "";
  let octets = 0;
  for (const char of line) {
    const size = utf8Length(char);
    if (octets + size > MAX_LINE_OCTETS) {
      lines.push(current);
      current = ` ${char}`;
      octets = 1 + size;
    } else {
      current += char;
      octets += size;
    }
  }
  lines.push(current);
  return lines;
}

function assertValid(invite: CalendarInvite): void {
  if (!(invite.end > invite.start)) {
    throw new RangeError("end must be after start");
  }
}

/** Builds an `.ics` file with one event. `now` becomes DTSTAMP. */
export function buildIcs(invite: CalendarInvite, now: number): string {
  assertValid(invite);
  const properties = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AmigOrganizador//Plans//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${invite.uid}`,
    `DTSTAMP:${formatUtc(now)}`,
    `DTSTART:${formatUtc(invite.start)}`,
    `DTEND:${formatUtc(invite.end)}`,
    `SUMMARY:${escapeText(invite.title)}`,
    ...(invite.description
      ? [`DESCRIPTION:${escapeText(invite.description)}`]
      : []),
    ...(invite.location ? [`LOCATION:${escapeText(invite.location)}`] : []),
    ...(invite.url ? [`URL:${invite.url}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${properties.flatMap(foldLine).join("\r\n")}\r\n`;
}

/** Builds a Google Calendar "add event" link prefilled with the invite. */
export function buildGoogleCalendarUrl(invite: CalendarInvite): string {
  assertValid(invite);
  const details = [invite.description, invite.url].filter(Boolean).join("\n\n");
  const params: [string, string][] = [
    ["action", "TEMPLATE"],
    ["text", invite.title],
    ["dates", `${formatUtc(invite.start)}/${formatUtc(invite.end)}`],
  ];
  if (details) params.push(["details", details]);
  if (invite.location) params.push(["location", invite.location]);
  const query = params
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
  return `https://calendar.google.com/calendar/render?${query}`;
}
