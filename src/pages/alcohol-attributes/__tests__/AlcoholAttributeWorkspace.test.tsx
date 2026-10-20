import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within, waitFor } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { http, HttpResponse, delay } from 'msw';
import { server } from '@/test/mocks/server';
import { initialAttributes, initialMappings, alcohols } from './fixtures';
import userEvent from '@testing-library/user-event';
import { useNavigate } from 'react-router';

import { AlcoholAttributeVariantA } from '../variants/a/AlcoholAttributeVariantA';

// Canvas rendering is verified in Orca; jsdom covers the shared state and accessible node controls.
vi.mock('../variants/a/RelationshipCanvas', () => ({ RelationshipCanvas: () => null }));

async function renderPage() {
  render(<AlcoholAttributeVariantA />);
  await screen.findByRole('textbox', { name: /속성 이름/ });
  return userEvent.setup();
}

const base = '/admin/api/v1/alcohols/attributes';
let attributes = structuredClone(initialAttributes);
let mappings = structuredClone(initialMappings).map((m) => ({
  ...m,
  value: initialAttributes.find((a) => a.id === m.attributeId)!.value,
}));
const wrap = (data: unknown, total = Array.isArray(data) ? data.length : 0) => ({
  success: true,
  data,
  meta: { page: 0, size: 100, totalElements: total, totalPages: total ? 1 : 0, hasNext: false },
});
beforeEach(() => {
  attributes = structuredClone(initialAttributes);
  mappings = structuredClone(initialMappings).map((m) => ({
    ...m,
    value: initialAttributes.find((a) => a.id === m.attributeId)!.value,
  }));
  server.use(
    http.post(`${base}/alcohols/facets`, () =>
      HttpResponse.json(wrap({ items: [], hasNext: false }))
    ),
    http.get('/admin/api/v1/alcohols/attribute-groups', () =>
      HttpResponse.json(wrap([{ id: 1, name: '바텐더 노트', description: null, displayOrder: 0 }]))
    ),
    http.get(base, ({ request }) => {
      const q = new URL(request.url).searchParams.get('keyword') ?? '';
      return HttpResponse.json(
        wrap(attributes.filter((a) => `${a.displayName} ${a.key}`.includes(q)))
      );
    }),
    http.get(`${base}/summary`, ({ request }) => {
      const ids = new URL(request.url).searchParams.getAll('alcoholIds').map(Number);
      const selected = mappings.filter((m) => ids.includes(m.alcoholId));
      return HttpResponse.json(
        wrap(
          attributes.map((attribute) => ({
            attribute,
            mappings: selected.filter((m) => m.attributeId === attribute.id),
            alcoholIds: selected
              .filter((m) => m.attributeId === attribute.id)
              .map((m) => m.alcoholId),
            mappingIds: selected.filter((m) => m.attributeId === attribute.id).map((m) => m.id),
            registeredCount: selected.filter((m) => m.attributeId === attribute.id).length,
            selectedCount: ids.length,
          }))
        )
      );
    }),
    http.get(`${base}/alcohols`, () =>
      HttpResponse.json(
        wrap(
          alcohols
            .filter((a) => mappings.some((m) => m.alcoholId === a.id))
            .map((a) => ({
              alcoholId: a.id,
              korName: a.name,
              engName: a.english,
              korCategory: a.category,
              imageUrl: null,
              attributes: mappings
                .filter((m) => m.alcoholId === a.id)
                .map((m) => ({
                  mappingId: m.id,
                  value: m.value,
                  attribute: attributes.find((t) => t.id === m.attributeId)!,
                })),
            }))
        )
      )
    ),
    http.get('/admin/api/v1/alcohols/lookup', () =>
      HttpResponse.json(
        wrap(
          alcohols.map((a) => ({
            alcoholId: a.id,
            korName: a.name,
            engName: a.english,
            korCategoryName: a.category,
            korRegion: a.region,
            imageUrl: null,
          }))
        )
      )
    ),
    http.put(`${base}/:id`, async ({ params, request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      expect(body).not.toHaveProperty('key');
      attributes = attributes.map((a) => (a.id === Number(params.id) ? { ...a, ...body } : a));
      return HttpResponse.json(wrap({ targetId: Number(params.id) }));
    }),
    http.delete(`${base}/mappings/:id`, ({ params }) => {
      mappings = mappings.filter((m) => m.id !== Number(params.id));
      return HttpResponse.json(wrap({ targetId: Number(params.id) }));
    }),
    http.post(`${base}/mappings/batch`, async ({ request }) => {
      const { items } = (await request.json()) as {
        items: { alcoholId: number; attributeId: number; value: string }[];
      };
      const createdIds: number[] = [];
      for (const item of items)
        if (
          !mappings.some(
            (m) => m.alcoholId === item.alcoholId && m.attributeId === item.attributeId
          )
        ) {
          const id = 9000 + mappings.length;
          mappings.push({ ...item, id });
          createdIds.push(id);
        }
      return HttpResponse.json(
        wrap({ added: createdIds.length, skipped: items.length - createdIds.length, createdIds })
      );
    })
  );
});

describe('속성 관리 통합 화면', () => {
  it.each(['관계 그래프', '속성 연결'])(
    '%s에서 여러 속성과 같은 속성의 범위를 검색한다',
    async (tab) => {
      const bodies: unknown[] = [];
      server.use(
        http.post(`${base}/alcohols/search`, async ({ request }) => {
          bodies.push(await request.json());
          return HttpResponse.json(wrap([]));
        })
      );
      const user = await renderPage();
      await user.click(screen.getByRole('tab', { name: tab }));
      if (tab === '관계 그래프')
        await user.click(screen.getByRole('button', { name: /^필터 편집/ }));
      await user.click(screen.getByRole('button', { name: /^속성 선택/ }));
      await user.click(await screen.findByRole('checkbox', { name: '검색 속성 10만 원 이상' }));
      await user.click(screen.getByRole('checkbox', { name: '검색 속성 선물용' }));
      await user.keyboard('{Escape}');
      await user.selectOptions(screen.getByRole('combobox', { name: '조건 1 연산자' }), 'GTE');
      await user.type(screen.getByRole('textbox', { name: '조건 1 값' }), '100000');
      await user.click(screen.getByRole('button', { name: '조건 1 복제' }));
      await user.selectOptions(screen.getByRole('combobox', { name: '조건 3 연산자' }), 'LTE');
      await user.clear(screen.getByRole('textbox', { name: '조건 3 값' }));
      await user.type(screen.getByRole('textbox', { name: '조건 3 값' }), '200000');
      expect(bodies).toHaveLength(0);
      await user.click(screen.getByRole('button', { name: '검색 적용' }));
      await waitFor(() =>
        expect(bodies[bodies.length - 1]).toMatchObject({
          match: 'AND',
          conditions: [
            { key: 'price_gte_100000', operator: 'GTE', value: '100000' },
            { key: 'gift', operator: 'EXISTS' },
            { key: 'price_gte_100000', operator: 'LTE', value: '200000' },
          ],
          page: 0,
        })
      );
      await user.selectOptions(screen.getByRole('combobox', { name: '조건 결합 방식' }), 'OR');
      await user.click(screen.getByRole('button', { name: '검색 적용' }));
      await waitFor(() => expect(bodies[bodies.length - 1]).toMatchObject({ match: 'OR' }));
    }
  );

  it('그래프 상세는 선택 후 표시하고 접어도 선택을 유지한다', async () => {
    const user = await renderPage();
    await user.click(screen.getByRole('tab', { name: '관계 그래프' }));
    expect(screen.queryByRole('complementary', { name: '그래프 상세' })).not.toBeInTheDocument();
    await user.click(screen.getByText('노드 목록으로 탐색'));
    await user.click(screen.getByRole('button', { name: '속성: 선물용 · gift' }));
    expect(screen.getByRole('complementary', { name: '그래프 상세' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '상세 접기' }));
    expect(screen.queryByRole('complementary', { name: '그래프 상세' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '속성: 선물용 · gift' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await user.click(screen.getByRole('button', { name: '상세 보기' }));
    expect(
      within(screen.getByRole('complementary', { name: '그래프 상세' })).getByText('선물용')
    ).toBeInTheDocument();
  });

  it('후속 페이지와 전체 연결 조회를 기다리지 않고 속성 목록을 표시한다', async () => {
    const reads = vi.fn();
    server.use(
      http.get(base, ({ request }) => {
        const query = new URL(request.url).searchParams;
        reads(Number(query.get('page')));
        if (Number(query.get('page')) > 0) return HttpResponse.json(wrap([]));
        return HttpResponse.json({
          ...wrap(attributes),
          meta: { ...wrap(attributes).meta, hasNext: true, totalElements: 3000 },
        });
      }),
      http.get(`${base}/mappings`, async () => {
        await delay('infinite');
        return HttpResponse.json(wrap([]));
      }),
      http.get(`${base}/alcohols`, async () => {
        await delay('infinite');
        return HttpResponse.json(wrap([]));
      })
    );
    render(<AlcoholAttributeVariantA />);
    expect(
      await screen.findByRole('checkbox', { name: `${attributes[0]!.displayName} 선택` })
    ).toBeInTheDocument();
    expect(reads.mock.calls.every(([page]) => page === 0)).toBe(true);
  });

  it('현재 목록의 연결 조회가 실패해도 위스키 목록을 표시하고 미연결로 오인하지 않는다', async () => {
    const ids: number[][] = [];
    server.use(
      http.get(`${base}/summary`, ({ request }) => {
        ids.push(new URL(request.url).searchParams.getAll('alcoholIds').map(Number));
        return HttpResponse.json(
          { success: false, errors: [{ message: '연결 조회 실패' }] },
          { status: 500 }
        );
      })
    );
    const user = await renderPage();
    await user.click(screen.getByRole('tab', { name: '속성 연결' }));
    expect(
      await screen.findByRole('checkbox', { name: `${alcohols[0]!.name} 선택` })
    ).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent('연결 정보를 불러오지 못했습니다.');
    expect(screen.queryByText('미연결')).not.toBeInTheDocument();
    expect(ids[0]).toEqual(alcohols.map((a) => a.id));
    await user.click(screen.getByRole('checkbox', { name: `${alcohols[0]!.name} 선택` }));
    await user.click(screen.getByRole('checkbox', { name: /겨울 추천 후보/ }));
    expect(screen.getByRole('button', { name: '1쌍 연결 검토' })).toBeDisabled();
  });

  it('그래프는 기본 한 페이지 25개만 요청하고 검색은 샘플 밖의 술도 서버에서 찾는다', async () => {
    const reads: URLSearchParams[] = [];
    server.use(
      http.get(`${base}/alcohols`, ({ request }) => {
        const params = new URL(request.url).searchParams;
        reads.push(params);
        const filtered = params.get('keyword') === '멀리 있는 술';
        return HttpResponse.json({
          ...wrap([
            {
              alcoholId: filtered ? 3000 : 1,
              korName: filtered ? '멀리 있는 술' : '첫 페이지 술',
              engName: null,
              korCategory: null,
              imageUrl: null,
              attributes: [
                { mappingId: filtered ? 3000 : 1, value: 'true', attribute: attributes[0]! },
              ],
            },
          ]),
          meta: { ...wrap([]).meta, hasNext: !filtered, totalElements: filtered ? 1 : 3000 },
        });
      })
    );
    const user = await renderPage();
    reads.length = 0;
    await user.click(screen.getByRole('tab', { name: '관계 그래프' }));
    await screen.findByRole('button', { name: '위스키: 첫 페이지 술' });
    expect(reads).toHaveLength(1);
    expect(reads[0]!.get('size')).toBe('25');
    expect(reads[0]!.get('page')).toBe('0');
    await user.type(screen.getByRole('textbox', { name: '그래프 검색' }), '멀리 있는 술');
    expect(await screen.findByRole('button', { name: '위스키: 멀리 있는 술' })).toBeInTheDocument();
    expect(reads[reads.length - 1]!.get('keyword')).toBe('멀리 있는 술');
    expect(screen.queryByRole('button', { name: '위스키: 첫 페이지 술' })).not.toBeInTheDocument();
  });

  it('사전의 다른 페이지에서 고른 속성을 연결 검토에서도 보존한다', async () => {
    server.use(
      http.get(base, ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page') ?? 0);
        return HttpResponse.json({
          ...wrap([attributes[page]!]),
          meta: { ...wrap([]).meta, page, totalElements: 2, hasNext: page === 0 },
        });
      })
    );
    const user = await renderPage();
    await user.click(screen.getByRole('button', { name: '다음' }));
    await user.click(
      await screen.findByRole('checkbox', { name: `${attributes[1]!.displayName} 선택` })
    );
    await user.click(screen.getByRole('tab', { name: '속성 연결' }));
    await user.click(await screen.findByRole('checkbox', { name: `${alcohols[9]!.name} 선택` }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '1쌍 연결 검토' })).toBeEnabled()
    );
    await user.click(screen.getByRole('button', { name: '1쌍 연결 검토' }));
    expect(
      within(screen.getByRole('dialog')).getByText(attributes[1]!.displayName)
    ).toBeInTheDocument();
    expect(within(screen.getByRole('dialog')).getByRole('textbox')).toBeInTheDocument();
  });

  it('등록과 삭제를 서버 요청으로 처리하고 목록을 갱신한다', async () => {
    const user = await renderPage();
    server.use(
      http.post(base, async ({ request }) => {
        const body = (await request.json()) as Omit<(typeof attributes)[number], 'id'>;
        expect(body.key).toBe('new_keyword');
        expect(body).not.toHaveProperty('value');
        expect(body).not.toHaveProperty('operator');
        const created = { ...body, id: 999 };
        attributes.push(created);
        return HttpResponse.json(wrap(created));
      }),
      http.post(`${base}/batch/delete`, async ({ request }) => {
        expect(await request.json()).toEqual({ ids: [999] });
        const removed = attributes.filter((a) => a.id === 999);
        attributes = attributes.filter((a) => a.id !== 999);
        return HttpResponse.json(wrap(removed));
      })
    );
    await user.click(screen.getByRole('button', { name: '속성 만들기' }));
    await user.type(screen.getByRole('textbox', { name: /속성 이름/ }), '새 키워드');
    await user.type(screen.getByRole('textbox', { name: /고유 키/ }), 'new_keyword');
    expect(screen.queryByRole('textbox', { name: /^값/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '등록 내용 확인' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '속성 등록' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(await screen.findByRole('checkbox', { name: '새 키워드 선택' }));
    await user.click(screen.getByRole('button', { name: '삭제' }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: '속성과 연결 삭제' })
    );
    await waitFor(() =>
      expect(screen.queryByRole('checkbox', { name: '새 키워드 선택' })).not.toBeInTheDocument()
    );
  });
  it('서로 다른 위스키에 값을 연결하고 기존 연결 값은 보존한다', async () => {
    const user = await renderPage();
    const existing = structuredClone(mappings);
    await user.click(screen.getByRole('tab', { name: '속성 연결' }));
    const targetNames = [alcohols[8]!.name, alcohols[9]!.name];
    for (const name of targetNames)
      await user.click(screen.getByRole('checkbox', { name: `${name} 선택` }));
    await user.click(screen.getByRole('checkbox', { name: /겨울 추천 후보/ }));
    await user.click(screen.getByRole('button', { name: '2쌍 연결 검토' }));
    const dialog = within(screen.getByRole('dialog'));
    const inputs = dialog.getAllByRole('textbox');
    await user.type(inputs[0]!, 'first');
    await user.type(inputs[1]!, 'second');
    await user.click(dialog.getByRole('button', { name: '연결 적용' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(mappings.filter((m) => m.attributeId === 112).map((m) => m.value)).toEqual([
      'first',
      'second',
    ]);
    expect(mappings.filter((m) => m.attributeId !== 112)).toEqual(existing);
  });

  it('일괄 추가 요청에서 기존 연결을 제외하여 값을 덮어쓰지 않는다', async () => {
    const user = await renderPage();
    const existing = structuredClone(mappings);
    const requestBody = vi.fn();
    server.use(
      http.post(`${base}/mappings/batch`, async ({ request }) => {
        requestBody(await request.json());
        return HttpResponse.json(wrap({ added: 1, skipped: 0, createdIds: [9999] }));
      })
    );
    await user.click(screen.getByRole('tab', { name: '속성 연결' }));
    for (const name of [alcohols[0]!.name, alcohols[9]!.name])
      await user.click(screen.getByRole('checkbox', { name: `${name} 선택` }));
    await user.click(screen.getByRole('checkbox', { name: /선물용/ }));
    await user.click(screen.getByRole('button', { name: '2쌍 연결 검토' }));
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getAllByRole('textbox')).toHaveLength(1);
    await user.type(dialog.getByRole('textbox'), 'new gift');
    await user.click(dialog.getByRole('button', { name: '연결 적용' }));
    await waitFor(() =>
      expect(requestBody).toHaveBeenCalledWith({
        items: [{ alcoholId: alcohols[9]!.id, attributeId: 101, value: 'new gift' }],
      })
    );
    expect(mappings).toEqual(existing);
  });

  it('한 위스키의 값 수정 실패 시 입력을 유지하고 성공하면 목록과 그래프를 갱신한다', async () => {
    const user = await renderPage();
    let fail = true;
    const before = structuredClone(mappings);
    let changedId = 0;
    server.use(
      http.put(`${base}/mappings/:id`, async ({ params, request }) => {
        expect(await request.json()).toEqual({ value: 'updated' });
        if (fail)
          return HttpResponse.json(
            { success: false, errors: [{ message: '값 저장 실패' }] },
            { status: 500 }
          );
        changedId = Number(params.id);
        mappings = mappings.map((m) => (m.id === changedId ? { ...m, value: 'updated' } : m));
        return HttpResponse.json(wrap(mappings.find((m) => m.id === changedId)));
      })
    );
    await user.click(screen.getByRole('tab', { name: '속성 연결' }));
    const panel = within(screen.getByRole('complementary', { name: '연결 작업 패널' }));
    const input = (await panel.findAllByRole('textbox', { name: / 값$/ }))[0]!;
    await user.clear(input);
    await user.type(input, 'updated');
    await user.click(panel.getAllByRole('button', { name: '값 저장' })[0]!);
    expect(await panel.findByRole('alert')).toHaveTextContent('값 저장 실패');
    expect(input).toHaveValue('updated');
    fail = false;
    await user.click(panel.getAllByRole('button', { name: '값 저장' })[0]!);
    await screen.findByText('현재: updated');
    expect(mappings.filter((m) => m.id !== changedId)).toEqual(
      before.filter((m) => m.id !== changedId)
    );
    await user.click(screen.getByRole('tab', { name: '관계 그래프' }));
    await user.click(screen.getByText('노드 목록으로 탐색'));
    await user.click(screen.getByRole('button', { name: '속성: 선물용 · updated' }));
    expect(
      within(screen.getByRole('complementary', { name: '그래프 상세' })).getAllByText('updated')
    ).toHaveLength(2);
  });

  it('서버 페이지를 이동하고 검색 시 첫 페이지로 돌아간다', async () => {
    const user = await renderPage();
    server.use(
      http.get(base, ({ request }) => {
        const params = new URL(request.url).searchParams;
        if (params.get('size') === '100') return HttpResponse.json(wrap(attributes));
        const page = Number(params.get('page'));
        const keyword = params.get('keyword');
        const data = keyword
          ? attributes.filter((a) => a.displayName.includes(keyword))
          : [attributes[page]!];
        return HttpResponse.json({
          ...wrap(data),
          meta: {
            page,
            size: 20,
            totalElements: keyword ? data.length : 21,
            totalPages: keyword ? 1 : 2,
            hasNext: !keyword && page === 0,
          },
        });
      })
    );
    await user.type(screen.getByRole('textbox', { name: '속성 검색' }), '선');
    await user.clear(screen.getByRole('textbox', { name: '속성 검색' }));
    await waitFor(() => expect(screen.getByRole('button', { name: '다음' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: '다음' }));
    await screen.findByText('21개 · 2페이지');
    await user.type(screen.getByRole('textbox', { name: '속성 검색' }), '선물');
    await screen.findByText('1개 · 1페이지');
    expect(screen.getByRole('button', { name: '이전' })).toBeDisabled();
  });
  it('서버가 비어 있으면 샘플 없이 빈 화면을 표시한다', async () => {
    attributes = [];
    mappings = [];
    render(<AlcoholAttributeVariantA />);
    await screen.findByText('등록된 속성이 없습니다.');
    expect(screen.queryByText('선물용')).not.toBeInTheDocument();
    expect(screen.queryByText(/모의 데이터/)).not.toBeInTheDocument();
  });
  it('저장 실패 시 비교 창과 입력을 유지하고 오류를 표시한다', async () => {
    const user = await renderPage();
    server.use(
      http.put(`${base}/101`, () =>
        HttpResponse.json(
          {
            success: false,
            code: 409,
            errors: [{ code: 'DUPLICATE', message: '이미 사용 중인 이름입니다.' }],
          },
          { status: 409 }
        )
      )
    );
    const input = screen.getByRole('textbox', { name: /속성 이름/ });
    await user.clear(input);
    await user.type(input, '실패한 수정');
    await user.click(screen.getByRole('button', { name: '변경 내용 확인' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '변경 저장' }));
    await within(screen.getByRole('dialog')).findByText('이미 사용 중인 이름입니다.');
    expect(input).toHaveValue('실패한 수정');
    expect(attributes[0]?.displayName).toBe('선물용');
  });
  it('비교 후 취소하면 원본을 유지하고 확정하면 변경과 기존 연결을 반영한다', async () => {
    const user = await renderPage();
    const input = screen.getByRole('textbox', { name: /속성 이름/ });
    await user.clear(input);
    await user.type(input, '선물 추천');
    await user.click(screen.getByRole('button', { name: '변경 내용 확인' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('변경 전')).toBeInTheDocument();
    expect(within(dialog).getByText('변경 후')).toBeInTheDocument();
    expect(within(dialog).getByText('선물용')).toBeInTheDocument();
    expect(within(dialog).getByText('선물 추천')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: '다시 편집' }));
    expect(screen.getByRole('heading', { name: '선물용' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '변경 내용 확인' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '변경 저장' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(screen.getByRole('tab', { name: '관계 그래프' }));
    await user.click(screen.getByText('노드 목록으로 탐색'));
    await user.click(screen.getByRole('button', { name: '속성: 선물 추천 · gift' }));
    const details = screen.getByRole('complementary', { name: '그래프 상세' });
    expect(within(details).getByText('선물 추천')).toBeInTheDocument();
    expect(within(details).getByText('맥캘란 12년 더블 캐스크')).toBeInTheDocument();
  });

  it('연결 해제 결과를 그래프에 반영하며 그래프에서는 변경 동작을 제공하지 않는다', async () => {
    const user = await renderPage();
    const panel = screen.getByRole('complementary', { name: '속성 상세 패널' });
    const unlink = (await within(panel).findAllByRole('button', { name: /연결 해제/ }))[0]!;
    const name = unlink.getAttribute('aria-label')!.replace(' 연결 해제', '');
    await user.click(unlink);
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '연결 해제' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(screen.getByRole('tab', { name: '관계 그래프' }));
    await user.click(screen.getByText('노드 목록으로 탐색'));
    await user.click(screen.getByRole('button', { name: '속성: 선물용 · gift' }));
    expect(
      within(screen.getByRole('complementary', { name: '그래프 상세' })).queryByText(name)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /연결 해제|연결 적용|삭제/ })
    ).not.toBeInTheDocument();
  });

  it('새 연결을 확정하면 그래프에서 양방향으로 조회한다', async () => {
    const user = await renderPage();
    await user.click(screen.getByRole('tab', { name: '속성 연결' }));
    await user.click(screen.getByRole('checkbox', { name: '히비키 재패니즈 하모니 선택' }));
    await user.click(screen.getByRole('checkbox', { name: /겨울 추천 후보/ }));
    await user.click(screen.getByRole('button', { name: '1쌍 연결 검토' }));
    await user.type(within(screen.getByRole('dialog')).getByRole('textbox'), 'winter');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '연결 적용' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(screen.getByRole('tab', { name: '관계 그래프' }));
    await user.click(screen.getByText('노드 목록으로 탐색'));
    await user.click(screen.getByRole('button', { name: '속성: 겨울 추천 후보 · winter' }));
    const details = screen.getByRole('complementary', { name: '그래프 상세' });
    await user.click(within(details).getByRole('button', { name: '히비키 재패니즈 하모니' }));
    expect(within(details).getByRole('button', { name: '겨울 추천 후보' })).toBeInTheDocument();
  });

  it('키보드로 속성 그룹과 관계 그래프 탭까지 이동하고 매핑이 없는 노드는 제외한다', async () => {
    const user = await renderPage();
    screen.getByRole('tab', { name: '속성관리' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: '속성 그룹' })).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByRole('heading', { name: '바텐더 노트' })).toBeInTheDocument();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(screen.getByRole('tab', { name: '관계 그래프' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await user.click(screen.getByText('노드 목록으로 탐색'));
    expect(
      screen.queryByRole('button', { name: '속성: 겨울 추천 후보 · winter' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '위스키: 히비키 재패니즈 하모니' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '속성: 선물용 · gift' })).toBeInTheDocument();
  });
});

it('연결 여부와 여러 속성으로 검색할 때 페이지를 초기화하고 선택한 위스키를 유지한다', async () => {
  const requests: URLSearchParams[] = [];
  const posts: Record<string, unknown>[] = [];
  const items = alcohols.slice(0, 2).map((a) => ({
    alcoholId: a.id,
    korName: a.name,
    engName: a.english,
    korCategory: a.category,
    imageUrl: null,
    attributes: [],
  }));
  server.use(
    http.get(`${base}/alcohols`, ({ request }) => {
      const params = new URL(request.url).searchParams;
      if (params.get('size') === '20') requests.push(params);
      return HttpResponse.json({
        ...wrap(items),
        meta: {
          page: Number(params.get('page') ?? 0),
          size: 20,
          totalElements: 21,
          totalPages: 2,
          hasNext: Number(params.get('page') ?? 0) === 0,
        },
      });
    }),
    http.post(`${base}/alcohols/search`, async ({ request }) => {
      posts.push((await request.json()) as Record<string, unknown>);
      return HttpResponse.json({
        ...wrap(items.slice(0, 1)),
        meta: { page: 0, size: 20, totalElements: 1, totalPages: 1, hasNext: false },
      });
    })
  );
  const user = await renderPage();
  await user.click(screen.getByRole('tab', { name: '속성 연결' }));
  await user.click(screen.getByRole('checkbox', { name: `${alcohols[0]!.name} 선택` }));
  await user.click(screen.getByRole('checkbox', { name: '연결된 것만 보기' }));
  await waitFor(() => expect(requests[requests.length - 1]?.get('page')).toBe('0'));
  await user.click(screen.getByRole('button', { name: '다음' }));
  await waitFor(() => expect(requests[requests.length - 1]?.get('page')).toBe('1'));
  await user.click(screen.getByRole('button', { name: '속성 선택' }));
  await user.click(await screen.findByRole('checkbox', { name: '검색 속성 선물용' }));
  await user.keyboard('{Escape}');
  await user.click(screen.getByRole('button', { name: '검색 적용' }));
  await waitFor(() =>
    expect(posts[posts.length - 1]).toMatchObject({
      conditions: [{ key: 'gift', operator: 'EXISTS' }],
      page: 0,
      linkedOnly: true,
    })
  );
  await waitFor(() =>
    expect(
      screen.queryByRole('checkbox', { name: `${alcohols[1]!.name} 선택` })
    ).not.toBeInTheDocument()
  );
  expect(screen.getByRole('checkbox', { name: `${alcohols[0]!.name} 선택` })).toBeChecked();
  await user.type(screen.getByRole('textbox', { name: '위스키 검색' }), '맥');
  await waitFor(() =>
    expect(posts[posts.length - 1]).toMatchObject({
      keyword: '맥',
      conditions: [{ key: 'gift', operator: 'EXISTS' }],
      page: 0,
    })
  );
  await user.click(screen.getByRole('button', { name: '필터 초기화' }));
  expect(screen.getByRole('checkbox', { name: '연결된 것만 보기' })).not.toBeChecked();
  expect(screen.queryByRole('combobox', { name: '조건 1 연산자' })).not.toBeInTheDocument();
  expect(
    await screen.findByRole('checkbox', { name: `${alcohols[1]!.name} 선택` })
  ).toBeInTheDocument();
});

it('분류와 숫자 비교 및 제외 조건을 전송하고 값 누락과 문자열 숫자 비교를 막는다', async () => {
  const posts: Record<string, unknown>[] = [];
  server.use(
    http.post(`${base}/alcohols/search`, async ({ request }) => {
      posts.push((await request.json()) as Record<string, unknown>);
      return HttpResponse.json(wrap([]));
    })
  );
  const user = await renderPage();
  await user.click(screen.getByRole('tab', { name: '속성 연결' }));
  await user.selectOptions(screen.getByRole('combobox', { name: '분류 필터' }), 'PRICE');
  await user.click(screen.getByRole('button', { name: '속성 선택' }));
  await user.click(await screen.findByRole('checkbox', { name: '검색 속성 10만 원 이상' }));
  await user.click(screen.getByRole('checkbox', { name: '검색 속성 선물용' }));
  await user.keyboard('{Escape}');
  await user.selectOptions(screen.getByRole('combobox', { name: '조건 1 연산자' }), 'GTE');
  await user.click(screen.getByRole('button', { name: '검색 적용' }));
  expect(posts).toHaveLength(0);
  expect(screen.getByRole('alert')).toBeInTheDocument();
  await user.type(screen.getByRole('textbox', { name: '조건 1 값' }), '50000');
  await user.selectOptions(screen.getByRole('combobox', { name: '조건 2 연산자' }), 'NOT_EXISTS');
  await user.click(screen.getByRole('button', { name: '검색 적용' }));
  const price = initialAttributes.find((a) => a.datatype === 'INT')!;
  await waitFor(() =>
    expect(posts[posts.length - 1]).toMatchObject({
      type: 'PRICE',
      conditions: [
        { key: price.key, operator: 'GTE', value: '50000' },
        { key: 'gift', operator: 'NOT_EXISTS' },
      ],
      page: 0,
    })
  );
  await user.clear(screen.getByRole('textbox', { name: '조건 1 값' }));
  const count = posts.length;
  await user.click(screen.getByRole('button', { name: '검색 적용' }));
  expect(posts).toHaveLength(count);
  expect(
    within(screen.getByRole('combobox', { name: '조건 2 연산자' })).queryByRole('option', {
      name: /이상/,
    })
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '필터 초기화' }));
  expect(screen.getByRole('combobox', { name: '분류 필터' })).toHaveValue('ALL');
  expect(screen.queryByRole('combobox', { name: '조건 1 연산자' })).not.toBeInTheDocument();
  expect(screen.getByRole('checkbox', { name: '연결된 것만 보기' })).not.toBeChecked();
});

function SearchHistory({ target }: { target: string }) {
  const navigate = useNavigate();
  return (
    <>
      <button onClick={() => void navigate(target)}>저장된 검색 열기</button>
      <button onClick={() => void navigate(-1)}>이전 검색</button>
    </>
  );
}

it.each(['graph', 'mappings'])('%s 검색 URL을 복원하고 이전 조건으로 돌아간다', async (tab) => {
  const prefix = tab === 'graph' ? 'graph' : '';
  const params = new URLSearchParams({
    tab,
    [`${prefix}conditions`]: JSON.stringify([{ key: 'gift', operator: 'NOT_EXISTS' }]),
    [`${prefix}match`]: 'OR',
  });
  const posts: Record<string, unknown>[] = [];
  server.use(
    http.post(`${base}/alcohols/search`, async ({ request }) => {
      posts.push((await request.json()) as Record<string, unknown>);
      return HttpResponse.json(wrap([]));
    })
  );
  const user = userEvent.setup();
  render(
    <>
      <SearchHistory target={`?${params}`} />
      <AlcoholAttributeVariantA />
    </>
  );
  await user.click(screen.getByRole('button', { name: '저장된 검색 열기' }));
  if (tab === 'graph') await user.click(screen.getByRole('button', { name: /^필터 편집/ }));
  await waitFor(() =>
    expect(posts[posts.length - 1]).toMatchObject({
      match: 'OR',
      conditions: [{ key: 'gift', operator: 'NOT_EXISTS' }],
    })
  );
  await waitFor(() =>
    expect(screen.getByRole('combobox', { name: '조건 1 연산자' })).not.toBeDisabled()
  );
  expect(screen.getByRole('combobox', { name: '조건 1 연산자' })).toHaveValue('NOT_EXISTS');
  await user.selectOptions(screen.getByRole('combobox', { name: '조건 결합 방식' }), 'AND');
  await user.click(screen.getByRole('button', { name: '검색 적용' }));
  await waitFor(() => expect(posts[posts.length - 1]?.match).toBe('AND'));
  await user.click(screen.getByRole('button', { name: '이전 검색' }));
  await waitFor(() =>
    expect(screen.getByRole('combobox', { name: '조건 결합 방식' })).toHaveValue('OR')
  );
});

it.each(['graph', 'mappings'])(
  '%s 검색 URL이 손상되면 검색을 전송하지 않고 복구를 안내한다',
  async (tab) => {
    const prefix = tab === 'graph' ? 'graph' : '';
    const post = vi.fn();
    server.use(
      http.post(`${base}/alcohols/search`, () => {
        post();
        return HttpResponse.json(wrap([]));
      })
    );
    const user = userEvent.setup();
    render(
      <>
        <SearchHistory target={`?tab=${tab}&${prefix}conditions=invalid`} />
        <AlcoholAttributeVariantA />
      </>
    );
    await user.click(screen.getByRole('button', { name: '저장된 검색 열기' }));
    expect(
      await screen.findByText('검색 조건 URL이 올바르지 않습니다. 조건을 초기화해 주세요.')
    ).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '조건 초기화' }));
    if (tab === 'graph')
      await screen.findByRole('button', { name: `위스키: ${alcohols[0]!.name}` });
    else await waitFor(() => expect(post).toHaveBeenCalledOnce());
    expect(
      screen.queryByText('검색 조건 URL이 올바르지 않습니다. 조건을 초기화해 주세요.')
    ).not.toBeInTheDocument();
  }
);

it('그래프 조건 초기화는 최초의 연결된 위스키 조회로 돌아간다', async () => {
  const post = vi.fn();
  server.use(
    http.post(`${base}/alcohols/search`, () => {
      post();
      return HttpResponse.json(wrap([]));
    })
  );
  const user = await renderPage();
  await user.click(screen.getByRole('tab', { name: '관계 그래프' }));
  await user.click(screen.getByRole('button', { name: /^필터 편집/ }));
  await screen.findByRole('button', { name: `위스키: ${alcohols[0]!.name}` });
  await user.click(screen.getByRole('button', { name: /^속성 선택/ }));
  await user.click(await screen.findByRole('checkbox', { name: '검색 속성 선물용' }));
  await user.keyboard('{Escape}');
  expect(screen.getByText('변경한 조건을 아직 적용하지 않았습니다.')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '검색 적용' }));
  await waitFor(() => expect(post).toHaveBeenCalledOnce());
  expect(screen.queryByText('변경한 조건을 아직 적용하지 않았습니다.')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '조건 초기화' }));
  await screen.findByRole('button', { name: `위스키: ${alcohols[0]!.name}` });
  expect(post).toHaveBeenCalledOnce();
});

