import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation, useNavigate } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { mockAlcoholLookupItems, wrapApiError, wrapApiResponse } from '@/test/mocks/data';
import { render } from '@/test/test-utils';
import { adminAlcoholMergeService } from '@/services/admin-alcohol-merge.service';
import type {
  AlcoholMergeLog,
  AlcoholMergePreview,
  AlcoholMergeRequest,
  AlcoholMergeResult,
} from '@/types/api';
import { WhiskyMergePage } from '../WhiskyMerge';

const BASE = '/admin/api/v1/alcohols/merges';
const whisky = (id: number, name: string) => ({
  ...mockAlcoholLookupItems[0]!,
  alcoholId: id,
  korName: name,
  engName: `Whisky ${id}`,
  imageUrl: null,
});
const base = whisky(10, '기준 위스키');
const duplicates = Array.from({ length: 11 }, (_, i) => whisky(20 + i, `중복 위스키 ${i + 1}`));
const preview: AlcoholMergePreview = {
  base,
  duplicates: [{ alcohol: duplicates[0]!, counts: [{ name: 'reviews', moved: 12, deleted: 1 }] }],
};
const log: AlcoholMergeLog = {
  mergeId: 1,
  mergeGroupId: 'group-1',
  baseAlcoholId: 10,
  baseKorName: base.korName,
  duplicateAlcoholId: 20,
  duplicateKorName: duplicates[0]!.korName,
  duplicateEngName: 'Whisky 20',
  counts: [{ name: 'reviews', moved: 12, deleted: 1 }],
  mergedByAdminId: null,
  mergedByEmail: null,
  mergedAt: '2026-11-11T12:00:00',
};

let previewRequests: AlcoholMergeRequest[];
let mergeRequests: AlcoholMergeRequest[];
let logQueries: URLSearchParams[];
let saved: boolean;

function LocationProbe() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="location">{location.search}</output>
      <button onClick={() => navigate(-1)}>검증용 뒤로</button>
      <button onClick={() => navigate(1)}>검증용 앞으로</button>
    </>
  );
}

function mount() {
  render(
    <>
      <LocationProbe />
      <WhiskyMergePage />
    </>
  );
}

beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
});

async function choose(user: ReturnType<typeof userEvent.setup>, region: string, name: string) {
  const input = within(screen.getByRole('region', { name: region })).getByRole('combobox');
  fireEvent.change(input, { target: { value: name } });
  await user.click(await screen.findByRole('option', { name: `${name} 위스키 선택` }));
}

async function selectPair(user: ReturnType<typeof userEvent.setup>) {
  await choose(user, '남길 위스키', base.korName);
  await choose(user, '합칠 중복 위스키', duplicates[0]!.korName);
}

async function runPreview(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: '미리보기 확인' }));
  await screen.findByText('12건');
}

