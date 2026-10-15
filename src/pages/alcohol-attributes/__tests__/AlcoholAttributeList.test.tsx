import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { render } from '@/test/test-utils';
import { server } from '@/test/mocks/server';
import { mockAttributedAlcohols, wrapApiResponse } from '@/test/mocks/data';

import { AlcoholAttributeListPage } from '../AlcoholAttributeList';

const BASE = '/admin/api/v1/alcohols/attributes';

const showToast = vi.fn();

vi.mock('@/hooks/useToast', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useToast')>('@/hooks/useToast');
  return {
    ...actual,
    useToast: () => ({ showToast }),
  };
});

function okResult(code: string) {
  return HttpResponse.json(
    wrapApiResponse({ code, message: '처리됨', targetId: 1, responseAt: '2026-10-15 10:00:00' })
  );
}

function pageOf(items: typeof mockAttributedAlcohols) {
  return HttpResponse.json(
    wrapApiResponse(items, {
      page: 0,
      size: 20,
      totalElements: items.length,
      totalPages: 1,
      hasNext: false,
    })
  );
}

async function findListTable() {
  const table = await screen.findByRole('table', { name: '속성 위스키 목록' });
  await within(table).findByRole('button', { name: '글렌피딕 12년 속성 보기' });
  return table;
}

/** 글렌피딕 12년과 맥캘란 18년을 체크하고 일괄 편집 시트를 연다 */
async function openBulkSheet(user: ReturnType<typeof userEvent.setup>) {
  const table = await findListTable();
  await user.click(within(table).getByRole('checkbox', { name: '글렌피딕 12년 선택' }));
  await user.click(within(table).getByRole('checkbox', { name: '맥캘란 18년 선택' }));
  await user.click(screen.getByRole('button', { name: '선택 2개 일괄 편집' }));
  const sheet = await screen.findByRole('dialog', { name: '일괄 편집' });
  await within(sheet).findByRole('region', { name: '키워드' });
  return sheet;
}

