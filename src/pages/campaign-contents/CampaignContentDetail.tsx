import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { FormField } from '@/components/common/FormField';
import {
  useCampaignContentDetail,
  useCampaignContentMetrics,
  useCampaignContentCreate,
  useCampaignContentUpdate,
  useCampaignContentDelete,
} from '@/hooks/useCampaignContents';
import { ApiError, getErrorMessage } from '@/lib/api-error';
import type { CampaignContentMetricsRange } from '@/types/api';
import {
  campaignContentSchema,
  campaignContentDefaults,
  type CampaignContentFormValues,
} from './campaign-content.schema';

function seoulToday() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function CampaignContentMetricsCard({ id }: { id: number }) {
  const [range, setRange] = useState<CampaignContentMetricsRange>({});
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState('');
  const { data, isLoading, isError, error: apiError } = useCampaignContentMetrics(id, range);
  const today = seoulToday();
  const lowerBound = new Date(`${today}T00:00:00Z`);
  lowerBound.setUTCDate(lowerBound.getUTCDate() - 89);
  const minimum = lowerBound.toISOString().slice(0, 10);
  const applyRange = () => {
    const start = from || data?.from;
    const end = to || data?.to;
    if (
      !start ||
      !end ||
      start < minimum ||
      end > today ||
      start > end ||
      start > today ||
      end < minimum
    ) {
      setError('최근 90일 이내의 올바른 기간을 선택해주세요.');
      return;
    }
    setError('');
    setRange({ from: start, to: end });
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>참여 지표</CardTitle>
        <CardDescription>서울 날짜 기준 선택 기간의 서버 집계입니다.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-sm">
            시작일
            <Input
              type="date"
              min={minimum}
              max={today}
              value={from || data?.from || ''}
              onChange={(event) => setFrom(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            종료일
            <Input
              type="date"
              min={minimum}
              max={today}
              value={to || data?.to || ''}
              onChange={(event) => setTo(event.target.value)}
            />
          </label>
          <Button type="button" variant="outline" onClick={applyRange}>
            조회
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {isError && (
          <p role="alert" className="text-sm text-destructive">
            {apiError instanceof ApiError &&
            apiError.hasCode('CAMPAIGN_CONTENT_INVALID_METRICS_RANGE')
              ? '조회 기간을 다시 확인해주세요.'
              : '지표를 불러오지 못했습니다.'}
          </p>
        )}
        {isLoading ? (
          <p>지표를 불러오는 중...</p>
        ) : (
          data && (
            <>
              <p className="text-sm text-muted-foreground">
                집계 기간: {data.from} ~ {data.to}
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {(
                  [
                    ['조회 방문자', data.viewVisitors],
                    ['시작 방문자', data.startVisitors],
                    ['완료 방문자', data.finishVisitors],
                    ['결과 조회 회원', data.resultMembers],
                    ['활성 회원', data.activeMembers],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-xl font-semibold">{value.toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {(
                  [
                    ['완료율', data.completionRate],
                    ['완료 방문자의 결과 조회율', data.loginConversionRate],
                    ['참여율', data.participationRate],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="rounded-lg border p-4">
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      {label}
                      {label === '완료 방문자의 결과 조회율' && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                aria-label="결과 조회율 집계 기준"
                                className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                <Info className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>
                                완료(FINISH) 방문자 중 같은 기간 같은 방문자로 로그인 상태의 결과
                                조회(RESULT)가 기록된 비율입니다. 본인 결과는 로그인 후 볼 수 있어
                                로그인 전환율의 근사치로 볼 수 있습니다. 이미 로그인한 방문자도
                                포함되므로 실제 로그인·가입 수는 아닙니다. 비회원 공유 결과 조회는
                                제외됩니다.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </p>
                    <p className="text-xl font-semibold">{value}%</p>
                  </div>
                ))}
              </div>
            </>
          )
        )}
      </CardContent>
    </Card>
  );
}

export function CampaignContentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const listPath = from?.startsWith('/campaign-contents') ? from : '/campaign-contents';
  const isNew = !id || id === 'new';
  const numericId =
    !isNew && id && /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id))
      ? Number(id)
      : undefined;
  const { data: detail, isLoading, isError } = useCampaignContentDetail(numericId);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  const form = useForm<CampaignContentFormValues>({
    resolver: zodResolver(campaignContentSchema),
    defaultValues: campaignContentDefaults,
  });
  const isActive = useWatch({ control: form.control, name: 'isActive' });
  useEffect(() => {
    if (detail)
      form.reset({
        code: detail.code,
        name: detail.name,
        description: detail.description ?? '',
        isActive: detail.isActive,
      });
  }, [detail, form]);

  function onError(error: ApiError) {
    if (
      error.hasCode('CAMPAIGN_CONTENT_DUPLICATE_CODE') ||
      error.hasCode('CAMPAIGN_CONTENT_INVALID_CODE')
    ) {
      form.setError('code', {
        message: error.hasCode('CAMPAIGN_CONTENT_DUPLICATE_CODE')
          ? '이미 사용 중인 코드입니다.'
          : '코드 형식을 확인해주세요.',
      });
    } else setActionError(getErrorMessage(error));
  }
  const create = useCampaignContentCreate({
    showErrorToast: false,
    onSuccess: (result) => navigate(`/campaign-contents/${result.targetId}`),
    onError,
  });
  const update = useCampaignContentUpdate({ showErrorToast: false, onError });
  const remove = useCampaignContentDelete({
    showErrorToast: false,
    onSuccess: () => navigate(listPath),
    onError: (error) => {
      setActionError(
        error.hasCode('CAMPAIGN_CONTENT_HAS_EVENTS')
          ? '참여 기록이 있어 삭제할 수 없습니다. 비활성화하세요.'
          : getErrorMessage(error)
      );
    },
  });
  const pending = create.isPending || update.isPending || remove.isPending;
  const submit = form.handleSubmit((values) => {
    if (pending) return;
    setActionError('');
    const data = { name: values.name, description: values.description, isActive: values.isActive };
    if (isNew) create.mutate({ code: values.code, ...data });
    else if (numericId) update.mutate({ id: numericId, data });
  });

  if (!isNew && !numericId)
    return (
      <p role="alert">
        올바르지 않은 콘텐츠 ID입니다.{' '}
        <Button variant="link" onClick={() => navigate(listPath)}>
          목록으로
        </Button>
      </p>
    );
  return (
    <div className="space-y-6">
      <DetailPageHeader
        title={isNew ? '캠페인 콘텐츠 등록' : '캠페인 콘텐츠 상세'}
        subtitle={detail ? `ID: ${detail.id}` : undefined}
        onBack={() => navigate(listPath)}
        actions={
          <>
            {!isNew && detail && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
                disabled={pending}
              >
                삭제
              </Button>
            )}
            <Button type="button" onClick={submit} disabled={pending || (!isNew && !detail)}>
              {pending ? '처리 중...' : isNew ? '등록' : '저장'}
            </Button>
          </>
        }
      />
      {actionError && (
        <p role="alert" className="text-sm text-destructive">
          {actionError}
        </p>
      )}
      {!isNew && isLoading ? (
        <p className="py-8 text-center">로딩 중...</p>
      ) : !isNew && (isError || !detail) ? (
        <p role="alert">상세 정보를 불러오지 못했습니다.</p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>코드는 등록 후 수정할 수 없습니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <FormField label="이름" required error={form.formState.errors.name?.message}>
                <Input aria-label="이름" maxLength={100} {...form.register('name')} />
              </FormField>
              <FormField label="코드" required error={form.formState.errors.code?.message}>
                <Input
                  aria-label="코드"
                  disabled={!isNew}
                  maxLength={50}
                  placeholder="whiskey-mbti"
                  {...form.register('code')}
                />
              </FormField>
              <FormField label="설명" required error={form.formState.errors.description?.message}>
                <Textarea aria-label="설명" maxLength={255} {...form.register('description')} />
              </FormField>
              <label className="flex items-center gap-3 text-sm font-medium">
                <Switch
                  checked={isActive}
                  onCheckedChange={(checked) =>
                    form.setValue('isActive', checked, { shouldDirty: true })
                  }
                />
                활성화
              </label>
              {!isNew && detail && (
                <p className="text-sm text-muted-foreground">
                  등록일: {detail.createdAt.slice(0, 10)} · 수정일: {detail.modifiedAt.slice(0, 10)}
                </p>
              )}
            </CardContent>
          </Card>
          {!isNew && numericId && detail && <CampaignContentMetricsCard id={numericId} />}
        </>
      )}
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => {
          if (numericId && !pending) remove.mutate(numericId);
        }}
        title="캠페인 콘텐츠 삭제"
        description="참여 기록이 없는 콘텐츠만 삭제할 수 있습니다. 이 작업은 되돌릴 수 없습니다."
        isPending={remove.isPending}
      />
    </div>
  );
}
