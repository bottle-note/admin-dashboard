import { useState, type ChangeEvent } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';

import { FormField } from '@/components/common/FormField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import { CurationActiveExposureTooltip } from './CurationActiveExposureTooltip';
import { CurationExposurePeriodTooltip } from './CurationExposurePeriodTooltip';
import { CurationImageUploadField } from './CurationImageUploadField';
import { CurationSectionCard } from './CurationSectionCard';

interface CurationBasicInfoFormState {
  name: string;
  description: string;
  imageUrls: string[];
  exposureStartDate: string;
  exposureEndDate: string;
  displayOrder: number;
  isActive: boolean;
}

interface CurationBasicInfoSectionProps {
  isRootAdmin: boolean;
  isEditMode?: boolean;
  canEditExposureStartDateInEditMode?: boolean;
  onImageUploadingChange?: (isUploading: boolean) => void;
  exposureStartDateLabel?: string;
  exposureEndDateLabel?: string;
  exposureStartDateHelpText?: string;
  editableExposureStartDateHelpText?: string;
  exposurePeriodTooltipLabel?: string;
  exposurePeriodTooltipContent?: string;
}

export function CurationBasicInfoSection({
  isRootAdmin,
  isEditMode = false,
  canEditExposureStartDateInEditMode = false,
  onImageUploadingChange,
  exposureStartDateLabel = '광고노출 시작일',
  exposureEndDateLabel = '광고노출 종료일',
  exposureStartDateHelpText = '광고노출 시작일은 등록 후 변경할 수 없습니다.',
  editableExposureStartDateHelpText = '기존 노출 시작일이 없어 이번 수정에서만 입력할 수 있습니다.',
  exposurePeriodTooltipLabel = '모집기간 안내',
  exposurePeriodTooltipContent = '모집 기간동안 보틀노트 앱에서 노출됩니다.',
}: CurationBasicInfoSectionProps) {
  const form = useFormContext<CurationBasicInfoFormState>();
  const [isAdminControlAlertVisible, setIsAdminControlAlertVisible] = useState(false);
  const isActive = useWatch({
    control: form.control,
    name: 'isActive',
  });
  const isNullableBasicInfoAllowed = isEditMode;
  const isExposurePeriodRequired = true;
  const exposureStartDateRegistration = form.register('exposureStartDate');
  const exposureEndDateRegistration = form.register('exposureEndDate');
  const isAdminControlDisabled = !isRootAdmin;
  const isExposureStartDateDisabled = isEditMode && !canEditExposureStartDateInEditMode;
  const exposureStartDateHelpMessage =
    isEditMode && !isExposureStartDateDisabled
      ? editableExposureStartDateHelpText
      : exposureStartDateHelpText;

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
    const currentFieldName = event.target.name as 'exposureStartDate' | 'exposureEndDate';
    void form.trigger(
      shouldValidateRange ? ['exposureStartDate', 'exposureEndDate'] : currentFieldName
    );
  };

  const handleAdminControlAttempt = () => {
    if (!isAdminControlDisabled) return;

    setIsAdminControlAlertVisible(true);
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
              placeholder="큐레이션에 대한 설명을 입력하세요."
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
              <CurationImageUploadField onUploadingChange={onImageUploadingChange} />
            </div>
          )}
          <div className="space-y-2 md:col-span-2">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3">
              <div className="min-w-0 space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium">
                    {exposureStartDateLabel}
                    {isExposurePeriodRequired && <span className="ml-1 text-destructive">*</span>}
                  </span>
                  <CurationExposurePeriodTooltip
                    ariaLabel={exposurePeriodTooltipLabel}
                    content={exposurePeriodTooltipContent}
                  />
                </div>
                <Input
                  aria-label={exposureStartDateLabel}
                  type="date"
                  disabled={isExposureStartDateDisabled}
                  {...exposureStartDateRegistration}
                  onChange={(event) =>
                    handleExposureDateChange(
                      event,
                      exposureStartDateRegistration.onChange,
                      'exposureEndDate'
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">{exposureStartDateHelpMessage}</p>
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
                label={exposureEndDateLabel}
                required={isExposurePeriodRequired}
                error={form.formState.errors.exposureEndDate?.message}
                className="min-w-0"
              >
                <Input
                  aria-label={exposureEndDateLabel}
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

      <div className="space-y-4 border-t pt-4">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold">관리자 전용 설정</h3>
            <CurationActiveExposureTooltip />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            노출 순서와 활성화 상태 변경은 관리자만 할 수 있습니다.
          </p>
        </div>
        <div
          className="grid gap-4 md:grid-cols-2"
          onPointerDownCapture={handleAdminControlAttempt}
          onKeyDownCapture={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              handleAdminControlAttempt();
            }
          }}
        >
          <FormField label="노출 순서" required error={form.formState.errors.displayOrder?.message}>
            <Input
              aria-label="노출 순서"
              type="number"
              min={0}
              disabled={isAdminControlDisabled}
              {...form.register('displayOrder', { valueAsNumber: true })}
            />
          </FormField>
          <div className="flex items-end">
            <div className="flex min-h-9 items-center gap-2">
              <Switch
                id="isActive"
                checked={isActive}
                disabled={isAdminControlDisabled}
                onCheckedChange={(checked) =>
                  form.setValue('isActive', checked, { shouldDirty: true })
                }
              />
              <Label htmlFor="isActive">활성화 상태</Label>
            </div>
          </div>
        </div>
        {isAdminControlAlertVisible && (
          <div
            className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            관리자만 조작할 수 있습니다.
          </div>
        )}
      </div>
    </CurationSectionCard>
  );
}
