/**
 * Job Templates Service - Predefined patent analysis jobs
 */

export interface JobTemplate {
  id: string;
  name: string;
  description: string;
  category: 'discovery' | 'analysis' | 'strategic' | 'processing';
  duration: string;
  estimatedTime: number; // minutes
  complexity: 'light' | 'standard' | 'deep';
  outputs: string[];
  requiredInputs: string[];
  optionalInputs: string[];
  icon: string;
  tags: string[];
}

export interface JobSubmission {
  templateId: string;
  datasetIds: string[];
  projectId: string;
  intensity: 'light' | 'standard' | 'deep';
  inputs: Record<string, any>;
  outputFormats: string[];
}

export const JOB_TEMPLATES: JobTemplate[] = [
  // DISCOVERY JOBS
  {
    id: 'technology_landscape_map',
    name: 'Technology Landscape Map',
    description: 'Extract and map key technologies and their relationships across your patent portfolio',
    category: 'discovery',
    duration: '15-30 mins',
    estimatedTime: 25,
    complexity: 'standard',
    outputs: [
      'Technology tree visualization',
      'Entity relationship graph',
      'Key innovation themes',
      'Technology evolution timeline'
    ],
    requiredInputs: ['patents'],
    optionalInputs: ['technology_focus', 'time_range'],
    icon: 'Network',
    tags: ['mapping', 'visualization', 'technology']
  },
  {
    id: 'competitor_intelligence',
    name: 'Competitor Intelligence',
    description: 'Identify competing patents and analyze competitive landscape positioning',
    category: 'discovery',
    duration: '20-45 mins',
    estimatedTime: 35,
    complexity: 'standard',
    outputs: [
      'Competitor patent portfolio analysis',
      'Technology overlap matrix',
      'Innovation timeline comparison',
      'Market positioning insights'
    ],
    requiredInputs: ['patents'],
    optionalInputs: ['competitor_list', 'market_segment'],
    icon: 'Users',
    tags: ['competitors', 'landscape', 'intelligence']
  },
  {
    id: 'prior_art_discovery',
    name: 'Prior Art Discovery',
    description: 'Find relevant prior art for innovation assessment and patent validity analysis',
    category: 'discovery',
    duration: '10-25 mins',
    estimatedTime: 20,
    complexity: 'light',
    outputs: [
      'Prior art patent list',
      'Relevance scoring',
      'Citation network analysis',
      'Validity risk assessment'
    ],
    requiredInputs: ['patents'],
    optionalInputs: ['search_scope', 'date_range'],
    icon: 'Search',
    tags: ['prior-art', 'validity', 'search']
  },

  // ANALYSIS JOBS
  {
    id: 'patent_strength_assessment',
    name: 'Patent Strength Assessment',
    description: 'Analyze claim breadth, novelty, and potential commercial impact of patents',
    category: 'analysis',
    duration: '25-40 mins',
    estimatedTime: 32,
    complexity: 'deep',
    outputs: [
      'Patent strength scores',
      'Claim breadth analysis',
      'Citation impact metrics',
      'Commercial potential ranking'
    ],
    requiredInputs: ['patents'],
    optionalInputs: ['market_data', 'industry_focus'],
    icon: 'TrendingUp',
    tags: ['strength', 'assessment', 'scoring']
  },
  {
    id: 'technology_evolution_tracking',
    name: 'Technology Evolution Tracking',
    description: 'Track how technologies evolve over time and predict future directions',
    category: 'analysis',
    duration: '30-50 mins',
    estimatedTime: 40,
    complexity: 'deep',
    outputs: [
      'Technology evolution timeline',
      'Innovation trend analysis',
      'Future direction predictions',
      'Key milestone identification'
    ],
    requiredInputs: ['patents'],
    optionalInputs: ['time_window', 'prediction_horizon'],
    icon: 'GitBranch',
    tags: ['evolution', 'trends', 'prediction']
  },
  {
    id: 'patent_family_analysis',
    name: 'Patent Family Analysis',
    description: 'Group related patents, continuations, and analyze family strategies',
    category: 'analysis',
    duration: '15-30 mins',
    estimatedTime: 22,
    complexity: 'standard',
    outputs: [
      'Patent family trees',
      'Filing strategy analysis',
      'Geographic coverage maps',
      'Family strength assessment'
    ],
    requiredInputs: ['patents'],
    optionalInputs: ['geographic_scope', 'filing_strategy'],
    icon: 'GitMerge',
    tags: ['families', 'continuations', 'strategy']
  },

  // STRATEGIC JOBS
  {
    id: 'freedom_to_operate',
    name: 'Freedom to Operate Analysis',
    description: 'Check if your innovation infringes existing patents and assess risks',
    category: 'strategic',
    duration: '35-60 mins',
    estimatedTime: 45,
    complexity: 'deep',
    outputs: [
      'Infringement risk assessment',
      'Blocking patents identification',
      'Design-around suggestions',
      'FTO clearance report'
    ],
    requiredInputs: ['patents', 'innovation_description'],
    optionalInputs: ['market_geography', 'launch_timeline'],
    icon: 'Shield',
    tags: ['FTO', 'infringement', 'risk']
  },
  {
    id: 'white_space_identification',
    name: 'White Space Identification',
    description: 'Find gaps in patent landscape and identify innovation opportunities',
    category: 'strategic',
    duration: '25-45 mins',
    estimatedTime: 35,
    complexity: 'standard',
    outputs: [
      'White space opportunity map',
      'Innovation gap analysis',
      'Market opportunity scoring',
      'R&D direction recommendations'
    ],
    requiredInputs: ['patents'],
    optionalInputs: ['market_focus', 'technology_scope'],
    icon: 'Target',
    tags: ['opportunities', 'gaps', 'innovation']
  },
  {
    id: 'licensing_opportunities',
    name: 'Licensing Opportunity Mapping',
    description: 'Identify potential licensing deals and partnership opportunities',
    category: 'strategic',
    duration: '20-35 mins',
    estimatedTime: 28,
    complexity: 'standard',
    outputs: [
      'Licensing opportunity matrix',
      'Partner recommendation list',
      'Technology transfer potential',
      'Revenue opportunity estimates'
    ],
    requiredInputs: ['patents'],
    optionalInputs: ['industry_focus', 'partnership_type'],
    icon: 'Handshake',
    tags: ['licensing', 'partnerships', 'revenue']
  },

  // PROCESSING JOBS
  {
    id: 'entity_extraction_normalization',
    name: 'Entity Extraction & Normalization',
    description: 'Extract technical entities and normalize variations for consistent analysis',
    category: 'processing',
    duration: '10-20 mins',
    estimatedTime: 15,
    complexity: 'light',
    outputs: [
      'Normalized entity database',
      'Relationship mappings',
      'Synonym clusters',
      'Technical taxonomy'
    ],
    requiredInputs: ['patents'],
    optionalInputs: ['entity_types', 'domain_ontology'],
    icon: 'Database',
    tags: ['entities', 'normalization', 'data']
  },
  {
    id: 'claim_decomposition',
    name: 'Claim Decomposition',
    description: 'Break down patent claims into components and analyze relationships',
    category: 'processing',
    duration: '15-25 mins',
    estimatedTime: 20,
    complexity: 'standard',
    outputs: [
      'Claim element breakdown',
      'Component relationship graph',
      'Dependency analysis',
      'Claim scope mapping'
    ],
    requiredInputs: ['patents'],
    optionalInputs: ['claim_focus', 'depth_level'],
    icon: 'List',
    tags: ['claims', 'decomposition', 'structure']
  },
  {
    id: 'technical_synonym_generation',
    name: 'Technical Synonym Generation',
    description: 'Generate domain-specific synonyms for comprehensive patent search',
    category: 'processing',
    duration: '20-35 mins',
    estimatedTime: 28,
    complexity: 'standard',
    outputs: [
      'Technical synonym database',
      'Semantic similarity scores',
      'Context-aware variations',
      'Search query expansion'
    ],
    requiredInputs: ['patents'],
    optionalInputs: ['domain_focus', 'similarity_threshold'],
    icon: 'BookOpen',
    tags: ['synonyms', 'search', 'language']
  }
];

