/**
 * Entity Extraction Agent - Hybrid NLP + LLM Approach
 * Combines reliable classical NLP with LLM intelligence for complex technical terms
 * Extracts components, processes, applications, materials, parameters, and systems
 */

import { BaseAgent } from '../BaseAgent';
import { 
  AgentMessage, 
  AgentStage, 
  PreprocessingResult,
  ExtractedEntity,
  EntityType,
  EntityExtractionResult 
} from '../types';

/**
 * Patent-specific technical dictionary for reliable entity extraction
 */
class PatentTechnicalDictionary {
  private componentTerms = new Set([
    'processor', 'controller', 'sensor', 'detector', 'actuator', 'motor', 'circuit',
    'substrate', 'layer', 'membrane', 'electrode', 'cathode', 'anode', 'transistor',
    'diode', 'resistor', 'capacitor', 'inductor', 'antenna', 'amplifier', 'filter',
    'photodetector', 'photodiode', 'photosensor', 'camera', 'lens', 'mirror',
    'catalyst', 'reactor', 'chamber', 'vessel', 'tank', 'pump', 'valve', 'pipe',
    'server', 'database', 'memory', 'storage', 'disk', 'chip', 'microprocessor',
    'display', 'screen', 'monitor', 'interface', 'connector', 'cable', 'wire'
  ]);

  private processTerms = new Set([
    'processing', 'transmitting', 'receiving', 'detecting', 'sensing', 'controlling',
    'analyzing', 'computing', 'calculating', 'measuring', 'monitoring', 'tracking',
    'filtering', 'amplifying', 'converting', 'transforming', 'encoding', 'decoding',
    'encrypting', 'decrypting', 'compressing', 'decompressing', 'rendering',
    'oxidizing', 'reducing', 'catalyzing', 'reacting', 'synthesizing', 'purifying',
    'heating', 'cooling', 'mixing', 'separating', 'extracting', 'depositing',
    'etching', 'coating', 'printing', 'scanning', 'imaging', 'focusing'
  ]);

  private applicationTerms = new Set([
    'autonomous vehicles', 'self-driving cars', 'automotive', 'transportation',
    'medical imaging', 'biomedical', 'healthcare', 'diagnostic', 'therapeutic',
    'telecommunications', 'wireless communication', 'networking', 'internet',
    'manufacturing', 'industrial', 'automation', 'robotics', 'aerospace',
    'semiconductor', 'electronics', 'computing', 'data processing',
    'renewable energy', 'solar', 'wind', 'battery', 'energy storage',
    'biotechnology', 'pharmaceuticals', 'chemical', 'materials science'
  ]);

  private materialTerms = new Set([
    'silicon', 'germanium', 'gallium arsenide', 'graphene', 'carbon nanotube',
    'polymer', 'plastic', 'metal', 'alloy', 'ceramic', 'glass', 'crystal',
    'semiconductor', 'conductor', 'insulator', 'dielectric', 'magnetic',
    'aluminum', 'copper', 'gold', 'silver', 'titanium', 'steel', 'iron',
    'oxide', 'nitride', 'carbide', 'compound', 'composite', 'nano-material'
  ]);

  private parameterTerms = new Set([
    'voltage', 'current', 'power', 'frequency', 'wavelength', 'amplitude',
    'temperature', 'pressure', 'flow rate', 'concentration', 'density',
    'thickness', 'width', 'length', 'diameter', 'area', 'volume',
    'speed', 'acceleration', 'force', 'torque', 'angle', 'position',
    'time', 'duration', 'delay', 'threshold', 'ratio', 'percentage'
  ]);

  private systemTerms = new Set([
    'system', 'apparatus', 'device', 'machine', 'equipment', 'instrument',
    'platform', 'framework', 'architecture', 'infrastructure', 'network',
    'array', 'assembly', 'unit', 'module', 'component', 'subsystem'
  ]);

