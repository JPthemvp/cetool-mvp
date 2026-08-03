/**
 * Sanity checks on the framework data and the scoring maths.
 * Run with: npm run check
 */

import assert from "node:assert/strict";
import {
  CLAUSES,
  MEASURES,
  CATEGORIES,
  CLAUSE_BY_ID,
  applicableClauses,
} from "../lib/ce-framework";
import { TRUST_DOMAINS, TIERS, domainsForTier, ceCoverageOfTier } from "../lib/ct-framework";
import {
  DEFAULT_SCOPE,
  buildResultRows,
  computeGaps,
  computeReadiness,
  emptyAnswers,
  toCsv,
} from "../lib/assessment";
import { MAPPINGS } from "../lib/mapping";
import { CLAUSE_HELP } from "../lib/readiness";
import { SECTORS, SECTOR_BY_ID } from "../lib/sectors";
import { recommendNextStep } from "../lib/providers";
import {
  CHECKS,
  buildAssessmentScript,
  buildBackupScript,
  parseLocalReport,
} from "../lib/scripts";
import { mayRunIntrusive, verificationToken } from "../lib/authorisation";
import {
  EXTERNALLY_REACHABLE,
  LOCALLY_REACHABLE,
  coverageByMeasure,
  coverageStats,
} from "../lib/coverage";
import { answerabilityOf, breakdown } from "../lib/answerability";
import { pathwayCoverage } from "../lib/pathways";
import { PLAIN_CHECK, PLAIN_MEASURE } from "../lib/plain";
import { UNIX_CHECKS, buildUnixScript } from "../lib/scripts-unix";
import { buildReport, reportFilename, reportToJson } from "../lib/report";
import { computeDrift } from "../lib/history";

let checks = 0;
const ok = (label: string, fn: () => void) => {
  fn();
  checks++;
  console.log(`  ok  ${label}`);
};

console.log("\nCyber Essentials framework");
ok("5 categories", () => assert.equal(CATEGORIES.length, 5));
ok("9 measures", () => assert.equal(MEASURES.length, 9));
ok("75 clauses", () => assert.equal(CLAUSES.length, 75));
ok("clause ids unique", () =>
  assert.equal(new Set(CLAUSES.map((c) => c.id)).size, CLAUSES.length));
ok("every clause belongs to a real measure", () =>
  CLAUSES.forEach((c) =>
    assert.ok(MEASURES.some((m) => m.id === c.measureId), `${c.id} -> ${c.measureId}`)));
ok("every measure belongs to a real category", () =>
  MEASURES.forEach((m) =>
    assert.ok(CATEGORIES.some((c) => c.id === m.category), m.id)));
ok("every clause has a question and evidence", () =>
  CLAUSES.forEach((c) => {
    assert.ok(c.question.length > 10, c.id);
    assert.ok(c.evidence.length > 0, c.id);
  }));

console.log("\nCyber Trust framework");
ok("22 domains", () => assert.equal(TRUST_DOMAINS.length, 22));
ok("domain numbers are 1..22", () =>
  assert.deepEqual(
    TRUST_DOMAINS.map((d) => d.n).sort((a, b) => a - b),
    Array.from({ length: 22 }, (_, i) => i + 1),
  ));
ok("tier domain counts match CSA Table 7", () =>
  TIERS.forEach((t) =>
    assert.equal(domainsForTier(t.id).length, t.domainCount, `${t.name}`)));
ok("8 domains are marked as Cyber Essentials measures", () =>
  assert.equal(TRUST_DOMAINS.filter((d) => d.ceMeasure).length, 8));
ok("Supporter tier is 8 of 10 covered by CE", () => {
  const c = ceCoverageOfTier("supporter");
  assert.equal(c.total, 10);
  assert.equal(c.covered, 8);
});
ok("every ceMeasure points at a real measure", () =>
  TRUST_DOMAINS.filter((d) => d.ceMeasure).forEach((d) =>
    assert.ok(MEASURES.some((m) => m.id === d.ceMeasure), String(d.n))));

console.log("\nMappings");
ok("every mapping targets real clauses", () =>
  MAPPINGS.forEach((m) =>
    m.clauseIds.forEach((id) =>
      assert.ok(CLAUSE_BY_ID.has(id), `${m.checkId} -> ${id}`))));

