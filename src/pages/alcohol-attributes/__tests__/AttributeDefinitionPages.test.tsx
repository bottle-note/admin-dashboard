import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { render as rtlRender } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';

import { server } from '@/test/mocks/server';
import { ToastContext, useToastState } from '@/hooks/useToast';
import type { AlcoholAttribute } from '@/types/api/alcohol-attribute.api';

import { AttributeListPage } from '../AttributeList';
import { AttributeDetailPage } from '../AttributeDetail';

const base = '/admin/api/v1/alcohols/attributes';
const audit = {
  createAt: '2026-11-05T10:27:00',
  lastModifyAt: '2026-11-05T10:27:00',
  createPrincipal: null,
  lastModifyPrincipal: null,
};
const groups = [
  { id: 1, name: '바텐더 추천', description: null, displayOrder: 0 },
  { id: 2, name: '바텐더 노트', description: null, displayOrder: 1 },
];
const kind: AlcoholAttribute = {
  ...audit,
  id: 15,
  key: 'bn_kind',
  displayName: '추천 종류',
  type: 'KEYWORD',
  datatype: 'STRING',
  unit: null,
  description: '추천용 카테고리',
  groupId: 2,
  allowMultipleValues: false,
  allowedValues: ['싱글 몰트', '라이'],
  pattern: '[가-힣 ]{1,20}',
};
const gift: AlcoholAttribute = {
  ...audit,
  id: 1,
  key: 'bartender_recommendable',
  displayName: '바텐더 추천 대상',
  type: 'FLAG',
  datatype: 'BOOLEAN',
  unit: null,
  description: null,
  groupId: 1,
  allowMultipleValues: false,
  allowedValues: null,
  pattern: null,
};

const enums = {
  types: [
    {
      code: 'KEYWORD',
      korName: '키워드',
      engName: 'keyword',
      description: '추천 필터와 키워드 그래프에 쓰는 라벨',
    },
    {
      code: 'FLAG',
      korName: '예/아니오 속성',
      engName: 'flag',
      description: '향 첨가 여부처럼 참·거짓으로 나뉘는 속성',
    },
  ],
  datatypes: [],
  providers: [],
  operators: [],
};
const wrap = (data: unknown, total = Array.isArray(data) ? data.length : 1) => ({
  success: true,
  code: 200,
  data,
  errors: [],
  meta: { page: 0, size: 20, totalElements: total, totalPages: 1, hasNext: false },
});

let listRequests: URLSearchParams[] = [];
let createBody: Record<string, unknown> | null = null;
let updateBody: Record<string, unknown> | null = null;
let deleteBody: Record<string, unknown> | null = null;

beforeEach(() => {
  Element.prototype.hasPointerCapture = () => false;
  listRequests = [];
  createBody = null;
  updateBody = null;
  deleteBody = null;
  server.use(
    http.get('/admin/api/v1/alcohols/attribute-groups', () => HttpResponse.json(wrap(groups))),
    http.get(base, ({ request }) => {
      const params = new URL(request.url).searchParams;
      listRequests.push(params);
      const groupIds = params.getAll('groupIds').map(Number);
      const items = [kind, gift].filter(
        (item) => !groupIds.length || groupIds.includes(item.groupId ?? -1)
      );
      return HttpResponse.json(wrap(items));
    }),
    http.get(`${base}/enums`, () => HttpResponse.json(wrap(enums))),
    http.get(`${base}/alcohols`, () => HttpResponse.json(wrap([], 411))),
    http.post(base, async ({ request }) => {
      createBody = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json(wrap({ ...kind, ...createBody, id: 99 }));
    }),
    http.put(`${base}/:id`, async ({ request }) => {
      updateBody = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json(wrap({ code: 'OK', message: '', targetId: 15, responseAt: '' }));
    }),
    http.post(`${base}/batch/delete`, async ({ request }) => {
      deleteBody = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json(wrap([kind]));
    })
  );
});

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function Providers({ children }: { children: ReactNode }) {
  const toast = useToastState();
  return <ToastContext.Provider value={toast}>{children}</ToastContext.Provider>;
}

