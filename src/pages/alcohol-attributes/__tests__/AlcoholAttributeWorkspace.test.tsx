import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within, waitFor } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { http, HttpResponse, delay } from 'msw';
import { server } from '@/test/mocks/server';
import { initialAttributes, initialMappings, alcohols } from '../variants/a/mock-data';
import userEvent from '@testing-library/user-event';

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
    http.get(base, ({ request }) => {
      const q = new URL(request.url).searchParams.get('keyword') ?? '';
      return HttpResponse.json(
        wrap(attributes.filter((a) => `${a.displayName} ${a.key}`.includes(q)))
      );
    }),
    http.get(`${base}/mappings`, () => HttpResponse.json(wrap(mappings))),
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

  it('그래프는 한 페이지 100개만 요청하고 검색은 샘플 밖의 술도 서버에서 찾는다', async () => {
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
    expect(reads[0]!.get('size')).toBe('100');
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

  it('키보드로 세 번째 탭까지 이동하고 매핑이 없는 노드는 제외한다', async () => {
    const user = await renderPage();
    screen.getByRole('tab', { name: '속성관리' }).focus();
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

it('연결 여부와 선택한 속성으로 서버 목록을 검색하고 초기화한다', async () => {
  const requests: URLSearchParams[] = [];
  server.use(
    http.get(`${base}/alcohols`, ({ request }) => {
      const params = new URL(request.url).searchParams;
      if (params.get('size') === '20') requests.push(params);
      const items = (params.get('key') ? alcohols.slice(0, 1) : alcohols.slice(0, 2)).map((a) => ({
        alcoholId: a.id,
        korName: a.name,
        engName: a.english,
        korCategory: a.category,
        imageUrl: null,
        attributes: [],
      }));
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
    })
  );
  const user = await renderPage();
  await user.click(screen.getByRole('tab', { name: '속성 연결' }));
  await user.click(screen.getByRole('checkbox', { name: `${alcohols[0]!.name} 선택` }));
  await user.click(screen.getByRole('checkbox', { name: '연결된 것만 보기' }));
  await waitFor(() => expect(requests[requests.length - 1]?.get('page')).toBe('0'));
  await user.click(screen.getByRole('button', { name: '다음' }));
  await waitFor(() => expect(requests[requests.length - 1]?.get('page')).toBe('1'));
  await user.selectOptions(screen.getByRole('combobox', { name: '연결된 속성 필터' }), 'gift');
  await waitFor(() => expect(requests[requests.length - 1]?.get('key')).toBe('gift'));
  expect(requests[requests.length - 1]?.get('page')).toBe('0');
  expect(screen.getByRole('checkbox', { name: `${alcohols[0]!.name} 선택` })).toBeChecked();
  expect(
    screen.queryByRole('checkbox', { name: `${alcohols[1]!.name} 선택` })
  ).not.toBeInTheDocument();
  await user.type(screen.getByRole('textbox', { name: '위스키 검색' }), '맥');
  await waitFor(() => expect(requests[requests.length - 1]?.get('keyword')).toBe('맥'));
  expect(requests[requests.length - 1]?.get('key')).toBe('gift');
  await user.click(screen.getByRole('button', { name: '필터 초기화' }));
  expect(screen.getByRole('checkbox', { name: '연결된 것만 보기' })).not.toBeChecked();
  expect(screen.getByRole('combobox', { name: '연결된 속성 필터' })).toHaveValue('');
  expect(
    await screen.findByRole('checkbox', { name: `${alcohols[1]!.name} 선택` })
  ).toBeInTheDocument();
  await user.selectOptions(screen.getByRole('combobox', { name: '연결된 속성 필터' }), 'gift');
  expect(screen.getByRole('checkbox', { name: '연결된 것만 보기' })).toBeChecked();
  await user.click(screen.getByRole('checkbox', { name: '연결된 것만 보기' }));
  expect(screen.getByRole('combobox', { name: '연결된 속성 필터' })).toHaveValue('');
});

it('분류·값·비교·제외 속성을 서버 조건으로 전달하고 잘못된 GTE 조합을 막는다', async () => {
  const requests: URLSearchParams[] = [];
  server.use(
    http.get(`${base}/alcohols`, ({ request }) => {
      const params = new URL(request.url).searchParams;
      if (params.get('size') === '20') requests.push(params);
      return HttpResponse.json(wrap([]));
    })
  );
  const user = await renderPage();
  await user.click(screen.getByRole('tab', { name: '속성 연결' }));
  await user.selectOptions(screen.getByRole('combobox', { name: '분류 필터' }), 'PRICE');
  await waitFor(() => expect(requests[requests.length - 1]?.get('type')).toBe('PRICE'));
  const price = initialAttributes.find((a) => a.datatype === 'INT')!;
  await user.selectOptions(screen.getByRole('combobox', { name: '연결된 속성 필터' }), price.key);
  expect(screen.getByRole('option', { name: '이상 (≥)' })).toBeDisabled();
  await user.type(screen.getByRole('textbox', { name: '속성 값 검색' }), '50000');
  await user.selectOptions(screen.getByRole('combobox', { name: '값 비교 조건' }), 'GTE');
  await user.selectOptions(screen.getByRole('combobox', { name: '제외 속성 필터' }), 'gift');
  await waitFor(() => expect(requests[requests.length - 1]?.get('missingKey')).toBe('gift'));
  expect(Object.fromEntries(requests[requests.length - 1]!)).toMatchObject({
    type: 'PRICE',
    key: price.key,
    value: '50000',
    operator: 'GTE',
    missingKey: 'gift',
    page: '0',
  });
  await user.clear(screen.getByRole('textbox', { name: '속성 값 검색' }));
  expect(screen.getByRole('combobox', { name: '값 비교 조건' })).toHaveValue('EQ');
  expect(screen.getByRole('option', { name: '이상 (≥)' })).toBeDisabled();
  await user.selectOptions(screen.getByRole('combobox', { name: '연결된 속성 필터' }), 'gift');
  await user.type(screen.getByRole('textbox', { name: '속성 값 검색' }), 'gift');
  expect(screen.getByRole('option', { name: '이상 (≥)' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: '필터 초기화' }));
  expect(screen.getByRole('combobox', { name: '분류 필터' })).toHaveValue('ALL');
  expect(screen.getByRole('combobox', { name: '제외 속성 필터' })).toHaveValue('');
  expect(screen.getByRole('textbox', { name: '속성 값 검색' })).toHaveValue('');
  expect(screen.getByRole('checkbox', { name: '연결된 것만 보기' })).not.toBeChecked();
});
