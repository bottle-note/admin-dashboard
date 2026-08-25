import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';

import { LookupSearchSelect } from '@/components/common/LookupSearchSelect';
import {
  flattenMfdsImporterPages,
  useMfdsImporterDetail,
  useMfdsImporterLookupInfinite,
} from '@/hooks/useMfdsImporters';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { MfdsImporterItem } from '@/types/api';

interface ImporterSearchSelectProps {
  selectedImporterId: number | undefined;
  onSelect: (importer: MfdsImporterItem) => void;
  onClear: () => void;
  placeholder?: string;
}

export function ImporterSearchSelect({
  selectedImporterId,
  onSelect,
  onClear,
  placeholder = '수입사 이름으로 검색...',
}: ImporterSearchSelectProps) {
  const [keywordDraft, setKeywordDraft] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<MfdsImporterItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const selectedImporterQuery = useMfdsImporterDetail(selectedImporterId);
  const selectedImporter =
    selectedOption?.id === selectedImporterId ? selectedOption : selectedImporterQuery.data;
  const keyword = keywordDraft ?? selectedImporter?.businessName ?? '';
  const debouncedKeyword = useDebouncedValue(keyword.trim(), 300);
  const queryKeyword = keywordDraft === null ? undefined : debouncedKeyword || undefined;
  const query = useMfdsImporterLookupInfinite(
    { keyword: queryKeyword, pageSize: 10 },
    { enabled: isOpen }
  );
  const items = useMemo(() => flattenMfdsImporterPages(query.data), [query.data]);

  const handleClear = () => {
    setKeywordDraft(null);
    setSelectedOption(null);
    setIsOpen(false);
    onClear();
  };

  return (
    <LookupSearchSelect
      value={keyword}
      onValueChange={(value) => {
        setKeywordDraft(value);
        setSelectedOption(null);
        if (selectedImporterId !== undefined) onClear();
      }}
      open={isOpen}
      onOpenChange={setIsOpen}
      items={items}
      getItemKey={(item) => item.id}
      getItemAriaLabel={(item) => `${item.businessName} 수입사 선택`}
      renderItem={(item) => (
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{item.businessName}</p>
          <p className="truncate text-sm text-muted-foreground">
            인허가 {item.licenseNo} · 업소 코드 {item.officialBusinessCode}
          </p>
        </div>
      )}
      onSelect={(item) => {
        setSelectedOption(item);
        setKeywordDraft(null);
        onSelect(item);
      }}
      placeholder={placeholder}
      ariaLabel="수입사 이름 검색"
      minimumSearchLength={0}
      leftElement={<Search className="h-4 w-4 text-muted-foreground" />}
      rightElement={
        keyword ? (
          <button
            type="button"
            aria-label="선택한 수입사 지우기"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        ) : undefined
      }
      isLoading={query.isLoading}
      isError={query.isError}
      onRetry={() => query.refetch()}
      isFetchingNextPage={query.isFetchingNextPage}
      hasNextPage={query.hasNextPage}
      onLoadMore={query.fetchNextPage}
    />
  );
}
