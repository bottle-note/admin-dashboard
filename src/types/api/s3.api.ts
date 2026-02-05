/**
 * S3 Presigned URL API 타입 정의
 * 이미지 업로드를 위한 Presigned URL 발급 관련 타입
 */

// ============================================
// API 엔드포인트 정의
// ============================================

export const S3Api = {
  /** Presigned URL 발급 */
  presignUrl: {
    endpoint: '/admin/api/v1/s3/presign-url',
    method: 'GET',
  },
} as const;

// ============================================
// 요청/응답 타입
// ============================================

/**
 * Presigned URL 발급 요청 파라미터
 * @param rootPath - 업로드 경로 (예: 'admin/alcohol', 'admin/banner')
 * @param uploadSize - 발급할 URL 개수
 */
export interface PresignUrlParams {
  rootPath: string;
  uploadSize: number;
}

/**
 * 이미지 업로드 정보
 * @param order - 이미지 순서
 * @param viewUrl - CDN 조회 URL (저장용)
 * @param uploadUrl - S3 업로드 URL (Presigned)
 */
export interface ImageUploadInfo {
  order: number;
  viewUrl: string;
  uploadUrl: string;
}

/**
 * Presigned URL 발급 응답
 * @param bucketName - S3 버킷명
 * @param expiryTime - URL 만료 시간 (분)
 * @param uploadSize - 발급된 URL 개수
 * @param imageUploadInfo - 이미지 업로드 정보 배열
 */
export interface PresignUrlResponse {
  bucketName: string;
  expiryTime: number;
  uploadSize: number;
  imageUploadInfo: ImageUploadInfo[];
}

// ============================================
// 업로드 경로 상수
// ============================================

/** 이미지 업로드 경로 */
export const S3UploadPath = {
  /** 위스키/알콜 이미지 */
  ALCOHOL: 'admin/alcohol',
  /** 배너 이미지 */
  BANNER: 'admin/banner',
  /** 큐레이션 커버 이미지 */
  CURATION: 'admin/curation',
  /** 테이스팅 태그 아이콘 */
  TASTING_TAG: 'admin/tasting-tag',
} as const;

export type S3UploadPathType = (typeof S3UploadPath)[keyof typeof S3UploadPath];