it('복합 조건의 빈 결과는 등록된 데이터가 없다고 안내하지 않는다', async () => {
  server.use(http.post(`${base}/alcohols/search`, () => HttpResponse.json(wrap([]))));
  const user = await renderPage();
  await user.click(screen.getByRole('tab', { name: '속성 연결' }));
  await user.click(screen.getByRole('button', { name: /^속성 선택/ }));
  await user.click(await screen.findByRole('checkbox', { name: '검색 속성 선물용' }));
  await user.keyboard('{Escape}');
  await user.click(screen.getByRole('button', { name: '검색 적용' }));
  expect(await screen.findByText('검색 조건에 맞는 항목이 없습니다.')).toBeInTheDocument();
  expect(screen.queryByText('등록된 위스키가 없습니다.')).not.toBeInTheDocument();
});

it('전체화면에서도 속성 선택 팝오버는 전체화면 요소 안에 표시한다', async () => {
  const user = await renderPage();
  await user.click(screen.getByRole('tab', { name: '관계 그래프' }));
  await user.click(screen.getByRole('button', { name: /^필터 편집/ }));
  const button = screen.getByRole('button', { name: '전체화면' });
  const panel = button.closest('.grid')!;
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: panel });
  try {
    await user.click(screen.getByRole('button', { name: /^속성 선택/ }));
    const dialog = await screen.findByRole('dialog');
    expect(panel.contains(dialog)).toBe(true);
  } finally {
    Reflect.deleteProperty(document, 'fullscreenElement');
  }
});

