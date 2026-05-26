'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface DomainTimeline {
  name: string;
  color: string;
  filings: number[];
}

const YEARS = ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'];
const COLORS = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'];
const TEXT_COLORS = ['text-blue-600', 'text-green-600', 'text-purple-600', 'text-orange-600', 'text-red-600'];

const SAMPLE: DomainTimeline[] = [
  { name: 'AI/ML Processing', color: 'blue', filings: [45, 78, 132, 201, 289, 380, 445, 510, 562, 598] },
  { name: 'Edge Computing', color: 'green', filings: [120, 180, 230, 270, 290, 310, 320, 315, 308, 295] },
  { name: 'Quantum Computing', color: 'purple', filings: [5, 8, 12, 18, 25, 35, 52, 78, 115, 170] },
  { name: 'Legacy Processing', color: 'orange', filings: [320, 290, 255, 220, 190, 160, 130, 105, 82, 65] },
];

interface TrendTimelineChartProps {
  projectId: string;
  domains?: DomainTimeline[];
}

export function TrendTimelineChart({ projectId, domains = SAMPLE }: TrendTimelineChartProps) {
  const [visible, setVisible] = useState<Set<string>>(new Set(domains.map((d) => d.name)));

  const toggle = (name: string) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const activeDomains = domains.filter((d) => visible.has(d.name));
  const maxVal = Math.max(...activeDomains.flatMap((d) => d.filings), 1);
  const numRows = 5;
  const rowStep = Math.ceil(maxVal / numRows);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Multi-Domain Trend Timeline</CardTitle>
        <p className="text-xs text-muted-foreground">
          Annual patent filings across all technology sub-domains (2016–2025).
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Legend / toggles */}
        <div className="flex flex-wrap gap-3">
          {domains.map((d, i) => (
            <div key={d.name} className="flex items-center gap-1.5">
              <Checkbox
                id={`trend-${d.name}`}
                checked={visible.has(d.name)}
                onCheckedChange={() => toggle(d.name)}
              />
              <label
                htmlFor={`trend-${d.name}`}
                className={`text-xs cursor-pointer font-medium ${TEXT_COLORS[i % TEXT_COLORS.length]}`}
              >
                {d.name}
              </label>
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div className="relative">
          {/* Y-axis labels */}
          <div className="flex">
            <div className="flex flex-col justify-between text-[9px] text-muted-foreground pr-1 h-36">
              {Array.from({ length: numRows + 1 }, (_, i) => numRows - i).map((r) => (
                <span key={r} className="text-right">{(r * rowStep).toLocaleString()}</span>
              ))}
            </div>

            {/* Bar chart */}
            <div className="flex-1">
              {/* Grid lines */}
              <div className="relative h-36 border-l border-b">
                {Array.from({ length: numRows }, (_, i) => (
                  <div
                    key={i}
                    className="absolute w-full border-t border-muted"
                    style={{ bottom: `${((i + 1) / numRows) * 100}%` }}
                  />
                ))}

                {/* Bars */}
                <div className="absolute inset-0 flex items-end gap-0.5 px-0.5">
                  {YEARS.map((year, yi) => (
                    <div key={year} className="flex-1 flex flex-col-reverse gap-0.5 items-center h-full justify-end">
                      {activeDomains.map((d, di) => {
                        const v = d.filings[yi];
                        const heightPct = (v / maxVal) * 100;
                        return (
                          <div
                            key={d.name}
                            className={`w-full ${COLORS[domains.indexOf(d) % COLORS.length]} opacity-80 min-h-[1px] rounded-t-sm`}
                            style={{ height: `${heightPct / activeDomains.length}%` }}
                            title={`${d.name} ${year}: ${v}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* X-axis labels */}
              <div className="flex justify-between px-0.5 pt-1">
                {YEARS.filter((_, i) => i % 2 === 0).map((y) => (
                  <span key={y} className="text-[9px] text-muted-foreground">{y}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* YoY change table */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Latest Year Growth</p>
          <div className="grid gap-1 sm:grid-cols-2">
            {activeDomains.map((d, i) => {
              const last = d.filings[d.filings.length - 1];
              const prev = d.filings[d.filings.length - 2];
              const change = prev > 0 ? Math.round(((last - prev) / prev) * 100) : null;
              return (
                <div key={d.name} className="flex items-center justify-between rounded border px-2 py-1">
                  <span className={`text-xs font-medium ${TEXT_COLORS[domains.indexOf(d) % TEXT_COLORS.length]}`}>
                    {d.name}
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">{last} filings</span>
                    {change !== null && (
                      <span className={change >= 0 ? 'text-green-600' : 'text-red-500'}>
                        {change >= 0 ? '+' : ''}{change}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