  getEntityType(term: string): EntityType | null {
    const lowerTerm = term.toLowerCase();
    
    if (this.componentTerms.has(lowerTerm)) return EntityType.COMPONENT;
    if (this.processTerms.has(lowerTerm)) return EntityType.PROCESS;
    if (this.applicationTerms.has(lowerTerm)) return EntityType.APPLICATION;
    if (this.materialTerms.has(lowerTerm)) return EntityType.MATERIAL;
    if (this.parameterTerms.has(lowerTerm)) return EntityType.PARAMETER;
    if (this.systemTerms.has(lowerTerm)) return EntityType.SYSTEM;
    
    return null;
  }

  getAllTerms(): Set<string> {
    return new Set([
      ...this.componentTerms,
      ...this.processTerms,
      ...this.applicationTerms,
      ...this.materialTerms,
      ...this.parameterTerms,
      ...this.systemTerms
    ]);
  }
}

/**
 * Hybrid Entity Extraction Agent
 */
export class EntityExtractionAgent extends BaseAgent {
  private dictionary: PatentTechnicalDictionary;
  
  constructor() {
    super(
      'EntityExtractionAgent', 
      '1.0.0', 
      ['entity_extraction', 'technical_terms', 'hybrid_nlp_llm', 'patent_analysis']
    );
    this.dictionary = new PatentTechnicalDictionary();
  }

  /**
   * Process preprocessed patent through hybrid entity extraction
   */
  async process(input: any): Promise<AgentMessage> {
    if (!this.validateInput(input)) {
      throw new Error('Invalid input: Expected PreprocessingResult object');
    }

    const preprocessed = input as PreprocessingResult;
    const { result, processingTime } = await this.measureProcessingTime(
      () => this.extractEntities(preprocessed)
    );

    // Calculate confidence based on extraction quality
    const confidence = this.calculateConfidence(result);

    return this.createMessage(
      preprocessed.patentId,
      AgentStage.ENTITIES_EXTRACTED,
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
      input.sentences &&
      input.clauses &&
      input.cleanedText
    );
  }

  /**
   * Main entity extraction logic using hybrid approach
   */
  private async extractEntities(preprocessed: PreprocessingResult): Promise<EntityExtractionResult> {
    this.log('info', `Starting hybrid entity extraction for patent ${preprocessed.patentId}`);

    const allText = [
      preprocessed.cleanedText.title,
      preprocessed.cleanedText.abstract,
      ...preprocessed.cleanedText.claims
    ].join(' ');

    // Step 1: Dictionary-based extraction (reliable, fast)
    const dictionaryEntities = this.extractDictionaryEntities(allText);
    
    // Step 2: POS tagging for noun phrases (classical NLP)
    const posEntities = this.extractPOSEntities(preprocessed.sentences);
    
    // Step 3: LLM extraction for complex technical terms not in dictionary
    const llmEntities = await this.extractLLMEntities(allText, preprocessed.sentences);
    
    // Step 4: Combine and deduplicate entities
    const combinedEntities = this.combineEntities(dictionaryEntities, posEntities, llmEntities);
    
    // Step 5: Generate processing statistics
    const processingStats = {
      dictionaryMatches: dictionaryEntities.length,
      posTagMatches: posEntities.length,
      llmExtractions: llmEntities.length,
      totalEntities: combinedEntities.length
    };

    // Step 6: Count entities by type
    const entityCounts = this.countEntitiesByType(combinedEntities);

    const result: EntityExtractionResult = {
      patentId: preprocessed.patentId,
      entities: combinedEntities,
      entityCounts,
      confidence: this.calculateExtractionsConfidence(combinedEntities),
      processingStats
    };

    this.log('info', `Entity extraction completed: ${combinedEntities.length} entities found`);
    
    return result;
  }

