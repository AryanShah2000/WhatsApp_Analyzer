import { NextRequest, NextResponse } from "next/server";
import { parseWhatsAppChat } from "@/lib/parser";

// Max raw upload: 100 MB
const MAX_CHAT_LENGTH = 100_000_000;

// Max characters to send to OpenAI (~4 chars ≈ 1 token, keep well under 25k tokens)
const MAX_AI_CHARS = 80_000;

// Only analyse the most recent N days
const DAYS_TO_ANALYSE = 30;

/**
 * Filter parsed messages to the last `DAYS_TO_ANALYSE` days,
 * then flatten back into a compact text block for the LLM.
 */
function prepareChat(rawText: string): { text: string; msgCount: number; dateRange: string; senders: string[] } {
  const messages = parseWhatsAppChat(rawText);

  if (messages.length === 0) {
    return { text: "", msgCount: 0, dateRange: "", senders: [] };
  }

  // Find the most recent message date and compute cutoff
  const latest = messages.reduce((max, m) => (m.date > max ? m.date : max), messages[0].date);
  const cutoff = new Date(latest);
  cutoff.setDate(cutoff.getDate() - DAYS_TO_ANALYSE);

  const recent = messages.filter((m) => m.date >= cutoff);

  if (recent.length === 0) {
    return { text: "", msgCount: 0, dateRange: "", senders: [] };
  }

  // Collect unique sender names
  const senders = [...new Set(recent.map((m) => m.sender))].sort();

  // Build a compact representation: "MM/DD HH:MM | Sender: message"
  const lines = recent.map((m) => {
    const d = m.date;
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
    const hour = String(m.hour).padStart(2, "0");
    return `${dateStr} ${hour}:00 | ${m.sender}: ${m.message}`;
  });

  let text = lines.join("\n");

  // Truncate from the beginning (keep most recent) if still too long
  if (text.length > MAX_AI_CHARS) {
    text = text.slice(-MAX_AI_CHARS);
    // Trim to the next full line to avoid a partial message
    const firstNewline = text.indexOf("\n");
    if (firstNewline !== -1) {
      text = text.slice(firstNewline + 1);
    }
  }

  const earliest = recent[0].date;
  const dateRange = `${earliest.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${latest.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  return { text, msgCount: recent.length, dateRange, senders };
}

export async function POST(req: NextRequest) {
  try {
    const { chatText } = await req.json();

    if (!chatText || typeof chatText !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid chat text." },
        { status: 400 }
      );
    }

    if (chatText.length > MAX_CHAT_LENGTH) {
      return NextResponse.json(
        {
          error: `Chat text too large (${(chatText.length / 1_000_000).toFixed(1)}MB). Maximum is ${MAX_CHAT_LENGTH / 1_000_000}MB.`,
        },
        { status: 413 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured." },
        { status: 500 }
      );
    }

    // Parse & filter to last 30 days
    const { text, msgCount, dateRange, senders } = prepareChat(chatText);

    if (msgCount === 0 || !text) {
      return NextResponse.json(
        { error: "No messages found in the last 30 days. Make sure the file is a valid WhatsApp export." },
        { status: 400 }
      );
    }

    console.log(`AI Insights: Sending ${msgCount} messages (${dateRange}), ${text.length} chars, ${senders.length} participants`);

    const senderList = senders.join(", ");

    const systemPrompt = `You are an expert WhatsApp chat analyst. The user will provide the last 30 days of a WhatsApp group chat (${msgCount} messages, ${dateRange}). The participants are: ${senderList}.

Analyse it thoroughly and return a structured JSON response with the following sections:

1. "summary" — A 2-3 sentence overall summary of the chat dynamics.
2. "personalities" — An array of objects { "name": string, "traits": string, "communicationStyle": string, "notableQuotes": string[] } for EVERY participant listed above. You MUST include all ${senders.length} participants, even if they are less active — describe what you can observe.
3. "topics" — An array of EXACTLY 5 objects { "topic": string, "description": string } for the top 5 hottest/most-discussed topics. Be VERY specific — don't say generic categories like "basketball" or "movies". Instead say exactly what was discussed, e.g. "LeBron's trade to the Warriors" or "Oppenheimer movie review debate". The description should elaborate on what was said and who was involved.
4. "dynamics" — An object { "closestPairs": string[], "conflicts": string[], "groupMood": string } describing relationship dynamics.
5. "engagement" — An array of objects { "name": string, "score": "high" | "medium" | "low", "description": string } for EVERY participant. Score reflects how much engagement/replies their messages generate. "high" = their messages spark conversations, people reply and react. "medium" = average engagement. "low" = often gets left on read, messages don't generate much discussion, or they don't contribute much value.

Return ONLY valid JSON, no markdown fences, no extra text.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI API error:", err);
      return NextResponse.json(
        { error: "Failed to get AI response. Please try again." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Empty response from AI." },
        { status: 502 }
      );
    }

    // Strip markdown fences if the model wraps them
    let cleaned = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    // Try to extract just the JSON object if there's extra text
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
    }

    let insights;
    try {
      insights = JSON.parse(cleaned);
    } catch {
      // LLM sometimes has unescaped characters — try to fix common issues
      // Replace unescaped newlines/tabs inside strings
      const fixed = cleaned
        .replace(/[\x00-\x1f]/g, (ch) => {
          if (ch === "\n") return "\\n";
          if (ch === "\r") return "\\r";
          if (ch === "\t") return "\\t";
          return "";
        });

      try {
        insights = JSON.parse(fixed);
      } catch {
        console.error("Failed to parse AI response after cleanup. Raw content length:", content.length);
        console.error("First 500 chars:", cleaned.slice(0, 500));
        return NextResponse.json(
          { error: "AI returned an invalid response. Please try again." },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({ insights, meta: { msgCount, dateRange } });
  } catch (error) {
    console.error("AI insights error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
