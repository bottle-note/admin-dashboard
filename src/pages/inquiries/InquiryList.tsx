/**
 * 문의 목록 페이지
 */

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Pagination } from '@/components/common/Pagination';
import { useHelpList, useHelpDetail, useHelpAnswer } from '@/hooks/useHelps';
import type { HelpListParams, HelpStatus, HelpType } from '@/types/api';

const STATUS_OPTIONS: { value: HelpStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'WAITING', label: '대기중' },
  { value: 'SUCCESS', label: '처리완료' },
  { value: 'REJECT', label: '반려' },
];

const TYPE_OPTIONS: { value: HelpType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'WHISKEY', label: '위스키' },
  { value: 'REVIEW', label: '리뷰' },
  { value: 'USER', label: '사용자' },
  { value: 'ETC', label: '기타' },
];

const STATUS_BADGE_VARIANT: Record<HelpStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  CREATING: 'outline',
  WAITING: 'secondary',
  SUCCESS: 'default',
  REJECT: 'destructive',
  DELETED: 'outline',
};

const STATUS_LABEL: Record<HelpStatus, string> = {
  CREATING: '작성중',
  WAITING: '대기중',
  SUCCESS: '처리완료',
  REJECT: '반려',
  DELETED: '삭제됨',
};

const TYPE_LABEL: Record<HelpType, string> = {
  WHISKEY: '위스키',
  REVIEW: '리뷰',
  USER: '사용자',
  ETC: '기타',
};

