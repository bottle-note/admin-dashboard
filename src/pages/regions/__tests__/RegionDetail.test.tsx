import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { mockAlcoholLookupItems, wrapApiResponse } from '@/test/mocks/data';
import { render } from '@/test/test-utils';
import type { RegionFormData } from '@/types/api';

import { RegionDetailPage } from '../RegionDetail';

vi.mock('@/components/common/ImageCropDialog', () => ({
  ImageCropDialog: ({
    open,
    onPrepared,
  }: {
    open: boolean;
    onPrepared: (preparedImage: {
      file: File;
      metadata: {
        original: { width: number; height: number; byteSize: number; mimeType: string };
        output: {
          width: number;
          height: number;
          byteSize: number;
          mimeType: 'image/webp';
          quality: number;
        };
      };
    }) => void;
  }) =>
    open ? (
      <button
        type="button"
        onClick={() =>
          onPrepared({
            file: new File(['prepared-image'], 'region.webp', { type: 'image/webp' }),
            metadata: {
              original: { width: 1200, height: 800, byteSize: 1_000_000, mimeType: 'image/jpeg' },
              output: {
                width: 1200,
                height: 800,
                byteSize: 250_000,
                mimeType: 'image/webp',
                quality: 70,
              },
            },
          })
        }
      >
        크롭 적용
      </button>
    ) : null,
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');

  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: '1' }),
  };
});

describe('RegionDetailPage', () => {
  it('지역 ID로 lookup API를 조회해 소속 위스키 목록을 표시한다', async () => {
    let lookupRegionId: string | null = null;
    let lookupCursor: string | null = null;

    server.use(
      http.get('/admin/api/v1/alcohols/lookup', ({ request }) => {
        const url = new URL(request.url);
        lookupRegionId = url.searchParams.get('regionId');
        lookupCursor = url.searchParams.get('cursor');
        const items = mockAlcoholLookupItems.filter((item) => item.regionId === 1);

        return HttpResponse.json(
          wrapApiResponse(items, {
            pageable: {
              currentCursor: 0,
              cursor: items.length,
              pageSize: 20,
              hasNext: false,
            },
          })
        );
      })
    );

    render(<RegionDetailPage />);

    expect(await screen.findByRole('heading', { name: '지역 상세' })).toBeInTheDocument();
    expect(await screen.findByText('소속 위스키')).toBeInTheDocument();
    expect(await screen.findByText('글렌피딕 12년')).toBeInTheDocument();
    expect(screen.getByText('맥캘란 18년')).toBeInTheDocument();
    expect(lookupRegionId).toBe('1');
    expect(lookupCursor).toBe('0');
  });

  it('이미지가 있는 지역의 텍스트만 수정해도 기존 imageUrl을 보존해 저장한다', async () => {
    const user = userEvent.setup();
    let capturedBody: RegionFormData | null = null;

    server.use(
      http.put('/admin/api/v1/regions/1', async ({ request }) => {
        capturedBody = (await request.json()) as RegionFormData;
        return HttpResponse.json(
          wrapApiResponse({
            code: 'REGION_UPDATED',
            message: '지역이 수정되었습니다.',
            targetId: 1,
            responseAt: '2024-06-01T00:00:00',
          })
        );
      })
    );

    render(<RegionDetailPage />);

    const korNameInput = await screen.findByDisplayValue('스코틀랜드');
    await user.clear(korNameInput);
    await user.type(korNameInput, '스코틀랜드 수정');
    await user.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => expect(capturedBody).not.toBeNull());
    expect(capturedBody).toMatchObject({
      korName: '스코틀랜드 수정',
      imageUrl: 'https://example.com/regions/scotland.webp',
    });
  });

  it('전처리 이미지는 저장을 눌렀을 때만 WebP로 업로드하고 Region 수정 요청에 URL을 넣는다', async () => {
    const user = userEvent.setup();
    let presignRootPath: string | null = null;
    let presignContentType: string | null = null;
    let uploadContentType: string | null = null;
    let capturedBody: RegionFormData | null = null;

    server.use(
      http.get('/admin/api/v1/s3/presign-url', ({ request }) => {
        const url = new URL(request.url);
        presignRootPath = url.searchParams.get('rootPath');
        presignContentType = url.searchParams.get('contentType');
        return HttpResponse.json({
          success: true,
          code: 200,
          data: {
            bucketName: 'test-bucket',
            expiryTime: 15,
            uploadSize: 1,
            imageUploadInfo: [
              {
                order: 0,
                viewUrl: 'https://cdn.example.com/regions/scotland-new.webp',
                uploadUrl: 'https://s3.amazonaws.com/test-bucket/admin/region/scotland-new.webp',
              },
            ],
          },
          errors: [],
          meta: {},
        });
      }),
      http.put('https://s3.amazonaws.com/*', ({ request }) => {
        uploadContentType = request.headers.get('Content-Type');
        return new HttpResponse(null, { status: 200 });
      }),
      http.put('/admin/api/v1/regions/1', async ({ request }) => {
        capturedBody = (await request.json()) as RegionFormData;
        return HttpResponse.json(
          wrapApiResponse({
            code: 'REGION_UPDATED',
            message: '지역이 수정되었습니다.',
            targetId: 1,
            responseAt: '2024-06-01T00:00:00',
          })
        );
      })
    );

    render(<RegionDetailPage />);

    await screen.findByDisplayValue('스코틀랜드');
    await user.upload(
      screen.getByLabelText('이미지 파일 선택'),
      new File(['source-image'], 'scotland.jpg', { type: 'image/jpeg' })
    );
    await user.click(screen.getByRole('button', { name: '크롭 적용' }));

    await screen.findByText('새 이미지 (저장 전)');
    expect(presignRootPath).toBeNull();

    await user.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => expect(capturedBody).not.toBeNull());
    expect(presignRootPath).toBe('admin/region');
    expect(presignContentType).toBe('image/webp');
    expect(uploadContentType).toBe('image/webp');
    expect(capturedBody).toMatchObject({
      imageUrl: 'https://cdn.example.com/regions/scotland-new.webp',
    });
  });
});
