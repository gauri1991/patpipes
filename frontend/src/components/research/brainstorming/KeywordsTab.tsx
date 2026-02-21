'use client';

import { useState, useEffect } from 'react';
import { useBrainstorming } from '@/hooks/useBrainstorming';
import {
  Key,
  Plus,
  Search,
  Globe,
  Zap,
  Copy,
  Download,
  Upload,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronRight,
  Hash,
  Languages,
  Filter,
  Save,
  RefreshCw
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface KeywordGroup {
  id: string;
  name: string;
  keywords: string[];
  color: string;
  expanded: boolean;
}

interface KeywordsTabProps {
  projectId: string;
  sessionId: string | null;
}

interface BooleanQuery {
  id: string;
  name: string;
  query: string;
  description: string;
  groups: string[];
}

export function KeywordsTab({ projectId, sessionId }: KeywordsTabProps) {
  const {
    keywords,
    createKeyword,
    validateKeyword,
    generateKeywordsFromText,
    loading,
    error
  } = useBrainstorming(projectId);
  const [keywordGroups, setKeywordGroups] = useState<KeywordGroup[]>([]);
  const [textForExtraction, setTextForExtraction] = useState('');

  const [newKeyword, setNewKeyword] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('1');
  const [newGroupName, setNewGroupName] = useState('');
  const [booleanQueries, setBooleanQueries] = useState<BooleanQuery[]>([]);
  const [queryBuilder, setQueryBuilder] = useState({
    name: '',
    description: '',
    selectedGroups: new Set<string>(),
    operator: 'AND'
  });

  const synonymSuggestions = {
    'neural network': ['neural net', 'NN', 'artificial neural network', 'ANN', 'connectionist model'],
    'machine learning': ['ML', 'statistical learning', 'automated learning', 'computational learning'],
    'optimization': ['optimisation', 'improve*', 'enhanc*', 'optim*', 'refin*']
  };

  const multilingual = {
    'neural network': {
      'de': 'neuronales Netz',
      'fr': 'réseau neuronal',
      'ja': 'ニューラルネットワーク',
      'zh': '神经网络'
    },
    'machine learning': {
      'de': 'maschinelles Lernen',
      'fr': 'apprentissage automatique',
      'ja': '機械学習',
      'zh': '机器学习'
    }
  };

  const handleAddKeyword = async () => {
    if (!newKeyword.trim() || !sessionId) return;
    
    const selectedGroupObj = keywordGroups.find(g => g.id === selectedGroup);
    const keywordData = {
      keyword: newKeyword.trim(),
      category: selectedGroupObj?.name.toLowerCase().replace(' ', '_') || 'primary',
      generation_method: 'manual',
      keyword_group: selectedGroupObj?.name || 'Default',
      group_color: selectedGroupObj?.color || '#3B82F6'
    };

    const result = await createKeyword(keywordData);
    if (result) {
      setNewKeyword('');
      updateKeywordGroups();
    }
  };

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;

    const newGroup: KeywordGroup = {
      id: Date.now().toString(),
      name: newGroupName,
      keywords: [],
      color: 'bg-purple-100 text-purple-700',
      expanded: true
    };

    setKeywordGroups([...keywordGroups, newGroup]);
    setNewGroupName('');
  };

  // Update keyword groups from API data
  const updateKeywordGroups = () => {
    if (!keywords) return;

    const groupsMap = new Map<string, KeywordGroup>();
    
    keywords.forEach(kw => {
      const groupName = kw.keyword_group || 'Uncategorized';
      if (!groupsMap.has(groupName)) {
        groupsMap.set(groupName, {
          id: groupName.toLowerCase().replace(/\s+/g, '-'),
          name: groupName,
          keywords: [],
          color: kw.group_color ? `bg-${kw.group_color.replace('#', '')}-100 text-${kw.group_color.replace('#', '')}-700` : 'bg-gray-100 text-gray-700',
          expanded: true
        });
      }
      groupsMap.get(groupName)!.keywords.push(kw.keyword);
    });

    setKeywordGroups(Array.from(groupsMap.values()));
    if (groupsMap.size > 0) {
      setSelectedGroup(Array.from(groupsMap.keys())[0].toLowerCase().replace(/\s+/g, '-'));
    }
  };

  useEffect(() => {
    updateKeywordGroups();
  }, [keywords]);

  const handleRemoveKeyword = (groupId: string, keyword: string) => {
    // For now, just update local state - in production you'd want to delete from API
    const updatedGroups = keywordGroups.map(group => 
      group.id === groupId 
        ? { ...group, keywords: group.keywords.filter(k => k !== keyword) }
        : group
    );
    setKeywordGroups(updatedGroups);
  };

  const handleExtractKeywords = async () => {
    if (!textForExtraction.trim() || !sessionId) return;
    
    const result = await generateKeywordsFromText(textForExtraction);
    if (result && result.length > 0) {
      setTextForExtraction('');
      updateKeywordGroups();
    }
  };

  const handleValidateKeyword = async (keyword: string) => {
    const keywordObj = keywords?.find(kw => kw.keyword === keyword);
    if (keywordObj) {
      await validateKeyword(keywordObj.id);
    }
  };

  const handleToggleGroup = (groupId: string) => {
    const updatedGroups = keywordGroups.map(group =>
      group.id === groupId ? { ...group, expanded: !group.expanded } : group
    );
    setKeywordGroups(updatedGroups);
  };

  const generateSynonyms = (keyword: string) => {
    return synonymSuggestions[keyword as keyof typeof synonymSuggestions] || [];
  };

  const generateBooleanQuery = () => {
    const selectedGroupIds = Array.from(queryBuilder.selectedGroups);
    const selectedGroupsData = keywordGroups.filter(g => selectedGroupIds.includes(g.id));
    
    const groupQueries = selectedGroupsData.map(group => {
      if (group.keywords.length === 1) {
        return group.keywords[0];
      }
      return `(${group.keywords.join(' OR ')})`;
    });

    const operator = queryBuilder.operator === 'AND' ? ' AND ' : ' OR ';
    return groupQueries.join(operator);
  };

  const handleSaveBooleanQuery = () => {
    if (!queryBuilder.name.trim() || queryBuilder.selectedGroups.size === 0) return;

    const newQuery: BooleanQuery = {
      id: Date.now().toString(),
      name: queryBuilder.name,
      query: generateBooleanQuery(),
      description: queryBuilder.description,
      groups: Array.from(queryBuilder.selectedGroups)
    };

    setBooleanQueries([...booleanQueries, newQuery]);
    setQueryBuilder({
      name: '',
      description: '',
      selectedGroups: new Set(),
      operator: 'AND'
    });
  };

  if (!sessionId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Session</h3>
          <p className="text-muted-foreground">
            Please select or create a brainstorming session to manage keywords.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-800 text-sm">Error loading keywords: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="builder" className="space-y-4">
        <TabsList>
          <TabsTrigger value="builder">Keyword Builder</TabsTrigger>
          <TabsTrigger value="extraction">Text Extraction</TabsTrigger>
          <TabsTrigger value="boolean">Boolean Queries</TabsTrigger>
          <TabsTrigger value="expansion">Expansion Tools</TabsTrigger>
          <TabsTrigger value="saved">Saved Sets</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-4">
          {/* Add Keywords Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Add Keywords</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Keyword</Label>
                  <Input
                    placeholder="Enter keyword..."
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddKeyword();
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Group</Label>
                  <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {keywordGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button onClick={handleAddKeyword} className="w-full" disabled={loading || !sessionId}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3">
                  <Input
                    placeholder="New group name..."
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                </div>
                <Button variant="outline" onClick={handleAddGroup}>
                  Create Group
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Keyword Groups */}
          <div className="space-y-3">
            {keywordGroups.map((group) => (
              <Card key={group.id}>
                <Collapsible
                  open={group.expanded}
                  onOpenChange={() => handleToggleGroup(group.id)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {group.expanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <Badge className={group.color}>{group.name}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {group.keywords.length} keywords
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost">
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {group.keywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="group">
                            <Hash className="h-3 w-3 mr-1" />
                            {keyword}
                            <button
                              className="ml-1 opacity-0 group-hover:opacity-100 text-xs hover:bg-destructive hover:text-destructive-foreground rounded px-1"
                              onClick={() => handleRemoveKeyword(group.id, keyword)}
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="extraction" className="space-y-4">
          {/* Text Extraction */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Extract Keywords from Text</CardTitle>
              <CardDescription>
                Paste patent text, research papers, or technical documents to automatically extract keywords
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Text to Analyze</Label>
                <textarea
                  className="w-full h-32 p-3 border rounded-md resize-none"
                  placeholder="Paste your text here (patent abstracts, technical descriptions, etc.)"
                  value={textForExtraction}
                  onChange={(e) => setTextForExtraction(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleExtractKeywords} 
                  disabled={!textForExtraction.trim() || loading || !sessionId}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {loading ? 'Extracting...' : 'Extract Keywords'}
                </Button>
                <Button variant="outline" onClick={() => setTextForExtraction('')}>
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recently Extracted Keywords */}
          {keywords && keywords.filter(kw => kw.generation_method === 'extracted').length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recently Extracted Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {keywords
                    .filter(kw => kw.generation_method === 'extracted')
                    .slice(0, 20)
                    .map((keyword, index) => (
                      <Badge 
                        key={index} 
                        variant={keyword.is_validated ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => handleValidateKeyword(keyword.keyword)}
                      >
                        {keyword.keyword}
                        {keyword.is_validated && <span className="ml-1">✓</span>}
                      </Badge>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="boolean" className="space-y-4">
          {/* Query Builder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Boolean Query Builder</CardTitle>
              <CardDescription>
                Combine keyword groups using Boolean operators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Query Name</Label>
                  <Input
                    placeholder="My search query..."
                    value={queryBuilder.name}
                    onChange={(e) => setQueryBuilder({ ...queryBuilder, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Operator</Label>
                  <Select
                    value={queryBuilder.operator}
                    onValueChange={(value) => setQueryBuilder({ ...queryBuilder, operator: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">AND (all groups)</SelectItem>
                      <SelectItem value="OR">OR (any group)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Brief description of this query..."
                  value={queryBuilder.description}
                  onChange={(e) => setQueryBuilder({ ...queryBuilder, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Select Groups</Label>
                <div className="grid grid-cols-2 gap-2">
                  {keywordGroups.map((group) => (
                    <div key={group.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={group.id}
                        checked={queryBuilder.selectedGroups.has(group.id)}
                        onCheckedChange={(checked) => {
                          const newSelected = new Set(queryBuilder.selectedGroups);
                          if (checked) {
                            newSelected.add(group.id);
                          } else {
                            newSelected.delete(group.id);
                          }
                          setQueryBuilder({ ...queryBuilder, selectedGroups: newSelected });
                        }}
                      />
                      <label htmlFor={group.id} className="text-sm">
                        {group.name} ({group.keywords.length})
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {queryBuilder.selectedGroups.size > 0 && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="p-3 bg-muted rounded border font-mono text-sm">
                    {generateBooleanQuery()}
                  </div>
                </div>
              )}

              <Button onClick={handleSaveBooleanQuery}>
                <Save className="h-4 w-4 mr-2" />
                Save Query
              </Button>
            </CardContent>
          </Card>

          {/* Saved Queries */}
          {booleanQueries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Saved Boolean Queries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {booleanQueries.map((query) => (
                    <div key={query.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{query.name}</h4>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost">
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {query.description && (
                        <p className="text-sm text-muted-foreground">{query.description}</p>
                      )}
                      <div className="font-mono text-sm bg-muted p-2 rounded">
                        {query.query}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="expansion" className="space-y-4">
          {/* Synonym Generator */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Synonym Generator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(synonymSuggestions).map(([keyword, synonyms]) => (
                <div key={keyword} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge>{keyword}</Badge>
                    <span className="text-sm text-muted-foreground">→</span>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-4">
                    {synonyms.map((synonym, idx) => (
                      <Badge key={idx} variant="outline" className="cursor-pointer hover:bg-secondary">
                        {synonym}
                        <button className="ml-1 text-xs">+</button>
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Multilingual Expansion */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Languages className="h-4 w-4" />
                Multilingual Keywords
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(multilingual).map(([keyword, translations]) => (
                <div key={keyword} className="space-y-2">
                  <Badge>{keyword}</Badge>
                  <div className="grid grid-cols-2 gap-2 ml-4">
                    {Object.entries(translations).map(([lang, translation]) => (
                      <div key={lang} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="w-8">
                          {lang.toUpperCase()}
                        </Badge>
                        <span>{translation}</span>
                        <Button size="sm" variant="ghost">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          {/* Import/Export */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Import/Export Keywords</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export All
                </Button>
                <Button variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{keywordGroups.length}</p>
                  <p className="text-sm text-muted-foreground">Groups</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{keywords?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Keywords</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{keywords?.filter(kw => kw.is_validated).length || 0}</p>
                  <p className="text-sm text-muted-foreground">Validated</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{booleanQueries.length}</p>
                  <p className="text-sm text-muted-foreground">Queries</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}