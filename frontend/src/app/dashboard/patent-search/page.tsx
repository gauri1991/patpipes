'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PatentSearchBar, parseSearchInput } from '@/components/patent-search/PatentSearchBar';
import { PatentOverviewTab } from '@/components/patent-search/PatentOverviewTab';
import { PatentContinuityTab } from '@/components/patent-search/PatentContinuityTab';
import { PatentAssignmentTab } from '@/components/patent-search/PatentAssignmentTab';
import { PatentAttorneyTab } from '@/components/patent-search/PatentAttorneyTab';
import { PatentTransactionsTab } from '@/components/patent-search/PatentTransactionsTab';
import { PatentDocumentsTab } from '@/components/patent-search/PatentDocumentsTab';
import { PatentForeignPriorityTab } from '@/components/patent-search/PatentForeignPriorityTab';
import { PatentAdjustmentTab } from '@/components/patent-search/PatentAdjustmentTab';
import { PatentFullTextTab } from '@/components/patent-search/PatentFullTextTab';
import { PatentAnalyzeTab } from '@/components/patent-search/PatentAnalyzeTab';
import { LensEnrichmentTab } from '@/components/patent-search/LensEnrichmentTab';
import { DataSourceSelector, type DataSource } from '@/components/patent-search/DataSourceSelector';
import usptoOdpApi from '@/services/usptoOdpApi';
import type { ODPApplication } from '@/services/usptoOdpApi';
import lensApi from '@/services/lensApi';
import type { LensPatent } from '@/services/lensApi';

type PageState = 'empty' | 'loading' | 'results' | 'error';

