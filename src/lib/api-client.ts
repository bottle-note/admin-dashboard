/**
 * API 클라이언트 래퍼
 * 기존 axios 인스턴스를 래핑하여 응답 언래핑, 에러 정규화 제공
 */

import type { AxiosRequestConfig } from 'axios';
import { api } from './axios';
import type { ApiResponse } from '@/types/api';
import { ApiError, normalizeError } from './api-error';

// ============================================
// API Client Class
// ============================================

class ApiClient {
  /**
   * GET 요청 - 데이터만 반환
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await api.get<ApiResponse<T>>(url, config);

      if (!response.data.success) {
        throw new ApiError(response.data);
      }

      return response.data.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * GET 요청 - 전체 응답 반환 (페이지네이션 메타 필요시)
   */
  async getWithMeta<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await api.get<ApiResponse<T>>(url, config);

      if (!response.data.success) {
        throw new ApiError(response.data);
      }

      return response.data;
    } catch (error) {
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
    try {
      const response = await api.post<ApiResponse<T>>(url, data, config);

      if (!response.data.success) {
        throw new ApiError(response.data);
      }

      return response.data.data;
    } catch (error) {
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
    try {
      const response = await api.post<ApiResponse<T>>(url, data, config);

      if (!response.data.success) {
        throw new ApiError(response.data);
      }

      return response.data;
    } catch (error) {
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
    try {
      const response = await api.put<ApiResponse<T>>(url, data, config);

      if (!response.data.success) {
        throw new ApiError(response.data);
      }

      return response.data.data;
    } catch (error) {
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
    try {
      const response = await api.patch<ApiResponse<T>>(url, data, config);

      if (!response.data.success) {
        throw new ApiError(response.data);
      }

      return response.data.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * DELETE 요청
   */
  async delete<T = void>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await api.delete<ApiResponse<T>>(url, config);

      if (!response.data.success) {
        throw new ApiError(response.data);
      }

      return response.data.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }
}

// ============================================
// Export Singleton Instance
// ============================================

export const apiClient = new ApiClient();