console.log("\nScope filtering");
ok("conditional clauses drop out of scope", () => {
  const full = applicableClauses({ mobile: true, byod: true, servers: true });
  const none = applicableClauses({ mobile: false, byod: false, servers: false });
  assert.equal(full.length, 75);
  assert.ok(none.length < full.length);
  assert.ok(none.every((c) => !c.conditional));
});

console.log("\nScoring");
ok("empty assessment is 0% and not certifiable", () => {
  const r = computeReadiness(emptyAnswers(), DEFAULT_SCOPE);
  assert.equal(r.completion, 0);
  assert.equal(r.certifiable, false);
  assert.ok(r.blocking > 0);
});
ok("all-yes assessment is certifiable", () => {
  const a = emptyAnswers();
  for (const k of Object.keys(a)) a[k] = { value: "yes", source: "user" };
  const r = computeReadiness(a, DEFAULT_SCOPE);
  assert.equal(r.completion, 100);
  assert.equal(r.blocking, 0);
  assert.equal(r.certifiable, true);
});
ok("one unmet mandatory clause blocks certification", () => {
  const a = emptyAnswers();
  for (const k of Object.keys(a)) a[k] = { value: "yes", source: "user" };
  a["A.8.4(g)"] = { value: "no", source: "user" }; // offline backups
  const r = computeReadiness(a, DEFAULT_SCOPE);
  assert.equal(r.blocking, 1);
  assert.equal(r.certifiable, false);
});
ok("unmet `should` clause does not block certification", () => {
  const a = emptyAnswers();
  for (const k of Object.keys(a)) a[k] = { value: "yes", source: "user" };
  a["A.8.4(i)"] = { value: "no", source: "user" }; // restore testing, a `should`
  const r = computeReadiness(a, DEFAULT_SCOPE);
  assert.equal(r.blocking, 0);
  assert.equal(r.certifiable, true);
});
ok("n/a is excluded from the denominator", () => {
  const a = emptyAnswers();
  for (const k of Object.keys(a)) a[k] = { value: "na", source: "user" };
  const r = computeReadiness(a, DEFAULT_SCOPE);
  assert.equal(r.blocking, 0);
  assert.equal(r.percent, 100);
});
ok("partial counts as half credit", () => {
  const a = emptyAnswers();
  for (const k of Object.keys(a)) a[k] = { value: "partial", source: "user" };
  const r = computeReadiness(a, DEFAULT_SCOPE);
  assert.equal(r.percent, 50);
});

console.log("\nResults export");
ok("one row per in-scope clause", () => {
  const rows = buildResultRows(emptyAnswers(), DEFAULT_SCOPE);
  assert.equal(rows.length, applicableClauses(DEFAULT_SCOPE).length);
});
ok("CSV escapes embedded quotes and commas", () => {
  const a = emptyAnswers();
  a["A.1.4(a)"] = {
    value: "yes",
    source: "user",
    evidenceRef: 'Register "2026", row 4, IT share',
  };
  const csv = toCsv(buildResultRows(a, DEFAULT_SCOPE), "Acme, Pte Ltd", "now");
  assert.ok(csv.includes('"Acme, Pte Ltd"'));
  assert.ok(csv.includes('"Register ""2026"", row 4, IT share"'));
  // Header + title block, then one line per clause.
  const lines = csv.split("\n");
  assert.equal(lines.length, 5 + applicableClauses(DEFAULT_SCOPE).length);
});
ok("CSV records answer provenance", () => {
  const a = emptyAnswers();
  a["A.6.4(b)"] = { value: "no", source: "scan" };
  const csv = toCsv(buildResultRows(a, DEFAULT_SCOPE), "Acme", "now");
  const row = csv.split("\n").find((l) => l.startsWith('"A.6.4(b)"'))!;
  assert.ok(row.includes('"Not met"'));
  assert.ok(row.includes('"Automated scan"'));
});

console.log("\nReadiness layer");
ok("every clause has an action item", () => {
  const missing = CLAUSES.filter((c) => !CLAUSE_HELP[c.id]).map((c) => c.id);
  assert.deepEqual(missing, [], `clauses with no action: ${missing.join(", ")}`);
});
ok("no action item points at a clause that does not exist", () =>
  Object.keys(CLAUSE_HELP).forEach((id) =>
    assert.ok(CLAUSE_BY_ID.has(id), `orphan action: ${id}`)));
