/**
 * How much of the framework the tool can actually evidence on its own.
 *
 * Written to keep the product honest: the headline claim is that findings map to
 * clauses, and this reports what share of clauses any automated check can reach.
 * Everything else is self-declaration, which is what CSA's own form already is.
 *
 * Run: npx tsx scripts/coverage.ts
 */

import { CLAUSES, CLAUSES_BY_MEASURE, MEASURES } from "../lib/ce-framework";
import { MAPPINGS } from "../lib/mapping";
import { CHECKS } from "../lib/scripts";

const external = new Set(MAPPINGS.flatMap((m) => m.clauseIds));
// The exposure mapping is matched by checkId prefix, so add its clauses by hand.
for (const id of ["A.3.4(d)", "A.6.4(c)", "A.5.4(l)"]) external.add(id);

const local = new Set(CHECKS.flatMap((c) => c.clauseIds));
const any = new Set([...external, ...local]);

const pct = (n: number, d: number) => `${Math.round((n / d) * 100)}%`;

console.log(`\nClause coverage\n`);
console.log(`  Total clauses                ${CLAUSES.length}`);
console.log(`  Reachable by external scan   ${external.size}  (${pct(external.size, CLAUSES.length)})`);
console.log(`  Reachable by local script    ${local.size}  (${pct(local.size, CLAUSES.length)})`);
console.log(`  Reachable by either          ${any.size}  (${pct(any.size, CLAUSES.length)})`);
console.log(
  `  Pure self-declaration        ${CLAUSES.length - any.size}  (${pct(CLAUSES.length - any.size, CLAUSES.length)})`,
);

console.log(`\nPer measure\n`);
for (const m of MEASURES) {
  const cs = CLAUSES_BY_MEASURE[m.id];
  const covered = cs.filter((c) => any.has(c.id)).length;
  const bar = "#".repeat(covered) + ".".repeat(cs.length - covered);
  console.log(
    `  ${m.id}  ${String(covered).padStart(2)}/${String(cs.length).padEnd(2)}  ${bar.padEnd(16)}  ${m.name}`,
  );
}

const mandatory = CLAUSES.filter((c) => c.obligation === "shall");
const mandatoryCovered = mandatory.filter((c) => any.has(c.id)).length;
console.log(`\nMandatory clauses (the ones that decide certification)\n`);
console.log(`  Total                        ${mandatory.length}`);
console.log(
  `  With any automated signal    ${mandatoryCovered}  (${pct(mandatoryCovered, mandatory.length)})`,
);
console.log(
  `  Answerable only by asking    ${mandatory.length - mandatoryCovered}  (${pct(mandatory.length - mandatoryCovered, mandatory.length)})\n`,
);
