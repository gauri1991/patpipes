'use client';

import { useState } from 'react';
import { FileText, Wand2, Search, Target, Lightbulb, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SearchTemplate {
  id: string;
  name: string;
  description: string;
  category: 'competitive' | 'landscape' | 'freedom' | 'novelty';
  keywords: string[];
  classifications?: string[];
  filters?: any;
  queryPattern: string;
}

interface StrategyTemplatesProps {
  onTemplateSelect?: (template: SearchTemplate) => void;
  onApplyTemplate?: (keywords: string[], classifications?: string[]) => void;
}

export function StrategyTemplates({ 
  onTemplateSelect,
  onApplyTemplate
}: StrategyTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const templates: SearchTemplate[] = [
    {
      id: 'competitive-analysis',
      name: 'Competitive Analysis',
      description: 'Find patents from key competitors in your technology space',
      category: 'competitive',
      keywords: ['competitor analysis', 'market research', 'patent landscape'],
      classifications: ['G06F', 'H04L'],
      filters: { dateFrom: '2020-01-01' },
      queryPattern: '(assignee:"{{competitor}}" OR inventor:"{{inventor}}") AND ({{technology_keywords}})'
    },
    {
      id: 'prior-art-search',
      name: 'Prior Art Search',
      description: 'Comprehensive search for existing prior art in your invention area',
      category: 'novelty',
      keywords: ['prior art', 'novelty search', 'patentability'],
      classifications: ['G06F', 'G06N'],
      queryPattern: '({{invention_keywords}}) AND ({{technical_features}})'
    },
    {
      id: 'technology-landscape',
      name: 'Technology Landscape',
      description: 'Broad overview of patent activity in a technology domain',
      category: 'landscape',
      keywords: ['technology trends', 'patent landscape', 'innovation analysis'],
      queryPattern: '({{technology_domain}}) AND ({{key_concepts}})'
    },
    {
      id: 'freedom-to-operate',
      name: 'Freedom to Operate',
      description: 'Identify potential patent barriers for your product or service',
      category: 'freedom',
      keywords: ['freedom to operate', 'FTO', 'clearance search'],
      filters: { status: 'active', jurisdictions: ['US', 'EP'] },
      queryPattern: '({{product_features}}) AND (status:active)'
    },
    {
      id: 'ai-ml-patents',
      name: 'AI/ML Patents',
      description: 'Artificial intelligence and machine learning patent search',
      category: 'landscape',
      keywords: ['artificial intelligence', 'machine learning', 'neural network', 'deep learning'],
      classifications: ['G06N', 'G06F15', 'G06F17'],
      queryPattern: '("artificial intelligence" OR "machine learning" OR "neural network") AND ({{application_domain}})'
    },
    {
      id: 'blockchain-crypto',
      name: 'Blockchain & Crypto',
      description: 'Blockchain and cryptocurrency technology patents',
      category: 'landscape',
      keywords: ['blockchain', 'cryptocurrency', 'distributed ledger', 'smart contract'],
      classifications: ['H04L9', 'G06F21'],
      queryPattern: '("blockchain" OR "cryptocurrency" OR "smart contract") AND ({{use_case}})'
    },
    {
      id: 'biotech-pharma',
      name: 'Biotech & Pharma',
      description: 'Biotechnology and pharmaceutical patent search',
      category: 'landscape',
      keywords: ['biotechnology', 'pharmaceutical', 'drug discovery', 'therapeutic'],
      classifications: ['A61K', 'C07D', 'C12N'],
      queryPattern: '({{compound_name}} OR {{therapeutic_target}}) AND ({{indication}})'
    },
    {
      id: 'renewable-energy',
      name: 'Renewable Energy',
      description: 'Clean energy and renewable technology patents',
      category: 'landscape',
      keywords: ['solar energy', 'wind power', 'renewable energy', 'clean technology'],
      classifications: ['H02S', 'F03D', 'H01L31'],
      queryPattern: '("solar" OR "wind" OR "renewable energy") AND ({{technology_type}})'
    }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'competitive': return <Target className="h-4 w-4" />;
      case 'landscape': return <Search className="h-4 w-4" />;
      case 'freedom': return <Zap className="h-4 w-4" />;
      case 'novelty': return <Lightbulb className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'competitive': return 'bg-red-100 text-red-700';
      case 'landscape': return 'bg-blue-100 text-blue-700';
      case 'freedom': return 'bg-yellow-100 text-yellow-700';
      case 'novelty': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const handleApplyTemplate = (template: SearchTemplate) => {
    onApplyTemplate?.(template.keywords, template.classifications);
    onTemplateSelect?.(template);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Strategy Templates</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{templates.length} templates</Badge>
                  <Badge variant="outline">Auto-populate</Badge>
                </div>
              </div>
            </div>
          </div>
          
          {/* Category Filters */}
          <div className="flex items-center gap-2 pt-4 border-t">
            <Button
              size="sm"
              variant={selectedCategory === 'all' ? 'default' : 'ghost'}
              onClick={() => setSelectedCategory('all')}
            >
              All Templates
            </Button>
            <Button
              size="sm"
              variant={selectedCategory === 'competitive' ? 'default' : 'ghost'}
              onClick={() => setSelectedCategory('competitive')}
            >
              <Target className="h-3 w-3 mr-1" />
              Competitive
            </Button>
            <Button
              size="sm"
              variant={selectedCategory === 'landscape' ? 'default' : 'ghost'}
              onClick={() => setSelectedCategory('landscape')}
            >
              <Search className="h-3 w-3 mr-1" />
              Landscape
            </Button>
            <Button
              size="sm"
              variant={selectedCategory === 'freedom' ? 'default' : 'ghost'}
              onClick={() => setSelectedCategory('freedom')}
            >
              <Zap className="h-3 w-3 mr-1" />
              Freedom
            </Button>
            <Button
              size="sm"
              variant={selectedCategory === 'novelty' ? 'default' : 'ghost'}
              onClick={() => setSelectedCategory('novelty')}
            >
              <Lightbulb className="h-3 w-3 mr-1" />
              Novelty
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(template.category)}
                      <h3 className="font-medium text-sm">{template.name}</h3>
                    </div>
                    <Badge className={getCategoryColor(template.category)}>
                      {template.category}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-3">
                    {template.description}
                  </p>
                  
                  {/* Keywords Preview */}
                  <div className="mb-3">
                    <p className="text-xs font-medium mb-1">Keywords:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.keywords.slice(0, 3).map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                      {template.keywords.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{template.keywords.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Classifications Preview */}
                  {template.classifications && (
                    <div className="mb-3">
                      <p className="text-xs font-medium mb-1">Classifications:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.classifications.map((classification, index) => (
                          <Badge key={index} variant="outline" className="text-xs font-mono">
                            {classification}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleApplyTemplate(template)}
                  >
                    <Wand2 className="h-3 w-3 mr-1" />
                    Apply Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}