import { promises as dns } from "node:dns";
import { request } from "node:https";
import { BlockList, isIP, type LookupFunction } from "node:net";

const DEFAULT_TIMEOUT_MS = 10_000;
/** A year of a busy calendar is well under 2 MB. */
const DEFAULT_MAX_BYTES = 2_000_000;
const MAX_REDIRECTS = 3;
const REDIRECTS = new Set([301, 302, 303, 307, 308]);

export type IcsFetchErrorCode =
  | "INVALID_URL"
  | "BLOCKED_ADDRESS"
  | "HTTP_ERROR"
  | "TOO_LARGE"
  | "TIMEOUT"
  | "TOO_MANY_REDIRECTS"
  | "NETWORK";

/** Downloading a calendar failed. `code` is stable; the UI maps it to copy. */
export class IcsFetchError extends Error {
  readonly code: IcsFetchErrorCode;

  constructor(code: IcsFetchErrorCode, message: string) {
    super(message);
    this.name = "IcsFetchError";
    this.code = code;
  }
}

/**
 * Only https on the default port, no credentials. `webcal://` (what calendar
 * apps hand out) is the same feed over https.
 */
export function normalizeIcsUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw.trim().replace(/^webcals?:\/\//i, "https://"));
  } catch {
    throw new IcsFetchError("INVALID_URL", "not a URL");
  }
  if (url.protocol !== "https:") {
    throw new IcsFetchError(
      "INVALID_URL",
      "only https calendar links are allowed",
    );
  }
  if (url.username || url.password) {
    throw new IcsFetchError(
      "INVALID_URL",
      "links with credentials are not allowed",
    );
  }
  if (url.port && url.port !== "443") {
    throw new IcsFetchError(
      "INVALID_URL",
      "only the default https port is allowed",
    );
  }
  return url;
}

/** Private, loopback, link-local, shared, multicast and reserved ranges. */
const blocked = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  blocked.addSubnet(network, prefix, "ipv4");
}
for (const [network, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
  ["2001:db8::", 32],
] as const) {
  blocked.addSubnet(network, prefix, "ipv6");
}

/** True for any address a calendar download must never reach. */
export function isBlockedAddress(address: string): boolean {
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address);
  if (mapped?.[1]) return blocked.check(mapped[1], "ipv4");
  const version = isIP(address);
  if (version === 4) return blocked.check(address, "ipv4");
  if (version === 6) return blocked.check(address, "ipv6");
  return true;
}

type Resolver = (
  host: string,
) => Promise<{ address: string; family: number }[]>;

const systemResolver: Resolver = (host) =>
  dns.lookup(host, { all: true, verbatim: true });

/**
 * A DNS lookup for the connection itself that refuses blocked addresses.
 * Because the check runs on the address the socket connects to, a host that
 * answers differently the second time (DNS rebinding) cannot slip through.
 */
export function createSafeLookup(
  resolve: Resolver = systemResolver,
): LookupFunction {
  return (hostname, options, callback) => {
    resolve(hostname)
      .then((addresses) => {
        if (
          addresses.length === 0 ||
          addresses.some((a) => isBlockedAddress(a.address))
        ) {
          throw new IcsFetchError(
            "BLOCKED_ADDRESS",
            "the calendar link points to a private or reserved address",
          );
        }
        const [first] = addresses;
        if (options.all) {
          callback(
            null,
            addresses.map((a) => ({ address: a.address, family: a.family })),
          );
        } else if (first) {
          callback(null, first.address, first.family);
        }
      })
      .catch((error: Error) => callback(error as NodeJS.ErrnoException, "", 0));
  };
}

export type Transport = (
  url: URL,
  options: { lookup: LookupFunction; signal: AbortSignal },
) => Promise<{
  status: number;
  location: string | null;
  body: AsyncIterable<Uint8Array>;
}>;

const httpsTransport: Transport = (url, { lookup, signal }) =>
  new Promise((resolve, reject) => {
    const req = request(
      url,
      {
        method: "GET",
        lookup,
        signal,
        headers: {
          accept: "text/calendar, text/plain;q=0.9, */*;q=0.1",
          "user-agent": "AmigOrganizador-calendar-import",
        },
      },
      (res) => {
        const location = res.headers.location;
        resolve({
          status: res.statusCode ?? 0,
          location: typeof location === "string" ? location : null,
          body: res,
        });
      },
    );
    req.on("error", reject);
    req.end();
  });

/**
 * Downloads a calendar from a link the person gave (S4). The link may be a
 * private address (e.g. Google's "secret address"): never log it.
 */
export async function fetchIcs(
  rawUrl: string,
  options: { timeoutMs?: number; maxBytes?: number } = {},
  transport: Transport = httpsTransport,
): Promise<string> {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const controller = new AbortController();
  const timer = setTimeout(
    () =>
      controller.abort(
        new IcsFetchError("TIMEOUT", "the calendar took too long to download"),
      ),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );
  const lookup = createSafeLookup();
  try {
    let url = normalizeIcsUrl(rawUrl);
    for (let redirects = 0; ; redirects++) {
      const response = await transport(url, {
        lookup,
        signal: controller.signal,
      });
      if (REDIRECTS.has(response.status) && response.location) {
        if (redirects >= MAX_REDIRECTS) {
          throw new IcsFetchError("TOO_MANY_REDIRECTS", "too many redirects");
        }
        url = normalizeIcsUrl(new URL(response.location, url).toString());
        continue;
      }
      if (response.status < 200 || response.status >= 300) {
        throw new IcsFetchError(
          "HTTP_ERROR",
          `the server answered ${response.status}`,
        );
      }
      const chunks: Uint8Array[] = [];
      let size = 0;
      for await (const chunk of response.body) {
        size += chunk.byteLength;
        if (size > maxBytes) {
          controller.abort();
          throw new IcsFetchError("TOO_LARGE", "the calendar is too large");
        }
        chunks.push(chunk);
      }
      return new TextDecoder().decode(Buffer.concat(chunks));
    }
  } catch (error) {
    if (error instanceof IcsFetchError) throw error;
    if (controller.signal.reason instanceof IcsFetchError) {
      throw controller.signal.reason;
    }
    throw new IcsFetchError("NETWORK", "the calendar could not be downloaded");
  } finally {
    clearTimeout(timer);
  }
}
