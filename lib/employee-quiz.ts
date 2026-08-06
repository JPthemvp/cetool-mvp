/**
 * CSA SG Cyber Safe — Employee Cybersecurity Quiz
 *
 * Source: https://www.surveymonkey.com/r/sgcybersafe-employee
 * © Cyber Security Agency of Singapore. Used for awareness training purposes.
 *
 * 14 questions across 4 tips:
 *   Tip 1: Protect yourself from phishing (Q1–4)
 *   Tip 2: Set strong passphrases and protect them (Q5–9)
 *   Tip 3: Protect your corporate and/or personal devices (Q10–12)
 *   Tip 4: Report cyber incidents (Q13–14)
 */

export interface QuizOption {
  letter: "a" | "b" | "c" | "d";
  text: string;
}

export interface QuizQuestion {
  number: number;
  tip: string;
  tipNumber: number;
  question: string;
  options: QuizOption[];
  /** Correct answer letter */
  answer: "a" | "b" | "c" | "d";
  /** Short explanation shown after answering */
  explanation: string;
}

export const EMPLOYEE_QUIZ: QuizQuestion[] = [
  // ── Tip 1: Phishing ──────────────────────────────────────────────────────
  {
    number: 1,
    tipNumber: 1,
    tip: "Protect yourself from phishing",
    question: "Which of the following are communication channels used in phishing attempts?",
    options: [
      { letter: "a", text: "Email" },
      { letter: "b", text: "Telephone" },
      { letter: "c", text: "Social Media" },
      { letter: "d", text: "All of the above" },
    ],
    answer: "d",
    explanation: "Phishing can happen via email, phone calls (vishing), SMS (smishing), and social media. Always be alert across all channels.",
  },
  {
    number: 2,
    tipNumber: 1,
    tip: "Protect yourself from phishing",
    question: "Which statement about social engineering is false?",
    options: [
      { letter: "a", text: "Social engineering is always technological in nature" },
      { letter: "b", text: "Phishing is a type of social engineering which uses digital communication channels" },
      { letter: "c", text: "Tailgating or following an employee into the office is an example of social engineering" },
      { letter: "d", text: "Social engineering is about psychologically manipulating someone into believing what you say" },
    ],
    answer: "a",
    explanation: "Social engineering is NOT always technological — physical tactics like tailgating are also social engineering. It is about psychological manipulation, not just digital attacks.",
  },
  {
    number: 3,
    tipNumber: 1,
    tip: "Protect yourself from phishing",
    question: "Which message content helps you to confirm whether it is from a legitimate source?",
    options: [
      { letter: "a", text: "Email from a software service provider that you use" },
      { letter: "b", text: "Social media post with professional looking logos" },
      { letter: "c", text: "Email with perfect grammar and no misspelling" },
      { letter: "d", text: "None of the above" },
    ],
    answer: "d",
    explanation: "None of these alone confirm legitimacy. Attackers can spoof sender names, copy logos, and use flawless grammar. Always verify through official channels.",
  },
  {
    number: 4,
    tipNumber: 1,
    tip: "Protect yourself from phishing",
    question: "Which of the following is an example of a common phishing scenario?",
    options: [
      { letter: "a", text: "Pretending to be an officer from the Cyber Security Agency of Singapore and asking you to provide your corporate data to check if you have been cyber attacked" },
      { letter: "b", text: "Pretending to be an e-commerce shop and advertising a limited offer with their promotion code" },
      { letter: "c", text: "Pretending to be a delivery officer and sending you an email or text message to say that you have to pay a fee to receive your parcel" },
      { letter: "d", text: "All of the above" },
    ],
    answer: "d",
    explanation: "All three are real phishing tactics. Impersonating authorities, fake promotions, and parcel delivery scams are among the most common scenarios in Singapore.",
  },

  // ── Tip 2: Passphrases ───────────────────────────────────────────────────
  {
    number: 5,
    tipNumber: 2,
    tip: "Set strong passphrases and protect them",
    question: "Which of the following does not describe passphrases?",
    options: [
      { letter: "a", text: "Sequence of characters, e.g. Qwerty12345" },
      { letter: "b", text: "Harder for machines to crack" },
      { letter: "c", text: "More secure than passwords" },
      { letter: "d", text: "Easier to remember" },
    ],
    answer: "a",
    explanation: "A passphrase is a sequence of words, not a simple string of characters like 'Qwerty12345'. Passphrases are longer, more memorable, and harder to crack.",
  },
  {
    number: 6,
    tipNumber: 2,
    tip: "Set strong passphrases and protect them",
    question: "Which of the following is a strong passphrase?",
    options: [
      { letter: "a", text: "iloveyou4ever" },
      { letter: "b", text: "BirthD@Y200594" },
      { letter: "c", text: "IhadKAYAtoastKOPI@8am" },
      { letter: "d", text: "P@assword1234!" },
    ],
    answer: "c",
    explanation: "'IhadKAYAtoastKOPI@8am' is a strong passphrase — long, uses multiple words, mixed case, and a special character. It is also memorable.",
  },
  {
    number: 7,
    tipNumber: 2,
    tip: "Set strong passphrases and protect them",
    question: "Which of the following is not a good passphrase practice?",
    options: [
      { letter: "a", text: "Using the same passphrases for different accounts" },
      { letter: "b", text: "Not writing down your passphrase" },
      { letter: "c", text: "Not sharing your passphrase with anyone" },
      { letter: "d", text: "Using Multi-Factor Authentication for your accounts" },
    ],
    answer: "a",
    explanation: "Reusing passphrases across accounts is dangerous — if one account is compromised, attackers can access all others. Always use unique passphrases per account.",
  },
  {
    number: 8,
    tipNumber: 2,
    tip: "Set strong passphrases and protect them",
    question: "What are the key considerations in selecting a software that helps you to manage your passphrases?",
    options: [
      { letter: "a", text: "Software supports Multi-Factor Authentication" },
      { letter: "b", text: "Software does not come from authorised sources" },
      { letter: "c", text: "Software does not have good reviews" },
      { letter: "d", text: "Software provider does not have a strong track record" },
    ],
    answer: "a",
    explanation: "A good password manager should support MFA, come from a reputable and authorised source, have strong reviews, and the provider should have a proven track record.",
  },
  {
    number: 9,
    tipNumber: 2,
    tip: "Set strong passphrases and protect them",
    question: "Which of the following is a Multi-Factor Authentication key?",
    options: [
      { letter: "a", text: "Biometric" },
      { letter: "b", text: "Pin" },
      { letter: "c", text: "Passphrase" },
      { letter: "d", text: "All of the above" },
    ],
    answer: "d",
    explanation: "MFA combines two or more factors: something you know (PIN/passphrase), something you have (token/phone), and something you are (biometric). All listed options can be MFA factors.",
  },

  // ── Tip 3: Device Protection ─────────────────────────────────────────────
  {
    number: 10,
    tipNumber: 3,
    tip: "Protect your corporate and/or personal devices used for work",
    question: "Which of the following is not a good practice in protecting your device from loss/theft and unauthorised access?",
    options: [
      { letter: "a", text: "Using a laptop lock" },
      { letter: "b", text: "Using passwords, PINs, biometric locks or patterns" },
      { letter: "c", text: "Backing up your data" },
      { letter: "d", text: "Enabling the device's automatic networking features" },
    ],
    answer: "d",
    explanation: "Enabling automatic Wi-Fi or Bluetooth is a security risk — devices can auto-connect to rogue networks. Always manually approve network connections.",
  },
  {
    number: 11,
    tipNumber: 3,
    tip: "Protect your corporate and/or personal devices used for work",
    question: "Which of the following is not a good practice when using wireless access?",
    options: [
      { letter: "a", text: "Using only trusted networks" },
      { letter: "b", text: "Using Virtual Private Networks (VPNs)" },
      { letter: "c", text: "Enabling the automatic connection to Wi-Fi hotspots" },
      { letter: "d", text: "Using mobile phone's hot spot" },
    ],
    answer: "c",
    explanation: "Auto-connecting to Wi-Fi hotspots is dangerous — your device may connect to a malicious 'evil twin' network. Always connect manually to networks you trust.",
  },
  {
    number: 12,
    tipNumber: 3,
    tip: "Protect your corporate and/or personal devices used for work",
    question: "Which of the following is an example of a good practice in software security?",
    options: [
      { letter: "a", text: "Enabling automatic software updates" },
      { letter: "b", text: "Rebooting your device after the software update" },
      { letter: "c", text: "Applying software security patches to corporate and personal devices" },
      { letter: "d", text: "All of the above" },
    ],
    answer: "d",
    explanation: "All three are essential. Updates patch vulnerabilities; rebooting ensures patches are applied; and patching both corporate and personal devices closes all exposure points.",
  },

  // ── Tip 4: Incident Reporting ────────────────────────────────────────────
  {
    number: 13,
    tipNumber: 4,
    tip: "Report cyber incidents (including suspected incidents)",
    question: "Which of the following is a reason to report cyber incidents?",
    options: [
      { letter: "a", text: "Preventing potential harm from the incident" },
      { letter: "b", text: "Alerting the IT teams to potential or occurring cyber attacks" },
      { letter: "c", text: "Providing information to IT teams to diagnose the incident" },
      { letter: "d", text: "All of the above" },
    ],
    answer: "d",
    explanation: "Reporting promptly enables your IT team to contain the incident, prevent spread, and gather diagnostic information. Even suspected incidents should be reported immediately.",
  },
  {
    number: 14,
    tipNumber: 4,
    tip: "Report cyber incidents (including suspected incidents)",
    question: "Which of the following is a common cyber incident?",
    options: [
      { letter: "a", text: "Ransomware attack" },
      { letter: "b", text: "Malware attack" },
      { letter: "c", text: "Data breach" },
      { letter: "d", text: "All of the above" },
    ],
    answer: "d",
    explanation: "Ransomware, malware, and data breaches are all common cyber incidents that employees should be able to recognise and report. SingCERT at csa.gov.sg/singcert/reporting handles national-level incidents.",
  },
];

