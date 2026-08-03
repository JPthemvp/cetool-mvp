/**
 * Writes a real submission workbook and reads it back.
 *
 * A .xlsx that typechecks but will not open in Excel is worthless, and the only
 * way to know is to round-trip it. Run: npx tsx scripts/xlsx-smoke.ts
 */

import { writeFileSync } from "node:fs";
import ExcelJS from "exceljs";
import { DEFAULT_SCOPE, computeGaps, computeReadiness, emptyAnswers } from "../lib/assessment";
import { buildReport, reportToXlsx } from "../lib/report";

const out = process.argv[2] ?? ".";

const answers = emptyAnswers();
for (const k of Object.keys(answers)) answers[k] = { value: "yes", source: "user" };
answers["A.6.4(b)"] = { value: "no", source: "scan", note: "TLS 1.0 accepted" };
answers["A.8.4(i)"] = { value: "unsure", source: "user" };

const readiness = computeReadiness(answers, DEFAULT_SCOPE);

const report = buildReport({
  org: {
    name: "Tampines Family Clinic Pte Ltd",
    uen: "201911223C",
    industry: "Healthcare",
    size: "1-9 employees",
    sector: "healthcare-hia",
    scoping: { boundary: "whole" },
  },
  scope: DEFAULT_SCOPE,
  pathway: "agent-assisted",
  answers,
  readiness,
  gaps: computeGaps(answers, DEFAULT_SCOPE, new Map()),
  scan: {
    domain: "example.com.sg",
    scannedAt: new Date().toISOString(),
    reachable: true,
    mode: "passive",
    resolvedVia: "doh",
    findings: [],
    assets: [],
    discovered: [{ host: "old.example.com.sg", live: false }],
  },
  endpoints: [
    {
      computer: "CLINIC-RECEPTION",
      generated: new Date().toISOString(),
      findings: [
        {
          id: "tls-legacy",
          title: "TLS 1.0 and 1.1 disabled",
          clauses: ["A.6.4(b)"],
          measure: "A.6",
          result: "fail",
          detail: "Still enabled",
        },
      ],
    },
  ],
});

async function main() {
  const blob = await reportToXlsx(report);
  const buf = Buffer.from(await blob.arrayBuffer());
  const path = `${out}/submission-smoke.xlsx`;
  writeFileSync(path, buf);

  // Read it back the way Excel would.
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);

  console.log(`\nwrote ${path} (${buf.length.toLocaleString()} bytes)\n`);
  console.log("sheets:");
  wb.eachSheet((ws) =>
    console.log(`  ${ws.name.padEnd(20)} ${ws.rowCount} rows x ${ws.columnCount} cols`),
  );

  const results = wb.getWorksheet("Results")!;
  console.log(`\nResults header: ${(results.getRow(1).values as string[]).slice(1).join(" | ")}`);
  console.log(
    `first data row: ${(results.getRow(2).values as string[]).slice(1).join(" | ")}`,
  );

  console.log(`\nEvidence log rows: ${wb.getWorksheet("Evidence log")!.rowCount}`);
  console.log(`sector sheet present: ${!!wb.getWorksheet("Sector obligations")}`);
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
