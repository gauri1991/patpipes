/**
 * Clustering Agent - Multi-dimensional Patent Grouping
 * Creates structural, functional, and application-based patent clusters
 * Enables discovery of patent families and technology landscapes
 */

import { BaseAgent } from '../BaseAgent';
import { 
  AgentMessage, 
  AgentStage, 
  GraphBuilderResult,
  PatentCluster,
  ClusterType,
  ClusteringResult,
  GraphNode,
  GraphEdge,
  EntityType,
  RelationshipType
} from '../types';

/**
 * Multi-dimensional clustering metrics and algorithms
 */
interface ClusteringMetrics {
  silhouetteScore: number;
  intraClusterSimilarity: number;
  interClusterSeparation: number;
  clusterCoherence: number;
  coverageScore: number;
}

/**
 * Node similarity calculation for clustering
 */
interface NodeSimilarity {
  nodeId1: string;
  nodeId2: string;
  structuralSimilarity: number;
  functionalSimilarity: number;
  applicationSimilarity: number;
  overallSimilarity: number;
}

/**
 * Cluster quality assessment
 */
interface ClusterQuality {
  clusterId: string;
  coherence: number;
  separation: number;
  size: number;
  diversity: number;
  representativeness: number;
}

/**
 * Clustering Agent using multi-dimensional patent analysis
 */
export class ClusteringAgent extends BaseAgent {
  private minClusterSize = 2;
  private maxClusters = 20;
  private similarityThreshold = 0.6;
  
  constructor() {
    super(
      'ClusteringAgent', 
      '1.0.0', 
      ['patent_clustering', 'multi_dimensional_analysis', 'technology_landscapes', 'patent_families']
    );
  }

  /**
   * Process knowledge graph to create patent clusters
   */
  async process(input: any): Promise<AgentMessage> {
    if (!this.validateInput(input)) {
      throw new Error('Invalid input: Expected GraphBuilderResult object');
    }

    const graphResult = input as GraphBuilderResult;
    const { result, processingTime } = await this.measureProcessingTime(
      () => this.createPatentClusters(graphResult)
    );

    // Calculate confidence based on clustering quality
    const confidence = this.calculateConfidence(result);

    return this.createMessage(
      graphResult.patentId,
      AgentStage.CLUSTERED,
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
      input.knowledgeGraph &&
      input.knowledgeGraph.nodes &&
      Array.isArray(input.knowledgeGraph.nodes) &&
      input.knowledgeGraph.edges &&
      Array.isArray(input.knowledgeGraph.edges)
    );
  }

  /**
   * Main clustering logic using multi-dimensional approach
   */
  private async createPatentClusters(graphResult: GraphBuilderResult): Promise<ClusteringResult> {
    this.log('info', `Starting multi-dimensional clustering for patent ${graphResult.patentId}`);

    const { nodes, edges } = graphResult.knowledgeGraph;

    // Step 1: Calculate multi-dimensional node similarities
    const nodeSimilarities = this.calculateNodeSimilarities(nodes, edges);
    
    // Step 2: Create structural clusters (based on components and connections)
    const structuralClusters = this.createStructuralClusters(nodes, edges, nodeSimilarities);
    
    // Step 3: Create functional clusters (based on processes and operations)
    const functionalClusters = this.createFunctionalClusters(nodes, edges, nodeSimilarities);
    
    // Step 4: Create application clusters (based on domains and use cases)
    const applicationClusters = this.createApplicationClusters(nodes, edges, nodeSimilarities);
    
    // Step 5: Merge and optimize clusters across dimensions
    const optimizedClusters = this.optimizeClusters([
      ...structuralClusters,
      ...functionalClusters, 
      ...applicationClusters
    ]);
    
    // Step 6: Calculate cluster quality metrics
    const clusterQualities = this.assessClusterQuality(optimizedClusters, nodes, edges);
    
    // Step 7: Generate clustering metrics
    const clusteringMetrics = this.calculateClusteringMetrics(optimizedClusters, nodes, clusterQualities);
    
    // Step 8: Create cluster assignments for patents (simulated for single patent)
    const clusterAssignments = this.generateClusterAssignments(graphResult.patentId, optimizedClusters);

    // Step 9: Generate technology landscape insights
    const technologyLandscape = this.generateTechnologyLandscape(optimizedClusters, nodes);

    const result: ClusteringResult = {
      patentId: graphResult.patentId,
      clusters: optimizedClusters,
      clusterAssignments,
      clusteringMetrics,
      clusterQualities,
      technologyLandscape,
      processingStats: {
        totalClusters: optimizedClusters.length,
        structuralClusters: structuralClusters.length,
        functionalClusters: functionalClusters.length,
        applicationClusters: applicationClusters.length,
        averageClusterSize: optimizedClusters.reduce((sum, c) => sum + c.memberNodes.length, 0) / optimizedClusters.length,
        clusterCoverage: this.calculateClusterCoverage(optimizedClusters, nodes)
      }
    };

    this.log('info', `Clustering completed: ${optimizedClusters.length} clusters created`);
    
    return result;
  }

