import { useEffect, useRef } from 'react';
import { FormProvider, useFieldArray, useForm, useFormContext, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CATEGORY_GROUP_LABELS } from '@/types/api';
import type { AlcoholAttribute } from '@/types/api/alcohol-attribute.api';
import type { ScenarioDefinition, ScenarioSource } from '@/types/api/alcohol-scenario.api';
import { useTastingGroupList } from '@/hooks/useTastingGroups';
import { ScenarioTransitionEditor } from './ScenarioTransitionEditor';

const rowSchema = z.object({
  questionId: z.number().int(),
  stage: z.number().int().min(1).max(1000),
  source: z.string().min(1, '사용할 속성을 선택하세요.'),
  displayName: z.string().trim().min(1, '질문 문구를 입력하세요.').max(200),
  inputKind: z.enum(['SINGLE_CHOICE', 'NUMBER_RANGE']),
  allowAny: z.boolean(),
  min: z.string(),
  max: z.string(),
  step: z.string(),
  unit: z.string(),
  choices: z
    .array(z.object({ id: z.string().min(1), label: z.string().trim().min(1), value: z.string() }))
    .max(100),
  transitions: z.array(
    z.object({
      transitionId: z.number().int(),
      operator: z.enum(['EQ', 'GTE', 'LTE', 'ALWAYS']),
      value: z.string(),
      targetQuestionId: z.string().min(1),
    })
  ),
});
const editorSchema = z
  .object({ startQuestionId: z.string(), questions: z.array(rowSchema).max(100) })
  .superRefine((data, ctx) => {
    const map = new Map(data.questions.map((q) => [String(q.questionId), q]));
    if (data.startQuestionId && !map.has(data.startQuestionId))
      ctx.addIssue({
        code: 'custom',
        path: ['startQuestionId'],
        message: '시작 질문을 다시 선택하세요.',
      });
    data.questions.forEach((q, i) => {
      const at = ['questions', i];
      if (q.inputKind === 'NUMBER_RANGE') {
        for (const key of ['min', 'max', 'step'] as const)
          if (q[key] && !Number.isFinite(Number(q[key])))
            ctx.addIssue({ code: 'custom', path: [...at, key], message: '숫자를 입력하세요.' });
        if (q.min && q.max && Number(q.min) > Number(q.max))
          ctx.addIssue({
            code: 'custom',
            path: [...at, 'max'],
            message: '최댓값은 최솟값 이상이어야 합니다.',
          });
        if (q.step && Number(q.step) <= 0)
          ctx.addIssue({
            code: 'custom',
            path: [...at, 'step'],
            message: '간격은 0보다 커야 합니다.',
          });
      }
      const conditions = new Set<string>();
      q.transitions.forEach((t, j) => {
        const path = [...at, 'transitions', j];
        if (
          t.targetQuestionId !== '__end__' &&
          (!map.has(t.targetQuestionId) || map.get(t.targetQuestionId)!.stage <= q.stage)
        )
          ctx.addIssue({
            code: 'custom',
            path: [...path, 'targetQuestionId'],
            message: '뒤 단계의 질문 또는 시나리오 종료를 선택하세요.',
          });
        if (t.operator === 'ALWAYS' && j !== q.transitions.length - 1)
          ctx.addIssue({
            code: 'custom',
            path: [...path, 'operator'],
            message: '그 외 답변 규칙은 마지막에 두세요.',
          });
        if (
          t.operator === 'EQ' &&
          (q.inputKind !== 'SINGLE_CHOICE' || !q.choices.some((c) => c.id === t.value))
        )
          ctx.addIssue({
            code: 'custom',
            path: [...path, 'value'],
            message: '이 질문의 선택지를 다시 선택하세요.',
          });
        if (
          ['GTE', 'LTE'].includes(t.operator) &&
          (q.inputKind !== 'NUMBER_RANGE' || !t.value.trim() || !Number.isFinite(Number(t.value)))
        )
          ctx.addIssue({
            code: 'custom',
            path: [...path, 'value'],
            message: '범위형 질문의 숫자 조건을 입력하세요.',
          });
        const condition = `${t.operator}:${t.operator === 'ALWAYS' ? '' : t.value}`;
        if (conditions.has(condition))
          ctx.addIssue({
            code: 'custom',
            path: [...path, 'operator'],
            message: '같은 이동 조건이 이미 있습니다.',
          });
        conditions.add(condition);
      });
    });
  });
