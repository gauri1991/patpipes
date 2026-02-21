/**
 * Preprocessor Agent - Classical NLP Processing
 * Uses deterministic text processing without LLM hallucination
 * Handles sentence splitting, clause extraction, and text cleaning
 */

import { BaseAgent } from '../BaseAgent';
import { 
  AgentMessage, 
  AgentStage, 
  PatentData, 
  PreprocessingResult 
} from '../types';

/**
 * Classical NLP text preprocessor for patent documents
 * Uses rule-based approaches for reliable, repeatable results
 */
export class PreprocessorAgent extends BaseAgent {
  
  constructor() {
    super(
      'PreprocessorAgent', 
      '1.0.0', 
      ['text_splitting', 'sentence_extraction', 'clause_parsing', 'text_cleaning']
    );
  }

  /**
   * Process patent text through classical NLP preprocessing
   */
  async process(input: any): Promise<AgentMessage> {
    if (!this.validateInput(input)) {
      throw new Error('Invalid input: Expected PatentData object');
    }

    const patent = input as PatentData;
    const { result, processingTime } = await this.measureProcessingTime(
      () => this.preprocessPatent(patent)
    );

    return this.createMessage(
      patent.id,
      AgentStage.PREPROCESSED,
      result,
      processingTime,
      1.0 // Classical NLP has 100% confidence (deterministic)
    );
  }

  /**
   * Validate input structure
   */
  validateInput(input: any): boolean {
    return !!(
      input &&
      input.id &&
      input.title &&
      input.abstract &&
      Array.isArray(input.claims)
    );
  }

  /**
   * Main preprocessing logic
   */
  private async preprocessPatent(patent: PatentData): Promise<PreprocessingResult> {
    this.log('info', `Starting preprocessing for patent ${patent.id}`);

    // Combine all text for processing
    const combinedText = this.combinePatentText(patent);
    
    // Split into sentences
    const sentences = this.extractSentences(combinedText);
    
    // Extract clauses (especially from claims)
    const clauses = this.extractClauses(patent.claims);
    
    // Clean text for better downstream processing
    const cleanedText = this.cleanPatentText(patent);
    
    // Generate metadata
    const metadata = this.generateMetadata(sentences, clauses, combinedText);

    const result: PreprocessingResult = {
      patentId: patent.id,
      sentences,
      clauses,
      cleanedText,
      metadata
    };

    this.log('info', `Preprocessing completed: ${sentences.length} sentences, ${clauses.length} clauses`);
    
    return result;
  }

  /**
   * Combine all patent text into a single string
   */
  private combinePatentText(patent: PatentData): string {
    const parts = [
      patent.title,
      patent.abstract,
      ...patent.claims,
      patent.description || ''
    ].filter(Boolean);
    
    return parts.join(' ').trim();
  }

  /**
   * Extract sentences using rule-based approach
   * More reliable than LLM for this deterministic task
   */
  private extractSentences(text: string): string[] {
    // Clean up text first
    let cleanText = text.replace(/\s+/g, ' ').trim();
    
    // Patent-specific sentence boundaries
    const sentencePatterns = [
      // Standard sentence endings
      /([.!?])\s+([A-Z])/g,
      // Patent claim numbering (e.g., "1. A system" or "claim 1:")
      /(\d+\.)\s+([A-Z])/g,
      // Figure references (e.g., "FIG. 1 shows")
      /(FIG\.\s*\d+[A-Za-z]*)\s+([A-Z])/g,
    ];

    // Apply sentence boundary detection
    sentencePatterns.forEach(pattern => {
      cleanText = cleanText.replace(pattern, '$1\n$2');
    });

    // Split on newlines and filter empty sentences
    const sentences = cleanText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 10) // Filter very short fragments
      .map(s => this.normalizeSentence(s));

