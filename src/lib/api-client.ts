/**
 * API 클라이언트 래퍼
 * 기존 axios 인스턴스를 래핑하여 응답 언래핑, 에러 정규화, 로깅 제공
 */

import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { api } from './axios';
import type { ApiResponse } from '@/types/api';
import { ApiError, normalizeError } from './api-error';

// ============================================
// Development Logging
// ============================================

const isDev = import.meta.env.DEV;

function logRequest(method: string, url: string, config?: AxiosRequestConfig): void {
  if (!isDev) return;

  console.group(`[API Request] ${method.toUpperCase()} ${url}`);
  if (config?.params) console.log('Params:', config.params);
  if (config?.data) console.log('Body:', config.data);
  console.groupEnd();
}

function logResponse<T>(
  method: string,
  url: string,
  response: AxiosResponse<ApiResponse<T>>
): void {
  if (!isDev) return;

  console.group(`[API Response] ${method.toUpperCase()} ${url}`);
  console.log('Status:', response.status);
  console.log('Success:', response.data.success);
  console.log('Data:', response.data.data);
  if (response.data.meta?.pageable) {
    console.log('Pageable:', response.data.meta.pageable);
  }
  console.groupEnd();
}

function logError(method: string, url: string, error: unknown): void {
  if (!isDev) return;

  console.group(`[API Error] ${method.toUpperCase()} ${url}`);
  console.error('Error:', error);
  console.groupEnd();
}

// ============================================
// API Client Class
// ============================================

class ApiClient {
  /**
   * GET 요청 - 데이터만 반환
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    logRequest('GET', url, config);

    try {
      const response = await api.get<ApiResponse<T>>(url, config);
      logResponse('GET', url, response);

      if (!response.data.success) {
        throw new ApiError(response.data);
      }

      return response.data.data;
    } catch (error) {
      logError('GET', url, error);
      throw normalizeError(error);
    }
  }

  /**
   * GET 요청 - 전체 응답 반환 (페이지네이션 메타 필요시)
   */
  async getWithMeta<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    logRequest('GET', url, config);

    try {
      const response = await api.get<ApiResponse<T>>(url, config);
      logResponse('GET', url, response);

      if (!response.data.success) {
        throw new ApiError(response.data);
      }

      return response.data;
    } catch (error) {
      logError('GET', url, error);
      throw normalizeError(error);
    }
  }

  /**
   * POST 요청
   */
  async post<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    logRequest('POST', url, { ...config, data });

    try {
      const response = await api.post<ApiResponse<T>>(url, data, config);
      logResponse('POST', url, response);

      if (!response.data.success) {
        throw new ApiError(response.data);
      }

      return response.data.data;
    } catch (error) {
      logError('POST', url, error);
      throw normalizeError(error);
    }
  }

  /**
   * POST 요청 - 전체 응답 반환
   */
  async postWithMeta<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    logRequest('POST', url, { ...config, data });

    try {
      const response = await api.post<ApiResponse<T>>(url, data, config);
      logResponse('POST', url, response);

      if (!response.data.success) {
        throw new ApiError(response.data);
      }

      return response.data;
    } catch (error) {
      logError('POST', url, error);
      throw normalizeError(error);
    }
  }

  /**
   * PUT 요청
   */
  async put<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    logRequest('PUT', url, { ...config, data });

    try {
      const response = await api.put<ApiResponse<T>>(url, data, config);
      logResponse('PUT', url, response);

      if (!response.data.success) {
        throw new ApiError(response.data);
      }

      return response.data.data;
    } catch (error) {
      logError('PUT', url, error);
      throw normalizeError(error);
    }
  }

  /**
   * PATCH 요청
   */
  async patch<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    logRequest('PATCH', url, { ...config, data });

    try {
      const response = await api.patch<ApiResponse<T>>(url, data, config);
      logResponse('PATCH', url, response);

      if (!response.data.success) {
        throw new ApiError(response.data);
      }

      return response.data.data;
    } catch (error) {
      logError('PATCH', url, error);
      throw normalizeError(error);
    }
  }

  /**
   * DELETE 요청
   */
  async delete<T = void>(url: string, config?: AxiosRequestConfig): Promise<T> {
    logRequest('DELETE', url, config);

    try {
      const response = await api.delete<ApiResponse<T>>(url, config);
      logResponse('DELETE', url, response);

      if (!response.data.success) {
        throw new ApiError(response.data);
      }

      return response.data.data;
    } catch (error) {
      logError('DELETE', url, error);
      throw normalizeError(error);
    }
  }
}

// ============================================
// Export Singleton Instance
// ============================================

export const apiClient = new ApiClient();
