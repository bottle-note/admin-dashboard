import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router';
import { Loader2, Search } from 'lucide-react';
import { FormField } from '@/components/common/FormField';
import { Pagination } from '@/components/common/Pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAlcoholMergeLogs } from '@/hooks/useAlcoholMerges';
import { useUrlParams } from '@/hooks/useUrlParams';
import { getErrorMessage } from '@/lib/api-error';
import { AlcoholMergeCounts } from './AlcoholMergeCounts';

function positiveId(value: string | null) {
  if (!value || !/^[1-9]\d*$/.test(value)) return undefined;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : undefined;
}

const idField = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || positiveId(value) !== undefined,
    '1 이상의 정수 ID를 입력하세요.'
  );
const filterSchema = z.object({ baseAlcoholId: idField, duplicateAlcoholId: idField });
type FilterValues = z.infer<typeof filterSchema>;

export function WhiskyMergeHistory() {
  const { params, update } = useUrlParams();
  const baseAlcoholId = positiveId(params.get('baseAlcoholId'));
  const duplicateAlcoholId = positiveId(params.get('duplicateAlcoholId'));
  const rawPage = Number(params.get('page') ?? 0);
  const page = Number.isSafeInteger(rawPage) && rawPage >= 0 ? rawPage : 0;
  const rawSize = Number(params.get('size') ?? 20);
  const size = [20, 50, 100].includes(rawSize) ? rawSize : 20;
  const query = useAlcoholMergeLogs({ baseAlcoholId, duplicateAlcoholId, page, size });
  const {
    register,
    handleSubmit,
    reset,
    clearErrors,
    formState: { errors },
  } = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      baseAlcoholId: baseAlcoholId ? String(baseAlcoholId) : '',
      duplicateAlcoholId: duplicateAlcoholId ? String(duplicateAlcoholId) : '',
    },
  });

  useEffect(() => {
    reset({
      baseAlcoholId: baseAlcoholId ? String(baseAlcoholId) : '',
      duplicateAlcoholId: duplicateAlcoholId ? String(duplicateAlcoholId) : '',
    });
  }, [baseAlcoholId, duplicateAlcoholId, reset]);

  useEffect(
    () => () => {
      // 폼을 떠난 뒤 예약된 오류 focus가 이전 입력란을 다시 선택하지 않게 한다.
      clearErrors();
    },
    [clearErrors]
  );

  const submit = handleSubmit((values) =>
    update({
      baseAlcoholId: values.baseAlcoholId || null,
      duplicateAlcoholId: values.duplicateAlcoholId || null,
      page: null,
    })
  );
  const filtered = baseAlcoholId !== undefined || duplicateAlcoholId !== undefined;

  return (
    <Card className="min-w-0 shadow-sm">
      <CardHeader className="gap-4 p-5">
        <div className="space-y-1">
          <h2 className="font-semibold">병합 이력</h2>
          <p className="text-sm text-muted-foreground">
            병합 시점의 이름과 처리 내역을 최근 순으로 확인합니다.
          </p>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <FormField
            label="기준 위스키 ID"
            htmlFor="merge-base-id"
            error={errors.baseAlcoholId?.message}
            className="sm:max-w-48"
          >
            <Input
              id="merge-base-id"
              inputMode="numeric"
              {...register('baseAlcoholId')}
              aria-invalid={Boolean(errors.baseAlcoholId)}
              aria-describedby={errors.baseAlcoholId ? 'merge-base-id-error' : undefined}
            />
          </FormField>
          <FormField
            label="중복 위스키 ID"
            htmlFor="merge-duplicate-id"
            error={errors.duplicateAlcoholId?.message}
            className="sm:max-w-48"
          >
            <Input
              id="merge-duplicate-id"
              inputMode="numeric"
              {...register('duplicateAlcoholId')}
              aria-invalid={Boolean(errors.duplicateAlcoholId)}
              aria-describedby={errors.duplicateAlcoholId ? 'merge-duplicate-id-error' : undefined}
            />
          </FormField>
          <div className="flex gap-2 sm:pt-7">
            <Button type="submit" variant="outline">
              <Search aria-hidden="true" />
              검색
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                reset({ baseAlcoholId: '', duplicateAlcoholId: '' });
                update({ baseAlcoholId: null, duplicateAlcoholId: null, page: null });
              }}
            >
              초기화
            </Button>
          </div>
        </form>
      </CardHeader>
      <CardContent className="space-y-4 p-5 pt-0">
        {query.isError ? (
          <div role="alert" className="space-y-3 rounded-lg border p-6 text-center">
            <p>{getErrorMessage(query.error)}</p>
            <Button type="button" variant="outline" onClick={() => void query.refetch()}>
              다시 시도
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border" aria-busy={query.isFetching}>
              <Table>
                <TableHeader>
                  <TableRow className="whitespace-nowrap bg-muted/40">
                    <TableHead className="pl-4">병합 일시</TableHead>
                    <TableHead>남긴 위스키</TableHead>
                    <TableHead>합친 위스키</TableHead>
                    <TableHead>처리자</TableHead>
                    <TableHead className="pr-4">처리 내역</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        병합 이력을 불러오는 중...
                      </TableCell>
                    </TableRow>
                  ) : !query.data?.items.length ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        {query.data && query.data.meta.totalElements > 0
                          ? '선택한 페이지에는 병합 이력이 없습니다. 아래에서 마지막 페이지로 이동하세요.'
                          : filtered
                            ? '조건에 맞는 병합 이력이 없습니다.'
                            : '병합 이력이 없습니다.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    query.data.items.map((log) => (
                      <TableRow key={log.mergeId}>
                        <TableCell className="whitespace-nowrap pl-4 text-muted-foreground">
                          {log.mergedAt.replace('T', ' ').slice(0, 16)}
                        </TableCell>
                        <TableCell>
                          <Link
                            to={`/whisky/${log.baseAlcoholId}`}
                            className="font-medium underline-offset-4 hover:underline"
                          >
                            {log.baseKorName}
                          </Link>
                          <p className="mt-1 font-mono text-xs text-muted-foreground">
                            #{log.baseAlcoholId}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p>{log.duplicateKorName}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {log.duplicateEngName}
                          </p>
                          <p className="mt-1 font-mono text-xs text-muted-foreground">
                            #{log.duplicateAlcoholId}
                          </p>
                        </TableCell>
                        <TableCell className="break-all">
                          {log.mergedByEmail ??
                            (log.mergedByAdminId !== null
                              ? `관리자 #${log.mergedByAdminId}`
                              : '처리자 없음')}
                        </TableCell>
                        <TableCell className="pr-4">
                          <details className="min-w-44">
                            <summary className="cursor-pointer whitespace-nowrap text-sm">
                              이동{' '}
                              {log.counts
                                .reduce((sum, item) => sum + item.moved, 0)
                                .toLocaleString()}
                              건 · 삭제{' '}
                              {log.counts
                                .reduce((sum, item) => sum + item.deleted, 0)
                                .toLocaleString()}
                              건
                            </summary>
                            <div className="mt-3">
                              <AlcoholMergeCounts counts={log.counts} completed />
                            </div>
                          </details>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {query.isFetching && !query.isLoading && (
              <p role="status" className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                이력을 새로 불러오는 중...
              </p>
            )}
            {query.data && query.data.meta.totalElements > 0 && (
              <Pagination
                currentPage={query.data.meta.page}
                totalPages={query.data.meta.totalPages}
                totalElements={query.data.meta.totalElements}
                pageSize={size}
                currentItemCount={query.data.items.length}
                hasNext={query.data.meta.hasNext}
                onPageChange={(next) => update({ page: next ? String(next) : null })}
                onPageSizeChange={(next) =>
                  update({ size: next === 20 ? null : String(next), page: null })
                }
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
