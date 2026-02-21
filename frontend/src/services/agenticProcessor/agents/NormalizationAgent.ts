/**
 * Normalization Agent - Embeddings + Ontology Approach
 * Normalizes entities and relationships using semantic similarity
 * Handles synonyms, hierarchical relationships, and creates consistent terminology
 */

import { BaseAgent } from '../BaseAgent';
import { 
  AgentMessage, 
  AgentStage, 
  RelationshipExtractionResult,
  ExtractedEntity,
  ExtractedRelationship,
  NormalizedTerm,
  NormalizationResult,
  EntityType,
  RelationshipType
} from '../types';

/**
 * Patent Technology Ontology for hierarchical normalization
 */
class PatentTechnologyOntology {
  private entityHierarchy = new Map<string, string[]>([
    // Electronic Components Hierarchy
    ['electronic_component', ['processor', 'controller', 'microprocessor', 'cpu', 'microcontroller', 'chip']],
    ['sensor', ['detector', 'photodetector', 'photodiode', 'photosensor', 'transducer', 'accelerometer', 'gyroscope']],
    ['memory', ['storage', 'ram', 'rom', 'flash_memory', 'hard_disk', 'ssd', 'database']],
    ['display', ['screen', 'monitor', 'lcd', 'led_display', 'oled', 'touchscreen']],
    ['communication', ['antenna', 'transceiver', 'transmitter', 'receiver', 'modem', 'router']],
    
    // Mechanical Components Hierarchy  
    ['mechanical_component', ['actuator', 'motor', 'servo', 'stepper_motor', 'pump', 'valve', 'gear']],
    ['structural_element', ['frame', 'housing', 'chassis', 'substrate', 'mount', 'bracket']],
    ['connector', ['cable', 'wire', 'harness', 'plug', 'socket', 'terminal']],
    
    // Materials Hierarchy
    ['semiconductor', ['silicon', 'germanium', 'gallium_arsenide', 'indium_gallium_arsenide']],
    ['metal', ['aluminum', 'copper', 'gold', 'silver', 'titanium', 'steel', 'iron']],
    ['polymer', ['plastic', 'rubber', 'polyethylene', 'polystyrene', 'nylon']],
    ['ceramic', ['alumina', 'silicon_carbide', 'silicon_nitride', 'zirconia']],
    
    // Processes Hierarchy
    ['manufacturing_process', ['etching', 'deposition', 'lithography', 'annealing', 'coating']],
    ['signal_processing', ['filtering', 'amplification', 'modulation', 'demodulation', 'encoding', 'decoding']],
    ['data_processing', ['analysis', 'computation', 'calculation', 'transformation', 'conversion']],
    
    // Applications Hierarchy
    ['automotive', ['autonomous_vehicles', 'self_driving_cars', 'adas', 'vehicle_navigation']],
    ['medical', ['medical_imaging', 'diagnostics', 'therapeutics', 'biomedical_devices']],
    ['communications', ['wireless_communication', 'telecommunications', 'networking', '5g', 'wifi']],
    ['computing', ['artificial_intelligence', 'machine_learning', 'data_processing', 'cloud_computing']]
  ]);

  private synonymGroups = new Map<string, string[]>([
    // Component synonyms
    ['processor', ['cpu', 'microprocessor', 'processing_unit', 'central_processing_unit']],
    ['sensor', ['detector', 'sensing_element', 'transducer']],
    ['display', ['screen', 'monitor', 'visual_display']],
    ['memory', ['storage', 'data_storage', 'memory_device']],
    ['controller', ['control_unit', 'microcontroller', 'control_system']],
    
    // Process synonyms  
    ['analysis', ['analyzing', 'examination', 'evaluation', 'assessment']],
    ['processing', ['computation', 'calculating', 'computing']],
    ['transmission', ['transmitting', 'sending', 'broadcasting', 'communication']],
    ['detection', ['sensing', 'identifying', 'recognizing', 'monitoring']],
    ['control', ['controlling', 'regulation', 'management', 'governance']],
    
    // Material synonyms
    ['silicon', ['si', 'silicon_wafer', 'silicon_substrate']],
    ['metal', ['metallic', 'conductor', 'conductive_material']],
    ['plastic', ['polymer', 'synthetic_material', 'thermoplastic']],
    
    // Application synonyms
    ['automotive', ['vehicle', 'car', 'automobile', 'transportation']],
    ['medical', ['healthcare', 'clinical', 'biomedical', 'therapeutic']],
    ['wireless', ['radio', 'rf', 'radio_frequency', 'cellular']]
  ]);

