/**
 * Brainstorming API Service
 * World-class brainstorming functionality integration
 */

import { ApiResponse, ApiClient } from './apiClient';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface BrainstormingSession {
  id: string;
  project: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  research_objective: string;
  target_domain: string;
  research_scope: {
    geographic?: string[];
    temporal?: {
      from_year?: number;
      to_year?: number;
    };
    technical?: string[];
  };
  completion_percentage: number;
  total_ideas: number;
  total_keywords: number;
  total_concepts: number;
  total_strategies: number;
  participants: BrainstormingParticipant[];
  started_at: string;
  completed_at?: string;
  last_activity: string;
  created_by: UserBasic;
}

export interface BrainstormingParticipant {
  id: string;
  user: UserBasic;
  role: 'facilitator' | 'researcher' | 'analyst' | 'observer';
  joined_at: string;
  contribution_score: number;
}

export interface UserBasic {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface IdeationRecord {
  id: string;
  session: string;
  title: string;
  description: string;
  idea_type: 'concept' | 'problem' | 'solution' | 'feature' | 'question' | 'hypothesis' | 'insight';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'under_review' | 'approved' | 'implemented' | 'archived';
  tags: string[];
  categories: string[];
  parent_idea?: string;
  related_ideas: string[];
  is_pinned: boolean;
  votes_up: number;
  votes_down: number;
  attachments: string[];
  references: string[];
  created_by: UserBasic;
  created_at: string;
  updated_at: string;
  children_count: number;
}

export interface KeywordGeneration {
  id: string;
  session: string;
  keyword: string;
  variations: string[];
  translations: Record<string, string>;
  category: 'primary' | 'secondary' | 'technical' | 'product' | 'company' | 'inventor' | 'classification';
  generation_method: 'manual' | 'ai_generated' | 'extracted' | 'synonym_expansion' | 'patent_analysis';
  frequency_score: number;
  relevance_score: number;
  search_volume: number;
  keyword_group: string;
  group_color: string;
  is_active: boolean;
  is_validated: boolean;
  created_by: UserBasic;
  created_at: string;
  updated_at: string;
}

export interface ConceptMapping {
  id: string;
  session: string;
  concept_name: string;
  concept_description: string;
  linked_ideas: string[];
  linked_keywords: string[];
  position_x: number;
  position_y: number;
  importance_score: number;
  complexity_level: number;
  outgoing_relationships: ConceptRelationship[];
  incoming_relationships: ConceptRelationship[];
  created_by: UserBasic;
  created_at: string;
  updated_at: string;
}

export interface ConceptRelationship {
  from_concept: string;
  to_concept: string;
  to_concept_name: string;
  relationship_type: 'parent_child' | 'sibling' | 'dependency' | 'conflict' | 'complement' | 'alternative';
  strength: number;
  description: string;
}

export interface ResearchStrategy {
  id: string;
  session: string;
  name: string;
  description: string;
  strategy_type: 'comprehensive' | 'targeted' | 'competitive' | 'landscape' | 'freedom_to_operate' | 'prior_art' | 'patent_family';
  status: 'draft' | 'ready' | 'active' | 'completed' | 'archived';
  search_domains: string[];
  api_preferences: string[];
  geographic_focus: string[];
  temporal_scope: Record<string, any>;
  primary_keywords: KeywordGeneration[];
  secondary_keywords: KeywordGeneration[];
  concepts: ConceptMapping[];
  classification_codes: string[];
  assignee_filters: string[];
  inventor_filters: string[];
  legal_status_filters: string[];
  estimated_results: number;
  estimated_time: number;
  priority_level: number;
  actual_results: number;
  execution_time: number;
  success_rate: number;
  created_by: UserBasic;
  created_at: string;
  updated_at: string;
}

export interface CompetitorAnalysis {
  id: string;
  session: string;
  company_name: string;
  competitor_type: 'direct' | 'indirect' | 'potential' | 'supplier' | 'customer' | 'research_institution';
  description: string;
  headquarters: string;
  website: string;
  founded_year?: number;
  employee_count: string;
  revenue: string;
  total_patents: number;
  active_patents: number;
  patent_applications: number;
  key_inventors: string[];
  technology_areas: string[];
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  research_domains: string[];
  patent_strategy: string;
  market_position: string;
  competitive_advantage: string;
  threat_level: number;
  analysis_date: string;
  last_updated: string;
  data_sources: string[];
  created_by: UserBasic;
}

export interface AIInteraction {
  id: string;
  session: string;
  interaction_type: 'keyword_generation' | 'concept_extraction' | 'strategy_suggestion' | 'competitor_analysis' | 'patent_analysis' | 'question_answer' | 'idea_evaluation';
  user_prompt: string;
  ai_response: string;
  context_data: Record<string, any>;
  user_rating?: number;
  is_helpful?: boolean;
  feedback_notes: string;
  processing_time: number;
  model_used: string;
  confidence_score: number;
  applied_to_research: boolean;
  generated_keywords: KeywordGeneration[];
  generated_ideas: IdeationRecord[];
  created_by: UserBasic;
  created_at: string;
}

export interface BrainstormingAnalytics {
  session_id: string;
  session_name: string;
  duration_hours: number;
  total_participants: number;
  total_ideas: number;
  total_keywords: number;
  total_concepts: number;
  total_strategies: number;
  total_competitors: number;
  total_ai_interactions: number;
  average_idea_rating: number;
  pinned_ideas_count: number;
  validated_keywords_percentage: number;
  strategy_success_rate: number;
  most_active_participant: UserBasic;
  most_productive_hour: string;
  peak_activity_date: string;
  top_categories: string[];
  top_keywords: string[];
  research_focus_areas: string[];
}

// ============================================================================
// API CLIENT CLASS
// ============================================================================

class BrainstormingApiClient {
  private baseUrl = '/analytics/api/brainstorming';

