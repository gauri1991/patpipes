'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Shield,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { InfringementCase } from '@/services/infringementApi';
import { usptoOdpApi, ODPApplicationSummary } from '@/services/usptoOdpApi';
import {
  getStatusColor,
  getRiskColor,
  getAnalysisTypeColor,
  formatDate,
} from '@/domains/infringement/utils';
import { StatusChangeDialog } from './StatusChangeDialog';

interface CaseOverviewTabProps {
  caseData: InfringementCase;
  onRefresh: () => void;
}

export function CaseOverviewTab({ caseData, onRefresh }: CaseOverviewTabProps) {
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [odpData, setOdpData] = useState<ODPApplicationSummary | null>(null);
  const [odpLoading, setOdpLoading] = useState(false);

  // Load ODP data for live patent status
  useEffect(() => {
    if (!caseData.patent_number) return;

    const fetchOdpData = async () => {
      setOdpLoading(true);
      try {
        // Strip US prefix and any commas/spaces for search
        const cleanNumber = caseData.patent_number.replace(/^US/i, '').replace(/[,\s]/g, '');
        const response = await usptoOdpApi.searchApplications({
          patentNumber: cleanNumber,
        });
        if (response.success && response.data?.patentFileWrapperDataBag && response.data.patentFileWrapperDataBag.length > 0) {
          setOdpData(response.data.patentFileWrapperDataBag[0]);
        }
      } catch {
        // ODP data is optional enrichment, don't fail
      } finally {
        setOdpLoading(false);
      }
    };

    fetchOdpData();
  }, [caseData.patent_number]);

  return (
    <div className="space-y-6">
      {/* Summary Cards Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {caseData.infringement_likelihood ?? 0}%
              </div>
              <p className="text-sm text-muted-foreground mt-1">Infringement Likelihood</p>
              <Progress value={caseData.infringement_likelihood ?? 0} className="mt-2" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {caseData.confidence_level ?? 0}%
              </div>
              <p className="text-sm text-muted-foreground mt-1">Confidence Level</p>
              <Progress value={caseData.confidence_level ?? 0} className="mt-2" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Badge className={`text-sm ${getRiskColor(caseData.risk_level)}`}>
                {caseData.risk_level.toUpperCase()}
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">Risk Level</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Badge
                className={`text-sm cursor-pointer hover:opacity-80 ${getStatusColor(caseData.status)}`}
                onClick={() => setStatusDialogOpen(true)}
              >
                {caseData.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">Status (click to change)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Patent Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Patent Information
              </CardTitle>
              {caseData.patent_detail?.portfolio_id && (
                <Link
                  href={`/dashboard/portfolio/${caseData.patent_detail.portfolio_id}/patent/${caseData.patent_detail.id}`}
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  View in Portfolio
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Patent Number</p>
              <p className="font-medium">{caseData.patent_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Patent Title</p>
              <p className="font-medium">{caseData.patent_title || 'N/A'}</p>
            </div>
            {caseData.patent_abstract && (
              <div>
                <p className="text-sm text-muted-foreground">Abstract</p>
                <p className="text-sm">{caseData.patent_abstract}</p>
              </div>
            )}
            {caseData.patent_url && (
              <a
                href={caseData.patent_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                View Patent <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </CardContent>
        </Card>

        {/* Accused Product */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Accused Product
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Product Name</p>
              <p className="font-medium">{caseData.accused_product_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Accused Party</p>
              <p className="font-medium">{caseData.accused_party_name || 'N/A'}</p>
            </div>
            {caseData.accused_product_description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm">{caseData.accused_product_description}</p>
              </div>
            )}
            {caseData.accused_party_url && (
              <a
                href={caseData.accused_party_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                Company Website <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analysis Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Analysis Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Analysis Type</p>
              <Badge className={getAnalysisTypeColor(caseData.analysis_type)}>
                {caseData.analysis_type}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Discovery Date</p>
              <p className="font-medium">{formatDate(caseData.discovery_date)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Analysis Date</p>
              <p className="font-medium">{formatDate(caseData.analysis_date)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Case Number</p>
              <p className="font-medium">{caseData.case_number || 'N/A'}</p>
            </div>
          </div>
          {caseData.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-1">Notes</p>
              <p className="text-sm whitespace-pre-wrap">{caseData.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live USPTO Status (ODP) */}
      {(odpData || odpLoading) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">USPTO Patent Status (Live)</CardTitle>
              {odpLoading && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
          </CardHeader>
          <CardContent>
            {odpLoading ? (
              <p className="text-sm text-muted-foreground">Loading USPTO data...</p>
            ) : odpData ? (
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Application Status</p>
                  <p className="font-medium">
                    {odpData.applicationMetaData?.applicationStatusDescriptionText || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Filing Date</p>
                  <p className="font-medium">
                    {formatDate(odpData.applicationMetaData?.filingDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Grant Date</p>
                  <p className="font-medium">
                    {formatDate(odpData.applicationMetaData?.grantDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Application Type</p>
                  <p className="font-medium">
                    {odpData.applicationMetaData?.applicationTypeLabelName || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Applicant</p>
                  <p className="font-medium">
                    {odpData.applicationMetaData?.applicantNameText || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Application Number</p>
                  <p className="font-medium font-mono">
                    {odpData.applicationNumberText || 'N/A'}
                  </p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      <StatusChangeDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        caseItem={caseData}
        onStatusChanged={onRefresh}
      />
    </div>
  );
}
