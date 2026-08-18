<#
.SYNOPSIS
  CE Tool — Cyber Essentials Local Audit Script (PowerShell)

.DESCRIPTION
  Alternative to the .exe scanner for organisations that prefer to review
  the script before running it. Reads system state only — no changes, no
  network calls, no data leaves this machine.

  This script is the PowerShell equivalent of the osquery-based CEScan.exe.
  Results are copied to the clipboard and can be pasted into the CE Tool
  browser window to auto-populate the assessment.

.PARAMETER Out
  Write results to a JSON file instead of clipboard.
  CEScan.ps1 -Out C:\Temp\ce-results.json

.PARAMETER Verbose
  Print each check as it runs.

.NOTES
  Audit is the default. This script never changes settings.
  CIS Benchmark aligned. No network calls, no downloads, no external dependencies.
  Can be reviewed line-by-line before running — this is intentional.
  Requires Windows PowerShell 5.1+ or PowerShell 7+.
  Run as the logged-in user (not Administrator) for accurate user-context checks.
  Run as Administrator as well for system-level checks (run twice if needed).
#>

[CmdletBinding()]
param(
  [string]$Out = "",
  [switch]$Help
)

if ($Help) {
  Get-Help $MyInvocation.MyCommand.Path -Detailed
  exit 0
}

$VERSION = "1.0.0"
$PACK_VERSION = "202503"

Write-Host "`nCE Tool Device Audit Script v$VERSION (pack $PACK_VERSION)" -ForegroundColor Cyan
Write-Host ("-" * 52) -ForegroundColor DarkGray
Write-Host "Audit-only - reads system state, changes nothing.`n" -ForegroundColor Yellow

$results = @{}
$errors  = @()

function RunCheck([string]$id, [string]$description, [scriptblock]$block) {
  if ($VerbosePreference -ne 'SilentlyContinue') {
    Write-Host "  Checking: $description..." -NoNewline
  } else {
    Write-Host -NoNewline "."
  }
  try {
    $rows = & $block
    $results[$id] = @{ description = $description; rows = @($rows) }
    if ($VerbosePreference -ne 'SilentlyContinue') { Write-Host " done" -ForegroundColor Green }
  } catch {
    $results[$id] = @{ description = $description; rows = @(); _error = $_.Exception.Message }
    $errors += "$id : $($_.Exception.Message)"
    if ($VerbosePreference -ne 'SilentlyContinue') { Write-Host " ERROR" -ForegroundColor Red }
  }
}

# ── A.2 Asset inventory ──────────────────────────────────────────────────────

RunCheck "A2_os_version" "A.2.4(b)(f) OS version and EoL status" {
  $os = Get-CimInstance -ClassName Win32_OperatingSystem
  @{
    Caption   = $os.Caption
    Version   = $os.Version
    BuildNumber = $os.BuildNumber
    OSArchitecture = $os.OSArchitecture
    InstallDate = $os.InstallDate
    LastBootUpTime = $os.LastBootUpTime
  }
}

RunCheck "A2_hardware" "A.2.4(a)(b) Hardware asset" {
  $cs = Get-CimInstance -ClassName Win32_ComputerSystem
  $bios = Get-CimInstance -ClassName Win32_BIOS
  @{
    ComputerName  = $env:COMPUTERNAME
    Manufacturer  = $cs.Manufacturer
    Model         = $cs.Model
    TotalRAM_GB   = [math]::Round($cs.TotalPhysicalMemory / 1GB, 2)
    SerialNumber  = $bios.SerialNumber
  }
}

RunCheck "A2_software_inventory" "A.2.4(d)(j) Installed software" {
  $regPaths = @(
    "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*",
    "HKLM:\Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*",
    "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*"
  )
  $regPaths | ForEach-Object {
    Get-ItemProperty $_ -ErrorAction SilentlyContinue |
      Where-Object { $_.DisplayName } |
      Select-Object DisplayName, DisplayVersion, Publisher, InstallDate
  }
}

# ── A.3 Data / encryption ────────────────────────────────────────────────────

RunCheck "A3_disk_encryption" "A.3.4(c) BitLocker disk encryption" {
  try {
    Get-BitLockerVolume -ErrorAction Stop | Select-Object MountPoint, EncryptionMethod, VolumeStatus, ProtectionStatus, LockStatus
  } catch {
    # BitLocker cmdlet not available — try WMI
    Get-CimInstance -Namespace Root\CIMv2\Security\MicrosoftVolumeEncryption -ClassName Win32_EncryptableVolume -ErrorAction SilentlyContinue |
      Select-Object DriveLetter, ProtectionStatus, ConversionStatus, EncryptionMethod
  }
}

# ── A.4 Malware and firewall ─────────────────────────────────────────────────

RunCheck "A4_antivirus" "A.4.4(a)(b)(c) Antivirus products" {
  Get-CimInstance -Namespace root\SecurityCenter2 -ClassName AntiVirusProduct -ErrorAction SilentlyContinue |
    Select-Object displayName, productState, @{
      Name = "State"
      Expression = {
        $state = [Convert]::ToString($_.productState, 16).PadLeft(6, '0')
        $rtProtection = $state.Substring(2, 2)
        $sigStatus    = $state.Substring(4, 2)
        [PSCustomObject]@{
          RealTimeProtection = if ($rtProtection -eq '10') { "ON" } else { "OFF" }
          SignaturesUpToDate = if ($sigStatus -eq '00') { "YES" } else { "OUTDATED" }
        }
      }
    }
}

