/**
 * TypeScript interfaces for Patent Prosecution domain models
 * Matches the backend Django models
 */

export interface PatentApplication {
  id: string;
  title: string;
  application_number?: string;
  patent_number?: string;
  
  // Classification
  application_type: 'utility' | 'design' | 'plant' | 'provisional' | 'pct' | 'continuation' | 'divisional' | 'cip';
  jurisdiction: 'US' | 'EP' | 'JP' | 'CN' | 'KR' | 'CA' | 'AU' | 'IN' | 'PCT';
  status: 'draft' | 'filed' | 'pending' | 'under_examination' | 'office_action' | 'allowed' | 'granted' | 'abandoned' | 'rejected' | 'withdrawn';
  
  // Relationships
  organization: string;
  attorney?: string;
  inventors: string[];
  assignees: string[];
  
  // Important dates
  priority_date?: string;
  filing_date?: string;
  publication_date?: string;
  grant_date?: string;
  expiry_date?: string;
  
  // Patent content
  abstract: string;
  background: string;
  summary: string;
  detailed_description: string;
  
  // Classification and technical details
  technology_area: string;
  ipc_classes: string[];
  us_classes: string[];
  keywords: string[];
  
  // Financial tracking
  estimated_value: number;
  costs_to_date: number;
  estimated_total_cost: number;
  
  // Settings and metadata
  is_confidential: boolean;
  priority_level: 'low' | 'medium' | 'high' | 'critical';
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Related objects
  claims?: Claim[];
  events?: ProsecutionEvent[];
  office_actions?: OfficeAction[];
  deadlines?: ProsecutionDeadline[];
  documents?: ProsecutionDocument[];
}

export interface Claim {
  id: string;
  application: string;
  claim_number: number;
  claim_type: 'independent' | 'dependent' | 'multiple_dependent';
  claim_text: string;
  
  // Dependencies for dependent claims
  depends_on?: string[];
  
  // Status and validation
  is_cancelled: boolean;
  is_amended: boolean;
  rejection_history: any[];
  
  created_at: string;
  updated_at: string;
}

export interface ProsecutionEvent {
  id: string;
  application: string;
  event_type: 'application_filed' | 'office_action_received' | 'response_filed' | 'amendment_filed' | 
             'interview_scheduled' | 'interview_completed' | 'allowance_received' | 'patent_granted' | 
             'abandonment' | 'continuation_filed' | 'appeal_filed' | 'fee_paid' | 'deadline_reminder';
  event_date: string;
  due_date?: string;
  
  title: string;
  description: string;
  
  // Associated user/attorney
  handled_by?: string;
  
  // Document attachments (file paths/URLs)
  documents: string[];
  
  // Event-specific metadata
  metadata: Record<string, any>;
  
  // Status
  is_completed: boolean;
  is_urgent: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface OfficeAction {
  id: string;
  application: string;
  action_type: 'non_final' | 'final' | 'restriction' | 'advisory' | 'notice_allowance' | 'notice_abandonment';
  mailing_date: string;
  response_due_date: string;
  
  // Office Action content
  examiner_name: string;
  examiner_phone: string;
  art_unit: string;
  
  summary: string;
  rejections: any[];
  
  // Response tracking
  response_status: 'pending' | 'in_progress' | 'filed' | 'overdue';
  response_strategy: string;
  response_filed_date?: string;
  
  // Documents
  office_action_document: string;
  response_document: string;
  
  created_at: string;
  updated_at: string;
}

export interface ProsecutionDeadline {
  id: string;
  application: string;
  deadline_type: 'office_action_response' | 'filing_deadline' | 'fee_payment' | 'examination_request' | 
                'maintenance_fee' | 'publication_request' | 'interview_deadline' | 'appeal_deadline';
  due_date: string;
  title: string;
  description: string;
  
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Status tracking
  is_completed: boolean;
  completed_date?: string;
  is_cancelled: boolean;
  
  // Reminders
  reminder_sent: boolean;
  reminder_dates: string[];
  
  // Assignment
  assigned_to?: string;
  
  created_at: string;
  updated_at: string;
}

export interface ProsecutionDocument {
  id: string;
  application: string;
  document_type: 'application' | 'specification' | 'claims' | 'drawings' | 'office_action' | 'response' | 
                'amendment' | 'interview_summary' | 'appeal' | 'petition' | 'correspondence' | 
                'fee_payment' | 'power_of_attorney';
  title: string;
  description: string;
  
  // File information
  file_path: string;
  file_size: number;
  file_type: string;
  
  // Document metadata
  version: string;
  is_current_version: boolean;
  
  // Status
  is_filed: boolean;
  filing_date?: string;
  
  // User tracking
  uploaded_by?: string;
  
  created_at: string;
  updated_at: string;
}

// API Response types
export interface DashboardStats {
  total_applications: number;
  active_applications: number;
  draft_applications: number;
  upcoming_deadlines: number;
  office_actions: number;
  recent_activity: ProsecutionEvent[];
}

// Form data types for creating/updating
export interface CreatePatentApplicationData {
  title: string;
  application_type: PatentApplication['application_type'];
  jurisdiction?: PatentApplication['jurisdiction'];
  status?: PatentApplication['status'];
  inventors?: string[];
  assignees?: string[];
  abstract?: string;
  background?: string;
  summary?: string;
  detailed_description?: string;
  technology_area?: string;
  keywords?: string[];
  priority_level?: PatentApplication['priority_level'];
}

export interface UpdatePatentApplicationData extends Partial<CreatePatentApplicationData> {
  id?: never; // Prevent updating ID
}

// Auto-save status
export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';