describe('AlcoholAttributeListPage', () => {
  beforeEach(() => {
    showToast.mockClear();
    // Radix Select가 jsdom에 없는 pointer capture API를 호출한다
    Element.prototype.hasPointerCapture = () => false;
    Element.prototype.setPointerCapture = () => {};
    Element.prototype.releasePointerCapture = () => {};
  });

  it('속성이 붙은 위스키를 키워드와 주요 항목으로 피벗해 보여준다', async () => {
    render(<AlcoholAttributeListPage />);

    const table = await findListTable();
    const glen = within(table)
      .getByRole('button', { name: '글렌피딕 12년 속성 보기' })
      .closest('tr')!;
    expect(within(glen).getByText('피트')).toBeInTheDocument();
    expect(within(glen).getByText('98,000')).toBeInTheDocument();
    const mac = within(table).getByRole('button', { name: '맥캘란 18년 속성 보기' }).closest('tr')!;
    expect(within(mac).getAllByText('-').length).toBeGreaterThan(0);
    expect(screen.getByText('위스키 2개')).toBeInTheDocument();
  });

  it('필터를 바꾸면 그 조건으로 목록 API를 다시 호출한다', async () => {
    const user = userEvent.setup();
    const queries: URLSearchParams[] = [];
    server.use(
      http.get(`${BASE}/alcohols`, ({ request }) => {
        queries.push(new URL(request.url).searchParams);
        return pageOf(mockAttributedAlcohols);
      })
    );

    render(<AlcoholAttributeListPage />);
    await findListTable();

    await user.click(screen.getByRole('combobox', { name: '항목' }));
    await user.click(await screen.findByRole('option', { name: 'keyword' }));
    await waitFor(() => expect(queries[queries.length - 1]!.get('key')).toBe('keyword'));

    // 키워드 항목을 고르면 값은 기존 키워드 가운데 고른다
    await user.click(screen.getByRole('combobox', { name: '값' }));
    await user.click(await screen.findByRole('option', { name: /^피트/ }));
    await waitFor(() => expect(queries[queries.length - 1]!.get('value')).toBe('피트'));

    await user.click(screen.getByRole('combobox', { name: '값 없는 항목' }));
    await user.click(await screen.findByRole('option', { name: /bottle_price_krw 없음/ }));
    await waitFor(() =>
      expect(queries[queries.length - 1]!.get('missingKey')).toBe('bottle_price_krw')
    );

    await user.type(screen.getByRole('textbox', { name: '위스키 검색' }), '맥캘란');
    await waitFor(() => expect(queries[queries.length - 1]!.get('keyword')).toBe('맥캘란'));
    expect(queries[queries.length - 1]!.get('page')).toBe('0');

    await user.click(screen.getByRole('button', { name: '필터 초기화' }));
    await waitFor(() => {
      const last = queries[queries.length - 1]!;
      expect(last.get('key')).toBeNull();
      expect(last.get('keyword')).toBeNull();
      expect(last.get('missingKey')).toBeNull();
    });
  });

  it('위스키를 체크해 일괄 편집 시트를 열고 속성 추가 폼을 저장하면 그 위스키들에 POST한다', async () => {
    const user = userEvent.setup();
    let captured: Record<string, unknown> | null = null;
    server.use(
      http.post(BASE, async ({ request }) => {
        captured = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(wrapApiResponse({ added: 2, skipped: 0, createdIds: [8, 9] }));
      })
    );

    render(<AlcoholAttributeListPage />);
    const sheet = await openBulkSheet(user);
    expect(within(sheet).getByRole('group', { name: 'keyword · 피트' })).toBeInTheDocument();

    await user.click(within(sheet).getByRole('button', { name: '속성 추가' }));
    const dialog = await screen.findByRole('dialog', { name: '속성 추가' });
    await user.type(within(dialog).getByLabelText(/^항목\*?$/), 'Popularity Score');
    await user.click(within(dialog).getByRole('combobox', { name: '분류' }));
    await user.click(await screen.findByRole('option', { name: '대중성 점수' }));
    await user.click(within(dialog).getByRole('combobox', { name: '값 형식' }));
    await user.click(await screen.findByRole('option', { name: '소수' }));
    await user.type(within(dialog).getByLabelText(/^값\*?$/), '87.5');
    await user.type(within(dialog).getByLabelText('근거'), '시즌 조정');
    fireEvent.change(within(dialog).getByLabelText('기준 시점'), {
      target: { value: '2026-10-01T09:00' },
    });
    await user.click(within(dialog).getByRole('button', { name: '저장' }));

    await waitFor(() =>
      expect(captured).toEqual({
        alcoholIds: [10, 20],
        key: 'popularity_score',
        type: 'POPULARITY',
        datatype: 'DOUBLE',
        value: '87.5',
        description: '시즌 조정',
        basedAt: '2026-10-01T09:00:00',
      })
    );
    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', message: '속성 2개를 추가했습니다.' })
      )
    );
  });

  it('일괄 편집에서 "나머지에 적용"은 빠진 위스키에만, 묶음 삭제는 행 id로 batch/delete를 호출한다', async () => {
    const user = userEvent.setup();
    let created: Record<string, unknown> | null = null;
    let batchBody: Record<string, unknown> | null = null;
    server.use(
      http.post(BASE, async ({ request }) => {
        created = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(wrapApiResponse({ added: 1, skipped: 0, createdIds: [8] }));
      }),
      http.post(`${BASE}/batch/delete`, async ({ request }) => {
        batchBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(wrapApiResponse([]));
      })
    );

    render(<AlcoholAttributeListPage />);
    const sheet = await openBulkSheet(user);

    const price = within(sheet).getByRole('group', { name: 'bottle_price_krw' });
    await user.click(within(price).getByRole('button', { name: '나머지에 적용' }));
    await waitFor(() =>
      expect(created).toEqual({
        alcoholIds: [20],
        key: 'bottle_price_krw',
        type: 'PRICE',
        datatype: 'INT',
        value: '98000',
        description: null,
        basedAt: null,
      })
    );

    const peat = within(sheet).getByRole('group', { name: 'keyword · 피트' });
    await user.click(within(peat).getByRole('button', { name: '삭제' }));
    const alert = await screen.findByRole('alertdialog');
    await user.click(within(alert).getByRole('button', { name: '삭제' }));
    await waitFor(() => expect(batchBody).toEqual({ ids: [1, 2] }));
  });

  it('위스키 이름을 누르면 속성 시트가 열리고 값을 수정하면 key 없이 PUT한다', async () => {
    const user = userEvent.setup();
    let path = '';
    let captured: Record<string, unknown> | null = null;
    server.use(
      http.put(`${BASE}/:id`, async ({ request, params }) => {
        path = String(params.id);
        captured = (await request.json()) as Record<string, unknown>;
        return okResult('ALCOHOL_ATTRIBUTE_UPDATED');
      })
    );

    render(<AlcoholAttributeListPage />);
    const table = await findListTable();
    await user.click(within(table).getByRole('button', { name: '글렌피딕 12년 속성 보기' }));
    const sheet = await screen.findByRole('dialog', { name: '글렌피딕 12년' });
    await user.click(
      await within(sheet).findByRole('button', { name: 'bottle_price_krw · 98000 수정' })
    );
    const dialog = await screen.findByRole('dialog', { name: '속성 수정' });
    expect(within(dialog).queryByLabelText(/^항목\*?$/)).not.toBeInTheDocument();
    const valueInput = within(dialog).getByLabelText(/^값\*?$/);
    expect(valueInput).toHaveValue('98000');
    await user.clear(valueInput);
    await user.type(valueInput, '105000');
    await user.click(within(dialog).getByRole('button', { name: '저장' }));

    await waitFor(() => expect(path).toBe('3'));
    expect(captured).toEqual({
      type: 'PRICE',
      datatype: 'INT',
      value: '105000',
      description: '공식몰 판매가',
      basedAt: '2026-10-01T00:00:00',
    });
  });

  it('위스키 시트에서 행 삭제는 DELETE, 키워드 칩은 그 위스키 하나에 POST한다', async () => {
    const user = userEvent.setup();
    let deletedPath = '';
    let created: Record<string, unknown> | null = null;
    server.use(
      http.delete(`${BASE}/:id`, ({ params }) => {
        deletedPath = String(params.id);
        return okResult('ALCOHOL_ATTRIBUTE_DELETED');
      }),
      http.post(BASE, async ({ request }) => {
        created = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(wrapApiResponse({ added: 1, skipped: 0, createdIds: [8] }));
      })
    );

    render(<AlcoholAttributeListPage />);
    const table = await findListTable();
    await user.click(within(table).getByRole('button', { name: '맥캘란 18년 속성 보기' }));
    const sheet = await screen.findByRole('dialog', { name: '맥캘란 18년' });

    await user.click(
      await within(sheet).findByRole('button', { name: 'is_flavored · false 삭제' })
    );
    const alert = await screen.findByRole('alertdialog');
    await user.click(within(alert).getByRole('button', { name: '삭제' }));
    await waitFor(() => expect(deletedPath).toBe('5'));

    // 피트는 이미 있으므로 셰리만 칩으로 보인다
    expect(
      within(sheet).queryByRole('button', { name: '피트 키워드 추가' })
    ).not.toBeInTheDocument();
    await user.click(await within(sheet).findByRole('button', { name: '셰리 키워드 추가' }));
    await waitFor(() =>
      expect(created).toEqual({
        alcoholIds: [20],
        key: 'keyword',
        type: 'KEYWORD',
        datatype: 'STRING',
        value: '셰리',
        description: null,
        basedAt: null,
      })
    );
  });

  it('통계 탭은 전체 기준 항목 집계와 키워드 값을 보여준다', async () => {
    const user = userEvent.setup();
    render(<AlcoholAttributeListPage />);
    await findListTable();

    await user.click(screen.getByRole('tab', { name: '통계' }));
    const stats = await screen.findByRole('table', { name: '항목별 집계' });
    expect(await within(stats).findByText('bottle_price_krw')).toBeInTheDocument();
    const keywords = screen.getByRole('region', { name: '키워드 값' });
    expect(within(keywords).getByText('피트')).toBeInTheDocument();
  });
});
