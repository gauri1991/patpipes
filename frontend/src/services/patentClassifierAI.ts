/**
 * Advanced AI Patent Classification Service
 * Implements multi-model ensemble with explainable AI
 */

import { apiClient } from './apiClient';

export interface ClassificationModel {
  id: string;
  name: string;
  type: 'bert' | 'gpt' | 'scibert' | 'patentbert' | 'custom';
  specialization: string;
  weight: number;
  accuracy: number;
}

export interface ClassificationResult {
  patentId: string;
  categories: CategoryPrediction[];
  confidence: number;
  explanation: ExplanationData;
  modelContributions: ModelContribution[];
  suggestedReview: boolean;
  timestamp: string;
}

export interface CategoryPrediction {
  categoryId: string;
  categoryName: string;
  confidence: number;
  rank: number;
  modelAgreement: number;
  keyFactors: string[];
}

export interface ExplanationData {
  topKeywords: KeywordImportance[];
  relevantClaims: ClaimRelevance[];
  similarPatents: SimilarPatent[];
  decisionPath: DecisionNode[];
  technicalSummary: string;
}

export interface KeywordImportance {
  keyword: string;
  importance: number;
  occurrences: number;
  context: string[];
}

export interface ClaimRelevance {
  claimNumber: number;
  claimText: string;
  relevanceScore: number;
  matchedCategories: string[];
  highlights: TextHighlight[];
}

export interface TextHighlight {
  start: number;
  end: number;
  text: string;
  importance: number;
  category: string;
}

export interface SimilarPatent {
  patentNumber: string;
  title: string;
  similarity: number;
  categories: string[];
  publicationDate: string;
}

export interface DecisionNode {
  step: number;
  model: string;
  decision: string;
  confidence: number;
  alternatives: AlternativeDecision[];
}

export interface AlternativeDecision {
  decision: string;
  confidence: number;
  reason: string;
}

export interface ModelContribution {
  modelId: string;
  modelName: string;
  contribution: number;
  predictions: CategoryPrediction[];
  processingTime: number;
}

export interface FeedbackData {
  patentId: string;
  originalClassification: string[];
  correctedClassification: string[];
  confidence: number;
  userExpertise: 'expert' | 'intermediate' | 'beginner';
  comments?: string;
}

export interface LearningMetrics {
  totalFeedback: number;
  accuracy: number;
  improvementRate: number;
  lastUpdated: string;
  modelPerformance: ModelPerformance[];
}

export interface ModelPerformance {
  modelId: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  feedbackIncorporated: number;
}

export interface BatchClassificationRequest {
  patents: PatentData[];
  models?: string[];
  confidenceThreshold?: number;
  maxCategoriesPerPatent?: number;
  includeExplanation?: boolean;
  priorityLevel?: 'high' | 'normal' | 'low';
}

export interface PatentData {
  id: string;
  title: string;
  abstract: string;
  claims: string[];
  description?: string;
  ipcClasses?: string[];
  cpcClasses?: string[];
  inventors?: string[];
  assignee?: string;
  publicationDate?: string;
  citations?: string[];
}

class PatentClassifierAIService {
  private models: ClassificationModel[] = [
    {
      id: 'bert-patent',
      name: 'PatentBERT',
      type: 'patentbert',
      specialization: 'Patent language understanding',
      weight: 0.3,
      accuracy: 0.92
    },
    {
      id: 'scibert',
      name: 'SciBERT',
      type: 'scibert',
      specialization: 'Scientific text analysis',
      weight: 0.25,
      accuracy: 0.89
    },
    {
      id: 'gpt-context',
      name: 'GPT Context Analyzer',
      type: 'gpt',
      specialization: 'Contextual understanding',
      weight: 0.25,
      accuracy: 0.87
    },
    {
      id: 'bert-base',
      name: 'BERT Base',
      type: 'bert',
      specialization: 'General semantics',
      weight: 0.2,
      accuracy: 0.85
    }
  ];

  private feedbackHistory: FeedbackData[] = [];
  private learningMetrics: LearningMetrics | null = null;

  /**
   * Classify patents using multi-model ensemble
   */
  async classifyPatents(request: BatchClassificationRequest): Promise<ClassificationResult[]> {
    try {
      // For demo, we'll simulate the AI processing
      const results = await this.simulateEnsembleClassification(request);
      
      // In production, this would call the backend API
      // const response = await apiClient.post('/api/classifier/classify', request);
      // return response.data;
      
      return results;
    } catch (error) {
      console.error('Error classifying patents:', error);
      throw error;
    }
  }

