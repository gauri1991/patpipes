'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  prosecutionApi,
  PatentApplication,
  DashboardStats,
  ProsecutionEvent,
  OfficeAction,
  ProsecutionDeadline,
  ProsecutionDocument,
  Claim
} from '@/services/prosecutionApi';
import { toast } from 'sonner';

// ==================== Hook for Patent Applications ====================

export function useProsecutionApplications(params?: {
  status?: string;
  application_type?: string;
  jurisdiction?: string;
  priority_level?: string;
  attorney?: string;
  search?: string;
  page?: number;
  page_size?: number;
}) {
  const [applications, setApplications] = useState<PatentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize params to prevent unnecessary re-renders
  const memoizedParams = useMemo(() => params, [
    params?.status,
    params?.application_type,
    params?.jurisdiction,
    params?.priority_level,
    params?.attorney,
    params?.search,
    params?.page,
    params?.page_size
  ]);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await prosecutionApi.getApplications(memoizedParams);
      if (response.success && response.data) {
        setApplications(Array.isArray(response.data) ? response.data : [response.data]);
      } else {
        throw new Error(response.error || 'Failed to fetch applications');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch applications';
      setError(message);
      console.error('Applications fetch error:', err);
      // Fallback to mock data (silently)
      setApplications(getMockApplications());
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const createApplication = useCallback(async (data: Partial<PatentApplication>) => {
    try {
      const response = await prosecutionApi.createApplication(data);
      if (response.success && response.data) {
        setApplications(prev => [response.data!, ...prev]);
        toast.success('Application created successfully');
        return response.data;
      }
      throw new Error(response.error || 'Failed to create application');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create application';
      toast.error(message);
      throw err;
    }
  }, []);

  const updateApplication = useCallback(async (id: string, data: Partial<PatentApplication>) => {
    try {
      const response = await prosecutionApi.updateApplication(id, data);
      if (response.success && response.data) {
        setApplications(prev => prev.map(a => a.id === id ? response.data! : a));
        toast.success('Application updated successfully');
        return response.data;
      }
      throw new Error(response.error || 'Failed to update application');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update application';
      toast.error(message);
      throw err;
    }
  }, []);

  const deleteApplication = useCallback(async (id: string) => {
    try {
      const response = await prosecutionApi.deleteApplication(id);
      if (response.success) {
        setApplications(prev => prev.filter(a => a.id !== id));
        toast.success('Application deleted successfully');
      } else {
        throw new Error(response.error || 'Failed to delete application');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete application';
      toast.error(message);
      throw err;
    }
  }, []);

  return {
    applications,
    loading,
    error,
    refresh: fetchApplications,
    createApplication,
    updateApplication,
    deleteApplication
  };
}

// ==================== Hook for Dashboard Stats ====================

export function useProsecutionDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await prosecutionApi.getDashboardStats();
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch dashboard stats');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch dashboard stats';
      setError(message);
      console.error('Dashboard stats fetch error:', err);
      // Fallback to mock data
      setStats(getMockDashboardStats());
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

// ==================== Hook for Prosecution Events ====================

export function useProsecutionEvents(params?: {
  application?: string;
  event_type?: string;
  is_completed?: boolean;
  is_urgent?: boolean;
  search?: string;
}) {
  const [events, setEvents] = useState<ProsecutionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const memoizedParams = useMemo(() => params, [
    params?.application,
    params?.event_type,
    params?.is_completed,
    params?.is_urgent,
    params?.search
  ]);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await prosecutionApi.getEvents(memoizedParams);
      if (response.success && response.data) {
        setEvents(Array.isArray(response.data) ? response.data : [response.data]);
      } else {
        throw new Error(response.error || 'Failed to fetch events');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch events';
      setError(message);
      console.error('Events fetch error:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = useCallback(async (data: Partial<ProsecutionEvent>) => {
    try {
      const response = await prosecutionApi.createEvent(data);
      if (response.success && response.data) {
        setEvents(prev => [response.data!, ...prev]);
        toast.success('Event created successfully');
        return response.data;
      }
      throw new Error(response.error || 'Failed to create event');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create event';
      toast.error(message);
      throw err;
    }
  }, []);

  return {
    events,
    loading,
    error,
    refresh: fetchEvents,
    createEvent
  };
}

// ==================== Hook for Office Actions ====================

export function useOfficeActions(params?: {
  application?: string;
  action_type?: string;
  response_status?: string;
}) {
  const [officeActions, setOfficeActions] = useState<OfficeAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const memoizedParams = useMemo(() => params, [
    params?.application,
    params?.action_type,
    params?.response_status
  ]);

  const fetchOfficeActions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await prosecutionApi.getOfficeActions(memoizedParams);
      if (response.success && response.data) {
        setOfficeActions(Array.isArray(response.data) ? response.data : [response.data]);
      } else {
        throw new Error(response.error || 'Failed to fetch office actions');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch office actions';
      setError(message);
      console.error('Office actions fetch error:', err);
      setOfficeActions([]);
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchOfficeActions();
  }, [fetchOfficeActions]);

  return {
    officeActions,
    loading,
    error,
    refresh: fetchOfficeActions
  };
}

// ==================== Hook for Deadlines ====================

export function useProsecutionDeadlines(params?: {
  application?: string;
  deadline_type?: string;
  priority?: string;
  is_completed?: boolean;
  assigned_to?: string;
  search?: string;
}) {
  const [deadlines, setDeadlines] = useState<ProsecutionDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const memoizedParams = useMemo(() => params, [
    params?.application,
    params?.deadline_type,
    params?.priority,
    params?.is_completed,
    params?.assigned_to,
    params?.search
  ]);

  const fetchDeadlines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await prosecutionApi.getDeadlines(memoizedParams);
      if (response.success && response.data) {
        setDeadlines(Array.isArray(response.data) ? response.data : [response.data]);
      } else {
        throw new Error(response.error || 'Failed to fetch deadlines');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch deadlines';
      setError(message);
      console.error('Deadlines fetch error:', err);
      setDeadlines([]);
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchDeadlines();
  }, [fetchDeadlines]);

  const completeDeadline = useCallback(async (id: string) => {
    try {
      const response = await prosecutionApi.completeDeadline(id);
      if (response.success && response.data) {
        setDeadlines(prev => prev.map(d => d.id === id ? response.data! : d));
        toast.success('Deadline marked as completed');
        return response.data;
      }
      throw new Error(response.error || 'Failed to complete deadline');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete deadline';
      toast.error(message);
      throw err;
    }
  }, []);

  return {
    deadlines,
    loading,
    error,
    refresh: fetchDeadlines,
    completeDeadline
  };
}

