/**
 * Prior Art Search - Patentability Workflow Template
 * Comprehensive workflow for conducting thorough prior art searches and patentability analysis
 */

import { WorkflowTemplate, WorkflowStep, StepType } from '../types/workflow.types';

export const priorArtSearchTemplate: WorkflowTemplate = {
  id: 'prior-art-search-001',
  name: 'Prior Art Search - Patentability Analysis',
  description: 'Comprehensive workflow for conducting thorough prior art searches, analyzing patentability, and generating detailed reports for patent applications. Includes AI-assisted search strategies, citation analysis, and legal opinion generation.',
  category: 'Prior Art & Patentability',
  version: '3.2.0',
  isActive: true,
  requireSequential: false,
  autoAssign: true,
  estimatedDuration: 7, // days
  successRate: 96.5,
  usageCount: 342,
  tags: [
    'prior-art',
    'patentability',
    'search',
    'analysis',
    'USPTO',
    'EPO',
    'WIPO',
    'AI-assisted',
    'legal-opinion'
  ],
  color: '#6366F1',
  icon: 'Search',
  displayOrder: 1,
  createdAt: '2024-01-10T09:00:00Z',
  updatedAt: '2024-12-15T14:30:00Z',
  createdBy: {
    id: '1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'senior_attorney'
  },
  organization: {
    id: '1',
    name: 'Patent Analytics Pro'
  }
};

