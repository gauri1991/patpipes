'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  infringementApi,
  InfringementCase,
  DashboardStats,
  ClaimMapping,
  Evidence,
  RiskAssessment,
  InfringementReport
} from '@/services/infringementApi';
import { toast } from 'sonner';

// ==================== Hook for Infringement Cases ====================

export function useInfringementCases(params?: {
  status?: string;
  analysis_type?: string;
  risk_level?: string;
  patent_number?: string;
  accused_party_name?: string;
  search?: string;
  page?: number;
  page_size?: number;
}) {
  const [cases, setCases] = useState<InfringementCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize params to prevent unnecessary re-renders
  const memoizedParams = useMemo(() => params, [
    params?.status,
    params?.analysis_type,
    params?.risk_level,
    params?.patent_number,
    params?.accused_party_name,
    params?.search,
    params?.page,
    params?.page_size
  ]);

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await infringementApi.getCases(memoizedParams);
      if (response.success && response.data) {
        // Handle DRF paginated response { count, next, previous, results: [...] }
        const data = response.data as any;
        const casesList = Array.isArray(data) ? data : (data.results ?? [data]);
        setCases(casesList);
      } else {
        throw new Error(response.error || 'Failed to fetch cases');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch cases';
      setError(message);
      console.error('Cases fetch error:', err);
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const createCase = useCallback(async (data: Partial<InfringementCase>) => {
    try {
      const response = await infringementApi.createCase(data);
      if (response.success && response.data) {
        setCases(prev => [response.data!, ...prev]);
        toast.success('Case created successfully');
        return response.data;
      }
      throw new Error(response.error || 'Failed to create case');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create case';
      toast.error(message);
      throw err;
    }
  }, []);

  const updateCase = useCallback(async (id: string, data: Partial<InfringementCase>) => {
    try {
      const response = await infringementApi.updateCase(id, data);
      if (response.success && response.data) {
        setCases(prev => prev.map(c => c.id === id ? response.data! : c));
        toast.success('Case updated successfully');
        return response.data;
      }
      throw new Error(response.error || 'Failed to update case');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update case';
      toast.error(message);
      throw err;
    }
  }, []);

  const deleteCase = useCallback(async (id: string) => {
    try {
      const response = await infringementApi.deleteCase(id);
      if (response.success) {
        setCases(prev => prev.filter(c => c.id !== id));
        toast.success('Case deleted successfully');
      } else {
        throw new Error(response.error || 'Failed to delete case');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete case';
      toast.error(message);
      throw err;
    }
  }, []);

  const updateRiskLevel = useCallback(async (caseId: string, riskLevel: string) => {
    try {
      const response = await infringementApi.updateRiskLevel(caseId, riskLevel);
      if (response.success && response.data) {
        setCases(prev => prev.map(c => c.id === caseId ? response.data! : c));
        toast.success('Risk level updated successfully');
        return response.data;
      }
      throw new Error(response.error || 'Failed to update risk level');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update risk level';
      toast.error(message);
      throw err;
    }
  }, []);

  return {
    cases,
    loading,
    error,
    refresh: fetchCases,
    createCase,
    updateCase,
    deleteCase,
    updateRiskLevel
  };
}

// ==================== Hook for Dashboard Stats ====================

export function useInfringementDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await infringementApi.getDashboardStats();
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch dashboard stats');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch dashboard stats';
      setError(message);
      console.error('Dashboard stats fetch error:', err);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats
  };
}

// ==================== Hook for Claim Mappings ====================

