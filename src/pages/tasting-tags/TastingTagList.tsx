/**
 * 테이스팅 태그 목록 페이지
 * - Badge 형태로 태그 목록 표시
 * - 태그 클릭 시 인라인 편집
 * - X 버튼으로 삭제
 * - API 연동 전 Mock 데이터로 동작
 */

import { useState, useRef, useEffect } from 'react';
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
import { useToast } from '@/hooks/useToast';

// Mock 테이스팅 태그 데이터 (단순 문자열 배열)
const MOCK_TASTING_TAGS: string[] = [
  '바닐라',
  '꿀',
  '캐러멜',
  '오크',
  '스모키',
  '피트',
  '과일향',
  '시트러스',
  '꽃향',
  '스파이시',
  '초콜릿',
  '견과류',
  '토피',
  '바다향',
  '요오드',
  '후추',
  '부드러운',
  '드라이',
  '복합적인',
  '균형잡힌',
];

export function TastingTagListPage() {
  const { showToast } = useToast();

  // 상태 관리
  const [tags, setTags] = useState<string[]>(MOCK_TASTING_TAGS);
  const [newTag, setNewTag] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  const editInputRef = useRef<HTMLInputElement>(null);

  // 편집 모드일 때 input에 포커스
  useEffect(() => {
    if (editingIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingIndex]);

  // 필터링된 태그
  const filteredTags = searchKeyword
    ? tags.filter((tag) => tag.toLowerCase().includes(searchKeyword.toLowerCase()))
    : tags;

  // 태그 추가
  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (!trimmed) {
      showToast({ type: 'warning', message: '태그명을 입력해주세요.' });
      return;
    }
    if (tags.includes(trimmed)) {
      showToast({ type: 'warning', message: '이미 존재하는 태그입니다.' });
      return;
    }
    setTags((prev) => [...prev, trimmed]);
    setNewTag('');
    showToast({ type: 'success', message: '태그가 추가되었습니다.' });
  };

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // 태그 삭제
  const handleDelete = (index: number) => {
    const tagName = tags[index];
    setTags((prev) => prev.filter((_, i) => i !== index));
    showToast({ type: 'info', message: `"${tagName}" 태그가 삭제되었습니다.` });
  };

  // 편집 시작
  const startEdit = (index: number) => {
    const tag = filteredTags[index];
    if (!tag) return;

    // 검색 중일 때는 원본 인덱스 찾기
    const originalIndex = tags.indexOf(tag);
    if (originalIndex === -1) return;

    setEditingIndex(originalIndex);
    setEditValue(tag);
  };

  // 편집 완료
  const handleEditComplete = () => {
    if (editingIndex === null) return;

    const trimmed = editValue.trim();
    if (!trimmed) {
      showToast({ type: 'warning', message: '태그명을 입력해주세요.' });
      return;
    }

    // 중복 체크 (자기 자신 제외)
    const isDuplicate = tags.some((tag, i) => i !== editingIndex && tag === trimmed);
    if (isDuplicate) {
      showToast({ type: 'warning', message: '이미 존재하는 태그입니다.' });
      return;
    }

    setTags((prev) => prev.map((tag, i) => (i === editingIndex ? trimmed : tag)));
    setEditingIndex(null);
    setEditValue('');
    showToast({ type: 'success', message: '태그가 수정되었습니다.' });
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEditComplete();
    } else if (e.key === 'Escape') {
      setEditingIndex(null);
      setEditValue('');
    }
  };

  // 편집 취소 (외부 클릭)
  const handleEditBlur = () => {
    // 약간의 딜레이를 줘서 클릭 이벤트가 먼저 처리되도록
    setTimeout(() => {
      if (editingIndex !== null) {
        handleEditComplete();
      }
    }, 100);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold">테이스팅 태그 관리</h1>
        <p className="text-muted-foreground">
          위스키에 사용되는 테이스팅 태그를 관리합니다.
        </p>
      </div>

      {/* 태그 추가 */}
      <Card>
        <CardHeader>
          <CardTitle>태그 추가</CardTitle>
          <CardDescription>새로운 테이스팅 태그를 추가합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="새 태그 입력..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleAddKeyDown}
              className="max-w-xs"
            />
            <Button onClick={handleAddTag}>
              <Plus className="mr-2 h-4 w-4" />
              추가
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 태그 목록 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>태그 목록</CardTitle>
              <CardDescription>
                총 {tags.length}개의 태그 · 태그를 클릭하여 수정할 수 있습니다.
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
          {filteredTags.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              {searchKeyword ? '검색 결과가 없습니다.' : '등록된 태그가 없습니다.'}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filteredTags.map((tag, index) => {
                const originalIndex = tags.indexOf(tag);
                const isEditing = editingIndex === originalIndex;

                return isEditing ? (
                  <Input
                    key={`edit-${originalIndex}`}
                    ref={editInputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    onBlur={handleEditBlur}
                    className="h-7 w-32 px-2 text-sm"
                  />
                ) : (
                  <Badge
                    key={`tag-${originalIndex}`}
                    variant="secondary"
                    className="cursor-pointer gap-1 pr-1 text-sm hover:bg-secondary/80"
                    onClick={() => startEdit(index)}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(originalIndex);
                      }}
                      className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