// ==================== Hook for Upcoming Deadlines ====================

export function useUpcomingDeadlines(days: number = 30) {
  const [deadlines, setDeadlines] = useState<ProsecutionDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUpcomingDeadlines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await prosecutionApi.getUpcomingDeadlines(days);
      if (response.success && response.data) {
        setDeadlines(Array.isArray(response.data) ? response.data : [response.data]);
      } else {
        throw new Error(response.error || 'Failed to fetch upcoming deadlines');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch upcoming deadlines';
      setError(message);
      console.error('Upcoming deadlines fetch error:', err);
      setDeadlines([]);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchUpcomingDeadlines();
  }, [fetchUpcomingDeadlines]);

  return {
    deadlines,
    loading,
    error,
    refresh: fetchUpcomingDeadlines
  };
}

// ==================== Mock Data Fallbacks ====================

function getMockApplications(): PatentApplication[] {
  return [
    {
      id: '00000001-0000-0000-0000-000000000000',
      title: 'Advanced Machine Learning Algorithm for Patent Analysis',
      application_number: 'US17/123,456',
      patent_number: undefined,
      application_type: 'utility',
      jurisdiction: 'US',
      status: 'under_examination',
      organization: 'org-1',
      attorney: {
        id: '1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Smith',
        name: 'John Smith'
      },
      inventors: ['Jane Doe', 'Bob Smith'],
      assignees: ['Tech Corp'],
      priority_date: undefined,
      filing_date: '2023-12-15',
      publication_date: undefined,
      grant_date: undefined,
      expiry_date: undefined,
      abstract: 'An advanced machine learning system for analyzing patent documents...',
      background: '',
      summary: '',
      detailed_description: '',
      technology_area: 'Artificial Intelligence',
      ipc_classes: ['G06F17/30'],
      us_classes: ['707/10'],
      keywords: ['machine learning', 'patent analysis', 'AI'],
      estimated_value: 1000000,
      costs_to_date: 15000,
      estimated_total_cost: 25000,
      is_confidential: true,
      priority_level: 'high',
      created_at: '2023-12-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    {
      id: '00000002-0000-0000-0000-000000000000',
      title: 'Improved Battery Management System',
      application_number: 'US17/234,567',
      patent_number: undefined,
      application_type: 'utility',
      jurisdiction: 'US',
      status: 'office_action',
      organization: 'org-1',
      attorney: {
        id: '2',
        email: 'sarah@example.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        name: 'Sarah Johnson'
      },
      inventors: ['Mike Wilson'],
      assignees: ['Power Systems Inc'],
      priority_date: undefined,
      filing_date: '2023-11-20',
      publication_date: undefined,
      grant_date: undefined,
      expiry_date: undefined,
      abstract: 'A novel battery management system with improved efficiency...',
      background: '',
      summary: '',
      detailed_description: '',
      technology_area: 'Energy Storage',
      ipc_classes: ['H01M10/42'],
      us_classes: ['429/90'],
      keywords: ['battery', 'management', 'energy'],
      estimated_value: 500000,
      costs_to_date: 12000,
      estimated_total_cost: 20000,
      is_confidential: true,
      priority_level: 'critical',
      created_at: '2023-11-20T10:00:00Z',
      updated_at: '2024-01-08T10:00:00Z'
    },
    {
      id: '00000003-0000-0000-0000-000000000000',
      title: 'Novel User Interface Design',
      application_number: 'US29/345,678',
      patent_number: undefined,
      application_type: 'design',
      jurisdiction: 'US',
      status: 'pending',
      organization: 'org-1',
      attorney: {
        id: '3',
        email: 'mike@example.com',
        firstName: 'Mike',
        lastName: 'Wilson',
        name: 'Mike Wilson'
      },
      inventors: ['Alice Chen'],
      assignees: ['Design Studio LLC'],
      priority_date: undefined,
      filing_date: '2024-01-02',
      publication_date: undefined,
      grant_date: undefined,
      expiry_date: undefined,
      abstract: 'A unique user interface design for mobile applications...',
      background: '',
      summary: '',
      detailed_description: '',
      technology_area: 'User Interface',
      ipc_classes: [],
      us_classes: ['D14/495'],
      keywords: ['UI', 'design', 'mobile'],
      estimated_value: 250000,
      costs_to_date: 5000,
      estimated_total_cost: 8000,
      is_confidential: false,
      priority_level: 'medium',
      created_at: '2024-01-02T10:00:00Z',
      updated_at: '2024-01-05T10:00:00Z'
    }
  ];
}

function getMockDashboardStats(): DashboardStats {
  return {
    total_applications: 15,
    active_applications: 12,
    draft_applications: 3,
    upcoming_deadlines: 7,
    office_actions: 4,
    recent_activity: []
  };
}
