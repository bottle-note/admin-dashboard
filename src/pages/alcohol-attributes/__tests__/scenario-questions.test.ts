import { expect, it } from 'vitest';
import type { ScenarioQuestion } from '../variants/a/scenario-questions';
import { ANY_ANSWER, scenarioRequest } from '../variants/a/scenario-questions';
import type { AlcoholAttribute } from '@/types/api/alcohol-attribute.api';
const questions: ScenarioQuestion[] = [
  {
    source: 'attribute',
    key: 'price',
    displayName: '가격',
    attribute: { id: 7 } as AlcoholAttribute,
  },
  { source: 'category', key: 'category', displayName: '종류' },
  { source: 'tasting', key: 'tasting', displayName: '향' },
  { source: 'abv', key: 'abv', displayName: '도수' },
];
it('가격 범위는 같은 속성의 상한 하한으로 보내고 다음 질문을 집계한다', () => {
  expect(scenarioRequest(questions, [[10000, 30000]])).toEqual({
    include: [
      { attributeId: 7, operator: 'GTE', value: '10000' },
      { attributeId: 7, operator: 'LTE', value: '30000' },
    ],
    nextQuestion: { source: 'CATEGORY' },
  });
});
it('상관없어요는 조건에서 제외한다', () => {
  expect(scenarioRequest(questions.slice(1), [ANY_ANSWER, ANY_ANSWER, ANY_ANSWER])).toEqual({
    include: [],
  });
});
it.each([
  ['light', 0, 43],
  ['balanced', 43, 50],
  ['strong', 50, 100],
] as const)('도수 %s는 API의 포함 범위 %s~%s를 전달한다', (answer, abvFrom, abvTo) => {
  expect(scenarioRequest(questions.slice(1), ['BOURBON', 'FRUIT', answer])).toEqual({
    include: [],
    categoryGroups: ['BOURBON'],
    tastingGroupCodes: ['FRUIT'],
    abvFrom,
    abvTo,
  });
});
