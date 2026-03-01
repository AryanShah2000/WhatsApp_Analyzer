import jsPDF from "jspdf";

// ── Interfaces ────────────────────────────────────────────

interface Personality {
  name: string;
  traits: string;
  communicationStyle: string;
  notableQuotes: string[];
}

interface Topic {
  topic: string;
  description: string;
}

interface Dynamics {
  closestPairs: string[];
  conflicts: string[];
  groupMood: string;
}

interface Engagement {
  name: string;
  score: "high" | "medium" | "low";
  description: string;
}

interface Insights {
  summary: string;
  personalities: Personality[];
  topics: Topic[];
  dynamics: Dynamics;
  engagement: Engagement[];
}

// ── Colors ────────────────────────────────────────────────

type RGB = [number, number, number];

const GREEN: RGB = [37, 211, 102];
const GREEN_DARK: RGB = [21, 128, 61];
const DARK: RGB = [17, 24, 39];
const BODY: RGB = [55, 65, 81];
const GRAY: RGB = [107, 114, 128];
const LIGHT_GRAY: RGB = [156, 163, 175];
const CARD_BG: RGB = [248, 250, 252];
const CARD_ALT: RGB = [241, 245, 249];
const WHITE: RGB = [255, 255, 255];
const DIVIDER: RGB = [229, 231, 235];

const BADGE_HIGH_BG: RGB = [220, 252, 231];
const BADGE_HIGH_TEXT: RGB = [22, 101, 52];
const BADGE_MED_BG: RGB = [254, 249, 195];
const BADGE_MED_TEXT: RGB = [133, 100, 4];
const BADGE_LOW_BG: RGB = [254, 226, 226];
const BADGE_LOW_TEXT: RGB = [185, 28, 28];

// ── Layout ────────────────────────────────────────────────

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 22;
const CONTENT_W = PAGE_W - MARGIN * 2;
const LINE_H = 4.8;

// ── Helpers ───────────────────────────────────────────────

