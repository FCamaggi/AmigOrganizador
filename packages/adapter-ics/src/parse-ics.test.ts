import { describe, expect, it } from "vitest";
import { parseIcsBusy } from "./parse-ics";

const TZ = "America/Santiago";
// Window: Mon 16 Nov 2026 00:00 to Mon 30 Nov 2026 00:00 (UTC instants).
const WINDOW = {
  from: Date.UTC(2026, 10, 16),
  to: Date.UTC(2026, 10, 30),
  timeZone: TZ,
};

const calendar = (...events: string[]) =>
  [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//test//EN",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

const event = (lines: string[]) =>
  ["BEGIN:VEVENT", ...lines, "END:VEVENT"].join("\r\n");

describe("parseIcsBusy", () => {
  it("reads a UTC event as a busy span", () => {
    const ics = calendar(
      event([
        "UID:a",
        "DTSTART:20261118T150000Z",
        "DTEND:20261118T170000Z",
        "SUMMARY:Dentista",
      ]),
    );
    expect(parseIcsBusy(ics, WINDOW)).toEqual([
      { start: Date.UTC(2026, 10, 18, 15), end: Date.UTC(2026, 10, 18, 17) },
    ]);
  });

  it("never returns titles, descriptions or locations", () => {
    const ics = calendar(
      event([
        "UID:a",
        "DTSTART:20261118T150000Z",
        "DTEND:20261118T170000Z",
        "SUMMARY:Secreto",
        "DESCRIPTION:Muy privado",
        "LOCATION:Casa",
      ]),
    );
    const spans = parseIcsBusy(ics, WINDOW);
    expect(JSON.stringify(spans)).not.toMatch(/Secreto|privado|Casa/);
    expect(Object.keys(spans[0] ?? {})).toEqual(["start", "end"]);
  });

  it("uses a TZID with an IANA name even without a VTIMEZONE block", () => {
    const ics = calendar(
      event([
        "UID:a",
        "DTSTART;TZID=America/Santiago:20261118T090000",
        "DTEND;TZID=America/Santiago:20261118T180000",
      ]),
    );
    // Santiago is UTC-3 in November.
    expect(parseIcsBusy(ics, WINDOW)).toEqual([
      { start: Date.UTC(2026, 10, 18, 12), end: Date.UTC(2026, 10, 18, 21) },
    ]);
  });

  it("uses a VTIMEZONE block when the file has one (Google feeds do)", () => {
    const vtimezone = [
      "BEGIN:VTIMEZONE",
      "TZID:Chile Continental",
      "BEGIN:STANDARD",
      "DTSTART:19700405T000000",
      "TZOFFSETFROM:-0300",
      "TZOFFSETTO:-0400",
      "RRULE:FREQ=YEARLY;BYMONTH=4;BYDAY=1SU",
      "END:STANDARD",
      "BEGIN:DAYLIGHT",
      "DTSTART:19700906T000000",
      "TZOFFSETFROM:-0400",
      "TZOFFSETTO:-0300",
      "RRULE:FREQ=YEARLY;BYMONTH=9;BYDAY=1SU",
      "END:DAYLIGHT",
      "END:VTIMEZONE",
    ].join("\r\n");
    const ics = calendar(
      vtimezone,
      event([
        "UID:a",
        "DTSTART;TZID=Chile Continental:20261118T090000",
        "DTEND;TZID=Chile Continental:20261118T100000",
      ]),
    );
    // The person is in UTC, so only the VTIMEZONE can give 12:00Z.
    expect(parseIcsBusy(ics, { ...WINDOW, timeZone: "UTC" })).toEqual([
      { start: Date.UTC(2026, 10, 18, 12), end: Date.UTC(2026, 10, 18, 13) },
    ]);
  });

  it("reads floating times in the person's timezone", () => {
    const ics = calendar(
      event(["UID:a", "DTSTART:20261118T090000", "DTEND:20261118T100000"]),
    );
    expect(parseIcsBusy(ics, WINDOW)).toEqual([
      { start: Date.UTC(2026, 10, 18, 12), end: Date.UTC(2026, 10, 18, 13) },
    ]);
  });

  it("expands weekly recurrences inside the window, skipping EXDATEs", () => {
    const ics = calendar(
      event([
        "UID:class",
        "DTSTART;TZID=America/Santiago:20261102T080000",
        "DTEND;TZID=America/Santiago:20261102T100000",
        "RRULE:FREQ=WEEKLY;BYDAY=MO",
        "EXDATE;TZID=America/Santiago:20261123T080000",
      ]),
    );
    // Mondays in the window: 16, 23 (excluded); 30 starts at the window end.
    expect(parseIcsBusy(ics, WINDOW)).toEqual([
      { start: Date.UTC(2026, 10, 16, 11), end: Date.UTC(2026, 10, 16, 13) },
    ]);
  });

  it("applies a moved occurrence (RECURRENCE-ID)", () => {
    const ics = calendar(
      event([
        "UID:class",
        "DTSTART:20261116T110000Z",
        "DTEND:20261116T130000Z",
        "RRULE:FREQ=WEEKLY;COUNT=2",
      ]),
      event([
        "UID:class",
        "RECURRENCE-ID:20261123T110000Z",
        "DTSTART:20261124T150000Z",
        "DTEND:20261124T170000Z",
      ]),
    );
    expect(parseIcsBusy(ics, WINDOW)).toEqual([
      { start: Date.UTC(2026, 10, 16, 11), end: Date.UTC(2026, 10, 16, 13) },
      { start: Date.UTC(2026, 10, 24, 15), end: Date.UTC(2026, 10, 24, 17) },
    ]);
  });

  it("makes an all-day busy event busy for the whole local day", () => {
    const ics = calendar(
      event([
        "UID:a",
        "DTSTART;VALUE=DATE:20261120",
        "DTEND;VALUE=DATE:20261121",
        "TRANSP:OPAQUE",
      ]),
    );
    expect(parseIcsBusy(ics, WINDOW)).toEqual([
      { start: Date.UTC(2026, 10, 20, 3), end: Date.UTC(2026, 10, 21, 3) },
    ]);
  });

  it("skips events marked free (TRANSP:TRANSPARENT) and cancelled ones", () => {
    const ics = calendar(
      event([
        "UID:a",
        "DTSTART:20261118T150000Z",
        "DTEND:20261118T170000Z",
        "TRANSP:TRANSPARENT",
      ]),
      event([
        "UID:b",
        "DTSTART:20261119T150000Z",
        "DTEND:20261119T170000Z",
        "STATUS:CANCELLED",
      ]),
    );
    expect(parseIcsBusy(ics, WINDOW)).toEqual([]);
  });

  it("clips events to the window and leaves out the ones outside it", () => {
    const ics = calendar(
      event(["UID:a", "DTSTART:20261115T220000Z", "DTEND:20261116T020000Z"]),
      event(["UID:b", "DTSTART:20261201T150000Z", "DTEND:20261201T170000Z"]),
    );
    expect(parseIcsBusy(ics, WINDOW)).toEqual([
      { start: Date.UTC(2026, 10, 16), end: Date.UTC(2026, 10, 16, 2) },
    ]);
  });

  it("stops expanding an unbounded daily rule at the window end", () => {
    const ics = calendar(
      event([
        "UID:a",
        "DTSTART:20200101T120000Z",
        "DTEND:20200101T130000Z",
        "RRULE:FREQ=DAILY",
      ]),
    );
    expect(parseIcsBusy(ics, WINDOW)).toHaveLength(14);
  });

  it("throws IcsError for text that is not a calendar", () => {
    expect(() => parseIcsBusy("<html>login</html>", WINDOW)).toThrow(
      /not a calendar/,
    );
  });
});
