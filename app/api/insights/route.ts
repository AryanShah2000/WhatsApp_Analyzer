import { NextRequest, NextResponse } from "next/server";

// Max chat text size: 100 MB
const MAX_CHAT_LENGTH = 100_000_000;

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
          error: `Chat text too large (${(chatText.length / 1_000_000).toFixed(1)}MB). Maximum is ${MAX_CHAT_LENGTH / 1_000_000}MB. Try selecting a shorter date range.`,
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

    const systemPrompt = `You are an expert WhatsApp chat analyst. The user will provide a WhatsApp group chat export. Analyse it thoroughly and return a structured JSON response with the following sections:

1. "summary" — A 2-3 sentence overall summary of the chat dynamics.
2. "personalities" — An array of objects { "name": string, "traits": string, "communicationStyle": string, "notableQuotes": string[] } for each active participant (top 8 max).
3. "topics" — An array of { "topic": string, "description": string, "frequency": "high" | "medium" | "low" } for the main recurring topics.
4. "dynamics" — An object { "closestPairs": string[], "conflicts": string[], "groupMood": string } describing relationship dynamics.
5. "highlights" — An array of strings, each a notable or funny moment from the chat (max 5).

Return ONLY valid JSON, no markdown fences, no extra text.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: chatText },
        ],
        temperature: 0.7,
        max_tokens: 2000,
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

    // Parse the JSON response from the LLM
    const insights = JSON.parse(content);

    return NextResponse.json({ insights });
  } catch (error) {
    console.error("AI insights error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
