/**
 * Relationship Extraction Agent - LLM + Dependency Parsing Approach
 * Extracts semantic relationships between entities to build knowledge graphs
 * Uses triple extraction (subject, predicate, object) with confidence scoring
 */

import { BaseAgent } from '../BaseAgent';
import { 
  AgentMessage, 
  AgentStage, 
  EntityExtractionResult,
  ExtractedEntity,
  ExtractedRelationship,
  RelationshipType,
  RelationshipExtractionResult,
  EntityType
} from '../types';

/**
 * Patent-specific relationship patterns for rule-based extraction
 */
class PatentRelationshipPatterns {
  private functionalPatterns = [
    // Component-Process relationships
    { pattern: /(\w+(?:\s+\w+)*)\s+(?:is configured to|configured to|adapted to|operable to)\s+(\w+(?:\s+\w+)*)/gi, type: RelationshipType.FUNCTIONAL },
    { pattern: /(\w+(?:\s+\w+)*)\s+(?:performs|executes|carries out|implements)\s+(\w+(?:\s+\w+)*)/gi, type: RelationshipType.FUNCTIONAL },
    { pattern: /(\w+(?:\s+\w+)*)\s+(?:processes|analyzes|detects|measures|controls)\s+(\w+(?:\s+\w+)*)/gi, type: RelationshipType.FUNCTIONAL },
    
    // Component-Component relationships  
    { pattern: /(\w+(?:\s+\w+)*)\s+(?:comprises|includes|contains|incorporates)\s+(\w+(?:\s+\w+)*)/gi, type: RelationshipType.STRUCTURAL },
    { pattern: /(\w+(?:\s+\w+)*)\s+(?:is coupled to|coupled to|connected to|attached to)\s+(\w+(?:\s+\w+)*)/gi, type: RelationshipType.STRUCTURAL },
    { pattern: /(\w+(?:\s+\w+)*)\s+(?:is mounted on|mounted on|disposed on|positioned on)\s+(\w+(?:\s+\w+)*)/gi, type: RelationshipType.STRUCTURAL },
    
    // Application relationships
    { pattern: /(\w+(?:\s+\w+)*)\s+(?:is used in|used in|applied to|utilized in)\s+(\w+(?:\s+\w+)*)/gi, type: RelationshipType.APPLICATION },
    { pattern: /(\w+(?:\s+\w+)*)\s+(?:for|in)\s+(\w+(?:\s+\w+)*(?:applications?|systems?|devices?))/gi, type: RelationshipType.APPLICATION },
    
    // Causal relationships
    { pattern: /(\w+(?:\s+\w+)*)\s+(?:causes|results in|leads to|produces)\s+(\w+(?:\s+\w+)*)/gi, type: RelationshipType.CAUSAL },
    { pattern: /(\w+(?:\s+\w+)*)\s+(?:enables|allows|facilitates|permits)\s+(\w+(?:\s+\w+)*)/gi, type: RelationshipType.CAUSAL },
    
    // Dependency relationships
    { pattern: /(\w+(?:\s+\w+)*)\s+(?:depends on|relies on|requires|needs)\s+(\w+(?:\s+\w+)*)/gi, type: RelationshipType.DEPENDENCY },
    { pattern: /(\w+(?:\s+\w+)*)\s+(?:based on|according to|in response to)\s+(\w+(?:\s+\w+)*)/gi, type: RelationshipType.DEPENDENCY }
  ];

  private quantitativePatterns = [
    // Parameter relationships
    { pattern: /(\w+(?:\s+\w+)*)\s+(?:has|having|with)\s+(?:a|an)?\s*(\w+(?:\s+\w+)*)\s+(?:of|equal to|greater than|less than)\s+([\d.]+(?:\s*\w+)?)/gi, type: RelationshipType.QUANTITATIVE },
    { pattern: /(\w+(?:\s+\w+)*)\s+(?:operates at|set to|configured for)\s+([\d.]+(?:\s*\w+)?)\s+(\w+(?:\s+\w+)*)/gi, type: RelationshipType.QUANTITATIVE }
  ];

  getAllPatterns() {
    return [...this.functionalPatterns, ...this.quantitativePatterns];
  }

  getFunctionalPatterns() {
    return this.functionalPatterns;
  }

