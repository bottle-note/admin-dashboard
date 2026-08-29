import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMfdsDeclarationDetail, useMfdsMatchingCandidates } from '@/hooks/useMfdsDeclarations';
import { cn } from '@/lib/utils';
import {
  MFDS_ALCOHOL_MATCH_STATUS_MAP,
  MFDS_MATCH_DECISION_MAP,
  MFDS_UNKNOWN_RELATION_CODE,
} from './mfds-alcohol-match-status';
import { MFDS_NORMALIZATION_STATUS_MAP } from './mfds-normalization-status';
import { MfdsWhiskyMatchingSheet } from './MfdsWhiskyMatchingSheet';

const REVIEW_STATUS_LABELS: Record<string, string> = {
  PENDING: '검토 대기',
};

function displayValue(value: string | number | null | undefined, suffix = '') {
  if (value === null || value === undefined || value === '') return '-';
  return `${value}${suffix}`;
}

function formatDateTime(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString('ko-KR') : '-';
}

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm">{children}</dd>
    </div>
  );
}

function BilingualValue({
  ko,
  en,
}: {
  ko: string | null | undefined;
  en: string | null | undefined;
}) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      <DetailField label="한글">{displayValue(ko)}</DetailField>
      <DetailField label="영문">{displayValue(en)}</DetailField>
    </dl>
  );
}

function EmptyCandidates() {
  return <p className="text-sm text-muted-foreground">저장된 연결 후보 없음</p>;
}

function ConnectionStatusBadge({ connected }: { connected: boolean }) {
  const status = connected
    ? MFDS_ALCOHOL_MATCH_STATUS_MAP.CONNECTED
    : MFDS_ALCOHOL_MATCH_STATUS_MAP.UNCONNECTED;

  return (
    <Badge variant="outline" className={status.badgeClassName}>
      {status.label}
    </Badge>
  );
}

function RelationCodeBadge({ value }: { value: string | null | undefined }) {
  if (!value) return '-';

  const config = MFDS_MATCH_DECISION_MAP[value];

  return (
    <Badge
      variant="outline"
      className={config?.badgeClassName ?? MFDS_UNKNOWN_RELATION_CODE.badgeClassName}
    >
      {config?.label ?? value}
    </Badge>
  );
}

