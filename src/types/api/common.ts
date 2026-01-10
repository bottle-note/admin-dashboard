/**
 * Bottle Note API 공통 타입 정의
 * API 응답 구조, 페이지네이션, 에러 등 공통 타입
 */

// ============================================
// API Error Types
// ============================================

/**
 * API 에러 항목
 */
export interface ApiErrorItem {
  code: string;
  message?: string;
}

// ============================================
// Pagination Types
// ============================================

/**
 * 커서 기반 페이지네이션 메타데이터
 */
export interface Pageable {
  currentCursor: number;
  cursor: number;
  pageSize: number;
  hasNext: boolean;
}

/**
 * 커서 기반 페이지네이션 요청 파라미터
 */
export interface CursorPaginationParams {
  cursor?: number;
  pageSize?: number;
}

// ============================================
// Sort Types
// ============================================

/**
 * 정렬 방향
 */
export type SortDirection = 'ASC' | 'DESC';

/**
 * 정렬 파라미터
 */
export interface SortParams<TSortField extends string = string> {
  sortType?: TSortField;
  sortOrder?: SortDirection;
}

/**
 * 페이지네이션 + 정렬 통합 파라미터
 */
export type PaginatedSortParams<TSortField extends string = string> =
  CursorPaginationParams & SortParams<TSortField>;

// ============================================
// API Response Types
// ============================================

/**
 * API 응답 메타데이터
 */
export interface ApiMeta {
  serverVersion: string;
  serverEncoding: string;
  serverResponseTime: number[];
  serverPathVersion: string;
  pageable?: Pageable;
  searchParameters?: Record<string, unknown>;
}

/**
 * 공통 API 응답 래퍼
 * Bottle Note API 응답 구조와 일치
 */
export interface ApiResponse<T> {
  success: boolean;
  code: number;
  data: T;
  errors: ApiErrorItem[];
  meta: ApiMeta;
}

// ============================================
// Paginated Response Helper
// ============================================

/**
 * 페이지네이션 응답 헬퍼 타입
 */
export interface PaginatedData<T> {
  items: T[];
  pageable: Pageable;
}

/**
 * 목록 응답에서 페이지네이션 정보 추출을 위한 타입
 */
export interface ListApiResponse<T> {
  success: boolean;
  code: number;
  data: T[];
  errors: ApiErrorItem[];
  meta: ApiMeta;
}

// ============================================
// Common Domain Types
// ============================================

/**
 * 공통 정렬 타입 (Bottle Note API)
 */
export type AlcoholSortType = 'POPULAR' | 'RATING' | 'PICK' | 'REVIEW';

/**
 * 찜 상태
 */
export type PickStatus = 'PICK' | 'UNPICK';

/**
 * 카테고리 그룹 타입
 */
export type CategoryGroup =
  | 'WHISKY'
  | 'RUM'
  | 'VODKA'
  | 'GIN'
  | 'TEQUILA'
  | 'BRANDY'
  | 'BEER'
  | 'WINE'
  | 'ETC';

/**
 * 위스키 카테고리 타입
 */
export type WhiskyCategory =
  | 'SINGLE_MALT'
  | 'BLEND'
  | 'BLENDED_MALT'
  | 'BOURBON'
  | 'RYE'
  | 'OTHER';
