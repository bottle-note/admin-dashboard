import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { it, expect, beforeEach } from 'vitest';
import { http, HttpResponse, delay } from 'msw';
import { render } from '@/test/test-utils';
import { server } from '@/test/mocks/server';
import type { ScenarioCandidateRequest } from '@/types/api/alcohol-attribute.api';
import { AttributeScenarioPanel } from '../variants/a/AttributeScenarioPanel';

const endpoint = '/admin/api/v1/attribute/groups/:groupId/candidates';
const experience = {
  id: 1,
  key: 'mock_scenario_whisky_experience',
  displayName: '경험',
  groupId: 7,
  datatype: 'STRING',
  allowedValues: ['처음', '경험 있음'],
};
const price = {
  id: 2,
  key: 'mock_scenario_glass_price',
  displayName: '잔 참고 가격',
  groupId: 7,
  datatype: 'INT',
  type: 'PRICE',
  unit: '원',
  allowedValues: null,
};
const popularity = {
  id: 3,
  key: 'mock_scenario_popularity_preference',
  displayName: '인지도',
  groupId: 7,
  datatype: 'STRING',
  allowedValues: ['대중적', '도전'],
};
let definitions = [experience, price, popularity];
const bottle = (id: number, exp = ['처음', '경험 있음']) => ({
  alcoholId: id,
  korName: `위스키 ${id}`,
  engName: null,
  categoryGroup: id === 2 ? 'BOURBON' : 'SINGLE_MALT',
  abv: id === 3 ? null : 40,
  abvRaw: id === 3 ? null : '40%',
  tastingGroupCodes: id === 2 ? [] : ['FRUIT'],
  attributes: [
    { attributeId: 1, values: exp },
    { attributeId: 2, values: [String(id * 10000)] },
    { attributeId: 3, values: [id === 2 ? '도전' : '대중적'] },
  ],
});
let bottles = [bottle(1), bottle(2, ['처음']), bottle(3, ['경험 있음'])];
let requests: (ScenarioCandidateRequest & { groupId: number })[] = [];
let detailCalls = 0;
let failPage: number | null = null;
let slowFirst = false;
const wrap = (data: unknown, meta = {}) => ({
  success: true,
  data,
  meta: { hasNext: false, ...meta },
});

beforeEach(() => {
  definitions = [experience, price, popularity];
  bottles = [bottle(1), bottle(2, ['처음']), bottle(3, ['경험 있음'])];
  requests = [];
  detailCalls = 0;
  failPage = null;
  slowFirst = false;
  server.use(
    http.get('/admin/api/v1/alcohols/attribute-groups', () =>
      HttpResponse.json(
        wrap([
          { id: 7, name: '모의 추천' },
          { id: 8, name: '다른 그룹' },
        ])
      )
    ),
    http.get('/admin/api/v1/alcohols/attributes', () => HttpResponse.json(wrap(definitions))),
    http.get(/\/admin\/api\/v1\/alcohols\/\d+$/, () => {
      detailCalls++;
      return HttpResponse.json({}, { status: 500 });
    }),
    http.post(endpoint, async ({ request, params }) => {
      const body = (await request.json()) as ScenarioCandidateRequest;
      requests.push({ ...body, groupId: Number(params.groupId) });
      if (body.page === failPage)
        return HttpResponse.json(
          { success: false, errors: [{ message: '조회 실패' }] },
          { status: 500 }
        );
      if (slowFirst && body.include?.some((c) => c.value === '처음')) await delay(120);
      const rows =
        Number(params.groupId) !== 7
          ? []
          : bottles.filter(
              (row) =>
                (body.include ?? []).every((condition) =>
                  row.attributes.some(
                    (attribute) =>
                      attribute.attributeId === condition.attributeId &&
                      attribute.values.some((value) =>
                        condition.operator === 'GTE'
                          ? Number(value) >= Number(condition.value)
                          : condition.operator === 'LTE'
                            ? Number(value) <= Number(condition.value)
                            : value === condition.value
                      )
                  )
                ) &&
                (!body.categoryGroups?.length ||
                  body.categoryGroups.includes(row.categoryGroup as 'BOURBON')) &&
                (!body.tastingGroupCodes?.length ||
                  row.tastingGroupCodes.some((code) => body.tastingGroupCodes!.includes(code))) &&
                (body.abvFrom === undefined || (row.abv !== null && row.abv >= body.abvFrom)) &&
                (body.abvTo === undefined || (row.abv !== null && row.abv <= body.abvTo))
            );
      const next = body.nextQuestion;
      const values = (row: ReturnType<typeof bottle>) =>
        row.attributes.find((a) => a.attributeId === next?.attributeId)?.values ?? [];
      const options = !next
        ? []
        : next.source === 'ATTRIBUTE'
          ? [
              ...new Set([
                ...(definitions.find((d) => d.id === next.attributeId)?.allowedValues ?? []),
                ...bottles.flatMap(values),
              ]),
            ].map((value) => ({
              value,
              label: value,
              count: rows.filter((r) => values(r).includes(value)).length,
            }))
          : next.source === 'CATEGORY'
            ? ['SINGLE_MALT', 'BOURBON'].map((value) => ({
                value,
                label: value === 'SINGLE_MALT' ? '싱글몰트' : '버번',
                count: rows.filter((r) => r.categoryGroup === value).length,
              }))
            : next.source === 'TASTING_GROUP'
              ? [
                  {
                    value: 'FRUIT',
                    label: '과일향',
                    count: rows.filter((r) => r.tastingGroupCodes.includes('FRUIT')).length,
                  },
                ]
              : (next.ranges ?? []).map((range) => ({
                  value: range.key,
                  label: range.key,
                  count: rows.filter(
                    (r) =>
                      r.abv !== null && r.abv >= (range.from ?? 0) && r.abv <= (range.to ?? 100)
                  ).length,
                }));
      const nums = next?.attributeId === 2 ? rows.flatMap(values).map(Number) : [];
      const size = body.size ?? 25,
        page = body.page ?? 0;
      return HttpResponse.json(
        wrap(
          {
            group: { id: Number(params.groupId), name: '모의 추천' },
            attributeDefinitions: definitions.map(({ id, ...definition }) => ({
              ...definition,
              attributeId: id,
            })),
            items: rows.slice(page * size, (page + 1) * size),
            totalCount: rows.length,
            facets: next
              ? {
                  source: next.source,
                  attributeId: next.attributeId ?? null,
                  options,
                  hasMoreOptions: false,
                  missingCount: 0,
                  min: nums.length ? Math.min(...nums) : null,
                  max: nums.length ? Math.max(...nums) : null,
                }
              : null,
          },
          {
            page,
            size,
            totalElements: rows.length,
            totalPages: Math.ceil(rows.length / size),
            hasNext: (page + 1) * size < rows.length,
          }
        )
      );
    })
  );
});
async function start(total = 3) {
  render(<AttributeScenarioPanel />);
  const user = userEvent.setup();
  await screen.findByRole('option', { name: '모의 추천' });
  await user.selectOptions(screen.getByRole('combobox'), '7');
  await screen.findByText(`후보 ${total}개`);
  return user;
}
const candidates = () => within(screen.getByRole('region', { name: '추천 후보' }));
async function any(user: ReturnType<typeof userEvent.setup>, title: string) {
  const group = screen.getByText(title).closest('fieldset')!;
  await user.click(await within(group).findByRole('button', { name: /상관없어요/ }));
}
async function experienceAndPrice(user: ReturnType<typeof userEvent.setup>, answer = '처음 · 2개') {
  await user.click(await screen.findByRole('button', { name: answer }));
  await user.click(await screen.findByRole('button', { name: '가격 범위 적용' }));
}

