/**
 * Test Data for Integration Testing
 * Mock data for all Phase 4 and Phase 5 components
 */

export const testProjectData = {
  projectId: 'test-project-1',
  projectType: 'FTO' as const,
  title: 'Neural Network Architecture Testing',
  description: 'Integration test for prior art analysis components',
  createdDate: new Date().toISOString(),
  lastModified: new Date().toISOString(),
  status: 'active'
};

export const testPatentData = {
  patents: [
    {
      id: 'US10123456',
      title: 'Machine Learning System with Adaptive Preprocessing',
      publicationNumber: 'US10,123,456',
      publicationDate: '2019-11-12',
      abstract: 'A machine learning system that implements adaptive preprocessing...',
      claims: [
        'A method for processing neural network data comprising...',
        'The method of claim 1, wherein the preprocessing includes...',
        'A system comprising a processor configured to...'
      ],
      assignee: 'TechCorp Inc.',
      inventors: ['John Doe', 'Jane Smith'],
      classifications: ['G06N 3/02', 'G06N 3/08'],
      citedBy: ['US10987654', 'EP3456789'],
      cites: ['US9876543', 'US9234567']
    },
    {
      id: 'EP3456789',
      title: 'Deep Learning Optimization Methods',
      publicationNumber: 'EP3456789',
      publicationDate: '2020-03-15',
      abstract: 'Methods and systems for optimizing deep learning models...',
      claims: [
        'A computer-implemented method for optimizing neural networks...',
        'The method of claim 1, further comprising adaptive learning rates...'
      ],
      assignee: 'AI Research Ltd.',
      inventors: ['Alice Johnson', 'Bob Wilson'],
      classifications: ['G06N 3/08', 'G06N 20/00'],
      citedBy: ['US11234567'],
      cites: ['US10123456', 'US9876543']
    }
  ]
};

export const testEvidenceData = {
  evidenceItems: [
    {
      id: 'ev-001',
      patentId: 'US10123456',
      type: 'patent',
      relevanceScore: 92,
      claimCoverage: {
        claim1: 85,
        claim2: 78,
        claim3: 92
      },
      technicalSimilarity: 88,
      dateRelevance: 95,
      credibilityScore: 90
    },
    {
      id: 'ev-002',
      patentId: 'EP3456789',
      type: 'patent',
      relevanceScore: 78,
      claimCoverage: {
        claim1: 65,
        claim2: 82,
        claim3: 70
      },
      technicalSimilarity: 75,
      dateRelevance: 85,
      credibilityScore: 88
    }
  ]
};

export const testClaimMappingData = {
  claims: [
    {
      id: 'claim-1',
      number: '1',
      text: 'A method for processing neural network data comprising adaptive preprocessing',
      type: 'independent',
      mappings: [
        {
          evidenceId: 'US10123456',
          mappingType: 'exact',
          strength: 92,
          elements: ['neural network', 'adaptive preprocessing', 'data processing']
        },
        {
          evidenceId: 'EP3456789',
          mappingType: 'similar',
          strength: 75,
          elements: ['neural network', 'preprocessing']
        }
      ]
    },
    {
      id: 'claim-2',
      number: '2',
      text: 'The method of claim 1, wherein the preprocessing includes optimization',
      type: 'dependent',
      mappings: [
        {
          evidenceId: 'EP3456789',
          mappingType: 'exact',
          strength: 88,
          elements: ['optimization', 'preprocessing']
        }
      ]
    }
  ]
};

export const testLegalData = {
  jurisdiction: 'United States',
  legalStandard: 'Clear and convincing evidence',
  analysisType: 'INVALIDITY',
  factors: [
    {
      name: 'Anticipation Risk',
      score: 78,
      weight: 0.35,
      confidence: 85,
      evidence: ['US10123456 discloses all elements', 'Clear element-by-element correspondence']
    },
    {
      name: 'Obviousness Risk',
      score: 82,
      weight: 0.30,
      confidence: 88,
      evidence: ['Motivation to combine exists', 'No teaching away found']
    },
    {
      name: 'Enablement',
      score: 72,
      weight: 0.20,
      confidence: 75,
      evidence: ['Sufficient disclosure for POSITA', 'Working examples provided']
    },
    {
      name: 'Written Description',
      score: 68,
      weight: 0.15,
      confidence: 70,
      evidence: ['Adequate possession shown', 'Some gaps in description']
    }
  ]
};

export const testCitationNetworkData = {
  nodes: [
    { id: 'US10123456', label: 'Machine Learning System', group: 'core', citations: 15 },
    { id: 'EP3456789', label: 'Deep Learning Optimization', group: 'core', citations: 12 },
    { id: 'US9876543', label: 'Neural Network Architecture', group: 'foundational', citations: 25 },
    { id: 'US9234567', label: 'Data Processing Methods', group: 'supporting', citations: 8 },
    { id: 'US10987654', label: 'Advanced ML Techniques', group: 'recent', citations: 5 },
    { id: 'EP3234567', label: 'Real-time Processing', group: 'supporting', citations: 10 }
  ],
  edges: [
    { source: 'US10123456', target: 'US9876543', strength: 85 },
    { source: 'US10123456', target: 'US9234567', strength: 70 },
    { source: 'EP3456789', target: 'US10123456', strength: 78 },
    { source: 'EP3456789', target: 'US9876543', strength: 82 },
    { source: 'US10987654', target: 'US10123456', strength: 90 },
    { source: 'EP3234567', target: 'EP3456789', strength: 65 }
  ]
};

export const testReportData = {
  metadata: {
    title: 'Prior Art Analysis Report - Integration Test',
    author: 'Patent Analytics Platform',
    organization: 'Test Organization',
    date: new Date().toLocaleDateString(),
    projectType: 'FTO',
    confidentiality: 'confidential',
    version: '1.0'
  },
  executiveSummary: {
    keyFindings: [
      'Identified 6 highly relevant prior art references',
      'Found strong anticipation risk from US10123456',
      'Obviousness concerns based on combination of references',
      'Design-around opportunities identified'
    ],
    riskLevel: 'MODERATE',
    confidenceScore: 82,
    recommendations: [
      'Conduct detailed claim construction analysis',
      'Consider licensing from key patent holders',
      'Develop design-around strategies',
      'Monitor new patent filings in this space'
    ]
  },
  sections: [
    {
      id: 'executive_summary',
      title: 'Executive Summary',
      enabled: true,
      order: 1
    },
    {
      id: 'technical_analysis',
      title: 'Technical Analysis',
      enabled: true,
      order: 2
    },
    {
      id: 'legal_analysis',
      title: 'Legal Analysis',
      enabled: true,
      order: 3
    },
    {
      id: 'evidence_analysis',
      title: 'Evidence Analysis',
      enabled: true,
      order: 4
    },
    {
      id: 'conclusions',
      title: 'Conclusions & Recommendations',
      enabled: true,
      order: 5
    }
  ]
};

export const testExportOptions = {
  format: 'pdf' as const,
  quality: 'standard' as const,
  includeMetadata: true,
  passwordProtect: false,
  compression: true,
  accessibility: false
};

export function getTestDataForComponent(component: string) {
  switch (component) {
    case 'evidence':
      return testEvidenceData;
    case 'claim':
      return testClaimMappingData;
    case 'legal':
      return testLegalData;
    case 'citation':
      return testCitationNetworkData;
    case 'report':
      return testReportData;
    case 'export':
      return testExportOptions;
    default:
      return testProjectData;
  }
}