export function MfdsDeclarationDetailPage() {
  const navigate = useNavigate();
  const { declarationId: declarationIdParam } = useParams<{ declarationId: string }>();
  const [isWhiskyMatchingOpen, setIsWhiskyMatchingOpen] = useState(false);
  const parsedId = Number(declarationIdParam);
  const declarationId = Number.isInteger(parsedId) && parsedId > 0 ? parsedId : undefined;

  const detailQuery = useMfdsDeclarationDetail(declarationId);
  const candidatesQuery = useMfdsMatchingCandidates(declarationId);

  if (!declarationId) {
    return (
      <div className="space-y-6">
        <DetailPageHeader title="신고 데이터 검토" onBack={() => navigate('/mfds/declarations')} />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="mb-4 text-muted-foreground">올바르지 않은 신고 데이터 ID입니다.</p>
            <Button variant="outline" onClick={() => navigate('/mfds/declarations')}>
              목록으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (detailQuery.isLoading) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        신고 데이터를 불러오는 중입니다.
      </div>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="space-y-6">
        <DetailPageHeader title="신고 데이터 검토" onBack={() => navigate('/mfds/declarations')} />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="mb-4 text-muted-foreground">신고 데이터를 불러오지 못했습니다.</p>
            <Button variant="outline" onClick={() => detailQuery.refetch()}>
              다시 시도
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const detail = detailQuery.data;
  const candidates = candidatesQuery.data;
  const normalizationStatus = MFDS_NORMALIZATION_STATUS_MAP[detail.normalizationStatus];
  const reviewStatusLabel = REVIEW_STATUS_LABELS[detail.reviewStatus] ?? detail.reviewStatus;
  const hasReviewRecord = Boolean(detail.reviewedBy || detail.reviewedAt || detail.reviewNote);
  const showStatusDetails =
    detail.normalizationStatus !== 'NORMALIZED' &&
    Boolean(
      detail.normalizationReasons.length > 0 ||
      detail.unparsedFragments.length > 0 ||
      hasReviewRecord ||
      (detail.reviewStatus && detail.reviewStatus !== 'NOT_REQUIRED')
    );
  const selectedAlcohol = candidates?.alcoholCandidates.find(
    (candidate) => candidate.alcoholId === detail.selectedAlcoholId
  );
  const selectedDistillery = candidates?.distilleryCandidates.find(
    (candidate) => candidate.id === detail.selectedDistilleryId
  );
  const selectedRegion = candidates?.regionCandidates.find(
    (candidate) => candidate.id === detail.selectedRegionId
  );

  return (
    <div className="space-y-6">
      <DetailPageHeader
        title={detail.skuDisplayNameKo ?? detail.baseProductNameKo ?? '신고 데이터 검토'}
        titleAddon={
          <Badge
            aria-label="정규화 상태"
            variant="outline"
            className={normalizationStatus.badgeClassName}
          >
            {normalizationStatus.label}
          </Badge>
        }
        onBack={() => navigate('/mfds/declarations')}
        action={{ mode: 'readonly' }}
      />

      <Card>
        <CardHeader>
          <CardTitle>데이터 처리 기록</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            <DetailField label="데이터 ID">{detail.id}</DetailField>
            <DetailField label="RCNO">{detail.rcno}</DetailField>
            <DetailField label="데이터 적재 시각">{formatDateTime(detail.createdAt)}</DetailField>
            <DetailField label="데이터 수정 시각">{formatDateTime(detail.updatedAt)}</DetailField>
            <DetailField label="연결 처리 시각">{formatDateTime(detail.matchedAt)}</DetailField>
          </dl>
        </CardContent>
      </Card>

      {showStatusDetails && (
        <section
          aria-label="데이터 처리 상태"
          className={cn('rounded-lg border px-4 py-3', normalizationStatus.panelClassName)}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            {detail.reviewStatus && detail.reviewStatus !== 'NOT_REQUIRED' && (
              <Badge variant="outline" className="bg-background/80">
                {reviewStatusLabel}
              </Badge>
            )}
            {detail.normalizedAt && (
              <span className="text-sm text-muted-foreground">
                정규화 시각 {formatDateTime(detail.normalizedAt)}
              </span>
            )}
          </div>

          <div className="border-current/10 mt-4 grid gap-5 border-t pt-4 md:grid-cols-2">
            {detail.normalizationReasons.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold">정규화 처리 코드</h2>
                <ul className="list-inside list-disc space-y-1 text-sm">
                  {detail.normalizationReasons.map((reason, index) => (
                    <li key={`${reason}-${index}`}>
                      <code className="text-xs">{reason}</code>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {detail.unparsedFragments.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold">미해석 원문</h2>
                <div className="flex flex-wrap gap-2">
                  {detail.unparsedFragments.map((fragment, index) => (
                    <code
                      key={`${fragment}-${index}`}
                      className="rounded border bg-background/70 px-2 py-1 text-xs"
                    >
                      {fragment}
                    </code>
                  ))}
                </div>
              </div>
            )}

            {hasReviewRecord && (
              <dl className="border-current/10 grid gap-4 border-t pt-4 md:col-span-2 md:grid-cols-3">
                <DetailField label="검토자">{displayValue(detail.reviewedBy)}</DetailField>
                <DetailField label="검토 시각">{formatDateTime(detail.reviewedAt)}</DetailField>
                <DetailField label="검토 메모">{displayValue(detail.reviewNote)}</DetailField>
              </dl>
            )}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">정규화 결과</h2>
        <div className="rounded-lg border">
          <div className="border-b bg-muted/30 px-4 py-3 text-sm font-medium">수집 제품명</div>
          <dl className="grid gap-4 p-4 sm:grid-cols-2">
            <DetailField label="한글">{displayValue(detail.alcoholNameKo)}</DetailField>
            <DetailField label="영문">{displayValue(detail.alcoholNameEn)}</DetailField>
          </dl>
        </div>
        <div className="overflow-hidden rounded-lg border">
          <Table className="[&_td]:px-4 [&_th]:whitespace-nowrap [&_th]:px-4">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">분류</TableHead>
                <TableHead className="w-[220px]">항목</TableHead>
                <TableHead>정규화 결과</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell rowSpan={2} className="bg-muted/20 align-top font-medium">
                  제품명
                </TableCell>
                <TableCell className="bg-muted/20 font-medium">SKU 표시명</TableCell>
                <TableCell>
                  <BilingualValue ko={detail.skuDisplayNameKo} en={detail.skuDisplayNameEn} />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="bg-muted/20 font-medium">기본 제품명</TableCell>
                <TableCell>
                  <BilingualValue ko={detail.baseProductNameKo} en={detail.baseProductNameEn} />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="bg-muted/20 align-top font-medium">제품 분류</TableCell>
                <TableCell className="bg-muted/20 font-medium">주종</TableCell>
                <TableCell>
                  <BilingualValue ko={detail.alcoholCategoryKo} en={detail.alcoholCategoryEn} />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell rowSpan={3} className="bg-muted/20 align-top font-medium">
                  제조 정보
                </TableCell>
                <TableCell className="bg-muted/20 font-medium">제조사</TableCell>
                <TableCell>{displayValue(detail.manufacturerName)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="bg-muted/20 font-medium">제조 국가</TableCell>
                <TableCell>{displayValue(detail.manufactureCountryNameKo)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="bg-muted/20 font-medium">수출 국가</TableCell>
                <TableCell>{displayValue(detail.exportCountryNameKo)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell rowSpan={5} className="bg-muted/20 align-top font-medium">
                  제품 식별
                </TableCell>
                <TableCell className="bg-muted/20 font-medium">숙성 연수</TableCell>
                <TableCell>{displayValue(detail.ageYears, '년')}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="bg-muted/20 font-medium">빈티지</TableCell>
                <TableCell>{displayValue(detail.vintageYear)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="bg-muted/20 font-medium">에디션</TableCell>
                <TableCell>{displayValue(detail.editionName)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="bg-muted/20 font-medium">캐스크 번호</TableCell>
                <TableCell>{displayValue(detail.caskNumber)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="bg-muted/20 font-medium">배치 번호</TableCell>
                <TableCell>{displayValue(detail.batchNumber)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell rowSpan={4} className="bg-muted/20 align-top font-medium">
                  규격
                </TableCell>
                <TableCell className="bg-muted/20 font-medium">총용량</TableCell>
                <TableCell>{displayValue(detail.volumeMl)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="bg-muted/20 font-medium">단위 용량</TableCell>
                <TableCell>{displayValue(detail.unitVolumeMl)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="bg-muted/20 font-medium">포장 수량</TableCell>
                <TableCell>{displayValue(detail.packageCount, '개')}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="bg-muted/20 font-medium">도수</TableCell>
                <TableCell>{displayValue(detail.abvPercent, '%')}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell rowSpan={2} className="bg-muted/20 align-top font-medium">
                  유통
                </TableCell>
                <TableCell className="bg-muted/20 font-medium">소비기한 시작일</TableCell>
                <TableCell>{displayValue(detail.expiryStart)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="bg-muted/20 font-medium">소비기한 종료일</TableCell>
                <TableCell>{displayValue(detail.expiryEnd)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">수입사 연결</h2>
        <div className="overflow-x-auto rounded-lg border">
          <Table className="[&_td]:px-4 [&_th]:whitespace-nowrap [&_th]:px-4">
            <TableHeader>
              <TableRow>
                <TableHead>현재 연결</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>처리 시각</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  {detail.importer ? (
                    <Link
                      className="font-medium text-primary underline underline-offset-4"
                      to={`/mfds/importers/${detail.importer.id}`}
                    >
                      {detail.importer.businessName}
                    </Link>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <ConnectionStatusBadge connected={Boolean(detail.importer)} />
                </TableCell>
                <TableCell>{formatDateTime(detail.importerLinkedAt)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">연관 데이터 연결</h2>
        <div className="overflow-x-auto rounded-lg border">
          <Table className="[&_td]:px-4 [&_th]:whitespace-nowrap [&_th]:px-4">
            <TableHeader>
              <TableRow>
                <TableHead>연결 대상</TableHead>
                <TableHead>현재 연결</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>매칭 판정</TableHead>
                <TableHead>후보</TableHead>
                <TableHead>처리 시각</TableHead>
                <TableHead className="w-[80px]">상세</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">위스키</TableCell>
                <TableCell>
                  {detail.selectedAlcoholId ? (
                    <Link
                      className="text-primary hover:underline"
                      to={`/whisky/${detail.selectedAlcoholId}`}
                    >
                      {selectedAlcohol?.korName ??
                        selectedAlcohol?.engName ??
                        `ID ${detail.selectedAlcoholId}`}
                    </Link>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <ConnectionStatusBadge connected={Boolean(detail.selectedAlcoholId)} />
                </TableCell>
                <TableCell>
                  <RelationCodeBadge value={detail.alcoholMatchDecision} />
                </TableCell>
                <TableCell>
                  {candidatesQuery.isLoading
                    ? '불러오는 중'
                    : candidatesQuery.isError
                      ? '조회 실패'
                      : `후보 ${candidates?.alcoholCandidates.length ?? 0}건`}
                </TableCell>
                <TableCell>{formatDateTime(detail.matchedAt)}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => setIsWhiskyMatchingOpen(true)}>
                    연결 관리
                  </Button>
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-medium">증류소</TableCell>
                <TableCell>
                  {detail.selectedDistilleryId ? (
                    <Link
                      className="text-primary hover:underline"
                      to={`/distilleries/${detail.selectedDistilleryId}`}
                    >
                      {selectedDistillery?.korName ??
                        selectedDistillery?.engName ??
                        `ID ${detail.selectedDistilleryId}`}
                    </Link>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <ConnectionStatusBadge connected={Boolean(detail.selectedDistilleryId)} />
                </TableCell>
                <TableCell>
                  <RelationCodeBadge value={candidates?.selection.distilleryMatchSource} />
                </TableCell>
                <TableCell>
                  {candidatesQuery.isLoading
                    ? '불러오는 중'
                    : candidatesQuery.isError
                      ? '조회 실패'
                      : `후보 ${candidates?.distilleryCandidates.length ?? 0}건`}
                </TableCell>
                <TableCell>{formatDateTime(detail.matchedAt)}</TableCell>
                <TableCell>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm">
                        보기
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="overflow-y-auto sm:max-w-lg">
                      <SheetHeader>
                        <SheetTitle>증류소 연결 상세</SheetTitle>
                        <SheetDescription className="sr-only">
                          연결된 증류소와 저장된 연결 후보를 확인합니다.
                        </SheetDescription>
                      </SheetHeader>
                      <div className="mt-6 space-y-8">
                        <section className="space-y-3">
                          <h3 className="font-semibold">현재 연결</h3>
                          {detail.selectedDistilleryId ? (
                            <Link
                              className="text-primary hover:underline"
                              to={`/distilleries/${detail.selectedDistilleryId}`}
                            >
                              {selectedDistillery?.korName ??
                                selectedDistillery?.engName ??
                                `ID ${detail.selectedDistilleryId}`}
                            </Link>
                          ) : (
                            <p className="text-sm text-muted-foreground">연결된 증류소 없음</p>
                          )}
                        </section>
                        <section className="space-y-3">
                          <h3 className="font-semibold">연결 후보</h3>
                          {candidatesQuery.isLoading ? (
                            <p className="text-sm text-muted-foreground">
                              저장된 연결 후보를 불러오는 중입니다.
                            </p>
                          ) : candidatesQuery.isError ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => candidatesQuery.refetch()}
                            >
                              다시 시도
                            </Button>
                          ) : candidates?.distilleryCandidates.length ? (
                            candidates.distilleryCandidates.map((candidate) => (
                              <Link
                                key={candidate.id}
                                className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
                                to={`/distilleries/${candidate.id}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <p className="font-medium">
                                  {candidate.korName ?? candidate.engName ?? `ID ${candidate.id}`}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  점수 {candidate.score.toFixed(3)}
                                </p>
                              </Link>
                            ))
                          ) : (
                            <EmptyCandidates />
                          )}
                        </section>
                      </div>
                    </SheetContent>
                  </Sheet>
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-medium">지역</TableCell>
                <TableCell>
                  {detail.selectedRegionId ? (
                    <Link
                      className="text-primary hover:underline"
                      to={`/regions/${detail.selectedRegionId}`}
                    >
                      {selectedRegion?.korName ??
                        selectedRegion?.engName ??
                        `ID ${detail.selectedRegionId}`}
                    </Link>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <ConnectionStatusBadge connected={Boolean(detail.selectedRegionId)} />
                </TableCell>
                <TableCell>
                  <RelationCodeBadge value={candidates?.selection.regionMatchSource} />
                </TableCell>
                <TableCell>
                  {candidatesQuery.isLoading
                    ? '불러오는 중'
                    : candidatesQuery.isError
                      ? '조회 실패'
                      : `후보 ${candidates?.regionCandidates.length ?? 0}건`}
                </TableCell>
                <TableCell>{formatDateTime(detail.matchedAt)}</TableCell>
                <TableCell>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm">
                        보기
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="overflow-y-auto sm:max-w-lg">
                      <SheetHeader>
                        <SheetTitle>지역 연결 상세</SheetTitle>
                        <SheetDescription className="sr-only">
                          연결된 지역과 저장된 연결 후보를 확인합니다.
                        </SheetDescription>
                      </SheetHeader>
                      <div className="mt-6 space-y-8">
                        <section className="space-y-3">
                          <h3 className="font-semibold">현재 연결</h3>
                          {detail.selectedRegionId ? (
                            <Link
                              className="text-primary hover:underline"
                              to={`/regions/${detail.selectedRegionId}`}
                            >
                              {selectedRegion?.korName ??
                                selectedRegion?.engName ??
                                `ID ${detail.selectedRegionId}`}
                            </Link>
                          ) : (
                            <p className="text-sm text-muted-foreground">연결된 지역 없음</p>
                          )}
                        </section>
                        <section className="space-y-3">
                          <h3 className="font-semibold">연결 후보</h3>
                          {candidatesQuery.isLoading ? (
                            <p className="text-sm text-muted-foreground">
                              저장된 연결 후보를 불러오는 중입니다.
                            </p>
                          ) : candidatesQuery.isError ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => candidatesQuery.refetch()}
                            >
                              다시 시도
                            </Button>
                          ) : candidates?.regionCandidates.length ? (
                            candidates.regionCandidates.map((candidate) => (
                              <Link
                                key={candidate.id}
                                className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
                                to={`/regions/${candidate.id}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <p className="font-medium">
                                  {candidate.korName ?? candidate.engName ?? `ID ${candidate.id}`}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  점수 {candidate.score.toFixed(3)}
                                </p>
                              </Link>
                            ))
                          ) : (
                            <EmptyCandidates />
                          )}
                        </section>
                      </div>
                    </SheetContent>
                  </Sheet>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      <MfdsWhiskyMatchingSheet
        declarationId={detail.id}
        declarationName={detail.skuDisplayNameKo ?? detail.baseProductNameKo ?? '신고 데이터 검토'}
        rcno={detail.rcno}
        selectedAlcoholId={detail.selectedAlcoholId}
        open={isWhiskyMatchingOpen}
        onOpenChange={setIsWhiskyMatchingOpen}
      />
    </div>
  );
}
