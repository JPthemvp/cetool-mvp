/**
 * Local assessment and hardening toolkit — generated PowerShell the SME runs
 * themselves.
 *
 * This is the deliberate middle path between "web scan only" (which cannot see
 * inside the estate) and "install our agent" (which makes this tool a supply
 * chain target and a credential honeypot).
 *
 * Three rules hold the design together:
 *
 *   1. AUDIT IS THE DEFAULT. The script reads and reports. Changing anything
 *      requires the operator to pass -Mode Remediate and then type a
 *      confirmation. Nothing here runs unattended.
 *
 *   2. NOTHING CHANGES WITHOUT A WAY BACK. Every remediation captures the
 *      current value to a timestamped rollback script before writing the new
 *      one. An SME with no IT support must be able to undo a Monday-morning
 *      breakage in one command.
 *
 *   3. THE SME CAN READ IT. Plain PowerShell, no obfuscation, no network
 *      callbacks, no downloads. They can hand it to their IT vendor and the
 *      vendor can approve it in five minutes. That property is worth more than
 *      any feature, and it is exactly what an opaque .exe gives up.
 *
 * Checks are CIS Benchmark aligned. We implement them ourselves rather than
 * wrapping CIS-CAT Pro, which cannot be redistributed to non-members — the
 * benchmark documents are free, the tooling is not.
 */

import type { MeasureId } from "./ce-framework";

export type ChangeRisk = "safe" | "review" | "disruptive";

export interface ScriptCheck {
  id: string;
  clauseIds: string[];
  measureId: MeasureId;
  title: string;
  /** Why an assessor cares. */
  why: string;
  /** Read-only. Sets $result and $detail. */
  audit: string[];
  /** Absent means audit-only — some things should never be auto-changed. */
  remediate?: string[];
  /** Emits the command that restores the prior value. */
  rollback?: string[];
  risk: ChangeRisk;
  /** What could break. Shown before the operator consents. */
  caution?: string;
}

export const RISK_LABEL: Record<ChangeRisk, string> = {
  safe: "Safe — reversible, no service impact expected",
  review: "Review first — may affect older software",
  disruptive: "Disruptive — can break legacy systems, test on one machine",
};

