/**
 * Patent Proofreading Analyzer
 * Advanced patent document analysis for prosecution quality
 */

export interface ProofreadingIssue {
  type: 'antecedent' | 'indefinite' | 'consistency' | 'support' | 'format' | 'suggestion';
  severity: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  position?: { start: number; end: number };
  suggestion?: string;
  ruleId?: string;
  section?: string;
}

export interface AnalysisResult {
  issues: ProofreadingIssue[];
  statistics: {
    antecedentScore: number;
    clarityScore: number;
    consistencyScore: number;
    supportScore: number;
    formatScore: number;
    overallScore: number;
  };
  elements: {
    introduced: Map<string, { line: number; type: 'indefinite' | 'definite' }>;
    referenced: Map<string, { lines: number[]; hasAntecedent: boolean }>;
    technical: Map<string, string[]>; // term -> variations
  };
}

/**
 * 1. ANTECEDENT BASIS CHECKER
 * Detects missing or unclear antecedents in patent claims
 */
export class AntecedentBasisChecker {
  private introducedElements: Map<string, { line: number; type: 'indefinite' | 'definite' }> = new Map();
  private referencedElements: Map<string, { lines: number[]; hasAntecedent: boolean }> = new Map();
  
  analyze(text: string): ProofreadingIssue[] {
    const issues: ProofreadingIssue[] = [];
    const lines = text.split('\n');
    
    // Reset tracking for new analysis
    this.introducedElements.clear();
    this.referencedElements.clear();
    
    lines.forEach((line, lineIndex) => {
      // Skip empty lines or non-claim text
      if (!line.trim() || !this.isClaimText(line)) return;
      
      // Extract noun phrases with articles
      const indefinitePattern = /\b(a|an)\s+([a-zA-Z\s\-]+?)(?=\s+(?:configured|adapted|arranged|comprising|having|with|for|that|which|wherein|,|;|\.|$))/gi;
      const definitePattern = /\b(the|said)\s+([a-zA-Z\s\-]+?)(?=\s+(?:configured|adapted|arranged|comprising|having|with|for|that|which|wherein|,|;|\.|$))/gi;
      
      // Find all indefinite introductions (a/an)
      let indefiniteMatch;
      while ((indefiniteMatch = indefinitePattern.exec(line)) !== null) {
        const element = this.normalizeElement(indefiniteMatch[2]);
        if (!this.introducedElements.has(element)) {
          this.introducedElements.set(element, { line: lineIndex + 1, type: 'indefinite' });
        }
      }
      
      // Find all definite references (the/said)
      let definiteMatch;
      while ((definiteMatch = definitePattern.exec(line)) !== null) {
        const article = definiteMatch[1].toLowerCase();
        const element = this.normalizeElement(definiteMatch[2]);
        
        // Check if element was previously introduced
        if (!this.introducedElements.has(element)) {
          issues.push({
            type: 'antecedent',
            severity: 'error',
            message: `Missing antecedent basis: "${article} ${element}" used without prior introduction`,
            line: lineIndex + 1,
            position: { start: definiteMatch.index, end: definiteMatch.index + definiteMatch[0].length },
            suggestion: `First introduce with "a ${element}" or "an ${element}" before using "${article} ${element}"`,
            ruleId: 'MPEP-2173.05(e)'
          });
          
          // Track as referenced without antecedent
          if (!this.referencedElements.has(element)) {
            this.referencedElements.set(element, { lines: [], hasAntecedent: false });
          }
          this.referencedElements.get(element)!.lines.push(lineIndex + 1);
        } else {
          // Track as properly referenced
          if (!this.referencedElements.has(element)) {
            this.referencedElements.set(element, { lines: [], hasAntecedent: true });
          }
          this.referencedElements.get(element)!.lines.push(lineIndex + 1);
        }
      }
      
      // Check for unclear references
      const unclearPattern = /\b(it|they|them|this|that|these|those)\s+(?!(?:is|are|was|were|has|have|had|will|would|should|could|can|may|might|must))/gi;
      let unclearMatch;
      while ((unclearMatch = unclearPattern.exec(line)) !== null) {
        const pronoun = unclearMatch[1];
        issues.push({
          type: 'antecedent',
          severity: 'warning',
          message: `Unclear pronoun reference: "${pronoun}" may lack clear antecedent`,
          line: lineIndex + 1,
          position: { start: unclearMatch.index, end: unclearMatch.index + pronoun.length },
          suggestion: `Replace "${pronoun}" with the specific element it refers to`,
          ruleId: 'MPEP-2173.05(e)'
        });
      }
      
      // Check for means-plus-function without antecedent
      const meansPattern = /\bmeans\s+for\s+([a-zA-Z\s\-]+?)(?=\s*[,;.]|$)/gi;
      let meansMatch;
      while ((meansMatch = meansPattern.exec(line)) !== null) {
        const function_ = meansMatch[1];
        if (!text.toLowerCase().includes(`structure`) || !text.toLowerCase().includes(`algorithm`)) {
          issues.push({
            type: 'antecedent',
            severity: 'warning',
            message: `Potential 112(f) interpretation: "means for ${function_}" may require corresponding structure in specification`,
            line: lineIndex + 1,
            suggestion: `Ensure specification describes structure/algorithm for "${function_}"`,
            ruleId: 'MPEP-2181'
          });
        }
      }
    });
    
    // Check for orphaned elements (introduced but never referenced)
    this.introducedElements.forEach((intro, element) => {
      if (!this.referencedElements.has(element)) {
        issues.push({
          type: 'antecedent',
          severity: 'info',
          message: `Element "${element}" introduced but never referenced with "the" or "said"`,
          line: intro.line,
          suggestion: `Consider if "${element}" needs to be referenced later or can be removed`
        });
      }
    });
    
    return issues;
  }
  
