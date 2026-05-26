'use client';

import { GlobalCompetitorsTab } from '@/components/analytics/GlobalCompetitorsTab';

export default function CompetitorsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Competitors</h1>
        <p className="text-muted-foreground">
          Competitive intelligence database, portfolio analytics, and strategic insights
        </p>
      </div>
      <GlobalCompetitorsTab />
    </div>
  );
}
