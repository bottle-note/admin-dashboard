import { ImageOff } from 'lucide-react';
import { useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  flattenAdminAlcoholLookupPages,
  type AdminAlcoholLookupInfiniteParams,
  useAdminAlcoholLookupInfinite,
} from '@/hooks/useAdminAlcohols';

type RelatedWhiskyLookupCardProps = {
  title: string;
  description: string;
  params: Pick<AdminAlcoholLookupInfiniteParams, 'distilleryId' | 'regionId'>;
  relatedColumn: 'region' | 'distillery';
  enabled?: boolean;
};

export function RelatedWhiskyLookupCard({
  title,
  description,
  params,
  relatedColumn,
  enabled = true,
}: RelatedWhiskyLookupCardProps) {
  const navigate = useNavigate();
  const lookupQuery = useAdminAlcoholLookupInfinite(
    {
      ...params,
      pageSize: 20,
    },
    {
      enabled,
    }
  );
  const items = flattenAdminAlcoholLookupPages(lookupQuery.data);
  const relatedColumnLabel = relatedColumn === 'region' ? '지역' : '증류소';

  const handleRowClick = (alcoholId: number) => {
    navigate(`/whisky/${alcoholId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[72px]">이미지</TableHead>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>위스키명</TableHead>
                <TableHead className="w-[140px]">카테고리</TableHead>
                <TableHead className="w-[160px]">{relatedColumnLabel}</TableHead>
                <TableHead className="w-[96px] text-right">상세</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lookupQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    소속 위스키를 불러오는 중입니다.
                  </TableCell>
                </TableRow>
              ) : lookupQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        소속 위스키 목록을 불러오지 못했습니다.
                      </span>
                      <Button variant="outline" size="sm" onClick={() => lookupQuery.refetch()}>
                        다시 시도
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    소속 위스키가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow
                    key={item.alcoholId}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(item.alcoholId)}
                  >
                    <TableCell>
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.korName}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                          <ImageOff className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.alcoholId}</TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="font-medium">{item.korName}</p>
                        <p className="truncate text-sm text-muted-foreground">{item.engName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{item.korCategoryName}</p>
                        <p className="text-sm text-muted-foreground">{item.engCategoryName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {relatedColumn === 'region' ? (
                        <RelatedName korName={item.korRegion} engName={item.engRegion} />
                      ) : (
                        <RelatedName korName={item.korDistillery} engName={item.engDistillery} />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRowClick(item.alcoholId);
                        }}
                      >
                        보기
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {lookupQuery.hasNextPage && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => lookupQuery.fetchNextPage()}
              disabled={lookupQuery.isFetchingNextPage}
            >
              {lookupQuery.isFetchingNextPage ? '불러오는 중...' : '더보기'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RelatedName({ korName, engName }: { korName: string | null; engName: string | null }) {
  if (!korName && !engName) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <div>
      <p>{korName ?? '-'}</p>
      {engName && <p className="text-sm text-muted-foreground">{engName}</p>}
    </div>
  );
}
