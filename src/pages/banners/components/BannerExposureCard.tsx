import type { UseFormReturn } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { BannerFormValues } from '../banner.schema';
import { getOneYearLaterEnd, getTodayStart } from '../banner.schema';

interface BannerExposureCardProps {
  form: UseFormReturn<BannerFormValues>;
}

export function BannerExposureCard({ form }: BannerExposureCardProps) {
  const isAlwaysVisible = form.watch('isAlwaysVisible');

  return (
    <Card>
      <CardHeader>
        <CardTitle>노출 설정</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isAlwaysVisible"
            checked={isAlwaysVisible}
            onCheckedChange={(checked) => {
              form.setValue('isAlwaysVisible', !!checked);
              if (checked) {
                form.setValue('startDate', getTodayStart());
                form.setValue('endDate', getOneYearLaterEnd());
              }
            }}
          />
          <Label htmlFor="isAlwaysVisible">상시 노출</Label>
        </div>

        {!isAlwaysVisible && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">시작일</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={form.watch('startDate')}
                onChange={(e) => form.setValue('startDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">종료일</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={form.watch('endDate')}
                onChange={(e) => form.setValue('endDate', e.target.value)}
              />
            </div>
          </div>
        )}

        {form.formState.errors.startDate && (
          <p className="text-sm text-destructive">
            {form.formState.errors.startDate.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
