import type { UseFormReturn } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/common/FormField';

import type { BannerFormValues } from '../banner.schema';
import { BANNER_TYPE_LABELS, type BannerType } from '@/types/api';

interface BannerBasicInfoCardProps {
  form: UseFormReturn<BannerFormValues>;
}

export function BannerBasicInfoCard({ form }: BannerBasicInfoCardProps) {
  const isActive = form.watch('isActive');

  return (
    <Card>
      <CardHeader>
        <CardTitle>기본 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField label="배너명" required error={form.formState.errors.name?.message}>
          <Input
            id="name"
            {...form.register('name')}
            placeholder="배너명을 입력하세요"
          />
        </FormField>

        <FormField label="배너 타입" required>
          <Select
            value={form.watch('bannerType')}
            onValueChange={(value) => {
              const newType = value as BannerType;
              form.setValue('bannerType', newType);
              if (newType === 'CURATION') {
                form.setValue('isExternalUrl', false);
              } else {
                form.setValue('curationId', null);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="배너 타입 선택" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(BANNER_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={isActive}
            onCheckedChange={(checked) => form.setValue('isActive', checked)}
          />
          <Label htmlFor="isActive">활성화 상태</Label>
        </div>
      </CardContent>
    </Card>
  );
}
