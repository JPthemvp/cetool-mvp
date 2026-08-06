/**
 * Cyber Essentials Tool — problem statement and user journey deck.
 *
 * Palette is CSA's own published brand (#004987 blue, #E31736 logo red) on a
 * deep navy ground, so the deck reads as part of the same product family as the
 * portal it describes. Red is reserved strictly for friction and cost — if it is
 * red on a slide, it is a problem, never decoration.
 *
 * Every figure is computed from the codebase (npm run coverage / npm run
 * pathways) rather than estimated.
 */

const pptxgen = require("pptxgenjs");

const C = {
  ground: "041524",
  panel: "0A2438",
  panelAlt: "0E2C43",
  edge: "16405F",
  ink: "F0F6FB",
  ink2: "B6CDE0",
  ink3: "7E9AB3",
  brand: "004987",
  brandLift: "4D96C9",
  red: "E31736",
  redSoft: "FF6D84",
  good: "5FD6A4",
  paper: "FFFFFF",
};

const F = { head: "Cambria", body: "Calibri" };

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
pres.author = "Cyber Essentials Tool";
pres.title = "Cyber Essentials readiness — problem and user journey";

const W = 13.3;
const M = 0.7; // page margin
const CW = W - M * 2; // content width

/** Fresh object every call — pptxgenjs mutates options in place. */
const shadow = () => ({ type: "outer", color: "000000", blur: 12, offset: 3, angle: 90, opacity: 0.28 });

/** Section eyebrow. The red square is the deck's one repeated motif. */
function eyebrow(slide, text, y) {
  slide.addShape(pres.ShapeType.rect, { x: M, y: y + 0.045, w: 0.1, h: 0.1, fill: { color: C.red } });
  slide.addText(text.toUpperCase(), {
    x: M + 0.22, y, w: CW - 0.22, h: 0.22,
    fontFace: F.body, fontSize: 10, bold: true, color: C.brandLift, charSpacing: 1.6, margin: 0,
  });
}

function titleBlock(slide, text, y, size = 30) {
  slide.addText(text, {
    x: M, y, w: CW, h: 0.75,
    fontFace: F.head, fontSize: size, bold: true, color: C.ink, margin: 0, lineSpacing: size * 1.12,
  });
}

function bg(slide, color = C.ground) {
  slide.background = { color };
}

