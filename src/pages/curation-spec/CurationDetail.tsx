import { FormProvider, useForm, type FieldValues } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';

import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { useCurationDetail } from '@/hooks/useCurations';
import { CurationSpecCode } from '@/types/api';

import { CurationSpecRenderer } from './components/CurationSpecRenderer';
import { getWhiskyTastingEventSections } from './curation-sections';

export function CurationDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const parsedId = Number(id);
  const curationId = Number.isInteger(parsedId) && parsedId > 0 ? parsedId : undefined;
  const { data } = useCurationDetail(curationId);
  const form = useForm<FieldValues>({
    values: data?.payload as FieldValues,
  });
  let specContent;

  if (data) {
    switch (data.spec.code) {
      case CurationSpecCode.WHISKY_TASTING_EVENT:
        specContent = (
          <CurationSpecRenderer
            requestSpec={data.spec.requestSpec}
            sections={getWhiskyTastingEventSections(data.spec.requestSpec)}
          />
        );
        break;
      case CurationSpecCode.RECOMMENDED_WHISKY:
        break;
      case CurationSpecCode.WHISKY_PAIRING:
        break;
      case CurationSpecCode.PROGRAM:
        break;
    }
  }

  return (
    <div className="space-y-6">
      <DetailPageHeader
        title={data ? `[${data.spec.name}] ${data.name}` : '큐레이션 상세'}
        onBack={() => navigate('/dashboard/curations')}
        action={
          data
            ? {
                mode: 'edit',
                onUpdate: () => console.log('Update curation:', data),
                onDelete: () => console.log('Delete curation:', data),
              }
            : undefined
        }
      />

      <FormProvider {...form}>{specContent}</FormProvider>
    </div>
  );
}
