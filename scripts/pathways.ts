/** What each pathway actually delivers. Run: npx tsx scripts/pathways.ts */

import { PATHWAYS, pathwayCoverage } from "../lib/pathways";
import { breakdown, breakdownByMeasure } from "../lib/answerability";
import { MEASURE_BY_ID } from "../lib/ce-framework";

console.log("\nWho can answer each clause\n");
const b = breakdown();
console.log(`  Machine can settle it        ${b.machine}`);
console.log(`  Machine assists, you confirm ${b.mixed}`);
console.log(`  Only a person can answer     ${b.human}`);
console.log(`  Total                        ${b.total}`);

console.log("\nBy measure\n");
for (const row of breakdownByMeasure()) {
  const name = MEASURE_BY_ID.get(row.measureId)?.name ?? row.measureId;
  const bar =
    "M".repeat(row.machine) + "~".repeat(row.mixed) + ".".repeat(row.human);
  console.log(`  ${row.measureId}  ${bar.padEnd(17)}  ${name}`);
}
console.log("\n  M = machine answers   ~ = machine assists   . = only you can\n");

for (const p of PATHWAYS) {
  const c = pathwayCoverage(p.id);
  console.log(`${p.name}`);
  console.log(`  Pre-answered for you         ${c.preAnswered}`);
  console.log(`  Evidence provided, confirm   ${c.evidenced}`);
  console.log(`  You answer from scratch      ${c.toAnswer}`);
  console.log(`  Assisted in some way         ${c.percentAssisted}%\n`);
}
