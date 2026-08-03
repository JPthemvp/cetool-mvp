/**
 * Who can answer each clause: a machine, or only a person.
 *
 * This is the spine of the two pathways. An agent on an endpoint can read
 * whether BitLocker is on; it cannot read whether your staff were trained, who
 * approves a new account, or whether anyone has ever restored from the backup.
 * Those are not gaps in the agent — they are facts that exist only in how the
 * organisation behaves, and no amount of privilege on the box surfaces them.
 *
 * Three values rather than two, because the honest middle case is large:
 *
 *   machine — a check can settle it for the devices it runs on.
 *   mixed   — a check produces real evidence but cannot close it. The agent can
 *             count local administrators; it cannot know that the fourth one is
 *             a contractor who left in March.
 *   human   — no instrumentation helps. Training, approvals, plans, exercises.
 *
 * `mixed` is deliberately not folded into `machine`. Presenting a partially
 * evidenced clause as "answered by the agent" is exactly the overclaim that gets
 * an SME through this tool and then failed by an assessor.
 */

import { CLAUSES, type MeasureId } from "./ce-framework";

export type Answerability = "machine" | "mixed" | "human";

/**
 * Anything not listed is `human`. That default is chosen so a clause added later
 * is never silently claimed as automated.
 */
const CLASSIFICATION: Record<string, Answerability> = {
  // ── A.1 People — nothing here is observable on a machine ────────────────
  // (all default to human)

  // ── A.2 Hardware and software ───────────────────────────────────────────
  "A.2.4(a)": "mixed", // agent enumerates this device; the inventory is org-wide
  "A.2.4(b)": "mixed", // sees this device's class, not the network printer
  "A.2.4(d)": "machine", // installed software and versions
  "A.2.4(f)": "machine", // end-of-support OS and software versions
  "A.2.4(j)": "mixed", // can list software, cannot know what was approved

  // ── A.3 Data ────────────────────────────────────────────────────────────
  "A.3.4(c)": "mixed", // disk encryption yes; data-in-transit only externally

  // ── A.4 Malware and firewall ────────────────────────────────────────────
  "A.4.4(a)": "machine",
  "A.4.4(b)": "machine",
  "A.4.4(c)": "machine",
  "A.4.4(e)": "mixed", // host firewall yes; the perimeter device is not this box
  "A.4.4(h)": "mixed", // installation-source policy is readable, behaviour is not
  "A.4.4(i)": "mixed", // versions and support status, not licence entitlement

  // ── A.5 Access control ──────────────────────────────────────────────────
  "A.5.4(a)": "mixed", // local accounts, not the directory or cloud tenant
  "A.5.4(b)": "mixed",
  "A.5.4(d)": "mixed", // counts administrators, cannot judge necessity
  "A.5.4(f)": "mixed",
  "A.5.4(i)": "machine", // local password policy
  "A.5.4(m)": "machine", // lockout threshold
  "A.5.4(o)": "mixed", // RDP posture locally; cloud MFA is not visible here

  // ── A.6 Secure configuration — the agent's strongest measure ────────────
  "A.6.4(a)": "machine",
  "A.6.4(b)": "machine",
  "A.6.4(c)": "machine",
  "A.6.4(f)": "machine",
  "A.6.4(g)": "machine",
  "A.6.4(i)": "machine",
  "A.6.4(j)": "mixed", // needs MDM, not this endpoint

  // ── A.7 Updates ─────────────────────────────────────────────────────────
  "A.7.4(a)": "machine",
  "A.7.4(c)": "machine",
  "A.7.4(d)": "mixed",

  // ── A.8 Backup ──────────────────────────────────────────────────────────
  "A.8.4(a)": "mixed", // sees a job exists, not that it covers what matters
  "A.8.4(d)": "mixed",
  "A.8.4(f)": "mixed",
  // A.8.4(g) isolation and A.8.4(i) restore testing stay human on purpose:
  // a job running proves neither, and that is the clause that fails at audit.

  // ── A.9 Respond — a plan exists or it does not ──────────────────────────
  // (all default to human)
};

export function answerabilityOf(clauseId: string): Answerability {
  return CLASSIFICATION[clauseId] ?? "human";
}

export interface AnswerabilityBreakdown {
  machine: number;
  mixed: number;
  human: number;
  total: number;
  /** Clauses the SME must answer themselves, whichever pathway they pick. */
  humanOnly: number;
}

export function breakdown(clauseIds?: string[]): AnswerabilityBreakdown {
  const ids = clauseIds ?? CLAUSES.map((c) => c.id);
  let machine = 0;
  let mixed = 0;
  let human = 0;
  for (const id of ids) {
    const a = answerabilityOf(id);
    if (a === "machine") machine++;
    else if (a === "mixed") mixed++;
    else human++;
  }
  return { machine, mixed, human, total: ids.length, humanOnly: human };
}

export function breakdownByMeasure(): Array<{
  measureId: MeasureId;
  machine: number;
  mixed: number;
  human: number;
}> {
  const out = new Map<MeasureId, { machine: number; mixed: number; human: number }>();
  for (const c of CLAUSES) {
    const row = out.get(c.measureId) ?? { machine: 0, mixed: 0, human: 0 };
    row[answerabilityOf(c.id)]++;
    out.set(c.measureId, row);
  }
  return [...out].map(([measureId, row]) => ({ measureId, ...row }));
}

export const ANSWERABILITY_LABEL: Record<Answerability, string> = {
  machine: "The agent can answer this",
  mixed: "The agent gives evidence, you confirm",
  human: "Only you can answer this",
};

export const ANSWERABILITY_BLURB: Record<Answerability, string> = {
  machine:
    "A check on your devices settles this. Review it rather than answering from memory.",
  mixed:
    "A check tells us part of the story — for the devices it ran on. You still have to say whether it holds across the organisation.",
  human:
    "This is about how your organisation behaves, not how a machine is configured. No software can see it.",
};
