'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';

interface SensitivityVariable {
  variable: string;
  low_case: number;
  base_case: number;
  high_case: number;
  swing?: number;
}

interface SensitivityTornadoChartProps {
  data: SensitivityVariable[];
  height?: number;
}

function formatCurrency(val: number) {
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
}

export function SensitivityTornadoChart({ data, height = 300 }: SensitivityTornadoChartProps) {
  if (data.length === 0) return null;

  const baseValue = data[0]?.base_case || 0;
  const chartData = data.map(d => ({
    name: d.variable,
    low: d.low_case - baseValue,
    high: d.high_case - baseValue,
    swing: d.swing || (d.high_case - d.low_case),
    lowAbs: d.low_case,
    highAbs: d.high_case,
    base: d.base_case,
  })).sort((a, b) => b.swing - a.swing);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 30, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tickFormatter={formatCurrency} />
        <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload;
            return (
              <div className="rounded-lg border bg-background p-3 shadow-md text-sm">
                <p className="font-medium">{d.name}</p>
                <p className="text-red-500">Low: {formatCurrency(d.lowAbs)}</p>
                <p className="text-muted-foreground">Base: {formatCurrency(d.base)}</p>
                <p className="text-green-500">High: {formatCurrency(d.highAbs)}</p>
                <p className="text-muted-foreground">Swing: {formatCurrency(d.swing)}</p>
              </div>
            );
          }}
        />
        <ReferenceLine x={0} stroke="#666" strokeWidth={2} />
        <Bar dataKey="low" stackId="a" maxBarSize={20} radius={[4, 0, 0, 4]}>
          {chartData.map((_, i) => <Cell key={i} fill="#ef4444" fillOpacity={0.7} />)}
        </Bar>
        <Bar dataKey="high" stackId="a" maxBarSize={20} radius={[0, 4, 4, 0]}>
          {chartData.map((_, i) => <Cell key={i} fill="#10b981" fillOpacity={0.7} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