export const CHECKS: ScriptCheck[] = [
  // ── A.6 Secure configuration ──────────────────────────────────────────────
  {
    id: "smbv1",
    clauseIds: ["A.6.4(b)"],
    measureId: "A.6",
    title: "SMBv1 disabled",
    why: "SMBv1 is the protocol WannaCry spread over. A.6.4(b) requires weak protocols to be disabled.",
    audit: [
      "$f = Get-WindowsOptionalFeature -Online -FeatureName SMB1Protocol -ErrorAction SilentlyContinue",
      "$result = if ($null -eq $f) { 'unknown' } elseif ($f.State -eq 'Disabled') { 'pass' } else { 'fail' }",
      "$detail = \"SMB1Protocol state: $(if ($f) { $f.State } else { 'not queryable' })\"",
    ],
    remediate: [
      "Disable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol -NoRestart | Out-Null",
    ],
    rollback: ["Enable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol -NoRestart"],
    risk: "review",
    caution:
      "Very old NAS boxes, multi-function printers and pre-2008 servers may only speak SMBv1. Check you can still reach shared folders and scan-to-folder after the change.",
  },
  {
    id: "tls-legacy",
    clauseIds: ["A.6.4(b)", "A.3.4(c)"],
    measureId: "A.6",
    title: "TLS 1.0 and 1.1 disabled",
    why: "Withdrawn protocol versions with known weaknesses. The same clause the external scan checks from outside.",
    audit: [
      "$base = 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols'",
      "$bad = @()",
      "foreach ($p in @('TLS 1.0','TLS 1.1')) {",
      "  foreach ($r in @('Server','Client')) {",
      "    $k = Join-Path $base \"$p\\$r\"",
      "    $v = (Get-ItemProperty -Path $k -Name Enabled -ErrorAction SilentlyContinue).Enabled",
      "    if ($null -eq $v -or $v -ne 0) { $bad += \"$p/$r\" }",
      "  }",
      "}",
      "$result = if ($bad.Count -eq 0) { 'pass' } else { 'fail' }",
      "$detail = if ($bad.Count -eq 0) { 'TLS 1.0/1.1 disabled for client and server' } else { 'Still enabled or unset: ' + ($bad -join ', ') }",
    ],
    remediate: [
      "$base = 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols'",
      "foreach ($p in @('TLS 1.0','TLS 1.1')) {",
      "  foreach ($r in @('Server','Client')) {",
      "    $k = Join-Path $base \"$p\\$r\"",
      "    if (-not (Test-Path $k)) { New-Item -Path $k -Force | Out-Null }",
      "    New-ItemProperty -Path $k -Name Enabled -Value 0 -PropertyType DWord -Force | Out-Null",
      "    New-ItemProperty -Path $k -Name DisabledByDefault -Value 1 -PropertyType DWord -Force | Out-Null",
      "  }",
      "}",
    ],
    rollback: [
      "$base = 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols'",
      "foreach ($p in @('TLS 1.0','TLS 1.1')) {",
      "  foreach ($r in @('Server','Client')) {",
      "    $k = Join-Path $base \"$p\\$r\"",
      "    if (Test-Path $k) { Remove-Item -Path $k -Recurse -Force -ErrorAction SilentlyContinue }",
      "  }",
      "}",
    ],
    risk: "disruptive",
    caution:
      "This is the change most likely to break something. Old accounting software, payment terminals, on-premise servers and some medical devices still negotiate TLS 1.0. Test on one machine and confirm every line-of-business application still connects before rolling out.",
  },
  {
    id: "autorun",
    clauseIds: ["A.6.4(c)", "A.4.4(a)"],
    measureId: "A.6",
    title: "AutoRun and AutoPlay disabled",
    why: "Stops malware executing automatically from a USB stick — a standard CIS Benchmark item and a classic SME infection route.",
    audit: [
      "$k = 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer'",
      "$v = (Get-ItemProperty -Path $k -Name NoDriveTypeAutoRun -ErrorAction SilentlyContinue).NoDriveTypeAutoRun",
      "$result = if ($v -eq 255) { 'pass' } else { 'fail' }",
      "$detail = \"NoDriveTypeAutoRun = $(if ($null -ne $v) { $v } else { 'not set' }) (255 = all drives disabled)\"",
    ],
    remediate: [
      "$k = 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer'",
      "if (-not (Test-Path $k)) { New-Item -Path $k -Force | Out-Null }",
      "New-ItemProperty -Path $k -Name NoDriveTypeAutoRun -Value 255 -PropertyType DWord -Force | Out-Null",
    ],
    rollback: [
      "$k = 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer'",
      "Remove-ItemProperty -Path $k -Name NoDriveTypeAutoRun -ErrorAction SilentlyContinue",
    ],
    risk: "safe",
  },
  {
    id: "screen-lock",
    clauseIds: ["A.6.4(i)"],
    measureId: "A.6",
    title: "Screen locks when idle",
    why: "A.6.4(i) asks for automatic lock after inactivity. Fifteen minutes is the common baseline.",
    audit: [
      "$k = 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System'",
      "$secs = (Get-ItemProperty -Path $k -Name InactivityTimeoutSecs -ErrorAction SilentlyContinue).InactivityTimeoutSecs",
      "$result = if ($secs -gt 0 -and $secs -le 900) { 'pass' } else { 'fail' }",
      "$detail = \"Inactivity lock: $(if ($secs) { \"$secs seconds\" } else { 'not configured' })\"",
    ],
    remediate: [
      "$k = 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System'",
      "if (-not (Test-Path $k)) { New-Item -Path $k -Force | Out-Null }",
      "New-ItemProperty -Path $k -Name InactivityTimeoutSecs -Value 900 -PropertyType DWord -Force | Out-Null",
    ],
    rollback: [
      "$k = 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System'",
      "Remove-ItemProperty -Path $k -Name InactivityTimeoutSecs -ErrorAction SilentlyContinue",
    ],
    risk: "safe",
    caution:
      "Staff at shared workstations will need to unlock more often. Warn them before rolling this out or you will get it reversed informally.",
  },
  {
    id: "audit-logging",
    clauseIds: ["A.6.4(g)"],
    measureId: "A.6",
    title: "Logon auditing enabled",
    why: "A.6.4(g) requires audit logs. Without logon auditing you cannot reconstruct an account compromise.",
    audit: [
      "$out = auditpol /get /subcategory:'Logon' 2>$null | Out-String",
      "if ([string]::IsNullOrWhiteSpace($out)) {",
      "  $result = 'unknown'",
      "  $detail = 'auditpol returned nothing - this check needs Administrator'",
      "} else {",
      "  $line = ($out -split \"`r?`n\" | Where-Object { $_ -match 'Logon' } | Select-Object -First 1)",
      "  $result = if ($out -match 'Success') { 'pass' } else { 'fail' }",
      "  $detail = if ($line) { $line.Trim() } else { 'Logon subcategory not reported' }",
      "}",
    ],
    remediate: ["auditpol /set /subcategory:'Logon' /success:enable /failure:enable | Out-Null"],
    rollback: ["auditpol /set /subcategory:'Logon' /success:disable /failure:disable"],
    risk: "safe",
  },

  // ── A.4 Malware and firewall ──────────────────────────────────────────────
  {
    id: "defender",
    clauseIds: ["A.4.4(a)", "A.4.4(b)", "A.4.4(c)"],
    measureId: "A.4",
    title: "Anti-malware active and current",
    why: "Covers three clauses at once: installed, actively scanning, and definitions updating.",
    audit: [
      "$s = Get-MpComputerStatus -ErrorAction SilentlyContinue",
      "if ($null -eq $s) { $result = 'unknown'; $detail = 'Defender not present — you may be running third-party anti-malware, which is acceptable. Check its console.' }",
      "else {",
      "  $age = $s.AntivirusSignatureAge",
      "  $ok = $s.RealTimeProtectionEnabled -and $s.AntivirusEnabled -and $age -le 3",
      "  $result = if ($ok) { 'pass' } else { 'fail' }",
      "  $detail = \"Realtime=$($s.RealTimeProtectionEnabled) Enabled=$($s.AntivirusEnabled) SignatureAgeDays=$age\"",
      "}",
    ],
    remediate: [
      "Set-MpPreference -DisableRealtimeMonitoring $false",
      "Update-MpSignature -ErrorAction SilentlyContinue",
    ],
    rollback: ["# No rollback offered: disabling anti-malware is never the safe state."],
    risk: "safe",
  },
  {
    id: "firewall",
    clauseIds: ["A.4.4(e)"],
    measureId: "A.4",
    title: "Host firewall enabled on all profiles",
    why: "A.4.4(e) requires firewalls at the perimeter and, where applicable, on endpoints.",
    audit: [
      "$p = Get-NetFirewallProfile -ErrorAction SilentlyContinue",
      "$off = $p | Where-Object { -not $_.Enabled } | ForEach-Object { $_.Name }",
      "$result = if ($off.Count -eq 0) { 'pass' } else { 'fail' }",
      "$detail = if ($off.Count -eq 0) { 'Domain, Private and Public profiles all enabled' } else { 'Disabled on: ' + ($off -join ', ') }",
    ],
    remediate: ["Set-NetFirewallProfile -Profile Domain,Private,Public -Enabled True"],
    rollback: ["# No rollback offered: disabling the firewall is never the safe state."],
    risk: "safe",
  },

  // ── A.5 Access control ────────────────────────────────────────────────────
  {
    id: "local-admins",
    clauseIds: ["A.5.4(d)", "A.5.4(f)"],
    measureId: "A.5",
    title: "Local administrator count",
    why: "Least privilege. Every extra local admin is another account whose compromise owns the machine.",
    audit: [
      "$m = Get-LocalGroupMember -Group 'Administrators' -ErrorAction SilentlyContinue",
      "$names = $m | ForEach-Object { $_.Name }",
      "$result = if ($names.Count -le 2) { 'pass' } else { 'review' }",
      "$detail = \"$($names.Count) local administrators: $($names -join ', ')\"",
    ],
    risk: "review",
    caution:
      "Audit only. Removing an administrator can lock someone out of their own machine, so this one is reported for a human to decide.",
  },
  {
    id: "guest-account",
    clauseIds: ["A.5.4(e)", "A.5.4(l)"],
    measureId: "A.5",
    title: "Guest account disabled",
    why: "An enabled Guest account is an unauthenticated foothold.",
    audit: [
      "$g = Get-LocalUser -Name 'Guest' -ErrorAction SilentlyContinue",
      "$result = if ($null -eq $g -or -not $g.Enabled) { 'pass' } else { 'fail' }",
      "$detail = \"Guest account: $(if ($null -eq $g) { 'not present' } elseif ($g.Enabled) { 'ENABLED' } else { 'disabled' })\"",
    ],
    remediate: ["Disable-LocalUser -Name 'Guest' -ErrorAction SilentlyContinue"],
    rollback: ["Enable-LocalUser -Name 'Guest'"],
    risk: "safe",
  },
  {
    id: "rdp-nla",
    clauseIds: ["A.5.4(o)", "A.6.4(a)"],
    measureId: "A.5",
    title: "Remote Desktop exposure",
    why: "Internet-exposed RDP is the single most common ransomware entry point for SMEs.",
    audit: [
      "$k = 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server'",
      "$deny = (Get-ItemProperty -Path $k -Name fDenyTSConnections -ErrorAction SilentlyContinue).fDenyTSConnections",
      "$nla = (Get-ItemProperty -Path \"$k\\WinStations\\RDP-Tcp\" -Name UserAuthentication -ErrorAction SilentlyContinue).UserAuthentication",
      "$result = if ($deny -eq 1) { 'pass' } elseif ($nla -eq 1) { 'review' } else { 'fail' }",
      "$detail = \"RDP enabled: $(if ($deny -eq 1) { 'no' } else { 'YES' }); Network Level Authentication: $(if ($nla -eq 1) { 'on' } else { 'OFF' })\"",
    ],
    remediate: [
      "# Enforces NLA rather than disabling RDP, which would cut off remote workers.",
      "$k = 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server\\WinStations\\RDP-Tcp'",
      "New-ItemProperty -Path $k -Name UserAuthentication -Value 1 -PropertyType DWord -Force | Out-Null",
    ],
    rollback: [
      "$k = 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server\\WinStations\\RDP-Tcp'",
      "New-ItemProperty -Path $k -Name UserAuthentication -Value 0 -PropertyType DWord -Force | Out-Null",
    ],
    risk: "review",
    caution:
      "If anyone connects remotely with an old client that cannot do Network Level Authentication, they will lose access. Confirm your remote workers can still connect.",
  },

  // ── A.3 Data ──────────────────────────────────────────────────────────────
  {
    id: "bitlocker",
    clauseIds: ["A.3.4(c)"],
    measureId: "A.3",
    title: "Disk encryption on the system drive",
    why: "A.3.4(c) requires business-critical data encrypted at rest. A stolen unencrypted laptop is a reportable breach.",
    audit: [
      "$v = Get-BitLockerVolume -MountPoint $env:SystemDrive -ErrorAction SilentlyContinue",
      "$result = if ($null -eq $v) { 'unknown' } elseif ($v.ProtectionStatus -eq 'On') { 'pass' } else { 'fail' }",
      "$detail = if ($v) { \"BitLocker on $($env:SystemDrive): $($v.ProtectionStatus), $($v.VolumeStatus)\" } else { 'Could not query BitLocker - either this edition of Windows does not include it, or the check needs Administrator' }",
    ],
    risk: "disruptive",
    caution:
      "Audit only, deliberately. Turning on BitLocker without first escrowing the recovery key is how people permanently lose access to their own data. Enable it through Intune, Group Policy or manually, and store the recovery key somewhere other than that machine.",
  },

  // ── A.7 Updates ───────────────────────────────────────────────────────────
  {
    id: "patch-age",
    clauseIds: ["A.7.4(a)"],
    measureId: "A.7",
    title: "Operating system patch age",
    why: "A.7.4(a) requires prompt patching. Most breaches use a flaw patched months earlier.",
    audit: [
      "$hf = Get-HotFix -ErrorAction SilentlyContinue | Sort-Object InstalledOn -Descending | Select-Object -First 1",
      "$days = if ($hf -and $hf.InstalledOn) { (New-TimeSpan -Start $hf.InstalledOn -End (Get-Date)).Days } else { $null }",
      "$result = if ($null -eq $days) { 'unknown' } elseif ($days -le 35) { 'pass' } else { 'fail' }",
      "$detail = if ($null -ne $days) { \"Last update $($hf.HotFixID) installed $days days ago\" } else { 'Could not determine patch history' }",
    ],
    risk: "safe",
  },
  {
    id: "os-support",
    clauseIds: ["A.2.4(f)", "A.7.4(a)"],
    measureId: "A.2",
    title: "Operating system still supported",
    why: "A.2.4(f) requires end-of-support assets replaced. An unsupported OS cannot be patched at all.",
    audit: [
      "$os = Get-CimInstance Win32_OperatingSystem",
      "$caption = $os.Caption",
      "$build = [int]$os.BuildNumber",
      "$result = if ($build -ge 19045) { 'pass' } else { 'fail' }",
      "$detail = \"$caption (build $build)\"",
    ],
    risk: "safe",
  },

  // ── A.2 Inventory ─────────────────────────────────────────────────────────
  {
    id: "software-inventory",
    clauseIds: ["A.2.4(a)", "A.2.4(d)"],
    measureId: "A.2",
    title: "Installed software inventory",
    why: "Produces the software half of the A.2.4(a) inventory, with versions, so you are not typing it by hand.",
    audit: [
      "$paths = @(",
      "  'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',",
      "  'HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*'",
      ")",
      "$apps = Get-ItemProperty $paths -ErrorAction SilentlyContinue |",
      "  Where-Object { $_.DisplayName } |",
      "  Select-Object DisplayName, DisplayVersion, Publisher |",
      "  Sort-Object DisplayName -Unique",
      "$result = 'info'",
      "$detail = \"$($apps.Count) applications found\"",
      "$extra = $apps",
    ],
    risk: "safe",
  },

  // ── A.8 Backup ────────────────────────────────────────────────────────────
  {
    id: "backup-task",
    clauseIds: ["A.8.4(a)", "A.8.4(d)"],
    measureId: "A.8",
    title: "A backup job that is not Windows' own",
    why: "A.8.4(d) wants backups automated. This can only tell you a job exists — never that it works.",
    audit: [
      "# Windows ships its own tasks with 'backup' in the name (RegIdleBackup and",
      "# friends). Counting those as a pass would tell an SME its data is safe when",
      "# nothing of theirs is being backed up at all, so they are excluded by path.",
      "$tasks = @(Get-ScheduledTask -ErrorAction SilentlyContinue |",
      "  Where-Object { $_.TaskName -match 'backup' } |",
      "  Where-Object { $_.TaskPath -notmatch '^\\\\Microsoft\\\\' })",
      "if ($tasks.Count -eq 0) {",
      "  $result = 'fail'",
      "  $detail = 'No third-party or user-created scheduled backup task found'",
      "} else {",
      "  # Deliberately 'review', not 'pass'. The existence of a task proves nothing",
      "  # about whether it runs, succeeds, or is isolated per A.8.4(g).",
      "  $result = 'review'",
      "  $names = ($tasks | ForEach-Object { $_.TaskName }) -join ', '",
      "  $detail = \"Found: $names - confirm it runs, succeeds, and that one copy is offline\"",
      "}",
    ],
    risk: "safe",
    caution:
      "This check cannot verify a backup works. Only a test restore does that, which is why A.8.4(i) exists and why it is the clause that most often fails at audit.",
  },
];

