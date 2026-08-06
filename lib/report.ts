/**
 * The certification hand-off pack.
 *
 * One canonical object, two renderings. JSON is for a certification body that
 * wants to ingest the submission rather than re-key it; XLSX is for the human
 * assessor who will actually read it, and for the SME who wants something it can
 * file.
 *
 * The design constraint that matters: an assessor's first question about any
 * automated assessment is "how do you know?". So every clause row carries its
 * provenance — self-declared, answered by an external scan, or answered by a
 * check on a named device — and the evidence sheet lists exactly what ran, when,
 * and against what. A submission that cannot answer that question is worth less
 * than a spreadsheet somebody typed by hand.
 */

import {
  ANSWER_LABEL,
  buildResultRows,
  type Answers,
  type ResultRow,
  type Scope,
} from "./assessment";
import { MEASURE_BY_ID } from "./ce-framework";
import { answerabilityOf } from "./answerability";
import { coverageStats } from "./coverage";
import { PATHWAY_BY_ID, pathwayCoverage, type PathwayId } from "./pathways";
import { SECTOR_BY_ID, type SectorId } from "./sectors";
import { ceCoverageOfTier } from "./ct-framework";
import { helpFor } from "./readiness";
import type { EndpointResult } from "./endpoints";
import type { ScanResult } from "./scan";
import type { Gap } from "./risk";
import type { Readiness } from "./assessment";

export const REPORT_SCHEMA_VERSION = "1.0";

export interface ReportInput {
  org: {
    name: string;
    uen: string;
    industry: string;
    size: string;
    sector: SectorId;
    scoping: Record<string, string>;
  };
  scope: Scope;
  pathway: PathwayId;
  answers: Answers;
  readiness: Readiness;
  gaps: Gap[];
  scan: ScanResult | null;
  endpoints: EndpointResult[];
}

export interface ReportClauseRow extends ResultRow {
  /** self-declared | external-scan | device-check */
  provenance: string;
  /** Which device answered it, when a device did. */
  provenanceDetail: string;
  answerableBy: string;
  action: string;
}

export interface CertificationReport {
  schema: string;
  tool: string;
  generatedAt: string;
  organisation: ReportInput["org"] & { scopeDeclared: string[] };
  assessment: {
    framework: string;
    frameworkVersion: string;
    pathway: string;
    clausesInScope: number;
    completionPercent: number;
    weightedScorePercent: number;
    mandatoryTotal: number;
    mandatoryUnmet: number;
    readyToSubmit: boolean;
    verdict: string;
  };
  provenance: {
    externalScan: {
      domain: string;
      scannedAt: string;
      mode: string;
      authorisedBy: string;
      resolvedVia: string;
      checksRun: number;
      failing: number;
      hostsDiscovered: number;
    } | null;
    deviceChecks: Array<{ computer: string; generated: string; checks: number; failing: number }>;
    automationCoverage: {
      clausesWithAutomatedSignal: number;
      clausesSelfDeclaredOnly: number;
      note: string;
    };
  };
  measures: Array<{
    id: string;
    name: string;
    clauses: number;
    met: number;
    partial: number;
    notMet: number;
    notSure: number;
    notApplicable: number;
    mandatoryUnmet: number;
    percent: number;
  }>;
  clauses: ReportClauseRow[];
  gaps: Array<{
    clause: string;
    requirement: string;
    measure: string;
    band: string;
    blocksCertification: boolean;
    effort: string;
    action: string;
  }>;
  sectorObligations: Array<{
    regulator: string;
    measure: string;
    title: string;
    detail: string;
    beyondCyberEssentials: boolean;
  }>;
  cyberTrust: { tier: string; domainsTotal: number; domainsCoveredByCe: number };
}

function provenanceOf(
  row: ResultRow,
  endpoints: EndpointResult[],
): { provenance: string; detail: string } {
  if (row.source === "user") return { provenance: "Self-declared", detail: "" };
  if (row.source !== "scan") return { provenance: "Not answered", detail: "" };

  // A scan-sourced answer came either from the external scan or from a device.
  const devices = endpoints
    .filter((e) => e.findings.some((f) => (f.clauses ?? []).includes(row.clauseId)))
    .map((e) => e.computer);

  return devices.length
    ? { provenance: "Device check", detail: devices.join(", ") }
    : { provenance: "External scan", detail: "Internet-facing estate" };
}

