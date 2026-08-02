import { useFormContext, useWatch, type FieldValues } from 'react-hook-form';

import { FormField } from '@/components/common/FormField';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import { CurationImageUploadField } from './CurationImageUploadField';

export function CurationSpecCommonSection({
  onImageUploadingChange,
}: {
  onImageUploadingChange?: (isUploading: boolean) => void;
}) {
  const form = useFormContext<FieldValues>();
  const isActive = useWatch({ control: form.control, name: 'isActive' });

  return (
    <Card className="overflow-hidden rounded-[10px] border-border shadow-none">
      <CardHeader className="border-b border-border bg-muted/50 px-6 py-4">
        <div className="flex items-center gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground">
            1
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <CardTitle className="text-lg">기본정보</CardTitle>
            <CardDescription className="leading-5">
              모든 큐레이션에 공통으로 들어갑니다.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="큐레이션명"
            required
            error={form.getFieldState('name', form.formState).error?.message}
            className="md:col-span-2"
          >
            <Input
              aria-label="큐레이션명"
              placeholder="예: 6월 싱글몰트 시음회"
              {...form.register('name')}
            />
          </FormField>

          <FormField
            label="큐레이션 내용"
            error={form.getFieldState('description', form.formState).error?.message}
            className="md:col-span-2"
          >
            <Textarea
              aria-label="큐레이션 내용"
              rows={4}
              placeholder="큐레이션에 대한 설명을 입력하세요."
              {...form.register('description')}
            />
          </FormField>

          <div className="space-y-2 md:col-span-2">
            <div>
              <p className="text-sm font-medium">이미지</p>
              <p className="mt-1 text-sm text-muted-foreground">
                최대 3장까지 등록할 수 있고, 등록된 순서대로 노출됩니다.
              </p>
            </div>
            <CurationImageUploadField onUploadingChange={onImageUploadingChange} />
          </div>

          <FormField
            label="광고노출 시작일"
            error={form.getFieldState('exposureStartDate', form.formState).error?.message}
          >
            <Input
              aria-label="광고노출 시작일"
              type="date"
              {...form.register('exposureStartDate')}
            />
          </FormField>

          <FormField
            label="광고노출 종료일"
            error={form.getFieldState('exposureEndDate', form.formState).error?.message}
          >
            <Input aria-label="광고노출 종료일" type="date" {...form.register('exposureEndDate')} />
          </FormField>
        </div>

        <div className="grid gap-4 border-t pt-6 md:grid-cols-2">
          <FormField
            label="노출 순서"
            required
            error={form.getFieldState('displayOrder', form.formState).error?.message}
          >
            <Input
              aria-label="노출 순서"
              type="number"
              min={0}
              {...form.register('displayOrder', { valueAsNumber: true })}
            />
          </FormField>

          <div className="flex items-end pb-2">
            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={isActive === true}
                onCheckedChange={(checked) =>
                  form.setValue('isActive', checked, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
              <Label htmlFor="isActive">활성화 상태</Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
