import { CurationWhiskyCardListField } from './CurationWhiskyCardListField';
import type { TastingEventAlcoholsContract } from '../curation-v2-tasting-event.contract';

interface TastingEventAlcoholLineupSectionProps {
  contract: TastingEventAlcoholsContract;
}

export function TastingEventAlcoholLineupSection({
  contract,
}: TastingEventAlcoholLineupSectionProps) {
  return <CurationWhiskyCardListField contract={contract} />;
}
