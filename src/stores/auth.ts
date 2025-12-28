/**
 * 인증 상태 관리 스토어
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminRole } from '@/types/auth';

// ============================================
// Types
// ============================================

export interface AdminUser {
  adminId: number;
  email: string;
  name: string;
  roles: AdminRole[];
}

interface AuthState {
  user: AdminUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Actions
  setAuth: (params: {
    user: AdminUser;
    accessToken: string;
    refreshToken: string;
  }) => void;
  setTokens: (params: { accessToken: string; refreshToken: string }) => void;
  logout: () => void;

  // Helpers
  hasRole: (role: AdminRole) => boolean;
  hasAnyRole: (roles: AdminRole[]) => boolean;
}

// ============================================
// Store
// ============================================

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: ({ user, accessToken, refreshToken }) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

      setTokens: ({ accessToken, refreshToken }) =>
        set({
          accessToken,
          refreshToken,
        }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),

      hasRole: (role) => {
        const { user } = get();
        return user?.roles.includes(role) ?? false;
      },

      hasAnyRole: (roles) => {
        const { user } = get();
        return roles.some((role) => user?.roles.includes(role)) ?? false;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
