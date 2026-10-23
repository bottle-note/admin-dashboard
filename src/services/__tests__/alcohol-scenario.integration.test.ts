import { expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { alcoholScenarioService as service } from '../alcohol-scenario.service';

const base = '/admin/api/v1/attribute/groups/7/scenarios';
const wrap = (data: unknown, meta = {}) => ({ success: true, code: 200, data, errors: [], meta });

it('그룹별 목록과 빈 초안 생성 응답을 반환한다', async () => {
  server.use(
    http.get(base, () => HttpResponse.json(wrap([]))),
    http.post(base, async ({ request }) => {
      expect(await request.json()).toEqual({ title: '시나리오 2', slot: 2 });
      return HttpResponse.json(wrap({ scenario: { id: 31, slot: 2 }, versions: [{ id: 51 }] }));
    })
  );
  expect(await service.list(7)).toEqual([]);
  expect(await service.create(7, { title: '시나리오 2', slot: 2 })).toEqual({
    scenario: { id: 31, slot: 2 },
    versions: [{ id: 51 }],
  });
});

it('초안 저장에 revision과 임시 ID를 보내고 서버가 발급한 정의를 반환한다', async () => {
  const definition = {
    definitionSchemaVersion: 1 as const,
    startQuestionId: null,
    stages: [],
    questions: [],
    transitions: [],
  };
  server.use(
    http.put(`${base}/31/versions/51`, async ({ request }) => {
      expect(await request.json()).toEqual({ expectedLockVersion: 3, definition });
      return HttpResponse.json(wrap({ version: { id: 51, lockVersion: 4 }, definition }));
    })
  );
  expect(
    (await service.save(7, 31, 51, { expectedLockVersion: 3, definition })).version.lockVersion
  ).toBe(4);
});

it('미리보기의 질문별 답변·변경 질문·과거 카드와 페이징 메타를 보존한다', async () => {
  const input = {
    expectedLockVersion: 4,
    answers: [{ questionId: 91, kind: 'CHOICE' as const, choiceId: 'experienced' }],
    changedQuestionId: 91,
    viewQuestionId: 91,
    page: 1,
    size: 25,
  };
  server.use(
    http.post(`${base}/31/versions/51/preview`, async ({ request }) => {
      expect(await request.json()).toEqual(input);
      return HttpResponse.json(
        wrap(
          { path: [91, 93], discardedQuestionIds: [92], candidates: { items: [], totalCount: 30 } },
          { page: 1, size: 25, hasNext: false, totalElements: 30, totalPages: 2 }
        )
      );
    })
  );
  const result = await service.preview(7, 31, 51, input);
  expect(result.data.path).toEqual([91, 93]);
  expect(result.data.discardedQuestionIds).toEqual([92]);
  expect(result.meta.page).toBe(1);
});

it('저장 충돌을 성공 응답처럼 취급하거나 자동 재시도하지 않는다', async () => {
  let calls = 0;
  server.use(
    http.put(`${base}/31/versions/51`, () => {
      calls++;
      return HttpResponse.json(
        { success: false, code: 409, errors: [{ message: '다른 관리자가 수정했습니다.' }] },
        { status: 409 }
      );
    })
  );
  await expect(
    service.save(7, 31, 51, {
      expectedLockVersion: 0,
      definition: {
        definitionSchemaVersion: 1,
        startQuestionId: null,
        stages: [],
        questions: [],
        transitions: [],
      },
    })
  ).rejects.toMatchObject({ code: 409 });
  expect(calls).toBe(1);
});
