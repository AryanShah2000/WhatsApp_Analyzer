"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Footer from "@/components/Footer";
import { parseWhatsAppChat } from "@/lib/parser";
import {
  Sparkles,
  Upload,
  Loader2,
  User,
  MessageCircle,
  Users,
  Lightbulb,
  Brain,
  FileText,
  CheckCircle2,
  CalendarDays,
  Activity,
  CreditCard,
  Lock,
} from "lucide-react";

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

const MAX_FILE_SIZE = 100_000_000; // 100MB

const engagementColor: Record<string, string> = {
  high: "bg-green-50 text-green-700 ring-1 ring-green-200",
  medium: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200",
  low: "bg-red-50 text-red-600 ring-1 ring-red-200",
};

const engagementEmoji: Record<string, string> = {
  high: "🔥",
  medium: "💬",
  low: "👻",
};

function AIInsightsPageInner() {
  const searchParams = useSearchParams();
  const [chatText, setChatText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [meta, setMeta] = useState<{ msgCount: number; dateRange: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);

  /** Prepare chat client-side (parse, filter 30 days, compress) */
  const prepareChat = useCallback((rawText: string) => {
    const MAX_AI_CHARS = 80_000;
    const DAYS_TO_ANALYSE = 30;

    const messages = parseWhatsAppChat(rawText);
    if (messages.length === 0) return null;

    const latest = messages.reduce((max, m) => (m.date > max ? m.date : max), messages[0].date);
    const cutoff = new Date(latest);
    cutoff.setDate(cutoff.getDate() - DAYS_TO_ANALYSE);
    const recent = messages.filter((m) => m.date >= cutoff);
    if (recent.length === 0) return null;

    const senders = [...new Set(recent.map((m) => m.sender))].sort();
    const lines = recent.map((m) => {
      const d = m.date;
      return `${d.getMonth() + 1}/${d.getDate()} ${String(m.hour).padStart(2, "0")}:00 | ${m.sender}: ${m.message}`;
    });

    let text = lines.join("\n");
    if (text.length > MAX_AI_CHARS) {
      text = text.slice(-MAX_AI_CHARS);
      const nl = text.indexOf("\n");
      if (nl !== -1) text = text.slice(nl + 1);
    }

    const earliest = recent[0].date;
    const dateRange = `${earliest.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${latest.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

    return { text, msgCount: recent.length, dateRange, senders };
  }, []);

  /** Call AI insights API with prepared data */
  const fetchInsights = useCallback(async (prepared: { text: string; msgCount: number; dateRange: string; senders: string[] }) => {
    setLoading(true);
    setError(null);
    setInsights(null);

    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prepared),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setInsights(data.insights);
      setMeta(data.meta || null);
      // Clean up stored data
      sessionStorage.removeItem("wa_prepared");
    } catch {
      setError("Failed to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  /** After Stripe redirects back, verify payment and auto-generate */
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const cancelled = searchParams.get("cancelled");

    if (cancelled) {
      setError("Payment was cancelled. You can try again.");
      // Clean the URL
      window.history.replaceState({}, "", "/insights");
      return;
    }

    if (!sessionId) return;

    const verifyAndGenerate = async () => {
      setCheckingPayment(true);
      try {
        const res = await fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();

        if (!data.paid) {
          setError("Payment not completed. Please try again.");
          return;
        }

        // Payment verified — retrieve stored chat data
        const stored = sessionStorage.getItem("wa_prepared");
        if (!stored) {
          setError("Chat data expired. Please upload the file again and try once more.");
          return;
        }

        const prepared = JSON.parse(stored);
        // Clean the URL
        window.history.replaceState({}, "", "/insights");
        setFileName(sessionStorage.getItem("wa_fileName") || "chat.txt");
        await fetchInsights(prepared);
      } catch {
        setError("Failed to verify payment. Please try again.");
      } finally {
        setCheckingPayment(false);
      }
    };

    verifyAndGenerate();
  }, [searchParams, fetchInsights]);

  const handleFile = (file: File) => {
    setFileName(file.name);
    setInsights(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text.length > MAX_FILE_SIZE) {
        setError(
          `File too large (${(text.length / 1_000_000).toFixed(1)}MB). Maximum is ${MAX_FILE_SIZE / 1_000_000}MB. Try exporting a shorter date range from WhatsApp.`
        );
        setChatText(null);
        return;
      }
      setChatText(text);
    };
    reader.readAsText(file);
  };

  /** Click "Generate" → prepare chat → save to sessionStorage → redirect to Stripe */
  const handleAnalyze = async () => {
    if (!chatText) return;
    setError(null);

    const prepared = prepareChat(chatText);
    if (!prepared) {
      setError("No messages found in the last 30 days. Make sure the file is a valid WhatsApp export.");
      return;
    }

    // Store prepared data so we can retrieve it after Stripe redirect
    sessionStorage.setItem("wa_prepared", JSON.stringify(prepared));
    sessionStorage.setItem("wa_fileName", fileName || "chat.txt");

    // Create Stripe Checkout session
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: window.location.origin }),
      });
      const data = await res.json();

      if (!res.ok || !data.url) {
        setError(data.error || "Failed to start checkout.");
        setLoading(false);
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch {
      setError("Failed to connect to the payment server. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1">
        {/* Header */}
        <section className="pt-16 pb-10 px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-sm font-medium rounded-full bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 ring-1 ring-yellow-200/50">
              <Sparkles className="w-4 h-4" />
              Premium Feature
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight">
              AI-Powered Insights
            </h1>
            <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
              Upload your chat and let AI uncover personality profiles, hottest
              topics, relationship dynamics, and engagement insights.
            </p>
          </div>
        </section>

        {/* Upload */}
        <section className="px-6 pb-10">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
            onClick={() => document.getElementById("ai-file-input")?.click()}
            className={`w-full max-w-xl mx-auto border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer ${
              fileName
                ? "border-[#25D366] bg-green-50/50"
                : dragging
                  ? "border-[#25D366] bg-green-50 scale-[1.01]"
                  : "border-gray-300 hover:border-[#25D366]/50 hover:bg-green-50/30 bg-white"
            }`}
          >
            <input
              id="ai-file-input"
              type="file"
              accept=".txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            {fileName ? (
              <div className="animate-[fadeInScale_0.3s_ease-out]">
                <div className="w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7 text-[#25D366]" />
                </div>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <p className="text-lg font-semibold text-gray-900">{fileName}</p>
                </div>
                <p className="text-sm text-[#25D366] font-medium">
                  File loaded · Click to change
                </p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6 text-[#25D366]" />
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-1">
                  Drop your WhatsApp .txt file here
                </p>
                <p className="text-gray-500 text-sm">
                  or{" "}
                  <span className="text-[#25D366] font-medium underline underline-offset-2">
                    click to browse
                  </span>{" "}
                  · Max {MAX_FILE_SIZE / 1_000_000}MB
                </p>
              </>
            )}
          </div>

          {/* Analyze button */}
          {chatText && !loading && !checkingPayment && !insights && (
            <div className="text-center mt-6 animate-[fadeIn_0.3s_ease-out]">
              <button
                onClick={handleAnalyze}
                className="group px-10 py-4 rounded-full text-white text-lg font-semibold shadow-lg shadow-green-200/50 transition-all duration-300 hover:shadow-xl hover:shadow-green-300/50 hover:scale-[1.03] active:scale-100 inline-flex items-center gap-2"
                style={{ backgroundColor: "#25D366" }}
              >
                <Sparkles className="w-5 h-5" />
                Generate AI Insights · $0.99
              </button>
              <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-gray-400">
                <Lock className="w-3 h-3" />
                <span>Secure payment via Stripe · Promo codes accepted</span>
              </div>
            </div>
          )}

          {/* Checking payment state */}
          {checkingPayment && (
            <div className="text-center mt-10 animate-[fadeIn_0.3s_ease-out]">
              <div className="inline-flex flex-col items-center bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-sm">
                <div className="relative mb-5">
                  <CreditCard className="w-12 h-12 text-[#25D366] animate-[pulse-soft_2s_ease-in-out_infinite]" />
                  <Loader2 className="w-6 h-6 text-[#25D366] animate-spin absolute -bottom-1 -right-1" />
                </div>
                <p className="text-gray-900 font-semibold text-lg mb-1">
                  Verifying payment…
                </p>
                <p className="text-gray-400 text-sm">
                  Hang tight, your report is on the way
                </p>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center mt-10 animate-[fadeIn_0.3s_ease-out]">
              <div className="inline-flex flex-col items-center bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-sm">
                <div className="relative mb-5">
                  <Brain className="w-12 h-12 text-[#25D366] animate-[pulse-soft_2s_ease-in-out_infinite]" />
                  <Loader2 className="w-6 h-6 text-[#25D366] animate-spin absolute -bottom-1 -right-1" />
                </div>
                <p className="text-gray-900 font-semibold text-lg mb-1">
                  Analyzing your chat…
                </p>
                <p className="text-gray-400 text-sm">
                  This usually takes 15–30 seconds
                </p>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-4 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#25D366] animate-[pulse-soft_1.5s_ease-in-out_infinite]"
                    style={{ width: "70%" }}
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="max-w-xl mx-auto mt-4">
              <p className="text-red-500 text-center font-medium bg-red-50 rounded-lg px-4 py-3">
                {error}
              </p>
            </div>
          )}
        </section>

        {/* Results */}
        {insights && (
          <section className="px-6 pb-20 animate-[fadeIn_0.5s_ease-out]">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Date range banner */}
              {meta && (
                <div className="bg-green-50/70 border border-green-100 rounded-xl px-5 py-3 flex items-center justify-center gap-3 text-sm">
                  <CalendarDays className="w-4 h-4 text-[#25D366]" />
                  <span className="text-gray-600">
                    Analysed <span className="font-semibold text-gray-900">{meta.msgCount.toLocaleString()}</span> messages from <span className="font-semibold text-gray-900">{meta.dateRange}</span>
                  </span>
                </div>
              )}

              {/* Summary */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-50 text-[#25D366] flex items-center justify-center">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  Chat Summary
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {insights.summary}
                </p>
              </div>

              {/* Personalities */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-50 text-[#25D366] flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  Personality Profiles
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {insights.personalities.map((p) => (
                    <div
                      key={p.name}
                      className="border border-gray-100 rounded-xl p-5 hover:border-[#25D366]/20 hover:shadow-sm transition-all duration-300"
                    >
                      <h3 className="font-bold text-gray-900 mb-2 text-base">
                        {p.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-1">
                        <span className="font-semibold text-gray-700">Traits:</span>{" "}
                        {p.traits}
                      </p>
                      <p className="text-sm text-gray-500 mb-3">
                        <span className="font-semibold text-gray-700">Style:</span>{" "}
                        {p.communicationStyle}
                      </p>
                      {p.notableQuotes.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-gray-50">
                          {p.notableQuotes.map((q, i) => (
                            <p key={i} className="text-xs text-gray-400 italic pl-3 border-l-2 border-green-200">
                              &ldquo;{q}&rdquo;
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Topics */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-50 text-[#25D366] flex items-center justify-center">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  🔥 Hottest Topics
                </h2>
                <div className="space-y-3">
                  {insights.topics.map((t, i) => (
                    <div
                      key={t.topic}
                      className="flex items-start gap-3 p-4 rounded-xl bg-gray-50/70 hover:bg-gray-50 transition-colors"
                    >
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#25D366] text-white text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900">{t.topic}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{t.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamics */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-50 text-[#25D366] flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  Group Dynamics
                </h2>
                <div className="space-y-4">
                  <div className="bg-gray-50/70 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Group Mood
                    </p>
                    <p className="text-gray-700">{insights.dynamics.groupMood}</p>
                  </div>
                  {insights.dynamics.closestPairs.length > 0 && (
                    <div className="bg-gray-50/70 rounded-xl p-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Closest Pairs
                      </p>
                      <ul className="space-y-1.5">
                        {insights.dynamics.closestPairs.map((pair, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
                            {pair}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {insights.dynamics.conflicts.length > 0 && (
                    <div className="bg-gray-50/70 rounded-xl p-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Tensions / Debates
                      </p>
                      <ul className="space-y-1.5">
                        {insights.dynamics.conflicts.map((c, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Engagement Meter */}
              {insights.engagement && insights.engagement.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-50 text-[#25D366] flex items-center justify-center">
                      <Activity className="w-4 h-4" />
                    </div>
                    Engagement Meter
                  </h2>
                  <p className="text-sm text-gray-400 mb-4 ml-10">
                    Who sparks conversations vs. who gets left on read
                  </p>
                  <div className="space-y-3">
                    {insights.engagement
                      .sort((a, b) => {
                        const order = { high: 0, medium: 1, low: 2 };
                        return order[a.score] - order[b.score];
                      })
                      .map((e) => (
                        <div
                          key={e.name}
                          className="flex items-start gap-3 p-4 rounded-xl bg-gray-50/70 hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-xl mt-0.5 select-none">{engagementEmoji[e.score]}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-semibold text-gray-900">{e.name}</p>
                              <span
                                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${engagementColor[e.score]}`}
                              >
                                {e.score}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">{e.description}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}


            </div>
          </section>
        )}
      </div>

      <Footer />
    </main>
  );
}

export default function AIInsightsPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#25D366] animate-spin" />
      </main>
    }>
      <AIInsightsPageInner />
    </Suspense>
  );
}
