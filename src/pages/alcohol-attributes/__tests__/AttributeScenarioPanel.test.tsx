import { beforeEach, expect, it } from 'vitest';
import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { render } from '@/test/test-utils';
import { server } from '@/test/mocks/server';
import { AttributeScenarioPanel } from '../variants/a/AttributeScenarioPanel';
import type {
  ScenarioDefinition,
  ScenarioPreviewRequest,
  ScenarioVersionDetail,
} from '@/types/api/alcohol-scenario.api';

const base = '/admin/api/v1/attribute/groups/:groupId/scenarios';
const wrap = (data: unknown, meta = {}) => ({
  success: true,
  code: 200,
  data,
  errors: [],
  meta: { page: 0, size: 25, totalElements: 1, totalPages: 1, hasNext: false, ...meta },
});
const audit = {
  createAt: '2026-10-23T12:00:00',
  lastModifyAt: '2026-10-23T12:00:00',
  createPrincipal: null,
  lastModifyPrincipal: null,
};
const attribute = {
  ...audit,
  id: 11,
  groupId: 7,
  key: 'experience',
  displayName: '경험',
  type: 'KEYWORD',
  datatype: 'STRING',
  allowedValues: ['처음', '경험 있음'],
  pattern: null,
  unit: null,
  allowMultipleValues: true,
};
const scenario = (id = 31, slot = 1) => ({
  ...audit,
  id,
  groupId: 7,
  slot,
  title: `시나리오 ${slot}`,
  enabled: true,
  activeVersionId: null,
  lockVersion: 0,
});
const version = {
  ...audit,
  id: 51,
  versionNo: 1,
  status: 'DRAFT' as const,
  lockVersion: 0,
  publishedAt: null,
};
const empty = (): ScenarioDefinition => ({
  definitionSchemaVersion: 1,
  startQuestionId: null,
  stages: [],
  questions: [],
  transitions: [],
});
let items: ReturnType<typeof scenario>[];
let saved: ScenarioVersionDetail;
let writes: ScenarioDefinition[];
let previews: ScenarioPreviewRequest[];
let failSave: boolean;
let failPage: boolean;
let slowChoice: boolean;

function sevenStages(): ScenarioDefinition {
  const qs = [1, 2, 3, 41, 42, 43, 5, 6, 7].map((id) => ({
    id,
    stageId: id > 40 ? 4 : id,
    branchOrder: id > 40 ? id - 40 : 1,
    title: `질문 문구 ${id}`,
    sourceKind: 'ATTRIBUTE' as const,
    attributeId: 11,
    inputKind: 'SINGLE_CHOICE' as const,
    inputConfig: {
      allowAny: true,
      choices: [
        { id: 'first', label: '처음', value: '처음' },
        { id: 'expert', label: '경험 있음', value: '경험 있음' },
      ],
    },
  }));
  let id = 100;
  const rule = (from: number, to: number | null, choice?: string, priority = 1) => ({
    id: id++,
    fromQuestionId: from,
    priority,
    predicate: choice
      ? { operator: 'EQ' as const, value: choice }
      : { operator: 'ALWAYS' as const },
    targetKind: to === null ? ('END' as const) : ('QUESTION' as const),
    targetQuestionId: to,
  });
  return {
    definitionSchemaVersion: 1,
    startQuestionId: 1,
    stages: Array.from({ length: 7 }, (_, i) => ({ id: i + 1, position: i + 1 })),
    questions: qs,
    transitions: [
      rule(1, 3, 'expert'),
      rule(1, 2, undefined, 2),
      rule(2, 3),
      rule(3, 42, 'expert'),
      rule(3, 41, 'first', 2),
      rule(3, 43, undefined, 3),
      rule(41, 5),
      rule(42, 6),
      rule(43, 5),
      rule(5, 6),
      rule(6, 7),
      rule(7, null),
    ],
  };
}

