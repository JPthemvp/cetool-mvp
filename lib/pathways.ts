/**
 * Two ways through the assessment.
 *
 * The choice is not "how thorough do you want to be" — both paths assess all 75
 * clauses and both end in the same submittable results tab. The choice is who
 * answers the technical half: you, from memory, or a check running on your
 * machines.
 *
 * Stating it that way matters. An SME that picks the lighter path should not
 * feel it has taken a shortcut, because for a five-person business with three
 * laptops, self-declaration is a perfectly legitimate basis for certification —
 * it is what CSA's own form asks for. The agent buys accuracy and evidence, not
 * permission.
 */

import { CLAUSES } from "./ce-framework";
import { answerabilityOf } from "./answerability";
import { EXTERNALLY_REACHABLE, LOCALLY_REACHABLE } from "./coverage";

export type PathwayId = "self-assess" | "agent-assisted";

export interface Pathway {
  id: PathwayId;
  name: string;
  tagline: string;
  /** What actually runs. */
  mechanics: string[];
  /** Said plainly, because the trade is the whole decision. */
  goodFor: string;
  cost: string;
  intrusiveness: string;
  /** The uncomfortable bit, stated by us rather than discovered by them. */
  limitation: string;
}

export const PATHWAYS: Pathway[] = [
  {
    id: "self-assess",
    name: "Scan and self-assess",
    tagline: "Nothing to install. You answer the questions.",
    mechanics: [
      "A configuration scan of your domain — DNS, email authentication, TLS and security headers, the same ground CSA's Internet Hygiene Portal covers.",
      "Subdomain discovery from public certificate transparency logs, which surfaces hosts that are no longer actively tracked.",
      "You answer the assessment questions, in plain English, with an explanation available on every one.",
    ],
    goodFor:
      "Most small businesses. If you have a handful of laptops and know how they are set up, this is the honest and faster route.",
    cost: "Free. About an hour of your time.",
    intrusiveness: "Nothing installed, nothing touched. Only public data is read.",
    limitation:
      "The scan can only see your internet-facing estate, so almost every answer about your devices comes from you — that is acceptable to an assessor if you know how your devices/endpoints are configured.",
  },
  {
    id: "agent-assisted",
    name: "Run a check on your devices",
    tagline: "The technical questions answer themselves. You answer the rest.",
    mechanics: [
      "Everything in the first pathway.",
      "Plus a check you run on each computer, which reads its security settings and reports back.",
      "Technical clauses arrive pre-answered with evidence attached. You answer the questions about people and process — the ones no software can see.",
    ],
    goodFor:
      "Organisations with more than a few machines, anyone who has inherited an estate they did not set up, and anyone who wants evidence rather than recollection in front of an assessor.",
    cost: "Free. Roughly ten minutes per machine, plus the same questions about people and process.",
    intrusiveness:
      "You run it yourself with administrator rights. It reads settings and writes a file; it changes nothing unless you separately ask it to.",
    limitation:
      "It only reports on the machines you actually run it on, and it cannot see your cloud tenant, your mobile devices or your network hardware.",
  },
];

export const PATHWAY_BY_ID = new Map(PATHWAYS.map((p) => [p.id, p]));

export interface PathwayCoverage {
  pathway: PathwayId;
  /** Clauses arriving with an answer already proposed. */
  preAnswered: number;
  /** Clauses arriving with partial evidence the SME must confirm. */
  evidenced: number;
  /** Clauses the SME must answer from scratch. */
  toAnswer: number;
  total: number;
  percentAssisted: number;
}

/**
 * What each pathway actually delivers, computed rather than asserted.
 *
 * `self-assess` counts only what the external scan reaches. `agent-assisted`
 * adds the endpoint checks, but a clause classified `mixed` counts as evidenced,
 * never as pre-answered — see the note in answerability.ts.
 */
export function pathwayCoverage(pathway: PathwayId): PathwayCoverage {
  let preAnswered = 0;
  let evidenced = 0;
  let toAnswer = 0;

  for (const clause of CLAUSES) {
    const reachable =
      EXTERNALLY_REACHABLE.has(clause.id) ||
      (pathway === "agent-assisted" && LOCALLY_REACHABLE.has(clause.id));

    if (!reachable) {
      toAnswer++;
      continue;
    }

    if (answerabilityOf(clause.id) === "machine") preAnswered++;
    else evidenced++;
  }

  const total = CLAUSES.length;
  return {
    pathway,
    preAnswered,
    evidenced,
    toAnswer,
    total,
    percentAssisted: Math.round(((preAnswered + evidenced) / total) * 100),
  };
}

/** The clauses a person must answer regardless of pathway — the people and process half. */
export function humanOnlyClauses(): string[] {
  return CLAUSES.filter((c) => answerabilityOf(c.id) === "human").map((c) => c.id);
}
