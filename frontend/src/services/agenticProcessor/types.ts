/**
 * Type definitions for the Agentic Patent Discovery System
 * Based on entity-relationship extraction and knowledge graph construction
 */

// Core Patent Data Structure
export interface PatentData {
  id: string;
  title: string;
  abstract: string;
  claims: string[];
  description?: string;
  assignee?: string;
  inventors?: string[];
  publicationDate?: string;
  ipcClasses?: string[];
  cpcClasses?: string[];
}

// Agent Communication Protocol
export interface AgentMessage {
  patentId: string;
  stage: AgentStage;
  data: any;
  metadata: AgentMetadata;
  timestamp: string;
}

export interface AgentMetadata {
  agentName: string;
  processingTime: number;
  confidence: number;
  version: string;
  modelUsed?: string;
}

export enum AgentStage {
  INPUT = 'input',
  PREPROCESSED = 'preprocessed', 
  ENTITIES_EXTRACTED = 'entities_extracted',
  RELATIONSHIPS_EXTRACTED = 'relationships_extracted',
  NORMALIZED = 'normalized',
  GRAPH_BUILT = 'graph_built',
  CLUSTERED = 'clustered',
  COMPLETE = 'complete'
}

// Preprocessing Results
export interface PreprocessingResult {
  patentId: string;
  sentences: string[];
  clauses: string[];
  cleanedText: {
    title: string;
    abstract: string;
    claims: string[];
  };
  metadata: {
    sentenceCount: number;
    clauseCount: number;
    totalWords: number;
  };
}

// Entity Extraction Results
export interface ExtractedEntity {
  text: string;
  type: EntityType;
  confidence: number;
  startPos: number;
  endPos: number;
  source: 'dictionary' | 'pos_tagging' | 'llm' | 'ontology';
  normalizedForm?: string;
}

export enum EntityType {
  COMPONENT = 'component',
  PROCESS = 'process', 
  APPLICATION = 'application',
  MATERIAL = 'material',
  PARAMETER = 'parameter',
  SYSTEM = 'system'
}

export interface EntityExtractionResult {
  patentId: string;
  entities: ExtractedEntity[];
  entityCounts: Record<EntityType, number>;
  confidence: number;
  processingStats: {
    dictionaryMatches: number;
    posTagMatches: number;
    llmExtractions: number;
    totalEntities: number;
  };
}

// Relationship Extraction Results
export interface ExtractedRelationship {
  subject: ExtractedEntity;
  predicate: string;
  object: ExtractedEntity;
  type: RelationshipType;
  confidence: number;
  source: 'llm' | 'dependency_parsing' | 'pattern';
  context: string; // The sentence/clause that supports this relationship
  startPos: number;
  endPos: number;
}

export enum RelationshipType {
  STRUCTURAL = 'structural',     // "mounted on", "connected to", "integrated with"
  FUNCTIONAL = 'functional',     // "detects", "processes", "transmits", "controls"
  APPLICATION = 'application',   // "used in", "applied to", "suitable for"
  COMPOSITIONAL = 'compositional', // "comprises", "includes", "contains"
  CAUSAL = 'causal',            // "causes", "results in", "leads to"
  DEPENDENCY = 'dependency',     // "depends on", "requires", "needs"
  QUANTITATIVE = 'quantitative', // "has value", "equals", "measures"
  COMPARATIVE = 'comparative',   // "compared to", "versus", "relative to"
  TEMPORAL = 'temporal'         // "before", "after", "during", "while"
}

export interface RelationshipExtractionResult {
  patentId: string;
  relationships: ExtractedRelationship[];
  relationshipCounts: Record<RelationshipType, number>;
  confidence: number;
  processingStats: {
    patternMatches: number;
    dependencyExtractions: number;
    llmExtractions: number;
    totalRelationships: number;
    uniqueEntityPairs: number;
  };
}

export interface Triple {
  subject: string;
  predicate: string;
  object: string;
  type: RelationshipType;
  confidence: number;
}

// Normalization Results
export interface NormalizedTerm {
  originalTerm: string;
  normalizedTerm: string;
  confidence: number;
  source: 'embeddings' | 'ontology' | 'llm_tiebreaker';
  synonyms: string[];
  hierarchicalParent?: string;
}

export interface NormalizationResult {
  patentId: string;
  normalizedEntities: NormalizedTerm[];
  normalizedRelationships: NormalizedTerm[];
  ontologyMatches: number;
  embeddingMatches: number;
  llmTiebreaks: number;
}

// Knowledge Graph Results
export interface GraphNode {
  id: string;
  label: string;
  type: EntityType;
  weight: number;
  confidence: number;
  aliases: string[];
  metadata?: {
    source?: string;
    hierarchicalParent?: string;
    synonyms?: string[];
    createdFromPatent?: boolean;
    mergedFrom?: string[];
    mergedNodeCount?: number;
    [key: string]: any;
  };
}

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  weight: number;
  confidence: number;
  label: string;
  metadata?: {
    source?: string;
    originalPredicate?: string;
    context?: string;
    inferredRelationship?: boolean;
    [key: string]: any;
  };
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    totalNodes: number;
    totalEdges: number;
    nodeTypes: Record<string, number>;
    edgeTypes: Record<string, number>;
    mostImportantNodes: string[];
    graphDensity: number;
    createdAt: string;
    version: string;
  };
}

