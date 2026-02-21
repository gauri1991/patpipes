'use client';

import { use } from 'react';
import WorkflowTemplateDetail from '@/domains/workflows/components/WorkflowTemplateDetail';

export default function WorkflowTemplateDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }>
}) {
  const { id } = use(params);
  return <WorkflowTemplateDetail templateId={id} />;
}