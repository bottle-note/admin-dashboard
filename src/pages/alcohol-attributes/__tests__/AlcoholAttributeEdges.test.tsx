import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { GraphData } from '@antv/g6';
import { render } from '@/test/test-utils';
import { server } from '@/test/mocks/server';
import { AlcoholAttributeVariantA } from '../variants/a/AlcoholAttributeVariantA';
import { MappingValueEditor } from '../variants/a/MappingValueEditor';
import { AttributeEditor } from '../variants/a/AttributeEditor';
import { AttributeRelationshipGraph } from '../variants/a/AttributeRelationshipGraph';
import { displayValue, type Attribute } from '../variants/a/attribute-model';
import { initialAttributes, alcohols } from '../variants/a/mock-data';

// Inspect the actual canvas input without requiring a browser or a rendering engine.
const canvas = vi.hoisted(() => ({ data: null as GraphData | null }));
vi.mock('../variants/a/RelationshipCanvas', () => ({
  RelationshipCanvas: ({ data }: { data: GraphData }) => {
    canvas.data = data;
    return null;
  },
}));

const base = '/admin/api/v1/alcohols/attributes';
const wrap = (data: unknown, page = 0, hasNext = false) => ({
  success: true,
  data,
  meta: {
    page,
    size: 20,
    totalElements: hasNext || page > 0 ? 2 : Array.isArray(data) ? data.length : 0,
    totalPages: hasNext || page > 0 ? 2 : 1,
    hasNext,
  },
});
let attributes: Attribute[];
let mappings: { id: number; alcoholId: number; attributeId: number; value: string }[];

beforeEach(() => {
  attributes = structuredClone(initialAttributes.slice(0, 3));
  mappings = [
    { id: 1, alcoholId: alcohols[0]!.id, attributeId: 101, value: 'smoky' },
    { id: 2, alcoholId: alcohols[1]!.id, attributeId: 101, value: 'smoky' },
    { id: 3, alcoholId: alcohols[1]!.id, attributeId: 103, value: 'smoky' },
  ];
  canvas.data = null;
  server.use(
    http.get(base, ({ request }) => {
      const keyword = new URL(request.url).searchParams.get('keyword') ?? '';
      return HttpResponse.json(wrap(attributes.filter((a) => a.displayName.includes(keyword))));
    }),
    http.get(`${base}/mappings`, () => HttpResponse.json(wrap(mappings))),
    http.get(`${base}/alcohols`, () =>
      HttpResponse.json(
        wrap(
          alcohols.slice(0, 2).map((a) => ({
            alcoholId: a.id,
            korName: a.name,
            engName: a.english,
            korCategory: a.category,
            imageUrl: null,
            attributes: attributes.filter((t) =>
              mappings.some((m) => m.alcoholId === a.id && m.attributeId === t.id)
            ),
          }))
        )
      )
    ),
    http.get('/admin/api/v1/alcohols/lookup', ({ request }) => {
      const page = Number(new URL(request.url).searchParams.get('page') ?? 0);
      const a = alcohols[page]!;
      return HttpResponse.json(
        wrap(
          [{ alcoholId: a.id, korName: a.name, engName: a.english, imageUrl: null }],
          page,
          page === 0
        )
      );
    })
  );
});

async function renderPage() {
  render(<AlcoholAttributeVariantA />);
  await screen.findByRole('textbox', { name: /속성 이름/ });
  return userEvent.setup();
}