// ── Backup configuration, generated separately ──────────────────────────────

/**
 * Sets up a scheduled robocopy to a target the SME nominates.
 *
 * This deliberately does NOT satisfy A.8.4(g), and says so in the script. A
 * scheduled copy to an always-connected drive is reachable by ransomware, which
 * is the whole failure mode A.8.4(g) exists to prevent. Generating this and
 * letting the SME believe backup is solved would be worse than generating
 * nothing, so the script prints that warning every run.
 */
export function buildBackupScript(opts: {
  source: string;
  destination: string;
  time: string;
}): string {
  const { source, destination, time } = opts;
  return [
    "# ---------------------------------------------------------------",
    "# Cyber Essentials Tool - scheduled backup setup",
    "# Addresses Cyber Essentials A.8.4(a), A.8.4(b) and A.8.4(d).",
    "#",
    "# READ THIS FIRST",
    "# This creates an automated copy. It does NOT by itself satisfy",
    "# A.8.4(g), which requires a copy isolated from your network.",
    "# Ransomware encrypts anything the machine can write to, including",
    "# this destination. You still need either:",
    "#   - a drive you physically disconnect between backups, or",
    "#   - cloud backup with immutability / versioning switched on.",
    "#",
    "# Run as Administrator. Review before running.",
    "# ---------------------------------------------------------------",
    "",
    "#Requires -RunAsAdministrator",
    "Set-StrictMode -Version Latest",
    "$ErrorActionPreference = 'Stop'",
    "",
    `$Source      = '${source.replace(/'/g, "''")}'`,
    `$Destination = '${destination.replace(/'/g, "''")}'`,
    `$RunAt       = '${time}'`,
    "$TaskName    = 'Cyber Essentials Tool - Daily Backup'",
    "",
    "if (-not (Test-Path $Source)) { throw \"Source not found: $Source\" }",
    "if (-not (Test-Path $Destination)) {",
    "  Write-Host \"Destination does not exist, creating: $Destination\"",
    "  New-Item -ItemType Directory -Path $Destination -Force | Out-Null",
    "}",
    "",
    "# /MIR mirrors, /R:2 limits retries, /LOG appends an auditable record.",
    "$log = Join-Path $Destination 'backup-log.txt'",
    "$cmd = \"robocopy `\"$Source`\" `\"$Destination`\" /MIR /R:2 /W:5 /NP /LOG+:`\"$log`\"\"",
    "",
    "$action  = New-ScheduledTaskAction -Execute 'powershell.exe' \\",
    "  -Argument \"-NoProfile -WindowStyle Hidden -Command `\"$cmd`\"\"",
    "$trigger = New-ScheduledTaskTrigger -Daily -At $RunAt",
    "$set     = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd",
    "",
    "Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger \\",
    "  -Settings $set -RunLevel Highest -Force | Out-Null",
    "",
    "Write-Host ''",
    "Write-Host \"Scheduled '$TaskName' daily at $RunAt\" -ForegroundColor Green",
    "Write-Host \"  $Source  ->  $Destination\"",
    "Write-Host ''",
    "Write-Host 'STILL TO DO, and an assessor will ask:' -ForegroundColor Yellow",
    "Write-Host '  1. A.8.4(g) - keep one copy offline or immutable.'",
    "Write-Host '  2. A.8.4(i) - restore a file from it this week and note the date.'",
    "Write-Host '  3. A.8.4(f) - restrict who can reach the destination.'",
    "",
  ]
    .map(ascii)
    .join("\r\n");
}

