import { CurationSectionCard } from '../../components/CurationSectionCard';
import { TastingEventImageUploadField } from './TastingEventImageUploadField';

interface TastingEventImageSectionProps {
  onUploadingChange: (isUploading: boolean) => void;
}

export function TastingEventImageSection({ onUploadingChange }: TastingEventImageSectionProps) {
  return (
    <CurationSectionCard
      title="이미지"
      description="최대 3장까지 등록할 수 있고, 등록된 순서대로 노출됩니다."
      contentClassName="space-y-4"
    >
      <TastingEventImageUploadField onUploadingChange={onUploadingChange} />
    </CurationSectionCard>
  );
}
