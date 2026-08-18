# Building and Signing the CE Tool Scanner

## What gets built

| File | Description |
|---|---|
| `dist/CEScan-win.exe` | Self-contained Windows scanner (.exe) |
| `dist/ce-audit.ps1`   | PowerShell alternative (no install needed) |

The .exe bundles Node.js runtime + osquery binary + query pack in a single file.
Users download and double-click. No installation, no admin rights needed for
most checks (run as Administrator for full coverage of system-level policies).

---

## Prerequisites

```bash
npm install -g pkg          # bundles Node.js app into a standalone .exe
npm install tsx             # compile launcher.ts to JS before bundling
```

Download osquery for Windows (MSI or standalone .exe):
https://osquery.io/downloads/official/

Place `osqueryi.exe` in `scanner/bin/windows/osqueryi.exe` before building.

---

## Build

```bash
# From repo root:
npm run build:scanner
```

This runs:
```bash
cd scanner
npx tsc launcher.ts --outDir dist-ts --esModuleInterop --resolveJsonModule
pkg dist-ts/launcher.js \
  --targets node18-win-x64 \
  --output ../dist/CEScan-win.exe \
  --assets queries/**,bin/windows/osqueryi.exe
```

The result is a single `CEScan-win.exe` (~45 MB, includes Node runtime + osquery).

---

## Code signing options

Windows SmartScreen blocks unsigned executables with "Windows protected your PC".
Signing with a trusted certificate removes this warning. Options ranked by cost:

### Option A — Azure Trusted Signing (Recommended, cheapest)
**Cost:** ~SGD 14/month (Microsoft Azure)  
**Trust:** Microsoft Trusted Root Program → no SmartScreen warning  
**Process:**
1. Create Azure account → Trusted Signing resource
2. `az trustedsigning certificate-profile create --name CETool`
3. Integrate with `signtool.exe`:
   ```
   signtool sign /fd SHA256 /tr http://timestamp.acs.microsoft.com /td SHA256
     /dlib Azure.CodeSigning.Dlib.dll /dmdf metadata.json dist/CEScan-win.exe
   ```
**Best for:** Production distribution to SMEs with no IT dept.

---

### Option B — DigiCert OV Code Signing
**Cost:** ~USD 300–500/year  
**Trust:** Immediate SmartScreen trust (EV cert = instant; OV = after reputation builds)  
**Process:**
1. Purchase OV certificate at digicert.com/code-signing
2. Identity verification takes 1–3 business days
3. `signtool sign /n "Your Org Name" /fd SHA256 /tr http://timestamp.digicert.com dist/CEScan-win.exe`
**Best for:** Production with EV-grade trust immediately.

---

### Option C — Self-signed (Development / internal use only)
**Cost:** Free  
**Trust:** SmartScreen warning shown ("Unknown publisher") — users click "More info → Run anyway"  
**Process:**
```powershell
# Generate self-signed cert (run once on build machine)
$cert = New-SelfSignedCertificate `
  -Subject "CN=CE Tool Scanner (Development)" `
  -Type CodeSigning `
  -CertStoreLocation Cert:\CurrentUser\My `
  -HashAlgorithm SHA256

# Export to PFX
Export-PfxCertificate -Cert $cert -FilePath cetool-dev.pfx -Password (ConvertTo-SecureString "changeme" -AsPlainText -Force)

# Sign
signtool sign /f cetool-dev.pfx /p changeme /fd SHA256 /tr http://timestamp.digicert.com dist/CEScan-win.exe
```
**Best for:** Testing on VMs, internal pilots. Not for public distribution.

---

### Option D — Windows Package Manager (winget) submission
**Cost:** Free (after signing with Option A or B)  
**Trust:** winget-verified, Defender marks as known-good  
**Process:** Submit to winget-pkgs GitHub repo after initial signing.  
**Timeline:** 1–2 weeks for review.  
**Best for:** Ongoing distribution to organisations with IT departments.

---

## Virtual machine testing before distribution

Test the .exe on a clean VM before signing and distributing:

```bash
# Recommended test sequence:

# 1. Spin up a Windows 11 VM (Hyper-V, VMware, VirtualBox, or Azure)
# 2. Copy CEScan-win.exe to the VM (no other tools needed)
# 3. Run as standard user:
CEScan-win.exe --verbose

# 4. Run as Administrator:
CEScan-win.exe --verbose

# 5. Verify JSON output:
CEScan-win.exe --out C:\Temp\ce-results.json
# Open ce-results.json — check all clause IDs are present, rows are populated

# 6. Test on older Windows (Windows 10 21H2 minimum):
# Repeat steps 3-5

# 7. Test the PowerShell alternative:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\ce-audit.ps1 -Verbose
```

### VM images for testing (all free for evaluation):
- **Windows 11 dev VM:** https://developer.microsoft.com/en-us/windows/downloads/virtual-machines/
- **Windows 10 LTSC:** Microsoft Evaluation Center
- **Azure Spot VM:** ~SGD 0.10/hr for a B2s VM, delete when done

---

## CI pipeline (GitHub Actions)

```yaml
# .github/workflows/build-scanner.yml
name: Build Scanner

on:
  push:
    paths:
      - 'scanner/**'
    tags:
      - 'scanner-v*'

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build:scanner
      - name: Sign (Azure Trusted Signing)
        uses: azure/trusted-signing-action@v0
        with:
          azure-tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          azure-client-id: ${{ secrets.AZURE_CLIENT_ID }}
          azure-client-secret: ${{ secrets.AZURE_CLIENT_SECRET }}
          endpoint: https://eus.codesigning.azure.net/
          trusted-signing-account-name: cetool-signing
          certificate-profile-name: CETool
          files-folder: dist
          files-folder-filter: exe
      - uses: actions/upload-artifact@v4
        with:
          name: CEScan-win
          path: dist/CEScan-win.exe
```

---

## File size targets

| Component | Approximate size |
|---|---|
| Node.js 20 runtime (pkg baseline) | ~35 MB |
| osqueryi.exe | ~25 MB |
| Query pack + launcher code | < 1 MB |
| **Total** | **~60 MB** |

For distribution, host on the CE Tool's own CDN or an S3/Cloudflare R2 bucket.
Serve with `Content-Disposition: attachment; filename="CEScan-win.exe"`.