export function useClaimMappings(params?: {
  case?: string;
  mapping_type?: string;
  limitations_met?: boolean;
}) {
  const [claimMappings, setClaimMappings] = useState<ClaimMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const memoizedParams = useMemo(() => params, [
    params?.case,
    params?.mapping_type,
    params?.limitations_met
  ]);

  const fetchClaimMappings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await infringementApi.getClaimMappings(memoizedParams);
      if (response.success && response.data) {
        const data = response.data as any;
        const list = Array.isArray(data) ? data : (data.results ?? [data]);
        setClaimMappings(list);
      } else {
        throw new Error(response.error || 'Failed to fetch claim mappings');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch claim mappings';
      setError(message);
      console.error('Claim mappings fetch error:', err);
      setClaimMappings([]);
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchClaimMappings();
  }, [fetchClaimMappings]);

  const createClaimMapping = useCallback(async (data: Partial<ClaimMapping>) => {
    try {
      const response = await infringementApi.createClaimMapping(data);
      if (response.success && response.data) {
        setClaimMappings(prev => [response.data!, ...prev]);
        toast.success('Claim mapping created successfully');
        return response.data;
      }
      throw new Error(response.error || 'Failed to create claim mapping');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create claim mapping';
      toast.error(message);
      throw err;
    }
  }, []);

  const updateClaimMapping = useCallback(async (id: string, data: Partial<ClaimMapping>) => {
    try {
      const response = await infringementApi.updateClaimMapping(id, data);
      if (response.success && response.data) {
        setClaimMappings(prev => prev.map(cm => cm.id === id ? response.data! : cm));
        toast.success('Claim mapping updated successfully');
        return response.data;
      }
      throw new Error(response.error || 'Failed to update claim mapping');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update claim mapping';
      toast.error(message);
      throw err;
    }
  }, []);

  const deleteClaimMapping = useCallback(async (id: string) => {
    try {
      const response = await infringementApi.deleteClaimMapping(id);
      if (response.success) {
        setClaimMappings(prev => prev.filter(cm => cm.id !== id));
        toast.success('Claim mapping deleted successfully');
      } else {
        throw new Error(response.error || 'Failed to delete claim mapping');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete claim mapping';
      toast.error(message);
      throw err;
    }
  }, []);

  return {
    claimMappings,
    loading,
    error,
    refresh: fetchClaimMappings,
    createClaimMapping,
    updateClaimMapping,
    deleteClaimMapping
  };
}

// ==================== Hook for Evidence ====================