ok("actions are imperative and substantial", () =>
  Object.entries(CLAUSE_HELP).forEach(([id, h]) => {
    assert.ok(h.action.length > 30, `${id} action too short`);
    assert.ok(!/^(you should|consider)/i.test(h.action), `${id} is not imperative`);
  }));
ok("jargon-heavy clauses carry a 'not sure' explainer", () => {
  // The ones where an SME most plausibly does not know the term at all.
  for (const id of [
    "A.2.4(a)", "A.3.4(c)", "A.4.4(a)", "A.4.4(e)", "A.5.4(l)",
    "A.5.4(o)", "A.6.4(a)", "A.6.4(g)", "A.7.4(a)", "A.8.4(g)", "A.9.4(a)",
  ]) {
    assert.ok(CLAUSE_HELP[id]?.notSure, `${id} needs a notSure explainer`);
  }
});

console.log("\nSectors");
ok("every sector obligation attaches to a real measure", () =>
  SECTORS.forEach((s) =>
    s.obligations.forEach((o) =>
      assert.ok(MEASURES.some((m) => m.id === o.measureId), `${s.id} -> ${o.measureId}`))));
ok("every sector has at least one source", () =>
  SECTORS.forEach((s) =>
    assert.ok(s.sources.length > 0 || s.id === "general", `${s.id} has no sources`)));
ok("healthcare carries the 2-hour MOH reporting duty", () => {
  const hc = SECTOR_BY_ID.get("healthcare-hia")!;
  const rule = hc.obligations.find((o) => /2 hours/i.test(o.title));
  assert.ok(rule, "HIA 2-hour report missing");
  assert.equal(rule!.measureId, "A.9");
  assert.equal(rule!.beyondCe, true);
});
ok("social service routes to NCSS funding", () => {
  const ss = SECTOR_BY_ID.get("social-service")!;
  assert.ok(ss.funding.some((f) => f.body === "NCSS"), "no NCSS funding route");
});
ok("every sector offers a funding route except CII", () =>
  SECTORS.forEach((s) =>
    assert.ok(s.funding.length > 0 || s.id === "cii", `${s.id} has no funding`)));

console.log("\nProvider routing");
ok("certification bodies are withheld until mandatory clauses are closed", () => {
  const mid = recommendNextStep({
    completion: 100, blocking: 3, criticalGaps: 0, hasInternalIt: true,
  });
  assert.notEqual(mid.step, "get-certified");
});
ok("certification is offered once complete and clean", () => {
  const done = recommendNextStep({
    completion: 100, blocking: 0, criticalGaps: 0, hasInternalIt: false,
  });
  assert.equal(done.step, "get-certified");
});
ok("a critical gap routes to CISOaaS", () => {
  const r = recommendNextStep({
    completion: 60, blocking: 4, criticalGaps: 1, hasInternalIt: true,
  });
  assert.equal(r.step, "get-help");
});
ok("no in-house IT lowers the threshold for recommending help", () => {
  const args = { completion: 50, blocking: 8, criticalGaps: 0 };
  assert.equal(recommendNextStep({ ...args, hasInternalIt: false }).step, "get-help");
  assert.equal(recommendNextStep({ ...args, hasInternalIt: true }).step, "keep-going");
});

console.log("\nAnswer semantics");
ok("'not sure' blocks certification but is not counted as met", () => {
  const a = emptyAnswers();
  for (const k of Object.keys(a)) a[k] = { value: "yes", source: "user" };
  a["A.8.4(g)"] = { value: "unsure", source: "user" };
  const r = computeReadiness(a, DEFAULT_SCOPE);
  assert.equal(r.blocking, 1);
  assert.equal(r.certifiable, false);
  assert.equal(r.completion, 100, "unsure still counts as answered");
});

console.log("\nLocal toolkit");
ok("every script check maps to real clauses", () =>
  CHECKS.forEach((c) =>
    c.clauseIds.forEach((id) =>
      assert.ok(CLAUSE_BY_ID.has(id), `${c.id} -> ${id}`))));
ok("audit-only checks declare no remediation", () =>
  CHECKS.filter((c) => !c.remediate).forEach((c) =>
    assert.ok(!c.rollback, `${c.id} has rollback but no remediation`)));
ok("every remediation ships a rollback", () =>
  CHECKS.filter((c) => c.remediate).forEach((c) =>
    assert.ok(c.rollback && c.rollback.length > 0, `${c.id} changes state with no way back`)));
