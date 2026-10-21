import { it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { render } from '@/test/test-utils';
import { server } from '@/test/mocks/server';
import { AttributeGraphPanel } from '../variants/a/AttributeGraphPanel';
vi.mock('../variants/a/RelationshipCanvas', () => import('@/test/mocks/relationship-canvas'));
const definition = (id: number, key: string, displayName: string) => ({
  id,
  key,
  displayName,
  type: 'FLAG',
  datatype: 'BOOLEAN',
  unit: null,
  description: null,
  groupId: null,
});
const eligible = definition(1, 'eligible', '바 추천 대상 여부');
const beginner = definition(2, 'beginner', '입문 추천 여부');
const price = {
  ...definition(3, 'price', '병 참고 가격'),
  type: 'PRICE',
  datatype: 'INT',
  unit: '원',
};
const wrap = (data: unknown) => ({ success: true, data });
it('노드 선택은 조회만 하고 명시적 좁히기, 후보 추가, 제거, 되돌리기를 전체 검색에 반영한다', async () => {
  const searches: unknown[] = [];
  const facets: unknown[] = [];
  const item = {
    alcoholId: 1,
    korName: '글렌피딕',
    attributes: [{ mappingId: 1, attribute: eligible, value: 'true' }],
  };
  const result = {
    ...wrap([item]),
    meta: { page: 0, size: 25, totalElements: 1, totalPages: 1, hasNext: false },
  };
  server.use(
    http.get('/admin/api/v1/alcohols/attributes', () =>
      HttpResponse.json({ ...wrap([eligible, beginner, price]), meta: { hasNext: false } })
    ),
    http.get('/admin/api/v1/alcohols/attributes/alcohols', () => HttpResponse.json(result)),
    http.post('/admin/api/v1/alcohols/attributes/alcohols/search', async ({ request }) => {
      searches.push(await request.json());
      return HttpResponse.json(result);
    }),
    http.post('/admin/api/v1/alcohols/attributes/alcohols/facets', async ({ request }) => {
      facets.push(await request.json());
      return HttpResponse.json(
        wrap({
          items: [
            { attribute: beginner, value: 'true', alcoholCount: 17 },
            { attribute: beginner, value: 'false', alcoholCount: 0 },
          ],
          hasNext: false,
        })
      );
    })
  );
  render(<AttributeGraphPanel />);
  const user = userEvent.setup();
  expect(screen.getByRole('button', { name: '상세 조건' })).toHaveAttribute(
    'aria-expanded',
    'false'
  );
  expect(screen.queryByRole('button', { name: /^속성 선택/ })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '상세 조건' }));
  expect(screen.getByRole('button', { name: /^속성 선택/ })).toBeVisible();
  await user.keyboard('{Escape}');
  expect(screen.queryByText('노드 목록으로 탐색')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '그래프 다음' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '속성: 바 추천 대상 여부 · 예' }));
  expect(searches).toHaveLength(0);
  await user.click(screen.getByRole('button', { name: '이 값으로 좁히기' }));
  await waitFor(() =>
    expect(searches[searches.length - 1]).toMatchObject({
      match: 'AND',
      conditions: [{ key: 'eligible', operator: 'EQ', value: 'true' }],
    })
  );
  await user.click(
    await screen.findByRole('button', { name: '입문 추천 여부 · 예 · 17개로 좁히기' })
  );
  await waitFor(() =>
    expect(searches[searches.length - 1]).toMatchObject({
      conditions: [
        { key: 'eligible', operator: 'EQ', value: 'true' },
        { key: 'beginner', operator: 'EQ', value: 'true' },
      ],
    })
  );
  expect(
    screen.getByRole('button', { name: '입문 추천 여부 · 아니오 · 0개로 좁히기' })
  ).toBeDisabled();
  expect(facets[facets.length - 1]).toMatchObject({ linkedOnly: true, match: 'AND' });
  await user.click(screen.getByRole('button', { name: '한 단계 되돌리기' }));
  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: '입문 추천 여부 = 예 조건 제거' })
    ).not.toBeInTheDocument()
  );
  expect(screen.queryByRole('combobox', { name: '추가할 속성' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '+ 조건' }));
  await user.selectOptions(screen.getByRole('combobox', { name: '추가할 속성' }), 'price');
  expect(screen.getByRole('combobox', { name: '추가 조건 연산자' })).toHaveValue('GTE');
  await user.type(screen.getByRole('textbox', { name: '추가 조건 값' }), '30000');
  await user.click(screen.getByRole('button', { name: '조건 추가' }));
  await waitFor(() =>
    expect(searches[searches.length - 1]).toMatchObject({
      match: 'AND',
      conditions: [
        { key: 'eligible', operator: 'EQ', value: 'true' },
        { key: 'price', operator: 'GTE', value: '30000' },
      ],
    })
  );
  await user.click(screen.getByRole('button', { name: '한 단계 되돌리기' }));
  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: /병 참고 가격.*조건 제거/ })
    ).not.toBeInTheDocument()
  );
  await user.click(screen.getByRole('button', { name: '바 추천 대상 여부 = 예 조건 제거' }));
  expect(
    screen.queryByRole('button', { name: '바 추천 대상 여부 = 예 조건 제거' })
  ).not.toBeInTheDocument();
});

