/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */

import { apiClient, handleApiError } from './client';
import { API_ENDPOINTS, TOKEN_STORAGE_KEYS } from './config';
import type {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
  ChangePasswordRequest,
} from './types';

/**
 * Login user
 */
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.auth.login,
      credentials
    );

    const { user, tokens } = response.data;

    // Store tokens and user data (write both key sets for Zustand/Context compat)
    localStorage.setItem(TOKEN_STORAGE_KEYS.accessToken, tokens.accessToken);
    localStorage.setItem(TOKEN_STORAGE_KEYS.refreshToken, tokens.refreshToken);
    localStorage.setItem(TOKEN_STORAGE_KEYS.user, JSON.stringify(user));
    localStorage.setItem('access_token', tokens.accessToken);
    localStorage.setItem('refresh_token', tokens.refreshToken);

    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Signup new user
 */
export const signup = async (userData: SignupRequest): Promise<SignupResponse> => {
  try {
    const payload = {
      email: userData.email,
      password: userData.password,
      password_confirm: userData.password,
      first_name: userData.firstName,
      last_name: userData.lastName,
      organization_name: userData.companyName,
    };

    const response = await apiClient.post<SignupResponse>(
      API_ENDPOINTS.auth.signup,
      payload
    );

    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Logout user
 */
export const logout = async (): Promise<void> => {
  try {
    const refreshToken = localStorage.getItem(TOKEN_STORAGE_KEYS.refreshToken);

    if (refreshToken) {
      await apiClient.post(API_ENDPOINTS.auth.logout, {
        refresh_token: refreshToken,
      });
    }
  } catch (error) {
    // Continue with logout even if API call fails
    console.error('Logout error:', error);
  } finally {
    // Clear local storage (both key sets)
    localStorage.removeItem(TOKEN_STORAGE_KEYS.accessToken);
    localStorage.removeItem(TOKEN_STORAGE_KEYS.refreshToken);
    localStorage.removeItem(TOKEN_STORAGE_KEYS.user);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_session');
  }
};

/**
 * Change password
 */
export const changePassword = async (
  passwords: ChangePasswordRequest
): Promise<{ message: string }> => {
  try {
    const response = await apiClient.post(
      API_ENDPOINTS.auth.changePassword,
      {
        current_password: passwords.currentPassword,
        new_password: passwords.newPassword,
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

/**
 * Get current user from storage
 */
export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;

  const userStr = localStorage.getItem(TOKEN_STORAGE_KEYS.user);
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;

  const token = localStorage.getItem(TOKEN_STORAGE_KEYS.accessToken);
  return !!token;
};
