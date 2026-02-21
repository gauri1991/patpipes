/**
 * Prior Art Research Tab Component
 * Adapted brainstorming interface specifically for prior art research
 * Features claim analysis, patent-focused keyword extraction, and search strategy planning
 */

'use client';

import { useState } from 'react';
import {
  Brain,
  Target,
  FileText,
  Key,
  Tag,
  Search,
  Gavel,
  Shield,
  Lightbulb,
  CheckCircle,
  ArrowRight,
  Network
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Import specialized prior art research tools
import { ClaimAnalysisTab } from './tools/ClaimAnalysisTab';
import { PatentTextAnalyzerTab } from './tools/PatentTextAnalyzerTab';
import { PriorArtKeywordsTab } from './tools/PriorArtKeywordsTab';
import { SearchStrategyTab } from './tools/SearchStrategyTab';
import { ClassificationsTab } from './tools/ClassificationsTab';

import { PriorArtProject, PriorArtProjectType } from '@/types/prior-art.types';

interface PriorArtResearchTabProps {
  project: PriorArtProject;
  onProceedToSearch?: (data: any) => void;
}

export function PriorArtResearchTab({ project, onProceedToSearch }: PriorArtResearchTabProps) {
  const [activeTab, setActiveTab] = useState('claim-analysis');
  const [researchData, setResearchData] = useState<any>({
    targetClaims: [],
    extractedConcepts: [],
    keywords: [],
    classifications: [],
    searchStrategy: null
  });

  // Tab configuration based on project type
  const getTabsConfig = () => {
    const baseTabs = [
      {
        id: 'claim-analysis',
        label: 'Claim Analysis',
        icon: Target,
        description: 'Analyze target patent claims',
        color: 'text-red-600',
        required: true
      },
      {
        id: 'text-analyzer',
        label: 'Text Analyzer',
        icon: FileText,
        description: 'Extract concepts from patents',
        color: 'text-blue-600',
        required: false
      },
      {
        id: 'keywords',
        label: 'Keywords',
        icon: Key,
        description: 'Generate search keywords',
        color: 'text-green-600',
        required: true
      },
      {
        id: 'classifications',
        label: 'Classifications',
        icon: Tag,
        description: 'Identify patent classes',
        color: 'text-purple-600',
        required: false
      },
      {
        id: 'citations',
        label: 'Citations',
        icon: Network,
        description: 'Analyze citation networks',
        color: 'text-cyan-600',
        required: false
      },
      {
        id: 'search-strategy',
        label: 'Search Strategy',
        icon: Search,
        description: 'Plan search approach',
        color: 'text-orange-600',
        required: true
      }
    ];

    return baseTabs;
  };

  const tabsConfig = getTabsConfig();

  // Progress tracking removed to prevent infinite render loops
  const handleTabProgress = (tabId: string, progress: number) => {
    // No-op - progress tracking disabled
  };

  // Data tracking disabled to prevent infinite render loops
  const handleDataUpdate = (tabId: string, data: any) => {
    // No-op - data tracking disabled
  };

  const handleProceedToSearch = () => {
    if (onProceedToSearch) {
      onProceedToSearch({
        ...researchData,
        projectType: project.type,
        targetPatent: project.target_patent
      });
    }
  };

  const getProjectTypeIcon = (type: PriorArtProjectType) => {
    switch (type) {
      case PriorArtProjectType.INVALIDITY: return Gavel;
      case PriorArtProjectType.FTO: return Shield;
      case PriorArtProjectType.NOVELTY: return Lightbulb;
      default: return Search;
    }
  };

  const ProjectTypeIcon = getProjectTypeIcon(project.type);

  const isReadyToSearch = true; // Always ready - progress tracking removed

  return (
    <div className="flex h-full flex-col">
      {/* Header panels removed - showing sub-tabs directly */}

      {/* Research Sub-Tabs - Direct Display */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            {tabsConfig.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
              >
                <div className="flex items-center gap-2">
                  <tab.icon className={`h-4 w-4 ${tab.color}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.required && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
                  )}
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

            <TabsContent value="claim-analysis" className="space-y-6">
              <ClaimAnalysisTab
                project={project}
                onProgressUpdate={(progress) => handleTabProgress('claimAnalysis', progress)}
                onDataUpdate={(data) => handleDataUpdate('claimAnalysis', data)}
              />
            </TabsContent>

            <TabsContent value="text-analyzer" className="space-y-6">
              <PatentTextAnalyzerTab
                project={project}
                claimData={researchData.claimAnalysis}
                onProgressUpdate={(progress) => handleTabProgress('textAnalysis', progress)}
                onDataUpdate={(data) => handleDataUpdate('textAnalysis', data)}
              />
            </TabsContent>

            <TabsContent value="keywords" className="space-y-6">
              <PriorArtKeywordsTab
                project={project}
                claimData={researchData.claimAnalysis}
                textData={researchData.textAnalysis}
                onProgressUpdate={(progress) => handleTabProgress('keywords', progress)}
                onDataUpdate={(data) => handleDataUpdate('keywords', data)}
              />
            </TabsContent>

            <TabsContent value="classifications" className="space-y-6">
              <ClassificationsTab
                project={project}
                conceptData={researchData.textAnalysis}
                onProgressUpdate={(progress) => handleTabProgress('classifications', progress)}
                onDataUpdate={(data) => handleDataUpdate('classifications', data)}
              />
            </TabsContent>

            <TabsContent value="citations" className="space-y-6">
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <Network className="h-16 w-16 text-cyan-600 mx-auto" />
                  <h3 className="text-lg font-semibold">Citation Network Analysis</h3>
                  <p className="text-muted-foreground max-w-md">
                    Advanced citation network visualization and analysis tools will be available here. 
                    Analyze forward/backward citations, citation clusters, and patent landscapes.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="search-strategy" className="space-y-6">
              <SearchStrategyTab
                project={project}
                researchData={researchData}
                onProgressUpdate={(progress) => handleTabProgress('strategy', progress)}
                onDataUpdate={(data) => handleDataUpdate('strategy', data)}
                onProceedToSearch={handleProceedToSearch}
              />
            </TabsContent>
        </Tabs>
    </div>
  );
}