RunCheck "A4_firewall" "A.4.4(e) Windows Firewall profiles" {
  $profiles = @("Domain", "Private", "Public")
  $profiles | ForEach-Object {
    $p = $_
    $fw = Get-NetFirewallProfile -Profile $p -ErrorAction SilentlyContinue
    @{ Profile = $p; Enabled = $fw.Enabled; DefaultInboundAction = $fw.DefaultInboundAction; DefaultOutboundAction = $fw.DefaultOutboundAction }
  }
}

# ── A.5 Access control ───────────────────────────────────────────────────────

RunCheck "A5_local_accounts" "A.5.4(a)(b) Local user accounts" {
  Get-LocalUser | Select-Object Name, Enabled, PasswordRequired, PasswordLastSet, LastLogon, Description
}

RunCheck "A5_local_admins" "A.5.4(d) Local Administrators group" {
  Get-LocalGroupMember -Group "Administrators" -ErrorAction SilentlyContinue |
    Select-Object Name, ObjectClass, PrincipalSource
}

RunCheck "A5_password_policy" "A.5.4(i) Password policy" {
  $policy = net accounts 2>&1
  @{ raw = ($policy | Out-String) }
}

RunCheck "A5_account_lockout" "A.5.4(m) Account lockout threshold" {
  $policy = net accounts 2>&1
  $threshold = ($policy | Select-String "Lockout threshold").ToString().Split(":")[1].Trim()
  $duration  = ($policy | Select-String "Lockout duration").ToString().Split(":")[1].Trim()
  @{ LockoutThreshold = $threshold; LockoutDuration = $duration }
}

RunCheck "A5_rdp_status" "A.5.4(o) Remote Desktop (RDP)" {
  $regKey = "HKLM:\System\CurrentControlSet\Control\Terminal Server"
  $deny = Get-ItemPropertyValue $regKey -Name fDenyTSConnections -ErrorAction SilentlyContinue
  @{
    RDPEnabled = if ($deny -eq 0) { "YES" } else { "NO" }
    fDenyTSConnections = $deny
  }
}

# ── A.6 Secure configuration ─────────────────────────────────────────────────

RunCheck "A6_autorun" "A.6.4(a) Autorun/autoplay" {
  $key = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer"
  @{
    NoDriveTypeAutoRun = Get-ItemPropertyValue $key -Name NoDriveTypeAutoRun -ErrorAction SilentlyContinue
  }
}

RunCheck "A6_screen_lock" "A.6.4(b) Screen lock timeout" {
  $key = "HKCU:\Control Panel\Desktop"
  @{
    ScreenSaveActive     = Get-ItemPropertyValue $key -Name ScreenSaveActive -ErrorAction SilentlyContinue
    ScreenSaverIsSecure  = Get-ItemPropertyValue $key -Name ScreenSaverIsSecure -ErrorAction SilentlyContinue
    ScreenSaveTimeOut    = Get-ItemPropertyValue $key -Name ScreenSaveTimeOut -ErrorAction SilentlyContinue
  }
}

RunCheck "A6_guest_account" "A.6.4(c) Guest account" {
  $guest = Get-LocalUser -Name "Guest" -ErrorAction SilentlyContinue
  @{ Name = $guest.Name; Enabled = $guest.Enabled }
}

RunCheck "A6_smb1" "A.6.4(f) SMBv1 disabled" {
  $smb1 = Get-WindowsOptionalFeature -Online -FeatureName SMB1Protocol -ErrorAction SilentlyContinue
  $smb1Legacy = (Get-ItemPropertyValue "HKLM:\SYSTEM\CurrentControlSet\Services\LanmanServer\Parameters" -Name SMB1 -ErrorAction SilentlyContinue)
  @{
    SMB1Feature_State = $smb1.State
    SMB1Registry      = $smb1Legacy
    SMB1Enabled       = if ($smb1.State -eq "Enabled" -or $smb1Legacy -eq 1) { "YES" } else { "NO" }
  }
}

RunCheck "A6_audit_policy" "A.6.4(g) Audit/event logging" {
  auditpol /get /category:* /r 2>&1 | ConvertFrom-Csv | Select-Object "Subcategory", "Inclusion Setting"
}

RunCheck "A6_startup_items" "A.6.4(i) Startup items" {
  $regPaths = @(
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run",
    "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run",
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce"
  )
  $regPaths | ForEach-Object {
    $path = $_
    Get-ItemProperty $path -ErrorAction SilentlyContinue | Get-Member -MemberType NoteProperty |
      Where-Object { $_.Name -notlike "PS*" } |
      ForEach-Object { @{ Name = $_.Name; Path = (Get-ItemPropertyValue $path -Name $_.Name -ErrorAction SilentlyContinue); Source = $path } }
  }
}