export function buildReport(input: ReportInput): CertificationReport {
  const { org, scope, pathway, answers, readiness, gaps, scan, endpoints } = input;
  const rows = buildResultRows(answers, scope);
  const cov = coverageStats();
  const pcov = pathwayCoverage(pathway);
  const sector = SECTOR_BY_ID.get(org.sector);
  const supporter = ceCoverageOfTier("supporter");

  const scopeDeclared = Object.entries(scope)
    .filter(([, on]) => on)
    .map(([k]) => k);

  const clauses: ReportClauseRow[] = rows.map((r) => {
    const p = provenanceOf(r, endpoints);
    return {
      ...r,
      provenance: p.provenance,
      provenanceDetail: p.detail,
      answerableBy: answerabilityOf(r.clauseId),
      action: helpFor(r.clauseId)?.action ?? "",
    };
  });

  return {
    schema: REPORT_SCHEMA_VERSION,
    tool: "Cyber Essentials Tool",
    generatedAt: new Date().toISOString(),
    organisation: { ...org, scopeDeclared },
    assessment: {
      framework: "CSA Cyber Essentials mark",
      frameworkVersion: "V202503 (expanded 15 Apr 2025)",
      pathway: PATHWAY_BY_ID.get(pathway)?.name ?? pathway,
      clausesInScope: rows.length,
      completionPercent: readiness.completion,
      weightedScorePercent: readiness.percent,
      mandatoryTotal: cov.mandatoryTotal,
      mandatoryUnmet: readiness.blocking,
      readyToSubmit: readiness.certifiable,
      verdict: readiness.verdict,
    },
    provenance: {
      externalScan: scan?.reachable
        ? {
            domain: scan.domain,
            scannedAt: scan.scannedAt,
            mode: scan.mode,
            authorisedBy: scan.authorisedBy ?? "not required (passive)",
            resolvedVia: scan.resolvedVia ?? "unknown",
            checksRun: scan.findings.length,
            failing: scan.findings.filter((f) => f.status === "fail").length,
            hostsDiscovered: scan.discovered?.length ?? 0,
          }
        : null,
      deviceChecks: endpoints.map((e) => ({
        computer: e.computer,
        generated: e.generated ?? "",
        checks: e.findings.length,
        failing: e.findings.filter((f) => f.result === "fail").length,
      })),
      automationCoverage: {
        clausesWithAutomatedSignal: pcov.preAnswered + pcov.evidenced,
        clausesSelfDeclaredOnly: pcov.toAnswer,
        note: "Automated checks cannot observe training, approvals, incident planning or restore testing. Those clauses are self-declared by design, not by omission.",
      },
    },
    measures: readiness.measures.map((m) => ({
      id: m.measureId,
      name: MEASURE_BY_ID.get(m.measureId)?.name ?? m.measureId,
      clauses: m.total,
      met: m.met,
      partial: m.partial,
      notMet: m.notMet,
      notSure: m.unsure,
      notApplicable: m.na,
      mandatoryUnmet: m.blocking,
      percent: m.percent,
    })),
    clauses,
    gaps: gaps.map((g) => ({
      clause: g.clause.id,
      requirement: g.clause.title,
      measure: g.measureName,
      band: g.band,
      blocksCertification: g.blocksCertification,
      effort: g.effort,
      action: helpFor(g.clause.id)?.action ?? "",
    })),
    sectorObligations: (sector?.obligations ?? []).map((o) => ({
      regulator: sector?.regulator ?? "",
      measure: o.measureId,
      title: o.title,
      detail: o.detail,
      beyondCyberEssentials: o.beyondCe,
    })),
    cyberTrust: {
      tier: "Supporter",
      domainsTotal: supporter.total,
      domainsCoveredByCe: supporter.covered,
    },
  };
}

export function reportToJson(report: CertificationReport): string {
  return JSON.stringify(report, null, 2);
}

// ── XLSX ────────────────────────────────────────────────────────────────────

const HEADER_FILL = "FF004987"; // CSA brand blue
const ACCENT = "FFE31736"; // CSA red

/**
 * Build the workbook. ExcelJS is imported dynamically so ~1MB of library only
 * loads when someone actually exports, rather than on every page view.
 */
