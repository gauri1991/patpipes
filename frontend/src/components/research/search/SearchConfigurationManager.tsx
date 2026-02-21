'use client';

import { useState } from 'react';
import { Save, Settings, Download, Upload, Copy, Trash2, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSearchConfiguration } from '@/hooks/useSearchConfigurationStorage';

interface SearchConfigurationManagerProps {
  projectId: string;
  sessionId?: string;
  currentQuery?: any;
  currentFilters?: any;
  onLoadConfiguration?: (config: any) => void;
}

export function SearchConfigurationManager({
  projectId,
  sessionId,
  currentQuery,
  currentFilters,
  onLoadConfiguration
}: SearchConfigurationManagerProps) {
  const {
    configurations,
    currentConfig,
    saveConfiguration,
    loadConfiguration,
    deleteConfiguration,
    hasConfigurations
  } = useSearchConfiguration(projectId, sessionId);

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [configName, setConfigName] = useState('');
  const [configDescription, setConfigDescription] = useState('');

  const handleSaveConfiguration = async () => {
    if (!configName.trim() || !currentQuery) {
      return;
    }

    const config = {
      name: configName.trim(),
      description: configDescription.trim() || undefined,
      query: {
        keywords: currentQuery.keywords || [],
        searchOperator: currentQuery.searchOperator || 'AND',
        classifications: currentQuery.classifications || [],
        rawQuery: currentQuery.query
      },
      filters: currentFilters || {},
      databases: ['USPTO', 'EPO'], // Default databases
      searchSettings: {
        maxResults: 1000,
        timeout: 300,
        includeAbstracts: true,
        includeClaims: false
      }
    };

    const saved = await saveConfiguration(config);
    if (saved) {
      setShowSaveDialog(false);
      setConfigName('');
      setConfigDescription('');
    }
  };

  const handleLoadConfiguration = async (configId: string) => {
    const config = await loadConfiguration(configId);
    if (config) {
      onLoadConfiguration?.(config);
      setShowLoadDialog(false);
    }
  };

  const getConfigPreview = (config: any) => {
    const parts = [];
    if (config.query.keywords.length > 0) {
      parts.push(`${config.query.keywords.length} keywords`);
    }
    if (config.query.classifications.length > 0) {
      parts.push(`${config.query.classifications.length} classifications`);
    }
    if (config.filters && Object.keys(config.filters).length > 0) {
      parts.push(`${Object.keys(config.filters).length} filters`);
    }
    return parts.join(' • ') || 'Basic configuration';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" disabled={!currentQuery}>
              <Save className="h-3 w-3 mr-1" />
              Save Config
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Search Configuration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Configuration Name*</Label>
                <Input
                  placeholder="Enter configuration name..."
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Optional description..."
                  value={configDescription}
                  onChange={(e) => setConfigDescription(e.target.value)}
                  className="h-20"
                />
              </div>
              
              {/* Configuration Preview */}
              {currentQuery && (
                <div className="p-3 bg-muted rounded border">
                  <p className="text-sm font-medium mb-2">Configuration Preview:</p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {currentQuery.keywords && currentQuery.keywords.length > 0 && (
                      <p>Keywords: {currentQuery.keywords.slice(0, 3).join(', ')}
                        {currentQuery.keywords.length > 3 && ` +${currentQuery.keywords.length - 3} more`}
                      </p>
                    )}
                    {currentQuery.classifications && currentQuery.classifications.length > 0 && (
                      <p>Classifications: {currentQuery.classifications.join(', ')}</p>
                    )}
                    {currentQuery.query && (
                      <p>Raw Query: {currentQuery.query.slice(0, 100)}...</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveConfiguration}
                  disabled={!configName.trim()}
                >
                  Save Configuration
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" disabled={!hasConfigurations}>
              <Settings className="h-3 w-3 mr-1" />
              Load Config
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Load Search Configuration</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {configurations.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No saved configurations found
                </p>
              ) : (
                <div className="max-h-96 overflow-auto space-y-2">
                  {configurations.map((config) => (
                    <Card key={config.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-sm">{config.name}</h3>
                              <Badge variant="outline" className="text-xs">
                                Used {config.metadata.useCount} times
                              </Badge>
                            </div>
                            {config.description && (
                              <p className="text-xs text-muted-foreground mb-2">
                                {config.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {getConfigPreview(config)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 ml-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleLoadConfiguration(config.id)}
                              className="h-7 w-7 p-0"
                              title="Load configuration"
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteConfiguration(config.id)}
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                              title="Delete configuration"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>Created: {new Date(config.metadata.createdAt).toLocaleDateString()}</span>
                          {config.metadata.lastUsed && (
                            <span>• Last used: {new Date(config.metadata.lastUsed).toLocaleDateString()}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {currentConfig && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <Settings className="h-2 w-2 mr-1" />
              {currentConfig.name}
            </Badge>
          </div>
        )}
      </div>

      {/* Quick Load Recent Configurations */}
      {configurations.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {configurations.slice(0, 3).map((config) => (
            <Button
              key={config.id}
              size="sm"
              variant="ghost"
              className="h-6 text-xs px-2"
              onClick={() => handleLoadConfiguration(config.id)}
            >
              {config.name}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}