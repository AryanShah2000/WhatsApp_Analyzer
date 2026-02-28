"use client";

import { useState, useMemo } from "react";
import FileUpload from "@/components/FileUpload";
import Dashboard from "@/components/Dashboard";
import Footer from "@/components/Footer";
import { parseWhatsAppChat, ParsedMessage } from "@/lib/parser";
import { CalendarDays, Upload, Filter, BarChart3, Check } from "lucide-react";

function toDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const STEPS = [
  { icon: Upload, label: "Upload" },
  { icon: Filter, label: "Date Range" },
  { icon: BarChart3, label: "Report" },
];

export default function AnalyzePage() {
  const [allMessages, setAllMessages] = useState<ParsedMessage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  // Derive current step: 0 = upload, 1 = date range, 2 = report
  const currentStep = confirmed && allMessages ? 2 : allMessages ? 1 : 0;

  const handleFileParsed = (text: string) => {
    try {
      const parsed = parseWhatsAppChat(text);
      if (parsed.length === 0) {
        setError(
          "No messages found. Make sure you uploaded a valid WhatsApp chat export (.txt)."
        );
        setAllMessages(null);
        return;
      }
      setError(null);
      setConfirmed(false);

      // Auto-fill date inputs with the chat's min/max dates
      const earliest = parsed.reduce((min, m) => (m.date < min ? m.date : min), parsed[0].date);
      const latest = parsed.reduce((max, m) => (m.date > max ? m.date : max), parsed[0].date);
      setStartDate(toDateString(earliest));
      setEndDate(toDateString(latest));
      setAllMessages(parsed);
    } catch {
      setError("Something went wrong parsing the file. Please try again.");
      setAllMessages(null);
    }
  };

  // Filter messages to the selected date range
  const filteredMessages = useMemo(() => {
    if (!allMessages || !startDate || !endDate) return null;
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T23:59:59");
    return allMessages.filter((m) => m.date >= start && m.date <= end);
  }, [allMessages, startDate, endDate, confirmed]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerate = () => {
    if (!startDate || !endDate) return;
    setConfirmed(true);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1">
        {/* Header */}
        <section className="pt-16 pb-6 px-6">
          <div className="max-w-5xl mx-auto text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight">
              Analyze Your Chat
            </h1>
            <p className="text-lg text-gray-500">
              Upload your WhatsApp .txt export to get started.
            </p>
          </div>

          {/* Step indicator */}
          <div className="max-w-md mx-auto flex items-center justify-between mb-10">
            {STEPS.map((step, i) => {
              const isComplete = currentStep > i;
              const isActive = currentStep === i;
              const Icon = isComplete ? Check : step.icon;
              return (
                <div key={step.label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isComplete
                          ? "bg-[#25D366] text-white"
                          : isActive
                            ? "bg-[#25D366]/10 text-[#25D366] ring-2 ring-[#25D366]"
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <span
                      className={`text-xs mt-1.5 font-medium transition-colors ${
                        isComplete || isActive ? "text-[#25D366]" : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 -mt-5 mx-1 rounded-full transition-colors duration-300 ${
                        currentStep > i ? "bg-[#25D366]" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Upload section */}
        <section className="pb-10 px-6">
          <FileUpload onFileParsed={handleFileParsed} />
          {error && (
            <p className="text-red-500 text-center mt-4 font-medium">{error}</p>
          )}
        </section>

        {/* Date range picker — shown after upload, before dashboard */}
        {allMessages && (
          <section className="pb-10 px-6 animate-[fadeIn_0.4s_ease-out]">
            <div className="max-w-xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-4">
                <CalendarDays className="w-6 h-6 text-[#25D366]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Select time frame for report
              </h2>
              <p className="text-gray-500 mb-6 text-sm">
                Choose the date range you want to analyze.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                <div className="flex flex-col items-start">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setConfirmed(false);
                    }}
                    className="border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-shadow"
                  />
                </div>
                <span className="text-gray-300 font-medium hidden sm:block mt-6">
                  →
                </span>
                <div className="flex flex-col items-start">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setConfirmed(false);
                    }}
                    className="border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-shadow"
                  />
                </div>
              </div>
              <button
                onClick={handleGenerate}
                className="group px-8 py-3 rounded-full text-white text-lg font-semibold shadow-md shadow-green-200/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-300/50 hover:scale-[1.03] active:scale-100"
                style={{ backgroundColor: "#25D366" }}
              >
                Generate Report
              </button>
            </div>
          </section>
        )}

        {/* Dashboard — shown after date range is confirmed */}
        {confirmed && filteredMessages && filteredMessages.length > 0 && (
          <section className="pb-20 px-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="max-w-6xl mx-auto">
              <Dashboard messages={filteredMessages} />
            </div>
          </section>
        )}

        {confirmed && filteredMessages && filteredMessages.length === 0 && (
          <div className="text-center pb-20 px-6">
            <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 p-8">
              <p className="text-gray-500">
                No messages found in the selected date range. Try adjusting the dates.
              </p>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
