'use client';

import { use } from 'react';
import WorkflowTemplateEdit from '@/domains/workflows/components/WorkflowTemplateEdit';

export default function WorkflowTemplateEditPage({ 
  params 
}: { 
  params: Promise<{ id: string }>
}) {
  const { id } = use(params);
  return <WorkflowTemplateEdit templateId={id} />;
}