describe('속성 입력 경계값', () => {
  it.each([
    ['INT', '1234567890123456789', '18자리 이내 정수를 입력하세요.'],
    ['INT', '1.1', '18자리 이내 정수를 입력하세요.'],
    ['INT', '1e3', '18자리 이내 정수를 입력하세요.'],
    ['DOUBLE', '1234567890123456', '정수부 15자리, 소수점 6자리 이내로 입력하세요.'],
    ['DOUBLE', '1.1234567', '정수부 15자리, 소수점 6자리 이내로 입력하세요.'],
    ['DOUBLE', 'Infinity', '정수부 15자리, 소수점 6자리 이내로 입력하세요.'],
    ['BOOLEAN', 'TRUE', 'true 또는 false를 입력하세요.'],
  ] as const)('%s 값 %s를 검토 전에 거절한다', async (datatype, value, message) => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <MappingValueEditor
        attribute={{ ...initialAttributes[0]!, datatype }}
        mapping={{ id: 1, alcoholId: 1, attributeId: 101, value: 'original' }}
        onSave={onSave}
      />
    );
    const input = screen.getByRole('textbox', { name: /값$/ });
    await user.clear(input);
    await user.type(input, value);
    await user.click(screen.getByRole('button', { name: '값 저장' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it.each([
    ['INT', '-123456789012345678'],
    ['DOUBLE', '-123456789012345.123456'],
    ['BOOLEAN', 'false'],
  ] as const)('%s 경계값 %s를 원문 그대로 저장한다', async (datatype, value) => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <MappingValueEditor
        attribute={{ ...initialAttributes[0]!, datatype }}
        mapping={{ id: 1, alcoholId: 1, attributeId: 101, value: 'original' }}
        onSave={onSave}
      />
    );
    const input = screen.getByRole('textbox', { name: /값$/ });
    await user.clear(input);
    await user.type(input, value);
    await user.click(screen.getByRole('button', { name: '값 저장' }));
    expect(onSave).toHaveBeenCalledWith(value);
  });

  it('숫자 표시에서 18자리 정수와 소수 여섯 자리를 보존한다', () => {
    expect(displayValue({ ...initialAttributes[0]!, datatype: 'INT' }, '9007199254740993')).toBe(
      '9,007,199,254,740,993'
    );
    expect(displayValue({ ...initialAttributes[0]!, datatype: 'DOUBLE' }, '1.123456')).toBe(
      '1.123456'
    );
  });

  it('연결이 있는 속성의 자료형 변경을 막는다', async () => {
    const user = userEvent.setup();
    render(
      <AttributeEditor
        attribute={initialAttributes[2]!}
        linkedCount={1}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    await user.selectOptions(screen.getByRole('combobox', { name: '값 형식' }), 'STRING');
    expect(screen.getByRole('combobox', { name: '값 형식' })).toHaveValue('INT');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('선택과 비동기 작업', () => {
  it('속성 저장 중 중복 저장을 막고 실패 뒤 같은 입력으로 다시 저장한다', async () => {
    const user = userEvent.setup();
    let release!: (error: string) => void;
    const gate = new Promise<string>((resolve) => {
      release = resolve;
    });
    const onSave = vi.fn().mockReturnValueOnce(gate).mockResolvedValueOnce(undefined);
    render(
      <AttributeEditor
        attribute={initialAttributes[0]!}
        linkedCount={2}
        onSave={onSave}
        onCancel={vi.fn()}
      />
    );
    const name = screen.getByRole('textbox', { name: /속성 이름/ });
    await user.clear(name);
    await user.type(name, '재시도할 이름');
    await user.click(screen.getByRole('button', { name: '변경 내용 확인' }));
    const dialog = within(screen.getByRole('dialog'));
    const save = dialog.getByRole('button', { name: '변경 저장' });
    await user.click(save);
    try {
      expect(save).toBeDisabled();
      expect(dialog.getByRole('button', { name: '다시 편집' })).toBeDisabled();
      await user.click(save);
      expect(onSave).toHaveBeenCalledTimes(1);
    } finally {
      release('저장 실패');
    }
    expect(await dialog.findByRole('alert')).toHaveTextContent('저장 실패');
    expect(name).toHaveValue('재시도할 이름');
    await user.click(save);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(onSave).toHaveBeenCalledTimes(2);
    expect(onSave).toHaveBeenLastCalledWith(
      expect.objectContaining({ displayName: '재시도할 이름' })
    );
  });

  it('다른 페이지 선택을 보존하고 현재 페이지 전체 해제는 현재 페이지만 바꾼다', async () => {
    const user = await renderPage();
    const request = vi
      .fn()
      .mockReturnValue(HttpResponse.json(wrap({ added: 1, skipped: 0, createdIds: [9] })));
    server.use(
      http.post(`${base}/mappings/batch`, async ({ request: req }) => request(await req.json()))
    );
    await user.click(screen.getByRole('tab', { name: '속성 연결' }));
    await user.click(await screen.findByRole('checkbox', { name: `${alcohols[0]!.name} 선택` }));
    await user.click(screen.getByRole('button', { name: '다음' }));
    await screen.findByRole('checkbox', { name: `${alcohols[1]!.name} 선택` });
    await user.click(await screen.findByRole('checkbox', { name: '현재 목록 전체 선택' }));
    await user.click(screen.getByRole('checkbox', { name: '현재 목록 전체 선택' }));
    await user.click(screen.getByRole('checkbox', { name: /스모키/ }));
    await user.click(screen.getByRole('button', { name: '1쌍 연결 검토' }));
    await user.type(within(screen.getByRole('dialog')).getByRole('textbox'), 'smoky');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '연결 적용' }));
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith({
        items: [{ alcoholId: alcohols[0]!.id, attributeId: 102, value: 'smoky' }],
      })
    );
  });

  it('연결 검토에서 페이지 밖에 보존된 선택 위스키의 이름과 ID를 확인한다', async () => {
    const user = await renderPage();
    await user.click(screen.getByRole('tab', { name: '속성 연결' }));
    await user.click(await screen.findByRole('checkbox', { name: `${alcohols[0]!.name} 선택` }));
    await user.click(screen.getByRole('button', { name: '다음' }));
    await screen.findByRole('checkbox', { name: `${alcohols[1]!.name} 선택` });
    await user.click(screen.getByRole('checkbox', { name: /스모키/ }));
    await user.click(screen.getByRole('button', { name: '1쌍 연결 검토' }));
    await user.type(within(screen.getByRole('dialog')).getByRole('textbox'), 'smoky');
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByText(alcohols[0]!.name)).toBeInTheDocument();
    expect(dialog.getByText(`#${alcohols[0]!.id}`)).toBeInTheDocument();
  });

  it('연결 요청 중 중복 제출을 막고 실패 뒤 선택과 검토를 유지해 재시도한다', async () => {
    const user = await renderPage();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let requests = 0;
    server.use(
      http.post(`${base}/mappings/batch`, async () => {
        requests += 1;
        if (requests === 1) {
          await gate;
          return HttpResponse.json(
            { success: false, errors: [{ message: '연결 저장 실패' }] },
            { status: 500 }
          );
        }
        return HttpResponse.json(wrap({ added: 1, skipped: 0, createdIds: [9] }));
      })
    );
    await user.click(screen.getByRole('tab', { name: '속성 연결' }));
    await user.click(await screen.findByRole('checkbox', { name: `${alcohols[0]!.name} 선택` }));
    await user.click(screen.getByRole('checkbox', { name: /스모키/ }));
    await user.click(screen.getByRole('button', { name: '1쌍 연결 검토' }));
    await user.type(within(screen.getByRole('dialog')).getByRole('textbox'), 'smoky');
    const dialog = within(screen.getByRole('dialog'));
    const apply = dialog.getByRole('button', { name: '연결 적용' });
    await user.click(apply);
    await waitFor(() => expect(requests).toBe(1));
    try {
      expect(apply).toBeDisabled();
      expect(dialog.getByRole('button', { name: '취소' })).toBeDisabled();
      await user.click(apply);
      expect(requests).toBe(1);
    } finally {
      release();
    }
    expect(await dialog.findByRole('alert')).toHaveTextContent('연결 저장 실패');
    expect(apply).toBeEnabled();
    await user.click(apply);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(requests).toBe(2);
  });

  it('최초 조회 중 빈 목록 대신 로딩을 표시하고 실패하면 다시 조회한다', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let failed = true;
    server.use(
      http.get(`${base}/mappings`, async () => {
        if (failed) {
          await gate;
          return HttpResponse.json(
            { success: false, errors: [{ message: '관계 조회 실패' }] },
            { status: 500 }
          );
        }
        return HttpResponse.json(wrap(mappings));
      })
    );
    const user = userEvent.setup();
    render(<AlcoholAttributeVariantA />);
    try {
      expect(screen.getByText('서버 데이터를 불러오는 중입니다.')).toBeInTheDocument();
      expect(screen.queryByText('등록된 속성이 없습니다.')).not.toBeInTheDocument();
    } finally {
      release();
    }
    expect(await screen.findByRole('alert')).toHaveTextContent('관계 조회 실패');
    failed = false;
    await user.click(screen.getByRole('button', { name: '다시 조회' }));
    expect(await screen.findByRole('textbox', { name: /속성 이름/ })).toHaveValue('선물용');
  });
});

