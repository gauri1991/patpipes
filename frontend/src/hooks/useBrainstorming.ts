/**
 * useBrainstorming Hook
 * Custom hook for managing world-class brainstorming functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  brainstormingApi,
  BrainstormingSession,
  IdeationRecord,
  KeywordGeneration,
  ConceptMapping,
  ResearchStrategy,
  CompetitorAnalysis,
  AIInteraction,
  BrainstormingAnalytics
} from '@/services/brainstormingApi';

export function useBrainstorming(projectId?: string) {
  // State management
  const [sessions, setSessions] = useState<BrainstormingSession[]>([]);
  const [currentSession, setCurrentSession] = useState<BrainstormingSession | null>(null);
  const [ideas, setIdeas] = useState<IdeationRecord[]>([]);
  const [keywords, setKeywords] = useState<KeywordGeneration[]>([]);
  const [concepts, setConcepts] = useState<ConceptMapping[]>([]);
  const [strategies, setStrategies] = useState<ResearchStrategy[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorAnalysis[]>([]);
  const [aiInteractions, setAiInteractions] = useState<AIInteraction[]>([]);
  const [analytics, setAnalytics] = useState<BrainstormingAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // SESSION MANAGEMENT
  const fetchSessions = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await brainstormingApi.getSessions({ project_id: projectId });
      
      if (response.success && response.data) {
        setSessions(response.data);
      } else {
        setError(response.error || 'Failed to fetch sessions');
        toast.error('Failed to load brainstorming sessions');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sessions';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const createSession = useCallback(async (data: {
    name: string;
    description: string;
    research_objective: string;
    target_domain?: string;
    research_scope?: Record<string, any>;
  }) => {
    if (!projectId) {
      toast.error('Project ID is required to create a session');
      return null;
    }

    try {
      setLoading(true);
      const response = await brainstormingApi.createSession({
        project: projectId,
        ...data
      });

      if (response.success && response.data) {
        setSessions(prev => [response.data!, ...prev]);
        setCurrentSession(response.data);
        toast.success('Brainstorming session created successfully');
        return response.data;
      } else {
        const errorMsg = response.error || 'Failed to create session';
        setError(errorMsg);
        toast.error(errorMsg);
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create session';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const setActiveSession = useCallback(async (sessionId: string) => {
    try {
      setLoading(true);
      const response = await brainstormingApi.getSession(sessionId);
      
      if (response.success && response.data) {
        setCurrentSession(response.data);
        await Promise.all([
          loadSessionData(sessionId)
        ]);
      } else {
        toast.error('Failed to load session details');
      }
    } catch (err) {
      toast.error('Failed to set active session');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSessionData = useCallback(async (sessionId: string) => {
    try {
      const [
        ideasResponse,
        keywordsResponse,
        conceptsResponse,
        strategiesResponse,
        competitorsResponse,
        aiResponse
      ] = await Promise.all([
        brainstormingApi.getIdeas({ session_id: sessionId }),
        brainstormingApi.getKeywords({ session_id: sessionId }),
        brainstormingApi.getConcepts({ session_id: sessionId }),
        brainstormingApi.getStrategies({ session_id: sessionId }),
        brainstormingApi.getCompetitors({ session_id: sessionId }),
        brainstormingApi.getAIInteractions({ session_id: sessionId })
      ]);

      if (ideasResponse.success && ideasResponse.data) setIdeas(ideasResponse.data);
      if (keywordsResponse.success && keywordsResponse.data) setKeywords(keywordsResponse.data);
      if (conceptsResponse.success && conceptsResponse.data) setConcepts(conceptsResponse.data);
      if (strategiesResponse.success && strategiesResponse.data) setStrategies(strategiesResponse.data);
      if (competitorsResponse.success && competitorsResponse.data) setCompetitors(competitorsResponse.data);
      if (aiResponse.success && aiResponse.data) setAiInteractions(aiResponse.data);
    } catch (err) {
      console.error('Failed to load session data:', err);
    }
  }, []);

  // IDEATION MANAGEMENT
  const createIdea = useCallback(async (data: {
    title: string;
    description: string;
    idea_type: string;
    priority?: string;
    tags?: string[];
    categories?: string[];
    parent_idea?: string;
  }) => {
    if (!currentSession) {
      toast.error('No active brainstorming session');
      return null;
    }

    try {
      const response = await brainstormingApi.createIdea({
        session: currentSession.id,
        ...data
      });

      if (response.success && response.data) {
        setIdeas(prev => [response.data!, ...prev]);
        toast.success('Idea created successfully');
        return response.data;
      } else {
        toast.error(response.error || 'Failed to create idea');
        return null;
      }
    } catch (err) {
      toast.error('Failed to create idea');
      return null;
    }
  }, [currentSession]);

  const voteOnIdea = useCallback(async (ideaId: string, voteType: 'up' | 'down') => {
    try {
      const response = await brainstormingApi.voteOnIdea(ideaId, voteType);
      
      if (response.success && response.data) {
        setIdeas(prev => prev.map(idea => 
          idea.id === ideaId ? response.data! : idea
        ));
        toast.success(`Voted ${voteType} on idea`);
      } else {
        toast.error('Failed to vote on idea');
      }
    } catch (err) {
      toast.error('Failed to vote on idea');
    }
  }, []);

  const pinIdea = useCallback(async (ideaId: string) => {
    try {
      const response = await brainstormingApi.pinIdea(ideaId);
      
      if (response.success && response.data) {
        setIdeas(prev => prev.map(idea => 
          idea.id === ideaId ? response.data! : idea
        ));
        const idea = ideas.find(i => i.id === ideaId);
        toast.success(`Idea ${idea?.is_pinned ? 'unpinned' : 'pinned'}`);
      }
    } catch (err) {
      toast.error('Failed to pin/unpin idea');
    }
  }, [ideas]);

  // KEYWORD MANAGEMENT
  const createKeyword = useCallback(async (data: {
    keyword: string;
    category: string;
    generation_method?: string;
    variations?: string[];
    relevance_score?: number;
    keyword_group?: string;
    group_color?: string;
  }) => {
    if (!currentSession) {
      toast.error('No active brainstorming session');
      return null;
    }

    try {
      const response = await brainstormingApi.createKeyword({
        session: currentSession.id,
        ...data
      });

      if (response.success && response.data) {
        setKeywords(prev => [response.data!, ...prev]);
        toast.success('Keyword created successfully');
        return response.data;
      } else {
        toast.error(response.error || 'Failed to create keyword');
        return null;
      }
    } catch (err) {
      toast.error('Failed to create keyword');
      return null;
    }
  }, [currentSession]);

  const generateKeywordsFromText = useCallback(async (text: string) => {
    if (!currentSession) {
      toast.error('No active brainstorming session');
      return [];
    }

    try {
      setLoading(true);
      const response = await brainstormingApi.generateKeywordsFromText({
        session_id: currentSession.id,
        text
      });

      if (response.success && response.data) {
        setKeywords(prev => [...response.data!, ...prev]);
        toast.success(`Generated ${response.data.length} keywords`);
        return response.data;
      } else {
        toast.error('Failed to generate keywords');
        return [];
      }
    } catch (err) {
      toast.error('Failed to generate keywords');
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentSession]);

  const validateKeyword = useCallback(async (keywordId: string) => {
    try {
      const response = await brainstormingApi.validateKeyword(keywordId);
      
      if (response.success && response.data) {
        setKeywords(prev => prev.map(kw => 
          kw.id === keywordId ? response.data! : kw
        ));
        toast.success('Keyword validated');
      }
    } catch (err) {
      toast.error('Failed to validate keyword');
    }
  }, []);

  // CONCEPT MANAGEMENT
  const createConcept = useCallback(async (data: {
    concept_name: string;
    concept_description?: string;
    linked_ideas?: string[];
    linked_keywords?: string[];
    importance_score?: number;
    complexity_level?: number;
  }) => {
    if (!currentSession) {
      toast.error('No active brainstorming session');
      return null;
    }

    try {
      const response = await brainstormingApi.createConcept({
        session: currentSession.id,
        ...data
      });

      if (response.success && response.data) {
        setConcepts(prev => [response.data!, ...prev]);
        toast.success('Concept created successfully');
        return response.data;
      } else {
        toast.error('Failed to create concept');
        return null;
      }
    } catch (err) {
      toast.error('Failed to create concept');
      return null;
    }
  }, [currentSession]);

  // STRATEGY MANAGEMENT
  const createStrategy = useCallback(async (data: {
    name: string;
    description: string;
    strategy_type: string;
    search_domains?: string[];
    api_preferences?: string[];
    geographic_focus?: string[];
    primary_keyword_ids?: string[];
    secondary_keyword_ids?: string[];
    concept_ids?: string[];
    priority_level?: number;
  }) => {
    if (!currentSession) {
      toast.error('No active brainstorming session');
      return null;
    }

    try {
      const response = await brainstormingApi.createStrategy({
        session: currentSession.id,
        ...data
      });

      if (response.success && response.data) {
        setStrategies(prev => [response.data!, ...prev]);
        toast.success('Research strategy created successfully');
        return response.data;
      } else {
        toast.error('Failed to create strategy');
        return null;
      }
    } catch (err) {
      toast.error('Failed to create strategy');
      return null;
    }
  }, [currentSession]);

  // AI INTERACTION
  const createAIInteraction = useCallback(async (data: {
    interaction_type: string;
    user_prompt: string;
    context_data?: Record<string, any>;
  }) => {
    if (!currentSession) {
      toast.error('No active brainstorming session');
      return null;
    }

    try {
      setLoading(true);
      const response = await brainstormingApi.createAIInteraction({
        session: currentSession.id,
        ...data
      });

      if (response.success && response.data) {
        setAiInteractions(prev => [response.data!, ...prev]);
        return response.data;
      } else {
        toast.error('AI interaction failed');
        return null;
      }
    } catch (err) {
      toast.error('AI interaction failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentSession]);

  // ANALYTICS
  const loadAnalytics = useCallback(async () => {
    if (!currentSession) return;

    try {
      const response = await brainstormingApi.getSessionAnalytics(currentSession.id);
      
      if (response.success && response.data) {
        setAnalytics(response.data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  }, [currentSession]);

  // Initialize data when project changes
  useEffect(() => {
    if (projectId) {
      fetchSessions();
    }
  }, [projectId, fetchSessions]);

  // Load analytics when session changes
  useEffect(() => {
    if (currentSession) {
      loadAnalytics();
    }
  }, [currentSession, loadAnalytics]);

  return {
    // State
    sessions,
    currentSession,
    ideas,
    keywords,
    concepts,
    strategies,
    competitors,
    aiInteractions,
    analytics,
    loading,
    error,

    // Session management
    createSession,
    setActiveSession,
    fetchSessions,

    // Ideation
    createIdea,
    voteOnIdea,
    pinIdea,

    // Keywords
    createKeyword,
    generateKeywordsFromText,
    validateKeyword,

    // Concepts
    createConcept,

    // Strategies
    createStrategy,

    // AI
    createAIInteraction,

    // Analytics
    loadAnalytics,
    
    // Utilities
    refreshData: () => currentSession && loadSessionData(currentSession.id)
  };
}