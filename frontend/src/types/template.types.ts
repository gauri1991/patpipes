/**
 * Analytics Template System Types
 * Supports template types for analytics: Charts, Reports, and Documents
 */


// Base template type that all specific templates extend
export interface BaseTemplate {
  id: string;
  name: string;
  description: string;
  template_type: TemplateType;
  category: string;
  icon: string;
  scope: TemplateScope;
  tags: string[];
  created_by: {
    id: string;
    name: string;
    avatar?: string;
  };
  usage_count: number;
  version: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  permissions?: TemplatePermissions;
  metadata?: Record<string, any>;
}

// Template type enum
export enum TemplateType {
  CHART = 'chart',
  REPORT = 'report',
  DOCUMENT = 'document',
  DASHBOARD = 'dashboard',
  WORKFLOW = 'workflow'
}

// Template scope for access control
export enum TemplateScope {
  PERSONAL = 'personal',
  TEAM = 'team',
  ORGANIZATION = 'organization',
  PUBLIC = 'public'
}

// Template permissions
export interface TemplatePermissions {
  can_view: string[];  // user IDs or role names
  can_edit: string[];
  can_delete: string[];
  can_duplicate: string[];
  is_locked?: boolean;
}

// Chart Template - for visualizations
export interface ChartTemplate extends BaseTemplate {
  template_type: TemplateType.CHART;
  chart_config: {
    chart_type: ChartType;
    data_source?: string;
    x_axis?: string;
    y_axis?: string;
    z_axis?: string;
    group_by?: string;
    color_by?: string;
    size_by?: string;
    aggregation?: AggregationType;
    filters?: ChartFilter[];
    layout?: ChartLayout;
    styling?: ChartStyling;
  };
  preview_image?: string;
}

// Report Template - for analytical reports
export interface ReportTemplate extends BaseTemplate {
  template_type: TemplateType.REPORT;
  report_config: {
    report_type: ReportType;
    sections: ReportSection[];
    data_requirements?: DataRequirement[];
    output_formats: OutputFormat[];
    estimated_time?: string;
    auto_generate?: boolean;
    scheduling?: ReportSchedule;
    distribution?: DistributionSettings;
  };
  sample_output?: string;
}

// Document Template - for structured documents
export interface DocumentTemplate extends BaseTemplate {
  template_type: TemplateType.DOCUMENT;
  document_config: {
    document_type: string;
    structure: DocumentSection[];
    variables?: DocumentVariable[];
    formatting?: DocumentFormatting;
    approval_workflow?: string;
  };
}

// Dashboard Template - for multi-widget dashboards (not used in analytics)
// export interface DashboardTemplate extends BaseTemplate {
//   template_type: TemplateType.DASHBOARD;
//   dashboard_config: {
//     layout: DashboardLayout;
//     widgets: DashboardWidget[];
//     refresh_interval?: number;
//     filters?: DashboardFilter[];
//     theme?: DashboardTheme;
//     interactions?: WidgetInteraction[];
//   };
//   preview_image?: string;
// }

// Workflow Template - for process workflows (not used in analytics)
// export interface WorkflowTemplate extends BaseTemplate {
//   template_type: TemplateType.WORKFLOW;
//   workflow_config: {
//     steps: WorkflowStep[];
//     triggers?: WorkflowTrigger[];
//     conditions?: WorkflowCondition[];
//     actions?: WorkflowAction[];
//   };
// }

// Union type for analytics template types only
export type Template = ChartTemplate | ReportTemplate | DocumentTemplate;

// Chart specific types
export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  PIE = 'pie',
  SCATTER = 'scatter',
  HEATMAP = 'heatmap',
  NETWORK = 'network',
  TREEMAP = 'treemap',
  SANKEY = 'sankey',
  RADAR = 'radar',
  FUNNEL = 'funnel',
  CHOROPLETH = 'choropleth',
  BUBBLE = 'bubble',
  WATERFALL = 'waterfall',
  GANTT = 'gantt'
}

export enum AggregationType {
  SUM = 'sum',
  AVERAGE = 'average',
  COUNT = 'count',
  MIN = 'min',
  MAX = 'max',
  MEDIAN = 'median',
  MODE = 'mode',
  STD_DEV = 'std_dev'
}

export interface ChartFilter {
  field: string;
  operator: FilterOperator;
  value: any;
}

export enum FilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  CONTAINS = 'contains',
  IN = 'in',
  NOT_IN = 'not_in',
  BETWEEN = 'between'
}

export interface ChartLayout {
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  legend_position?: 'top' | 'bottom' | 'left' | 'right' | 'none';
  grid?: boolean;
}

export interface ChartStyling {
  color_scheme?: string;
  font_family?: string;
  font_size?: number;
  line_width?: number;
  point_size?: number;
  opacity?: number;
  animations?: boolean;
  interactive?: boolean;
}