export interface GraphBuilderResult {
  patentId: string;
  knowledgeGraph: KnowledgeGraph;
  graphContribution: {
    nodesAdded: number;
    edgesAdded: number;
    nodesUpdated: number;
    edgesUpdated: number;
  };
  constructionStats: {
    nodesCreated: number;
    edgesCreated: number;
    nodesMerged: number;
    edgesMerged: number;
    orphanNodes: number;
    connectedComponents: number;
    averageNodeDegree: number;
    graphDensity: number;
  };
  nodeImportances: Array<{
    nodeId: string;
    degree: number;
    betweennessCentrality: number;
    pageRank: number;
    overallScore: number;
  }>;
  confidence: number;
}

// Clustering Results
export enum ClusterType {
  STRUCTURAL = 'structural',
  FUNCTIONAL = 'functional', 
  APPLICATION = 'application'
}

export interface PatentCluster {
  id: string;
  name: string;
  type: ClusterType;
  memberNodes: string[];
  centerNode: string;
  coherence: number;
  size: number;
  description: string;
  keyProperties: string[];
  representativeTerms: string[];
}

export interface ClusteringResult {
  patentId: string;
  clusters: PatentCluster[];
  clusterAssignments: Record<string, string[]>;
  clusteringMetrics: {
    silhouetteScore: number;
    intraClusterSimilarity: number;
    interClusterSeparation: number;
    clusterCoherence: number;
    coverageScore: number;
  };
  clusterQualities: Array<{
    clusterId: string;
    coherence: number;
    separation: number;
    size: number;
    diversity: number;
    representativeness: number;
  }>;
  technologyLandscape: {
    dominantClusters: Array<{
      id: string;
      name: string;
      type: ClusterType;
      size: number;
      coherence: number;
    }>;
    technologyDomains: Record<string, number>;
    emergingPatterns: string[];
  };
  processingStats: {
    totalClusters: number;
    structuralClusters: number;
    functionalClusters: number;
    applicationClusters: number;
    averageClusterSize: number;
    clusterCoverage: number;
  };
}

// Final Processing Result
export interface PatentAnalysisResult {
  patent: PatentData;
  preprocessing: PreprocessingResult;
  entities: EntityExtractionResult;
  relationships: RelationshipExtractionResult;
  normalization: NormalizationResult;
  graphContribution: {
    nodesAdded: number;
    edgesAdded: number;
    nodesUpdated: number;
    edgesUpdated: number;
  };
  clusterAssignments: string[];
  processingTime: number;
  overallConfidence: number;
  // Optional detailed analysis results
  graphBuilder?: GraphBuilderResult;
  clustering?: ClusteringResult;
}

// Agent Interface
export interface Agent {
  name: string;
  version: string;
  process(input: any): Promise<AgentMessage>;
  validateInput(input: any): boolean;
  getCapabilities(): string[];
}

// Pipeline Configuration
export interface PipelineConfig {
  agents: {
    preprocessor: {
      enabled: boolean;
      splitSentences: boolean;
      splitClauses: boolean;
      cleanText: boolean;
    };
    entityExtractor: {
      enabled: boolean;
      useDictionary: boolean;
      usePOSTagging: boolean;
      useLLM: boolean;
      llmModel?: string;
      confidenceThreshold: number;
    };
    relationshipExtractor: {
      enabled: boolean;
      useLLM: boolean;
      useDependencyParsing: boolean;
      llmModel?: string;
      confidenceThreshold: number;
    };
    normalizer: {
      enabled: boolean;
      useEmbeddings: boolean;
      useOntology: boolean;
      useLLMTiebreaker: boolean;
      embeddingModel?: string;
      similarityThreshold: number;
    };
    graphBuilder: {
      enabled: boolean;
      mergeThreshold: number;
      minNodeWeight: number;
      minEdgeWeight: number;
    };
    clusterer: {
      enabled: boolean;
      clusterTypes: ClusterType[];
      minClusterSize: number;
      maxClusters: number;
    };
  };
  output: {
    includeIntermediateResults: boolean;
    generateVisualizations: boolean;
    exportFormats: ('json' | 'csv' | 'rdf' | 'neo4j')[];
  };
}

// Error Handling
export interface AgentError {
  agentName: string;
  stage: AgentStage;
  error: string;
  input: any;
  timestamp: string;
}

// Processing Status
export interface ProcessingStatus {
  patentId: string;
  currentStage: AgentStage;
  completedStages: AgentStage[];
  progress: number; // 0-100
  startTime: string;
  estimatedCompletion?: string;
  errors: AgentError[];
}