/**
 * CSA Cyber Essentials mark — framework model.
 *
 * Source: "CSA Cybersecurity Certification: Cyber Essentials mark", V202503
 * (published 7 Mar 2025), as expanded on 15 Apr 2025 to cover Cloud, OT and AI
 * security. Five categories, nine measures (A.1–A.9), 75 clauses.
 *
 * `statement` paraphrases the published clause in plain English for SME readers.
 * `obligation` preserves the published shall/should distinction, which is what
 * decides certification: every `shall` in scope must be met, `should` clauses are
 * recommendations an assessor will note but not fail you on.
 */

export type Obligation = "shall" | "should";
export type TechDomain = "cloud" | "ot" | "ai";
export type CategoryId = "assets" | "secure" | "update" | "backup" | "respond";

export interface Clause {
  id: string;
  measureId: MeasureId;
  obligation: Obligation;
  /** Only assessed when the named context is in the certification scope. */
  conditional?: "mobile" | "byod" | "servers";
  title: string;
  statement: string;
  /** The question the SME actually answers. */
  question: string;
  /** What an assessor expects to see at audit. */
  evidence: string[];
  /** Contexts where the published clause adds domain-specific expectations. */
  domains: TechDomain[];
}

export type MeasureId =
  | "A.1" | "A.2" | "A.3" | "A.4" | "A.5" | "A.6" | "A.7" | "A.8" | "A.9";

export interface Measure {
  id: MeasureId;
  category: CategoryId;
  name: string;
  tagline: string;
  objective: string;
  /** Cyber Trust domain number this measure maps onto (CSA's own `*` mapping). */
  trustDomain: number;
}

export interface Category {
  id: CategoryId;
  name: string;
  blurb: string;
}

export const CATEGORIES: Category[] = [
  {
    id: "assets",
    name: "Assets",
    blurb:
      "Know your people, your hardware and software, and your data — you cannot protect what you have not accounted for.",
  },
  {
    id: "secure",
    name: "Secure/Protect",
    blurb:
      "Guard against malware, control who can get in, and run everything on secure settings rather than defaults.",
  },
  {
    id: "update",
    name: "Update",
    blurb:
      "Keep software and firmware patched so known vulnerabilities cannot be used against you.",
  },
  {
    id: "backup",
    name: "Backup",
    blurb:
      "Keep isolated, tested copies of essential data so ransomware or loss does not end the business.",
  },
  {
    id: "respond",
    name: "Respond",
    blurb:
      "Be ready to detect, respond to and recover from an incident before it happens, not during.",
  },
];

export const MEASURES: Measure[] = [
  {
    id: "A.1",
    category: "assets",
    name: "Assets: People",
    tagline: "Equip employees with know-how to be the first line of defence",
    objective:
      "Instil cybersecurity awareness among employees at all levels and cultivate shared responsibility for security.",
    trustDomain: 7,
  },
  {
    id: "A.2",
    category: "assets",
    name: "Assets: Hardware and software",
    tagline: "Know what hardware and software the organisation has and protect them",
    objective:
      "Actively manage hardware and software assets so only authorised assets are in the environment and each one can be monitored and protected.",
    trustDomain: 8,
  },
  {
    id: "A.3",
    category: "assets",
    name: "Assets: Data",
    tagline: "Know what data the organisation has, where it is, and secure it",
    objective:
      "Identify and inventory business-critical data, know where it is stored and transmitted, and protect it in transit and at rest.",
    trustDomain: 9,
  },
  {
    id: "A.4",
    category: "secure",
    name: "Secure/Protect: Virus and malware protection",
    tagline: "Protect from malicious software like viruses and malware",
    objective:
      "Detect and block malicious software on endpoints and at the network perimeter before it can execute.",
    trustDomain: 13,
  },
  {
    id: "A.5",
    category: "secure",
    name: "Secure/Protect: Access control",
    tagline: "Control access to the organisation's data and services",
    objective:
      "Ensure only authorised people hold accounts, that each account has no more access than its role needs, and that privileged access is tightly held.",
    trustDomain: 15,
  },
  {
    id: "A.6",
    category: "secure",
    name: "Secure/Protect: Secure configuration",
    tagline: "Use secure settings for the organisation's hardware and software",
    objective:
      "Replace insecure defaults with hardened settings, remove what is not needed, and log what happens.",
    trustDomain: 12,
  },
  {
    id: "A.7",
    category: "update",
    name: "Update: Software updates",
    tagline: "Update software on devices and systems",
    objective:
      "Apply security patches promptly, prioritised by criticality, so known vulnerabilities are closed.",
    trustDomain: 12,
  },
  {
    id: "A.8",
    category: "backup",
    name: "Backup: Back up essential data",
    tagline: "Back up essential data and store it separately and securely",
    objective:
      "Maintain isolated, protected and tested backups of business-critical data and systems.",
    trustDomain: 10,
  },
  {
    id: "A.9",
    category: "respond",
    name: "Respond: Incident response",
    tagline: "Be ready to detect, respond to and recover from incidents",
    objective:
      "Have a current, exercised incident response plan covering detection, containment, recovery, and notification duties.",
    trustDomain: 21,
  },
];