// Report specific types
export enum ReportType {
  LANDSCAPE_ANALYSIS = 'landscape_analysis',
  COMPETITIVE_INTELLIGENCE = 'competitive_intelligence',
  FREEDOM_TO_OPERATE = 'freedom_to_operate',
  PORTFOLIO_ANALYSIS = 'portfolio_analysis',
  INFRINGEMENT_ANALYSIS = 'infringement_analysis',
  WHITE_SPACE_ANALYSIS = 'white_space_analysis',
  TECHNOLOGY_SCOUTING = 'technology_scouting',
  MARKET_ANALYSIS = 'market_analysis',
  CUSTOM = 'custom'
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'text' | 'chart' | 'table' | 'image' | 'metric' | 'mixed';
  content?: any;
  required: boolean;
  order: number;
  template?: string;
  data_binding?: string;
  conditional?: SectionCondition;
}

export interface SectionCondition {
  field: string;
  operator: FilterOperator;
  value: any;
}

export interface DataRequirement {
  name: string;
  type: string;
  source: string;
  required: boolean;
  description?: string;
}

export enum OutputFormat {
  PDF = 'pdf',
  WORD = 'word',
  EXCEL = 'excel',
  POWERPOINT = 'powerpoint',
  HTML = 'html',
  MARKDOWN = 'markdown',
  JSON = 'json'
}

export interface ReportSchedule {
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  time?: string;
  timezone?: string;
  start_date?: string;
  end_date?: string;
}

export interface DistributionSettings {
  recipients: string[];
  cc?: string[];
  bcc?: string[];
  subject_template?: string;
  body_template?: string;
  attach_report: boolean;
  send_link: boolean;
}

// Dashboard specific types
export interface DashboardLayout {
  type: 'grid' | 'flex' | 'absolute';
  columns?: number;
  rows?: number;
  gap?: number;
  responsive?: boolean;
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'text' | 'image' | 'filter';
  title: string;
  position: { x: number; y: number; w: number; h: number };
  config: any;
  data_source?: string;
  refresh_rate?: number;
}

export interface DashboardFilter {
  id: string;
  type: 'dropdown' | 'date_range' | 'text' | 'multiselect';
  field: string;
  label: string;
  default_value?: any;
  options?: any[];
  affects_widgets: string[];
}

export interface DashboardTheme {
  primary_color: string;
  secondary_color: string;
  background: string;
  text_color: string;
  border_color: string;
  font_family: string;
}

export interface WidgetInteraction {
  source_widget: string;
  target_widget: string;
  interaction_type: 'click' | 'hover' | 'select';
  action: 'filter' | 'drill_down' | 'navigate' | 'update';
  parameters?: any;
}

// Document specific types
export interface DocumentSection {
  id: string;
  title: string;
  content_type: 'text' | 'table' | 'list' | 'image' | 'chart';
  template?: string;
  variables?: string[];
  rules?: DocumentRule[];
  order: number;
}

export interface DocumentVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'list';
  default_value?: any;
  required: boolean;
  validation?: any;
}

export interface DocumentFormatting {
  font_family: string;
  font_size: number;
  line_height: number;
  margin: any;
  header_footer?: any;
  page_size: string;
  orientation: 'portrait' | 'landscape';
}

export interface DocumentRule {
  condition: string;
  action: string;
  parameters?: any;
}

// Workflow specific types
export interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  config: any;
  next_steps?: string[];
  conditions?: WorkflowCondition[];
}

export interface WorkflowTrigger {
  type: 'manual' | 'schedule' | 'event' | 'webhook';
  config: any;
}

export interface WorkflowCondition {
  field: string;
  operator: string;
  value: any;
  then_step?: string;
  else_step?: string;
}

export interface WorkflowAction {
  type: string;
  config: any;
  on_success?: string;
  on_failure?: string;
}

// Template creation and management
export interface TemplateCreationData {
  name: string;
  description: string;
  template_type: TemplateType;
  type?: TemplateType;  // Alias for template_type for compatibility
  category: string;
  scope: TemplateScope;
  tags: string[];
  config: any;
  base_template_id?: string;  // For duplicating/extending existing templates
}

export interface TemplateFilter {
  type?: TemplateType[];
  scope?: TemplateScope[];
  category?: string[];
  tags?: string[];
  created_by?: string;
  search_term?: string;
  is_active?: boolean;
  sort_by?: 'name' | 'created_at' | 'updated_at' | 'usage_count';
  sort_order?: 'asc' | 'desc';
}

export interface TemplateUsageStats {
  template_id: string;
  total_uses: number;
  unique_users: number;
  last_used: string;
  average_rating?: number;
  success_rate?: number;
  common_modifications?: string[];
}

export interface TemplateVersion {
  version: string;
  changes: string[];
  created_by: string;
  created_at: string;
  is_current: boolean;
  parent_version?: string;
}