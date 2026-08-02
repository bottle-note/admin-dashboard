import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Plus } from 'lucide-react';

import { PageHeader } from '@/components/common/PageHeader';
import { Pagination } from '@/components/common/Pagination';
import { Button } from '@/components/ui/button';
import { useCurationList, useCurationSpecs } from '@/hooks/useCurations';
import type { CurationV2SearchParams } from '@/types/api';

import { CurationListFilters } from './components/CurationListFilters';
import { CurationListTable } from './components/CurationListTable';

const DEFAULT_PAGE = 0;
const DEFAULT_PAGE_SIZE = 20;

export function CurationList() {
  const navigate = useNavigate();
  const [urlParams, setUrlParams] = useSearchParams();

  const keyword = urlParams.get('keyword') ?? '';
  const specCode = urlParams.get('code') ?? '';
  const activeStatus = urlParams.get('isActive') ?? '';
  const page = readNonNegativeNumber(urlParams.get('page'), DEFAULT_PAGE);
  const pageSize = readPositiveNumber(urlParams.get('size'), DEFAULT_PAGE_SIZE);
  const [keywordInput, setKeywordInput] = useState(keyword);

  useEffect(() => {
    setKeywordInput(keyword);
  }, [keyword]);

  const searchParams: CurationV2SearchParams = {
    keyword: keyword || undefined,
    code: specCode || undefined,
    isActive: activeStatus === 'true' ? true : activeStatus === 'false' ? false : undefined,
    page,
    size: pageSize,
  };
  const listQuery = useCurationList(searchParams);
  const specsQuery = useCurationSpecs();
  const specs = specsQuery.data ?? [];
  const specNames = Object.fromEntries(specs.map((spec) => [spec.code, spec.name]));

  const updateUrlParams = (updates: Record<string, string | undefined>) => {
    const nextParams = new URLSearchParams(urlParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        nextParams.delete(key);
        return;
      }

      nextParams.set(key, value);
    });

    if (nextParams.get('page') === String(DEFAULT_PAGE)) nextParams.delete('page');
    if (nextParams.get('size') === String(DEFAULT_PAGE_SIZE)) nextParams.delete('size');

    setUrlParams(nextParams);
  };

  const handleSearch = () => {
    updateUrlParams({
      keyword: keywordInput.trim() || undefined,
      page: String(DEFAULT_PAGE),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="큐레이션 관리"
        description="스펙 기반으로 생성된 큐레이션을 조회합니다."
        actions={
          <Button onClick={() => navigate('/dashboard/curations/new')}>
            <Plus className="mr-2 h-4 w-4" />
            큐레이션 작성
          </Button>
        }
      />

      <CurationListFilters
        keyword={keywordInput}
        activeStatus={activeStatus}
        specCode={specCode}
        specs={specs}
        onKeywordChange={setKeywordInput}
        onSearch={handleSearch}
        onActiveStatusChange={(value) =>
          updateUrlParams({
            isActive: value || undefined,
            page: String(DEFAULT_PAGE),
          })
        }
        onSpecCodeChange={(value) =>
          updateUrlParams({
            code: value || undefined,
            page: String(DEFAULT_PAGE),
          })
        }
      />

      <CurationListTable
        items={listQuery.data?.items ?? []}
        specNames={specNames}
        isLoading={listQuery.isLoading}
        isError={listQuery.isError}
        onRetry={() => void listQuery.refetch()}
        onItemClick={(id) => navigate(`/dashboard/curations/${id}`)}
      />

      {listQuery.data && listQuery.data.items.length > 0 && (
        <Pagination
          currentPage={listQuery.data.meta.page}
          totalPages={listQuery.data.meta.totalPages}
          totalElements={listQuery.data.meta.totalElements}
          pageSize={pageSize}
          currentItemCount={listQuery.data.items.length}
          hasNext={listQuery.data.meta.hasNext}
          onPageChange={(nextPage) => updateUrlParams({ page: String(nextPage) })}
          onPageSizeChange={(nextSize) =>
            updateUrlParams({ size: String(nextSize), page: String(DEFAULT_PAGE) })
          }
        />
      )}
    </div>
  );
}

function readNonNegativeNumber(value: string | null, fallback: number) {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue >= 0 ? parsedValue : fallback;
}

function readPositiveNumber(value: string | null, fallback: number) {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}
