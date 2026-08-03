/**
 * The readiness layer: what to DO about each clause, and what to say when the
 * SME doesn't know what the question means.
 *
 * Borrowed from IASME's Cyber Essentials Readiness Tool, which gets two things
 * right that most compliance questionnaires get wrong:
 *
 *   1. "I don't know" is a real answer, phrased as the question the user would
 *      actually ask — "What is an asset register?", "What is MFA?". A tool that
 *      only offers Yes/No pushes an unsure SME into guessing, and a guessed Yes
 *      is worse than an honest "not sure" because it survives all the way to the
 *      assessor. Here, `notSure` turns that moment into the explanation.
 *
 *   2. The output is an action plan, not a score. Every unmet clause carries one
 *      concrete imperative — something a non-technical owner can do on Monday —
 *      rather than a restatement of the requirement they just failed.
 *
 * Actions name the products Singapore SMEs actually run (Microsoft 365, Google
 * Workspace) because "configure your identity provider" helps nobody.
 */

export interface ClauseHelp {
  /** One concrete imperative. What to do on Monday. */
  action: string;
  /** Shown when the SME answers "I'm not sure" — explains, never scolds. */
  notSure?: string;
}

export const CLAUSE_HELP: Record<string, ClauseHelp> = {
  // ── A.1 People ────────────────────────────────────────────────────────────
  "A.1.4(a)": {
    action:
      "Book a one-hour session for all staff using CSA's free SG Cyber Safe employee toolkit, and keep the attendance list — that list is your evidence.",
    notSure:
      "This is asking whether your staff have been taught to spot scams and handle data safely. It does not have to be a paid course; a session you run yourself using CSA's free materials counts, as long as you can show who attended.",
  },
  "A.1.4(b)": {
    action:
      "Write a one-page 'how we work safely' note covering passwords, suspicious emails, and who to tell when something looks wrong. Put it in the staff handbook.",
    notSure:
      "Cyber hygiene guidelines are simply the everyday rules you expect staff to follow — like locking your screen and not reusing passwords. One page is enough for most SMEs.",
  },
  "A.1.4(c)": {
    action:
      "Check your one-pager covers all six: phishing and deepfakes, MFA and passphrases, personal devices used for work, handling customer data, working from home or on the road, and how to report an incident.",
  },
  "A.1.4(d)": {
    action:
      "Add two short extras: a briefing for the owner or directors on why this matters commercially, and PDPC's free e-learning for anyone who handles customer personal data.",
  },
  "A.1.4(e)": {
    action: "Put a recurring calendar reminder to repeat the session in twelve months.",
  },

  // ── A.2 Hardware and software ─────────────────────────────────────────────
  "A.2.4(a)": {
    action:
      "Open a spreadsheet and list every laptop, phone, server, router and piece of software you own. CSA accepts a spreadsheet — you do not need to buy a tool.",
    notSure:
      "An asset inventory is just a list of the computers, phones, network boxes and software your business uses, and who has each one. It matters because you cannot protect or patch something you have forgotten you own.",
  },
  "A.2.4(b)": {
    action:
      "Walk the office and check nothing is missing from the list — especially the router, the network printer, any CCTV or door-access box, and the NAS in the corner.",
    notSure:
      "In-scope hardware means everything that connects to your network: laptops, desktops, phones and tablets, routers and firewalls, servers, and 'smart' devices like cameras and printers.",
  },
  "A.2.4(c)": {
    action: "Add three columns to the hardware rows: who uses it, where it lives, and when vendor support ends.",
  },
  "A.2.4(d)": {
    action: "Add version and end-of-support date to each software row. Your IT vendor can fill these in if you ask.",
  },
  "A.2.4(e)": {
    action: "Diarise a 30-minute inventory review every six months and note the date you did it.",
  },
  "A.2.4(f)": {
    action:
      "Filter the inventory for anything past end-of-support — old Windows versions are the usual culprit — and plan replacement or upgrade.",
    notSure:
      "End of support (EOS) means the manufacturer has stopped issuing security fixes. Once that happens, any new flaw found stays open forever, so attackers target these systems first.",
  },
  "A.2.4(g)": {
    action:
      "For any end-of-support device you genuinely cannot replace yet, put it on its own network segment, restrict who can reach it, and write down that the owner has accepted the risk and by when it will be replaced.",
  },
  "A.2.4(h)": {
    action:
      "Decide who signs off new hardware and software — in a small business this is usually the owner — and write that one line down.",
  },
  "A.2.4(i)": { action: "Add an 'approved on' date column to the inventory." },
  "A.2.4(j)": {
    action:
      "Remove software nobody approved. On Windows, restrict staff from installing software by not giving them local administrator rights.",
  },
  "A.2.4(k)": {
    action:
      "Before any laptop or phone leaves the business, factory-reset it with encryption on, or have your disposal vendor issue a wipe certificate.",
  },
  "A.2.4(l)": { action: "Add a 'disposed on' column and update the inventory when kit leaves." },

  // ── A.3 Data ──────────────────────────────────────────────────────────────
  "A.3.4(a)": {
    action:
      "List the handful of things you could not trade without — customer records, invoices, designs, patient files — and write down where each one is stored and who owns it.",
    notSure:
      "This is asking what your important data is and where it lives. Not every file: the ones that would hurt if they were leaked, lost or locked up.",
  },
  "A.3.4(b)": { action: "Review the data list once a year, or whenever you adopt a new system." },
  "A.3.4(c)": {
    action:
      "Turn on device encryption everywhere — BitLocker on Windows Pro, FileVault on Mac — and make sure every public-facing site is HTTPS-only.",
    notSure:
      "Encryption scrambles data so it is unreadable without the key. 'At rest' means on the disk if the laptop is stolen; 'in transit' means while travelling over the internet. Both are switches you turn on, not products you buy.",
  },
  "A.3.4(d)": {
    action:
      "Review sharing settings on your cloud drive for anything set to 'anyone with the link', and decide your position on USB sticks and personal email.",
    notSure:
      "This is about stopping important data leaving by accident or on purpose — a file shared publicly, copied to a USB stick, or forwarded to a personal account.",
  },
  "A.3.4(e)": {
    action: "Physically destroy or securely wipe old drives, USB sticks and backup tapes before disposal.",
  },

  // ── A.4 Malware and firewalls ─────────────────────────────────────────────
  "A.4.4(a)": {
    action:
      "Confirm anti-malware is on every machine including servers. Windows Defender is built in and acceptable — just check it is actually switched on.",
    notSure:
      "Anti-malware (or antivirus) detects and blocks malicious software. If you run Windows 10 or 11, Microsoft Defender is already included and counts, provided it is enabled and updating.",
  },
  "A.4.4(b)": { action: "Check real-time protection and scheduled scans are both enabled, not just installed." },
  "A.4.4(c)": { action: "Confirm virus definitions update automatically — check the 'last updated' date shows today or yesterday." },
  "A.4.4(d)": { action: "Make sure work phones and tablets have protection appropriate to the platform, and keep them on the official app store." },
  "A.4.4(e)": {
    action:
      "Confirm your internet router's firewall is on and no admin interface is reachable from the internet, and leave the built-in firewall on each laptop enabled.",
    notSure:
      "A firewall filters traffic between your network and the internet, blocking unwanted connections. You almost certainly have one already in your internet router — the question is whether it is switched on and sensibly configured.",
  },
  "A.4.4(f)": { action: "Ask whoever manages your router to review the rules once a year and tell you what they removed." },
  "A.4.4(g)": { action: "Require staff to use a VPN, or their phone's own data, rather than open public Wi-Fi for work." },
  "A.4.4(h)": { action: "Tell staff to install apps only from the Microsoft Store, Apple App Store or Google Play, and enforce it where you can." },
  "A.4.4(i)": { action: "Check every piece of software is properly licensed and still supported — no cracked or abandoned versions." },
  "A.4.4(j)": { action: "Tell staff exactly who to call if a machine behaves oddly, and make clear nobody gets blamed for reporting." },

  // ── A.5 Access control ────────────────────────────────────────────────────
  "A.5.4(a)": {
    action:
      "Export the user list from Microsoft 365 or Google Workspace — that export is your account inventory. Write down who approves new accounts and who removes leavers.",
    notSure:
      "Account management means keeping track of who has a login, granting access deliberately, and removing it when someone leaves. The list itself is usually one export away.",
  },
  "A.5.4(b)": { action: "Add columns for the person's name, whether the account is standard or administrator, and which systems it reaches." },
  "A.5.4(c)": { action: "Agree that new accounts and access changes need a yes from the owner or manager first, and keep the emails as evidence." },
  "A.5.4(d)": {
    action: "Check nobody has access they no longer need — most people accumulate it as they change roles.",
    notSure:
      "Least privilege means each person can reach only what their job needs. It limits the damage when an account is compromised, because the attacker inherits only that person's access.",
  },
  "A.5.4(e)": {
    action:
      "Cross-check your account list against your staff list and disable anyone who has left. Make account removal part of the leaving checklist.",
  },
  "A.5.4(f)": {
    action:
      "Give each administrator a second, normal account for day-to-day email and browsing, and use the admin account only when actually administering something.",
    notSure:
      "An administrator account can change anything. If someone reads email while logged in as an administrator and clicks a bad link, the malware inherits those powers — which is why the two roles are kept in separate accounts.",
  },
  "A.5.4(g)": { action: "List every vendor with access to your systems, and set an end date on each one." },
  "A.5.4(h)": { action: "Check your IT vendor's contract says something about security responsibilities. If it says nothing, ask them to add it." },
  "A.5.4(i)": {
    action:
      "Set a minimum password standard in Microsoft 365 or Google Workspace — length over complexity — and block the common breached passwords.",
  },
  "A.5.4(j)": { action: "Lock the room or cabinet holding your server, router and backup drive, and keep the key list short." },
  "A.5.4(k)": { action: "Diarise a twice-yearly look through the account list, and note what you changed." },
  "A.5.4(l)": {
    action:
      "Change the default password on every router, NAS, camera, printer and door controller. These are the accounts attackers try first because the defaults are published online.",
    notSure:
      "Default passwords are the ones a device ships with, like admin/admin. They are listed publicly for every model, so a device still using one is effectively unprotected.",
  },
  "A.5.4(m)": { action: "Turn on account lockout after a set number of failed logins — it is a checkbox in Microsoft 365 and Google Workspace." },
  "A.5.4(n)": { action: "Write one line into your incident plan: if we think an account is compromised, we reset that password and sign the account out everywhere." },
  "A.5.4(o)": {
    action:
      "Turn on multi-factor authentication for every administrator today. In Microsoft 365 and Google Workspace this is a single tenant-wide setting and it is free.",
    notSure:
      "Multi-factor authentication (MFA) asks for a second proof beyond the password — usually a code or a prompt on your phone. It is the single most effective control here, because a stolen password alone stops being enough.",
  },
  "A.5.4(p)": { action: "Once admins are covered, roll MFA out to all staff. Expect a week of grumbling and then silence." },

  // ── A.6 Secure configuration ──────────────────────────────────────────────
  "A.6.4(a)": {
    action:
      "Adopt a published hardening baseline rather than inventing one. CIS Benchmarks are free PDFs covering Windows, macOS, Microsoft 365 and Google Workspace — pick the ones matching what you run and work through the level 1 items.",
    notSure:
      "Secure configuration means changing the settings a device ships with, because manufacturers ship for convenience rather than safety. A published benchmark saves you deciding what 'secure' means yourself.",
  },
  "A.6.4(b)": {
    action:
      "Ask whoever runs your website and mail to disable TLS 1.0 and 1.1, SMBv1, Telnet and plain FTP. This tool checks the TLS part of that from outside.",
    notSure:
      "Some ways computers talk to each other are old and have known flaws that cannot be fixed. Turning them off is usually a setting change, not a purchase.",
  },
  "A.6.4(c)": { action: "Turn off features and services you do not use — remote desktop exposed to the internet is the one that most often causes trouble." },
  "A.6.4(d)": { action: "Ask your IT vendor in writing whether they apply a hardening standard, and which one." },
  "A.6.4(e)": { action: "Re-check key settings once a year — configurations drift as people troubleshoot things." },
  "A.6.4(f)": { action: "Turn off automatic Wi-Fi joining on work laptops and phones so they cannot silently attach to a rogue hotspot." },
  "A.6.4(g)": {
    action:
      "Turn on audit logging for your email and file systems and decide how long you keep the logs — six months is a reasonable SME default.",
    notSure:
      "Audit logs record who did what and when. You will not read them day to day, but without them it is impossible to work out what happened after an incident.",
  },
  "A.6.4(h)": { action: "Where it is free to do so, keep sign-in and file-access logs too." },
  "A.6.4(i)": { action: "Set screens to lock automatically after a few minutes idle, on laptops and phones alike." },
  "A.6.4(j)": { action: "On work phones require a passcode, keep encryption on, and make sure you can wipe a lost device remotely." },

  // ── A.7 Updates ───────────────────────────────────────────────────────────
  "A.7.4(a)": {
    action:
      "Turn on automatic updates for Windows, macOS and browsers, and set yourself a rule for how fast critical patches go on — 14 days is a common SME target.",
    notSure:
      "Updates fix security flaws attackers already know about. Most break-ins use a flaw that was patched months earlier, which is why this is one of the highest-value things on the list.",
  },
  "A.7.4(b)": { action: "For anything business-critical, update one machine first and check it still works before doing the rest." },
  "A.7.4(c)": { action: "Leave automatic updates on wherever it is safe — for most SMEs that is everywhere." },
  "A.7.4(d)": { action: "Check work phones are on a current OS version and still receiving updates from the manufacturer." },

  // ── A.8 Backup ────────────────────────────────────────────────────────────
  "A.8.4(a)": {
    action: "Decide what you could not trade without tomorrow morning, and confirm that specific thing is being backed up.",
    notSure:
      "Start from the business, not the technology: if the office burned down tonight, what would you need on Monday to keep invoicing customers? That is what has to be backed up.",
  },
  "A.8.4(b)": { action: "Match backup frequency to how much work you could afford to redo — for most SMEs that means daily." },
  "A.8.4(c)": { action: "Write down the lighter backup approach for everything that is not business-critical." },
  "A.8.4(d)": { action: "Make backups automatic. A backup that depends on someone remembering is not a backup." },
  "A.8.4(e)": { action: "Include server configurations and system images, not just the data files sitting on them." },
  "A.8.4(f)": { action: "Encrypt the backup and restrict who can reach it — ideally not the same account you use daily." },
  "A.8.4(g)": {
    action:
      "Keep at least one copy offline or immutable. A cloud drive that syncs continuously is not isolated: ransomware encrypts your files and the sync obediently copies the damage.",
    notSure:
      "Isolated means the backup cannot be reached and destroyed from your normal network. That is either a drive you physically unplug, or a cloud backup with immutability switched on so even an administrator cannot delete it.",
  },
  "A.8.4(h)": { action: "Run backups at least weekly, daily if you can." },
  "A.8.4(i)": {
    action:
      "Restore one real file from backup this week and write down the date and result. This is the clause that most often fails at audit, because untested backups fail silently for months.",
  },

  // ── A.9 Respond ───────────────────────────────────────────────────────────
  "A.9.4(a)": {
    action:
      "Write two pages: who decides, who calls whom, what gets disconnected first, and the phone numbers — your IT vendor, your bank, SingCERT, and PDPC if personal data is involved.",
    notSure:
      "An incident response plan is the note you write while calm, so that nobody has to improvise at 6am on a Sunday. Two pages beats a hundred-page document nobody opens.",
  },
  "A.9.4(b)": { action: "Send the plan to everyone named in it and confirm they know they are named in it." },
  "A.9.4(c)": { action: "After any incident, even a small one, spend twenty minutes on what you would change, and update the plan." },
  "A.9.4(d)": {
    action:
      "Talk one scenario through over lunch — 'we arrive Monday and the files are encrypted' — and see which questions the plan cannot answer yet.",
  },
};

