/**
 * API Type Definitions
 * TypeScript interfaces for API requests and responses
 */

// Authentication Types
export interface LoginRequest {
  username?: string;  // Can be either email or username
  email?: string;     // Can be either email or username
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    organizationId: string | null;
    permissions: string[];
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  };
  sessionId: string;
  expiresAt: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  companyName?: string;
  role?: string;
  industry?: string;
}

export interface SignupResponse {
  message: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: string;
  };
}

export interface RefreshTokenRequest {
  refresh: string;
}

export interface RefreshTokenResponse {
  access: string;
  expiresIn: number;
  tokenType: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string | null;
  phoneNumber?: string;
  title?: string;
  department?: string;
  timezone: string;
  language: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  title: string;
  department: string;
  timezone: string;
  language: string;
  barNumber: string;
  licenseStates: string[];
  specializations: string[];
  yearsExperience: number;
  certifications: string[];
  preferredDatabases: string[];
  defaultSearchStrategy: string;
  companyName: string;
  industry: string;
}

export interface UserSettings {
  darkMode: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  attorneySettings?: {
    billingRate: number;
    timeTrackingEnabled: boolean;
    clientCommunicationCc: boolean;
    autoBillCreation: boolean;
    deadlineBufferDays: number;
    billableHourAlerts: boolean;
  };
  analystSettings?: {
    defaultDatabases: string[];
    searchResultLimit: number;
    autoClassification: boolean;
    exportFormat: string;
    citationAlerts: boolean;
    landscapeAutoRefresh: boolean;
  };
}

// Contact Form Types
export interface ContactRequest {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  department: string;
  subject: string;
  message: string;
}

export interface ContactResponse {
  message: string;
  ticketId?: string;
}

// API Error Types
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}
