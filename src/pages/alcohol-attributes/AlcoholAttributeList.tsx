/**
 * 위스키 속성 관리 (모의 화면)
 * - 상단: 선택한 위스키, 중단: 선택 위스키들의 속성 묶음(summary), 하단: 항목·키워드 집계
 * - 데이터는 모의이며 추가·삭제 버튼은 동작하지 않는다.
 */

import { Plus, Trash2, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
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
import { PageHeader } from '@/components/common/PageHeader';
import {
  DATATYPE_LABEL,
  TYPE_LABEL,
  mockAttributeKeys,
  mockAttributeSummary,
  mockKeywordCounts,
  mockSelectedAlcohols,
  type MockAttributeSummary,
} from './alcohol-attribute.mock';

function formatNumber(value: number) {
  return value.toLocaleString('ko-KR');
}

/** 숫자형은 범위를, 그 외는 값을 보여준다 */
function SummaryValue({ item }: { item: MockAttributeSummary }) {
  if (item.min != null && item.max != null) {
    if (item.allSameValue) return <span>{formatNumber(item.min)}</span>;
    return (
      <span>
        {formatNumber(item.min)} <span className="text-muted-foreground">~</span>{' '}
        {formatNumber(item.max)}
      </span>
    );
  }
  if (item.datatype === 'BOOLEAN') {
    return <Badge variant="outline">{item.value === 'true' ? '예' : '아니오'}</Badge>;
  }
  return <span>{item.value ?? '-'}</span>;
}

export function AlcoholAttributeListPage() {
  const selectedCount = mockSelectedAlcohols.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="위스키 속성 관리"
        description="선택한 위스키들에 키워드·가격·대중성 점수 같은 부가 속성을 일괄로 붙이고 정리합니다. (모의 데이터)"
        actions={
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            속성 일괄 추가
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">선택한 위스키 {selectedCount}개</CardTitle>
          <CardDescription>위스키를 검색해 선택하면 아래 속성 묶음이 갱신됩니다.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          {mockSelectedAlcohols.map((alcohol) => (
            <Badge key={alcohol.id} variant="secondary" className="gap-1 py-1 pl-2.5 pr-1.5">
              {alcohol.korName}
              <span className="text-muted-foreground">{alcohol.engName}</span>
              <button
                type="button"
                className="ml-1 rounded-sm opacity-60 hover:opacity-100"
                aria-label={`${alcohol.korName} 선택 해제`}
                disabled
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button variant="outline" size="sm" disabled>
            <Plus className="mr-2 h-4 w-4" />
            위스키 추가
          </Button>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>항목</TableHead>
              <TableHead>분류</TableHead>
              <TableHead>형식</TableHead>
              <TableHead>값</TableHead>
              <TableHead className="text-right">등록</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockAttributeSummary.map((item) => {
              const isPartial = item.registeredCount < item.selectedCount;
              return (
                <TableRow key={`${item.key}:${item.value ?? ''}`}>
                  <TableCell className="font-mono text-xs">{item.key}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{TYPE_LABEL[item.type]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {DATATYPE_LABEL[item.datatype]}
                  </TableCell>
                  <TableCell className="font-medium">
                    <SummaryValue item={item} />
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={isPartial ? 'text-amber-600' : undefined}>
                      {item.registeredCount}/{item.selectedCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" disabled>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        등록 수가 선택 수보다 적으면 일부 위스키에만 값이 있는 묶음입니다. 숫자형 항목은 값이
        서로 다르면 범위로 표시합니다.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">항목별 집계</CardTitle>
            <CardDescription>전체 위스키 기준 속성 항목별 등록 행 수와 위스키 수</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>항목</TableHead>
                  <TableHead>분류</TableHead>
                  <TableHead className="text-right">행 수</TableHead>
                  <TableHead className="text-right">위스키 수</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAttributeKeys.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell className="font-mono text-xs">{row.key}</TableCell>
                    <TableCell className="text-muted-foreground">{TYPE_LABEL[row.type]}</TableCell>
                    <TableCell className="text-right">{formatNumber(row.count)}</TableCell>
                    <TableCell className="text-right">{formatNumber(row.alcoholCount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">키워드 값</CardTitle>
            <CardDescription>추천 필터에 쓰는 키워드와 그 값을 가진 위스키 수</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {mockKeywordCounts.map((row) => (
              <Badge key={row.value} variant="outline" className="py-1">
                {row.value}
                <span className="ml-1.5 text-muted-foreground">{formatNumber(row.alcoholCount)}</span>
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
