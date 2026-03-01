import jsPDF from "jspdf";

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

// Brand color
const GREEN: [number, number, number] = [37, 211, 102];
const DARK: [number, number, number] = [17, 24, 39];
const GRAY: [number, number, number] = [107, 114, 128];
const LIGHT_BG: [number, number, number] = [249, 250, 251];
const WHITE: [number, number, number] = [255, 255, 255];

const PAGE_W = 210; // A4 width mm
const MARGIN = 20;
const CONTENT_W = PAGE_W - MARGIN * 2;

export function generateInsightsPDF(
  insights: Insights,
  meta: { msgCount: number; dateRange: string } | null
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = 0;

  // ── Helpers ──────────────────────────────────────────────

  const ensureSpace = (need: number) => {
    if (y + need > 280) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const sectionTitle = (label: string, emoji: string) => {
    ensureSpace(18);
    y += 6;
    // Green accent bar
    doc.setFillColor(...GREEN);
    doc.roundedRect(MARGIN, y, 3, 10, 1.5, 1.5, "F");
    // Title text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...DARK);
    doc.text(`${emoji}  ${label}`, MARGIN + 7, y + 7.5);
    y += 16;
  };

  const bodyText = (text: string, indent = 0) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    const lines = doc.splitTextToSize(text, CONTENT_W - indent);
    ensureSpace(lines.length * 5 + 2);
    doc.text(lines, MARGIN + indent, y);
    y += lines.length * 5 + 2;
  };

  const labelValue = (label: string, value: string, indent = 0) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    const labelW = doc.getTextWidth(`${label}: `);
    ensureSpace(6);
    doc.text(`${label}: `, MARGIN + indent, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    const remaining = CONTENT_W - indent - labelW;
    const valLines = doc.splitTextToSize(value, remaining);
    doc.text(valLines, MARGIN + indent + labelW, y);
    y += valLines.length * 5 + 2;
  };

  // ── Cover / Header ──────────────────────────────────────

  // Green header band
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, PAGE_W, 52, "F");

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(...WHITE);
  doc.text("WhatsApp AI Insights", MARGIN, 28);

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  if (meta) {
    doc.text(
      `${meta.msgCount.toLocaleString()} messages analysed  ·  ${meta.dateRange}`,
      MARGIN,
      40
    );
  } else {
    doc.text("AI-generated chat analysis report", MARGIN, 40);
  }

  // Generated date
  doc.setFontSize(8);
  doc.setTextColor(220, 255, 235);
  doc.text(
    `Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
    PAGE_W - MARGIN,
    40,
    { align: "right" }
  );

  y = 62;

  // ── Summary ─────────────────────────────────────────────

  sectionTitle("Summary", "📋");
  bodyText(insights.summary);
  y += 2;

  // ── Personality Profiles ────────────────────────────────

  sectionTitle("Personality Profiles", "👤");

  insights.personalities.forEach((p, i) => {
    ensureSpace(35);

    // Card background
    const cardLines = doc.splitTextToSize(p.traits, CONTENT_W - 14);
    const styleLines = doc.splitTextToSize(p.communicationStyle, CONTENT_W - 14);
    const quoteLines = p.notableQuotes.length;
    const cardH = 22 + cardLines.length * 4.5 + styleLines.length * 4.5 + quoteLines * 5 + 4;

    ensureSpace(cardH);

    // Light card bg
    doc.setFillColor(...(i % 2 === 0 ? LIGHT_BG : WHITE));
    doc.roundedRect(MARGIN, y - 2, CONTENT_W, cardH, 3, 3, "F");

    // Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...GREEN);
    doc.text(p.name, MARGIN + 5, y + 5);
    y += 10;

    // Traits
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    doc.text("Traits:", MARGIN + 5, y);
    y += 4.5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.setFontSize(9);
    const tLines = doc.splitTextToSize(p.traits, CONTENT_W - 14);
    doc.text(tLines, MARGIN + 5, y);
    y += tLines.length * 4.5 + 2;

    // Communication Style
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text("Style:", MARGIN + 5, y);
    y += 4.5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    const sLines = doc.splitTextToSize(p.communicationStyle, CONTENT_W - 14);
    doc.text(sLines, MARGIN + 5, y);
    y += sLines.length * 4.5 + 2;

    // Quotes
    if (p.notableQuotes.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...DARK);
      doc.text("Quotes:", MARGIN + 5, y);
      y += 4.5;
      doc.setFont("helvetica", "italic");
      doc.setTextColor(...GRAY);
      p.notableQuotes.forEach((q) => {
        ensureSpace(6);
        const qLines = doc.splitTextToSize(`"${q}"`, CONTENT_W - 18);
        doc.text(qLines, MARGIN + 8, y);
        y += qLines.length * 4.5;
      });
    }

    y += 5;
  });

  // ── Hottest Topics ──────────────────────────────────────

  sectionTitle("Hottest Topics", "🔥");

  insights.topics.forEach((t, i) => {
    ensureSpace(16);

    // Number circle
    doc.setFillColor(...GREEN);
    doc.circle(MARGIN + 4, y + 1, 3.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...WHITE);
    doc.text(`${i + 1}`, MARGIN + 4, y + 2.2, { align: "center" });

    // Topic name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.text(t.topic, MARGIN + 11, y + 2);
    y += 6;

    // Description
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    const dLines = doc.splitTextToSize(t.description, CONTENT_W - 11);
    ensureSpace(dLines.length * 4.5);
    doc.text(dLines, MARGIN + 11, y);
    y += dLines.length * 4.5 + 5;
  });

  // ── Group Dynamics ──────────────────────────────────────

  sectionTitle("Group Dynamics", "👥");

  labelValue("Group Mood", insights.dynamics.groupMood);
  y += 2;

  if (insights.dynamics.closestPairs.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    ensureSpace(6);
    doc.text("Closest Pairs:", MARGIN, y);
    y += 5;
    insights.dynamics.closestPairs.forEach((pair) => {
      ensureSpace(5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...GRAY);
      doc.text(`•  ${pair}`, MARGIN + 4, y);
      y += 5;
    });
    y += 2;
  }

  if (insights.dynamics.conflicts.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    ensureSpace(6);
    doc.text("Conflicts:", MARGIN, y);
    y += 5;
    insights.dynamics.conflicts.forEach((c) => {
      ensureSpace(5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...GRAY);
      const cLines = doc.splitTextToSize(`•  ${c}`, CONTENT_W - 4);
      doc.text(cLines, MARGIN + 4, y);
      y += cLines.length * 4.5;
    });
    y += 2;
  }

  // ── Engagement Meter ────────────────────────────────────

  sectionTitle("Engagement Meter", "⚡");

  const engagementEmoji: Record<string, string> = {
    high: "🔥",
    medium: "💬",
    low: "👻",
  };

  const engagementLabel: Record<string, string> = {
    high: "HIGH",
    medium: "MED",
    low: "LOW",
  };

  // Sort: high → medium → low
  const scoreOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...insights.engagement].sort(
    (a, b) => scoreOrder[a.score] - scoreOrder[b.score]
  );

  sorted.forEach((e) => {
    ensureSpace(12);

    // Score badge background
    const badgeColor: Record<string, [number, number, number]> = {
      high: [220, 252, 231],
      medium: [254, 249, 195],
      low: [254, 226, 226],
    };
    const badgeText: Record<string, [number, number, number]> = {
      high: [22, 101, 52],
      medium: [133, 100, 4],
      low: [185, 28, 28],
    };

    doc.setFillColor(...badgeColor[e.score]);
    doc.roundedRect(MARGIN, y - 3, 18, 7, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...badgeText[e.score]);
    doc.text(
      `${engagementEmoji[e.score]} ${engagementLabel[e.score]}`,
      MARGIN + 9,
      y + 1,
      { align: "center" }
    );

    // Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text(e.name, MARGIN + 22, y + 1);

    // Description
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    const eLines = doc.splitTextToSize(e.description, CONTENT_W - 4);
    ensureSpace(eLines.length * 4.5);
    doc.text(eLines, MARGIN + 4, y);
    y += eLines.length * 4.5 + 4;
  });

  // ── Footer on every page ────────────────────────────────

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text(
      "Generated by WhatsApp Analyzer · whatsapp-analyzer.vercel.app",
      PAGE_W / 2,
      292,
      { align: "center" }
    );
    doc.text(`${p} / ${totalPages}`, PAGE_W - MARGIN, 292, { align: "right" });
  }

  // ── Save ────────────────────────────────────────────────

  doc.save("WhatsApp_AI_Insights.pdf");
}
