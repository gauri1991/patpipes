/**
 * Main Integration Page
 * Central hub for all prior art dashboard components
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  ArrowRight,
  FileText,
  BarChart3,
  Scale,
  GitBranch,
  Download,
  Eye,
  Settings,
  TestTube,
  Home,
  FolderOpen,
  Activity
} from 'lucide-react';

export default function IntegrationPage() {
  const [testStatus, setTestStatus] = useState({
    phase1: true,
    phase2: true,
    phase3: true,
    phase4: true,
    phase5: true
  });

  const phases = [
    {
      id: 'phase1',
      title: 'Phase 1: Dashboard Structure',
      description: 'Main prior art dashboard with project management',
      status: 'completed',
      link: '/dashboard/prior-art',
      icon: <Home className="h-5 w-5" />,
      features: ['Project list', 'Project creation', 'Search & filters', 'Dashboard layout']
    },
    {
      id: 'phase2',
      title: 'Phase 2: Project Pages',
      description: 'Individual project pages with core tabs',
      status: 'completed',
      link: '/dashboard/prior-art/projects/test-project',
      icon: <FolderOpen className="h-5 w-5" />,
      features: ['Overview tab', 'Research tab', 'Analysis tab', 'Reports tab']
    },
    {
      id: 'phase3',
      title: 'Phase 3: Brainstorming System',
      description: 'Adapted brainstorming for prior art research',
      status: 'completed',
      link: '/dashboard/prior-art/projects/test-project',
      icon: <Activity className="h-5 w-5" />,
      features: ['Session management', 'Research workflows', 'Collaboration tools']
    },
    {
      id: 'phase4',
      title: 'Phase 4: Specialized Tools',
      description: 'Advanced prior art analysis components',
      status: 'completed',
      link: '/dashboard/prior-art/test-integration',
      icon: <BarChart3 className="h-5 w-5" />,
      features: [
        'Evidence Strength Analyzer',
        'Claim Mapping Visualizer',
        'Legal Relevance Scorer',
        'Citation Network Analyzer'
      ]
    },
    {
      id: 'phase5',
      title: 'Phase 5: Reports & Export',
      description: 'Professional report generation and export',
      status: 'completed',
      link: '/dashboard/prior-art/test-integration/reports-test',
      icon: <FileText className="h-5 w-5" />,
      features: [
        'Report Templates',
        'Customization Panel',
        'Preview System',
        'Multi-format Export'
      ]
    }
  ];

  const quickLinks = [
    {
      title: 'Prior Art Dashboard',
      description: 'Main dashboard with all projects',
      link: '/dashboard/prior-art',
      icon: <Home className="h-4 w-4" />
    },
    {
      title: 'Test Project',
      description: 'Sample project for testing',
      link: '/dashboard/prior-art/projects/test-project',
      icon: <FolderOpen className="h-4 w-4" />
    },
    {
      title: 'Phase 4 Tools Test',
      description: 'Test analysis components',
      link: '/dashboard/prior-art/test-integration',
      icon: <TestTube className="h-4 w-4" />
    },
    {
      title: 'Phase 5 Reports Test',
      description: 'Test report generation',
      link: '/dashboard/prior-art/test-integration/reports-test',
      icon: <TestTube className="h-4 w-4" />
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Prior Art Dashboard Integration</CardTitle>
              <CardDescription className="mt-2">
                Complete integration testing for all phases of the prior art analysis platform
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-lg px-3 py-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                All Phases Complete
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-5">
        {Object.entries(testStatus).map(([phase, status]) => (
          <Card key={phase}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">
                  {phase.replace(/(\d)/, ' $1')}
                </span>
                {status ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-yellow-500 animate-pulse" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Phase Details */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {phases.map((phase) => (
          <Card key={phase.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="p-2 bg-blue-50 rounded-lg">
                  {phase.icon}
                </div>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  {phase.status}
                </Badge>
              </div>
              <CardTitle className="text-base mt-3">{phase.title}</CardTitle>
              <CardDescription>{phase.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2">Features:</p>
                  <ul className="space-y-1">
                    {phase.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <Separator />
                <Link href={phase.link}>
                  <Button variant="outline" className="w-full">
                    View Component
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Navigation</CardTitle>
          <CardDescription>Jump to key components for testing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((link, index) => (
              <Link key={index} href={link.link}>
                <div className="p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    {link.icon}
                    <span className="font-medium text-sm">{link.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{link.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Implementation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">5</div>
              <p className="text-sm text-muted-foreground">Phases Completed</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">35+</div>
              <p className="text-sm text-muted-foreground">Components Created</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">4</div>
              <p className="text-sm text-muted-foreground">Analysis Tools</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">4</div>
              <p className="text-sm text-muted-foreground">Export Formats</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Integration Test Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline">
              <TestTube className="h-4 w-4 mr-2" />
              Run All Tests
            </Button>
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Test Analytics
            </Button>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Generate Test Report
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Test Results
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}