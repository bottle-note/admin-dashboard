import { useFormContext, useWatch } from 'react-hook-form';
import { Plus, X } from 'lucide-react';

import { FormField } from '@/components/common/FormField';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import {
  createEmptyPairingFood,
  type WhiskyCardCurationFormModel,
  type WhiskyCardCurationFormState,
} from '../whisky-card-curation.schema';

interface PairingFoodListSectionProps {
  formModel: WhiskyCardCurationFormModel;
}

export function PairingFoodListSection({ formModel }: PairingFoodListSectionProps) {
  const pairingModel = formModel.pairings;
  const form = useFormContext<WhiskyCardCurationFormState>();
  const watchedPairings = useWatch({ control: form.control, name: 'pairings' }) ?? [];

  if (!pairingModel) {
    return null;
  }

  const canAddPairing = watchedPairings.length < pairingModel.maxItems;
  const canRemovePairing = watchedPairings.length > pairingModel.minItems;
  const updatePairings = (nextPairings: typeof watchedPairings) => {
    form.setValue('pairings', nextPairings, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {pairingModel.label}
          {pairingModel.minItems > 0 && <span className="ml-1 text-destructive">*</span>}
        </CardTitle>
        <CardDescription>
          {pairingModel.minItems}-{pairingModel.maxItems}개까지 등록할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {form.formState.errors.pairings?.message && (
          <p className="text-sm text-destructive">{form.formState.errors.pairings.message}</p>
        )}

        <div className="space-y-3">
          {watchedPairings.map((_, index) => {
            const item = watchedPairings[index];
            const itemError = form.formState.errors.pairings?.[index];
            const previewName = item?.itemName || `페어링 음식 ${index + 1}`;

            return (
              <div key={index} className="rounded-lg border p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium">{previewName}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      앱에 함께 노출될 음식명과 페어링 설명입니다.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`${previewName} 삭제`}
                    onClick={() =>
                      updatePairings(watchedPairings.filter((_, itemIndex) => itemIndex !== index))
                    }
                    disabled={!canRemovePairing}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    label={pairingModel.itemNameLabel}
                    required
                    error={itemError?.itemName?.message}
                  >
                    <Input
                      aria-label={`${index + 1}번 페어링 음식명`}
                      maxLength={pairingModel.itemNameMaxLength}
                      {...form.register(`pairings.${index}.itemName` as const)}
                      placeholder="예: 바닐라 아이스크림"
                    />
                  </FormField>
                  <FormField label={pairingModel.itemImageUrlLabel}>
                    <Input
                      aria-label={`${index + 1}번 페어링 음식 이미지 URL`}
                      {...form.register(`pairings.${index}.itemImageUrl` as const)}
                      placeholder="https://img.example.com/pairing.jpg"
                    />
                  </FormField>
                  <FormField
                    label={pairingModel.pairingNoteLabel}
                    required
                    error={itemError?.pairingNote?.message}
                    className="md:col-span-2"
                  >
                    <Textarea
                      aria-label={`${index + 1}번 페어링 설명`}
                      rows={3}
                      maxLength={pairingModel.pairingNoteMaxLength}
                      {...form.register(`pairings.${index}.pairingNote` as const)}
                      placeholder="위스키의 달콤한 풍미와 잘 어울리는 이유를 입력하세요."
                    />
                  </FormField>
                </div>
              </div>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => updatePairings([...watchedPairings, createEmptyPairingFood()])}
          disabled={!canAddPairing}
        >
          <Plus className="h-4 w-4" />
          페어링 음식 추가
        </Button>
      </CardContent>
    </Card>
  );
}