export const priorArtSearchSteps: WorkflowStep[] = [
  {
    id: 'pas-001',
    workflowTemplateId: 'prior-art-search-001',
    name: 'Invention Disclosure Analysis',
    description: 'Review and analyze the invention disclosure to identify key technical features, novel aspects, and search parameters',
    stepType: StepType.MANUAL,
    order: 1,
    isRequired: true,
    isParallel: false,
    estimatedDuration: 0.5, // half day
    assignedRole: 'patent_analyst',
    approverRoles: ['attorney'],
    dependsOn: [],
    configuration: {
      checklistItems: [
        'Identify core inventive concepts',
        'Extract key technical features',
        'Determine field of invention',
        'Identify potential classification codes',
        'Document inventor\'s known prior art',
        'Define search scope and objectives'
      ],
      requiredDocuments: [
        'Invention Disclosure Form',
        'Technical Drawings/Diagrams',
        'Inventor Notes/Communications'
      ],
      outputFormat: 'structured_analysis_report'
    },
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-10T09:00:00Z',
    createdBy: {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson'
    }
  },
  {
    id: 'pas-002',
    workflowTemplateId: 'prior-art-search-001',
    name: 'Search Strategy Development',
    description: 'Develop comprehensive search strategy including keywords, classifications, and database selection',
    stepType: StepType.MANUAL,
    order: 2,
    isRequired: true,
    isParallel: false,
    estimatedDuration: 0.5,
    assignedRole: 'search_specialist',
    approverRoles: ['senior_analyst'],
    dependsOn: ['pas-001'],
    configuration: {
      searchComponents: {
        keywords: {
          primary: [],
          synonyms: [],
          technical_terms: [],
          boolean_strings: []
        },
        classifications: {
          ipc: [],
          cpc: [],
          uspc: [],
          locarno: []
        },
        databases: [
          'USPTO PatFT',
          'USPTO AppFT',
          'EPO Espacenet',
          'WIPO Global Brand',
          'Google Patents',
          'IEEE Xplore',
          'Non-Patent Literature'
        ],
        dateRange: {
          priority: 'last_20_years',
          published: 'all_available'
        }
      },
      aiAssistance: {
        enabled: true,
        semanticSearch: true,
        conceptExpansion: true
      }
    },
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-10T09:00:00Z',
    createdBy: {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson'
    }
  },
  {
    id: 'pas-003',
    workflowTemplateId: 'prior-art-search-001',
    name: 'Automated Database Search',
    description: 'Execute automated searches across multiple patent and non-patent databases using AI-enhanced search algorithms',
    stepType: StepType.AUTOMATED,
    order: 3,
    isRequired: true,
    isParallel: true,
    estimatedDuration: 0.25,
    assignedRole: 'system',
    approverRoles: [],
    dependsOn: ['pas-002'],
    configuration: {
      automation: {
        searchEngines: [
          'PatentLens API',
          'EPO OPS API',
          'USPTO PEDS API',
          'Google Patents API'
        ],
        maxResults: 500,
        relevanceThreshold: 0.7,
        duplicateRemoval: true,
        citationExpansion: true,
        familyGrouping: true
      },
      monitoring: {
        realTimeAlerts: true,
        progressTracking: true,
        errorHandling: 'retry_with_fallback'
      }
    },
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-10T09:00:00Z',
    createdBy: {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson'
    }
  },
  {
    id: 'pas-004',
    workflowTemplateId: 'prior-art-search-001',
    name: 'Manual Supplementary Search',
    description: 'Conduct targeted manual searches for specific aspects not covered by automated search',
    stepType: StepType.MANUAL,
    order: 4,
    isRequired: false,
    isParallel: true,
    estimatedDuration: 1,
    assignedRole: 'search_specialist',
    approverRoles: [],
    dependsOn: ['pas-002'],
    configuration: {
      focusAreas: [
        'Competitor patents',
        'Academic publications',
        'Technical standards',
        'Product documentation',
        'Trade publications',
        'Conference proceedings'
      ],
      searchTechniques: [
        'Citation tree analysis',
        'Inventor name searching',
        'Assignee portfolio review',
        'Classification browsing',
        'Semantic similarity search'
      ]
    },
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-10T09:00:00Z',
    createdBy: {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson'
    }
  },
  {
    id: 'pas-005',
    workflowTemplateId: 'prior-art-search-001',
    name: 'Prior Art Relevance Screening',
    description: 'Review and rank search results for relevance to the invention claims',
    stepType: StepType.REVIEW,
    order: 5,
    isRequired: true,
    isParallel: false,
    estimatedDuration: 1,
    assignedRole: 'patent_analyst',
    approverRoles: [],
    dependsOn: ['pas-003', 'pas-004'],
    configuration: {
      screeningCriteria: {
        relevanceLevels: [
          'Highly Relevant (X)',
          'Relevant (Y)',
          'Background (A)',
          'Technological Field',
          'Not Relevant'
        ],
        evaluationFactors: [
          'Technical similarity',
          'Claim element mapping',
          'Priority date',
          'Legal status',
          'Geographic coverage'
        ]
      },
      tools: {
        claimChartGeneration: true,
        elementMapping: true,
        visualComparison: true
      },
      outputLimit: 50 // top references
    },
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-10T09:00:00Z',
    createdBy: {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson'
    }
  },
  {
    id: 'pas-006',
    workflowTemplateId: 'prior-art-search-001',
    name: 'Citation Analysis',
    description: 'Analyze citation relationships and identify key patent families and citation clusters',
    stepType: StepType.AUTOMATED,
    order: 6,
    isRequired: true,
    isParallel: true,
    estimatedDuration: 0.25,
    assignedRole: 'system',
    approverRoles: [],
    dependsOn: ['pas-005'],
    configuration: {
      analysis: {
        citationDepth: 3,
        forwardCitations: true,
        backwardCitations: true,
        familyAnalysis: true,
        citationClusters: true,
        influenceScore: true
      },
      visualization: {
        citationNetwork: true,
        timelineView: true,
        geographicMap: true,
        technologyLandscape: true
      }
    },
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-10T09:00:00Z',
    createdBy: {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson'
    }
  },
  {
    id: 'pas-007',
    workflowTemplateId: 'prior-art-search-001',
    name: 'Patentability Assessment',
    description: 'Detailed analysis of patentability based on identified prior art, including novelty and non-obviousness evaluation',
    stepType: StepType.REVIEW,
    order: 7,
    isRequired: true,
    isParallel: false,
    estimatedDuration: 1.5,
    assignedRole: 'attorney',
    approverRoles: ['senior_attorney'],
    dependsOn: ['pas-005', 'pas-006'],
    configuration: {
      assessment: {
        noveltyAnalysis: {
          claimByClaimReview: true,
          elementMapping: true,
          anticipationCheck: true
        },
        obviousnessAnalysis: {
          combinationReview: true,
          tseaFactors: true,
          secondaryConsiderations: true,
          expertDeclaration: false
        },
        enablementAnalysis: {
          writtenDescription: true,
          bestMode: true,
          utility: true
        }
      },
      legalFramework: {
        jurisdiction: ['USPTO', 'EPO', 'JPO'],
        caselaw: 'current',
        guidelines: 'MPEP_latest'
      }
    },
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-10T09:00:00Z',
    createdBy: {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson'
    }
  },
  {
    id: 'pas-008',
    workflowTemplateId: 'prior-art-search-001',
    name: 'Freedom to Operate Analysis',
    description: 'Evaluate potential infringement risks and freedom to operate in target markets',
    stepType: StepType.MANUAL,
    order: 8,
    isRequired: false,
    isParallel: true,
    estimatedDuration: 1,
    assignedRole: 'attorney',
    approverRoles: ['partner'],
    dependsOn: ['pas-007'],
    configuration: {
      ftoScope: {
        markets: ['US', 'EP', 'CN', 'JP'],
        productFeatures: 'all_claimed',
        competitorPatents: true,
        blockingPatents: true,
        licensingOpportunities: true
      },
      riskAssessment: {
        infringementRisk: 'detailed',
        validityChallenge: true,
        designAround: true,
        costEstimate: true
      }
    },
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-10T09:00:00Z',
    createdBy: {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson'
    }
  },
  {
    id: 'pas-009',
    workflowTemplateId: 'prior-art-search-001',
    name: 'Report Generation',
    description: 'Generate comprehensive patentability report with search results, analysis, and recommendations',
    stepType: StepType.DOCUMENT,
    order: 9,
    isRequired: true,
    isParallel: false,
    estimatedDuration: 0.5,
    assignedRole: 'patent_analyst',
    approverRoles: ['attorney'],
    dependsOn: ['pas-007', 'pas-008'],
    configuration: {
      reportSections: [
        'Executive Summary',
        'Search Methodology',
        'Prior Art Overview',
        'Detailed Prior Art Analysis',
        'Patentability Assessment',
        'Freedom to Operate Analysis',
        'Risk Assessment',
        'Recommendations',
        'Claim Strategy Suggestions',
        'Appendices'
      ],
      formats: {
        pdf: true,
        word: true,
        interactive: true,
        claimCharts: true
      },
      visualizations: {
        citationNetwork: true,
        technologyLandscape: true,
        competitiveLandscape: true,
        timelineAnalysis: true
      }
    },
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-10T09:00:00Z',
    createdBy: {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson'
    }
  },
  {
    id: 'pas-010',
    workflowTemplateId: 'prior-art-search-001',
    name: 'Quality Review',
    description: 'Senior attorney review of search completeness and patentability conclusions',
    stepType: StepType.QUALITY_GATE,
    order: 10,
    isRequired: true,
    isParallel: false,
    estimatedDuration: 0.5,
    assignedRole: 'senior_attorney',
    approverRoles: ['partner'],
    dependsOn: ['pas-009'],
    configuration: {
      qualityChecklist: [
        'Search strategy comprehensiveness',
        'Database coverage adequacy',
        'Prior art relevance accuracy',
        'Legal analysis correctness',
        'Report clarity and completeness',
        'Client-specific requirements met',
        'Regulatory compliance verified'
      ],
      passingScore: 95,
      remediationRequired: true,
      escalationPath: 'partner_review'
    },
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-10T09:00:00Z',
    createdBy: {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson'
    }
  },
  {
    id: 'pas-011',
    workflowTemplateId: 'prior-art-search-001',
    name: 'Client Communication',
    description: 'Prepare and deliver final report to client with recommendations and next steps',
    stepType: StepType.NOTIFICATION,
    order: 11,
    isRequired: true,
    isParallel: false,
    estimatedDuration: 0.25,
    assignedRole: 'attorney',
    approverRoles: [],
    dependsOn: ['pas-010'],
    configuration: {
      deliverables: {
        finalReport: true,
        executiveSummary: true,
        presentationDeck: true,
        claimCharts: true,
        searchDatabase: true
      },
      communication: {
        emailNotification: true,
        clientPortalUpload: true,
        videoConference: 'optional',
        followUpMeeting: 'scheduled'
      },
      nextSteps: {
        patentDrafting: 'recommended',
        claimAmendments: 'if_needed',
        additionalSearches: 'on_request',
        competitorMonitoring: 'available'
      }
    },
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-10T09:00:00Z',
    createdBy: {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson'
    }
  },
  {
    id: 'pas-012',
    workflowTemplateId: 'prior-art-search-001',
    name: 'Monitoring Setup',
    description: 'Configure ongoing monitoring for new prior art and competitor activity',
    stepType: StepType.AUTOMATED,
    order: 12,
    isRequired: false,
    isParallel: true,
    estimatedDuration: 0.25,
    assignedRole: 'system',
    approverRoles: [],
    dependsOn: ['pas-011'],
    configuration: {
      monitoring: {
        frequency: 'weekly',
        scope: {
          newPublications: true,
          competitorFilings: true,
          citationAlerts: true,
          legalStatusChanges: true
        },
        alertThresholds: {
          highRelevance: 'immediate',
          mediumRelevance: 'weekly_digest',
          lowRelevance: 'monthly_summary'
        },
        duration: '12_months',
        autoRenewal: true
      }
    },
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-10T09:00:00Z',
    createdBy: {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson'
    }
  }
];

// Quality control metrics for the workflow
export const priorArtQualityMetrics = {
  searchCompleteness: {
    minimumDatabases: 5,
    minimumReferences: 100,
    minimumRelevantRefs: 10,
    citationDepth: 2
  },
  analysisQuality: {
    claimCoverage: 100, // percentage
    elementMapping: 'required',
    legalOpinion: 'required',
    visualizations: 'required'
  },
  timelineTargets: {
    urgent: 3, // days
    standard: 7,
    comprehensive: 14
  },
  successMetrics: {
    clientSatisfaction: 95,
    patentabilityAccuracy: 98,
    searchCompleteness: 96,
    reportQuality: 97
  }
};

// Export complete template with steps
export const completepriorArtSearchWorkflow = {
  template: priorArtSearchTemplate,
  steps: priorArtSearchSteps,
  metrics: priorArtQualityMetrics
};