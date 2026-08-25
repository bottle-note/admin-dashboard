/** Presigned URL을 통한 S3 파일 업로드 서비스 */

import { apiClient } from '@/lib/api-client';
import { S3Api, type PresignUrlParams, type PresignUrlResponse } from '@/types/api/s3.api';

// ============================================
// Service
// ============================================

export const s3Service = {
  /**
   * Presigned URL 발급
   * @param params - rootPath: 업로드 경로, uploadSize: URL 개수
   * @returns Presigned URL 정보
   */
  getPresignedUrls: async (params: PresignUrlParams): Promise<PresignUrlResponse> => {
    const response = await apiClient.get<PresignUrlResponse>(S3Api.presignUrl.endpoint, {
      params,
    });
    return response.data;
  },

  /**
   * S3에 파일 직접 업로드
   * Presigned URL을 사용하여 S3에 PUT 요청
   * axios 인터셉터를 우회하기 위해 fetch 사용
   *
   * @param uploadUrl - Presigned URL
   * @param file - 업로드할 파일
   * @throws 업로드 실패 시 에러
   */
  uploadToS3: async (uploadUrl: string, file: File, contentType?: string): Promise<void> => {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': contentType ?? file.type,
      },
    });

    if (!response.ok) {
      throw new Error(`S3 업로드 실패: ${response.status} ${response.statusText}`);
    }
  },

  /** Presigned URL을 발급해 파일 하나를 업로드하고 CDN 조회 URL을 반환한다. */
  uploadFile: async (file: File, rootPath: string, contentType?: string): Promise<string> => {
    // 1. Presigned URL 발급
    const presignResponse = await s3Service.getPresignedUrls({
      rootPath,
      uploadSize: 1,
      contentType: contentType ?? file.type,
    });

    const uploadInfo = presignResponse.imageUploadInfo[0];
    if (!uploadInfo) {
      throw new Error('Presigned URL 발급 실패');
    }

    // 2. S3에 업로드 (presign 서명과 동일한 contentType 사용)
    const resolvedContentType = contentType ?? file.type;
    await s3Service.uploadToS3(uploadInfo.uploadUrl, file, resolvedContentType);

    // 3. CDN URL 반환
    return uploadInfo.viewUrl;
  },

  /** 여러 파일을 병렬로 업로드하고 입력 순서대로 CDN 조회 URL을 반환한다. */
  uploadFiles: async (files: File[], rootPath: string): Promise<string[]> => {
    if (files.length === 0) return [];

    return Promise.all(files.map((file) => s3Service.uploadFile(file, rootPath)));
  },
};
