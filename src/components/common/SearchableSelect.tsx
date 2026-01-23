/**
 * 검색 가능한 셀렉트 컴포넌트
 * - Popover + Command 조합
 * - 키보드 네비게이션 지원
 * - 검색 필터링 내장
 */

import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/**
 * 셀렉트 옵션 아이템
 * @param value - 옵션 값
 * @param label - 표시 텍스트
 */
export interface SelectOption {
  value: string;
  label: string;
}

/**
 * SearchableSelect 컴포넌트의 props
 * @param value - 현재 선택된 값
 * @param onChange - 값 변경 콜백
 * @param options - 선택 가능한 옵션 목록
 * @param placeholder - 선택 전 표시 텍스트
 * @param searchPlaceholder - 검색 입력창 placeholder
 * @param emptyMessage - 검색 결과 없을 때 메시지
 * @param disabled - 비활성화 여부
 * @param className - 추가 스타일 클래스
 */
export interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = '선택...',
  searchPlaceholder = '검색...',
  emptyMessage = '결과가 없습니다.',
  disabled = false,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'h-9 w-full justify-between font-normal',
            !selectedOption && 'text-muted-foreground',
            className
          )}
        >
          {selectedOption?.label ?? placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === option.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
