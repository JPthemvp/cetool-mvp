/**
 * Cyber Essentials Readiness Tool — 7-slide pitch deck
 *
 * Usage:
 *   node build-deck.js            → dark theme (default)
 *   node build-deck.js --light    → white/light background
 */

const pptxgen = require("pptxgenjs");

// ── Theme toggle ─────────────────────────────────────────────────────────────
const THEME = process.argv.includes("--light") ? "light" : "dark";

const DARK = {
  ground:  "0D1B2A",
  panel:   "121F30",
  panelB:  "0F1C2B",
  border:  "1E3045",
  // emerald
  em:      "10B981",
  em2:     "059669",
  emBg:    "0D2B22",
  emBorder:"1B5E44",
  // reds
  red:     "DC2626",
  redBg:   "1E0A0A",
  redBorder:"4A1515",
  redText: "FCA5A5",
  // sky
  sky:     "38BDF8",
  skyBg:   "0A1F30",
  skyBorder:"1A4060",
  // gold / amber
  gold:    "F59E0B",
  goldBg:  "2A1F08",
  goldBorder:"5E4010",
  goldText:"FDE68A",
  // text
  white:   "FFFFFF",
  silver:  "94A3B8",
  muted:   "64748B",
  good:    "6EE7B7",
  bad:     "FCA5A5",
  // topbar
  topBg:   "0D1B2A",
  topText: "10B981",
  // compare
  cmpGoodBg: "0A1E14", cmpGoodBorder: "1A4A2A", cmpGoodText: "6EE7B7",
  cmpBadBg:  "1E0A0A", cmpBadBorder:  "4A1515", cmpBadText:  "FCA5A5",
  // note / workaround box
  notesBg: "0A1E14", notesBorder: "1A4A2A", notesText: "6EE7B7",
  // limitation cards
  limitAmberBg: "211800", limitAmberBorder: "5E3A00",
  limitMutedBg: "121F30", limitMutedBorder: "1E3045",
  limitRedBg:   "1E0A0A", limitRedBorder:   "4A1515",
  // roadmap cards
  rmGreenBg:  "0D2B22", rmGreenBorder:  "1B5E44",
  rmSkyBg:    "0A1F30", rmSkyBorder:    "1A4060",
  rmGoldBg:   "2A1F08", rmGoldBorder:   "5E4010",
  rmPurpleBg: "1A1030", rmPurpleBorder: "3A2060",
};

const LIGHT = {
  ground:  "FFFFFF",
  panel:   "F1F5F9",
  panelB:  "F8FAFC",
  border:  "CBD5E1",
  // emerald (darker for contrast on white)
  em:      "059669",
  em2:     "047857",
  emBg:    "DCFCE7",
  emBorder:"86EFAC",
  // reds
  red:     "DC2626",
  redBg:   "FEE2E2",
  redBorder:"FCA5A5",
  redText: "991B1B",
  // sky
  sky:     "0284C7",
  skyBg:   "E0F2FE",
  skyBorder:"BAE6FD",
  // gold
  gold:    "D97706",
  goldBg:  "FEF3C7",
  goldBorder:"FCD34D",
  goldText:"92400E",
  // text
  white:   "1E293B",   // primary text (dark)
  silver:  "64748B",
  muted:   "94A3B8",
  good:    "166534",
  bad:     "991B1B",
  // topbar
  topBg:   "F8FAFC",
  topText: "059669",
  // compare
  cmpGoodBg: "F0FDF4", cmpGoodBorder: "86EFAC", cmpGoodText: "166534",
  cmpBadBg:  "FEF2F2", cmpBadBorder:  "FCA5A5", cmpBadText:  "991B1B",
  // notes
  notesBg: "F0FDF4", notesBorder: "86EFAC", notesText: "166534",
  // limitation cards
  limitAmberBg: "FFFBEB", limitAmberBorder: "FCD34D",
  limitMutedBg: "F1F5F9", limitMutedBorder: "CBD5E1",
  limitRedBg:   "FEF2F2", limitRedBorder:   "FCA5A5",
  // roadmap
  rmGreenBg:  "DCFCE7", rmGreenBorder:  "86EFAC",
  rmSkyBg:    "E0F2FE", rmSkyBorder:    "BAE6FD",
  rmGoldBg:   "FEF3C7", rmGoldBorder:   "FCD34D",
  rmPurpleBg: "EDE9FE", rmPurpleBorder: "C4B5FD",
};

const C = THEME === "light" ? LIGHT : DARK;

// ── pptxgenjs setup ──────────────────────────────────────────────────────────
const F = { head: "Cambria", body: "Calibri" };

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";   // 13.33 × 7.5"
pres.author = "Cyber Essentials Readiness Tool";
pres.title  = "Cyber Essentials Readiness Tool — Pitch Deck";

const W   = 13.33;
const H   = 7.5;
const M   = 0.6;
const CW  = W - M * 2;    // 12.13
const TB  = 0.52;          // top bar height
const LC  = 5.6;           // normal left col
const LCW = 6.3;           // wide left col
const GAP = 0.35;
const TOTAL = 7;