  /**
   * Simulate ensemble classification with multiple models
   */
  private async simulateEnsembleClassification(
    request: BatchClassificationRequest
  ): Promise<ClassificationResult[]> {
    const results: ClassificationResult[] = [];
    
    for (const patent of request.patents) {
      // Simulate model predictions
      const modelContributions = await this.getModelPredictions(patent);
      
      // Ensemble the predictions
      const ensembledCategories = this.ensemblePredictions(modelContributions);
      
      // Generate explanation
      const explanation = this.generateExplanation(patent, ensembledCategories);
      
      // Calculate overall confidence
      const overallConfidence = this.calculateOverallConfidence(modelContributions);
      
      results.push({
        patentId: patent.id,
        categories: ensembledCategories.slice(0, request.maxCategoriesPerPatent || 3),
        confidence: overallConfidence,
        explanation,
        modelContributions,
        suggestedReview: overallConfidence < (request.confidenceThreshold || 0.75),
        timestamp: new Date().toISOString()
      });
    }
    
    return results;
  }

  /**
   * Get predictions from each model
   */
  private async getModelPredictions(patent: PatentData): Promise<ModelContribution[]> {
    const contributions: ModelContribution[] = [];
    
    for (const model of this.models) {
      const startTime = Date.now();
      
      // Simulate model-specific predictions
      const predictions = this.simulateModelPrediction(model, patent);
      
      contributions.push({
        modelId: model.id,
        modelName: model.name,
        contribution: model.weight,
        predictions,
        processingTime: Date.now() - startTime
      });
    }
    
    return contributions;
  }