export async function reportToXlsx(report: CertificationReport): Promise<Blob> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Cyber Essentials Tool";
  wb.created = new Date();

  const styleHeader = (row: import("exceljs").Row) => {
    row.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    row.alignment = { vertical: "middle" };
    row.height = 22;
  };

  // ── Cover ────────────────────────────────────────────────────────────────
  const cover = wb.addWorksheet("Summary");
  cover.columns = [{ width: 32 }, { width: 78 }];

  const title = cover.addRow(["Cyber Essentials mark", "Self-assessment submission"]);
  title.font = { bold: true, size: 14 };
  title.getCell(2).font = { bold: true, size: 14, color: { argb: ACCENT } };
  cover.addRow([]);

  const facts: Array<[string, string | number | boolean]> = [
    ["Organisation", report.organisation.name || "Not stated"],
    ["UEN", report.organisation.uen || "Not stated"],
    ["Industry", report.organisation.industry || "Not stated"],
    ["Headcount", report.organisation.size || "Not stated"],
    ["Sector", SECTOR_BY_ID.get(report.organisation.sector)?.name ?? "General"],
    ["", ""],
    ["Framework", report.assessment.framework],
    ["Framework version", report.assessment.frameworkVersion],
    ["Assessment pathway", report.assessment.pathway],
    ["Scope declared", report.organisation.scopeDeclared.join(", ") || "Not stated"],
    ["", ""],
    ["Clauses in scope", report.assessment.clausesInScope],
    ["Clauses answered", `${report.assessment.completionPercent}%`],
    ["Weighted score", `${report.assessment.weightedScorePercent}%`],
    ["Mandatory clauses", report.assessment.mandatoryTotal],
    ["Mandatory unmet", report.assessment.mandatoryUnmet],
    ["Ready to submit", report.assessment.readyToSubmit ? "YES" : "NO"],
    ["", ""],
    ["Generated", report.generatedAt],
    ["Report schema", report.schema],
  ];

  for (const [k, v] of facts) {
    const r = cover.addRow([k, v]);
    r.getCell(1).font = { bold: true };
    if (k === "Ready to submit") {
      r.getCell(2).font = {
        bold: true,
        color: { argb: report.assessment.readyToSubmit ? "FF157F3D" : ACCENT },
      };
    }
  }

  cover.addRow([]);
  const verdict = cover.addRow(["Verdict", report.assessment.verdict]);
  verdict.getCell(1).font = { bold: true };
  verdict.getCell(2).alignment = { wrapText: true, vertical: "top" };

  cover.addRow([]);
  const caveat = cover.addRow([
    "How to read this",
    "Every clause below records how it was answered. 'Self-declared' means the organisation asserts it; " +
      "'External scan' means it was observed from the internet; 'Device check' means a read-only check ran on the " +
      "named machine. Automated checks cannot observe training, approvals, incident planning or restore testing — " +
      "those clauses are self-declared by design.",
  ]);
  caveat.getCell(1).font = { bold: true };
  caveat.getCell(2).alignment = { wrapText: true, vertical: "top" };
  caveat.height = 58;

  // ── Results ──────────────────────────────────────────────────────────────
  const results = wb.addWorksheet("Results");
  results.columns = [
    { header: "Clause", key: "clause", width: 12 },
    { header: "Measure", key: "measure", width: 34 },
    { header: "Requirement", key: "req", width: 44 },
    { header: "Type", key: "type", width: 10 },
    { header: "Status", key: "status", width: 20 },
    { header: "Answered by", key: "prov", width: 16 },
    { header: "Source detail", key: "provDetail", width: 24 },
    { header: "Evidence reference", key: "evidence", width: 34 },
    { header: "Remarks", key: "remarks", width: 34 },
  ];
  styleHeader(results.getRow(1));
  results.views = [{ state: "frozen", ySplit: 1 }];

  for (const c of report.clauses) {
    const row = results.addRow({
      clause: c.clauseId,
      measure: c.measureName,
      req: c.requirement,
      type: c.obligation === "shall" ? "Mandatory" : "Advisory",
      status: ANSWER_LABEL[c.answer],
      prov: c.provenance,
      provDetail: c.provenanceDetail,
      evidence: c.evidenceRef,
      remarks: c.remarks,
    });
    row.alignment = { wrapText: true, vertical: "top" };
    if (c.obligation === "shall" && c.answer !== "yes" && c.answer !== "na") {
      row.getCell("status").font = { bold: true, color: { argb: ACCENT } };
    } else if (c.answer === "yes") {
      row.getCell("status").font = { color: { argb: "FF157F3D" } };
    }
  }
  results.autoFilter = { from: "A1", to: { row: 1, column: 9 } };

  // ── Measures ─────────────────────────────────────────────────────────────
  const measures = wb.addWorksheet("By measure");
  measures.columns = [
    { header: "Measure", key: "id", width: 10 },
    { header: "Name", key: "name", width: 40 },
    { header: "Clauses", key: "clauses", width: 10 },
    { header: "Met", key: "met", width: 8 },
    { header: "Partial", key: "partial", width: 9 },
    { header: "Not met", key: "notMet", width: 10 },
    { header: "Not sure", key: "notSure", width: 10 },
    { header: "N/A", key: "na", width: 8 },
    { header: "Mandatory unmet", key: "blocking", width: 17 },
    { header: "Score", key: "percent", width: 9 },
  ];
  styleHeader(measures.getRow(1));
  for (const m of report.measures) {
    const row = measures.addRow({
      id: m.id,
      name: m.name,
      clauses: m.clauses,
      met: m.met,
      partial: m.partial,
      notMet: m.notMet,
      notSure: m.notSure,
      na: m.notApplicable,
      blocking: m.mandatoryUnmet,
      percent: `${m.percent}%`,
    });
    if (m.mandatoryUnmet > 0) row.getCell("blocking").font = { bold: true, color: { argb: ACCENT } };
  }

  // ── Evidence ─────────────────────────────────────────────────────────────
  const evidence = wb.addWorksheet("Evidence log");
  evidence.columns = [{ width: 26 }, { width: 70 }];
  const eh = evidence.addRow(["What ran", "Detail"]);
  styleHeader(eh);

  if (report.provenance.externalScan) {
    const s = report.provenance.externalScan;
    evidence.addRow(["External scan — domain", s.domain]);
    evidence.addRow(["External scan — run at", s.scannedAt]);
    evidence.addRow(["External scan — mode", s.mode]);
    evidence.addRow(["External scan — authorised by", s.authorisedBy]);
    evidence.addRow(["External scan — DNS via", s.resolvedVia]);
    evidence.addRow(["External scan — checks run", `${s.checksRun} (${s.failing} failing)`]);
    evidence.addRow(["Hostnames discovered", String(s.hostsDiscovered)]);
  } else {
    evidence.addRow(["External scan", "Not run"]);
  }

  evidence.addRow([]);
  if (report.provenance.deviceChecks.length) {
    for (const d of report.provenance.deviceChecks) {
      evidence.addRow([`Device — ${d.computer}`, `${d.checks} checks, ${d.failing} failing, run ${d.generated}`]);
    }
  } else {
    evidence.addRow(["Device checks", "None submitted"]);
  }

  evidence.addRow([]);
  const a = report.provenance.automationCoverage;
  evidence.addRow(["Clauses with automated signal", String(a.clausesWithAutomatedSignal)]);
  evidence.addRow(["Clauses self-declared only", String(a.clausesSelfDeclaredOnly)]);
  const noteRow = evidence.addRow(["Note", a.note]);
  noteRow.getCell(2).alignment = { wrapText: true, vertical: "top" };
  noteRow.height = 44;

  // ── Action plan ──────────────────────────────────────────────────────────
  const actions = wb.addWorksheet("Action plan");
  actions.columns = [
    { header: "Priority", key: "n", width: 9 },
    { header: "Clause", key: "clause", width: 12 },
    { header: "Requirement", key: "req", width: 40 },
    { header: "Risk", key: "band", width: 11 },
    { header: "Blocks certification", key: "blocks", width: 19 },
    { header: "Effort", key: "effort", width: 12 },
    { header: "What to do", key: "action", width: 76 },
  ];
  styleHeader(actions.getRow(1));
  actions.views = [{ state: "frozen", ySplit: 1 }];
  report.gaps.forEach((g, i) => {
    const row = actions.addRow({
      n: i + 1,
      clause: g.clause,
      req: g.requirement,
      band: g.band,
      blocks: g.blocksCertification ? "YES" : "no",
      effort: g.effort,
      action: g.action,
    });
    row.alignment = { wrapText: true, vertical: "top" };
    if (g.blocksCertification) row.getCell("blocks").font = { bold: true, color: { argb: ACCENT } };
  });

  // ── Sector obligations ───────────────────────────────────────────────────
  if (report.sectorObligations.length) {
    const sec = wb.addWorksheet("Sector obligations");
    sec.columns = [
      { header: "Regulator", key: "reg", width: 26 },
      { header: "Measure", key: "measure", width: 10 },
      { header: "Obligation", key: "title", width: 44 },
      { header: "Beyond Cyber Essentials", key: "beyond", width: 22 },
      { header: "Detail", key: "detail", width: 86 },
    ];
    styleHeader(sec.getRow(1));
    for (const o of report.sectorObligations) {
      const row = sec.addRow({
        reg: o.regulator,
        measure: o.measure,
        title: o.title,
        beyond: o.beyondCyberEssentials ? "YES" : "no",
        detail: o.detail,
      });
      row.alignment = { wrapText: true, vertical: "top" };
    }
  }

  // ── CSA Appendix templates ───────────────────────────────────────────────
  // Source: CSA Cybersecurity Toolkit for IT Teams — Appendices
  // https://isomer-user-content.by.gov.sg/36/744568da-0801-4cb5-a2b2-f54615ceed10/Cybersecurity-Toolkit-for-IT-Team-Appendices.pdf

  const TEMPLATE_NOTE =
    "Template adapted from CSA's Cybersecurity Toolkit for IT Teams (Appendices). " +
    "Fill in your organisation's actual assets below the header row.";
  const TEMPLATE_FILL = "FFEFF6FF"; // light blue tint for data rows

  function addTemplateSheet(
    name: string,
    appendixRef: string,
    cols: Array<{ header: string; width: number }>,
    sampleRows: number = 5,
  ) {
    const ws = wb.addWorksheet(name);
    ws.columns = cols.map((c) => ({ header: c.header, width: c.width }));
    styleHeader(ws.getRow(1));

    // 5 blank input rows with light tint
    for (let i = 0; i < sampleRows; i++) {
      const r = ws.addRow(cols.map(() => ""));
      r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEMPLATE_FILL } };
      r.height = 18;
    }

    // Source / disclaimer note
    ws.addRow([]);
    const noteRow = ws.addRow([`${appendixRef} — ${TEMPLATE_NOTE}`]);
    noteRow.getCell(1).font = { italic: true, color: { argb: "FF6B7280" }, size: 9 };
    noteRow.getCell(1).alignment = { wrapText: true, vertical: "top" };
    ws.mergeCells(noteRow.number, 1, noteRow.number, cols.length);
    noteRow.height = 32;
  }

  // Appendix 4 — Hardware Asset Inventory
  addTemplateSheet("Appx 4 · Hardware", "Appendix 4", [
    { header: "Hardware Name / Model",       width: 28 },
    { header: "Asset Tag / Serial Number",   width: 24 },
    { header: "Asset Type",                  width: 18 },
    { header: "Asset Location",              width: 20 },
    { header: "Network Address (IP / MAC)",  width: 24 },
    { header: "Asset Owner",                 width: 20 },
    { header: "Asset Classification",        width: 22 },
    { header: "Department",                  width: 18 },
    { header: "Approval / Authorised Date",  width: 24 },
    { header: "EOS Date",                    width: 14 },
  ]);

  // Appendix 5 — Software Asset Inventory
  addTemplateSheet("Appx 5 · Software", "Appendix 5", [
    { header: "Software Name",               width: 28 },
    { header: "Software Publisher",          width: 24 },
    { header: "Software Version",            width: 18 },
    { header: "Business Purpose",            width: 34 },
    { header: "Asset Classification",        width: 22 },
    { header: "Approval / Authorised Date",  width: 24 },
    { header: "EOS Date",                    width: 14 },
  ]);

  // Appendix 7 — Data Asset Inventory
  addTemplateSheet("Appx 7 · Data", "Appendix 7", [
    { header: "Description",                 width: 40 },
    { header: "Asset Classification",        width: 24 },
    { header: "Asset Location",              width: 28 },
    { header: "Retention Period",            width: 20 },
  ]);

  // Appendix 10 — Account Inventory
  addTemplateSheet("Appx 10 · Accounts", "Appendix 10", [
    { header: "Name",                        width: 24 },
    { header: "Username / Email",            width: 30 },
    { header: "Department",                  width: 20 },
    { header: "Role / Account Type",         width: 22 },
    { header: "Date of Access Created",      width: 24 },
    { header: "Last Logon Date",             width: 20 },
  ]);

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function reportFilename(org: string, ext: string): string {
  const safe = (org || "organisation").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const date = new Date().toISOString().slice(0, 10);
  return `cyber-essentials-submission-${safe}-${date}.${ext}`;
}
