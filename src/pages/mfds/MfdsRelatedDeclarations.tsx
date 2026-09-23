import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMfdsDeclarationList } from '@/hooks/useMfdsDeclarations';

export function MfdsRelatedDeclarations({
  declarationId,
  defaultKeyword,
}: {
  declarationId: number;
  defaultKeyword: string;
}) {
  const [params, setParams] = useSearchParams();
  const keyword = params.get('relatedKeyword') ?? defaultKeyword;
  const cursorValue = Number(params.get('relatedCursor'));
  const cursor = Number.isInteger(cursorValue) && cursorValue > 0 ? cursorValue : undefined;
  const [draft, setDraft] = useState(keyword);
  const query = useMfdsDeclarationList({ keyword: keyword || undefined, cursor, pageSize: 20 });
  const items = query.data?.items.filter((item) => item.id !== declarationId) ?? [];
  function update(values: Record<string, string | undefined>) {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      Object.entries(values).forEach(([key, value]) =>
        value === undefined ? next.delete(key) : next.set(key, value)
      );
      return next;
    });
  }
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">관련 내역</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          이름으로 다른 신고를 검색합니다. 검색 결과가 동일한 제품임을 의미하지는 않습니다.
        </p>
      </div>
      <form
        className="flex max-w-xl gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          update({ relatedKeyword: draft.trim(), relatedCursor: undefined });
        }}
      >
        <Input
          aria-label="관련 내역 검색"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="제품명 또는 신고번호 검색"
        />
        <Button type="submit">검색</Button>
      </form>
      {query.isLoading ? (
        <p className="py-10 text-center text-muted-foreground">관련 내역을 불러오는 중입니다.</p>
      ) : query.isError ? (
        <div className="space-y-3 py-8 text-center">
          <p>관련 내역을 불러오지 못했습니다.</p>
          <Button variant="outline" onClick={() => query.refetch()}>
            다시 시도
          </Button>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border">
            <Table aria-label="관련 내역">
              <TableHeader>
                <TableRow>
                  <TableHead>제품명</TableHead>
                  <TableHead>신고번호</TableHead>
                  <TableHead>통관일자</TableHead>
                  <TableHead>도수</TableHead>
                  <TableHead>용량</TableHead>
                  <TableHead>숙성 연수</TableHead>
                  <TableHead>수입사</TableHead>
                  <TableHead>위스키 연결</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      이 페이지에 다른 신고가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Link
                          to={`/mfds/declarations/${item.id}?tab=clean`}
                          className="block max-w-[260px] truncate font-medium hover:underline"
                          title={item.skuDisplayNameKo ?? item.baseProductNameKo ?? ''}
                        >
                          {item.skuDisplayNameKo ?? item.baseProductNameKo ?? '이름 없음'}
                        </Link>
                      </TableCell>
                      <TableCell>{item.rcno}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {item.processedDate ?? '-'}
                      </TableCell>
                      <TableCell>{item.abvPercent == null ? '-' : `${item.abvPercent}%`}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {item.volumeMl == null ? '-' : `${item.volumeMl} ml`}
                      </TableCell>
                      <TableCell>{item.ageYears == null ? '-' : `${item.ageYears}년`}</TableCell>
                      <TableCell>
                        <p className="max-w-[180px] truncate" title={item.importerBaseName ?? ''}>
                          {item.importerBaseName ?? '-'}
                        </p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {item.selectedAlcoholId != null ? '연결됨' : '미매칭'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end gap-2">
            <span className="mr-2 text-xs text-muted-foreground">신고 ID 최신순</span>
            <Button
              variant="outline"
              disabled={!cursor || query.isFetching}
              onClick={() => update({ relatedCursor: undefined })}
            >
              처음으로
            </Button>
            <Button
              variant="outline"
              disabled={
                !query.data?.meta.hasNext || !query.data.meta.nextCursor || query.isFetching
              }
              onClick={() => update({ relatedCursor: String(query.data?.meta.nextCursor) })}
            >
              다음
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
