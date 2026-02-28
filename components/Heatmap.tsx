"use client";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return "12a";
  if (i < 12) return `${i}a`;
  if (i === 12) return "12p";
  return `${i - 12}p`;
});

interface HeatmapProps {
  grid: number[][]; // [day 0-6][hour 0-23]
  max: number;
}

function cellColor(value: number, max: number): string {
  if (value === 0 || max === 0) return "bg-gray-100";
  const ratio = value / max;
  if (ratio < 0.15) return "bg-green-100";
  if (ratio < 0.3) return "bg-green-200";
  if (ratio < 0.5) return "bg-green-300";
  if (ratio < 0.7) return "bg-green-400";
  if (ratio < 0.85) return "bg-green-500";
  return "bg-green-600";
}

export default function Heatmap({ grid, max }: HeatmapProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="w-12" />
            {HOURS.map((h) => (
              <th
                key={h}
                className="text-[11px] font-normal text-gray-400 pb-1 px-0 text-center"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day, dayIdx) => (
            <tr key={day}>
              <td className="text-xs font-medium text-gray-500 pr-2 text-right whitespace-nowrap">
                {day}
              </td>
              {grid[dayIdx].map((count, hour) => (
                <td key={hour} className="p-[2px]">
                  <div
                    className={`w-full aspect-square rounded-sm ${cellColor(count, max)} transition-colors`}
                    title={`${day} ${HOURS[hour]}: ${count} messages`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-3 text-xs text-gray-400">
        <span>Less</span>
        {["bg-gray-100", "bg-green-100", "bg-green-200", "bg-green-300", "bg-green-400", "bg-green-500", "bg-green-600"].map(
          (cls) => (
            <div key={cls} className={`w-3 h-3 rounded-sm ${cls}`} />
          )
        )}
        <span>More</span>
      </div>
    </div>
  );
}
