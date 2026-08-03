/**
 * The macOS and Linux equivalent of the PowerShell check.
 *
 * Plenty of Singapore SMEs — design studios, media, F&B, anyone who bought Macs
 * because they did not want to run a Windows domain — got nothing from a
 * Windows-only toolkit. Their clauses were assessable in principle and
 * unassessable in practice, which is the worst combination.
 *
 * One script rather than two. It detects the platform at runtime and runs the
 * matching probes, because an SME with three Macs and a Linux NAS should not
 * have to work out which download applies to which box.
 *
 * Same output contract as the Windows script — the JSON that lands in
 * `parseLocalReport` is byte-for-byte the same shape — so paste-back, estate
 * aggregation and clause mapping all work unchanged.
 *
 * Everything here is read-only. Unlike the Windows script there is no remediate
 * mode: macOS hardening runs through MDM and configuration profiles, and a shell
 * script poking at `defaults` behind MDM's back produces drift that the next
 * profile push silently reverts. Reporting honestly beats changing invisibly.
 */

import type { MeasureId } from "./ce-framework";

export type UnixPlatform = "macos" | "linux" | "both";

export interface UnixCheck {
  id: string;
  clauseIds: string[];
  measureId: MeasureId;
  title: string;
  why: string;
  platform: UnixPlatform;
  /** Shell that sets RESULT and DETAIL. POSIX sh where possible. */
  body: string[];
}