it('숫자 범위는 검증한 하한·상한 조건 두 개로 추가한다', async () => {
  const onAdd = vi.fn();
  server.use(
    http.get('/admin/api/v1/alcohols/attributes', () =>
      HttpResponse.json({
        ...wrap([
          {
            ...eligible,
            key: 'price',
            displayName: '병 참고 가격',
            datatype: 'INT',
            type: 'PRICE',
            unit: '원',
          },
        ]),
        meta: { hasNext: false },
      })
    ),
    http.post('/admin/api/v1/alcohols/attributes/alcohols/facets', () =>
      HttpResponse.json(wrap({ items: [], hasNext: false }))
    )
  );
  const { GraphConditionForm } = await import('../variants/a/GraphConditionForm');
  render(
    <GraphConditionForm
      attributes={[
        {
          ...eligible,
          type: 'FLAG',
          datatype: 'BOOLEAN',
          createAt: '',
          lastModifyAt: '',
          createPrincipal: null,
          lastModifyPrincipal: null,
        },
        {
          ...eligible,
          key: 'price',
          displayName: '병 참고 가격',
          datatype: 'INT',
          type: 'PRICE',
          unit: '원',
          createAt: '',
          lastModifyAt: '',
          createPrincipal: null,
          lastModifyPrincipal: null,
        },
      ]}
      onAdd={onAdd}
      disabled={false}
      conditionCount={0}
    />
  );
  const user = userEvent.setup();
  await user.selectOptions(screen.getByLabelText('추가할 속성'), 'eligible');
  await user.selectOptions(screen.getByLabelText('추가 조건 값'), 'true');
  await user.selectOptions(screen.getByLabelText('추가할 속성'), 'price');
  expect(screen.getByLabelText('추가 조건 연산자')).toHaveValue('GTE');
  expect(screen.getByLabelText('추가 조건 값')).toHaveValue('');
  await user.selectOptions(screen.getByLabelText('추가 조건 연산자'), 'BETWEEN');
  await user.type(screen.getByLabelText('최솟값'), '200');
  await user.type(screen.getByLabelText('최댓값'), '100');
  await user.click(screen.getByRole('button', { name: '조건 추가' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('최솟값은 최댓값보다 클 수 없습니다.');
  expect(onAdd).not.toHaveBeenCalled();
  await user.clear(screen.getByLabelText('최댓값'));
  await user.type(screen.getByLabelText('최댓값'), '300');
  await user.click(screen.getByRole('button', { name: '조건 추가' }));
  expect(onAdd).toHaveBeenCalledWith([
    { key: 'price', operator: 'GTE', value: '200' },
    { key: 'price', operator: 'LTE', value: '300' },
  ]);
});

it('집계 API 실패를 빈 결과나 현재 페이지 개수로 대체하지 않는다', async () => {
  server.use(
    http.post('/admin/api/v1/alcohols/attributes/alcohols/facets', () =>
      HttpResponse.json({ message: 'unavailable' }, { status: 503 })
    )
  );
  const { AttributeRefinementCandidates } =
    await import('../variants/a/AttributeRefinementCandidates');
  render(
    <AttributeRefinementCandidates search={{ conditions: [] }} onAdd={vi.fn()} disabled={false} />
  );
  expect(await screen.findByRole('alert')).toHaveTextContent('후보 집계를 불러오지 못했습니다.');
  expect(screen.queryByText('추가할 속성 값이 없습니다.')).not.toBeInTheDocument();
});

it('OR 검색에서 노드 좁히기를 비활성화하여 기존 조건 의미를 바꾸지 않는다', async () => {
  const { useNavigate } = await import('react-router');
  function SavedSearch() {
    const navigate = useNavigate();
    return (
      <>
        <button
          onClick={() =>
            navigate(
              '?graphmatch=OR&graphconditions=' +
                encodeURIComponent(
                  JSON.stringify([{ key: 'eligible', operator: 'EQ', value: 'true' }])
                )
            )
          }
        >
          OR 검색 열기
        </button>
        <AttributeGraphPanel />
      </>
    );
  }
  const item = {
    alcoholId: 1,
    korName: '글렌피딕',
    attributes: [{ mappingId: 1, attribute: beginner, value: 'true' }],
  };
  const result = {
    ...wrap([item]),
    meta: { page: 0, size: 25, totalElements: 1, totalPages: 1, hasNext: false },
  };
  server.use(
    http.get('/admin/api/v1/alcohols/attributes', () =>
      HttpResponse.json({ ...wrap([eligible, beginner, price]), meta: { hasNext: false } })
    ),
    http.get('/admin/api/v1/alcohols/attributes/alcohols', () => HttpResponse.json(result)),
    http.post('/admin/api/v1/alcohols/attributes/alcohols/search', () => HttpResponse.json(result))
  );
  render(<SavedSearch />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'OR 검색 열기' }));
  await user.click(await screen.findByRole('button', { name: '속성: 입문 추천 여부 · 예' }));
  expect(screen.getByRole('button', { name: '이 값으로 좁히기' })).toBeDisabled();
  expect(
    screen.getByText('하나씩 좁히려면 상세 조건에서 모두 충족(AND)으로 변경하세요.')
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('region', { name: '함께 가진 속성으로 좁히기' })
  ).not.toBeInTheDocument();
});

it('후보 패널에서 숫자 연산자를 선택하면 기존 조건과 함께 적용하며 값별 집계를 범위 결과로 표시하지 않는다', async () => {
  const { useNavigate } = await import('react-router');
  function SavedSearch() {
    const navigate = useNavigate();
    return (
      <>
        <button
          onClick={() =>
            navigate(
              '?graphconditions=' +
                encodeURIComponent(
                  JSON.stringify([{ key: 'eligible', operator: 'EQ', value: 'true' }])
                )
            )
          }
        >
          검색 열기
        </button>
        <AttributeGraphPanel />
      </>
    );
  }
  const searches: unknown[] = [];
  const result = { ...wrap([]), meta: { hasNext: false } };
  server.use(
    http.get('/admin/api/v1/alcohols/attributes/alcohols', () => HttpResponse.json(result)),
    http.get('/admin/api/v1/alcohols/attributes', () =>
      HttpResponse.json({ ...wrap([eligible, price]), meta: { hasNext: false } })
    ),
    http.post('/admin/api/v1/alcohols/attributes/alcohols/search', async ({ request }) => {
      searches.push(await request.json());
      return HttpResponse.json(result);
    }),
    http.post('/admin/api/v1/alcohols/attributes/alcohols/facets', () =>
      HttpResponse.json(
        wrap({ items: [{ attribute: price, value: '30000', alcoholCount: 7 }], hasNext: false })
      )
    )
  );
  render(<SavedSearch />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: '검색 열기' }));
  await user.selectOptions(
    await screen.findByRole('combobox', { name: '병 참고 가격 · 30,000 원 연산자' }),
    'GTE'
  );
  expect(
    screen.queryByRole('button', { name: '병 참고 가격 · 30,000 원 · 7개로 좁히기' })
  ).not.toBeInTheDocument();
  expect(screen.getByText('이 값과 같음: 7개')).toBeVisible();
  await user.click(
    screen.getByRole('button', { name: '병 참고 가격 이상 (≥) 30,000 원 조건 추가' })
  );
  await waitFor(() =>
    expect(searches[searches.length - 1]).toMatchObject({
      conditions: [
        { key: 'eligible', operator: 'EQ', value: 'true' },
        { key: 'price', operator: 'GTE', value: '30000' },
      ],
    })
  );
  await user.selectOptions(
    await screen.findByRole('combobox', { name: '병 참고 가격 · 30,000 원 연산자' }),
    'GTE'
  );
  expect(
    screen.getByRole('button', { name: '병 참고 가격 이상 (≥) 30,000 원 조건 추가' })
  ).toBeDisabled();
});

