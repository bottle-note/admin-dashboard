import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router';
import { beforeAll, describe, expect, it } from 'vitest';

import { ToastContext, useToastState } from '@/hooks/useToast';
import { mockAlcoholListItems, wrapApiResponse } from '@/test/mocks/data';
import { server } from '@/test/mocks/server';
import { WhiskyListPage } from '../WhiskyList';

function Location() {
  const location = useLocation();
  return <output data-testid="location">{location.search}</output>;
}

function renderList(initialEntry = '/whisky') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      {
        path: '/whisky',
        element: (
          <>
            <WhiskyListPage />
            <Location />
          </>
        ),
      },
    ],
    { initialEntries: [initialEntry] }
  );
  function Providers() {
    const toast = useToastState();
    return (
      <QueryClientProvider client={queryClient}>
        <ToastContext.Provider value={toast}>
          <RouterProvider router={router} />
        </ToastContext.Provider>
      </QueryClientProvider>
    );
  }
  render(<Providers />);
  return router;
}

function listRequests() {
  const requests: URL[] = [];
  server.use(
    http.get('/admin/api/v1/alcohols', ({ request }) => {
      const url = new URL(request.url);
      requests.push(url);
      const page = Number(url.searchParams.get('page') ?? 0);
      return HttpResponse.json(
        wrapApiResponse([mockAlcoholListItems[0]], {
          page,
          size: 20,
          totalElements: 80,
          totalPages: 4,
          hasNext: page < 3,
        })
      );
    })
  );
  return requests;
}

const latest = (requests: URL[]) => requests[requests.length - 1]!.searchParams;

beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
});

describe('위스키 목록 지역·정렬', () => {
  it('기본 조회는 새 조건 없이 수행하고 기존 검색·카테고리·삭제 필터를 유지한다', async () => {
    const requests = listRequests();
    renderList('/whisky?keyword=글렌&category=SINGLE_MALT&includeDeleted=true');
    await waitFor(() => expect(requests).toHaveLength(1));
    expect(Object.fromEntries(latest(requests))).toMatchObject({
      keyword: '글렌',
      category: 'SINGLE_MALT',
      includeDeleted: 'true',
      page: '0',
    });
    expect(latest(requests).has('regionId')).toBe(false);
    expect(latest(requests).has('sortType')).toBe(false);
    expect(latest(requests).has('sortOrder')).toBe(false);
  });

  it('API 지역을 선택하면 ID 그대로 조회하고 정렬·페이지 이동·뒤로가기에서 URL과 요청을 유지한다', async () => {
    const user = userEvent.setup();
    const requests = listRequests();
    const router = renderList(
      '/whisky?keyword=글렌&category=SINGLE_MALT&includeDeleted=true&page=2'
    );
    await waitFor(() => expect(requests).toHaveLength(1));

    await user.click(screen.getByRole('combobox', { name: '지역 검색' }));
    await user.type(screen.getByRole('combobox', { name: '지역 검색' }), '스코틀랜드');
    await user.click(await screen.findByRole('button', { name: '스코틀랜드 지역 선택' }));
    await waitFor(() => expect(latest(requests).get('regionId')).toBe('1'));
    expect(latest(requests).get('page')).toBe('0');
    expect(screen.getByTestId('location')).toHaveTextContent('regionId=1');
    expect(screen.getByTestId('location')).not.toHaveTextContent('page=2');

    await user.click(screen.getByRole('combobox', { name: '정렬 기준' }));
    await user.click(await screen.findByRole('option', { name: '생성일' }));
    await user.click(screen.getByRole('combobox', { name: '정렬 방향' }));
    await user.click(await screen.findByRole('option', { name: '내림차순' }));
    await waitFor(() => expect(latest(requests).get('sortOrder')).toBe('DESC'));
    expect(latest(requests).get('sortType')).toBe('CREATED_AT');
    expect(latest(requests).get('regionId')).toBe('1');
    expect(latest(requests).get('keyword')).toBe('글렌');
    expect(latest(requests).get('category')).toBe('SINGLE_MALT');
    expect(latest(requests).get('includeDeleted')).toBe('true');

    await user.click(screen.getByRole('button', { name: '다음' }));
    await waitFor(() => expect(latest(requests).get('page')).toBe('1'));
    expect(latest(requests).get('regionId')).toBe('1');
    expect(latest(requests).get('sortType')).toBe('CREATED_AT');

    await act(async () => {
      await router.navigate(-1);
    });
    expect(screen.getByTestId('location')).not.toHaveTextContent('page=1');
    expect(screen.getByRole('combobox', { name: '정렬 기준' })).toHaveTextContent('생성일');
    expect(screen.getByRole('combobox', { name: '정렬 방향' })).toHaveTextContent('내림차순');
    expect(screen.getByTestId('location')).toHaveTextContent('regionId=1');
  });

  it('새로고침에 해당하는 URL 재진입 시 지역명·정렬 선택을 복원하고 기본 정렬로 되돌릴 수 있다', async () => {
    const user = userEvent.setup();
    const requests = listRequests();
    renderList('/whisky?regionId=1&sortType=UPDATED_AT&sortOrder=DESC&page=1');
    await waitFor(() => expect(latest(requests).get('sortType')).toBe('UPDATED_AT'));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '지역 필터 해제' })).toHaveTextContent('스코틀랜드')
    );
    expect(screen.getByRole('combobox', { name: '정렬 기준' })).toHaveTextContent('수정일');
    await user.click(screen.getByRole('combobox', { name: '정렬 기준' }));
    await user.click(await screen.findByRole('option', { name: '기본 정렬' }));
    await waitFor(() => expect(latest(requests).get('page')).toBe('0'));
    expect(latest(requests).has('sortType')).toBe(false);
    expect(latest(requests).has('sortOrder')).toBe(false);
    expect(latest(requests).get('regionId')).toBe('1');
  });
});