export default function PatentSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [state, setState] = useState<PageState>('empty');
  const [appData, setAppData] = useState<ODPApplication | null>(null);
  const [appId, setAppId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['overview']));
  const [dataSource, setDataSource] = useState<DataSource>('odp');
  const [lensData, setLensData] = useState<LensPatent | null>(null);
  const [lensLoading, setLensLoading] = useState(false);

  const prefetchLens = useCallback((patentNumber: string) => {
    if (!patentNumber) return;
    setLensData(null);
    setLensLoading(true);
    lensApi.getPatentByDocNumber(patentNumber, 'US').then((res) => {
      setLensData(res.success && res.data?.patent ? res.data.patent : null);
      setLensLoading(false);
    }).catch(() => setLensLoading(false));
  }, []);

  const doSearch = useCallback(
    async (query: string) => {
      setState('loading');
      setErrorMsg('');
      setAppData(null);
      setLensData(null);
      setLensLoading(false);
      setLoadedTabs(new Set(['overview']));

      try {
        const parsed = parseSearchInput(query);
        let resolvedAppId = parsed.value;

        // If it looks like a patent number, search ODP to resolve app number
        // The search response contains the same data as the detail endpoint,
        // so we use it directly and skip the redundant getApplication call.
        if (parsed.type === 'patent') {
          const searchRes = await usptoOdpApi.searchApplications({
            q: `patentNumber=${parsed.value}`,
          });

          if (
            searchRes.success &&
            searchRes.data?.patentFileWrapperDataBag?.length
          ) {
            const appItem = searchRes.data.patentFileWrapperDataBag[0];
            resolvedAppId =
              appItem.applicationNumberText?.replace(/[^0-9]/g, '') ||
              parsed.value;
            const patNum = (appItem as ODPApplication).applicationMetaData?.patentNumber || '';
            setAppData(appItem as ODPApplication);
            setAppId(resolvedAppId);
            setState('results');
            if (patNum) prefetchLens(patNum);

            const params = new URLSearchParams();
            params.set('app', resolvedAppId);
            router.replace(`/dashboard/patent-search?${params.toString()}`, {
              scroll: false,
            });
            return;
          } else {
            setState('error');
            setErrorMsg(
              'Could not find a patent matching that number. Try the application number instead.'
            );
            return;
          }
        }

        // Direct application number lookup
        const appRes = await usptoOdpApi.getApplication(resolvedAppId);

        if (appRes.success && appRes.data) {
          const patNum = appRes.data.applicationMetaData?.patentNumber || '';
          setAppData(appRes.data);
          setAppId(resolvedAppId);
          setState('results');
          if (patNum) prefetchLens(patNum);

          const params = new URLSearchParams();
          params.set('app', resolvedAppId);
          router.replace(`/dashboard/patent-search?${params.toString()}`, {
            scroll: false,
          });
        } else {
          setState('error');
          setErrorMsg(
            appRes.error || 'No application found for the given number.'
          );
        }
      } catch (err) {
        setState('error');
        setErrorMsg('An unexpected error occurred. Please try again.');
      }
    },
    [router]
  );

  // Load from URL on mount
  useEffect(() => {
    const appParam = searchParams.get('app');
    if (appParam) {
      doSearch(appParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (tab: string) => {
    setLoadedTabs((prev) => new Set(prev).add(tab));
  };

  const handleNavigate = useCallback(
    (newAppId: string) => {
      doSearch(newAppId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [doSearch]
  );

  const meta = appData?.applicationMetaData || {};

  return (
    <div className="space-y-6">
      {/* Search bar — always visible */}
      <div
        className={
          state === 'empty'
            ? 'flex flex-col items-center justify-center min-h-[60vh] gap-6'
            : 'sticky top-16 z-30 bg-background/95 backdrop-blur py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b'
        }
      >
        {state === 'empty' && (
          <div className="text-center space-y-2 mb-4">
            <div className="flex items-center justify-center gap-2">
              <SearchCheck className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Search Patents</h1>
            </div>
            <p className="text-muted-foreground max-w-md">
              Look up any US patent by application number or patent number using
              the USPTO Open Data Portal.
            </p>
          </div>
        )}
        <PatentSearchBar
          onSearch={doSearch}
          isLoading={state === 'loading'}
          className={state === 'empty' ? '' : 'max-w-3xl'}
        />
        {state === 'empty' && (
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="border rounded px-2 py-1">15060643</span>
            <span className="border rounded px-2 py-1">US11301943B2</span>
            <span className="border rounded px-2 py-1">16123456</span>
          </div>
        )}
      </div>

      {/* Loading state */}
      {state === 'loading' && (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-10 w-full max-w-xl" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {/* Error state */}
      {state === 'error' && (
        <Card className="max-w-lg mx-auto">
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-center text-sm">{errorMsg}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setState('empty')}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results state */}
      {state === 'results' && appData && (
        <>
          {/* Patent Header Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg leading-snug">
                {meta.inventionTitle || 'Untitled Application'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">App #: </span>
                  <span className="font-mono font-medium">
                    {appData.applicationNumberText || appId}
                  </span>
                </div>
                {meta.patentNumber && (
                  <div>
                    <span className="text-muted-foreground">Patent #: </span>
                    <span className="font-mono font-medium">
                      US{meta.patentNumber}
                    </span>
                  </div>
                )}
                {meta.applicationStatusDescriptionText && (
                  <Badge variant="outline">
                    {meta.applicationStatusDescriptionText}
                  </Badge>
                )}
                {meta.filingDate && (
                  <div>
                    <span className="text-muted-foreground">Filed: </span>
                    <span>{meta.filingDate}</span>
                  </div>
                )}
                {meta.grantDate && (
                  <div>
                    <span className="text-muted-foreground">Granted: </span>
                    <span>{meta.grantDate}</span>
                  </div>
                )}
                {(meta.firstApplicantName || meta.applicantNameText) && (
                  <div>
                    <span className="text-muted-foreground">Applicant: </span>
                    <span>{meta.firstApplicantName || meta.applicantNameText}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Data Source Selector */}
          <div className="flex items-center justify-between">
            <DataSourceSelector
              value={dataSource}
              onChange={setDataSource}
              hasOdp={true}
              hasLens={!!meta.patentNumber}
            />
            {lensLoading && (
              <span className="text-xs text-muted-foreground animate-pulse">Fetching Lens.org data…</span>
            )}
          </div>

          {/* USPTO ODP Tabs */}
          {(dataSource === 'odp' || dataSource === 'both') && (
            <Tabs defaultValue="overview" onValueChange={handleTabChange}>
              <TabsList className="flex flex-wrap h-auto gap-1">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="continuity">Continuity</TabsTrigger>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                <TabsTrigger value="attorney">Attorney</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="foreign-priority">Foreign Priority</TabsTrigger>
                <TabsTrigger value="adjustment">PTA/PTE</TabsTrigger>
                <TabsTrigger value="full-text">Full Text</TabsTrigger>
                <TabsTrigger value="analyze">AI Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <PatentOverviewTab data={appData} />
              </TabsContent>
              <TabsContent value="continuity" className="mt-4">
                {loadedTabs.has('continuity') && (
                  <PatentContinuityTab appId={appId} appData={appData} onNavigate={handleNavigate} />
                )}
              </TabsContent>
              <TabsContent value="assignments" className="mt-4">
                {loadedTabs.has('assignments') && (
                  <PatentAssignmentTab appId={appId} appData={appData} />
                )}
              </TabsContent>
              <TabsContent value="attorney" className="mt-4">
                {loadedTabs.has('attorney') && (
                  <PatentAttorneyTab appId={appId} appData={appData} />
                )}
              </TabsContent>
              <TabsContent value="transactions" className="mt-4">
                {loadedTabs.has('transactions') && (
                  <PatentTransactionsTab appId={appId} appData={appData} />
                )}
              </TabsContent>
              <TabsContent value="documents" className="mt-4">
                {loadedTabs.has('documents') && <PatentDocumentsTab appId={appId} />}
              </TabsContent>
              <TabsContent value="foreign-priority" className="mt-4">
                {loadedTabs.has('foreign-priority') && <PatentForeignPriorityTab appId={appId} />}
              </TabsContent>
              <TabsContent value="adjustment" className="mt-4">
                {loadedTabs.has('adjustment') && (
                  <PatentAdjustmentTab appId={appId} appData={appData} />
                )}
              </TabsContent>
              <TabsContent value="full-text" className="mt-4">
                {loadedTabs.has('full-text') && <PatentFullTextTab appId={appId} />}
              </TabsContent>
              <TabsContent value="analyze" className="mt-4">
                {loadedTabs.has('analyze') && <PatentAnalyzeTab appId={appId} />}
              </TabsContent>
            </Tabs>
          )}

          {/* Lens.org Enrichment */}
          {(dataSource === 'lens' || dataSource === 'both') && (
            <div className="mt-2">
              {meta.patentNumber ? (
                <LensEnrichmentTab
                  patentNumber={meta.patentNumber}
                  onNavigate={handleNavigate}
                  prefetchedData={lensData}
                  prefetchedLoading={lensLoading}
                />
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    Lens.org enrichment requires a granted patent number. This application has not yet been granted.
                  </CardContent>
                </Card>
              )}
            </div>
          )}

        </>
      )}
    </div>
  );
}
