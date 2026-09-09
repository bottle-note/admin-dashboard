import { AlcoholSearchSelect } from '@/components/common/AlcoholSearchSelect';

export interface SelectedWhisky {
  alcoholId: number;
  korName: string;
  engName: string;
  imageUrl: string | null;
}

export interface WhiskySearchSelectProps {
  onSelect: (whisky: SelectedWhisky) => void;
  excludeIds?: number[];
  placeholder?: string;
  disabled?: boolean;
}

export function WhiskySearchSelect({
  onSelect,
  excludeIds = [],
  placeholder = '위스키 이름으로 검색...',
  disabled = false,
}: WhiskySearchSelectProps) {
  return (
    <AlcoholSearchSelect
      onSelect={(alcohol) =>
        onSelect({
          alcoholId: alcohol.alcoholId,
          korName: alcohol.korName,
          engName: alcohol.engName,
          imageUrl: alcohol.imageUrl,
        })
      }
      excludeIds={excludeIds}
      placeholder={placeholder}
      ariaLabel="위스키 검색"
      disabled={disabled}
      selectionLabel="위스키"
      dropdownTestId="whisky-search-dropdown"
    />
  );
}
