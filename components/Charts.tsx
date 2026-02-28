"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler
);

/* ─── Shared options ─── */
const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#9ca3af", font: { size: 11 } },
    },
    y: {
      beginAtZero: true,
      ticks: { precision: 0, color: "#9ca3af", font: { size: 11 } },
      grid: { color: "#f3f4f6" },
    },
  },
};

/* ─── Line chart ─── */

interface LineChartProps {
  labels: string[];
  data: number[];
  label?: string;
  color?: string;
}

export function LineChart({
  labels,
  data,
  label = "Messages",
  color = "#25D366",
}: LineChartProps) {
  return (
    <div className="h-72">
      <Line
        data={{
          labels,
          datasets: [
            {
              label,
              data,
              borderColor: color,
              backgroundColor: color + "15",
              borderWidth: 2.5,
              tension: 0.4,
              fill: true,
              pointRadius: 3,
              pointBackgroundColor: color,
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
              pointHoverRadius: 6,
              pointHoverBackgroundColor: color,
            },
          ],
        }}
        options={{
          ...baseOptions,
          plugins: {
            ...baseOptions.plugins,
            legend: { display: true, position: "top" as const, labels: { usePointStyle: true, pointStyle: "circle", padding: 20, font: { size: 12 } } },
            tooltip: { backgroundColor: "#1f2937", titleFont: { size: 13 }, bodyFont: { size: 12 }, padding: 10, cornerRadius: 8, displayColors: false },
          },
        }}
      />
    </div>
  );
}

/* ─── Bar chart ─── */

interface BarChartProps {
  labels: string[];
  data: number[];
  label?: string;
  color?: string;
}

export function BarChart({
  labels,
  data,
  label = "Messages",
  color = "#25D366",
}: BarChartProps) {
  return (
    <div className="h-72">
      <Bar
        data={{
          labels,
          datasets: [
            {
              label,
              data,
              backgroundColor: color + "CC",
              borderColor: color,
              borderWidth: 0,
              borderRadius: 6,
              borderSkipped: false,
            },
          ],
        }}
        options={{
          ...baseOptions,
          plugins: {
            ...baseOptions.plugins,
            tooltip: { backgroundColor: "#1f2937", titleFont: { size: 13 }, bodyFont: { size: 12 }, padding: 10, cornerRadius: 8, displayColors: false },
          },
        }}
      />
    </div>
  );
}
