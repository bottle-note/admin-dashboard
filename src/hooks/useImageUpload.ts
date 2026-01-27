/**
 * 이미지 업로드 훅
 * S3 Presigned URL을 통한 이미지 업로드 기능 제공
 */

import { useState, useCallback } from 'react';
import { s3Service } from '@/services/s3.service';
import { S3UploadPath, type S3UploadPathType } from '@/types/api/s3.api';

// ============================================
// Types
// ============================================

/**
 * useImageUpload 훅 옵션
 * @param rootPath - S3 업로드 경로
 * @param onSuccess - 업로드 성공 콜백
 * @param onError - 업로드 실패 콜백
 */
export interface UseImageUploadOptions {
  rootPath: S3UploadPathType | string;
  onSuccess?: (viewUrl: string) => void;
  onError?: (error: Error) => void;
}

/**
 * useImageUpload 훅 반환값
 * @param upload - 단일 이미지 업로드 함수
 * @param uploadMultiple - 다중 이미지 업로드 함수
 * @param isUploading - 업로드 진행 중 여부
 * @param error - 업로드 에러
 * @param reset - 에러 상태 초기화
 */
export interface UseImageUploadReturn {
  upload: (file: File) => Promise<string | null>;
  uploadMultiple: (files: File[]) => Promise<string[]>;
  isUploading: boolean;
  error: Error | null;
  reset: () => void;
}

// ============================================
// Hook
// ============================================

/**
 * 이미지 업로드 훅
 *
 * @example
 * ```tsx
 * const { upload, isUploading, error } = useImageUpload({
 *   rootPath: S3UploadPath.ALCOHOL,
 *   onSuccess: (url) => console.log('Uploaded:', url),
 * });
 *
 * const handleImageChange = async (file: File) => {
 *   const viewUrl = await upload(file);
 *   if (viewUrl) {
 *     form.setValue('imageUrl', viewUrl);
 *   }
 * };
 * ```
 */
export function useImageUpload(options: UseImageUploadOptions): UseImageUploadReturn {
  const { rootPath, onSuccess, onError } = options;

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * 단일 이미지 업로드
   * @returns 성공 시 viewUrl, 실패 시 null
   */
  const upload = useCallback(
    async (file: File): Promise<string | null> => {
      setIsUploading(true);
      setError(null);

      try {
        const viewUrl = await s3Service.uploadImage(file, rootPath);
        onSuccess?.(viewUrl);
        return viewUrl;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('이미지 업로드 실패');
        setError(error);
        onError?.(error);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [rootPath, onSuccess, onError]
  );

  /**
   * 다중 이미지 업로드
   * @returns 성공한 이미지들의 viewUrl 배열
   */
  const uploadMultiple = useCallback(
    async (files: File[]): Promise<string[]> => {
      if (files.length === 0) return [];

      setIsUploading(true);
      setError(null);

      try {
        const viewUrls = await s3Service.uploadImages(files, rootPath);
        return viewUrls;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('이미지 업로드 실패');
        setError(error);
        onError?.(error);
        return [];
      } finally {
        setIsUploading(false);
      }
    },
    [rootPath, onError]
  );

  /**
   * 에러 상태 초기화
   */
  const reset = useCallback(() => {
    setError(null);
  }, []);

  return {
    upload,
    uploadMultiple,
    isUploading,
    error,
    reset,
  };
}

// Re-export for convenience
export { S3UploadPath };
