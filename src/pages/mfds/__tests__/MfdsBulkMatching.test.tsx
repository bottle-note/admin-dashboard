import { beforeEach, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router';
import { http, HttpResponse } from 'msw';
import { render } from '@/test/test-utils';
import { server } from '@/test/mocks/server';
import { wrapApiResponse } from '@/test/mocks/data';
import { MfdsDeclarationDetailPage } from '../MfdsDeclarationDetail';

vi.mock('react-router', async () => ({
  ...(await vi.importActual<typeof import('react-router')>('react-router')),
  useParams: () => ({ declarationId: '1' }),
}));

const base = '/admin/api/v1/mfds/declarations';
// 화면은 위스키 ID만 비교하므로 현재 연결은 위스키 ID로만 만든다.
function previewItem(declarationId: number, currentAlcoholId: number | null = null) {
  return {
    declarationId,
    rcno: `RC${declarationId}`,
    displayName: `신고 제품 ${declarationId}`,
    volumeMl: 700,
    importerBaseName: '테스트 수입사',
    processedDate: '2026-09-01',
    classification: 'APPLICABLE',
    reasons: [],
    currentAlcoholId,
    currentDistilleryId: null,
    currentRegionId: null,
  };
}

let singlePayload: unknown;
let bulkPayload: unknown;
beforeEach(() => {
  singlePayload = undefined;
  bulkPayload = undefined;
  server.use(
    http.get(`${base}/1`, () =>
      HttpResponse.json(
        wrapApiResponse({
          id: 1,
          rcno: 'RC1',
          skuDisplayNameKo: '신고 제품 1',
          selectedAlcoholId: null,
          selectedDistilleryId: null,
          selectedRegionId: null,
          importer: null,
          createdAt: '2026-09-23T10:00:00',
          updatedAt: '2026-09-23T10:00:00',
        })
      )
    ),
    http.get(`${base}/1/matching/candidates`, () =>
      HttpResponse.json(
        wrapApiResponse({
          selection: {},
          alcoholCandidates: [
            { alcoholId: 5, korName: '두 번째 위스키', score: 0.5, imageUrl: null },
            { alcoholId: 2, korName: '첫 번째 위스키', score: 0.9, imageUrl: null },
          ],
          distilleryCandidates: [],
          regionCandidates: [],
        })
      )
    ),
    http.post(`${base}/1/matching/bulk-preview`, () =>
      HttpResponse.json(
        wrapApiResponse({
          alcoholNameKo: '첫 번째 위스키',
          alcoholNameEn: 'First',
          distilleryId: 3,
          regionId: 4,
          items: [previewItem(1), previewItem(7), previewItem(8, 9), previewItem(10, 2)],
        })
      )
    ),
    http.post(`${base}/1/matching/confirm`, async ({ request }) => {
      singlePayload = await request.json();
      return HttpResponse.json(wrapApiResponse({ declarationId: 1, selectedAlcoholId: 2 }));
    }),
    http.post(`${base}/1/matching/bulk-confirm`, async ({ request }) => {
      bulkPayload = await request.json();
      return HttpResponse.json(wrapApiResponse({ applied: [], unchangedDeclarationIds: [] }));
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

const recommendation = (name: string) =>
  screen.findByRole('button', { name: `${name} 선택해 매칭 관리 열기` });
const checkbox = (container: HTMLElement, id: number) =>
  within(container).findByRole('checkbox', {
    name: new RegExp(`^신고 제품 ${id} \\(신고 ${id}\\) 선택$`),
  });

function mockCandidates(afterRun: { alcoholId: number; korName: string }[]) {
  const calls = { run: 0 };
  server.use(
    http.get(`${base}/1/matching/candidates`, () =>
      HttpResponse.json(
        wrapApiResponse({
          selection: {},
          alcoholCandidates:
            calls.run > 0 ? afterRun.map((item) => ({ ...item, score: 0.9, imageUrl: null })) : [],
          distilleryCandidates: [],
          regionCandidates: [],
        })
      )
    ),
    http.post(`${base}/1/matching/run`, () => {
      calls.run += 1;
      return HttpResponse.json(wrapApiResponse({ declarationId: 1 }));
    })
  );
  return calls;
}

it.each([
  {
    source: '추천 후보',
    label: '추천 · ID 2',
    expected: 2,
    pick: async (user: ReturnType<typeof userEvent.setup>) => {
      await user.click(await recommendation('첫 번째 위스키'));
      return screen.findByRole('dialog', { name: '보틀노트 위스키 연결' });
    },
  },
  {
    source: '직접 검색',
    label: '직접 검색 · ID 33',
    expected: 33,
    pick: async (user: ReturnType<typeof userEvent.setup>) => {
      server.use(
        http.get('/admin/api/v1/alcohols/lookup', () =>
          HttpResponse.json(
            wrapApiResponse(
              [{ alcoholId: 33, korName: '검색한 위스키', engName: 'Searched', imageUrl: null }],
              { page: 0, size: 20, totalElements: 1, totalPages: 1, hasNext: false }
            )
          )
        )
      );
      await user.click(await screen.findByRole('button', { name: '매칭 관리' }));
      const dialog = await screen.findByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: '위스키 직접 찾기' }));
      await user.click(await within(dialog).findByRole('button', { name: /검색한 위스키/ }));
      return dialog;
    },
  },
])(
  '$source에서 고른 위스키를 사이드바에 출처와 함께 보이고 이 신고에 확정한다',
  async ({ label, expected, pick }) => {
    const user = userEvent.setup();
    openPage();
    const dialog = await pick(user);

    const picked = within(dialog).getByRole('region', { name: '선택한 위스키' });
    expect(within(picked).getByText(label)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: '선택한 연결 확정' }));

    await waitFor(() => expect(singlePayload).toEqual({ alcoholId: expected }));
    expect(bulkPayload).toBeUndefined();
  }
);

it('같은 제품 전체 연결은 새로 연결만 기본 선택하고, 덮어쓰기를 고르면 덮어쓰기 버튼으로 확정한다', async () => {
  const user = userEvent.setup();
  openPage();
  expect(await screen.findByText(/같은 제품 신고 4건/)).toBeInTheDocument();
  await user.click(await recommendation('첫 번째 위스키'));
  await user.click(await screen.findByRole('button', { name: '같은 제품 전체 연결' }));

  const dialog = await screen.findByRole('dialog', { name: '같은 제품 일괄 적용' });
  expect(await checkbox(dialog, 1)).toBeChecked();
  expect(await checkbox(dialog, 7)).toBeChecked();
  expect(await checkbox(dialog, 8)).not.toBeChecked();
  expect(await checkbox(dialog, 10)).toBeDisabled();
  expect(within(dialog).getByRole('button', { name: '선택한 2건 적용' })).toBeEnabled();

  await user.click(await checkbox(dialog, 8));
  expect(within(dialog).getByText(/덮어쓰기 1건/)).toBeInTheDocument();
  await user.click(within(dialog).getByRole('button', { name: '덮어쓰고 3건 적용' }));

  await waitFor(() => expect(bulkPayload).toEqual({ alcoholId: 2, declarationIds: [1, 7, 8] }));
});

it('일괄 적용에서 돌아와도 선택한 위스키가 사이드바와 위스키 연결 화면에 유지된다', async () => {
  const user = userEvent.setup();
  openPage();
  await user.click(await screen.findByRole('button', { name: '매칭 관리' }));
  const dialog = await screen.findByRole('dialog');
  await user.click(await within(dialog).findByRole('button', { name: '두 번째 위스키 선택' }));
  await user.click(within(dialog).getByRole('button', { name: '같은 제품 일괄 적용' }));

  const picked = within(dialog).getByRole('region', { name: '선택한 위스키' });
  expect(within(picked).getByText('후보 · ID 5')).toBeInTheDocument();
  await user.click(within(dialog).getByRole('button', { name: '위스키 연결로 돌아가기' }));
  await user.click(await within(dialog).findByRole('button', { name: '선택한 연결 확정' }));
  await waitFor(() => expect(singlePayload).toEqual({ alcoholId: 5 }));
});

it.each([
  {
    result: '후보가 생기면 추천 목록을 갱신한다',
    afterRun: [{ alcoholId: 2, korName: '계산된 위스키' }],
    shown: () => screen.findByRole('button', { name: '계산된 위스키 선택해 매칭 관리 열기' }),
  },
  {
    result: '여전히 0건이면 계산 중 문구에 머물지 않고 없음 안내를 보인다',
    afterRun: [],
    shown: () => screen.findByText(/추천할 후보가 없습니다/),
  },
])(
  '저장된 후보가 0건인 미매칭 신고는 진입할 때 한 번만 후보를 계산하고, $result',
  async ({ afterRun, shown }) => {
    const calls = mockCandidates(afterRun);
    openPage();

    expect(await shown()).toBeInTheDocument();
    expect(calls.run).toBe(1);
  }
);