  private isClaimText(line: string): boolean {
    // Detect if line is part of a claim (starts with number or contains claim language)
    return /^\s*\d+\./.test(line) || 
           /\b(comprising|including|wherein|whereby|characterized)\b/i.test(line);
  }
  
  private normalizeElement(element: string): string {
    // Normalize element names for comparison (remove extra spaces, lowercase)
    return element.trim().toLowerCase().replace(/\s+/g, ' ');
  }
  
  getElements() {
    return {
      introduced: this.introducedElements,
      referenced: this.referencedElements
    };
  }
}

/**
 * 2. INDEFINITENESS DETECTOR
 * Identifies vague and indefinite terms that could trigger 112(b) rejections
 */
export class IndefinitenessDetector {
  private readonly vagueTerms = [
    'substantially', 'approximately', 'about', 'generally', 'relatively',
    'significantly', 'considerably', 'appreciably', 'markedly', 'notably'
  ];
  
  private readonly relativeTerms = [
    'large', 'small', 'high', 'low', 'fast', 'slow', 'thick', 'thin',
    'strong', 'weak', 'hot', 'cold', 'long', 'short', 'wide', 'narrow'
  ];
  
  private readonly unclearModifiers = [
    'preferably', 'for example', 'such as', 'e.g.', 'i.e.', 'etc.',
    'and/or', 'optionally', 'alternatively', 'typically', 'usually'
  ];
  
  private readonly subjectiveTerms = [
    'user-friendly', 'convenient', 'easy', 'difficult', 'efficient',
    'effective', 'improved', 'enhanced', 'optimized', 'superior'
  ];
  
