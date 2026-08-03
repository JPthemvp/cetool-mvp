/** Emits the generated scripts to disk so they can be smoke-tested for real. */
import { writeFileSync } from "node:fs";
import { CHECKS, buildAssessmentScript, buildBackupScript } from "../lib/scripts";
import { UNIX_CHECKS, buildUnixScript } from "../lib/scripts-unix";

const out = process.argv[2] ?? ".";

writeFileSync(
  `${out}/cyber-essentials-tool-check.ps1`,
  buildAssessmentScript({
    selected: CHECKS.map((c) => c.id),
    includeRemediation: true,
    org: "Smoke Test Pte Ltd",
  }),
  "utf8",
);

writeFileSync(
  `${out}/cyber-essentials-tool-backup.ps1`,
  buildBackupScript({ source: "C:\\Users", destination: "D:\\Backup", time: "22:00" }),
  "utf8",
);

writeFileSync(
  `${out}/cyber-essentials-check.sh`,
  buildUnixScript({ selected: UNIX_CHECKS.map((c) => c.id), org: "Smoke Test Pte Ltd" }),
  "utf8",
);

console.log(`wrote 3 scripts to ${out}`);