export type ScenarioEditorValues = z.infer<typeof editorSchema>;
const selectClass = 'min-w-0 w-full rounded-md border bg-white px-3 py-2 text-sm';
const sourceKind = (value: string): ScenarioSource =>
  value.startsWith('attribute:')
    ? 'ATTRIBUTE'
    : value === 'base:category'
      ? 'CATEGORY'
      : value === 'base:tasting'
        ? 'TASTING_GROUP'
        : 'ABV';

function initialValues(definition: ScenarioDefinition): ScenarioEditorValues {
  return {
    startQuestionId: definition.startQuestionId === null ? '' : String(definition.startQuestionId),
    questions: definition.questions.map((q) => ({
      questionId: q.id,
      stage: definition.stages.find((s) => s.id === q.stageId)?.position ?? 1,
      source:
        q.sourceKind === 'ATTRIBUTE'
          ? `attribute:${q.attributeId}`
          : q.sourceKind === 'CATEGORY'
            ? 'base:category'
            : q.sourceKind === 'TASTING_GROUP'
              ? 'base:tasting'
              : 'base:abv',
      displayName: q.title,
      inputKind: q.inputKind,
      allowAny: q.inputConfig.allowAny,
      min: String(q.inputConfig.min ?? ''),
      max: String(q.inputConfig.max ?? ''),
      step: String(q.inputConfig.step ?? ''),
      unit: q.inputConfig.unit ?? '',
      choices: (q.inputConfig.choices ?? []).map((c) => ({ ...c, value: String(c.value) })),
      transitions: definition.transitions
        .filter((t) => t.fromQuestionId === q.id)
        .sort((a, b) => a.priority - b.priority)
        .map((t) => ({
          transitionId: t.id,
          operator: t.predicate.operator,
          value: String(t.predicate.value ?? ''),
          targetQuestionId: t.targetQuestionId === null ? '__end__' : String(t.targetQuestionId),
        })),
    })),
  };
}