beforeEach(() => {
  items = [];
  saved = { version: { ...version }, definition: empty() };
  writes = [];
  previews = [];
  failSave = false;
  failPage = false;
  slowChoice = false;
  server.use(
    http.get('/admin/api/v1/alcohols/attribute-groups', () =>
      HttpResponse.json(
        wrap([
          { id: 7, name: '추천 그룹' },
          { id: 8, name: '다른 그룹' },
        ])
      )
    ),
    http.get('/admin/api/v1/alcohols/attributes', () =>
      HttpResponse.json(
        wrap([attribute, { ...attribute, id: 12, groupId: 8, displayName: '다른 그룹 속성' }])
      )
    ),
    http.get('/admin/api/v1/tasting/groups', () =>
      HttpResponse.json(wrap({ groups: [], families: [] }))
    ),
    http.get(base, ({ params }) =>
      HttpResponse.json(wrap(Number(params.groupId) === 7 ? items : []))
    ),
    http.post(base, async ({ request }) => {
      const data = (await request.json()) as { title: string; slot: number };
      const created = { ...scenario(31 + data.slot - 1, data.slot), title: data.title };
      items.push(created);
      return HttpResponse.json(
        wrap({ scenario: created, versions: [{ ...version, id: 50 + data.slot }] })
      );
    }),
    http.get(`${base}/:scenarioId`, ({ params }) =>
      HttpResponse.json(
        wrap({
          scenario: items.find((i) => i.id === Number(params.scenarioId)),
          versions: [{ ...saved.version, id: Number(params.scenarioId) + 20 }],
        })
      )
    ),
    http.get(`${base}/:scenarioId/versions/:versionId`, ({ params }) =>
      HttpResponse.json(
        wrap({ ...saved, version: { ...saved.version, id: Number(params.versionId) } })
      )
    ),
    http.put(`${base}/:scenarioId/versions/:versionId`, async ({ request }) => {
      const body = (await request.json()) as {
        expectedLockVersion: number;
        definition: ScenarioDefinition;
      };
      writes.push(body.definition);
      if (failSave)
        return HttpResponse.json(
          { success: false, code: 409, errors: [{ message: '다른 관리자가 수정했습니다.' }] },
          { status: 409 }
        );
      expect(body.expectedLockVersion).toBe(saved.version.lockVersion);
      const ids = new Map(
        [...body.definition.stages, ...body.definition.questions, ...body.definition.transitions]
          .filter((x) => x.id < 0)
          .map((x, i) => [x.id, 200 + i])
      );
      const real = (id: number | null) => (id === null ? null : (ids.get(id) ?? id));
      saved = {
        version: { ...saved.version, lockVersion: saved.version.lockVersion + 1 },
        definition: {
          ...body.definition,
          startQuestionId: real(body.definition.startQuestionId),
          stages: body.definition.stages.map((s) => ({ ...s, id: real(s.id)! })),
          questions: body.definition.questions.map((q) => ({
            ...q,
            id: real(q.id)!,
            stageId: real(q.stageId)!,
          })),
          transitions: body.definition.transitions.map((t) => ({
            ...t,
            id: real(t.id)!,
            fromQuestionId: real(t.fromQuestionId)!,
            targetQuestionId: real(t.targetQuestionId),
          })),
        },
      };
      return HttpResponse.json(wrap(saved));
    }),
    http.post(`${base}/:scenarioId/versions/:versionId/preview`, async ({ request }) => {
      const body = (await request.json()) as ScenarioPreviewRequest;
      previews.push(body);
      if (failPage && body.page === 1)
        return HttpResponse.json(
          { success: false, code: 500, errors: [{ message: '추가 조회 실패' }] },
          { status: 500 }
        );
      if (slowChoice && body.answers[0]?.kind === 'CHOICE' && body.answers[0].choiceId === 'first')
        await delay(180);
      const changed =
        body.changedQuestionId === undefined
          ? -1
          : body.answers.findIndex((a) => a.questionId === body.changedQuestionId);
      const answers = changed < 0 ? body.answers : body.answers.slice(0, changed + 1);
      const path: number[] = [];
      let next = saved.definition.startQuestionId;
      for (const a of answers) {
        if (next !== a.questionId)
          return HttpResponse.json(
            { success: false, code: 400, errors: [{ message: '잘못된 경로' }] },
            { status: 400 }
          );
        path.push(next);
        const rule = saved.definition.transitions
          .filter((t) => t.fromQuestionId === next)
          .sort((a, b) => a.priority - b.priority)
          .find(
            (t) =>
              t.predicate.operator === 'ALWAYS' ||
              (a.kind === 'CHOICE' && t.predicate.value === a.choiceId)
          );
        next = rule?.targetQuestionId ?? null;
      }
      if (next !== null) path.push(next);
      return HttpResponse.json(
        wrap(
          {
            path,
            nextQuestionId: next,
            completed: next === null,
            answers,
            discardedQuestionIds: body.answers.slice(answers.length).map((a) => a.questionId),
            viewedQuestionId: body.viewQuestionId ?? next,
            contributions: [],
            candidates: {
              group: { id: 7, name: '추천 그룹' },
              attributeDefinitions: [],
              items: [
                {
                  alcoholId: body.page ? 2 : 1,
                  korName: `위스키 ${body.page ? 2 : 1}`,
                  engName: null,
                  categoryGroup: 'SINGLE_MALT',
                  abv: 40,
                  abvRaw: '40%',
                  attributes: [],
                },
              ],
              totalCount: 30,
              facets: {
                options: [
                  { value: '처음', label: '처음', count: 10 },
                  { value: '경험 있음', label: '경험 있음', count: 20 },
                ],
                min: null,
                max: null,
                hasMoreOptions: false,
              },
            },
          },
          { page: body.page ?? 0, hasNext: !body.page }
        )
      );
    })
  );
});

