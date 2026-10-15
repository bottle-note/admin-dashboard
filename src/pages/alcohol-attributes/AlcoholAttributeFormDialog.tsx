/**
 * 위스키 속성 추가·수정 다이얼로그
 * - row가 있으면 수정 모드. 항목(key)은 바꿀 수 없으므로 텍스트로만 보여준다.
 * - 추가 모드는 선택한 위스키 가운데 대상을 체크로 고른다(기본 전체).
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/common/FormField';
import { fieldErrorProps } from '@/lib/form';
import {
  useAlcoholAttributeCreate,
  useAlcoholAttributeEnums,
  useAlcoholAttributeKeyStats,
  useAlcoholAttributeKeywords,
  useAlcoholAttributeUpdate,
} from '@/hooks/useAlcoholAttributes';
import type {
  AlcoholAttributeDatatype,
  AlcoholAttributeRow,
  AlcoholAttributeType,
} from '@/types/api';
import {
  attributeFormDefaultValues,
  attributeFormSchema,
  isNumericDatatype,
  normalizeKey,
  rowToFormValues,
  toBasedAtPayload,
  type AttributeFormValues,
} from './alcohol-attribute.schema';
import type { SelectedWhisky } from './AlcoholAttributeList';

interface AlcoholAttributeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 추가 모드의 대상 후보 (선택한 위스키) */
  whiskies: SelectedWhisky[];
  /** 수정 대상. 없으면 추가 모드 */
  row?: AlcoholAttributeRow | null;
}

const FIELD_ID = {
  key: 'alcohol-attribute-key',
  type: 'alcohol-attribute-type',
  datatype: 'alcohol-attribute-datatype',
  value: 'alcohol-attribute-value',
  description: 'alcohol-attribute-description',
  basedAt: 'alcohol-attribute-based-at',
} as const;
const KEY_LIST_ID = 'alcohol-attribute-key-options';
const KEYWORD_LIST_ID = 'alcohol-attribute-keyword-options';

