/**
 * Graph Builder Agent - Knowledge Graph Construction
 * Constructs semantic knowledge graphs from normalized entities and relationships
 * Creates nodes, edges, and graph structures for patent discovery
 */

import { BaseAgent } from '../BaseAgent';
import { 
  AgentMessage, 
  AgentStage, 
  NormalizationResult,
  GraphNode,
  GraphEdge,
  KnowledgeGraph,
  GraphBuilderResult,
  EntityType,
  RelationshipType
} from '../types';

/**
 * Graph construction statistics and metrics
 */
interface GraphConstructionStats {
  nodesCreated: number;
  edgesCreated: number;
  nodesMerged: number;
  edgesMerged: number;
  orphanNodes: number;
  connectedComponents: number;
  averageNodeDegree: number;
  graphDensity: number;
}

/**
 * Node importance scoring for graph ranking
 */
interface NodeImportance {
  nodeId: string;
  degree: number;
  betweennessCentrality: number;
  pageRank: number;
  overallScore: number;
}

/**
 * Graph Builder Agent using semantic knowledge construction
 */
export class GraphBuilderAgent extends BaseAgent {
  private mergeThreshold = 0.9;
  private minNodeWeight = 1;
  private minEdgeWeight = 1;
  
  constructor() {
    super(
      'GraphBuilderAgent', 
      '1.0.0', 
      ['knowledge_graph', 'graph_construction', 'node_merging', 'semantic_networks']
    );
  }

  /**
   * Process normalization results to build knowledge graph
   */
  async process(input: any): Promise<AgentMessage> {
    if (!this.validateInput(input)) {
      throw new Error('Invalid input: Expected NormalizationResult object');
    }

    const normalizationResult = input as NormalizationResult;
    const { result, processingTime } = await this.measureProcessingTime(
      () => this.buildKnowledgeGraph(normalizationResult)
    );

    // Calculate confidence based on graph quality
    const confidence = this.calculateConfidence(result);

    return this.createMessage(
      normalizationResult.patentId,
      AgentStage.GRAPH_BUILT,
      result,
      processingTime,
      confidence
    );
  }

  /**
   * Validate input structure
   */
  validateInput(input: any): boolean {
    return !!(
      input &&
      input.patentId &&
      input.normalizedEntities &&
      Array.isArray(input.normalizedEntities) &&
      input.normalizedRelationships &&
      Array.isArray(input.normalizedRelationships)
    );
  }

  /**
   * Main knowledge graph construction logic
   */
  private async buildKnowledgeGraph(normalizationResult: NormalizationResult): Promise<GraphBuilderResult> {
    this.log('info', `Starting knowledge graph construction for patent ${normalizationResult.patentId}`);

    // Step 1: Create nodes from normalized entities
    const nodes = this.createNodes(normalizationResult.normalizedEntities);
    
    // Step 2: Create edges from normalized relationships  
    const edges = this.createEdges(normalizationResult.normalizedRelationships, nodes);
    
    // Step 3: Merge similar nodes based on semantic similarity
    const { mergedNodes, nodeMapping } = this.mergeNodes(nodes);
    
    // Step 4: Update edges with merged node references
    const updatedEdges = this.updateEdgesAfterMerge(edges, nodeMapping);
    
    // Step 5: Merge similar edges
    const mergedEdges = this.mergeEdges(updatedEdges);
    
    // Step 6: Calculate node importance and rankings
    const nodeImportances = this.calculateNodeImportance(mergedNodes, mergedEdges);
    
    // Step 7: Construct final knowledge graph
    const knowledgeGraph = this.constructKnowledgeGraph(mergedNodes, mergedEdges, nodeImportances);
    
    // Step 8: Calculate graph statistics
    const constructionStats = this.calculateGraphStats(mergedNodes, mergedEdges);
    
    // Step 9: Generate graph contribution metrics
    const graphContribution = {
      nodesAdded: mergedNodes.length,
      edgesAdded: mergedEdges.length,
      nodesUpdated: constructionStats.nodesMerged,
      edgesUpdated: constructionStats.edgesMerged
    };

    const result: GraphBuilderResult = {
      patentId: normalizationResult.patentId,
      knowledgeGraph,
      graphContribution,
      constructionStats,
      nodeImportances,
      confidence: this.calculateGraphQuality(knowledgeGraph, constructionStats)
    };

    this.log('info', `Knowledge graph construction completed: ${mergedNodes.length} nodes, ${mergedEdges.length} edges`);
    
    return result;
  }