async function open() {
  const user = userEvent.setup();
  render(<AttributeScenarioPanel />);
  await screen.findByRole('option', { name: '추천 그룹' });
  await user.selectOptions(screen.getByLabelText('시나리오 속성 그룹'), '7');
  return user;
}
async function openGraph() {
  items = [scenario()];
  saved.definition = sevenStages();
  const user = await open();
  await screen.findByRole('heading', { name: '질문 문구 1' });
  return user;
}
const card = (title: string) => screen.getByRole('heading', { name: title }).closest('fieldset')!;

it('그룹 선택 전에는 시나리오와 후보를 자동으로 만들지 않는다', () => {
  render(<AttributeScenarioPanel />);
  expect(screen.getByText('먼저 속성 그룹을 선택하세요')).toBeInTheDocument();
  expect(previews).toHaveLength(0);
});
it('새 시나리오는 빈 초안이며 같은 그룹의 속성만 설정한다', async () => {
  const user = await open();
  await user.click(await screen.findByRole('button', { name: '시나리오 추가' }));
  expect(await screen.findByText('아직 설정한 속성과 질문이 없습니다.')).toBeInTheDocument();
  expect(previews).toHaveLength(0);
  await user.click(screen.getByRole('button', { name: '질문 추가' }));
  const select = screen.getByLabelText('질문 1 속성');
  expect(within(select).getByRole('option', { name: '경험' })).toBeInTheDocument();
  expect(within(select).queryByRole('option', { name: '다른 그룹 속성' })).not.toBeInTheDocument();
});
it('질문 저장 뒤 실제 ID와 revision으로 미리보기하고 다시 불러온다', async () => {
  const user = await open();
  await user.click(await screen.findByRole('button', { name: '시나리오 추가' }));
  await user.click(await screen.findByRole('button', { name: '질문 추가' }));
  await user.selectOptions(screen.getByLabelText('질문 1 속성'), 'attribute:11');
  await user.clear(screen.getByLabelText('질문 1 문구'));
  await user.type(screen.getByLabelText('질문 1 문구'), '얼마나 마셔봤나요?');
  await user.click(screen.getByRole('button', { name: '시나리오 저장' }));
  await screen.findByRole('heading', { name: '얼마나 마셔봤나요?' });
  expect(writes).toHaveLength(1);
  expect(writes[0]!.questions[0]!.id).toBeLessThan(0);
  expect(writes[0]!.transitions[writes[0]!.transitions.length - 1]?.targetKind).toBe('END');
  await waitFor(() => expect(previews.some((p) => p.expectedLockVersion === 1)).toBe(true));
  expect(saved.definition.questions[0]!.id).toBeGreaterThan(0);
});
it('동시 수정409에도 작성한 질문 문구를 보존하고 성공으로 닫지 않는다', async () => {
  const user = await openGraph();
  await user.click(screen.getByRole('button', { name: '질문 설정' }));
  await user.clear(screen.getByLabelText('질문 1 문구'));
  await user.type(screen.getByLabelText('질문 1 문구'), '내가 작성한 질문');
  failSave = true;
  await user.click(screen.getByRole('button', { name: '시나리오 저장' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('다른 관리자가 수정했습니다.');
  expect(screen.getByLabelText('질문 1 문구')).toHaveValue('내가 작성한 질문');
});
it('같은 속성을 여러 질문에 추가하고 독립적인 질문 ID로 저장한다', async () => {
  const user = await open();
  await user.click(await screen.findByRole('button', { name: '시나리오 추가' }));
  for (let n = 1; n <= 2; n++) {
    await user.click(await screen.findByRole('button', { name: '질문 추가' }));
    await user.selectOptions(screen.getByLabelText(`질문 ${n} 속성`), 'attribute:11');
  }
  await user.click(screen.getByRole('button', { name: '시나리오 저장' }));
  await waitFor(() => expect(writes).toHaveLength(1));
  expect(writes[0]!.questions.map((q) => q.attributeId)).toEqual([11, 11]);
  expect(new Set(writes[0]!.questions.map((q) => q.id)).size).toBe(2);
});
it('저장된 단계의4-1·4-2·4-3을 나란히 표시하고7단계를 유지한다', async () => {
  await openGraph();
  const branches = screen.getByRole('region', { name: '질문 4 분기' });
  expect(within(branches).getByText('질문 4-1')).toBeInTheDocument();
  expect(within(branches).getByText('질문 4-2')).toBeInTheDocument();
  expect(within(branches).getByText('질문 4-3')).toBeInTheDocument();
  expect(screen.getByText('질문 07')).toBeInTheDocument();
});
it('질문1의 경험 답변은2를 건너뛰고3으로 가며 선택지 문구 대신choiceId를 전송한다', async () => {
  const user = await openGraph();
  await user.click(
    await within(card('질문 문구 1')).findByRole('button', { name: '경험 있음 · 20개' })
  );
  await waitFor(() =>
    expect(
      previews.some((p) => p.answers[0]?.kind === 'CHOICE' && p.answers[0].choiceId === 'expert')
    ).toBe(true)
  );
  expect(
    await within(card('질문 문구 3')).findByRole('button', { name: '처음 · 10개' })
  ).toBeEnabled();
  expect(card('질문 문구 2')).toBeDisabled();
  expect(
    within(card('질문 문구 2')).getByText('현재 답변에 따라 건너뛴 질문입니다.')
  ).toBeInTheDocument();
  const facetRequests = previews.filter((p) => p.viewQuestionId === 1);
  expect(facetRequests.every((p) => p.answers.length === 0)).toBe(true);
});
it('4-2는5를 건너뛰고6으로, 앞 답변 변경 시 기존 갈래와 이후 답변을 초기화한다', async () => {
  const user = await openGraph();
  for (const q of [1, 3, 42])
    await user.click(
      await within(card(`질문 문구 ${q}`)).findByRole('button', { name: '경험 있음 · 20개' })
    );
  expect(
    await within(card('질문 문구 6')).findByRole('button', { name: '처음 · 10개' })
  ).toBeEnabled();
  expect(card('질문 문구 5')).toBeDisabled();
  await user.click(within(card('질문 문구 3')).getByRole('button', { name: '처음 · 10개' }));
  await waitFor(() =>
    expect(
      previews.some((p) => p.changedQuestionId === 3 && p.answers.some((a) => a.questionId === 42))
    ).toBe(true)
  );
  expect(
    await within(card('질문 문구 41')).findByRole('button', { name: '처음 · 10개' })
  ).toBeEnabled();
  expect(card('질문 문구 42')).toBeDisabled();
  expect(card('질문 문구 6')).toBeDisabled();
});
it('4-1과4-3은5로 이어지고 ANY는 선택지 EQ가 아닌ANY로 보낸다', async () => {
  const user = await openGraph();
  await user.click(
    await within(card('질문 문구 1')).findByRole('button', { name: '경험 있음 · 20개' })
  );
  await user.click(await within(card('질문 문구 3')).findByRole('button', { name: '상관없어요' }));
  await user.click(
    await within(card('질문 문구 43')).findByRole('button', { name: '처음 · 10개' })
  );
  expect(
    await within(card('질문 문구 5')).findByRole('button', { name: '처음 · 10개' })
  ).toBeEnabled();
  expect(previews.some((p) => p.answers.some((a) => a.questionId === 3 && a.kind === 'ANY'))).toBe(
    true
  );
});
it('추가 페이지 실패 시 기존 후보를 유지하고 재시도한다', async () => {
  const user = await openGraph();
  await screen.findByText('위스키 1');
  failPage = true;
  await user.click(await screen.findByRole('button', { name: '25개 더 보기' }));
  expect(await screen.findByText('추가 후보를 불러오지 못했습니다.')).toBeInTheDocument();
  expect(screen.getByText('위스키 1')).toBeInTheDocument();
  failPage = false;
  await user.click(screen.getByRole('button', { name: '후보 다시 조회' }));
  expect(await screen.findByText('위스키 2')).toBeInTheDocument();
});
it('그룹당3개 제한을 유지하고 서버에 있는 제목과 슬롯을 표시한다', async () => {
  items = [scenario(), scenario(32, 2), scenario(33, 3)];
  const user = await open();
  expect(await screen.findByRole('button', { name: '시나리오 추가' })).toBeDisabled();
  expect(screen.getByRole('tab', { name: '시나리오 3' })).toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText('시나리오 속성 그룹'), '8');
  expect(await screen.findByText('아직 등록된 시나리오가 없습니다.')).toBeInTheDocument();
});
it('패널 구분선의 키보드 조절을 유지한다', async () => {
  const user = await openGraph();
  const splitter = screen.getByRole('separator', { name: '질문 패널 너비' });
  splitter.focus();
  await user.keyboard('{End}');
  expect(splitter).toHaveAttribute('aria-valuenow', '75');
  await user.keyboard('{Home}');
  expect(splitter).toHaveAttribute('aria-valuenow', '35');
});

it('화면을 다시 열어도 서버에 저장된 질문과 분기를 복원한다', async () => {
  items = [scenario()];
  saved.definition = sevenStages();
  const first = render(<AttributeScenarioPanel />);
  const user = userEvent.setup();
  await screen.findByRole('option', { name: '추천 그룹' });
  await user.selectOptions(screen.getByLabelText('시나리오 속성 그룹'), '7');
  await screen.findByRole('heading', { name: '질문 문구 1' });
  first.unmount();
  render(<AttributeScenarioPanel />);
  await screen.findByRole('option', { name: '추천 그룹' });
  await user.selectOptions(screen.getByLabelText('시나리오 속성 그룹'), '7');
  expect(await screen.findByRole('heading', { name: '질문 문구 43' })).toBeInTheDocument();
  expect(screen.getByText('질문 07')).toBeInTheDocument();
});

it('탭과 그룹을 오가도 저장하지 않은 질문 편집을 유지한다', async () => {
  items = [scenario(), scenario(32, 2)];
  saved.definition = sevenStages();
  const user = await open();
  await user.click(await screen.findByRole('button', { name: '질문 설정' }));
  await user.clear(screen.getByLabelText('질문 1 문구'));
  await user.type(screen.getByLabelText('질문 1 문구'), '저장하지 않은 문구');
  await user.click(screen.getByRole('tab', { name: '시나리오 2' }));
  await screen.findByRole('heading', { name: '질문 문구 1' });
  await user.click(screen.getByRole('tab', { name: '시나리오 1' }));
  expect(screen.getByLabelText('질문 1 문구')).toHaveValue('저장하지 않은 문구');
  await user.selectOptions(screen.getByLabelText('시나리오 속성 그룹'), '8');
  await screen.findByText('아직 등록된 시나리오가 없습니다.');
  await user.selectOptions(screen.getByLabelText('시나리오 속성 그룹'), '7');
  expect(screen.getByLabelText('질문 1 문구')).toHaveValue('저장하지 않은 문구');
});

it('선택지 문구를 바꿔도 기존 choiceId와 분기 참조를 유지한다', async () => {
  const user = await openGraph();
  await user.click(screen.getByRole('button', { name: '질문 설정' }));
  await user.clear(screen.getByLabelText('질문 1 선택지 2 문구'));
  await user.type(screen.getByLabelText('질문 1 선택지 2 문구'), '새로운 표시 문구');
  await user.click(screen.getByRole('button', { name: '시나리오 저장' }));
  await waitFor(() => expect(writes).toHaveLength(1));
  expect(writes[0]!.questions[0]!.inputConfig.choices?.[1]?.id).toBe('expert');
  expect(
    writes[0]!.transitions.find((t) => t.fromQuestionId === 1 && t.predicate.operator === 'EQ')
      ?.predicate.value
  ).toBe('expert');
});

it('숫자 범위를 JSON 숫자로 전송하고 설정한 간격에서 벗어나면 전송하지 않는다', async () => {
  items = [scenario()];
  saved.definition = sevenStages();
  saved.definition.questions[0] = {
    ...saved.definition.questions[0]!,
    sourceKind: 'ABV',
    attributeId: null,
    inputKind: 'NUMBER_RANGE',
    inputConfig: { allowAny: true, min: 0, max: 100, step: 5, unit: '%' },
  };
  saved.definition.transitions = saved.definition.transitions.filter((t) => t.fromQuestionId !== 1);
  saved.definition.transitions.push({
    id: 999,
    fromQuestionId: 1,
    priority: 1,
    predicate: { operator: 'ALWAYS' },
    targetKind: 'QUESTION',
    targetQuestionId: 2,
  });
  const user = await open();
  const minimum = await screen.findByLabelText('질문 문구 1 최솟값');
  const maximum = screen.getByLabelText('질문 문구 1 최댓값');
  await user.clear(maximum);
  await user.type(maximum, '0');
  expect(screen.getByLabelText('질문 문구 1 최댓값 조절')).toHaveValue('0');
  await user.clear(minimum);
  await user.type(minimum, '12');
  await user.clear(maximum);
  await user.type(maximum, '30');
  await user.click(screen.getByRole('button', { name: '범위 적용' }));
  expect(previews.every((p) => p.answers.length === 0)).toBe(true);
  await user.clear(minimum);
  await user.type(minimum, '10');
  await user.click(screen.getByRole('button', { name: '범위 적용' }));
  await waitFor(() =>
    expect(
      previews.some((p) =>
        p.answers.some((a) => a.kind === 'NUMBER_RANGE' && a.min === 10 && a.max === 30)
      )
    ).toBe(true)
  );
});

it('종료 규칙에 도달하면 완료 상태를 표시하고 처음부터 다시 시작한다', async () => {
  const user = await openGraph();
  await user.click(
    await within(card('질문 문구 1')).findByRole('button', { name: '경험 있음 · 20개' })
  );
  for (const q of [3, 42, 6, 7])
    await user.click(
      await within(card(`질문 문구 ${q}`)).findByRole('button', { name: '경험 있음 · 20개' })
    );
  expect(await screen.findByText('시나리오가 완료되었습니다.')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '처음부터' }));
  expect(
    await within(card('질문 문구 1')).findByRole('button', { name: '처음 · 10개' })
  ).toBeEnabled();
  expect(card('질문 문구 3')).toBeDisabled();
});

