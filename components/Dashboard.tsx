"use client";

import { ParsedMessage } from "@/lib/parser";
import {
  getSummaryStats,
  getMessagesByPeriod,
  getTopSenders,
  getMonthlyStatsByUser,
  getUserTimeline,
  getAllUsers,
  getAllMonths,
  getActivityHeatmap,
} from "@/lib/analytics";
import { LineChart, BarChart } from "./Charts";
import Heatmap from "./Heatmap";
import { useState } from "react";
import {
  MessageSquareText,
  Users,
  LetterText,
  CalendarDays,
  TrendingUp,
  Crown,
} from "lucide-react";

interface DashboardProps {
  messages: ParsedMessage[];
}

export default function Dashboard({ messages }: DashboardProps) {
  const [userFilter, setUserFilter] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedUser, setSelectedUser] = useState("");

  const stats = getSummaryStats(messages);
  const users = getAllUsers(messages);
  const months = getAllMonths(messages);

  // Default monthly breakdown to most recent month
  const activeMonth = selectedMonth || (months.length > 0 ? months[0] : "");
  // Default user timeline to first user alphabetically
  const activeUser = selectedUser || (users.length > 0 ? users[0] : "");

  // Filter messages for the line chart
  const filtered = userFilter
    ? messages.filter((m) => m.sender === userFilter)
    : messages;
  const trendData = getMessagesByPeriod(filtered, "ALL");

  const topSenders = getTopSenders(messages);
  const heatmapData = getActivityHeatmap(messages);
  const monthlyStats = activeMonth
    ? getMonthlyStatsByUser(messages, activeMonth)
    : null;
  const userTimeline = activeUser
    ? getUserTimeline(messages, activeUser)
    : null;

  const totalForPercentage = topSenders.reduce((sum, [, c]) => sum + c, 0);

  return (
    <div className="space-y-8">
      {/* ─── Summary Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          {
            icon: <MessageSquareText className="w-5 h-5" />,
            label: "Total Messages",
            value: stats.totalMessages.toLocaleString(),
          },
          {
            icon: <Users className="w-5 h-5" />,
            label: "Participants",
            value: stats.totalUsers,
          },
          {
            icon: <LetterText className="w-5 h-5" />,
            label: "Total Words",
            value: stats.totalWords.toLocaleString(),
          },
          {
            icon: <CalendarDays className="w-5 h-5" />,
            label: "Days Spanned",
            value: stats.daySpan.toLocaleString(),
          },
          {
            icon: <TrendingUp className="w-5 h-5" />,
            label: "Avg / Day",
            value: stats.avgPerDay,
          },
        ].map((card, i) => (
          <div
            key={card.label}
            className="group bg-white rounded-xl border border-gray-100 p-5 text-center shadow-sm hover:shadow-md hover:border-[#25D366]/20 transition-all duration-300"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="w-10 h-10 rounded-xl bg-green-50 text-[#25D366] flex items-center justify-center mx-auto mb-3 group-hover:bg-[#25D366] group-hover:text-white transition-colors duration-300">
              {card.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mt-1">
              {card.label}
            </p>
          </div>
        ))}
      </div>

      {/* ─── Messages Over Time ─── */}
      <section className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Messages Over Time
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Activity trend across the selected date range
            </p>
          </div>
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all cursor-pointer"
          >
            <option value="">All users</option>
            {users.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <LineChart
          labels={trendData.labels}
          data={trendData.data}
          label={userFilter || "Total Messages"}
        />
      </section>

      {/* ─── Top Senders ─── */}
      <section className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            Top 5 Senders
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Ranked by message count in selected range
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="pb-3 pr-4 w-12">#</th>
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 text-right pr-6">Messages</th>
                <th className="pb-3 text-right">Share</th>
              </tr>
            </thead>
            <tbody>
              {topSenders.map(([name, count], i) => {
                const pct = totalForPercentage > 0 ? ((count / totalForPercentage) * 100).toFixed(1) : "0";
                return (
                  <tr key={name} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 pr-4">
                      {i === 0 ? (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <span className="text-sm font-semibold text-gray-400">{i + 1}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-gray-900 font-medium">{name}</td>
                    <td className="py-3 text-right pr-6 text-gray-600 tabular-nums">
                      {count.toLocaleString()}
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-xs font-medium text-[#25D366] bg-green-50 px-2 py-0.5 rounded-full">
                        {pct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Activity Heatmap ─── */}
      <section className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            Activity Heatmap
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Messages by day of week and hour of day
          </p>
        </div>
        <Heatmap grid={heatmapData.grid} max={heatmapData.max} />
      </section>

      {/* ─── Monthly Breakdown ─── */}
      <section className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Monthly Breakdown
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Per-user message count for a given month
            </p>
          </div>
          <select
            value={activeMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all cursor-pointer"
          >
            <option value="">Select a month</option>
            {months.map((m) => {
              const [y, mo] = m.split("-");
              const label = new Date(+y, +mo - 1).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              });
              return (
                <option key={m} value={m}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
        {monthlyStats ? (
          <BarChart
            labels={monthlyStats.labels}
            data={monthlyStats.data}
            color="#25D366"
          />
        ) : (
          <p className="text-gray-400 text-center py-12">
            Select a month above to view per-user breakdown
          </p>
        )}
      </section>

      {/* ─── User Timeline ─── */}
      <section className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">User Timeline</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Individual activity over time
            </p>
          </div>
          <select
            value={activeUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all cursor-pointer"
          >
            <option value="">Select a user</option>
            {users.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        {userTimeline ? (
          <LineChart
            labels={userTimeline.labels}
            data={userTimeline.data}
            label={activeUser}
            color="#25D366"
          />
        ) : (
          <p className="text-gray-400 text-center py-12">
            Select a user above to view their message timeline
          </p>
        )}
      </section>
    </div>
  );
}
