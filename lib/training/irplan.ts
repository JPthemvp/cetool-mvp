/**
 * Incident Response Plan generator — A.9 evidence.
 *
 * Generates a pre-filled IR plan document from organisation details.
 * Structure drawn from NIST SP 800-61r3 and CSA's published IR guidance,
 * adapted for Singapore SME context (PDPA breach notification, CSA SingCERT,
 * sector-specific obligations from sectors.ts).
 *
 * The generated plan answers all four A.9 clauses:
 *   A.9.4(a) — IR plan exists and is documented
 *   A.9.4(b) — Roles and responsibilities defined
 *   A.9.4(c) — Incident detection and reporting procedure
 *   A.9.4(d) — Post-incident review process
 */

export interface OrgContext {
  name: string;
  uen: string;
  sector: string;
  contactName?: string;
  contactEmail?: string;
  itVendor?: string;
}

export function generateIRPlan(org: OrgContext): string {
  const today = new Date().toLocaleDateString("en-SG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const sectorObligation = sectorBreachObligation(org.sector);

  return `
# Cyber Incident Response Plan
## ${org.name} (UEN: ${org.uen})

**Version:** 1.0
**Prepared:** ${today}
**Next review:** ${reviewDate()}
**Document owner:** ${org.contactName ?? "[Insert name]"} · ${org.contactEmail ?? "[Insert email]"}

---

## 1. Purpose and scope

This plan describes how ${org.name} prepares for, detects, responds to, and recovers
from cybersecurity incidents. It covers all systems, data, and personnel within the
organisation's ICT environment.

This plan is prepared to satisfy **CSA Cyber Essentials mark A.9 (Respond)** and to
meet obligations under the **Personal Data Protection Act (PDPA)** Mandatory Breach
Notification rules.

---

## 2. Definitions

| Term | Definition |
|---|---|
| Incident | Any event that threatens the confidentiality, integrity, or availability of systems or data |
| Data Breach | Unauthorised access to, disclosure, or loss of personal data |
| Ransomware | Malware that encrypts files and demands payment |
| Phishing | Deceptive emails or messages that trick users into revealing credentials or installing malware |

---

## 3. Roles and responsibilities (A.9.4(b))

| Role | Name / Contact | Responsibilities |
|---|---|---|
| Incident Owner | ${org.contactName ?? "[Insert name]"} | Overall incident response co-ordination |
| IT Contact | ${org.itVendor ?? "[Insert IT vendor or staff]"} | Technical investigation and recovery |
| Management | [Insert director name] | Approve communications, resource decisions |
| PDPA Officer | [Insert DPO or officer name] | Assess breach notification obligations |

---

## 4. Incident detection and reporting (A.9.4(c))

### 4.1 How to recognise an incident

Employees should report any of the following immediately:

- Unexpected pop-ups demanding payment (ransomware)
- Files that cannot be opened and have unusual file extensions
- Login failures for accounts that worked previously
- Unknown devices or accounts appearing on systems
- Phishing emails that may have been clicked
- Customers or partners reporting unusual communications from your organisation

### 4.2 How to report

**Step 1:** Call or message the Incident Owner immediately. Do not wait until end of day.
**Step 2:** Do not attempt to fix it yourself — note what you see, and do not turn off the device unless asked.
**Step 3:** The Incident Owner logs the report in the Incident Log (Appendix A).

---

## 5. Response procedure (A.9.4(a))

### Phase 1 — Contain (within 2 hours of detection)

1. Disconnect the affected device(s) from the network (unplug LAN cable or disable Wi-Fi).
2. Do not turn off the device — this preserves forensic evidence.
3. If a user account is compromised, disable it immediately via the IT contact.
4. Notify the IT contact and begin recording the incident in the Incident Log.

### Phase 2 — Assess (within 4 hours)

1. Identify what systems and data are affected.
2. Determine whether personal data has been, or is likely to have been, accessed or exfiltrated.
3. Escalate to management and the PDPA Officer.

### Phase 3 — Notify (as required by law)

${sectorObligation}

**General PDPA obligation:**
If a breach is likely to cause significant harm to individuals, notify the **PDPA Commission within 3 calendar days** of assessing it is notifiable.
Portal: https://www.pdpc.gov.sg/

**CSA SingCERT** (voluntary but recommended for significant incidents):
Email: singcert@csa.gov.sg · Hotline: +65 6323 5052

### Phase 4 — Eradicate and recover

1. IT contact removes malware, closes the attack vector, patches the affected system.
2. Restore from the most recent clean backup.
3. Test restored data and systems before reconnecting to the network.
4. Change all passwords that may have been exposed.

### Phase 5 — Learn (A.9.4(d))

Within 2 weeks of resolution:

1. Hold a post-incident review with all relevant parties.
2. Update this plan with lessons learned.
3. Record the review in the Incident Log.
4. If the incident exposed a training gap, schedule awareness training within 30 days.

---

## 6. Communication

| Audience | When | Channel | Message owner |
|---|---|---|---|
| Staff | Immediately | Email / instant message | Incident Owner |
| Customers (if data affected) | Within 3 days (PDPA) | Email | Management |
| PDPC | If notifiable breach | Online portal | PDPA Officer |
| CSA SingCERT | Significant incidents | Email / hotline | Incident Owner |
| Police (cybercrime) | Criminal activity | SPF report | Management |

SPF Cybercrime hotline: 1800-225-0000
Report cybercrime: www.police.gov.sg/cybercrime

---

## 7. Recovery time objectives

| Scenario | Target RTO | Target RPO |
|---|---|---|
| Single workstation ransomware | 4 hours | 24 hours |
| Email compromise | 2 hours | N/A |
| Server or cloud service outage | 8 hours | 24 hours |
| Data breach | N/A | N/A |

---

## 8. Plan maintenance (A.9.4(d))

- This plan is reviewed at least **annually** and after every significant incident.
- The Incident Owner is responsible for maintaining current contact details.
- A tabletop exercise is conducted at least **annually** to test the plan.

---

## Appendix A — Incident Log Template

| Field | Value |
|---|---|
| Incident ID | INC-[YYYY]-[NNN] |
| Date/time detected | |
| Reported by | |
| Systems affected | |
| Data types affected | |
| Containment actions taken | |
| Notifiable breach? (Y/N) | |
| Notification sent to PDPC | |
| Resolution date | |
| Post-incident review date | |
| Lessons learned | |

---

## Appendix B — Emergency contacts

| Contact | Details |
|---|---|
| CSA SingCERT | singcert@csa.gov.sg · +65 6323 5052 |
| PDPC | https://www.pdpc.gov.sg/ |
| SPF Cybercrime | 1800-225-0000 |
| IT contact / vendor | ${org.itVendor ?? "[Insert]"} |
| Cyber insurance (if any) | [Insert policy number and hotline] |

---
*Generated by CE Tool · Based on CSA Cyber Essentials mark A.9 · ${today}*
*This document is a starting template. Have it reviewed by a qualified professional before submission.*
`.trim();
}

function reviewDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toLocaleDateString("en-SG", { month: "long", year: "numeric" });
}

function sectorBreachObligation(sector: string): string {
  switch (sector) {
    case "healthcare":
      return `**Healthcare — MOH / HIA obligation:**
Notify the **Ministry of Health** within **2 hours** of a cybersecurity incident.
Submit a detailed report within **14 days**.
Ref: Healthcare Services Act / Health Information Act.`;
    case "financial":
      return `**MAS-regulated — MAS obligation:**
Notify **MAS** within **1 hour** of detecting a severe incident.
Submit a detailed report within **14 days**.
Ref: MAS Technology Risk Management Guidelines.`;
    case "critical":
      return `**CII sector — CSA obligation:**
As a Critical Information Infrastructure owner, notify **CSA** within **2 hours**.
Submit a detailed report within **14 days**.
Ref: Cybersecurity Act 2018.`;
    case "social":
      return `**Social service — NCSS / MSF obligation:**
Follow standard PDPA breach notification.
The Transformation Sustainability Scheme may fund IR costs — contact NCSS.`;
    default:
      return `**General PDPA obligation (applies to all organisations):**
If a breach is likely to cause significant harm to individuals, notify the PDPC within **3 calendar days**.`;
  }
}