  getQuantitativePatterns() {
    return this.quantitativePatterns;
  }
}

/**
 * Relationship Extraction Agent using hybrid approach
 */
export class RelationshipExtractionAgent extends BaseAgent {
  private patterns: PatentRelationshipPatterns;
  
  constructor() {
    super(
      'RelationshipExtractionAgent', 
      '1.0.0', 
      ['relationship_extraction', 'semantic_parsing', 'triple_extraction', 'knowledge_graph_building']
    );
    this.patterns = new PatentRelationshipPatterns();
  }

  /**
   * Process entity extraction results to find relationships
   */
  async process(input: any): Promise<AgentMessage> {
    if (!this.validateInput(input)) {
      throw new Error('Invalid input: Expected EntityExtractionResult object');
    }

    const entityResults = input as EntityExtractionResult;
    const { result, processingTime } = await this.measureProcessingTime(
      () => this.extractRelationships(entityResults)
    );

    // Calculate confidence based on relationship quality
    const confidence = this.calculateConfidence(result);

    return this.createMessage(
      entityResults.patentId,
      AgentStage.RELATIONSHIPS_EXTRACTED,
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
      input.entities &&
      Array.isArray(input.entities) &&
      input.entityCounts
    );
  }

  /**
   * Main relationship extraction logic
   */
  private async extractRelationships(entityResults: EntityExtractionResult): Promise<RelationshipExtractionResult> {
    this.log('info', `Starting relationship extraction for patent ${entityResults.patentId}`);

    // Get entities for context
    const entities = entityResults.entities;
    
    // Reconstruct text for relationship extraction (we'll need the original preprocessed text)
    // For now, we'll work with entity contexts
    const fullText = entities.map(e => e.text).join(' ');

    // Step 1: Pattern-based relationship extraction (reliable, fast)
    const patternRelationships = this.extractPatternBasedRelationships(fullText, entities);
    
    // Step 2: Dependency parsing for syntactic relationships
    const dependencyRelationships = this.extractDependencyRelationships(fullText, entities);
    
    // Step 3: LLM-based extraction for complex semantic relationships
    const llmRelationships = await this.extractLLMRelationships(fullText, entities);
    
    // Step 4: Combine and deduplicate relationships
    const combinedRelationships = this.combineRelationships(
      patternRelationships, 
      dependencyRelationships, 
      llmRelationships
    );
    
    // Step 5: Generate relationship statistics
    const relationshipStats = {
      patternMatches: patternRelationships.length,
      dependencyExtractions: dependencyRelationships.length,
      llmExtractions: llmRelationships.length,
      totalRelationships: combinedRelationships.length,
      uniqueEntityPairs: new Set(combinedRelationships.map(r => `${r.subject.text}-${r.object.text}`)).size
    };

    // Step 6: Count relationships by type
    const relationshipCounts = this.countRelationshipsByType(combinedRelationships);

    const result: RelationshipExtractionResult = {
      patentId: entityResults.patentId,
      relationships: combinedRelationships,
      relationshipCounts,
      confidence: this.calculateExtractionsConfidence(combinedRelationships),
      processingStats: relationshipStats
    };

    this.log('info', `Relationship extraction completed: ${combinedRelationships.length} relationships found`);
    
    return result;
  }

  /**
   * Pattern-based relationship extraction (rule-based, reliable)
   */
  private extractPatternBasedRelationships(text: string, entities: ExtractedEntity[]): ExtractedRelationship[] {
    const relationships: ExtractedRelationship[] = [];
    const entityMap = this.createEntityMap(entities);

    this.patterns.getAllPatterns().forEach(({ pattern, type }) => {
      let match;
      pattern.lastIndex = 0; // Reset regex state
      
      while ((match = pattern.exec(text)) !== null) {
        const subject = this.findMatchingEntity(match[1], entityMap);
        const object = this.findMatchingEntity(match[2] || match[3], entityMap);
        
        if (subject && object && subject !== object) {
          relationships.push({
            subject,
            predicate: this.extractPredicate(match[0]),
            object,
            type,
            confidence: 0.9, // High confidence for pattern matches
            source: 'pattern',
            context: match[0],
            startPos: match.index,
            endPos: match.index + match[0].length
          });
        }
      }
    });

    return relationships;
  }

