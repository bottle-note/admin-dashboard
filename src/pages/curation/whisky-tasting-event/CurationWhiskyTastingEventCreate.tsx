import { WhiskyTastingEventCreateGate } from './WhiskyTastingEventCreateGate';
import { WhiskyTastingEventForm } from './WhiskyTastingEventForm';

export function CurationWhiskyTastingEventCreatePage() {
  return (
    <WhiskyTastingEventCreateGate>
      {({ specDetail, formModel, onBack }) => (
        <WhiskyTastingEventForm specDetail={specDetail} formModel={formModel} onBack={onBack} />
      )}
    </WhiskyTastingEventCreateGate>
  );
}
