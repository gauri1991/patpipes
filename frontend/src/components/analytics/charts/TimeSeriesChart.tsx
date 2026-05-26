'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart,
} from 'recharts';

interface TimeSeriesDataPoint {
  label: string;
  [key: string]: string | number;
}

interface SeriesConfig {
  key: string;
  name: string;
  color: string;
  type?: 'line' | 'area';
  dashed?: boolean;
}

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  series: SeriesConfig[];
  height?: number;
  xLabel?: string;
  yLabel?: string;
}

export function TimeSeriesChart({
  data,
  series,
  height = 300,
}: TimeSeriesChartProps) {
  if (data.length === 0) return null;

  const hasArea = series.some(s => s.type === 'area');

  if (hasArea) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis />
          <Tooltip />
          <Legend />
          {series.map(s =>
            s.type === 'area' ? (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                fill={s.color}
                stroke={s.color}
                fillOpacity={0.15}
                strokeDasharray={s.dashed ? '5 5' : undefined}
              />
            ) : (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                dot={{ r: 3 }}
                strokeDasharray={s.dashed ? '5 5' : undefined}
              />
            )
          )}
        </ComposedChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis />
        <Tooltip />
        <Legend />
        {series.map(s => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            dot={{ r: 3 }}
            strokeDasharray={s.dashed ? '5 5' : undefined}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