it('조건 토큰을 편집하면 다른 조건을 유지하며 해당 조건만 교체한다', async () => {
  const { AttributeConditionTokens } = await import('../variants/a/AttributeConditionTokens');
  const onChange = vi.fn();
  server.use(
    http.get('/admin/api/v1/alcohols/attributes', () =>
      HttpResponse.json({ ...wrap([eligible, price]), meta: { hasNext: false } })
    )
  );
  render(
    <AttributeConditionTokens
      search={{
        match: 'AND',
        conditions: [
          { key: 'eligible', operator: 'EQ', value: 'true' },
          { key: 'price', operator: 'GTE', value: '30000' },
        ],
      }}
      onChange={onChange}
    />
  );
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: '병 참고 가격 이상 (≥) 30,000 원' }));
  expect(screen.getByRole('textbox', { name: '추가 조건 값' })).toHaveValue('30000');
  await user.clear(screen.getByRole('textbox', { name: '추가 조건 값' }));
  await user.type(screen.getByRole('textbox', { name: '추가 조건 값' }), '50000');
  await user.click(screen.getByRole('button', { name: '조건 수정' }));
  expect(onChange).toHaveBeenCalledWith({
    match: 'AND',
    conditions: [
      { key: 'eligible', operator: 'EQ', value: 'true' },
      { key: 'price', operator: 'GTE', value: '50000' },
    ],
  });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