  /**
   * Create nodes from normalized entities
   */
  private createNodes(normalizedEntities: any[]): GraphNode[] {
    const nodeMap = new Map<string, GraphNode>();
    
    normalizedEntities.forEach((entity, index) => {
      const nodeId = this.generateNodeId(entity.normalizedTerm || entity.originalTerm);
      
      if (nodeMap.has(nodeId)) {
        // Merge with existing node
        const existingNode = nodeMap.get(nodeId)!;
        existingNode.weight += 1;
        existingNode.aliases = [...new Set([...existingNode.aliases, entity.originalTerm])];
        existingNode.confidence = Math.max(existingNode.confidence, entity.confidence || 0.5);
      } else {
        // Create new node
        const node: GraphNode = {
          id: nodeId,
          label: entity.normalizedTerm || entity.originalTerm,
          type: this.inferNodeType(entity.originalTerm),
          weight: 1,
          confidence: entity.confidence || 0.5,
          aliases: [entity.originalTerm],
          metadata: {
            source: entity.source || 'unknown',
            hierarchicalParent: entity.hierarchicalParent,
            synonyms: entity.synonyms || [],
            createdFromPatent: true
          }
        };
        
        nodeMap.set(nodeId, node);
      }
    });
    
    return Array.from(nodeMap.values()).filter(node => node.weight >= this.minNodeWeight);
  }

  /**
   * Create edges from relationships (we'll need to get relationships from somewhere)
   * For now, we'll simulate this with the normalization data
   */
  private createEdges(normalizedRelationships: any[], nodes: GraphNode[]): GraphEdge[] {
    const edges: GraphEdge[] = [];
    const nodeMap = new Map(nodes.map(node => [node.label.toLowerCase(), node]));
    
    // Simulate relationship edges from normalized relationship terms
    // In practice, this would come from the RelationshipExtractionResult
    normalizedRelationships.forEach((rel, index) => {
      // For demonstration, create some synthetic relationships
      const relationshipType = this.inferRelationshipType(rel.normalizedTerm || rel.originalTerm);
      
      // Create edges between related terms (simplified for demo)
      const relatedNodes = Array.from(nodeMap.values()).slice(0, 2);
      if (relatedNodes.length >= 2) {
        const edge: GraphEdge = {
          id: `edge_${index}`,
          sourceId: relatedNodes[0].id,
          targetId: relatedNodes[1].id,
          type: relationshipType,
          weight: 1,
          confidence: rel.confidence || 0.7,
          label: rel.normalizedTerm || rel.originalTerm,
          metadata: {
            source: rel.source || 'normalization',
            originalPredicate: rel.originalTerm,
            context: `Relationship inferred from ${rel.originalTerm}`
          }
        };
        
        edges.push(edge);
      }
    });
    
    // Add structural edges based on node types
    this.addStructuralEdges(edges, nodes);
    
    return edges.filter(edge => edge.weight >= this.minEdgeWeight);
  }

