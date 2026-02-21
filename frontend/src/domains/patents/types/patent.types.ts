/**
 * Patent Domain Types
 * Type definitions for patent data and processing
 */

export interface Patent {
  id: string;
  patentNumber: string;
  applicationNumber: string;
  title: string;
  abstract: string;
  inventors: Inventor[];
  assignee: string;
  filingDate: string;
  publicationDate?: string;
  grantDate?: string;
  expirationDate?: string;
  status: PatentStatus;
  patentType: PatentType;
  jurisdiction: string;
  ipcClassifications: IPCClassification[];
  cpcClassifications: CPCClassification[];
  claims: Claim[];
  description: string;
  drawings?: Drawing[];
  priorArt: PriorArt[];
  citations: Citation[];
  legalEvents: LegalEvent[];
  maintenanceFees: MaintenanceFee[];
  tags: string[];
  projectId?: string;
  uploadInfo: UploadInfo;
  processingStatus: ProcessingStatus;
  analysisResults?: AnalysisResults;
  createdAt: string;
  updatedAt: string;
}

export interface Inventor {
  id: string;
  firstName: string;
  lastName: string;
  address?: Address;
  nationality?: string;
}

export interface Address {
  street: string;
  city: string;
  state?: string;
  country: string;
  zipCode?: string;
}

export interface Claim {
  id: string;
  number: number;
  text: string;
  type: ClaimType;
  dependencies: number[];
  isIndependent: boolean;
}

export interface Drawing {
  id: string;
  figureNumber: string;
  title: string;
  description: string;
  fileUrl: string;
  mimeType: string;
}

export interface IPCClassification {
  section: string;
  class: string;
  subclass: string;
  group: string;
  subgroup: string;
  fullClassification: string;
  description: string;
}

export interface CPCClassification {
  section: string;
  class: string;
  subclass: string;
  group: string;
  subgroup: string;
  fullClassification: string;
  description: string;
}

export interface PriorArt {
  id: string;
  type: PriorArtType;
  title: string;
  authors?: string[];
  publicationDate: string;
  documentNumber?: string;
  relevanceScore?: number;
  description: string;
}

export interface Citation {
  id: string;
  citedPatentNumber: string;
  citationType: CitationType;
  relevanceScore?: number;
  forwardCitation: boolean;
  backwardCitation: boolean;
}

export interface LegalEvent {
  id: string;
  eventType: LegalEventType;
  eventDate: string;
  description: string;
  cost?: number;
  dueDate?: string;
  completed: boolean;
}

export interface MaintenanceFee {
  id: string;
  feeType: string;
  dueDate: string;
  amount: number;
  currency: string;
  paid: boolean;
  paidDate?: string;
}

export interface UploadInfo {
  originalFileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  uploadedBy: {
    id: string;
    name: string;
  };
  source: PatentDataSource;
}

export interface ProcessingStatus {
  stage: ProcessingStage;
  progress: number;
  startedAt: string;
  completedAt?: string;
  errors: ProcessingError[];
  warnings: ProcessingWarning[];
}

export interface ProcessingError {
  id: string;
  type: string;
  message: string;
  field?: string;
  severity: ErrorSeverity;
  timestamp: string;
}

export interface ProcessingWarning {
  id: string;
  type: string;
  message: string;
  field?: string;
  timestamp: string;
}

export interface AnalysisResults {
  qualityScore: number;
  claimAnalysis: ClaimAnalysis;
  noveltyAnalysis: NoveltyAnalysis;
  competitorAnalysis: CompetitorAnalysis;
  technologyMapping: TechnologyMapping;
  riskAssessment: RiskAssessment;
}

export interface ClaimAnalysis {
  totalClaims: number;
  independentClaims: number;
  dependentClaims: number;
  averageClaimLength: number;
  complexityScore: number;
  broadnessScore: number;
}

export interface NoveltyAnalysis {
  noveltyScore: number;
  similarPatents: Patent[];
  riskFactors: string[];
  recommendations: string[];
}

export interface CompetitorAnalysis {
  competingPatents: Patent[];
  marketPosition: string;
  competitiveAdvantage: string[];
  threats: string[];
}

export interface TechnologyMapping {
  primaryTechnology: string;
  secondaryTechnologies: string[];
  industryApplications: string[];
  marketSegments: string[];
}

export interface RiskAssessment {
  overallRisk: RiskLevel;
  invalidityRisk: number;
  infringementRisk: number;
  litigationHistory: boolean;
  recommendedActions: string[];
}

// Enums
export enum PatentStatus {
  PENDING = 'pending',
  PUBLISHED = 'published',
  GRANTED = 'granted',
  EXPIRED = 'expired',
  ABANDONED = 'abandoned',
  REJECTED = 'rejected'
}