  analyze(text: string, isClaimSection: boolean = false): ProofreadingIssue[] {
    const issues: ProofreadingIssue[] = [];
    const lines = text.split('\n');
    
    lines.forEach((line, lineIndex) => {
      // In claims, these terms are more problematic
      const severity = isClaimSection ? 'error' : 'warning';
      
      // Check for vague quantifiers
      this.vagueTerms.forEach(term => {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        let vagueMatch;
        while ((vagueMatch = regex.exec(line)) !== null) {
          issues.push({
            type: 'indefinite',
            severity: severity,
            message: `Vague term "${term}" may render claim indefinite`,
            line: lineIndex + 1,
            position: { start: vagueMatch.index, end: vagueMatch.index + term.length },
            suggestion: `Provide specific range or value instead of "${term}"`,
            ruleId: 'MPEP-2173.05(b)'
          });
        }
      });
      
      // Check for relative terms without baseline
      this.relativeTerms.forEach(term => {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        let relativeMatch;
        while ((relativeMatch = regex.exec(line)) !== null) {
          // Check if there's a comparison or baseline nearby
          const context = line.substring(Math.max(0, relativeMatch.index - 50), Math.min(line.length, relativeMatch.index + 50));
          if (!context.match(/than|compared to|relative to|with respect to/i)) {
            issues.push({
              type: 'indefinite',
              severity: isClaimSection ? 'error' : 'warning',
              message: `Relative term "${term}" lacks baseline for comparison`,
              line: lineIndex + 1,
              position: { start: relativeMatch.index, end: relativeMatch.index + term.length },
              suggestion: `Define what "${term}" is relative to, or provide specific measurements`,
              ruleId: 'MPEP-2173.05(b)'
            });
          }
        }
      });
      
      // Check for unclear modifiers in claims
      if (isClaimSection) {
        this.unclearModifiers.forEach(modifier => {
          const regex = new RegExp(`\\b${modifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          let modifierMatch;
          while ((modifierMatch = regex.exec(line)) !== null) {
            issues.push({
              type: 'indefinite',
              severity: 'error',
              message: `Modifier "${modifier}" introduces uncertainty in claims`,
              line: lineIndex + 1,
              position: { start: modifierMatch.index, end: modifierMatch.index + modifier.length },
              suggestion: modifier === 'and/or' 
                ? 'Use "and" or "or" separately for clarity'
                : `Remove "${modifier}" from claims or move to specification`,
              ruleId: 'MPEP-2173.05(d)'
            });
          }
        });
      }
      
      // Check for subjective terms
      this.subjectiveTerms.forEach(term => {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        let subjectiveMatch;
        while ((subjectiveMatch = regex.exec(line)) !== null) {
          issues.push({
            type: 'indefinite',
            severity: 'warning',
            message: `Subjective term "${term}" may be indefinite`,
            line: lineIndex + 1,
            position: { start: subjectiveMatch.index, end: subjectiveMatch.index + term.length },
            suggestion: `Define "${term}" with objective criteria or measurable parameters`,
            ruleId: 'MPEP-2173.05(b)'
          });
        }
      });
      
      // Check for improper Markush groups
      const markushPattern = /\bselected from the group consisting of\b(.+?)(?:\.|;|,\s*and)/gi;
      let markushMatch;
      while ((markushMatch = markushPattern.exec(line)) !== null) {
        const group = markushMatch[1];
        if (!group.includes(' and ') || group.includes(' or ')) {
          issues.push({
            type: 'indefinite',
            severity: 'error',
            message: 'Improper Markush group format',
            line: lineIndex + 1,
            suggestion: 'Use "selected from the group consisting of A, B, and C" format',
            ruleId: 'MPEP-2173.05(h)'
          });
        }
      }
    });
    
    return issues;
  }
}

/**
 * 3. TECHNICAL CONSISTENCY CHECKER
 * Ensures consistent use of technical terminology throughout the document
 */
export class TechnicalConsistencyChecker {
  private termVariations: Map<string, Set<string>> = new Map();
  private termUsage: Map<string, number[]> = new Map(); // term -> line numbers
  
  analyze(text: string): ProofreadingIssue[] {
    const issues: ProofreadingIssue[] = [];
    const lines = text.split('\n');
    
    // Build term dictionary
    this.buildTermDictionary(lines);
    
    // Find inconsistent terminology
    this.termVariations.forEach((variations, baseTerm) => {
      if (variations.size > 1) {
        const variationList = Array.from(variations);
        const usage = this.termUsage.get(baseTerm) || [];
        
        issues.push({
          type: 'consistency',
          severity: 'warning',
          message: `Inconsistent terminology: "${baseTerm}" has variations: ${variationList.join(', ')}`,
          line: usage[0] || 1,
          suggestion: `Use consistent term throughout. Most common: "${this.getMostCommon(variationList, lines)}"`,
          ruleId: 'MPEP-608.01(o)'
        });
      }
    });
    
    // Check for number/reference consistency
    const referencePattern = /\b(?:FIG(?:URE)?|Fig\.|Figure|Ref\.?|Reference)\s*\.?\s*(\d+[A-Za-z]?)/gi;
    const references = new Map<string, Set<string>>();
    
    lines.forEach((line, lineIndex) => {
      let referenceMatch;
      while ((referenceMatch = referencePattern.exec(line)) !== null) {
        const fullRef = referenceMatch[0];
        const number = referenceMatch[1];
        
        if (!references.has(number)) {
          references.set(number, new Set());
        }
        references.get(number)!.add(fullRef);
      }
    });
    
    // Check reference consistency
    references.forEach((formats, number) => {
      if (formats.size > 1) {
        issues.push({
          type: 'consistency',
          severity: 'warning',
          message: `Inconsistent reference format for ${number}: ${Array.from(formats).join(', ')}`,
          suggestion: 'Use consistent format (e.g., always "FIG. 1" or always "Figure 1")'
        });
      }
    });
    
    // Check part number consistency
    const partNumbers = new Map<string, Set<string>>();
    const partNumberPattern = /\b([a-zA-Z_][a-zA-Z0-9_\-]*)\s*\((\d+[a-zA-Z]?)\)/g;
    
    lines.forEach((line) => {
      let partMatch;
      while ((partMatch = partNumberPattern.exec(line)) !== null) {
        const element = partMatch[1].toLowerCase();
        const number = partMatch[2];
        
        if (!partNumbers.has(element)) {
          partNumbers.set(element, new Set());
        }
        partNumbers.get(element)!.add(number);
      }
    });
    
    // Check if same element has different numbers
    partNumbers.forEach((numbers, element) => {
      if (numbers.size > 1) {
        issues.push({
          type: 'consistency',
          severity: 'error',
          message: `Element "${element}" has multiple reference numbers: ${Array.from(numbers).join(', ')}`,
          suggestion: `Use consistent reference number for "${element}" throughout`
        });
      }
    });
    
    return issues;
  }
  
  private buildTermDictionary(lines: string[]) {
    // Common technical term patterns and their variations
    const termPatterns = [
      { base: 'process', variations: ['process', 'method', 'procedure', 'technique'] },
      { base: 'device', variations: ['device', 'apparatus', 'system', 'mechanism'] },
      { base: 'element', variations: ['element', 'component', 'member', 'part'] },
      { base: 'connect', variations: ['connected', 'coupled', 'attached', 'joined', 'linked'] },
      { base: 'transmit', variations: ['transmit', 'send', 'communicate', 'transfer'] },
      { base: 'receive', variations: ['receive', 'obtain', 'acquire', 'get'] },
      { base: 'store', variations: ['store', 'save', 'record', 'retain'] }
    ];
    
    lines.forEach((line, lineIndex) => {
      termPatterns.forEach(({ base, variations }) => {
        variations.forEach(variant => {
          const regex = new RegExp(`\\b${variant}(?:ing|ed|s)?\\b`, 'gi');
          if (regex.test(line)) {
            if (!this.termVariations.has(base)) {
              this.termVariations.set(base, new Set());
              this.termUsage.set(base, []);
            }
            this.termVariations.get(base)!.add(variant);
            this.termUsage.get(base)!.push(lineIndex + 1);
          }
        });
      });
    });
  }
  
  private getMostCommon(variations: string[], lines: string[]): string {
    const counts = new Map<string, number>();
    variations.forEach(v => counts.set(v, 0));
    
    lines.forEach(line => {
      variations.forEach(v => {
        const regex = new RegExp(`\\b${v}\\b`, 'gi');
        const matches = line.match(regex);
        if (matches) {
          counts.set(v, (counts.get(v) || 0) + matches.length);
        }
      });
    });
    
    let maxCount = 0;
    let mostCommon = variations[0];
    counts.forEach((count, variation) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = variation;
      }
    });
    
    return mostCommon;
  }
  
  getTermMapping() {
    return this.termVariations;
  }
}

/**
 * 4. CLAIM SUPPORT CHECKER
 * Verifies claims are properly supported by the specification
 */
export class ClaimSupportChecker {
  analyze(claims: string, specification: string): ProofreadingIssue[] {
    const issues: ProofreadingIssue[] = [];
    
    // Extract key claim limitations
    const limitations = this.extractClaimLimitations(claims);
    const specContent = specification.toLowerCase();
    
    limitations.forEach(({ limitation, line, claimNumber }) => {
      const searchTerm = limitation.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(' ')
        .filter(word => word.length > 3)
        .join(' ');
      
      if (searchTerm && !specContent.includes(searchTerm)) {
        // Try to find partial matches
        const words = searchTerm.split(' ');
        const partialMatches = words.filter(word => specContent.includes(word));
        
        if (partialMatches.length < words.length / 2) {
          issues.push({
            type: 'support',
            severity: 'error',
            message: `Claim limitation lacks specification support: "${limitation}"`,
            line: line,
            suggestion: `Add description of "${limitation}" to specification or remove from claim ${claimNumber}`,
            ruleId: 'MPEP-2163'
          });
        } else if (partialMatches.length < words.length) {
          issues.push({
            type: 'support',
            severity: 'warning',
            message: `Claim limitation may lack full support: "${limitation}"`,
            line: line,
            suggestion: `Verify specification fully describes "${limitation}"`,
            ruleId: 'MPEP-2163'
          });
        }
      }
    });
    
    // Check for new matter in claims
    const technicalTerms = this.extractTechnicalTerms(claims);
    technicalTerms.forEach(term => {
      if (!specContent.includes(term.toLowerCase()) && term.length > 5) {
        issues.push({
          type: 'support',
          severity: 'warning',
          message: `Technical term "${term}" not found in specification`,
          suggestion: `Ensure "${term}" is described in the specification or use existing terminology`,
          ruleId: 'MPEP-2163.06'
        });
      }
    });
    
    return issues;
  }
  
  private extractClaimLimitations(claims: string): Array<{limitation: string, line: number, claimNumber: number}> {
    const limitations: Array<{limitation: string, line: number, claimNumber: number}> = [];
    const lines = claims.split('\n');
    let currentClaim = 0;
    
    lines.forEach((line, lineIndex) => {
      // Detect claim number
      const claimMatch = line.match(/^\s*(\d+)\./);
      if (claimMatch) {
        currentClaim = parseInt(claimMatch[1]);
      }
      
      // Extract limitations (text between commas, semicolons, or claim elements)
      const limitationPatterns = [
        /comprising:?\s*([^,;]+)/gi,
        /including:?\s*([^,;]+)/gi,
        /wherein\s+([^,;]+)/gi,
        /configured to\s+([^,;]+)/gi,
        /adapted to\s+([^,;]+)/gi,
        /operable to\s+([^,;]+)/gi
      ];
      
      limitationPatterns.forEach(pattern => {
        let limitationMatch;
        while ((limitationMatch = pattern.exec(line)) !== null) {
          limitations.push({
            limitation: limitationMatch[1].trim(),
            line: lineIndex + 1,
            claimNumber: currentClaim
          });
        }
      });
    });
    
    return limitations;
  }
  
  private extractTechnicalTerms(text: string): string[] {
    const terms: Set<string> = new Set();
    
    // Extract capitalized technical terms and compounds
    const technicalPattern = /\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\b/g;
    let technicalMatch;
    while ((technicalMatch = technicalPattern.exec(text)) !== null) {
      // Filter out common words
      const term = technicalMatch[1];
      if (!this.isCommonWord(term)) {
        terms.add(term);
      }
    }
    
    return Array.from(terms);
  }
  
  private isCommonWord(word: string): boolean {
    const common = ['The', 'This', 'That', 'These', 'Those', 'Figure', 'Table', 
                    'Example', 'Section', 'Chapter', 'According', 'However'];
    return common.includes(word);
  }
}

/**
 * 5. FORMAT COMPLIANCE CHECKER
 * Ensures compliance with USPTO/EPO formatting requirements
 */
export class FormatComplianceChecker {
  analyze(text: string, office: 'USPTO' | 'EPO' = 'USPTO'): ProofreadingIssue[] {
    const issues: ProofreadingIssue[] = [];
    const lines = text.split('\n');
    
    if (office === 'USPTO') {
      this.checkUSPTOFormat(lines, issues);
    } else {
      this.checkEPOFormat(lines, issues);
    }
    
    // Common format checks for both offices
    this.checkCommonFormat(lines, issues);
    
    return issues;
  }
  
  private checkUSPTOFormat(lines: string[], issues: ProofreadingIssue[]) {
    let claimCount = 0;
    let lastClaimNumber = 0;
    
    lines.forEach((line, lineIndex) => {
      // Check claim numbering
      const claimMatch = line.match(/^\s*(\d+)\.\s*(.+)/);
      if (claimMatch) {
        const claimNumber = parseInt(claimMatch[1]);
        claimCount++;
        
        // Check sequential numbering
        if (claimNumber !== lastClaimNumber + 1) {
          issues.push({
            type: 'format',
            severity: 'error',
            message: `Claim numbering error: Expected claim ${lastClaimNumber + 1}, found ${claimNumber}`,
            line: lineIndex + 1,
            ruleId: 'MPEP-608.01(m)'
          });
        }
        lastClaimNumber = claimNumber;
        
        // Check claim format
        const claimText = claimMatch[2];
        
        // Independent claim should start with "A" or "An"
        if (claimNumber === 1 || this.isIndependentClaim(claimText)) {
          if (!claimText.match(/^(A|An)\s+/)) {
            issues.push({
              type: 'format',
              severity: 'warning',
              message: 'Independent claim should start with "A" or "An"',
              line: lineIndex + 1,
              suggestion: `Start claim ${claimNumber} with "A" or "An"`,
              ruleId: 'MPEP-608.01(m)'
            });
          }
        }
        
        // Check for proper claim ending
        const nextLine = lines[lineIndex + 1];
        const isLastLineOfClaim = !nextLine || nextLine.match(/^\s*\d+\./);
        if (isLastLineOfClaim && !line.trim().endsWith('.')) {
          issues.push({
            type: 'format',
            severity: 'error',
            message: `Claim ${claimNumber} must end with a period`,
            line: lineIndex + 1,
            ruleId: 'MPEP-608.01(m)'
          });
        }
      }
      
      // Check for multiple dependencies (not allowed in USPTO)
      if (line.match(/claims?\s+\d+\s+(and|or)\s+\d+/i)) {
        issues.push({
          type: 'format',
          severity: 'error',
          message: 'Multiple claim dependencies not allowed in USPTO',
          line: lineIndex + 1,
          suggestion: 'Create separate dependent claims for each dependency',
          ruleId: 'MPEP-608.01(n)'
        });
      }
      
      // Check for proper use of "comprising"
      if (line.includes('comprising of')) {
        issues.push({
          type: 'format',
          severity: 'error',
          message: 'Use "comprising" not "comprising of"',
          line: lineIndex + 1,
          suggestion: 'Change "comprising of" to "comprising"'
        });
      }
    });
    
    // Check claim count
    if (claimCount > 20) {
      issues.push({
        type: 'format',
        severity: 'info',
        message: `Application has ${claimCount} claims. Excess claim fees apply for > 20 claims`,
        line: 1,
        ruleId: '37 CFR 1.16'
      });
    }
    
    if (claimCount > 3 && this.countIndependentClaims(lines) > 3) {
      issues.push({
        type: 'format',
        severity: 'info',
        message: 'Excess independent claim fees apply for > 3 independent claims',
        line: 1,
        ruleId: '37 CFR 1.16'
      });
    }
  }
  
  private checkEPOFormat(lines: string[], issues: ProofreadingIssue[]) {
    lines.forEach((line, lineIndex) => {
      // Check for two-part form in independent claims
      if (this.isIndependentClaim(line)) {
        if (!line.includes('characterized in that') && !line.includes('characterised in that')) {
          issues.push({
            type: 'format',
            severity: 'warning',
            message: 'EPO prefers two-part form with "characterized in that" for independent claims',
            line: lineIndex + 1,
            suggestion: 'Use format: "[preamble] characterized in that [characterizing portion]"',
            ruleId: 'EPC Rule 43(1)'
          });
        }
      }
      
      // EPO allows multiple dependencies
      const multiDepPattern = /according to any one of claims?\s+\d+\s+to\s+\d+/i;
      if (line.match(multiDepPattern)) {
        // This is acceptable in EPO
        issues.push({
          type: 'format',
          severity: 'info',
          message: 'Multiple dependencies allowed in EPO but not in USPTO',
          line: lineIndex + 1
        });
      }
    });
    
    // Check unity of invention
    const independentClaims = this.countIndependentClaims(lines);
    if (independentClaims > 1) {
      issues.push({
        type: 'format',
        severity: 'warning',
        message: `${independentClaims} independent claims detected. Ensure unity of invention`,
        line: 1,
        ruleId: 'EPC Article 82'
      });
    }
  }
  
  private checkCommonFormat(lines: string[], issues: ProofreadingIssue[]) {
    lines.forEach((line, lineIndex) => {
      // Check for claim within a claim
      if (line.match(/\bclaim\b.*\bclaim\b/i)) {
        issues.push({
          type: 'format',
          severity: 'error',
          message: 'Avoid "claim within a claim" language',
          line: lineIndex + 1,
          suggestion: 'Rephrase to avoid nested claim language'
        });
      }
      
      // Check for proper Markush format
      const markushPattern = /\bselected from the group consisting of\b/i;
      if (markushPattern.test(line)) {
        if (!line.includes(', and ')) {
          issues.push({
            type: 'format',
            severity: 'warning',
            message: 'Markush group should use ", and" before last element',
            line: lineIndex + 1,
            suggestion: 'Format: "selected from the group consisting of A, B, and C"'
          });
        }
      }
      
      // Check for trademark symbols (should not be in claims)
      if (line.match(/[®™©]/)) {
        issues.push({
          type: 'format',
          severity: 'error',
          message: 'Remove trademark/copyright symbols from claims',
          line: lineIndex + 1
        });
      }
      
      // Check for reference numerals in claims
      const refNumeralPattern = /\b\d{2,}\b/;
      if (refNumeralPattern.test(line) && this.isClaimLine(line)) {
        issues.push({
          type: 'format',
          severity: 'info',
          message: 'Reference numerals in claims should be in parentheses',
          line: lineIndex + 1,
          suggestion: 'Format: "element (100)"'
        });
      }
    });
  }
  
  private isIndependentClaim(text: string): boolean {
    return !text.match(/according to claim|of claim|in claim|wherein claim/i) &&
           !!text.match(/^(A|An|The)\s+/);
  }
  
  private countIndependentClaims(lines: string[]): number {
    let count = 0;
    lines.forEach(line => {
      if (line.match(/^\s*\d+\./) && this.isIndependentClaim(line)) {
        count++;
      }
    });
    return count;
  }
  
  private isClaimLine(line: string): boolean {
    return /^\s*\d+\./.test(line) || /\b(comprising|wherein|whereby)\b/i.test(line);
  }
}

/**
 * Main Patent Proofreading Analyzer
 * Coordinates all checking modules
 */
export class PatentProofreadingAnalyzer {
  private antecedentChecker: AntecedentBasisChecker;
  private indefinitenessDetector: IndefinitenessDetector;
  private consistencyChecker: TechnicalConsistencyChecker;
  private supportChecker: ClaimSupportChecker;
  private formatChecker: FormatComplianceChecker;
  
  constructor() {
    this.antecedentChecker = new AntecedentBasisChecker();
    this.indefinitenessDetector = new IndefinitenessDetector();
    this.consistencyChecker = new TechnicalConsistencyChecker();
    this.supportChecker = new ClaimSupportChecker();
    this.formatChecker = new FormatComplianceChecker();
  }
  
  analyzeDocument(
    text: string, 
    options: {
      section?: 'claims' | 'specification' | 'abstract';
      specification?: string; // For claim support checking
      office?: 'USPTO' | 'EPO';
    } = {}
  ): AnalysisResult {
    const issues: ProofreadingIssue[] = [];
    const isClaimSection = options.section === 'claims';
    
    // Run all analyzers
    issues.push(...this.antecedentChecker.analyze(text));
    issues.push(...this.indefinitenessDetector.analyze(text, isClaimSection));
    issues.push(...this.consistencyChecker.analyze(text));
    
    if (options.specification && isClaimSection) {
      issues.push(...this.supportChecker.analyze(text, options.specification));
    }
    
    issues.push(...this.formatChecker.analyze(text, options.office || 'USPTO'));
    
    // Calculate scores
    const statistics = this.calculateStatistics(issues, text);
    
    // Get element tracking
    const elements = {
      introduced: this.antecedentChecker.getElements().introduced,
      referenced: this.antecedentChecker.getElements().referenced,
      technical: new Map(Array.from(this.consistencyChecker.getTermMapping()).map(([key, value]) => [key, Array.from(value)]))
    };
    
    return {
      issues: this.prioritizeIssues(issues),
      statistics,
      elements
    };
  }
  
  private calculateStatistics(issues: ProofreadingIssue[], text: string): AnalysisResult['statistics'] {
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const wordCount = text.split(/\s+/).length;
    
    // Calculate individual scores (100 = perfect)
    const antecedentScore = Math.max(0, 100 - (issues.filter(i => i.type === 'antecedent').length * 10));
    const clarityScore = Math.max(0, 100 - (issues.filter(i => i.type === 'indefinite').length * 8));
    const consistencyScore = Math.max(0, 100 - (issues.filter(i => i.type === 'consistency').length * 5));
    const supportScore = Math.max(0, 100 - (issues.filter(i => i.type === 'support').length * 15));
    const formatScore = Math.max(0, 100 - (issues.filter(i => i.type === 'format').length * 5));
    
    // Weight the scores for overall
    const overallScore = Math.round(
      antecedentScore * 0.3 +
      clarityScore * 0.25 +
      consistencyScore * 0.15 +
      supportScore * 0.2 +
      formatScore * 0.1
    );
    
    return {
      antecedentScore,
      clarityScore,
      consistencyScore,
      supportScore,
      formatScore,
      overallScore
    };
  }
  
  private prioritizeIssues(issues: ProofreadingIssue[]): ProofreadingIssue[] {
    // Sort by severity and type priority
    const priority = {
      'error': 0,
      'warning': 1,
      'info': 2
    };
    
    const typePriority = {
      'antecedent': 0,
      'support': 1,
      'indefinite': 2,
      'format': 3,
      'consistency': 4,
      'suggestion': 5
    };
    
    return issues.sort((a, b) => {
      const severityDiff = priority[a.severity] - priority[b.severity];
      if (severityDiff !== 0) return severityDiff;
      
      return typePriority[a.type] - typePriority[b.type];
    });
  }
  
  // Generate suggestions based on context
  generateContextSuggestions(
    text: string,
    cursorPosition: number,
    section: 'claims' | 'specification' | 'abstract'
  ): string[] {
    const suggestions: string[] = [];
    
    // Get text before cursor
    const textBefore = text.substring(Math.max(0, cursorPosition - 100), cursorPosition);
    const lastWord = textBefore.match(/(\w+)\s*$/)?.[1]?.toLowerCase();
    
    if (section === 'claims') {
      // Claim-specific suggestions
      if (lastWord === 'a' || lastWord === 'an') {
        suggestions.push('first', 'second', 'plurality of', 'predetermined');
      } else if (lastWord === 'the') {
        suggestions.push('first', 'second', 'said');
      } else if (textBefore.endsWith(',')) {
        suggestions.push(' wherein', ' whereby', ' said', ' the');
      } else if (textBefore.match(/\d+\.\s*$/)) {
        suggestions.push('A method', 'A system', 'An apparatus', 'A device');
      } else {
        suggestions.push(
          'comprising',
          'including', 
          'wherein',
          'configured to',
          'adapted to',
          'operable to',
          'coupled to',
          'connected to',
          'in communication with'
        );
      }
    } else if (section === 'specification') {
      // Specification-specific suggestions
      suggestions.push(
        'In one embodiment',
        'According to an embodiment',
        'In some embodiments',
        'Referring to FIG.',
        'As shown in FIG.',
        'As described herein',
        'It should be understood that',
        'Those skilled in the art will appreciate'
      );
    } else {
      // Abstract suggestions
      suggestions.push(
        'The present disclosure relates to',
        'Embodiments describe',
        'Methods and systems for',
        'Various embodiments provide'
      );
    }
    
    return suggestions;
  }
}