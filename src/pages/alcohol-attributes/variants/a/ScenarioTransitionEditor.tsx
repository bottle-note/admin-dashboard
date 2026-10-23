import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ScenarioEditorValues } from './ScenarioQuestionEditor';

export function ScenarioTransitionEditor({
  questionIndex,
  allocateId,
}: {
  questionIndex: number;
  allocateId: () => number;
}) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ScenarioEditorValues>();
  const name = `questions.${questionIndex}.transitions` as const;
  const { fields, append, remove, move } = useFieldArray({ control, name });
  const questions = useWatch({ control, name: 'questions' });
  const current = questions[questionIndex]!;
  const rules = useWatch({ control, name });
  const selectClass = 'w-full min-w-0 rounded-md border bg-white px-3 py-2 text-sm';
  return (
    <div className="space-y-3 border-t pt-3">
      <p className="text-xs leading-5 text-slate-500">
        조건을 위에서부터 확인합니다. 그 외 답변은 마지막 규칙으로 진행하며, 규칙이 없으면 다음
        단계로 연결해 저장합니다.
      </p>
      {fields.map((field, i) => {
        const prefix = `${name}.${i}` as const;
        const operator = rules[i]?.operator;
        const at = `질문 ${questionIndex + 1} 이동 조건 ${i + 1}`;
        return (
          <div key={field.id} className="space-y-2 rounded-lg border bg-slate-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs">이동 조건 {i + 1}</span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={!i}
                  onClick={() => move(i, i - 1)}
                >
                  위로
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={`${at} 삭제`}
                  onClick={() => remove(i)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <label className="block space-y-1 text-xs">
              <span>답변 조건</span>
              <select
                aria-label={`${at} 비교`}
                className={selectClass}
                {...register(`${prefix}.operator`)}
              >
                <option value="EQ" disabled={current.inputKind !== 'SINGLE_CHOICE'}>
                  답변이 같을 때
                </option>
                <option value="GTE" disabled={current.inputKind !== 'NUMBER_RANGE'}>
                  범위의 최솟값이 이 값 이상일 때
                </option>
                <option value="LTE" disabled={current.inputKind !== 'NUMBER_RANGE'}>
                  범위의 최댓값이 이 값 이하일 때
                </option>
                <option value="ALWAYS">그 외 답변</option>
              </select>
            </label>
            {operator !== 'ALWAYS' && (
              <label className="block space-y-1 text-xs">
                <span>비교할 답변</span>
                {operator === 'EQ' ? (
                  <select
                    aria-label={`${at} 답변`}
                    className={selectClass}
                    {...register(`${prefix}.value`)}
                  >
                    <option value="">선택지를 선택하세요</option>
                    {current.choices.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    aria-label={`${at} 답변`}
                    type="number"
                    step="any"
                    {...register(`${prefix}.value`)}
                  />
                )}
              </label>
            )}
            <label className="block space-y-1 text-xs">
              <span>이동할 질문</span>
              <select
                aria-label={`${at} 이동`}
                className={selectClass}
                {...register(`${prefix}.targetQuestionId`)}
              >
                <option value="">이동할 질문을 선택하세요</option>
                {questions
                  .filter((q) => q.stage > current.stage)
                  .map((q) => (
                    <option key={q.questionId} value={q.questionId}>
                      {q.stage}단계 · {q.displayName || '새 질문'}
                    </option>
                  ))}
                <option value="__end__">시나리오 종료</option>
              </select>
            </label>
            {errors.questions?.[questionIndex]?.transitions?.[i] && (
              <p role="alert" className="text-xs text-red-700">
                이동 조건과 대상을 다시 확인하세요.
              </p>
            )}
          </div>
        );
      })}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() =>
          append({
            transitionId: allocateId(),
            operator: current.inputKind === 'NUMBER_RANGE' ? 'GTE' : 'EQ',
            value: '',
            targetQuestionId: '',
          })
        }
      >
        <Plus className="h-4 w-4" />
        이동 조건 추가
      </Button>
    </div>
  );
}