export enum PatentType {
  UTILITY = 'utility',
  DESIGN = 'design',
  PLANT = 'plant',
  PROVISIONAL = 'provisional',
  CONTINUATION = 'continuation',
  DIVISIONAL = 'divisional'
}

export enum ClaimType {
  INDEPENDENT = 'independent',
  DEPENDENT = 'dependent',
  METHOD = 'method',
  APPARATUS = 'apparatus',
  COMPOSITION = 'composition',
  SYSTEM = 'system'
}

export enum PriorArtType {
  PATENT = 'patent',
  PUBLICATION = 'publication',
  PRODUCT = 'product',
  WEBSITE = 'website',
  OTHER = 'other'
}

export enum CitationType {
  X_CATEGORY = 'x_category',
  Y_CATEGORY = 'y_category',
  A_CATEGORY = 'a_category',
  P_CATEGORY = 'p_category',
  E_CATEGORY = 'e_category'
}

export enum LegalEventType {
  FILING = 'filing',
  PUBLICATION = 'publication',
  EXAMINATION = 'examination',
  GRANT = 'grant',
  MAINTENANCE_FEE = 'maintenance_fee',
  ASSIGNMENT = 'assignment',
  LICENSE = 'license',
  LITIGATION = 'litigation',
  EXPIRATION = 'expiration'
}

export enum PatentDataSource {
  USPTO = 'uspto',
  EPO = 'epo',
  JPO = 'jpo',
  WIPO = 'wipo',
  MANUAL_UPLOAD = 'manual_upload',
  API_IMPORT = 'api_import'
}

export enum ProcessingStage {
  UPLOADED = 'uploaded',
  PARSING = 'parsing',
  VALIDATING = 'validating',
  ANALYZING = 'analyzing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Lightweight patent summary matching PatentListSerializer output.
 * Used for list views and search results from the real API.
 */
export interface PatentSummary {
  id: string;
  title: string;
  patent_number: string | null;
  application_number: string | null;
  status: string;
  patent_type: string;
  filing_date: string | null;
  grant_date: string | null;
  expiry_date: string | null;
  technology_area: string;
  estimated_value: number | null;
  assignees: string[];
  inventors: string[];
  tags: string[];
  abstract: string;
  portfolio: string | null;
}

/**
 * Paginated response from the backend (DRF LimitOffsetPagination)
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Upload and Processing Types
export interface PatentUploadRequest {
  file: File;
  projectId?: string;
  source: PatentDataSource;
  tags?: string[];
  autoAnalyze: boolean;
}

export interface PatentBulkUploadRequest {
  files: File[];
  projectId?: string;
  source: PatentDataSource;
  tags?: string[];
  autoAnalyze: boolean;
}

export interface PatentUploadResponse {
  uploadId: string;
  patentIds: string[];
  status: ProcessingStage;
  message: string;
}

export interface PatentProcessingJob {
  id: string;
  patentId: string;
  stage: ProcessingStage;
  progress: number;
  startedAt: string;
  estimatedCompletion?: string;
  logs: ProcessingLog[];
}

export interface ProcessingLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: any;
}

// Search and Filter Types
export interface PatentSearchQuery {
  query?: string;
  patentNumber?: string;
  title?: string;
  inventor?: string;
  assignee?: string;
  ipcClass?: string;
  cpcClass?: string;
  filingDateFrom?: string;
  filingDateTo?: string;
  status?: PatentStatus[];
  type?: PatentType[];
  jurisdiction?: string[];
  tags?: string[];
  projectId?: string;
}

export interface PatentSearchResult {
  patents: Patent[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Statistics and Analytics Types
export interface PatentPortfolioStats {
  totalPatents: number;
  grantedPatents: number;
  activePatents?: number;
  pendingPatents: number;
  expiredPatents: number;
  averageProcessingTime: number;
  totalValue?: number;
  totalMaintenance?: number;
  topTechnologies: TechnologyStats[];
  jurisdictionDistribution?: JurisdictionStats[];
  statusDistribution: StatusStats[];
  filingTrends?: FilingTrendData[];
  recentFilings?: any[];
  expiringSoon?: any[];
  byType?: any[];
  infringementSummary?: {
    total_cases: number;
    active_cases: number;
    high_risk_cases: number;
  };
}

export interface TechnologyStats {
  technology: string;
  count: number;
  percentage: number;
}

export interface JurisdictionStats {
  jurisdiction: string;
  count: number;
  percentage: number;
}

export interface StatusStats {
  status: PatentStatus;
  count: number;
  percentage: number;
}

export interface FilingTrendData {
  month: string;
  year: number;
  filings: number;
  grants: number;
}