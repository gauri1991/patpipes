'use client';

import { DashboardShell } from '@/components/layouts/DashboardShell';

export default function SimpleDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Temporarily bypass auth for testing
  return (
    <DashboardShell>
      {children}
    </DashboardShell>
  );
}