describe('그래프 관계 데이터', () => {
  const graphAlcohols = () => alcohols.slice(0, 2);
  const nodeIds = () => canvas.data?.nodes?.map((node) => node.id);

  it('전체 그래프에서 연결되지 않은 노드를 제외하고 모든 간선의 양 끝을 제공한다', async () => {
    const user = userEvent.setup();
    render(
      <AttributeRelationshipGraph
        attributes={attributes}
        alcohols={graphAlcohols()}
        mappings={mappings}
      />
    );
    await user.click(screen.getByRole('button', { name: '전체 보기' }));
    expect(canvas.data?.nodes?.some((n) => n.style?.labelText?.toString().includes('스모키'))).toBe(
      false
    );
    expect(canvas.data?.edges).toHaveLength(3);
    for (const edge of canvas.data?.edges ?? []) {
      expect(nodeIds()).toContain(edge.source);
      expect(nodeIds()).toContain(edge.target);
    }
  });

  it('위스키 상세에서 속성을 따라가면 그 속성에 연결된 다른 위스키도 그래프에 표시한다', async () => {
    const user = userEvent.setup();
    render(
      <AttributeRelationshipGraph
        attributes={attributes}
        alcohols={graphAlcohols()}
        mappings={mappings}
      />
    );
    await user.click(screen.getByText('노드 목록으로 탐색'));
    await user.click(screen.getByRole('button', { name: `위스키: ${alcohols[0]!.name}` }));
    const details = within(screen.getByRole('complementary', { name: '그래프 상세' }));
    await user.click(details.getByRole('button', { name: '선물용' }));
    expect(details.getByRole('button', { name: alcohols[1]!.name })).toBeInTheDocument();
    expect(nodeIds()).toContain(`alcohol-${alcohols[1]!.id}`);
  });

  it('중심 위스키의 마지막 연결이 사라지면 남아 있는 관계를 계속 표시한다', () => {
    const { rerender } = render(
      <AttributeRelationshipGraph
        attributes={attributes}
        alcohols={graphAlcohols()}
        mappings={mappings}
      />
    );
    const remaining = mappings.filter((m) => m.alcoholId !== alcohols[0]!.id);
    rerender(
      <AttributeRelationshipGraph
        attributes={attributes}
        alcohols={graphAlcohols()}
        mappings={remaining}
      />
    );
    expect(screen.queryByText('표시할 연결이 없습니다.')).not.toBeInTheDocument();
    expect(nodeIds()).toContain(`alcohol-${alcohols[1]!.id}`);
  });
});