export function InquiryListPage() {
  const [searchParams, setSearchParams] = useState<HelpListParams>({
    pageSize: 20,
  });
  const [cursorHistory, setCursorHistory] = useState<(number | undefined)[]>([]);
  const [selectedHelpId, setSelectedHelpId] = useState<number | null>(null);
  const [responseContent, setResponseContent] = useState('');
  const [answerStatus, setAnswerStatus] = useState<'SUCCESS' | 'REJECT'>('SUCCESS');

  const { data, isLoading } = useHelpList(searchParams);
  const { data: detailData, isLoading: isDetailLoading } = useHelpDetail(selectedHelpId);
  const answerMutation = useHelpAnswer();

  const handleStatusChange = (value: string) => {
    setCursorHistory([]);
    setSearchParams((prev) => ({
      ...prev,
      status: value === 'ALL' ? undefined : (value as HelpStatus),
      cursor: undefined,
    }));
  };

  const handleTypeChange = (value: string) => {
    setCursorHistory([]);
    setSearchParams((prev) => ({
      ...prev,
      type: value === 'ALL' ? undefined : (value as HelpType),
      cursor: undefined,
    }));
  };

  const handlePageSizeChange = (size: number) => {
    setCursorHistory([]);
    setSearchParams((prev) => ({
      ...prev,
      pageSize: size,
      cursor: undefined,
    }));
  };

  const handleRowClick = (helpId: number) => {
    setSelectedHelpId(helpId);
    setResponseContent('');
    setAnswerStatus('SUCCESS');
  };

  const handleCloseDialog = () => {
    setSelectedHelpId(null);
    setResponseContent('');
  };

  const handleSubmitAnswer = () => {
    if (!selectedHelpId || !responseContent.trim()) return;

    answerMutation.mutate(
      {
        helpId: selectedHelpId,
        body: {
          responseContent: responseContent.trim(),
          status: answerStatus,
        },
      },
      {
        onSuccess: () => {
          handleCloseDialog();
        },
      }
    );
  };

  const handleNextPage = () => {
    if (data?.meta.hasNext) {
      setCursorHistory((prev) => [...prev, searchParams.cursor]);
      setSearchParams((prev) => ({
        ...prev,
        cursor: data.meta.cursor,
      }));
    }
  };

  const handlePreviousPage = () => {
    if (cursorHistory.length > 0) {
      const newHistory = [...cursorHistory];
      const previousCursor = newHistory.pop();
      setCursorHistory(newHistory);
      setSearchParams((prev) => ({
        ...prev,
        cursor: previousCursor,
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold">문의 관리</h1>
        <p className="text-muted-foreground">사용자 문의를 관리합니다.</p>
      </div>

      {/* 필터 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select
          value={searchParams.status ?? 'ALL'}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={searchParams.type ?? 'ALL'}
          onValueChange={handleTypeChange}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="유형" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 테이블 */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>제목</TableHead>
              <TableHead className="w-[100px]">유형</TableHead>
              <TableHead className="w-[100px]">상태</TableHead>
              <TableHead className="w-[120px]">작성자</TableHead>
              <TableHead className="w-[120px]">작성일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <span className="text-muted-foreground">로딩 중...</span>
                </TableCell>
              </TableRow>
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      문의가 없습니다.
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((item) => (
                <TableRow
                  key={item.helpId}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(item.helpId)}
                >
                  <TableCell className="font-mono text-sm">
                    {item.helpId}
                  </TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{TYPE_LABEL[item.type]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_VARIANT[item.status]}>
                      {STATUS_LABEL[item.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.userNickname}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(item.createAt).toLocaleDateString('ko-KR')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 페이지네이션 */}
      {data && data.items.length > 0 && (
        <Pagination
          pageSize={searchParams.pageSize ?? 20}
          currentItemCount={data.items.length}
          hasNext={data.meta.hasNext}
          hasPrevious={cursorHistory.length > 0}
          onNextPage={handleNextPage}
          onPreviousPage={handlePreviousPage}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      {/* 상세/답변 다이얼로그 */}
      <Dialog open={selectedHelpId !== null} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>문의 상세</DialogTitle>
            <DialogDescription>
              문의 내용을 확인하고 답변을 등록합니다.
            </DialogDescription>
          </DialogHeader>

          {isDetailLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              로딩 중...
            </div>
          ) : detailData ? (
            <div className="space-y-6">
              {/* 문의 정보 */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge variant="outline">{TYPE_LABEL[detailData.type]}</Badge>
                  <Badge variant={STATUS_BADGE_VARIANT[detailData.status]}>
                    {STATUS_LABEL[detailData.status]}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {detailData.userNickname} ·{' '}
                    {new Date(detailData.createAt).toLocaleString('ko-KR')}
                  </span>
                </div>
                <h3 className="text-lg font-semibold">{detailData.title}</h3>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {detailData.content}
                </p>

                {/* 첨부 이미지 */}
                {detailData.imageUrlList.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {detailData.imageUrlList.map((img) => (
                      <a
                        key={img.order}
                        href={img.viewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={img.viewUrl}
                          alt={`첨부 이미지 ${img.order}`}
                          className="h-24 w-24 rounded-lg object-cover border hover:opacity-80"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* 기존 답변 */}
              {detailData.responseContent && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm font-medium mb-2">답변 내용</p>
                  <p className="whitespace-pre-wrap">
                    {detailData.responseContent}
                  </p>
                </div>
              )}

              {/* 답변 폼 (처리되지 않은 경우만) */}
              {detailData.status === 'WAITING' && (
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <label className="text-sm font-medium">답변 내용</label>
                    <Textarea
                      value={responseContent}
                      onChange={(e) => setResponseContent(e.target.value)}
                      placeholder="답변 내용을 입력하세요..."
                      rows={4}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">처리 상태</label>
                    <Select
                      value={answerStatus}
                      onValueChange={(v) =>
                        setAnswerStatus(v as 'SUCCESS' | 'REJECT')
                      }
                    >
                      <SelectTrigger className="mt-2 w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUCCESS">처리완료</SelectItem>
                        <SelectItem value="REJECT">반려</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              닫기
            </Button>
            {detailData?.status === 'WAITING' && (
              <Button
                onClick={handleSubmitAnswer}
                disabled={!responseContent.trim() || answerMutation.isPending}
              >
                {answerMutation.isPending ? '등록 중...' : '답변 등록'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
