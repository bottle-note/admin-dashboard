import type { AlcoholAttribute, ScenarioCandidateRequest } from '@/types/api/alcohol-attribute.api';
import type { AlcoholCategory } from '@/types/api';

export type ScenarioAnswer = string | [number, number];
export type ScenarioQuestion =
  | { source: 'attribute'; key: string; attribute: AlcoholAttribute; displayName: string }
  | { source: 'category' | 'tasting' | 'abv'; key: string; displayName: string };
export const ANY_ANSWER = '__any__';
export const isPrice = (key: string) => key === 'mock_scenario_glass_price';
const order = [
  'mock_scenario_whisky_experience',
  'mock_scenario_glass_price',
  'mock_scenario_popularity_preference',
];

export function scenarioQuestions(attributes: AlcoholAttribute[]): ScenarioQuestion[] {
  const rank = (key: string) => (order.includes(key) ? order.indexOf(key) : order.length);
  const questions: ScenarioQuestion[] = [...attributes]
    .sort((a, b) => rank(a.key) - rank(b.key) || a.id - b.id)
    .map((attribute) => ({
      source: 'attribute',
      key: attribute.key,
      displayName: attribute.displayName,
      attribute,
    }));
  if (!questions.length) return questions;
  const popularity = questions.findIndex((q) => q.key === order[2]);
  questions.splice(
    popularity < 0 ? questions.length : popularity,
    0,
    { source: 'category', key: 'base:category', displayName: '어떤 종류를 원하세요?' },
    { source: 'tasting', key: 'base:tasting', displayName: '어떤 향이 좋으세요?' },
    { source: 'abv', key: 'base:abv', displayName: '도수는 어느 정도가 좋으세요?' }
  );
  return questions;
}

export function matchesAnswer(value: string, answer: ScenarioAnswer) {
  if (typeof answer === 'string') return value === answer;
  const amount = value.trim() ? Number(value) : NaN;
  return Number.isFinite(amount) && amount >= answer[0] && amount <= answer[1];
}

export const scenarioAbvRanges = [
  { key: 'light', from: 0, to: 43, label: '가볍게 · 43% 이하' },
  { key: 'balanced', from: 43, to: 50, label: '적당히 · 43~50%' },
  { key: 'strong', from: 50, to: 100, label: '진하게 · 50% 이상' },
];

export function scenarioRequest(
  questions: ScenarioQuestion[],
  answers: ScenarioAnswer[]
): ScenarioCandidateRequest {
  const request: ScenarioCandidateRequest = {
    include: [],
  };
  answers.forEach((answer, index) => {
    const question = questions[index];
    if (!question || answer === ANY_ANSWER) return;
    if (question.source === 'attribute') {
      request.include!.push(
        ...(Array.isArray(answer)
          ? [
              {
                attributeId: question.attribute.id,
                operator: 'GTE' as const,
                value: String(answer[0]),
              },
              {
                attributeId: question.attribute.id,
                operator: 'LTE' as const,
                value: String(answer[1]),
              },
            ]
          : [{ attributeId: question.attribute.id, operator: 'EQ' as const, value: answer }])
      );
    } else if (question.source === 'category') {
      request.categoryGroups = [answer as AlcoholCategory];
    } else if (question.source === 'tasting') {
      request.tastingGroupCodes = [String(answer)];
    } else {
      const range = scenarioAbvRanges.find((r) => r.key === answer);
      if (range) {
        request.abvFrom = range.from;
        request.abvTo = range.to;
      }
    }
  });
  const next = questions[answers.length];
  if (next)
    request.nextQuestion =
      next.source === 'attribute'
        ? { source: 'ATTRIBUTE', attributeId: next.attribute.id }
        : next.source === 'category'
          ? { source: 'CATEGORY' }
          : next.source === 'tasting'
            ? { source: 'TASTING_GROUP' }
            : {
                source: 'ABV',
                ranges: scenarioAbvRanges.map(({ key, from, to }) => ({ key, from, to })),
              };
  return request;
}
