import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { isNonComposingEnterKey } from '@/lib/keyboard';
import type { CurationV2SpecListItem } from '@/types/api';

const ALL_VALUE = 'ALL';

const ACTIVE_STATUS_OPTIONS = [
  { value: ALL_VALUE, label: '전체' },
  { value: 'true', label: '활성' },
  { value: 'false', label: '비활성' },
];

interface CurationListFiltersProps {
  keyword: string;
  activeStatus: string;
  specCode: string;
  specs: CurationV2SpecListItem[];
  onKeywordChange: (value: string) => void;
  onActiveStatusChange: (value: string) => void;
  onSpecCodeChange: (value: string) => void;
  onSearch: () => void;
}

export function CurationListFilters({
  keyword,
  activeStatus,
  specCode,
  specs,
  onKeywordChange,
  onActiveStatusChange,
  onSpecCodeChange,
  onSearch,
}: CurationListFiltersProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(10rem,0.3fr)_minmax(12rem,0.45fr)_auto]">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={keyword}
          placeholder="큐레이션명으로 검색..."
          className="pl-9"
          onChange={(event) => onKeywordChange(event.target.value)}
          onKeyDown={(event) => {
            if (isNonComposingEnterKey(event)) onSearch();
          }}
        />
      </div>

      <Select
        value={activeStatus || ALL_VALUE}
        onValueChange={(value) => onActiveStatusChange(value === ALL_VALUE ? '' : value)}
      >
        <SelectTrigger aria-label="상태">
          <SelectValue placeholder="상태" />
        </SelectTrigger>
        <SelectContent>
          {ACTIVE_STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={specCode || ALL_VALUE}
        onValueChange={(value) => onSpecCodeChange(value === ALL_VALUE ? '' : value)}
      >
        <SelectTrigger aria-label="스펙">
          <SelectValue placeholder="스펙" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>스펙 전체</SelectItem>
          {specs.map((spec) => (
            <SelectItem key={spec.code} value={spec.code}>
              {spec.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button onClick={onSearch}>검색</Button>
    </div>
  );
}