export function helpFor(clauseId: string): ClauseHelp | undefined {
  return CLAUSE_HELP[clauseId];
}

// ── Scoping ─────────────────────────────────────────────────────────────────

/**
 * Scoping runs before any control question, for the same reason Cyber Essentials
 * scopes before assessing: the answers decide which clauses apply at all, and an
 * assessment against the wrong boundary is worthless however carefully answered.
 */
export interface ScopingQuestion {
  id: string;
  question: string;
  /** Plain-language footnote, as IASME does under each scoping question. */
  note?: string;
  options: Array<{ value: string; label: string }>;
}

export const SCOPING_QUESTIONS: ScopingQuestion[] = [
  {
    id: "boundary",
    question: "Would this assessment cover your whole organisation?",
    note:
      "Cyber Essentials can cover everything, or a defined part of the business such as one office or one system. Whole-organisation is simpler and is what most SMEs choose — a sub-scope has to be genuinely separable, with its own network boundary.",
    options: [
      { value: "whole", label: "Yes, it would cover the whole organisation" },
      { value: "part", label: "No, only part of the organisation" },
      { value: "unsure", label: "I am not sure what the difference means" },
    ],
  },
  {
    id: "who-runs-it",
    question: "Who looks after your IT day to day?",
    note:
      "This changes who has to do the work, not what the requirements are. Plenty of certified organisations have no internal IT at all.",
    options: [
      { value: "internal", label: "Someone in-house looks after it" },
      { value: "vendor", label: "An external IT company or vendor" },
      { value: "mixed", label: "A bit of both" },
      { value: "nobody", label: "Nobody really — we manage as we go" },
    ],
  },
  {
    id: "homeworking",
    question: "Do staff ever work from home or outside the office?",
    note:
      "Home and remote working brings personal networks and devices into scope, which affects the access control and configuration questions later.",
    options: [
      { value: "yes", label: "Yes, regularly or occasionally" },
      { value: "no", label: "No, everyone works on site" },
    ],
  },
];

/**
 * The promise made to the SME before it starts.
 *
 * The time estimate is honest rather than flattering. IASME quotes 20-40 minutes
 * for roughly 40 questions; this framework has 75 clauses, so quoting their
 * number would be borrowing a figure that does not apply and guaranteeing a
 * mid-form abandonment when it turns out to be wrong.
 *
 * The coverage line is here for the same reason. Claiming the assessment is
 * automated when a third of it is would be discovered by the user at exactly the
 * moment they most need to trust the output.
 */
export const READINESS_PROMISE = {
  minutes: "about an hour, and you can stop anywhere",
  points: [
    "This is not a pass or fail test. Nothing here is submitted to anyone.",
    "If you do not know what a question means, say so — that is a real answer and it will explain rather than mark you down.",
    "The scan answers roughly a third of it for you. The rest only you can answer, because it is about how your business actually works.",
    "At the end you get a list of actions, in the order worth doing them.",
  ],
};
