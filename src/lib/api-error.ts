/**
 * API 에러 처리 유틸리티
 * 에러 정규화, 에러 코드 → 메시지 매핑
 */

import { AxiosError } from 'axios';
import type { ApiResponse, ApiErrorItem } from '@/types/api';

// ============================================
// Error Code → Message Mapping (한글)
// ============================================

/**
 * 도메인별 에러 코드에 대한 사용자 친화적 메시지
 * 필요에 따라 확장 가능
 */
export const ERROR_MESSAGES: Record<string, string> = {
  // 공통 HTTP 에러
  BAD_REQUEST: '잘못된 요청입니다.',
  UNAUTHORIZED: '인증이 필요합니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  INTERNAL_SERVER_ERROR: '서버 오류가 발생했습니다.',

  // 주류(Alcohol) 도메인 에러
  ALCOHOL_ID_REQUIRED: '주류 ID가 필요합니다.',
  ALCOHOL_ID_MINIMUM: '주류 ID는 1 이상이어야 합니다.',
  ALCOHOL_NOT_FOUND: '해당 주류를 찾을 수 없습니다.',

  // 사용자(User) 도메인 에러
  USER_NOT_FOUND: '사용자를 찾을 수 없습니다.',
  USER_ALREADY_EXISTS: '이미 존재하는 사용자입니다.',
  INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다.',

  // 찜하기(Pick) 도메인 에러
  IS_PICKED_REQUIRED: '찜하기 여부가 필요합니다.',

  // 리뷰(Review) 도메인 에러
  REVIEW_NOT_FOUND: '리뷰를 찾을 수 없습니다.',
  REVIEW_ALREADY_EXISTS: '이미 리뷰를 작성하셨습니다.',

  // 유효성 검사 에러
  VALIDATION_ERROR: '입력값을 확인해주세요.',

  // 네트워크 에러
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  TIMEOUT_ERROR: '요청 시간이 초과되었습니다.',

  // 기본값
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
};

// ============================================
// ApiError Class
// ============================================

/**
 * API 에러를 나타내는 커스텀 에러 클래스
 */
export class ApiError extends Error {
  public readonly code: number;
  public readonly errors: ApiErrorItem[];
  public readonly isApiError = true as const;

  constructor(response: ApiResponse<unknown>) {
    // 첫 번째 에러 메시지 사용 또는 폴백
    const firstError = response.errors[0];
    const message =
      firstError?.message ||
      ERROR_MESSAGES[firstError?.code ?? ''] ||
      ERROR_MESSAGES.UNKNOWN_ERROR;

    super(message);
    this.name = 'ApiError';
    this.code = response.code;
    this.errors = response.errors;

    // V8 엔진에서 스택 트레이스 유지
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * 주요 에러 코드 반환
   */
  get primaryCode(): string {
    return this.errors[0]?.code ?? 'UNKNOWN_ERROR';
  }

  /**
   * 특정 에러 코드 포함 여부 확인
   */
  hasCode(code: string): boolean {
    return this.errors.some((e) => e.code === code);
  }

  /**
   * 모든 에러 메시지 배열로 반환
   */
  getAllMessages(): string[] {
    return this.errors.map(
      (e) => e.message || ERROR_MESSAGES[e.code] || '알 수 없는 오류가 발생했습니다.'
    );
  }
}

// ============================================
// Error Normalization
// ============================================

/**
 * 모든 에러 타입을 ApiError 또는 표준 Error로 정규화
 */
export function normalizeError(error: unknown): ApiError | Error {
  // 이미 ApiError인 경우
  if (isApiError(error)) {
    return error;
  }

  // Axios 에러인 경우
  if (error instanceof AxiosError) {
    // 서버에서 응답을 받은 경우
    if (error.response?.data) {
      const responseData = error.response.data as ApiResponse<unknown>;
      if (responseData.errors && Array.isArray(responseData.errors)) {
        return new ApiError(responseData);
      }
    }

    // 네트워크 에러
    if (error.code === 'ERR_NETWORK') {
      return new ApiError({
        success: false,
        code: 0,
        data: null,
        errors: [{ code: 'NETWORK_ERROR' }],
        meta: {
          serverVersion: '',
          serverEncoding: '',
          serverResponseTime: [],
          serverPathVersion: '',
        },
      });
    }

    // 타임아웃 에러
    if (error.code === 'ECONNABORTED') {
      return new ApiError({
        success: false,
        code: 0,
        data: null,
        errors: [{ code: 'TIMEOUT_ERROR' }],
        meta: {
          serverVersion: '',
          serverEncoding: '',
          serverResponseTime: [],
          serverPathVersion: '',
        },
      });
    }

    // HTTP 상태 코드 기반 에러
    const status = error.response?.status ?? 500;
    const statusCodeMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      500: 'INTERNAL_SERVER_ERROR',
    };

    return new ApiError({
      success: false,
      code: status,
      data: null,
      errors: [{ code: statusCodeMap[status] || 'UNKNOWN_ERROR' }],
      meta: {
        serverVersion: '',
        serverEncoding: '',
        serverResponseTime: [],
        serverPathVersion: '',
      },
    });
  }

  // 표준 Error인 경우
  if (error instanceof Error) {
    return error;
  }

  // 알 수 없는 에러 타입
  return new Error(String(error));
}

// ============================================
// Type Guard
// ============================================

/**
 * ApiError 타입 가드
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    error instanceof ApiError ||
    (error !== null &&
      typeof error === 'object' &&
      'isApiError' in error &&
      error.isApiError === true)
  );
}

/**
 * 모든 에러에서 사용자 친화적 메시지 추출
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return '알 수 없는 오류가 발생했습니다.';
}
