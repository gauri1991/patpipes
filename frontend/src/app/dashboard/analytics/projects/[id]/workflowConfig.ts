import { TabId } from './tabConfig';

export interface WorkflowPhase {
  id: string;
  name: string;
  description: string;
  primaryTab: TabId;
  steps: string[];
}

export interface TabWorkflowContext {
  roleInWorkflow: string;
  guidance: string;
  tips: string[];
}

export interface SearchTemplate {
  label: string;
  description: string;
  filterHints: string[];
}

export interface VisualizationSuggestion {
  chartType: string;
  title: string;
  description: string;
  phaseRelevance: string;
}

export interface StatusProgressEntry {
  atPhase: number;
  status: string;
}

export interface ProjectWorkflowConfig {
  displayName: string;
  purpose: string;
  phases: WorkflowPhase[];
  tabContexts: Partial<Record<TabId, TabWorkflowContext>>;
  insightTypes: string[];
  searchTemplates: SearchTemplate[];
  suggestedVisualizations: VisualizationSuggestion[];
  statusProgressMap: StatusProgressEntry[];
}

export type PhaseProgress = Record<
  string,
  { completed_steps: number[]; started_at: string | null; completed_at: string | null }
>;

// ---------------------------------------------------------------------------
// FTO ANALYSIS
// ---------------------------------------------------------------------------
const ftoConfig: ProjectWorkflowConfig = {
  displayName: 'Freedom to Operate (FTO)',
  purpose: 'Assess patent risk for a product or technology entering a target market',
  phases: [
    {
      id: 'product_definition',
      name: 'Product / Process Definition',
      description: 'Clearly define the product, process, or technology to be assessed for FTO risk.',
      primaryTab: 'overview',
      steps: [
        'Document the product or process in detail',
        'Identify target markets and jurisdictions',
        'List all embodiments and variants to be assessed',
        'Identify relevant launch timeline',
      ],
    },
    {
      id: 'feature_decomposition',
      name: 'Technical Feature Decomposition',
      description: 'Break the product down into discrete technical features that can be mapped to patent claims.',
      primaryTab: 'datasets',
      steps: [
        'List all distinct technical features of the product',
        'Assign IPC/CPC codes to each feature',
        'Identify novel vs. standard features',
        'Prioritize features by IP risk level',
      ],
    },
    {
      id: 'search_strategy',
      name: 'Search Strategy',
      description: 'Define keyword, classification, and citation-based search strategies per feature.',
      primaryTab: 'research',
      steps: [
        'Generate keyword terms per technical feature',
        'Map IPC/CPC codes to each feature',
        'Define date filter (expiry window)',
        'Define geographic scope per jurisdiction',
        'Plan citation-based forward/backward searches',
      ],
    },
    {
      id: 'patent_retrieval',
      name: 'Patent Retrieval & Filtering',
      description: 'Execute searches and filter results to unexpired, in-force patents in target jurisdictions.',
      primaryTab: 'datasets',
      steps: [
        'Execute searches across all target jurisdictions',
        'Filter to unexpired patents only',
        'Remove clearly irrelevant results',
        'Document retrieved patent counts per feature',
      ],
    },
    {
      id: 'claim_analysis',
      name: 'Claim Analysis',
      description: 'Analyze independent claims of relevant patents to assess coverage and potential infringement.',
      primaryTab: 'datasets',
      steps: [
        'Parse independent claims of all relevant patents',
        'Map claim elements to product features',
        'Identify literal vs. doctrine of equivalents coverage',
        'Flag high-risk claim-feature combinations',
      ],
    },
    {
      id: 'legal_status',
      name: 'Legal Status Verification',
      description: 'Verify the current legal status, ownership, and enforceability of flagged patents.',
      primaryTab: 'research',
      steps: [
        'Confirm current legal status (granted, published, expired)',
        'Verify ownership and assignment chain',
        'Check for licensing, consent, or exhaustion defenses',
        'Identify any pending litigation',
      ],
    },
    {
      id: 'risk_stratification',
      name: 'Risk Stratification',
      description: 'Score and tier identified patents by infringement risk and business impact.',
      primaryTab: 'reports',
      steps: [
        'Assign risk tier (High / Medium / Low) to each patent',
        'Assess likelihood of assertion',
        'Calculate business impact if asserted',
        'Identify design-around options for High-risk patents',
      ],
    },
    {
      id: 'opinion_reporting',
      name: 'Opinion & Reporting',
      description: 'Prepare the FTO opinion memo, claim charts, and risk register.',
      primaryTab: 'reports',
      steps: [
        'Draft FTO opinion memo',
        'Prepare claim charts for High-risk patents',
        'Compile risk register',
        'Document design-around recommendations',
        'Executive summary for stakeholders',
      ],
    },
  ],
  tabContexts: {
    research: {
      roleInWorkflow: 'Phases 3 & 6 — Search Strategy & Legal Status Verification',
      guidance: 'Search for patents that may read on your product\'s technical features. Run jurisdiction-specific searches and verify legal status of flagged patents.',
      tips: [
        'Filter to unexpired patents only (priority date + 20yr)',
        'Run separate searches per jurisdiction',
        'Use citation-based searches from foundational patents',
        'Check PCT applications that may have national phase entries',
      ],
    },
    datasets: {
      roleInWorkflow: 'Phase 4 — Patent Retrieval & Filtering',
      guidance: 'Upload or import your search results. Configure jurisdiction filters and expiry date cutoffs to focus on in-force patents.',
      tips: [
        'Use the FTO Dataset Config to set target jurisdictions',
        'Apply active-patents-only filter to reduce noise',
        'Keep separate datasets per jurisdiction for traceability',
      ],
    },
    reports: {
      roleInWorkflow: 'Phase 8 — Opinion & Reporting',
      guidance: 'Generate the FTO opinion memo, claim charts for high-risk patents, and a risk register for stakeholders.',
      tips: [
        'Use the "FTO Opinion Memo" template for standard structure',
        'Include design-around recommendations for each High-risk patent',
      ],
    },
  },
  insightTypes: [
    'risk_assessment',
    'clearance_analysis',
    'design_around',
    'claim_coverage',
    'legal_status',
    'jurisdiction_risk',
  ],
  searchTemplates: [
    {
      label: 'Feature-Based Keyword Search',
      description: 'Search patents using keywords extracted from a specific product feature',
      filterHints: ['Limit to unexpired', 'Target jurisdiction', 'IPC class filter'],
    },
    {
      label: 'Assignee-Based Search',
      description: 'Find all patents from a specific competitor in the relevant technology space',
      filterHints: ['Assignee name', 'Filing date range', 'Active patents only'],
    },
    {
      label: 'Citation-Based Forward Search',
      description: 'Find patents that cite a foundational prior art reference',
      filterHints: ['Seed patent number', 'Forward citation depth', 'Date range'],
    },
  ],
  suggestedVisualizations: [
    {
      chartType: 'fto_risk_matrix',
      title: 'FTO Risk Matrix',
      description: 'Visualize patents by risk tier (High/Medium/Low) vs. assertion likelihood',
      phaseRelevance: 'Phase 7 — Risk Stratification',
    },
    {
      chartType: 'patent_timeline',
      title: 'Patent Expiry Timeline',
      description: 'Show expiry dates of all relevant patents across jurisdictions',
      phaseRelevance: 'Phase 4 — Patent Retrieval',
    },
    {
      chartType: 'geographic_distribution',
      title: 'Jurisdiction Coverage Map',
      description: 'Display where patents are in force across target markets',
      phaseRelevance: 'Phase 3 — Search Strategy',
    },
  ],
  statusProgressMap: [
    { atPhase: 0, status: 'draft' },
    { atPhase: 1, status: 'scope_definition' },
    { atPhase: 2, status: 'data_collection' },
    { atPhase: 3, status: 'data_collection' },
    { atPhase: 4, status: 'patent_analysis' },
    { atPhase: 5, status: 'patent_analysis' },
    { atPhase: 6, status: 'visualization' },
    { atPhase: 7, status: 'report_generation' },
    { atPhase: 8, status: 'completed' },
  ],
};

