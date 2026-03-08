"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { CHART_COLORS } from "@/constants";
import type { PollTrend } from "@/types";

interface PollTrendChartProps {
  data: PollTrend[];
  title?: string;
}

/**
 * Displays poll trend data as a multi-line chart.
 * Each line represents a candidate/party over time.
 */
export function PollTrendChart({ data, title = "Anket Trendleri" }: PollTrendChartProps) {
  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Henüz anket verisi bulunmuyor.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Extract unique candidate/party labels
  const labels = Array.from(
    new Set(data.flatMap((d) => d.items.map((item) => item.label)))
  );

  // Transform data for Recharts
  const chartData = data.map((poll) => {
    const point: Record<string, string | number> = {
      date: poll.date,
      firmName: poll.firmName,
    };
    for (const item of poll.items) {
      point[item.label] = item.percentage;
    }
    return point;
  });

  // Get colors for each label
  const labelColors = new Map<string, string>();
  for (const poll of data) {
    for (const item of poll.items) {
      if (!labelColors.has(item.label)) {
        labelColors.set(item.label, item.color || CHART_COLORS[labelColors.size % CHART_COLORS.length]!);
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" className="text-xs" />
            <YAxis domain={[0, "auto"]} className="text-xs" unit="%" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Legend />
            {labels.map((label) => (
              <Line
                key={label}
                type="monotone"
                dataKey={label}
                stroke={labelColors.get(label)}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
