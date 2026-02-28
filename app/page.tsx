import {
  BarChart3,
  MessageSquareText,
  TrendingUp,
  Users,
  Sparkles,
  Upload,
  ChevronRight,
  ArrowRight,
  Shield,
  Zap,
  PieChart,
} from "lucide-react";
import Link from "next/link";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="bg-white">
      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden pt-24 pb-32 px-6 text-center bg-gradient-to-b from-green-50 via-white to-white">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-100 rounded-full mix-blend-multiply blur-3xl opacity-40 -translate-y-1/2" />
        <div className="absolute top-20 right-1/4 w-72 h-72 bg-emerald-100 rounded-full mix-blend-multiply blur-3xl opacity-30" />

        <div className="relative max-w-4xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 mb-6 text-sm font-medium rounded-full bg-green-100/80 text-green-700 backdrop-blur-sm">
            <Shield className="w-3.5 h-3.5" />
            Free to use · No sign-up required
          </span>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-gray-900 leading-[1.1] mb-6 tracking-tight">
            Turn your WhatsApp chats into{" "}
            <span className="bg-gradient-to-r from-[#25D366] to-emerald-500 bg-clip-text text-transparent">
              insights
            </span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed">
            Upload your exported chat file and instantly discover who texts the
            most, when your group is most active, trending topics, and more.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/analyze"
              className="group px-10 py-4 rounded-full text-white text-lg font-semibold shadow-lg shadow-green-200/50 transition-all duration-300 hover:shadow-xl hover:shadow-green-300/50 hover:scale-[1.03] active:scale-100 flex items-center gap-2"
              style={{ backgroundColor: "#25D366" }}
            >
              Get Started — It&apos;s Free
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#how-it-works"
              className="px-10 py-4 rounded-full text-gray-600 text-lg font-semibold border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
            >
              See How It Works
              <ChevronRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* ─── Stats Banner ─── */}
      <section className="py-12 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-around gap-8 px-6 text-center">
          {[
            { icon: <Shield className="w-5 h-5" />, value: "100% Private", label: "Files never leave your browser" },
            { icon: <Zap className="w-5 h-5" />, value: "Instant", label: "Results in under 30 seconds" },
            { icon: <PieChart className="w-5 h-5" />, value: "10+", label: "Charts & insights generated" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[#25D366]">{stat.icon}</span>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto text-center mb-16">
          <p className="text-sm font-semibold text-[#25D366] uppercase tracking-widest mb-3">
            Simple Process
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How it works
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Three simple steps to unlock the story behind your conversations.
          </p>
        </div>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              icon: <Upload className="w-7 h-7 text-[#25D366]" />,
              title: "Export your chat",
              desc: "Open any WhatsApp chat → Tap ⋮ → Export chat → Save the .txt file.",
            },
            {
              step: "02",
              icon: <BarChart3 className="w-7 h-7 text-[#25D366]" />,
              title: "Upload & analyze",
              desc: "Drop your file here and watch as charts and stats are generated instantly.",
            },
            {
              step: "03",
              icon: <Sparkles className="w-7 h-7 text-[#25D366]" />,
              title: "Discover insights",
              desc: "Explore interactive dashboards, compare members, and share your results.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="group relative bg-white rounded-2xl border border-gray-100 p-8 text-center hover:border-[#25D366]/30 hover:shadow-lg hover:shadow-green-50 transition-all duration-300"
            >
              <span className="absolute top-4 right-5 text-5xl font-black text-gray-100 group-hover:text-green-100 transition-colors select-none">
                {item.step}
              </span>
              <div className="relative w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-5">
                {item.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {item.title}
              </h3>
              <p className="text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto text-center mb-16">
          <p className="text-sm font-semibold text-[#25D366] uppercase tracking-widest mb-3">
            Powerful Analytics
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Everything you can explore
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Powerful analytics that make your conversations come alive.
          </p>
        </div>
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: <TrendingUp className="w-6 h-6" />,
              title: "Message Trends",
              desc: "See how your chat activity changes over weeks, months, or years with interactive line charts.",
            },
            {
              icon: <Users className="w-6 h-6" />,
              title: "Top Senders",
              desc: "Find out who dominates the conversation with ranked leaderboards and percentage breakdowns.",
            },
            {
              icon: <BarChart3 className="w-6 h-6" />,
              title: "Monthly Breakdown",
              desc: "Drill into any month to see per-person message counts and compare member activity.",
            },
            {
              icon: <MessageSquareText className="w-6 h-6" />,
              title: "Word & Emoji Stats",
              desc: "Discover the most-used words, favorite emojis, and average message length per person.",
            },
            {
              icon: <Sparkles className="w-6 h-6" />,
              title: "AI-Powered Insights",
              desc: "Unlock deep analysis of conversation topics, sentiment, and personality traits with our premium AI feature.",
              premium: true,
            },
            {
              icon: <Upload className="w-6 h-6" />,
              title: "Chat Wrapped",
              desc: "Get a beautiful Spotify Wrapped-style year-in-review summary of your group chat.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group bg-white rounded-2xl p-7 border border-gray-100 hover:border-[#25D366]/30 hover:shadow-lg hover:shadow-green-50 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-green-50 text-[#25D366] flex items-center justify-center mb-4 group-hover:bg-[#25D366] group-hover:text-white transition-colors duration-300">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                {feature.title}
                {"premium" in feature && feature.premium && (
                  <span className="text-xs font-medium bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                    Premium
                  </span>
                )}
              </h3>
              <p className="text-gray-500 leading-relaxed text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── AI Premium Teaser ─── */}
      <section className="py-24 px-6">
        <div className="relative max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-[#25D366] to-emerald-600 p-12 md:p-16 text-center text-white overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />

          <div className="relative">
            <Sparkles className="w-12 h-12 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Go deeper with AI insights
            </h2>
            <p className="text-base sm:text-lg md:text-xl opacity-90 max-w-2xl mx-auto mb-10 leading-relaxed">
              Our premium feature feeds your chat into an advanced language model
              to surface personality profiles, topic summaries, relationship
              dynamics, and conversation highlights — things no chart can show.
            </p>
            <Link
              href="/insights"
              className="group px-10 py-4 rounded-full bg-white text-[#25D366] text-lg font-semibold shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all duration-300 active:scale-100 inline-flex items-center gap-2"
            >
              Try AI Insights
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-24 px-6 text-center bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Ready to explore your chats?
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10">
            No sign-up, no data stored, completely free. Upload a file and see
            for yourself.
          </p>
          <Link
            href="/analyze"
            className="group inline-flex items-center gap-2 px-12 py-5 rounded-full text-white text-xl font-semibold shadow-lg shadow-green-200/50 hover:shadow-xl hover:shadow-green-300/50 hover:scale-[1.03] transition-all duration-300 active:scale-100"
            style={{ backgroundColor: "#25D366" }}
          >
            Analyze Your Chat Now
            <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <Footer />
    </main>
  );
}
