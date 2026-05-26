'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

interface BarRankingChartProps {
  data: { name: string; value: number; label?: string }[];
  color?: string;
  height?: number;
  layout?: 'horizontal' | 'vertical';
  valueFormatter?: (val: number) => string;
  barLabel?: string;
}

export function BarRankingChart({
  data,
  color = '#3b82f6',
  height = 300,
  layout = 'vertical',
  valueFormatter,
  barLabel = 'Value',
}: BarRankingChartProps) {
  if (data.length === 0) return null;

  const fmt = valueFormatter || ((v: number) => v.toLocaleString());

  if (layout === 'vertical') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tickFormatter={fmt} />
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v: number) => [fmt(v), barLabel]} />
          <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} height={60} />
        <YAxis tickFormatter={fmt} />
        <Tooltip formatter={(v: number) => [fmt(v), barLabel]} />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