describe('값 기준 그래프와 전체 대상 필터', () => {
  it('같은 속성과 값만 공유하고 노드 선택으로 표시 범위를 바꾸지 않는다', async () => {
    const user = userEvent.setup();
    const price = { ...initialAttributes[2]!, displayName: '병 참고 가격' };
    render(
      <AttributeRelationshipGraph
        attributes={[price, { ...price, id: 104, displayName: '잔 가격' }]}
        alcohols={alcohols.slice(0, 3)}
        mappings={[
          { id: 1, alcoholId: alcohols[0]!.id, attributeId: price.id, value: '33000' },
          { id: 2, alcoholId: alcohols[1]!.id, attributeId: price.id, value: '33000' },
          { id: 3, alcoholId: alcohols[2]!.id, attributeId: price.id, value: '55000' },
          { id: 4, alcoholId: alcohols[2]!.id, attributeId: 104, value: '33000' },
        ]}
      />
    );
    expect(screen.queryByRole('combobox', { name: '중심 위스키' })).not.toBeInTheDocument();
    const edges = canvas.data!.edges!;
    expect(edges[0]!.target).toBe(edges[1]!.target);
    expect(edges[0]!.target).not.toBe(edges[2]!.target);
    expect(edges[0]!.target).not.toBe(edges[3]!.target);
    expect(canvas.data!.nodes!.filter((n) => n.type === 'image')).toHaveLength(3);
    await user.click(screen.getByText('노드 목록으로 탐색'));
    await user.click(screen.getByRole('button', { name: '속성: 병 참고 가격 · 33,000 원' }));
    const panel = within(screen.getByRole('complementary', { name: '그래프 상세' }));
    expect(panel.getByRole('button', { name: alcohols[0]!.name })).toBeInTheDocument();
    expect(panel.queryByRole('button', { name: alcohols[2]!.name })).not.toBeInTheDocument();
    expect(canvas.data!.edges).toHaveLength(4);
    expect(screen.getByRole('button', { name: '속성: 병 참고 가격 · 33,000 원' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await user.click(screen.getByRole('button', { name: '속성: 병 참고 가격 · 55,000 원' }));
    expect(screen.getByRole('button', { name: '속성: 병 참고 가격 · 33,000 원' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(screen.getByRole('button', { name: '속성: 병 참고 가격 · 55,000 원' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('샘플 밖의 술도 전체에서 검색하고 필터 초기화 시 샘플로 복귀한다', async () => {
    const user = userEvent.setup();
    const many = Array.from({ length: 1000 }, (_, i) => ({
      ...alcohols[0]!,
      id: i + 1,
      name: `제품 ${i + 1}`,
      english: '',
    }));
    render(
      <AttributeRelationshipGraph
        attributes={[initialAttributes[0]!]}
        alcohols={many}
        mappings={many.map((a) => ({
          id: a.id,
          alcoholId: a.id,
          attributeId: 101,
          value: String(a.id),
        }))}
      />
    );
    expect(canvas.data!.nodes!.filter((n) => n.type === 'image')).toHaveLength(100);
    const absent = many.find((a) => !canvas.data!.nodes!.some((n) => n.id === `alcohol-${a.id}`))!;
    await user.type(screen.getByRole('textbox', { name: '그래프 검색' }), absent.name);
    await user.type(screen.getByRole('textbox', { name: '속성 값 필터' }), String(absent.id));
    expect(canvas.data!.nodes!.some((n) => n.id === `alcohol-${absent.id}`)).toBe(true);
    await user.selectOptions(screen.getByRole('combobox', { name: '그래프 속성 필터' }), '101');
    await user.click(screen.getByRole('button', { name: '전체 보기' }));
    expect(screen.getByRole('textbox', { name: '그래프 검색' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: '속성 값 필터' })).toHaveValue('');
    expect(canvas.data!.nodes!.filter((n) => n.type === 'image')).toHaveLength(100);
    for (const edge of canvas.data!.edges!) {
      expect(canvas.data!.nodes!.some((n) => n.id === edge.source)).toBe(true);
      expect(canvas.data!.nodes!.some((n) => n.id === edge.target)).toBe(true);
    }
  });
});

it('연결이 많은 경우에도 500개만 표시하고 속성 필터로 전체 연결을 다시 좁힌다', async () => {
  const user = userEvent.setup();
  const definitions = Array.from({ length: 10 }, (_, i) => ({
    ...initialAttributes[0]!,
    id: i + 1,
    displayName: `속성 ${i + 1}`,
  }));
  const products = Array.from({ length: 100 }, (_, i) => ({ ...alcohols[0]!, id: i + 1 }));
  const links = products.flatMap((a) =>
    definitions.map((d) => ({
      id: a.id * 10 + d.id,
      alcoholId: a.id,
      attributeId: d.id,
      value: 'same',
    }))
  );
  render(
    <AttributeRelationshipGraph attributes={definitions} alcohols={products} mappings={links} />
  );
  expect(canvas.data!.edges).toHaveLength(500);
  expect(canvas.data!.nodes!.filter((n) => n.type === 'image')).toHaveLength(100);
  await user.selectOptions(screen.getByRole('combobox', { name: '그래프 속성 필터' }), '10');
  expect(canvas.data!.edges).toHaveLength(100);
  expect(canvas.data!.nodes!.filter((n) => n.type === 'rect')).toHaveLength(1);
  await user.type(screen.getByRole('textbox', { name: '속성 값 필터' }), 'absent');
  expect(screen.getByText('표시할 연결이 없습니다.')).toBeInTheDocument();
});
