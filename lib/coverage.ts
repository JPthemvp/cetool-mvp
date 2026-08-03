/**
 * What the tool can and cannot evidence on its own.
 *
 * Computed from the mapping tables rather than written down, so the claim in the
 * UI cannot drift away from what the code actually does. `scripts/coverage.ts`
 * prints the same numbers for CI.
 *
 * This is surfaced to the user deliberately. The honest figure — roughly a third
 * of the framework — is still materially more than the existing tools manage,
 * and an SME who is told the limit up front trusts the parts that are automated.
 * An SME who discovers the limit at submission time does not.
 */

import { CLAUSES, CLAUSES_BY_MEASURE, MEASURES, type MeasureId } from "./ce-framework";
import { MAPPINGS } from "./mapping";
import { CHECKS } from "./scripts";

const EXPOSURE_CLAUSES = ["A.3.4(d)", "A.6.4(c)", "A.5.4(l)"];

export const EXTERNALLY_REACHABLE = new Set<string>([
  ...MAPPINGS.flatMap((m) => m.clauseIds),
  ...EXPOSURE_CLAUSES,
]);

export const LOCALLY_REACHABLE = new Set<string>(CHECKS.flatMap((c) => c.clauseIds));

export const AUTOMATABLE = new Set<string>([...EXTERNALLY_REACHABLE, ...LOCALLY_REACHABLE]);

export interface CoverageStats {
  total: number;
  automatable: number;
  selfDeclared: number;
  percentAutomatable: number;
  mandatoryTotal: number;
  mandatoryAutomatable: number;
}

export function coverageStats(): CoverageStats {
  const mandatory = CLAUSES.filter((c) => c.obligation === "shall");
  const automatable = CLAUSES.filter((c) => AUTOMATABLE.has(c.id)).length;
  return {
    total: CLAUSES.length,
    automatable,
    selfDeclared: CLAUSES.length - automatable,
    percentAutomatable: Math.round((automatable / CLAUSES.length) * 100),
    mandatoryTotal: mandatory.length,
    mandatoryAutomatable: mandatory.filter((c) => AUTOMATABLE.has(c.id)).length,
  };
}

export interface MeasureCoverage {
  measureId: MeasureId;
  name: string;
  total: number;
  automatable: number;
  percent: number;
}

export function coverageByMeasure(): MeasureCoverage[] {
  return MEASURES.map((m) => {
    const cs = CLAUSES_BY_MEASURE[m.id];
    const automatable = cs.filter((c) => AUTOMATABLE.has(c.id)).length;
    return {
      measureId: m.id,
      name: m.name,
      total: cs.length,
      automatable,
      percent: Math.round((automatable / cs.length) * 100),
    };
  });
}

/** Whether a specific clause can ever be answered by a check. */
export function isAutomatable(clauseId: string): boolean {
  return AUTOMATABLE.has(clauseId);
}
