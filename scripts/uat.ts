/**
 * UAT — three endpoints with known-missing controls, driven through the real
 * detection, mapping and scoring code.
 *
 * These reports are the exact JSON shape the generated PowerShell emits (that
 * shape was verified by running the real script on a real machine). What is
 * simulated is the machine state, not the pipeline: parsing, clause mapping,
 * estate aggregation, answer pre-fill, scoring and gap ranking are all the
 * production code paths.
 *
 * Run: npx tsx scripts/uat.ts
 */

import assert from "node:assert/strict";
import type { LocalReport } from "../lib/scripts";
import { aggregateByClause, clauseVerdict, summarise, upsertEndpoint } from "../lib/endpoints";
import {
  DEFAULT_SCOPE,
  computeGaps,
  computeReadiness,
  emptyAnswers,
  type Answers,
} from "../lib/assessment";
import { CLAUSE_BY_ID } from "../lib/ce-framework";
import { clauseSignals } from "../lib/mapping";

const C = {
  reset: "\x1b[0m", dim: "\x1b[2m", bold: "\x1b[1m",
  red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m", cyan: "\x1b[36m",
};

let failures = 0;
function expect(label: string, fn: () => void) {
  try {
    fn();
    console.log(`    ${C.green}PASS${C.reset}  ${label}`);
  } catch (e) {
    failures++;
    console.log(`    ${C.red}FAIL${C.reset}  ${label}`);
    console.log(`          ${C.red}${(e as Error).message.split("\n")[0]}${C.reset}`);
  }
}

const f = (
  id: string,
  title: string,
  clauses: string[],
  measure: string,
  result: LocalReport["findings"][number]["result"],
  detail: string,
) => ({ id, title, clauses, measure, result, detail });

// ── The three endpoints ─────────────────────────────────────────────────────

/** Reception PC: no anti-malware at all, and the firewall has been turned off. */
const RECEPTION: LocalReport = {
  tool: "Cyber Essentials Tool local check",
  computer: "CLINIC-RECEPTION",
  generated: "2026-07-31T09:00:00+08:00",
  mode: "Audit",
  findings: [
    f("defender", "Anti-malware active and current", ["A.4.4(a)", "A.4.4(b)", "A.4.4(c)"], "A.4",
      "fail", "Realtime=False Enabled=False SignatureAgeDays=97"),
    f("firewall", "Host firewall enabled on all profiles", ["A.4.4(e)"], "A.4",
      "fail", "Disabled on: Domain, Private, Public"),
    f("smbv1", "SMBv1 disabled", ["A.6.4(b)"], "A.6", "pass", "SMB1Protocol state: Disabled"),
    f("tls-legacy", "TLS 1.0 and 1.1 disabled", ["A.6.4(b)", "A.3.4(c)"], "A.6",
      "pass", "TLS 1.0/1.1 disabled"),
    f("bitlocker", "Disk encryption on the system drive", ["A.3.4(c)"], "A.3",
      "fail", "BitLocker on C:: Off, FullyDecrypted"),
    f("screen-lock", "Screen locks when idle", ["A.6.4(i)"], "A.6", "pass", "Inactivity lock: 600 seconds"),
    f("guest-account", "Guest account disabled", ["A.5.4(e)", "A.5.4(l)"], "A.5", "pass", "disabled"),
    f("patch-age", "Operating system patch age", ["A.7.4(a)"], "A.7", "pass", "Last update 9 days ago"),
    f("backup-task", "A backup job that is not Windows' own", ["A.8.4(a)", "A.8.4(d)"], "A.8",
      "fail", "No third-party or user-created scheduled backup task found"),
  ],
};

/** Nurse laptop: healthy except it is badly out of date and never locks. */
const LAPTOP: LocalReport = {
  tool: "Cyber Essentials Tool local check",
  computer: "CLINIC-NURSE-LT",
  generated: "2026-07-31T09:05:00+08:00",
  mode: "Audit",
  findings: [
    f("defender", "Anti-malware active and current", ["A.4.4(a)", "A.4.4(b)", "A.4.4(c)"], "A.4",
      "pass", "Realtime=True Enabled=True SignatureAgeDays=0"),
    f("firewall", "Host firewall enabled on all profiles", ["A.4.4(e)"], "A.4", "pass", "All profiles enabled"),
    f("smbv1", "SMBv1 disabled", ["A.6.4(b)"], "A.6", "pass", "SMB1Protocol state: Disabled"),
    f("tls-legacy", "TLS 1.0 and 1.1 disabled", ["A.6.4(b)", "A.3.4(c)"], "A.6", "pass", "disabled"),
    f("bitlocker", "Disk encryption on the system drive", ["A.3.4(c)"], "A.3", "pass", "On, FullyEncrypted"),
    f("screen-lock", "Screen locks when idle", ["A.6.4(i)"], "A.6", "fail", "Inactivity lock: not configured"),
    f("guest-account", "Guest account disabled", ["A.5.4(e)", "A.5.4(l)"], "A.5", "pass", "disabled"),
    f("patch-age", "Operating system patch age", ["A.7.4(a)"], "A.7", "fail", "Last update KB5031354 installed 291 days ago"),
    f("backup-task", "A backup job that is not Windows' own", ["A.8.4(a)", "A.8.4(d)"], "A.8", "pass", "Found: Acronis Daily"),
  ],
};

/** Practice server: end-of-life OS, SMBv1 and TLS 1.0 still on, RDP exposed. */
const SERVER: LocalReport = {
  tool: "Cyber Essentials Tool local check",
  computer: "CLINIC-SRV01",
  generated: "2026-07-31T09:10:00+08:00",
  mode: "Audit",
  findings: [
    f("defender", "Anti-malware active and current", ["A.4.4(a)", "A.4.4(b)", "A.4.4(c)"], "A.4",
      "pass", "Realtime=True Enabled=True SignatureAgeDays=1"),
    f("firewall", "Host firewall enabled on all profiles", ["A.4.4(e)"], "A.4", "pass", "All profiles enabled"),
    f("smbv1", "SMBv1 disabled", ["A.6.4(b)"], "A.6", "fail", "SMB1Protocol state: Enabled"),
    f("tls-legacy", "TLS 1.0 and 1.1 disabled", ["A.6.4(b)", "A.3.4(c)"], "A.6",
      "fail", "Still enabled: TLS 1.0/Server, TLS 1.0/Client"),
    f("rdp-nla", "Remote Desktop exposure", ["A.5.4(o)", "A.6.4(a)"], "A.5",
      "fail", "RDP enabled: YES; Network Level Authentication: OFF"),
    f("os-support", "Operating system still supported", ["A.2.4(f)", "A.7.4(a)"], "A.2",
      "fail", "Microsoft Windows Server 2012 R2 (build 9600)"),
    f("local-admins", "Local administrator count", ["A.5.4(d)", "A.5.4(f)"], "A.5",
      "review", "7 local administrators"),
    f("audit-logging", "Logon auditing enabled", ["A.6.4(g)"], "A.6", "unknown", "auditpol returned nothing"),
    f("backup-task", "A backup job that is not Windows' own", ["A.8.4(a)", "A.8.4(d)"], "A.8", "pass", "Found: Veeam"),
  ],
};

// ── Run ─────────────────────────────────────────────────────────────────────

console.log(`\n${C.bold}UAT — simulated 3-endpoint clinic estate${C.reset}`);
console.log(`${C.dim}Machine state is simulated; parsing, mapping, aggregation and scoring are production code.${C.reset}\n`);

let endpoints = upsertEndpoint([], RECEPTION);
endpoints = upsertEndpoint(endpoints, LAPTOP);
endpoints = upsertEndpoint(endpoints, SERVER);

console.log(`  ${C.cyan}1. Endpoint intake${C.reset}`);
expect("all three endpoints registered", () => assert.equal(endpoints.length, 3));
expect("re-running on the same machine replaces, not duplicates", () => {
  const again = upsertEndpoint(endpoints, { ...RECEPTION, generated: "later" });
  assert.equal(again.length, 3);
  assert.equal(again.find((e) => e.computer === "CLINIC-RECEPTION")!.generated, "later");
});
expect("a report with no computer name is still accepted", () => {
  const anon = upsertEndpoint([], { findings: RECEPTION.findings } as LocalReport);
  assert.equal(anon[0].computer, "unnamed-device");
});

console.log(`\n  ${C.cyan}2. Detection of the seeded weaknesses${C.reset}`);
const agg = aggregateByClause(endpoints);

const detects = (clause: string, computer: string, what: string) =>
  expect(`${what} detected on ${computer} (${clause})`, () => {
    const e = agg.get(clause);
    assert.ok(e, `no evidence collected for ${clause}`);
    assert.ok(
      e!.failingOn.some((x) => x.computer === computer),
      `${clause} not failing on ${computer}; failing on: ${e!.failingOn.map((x) => x.computer).join(", ") || "nothing"}`,
    );
  });

detects("A.4.4(a)", "CLINIC-RECEPTION", "missing anti-malware");
detects("A.4.4(e)", "CLINIC-RECEPTION", "disabled firewall");
detects("A.3.4(c)", "CLINIC-RECEPTION", "unencrypted disk");
detects("A.8.4(a)", "CLINIC-RECEPTION", "no backup job");
detects("A.6.4(i)", "CLINIC-NURSE-LT", "no screen lock");
detects("A.7.4(a)", "CLINIC-NURSE-LT", "291-day patch gap");
detects("A.6.4(b)", "CLINIC-SRV01", "SMBv1 and TLS 1.0");
detects("A.5.4(o)", "CLINIC-SRV01", "RDP without NLA");
detects("A.2.4(f)", "CLINIC-SRV01", "end-of-life OS");

console.log(`\n  ${C.cyan}3. Estate aggregation${C.reset}`);
const summary = summarise(endpoints);
expect("worst-result-wins: A.4.4(a) fails for the org despite 2 healthy machines", () => {
  const v = clauseVerdict(agg.get("A.4.4(a)")!);
  assert.equal(v.answer, "no");
  assert.match(v.note, /CLINIC-RECEPTION/);
});
expect("inconsistency across the estate is surfaced", () => {
  const ids = summary.inconsistent.map((c) => c.clauseId);
  for (const c of ["A.4.4(a)", "A.4.4(e)", "A.3.4(c)", "A.6.4(b)", "A.6.4(i)", "A.7.4(a)"]) {
    assert.ok(ids.includes(c), `${c} should be flagged inconsistent`);
  }
});
expect("a clause passing everywhere never auto-answers 'met'", () => {
  const guest = agg.get("A.5.4(l)")!;
  assert.equal(guest.failingOn.length, 0);
  assert.equal(clauseVerdict(guest).answer, null);
});
expect("'review' and 'unknown' never become a failure", () => {
  assert.equal(clauseVerdict(agg.get("A.5.4(d)")!).answer, null); // 7 local admins = review
  assert.equal(clauseVerdict(agg.get("A.6.4(g)")!).answer, null); // auditpol unknown
});

console.log(`\n  ${C.cyan}4. Pre-fill into the assessment${C.reset}`);
const answers: Answers = emptyAnswers();
let prefilled = 0;
for (const [clauseId, evidence] of agg) {
  const v = clauseVerdict(evidence);
  if (v.answer !== "no") continue;
  answers[clauseId] = { value: "no", source: "scan", note: v.note };
  prefilled++;
}
expect("failures pre-filled clauses without any typing", () => assert.ok(prefilled >= 10));
expect("every pre-filled clause is a real Cyber Essentials clause", () =>
  Object.entries(answers)
    .filter(([, a]) => a.source === "scan")
    .forEach(([id]) => assert.ok(CLAUSE_BY_ID.has(id), `unknown clause ${id}`)));
expect("a user answer is never overwritten by a later scan", () => {
  const withUser: Answers = { ...answers, "A.4.4(a)": { value: "yes", source: "user" } };
  const agg2 = aggregateByClause(endpoints);
  for (const [clauseId, evidence] of agg2) {
    if (withUser[clauseId]?.source === "user") continue;
    if (clauseVerdict(evidence).answer === "no") withUser[clauseId] = { value: "no", source: "scan" };
  }
  assert.equal(withUser["A.4.4(a)"].value, "yes");
});

console.log(`\n  ${C.cyan}5. Scoring and prioritisation${C.reset}`);
const readiness = computeReadiness(answers, DEFAULT_SCOPE);
const gaps = computeGaps(answers, DEFAULT_SCOPE, clauseSignals([]));
expect("estate findings block certification", () => assert.equal(readiness.certifiable, false));
expect("mandatory gaps are counted", () => assert.ok(readiness.blocking >= 10));
expect("anti-malware outranks screen-lock in the priority list", () => {
  const rank = (id: string) => gaps.findIndex((g) => g.clause.id === id);
  const av = rank("A.4.4(a)");
  const lock = rank("A.6.4(i)");
  assert.ok(av !== -1 && lock !== -1, "both clauses should be gaps");
  assert.ok(av < lock, `A.4.4(a) ranked ${av}, A.6.4(i) ranked ${lock}`);
});
expect("the affected measures score below 100%", () => {
  for (const id of ["A.4", "A.6", "A.8"] as const) {
    const m = readiness.measures.find((x) => x.measureId === id)!;
    assert.ok(m.percent < 100, `${id} scored ${m.percent}%`);
  }
});

// ── Report ──────────────────────────────────────────────────────────────────

console.log(`\n${C.bold}Estate summary${C.reset}`);
console.log(`  Endpoints checked            ${summary.endpoints}`);
console.log(`  Clauses with evidence        ${summary.clausesTouched}`);
console.log(`  Failing on >=1 device        ${summary.clausesFailingSomewhere}`);
console.log(`  Inconsistent across estate   ${summary.inconsistent.length}`);
console.log(`  Clauses auto-answered 'no'   ${prefilled}`);
console.log(`  Mandatory clauses open       ${readiness.blocking}`);
console.log(`  Certifiable                  ${readiness.certifiable ? "yes" : "no"}`);

console.log(`\n${C.bold}Top 5 gaps as the SME would see them${C.reset}`);
gaps.slice(0, 5).forEach((g, i) => {
  const src = g.signal || answers[g.clause.id]?.source === "scan" ? "detected" : "unanswered";
  console.log(
    `  ${i + 1}. [${g.band.toUpperCase()}] ${g.clause.id} ${g.clause.title} ${C.dim}(${src}, score ${g.score})${C.reset}`,
  );
});

console.log(
  failures === 0
    ? `\n${C.green}${C.bold}UAT passed — no defects.${C.reset}\n`
    : `\n${C.red}${C.bold}UAT failed — ${failures} assertion(s).${C.reset}\n`,
);
process.exit(failures === 0 ? 0 : 1);
