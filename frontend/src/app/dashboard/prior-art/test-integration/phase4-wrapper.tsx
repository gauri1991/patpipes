/**
 * Phase 4 Components Test Wrapper
 * Imports and wraps all Phase 4 analysis components for testing
 */

'use client';

import { useState } from 'react';
import { EvidenceStrengthAnalyzer } from '@/components/prior-art-analysis/EvidenceStrengthAnalyzer';
import { ClaimMappingVisualizer } from '@/components/prior-art-analysis/ClaimMappingVisualizer';
import { LegalRelevanceScorer } from '@/components/prior-art-analysis/LegalRelevanceScorer';
import { CitationNetworkAnalyzer } from '@/components/prior-art-analysis/CitationNetworkAnalyzer';
import { Card } from '@/components/ui/card';

interface TestWrapperProps {
  component: 'evidence' | 'claim' | 'legal' | 'citation';
  projectType?: 'FTO' | 'NOVELTY' | 'INVALIDITY';
}

export function Phase4TestWrapper({ component, projectType = 'FTO' }: TestWrapperProps) {
  const [error, setError] = useState<string | null>(null);

  try {
    switch (component) {
      case 'evidence':
        return (
          <Card className="p-6">
            <EvidenceStrengthAnalyzer 
              projectId="test-project-1"
              projectType={projectType}
            />
          </Card>
        );
      
      case 'claim':
        return (
          <Card className="p-6">
            <ClaimMappingVisualizer 
              projectId="test-project-1"
              projectType={projectType}
            />
          </Card>
        );
      
      case 'legal':
        return (
          <Card className="p-6">
            <LegalRelevanceScorer 
              projectId="test-project-1"
              projectType={projectType}
            />
          </Card>
        );
      
      case 'citation':
        return (
          <Card className="p-6">
            <CitationNetworkAnalyzer 
              projectId="test-project-1"
            />
          </Card>
        );
      
      default:
        return (
          <Card className="p-6">
            <p className="text-red-600">Unknown component: {component}</p>
          </Card>
        );
    }
  } catch (err) {
    return (
      <Card className="p-6">
        <p className="text-red-600">Error loading component: {err?.toString()}</p>
      </Card>
    );
  }
}