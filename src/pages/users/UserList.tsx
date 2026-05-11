/**
 * 사용자 관리 페이지 (ROOT_ADMIN 전용)
 * - URL 쿼리파라미터로 검색/필터/정렬/페이지네이션 상태 관리
 * - 읽기 전용 목록 (현재 API는 목록 조회만 지원)
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Search, Users } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Pagination } from '@/components/common/Pagination';
import { useUserList } from '@/hooks/useUsers';
import type { UserSearchParams, UserStatus, UserSortType, UserSortOrder } from '@/types/api';

const STATUS_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'ACTIVE', label: '활성' },
  { value: 'DELETED', label: '탈퇴' },
];

const SORT_OPTIONS = [
  { value: 'CREATED_AT', label: '가입일' },
  { value: 'NICK_NAME', label: '닉네임' },
  { value: 'EMAIL', label: '이메일' },
  { value: 'REVIEW_COUNT', label: '리뷰 수' },
  { value: 'RATING_COUNT', label: '평점 수' },
];

const SOCIAL_TYPE_COLORS: Record<string, string> = {
  KAKAO: 'bg-yellow-100 text-yellow-800',
  NAVER: 'bg-green-100 text-green-800',
  GOOGLE: 'bg-blue-100 text-blue-800',
  APPLE: 'bg-gray-100 text-gray-800',
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

export function UserListPage() {
  const [urlParams, setUrlParams] = useSearchParams();

  // URL에서 검색 파라미터 읽기
  const keyword = urlParams.get('keyword') ?? '';
  const statusParam = urlParams.get('status');
  const sortType = (urlParams.get('sortType') ?? 'CREATED_AT') as UserSortType;
  const sortOrder = (urlParams.get('sortOrder') ?? 'DESC') as UserSortOrder;
  const page = Number(urlParams.get('page')) || 0;
  const size = Number(urlParams.get('size')) || 20;

  // 검색 입력 필드용 로컬 상태
  const [keywordInput, setKeywordInput] = useState(keyword);

  useEffect(() => {
    setKeywordInput(keyword);
  }, [keyword]);

  // API 요청용 파라미터
  const searchParams: UserSearchParams = {
    keyword: keyword || undefined,
    status: statusParam && statusParam !== 'ALL' ? (statusParam as UserStatus) : undefined,
    sortType,
    sortOrder,
    page,
    size,
  };

  const { data, isLoading } = useUserList(searchParams);

  // URL 파라미터 업데이트 헬퍼
  const updateUrlParams = (updates: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams(urlParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });

    // 기본값은 URL에서 제거
    if (newParams.get('page') === '0') newParams.delete('page');
    if (newParams.get('size') === '20') newParams.delete('size');
    if (newParams.get('sortType') === 'CREATED_AT') newParams.delete('sortType');
    if (newParams.get('sortOrder') === 'DESC') newParams.delete('sortOrder');

    setUrlParams(newParams);
  };

  const handleSearch = () => {
    updateUrlParams({
      keyword: keywordInput || undefined,
      page: '0',
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleStatusChange = (value: string) => {
    updateUrlParams({
      status: value === 'ALL' ? undefined : value,
      page: '0',
    });
  };

  const handleSortTypeChange = (value: string) => {
    updateUrlParams({
      sortType: value === 'CREATED_AT' ? undefined : value,
      page: '0',
    });
  };

  const handleSortOrderToggle = () => {
    updateUrlParams({
      sortOrder: sortOrder === 'DESC' ? 'ASC' : undefined,
    });
  };

  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: String(newPage) });
  };

  const handlePageSizeChange = (newSize: number) => {
    updateUrlParams({ size: String(newSize), page: '0' });
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold">사용자 관리</h1>
        <p className="text-muted-foreground">
          서비스에 가입한 사용자를 조회합니다.
        </p>
      </div>

      {/* 필터 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="닉네임 또는 이메일로 검색..."
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
          />
        </div>
        <Select value={statusParam ?? 'ALL'} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[140px]">
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
        <Select value={sortType} onValueChange={handleSortTypeChange}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="정렬" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={handleSortOrderToggle} title={sortOrder === 'DESC' ? '내림차순' : '오름차순'}>
          {sortOrder === 'DESC' ? '↓' : '↑'}
        </Button>
        <Button onClick={handleSearch}>검색</Button>
      </div>

      {/* 테이블 */}
      <div className="rounded-lg border">
        <Table className="[&_th]:px-4 [&_td]:px-4 [&_th]:whitespace-nowrap">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">프로필</TableHead>
              <TableHead>닉네임</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead className="w-[90px]">역할</TableHead>
              <TableHead className="w-[80px]">상태</TableHead>
              <TableHead className="w-[140px]">소셜 로그인</TableHead>
              <TableHead className="w-[80px] text-right">리뷰</TableHead>
              <TableHead className="w-[80px] text-right">평점</TableHead>
              <TableHead className="w-[80px] text-right">찜</TableHead>
              <TableHead className="w-[100px]">가입일</TableHead>
              <TableHead className="w-[100px]">최근 로그인</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8">
                  <span className="text-muted-foreground">로딩 중...</span>
                </TableCell>
              </TableRow>
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-8 w-8 text-muted-foreground/50" />
                    <span className="text-muted-foreground">
                      {keyword ? '검색 결과가 없습니다.' : '등록된 사용자가 없습니다.'}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((user) => (
                <TableRow key={user.userId}>
                  <TableCell>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.imageUrl ?? undefined} alt={user.nickName} />
                      <AvatarFallback className="text-xs">
                        {user.nickName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{user.nickName}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'ROLE_ADMIN' ? 'default' : 'secondary'}>
                      {user.role === 'ROLE_ADMIN' ? '관리자' : '일반'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'ACTIVE' ? 'outline' : 'destructive'}>
                      {user.status === 'ACTIVE' ? '활성' : '탈퇴'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.socialType.map((type) => (
                        <span
                          key={type}
                          className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${SOCIAL_TYPE_COLORS[type] ?? ''}`}
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {user.reviewCount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {user.ratingCount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {user.picksCount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(user.createAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(user.lastLoginAt)}
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
          currentPage={data.meta.page}
          totalPages={data.meta.totalPages}
          totalElements={data.meta.totalElements}
          pageSize={size}
          currentItemCount={data.items.length}
          hasNext={data.meta.hasNext}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
}
