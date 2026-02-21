/**
 * Agentic Patent Discovery System - Main Service
 * Coordinates the entire entity-relationship extraction and knowledge graph construction
 */

import { 
  PatentData,
  PipelineConfig,
  PatentAnalysisResult,
  ProcessingStatus,
  AgentStage,
  ClusterType
} from './types';
import { 
  BaseAgent, 
  globalAgentRegistry, 
  globalMessageBus 
} from './BaseAgent';
import { PipelineOrchestrator } from './PipelineOrchestrator';
import { createPreprocessorAgent } from './agents/PreprocessorAgent';
import { createEntityExtractionAgent } from './agents/EntityExtractionAgent';
import { createRelationshipExtractionAgent } from './agents/RelationshipExtractionAgent';
import { createNormalizationAgent } from './agents/NormalizationAgent';
import { createGraphBuilderAgent } from './agents/GraphBuilderAgent';
import { createClusteringAgent } from './agents/ClusteringAgent';

/**
 * Main service class for the Agentic Patent Discovery System
 */
export class AgenticPatentDiscoveryService {
  private orchestrator!: PipelineOrchestrator;
  private config: PipelineConfig;
  private initialized = false;

  constructor() {
    this.config = this.getDefaultConfig();
  }

  /**
   * Initialize the service with all agents
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Register all agents
    this.registerAgents();
    
    // Create pipeline orchestrator
    this.orchestrator = new PipelineOrchestrator(
      globalAgentRegistry,
      globalMessageBus,
      this.config
    );

    this.initialized = true;
    console.log('🚀 Agentic Patent Discovery System initialized successfully');
  }

  /**
   * Process a single patent through the discovery pipeline
   */
  async discoverPatent(patent: PatentData): Promise<PatentAnalysisResult> {
    await this.ensureInitialized();
    
    console.log(`🔍 Starting discovery for patent: ${patent.id}`);
    return await this.orchestrator.processPatent(patent);
  }

  /**
   * Process multiple patents in batch
   */
  async discoverPatentBatch(patents: PatentData[]): Promise<PatentAnalysisResult[]> {
    await this.ensureInitialized();
    
    console.log(`🔍 Starting batch discovery for ${patents.length} patents`);
    return await this.orchestrator.processPatentBatch(patents);
  }

  /**
   * Get real-time processing status for a patent
   */
  getProcessingStatus(patentId: string): ProcessingStatus | undefined {
    return this.orchestrator?.getProcessingStatus(patentId);
  }

  /**
   * Get all current processing statuses
   */
  getAllProcessingStatuses(): ProcessingStatus[] {
    return this.orchestrator?.getAllProcessingStatuses() || [];
  }

  /**
   * Get pipeline statistics and performance metrics
   */
  getPipelineStats() {
    return this.orchestrator?.getPipelineStats() || {
      totalProcessed: 0,
      currentlyProcessing: 0,
      failed: 0,
      averageProcessingTime: 0,
      stageDistribution: {} as Record<AgentStage, number>
    };
  }

  /**
   * Get registered agents information
   */
  getAgentRegistry() {
    return globalAgentRegistry.getStatus();
  }

  /**
   * Get message bus statistics
   */
  getMessageBusStats() {
    return globalMessageBus.getStats();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PipelineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.orchestrator) {
      // Recreate orchestrator with new config
      this.orchestrator = new PipelineOrchestrator(
        globalAgentRegistry,
        globalMessageBus,
        this.config
      );
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): PipelineConfig {
    return { ...this.config };
  }

  /**
   * Clear processing history for cleanup
   */
  clearProcessingHistory(patentId?: string): void {
    globalMessageBus.clearHistory(patentId);
  }

  /**
   * Register all available agents
   */
  private registerAgents(): void {
    // Register Preprocessor Agent
    const preprocessorAgent = createPreprocessorAgent();
    globalAgentRegistry.register(preprocessorAgent);

    // Register Entity Extraction Agent
    const entityExtractionAgent = createEntityExtractionAgent();
    globalAgentRegistry.register(entityExtractionAgent);

    // Register Relationship Extraction Agent
    const relationshipExtractionAgent = createRelationshipExtractionAgent();
    globalAgentRegistry.register(relationshipExtractionAgent);

    // Register Normalization Agent
    const normalizationAgent = createNormalizationAgent();
    globalAgentRegistry.register(normalizationAgent);

    // Register Graph Builder Agent
    const graphBuilderAgent = createGraphBuilderAgent();
    globalAgentRegistry.register(graphBuilderAgent);

    // Register Clustering Agent
    const clusteringAgent = createClusteringAgent();
    globalAgentRegistry.register(clusteringAgent);

    console.log(`📋 Registered ${globalAgentRegistry.getStatus().totalAgents} agents`);
  }

