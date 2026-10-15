import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { render } from '@/test/test-utils';
import { server } from '@/test/mocks/server';
import { wrapApiError, wrapApiResponse } from '@/test/mocks/data';

import { TastingGroupListPage } from '../TastingGroupList';

const BASE = '/admin/api/v1/tasting/groups';

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

describe('TastingGroupListPage', () => {
  beforeEach(() => {
    showToast.mockClear();
  });

  it('그룹 목록을 표시하고 첫 그룹의 태그와 역할을 카드에 보여준다', async () => {
    render(<TastingGroupListPage />);

    const rail = await screen.findByRole('listbox', { name: '태그 그룹 목록' });
    expect(await within(rail).findByText('피트 스모크')).toBeInTheDocument();
    expect(within(rail).getByText('시트러스')).toBeInTheDocument();
    expect(within(rail).getByText('PEAT_SMOKE')).toBeInTheDocument();

    const card = await screen.findByRole('region', { name: '선택한 태그 그룹' });
    const core = within(card).getByRole('region', { name: '대표 태그' });
    const peripheral = within(card).getByRole('region', { name: '보조 태그' });
    expect(within(core).getByText('피트')).toBeInTheDocument();
    expect(within(peripheral).getByText('요오드')).toBeInTheDocument();
    expect(within(card).getByText('대표 태그 1')).toBeInTheDocument();
    expect(within(card).getByText('보조 태그 1')).toBeInTheDocument();
  });

  it('그룹 추가 폼을 저장하면 생성 API에 입력값을 전송한다', async () => {
    const user = userEvent.setup();
    let captured: Record<string, unknown> | null = null;
    server.use(
      http.post(BASE, async ({ request }) => {
        captured = (await request.json()) as Record<string, unknown>;
        return okResult('TASTING_TAG_GROUP_CREATED');
      })
    );

    render(<TastingGroupListPage />);
    await screen.findByRole('listbox', { name: '태그 그룹 목록' });

    await user.click(screen.getByRole('button', { name: '태그 그룹 추가' }));
    const dialog = await screen.findByRole('dialog');

    await user.type(within(dialog).getByPlaceholderText('예: PEAT_SMOKE'), 'SHERRY_SWEET');
    await user.type(within(dialog).getByPlaceholderText('예: 피트 스모크'), '셰리 단맛');
    await user.type(within(dialog).getByPlaceholderText('예: 스모키'), '단맛');
    const orderInput = within(dialog).getByLabelText('표시 순서');
    await user.clear(orderInput);
    await user.type(orderInput, '3');
    await user.click(within(dialog).getByRole('button', { name: '저장' }));

    await waitFor(() =>
      expect(captured).toEqual({
        code: 'SHERRY_SWEET',
        name: '셰리 단맛',
        family: '단맛',
        description: null,
        displayOrder: 3,
      })
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('그룹 수정 폼은 기존 값을 채우고 저장 시 수정 API에 전송한다', async () => {
    const user = userEvent.setup();
    let capturedCode = '';
    let captured: Record<string, unknown> | null = null;
    server.use(
      http.put(`${BASE}/:code`, async ({ request, params }) => {
        capturedCode = String(params.code);
        captured = (await request.json()) as Record<string, unknown>;
        return okResult('TASTING_TAG_GROUP_UPDATED');
      })
    );

    render(<TastingGroupListPage />);
    const card = await screen.findByRole('region', { name: '선택한 태그 그룹' });

    await user.click(within(card).getByRole('button', { name: '수정' }));
    const dialog = await screen.findByRole('dialog');
    const nameInput = within(dialog).getByPlaceholderText('예: 피트 스모크');
    expect(nameInput).toHaveValue('피트 스모크');
    expect(within(dialog).queryByPlaceholderText('예: PEAT_SMOKE')).not.toBeInTheDocument();

    await user.clear(nameInput);
    await user.type(nameInput, '피트 스모크 v2');
    await user.click(within(dialog).getByRole('button', { name: '저장' }));

    await waitFor(() => expect(capturedCode).toBe('PEAT_SMOKE'));
    expect(captured).toEqual({
      name: '피트 스모크 v2',
      family: '스모키',
      description: '아일라 계열',
      displayOrder: 1,
    });
  });

  it('태그 연결 패널은 즉시 검색·전체 선택으로 고른 칩을 역할별로 나눠 추가하고 열린 채 선택만 비운다', async () => {
    const user = userEvent.setup();
    const calls: Array<{ code: string; body: Record<string, unknown> }> = [];
    server.use(
      http.post(`${BASE}/:code/tags`, async ({ request, params }) => {
        calls.push({
          code: String(params.code),
          body: (await request.json()) as Record<string, unknown>,
        });
        return okResult('TASTING_TAG_GROUP_TAG_ADDED');
      })
    );

    render(<TastingGroupListPage />);
    const card = await screen.findByRole('region', { name: '선택한 태그 그룹' });
    await user.click(within(card).getByRole('button', { name: '태그 연결' }));
    const panel = await screen.findByRole('dialog');
    await within(panel).findByRole('option', { name: '가죽' });

    // 버튼 없이 입력만으로 걸러진다
    await user.type(within(panel).getByPlaceholderText('태그 이름으로 검색'), '민');
    await waitFor(() =>
      expect(within(panel).queryByRole('option', { name: '가죽' })).not.toBeInTheDocument()
    );
    expect(await within(panel).findByRole('option', { name: '민트' })).toBeInTheDocument();
    await user.clear(within(panel).getByPlaceholderText('태그 이름으로 검색'));
    await within(panel).findByRole('option', { name: '가죽' });

    // 결과 전체 선택 뒤 민트만 보조 태그로 바꾼다
    await user.click(within(panel).getByRole('button', { name: '결과 전체 선택' }));
    expect(within(panel).getByRole('option', { name: '가죽' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await user.click(within(panel).getByRole('button', { name: /민트 역할 전환/ }));
    await user.click(within(panel).getByRole('button', { name: '2개 추가' }));

    await waitFor(() => expect(calls).toHaveLength(2));
    expect(calls).toEqual(
      expect.arrayContaining([
        { code: 'PEAT_SMOKE', body: { tastingTagIds: [21], role: 'CORE' } },
        { code: 'PEAT_SMOKE', body: { tastingTagIds: [22], role: 'PERIPHERAL' } },
      ])
    );
    // 패널은 닫히지 않고 선택만 비워진다
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await waitFor(() => expect(within(panel).getByRole('button', { name: '추가' })).toBeDisabled());
  });

  it('태그 연결 패널의 "이 그룹의 태그"에서 역할 변경과 제거를 호출한다', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    server.use(
      http.put(`${BASE}/:code/tags/:tagId`, async ({ request, params }) => {
        const body = (await request.json()) as { role: string };
        calls.push(`PUT ${params.code}/${params.tagId} ${body.role}`);
        return okResult('TASTING_TAG_GROUP_TAG_ROLE_UPDATED');
      }),
      http.delete(`${BASE}/:code/tags/:tagId`, ({ params }) => {
        calls.push(`DELETE ${params.code}/${params.tagId}`);
        return okResult('TASTING_TAG_GROUP_TAG_REMOVED');
      })
    );

    render(<TastingGroupListPage />);
    const card = await screen.findByRole('region', { name: '선택한 태그 그룹' });
    await user.click(within(card).getByRole('button', { name: '태그 연결' }));
    const panel = await screen.findByRole('dialog');
    const current = within(panel).getByRole('region', { name: '이 그룹의 태그' });

    await user.click(
      within(current).getByRole('button', { name: '요오드 역할을 대표 태그로 변경' })
    );
    await waitFor(() => expect(calls).toContain('PUT PEAT_SMOKE/12 CORE'));

    await user.click(within(current).getByRole('button', { name: '피트 제거' }));
    await waitFor(() => expect(calls).toContain('DELETE PEAT_SMOKE/11'));
  });

  it('목록 탭의 미소속 태그 배지를 누르면 선택 그룹에 보조 태그로 바로 추가한다', async () => {
    const user = userEvent.setup();
    let capturedCode = '';
    let captured: Record<string, unknown> | null = null;
    server.use(
      http.post(`${BASE}/:code/tags`, async ({ request, params }) => {
        capturedCode = String(params.code);
        captured = (await request.json()) as Record<string, unknown>;
        return okResult('TASTING_TAG_GROUP_TAG_ADDED');
      })
    );

    render(<TastingGroupListPage />);
    await screen.findByRole('region', { name: '선택한 태그 그룹' });

    await user.click(await screen.findByRole('button', { name: '가죽 보조 태그로 추가' }));

    await waitFor(() => expect(capturedCode).toBe('PEAT_SMOKE'));
    expect(captured).toEqual({ tastingTagIds: [21], role: 'PERIPHERAL' });
  });

  it('태그 행에서 역할 변경과 제거를 호출한다', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    server.use(
      http.put(`${BASE}/:code/tags/:tagId`, async ({ request, params }) => {
        const body = (await request.json()) as { role: string };
        calls.push(`PUT ${params.code}/${params.tagId} ${body.role}`);
        return okResult('TASTING_TAG_GROUP_TAG_ROLE_UPDATED');
      }),
      http.delete(`${BASE}/:code/tags/:tagId`, ({ params }) => {
        calls.push(`DELETE ${params.code}/${params.tagId}`);
        return okResult('TASTING_TAG_GROUP_TAG_REMOVED');
      })
    );

    render(<TastingGroupListPage />);
    const card = await screen.findByRole('region', { name: '선택한 태그 그룹' });

    await user.click(within(card).getByRole('button', { name: '요오드 역할을 대표 태그로 변경' }));
    await waitFor(() => expect(calls).toContain('PUT PEAT_SMOKE/12 CORE'));

    // 카드에서의 제거는 확인을 거친다
    await user.click(within(card).getByRole('button', { name: '피트 제거' }));
    const alert = await screen.findByRole('alertdialog');
    await user.click(within(alert).getByRole('button', { name: '제거' }));
    await waitFor(() => expect(calls).toContain('DELETE PEAT_SMOKE/11'));
  });

  it('그룹 표 행을 키보드로 선택할 수 있다', async () => {
    const user = userEvent.setup();
    render(<TastingGroupListPage />);
    const rail = await screen.findByRole('listbox', { name: '태그 그룹 목록' });
    const citrusItem = (await within(rail).findByText('시트러스')).closest('[role="option"]')!;

    (citrusItem as HTMLElement).focus();
    await user.keyboard('{Enter}');

    const card = screen.getByRole('region', { name: '선택한 태그 그룹' });
    expect(within(card).getByRole('heading', { name: '시트러스' })).toBeInTheDocument();
    expect(citrusItem).toHaveAttribute('aria-selected', 'true');
  });

  it('태그가 연결된 그룹은 삭제 버튼이 비활성화되고, 비어 있는 그룹은 삭제할 수 있다', async () => {
    const user = userEvent.setup();
    render(<TastingGroupListPage />);
    const card = await screen.findByRole('region', { name: '선택한 태그 그룹' });
    expect(within(card).getByRole('button', { name: '삭제' })).toBeDisabled();

    const rail = screen.getByRole('listbox', { name: '태그 그룹 목록' });
    await user.click(within(rail).getByText('시트러스'));
    await waitFor(() =>
      expect(
        within(screen.getByRole('region', { name: '선택한 태그 그룹' })).getByRole('button', {
          name: '삭제',
        })
      ).toBeEnabled()
    );
  });

  it('입력 중인 폼을 닫으려 하면 변경 내용을 버릴지 확인한다', async () => {
    const user = userEvent.setup();
    render(<TastingGroupListPage />);
    await screen.findByRole('listbox', { name: '태그 그룹 목록' });

    await user.click(screen.getByRole('button', { name: '태그 그룹 추가' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByPlaceholderText('예: 피트 스모크'), '새 그룹');
    await user.click(within(dialog).getByRole('button', { name: '취소' }));

    const alert = await screen.findByRole('alertdialog');
    expect(
      within(alert).getByRole('heading', { name: '변경 내용을 버릴까요?' })
    ).toBeInTheDocument();
    await user.click(within(alert).getByRole('button', { name: '계속 편집' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('태그가 연결된 그룹 삭제가 409로 거절되면 오류 메시지를 토스트로 보여준다', async () => {
    const user = userEvent.setup();
    server.use(
      http.delete(`${BASE}/:code`, () =>
        HttpResponse.json(
          wrapApiError(
            409,
            'TASTING_TAG_GROUP_HAS_TAGS',
            '태그가 연결된 맛 그룹은 삭제할 수 없습니다.'
          ),
          { status: 409 }
        )
      )
    );

    render(<TastingGroupListPage />);
    await screen.findByRole('region', { name: '선택한 태그 그룹' });
    // 태그가 없는 시트러스를 골라야 삭제 버튼이 활성화된다
    await user.click(
      within(screen.getByRole('listbox', { name: '태그 그룹 목록' })).getByText('시트러스')
    );
    const card = screen.getByRole('region', { name: '선택한 태그 그룹' });

    await user.click(within(card).getByRole('button', { name: '삭제' }));
    const alert = await screen.findByRole('alertdialog');
    await user.click(within(alert).getByRole('button', { name: '삭제' }));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: '태그가 연결된 맛 그룹은 삭제할 수 없습니다.',
        })
      )
    );
  });
});
