/**
 * BrainstormingSubTab Component
 * Comprehensive brainstorming interface with multiple specialized tabs
 */

'use client';

import { useState } from 'react';
import {
  Brain,
  Lightbulb,
  FileText,
  Key,
  Tag,
  Network,
  Target,
  Users,
  Bot,
  CheckCircle
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

// Import all the sub-tab components
import { SessionManager } from './brainstorming/SessionManager';
import { IdeationTab } from './brainstorming/IdeationTab';
import { TextAnalyzerTab } from './brainstorming/TextAnalyzerTab';
import { KeywordsTab } from './brainstorming/KeywordsTab';
import { ClassificationsTab } from './brainstorming/ClassificationsTab';
import { ConceptsMapTab } from './brainstorming/ConceptsMapTab';
import { StrategiesTab } from './brainstorming/StrategiesTab';
import { CompetitorsTab } from './brainstorming/CompetitorsTab';
import { AIAssistantTab } from './brainstorming/AIAssistantTab';
import { ReviewExportTab } from './brainstorming/ReviewExportTab';

interface BrainstormingSubTabProps {
  projectId: string;
  onProceedToSearch?: (data: any) => void;
}

export function BrainstormingSubTab({ projectId, onProceedToSearch }: BrainstormingSubTabProps) {
  const [activeTab, setActiveTab] = useState('ideation');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionProgress, setSessionProgress] = useState({
    ideas: 0,
    keywords: 0,
    classifications: 0,
    strategies: 0,
    competitors: 0,
    concepts: 0
  });

  const tabsConfig = [
    {
      id: 'ideation',
      label: 'Ideation',
      icon: Lightbulb,
      description: 'Capture and organize ideas',
      color: 'text-yellow-600'
    },
    {
      id: 'text-analyzer',
      label: 'Text Analyzer',
      icon: FileText,
      description: 'Extract concepts from documents',
      color: 'text-blue-600'
    },
    {
      id: 'keywords',
      label: 'Keywords',
      icon: Key,
      description: 'Build keyword strategies',
      color: 'text-green-600'
    },
    {
      id: 'classifications',
      label: 'Classifications',
      icon: Tag,
      description: 'Explore patent classes',
      color: 'text-purple-600'
    },
    {
      id: 'concepts',
      label: 'Concepts Map',
      icon: Network,
      description: 'Visualize relationships',
      color: 'text-indigo-600'
    },
    {
      id: 'strategies',
      label: 'Strategies',
      icon: Target,
      description: 'Research methodologies',
      color: 'text-red-600'
    },
    {
      id: 'competitors',
      label: 'Competitors',
      icon: Users,
      description: 'Competitive intelligence',
      color: 'text-orange-600'
    },
    {
      id: 'ai-assistant',
      label: 'AI Assistant',
      icon: Bot,
      description: 'AI-powered insights',
      color: 'text-cyan-600'
    },
    {
      id: 'review',
      label: 'Review & Export',
      icon: CheckCircle,
      description: 'Validate and export',
      color: 'text-emerald-600'
    }
  ];

  const getOverallProgress = () => {
    const total = Object.values(sessionProgress).reduce((sum, val) => sum + (val > 0 ? 1 : 0), 0);
    return Math.round((total / Object.keys(sessionProgress).length) * 100);
  };

  const handleDataUpdate = (tabId: string, data: any) => {
    // Update session progress based on data from different tabs
    setSessionProgress(prev => ({
      ...prev,
      [tabId]: data.count || 1
    }));
  };

  return (
    <div className="space-y-6">
      {/* Session Manager */}
      <SessionManager 
        projectId={projectId} 
        onSessionChange={setCurrentSessionId}
      />

      {/* Show tabs only if a session is selected */}
      {!currentSessionId ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Session</h3>
            <p className="text-muted-foreground">
              Create or select a brainstorming session to begin your research process.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Header Card */}
          <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Research Brainstorming</CardTitle>
                <CardDescription>
                  Comprehensive ideation and strategy development for patent research
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{getOverallProgress()}%</div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Session Progress</span>
              <span>{Object.values(sessionProgress).filter(v => v > 0).length} of {Object.keys(sessionProgress).length} sections active</span>
            </div>
            <Progress value={getOverallProgress()} className="h-2" />
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 pt-3 border-t">
              <div className="text-center">
                <div className="text-lg font-semibold text-yellow-600">{sessionProgress.ideas}</div>
                <div className="text-xs text-muted-foreground">Ideas</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">{sessionProgress.keywords}</div>
                <div className="text-xs text-muted-foreground">Keywords</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-600">{sessionProgress.classifications}</div>
                <div className="text-xs text-muted-foreground">Classes</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-red-600">{sessionProgress.strategies}</div>
                <div className="text-xs text-muted-foreground">Strategies</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-orange-600">{sessionProgress.competitors}</div>
                <div className="text-xs text-muted-foreground">Competitors</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-indigo-600">{sessionProgress.concepts}</div>
                <div className="text-xs text-muted-foreground">Concepts</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex h-auto p-1 bg-muted/50">
            {tabsConfig.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex-col h-auto p-3 data-[state=active]:bg-background"
                >
                  <Icon className={`h-4 w-4 mb-1 ${tab.color}`} />
                  <span className="text-xs font-medium">{tab.label}</span>
                  {sessionProgress[tab.id as keyof typeof sessionProgress] > 0 && (
                    <Badge variant="secondary" className="mt-1 h-4 text-xs px-1">
                      {sessionProgress[tab.id as keyof typeof sessionProgress]}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Tab Content */}
        <TabsContent value="ideation" className="space-y-4">
          <IdeationTab projectId={projectId} sessionId={currentSessionId} />
        </TabsContent>

        <TabsContent value="text-analyzer" className="space-y-4">
          <TextAnalyzerTab projectId={projectId} sessionId={currentSessionId} />
        </TabsContent>

        <TabsContent value="keywords" className="space-y-4">
          <KeywordsTab projectId={projectId} sessionId={currentSessionId} />
        </TabsContent>

        <TabsContent value="classifications" className="space-y-4">
          <ClassificationsTab projectId={projectId} sessionId={currentSessionId} />
        </TabsContent>

        <TabsContent value="concepts" className="space-y-4">
          <ConceptsMapTab projectId={projectId} sessionId={currentSessionId} />
        </TabsContent>

        <TabsContent value="strategies" className="space-y-4">
          <StrategiesTab projectId={projectId} sessionId={currentSessionId} />
        </TabsContent>

        <TabsContent value="competitors" className="space-y-4">
          <CompetitorsTab projectId={projectId} sessionId={currentSessionId} />
        </TabsContent>

        <TabsContent value="ai-assistant" className="space-y-4">
          <AIAssistantTab projectId={projectId} sessionId={currentSessionId} />
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          <ReviewExportTab projectId={projectId} sessionId={currentSessionId} />
        </TabsContent>
      </Tabs>

      {/* Quick Navigation Footer */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium">Next Steps:</span>
              <span className="text-muted-foreground ml-2">
                {getOverallProgress() < 50 
                  ? "Continue building your research foundation"
                  : getOverallProgress() < 80
                  ? "Review and validate your strategy"
                  : "Ready to proceed to patent search"
                }
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Save Session
              </Button>
              {getOverallProgress() > 70 && (
                <Button size="sm" onClick={() => onProceedToSearch?.(sessionProgress)}>
                  Proceed to Search →
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}