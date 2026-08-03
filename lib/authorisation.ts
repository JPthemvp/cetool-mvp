/**
 * What we are allowed to do to a domain, and how we know.
 *
 * The checks in this tool are not all the same kind of act. Reading DNS records,
 * completing a TLS handshake and fetching a homepage are what any browser does —
 * running them against a domain you do not own is unremarkable, and it is exactly
 * the boundary CSA's Internet Hygiene Portal stays inside.
 *
 * Requesting /.env or /.git/config is a different act. Those files are never
 * meant to be served, so asking for them is not "browsing" — it is checking
 * whether a specific misconfiguration exists, it lands in the target's WAF logs
 * as reconnaissance, and in Singapore unauthorised access to computer material is
 * an offence under the Computer Misuse Act. The fact that it is one GET is not a
 * defence.
 *
 * So the two are separated, PASSIVE is the default, and INTRUSIVE requires the
 * user to assert authority over the domain and ideally to prove it.
 */

export type ScanMode = "passive" | "full";

export interface ScanAuthorisation {
  mode: ScanMode;
  /** The user has asserted they own or are authorised to test this domain. */
  attested: boolean;
  /** A DNS TXT proof was found, which is stronger than an assertion. */
  verified: boolean;
}

export const PASSIVE_DESCRIPTION =
  "Reads public DNS records, completes a TLS handshake, and fetches your homepage once. This is what any visitor's browser already does, and it is the same boundary CSA's Internet Hygiene Portal works within.";

export const INTRUSIVE_DESCRIPTION =
  "Additionally requests a short list of files that should never be public (.env, .git/config, database dumps). Finding one is an emergency because they contain credentials — but asking for them is a security test, not browsing, so only run it on a domain you control.";

/** The token an owner publishes to prove control of the domain. */
export function verificationToken(domain: string): string {
  // Deterministic so the user can re-read it later without us storing anything.
  // Not a secret: it proves control of DNS, which is the only thing it needs to do.
  let h = 2166136261;
  for (let i = 0; i < domain.length; i++) {
    h ^= domain.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const hex = (h >>> 0).toString(16).padStart(8, "0");
  return `ce-tool-verify=${hex}`;
}

export function verificationInstructions(domain: string): string[] {
  return [
    `Add a TXT record to ${domain}`,
    `Value: ${verificationToken(domain)}`,
    "Wait a few minutes for DNS to propagate, then re-check.",
    "You can delete the record once verified.",
  ];
}

/**
 * Whether the deeper checks may run.
 *
 * Verification is preferred, but an explicit attestation is accepted because an
 * SME whose DNS is managed by a vendor may genuinely be authorised and unable to
 * add a record today. The distinction is recorded either way, so the results tab
 * can show which basis was used.
 */
export function mayRunIntrusive(auth: ScanAuthorisation): boolean {
  return auth.mode === "full" && (auth.verified || auth.attested);
}

export const ATTESTATION_TEXT =
  "I own this domain, or I have written authorisation from its owner to test it.";
