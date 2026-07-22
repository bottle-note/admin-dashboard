import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { mockAlcoholLookupItems, wrapApiResponse } from '@/test/mocks/data';
import { render } from '@/test/test-utils';
import type { RegionFormData } from '@/types/api';

import { RegionDetailPage } from '../RegionDetail';

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
});
