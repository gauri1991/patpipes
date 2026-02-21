/**
 * PermissionMatrix Component
 * Feature/Module permission matrix for role-based access control
 */

'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import permissionCache from '@/lib/api/permissionCache';
import { TOKEN_STORAGE_KEYS } from '@/lib/api/config';
import {
  Save,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Settings,
  FolderOpen,
  FileText,
  Search,
  Shield,
  BarChart3,
  Users,
  Database,
  Download,
  Upload,
  Key,
  Globe,
  Activity,
  Mail,
  Bell,
  Palette,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  Filter,
  Workflow,
  TableProperties,
  MapPin,
  Database as DatabaseIcon
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Define user roles
const USER_ROLES = [
  { id: 'admin', label: 'Admin', color: 'bg-red-100 text-red-800' },
  { id: 'manager', label: 'Manager', color: 'bg-purple-100 text-purple-800' },
  { id: 'supervisor', label: 'Supervisor', color: 'bg-orange-100 text-orange-800' },
  { id: 'lead_attorney', label: 'Lead Attorney', color: 'bg-blue-100 text-blue-800' },
  { id: 'attorney', label: 'Attorney', color: 'bg-cyan-100 text-cyan-800' },
  { id: 'paralegal', label: 'Paralegal', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'analyst', label: 'Analyst', color: 'bg-green-100 text-green-800' },
  { id: 'client', label: 'Client', color: 'bg-gray-100 text-gray-800' },
  { id: 'guest', label: 'Guest', color: 'bg-slate-100 text-slate-600' },
];

// Define feature categories and permissions
const FEATURE_CATEGORIES = [
  {
    id: 'core',
    label: 'Core Features',
    icon: Activity,
    features: [
      { id: 'dashboard_access', label: 'Dashboard Access', description: 'Access to main dashboard' },
      { id: 'profile_management', label: 'Profile Management', description: 'Edit own profile and settings' },
      { id: 'notifications', label: 'Notifications', description: 'Receive system notifications' },
    ]
  },
  {
    id: 'projects',
    label: 'Project Management',
    icon: FolderOpen,
    features: [
      { id: 'projects_view', label: 'View Projects', description: 'View project listings' },
      { id: 'projects_create', label: 'Create Projects', description: 'Create new projects' },
      { id: 'projects_edit', label: 'Edit Projects', description: 'Modify existing projects' },
      { id: 'projects_delete', label: 'Delete Projects', description: 'Delete projects' },
      { id: 'projects_assign', label: 'Assign Projects', description: 'Assign projects to users' },
    ]
  },
  {
    id: 'patents',
    label: 'Patent Management',
    icon: FileText,
    features: [
      { id: 'patents_view', label: 'View Patents', description: 'View patent documents' },
      { id: 'patents_create', label: 'Create Patents', description: 'Create new patent applications' },
      { id: 'patents_edit', label: 'Edit Patents', description: 'Modify patent documents' },
      { id: 'patents_delete', label: 'Delete Patents', description: 'Delete patent documents' },
      { id: 'patents_review', label: 'Review Patents', description: 'Review and approve patents' },
      { id: 'patents_file', label: 'File Patents', description: 'File patent applications' },
    ]
  },
  {
    id: 'prior_art',
    label: 'Prior Art Search',
    icon: Search,
    features: [
      { id: 'prior_art_search', label: 'Basic Search', description: 'Conduct prior art searches' },
      { id: 'prior_art_create', label: 'Create Searches', description: 'Create new search strategies' },
      { id: 'prior_art_execute', label: 'Execute Searches', description: 'Run advanced search queries' },
      { id: 'prior_art_strategies', label: 'Manage Strategies', description: 'Manage search strategies' },
      { id: 'prior_art_similarity', label: 'Similarity Analysis', description: 'Patent similarity analysis' },
    ]
  },
  {
    id: 'infringement',
    label: 'Infringement Analysis',
    icon: Shield,
    features: [
      { id: 'infringement_analysis', label: 'Basic Analysis', description: 'Perform infringement analysis' },
      { id: 'infringement_create', label: 'Create Analysis', description: 'Create new infringement analysis' },
      { id: 'infringement_claim_charts', label: 'Claim Charts', description: 'Generate claim charts' },
      { id: 'infringement_risk_assessment', label: 'Risk Assessment', description: 'Conduct risk assessment' },
    ]
  },
  {
    id: 'prosecution',
    label: 'Prosecution Management',
    icon: FileText,
    features: [
      { id: 'prosecution_view', label: 'View Office Actions', description: 'View office actions and responses' },
      { id: 'prosecution_respond', label: 'Respond to Office Actions', description: 'Draft and submit responses' },
      { id: 'prosecution_deadlines', label: 'Manage Deadlines', description: 'Track and manage prosecution deadlines' },
    ]
  },
  {
    id: 'research',
    label: 'Research & Analysis',
    icon: Search,
    features: [
      { id: 'patent_landscape', label: 'Patent Landscape', description: 'Generate landscape reports' },
      { id: 'competitive_analysis', label: 'Competitive Analysis', description: 'Analyze competitor patents' },
    ]
  },
  {
    id: 'analytics',
    label: 'Analytics & Reports',
    icon: BarChart3,
    features: [
      { id: 'analytics_view', label: 'View Analytics', description: 'Access analytics dashboard' },
      { id: 'reports_generate', label: 'Generate Reports', description: 'Create custom reports' },
      { id: 'reports_export', label: 'Export Reports', description: 'Export reports to various formats' },
      { id: 'data_visualization', label: 'Data Visualization', description: 'Access advanced charts' },
    ]
  },
  {
    id: 'collaboration',
    label: 'Collaboration',
    icon: Users,
    features: [
      { id: 'team_collaboration', label: 'Team Collaboration', description: 'Collaborate with team members' },
      { id: 'document_sharing', label: 'Document Sharing', description: 'Share documents with others' },
      { id: 'comments_reviews', label: 'Comments & Reviews', description: 'Add comments and reviews' },
      { id: 'attorney_network', label: 'Attorney Network', description: 'Access attorney directory' },
    ]
  },
  {
    id: 'data',
    label: 'Data Management',
    icon: Database,
    features: [
      { id: 'file_upload', label: 'File Upload', description: 'Upload documents and files' },
      { id: 'file_download', label: 'File Download', description: 'Download files and documents' },
      { id: 'bulk_operations', label: 'Bulk Operations', description: 'Perform bulk data operations' },
      { id: 'data_export', label: 'Data Export', description: 'Export system data' },
      { id: 'data_import', label: 'Data Import', description: 'Import external data' },
    ]
  },
  {
    id: 'administration',
    label: 'System Administration',
    icon: Settings,
    features: [
      { id: 'user_management', label: 'User Management', description: 'Manage user accounts' },
      { id: 'role_management', label: 'Role Management', description: 'Manage user roles' },
      { id: 'permission_management', label: 'Permission Management', description: 'Configure permissions' },
      { id: 'system_settings', label: 'System Settings', description: 'Configure system settings' },
      { id: 'audit_logs', label: 'Audit Logs', description: 'View system audit logs' },
      { id: 'backup_restore', label: 'Backup & Restore', description: 'System backup operations' },
    ]
  },
  {
    id: 'integration',
    label: 'Integrations & API',
    icon: Globe,
    features: [
      { id: 'api_access', label: 'API Access', description: 'Access to REST API' },
      { id: 'webhook_management', label: 'Webhook Management', description: 'Configure webhooks' },
      { id: 'third_party_integrations', label: 'Third-party Integrations', description: 'Manage integrations' },
      { id: 'developer_tools', label: 'Developer Tools', description: 'Access developer features' },
    ]
  },
  {
    id: 'brainstorming',
    label: 'Brainstorming',
    icon: Activity,
    features: [
      { id: 'brainstorming_create', label: 'Create Sessions', description: 'Create brainstorming sessions' },
      { id: 'brainstorming_participate', label: 'Participate', description: 'Join and contribute to sessions' },
      { id: 'brainstorming_vote', label: 'Vote on Ideas', description: 'Vote and rank ideas' },
    ]
  },
  {
    id: 'agentic_ai',
    label: 'Agentic AI',
    icon: Activity,
    features: [
      { id: 'agentic_ai_manage', label: 'Manage AI Agents', description: 'Configure AI agents' },
      { id: 'agentic_ai_analysis', label: 'AI Analysis', description: 'Run AI-powered analysis' },
      { id: 'agentic_ai_insights', label: 'AI Insights', description: 'View AI-generated insights' },
    ]
  },
  {
    id: 'workflows',
    label: 'Workflow Management',
    icon: Workflow,
    features: [
      { id: 'can_create_workflows', label: 'Create Workflows', description: 'Create new workflow instances' },
      { id: 'can_edit_templates', label: 'Edit Templates', description: 'Modify workflow templates' },
      { id: 'can_manage_steps', label: 'Manage Steps', description: 'Add, edit, delete workflow steps' },
      { id: 'can_assign_workflows', label: 'Assign Workflows', description: 'Assign workflows to users' },
      { id: 'can_view_analytics', label: 'View Analytics', description: 'Access workflow analytics and reports' },
      { id: 'can_approve_workflows', label: 'Approve Workflows', description: 'Approve workflow completion' },
      { id: 'can_cancel_workflows', label: 'Cancel Workflows', description: 'Cancel running workflows' },
      { id: 'can_configure_quality', label: 'Configure Quality', description: 'Set up quality control rules' },
      { id: 'can_manage_templates', label: 'Manage Templates', description: 'Create and modify workflow templates' },
      { id: 'can_view_audit_logs', label: 'View Audit Logs', description: 'Access workflow audit trails' },
    ]
  },
  {
    id: 'data_configuration',
    label: 'Data Configuration',
    icon: TableProperties,
    features: [
      // Column Mapping Rules Permissions
      { id: 'can_view_mapping_rules', label: 'View Mapping Rules', description: 'View column mapping rules' },
      { id: 'can_create_mapping_rules', label: 'Create Mapping Rules', description: 'Create new column mapping rules' },
      { id: 'can_edit_mapping_rules', label: 'Edit Mapping Rules', description: 'Modify existing mapping rules' },
      { id: 'can_delete_mapping_rules', label: 'Delete Mapping Rules', description: 'Delete mapping rules' },
      { id: 'can_activate_mapping_rules', label: 'Activate/Deactivate Rules', description: 'Change rule activation status' },
      { id: 'can_import_export_rules', label: 'Import/Export Rules', description: 'Import and export mapping rules' },
      
      // Dataset Mappings Permissions
      { id: 'can_view_dataset_mappings', label: 'View Dataset Mappings', description: 'View dataset column mappings' },
      { id: 'can_edit_dataset_mappings', label: 'Edit Dataset Mappings', description: 'Modify dataset mappings' },
      { id: 'can_approve_mappings', label: 'Approve Mappings', description: 'Approve mapping suggestions' },
      { id: 'can_reject_mappings', label: 'Reject Mappings', description: 'Reject mapping suggestions' },
      { id: 'can_bulk_manage_mappings', label: 'Bulk Manage Mappings', description: 'Perform bulk operations on mappings' },
      
      // Dynamic Fields Registry Permissions
      { id: 'can_view_dynamic_fields', label: 'View Dynamic Fields', description: 'View dynamic fields registry' },
      { id: 'can_create_dynamic_fields', label: 'Create Dynamic Fields', description: 'Create new dynamic fields' },
      { id: 'can_edit_dynamic_fields', label: 'Edit Dynamic Fields', description: 'Modify dynamic fields' },
      { id: 'can_delete_dynamic_fields', label: 'Delete Dynamic Fields', description: 'Delete dynamic fields' },
      { id: 'can_migrate_fields', label: 'Migrate Fields', description: 'Apply database migrations for fields' },
      { id: 'can_archive_fields', label: 'Archive Fields', description: 'Archive unused dynamic fields' },
      
      // System-level Data Configuration Permissions
      { id: 'can_manage_field_types', label: 'Manage Field Types', description: 'Configure field type settings' },
      { id: 'can_view_mapping_analytics', label: 'View Mapping Analytics', description: 'Access mapping performance analytics' },
      { id: 'can_configure_auto_mapping', label: 'Configure Auto-mapping', description: 'Set up automatic mapping rules' },
      { id: 'can_manage_migration_system', label: 'Manage Migration System', description: 'Control database migration system' },
      { id: 'can_backup_restore_config', label: 'Backup/Restore Config', description: 'Backup and restore configurations' },
    ]
  },
  {
    id: 'sidebar_navigation',
    label: 'Sidebar Navigation',
    icon: Activity,
    features: [
      { id: 'sidebar_dashboard', label: 'Dashboard', description: 'Show Dashboard in sidebar' },
      { id: 'sidebar_projects', label: 'Projects', description: 'Show Projects in sidebar' },
      { id: 'sidebar_workflows', label: 'Workflows', description: 'Show Workflows in sidebar' },
      { id: 'sidebar_patents', label: 'Patents', description: 'Show Patents in sidebar' },
      { id: 'sidebar_prior_art', label: 'Prior Art Search', description: 'Show Prior Art Search in sidebar' },
      { id: 'sidebar_infringement', label: 'Infringement Analysis', description: 'Show Infringement Analysis in sidebar' },
      { id: 'sidebar_analytics', label: 'Analytics', description: 'Show Analytics in sidebar' },
      { id: 'sidebar_attorney_network', label: 'Attorney Network', description: 'Show Attorney Network in sidebar' },
      { id: 'sidebar_prosecution', label: 'Prosecution', description: 'Show Prosecution in sidebar' },
      { id: 'sidebar_collaboration', label: 'Collaboration', description: 'Show Collaboration tools in sidebar' },
      { id: 'sidebar_admin_panel', label: 'Admin Panel', description: 'Show Admin Panel in sidebar (admin/manager only)' },
      { id: 'sidebar_settings', label: 'Settings', description: 'Show Settings in sidebar' },
      { id: 'sidebar_brainstorming', label: 'Brainstorming', description: 'Show Brainstorming in sidebar' },
      { id: 'sidebar_agentic_ai', label: 'Agentic AI', description: 'Show Agentic AI in sidebar' },
    ]
  }
];

// Default permissions for each role
const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'], // Admin has all permissions
  manager: [
    'dashboard_access', 'profile_management', 'notifications',
    'projects_view', 'projects_create', 'projects_edit', 'projects_delete', 'projects_assign',
    'patents_view', 'patents_create', 'patents_edit', 'patents_review',
    'prior_art_search', 'prior_art_create', 'prior_art_execute', 'prior_art_strategies', 'prior_art_similarity',
    'infringement_analysis', 'infringement_create', 'infringement_claim_charts', 'infringement_risk_assessment',
    'patent_landscape', 'competitive_analysis',
    'analytics_view', 'reports_generate', 'reports_export', 'data_visualization',
    'team_collaboration', 'document_sharing', 'comments_reviews', 'attorney_network',
    'file_upload', 'file_download', 'bulk_operations', 'data_export',
    'user_management', 'role_management', 'audit_logs',
    'prosecution_view', 'prosecution_respond', 'prosecution_deadlines',
    'brainstorming_create', 'brainstorming_participate', 'brainstorming_vote',
    'agentic_ai_manage', 'agentic_ai_analysis', 'agentic_ai_insights',
    // Workflow Management
    'can_create_workflows', 'can_edit_templates', 'can_manage_steps', 'can_assign_workflows',
    'can_view_analytics', 'can_approve_workflows', 'can_cancel_workflows', 'can_configure_quality',
    'can_manage_templates', 'can_view_audit_logs',
    // Data Configuration (Full Access)
    'can_view_mapping_rules', 'can_create_mapping_rules', 'can_edit_mapping_rules', 'can_delete_mapping_rules',
    'can_activate_mapping_rules', 'can_import_export_rules', 'can_view_dataset_mappings', 'can_edit_dataset_mappings',
    'can_approve_mappings', 'can_reject_mappings', 'can_bulk_manage_mappings', 'can_view_dynamic_fields',
    'can_create_dynamic_fields', 'can_edit_dynamic_fields', 'can_delete_dynamic_fields', 'can_migrate_fields',
    'can_archive_fields', 'can_manage_field_types', 'can_view_mapping_analytics', 'can_configure_auto_mapping',
    'can_manage_migration_system', 'can_backup_restore_config',
    // Sidebar Navigation
    'sidebar_dashboard', 'sidebar_projects', 'sidebar_workflows', 'sidebar_patents', 'sidebar_prior_art',
    'sidebar_infringement', 'sidebar_analytics', 'sidebar_attorney_network', 'sidebar_prosecution',
    'sidebar_collaboration', 'sidebar_admin_panel', 'sidebar_settings', 'sidebar_brainstorming', 'sidebar_agentic_ai'
  ],
  supervisor: [
    'dashboard_access', 'profile_management', 'notifications',
    'projects_view', 'projects_create', 'projects_edit', 'projects_assign',
    'patents_view', 'patents_create', 'patents_edit', 'patents_review',
    'prior_art_search', 'prior_art_create', 'prior_art_execute',
    'infringement_analysis', 'infringement_create',
    'patent_landscape',
    'analytics_view', 'reports_generate', 'reports_export',
    'team_collaboration', 'document_sharing', 'comments_reviews',
    'file_upload', 'file_download', 'data_export',
    'prosecution_view', 'prosecution_respond',
    'brainstorming_participate', 'brainstorming_vote',
    // Workflow Management
    'can_create_workflows', 'can_edit_templates', 'can_manage_steps', 'can_assign_workflows',
    'can_view_analytics', 'can_approve_workflows', 'can_cancel_workflows',
    // Data Configuration (Limited Access)
    'can_view_mapping_rules', 'can_view_dataset_mappings', 'can_approve_mappings', 'can_reject_mappings',
    'can_view_dynamic_fields', 'can_view_mapping_analytics',
    // Sidebar Navigation
    'sidebar_dashboard', 'sidebar_projects', 'sidebar_workflows', 'sidebar_patents', 'sidebar_prior_art',
    'sidebar_infringement', 'sidebar_analytics', 'sidebar_prosecution', 'sidebar_collaboration', 'sidebar_settings'
  ],
  lead_attorney: [
    'dashboard_access', 'profile_management', 'notifications',
    'projects_view', 'projects_create', 'projects_edit',
    'patents_view', 'patents_create', 'patents_edit', 'patents_review', 'patents_file',
    'prior_art_search', 'prior_art_create', 'prior_art_execute',
    'infringement_analysis', 'infringement_create', 'infringement_claim_charts',
    'patent_landscape',
    'analytics_view', 'reports_generate', 'reports_export',
    'team_collaboration', 'document_sharing', 'comments_reviews', 'attorney_network',
    'file_upload', 'file_download', 'data_export',
    'prosecution_view', 'prosecution_respond', 'prosecution_deadlines',
    'brainstorming_create', 'brainstorming_participate',
    // Workflow Management
    'can_create_workflows', 'can_assign_workflows', 'can_view_analytics', 'can_approve_workflows',
    // Sidebar Navigation
    'sidebar_dashboard', 'sidebar_projects', 'sidebar_workflows', 'sidebar_patents', 'sidebar_prior_art',
    'sidebar_infringement', 'sidebar_analytics', 'sidebar_attorney_network', 'sidebar_prosecution',
    'sidebar_collaboration', 'sidebar_settings', 'sidebar_brainstorming'
  ],
  attorney: [
    'dashboard_access', 'profile_management', 'notifications',
    'projects_view', 'projects_create', 'projects_edit',
    'patents_view', 'patents_create', 'patents_edit', 'patents_file',
    'prior_art_search', 'prior_art_create',
    'infringement_analysis',
    'analytics_view', 'reports_generate',
    'team_collaboration', 'document_sharing', 'comments_reviews', 'attorney_network',
    'file_upload', 'file_download',
    'prosecution_view', 'prosecution_respond',
    'brainstorming_participate',
    // Workflow Management
    'can_create_workflows', 'can_view_analytics',
    // Sidebar Navigation
    'sidebar_dashboard', 'sidebar_projects', 'sidebar_workflows', 'sidebar_patents', 'sidebar_prior_art',
    'sidebar_attorney_network', 'sidebar_prosecution', 'sidebar_collaboration', 'sidebar_settings'
  ],
  paralegal: [
    'dashboard_access', 'profile_management', 'notifications',
    'projects_view', 'projects_create', 'projects_edit',
    'patents_view', 'patents_create', 'patents_edit',
    'prior_art_search',
    'analytics_view',
    'team_collaboration', 'document_sharing', 'comments_reviews',
    'file_upload', 'file_download',
    'prosecution_view',
    // Workflow Management
    'can_create_workflows', 'can_view_analytics',
    // Sidebar Navigation
    'sidebar_dashboard', 'sidebar_projects', 'sidebar_workflows', 'sidebar_patents', 'sidebar_prior_art',
    'sidebar_collaboration', 'sidebar_settings'
  ],
  analyst: [
    'dashboard_access', 'profile_management', 'notifications',
    'projects_view',
    'patents_view',
    'prior_art_search', 'prior_art_create', 'prior_art_execute', 'prior_art_strategies', 'prior_art_similarity',
    'infringement_analysis', 'infringement_create', 'infringement_risk_assessment',
    'patent_landscape', 'competitive_analysis',
    'analytics_view', 'reports_generate', 'reports_export', 'data_visualization',
    'team_collaboration', 'document_sharing', 'comments_reviews',
    'file_upload', 'file_download', 'data_export',
    'agentic_ai_analysis', 'agentic_ai_insights',
    // Workflow Management
    'can_view_analytics',
    // Data Configuration (View Only)
    'can_view_mapping_rules', 'can_view_dataset_mappings', 'can_view_dynamic_fields', 'can_view_mapping_analytics',
    // Sidebar Navigation
    'sidebar_dashboard', 'sidebar_projects', 'sidebar_workflows', 'sidebar_patents', 'sidebar_prior_art',
    'sidebar_infringement', 'sidebar_analytics', 'sidebar_collaboration', 'sidebar_settings', 'sidebar_agentic_ai'
  ],
  client: [
    'dashboard_access', 'profile_management', 'notifications',
    'projects_view',
    'patents_view',
    'analytics_view',
    'team_collaboration', 'document_sharing', 'comments_reviews',
    'file_download',
    // Sidebar Navigation
    'sidebar_dashboard', 'sidebar_projects', 'sidebar_patents', 'sidebar_settings'
  ],
  guest: [
    'dashboard_access', 'profile_management',
    'projects_view',
    'patents_view',
    'analytics_view',
    // Sidebar Navigation
    'sidebar_dashboard'
  ]
};

