'use client';

import { useState, useEffect, useCallback } from 'react';
import webSearchApi from '@/services/webSearchApi';
import {
  SearchSession,
  SearchQuery,
  SearchResult,
  QuotaInfo,
  CreateSessionRequest,
  CreateQueryRequest,
  UpdateResultRequest,
  SearchConfigPublic,
  ClientSearchResultPayload,
} from '@/domains/web-search/types/webSearch.types';
import { cseSearch } from '@/lib/googleCseClient';
import { toast } from 'sonner';

// ==================== Hook for Search Config (client vs server mode) ====================

export interface SearchConfig {
  searchMode: 'server' | 'client' | 'none';
  cxId: string;
  isActive: boolean;
}

export function useSearchConfig() {
  const [config, setConfig] = useState<SearchConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const response = await webSearchApi.getPublicConfig();
      if (response.success && response.data) {
        setConfig({
          searchMode: response.data.search_mode,
          cxId: response.data.search_engine_id,
          isActive: response.data.is_active,
        });
      }
    } catch (err) {
      console.error('Failed to fetch search config:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return { config, loading, fetchConfig };
}

// ==================== Hook for Search Sessions List ====================

export function useWebSearchSessions() {
  const [sessions, setSessions] = useState<SearchSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await webSearchApi.getSessions();
      if (response.success && response.data) {
        setSessions(response.data.results);
      } else {
        throw new Error(response.error || 'Failed to fetch search sessions');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch search sessions';
      setError(message);
      console.error('Sessions fetch error:', err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const createSession = useCallback(async (data: CreateSessionRequest) => {
    try {
      const response = await webSearchApi.createSession(data);
      if (response.success && response.data) {
        setSessions(prev => [response.data!, ...prev]);
        toast.success('Search session created');
        return response.data;
      }
      throw new Error(response.error || 'Failed to create session');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create session';
      toast.error(message);
      throw err;
    }
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    try {
      const response = await webSearchApi.deleteSession(id);
      if (response.success) {
        setSessions(prev => prev.filter(s => s.id !== id));
        toast.success('Session deleted');
      } else {
        throw new Error(response.error || 'Failed to delete session');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete session';
      toast.error(message);
      throw err;
    }
  }, []);

  return {
    sessions,
    loading,
    error,
    fetchSessions,
    createSession,
    deleteSession,
  };
}

// ==================== Hook for Single Search Session ====================

export function useWebSearchSession(
  sessionId: string | null,
  searchConfig?: SearchConfig | null
) {
  const [session, setSession] = useState<SearchSession | null>(null);
  const [queries, setQueries] = useState<SearchQuery[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [executingQueryId, setExecutingQueryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    if (!sessionId) {
      setSession(null);
      setQueries([]);
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await webSearchApi.getSession(sessionId);
      if (response.success && response.data) {
        setSession(response.data);
        setQueries(response.data.queries || []);
      } else {
        throw new Error(response.error || 'Failed to fetch session');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch session';
      setError(message);
      console.error('Session fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const fetchResults = useCallback(async () => {
    if (!sessionId) return;

    try {
      const response = await webSearchApi.getSessionResults(sessionId);
      if (response.success && response.data) {
        setResults(Array.isArray(response.data) ? response.data : []);
      } else {
        throw new Error(response.error || 'Failed to fetch results');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch results';
      console.error('Results fetch error:', err);
      toast.error(message);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (sessionId) {
      fetchResults();
    }
  }, [sessionId, fetchResults]);

  const generateQueries = useCallback(async (contextData?: Record<string, any>) => {
    if (!sessionId) return;

    try {
      setExecuting(true);
      const response = await webSearchApi.generateQueries(sessionId, contextData);
      if (response.success && response.data) {
        const newQueries = Array.isArray(response.data) ? response.data : [];
        setQueries(prev => [...prev, ...newQueries]);
        toast.success(`Generated ${newQueries.length} search queries`);
        return newQueries;
      }
      throw new Error(response.error || 'Failed to generate queries');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate queries';
      toast.error(message);
      throw err;
    } finally {
      setExecuting(false);
    }
  }, [sessionId]);

  // Helper: map CSE results to client submission payload
  const mapCseResults = (cseResults: { title: string; url: string; snippet: string; displayLink: string; visibleUrl: string; thumbnailUrl: string | null }[]): ClientSearchResultPayload[] => {
    return cseResults.map((r, idx) => ({
      title: r.title,
      url: r.url,
      snippet: r.snippet,
      display_link: r.displayLink,
      visible_url: r.visibleUrl,
      thumbnail_url: r.thumbnailUrl,
      position: idx + 1,
    }));
  };

  const executeQuery = useCallback(async (queryId: string) => {
    const query = queries.find(q => q.id === queryId);
    if (!query) return;

    try {
      setExecutingQueryId(queryId);

      if (searchConfig?.searchMode === 'client' && searchConfig.cxId) {
        // CLIENT-SIDE EXECUTION via Google CSE widget
        const cseResponse = await cseSearch(searchConfig.cxId, query.query_text, {
          site_filter: query.site_filter,
          file_type: query.file_type,
          date_restrict: query.date_restrict,
          exact_terms: query.exact_terms,
          exclude_terms: query.exclude_terms,
        });
        const mappedResults = mapCseResults(cseResponse.results);

        // OPTIMISTIC UPDATE — show results in UI immediately
        const optimisticResults: SearchResult[] = mappedResults.map((r, idx) => ({
          id: `temp-${queryId}-${idx}`,
          query: queryId,
          title: r.title,
          url: r.url,
          snippet: r.snippet,
          display_link: r.display_link,
          source_domain: r.visible_url,
          thumbnail_url: r.thumbnail_url,
          position: r.position,
          is_flagged: false,
          is_saved: false,
          relevance_notes: '',
          created_at: new Date().toISOString(),
        }));

        setResults(prev => {
          const otherResults = prev.filter(r => r.query !== queryId);
          return [...otherResults, ...optimisticResults];
        });
        setQueries(prev =>
          prev.map(q =>
            q.id === queryId
              ? { ...q, executed_at: new Date().toISOString(), results_count: optimisticResults.length }
              : q
          )
        );
        setExecutingQueryId(null);
        toast.success(`Query executed — ${optimisticResults.length} results`);

        // BACKGROUND SAVE — persist to backend without blocking UI
        webSearchApi.submitClientResults({
          query_id: queryId,
          results: mappedResults,
        }).then(submitResponse => {
          if (submitResponse.success && submitResponse.data) {
            // Replace optimistic results with real DB records (with real IDs)
            const savedResults = submitResponse.data.results || [];
            if (savedResults.length > 0) {
              setResults(prev => {
                const otherResults = prev.filter(r => r.query !== queryId);
                return [...otherResults, ...savedResults];
              });
            }
          }
        }).catch(err => {
          console.error('Background save failed:', err);
          toast.error('Failed to save results to database');
        });

        return optimisticResults;
      } else {
        // SERVER-SIDE EXECUTION (existing path)
        const response = await webSearchApi.executeQuery(queryId);
        if (response.success && response.data) {
          const newResults = Array.isArray(response.data) ? response.data : [];
          setResults(prev => {
            const otherResults = prev.filter(r => r.query !== queryId);
            return [...otherResults, ...newResults];
          });
          setQueries(prev =>
            prev.map(q =>
              q.id === queryId
                ? { ...q, executed_at: new Date().toISOString(), results_count: newResults.length }
                : q
            )
          );
          toast.success(`Query executed — ${newResults.length} results`);
          return newResults;
        }
        throw new Error(response.error || 'Failed to execute query');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to execute query';
      toast.error(message);
      throw err;
    } finally {
      setExecutingQueryId(null);
    }
  }, [queries, searchConfig]);

  const executeAllQueries = useCallback(async () => {
    if (!sessionId) return;
    const unexecuted = queries.filter(q => q.executed_at === null);
    if (unexecuted.length === 0) {
      toast.info('All queries have already been executed.');
      return;
    }

    try {
      setExecuting(true);

      if (searchConfig?.searchMode === 'client' && searchConfig.cxId) {
        // CLIENT-SIDE: Execute each query sequentially with optimistic updates
        let totalResults = 0;
        let errorCount = 0;
        const backgroundSaves: Promise<void>[] = [];

        for (const query of unexecuted) {
          try {
            const cseResponse = await cseSearch(searchConfig.cxId, query.query_text, {
              site_filter: query.site_filter,
              file_type: query.file_type,
              date_restrict: query.date_restrict,
              exact_terms: query.exact_terms,
              exclude_terms: query.exclude_terms,
            });
            const mappedResults = mapCseResults(cseResponse.results);

            // Optimistic update — show results immediately
            const optimisticResults: SearchResult[] = mappedResults.map((r, idx) => ({
              id: `temp-${query.id}-${idx}`,
              query: query.id,
              title: r.title,
              url: r.url,
              snippet: r.snippet,
              display_link: r.display_link,
              source_domain: r.visible_url,
              thumbnail_url: r.thumbnail_url,
              position: r.position,
              is_flagged: false,
              is_saved: false,
              relevance_notes: '',
              created_at: new Date().toISOString(),
            }));

            setResults(prev => [...prev.filter(r => r.query !== query.id), ...optimisticResults]);
            setQueries(prev =>
              prev.map(q =>
                q.id === query.id
                  ? { ...q, executed_at: new Date().toISOString(), results_count: optimisticResults.length }
                  : q
              )
            );
            totalResults += optimisticResults.length;

            // Background save
            backgroundSaves.push(
              webSearchApi.submitClientResults({
                query_id: query.id,
                results: mappedResults,
              }).then(resp => {
                if (resp.success && resp.data?.results?.length) {
                  setResults(prev => {
                    const other = prev.filter(r => r.query !== query.id);
                    return [...other, ...resp.data!.results];
                  });
                }
              }).catch(err => console.error('Background save failed:', err))
            );
          } catch (err) {
            errorCount++;
            console.error(`Client-side search failed for query ${query.id}:`, err);
          }
        }

        toast.success(
          `Executed ${unexecuted.length - errorCount} queries — ${totalResults} results` +
          (errorCount > 0 ? ` (${errorCount} failed)` : '')
        );

        // Wait for background saves silently
        Promise.all(backgroundSaves).catch(() => {});
        return;
      } else {
        // SERVER-SIDE (existing path)
        const response = await webSearchApi.executeAllQueries(sessionId);
        if (response.success && response.data) {
          const newResults = Array.isArray(response.data) ? response.data : [];
          setResults(newResults);
          await fetchSession();
          toast.success(`Executed queries — ${newResults.length} results found`);
          return newResults;
        }
        throw new Error(response.error || 'Failed to execute queries');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to execute queries';
      toast.error(message);
      throw err;
    } finally {
      setExecuting(false);
    }
  }, [sessionId, queries, searchConfig, fetchSession]);

  const createQuery = useCallback(async (data: CreateQueryRequest) => {
    try {
      const response = await webSearchApi.createQuery(data);
      if (response.success && response.data) {
        setQueries(prev => [...prev, response.data!]);
        toast.success('Query added');
        return response.data;
      }
      throw new Error(response.error || 'Failed to create query');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create query';
      toast.error(message);
      throw err;
    }
  }, []);

  const updateQuery = useCallback(async (queryId: string, data: Partial<Pick<SearchQuery, 'query_text' | 'category' | 'site_filter' | 'file_type' | 'date_restrict' | 'exact_terms' | 'exclude_terms'>>) => {
    try {
      const response = await webSearchApi.updateQuery(queryId, data);
      if (response.success && response.data) {
        setQueries(prev => prev.map(q => q.id === queryId ? response.data! : q));
        toast.success('Query updated');
        return response.data;
      }
      throw new Error(response.error || 'Failed to update query');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update query';
      toast.error(message);
      throw err;
    }
  }, []);

  const deleteQuery = useCallback(async (queryId: string) => {
    try {
      const response = await webSearchApi.deleteQuery(queryId);
      if (response.success) {
        setQueries(prev => prev.filter(q => q.id !== queryId));
        setResults(prev => prev.filter(r => r.query !== queryId));
        toast.success('Query deleted');
      } else {
        throw new Error(response.error || 'Failed to delete query');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete query';
      toast.error(message);
      throw err;
    }
  }, []);

  const updateResult = useCallback(async (resultId: string, data: UpdateResultRequest) => {
    try {
      const response = await webSearchApi.updateResult(resultId, data);
      if (response.success && response.data) {
        setResults(prev => prev.map(r => r.id === resultId ? response.data! : r));
        // Show contextual toast
        if (data.is_flagged !== undefined) {
          toast.success(data.is_flagged ? 'Result flagged' : 'Flag removed');
        } else if (data.is_saved !== undefined) {
          toast.success(data.is_saved ? 'Result saved' : 'Removed from saved');
        } else {
          toast.success('Result updated');
        }
        return response.data;
      }
      throw new Error(response.error || 'Failed to update result');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update result';
      toast.error(message);
      throw err;
    }
  }, []);

  return {
    session,
    queries,
    results,
    loading,
    executing,
    executingQueryId,
    error,
    fetchSession,
    fetchResults,
    generateQueries,
    executeAllQueries,
    executeQuery,
    createQuery,
    updateQuery,
    deleteQuery,
    updateResult,
  };
}

// ==================== Hook for Quota Info ====================

export function useWebSearchQuota() {
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQuota = useCallback(async () => {
    try {
      setLoading(true);
      const response = await webSearchApi.getQuota();
      if (response.success && response.data) {
        setQuota(response.data);
      } else {
        console.error('Failed to fetch quota:', response.error);
      }
    } catch (err) {
      console.error('Quota fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  return {
    quota,
    loading,
    fetchQuota,
  };
}
