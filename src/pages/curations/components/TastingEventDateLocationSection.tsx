import { useFormContext } from 'react-hook-form';

import { FormField } from '@/components/common/FormField';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import type { TastingEventFormContract } from '../curation-v2-tasting-event.contract';
import type { CurationV2TastingEventFormValues } from '../curation-v2-tasting-event.schema';

interface TastingEventDateLocationSectionProps {
  contract: TastingEventFormContract;
}

export function TastingEventDateLocationSection({
  contract,
}: TastingEventDateLocationSectionProps) {
  const form = useFormContext<CurationV2TastingEventFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>날짜 및 장소 정보</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <FormField
          label={contract.eventDate.label}
          required={contract.eventDate.required}
          error={form.formState.errors.eventDate?.message}
        >
          <Input
            aria-label={contract.eventDate.label}
            type="date"
            {...form.register('eventDate')}
          />
        </FormField>
        <FormField
          label={contract.eventTime.label}
          required={contract.eventTime.required}
          error={form.formState.errors.eventTime?.message}
        >
          <Input
            aria-label={contract.eventTime.label}
            type="time"
            {...form.register('eventTime')}
          />
        </FormField>
        <FormField
          label={contract.barAddress.label}
          required={contract.barAddress.required}
          error={form.formState.errors.barAddress?.message}
          className="md:col-span-2"
        >
          <Input
            aria-label={contract.barAddress.label}
            maxLength={contract.barAddress.maxLength}
            {...form.register('barAddress')}
            placeholder="예: 서울 강남구 테헤란로 123"
          />
        </FormField>
        <FormField
          label={contract.detailAddress.label}
          required={contract.detailAddress.required}
          error={form.formState.errors.detailAddress?.message}
          className="md:col-span-2"
        >
          <Input
            aria-label={contract.detailAddress.label}
            maxLength={contract.detailAddress.maxLength}
            {...form.register('detailAddress')}
            placeholder="예: 2층 도시남 바"
          />
        </FormField>
      </CardContent>
    </Card>
  );
}
