import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { Check, Info } from 'lucide-react';
import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMfdsDeclarationDetail, useMfdsMatchingCandidates } from '@/hooks/useMfdsDeclarations';
import { useAdminAlcoholDetail } from '@/hooks/useAdminAlcohols';
import type { MfdsDeclarationDetail } from '@/types/api';
import { MFDS_MATCH_DECISION_MAP } from './mfds-alcohol-match-status';
import { MfdsImporterLinkingSheet } from './MfdsImporterLinkingSheet';
import { MfdsWhiskyMatchingSheet } from './MfdsWhiskyMatchingSheet';
import { MfdsRelatedDeclarations } from './MfdsRelatedDeclarations';
import { MfdsSourceItem } from './MfdsSourceItem';
import { MfdsWhiskyRegistration } from './MfdsWhiskyRegistration';

const DETAIL_TABS = ['clean', 'source', 'history', 'register'] as const;
const DETAIL_TAB_LABELS: Record<(typeof DETAIL_TABS)[number], string> = {
  clean: '정제 정보 · 매칭 관리',
  source: '원장 정보',
  history: '관련 내역',
  register: '위스키 등록',
};

function value(input: string | number | null | undefined, suffix = '') {
  return input == null || input === '' ? '-' : `${input}${suffix}`;
}
function time(input: string | null | undefined) {
  return input ? new Date(input).toLocaleString('ko-KR') : '-';
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}
const extraFields: { key: keyof MfdsDeclarationDetail; label: string; description: string }[] = [
  {
    key: 'alcoholNameKo',
    label: '매칭 품목명(한글)',
    description:
      '매칭 시 연결된 위스키 이름이 반영되며, 매칭 전에는 정제 후보 이름이 표시될 수 있습니다. 연결 해제 후에도 이전 이름이 남을 수 있습니다. 매칭 여부는 연결 상태 표시로 확인하세요.',
  },
  {
    key: 'alcoholNameEn',
    label: '매칭 품목명(영문)',
    description:
      '매칭 시 연결된 위스키 이름이 반영되며, 매칭 전에는 정제 후보 이름이 표시될 수 있습니다. 연결 해제 후에도 이전 이름이 남을 수 있습니다. 매칭 여부는 연결 상태 표시로 확인하세요.',
  },
  {
    key: 'baseProductNameKo',
    label: '기본 품목명(한글)',
    description:
      '원문에서 용량·도수·숙성 연수·LOT 등 SKU 속성을 뺀 기본 이름입니다. 매칭과 관계없이 원문 기준으로 유지됩니다.',
  },
  {
    key: 'baseProductNameEn',
    label: '기본 품목명(영문)',
    description:
      '원문에서 용량·도수·숙성 연수·LOT 등 SKU 속성을 뺀 기본 이름입니다. 매칭과 관계없이 원문 기준으로 유지됩니다.',
  },
  {
    key: 'skuDisplayNameKo',
    label: 'SKU 표시명(한글)',
    description:
      '원문의 포장 문구를 정리하고 용량·도수·숙성 연수는 남긴 신고별 이름입니다. 매칭으로 바뀌지 않으며, 매칭된 알코올 이름이 없는 경우 제품명으로 노출합니다.',
  },
  {
    key: 'skuDisplayNameEn',
    label: 'SKU 표시명(영문)',
    description:
      '원문의 포장 문구를 정리하고 용량·도수·숙성 연수는 남긴 신고별 이름입니다. 매칭으로 바뀌지 않으며, 매칭된 알코올 이름이 없는 경우 제품명으로 노출합니다.',
  },
  { key: 'processedDate', label: '통관일자', description: '연결된 원장의 통관일자입니다.' },
  { key: 'volumeRaw', label: '용량 원문', description: '용량을 정제하기 전 문자열입니다.' },
  { key: 'abvRaw', label: '도수 원문', description: '도수를 정제하기 전 문자열입니다.' },
  { key: 'volumeMl', label: '총용량', description: '정제된 용량이며 단위는 ml입니다.' },
  { key: 'packageCount', label: '포장 수량', description: '포장에 포함된 수량입니다.' },
  { key: 'vintageYear', label: '빈티지', description: '제품에 표시된 빈티지 연도입니다.' },
  { key: 'editionName', label: '에디션', description: '제품의 에디션 이름입니다.' },
  { key: 'caskNumber', label: '캐스크 번호', description: '제품에 표시된 캐스크 식별 번호입니다.' },
  { key: 'batchNumber', label: '배치 번호', description: '생산 배치 식별 번호입니다.' },
  { key: 'expiryStart', label: '소비기한 시작일', description: '소비기한 시작일입니다.' },
  { key: 'expiryEnd', label: '소비기한 종료일', description: '소비기한 종료일입니다.' },
  {
    key: 'importerBaseName',
    label: '수입사 기본명',
    description: '신고 데이터에 저장된 수입사 이름입니다.',
  },
];