// ---------------------------------------------------------------------------
// LANDSCAPE ANALYSIS
// ---------------------------------------------------------------------------
const landscapeConfig: ProjectWorkflowConfig = {
  displayName: 'Patent Landscape Analysis',
  purpose: 'Map the patent landscape of a technology domain to understand competitive dynamics and filing trends',
  phases: [
    {
      id: 'scope_definition',
      name: 'Scope Definition',
      description: 'Define the technology domain, sub-domains, time range, and geographic scope.',
      primaryTab: 'overview',
      steps: [
        'Define primary technology domain and sub-domains',
        'Select IPC/CPC classification codes',
        'Set time range for analysis',
        'Define target jurisdictions',
        'Identify key players to track',
      ],
    },
    {
      id: 'search_strategy',
      name: 'Search Strategy & Scope',
      description: 'Define IPC/CPC codes, keywords, jurisdictions, assignees, and date range for the landscape.',
      primaryTab: 'research',
      steps: [
        'Define IPC/CPC classification codes for domain coverage',
        'Set target jurisdictions and date range',
        'Identify key assignees to track',
        'Execute primary keyword and class searches',
        'Collect assignee-specific data',
      ],
    },
    {
      id: 'data_collection',
      name: 'Data Collection & Import',
      description: 'Collect patent data from multiple databases and import as datasets.',
      primaryTab: 'datasets',
      steps: [
        'Collect data from USPTO (PatentsView / ODP)',
        'Collect data from EPO Espacenet',
        'Collect data from WIPO Patentscope',
        'Collect from regional offices (JPO, CNIPA, KIPO) as needed',
        'Import and merge results into project datasets',
      ],
    },
    {
      id: 'classification',
      name: 'Data Processing & Classification',
      description: 'Clean, normalize, and classify retrieved patents into technology sub-domains.',
      primaryTab: 'datasets',
      steps: [
        'Normalize assignee names',
        'Classify patents into sub-domains',
        'Tag geographic and temporal data',
        'Validate classification accuracy',
      ],
    },
    {
      id: 'visualization',
      name: 'Visualization & Analysis',
      description: 'Generate filing trend charts, assignee matrices, and geographic heatmaps.',
      primaryTab: 'visualizations',
      steps: [
        'Create filing trend time-series chart',
        'Build assignee-technology matrix',
        'Generate geographic heatmap',
        'Identify top filers and emerging players',
      ],
    },
    {
      id: 'trend_analysis',
      name: 'Trend Analysis',
      description: 'Analyze emerging sub-domains, declining areas, and technology lifecycle stages.',
      primaryTab: 'reports',
      steps: [
        'Identify emerging technology sub-domains',
        'Identify declining areas',
        'Assess technology lifecycle (S-curve stage)',
        'Identify white space areas',
      ],
    },
    {
      id: 'reporting',
      name: 'Reporting & Presentation',
      description: 'Compile landscape executive summary and detailed reports.',
      primaryTab: 'reports',
      steps: [
        'Draft executive summary',
        'Compile technology distribution report',
        'Generate competitor filing report',
        'Prepare presentation slides',
      ],
    },
  ],
  tabContexts: {
    research: {
      roleInWorkflow: 'Phase 2 — Search Strategy & Scope',
      guidance: 'Define your search scope — IPC/CPC codes, jurisdictions, assignees, and date range. Changes save to the project and are reflected across all tabs.',
      tips: [
        'Use IPC/CPC class searches for technology domain coverage',
        'Run separate searches per sub-domain for better classification',
        'Use assignee searches to ensure key player coverage',
      ],
    },
    datasets: {
      roleInWorkflow: 'Phase 3 — Data Collection & Import',
      guidance: 'Track which patent databases you have collected from, then import results as project datasets.',
      tips: [
        'Create separate datasets per database source for traceability',
        'Mark databases as collected in the checklist — progress is saved',
        'Plan for ~20-30% deduplication when merging',
      ],
    },
    visualizations: {
      roleInWorkflow: 'Phase 5 — Visualization & Analysis',
      guidance: 'Build the standard landscape chart suite: filing trends, assignee matrix, and geographic heatmap.',
      tips: [
        'Use the LandscapeChartSuite for pre-configured chart templates',
        'Show at least 10 years of filing trends for lifecycle context',
        'Normalize filing counts by patent family, not individual publications',
      ],
    },
  },
  insightTypes: [
    'trend_analysis',
    'technology_emergence',
    'competitive_gap',
    'filing_velocity',
    'white_space',
    'actor_analysis',
  ],
  searchTemplates: [
    {
      label: 'Technology Domain Search',
      description: 'Comprehensive IPC/CPC-based search for a technology domain',
      filterHints: ['IPC class range', 'Date range', 'Jurisdiction filter'],
    },
    {
      label: 'Emerging Technology Search',
      description: 'Focus search on recent filings (last 3-5 years) in emerging sub-domains',
      filterHints: ['Recent filings', 'Specific sub-domain keywords', 'New filers'],
    },
    {
      label: 'Top Filer Analysis',
      description: 'Deep dive into filing patterns of identified top filers',
      filterHints: ['Specific assignees', 'Technology focus', 'Geographic spread'],
    },
  ],
  suggestedVisualizations: [
    {
      chartType: 'filing_trends',
      title: 'Filing Trend Time-Series',
      description: 'Annual patent filings over time by sub-domain and key assignees',
      phaseRelevance: 'Phase 5 — Visualization',
    },
    {
      chartType: 'technology_landscape',
      title: 'Assignee-Technology Matrix',
      description: 'Heatmap of patent activity by assignee vs. technology sub-domain',
      phaseRelevance: 'Phase 5 — Visualization',
    },
    {
      chartType: 'geographic_distribution',
      title: 'Geographic Filing Heatmap',
      description: 'Where patents are being filed and granted by jurisdiction',
      phaseRelevance: 'Phase 5 — Visualization',
    },
  ],
  statusProgressMap: [
    { atPhase: 0, status: 'draft' },
    { atPhase: 1, status: 'scope_definition' },
    { atPhase: 2, status: 'data_collection' },
    { atPhase: 3, status: 'data_collection' },
    { atPhase: 4, status: 'patent_analysis' },
    { atPhase: 5, status: 'visualization' },
    { atPhase: 6, status: 'report_generation' },
    { atPhase: 7, status: 'completed' },
  ],
};

// ---------------------------------------------------------------------------
// WHITE SPACE ANALYSIS
// ---------------------------------------------------------------------------
const whiteSpaceConfig: ProjectWorkflowConfig = {
  displayName: 'White Space Analysis',
  purpose: 'Identify unpatented innovation opportunities within a technology domain',
  phases: [
    {
      id: 'domain_scoping',
      name: 'Technology Domain Scoping',
      description: 'Define the technology domain and identify the function and application axes for the matrix.',
      primaryTab: 'overview',
      steps: [
        'Define the primary technology domain',
        'Identify key functional dimensions (e.g., sensing, actuation, processing)',
        'Identify key application dimensions (e.g., automotive, medical, industrial)',
        'Define IPC/CPC code coverage',
      ],
    },
    {
      id: 'matrix_definition',
      name: 'Function-Application Matrix Definition',
      description: 'Build the function × application matrix that will reveal white spaces.',
      primaryTab: 'analysis',
      steps: [
        'Define function axis (rows)',
        'Define application axis (columns)',
        'Validate matrix coverage with domain experts',
        'Set density thresholds (sparse = <5 patents per cell)',
      ],
    },
    {
      id: 'landscape_mapping',
      name: 'Patent Landscape Mapping',
      description: 'Execute searches for each matrix cell and populate the matrix with patent counts.',
      primaryTab: 'research',
      steps: [
        'Execute search query for each matrix cell',
        'Record patent counts per cell',
        'Verify representative patents per cell',
        'Identify cells with zero or very few patents',
      ],
    },
    {
      id: 'gap_identification',
      name: 'Gap Identification & Scoring',
      description: 'Score each empty/sparse cell by technical feasibility and commercial opportunity.',
      primaryTab: 'reports',
      steps: [
        'List all sparse matrix cells (< threshold)',
        'Assess technical feasibility of each gap',
        'Assess commercial opportunity of each gap',
        'Calculate opportunity priority score',
      ],
    },
    {
      id: 'opportunity_prioritization',
      name: 'Opportunity Prioritization',
      description: 'Rank white space opportunities by priority score and strategic fit.',
      primaryTab: 'visualizations',
      steps: [
        'Rank gaps by opportunity priority score',
        'Filter by strategic fit with company capabilities',
        'Identify top 3-5 priority white spaces',
        'Define innovation concepts for each priority gap',
      ],
    },
    {
      id: 'innovation_mapping',
      name: 'Innovation Pathway Mapping',
      description: 'For each priority white space, map potential innovation pathways and filing strategies.',
      primaryTab: 'reports',
      steps: [
        'Define conceptual inventions for each priority gap',
        'Identify potential claims scope',
        'Assess freedom-to-operate in each white space',
        'Prioritize filing order',
      ],
    },
    {
      id: 'reporting',
      name: 'Reporting',
      description: 'Generate white space map report and filing opportunity recommendations.',
      primaryTab: 'reports',
      steps: [
        'Generate white space heat map visualization',
        'Prepare opportunity ranking report',
        'Draft innovation concept descriptions',
        'Compile strategic filing recommendations',
      ],
    },
  ],
  tabContexts: {
    research: {
      roleInWorkflow: 'Phase 3 — Patent Landscape Mapping',
      guidance: 'Run searches for each cell in the function × application matrix. The Matrix Search Builder will help generate queries per cell.',
      tips: [
        'Keep search queries consistent across cells for comparability',
        'Use AND logic to combine function and application keywords',
        'Document the specific query string used for each cell',
      ],
    },
    visualizations: {
      roleInWorkflow: 'Phase 5 — Opportunity Prioritization',
      guidance: 'The White Space Heatmap shows patent density per matrix cell. Green areas indicate sparse/unoccupied spaces (opportunities).',
      tips: [
        'Use the Opportunity Scoring Panel to rank gaps by priority',
        'Filter the heatmap by filing date to see emerging vs. established patterns',
      ],
    },
  },
  insightTypes: [
    'opportunity_identification',
    'white_space',
    'competitive_gap',
    'technology_emergence',
    'innovation_pathway',
    'filing_strategy',
  ],
  searchTemplates: [
    {
      label: 'Matrix Cell Search',
      description: 'Search for patents combining a specific function AND application',
      filterHints: ['Function keywords AND application keywords', 'IPC class filter', 'Date range'],
    },
    {
      label: 'Adjacent Domain Search',
      description: 'Search neighboring technology areas to understand context of white spaces',
      filterHints: ['Related IPC classes', 'Broader keyword set', 'Competitor activity'],
    },
  ],
  suggestedVisualizations: [
    {
      chartType: 'white_space_analysis',
      title: 'White Space Heatmap',
      description: 'Function × Application matrix colored by patent density (red=dense, green=sparse)',
      phaseRelevance: 'Phase 5 — Opportunity Prioritization',
    },
    {
      chartType: 'competitive_positioning',
      title: 'Opportunity Ranking Chart',
      description: 'Priority scores for each identified white space opportunity',
      phaseRelevance: 'Phase 5 — Opportunity Prioritization',
    },
  ],
  statusProgressMap: [
    { atPhase: 0, status: 'draft' },
    { atPhase: 1, status: 'scope_definition' },
    { atPhase: 2, status: 'scope_definition' },
    { atPhase: 3, status: 'data_collection' },
    { atPhase: 4, status: 'patent_analysis' },
    { atPhase: 5, status: 'visualization' },
    { atPhase: 6, status: 'report_generation' },
    { atPhase: 7, status: 'completed' },
  ],
};

