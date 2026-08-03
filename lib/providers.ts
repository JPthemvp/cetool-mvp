/**
 * The two hand-offs that end the journey: someone to help you close the gaps,
 * and someone to certify you once they are closed.
 *
 * These are deliberately gated. Showing an SME a list of certification bodies
 * while it still has 40 open mandatory clauses wastes everyone's time and gets
 * the SME quoted for an audit it will fail. Showing a CISOaaS provider to an
 * organisation that is already compliant sells it something it does not need.
 * `recommendNextStep` decides which of the two to surface, from the gap profile.
 *
 * CSA does not endorse any provider, and neither does this tool. The lists below
 * are starting points for the SME's own due diligence, and every one of them
 * carries a link back to the authoritative CSA listing, because appointments
 * change and a stale hard-coded list is worse than no list.
 */

export interface CertificationBody {
  name: string;
  url?: string;
}

/**
 * Appointed by CSA to assess and certify against the Cyber Essentials and
 * Cyber Trust marks. Verify against CSA's current listing before engaging —
 * this is a convenience copy, not the register.
 */
export const CERTIFICATION_BODIES: CertificationBody[] = [
  { name: "BSI Group Singapore Pte Ltd", url: "https://www.bsigroup.com/en-SG/" },
  {
    name: "Bureau Veritas Quality Assurance Pte Ltd",
    url: "https://south-east-asia.bureauveritas.com/bureau-veritas-quality-assurance/csa-cyber-essentials-and-cyber-trust-marks-certification",
  },
  { name: "EPI Certification Pte Ltd" },
  { name: "exida Asia Pacific Pte Ltd" },
  { name: "Guardian Independent Certification Pte Ltd" },
  { name: "ISOCert Pte Ltd", url: "https://www.isocert.sg/csacybersecuritycertifications" },
  { name: "SOCOTEC Certification Singapore Pte Ltd" },
  { name: "TÜV SÜD PSB Pte Ltd", url: "https://www.tuvsud.com/en-sg/services/cyber-security/csa-cyber-essentials-mark" },
  {
    name: "Transpacific Certifications (Singapore) Pte Ltd",
    url: "https://www.tcspl.com.sg/audit-and-certifications/csa-sg-cyber-safe-essentials-mark-and-trust-mark/cyber-essentials-mark",
  },
];

export const CERTIFICATION_REGISTER_URL =
  "https://www.csa.gov.sg/our-programmes/support-for-enterprises/sg-cyber-safe-programme/cybersecurity-certification-for-organisations/cyber-essentials/certification-for-the-cyber-essentials-mark/";

export interface CisoaasProvider {
  name: string;
  url?: string;
}

/**
 * Cybersecurity consultants onboarded by CSA to act as an outsourced CISO for
 * SMEs without in-house security staff. Eligible SMEs have been able to claim
 * substantial co-funding, so confirm current subsidy levels before committing.
 */
export const CISOAAS_PROVIDERS: CisoaasProvider[] = [
  { name: "RSM Singapore", url: "https://www.rsm.global/singapore/service/cisoaas" },
  { name: "Crowe Singapore", url: "https://www.crowe.com/sg/services/risk/cisoaas-consulting" },
  { name: "M1", url: "https://www.m1.com.sg/business/solutions/managed-security-solutions/cisoaas" },
  { name: "Acclime Singapore", url: "https://singapore.acclime.com/advisory/cybersecurity/cisoaas-consulting/" },
];

export const CISOAAS_PROGRAMME_URL =
  "https://www.csa.gov.sg/our-programmes/support-for-enterprises/sg-cyber-safe-programme/cybersecurity-certification-for-organisations/ciso-as-a-service-to-develop-cybersecurity-health-plan/";

/** The ATC listing CSA points SMEs at to match with a consultant. */
export const CISOAAS_DIRECTORY_URL =
  "https://atc.sg/cybersecurity-health-plan-for-SMEs-CISO-as-a-Service-(CiSOaas)-consultants.php";

export const CSA_NON_ENDORSEMENT =
  "CSA does not endorse or recommend any organisation, individual, product or service linked to the SG Cyber Safe programme, and cannot assure the quality of their work. Neither does this tool. Get more than one quote.";

// ── Journey routing ─────────────────────────────────────────────────────────

export type NextStep = "get-help" | "keep-going" | "get-certified";

export interface StepRecommendation {
  step: NextStep;
  title: string;
  body: string;
  /** Why the tool concluded this, so the SME can disagree with it. */
  because: string;
}

/**
 * Which hand-off to surface. Certification bodies only appear once the
 * mandatory clauses are actually closed — offering an audit to an organisation
 * that would fail it is the fastest way to lose an SME's trust.
 */
export function recommendNextStep(input: {
  completion: number;
  blocking: number;
  criticalGaps: number;
  hasInternalIt: boolean;
}): StepRecommendation {
  const { completion, blocking, criticalGaps, hasInternalIt } = input;

  if (completion === 100 && blocking === 0) {
    return {
      step: "get-certified",
      title: "You are ready to approach a certification body",
      body: "Every mandatory clause is met and your evidence references are recorded. The next move is to get quotes from appointed certification bodies and book the independent assessment.",
      because: "All mandatory clauses answered and met.",
    };
  }

  if (criticalGaps > 0 || blocking > 15 || (!hasInternalIt && blocking > 5)) {
    return {
      step: "get-help",
      title: "Worth bringing in a CISO-as-a-Service provider",
      body: hasInternalIt
        ? "The gap list is large enough that sequencing it matters more than any single fix, and that is what a CISOaaS engagement buys. Claim the co-funding before the work starts, not after."
        : "You have no in-house IT and a substantial gap list. A CISOaaS provider under the CSA scheme can own the technical work and the certification pathway together. Claim the co-funding before the work starts.",
      because:
        criticalGaps > 0
          ? `${criticalGaps} critical gap${criticalGaps === 1 ? "" : "s"} open`
          : `${blocking} mandatory clauses open${hasInternalIt ? "" : " with no in-house IT"}`,
    };
  }

  return {
    step: "keep-going",
    title: "You can close this yourself",
    body: "What is left is mostly documentation and settings changes. Work the priority list, record an evidence reference against each clause, and come back when the mandatory clauses read green.",
    because: `${blocking} mandatory clause${blocking === 1 ? "" : "s"} open, none critical.`,
  };
}
