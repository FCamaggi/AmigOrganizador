import { describe, expect, it } from "vitest";
import {
  createSafeLookup,
  fetchIcs,
  IcsFetchError,
  isBlockedAddress,
  normalizeIcsUrl,
  type Transport,
} from "./fetch-ics";

async function expectFetchError(
  promise: Promise<unknown>,
  code: IcsFetchError["code"],
) {
  await expect(promise).rejects.toBeInstanceOf(IcsFetchError);
  await expect(promise).rejects.toMatchObject({ code });
}

describe("normalizeIcsUrl", () => {
  it("turns webcal:// into https://", () => {
    expect(
      normalizeIcsUrl(" webcal://calendar.google.com/x/basic.ics ").toString(),
    ).toBe("https://calendar.google.com/x/basic.ics");
  });

  it.each([
    ["not a URL", "calendario"],
    ["plain http", "http://example.com/a.ics"],
    ["another scheme", "file:///etc/passwd"],
    ["credentials in the URL", "https://user:pass@example.com/a.ics"],
    ["a non-default port", "https://example.com:8443/a.ics"],
  ])("rejects %s", (_label, url) => {
    expect(() => normalizeIcsUrl(url)).toThrow(IcsFetchError);
  });
});

describe("isBlockedAddress", () => {
  it.each([
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.1",
    "192.168.1.10",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "224.0.0.1",
    "::1",
    "::",
    "fe80::1",
    "fd12:3456::1",
    "::ffff:127.0.0.1",
    "::ffff:7f00:1",
    "64:ff9b::7f00:1",
    "2002:7f00:1::1",
    "2001:0:4136:e378::1",
    "100::1",
  ])("blocks %s", (address) => {
    expect(isBlockedAddress(address)).toBe(true);
  });

  it.each([
    "142.250.79.46",
    "2800:3f0:4002:80e::200e",
  ])("allows the public address %s", (address) => {
    expect(isBlockedAddress(address)).toBe(false);
  });
});

describe("createSafeLookup", () => {
  const lookupWith = (address: string, family = 4) =>
    createSafeLookup(async () => [{ address, family }]);

  it("passes a public address through", async () => {
    const result = await new Promise((resolve, reject) =>
      lookupWith("142.250.79.46")(
        "calendar.google.com",
        {},
        (error, address, family) =>
          error ? reject(error) : resolve({ address, family }),
      ),
    );
    expect(result).toEqual({ address: "142.250.79.46", family: 4 });
  });

  it("refuses a host that resolves to a private address", async () => {
    const error = await new Promise((resolve) =>
      lookupWith("10.0.0.5")("evil.example", {}, (err) => resolve(err)),
    );
    expect(error).toBeInstanceOf(IcsFetchError);
    expect((error as IcsFetchError).code).toBe("BLOCKED_ADDRESS");
  });
});

/** A fake transport: responses by URL, recording every request. */
function fakeTransport(
  responses: Record<
    string,
    { status: number; location?: string; body?: string[] }
  >,
) {
  const seen: string[] = [];
  const transport: Transport = async (url) => {
    seen.push(url.toString());
    const response = responses[url.toString()];
    if (!response) throw new Error(`unexpected ${url}`);
    return {
      status: response.status,
      location: response.location ?? null,
      body: (async function* () {
        for (const chunk of response.body ?? [])
          yield new TextEncoder().encode(chunk);
      })(),
    };
  };
  return { transport, seen };
}

describe("fetchIcs", () => {
  it("returns the calendar text", async () => {
    const { transport } = fakeTransport({
      "https://example.com/a.ics": {
        status: 200,
        body: ["BEGIN:VCALENDAR", "\r\nEND:VCALENDAR"],
      },
    });
    await expect(
      fetchIcs("https://example.com/a.ics", {}, transport),
    ).resolves.toBe("BEGIN:VCALENDAR\r\nEND:VCALENDAR");
  });

  it("follows a redirect to another https URL", async () => {
    const { transport, seen } = fakeTransport({
      "https://example.com/a.ics": {
        status: 302,
        location: "https://cdn.example.com/b.ics",
      },
      "https://cdn.example.com/b.ics": {
        status: 200,
        body: ["BEGIN:VCALENDAR"],
      },
    });
    await fetchIcs("https://example.com/a.ics", {}, transport);
    expect(seen).toEqual([
      "https://example.com/a.ics",
      "https://cdn.example.com/b.ics",
    ]);
  });

  it("refuses a redirect to plain http", async () => {
    const { transport } = fakeTransport({
      "https://example.com/a.ics": {
        status: 301,
        location: "http://example.com/a.ics",
      },
    });
    await expectFetchError(
      fetchIcs("https://example.com/a.ics", {}, transport),
      "INVALID_URL",
    );
  });

  it("reports a malformed redirect target as an invalid URL", async () => {
    const { transport } = fakeTransport({
      "https://example.com/a.ics": { status: 302, location: "https://[::1" },
    });
    await expectFetchError(
      fetchIcs("https://example.com/a.ics", {}, transport),
      "INVALID_URL",
    );
  });

  it("gives up after too many redirects", async () => {
    const { transport } = fakeTransport({
      "https://example.com/a.ics": {
        status: 302,
        location: "https://example.com/a.ics",
      },
    });
    await expectFetchError(
      fetchIcs("https://example.com/a.ics", {}, transport),
      "TOO_MANY_REDIRECTS",
    );
  });

  it("reports an HTTP error", async () => {
    const { transport } = fakeTransport({
      "https://example.com/a.ics": { status: 404 },
    });
    await expectFetchError(
      fetchIcs("https://example.com/a.ics", {}, transport),
      "HTTP_ERROR",
    );
  });

  it("stops reading past the size limit", async () => {
    const { transport } = fakeTransport({
      "https://example.com/a.ics": {
        status: 200,
        body: ["x".repeat(600), "x".repeat(600)],
      },
    });
    await expectFetchError(
      fetchIcs("https://example.com/a.ics", { maxBytes: 1000 }, transport),
      "TOO_LARGE",
    );
  });

  it("times out", async () => {
    const transport: Transport = (_url, { signal }) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(signal.reason));
      });
    await expectFetchError(
      fetchIcs("https://example.com/a.ics", { timeoutMs: 20 }, transport),
      "TIMEOUT",
    );
  });
});

describe("fetchIcs over the real https transport", () => {
  it("refuses to connect to a host that resolves to loopback", async () => {
    await expectFetchError(
      fetchIcs("https://localhost/calendar.ics"),
      "BLOCKED_ADDRESS",
    );
  });
});