  getCanonicalTerm(term: string): string {
    const normalizedTerm = term.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    
    // Check if term is already canonical (appears as key in synonym groups)
    if (this.synonymGroups.has(normalizedTerm)) {
      return normalizedTerm;
    }
    
    // Find the canonical term for this synonym
    for (const [canonical, synonyms] of this.synonymGroups) {
      if (synonyms.includes(normalizedTerm)) {
        return canonical;
      }
    }
    
    return normalizedTerm; // Return as-is if not found
  }

  getSynonyms(term: string): string[] {
    const canonical = this.getCanonicalTerm(term);
    return this.synonymGroups.get(canonical) || [];
  }

  getHierarchicalParent(term: string): string | null {
    const normalizedTerm = term.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    
    for (const [parent, children] of this.entityHierarchy) {
      if (children.includes(normalizedTerm)) {
        return parent;
      }
    }
    
    return null;
  }

  getAllHierarchy(): Map<string, string[]> {
    return this.entityHierarchy;
  }
}

/**
 * Simulated embedding similarity calculator
 * In production, this would use actual embeddings like PatentBERT or SciBERT
 */
class EmbeddingSimilarityCalculator {
  private embeddingCache = new Map<string, number[]>();
  
  // Simulate embeddings with characteristic vectors for different domains
  private domainVectors = new Map<string, number[]>([
    // Electronic domain characteristics
    ['processor', [0.8, 0.9, 0.1, 0.2, 0.7, 0.3]],
    ['cpu', [0.82, 0.88, 0.12, 0.18, 0.72, 0.28]],
    ['sensor', [0.6, 0.7, 0.3, 0.4, 0.8, 0.5]],
    ['detector', [0.62, 0.68, 0.32, 0.38, 0.78, 0.52]],
    
    // Mechanical domain characteristics  
    ['motor', [0.3, 0.2, 0.8, 0.9, 0.4, 0.6]],
    ['actuator', [0.32, 0.22, 0.78, 0.88, 0.42, 0.58]],
    ['pump', [0.25, 0.15, 0.85, 0.95, 0.35, 0.65]],
    
    // Material domain characteristics
    ['silicon', [0.1, 0.3, 0.2, 0.1, 0.9, 0.8]],
    ['metal', [0.15, 0.25, 0.25, 0.15, 0.85, 0.75]],
    ['polymer', [0.05, 0.35, 0.15, 0.05, 0.95, 0.85]],
    
    // Process domain characteristics
    ['processing', [0.7, 0.8, 0.4, 0.3, 0.6, 0.2]],
    ['analysis', [0.75, 0.78, 0.42, 0.28, 0.58, 0.22]],
    ['control', [0.65, 0.75, 0.45, 0.35, 0.65, 0.25]]
  ]);

  calculateSimilarity(term1: string, term2: string): number {
    if (term1 === term2) return 1.0;
    
    const vec1 = this.getEmbedding(term1);
    const vec2 = this.getEmbedding(term2);
    
    // Calculate cosine similarity
    const dotProduct = vec1.reduce((sum, val, i) => sum + (val * vec2[i]), 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + (val * val), 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + (val * val), 0));
    
    return dotProduct / (magnitude1 * magnitude2);
  }

  private getEmbedding(term: string): number[] {
    const normalizedTerm = term.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    
    if (this.embeddingCache.has(normalizedTerm)) {
      return this.embeddingCache.get(normalizedTerm)!;
    }

    // Check if we have a domain vector for this term
    if (this.domainVectors.has(normalizedTerm)) {
      const embedding = this.domainVectors.get(normalizedTerm)!;
      this.embeddingCache.set(normalizedTerm, embedding);
      return embedding;
    }

    // Generate synthetic embedding based on term characteristics
    const embedding = this.generateSyntheticEmbedding(normalizedTerm);
    this.embeddingCache.set(normalizedTerm, embedding);
    
    return embedding;
  }

  private generateSyntheticEmbedding(term: string): number[] {
    // Generate deterministic but varied embeddings based on term characteristics
    const seed = this.stringToSeed(term);
    const random = this.seededRandom(seed);
    
    const embedding: number[] = [];
    for (let i = 0; i < 6; i++) {
      embedding.push(random());
    }
    
    return embedding;
  }

  private stringToSeed(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  private seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
  }
}

/**
 * Normalization Agent using hybrid embeddings + ontology approach
 */
export class NormalizationAgent extends BaseAgent {
  private ontology: PatentTechnologyOntology;
  private embeddingCalculator: EmbeddingSimilarityCalculator;
  private similarityThreshold = 0.85;
  
  constructor() {
    super(
      'NormalizationAgent', 
      '1.0.0', 
      ['normalization', 'synonym_resolution', 'embedding_similarity', 'ontology_mapping']
    );
    this.ontology = new PatentTechnologyOntology();
    this.embeddingCalculator = new EmbeddingSimilarityCalculator();
  }

