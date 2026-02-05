/**
 * 테이스팅 태그 목록 페이지
 * - Badge 형태로 태그 목록 표시 (아이콘 + 한글명 + 영문명)
 * - 태그 클릭 시 상세 페이지로 이동
 * - X 버튼으로 삭제 (확인 다이얼로그)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, X, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTastingTagList, useTastingTagDelete } from '@/hooks/useTastingTags';

import type { TastingTagListItem } from '@/types/api';

export function TastingTagListPage() {
  const navigate = useNavigate();

  // 상태 관리
  const [searchKeyword, setSearchKeyword] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<TastingTagListItem | null>(null);

  // API 조회
  const { data, isLoading } = useTastingTagList({
    keyword: searchKeyword || undefined,
    size: 100, // 태그는 보통 많지 않으므로 한 번에 조회
  });

  // 삭제 mutation
  const deleteMutation = useTastingTagDelete({
    onSuccess: () => {
      setDeleteTarget(null);
    },
  });

  const tags = data?.items ?? [];

  // 태그 클릭 → 상세 페이지로 이동
  const handleTagClick = (id: number) => {
    navigate(`/tasting-tags/${id}`);
  };

  // 삭제 확인
  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">테이스팅 태그 관리</h1>
          <p className="text-muted-foreground">
            위스키에 사용되는 테이스팅 태그를 관리합니다.
          </p>
        </div>
        <Button onClick={() => navigate('/tasting-tags/new')}>
          <Plus className="mr-2 h-4 w-4" />
          태그 추가
        </Button>
      </div>

      {/* 태그 목록 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>태그 목록</CardTitle>
              <CardDescription>
                총 {data?.meta.totalElements ?? 0}개의 태그 · 클릭하여 상세 페이지로 이동
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="태그 검색..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-muted-foreground">로딩 중...</p>
          ) : tags.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              {searchKeyword ? '검색 결과가 없습니다.' : '등록된 태그가 없습니다.'}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="cursor-pointer gap-2 pr-1 text-sm hover:bg-secondary/80"
                  onClick={() => handleTagClick(tag.id)}
                >
                  {tag.icon && (
                    <img
                      src={tag.icon}
                      alt=""
                      className="h-4 w-4 rounded object-cover"
                    />
                  )}
                  <span>{tag.korName}</span>
                  <span className="text-muted-foreground">({tag.engName})</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(tag);
                    }}
                    className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 삭제 확인 다이얼로그 */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="태그 삭제"
        description={`"${deleteTarget?.korName}" 태그를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
