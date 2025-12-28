/**
 * 인증 관련 타입 정의
 */

// ============================================
// Admin Roles
// ============================================

export type AdminRole =
  | 'ROOT_ADMIN'
  | 'PARTNER'
  | 'CLIENT'
  | 'BAR_OWNER'
  | 'COMMUNITY_MANAGER';

// ============================================
// Admin User
// ============================================

export interface AdminUser {
  adminId: number;
  email: string;
  name: string;
  roles: AdminRole[];
}

// ============================================
// Login
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

// ============================================
// Token Refresh
// ============================================

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// ============================================
// Admin Signup
// ============================================

export interface SignupRequest {
  email: string;
  /** 8-35자 */
  password: string;
  /** 2-50자 */
  name: string;
  roles: AdminRole[];
}

export interface SignupResponse {
  adminId: number;
  email: string;
  name: string;
  roles: AdminRole[];
}

// ============================================
// Account Withdrawal
// ============================================

export interface WithdrawResponse {
  message: string;
}
