/**
 * SearchSubTab Component
 * Dedicated interface for creating new patent search queries with enhanced UX
 */

'use client';

import { useState } from 'react';
import {
  Search,
  Plus,
  ChevronUp
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchQueryBuilder } from './SearchQueryBuilder';
import { PatentAPI } from '@/services/patentApiConfigService';

interface SearchSubTabProps {
  projectId: string;
  availableAPIs: PatentAPI[];
  onQueryCreated: (queryData: any) => Promise<void>;
}


export function SearchSubTab({ projectId, availableAPIs, onQueryCreated }: SearchSubTabProps) {
  const [showQueryBuilder, setShowQueryBuilder] = useState(false);

  const handleCreateSearch = () => {
    setShowQueryBuilder(true);
  };

  const handleCloseQueryBuilder = () => {
    setShowQueryBuilder(false);
  };

  const handleQuerySubmit = async (queryData: any) => {
    await onQueryCreated(queryData);
    handleCloseQueryBuilder();
  };

  return (
    <div className="space-y-6">
      {/* Hero Section - Always Visible */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <Search className="h-6 w-6" />
                Patent Research Hub
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Discover patents across global databases with intelligent search capabilities
              </CardDescription>
            </div>
            <Button
              onClick={handleCreateSearch}
              size="lg"
              className={showQueryBuilder ? "opacity-50" : ""}
              disabled={showQueryBuilder}
            >
              <Plus className="h-5 w-5 mr-2" />
              New Patent Search
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Inline Query Builder - Expands Below Hero */}
      <div 
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          showQueryBuilder 
            ? 'max-h-[2000px] opacity-100' 
            : 'max-h-0 opacity-0'
        }`}
      >
        <Card className="border-t-4 border-t-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-blue-600" />
                  Create Patent Search Query
                </CardTitle>
                <CardDescription>
                  Build a comprehensive search query to discover relevant patents from patent databases.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={handleCloseQueryBuilder}
                className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200"
              >
                <ChevronUp className="h-4 w-4" />
                Collapse
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <SearchQueryBuilder
              projectId={projectId}
              availableAPIs={availableAPIs}
              onClose={handleCloseQueryBuilder}
              onSubmit={handleQuerySubmit}
              inline={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}