export function MfdsDeclarationDetailPage() {
  const navigate = useNavigate();
  const { declarationId: rawId } = useParams<{ declarationId: string }>();
  const id = Number(rawId);
  const declarationId = Number.isInteger(id) && id > 0 ? id : undefined;
  const [params, setParams] = useSearchParams();
  const requestedTab = params.get('tab');
  const tab = DETAIL_TABS.find((item) => item === requestedTab) ?? 'clean';
  const [registrationVisited, setRegistrationVisited] = useState<number | undefined>(undefined);
  const [matchingOpen, setMatchingOpen] = useState(false);
  const [importerOpen, setImporterOpen] = useState(false);
  const detailQuery = useMfdsDeclarationDetail(declarationId);
  const candidatesQuery = useMfdsMatchingCandidates(declarationId);
  const detail = detailQuery.data;
  const whiskyQuery = useAdminAlcoholDetail(detail?.selectedAlcoholId ?? undefined);
  if (!declarationId)
    return (
      <div className="space-y-4">
        <p>올바르지 않은 신고 데이터 ID입니다.</p>
        <Button onClick={() => navigate('/mfds/declarations')}>목록으로 돌아가기</Button>
      </div>
    );
  if (detailQuery.isLoading)
    return (
      <p className="py-16 text-center text-muted-foreground">신고 데이터를 불러오는 중입니다.</p>
    );
  if (detailQuery.isError || !detail)
    return (
      <div className="space-y-4 py-12 text-center">
        <p>신고 데이터를 불러오지 못했습니다.</p>
        <Button onClick={() => detailQuery.refetch()}>다시 시도</Button>
      </div>
    );
  const connected = detail.selectedAlcoholId != null;
  const candidate = candidatesQuery.data?.alcoholCandidates.find(
    (item) => item.alcoholId === detail.selectedAlcoholId
  );
  const ko =
    (connected
      ? whiskyQuery.data?.korName?.trim() ||
        candidate?.korName?.trim() ||
        detail.alcoholNameKo?.trim()
      : null) ||
    detail.skuDisplayNameKo ||
    detail.baseProductNameKo ||
    '신고 데이터 검토';
  const en =
    (connected
      ? whiskyQuery.data?.engName?.trim() ||
        candidate?.engName?.trim() ||
        detail.alcoholNameEn?.trim()
      : null) || detail.skuDisplayNameEn;
  const distillery = candidatesQuery.data?.distilleryCandidates.find(
    (item) => item.id === detail.selectedDistilleryId
  );
  const region = candidatesQuery.data?.regionCandidates.find(
    (item) => item.id === detail.selectedRegionId
  );
  const distilleryName =
    whiskyQuery.data?.distilleryId === detail.selectedDistilleryId
      ? whiskyQuery.data?.korDistillery
      : distillery?.korName;
  const regionName =
    whiskyQuery.data?.regionId === detail.selectedRegionId
      ? whiskyQuery.data?.korRegion
      : region?.korName;
  return (
    <div className="min-w-0 space-y-5 [overflow-wrap:anywhere] [word-break:keep-all] [&_h1]:min-w-0 [&_h1]:max-w-full">
      <DetailPageHeader title={ko} onBack={() => navigate('/mfds/declarations')} />
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <Badge
          variant="outline"
          className={connected ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : ''}
        >
          {connected ? '위스키 연결됨' : '위스키 미매칭'}
        </Badge>
        <span>신고 ID {detail.id}</span>
        <span>RCNO {detail.rcno}</span>
      </div>
      <div>
        <div
          role="tablist"
          aria-label="신고 상세 보기"
          className="flex gap-1 overflow-x-auto border-b"
        >
          {DETAIL_TABS.map((item, index) => (
            <button
              key={item}
              type="button"
              role="tab"
              id={`tab-${item}`}
              aria-controls={`panel-${item}`}
              aria-selected={tab === item}
              tabIndex={tab === item ? 0 : -1}
              className={`shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium ${tab === item ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              onClick={() => {
                if (item === 'register' || tab === 'register') setRegistrationVisited(detail.id);
                setParams((previous) => {
                  const next = new URLSearchParams(previous);
                  next.set('tab', item);
                  return next;
                });
              }}
              onKeyDown={(event) => {
                if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
                  event.preventDefault();
                  const target =
                    event.key === 'Home'
                      ? 'clean'
                      : event.key === 'End'
                        ? 'register'
                        : DETAIL_TABS[
                            (index + (event.key === 'ArrowRight' ? 1 : DETAIL_TABS.length - 1)) %
                              DETAIL_TABS.length
                          ];
                  document.getElementById(`tab-${target}`)?.click();
                  document.getElementById(`tab-${target}`)?.focus();
                }
              }}
            >
              {DETAIL_TAB_LABELS[item]}
            </button>
          ))}
        </div>
        <section
          role="tabpanel"
          id="panel-clean"
          aria-labelledby="tab-clean"
          hidden={tab !== 'clean'}
          className="mt-5 space-y-5"
        >
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <Card className="min-w-0">
              <CardContent className="space-y-6 pt-6">
                <div>
                  <p className="text-lg font-semibold">{ko}</p>
                  <p className="mt-1 text-sm text-muted-foreground [overflow-wrap:anywhere]">
                    {value(en)}
                  </p>
                </div>
                <dl className="grid grid-cols-2 gap-4 rounded-lg bg-muted/40 p-4 sm:grid-cols-4">
                  <Field label="숙성 연수">{value(detail.ageYears, '년')}</Field>
                  <Field label="단위 용량">{value(detail.unitVolumeMl, ' ml')}</Field>
                  <Field label="도수">{value(detail.abvPercent, '%')}</Field>
                  <Field label="주종">
                    {value(detail.alcoholCategoryKo)}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {value(detail.alcoholCategoryEn)}
                    </p>
                  </Field>
                </dl>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <Field label="기본 품목명">
                    {value(detail.baseProductNameKo)}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {value(detail.baseProductNameEn)}
                    </p>
                  </Field>
                  <Field label="제조사">{value(detail.manufacturerName)}</Field>
                  <Field label="제조 국가">{value(detail.manufactureCountryNameKo)}</Field>
                  <Field label="수출 국가">{value(detail.exportCountryNameKo)}</Field>
                </dl>
                <details open className="border-t pt-4">
                  <summary className="cursor-pointer text-sm font-medium">
                    추가 식별 · 규격 정보{' '}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {extraFields.length}개 항목
                    </span>
                  </summary>
                  <TooltipProvider delayDuration={150}>
                    <dl className="mt-3 divide-y">
                      {extraFields.map((field) => (
                        <div
                          key={field.key}
                          className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 py-2 text-sm sm:grid-cols-[145px_minmax(0,1fr)]"
                        >
                          <dt>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1 text-left text-xs text-muted-foreground"
                                >
                                  {field.label}
                                  <Info className="h-3 w-3" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>
                                  {field.key} : {field.description}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </dt>
                          <dd className="[overflow-wrap:anywhere]">
                            <span className="mr-2 text-muted-foreground">:</span>
                            {typeof detail[field.key] === 'string' ||
                            typeof detail[field.key] === 'number'
                              ? String(detail[field.key]) || '-'
                              : '-'}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </TooltipProvider>
                </details>
              </CardContent>
            </Card>
            <div className="min-w-0 space-y-5 [overflow-wrap:anywhere] [word-break:keep-all] [&_h1]:min-w-0 [&_h1]:max-w-full">
              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle className="text-lg">매칭 관리</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    현재 연결을 확인하고 후보 또는 직접 검색으로 위스키를 선택합니다.
                  </p>
                </CardHeader>
                <CardContent className="space-y-5">
                  <section
                    className={`space-y-3 rounded-lg border p-4 ${connected ? 'border-emerald-300 bg-emerald-50/30 shadow-[0_0_14px_rgba(16,185,129,0.12),inset_0_0_12px_rgba(16,185,129,0.04)]' : 'border-amber-300 bg-amber-50/40'}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        현재 연결된 보틀노트 위스키
                      </span>
                      <Badge variant="outline">
                        {connected
                          ? (MFDS_MATCH_DECISION_MAP[detail.alcoholMatchDecision ?? '']?.label ??
                            detail.alcoholMatchDecision ??
                            '연결됨')
                          : '미매칭'}
                      </Badge>
                    </div>
                    {connected ? (
                      <div>
                        <Link
                          className="font-semibold hover:underline"
                          to={`/whisky/${detail.selectedAlcoholId}`}
                        >
                          <span className="inline-flex max-w-full items-start gap-2">
                            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-300 bg-emerald-950 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.4)]">
                              <Check className="h-3 w-3" aria-hidden="true" />
                            </span>
                            <span className="min-w-0">{ko}</span>
                          </span>
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">
                          위스키 ID {detail.selectedAlcoholId}
                        </p>
                        {whiskyQuery.isError && (
                          <button
                            className="mt-2 text-xs underline"
                            onClick={() => whiskyQuery.refetch()}
                          >
                            위스키 이름 다시 조회
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="font-medium">연결된 위스키가 없습니다.</p>
                    )}
                    <Button
                      className={connected ? '' : 'bg-amber-700 text-white hover:bg-amber-800'}
                      onClick={() => setMatchingOpen(true)}
                    >
                      {candidatesQuery.data?.alcoholCandidates.length
                        ? `후보 ${candidatesQuery.data.alcoholCandidates.length}건 선택 · 직접 검색`
                        : '위스키 검색 · 연결'}
                    </Button>
                    {candidatesQuery.isError && (
                      <p className="text-xs text-muted-foreground">
                        후보를 불러오지 못했습니다. 연결 창에서 재시도할 수 있습니다.
                      </p>
                    )}
                  </section>
                  <dl className="divide-y">
                    <div className="flex justify-between gap-4 py-3">
                      <dt className="inline-flex shrink-0 items-center gap-2 self-start text-sm text-muted-foreground">
                        증류소
                        {detail.selectedDistilleryId != null && (
                          <span
                            aria-label="증류소 연결됨"
                            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-emerald-300 bg-emerald-950 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                          >
                            <Check className="h-3 w-3" aria-hidden="true" />
                          </span>
                        )}
                      </dt>
                      <dd className="min-w-0 text-right text-sm">
                        {detail.selectedDistilleryId == null ? (
                          '연결 안 됨'
                        ) : (
                          <>
                            {distilleryName || '이름 미확인'}
                            <p className="text-xs text-muted-foreground">
                              ID {detail.selectedDistilleryId}
                            </p>
                          </>
                        )}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 py-3">
                      <dt className="inline-flex shrink-0 items-center gap-2 self-start text-sm text-muted-foreground">
                        지역
                        {detail.selectedRegionId != null && (
                          <span
                            aria-label="지역 연결됨"
                            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-emerald-300 bg-emerald-950 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                          >
                            <Check className="h-3 w-3" aria-hidden="true" />
                          </span>
                        )}
                      </dt>
                      <dd className="min-w-0 text-right text-sm">
                        {detail.selectedRegionId == null ? (
                          '연결 안 됨'
                        ) : (
                          <>
                            {regionName || '이름 미확인'}
                            <p className="text-xs text-muted-foreground">
                              ID {detail.selectedRegionId}
                            </p>
                          </>
                        )}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-3 py-3">
                      <dt className="shrink-0 text-sm text-muted-foreground">수입사</dt>
                      <dd className="flex min-w-0 items-start gap-2 text-sm">
                        <span className="[overflow-wrap:anywhere]">
                          {detail.importer?.businessName ?? detail.importerBaseName ?? '연결 안 됨'}
                        </span>
                        <Button
                          className="shrink-0"
                          size="sm"
                          variant="outline"
                          onClick={() => setImporterOpen(true)}
                        >
                          관리
                        </Button>
                      </dd>
                    </div>
                  </dl>
                  <p className="text-xs text-muted-foreground">
                    위스키 연결을 확정하면 증류소와 지역도 함께 반영됩니다. 정제 정보는 수정할 수
                    없습니다.
                  </p>
                </CardContent>
              </Card>
              <details open className="rounded-lg border px-5 py-4">
                <summary className="cursor-pointer text-sm font-medium">데이터 처리 기록</summary>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="데이터 생성 시각">{time(detail.createdAt)}</Field>
                  <Field label="데이터 수정 시각">{time(detail.updatedAt)}</Field>
                  <Field label="매칭 처리 시각">{time(detail.matchedAt)}</Field>
                </dl>
              </details>
            </div>
          </div>
        </section>
        <section
          role="tabpanel"
          id="panel-source"
          aria-labelledby="tab-source"
          hidden={tab !== 'source'}
          className="mt-5"
        >
          {tab === 'source' && <MfdsSourceItem rcno={detail.rcno} />}
        </section>
        <section
          role="tabpanel"
          id="panel-history"
          aria-labelledby="tab-history"
          hidden={tab !== 'history'}
          className="mt-5"
        >
          {tab === 'history' && (
            <MfdsRelatedDeclarations
              key={detail.id}
              declarationId={detail.id}
              defaultKeyword={
                detail.baseProductNameKo ||
                detail.baseProductNameEn ||
                detail.skuDisplayNameKo ||
                ''
              }
            />
          )}
        </section>
        <section
          role="tabpanel"
          id="panel-register"
          aria-labelledby="tab-register"
          hidden={tab !== 'register'}
          className="mt-5"
        >
          {connected ? (
            <p className="rounded-lg border bg-muted/30 p-5 text-sm">
              이미 위스키가 연결된 신고입니다. 연결된 위스키는 정제 정보 · 매칭 관리 탭에서
              확인하세요.
            </p>
          ) : (
            (tab === 'register' || registrationVisited === detail.id) && (
              <MfdsWhiskyRegistration
                key={detail.id}
                source={detail}
                onComplete={() => {
                  setRegistrationVisited(undefined);
                  setParams((previous) => {
                    const next = new URLSearchParams(previous);
                    next.set('tab', 'clean');
                    return next;
                  });
                }}
              />
            )
          )}
        </section>
      </div>
      <MfdsWhiskyMatchingSheet
        key={`matching-${detail.id}`}
        declarationId={detail.id}
        declarationName={ko}
        rcno={detail.rcno}
        selectedAlcoholId={detail.selectedAlcoholId}
        open={matchingOpen}
        onOpenChange={setMatchingOpen}
      />
      <MfdsImporterLinkingSheet
        declarationId={detail.id}
        declarationName={ko}
        rcno={detail.rcno}
        importer={detail.importer}
        open={importerOpen}
        onOpenChange={setImporterOpen}
      />
    </div>
  );
}
