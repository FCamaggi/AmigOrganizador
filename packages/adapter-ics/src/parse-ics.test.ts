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

  it("keeps later occurrences when an earlier one is moved past the window", () => {
    const ics = calendar(
      event([
        "UID:w",
        "DTSTART:20261116T110000Z",
        "DTEND:20261116T130000Z",
        "RRULE:FREQ=WEEKLY;COUNT=3",
      ]),
      event([
        "UID:w",
        "RECURRENCE-ID:20261116T110000Z",
        "DTSTART:20261202T110000Z",
        "DTEND:20261202T130000Z",
      ]),
    );
    expect(parseIcsBusy(ics, WINDOW)).toEqual([
      { start: Date.UTC(2026, 10, 23, 11), end: Date.UTC(2026, 10, 23, 13) },
    ]);
  });

  it("brings in an occurrence moved from after the window into it", () => {
    const ics = calendar(
      event([
        "UID:w",
        "DTSTART:20261116T110000Z",
        "DTEND:20261116T120000Z",
        "RRULE:FREQ=WEEKLY;COUNT=3",
      ]),
      event([
        "UID:w",
        "RECURRENCE-ID:20261130T110000Z",
        "DTSTART:20261125T150000Z",
        "DTEND:20261125T160000Z",
      ]),
    );
    expect(parseIcsBusy(ics, WINDOW)).toEqual([
      { start: Date.UTC(2026, 10, 16, 11), end: Date.UTC(2026, 10, 16, 12) },
      { start: Date.UTC(2026, 10, 23, 11), end: Date.UTC(2026, 10, 23, 12) },
      { start: Date.UTC(2026, 10, 25, 15), end: Date.UTC(2026, 10, 25, 16) },
    ]);
  });

  it("never applies an exception of one series to another series", () => {
    const ics = calendar(
      event([
        "UID:series-a",
        "DTSTART:20261116T110000Z",
        "DTEND:20261116T120000Z",
        "RRULE:FREQ=DAILY;COUNT=2",
      ]),
      event([
        "UID:series-b",
        "RECURRENCE-ID:20261116T110000Z",
        "DTSTART:20261116T110000Z",
        "DTEND:20261116T120000Z",
        "STATUS:CANCELLED",
      ]),
    );
    expect(parseIcsBusy(ics, WINDOW)).toEqual([
      { start: Date.UTC(2026, 10, 16, 11), end: Date.UTC(2026, 10, 16, 12) },
      { start: Date.UTC(2026, 10, 17, 11), end: Date.UTC(2026, 10, 17, 12) },
    ]);
  });

  it("evaluates a UTC UNTIL against the real time of an IANA TZID without VTIMEZONE", () => {
    const ics = calendar(
      event([
        "UID:u",
        "DTSTART;TZID=America/Santiago:20261116T100000",
        "DTEND;TZID=America/Santiago:20261116T110000",
        "RRULE:FREQ=DAILY;UNTIL=20261117T120000Z",
      ]),
    );
    expect(parseIcsBusy(ics, WINDOW)).toEqual([
      { start: Date.UTC(2026, 10, 16, 13), end: Date.UTC(2026, 10, 16, 14) },
    ]);
  });

  it("keeps the last occurrence before UNTIL in a zone ahead of UTC", () => {
    const ics = calendar(
      event([
        "UID:m",
        "DTSTART;TZID=Europe/Madrid:20261116T100000",
        "DTEND;TZID=Europe/Madrid:20261116T110000",
        "RRULE:FREQ=DAILY;UNTIL=20261117T093000Z",
      ]),
    );
    // Madrid is UTC+1 in November: 10:00 local = 09:00Z, before UNTIL on day 2.
    expect(parseIcsBusy(ics, WINDOW)).toEqual([
      { start: Date.UTC(2026, 10, 16, 9), end: Date.UTC(2026, 10, 16, 10) },
      { start: Date.UTC(2026, 10, 17, 9), end: Date.UTC(2026, 10, 17, 10) },
    ]);
  });

  it("keeps busy overrides of a series that is itself marked free", () => {
    const ics = calendar(
      event([
        "UID:f",
        "DTSTART:20261116T110000Z",
        "DTEND:20261116T120000Z",
        "RRULE:FREQ=DAILY;COUNT=2",
        "TRANSP:TRANSPARENT",
      ]),
      event([
        "UID:f",
        "RECURRENCE-ID:20261117T110000Z",
        "DTSTART:20261117T150000Z",
        "DTEND:20261117T160000Z",
        "TRANSP:OPAQUE",
      ]),
    );
    expect(parseIcsBusy(ics, WINDOW)).toEqual([
      { start: Date.UTC(2026, 10, 17, 15), end: Date.UTC(2026, 10, 17, 16) },
    ]);
  });

  it("does not let one calendar's VTIMEZONE leak into the next parse", () => {
    const fake = [
      "BEGIN:VTIMEZONE",
      "TZID:America/Santiago",
      "BEGIN:STANDARD",
      "DTSTART:19700101T000000",
      "TZOFFSETFROM:+0500",
      "TZOFFSETTO:+0500",
      "END:STANDARD",
      "END:VTIMEZONE",
    ].join("\r\n");
    parseIcsBusy(
      calendar(
        fake,
        event([
          "UID:x",
          "DTSTART;TZID=America/Santiago:20261118T090000",
          "DTEND;TZID=America/Santiago:20261118T100000",
        ]),
      ),
      WINDOW,
    );
    const clean = calendar(
      event([
        "UID:y",
        "DTSTART;TZID=America/Santiago:20261118T090000",
        "DTEND;TZID=America/Santiago:20261118T100000",
      ]),
    );
    expect(parseIcsBusy(clean, WINDOW)).toEqual([
      { start: Date.UTC(2026, 10, 18, 12), end: Date.UTC(2026, 10, 18, 13) },
    ]);
  });

  it("skips an event without DTSTART instead of crashing", () => {
    const ics = calendar(
      event(["UID:broken", "SUMMARY:sin fecha"]),
      event(["UID:ok", "DTSTART:20261118T150000Z", "DTEND:20261118T160000Z"]),
    );
    expect(parseIcsBusy(ics, WINDOW)).toEqual([
      { start: Date.UTC(2026, 10, 18, 15), end: Date.UTC(2026, 10, 18, 16) },
    ]);
  });

  it("blocks the whole local day on Santiago's spring-forward Sunday", () => {
    const ics = calendar(
      event([
        "UID:d",
        "DTSTART;VALUE=DATE:20260906",
        "DTEND;VALUE=DATE:20260907",
      ]),
    );
    // 6 Sep 2026 starts at 01:00 local (04:00Z) after the midnight jump; 23 h long.
    expect(
      parseIcsBusy(ics, {
        from: Date.UTC(2026, 8, 5),
        to: Date.UTC(2026, 8, 8),
        timeZone: TZ,
      }),
    ).toEqual([
      { start: Date.UTC(2026, 8, 6, 4), end: Date.UTC(2026, 8, 7, 3) },
    ]);
  });

  it("throws IcsError for text that is not a calendar", () => {
    expect(() => parseIcsBusy("<html>login</html>", WINDOW)).toThrow(
      /not a calendar/,
    );
  });
});
