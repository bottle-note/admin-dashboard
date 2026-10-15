/**
 * 누르면 동작하는 작은 칩. 값 뒤에 수량을 붙일 수 있다.
 * 표시만 하는 칩은 `Badge variant="outline"`을 쓴다.
 */

import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

interface ChipButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  count?: number | string;
}

export function ChipButton({ count, className, children, ...props }: ChipButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-6 shrink-0 items-center rounded-full border px-2 text-[11px] font-medium transition-colors hover:border-primary hover:bg-primary/10 disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
      {count !== undefined && (
        <span className="ml-1 tabular-nums text-muted-foreground">{count}</span>
      )}
    </button>
  );
}