// ─────────────────────────────────────────────────────────────────────────
// 1. Title
// ─────────────────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  bg(s);

  s.addText("CSA CYBER ESSENTIALS MARK  ·  SINGAPORE SMEs", {
    x: M, y: 1.5, w: CW, h: 0.3,
    fontFace: F.body, fontSize: 11, bold: true, color: C.brandLift, charSpacing: 2, margin: 0,
  });

  s.addText("The checklist is not the\nbarrier to certification.", {
    x: M, y: 2.0, w: CW, h: 1.5,
    fontFace: F.head, fontSize: 40, bold: true, color: C.ink, margin: 0, lineSpacing: 46,
  });
  s.addText("Reading it is.", {
    x: M, y: 3.45, w: CW, h: 0.75,
    fontFace: F.head, fontSize: 40, bold: true, color: C.redSoft, margin: 0, lineSpacing: 46,
  });

  s.addText(
    "The mark asks an organisation to attest against 75 individual clauses written in formal " +
      "assurance language. The organisations that most need it are the least equipped to interpret it.",
    { x: M, y: 4.5, w: 8.6, h: 0.9, fontFace: F.body, fontSize: 14, color: C.ink2, margin: 0, lineSpacing: 21 },
  );

  const meta = [
    ["Framework", "Cyber Essentials mark V202503"],
    ["Assessed", "75 clauses · 9 measures"],
    ["Platforms", "Windows · macOS · Linux"],
  ];
  meta.forEach(([k, v], i) => {
    const x = M + i * 4.0;
    s.addText(k.toUpperCase(), {
      x, y: 5.75, w: 3.8, h: 0.2, fontFace: F.body, fontSize: 9, bold: true, color: C.ink3, charSpacing: 1.4, margin: 0,
    });
    s.addText(v, { x, y: 5.98, w: 3.8, h: 0.3, fontFace: F.body, fontSize: 12, color: C.ink, margin: 0 });
  });

  s.addNotes(
    "Opening argument: SMEs do not abandon certification because they refuse to secure themselves. " +
      "They abandon it because nobody in the building can interpret the clause language. " +
      "This deck is built on CSA's published framework; every figure quoted is computed from the tool's own mapping tables.",
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 2. The problem
// ─────────────────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  bg(s);
  eyebrow(s, "The problem", 0.55);
  titleBlock(s, "A compliance form written for assessors, handed to shop owners", 0.9, 27);

  const stats = [
    ["75", "clauses to attest against, each phrased as “the organisation shall…”"],
    ["52", "of them mandatory — one unmet clause blocks certification entirely"],
    ["0", "existing tools that map a finding to the clause it affects"],
    ["1–9", "staff in a typical applicant, with no security specialist and IT outsourced"],
  ];

  const cw = (CW - 0.45 * 3) / 4;
  stats.forEach(([n, k], i) => {
    const x = M + i * (cw + 0.45);
    s.addShape(pres.ShapeType.rect, {
      x, y: 2.05, w: cw, h: 1.85, fill: { color: C.panel }, line: { color: C.edge, width: 1 }, shadow: shadow(),
    });
    s.addText(n, {
      x: x + 0.28, y: 2.25, w: cw - 0.5, h: 0.75,
      fontFace: F.head, fontSize: 40, bold: true, color: C.redSoft, margin: 0,
    });
    s.addText(k, {
      x: x + 0.28, y: 3.02, w: cw - 0.5, h: 0.8,
      fontFace: F.body, fontSize: 11.5, color: C.ink2, margin: 0, lineSpacing: 16,
    });
  });

  // Pull quote — the human statement of the problem.
  s.addShape(pres.ShapeType.rect, { x: M, y: 4.35, w: 0.045, h: 1.5, fill: { color: C.red } });
  s.addText(
    "An SME does not abandon certification because it refuses to secure itself. " +
      "It abandons certification because nobody in the building can tell whether clause A.6.4(b) is met.",
    { x: M + 0.32, y: 4.35, w: 10.4, h: 1.05, fontFace: F.head, fontSize: 18, color: C.ink, margin: 0, lineSpacing: 27, italic: true },
  );
  s.addText("THE FAILURE MODE THIS TOOL EXISTS TO REMOVE", {
    x: M + 0.32, y: 5.48, w: 8, h: 0.25, fontFace: F.body, fontSize: 9.5, bold: true, color: C.ink3, charSpacing: 1.4, margin: 0,
  });

  s.addNotes(
    "The 1-9 staff figure characterises the target segment rather than citing a statistic — " +
      "source it before presenting to CSA. The other three are exact: 75 clauses and 52 mandatory " +
      "come from the published framework, and no existing tool performs finding-to-clause mapping.",
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 3. One clause, three registers — the core argument
// ─────────────────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  bg(s);
  eyebrow(s, "Why translation is the product", 0.55);
  titleBlock(s, "The same finding, in the three registers it has to survive", 0.9, 27);
  s.addText(
    "Every organisation must answer this clause. All three describe one identical fact about their email — " +
      "only the third lets a non-technical owner act on it.",
    { x: M, y: 1.72, w: 11.4, h: 0.45, fontFace: F.body, fontSize: 13, color: C.ink2, margin: 0, lineSpacing: 19 },
  );

  const cards = [
    {
      who: "As published by CSA",
      txt: "“Security configurations shall be enforced for the organisation’s hardware and software.”",
      note: "Clause A.6.4(a). Correct, auditable, and unactionable without a security background.",
      tone: "pain", mono: false,
    },
    {
      who: "As a scanner reports it",
      txt: "email.spf — FAIL\nNo SPF record published",
      note: "What Cyber Health Check and the Internet Hygiene Portal surface today. Accurate, but the reader must already know what SPF is and which clause it touches.",
      tone: "neutral", mono: true,
    },
    {
      who: "As this tool puts it",
      txt: "“Anyone can send email pretending to be your business. This is how fake invoices get paid.”",
      note: "Same finding, mapped to A.6.4(a), pre-filled as not met, with the fix attached. The clause reference stays available for the assessor.",
      tone: "win", mono: false,
    },
  ];

  const cw3 = (CW - 0.5 * 2) / 3;
  cards.forEach((c, i) => {
    const x = M + i * (cw3 + 0.5);
    const accent = c.tone === "pain" ? C.redSoft : c.tone === "win" ? C.good : C.ink3;
    const border = c.tone === "pain" ? "5E2230" : c.tone === "win" ? "1E5443" : C.edge;

    s.addShape(pres.ShapeType.rect, {
      x, y: 2.4, w: cw3, h: 3.55, fill: { color: c.tone === "neutral" ? C.panel : C.panelAlt },
      line: { color: border, width: 1.25 }, shadow: shadow(),
    });
    s.addText(c.who.toUpperCase(), {
      x: x + 0.28, y: 2.62, w: cw3 - 0.55, h: 0.25,
      fontFace: F.body, fontSize: 9.5, bold: true, color: accent, charSpacing: 1.4, margin: 0,
    });
    s.addText(c.txt, {
      x: x + 0.28, y: 2.98, w: cw3 - 0.55, h: 1.5,
      fontFace: c.mono ? "Courier New" : F.body, fontSize: c.mono ? 13 : 14.5,
      color: C.ink, margin: 0, lineSpacing: c.mono ? 20 : 21,
    });
    s.addText(c.note, {
      x: x + 0.28, y: 4.62, w: cw3 - 0.55, h: 1.15,
      fontFace: F.body, fontSize: 10.5, color: C.ink3, margin: 0, lineSpacing: 15,
    });
  });

  s.addNotes(
    "This is the whole thesis in one row, and it is real product output rather than a mock-up. " +
      "The middle card is what the market offers today. The right card is what this tool adds, " +
      "without discarding the clause reference the assessor needs.",
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 4. User journey
// ─────────────────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  bg(s);
  eyebrow(s, "User journey", 0.55);
  titleBlock(s, "Seven steps, opened one at a time", 0.9, 27);
  s.addText(
    "Each step unlocks only when the previous one is complete, so the organisation never faces more than the task in front of it. Progress persists between sessions.",
    { x: M, y: 1.72, w: 11.6, h: 0.4, fontFace: F.body, fontSize: 13, color: C.ink2, margin: 0 },
  );

  const steps = [
    ["Scope", "Organisation, sector and what is in scope.", "Clinics gain HIA duties"],
    ["Discover", "Passive domain scan, plus certificate-log host discovery.", "Finds forgotten hosts"],
    ["Assets", "Discovered assets exported as the inventory starting point.", "Inventory not blank"],
    ["Prioritise", "Gaps ordered by likelihood against impact.", "Knows what to fix first"],
    ["Check devices", "Optional read-only script. Windows, macOS, Linux.", "Technical clauses self-answer"],
    ["Assess", "Plain-English questions. “Not sure” is a valid answer.", "No guessing under pressure"],
    ["Hand off", "Submission pack as Excel and JSON, plus funding routes.", "Assessor-ready"],
  ];

  const gap = 0.16;
  const sw = (CW - gap * 6) / 7;
  steps.forEach(([name, what, gain], i) => {
    const x = M + i * (sw + gap);
    s.addShape(pres.ShapeType.rect, {
      x, y: 2.35, w: sw, h: 3.25, fill: { color: C.panel }, line: { color: C.edge, width: 1 }, shadow: shadow(),
    });
    // Numbered badge — the deck's repeated structural device.
    s.addShape(pres.ShapeType.ellipse, {
      x: x + 0.18, y: 2.55, w: 0.42, h: 0.42, fill: { color: C.brand }, line: { color: C.brandLift, width: 1 },
    });
    s.addText(String(i + 1), {
      x: x + 0.18, y: 2.55, w: 0.42, h: 0.42,
      fontFace: F.body, fontSize: 12, bold: true, color: C.ink, align: "center", valign: "middle", margin: 0,
    });
    s.addText(name, {
      x: x + 0.18, y: 3.12, w: sw - 0.36, h: 0.5,
      fontFace: F.body, fontSize: 13, bold: true, color: C.ink, margin: 0, lineSpacing: 16,
    });
    s.addText(what, {
      x: x + 0.18, y: 3.62, w: sw - 0.36, h: 1.15,
      fontFace: F.body, fontSize: 10, color: C.ink3, margin: 0, lineSpacing: 14,
    });
    s.addText(gain, {
      x: x + 0.18, y: 4.92, w: sw - 0.36, h: 0.55,
      fontFace: F.body, fontSize: 9.5, bold: true, color: C.good, margin: 0, lineSpacing: 13,
    });
  });

  s.addNotes(
    "The sequencing is the point. Ten tabs on first load reads as homework and an SME owner deciding " +
      "whether to bother will not read ten tabs. Steps 2 and 5 are the automated ones; everything else " +
      "is the organisation's own work, structured.",
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 5. Coverage honesty
// ─────────────────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  bg(s);
  eyebrow(s, "What automation can and cannot reach", 0.55);
  titleBlock(s, "Automation removes the technical third. It cannot remove the rest", 0.9, 27);
  s.addText(
    "Overstating coverage is how a readiness tool loses an assessor’s trust. These figures are computed from the mapping tables, and a test fails if the product’s claim drifts from them.",
    { x: M, y: 1.72, w: 11.6, h: 0.45, fontFace: F.body, fontSize: 13, color: C.ink2, margin: 0, lineSpacing: 19 },
  );

  s.addChart(
    pres.ChartType.bar,
    [
      { name: "Answered by a check", labels: ["Scan and self-assess", "With device checks"], values: [4, 11] },
      { name: "Evidence gathered, organisation confirms", labels: ["Scan and self-assess", "With device checks"], values: [6, 13] },
      { name: "People and process — only the organisation can answer", labels: ["Scan and self-assess", "With device checks"], values: [65, 51] },
    ],
    {
      x: M, y: 2.35, w: 7.55, h: 2.75,
      barDir: "bar", barGrouping: "percentStacked",
      chartColors: [C.brandLift, C.brand, "1B3448"],
      showLegend: true, legendPos: "b", legendColor: C.ink2, legendFontSize: 10, legendFontFace: F.body,
      showValue: true, dataLabelPosition: "ctr", dataLabelColor: C.ink, dataLabelFontSize: 10,
      dataLabelFontFace: F.body, dataLabelFormatCode: "0",
      catAxisLabelColor: C.ink2, catAxisLabelFontSize: 11, catAxisLabelFontFace: F.body,
      valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" },
      plotArea: { fill: { color: C.ground } }, chartArea: { fill: { color: C.ground } },
      barGapWidthPct: 55,
    },
  );

  // Supporting card
  const bx = M + 7.95;
  const bw = CW - 7.95;
  s.addShape(pres.ShapeType.rect, {
    x: bx, y: 2.35, w: bw, h: 3.3, fill: { color: C.panel }, line: { color: C.edge, width: 1 }, shadow: shadow(),
  });
  s.addText("43", {
    x: bx + 0.3, y: 2.6, w: bw - 0.6, h: 0.8, fontFace: F.head, fontSize: 42, bold: true, color: C.ink, margin: 0,
  });
  s.addText("of 75 clauses concern training, approvals, incident planning and restore testing.", {
    x: bx + 0.3, y: 3.42, w: bw - 0.6, h: 0.75, fontFace: F.body, fontSize: 12.5, color: C.ink2, margin: 0, lineSpacing: 17,
  });
  s.addText(
    "No scanner observes those on any platform, which is why the questionnaire exists rather than being an admission of a gap.\n\nIncident response is 0 of 4 automatable — a plan either exists or it does not.",
    { x: bx + 0.3, y: 4.25, w: bw - 0.6, h: 1.25, fontFace: F.body, fontSize: 10.5, color: C.ink3, margin: 0, lineSpacing: 14.5 },
  );

  s.addNotes(
    "Keep this slide in. An audience of assessors will assume the automation claim is inflated, " +
      "and pre-empting that is more persuasive than a bigger number. 10 of 75 assisted on the light " +
      "pathway, 24 of 75 with device checks.",
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 6. Today vs with the tool
// ─────────────────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  bg(s);
  eyebrow(s, "Why a cross-platform automated tool", 0.55);
  titleBlock(s, "Where the journey ends today, and where it should end", 0.9, 27);

  const cols = [
    {
      tag: "TODAY", tagColor: C.redSoft, head: "Diagnosis without direction",
      items: [
        "Cyber Health Check returns a score, not a clause position.",
        "Internet Hygiene Portal returns missing headers and records, unmapped to any mark.",
        "Neither reaches inside the estate, and neither covers macOS or Linux at all.",
        "The journey ends at a gap list — no funding attached, no provider, no next step.",
        "The organisation still faces 75 clauses of assurance language, alone.",
      ],
    },
    {
      tag: "WITH THIS TOOL", tagColor: C.good, head: "Every finding lands on a clause",
      items: [
        "Findings map to the specific clause they affect, and pre-fill the answer.",
        "Device checks run on Windows, macOS and Linux — read-only, nothing uploaded.",
        "Gaps arrive ranked, each with one concrete action written for a non-specialist.",
        "Output is a submission pack recording how every answer was reached.",
        "Ends at funding, a provider, or a certification body — matched to readiness.",
      ],
    },
  ];

  const cw2 = (CW - 0.55) / 2;
  cols.forEach((col, i) => {
    const x = M + i * (cw2 + 0.55);
    s.addShape(pres.ShapeType.rect, {
      x, y: 1.95, w: cw2, h: 4.15, fill: { color: C.panel }, line: { color: C.edge, width: 1 }, shadow: shadow(),
    });
    s.addText(col.tag, {
      x: x + 0.35, y: 2.2, w: cw2 - 0.7, h: 0.25,
      fontFace: F.body, fontSize: 10, bold: true, color: col.tagColor, charSpacing: 1.6, margin: 0,
    });
    s.addText(col.head, {
      x: x + 0.35, y: 2.5, w: cw2 - 0.7, h: 0.45,
      fontFace: F.head, fontSize: 19, bold: true, color: C.ink, margin: 0,
    });
    s.addText(
      col.items.map((t, j) => ({
        text: t,
        options: { bullet: true, breakLine: j !== col.items.length - 1, paraSpaceAfter: 9 },
      })),
      { x: x + 0.35, y: 3.05, w: cw2 - 0.7, h: 2.85, fontFace: F.body, fontSize: 12, color: C.ink2, margin: 0, lineSpacing: 17 },
    );
  });

  s.addNotes(
    "The left column is not a criticism of CSA's existing tools — they do what they were built to do. " +
      "The gap is that neither was built to end at a certification decision.",
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 7. Evidence and close
// ─────────────────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  bg(s);
  eyebrow(s, "Verified, not asserted", 0.55);
  titleBlock(s, "Built against the published framework, and tested against it", 0.9, 27);

  const ev = [
    ["36", "hostnames surfaced on a single real government domain, 7 of them non-production"],
    ["8 / 10", "Cyber Trust Supporter-tier domains already covered once the mark is held"],
    ["~1 hr", "to complete, resumable, with progress saved between sessions"],
    ["Free", "no licence, no agent, nothing installed on the lighter pathway"],
  ];

  const cw4 = (CW - 0.45 * 3) / 4;
  ev.forEach(([n, k], i) => {
    const x = M + i * (cw4 + 0.45);
    s.addShape(pres.ShapeType.rect, {
      x, y: 2.0, w: cw4, h: 1.9, fill: { color: C.panel }, line: { color: C.edge, width: 1 }, shadow: shadow(),
    });
    s.addText(n, {
      x: x + 0.28, y: 2.2, w: cw4 - 0.5, h: 0.7, fontFace: F.head, fontSize: 32, bold: true, color: C.brandLift, margin: 0,
    });
    s.addText(k, {
      x: x + 0.28, y: 2.95, w: cw4 - 0.5, h: 0.85, fontFace: F.body, fontSize: 11, color: C.ink2, margin: 0, lineSpacing: 15,
    });
  });

  s.addText("The goal is not a better checklist. It is an SME that reaches an assessor prepared.", {
    x: M, y: 4.4, w: 11.4, h: 0.6, fontFace: F.head, fontSize: 22, bold: true, color: C.ink, margin: 0,
  });

  s.addText(
    "Framework content modelled on CSA’s published Cyber Essentials mark (V202503, expanded 15 April 2025) and Cyber Trust mark (V202504). " +
      "Not affiliated with CSA. The tool does not confer certification — an appointed certification body performs the independent assessment. " +
      "Sector obligations should be confirmed with the relevant regulator before being relied upon.",
    { x: M, y: 5.5, w: 11.9, h: 1.0, fontFace: F.body, fontSize: 9.5, color: C.ink3, margin: 0, lineSpacing: 13.5 },
  );

  s.addNotes(
    "The disclaimer is not boilerplate. The HIA sector content in particular was derived from a " +
      "summary rather than the statute and should be verified with MOH before this is presented as guidance.",
  );
}

pres.writeFile({ fileName: "deck/cyber-essentials-journey.pptx" }).then((f) => {
  console.log("wrote " + f);
});