export function AlcoholAttributeFormDialog({
  open,
  onOpenChange,
  whiskies,
  row,
}: AlcoholAttributeFormDialogProps) {
  const isEdit = Boolean(row);
  const { data: enums } = useAlcoholAttributeEnums();
  const { data: keyStats = [] } = useAlcoholAttributeKeyStats();
  const { data: keywords = [] } = useAlcoholAttributeKeywords();
  const typeOptions = enums?.types ?? [];
  const datatypeOptions = enums?.datatypes ?? [];

  const [targetIds, setTargetIds] = useState<number[]>([]);

  const form = useForm<AttributeFormValues>({
    resolver: zodResolver(attributeFormSchema),
    defaultValues: attributeFormDefaultValues,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(row ? rowToFormValues(row) : attributeFormDefaultValues);
    setTargetIds(whiskies.map((whisky) => whisky.alcoholId));
    // whiskies는 열릴 때의 선택만 반영하면 된다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, row, form]);

  const close = () => {
    form.reset(attributeFormDefaultValues);
    onOpenChange(false);
  };
  const createMutation = useAlcoholAttributeCreate({ onSuccess: close });
  const updateMutation = useAlcoholAttributeUpdate({ onSuccess: close });
  const isPending = createMutation.isPending || updateMutation.isPending;

  const type = form.watch('type');
  const datatype = form.watch('datatype');
  const { errors } = form.formState;

  /** 기존 항목을 고르면 분류·값 형식을 그 항목에 맞춘다 */
  const applyKnownKey = (key: string) => {
    const known = keyStats.find((stat) => stat.key === key);
    if (!known) return;
    form.setValue('type', known.type);
    form.setValue('datatype', known.datatype);
  };

  const onSubmit = (values: AttributeFormValues) => {
    const common = {
      type: values.type,
      datatype: values.datatype,
      value: values.value,
      description: values.description || null,
      basedAt: toBasedAtPayload(values.basedAt),
    };
    if (row) {
      updateMutation.mutate({ id: row.id, data: common });
      return;
    }
    if (targetIds.length === 0) {
      form.setError('key', { message: '대상 위스키를 하나 이상 고르세요.' });
      return;
    }
    createMutation.mutate({ alcoholIds: targetIds, key: values.key, ...common });
  };

  const toggleTarget = (alcoholId: number, checked: boolean) => {
    setTargetIds((prev) =>
      checked
        ? [...prev.filter((id) => id !== alcoholId), alcoholId].sort((a, b) => a - b)
        : prev.filter((id) => id !== alcoholId)
    );
  };

  const valueField = (() => {
    if (datatype === 'BOOLEAN') {
      return (
        <Select
          value={
            form.watch('value') === 'true' || form.watch('value') === 'false'
              ? form.watch('value')
              : ''
          }
          onValueChange={(next) => form.setValue('value', next, { shouldValidate: true })}
          disabled={isPending}
        >
          <SelectTrigger
            id={FIELD_ID.value}
            aria-label="값"
            {...fieldErrorProps(FIELD_ID.value, errors.value?.message)}
          >
            <SelectValue placeholder="예 / 아니오" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">예</SelectItem>
            <SelectItem value="false">아니오</SelectItem>
          </SelectContent>
        </Select>
      );
    }
    const numeric = isNumericDatatype(datatype);
    return (
      <>
        <Input
          id={FIELD_ID.value}
          {...form.register('value')}
          inputMode={numeric ? 'decimal' : undefined}
          placeholder={numeric ? (datatype === 'INT' ? '예: 98000' : '예: 87.5') : '값'}
          list={type === 'KEYWORD' && datatype === 'STRING' ? KEYWORD_LIST_ID : undefined}
          autoComplete="off"
          disabled={isPending}
          {...fieldErrorProps(FIELD_ID.value, errors.value?.message)}
        />
        {type === 'KEYWORD' && datatype === 'STRING' && (
          <datalist id={KEYWORD_LIST_ID}>
            {keywords.map((keyword) => (
              <option key={keyword.value} value={keyword.value} />
            ))}
          </datalist>
        )}
      </>
    );
  })();

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? '속성 수정' : '속성 추가'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? '분류·값 형식·값·근거·기준 시점을 수정합니다. 항목은 바꿀 수 없습니다.'
              : '고른 위스키 모두에 같은 속성을 추가합니다. 같은 항목·값이 이미 있는 위스키는 건너뜁니다.'}
          </DialogDescription>
        </DialogHeader>

        <form
          id="alcohol-attribute-form"
          className="space-y-4"
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
        >
          {isEdit ? (
            <div className="space-y-1">
              <p className="text-sm font-medium">항목</p>
              <p className="font-mono text-sm text-muted-foreground">{row?.key}</p>
            </div>
          ) : (
            <FormField label="항목" required error={errors.key?.message} htmlFor={FIELD_ID.key}>
              <Input
                id={FIELD_ID.key}
                {...form.register('key', {
                  onChange: (e) => {
                    const normalized = normalizeKey(e.target.value);
                    form.setValue('key', normalized);
                    applyKnownKey(normalized);
                  },
                })}
                placeholder="예: bottle_price_krw"
                list={KEY_LIST_ID}
                autoComplete="off"
                spellCheck={false}
                disabled={isPending}
                {...fieldErrorProps(FIELD_ID.key, errors.key?.message)}
              />
              <datalist id={KEY_LIST_ID}>
                {keyStats.map((stat) => (
                  <option key={stat.key} value={stat.key} />
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground">
                영문 소문자·숫자·밑줄로 씁니다. 기존 항목을 고르면 분류와 형식이 따라옵니다.
              </p>
            </FormField>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormField label="분류" required error={errors.type?.message} htmlFor={FIELD_ID.type}>
              <Select
                value={type}
                onValueChange={(next) => form.setValue('type', next as AlcoholAttributeType)}
                disabled={isPending}
              >
                <SelectTrigger id={FIELD_ID.type} aria-label="분류">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.code} value={option.code}>
                      {option.korName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField
              label="값 형식"
              required
              error={errors.datatype?.message}
              htmlFor={FIELD_ID.datatype}
            >
              <Select
                value={datatype}
                onValueChange={(next) => {
                  form.setValue('datatype', next as AlcoholAttributeDatatype);
                  form.clearErrors('value');
                }}
                disabled={isPending}
              >
                <SelectTrigger id={FIELD_ID.datatype} aria-label="값 형식">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {datatypeOptions.map((option) => (
                    <SelectItem key={option.code} value={option.code}>
                      {option.korName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label="값" required error={errors.value?.message} htmlFor={FIELD_ID.value}>
            {valueField}
          </FormField>

          <FormField
            label="근거"
            error={errors.description?.message}
            htmlFor={FIELD_ID.description}
          >
            <Textarea
              id={FIELD_ID.description}
              {...form.register('description')}
              placeholder="출처나 판단 근거"
              rows={2}
              disabled={isPending}
              {...fieldErrorProps(FIELD_ID.description, errors.description?.message)}
            />
          </FormField>

          <FormField label="기준 시점" error={errors.basedAt?.message} htmlFor={FIELD_ID.basedAt}>
            <Input
              id={FIELD_ID.basedAt}
              type="datetime-local"
              {...form.register('basedAt')}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              가격·점수처럼 시점이 있는 값만 적습니다.
            </p>
          </FormField>

          {!isEdit && (
            <fieldset className="space-y-1.5 rounded-md border p-3">
              <legend className="px-1 text-xs font-medium">
                대상 위스키 {targetIds.length}/{whiskies.length}
              </legend>
              <ul className="max-h-32 space-y-1 overflow-auto">
                {whiskies.map((whisky) => {
                  const checked = targetIds.includes(whisky.alcoholId);
                  const id = `attribute-target-${whisky.alcoholId}`;
                  return (
                    <li key={whisky.alcoholId} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        id={id}
                        checked={checked}
                        onCheckedChange={(next) => toggleTarget(whisky.alcoholId, next === true)}
                        disabled={isPending}
                      />
                      <label htmlFor={id} className="cursor-pointer truncate">
                        {whisky.korName}
                        <span className="ml-1 text-xs text-muted-foreground">{whisky.engName}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          )}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={close} disabled={isPending}>
            취소
          </Button>
          <Button type="submit" form="alcohol-attribute-form" disabled={isPending}>
            {isPending ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
