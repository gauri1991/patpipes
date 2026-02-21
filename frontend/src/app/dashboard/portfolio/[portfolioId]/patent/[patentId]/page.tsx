/**
 * Patent Detail Page
 * Displays full patent information within a portfolio context
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Calendar,
  Building,
  User,
  Tag,
  Shield,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/services/apiClient';

interface PatentDetail {
  id: string;
  portfolio: string | null;
  portfolio_name: string | null;
  title: string;
  application_number: string | null;
  patent_number: string | null;
  status: string;
  patent_type: string;
  filing_date: string | null;
  priority_date: string | null;
  grant_date: string | null;
  expiry_date: string | null;
  inventors: string[];
  assignees: string[];
  technology_area: string;
  ipc_classifications: string[];
  estimated_value: number | null;
  maintenance_cost: number;
  abstract: string;
  claims: Array<{ number?: number; text: string; type?: string }>;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface InfringementCaseSummary {
  id: string;
  case_name: string;
  case_number: string;
  status: string;
  risk_level: string;
  accused_product_name: string;
  created_at: string;
}

export default function PatentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const portfolioId = params.portfolioId as string;
  const patentId = params.patentId as string;

  const [patent, setPatent] = useState<PatentDetail | null>(null);
  const [relatedCases, setRelatedCases] = useState<InfringementCaseSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPatent();
  }, [patentId]);

  const loadPatent = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<PatentDetail>(`/patents/patents/${patentId}/`);
      if (response.success && response.data) {
        setPatent(response.data as PatentDetail);
      } else {
        setError('Patent not found.');
      }

      // Try loading related infringement cases
      try {
        const casesResponse = await apiClient.get<InfringementCaseSummary[]>(
          `/patents/patents/${patentId}/infringement_cases/`
        );
        if (casesResponse.success && casesResponse.data) {
          setRelatedCases(casesResponse.data as InfringementCaseSummary[]);
        }
      } catch {
        // Not critical if infringement cases fail to load
      }
    } catch (err) {
      console.error('Failed to load patent:', err);
      setError('Failed to load patent details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push(`/dashboard/portfolio/${portfolioId}`);
  };

  const handleAnalyzeInfringement = () => {
    router.push(`/dashboard/infringement/new?patent_id=${patentId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'granted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
      case 'filed':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
      case 'abandoned':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      filed: 'bg-blue-100 text-blue-800',
      granted: 'bg-green-100 text-green-800',
      expired: 'bg-gray-100 text-gray-800',
      abandoned: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-600',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getRiskColor = (level: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-8 w-96" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !patent) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Portfolio
        </Button>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error || 'Patent not found'}</p>
          <Button onClick={handleBack}>Go to Portfolio</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Portfolio
          </Button>
        </div>
        <Button onClick={handleAnalyzeInfringement} variant="outline">
          <Shield className="h-4 w-4 mr-2" />
          Analyze for Infringement
        </Button>
      </div>

      {/* Title & Status */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          {getStatusIcon(patent.status)}
          <Badge className={getStatusColor(patent.status)}>{patent.status}</Badge>
          <Badge variant="outline">{patent.patent_type}</Badge>
        </div>
        <h1 className="text-2xl font-bold">{patent.title}</h1>
        <p className="text-muted-foreground mt-1 font-mono">
          {patent.patent_number || patent.application_number || 'No number assigned'}
        </p>
      </div>

      {/* Key Info Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              Filing Date
            </div>
            <p className="font-semibold">{formatDate(patent.filing_date)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <CheckCircle className="h-4 w-4" />
              Grant Date
            </div>
            <p className="font-semibold">{formatDate(patent.grant_date)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <AlertCircle className="h-4 w-4" />
              Expiry Date
            </div>
            <p className="font-semibold">{formatDate(patent.expiry_date)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <FileText className="h-4 w-4" />
              Estimated Value
            </div>
            <p className="font-semibold">{formatCurrency(patent.estimated_value)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Abstract */}
        <Card>
          <CardHeader>
            <CardTitle>Abstract</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">
              {patent.abstract || 'No abstract available.'}
            </p>
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {patent.assignees && patent.assignees.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Building className="h-4 w-4" />
                  Assignees
                </div>
                <div className="flex flex-wrap gap-1">
                  {patent.assignees.map((a, i) => (
                    <Badge key={i} variant="outline">{a}</Badge>
                  ))}
                </div>
              </div>
            )}

            {patent.inventors && patent.inventors.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <User className="h-4 w-4" />
                  Inventors
                </div>
                <div className="flex flex-wrap gap-1">
                  {patent.inventors.map((inv, i) => (
                    <Badge key={i} variant="secondary">{inv}</Badge>
                  ))}
                </div>
              </div>
            )}

            {patent.technology_area && (
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Tag className="h-4 w-4" />
                  Technology Area
                </div>
                <p className="text-sm font-medium">{patent.technology_area}</p>
              </div>
            )}

            {patent.priority_date && (
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  Priority Date
                </div>
                <p className="text-sm font-medium">{formatDate(patent.priority_date)}</p>
              </div>
            )}

            {patent.tags && patent.tags.length > 0 && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Tags</div>
                <div className="flex flex-wrap gap-1">
                  {patent.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Claims */}
      {patent.claims && patent.claims.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Claims ({patent.claims.length})</CardTitle>
            <CardDescription>Patent claims defining the scope of protection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patent.claims.map((claim, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      Claim {claim.number ?? index + 1}
                    </Badge>
                    {claim.type && (
                      <Badge variant="secondary" className="text-xs">{claim.type}</Badge>
                    )}
                  </div>
                  <p className="text-sm">{claim.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Infringement Cases */}
      {relatedCases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Related Infringement Cases ({relatedCases.length})
            </CardTitle>
            <CardDescription>
              Infringement analysis cases linked to this patent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {relatedCases.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/dashboard/infringement/${c.id}`)}
                >
                  <div>
                    <p className="font-medium">{c.case_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.case_number} — vs. {c.accused_product_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(c.status)}>{c.status}</Badge>
                    <Badge className={getRiskColor(c.risk_level)}>{c.risk_level}</Badge>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
