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
import { ColorPickerInput } from '@/components/common/ColorPickerInput';

import type { BannerFormValues } from '../banner.schema';
import { TEXT_POSITION_LABELS, type TextPosition } from '@/types/api';

interface BannerTextSettingsCardProps {
  form: UseFormReturn<BannerFormValues>;
}

export function BannerTextSettingsCard({ form }: BannerTextSettingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>배너 텍스트</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField label="제목 첫번째줄">
          <Input
            id="descriptionA"
            {...form.register('descriptionA')}
            placeholder="제목 첫번째줄을 입력하세요"
          />
        </FormField>

        <FormField label="제목 두번째줄">
          <Input
            id="descriptionB"
            {...form.register('descriptionB')}
            placeholder="제목 두번째줄을 입력하세요"
          />
        </FormField>

        <FormField label="설명" required error={form.formState.errors.name?.message}>
          <Input
            id="name"
            {...form.register('name')}
            placeholder="설명을 입력하세요"
          />
        </FormField>

        <FormField label="텍스트 위치" required error={form.formState.errors.textPosition?.message}>
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
          <FormField label="제목 색상" error={form.formState.errors.descriptionFontColor?.message}>
            <ColorPickerInput
              id="descriptionFontColor"
              value={form.watch('descriptionFontColor')}
              onChange={(hex) => form.setValue('descriptionFontColor', hex)}
              error={form.formState.errors.descriptionFontColor?.message}
            />
          </FormField>

          <FormField label="설명 색상" error={form.formState.errors.nameFontColor?.message}>
            <ColorPickerInput
              id="nameFontColor"
              value={form.watch('nameFontColor')}
              onChange={(hex) => form.setValue('nameFontColor', hex)}
              error={form.formState.errors.nameFontColor?.message}
            />
          </FormField>
        </div>
      </CardContent>
    </Card>
  );
}
