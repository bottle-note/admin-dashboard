import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import { menuConfig } from '@/config/menu.config';
import { CampaignContentListPage } from '../CampaignContentList';

const navigate = vi.fn();
const setSearchParams = vi.fn();
const statusMutate = vi.fn();
let url = new URLSearchParams('keyword=old&page=2&isActive=true');
const list = vi.fn((_params: unknown) => ({
  data: {
    items: [
      {
        id: 7,
        code: 'whiskey-mbti',
        name: '위스키 MBTI',
        description: '성격 테스트',
        recentParticipants: 12,
        isActive: true,
        createdAt: '2026-09-15T12:00:00',
      },
    ],
    meta: { page: 2, size: 20, totalElements: 45, totalPages: 3, hasNext: false },
  },
  isLoading: false,
  isError: false,
}));
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useNavigate: () => navigate, useSearchParams: () => [url, setSearchParams] };
});
vi.mock('@/hooks/useCampaignContents', () => ({
  useCampaignContentList: (params: unknown) => list(params),
  useCampaignContentStatus: () => ({ mutate: statusMutate, isPending: false }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  url = new URLSearchParams('keyword=old&page=2&isActive=true');
});

describe('캠페인 콘텐츠 목록', () => {
  it('ROOT_ADMIN 메뉴에서 목록과 추가 경로를 제공한다', () => {
    const menu = menuConfig
      .flatMap((group) => group.items)
      .find((item) => item.label === '캠페인 콘텐츠 관리');
    expect(menu?.roles).toEqual(['ROOT_ADMIN']);
    expect(menu?.children?.map((child) => child.path)).toEqual([
      '/campaign-contents',
      '/campaign-contents/new',
    ]);
  });

  it('URL 필터와 0 기반 페이지를 API에 전달하고 새 검색 때 첫 페이지로 돌아간다', async () => {
    render(<CampaignContentListPage />);
    expect(list).toHaveBeenCalledWith({ keyword: 'old', isActive: true, page: 2, size: 20 });
    await userEvent.clear(screen.getByPlaceholderText('이름 또는 코드 검색'));
    await userEvent.type(screen.getByPlaceholderText('이름 또는 코드 검색'), 'tarot');
    await userEvent.click(screen.getByRole('button', { name: /^검색$/ }));
    expect((setSearchParams.mock.lastCall?.[0] as URLSearchParams).get('keyword')).toBe('tarot');
    expect((setSearchParams.mock.lastCall?.[0] as URLSearchParams).get('page')).toBeNull();
    expect((setSearchParams.mock.lastCall?.[0] as URLSearchParams).get('isActive')).toBe('true');
  });

  it('행은 상세로 이동하고 토글은 이동 없이 PATCH만 요청한다', async () => {
    render(<CampaignContentListPage />);
    expect(screen.getByText('12')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('switch'));
    expect(statusMutate).toHaveBeenCalledWith({ id: 7, data: { isActive: false } });
    expect(navigate).not.toHaveBeenCalled();
    await userEvent.click(screen.getByText('위스키 MBTI'));
    expect(navigate).toHaveBeenCalledWith('/campaign-contents/7', expect.anything());
  });
});