// ---------------------------------------------------------------------------
// PORTFOLIO ASSESSMENT
// ---------------------------------------------------------------------------
const portfolioConfig: ProjectWorkflowConfig = {
  displayName: 'Portfolio Assessment',
  purpose: 'Evaluate the quality, coverage, and strategic value of an existing patent portfolio',
  phases: [
    {
      id: 'portfolio_inventory',
      name: 'Portfolio Inventory',
      description: 'Import and catalog all patents in the portfolio with key bibliographic data.',
      primaryTab: 'datasets',
      steps: [
        'Import portfolio from linked portfolio or spreadsheet',
        'Verify completeness of bibliographic data',
        'Tag patents by technology area',
        'Identify continuation families',
      ],
    },
    {
      id: 'quality_rating',
      name: 'Quality Rating & Tier Assignment',
      description: 'Assess each patent and assign to quality tiers (A/B/C/D).',
      primaryTab: 'datasets',
      steps: [
        'Review forward citation counts',
        'Assess claim scope (independent claim count and breadth)',
        'Evaluate technology lifecycle stage',
        'Assign Tier A/B/C/D to each patent',
      ],
    },
    {
      id: 'coverage_analysis',
      name: 'Coverage Analysis',
      description: 'Map portfolio coverage against technology areas and competitor activities.',
      primaryTab: 'analysis',
      steps: [
        'Map patents to technology sub-domains',
        'Identify coverage gaps vs. company products',
        'Compare coverage to competitor portfolios',
        'Identify over-covered and under-covered areas',
      ],
    },
    {
      id: 'competitive_benchmarking',
      name: 'Competitive Benchmarking',
      description: 'Benchmark portfolio quality and size against key competitors.',
      primaryTab: 'analysis',
      steps: [
        'Collect competitor portfolio data',
        'Compare portfolio size and quality metrics',
        'Identify competitor strengths and coverage gaps',
        'Assess IP strength relative to market share',
      ],
    },
    {
      id: 'maintenance_strategy',
      name: 'Maintenance Strategy',
      description: 'Identify patents to maintain, monetize, or abandon based on quality and coverage.',
      primaryTab: 'reports',
      steps: [
        'Flag Tier C/D patents as pruning candidates',
        'Calculate annual maintenance cost for pruning candidates',
        'Identify monetization opportunities for Tier A/B assets',
        'Develop 3-year maintenance budget forecast',
      ],
    },
    {
      id: 'expiry_planning',
      name: 'Expiry & Annuity Planning',
      description: 'Map expiry cliff and plan continuation filings to maintain strategic coverage.',
      primaryTab: 'visualizations',
      steps: [
        'Map patent expiry dates on a timeline',
        'Identify expiry cliffs (>20% portfolio expiring in single year)',
        'Evaluate continuation filing opportunities',
        'Plan annuity budget for next 3 years',
      ],
    },
    {
      id: 'reporting',
      name: 'Reporting',
      description: 'Generate portfolio scorecard, pruning recommendations, and maintenance budget.',
      primaryTab: 'reports',
      steps: [
        'Generate portfolio scorecard',
        'Compile pruning recommendation report',
        'Prepare maintenance budget forecast',
        'Draft executive portfolio health summary',
      ],
    },
  ],
  tabContexts: {
    datasets: {
      roleInWorkflow: 'Phase 1 — Portfolio Inventory',
      guidance: 'Import your portfolio using the Portfolio Import Wizard. Connect to a linked portfolio or upload a spreadsheet with patent numbers.',
      tips: [
        'Use the linked portfolio import for real-time data',
        'Include maintenance fee data for cost analysis',
        'Verify grant dates and expiry dates are correct',
      ],
    },
    visualizations: {
      roleInWorkflow: 'Phase 6 — Expiry Planning',
      guidance: 'Use portfolio visualization tools to identify expiry cliffs and coverage maps.',
      tips: [
        'Plot expiry dates by technology area to identify strategic gaps',
        'Use the maintenance cost forecast chart for budget planning',
      ],
    },
  },
  insightTypes: [
    'portfolio_quality',
    'coverage_gap',
    'pruning_candidate',
    'monetization_opportunity',
    'expiry_risk',
    'competitive_gap',
  ],
  searchTemplates: [
    {
      label: 'Portfolio Coverage Gap Search',
      description: 'Find patents in areas where your portfolio has coverage gaps',
      filterHints: ['Technology sub-domain', 'Filing date range', 'Competitor assignees'],
    },
    {
      label: 'Continuation Opportunity Search',
      description: 'Find pending applications to assess continuation filing opportunities',
      filterHints: ['Parent application number', 'Continuation type', 'Pending status'],
    },
  ],
  suggestedVisualizations: [
    {
      chartType: 'patent_timeline',
      title: 'Portfolio Age Profile',
      description: 'Distribution of patent ages and upcoming expiry dates',
      phaseRelevance: 'Phase 6 — Expiry Planning',
    },
    {
      chartType: 'geographic_distribution',
      title: 'Geographic Coverage Map',
      description: 'Where portfolio patents are granted across jurisdictions',
      phaseRelevance: 'Phase 3 — Coverage Analysis',
    },
    {
      chartType: 'risk_assessment',
      title: 'Maintenance Cost Forecast',
      description: 'Projected annual maintenance fees over next 5 years by tier',
      phaseRelevance: 'Phase 5 — Maintenance Strategy',
    },
  ],
  statusProgressMap: [
    { atPhase: 0, status: 'draft' },
    { atPhase: 1, status: 'data_collection' },
    { atPhase: 2, status: 'patent_analysis' },
    { atPhase: 3, status: 'patent_analysis' },
    { atPhase: 4, status: 'patent_analysis' },
    { atPhase: 5, status: 'visualization' },
    { atPhase: 6, status: 'report_generation' },
    { atPhase: 7, status: 'completed' },
  ],
};

