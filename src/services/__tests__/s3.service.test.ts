import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { s3Service } from '../s3.service';

// ============================================
// 5. S3 presigned URL contentType 전달 테스트
// ============================================

const S3_ENDPOINT = '/admin/api/v1/s3/presign-url';

const mockPresignResponse = {
  success: true,
  code: 200,
  data: {
    bucketName: 'test-bucket',
    expiryTime: 15,
    uploadSize: 1,
    imageUploadInfo: [
      {
        order: 0,
        viewUrl: 'https://cdn.example.com/admin/banner/test-uuid.jpg',
        uploadUrl: 'https://s3.amazonaws.com/test-bucket/admin/banner/test-uuid.jpg?presigned=true',
      },
    ],
  },
  errors: [],
  meta: {},
};

describe('s3Service', () => {
  describe('getPresignedUrls', () => {
    it('contentType 파라미터를 전달한다', async () => {
      let capturedContentType: string | null = null;

      server.use(
        http.get(S3_ENDPOINT, ({ request }) => {
          const url = new URL(request.url);
          capturedContentType = url.searchParams.get('contentType');
          return HttpResponse.json(mockPresignResponse);
        })
      );

      await s3Service.getPresignedUrls({
        rootPath: 'admin/banner',
        uploadSize: 1,
        contentType: 'video/mp4',
      });

      expect(capturedContentType).toBe('video/mp4');
    });

    it('contentType 미지정 시 파라미터가 전달되지 않는다', async () => {
      let capturedContentType: string | null = 'should-be-null';

      server.use(
        http.get(S3_ENDPOINT, ({ request }) => {
          const url = new URL(request.url);
          capturedContentType = url.searchParams.get('contentType');
          return HttpResponse.json(mockPresignResponse);
        })
      );

      await s3Service.getPresignedUrls({
        rootPath: 'admin/banner',
        uploadSize: 1,
      });

      expect(capturedContentType).toBeNull();
    });
  });

  describe('uploadImage', () => {
    let capturedContentType: string | null;
    let capturedUploadContentType: string | null;

    beforeEach(() => {
      capturedContentType = null;
      capturedUploadContentType = null;

      // presigned URL 발급 핸들러
      server.use(
        http.get(S3_ENDPOINT, ({ request }) => {
          const url = new URL(request.url);
          capturedContentType = url.searchParams.get('contentType');
          return HttpResponse.json(mockPresignResponse);
        })
      );

      // S3 업로드 핸들러 (fetch 사용)
      server.use(
        http.put('https://s3.amazonaws.com/*', ({ request }) => {
          capturedUploadContentType = request.headers.get('Content-Type');
          return new HttpResponse(null, { status: 200 });
        })
      );
    });

    it('이미지 파일 업로드 시 file.type이 contentType으로 전달된다', async () => {
      const file = new File(['test'], 'banner.webp', { type: 'image/webp' });

      await s3Service.uploadImage(file, 'admin/banner');

      expect(capturedContentType).toBe('image/webp');
    });

    it('동영상 파일 업로드 시 file.type이 contentType으로 전달된다', async () => {
      const file = new File(['test'], 'banner.mp4', { type: 'video/mp4' });

      await s3Service.uploadImage(file, 'admin/banner');

      expect(capturedContentType).toBe('video/mp4');
    });

    it('명시적 contentType이 file.type보다 우선한다', async () => {
      const file = new File(['test'], 'banner.mp4', { type: 'video/mp4' });

      await s3Service.uploadImage(file, 'admin/banner', 'video/webm');

      expect(capturedContentType).toBe('video/webm');
    });

    it('S3 PUT 요청에 올바른 Content-Type 헤더가 포함된다', async () => {
      const file = new File(['test'], 'banner.mp4', { type: 'video/mp4' });

      await s3Service.uploadImage(file, 'admin/banner');

      expect(capturedUploadContentType).toBe('video/mp4');
    });

    it('명시적 contentType이 presign과 S3 PUT 양쪽에 일치하게 전달된다', async () => {
      const file = new File(['test'], 'banner.mp4', { type: 'video/mp4' });

      await s3Service.uploadImage(file, 'admin/banner', 'video/webm');

      expect(capturedContentType).toBe('video/webm');
      expect(capturedUploadContentType).toBe('video/webm');
    });

    it('업로드 성공 시 viewUrl을 반환한다', async () => {
      const file = new File(['test'], 'banner.jpg', { type: 'image/jpeg' });

      const viewUrl = await s3Service.uploadImage(file, 'admin/banner');

      expect(viewUrl).toBe('https://cdn.example.com/admin/banner/test-uuid.jpg');
    });
  });

  describe('uploadToS3', () => {
    it('업로드 실패 시 에러를 던진다', async () => {
      server.use(
        http.put('https://s3.amazonaws.com/*', () => {
          return new HttpResponse(null, { status: 403, statusText: 'Forbidden' });
        })
      );

      const file = new File(['test'], 'banner.mp4', { type: 'video/mp4' });

      await expect(
        s3Service.uploadToS3('https://s3.amazonaws.com/test-bucket/test.mp4?presigned=true', file)
      ).rejects.toThrow('S3 업로드 실패');
    });
  });
});
