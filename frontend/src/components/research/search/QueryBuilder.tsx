'use client';

import { useState, useEffect } from 'react';
import { Search, Wand2, Code, Play, Plus, Key, Trash2, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBrainstorming } from '@/hooks/useBrainstorming';

interface QueryBuilderProps {
  projectId: string;
  sessionId?: string;
  onQueryGenerated?: (query: any) => void;
  onExecuteSearch?: (query: any) => void;
}

export function QueryBuilder({ 
  projectId, 
  sessionId,
  onQueryGenerated,
  onExecuteSearch
}: QueryBuilderProps) {
  const { keywords: brainstormingKeywords, strategies, loading } = useBrainstorming(projectId);
  const [queryMode, setQueryMode] = useState<'simple' | 'advanced' | 'brainstorming'>('simple');
  const [generatedQuery, setGeneratedQuery] = useState('');
  const [keywords, setKeywords] = useState<string[]>(['']);
  const [searchOperator, setSearchOperator] = useState<'AND' | 'OR'>('AND');
  const [classifications, setClassifications] = useState<string[]>([]);
  const [selectedClassification, setSelectedClassification] = useState('');

  const addKeyword = () => {
    setKeywords([...keywords, '']);
  };

  const updateKeyword = (index: number, value: string) => {
    const updated = [...keywords];
    updated[index] = value;
    setKeywords(updated);
  };

  const removeKeyword = (index: number) => {
    if (keywords.length > 1) {
      const updated = keywords.filter((_, i) => i !== index);
      setKeywords(updated);
    }
  };

  const generateQueryFromKeywords = () => {
    const validKeywords = keywords.filter(k => k.trim());
    if (validKeywords.length === 0) return '';
    
    if (searchOperator === 'AND') {
      return validKeywords.map(k => `"${k}"`).join(' AND ');
    } else {
      return validKeywords.map(k => `"${k}"`).join(' OR ');
    }
  };

  const handleGenerateQuery = () => {
    const query = generateQueryFromKeywords();
    setGeneratedQuery(query);
    
    // Include brainstorming session data in query context
    const queryWithContext = {
      query,
      keywords: keywords.filter(k => k.trim()),
      classifications,
      searchOperator,
      sessionContext: sessionId ? {
        sessionId,
        projectId,
        brainstormingKeywords: brainstormingKeywords?.map(kw => kw.keyword) || []
      } : null
    };
    
    onQueryGenerated?.(queryWithContext);
  };

  const loadBrainstormingKeywords = () => {
    if (brainstormingKeywords && brainstormingKeywords.length > 0) {
      const keywordStrings = brainstormingKeywords.map(kw => kw.keyword).slice(0, 10);
      setKeywords(keywordStrings.length > 0 ? keywordStrings : ['']);
    }
  };

  const addClassification = () => {
    if (selectedClassification.trim() && !classifications.includes(selectedClassification)) {
      setClassifications([...classifications, selectedClassification]);
      setSelectedClassification('');
    }
  };

  const removeClassification = (classification: string) => {
    setClassifications(classifications.filter(c => c !== classification));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg">
                <Wand2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Query Builder</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{queryMode} mode</Badge>
                  {generatedQuery && <Badge variant="outline">Query ready</Badge>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Code className="h-4 w-4 mr-1" />
                Preview
              </Button>
              <Button 
                size="sm"
                onClick={() => {
                  const query = generateQueryFromKeywords();
                  const searchData = {
                    query,
                    keywords: keywords.filter(k => k.trim()),
                    classifications,
                    searchOperator,
                    sessionContext: sessionId ? {
                      sessionId,
                      projectId,
                      brainstormingKeywords: brainstormingKeywords?.map(kw => kw.keyword) || []
                    } : null
                  };
                  onExecuteSearch?.(searchData);
                }}
                disabled={keywords.filter(k => k.trim()).length === 0}
              >
                <Play className="h-4 w-4 mr-1" />
                Execute
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={queryMode} onValueChange={(value: any) => setQueryMode(value)}>
            <TabsList>
              <TabsTrigger value="simple">Simple</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="brainstorming">From Brainstorming</TabsTrigger>
            </TabsList>

            <TabsContent value="simple" className="mt-4">
              <div className="space-y-4">
                {/* Keywords Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Key className="h-4 w-4" />
                    <Label className="font-medium">Keywords</Label>
                  </div>
                  <div className="space-y-2">
                    {keywords.map((keyword, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          placeholder="Enter keyword..."
                          value={keyword}
                          onChange={(e) => updateKeyword(index, e.target.value)}
                          className="flex-1"
                        />
                        {keywords.length > 1 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeKeyword(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={addKeyword}
                      className="w-full"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Keyword
                    </Button>
                  </div>
                </div>

                {/* Search Operator */}
                <div>
                  <Label className="font-medium mb-2 block">Search Logic</Label>
                  <Select value={searchOperator} onValueChange={(value: any) => setSearchOperator(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">AND (all keywords)</SelectItem>
                      <SelectItem value="OR">OR (any keyword)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Classifications Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-4 w-4" />
                    <Label className="font-medium">Patent Classifications</Label>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="e.g., H04L, G06F, A61B"
                        value={selectedClassification}
                        onChange={(e) => setSelectedClassification(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addClassification()}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={addClassification}
                        disabled={!selectedClassification.trim()}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {classifications.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {classifications.map((classification, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="text-xs cursor-pointer"
                            onClick={() => removeClassification(classification)}
                          >
                            {classification} ×
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Query Preview */}
                <div>
                  <Label className="font-medium mb-2 block">Generated Query</Label>
                  <div className="p-3 bg-muted rounded border font-mono text-sm min-h-[40px]">
                    {generateQueryFromKeywords() || 'Enter keywords to see query preview'}
                  </div>
                  <Button 
                    size="sm" 
                    className="mt-2"
                    onClick={handleGenerateQuery}
                    disabled={keywords.filter(k => k.trim()).length === 0}
                  >
                    Generate Query
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced">
              <div className="text-center py-8 text-muted-foreground">
                Advanced query builder coming soon
              </div>
            </TabsContent>

            <TabsContent value="brainstorming">
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Loading brainstorming data...
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Available Keywords from Session</Label>
                      <Badge variant="secondary">
                        {brainstormingKeywords?.length || 0} keywords
                      </Badge>
                    </div>
                    
                    {brainstormingKeywords && brainstormingKeywords.length > 0 ? (
                      <div>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {brainstormingKeywords.slice(0, 15).map((kw, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {kw.keyword}
                            </Badge>
                          ))}
                          {brainstormingKeywords.length > 15 && (
                            <Badge variant="secondary" className="text-xs">
                              +{brainstormingKeywords.length - 15} more
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={loadBrainstormingKeywords}
                            className="flex-1"
                          >
                            <Key className="h-3 w-3 mr-1" />
                            Load Keywords
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              loadBrainstormingKeywords();
                              const query = brainstormingKeywords?.map(kw => `"${kw.keyword}"`).join(' OR ') || '';
                              if (query) {
                                const searchData = {
                                  query,
                                  keywords: brainstormingKeywords?.map(kw => kw.keyword) || [],
                                  classifications,
                                  searchOperator: 'OR',
                                  sessionContext: sessionId ? {
                                    sessionId,
                                    projectId,
                                    brainstormingKeywords: brainstormingKeywords?.map(kw => kw.keyword) || []
                                  } : null
                                };
                                onExecuteSearch?.(searchData);
                              }
                            }}
                            disabled={!brainstormingKeywords || brainstormingKeywords.length === 0}
                          >
                            Execute
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        No keywords found in brainstorming session.
                        {sessionId ? ' Generate keywords first.' : ' Select a session first.'}
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}