// ---------------------------------------------------------------------------
// COMPETITIVE INTELLIGENCE
// ---------------------------------------------------------------------------
const competitiveConfig: ProjectWorkflowConfig = {
  displayName: 'Competitive Intelligence',
  purpose: 'Monitor and analyze competitor IP strategies, filing patterns, and technology focus',
  phases: [
    {
      id: 'competitor_identification',
      name: 'Competitor Identification',
      description: 'Identify direct and indirect competitors and define the competitive landscape.',
      primaryTab: 'analysis',
      steps: [
        'List primary direct competitors',
        'List emerging/indirect competitors',
        'Define technology sub-domains to monitor',
        'Set up competitor tracking profiles',
      ],
    },
    {
      id: 'filing_pattern_analysis',
      name: 'Filing Pattern Analysis',
      description: 'Analyze each competitor\'s patent filing patterns, volume, and jurisdictions.',
      primaryTab: 'research',
      steps: [
        'Collect 5-year filing history per competitor',
        'Compare filing volumes and trends',
        'Map geographic filing strategies',
        'Identify filing velocity changes',
      ],
    },
    {
      id: 'technology_focus',
      name: 'Technology Focus Analysis',
      description: 'Map each competitor\'s portfolio to identify their technology strengths and gaps.',
      primaryTab: 'analysis',
      steps: [
        'Classify competitor patents by sub-domain',
        'Build assignee-technology matrix',
        'Identify each competitor\'s primary and secondary technology focus',
        'Track changes in focus over time',
      ],
    },
    {
      id: 'claim_strength',
      name: 'Claim Strength Assessment',
      description: 'Evaluate the quality and strength of competitor patent claims.',
      primaryTab: 'reports',
      steps: [
        'Sample 20+ patents per competitor for claim analysis',
        'Assess claim breadth (independent claim scope)',
        'Review forward citation counts as quality proxy',
        'Calculate portfolio quality score per competitor',
      ],
    },
    {
      id: 'rd_direction',
      name: 'R&D Direction Prediction',
      description: 'Infer competitor R&D roadmap from patent filing patterns.',
      primaryTab: 'visualizations',
      steps: [
        'Track filing velocity by sub-domain per competitor',
        'Identify sub-domains with increasing filing rate',
        'Map filing patterns to known product announcements',
        'Forecast likely new technology areas',
      ],
    },
    {
      id: 'benchmarking',
      name: 'Benchmarking & Scoring',
      description: 'Create a competitive scorecard comparing IP strength across key dimensions.',
      primaryTab: 'analysis',
      steps: [
        'Build benchmarking matrix (portfolio size, quality, coverage, citations)',
        'Score each competitor on each dimension',
        'Identify competitive threats and opportunities',
        'Assess your company\'s relative position',
      ],
    },
    {
      id: 'reporting',
      name: 'Reporting',
      description: 'Generate competitor intelligence brief and benchmarking report.',
      primaryTab: 'reports',
      steps: [
        'Draft competitor intelligence brief per competitor',
        'Compile benchmarking comparison report',
        'Prepare executive competitive threat summary',
        'Document monitoring plan for ongoing tracking',
      ],
    },
  ],
  tabContexts: {
    research: {
      roleInWorkflow: 'Phase 2 — Filing Pattern Analysis',
      guidance: 'Use the Competitor Portfolio Tracker to run per-competitor searches and compare filing velocity.',
      tips: [
        'Use assignee search with name normalization for accurate results',
        'Include subsidiary company names in assignee searches',
      ],
    },
    visualizations: {
      roleInWorkflow: 'Phase 5 — R&D Direction Prediction',
      guidance: 'The Benchmarking Matrix and R&D Direction Tracker show competitor filing velocity by sub-domain.',
      tips: [
        'Sudden increases in filing velocity (>50% YoY) indicate active R&D programs',
        'Cross-reference with product announcements and press releases',
      ],
    },
  },
  insightTypes: [
    'competitive_gap',
    'competitive_threat',
    'rd_direction',
    'filing_velocity',
    'technology_focus',
    'market_position',
  ],
  searchTemplates: [
    {
      label: 'Competitor Portfolio Search',
      description: 'Comprehensive search of a specific competitor\'s patent portfolio',
      filterHints: ['Assignee name variants', 'Date range', 'Technology sub-domain'],
    },
    {
      label: 'Filing Velocity Search',
      description: 'Track recent filing activity of competitors in target technology areas',
      filterHints: ['Recent filings (2 years)', 'Specific assignees', 'Technology focus'],
    },
  ],
  suggestedVisualizations: [
    {
      chartType: 'competitive_positioning',
      title: 'Benchmarking Matrix',
      description: 'Multi-competitor scorecard across portfolio quality dimensions',
      phaseRelevance: 'Phase 6 — Benchmarking',
    },
    {
      chartType: 'filing_trends',
      title: 'Filing Velocity by Sub-Domain',
      description: 'Competitor filing rates over time by technology sub-domain',
      phaseRelevance: 'Phase 5 — R&D Direction',
    },
  ],
  statusProgressMap: [
    { atPhase: 0, status: 'draft' },
    { atPhase: 1, status: 'scope_definition' },
    { atPhase: 2, status: 'data_collection' },
    { atPhase: 3, status: 'patent_analysis' },
    { atPhase: 4, status: 'patent_analysis' },
    { atPhase: 5, status: 'visualization' },
    { atPhase: 6, status: 'report_generation' },
    { atPhase: 7, status: 'completed' },
  ],
};

// ---------------------------------------------------------------------------
// TECHNOLOGY TRENDS
// ---------------------------------------------------------------------------
const trendsConfig: ProjectWorkflowConfig = {
  displayName: 'Technology Trends',
  purpose: 'Track and forecast patent filing trends to anticipate technology evolution',
  phases: [
    {
      id: 'domain_scoping',
      name: 'Domain & Sub-Domain Scoping',
      description: 'Define the primary technology domain and sub-domains to track.',
      primaryTab: 'overview',
      steps: [
        'Define primary technology domain',
        'Identify 5-8 key sub-domains',
        'Define IPC/CPC classification codes per sub-domain',
        'Set analysis time horizon (5-20 years)',
      ],
    },
    {
      id: 'data_collection',
      name: 'Data Collection',
      description: 'Collect patent data for trend analysis across all sub-domains.',
      primaryTab: 'datasets',
      steps: [
        'Execute searches across all sub-domains',
        'Collect data for the full time horizon',
        'Ensure consistent methodology per sub-domain',
        'Validate data completeness',
      ],
    },
    {
      id: 'time_series',
      name: 'Time-Series Analysis',
      description: 'Build annual and quarterly filing trend data per sub-domain.',
      primaryTab: 'visualizations',
      steps: [
        'Build annual filing count time-series per sub-domain',
        'Calculate CAGR for each sub-domain',
        'Identify inflection points and acceleration events',
        'Compare relative growth rates across sub-domains',
      ],
    },
    {
      id: 'actor_analysis',
      name: 'Actor Analysis',
      description: 'Identify key filers and track entry/exit of actors per sub-domain.',
      primaryTab: 'analysis',
      steps: [
        'Identify top 10 filers per sub-domain',
        'Track actor entry and exit over time',
        'Identify university/startup vs. corporate filer mix',
        'Map geographic concentration of filers',
      ],
    },
    {
      id: 'scurve_modeling',
      name: 'S-Curve & Lifecycle Modeling',
      description: 'Model technology lifecycle stage for each sub-domain using S-curve analysis.',
      primaryTab: 'visualizations',
      steps: [
        'Fit S-curve model to filing trend data',
        'Classify each sub-domain by lifecycle stage',
        'Identify sub-domains in growth phase (investment signal)',
        'Identify sub-domains in maturity/decline (caution signal)',
      ],
    },
    {
      id: 'forecasting',
      name: 'Forecasting & Prediction',
      description: 'Generate 3-5 year forward projections for each sub-domain.',
      primaryTab: 'reports',
      steps: [
        'Apply trend extrapolation to each sub-domain',
        'Adjust for known market drivers and disruptions',
        'Generate high/base/low scenario forecasts',
        'Identify highest-confidence predictions',
      ],
    },
    {
      id: 'reporting',
      name: 'Reporting',
      description: 'Compile trend forecasting report and strategic recommendations.',
      primaryTab: 'reports',
      steps: [
        'Summarize findings per sub-domain',
        'Generate multi-domain comparison report',
        'Draft strategic technology investment recommendations',
        'Prepare technology roadmap alignment notes',
      ],
    },
  ],
  tabContexts: {
    visualizations: {
      roleInWorkflow: 'Phases 3 & 5 — Time-Series & S-Curve Modeling',
      guidance: 'The S-Curve Chart and Trend Timeline Chart are the primary outputs. Use them to identify lifecycle stages and inflection points.',
      tips: [
        'Use normalized filing counts (per 1,000 patents) for cross-domain comparison',
        'Identify citation burst events which often signal technology breakthroughs',
      ],
    },
    datasets: {
      roleInWorkflow: 'Phase 2 — Data Collection',
      guidance: 'Collect comprehensive filing data with consistent methodology across sub-domains.',
      tips: [
        'Use application date (not publication date) for accurate trend analysis',
        'Ensure data goes back at least 10 years for S-curve analysis',
      ],
    },
  },
  insightTypes: [
    'trend_analysis',
    'technology_emergence',
    'lifecycle_assessment',
    'actor_analysis',
    'forecasting',
    'convergence_signal',
  ],
  searchTemplates: [
    {
      label: 'Sub-Domain Trend Search',
      description: 'Collect complete annual filing data for a technology sub-domain',
      filterHints: ['IPC/CPC codes', '10-20 year date range', 'All jurisdictions'],
    },
    {
      label: 'Actor Activity Search',
      description: 'Track specific actors\' filing activity in a technology area over time',
      filterHints: ['Assignee list', 'Technology focus', 'Annual breakdown'],
    },
  ],
  suggestedVisualizations: [
    {
      chartType: 'filing_trends',
      title: 'Multi-Domain Trend Time-Series',
      description: 'Annual patent filings across all sub-domains on a single timeline',
      phaseRelevance: 'Phase 3 — Time-Series Analysis',
    },
    {
      chartType: 'technology_evolution',
      title: 'S-Curve Lifecycle Chart',
      description: 'Technology S-curves showing lifecycle stages per sub-domain',
      phaseRelevance: 'Phase 5 — S-Curve Modeling',
    },
  ],
  statusProgressMap: [
    { atPhase: 0, status: 'draft' },
    { atPhase: 1, status: 'scope_definition' },
    { atPhase: 2, status: 'data_collection' },
    { atPhase: 3, status: 'visualization' },
    { atPhase: 4, status: 'patent_analysis' },
    { atPhase: 5, status: 'visualization' },
    { atPhase: 6, status: 'report_generation' },
    { atPhase: 7, status: 'completed' },
  ],
};