export const CLAUSES: Clause[] = [
  // ── A.1 Assets: People ────────────────────────────────────────────────────
  {
    id: "A.1.4(a)",
    measureId: "A.1",
    obligation: "shall",
    title: "Security awareness training for all employees",
    statement:
      "Establish cybersecurity awareness and data protection training for all employees so they know the security practices and behaviour expected of them. Self-learning materials or an external training provider both count.",
    question:
      "Does every employee receive cybersecurity awareness and data protection training?",
    evidence: [
      "Training materials or provider course outline",
      "Attendance or completion records covering all staff",
    ],
    domains: ["cloud", "ot", "ai"],
  },
  {
    id: "A.1.4(b)",
    measureId: "A.1",
    obligation: "shall",
    title: "Cyber hygiene practices and guidelines",
    statement:
      "Develop cyber hygiene practices and guidelines for employees to follow in daily operations.",
    question:
      "Do you have written cyber hygiene guidelines that staff are expected to follow day to day?",
    evidence: ["Staff-facing cyber hygiene guideline or handbook section"],
    domains: ["ot", "ai"],
  },
  {
    id: "A.1.4(c)",
    measureId: "A.1",
    obligation: "should",
    title: "Guidelines cover human-factor risks",
    statement:
      "Guidelines should cover AI-enabled social engineering and deepfakes, MFA and strong passphrases, protecting corporate and personal (BYOD) devices, careful handling of business-critical and personal data, secure practices on-site and remote, and prompt reporting of incidents.",
    question:
      "Do your guidelines cover phishing and deepfakes, MFA and passphrases, BYOD, data handling, remote work, and how to report an incident?",
    evidence: ["Guideline contents mapped against the six topics"],
    domains: ["cloud", "ot", "ai"],
  },
  {
    id: "A.1.4(d)",
    measureId: "A.1",
    obligation: "should",
    title: "Training differentiated by role",
    statement:
      "Where feasible, differentiate training by role — leadership on strategy and culture, general employees on passphrases and device protection, and staff handling personal data on PDPA obligations.",
    question:
      "Is training tailored for leadership, general staff, and anyone who handles personal data?",
    evidence: ["Role-based training matrix or differentiated course list"],
    domains: ["cloud", "ot", "ai"],
  },
  {
    id: "A.1.4(e)",
    measureId: "A.1",
    obligation: "should",
    title: "Refresh awareness at least annually",
    statement:
      "As a best practice, run awareness initiatives at least annually to refresh employee awareness.",
    question: "Is awareness training refreshed at least once a year?",
    evidence: ["Dated training records across two consecutive years"],
    domains: ["cloud", "ot", "ai"],
  },

  // ── A.2 Assets: Hardware and software ─────────────────────────────────────
  {
    id: "A.2.4(a)",
    measureId: "A.2",
    obligation: "shall",
    title: "Maintain an asset inventory",
    statement:
      "Maintain an up-to-date inventory of all hardware and software assets, including those from third-party vendors, together with network diagrams of the environment. A spreadsheet is acceptable.",
    question:
      "Do you keep a current inventory of all hardware and software, plus a network diagram?",
    evidence: [
      "Asset inventory with a recent review date",
      "Network diagram of the certified environment",
    ],
    domains: ["cloud", "ot", "ai"],
  },
  {
    id: "A.2.4(b)",
    measureId: "A.2",
    obligation: "shall",
    title: "Inventory covers all in-scope hardware",
    statement:
      "Hardware assets in scope include end-user devices, portable and mobile devices, network devices such as firewalls and routers, non-standard computing devices such as IoT, and servers.",
    question:
      "Does the inventory include laptops, mobiles, network gear, IoT devices and servers?",
    evidence: ["Inventory showing each hardware class present in your environment"],
    domains: ["cloud", "ot"],
  },
  {
    id: "A.2.4(c)",
    measureId: "A.2",
    obligation: "should",
    title: "Hardware inventory detail",
    statement:
      "The inventory should record details of each hardware asset — such as owner, location, purpose and end-of-support date.",
    question: "Does each hardware record show owner, location and support status?",
    evidence: ["Inventory columns for owner, location, EOS date"],
    domains: ["cloud", "ot"],
  },
  {
    id: "A.2.4(d)",
    measureId: "A.2",
    obligation: "should",
    title: "Software inventory detail",
    statement:
      "The inventory should record details of each software asset — such as version, licence, business owner and end-of-support date.",
    question: "Does each software record show version, owner and support status?",
    evidence: ["Inventory columns for version and EOS date"],
    domains: ["cloud", "ai"],
  },
  {
    id: "A.2.4(e)",
    measureId: "A.2",
    obligation: "should",
    title: "Review the inventory regularly",
    statement:
      "As a best practice, the hardware and software inventory should be reviewed on a regular basis.",
    question: "Is the asset inventory reviewed on a set schedule?",
    evidence: ["Review log with dates and reviewer"],
    domains: [],
  },
  {
    id: "A.2.4(f)",
    measureId: "A.2",
    obligation: "shall",
    title: "Replace or isolate end-of-support assets",
    statement:
      "Unauthorised assets, and assets that have reached end-of-support (EOS), shall be removed, replaced or otherwise addressed.",
    question:
      "Have you replaced or removed any hardware and software that is past end-of-support?",
    evidence: ["EOS register with replacement decisions and dates"],
    domains: ["cloud", "ot"],
  },
  {
    id: "A.2.4(g)",
    measureId: "A.2",
    obligation: "shall",
    title: "Compensating controls for retained EOS assets",
    statement:
      "Where continued use of an EOS asset is unavoidable, apply compensating controls such as network segregation or restricted access, and document the risk acceptance.",
    question:
      "For any end-of-support asset you must keep, are compensating controls in place and the risk documented?",
    evidence: ["Risk acceptance record", "Description of compensating controls"],
    domains: ["ot"],
  },
  {
    id: "A.2.4(h)",
    measureId: "A.2",
    obligation: "shall",
    title: "Authorisation process for new assets",
    statement:
      "Develop an authorisation process so that only approved hardware and software enter the environment.",
    question:
      "Is there an approval step before new hardware or software is introduced?",
    evidence: ["Documented authorisation procedure", "Sample approval records"],
    domains: ["cloud", "ai"],
  },
  {
    id: "A.2.4(i)",
    measureId: "A.2",
    obligation: "should",
    title: "Record authorisation dates",
    statement:
      "The date of authorisation for software and hardware should be recorded in the inventory.",
    question: "Does the inventory record when each asset was approved?",
    evidence: ["Authorisation date column in the inventory"],
    domains: [],
  },
  {
    id: "A.2.4(j)",
    measureId: "A.2",
    obligation: "shall",
    title: "Remove unapproved assets",
    statement:
      "Software and hardware without approval shall not be used and shall be removed from the environment.",
    question: "Is unapproved software removed when found?",
    evidence: ["Removal records or endpoint policy blocking unapproved software"],
    domains: ["cloud", "ai"],
  },
  {
    id: "A.2.4(k)",
    measureId: "A.2",
    obligation: "shall",
    title: "Wipe assets before disposal",
    statement:
      "Before disposing of any hardware asset, remove or securely wipe all data on it.",
    question: "Is data securely wiped from devices before disposal?",
    evidence: ["Disposal procedure", "Wipe or destruction certificates"],
    domains: ["cloud"],
  },
  {
    id: "A.2.4(l)",
    measureId: "A.2",
    obligation: "should",
    title: "Record disposals",
    statement:
      "When disposing of hardware assets, the disposal should be recorded and the inventory updated.",
    question: "Are disposals logged and the inventory updated?",
    evidence: ["Disposal log tied to inventory entries"],
    domains: [],
  },

  // ── A.3 Assets: Data ──────────────────────────────────────────────────────
  {
    id: "A.3.4(a)",
    measureId: "A.3",
    obligation: "shall",
    title: "Inventory business-critical data",
    statement:
      "Identify and maintain an inventory of business-critical data, recording what it is, where it is stored, and who is responsible for it.",
    question:
      "Do you have an inventory of your business-critical data and where it lives?",
    evidence: ["Data inventory listing data types, locations and owners"],
    domains: ["cloud", "ai"],
  },
  {
    id: "A.3.4(b)",
    measureId: "A.3",
    obligation: "should",
    title: "Review the data inventory annually",
    statement:
      "The data inventory should be reviewed at least annually, or when there is a significant change.",
    question: "Is the data inventory reviewed at least yearly?",
    evidence: ["Dated review records"],
    domains: [],
  },
  {
    id: "A.3.4(c)",
    measureId: "A.3",
    obligation: "shall",
    title: "Protect data at rest and in transit",
    statement:
      "Establish a process to protect business-critical data, including encryption of data at rest and in transit and password protection of sensitive files.",
    question:
      "Is business-critical data encrypted both when stored and when sent over networks?",
    evidence: [
      "Disk or database encryption settings",
      "TLS enforced on public services",
    ],
    domains: ["cloud", "ai"],
  },
  {
    id: "A.3.4(d)",
    measureId: "A.3",
    obligation: "shall",
    title: "Prevent unauthorised data transfer",
    statement:
      "Implement measures to prevent unauthorised transfer or leakage of business-critical data out of the organisation.",
    question:
      "Are there controls stopping staff moving critical data to personal accounts or removable media?",
    evidence: ["DLP settings, USB restrictions, or documented policy plus controls"],
    domains: ["cloud", "ai"],
  },
  {
    id: "A.3.4(e)",
    measureId: "A.3",
    obligation: "shall",
    title: "Securely destroy media before disposal",
    statement:
      "Before disposing of any physical media, securely delete or destroy the data it holds.",
    question: "Is storage media securely destroyed or wiped before disposal?",
    evidence: ["Media destruction procedure and certificates"],
    domains: [],
  },

  // ── A.4 Secure/Protect: Virus and malware protection ──────────────────────
  {
    id: "A.4.4(a)",
    measureId: "A.4",
    obligation: "shall",
    title: "Deploy anti-malware on endpoints",
    statement:
      "Virus and malware protection solutions shall be installed on all endpoints in scope.",
    question: "Is anti-malware installed on every laptop, desktop and server?",
    evidence: ["Anti-malware console showing coverage across the estate"],
    domains: ["cloud", "ot"],
  },
  {
    id: "A.4.4(b)",
    measureId: "A.4",
    obligation: "shall",
    title: "Anti-malware actively scanning",
    statement:
      "Virus and malware protection shall be configured to scan actively — on access, on schedule, and on files downloaded or attached.",
    question: "Is real-time and scheduled scanning switched on?",
    evidence: ["Scan policy configuration screenshot"],
    domains: ["ot"],
  },
  {
    id: "A.4.4(c)",
    measureId: "A.4",
    obligation: "shall",
    title: "Automatic signature updates",
    statement:
      "Automatic updates for virus and malware definitions shall be enabled so protection stays current.",
    question: "Do malware definitions update automatically?",
    evidence: ["Update policy showing automatic definition updates"],
    domains: ["ot"],
  },
  {
    id: "A.4.4(d)",
    measureId: "A.4",
    obligation: "shall",
    conditional: "mobile",
    title: "Mobile device malware protection",
    statement:
      "Where mobile devices are in scope, apply malware protection appropriate to those devices.",
    question: "Are company mobile devices protected against malware?",
    evidence: ["MDM configuration or mobile security app deployment"],
    domains: ["cloud"],
  },
  {
    id: "A.4.4(e)",
    measureId: "A.4",
    obligation: "shall",
    title: "Deploy and configure firewalls",
    statement:
      "Firewalls shall be configured and deployed at the network perimeter and, where applicable, on endpoints, to filter inbound and outbound traffic.",
    question: "Is a firewall in place at the perimeter and on endpoints?",
    evidence: ["Firewall rule base", "Host firewall policy"],
    domains: ["cloud", "ot"],
  },
  {
    id: "A.4.4(f)",
    measureId: "A.4",
    obligation: "should",
    title: "Review firewall rules",
    statement:
      "As good practice, firewall configurations and rules should be reviewed periodically.",
    question: "Are firewall rules reviewed on a schedule?",
    evidence: ["Firewall review log"],
    domains: ["cloud"],
  },
  {
    id: "A.4.4(g)",
    measureId: "A.4",
    obligation: "shall",
    conditional: "mobile",
    title: "Mobile network protection",
    statement:
      "Where mobile devices are in scope, protect their network connections, for example by requiring VPN on untrusted networks.",
    question: "Are mobile devices protected when on untrusted networks?",
    evidence: ["VPN policy or MDM network settings"],
    domains: ["cloud"],
  },
  {
    id: "A.4.4(h)",
    measureId: "A.4",
    obligation: "shall",
    title: "Apps only from official sources",
    statement:
      "Employees shall install applications only from official or trusted sources.",
    question: "Are staff restricted to installing apps from official app stores?",
    evidence: ["Device policy restricting installation sources"],
    domains: [],
  },
  {
    id: "A.4.4(i)",
    measureId: "A.4",
    obligation: "shall",
    title: "Use supported, legitimate software",
    statement:
      "Employees shall use legitimate, vendor-supported software rather than pirated or unsupported versions.",
    question: "Is all software licensed and vendor-supported?",
    evidence: ["Licence register", "Software inventory with support status"],
    domains: [],
  },
  {
    id: "A.4.4(j)",
    measureId: "A.4",
    obligation: "shall",
    title: "Malware reporting by employees",
    statement:
      "Employees shall report suspected malware infections and suspicious files promptly.",
    question: "Do staff know how and where to report a suspected infection?",
    evidence: ["Reporting procedure communicated to staff"],
    domains: [],
  },

  // ── A.5 Secure/Protect: Access control ────────────────────────────────────
  {
    id: "A.5.4(a)",
    measureId: "A.5",
    obligation: "shall",
    title: "Account management process",
    statement:
      "Account management shall be established to control the creation, modification and removal of user accounts, supported by an account inventory.",
    question: "Do you keep a list of all user accounts and manage their lifecycle?",
    evidence: ["Account inventory", "Joiner/mover/leaver procedure"],
    domains: ["cloud", "ot"],
  },
  {
    id: "A.5.4(b)",
    measureId: "A.5",
    obligation: "shall",
    title: "Account inventory detail",
    statement:
      "The account inventory shall record details such as account owner, account type, system, and privilege level.",
    question:
      "Does the account list show who owns each account and what privileges it holds?",
    evidence: ["Account inventory columns for owner, type and privilege"],
    domains: ["cloud"],
  },
  {
    id: "A.5.4(c)",
    measureId: "A.5",
    obligation: "shall",
    title: "Approval before granting access",
    statement:
      "Implement an approval process before access is granted, changed or elevated.",
    question: "Is access approved by someone before it is granted?",
    evidence: ["Access request and approval records"],
    domains: ["cloud"],
  },
  {
    id: "A.5.4(d)",
    measureId: "A.5",
    obligation: "shall",
    title: "Least privilege",
    statement:
      "Manage access so employees have only the access their role requires, and no more.",
    question: "Does each person have only the access their job needs?",
    evidence: ["Role-to-permission mapping", "Access review results"],
    domains: ["cloud", "ot"],
  },
  {
    id: "A.5.4(e)",
    measureId: "A.5",
    obligation: "shall",
    title: "Remove unnecessary and expired access",
    statement:
      "Accounts with unnecessary or expired access shall be removed or disabled, including when staff leave or change roles.",
    question: "Are accounts disabled promptly when someone leaves or changes role?",
    evidence: ["Leaver checklist", "Evidence of disabled ex-staff accounts"],
    domains: ["cloud"],
  },
  {
    id: "A.5.4(f)",
    measureId: "A.5",
    obligation: "shall",
    title: "Separate administrator accounts",
    statement:
      "Administrator accounts shall be created only where required, kept separate from day-to-day user accounts, and not used for routine work such as email and browsing.",
    question:
      "Do admins have a separate admin account that is not used for email or browsing?",
    evidence: ["List of admin accounts and their separate daily-use accounts"],
    domains: ["cloud", "ot"],
  },
  {
    id: "A.5.4(g)",
    measureId: "A.5",
    obligation: "shall",
    title: "Control third-party access",
    statement:
      "Manage access so third parties have only the access needed, for only as long as needed.",
    question: "Is vendor and contractor access limited and time-bound?",
    evidence: ["Third-party access register with expiry dates"],
    domains: ["cloud", "ot"],
  },
  {
    id: "A.5.4(h)",
    measureId: "A.5",
    obligation: "shall",
    title: "Third-party accountability",
    statement:
      "Third parties or contractors working with the organisation shall be held to equivalent security expectations, set out in the engagement terms.",
    question: "Do vendor contracts set out security responsibilities?",
    evidence: ["Contract clauses or vendor security agreements"],
    domains: ["cloud"],
  },
  {
    id: "A.5.4(i)",
    measureId: "A.5",
    obligation: "should",
    title: "Minimum password standards",
    statement:
      "Implement minimum password requirements — length, complexity and no reuse of breached or default credentials.",
    question: "Is a minimum password or passphrase standard enforced?",
    evidence: ["Password policy configuration in the identity provider"],
    domains: ["cloud", "ot"],
  },
  {
    id: "A.5.4(j)",
    measureId: "A.5",
    obligation: "shall",
    title: "Physical access control",
    statement:
      "Physical access control shall be enforced to restrict entry to areas holding critical systems and data.",
    question: "Is physical access to servers and network equipment restricted?",
    evidence: ["Door access records", "Server room access list"],
    domains: ["ot"],
  },
  {
    id: "A.5.4(k)",
    measureId: "A.5",
    obligation: "should",
    title: "Periodic account reviews",
    statement:
      "As good practice, account reviews should be conducted periodically to confirm access is still appropriate.",
    question: "Are user accounts reviewed periodically?",
    evidence: ["Access review reports with dates and outcomes"],
    domains: ["cloud"],
  },
  {
    id: "A.5.4(l)",
    measureId: "A.5",
    obligation: "shall",
    title: "Change default credentials",
    statement:
      "All default passwords shall be changed before a device or service is put into use.",
    question:
      "Have default passwords been changed on every device, including routers and IoT?",
    evidence: ["Build checklist requiring credential change", "Spot-check records"],
    domains: ["cloud", "ot"],
  },
  {
    id: "A.5.4(m)",
    measureId: "A.5",
    obligation: "shall",
    title: "Lock accounts after failed attempts",
    statement:
      "User accounts shall be disabled or locked after a defined number of failed login attempts.",
    question: "Do accounts lock after repeated failed logins?",
    evidence: ["Lockout policy configuration"],
    domains: ["cloud"],
  },
  {
    id: "A.5.4(n)",
    measureId: "A.5",
    obligation: "shall",
    title: "Change passwords on suspected compromise",
    statement:
      "Account passwords shall be changed promptly where compromise is known or suspected.",
    question: "Is there a process to force password resets after a suspected breach?",
    evidence: ["Incident procedure covering credential reset"],
    domains: ["cloud"],
  },
  {
    id: "A.5.4(o)",
    measureId: "A.5",
    obligation: "shall",
    title: "MFA on administrative and remote access",
    statement:
      "Multi-factor authentication shall be used for administrative access and for access to internet-facing services holding business-critical data.",
    question:
      "Is MFA enforced for admin accounts and for remote or cloud access?",
    evidence: ["MFA enforcement policy in the identity provider", "MFA coverage report"],
    domains: ["cloud"],
  },
  {
    id: "A.5.4(p)",
    measureId: "A.5",
    obligation: "should",
    title: "Extend MFA to all users",
    statement:
      "Where feasible, the organisation should extend multi-factor authentication to all user accounts.",
    question: "Is MFA enabled for all staff, not just admins?",
    evidence: ["MFA coverage percentage across all accounts"],
    domains: ["cloud"],
  },

  // ── A.6 Secure/Protect: Secure configuration ──────────────────────────────
  {
    id: "A.6.4(a)",
    measureId: "A.6",
    obligation: "shall",
    title: "Enforce secure configurations",
    statement:
      "Security configurations shall be enforced for hardware and software, replacing vendor defaults with hardened settings.",
    question:
      "Are systems configured to a hardened baseline rather than left on defaults?",
    evidence: [
      "Hardening baseline or benchmark used (e.g. CIS Benchmarks)",
      "Configuration screenshots or policy exports",
    ],
    domains: ["cloud", "ot", "ai"],
  },
  {
    id: "A.6.4(b)",
    measureId: "A.6",
    obligation: "shall",
    title: "Remove insecure protocols",
    statement:
      "Insecure configurations and weak protocols shall be replaced or disabled.",
    question:
      "Have weak protocols been disabled — old TLS versions, SMBv1, Telnet, plain FTP?",
    evidence: ["Protocol configuration on servers and network devices", "Scan output"],
    domains: ["cloud", "ot"],
  },
  {
    id: "A.6.4(c)",
    measureId: "A.6",
    obligation: "shall",
    title: "Disable unused features and services",
    statement:
      "Unused features, services or applications shall be disabled or removed to reduce the attack surface.",
    question: "Are unnecessary services, ports and features turned off?",
    evidence: ["Build standard listing disabled services", "Port review"],
    domains: ["cloud", "ot"],
  },
  {
    id: "A.6.4(d)",
    measureId: "A.6",
    obligation: "shall",
    title: "Third parties follow secure configuration",
    statement:
      "Ensure third parties managing your systems apply the same secure configuration expectations.",
    question: "Does your IT vendor apply secure configuration on your behalf?",
    evidence: ["Vendor service agreement covering hardening"],
    domains: ["cloud"],
  },
  {
    id: "A.6.4(e)",
    measureId: "A.6",
    obligation: "should",
    title: "Review configurations regularly",
    statement:
      "The organisation should review configurations on a regular basis to catch drift.",
    question: "Are configurations reviewed periodically for drift?",
    evidence: ["Configuration review log"],
    domains: ["cloud"],
  },
  {
    id: "A.6.4(f)",
    measureId: "A.6",
    obligation: "shall",
    title: "No automatic connection to open networks",
    statement:
      "Automatic connection to open or untrusted networks shall be disabled on devices.",
    question: "Are devices stopped from auto-joining open Wi-Fi networks?",
    evidence: ["Device Wi-Fi policy"],
    domains: [],
  },
  {
    id: "A.6.4(g)",
    measureId: "A.6",
    obligation: "shall",
    title: "Enable audit logging",
    statement:
      "Logging shall be enabled for audit events on systems holding or processing business-critical data, and logs retained for a defined period.",
    question: "Is audit logging switched on and are logs kept?",
    evidence: ["Logging configuration", "Stated retention period"],
    domains: ["cloud", "ot", "ai"],
  },
  {
    id: "A.6.4(h)",
    measureId: "A.6",
    obligation: "should",
    title: "Enable additional system logs",
    statement:
      "The organisation should enable other system logs that would help investigate an incident.",
    question: "Are additional logs kept to support investigations?",
    evidence: ["List of log sources collected"],
    domains: ["cloud"],
  },
  {
    id: "A.6.4(i)",
    measureId: "A.6",
    obligation: "should",
    title: "Automatic screen lock",
    statement:
      "As good practice, automatic lock or session log-out should be enabled after a period of inactivity.",
    question: "Do devices lock automatically when left idle?",
    evidence: ["Screen lock policy setting"],
    domains: [],
  },
  {
    id: "A.6.4(j)",
    measureId: "A.6",
    obligation: "shall",
    conditional: "mobile",
    title: "Mobile device secure configuration",
    statement:
      "Where mobile devices are in scope, apply secure configuration to them — passcode, encryption and remote wipe.",
    question:
      "Are company mobiles configured with passcodes, encryption and remote wipe?",
    evidence: ["MDM baseline configuration"],
    domains: ["cloud"],
  },

  // ── A.7 Update: Software updates ──────────────────────────────────────────
  {
    id: "A.7.4(a)",
    measureId: "A.7",
    obligation: "shall",
    title: "Prioritise and apply security patches",
    statement:
      "Prioritise the application of security patches, applying critical and high-severity updates promptly across operating systems, applications and firmware.",
    question:
      "Are security updates applied promptly, with critical ones prioritised?",
    evidence: ["Patch management procedure with target timeframes", "Patch reports"],
    domains: ["cloud", "ot", "ai"],
  },
  {
    id: "A.7.4(b)",
    measureId: "A.7",
    obligation: "should",
    title: "Compatibility testing before patching",
    statement:
      "The organisation should conduct compatibility testing before deploying updates to production.",
    question: "Are updates tested before wide deployment?",
    evidence: ["Test procedure or staged rollout evidence"],
    domains: ["ot"],
  },
  {
    id: "A.7.4(c)",
    measureId: "A.7",
    obligation: "should",
    title: "Enable automatic updates",
    statement:
      "The organisation should consider enabling automatic updates where it is safe to do so.",
    question: "Are automatic updates enabled where practical?",
    evidence: ["Update policy showing automatic updates enabled"],
    domains: ["cloud"],
  },
  {
    id: "A.7.4(d)",
    measureId: "A.7",
    obligation: "shall",
    conditional: "mobile",
    title: "Mobile device updates",
    statement:
      "Where mobile devices are in scope, keep their operating systems and applications updated.",
    question: "Are company mobile devices kept up to date?",
    evidence: ["MDM compliance report on OS versions"],
    domains: ["cloud"],
  },

  // ── A.8 Backup ────────────────────────────────────────────────────────────
  {
    id: "A.8.4(a)",
    measureId: "A.8",
    obligation: "shall",
    title: "Identify and back up essential data",
    statement:
      "Identify business-critical data and systems and back them up.",
    question: "Have you identified what data is essential, and is it backed up?",
    evidence: ["Backup scope document listing critical systems and data"],
    domains: ["cloud", "ot"],
  },
  {
    id: "A.8.4(b)",
    measureId: "A.8",
    obligation: "shall",
    title: "Backup frequency for critical systems",
    statement:
      "For business-critical data and systems, backups shall be performed at a frequency matched to how much data the business can afford to lose.",
    question: "Are critical systems backed up often enough to meet your recovery needs?",
    evidence: ["Backup schedule with stated RPO"],
    domains: ["cloud"],
  },
  {
    id: "A.8.4(c)",
    measureId: "A.8",
    obligation: "shall",
    title: "Backup approach for non-critical systems",
    statement:
      "For non-business-critical systems, define and apply an appropriate backup approach.",
    question: "Is there a defined backup approach for non-critical systems?",
    evidence: ["Backup policy covering all system tiers"],
    domains: ["cloud"],
  },
  {
    id: "A.8.4(d)",
    measureId: "A.8",
    obligation: "should",
    title: "Automate backups",
    statement:
      "The backup process should be automated rather than relying on someone remembering.",
    question: "Do backups run automatically?",
    evidence: ["Backup job schedule and success reports"],
    domains: ["cloud"],
  },
  {
    id: "A.8.4(e)",
    measureId: "A.8",
    obligation: "shall",
    conditional: "servers",
    title: "Back up in-scope hardware and systems",
    statement:
      "Where servers and systems are in scope, include their configurations and data in the backup.",
    question: "Are server configurations backed up, not just files?",
    evidence: ["Backup scope including system state or images"],
    domains: ["cloud", "ot"],
  },
  {
    id: "A.8.4(f)",
    measureId: "A.8",
    obligation: "shall",
    title: "Protect backups",
    statement:
      "All backups shall be protected from unauthorised access and modification, including encryption where appropriate.",
    question: "Are backups encrypted and access-restricted?",
    evidence: ["Backup encryption setting", "Backup access control list"],
    domains: ["cloud"],
  },
  {
    id: "A.8.4(g)",
    measureId: "A.8",
    obligation: "shall",
    title: "Store backups separately and offline",
    statement:
      "Backups shall be stored separately and isolated from the live environment, so ransomware reaching production cannot reach the backup.",
    question:
      "Is at least one backup copy kept offline or otherwise isolated from your network?",
    evidence: ["Offline, immutable or air-gapped copy described in backup design"],
    domains: ["cloud"],
  },
  {
    id: "A.8.4(h)",
    measureId: "A.8",
    obligation: "should",
    title: "Frequent backups",
    statement:
      "Frequent backups, for example daily or weekly, should be performed.",
    question: "Are backups run at least weekly?",
    evidence: ["Backup logs showing frequency"],
    domains: [],
  },
  {
    id: "A.8.4(i)",
    measureId: "A.8",
    obligation: "should",
    title: "Test restoration",
    statement:
      "As good practice, backups should be tested at regular intervals by restoring from them.",
    question: "Have you tested restoring from backup, and did it work?",
    evidence: ["Restore test record with date and outcome"],
    domains: ["cloud"],
  },

  // ── A.9 Respond ───────────────────────────────────────────────────────────
  {
    id: "A.9.4(a)",
    measureId: "A.9",
    obligation: "shall",
    title: "Maintain an incident response plan",
    statement:
      "Establish an up-to-date incident response plan covering roles and responsibilities, detection, containment, eradication, recovery, and notification of authorities such as PDPC and CSA where required.",
    question:
      "Do you have a written incident response plan naming who does what?",
    evidence: [
      "Incident response plan document",
      "Contact list including regulator notification paths",
    ],
    domains: ["cloud", "ot", "ai"],
  },
  {
    id: "A.9.4(b)",
    measureId: "A.9",
    obligation: "shall",
    title: "Communicate the plan",
    statement:
      "The incident response plan shall be communicated to the employees who need to act on it.",
    question: "Do the relevant staff know the plan exists and what their role is?",
    evidence: ["Distribution record or briefing attendance"],
    domains: ["ot"],
  },
  {
    id: "A.9.4(c)",
    measureId: "A.9",
    obligation: "should",
    title: "Post-incident review",
    statement:
      "The organisation should conduct post-incident reviews and feed lessons learned back into the plan.",
    question: "Do you review what happened after an incident and update the plan?",
    evidence: ["Post-incident review notes"],
    domains: ["cloud", "ai"],
  },
  {
    id: "A.9.4(d)",
    measureId: "A.9",
    obligation: "should",
    title: "Exercise the plan",
    statement:
      "As good practice, the incident response plan should be tested or exercised periodically.",
    question: "Have you run a tabletop exercise or drill of the plan?",
    evidence: ["Exercise report with date and participants"],
    domains: ["cloud", "ot"],
  },
];

// ── Derived lookups ─────────────────────────────────────────────────────────

export const CLAUSES_BY_MEASURE: Record<MeasureId, Clause[]> = MEASURES.reduce(
  (acc, m) => {
    acc[m.id] = CLAUSES.filter((c) => c.measureId === m.id);
    return acc;
  },
  {} as Record<MeasureId, Clause[]>,
);

export const CLAUSE_BY_ID = new Map(CLAUSES.map((c) => [c.id, c]));
export const MEASURE_BY_ID = new Map(MEASURES.map((m) => [m.id, m]));

export function measuresInCategory(category: CategoryId): Measure[] {
  return MEASURES.filter((m) => m.category === category);
}

/** Clauses that apply given the scope the SME declared during onboarding. */
export function applicableClauses(scope: {
  mobile: boolean;
  byod: boolean;
  servers: boolean;
}): Clause[] {
  return CLAUSES.filter((c) => !c.conditional || scope[c.conditional]);
}