  /**
   * Add structural edges based on semantic relationships
   */
  private addStructuralEdges(edges: GraphEdge[], nodes: GraphNode[]): void {
    const componentNodes = nodes.filter(n => n.type === 'COMPONENT');
    const processNodes = nodes.filter(n => n.type === 'PROCESS');
    const systemNodes = nodes.filter(n => n.type === 'SYSTEM');
    
    // Create component-process relationships
    componentNodes.forEach(comp => {
      processNodes.forEach(proc => {
        if (this.areSemanticallySimilar(comp.label, proc.label)) {
          edges.push({
            id: `struct_${comp.id}_${proc.id}`,
            sourceId: comp.id,
            targetId: proc.id,
            type: RelationshipType.FUNCTIONAL,
            weight: 0.8,
            confidence: 0.75,
            label: 'performs',
            metadata: {
              source: 'structural_inference',
              inferredRelationship: true
            }
          });
        }
      });
    });
    
    // Create system-component relationships
    systemNodes.forEach(sys => {
      componentNodes.forEach(comp => {
        if (this.areSemanticallySimilar(sys.label, comp.label)) {
          edges.push({
            id: `struct_${sys.id}_${comp.id}`,
            sourceId: sys.id,
            targetId: comp.id,
            type: RelationshipType.STRUCTURAL,
            weight: 0.9,
            confidence: 0.8,
            label: 'comprises',
            metadata: {
              source: 'structural_inference',
              inferredRelationship: true
            }
          });
        }
      });
    });
  }

  /**
   * Merge similar nodes based on semantic similarity
   */
  private mergeNodes(nodes: GraphNode[]): { mergedNodes: GraphNode[], nodeMapping: Map<string, string> } {
    const mergedNodes: GraphNode[] = [];
    const nodeMapping = new Map<string, string>();
    const processedNodes = new Set<string>();
    
    nodes.forEach(node => {
      if (processedNodes.has(node.id)) return;
      
      const similarNodes = nodes.filter(other => 
        !processedNodes.has(other.id) && 
        other.id !== node.id &&
        this.calculateNodeSimilarity(node, other) >= this.mergeThreshold
      );
      
      if (similarNodes.length > 0) {
        // Merge similar nodes
        const mergedNode: GraphNode = {
          id: node.id,
          label: node.label,
          type: node.type,
          weight: node.weight + similarNodes.reduce((sum, n) => sum + n.weight, 0),
          confidence: Math.max(node.confidence, ...similarNodes.map(n => n.confidence)),
          aliases: [...new Set([
            ...node.aliases,
            ...similarNodes.flatMap(n => n.aliases)
          ])],
          metadata: {
            ...node.metadata,
            mergedFrom: similarNodes.map(n => n.id),
            mergedNodeCount: similarNodes.length + 1
          }
        };
        
        mergedNodes.push(mergedNode);
        
        // Update mapping
        nodeMapping.set(node.id, mergedNode.id);
        similarNodes.forEach(similar => {
          nodeMapping.set(similar.id, mergedNode.id);
          processedNodes.add(similar.id);
        });
      } else {
        // Keep node as-is
        mergedNodes.push(node);
        nodeMapping.set(node.id, node.id);
      }
      
      processedNodes.add(node.id);
    });
    
    return { mergedNodes, nodeMapping };
  }

  /**
   * Update edges after node merging
   */
  private updateEdgesAfterMerge(edges: GraphEdge[], nodeMapping: Map<string, string>): GraphEdge[] {
    return edges.map(edge => ({
      ...edge,
      sourceId: nodeMapping.get(edge.sourceId) || edge.sourceId,
      targetId: nodeMapping.get(edge.targetId) || edge.targetId
    })).filter(edge => edge.sourceId !== edge.targetId); // Remove self-loops
  }

  /**
   * Merge similar edges
   */
  private mergeEdges(edges: GraphEdge[]): GraphEdge[] {
    const edgeMap = new Map<string, GraphEdge>();
    
    edges.forEach(edge => {
      const key = `${edge.sourceId}-${edge.targetId}-${edge.type}`;
      const existing = edgeMap.get(key);
      
      if (existing) {
        // Merge edges
        existing.weight += edge.weight;
        existing.confidence = Math.max(existing.confidence, edge.confidence);
      } else {
        edgeMap.set(key, { ...edge });
      }
    });
    
    return Array.from(edgeMap.values());
  }

