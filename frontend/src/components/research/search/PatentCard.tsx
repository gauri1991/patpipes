'use client';

import { FileText, Calendar, User, Building, Eye, Plus, Star, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PatentCardProps {
  patent: {
    id: string;
    patent_number: string;
    title: string;
    abstract?: string;
    inventors?: string[];
    assignee: string;
    publication_date: string;
    status: string;
    jurisdiction: string;
  };
  isSelected?: boolean;
  variant?: 'default' | 'compact';
  showBrainstormingActions?: boolean;
  onAddToBrainstorming?: (patent: any) => void;
  brainstormingData?: {
    sessionId: string;
    projectId: string;
    keywords?: string[];
  };
}

export function PatentCard({ 
  patent, 
  isSelected = false, 
  variant = 'default',
  showBrainstormingActions = false,
  onAddToBrainstorming,
  brainstormingData
}: PatentCardProps) {
  if (variant === 'compact') {
    return (
      <Card className={`hover:shadow-sm transition-shadow ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-3 w-3 text-blue-600" />
                <span className="font-mono text-xs font-medium">{patent.patent_number}</span>
                <Badge variant="outline" className="text-xs px-1 py-0">{patent.jurisdiction}</Badge>
                <Badge variant={patent.status === 'active' ? 'default' : 'secondary'} className="text-xs px-1 py-0">
                  {patent.status}
                </Badge>
              </div>
              <h3 className="font-medium line-clamp-1 text-sm mb-2">
                {patent.title}
              </h3>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  {patent.assignee}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(patent.publication_date).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 ml-4">
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                <Eye className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="font-mono text-sm font-medium">{patent.patent_number}</span>
              <Badge variant="outline">{patent.jurisdiction}</Badge>
              <Badge variant={patent.status === 'active' ? 'default' : 'secondary'}>
                {patent.status}
              </Badge>
            </div>
            <h3 className="font-medium line-clamp-2 text-sm">
              {patent.title}
            </h3>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Abstract */}
        {patent.abstract && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {patent.abstract}
            </p>
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-2 text-xs text-muted-foreground">
          {patent.inventors && patent.inventors.length > 0 && (
            <div className="flex items-center gap-2">
              <User className="h-3 w-3" />
              <span>Inventors: {patent.inventors.slice(0, 2).join(', ')}</span>
              {patent.inventors.length > 2 && <span>+{patent.inventors.length - 2} more</span>}
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Building className="h-3 w-3" />
            <span>Assignee: {patent.assignee}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>Published: {new Date(patent.publication_date).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-3 border-t">
          <Button size="sm" variant="outline">
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          {showBrainstormingActions && brainstormingData ? (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onAddToBrainstorming?.({
                ...patent,
                brainstormingContext: brainstormingData
              })}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add to Session
            </Button>
          ) : (
            <Button size="sm" variant="outline">
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          )}
          <Button size="sm" variant="ghost">
            <Star className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost">
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}