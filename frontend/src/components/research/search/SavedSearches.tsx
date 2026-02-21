'use client';

import { useState, useEffect } from 'react';
import { Bookmark, Search, Trash2, Edit3, Play, Calendar, Tag, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  query: string;
  filters?: any;
  created_date: string;
  last_executed?: string;
  results_count?: number;
  is_favorite?: boolean;
  tags?: string[];
}

interface SavedSearchesProps {
  projectId: string;
  sessionId?: string;
  onSearchSelect?: (search: SavedSearch) => void;
  onExecuteSearch?: (query: string, filters?: any) => void;
}

export function SavedSearches({ 
  projectId, 
  sessionId,
  onSearchSelect,
  onExecuteSearch
}: SavedSearchesProps) {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [newSearchName, setNewSearchName] = useState('');
  const [newSearchDescription, setNewSearchDescription] = useState('');
  const [currentQuery, setCurrentQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    setSavedSearches([
      {
        id: '1',
        name: 'AI Patents 2024',
        description: 'Machine learning and AI patents from 2024',
        query: '"artificial intelligence" OR "machine learning" OR "neural network"',
        filters: { dateFrom: '2024-01-01', jurisdictions: ['US', 'EP'] },
        created_date: '2024-12-01',
        last_executed: '2024-12-10',
        results_count: 1247,
        is_favorite: true,
        tags: ['AI', 'machine learning']
      },
      {
        id: '2', 
        name: 'Battery Technology',
        description: 'Lithium-ion battery innovations',
        query: '"lithium ion battery" OR "battery cell" OR "energy storage"',
        filters: { jurisdictions: ['US', 'CN', 'JP'] },
        created_date: '2024-11-15',
        last_executed: '2024-11-20',
        results_count: 892,
        is_favorite: false,
        tags: ['battery', 'energy']
      }
    ]);
  }, [projectId, sessionId]);

  const handleSaveCurrentSearch = () => {
    if (!newSearchName.trim() || !currentQuery.trim()) return;

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: newSearchName.trim(),
      description: newSearchDescription.trim() || undefined,
      query: currentQuery,
      created_date: new Date().toISOString().split('T')[0],
      is_favorite: false,
      tags: []
    };

    setSavedSearches(prev => [newSearch, ...prev]);
    setNewSearchName('');
    setNewSearchDescription('');
    setCurrentQuery('');
    setShowSaveDialog(false);
  };

  const handleDeleteSearch = (searchId: string) => {
    setSavedSearches(prev => prev.filter(s => s.id !== searchId));
  };

  const handleToggleFavorite = (searchId: string) => {
    setSavedSearches(prev => 
      prev.map(search => 
        search.id === searchId 
          ? { ...search, is_favorite: !search.is_favorite }
          : search
      )
    );
  };

  const handleExecuteSearch = (search: SavedSearch) => {
    onExecuteSearch?.(search.query, search.filters);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                <Bookmark className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Saved Searches</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{savedSearches.length} saved</Badge>
                  <Badge variant="outline">
                    {savedSearches.filter(s => s.is_favorite).length} favorites
                  </Badge>
                </div>
              </div>
            </div>
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Bookmark className="h-4 w-4 mr-1" />
                  Save Search
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Current Search</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Search Name*</Label>
                    <Input
                      placeholder="Enter search name..."
                      value={newSearchName}
                      onChange={(e) => setNewSearchName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      placeholder="Optional description..."
                      value={newSearchDescription}
                      onChange={(e) => setNewSearchDescription(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Query</Label>
                    <Input
                      placeholder="Enter search query..."
                      value={currentQuery}
                      onChange={(e) => setCurrentQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSaveCurrentSearch}
                      disabled={!newSearchName.trim() || !currentQuery.trim()}
                    >
                      Save Search
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {savedSearches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bookmark className="h-12 w-12 mx-auto mb-4" />
              <p>No saved searches yet</p>
              <p className="text-sm">Save your searches for easy access later</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedSearches.map((search) => (
                <Card key={search.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-sm">{search.name}</h3>
                          {search.is_favorite && (
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          )}
                          {search.tags?.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        {search.description && (
                          <p className="text-xs text-muted-foreground mb-2">
                            {search.description}
                          </p>
                        )}
                        
                        <div className="bg-muted rounded p-2 mb-2">
                          <code className="text-xs text-muted-foreground">{search.query}</code>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Created: {new Date(search.created_date).toLocaleDateString()}
                          </span>
                          {search.last_executed && (
                            <span className="flex items-center gap-1">
                              <Search className="h-3 w-3" />
                              Last run: {new Date(search.last_executed).toLocaleDateString()}
                            </span>
                          )}
                          {search.results_count && (
                            <Badge variant="secondary" className="text-xs">
                              {search.results_count.toLocaleString()} results
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 ml-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleFavorite(search.id)}
                          className="h-7 w-7 p-0"
                        >
                          <Star className={`h-3 w-3 ${search.is_favorite ? 'text-yellow-500 fill-current' : ''}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleExecuteSearch(search)}
                          className="h-7 w-7 p-0"
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onSearchSelect?.(search)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteSearch(search.id)}
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}