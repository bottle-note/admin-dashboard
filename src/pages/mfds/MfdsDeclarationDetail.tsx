import type { ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';

import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useMfdsDeclarationDetail,
  useMfdsMatchingCandidates,
  useMfdsRcnoLinks,
} from '@/hooks/useMfdsDeclarations';
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
  return <p className="text-sm text-muted-foreground">저장된 후보 없음</p>;
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
        <DetailPageHeader title="수입 신고 상세" onBack={() => navigate('/mfds/declarations')} />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="mb-4 text-muted-foreground">올바르지 않은 수입 신고 ID입니다.</p>
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
      <div className="py-16 text-center text-muted-foreground">수입 신고를 불러오는 중입니다.</div>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="space-y-6">
        <DetailPageHeader title="수입 신고 상세" onBack={() => navigate('/mfds/declarations')} />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="mb-4 text-muted-foreground">수입 신고 상세를 불러오지 못했습니다.</p>
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

  return (
    <div className="space-y-6">
      <DetailPageHeader
        title={detail.baseProductNameKo ?? detail.skuDisplayNameKo ?? '수입 신고 상세'}
        subtitle={`신고 ID ${detail.id} · RCNO ${detail.rcno}`}
        onBack={() => navigate('/mfds/declarations')}
        action={{ mode: 'readonly' }}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>신고 기본 정보</CardTitle>
            <CardDescription>식약처 원문과 정제된 제품 이름을 함께 표시합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
              <DetailField label="RCNO">{detail.rcno}</DetailField>
              <DetailField label="신고 ID">{detail.id}</DetailField>
              <DetailField label="제품명 원문 (한글)">
                {displayValue(detail.alcoholNameKo)}
              </DetailField>
              <DetailField label="제품명 원문 (영문)">
                {displayValue(detail.alcoholNameEn)}
              </DetailField>
              <DetailField label="정제 기본 제품명 (한글)">
                {displayValue(detail.baseProductNameKo)}
              </DetailField>
              <DetailField label="정제 기본 제품명 (영문)">
                {displayValue(detail.baseProductNameEn)}
              </DetailField>
              <DetailField label="SKU 표시명 (한글)">
                {displayValue(detail.skuDisplayNameKo)}
              </DetailField>
              <DetailField label="SKU 표시명 (영문)">
                {displayValue(detail.skuDisplayNameEn)}
              </DetailField>
              <DetailField label="주종 (한글)">
                {displayValue(detail.alcoholCategoryKo)}
              </DetailField>
              <DetailField label="주종 (영문)">
                {displayValue(detail.alcoholCategoryEn)}
              </DetailField>
              <DetailField label="제조사">{displayValue(detail.manufacturerName)}</DetailField>
              <DetailField label="제조 국가">
                {displayValue(detail.manufactureCountryNameKo)}
              </DetailField>
              <DetailField label="수출 국가">
                {displayValue(detail.exportCountryNameKo)}
              </DetailField>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>제품 규격</CardTitle>
            <CardDescription>수집된 원문과 정제 결과를 비교할 수 있습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
              <DetailField label="용량 원문">{displayValue(detail.volumeRaw)}</DetailField>
              <DetailField label="정제 용량">{displayValue(detail.volumeMl, ' ml')}</DetailField>
              <DetailField label="단위 용량">
                {displayValue(detail.unitVolumeMl, ' ml')}
              </DetailField>
              <DetailField label="포장 수량">{displayValue(detail.packageCount, '개')}</DetailField>
              <DetailField label="도수 원문">{displayValue(detail.abvRaw)}</DetailField>
              <DetailField label="정제 도수">{displayValue(detail.abvPercent, '%')}</DetailField>
              <DetailField label="숙성 연수">{displayValue(detail.ageYears, '년')}</DetailField>
              <DetailField label="빈티지">{displayValue(detail.vintageYear)}</DetailField>
              <DetailField label="에디션">{displayValue(detail.editionName)}</DetailField>
              <DetailField label="캐스크 번호">{displayValue(detail.caskNumber)}</DetailField>
              <DetailField label="배치 번호">{displayValue(detail.batchNumber)}</DetailField>
              <DetailField label="소비기한 범위">
                {detail.expiryStart || detail.expiryEnd
                  ? `${detail.expiryStart ?? '-'} ~ ${detail.expiryEnd ?? '-'}`
                  : '-'}
              </DetailField>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>정제 및 검토 상태</CardTitle>
          <CardDescription>자동 정제 결과와 운영 검토 기록입니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <dl className="grid gap-5 md:grid-cols-4">
            <DetailField label="정규화 상태">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    MFDS_NORMALIZATION_STATUS_MAP[detail.normalizationStatus].badgeClassName
                  }
                >
                  {MFDS_NORMALIZATION_STATUS_MAP[detail.normalizationStatus].label}
                </Badge>
              </div>
            </DetailField>
            <DetailField label="정제 시각">{formatDateTime(detail.normalizedAt)}</DetailField>
            <DetailField label="검토 상태">{detail.reviewStatus}</DetailField>
            <DetailField label="검토 시각">{formatDateTime(detail.reviewedAt)}</DetailField>
            <DetailField label="검토자">{displayValue(detail.reviewedBy)}</DetailField>
            <DetailField label="검토 메모">{displayValue(detail.reviewNote)}</DetailField>
          </dl>
          <div className="grid gap-5 md:grid-cols-2">
            <DetailField label="정규화 사유">
              {detail.normalizationReasons.length > 0 ? (
                <ul className="list-inside list-disc space-y-1">
                  {detail.normalizationReasons.map((reason, index) => (
                    <li key={`${reason}-${index}`}>{reason}</li>
                  ))}
                </ul>
              ) : (
                '정규화 사유 없음'
              )}
            </DetailField>
            <DetailField label="파싱하지 못한 원문">
              {detail.unparsedFragments.length > 0 ? (
                <ul className="list-inside list-disc space-y-1">
                  {detail.unparsedFragments.map((fragment, index) => (
                    <li key={`${fragment}-${index}`}>{fragment}</li>
                  ))}
                </ul>
              ) : (
                '미해석 원문 없음'
              )}
            </DetailField>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>현재 수입사 연결</CardTitle>
            <CardDescription>이 신고에 현재 연결되어 있는 수입사 정보입니다.</CardDescription>
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
            <CardTitle>RCNO 연결 근거</CardTitle>
            <CardDescription>
              현재 연결 상태가 아닌, 수집 당시 출처를 보존한 감사 정보입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rcnoLinksQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">연결 근거를 불러오는 중입니다.</p>
            ) : rcnoLinksQuery.isError ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  RCNO 연결 근거를 불러오지 못했습니다.
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
              <p className="text-sm text-muted-foreground">저장된 RCNO 연결 근거 없음</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>보틀노트 매칭</CardTitle>
          <CardDescription>
            자동 판정과 실제 선택된 연결을 구분합니다. 선택 ID가 있어야 연결된 상태입니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid gap-5 md:grid-cols-3">
            <DetailField label="선택된 술">
              {detail.selectedAlcoholId ? (
                <Link
                  className="text-primary hover:underline"
                  to={`/whisky/${detail.selectedAlcoholId}`}
                >
                  술 ID {detail.selectedAlcoholId}
                </Link>
              ) : (
                '연결된 정보 없음'
              )}
            </DetailField>
            <DetailField label="선택된 증류소">
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
            <DetailField label="선택된 지역">
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
            <DetailField label="술 자동 판정">
              {detail.alcoholMatchDecision
                ? (MATCH_DECISION_LABELS[detail.alcoholMatchDecision] ??
                  detail.alcoholMatchDecision)
                : '판정 없음'}
            </DetailField>
            <DetailField label="매칭 시각">{formatDateTime(detail.matchedAt)}</DetailField>
            <DetailField label="매칭 버전">{displayValue(candidates?.matchingVersion)}</DetailField>
          </div>

          {candidatesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">저장된 후보를 불러오는 중입니다.</p>
          ) : candidatesQuery.isError ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                저장된 매칭 후보를 불러오지 못했습니다.
              </p>
              <Button variant="outline" size="sm" onClick={() => candidatesQuery.refetch()}>
                다시 시도
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-3">
                <h3 className="font-semibold">술 후보</h3>
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
                <h3 className="font-semibold">증류소 후보</h3>
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
                <h3 className="font-semibold">지역 후보</h3>
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
          <CardTitle>시스템 기록</CardTitle>
          <CardDescription>수입일이 아니라 어드민 데이터 처리 시각입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-5 sm:grid-cols-3">
            <DetailField label="데이터 적재 시각">{formatDateTime(detail.createdAt)}</DetailField>
            <DetailField label="데이터 수정 시각">{formatDateTime(detail.updatedAt)}</DetailField>
            <DetailField label="매칭 처리 시각">{formatDateTime(detail.matchedAt)}</DetailField>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
