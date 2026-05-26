/**
 * API Configuration
 * Central configuration for backend API communication
 */

export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
};

export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/accounts/auth/login/',
    signup: '/accounts/auth/signup/',
    logout: '/accounts/auth/logout/',
    refresh: '/accounts/auth/refresh/',
    changePassword: '/accounts/auth/change-password/',
  },

  // User
  user: {
    me: '/accounts/users/me/',
    profile: '/accounts/users/profile/',
    extendedProfile: '/accounts/users/profile/extended/',
    settings: '/accounts/users/settings/',
  },

  // Health
  health: '/health/',
};

export const TOKEN_STORAGE_KEYS = {
  accessToken: 'patpipes_access_token',
  refreshToken: 'patpipes_refresh_token',
  user: 'patpipes_user',
};
