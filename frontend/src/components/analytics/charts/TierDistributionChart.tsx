'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TIER_COLORS: Record<string, string> = {
  'Tier A': '#10b981',
  'Tier B': '#3b82f6',
  'Tier C': '#f59e0b',
  'Tier D': '#ef4444',
};

interface TierDistributionChartProps {
  data: { tier: string; count: number; percentage: number }[];
  height?: number;
}

export function TierDistributionChart({ data, height = 280 }: TierDistributionChartProps) {
  const chartData = data.map(d => ({
    name: d.tier,
    value: d.count,
    percentage: d.percentage,
  }));

  if (chartData.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percentage }) => `${name} (${percentage}%)`}
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={TIER_COLORS[entry.name] || '#94a3b8'} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number, name: string) => [`${value} patents`, name]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