  /**
   * Calculate node importance metrics
   */
  private calculateNodeImportance(nodes: GraphNode[], edges: GraphEdge[]): NodeImportance[] {
    const nodeImportances: NodeImportance[] = [];
    
    // Create adjacency map for calculations
    const adjacencyMap = new Map<string, string[]>();
    nodes.forEach(node => adjacencyMap.set(node.id, []));
    
    edges.forEach(edge => {
      adjacencyMap.get(edge.sourceId)?.push(edge.targetId);
      adjacencyMap.get(edge.targetId)?.push(edge.sourceId);
    });
    
    nodes.forEach(node => {
      const degree = adjacencyMap.get(node.id)?.length || 0;
      
      // Simple importance metrics (in production, use proper algorithms)
      const betweennessCentrality = this.calculateBetweennessCentrality(node.id, adjacencyMap);
      const pageRank = this.calculateSimplePageRank(node.id, adjacencyMap, nodes.length);
      
      const overallScore = (degree * 0.3) + (betweennessCentrality * 0.4) + (pageRank * 0.3);
      
      nodeImportances.push({
        nodeId: node.id,
        degree,
        betweennessCentrality,
        pageRank,
        overallScore
      });
    });
    
    return nodeImportances.sort((a, b) => b.overallScore - a.overallScore);
  }

  /**
   * Construct final knowledge graph
   */
  private constructKnowledgeGraph(
    nodes: GraphNode[], 
    edges: GraphEdge[], 
    nodeImportances: NodeImportance[]
  ): KnowledgeGraph {
    return {
      nodes,
      edges,
      metadata: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        nodeTypes: this.getNodeTypeCounts(nodes),
        edgeTypes: this.getEdgeTypeCounts(edges),
        mostImportantNodes: nodeImportances.slice(0, 5).map(ni => ni.nodeId),
        graphDensity: edges.length / (nodes.length * (nodes.length - 1)),
        createdAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };
  }

  /**
   * Helper methods for graph analysis
   */
  private calculateNodeSimilarity(node1: GraphNode, node2: GraphNode): number {
    // Simple similarity based on labels and aliases
    const allTerms1 = [node1.label, ...node1.aliases].map(t => t.toLowerCase());
    const allTerms2 = [node2.label, ...node2.aliases].map(t => t.toLowerCase());
    
    const intersection = allTerms1.filter(t => allTerms2.includes(t)).length;
    const union = new Set([...allTerms1, ...allTerms2]).size;
    
    return intersection / union;
  }

  private areSemanticallySimilar(term1: string, term2: string): boolean {
    // Simple semantic similarity check
    const words1 = term1.toLowerCase().split(/\s+/);
    const words2 = term2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(w => words2.includes(w)).length;
    return commonWords > 0 || this.calculateLevenshteinSimilarity(term1, term2) > 0.7;
  }

  private calculateLevenshteinSimilarity(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - (matrix[str2.length][str1.length] / maxLength);
  }

  private calculateBetweennessCentrality(nodeId: string, adjacencyMap: Map<string, string[]>): number {
    // Simplified betweenness centrality calculation
    return Math.random() * 0.5; // Placeholder for demo
  }

  private calculateSimplePageRank(nodeId: string, adjacencyMap: Map<string, string[]>, totalNodes: number): number {
    // Simplified PageRank calculation
    const degree = adjacencyMap.get(nodeId)?.length || 0;
    return degree / totalNodes;
  }

  private calculateGraphStats(nodes: GraphNode[], edges: GraphEdge[]): GraphConstructionStats {
    const nodeTypes = this.getNodeTypeCounts(nodes);
    const totalDegree = edges.length * 2; // Each edge contributes to 2 nodes
    const averageNodeDegree = nodes.length > 0 ? totalDegree / nodes.length : 0;
    const graphDensity = nodes.length > 1 ? edges.length / (nodes.length * (nodes.length - 1)) : 0;
    
    return {
      nodesCreated: nodes.length,
      edgesCreated: edges.length,
      nodesMerged: nodes.filter(n => n.metadata?.mergedNodeCount && n.metadata.mergedNodeCount > 1).length,
      edgesMerged: 0, // Would be calculated during edge merging
      orphanNodes: nodes.filter(n => !edges.some(e => e.sourceId === n.id || e.targetId === n.id)).length,
      connectedComponents: this.calculateConnectedComponents(nodes, edges),
      averageNodeDegree,
      graphDensity
    };
  }

