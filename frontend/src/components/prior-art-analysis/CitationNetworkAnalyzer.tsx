/**
 * Citation Network Analyzer Component
 * Visualizes and analyzes citation networks for prior art patents
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Network,
  Share2,
  GitBranch,
  Target,
  TrendingUp,
  Clock,
  Users,
  Building,
  FileText,
  Eye,
  Filter,
  Download,
  Settings,
  RefreshCw,
  Maximize2,
  Minimize2
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface PatentNode {
  id: string;
  title: string;
  publicationNumber: string;
  publicationDate: string;
  applicant: string;
  jurisdiction: string;
  type: 'target' | 'prior_art' | 'cited_by' | 'family_member';
  
  // Network properties
  citationCount: number;
  citedByCount: number;
  familySize: number;
  priority: number; // 0-100
  relevanceScore: number; // 0-100
  
  // Visual properties
  x?: number;
  y?: number;
  size: number;
  color: string;
  cluster?: number;
}

interface CitationEdge {
  id: string;
  source: string; // patent ID that cites
  target: string; // patent ID that is cited
  type: 'forward' | 'backward' | 'family' | 'continuation';
  weight: number; // 0-100, strength of citation relationship
  date: string;
  
  // Visual properties
  color: string;
  width: number;
  opacity: number;
}

interface CitationCluster {
  id: string;
  name: string;
  nodes: string[]; // patent IDs in cluster
  centroid: PatentNode;
  strength: number; // 0-100
  technicalArea: string;
  size: number;
  color: string;
}

interface NetworkMetrics {
  totalNodes: number;
  totalEdges: number;
  averageDegree: number;
  clustering: number;
  density: number;
  strongestClusters: CitationCluster[];
  keyBridgePatents: PatentNode[];
  citationChains: PatentNode[][];
}

interface CitationAnalysis {
  networks: {
    backward: { nodes: PatentNode[]; edges: CitationEdge[]; };
    forward: { nodes: PatentNode[]; edges: CitationEdge[]; };
    combined: { nodes: PatentNode[]; edges: CitationEdge[]; };
  };
  clusters: CitationCluster[];
  metrics: NetworkMetrics;
  timeline: {
    year: number;
    publications: number;
    citations: number;
    cumulativeCitations: number;
  }[];
  keyPatents: {
    mostCited: PatentNode[];
    mostCiting: PatentNode[];
    bridgePatents: PatentNode[];
    recentInfluential: PatentNode[];
  };
}

interface CitationNetworkAnalyzerProps {
  projectId: string;
  evidence?: any[];
  onNetworkUpdate?: (network: CitationAnalysis) => void;
}

export function CitationNetworkAnalyzer({ 
  projectId, 
  evidence = [], 
  onNetworkUpdate 
}: CitationNetworkAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('network');
  const [networkData, setNetworkData] = useState<CitationAnalysis | null>(null);
  const [selectedNode, setSelectedNode] = useState<PatentNode | null>(null);
  const [networkType, setNetworkType] = useState<'backward' | 'forward' | 'combined'>('combined');
  const [clusteringMethod, setClusteringMethod] = useState<'kmeans' | 'hierarchical' | 'community'>('kmeans');
  const [clusterCount, setClusterCount] = useState<number>(3);
  const [showClusters, setShowClusters] = useState<boolean>(true);
  const [nodeSize, setNodeSize] = useState<number>(1);
  const [edgeWidth, setEdgeWidth] = useState<number>(1);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [filterThreshold, setFilterThreshold] = useState<number>(0);

  useEffect(() => {
    initializeComponent();
  }, []);

  const initializeComponent = () => {
    console.log('Citation Network Analyzer initialized for project:', projectId);
    initializeMockData();
  };

  const initializeMockData = () => {
    // Mock patent nodes
    const mockNodes: PatentNode[] = [
      {
        id: 'target-1',
        title: 'Neural Network Architecture for Real-Time Processing',
        publicationNumber: 'US10,987,654',
        publicationDate: '2023-04-20',
        applicant: 'TechCorp Inc.',
        jurisdiction: 'US',
        type: 'target',
        citationCount: 12,
        citedByCount: 3,
        familySize: 4,
        priority: 100,
        relevanceScore: 95,
        size: 20,
        color: '#ef4444',
        cluster: 0
      },
      {
        id: 'prior-1',
        title: 'Machine Learning System with Adaptive Preprocessing',
        publicationNumber: 'US10,123,456',
        publicationDate: '2019-03-15',
        applicant: 'AI Systems Ltd.',
        jurisdiction: 'US',
        type: 'prior_art',
        citationCount: 45,
        citedByCount: 18,
        familySize: 8,
        priority: 85,
        relevanceScore: 88,
        size: 18,
        color: '#3b82f6',
        cluster: 0
      },
      {
        id: 'prior-2',
        title: 'Deep Learning Optimization Methods',
        publicationNumber: 'EP3456789',
        publicationDate: '2018-11-22',
        applicant: 'European AI Ltd.',
        jurisdiction: 'EP',
        type: 'prior_art',
        citationCount: 28,
        citedByCount: 12,
        familySize: 5,
        priority: 70,
        relevanceScore: 75,
        size: 15,
        color: '#3b82f6',
        cluster: 1
      },
      {
        id: 'cited-1',
        title: 'Advanced Neural Processing Techniques',
        publicationNumber: 'US11,234,567',
        publicationDate: '2024-01-10',
        applicant: 'Future Tech Corp.',
        jurisdiction: 'US',
        type: 'cited_by',
        citationCount: 3,
        citedByCount: 0,
        familySize: 2,
        priority: 60,
        relevanceScore: 65,
        size: 12,
        color: '#10b981',
        cluster: 0
      },
      {
        id: 'family-1',
        title: 'Neural Network Architecture - Continuation',
        publicationNumber: 'US10,987,655',
        publicationDate: '2023-06-15',
        applicant: 'TechCorp Inc.',
        jurisdiction: 'US',
        type: 'family_member',
        citationCount: 5,
        citedByCount: 1,
        familySize: 4,
        priority: 80,
        relevanceScore: 90,
        size: 14,
        color: '#f59e0b',
        cluster: 0
      }
    ];

    // Mock citation edges
    const mockEdges: CitationEdge[] = [
      {
        id: 'edge-1',
        source: 'target-1',
        target: 'prior-1',
        type: 'backward',
        weight: 85,
        date: '2019-03-15',
        color: '#6b7280',
        width: 3,
        opacity: 0.8
      },
      {
        id: 'edge-2',
        source: 'target-1',
        target: 'prior-2',
        type: 'backward',
        weight: 70,
        date: '2018-11-22',
        color: '#6b7280',
        width: 2,
        opacity: 0.6
      },
      {
        id: 'edge-3',
        source: 'cited-1',
        target: 'target-1',
        type: 'forward',
        weight: 90,
        date: '2024-01-10',
        color: '#10b981',
        width: 3,
        opacity: 0.8
      },
      {
        id: 'edge-4',
        source: 'target-1',
        target: 'family-1',
        type: 'family',
        weight: 95,
        date: '2023-06-15',
        color: '#f59e0b',
        width: 4,
        opacity: 0.9
      }
    ];

    // Mock clusters
    const mockClusters: CitationCluster[] = [
      {
        id: 'cluster-1',
        name: 'Neural Network Processing',
        nodes: ['target-1', 'prior-1', 'cited-1', 'family-1'],
        centroid: mockNodes[0],
        strength: 85,
        technicalArea: 'Machine Learning',
        size: 4,
        color: '#3b82f6'
      },
      {
        id: 'cluster-2',
        name: 'Deep Learning Optimization',
        nodes: ['prior-2'],
        centroid: mockNodes[2],
        strength: 70,
        technicalArea: 'AI Optimization',
        size: 1,
        color: '#ef4444'
      }
    ];

    // Mock network analysis
    const mockAnalysis: CitationAnalysis = {
      networks: {
        backward: { nodes: mockNodes, edges: mockEdges.filter(e => e.type === 'backward') },
        forward: { nodes: mockNodes, edges: mockEdges.filter(e => e.type === 'forward') },
        combined: { nodes: mockNodes, edges: mockEdges }
      },
      clusters: mockClusters,
      metrics: {
        totalNodes: mockNodes.length,
        totalEdges: mockEdges.length,
        averageDegree: 1.6,
        clustering: 0.4,
        density: 0.3,
        strongestClusters: mockClusters,
        keyBridgePatents: [mockNodes[0]],
        citationChains: [[mockNodes[1], mockNodes[0], mockNodes[3]]]
      },
      timeline: [
        { year: 2018, publications: 1, citations: 0, cumulativeCitations: 0 },
        { year: 2019, publications: 1, citations: 1, cumulativeCitations: 1 },
        { year: 2023, publications: 2, citations: 3, cumulativeCitations: 4 },
        { year: 2024, publications: 1, citations: 1, cumulativeCitations: 5 }
      ],
      keyPatents: {
        mostCited: [mockNodes[1]],
        mostCiting: [mockNodes[0]],
        bridgePatents: [mockNodes[0]],
        recentInfluential: [mockNodes[3]]
      }
    };

    setNetworkData(mockAnalysis);
    setSelectedNode(mockNodes[0]);
  };

  // Citation strength scoring algorithms
  const calculateCitationStrength = (sourceNode: PatentNode, targetNode: PatentNode, edge: CitationEdge): number => {
    let strength = 0;
    
    // Factor 1: Temporal relevance (0-25 points)
    const sourceDate = new Date(sourceNode.publicationDate);
    const targetDate = new Date(targetNode.publicationDate);
    const yearsDiff = Math.abs(sourceDate.getFullYear() - targetDate.getFullYear());
    const temporalScore = Math.max(0, 25 - (yearsDiff * 2)); // Decrease 2 points per year
    strength += temporalScore;
    
    // Factor 2: Citation frequency (0-25 points)
    const citationFrequencyScore = Math.min(25, (targetNode.citedByCount / 10) * 25);
    strength += citationFrequencyScore;
    
    // Factor 3: Technical relevance (0-30 points)
    const technicalScore = (sourceNode.relevanceScore + targetNode.relevanceScore) / 2 * 0.3;
    strength += technicalScore;
    
    // Factor 4: Family and cluster relationship (0-20 points)
    const familyScore = sourceNode.cluster === targetNode.cluster ? 20 : 0;
    strength += familyScore;
    
    return Math.min(100, Math.round(strength));
  };

  const calculateNodeInfluence = (node: PatentNode, allNodes: PatentNode[], edges: CitationEdge[]): number => {
    // PageRank-like algorithm for patent influence
    let influence = 0;
    
    // Base influence from citation metrics
    const citationInfluence = Math.min(40, (node.citationCount * 2));
    const citedByInfluence = Math.min(40, (node.citedByCount * 3));
    influence += citationInfluence + citedByInfluence;
    
    // Network centrality influence
    const nodeEdges = edges.filter(e => e.source === node.id || e.target === node.id);
    const centralityScore = Math.min(20, (nodeEdges.length * 4));
    influence += centralityScore;
    
    return Math.min(100, Math.round(influence));
  };

  const identifyBridgePatents = (nodes: PatentNode[], edges: CitationEdge[]): PatentNode[] => {
    // Find patents that bridge different clusters or time periods
    const bridgePatents: PatentNode[] = [];
    
    nodes.forEach(node => {
      const connectedEdges = edges.filter(e => e.source === node.id || e.target === node.id);
      const connectedNodes = connectedEdges.map(edge => {
        const otherId = edge.source === node.id ? edge.target : edge.source;
        return nodes.find(n => n.id === otherId);
      }).filter(Boolean) as PatentNode[];
      
      // Check if node connects different clusters
      const clusters = new Set(connectedNodes.map(n => n.cluster));
      const years = new Set(connectedNodes.map(n => new Date(n.publicationDate).getFullYear()));
      
      if (clusters.size > 1 || years.size > 2) {
        bridgePatents.push({
          ...node,
          priority: calculateNodeInfluence(node, nodes, edges)
        });
      }
    });
    
    return bridgePatents.sort((a, b) => b.priority - a.priority).slice(0, 3);
  };

  const calculateNetworkMetrics = (nodes: PatentNode[], edges: CitationEdge[]): NetworkMetrics => {
    const totalNodes = nodes.length;
    const totalEdges = edges.length;
    
    // Calculate average degree
    const degrees = nodes.map(node => 
      edges.filter(e => e.source === node.id || e.target === node.id).length
    );
    const averageDegree = degrees.reduce((sum, d) => sum + d, 0) / totalNodes;
    
    // Calculate clustering coefficient
    let totalClustering = 0;
    nodes.forEach(node => {
      const neighbors = edges
        .filter(e => e.source === node.id || e.target === node.id)
        .map(e => e.source === node.id ? e.target : e.source);
      
      if (neighbors.length < 2) return;
      
      let edgesBetweenNeighbors = 0;
      for (let i = 0; i < neighbors.length; i++) {
        for (let j = i + 1; j < neighbors.length; j++) {
          if (edges.some(e => 
            (e.source === neighbors[i] && e.target === neighbors[j]) ||
            (e.source === neighbors[j] && e.target === neighbors[i])
          )) {
            edgesBetweenNeighbors++;
          }
        }
      }
      
      const possibleEdges = (neighbors.length * (neighbors.length - 1)) / 2;
      totalClustering += edgesBetweenNeighbors / possibleEdges;
    });
    
    const clustering = totalClustering / totalNodes;
    
    // Calculate network density
    const maxPossibleEdges = (totalNodes * (totalNodes - 1)) / 2;
    const density = totalEdges / maxPossibleEdges;
    
    // Get clusters and bridge patents
    const clusters = [...new Set(nodes.map(n => n.cluster))].map(clusterId => {
      const clusterNodes = nodes.filter(n => n.cluster === clusterId);
      return {
        id: `cluster-${clusterId}`,
        name: `Cluster ${clusterId}`,
        nodes: clusterNodes.map(n => n.id),
        centroid: clusterNodes[0],
        strength: Math.round(clusterNodes.reduce((sum, n) => sum + n.relevanceScore, 0) / clusterNodes.length),
        technicalArea: 'Technical Area',
        size: clusterNodes.length,
        color: clusterNodes[0].color
      };
    });
    
    const bridgePatents = identifyBridgePatents(nodes, edges);
    
    // Build citation chains (simplified)
    const chains: PatentNode[][] = [];
    const visited = new Set<string>();
    
    nodes.forEach(startNode => {
      if (visited.has(startNode.id)) return;
      
      const chain: PatentNode[] = [startNode];
      visited.add(startNode.id);
      
      // Follow forward citations
      let currentNode = startNode;
      while (true) {
        const nextEdge = edges.find(e => e.source === currentNode.id && !visited.has(e.target));
        if (!nextEdge) break;
        
        const nextNode = nodes.find(n => n.id === nextEdge.target);
        if (!nextNode) break;
        
        chain.push(nextNode);
        visited.add(nextNode.id);
        currentNode = nextNode;
      }
      
      if (chain.length > 1) {
        chains.push(chain);
      }
    });
    
    return {
      totalNodes,
      totalEdges,
      averageDegree,
      clustering,
      density,
      strongestClusters: clusters.sort((a, b) => b.strength - a.strength),
      keyBridgePatents: bridgePatents,
      citationChains: chains.sort((a, b) => b.length - a.length).slice(0, 5)
    };
  };

  const runCitationAnalysis = async () => {
    if (!networkData) return;
    
    setIsAnalyzing(true);
    
    // Simulate analysis time
    setTimeout(() => {
      const nodes = networkData.networks.combined.nodes;
      const edges = networkData.networks.combined.edges;
      
      // Recalculate edge weights based on strength scoring
      const updatedEdges = edges.map(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        
        if (sourceNode && targetNode) {
          const strength = calculateCitationStrength(sourceNode, targetNode, edge);
          return {
            ...edge,
            weight: strength,
            width: Math.max(1, Math.min(5, strength / 20)),
            opacity: Math.max(0.3, strength / 100)
          };
        }
        return edge;
      });
      
      // Update node priorities based on influence
      const updatedNodes = nodes.map(node => ({
        ...node,
        priority: calculateNodeInfluence(node, nodes, edges)
      }));
      
      // Recalculate network metrics
      const updatedMetrics = calculateNetworkMetrics(updatedNodes, updatedEdges);
      
      const updatedAnalysis: CitationAnalysis = {
        ...networkData,
        networks: {
          ...networkData.networks,
          combined: { nodes: updatedNodes, edges: updatedEdges }
        },
        metrics: updatedMetrics
      };
      
      setNetworkData(updatedAnalysis);
      setIsAnalyzing(false);
      
      if (onNetworkUpdate) {
        onNetworkUpdate(updatedAnalysis);
      }
    }, 2000);
  };

  // Advanced clustering algorithms
  const performKMeansClustering = (nodes: PatentNode[], k: number = 3): CitationCluster[] => {
    // Extract features for clustering
    const features = nodes.map(node => [
      node.citationCount,
      node.citedByCount,
      node.familySize,
      node.relevanceScore,
      new Date(node.publicationDate).getFullYear(),
      node.priority
    ]);

    // Normalize features
    const normalizedFeatures = normalizeFeatures(features);
    
    // Initialize centroids randomly
    let centroids = initializeKMeansCentroids(normalizedFeatures, k);
    let clusters: number[] = new Array(nodes.length).fill(0);
    let converged = false;
    let iterations = 0;
    const maxIterations = 100;

    while (!converged && iterations < maxIterations) {
      const newClusters = assignToClusters(normalizedFeatures, centroids);
      converged = arraysEqual(clusters, newClusters);
      clusters = newClusters;
      centroids = updateCentroids(normalizedFeatures, clusters, k);
      iterations++;
    }

    // Create cluster objects
    return createClusterObjects(nodes, clusters, k);
  };

  const performHierarchicalClustering = (nodes: PatentNode[]): CitationCluster[] => {
    // Calculate similarity matrix
    const similarityMatrix = calculateSimilarityMatrix(nodes);
    
    // Perform agglomerative clustering
    let clusters = nodes.map((node, index) => ({
      id: `hier-${index}`,
      nodes: [node.id],
      centroid: node,
      similarity: 1.0
    }));

    while (clusters.length > 2) {
      const { i, j, similarity } = findMostSimilarClusters(clusters, similarityMatrix, nodes);
      
      if (similarity < 0.3) break; // Stop if similarity is too low
      
      // Merge clusters
      const newCluster = mergeClusters(clusters[i], clusters[j], nodes, `merged-${clusters.length}`);
      clusters = clusters.filter((_, index) => index !== i && index !== j);
      clusters.push(newCluster);
    }

    return clusters.map((cluster, index) => ({
      ...cluster,
      name: `Hierarchical Cluster ${index + 1}`,
      strength: Math.round(cluster.similarity * 100),
      technicalArea: inferTechnicalArea(cluster.nodes, nodes),
      size: cluster.nodes.length,
      color: generateClusterColor(index)
    }));
  };

  const performCommunityDetection = (nodes: PatentNode[], edges: CitationEdge[]): CitationCluster[] => {
    // Louvain-like community detection algorithm
    const communities = new Map<string, Set<string>>();
    const nodeToComm = new Map<string, string>();

    // Initialize each node as its own community
    nodes.forEach(node => {
      const commId = `comm-${node.id}`;
      communities.set(commId, new Set([node.id]));
      nodeToComm.set(node.id, commId);
    });

    let improved = true;
    let iteration = 0;
    const maxIterations = 50;

    while (improved && iteration < maxIterations) {
      improved = false;
      
      for (const node of nodes) {
        const currentComm = nodeToComm.get(node.id)!;
        const neighborComms = getNeighborCommunities(node.id, edges, nodeToComm);
        
        let bestComm = currentComm;
        let bestModularity = calculateModularity(communities, edges);
        
        // Try moving to each neighbor community
        for (const neighborComm of neighborComms) {
          if (neighborComm === currentComm) continue;
          
          // Temporarily move node
          moveNodeToCommunity(node.id, currentComm, neighborComm, communities, nodeToComm);
          const newModularity = calculateModularity(communities, edges);
          
          if (newModularity > bestModularity) {
            bestModularity = newModularity;
            bestComm = neighborComm;
          } else {
            // Move back if no improvement
            moveNodeToCommunity(node.id, neighborComm, currentComm, communities, nodeToComm);
          }
        }
        
        if (bestComm !== currentComm) {
          improved = true;
        }
      }
      iteration++;
    }

    // Convert communities to clusters
    return Array.from(communities.entries())
      .filter(([_, nodeSet]) => nodeSet.size > 0)
      .map(([commId, nodeSet], index) => {
        const clusterNodes = Array.from(nodeSet).map(nodeId => nodes.find(n => n.id === nodeId)!);
        const centroid = findCentroidNode(clusterNodes);
        
        return {
          id: commId,
          name: `Community ${index + 1}`,
          nodes: Array.from(nodeSet),
          centroid,
          strength: calculateCommunityStrength(clusterNodes, edges),
          technicalArea: inferTechnicalArea(Array.from(nodeSet), nodes),
          size: nodeSet.size,
          color: generateClusterColor(index)
        };
      });
  };

  // Helper functions for clustering
  const normalizeFeatures = (features: number[][]): number[][] => {
    const numFeatures = features[0].length;
    const mins = new Array(numFeatures).fill(Infinity);
    const maxs = new Array(numFeatures).fill(-Infinity);
    
    // Find min/max for each feature
    features.forEach(row => {
      row.forEach((value, i) => {
        mins[i] = Math.min(mins[i], value);
        maxs[i] = Math.max(maxs[i], value);
      });
    });
    
    // Normalize to [0, 1]
    return features.map(row => 
      row.map((value, i) => {
        const range = maxs[i] - mins[i];
        return range === 0 ? 0 : (value - mins[i]) / range;
      })
    );
  };

  const initializeKMeansCentroids = (features: number[][], k: number): number[][] => {
    const centroids: number[][] = [];
    const numFeatures = features[0].length;
    
    for (let i = 0; i < k; i++) {
      const centroid = new Array(numFeatures);
      for (let j = 0; j < numFeatures; j++) {
        centroid[j] = Math.random();
      }
      centroids.push(centroid);
    }
    
    return centroids;
  };

  const assignToClusters = (features: number[][], centroids: number[][]): number[] => {
    return features.map(point => {
      let minDistance = Infinity;
      let closestCluster = 0;
      
      centroids.forEach((centroid, clusterIndex) => {
        const distance = euclideanDistance(point, centroid);
        if (distance < minDistance) {
          minDistance = distance;
          closestCluster = clusterIndex;
        }
      });
      
      return closestCluster;
    });
  };

  const updateCentroids = (features: number[][], clusters: number[], k: number): number[][] => {
    const centroids: number[][] = [];
    const numFeatures = features[0].length;
    
    for (let i = 0; i < k; i++) {
      const clusterPoints = features.filter((_, index) => clusters[index] === i);
      
      if (clusterPoints.length === 0) {
        // If no points in cluster, keep previous centroid or create random
        centroids.push(new Array(numFeatures).fill(0).map(() => Math.random()));
        continue;
      }
      
      const centroid = new Array(numFeatures).fill(0);
      clusterPoints.forEach(point => {
        point.forEach((value, j) => {
          centroid[j] += value;
        });
      });
      
      centroid.forEach((_, j) => {
        centroid[j] /= clusterPoints.length;
      });
      
      centroids.push(centroid);
    }
    
    return centroids;
  };

  const createClusterObjects = (nodes: PatentNode[], clusters: number[], k: number): CitationCluster[] => {
    return Array.from({ length: k }, (_, clusterIndex) => {
      const clusterNodes = nodes.filter((_, nodeIndex) => clusters[nodeIndex] === clusterIndex);
      
      if (clusterNodes.length === 0) {
        return {
          id: `kmeans-${clusterIndex}`,
          name: `Empty Cluster ${clusterIndex + 1}`,
          nodes: [],
          centroid: nodes[0], // Fallback
          strength: 0,
          technicalArea: 'Unknown',
          size: 0,
          color: generateClusterColor(clusterIndex)
        };
      }
      
      const centroid = findCentroidNode(clusterNodes);
      
      return {
        id: `kmeans-${clusterIndex}`,
        name: `K-Means Cluster ${clusterIndex + 1}`,
        nodes: clusterNodes.map(n => n.id),
        centroid,
        strength: Math.round(clusterNodes.reduce((sum, n) => sum + n.relevanceScore, 0) / clusterNodes.length),
        technicalArea: inferTechnicalArea(clusterNodes.map(n => n.id), nodes),
        size: clusterNodes.length,
        color: generateClusterColor(clusterIndex)
      };
    }).filter(cluster => cluster.size > 0);
  };

  const euclideanDistance = (point1: number[], point2: number[]): number => {
    return Math.sqrt(
      point1.reduce((sum, value, index) => 
        sum + Math.pow(value - point2[index], 2), 0
      )
    );
  };

  const arraysEqual = (a: number[], b: number[]): boolean => {
    return a.length === b.length && a.every((val, i) => val === b[i]);
  };

  const calculateSimilarityMatrix = (nodes: PatentNode[]): number[][] => {
    return nodes.map(node1 => 
      nodes.map(node2 => {
        if (node1.id === node2.id) return 1.0;
        
        // Calculate similarity based on multiple factors
        const yearSim = 1 - Math.abs(
          new Date(node1.publicationDate).getFullYear() - 
          new Date(node2.publicationDate).getFullYear()
        ) / 10; // Normalize by decade
        
        const relevanceSim = 1 - Math.abs(node1.relevanceScore - node2.relevanceScore) / 100;
        const citationSim = 1 - Math.abs(node1.citationCount - node2.citationCount) / Math.max(node1.citationCount, node2.citationCount, 1);
        const familySim = node1.applicant === node2.applicant ? 0.3 : 0;
        
        return Math.max(0, (yearSim + relevanceSim + citationSim + familySim) / 3.3);
      })
    );
  };

  const findCentroidNode = (clusterNodes: PatentNode[]): PatentNode => {
    // Find the node closest to the cluster center
    const avgRelevance = clusterNodes.reduce((sum, n) => sum + n.relevanceScore, 0) / clusterNodes.length;
    const avgCitations = clusterNodes.reduce((sum, n) => sum + n.citationCount, 0) / clusterNodes.length;
    
    let closestNode = clusterNodes[0];
    let minDistance = Infinity;
    
    clusterNodes.forEach(node => {
      const distance = Math.abs(node.relevanceScore - avgRelevance) + Math.abs(node.citationCount - avgCitations);
      if (distance < minDistance) {
        minDistance = distance;
        closestNode = node;
      }
    });
    
    return closestNode;
  };

  const inferTechnicalArea = (nodeIds: string[], allNodes: PatentNode[]): string => {
    const clusterNodes = nodeIds.map(id => allNodes.find(n => n.id === id)).filter(Boolean) as PatentNode[];
    
    // Simple heuristic based on titles and applicants
    const titleWords = clusterNodes.flatMap(n => n.title.toLowerCase().split(' '));
    const wordCounts = titleWords.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topWords = Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([word]) => word);
    
    if (topWords.includes('neural') || topWords.includes('learning')) return 'Machine Learning';
    if (topWords.includes('network') || topWords.includes('processing')) return 'Network Processing';
    if (topWords.includes('optimization') || topWords.includes('algorithm')) return 'Algorithm Optimization';
    
    return 'General Technology';
  };

  const generateClusterColor = (index: number): string => {
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
    return colors[index % colors.length];
  };

  // Helper function to find the two most similar clusters
  const findMostSimilarClusters = (
    clusters: { id: string; nodes: string[]; centroid: PatentNode; similarity: number }[],
    similarityMatrix: number[][],
    nodes: PatentNode[]
  ): { i: number; j: number; similarity: number } => {
    let maxSimilarity = -Infinity;
    let bestI = 0;
    let bestJ = 1;

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        // Calculate average similarity between all nodes in the two clusters
        let totalSim = 0;
        let count = 0;
        for (const nodeIdA of clusters[i].nodes) {
          for (const nodeIdB of clusters[j].nodes) {
            const idxA = nodes.findIndex(n => n.id === nodeIdA);
            const idxB = nodes.findIndex(n => n.id === nodeIdB);
            if (idxA >= 0 && idxB >= 0) {
              totalSim += similarityMatrix[idxA][idxB];
              count++;
            }
          }
        }
        const avgSim = count > 0 ? totalSim / count : 0;
        if (avgSim > maxSimilarity) {
          maxSimilarity = avgSim;
          bestI = i;
          bestJ = j;
        }
      }
    }

    return { i: bestI, j: bestJ, similarity: maxSimilarity };
  };

  // Helper function to merge two clusters
  const mergeClusters = (
    cluster1: { id: string; nodes: string[]; centroid: PatentNode; similarity: number },
    cluster2: { id: string; nodes: string[]; centroid: PatentNode; similarity: number },
    nodes: PatentNode[],
    newId: string
  ): { id: string; nodes: string[]; centroid: PatentNode; similarity: number } => {
    const mergedNodes = [...cluster1.nodes, ...cluster2.nodes];
    const clusterNodesData = mergedNodes.map(id => nodes.find(n => n.id === id)).filter(Boolean) as PatentNode[];
    const centroid = findCentroidNode(clusterNodesData);
    return {
      id: newId,
      nodes: mergedNodes,
      centroid,
      similarity: (cluster1.similarity + cluster2.similarity) / 2
    };
  };

  // Helper function to get neighbor communities for a node
  const getNeighborCommunities = (
    nodeId: string,
    edges: CitationEdge[],
    nodeToComm: Map<string, string>
  ): Set<string> => {
    const neighbors = new Set<string>();
    for (const edge of edges) {
      if (edge.source === nodeId) {
        const comm = nodeToComm.get(edge.target);
        if (comm) neighbors.add(comm);
      }
      if (edge.target === nodeId) {
        const comm = nodeToComm.get(edge.source);
        if (comm) neighbors.add(comm);
      }
    }
    return neighbors;
  };

  // Helper function to calculate modularity
  const calculateModularity = (
    communities: Map<string, Set<string>>,
    edges: CitationEdge[]
  ): number => {
    const m = edges.length; // Total edges
    if (m === 0) return 0;

    let modularity = 0;
    const nodeToComm = new Map<string, string>();
    communities.forEach((nodes, commId) => {
      nodes.forEach(nodeId => nodeToComm.set(nodeId, commId));
    });

    for (const [commId, nodeSet] of communities) {
      let internalEdges = 0;
      let totalDegree = 0;

      for (const nodeId of nodeSet) {
        const degree = edges.filter(e => e.source === nodeId || e.target === nodeId).length;
        totalDegree += degree;

        for (const edge of edges) {
          if (edge.source === nodeId && nodeSet.has(edge.target)) {
            internalEdges++;
          }
        }
      }

      modularity += internalEdges / m - Math.pow(totalDegree / (2 * m), 2);
    }

    return modularity;
  };

  // Helper function to move a node between communities
  const moveNodeToCommunity = (
    nodeId: string,
    fromComm: string,
    toComm: string,
    communities: Map<string, Set<string>>,
    nodeToComm: Map<string, string>
  ): void => {
    const fromSet = communities.get(fromComm);
    const toSet = communities.get(toComm);

    if (fromSet) {
      fromSet.delete(nodeId);
      if (fromSet.size === 0) {
        communities.delete(fromComm);
      }
    }

    if (toSet) {
      toSet.add(nodeId);
    } else {
      communities.set(toComm, new Set([nodeId]));
    }

    nodeToComm.set(nodeId, toComm);
  };

  // Helper function to calculate community strength
  const calculateCommunityStrength = (nodes: PatentNode[], edges: CitationEdge[]): number => {
    if (nodes.length === 0) return 0;

    const nodeIds = new Set(nodes.map(n => n.id));
    let internalEdges = 0;
    let externalEdges = 0;

    for (const edge of edges) {
      const sourceIn = nodeIds.has(edge.source);
      const targetIn = nodeIds.has(edge.target);

      if (sourceIn && targetIn) {
        internalEdges++;
      } else if (sourceIn || targetIn) {
        externalEdges++;
      }
    }

    const total = internalEdges + externalEdges;
    if (total === 0) return 50; // Default neutral strength

    return Math.round((internalEdges / total) * 100);
  };

  const runAdvancedClustering = async (method: 'kmeans' | 'hierarchical' | 'community' = 'kmeans', k: number = 3) => {
    if (!networkData) return;
    
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const nodes = networkData.networks.combined.nodes;
      const edges = networkData.networks.combined.edges;
      
      let newClusters: CitationCluster[] = [];
      
      switch (method) {
        case 'kmeans':
          newClusters = performKMeansClustering(nodes, k);
          break;
        case 'hierarchical':
          newClusters = performHierarchicalClustering(nodes);
          break;
        case 'community':
          newClusters = performCommunityDetection(nodes, edges);
          break;
      }
      
      // Update node cluster assignments
      const updatedNodes = nodes.map(node => {
        const cluster = newClusters.find(c => c.nodes.includes(node.id));
        return {
          ...node,
          cluster: cluster ? newClusters.indexOf(cluster) : 0,
          color: cluster ? cluster.color : node.color
        };
      });
      
      const updatedAnalysis: CitationAnalysis = {
        ...networkData,
        networks: {
          ...networkData.networks,
          combined: { nodes: updatedNodes, edges }
        },
        clusters: newClusters
      };
      
      setNetworkData(updatedAnalysis);
      setIsAnalyzing(false);
      
      if (onNetworkUpdate) {
        onNetworkUpdate(updatedAnalysis);
      }
    }, 2500);
  };

  // Export functionality
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
          return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
        }).join(',')
      )
    ].join('\n');
    
    downloadFile(csvContent, `${filename}.csv`, 'text/csv');
  };

  const exportToJSON = (data: any, filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, `${filename}.json`, 'application/json');
  };

  const exportToSVG = (svgElement: SVGElement, filename: string) => {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const fullSvg = `<?xml version="1.0" encoding="UTF-8"?>\n${svgString}`;
    downloadFile(fullSvg, `${filename}.svg`, 'image/svg+xml');
  };

  const exportToPNG = async (svgElement: SVGElement, filename: string) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width || 800;
        canvas.height = img.height || 600;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(blob => {
          if (blob) {
            downloadFile(blob, `${filename}.png`, 'image/png');
          }
        });
        
        URL.revokeObjectURL(url);
      };
      
      img.src = url;
    } catch (error) {
      console.error('PNG export failed:', error);
    }
  };

  const downloadFile = (content: string | Blob, filename: string, mimeType: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportNetworkData = (format: 'csv' | 'json' | 'svg' | 'png') => {
    if (!networkData) return;
    
    const timestamp = new Date().toISOString().split('T')[0];
    const baseFilename = `citation-network-${projectId}-${timestamp}`;
    
    switch (format) {
      case 'csv':
        // Export nodes as CSV
        const nodesData = networkData.networks[networkType].nodes.map(node => ({
          id: node.id,
          title: node.title,
          publicationNumber: node.publicationNumber,
          publicationDate: node.publicationDate,
          applicant: node.applicant,
          jurisdiction: node.jurisdiction,
          type: node.type,
          citationCount: node.citationCount,
          citedByCount: node.citedByCount,
          familySize: node.familySize,
          priority: node.priority,
          relevanceScore: node.relevanceScore,
          cluster: node.cluster
        }));
        exportToCSV(nodesData, `${baseFilename}-nodes`);
        
        // Export edges as CSV
        const edgesData = networkData.networks[networkType].edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type,
          weight: edge.weight,
          date: edge.date
        }));
        exportToCSV(edgesData, `${baseFilename}-edges`);
        break;
        
      case 'json':
        const exportData = {
          metadata: {
            projectId,
            exportDate: new Date().toISOString(),
            networkType,
            totalNodes: networkData.networks[networkType].nodes.length,
            totalEdges: networkData.networks[networkType].edges.length,
            clusterCount: networkData.clusters.length
          },
          nodes: networkData.networks[networkType].nodes,
          edges: networkData.networks[networkType].edges,
          clusters: networkData.clusters,
          metrics: networkData.metrics,
          timeline: networkData.timeline
        };
        exportToJSON(exportData, baseFilename);
        break;
        
      case 'svg':
        const svgElement = document.querySelector('#network-svg') as SVGElement;
        if (svgElement) {
          exportToSVG(svgElement, baseFilename);
        }
        break;
        
      case 'png':
        const svgEl = document.querySelector('#network-svg') as SVGElement;
        if (svgEl) {
          exportToPNG(svgEl, baseFilename);
        }
        break;
    }
  };

  const exportTimelineData = (format: 'csv' | 'json') => {
    if (!networkData) return;
    
    const timestamp = new Date().toISOString().split('T')[0];
    const baseFilename = `citation-timeline-${projectId}-${timestamp}`;
    
    switch (format) {
      case 'csv':
        exportToCSV(networkData.timeline, baseFilename);
        break;
      case 'json':
        const timelineExport = {
          metadata: {
            projectId,
            exportDate: new Date().toISOString(),
            timeRange: {
              start: Math.min(...networkData.timeline.map(t => t.year)),
              end: Math.max(...networkData.timeline.map(t => t.year))
            }
          },
          timeline: networkData.timeline,
          patents: networkData.networks.combined.nodes
            .map(node => ({
              id: node.id,
              title: node.title,
              publicationNumber: node.publicationNumber,
              publicationDate: node.publicationDate,
              year: new Date(node.publicationDate).getFullYear(),
              citationCount: node.citationCount,
              relevanceScore: node.relevanceScore
            }))
            .sort((a, b) => a.year - b.year)
        };
        exportToJSON(timelineExport, baseFilename);
        break;
    }
  };

  const exportClusterAnalysis = (format: 'csv' | 'json') => {
    if (!networkData) return;
    
    const timestamp = new Date().toISOString().split('T')[0];
    const baseFilename = `citation-clusters-${projectId}-${timestamp}`;
    
    switch (format) {
      case 'csv':
        // Export cluster summary
        const clusterSummary = networkData.clusters.map(cluster => ({
          id: cluster.id,
          name: cluster.name,
          size: cluster.size,
          strength: cluster.strength,
          technicalArea: cluster.technicalArea,
          nodes: cluster.nodes.join('; ')
        }));
        exportToCSV(clusterSummary, `${baseFilename}-summary`);
        
        // Export detailed cluster assignments
        const nodeClusterData = networkData.networks.combined.nodes.map(node => {
          const cluster = networkData.clusters.find(c => c.nodes.includes(node.id));
          return {
            nodeId: node.id,
            publicationNumber: node.publicationNumber,
            title: node.title,
            clusterId: cluster?.id || 'unassigned',
            clusterName: cluster?.name || 'Unassigned',
            clusterStrength: cluster?.strength || 0,
            technicalArea: cluster?.technicalArea || 'Unknown'
          };
        });
        exportToCSV(nodeClusterData, `${baseFilename}-assignments`);
        break;
        
      case 'json':
        const clusterExport = {
          metadata: {
            projectId,
            exportDate: new Date().toISOString(),
            clusteringMethod,
            totalClusters: networkData.clusters.length,
            totalNodes: networkData.networks.combined.nodes.length
          },
          clusters: networkData.clusters,
          nodeAssignments: networkData.networks.combined.nodes.map(node => {
            const cluster = networkData.clusters.find(c => c.nodes.includes(node.id));
            return {
              nodeId: node.id,
              clusterId: cluster?.id || null,
              clusterIndex: cluster ? networkData.clusters.indexOf(cluster) : -1
            };
          }),
          metrics: networkData.metrics
        };
        exportToJSON(clusterExport, baseFilename);
        break;
    }
  };

  const exportFullReport = () => {
    if (!networkData) return;
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `citation-analysis-report-${projectId}-${timestamp}`;
    
    const fullReport = {
      metadata: {
        projectId,
        exportDate: new Date().toISOString(),
        analysisType: 'Citation Network Analysis',
        networkType,
        clusteringMethod,
        parameters: {
          clusterCount,
          filterThreshold,
          nodeSize,
          edgeWidth,
          showClusters,
          showLabels
        }
      },
      summary: {
        totalPatents: networkData.networks.combined.nodes.length,
        totalCitations: networkData.networks.combined.edges.length,
        timeRange: {
          earliest: Math.min(...networkData.networks.combined.nodes.map(n => new Date(n.publicationDate).getFullYear())),
          latest: Math.max(...networkData.networks.combined.nodes.map(n => new Date(n.publicationDate).getFullYear()))
        },
        topApplicants: Object.entries(
          networkData.networks.combined.nodes.reduce((acc, node) => {
            acc[node.applicant] = (acc[node.applicant] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).sort(([, a], [, b]) => b - a).slice(0, 5)
      },
      networks: {
        combined: networkData.networks.combined,
        backward: networkData.networks.backward,
        forward: networkData.networks.forward
      },
      clusters: networkData.clusters,
      metrics: networkData.metrics,
      timeline: networkData.timeline,
      keyPatents: networkData.keyPatents
    };
    
    exportToJSON(fullReport, filename);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg">
            <Network className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Citation Network Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Visualize and analyze patent citation networks and relationships
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={runCitationAnalysis} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <GitBranch className="h-4 w-4 mr-2" />
                Analyze Strength
              </>
            )}
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
          <Select onValueChange={(action: any) => {
            if (action === 'full-report') exportFullReport();
            else if (action === 'clusters-csv') exportClusterAnalysis('csv');
            else if (action === 'clusters-json') exportClusterAnalysis('json');
          }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Export All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full-report">Full Report</SelectItem>
              <SelectItem value="clusters-csv">Clusters CSV</SelectItem>
              <SelectItem value="clusters-json">Clusters JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="network">Network View</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="clusters">Clusters</TabsTrigger>
        </TabsList>

        <TabsContent value="network" className="flex-1 space-y-4">
          {/* Advanced Network Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Network Controls</h4>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => runAdvancedClustering(clusteringMethod, clusterCount)}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Clustering...
                    </>
                  ) : (
                    <>
                      <GitBranch className="h-4 w-4 mr-2" />
                      Run Clustering
                    </>
                  )}
                </Button>
                <Select onValueChange={(format: any) => exportNetworkData(format)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Export" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">Export CSV</SelectItem>
                    <SelectItem value="json">Export JSON</SelectItem>
                    <SelectItem value="svg">Export SVG</SelectItem>
                    <SelectItem value="png">Export PNG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Control Grid */}
            <div className="grid gap-4 md:grid-cols-6">
              {/* Network Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Network Type</label>
                <Select value={networkType} onValueChange={(value: any) => setNetworkType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="combined">Combined</SelectItem>
                    <SelectItem value="backward">Backward</SelectItem>
                    <SelectItem value="forward">Forward</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clustering Method */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Clustering</label>
                <Select value={clusteringMethod} onValueChange={(value: any) => setClusteringMethod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kmeans">K-Means</SelectItem>
                    <SelectItem value="hierarchical">Hierarchical</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cluster Count */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Clusters: {clusterCount}</label>
                <input
                  type="range"
                  min="2"
                  max="8"
                  value={clusterCount}
                  onChange={(e) => setClusterCount(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  disabled={clusteringMethod !== 'kmeans'}
                />
              </div>

              {/* Node Size */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Node Size: {nodeSize.toFixed(1)}</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={nodeSize}
                  onChange={(e) => setNodeSize(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Edge Width */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Edge Width: {edgeWidth.toFixed(1)}</label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={edgeWidth}
                  onChange={(e) => setEdgeWidth(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Filter Threshold */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Min Weight: {filterThreshold}</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={filterThreshold}
                  onChange={(e) => setFilterThreshold(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Toggle Controls */}
            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="show-clusters"
                  checked={showClusters}
                  onChange={(e) => setShowClusters(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="show-clusters" className="text-sm font-medium">
                  Show Clusters
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="show-labels"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="show-labels" className="text-sm font-medium">
                  Show Labels
                </label>
              </div>
              {networkData && (
                <div className="flex gap-2 ml-auto">
                  <Badge variant="outline">
                    {networkData.networks[networkType].nodes.length} nodes
                  </Badge>
                  <Badge variant="outline">
                    {networkData.networks[networkType].edges.filter(e => e.weight >= filterThreshold).length} edges
                  </Badge>
                  <Badge variant="outline">
                    {networkData.clusters.length} clusters
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Network Visualization */}
          <div className="grid gap-6 md:grid-cols-3 flex-1">
            {/* Network Display */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Citation Network</CardTitle>
                <CardDescription>
                  Interactive visualization of patent citation relationships
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative h-96 bg-muted/20 rounded-lg border-2 border-dashed border-muted">
                  {networkData ? (
                    <div className="absolute inset-4">
                      {/* Interactive SVG-based network representation */}
                      <svg id="network-svg" className="w-full h-full">
                        {/* Draw edges first */}
                        {networkData.networks[networkType].edges
                          .filter(edge => edge.weight >= filterThreshold)
                          .map((edge, index) => {
                            const sourceNode = networkData.networks[networkType].nodes.find(n => n.id === edge.source);
                            const targetNode = networkData.networks[networkType].nodes.find(n => n.id === edge.target);
                            if (!sourceNode || !targetNode) return null;
                            
                            // Simple positioning - in real implementation, use force-directed layout
                            const sourceX = 50 + (index % 4) * 120;
                            const sourceY = 50 + Math.floor(index / 4) * 100;
                            const targetX = sourceX + 100 + (index % 2) * 20;
                            const targetY = sourceY + (index % 2 === 0 ? -30 : 30);
                            
                            return (
                              <line
                                key={edge.id}
                                x1={sourceX}
                                y1={sourceY}
                                x2={targetX}
                                y2={targetY}
                                stroke={showClusters ? edge.color : '#6b7280'}
                                strokeWidth={edge.width * edgeWidth}
                                opacity={Math.max(0.2, edge.opacity)}
                                markerEnd="url(#arrowhead)"
                                className="hover:opacity-100 cursor-pointer"
                                onClick={() => {
                                  // Show edge details in future implementation
                                  console.log('Edge clicked:', edge);
                                }}
                              >
                                <title>
                                  {`${sourceNode.publicationNumber} → ${targetNode.publicationNumber} (Weight: ${edge.weight}%)`}
                                </title>
                              </line>
                            );
                          })}
                        
                        {/* Draw cluster backgrounds if enabled */}
                        {showClusters && networkData.clusters.map((cluster, clusterIndex) => {
                          const clusterNodes = networkData.networks[networkType].nodes.filter(n => 
                            cluster.nodes.includes(n.id)
                          );
                          if (clusterNodes.length === 0) return null;
                          
                          // Calculate cluster bounds
                          const xs = clusterNodes.map((_, i) => 50 + (i % 4) * 120);
                          const ys = clusterNodes.map((_, i) => 50 + Math.floor(i / 4) * 100);
                          const minX = Math.min(...xs) - 20;
                          const minY = Math.min(...ys) - 20;
                          const maxX = Math.max(...xs) + 20;
                          const maxY = Math.max(...ys) + 20;
                          
                          return (
                            <rect
                              key={`cluster-bg-${cluster.id}`}
                              x={minX}
                              y={minY}
                              width={maxX - minX}
                              height={maxY - minY}
                              fill={cluster.color}
                              opacity={0.1}
                              rx={8}
                              className="pointer-events-none"
                            />
                          );
                        })}
                        
                        {/* Draw nodes */}
                        {networkData.networks[networkType].nodes.map((node, index) => {
                          // Simple positioning - in real implementation, use force-directed layout
                          const x = 50 + (index % 4) * 120;
                          const y = 50 + Math.floor(index / 4) * 100;
                          const radius = (node.size / 2) * nodeSize;
                          
                          return (
                            <g key={node.id}>
                              {/* Node selection ring */}
                              {selectedNode?.id === node.id && (
                                <circle
                                  cx={x}
                                  cy={y}
                                  r={radius + 4}
                                  fill="none"
                                  stroke="#3b82f6"
                                  strokeWidth="2"
                                  className="animate-pulse"
                                />
                              )}
                              
                              {/* Main node circle */}
                              <circle
                                cx={x}
                                cy={y}
                                r={radius}
                                fill={showClusters ? node.color : '#6b7280'}
                                stroke="#fff"
                                strokeWidth="2"
                                className="cursor-pointer hover:opacity-80 transition-all duration-200"
                                onClick={() => setSelectedNode(node)}
                                onMouseEnter={() => {
                                  // Could add hover effects here
                                }}
                              >
                                <title>
                                  {`${node.title} (${node.publicationNumber})\nRelevance: ${node.relevanceScore}%\nCitations: ${node.citationCount}`}
                                </title>
                              </circle>
                              
                              {/* Node labels */}
                              {showLabels && (
                                <text
                                  x={x}
                                  y={y + radius + 14}
                                  textAnchor="middle"
                                  className="text-xs fill-current text-foreground pointer-events-none"
                                  style={{ fontSize: `${10 * nodeSize}px` }}
                                >
                                  {node.publicationNumber}
                                </text>
                              )}
                              
                              {/* Node type indicator */}
                              <circle
                                cx={x + radius - 3}
                                cy={y - radius + 3}
                                r={3}
                                fill={node.type === 'target' ? '#ef4444' : 
                                      node.type === 'prior_art' ? '#3b82f6' :
                                      node.type === 'cited_by' ? '#10b981' : '#f59e0b'}
                                stroke="#fff"
                                strokeWidth="1"
                                className="pointer-events-none"
                              />
                            </g>
                          );
                        })}
                        
                        {/* Arrow marker definition */}
                        <defs>
                          <marker
                            id="arrowhead"
                            markerWidth="10"
                            markerHeight="7"
                            refX="9"
                            refY="3.5"
                            orient="auto"
                          >
                            <polygon
                              points="0 0, 10 3.5, 0 7"
                              fill="#6b7280"
                            />
                          </marker>
                        </defs>
                      </svg>
                      
                      {/* Legend */}
                      <div className="absolute top-2 right-2 bg-background border rounded-lg p-2 space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span>Target Patent</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span>Prior Art</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span>Cited By</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <span>Family Member</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Network className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">Loading network data...</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Node Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Node Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedNode ? (
                  <ScrollArea className="h-80">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{backgroundColor: selectedNode.color}}
                          ></div>
                          <Badge variant="outline">{selectedNode.type.replace('_', ' ')}</Badge>
                        </div>
                        <h4 className="font-medium text-sm">{selectedNode.title}</h4>
                        <p className="text-xs text-muted-foreground">{selectedNode.publicationNumber}</p>
                        <p className="text-xs text-muted-foreground">{selectedNode.applicant}</p>
                      </div>
                      
                      <Separator />
                      
                      <div className="grid gap-2">
                        <div className="flex justify-between text-sm">
                          <span>Citations:</span>
                          <span>{selectedNode.citationCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Cited By:</span>
                          <span>{selectedNode.citedByCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Family Size:</span>
                          <span>{selectedNode.familySize}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Relevance:</span>
                          <span>{selectedNode.relevanceScore}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Priority:</span>
                          <span>{selectedNode.priority}%</span>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Publication Date:</p>
                        <p className="text-sm">{new Date(selectedNode.publicationDate).toLocaleDateString()}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Jurisdiction:</p>
                        <Badge variant="secondary">{selectedNode.jurisdiction}</Badge>
                      </div>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex items-center justify-center h-80">
                    <div className="text-center">
                      <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Click a node to view details</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="flex-1">
          {networkData && (
            <div className="space-y-6">
              {/* Network Metrics */}
              <div className="grid gap-4 md:grid-cols-5">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Network className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">{networkData.metrics.totalNodes}</p>
                        <p className="text-sm text-muted-foreground">Total Nodes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Share2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">{networkData.metrics.totalEdges}</p>
                        <p className="text-sm text-muted-foreground">Total Edges</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-medium">{networkData.metrics.averageDegree.toFixed(1)}</p>
                        <p className="text-sm text-muted-foreground">Avg Degree</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium">{(networkData.metrics.clustering * 100).toFixed(0)}%</p>
                        <p className="text-sm text-muted-foreground">Clustering</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="font-medium">{(networkData.metrics.density * 100).toFixed(0)}%</p>
                        <p className="text-sm text-muted-foreground">Density</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="flex-1 space-y-6">
          {networkData && (
            <>
              {/* Timeline Controls */}
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Citation Timeline Analysis</h4>
                <div className="flex gap-2">
                  <Select defaultValue="publications">
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="publications">Publications</SelectItem>
                      <SelectItem value="citations">Citations</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select onValueChange={(format: any) => exportTimelineData(format)}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Export" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">Timeline CSV</SelectItem>
                      <SelectItem value="json">Timeline JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Timeline Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Publication & Citation Timeline</CardTitle>
                    <CardDescription>Patent activity over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 relative">
                      {/* SVG Timeline Chart */}
                      <svg className="w-full h-full">
                        {/* Chart background */}
                        <rect width="100%" height="100%" fill="transparent" />
                        
                        {/* Calculate chart dimensions */}
                        {(() => {
                          const margin = { top: 20, right: 30, bottom: 40, left: 40 };
                          const chartWidth = 400 - margin.left - margin.right;
                          const chartHeight = 200 - margin.top - margin.bottom;
                          
                          const timelineData = networkData.timeline;
                          const years = timelineData.map(d => d.year);
                          const maxPubs = Math.max(...timelineData.map(d => d.publications));
                          const maxCitations = Math.max(...timelineData.map(d => d.citations));
                          const maxValue = Math.max(maxPubs, maxCitations);
                          
                          const xScale = (year: number) => 
                            margin.left + ((year - Math.min(...years)) / (Math.max(...years) - Math.min(...years))) * chartWidth;
                          const yScale = (value: number) => 
                            margin.top + chartHeight - (value / maxValue) * chartHeight;
                          
                          return (
                            <g>
                              {/* Grid lines */}
                              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                                <line
                                  key={`grid-${i}`}
                                  x1={margin.left}
                                  y1={margin.top + chartHeight * ratio}
                                  x2={margin.left + chartWidth}
                                  y2={margin.top + chartHeight * ratio}
                                  stroke="#e5e7eb"
                                  strokeWidth="1"
                                  opacity={0.5}
                                />
                              ))}
                              
                              {/* X-axis */}
                              <line
                                x1={margin.left}
                                y1={margin.top + chartHeight}
                                x2={margin.left + chartWidth}
                                y2={margin.top + chartHeight}
                                stroke="#374151"
                                strokeWidth="2"
                              />
                              
                              {/* Y-axis */}
                              <line
                                x1={margin.left}
                                y1={margin.top}
                                x2={margin.left}
                                y2={margin.top + chartHeight}
                                stroke="#374151"
                                strokeWidth="2"
                              />
                              
                              {/* Publications line */}
                              <path
                                d={`M ${timelineData.map((d, i) => 
                                  `${xScale(d.year)},${yScale(d.publications)}`
                                ).join(' L ')}`}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              
                              {/* Citations line */}
                              <path
                                d={`M ${timelineData.map((d, i) => 
                                  `${xScale(d.year)},${yScale(d.citations)}`
                                ).join(' L ')}`}
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              
                              {/* Data points for publications */}
                              {timelineData.map((d, i) => (
                                <circle
                                  key={`pub-${i}`}
                                  cx={xScale(d.year)}
                                  cy={yScale(d.publications)}
                                  r="4"
                                  fill="#3b82f6"
                                  stroke="#fff"
                                  strokeWidth="2"
                                  className="cursor-pointer hover:r-6"
                                >
                                  <title>{`${d.year}: ${d.publications} publications`}</title>
                                </circle>
                              ))}
                              
                              {/* Data points for citations */}
                              {timelineData.map((d, i) => (
                                <circle
                                  key={`cit-${i}`}
                                  cx={xScale(d.year)}
                                  cy={yScale(d.citations)}
                                  r="4"
                                  fill="#ef4444"
                                  stroke="#fff"
                                  strokeWidth="2"
                                  className="cursor-pointer hover:r-6"
                                >
                                  <title>{`${d.year}: ${d.citations} citations`}</title>
                                </circle>
                              ))}
                              
                              {/* Year labels */}
                              {years.map(year => (
                                <text
                                  key={`year-${year}`}
                                  x={xScale(year)}
                                  y={margin.top + chartHeight + 20}
                                  textAnchor="middle"
                                  className="text-xs fill-current text-muted-foreground"
                                >
                                  {year}
                                </text>
                              ))}
                              
                              {/* Y-axis labels */}
                              {[0, Math.floor(maxValue * 0.5), maxValue].map(value => (
                                <text
                                  key={`y-${value}`}
                                  x={margin.left - 10}
                                  y={yScale(value) + 4}
                                  textAnchor="end"
                                  className="text-xs fill-current text-muted-foreground"
                                >
                                  {value}
                                </text>
                              ))}
                            </g>
                          );
                        })()}
                      </svg>
                      
                      {/* Legend */}
                      <div className="absolute top-2 right-2 bg-background border rounded-lg p-2 space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-3 h-0.5 bg-blue-500"></div>
                          <span>Publications</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-3 h-0.5 bg-red-500"></div>
                          <span>Citations</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Timeline Insights</CardTitle>
                    <CardDescription>Key patterns and trends</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Peak Activity */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Peak Activity</h4>
                        <div className="grid gap-2">
                          {(() => {
                            const peakPubYear = networkData.timeline.reduce((max, current) => 
                              current.publications > max.publications ? current : max
                            );
                            const peakCitYear = networkData.timeline.reduce((max, current) => 
                              current.citations > max.citations ? current : max
                            );
                            
                            return (
                              <>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Publications:</span>
                                  <span className="font-medium">{peakPubYear.year} ({peakPubYear.publications})</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Citations:</span>
                                  <span className="font-medium">{peakCitYear.year} ({peakCitYear.citations})</span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      <Separator />

                      {/* Growth Trends */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Growth Trends</h4>
                        <div className="grid gap-2">
                          {(() => {
                            const timeline = networkData.timeline;
                            const pubGrowth = timeline.length > 1 ? 
                              ((timeline[timeline.length - 1].publications - timeline[0].publications) / timeline[0].publications) * 100 : 0;
                            const citGrowth = timeline.length > 1 ? 
                              ((timeline[timeline.length - 1].cumulativeCitations - timeline[0].cumulativeCitations) / Math.max(timeline[0].cumulativeCitations, 1)) * 100 : 0;
                            
                            return (
                              <>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Publication Growth:</span>
                                  <span className={`font-medium ${pubGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {pubGrowth >= 0 ? '+' : ''}{pubGrowth.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Citation Growth:</span>
                                  <span className={`font-medium ${citGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {citGrowth >= 0 ? '+' : ''}{citGrowth.toFixed(1)}%
                                  </span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      <Separator />

                      {/* Time Distribution */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Patent Distribution</h4>
                        <div className="space-y-2">
                          {Object.entries(
                            networkData.networks.combined.nodes
                              .reduce((acc, node) => {
                                const year = new Date(node.publicationDate).getFullYear();
                                const decade = Math.floor(year / 10) * 10;
                                acc[decade] = (acc[decade] || 0) + 1;
                                return acc;
                              }, {} as Record<number, number>)
                          ).map(([decade, count]) => (
                            <div key={decade} className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-12">
                                {decade}s:
                              </span>
                              <div className="flex-1 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${(Number(count) / networkData.networks.combined.nodes.length) * 100}%`
                                  }}
                                />
                              </div>
                              <span className="text-xs font-medium w-6">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Patent Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Patent Timeline</CardTitle>
                  <CardDescription>Chronological view of patents in the network</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted"></div>
                      
                      <div className="space-y-4">
                        {networkData.networks.combined.nodes
                          .sort((a, b) => new Date(a.publicationDate).getTime() - new Date(b.publicationDate).getTime())
                          .map((node, index) => (
                            <div key={node.id} className="flex items-start gap-4">
                              {/* Timeline marker */}
                              <div className="flex flex-col items-center">
                                <div 
                                  className="w-3 h-3 rounded-full border-2 border-background"
                                  style={{ backgroundColor: node.color }}
                                ></div>
                                {index < networkData.networks.combined.nodes.length - 1 && (
                                  <div className="w-0.5 h-8 bg-muted mt-1"></div>
                                )}
                              </div>
                              
                              {/* Patent info */}
                              <div className="flex-1 pb-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium text-sm">{node.title}</h4>
                                    <p className="text-xs text-muted-foreground">{node.publicationNumber} • {node.applicant}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-medium">
                                      {new Date(node.publicationDate).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {node.citationCount} citations
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {node.type.replace('_', ' ')}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {node.relevanceScore}% relevance
                                  </Badge>
                                  {node.priority >= 80 && (
                                    <Badge variant="default" className="text-xs">
                                      High Priority
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="clusters" className="flex-1">
          {networkData && (
            <div className="space-y-4">
              <div className="grid gap-4">
                {networkData.clusters.map((cluster) => (
                  <Card key={cluster.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{cluster.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge 
                            style={{backgroundColor: cluster.color, color: 'white'}}
                          >
                            {cluster.size} patents
                          </Badge>
                          <Badge variant="outline">
                            {cluster.strength}% strength
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Technical Area: {cluster.technicalArea}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {cluster.nodes.map((nodeId) => {
                            const node = networkData.networks.combined.nodes.find(n => n.id === nodeId);
                            return node ? (
                              <Badge key={nodeId} variant="secondary" className="text-xs">
                                {node.publicationNumber}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}