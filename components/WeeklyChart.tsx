"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface WeeklyChartProps {
  interactions: { logged_at: string }[];
}

export default function WeeklyChart({ interactions }: WeeklyChartProps) {
  // Build last 28 days of data
  const data: { day: string; count: number }[] = [];
  const now = new Date();

  for (let i = 27; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);
    const count = interactions.filter(
      (interaction) => interaction.logged_at.slice(0, 10) === dateStr
    ).length;
    data.push({ day: i % 7 === 0 ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "", count });
  }

  return (
    <div className="w-full h-32">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="day"
            tick={{ fill: "#666666", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "#666666", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#141414",
              border: "1px solid #222222",
              borderRadius: "8px",
              color: "#f5f5f5",
              fontSize: "12px",
            }}
            cursor={{ fill: "rgba(233, 30, 140, 0.1)" }}
          />
          <Bar dataKey="count" fill="#e91e8c" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