  /**
   * Process relationship extraction results to normalize terms
   */
  async process(input: any): Promise<AgentMessage> {
    if (!this.validateInput(input)) {
      throw new Error('Invalid input: Expected RelationshipExtractionResult object');
    }

    const relationshipResults = input as RelationshipExtractionResult;
    const { result, processingTime } = await this.measureProcessingTime(
      () => this.normalizeTerms(relationshipResults)
    );

    // Calculate confidence based on normalization quality
    const confidence = this.calculateConfidence(result);

    return this.createMessage(
      relationshipResults.patentId,
      AgentStage.NORMALIZED,
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
      input.relationships &&
      Array.isArray(input.relationships) &&
      input.relationshipCounts
    );
  }

  /**
   * Main normalization logic
   */
  private async normalizeTerms(relationshipResults: RelationshipExtractionResult): Promise<NormalizationResult> {
    this.log('info', `Starting normalization for patent ${relationshipResults.patentId}`);

    // Extract all unique entity terms from relationships
    const allEntityTerms = this.extractEntityTerms(relationshipResults.relationships);
    
    // Extract all relationship predicates
    const allPredicateTerms = this.extractPredicateTerms(relationshipResults.relationships);

    // Step 1: Ontology-based normalization (highest confidence)
    const ontologyNormalizedEntities = this.normalizeWithOntology(allEntityTerms);
    const ontologyNormalizedPredicates = this.normalizeWithOntology(allPredicateTerms);
    
    // Step 2: Embedding-based similarity matching (medium confidence)
    const embeddingNormalizedEntities = await this.normalizeWithEmbeddings(allEntityTerms, ontologyNormalizedEntities);
    const embeddingNormalizedPredicates = await this.normalizeWithEmbeddings(allPredicateTerms, ontologyNormalizedPredicates);
    
    // Step 3: LLM tiebreaker for ambiguous cases (lower confidence)
    const llmNormalizedEntities = await this.llmTiebreaker(allEntityTerms, embeddingNormalizedEntities);
    const llmNormalizedPredicates = await this.llmTiebreaker(allPredicateTerms, embeddingNormalizedPredicates);

    // Combine all normalization results
    const normalizedEntities = this.combineNormalizations(
      ontologyNormalizedEntities, 
      embeddingNormalizedEntities, 
      llmNormalizedEntities
    );
    
    const normalizedRelationships = this.combineNormalizations(
      ontologyNormalizedPredicates,
      embeddingNormalizedPredicates, 
      llmNormalizedPredicates
    );

    // Generate statistics
    const processingStats = {
      ontologyMatches: ontologyNormalizedEntities.length + ontologyNormalizedPredicates.length,
      embeddingMatches: embeddingNormalizedEntities.length + embeddingNormalizedPredicates.length,
      llmTiebreaks: llmNormalizedEntities.length + llmNormalizedPredicates.length,
      totalTermsProcessed: allEntityTerms.length + allPredicateTerms.length,
      normalizedTerms: normalizedEntities.length + normalizedRelationships.length
    };

    const result: NormalizationResult = {
      patentId: relationshipResults.patentId,
      normalizedEntities,
      normalizedRelationships,
      ontologyMatches: processingStats.ontologyMatches,
      embeddingMatches: processingStats.embeddingMatches,
      llmTiebreaks: processingStats.llmTiebreaks
    };

    this.log('info', `Normalization completed: ${normalizedEntities.length} entities, ${normalizedRelationships.length} relationships normalized`);
    
    return result;
  }

  /**
   * Extract unique entity terms from relationships
   */
  private extractEntityTerms(relationships: ExtractedRelationship[]): string[] {
    const terms = new Set<string>();
    
    relationships.forEach(rel => {
      terms.add(rel.subject.text);
      terms.add(rel.object.text);
    });
    
    return Array.from(terms);
  }

  /**
   * Extract unique predicate terms from relationships
   */
  private extractPredicateTerms(relationships: ExtractedRelationship[]): string[] {
    const terms = new Set<string>();
    
    relationships.forEach(rel => {
      terms.add(rel.predicate);
    });
    
    return Array.from(terms);
  }

  /**
   * Ontology-based normalization (100% confidence when matched)
   */
  private normalizeWithOntology(terms: string[]): NormalizedTerm[] {
    const normalized: NormalizedTerm[] = [];
    
    terms.forEach(term => {
      const canonicalTerm = this.ontology.getCanonicalTerm(term);
      const synonyms = this.ontology.getSynonyms(term);
      const hierarchicalParent = this.ontology.getHierarchicalParent(term);
      
      if (canonicalTerm !== term.toLowerCase().replace(/[^a-z0-9_]/g, '_') || synonyms.length > 0) {
        normalized.push({
          originalTerm: term,
          normalizedTerm: canonicalTerm,
          confidence: 1.0, // Ontology matches are 100% confident
          source: 'ontology',
          synonyms,
          hierarchicalParent: hierarchicalParent ?? undefined
        });
      }
    });
    
    return normalized;
  }

