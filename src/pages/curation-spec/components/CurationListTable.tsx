import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { CurationV2ListItem } from '@/types/api';

interface CurationListTableProps {
  items: CurationV2ListItem[];
  specNames: Record<string, string>;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onItemClick: (id: number) => void;
}

export function CurationListTable({
  items,
  specNames,
  isLoading,
  isError,
  onRetry,
  onItemClick,
}: CurationListTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table className="[&_td]:px-4 [&_th]:px-4">
        <TableHeader>
          <TableRow>
            <TableHead>큐레이션명</TableHead>
            <TableHead>스펙</TableHead>
            <TableHead>순서</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>생성일</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <ListStateRow message="로딩 중..." />
          ) : isError ? (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    큐레이션 목록을 불러오지 못했습니다.
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                    다시 시도
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <ListStateRow message="검색 결과가 없습니다." />
          ) : (
            items.map((item) => (
              <TableRow
                key={item.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onItemClick(item.id)}
              >
                <TableCell>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">ID: {item.id}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{specNames[item.specCode] ?? item.specCode}</Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">{item.displayOrder}</TableCell>
                <TableCell>
                  <Badge variant={item.isActive ? 'default' : 'secondary'}>
                    {item.isActive ? '활성' : '비활성'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateTime(item.createdAt)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ListStateRow({ message }: { message: string }) {
  return (
    <TableRow>
      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
        {message}
      </TableCell>
    </TableRow>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
