import { useFormContext, useWatch } from 'react-hook-form';

import { FormField } from '@/components/common/FormField';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import type { CurationTastingEventFormValues } from '../tasting-event.schema';

interface TastingEventBasicInfoSectionProps {
  isRootAdmin: boolean;
}

export function TastingEventBasicInfoSection({ isRootAdmin }: TastingEventBasicInfoSectionProps) {
  const form = useFormContext<CurationTastingEventFormValues>();
  const isActive = useWatch({
    control: form.control,
    name: 'isActive',
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>기본 정보</CardTitle>
        <CardDescription>큐레이션 노출에 공통으로 사용하는 정보입니다.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="큐레이션명" required error={form.formState.errors.name?.message}>
            <Input
              aria-label="큐레이션명"
              {...form.register('name')}
              placeholder="예: 6월 싱글몰트 시음회"
            />
          </FormField>
          <FormField
            label="노출 시작일"
            required
            error={form.formState.errors.exposureStartDate?.message}
          >
            <Input
              aria-label="노출 시작일"
              type="date"
              {...form.register('exposureStartDate')}
            />
          </FormField>
          <FormField
            label="노출 종료일"
            required
            error={form.formState.errors.exposureEndDate?.message}
          >
            <Input
              aria-label="노출 종료일"
              type="date"
              {...form.register('exposureEndDate')}
            />
          </FormField>
        </div>
        <FormField label="설명" required error={form.formState.errors.description?.message}>
          <Textarea
            aria-label="설명"
            rows={4}
            {...form.register('description')}
            placeholder="시음회 큐레이션에 대한 설명을 입력하세요."
          />
        </FormField>
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
      </CardContent>
    </Card>
  );
}
