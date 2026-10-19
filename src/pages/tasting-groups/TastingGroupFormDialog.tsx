/**
 * 태그 그룹 생성·수정 다이얼로그
 * - group이 있으면 수정 모드. 코드는 바꿀 수 없으므로 수정 모드에서는 입력란을 숨긴다.
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/common/FormField';
import { fieldErrorProps } from '@/lib/form';
import { useTastingGroupCreate, useTastingGroupUpdate } from '@/hooks/useTastingGroups';
import type { TastingGroupItem } from '@/types/api';
import {
  tastingGroupDefaultValues,
  tastingGroupFormSchema,
  toFormValues,
  type TastingGroupFormValues,
} from './tasting-group.schema';

interface TastingGroupFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 수정 대상. 없으면 생성 모드 */
  group?: TastingGroupItem | null;
  /** 계열 입력 자동완성 후보 */
  families: string[];
  /** 생성 시 표시 순서 기본값. 보통 현재 최댓값 + 1 */
  nextDisplayOrder?: number;
}

const FIELD_ID = {
  code: 'tasting-group-code',
  name: 'tasting-group-name',
  family: 'tasting-group-family',
  description: 'tasting-group-description',
  displayOrder: 'tasting-group-display-order',
} as const;

const FAMILY_LIST_ID = 'tasting-group-family-options';

export function TastingGroupFormDialog({
  open,
  onOpenChange,
  group,
  families,
  nextDisplayOrder = 0,
}: TastingGroupFormDialogProps) {
  const isEdit = Boolean(group);
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
  const form = useForm<TastingGroupFormValues>({
    resolver: zodResolver(tastingGroupFormSchema),
    defaultValues: tastingGroupDefaultValues,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      group ? toFormValues(group) : { ...tastingGroupDefaultValues, displayOrder: nextDisplayOrder }
    );
  }, [open, group, form, nextDisplayOrder]);

  // formState는 프록시라 렌더 중에 읽어야 구독이 걸린다. 이벤트 핸들러에서만 읽으면 늘 false다
  const { isDirty } = form.formState;

  // 입력 중에 닫으려 하면 먼저 묻는다. 저장 성공으로 닫힐 때는 폼이 리셋되므로 묻지 않는다
  const requestClose = () => {
    if (isDirty) {
      setIsDiscardOpen(true);
      return;
    }
    onOpenChange(false);
  };

  const closeAfterSave = () => {
    form.reset(form.getValues());
    onOpenChange(false);
  };
  const createMutation = useTastingGroupCreate({ onSuccess: closeAfterSave });
  const updateMutation = useTastingGroupUpdate({ onSuccess: closeAfterSave });
  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: TastingGroupFormValues) => {
    const common = {
      name: values.name,
      family: values.family.trim() || null,
      description: values.description.trim() || null,
      displayOrder: values.displayOrder,
    };
    if (group) {
      updateMutation.mutate({ code: group.code, data: common });
    } else {
      createMutation.mutate({ code: values.code, ...common });
    }
  };

  const { errors } = form.formState;

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : requestClose())}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? '태그 그룹 수정' : '태그 그룹 추가'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? '이름·계열·설명·표시 순서를 수정합니다. 코드는 바꿀 수 없습니다.'
              : '추천 점수에 쓰일 맛 계열 그룹을 만듭니다.'}
          </DialogDescription>
        </DialogHeader>

        <form
          id="tasting-group-form"
          className="space-y-4"
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
        >
          {!isEdit && (
            <FormField label="코드" required error={errors.code?.message} htmlFor={FIELD_ID.code}>
              <Input
                id={FIELD_ID.code}
                {...form.register('code', {
                  // 코드는 대문자·밑줄 관례를 따르므로 입력하는 대로 대문자로 바꾼다
                  onChange: (e) =>
                    form.setValue('code', e.target.value.toUpperCase().replace(/\s+/g, '_')),
                })}
                placeholder="예: PEAT_SMOKE"
                autoComplete="off"
                spellCheck={false}
                disabled={isPending}
                {...fieldErrorProps(FIELD_ID.code, errors.code?.message)}
              />
              <p className="text-xs text-muted-foreground">
                영문 대문자와 밑줄로 씁니다. 만든 뒤에는 바꿀 수 없습니다.
              </p>
            </FormField>
          )}
          <FormField label="이름" required error={errors.name?.message} htmlFor={FIELD_ID.name}>
            <Input
              id={FIELD_ID.name}
              {...form.register('name')}
              placeholder="예: 피트 스모크"
              autoComplete="off"
              disabled={isPending}
              {...fieldErrorProps(FIELD_ID.name, errors.name?.message)}
            />
          </FormField>
          <FormField label="계열" error={errors.family?.message} htmlFor={FIELD_ID.family}>
            <Input
              id={FIELD_ID.family}
              {...form.register('family')}
              placeholder="예: 스모키"
              list={FAMILY_LIST_ID}
              autoComplete="off"
              disabled={isPending}
              {...fieldErrorProps(FIELD_ID.family, errors.family?.message)}
            />
            <datalist id={FAMILY_LIST_ID}>
              {families.map((family) => (
                <option key={family} value={family} />
              ))}
            </datalist>
          </FormField>
          <FormField
            label="설명"
            error={errors.description?.message}
            htmlFor={FIELD_ID.description}
          >
            <Textarea
              id={FIELD_ID.description}
              {...form.register('description')}
              placeholder="설명"
              rows={3}
              disabled={isPending}
              {...fieldErrorProps(FIELD_ID.description, errors.description?.message)}
            />
          </FormField>
          <FormField
            label="표시 순서"
            error={errors.displayOrder?.message}
            htmlFor={FIELD_ID.displayOrder}
          >
            <Input
              id={FIELD_ID.displayOrder}
              type="number"
              inputMode="numeric"
              min={0}
              {...form.register('displayOrder', { valueAsNumber: true })}
              disabled={isPending}
              {...fieldErrorProps(FIELD_ID.displayOrder, errors.displayOrder?.message)}
            />
          </FormField>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={requestClose} disabled={isPending}>
            취소
          </Button>
          <Button type="submit" form="tasting-group-form" disabled={isPending}>
            {isPending ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={isDiscardOpen} onOpenChange={setIsDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>변경 내용을 버릴까요?</AlertDialogTitle>
            <AlertDialogDescription>
              저장하지 않은 변경 내용이 있습니다. 닫으면 입력한 내용이 사라집니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>계속 편집</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsDiscardOpen(false);
                form.reset(tastingGroupDefaultValues);
                onOpenChange(false);
              }}
            >
              버리기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