  /**
   * Calculate multi-dimensional similarities between nodes
   */
  private calculateNodeSimilarities(nodes: GraphNode[], edges: GraphEdge[]): NodeSimilarity[] {
    const similarities: NodeSimilarity[] = [];
    
    // Create adjacency map for structural analysis
    const adjacencyMap = new Map<string, Set<string>>();
    nodes.forEach(node => adjacencyMap.set(node.id, new Set()));
    edges.forEach(edge => {
      adjacencyMap.get(edge.sourceId)?.add(edge.targetId);
      adjacencyMap.get(edge.targetId)?.add(edge.sourceId);
    });

    // Calculate pairwise similarities
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];
        
        const structuralSim = this.calculateStructuralSimilarity(node1, node2, adjacencyMap);
        const functionalSim = this.calculateFunctionalSimilarity(node1, node2, edges);
        const applicationSim = this.calculateApplicationSimilarity(node1, node2);
        
        const overallSim = (structuralSim * 0.4) + (functionalSim * 0.4) + (applicationSim * 0.2);
        
        similarities.push({
          nodeId1: node1.id,
          nodeId2: node2.id,
          structuralSimilarity: structuralSim,
          functionalSimilarity: functionalSim,
          applicationSimilarity: applicationSim,
          overallSimilarity: overallSim
        });
      }
    }
    
    return similarities.sort((a, b) => b.overallSimilarity - a.overallSimilarity);
  }

  /**
   * Create structural clusters based on component relationships
   */
  private createStructuralClusters(
    nodes: GraphNode[], 
    edges: GraphEdge[], 
    similarities: NodeSimilarity[]
  ): PatentCluster[] {
    const clusters: PatentCluster[] = [];
    const clusteredNodes = new Set<string>();
    
    // Group nodes by structural relationships
    const componentNodes = nodes.filter(n => n.type === EntityType.COMPONENT);
    const systemNodes = nodes.filter(n => n.type === EntityType.SYSTEM);
    
    // Create component-based clusters
    componentNodes.forEach((componentNode, index) => {
      if (clusteredNodes.has(componentNode.id)) return;
      
      const relatedNodes = this.findStructurallyRelatedNodes(componentNode, nodes, edges);
      const clusterNodes = [componentNode, ...relatedNodes].filter(n => !clusteredNodes.has(n.id));
      
      if (clusterNodes.length >= this.minClusterSize) {
        const cluster: PatentCluster = {
          id: `structural_${index}`,
          name: `${componentNode.label} System`,
          type: ClusterType.STRUCTURAL,
          memberNodes: clusterNodes.map(n => n.id),
          centerNode: componentNode.id,
          coherence: this.calculateClusterCoherence(clusterNodes, similarities),
          size: clusterNodes.length,
          description: `Structural cluster centered around ${componentNode.label} components`,
          keyProperties: this.extractKeyProperties(clusterNodes, ClusterType.STRUCTURAL),
          representativeTerms: this.extractRepresentativeTerms(clusterNodes, ClusterType.STRUCTURAL)
        };
        
        clusters.push(cluster);
        clusterNodes.forEach(node => clusteredNodes.add(node.id));
      }
    });
    
    return clusters;
  }

  /**
   * Create functional clusters based on process relationships
   */
  private createFunctionalClusters(
    nodes: GraphNode[], 
    edges: GraphEdge[], 
    similarities: NodeSimilarity[]
  ): PatentCluster[] {
    const clusters: PatentCluster[] = [];
    const clusteredNodes = new Set<string>();
    
    // Group nodes by functional relationships
    const processNodes = nodes.filter(n => n.type === EntityType.PROCESS);
    
    processNodes.forEach((processNode, index) => {
      if (clusteredNodes.has(processNode.id)) return;
      
      const functionalNodes = this.findFunctionallyRelatedNodes(processNode, nodes, edges);
      const clusterNodes = [processNode, ...functionalNodes].filter(n => !clusteredNodes.has(n.id));
      
      if (clusterNodes.length >= this.minClusterSize) {
        const cluster: PatentCluster = {
          id: `functional_${index}`,
          name: `${processNode.label} Process`,
          type: ClusterType.FUNCTIONAL,
          memberNodes: clusterNodes.map(n => n.id),
          centerNode: processNode.id,
          coherence: this.calculateClusterCoherence(clusterNodes, similarities),
          size: clusterNodes.length,
          description: `Functional cluster centered around ${processNode.label} processes`,
          keyProperties: this.extractKeyProperties(clusterNodes, ClusterType.FUNCTIONAL),
          representativeTerms: this.extractRepresentativeTerms(clusterNodes, ClusterType.FUNCTIONAL)
        };
        
        clusters.push(cluster);
        clusterNodes.forEach(node => clusteredNodes.add(node.id));
      }
    });
    
    return clusters;
  }

  /**
   * Create application clusters based on domain usage
   */
  private createApplicationClusters(
    nodes: GraphNode[], 
    edges: GraphEdge[], 
    similarities: NodeSimilarity[]
  ): PatentCluster[] {
    const clusters: PatentCluster[] = [];
    const clusteredNodes = new Set<string>();
    
    // Group nodes by application domains
    const applicationNodes = nodes.filter(n => n.type === EntityType.APPLICATION);
    
    applicationNodes.forEach((appNode, index) => {
      if (clusteredNodes.has(appNode.id)) return;
      
      const domainNodes = this.findApplicationRelatedNodes(appNode, nodes, edges);
      const clusterNodes = [appNode, ...domainNodes].filter(n => !clusteredNodes.has(n.id));
      
      if (clusterNodes.length >= this.minClusterSize) {
        const cluster: PatentCluster = {
          id: `application_${index}`,
          name: `${appNode.label} Domain`,
          type: ClusterType.APPLICATION,
          memberNodes: clusterNodes.map(n => n.id),
          centerNode: appNode.id,
          coherence: this.calculateClusterCoherence(clusterNodes, similarities),
          size: clusterNodes.length,
          description: `Application cluster for ${appNode.label} domain`,
          keyProperties: this.extractKeyProperties(clusterNodes, ClusterType.APPLICATION),
          representativeTerms: this.extractRepresentativeTerms(clusterNodes, ClusterType.APPLICATION)
        };
        
        clusters.push(cluster);
        clusterNodes.forEach(node => clusteredNodes.add(node.id));
      }
    });
    
    return clusters;
  }

  /**
   * Optimize clusters by merging similar ones and removing overlaps
   */
  private optimizeClusters(clusters: PatentCluster[]): PatentCluster[] {
    let optimized = [...clusters];
    
    // Remove clusters that are too small
    optimized = optimized.filter(cluster => cluster.size >= this.minClusterSize);
    
    // Limit to maximum number of clusters
    if (optimized.length > this.maxClusters) {
      optimized = optimized
        .sort((a, b) => b.coherence - a.coherence)
        .slice(0, this.maxClusters);
    }
    
    // Merge highly overlapping clusters
    optimized = this.mergeOverlappingClusters(optimized);
    
    return optimized;
  }

  /**
   * Merge clusters with high node overlap
   */
  private mergeOverlappingClusters(clusters: PatentCluster[]): PatentCluster[] {
    const merged: PatentCluster[] = [];
    const processed = new Set<string>();
    
    clusters.forEach(cluster => {
      if (processed.has(cluster.id)) return;
      
      const overlapping = clusters.filter(other => 
        other.id !== cluster.id && 
        !processed.has(other.id) &&
        this.calculateClusterOverlap(cluster, other) > 0.5
      );
      
      if (overlapping.length > 0) {
        // Merge clusters
        const mergedCluster: PatentCluster = {
          id: `merged_${cluster.id}`,
          name: `${cluster.name} & ${overlapping[0].name}`,
          type: cluster.type,
          memberNodes: [...new Set([...cluster.memberNodes, ...overlapping.flatMap(c => c.memberNodes)])],
          centerNode: cluster.centerNode,
          coherence: (cluster.coherence + overlapping.reduce((sum, c) => sum + c.coherence, 0)) / (overlapping.length + 1),
          size: 0, // Will be set below
          description: `Merged cluster combining ${cluster.name} and related clusters`,
          keyProperties: [...new Set([...cluster.keyProperties, ...overlapping.flatMap(c => c.keyProperties)])],
          representativeTerms: [...new Set([...cluster.representativeTerms, ...overlapping.flatMap(c => c.representativeTerms)])]
        };
        
        mergedCluster.size = mergedCluster.memberNodes.length;
        merged.push(mergedCluster);
        
        processed.add(cluster.id);
        overlapping.forEach(c => processed.add(c.id));
      } else {
        merged.push(cluster);
        processed.add(cluster.id);
      }
    });
    
    return merged;
  }

  /**
   * Helper methods for similarity calculations
   */
  private calculateStructuralSimilarity(
    node1: GraphNode, 
    node2: GraphNode, 
    adjacencyMap: Map<string, Set<string>>
  ): number {
    // Structural similarity based on shared neighbors and node types
    const neighbors1 = adjacencyMap.get(node1.id) || new Set();
    const neighbors2 = adjacencyMap.get(node2.id) || new Set();
    
    const sharedNeighbors = new Set([...neighbors1].filter(n => neighbors2.has(n)));
    const totalNeighbors = new Set([...neighbors1, ...neighbors2]);
    
    const neighborSimilarity = totalNeighbors.size > 0 ? sharedNeighbors.size / totalNeighbors.size : 0;
    const typeSimilarity = node1.type === node2.type ? 1.0 : 0.0;
    
    return (neighborSimilarity * 0.7) + (typeSimilarity * 0.3);
  }

  private calculateFunctionalSimilarity(node1: GraphNode, node2: GraphNode, edges: GraphEdge[]): number {
    // Functional similarity based on shared functional relationships
    const functionalEdges1 = edges.filter(e => 
      (e.sourceId === node1.id || e.targetId === node1.id) && 
      e.type === RelationshipType.FUNCTIONAL
    );
    const functionalEdges2 = edges.filter(e => 
      (e.sourceId === node2.id || e.targetId === node2.id) && 
      e.type === RelationshipType.FUNCTIONAL
    );
    
    const sharedFunctions = functionalEdges1.filter(e1 => 
      functionalEdges2.some(e2 => e1.label === e2.label)
    ).length;
    
    const totalFunctions = new Set([
      ...functionalEdges1.map(e => e.label),
      ...functionalEdges2.map(e => e.label)
    ]).size;
    
    return totalFunctions > 0 ? sharedFunctions / totalFunctions : 0;
  }

  private calculateApplicationSimilarity(node1: GraphNode, node2: GraphNode): number {
    // Application similarity based on node labels and aliases
    const terms1 = [node1.label, ...node1.aliases].map(t => t.toLowerCase());
    const terms2 = [node2.label, ...node2.aliases].map(t => t.toLowerCase());
    
    const sharedTerms = terms1.filter(t => terms2.includes(t)).length;
    const totalTerms = new Set([...terms1, ...terms2]).size;
    
    return totalTerms > 0 ? sharedTerms / totalTerms : 0;
  }

  private findStructurallyRelatedNodes(centerNode: GraphNode, nodes: GraphNode[], edges: GraphEdge[]): GraphNode[] {
    const relatedIds = new Set<string>();
    
    // Find nodes connected by structural relationships
    edges.forEach(edge => {
      if (edge.type === RelationshipType.STRUCTURAL) {
        if (edge.sourceId === centerNode.id) relatedIds.add(edge.targetId);
        if (edge.targetId === centerNode.id) relatedIds.add(edge.sourceId);
      }
    });
    
    return nodes.filter(node => relatedIds.has(node.id));
  }

  private findFunctionallyRelatedNodes(centerNode: GraphNode, nodes: GraphNode[], edges: GraphEdge[]): GraphNode[] {
    const relatedIds = new Set<string>();
    
    // Find nodes connected by functional relationships
    edges.forEach(edge => {
      if (edge.type === RelationshipType.FUNCTIONAL) {
        if (edge.sourceId === centerNode.id) relatedIds.add(edge.targetId);
        if (edge.targetId === centerNode.id) relatedIds.add(edge.sourceId);
      }
    });
    
    return nodes.filter(node => relatedIds.has(node.id));
  }

  private findApplicationRelatedNodes(centerNode: GraphNode, nodes: GraphNode[], edges: GraphEdge[]): GraphNode[] {
    const relatedIds = new Set<string>();
    
    // Find nodes connected by application relationships
    edges.forEach(edge => {
      if (edge.type === RelationshipType.APPLICATION) {
        if (edge.sourceId === centerNode.id) relatedIds.add(edge.targetId);
        if (edge.targetId === centerNode.id) relatedIds.add(edge.sourceId);
      }
    });
    
    return nodes.filter(node => relatedIds.has(node.id));
  }

  private calculateClusterCoherence(clusterNodes: GraphNode[], similarities: NodeSimilarity[]): number {
    if (clusterNodes.length < 2) return 1.0;
    
    const nodeIds = new Set(clusterNodes.map(n => n.id));
    const internalSimilarities = similarities.filter(sim => 
      nodeIds.has(sim.nodeId1) && nodeIds.has(sim.nodeId2)
    );
    
    if (internalSimilarities.length === 0) return 0.5;
    
    const avgSimilarity = internalSimilarities.reduce((sum, sim) => sum + sim.overallSimilarity, 0) / internalSimilarities.length;
    return avgSimilarity;
  }

  private calculateClusterOverlap(cluster1: PatentCluster, cluster2: PatentCluster): number {
    const nodes1 = new Set(cluster1.memberNodes);
    const nodes2 = new Set(cluster2.memberNodes);
    
    const intersection = new Set([...nodes1].filter(n => nodes2.has(n)));
    const union = new Set([...nodes1, ...nodes2]);
    
    return intersection.size / union.size;
  }

  private extractKeyProperties(nodes: GraphNode[], clusterType: ClusterType): string[] {
    const properties = new Set<string>();
    
    nodes.forEach(node => {
      // Extract key properties based on cluster type
      switch (clusterType) {
        case ClusterType.STRUCTURAL:
          if (node.type === EntityType.COMPONENT || node.type === EntityType.SYSTEM) {
            properties.add(`${node.type.toLowerCase()}_based`);
          }
          break;
        case ClusterType.FUNCTIONAL:
          if (node.type === EntityType.PROCESS) {
            properties.add(`${node.label}_processing`);
          }
          break;
        case ClusterType.APPLICATION:
          if (node.type === EntityType.APPLICATION) {
            properties.add(`${node.label}_domain`);
          }
          break;
      }
      
      // Add node-specific properties
      if (node.metadata?.hierarchicalParent) {
        properties.add(node.metadata.hierarchicalParent);
      }
    });
    
    return Array.from(properties).slice(0, 5); // Limit to top 5 properties
  }

  private extractRepresentativeTerms(nodes: GraphNode[], clusterType: ClusterType): string[] {
    const termFreq = new Map<string, number>();
    
    nodes.forEach(node => {
      const terms = [node.label, ...node.aliases];
      terms.forEach(term => {
        termFreq.set(term, (termFreq.get(term) || 0) + 1);
      });
    });
    
    return Array.from(termFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([term]) => term)
      .slice(0, 5); // Top 5 most frequent terms
  }

  private assessClusterQuality(clusters: PatentCluster[], nodes: GraphNode[], edges: GraphEdge[]): ClusterQuality[] {
    return clusters.map(cluster => ({
      clusterId: cluster.id,
      coherence: cluster.coherence,
      separation: this.calculateClusterSeparation(cluster, clusters),
      size: cluster.size,
      diversity: this.calculateClusterDiversity(cluster, nodes),
      representativeness: this.calculateRepresentativeness(cluster, nodes)
    }));
  }

  private calculateClusterSeparation(cluster: PatentCluster, allClusters: PatentCluster[]): number {
    const otherClusters = allClusters.filter(c => c.id !== cluster.id);
    if (otherClusters.length === 0) return 1.0;
    
    const overlaps = otherClusters.map(other => this.calculateClusterOverlap(cluster, other));
    const avgOverlap = overlaps.reduce((sum, overlap) => sum + overlap, 0) / overlaps.length;
    
    return 1.0 - avgOverlap; // Higher separation = lower overlap
  }

  private calculateClusterDiversity(cluster: PatentCluster, nodes: GraphNode[]): number {
    const clusterNodes = nodes.filter(n => cluster.memberNodes.includes(n.id));
    const nodeTypes = new Set(clusterNodes.map(n => n.type));
    
    return nodeTypes.size / Object.keys(EntityType).length; // Normalized diversity
  }

  private calculateRepresentativeness(cluster: PatentCluster, nodes: GraphNode[]): number {
    const clusterNodes = nodes.filter(n => cluster.memberNodes.includes(n.id));
    const totalWeight = clusterNodes.reduce((sum, n) => sum + n.weight, 0);
    const avgWeight = totalWeight / clusterNodes.length;
    
    return Math.min(avgWeight / 5, 1.0); // Normalized to max weight of 5
  }

  private calculateClusteringMetrics(
    clusters: PatentCluster[], 
    nodes: GraphNode[], 
    qualities: ClusterQuality[]
  ): ClusteringMetrics {
    const avgCoherence = clusters.reduce((sum, c) => sum + c.coherence, 0) / clusters.length;
    const avgSeparation = qualities.reduce((sum, q) => sum + q.separation, 0) / qualities.length;
    const clusterCoverage = this.calculateClusterCoverage(clusters, nodes);
    
    return {
      silhouetteScore: (avgCoherence + avgSeparation) / 2, // Simplified silhouette
      intraClusterSimilarity: avgCoherence,
      interClusterSeparation: avgSeparation,
      clusterCoherence: avgCoherence,
      coverageScore: clusterCoverage
    };
  }

  private calculateClusterCoverage(clusters: PatentCluster[], nodes: GraphNode[]): number {
    const clusteredNodes = new Set(clusters.flatMap(c => c.memberNodes));
    return clusteredNodes.size / nodes.length;
  }

  private generateClusterAssignments(patentId: string, clusters: PatentCluster[]): Record<string, string[]> {
    // For single patent, assign to all relevant clusters
    return {
      [patentId]: clusters.map(c => c.id)
    };
  }

  private generateTechnologyLandscape(clusters: PatentCluster[], nodes: GraphNode[]): any {
    return {
      dominantClusters: clusters
        .sort((a, b) => b.size - a.size)
        .slice(0, 3)
        .map(c => ({
          id: c.id,
          name: c.name,
          type: c.type,
          size: c.size,
          coherence: c.coherence
        })),
      technologyDomains: clusters.reduce((domains, cluster) => {
        domains[cluster.type] = (domains[cluster.type] || 0) + 1;
        return domains;
      }, {} as Record<string, number>),
      emergingPatterns: this.identifyEmergingPatterns(clusters, nodes)
    };
  }

  private identifyEmergingPatterns(clusters: PatentCluster[], nodes: GraphNode[]): string[] {
    // Identify interesting patterns in clustering
    const patterns: string[] = [];
    
    // High coherence clusters
    const highCoherenceClusters = clusters.filter(c => c.coherence > 0.8);
    if (highCoherenceClusters.length > 0) {
      patterns.push(`${highCoherenceClusters.length} highly coherent technology cluster(s)`);
    }
    
    // Large clusters
    const largeClusters = clusters.filter(c => c.size > nodes.length * 0.2);
    if (largeClusters.length > 0) {
      patterns.push(`${largeClusters.length} dominant technology area(s)`);
    }
    
    // Diverse clusters
    const diverseClusters = clusters.filter(c => c.keyProperties.length > 3);
    if (diverseClusters.length > 0) {
      patterns.push(`${diverseClusters.length} multi-faceted technology cluster(s)`);
    }
    
    return patterns;
  }

  private calculateConfidence(result: ClusteringResult): number {
    const metricsScore = (result.clusteringMetrics.silhouetteScore + 
                         result.clusteringMetrics.coverageScore) / 2;
    const qualityScore = result.clusterQualities.reduce((sum, q) => 
      sum + (q.coherence * 0.4 + q.separation * 0.3 + q.representativeness * 0.3), 0) / result.clusterQualities.length;
    
    return (metricsScore * 0.6) + (qualityScore * 0.4);
  }
}

/**
 * Factory function to create clustering agent instance
 */
export function createClusteringAgent(): ClusteringAgent {
  return new ClusteringAgent();
}