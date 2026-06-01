import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { wrapApiResponse } from '@/test/mocks/data';
import { render } from '@/test/test-utils';

import { CurationListPage } from '../CurationList';

const CURATION_BASE = '/admin/api/v2/curations';

describe('CurationListPage', () => {
  it('spec 기반 큐레이션 목록을 표시한다', async () => {
    server.use(
      http.get(CURATION_BASE, ({ request }) => {
        const url = new URL(request.url);

        expect(url.searchParams.get('page')).toBe('0');
        expect(url.searchParams.get('size')).toBe('20');

        return HttpResponse.json(
          wrapApiResponse(
            [
              {
                id: 10,
                specId: 3,
                specCode: 'WHISKY_TASTING_EVENT',
                name: '6월 싱글몰트 시음회',
                displayOrder: 1,
                isActive: true,
                createdAt: '2026-05-15T00:00:00',
              },
            ],
            {
              page: 0,
              size: 20,
              totalElements: 1,
              totalPages: 1,
              hasNext: false,
            }
          )
        );
      })
    );

    render(<CurationListPage />);

    expect(screen.getByRole('heading', { name: '큐레이션 관리' })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('6월 싱글몰트 시음회')).toBeInTheDocument();
    });
    expect(screen.getByText('위스키 시음회')).toBeInTheDocument();
    expect(screen.getByText('활성')).toBeInTheDocument();
  });
});