  /**
   * Embedding-based similarity normalization
   */
  private async normalizeWithEmbeddings(terms: string[], alreadyNormalized: NormalizedTerm[]): Promise<NormalizedTerm[]> {
    const normalized: NormalizedTerm[] = [];
    const alreadyProcessed = new Set(alreadyNormalized.map(n => n.originalTerm));
    
    // Create similarity groups
    const similarityGroups = new Map<string, string[]>();
    
    for (let i = 0; i < terms.length; i++) {
      if (alreadyProcessed.has(terms[i])) continue;
      
      const term1 = terms[i];
      const similar: string[] = [term1];
      
      for (let j = i + 1; j < terms.length; j++) {
        if (alreadyProcessed.has(terms[j])) continue;
        
        const term2 = terms[j];
        const similarity = this.embeddingCalculator.calculateSimilarity(term1, term2);
        
        if (similarity >= this.similarityThreshold) {
          similar.push(term2);
          alreadyProcessed.add(term2);
        }
      }
      
      if (similar.length > 1) {
        // Choose the most "canonical" term as the normalized form (shortest, most common)
        const canonicalTerm = similar.sort((a, b) => a.length - b.length)[0];
        similarityGroups.set(canonicalTerm, similar);
      }
    }

    // Create normalized terms from similarity groups
    similarityGroups.forEach((similar, canonical) => {
      similar.forEach(term => {
        if (term !== canonical) {
          normalized.push({
            originalTerm: term,
            normalizedTerm: canonical,
            confidence: 0.8, // Embedding similarity has good confidence
            source: 'embeddings',
            synonyms: similar.filter(s => s !== term)
          });
        }
      });
    });
    
    return normalized;
  }

  /**
   * LLM tiebreaker for ambiguous normalizations
   */
  private async llmTiebreaker(terms: string[], alreadyNormalized: NormalizedTerm[]): Promise<NormalizedTerm[]> {
    const normalized: NormalizedTerm[] = [];
    const alreadyProcessed = new Set(alreadyNormalized.map(n => n.originalTerm));
    
    // Simulate LLM tiebreaking with pattern-based rules for ambiguous cases
    const ambiguousPatterns = [
      // Technical abbreviations
      { pattern: /^([A-Z]{2,})$/, normalize: (match: string) => match.toLowerCase() + '_system' },
      
      // Compound technical terms
      { pattern: /^(\w+)-(\w+)$/, normalize: (match: string) => match.replace('-', '_') },
      
      // Process variations (-ing, -ed, -tion endings)
      { pattern: /^(\w+)(ing|ed|tion|sion)$/, normalize: (match: string, stem: string) => stem },
      
      // Plural normalization
      { pattern: /^(\w+)s$/, normalize: (match: string, stem: string) => stem },
    ];

    terms.forEach(term => {
      if (alreadyProcessed.has(term)) return;
      
      for (const { pattern, normalize } of ambiguousPatterns) {
        const match = term.match(pattern);
        if (match) {
          const normalizedTerm = normalize(match[0], match[1]);
          if (normalizedTerm !== term) {
            normalized.push({
              originalTerm: term,
              normalizedTerm,
              confidence: 0.6, // LLM tiebreaker has moderate confidence
              source: 'llm_tiebreaker',
              synonyms: [term, normalizedTerm]
            });
          }
          break;
        }
      }
    });
    
    return normalized;
  }

  /**
   * Combine normalizations from all sources with preference ordering
   */
  private combineNormalizations(...normalizationSets: NormalizedTerm[][]): NormalizedTerm[] {
    const termMap = new Map<string, NormalizedTerm>();
    
    // Process in order of preference: ontology > embeddings > LLM
    normalizationSets.forEach(normalizations => {
      normalizations.forEach(norm => {
        const existing = termMap.get(norm.originalTerm);
        if (!existing || norm.confidence > existing.confidence) {
          termMap.set(norm.originalTerm, norm);
        }
      });
    });
    
    return Array.from(termMap.values())
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate overall confidence for the agent
   */
  private calculateConfidence(result: NormalizationResult): number {
    const totalTerms = result.normalizedEntities.length + result.normalizedRelationships.length;
    if (totalTerms === 0) return 1.0; // No normalization needed is perfect
    
    // Weight by normalization method confidence
    const ontologyWeight = result.ontologyMatches / totalTerms * 1.0;
    const embeddingWeight = result.embeddingMatches / totalTerms * 0.8;
    const llmWeight = result.llmTiebreaks / totalTerms * 0.6;
    
    return ontologyWeight + embeddingWeight + llmWeight;
  }
}

/**
 * Factory function to create normalization agent instance
 */
export function createNormalizationAgent(): NormalizationAgent {
  return new NormalizationAgent();
}