export function PermissionMatrix() {
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize permissions - load from backend
  useEffect(() => {
    // Only load if user is authenticated (has token)
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEYS.accessToken) : null;
    if (token) {
      loadPermissions();
    } else {
      // No token, use default permissions and stop loading
      setPermissions(DEFAULT_PERMISSIONS);
      setIsLoading(false);
    }
  }, []);

  const loadPermissions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await permissionCache.getRolePermissionMatrix();

      // Convert matrix array to object
      const permissionsObj: Record<string, string[]> = {};
      data.matrix.forEach((item: {role: string, permissions: string[]}) => {
        permissionsObj[item.role] = item.permissions;
      });

      setPermissions(permissionsObj);
    } catch (error: any) {
      console.error('Error loading permissions:', error);
      const errorMessage = error.message || 'Failed to load permissions';
      setError(`${errorMessage}. Using defaults.`);
      toast.error(errorMessage, {
        description: 'Falling back to default permissions'
      });
      // Fallback to default permissions
      setPermissions(DEFAULT_PERMISSIONS);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if a role has a specific permission
  const hasPermission = (roleId: string, featureId: string): boolean => {
    const rolePermissions = permissions[roleId] || [];
    return rolePermissions.includes('*') || rolePermissions.includes(featureId);
  };

  // Toggle permission for a role
  const togglePermission = (roleId: string, featureId: string) => {
    setPermissions(prev => {
      const rolePermissions = prev[roleId] || [];
      let newPermissions;

      if (rolePermissions.includes('*')) {
        // If admin has all permissions, don't allow changes
        if (roleId === 'admin') return prev;
        newPermissions = rolePermissions;
      } else if (rolePermissions.includes(featureId)) {
        // Remove permission
        newPermissions = rolePermissions.filter(p => p !== featureId);
      } else {
        // Add permission
        newPermissions = [...rolePermissions, featureId];
      }

      setHasChanges(true);
      return {
        ...prev,
        [roleId]: newPermissions
      };
    });
  };

  // Enable/disable entire category for a role
  const toggleCategory = (roleId: string, categoryFeatures: string[], enable: boolean) => {
    setPermissions(prev => {
      const rolePermissions = prev[roleId] || [];
      let newPermissions;

      if (enable) {
        // Add all category features
        const uniquePermissions = new Set([...rolePermissions, ...categoryFeatures]);
        newPermissions = Array.from(uniquePermissions).filter(p => p !== '*');
      } else {
        // Remove all category features
        newPermissions = rolePermissions.filter(p => !categoryFeatures.includes(p));
      }

      setHasChanges(true);
      return {
        ...prev,
        [roleId]: newPermissions
      };
    });
  };

  // Save permissions
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const data = await permissionCache.updateRolePermissions(permissions);
      console.log('Permissions saved successfully:', data);
      setHasChanges(false);
      setError(null);

      // Show success toast
      toast.success('Permissions saved successfully!', {
        description: `Updated permissions for ${data.updated_roles?.length || 'all'} role(s)`,
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      const errorMessage = error.message || 'Failed to save permissions';
      setError(errorMessage);
      toast.error('Failed to save permissions', {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    setPermissions(DEFAULT_PERMISSIONS);
    setHasChanges(true);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-4 w-4 text-red-600 mr-2" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Feature Permission Matrix</h3>
          <p className="text-sm text-muted-foreground">
            Configure which features each role can access. Changes are saved automatically.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <Activity className="h-4 w-4 text-yellow-600 mr-2" />
            <span className="text-sm text-yellow-800">You have unsaved changes</span>
          </div>
        </div>
      )}

      {/* Role-Based Permission Matrix */}
      <div className="space-y-6">
        <div>
          <h4 className="text-md font-semibold mb-4">Role-Based Permission Matrix</h4>
          <p className="text-sm text-muted-foreground mb-6">
            Configure default permissions for each user role. All users inherit these permissions based on their assigned role.
          </p>
        </div>
        {FEATURE_CATEGORIES.map(category => (
          <Card key={category.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <category.icon className="h-5 w-5" />
                <CardTitle className="text-base">{category.label}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Feature</TableHead>
                      {USER_ROLES.map(role => (
                        <TableHead key={role.id} className="text-center min-w-[100px]">
                          <div className="space-y-1">
                            <Badge className={`text-xs ${role.color}`}>
                              {role.label}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => {
                                  const categoryFeatureIds = category.features.map(f => f.id);
                                  const hasAll = categoryFeatureIds.every(fId => hasPermission(role.id, fId));
                                  toggleCategory(role.id, categoryFeatureIds, !hasAll);
                                }}
                              >
                                {category.features.every(f => hasPermission(role.id, f.id)) ? 'All' : 'None'}
                              </Button>
                            </div>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {category.features.map(feature => (
                      <TableRow key={feature.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{feature.label}</div>
                            <div className="text-sm text-muted-foreground">
                              {feature.description}
                            </div>
                          </div>
                        </TableCell>
                        {USER_ROLES.map(role => (
                          <TableCell key={role.id} className="text-center">
                            <Checkbox
                              checked={hasPermission(role.id, feature.id)}
                              onCheckedChange={() => togglePermission(role.id, feature.id)}
                              disabled={role.id === 'admin'} // Admin always has all permissions
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Custom User-Specific Permissions */}
      <CustomUserPermissions />
    </div>
  );
}

// Mock user data - In real implementation, this would come from API
const MOCK_USERS = [
  { id: '1', firstName: 'John', lastName: 'Smith', email: 'john.smith@patentpro.com', role: 'attorney' },
  { id: '2', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@patentpro.com', role: 'manager' },
  { id: '3', firstName: 'Mike', lastName: 'Wilson', email: 'mike.wilson@patentpro.com', role: 'supervisor' },
  { id: '4', firstName: 'David', lastName: 'Lee', email: 'david.lee@patentpro.com', role: 'lead_attorney' },
  { id: '5', firstName: 'Robert', lastName: 'Taylor', email: 'robert.taylor@patentpro.com', role: 'attorney' },
  { id: '6', firstName: 'Maria', lastName: 'Rodriguez', email: 'maria.rodriguez@patentpro.com', role: 'paralegal' },
  { id: '7', firstName: 'Alex', lastName: 'Anderson', email: 'alex.anderson@patentpro.com', role: 'analyst' },
  { id: '8', firstName: 'Lisa', lastName: 'Chen', email: 'lisa.chen@patentpro.com', role: 'client' },
  { id: '9', firstName: 'James', lastName: 'Brown', email: 'james.brown@patentpro.com', role: 'attorney' },
  { id: '10', firstName: 'Emma', lastName: 'Davis', email: 'emma.davis@patentpro.com', role: 'paralegal' },
];

interface UserCustomPermission {
  userId: string;
  user: typeof MOCK_USERS[0];
  finalPermissions: string[]; // Complete list of permissions for this user
  addedPermissions: string[]; // Permissions added beyond role
  removedPermissions: string[]; // Role permissions that were removed
  dateAssigned: Date;
}

function CustomUserPermissions() {
  const [customUserPermissions, setCustomUserPermissions] = useState<UserCustomPermission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [initialRolePermissions, setInitialRolePermissions] = useState<string[]>([]);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<typeof MOCK_USERS>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Load users from API
  useEffect(() => {
    // Only load if user is authenticated (has token)
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEYS.accessToken) : null;
    if (token) {
      loadUsers();
    } else {
      // No token, stop loading
      setIsLoadingUsers(false);
    }
  }, []);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const data = await permissionCache.getUsersList();
      // Map API response to expected format
      const users = data.users.map((user: any) => ({
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role
      }));
      setAllUsers(users);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users', {
        description: error.message || 'Using fallback data'
      });
      // Fallback to mock users
      setAllUsers(MOCK_USERS);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Get all available permissions from categories
  const allPermissions = FEATURE_CATEGORIES.flatMap(category => 
    category.features.map(feature => ({
      id: feature.id,
      label: feature.label,
      category: category.label
    }))
  );

  // Filter users based on search
  const filteredCustomUsers = customUserPermissions.filter(userPerm =>
    `${userPerm.user.firstName} ${userPerm.user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    userPerm.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    userPerm.user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get available users for adding (exclude those already with custom permissions)
  const availableUsers = allUsers.filter(user =>
    !customUserPermissions.some(cp => cp.userId === user.id)
  );

  // Get user's role-based permissions
  const getUserRolePermissions = (role: string): string[] => {
    return DEFAULT_PERMISSIONS[role] || [];
  };

  // Initialize permissions when user is selected
  const handleUserSelection = (userId: string) => {
    setSelectedUser(userId);
    const user = allUsers.find(u => u.id === userId);
    if (user) {
      const rolePermissions = getUserRolePermissions(user.role);
      setInitialRolePermissions(rolePermissions);
      setSelectedPermissions([...rolePermissions]); // Pre-tick role permissions
    }
  };

  // Handle adding new user with custom permissions
  const handleAddUser = async () => {
    if (!selectedUser) return;

    const user = allUsers.find(u => u.id === selectedUser);
    if (!user) return;

    const addedPermissions = selectedPermissions.filter(p => !initialRolePermissions.includes(p));
    const removedPermissions = initialRolePermissions.filter(p => !selectedPermissions.includes(p));

    try {
      // Save to backend
      await permissionCache.updateUserPermissions(selectedUser, selectedPermissions);

      const newUserPermission: UserCustomPermission = {
        userId: selectedUser,
        user,
        finalPermissions: selectedPermissions,
        addedPermissions,
        removedPermissions,
        dateAssigned: new Date()
      };

      setCustomUserPermissions(prev => [...prev, newUserPermission]);
      setSelectedUser('');
      setSelectedPermissions([]);
      setInitialRolePermissions([]);
      setIsAddingUser(false);

      toast.success('User permissions saved!', {
        description: `Custom permissions assigned to ${user.firstName} ${user.lastName}`,
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error saving user permissions:', error);
      toast.error('Failed to save user permissions', {
        description: error.message || 'Please try again',
        duration: 5000,
      });
    }
  };

  // Handle editing user permissions
  const handleEditUser = (userId: string) => {
    const userPerm = customUserPermissions.find(up => up.userId === userId);
    if (!userPerm) return;

    const originalRolePermissions = getUserRolePermissions(userPerm.user.role);
    setSelectedUser(userId);
    setSelectedPermissions([...userPerm.finalPermissions]);
    setInitialRolePermissions(originalRolePermissions);
    setEditingUserId(userId);
    setIsAddingUser(true);
  };

  // Handle saving edited permissions
  const handleSaveEdit = async () => {
    if (!editingUserId) return;

    const user = allUsers.find(u => u.id === editingUserId);
    const addedPermissions = selectedPermissions.filter(p => !initialRolePermissions.includes(p));
    const removedPermissions = initialRolePermissions.filter(p => !selectedPermissions.includes(p));

    try {
      // Save to backend
      await permissionCache.updateUserPermissions(editingUserId, selectedPermissions);

      setCustomUserPermissions(prev =>
        prev.map(up =>
          up.userId === editingUserId
            ? {
                ...up,
                finalPermissions: selectedPermissions,
                addedPermissions,
                removedPermissions,
                dateAssigned: new Date()
              }
            : up
        )
      );

      setSelectedUser('');
      setSelectedPermissions([]);
      setInitialRolePermissions([]);
      setEditingUserId(null);
      setIsAddingUser(false);

      toast.success('User permissions updated!', {
        description: user ? `Successfully updated permissions for ${user.firstName} ${user.lastName}` : 'Permissions updated successfully',
        duration: 3000,
      });
    } catch (error: any) {
      toast.error('Failed to update user permissions', {
        description: error.message,
        duration: 5000,
      });
    }
  };

  // Handle removing user custom permissions
  const handleRemoveUser = async (userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    if (!confirm('Are you sure you want to remove custom permissions for this user? They will revert to role-based permissions.')) {
      return;
    }

    try {
      await permissionCache.deleteUserPermissions(userId);

      setCustomUserPermissions(prev => prev.filter(up => up.userId !== userId));

      toast.success('Custom permissions removed!', {
        description: user ? `${user.firstName} ${user.lastName} reverted to role-based permissions` : 'User reverted to role-based permissions',
        duration: 3000,
      });
    } catch (error: any) {
      toast.error('Failed to remove user permissions', {
        description: error.message,
        duration: 5000,
      });
    }
  };

  // Toggle permission selection
  const togglePermissionSelection = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  return (
    <div className="space-y-6 mt-12">
      <Separator />
      
      {/* Header */}
      <div>
        <h4 className="text-md font-semibold mb-2">Custom User-Specific Permissions</h4>
        <p className="text-sm text-muted-foreground mb-6">
          Grant additional permissions to specific users beyond their role-based permissions. Only users with custom permissions are shown below.
        </p>
      </div>

      {/* Search and Add User */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users with custom permissions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog open={isAddingUser} onOpenChange={setIsAddingUser}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setSelectedUser('');
              setSelectedPermissions([]);
              setInitialRolePermissions([]);
              setEditingUserId(null);
            }}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Custom Permissions
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingUserId ? 'Edit Custom Permissions' : 'Add Custom Permissions to User'}
              </DialogTitle>
              <DialogDescription>
                Select a user and grant additional permissions beyond their role-based permissions.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* User Selection */}
              {!editingUserId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select User</label>
                  <Select value={selectedUser} onValueChange={handleUserSelection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{user.firstName} {user.lastName}</span>
                            <Badge className={`ml-2 ${USER_ROLES.find(r => r.id === user.role)?.color || 'bg-gray-100 text-gray-800'}`}>
                              {USER_ROLES.find(r => r.id === user.role)?.label || user.role}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Show selected user's role information */}
              {(selectedUser || editingUserId) && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">User Role & Permissions</label>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={`${USER_ROLES.find(r => r.id === (allUsers.find(u => u.id === (selectedUser || editingUserId))?.role))?.color || 'bg-gray-100 text-gray-800'}`}>
                        {USER_ROLES.find(r => r.id === (allUsers.find(u => u.id === (selectedUser || editingUserId))?.role))?.label || 'Unknown Role'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Configure all permissions below. Role permissions are pre-selected and can be removed if needed.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* All Permissions Selection */}
              <div className="space-y-4">
                <label className="text-sm font-medium">
                  User Permissions 
                  <span className="text-xs text-muted-foreground ml-2">
                    (✓ = inherited from role, can be unchecked to remove)
                  </span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {FEATURE_CATEGORIES.map(category => (
                    <Card key={category.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <category.icon className="h-4 w-4" />
                          {category.label}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {category.features.map(feature => {
                          const isRolePermission = initialRolePermissions.includes(feature.id);
                          const isSelected = selectedPermissions.includes(feature.id);
                          
                          return (
                            <div key={feature.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={feature.id}
                                checked={isSelected}
                                onCheckedChange={() => togglePermissionSelection(feature.id)}
                              />
                              <label htmlFor={feature.id} className={`text-sm flex-1 ${isRolePermission ? 'font-medium' : ''}`}>
                                {feature.label}
                                {isRolePermission && (
                                  <span className="text-xs text-blue-600 ml-1">(role)</span>
                                )}
                              </label>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingUser(false)}>
                Cancel
              </Button>
              <Button 
                onClick={editingUserId ? handleSaveEdit : handleAddUser}
                disabled={(!selectedUser && !editingUserId) || selectedPermissions.length === 0}
              >
                {editingUserId ? 'Save Changes' : 'Add Custom Permissions'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Custom Users Table */}
      {filteredCustomUsers.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Custom Permissions Assigned</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? 'No users found matching your search criteria.'
                  : 'Users with custom permissions beyond their role will appear here.'
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsAddingUser(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First Custom Permission
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCustomUsers.map(userPerm => (
            <Card key={userPerm.userId}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    {/* User Info */}
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-semibold">
                          {userPerm.user.firstName} {userPerm.user.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {userPerm.user.email}
                        </div>
                      </div>
                      <Badge className={`${USER_ROLES.find(r => r.id === userPerm.user.role)?.color || 'bg-gray-100 text-gray-800'}`}>
                        {USER_ROLES.find(r => r.id === userPerm.user.role)?.label || userPerm.user.role}
                      </Badge>
                    </div>

                    {/* Permission Summary */}
                    <div className="space-y-3">
                      <div className="text-sm font-medium">
                        Total Permissions: {userPerm.finalPermissions.length}
                      </div>
                      
                      {/* Added Permissions */}
                      {userPerm.addedPermissions.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-green-700">
                            Added ({userPerm.addedPermissions.length}):
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {userPerm.addedPermissions.map(permId => (
                              <Badge key={permId} className="bg-green-100 text-green-800">
                                +{allPermissions.find(p => p.id === permId)?.label || permId}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Removed Permissions */}
                      {userPerm.removedPermissions.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-red-700">
                            Removed from Role ({userPerm.removedPermissions.length}):
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {userPerm.removedPermissions.map(permId => (
                              <Badge key={permId} className="bg-red-100 text-red-800">
                                -{allPermissions.find(p => p.id === permId)?.label || permId}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* No Changes */}
                      {userPerm.addedPermissions.length === 0 && userPerm.removedPermissions.length === 0 && (
                        <div className="text-sm text-muted-foreground">
                          No changes from role-based permissions
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        Last modified: {userPerm.dateAssigned.toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditUser(userPerm.userId)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRemoveUser(userPerm.userId)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}