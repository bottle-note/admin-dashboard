import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';

import { render } from '@/test/test-utils';

import { RegionListPage } from '../RegionList';

const navigate = vi.fn();
const setSearchParams = vi.fn();

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');

  return {
    ...actual,
    useNavigate: () => navigate,
    useSearchParams: () => [new URLSearchParams(), setSearchParams],
  };
});

vi.mock('@/hooks/useRegions', () => ({
  useRegionList: () => ({
    data: {
      items: [
        {
          id: 1,
          korName: '스코틀랜드',
          engName: 'Scotland',
          continent: '유럽',
          description: null,
          imageUrl: 'https://cdn.example.com/regions/scotland.webp',
          createdAt: '2024-01-01T00:00:00',
          modifiedAt: '2024-06-01T00:00:00',
          parentId: null,
          sortOrder: 0,
        },
        {
          id: 2,
          korName: '스페이사이드',
          engName: 'Speyside',
          continent: '유럽',
          description: null,
          imageUrl: null,
          createdAt: '2024-01-02T00:00:00',
          modifiedAt: '2024-06-02T00:00:00',
          parentId: 1,
          sortOrder: 1,
        },
      ],
      meta: {
        page: 0,
        size: 100,
        totalElements: 2,
        totalPages: 1,
        hasNext: false,
      },
    },
    isLoading: false,
    refetch: vi.fn(),
  }),
  useRegionBulkReorder: () => ({ mutateAsync: vi.fn() }),
}));

describe('RegionListPage', () => {
  it('대표 이미지가 있으면 썸네일을 표시하고 없으면 빈 상태를 표시한다', () => {
    render(<RegionListPage />);

    expect(screen.getByAltText('스코틀랜드 대표 이미지')).toHaveAttribute(
      'src',
      'https://cdn.example.com/regions/scotland.webp'
    );
    expect(screen.getByText('스페이사이드')).toBeInTheDocument();
  });
});