it('연결 목록과 그래프에서 여러 그룹을 반복 쿼리와 복합 검색 배열로 보낸다', async () => {
  const reads: URLSearchParams[] = [];
  const posts: Record<string, unknown>[] = [];
  server.use(
    http.get('/admin/api/v1/alcohols/attribute-groups', () =>
      HttpResponse.json(
        wrap([
          { id: 1, name: '바텐더 노트', description: null, displayOrder: 0 },
          { id: 2, name: '시음 기록', description: null, displayOrder: 1 },
        ])
      )
    ),
    http.get(`${base}/alcohols`, ({ request }) => {
      reads.push(new URL(request.url).searchParams);
      return HttpResponse.json(wrap([]));
    }),
    http.post(`${base}/alcohols/search`, async ({ request }) => {
      posts.push((await request.json()) as Record<string, unknown>);
      return HttpResponse.json(wrap([]));
    })
  );
  const user = await renderPage();
  await user.click(screen.getByRole('tab', { name: '속성 연결' }));
  await user.click(await screen.findByRole('checkbox', { name: '검색 그룹 바텐더 노트' }));
  await user.click(screen.getByRole('checkbox', { name: '검색 그룹 시음 기록' }));
  await waitFor(() => expect(reads[reads.length - 1]?.getAll('groupIds')).toEqual(['1', '2']));
  // 빈 조건 적용으로도 복합 검색 경로를 사용하며 그룹 필터는 유지한다.
  await user.click(screen.getByRole('button', { name: '검색 적용' }));
  await waitFor(() => expect(posts[posts.length - 1]?.groupIds).toEqual([1, 2]));
  await user.click(screen.getByRole('tab', { name: '관계 그래프' }));
  await user.click(screen.getByRole('button', { name: /^필터 편집/ }));
  await user.click(await screen.findByRole('checkbox', { name: '그래프 검색 그룹 바텐더 노트' }));
  await user.click(screen.getByRole('checkbox', { name: '그래프 검색 그룹 시음 기록' }));
  await waitFor(() => expect(reads[reads.length - 1]?.getAll('groupIds')).toEqual(['1', '2']));
});