  private calculateConnectedComponents(nodes: GraphNode[], edges: GraphEdge[]): number {
    // Simple connected component calculation using DFS
    const visited = new Set<string>();
    let components = 0;
    
    const adjacencyMap = new Map<string, string[]>();
    nodes.forEach(node => adjacencyMap.set(node.id, []));
    edges.forEach(edge => {
      adjacencyMap.get(edge.sourceId)?.push(edge.targetId);
      adjacencyMap.get(edge.targetId)?.push(edge.sourceId);
    });
    
    const dfs = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      adjacencyMap.get(nodeId)?.forEach(neighbor => dfs(neighbor));
    };
    
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        dfs(node.id);
        components++;
      }
    });
    
    return components;
  }

  private getNodeTypeCounts(nodes: GraphNode[]): Record<string, number> {
    const counts: Record<string, number> = {};
    nodes.forEach(node => {
      counts[node.type] = (counts[node.type] || 0) + 1;
    });
    return counts;
  }

  private getEdgeTypeCounts(edges: GraphEdge[]): Record<string, number> {
    const counts: Record<string, number> = {};
    edges.forEach(edge => {
      counts[edge.type] = (counts[edge.type] || 0) + 1;
    });
    return counts;
  }

  private generateNodeId(term: string): string {
    return term.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }

  private inferNodeType(term: string): EntityType {
    const lowerTerm = term.toLowerCase();
    
    if (/processor|cpu|controller|chip|microprocessor/.test(lowerTerm)) return EntityType.COMPONENT;
    if (/sensor|detector|photodetector/.test(lowerTerm)) return EntityType.COMPONENT;
    if (/processing|analyzing|detecting|controlling/.test(lowerTerm)) return EntityType.PROCESS;
    if (/system|apparatus|device|platform/.test(lowerTerm)) return EntityType.SYSTEM;
    if (/silicon|metal|polymer|material/.test(lowerTerm)) return EntityType.MATERIAL;
    if (/automotive|medical|wireless/.test(lowerTerm)) return EntityType.APPLICATION;
    if (/voltage|current|temperature|frequency/.test(lowerTerm)) return EntityType.PARAMETER;
    
    return EntityType.COMPONENT; // Default
  }

  private inferRelationshipType(term: string): RelationshipType {
    const lowerTerm = term.toLowerCase();
    
    if (/connect|couple|mount|attach/.test(lowerTerm)) return RelationshipType.STRUCTURAL;
    if (/process|control|detect|analyze/.test(lowerTerm)) return RelationshipType.FUNCTIONAL;
    if (/comprise|include|contain/.test(lowerTerm)) return RelationshipType.COMPOSITIONAL;
    if (/use|apply|utilize/.test(lowerTerm)) return RelationshipType.APPLICATION;
    if (/cause|result|lead/.test(lowerTerm)) return RelationshipType.CAUSAL;
    if (/depend|require|need/.test(lowerTerm)) return RelationshipType.DEPENDENCY;
    
    return RelationshipType.FUNCTIONAL; // Default
  }

  private calculateGraphQuality(graph: KnowledgeGraph, stats: GraphConstructionStats): number {
    // Quality based on graph connectivity and structure
    const connectivityScore = 1 - (stats.orphanNodes / stats.nodesCreated);
    const densityScore = Math.min(stats.graphDensity * 10, 1); // Normalize density
    const componentScore = 1 / Math.max(stats.connectedComponents, 1);
    
    return (connectivityScore * 0.4) + (densityScore * 0.3) + (componentScore * 0.3);
  }

  private calculateConfidence(result: GraphBuilderResult): number {
    return result.confidence;
  }
}

/**
 * Factory function to create graph builder agent instance
 */
export function createGraphBuilderAgent(): GraphBuilderAgent {
  return new GraphBuilderAgent();
}