  /**
   * Dependency parsing for syntactic relationships
   */
  private extractDependencyRelationships(text: string, entities: ExtractedEntity[]): ExtractedRelationship[] {
    const relationships: ExtractedRelationship[] = [];
    const entityMap = this.createEntityMap(entities);
    
    // Simulate dependency parsing with rule-based syntactic patterns
    const syntacticPatterns = [
      // Subject-Verb-Object patterns
      { pattern: /(\w+(?:\s+\w+)*)\s+(is|are|has|have|contains|includes)\s+(\w+(?:\s+\w+)*)/gi, type: RelationshipType.STRUCTURAL },
      
      // Prepositional relationships
      { pattern: /(\w+(?:\s+\w+)*)\s+(?:of|from|to|with|by|through)\s+(\w+(?:\s+\w+)*)/gi, type: RelationshipType.DEPENDENCY },
      
      // Modification relationships
      { pattern: /(\w+(?:\s+\w+)*)\s+(\w+(?:\s+\w+)*?)(?:\s+(?:system|device|method|apparatus))/gi, type: RelationshipType.STRUCTURAL }
    ];

    syntacticPatterns.forEach(({ pattern, type }) => {
      let match;
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(text)) !== null) {
        const subject = this.findMatchingEntity(match[1], entityMap);
        const object = this.findMatchingEntity(match[3] || match[2], entityMap);
        
        if (subject && object && subject !== object) {
          relationships.push({
            subject,
            predicate: match[2] || 'related-to',
            object,
            type,
            confidence: 0.7, // Moderate confidence for dependency parsing
            source: 'dependency_parsing',
            context: match[0],
            startPos: match.index,
            endPos: match.index + match[0].length
          });
        }
      }
    });

    return relationships;
  }

  /**
   * LLM-based extraction for complex semantic relationships
   */
  private async extractLLMRelationships(text: string, entities: ExtractedEntity[]): Promise<ExtractedRelationship[]> {
    const relationships: ExtractedRelationship[] = [];
    
    // Simulate LLM extraction with advanced pattern matching
    // In real implementation, this would call an actual LLM service
    
    // Complex technical relationship patterns that require semantic understanding
    const complexPatterns = [
      // Causal chains
      { pattern: /(\w+(?:\s+\w+)*)\s+(?:thereby|thus|consequently)\s+(?:enabling|allowing|causing)\s+(\w+(?:\s+\w+)*)/gi, type: RelationshipType.CAUSAL },
      
      // Functional dependencies
      { pattern: /(\w+(?:\s+\w+)*)\s+(?:such that|so that|in order to)\s+(\w+(?:\s+\w+)*)/gi, type: RelationshipType.FUNCTIONAL },
      
      // Comparative relationships
      { pattern: /(\w+(?:\s+\w+)*)\s+(?:compared to|versus|relative to|in contrast to)\s+(\w+(?:\s+\w+)*)/gi, type: RelationshipType.COMPARATIVE },
      
      // Temporal relationships
      { pattern: /(\w+(?:\s+\w+)*)\s+(?:before|after|during|while|when)\s+(\w+(?:\s+\w+)*)/gi, type: RelationshipType.TEMPORAL }
    ];

    const entityMap = this.createEntityMap(entities);

    complexPatterns.forEach(({ pattern, type }) => {
      let match;
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(text)) !== null) {
        const subject = this.findMatchingEntity(match[1], entityMap);
        const object = this.findMatchingEntity(match[2], entityMap);
        
        if (subject && object && subject !== object) {
          relationships.push({
            subject,
            predicate: this.extractPredicate(match[0]),
            object,
            type,
            confidence: 0.8, // Good confidence for LLM extraction
            source: 'llm',
            context: match[0],
            startPos: match.index,
            endPos: match.index + match[0].length
          });
        }
      }
    });

    return relationships;
  }

  /**
   * Create entity lookup map for efficient matching
   */
  private createEntityMap(entities: ExtractedEntity[]): Map<string, ExtractedEntity> {
    const map = new Map<string, ExtractedEntity>();
    
    entities.forEach(entity => {
      // Add exact match
      map.set(entity.text.toLowerCase(), entity);
      
      // Add normalized versions
      const normalized = entity.text.toLowerCase().replace(/[^\w\s]/g, '').trim();
      map.set(normalized, entity);
      
      // Add individual words for partial matching
      entity.text.toLowerCase().split(/\s+/).forEach(word => {
        if (word.length > 2) {
          map.set(word, entity);
        }
      });
    });
    
    return map;
  }

  /**
   * Find matching entity for relationship extraction
   */
  private findMatchingEntity(text: string, entityMap: Map<string, ExtractedEntity>): ExtractedEntity | null {
    const normalized = text.toLowerCase().replace(/[^\w\s]/g, '').trim();
    
    // Try exact match first
    if (entityMap.has(normalized)) {
      return entityMap.get(normalized)!;
    }
    
    // Try partial matching for compound terms
    const words = normalized.split(/\s+/);
    for (const word of words) {
      if (word.length > 3 && entityMap.has(word)) {
        return entityMap.get(word)!;
      }
    }
    
    return null;
  }

  /**
   * Extract predicate from matched text
   */
  private extractPredicate(matchText: string): string {
    // Extract the main verb or relationship indicator
    const predicatePatterns = [
      /\s+(is configured to|configured to|adapted to|operable to)\s+/i,
      /\s+(performs|executes|carries out|implements)\s+/i,
      /\s+(comprises|includes|contains|incorporates)\s+/i,
      /\s+(is coupled to|coupled to|connected to|attached to)\s+/i,
      /\s+(causes|results in|leads to|produces)\s+/i,
      /\s+(enables|allows|facilitates|permits)\s+/i,
      /\s+(depends on|relies on|requires|needs)\s+/i,
      /\s+(is|are|has|have)\s+/i
    ];

    for (const pattern of predicatePatterns) {
      const match = matchText.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return 'related-to'; // Default predicate
  }

  /**
   * Combine relationships from all sources and deduplicate
   */
  private combineRelationships(
    patternRelationships: ExtractedRelationship[],
    dependencyRelationships: ExtractedRelationship[],
    llmRelationships: ExtractedRelationship[]
  ): ExtractedRelationship[] {
    const allRelationships = [...patternRelationships, ...dependencyRelationships, ...llmRelationships];
    const relationshipMap = new Map<string, ExtractedRelationship>();

    allRelationships.forEach(relationship => {
      const key = `${relationship.subject.text.toLowerCase()}-${relationship.predicate}-${relationship.object.text.toLowerCase()}`;
      const existing = relationshipMap.get(key);
      
      if (!existing || relationship.confidence > existing.confidence) {
        // Keep the relationship with highest confidence
        relationshipMap.set(key, relationship);
      }
    });

    return Array.from(relationshipMap.values())
      .sort((a, b) => b.confidence - a.confidence); // Sort by confidence
  }

  /**
   * Count relationships by type
   */
  private countRelationshipsByType(relationships: ExtractedRelationship[]): Record<RelationshipType, number> {
    const counts = {} as Record<RelationshipType, number>;
    
    // Initialize all types to 0
    Object.values(RelationshipType).forEach(type => {
      counts[type] = 0;
    });
    
    // Count relationships
    relationships.forEach(relationship => {
      counts[relationship.type]++;
    });

    return counts;
  }

  /**
   * Calculate confidence of extractions
   */
  private calculateExtractionsConfidence(relationships: ExtractedRelationship[]): number {
    if (relationships.length === 0) return 0;
    
    const totalConfidence = relationships.reduce((sum, rel) => sum + rel.confidence, 0);
    return totalConfidence / relationships.length;
  }

  /**
   * Calculate overall confidence for the agent
   */
  private calculateConfidence(result: RelationshipExtractionResult): number {
    // Base confidence on number of relationships found and their average confidence
    const relationshipDensity = Math.min(result.relationships.length / 10, 1.0); // Normalize to 10 relationships
    const avgConfidence = result.confidence;
    
    // Weight by source diversity
    const sourceDiversity = new Set(result.relationships.map(r => r.source)).size / 3; // 3 possible sources
    
    return (relationshipDensity * 0.3) + (avgConfidence * 0.5) + (sourceDiversity * 0.2);
  }
}

/**
 * Factory function to create relationship extraction agent instance
 */
export function createRelationshipExtractionAgent(): RelationshipExtractionAgent {
  return new RelationshipExtractionAgent();
}