// ---------------------------------------------------------------------------
// MARKET ANALYSIS
// ---------------------------------------------------------------------------
const marketConfig: ProjectWorkflowConfig = {
  displayName: 'Market Analysis',
  purpose: 'Analyze IP landscape in context of market dynamics and competitive positioning',
  phases: [
    {
      id: 'market_definition',
      name: 'Market Definition',
      description: 'Define the target market, segments, and corresponding technology domains.',
      primaryTab: 'overview',
      steps: [
        'Define target market and key segments',
        'Map market segments to technology domains',
        'Identify key market players',
        'Define market size and growth metrics',
      ],
    },
    {
      id: 'competitive_landscape',
      name: 'Competitive Landscape Mapping',
      description: 'Build a comprehensive map of IP activity across market participants.',
      primaryTab: 'analysis',
      steps: [
        'Identify all IP-active market participants',
        'Collect portfolio sizes and key technology areas',
        'Map market share data by participant',
        'Identify IP-strong vs. IP-weak market players',
      ],
    },
    {
      id: 'ip_market_correlation',
      name: 'IP-Market Correlation Analysis',
      description: 'Correlate patent activity with market growth and product launches.',
      primaryTab: 'visualizations',
      steps: [
        'Plot patent filing trends vs. market revenue trends',
        'Identify lag/lead relationships between IP and market activity',
        'Note product-to-patent relationships for key players',
        'Assess predictive value of IP activity for market trends',
      ],
    },
    {
      id: 'competitive_positioning',
      name: 'Competitive Positioning Assessment',
      description: 'Assess relative competitive position based on IP strength vs. market share.',
      primaryTab: 'reports',
      steps: [
        'Calculate IP strength score per participant',
        'Map IP strength vs. market share in a positioning matrix',
        'Identify IP-heavy/market-light players (licensing opportunities)',
        'Identify market-heavy/IP-light players (acquisition targets)',
      ],
    },
    {
      id: 'white_space',
      name: 'White Space & Opportunity Mapping',
      description: 'Identify market segments with low IP activity representing entry opportunities.',
      primaryTab: 'research',
      steps: [
        'Map IP density by market segment',
        'Identify segments with low IP density and high market growth',
        'Assess freedom-to-operate in low-density segments',
        'Calculate opportunity priority scores',
      ],
    },
    {
      id: 'strategy_recommendations',
      name: 'Strategic Recommendations',
      description: 'Develop IP strategy recommendations based on market and IP analysis.',
      primaryTab: 'reports',
      steps: [
        'Identify top strategic IP priorities',
        'Recommend offensive/defensive IP actions',
        'Identify M&A or licensing opportunities',
        'Define monitoring and review schedule',
      ],
    },
    {
      id: 'reporting',
      name: 'Reporting',
      description: 'Compile market analysis report with IP-market correlation findings.',
      primaryTab: 'reports',
      steps: [
        'Draft market IP landscape report',
        'Compile competitive positioning summary',
        'Prepare strategic recommendations document',
        'Executive briefing on key findings',
      ],
    },
  ],
  tabContexts: {
    visualizations: {
      roleInWorkflow: 'Phase 3 — IP-Market Correlation',
      guidance: 'Use the Market IP Correlation Chart and Competitive Positioning Map to visualize the relationship between IP activity and market dynamics.',
      tips: [
        'Use dual-axis charts to overlay IP filings with market revenue data',
        'Look for 3-5 year lag between patent filing and product launch',
      ],
    },
    research: {
      roleInWorkflow: 'Phase 5 — White Space Mapping',
      guidance: 'Search for patent activity by market segment to identify IP density distribution.',
      tips: [
        'Map search results to market segments, not just technology domains',
        'Include regulatory filings and standards documents in your search',
      ],
    },
  },
  insightTypes: [
    'market_position',
    'opportunity_identification',
    'competitive_gap',
    'ip_market_correlation',
    'white_space',
    'strategic_recommendation',
  ],
  searchTemplates: [
    {
      label: 'Market Segment IP Search',
      description: 'Find all patent activity in a specific market segment',
      filterHints: ['Market segment keywords', 'Application domain', 'Key assignees'],
    },
    {
      label: 'Emerging Player Search',
      description: 'Find new IP entrants in high-growth market segments',
      filterHints: ['Recent filings', 'New assignees', 'High-growth segments'],
    },
  ],
  suggestedVisualizations: [
    {
      chartType: 'competitive_positioning',
      title: 'IP Strength vs. Market Share Matrix',
      description: 'Position each market participant on IP strength vs. market share axes',
      phaseRelevance: 'Phase 4 — Competitive Positioning',
    },
    {
      chartType: 'filing_trends',
      title: 'Market IP Correlation Chart',
      description: 'Overlay patent filing trends with market revenue growth',
      phaseRelevance: 'Phase 3 — IP-Market Correlation',
    },
  ],
  statusProgressMap: [
    { atPhase: 0, status: 'draft' },
    { atPhase: 1, status: 'scope_definition' },
    { atPhase: 2, status: 'data_collection' },
    { atPhase: 3, status: 'visualization' },
    { atPhase: 4, status: 'patent_analysis' },
    { atPhase: 5, status: 'patent_analysis' },
    { atPhase: 6, status: 'report_generation' },
    { atPhase: 7, status: 'completed' },
  ],
};