# ── A.7 Software updates ─────────────────────────────────────────────────────

RunCheck "A7_windows_updates" "A.7.4(a)(c) Windows Update patch history" {
  $session = New-Object -ComObject Microsoft.Update.Session
  $searcher = $session.CreateUpdateSearcher()
  $count = $searcher.GetTotalHistoryCount()
  $limit = [Math]::Min($count, 50)
  $history = $searcher.QueryHistory(0, $limit)
  $history | Select-Object @{N="Title";E={$_.Title}}, @{N="Date";E={$_.Date}}, @{N="Result";E={$_.ResultCode}}
}

RunCheck "A7_update_settings" "A.7.4(a) Windows Update automatic update policy" {
  $key = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU"
  @{
    AUOptions = Get-ItemPropertyValue $key -Name AUOptions -ErrorAction SilentlyContinue
    NoAutoUpdate = Get-ItemPropertyValue $key -Name NoAutoUpdate -ErrorAction SilentlyContinue
    UseWUServer = Get-ItemPropertyValue $key -Name UseWUServer -ErrorAction SilentlyContinue
  }
}

# ── A.8 Backup ───────────────────────────────────────────────────────────────

RunCheck "A8_backup_jobs" "A.8.4(a) Scheduled backup tasks" {
  Get-ScheduledTask | Where-Object { $_.TaskName -match "backup|Backup|wbadmin" } |
    Select-Object TaskName, TaskPath, State, @{N="LastResult";E={$_.LastTaskResult}}, @{N="LastRunTime";E={$_.LastRunTime}}
}

RunCheck "A8_vss_snapshots" "A.8.4(d) VSS shadow copies" {
  Get-CimInstance -ClassName Win32_ShadowCopy -ErrorAction SilentlyContinue |
    Sort-Object InstallDate -Descending |
    Select-Object DeviceObject, VolumeName, InstallDate -First 10
}

Write-Host "`n"

# ── Build report ─────────────────────────────────────────────────────────────

$integrity = [System.Security.Cryptography.SHA256]::Create()
$jsonData   = $results | ConvertTo-Json -Depth 10 -Compress
$hashBytes  = $integrity.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($jsonData))
$hashHex    = ($hashBytes | ForEach-Object { $_.ToString("x2") }) -join ""

$report = @{
  schemaVersion = $VERSION
  packVersion   = $PACK_VERSION
  scannedAt     = (Get-Date -Format "o")
  hostname      = $env:COMPUTERNAME
  platform      = "windows"
  osRelease     = (Get-CimInstance Win32_OperatingSystem).Version
  arch          = $env:PROCESSOR_ARCHITECTURE
  scannerType   = "powershell"
  results       = $results
  _integrity    = $hashHex
}

$reportJson = $report | ConvertTo-Json -Depth 15

# ── Output ───────────────────────────────────────────────────────────────────

if ($Out) {
  $reportJson | Out-File -FilePath $Out -Encoding UTF8
  Write-Host "Report written to: $Out" -ForegroundColor Green
} else {
  try {
    Set-Clipboard -Value $reportJson
    Write-Host "✓ Results copied to clipboard." -ForegroundColor Green
    Write-Host "  Paste into the CE Tool browser window to auto-populate the assessment.`n"
  } catch {
    Write-Host "Could not copy to clipboard. Use -Out C:\Temp\ce-results.json to save.`n" -ForegroundColor Yellow
  }
}

# ── Quick summary ─────────────────────────────────────────────────────────────

Write-Host "── Quick summary ──────────────────────────────────────`n" -ForegroundColor Cyan

$av = $results["A4_antivirus"].rows
if ($av) {
  $avNames = $av | ForEach-Object { $_.displayName } | Where-Object { $_ }
  Write-Host "  Antivirus     : $($avNames -join ', ')" -ForegroundColor White
}

$enc = $results["A3_disk_encryption"].rows
if ($enc) {
  $protected = @($enc | Where-Object { $_.ProtectionStatus -eq 1 -or $_.VolumeStatus -eq "FullyEncrypted" })
  Write-Host "  BitLocker     : $($protected.Count) of $($enc.Count) drive(s) encrypted" -ForegroundColor White
}

$fw = $results["A4_firewall"].rows
if ($fw) {
  $enabledProfiles = @($fw | Where-Object { $_.Enabled -eq $true })
  Write-Host "  Firewall      : $($enabledProfiles.Count) of 3 profiles enabled" -ForegroundColor White
}

$admins = $results["A5_local_admins"].rows
if ($admins) {
  Write-Host "  Local Admins  : $($admins.Count) account(s) - $($admins | ForEach-Object { $_.Name } | Join-String -Separator ', ')" -ForegroundColor White
}

if ($errors.Count -gt 0) {
  Write-Host "`n  Checks with errors (require Administrator rights to read):" -ForegroundColor Yellow
  $errors | ForEach-Object { Write-Host "    - $_" -ForegroundColor DarkYellow }
  Write-Host "  Run again as Administrator for full results.`n" -ForegroundColor Yellow
}

Write-Host "`n── Paste results in the CE Tool to complete your assessment. ──`n" -ForegroundColor Cyan