// ── Helpers ──────────────────────────────────────────────────────────────────
function bg(s) { s.background = { color: C.ground }; }

function topBar(s, num) {
  s.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: W, h: TB,
    fill: { color: C.topBg }, line: { color: C.border, width: 0.5 },
  });
  s.addText("CYBER ESSENTIALS READINESS TOOL", {
    x: M, y: 0, w: 8, h: TB,
    fontFace: F.body, fontSize: 10, bold: true, color: C.topText,
    charSpacing: 1.8, valign: "middle", margin: 0,
  });
  s.addText(`0${num} / 0${TOTAL}`, {
    x: W - M - 1.5, y: 0, w: 1.5, h: TB,
    fontFace: F.body, fontSize: 10, color: C.muted,
    charSpacing: 1.2, align: "right", valign: "middle", margin: 0,
  });
}

function accentLine(s) {
  s.addShape(pres.ShapeType.rect, {
    x: 0, y: H - 0.04, w: W, h: 0.04,
    fill: { color: C.em }, line: { type: "none" },
  });
}

function eyebrow(s, text, x, y, w) {
  s.addText(text.toUpperCase(), {
    x, y, w, h: 0.22,
    fontFace: F.body, fontSize: 10, bold: true, color: C.em,
    charSpacing: 2, margin: 0,
  });
}

function divider(s, x, y, w) {
  s.addShape(pres.ShapeType.rect, { x, y, w, h: 0.01, fill: { color: C.border } });
}

function panel(s, x, y, w, h) {
  s.addShape(pres.ShapeType.roundRect, {
    x, y, w, h,
    fill: { color: C.panel }, line: { color: C.border, width: 0.75 },
    rectRadius: 0.14,
  });
}

function panelLabel(s, text, x, y, w) {
  s.addText(text.toUpperCase(), {
    x: x + 0.28, y: y + 0.2, w, h: 0.2,
    fontFace: F.body, fontSize: 9, bold: true, color: C.muted,
    charSpacing: 1.6, margin: 0,
  });
}

function statCard(s, x, y, w, h, label, value, valueColor) {
  s.addShape(pres.ShapeType.roundRect, {
    x, y, w, h,
    fill: { color: C.panelB }, line: { color: C.border, width: 0.75 }, rectRadius: 0.1,
  });
  s.addText(label.toUpperCase(), {
    x: x + 0.14, y: y + 0.12, w: w - 0.28, h: 0.18,
    fontFace: F.body, fontSize: 8, bold: true, color: C.muted, charSpacing: 1.2, margin: 0, align: "center",
  });
  s.addText(value, {
    x: x + 0.14, y: y + 0.32, w: w - 0.28, h: 0.58,
    fontFace: F.head, fontSize: 30, bold: true, color: valueColor || C.white,
    align: "center", valign: "middle", margin: 0,
  });
}

