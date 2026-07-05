import type { ReactNode } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';

import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { CurationV2Spec, CurationV2SpecCode } from '@/types/api';

import { useCurationSpecFormModel } from '../useCurationSpecFormModel';
import {
  createWhiskyCurationFormModel,
  type WhiskyCurationFormModel,
} from './whisky-curation.schema';

type CreatePageViewState =
  | 'specs-loading'
  | 'specs-error'
  | 'spec-missing'
  | 'detail-loading'
  | 'detail-error'
  | 'form';

interface WhiskyCurationCreateGateRenderArgs {
  specDetail: CurationV2Spec;
  formModel: WhiskyCurationFormModel;
  onBack: () => void;
}

interface WhiskyCurationCreateGateProps {
  specCode: CurationV2SpecCode;
  fallbackTitle: string;
  children: (args: WhiskyCurationCreateGateRenderArgs) => ReactNode;
}

export function WhiskyCurationCreateGate({
  specCode,
  fallbackTitle,
  children,
}: WhiskyCurationCreateGateProps) {
  const navigate = useNavigate();
  const { specsQuery, targetSpec, specDetailQuery, specDetail, formModel } =
    useCurationSpecFormModel({
      specCode,
      createFormModel: createWhiskyCurationFormModel,
    });

  const handleBack = () => {
    navigate('/dashboard/curations');
  };

  let viewState: CreatePageViewState = 'form';
  if (specsQuery.isLoading) {
    viewState = 'specs-loading';
  } else if (specsQuery.isError) {
    viewState = 'specs-error';
  } else if (!targetSpec) {
    viewState = 'spec-missing';
  } else if (specDetailQuery.isLoading) {
    viewState = 'detail-loading';
  } else if (specDetailQuery.isError) {
    viewState = 'detail-error';
  } else if (!specDetail || !formModel) {
    viewState = 'detail-loading';
  }

  const renderContent = () => {
    switch (viewState) {
      case 'specs-loading':
        return <LoadingState message="큐레이션 스펙을 불러오는 중입니다." />;
      case 'specs-error':
        return (
          <BlockingState
            title="큐레이션 스펙 목록을 불러오지 못했습니다."
            description="큐레이션 스펙 목록 조회에 실패했습니다. 잠시 후 다시 시도해 주세요."
            onRetry={() => void specsQuery.refetch()}
            onBack={handleBack}
          />
        );
      case 'spec-missing':
        return (
          <BlockingState
            title="큐레이션 스펙을 찾을 수 없습니다."
            description="활성화된 큐레이션 스펙이 등록되어 있지 않습니다."
            onBack={handleBack}
          />
        );
      case 'detail-loading':
        return <LoadingState message="큐레이션 스펙 상세를 불러오는 중입니다." />;
      case 'detail-error':
        return (
          <BlockingState
            title="큐레이션 스펙 상세를 불러올 권한이 없습니다."
            description="상세 스펙 조회에 실패해 작성 화면을 열 수 없습니다. 권한을 확인해 주세요."
            onRetry={() => void specDetailQuery.refetch()}
            onBack={handleBack}
          />
        );
      case 'form':
        if (!specDetail || !formModel) {
          return <LoadingState message="큐레이션 스펙 상세를 불러오는 중입니다." />;
        }

        return children({ specDetail, formModel, onBack: handleBack });
    }
  };

  if (viewState === 'form') {
    return renderContent();
  }

  return (
    <div className="space-y-6">
      <DetailPageHeader
        title={fallbackTitle}
        subtitle={specDetail?.name ?? fallbackTitle}
        onBack={handleBack}
        actions={
          <Button type="button" variant="outline" onClick={handleBack}>
            목록
          </Button>
        }
      />

      {renderContent()}
    </div>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <Card className="shadow-none">
      <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        {message}
      </CardContent>
    </Card>
  );
}

interface BlockingStateProps {
  title: string;
  description: string;
  onRetry?: () => void;
  onBack: () => void;
}

function BlockingState({ title, description, onRetry, onBack }: BlockingStateProps) {
  return (
    <Card className="shadow-none">
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" aria-hidden="true" />
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {onRetry && (
            <Button type="button" variant="outline" onClick={onRetry}>
              다시 시도
            </Button>
          )}
          <Button type="button" onClick={onBack}>
            목록
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
