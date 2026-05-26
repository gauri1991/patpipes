'use client';

import { GlobalTechnologyAreasTab } from '@/components/analytics/GlobalTechnologyAreasTab';

export default function TechnologyAreasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Technology Areas</h1>
        <p className="text-muted-foreground">
          Global technology taxonomy, IPC/CPC classification management, and trend analysis
        </p>
      </div>
      <GlobalTechnologyAreasTab />
    </div>
  );
}
