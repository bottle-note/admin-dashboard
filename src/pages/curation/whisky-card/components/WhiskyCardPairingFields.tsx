import { useFormContext, useWatch } from 'react-hook-form';
import { Plus, X } from 'lucide-react';

import { FormField } from '@/components/common/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import {
  createEmptyPairingFood,
  type PairingFoodValue,
  type WhiskyCardCurationFormModel,
  type WhiskyCardCurationFormState,
} from '../whisky-card-curation.schema';

interface WhiskyCardPairingFieldsProps {
  index: number;
  formModel: WhiskyCardCurationFormModel;
}

export function WhiskyCardPairingFields({ index, formModel }: WhiskyCardPairingFieldsProps) {
  const pairingModel = formModel.pairings;
  const form = useFormContext<WhiskyCardCurationFormState>();
  const pairings =
    useWatch({ control: form.control, name: `alcohols.${index}.pairings` as const }) ?? [];
  const itemErrors = form.formState.errors.alcohols?.[index]?.pairings;

  if (!pairingModel) return null;

  const updatePairings = (nextPairings: PairingFoodValue[]) => {
    form.setValue(`alcohols.${index}.pairings` as const, nextPairings, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };
  const canAddPairing = pairings.length < pairingModel.maxItems;
  const canRemovePairing = pairings.length > pairingModel.minItems;

  return (
    <div className="mt-4 space-y-3 rounded-md border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold">
            {pairingModel.label}
            {pairingModel.minItems > 0 && <span className="ml-1 text-destructive">*</span>}
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            {pairingModel.minItems}-{pairingModel.maxItems}개까지 등록할 수 있습니다.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => updatePairings([...pairings, createEmptyPairingFood()])}
          disabled={!canAddPairing}
        >
          <Plus className="h-4 w-4" />
          음식 추가
        </Button>
      </div>

      {typeof itemErrors?.message === 'string' && (
        <p className="text-sm text-destructive">{itemErrors.message}</p>
      )}

      {pairings.map((pairing, pairingIndex) => {
        const pairingError = Array.isArray(itemErrors) ? itemErrors[pairingIndex] : undefined;

        return (
          <div key={pairingIndex} className="rounded-md border bg-background p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h5 className="text-sm font-medium">
                {pairing.itemName || `페어링 음식 ${pairingIndex + 1}`}
              </h5>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`${index + 1}번 위스키 ${pairingIndex + 1}번 페어링 음식 삭제`}
                onClick={() =>
                  updatePairings(pairings.filter((_, itemIndex) => itemIndex !== pairingIndex))
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
                error={pairingError?.itemName?.message}
              >
                <Input
                  aria-label={`${index + 1}번 위스키 ${pairingIndex + 1}번 페어링 음식명`}
                  maxLength={pairingModel.itemNameMaxLength}
                  {...form.register(`alcohols.${index}.pairings.${pairingIndex}.itemName` as const)}
                  placeholder="예: 바닐라 아이스크림"
                />
              </FormField>
              <FormField label={pairingModel.itemImageUrlLabel}>
                <Input
                  aria-label={`${index + 1}번 위스키 ${pairingIndex + 1}번 페어링 음식 이미지 URL`}
                  {...form.register(
                    `alcohols.${index}.pairings.${pairingIndex}.itemImageUrl` as const
                  )}
                  placeholder="https://img.example.com/pairing.jpg"
                />
              </FormField>
              <FormField
                label={pairingModel.pairingNoteLabel}
                required
                error={pairingError?.pairingNote?.message}
                className="md:col-span-2"
              >
                <Textarea
                  aria-label={`${index + 1}번 위스키 ${pairingIndex + 1}번 페어링 설명`}
                  rows={3}
                  maxLength={pairingModel.pairingNoteMaxLength}
                  {...form.register(
                    `alcohols.${index}.pairings.${pairingIndex}.pairingNote` as const
                  )}
                  placeholder="위스키의 풍미와 잘 어울리는 이유를 입력하세요."
                />
              </FormField>
            </div>
          </div>
        );
      })}
    </div>
  );
}
