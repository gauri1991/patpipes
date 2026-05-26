'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

interface ValuationComparisonChartProps {
  incomeApproach: number;
  marketApproach: number;
  costApproach: number;
  recommendedRange?: [number, number];
  height?: number;
}

function formatCurrency(val: number) {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
}

export function ValuationComparisonChart({
  incomeApproach,
  marketApproach,
  costApproach,
  recommendedRange,
  height = 250,
}: ValuationComparisonChartProps) {
  const data = [
    { name: 'Income\n(50% weight)', value: incomeApproach, fill: '#10b981' },
    { name: 'Market\n(30% weight)', value: marketApproach, fill: '#3b82f6' },
    { name: 'Cost\n(20% weight)', value: costApproach, fill: '#8b5cf6' },
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={formatCurrency} />
        <Tooltip formatter={(v: number) => [formatCurrency(v), 'Estimate']} />
        {recommendedRange && (
          <>
            <ReferenceLine y={recommendedRange[0]} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Low', position: 'right', fontSize: 11 }} />
            <ReferenceLine y={recommendedRange[1]} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'High', position: 'right', fontSize: 11 }} />
          </>
        )}
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
          {data.map((entry, i) => (
            <Bar key={i} dataKey="value" fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
