'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInfringementCase } from '@/hooks/useInfringementData';
import {
  getStatusColor,
  getRiskColor,
  getAnalysisTypeColor,
} from '@/domains/infringement/utils';
import {
  CaseOverviewTab,
  ClaimChartTab,
  EvidenceTab,
  RiskAssessmentTab,
  DamagesTab,
  PtabTab,
  ReportsTab,
  ImportClaimsDialog,
} from '@/domains/infringement/components';

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.caseId as string;
  const { caseData, loading, error, refresh } = useInfringementCase(caseId);
  const [activeTab, setActiveTab] = useState('overview');
  const [importClaimsOpen, setImportClaimsOpen] = useState(false);
  const [claimsRefreshKey, setClaimsRefreshKey] = useState(0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard/infringement')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cases
        </Button>
        <div className="text-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Case Not Found</h3>
          <p className="text-muted-foreground">
            {error || 'The requested infringement case could not be found.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link href="/dashboard/infringement" className="hover:text-foreground">
            Infringement
          </Link>
          <span>/</span>
          <span className="text-foreground">{caseData.case_name}</span>
          {caseData.patent_detail?.portfolio_id && (
            <>
              <span className="ml-2">|</span>
              <Link
                href={`/dashboard/portfolio/${caseData.patent_detail.portfolio_id}`}
                className="hover:text-foreground text-blue-600"
              >
                Portfolio
              </Link>
              <span>/</span>
              <Link
                href={`/dashboard/portfolio/${caseData.patent_detail.portfolio_id}/patent/${caseData.patent_detail.id}`}
                className="hover:text-foreground text-blue-600"
              >
                {caseData.patent_number}
              </Link>
            </>
          )}
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{caseData.case_name}</h1>
            <div className="flex items-center gap-2 mt-2">
              {caseData.case_number && (
                <span className="text-sm text-muted-foreground font-mono">
                  {caseData.case_number}
                </span>
              )}
              <Badge className={getStatusColor(caseData.status)}>
                {caseData.status.replace('_', ' ')}
              </Badge>
              <Badge className={getRiskColor(caseData.risk_level)}>
                {caseData.risk_level} risk
              </Badge>
              <Badge className={getAnalysisTypeColor(caseData.analysis_type)}>
                {caseData.analysis_type}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {caseData.patent_number} vs {caseData.accused_product_name} ({caseData.accused_party_name})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/infringement')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="claims">Claim Chart</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
          <TabsTrigger value="damages">Damages</TabsTrigger>
          <TabsTrigger value="ptab">PTAB</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <CaseOverviewTab caseData={caseData} onRefresh={refresh} />
        </TabsContent>

        <TabsContent value="evidence">
          <EvidenceTab caseId={caseId} caseName={caseData.case_name} />
        </TabsContent>

        <TabsContent value="claims">
          <ClaimChartTab
            key={claimsRefreshKey}
            caseId={caseId}
            caseName={caseData.case_name}
            patentNumber={caseData.patent_number}
            onImportClaims={() => setImportClaimsOpen(true)}
          />
        </TabsContent>

        <TabsContent value="risk">
          <RiskAssessmentTab caseId={caseId} caseName={caseData.case_name} />
        </TabsContent>

        <TabsContent value="damages">
          <DamagesTab caseId={caseId} caseName={caseData.case_name} />
        </TabsContent>

        <TabsContent value="ptab">
          <PtabTab caseId={caseId} patentNumber={caseData.patent_number} />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsTab caseId={caseId} caseName={caseData.case_name} />
        </TabsContent>
      </Tabs>

      {/* Import Claims Dialog */}
      <ImportClaimsDialog
        open={importClaimsOpen}
        onOpenChange={setImportClaimsOpen}
        caseId={caseId}
        patentNumber={caseData.patent_number}
        onImported={() => {
          setActiveTab('claims');
          setClaimsRefreshKey((k) => k + 1);
        }}
      />
    </div>
  );
}