function renderAt(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  rtlRender(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Providers>
          <Routes>
            <Route path="/attributes" element={<AttributeListPage />} />
            <Route path="/attributes/new" element={<AttributeDetailPage />} />
            <Route path="/attributes/:id" element={<AttributeDetailPage />} />
          </Routes>
          <LocationProbe />
        </Providers>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return userEvent.setup();
}

const location = () => screen.getByTestId('location').textContent;

describe('속성 목록', () => {
  it('그룹을 고르면 URL과 조회 요청에 반영되고, 행을 누르면 상세로 이동한다', async () => {
    const user = renderAt('/attributes');
    expect(await screen.findByRole('cell', { name: '바텐더 추천 대상' })).toBeInTheDocument();
    expect(await screen.findByRole('cell', { name: '예/아니오 속성' })).toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: '그룹' }));
    await user.click(await screen.findByRole('option', { name: '바텐더 노트' }));

    await waitFor(() => expect(location()).toBe('/attributes?groupId=2'));
    await waitFor(() =>
      expect(screen.queryByRole('cell', { name: '바텐더 추천 대상' })).not.toBeInTheDocument()
    );
    expect(listRequests[listRequests.length - 1]?.getAll('groupIds')).toEqual(['2']);

    const row = screen.getByRole('cell', { name: '추천 종류' }).closest('tr')!;
    expect(within(row).getByText('bn_kind')).toBeInTheDocument();
    await user.click(row);
    expect(location()).toBe('/attributes/15');
  });
});

describe('속성 등록', () => {
  it('URL의 그룹이 미리 선택되고, 입력한 값 목록과 함께 생성 요청을 보낸다', async () => {
    const user = renderAt('/attributes/new?groupId=2');
    const group = await screen.findByRole('combobox', { name: '그룹' });
    await waitFor(() => expect(group).toHaveTextContent('바텐더 노트'));

    await user.type(screen.getByLabelText(/^이름/), '세기');
    await user.type(screen.getByLabelText(/^키/), 'bn_strength');
    await user.type(screen.getByRole('textbox', { name: '값 추가' }), '저도수{Enter}');
    await user.type(screen.getByRole('textbox', { name: '값 추가' }), '고도수{Enter}');
    await user.click(screen.getByRole('button', { name: '등록' }));

    await waitFor(() => expect(createBody).not.toBeNull());
    expect(createBody).toMatchObject({
      key: 'bn_strength',
      displayName: '세기',
      groupId: 2,
      type: 'KEYWORD',
      datatype: 'STRING',
      allowedValues: ['저도수', '고도수'],
      allowMultipleValues: false,
      pattern: null,
    });
    await waitFor(() => expect(location()).toBe('/attributes/99'));
  });

  it('값 목록을 비워 두면 allowedValues를 null로 보낸다', async () => {
    const user = renderAt('/attributes/new');
    await screen.findByRole('combobox', { name: '그룹' });

    await user.type(screen.getByLabelText(/^이름/), '브랜드');
    await user.type(screen.getByLabelText(/^키/), 'bn_brand');
    await user.click(screen.getByRole('button', { name: '등록' }));

    await waitFor(() => expect(createBody).not.toBeNull());
    expect(createBody).toMatchObject({ groupId: null, allowedValues: null });
  });
});

describe('속성 상세', () => {
  it('그룹만 바꿔 저장해도 기존 값 목록과 입력 규칙을 함께 보낸다', async () => {
    const user = renderAt('/attributes/15');
    expect(await screen.findByRole('heading', { name: '추천 종류' })).toBeInTheDocument();
    expect(await screen.findByText('411')).toBeInTheDocument();
    expect(screen.getByText('추천 필터와 키워드 그래프에 쓰는 라벨')).toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: '그룹' }));
    await user.click(await screen.findByRole('option', { name: '바텐더 추천' }));
    await user.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => expect(updateBody).not.toBeNull());
    expect(updateBody).toEqual({
      displayName: '추천 종류',
      groupId: 1,
      type: 'KEYWORD',
      datatype: 'STRING',
      unit: null,
      description: '추천용 카테고리',
      allowMultipleValues: false,
      allowedValues: ['싱글 몰트', '라이'],
      pattern: '[가-힣 ]{1,20}',
    });
  });

  it('삭제를 확인하면 삭제 요청을 보내고 목록으로 이동한다', async () => {
    const user = renderAt('/attributes/15');
    await screen.findByRole('heading', { name: '추천 종류' });

    await user.click(screen.getByRole('button', { name: '삭제' }));
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: '삭제' }));

    await waitFor(() => expect(deleteBody).toEqual({ ids: [15] }));
    await waitFor(() => expect(location()).toBe('/attributes'));
  });
});
