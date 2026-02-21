/**
 * MPEP Checker - Patent Compliance Validation Tool
 * Validates patent applications against MPEP guidelines
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Scale,
  FileText,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  BookOpen,
  RefreshCw,
  Copy,
  ExternalLink,
  Lightbulb,
  Filter
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

// MPEP Section references and common rules
const mpepSections = {
  '2106': {
    title: 'Patent Subject Matter Eligibility',
    description: 'Guidelines for determining subject matter eligibility under 35 U.S.C. 101',
    url: 'https://www.uspto.gov/web/offices/pac/mpep/s2106.html'
  },
  '2111': {
    title: 'Claim Interpretation',
    description: 'Broadest reasonable interpretation of claims',
    url: 'https://www.uspto.gov/web/offices/pac/mpep/s2111.html'
  },
  '2131': {
    title: 'Anticipation - 35 U.S.C. 102',
    description: 'Requirements for anticipation rejections',
    url: 'https://www.uspto.gov/web/offices/pac/mpep/s2131.html'
  },
  '2141': {
    title: 'Obviousness - 35 U.S.C. 103',
    description: 'Guidelines for obviousness analysis',
    url: 'https://www.uspto.gov/web/offices/pac/mpep/s2141.html'
  },
  '2161': {
    title: 'Written Description - 35 U.S.C. 112(a)',
    description: 'Written description requirement analysis',
    url: 'https://www.uspto.gov/web/offices/pac/mpep/s2161.html'
  },
  '2163': {
    title: 'Enablement - 35 U.S.C. 112(a)',
    description: 'Enablement requirement for patent claims',
    url: 'https://www.uspto.gov/web/offices/pac/mpep/s2163.html'
  },
  '2171': {
    title: 'Claim Definiteness - 35 U.S.C. 112(b)',
    description: 'Requirements for definite claim language',
    url: 'https://www.uspto.gov/web/offices/pac/mpep/s2171.html'
  },
  '2173': {
    title: 'Claims Must Particularly Point Out and Distinctly Claim',
    description: 'Indefiniteness rejections under 35 U.S.C. 112(b)',
    url: 'https://www.uspto.gov/web/offices/pac/mpep/s2173.html'
  }
};

interface ComplianceIssue {
  id: string;
  section: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  location?: string;
  suggestion?: string;
  mpepReference?: string;
}

interface ComplianceResult {
  overallScore: number;
  issues: ComplianceIssue[];
  sectionScores: Record<string, number>;
}

export default function MPEPCheckerPage() {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('checker');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [complianceResult, setComplianceResult] = useState<ComplianceResult | null>(null);

  // Analyze text for MPEP compliance
  const analyzeCompliance = async () => {
    if (!inputText.trim()) return;

    setIsAnalyzing(true);

    // Simulate analysis (in a real implementation, this would call a backend API)
    await new Promise(resolve => setTimeout(resolve, 2000));

    const issues: ComplianceIssue[] = [];

    // Check for common compliance issues
    const text = inputText.toLowerCase();

    // 35 U.S.C. 112(b) - Indefinite terms
    const indefiniteTerms = ['approximately', 'substantially', 'about', 'generally', 'preferably'];
    indefiniteTerms.forEach(term => {
      if (text.includes(term)) {
        issues.push({
          id: `indef-${term}`,
          section: '2173',
          severity: 'warning',
          title: `Potentially indefinite term: "${term}"`,
          description: `The term "${term}" may be considered indefinite under 35 U.S.C. 112(b) unless properly defined in the specification.`,
          suggestion: `Consider defining "${term}" with specific parameters or ranges, or remove if not essential.`,
          mpepReference: 'MPEP § 2173.05(b)'
        });
      }
    });

    // Check for means-plus-function language
    if (text.includes('means for')) {
      issues.push({
        id: 'means-plus-function',
        section: '2181',
        severity: 'info',
        title: 'Means-plus-function claim language detected',
        description: 'Claims containing "means for" language will be interpreted under 35 U.S.C. 112(f).',
        suggestion: 'Ensure the specification provides adequate structure, material, or acts for performing the claimed function.',
        mpepReference: 'MPEP § 2181'
      });
    }

    // Check for antecedent basis issues
    const thePattern = /the\s+([a-z]+(?:\s+[a-z]+)?)/gi;
    const aAnPattern = /\ba(?:n)?\s+([a-z]+(?:\s+[a-z]+)?)/gi;

    const introducedTerms = new Set<string>();
    let match;

    while ((match = aAnPattern.exec(text)) !== null) {
      introducedTerms.add(match[1].toLowerCase());
    }

    while ((match = thePattern.exec(text)) !== null) {
      const term = match[1].toLowerCase();
      if (!introducedTerms.has(term) && term.length > 3) {
        // Only flag if not a common word
        const commonWords = ['same', 'first', 'second', 'third', 'following', 'above', 'below', 'present', 'invention'];
        if (!commonWords.includes(term)) {
          issues.push({
            id: `antecedent-${term}`,
            section: '2173',
            severity: 'error',
            title: `Missing antecedent basis for "the ${term}"`,
            description: `The term "the ${term}" lacks proper antecedent basis. All definite articles should refer to previously introduced elements.`,
            suggestion: `Introduce the element with "a" or "an" before referring to it with "the" or "said".`,
            mpepReference: 'MPEP § 2173.05(e)'
          });
        }
      }
    }

    // Check for 35 U.S.C. 101 issues
    const abstractIdeas = ['calculating', 'determining', 'comparing', 'analyzing', 'processing data'];
    abstractIdeas.forEach(term => {
      if (text.includes(term) && !text.includes('processor') && !text.includes('computer') && !text.includes('device')) {
        issues.push({
          id: `abstract-${term}`,
          section: '2106',
          severity: 'warning',
          title: 'Potential abstract idea without technical integration',
          description: `Claims involving "${term}" may be considered abstract ideas under Alice/Mayo. Ensure integration with a practical application.`,
          suggestion: 'Consider adding specific technical elements or improvements to demonstrate patent eligibility.',
          mpepReference: 'MPEP § 2106.04(a)'
        });
      }
    });

    // Check for negative claim limitations
    if (text.includes('not') || text.includes('without') || text.includes('excluding')) {
      issues.push({
        id: 'negative-limitation',
        section: '2173',
        severity: 'info',
        title: 'Negative limitation detected',
        description: 'Negative limitations may require additional support in the specification.',
        suggestion: 'Verify that the specification provides adequate support for any negative limitations.',
        mpepReference: 'MPEP § 2173.05(i)'
      });
    }

    // Check for new matter concerns
    if (text.includes('amendment') || text.includes('new claim')) {
      issues.push({
        id: 'new-matter-check',
        section: '2163',
        severity: 'info',
        title: 'New matter review recommended',
        description: 'When adding or amending claims, ensure all new limitations have support in the original disclosure.',
        suggestion: 'Review the specification to confirm support for any new claim limitations.',
        mpepReference: 'MPEP § 2163'
      });
    }

    // Calculate scores
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;

    const overallScore = Math.max(0, 100 - (errorCount * 15) - (warningCount * 5));

    const sectionScores: Record<string, number> = {
      '2106': 100 - (issues.filter(i => i.section === '2106').length * 20),
      '2173': 100 - (issues.filter(i => i.section === '2173').length * 15),
      '2163': 100 - (issues.filter(i => i.section === '2163').length * 10),
      '2181': 100 - (issues.filter(i => i.section === '2181').length * 5)
    };

    setComplianceResult({
      overallScore,
      issues,
      sectionScores
    });

    setIsAnalyzing(false);
  };

  // Filter issues based on severity
  const filteredIssues = complianceResult?.issues.filter(issue => {
    if (severityFilter !== 'all' && issue.severity !== severityFilter) return false;
    if (searchQuery && !issue.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }) || [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <XCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'info': return <Info className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/prosecution">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Prosecution
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Scale className="h-6 w-6 text-purple-500" />
            MPEP Compliance Checker
          </h1>
          <p className="text-gray-600">
            Validate patent applications against USPTO MPEP guidelines
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="checker">
            <Search className="h-4 w-4 mr-2" />
            Compliance Checker
          </TabsTrigger>
          <TabsTrigger value="reference">
            <BookOpen className="h-4 w-4 mr-2" />
            MPEP Reference
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checker" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Patent Text Input</CardTitle>
                <CardDescription>
                  Paste your patent claims or specification text for compliance analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Paste your patent claims or specification text here...

Example:
1. A method comprising:
   receiving input data from a sensor;
   processing the data using a machine learning algorithm;
   outputting a prediction based on the processed data."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {inputText.length} characters
                  </span>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setInputText('')}
                      disabled={!inputText}
                    >
                      Clear
                    </Button>
                    <Button
                      onClick={analyzeCompliance}
                      disabled={!inputText.trim() || isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Check Compliance
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Compliance Results</CardTitle>
                <CardDescription>
                  Issues and recommendations based on MPEP guidelines
                </CardDescription>
              </CardHeader>
              <CardContent>
                {complianceResult ? (
                  <div className="space-y-4">
                    {/* Overall Score */}
                    <div className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Overall Compliance Score</span>
                        <span className={`text-2xl font-bold ${
                          complianceResult.overallScore >= 80 ? 'text-green-600' :
                          complianceResult.overallScore >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {complianceResult.overallScore}%
                        </span>
                      </div>
                      <Progress value={complianceResult.overallScore} className="h-2" />
                    </div>

                    {/* Issue Summary */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-3 bg-red-50 rounded-lg text-center">
                        <div className="text-lg font-bold text-red-600">
                          {complianceResult.issues.filter(i => i.severity === 'error').length}
                        </div>
                        <div className="text-xs text-red-700">Errors</div>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-lg text-center">
                        <div className="text-lg font-bold text-yellow-600">
                          {complianceResult.issues.filter(i => i.severity === 'warning').length}
                        </div>
                        <div className="text-xs text-yellow-700">Warnings</div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {complianceResult.issues.filter(i => i.severity === 'info').length}
                        </div>
                        <div className="text-xs text-blue-700">Info</div>
                      </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder="Search issues..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <Select
                        value={severityFilter}
                        onValueChange={(v) => setSeverityFilter(v as typeof severityFilter)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="error">Errors</SelectItem>
                          <SelectItem value="warning">Warnings</SelectItem>
                          <SelectItem value="info">Info</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Issues List */}
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-3">
                        {filteredIssues.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                            <p>No issues found matching your criteria</p>
                          </div>
                        ) : (
                          filteredIssues.map((issue) => (
                            <div
                              key={issue.id}
                              className={`p-3 border rounded-lg ${getSeverityColor(issue.severity)}`}
                            >
                              <div className="flex items-start gap-2">
                                {getSeverityIcon(issue.severity)}
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-sm">{issue.title}</span>
                                    <Badge variant="outline" className="text-xs">
                                      MPEP § {issue.section}
                                    </Badge>
                                  </div>
                                  <p className="text-xs mt-1 opacity-80">{issue.description}</p>
                                  {issue.suggestion && (
                                    <div className="mt-2 p-2 bg-white/50 rounded text-xs">
                                      <Lightbulb className="h-3 w-3 inline mr-1" />
                                      {issue.suggestion}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="text-center py-16 text-gray-500">
                    <Scale className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p>Enter patent text and click "Check Compliance" to analyze</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reference" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">MPEP Quick Reference</CardTitle>
              <CardDescription>
                Common MPEP sections relevant to patent prosecution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(mpepSections).map(([section, info]) => (
                  <div key={section} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">§ {section}</Badge>
                        <span className="font-medium">{info.title}</span>
                      </div>
                      <a
                        href={info.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        View
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{info.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
