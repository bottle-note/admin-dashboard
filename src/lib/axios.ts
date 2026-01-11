/**
 * Axios 인스턴스 및 인터셉터 설정
 * 토큰 자동 첨부 및 리프레시 로직 포함
 */

import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '@/stores/auth';
import type { ApiResponse } from '@/types/api';
import type { RefreshTokenResponse } from '@/types/auth';

// ============================================
// Axios Instance
// ============================================

export const api = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// Token Refresh State
// ============================================

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ============================================
// Request Interceptor
// ============================================

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// ============================================
// Response Interceptor with Token Refresh
// ============================================

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // 401(잘못된 토큰) 또는 403(만료된 토큰)이 아니거나 이미 재시도한 경우 에러 반환
    const isTokenError = error.response?.status === 401 || error.response?.status === 403;
    if (!isTokenError || originalRequest._retry) {
      return Promise.reject(error);
    }

    // 로그인/리프레시 API는 토큰 갱신 시도하지 않음
    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh');

    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    // 이미 리프레시 중이면 큐에 추가
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = useAuthStore.getState().refreshToken;

    if (!refreshToken) {
      isRefreshing = false;
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      // 리프레시 토큰으로 새 토큰 발급 (상대 경로 - nginx/vite proxy 사용)
      const response: AxiosResponse<ApiResponse<RefreshTokenResponse>> =
        await axios.post('/admin/api/v1/auth/refresh', { refreshToken }, {
          headers: { 'Content-Type': 'application/json' },
        });

      if (!response.data.success) {
        throw new Error('Token refresh failed');
      }

      const { accessToken, refreshToken: newRefreshToken } = response.data.data;

      // 새 토큰 저장
      useAuthStore.getState().setTokens({
        accessToken,
        refreshToken: newRefreshToken,
      });

      // 대기 중인 요청들 처리
      processQueue(null, accessToken);

      // 원래 요청 재시도
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      // 리프레시 실패 시 로그아웃
      processQueue(refreshError, null);
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