/** Strip emoji and other non-Latin characters that Helvetica can't render */
function sanitize(text: string): string {
  return text
    .replace(/[\u{1F600}-\u{1F9FF}]/gu, "")
    .replace(/[\u{2600}-\u{27BF}]/gu, "")
    .replace(/[\u{FE00}-\u{FE0F}]/gu, "")
    .replace(/[\u{200D}]/gu, "")
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "")
    .replace(/[\u{E0020}-\u{E007F}]/gu, "")
    .replace(/[\u{1FA00}-\u{1FA9F}]/gu, "")
    .replace(/[\u{2702}-\u{27B0}]/gu, "")
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, "")
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, "")
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, "")
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, "")
    .replace(/[^\x20-\x7E\xA0-\xFF\u2013\u2014\u2018\u2019\u201C\u201D\u2026]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ── Main export ───────────────────────────────────────────

export function generateInsightsPDF(
  insights: Insights,
  meta: { msgCount: number; dateRange: string } | null
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = 0;

  // ── Utilities ─────────────────────────────────────────

  const addPage = () => {
    doc.addPage();
    y = MARGIN;
  };

  const ensureSpace = (need: number) => {
    if (y + need > PAGE_H - 20) addPage();
  };

  const sectionHeader = (title: string) => {
    ensureSpace(20);
    y += 8;

    // Green accent bar
    doc.setFillColor(...GREEN);
    doc.roundedRect(MARGIN, y - 1, 4, 12, 2, 2, "F");

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...DARK);
    doc.text(title.toUpperCase(), MARGIN + 9, y + 8);

    y += 18;
  };

  const writeLabel = (label: string, indent = 0) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text(label.toUpperCase(), MARGIN + indent, y);
    y += 4.5;
  };

  // ── Page 1: Cover Header ────────────────────────────────

  // Green header band
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, PAGE_W, 58, "F");

  // Darker accent stripe
  doc.setFillColor(...GREEN_DARK);
  doc.rect(0, 55, PAGE_W, 3, "F");

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...WHITE);
  doc.text("WhatsApp AI Insights", MARGIN, 26);

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(230, 255, 240);
  if (meta) {
    doc.text(
      sanitize(`${meta.msgCount.toLocaleString()} messages analysed  |  ${meta.dateRange}`),
      MARGIN,
      38
    );
  } else {
    doc.text("AI-Generated Chat Analysis Report", MARGIN, 38);
  }

  // Date (right-aligned)
  doc.setFontSize(9);
  doc.setTextColor(200, 255, 220);
  doc.text(
    `Report generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
    PAGE_W - MARGIN,
    38,
    { align: "right" }
  );

  y = 70;

  // ── 1. Summary ──────────────────────────────────────────

  sectionHeader("Summary");

  const summaryClean = sanitize(insights.summary);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...BODY);
  const summaryLines: string[] = doc.splitTextToSize(summaryClean, CONTENT_W);
  ensureSpace(summaryLines.length * LINE_H + 2);
  doc.text(summaryLines, MARGIN, y);
  y += summaryLines.length * LINE_H + 4;

  // ── 2. Personality Profiles ─────────────────────────────

  sectionHeader("Personality Profiles");

  insights.personalities.forEach((p, i) => {
    const nameClean = sanitize(p.name);
    const traitsClean = sanitize(p.traits);
    const styleClean = sanitize(p.communicationStyle);
    const cleanQuotes = p.notableQuotes.map((q) => sanitize(q)).filter((q) => q.length > 0);

    // Pre-calculate card height
    doc.setFontSize(10);
    const traitLines: string[] = doc.splitTextToSize(traitsClean, CONTENT_W - 18);
    const styleLines: string[] = doc.splitTextToSize(styleClean, CONTENT_W - 18);
    let quoteH = 0;
    const quoteLinesArr: string[][] = [];
    cleanQuotes.forEach((q) => {
      const ql: string[] = doc.splitTextToSize(`"${q}"`, CONTENT_W - 22);
      quoteLinesArr.push(ql);
      quoteH += ql.length * LINE_H;
    });

    const cardH =
      12 +
      5 + traitLines.length * LINE_H +
      5 + styleLines.length * LINE_H +
      (cleanQuotes.length > 0 ? 5 + quoteH + 2 : 0) +
      6;

    ensureSpace(cardH);

    // Card background
    const bg = i % 2 === 0 ? CARD_BG : CARD_ALT;
    doc.setFillColor(...bg);
    doc.roundedRect(MARGIN, y - 2, CONTENT_W, cardH, 3, 3, "F");

    // Left green accent
    doc.setFillColor(...GREEN);
    doc.roundedRect(MARGIN, y - 2, 2, cardH, 1, 1, "F");

    // Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...GREEN_DARK);
    doc.text(nameClean, MARGIN + 8, y + 6);
    y += 12;

    // Traits
    writeLabel("TRAITS", 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...BODY);
    doc.text(traitLines, MARGIN + 8, y);
    y += traitLines.length * LINE_H + 3;

    // Communication Style
    writeLabel("COMMUNICATION STYLE", 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...BODY);
    doc.text(styleLines, MARGIN + 8, y);
    y += styleLines.length * LINE_H + 3;

    // Notable Quotes
    if (cleanQuotes.length > 0) {
      writeLabel("NOTABLE QUOTES", 8);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9.5);
      doc.setTextColor(...GRAY);
      quoteLinesArr.forEach((ql) => {
        doc.text(ql, MARGIN + 10, y);
        y += ql.length * LINE_H;
      });
      y += 2;
    }

    y += 6;
  });

  // ── 3. Hottest Topics ───────────────────────────────────

  sectionHeader("Hottest Topics");

  insights.topics.forEach((t, i) => {
    const topicClean = sanitize(t.topic);
    const descClean = sanitize(t.description);

    doc.setFontSize(9.5);
    const descLines: string[] = doc.splitTextToSize(descClean, CONTENT_W - 14);
    ensureSpace(10 + descLines.length * LINE_H + 6);

    // Numbered circle
    doc.setFillColor(...GREEN);
    doc.circle(MARGIN + 4, y + 2, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...WHITE);
    doc.text(`${i + 1}`, MARGIN + 4, y + 3.5, { align: "center" });

    // Topic title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.text(topicClean, MARGIN + 12, y + 3.5);
    y += 9;

    // Description
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...BODY);
    doc.text(descLines, MARGIN + 12, y);
    y += descLines.length * LINE_H + 6;
  });

  // ── 4. Group Dynamics ───────────────────────────────────

  sectionHeader("Group Dynamics");

  // Group mood card
  const moodClean = sanitize(insights.dynamics.groupMood);
  doc.setFontSize(10);
  const moodLines: string[] = doc.splitTextToSize(moodClean, CONTENT_W - 16);
  const moodCardH = 8 + moodLines.length * LINE_H + 6;
  ensureSpace(moodCardH + 4);

  doc.setFillColor(...CARD_BG);
  doc.roundedRect(MARGIN, y - 2, CONTENT_W, moodCardH, 3, 3, "F");

  writeLabel("GROUP MOOD", 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BODY);
  doc.text(moodLines, MARGIN + 6, y);
  y += moodLines.length * LINE_H + 8;

  // Closest Pairs
  if (insights.dynamics.closestPairs.length > 0) {
    ensureSpace(8 + insights.dynamics.closestPairs.length * 6);
    writeLabel("CLOSEST PAIRS", 0);
    insights.dynamics.closestPairs.forEach((pair) => {
      const clean = sanitize(pair);
      ensureSpace(6);
      doc.setFillColor(...GREEN);
      doc.circle(MARGIN + 3, y - 1.2, 1.2, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...BODY);
      const pairLines: string[] = doc.splitTextToSize(clean, CONTENT_W - 10);
      doc.text(pairLines, MARGIN + 8, y);
      y += pairLines.length * LINE_H + 1.5;
    });
    y += 3;
  }

  // Conflicts
  if (insights.dynamics.conflicts.length > 0) {
    ensureSpace(8 + insights.dynamics.conflicts.length * 6);
    writeLabel("CONFLICTS / TENSIONS", 0);
    insights.dynamics.conflicts.forEach((c) => {
      const clean = sanitize(c);
      ensureSpace(6);
      doc.setFillColor(...LIGHT_GRAY);
      doc.circle(MARGIN + 3, y - 1.2, 1.2, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...BODY);
      const cLines: string[] = doc.splitTextToSize(clean, CONTENT_W - 10);
      doc.text(cLines, MARGIN + 8, y);
      y += cLines.length * LINE_H + 1.5;
    });
    y += 3;
  }

  // ── 5. Engagement Meter ─────────────────────────────────

  sectionHeader("Engagement Meter");

  const scoreOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...insights.engagement].sort(
    (a, b) => scoreOrder[a.score] - scoreOrder[b.score]
  );

  const badgeConfig: Record<string, { bg: RGB; text: RGB; label: string }> = {
    high: { bg: BADGE_HIGH_BG, text: BADGE_HIGH_TEXT, label: "HIGH" },
    medium: { bg: BADGE_MED_BG, text: BADGE_MED_TEXT, label: "MED" },
    low: { bg: BADGE_LOW_BG, text: BADGE_LOW_TEXT, label: "LOW" },
  };

  sorted.forEach((e) => {
    const nameClean = sanitize(e.name);
    const descClean = sanitize(e.description);
    doc.setFontSize(9.5);
    const descLines: string[] = doc.splitTextToSize(descClean, CONTENT_W - 6);
    ensureSpace(12 + descLines.length * LINE_H + 4);

    const badge = badgeConfig[e.score];

    // Badge pill
    doc.setFillColor(...badge.bg);
    doc.roundedRect(MARGIN, y - 3.5, 16, 7, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...badge.text);
    doc.text(badge.label, MARGIN + 8, y, { align: "center" });

    // Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...DARK);
    doc.text(nameClean, MARGIN + 20, y);
    y += 5.5;

    // Description
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...GRAY);
    doc.text(descLines, MARGIN + 4, y);
    y += descLines.length * LINE_H + 3;

    // Subtle divider
    doc.setDrawColor(...DIVIDER);
    doc.setLineWidth(0.15);
    doc.line(MARGIN + 4, y, PAGE_W - MARGIN - 4, y);
    y += 3;
  });

  // ── Footer on every page ────────────────────────────────

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Footer line
    doc.setDrawColor(...DIVIDER);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, PAGE_H - 14, PAGE_W - MARGIN, PAGE_H - 14);

    // Footer text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...LIGHT_GRAY);
    doc.text("Generated by WhatsApp Analyzer", MARGIN, PAGE_H - 9);
    doc.text(`Page ${p} of ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 9, {
      align: "right",
    });
  }

  // ── Save ────────────────────────────────────────────────

  doc.save("WhatsApp_AI_Insights.pdf");
}
