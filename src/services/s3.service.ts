/**
 * S3 이미지 업로드 서비스
 * Presigned URL을 통한 S3 직접 업로드 처리
 */

import { apiClient } from '@/lib/api-client';
import {
  S3Api,
  type PresignUrlParams,
  type PresignUrlResponse,
} from '@/types/api/s3.api';

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
    return apiClient.get<PresignUrlResponse>(S3Api.presignUrl.endpoint, {
      params,
    });
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
  uploadToS3: async (uploadUrl: string, file: File): Promise<void> => {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error(`S3 업로드 실패: ${response.status} ${response.statusText}`);
    }
  },

  /**
   * 이미지 업로드 (Presigned URL 발급 + S3 업로드 통합)
   * 단일 이미지 업로드 시 편의를 위한 통합 메서드
   *
   * @param file - 업로드할 파일
   * @param rootPath - 업로드 경로
   * @returns CDN 조회 URL (viewUrl)
   */
  uploadImage: async (file: File, rootPath: string): Promise<string> => {
    // 1. Presigned URL 발급
    const presignResponse = await s3Service.getPresignedUrls({
      rootPath,
      uploadSize: 1,
    });

    const uploadInfo = presignResponse.imageUploadInfo[0];
    if (!uploadInfo) {
      throw new Error('Presigned URL 발급 실패');
    }

    // 2. S3에 업로드
    await s3Service.uploadToS3(uploadInfo.uploadUrl, file);

    // 3. CDN URL 반환
    return uploadInfo.viewUrl;
  },

  /**
   * 다중 이미지 업로드
   * 여러 이미지를 병렬로 업로드
   *
   * @param files - 업로드할 파일 배열
   * @param rootPath - 업로드 경로
   * @returns CDN 조회 URL 배열 (순서 보장)
   */
  uploadImages: async (files: File[], rootPath: string): Promise<string[]> => {
    if (files.length === 0) return [];

    // 1. Presigned URL 일괄 발급
    const presignResponse = await s3Service.getPresignedUrls({
      rootPath,
      uploadSize: files.length,
    });

    // 2. 병렬 업로드
    const uploadPromises = presignResponse.imageUploadInfo.map(
      async (info, index) => {
        const file = files[index];
        if (!file) {
          throw new Error(`파일 인덱스 ${index} 누락`);
        }
        await s3Service.uploadToS3(info.uploadUrl, file);
        return info.viewUrl;
      }
    );

    return Promise.all(uploadPromises);
  },
};