    return sentences;
  }

  /**
   * Extract clauses specifically from patent claims
   * Claims have a specific structure that we can parse deterministically
   */
  private extractClauses(claims: string[]): string[] {
    const clauses: string[] = [];

    claims.forEach((claim, claimIndex) => {
      // Clean the claim text
      let cleanClaim = claim.replace(/^\d+\.\s*/, '').trim(); // Remove claim numbering
      
      // Split on common clause separators in patent claims
      const clauseSeparators = [
        ';', // Most common clause separator
        ', wherein', // Wherein clauses
        ', further comprising', // Additional elements
        ', characterized in that', // European style
        ', said', // Reference to previous elements
      ];

      let currentText = cleanClaim;
      
      // Split recursively on separators
      clauseSeparators.forEach(separator => {
        const parts = currentText.split(separator);
        if (parts.length > 1) {
          // First part
          clauses.push(this.normalizeClause(parts[0]));
          
          // Subsequent parts (add separator context back)
          for (let i = 1; i < parts.length; i++) {
            const clauseWithContext = separator.trim() + ' ' + parts[i].trim();
            clauses.push(this.normalizeClause(clauseWithContext));
          }
          currentText = ''; // Processed
        }
      });
      
      // If no separators found, treat entire claim as one clause
      if (currentText.trim()) {
        clauses.push(this.normalizeClause(currentText));
      }
    });

    return clauses.filter(clause => clause.length > 5); // Filter very short clauses
  }

  /**
   * Clean patent text for better downstream processing
   */
  private cleanPatentText(patent: PatentData): {
    title: string;
    abstract: string;
    claims: string[];
  } {
    return {
      title: this.normalizeText(patent.title),
      abstract: this.normalizeText(patent.abstract),
      claims: patent.claims.map(claim => this.normalizeText(claim))
    };
  }

  /**
   * Normalize sentence structure
   */
  private normalizeSentence(sentence: string): string {
    return sentence
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/([.!?])+/g, '$1') // Remove duplicate punctuation
      .trim();
  }

  /**
   * Normalize clause structure
   */
  private normalizeClause(clause: string): string {
    return clause
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/^[;,]\s*/, '') // Remove leading separators
      .replace(/[;,]\s*$/, '') // Remove trailing separators
      .trim();
  }

  /**
   * General text normalization
   */
  private normalizeText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[\r\n]+/g, ' ') // Replace line breaks with spaces
      .replace(/[""]/g, '"') // Normalize quotes
      .replace(/['']/g, "'") // Normalize apostrophes
      .trim();
  }

  /**
   * Generate processing metadata
   */
  private generateMetadata(
    sentences: string[], 
    clauses: string[], 
    combinedText: string
  ): {
    sentenceCount: number;
    clauseCount: number;
    totalWords: number;
  } {
    // Count words (simple whitespace split)
    const words = combinedText.split(/\s+/).filter(word => word.length > 0);
    
    return {
      sentenceCount: sentences.length,
      clauseCount: clauses.length,
      totalWords: words.length
    };
  }

  /**
   * Utility method to check if text looks like a patent claim
   */
  private isPatentClaim(text: string): boolean {
    // Check for patent claim indicators
    const claimIndicators = [
      /^\d+\./,  // Starts with number and period
      /claim\s+\d+/i,  // Contains "claim X"
      /comprising/i,   // Contains "comprising"
      /wherein/i,      // Contains "wherein"
      /characterized\s+in\s+that/i  // European style
    ];

    return claimIndicators.some(pattern => pattern.test(text));
  }

  /**
   * Extract technical terms using simple heuristics
   * This is a basic version - more sophisticated extraction in EntityExtractionAgent
   */
  private extractBasicTechnicalTerms(text: string): string[] {
    // Look for capitalized technical terms and compound words
    const technicalPatterns = [
      /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g, // Capitalized phrases
      /\b\w+[-]\w+\b/g, // Hyphenated compounds
      /\b\w+\s+(?:device|system|method|apparatus|circuit|sensor|processor)\b/gi, // Technical compounds
    ];

    const terms: string[] = [];
    technicalPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      terms.push(...matches);
    });

    // Remove duplicates and filter common words
    const uniqueTerms = [...new Set(terms)]
      .filter(term => term.length > 2)
      .filter(term => !this.isCommonWord(term.toLowerCase()));

    return uniqueTerms;
  }

  /**
   * Check if word is common (basic stopword filtering)
   */
  private isCommonWord(word: string): boolean {
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
    ]);
    
    return commonWords.has(word);
  }
}

/**
 * Factory function to create preprocessor agent instance
 */
export function createPreprocessorAgent(): PreprocessorAgent {
  return new PreprocessorAgent();
}