// ---------------------------------------------------------------------------
// INVESTMENT ANALYSIS
// ---------------------------------------------------------------------------
const investmentConfig: ProjectWorkflowConfig = {
  displayName: 'Investment Analysis',
  purpose: 'Evaluate patent portfolios as part of M&A, investment, or acquisition due diligence',
  phases: [
    {
      id: 'asset_identification',
      name: 'Asset Identification',
      description: 'Identify and catalog the patent assets under review.',
      primaryTab: 'datasets',
      steps: [
        'Obtain complete list of target patent assets',
        'Identify patent families and continuation chains',
        'Confirm ownership and legal status',
        'Map to target product lines or technology areas',
      ],
    },
    {
      id: 'ownership_dd',
      name: 'Due Diligence — Ownership & Chain',
      description: 'Verify ownership chain, encumbrances, and third-party rights.',
      primaryTab: 'research',
      steps: [
        'Verify inventor-to-company assignment chain',
        'Check for liens, security interests, or encumbrances',
        'Identify exclusive licenses or other encumbrances',
        'Confirm ownership of foreign counterparts',
      ],
    },
    {
      id: 'quality_dd',
      name: 'Due Diligence — Quality Assessment',
      description: 'Assess patent quality, claim strength, and invalidity risks.',
      primaryTab: 'datasets',
      steps: [
        'Review independent claims for breadth and specificity',
        'Assess prior art risk (citation-based invalidity analysis)',
        'Flag IPR/PGR petition vulnerability',
        'Calculate quality score for each patent',
      ],
    },
    {
      id: 'valuation',
      name: 'Portfolio Valuation',
      description: 'Apply income, market, and cost approaches to value the portfolio.',
      primaryTab: 'visualizations',
      steps: [
        'Apply relief-from-royalty income approach',
        'Research comparable patent transactions',
        'Calculate replacement cost estimate',
        'Weight and combine approach estimates',
      ],
    },
    {
      id: 'risk_assessment',
      name: 'Risk Assessment',
      description: 'Identify and quantify risks: invalidity, encumbrances, expiry cliff.',
      primaryTab: 'reports',
      steps: [
        'Quantify invalidity risk per patent',
        'Identify encumbrance risks',
        'Map expiry cliff (>30% expiring within 3 years)',
        'Calculate risk-adjusted portfolio value',
      ],
    },
    {
      id: 'portfolio_summary',
      name: 'Portfolio Value Summary',
      description: 'Compile weighted quality score and final valuation summary.',
      primaryTab: 'visualizations',
      steps: [
        'Calculate weighted quality score across portfolio',
        'Compile final valuation range (low/mid/high)',
        'Identify key value drivers and risks',
        'Prepare investment recommendation',
      ],
    },
    {
      id: 'reporting',
      name: 'Investment Report',
      description: 'Generate due diligence report and investment recommendation.',
      primaryTab: 'reports',
      steps: [
        'Compile due diligence findings report',
        'Draft investment recommendation',
        'Prepare risk-adjusted valuation summary',
        'Final executive briefing document',
      ],
    },
  ],
  tabContexts: {
    datasets: {
      roleInWorkflow: 'Phase 1 — Asset Identification',
      guidance: 'Use the Due Diligence Checklist to ensure complete asset identification including all foreign counterparts and pending applications.',
      tips: [
        'Include provisional applications and PCT applications',
        'Verify that all family members are included',
        'Cross-reference with product IP registers',
      ],
    },
    research: {
      roleInWorkflow: 'Phase 2 — Ownership Due Diligence',
      guidance: 'Verify ownership chain and check for encumbrances. Search for recorded assignments and security interests.',
      tips: [
        'Search USPTO assignment database for each patent',
        'Check for UCC filings that may encumber IP',
        'Review any out-license agreements disclosed in data room',
      ],
    },
    visualizations: {
      roleInWorkflow: 'Phases 4 & 6 — Valuation',
      guidance: 'Use the Portfolio Value Summary and Sensitivity Analysis Chart to present valuation ranges and key value drivers.',
      tips: [
        'Always present a range (conservative/base/optimistic) not a single point estimate',
        'Show how valuation changes with different royalty rate assumptions',
      ],
    },
  },
  insightTypes: [
    'risk_assessment',
    'portfolio_quality',
    'expiry_risk',
    'ownership_risk',
    'valuation_estimate',
    'investment_recommendation',
  ],
  searchTemplates: [
    {
      label: 'Ownership Verification Search',
      description: 'Verify assignment chain and ownership for each patent',
      filterHints: ['Patent number', 'Assignment records', 'Encumbrance check'],
    },
    {
      label: 'Prior Art Invalidity Search',
      description: 'Search for prior art that may threaten patent validity',
      filterHints: ['Priority date cutoff', 'Claim keywords', 'All jurisdictions'],
    },
  ],
  suggestedVisualizations: [
    {
      chartType: 'risk_assessment',
      title: 'Portfolio Value Summary',
      description: 'Weighted quality score and valuation range for the portfolio',
      phaseRelevance: 'Phase 6 — Portfolio Summary',
    },
    {
      chartType: 'patent_timeline',
      title: 'Expiry Cliff Chart',
      description: 'Number of patents expiring per year over next 10 years',
      phaseRelevance: 'Phase 5 — Risk Assessment',
    },
  ],
  statusProgressMap: [
    { atPhase: 0, status: 'draft' },
    { atPhase: 1, status: 'data_collection' },
    { atPhase: 2, status: 'data_collection' },
    { atPhase: 3, status: 'patent_analysis' },
    { atPhase: 4, status: 'patent_analysis' },
    { atPhase: 5, status: 'visualization' },
    { atPhase: 6, status: 'report_generation' },
    { atPhase: 7, status: 'completed' },
  ],
};

// ---------------------------------------------------------------------------
// LITIGATION ANALYSIS
// ---------------------------------------------------------------------------
const litigationConfig: ProjectWorkflowConfig = {
  displayName: 'Litigation Analysis',
  purpose: 'Analyze litigation risk, claim strength, and strategic options for patent disputes',
  phases: [
    {
      id: 'case_identification',
      name: 'Case Identification',
      description: 'Identify all relevant patent cases, parties, and asserted patents.',
      primaryTab: 'overview',
      steps: [
        'Identify all asserted patents',
        'Map all parties (plaintiff, defendants, co-defendants)',
        'Review case status and venue',
        'Obtain complaint and claim charts if available',
      ],
    },
    {
      id: 'party_analysis',
      name: 'Plaintiff / Defendant Analysis',
      description: 'Analyze litigation history and patterns of all involved parties.',
      primaryTab: 'analysis',
      steps: [
        'Research plaintiff litigation history',
        'Analyze settlement vs. trial patterns',
        'Identify NPE vs. operating company plaintiff',
        'Map defendant responses and counterclaims in similar cases',
      ],
    },
    {
      id: 'prior_art',
      name: 'Prior Art Analysis',
      description: 'Search for prior art to invalidate asserted claims.',
      primaryTab: 'research',
      steps: [
        'Execute prior art searches per asserted claim',
        'Search academic literature and technical publications',
        'Check foreign patent filings as prior art',
        'Identify IPR petition candidates',
      ],
    },
    {
      id: 'claim_construction',
      name: 'Claim Construction & Validity',
      description: 'Analyze claim scope, construction, and validity risks.',
      primaryTab: 'datasets',
      steps: [
        'Parse all independent claims of asserted patents',
        'Assess prosecution history estoppel',
        'Evaluate obviousness and anticipation risks',
        'Map identified prior art to claim elements',
      ],
    },
    {
      id: 'damages',
      name: 'Damages Estimation',
      description: 'Estimate potential damages using reasonable royalty and lost profits analyses.',
      primaryTab: 'reports',
      steps: [
        'Apply Georgia-Pacific factor framework',
        'Research comparable license rates',
        'Calculate reasonable royalty damages range',
        'Estimate lost profits if applicable',
      ],
    },
    {
      id: 'venue_analysis',
      name: 'Venue & Judge Analysis',
      description: 'Analyze venue characteristics and judge history for strategic insight.',
      primaryTab: 'research',
      steps: [
        'Research venue patent case statistics',
        'Review assigned judge\'s patent decisions',
        'Assess likelihood of transfer motion success',
        'Evaluate jury vs. bench trial preference',
      ],
    },
    {
      id: 'settlement_analysis',
      name: 'Settlement vs. Trial Analysis',
      description: 'Evaluate settlement options and expected value of litigation paths.',
      primaryTab: 'reports',
      steps: [
        'Calculate expected value of trial outcome',
        'Assess cost of litigation to completion',
        'Identify settlement structure options',
        'Compare expected values of each path',
      ],
    },
    {
      id: 'risk_matrix',
      name: 'Litigation Risk Matrix',
      description: 'Compile comprehensive risk assessment and strategic recommendation.',
      primaryTab: 'reports',
      steps: [
        'Build probability × severity risk matrix',
        'Document key vulnerabilities and strengths',
        'Prepare litigation strategy options',
        'Executive briefing on litigation risk',
      ],
    },
  ],
  tabContexts: {
    research: {
      roleInWorkflow: 'Phases 3 & 6 — Prior Art & Venue Analysis',
      guidance: 'Use the Prior Art & Case Search for prior art searches. Search technical literature, foreign patents, and PTAB proceedings.',
      tips: [
        'Search both patent and non-patent literature',
        'Priority date of asserted patents defines prior art cutoff',
        'PTAB IPR proceedings can be a key defense strategy',
      ],
    },
  },
  insightTypes: [
    'risk_assessment',
    'validity_risk',
    'damages_estimate',
    'settlement_analysis',
    'prior_art_relevance',
    'claim_construction',
  ],
  searchTemplates: [
    {
      label: 'Prior Art Search',
      description: 'Search for prior art to invalidate specific patent claims',
      filterHints: ['Priority date cutoff', 'Claim element keywords', 'All jurisdictions and NPL'],
    },
    {
      label: 'Comparable License Search',
      description: 'Find comparable patent license agreements for royalty rate analysis',
      filterHints: ['Technology area', 'Comparable licensors', 'SEC filing searches'],
    },
    {
      label: 'PTAB IPR Search',
      description: 'Search for existing PTAB proceedings against the asserted patents',
      filterHints: ['Patent numbers', 'PTAB database', 'Institution decision history'],
    },
  ],
  suggestedVisualizations: [
    {
      chartType: 'risk_assessment',
      title: 'Litigation Risk Matrix',
      description: 'Probability × severity matrix for all identified litigation risks',
      phaseRelevance: 'Phase 8 — Risk Matrix',
    },
    {
      chartType: 'filing_trends',
      title: 'Assertion Pattern Timeline',
      description: 'Plaintiff\'s case filing history by year and technology area',
      phaseRelevance: 'Phase 2 — Party Analysis',
    },
  ],
  statusProgressMap: [
    { atPhase: 0, status: 'draft' },
    { atPhase: 1, status: 'scope_definition' },
    { atPhase: 2, status: 'data_collection' },
    { atPhase: 3, status: 'data_collection' },
    { atPhase: 4, status: 'patent_analysis' },
    { atPhase: 5, status: 'patent_analysis' },
    { atPhase: 6, status: 'visualization' },
    { atPhase: 7, status: 'report_generation' },
    { atPhase: 8, status: 'completed' },
  ],
};