it('추천 근거는 선택한 값만 표시하고 가격 단위를 붙인다', async () => {
  server.use(
    http.post(`${base}/:scenarioId/versions/:versionId/preview`, () =>
      HttpResponse.json(
        wrap(
          {
            path: [1, 3],
            nextQuestionId: 3,
            completed: false,
            answers: [{ questionId: 1, kind: 'CHOICE', choiceId: 'first' }],
            discardedQuestionIds: [],
            contributions: [
              {
                questionId: 1,
                source: 'ATTRIBUTE',
                attributeId: 11,
                operator: 'EQ',
                value: '처음',
              },
              {
                questionId: 2,
                source: 'ATTRIBUTE',
                attributeId: 13,
                operator: 'LTE',
                value: '15000',
              },
            ],
            candidates: {
              totalCount: 1,
              attributeDefinitions: [
                { attributeId: 11, displayName: '경험', unit: null },
                { attributeId: 13, displayName: '잔 참고 가격', unit: '원' },
              ],
              items: [
                {
                  alcoholId: 1,
                  korName: '추천 위스키',
                  categoryGroup: 'SINGLE_MALT',
                  abv: 40,
                  attributes: [
                    { attributeId: 11, values: ['처음', '경험 있음'] },
                    { attributeId: 13, values: ['12000', '20000'] },
                  ],
                },
              ],
              facets: null,
            },
          },
          { hasNext: false }
        )
      )
    )
  );
  await openGraph();
  const result = screen.getByRole('region', { name: '추천 후보' });
  expect(await within(result).findByText('경험: 처음')).toBeInTheDocument();
  expect(within(result).getByText('잔 참고 가격: 12,000원')).toBeInTheDocument();
  expect(within(result).queryByText('경험: 경험 있음')).not.toBeInTheDocument();
  expect(within(result).queryByText('잔 참고 가격: 20,000원')).not.toBeInTheDocument();
  expect(within(result).getByText('적용한 답변')).toBeInTheDocument();
});
