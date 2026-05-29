/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import axios, { AxiosInstance } from 'axios';
import { 
  LoginCredentials, 
  SignupData, 
  AuthSession, 
  AuthTokens,
  PasswordResetRequest,
  PasswordResetConfirm,
  ChangePasswordRequest,
  TwoFactorAuthSetup,
  TwoFactorAuthVerification,
  TwoFactorStatus,
  OtpChallenge,
  SessionActivity
} from '../types/auth.types';

class AuthService {
  private api: AxiosInstance;
  private refreshPromise: Promise<AuthTokens> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/accounts`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const tokens = await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            // Don't hard-redirect — let the dashboard layout handle it
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Build an AuthSession from a backend login/verify-login payload and persist it.
   * Shared by login() (no 2FA) and verifyLoginOtp() (post-OTP).
   */
  private buildAndSaveSession(data: any): AuthSession {
    const tokens: AuthTokens = {
      accessToken: data.access_token || data.tokens?.accessToken || '',
      refreshToken: data.refresh_token || data.tokens?.refreshToken || '',
      expiresIn: data.expires_in || data.tokens?.expiresIn || 3600,
      tokenType: 'Bearer',
    };

    const user = data.user;
    const sessionData: AuthSession = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name || user.firstName || '',
        lastName: user.last_name || user.lastName || '',
        role: user.role || 'user',
        organizationId: user.organization_id || user.organizationId || '',
        permissions: user.permissions || [],
      },
      tokens,
      sessionId: data.sessionId || user.id,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : new Date(Date.now() + 3600 * 1000),
    };

    this.saveSession(sessionData);
    return sessionData;
  }

  /**
   * Login with email and password.
   * If the account has 2FA enabled, returns an OtpChallenge (no tokens) and the
   * caller must follow up with verifyLoginOtp(). Otherwise returns a live session.
   */
  async login(credentials: LoginCredentials): Promise<AuthSession | OtpChallenge> {
    const response = await this.api.post('/auth/login/', credentials);
    const data = response.data;

    if (data.requiresOtp) {
      return { requiresOtp: true, userId: data.userId };
    }

    return this.buildAndSaveSession(data);
  }

  /**
   * Complete a 2FA login: verify the TOTP/backup code for the pending user and,
   * on success, persist the issued session.
   */
  async verifyLoginOtp(userId: string, code: string): Promise<AuthSession> {
    const response = await this.api.post('/auth/2fa/verify-login/', { user_id: userId, code });
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Invalid verification code');
    }
    return this.buildAndSaveSession(response.data);
  }

  /**
   * Sign up new user
   */
  async signup(data: SignupData): Promise<AuthSession> {
    const response = await this.api.post('/auth/signup/', data);
    
    // For signup, we don't get a session back immediately (pending approval)
    // Return a minimal session structure
    return {
      user: {
        id: response.data.user.id,
        email: response.data.user.email,
        firstName: response.data.user.firstName,
        lastName: response.data.user.lastName,
        role: response.data.user.role || 'guest',
        organizationId: response.data.user.organizationId,
        permissions: []
      },
      tokens: {
        accessToken: '',
        refreshToken: '',
        expiresIn: 0,
        tokenType: 'Bearer'
      },
      sessionId: response.data.user.id,
      expiresAt: new Date()
    };
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        await this.api.post('/auth/logout/', { refresh_token: refreshToken });
      }
    } catch (error) {
      // Even if logout API fails, clear local session
      console.warn('Logout API call failed:', error);
    } finally {
      this.clearSession();
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<AuthTokens> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = this.api
      .post('/auth/refresh/', { refresh: refreshToken })
      .then((response) => {
        const tokens: AuthTokens = {
          accessToken: response.data.access,
          refreshToken: response.data.refresh || refreshToken,
          expiresIn: response.data.expiresIn || 3600,
          tokenType: 'Bearer'
        };
        this.saveTokens(tokens);
        return tokens;
      })
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise!;
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(data: PasswordResetRequest): Promise<void> {
    await this.api.post('/auth/forgot-password/', data);
  }

  /**
   * Verify password reset code
   */
  async verifyResetCode(email: string, code: string): Promise<void> {
    await this.api.post('/auth/verify-reset-code/', { email, code });
  }

  /**
   * Confirm password reset with new password
   */
  async confirmPasswordReset(data: PasswordResetConfirm): Promise<void> {
    await this.api.post('/auth/reset-password/', data);
  }

  /**
   * Resend password reset code
   */
  async resendResetCode(email: string): Promise<void> {
    await this.api.post('/auth/resend-reset-code/', { email });
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await this.api.post('/auth/change-password/', data);
  }

  /**
   * Get the current 2FA status for the authenticated user.
   */
  async getTwoFactorStatus(): Promise<TwoFactorStatus> {
    const response = await this.api.get('/auth/2fa/status/');
    const d = response.data?.data || {};
    return {
      enabled: !!d.enabled,
      backupCodesCount: d.backup_codes_count || 0,
      lastUsed: d.last_used || null,
    };
  }

  /**
   * Begin 2FA setup — returns the secret + QR code to scan. Not yet enabled
   * until verifyTwoFactorSetup() confirms a code.
   */
  async setupTwoFactorAuth(): Promise<TwoFactorAuthSetup> {
    const response = await this.api.post('/auth/2fa/setup/');
    const d = response.data?.data || {};
    return { secret: d.secret, qrCode: d.qr_code };
  }

  /**
   * Confirm 2FA setup with a code from the authenticator app.
   * On success the backend enables 2FA and returns one-time backup codes.
   */
  async verifyTwoFactorSetup(code: string): Promise<string[]> {
    const response = await this.api.post('/auth/2fa/verify/', { code });
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Invalid verification code');
    }
    return response.data.backup_codes || [];
  }

  /**
   * Disable 2FA — requires the account password (and optionally a current code).
   */
  async disableTwoFactorAuth(password: string, code?: string): Promise<void> {
    const response = await this.api.post('/auth/2fa/disable/', { password, code });
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to disable 2FA');
    }
  }

  /**
   * Regenerate backup codes — requires a current authenticator code.
   */
  async regenerateBackupCodes(code: string): Promise<string[]> {
    const response = await this.api.post('/auth/2fa/backup-codes/', { code });
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to regenerate backup codes');
    }
    return response.data.backup_codes || [];
  }

  /**
   * Get active sessions
   * Note: Sessions endpoint not yet implemented on backend
   */
  async getActiveSessions(): Promise<SessionActivity[]> {
    const response = await this.api.get<SessionActivity[]>('/auth/sessions/');
    return response.data;
  }

  /**
   * Revoke a session
   * Note: Sessions endpoint not yet implemented on backend
   */
  async revokeSession(sessionId: string): Promise<void> {
    await this.api.delete(`/auth/sessions/${sessionId}/`);
  }

  /**
   * Get extended user profile
   */
  async getExtendedProfile(): Promise<any> {
    const response = await this.api.get('/users/profile/extended/');
    return response.data;
  }

  /**
   * Update extended user profile
   */
  async updateExtendedProfile(profileData: any): Promise<any> {
    const response = await this.api.put('/users/profile/extended/', profileData);
    return response.data;
  }

  /**
   * Get user settings
   */
  async getUserSettings(): Promise<any> {
    const response = await this.api.get('/users/settings/');
    return response.data;
  }

  /**
   * Update user settings
   */
  async updateUserSettings(settingsData: any): Promise<any> {
    const response = await this.api.put('/users/settings/', settingsData);
    return response.data;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    // Don't check expiresAt here — let the server reject expired tokens
    // via 401 and the interceptor will handle refresh. Checking expiresAt
    // locally was clearing valid tokens when the stored session metadata
    // was stale or missing.
    return true;
  }

  /**
   * Get current session
   */
  getSession(): AuthSession | null {
    const sessionStr = localStorage.getItem('auth_session');
    if (sessionStr) {
      try {
        return JSON.parse(sessionStr);
      } catch {
        // fall through
      }
    }

    // Fallback: reconstruct session from patpipes_ keys (Context auth system)
    const userStr = localStorage.getItem('patpipes_user');
    const token = localStorage.getItem('patpipes_access_token');
    if (userStr && token) {
      try {
        const user = JSON.parse(userStr);
        return {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name || user.firstName || '',
            lastName: user.last_name || user.lastName || '',
            role: user.role || 'user',
            organizationId: user.organization_id || user.organizationId || '',
            permissions: user.permissions || [],
          },
          tokens: {
            accessToken: token,
            refreshToken: localStorage.getItem('patpipes_refresh_token') || '',
            expiresIn: 3600,
            tokenType: 'Bearer',
          },
          sessionId: user.id,
          expiresAt: new Date(Date.now() + 3600 * 1000),
        };
      } catch {
        // fall through
      }
    }

    return null;
  }

  /**
   * Private helper methods
   */
  private saveSession(session: AuthSession): void {
    localStorage.setItem('auth_session', JSON.stringify(session));
    this.saveTokens(session.tokens);
  }

  private saveTokens(tokens: AuthTokens): void {
    localStorage.setItem('access_token', tokens.accessToken);
    localStorage.setItem('refresh_token', tokens.refreshToken);
    // Sync with patpipes_ keys used by Context auth system
    localStorage.setItem('patpipes_access_token', tokens.accessToken);
    localStorage.setItem('patpipes_refresh_token', tokens.refreshToken);
  }

  private clearSession(): void {
    localStorage.removeItem('auth_session');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // Also clear patpipes_ keys
    localStorage.removeItem('patpipes_access_token');
    localStorage.removeItem('patpipes_refresh_token');
    localStorage.removeItem('patpipes_user');
  }

  private getAccessToken(): string | null {
    return localStorage.getItem('access_token') || localStorage.getItem('patpipes_access_token');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token') || localStorage.getItem('patpipes_refresh_token');
  }
}

export const authService = new AuthService();