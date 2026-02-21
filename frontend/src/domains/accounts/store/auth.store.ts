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

  // Actions
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (username: string, password: string) => Promise<void>;
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
          set({ isLoading: true, error: null });
          try {
            const session = await authService.login({ username, password });
            set({
              user: session.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
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