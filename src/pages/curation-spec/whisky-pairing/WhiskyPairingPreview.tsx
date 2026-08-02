import { WhiskyCurationPreview } from '../components/preview/WhiskyCurationPreview';
import type { WhiskyCurationFormValues } from '../curation-spec.schema';

export function WhiskyPairingPreview({
  specName,
  values,
}: {
  specName: string;
  values: WhiskyCurationFormValues;
}) {
  return (
    <WhiskyCurationPreview
      curation={{
        specName,
        name: values.name,
        description: values.description,
        imageUrls: values.imageUrls,
        items: values.alcohols.map((item) => ({
          source: item.source,
          alcohol: item.alcohol,
          stats: item.stats,
          comment: item.comment,
          pairings: item.pairings?.map((pairing) => ({
            ...pairing,
            itemImageUrl: pairing.itemImageUrl ?? undefined,
          })),
        })),
      }}
    />
  );
}