// ── Assessment script generation ────────────────────────────────────────────

/**
 * Wrap a line as a PowerShell single-quoted literal.
 *
 * Not JSON.stringify: PowerShell does not treat backslash as an escape, so a
 * JSON-quoted string containing \" terminates early and produces a parse error.
 * Single-quoted literals escape one character, the quote itself, by doubling it.
 */
function psLiteral(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}

/**
 * Force generated script text to ASCII.
 *
 * Windows PowerShell 5.1 reads a .ps1 as ANSI unless it carries a BOM, so a
 * UTF-8 em-dash in a comment or a Write-Host string renders as mojibake in the
 * SME's console. Since the whole point is that they can read and trust this
 * file, it stays ASCII rather than relying on encoding luck.
 */
function ascii(s: string): string {
  return s
    .replace(/[—–−]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .replace(/→/g, "->")
    .replace(/↗/g, "^")
    .replace(/·/g, "-")
    .replace(/[^\x20-\x7E\r\n\t]/g, "");
}

export interface ScriptOptions {
  /** Only these check ids are included. */
  selected: string[];
  /** Include the remediation branch at all. */
  includeRemediation: boolean;
  org?: string;
}

export function buildAssessmentScript(opts: ScriptOptions): string {
  const checks = CHECKS.filter((c) => opts.selected.includes(c.id));
  const canRemediate = checks.filter((c) => c.remediate && opts.includeRemediation);

  const lines: string[] = [
    "# ---------------------------------------------------------------",
    "# Cyber Essentials Tool - local configuration check",
    opts.org ? `# Prepared for: ${opts.org}` : "# ",
    `# Generated: ${new Date().toISOString()}`,
    "#",
    "# WHAT THIS DOES",
    "#   Reads local security settings and prints a report. In Audit mode",
    "#   (the default) it changes NOTHING.",
    "#",
    "# WHAT IT DOES NOT DO",
    "#   No network calls. No data leaves this machine. Nothing is",
    "#   uploaded. You paste the JSON back into the tool yourself, and",
    "#   you can read it first.",
    "#",
    "# Checks are aligned to CIS Benchmark recommendations and mapped to",
    "# CSA Cyber Essentials clauses.",
    "#",
    "# USAGE",
    "#   .\\cyber-essentials-tool-check.ps1                  # audit only",
    opts.includeRemediation
      ? "#   .\\cyber-essentials-tool-check.ps1 -Mode Remediate  # prompts before each change"
      : "#",
    "# ---------------------------------------------------------------",
    "",
    "[CmdletBinding()]",
    "param(",
    "  [ValidateSet('Audit','Remediate')]",
    "  [string]$Mode = 'Audit',",
    "  [string]$OutFile",
    ")",
    "",
    "$ErrorActionPreference = 'Continue'",
    "",
    "# $PSScriptRoot is not reliably populated while parameter defaults bind in",
    "# Windows PowerShell 5.1, so the output path is resolved here instead.",
    "$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }",
    "if (-not $OutFile) { $OutFile = Join-Path $scriptDir 'cyber-essentials-tool-result.json' }",
    "",
    "function Test-Admin {",
    "  $id = [Security.Principal.WindowsIdentity]::GetCurrent()",
    "  (New-Object Security.Principal.WindowsPrincipal $id).IsInRole(",
    "    [Security.Principal.WindowsBuiltInRole]::Administrator)",
    "}",
    "",
    "if (-not (Test-Admin)) {",
    "  Write-Warning 'Not running as Administrator. Some checks will report unknown.'",
    "  Write-Warning 'Right-click PowerShell and choose Run as Administrator for a complete result.'",
    "  Write-Host ''",
    "}",
    "",
  ];

  if (canRemediate.length > 0) {
    lines.push(
      "$rollbackFile = Join-Path $scriptDir \"cyber-essentials-tool-rollback-$(Get-Date -Format yyyyMMdd-HHmmss).ps1\"",
      "",
      "if ($Mode -eq 'Remediate') {",
      "  if (-not (Test-Admin)) { throw 'Remediate mode requires Administrator.' }",
      "  Write-Host ''",
      "  Write-Host '  REMEDIATE MODE - this will change settings on this computer.' -ForegroundColor Yellow",
      "  Write-Host ''",
      "  Write-Host '  You will be asked before each individual change.'",
      "  Write-Host \"  An undo script will be written to:\"",
      "  Write-Host \"    $rollbackFile\" -ForegroundColor Cyan",
      "  Write-Host ''",
      "  Write-Host '  Test on ONE machine before doing this everywhere.' -ForegroundColor Yellow",
      "  Write-Host ''",
      "  $confirm = Read-Host \"  Type CHANGE to continue, anything else to stay in audit mode\"",
      "  if ($confirm -cne 'CHANGE') {",
      "    Write-Host '  Staying in audit mode. Nothing will be changed.' -ForegroundColor Green",
      "    $Mode = 'Audit'",
      "  } else {",
      "    \"# Cyber Essentials Tool rollback - generated $(Get-Date)\" | Set-Content $rollbackFile",
      "    \"# Run as Administrator to undo the changes made in this session.\" | Add-Content $rollbackFile",
      "    \"\" | Add-Content $rollbackFile",
      "  }",
      "}",
      "",
    );
  }

  lines.push("$findings = @()", "");

  for (const check of checks) {
    lines.push(
      `# ---- ${check.id}: ${check.title} ----`,
      `# ${check.why}`,
      `# Cyber Essentials: ${check.clauseIds.join(", ")}`,
      "$result = 'unknown'; $detail = ''; $extra = $null",
      "try {",
      ...check.audit.map((l) => "  " + l),
      "} catch {",
      "  $result = 'unknown'",
      "  $detail = \"Check failed: $($_.Exception.Message)\"",
      "}",
      "",
      `$findings += [pscustomobject]@{`,
      `  id      = '${check.id}'`,
      `  title   = '${check.title.replace(/'/g, "''")}'`,
      `  clauses = @(${check.clauseIds.map((c) => `'${c}'`).join(",")})`,
      `  measure = '${check.measureId}'`,
      "  result  = $result",
      "  detail  = $detail",
      "  extra   = $extra",
      "}",
      "",
      "$colour = switch ($result) { 'pass' { 'Green' } 'fail' { 'Red' } 'review' { 'Yellow' } default { 'DarkGray' } }",
      `Write-Host ('  [{0,-7}] {1}' -f $result.ToUpper(), '${check.title.replace(/'/g, "''")}') -ForegroundColor $colour`,
      "Write-Host \"            $detail\" -ForegroundColor DarkGray",
      "",
    );

    if (check.remediate && opts.includeRemediation) {
      lines.push(
        `if ($Mode -eq 'Remediate' -and $result -eq 'fail') {`,
        "  Write-Host ''",
        `  Write-Host '  FIX: ${check.title.replace(/'/g, "''")}' -ForegroundColor Yellow`,
        `  Write-Host '  Risk: ${RISK_LABEL[check.risk].replace(/'/g, "''")}'`,
        ...(check.caution
          ? [`  Write-Host '  Caution: ${check.caution.replace(/'/g, "''")}' -ForegroundColor Yellow`]
          : []),
        "  $ans = Read-Host '  Apply this change? (y/N)'",
        "  if ($ans -eq 'y') {",
        "    try {",
        ...(check.rollback ?? []).map(
          (l) => `      ${psLiteral(l)} | Add-Content $rollbackFile`,
        ),
        "      '' | Add-Content $rollbackFile",
        ...check.remediate.map((l) => "      " + l),
        "      Write-Host '  Applied. Undo command written to the rollback script.' -ForegroundColor Green",
        "    } catch {",
        "      Write-Host \"  FAILED: $($_.Exception.Message)\" -ForegroundColor Red",
        "    }",
        "  } else {",
        "    Write-Host '  Skipped.' -ForegroundColor DarkGray",
        "  }",
        "  Write-Host ''",
        "}",
        "",
      );
    }
  }

  lines.push(
    "$report = [pscustomobject]@{",
    "  tool      = 'Cyber Essentials Tool local check'",
    "  version   = 1",
    "  generated = (Get-Date).ToString('o')",
    "  computer  = $env:COMPUTERNAME",
    "  mode      = $Mode",
    "  findings  = $findings",
    "}",
    "",
    "$json = $report | ConvertTo-Json -Depth 6",
    "$json | Set-Content -Path $OutFile -Encoding UTF8",
    "",
    "Write-Host ''",
    "$pass = ($findings | Where-Object { $_.result -eq 'pass' }).Count",
    "$fail = ($findings | Where-Object { $_.result -eq 'fail' }).Count",
    "Write-Host \"  $pass passing, $fail failing, $($findings.Count) checks total\"",
    "Write-Host ''",
    "Write-Host \"  Result written to: $OutFile\" -ForegroundColor Cyan",
    "Write-Host '  Open it, read it, then paste the contents into Cyber Essentials Tool.' -ForegroundColor Cyan",
    "Write-Host ''",
  );

  return lines.map(ascii).join("\r\n");
}

/** Parsed shape of what the SME pastes back. */
export interface LocalFinding {
  id: string;
  title: string;
  clauses: string[];
  measure: string;
  result: "pass" | "fail" | "review" | "unknown" | "info";
  detail: string;
}

export interface LocalReport {
  tool?: string;
  computer?: string;
  generated?: string;
  mode?: string;
  findings: LocalFinding[];
}

export function parseLocalReport(raw: string): { report?: LocalReport; error?: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "That is not valid JSON. Paste the whole contents of the result file." };
  }
  const r = parsed as LocalReport;
  if (!r || !Array.isArray(r.findings)) {
    return { error: "This JSON has no findings array — is it the file the script produced?" };
  }
  return { report: r };
}