export function ScenarioQuestionEditor({
  definition,
  attributes,
  onSave,
  onCancel,
  saving,
  error,
}: {
  definition: ScenarioDefinition;
  attributes: AlcoholAttribute[];
  onSave: (definition: ScenarioDefinition) => void;
  onCancel?: () => void;
  saving: boolean;
  error?: string;
}) {
  const groups = useTastingGroupList();
  const next = useRef(
    Math.min(
      0,
      ...definition.stages.map((s) => s.id),
      ...definition.questions.map((q) => q.id),
      ...definition.transitions.map((t) => t.id)
    ) - 1
  );
  const form = useForm<ScenarioEditorValues>({
    resolver: zodResolver(editorSchema),
    defaultValues: initialValues(definition),
  });
  const {
    register,
    control,
    setValue,
    setError,
    handleSubmit,
    formState: { errors, isDirty },
  } = form;
  const { fields, append, remove, move } = useFieldArray({ control, name: 'questions' });
  const drafts = useWatch({ control, name: 'questions' });
  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);
  function changeSource(index: number, value: string) {
    const attr = attributes.find((a) => value === `attribute:${a.id}`);
    const numeric = value === 'base:abv' || attr?.datatype === 'INT' || attr?.datatype === 'DOUBLE';
    const choices = attr
      ? (attr.datatype === 'BOOLEAN' ? ['true', 'false'] : (attr.allowedValues ?? [])).map(
          (value) => ({ id: crypto.randomUUID(), label: value, value })
        )
      : value === 'base:category'
        ? Object.entries(CATEGORY_GROUP_LABELS).map(([value, label]) => ({
            id: crypto.randomUUID(),
            label,
            value,
          }))
        : value === 'base:tasting'
          ? (groups.data?.groups ?? []).map((g) => ({
              id: crypto.randomUUID(),
              label: g.name,
              value: g.code,
            }))
          : [];
    setValue(
      `questions.${index}.displayName`,
      attr?.displayName ??
        (value === 'base:category'
          ? '어떤 종류를 원하세요?'
          : value === 'base:tasting'
            ? '어떤 향이 좋으세요?'
            : '도수는 어느 정도가 좋으세요?'),
      { shouldDirty: true }
    );
    setValue(`questions.${index}.inputKind`, numeric ? 'NUMBER_RANGE' : 'SINGLE_CHOICE');
    setValue(`questions.${index}.choices`, choices);
    setValue(`questions.${index}.min`, numeric ? '0' : '');
    setValue(`questions.${index}.max`, value === 'base:abv' ? '100' : '');
    setValue(`questions.${index}.step`, numeric ? '1' : '');
    setValue(
      `questions.${index}.unit`,
      numeric ? (attr?.unit ?? (value === 'base:abv' ? '%' : '')) : ''
    );
    setValue(
      `questions.${index}.transitions`,
      form.getValues(`questions.${index}.transitions`).map((t) => ({
        ...t,
        operator:
          t.operator === 'ALWAYS'
            ? ('ALWAYS' as const)
            : numeric
              ? ('GTE' as const)
              : ('EQ' as const),
        value: '',
      })),
      { shouldDirty: true }
    );
  }
  function submit(values: ScenarioEditorValues) {
    const positions = [...new Set(values.questions.map((q) => q.stage))].sort((a, b) => a - b);
    if (positions.length > 50) {
      setError('root', { message: '단계는 최대 50개입니다.' });
      return;
    }
    const stages = positions.map((position) => ({
      id: definition.stages.find((s) => s.position === position)?.id ?? next.current--,
      position,
    }));
    const orders = new Map<number, number>();
    const questions: ScenarioDefinition['questions'] = [];
    for (const [index, q] of values.questions.entries()) {
      const attr = attributes.find((a) => q.source === `attribute:${a.id}`);
      const kind = sourceKind(q.source);
      const choices = [];
      for (const [choiceIndex, c] of q.choices.entries()) {
        let value: string | number | boolean = c.value;
        if (kind === 'ABV' || attr?.datatype === 'INT' || attr?.datatype === 'DOUBLE') {
          if (
            !c.value.trim() ||
            !Number.isFinite(Number(c.value)) ||
            (attr?.datatype === 'INT' && !Number.isSafeInteger(Number(c.value)))
          ) {
            setError(`questions.${index}.choices.${choiceIndex}.value`, {
              message: '자료형에 맞는 숫자를 입력하세요.',
            });
            return;
          }
          value = Number(c.value);
        } else if (attr?.datatype === 'BOOLEAN') {
          if (!['true', 'false'].includes(c.value)) {
            setError(`questions.${index}.choices.${choiceIndex}.value`, {
              message: 'true 또는 false를 입력하세요.',
            });
            return;
          }
          value = c.value === 'true';
        }
        choices.push({ ...c, value });
      }
      orders.set(q.stage, (orders.get(q.stage) ?? 0) + 1);
      questions.push({
        id: q.questionId,
        stageId: stages.find((s) => s.position === q.stage)!.id,
        branchOrder: orders.get(q.stage)!,
        title: q.displayName,
        sourceKind: kind,
        attributeId: kind === 'ATTRIBUTE' ? Number(q.source.split(':')[1]) : null,
        inputKind: q.inputKind,
        inputConfig:
          q.inputKind === 'SINGLE_CHOICE'
            ? { allowAny: q.allowAny, choices }
            : {
                allowAny: q.allowAny,
                min: q.min ? Number(q.min) : null,
                max: q.max ? Number(q.max) : null,
                step: q.step ? Number(q.step) : null,
                unit: q.unit || null,
              },
      });
    }
    const transitions: ScenarioDefinition['transitions'] = [];
    for (const q of values.questions) {
      const rules = [...q.transitions];
      if (!rules.some((t) => t.operator === 'ALWAYS')) {
        const nextStage = positions.find((p) => p > q.stage);
        const target = values.questions.find((item) => item.stage === nextStage);
        rules.push({
          transitionId: next.current--,
          operator: 'ALWAYS',
          value: '',
          targetQuestionId: target ? String(target.questionId) : '__end__',
        });
      }
      for (const [i, t] of rules.entries())
        transitions.push({
          id: t.transitionId,
          fromQuestionId: q.questionId,
          priority: i + 1,
          predicate:
            t.operator === 'ALWAYS'
              ? { operator: 'ALWAYS' }
              : { operator: t.operator, value: t.operator === 'EQ' ? t.value : Number(t.value) },
          targetKind: t.targetQuestionId === '__end__' ? 'END' : 'QUESTION',
          targetQuestionId: t.targetQuestionId === '__end__' ? null : Number(t.targetQuestionId),
        });
    }
    if (transitions.length > 500) {
      setError('root', { message: '이동 규칙은 최대 500개입니다.' });
      return;
    }
    onSave({
      definitionSchemaVersion: 1,
      startQuestionId: values.startQuestionId ? Number(values.startQuestionId) : null,
      stages,
      questions,
      transitions,
    });
  }
  return (
    <FormProvider {...form}>
      <form
        aria-label="시나리오 질문 설정"
        className="space-y-4"
        onSubmit={(event) => void handleSubmit(submit)(event)}
      >
        <fieldset disabled={saving} className="min-w-0 space-y-4">
          <div>
            <h4 className="font-semibold">질문 설정</h4>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              같은 단계 번호의 질문은 나란히 표시됩니다. 같은 속성도 여러 질문에서 사용할 수
              있습니다. 이동 조건을 생략하면 다음 단계의 첫 질문으로 이어집니다.
            </p>
          </div>
          <label className="block space-y-1 text-sm">
            <span>시작 질문</span>
            <select className={selectClass} {...register('startQuestionId')}>
              <option value="">시작 질문 미정</option>
              {drafts.map((q, i) => (
                <option key={q.questionId} value={q.questionId}>
                  {i + 1}. {q.displayName || '새 질문'}
                </option>
              ))}
            </select>
          </label>
          {errors.startQuestionId && <p role="alert">{errors.startQuestionId.message}</p>}
          {!fields.length && (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-slate-500">
              아직 설정한 속성과 질문이 없습니다.
            </p>
          )}
          {fields.map((field, index) => (
            <fieldset key={field.id} className="min-w-0 space-y-3 rounded-lg border bg-white p-4">
              <legend className="px-1 text-xs font-medium text-blue-700">질문 {index + 1}</legend>
              <div className="flex justify-end gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={`질문 ${index + 1} 위로`}
                  disabled={!index}
                  onClick={() => move(index, index - 1)}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={`질문 ${index + 1} 아래로`}
                  disabled={index === fields.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={`질문 ${index + 1} 삭제`}
                  onClick={() => {
                    remove(index);
                    if (form.getValues('startQuestionId') === String(field.questionId))
                      setValue('startQuestionId', '');
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <label className="block space-y-1 text-sm">
                <span>단계 번호</span>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  aria-label={`질문 ${index + 1} 단계`}
                  {...register(`questions.${index}.stage`, { valueAsNumber: true })}
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span>사용할 속성</span>
                <select
                  className={selectClass}
                  aria-label={`질문 ${index + 1} 속성`}
                  {...register(`questions.${index}.source`, {
                    onChange: (e) => changeSource(index, e.target.value),
                  })}
                >
                  <option value="">속성을 선택하세요</option>
                  <optgroup label="그룹 속성">
                    {attributes.map((a) => (
                      <option key={a.id} value={`attribute:${a.id}`}>
                        {a.displayName}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="위스키 기본 정보">
                    <option value="base:category">위스키 종류</option>
                    <option value="base:tasting">향 그룹</option>
                    <option value="base:abv">도수</option>
                  </optgroup>
                </select>
              </label>
              <label className="block space-y-1 text-sm">
                <span>질문 문구</span>
                <Input
                  aria-label={`질문 ${index + 1} 문구`}
                  maxLength={200}
                  {...register(`questions.${index}.displayName`)}
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span>답변 방식</span>
                <select
                  className={selectClass}
                  aria-label={`질문 ${index + 1} 답변 방식`}
                  {...register(`questions.${index}.inputKind`)}
                >
                  <option value="SINGLE_CHOICE">하나 선택</option>
                  <option
                    value="NUMBER_RANGE"
                    disabled={
                      drafts[index]?.source !== 'base:abv' &&
                      !attributes.some(
                        (a) =>
                          drafts[index]?.source === `attribute:${a.id}` &&
                          ['INT', 'DOUBLE'].includes(a.datatype)
                      )
                    }
                  >
                    숫자 범위
                  </option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register(`questions.${index}.allowAny`)} />
                상관없어요 허용
              </label>
              {drafts[index]?.inputKind === 'NUMBER_RANGE' ? (
                <div className="grid grid-cols-2 gap-3">
                  {(['min', 'max', 'step', 'unit'] as const).map((key) => (
                    <label key={key} className="min-w-0 space-y-1 text-sm">
                      <span>
                        {{ min: '최솟값', max: '최댓값', step: '간격', unit: '단위' }[key]}
                      </span>
                      <Input
                        aria-label={`질문 ${index + 1} ${key}`}
                        type={key === 'unit' ? 'text' : 'number'}
                        step="any"
                        {...register(`questions.${index}.${key}`)}
                      />
                    </label>
                  ))}
                </div>
              ) : (
                <QuestionChoices index={index} />
              )}
              <ScenarioTransitionEditor questionIndex={index} allocateId={() => next.current--} />
              {errors.questions?.[index] && (
                <p role="alert" className="text-sm text-red-700">
                  {form.formState.errors.questions?.[index]?.source?.message ??
                    form.formState.errors.questions?.[index]?.displayName?.message ??
                    '질문·선택지·범위 또는 이동 조건을 확인하세요.'}
                </p>
              )}
            </fieldset>
          ))}
          <Button
            type="button"
            variant="outline"
            disabled={fields.length >= 100}
            onClick={() => {
              const id = next.current--;
              append({
                questionId: id,
                stage: Math.max(0, ...drafts.map((q) => q.stage)) + 1,
                source: '',
                displayName: '',
                inputKind: 'SINGLE_CHOICE',
                allowAny: true,
                min: '',
                max: '',
                step: '',
                unit: '',
                choices: [],
                transitions: [],
              });
              if (!form.getValues('startQuestionId')) setValue('startQuestionId', String(id));
            }}
          >
            <Plus className="h-4 w-4" />
            질문 추가
          </Button>
          {(error || errors.root) && (
            <p role="alert" className="text-sm text-red-700">
              {error ?? errors.root?.message}
            </p>
          )}
          <div className="flex flex-wrap gap-2 border-t pt-4">
            <Button type="submit">{saving ? '저장 중…' : '시나리오 저장'}</Button>
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel}>
                취소
              </Button>
            )}
            <span className="self-center text-xs text-slate-500">
              {isDirty ? '저장하지 않은 변경사항이 있습니다.' : '저장된 질문 설정입니다.'}
            </span>
          </div>
        </fieldset>
      </form>
    </FormProvider>
  );
}

function QuestionChoices({ index }: { index: number }) {
  const { control, register } = useFormContext<ScenarioEditorValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `questions.${index}.choices`,
    keyName: 'formKey',
  });
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500">
        선택지 문구와 실제 검색 값을 설정하세요. 문구를 바꿔도 분기 연결은 유지됩니다.
      </p>
      {fields.map((field, i) => (
        <div
          key={field.formKey}
          className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2"
        >
          <Input
            aria-label={`질문 ${index + 1} 선택지 ${i + 1} 문구`}
            placeholder="선택지 문구"
            {...register(`questions.${index}.choices.${i}.label`)}
          />
          <Input
            aria-label={`질문 ${index + 1} 선택지 ${i + 1} 값`}
            placeholder="검색 값"
            {...register(`questions.${index}.choices.${i}.value`)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`질문 ${index + 1} 선택지 ${i + 1} 삭제`}
            onClick={() => remove(i)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={fields.length >= 100}
        onClick={() => append({ id: crypto.randomUUID(), label: '', value: '' })}
      >
        선택지 추가
      </Button>
    </div>
  );
}
