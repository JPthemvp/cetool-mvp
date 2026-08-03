/**
 * Domain string handling, kept free of Node built-ins.
 *
 * These live apart from `scan.ts` deliberately. The scanner imports
 * `node:dns` and `node:tls`, so anything a client component pulls from it drags
 * those into the browser bundle and the build fails. Client and server both need
 * to normalise a domain the same way, so the shared, dependency-free half lives
 * here.
 */

/** Strip scheme, path, port and a leading www so two spellings compare equal. */
export function normaliseDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .replace(/^www\./, "");
}

export function isPlausibleDomain(d: string): boolean {
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(d);
}
