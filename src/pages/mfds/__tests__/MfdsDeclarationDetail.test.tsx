import { beforeEach, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router';
import { http, HttpResponse } from 'msw';
import { render } from '@/test/test-utils';
import { server } from '@/test/mocks/server';
import { wrapApiResponse } from '@/test/mocks/data';
import { MfdsDeclarationDetailPage } from '../MfdsDeclarationDetail';

const base = '/admin/api/v1/mfds/declarations';
const declaration = {
  id: 1,
  rcno: 'TEST1',
  baseProductNameKo: '기본 제품',
  baseProductNameEn: 'Base',
  skuDisplayNameKo: '신고 제품 16년',
  skuDisplayNameEn: 'SKU 16',
  alcoholNameKo: '정제 후보명',
  alcoholNameEn: 'Parsed',
  selectedAlcoholId: null,
  selectedDistilleryId: null,
  selectedRegionId: null,
  alcoholCandidates: [],
  distilleryCandidates: [],
  regionCandidates: [],
  importer: null,
  createdAt: '2026-09-23T10:00:00',
  updatedAt: '2026-09-23T10:00:00',
};
let matched = false;
let payload: unknown;
beforeEach(() => {
  matched = false;
  payload = undefined;
  server.use(
    http.get(`${base}/1`, () =>
      HttpResponse.json(
        wrapApiResponse({
          ...declaration,
          ...(matched
            ? { selectedAlcoholId: 2, selectedDistilleryId: 3, selectedRegionId: 4 }
            : {}),
        })
      )
    ),
    http.get(`${base}/1/matching/candidates`, () =>
      HttpResponse.json(
        wrapApiResponse({
          selection: {},
          alcoholCandidates: [
            {
              alcoholId: 2,
              korName: '선택할 위스키',
              engName: 'Selected',
              score: 1,
              imageUrl: null,
            },
          ],
          distilleryCandidates: [{ id: 3, score: 1, korName: '선택한 증류소' }],
          regionCandidates: [{ id: 4, score: 1, korName: '선택한 지역' }],
        })
      )
    ),
    http.get('/admin/api/v1/alcohols/2', () =>
      HttpResponse.json(
        wrapApiResponse({
          alcoholId: 2,
          korName: '선택할 위스키',
          engName: 'Selected',
          distilleryId: 3,
          korDistillery: '선택한 증류소',
          regionId: 4,
          korRegion: '선택한 지역',
        })
      )
    ),
    http.post(`${base}/1/matching/bulk-preview`, () =>
      HttpResponse.json(
        wrapApiResponse({
          alcoholNameKo: '선택할 위스키',
          alcoholNameEn: 'Selected',
          distilleryId: 3,
          regionId: 4,
          items: [],
        })
      )
    ),
    http.post(`${base}/1/matching/confirm`, async ({ request }) => {
      payload = await request.json();
      matched = true;
      return HttpResponse.json(wrapApiResponse({ alcoholId: 2, distilleryId: 3, regionId: 4 }));
    })
  );
});
function openPage() {
  render(
    <Routes>
      <Route path="/" element={<MfdsDeclarationDetailPage />} />
    </Routes>
  );
}
// Keep real routing and request hooks; only supply the route parameter at the boundary.
import { vi } from 'vitest';
vi.mock('react-router', async () => ({
  ...(await vi.importActual<typeof import('react-router')>('react-router')),
  useParams: () => ({ declarationId: '1' }),
}));

it('미매칭 SKU 이름을 표시하고 후보 확정 후 위스키·증류소·지역을 갱신한다', async () => {
  const user = userEvent.setup();
  openPage();
  expect(await screen.findByRole('heading', { name: '신고 제품 16년' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '매칭 관리' }));
  await user.click(await screen.findByRole('button', { name: '선택할 위스키 선택' }));
  expect(payload).toBeUndefined();
  await user.click(screen.getByRole('button', { name: '선택한 연결 확정' }));
  await waitFor(() => expect(payload).toEqual({ alcoholId: 2 }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(await screen.findByRole('heading', { name: '선택할 위스키' })).toBeInTheDocument();
  expect(screen.getByText('선택한 증류소')).toBeInTheDocument();
  expect(screen.getByText('선택한 지역')).toBeInTheDocument();
});

it('관련 내역은 기본명으로 조회하고 현재 신고를 제외하며 검색어를 변경할 수 있다', async () => {
  const keywords: (string | null)[] = [];
  server.use(
    http.get(base, ({ request }) => {
      keywords.push(new URL(request.url).searchParams.get('keyword'));
      return HttpResponse.json(
        wrapApiResponse(
          [declaration, { ...declaration, id: 9, rcno: 'OTHER9', skuDisplayNameKo: '다른 신고' }],
          { hasNext: false, nextCursor: null }
        )
      );
    })
  );
  const user = userEvent.setup();
  openPage();
  await user.click(await screen.findByRole('tab', { name: '관련 내역' }));
  const table = await screen.findByRole('table', { name: '관련 내역' });
  expect(await within(table).findByText('OTHER9')).toBeInTheDocument();
  expect(within(table).queryByText('TEST1')).not.toBeInTheDocument();
  expect(keywords[0]).toBe('기본 제품');
  await user.clear(screen.getByRole('textbox', { name: '관련 내역 검색' }));
  await user.type(screen.getByRole('textbox', { name: '관련 내역 검색' }), '다른 이름');
  await user.click(screen.getByRole('button', { name: '검색' }));
  await waitFor(() => expect(keywords).toContain('다른 이름'));
});

it('원장 탭을 열 때 신고 ID가 아닌 RCNO로 조회하고 원장 값을 표시한다', async () => {
  let calls = 0;
  server.use(
    http.get('/admin/api/v1/mfds/items/TEST1', () => {
      calls += 1;
      return HttpResponse.json(
        wrapApiResponse({
          id: 88,
          rcno: 'TEST1',
          queriedItemCode: 'Q1',
          queriedItemName: '조회 품목',
          productNameKo: '원장 제품명',
          productNameEn: 'Source name',
          processedDate: '2026-09-21',
          observedAt: '2026-09-23T01:00:00',
          detailHref: null,
        })
      );
    })
  );
  const user = userEvent.setup();
  openPage();
  await screen.findByRole('heading', { name: '신고 제품 16년' });
  expect(calls).toBe(0);
  await user.click(screen.getByRole('tab', { name: '원장 정보' }));
  expect(await screen.findByText('원장 제품명')).toBeInTheDocument();
  expect(screen.getByText('2026-09-21')).toBeInTheDocument();
  expect(screen.getByText('원장 수집 시각')).toBeInTheDocument();
  expect(calls).toBe(1);
});

it('등록 탭에서 모든 필드를 표시하고 탭을 오가도 작성한 이름을 유지한다', async () => {
  const user = userEvent.setup();
  openPage();
  await user.click(await screen.findByRole('tab', { name: '위스키 등록' }));
  const name = await screen.findByDisplayValue('신고 제품 16년');
  await user.clear(name);
  await user.type(name, '작성 중인 위스키');
  expect(screen.getByPlaceholderText('예: 700ml')).toBeVisible();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  await user.click(screen.getByRole('tab', { name: '정제 정보 · 매칭 관리' }));
  await user.click(screen.getByRole('tab', { name: '위스키 등록' }));
  expect(screen.getByDisplayValue('작성 중인 위스키')).toBeVisible();
});