beforeEach(() => {
  previewRequests = [];
  mergeRequests = [];
  logQueries = [];
  saved = false;
  server.use(
    http.get('/admin/api/v1/alcohols/lookup', ({ request }) => {
      const q = new URL(request.url).searchParams.get('keyword') ?? '';
      const items = [base, ...duplicates].filter((item) => item.korName.includes(q));
      return HttpResponse.json(
        wrapApiResponse(items, {
          page: 0,
          size: 20,
          totalElements: items.length,
          totalPages: 1,
          hasNext: false,
        })
      );
    }),
    http.post(`${BASE}/preview`, async ({ request }) => {
      previewRequests.push((await request.json()) as AlcoholMergeRequest);
      return HttpResponse.json(wrapApiResponse(preview));
    }),
    http.post(BASE, async ({ request }) => {
      mergeRequests.push((await request.json()) as AlcoholMergeRequest);
      saved = true;
      return HttpResponse.json(
        wrapApiResponse({
          code: 'ALCOHOL_MERGED',
          message: '병합됨',
          targetId: 10,
          responseAt: '2026-11-11 12:00:00',
        })
      );
    }),
    http.get(BASE, ({ request }) => {
      const query = new URL(request.url).searchParams;
      logQueries.push(query);
      return HttpResponse.json(
        wrapApiResponse(saved ? [log] : [], {
          page: Number(query.get('page') ?? 0),
          size: Number(query.get('size') ?? 20),
          totalElements: saved ? 1 : 0,
          totalPages: saved ? 1 : 0,
          hasNext: false,
        })
      );
    })
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('WhiskyMergePage', () => {
  it('선택과 검토를 분리하고 대상을 고치러 돌아가면 승인만 폐기하고 선택을 유지한다', async () => {
    const user = userEvent.setup();
    mount();
    expect(screen.getByRole('heading', { name: '대상 선택' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: '병합 미리보기' })).not.toBeInTheDocument();
    await selectPair(user);
    await runPreview(user);
    expect(screen.getByRole('heading', { name: '병합 내용 검토' })).toHaveFocus();
    const targets = screen.getByRole('region', { name: '검토할 병합 대상' });
    expect(targets).toHaveTextContent(base.korName);
    expect(targets).toHaveTextContent(duplicates[0]!.korName);
    expect(screen.queryByRole('combobox', { name: '위스키 검색' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '대상 다시 선택' }));
    expect(screen.getByRole('heading', { name: '대상 선택' })).toHaveFocus();
    expect(screen.queryByText('12건')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: '남길 위스키' })).toHaveTextContent(base.korName);
    expect(screen.getByRole('region', { name: '합칠 중복 위스키' })).toHaveTextContent(
      duplicates[0]!.korName
    );
    expect(mergeRequests).toHaveLength(0);
  });

  it('검토에서 키보드로 확인창을 열고 취소하면 실행 버튼으로 돌아온다', async () => {
    const user = userEvent.setup();
    mount();
    await selectPair(user);
    await runPreview(user);
    const trigger = screen.getByRole('button', { name: '중복 위스키 1개 병합' });
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: '취소' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
    expect(mergeRequests).toHaveLength(0);
  });

  it('병합 실행 중에는 확인창과 처리 상태를 유지하고 완료한 결과로 초점을 옮긴다', async () => {
    let resolveMerge!: (result: AlcoholMergeResult) => void;
    vi.spyOn(adminAlcoholMergeService, 'merge').mockReturnValueOnce(
      new Promise((resolve) => {
        resolveMerge = resolve;
      })
    );
    const user = userEvent.setup();
    mount();
    await selectPair(user);
    await runPreview(user);
    await user.click(screen.getByRole('button', { name: '중복 위스키 1개 병합' }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: '병합 실행' })
    );
    expect(screen.getByRole('alertdialog')).toHaveTextContent('병합 중...');
    expect(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: '취소' })
    ).toBeDisabled();
    await act(async () =>
      resolveMerge({
        code: 'ALCOHOL_MERGED',
        message: '병합됨',
        targetId: 10,
        responseAt: '2026-11-11T15:00:00',
      })
    );
    const result = await screen.findByRole('region', { name: '병합 완료' });
    await waitFor(() => expect(result).toHaveFocus());
    expect(result).toHaveTextContent('중복 위스키 1개');
    expect(screen.getByRole('tab', { name: '병합 이력' })).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('button', { name: '다른 중복 병합' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: '대상 선택' })).toHaveFocus());
  });

  it('선택과 미리보기 후 확인해야만 한 번 병합하고 실제 이력 응답을 표시한다', async () => {
    const user = userEvent.setup();
    mount();
    expect(screen.queryByText('예시 화면')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '미리보기 확인' })).toBeDisabled();
    await selectPair(user);
    expect(screen.queryByRole('button', { name: '중복 위스키 1개 병합' })).not.toBeInTheDocument();
    await runPreview(user);
    expect(previewRequests).toEqual([{ baseAlcoholId: 10, duplicateAlcoholIds: [20] }]);
    await user.click(screen.getByRole('button', { name: '중복 위스키 1개 병합' }));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent('기준 위스키');
    expect(dialog).toHaveTextContent('중복 위스키 1개를 아래 위스키로 합칩니다.');
    expect(mergeRequests).toHaveLength(0);
    await user.click(within(dialog).getByRole('button', { name: '취소' }));
    expect(mergeRequests).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: '중복 위스키 1개 병합' }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: '병합 실행' })
    );
    expect(await screen.findByText('처리자 없음')).toBeInTheDocument();
    expect(mergeRequests).toEqual([{ baseAlcoholId: 10, duplicateAlcoholIds: [20] }]);
    expect(logQueries[logQueries.length - 1]?.get('baseAlcoholId')).toBe('10');
    await user.click(screen.getByRole('tab', { name: '병합하기' }));
    expect(
      screen.queryByRole('button', { name: '중복 위스키 1 선택 해제' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '미리보기 확인' })).toBeDisabled();
  });

  it('선택을 바꾸면 미리보기와 병합 가능 상태를 폐기한다', async () => {
    const user = userEvent.setup();
    mount();
    await selectPair(user);
    await runPreview(user);
    await user.click(screen.getByRole('button', { name: '대상 다시 선택' }));
    await user.click(screen.getByRole('button', { name: '중복 위스키 1 선택 해제' }));
    expect(screen.queryByText('12건')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '미리보기 확인' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /중복 위스키 .*개 병합/ })).not.toBeInTheDocument();
  });

  it('미리보기 갱신이 실패하면 이전 성공 결과로 병합할 수 없다', async () => {
    const user = userEvent.setup();
    mount();
    await selectPair(user);
    await runPreview(user);
    server.use(
      http.post(`${BASE}/preview`, () =>
        HttpResponse.json(wrapApiError(500, 'UNKNOWN_ERROR', '미리보기 실패'), { status: 500 })
      )
    );
    await user.click(screen.getByRole('button', { name: '미리보기 갱신' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('미리보기 실패');
    expect(screen.queryByText('12건')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '중복 위스키 1개 병합' })).toBeDisabled();
  });

  it('탭 전환 뒤 늦게 도착한 미리보기 응답으로 새 선택을 승인하지 않는다', async () => {
    let resolvePreview!: (data: AlcoholMergePreview) => void;
    vi.spyOn(adminAlcoholMergeService, 'preview').mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePreview = resolve;
      })
    );
    const user = userEvent.setup();
    mount();
    await selectPair(user);
    await user.click(screen.getByRole('button', { name: '미리보기 확인' }));
    await user.click(screen.getByRole('tab', { name: '병합 이력' }));
    await user.click(screen.getByRole('tab', { name: '병합하기' }));
    await choose(user, '합칠 중복 위스키', duplicates[1]!.korName);
    await act(async () => resolvePreview(preview));
    expect(screen.queryByText('12건')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '중복 위스키 2개 병합' })).not.toBeInTheDocument();
  });

  it('병합 통신 실패 후 요청을 반복하지 않고 미리보기를 폐기한다', async () => {
    let attempts = 0;
    server.use(
      http.post(BASE, () => {
        attempts += 1;
        return HttpResponse.error();
      })
    );
    const user = userEvent.setup();
    mount();
    await selectPair(user);
    await runPreview(user);
    await user.click(screen.getByRole('button', { name: '중복 위스키 1개 병합' }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: '병합 실행' })
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('병합 이력');
    expect(attempts).toBe(1);
    expect(screen.getByRole('button', { name: '중복 위스키 1개 병합' })).toBeDisabled();
  });

  it('실패한 확인창이 완전히 닫힌 뒤 검토 제목으로 초점을 옮긴다', async () => {
    let rejectMerge!: (reason: Error) => void;
    vi.spyOn(adminAlcoholMergeService, 'merge').mockReturnValue(
      new Promise<AlcoholMergeResult>((_, reject) => {
        rejectMerge = reject;
      })
    );
    const user = userEvent.setup();
    mount();
    await selectPair(user);
    await runPreview(user);
    await user.click(screen.getByRole('button', { name: '중복 위스키 1개 병합' }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: '병합 실행' })
    );
    await act(async () => rejectMerge(new Error('응답을 확인하지 못했습니다.')));
    await screen.findByRole('alert');
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: '병합 내용 검토' })).toHaveFocus()
    );
  });

  it('실행 중 뒤로 이동한 뒤 실패해도 탭과 선택에 상관없이 요청 결과 안내를 유지한다', async () => {
    let rejectMerge!: (reason: Error) => void;
    vi.spyOn(adminAlcoholMergeService, 'merge').mockReturnValue(
      new Promise<AlcoholMergeResult>((_, reject) => {
        rejectMerge = reject;
      })
    );
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole('tab', { name: '병합 이력' }));
    await user.click(screen.getByRole('tab', { name: '병합하기' }));
    await selectPair(user);
    await runPreview(user);
    await user.click(screen.getByRole('button', { name: '중복 위스키 1개 병합' }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: '병합 실행' })
    );
    fireEvent.click(screen.getByText('검증용 뒤로'));
    await screen.findByRole('tabpanel', { name: '병합 이력' });
    await act(async () => rejectMerge(new Error('응답을 확인하지 못했습니다.')));
    expect(await screen.findByRole('alert')).toHaveTextContent('병합 결과를 확인해야 합니다.');
    fireEvent.click(screen.getByText('검증용 앞으로'));
    await screen.findByRole('heading', { name: '대상 선택' });
    await user.click(screen.getByRole('button', { name: '중복 위스키 1 선택 해제' }));
    await choose(user, '합칠 중복 위스키', duplicates[1]!.korName);
    const warning = screen.getByRole('alert');
    expect(warning).toHaveTextContent('기준 위스키');
    expect(warning).toHaveTextContent('#10');
    expect(warning).toHaveTextContent('#20');
    expect(warning).not.toHaveTextContent('#21');
    await user.click(within(warning).getByRole('button', { name: '병합 이력 확인' }));
    expect(screen.getByTestId('location')).toHaveTextContent('baseAlcoholId=10');
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '결과 확인 완료' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('브라우저 앞으로와 뒤로 이동으로 탭을 바꿔도 이전 미리보기를 복구하지 않는다', async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole('tab', { name: '병합 이력' }));
    await user.click(screen.getByRole('button', { name: '검증용 뒤로' }));
    await selectPair(user);
    await runPreview(user);
    await user.click(screen.getByRole('button', { name: '검증용 앞으로' }));
    await screen.findByRole('tabpanel', { name: '병합 이력' });
    await user.click(screen.getByRole('button', { name: '검증용 뒤로' }));
    expect(screen.queryByText('12건')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '중복 위스키 1개 병합' })).not.toBeInTheDocument();
  });

  it('이력 ID 필터와 페이지를 URL에 보존하고 잘못된 ID를 전송하지 않는다', async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole('tab', { name: '병합 이력' }));
    await screen.findByText('병합 이력이 없습니다.');
    await user.type(screen.getByLabelText('기준 위스키 ID'), '0');
    await user.click(screen.getByRole('button', { name: '검색' }));
    expect(await screen.findByText('1 이상의 정수 ID를 입력하세요.')).toBeInTheDocument();
    expect(logQueries).toHaveLength(1);
    await user.clear(screen.getByLabelText('기준 위스키 ID'));
    await user.type(screen.getByLabelText('기준 위스키 ID'), '10');
    server.use(
      http.get(BASE, ({ request }) => {
        const query = new URL(request.url).searchParams;
        logQueries.push(query);
        return HttpResponse.json(
          wrapApiResponse([log], {
            page: Number(query.get('page') ?? 0),
            size: 20,
            totalElements: 21,
            totalPages: 2,
            hasNext: query.get('page') !== '1',
          })
        );
      })
    );
    await user.click(screen.getByRole('button', { name: '검색' }));
    await screen.findByText('처리자 없음');
    expect(screen.getByTestId('location')).toHaveTextContent('baseAlcoholId=10');
    await user.click(screen.getByRole('button', { name: '다음' }));
    await waitFor(() => expect(logQueries[logQueries.length - 1]?.get('page')).toBe('1'));
    expect(screen.getByTestId('location')).toHaveTextContent('page=1');
  });

  it.each(['전환 commit 전', '전환 commit 후'])(
    '오류의 지연 focus가 %s 실행돼도 선택 탭의 초점을 유지한다',
    async (order) => {
      const user = userEvent.setup();
      mount();
      await user.click(screen.getByRole('tab', { name: '병합 이력' }));
      await screen.findByText('병합 이력이 없습니다.');
      const input = screen.getByLabelText('기준 위스키 ID');
      fireEvent.change(input, { target: { value: '0' } });
      vi.useFakeTimers();
      await act(async () => {
        fireEvent.submit(input.closest('form')!);
      });
      expect(input).toHaveFocus();
      expect(screen.getByText('1 이상의 정수 ID를 입력하세요.')).toBeInTheDocument();
      const mergeTab = screen.getByRole('tab', { name: '병합하기' });
      if (order === '전환 commit 전') {
        const nativeFocus = mergeTab.focus.bind(mergeTab);
        vi.spyOn(mergeTab, 'focus').mockImplementation(() => {
          nativeFocus();
          vi.runOnlyPendingTimers();
        });
      }
      screen.getByRole('tab', { name: '병합 이력' }).focus();
      fireEvent.keyDown(screen.getByRole('tab', { name: '병합 이력' }), { key: 'ArrowLeft' });
      await act(async () => {
        vi.runOnlyPendingTimers();
      });
      expect(screen.getByTestId('location')).not.toHaveTextContent('tab=history');
      expect(mergeTab).toHaveAttribute('aria-selected', 'true');
      expect(mergeTab).toHaveFocus();
    }
  );

  it('이력 폼에 머무르면 검증 오류의 자동 focus와 안내를 유지한다', async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole('tab', { name: '병합 이력' }));
    await screen.findByText('병합 이력이 없습니다.');
    const input = screen.getByLabelText('기준 위스키 ID');
    fireEvent.change(input, { target: { value: '0' } });
    vi.useFakeTimers();
    await act(async () => {
      fireEvent.submit(input.closest('form')!);
    });
    expect(input).toHaveFocus();
    await act(async () => {
      vi.runOnlyPendingTimers();
    });
    expect(input).toHaveFocus();
    expect(screen.getByText('1 이상의 정수 ID를 입력하세요.')).toBeInTheDocument();
  });

  it('중복 10개 제한을 지키고 합계 표와 개별 조회 범위에 상관없이 선택한 10개를 병합한다', async () => {
    server.use(
      http.post(`${BASE}/preview`, async ({ request }) => {
        const payload = (await request.json()) as AlcoholMergeRequest;
        previewRequests.push(payload);
        return HttpResponse.json(
          wrapApiResponse({
            base,
            duplicates: payload.duplicateAlcoholIds.map((id) => ({
              alcohol: duplicates.find((item) => item.alcoholId === id)!,
              counts: [{ name: 'reviews', moved: 1, deleted: 0 }],
            })),
          })
        );
      })
    );
    const user = userEvent.setup();
    mount();
    await choose(user, '남길 위스키', base.korName);
    const duplicateRegion = screen.getByRole('region', { name: '합칠 중복 위스키' });
    const search = within(duplicateRegion).getByRole('combobox');
    fireEvent.change(search, { target: { value: base.korName } });
    await screen.findByText('검색 결과가 없습니다');
    for (const item of duplicates.slice(0, 10))
      await choose(user, '합칠 중복 위스키', item.korName);
    expect(search).toBeDisabled();
    expect(within(duplicateRegion).getByText('10 / 10개')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '미리보기 확인' }));
    await screen.findByRole('button', { name: '미리보기 갱신' });
    expect(screen.getAllByRole('table')).toHaveLength(1);
    expect(screen.getByRole('row', { name: '리뷰 10건 0건' })).toBeInTheDocument();
    await user.click(screen.getByRole('combobox', { name: '미리보기 범위' }));
    await user.click(screen.getByRole('option', { name: '중복 위스키 10 (#29)' }));
    expect(screen.getByRole('row', { name: '리뷰 1건 0건' })).toBeInTheDocument();
    const targets = screen.getByRole('region', { name: '검토할 병합 대상' });
    expect(targets).toHaveTextContent('중복 위스키 1');
    expect(targets).toHaveTextContent('#20');
    expect(targets).toHaveTextContent('중복 위스키 10');
    expect(targets).toHaveTextContent('#29');
    await user.click(screen.getByRole('button', { name: '중복 위스키 10개 병합' }));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent('중복 위스키 10개를 아래 위스키로 합칩니다.');
    expect(dialog).toHaveTextContent('기준 위스키');
    expect(dialog).toHaveTextContent('#10');
    await user.click(within(dialog).getByRole('button', { name: '병합 실행' }));
    await waitFor(() =>
      expect(mergeRequests).toEqual([
        {
          baseAlcoholId: base.alcoholId,
          duplicateAlcoholIds: duplicates.slice(0, 10).map((item) => item.alcoholId),
        },
      ])
    );
  }, 15000);
});