/** Returns the chip width so the caller can advance x. */
function chip(s, text, x, y, tone) {
  const tones = {
    em:    { bg: C.emBg,      text: C.em,      border: C.emBorder },
    red:   { bg: C.redBg,     text: C.redText,  border: C.redBorder },
    sky:   { bg: C.skyBg,     text: C.sky,      border: C.skyBorder },
    gold:  { bg: C.goldBg,    text: C.gold,     border: C.goldBorder },
    muted: { bg: C.panel,     text: C.silver,   border: C.border },
  };
  const t = tones[tone] || tones.muted;
  const w = text.length * 0.088 + 0.38;
  s.addShape(pres.ShapeType.roundRect, {
    x, y, w, h: 0.28,
    fill: { color: t.bg }, line: { color: t.border, width: 0.75 }, rectRadius: 0.06,
  });
  s.addText(text.toUpperCase(), {
    x, y, w, h: 0.28,
    fontFace: F.body, fontSize: 9, bold: true, color: t.text,
    charSpacing: 0.5, align: "center", valign: "middle", margin: 0,
  });
  return w + 0.1;
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 1 — Title
// ─────────────────────────────────────────────────────────────────────────────
{
  const s = pres.addSlide(); bg(s); topBar(s, 1);
  const LX = M, RX = M + LC + GAP, RW = CW - LC - GAP, CY = TB + 0.14;

  // Hero badge
  s.addShape(pres.ShapeType.roundRect, {
    x: LX, y: CY, w: 3.8, h: 0.32,
    fill: { color: C.emBg }, line: { color: C.emBorder, width: 0.75 }, rectRadius: 0.16,
  });
  s.addShape(pres.ShapeType.ellipse, { x: LX + 0.18, y: CY + 0.1, w: 0.12, h: 0.12, fill: { color: C.em } });
  s.addText("Free · Open-source · Non-intrusive", {
    x: LX + 0.42, y: CY, w: 3.2, h: 0.32,
    fontFace: F.body, fontSize: 11, bold: true, color: C.em, valign: "middle", margin: 0,
  });

  s.addText("Know where you\nstand. ", {
    x: LX, y: CY + 0.46, w: LC, h: 1.1,
    fontFace: F.head, fontSize: 40, bold: true, color: C.white, lineSpacing: 46, margin: 0,
  });
  s.addText("Before", { x: LX, y: CY + 1.42, w: LC, h: 0.55, fontFace: F.head, fontSize: 40, bold: true, color: C.em, margin: 0 });
  s.addText("the assessor does.", { x: LX, y: CY + 1.9, w: LC, h: 0.6, fontFace: F.head, fontSize: 40, bold: true, color: C.white, margin: 0 });

  s.addText(
    "A readiness scan built for Singapore companies with low resources, budget & know-how" +
    " — no invasive tests, no vendor lock-in. Just an honest gap analysis mapped to every CSA Cyber Essentials clause.",
    { x: LX, y: CY + 2.62, w: LC, h: 1.1, fontFace: F.body, fontSize: 13, color: C.silver, lineSpacing: 20, margin: 0 }
  );

  divider(s, LX, CY + 3.82, LC);
  let cx = LX;
  [["CSA Cyber Essentials","em"],["9 Measures · 75 Clauses","sky"]].forEach(([t,tn]) => { cx += chip(s,t,cx,CY+3.96,tn); });

  // Right panel
  panel(s, RX, CY, RW, 6.1);
  panelLabel(s, "Assessment coverage", RX, CY, RW - 0.56);
  const cW = (RW - 0.56 - 0.2) / 3;
  [["Measures","9",C.white],["Clauses","75",C.white],["Cost","Free",C.em]].forEach(([lbl,val,col],i) => {
    statCard(s, RX+0.28+i*(cW+0.1), CY+0.52, cW, 1.05, lbl, val, col);
  });
  divider(s, RX+0.28, CY+1.7, RW-0.56);
  panelLabel(s, "Designed for", RX, CY+1.7, RW-0.56);
  s.addText("Singapore companies with low resources, budget & know-how", {
    x: RX+0.28, y: CY+2.04, w: RW-0.56, h: 0.4,
    fontFace: F.body, fontSize: 13, bold: true, color: C.em, lineSpacing: 18, margin: 0,
  });
  ["Health clinics & polyclinics","Workshops & light manufacturing","Government agencies & stat boards"].forEach((txt,i) => {
    s.addShape(pres.ShapeType.ellipse, { x: RX+0.32, y: CY+2.62+i*0.46, w: 0.09, h: 0.09, fill: { color: C.border } });
    s.addText(txt, { x: RX+0.52, y: CY+2.54+i*0.46, w: RW-0.8, h: 0.3, fontFace: F.body, fontSize: 12, color: C.silver, valign: "middle", margin: 0 });
  });

  accentLine(s);
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 2 — The Problem
// ─────────────────────────────────────────────────────────────────────────────
{
  const s = pres.addSlide(); bg(s); topBar(s, 2);
  const LX = M, RX = M + LCW + GAP, RW = CW - LCW - GAP, CY = TB + 0.12;

  eyebrow(s, "The gap in the market", LX, CY, LCW);
  s.addText("SMEs need CE.\nExisting tools\ndon't ", { x: LX, y: CY+0.28, w: LCW, h: 1.6, fontFace: F.head, fontSize: 38, bold: true, color: C.white, lineSpacing: 43, margin: 0 });
  s.addText("fit.", { x: LX, y: CY+1.7, w: LCW, h: 0.55, fontFace: F.head, fontSize: 38, bold: true, color: C.em, margin: 0 });

  s.addText(
    "Most cybersecurity tools are built for large enterprises — invasive agents, complex dashboards, and price tags that assume an in-house security team.\n\n" +
    "Currently, CSA uses an Excel self-assessment template. Organisations face 75 clauses cold, with no prior scan data and no clear action plan.",
    { x: LX, y: CY+2.36, w: LCW, h: 1.8, fontFace: F.body, fontSize: 12.5, color: C.silver, lineSpacing: 19, margin: 0 }
  );

  divider(s, LX, CY+4.26, LCW);
  let cx = LX;
  [["No IT team on-site","red"],["Invasive tools = risk","red"],["Excel is not enough","red"]].forEach(([t,tn]) => { cx += chip(s,t,cx,CY+4.4,tn); });

  // Comparison table
  const colX = [RX, RX + RW/2 + 0.05], colW = RW/2 - 0.08;
  [["❌  Before","F87171"],[" ✓  With this tool", C.em]].forEach(([h,col],i) => {
    s.addText(h, { x: colX[i], y: CY+0.05, w: colW, h: 0.28, fontFace: F.body, fontSize: 10, bold: true, color: col, charSpacing: 1.2, margin: 0 });
  });

  [
    ["Blank Excel self-assessment with 75 rows",            "Digital clauses pre-filled from live scan data"],
    ["No idea which gaps matter most",                      "Gaps ranked by risk band & fix effort"],
    ["Vendor tools require agent installation",             "Zero install — runs from a browser tab"],
    ["Must find Certification Bodies separately",           "Certification Bodies contacts + pre-filled email built in"],
    ["CISOaaS providers listed elsewhere",                  "Funding routes & providers on one page"],
  ].forEach((row, ri) => {
    const ry = CY + 0.4 + ri * 1.1;
    row.forEach((cell, ci) => {
      const bad = ci === 0;
      s.addShape(pres.ShapeType.roundRect, {
        x: colX[ci], y: ry, w: colW, h: 0.95,
        fill: { color: bad ? C.cmpBadBg : C.cmpGoodBg },
        line: { color: bad ? C.cmpBadBorder : C.cmpGoodBorder, width: 0.75 }, rectRadius: 0.08,
      });
      s.addText(cell, { x: colX[ci]+0.14, y: ry+0.08, w: colW-0.28, h: 0.8, fontFace: F.body, fontSize: 11.5, color: bad ? C.cmpBadText : C.cmpGoodText, lineSpacing: 16, margin: 0 });
    });
  });

  accentLine(s);
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 3 — How it works
// ─────────────────────────────────────────────────────────────────────────────
{
  const s = pres.addSlide(); bg(s); topBar(s, 3);
  const LX = M, RX = M + LC + GAP, RW = CW - LC - GAP, CY = TB + 0.12;

  eyebrow(s, "Five-step guided journey", LX, CY, LC);
  s.addText("One flow.\nNo surprises.", { x: LX, y: CY+0.28, w: LC, h: 1.4, fontFace: F.head, fontSize: 38, bold: true, color: C.white, lineSpacing: 43, margin: 0 });
  s.addText(
    "Users are guided through a locked sequence — each step unlocks only when the previous one is done. Evidence from scans carries forward automatically into the self-assessment.",
    { x: LX, y: CY+1.78, w: LC, h: 1.0, fontFace: F.body, fontSize: 13, color: C.silver, lineSpacing: 19, margin: 0 }
  );
  divider(s, LX, CY+2.88, LC);
  s.addText("Average session time  ·  ~60 minutes  ·  saves progress in browser", { x: LX, y: CY+3.02, w: LC, h: 0.24, fontFace: F.body, fontSize: 11, color: C.muted, margin: 0 });

  const steps = [
    ["1","Setup — Organisation profile",      "Enter company name, UEN, sector, pathway. Scoping questions determine which clauses apply."],
    ["2","Discover — External domain scan",   "Passive DNS, TLS, email auth (SPF/DKIM/DMARC), HTTP headers + Shodan attack surface. Findings pre-fill clauses automatically."],
    ["3","Harden — Local device check",       "Optional PowerShell script (read-only, no network calls). Paste results back — endpoint findings fill remaining clauses."],
    ["4","Assess — Digital self-assessment",  "All 75 CE clauses in plain English. Pre-filled where scan answered. Attach evidence references, add notes per clause."],
    ["5","Results — Export & submit",         "Excel + JSON export, signed declaration, pre-filled Certification Bodies email. CISOaaS funding routes shown."],
  ];
  const sH = 1.12;
  steps.forEach(([num,title,detail],i) => {
    const sy = CY + i * (sH + 0.1);
    s.addShape(pres.ShapeType.roundRect, { x: RX, y: sy, w: RW, h: sH, fill: { color: C.panel }, line: { color: C.border, width: 0.75 }, rectRadius: 0.1 });
    s.addShape(pres.ShapeType.ellipse, { x: RX+0.2, y: sy+(sH-0.36)/2, w: 0.36, h: 0.36, fill: { color: C.em2 } });
    s.addText(num, { x: RX+0.2, y: sy+(sH-0.36)/2, w: 0.36, h: 0.36, fontFace: F.body, fontSize: 12, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0 });
    s.addText(title, { x: RX+0.7, y: sy+0.1, w: RW-0.85, h: 0.28, fontFace: F.body, fontSize: 12.5, bold: true, color: C.white, margin: 0 });
    s.addText(detail, { x: RX+0.7, y: sy+0.38, w: RW-0.85, h: 0.66, fontFace: F.body, fontSize: 10.5, color: C.silver, lineSpacing: 15, margin: 0 });
  });

  accentLine(s);
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 4 — Four capabilities
// ─────────────────────────────────────────────────────────────────────────────
{
  const s = pres.addSlide(); bg(s); topBar(s, 4);
  const LX = M, RX = M + LCW + GAP, RW = CW - LCW - GAP, CY = TB + 0.12;

  eyebrow(s, "Open-source stack · zero cost", LX, CY, LCW);
  s.addText("Four capabilities.\n", { x: LX, y: CY+0.28, w: LCW, h: 0.9, fontFace: F.head, fontSize: 38, bold: true, color: C.white, lineSpacing: 43, margin: 0 });
  s.addText("All free.", { x: LX, y: CY+1.05, w: LCW, h: 0.55, fontFace: F.head, fontSize: 38, bold: true, color: C.em, margin: 0 });
  s.addText("All in one.", { x: LX, y: CY+1.55, w: LCW, h: 0.55, fontFace: F.head, fontSize: 38, bold: true, color: C.white, margin: 0 });
  s.addText(
    "Built entirely on open-source and publicly available intelligence. No paid API keys required for core functionality. Everything runs in the browser or on your own infrastructure.",
    { x: LX, y: CY+2.2, w: LCW, h: 0.9, fontFace: F.body, fontSize: 13, color: C.silver, lineSpacing: 19, margin: 0 }
  );
  divider(s, LX, CY+3.18, LCW);

  const features = [
    ["Internet Hygiene Portal",  "SPF · DKIM · DMARC · TLS · HTTPS · security headers — mapped to CE clauses automatically"],
    ["Shodan InternetDB",        "Free passive threat intel — open ports, exposed services (RDP, SMB, DBs), known CVEs mapped to CE A.5"],
    ["PowerShell Scripts",       "Read-only endpoint checks — antivirus, firewall, patch status, BitLocker. No install, no network calls."],
    ["Digital Self-Assessment",  "75 CE clauses in plain English — replaces Excel sheets. Evidence references, signature pad, clause notes."],
  ];
  const fW = (LCW - 0.2) / 2, fH = 1.3, fGap = 0.2;
  features.forEach(([name,desc],i) => {
    const col = i % 2, row = Math.floor(i/2);
    const fx = LX + col*(fW+fGap), fy = CY+3.38+row*(fH+0.18);
    s.addShape(pres.ShapeType.roundRect, { x: fx, y: fy, w: fW, h: fH, fill: { color: C.panel }, line: { color: C.border, width: 0.75 }, rectRadius: 0.1 });
    s.addText(name, { x: fx+0.18, y: fy+0.16, w: fW-0.36, h: 0.28, fontFace: F.body, fontSize: 12.5, bold: true, color: C.white, margin: 0 });
    s.addText(desc, { x: fx+0.18, y: fy+0.5, w: fW-0.36, h: 0.72, fontFace: F.body, fontSize: 10.5, color: C.silver, lineSpacing: 14.5, margin: 0 });
  });

  // Right: scan boundary
  panel(s, RX, CY, RW, 6.15);
  panelLabel(s, "Scan boundary — what we do & don't do", RX, CY, RW-0.56);
  let iy = CY+0.58;
  [
    "Public DNS records & email auth",
    "TLS certificate & HTTP headers",
    "Shodan passive port intelligence",
    "CT log subdomain discovery",
  ].forEach(t => {
    s.addText("✓", { x: RX+0.3, y: iy, w: 0.28, h: 0.28, fontFace: F.body, fontSize: 12, bold: true, color: C.em, margin: 0 });
    s.addText(t, { x: RX+0.62, y: iy, w: RW-0.9, h: 0.28, fontFace: F.body, fontSize: 11.5, color: C.good, margin: 0 });
    iy += 0.38;
  });
  iy += 0.1;
  [
    "No port sweeps or active probing",
    "No payload injection or exploits",
    "No authentication attempts",
    "No data stored on user devices",
  ].forEach(t => {
    s.addText("✗", { x: RX+0.3, y: iy, w: 0.28, h: 0.28, fontFace: F.body, fontSize: 12, bold: true, color: C.red, margin: 0 });
    s.addText(t, { x: RX+0.62, y: iy, w: RW-0.9, h: 0.28, fontFace: F.body, fontSize: 11.5, color: C.bad, margin: 0 });
    iy += 0.38;
  });
  s.addShape(pres.ShapeType.roundRect, { x: RX+0.28, y: iy+0.15, w: RW-0.56, h: 1.0, fill: { color: C.notesBg }, line: { color: C.notesBorder, width: 0.75 }, rectRadius: 0.08 });
  s.addText("Surface-level by design — the same boundary CSA's own Internet Hygiene Portal operates within. Safe to run at a clinic or government agency without IT approval.", { x: RX+0.44, y: iy+0.22, w: RW-0.88, h: 0.82, fontFace: F.body, fontSize: 10.5, color: C.notesText, lineSpacing: 15, margin: 0 });

  accentLine(s);
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 5 — Who it's for + CTA
// ─────────────────────────────────────────────────────────────────────────────
{
  const s = pres.addSlide(); bg(s); topBar(s, 5);
  const LX = M, RX = M + LC + GAP, RW = CW - LC - GAP, CY = TB + 0.12;

  eyebrow(s, "Get started today", LX, CY, LC);
  s.addText("Built for\nthe ", { x: LX, y: CY+0.28, w: LC, h: 0.95, fontFace: F.head, fontSize: 38, bold: true, color: C.white, lineSpacing: 43, margin: 0 });
  s.addText("organisations", { x: LX, y: CY+1.12, w: LC, h: 0.55, fontFace: F.head, fontSize: 38, bold: true, color: C.em, margin: 0 });
  s.addText("that need it most.", { x: LX, y: CY+1.62, w: LC, h: 0.55, fontFace: F.head, fontSize: 38, bold: true, color: C.white, margin: 0 });
  s.addText("No budget. No IT team. No prior cybersecurity knowledge needed. The tool walks you through every clause, explains what it means in plain English, and tells you what to fix first.", { x: LX, y: CY+2.28, w: LC, h: 0.9, fontFace: F.body, fontSize: 13, color: C.silver, lineSpacing: 19, margin: 0 });

  let cx = LX;
  [["Health clinics","em"],["Workshops","sky"],["Gov agencies","gold"],["Any SG SME","muted"]].forEach(([t,tn]) => { cx += chip(s,t,cx,CY+3.28,tn); });

  // CTA box
  s.addShape(pres.ShapeType.roundRect, { x: LX, y: CY+3.7, w: LC, h: 1.65, fill: { color: C.emBg }, line: { color: C.emBorder, width: 0.75 }, rectRadius: 0.12 });
  s.addText("TRY IT NOW — NO SIGN-UP REQUIRED", { x: LX+0.28, y: CY+3.88, w: LC-0.56, h: 0.22, fontFace: F.body, fontSize: 9, bold: true, color: C.em, charSpacing: 1.6, margin: 0 });
  s.addText("cetool-mvp.vercel.app", { x: LX+0.28, y: CY+4.14, w: LC-0.56, h: 0.45, fontFace: F.head, fontSize: 22, bold: true, color: C.em, margin: 0 });
  s.addText("Browser-based · saves progress locally · nothing submitted without your consent", { x: LX+0.28, y: CY+4.62, w: LC-0.56, h: 0.28, fontFace: F.body, fontSize: 11, color: C.silver, margin: 0 });

  // Right: deliverables
  panel(s, RX, CY, RW, 6.15);
  panelLabel(s, "What you walk away with", RX, CY, RW-0.56);
  [
    ["📊","Cyber health score & grade",      "A real look into your organisation's current cybersecurity posture"],
    ["📋","Submission-ready Excel & JSON",    "75 clauses, evidence log, signed declaration"],
    ["🎯","Prioritised action plan",          "Gaps ranked by risk band with Monday-morning fixes"],
    ["✉️","Pre-filled Certification Bodies email", "Select a cert body, copy template, attach export — done"],
    ["💰","CISOaaS & funding routes",         "Up to 70% co-funding · sector-specific schemes listed"],
  ].forEach(([icon,title,sub],i) => {
    const dy = CY+0.58+i*1.08;
    s.addShape(pres.ShapeType.roundRect, { x: RX+0.28, y: dy, w: RW-0.56, h: 0.96, fill: { color: C.panelB }, line: { color: C.border, width: 0.75 }, rectRadius: 0.09 });
    s.addText(icon, { x: RX+0.44, y: dy+0.15, w: 0.5, h: 0.6, fontFace: F.body, fontSize: 20, align: "center", valign: "middle", margin: 0 });
    s.addText(title, { x: RX+1.04, y: dy+0.12, w: RW-1.62, h: 0.34, fontFace: F.body, fontSize: 12.5, bold: true, color: C.white, margin: 0 });
    s.addText(sub, { x: RX+1.04, y: dy+0.48, w: RW-1.62, h: 0.36, fontFace: F.body, fontSize: 11, color: C.silver, lineSpacing: 15, margin: 0 });
  });

  accentLine(s);
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 6 — Key Limitations  [NEW]
// ─────────────────────────────────────────────────────────────────────────────
{
  const s = pres.addSlide(); bg(s); topBar(s, 6);
  const LX = M, RX = M + LC + GAP, RW = CW - LC - GAP, CY = TB + 0.12;

  // ── Left ──
  eyebrow(s, "Known constraints", LX, CY, LC);
  s.addText("Honest about\nwhat's not\nyet possible.", {
    x: LX, y: CY+0.28, w: LC, h: 1.75,
    fontFace: F.head, fontSize: 36, bold: true, color: C.white, lineSpacing: 41, margin: 0,
  });
  s.addText("These are deliberate trade-offs — not oversights. Each limitation has a documented workaround and a clear path to resolution as infrastructure matures.", {
    x: LX, y: CY+2.12, w: LC, h: 0.9,
    fontFace: F.body, fontSize: 12.5, color: C.silver, lineSpacing: 19, margin: 0,
  });

  divider(s, LX, CY+3.1, LC);
  s.addText("WORKAROUNDS IN PLACE", { x: LX, y: CY+3.24, w: LC, h: 0.2, fontFace: F.body, fontSize: 9, bold: true, color: C.em, charSpacing: 1.6, margin: 0 });

  // Workaround box (green)
  s.addShape(pres.ShapeType.roundRect, {
    x: LX, y: CY+3.48, w: LC, h: 1.9,
    fill: { color: C.notesBg }, line: { color: C.notesBorder, width: 0.75 }, rectRadius: 0.1,
  });
  [
    "Verify web domain control before showing detailed scan results",
    "Disable AMASS active enumeration, brute-forcing, and DNS alterations",
    "Nmap: users run locally — tool accepts pasted output",
  ].forEach((t,i) => {
    s.addShape(pres.ShapeType.ellipse, { x: LX+0.24, y: CY+3.72+i*0.56, w: 0.1, h: 0.1, fill: { color: C.em } });
    s.addText(t, { x: LX+0.46, y: CY+3.64+i*0.56, w: LC-0.62, h: 0.36, fontFace: F.body, fontSize: 11.5, color: C.notesText, lineSpacing: 16, margin: 0 });
  });

  // ── Right: 3 limitation cards ──
  const cards = [
    {
      tone: "gold",
      bg: C.limitAmberBg, border: C.limitAmberBorder,
      label: "ATTACK SURFACE MANAGEMENT",
      title: "OWASP AMASS — not yet integrated",
      body:  "Binary limitation: cannot run in a serverless / browser environment.\n" +
             "Requires persistent outbound connections to 50+ external APIs.\n" +
             "Feasible once migrated to Replit Core (persistent process support).",
      tag:   "Active recon · Planned for Replit phase",
      tagColor: C.gold,
    },
    {
      tone: "muted",
      bg: C.limitMutedBg, border: C.limitMutedBorder,
      label: "THREAT INTELLIGENCE",
      title: "Shodan — free InternetDB tier only",
      body:  "Uses the free Shodan InternetDB endpoint (no API key required).\n" +
             "Full Shodan API would unlock historical scans, richer CVE detail, and more port attribution.\n" +
             "Upgrade path available with a paid API key.",
      tag:   "Passive intel · Upgrade path available",
      tagColor: C.silver,
    },
    {
      tone: "red",
      bg: C.limitRedBg, border: C.limitRedBorder,
      label: "PORT SCANNING",
      title: "Nmap — licensing constraint",
      body:  "Nmap is not Apache 2.0 — its licence is not freely permissive for commercial deployment.\n" +
             "Recommended approach: users run Nmap on their own machines and paste results into the tool.\n" +
             "This keeps scanning non-intrusive and within the user's own authority.",
      tag:   "User-run · No server-side execution",
      tagColor: C.redText,
    },
  ];

  const cH = (H - TB - CY - 0.18) / 3 - 0.12;
  cards.forEach(({bg: cbg, border, label, title, body: cbody, tag, tagColor}, i) => {
    const cy = CY + i * (cH + 0.14);
    s.addShape(pres.ShapeType.roundRect, { x: RX, y: cy, w: RW, h: cH, fill: { color: cbg }, line: { color: border, width: 0.75 }, rectRadius: 0.1 });
    s.addText(label, { x: RX+0.22, y: cy+0.14, w: RW-0.44, h: 0.18, fontFace: F.body, fontSize: 8.5, bold: true, color: C.muted, charSpacing: 1.4, margin: 0 });
    s.addText(title, { x: RX+0.22, y: cy+0.34, w: RW-0.44, h: 0.3, fontFace: F.body, fontSize: 13, bold: true, color: C.white, margin: 0 });
    s.addText(cbody, { x: RX+0.22, y: cy+0.66, w: RW-0.44, h: cH-1.08, fontFace: F.body, fontSize: 10.5, color: C.silver, lineSpacing: 15, margin: 0 });
    s.addText(tag, { x: RX+0.22, y: cy+cH-0.3, w: RW-0.44, h: 0.24, fontFace: F.body, fontSize: 9.5, bold: true, color: tagColor, margin: 0 });
  });

  accentLine(s);
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 7 — Upcoming Enhancements  [NEW]
// ─────────────────────────────────────────────────────────────────────────────
{
  const s = pres.addSlide(); bg(s); topBar(s, 7);
  const LX = M, RX = M + LC + GAP, RW = CW - LC - GAP, CY = TB + 0.12;

  // ── Left ──
  eyebrow(s, "Product roadmap", LX, CY, LC);
  s.addText("Four\nenhancements\nin the pipeline.", {
    x: LX, y: CY+0.28, w: LC, h: 1.75,
    fontFace: F.head, fontSize: 36, bold: true, color: C.white, lineSpacing: 41, margin: 0,
  });
  s.addText("From infrastructure to identity — the next phase takes the tool from a readiness check to a production-grade service built for Singapore's regulatory landscape.", {
    x: LX, y: CY+2.12, w: LC, h: 0.9,
    fontFace: F.body, fontSize: 12.5, color: C.silver, lineSpacing: 19, margin: 0,
  });

  divider(s, LX, CY+3.1, LC);

  // Status legend
  s.addText("STATUS", { x: LX, y: CY+3.24, w: 1, h: 0.2, fontFace: F.body, fontSize: 9, bold: true, color: C.muted, charSpacing: 1.4, margin: 0 });
  [["Planned",C.gold],["In Design",C.sky],["Exploratory",C.silver]].forEach(([lbl,col],i) => {
    s.addShape(pres.ShapeType.ellipse, { x: LX + i*1.7, y: CY+3.52, w: 0.12, h: 0.12, fill: { color: col } });
    s.addText(lbl, { x: LX+i*1.7+0.18, y: CY+3.44, w: 1.4, h: 0.28, fontFace: F.body, fontSize: 10.5, color: C.silver, valign: "middle", margin: 0 });
  });

  // Summary stats
  const sCards = [["4","Enhancements planned",C.em],["2025–26","Target delivery",C.sky]];
  sCards.forEach(([val,lbl,col],i) => {
    const sx = LX + i*2.6, sy = CY+3.9;
    s.addShape(pres.ShapeType.roundRect, { x: sx, y: sy, w: 2.4, h: 1.28, fill: { color: C.panelB }, line: { color: C.border, width: 0.75 }, rectRadius: 0.1 });
    s.addText(val, { x: sx+0.14, y: sy+0.12, w: 2.12, h: 0.65, fontFace: F.head, fontSize: 32, bold: true, color: col, align: "center", margin: 0 });
    s.addText(lbl, { x: sx+0.14, y: sy+0.76, w: 2.12, h: 0.3, fontFace: F.body, fontSize: 10.5, color: C.silver, align: "center", margin: 0 });
  });

  // ── Right: 4 roadmap cards ──
  const items = [
    {
      num: "1", bg: C.rmGreenBg, border: C.rmGreenBorder, numColor: C.em,
      status: "Planned", statusColor: C.gold,
      title: "Replit Core hosting",
      body: "Paid database tier enables persistent processes and scheduled jobs. Allows integration of security baseline analysers (AMASS, full Shodan) and scalable scan capacity beyond the current serverless limits.",
    },
    {
      num: "2", bg: C.rmSkyBg, border: C.rmSkyBorder, numColor: C.sky,
      status: "In Design", statusColor: C.sky,
      title: "CorpPass integration",
      body: "Authentication via the CorpPass Developer API gates tool access to verified Singapore business entities. Enables UEN-linked session tracking and pre-population of organisation details from ACRA records.",
    },
    {
      num: "3", bg: C.rmGoldBg, border: C.rmGoldBorder, numColor: C.gold,
      status: "Exploratory", statusColor: C.silver,
      title: "Containerisation",
      body: "Docker packaging to enable deployment on GCC (Government Commercial Cloud, IM8-compliant) or other enterprise platforms. Supports air-gapped deployments for agencies with strict data residency requirements.",
    },
    {
      num: "4", bg: C.rmPurpleBg, border: C.rmPurpleBorder, numColor: THEME === "dark" ? "C4B5FD" : "7C3AED",
      status: "Planned", statusColor: C.gold,
      title: "End-to-end workflow",
      body: "Full journey from CSA invite email → guided assessment → pre-filled Certification Body submission email. Closes the loop between CSA outreach, readiness preparation, and formal certification submission in a single auditable flow.",
    },
  ];

  const iH = (H - TB - CY - 0.1) / 4 - 0.1;
  items.forEach(({num,bg:ibg,border:ibdr,numColor,status,statusColor,title,body:ibody},i) => {
    const iy = CY + i*(iH+0.1);
    s.addShape(pres.ShapeType.roundRect, { x: RX, y: iy, w: RW, h: iH, fill: { color: ibg }, line: { color: ibdr, width: 0.75 }, rectRadius: 0.1 });
    // Number badge
    s.addShape(pres.ShapeType.ellipse, { x: RX+0.22, y: iy+(iH-0.38)/2, w: 0.38, h: 0.38, fill: { color: ibdr } });
    s.addText(num, { x: RX+0.22, y: iy+(iH-0.38)/2, w: 0.38, h: 0.38, fontFace: F.body, fontSize: 13, bold: true, color: numColor, align: "center", valign: "middle", margin: 0 });
    // Status chip
    s.addText(status.toUpperCase(), { x: RX+RW-1.45, y: iy+0.15, w: 1.22, h: 0.22, fontFace: F.body, fontSize: 8.5, bold: true, color: statusColor, align: "right", charSpacing: 1.2, margin: 0 });
    // Title + body
    s.addText(title, { x: RX+0.75, y: iy+0.1, w: RW-2.2, h: 0.32, fontFace: F.body, fontSize: 13, bold: true, color: C.white, margin: 0 });
    s.addText(ibody, { x: RX+0.75, y: iy+0.42, w: RW-0.9, h: iH-0.55, fontFace: F.body, fontSize: 10.5, color: C.silver, lineSpacing: 14.5, margin: 0 });
  });

  accentLine(s);
}

// ── Write ─────────────────────────────────────────────────────────────────────
const fname = THEME === "light" ? "cyber-essentials-journey-light.pptx" : "cyber-essentials-journey.pptx";
pres.writeFile({ fileName: fname }).then((f) => {
  console.log(`wrote ${f}  (theme: ${THEME})`);
});
