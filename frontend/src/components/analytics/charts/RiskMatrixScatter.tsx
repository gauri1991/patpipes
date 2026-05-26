'use client';

import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Cell,
} from 'recharts';

interface RiskPoint {
  name: string;
  probability: number;
  severity: number;
  description?: string;
}

interface RiskMatrixScatterProps {
  data: RiskPoint[];
  height?: number;
}

function getRiskColor(probability: number, severity: number): string {
  const score = probability * severity;
  if (score >= 0.5) return '#ef4444';
  if (score >= 0.25) return '#f59e0b';
  return '#10b981';
}

export function RiskMatrixScatter({ data, height = 300 }: RiskMatrixScatterProps) {
  if (data.length === 0) return null;

  const chartData = data.map(d => ({
    x: Math.round(d.probability * 100),
    y: Math.round(d.severity * 100),
    z: Math.round(d.probability * d.severity * 100),
    name: d.name,
    description: d.description || '',
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" dataKey="x" name="Probability" unit="%" domain={[0, 100]} />
        <YAxis type="number" dataKey="y" name="Severity" unit="%" domain={[0, 100]} />
        <ZAxis type="number" dataKey="z" range={[60, 400]} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload;
            return (
              <div className="rounded-lg border bg-background p-3 shadow-md text-sm">
                <p className="font-medium">{d.name}</p>
                <p className="text-muted-foreground">Probability: {d.x}%</p>
                <p className="text-muted-foreground">Severity: {d.y}%</p>
                {d.description && <p className="text-muted-foreground mt-1 max-w-[200px]">{d.description}</p>}
              </div>
            );
          }}
        />
        <Scatter data={chartData}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={getRiskColor(entry.x / 100, entry.y / 100)} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