export function useEvidence(params?: {
  case?: string;
  evidence_type?: string;
  search?: string;
}) {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const memoizedParams = useMemo(() => params, [
    params?.case,
    params?.evidence_type,
    params?.search
  ]);

  const fetchEvidence = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await infringementApi.getEvidence(memoizedParams);
      if (response.success && response.data) {
        const data = response.data as any;
        const list = Array.isArray(data) ? data : (data.results ?? [data]);
        setEvidence(list);
      } else {
        throw new Error(response.error || 'Failed to fetch evidence');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch evidence';
      setError(message);
      console.error('Evidence fetch error:', err);
      setEvidence([]);
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);

  const createEvidence = useCallback(async (data: FormData | Partial<Evidence>) => {
    try {
      const response = await infringementApi.createEvidence(data);
      if (response.success && response.data) {
        setEvidence(prev => [response.data!, ...prev]);
        toast.success('Evidence uploaded successfully');
        return response.data;
      }
      throw new Error(response.error || 'Failed to upload evidence');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload evidence';
      toast.error(message);
      throw err;
    }
  }, []);

  const updateEvidence = useCallback(async (id: string, data: Partial<Evidence>) => {
    try {
      const response = await infringementApi.updateEvidence(id, data);
      if (response.success && response.data) {
        setEvidence(prev => prev.map(e => e.id === id ? response.data! : e));
        toast.success('Evidence updated successfully');
        return response.data;
      }
      throw new Error(response.error || 'Failed to update evidence');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update evidence';
      toast.error(message);
      throw err;
    }
  }, []);

  const deleteEvidence = useCallback(async (id: string) => {
    try {
      const response = await infringementApi.deleteEvidence(id);
      if (response.success) {
        setEvidence(prev => prev.filter(e => e.id !== id));
        toast.success('Evidence deleted successfully');
      } else {
        throw new Error(response.error || 'Failed to delete evidence');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete evidence';
      toast.error(message);
      throw err;
    }
  }, []);

  return {
    evidence,
    loading,
    error,
    refresh: fetchEvidence,
    createEvidence,
    updateEvidence,
    deleteEvidence
  };
}

// ==================== Hook for Risk Assessments ====================

export function useRiskAssessments(params?: {
  case?: string;
  risk_factor?: string;
}) {
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const memoizedParams = useMemo(() => params, [
    params?.case,
    params?.risk_factor
  ]);

  const fetchRiskAssessments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await infringementApi.getRiskAssessments(memoizedParams);
      if (response.success && response.data) {
        const data: any = response.data;
        // Unwrap DRF pagination ({ count, results }) like the other list hooks.
        setRiskAssessments(Array.isArray(data) ? data : (data.results ?? []));
      } else {
        throw new Error(response.error || 'Failed to fetch risk assessments');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch risk assessments';
      setError(message);
      console.error('Risk assessments fetch error:', err);
      setRiskAssessments([]);
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchRiskAssessments();
  }, [fetchRiskAssessments]);

  const createRiskAssessment = useCallback(async (data: Partial<RiskAssessment>) => {
    try {
      const response = await infringementApi.createRiskAssessment(data);
      if (response.success && response.data) {
        setRiskAssessments(prev => [response.data!, ...prev]);
        toast.success('Risk assessment created successfully');
        return response.data;
      }
      throw new Error(response.error || 'Failed to create risk assessment');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create risk assessment';
      toast.error(message);
      throw err;
    }
  }, []);

  const updateRiskAssessment = useCallback(async (id: string, data: Partial<RiskAssessment>) => {
    try {
      const response = await infringementApi.updateRiskAssessment(id, data);
      if (response.success && response.data) {
        setRiskAssessments(prev => prev.map(ra => ra.id === id ? response.data! : ra));
        toast.success('Risk assessment updated successfully');
        return response.data;
      }
      throw new Error(response.error || 'Failed to update risk assessment');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update risk assessment';
      toast.error(message);
      throw err;
    }
  }, []);

  const deleteRiskAssessment = useCallback(async (id: string) => {
    try {
      const response = await infringementApi.deleteRiskAssessment(id);
      if (response.success) {
        setRiskAssessments(prev => prev.filter(ra => ra.id !== id));
        toast.success('Risk assessment deleted successfully');
      } else {
        throw new Error(response.error || 'Failed to delete risk assessment');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete risk assessment';
      toast.error(message);
      throw err;
    }
  }, []);

  return {
    riskAssessments,
    loading,
    error,
    refresh: fetchRiskAssessments,
    createRiskAssessment,
    updateRiskAssessment,
    deleteRiskAssessment
  };
}

// ==================== Hook for Infringement Reports ====================

export function useInfringementReports(params?: {
  case?: string;
  report_type?: string;
  status?: string;
}) {
  const [reports, setReports] = useState<InfringementReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const memoizedParams = useMemo(() => params, [
    params?.case,
    params?.report_type,
    params?.status
  ]);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await infringementApi.getReports(memoizedParams);
      if (response.success && response.data) {
        const data: any = response.data;
        // Unwrap DRF pagination ({ count, results }) like the other list hooks.
        setReports(Array.isArray(data) ? data : (data.results ?? []));
      } else {
        throw new Error(response.error || 'Failed to fetch reports');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch reports';
      setError(message);
      console.error('Reports fetch error:', err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const createReport = useCallback(async (data: Partial<InfringementReport>) => {
    try {
      const response = await infringementApi.createReport(data);
      if (response.success && response.data) {
        setReports(prev => [response.data!, ...prev]);
        toast.success('Report created successfully');
        return response.data;
      }
      throw new Error(response.error || 'Failed to create report');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create report';
      toast.error(message);
      throw err;
    }
  }, []);

  const updateReport = useCallback(async (id: string, data: Partial<InfringementReport>) => {
    try {
      const response = await infringementApi.updateReport(id, data);
      if (response.success && response.data) {
        setReports(prev => prev.map(r => r.id === id ? response.data! : r));
        toast.success('Report updated successfully');
        return response.data;
      }
      throw new Error(response.error || 'Failed to update report');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update report';
      toast.error(message);
      throw err;
    }
  }, []);

  const reviewReport = useCallback(async (id: string, reviewNotes: string) => {
    try {
      const response = await infringementApi.reviewReport(id, reviewNotes);
      if (response.success && response.data) {
        setReports(prev => prev.map(r => r.id === id ? response.data! : r));
        toast.success('Report reviewed successfully');
        return response.data;
      }
      throw new Error(response.error || 'Failed to review report');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to review report';
      toast.error(message);
      throw err;
    }
  }, []);

  const deleteReport = useCallback(async (id: string) => {
    try {
      const response = await infringementApi.deleteReport(id);
      if (response.success) {
        setReports(prev => prev.filter(r => r.id !== id));
        toast.success('Report deleted successfully');
      } else {
        throw new Error(response.error || 'Failed to delete report');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete report';
      toast.error(message);
      throw err;
    }
  }, []);

  return {
    reports,
    loading,
    error,
    refresh: fetchReports,
    createReport,
    updateReport,
    reviewReport,
    deleteReport
  };
}

// ==================== Hook for Single Infringement Case ====================

export function useInfringementCase(caseId: string | null) {
  const [caseData, setCaseData] = useState<InfringementCase | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCase = useCallback(async () => {
    if (!caseId) {
      setCaseData(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await infringementApi.getCase(caseId);
      if (response.success && response.data) {
        setCaseData(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch case');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch case';
      setError(message);
      console.error('Case fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  const updateCase = useCallback(async (data: Partial<InfringementCase>) => {
    if (!caseId) return;

    try {
      const response = await infringementApi.updateCase(caseId, data);
      if (response.success && response.data) {
        setCaseData(response.data);
        toast.success('Case updated successfully');
        return response.data;
      }
      throw new Error(response.error || 'Failed to update case');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update case';
      toast.error(message);
      throw err;
    }
  }, [caseId]);

  return {
    caseData,
    loading,
    error,
    refresh: fetchCase,
    updateCase,
  };
}