export const JOB_CATEGORIES = {
  discovery: {
    name: 'Discovery & Mapping',
    description: 'Explore and map patent landscapes',
    icon: 'Compass',
    color: 'blue'
  },
  analysis: {
    name: 'Analysis & Classification',
    description: 'Deep analysis of patent content and trends',
    icon: 'BarChart3',
    color: 'green'
  },
  strategic: {
    name: 'Strategic Intelligence',
    description: 'Business and competitive insights',
    icon: 'Zap',
    color: 'purple'
  },
  processing: {
    name: 'Content Processing',
    description: 'Extract and process patent data',
    icon: 'Cog',
    color: 'orange'
  }
};

// Job Templates Service
export class JobTemplatesService {
  static getAllTemplates(): JobTemplate[] {
    return JOB_TEMPLATES;
  }

  static getTemplatesByCategory(category: string): JobTemplate[] {
    return JOB_TEMPLATES.filter(template => template.category === category);
  }

  static getTemplateById(id: string): JobTemplate | undefined {
    return JOB_TEMPLATES.find(template => template.id === id);
  }

  static getPopularTemplates(): JobTemplate[] {
    // Return most commonly used templates
    return JOB_TEMPLATES.filter(template => 
      ['technology_landscape_map', 'competitor_intelligence', 'freedom_to_operate', 'patent_strength_assessment'].includes(template.id)
    );
  }

  static searchTemplates(query: string): JobTemplate[] {
    const searchLower = query.toLowerCase();
    return JOB_TEMPLATES.filter(template => 
      template.name.toLowerCase().includes(searchLower) ||
      template.description.toLowerCase().includes(searchLower) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }

  static submitJob(submission: JobSubmission): Promise<{ jobId: string; estimatedCompletion: Date }> {
    // This will be replaced with actual API call to AIMLOps
    return new Promise((resolve) => {
      setTimeout(() => {
        const template = this.getTemplateById(submission.templateId);
        const estimatedMinutes = template?.estimatedTime || 30;
        const estimatedCompletion = new Date(Date.now() + estimatedMinutes * 60 * 1000);
        
        resolve({
          jobId: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          estimatedCompletion
        });
      }, 1000);
    });
  }
}