export const UNIX_CHECKS: UnixCheck[] = [
  // ── A.3 Data — disk encryption ────────────────────────────────────────────
  {
    id: "disk-encryption",
    clauseIds: ["A.3.4(c)"],
    measureId: "A.3",
    title: "Disk encryption on the system drive",
    why: "A stolen unencrypted laptop is a reportable breach. This is the single highest-value check on a portable machine.",
    platform: "both",
    body: [
      'if [ "$OS" = "macos" ]; then',
      '  STATUS=$(fdesetup status 2>/dev/null)',
      '  case "$STATUS" in',
      '    *"FileVault is On"*) RESULT=pass; DETAIL="FileVault is on" ;;',
      '    *"FileVault is Off"*) RESULT=fail; DETAIL="FileVault is off - the disk is readable if the machine is stolen" ;;',
      '    *) RESULT=unknown; DETAIL="Could not read FileVault status" ;;',
      '  esac',
      'else',
      '  if command -v lsblk >/dev/null 2>&1 && lsblk -o TYPE 2>/dev/null | grep -q crypt; then',
      '    RESULT=pass; DETAIL="An encrypted (LUKS) volume is present"',
      '  else',
      '    RESULT=fail; DETAIL="No encrypted volume found - check LUKS is in use on the system disk"',
      '  fi',
      'fi',
    ],
  },

  // ── A.4 Malware and firewall ──────────────────────────────────────────────
  {
    id: "firewall",
    clauseIds: ["A.4.4(e)"],
    measureId: "A.4",
    title: "Host firewall enabled",
    why: "A.4.4(e) asks for a firewall on endpoints as well as the perimeter.",
    platform: "both",
    body: [
      'if [ "$OS" = "macos" ]; then',
      '  FW="/usr/libexec/ApplicationFirewall/socketfilterfw"',
      '  if [ -x "$FW" ]; then',
      '    OUT=$("$FW" --getglobalstate 2>/dev/null)',
      '    case "$OUT" in',
      '      *enabled*) RESULT=pass; DETAIL="Application firewall enabled" ;;',
      '      *) RESULT=fail; DETAIL="Application firewall is disabled" ;;',
      '    esac',
      '  else',
      '    RESULT=unknown; DETAIL="socketfilterfw not available"',
      '  fi',
      'else',
      '  if command -v ufw >/dev/null 2>&1; then',
      '    if ufw status 2>/dev/null | grep -qi "Status: active"; then',
      '      RESULT=pass; DETAIL="ufw is active"',
      '    else',
      '      RESULT=fail; DETAIL="ufw is installed but inactive"',
      '    fi',
      '  elif command -v firewall-cmd >/dev/null 2>&1; then',
      '    if firewall-cmd --state 2>/dev/null | grep -qi running; then',
      '      RESULT=pass; DETAIL="firewalld is running"',
      '    else',
      '      RESULT=fail; DETAIL="firewalld is installed but not running"',
      '    fi',
      '  elif command -v nft >/dev/null 2>&1 && [ -n "$(nft list ruleset 2>/dev/null)" ]; then',
      '    RESULT=pass; DETAIL="nftables ruleset present"',
      '  else',
      '    RESULT=fail; DETAIL="No active host firewall found (looked for ufw, firewalld, nftables)"',
      '  fi',
      'fi',
    ],
  },
  {
    id: "malware-protection",
    clauseIds: ["A.4.4(a)", "A.4.4(h)"],
    measureId: "A.4",
    title: "Malware protection present",
    why: "On macOS, Gatekeeper and XProtect are built in and count. Linux desktops usually need something installed.",
    platform: "both",
    body: [
      'if [ "$OS" = "macos" ]; then',
      '  GK=$(spctl --status 2>/dev/null)',
      '  case "$GK" in',
      '    *"assessments enabled"*) RESULT=pass; DETAIL="Gatekeeper enabled; XProtect ships with macOS and updates automatically" ;;',
      '    *) RESULT=fail; DETAIL="Gatekeeper is disabled - unsigned applications can run without checks" ;;',
      '  esac',
      'else',
      '  if command -v clamscan >/dev/null 2>&1 || pgrep -x clamd >/dev/null 2>&1; then',
      '    RESULT=pass; DETAIL="ClamAV present"',
      '  else',
      '    RESULT=review; DETAIL="No anti-malware detected. Linux servers may rely on other controls - record what you use and why"',
      '  fi',
      'fi',
    ],
  },

  // ── A.5 Access control ────────────────────────────────────────────────────
  {
    id: "admin-users",
    clauseIds: ["A.5.4(d)", "A.5.4(f)"],
    measureId: "A.5",
    title: "Administrator account count",
    why: "Least privilege. Every extra admin is another account whose compromise owns the machine.",
    platform: "both",
    body: [
      'if [ "$OS" = "macos" ]; then',
      '  ADMINS=$(dscl . -read /Groups/admin GroupMembership 2>/dev/null | cut -d: -f2-)',
      'else',
      '  ADMINS=$(getent group sudo 2>/dev/null | cut -d: -f4)',
      '  [ -z "$ADMINS" ] && ADMINS=$(getent group wheel 2>/dev/null | cut -d: -f4)',
      'fi',
      'COUNT=$(printf "%s" "$ADMINS" | tr ", " "\\n" | grep -c . || true)',
      'if [ "$COUNT" -le 2 ]; then RESULT=pass; else RESULT=review; fi',
      'DETAIL="$COUNT administrator account(s): $ADMINS"',
    ],
  },
  {
    id: "guest-account",
    clauseIds: ["A.5.4(e)"],
    measureId: "A.5",
    title: "Guest access disabled",
    why: "An enabled guest account is an unauthenticated foothold.",
    platform: "macos",
    body: [
      'ENABLED=$(defaults read /Library/Preferences/com.apple.loginwindow GuestEnabled 2>/dev/null || echo 0)',
      'if [ "$ENABLED" = "1" ]; then',
      '  RESULT=fail; DETAIL="Guest account is enabled"',
      'else',
      '  RESULT=pass; DETAIL="Guest account is disabled"',
      'fi',
    ],
  },
  {
    id: "ssh-root",
    clauseIds: ["A.5.4(f)", "A.6.4(a)"],
    measureId: "A.5",
    title: "SSH does not permit root login",
    why: "Direct root login over SSH removes the audit trail and is a standard hardening item.",
    platform: "linux",
    body: [
      'CFG=/etc/ssh/sshd_config',
      'if [ ! -f "$CFG" ]; then',
      '  RESULT=pass; DETAIL="No sshd_config - SSH server does not appear to be installed"',
      'else',
      '  VAL=$(grep -Ei "^[[:space:]]*PermitRootLogin" "$CFG" 2>/dev/null | tail -1 | awk "{print \\$2}")',
      '  case "$VAL" in',
      '    no|prohibit-password|forced-commands-only) RESULT=pass; DETAIL="PermitRootLogin $VAL" ;;',
      '    "") RESULT=review; DETAIL="PermitRootLogin not set explicitly - the default varies by distribution" ;;',
      '    *) RESULT=fail; DETAIL="PermitRootLogin $VAL" ;;',
      '  esac',
      'fi',
    ],
  },

  // ── A.6 Secure configuration ──────────────────────────────────────────────
  {
    id: "screen-lock",
    clauseIds: ["A.6.4(i)"],
    measureId: "A.6",
    title: "Screen locks when idle",
    why: "A.6.4(i) asks for automatic lock after inactivity.",
    platform: "both",
    body: [
      'if [ "$OS" = "macos" ]; then',
      '  ASK=$(defaults read com.apple.screensaver askForPassword 2>/dev/null || echo 0)',
      '  DELAY=$(defaults read com.apple.screensaver askForPasswordDelay 2>/dev/null || echo 999)',
      '  if [ "$ASK" = "1" ] && [ "$DELAY" -le 300 ] 2>/dev/null; then',
      '    RESULT=pass; DETAIL="Password required $DELAY seconds after screensaver starts"',
      '  else',
      '    RESULT=fail; DETAIL="Screen lock not enforced promptly (askForPassword=$ASK delay=$DELAY)"',
      '  fi',
      'else',
      '  if command -v gsettings >/dev/null 2>&1; then',
      '    LOCK=$(gsettings get org.gnome.desktop.screensaver lock-enabled 2>/dev/null)',
      '    if [ "$LOCK" = "true" ]; then RESULT=pass; DETAIL="GNOME screen lock enabled";',
      '    else RESULT=fail; DETAIL="GNOME screen lock disabled or not configured"; fi',
      '  else',
      '    RESULT=unknown; DETAIL="No desktop session detected - not applicable on a headless server"',
      '  fi',
      'fi',
    ],
  },
  {
    id: "sip-selinux",
    clauseIds: ["A.6.4(a)"],
    measureId: "A.6",
    title: "Platform integrity protection enabled",
    why: "System Integrity Protection on macOS and SELinux/AppArmor on Linux stop malware modifying the system itself.",
    platform: "both",
    body: [
      'if [ "$OS" = "macos" ]; then',
      '  OUT=$(csrutil status 2>/dev/null)',
      '  case "$OUT" in',
      '    *enabled*) RESULT=pass; DETAIL="System Integrity Protection enabled" ;;',
      '    *) RESULT=fail; DETAIL="System Integrity Protection is disabled" ;;',
      '  esac',
      'else',
      '  if command -v getenforce >/dev/null 2>&1; then',
      '    MODE=$(getenforce 2>/dev/null)',
      '    if [ "$MODE" = "Enforcing" ]; then RESULT=pass; else RESULT=review; fi',
      '    DETAIL="SELinux is $MODE"',
      '  elif command -v aa-status >/dev/null 2>&1 && aa-status --enabled 2>/dev/null; then',
      '    RESULT=pass; DETAIL="AppArmor is enabled"',
      '  else',
      '    RESULT=review; DETAIL="Neither SELinux nor AppArmor detected"',
      '  fi',
      'fi',
    ],
  },
  {
    id: "sharing-services",
    clauseIds: ["A.6.4(c)"],
    measureId: "A.6",
    title: "Unnecessary sharing services off",
    why: "A.6.4(c) asks for unused services to be disabled. File and screen sharing left on is a common oversight.",
    platform: "macos",
    body: [
      'ON=""',
      'launchctl list 2>/dev/null | grep -q com.apple.smbd && ON="$ON file-sharing"',
      'launchctl list 2>/dev/null | grep -q com.apple.screensharing && ON="$ON screen-sharing"',
      'launchctl list 2>/dev/null | grep -q com.apple.RemoteDesktop && ON="$ON remote-management"',
      'if [ -n "$ON" ]; then',
      '  RESULT=review; DETAIL="Enabled sharing services:$ON - confirm each is needed"',
      'else',
      '  RESULT=pass; DETAIL="No file, screen or remote-management sharing running"',
      'fi',
    ],
  },

  // ── A.7 Updates ───────────────────────────────────────────────────────────
  {
    id: "auto-updates",
    clauseIds: ["A.7.4(a)", "A.7.4(c)"],
    measureId: "A.7",
    title: "Automatic security updates",
    why: "Most breaches use a flaw patched months earlier. This is among the highest-value controls in the framework.",
    platform: "both",
    body: [
      'if [ "$OS" = "macos" ]; then',
      '  AUTO=$(defaults read /Library/Preferences/com.apple.SoftwareUpdate AutomaticCheckEnabled 2>/dev/null || echo 0)',
      '  CRIT=$(defaults read /Library/Preferences/com.apple.SoftwareUpdate CriticalUpdateInstall 2>/dev/null || echo 0)',
      '  if [ "$AUTO" = "1" ] && [ "$CRIT" = "1" ]; then',
      '    RESULT=pass; DETAIL="Automatic checks and critical update installation are enabled"',
      '  else',
      '    RESULT=fail; DETAIL="Automatic updates not fully enabled (check=$AUTO criticalInstall=$CRIT)"',
      '  fi',
      'else',
      '  if [ -f /etc/apt/apt.conf.d/20auto-upgrades ] && grep -q "1" /etc/apt/apt.conf.d/20auto-upgrades 2>/dev/null; then',
      '    RESULT=pass; DETAIL="unattended-upgrades is configured"',
      '  elif systemctl is-enabled dnf-automatic.timer >/dev/null 2>&1; then',
      '    RESULT=pass; DETAIL="dnf-automatic timer is enabled"',
      '  else',
      '    RESULT=fail; DETAIL="No automatic update mechanism detected"',
      '  fi',
      'fi',
    ],
  },
  {
    id: "pending-updates",
    clauseIds: ["A.7.4(a)"],
    measureId: "A.7",
    title: "Outstanding security updates",
    why: "Shows the gap between policy and reality — automatic updates configured but failing is common.",
    platform: "linux",
    body: [
      'if command -v apt-get >/dev/null 2>&1; then',
      '  N=$(apt-get -s -o Debug::NoLocking=true upgrade 2>/dev/null | grep -c ^Inst || true)',
      'elif command -v dnf >/dev/null 2>&1; then',
      '  N=$(dnf -q check-update 2>/dev/null | grep -c . || true)',
      'else',
      '  N=-1',
      'fi',
      'if [ "$N" -lt 0 ]; then RESULT=unknown; DETAIL="No supported package manager found";',
      'elif [ "$N" -eq 0 ]; then RESULT=pass; DETAIL="No pending package updates";',
      'elif [ "$N" -le 20 ]; then RESULT=review; DETAIL="$N package updates pending";',
      'else RESULT=fail; DETAIL="$N package updates pending"; fi',
    ],
  },

  // ── A.2 Inventory ─────────────────────────────────────────────────────────
  {
    id: "os-version",
    clauseIds: ["A.2.4(f)", "A.2.4(d)"],
    measureId: "A.2",
    title: "Operating system version",
    why: "A.2.4(f) requires end-of-support assets replaced. An unsupported OS cannot be patched at all.",
    platform: "both",
    body: [
      'if [ "$OS" = "macos" ]; then',
      '  VER=$(sw_vers -productVersion 2>/dev/null)',
      '  MAJOR=$(printf "%s" "$VER" | cut -d. -f1)',
      '  if [ "$MAJOR" -ge 14 ] 2>/dev/null; then RESULT=pass; else RESULT=fail; fi',
      '  DETAIL="macOS $VER"',
      'else',
      '  VER=$(. /etc/os-release 2>/dev/null && printf "%s %s" "$NAME" "$VERSION_ID")',
      '  RESULT=review; DETAIL="${VER:-unknown Linux} - confirm this release is still receiving security updates"',
      'fi',
    ],
  },

  // ── A.8 Backup ────────────────────────────────────────────────────────────
  {
    id: "backup",
    clauseIds: ["A.8.4(a)", "A.8.4(d)"],
    measureId: "A.8",
    title: "An automated backup exists",
    why: "Only ever reports that a mechanism exists. Whether it works is A.8.4(i), and only a restore test answers that.",
    platform: "both",
    body: [
      'if [ "$OS" = "macos" ]; then',
      '  TM=$(tmutil destinationinfo 2>/dev/null | grep -c "Name" || true)',
      '  if [ "$TM" -gt 0 ]; then',
      '    LAST=$(tmutil latestbackup 2>/dev/null || echo "none recorded")',
      '    RESULT=review; DETAIL="Time Machine configured; latest backup: $LAST - confirm it covers business data and that one copy is offline"',
      '  else',
      '    RESULT=fail; DETAIL="No Time Machine destination configured"',
      '  fi',
      'else',
      '  FOUND=""',
      '  for U in restic borg duplicity rsnapshot bacula-fd; do',
      '    command -v "$U" >/dev/null 2>&1 && FOUND="$FOUND $U"',
      '  done',
      '  if [ -n "$FOUND" ]; then',
      '    RESULT=review; DETAIL="Backup tooling present:$FOUND - confirm it runs on a schedule and that one copy is isolated"',
      '  else',
      '    RESULT=fail; DETAIL="No backup tooling found (looked for restic, borg, duplicity, rsnapshot, bacula)"',
      '  fi',
      'fi',
    ],
  },
];

