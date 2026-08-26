import type { ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';

import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useMfdsDeclarationDetail,
  useMfdsMatchingCandidates,
  useMfdsRcnoLinks,
} from '@/hooks/useMfdsDeclarations';
import { cn } from '@/lib/utils';
import { MFDS_NORMALIZATION_STATUS_MAP } from './mfds-normalization-status';

const MATCH_DECISION_LABELS: Record<string, string> = {
  CANDIDATE: '후보 선택',
  MANUAL: '직접 선택',
  AUTO_SELECTED: '자동 선정',
  NO_MATCH: '후보 없음',
  REVIEW: '검토 필요',
  AMBIGUOUS: '후보 모호',
  CONFLICT_REVIEW: '충돌 검토',
};

const REVIEW_STATUS_LABELS: Record<string, string> = {
  PENDING: '검토 대기',
};

function displayValue(value: string | number | null | undefined, suffix = '') {
  if (value === null || value === undefined || value === '') return '-';
  return `${typeof value === 'number' ? value.toLocaleString() : value}${suffix}`;
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

function EmptyCandidates() {
  return <p className="text-sm text-muted-foreground">저장된 연결 후보 없음</p>;
}

export function MfdsDeclarationDetailPage() {
  const navigate = useNavigate();
  const { declarationId: declarationIdParam } = useParams<{ declarationId: string }>();
  const parsedId = Number(declarationIdParam);
  const declarationId = Number.isInteger(parsedId) && parsedId > 0 ? parsedId : undefined;

  const detailQuery = useMfdsDeclarationDetail(declarationId);
  const candidatesQuery = useMfdsMatchingCandidates(declarationId);
  const rcnoLinksQuery = useMfdsRcnoLinks(detailQuery.data?.rcno);

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
        <h2 className="text-lg font-semibold">신고 정보 비교</h2>
        <div className="rounded-lg border">
          <div className="border-b bg-muted/30 px-4 py-3 text-sm font-medium">수집 제품명</div>
          <dl className="grid gap-4 p-4 sm:grid-cols-2">
            <DetailField label="한글">{displayValue(detail.alcoholNameKo)}</DetailField>
            <DetailField label="영문">{displayValue(detail.alcoholNameEn)}</DetailField>
          </dl>
        </div>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">분류</TableHead>
                <TableHead className="w-[220px]">항목</TableHead>
                <TableHead>정규화 결과</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell rowSpan={4} className="bg-muted/20 align-top font-medium">
                  제품명
                </TableCell>
                <TableCell className="bg-muted/20 font-medium">SKU 표시명 (한글)</TableCell>
                <TableCell>{displayValue(detail.skuDisplayNameKo)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="bg-muted/20 font-medium">SKU 표시명 (영문)</TableCell>
                <TableCell>{displayValue(detail.skuDisplayNameEn)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="bg-muted/20 font-medium">기본 제품명 (한글)</TableCell>
                <TableCell>{displayValue(detail.baseProductNameKo)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="bg-muted/20 font-medium">기본 제품명 (영문)</TableCell>
                <TableCell>{displayValue(detail.baseProductNameEn)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell rowSpan={2} className="bg-muted/20 align-top font-medium">
                  제품 분류
                </TableCell>
                <TableCell className="bg-muted/20 font-medium">주종 (한글)</TableCell>
                <TableCell>{displayValue(detail.alcoholCategoryKo)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="bg-muted/20 font-medium">주종 (영문)</TableCell>
                <TableCell>{displayValue(detail.alcoholCategoryEn)}</TableCell>
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
                <TableCell>{displayValue(detail.volumeMl, ' ml')}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="bg-muted/20 font-medium">단위 용량</TableCell>
                <TableCell>{displayValue(detail.unitVolumeMl, ' ml')}</TableCell>
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
                <TableCell className="bg-muted/20 align-top font-medium">유통</TableCell>
                <TableCell className="bg-muted/20 font-medium">소비기한</TableCell>
                <TableCell>
                  {detail.expiryStart || detail.expiryEnd
                    ? `${detail.expiryStart ?? '-'} ~ ${detail.expiryEnd ?? '-'}`
                    : '-'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>수입사 매핑 결과</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-5">
              <DetailField label="수집된 수입사명">
                {displayValue(detail.importerBaseName)}
              </DetailField>
            </div>
            {detail.importer ? (
              <dl className="grid gap-5 sm:grid-cols-2">
                <DetailField label="수입사">{detail.importer.businessName}</DetailField>
                <DetailField label="수입사 ID">{detail.importer.id}</DetailField>
                <DetailField label="연결 방식">
                  {displayValue(detail.importerLinkSource)}
                </DetailField>
                <DetailField label="연결 시각">
                  {formatDateTime(detail.importerLinkedAt)}
                </DetailField>
                <DetailField label="영업 상태">{detail.importer.operatingStatus}</DetailField>
                <DetailField label="관리 상태">{detail.importer.adminStatus}</DetailField>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">연결된 수입사 없음</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>수입사 매핑 근거</CardTitle>
          </CardHeader>
          <CardContent>
            {rcnoLinksQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">연결 근거를 불러오는 중입니다.</p>
            ) : rcnoLinksQuery.isError ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  수입사 매핑 근거를 불러오지 못했습니다.
                </p>
                <Button variant="outline" size="sm" onClick={() => rcnoLinksQuery.refetch()}>
                  다시 시도
                </Button>
              </div>
            ) : rcnoLinksQuery.data?.length ? (
              <div className="space-y-5">
                {rcnoLinksQuery.data.map((link, index) => (
                  <dl
                    key={`${link.importerId}-${index}`}
                    className="grid gap-4 border-b pb-5 last:border-0 last:pb-0 sm:grid-cols-2"
                  >
                    <DetailField label="원문 수입사명">{link.sourceImporterName}</DetailField>
                    <DetailField label="수입사 ID">{link.importerId}</DetailField>
                    <DetailField label="근거 유형">{link.linkSource}</DetailField>
                    <DetailField label="관측 시각">
                      {formatDateTime(link.sourceObservedAt)}
                    </DetailField>
                    <DetailField label="출처 URL">
                      {link.sourceGalleryUrl ? (
                        <a
                          href={link.sourceGalleryUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          원문 열기 <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        '-'
                      )}
                    </DetailField>
                  </dl>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">저장된 수입사 매핑 근거 없음</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>보틀노트 데이터 연결</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid gap-5 md:grid-cols-3">
            <DetailField label="연결된 위스키">
              {detail.selectedAlcoholId ? (
                <Link
                  className="text-primary hover:underline"
                  to={`/whisky/${detail.selectedAlcoholId}`}
                >
                  위스키 ID {detail.selectedAlcoholId}
                </Link>
              ) : (
                '연결된 정보 없음'
              )}
            </DetailField>
            <DetailField label="연결된 증류소">
              {detail.selectedDistilleryId ? (
                <Link
                  className="text-primary hover:underline"
                  to={`/distilleries/${detail.selectedDistilleryId}`}
                >
                  증류소 ID {detail.selectedDistilleryId}
                </Link>
              ) : (
                '연결된 정보 없음'
              )}
            </DetailField>
            <DetailField label="연결된 지역">
              {detail.selectedRegionId ? (
                <Link
                  className="text-primary hover:underline"
                  to={`/regions/${detail.selectedRegionId}`}
                >
                  지역 ID {detail.selectedRegionId}
                </Link>
              ) : (
                '연결된 정보 없음'
              )}
            </DetailField>
            <DetailField label="위스키 연결 판정">
              {detail.alcoholMatchDecision
                ? (MATCH_DECISION_LABELS[detail.alcoholMatchDecision] ??
                  detail.alcoholMatchDecision)
                : '판정 없음'}
            </DetailField>
            <DetailField label="연결 처리 시각">{formatDateTime(detail.matchedAt)}</DetailField>
            <DetailField label="연결 로직 버전">
              {displayValue(candidates?.matchingVersion)}
            </DetailField>
          </div>

          {candidatesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">저장된 연결 후보를 불러오는 중입니다.</p>
          ) : candidatesQuery.isError ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                저장된 연결 후보를 불러오지 못했습니다.
              </p>
              <Button variant="outline" size="sm" onClick={() => candidatesQuery.refetch()}>
                다시 시도
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-3">
                <h3 className="font-semibold">위스키 연결 후보</h3>
                {candidates?.alcoholCandidates.length ? (
                  candidates.alcoholCandidates.map((candidate) => (
                    <div key={candidate.alcoholId} className="rounded-lg border p-3 text-sm">
                      <Link
                        className="font-medium text-primary hover:underline"
                        to={`/whisky/${candidate.alcoholId}`}
                      >
                        {candidate.korName ?? candidate.engName ?? '이름 정보 없음'}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        ID {candidate.alcoholId} · 점수 {candidate.score.toFixed(3)}
                      </p>
                    </div>
                  ))
                ) : (
                  <EmptyCandidates />
                )}
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold">증류소 연결 후보</h3>
                {candidates?.distilleryCandidates.length ? (
                  candidates.distilleryCandidates.map((candidate) => (
                    <div key={candidate.id} className="rounded-lg border p-3 text-sm">
                      <Link
                        className="font-medium text-primary hover:underline"
                        to={`/distilleries/${candidate.id}`}
                      >
                        {candidate.korName ?? candidate.engName ?? '이름 정보 없음'}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        ID {candidate.id} · 점수 {candidate.score.toFixed(3)}
                      </p>
                    </div>
                  ))
                ) : (
                  <EmptyCandidates />
                )}
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold">지역 연결 후보</h3>
                {candidates?.regionCandidates.length ? (
                  candidates.regionCandidates.map((candidate) => (
                    <div key={candidate.id} className="rounded-lg border p-3 text-sm">
                      <Link
                        className="font-medium text-primary hover:underline"
                        to={`/regions/${candidate.id}`}
                      >
                        {candidate.korName ?? candidate.engName ?? '이름 정보 없음'}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        ID {candidate.id} · 점수 {candidate.score.toFixed(3)}
                      </p>
                    </div>
                  ))
                ) : (
                  <EmptyCandidates />
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}
