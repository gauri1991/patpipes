/**
 * Pipeline Orchestrator for Agentic Patent Discovery System
 * Manages the sequential execution of agents and coordinates the entire workflow
 */

import {
  PatentData,
  AgentMessage,
  AgentStage,
  ProcessingStatus,
  AgentError,
  PipelineConfig,
  PatentAnalysisResult
} from './types';
import { BaseAgent, AgentRegistry, AgentMessageBus } from './BaseAgent';

/**
 * Orchestrates the execution of the patent discovery pipeline
 * Manages agent sequencing, error handling, and progress tracking
 */
export class PipelineOrchestrator {
  private registry: AgentRegistry;
  private messageBus: AgentMessageBus;
  private config: PipelineConfig;
  private processingStatuses: Map<string, ProcessingStatus> = new Map();

  constructor(
    registry: AgentRegistry,
    messageBus: AgentMessageBus,
    config: PipelineConfig
  ) {
    this.registry = registry;
    this.messageBus = messageBus;
    this.config = config;
    this.setupMessageBusSubscribers();
  }

  /**
   * Process a single patent through the entire pipeline
   */
  async processPatent(patent: PatentData): Promise<PatentAnalysisResult> {
    const startTime = Date.now();
    
    // Initialize processing status
    this.initializeProcessingStatus(patent.id);
    
    try {
      // Define the processing pipeline stages
      const pipeline = await this.buildPipeline();
      
      let currentMessage: AgentMessage = {
        patentId: patent.id,
        stage: AgentStage.INPUT,
        data: patent,
        metadata: {
          agentName: 'PipelineOrchestrator',
          processingTime: 0,
          confidence: 1.0,
          version: '1.0.0'
        },
        timestamp: new Date().toISOString()
      };

      // Process through each agent in sequence
      for (const agentName of pipeline) {
        this.updateProcessingStatus(patent.id, this.getStageForAgent(agentName));
        
        const agent = this.registry.get(agentName);
        if (!agent) {
          throw new Error(`Agent ${agentName} not found in registry`);
        }

        try {
          // Process through agent
          currentMessage = await agent.process(currentMessage.data);
          
          // Send message through bus for subscribers
          this.messageBus.send(currentMessage);
          
        } catch (error) {
          const agentError: AgentError = {
            agentName,
            stage: this.getStageForAgent(agentName),
            error: error instanceof Error ? error.message : String(error),
            input: currentMessage.data,
            timestamp: new Date().toISOString()
          };
          
          this.addProcessingError(patent.id, agentError);
          
          // Decide whether to continue or fail
          if (this.shouldFailOnError(agentName)) {
            throw error;
          }
          
          // Continue with partial results
          console.warn(`Agent ${agentName} failed, continuing with partial results:`, error);
        }
      }

      // Compile final results
      const result = await this.compileFinalResults(patent, startTime);
      
      // Mark as complete
      this.completeProcessing(patent.id);
      
      return result;
      
    } catch (error) {
      this.markProcessingFailed(patent.id, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Process multiple patents in batch
   */
  async processPatentBatch(patents: PatentData[]): Promise<PatentAnalysisResult[]> {
    const results: PatentAnalysisResult[] = [];
    
    // Process patents in parallel (with concurrency limit)
    const concurrencyLimit = 3;
    const batches: PatentData[][] = [];
    
    for (let i = 0; i < patents.length; i += concurrencyLimit) {
      batches.push(patents.slice(i, i + concurrencyLimit));
    }
    
    for (const batch of batches) {
      const batchPromises = batch.map(patent => this.processPatent(patent));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Failed to process patent ${batch[index].id}:`, result.reason);
        }
      });
    }
    
    return results;
  }

  /**
   * Get processing status for a patent
   */
  getProcessingStatus(patentId: string): ProcessingStatus | undefined {
    return this.processingStatuses.get(patentId);
  }

  /**
   * Get all processing statuses
   */
  getAllProcessingStatuses(): ProcessingStatus[] {
    return Array.from(this.processingStatuses.values());
  }

  /**
   * Build the processing pipeline based on configuration
   */
  private async buildPipeline(): Promise<string[]> {
    const pipeline: string[] = [];
    
    if (this.config.agents.preprocessor.enabled) {
      pipeline.push('PreprocessorAgent');
    }
    
    if (this.config.agents.entityExtractor.enabled) {
      pipeline.push('EntityExtractionAgent');
    }
    
    if (this.config.agents.relationshipExtractor.enabled) {
      pipeline.push('RelationshipExtractionAgent');
    }
    
    if (this.config.agents.normalizer.enabled) {
      pipeline.push('NormalizationAgent');
    }
    
    if (this.config.agents.graphBuilder.enabled) {
      pipeline.push('GraphBuilderAgent');
    }
    
    if (this.config.agents.clusterer.enabled) {
      pipeline.push('ClusteringAgent');
    }
    
    return pipeline;
  }

  /**
   * Map agent names to pipeline stages
   */
  private getStageForAgent(agentName: string): AgentStage {
    const mapping: Record<string, AgentStage> = {
      'PreprocessorAgent': AgentStage.PREPROCESSED,
      'EntityExtractionAgent': AgentStage.ENTITIES_EXTRACTED,
      'RelationshipExtractionAgent': AgentStage.RELATIONSHIPS_EXTRACTED,
      'NormalizationAgent': AgentStage.NORMALIZED,
      'GraphBuilderAgent': AgentStage.GRAPH_BUILT,
      'ClusteringAgent': AgentStage.CLUSTERED
    };
    
    return mapping[agentName] || AgentStage.INPUT;
  }

  /**
   * Initialize processing status for a patent
   */
  private initializeProcessingStatus(patentId: string): void {
    const status: ProcessingStatus = {
      patentId,
      currentStage: AgentStage.INPUT,
      completedStages: [],
      progress: 0,
      startTime: new Date().toISOString(),
      errors: []
    };
    
    this.processingStatuses.set(patentId, status);
  }

  /**
   * Update processing status
   */
  private updateProcessingStatus(patentId: string, stage: AgentStage): void {
    const status = this.processingStatuses.get(patentId);
    if (!status) return;
    
    status.currentStage = stage;
    if (!status.completedStages.includes(stage)) {
      status.completedStages.push(stage);
    }
    
    // Update progress (rough estimation)
    const totalStages = Object.keys(AgentStage).length;
    status.progress = Math.round((status.completedStages.length / totalStages) * 100);
    
    this.processingStatuses.set(patentId, status);
  }

  /**
   * Add processing error
   */
  private addProcessingError(patentId: string, error: AgentError): void {
    const status = this.processingStatuses.get(patentId);
    if (!status) return;
    
    status.errors.push(error);
    this.processingStatuses.set(patentId, status);
  }

  /**
   * Mark processing as complete
   */
  private completeProcessing(patentId: string): void {
    const status = this.processingStatuses.get(patentId);
    if (!status) return;
    
    status.currentStage = AgentStage.COMPLETE;
    status.progress = 100;
    status.estimatedCompletion = new Date().toISOString();
    
    this.processingStatuses.set(patentId, status);
  }

  /**
   * Mark processing as failed
   */
  private markProcessingFailed(patentId: string, errorMessage: string): void {
    const status = this.processingStatuses.get(patentId);
    if (!status) return;
    
    status.errors.push({
      agentName: 'PipelineOrchestrator',
      stage: status.currentStage,
      error: errorMessage,
      input: null,
      timestamp: new Date().toISOString()
    });
    
    this.processingStatuses.set(patentId, status);
  }

  /**
   * Determine if processing should fail on agent error
   */
  private shouldFailOnError(agentName: string): boolean {
    // Critical agents that should fail the entire pipeline
    const criticalAgents = ['PreprocessorAgent', 'EntityExtractionAgent'];
    return criticalAgents.includes(agentName);
  }

  /**
   * Compile final results from message history
   */
  private async compileFinalResults(
    patent: PatentData,
    startTime: number
  ): Promise<PatentAnalysisResult> {
    const messageHistory = this.messageBus.getHistory(patent.id);
    
    // Extract results from each stage
    const preprocessing = messageHistory.find(m => m.stage === AgentStage.PREPROCESSED)?.data;
    const entities = messageHistory.find(m => m.stage === AgentStage.ENTITIES_EXTRACTED)?.data;
    const relationships = messageHistory.find(m => m.stage === AgentStage.RELATIONSHIPS_EXTRACTED)?.data;
    const normalization = messageHistory.find(m => m.stage === AgentStage.NORMALIZED)?.data;
    const clustering = messageHistory.find(m => m.stage === AgentStage.CLUSTERED)?.data;
    
    // Calculate overall confidence (average of all stages)
    const confidenceScores = messageHistory
      .map(m => m.metadata.confidence)
      .filter(c => c !== undefined);
    const overallConfidence = confidenceScores.length > 0 
      ? confidenceScores.reduce((sum, c) => sum + c, 0) / confidenceScores.length 
      : 0;
    
    return {
      patent,
      preprocessing,
      entities,
      relationships,
      normalization,
      graphContribution: {
        nodesAdded: 0, // Will be populated by GraphBuilderAgent
        edgesAdded: 0,
        nodesUpdated: 0,
        edgesUpdated: 0
      },
      clusterAssignments: clustering?.clusterAssignments?.[patent.id] || [],
      processingTime: Date.now() - startTime,
      overallConfidence
    };
  }

  /**
   * Setup message bus subscribers for monitoring
   */
  private setupMessageBusSubscribers(): void {
    // Subscribe to all messages for logging/monitoring
    this.messageBus.subscribe('*', (message: AgentMessage) => {
      console.log(`Pipeline: ${message.metadata.agentName} completed ${message.stage} for patent ${message.patentId}`);
    });
  }

  /**
   * Get pipeline statistics
   */
  getPipelineStats(): {
    totalProcessed: number;
    currentlyProcessing: number;
    failed: number;
    averageProcessingTime: number;
    stageDistribution: Record<AgentStage, number>;
  } {
    const statuses = Array.from(this.processingStatuses.values());
    
    const stageDistribution: Record<AgentStage, number> = {} as any;
    Object.values(AgentStage).forEach(stage => {
      stageDistribution[stage] = 0;
    });
    
    let totalProcessingTime = 0;
    let completedCount = 0;
    
    statuses.forEach(status => {
      stageDistribution[status.currentStage]++;
      
      if (status.currentStage === AgentStage.COMPLETE) {
        completedCount++;
        if (status.estimatedCompletion && status.startTime) {
          totalProcessingTime += new Date(status.estimatedCompletion).getTime() - 
                                new Date(status.startTime).getTime();
        }
      }
    });
    
    return {
      totalProcessed: completedCount,
      currentlyProcessing: statuses.filter(s => s.currentStage !== AgentStage.COMPLETE).length,
      failed: statuses.filter(s => s.errors.length > 0).length,
      averageProcessingTime: completedCount > 0 ? totalProcessingTime / completedCount : 0,
      stageDistribution
    };
  }
}