const ASCII = (s: string): string =>
  s
    .replace(/[—–−]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7E\r\n\t]/g, "");

/** JSON string escaping done in shell, so the output parses cleanly. */
const JSON_ESCAPE_FN = [
  "json_escape() {",
  '  printf "%s" "$1" | sed -e "s/\\\\\\\\/\\\\\\\\\\\\\\\\/g" -e "s/\\"/\\\\\\\\\\"/g" | tr -d "\\r\\n"',
  "}",
];

export interface UnixScriptOptions {
  selected: string[];
  org?: string;
}

export function buildUnixScript(opts: UnixScriptOptions): string {
  const checks = UNIX_CHECKS.filter((c) => opts.selected.includes(c.id));

  const lines: string[] = [
    "#!/bin/sh",
    "# ---------------------------------------------------------------",
    "# Cyber Essentials Tool - local check (macOS and Linux)",
    opts.org ? `# Prepared for: ${opts.org}` : "#",
    `# Generated: ${new Date().toISOString()}`,
    "#",
    "# WHAT THIS DOES",
    "#   Reads local security settings and writes a JSON report.",
    "#   It is READ ONLY. It changes nothing, ever - there is no",
    "#   remediate mode, because on macOS hardening belongs in MDM and",
    "#   a script fighting a configuration profile just creates drift.",
    "#",
    "# WHAT IT DOES NOT DO",
    "#   No network calls. Nothing is uploaded. You paste the result",
    "#   back into the tool yourself, and you can read it first.",
    "#",
    "# USAGE",
    "#   chmod +x cyber-essentials-check.sh",
    "#   sudo ./cyber-essentials-check.sh",
    "#",
    "#   sudo is not required, but several checks return 'unknown'",
    "#   without it.",
    "# ---------------------------------------------------------------",
    "",
    "set -u",
    "",
    'OUTFILE="${1:-./cyber-essentials-result.json}"',
    "",
    'case "$(uname -s)" in',
    "  Darwin) OS=macos ;;",
    "  Linux)  OS=linux ;;",
    '  *) echo "Unsupported platform: $(uname -s)" >&2; exit 1 ;;',
    "esac",
    "",
    'if [ "$(id -u)" -ne 0 ]; then',
    '  echo "Note: not running as root. Some checks will report unknown." >&2',
    '  echo "" >&2',
    "fi",
    "",
    ...JSON_ESCAPE_FN,
    "",
    'HOSTNAME_VALUE=$(hostname 2>/dev/null || echo unknown)',
    'GENERATED=$(date -u +%Y-%m-%dT%H:%M:%SZ)',
    "FINDINGS=\"\"",
    "PASS=0",
    "FAIL=0",
    "",
    'printf "\\n  Cyber Essentials Tool - local check (%s)\\n\\n" "$OS"',
    "",
  ];

  for (const check of checks) {
    // A platform-specific check still emits a finding on the other platform, as
    // "na". Silently omitting it would make two machines' reports different
    // shapes, and the estate aggregation would read that as a missing check.
    const applies =
      check.platform === "both"
        ? null
        : check.platform === "macos"
          ? '[ "$OS" = "macos" ]'
          : '[ "$OS" = "linux" ]';

    lines.push(
      `# ---- ${check.id}: ${check.title} ----`,
      `# ${check.why}`,
      `# Cyber Essentials: ${check.clauseIds.join(", ")}`,
      "RESULT=unknown",
      'DETAIL=""',
      ...(applies
        ? [
            `if ${applies}; then`,
            ...check.body.map((l) => "  " + l),
            "else",
            "  RESULT=na",
            '  DETAIL="Not applicable on $OS"',
            "fi",
          ]
        : check.body),
      "",
      `CLAUSES='${check.clauseIds.map((c) => `"${c}"`).join(",")}'`,
      'ESCAPED_DETAIL=$(json_escape "$DETAIL")',
      `ENTRY="{\\"id\\":\\"${check.id}\\",\\"title\\":\\"${check.title.replace(/"/g, "")}\\",\\"clauses\\":[$CLAUSES],\\"measure\\":\\"${check.measureId}\\",\\"result\\":\\"$RESULT\\",\\"detail\\":\\"$ESCAPED_DETAIL\\"}"`,
      'if [ -z "$FINDINGS" ]; then FINDINGS="$ENTRY"; else FINDINGS="$FINDINGS,$ENTRY"; fi',
      '[ "$RESULT" = "pass" ] && PASS=$((PASS+1))',
      '[ "$RESULT" = "fail" ] && FAIL=$((FAIL+1))',
      `printf "  [%-7s] ${check.title.replace(/"/g, "")}\\n" "$RESULT"`,
      'printf "            %s\\n" "$DETAIL"',
      "",
    );
  }

  lines.push(
    'cat > "$OUTFILE" <<EOF',
    "{",
    '  "tool": "Cyber Essentials Tool local check",',
    '  "version": 1,',
    '  "generated": "$GENERATED",',
    '  "computer": "$HOSTNAME_VALUE",',
    '  "platform": "$OS",',
    '  "mode": "Audit",',
    '  "findings": [$FINDINGS]',
    "}",
    "EOF",
    "",
    'printf "\\n  %s passing, %s failing\\n" "$PASS" "$FAIL"',
    'printf "  Result written to: %s\\n" "$OUTFILE"',
    'printf "  Open it, read it, then paste the contents into the tool.\\n\\n"',
    "",
  );

  return lines.map(ASCII).join("\n");
}
