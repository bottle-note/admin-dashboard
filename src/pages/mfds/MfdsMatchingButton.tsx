import { ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

/** 상세 카드에서 매칭 작업 창을 여는 버튼. 연결 상태에 따라 색과 호흡 효과 색이 바뀐다. */
export function MfdsMatchingButton({
  connected,
  candidateCount,
  onClick,
}: {
  connected: boolean;
  candidateCount: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label="매칭 관리"
      className={cn(
        'group flex h-10 w-full animate-neon-breathe items-center gap-2.5 rounded-lg px-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:animate-none',
        connected
          ? 'bg-emerald-50 text-emerald-950 [--neon:16_185_129] hover:bg-emerald-100'
          : 'bg-amber-50 text-amber-950 [--neon:245_158_11] hover:bg-amber-100'
      )}
      onClick={onClick}
    >
      <span className="text-sm font-semibold tracking-tight">매칭 관리</span>
      <span
        className={cn(
          'ml-auto flex items-center gap-1 text-xs font-medium',
          connected ? 'text-emerald-700' : 'text-amber-700'
        )}
      >
        {candidateCount ? `후보 ${candidateCount}건` : '위스키 검색'}
        <ChevronRight
          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </button>
  );
}
