import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AlcoholMergeCount } from '@/types/api';

const COUNT_LABELS = new Map<string, string>([
  ['reviews', '리뷰'],
  ['ratings', '별점'],
  ['picks', '찜'],
  ['userHistories', '활동 히스토리'],
  ['viewHistories', '최근 본 기록'],
  ['tastingTags', '테이스팅 태그'],
  ['attributes', '속성'],
  ['curationKeywords', '큐레이션 키워드'],
  ['mfdsDeclarations', '수입 신고 확정 연결'],
]);

export function AlcoholMergeCounts({
  counts,
  caption,
  completed = false,
}: {
  counts: AlcoholMergeCount[];
  caption?: string;
  completed?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        {caption && <caption className="sr-only">{caption}</caption>}
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="pl-4">대상</TableHead>
            <TableHead className="text-right">{completed ? '옮긴 기록' : '옮길 기록'}</TableHead>
            <TableHead className="pr-4 text-right">
              {completed ? '삭제한 기록' : '삭제할 기록'}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {counts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                {completed
                  ? '옮기거나 삭제한 기록이 없습니다.'
                  : '옮기거나 삭제할 기록이 없습니다.'}
              </TableCell>
            </TableRow>
          ) : (
            counts.map((count) => (
              <TableRow key={count.name}>
                <TableCell className="pl-4 font-medium">
                  {COUNT_LABELS.get(count.name) ?? count.name}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {count.moved.toLocaleString()}건
                </TableCell>
                <TableCell className="pr-4 text-right tabular-nums text-muted-foreground">
                  {count.deleted.toLocaleString()}건
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
