/**
 * Authentication Store
 * Global state management for authentication using Zustand
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { AuthUser } from '../types/auth.types';
import { authService } from '../services/auth.service';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // 2FA login challenge — set when password is correct but an OTP is still required.
  otpRequired: boolean;
  otpUserId: string | null;

  // Actions
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (username: string, password: string) => Promise<{ requiresOtp: boolean }>;
  verifyOtp: (code: string) => Promise<void>;
  cancelOtp: () => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        isAuthenticated: false,
        isLoading: true,  // Start true — prevent redirect before persist hydration
        error: null,
        otpRequired: false,
        otpUserId: null,

        setUser: (user) => 
          set({ 
            user, 
            isAuthenticated: !!user,
            error: null 
          }),

        setLoading: (loading) => 
          set({ isLoading: loading }),

        setError: (error) => 
          set({ error }),

        clearError: () => 
          set({ error: null }),

        login: async (username, password) => {
          set({ isLoading: true, error: null, otpRequired: false, otpUserId: null });
          try {
            const result = await authService.login({ username, password });

            // 2FA enabled → password OK, but tokens are withheld until OTP verified.
            if ('requiresOtp' in result) {
              set({
                isAuthenticated: false,
                isLoading: false,
                error: null,
                otpRequired: true,
                otpUserId: result.userId,
              });
              return { requiresOtp: true };
            }

            set({
              user: result.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              otpRequired: false,
              otpUserId: null,
            });
            return { requiresOtp: false };
          } catch (error: any) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: error.response?.data?.message || 'Login failed',
            });
            throw error;
          }
        },

        verifyOtp: async (code) => {
          const { otpUserId } = get();
          if (!otpUserId) throw new Error('No pending OTP challenge');
          set({ isLoading: true, error: null });
          try {
            const session = await authService.verifyLoginOtp(otpUserId, code);
            set({
              user: session.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              otpRequired: false,
              otpUserId: null,
            });
          } catch (error: any) {
            set({
              isLoading: false,
              error: error.response?.data?.message || error.message || 'Invalid verification code',
            });
            throw error;
          }
        },

        cancelOtp: () =>
          set({ otpRequired: false, otpUserId: null, error: null, isLoading: false }),

        logout: async () => {
          set({ isLoading: true });
          try {
            await authService.logout();
          } finally {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
              otpRequired: false,
              otpUserId: null,
            });
          }
        },

        checkAuth: async () => {
          // Don't set loading state to avoid re-renders
          try {
            // Primary check: does a token exist?
            const token = localStorage.getItem('access_token')
              || localStorage.getItem('patpipes_access_token');

            if (!token) {
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
              });
              return;
            }

            // Token exists — we're authenticated.
            // Try to populate user info from session if available.
            const session = authService.getSession();
            if (session?.user) {
              set({
                user: session.user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
            } else {
              // Token exists but no session metadata — still authenticated
              set({
                isAuthenticated: true,
                isLoading: false,
              });
            }
          } catch (error) {
            set({
              isLoading: false,
            });
          }
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated
        }),
        onRehydrateStorage: () => {
          // After Zustand hydrates persisted state, run checkAuth
          // to validate tokens are still in localStorage
          return (state) => {
            state?.checkAuth();
          };
        },
      }
    )
  )
);