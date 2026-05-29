/**
 * Authentication Types
 * Types for authentication and session management
 */

export interface LoginCredentials {
  username: string; // Can be username or email
  password: string;
  rememberMe?: boolean;
}

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
  inviteCode?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface AuthSession {
  user: AuthUser;
  tokens: AuthTokens;
  sessionId: string;
  expiresAt: Date;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
  permissions: string[];
  avatar?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface TwoFactorAuthSetup {
  secret: string;       // base32 secret for manual entry
  qrCode: string;       // data:image/png;base64,... QR to scan
}

export interface TwoFactorAuthVerification {
  code: string;
  trustDevice?: boolean;
}

export interface TwoFactorStatus {
  enabled: boolean;
  backupCodesCount: number;
  lastUsed: string | null;
}

/** Returned by login() when the account has 2FA enabled — no tokens issued yet. */
export interface OtpChallenge {
  requiresOtp: true;
  userId: string;
}

export interface SSOProvider {
  name: string;
  type: 'oauth2' | 'saml';
  clientId: string;
  authUrl: string;
  iconUrl?: string;
}

export interface SessionActivity {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  loginAt: Date;
  lastActivityAt: Date;
  isActive: boolean;
}