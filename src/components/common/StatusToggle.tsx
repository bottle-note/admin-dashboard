/**
 * 활성/비활성 상태 토글 컴포넌트
 * Switch와 Badge를 조합하여 인라인 상태 변경 UI 제공
 */

import { Check, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface StatusToggleProps {
  isActive: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function StatusToggle({ isActive, onToggle, disabled }: StatusToggleProps) {
  return (
    <div
      className="flex items-center gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <Switch
        checked={isActive}
        onCheckedChange={onToggle}
        disabled={disabled}
      />
      {isActive ? (
        <Badge variant="default" className="whitespace-nowrap bg-green-500">
          <Check className="mr-1 h-3 w-3" />
          활성
        </Badge>
      ) : (
        <Badge variant="secondary" className="whitespace-nowrap">
          <X className="mr-1 h-3 w-3" />
          비활성
        </Badge>
      )}
    </div>
  );
}
