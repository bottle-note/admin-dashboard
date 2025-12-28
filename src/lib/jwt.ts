/**
 * JWT 유틸리티
 * 토큰 디코딩 및 검증
 */

import type { AdminRole } from '@/types/auth';

// ============================================
// Types
// ============================================

export interface JwtPayload {
  sub: string; // adminId
  email: string;
  name: string;
  roles: AdminRole[];
  iat: number;
  exp: number;
}

// ============================================
// Functions
// ============================================

/**
 * JWT 토큰 페이로드 디코딩
 * 서명 검증 없이 페이로드만 추출
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) {
      return null;
    }

    const payload = parts[1];
    // Base64Url을 Base64로 변환
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * JWT 토큰 만료 여부 확인
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload) return true;

  // exp는 초 단위, Date.now()는 밀리초 단위
  const expirationTime = payload.exp * 1000;
  // 1분의 여유를 두고 만료 체크
  return Date.now() >= expirationTime - 60000;
}

/**
 * JWT 토큰에서 사용자 정보 추출
 */
export function getUserFromToken(token: string) {
  const payload = decodeJwt(token);
  if (!payload) return null;

  return {
    adminId: Number(payload.sub),
    email: payload.email,
    name: payload.name,
    roles: payload.roles,
  };
}
