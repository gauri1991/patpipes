'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, Radio, Activity } from 'lucide-react';
import type { JobStats } from '../types/fccData.types';
import { FCC_STATUS_CONFIG } from '../types/fccData.types';

interface QueryStatsProps {
  stats: JobStats;
}

export const QueryStats: React.FC<QueryStatsProps> = ({ stats }) => {
  const classEntries = Object.entries(stats.equipment_class_counts)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  const statusEntries = Object.entries(stats.status_counts)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-500">Total Records</p>
                <p className="text-lg font-semibold">{stats.total_records}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-500">Unique Grantees</p>
                <p className="text-lg font-semibold">{stats.unique_grantees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-500">Freq Range (MHz)</p>
                <p className="text-sm font-semibold">
                  {stats.freq_min && stats.freq_max
                    ? `${Number(stats.freq_min).toFixed(0)} - ${Number(stats.freq_max).toFixed(0)}`
                    : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-500">Equipment Classes</p>
                <p className="text-lg font-semibold">{classEntries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distributions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Equipment class distribution */}
        {classEntries.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Equipment Classes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {classEntries.map(([cls, count]) => (
                <div key={cls} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-neutral-700">{cls || '(none)'}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full"
                        style={{ width: `${(count / stats.total_records) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-neutral-500 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Status distribution */}
        {statusEntries.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Authorization Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {statusEntries.map(([st, count]) => {
                const cfg = FCC_STATUS_CONFIG[st] || { label: st, color: 'bg-neutral-400' };
                return (
                  <div key={st} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${cfg.color}`} />
                      <span className="text-neutral-700">{cfg.label}</span>
                    </span>
                    <span className="text-xs text-neutral-500">{count}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
