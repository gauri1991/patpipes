'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

interface RevenueProjectionChartProps {
  data: { year: number; conservative: number; base: number; optimistic: number }[];
  height?: number;
}

function formatCurrency(val: number) {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
}

export function RevenueProjectionChart({ data, height = 300 }: RevenueProjectionChartProps) {
  if (data.length === 0) return null;

  const chartData = data.map(d => ({
    label: String(d.year),
    conservative: d.conservative,
    base: d.base,
    optimistic: d.optimistic,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" />
        <YAxis tickFormatter={formatCurrency} />
        <Tooltip formatter={(v: number) => [formatCurrency(v)]} />
        <Legend />
        <Line type="monotone" dataKey="conservative" name="Conservative" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
        <Line type="monotone" dataKey="base" name="Base" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
        <Line type="monotone" dataKey="optimistic" name="Optimistic" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