// ---------------------------------------------------------------------------
// LICENSING ANALYSIS
// ---------------------------------------------------------------------------
const licensingConfig: ProjectWorkflowConfig = {
  displayName: 'Licensing Analysis',
  purpose: 'Develop and execute a patent licensing program with royalty benchmarking',
  phases: [
    {
      id: 'portfolio_assessment',
      name: 'Patent Portfolio Assessment',
      description: 'Identify the patents to include in the licensing program.',
      primaryTab: 'datasets',
      steps: [
        'Identify licensing-grade patents (Tier A/B quality)',
        'Verify legal status and ownership',
        'Map patents to product categories',
        'Prioritize patents by licensing potential',
      ],
    },
    {
      id: 'licensee_identification',
      name: 'Licensee Identification',
      description: 'Identify potential licensees who practice the patented technology.',
      primaryTab: 'research',
      steps: [
        'Identify companies likely practicing the patented claims',
        'Research each target\'s financial profile',
        'Prioritize targets by revenue and IP exposure',
        'Map claim coverage to target products',
      ],
    },
    {
      id: 'royalty_benchmarking',
      name: 'Royalty Benchmarking',
      description: 'Research comparable royalty rates using the Georgia-Pacific framework.',
      primaryTab: 'reports',
      steps: [
        'Apply Georgia-Pacific factors to each patent/target pair',
        'Research industry-standard royalty rates',
        'Identify comparable patent license agreements',
        'Calculate royalty rate range (floor, midpoint, ceiling)',
      ],
    },
    {
      id: 'negotiation_strategy',
      name: 'Negotiation Strategy',
      description: 'Define licensing terms, structure, and negotiation strategy per target.',
      primaryTab: 'reports',
      steps: [
        'Define target license structure (running royalty, lump sum, hybrid)',
        'Set opening position and walk-away point',
        'Identify non-monetary terms of value (cross-license, technical data)',
        'Develop litigation/PTAB leverage strategy',
      ],
    },
    {
      id: 'program_structure',
      name: 'Licensing Program Structure',
      description: 'Define the overall licensing program structure and outreach approach.',
      primaryTab: 'analysis',
      steps: [
        'Define licensing program tiers (standard, premium, custom)',
        'Set standard licensing terms and pricing',
        'Create licensee identification and outreach plan',
        'Set revenue targets and timeline',
      ],
    },
    {
      id: 'revenue_forecast',
      name: 'Revenue Forecasting',
      description: 'Build a revenue forecast model for the licensing program.',
      primaryTab: 'visualizations',
      steps: [
        'Estimate conversion rate from outreach to license',
        'Calculate expected revenue per licensee tier',
        'Build 3-year revenue forecast model',
        'Calculate NPV of licensing program',
      ],
    },
    {
      id: 'reporting',
      name: 'Reporting',
      description: 'Compile licensing program summary and revenue forecast report.',
      primaryTab: 'reports',
      steps: [
        'Compile licensing program overview report',
        'Generate licensee identification summary',
        'Prepare revenue forecast report',
        'Draft executive licensing strategy memo',
      ],
    },
  ],
  tabContexts: {
    research: {
      roleInWorkflow: 'Phase 2 — Licensee Identification',
      guidance: 'Use the Royalty Comparable Search to find companies practicing the patented technology and comparable license agreements.',
      tips: [
        'Search for companies with products that match your patent claims',
        'Check for already-licensed competitors as evidence of licensability',
        'Search SEC filings for disclosed license agreements',
      ],
    },
    visualizations: {
      roleInWorkflow: 'Phase 6 — Revenue Forecasting',
      guidance: 'Use the Licensing Footprint Map and Royalty Rate Range Chart to visualize program scope and expected returns.',
      tips: [
        'Show sensitivity analysis varying conversion rate assumptions',
        'Break forecast by license type (running royalty vs. lump sum)',
      ],
    },
  },
  insightTypes: [
    'licensing_opportunity',
    'royalty_benchmark',
    'licensee_identification',
    'claim_coverage',
    'revenue_forecast',
    'negotiation_strategy',
  ],
  searchTemplates: [
    {
      label: 'Licensee Identification Search',
      description: 'Find companies whose products practice the patented claims',
      filterHints: ['Technology area', 'Product category keywords', 'Revenue range filter'],
    },
    {
      label: 'Comparable License Search',
      description: 'Find publicly disclosed comparable patent license agreements',
      filterHints: ['SEC EDGAR filings', 'Litigation settlement terms', 'Industry reports'],
    },
  ],
  suggestedVisualizations: [
    {
      chartType: 'competitive_positioning',
      title: 'Licensing Footprint Map',
      description: 'Table of identified licensees with claim coverage and revenue estimates',
      phaseRelevance: 'Phase 2 — Licensee Identification',
    },
    {
      chartType: 'filing_trends',
      title: 'Royalty Rate Range Chart',
      description: 'Royalty rate benchmarks across comparable license agreements',
      phaseRelevance: 'Phase 3 — Royalty Benchmarking',
    },
  ],
  statusProgressMap: [
    { atPhase: 0, status: 'draft' },
    { atPhase: 1, status: 'data_collection' },
    { atPhase: 2, status: 'data_collection' },
    { atPhase: 3, status: 'patent_analysis' },
    { atPhase: 4, status: 'patent_analysis' },
    { atPhase: 5, status: 'visualization' },
    { atPhase: 6, status: 'report_generation' },
    { atPhase: 7, status: 'completed' },
  ],
};

// ---------------------------------------------------------------------------
// VALUATION ANALYSIS
// ---------------------------------------------------------------------------
const valuationConfig: ProjectWorkflowConfig = {
  displayName: 'Patent Valuation',
  purpose: 'Value a patent or portfolio using income, market, and cost approaches',
  phases: [
    {
      id: 'portfolio_definition',
      name: 'Patent Portfolio Definition',
      description: 'Define the scope of patents to be valued and gather all required data.',
      primaryTab: 'datasets',
      steps: [
        'Import all patents to be valued',
        'Verify legal status and remaining life',
        'Gather financial data (revenue from patented products)',
        'Identify licensed counterparts for market data',
      ],
    },
    {
      id: 'income_approach',
      name: 'Income Approach Analysis',
      description: 'Apply relief-from-royalty method to estimate patent value.',
      primaryTab: 'visualizations',
      steps: [
        'Define royalty base (licensed revenue)',
        'Select royalty rate using Georgia-Pacific framework',
        'Project royalty income over patent remaining life',
        'Discount to NPV using appropriate discount rate',
      ],
    },
    {
      id: 'market_approach',
      name: 'Market Approach Analysis',
      description: 'Research comparable patent transactions to establish market value.',
      primaryTab: 'research',
      steps: [
        'Identify comparable patent transactions (sales, licenses)',
        'Adjust comparables for patent quality and remaining life',
        'Calculate implied value range from comparables',
        'Weight comparable transaction evidence',
      ],
    },
    {
      id: 'cost_approach',
      name: 'Cost Approach Analysis',
      description: 'Estimate reproduction and replacement cost as a value floor.',
      primaryTab: 'reports',
      steps: [
        'Estimate R&D cost to reproduce the patented invention',
        'Adjust for obsolescence and remaining life',
        'Calculate replacement cost with modern equivalents',
        'Use as value floor check on other approaches',
      ],
    },
    {
      id: 'sensitivity_analysis',
      name: 'Sensitivity Analysis',
      description: 'Model bear/base/bull scenarios and key value driver sensitivities.',
      primaryTab: 'visualizations',
      steps: [
        'Define bear/base/bull scenario assumptions',
        'Calculate value under each scenario',
        'Build tornado chart of key value drivers',
        'Present confidence interval for final value estimate',
      ],
    },
    {
      id: 'final_report',
      name: 'Final Valuation Report',
      description: 'Compile valuation conclusions and final report.',
      primaryTab: 'reports',
      steps: [
        'Reconcile estimates from all three approaches',
        'Select primary and secondary approaches',
        'Document key assumptions and risks',
        'Compile final valuation report',
      ],
    },
  ],
  tabContexts: {
    visualizations: {
      roleInWorkflow: 'Phases 2 & 5 — Income Approach & Sensitivity Analysis',
      guidance: 'The Valuation Calculator Panel implements the relief-from-royalty NPV calculation. The Sensitivity Analysis Chart shows value ranges under different assumptions.',
      tips: [
        'Use a discount rate that reflects the risk profile of the patent (typically 15-30% for patents)',
        'Show the tornado chart to highlight which assumptions have the most impact on value',
      ],
    },
    research: {
      roleInWorkflow: 'Phase 3 — Market Approach',
      guidance: 'Search for comparable patent transactions — both sales and licenses — to anchor the market approach valuation.',
      tips: [
        'Patent transactions database (Ktmine, IAM, Ocean Tomo) are primary sources',
        'SEC filings often disclose patent purchase prices and license terms',
      ],
    },
    datasets: {
      roleInWorkflow: 'Phase 1 — Portfolio Definition',
      guidance: 'Import all patents with remaining life data and any financial metrics (licensed revenue, royalty rates).',
      tips: [
        'Include patent expiry dates for NPV calculation',
        'Gather comparable transaction data as a separate dataset',
      ],
    },
  },
  insightTypes: [
    'valuation_estimate',
    'risk_assessment',
    'royalty_benchmark',
    'income_projection',
    'market_comparable',
    'cost_estimate',
  ],
  searchTemplates: [
    {
      label: 'Comparable Transaction Search',
      description: 'Find comparable patent sale and license transactions for market approach',
      filterHints: ['Technology area', 'Transaction date range', 'Patent quality tier'],
    },
    {
      label: 'Royalty Rate Research',
      description: 'Research industry royalty rates for relief-from-royalty income approach',
      filterHints: ['Industry sector', 'Patent type', 'Comparable licensors'],
    },
  ],
  suggestedVisualizations: [
    {
      chartType: 'risk_assessment',
      title: 'Sensitivity Analysis Chart',
      description: 'Bear/base/bull scenario value ranges and tornado chart of key drivers',
      phaseRelevance: 'Phase 5 — Sensitivity Analysis',
    },
    {
      chartType: 'patent_timeline',
      title: 'NPV Waterfall Chart',
      description: 'Year-by-year contribution to NPV over remaining patent life',
      phaseRelevance: 'Phase 2 — Income Approach',
    },
  ],
  statusProgressMap: [
    { atPhase: 0, status: 'draft' },
    { atPhase: 1, status: 'data_collection' },
    { atPhase: 2, status: 'patent_analysis' },
    { atPhase: 3, status: 'patent_analysis' },
    { atPhase: 4, status: 'visualization' },
    { atPhase: 5, status: 'report_generation' },
    { atPhase: 6, status: 'completed' },
  ],
};

