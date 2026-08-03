# Cyber Essentials Tool

A free, non-intrusive self-assessment tool that takes a Singapore SME from "we have
no idea where we stand" to a submission-ready CSA **Cyber Essentials mark**
self-assessment — and shows how far that already carries them towards the
**Cyber Trust mark**.

```bash
npm install
npm run dev      # http://localhost:3100
```

## The gap this fills

CSA's Cyber Health Check gives an SME a score. The Internet Hygiene Portal tells it
which headers and records are missing. Neither says *"…and therefore clause A.6.4(b)
of the mark you are trying to earn is not met"*. The journey ends at a gap list.

This tool closes that loop:

1. **Discover** — passive external scan of the SME's domain.
2. **Map** — every finding is tied to the Cyber Essentials clause it bears on.
3. **Prioritise** — gaps ranked by likelihood × impact, with effort tracked separately.
4. **Prepare** — the self-assessment, pre-filled from evidence that could be verified.
5. **Hand off** — a results tab an assessor can read, exportable as CSV or JSON.

## The seven capabilities

| | Page | What it does |
|---|---|---|
| 01 | `/discover` | Live DNS, email-auth, TLS, HTTP header and exposure checks |
| 02 | `/assets` | Discovered assets, exportable as the A.2.4(a) inventory |
| 03 | `/prioritise` | Risk-ranked gaps, quick wins split out, one action per gap |
| 04 | `/guide` | All 9 measures with ordered remediation steps and CSA toolkits |
| — | `/toolkit` | Optional local PowerShell check and hardening scripts |
| 05 | `/prepare` + `/results` | The self-assessment and the results tab that replaces CSA's |
| 06 | `/monitor` | Re-scan cadence and drift history |
| 07 | `/integrate` | Sector funding, CISOaaS providers, certification bodies |

The nav is hidden until the user commits to the journey — the landing page asks for
one decision, not ten.

## Framework data

Modelled on CSA's published specifications, held in `lib/`:

- `ce-framework.ts` — Cyber Essentials mark (V202503, as expanded 15 Apr 2025 for
  Cloud, OT and AI): **5 categories, 9 measures, 75 clauses**, each preserving the
  published `shall` / `should` obligation, because that distinction is what decides
  certification.
