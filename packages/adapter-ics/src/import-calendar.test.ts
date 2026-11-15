import { describe, expect, it } from "vitest";
import type { Transport } from "./fetch-ics";
import { importIcsCalendar } from "./import-calendar";

describe("importIcsCalendar", () => {
  it("downloads a link and returns an imported calendar with busy spans only", async () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:a",
      "DTSTART:20261118T150000Z",
      "DTEND:20261118T170000Z",
      "SUMMARY:Turno",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const transport: Transport = async () => ({
      status: 200,
      location: null,
      body: (async function* () {
        yield new TextEncoder().encode(ics);
      })(),
    });
    const now = Date.UTC(2026, 10, 15);
    const calendar = await importIcsCalendar(
      {
        id: "work",
        name: "Trabajo",
        url: "webcal://example.com/a.ics",
        timeZone: "America/Santiago",
        now,
      },
      transport,
    );
    expect(calendar).toEqual({
      id: "work",
      name: "Trabajo",
      busy: [
        { start: Date.UTC(2026, 10, 18, 15), end: Date.UTC(2026, 10, 18, 17) },
      ],
      syncedAt: now,
    });
  });
});
