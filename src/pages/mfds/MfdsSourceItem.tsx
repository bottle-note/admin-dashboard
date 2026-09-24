import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMfdsSourceItem } from '@/hooks/useMfdsDeclarations';
import type { MfdsItemDetail } from '@/types/api';

const fields: { key: keyof MfdsItemDetail; label: string }[] = [
  { key: 'productNameKo', label: '원장 품목명(한글)' },
  { key: 'productNameEn', label: '원장 품목명(영문)' },
  { key: 'importerName', label: '수입사' },
  { key: 'overseasEstablishmentName', label: '해외 제조업소' },
  { key: 'itemName', label: '품목' },
  { key: 'productDivisionName', label: '제품 구분' },
  { key: 'manufactureCountryName', label: '제조 국가' },
  { key: 'exportCountryName', label: '수출 국가' },
  { key: 'processedDate', label: '통관일자' },
  { key: 'expiryText', label: '소비기한 원문' },
];

export function MfdsSourceItem({ rcno }: { rcno: string }) {
  const query = useMfdsSourceItem(rcno);
  if (query.isLoading)
    return (
      <p className="py-12 text-center text-muted-foreground">원장 정보를 불러오는 중입니다.</p>
    );
  if (query.isError)
    return (
      <div className="space-y-3 rounded-lg border p-8 text-center">
        <p>
          {query.error.hasCode('MFDS_ITEM_NOT_FOUND')
            ? '이 신고번호에 해당하는 원장 정보가 없습니다.'
            : '원장 정보를 불러오지 못했습니다.'}
        </p>
        <Button variant="outline" onClick={() => query.refetch()}>
          다시 시도
        </Button>
      </div>
    );
  if (!query.data)
    return <p className="py-12 text-center text-muted-foreground">원장 정보가 없습니다.</p>;
  const source = query.data;
  const href = source.detailHref;
  const safeLink = href && /^https?:\/\//i.test(href) ? href : null;
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">원장 정보</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          같은 신고번호로 가장 최근에 수집한 정보입니다. 정제 데이터에 사용된 수집 건과 다를 수
          있습니다.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">식약처 신고 원문</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {fields.map(({ key, label }) => (
              <div key={key} className="min-w-0">
                <dt className="mb-1 text-xs text-muted-foreground">{label}</dt>
                <dd className="text-sm [overflow-wrap:anywhere]">{source[key] ?? '-'}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">수집 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="mb-1 text-xs text-muted-foreground">원장 수집 시각</dt>
              <dd className="text-sm">{new Date(source.observedAt).toLocaleString('ko-KR')}</dd>
            </div>
            <div>
              <dt className="mb-1 text-xs text-muted-foreground">신고번호</dt>
              <dd className="text-sm">{source.rcno}</dd>
            </div>
            <div>
              <dt className="mb-1 text-xs text-muted-foreground">원장 ID</dt>
              <dd className="text-sm">{source.id}</dd>
            </div>
            <div>
              <dt className="mb-1 text-xs text-muted-foreground">수집 조회 품목</dt>
              <dd className="text-sm">{source.queriedItemName}</dd>
            </div>
            <div>
              <dt className="mb-1 text-xs text-muted-foreground">수집 조회 품목 코드</dt>
              <dd className="text-sm">{source.queriedItemCode}</dd>
            </div>
            <div className="min-w-0">
              <dt className="mb-1 text-xs text-muted-foreground">원문 링크</dt>
              <dd className="text-sm [overflow-wrap:anywhere]">
                {safeLink ? (
                  <a
                    href={safeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4"
                  >
                    식약처 원문 열기
                  </a>
                ) : href ? (
                  '직접 열기 미지원'
                ) : (
                  '-'
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