  /**
   * Simulate individual model predictions
   */
  private simulateModelPrediction(model: ClassificationModel, patent: PatentData): CategoryPrediction[] {
    // Categories based on patent content analysis
    const categories = [
      { id: 'ai-ml', name: 'AI/Machine Learning', baseScore: 0 },
      { id: 'hardware', name: 'Hardware', baseScore: 0 },
      { id: 'software', name: 'Software Methods', baseScore: 0 },
      { id: 'data-processing', name: 'Data Processing', baseScore: 0 },
      { id: 'networking', name: 'Networking', baseScore: 0 },
      { id: 'security', name: 'Security', baseScore: 0 },
      { id: 'biotech', name: 'Biotechnology', baseScore: 0 },
      { id: 'materials', name: 'Materials Science', baseScore: 0 }
    ];

    // Analyze patent content for keywords
    const content = `${patent.title} ${patent.abstract} ${patent.claims.join(' ')}`.toLowerCase();
    
    // Score categories based on content
    if (content.includes('neural') || content.includes('machine learning') || content.includes('artificial intelligence')) {
      categories[0].baseScore += 0.9;
    }
    if (content.includes('circuit') || content.includes('processor') || content.includes('chip')) {
      categories[1].baseScore += 0.8;
    }
    if (content.includes('algorithm') || content.includes('software') || content.includes('application')) {
      categories[2].baseScore += 0.7;
    }
    if (content.includes('data') || content.includes('database') || content.includes('processing')) {
      categories[3].baseScore += 0.75;
    }
    if (content.includes('network') || content.includes('communication') || content.includes('protocol')) {
      categories[4].baseScore += 0.7;
    }
    if (content.includes('encryption') || content.includes('security') || content.includes('authentication')) {
      categories[5].baseScore += 0.85;
    }

    // Add model-specific variations
    const modelVariation = model.accuracy;
    
    return categories
      .filter(cat => cat.baseScore > 0)
      .map((cat, index) => ({
        categoryId: cat.id,
        categoryName: cat.name,
        confidence: Math.min(cat.baseScore * modelVariation + Math.random() * 0.1, 1),
        rank: index + 1,
        modelAgreement: 0.8 + Math.random() * 0.2,
        keyFactors: this.extractKeyFactors(content, cat.name)
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }

  /**
   * Extract key factors for a category
   */
  private extractKeyFactors(content: string, category: string): string[] {
    const factors: string[] = [];
    
    // Extract relevant phrases based on category
    const categoryKeywords: { [key: string]: string[] } = {
      'AI/Machine Learning': ['neural network', 'training data', 'model', 'prediction', 'classification'],
      'Hardware': ['circuit', 'processor', 'memory', 'chip', 'device'],
      'Software Methods': ['algorithm', 'method', 'process', 'function', 'module'],
      'Data Processing': ['database', 'query', 'storage', 'retrieval', 'analysis'],
      'Networking': ['protocol', 'transmission', 'packet', 'routing', 'bandwidth'],
      'Security': ['encryption', 'authentication', 'authorization', 'certificate', 'key']
    };

    const keywords = categoryKeywords[category] || [];
    for (const keyword of keywords) {
      if (content.includes(keyword)) {
        factors.push(keyword);
      }
    }

    return factors.slice(0, 3);
  }

  /**
   * Ensemble predictions from multiple models
   */
  private ensemblePredictions(contributions: ModelContribution[]): CategoryPrediction[] {
    const categoryScores: { [key: string]: CategoryPrediction } = {};
    
    // Aggregate predictions from all models
    for (const contribution of contributions) {
      for (const prediction of contribution.predictions) {
        if (!categoryScores[prediction.categoryId]) {
          categoryScores[prediction.categoryId] = {
            ...prediction,
            confidence: 0,
            modelAgreement: 0,
            keyFactors: []
          };
        }
        
        // Weight the confidence by model contribution
        categoryScores[prediction.categoryId].confidence += 
          prediction.confidence * contribution.contribution;
        
        // Track model agreement
        categoryScores[prediction.categoryId].modelAgreement += 1;
        
        // Merge key factors
        categoryScores[prediction.categoryId].keyFactors = [
          ...new Set([
            ...categoryScores[prediction.categoryId].keyFactors,
            ...prediction.keyFactors
          ])
        ];
      }
    }
    
    // Normalize model agreement
    const totalModels = contributions.length;
    Object.values(categoryScores).forEach(cat => {
      cat.modelAgreement = cat.modelAgreement / totalModels;
    });
    
    // Sort by confidence and return
    return Object.values(categoryScores)
      .sort((a, b) => b.confidence - a.confidence)
      .map((cat, index) => ({ ...cat, rank: index + 1 }));
  }

  /**
   * Generate explainable AI insights
   */
  private generateExplanation(patent: PatentData, categories: CategoryPrediction[]): ExplanationData {
    const content = `${patent.title} ${patent.abstract} ${patent.claims.join(' ')}`;
    
    return {
      topKeywords: this.extractTopKeywords(content),
      relevantClaims: this.analyzeClaimRelevance(patent.claims, categories),
      similarPatents: this.findSimilarPatents(patent),
      decisionPath: this.buildDecisionPath(categories),
      technicalSummary: this.generateTechnicalSummary(patent, categories)
    };
  }

  /**
   * Extract top keywords with importance scores
   */
  private extractTopKeywords(content: string): KeywordImportance[] {
    // Simulate keyword extraction
    const keywords = [
      { keyword: 'neural network', importance: 0.95, occurrences: 8 },
      { keyword: 'machine learning', importance: 0.92, occurrences: 6 },
      { keyword: 'classification', importance: 0.88, occurrences: 5 },
      { keyword: 'algorithm', importance: 0.85, occurrences: 7 },
      { keyword: 'processing', importance: 0.80, occurrences: 4 }
    ];
    
    return keywords.map(kw => ({
      ...kw,
      context: [`...${kw.keyword} implementation...`, `...using ${kw.keyword} for...`]
    }));
  }

  /**
   * Analyze claim relevance to categories
   */
  private analyzeClaimRelevance(claims: string[], categories: CategoryPrediction[]): ClaimRelevance[] {
    return claims.slice(0, 3).map((claim, index) => ({
      claimNumber: index + 1,
      claimText: claim.substring(0, 200) + '...',
      relevanceScore: 0.75 + Math.random() * 0.2,
      matchedCategories: categories.slice(0, 2).map(c => c.categoryName),
      highlights: [
        {
          start: 10,
          end: 30,
          text: 'neural network',
          importance: 0.9,
          category: categories[0]?.categoryName || 'Unknown'
        }
      ]
    }));
  }

  /**
   * Find similar patents
   */
  private findSimilarPatents(patent: PatentData): SimilarPatent[] {
    return [
      {
        patentNumber: 'US10,123,456',
        title: 'Similar Machine Learning System',
        similarity: 0.89,
        categories: ['AI/Machine Learning', 'Software Methods'],
        publicationDate: '2023-01-15'
      },
      {
        patentNumber: 'US10,234,567',
        title: 'Related Neural Network Architecture',
        similarity: 0.85,
        categories: ['AI/Machine Learning', 'Data Processing'],
        publicationDate: '2023-03-20'
      }
    ];
  }

  /**
   * Build decision path explanation
   */
  private buildDecisionPath(categories: CategoryPrediction[]): DecisionNode[] {
    return [
      {
        step: 1,
        model: 'PatentBERT',
        decision: 'Initial classification: AI/ML with high confidence',
        confidence: 0.92,
        alternatives: [
          { decision: 'Software Methods', confidence: 0.75, reason: 'Algorithm-focused content' }
        ]
      },
      {
        step: 2,
        model: 'SciBERT',
        decision: 'Confirmed: Technical complexity matches AI/ML',
        confidence: 0.89,
        alternatives: []
      },
      {
        step: 3,
        model: 'Ensemble',
        decision: `Final: ${categories[0]?.categoryName || 'Unknown'}`,
        confidence: categories[0]?.confidence || 0,
        alternatives: categories.slice(1, 3).map(cat => ({
          decision: cat.categoryName,
          confidence: cat.confidence,
          reason: 'Lower model agreement'
        }))
      }
    ];
  }

  /**
   * Generate technical summary
   */
  private generateTechnicalSummary(patent: PatentData, categories: CategoryPrediction[]): string {
    return `This patent describes ${patent.title.toLowerCase()} with primary focus on ${
      categories[0]?.categoryName || 'technology'
    }. The classification confidence is ${
      (categories[0]?.confidence * 100).toFixed(1)
    }% based on analysis of ${patent.claims.length} claims and technical content. ${
      categories[0]?.modelAgreement > 0.8 
        ? 'All models strongly agree on this classification.' 
        : 'Models show moderate agreement on this classification.'
    }`;
  }

  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(contributions: ModelContribution[]): number {
    let totalConfidence = 0;
    let totalWeight = 0;
    
    for (const contribution of contributions) {
      if (contribution.predictions.length > 0) {
        const avgConfidence = contribution.predictions
          .reduce((sum, pred) => sum + pred.confidence, 0) / contribution.predictions.length;
        totalConfidence += avgConfidence * contribution.contribution;
        totalWeight += contribution.contribution;
      }
    }
    
    return totalWeight > 0 ? totalConfidence / totalWeight : 0;
  }

  /**
   * Submit feedback for real-time learning
   */
  async submitFeedback(feedback: FeedbackData): Promise<void> {
    this.feedbackHistory.push(feedback);
    
    // Update learning metrics
    await this.updateLearningMetrics(feedback);
    
    // In production, send to backend for model retraining
    // await apiClient.post('/api/classifier/feedback', feedback);
  }

  /**
   * Update learning metrics based on feedback
   */
  private async updateLearningMetrics(feedback: FeedbackData): Promise<void> {
    if (!this.learningMetrics) {
      this.learningMetrics = {
        totalFeedback: 0,
        accuracy: 0.85,
        improvementRate: 0,
        lastUpdated: new Date().toISOString(),
        modelPerformance: this.models.map(model => ({
          modelId: model.id,
          accuracy: model.accuracy,
          precision: 0.88,
          recall: 0.86,
          f1Score: 0.87,
          feedbackIncorporated: 0
        }))
      };
    }
    
    this.learningMetrics.totalFeedback++;
    this.learningMetrics.lastUpdated = new Date().toISOString();
    
    // Simulate accuracy improvement
    if (feedback.confidence > 0.8) {
      this.learningMetrics.accuracy = Math.min(
        this.learningMetrics.accuracy + 0.001,
        0.99
      );
    }
    
    this.learningMetrics.improvementRate = 
      (this.learningMetrics.accuracy - 0.85) / 0.85 * 100;
  }

  /**
   * Get learning metrics
   */
  getLearningMetrics(): LearningMetrics | null {
    return this.learningMetrics;
  }

  /**
   * Get available models
   */
  getAvailableModels(): ClassificationModel[] {
    return this.models;
  }

  /**
   * Update model weights based on performance
   */
  updateModelWeights(modelId: string, newWeight: number): void {
    const model = this.models.find(m => m.id === modelId);
    if (model) {
      model.weight = newWeight;
      
      // Normalize weights
      const totalWeight = this.models.reduce((sum, m) => sum + m.weight, 0);
      this.models.forEach(m => {
        m.weight = m.weight / totalWeight;
      });
    }
  }
}

export const patentClassifierAI = new PatentClassifierAIService();