  // SESSION MANAGEMENT
  async getSessions(params?: {
    project_id?: string;
    status?: string;
  }): Promise<ApiResponse<BrainstormingSession[]>> {
    return ApiClient.get(`${this.baseUrl}/sessions/`, { params });
  }

  async createSession(data: {
    project: string;
    name: string;
    description: string;
    research_objective: string;
    target_domain?: string;
    research_scope?: Record<string, any>;
  }): Promise<ApiResponse<BrainstormingSession>> {
    return ApiClient.post(`${this.baseUrl}/sessions/`, data);
  }

  async getSession(id: string): Promise<ApiResponse<BrainstormingSession>> {
    return ApiClient.get(`${this.baseUrl}/sessions/${id}/`);
  }

  async updateSession(id: string, data: Partial<BrainstormingSession>): Promise<ApiResponse<BrainstormingSession>> {
    return ApiClient.patch(`${this.baseUrl}/sessions/${id}/`, data);
  }

  async deleteSession(id: string): Promise<ApiResponse<void>> {
    return ApiClient.delete(`${this.baseUrl}/sessions/${id}/`);
  }

  async addParticipant(sessionId: string, data: {
    user_id: string;
    role: string;
  }): Promise<ApiResponse<BrainstormingParticipant>> {
    return ApiClient.post(`${this.baseUrl}/sessions/${sessionId}/add_participant/`, data);
  }

  async completeSession(sessionId: string): Promise<ApiResponse<BrainstormingSession>> {
    return ApiClient.post(`${this.baseUrl}/sessions/${sessionId}/complete_session/`);
  }

  async getSessionAnalytics(sessionId: string): Promise<ApiResponse<BrainstormingAnalytics>> {
    return ApiClient.get(`${this.baseUrl}/sessions/${sessionId}/analytics/`);
  }

  // IDEATION MANAGEMENT
  async getIdeas(params?: {
    session_id?: string;
    type?: string;
    status?: string;
  }): Promise<ApiResponse<IdeationRecord[]>> {
    return ApiClient.get(`${this.baseUrl}/ideation/`, { params });
  }

  async createIdea(data: {
    session: string;
    title: string;
    description: string;
    idea_type: string;
    priority?: string;
    tags?: string[];
    categories?: string[];
    parent_idea?: string;
    related_ideas?: string[];
  }): Promise<ApiResponse<IdeationRecord>> {
    return ApiClient.post(`${this.baseUrl}/ideation/`, data);
  }

  async updateIdea(id: string, data: Partial<IdeationRecord>): Promise<ApiResponse<IdeationRecord>> {
    return ApiClient.patch(`${this.baseUrl}/ideation/${id}/`, data);
  }

  async deleteIdea(id: string): Promise<ApiResponse<void>> {
    return ApiClient.delete(`${this.baseUrl}/ideation/${id}/`);
  }

  async voteOnIdea(id: string, voteType: 'up' | 'down'): Promise<ApiResponse<IdeationRecord>> {
    return ApiClient.post(`${this.baseUrl}/ideation/${id}/vote/`, {
      vote_type: voteType
    });
  }

  async pinIdea(id: string): Promise<ApiResponse<IdeationRecord>> {
    return ApiClient.post(`${this.baseUrl}/ideation/${id}/pin/`);
  }

  // KEYWORD MANAGEMENT
  async getKeywords(params?: {
    session_id?: string;
    category?: string;
    validated?: boolean;
  }): Promise<ApiResponse<KeywordGeneration[]>> {
    return ApiClient.get(`${this.baseUrl}/keywords/`, { params });
  }

