import { CurationWhiskyCardListField } from '../../components/CurationWhiskyCardListField';
import type { TastingEventAlcoholsContract } from '../tasting-event.contract';

interface TastingEventAlcoholLineupSectionProps {
  contract: TastingEventAlcoholsContract;
}

export function TastingEventAlcoholLineupSection({
  contract,
}: TastingEventAlcoholLineupSectionProps) {
  return <CurationWhiskyCardListField contract={contract} />;
}
