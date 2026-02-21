/**
 * User and Authentication Types
 * Core type definitions for user management
 */

export enum UserRole {
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  ANALYST = 'analyst',
  ATTORNEY = 'attorney',
  LEAD_ATTORNEY = 'lead_attorney',
  CLIENT = 'client',
  GUEST = 'guest',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  phoneNumber?: string;
  title?: string;
  department?: string;
  organizationId: string;
  teamIds: string[];
  permissions: Permission[];
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  scope?: 'own' | 'team' | 'organization' | 'all';
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  dashboardLayout?: string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  projectUpdates: boolean;
  patentDeadlines: boolean;
  teamMentions: boolean;
}

export interface Organization {
  id: string;
  name: string;
  domain: string;
  logo?: string;
  industry: string;
  size: 'small' | 'medium' | 'large' | 'enterprise';
  subscription: SubscriptionPlan;
  settings: OrganizationSettings;
  createdAt: Date;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: 'free' | 'professional' | 'enterprise';
  features: string[];
  limits: {
    users: number;
    projects: number;
    storage: number; // in GB
    apiCalls: number;
  };
  validUntil: Date;
}

export interface OrganizationSettings {
  allowedDomains: string[];
  ssoEnabled: boolean;
  mfaRequired: boolean;
  dataRetentionDays: number;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  leaderId: string;
  memberIds: string[];
  createdAt: Date;
}

export interface AttorneyProfile extends User {
  barNumber: string;
  jurisdictions: string[];
  practiceAreas: string[];
  yearsOfExperience: number;
  education: Education[];
  certifications: Certification[];
  publications?: Publication[];
  cases?: CaseReference[];
  hourlyRate?: number;
  bio?: string;
}

export interface Education {
  degree: string;
  institution: string;
  year: number;
  field?: string;
}

export interface Certification {
  name: string;
  issuer: string;
  dateIssued: Date;
  expiryDate?: Date;
}

export interface Publication {
  title: string;
  journal?: string;
  date: Date;
  url?: string;
}

export interface CaseReference {
  title: string;
  caseNumber: string;
  year: number;
  outcome?: string;
}

export interface RoleInfo {
  label: string;
  color: string;
  description: string;
}

export const ROLE_INFO: Record<UserRole, RoleInfo> = {
  [UserRole.ADMIN]: {
    label: 'Administrator',
    color: 'bg-red-100 text-red-800',
    description: 'Full system access and user management'
  },
  [UserRole.SUPERVISOR]: {
    label: 'Supervisor',
    color: 'bg-orange-100 text-orange-800',
    description: 'Team leadership and project oversight'
  },
  [UserRole.ATTORNEY]: {
    label: 'Attorney',
    color: 'bg-blue-100 text-blue-800',
    description: 'Patent prosecution and legal services'
  },
  [UserRole.LEAD_ATTORNEY]: {
    label: 'Lead Attorney',
    color: 'bg-purple-100 text-purple-800',
    description: 'Senior legal counsel and case management'
  },
  [UserRole.ANALYST]: {
    label: 'Analyst',
    color: 'bg-green-100 text-green-800',
    description: 'Patent research and analysis'
  },
  [UserRole.CLIENT]: {
    label: 'Client',
    color: 'bg-gray-100 text-gray-800',
    description: 'External client access'
  },
  [UserRole.GUEST]: {
    label: 'Guest',
    color: 'bg-gray-100 text-gray-600',
    description: 'Limited read-only access'
  }
};