// ---------------------------------------------------------------------------
// PATENT MAPPING
// ---------------------------------------------------------------------------
const patentMappingConfig: ProjectWorkflowConfig = {
  displayName: 'Patent Mapping',
  purpose: 'Build structured maps linking patents to technologies, features, and products',
  phases: [
    {
      id: 'domain_scoping',
      name: 'Technology Domain Scoping',
      description: 'Define the technology domain and mapping framework.',
      primaryTab: 'overview',
      steps: [
        'Define the technology domain',
        'Identify mapping framework (product features, technology sub-domains)',
        'Set scope boundaries',
        'Define IPC/CPC coverage',
      ],
    },
    {
      id: 'classification_framework',
      name: 'Classification Framework',
      description: 'Build the classification taxonomy for the patent map.',
      primaryTab: 'analysis',
      steps: [
        'Define primary classification categories',
        'Define sub-categories',
        'Set classification rules',
        'Validate framework with domain experts',
      ],
    },
    {
      id: 'data_collection',
      name: 'Data Collection',
      description: 'Collect relevant patents for the map.',
      primaryTab: 'datasets',
      steps: [
        'Execute searches across all categories',
        'Import data into datasets',
        'Deduplicate and normalize',
        'Validate data completeness',
      ],
    },
    {
      id: 'patent_mapping',
      name: 'Patent-to-Feature Mapping',
      description: 'Classify and map patents to the framework categories.',
      primaryTab: 'datasets',
      steps: [
        'Classify patents into taxonomy categories',
        'Map patents to product features where applicable',
        'Verify classification accuracy',
        'Note any patents spanning multiple categories',
      ],
    },
    {
      id: 'visualization',
      name: 'Visualization',
      description: 'Generate technology map visualizations.',
      primaryTab: 'visualizations',
      steps: [
        'Build technology map heatmap',
        'Generate competitor overlay view',
        'Create patent density visualization',
        'Export interactive map',
      ],
    },
    {
      id: 'gap_analysis',
      name: 'Gap Analysis',
      description: 'Identify gaps in coverage relative to products and competitor activity.',
      primaryTab: 'reports',
      steps: [
        'Identify technology areas with no patent coverage',
        'Compare coverage to competitor maps',
        'Flag strategic gaps for further action',
        'Prioritize gaps by strategic importance',
      ],
    },
    {
      id: 'reporting',
      name: 'Reporting',
      description: 'Compile technology map report and strategic recommendations.',
      primaryTab: 'reports',
      steps: [
        'Generate technology map report',
        'Compile gap analysis findings',
        'Draft strategic recommendations',
        'Prepare stakeholder presentation',
      ],
    },
  ],
  tabContexts: {
    visualizations: {
      roleInWorkflow: 'Phase 5 — Visualization',
      guidance: 'Build the technology map using the landscape chart suite and heatmap tools.',
      tips: [
        'Use color coding to distinguish your portfolio vs. competitor patents',
        'Add interactive filtering by filing date for temporal analysis',
      ],
    },
  },
  insightTypes: [
    'coverage_gap',
    'technology_emergence',
    'competitive_gap',
    'white_space',
    'mapping_insight',
    'strategic_recommendation',
  ],
  searchTemplates: [
    {
      label: 'Category Coverage Search',
      description: 'Search patents for a specific taxonomy category',
      filterHints: ['Category IPC/CPC codes', 'Category keywords', 'Date range'],
    },
    {
      label: 'Feature-Patent Mapping Search',
      description: 'Find patents that cover specific product features',
      filterHints: ['Feature keywords', 'Claim analysis', 'Assignee filter'],
    },
  ],
  suggestedVisualizations: [
    {
      chartType: 'technology_landscape',
      title: 'Technology Map Heatmap',
      description: 'Patent density by taxonomy category with competitor overlay',
      phaseRelevance: 'Phase 5 — Visualization',
    },
    {
      chartType: 'competitive_positioning',
      title: 'Coverage Gap Analysis',
      description: 'Gaps in coverage relative to products and competitor activity',
      phaseRelevance: 'Phase 6 — Gap Analysis',
    },
  ],
  statusProgressMap: [
    { atPhase: 0, status: 'draft' },
    { atPhase: 1, status: 'scope_definition' },
    { atPhase: 2, status: 'data_collection' },
    { atPhase: 3, status: 'data_collection' },
    { atPhase: 4, status: 'patent_analysis' },
    { atPhase: 5, status: 'visualization' },
    { atPhase: 6, status: 'report_generation' },
    { atPhase: 7, status: 'completed' },
  ],
};

// ---------------------------------------------------------------------------
// REGISTRY
// ---------------------------------------------------------------------------
export const WORKFLOW_CONFIGS: Record<string, ProjectWorkflowConfig> = {
  fto_analysis: ftoConfig,
  landscape_analysis: landscapeConfig,
  white_space_analysis: whiteSpaceConfig,
  portfolio_assessment: portfolioConfig,
  competitive_intelligence: competitiveConfig,
  technology_trends: trendsConfig,
  market_analysis: marketConfig,
  investment_analysis: investmentConfig,
  litigation_analysis: litigationConfig,
  licensing_analysis: licensingConfig,
  valuation_analysis: valuationConfig,
  patent_mapping: patentMappingConfig,
};

export function getWorkflowConfig(projectType: string | undefined): ProjectWorkflowConfig | null {
  if (!projectType) return null;
  return WORKFLOW_CONFIGS[projectType] ?? null;
}

export function computePhaseProgress(
  phases: WorkflowPhase[],
  phaseProgress: PhaseProgress,
): { completedPhases: number; totalStepsCompleted: number; totalSteps: number; overallPct: number } {
  let completedPhases = 0;
  let totalStepsCompleted = 0;
  let totalSteps = 0;

  for (const phase of phases) {
    const prog = phaseProgress[phase.id];
    const completed = prog?.completed_steps ?? [];
    totalSteps += phase.steps.length;
    totalStepsCompleted += completed.length;
    if (completed.length === phase.steps.length && phase.steps.length > 0) {
      completedPhases++;
    }
  }

  const overallPct = totalSteps > 0 ? Math.round((totalStepsCompleted / totalSteps) * 100) : 0;
  return { completedPhases, totalStepsCompleted, totalSteps, overallPct };
}

export function getStatusForPhaseCount(
  statusProgressMap: StatusProgressEntry[],
  completedPhases: number,
): string {
  let currentStatus = 'draft';
  for (const entry of statusProgressMap) {
    if (completedPhases >= entry.atPhase) {
      currentStatus = entry.status;
    }
  }
  return currentStatus;
}
