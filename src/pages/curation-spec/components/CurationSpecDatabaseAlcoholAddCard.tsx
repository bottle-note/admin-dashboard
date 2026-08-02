import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { WhiskySearchSelect, type SelectedWhisky } from '@/components/common/WhiskySearchSelect';
import { Button } from '@/components/ui/button';
import { useAdminAlcoholDetailLookup } from '@/hooks/useAdminAlcohols';
import { useToast } from '@/hooks/useToast';

import {
  createBottleNoteCurationWhiskyItem,
  createBottleNoteCurationWhiskyItemFromDetail,
} from '../../curation/curation-whisky-card-list.mapper';
import type { AlcoholSectionConfig } from '../curation-sections';
import type {
  WhiskyTastingEventAlcoholItemSchema,
  WhiskyTastingEventPayload,
} from '../curation-spec.schema';

type CurationSpecAlcoholItem = WhiskyTastingEventPayload['alcohols'][number];

export function CurationSpecDatabaseAlcoholAddCard({
  index,
  schema,
  config,
  required,
  excludeIds,
  onAdd,
  onAddManual,
  onCancel,
}: {
  index: number;
  schema: WhiskyTastingEventAlcoholItemSchema;
  config: AlcoholSectionConfig;
  required: boolean;
  excludeIds: number[];
  onAdd: (item: CurationSpecAlcoholItem) => void;
  onAddManual: () => void;
  onCancel: () => void;
}) {
  const fetchAlcoholDetail = useAdminAlcoholDetailLookup();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const maxSelectedTags = schema.properties.alcohol.properties.selectedTags.maxItems;

  const handleSelectAlcohol = async (whisky: SelectedWhisky) => {
    setIsLoading(true);

    try {
      const detail = await fetchAlcoholDetail(whisky.alcoholId);
      const mappedItem = createBottleNoteCurationWhiskyItemFromDetail(detail);

      onAdd({
        source: 'BOTTLE_NOTE',
        alcohol: {
          ...mappedItem.alcohol,
          selectedTags: mappedItem.alcohol.selectedTags.slice(0, maxSelectedTags),
        },
        stats: {
          rating: mappedItem.stats?.rating ?? null,
          totalRatingsCount: mappedItem.stats?.totalRatingsCount ?? 0,
        },
        comment: mappedItem.comment ?? '',
      });
    } catch {
      const fallbackItem = createBottleNoteCurationWhiskyItem(whisky);
      onAdd({
        source: 'BOTTLE_NOTE',
        alcohol: {
          alcoholId: fallbackItem.alcohol.alcoholId,
          korName: fallbackItem.alcohol.korName,
          engName: fallbackItem.alcohol.engName,
          imageUrl: fallbackItem.alcohol.imageUrl,
          selectedTags: fallbackItem.alcohol.selectedTags,
        },
        comment: fallbackItem.comment ?? '',
      });
      showToast({
        type: 'error',
        message: '위스키 상세 정보를 불러오지 못해 기본 정보만 추가했습니다.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-[10px] border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-base font-semibold text-foreground">
          {config.itemLabel} {index + 1}
          {required && <span className="ml-1 text-destructive">*</span>}
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 rounded-md bg-destructive/20 px-2 text-xs font-medium text-destructive hover:bg-destructive/30 hover:text-destructive"
          onClick={onCancel}
          disabled={isLoading}
        >
          삭제
        </Button>
      </div>

      {isLoading && (
        <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          DB 위스키 정보를 불러오는 중입니다.
        </p>
      )}

      <div className="mt-5 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
        <WhiskySearchSelect
          onSelect={(whisky) => void handleSelectAlcohol(whisky)}
          excludeIds={excludeIds}
          placeholder="위스키 검색 ..."
          disabled={isLoading}
        />
        <Button type="button" variant="outline" onClick={onAddManual} disabled={isLoading}>
          직접 입력
        </Button>
      </div>
    </div>
  );
}
