import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { mockAlcoholLookupItems, wrapApiResponse } from '@/test/mocks/data';
import { render } from '@/test/test-utils';

import { DistilleryDetailPage } from '../DistilleryDetail';

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');

  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: '1' }),
  };
});

describe('DistilleryDetailPage', () => {
  it('증류소 ID로 lookup API를 조회해 소속 위스키 목록을 표시한다', async () => {
    let lookupDistilleryId: string | null = null;
    let lookupCursor: string | null = null;

    server.use(
      http.get('/admin/api/v1/alcohols/lookup', ({ request }) => {
        const url = new URL(request.url);
        lookupDistilleryId = url.searchParams.get('distilleryId');
        lookupCursor = url.searchParams.get('cursor');
        const items = mockAlcoholLookupItems.filter((item) => item.distilleryId === 1);

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

    render(<DistilleryDetailPage />);

    expect(await screen.findByRole('heading', { name: '증류소 상세' })).toBeInTheDocument();
    expect(await screen.findByText('소속 위스키')).toBeInTheDocument();
    expect(await screen.findByText('글렌피딕 12년')).toBeInTheDocument();
    expect(screen.queryByText('맥캘란 18년')).not.toBeInTheDocument();
    expect(lookupDistilleryId).toBe('1');
    expect(lookupCursor).toBe('0');
  });
});