it('25개씩 조회하고 집계는 전체 기준이며 상세 API를 호출하지 않는다', async () => {
  bottles = Array.from({ length: 60 }, (_, i) => bottle(i + 1));
  const user = await start(60);
  expect(candidates().getAllByRole('listitem')).toHaveLength(25);
  expect(requests).toHaveLength(1);
  expect(requests[0]).toMatchObject({
    page: 0,
    size: 25,
    nextQuestion: { source: 'ATTRIBUTE', attributeId: 1 },
  });
  expect(await screen.findByRole('button', { name: '경험 있음 · 60개' })).toBeEnabled();
  await user.click(screen.getByRole('button', { name: '25개 더 보기' }));
  await waitFor(() => expect(candidates().getAllByRole('listitem')).toHaveLength(50));
  expect(requests[1]).toMatchObject({ page: 1, size: 25 });
  expect(requests[1]?.nextQuestion).toBeUndefined();
  await user.click(screen.getByRole('button', { name: '25개 더 보기' }));
  await waitFor(() => expect(candidates().getAllByRole('listitem')).toHaveLength(60));
  expect(screen.queryByRole('button', { name: '25개 더 보기' })).not.toBeInTheDocument();
  expect(detailCalls).toBe(0);
});
it('그룹 선택 전에는 후보를 조회하지 않는다', async () => {
  render(<AttributeScenarioPanel />);
  await screen.findByRole('option', { name: '모의 추천' });
  expect(requests).toHaveLength(0);
});
it('경험과 가격 범위를 서버 조건으로 보내며 앞 답변을 바꾸면 뒤 선택을 초기화한다', async () => {
  const user = await start();
  await experienceAndPrice(user);
  await any(user, '어떤 종류를 원하세요?');
  await any(user, '어떤 향이 좋으세요?');
  await any(user, '도수는 어느 정도가 좋으세요?');
  await user.click(await screen.findByRole('button', { name: '도전 · 1개' }));
  await screen.findByText('후보 1개');
  expect(candidates().getByText('위스키 2')).toBeVisible();
  expect(requests[requests.length - 1]?.include).toEqual([
    { attributeId: 1, operator: 'EQ', value: '처음' },
    { attributeId: 2, operator: 'GTE', value: '10000' },
    { attributeId: 2, operator: 'LTE', value: '20000' },
    { attributeId: 3, operator: 'EQ', value: '도전' },
  ]);
  await user.click(screen.getByRole('button', { name: '경험 있음 · 2개' }));
  await screen.findByText('후보 2개');
  expect(requests[requests.length - 1]?.include).toEqual([
    { attributeId: 1, operator: 'EQ', value: '경험 있음' },
  ]);
  expect(candidates().queryByText('위스키 2')).not.toBeInTheDocument();
});
it('종류·대표 향·도수를 서버 조건으로 연결한다', async () => {
  const user = await start();
  await experienceAndPrice(user, '경험 있음 · 2개');
  await user.click(await screen.findByRole('button', { name: '싱글몰트 · 2개' }));
  await user.click(await screen.findByRole('button', { name: '과일향 · 2개' }));
  await user.click(await screen.findByRole('button', { name: '가볍게 · 43% 이하 · 1개' }));
  await screen.findByText('후보 1개');
  expect(requests[requests.length - 1]).toMatchObject({
    categoryGroups: ['SINGLE_MALT'],
    tastingGroupCodes: ['FRUIT'],
    abvFrom: 0,
    abvTo: 43,
  });
  expect(candidates().getByText('위스키 1')).toBeVisible();
});
it('상관없어요는 도수 누락도 유지하고 그룹 변경은 답변을 초기화한다', async () => {
  const user = await start();
  await experienceAndPrice(user, '경험 있음 · 2개');
  await any(user, '어떤 종류를 원하세요?');
  await any(user, '어떤 향이 좋으세요?');
  await any(user, '도수는 어느 정도가 좋으세요?');
  expect(candidates().getByText('위스키 3')).toBeVisible();
  expect(requests[requests.length - 1]?.abvFrom).toBeUndefined();
  await user.selectOptions(screen.getByRole('combobox'), '8');
  await screen.findByText('후보 0개');
  expect(requests[requests.length - 1]).toMatchObject({ groupId: 8, page: 0, include: [] });
});
it('가격 수정은 이후 답변을 초기화하고 잘못된 범위를 적용하지 못한다', async () => {
  const user = await start();
  await experienceAndPrice(user);
  await any(user, '어떤 종류를 원하세요?');
  const max = screen.getByRole('spinbutton', { name: '최대 잔 가격' });
  await user.clear(max);
  await user.type(max, '5000');
  expect(screen.getByRole('button', { name: '가격 범위 적용' })).toBeDisabled();
  expect(screen.getByRole('alert')).toHaveTextContent('가격');
  await user.clear(max);
  await user.type(max, '10000');
  await user.click(screen.getByRole('button', { name: '가격 범위 적용' }));
  await screen.findByText('후보 1개');
  expect(requests[requests.length - 1]?.categoryGroups).toBeUndefined();
});
it('다음 페이지 실패 시 기존 결과를 유지하고 재시도하며 필터 변경은 첫 페이지로 돌아간다', async () => {
  bottles = Array.from({ length: 30 }, (_, i) => bottle(i + 1));
  const user = await start(30);
  failPage = 1;
  await user.click(screen.getByRole('button', { name: '25개 더 보기' }));
  await waitFor(() => expect(candidates().getByRole('alert')).toHaveTextContent('추가 후보'));
  expect(candidates().getAllByRole('listitem')).toHaveLength(25);
  failPage = null;
  await user.click(candidates().getByRole('button', { name: '다시 조회' }));
  await waitFor(() => expect(candidates().getAllByRole('listitem')).toHaveLength(30));
  await user.click(screen.getByRole('button', { name: '처음 · 30개' }));
  await waitFor(() => expect(candidates().getAllByRole('listitem')).toHaveLength(25));
  expect(requests[requests.length - 1]?.page).toBe(0);
});
it('첫 조회 실패 시 후보 수를 꾸며내지 않는다', async () => {
  failPage = 0;
  render(<AttributeScenarioPanel />);
  const user = userEvent.setup();
  await screen.findByRole('option', { name: '모의 추천' });
  await user.selectOptions(screen.getByRole('combobox'), '7');
  await waitFor(() =>
    expect(candidates().getByRole('alert')).toHaveTextContent('추천 후보를 불러오지 못했습니다')
  );
  expect(screen.queryByText(/후보 \d+개/)).not.toBeInTheDocument();
});
it('늦게 도착한 이전 조건의 응답이 현재 후보를 덮어쓰지 않는다', async () => {
  const user = await start();
  slowFirst = true;
  await user.click(screen.getByRole('button', { name: '처음 · 2개' }));
  await user.click(screen.getByRole('button', { name: '경험 있음 · 2개' }));
  await waitFor(() => expect(candidates().getByText('위스키 3')).toBeVisible());
  expect(candidates().queryByText('위스키 2')).not.toBeInTheDocument();
});
it('패널 구분선의 키보드 조절을 유지한다', async () => {
  const user = await start();
  const divider = screen.getByRole('separator', { name: '질문 패널 너비' });
  divider.focus();
  await user.keyboard('{ArrowLeft}');
  expect(divider).toHaveAttribute('aria-valuenow', '55');
  await user.keyboard('{Home}');
  expect(divider).toHaveAttribute('aria-valuenow', '35');
  await user.keyboard('{End}');
  expect(divider).toHaveAttribute('aria-valuenow', '75');
});
