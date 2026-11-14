import { describe, expect, it } from "vitest";
import {
  buildGoogleCalendarUrl,
  buildIcs,
  type CalendarInvite,
} from "./invite";

const invite: CalendarInvite = {
  uid: "plan-123@amigorganizador",
  title: "Asado de fin de año",
  start: Date.UTC(2026, 11, 19, 23, 0),
  end: Date.UTC(2026, 11, 20, 2, 0),
  description: "Confirmado por 5 de 6",
  location: "Casa de Ana, Ñuñoa",
  url: "https://example.com/p/abc",
};
const NOW = Date.UTC(2026, 10, 13, 12, 0, 5);

const utf8Length = (text: string) =>
  [...text].reduce((total, char) => {
    const code = char.codePointAt(0) ?? 0;
    return (
      total + (code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4)
    );
  }, 0);

/** Splits a URL into its base and decoded query parameters. */
function parseUrl(url: string) {
  const [base = "", query = ""] = url.split("?");
  const params = new Map(
    query
      .split("&")
      .filter(Boolean)
      .map((pair) => {
        const [key = "", value = ""] = pair.split("=");
        return [key, decodeURIComponent(value)] as const;
      }),
  );
  return { base, params };
}

describe("buildIcs", () => {
  it("builds a single-event calendar with CRLF line endings", () => {
    const ics = buildIcs(invite, NOW);
    const lines = ics.split("\r\n");

    expect(ics.endsWith("\r\n")).toBe(true);
    expect(lines).toEqual([
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//AmigOrganizador//Plans//ES",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:plan-123@amigorganizador",
      "DTSTAMP:20261113T120005Z",
      "DTSTART:20261219T230000Z",
      "DTEND:20261220T020000Z",
      "SUMMARY:Asado de fin de año",
      "DESCRIPTION:Confirmado por 5 de 6",
      "LOCATION:Casa de Ana\\, Ñuñoa",
      "URL:https://example.com/p/abc",
      "END:VEVENT",
      "END:VCALENDAR",
      "",
    ]);
  });

  it("escapes special characters and newlines", () => {
    const ics = buildIcs(
      { ...invite, title: "Pizza; cine, y\nchela\\s", description: undefined },
      NOW,
    );
    expect(ics).toContain("SUMMARY:Pizza\\; cine\\, y\\nchela\\\\s\r\n");
    expect(ics).not.toContain("DESCRIPTION");
  });

  it("folds lines longer than 75 octets without splitting characters", () => {
    const ics = buildIcs({ ...invite, title: "ñ".repeat(60) }, NOW);
    const summary = ics.split("\r\n").filter((line, index, all) => {
      const start = all.findIndex((l) => l.startsWith("SUMMARY:"));
      return index >= start && (index === start || line.startsWith(" "));
    });

    expect(summary.length).toBeGreaterThan(1);
    for (const line of summary) {
      expect(utf8Length(line)).toBeLessThanOrEqual(75);
    }
    expect(
      summary.map((line, i) => (i === 0 ? line : line.slice(1))).join(""),
    ).toBe(`SUMMARY:${"ñ".repeat(60)}`);
  });

  it("rejects an end that is not after the start", () => {
    expect(() => buildIcs({ ...invite, end: invite.start }, NOW)).toThrow(
      /end must be after start/,
    );
  });
});

describe("buildGoogleCalendarUrl", () => {
  it("builds a prefilled event template link", () => {
    const url = parseUrl(buildGoogleCalendarUrl(invite));

    expect(url.base).toBe("https://calendar.google.com/calendar/render");
    expect(url.params.get("action")).toBe("TEMPLATE");
    expect(url.params.get("text")).toBe("Asado de fin de año");
    expect(url.params.get("dates")).toBe("20261219T230000Z/20261220T020000Z");
    expect(url.params.get("details")).toBe(
      "Confirmado por 5 de 6\n\nhttps://example.com/p/abc",
    );
    expect(url.params.get("location")).toBe("Casa de Ana, Ñuñoa");
  });

  it("omits optional fields that are missing", () => {
    const url = parseUrl(
      buildGoogleCalendarUrl({
        uid: "x",
        title: "Juntada",
        start: invite.start,
        end: invite.end,
      }),
    );
    expect(url.params.has("details")).toBe(false);
    expect(url.params.has("location")).toBe(false);
  });
});
