/**
 * 주소 검색 입력 컴포넌트
 * - 다음(카카오) 우편번호 서비스를 모달에 임베드해 도로명 주소를 자동 입력한다.
 * - 입력창은 readOnly로 직접 타이핑을 막고, 오직 검색으로만 값을 채운다(오타/비표준 주소 방지).
 * - register로 연결(비제어)해 기본값/제출값은 그대로 유지하고, 검색으로 선택한 주소만
 *   onAddressSelect(보통 setValue)로 주입한다.
 */
import { useState } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { KakaoPostcodeEmbed, type Address } from 'react-daum-postcode';
import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

/**
 * AddressSearchInput 컴포넌트의 props
 * @param registration - react-hook-form register(name) 반환값
 * @param onAddressSelect - 검색으로 주소를 선택했을 때 호출 (도로명 주소)
 * @param placeholder - 입력 placeholder
 * @param maxLength - 최대 입력 길이
 * @param aria-label - 접근성 라벨
 * @param disabled - 비활성화 여부
 */
export interface AddressSearchInputProps {
  registration: UseFormRegisterReturn;
  onAddressSelect: (address: string) => void;
  placeholder?: string;
  maxLength?: number;
  'aria-label'?: string;
  disabled?: boolean;
}

export function AddressSearchInput({
  registration,
  onAddressSelect,
  placeholder,
  maxLength,
  'aria-label': ariaLabel,
  disabled,
}: AddressSearchInputProps) {
  const [open, setOpen] = useState(false);

  const handleComplete = (data: Address) => {
    // 도로명 주소 우선, 없으면 지번 주소로 폴백한다.
    onAddressSelect(data.roadAddress || data.address);
    setOpen(false);
  };

  return (
    <div className="flex gap-2">
      <Input
        aria-label={ariaLabel}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        {...registration}
        readOnly
        onClick={disabled ? undefined : () => setOpen(true)}
        className="cursor-pointer"
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" className="shrink-0" disabled={disabled}>
            <Search className="mr-1.5 h-4 w-4" />
            주소 검색
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>주소 검색</DialogTitle>
            <DialogDescription>도로명, 건물명 또는 지번으로 검색하세요.</DialogDescription>
          </DialogHeader>
          <KakaoPostcodeEmbed onComplete={handleComplete} style={{ height: 470 }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
