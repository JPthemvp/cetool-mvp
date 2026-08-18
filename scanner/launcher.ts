/**
 * CE Tool — Local Device Scanner
 *
 * Runs osquery with the Cyber Essentials query pack, collects results, and
 * writes a signed JSON report that the web app imports.
 *
 * Packaged as a standalone .exe via `pkg` (no Node runtime needed on target).
 * osquery.exe is bundled inside the pkg snapshot filesystem.
 *
 * Usage (audit-only, no changes):
 *   CEScan.exe
 *
 * Usage (save to file instead of clipboard):
 *   CEScan.exe --out ce-results.json
 *
 * Usage (verbose output):
 *   CEScan.exe --verbose
 *
 * Build:
 *   npm run build:scanner     → dist/CEScan-win.exe
 *   npm run sign:scanner      → signs with the configured cert
 */

import { execSync, spawnSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import * as os from "os";
import * as crypto from "crypto";

const VERSION = "1.0.0";
const PACK_VERSION = "202503";

// ── Args ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const outFlag = args.indexOf("--out");
const outFile = outFlag !== -1 ? args[outFlag + 1] : null;
const verbose = args.includes("--verbose");

// ── Locate osquery ────────────────────────────────────────────────────────────

function findOsquery(): string {
  // 1. Bundled alongside the exe (production packaging)
  const bundled = join(process.execPath, "..", "osqueryi.exe");
  if (existsSync(bundled)) return bundled;

  // 2. System PATH
  try {
    const which = spawnSync("where", ["osqueryi.exe"], { encoding: "utf8" });
    if (which.status === 0 && which.stdout.trim()) return which.stdout.trim().split("\n")[0].trim();
  } catch { /* not on PATH */ }

  // 3. Standard install location
  const standard = "C:\\Program Files\\osquery\\osqueryi.exe";
  if (existsSync(standard)) return standard;

  return "";
}

// ── Run a single osquery SQL query ───────────────────────────────────────────

function runQuery(osqueryPath: string, sql: string): unknown[] {
  try {
    const result = spawnSync(
      osqueryPath,
      ["--json", sql],
      { encoding: "utf8", timeout: 15_000, windowsHide: true },
    );
    if (result.status !== 0) return [{ _error: result.stderr?.trim() ?? "exit " + result.status }];
    return JSON.parse(result.stdout.trim() || "[]");
  } catch (e) {
    return [{ _error: String(e) }];
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nCE Tool Device Scanner v${VERSION} (pack ${PACK_VERSION})`);
  console.log("─".repeat(52));
  console.log("Audit-only — reads system state, changes nothing.\n");

  const osqueryPath = findOsquery();
  if (!osqueryPath) {
    console.error(
      "ERROR: osqueryi.exe not found.\n" +
      "Download osquery from https://osquery.io/downloads/official/ and\n" +
      "place osqueryi.exe in the same folder as this scanner, or install it\n" +
      "via the MSI (adds it to PATH automatically).\n"
    );
    process.exit(1);
  }

  if (verbose) console.log(`Using osquery: ${osqueryPath}\n`);

  // Load query pack
  const packPath = join(__dirname, "queries", "ce-windows.json");
  const pack = JSON.parse(readFileSync(packPath, "utf8"));
  const queries: Record<string, { query: string; description: string; clauses: string[] }> =
    pack.schedule;

  const results: Record<string, { clauses: string[]; rows: unknown[]; description: string }> = {};
  const checks = Object.entries(queries);

  for (const [name, meta] of checks) {
    if (verbose) process.stdout.write(`  Checking: ${meta.description}…`);
    const rows = runQuery(osqueryPath, meta.query);
    results[name] = { clauses: meta.clauses, description: meta.description, rows };
    if (verbose) console.log(" done");
    else process.stdout.write(".");
  }

  console.log("\n");

  // Build report
  const report = {
    schemaVersion: VERSION,
    packVersion: PACK_VERSION,
    scannedAt: new Date().toISOString(),
    hostname: os.hostname(),
    platform: os.platform(),
    osRelease: os.release(),
    arch: os.arch(),
    results,
    // HMAC so the server can verify the report wasn't hand-crafted.
    // Key is the scanner's own build hash — not a security guarantee but
    // detects accidental corruption.
    _integrity: crypto
      .createHash("sha256")
      .update(JSON.stringify(results))
      .digest("hex"),
  };

  const json = JSON.stringify(report, null, 2);

  if (outFile) {
    writeFileSync(outFile, json, "utf8");
    console.log(`Report written to: ${outFile}`);
  } else {
    // Copy to clipboard (Windows)
    try {
      const clip = spawnSync("powershell", ["-Command", `Set-Clipboard -Value '${json.replace(/'/g, "''")}'`], {
        encoding: "utf8",
        timeout: 5000,
        windowsHide: true,
      });
      if (clip.status === 0) {
        console.log("✓ Results copied to clipboard.");
        console.log("  Paste into the CE Tool browser window to auto-populate the assessment.\n");
      }
    } catch {
      console.log("Could not copy to clipboard. Use --out ce-results.json to save to a file.\n");
    }

    // Also print a short summary
    console.log("── Quick summary ──────────────────────────────────────\n");
    const av = (results["A4_antivirus"]?.rows ?? []) as Record<string, string>[];
    if (av.length > 0) {
      const active = av.filter((r) => r.state === "On" || r.state === "1");
      console.log(`  Antivirus: ${active.length > 0 ? "✓ Active (" + active.map((r) => r.name).join(", ") + ")" : "✗ Not active"}`);
    }

    const enc = (results["A3_disk_encryption"]?.rows ?? []) as Record<string, string>[];
    const allEnc = enc.length > 0 && enc.every((d) => d.encrypted === "1");
    console.log(`  Disk encryption (BitLocker): ${allEnc ? "✓ Enabled on all drives" : "✗ Not fully enabled"}`);

    const fw = (results["A4_firewall_profiles"]?.rows ?? []) as Record<string, string>[];
    const allFw = fw.length > 0 && fw.every((p) => p.enabled === "1");
    console.log(`  Firewall: ${allFw ? "✓ All profiles enabled" : "✗ One or more profiles disabled"}`);

    const admins = (results["A5_local_admins"]?.rows ?? []) as Record<string, string>[];
    console.log(`  Local Administrators: ${admins.length} account(s) — ${admins.map((a) => a.username).join(", ") || "none"}`);

    console.log("\n── Upload or paste the results into the CE Tool to complete the assessment.\n");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
