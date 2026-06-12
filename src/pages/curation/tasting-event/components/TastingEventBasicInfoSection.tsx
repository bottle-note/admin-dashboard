import type { ChangeEvent } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { FormField } from '@/components/common/FormField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import { CurationSectionCard } from '../../components/CurationSectionCard';
import { RecruitmentPeriodTooltip } from './RecruitmentPeriodTooltip';
import { TastingEventImageUploadField } from './TastingEventImageUploadField';
import type { TastingEventCreateFormState } from '../tasting-event.schema';

interface TastingEventBasicInfoSectionProps {
  isRootAdmin: boolean;
  isEditMode?: boolean;
  onImageUploadingChange?: (isUploading: boolean) => void;
}

export function TastingEventBasicInfoSection({
  isRootAdmin,
  isEditMode = false,
  onImageUploadingChange,
}: TastingEventBasicInfoSectionProps) {
  const form = useFormContext<TastingEventCreateFormState>();
  const isActive = useWatch({
    control: form.control,
    name: 'isActive',
  });
  const isNullableBasicInfoAllowed = isEditMode;
  const exposureStartDateRegistration = form.register('exposureStartDate');
  const exposureEndDateRegistration = form.register('exposureEndDate');

  const handleExposureDateChange = (
    event: ChangeEvent<HTMLInputElement>,
    onChange: (event: ChangeEvent<HTMLInputElement>) => void | Promise<boolean | void>,
    otherFieldName: 'exposureStartDate' | 'exposureEndDate'
  ) => {
    void onChange(event);

    const currentValue = event.target.value;
    if (currentValue.length !== 0 && currentValue.length !== 10) return;

    const otherValue = form.getValues(otherFieldName);
    const shouldValidateRange = typeof otherValue === 'string' && otherValue.length === 10;
    void form.trigger(
      shouldValidateRange ? ['exposureStartDate', 'exposureEndDate'] : event.target.name
    );
  };

  return (
    <CurationSectionCard
      stepNumber={1}
      title="기본정보"
      description="모든 큐레이션에 공통으로 들어갑니다."
      contentClassName="space-y-6"
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="큐레이션명" required error={form.formState.errors.name?.message}>
            <Input
              aria-label="큐레이션명"
              {...form.register('name')}
              placeholder="예: 6월 싱글몰트 시음회"
            />
          </FormField>
          <FormField
            label="큐레이션 내용"
            required={!isNullableBasicInfoAllowed}
            error={form.formState.errors.description?.message}
            className="md:col-span-2"
          >
            <Textarea
              aria-label="설명"
              rows={4}
              {...form.register('description')}
              placeholder="시음회 큐레이션에 대한 설명을 입력하세요."
            />
          </FormField>
          {onImageUploadingChange && (
            <div className="space-y-2 md:col-span-2">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium">
                    이미지
                    {!isNullableBasicInfoAllowed && (
                      <span className="ml-1 text-destructive">*</span>
                    )}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  최대 3장까지 등록할 수 있고, 등록된 순서대로 노출됩니다.
                </p>
              </div>
              <TastingEventImageUploadField onUploadingChange={onImageUploadingChange} />
            </div>
          )}
          <div className="space-y-2 md:col-span-2">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3">
              <div className="min-w-0 space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium">
                    노출 시작일
                    {!isNullableBasicInfoAllowed && (
                      <span className="ml-1 text-destructive">*</span>
                    )}
                  </span>
                  <RecruitmentPeriodTooltip />
                </div>
                <Input
                  aria-label="노출 시작일"
                  type="date"
                  {...exposureStartDateRegistration}
                  onChange={(event) =>
                    handleExposureDateChange(
                      event,
                      exposureStartDateRegistration.onChange,
                      'exposureEndDate'
                    )
                  }
                />
                {form.formState.errors.exposureStartDate?.message && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.exposureStartDate.message}
                  </p>
                )}
              </div>
              <span className="pt-9 text-sm font-medium text-muted-foreground" aria-hidden="true">
                ~
              </span>
              <FormField
                label="노출 종료일"
                required={!isNullableBasicInfoAllowed}
                error={form.formState.errors.exposureEndDate?.message}
                className="min-w-0"
              >
                <Input
                  aria-label="노출 종료일"
                  type="date"
                  {...exposureEndDateRegistration}
                  onChange={(event) =>
                    handleExposureDateChange(
                      event,
                      exposureEndDateRegistration.onChange,
                      'exposureStartDate'
                    )
                  }
                />
              </FormField>
            </div>
          </div>
        </div>
      </div>

      {isRootAdmin && (
        <div className="space-y-4 border-t pt-4">
          <div>
            <h3 className="text-sm font-semibold">관리자 전용 설정</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              노출 순서와 활성화 상태는 관리자 권한에서만 수정합니다.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              label="노출 순서"
              required
              error={form.formState.errors.displayOrder?.message}
            >
              <Input
                aria-label="노출 순서"
                type="number"
                min={0}
                {...form.register('displayOrder', { valueAsNumber: true })}
              />
            </FormField>
            <div className="flex items-end">
              <div className="flex min-h-9 items-center gap-2">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={(checked) =>
                    form.setValue('isActive', checked, { shouldDirty: true })
                  }
                />
                <Label htmlFor="isActive">활성화 상태</Label>
              </div>
            </div>
          </div>
        </div>
      )}
    </CurationSectionCard>
  );
}
