import { CurationImageUploadField } from './CurationImageUploadField';
import { CurationSectionCard } from './CurationSectionCard';

interface CurationImageSectionProps {
  onUploadingChange: (isUploading: boolean) => void;
}

export function CurationImageSection({ onUploadingChange }: CurationImageSectionProps) {
  return (
    <CurationSectionCard
      title="이미지"
      description="최대 3장까지 등록할 수 있고, 등록된 순서대로 노출됩니다."
      contentClassName="space-y-4"
    >
      <CurationImageUploadField onUploadingChange={onUploadingChange} />
    </CurationSectionCard>
  );
}