ok("disruptive changes carry a caution", () =>
  CHECKS.filter((c) => c.risk === "disruptive").forEach((c) =>
    assert.ok(c.caution, `${c.id} is disruptive but has no caution`)));
ok("generated script is pure ASCII", () => {
  const s = buildAssessmentScript({
    selected: CHECKS.map((c) => c.id), includeRemediation: true, org: "Tést Pte Ltd — Ø",
  });
  const bad = [...s].filter((ch) => ch.charCodeAt(0) > 126 && ch !== "\r" && ch !== "\n");
  assert.deepEqual(bad, [], `non-ASCII leaked: ${bad.join("")}`);
});
ok("backup script is pure ASCII and warns about isolation", () => {
  const s = buildBackupScript({ source: "C:\\Data", destination: "D:\\B", time: "22:00" });
  assert.deepEqual([...s].filter((c) => c.charCodeAt(0) > 126 && c !== "\r" && c !== "\n"), []);
  assert.ok(/A\.8\.4\(g\)/.test(s), "must warn that it does not satisfy A.8.4(g)");
});
ok("audit mode is the default and remediation is opt-in", () => {
  const s = buildAssessmentScript({ selected: CHECKS.map((c) => c.id), includeRemediation: false });
  assert.ok(/\$Mode = 'Audit'/.test(s));
  assert.ok(!/Mode -eq 'Remediate' -and/.test(s), "remediation branch leaked when not requested");
});
ok("remediation writes rollback before applying", () => {
  const s = buildAssessmentScript({ selected: ["autorun"], includeRemediation: true });
  const rollbackAt = s.indexOf("Add-Content $rollbackFile");
  const applyAt = s.indexOf("NoDriveTypeAutoRun -Value 255");
  assert.ok(rollbackAt > 0 && applyAt > rollbackAt, "change applied before rollback captured");
});
ok("path is resolved at runtime, not in the param block", () => {
  const s = buildAssessmentScript({ selected: ["autorun"], includeRemediation: false });
  assert.ok(!/\$OutFile = "\$PSScriptRoot/.test(s), "PSScriptRoot is empty during param binding");
  assert.ok(/\$scriptDir = if \(\$PSScriptRoot\)/.test(s));
});
ok("a pasted report only pre-fills from failures", () => {
  const { report } = parseLocalReport(JSON.stringify({
    computer: "PC1",
    findings: [
      { id: "a", title: "t", clauses: ["A.6.4(b)"], measure: "A.6", result: "pass", detail: "" },
      { id: "b", title: "t", clauses: ["A.6.4(c)"], measure: "A.6", result: "fail", detail: "" },
    ],
  }));
  assert.ok(report);
  assert.equal(report!.findings.filter((f) => f.result === "fail").length, 1);
});
ok("malformed paste is rejected with a message", () => {
  assert.ok(parseLocalReport("not json").error);
  assert.ok(parseLocalReport('{"nope":1}').error);
});

console.log("\nAuthorisation boundary");
ok("passive is the default", () => {
  const auth = { mode: "passive" as const, attested: false, verified: false };
  assert.equal(mayRunIntrusive(auth), false);
});
ok("intrusive checks need attestation or verification", () => {
  assert.equal(mayRunIntrusive({ mode: "full", attested: false, verified: false }), false);
  assert.equal(mayRunIntrusive({ mode: "full", attested: true, verified: false }), true);
  assert.equal(mayRunIntrusive({ mode: "full", attested: false, verified: true }), true);
});
ok("attestation on a passive scan never unlocks probes", () =>
  assert.equal(mayRunIntrusive({ mode: "passive", attested: true, verified: true }), false));
ok("verification token is stable per domain and differs across domains", () => {
  assert.equal(verificationToken("acme.com.sg"), verificationToken("acme.com.sg"));
  assert.notEqual(verificationToken("acme.com.sg"), verificationToken("other.com.sg"));
});

console.log("\nCoverage honesty");
ok("the advertised coverage matches the mapping tables", () => {
  const c = coverageStats();
  assert.equal(c.total, CLAUSES.length);
  assert.equal(c.automatable + c.selfDeclared, c.total);
  // Guards the UI claim of "roughly a third". If mappings grow, update the copy.
  assert.ok(c.percentAutomatable >= 25 && c.percentAutomatable <= 45,
    `coverage is ${c.percentAutomatable}% — the "roughly a third" copy needs updating`);
});
ok("incident response has no automated signal, and we say so", () => {
  const a9 = coverageByMeasure().find((m) => m.measureId === "A.9")!;
  assert.equal(a9.automatable, 0);
});

console.log("\nDrift detection");
const snap = (at: string, statuses: Record<string, string>, hosts: string[] = []) =>
  ({ at, domain: "d", statuses, hosts }) as never;
ok("a single scan produces no drift", () =>
  assert.deepEqual(computeDrift([snap("t1", { a: "pass" })]), []));
ok("pass to fail is a regression", () => {
  const d = computeDrift([snap("t2", { a: "fail" }), snap("t1", { a: "pass" })]);
  assert.equal(d.length, 1);
  assert.equal(d[0].kind, "regressed");
});
ok("fail to pass is an improvement", () => {
  const d = computeDrift([snap("t2", { a: "pass" }), snap("t1", { a: "fail" })]);
  assert.equal(d[0].kind, "improved");
});
ok("an unchanged check produces nothing", () =>
  assert.deepEqual(computeDrift([snap("t2", { a: "pass" }), snap("t1", { a: "pass" })]), []));
ok("a check that vanishes is not reported as drift", () => {
  // A timed-out scan must not look like a fixed problem.
  const d = computeDrift([snap("t2", {}), snap("t1", { a: "fail" })]);
  assert.deepEqual(d, []);
});
ok("a new certified hostname is flagged", () => {
  const d = computeDrift([snap("t2", {}, ["new.d"]), snap("t1", {}, [])]);
  assert.equal(d[0].kind, "new-host");
});

console.log("\nPathways");
ok("every clause is classified, defaulting to human", () =>
  CLAUSES.forEach((c) =>
    assert.ok(["machine", "mixed", "human"].includes(answerabilityOf(c.id)), c.id)));
ok("people and process measures are never claimed as automatable", () => {
  // A.1 training and A.9 incident response cannot be read off a machine.
  for (const c of CLAUSES.filter((x) => x.measureId === "A.1" || x.measureId === "A.9")) {
    assert.equal(answerabilityOf(c.id), "human", `${c.id} must stay human-answerable`);
  }
});
ok("backup isolation and restore testing stay human", () => {
  // The two clauses that most often fail at audit; a running job proves neither.
  assert.equal(answerabilityOf("A.8.4(g)"), "human");
  assert.equal(answerabilityOf("A.8.4(i)"), "human");
});
ok("the agent pathway assists strictly more than self-assessment", () => {
  const self = pathwayCoverage("self-assess");
  const agent = pathwayCoverage("agent-assisted");
  assert.ok(agent.percentAssisted > self.percentAssisted);
  assert.ok(agent.toAnswer < self.toAnswer);
});
ok("neither pathway claims to answer everything", () => {
  for (const id of ["self-assess", "agent-assisted"] as const) {
    const c = pathwayCoverage(id);
    assert.ok(c.toAnswer > 0, `${id} claims nothing is left for the user`);
    assert.equal(c.preAnswered + c.evidenced + c.toAnswer, c.total);
  }
});
ok("a 'mixed' clause is never counted as pre-answered", () => {
  const agent = pathwayCoverage("agent-assisted");
  const machineAndReachable = CLAUSES.filter(
    (c) =>
      answerabilityOf(c.id) === "machine" &&
      (EXTERNALLY_REACHABLE.has(c.id) || LOCALLY_REACHABLE.has(c.id)),
  ).length;
  assert.equal(agent.preAnswered, machineAndReachable);
});
ok("the majority of clauses remain people and process", () => {
  const b = breakdown();
  assert.ok(b.human > b.machine + b.mixed,
    `human ${b.human} vs assisted ${b.machine + b.mixed} — the pathway copy assumes people dominate`);
});

console.log("\nPlain language");
ok("every measure has a layman name with no clause codes", () =>
  MEASURES.forEach((m) => {
    const p = PLAIN_MEASURE[m.id];
    assert.ok(p, `${m.id} has no plain name`);
    assert.ok(!/A\.\d/.test(p.name + p.blurb), `${m.id} plain text leaks a clause code`);
  }));
ok("plain wording avoids the jargon it exists to replace", () => {
  const banned = /\b(SPF|DKIM|DMARC|TLS|HSTS|CSP|HTTPS|DNS|CAA)\b/;
  for (const [id, entry] of Object.entries(PLAIN_CHECK)) {
    for (const variant of [entry.pass, entry.fail]) {
      assert.ok(
        !banned.test(variant.title + " " + variant.detail),
        `${id} plain wording still contains protocol jargon`,
      );
    }
  }
});
ok("every scan check that can surface has plain wording", () => {
  const missing = MAPPINGS.map((m) => m.checkId).filter((id) => !PLAIN_CHECK[id]);
  assert.deepEqual(missing, [], `no layman wording for: ${missing.join(", ")}`);
});

console.log("\nUnix checks");
ok("every unix check maps to real clauses", () =>
  UNIX_CHECKS.forEach((c) =>
    c.clauseIds.forEach((id) =>
      assert.ok(CLAUSE_BY_ID.has(id), `${c.id} -> ${id}`))));
ok("the generated shell script is pure ASCII", () => {
  const s = buildUnixScript({ selected: UNIX_CHECKS.map((c) => c.id), org: "Tést — Ø" });
  const bad = [...s].filter((ch) => ch.charCodeAt(0) > 126 && ch !== "\n" && ch !== "\t");
  assert.deepEqual(bad, [], `non-ASCII leaked: ${bad.join("")}`);
});
ok("the shell script contains no state-changing commands", () => {
  const s = buildUnixScript({ selected: UNIX_CHECKS.map((c) => c.id) });
  // Assert on what it does, not on the word "remediate" — the header explains
  // at length that there is no remediate mode, so a word match is meaningless.
  const mutations = [
    /\bdefaults\s+write\b/,
    /\bcsrutil\s+(enable|disable)\b/,
    /\bsystemctl\s+(enable|disable|start|stop)\b/,
    /\bufw\s+(enable|disable)\b/,
    /\bfdesetup\s+(enable|disable)\b/,
    /\bspctl\s+--master-(enable|disable)\b/,
    /\b(rm|mv|chmod|chown)\s+-/,
    /\bapt-get\s+(install|upgrade)\b(?!.*-s)/,
  ];
  for (const m of mutations) {
    assert.ok(!m.test(s), `shell script contains a state-changing command: ${m}`);
  }
  assert.ok(/READ ONLY/.test(s));
});
ok("platform-specific checks still emit a finding on the other platform", () => {
  const s = buildUnixScript({ selected: ["guest-account"] });
  assert.ok(/RESULT=na/.test(s), "a skipped check must report 'na', not vanish");
});

console.log("\nCertification report");
{
  const answers = emptyAnswers();
  for (const k of Object.keys(answers)) answers[k] = { value: "yes", source: "user" };
  answers["A.6.4(b)"] = { value: "no", source: "scan" };
  const readiness = computeReadiness(answers, DEFAULT_SCOPE);
  const report = buildReport({
    org: { name: "Acme Pte Ltd", uen: "1", industry: "IT", size: "10", sector: "general", scoping: {} },
    scope: DEFAULT_SCOPE,
    pathway: "agent-assisted",
    answers,
    readiness,
    gaps: computeGaps(answers, DEFAULT_SCOPE, new Map()),
    scan: null,
    endpoints: [],
  });

  ok("the report covers every in-scope clause", () =>
    assert.equal(report.clauses.length, applicableClauses(DEFAULT_SCOPE).length));
  ok("every clause row records how it was answered", () =>
    report.clauses.forEach((c) =>
      assert.ok(c.provenance.length > 0, `${c.clauseId} has no provenance`)));
  ok("a scan-sourced answer is not labelled self-declared", () => {
    const row = report.clauses.find((c) => c.clauseId === "A.6.4(b)")!;
    assert.notEqual(row.provenance, "Self-declared");
  });
  ok("the report states what automation could not reach", () =>
    assert.ok(report.provenance.automationCoverage.clausesSelfDeclaredOnly > 0));
  ok("JSON export is valid and round-trips", () => {
    const parsed = JSON.parse(reportToJson(report));
    assert.equal(parsed.schema, "1.0");
    assert.equal(parsed.clauses.length, report.clauses.length);
  });
  ok("filenames are filesystem-safe", () =>
    assert.match(reportFilename("Acme Pte Ltd / Ünït 3", "xlsx"), /^[a-z0-9.\-]+$/));
}

console.log(`\n${checks} checks passed\n`);
