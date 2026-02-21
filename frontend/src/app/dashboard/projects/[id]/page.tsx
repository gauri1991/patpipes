'use client';

import { use } from 'react';
import { ProjectDashboard } from '@/domains/projects/components/ProjectDashboard';

interface ProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const resolvedParams = use(params);
  return <ProjectDashboard projectId={resolvedParams.id} />;
}