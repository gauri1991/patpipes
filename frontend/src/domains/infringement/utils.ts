/**
 * Infringement domain shared utilities
 * Extracted from the infringement page monolith
 */

// ==================== Status & Badge Colors ====================

export const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    active: 'bg-blue-100 text-blue-800',
    review: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    on_hold: 'bg-orange-100 text-orange-800',
    closed: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || colors.draft;
};

export const getRiskColor = (risk: string) => {
  const colors: Record<string, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };
  return colors[risk] || colors.medium;
};

export const getAnalysisTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    literal: 'bg-blue-100 text-blue-800',
    doe: 'bg-purple-100 text-purple-800',
    induced: 'bg-pink-100 text-pink-800',
    contributory: 'bg-indigo-100 text-indigo-800',
    willful: 'bg-red-100 text-red-800',
  };
  return colors[type] || colors.literal;
};

export const getMappingTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    literal: 'bg-green-100 text-green-800',
    equivalent: 'bg-blue-100 text-blue-800',
    similar: 'bg-yellow-100 text-yellow-800',
    no_match: 'bg-red-100 text-red-800',
  };
  return colors[type] || colors.literal;
};

export const getRiskScoreColor = (score: number) => {
  if (score >= 80) return 'text-red-600';
  if (score >= 60) return 'text-orange-500';
  if (score >= 40) return 'text-yellow-500';
  return 'text-green-500';
};

export const getRiskLevelBgColor = (level: string) => {
  const colors: Record<string, string> = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200',
  };
  return colors[level] || colors.medium;
};

export const getMeetsLimitationBadge = (meets: boolean | null) => {
  if (meets === true) return { label: 'Met', className: 'bg-green-100 text-green-800' };
  if (meets === false) return { label: 'Not Met', className: 'bg-red-100 text-red-800' };
  return { label: 'Unknown', className: 'bg-gray-100 text-gray-800' };
};

export const getElementTypeBadge = (type: string) => {
  const badges: Record<string, string> = {
    preamble: 'bg-purple-100 text-purple-800',
    body: 'bg-blue-100 text-blue-800',
    transition: 'bg-yellow-100 text-yellow-800',
  };
  return badges[type] || badges.body;
};

// ==================== Evidence Type Labels ====================

export const getEvidenceTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    product_doc: 'Product Documentation',
    patent_doc: 'Patent Documentation',
    technical_spec: 'Technical Specifications',
    marketing: 'Marketing Materials',
    source_code: 'Source Code',
    screenshot: 'Screenshot',
    photo: 'Photograph',
    video: 'Video',
    testimony: 'Expert Testimony',
    research: 'Research Paper',
    other: 'Other',
  };
  return labels[type] || type;
};

// ==================== Formatting ====================

export const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

export const formatCurrency = (value: number | null | undefined) => {
  if (!value) return 'Not estimated';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// ==================== Label Constants ====================

export const riskFactorLabels: Record<string, string> = {
  technical: 'Technical Merit',
  legal: 'Legal Precedent',
  financial: 'Financial Impact',
  strategic: 'Strategic Importance',
  validity: 'Patent Validity',
  enforceability: 'Patent Enforceability',
};

export const damagesTheoryLabels: Record<string, string> = {
  lost_profits: 'Lost Profits',
  reasonable_royalty: 'Reasonable Royalty',
  hybrid: 'Hybrid Approach',
};

export const reportTypeLabels: Record<string, string> = {
  preliminary: 'Preliminary Analysis',
  detailed: 'Detailed Report',
  claim_chart: 'Claim Chart Report',
  risk_assessment: 'Risk Assessment',
  executive_summary: 'Executive Summary',
};

export const reportStatusLabels: Record<string, string> = {
  draft: 'Draft',
  review: 'Under Review',
  final: 'Final',
  archived: 'Archived',
};

export const reportStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    review: 'bg-yellow-100 text-yellow-800',
    final: 'bg-green-100 text-green-800',
    archived: 'bg-blue-100 text-blue-800',
  };
  return colors[status] || colors.draft;
};
