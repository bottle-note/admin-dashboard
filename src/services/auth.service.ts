/**
 * 인증 서비스
 * 로그인, 토큰 갱신, 회원가입, 탈퇴 API
 */

import { apiClient } from '@/lib/api-client';
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  SignupRequest,
  SignupResponse,
  WithdrawResponse,
} from '@/types/auth';

// ============================================
// API Endpoints
// ============================================

const AUTH_BASE = '/admin/api/v1/auth';

// ============================================
// Auth Service
// ============================================

export const authService = {
  /**
   * 로그인
   */
  login: (data: LoginRequest): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse, LoginRequest>(`${AUTH_BASE}/login`, data);
  },

  /**
   * 토큰 갱신
   */
  refresh: (data: RefreshTokenRequest): Promise<RefreshTokenResponse> => {
    return apiClient.post<RefreshTokenResponse, RefreshTokenRequest>(
      `${AUTH_BASE}/refresh`,
      data
    );
  },

  /**
   * 어드민 등록 (ROOT_ADMIN 권한 필요)
   */
  signup: (data: SignupRequest): Promise<SignupResponse> => {
    return apiClient.post<SignupResponse, SignupRequest>(`${AUTH_BASE}/signup`, data);
  },

  /**
   * 계정 탈퇴
   */
  withdraw: (): Promise<WithdrawResponse> => {
    return apiClient.delete<WithdrawResponse>(`${AUTH_BASE}/withdraw`);
  },
};

// ============================================
// Query Keys
// ============================================

export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
};