  /**
   * Get default pipeline configuration
   */
  private getDefaultConfig(): PipelineConfig {
    return {
      agents: {
        preprocessor: {
          enabled: true,
          splitSentences: true,
          splitClauses: true,
          cleanText: true
        },
        entityExtractor: {
          enabled: true,
          useDictionary: true,
          usePOSTagging: true,
          useLLM: true,
          confidenceThreshold: 0.7
        },
        relationshipExtractor: {
          enabled: true, // Now implemented
          useLLM: true,
          useDependencyParsing: true,
          confidenceThreshold: 0.8
        },
        normalizer: {
          enabled: true, // Now implemented
          useEmbeddings: true,
          useOntology: true,
          useLLMTiebreaker: true,
          similarityThreshold: 0.85
        },
        graphBuilder: {
          enabled: true, // Now implemented
          mergeThreshold: 0.9,
          minNodeWeight: 1,
          minEdgeWeight: 1
        },
        clusterer: {
          enabled: true, // Now implemented
          clusterTypes: [ClusterType.STRUCTURAL, ClusterType.FUNCTIONAL, ClusterType.APPLICATION],
          minClusterSize: 2,
          maxClusters: 20
        }
      },
      output: {
        includeIntermediateResults: true,
        generateVisualizations: true,
        exportFormats: ['json']
      }
    };
  }

  /**
   * Ensure service is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}

/**
 * Global service instance (singleton pattern)
 */
export const agenticPatentDiscovery = new AgenticPatentDiscoveryService();

/**
 * Helper function to transform patent data from various sources
 */
export function transformPatentData(rawData: any): PatentData {
  return {
    id: rawData.id || `patent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: rawData.title || rawData.patent_title || 'Untitled Patent',
    abstract: rawData.abstract || rawData.patent_abstract || '',
    claims: Array.isArray(rawData.claims) 
      ? rawData.claims 
      : [rawData.claim_1, rawData.claim_2, rawData.claim_3].filter(Boolean) || ['No claims available'],
    description: rawData.description || rawData.detailed_description || '',
    assignee: rawData.assignee || rawData.applicant || '',
    inventors: Array.isArray(rawData.inventors) ? rawData.inventors : [],
    publicationDate: rawData.publication_date || rawData.publicationDate || '',
    ipcClasses: rawData.ipc_classes || [],
    cpcClasses: rawData.cpc_classes || []
  };
}

/**
 * Demo helper function to create mock patent data for testing
 */
export function createMockPatentData(): PatentData {
  return {
    id: 'demo_patent_001',
    title: 'Sensor Device for Autonomous Vehicle Detection Systems',
    abstract: 'A sensor device comprises a photodetector mounted on a substrate, the photodetector being configured to detect infrared radiation and transmit a corresponding signal to a processor for image processing in autonomous vehicles. The system includes advanced filtering and real-time analysis capabilities.',
    claims: [
      '1. A sensor device comprising: a photodetector mounted on a substrate; the photodetector being configured to detect infrared radiation; and a processor coupled to the photodetector, the processor configured to receive signals from the photodetector and process the signals for autonomous vehicle applications.',
      '2. The sensor device of claim 1, wherein the photodetector comprises a photodiode array configured for high-sensitivity detection.',
      '3. The sensor device of claim 1, further comprising: a filter element positioned between the photodetector and an optical input; and amplification circuitry coupled to the photodetector output.'
    ],
    description: 'This invention relates to optical sensing systems, particularly photodetector arrays used in autonomous vehicle navigation and obstacle detection. The device provides enhanced infrared detection capabilities with improved signal processing.',
    assignee: 'Advanced Automotive Technologies Inc.',
    inventors: ['John Smith', 'Sarah Johnson'],
    publicationDate: '2024-01-15',
    ipcClasses: ['G01S17/93', 'H01L31/02'],
    cpcClasses: ['G01S17/936', 'H01L31/0203']
  };
}