/**
 * 태그 그룹 관리 (모의 화면)
 * - 탭 "목록": 그룹 표(계열 필터) + 선택 그룹의 태그·역할 카드
 * - 탭 "그래프": 그룹과 태그를 노드·엣지로 그린 관계도
 * - 탭은 URL 쿼리(tab)로 관리하고, 데이터는 모의이며 저장·삭제 버튼은 동작하지 않는다.
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { Plus, Trash2, UserPlus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { PageHeader } from '@/components/common/PageHeader';
import { TastingGroupGraph } from './TastingGroupGraph';
import {
  ROLE_LABEL,
  mockFamilies,
  mockTastingGroups,
  mockUngroupedTags,
  type MockTastingGroup,
} from './tasting-group.mock';

const ALL_FAMILIES = 'ALL';

const TABS = [
  { value: 'list', label: '목록' },
  { value: 'graph', label: '그래프' },
] as const;
type TabValue = (typeof TABS)[number]['value'];

function isTabValue(value: string | null): value is TabValue {
  return TABS.some((tab) => tab.value === value);
}

function RoleBadge({ role }: { role: MockTastingGroup['tags'][number]['role'] }) {
  return (
    <Badge variant={role === 'CORE' ? 'default' : 'secondary'}>{ROLE_LABEL[role]}</Badge>
  );
}

export function TastingGroupListPage() {
  const [urlParams, setUrlParams] = useSearchParams();
  const tabParam = urlParams.get('tab');
  const tab: TabValue = isTabValue(tabParam) ? tabParam : 'list';

  const [family, setFamily] = useState(ALL_FAMILIES);
  const [selectedId, setSelectedId] = useState<number | null>(mockTastingGroups[0]?.id ?? null);

  const groups =
    family === ALL_FAMILIES
      ? mockTastingGroups
      : mockTastingGroups.filter((group) => group.family === family);
  const selected = mockTastingGroups.find((group) => group.id === selectedId) ?? null;

  const selectTab = (next: TabValue) => {
    const params = new URLSearchParams(urlParams);
    if (next === 'list') params.delete('tab');
    else params.set('tab', next);
    setUrlParams(params);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="태그 그룹 관리"
        description="테이스팅 태그를 맛 계열별로 묶어 추천 점수에 쓰는 사전을 관리합니다. (모의 데이터)"
        actions={
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            태그 그룹 추가
          </Button>
        }
      />

      <div role="tablist" aria-label="태그 그룹 보기" className="flex gap-1 border-b">
        {TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            id={`tab-${item.value}`}
            aria-controls={`panel-${item.value}`}
            aria-selected={tab === item.value}
            tabIndex={tab === item.value ? 0 : -1}
            className={`shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium ${
              tab === item.value
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => selectTab(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Select value={family} onValueChange={setFamily}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="계열" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FAMILIES}>전체 계열</SelectItem>
            {mockFamilies.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          그룹 {groups.length}개 · 미소속 태그 {mockUngroupedTags.length}개
        </p>
      </div>

      {tab === 'graph' ? (
        <div id="panel-graph" role="tabpanel" aria-labelledby="tab-graph" className="space-y-4">
          <TastingGroupGraph
            groups={groups}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId((prev) => (prev === id ? null : id))}
          />
          {selected && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{selected.name}</span> · 대표{' '}
              {selected.tags.filter((tag) => tag.role === 'CORE').length}개 · 보조{' '}
              {selected.tags.filter((tag) => tag.role === 'PERIPHERAL').length}개
            </p>
          )}
        </div>
      ) : (
        <div
          id="panel-list"
          role="tabpanel"
          aria-labelledby="tab-list"
          className="grid gap-6 lg:grid-cols-[3fr_2fr]"
        >
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">순서</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>코드</TableHead>
                  <TableHead>계열</TableHead>
                  <TableHead className="text-right">태그</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group) => {
                  const coreCount = group.tags.filter((tag) => tag.role === 'CORE').length;
                  return (
                    <TableRow
                      key={group.id}
                      data-state={group.id === selectedId ? 'selected' : undefined}
                      className="cursor-pointer"
                      onClick={() => setSelectedId(group.id)}
                    >
                      <TableCell className="text-muted-foreground">{group.displayOrder}</TableCell>
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {group.code}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{group.family}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {group.tags.length === 0 ? (
                          <span className="text-muted-foreground">없음</span>
                        ) : (
                          <span>
                            {group.tags.length}
                            <span className="text-muted-foreground"> (대표 {coreCount})</span>
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-6">
            {selected && (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle>{selected.name}</CardTitle>
                      <CardDescription>
                        {selected.description ?? '설명이 없습니다.'}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      title={
                        selected.tags.length > 0
                          ? '태그가 연결된 그룹은 삭제할 수 없습니다.'
                          : undefined
                      }
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      삭제
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">연결된 태그 {selected.tags.length}개</p>
                    <Button variant="outline" size="sm" disabled>
                      <UserPlus className="mr-2 h-4 w-4" />
                      태그 연결
                    </Button>
                  </div>
                  {selected.tags.length === 0 ? (
                    <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                      연결된 태그가 없습니다. 미소속 태그에서 추가하세요.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>태그</TableHead>
                          <TableHead>역할</TableHead>
                          <TableHead className="text-right">위스키 수</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selected.tags.map((tag) => (
                          <TableRow key={tag.tastingTagId}>
                            <TableCell className="font-medium">{tag.korName}</TableCell>
                            <TableCell>
                              <RoleBadge role={tag.role} />
                            </TableCell>
                            <TableCell className="text-right">
                              {tag.alcoholCount.toLocaleString('ko-KR')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">미소속 태그</CardTitle>
                <CardDescription>어느 태그 그룹에도 속하지 않은 테이스팅 태그</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {mockUngroupedTags.map((tag) => (
                  <Badge key={tag.id} variant="outline">
                    {tag.korName}
                    <span className="ml-1 text-muted-foreground">{tag.alcoholCount}</span>
                  </Badge>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