export const QUIZ_TIPS = [
  { number: 1, label: "Tip 1: Protect yourself from phishing", questions: [1, 2, 3, 4] },
  { number: 2, label: "Tip 2: Set strong passphrases and protect them", questions: [5, 6, 7, 8, 9] },
  { number: 3, label: "Tip 3: Protect your corporate and/or personal devices", questions: [10, 11, 12] },
  { number: 4, label: "Tip 4: Report cyber incidents", questions: [13, 14] },
];

// ── Export formatters ────────────────────────────────────────────────────────

/** Plain text format — works for SurveyMonkey, Microsoft Forms, Google Forms */
export function quizToPlainText(): string {
  const lines: string[] = [
    "CSA SG Cyber Safe — Employee Cybersecurity Quiz",
    "Source: https://www.surveymonkey.com/r/sgcybersafe-employee",
    "© Cyber Security Agency of Singapore",
    "",
    "INSTRUCTIONS FOR FORM BUILDERS",
    "─────────────────────────────────────────────────────────────",
    "SurveyMonkey / Google Forms / Microsoft Forms:",
    "  • Question type: Multiple Choice",
    "  • Mark the correct answer (shown after each question) as the 'correct' option",
    "  • Enable scoring in form settings to auto-calculate scores",
    "  • Collect respondent name/email to build a tracking database",
    "",
    "Kahoot:",
    "  • Question type: Quiz",
    "  • Set time limit: 30–60 seconds per question",
    "  • Enable 'Points' for leaderboard",
    "",
    "Mentimeter:",
    "  • Question type: Quiz (Competition) or Multiple Choice",
    "  • Use 'Audience Pace' for self-serve or 'Presenter Pace' for live sessions",
    "",
    "─────────────────────────────────────────────────────────────",
    "",
  ];

  let currentTip = 0;
  for (const q of EMPLOYEE_QUIZ) {
    if (q.tipNumber !== currentTip) {
      currentTip = q.tipNumber;
      const tip = QUIZ_TIPS.find(t => t.number === currentTip)!;
      lines.push(`${"═".repeat(60)}`);
      lines.push(`  ${tip.label.toUpperCase()}`);
      lines.push(`${"═".repeat(60)}`);
      lines.push("");
    }
    lines.push(`Q${q.number}. ${q.question}`);
    for (const o of q.options) {
      lines.push(`   ${o.letter.toUpperCase()}. ${o.text}`);
    }
    lines.push(`   ✓ Correct answer: ${q.answer.toUpperCase()}`);
    lines.push(`   💡 ${q.explanation}`);
    lines.push("");
  }

  lines.push("─────────────────────────────────────────────────────────────");
  lines.push("TRACKING RECOMMENDATION");
  lines.push("─────────────────────────────────────────────────────────────");
  lines.push("");
  lines.push("CSA recommends tracking employee quiz scores to:");
  lines.push("  • Identify staff who may need additional training");
  lines.push("  • Demonstrate cybersecurity awareness compliance to assessors");
  lines.push("  • Meet Cyber Essentials clause A.1 on employee awareness training");
  lines.push("");
  lines.push("Suggested database fields to track:");
  lines.push("  Employee Name | Department | Date Taken | Score (/ 14) | Pass/Fail (≥ 10/14) | Retake Date");
  lines.push("");
  lines.push("Pass threshold: CSA recommends ≥ 70% (10/14 questions correct).");
  lines.push("Retest: Staff who score below the threshold should be retested after targeted training.");
  lines.push("");
  lines.push("SingCERT incident reporting: https://www.csa.gov.sg/singcert/reporting");

  return lines.join("\n");
}

/** CSV format — importable into Excel/Sheets for tracking database */
export function quizToTrackingCsvTemplate(): string {
  const header = "Employee Name,Department,Date Taken,Score (/14),Percentage,Pass (Y/N),Retake Required,Retake Date,Notes";
  const example = "e.g. Tan Ah Hock,Logistics,01/08/2026,12,85.7%,Y,N,,";
  return [header, example].join("\n");
}

/** Kahoot-style format (Question | Answer A | Answer B | Answer C | Answer D | Correct | Time) */
export function quizToKahootCsv(): string {
  const header = "Question,Answer 1,Answer 2,Answer 3,Answer 4,Time (sec),Correct Answer";
  const rows = EMPLOYEE_QUIZ.map(q => {
    const opts = q.options;
    const correctIndex = opts.findIndex(o => o.letter === q.answer) + 1;
    return [
      `"${q.question}"`,
      `"${opts[0]?.text ?? ""}"`,
      `"${opts[1]?.text ?? ""}"`,
      `"${opts[2]?.text ?? ""}"`,
      `"${opts[3]?.text ?? ""}"`,
      "30",
      correctIndex,
    ].join(",");
  });
  return [header, ...rows].join("\n");
}
