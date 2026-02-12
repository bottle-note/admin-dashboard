import type { UseFormReturn } from 'react-hook-form';

import { Input } from '@/components/ui/input';
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
import { TEXT_POSITION_LABELS, type TextPosition } from '@/types/api';

interface BannerTextSettingsCardProps {
  form: UseFormReturn<BannerFormValues>;
}

export function BannerTextSettingsCard({ form }: BannerTextSettingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>텍스트 설정</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField label="설명 A">
          <Input
            id="descriptionA"
            {...form.register('descriptionA')}
            placeholder="첫 번째 줄 설명"
          />
        </FormField>

        <FormField label="설명 B">
          <Input
            id="descriptionB"
            {...form.register('descriptionB')}
            placeholder="두 번째 줄 설명"
          />
        </FormField>

        <FormField label="텍스트 위치" required>
          <Select
            value={form.watch('textPosition')}
            onValueChange={(value) => form.setValue('textPosition', value as TextPosition)}
          >
            <SelectTrigger>
              <SelectValue placeholder="텍스트 위치 선택" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TEXT_POSITION_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="제목 색상" error={form.formState.errors.nameFontColor?.message}>
            <div className="flex gap-2">
              <div
                className="w-10 h-10 rounded border"
                style={{ backgroundColor: `#${form.watch('nameFontColor')}` }}
              />
              <Input
                id="nameFontColor"
                {...form.register('nameFontColor')}
                placeholder="ffffff"
                maxLength={6}
              />
            </div>
          </FormField>

          <FormField label="설명 색상" error={form.formState.errors.descriptionFontColor?.message}>
            <div className="flex gap-2">
              <div
                className="w-10 h-10 rounded border"
                style={{ backgroundColor: `#${form.watch('descriptionFontColor')}` }}
              />
              <Input
                id="descriptionFontColor"
                {...form.register('descriptionFontColor')}
                placeholder="ffffff"
                maxLength={6}
              />
            </div>
          </FormField>
        </div>
      </CardContent>
    </Card>
  );
}