- `ct-framework.ts` — Cyber Trust mark (V202504): **22 domains, 5 tiers**, encoded
  from Table 7. The eight domains CSA marks with `*` ("Measures in Cyber Essentials
  mark") are the official bridge between the two marks — which is why the tool can
  tell an SME that finishing Cyber Essentials covers **8 of the 10** domains at the
  Supporter tier.

`npm run check` asserts the encoded data matches the source: 22 domains numbered
1–22, tier counts of 10/13/19/21/22, exactly 8 CE-covered domains, and every mapping
pointing at a real clause.

## Two pathways

Chosen on the start page. Both assess all 75 clauses and both end in the same
submittable results tab — the choice is *who answers the technical half*
(`lib/pathways.ts`).

| | Scan and self-assess | Run a check on your devices |
|---|---|---|
| Install | Nothing | A check you run per machine |
| Pre-answered for you | 4 | 11 |
| Evidence given, you confirm | 6 | 13 |
| You answer from scratch | 65 | 51 |
| Assisted overall | 13% | 32% |

**43 of 75 clauses are people-and-process** and come back to the user on either
route. That is not a gap in the agent — training, approvals, incident plans and
restore tests exist only in how an organisation behaves. `npm run pathways`
prints the split per measure.

`lib/answerability.ts` classifies every clause `machine` / `mixed` / `human`,
defaulting to `human` so a clause added later is never silently claimed as
automated. `mixed` is deliberately not folded into `machine`: the agent can count
local administrators but cannot know the fourth one left in March, and presenting
that as "answered" is the overclaim that gets an SME failed at audit. Tests assert
A.1, A.9, and backup isolation and restore testing can never be reclassified.

The assessment page can be filtered to **People and process** so a user on the
agent pathway goes straight to the questions only they can answer.

## What it can and cannot evidence

`npx tsx scripts/coverage.ts`, computed from the mapping tables so the claim
cannot drift from the code:

```
Reachable by external scan    10 / 75   (13%)
Reachable by local script     21 / 75   (28%)
Reachable by either           24 / 75   (32%)
Pure self-declaration         51 / 75   (68%)

Mandatory clauses with an automated signal   19 / 52  (37%)
```

**Roughly a third**, and the product says so on the assessment page rather than
implying the whole thing is automated. Incident response is 0 of 4 — a plan either
exists or it does not, and no scanner can tell. A check in `npm run check` fails if
coverage moves outside 25–45%, so the copy and the code cannot diverge.

That third is still materially more than Cyber Health Check or IHP manage today,
which is why the honest framing is also the stronger one.

## Two scan modes, and why

Not every check is the same kind of act, so they are separated and **passive is the
default** (`lib/authorisation.ts`).

**Configuration check** — DNS records, TLS handshake, one fetch of the homepage.
This is what any browser does, and it is the boundary CSA's Internet Hygiene Portal
stays inside. Safe on any domain.

**Exposure probe** — additionally requests `/.env`, `/.git/config`, database dumps.
Those files are never meant to be served, so asking for them is a security test, not
browsing. It lands in the target's WAF logs as reconnaissance, and in Singapore
unauthorised access is an offence under the Computer Misuse Act. Requires either an
explicit attestation of authority or a DNS TXT proof — and the server **re-checks
the TXT record itself** rather than trusting the client's claim.

Subdomain discovery reads Certificate Transparency logs, which are third-party
records, so that query never touches the scanned domain and runs in both modes.

## Scanning

`lib/scan.ts` performs only checks any visitor could make: DNS records, the TLS
handshake, response headers on the homepage, and single GETs for files that should
never be public (`.env`, `.git/config`). No authentication, no port sweep, no writes.

Two design decisions matter more than the check list:

**Failure is not a finding.** `lib/resolver.ts` distinguishes an authoritative
"no such record" (NXDOMAIN/NODATA) from "we could not ask" (ECONNREFUSED, timeout,
SERVFAIL). Only the former becomes a finding. Without this, a blocked resolver
reports "No SPF record" and pre-fills *not met* into a certification submission
because of a fault at our end. Checks that could not run are surfaced as **Unknown**
and are excluded from clause mapping entirely.

**DoH fallback.** If port 53 is blocked — routine on corporate and government
networks — the scanner falls back to DNS-over-HTTPS. The result records which
resolver answered.

## Mapping and pre-fill

`lib/mapping.ts` ties each check to its clauses with a confidence level
(`strong` / `supporting` / `indicative`).

The tool **pre-fills negatives only**. Observing TLS 1.0 accepted proves insecure
protocols are enabled; observing it refused proves nothing about the file server in
the back office. So a failing check can answer a clause "not met", but no external
check ever auto-answers "met" — that always needs the SME to confirm. This is what
keeps the submission defensible in front of an assessor, and it is why the results
tab records provenance (`Automated scan` vs `Self-declared`) per row.

## Sector obligations

Cyber Essentials is sector-neutral; the SME in front of it is not. `lib/sectors.ts`
layers sector duties onto specific measures without forking the clause set:

- **Licensed healthcare (HIA)** — MOH's two-hour incident report and 14-day detailed
  report fold into A.9; NEHR access control into A.5; audit trails into A.6.
- **Social service agency (NCSS)** — routes to the Transformation Sustainability
  Scheme, which funds this work at up to 80%, capped at $100k.
- **MAS-regulated**, **CII**, and a **general** default carrying PDPA breach
  notification.

Every obligation names its source, and the UI says the regulator is the authority,
not this tool.

## Local toolkit (optional)

`/toolkit` generates PowerShell the SME runs themselves — the middle path between a
web scan that cannot see inside the estate and an agent that would make this tool a
supply-chain target.

Three rules hold it together:

1. **Audit is the default.** Changing anything needs `-Mode Remediate`, then typing
   `CHANGE`, then a `y` per individual fix.
2. **Nothing changes without a way back.** Every remediation appends its undo command
   to a timestamped rollback script *before* applying.
3. **The SME can read it.** Plain ASCII PowerShell, no network calls, no downloads.
   They can hand it to their IT vendor for approval — a property an opaque `.exe`
   gives up entirely.

Checks are CIS Benchmark *aligned*, implemented here rather than wrapping CIS-CAT
Pro, which requires a paid SecureSuite membership and cannot be redistributed to
non-members. The benchmark documents are free; the tooling is not.

Results come back by paste, not upload. Failing checks pre-fill the matching clauses
as not met; passing checks never auto-answer "met", because one machine is not the
estate.

The backup generator deliberately refuses to claim success: a scheduled copy to an
always-connected drive does not satisfy A.8.4(g), and the script prints that warning
every run. A backup you wrongly believe in is worse than none.

## Scoring

- A clause is `shall` (mandatory) or `should` (recommended).
- Answers are `yes` / `partly` / `no` / **`not sure`** / `n/a`. "Not sure" is a real
  answer, borrowed from IASME's readiness tool: forcing an unsure SME to pick yes/no
  produces a guess, and a guessed "yes" survives all the way to the assessor. It
  blocks certification like a "no" but triggers an explanation rather than a penalty.
- Every clause carries one concrete action item (`lib/readiness.ts`), asserted by the
  check suite so none can be added without one.
- **Certifiable** requires every in-scope `shall` answered `yes` or `n/a`. An unmet
  `should` never blocks certification.
- Weighted score counts `partial` as half credit; `n/a` leaves the denominator.
- Scope answers on the Start page drop conditional clauses (mobile, BYOD, servers).

## Commands

```bash
npm run dev        # dev server on :3100
npm run build      # production build
npm run check      # framework, scoring, sector, authorisation, drift assertions (61)
npm run uat        # 3-endpoint estate driven through the real detection pipeline
npx tsx scripts/coverage.ts  # what share of the framework can be automated
npx tsx scripts/emit.ts .    # write the generated .ps1 out to smoke-test it
npm run typecheck  # tsc --noEmit
```

## State of the build

Real and working: the scan engine, finding→clause mapping, risk prioritisation, the
assessment, scoring, the results tab and both exports.

Stubbed, and labelled as such in the UI:

- **Corppass onboarding** fills demo particulars; the real flow needs the Corppass
  integration and an ACRA entity lookup.
- **Monitoring cadence** does not fire on its own — it needs a server-side job
  runner. The scan it would run is real and can be triggered manually.
- **Cloud discovery** (Microsoft 365 / Google Workspace / AWS posture) is in the
  capability model but not implemented; it needs OAuth consent per tenant. This is
  where CIS Benchmarks content would plug in for automated secure-configuration
  assessment against A.6.
- **Persistence** is `localStorage`, single browser. A real deployment needs
  accounts and a database.

Not affiliated with CSA. The tool does not confer certification — an appointed
certification body performs the independent assessment.
