import { useMemo, useState } from 'react';
import { useAlcoholAttributes, useAttributedAlcohols } from '@/hooks/useAlcoholAttributes';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { getErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AttributeRelationshipGraph } from './AttributeRelationshipGraph';
import type { Attribute } from './attribute-model';

export function AttributeGraphPanel() {
  const [filters, setFilters] = useState({ keyword: '', key: '', value: '' });
  const [page, setPage] = useState(0);
  const [optionSearch, setOptionSearch] = useState('');
  const [optionPage, setOptionPage] = useState(0);
  const [selectedDefinition, setSelectedDefinition] = useState<Attribute | null>(null);
  const keyword = useDebouncedValue(filters.keyword, 200);
  const value = useDebouncedValue(filters.value, 200);
  const definitions = useAlcoholAttributes({
    keyword: optionSearch || undefined,
    page: optionPage,
    size: 20,
  });
  const query = useAttributedAlcohols({
    keyword: keyword || undefined,
    key: filters.key || undefined,
    value: value || undefined,
    page,
    size: 100,
  });
  const { alcohols, attributes, mappings } = useMemo(() => {
    const alcohols = (query.data?.items ?? []).map((item) => ({
      id: item.alcoholId,
      name: item.korName,
      english: item.engName ?? '',
      category: item.korCategory ?? '',
      region: '',
      imageUrl: item.imageUrl,
    }));
    const entries = (query.data?.items ?? []).flatMap((item) =>
      item.attributes.map((entry) => ({ ...entry, alcoholId: item.alcoholId }))
    );
    const attributes = [
      ...new Map(
        [
          ...(selectedDefinition ? [selectedDefinition] : []),
          ...(definitions.data?.items ?? []),
          ...entries.map((entry) => entry.attribute),
        ].map((item) => [
          item.id,
          { ...item, unit: item.unit ?? '', description: item.description ?? '' },
        ])
      ).values(),
    ];
    const mappings = entries.map((entry) => ({
      id: entry.mappingId,
      alcoholId: entry.alcoholId,
      attributeId: entry.attribute.id,
      value: entry.value,
    }));
    return { alcohols, attributes, mappings };
  }, [query.data, definitions.data, selectedDefinition]);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 rounded border bg-white p-2">
        <Input
          aria-label="그래프 속성 선택지 검색"
          placeholder="속성 선택지 검색"
          value={optionSearch}
          className="h-8 max-w-xs"
          onChange={(event) => {
            setOptionSearch(event.target.value);
            setOptionPage(0);
          }}
        />
        <Button
          size="sm"
          variant="outline"
          disabled={optionPage === 0}
          onClick={() => setOptionPage((p) => p - 1)}
        >
          속성 이전
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!definitions.data?.meta.hasNext}
          onClick={() => setOptionPage((p) => p + 1)}
        >
          속성 다음
        </Button>
        {definitions.error && (
          <span role="alert">
            속성 선택지 조회 실패{' '}
            <Button size="sm" variant="ghost" onClick={() => void definitions.refetch()}>
              다시 조회
            </Button>
          </span>
        )}
      </div>
      {query.error && (
        <div role="alert">
          {getErrorMessage(query.error)}{' '}
          <Button variant="outline" onClick={() => void query.refetch()}>
            그래프 다시 조회
          </Button>
        </div>
      )}
      <AttributeRelationshipGraph
        attributes={attributes}
        alcohols={alcohols}
        mappings={mappings}
        serverFilter={{
          ...filters,
          total: query.data?.meta.totalElements,
          loading: query.isFetching,
          onChange: (next) => {
            setFilters(next);
            setPage(0);
            setSelectedDefinition(attributes.find((item) => item.key === next.key) ?? null);
          },
        }}
      />
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page === 0 || query.isFetching}
          onClick={() => setPage((p) => p - 1)}
        >
          그래프 이전
        </Button>
        <span>{page + 1}페이지 · 서버 검색 결과를 위스키 100개씩 조회합니다.</span>
        <Button
          size="sm"
          variant="outline"
          disabled={!query.data?.meta.hasNext || query.isFetching}
          onClick={() => setPage((p) => p + 1)}
        >
          그래프 다음
        </Button>
      </div>
    </div>
  );
}