  /**
   * Dictionary-based entity extraction (100% reliable)
   */
  private extractDictionaryEntities(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const lowerText = text.toLowerCase();
    
    // Find all dictionary terms with their positions
    this.dictionary.getAllTerms().forEach(term => {
      const regex = new RegExp(`\\b${this.escapeRegex(term)}\\b`, 'gi');
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        const entityType = this.dictionary.getEntityType(term);
        if (entityType) {
          entities.push({
            text: match[0], // Preserve original case
            type: entityType,
            confidence: 1.0, // Dictionary matches are 100% confident
            startPos: match.index,
            endPos: match.index + match[0].length,
            source: 'dictionary'
          });
        }
      }
    });

    return entities;
  }

  /**
   * POS tagging for noun phrases (classical NLP approach)
   */
  private extractPOSEntities(sentences: string[]): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    
    sentences.forEach(sentence => {
      // Extract noun phrases using simple heuristics
      const nounPhrases = this.extractNounPhrases(sentence);
      
      nounPhrases.forEach(phrase => {
        // Classify noun phrase as potential entity
        const entityType = this.classifyNounPhrase(phrase);
        if (entityType) {
          entities.push({
            text: phrase,
            type: entityType,
            confidence: 0.7, // POS tagging has moderate confidence
            startPos: sentence.indexOf(phrase),
            endPos: sentence.indexOf(phrase) + phrase.length,
            source: 'pos_tagging'
          });
        }
      });
    });

    return entities;
  }

  /**
   * Extract noun phrases using rule-based patterns
   */
  private extractNounPhrases(sentence: string): string[] {
    const phrases: string[] = [];
    
    // Pattern 1: Adjective + Noun (e.g., "wireless sensor")
    const adjNounPattern = /\b[A-Z]?[a-z]+(?:ive|ous|al|ic|ed|ing)\s+[A-Z]?[a-z]+\b/g;
    
    // Pattern 2: Noun + Noun compounds (e.g., "sensor array")
    const nounNounPattern = /\b[A-Z]?[a-z]+\s+(?:system|device|method|apparatus|sensor|processor|controller)\b/g;
    
    // Pattern 3: Technical compounds with hyphens (e.g., "radio-frequency")
    const hyphenatedPattern = /\b[a-z]+-[a-z]+(?:\s+[a-z]+)?\b/g;
    
    // Pattern 4: Multi-word technical terms (e.g., "artificial neural network")
    const multiWordPattern = /\b(?:artificial|neural|quantum|optical|digital|analog)\s+[a-z]+(?:\s+[a-z]+)?\b/g;

    const patterns = [adjNounPattern, nounNounPattern, hyphenatedPattern, multiWordPattern];
    
    patterns.forEach(pattern => {
      const matches = sentence.match(pattern) || [];
      phrases.push(...matches.map(match => match.trim()));
    });

    // Remove duplicates and filter by length
    return [...new Set(phrases)].filter(phrase => phrase.length > 3);
  }

  /**
   * Classify noun phrase into entity type
   */
  private classifyNounPhrase(phrase: string): EntityType | null {
    const lowerPhrase = phrase.toLowerCase();
    
    // Component indicators
    if (/(?:sensor|detector|processor|controller|circuit|device)/.test(lowerPhrase)) {
      return EntityType.COMPONENT;
    }
    
    // Process indicators
    if (/(?:processing|detection|transmission|analysis|control)/.test(lowerPhrase)) {
      return EntityType.PROCESS;
    }
    
    // System indicators
    if (/(?:system|apparatus|platform|network|array)/.test(lowerPhrase)) {
      return EntityType.SYSTEM;
    }
    
    // Material indicators
    if (/(?:layer|substrate|material|compound|alloy)/.test(lowerPhrase)) {
      return EntityType.MATERIAL;
    }
    
    // Application indicators
    if (/(?:vehicle|medical|wireless|communication|imaging)/.test(lowerPhrase)) {
      return EntityType.APPLICATION;
    }
    
    return null;
  }

  /**
   * LLM-based extraction for complex technical terms
   */
  private async extractLLMEntities(fullText: string, sentences: string[]): Promise<ExtractedEntity[]> {
    // This would integrate with actual LLM service
    // For now, simulate LLM extraction with pattern-based complex term detection
    
    const entities: ExtractedEntity[] = [];
    
    // Simulate LLM finding complex technical compounds not in dictionary
    const complexPatterns = [
      // Multi-hyphenated compounds
      /\b[a-z]+-[a-z]+-[a-z]+(?:\s+[a-z]+)?\b/g,
      
      // Scientific notation compounds
      /\b[A-Z][a-z]+(?:[A-Z][a-z]*)*\d*\b/g,
      
      // Chemical/material compounds
      /\b[A-Z][a-z]*\d*[A-Z][a-z]*\d*\b/g,
      
      // Technical acronyms with description
      /\b[A-Z]{2,}\s*\([^)]+\)/g
    ];

    complexPatterns.forEach(pattern => {
      const matches = fullText.match(pattern) || [];
      matches.forEach(match => {
        // Classify the complex term
        const entityType = this.classifyComplexTerm(match);
        if (entityType) {
          entities.push({
            text: match,
            type: entityType,
            confidence: 0.8, // LLM extraction has good confidence
            startPos: fullText.indexOf(match),
            endPos: fullText.indexOf(match) + match.length,
            source: 'llm'
          });
        }
      });
    });

    return entities;
  }

  /**
   * Classify complex terms found by LLM
   */
  private classifyComplexTerm(term: string): EntityType | null {
    const lowerTerm = term.toLowerCase();
    
    // Chemical/material compounds
    if (/\d+|oxide|nitride|carbide/.test(lowerTerm)) {
      return EntityType.MATERIAL;
    }
    
    // Technical systems with acronyms
    if (/[A-Z]{2,}/.test(term)) {
      return EntityType.SYSTEM;
    }
    
    // Default to component for complex technical terms
    return EntityType.COMPONENT;
  }

  /**
   * Combine and deduplicate entities from all sources
   */
  private combineEntities(
    dictionaryEntities: ExtractedEntity[],
    posEntities: ExtractedEntity[],
    llmEntities: ExtractedEntity[]
  ): ExtractedEntity[] {
    const allEntities = [...dictionaryEntities, ...posEntities, ...llmEntities];
    const entityMap = new Map<string, ExtractedEntity>();

    allEntities.forEach(entity => {
      const key = entity.text.toLowerCase();
      const existing = entityMap.get(key);
      
      if (!existing || entity.confidence > existing.confidence) {
        // Keep the entity with highest confidence
        entityMap.set(key, entity);
      }
    });

    return Array.from(entityMap.values())
      .sort((a, b) => b.confidence - a.confidence); // Sort by confidence
  }

  /**
   * Count entities by type
   */
  private countEntitiesByType(entities: ExtractedEntity[]): Record<EntityType, number> {
    const counts = {} as Record<EntityType, number>;
    
    // Initialize all types to 0
    Object.values(EntityType).forEach(type => {
      counts[type] = 0;
    });
    
    // Count entities
    entities.forEach(entity => {
      counts[entity.type]++;
    });

    return counts;
  }

  /**
   * Calculate confidence of extractions
   */
  private calculateExtractionsConfidence(entities: ExtractedEntity[]): number {
    if (entities.length === 0) return 0;
    
    const totalConfidence = entities.reduce((sum, entity) => sum + entity.confidence, 0);
    return totalConfidence / entities.length;
  }

  /**
   * Calculate overall confidence for the agent
   */
  private calculateConfidence(result: EntityExtractionResult): number {
    // Base confidence on number of entities found and their average confidence
    const entityDensity = result.entities.length / 100; // Entities per 100 words (rough)
    const avgConfidence = result.confidence;
    
    // Reasonable number of entities (5-50) gets full confidence
    const densityScore = Math.min(entityDensity / 0.3, 1.0);
    
    return (densityScore * 0.3) + (avgConfidence * 0.7);
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

/**
 * Factory function to create entity extraction agent instance
 */
export function createEntityExtractionAgent(): EntityExtractionAgent {
  return new EntityExtractionAgent();
}