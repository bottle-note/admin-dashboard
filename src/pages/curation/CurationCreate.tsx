import { AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';

import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCurationSpec, useCurationSpecs } from '@/hooks/useCurations';
import { CurationSpecCode, type CurationV2Spec, type CurationV2SpecCode } from '@/types/api';

import { SchemaDrivenCurationForm } from './schema-driven/SchemaDrivenCurationForm';
import {
  createSchemaDrivenCurationFormModel,
  type SchemaDrivenCurationFormModel,
} from './schema-driven/schema-driven-curation.form-model';
import { WhiskyCurationForm } from './whisky-curation/WhiskyCurationForm';
import {
  createWhiskyCurationFormModel,
  type WhiskyCurationFormModel,
} from './whisky-curation/whisky-curation.schema';
import { WhiskyTastingEventForm } from './whisky-tasting-event/WhiskyTastingEventForm';
import {
  createWhiskyTastingEventFormModel,
  type WhiskyTastingEventFormModel,
} from './whisky-tasting-event/whisky-tasting-event.form-model';

type CurationCreateStrategy =
  | { kind: 'tasting-event'; formModel: WhiskyTastingEventFormModel }
  | { kind: 'whisky-curation'; formModel: WhiskyCurationFormModel }
  | { kind: 'schema-driven'; formModel: SchemaDrivenCurationFormModel };

export function CurationCreatePage() {
  const navigate = useNavigate();
  const { specCode } = useParams<{ specCode: CurationV2SpecCode }>();
  const specsQuery = useCurationSpecs();
  const targetSpec =
    specsQuery.data?.find((spec) => spec.code === specCode && spec.isActive) ?? null;
  const specDetailQuery = useCurationSpec(targetSpec?.id, targetSpec?.version, {
    showErrorToast: false,
  });
  const handleBack = () => navigate('/dashboard/curations');
  let strategy: CurationCreateStrategy | null = null;
  let schemaError: Error | null = null;

  if (specDetailQuery.data) {
    try {
      strategy = resolveCurationCreateStrategy(specDetailQuery.data);
    } catch (error) {
      schemaError = error instanceof Error ? error : new Error('스펙을 해석하지 못했습니다.');
    }
  }

  if (strategy) {
    switch (strategy.kind) {
      case 'tasting-event':
        return (
          <WhiskyTastingEventForm
            specDetail={specDetailQuery.data!}
            formModel={strategy.formModel}
            onBack={handleBack}
          />
        );
      case 'whisky-curation':
        return (
          <WhiskyCurationForm
            specDetail={strategy.formModel.spec}
            formModel={strategy.formModel}
            onBack={handleBack}
          />
        );
      case 'schema-driven':
        return <SchemaDrivenCurationForm formModel={strategy.formModel} onBack={handleBack} />;
    }
  }

  const isLoading = specsQuery.isLoading || (Boolean(targetSpec) && specDetailQuery.isLoading);
  const isError = specsQuery.isError || specDetailQuery.isError;
  const title = targetSpec?.name ? `${targetSpec.name} 작성` : '큐레이션 작성';

  return (
    <div className="space-y-6">
      <DetailPageHeader
        title={title}
        onBack={handleBack}
        actions={
          <Button type="button" variant="outline" onClick={handleBack}>
            목록
          </Button>
        }
      />

      <Card className="shadow-none">
        <CardContent className="p-6">
          {isLoading ? (
            <p className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              큐레이션 스펙을 불러오는 중입니다.
            </p>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" aria-hidden="true" />
                <div>
                  <h2 className="font-semibold">
                    {schemaError
                      ? '이 스펙은 아직 자동 폼에서 지원하지 않습니다.'
                      : isError
                        ? '큐레이션 스펙을 불러오지 못했습니다.'
                        : '큐레이션 스펙을 찾을 수 없습니다.'}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {schemaError?.message ??
                      (isError
                        ? '잠시 후 다시 시도해 주세요.'
                        : '활성화된 큐레이션 스펙이 등록되어 있지 않습니다.')}
                  </p>
                </div>
              </div>
              {isError && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    void specsQuery.refetch();
                    void specDetailQuery.refetch();
                  }}
                >
                  다시 시도
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function resolveCurationCreateStrategy(spec: CurationV2Spec): CurationCreateStrategy {
  switch (spec.code) {
    case CurationSpecCode.WHISKY_TASTING_EVENT:
      return {
        kind: 'tasting-event',
        formModel: createWhiskyTastingEventFormModel(spec),
      };
    case CurationSpecCode.RECOMMENDED_WHISKY:
    case CurationSpecCode.WHISKY_PAIRING:
      return {
        kind: 'whisky-curation',
        formModel: createWhiskyCurationFormModel(spec),
      };
    default:
      return {
        kind: 'schema-driven',
        formModel: createSchemaDrivenCurationFormModel(spec),
      };
  }
}
