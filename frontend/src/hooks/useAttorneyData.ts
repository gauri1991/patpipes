'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  attorneyApi,
  LawFirm,
  Attorney,
  AttorneyReview,
  AttorneyConnection,
  DirectoryStats,
  AttorneySearchParams
} from '@/services/attorneyApi';
import { toast } from 'sonner';

// ==================== Hook for Law Firms ====================

export function useLawFirms(params?: {
  firm_size?: string;
  country?: string;
  city?: string;
  is_verified?: boolean;
  is_active?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  ordering?: string;
}) {
  const [lawFirms, setLawFirms] = useState<LawFirm[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const memoizedParams = useMemo(() => params, [
    params?.firm_size,
    params?.country,
    params?.city,
    params?.is_verified,
    params?.is_active,
    params?.search,
    params?.limit,
    params?.offset,
    params?.ordering
  ]);

  const fetchLawFirms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await attorneyApi.getLawFirms(memoizedParams);
      if (response.success && response.data) {
        const data = response.data;
        if (Array.isArray(data)) {
          setLawFirms(data);
          setTotalCount(data.length);
        } else {
          setLawFirms((data as any).results ?? []);
          setTotalCount((data as any).count ?? 0);
        }
      } else {
        throw new Error(response.error || 'Failed to fetch law firms');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch law firms';
      setError(message);
      console.error('Law firms fetch error:', err);
      setLawFirms(getMockLawFirms());
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchLawFirms();
  }, [fetchLawFirms]);

  const createLawFirm = useCallback(async (data: Partial<LawFirm>) => {
    try {
      const response = await attorneyApi.createLawFirm(data);
      if (response.success && response.data) {
        setLawFirms(prev => [response.data!, ...prev]);
        toast.success('Law firm created successfully');
        return response.data;
      }
      throw new Error(response.error || 'Failed to create law firm');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create law firm';
      toast.error(message);
      throw err;
    }
  }, []);

  const updateLawFirm = useCallback(async (id: string, data: Partial<LawFirm>) => {
    try {
      const response = await attorneyApi.updateLawFirm(id, data);
      if (response.success && response.data) {
        setLawFirms(prev => prev.map(f => f.id === id ? response.data! : f));
        toast.success('Law firm updated successfully');
        return response.data;
      }
      throw new Error(response.error || 'Failed to update law firm');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update law firm';
      toast.error(message);
      throw err;
    }
  }, []);

  const deleteLawFirm = useCallback(async (id: string) => {
    try {
      const response = await attorneyApi.deleteLawFirm(id);
      if (response.success) {
        setLawFirms(prev => prev.filter(f => f.id !== id));
        toast.success('Law firm deleted successfully');
      } else {
        throw new Error(response.error || 'Failed to delete law firm');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete law firm';
      toast.error(message);
      throw err;
    }
  }, []);

  return {
    lawFirms,
    totalCount,
    loading,
    error,
    refresh: fetchLawFirms,
    createLawFirm,
    updateLawFirm,
    deleteLawFirm
  };
}

// ==================== Hook for Attorneys ====================

export function useAttorneys(params?: {
  experience_level?: string;
  independent?: boolean;
  is_verified?: boolean;
  is_featured?: boolean;
  is_active?: boolean;
  accepting_new_clients?: boolean;
  search?: string;
  source?: string;
  practitioner_type?: string;
  limit?: number;
  offset?: number;
  ordering?: string;
}) {
  const [attorneys, setAttorneys] = useState<Attorney[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const memoizedParams = useMemo(() => params, [
    params?.experience_level,
    params?.independent,
    params?.is_verified,
    params?.is_featured,
    params?.is_active,
    params?.accepting_new_clients,
    params?.search,
    params?.source,
    params?.practitioner_type,
    params?.limit,
    params?.offset,
    params?.ordering,
  ]);

  const fetchAttorneys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await attorneyApi.getAttorneys(memoizedParams);
      if (response.success && response.data) {
        const data = response.data;
        // Handle DRF paginated response { count, results: [...] }
        if (Array.isArray(data)) {
          setAttorneys(data);
          setTotalCount(data.length);
        } else {
          setAttorneys((data as any).results ?? []);
          setTotalCount((data as any).count ?? 0);
        }
      } else {
        throw new Error(response.error || 'Failed to fetch attorneys');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch attorneys';
      setError(message);
      console.error('Attorneys fetch error:', err);
      setAttorneys(getMockAttorneys());
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchAttorneys();
  }, [fetchAttorneys]);

  const createAttorney = useCallback(async (data: Partial<Attorney>) => {
    try {
      const response = await attorneyApi.createAttorney(data);
      if (response.success && response.data) {
        setAttorneys(prev => [response.data!, ...prev]);
        toast.success('Attorney profile created successfully');
        return response.data;
      }
      throw new Error(response.error || 'Failed to create attorney');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create attorney';
      toast.error(message);
      throw err;
    }
  }, []);

  const updateAttorney = useCallback(async (id: string, data: Partial<Attorney>) => {
    try {
      const response = await attorneyApi.updateAttorney(id, data);
      if (response.success && response.data) {
        setAttorneys(prev => prev.map(a => a.id === id ? response.data! : a));
        toast.success('Attorney profile updated successfully');
        return response.data;
      }
      throw new Error(response.error || 'Failed to update attorney');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update attorney';
      toast.error(message);
      throw err;
    }
  }, []);

  const deleteAttorney = useCallback(async (id: string) => {
    try {
      const response = await attorneyApi.deleteAttorney(id);
      if (response.success) {
        setAttorneys(prev => prev.filter(a => a.id !== id));
        toast.success('Attorney profile deleted successfully');
      } else {
        throw new Error(response.error || 'Failed to delete attorney');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete attorney';
      toast.error(message);
      throw err;
    }
  }, []);

  return {
    attorneys,
    totalCount,
    loading,
    error,
    refresh: fetchAttorneys,
    createAttorney,
    updateAttorney,
    deleteAttorney
  };
}

// ==================== Hook for Attorney Search ====================

export function useAttorneySearch() {
  const [searchResults, setSearchResults] = useState<Attorney[]>([]);
  const [resultCount, setResultCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (searchParams: AttorneySearchParams) => {
    try {
      setLoading(true);
      setError(null);
      const response = await attorneyApi.searchAttorneys(searchParams);
      if (response.success && response.data) {
        setSearchResults(response.data.results);
        setResultCount(response.data.count);
      } else {
        throw new Error(response.error || 'Failed to search attorneys');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to search attorneys';
      setError(message);
      console.error('Attorney search error:', err);
      setSearchResults([]);
      setResultCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    searchResults,
    resultCount,
    loading,
    error,
    search
  };
}

// ==================== Hook for Featured Attorneys ====================

export function useFeaturedAttorneys() {
  const [featured, setFeatured] = useState<Attorney[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeatured = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await attorneyApi.getFeaturedAttorneys();
      if (response.success && response.data) {
        const data = response.data;
        const items = Array.isArray(data) ? data : (data as any).results ?? [data];
        setFeatured(items);
      } else {
        throw new Error(response.error || 'Failed to fetch featured attorneys');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch featured attorneys';
      setError(message);
      console.error('Featured attorneys fetch error:', err);
      setFeatured([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatured();
  }, [fetchFeatured]);

  return {
    featured,
    loading,
    error,
    refresh: fetchFeatured
  };
}

// ==================== Hook for Directory Stats ====================

export function useAttorneyDirectoryStats() {
  const [stats, setStats] = useState<DirectoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await attorneyApi.getAttorneyStats();
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch directory stats');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch directory stats';
      setError(message);
      console.error('Directory stats fetch error:', err);
      setStats(getMockDirectoryStats());
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

// ==================== Hook for Law Firm Stats ====================

export function useLawFirmStats() {
  const [stats, setStats] = useState<DirectoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await attorneyApi.getLawFirmStats();
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch law firm stats');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch law firm stats';
      setError(message);
      console.error('Law firm stats fetch error:', err);
      setStats(getMockLawFirmStats());
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

// ==================== Hook for Attorney Reviews ====================

export function useAttorneyReviews(params?: {
  attorney?: string;
  rating?: number;
  is_verified?: boolean;
  is_approved?: boolean;
  would_recommend?: boolean;
}) {
  const [reviews, setReviews] = useState<AttorneyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const memoizedParams = useMemo(() => params, [
    params?.attorney,
    params?.rating,
    params?.is_verified,
    params?.is_approved,
    params?.would_recommend
  ]);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await attorneyApi.getReviews(memoizedParams);
      if (response.success && response.data) {
        const data = response.data;
        const items = Array.isArray(data) ? data : (data as any).results ?? [data];
        setReviews(items);
      } else {
        throw new Error(response.error || 'Failed to fetch reviews');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch reviews';
      setError(message);
      console.error('Reviews fetch error:', err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const createReview = useCallback(async (data: Partial<AttorneyReview>) => {
    try {
      const response = await attorneyApi.createReview(data);
      if (response.success && response.data) {
        setReviews(prev => [response.data!, ...prev]);
        toast.success('Review submitted successfully');
        return response.data;
      }
      throw new Error(response.error || 'Failed to submit review');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit review';
      toast.error(message);
      throw err;
    }
  }, []);

  return {
    reviews,
    loading,
    error,
    refresh: fetchReviews,
    createReview
  };
}

// ==================== Hook for Attorney Connections ====================

export function useAttorneyConnections(params?: {
  user?: string;
  attorney?: string;
  status?: string;
  connection_type?: string;
}) {
  const [connections, setConnections] = useState<AttorneyConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const memoizedParams = useMemo(() => params, [
    params?.user,
    params?.attorney,
    params?.status,
    params?.connection_type
  ]);

  const fetchConnections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await attorneyApi.getConnections(memoizedParams);
      if (response.success && response.data) {
        const data = response.data;
        const items = Array.isArray(data) ? data : (data as any).results ?? [data];
        setConnections(items);
      } else {
        throw new Error(response.error || 'Failed to fetch connections');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch connections';
      setError(message);
      console.error('Connections fetch error:', err);
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const createConnection = useCallback(async (data: Partial<AttorneyConnection>) => {
    try {
      const response = await attorneyApi.createConnection(data);
      if (response.success && response.data) {
        setConnections(prev => [response.data!, ...prev]);
        toast.success('Connection request sent successfully');
        return response.data;
      }
      throw new Error(response.error || 'Failed to create connection');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create connection';
      toast.error(message);
      throw err;
    }
  }, []);

  const acceptConnection = useCallback(async (id: string, response?: string) => {
    try {
      const result = await attorneyApi.acceptConnection(id, response);
      if (result.success && result.data) {
        setConnections(prev => prev.map(c => c.id === id ? result.data!.connection : c));
        toast.success('Connection accepted');
        return result.data.connection;
      }
      throw new Error(result.error || 'Failed to accept connection');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to accept connection';
      toast.error(message);
      throw err;
    }
  }, []);

  const declineConnection = useCallback(async (id: string, response?: string) => {
    try {
      const result = await attorneyApi.declineConnection(id, response);
      if (result.success && result.data) {
        setConnections(prev => prev.map(c => c.id === id ? result.data!.connection : c));
        toast.success('Connection declined');
        return result.data.connection;
      }
      throw new Error(result.error || 'Failed to decline connection');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to decline connection';
      toast.error(message);
      throw err;
    }
  }, []);

  return {
    connections,
    loading,
    error,
    refresh: fetchConnections,
    createConnection,
    acceptConnection,
    declineConnection
  };
}

// ==================== Mock Data Fallbacks ====================

function getMockLawFirms(): LawFirm[] {
  return [
    {
      id: '00000001-0000-0000-0000-000000000000',
      name: 'IP Legal Partners LLP',
      website: 'https://iplegalpartners.com',
      email: 'info@iplegalpartners.com',
      phone: '+1 (415) 555-0100',
      city: 'San Francisco',
      state: 'California',
      country: 'United States',
      firm_size: 'medium',
      established_year: 2005,
      description: 'Full-service IP law firm specializing in patents and trademarks with expertise in software and biotechnology',
      practice_areas: ['Patent Prosecution', 'Patent Litigation', 'Trademark', 'IP Strategy'],
      technology_focus: ['Software', 'Biotechnology', 'Electronics'],
      rating: 4.7,
      review_count: 45,
      is_verified: true,
      is_active: true,
      attorney_count: 12,
      created_at: '2023-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    {
      id: '00000002-0000-0000-0000-000000000000',
      name: 'TechPatent Associates',
      website: 'https://techpatent.com',
      email: 'contact@techpatent.com',
      phone: '+1 (650) 555-0200',
      city: 'Palo Alto',
      state: 'California',
      country: 'United States',
      firm_size: 'small',
      established_year: 2015,
      description: 'Boutique patent firm focused on emerging technologies including AI, machine learning, and blockchain',
      practice_areas: ['Patent Prosecution', 'IP Licensing', 'Patent Portfolio Management'],
      technology_focus: ['AI/ML', 'Software', 'Blockchain'],
      rating: 4.9,
      review_count: 28,
      is_verified: true,
      is_active: true,
      attorney_count: 8,
      created_at: '2023-03-20T10:00:00Z',
      updated_at: '2024-03-20T10:00:00Z'
    },
    {
      id: '00000003-0000-0000-0000-000000000000',
      name: 'Global IP Solutions',
      website: 'https://globalipsolutions.com',
      email: 'info@globalipsolutions.com',
      phone: '+1 (212) 555-0300',
      city: 'New York',
      state: 'New York',
      country: 'United States',
      firm_size: 'large',
      established_year: 1998,
      description: 'International IP law firm with offices worldwide, providing comprehensive patent and trademark services',
      practice_areas: ['Patent Prosecution', 'Patent Litigation', 'Trademark', 'Copyright', 'Trade Secrets'],
      technology_focus: ['Pharmaceuticals', 'Biotechnology', 'Medical Devices', 'Chemical'],
      rating: 4.6,
      review_count: 87,
      is_verified: true,
      is_active: true,
      attorney_count: 45,
      created_at: '2023-01-10T10:00:00Z',
      updated_at: '2024-01-10T10:00:00Z'
    },
    {
      id: '00000004-0000-0000-0000-000000000000',
      name: 'Innovation Law Group',
      website: 'https://innovationlawgroup.com',
      email: 'hello@innovationlawgroup.com',
      phone: '+1 (512) 555-0400',
      city: 'Austin',
      state: 'Texas',
      country: 'United States',
      firm_size: 'medium',
      established_year: 2010,
      description: 'Patent attorneys helping startups and enterprises protect their innovations in fast-moving tech sectors',
      practice_areas: ['Patent Prosecution', 'IP Strategy', 'Patent Portfolio Management', 'IP Licensing'],
      technology_focus: ['Software', 'Electronics', 'Telecommunications', 'IoT'],
      rating: 4.8,
      review_count: 52,
      is_verified: true,
      is_active: true,
      attorney_count: 18,
      created_at: '2023-02-15T10:00:00Z',
      updated_at: '2024-02-15T10:00:00Z'
    },
    {
      id: '00000005-0000-0000-0000-000000000000',
      name: 'BioPharma Patent Counsel',
      website: 'https://biopharmpatents.com',
      email: 'info@biopharmpatents.com',
      phone: '+1 (617) 555-0500',
      city: 'Boston',
      state: 'Massachusetts',
      country: 'United States',
      firm_size: 'medium',
      established_year: 2008,
      description: 'Specialized patent firm focusing exclusively on biotechnology, pharmaceuticals, and life sciences',
      practice_areas: ['Patent Prosecution', 'Patent Litigation', 'IP Licensing', 'FDA Regulatory'],
      technology_focus: ['Pharmaceuticals', 'Biotechnology', 'Medical Devices', 'Genomics'],
      rating: 4.9,
      review_count: 39,
      is_verified: true,
      is_active: true,
      attorney_count: 15,
      created_at: '2023-02-28T10:00:00Z',
      updated_at: '2024-02-28T10:00:00Z'
    },
    {
      id: '00000006-0000-0000-0000-000000000000',
      name: 'Pacific IP Associates',
      website: 'https://pacificip.com',
      email: 'contact@pacificip.com',
      phone: '+1 (206) 555-0600',
      city: 'Seattle',
      state: 'Washington',
      country: 'United States',
      firm_size: 'small',
      established_year: 2012,
      description: 'Regional patent firm serving tech companies in the Pacific Northwest with personalized service',
      practice_areas: ['Patent Prosecution', 'Trademark', 'Copyright'],
      technology_focus: ['Software', 'Cloud Computing', 'Gaming', 'E-commerce'],
      rating: 4.5,
      review_count: 31,
      is_verified: true,
      is_active: true,
      attorney_count: 6,
      created_at: '2023-04-10T10:00:00Z',
      updated_at: '2024-04-10T10:00:00Z'
    }
  ];
}

function getMockAttorneys(): Attorney[] {
  return [
    {
      id: '00000001-0000-0000-0000-000000000000',
      first_name: 'Sarah',
      last_name: 'Johnson',
      full_name: 'Sarah Johnson',
      email: 'sarah.johnson@iplegalpartners.com',
      phone: '+1-555-0101',
      title: 'Partner',
      independent: false,
      bar_admissions: ['California', 'New York'],
      registration_number: '123456',
      admitted_year: 2008,
      law_school: 'Stanford Law School',
      law_school_grad_year: 2008,
      experience_level: 'partner',
      years_of_experience: 16,
      specializations: ['Patent Prosecution', 'Software Patents'],
      technology_areas: ['Software', 'AI/ML', 'Cloud Computing'],
      industries_served: ['Technology', 'FinTech'],
      bio: 'Experienced patent attorney specializing in software and AI patents',
      languages: ['English', 'Spanish'],
      hourly_rate_min: 500,
      hourly_rate_max: 750,
      accepting_new_clients: true,
      available_for_consultation: true,
      consultation_fee: 250,
      cases_handled: 150,
      patents_drafted: 200,
      patents_granted: 180,
      success_rate: 90,
      rating: 4.8,
      review_count: 32,
      source: 'manual' as const,
      govt_employee: false,
      is_verified: true,
      is_featured: true,
      is_active: true,
      created_at: '2023-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    }
  ];
}

function getMockDirectoryStats(): DirectoryStats {
  return {
    total_attorneys: 250,
    verified_attorneys: 180,
    accepting_clients: 150,
    by_experience_level: {
      junior: 45,
      mid_level: 80,
      senior: 75,
      partner: 50
    },
    avg_rating: 4.5,
    avg_years_experience: 12.5
  };
}

function getMockLawFirmStats(): DirectoryStats {
  return {
    total_firms: 48,
    verified_firms: 35,
    firms_by_size: {
      solo: 8,
      small: 15,
      medium: 12,
      large: 8,
      enterprise: 5
    },
    firms_by_country: {
      'United States': 28,
      'United Kingdom': 8,
      'Germany': 5,
      'Canada': 4,
      'Australia': 3
    },
    total_attorneys: 0,
    verified_attorneys: 0,
    accepting_clients: 0,
    by_experience_level: {},
    avg_rating: 4.6,
    avg_years_experience: 0
  };
}
