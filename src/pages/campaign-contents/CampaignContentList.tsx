import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pagination } from '@/components/common/Pagination';
import { StatusToggle } from '@/components/common/StatusToggle';
import { useCampaignContentList, useCampaignContentStatus } from '@/hooks/useCampaignContents';

function safeInt(value: string | null, fallback: number, allowed?: number[]) {
  if (value === null || !/^(0|[1-9]\d*)$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && (allowed ? allowed.includes(parsed) : parsed >= 0)
    ? parsed
    : fallback;
}

export function CampaignContentListPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useSearchParams();
  const keyword = url.get('keyword') ?? '';
  const state = url.get('isActive');
  const page = safeInt(url.get('page'), 0);
  const size = safeInt(url.get('size'), 20, [20, 50, 100]);
  const [draft, setDraft] = useState({ forKeyword: keyword, value: keyword });
  const input = draft.forKeyword === keyword ? draft.value : keyword;
  const { data, isLoading, isError } = useCampaignContentList({
    keyword: keyword || undefined,
    isActive: state === 'true' ? true : state === 'false' ? false : undefined,
    page,
    size,
  });
  const status = useCampaignContentStatus();

  function updateUrl(changes: Record<string, string | undefined>) {
    const next = new URLSearchParams(url);
    for (const [key, value] of Object.entries(changes)) {
      if (value && !(key === 'page' && value === '0') && !(key === 'size' && value === '20'))
        next.set(key, value);
      else next.delete(key);
    }
    setUrl(next);
  }
  function openDetail(id: number) {
    navigate(`/campaign-contents/${id}`, {
      state: { from: `/campaign-contents${url.size ? `?${url.toString()}` : ''}` },
    });
  }
  function search() {
    const next = input.trim();
    setDraft({ forKeyword: next, value: next });
    updateUrl({ keyword: next || undefined, page: undefined });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">캠페인 콘텐츠 관리</h1>
          <p className="text-muted-foreground">캠페인 콘텐츠와 참여 지표를 관리합니다.</p>
        </div>
        <Button onClick={() => navigate('/campaign-contents/new')}>
          <Plus className="mr-2 h-4 w-4" />
          콘텐츠 등록
        </Button>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="이름 또는 코드 검색"
            value={input}
            onChange={(e) => setDraft({ forKeyword: keyword, value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) search();
            }}
          />
        </div>
        <Select
          value={state === 'true' || state === 'false' ? state : 'ALL'}
          onValueChange={(value) =>
            updateUrl({ isActive: value === 'ALL' ? undefined : value, page: undefined })
          }
        >
          <SelectTrigger className="w-full sm:w-40" aria-label="상태 필터">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">전체</SelectItem>
            <SelectItem value="true">활성</SelectItem>
            <SelectItem value="false">비활성</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={search}>검색</Button>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table className="min-w-[760px] [&_td]:px-4 [&_th]:px-4">
          <TableHeader>
            <TableRow>
              <TableHead>이름·설명</TableHead>
              <TableHead>코드</TableHead>
              <TableHead>최근 7일 참여자</TableHead>
              <TableHead>등록일</TableHead>
              <TableHead>상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || isError || !data?.items.length ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  {isLoading
                    ? '로딩 중...'
                    : isError
                      ? '목록을 불러오지 못했습니다.'
                      : '검색 결과가 없습니다.'}
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/50"
                  role="link"
                  tabIndex={0}
                  onClick={() => openDetail(item.id)}
                  onKeyDown={(e) => {
                    if (e.target === e.currentTarget && e.key === 'Enter') openDetail(item.id);
                  }}
                >
                  <TableCell>
                    <div className="font-medium">{item.name}</div>
                    <div className="max-w-[260px] truncate text-sm text-muted-foreground">
                      {item.description || '-'}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{item.code}</TableCell>
                  <TableCell>{item.recentParticipants.toLocaleString()}</TableCell>
                  <TableCell>{item.createdAt.slice(0, 10)}</TableCell>
                  <TableCell>
                    <StatusToggle
                      isActive={item.isActive}
                      disabled={status.isPending}
                      onToggle={() =>
                        status.mutate({ id: item.id, data: { isActive: !item.isActive } })
                      }
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {data && data.items.length > 0 && (
        <Pagination
          currentPage={data.meta.page}
          totalPages={data.meta.totalPages}
          totalElements={data.meta.totalElements}
          pageSize={size}
          currentItemCount={data.items.length}
          hasNext={data.meta.hasNext}
          onPageChange={(page) => updateUrl({ page: page ? String(page) : undefined })}
          onPageSizeChange={(size) =>
            updateUrl({ size: size === 20 ? undefined : String(size), page: undefined })
          }
        />
      )}
    </div>
  );
}
