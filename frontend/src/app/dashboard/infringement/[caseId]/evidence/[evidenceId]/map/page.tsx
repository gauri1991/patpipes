'use client';

import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Client-only: the mapper renders PDFs with pdf.js (needs window), so disable SSR.
const EvidenceMapper = dynamic(
  () => import('@/domains/infringement/components/EvidenceMapper').then((m) => m.EvidenceMapper),
  { ssr: false, loading: () => <div className="p-8 text-sm text-muted-foreground">Loading mapper…</div> }
);

export default function EvidenceMapperPage() {
  const params = useParams();
  return (
    <EvidenceMapper
      caseId={params.caseId as string}
      evidenceId={params.evidenceId as string}
    />
  );
}
