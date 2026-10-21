import { AttributeValueInput } from './AttributeValueInput';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AlcoholAttribute, AttributeSearchCondition } from '@/types/api/alcohol-attribute.api';
import {
  allowedOperators,
  conditionError,
  requiresSearchValue,
  searchOperators,
  searchValueForOperator,
} from './attribute-search';

const schema = z.object({
  key: z.string().min(1, '속성을 선택하세요.'),
  operator: z.enum([
    'EQ',
    'NE',
    'GT',
    'GTE',
    'LT',
    'LTE',
    'CONTAINS',
    'EXISTS',
    'NOT_EXISTS',
    'BETWEEN',
  ]),
  value: z.string().trim(),
  upper: z.string().trim(),
});
type Values = z.infer<typeof schema>;
const selectClass =
  'h-8 min-w-0 rounded-md border bg-white px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700';

export function GraphConditionForm({
  attributes,
  onAdd,
  disabled,
  conditionCount,
  initialCondition,
}: {
  attributes: AlcoholAttribute[];
  onAdd: (conditions: AttributeSearchCondition[]) => void;
  disabled: boolean;
  conditionCount: number;
  initialCondition?: AttributeSearchCondition;
}) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      key: initialCondition?.key ?? '',
      operator: initialCondition?.operator ?? 'EQ',
      value: initialCondition?.value ?? '',
      upper: '',
    },
  });
  const [error, setError] = useState('');
  const key = useWatch({ control: form.control, name: 'key' });
  const operator = useWatch({ control: form.control, name: 'operator' });
  const attribute = attributes.find((a) => a.key === key);
  const numeric = attribute?.datatype === 'INT' || attribute?.datatype === 'DOUBLE';
  const needsValue = operator === 'BETWEEN' || requiresSearchValue(operator);
  const submit = form.handleSubmit((data) => {
    const conditions: AttributeSearchCondition[] =
      data.operator === 'BETWEEN'
        ? [
            { key: data.key, operator: 'GTE', value: data.value },
            { key: data.key, operator: 'LTE', value: data.upper },
          ]
        : [
            {
              key: data.key,
              operator: data.operator,
              ...(requiresSearchValue(data.operator) ? { value: data.value } : {}),
            },
          ];
    const invalid = conditions.map((c) => conditionError(c, attribute)).find(Boolean);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (data.operator === 'BETWEEN' && Number(data.value) > Number(data.upper)) {
      setError('최솟값은 최댓값보다 클 수 없습니다.');
      return;
    }
    if (conditionCount + conditions.length > 20) {
      setError('조건은 최대 20개입니다. 범위는 조건 2개를 사용합니다.');
      return;
    }
    setError('');
    onAdd(conditions);
  });
  return (
    <form onSubmit={submit} aria-label="그래프 조건 추가" className="space-y-4">
      <fieldset disabled={disabled} className="attribute-condition-form">
        <label>
          <span>속성</span>
          <select
            aria-label="추가할 속성"
            className={selectClass}
            {...form.register('key', {
              onChange: (event) => {
                const next = attributes.find((a) => a.key === event.target.value);
                form.setValue(
                  'operator',
                  next?.datatype === 'INT' || next?.datatype === 'DOUBLE' ? 'GTE' : 'EQ'
                );
                form.setValue('value', '');
                form.setValue('upper', '');
                setError('');
              },
            })}
          >
            <option value="">속성을 선택하세요</option>
            {attributes.map((a) => (
              <option key={a.id} value={a.key}>
                {a.displayName}
                {a.unit ? ` (${a.unit})` : ''}
              </option>
            ))}
          </select>
        </label>
        {attribute && (
          <>
            <label>
              <span>연산자</span>
              <select
                aria-label="추가 조건 연산자"
                value={operator}
                className={selectClass}
                {...form.register('operator', {
                  onChange: (event) => {
                    if (event.target.value !== 'BETWEEN')
                      form.setValue(
                        'value',
                        searchValueForOperator(
                          event.target.value,
                          form.getValues('value'),
                          attribute
                        ) ?? ''
                      );
                    setError('');
                  },
                })}
              >
                {allowedOperators(attribute.datatype).map((op) => (
                  <option key={op} value={op}>
                    {searchOperators[op]}
                  </option>
                ))}
                {numeric && <option value="BETWEEN">범위 (이상 ~ 이하)</option>}
              </select>
            </label>
            {needsValue && (
              <span className="text-sm text-slate-600">
                {operator === 'BETWEEN' ? '범위' : '값'}
                {attribute.unit ? ` (${attribute.unit})` : ''}
              </span>
            )}
            {needsValue &&
              (attribute.datatype === 'BOOLEAN' ? (
                <select
                  aria-label="추가 조건 값"
                  className={selectClass}
                  {...form.register('value')}
                >
                  <option value="">값 선택</option>
                  <option value="true">예</option>
                  <option value="false">아니오</option>
                </select>
              ) : (
                <AttributeValueInput
                  allowedValues={
                    attribute.datatype === 'STRING' && operator !== 'CONTAINS'
                      ? attribute.allowedValues
                      : null
                  }
                  aria-label={operator === 'BETWEEN' ? '최솟값' : '추가 조건 값'}
                  className="h-8 w-32 bg-white text-xs"
                  inputMode={numeric ? 'decimal' : 'text'}
                  placeholder={operator === 'BETWEEN' ? '최솟값' : '값 입력'}
                  {...form.register('value')}
                />
              ))}
            {operator === 'BETWEEN' && (
              <>
                <span className="text-sm text-slate-500">최댓값까지 포함</span>
                <Input
                  aria-label="최댓값"
                  className="h-8 w-32 bg-white text-xs"
                  inputMode="decimal"
                  placeholder="최댓값"
                  {...form.register('upper')}
                />
              </>
            )}

            <Button type="submit" size="sm" disabled={disabled}>
              {initialCondition ? '조건 수정' : '조건 추가'}
            </Button>
          </>
        )}
      </fieldset>
      {(error || form.formState.errors.key) && (
        <p role="alert" className="text-xs text-red-700">
          {error || form.formState.errors.key?.message}
        </p>
      )}
    </form>
  );
}
