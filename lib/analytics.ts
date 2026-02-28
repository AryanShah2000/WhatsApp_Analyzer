import { ParsedMessage } from "./parser";

/* ─── Time periods ─── */

export interface Period {
  key: string;
  label: string;
  isDaily: boolean;
}

export type TimeRange = "ALL" | "12M" | "YTD" | "3M" | "30D";

export function getTimeRangePeriods(
  range: TimeRange,
  messages: ParsedMessage[]
): Period[] {
  const periods: Period[] = [];
  const now = new Date();

  if (range === "30D") {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      periods.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        isDaily: true,
      });
    }
    return periods;
  }

  let startDate: Date;
  switch (range) {
    case "3M":
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      break;
    case "YTD":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case "12M":
      startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      break;
    case "ALL":
    default: {
      if (messages.length > 0) {
        const earliest = messages.reduce(
          (min, m) => (m.date < min ? m.date : min),
          messages[0].date
        );
        startDate = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      }
      break;
    }
  }

  const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);

  while (cur <= end) {
    periods.push({
      key: `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`,
      label: cur.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      isDaily: false,
    });
    cur.setMonth(cur.getMonth() + 1);
  }

  return periods;
}

/* ─── Message counts by period ─── */

export function getMessagesByPeriod(
  messages: ParsedMessage[],
  range: TimeRange
) {
  const periods = getTimeRangePeriods(range, messages);
  const counts: Record<string, number> = {};
  periods.forEach((p) => (counts[p.key] = 0));

  const isDaily = periods.length > 0 && periods[0].isDaily;

  messages.forEach((msg) => {
    const key = isDaily
      ? `${msg.date.getFullYear()}-${String(msg.date.getMonth() + 1).padStart(2, "0")}-${String(msg.date.getDate()).padStart(2, "0")}`
      : msg.monthYear;
    if (key in counts) counts[key]++;
  });

  return {
    labels: periods.map((p) => p.label),
    data: periods.map((p) => counts[p.key]),
  };
}

/* ─── Top senders ─── */

export function getTopSenders(
  messages: ParsedMessage[],
  limit = 5
): [string, number][] {
  const counts: Record<string, number> = {};

  messages.forEach((msg) => {
    counts[msg.sender] = (counts[msg.sender] || 0) + 1;
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

/* ─── Monthly stats by user ─── */

export function getMonthlyStatsByUser(
  messages: ParsedMessage[],
  monthYear: string
) {
  const counts: Record<string, number> = {};
  messages
    .filter((m) => m.monthYear === monthYear)
    .forEach((m) => (counts[m.sender] = (counts[m.sender] || 0) + 1));

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return { labels: sorted.map((u) => u[0]), data: sorted.map((u) => u[1]) };
}

/* ─── User timeline ─── */

export function getUserTimeline(messages: ParsedMessage[], userName: string) {
  const counts: Record<string, number> = {};
  messages
    .filter((m) => m.sender === userName)
    .forEach((m) => (counts[m.monthYear] = (counts[m.monthYear] || 0) + 1));

  const sorted = Object.keys(counts).sort();
  return {
    labels: sorted.map((k) => {
      const [y, m] = k.split("-");
      return new Date(+y, +m - 1).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    }),
    data: sorted.map((k) => counts[k]),
  };
}

/* ─── Helpers ─── */

export function getAllUsers(messages: ParsedMessage[]): string[] {
  return [...new Set(messages.map((m) => m.sender))].sort();
}

export function getAllMonths(messages: ParsedMessage[]): string[] {
  return [...new Set(messages.map((m) => m.monthYear))].sort().reverse();
}

/* ─── Summary stats ─── */

export function getSummaryStats(messages: ParsedMessage[]) {
  const totalMessages = messages.length;
  const totalUsers = new Set(messages.map((m) => m.sender)).size;

  let totalWords = 0;
  messages.forEach((m) => {
    totalWords += m.message
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
  });

  const firstDate = messages.reduce(
    (min, m) => (m.date < min ? m.date : min),
    messages[0].date
  );
  const lastDate = messages.reduce(
    (max, m) => (m.date > max ? m.date : max),
    messages[0].date
  );
  const daySpan =
    Math.ceil(
      (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
  const avgPerDay = +(totalMessages / daySpan).toFixed(1);

  return { totalMessages, totalUsers, totalWords, daySpan, avgPerDay };
}

/* ─── Activity heatmap (hour × day-of-week) ─── */

export function getActivityHeatmap(messages: ParsedMessage[]) {
  // grid[day][hour] = count   (day 0 = Sunday … 6 = Saturday)
  const grid: number[][] = Array.from({ length: 7 }, () =>
    Array(24).fill(0)
  );

  messages.forEach((m) => {
    const day = m.date.getDay(); // 0-Sun … 6-Sat
    grid[day][m.hour]++;
  });

  // Find max for colour scaling
  let max = 0;
  grid.forEach((row) => row.forEach((v) => { if (v > max) max = v; }));

  return { grid, max };
}
