'use client';

import { useState } from 'react';
import {
  Plus,
  FileText,
  Download,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useEvidence } from '@/hooks/useInfringementData';
import { getEvidenceTypeLabel, formatDate } from '@/domains/infringement/utils';
import { EvidenceUploadDialog } from './EvidenceUploadDialog';

interface EvidenceTabProps {
  caseId: string;
  caseName: string;
}

export function EvidenceTab({ caseId, caseName }: EvidenceTabProps) {
  const { evidence, loading, refresh, deleteEvidence } = useEvidence({ case: caseId });
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const handleDelete = async (evidenceId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this evidence?');
    if (!confirmed) return;
    await deleteEvidence(evidenceId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Evidence ({evidence.length})</h3>
          <p className="text-sm text-muted-foreground">
            Supporting evidence for this infringement case
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Upload Evidence
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading evidence...</div>
      ) : evidence.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Evidence Yet</h3>
            <p className="text-muted-foreground mb-4">
              Upload documents, screenshots, or links to support your analysis.
            </p>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Upload First Evidence
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {evidence.map((item) => (
            <Card key={item.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{item.title}</span>
                      <Badge variant="outline">
                        {getEvidenceTypeLabel(item.evidence_type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">{item.description}</p>
                    <div className="flex items-center gap-4 ml-6 mt-2">
                      {item.relevance_score > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Relevance:</span>
                          <Progress value={item.relevance_score} className="w-16 h-2" />
                          <span className="text-xs font-medium">{item.relevance_score}%</span>
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Added {formatDate(item.created_at)}
                      </span>
                      {item.related_claims?.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          Claims: {item.related_claims.join(', ')}
                        </span>
                      )}
                    </div>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline ml-6 mt-1 inline-flex items-center gap-1"
                      >
                        View Source <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {item.file && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={item.file} download>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <EvidenceUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        caseId={caseId}
        caseName={caseName}
        onUploaded={refresh}
      />
    </div>
  );
}
