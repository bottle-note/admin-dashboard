import { useFormContext, useWatch } from 'react-hook-form';

import { FormField } from '@/components/common/FormField';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

import type { TastingEventFormContract } from '../tasting-event.contract';
import type { CurationTastingEventFormValues } from '../tasting-event.schema';

interface TastingEventParticipationSectionProps {
  contract: TastingEventFormContract;
}

export function TastingEventParticipationSection({
  contract,
}: TastingEventParticipationSectionProps) {
  const form = useFormContext<CurationTastingEventFormValues>();
  const isRecruiting = useWatch({
    control: form.control,
    name: 'isRecruiting',
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>참가 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label={contract.isRecruiting.label}
          required={contract.isRecruiting.required}
        >
          <RadioGroup
            className="space-y-3"
            value={isRecruiting ? 'recruiting' : 'advertisement'}
            onValueChange={(value) =>
              form.setValue('isRecruiting', value === 'recruiting', {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          >
            <Label
              htmlFor="isRecruitingYes"
              className={`flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors ${
                isRecruiting ? 'bg-primary/5' : 'hover:bg-muted/40'
              }`}
            >
              <RadioGroupItem id="isRecruitingYes" value="recruiting" className="h-7 w-7 border-2" />
              <span className="font-medium">네</span>
            </Label>
            <Label
              htmlFor="isRecruitingNo"
              className={`flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors ${
                !isRecruiting ? 'bg-primary/5' : 'hover:bg-muted/40'
              }`}
            >
              <RadioGroupItem
                id="isRecruitingNo"
                value="advertisement"
                className="h-7 w-7 border-2"
              />
              <span className="font-medium">아니요, 광고만 하겠습니다.</span>
            </Label>
          </RadioGroup>
        </FormField>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label={contract.entryFee.label}
            required={contract.entryFee.required}
            error={form.formState.errors.entryFee?.message}
          >
            <div className="relative">
              <Input
                className="pr-12"
                aria-label={contract.entryFee.label}
                type="number"
                min={contract.entryFee.minimum}
                {...form.register('entryFee', { valueAsNumber: true })}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-medium text-muted-foreground">
                원
              </span>
            </div>
          </FormField>
          <FormField
            label={contract.capacity.label}
            required={contract.capacity.required}
            error={form.formState.errors.capacity?.message}
          >
            <div className="relative">
              <Input
                className="pr-12"
                aria-label={contract.capacity.label}
                type="number"
                min={contract.capacity.minimum}
                max={contract.capacity.maximum}
                {...form.register('capacity', { valueAsNumber: true })}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-medium text-muted-foreground">
                명
              </span>
            </div>
          </FormField>
        </div>

        <FormField
          label={contract.applicationLink.label}
          required={contract.applicationLink.required}
          error={form.formState.errors.applicationLink?.message}
        >
          <Input
            aria-label={contract.applicationLink.label}
            maxLength={contract.applicationLink.maxLength}
            {...form.register('applicationLink')}
            placeholder="https://forms.example.com/tasting"
          />
        </FormField>

        <FormField
          label={contract.guideText.label}
          required={contract.guideText.required}
          error={form.formState.errors.guideText?.message}
        >
          <Textarea
            aria-label={contract.guideText.label}
            rows={5}
            maxLength={contract.guideText.maxLength}
            {...form.register('guideText')}
            placeholder="시작 10분 전 입장해 주세요."
          />
        </FormField>
      </CardContent>
    </Card>
  );
}