  async createKeyword(data: {
    session: string;
    keyword: string;
    category: string;
    generation_method?: string;
    variations?: string[];
    translations?: Record<string, string>;
    relevance_score?: number;
    keyword_group?: string;
    group_color?: string;
  }): Promise<ApiResponse<KeywordGeneration>> {
    return ApiClient.post(`${this.baseUrl}/keywords/`, data);
  }

  async updateKeyword(id: string, data: Partial<KeywordGeneration>): Promise<ApiResponse<KeywordGeneration>> {
    return ApiClient.patch(`${this.baseUrl}/keywords/${id}/`, data);
  }

  async deleteKeyword(id: string): Promise<ApiResponse<void>> {
    return ApiClient.delete(`${this.baseUrl}/keywords/${id}/`);
  }

  async generateKeywordsFromText(data: {
    session_id: string;
    text: string;
  }): Promise<ApiResponse<KeywordGeneration[]>> {
    return ApiClient.post(`${this.baseUrl}/keywords/generate_from_text/`, data);
  }

  async validateKeyword(id: string): Promise<ApiResponse<KeywordGeneration>> {
    return ApiClient.post(`${this.baseUrl}/keywords/${id}/validate/`);
  }

  // CONCEPT MAPPING
  async getConcepts(params?: {
    session_id?: string;
  }): Promise<ApiResponse<ConceptMapping[]>> {
    return ApiClient.get(`${this.baseUrl}/concepts/`, { params });
  }

  async createConcept(data: {
    session: string;
    concept_name: string;
    concept_description?: string;
    linked_ideas?: string[];
    linked_keywords?: string[];
    position_x?: number;
    position_y?: number;
    importance_score?: number;
    complexity_level?: number;
  }): Promise<ApiResponse<ConceptMapping>> {
    return ApiClient.post(`${this.baseUrl}/concepts/`, data);
  }

  async createConceptRelationship(data: {
    from_concept_id: string;
    to_concept_id: string;
    relationship_type: string;
    strength?: number;
    description?: string;
  }): Promise<ApiResponse<ConceptRelationship>> {
    return ApiClient.post(`${this.baseUrl}/concepts/create_relationship/`, data);
  }

  // RESEARCH STRATEGIES
  async getStrategies(params?: {
    session_id?: string;
    status?: string;
  }): Promise<ApiResponse<ResearchStrategy[]>> {
    return ApiClient.get(`${this.baseUrl}/strategies/`, { params });
  }

  async createStrategy(data: {
    session: string;
    name: string;
    description: string;
    strategy_type: string;
    search_domains?: string[];
    api_preferences?: string[];
    geographic_focus?: string[];
    temporal_scope?: Record<string, any>;
    primary_keyword_ids?: string[];
    secondary_keyword_ids?: string[];
    concept_ids?: string[];
    classification_codes?: string[];
    assignee_filters?: string[];
    inventor_filters?: string[];
    legal_status_filters?: string[];
    estimated_results?: number;
    estimated_time?: number;
    priority_level?: number;
  }): Promise<ApiResponse<ResearchStrategy>> {
    return ApiClient.post(`${this.baseUrl}/strategies/`, data);
  }

  async executeStrategy(id: string): Promise<ApiResponse<{ message: string; strategy_id: string; estimated_time: number }>> {
    return ApiClient.post(`${this.baseUrl}/strategies/${id}/execute/`);
  }

  // COMPETITOR ANALYSIS
  async getCompetitors(params?: {
    session_id?: string;
    type?: string;
  }): Promise<ApiResponse<CompetitorAnalysis[]>> {
    return ApiClient.get(`${this.baseUrl}/competitors/`, { params });
  }

  async createCompetitorAnalysis(data: {
    session: string;
    company_name: string;
    competitor_type: string;
    description?: string;
    headquarters?: string;
    website?: string;
    [key: string]: any;
  }): Promise<ApiResponse<CompetitorAnalysis>> {
    return ApiClient.post(`${this.baseUrl}/competitors/`, data);
  }

  // AI INTERACTIONS
  async getAIInteractions(params?: {
    session_id?: string;
    type?: string;
  }): Promise<ApiResponse<AIInteraction[]>> {
    return ApiClient.get(`${this.baseUrl}/ai-interactions/`, { params });
  }

  async createAIInteraction(data: {
    session: string;
    interaction_type: string;
    user_prompt: string;
    context_data?: Record<string, any>;
  }): Promise<ApiResponse<AIInteraction>> {
    return ApiClient.post(`${this.baseUrl}/ai-interactions/`, data);
  }

  async rateAIInteraction(id: string, data: {
    rating?: number;
    is_helpful?: boolean;
    feedback_notes?: string;
  }): Promise<ApiResponse<AIInteraction>> {
    return ApiClient.post(`${this.baseUrl}/ai-interactions/${id}/rate/`, data);
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const brainstormingApi = new BrainstormingApiClient();

// Types are already exported with their definitions above